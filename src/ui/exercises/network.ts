import type { SimTask } from '../../content/topics'
import { btn, css, el, shake, taskRunner, EMOJI_FONT, type ExerciseCtx } from './dom'

/**
 * ქსელის სიმულატორები:
 *  networkSim — ქვიშის ყუთი: მოწყობილობები, სადენები, Wi-Fi; ჩანს, ვის აქვს ინტერნეტი;
 *  routesSim  — „რატომ ქსელი?“: გზების გაწყვეტა და შეტყობინების სხვა გზით გაგზავნა;
 *  packetsSim — სურათი სერვერიდან პატარა ნაწილებად მოდის.
 *
 * networkSim-ის დავალებების პირობები (event):
 *  cable:a-b, nocable:a-b, wifi:id, online:id, offline:id, reach:a-b, count:n (ქსელშია ≥ n მოწყობილობა), all, count0
 */

css(
  'network',
  `
.nw { position: relative; height: var(--ex-h, 340px); border-radius: 14px; overflow: hidden; border: 3px solid #26364a; background: linear-gradient(180deg, #eaf4ff, #f8fbff); font-size: 12px; font-family: Arial, ${EMOJI_FONT}; user-select: none; }
.nw svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.nw-line { stroke: #26364a; stroke-width: 4; vector-effect: non-scaling-stroke; stroke-linecap: round; }
.nw-line.live { stroke: #2f9e5b; }
.nw-line.wifi { stroke-dasharray: 3 7; stroke-width: 3; stroke: #8a9bb0; }
.nw-line.wifi.live { stroke: #3d86c6; }
.nw-line.cut { stroke: #d6dde5; stroke-dasharray: 6 8; }
.nw-line.path { stroke: #f0a51c; stroke-width: 7; }
.nw-hit { stroke: transparent; stroke-width: 22; vector-effect: non-scaling-stroke; cursor: pointer; }
.nw-dev { position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 1px; width: 92px; }
.nw-devbtn { width: 52px; height: 44px; border-radius: 13px; border: 3px solid #9dbfe0; background: #fff; font-size: 24px; line-height: 1; cursor: pointer; padding: 0; box-shadow: 0 3px 0 rgba(38,54,74,0.15); font-family: ${EMOJI_FONT}; }
.nw-devbtn:hover { border-color: #3d86c6; }
.nw-dev.sel .nw-devbtn { border-color: #f0a51c; background: #fff3cf; box-shadow: 0 0 0 4px rgba(240,165,28,0.3); }
.nw-name { font-weight: 800; color: #26364a; text-align: center; line-height: 1.2; }
.nw-badge { padding: 1px 6px; border-radius: 999px; font-size: 10.5px; font-weight: 800; white-space: nowrap; }
.nw-badge.on { background: #dff5e7; color: #1f7a45; }
.nw-badge.off { background: #fde4e4; color: #a43d3d; }
.nw-wifi { border: 2px solid #9dbfe0; border-radius: 999px; background: #fff; font: inherit; font-size: 10.5px; font-weight: 800; padding: 1px 7px; cursor: pointer; white-space: nowrap; }
.nw-wifi.on { border-color: #3d86c6; background: #dcecff; color: #17406f; }
.nw-tip { position: absolute; left: 8px; bottom: 6px; right: 8px; text-align: center; font-size: 11px; font-weight: 700; color: #536579; pointer-events: none; }
.nw-send { position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); border: 0; border-radius: 12px; padding: 8px 18px; background: #27834a; color: #fff; font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 0 rgba(0,0,0,0.15); }
.nw-send:disabled { background: #a9b4c0; cursor: default; }
.nw-node { position: absolute; transform: translate(-50%, -50%); width: 46px; height: 46px; border-radius: 50%; border: 3px solid #9dbfe0; background: #fff; font-size: 22px; display: flex; align-items: center; justify-content: center; }
.nw-node.end { width: 62px; height: 62px; font-size: 30px; border-color: #315b88; }
.nw-node.hot { border-color: #f0a51c; background: #fff3cf; }
.nw-label { position: absolute; transform: translate(-50%, 0); font-weight: 800; color: #26364a; white-space: nowrap; }
.nw-cutmark { position: absolute; transform: translate(-50%, -50%); font-size: 18px; pointer-events: none; }

.pk { position: relative; height: min(var(--ex-h, 300px), 300px); border-radius: 14px; overflow: hidden; border: 3px solid #26364a; background: linear-gradient(180deg, #eaf4ff, #f8fbff); font-size: 12px; font-family: Arial, ${EMOJI_FONT}; user-select: none; }
.pk-side { position: absolute; top: 14px; width: 150px; display: flex; flex-direction: column; align-items: center; gap: 6px; font-weight: 800; color: #26364a; text-align: center; }
.pk-me { left: 22px; }
.pk-server { right: 22px; }
.pk-frame { padding: 8px; border-radius: 12px; border: 3px solid #315b88; background: #fff; }
.pk-server .pk-frame { background: #1d2733; border-color: #1d2733; }
.pk-grid { display: grid; grid-template-columns: 52px 52px; grid-template-rows: 52px 52px; gap: 3px; }
.pk-slot { width: 52px; height: 52px; border-radius: 6px; background: #e8eef5; border: 2px dashed #b9c9da; overflow: hidden; padding: 0; position: relative; }
.pk-server .pk-slot { background: #2c3a4c; border-color: #51627a; }
button.pk-slot { cursor: pointer; border-style: solid; border-color: #f0a51c; }
button.pk-slot:hover { transform: scale(1.06); }
.pk-piece { position: absolute; width: 104px; height: 104px; font-size: 86px; line-height: 104px; text-align: center; background: linear-gradient(160deg, #bfe6ff, #dff5c9); font-family: ${EMOJI_FONT}; }
.pk-road { position: absolute; left: 190px; right: 190px; top: 78px; height: 8px; border-radius: 4px; background: repeating-linear-gradient(90deg, #9dbfe0 0 14px, transparent 14px 22px); }
.pk-fly { position: absolute; top: 40px; font-size: 26px; transition: left 0.8s linear; pointer-events: none; z-index: 3; white-space: nowrap; font-weight: 800; color: #17406f; }
.pk-act { border: 0; border-radius: 12px; padding: 8px 12px; background: #27834a; color: #fff; font: inherit; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 0 rgba(0,0,0,0.15); }
.pk-act:disabled { background: #a9b4c0; cursor: default; }
.pk-mid { position: absolute; left: 186px; right: 186px; top: 100px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.pk-info { text-align: center; font-weight: 700; color: #26364a; font-size: 13px; line-height: 1.4; padding: 6px 10px; border-radius: 10px; background: #fff; border: 1px solid #c9d6e4; }
`,
)

