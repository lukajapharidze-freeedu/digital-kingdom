/**
 * Typing Champion — ლოკალური ქსელის (LAN) სერვერი.
 *
 * ბრაუზერებს ერთმანეთთან პირდაპირ ლაპარაკი არ შეუძლიათ, ამიტომ მასპინძელი კომპიუტერი
 * Vite-ის სერვერთან ერთად ამ პატარა WebSocket-რელეს უშვებს (მისამართი: /typing-champion-ws).
 * დამატებითი npm პაკეტი არ სჭირდება — WebSocket-ის მარტივი ვერსია აქვეა დაწერილი.
 *
 * ოთახი: 4-ნიშნა კოდი, მაქსიმუმ 4 მოთამაშე. სერვერი ინახავს ოთახის მდგომარეობას,
 * ითვლის ფინიშის რიგს და ქულებს, და ყველას უგზავნის ცვლილებებს.
 *
 * ქულა ეტაპზე = გავლილი საფეხურები (დაბეჭდილი სიტყვები) + ფინიშის ბონუსი (5 / 3 / 2 / 1).
 * პირველი ფინიშის შემდეგ დანარჩენებს 10 წამი აქვთ.
 */
import { createHash } from 'node:crypto'
import { networkInterfaces } from 'node:os'

const WS_PATH = '/typing-champion-ws'
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
const MAX_PLAYERS = 4
const COUNTDOWN_MS = 3500
/** პირველი ფინიშის შემდეგ დანარჩენებს ამდენი დრო აქვთ */
const LATE_FINISH_MS = 10000
/** ეტაპის შედეგების ჩვენების დრო შემდეგ ეტაპამდე */
const RESULTS_MS = 6000
/** ფინიშის ბონუსი ადგილის მიხედვით */
const FINISH_BONUS = [5, 3, 2, 1]

/** @type {Map<string, Room>} */
const rooms = new Map()
let nextPlayerId = 1

// ---------------------------------------------------------------- WebSocket

function acceptSocket(req, socket, onOpen) {
  const key = req.headers['sec-websocket-key']
  if (!key) {
    socket.destroy()
    return
  }
  const accept = createHash('sha1').update(key + WS_GUID).digest('base64')
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  )
  socket.setNoDelay(true)

  const conn = {
    open: true,
    onMessage: (_text) => {},
    onClose: () => {},
    send(obj) {
      if (!this.open) return
      socket.write(encodeFrame(0x1, Buffer.from(JSON.stringify(obj))))
    },
    close() {
      if (!this.open) return
      this.open = false
      try {
        socket.end(encodeFrame(0x8, Buffer.alloc(0)))
      } catch {
        /* უკვე დახურულია */
      }
      this.onClose()
    },
  }

  let buffer = Buffer.alloc(0)
  let fragments = []
  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk])
    for (;;) {
      const frame = decodeFrame(buffer)
      if (!frame) break
      buffer = buffer.subarray(frame.length)
      if (frame.opcode === 0x8) {
        conn.close()
        return
      }
      if (frame.opcode === 0x9) {
        socket.write(encodeFrame(0xa, frame.payload))
        continue
      }
      if (frame.opcode === 0x1 || frame.opcode === 0x0) {
        fragments.push(frame.payload)
        if (frame.fin) {
          const text = Buffer.concat(fragments).toString('utf8')
          fragments = []
          conn.onMessage(text)
        }
      }
    }
    // ძალიან დიდი შეტყობინება — სავარაუდოდ რაღაც არასწორია
    if (buffer.length > 1 << 20) conn.close()
  })
  socket.on('close', () => {
    if (conn.open) {
      conn.open = false
      conn.onClose()
    }
  })
  socket.on('error', () => socket.destroy())

  onOpen(conn)
}

function decodeFrame(buf) {
  if (buf.length < 2) return null
  const fin = (buf[0] & 0x80) !== 0
  const opcode = buf[0] & 0x0f
  const masked = (buf[1] & 0x80) !== 0
  let len = buf[1] & 0x7f
  let offset = 2
  if (len === 126) {
    if (buf.length < 4) return null
    len = buf.readUInt16BE(2)
    offset = 4
  } else if (len === 127) {
    if (buf.length < 10) return null
    len = Number(buf.readBigUInt64BE(2))
    offset = 10
  }
  const maskOffset = offset
  if (masked) offset += 4
  if (buf.length < offset + len) return null
  const payload = Buffer.from(buf.subarray(offset, offset + len))
  if (masked) {
    for (let i = 0; i < payload.length; i++) payload[i] ^= buf[maskOffset + (i & 3)]
  }
  return { fin, opcode, payload, length: offset + len }
}

function encodeFrame(opcode, payload) {
  const len = payload.length
  let header
  if (len < 126) {
    header = Buffer.from([0x80 | opcode, len])
  } else if (len < 65536) {
    header = Buffer.alloc(4)
    header[0] = 0x80 | opcode
    header[1] = 126
    header.writeUInt16BE(len, 2)
  } else {
    header = Buffer.alloc(10)
    header[0] = 0x80 | opcode
    header[1] = 127
    header.writeBigUInt64BE(BigInt(len), 2)
  }
  return Buffer.concat([header, payload])
}

