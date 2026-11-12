/**
 * მოკლე სახელი კლასისთვის: digitalkingdom.local
 *
 * როცა თამაში `npm run lan`-ით მუშაობს, ეს პატარა mDNS-პასუხისმგებელი ქსელში აცხადებს, რომ
 * digitalkingdom.local = ამ კომპიუტერის IP (ისე, როგორც პრინტერები აცხადებენ თავს).
 * Windows 10/11 .local სახელებს ასე თვითონ პოულობს — მოსწავლის კომპიუტერზე არაფერი ყენდება,
 * და ამ კომპიუტერის სისტემური პარამეტრებიც არ იცვლება. დამატებითი npm პაკეტი არ სჭირდება.
 *
 * თუ რამე არ გამოვიდა (მაგ. პორტი 5353 დაკავებულია), თამაში ჩვეულებრივ მუშაობს — უბრალოდ
 * სახელი არ იმუშავებს და სტუმარი IP-ს ან კომპიუტერის სახელს გამოიყენებს.
 */
import dgram from 'node:dgram'
import { networkInterfaces } from 'node:os'

export const LAN_NAME = 'digitalkingdom.local'

const MDNS_GROUP = '224.0.0.251'
const MDNS_PORT = 5353
const TYPE_A = 1
const TYPE_ANY = 255

let started = false
let announcing = false

/** ამ წუთას ქსელში ცხადდება თუ არა სახელი */
export function lanNameActive() {
  return announcing
}

function ipv4Interfaces() {
  const list = []
  for (const addrs of Object.values(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) list.push(addr)
    }
  }
  return list
}

function ipToInt(ip) {
  return ip.split('.').reduce((n, part) => ((n << 8) | (Number(part) & 255)) >>> 0, 0)
}

/** რომელი IP ვუპასუხოთ: იმავე ქსელიდან, საიდანაც კითხვა მოვიდა (მაგ. VirtualBox-ის ადაპტერი არ გვინდა) */
function addressesFor(sourceIp) {
  const all = ipv4Interfaces()
  if (sourceIp) {
    const src = ipToInt(sourceIp)
    const same = all.filter(a => ((ipToInt(a.address) ^ src) & ipToInt(a.netmask)) === 0)
    if (same.length > 0) return same.map(a => a.address)
  }
  return all.map(a => a.address)
}

/** DNS სახელის წაკითხვა (შეკუმშვის მაჩვენებლებით) */
function readName(buf, offset) {
  const labels = []
  let jumped = false
  let next = offset
  for (let guard = 0; guard < 64; guard++) {
    if (offset >= buf.length) return null
    const len = buf[offset]
    if (len === 0) {
      if (!jumped) next = offset + 1
      return { name: labels.join('.').toLowerCase(), next }
    }
    if ((len & 0xc0) === 0xc0) {
      if (offset + 1 >= buf.length) return null
      if (!jumped) next = offset + 2
      offset = ((len & 0x3f) << 8) | buf[offset + 1]
      jumped = true
      continue
    }
    if (offset + 1 + len > buf.length) return null
    labels.push(buf.toString('latin1', offset + 1, offset + 1 + len))
    offset += 1 + len
  }
  return null
}

function encodeName(name) {
  const parts = name.split('.').map(label => {
    const bytes = Buffer.from(label, 'latin1')
    return Buffer.concat([Buffer.from([bytes.length]), bytes])
  })
  return Buffer.concat([...parts, Buffer.from([0])])
}

/** პასუხის პაკეტი: A ჩანაწერები LAN_NAME-ისთვის */
function buildResponse({ id, legacy, addresses }) {
  const name = encodeName(LAN_NAME)
  const header = Buffer.alloc(12)
  header.writeUInt16BE(legacy ? id : 0, 0)
  header.writeUInt16BE(0x8400, 2) // პასუხი, ავტორიტეტული
  header.writeUInt16BE(legacy ? 1 : 0, 4)
  header.writeUInt16BE(addresses.length, 6)

  const parts = [header]
  if (legacy) {
    // ძველი სტილის (ჩვეულებრივი DNS) კითხვაზე კითხვაც უნდა გავიმეოროთ
    const question = Buffer.alloc(4)
    question.writeUInt16BE(TYPE_A, 0)
    question.writeUInt16BE(1, 2)
    parts.push(name, question)
  }
  for (const ip of addresses) {
    const rr = Buffer.alloc(14)
    rr.writeUInt16BE(TYPE_A, 0)
    rr.writeUInt16BE(legacy ? 0x0001 : 0x8001, 2) // IN (+ cache-flush mDNS-ში)
    rr.writeUInt32BE(legacy ? 10 : 120, 4) // TTL
    rr.writeUInt16BE(4, 8)
    ip.split('.').forEach((part, i) => rr.writeUInt8(Number(part) & 255, 10 + i))
    parts.push(name, rr)
  }
  return Buffer.concat(parts)
}