const SVG_NS = 'http://www.w3.org/2000/svg'

function svgLine(svg: SVGElement, a: [number, number], b: [number, number], className: string): SVGLineElement {
  const line = document.createElementNS(SVG_NS, 'line')
  line.setAttribute('x1', String(a[0]))
  line.setAttribute('y1', String(a[1]))
  line.setAttribute('x2', String(b[0]))
  line.setAttribute('y2', String(b[1]))
  line.setAttribute('class', className)
  svg.appendChild(line)
  return line
}

function svgRoot(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.setAttribute('preserveAspectRatio', 'none')
  return svg
}

// ---------- ქვიშის ყუთი ----------

type Role = 'internet' | 'router' | 'switch' | 'end'

interface Device {
  id: string
  icon: string
  name: string
  role: Role
  pos: [number, number]
  /** სადენის ბუდეების რაოდენობა (0 — სადენი არ ერთდება) */
  ports: number
  wifi?: boolean
}

const PRESETS: Record<string, Device[]> = {
  home: [
    { id: 'net', icon: '🌍', name: 'ინტერნეტი', role: 'internet', pos: [11, 19], ports: 1 },
    { id: 'router', icon: '📶', name: 'Wi-Fi როუტერი', role: 'router', pos: [38, 19], ports: 3 },
    { id: 'switch', icon: '🔀', name: 'სვიჩი', role: 'switch', pos: [68, 19], ports: 5 },
    { id: 'phone', icon: '📱', name: 'ტელეფონი', role: 'end', pos: [12, 70], ports: 0, wifi: true },
    { id: 'laptop', icon: '💻', name: 'ლეპტოპი', role: 'end', pos: [36, 70], ports: 1, wifi: true },
    { id: 'pc', icon: '🖥️', name: 'კომპიუტერი', role: 'end', pos: [62, 72], ports: 1 },
    { id: 'tv', icon: '📺', name: 'ტელევიზორი', role: 'end', pos: [88, 66], ports: 1, wifi: true },
  ],
  school: [
    { id: 'router', icon: '📶', name: 'როუტერი', role: 'router', pos: [50, 18], ports: 2 },
    { id: 'switch', icon: '🔀', name: 'სვიჩი', role: 'switch', pos: [50, 48], ports: 5 },
    { id: 'pc1', icon: '🖥️', name: 'კომპიუტერი 1', role: 'end', pos: [12, 72], ports: 1 },
    { id: 'pc2', icon: '🖥️', name: 'კომპიუტერი 2', role: 'end', pos: [37, 76], ports: 1 },
    { id: 'pc3', icon: '🖥️', name: 'კომპიუტერი 3', role: 'end', pos: [63, 76], ports: 1 },
    { id: 'printer', icon: '🖨️', name: 'პრინტერი', role: 'end', pos: [88, 72], ports: 1 },
  ],
}