// ---------------------------------------------------------------- ოთახები

/**
 * @typedef {{ id: number, name: string, lane: number, conn: any, chars: number,
 *   finishMs: number | null, place: number | null, points: number, stageSteps: number, stageBonus: number,
 *   left: boolean }} Player
 * @typedef {{ code: string, hostId: number, players: Player[], phase: 'lobby' | 'countdown' | 'race' | 'results' | 'final',
 *   stages: string[], stage: number, startAt: number, finishCount: number, timers: any[] }} Room
 */

function makeCode() {
  for (let i = 0; i < 1000; i++) {
    const code = String(1000 + Math.floor(Math.random() * 9000))
    if (!rooms.has(code)) return code
  }
  return String(Date.now() % 10000).padStart(4, '0')
}

function cleanName(raw) {
  const name = String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 14)
  return name || 'მოთამაშე'
}

function publicPlayers(room) {
  return room.players.map((p) => ({
    id: p.id,
    name: p.name,
    lane: p.lane,
    chars: p.chars,
    finishMs: p.finishMs,
    place: p.place,
    points: p.points,
    stageSteps: p.stageSteps,
    stageBonus: p.stageBonus,
    left: p.left,
  }))
}

function broadcast(room, msg) {
  for (const p of room.players) if (!p.left) p.conn.send(msg)
}

function sendRoom(room) {
  broadcast(room, {
    t: 'room',
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    stage: room.stage,
    stageCount: room.stages.length,
    players: publicPlayers(room),
  })
}

function clearTimers(room) {
  for (const t of room.timers) clearTimeout(t)
  room.timers = []
}

function activePlayers(room) {
  return room.players.filter((p) => !p.left)
}

function startStage(room, index) {
  clearTimers(room)
  room.stage = index
  room.phase = 'countdown'
  room.finishCount = 0
  room.startAt = Date.now() + COUNTDOWN_MS
  for (const p of room.players) {
    p.chars = 0
    p.finishMs = null
    p.place = null
    p.stageSteps = 0
    p.stageBonus = 0
  }
  // ჯერ ტექსტი, მერე ოთახის მდგომარეობა — კლიენტი რბოლის ეკრანს ტექსტით აწყობს
  broadcast(room, {
    t: 'stage',
    stage: index,
    stageCount: room.stages.length,
    text: room.stages[index],
    // დრო ფარდობითია, რომ სხვადასხვა კომპიუტერის საათს არ ჰქონდეს მნიშვნელობა
    startsIn: COUNTDOWN_MS,
  })
  sendRoom(room)
  room.timers.push(
    setTimeout(() => {
      room.phase = 'race'
      sendRoom(room)
    }, COUNTDOWN_MS)
  )
}

/** რამდენი სიტყვა აქვს მთლიანად დაბეჭდილი */
function completedWords(text, chars) {
  let offset = 0
  let count = 0
  for (const word of text.split(' ')) {
    if (chars >= offset + word.length) count++
    offset += word.length + 1
  }
  return count
}

function endStage(room) {
  if (room.phase !== 'race' && room.phase !== 'countdown') return
  clearTimers(room)
  const text = room.stages[room.stage]
  for (const p of activePlayers(room)) {
    p.stageSteps = completedWords(text, p.place !== null ? text.length : p.chars)
    p.stageBonus = p.place !== null ? FINISH_BONUS[p.place - 1] ?? 1 : 0
    p.points += p.stageSteps + p.stageBonus
  }
  const last = room.stage >= room.stages.length - 1
  room.phase = last ? 'final' : 'results'
  sendRoom(room)
  if (!last) {
    room.timers.push(setTimeout(() => startStage(room, room.stage + 1), RESULTS_MS))
  }
}

function checkStageDone(room) {
  if (room.phase !== 'race') return
  const active = activePlayers(room)
  if (active.length > 0 && active.every((p) => p.place !== null)) endStage(room)
}

function onProgress(room, player, chars) {
  if (room.phase !== 'race' || player.place !== null) return
  const total = room.stages[room.stage].length
  player.chars = Math.max(0, Math.min(total, Math.floor(Number(chars) || 0)))
  if (player.chars >= total) {
    room.finishCount++
    player.place = room.finishCount
    player.finishMs = Date.now() - room.startAt
    if (room.finishCount === 1) {
      // ნელ მოთამაშეს უსასრულოდ არ ველოდებით
      room.timers.push(setTimeout(() => endStage(room), LATE_FINISH_MS))
      broadcast(room, { t: 'hurry', seconds: LATE_FINISH_MS / 1000 })
    }
    sendRoom(room)
    checkStageDone(room)
  } else {
    broadcast(room, { t: 'progress', id: player.id, chars: player.chars })
  }
}