function handleQuery(socket, msg, rinfo) {
  if (msg.length < 12) return
  const flags = msg.readUInt16BE(2)
  if (flags & 0x8000) return // ეს პასუხია, არა კითხვა
  const id = msg.readUInt16BE(0)
  const qdcount = msg.readUInt16BE(4)

  let offset = 12
  let asked = false
  let unicast = false
  for (let i = 0; i < qdcount && i < 32; i++) {
    const read = readName(msg, offset)
    if (!read || read.next + 4 > msg.length) return
    const type = msg.readUInt16BE(read.next)
    const qclass = msg.readUInt16BE(read.next + 2)
    offset = read.next + 4
    if (read.name === LAN_NAME && (type === TYPE_A || type === TYPE_ANY)) {
      asked = true
      if (qclass & 0x8000) unicast = true // QU — პასუხი პირდაპირ კითხვის ავტორს
    }
  }
  if (!asked) return

  const addresses = addressesFor(rinfo.address)
  if (addresses.length === 0) return
  const legacy = rinfo.port !== MDNS_PORT
  const packet = buildResponse({ id, legacy, addresses })
  if (legacy || unicast) socket.send(packet, rinfo.port, rinfo.address)
  else socket.send(packet, MDNS_PORT, MDNS_GROUP)
}

function start(log) {
  if (started) return
  started = true

  const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
  socket.on('error', error => {
    announcing = false
    log(`⚠ ${LAN_NAME} ვერ ჩაირთო (${error.code ?? error.message}). სტუმრები IP-ით შევლენ.`)
    try {
      socket.close()
    } catch {
      /* უკვე დახურულია */
    }
  })
  socket.on('message', (msg, rinfo) => {
    try {
      handleQuery(socket, msg, rinfo)
    } catch {
      /* დაზიანებული პაკეტი — უბრალოდ ვტოვებთ */
    }
  })
  socket.bind(MDNS_PORT, () => {
    for (const addr of ipv4Interfaces()) {
      try {
        socket.addMembership(MDNS_GROUP, addr.address)
      } catch {
        /* ეს ადაპტერი multicast-ს არ უჭერს მხარს */
      }
    }
    socket.setMulticastTTL(255)
    announcing = true
    // გაშვებისას თავს ვაცხადებთ, რომ სხვა კომპიუტერებმა ძველი ჩანაწერი განაახლონ
    const hello = buildResponse({ id: 0, legacy: false, addresses: addressesFor(null) })
    socket.send(hello, MDNS_PORT, MDNS_GROUP)
    setTimeout(() => announcing && socket.send(hello, MDNS_PORT, MDNS_GROUP), 1000).unref?.()
    log(`🌐 მოსწავლეები შევლენ: http://${LAN_NAME}/`)
  })
  socket.unref()
}

/** Vite-ის პლაგინი: სახელი ცხადდება მხოლოდ მაშინ, როცა სერვერი ქსელისთვისაა გახსნილი (--host) */
export function lanNamePlugin() {
  return {
    name: 'digital-kingdom-lan-name',
    configureServer(server) {
      const host = server.config.server.host
      if (host === undefined || host === 'localhost' || host === '127.0.0.1') return
      const log = message => server.config.logger.info(message)
      const http = server.httpServer
      if (!http) return
      // Vite-ის გადატვირთვისას სერვერი შეიძლება უკვე უსმენდეს
      if (http.listening) start(log)
      else http.once('listening', () => start(log))
    },
  }
}