interface NetworkConfig {
  preset?: string
  /** საწყისი სადენები, მაგ. ['net-router'] */
  cables?: string[]
}

export function networkSim(host: HTMLElement, tasks: SimTask[], config: NetworkConfig, ctx: ExerciseCtx) {
  const devices = PRESETS[config.preset ?? 'home'] ?? PRESETS.home
  const byId = new Map(devices.map(d => [d.id, d]))
  const hasInternet = devices.some(d => d.role === 'internet')
  const routerId = devices.find(d => d.role === 'router')?.id ?? ''

  const key = (a: string, b: string) => (a < b ? `${a}-${b}` : `${b}-${a}`)
  const cables = new Set<string>((config.cables ?? []).map(c => key(...(c.split('-') as [string, string]))))
  const wifiOn = new Set<string>()
  let selected: string | null = null

  const wrap = el('div', 'ex-simwrap')
  const stage = el('div', 'ex-stage nw')
  const svg = svgRoot()
  const layer = el('div')
  stage.append(svg, layer)
  wrap.appendChild(stage)
  host.appendChild(wrap)
  const runner = taskRunner(wrap, tasks, ctx)

  const links = (): [string, string][] => [
    ...[...cables].map(c => c.split('-') as [string, string]),
    ...[...wifiOn].map(id => [id, routerId] as [string, string]),
  ]
  const reachable = (from: string): Set<string> => {
    const seen = new Set([from])
    const queue = [from]
    const all = links()
    while (queue.length) {
      const at = queue.shift()!
      for (const [a, b] of all) {
        const next = a === at ? b : b === at ? a : null
        if (next && !seen.has(next)) {
          seen.add(next)
          queue.push(next)
        }
      }
    }
    return seen
  }
  const used = (id: string) => [...cables].filter(c => c.split('-').includes(id)).length

  const test = (cond: string): boolean => {
    const [name, arg = ''] = cond.split(':')
    const online = reachable(hasInternet ? 'net' : routerId)
    const ends = devices.filter(d => d.role === 'end')
    switch (name) {
      case 'cable':
        return cables.has(key(...(arg.split('-') as [string, string])))
      case 'nocable':
        return !cables.has(key(...(arg.split('-') as [string, string])))
      case 'wifi':
        return wifiOn.has(arg)
      case 'online':
        return online.has(arg)
      case 'offline':
        return !online.has(arg)
      case 'reach': {
        const [a, b] = arg.split('-')
        return reachable(a).has(b)
      }
      case 'count':
        return ends.filter(d => online.has(d.id)).length >= Number(arg)
      case 'all':
        return ends.every(d => online.has(d.id))
      case 'count0':
        return ends.every(d => !online.has(d.id))
      default:
        return false
    }
  }

  const toggleCable = (a: Device, b: Device, node: HTMLElement) => {
    const k = key(a.id, b.id)
    if (cables.has(k)) {
      cables.delete(k)
      ctx.say(`✂️ სადენი გაითიშა: ${a.name} — ${b.name}.`)
      return
    }
    const fail = (text: string) => {
      shake(node)
      ctx.say(text, 'warn')
    }
    if (a.ports === 0 || b.ports === 0) {
      const d = a.ports === 0 ? a : b
      return fail(`🤔 მოწყობილობას „${d.name}“ სადენის ბუდე არ აქვს — ის მხოლოდ **უსადენოდ** (Wi-Fi) ერთდება.`)
    }
    if (a.role === 'end' && b.role === 'end') {
      return fail('🤔 ორ მოწყობილობას შორის **როუტერი** ან **სვიჩი** უნდა იყოს. მიაერთე სადენი მათ.')
    }
    const inet = a.role === 'internet' ? b : b.role === 'internet' ? a : null
    if (inet && inet.role !== 'router') {
      return fail('🤔 ინტერნეტის სადენი ჯერ **როუტერში** ერთდება, როუტერი კი მას სხვებს უნაწილებს.')
    }
    for (const d of [a, b]) {
      if (used(d.id) >= d.ports) {
        return fail(
          d.role === 'router'
            ? '🤔 როუტერს თავისუფალი ბუდე აღარ აქვს. გათიშე მისი ერთი სადენი და მის ადგილას **სვიჩი** მიაერთე — სვიჩს ბევრი ბუდე აქვს.'
            : `🤔 მოწყობილობას „${d.name}“ თავისუფალი ბუდე აღარ აქვს. ჯერ ძველი სადენი გათიშე.`,
        )
      }
    }
    cables.add(k)
    ctx.say(`🔌 სადენი მიერთდა: ${a.name} — ${b.name}.`)
  }

  const render = () => {
    svg.replaceChildren()
    layer.replaceChildren()
    const online = reachable(hasInternet ? 'net' : routerId)

    cables.forEach(c => {
      const [a, b] = c.split('-').map(id => byId.get(id)!)
      const live = online.has(a.id) && online.has(b.id)
      svgLine(svg, a.pos, b.pos, `nw-line${live ? ' live' : ''}`)
      const hit = svgLine(svg, a.pos, b.pos, 'nw-hit')
      hit.addEventListener('click', () => {
        cables.delete(c)
        selected = null
        ctx.say(`✂️ სადენი გაითიშა: ${a.name} — ${b.name}.`)
        update()
      })
    })
    wifiOn.forEach(id => {
      const d = byId.get(id)!
      const r = byId.get(routerId)!
      svgLine(svg, d.pos, r.pos, `nw-line wifi${online.has(id) ? ' live' : ''}`)
    })

    devices.forEach(d => {
      const box = el('div', `nw-dev${selected === d.id ? ' sel' : ''}`)
      box.style.left = `${d.pos[0]}%`
      box.style.top = `${d.pos[1]}%`
      const button = btn('nw-devbtn', '', () => {
        if (selected === null) {
          selected = d.id
          ctx.say(`👉 არჩეულია: **${d.name}**. ახლა დააწკაპუნე მეორე მოწყობილობას — მათ შორის სადენი გაიჭიმება.`)
        } else if (selected === d.id) selected = null
        else {
          toggleCable(byId.get(selected)!, d, box)
          selected = null
        }
        update()
      })
      button.textContent = d.icon
      box.append(button, el('div', 'nw-name', d.name))
      if (d.wifi) {
        const on = wifiOn.has(d.id)
        box.appendChild(
          btn(`nw-wifi${on ? ' on' : ''}`, on ? '📶 Wi-Fi ჩართულია' : '📶 Wi-Fi ჩართე', () => {
            if (on) wifiOn.delete(d.id)
            else wifiOn.add(d.id)
            selected = null
            ctx.say(on ? `📴 ${d.name}: Wi-Fi გამოირთო.` : `📶 ${d.name} როუტერს **უსადენოდ** დაუკავშირდა.`)
            update()
          }),
        )
      }
      if (d.role !== 'internet' && (d.id !== routerId || hasInternet)) {
        const ok = online.has(d.id)
        const label = hasInternet ? (ok ? '🟢 ინტერნეტი აქვს' : '🔴 ინტერნეტი არ აქვს') : ok ? '🟢 ქსელშია' : '🔴 ქსელში არ არის'
        box.appendChild(el('div', `nw-badge ${ok ? 'on' : 'off'}`, label))
      }
      layer.appendChild(box)
    })

  }

  const update = () => {
    render()
    runner.check(test)
  }
  update()
  ctx.say('🔌 სადენის გასაჭიმად დააწკაპუნე ერთ მოწყობილობას, მერე მეორეს. გასათიშად დააწკაპუნე თვითონ სადენს.')
}

