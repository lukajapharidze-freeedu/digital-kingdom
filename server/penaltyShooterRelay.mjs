/**
 * Penalty Shooter — ლოკალური ქსელის (LAN) რელე ორი მოთამაშისთვის.
 *
 * მასპინძელი ქმნის ოთახს და იღებს 4-ნიშნა კოდს, სტუმარი ამ კოდს წერს თავის კომპიუტერზე.
 * მატჩს მასპინძლის ბრაუზერი მართავს (კითხვები, დრო, შედეგები); რელე უბრალოდ
 * შეტყობინებებს გადასცემს ერთიდან მეორეს. WebSocket-ის კოდი Typing Champion-ის რელესგან მოდის.
 */
import { hostname } from 'node:os'
import { acceptSocket, lanUrls } from './typingChampionRelay.mjs'
import { LAN_NAME, lanNameActive } from './lanName.mjs'

const WS_PATH = '/penalty-shooter-ws'

/** @type {Map<string, { code: string, host: any, guest: any | null }>} */
const rooms = new Map()

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

function handleConnection(conn, port) {
  let room = null
  let role = null // 'host' | 'guest'

  // pcName — სახელი, რომელსაც სტუმარი პორტ 80-ზე ბრაუზერში წერს:
  // digitalkingdom.local, თუ ცხადდება, თორემ კომპიუტერის სახელი (მაგ. itroom)
  const pcName = lanNameActive() ? LAN_NAME : hostname().toLowerCase()
  conn.send({ t: 'hello', lanUrls: lanUrls(port), pcName })

  conn.onMessage = (text) => {
    let msg
    try {
      msg = JSON.parse(text)
    } catch {
      return
    }
    if (!msg || typeof msg !== 'object') return

    if (msg.t === 'host' && !room) {
      room = { code: makeCode(), host: conn, guest: null }
      role = 'host'
      rooms.set(room.code, room)
      conn.send({ t: 'joined', role, code: room.code })
      return
    }

    if (msg.t === 'join' && !room) {
      const target = rooms.get(String(msg.code ?? '').trim())
      if (!target) return conn.send({ t: 'error', msg: 'ასეთი ოთახი ვერ მოიძებნა. შეამოწმე კოდი.' })
      if (target.guest) return conn.send({ t: 'error', msg: 'ამ ოთახში უკვე ორი მოთამაშეა.' })
      target.guest = conn
      room = target
      role = 'guest'
      conn.send({ t: 'joined', role, code: room.code })
      room.host.send({ t: 'guest', name: cleanName(msg.name) })
      return
    }

    // დანარჩენი შეტყობინებები მეორე მოთამაშეს გადაეცემა
    if (msg.t === 'msg' && room) {
      const other = role === 'host' ? room.guest : room.host
      other?.send({ t: 'msg', data: msg.data })
    }
  }

  conn.onClose = () => {
    if (!room) return
    if (role === 'host') {
      room.guest?.send({ t: 'left' })
      room.guest?.close()
      rooms.delete(room.code)
    } else if (room.guest === conn) {
      room.guest = null
      room.host.send({ t: 'left' })
    }
    room = null
  }
}

function attach(httpServer) {
  if (!httpServer) return
  const getPort = () => httpServer.address()?.port ?? 5173
  httpServer.on('upgrade', (req, socket) => {
    const path = (req.url ?? '').split('?')[0]
    if (path !== WS_PATH) return
    acceptSocket(req, socket, (conn) => handleConnection(conn, getPort()))
  })
}

/** Vite-ის პლაგინი: რელე ირთვება `npm run dev`, `npm run lan` და `vite preview`-ის დროს */
export function penaltyShooterRelay() {
  return {
    name: 'penalty-shooter-relay',
    configureServer(server) {
      attach(server.httpServer)
    },
    configurePreviewServer(server) {
      attach(server.httpServer)
    },
  }
}