function removePlayer(room, player) {
  if (room.phase === 'lobby' || room.phase === 'final') {
    room.players = room.players.filter((p) => p !== player)
  } else {
    // რბოლის დროს ზოლი ცარიელი რჩება, რომ სხვები არ გადაადგილდნენ
    player.left = true
  }
  const active = activePlayers(room)
  if (active.length === 0) {
    clearTimers(room)
    rooms.delete(room.code)
    return
  }
  if (room.hostId === player.id) room.hostId = active[0].id
  sendRoom(room)
  checkStageDone(room)
}

function freeLane(room) {
  for (let lane = 0; lane < MAX_PLAYERS; lane++) {
    if (!room.players.some((p) => p.lane === lane)) return lane
  }
  return -1
}

function lanUrls(port) {
  const urls = []
  for (const list of Object.values(networkInterfaces())) {
    for (const addr of list ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) urls.push(`http://${addr.address}:${port}/`)
    }
  }
  return urls
}

function handleConnection(conn, port) {
  /** @type {Room | null} */
  let room = null
  /** @type {Player | null} */
  let player = null

  conn.send({ t: 'hello', lanUrls: lanUrls(port) })

  const joinRoom = (target, name) => {
    player = {
      id: nextPlayerId++,
      name: cleanName(name),
      lane: freeLane(target),
      conn,
      chars: 0,
      finishMs: null,
      place: null,
      points: 0,
      stageSteps: 0,
      stageBonus: 0,
      left: false,
    }
    target.players.push(player)
    room = target
    conn.send({ t: 'joined', code: target.code, id: player.id })
    sendRoom(target)
  }

  conn.onMessage = (text) => {
    let msg
    try {
      msg = JSON.parse(text)
    } catch {
      return
    }
    if (!msg || typeof msg !== 'object') return

    if (msg.t === 'host' && !room) {
      const code = makeCode()
      const created = {
        code,
        hostId: nextPlayerId,
        players: [],
        phase: 'lobby',
        stages: [],
        stage: 0,
        startAt: 0,
        finishCount: 0,
        timers: [],
      }
      rooms.set(code, created)
      joinRoom(created, msg.name)
      return
    }

    if (msg.t === 'join' && !room) {
      const target = rooms.get(String(msg.code ?? '').trim())
      if (!target) return conn.send({ t: 'error', msg: 'ასეთი ოთახი ვერ მოიძებნა. შეამოწმე კოდი.' })
      if (target.phase !== 'lobby') return conn.send({ t: 'error', msg: 'ამ ოთახში რბოლა უკვე დაიწყო.' })
      if (target.players.length >= MAX_PLAYERS) return conn.send({ t: 'error', msg: 'ოთახი სავსეა (მაქსიმუმ 4 მოთამაშე).' })
      joinRoom(target, msg.name)
      return
    }

    if (!room || !player) return

    if (msg.t === 'start' && player.id === room.hostId && room.phase === 'lobby') {
      const stages = Array.isArray(msg.stages) ? msg.stages.map((s) => String(s).slice(0, 600)).slice(0, 8) : []
      if (stages.length === 0 || stages.some((s) => s.length === 0)) return
      room.stages = stages
      for (const p of room.players) p.points = 0
      startStage(room, 0)
      return
    }

    if (msg.t === 'progress') {
      onProgress(room, player, msg.chars)
      return
    }

    // ფინალის შემდეგ მასპინძელი ყველას ლობიში აბრუნებს
    if (msg.t === 'lobby' && player.id === room.hostId && room.phase === 'final') {
      clearTimers(room)
      room.players = room.players.filter((p) => !p.left)
      room.phase = 'lobby'
      room.stage = 0
      for (const p of room.players) {
        p.chars = 0
        p.finishMs = null
        p.place = null
        p.points = 0
        p.stageSteps = 0
        p.stageBonus = 0
      }
      sendRoom(room)
    }
  }

  conn.onClose = () => {
    if (room && player) removePlayer(room, player)
    room = null
    player = null
  }
}

function attach(httpServer) {
  if (!httpServer) return
  // Vite დაკავებული პორტის შემთხვევაში შემდეგს იღებს, ამიტომ რეალურ პორტს ვკითხულობთ
  const getPort = () => httpServer.address()?.port ?? 5173
  httpServer.on('upgrade', (req, socket) => {
    const path = (req.url ?? '').split('?')[0]
    if (path !== WS_PATH) return // დანარჩენს (მაგ. Vite HMR) არ ვეხებით
    acceptSocket(req, socket, (conn) => handleConnection(conn, getPort()))
  })
}

/** Vite-ის პლაგინი: რელე ირთვება `npm run dev`, `npm run lan` და `vite preview`-ის დროს */
export function typingChampionRelay() {
  return {
    name: 'typing-champion-relay',
    configureServer(server) {
      attach(server.httpServer)
    },
    configurePreviewServer(server) {
      attach(server.httpServer)
    },
  }
}