// ---------- რატომ „ქსელი“? ----------

export function routesSim(host: HTMLElement, tasks: SimTask[], _config: unknown, ctx: ExerciseCtx) {
  const nodes: Record<string, { pos: [number, number]; icon: string; end?: boolean }> = {
    me: { pos: [9, 46], icon: '💻', end: true },
    a: { pos: [32, 18], icon: '🔵' },
    b: { pos: [32, 72], icon: '🔵' },
    c: { pos: [56, 44], icon: '🔵' },
    d: { pos: [72, 16], icon: '🔵' },
    e: { pos: [72, 74], icon: '🔵' },
    srv: { pos: [92, 46], icon: '🗄️', end: true },
  }
  const edges: [string, string][] = [
    ['me', 'a'], ['me', 'b'], ['a', 'c'], ['b', 'c'], ['a', 'd'], ['b', 'e'], ['c', 'd'], ['c', 'e'], ['d', 'srv'], ['e', 'srv'], ['c', 'srv'],
  ]
  const cut = new Set<number>()
  let path: number[] = []
  let busy = false

  const wrap = el('div', 'ex-simwrap')
  const stage = el('div', 'ex-stage nw')
  const svg = svgRoot()
  const layer = el('div')
  stage.append(svg, layer)
  wrap.appendChild(stage)
  host.appendChild(wrap)
  const runner = taskRunner(wrap, tasks, ctx)

  const findPath = (): number[] | null => {
    const prev = new Map<string, { from: string; edge: number }>()
    const seen = new Set(['me'])
    const queue = ['me']
    while (queue.length) {
      const at = queue.shift()!
      if (at === 'srv') break
      edges.forEach(([a, b], i) => {
        if (cut.has(i)) return
        const next = a === at ? b : b === at ? a : null
        if (next && !seen.has(next)) {
          seen.add(next)
          prev.set(next, { from: at, edge: i })
          queue.push(next)
        }
      })
    }
    if (!seen.has('srv')) return null
    const out: number[] = []
    let at = 'srv'
    while (at !== 'me') {
      const step = prev.get(at)!
      out.unshift(step.edge)
      at = step.from
    }
    return out
  }

  const send = btn('nw-send', '📨 გაგზავნე შეტყობინება', () => {
    if (busy) return
    const found = findPath()
    if (!found) {
      path = []
      render()
      ctx.say('❌ ყველა გზა გაწყვეტილია — შეტყობინება ვერ მივიდა! აღადგინე ერთი გზა მაინც (დააწკაპუნე 🚧-ს).', 'warn')
      runner.emit('blocked')
      return
    }
    busy = true
    send.disabled = true
    path = []
    found.forEach((edge, i) =>
      setTimeout(() => {
        path.push(edge)
        render()
        if (i === found.length - 1) {
          busy = false
          send.disabled = false
          runner.emit(cut.size > 0 ? 'rerouted' : 'sent')
          if (!stage.isConnected) return
        }
      }, 350 * (i + 1)),
    )
  })

  const render = () => {
    svg.replaceChildren()
    layer.replaceChildren()
    edges.forEach(([a, b], i) => {
      const pa = nodes[a].pos
      const pb = nodes[b].pos
      svgLine(svg, pa, pb, `nw-line${cut.has(i) ? ' cut' : path.includes(i) ? ' path' : ''}`)
      const hit = svgLine(svg, pa, pb, 'nw-hit')
      hit.addEventListener('click', () => {
        if (busy) return
        if (cut.has(i)) cut.delete(i)
        else cut.add(i)
        path = []
        ctx.say(cut.has(i) ? '🚧 ეს გზა გაწყდა. ახლა ისევ გაგზავნე შეტყობინება და ნახე, საით წავა.' : '🔧 გზა აღდგა.')
        render()
      })
      if (cut.has(i)) {
        const mark = el('div', 'nw-cutmark', '🚧')
        mark.style.left = `${(pa[0] + pb[0]) / 2}%`
        mark.style.top = `${(pa[1] + pb[1]) / 2}%`
        layer.appendChild(mark)
      }
    })
    const hot = new Set(path.flatMap(i => edges[i]))
    Object.entries(nodes).forEach(([id, node]) => {
      const dot = el('div', `nw-node${node.end ? ' end' : ''}${hot.has(id) ? ' hot' : ''}`, node.icon)
      dot.style.left = `${node.pos[0]}%`
      dot.style.top = `${node.pos[1]}%`
      layer.appendChild(dot)
    })
    ;[
      ['me', 'ჩემი კომპიუტერი'],
      ['srv', 'სერვერი'],
    ].forEach(([id, text]) => {
      const label = el('div', 'nw-label', text)
      label.style.left = `${nodes[id].pos[0]}%`
      label.style.top = `calc(${nodes[id].pos[1]}% + 34px)`
      if (id === 'me') label.style.transform = 'translate(-30%, 0)'
      if (id === 'srv') label.style.transform = 'translate(-70%, 0)'
      layer.appendChild(label)
    })
    layer.appendChild(send)
  }
  render()
}

// ---------- ინფორმაციის მოგზაურობა ----------

export function packetsSim(host: HTMLElement, tasks: SimTask[], config: { picture?: string }, ctx: ExerciseCtx) {
  const picture = config.picture ?? '🦁'
  const wrap = el('div', 'ex-simwrap')
  const stage = el('div', 'ex-stage pk')
  wrap.appendChild(stage)
  host.appendChild(wrap)
  const runner = taskRunner(wrap, tasks, ctx)

  const piece = (index: number) => {
    const node = el('div', 'pk-piece')
    node.textContent = picture
    node.style.left = `${-(index % 2) * 52}px`
    node.style.top = `${-Math.floor(index / 2) * 52}px`
    return node
  }

  const me = el('div', 'pk-side pk-me')
  const server = el('div', 'pk-side pk-server')
  const road = el('div', 'pk-road')
  const info = el('div', 'pk-info', 'სურათი სერვერზე ინახება. მოითხოვე ის!')
  const myGrid = el('div', 'pk-grid')
  const srvGrid = el('div', 'pk-grid')
  const mySlots = [0, 1, 2, 3].map(() => el('div', 'pk-slot'))
  mySlots.forEach(s => myGrid.appendChild(s))
  const myFrame = el('div', 'pk-frame')
  myFrame.appendChild(myGrid)
  const srvFrame = el('div', 'pk-frame')
  srvFrame.appendChild(srvGrid)

  const fly = (text: string, toServer: boolean, then: () => void) => {
    const node = el('div', 'pk-fly')
    node.textContent = text
    node.style.left = toServer ? '26%' : '66%'
    stage.appendChild(node)
    void node.offsetWidth
    node.style.left = toServer ? '66%' : '26%'
    setTimeout(() => {
      node.remove()
      then()
    }, 850)
  }

  let arrived = 0
  const srvSlots: HTMLElement[] = []
  const fillServer = (clickable: boolean) => {
    srvGrid.replaceChildren()
    srvSlots.length = 0
    for (let i = 0; i < 4; i++) {
      const slot = clickable ? el('button', 'pk-slot') : el('div', 'pk-slot')
      slot.appendChild(piece(i))
      if (clickable) {
        ;(slot as HTMLButtonElement).type = 'button'
        slot.addEventListener('click', () => {
          if (slot.dataset.sent) return
          slot.dataset.sent = '1'
          slot.replaceChildren()
          slot.style.borderStyle = 'dashed'
          slot.style.cursor = 'default'
          fly(`🧩 ნაწილი ${i + 1}`, false, () => {
            mySlots[i].appendChild(piece(i))
            mySlots[i].style.borderStyle = 'solid'
            arrived += 1
            if (arrived === 4) {
              info.textContent = 'ოთხივე ნაწილი მოვიდა და ეკრანზე ისევ ერთ სურათად აიკრიბა!'
              upload.disabled = false
              runner.emit('assembled')
            } else {
              info.textContent = `მოვიდა ${arrived} ნაწილი 4-დან. გამოგზავნე დანარჩენიც.`
            }
          })
        })
      }
      srvSlots.push(slot)
      srvGrid.appendChild(slot)
    }
  }
  fillServer(false)

  const request = btn('pk-act', '👆 მომეცი ეს სურათი!', () => {
    request.disabled = true
    info.textContent = 'მოთხოვნა ქსელით სერვერისკენ მიდის...'
    fly('✉️ მოთხოვნა', true, () => {
      fillServer(true)
      info.textContent = 'სერვერმა სურათი 4 პატარა ნაწილად დაჭრა. დააწკაპუნე ნაწილებს, რომ გამოგზავნოს.'
      runner.emit('request')
    })
  })
  const upload = btn('pk-act', '⬆️ ატვირთე შენი ფაილი', () => {
    upload.disabled = true
    info.textContent = 'ატვირთვისას ინფორმაცია პირიქით მიდის — ჩვენგან სერვერისკენ.'
    fly('📄 ჩემი ფაილი', true, () => {
      info.textContent = 'ფაილი სერვერზეა! ჩამოტვირთვა: სერვერი → ჩვენ. ატვირთვა: ჩვენ → სერვერი.'
      runner.emit('upload')
    })
  })
  upload.disabled = true

  const mid = el('div', 'pk-mid')
  mid.append(info, request, upload)
  me.append(el('div', '', '💻 ჩემი ეკრანი'), myFrame)
  server.append(el('div', '', '🗄️ სერვერი'), srvFrame)
  stage.append(me, road, server, mid)
}
