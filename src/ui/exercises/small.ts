import type { SimTask } from '../../content/topics'
import { btn, css, el, guardKeys, rich, taskRunner, EMOJI_FONT, type ExerciseCtx, type TaskRunner } from './dom'

/**
 * პატარა სიმულატორები:
 *  password — პაროლის შემმოწმებელი (len8, upper, lower, digit, symbol, strong, weak);
 *  binary   — 8 ნათურა-ბიტი: ასოს/რიცხვის აწყობა (value:<n>, letter:<A>);
 *  pixels   — სურათი 0-ებითა და 1-ებით (match, cells:<n>);
 *  gates    — ლოგიკური ჭიშკრები NOT / AND / OR (not:1, and:1, and:0, or:1, or:0 ...);
 *  circuit  — ელექტრული წრედი (on, off, conductor, insulator, series:out, parallel:out);
 *  search   — საძიებო სისტემა (search:<სიტყვა>, open:<n>, unsafe).
 */

css(
  'small',
  `
.sm { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 12px; border-radius: 14px; border: 3px solid #26364a; background: linear-gradient(180deg, #eef5ff, #fbfdff); min-height: var(--ex-h, 280px); box-sizing: border-box; font-family: Arial, ${EMOJI_FONT}; color: #26364a; }
.sm-input { width: min(340px, 100%); padding: 10px 12px; border: 3px solid #b9c9da; border-radius: 12px; font-size: 20px; font-family: Consolas, monospace; text-align: center; box-sizing: border-box; }
.sm-input:focus { outline: 0; border-color: #3d86c6; }
.sm-meter { width: min(340px, 100%); height: 14px; border-radius: 999px; background: #dfe7ef; overflow: hidden; }
.sm-meter > div { height: 100%; border-radius: 999px; transition: width 0.25s, background 0.25s; }
.sm-checks { display: grid; gap: 4px; width: min(380px, 100%); }
.sm-check { display: flex; gap: 8px; align-items: center; padding: 5px 9px; border-radius: 9px; background: #f3f6fa; font-size: 14px; font-weight: 700; color: #7b8a9a; }
.sm-check.ok { background: #e3f8ea; color: #1f7a45; }
.sm-big { font-size: 22px; font-weight: 900; text-align: center; }
.sm-bits { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.sm-bit { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.sm-lamp { width: 50px; height: 50px; border-radius: 50%; border: 3px solid #9aa9b8; background: #3a4656; color: #fff; font-size: 22px; font-weight: 900; cursor: pointer; font-family: Consolas, monospace; }
.sm-lamp.on { background: #ffd24a; border-color: #f0a51c; color: #26364a; box-shadow: 0 0 16px rgba(255, 210, 74, 0.8); }
.sm-place { font-size: 11px; font-weight: 800; color: #6b7c8f; }
.sm-px { display: grid; gap: 2px; padding: 4px; background: #9aa9b8; border-radius: 8px; }
.sm-cell { width: 34px; height: 34px; border: 0; padding: 0; font-family: Consolas, monospace; font-size: 13px; font-weight: 800; cursor: pointer; background: #fff; color: #9aa9b8; }
.sm-cell.on { background: #26364a; color: #fff; }
.sm-cell.ro { cursor: default; }
.sm-row { display: flex; gap: 16px; align-items: center; justify-content: center; flex-wrap: wrap; }
.sm-tabs { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.sm-tab { border: 2px solid #9dbfe0; border-bottom-width: 4px; border-radius: 10px; background: #fff; font: inherit; font-size: 15px; font-weight: 900; padding: 6px 14px; cursor: pointer; }
.sm-tab.on { border-color: #f0a51c; background: #fff3cf; }
.sm-switch { display: flex; flex-direction: column; align-items: center; gap: 4px; font-weight: 900; }
.sm-toggle { width: 74px; height: 40px; border-radius: 999px; border: 3px solid #9aa9b8; background: #dfe7ef; font: inherit; font-size: 16px; font-weight: 900; cursor: pointer; }
.sm-toggle.on { background: #38a169; border-color: #2a7a4b; color: #fff; }
.sm-gate { min-width: 92px; padding: 12px 10px; border-radius: 14px; background: #315b88; color: #fff; font-size: 20px; font-weight: 900; text-align: center; }
.sm-bulb { font-size: 46px; line-height: 1; filter: grayscale(1) brightness(0.7); transition: filter 0.2s; font-family: ${EMOJI_FONT}; }
.sm-bulb.on { filter: drop-shadow(0 0 14px #ffd24a); }
.sm-wire { flex: 0 0 40px; height: 5px; border-radius: 3px; background: #26364a; }
.sm-wire.live { background: #f0a51c; }
.sm-part { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 12px; font-weight: 800; }
.sm-part button { border: 3px solid #9dbfe0; border-radius: 12px; background: #fff; font-size: 30px; width: 60px; height: 56px; cursor: pointer; font-family: ${EMOJI_FONT}; padding: 0; }
.sm-part button:hover { border-color: #3d86c6; }
.sm-gap { min-width: 60px; height: 56px; border: 3px dashed #f0a51c; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 28px; background: #fffaf0; font-family: ${EMOJI_FONT}; }
.sm-search { display: flex; gap: 6px; width: min(460px, 100%); }
.sm-search .sm-input { flex: 1; font-size: 17px; text-align: left; font-family: Arial, sans-serif; }
.sm-go { border: 0; border-radius: 12px; padding: 0 16px; background: #3d86c6; color: #fff; font: inherit; font-size: 15px; font-weight: 900; cursor: pointer; }
.sm-results { display: grid; gap: 5px; width: min(520px, 100%); max-height: calc(var(--ex-h, 280px) - 90px); overflow-y: auto; }
.sm-result { display: grid; gap: 1px; text-align: left; padding: 7px 10px; border-radius: 10px; border: 1px solid #d5dee8; background: #fff; font: inherit; cursor: pointer; color: #26364a; }
.sm-result:hover { background: #eef5ff; }
.sm-result b { color: #1a4fa0; font-size: 15px; }
.sm-result span { font-size: 12.5px; color: #536579; }
.sm-result i { font-size: 11.5px; color: #2a7a4b; font-style: normal; }
.sm-result.bad i { color: #b44c48; }
.sm-logo { font-size: 26px; font-weight: 900; letter-spacing: 1px; }
`,
)

function stage(host: HTMLElement, tasks: SimTask[], ctx: ExerciseCtx): { box: HTMLElement; runner: TaskRunner } {
  const wrap = el('div', 'ex-simwrap')
  const box = el('div', 'ex-stage sm')
  wrap.appendChild(box)
  host.appendChild(wrap)
  return { box, runner: taskRunner(wrap, tasks, ctx) }
}

// ---------- პაროლი ----------

export function passwordSim(host: HTMLElement, tasks: SimTask[], _config: unknown, ctx: ExerciseCtx) {
  const { box, runner } = stage(host, tasks, ctx)
  const input = el('input', 'sm-input')
  input.type = 'text'
  input.placeholder = 'მოიფიქრე პაროლი...'
  input.autocomplete = 'off'
  input.spellcheck = false
  guardKeys(input)
  const meter = el('div', 'sm-meter')
  const bar = el('div')
  meter.appendChild(bar)
  const verdict = el('div', 'sm-big')
  const rules: [string, string, (v: string) => boolean][] = [
    ['len8', 'მინიმუმ 8 სიმბოლო', v => v.length >= 8],
    ['upper', 'დიდი ასო (A–Z)', v => /[A-Z]/.test(v)],
    ['lower', 'პატარა ასო (a–z)', v => /[a-z]/.test(v)],
    ['digit', 'ციფრი (0–9)', v => /\d/.test(v)],
    ['symbol', 'ნიშანი (! ? # @ ...)', v => /[^A-Za-z0-9\s]/.test(v)],
  ]
  const checks = el('div', 'sm-checks')
  const rows = rules.map(([, label]) => {
    const row = el('div', 'sm-check', `○ ${label}`)
    checks.appendChild(row)
    return row
  })
  const update = () => {
    const v = input.value
    const passed = rules.map(r => r[2](v))
    passed.forEach((ok, i) => {
      rows[i].className = `sm-check${ok ? ' ok' : ''}`
      rows[i].textContent = `${ok ? '✅' : '○'} ${rules[i][1]}`
    })
    const score = passed.filter(Boolean).length
    const common = /^(12345|123456|1234567|12345678|qwerty|password|parol)/i.test(v)
    const strong = score === 5 && !common
    bar.style.width = `${(score / 5) * 100}%`
    bar.style.background = strong ? '#38a169' : score >= 3 ? '#f0a51c' : '#e2453c'
    verdict.textContent = !v ? '' : strong ? '💪 საიმედო პაროლია!' : score >= 3 ? '🙂 უკეთესია, მაგრამ ჯერ არ კმარა' : '😟 მარტივი პაროლია — ადვილი გამოსაცნობი'
    const flags = new Set(rules.filter((_, i) => passed[i]).map(r => r[0]))
    if (strong) flags.add('strong')
    if (v && !strong) flags.add('weak')
    if (v === '12345' || v === '123456') flags.add('12345')
    runner.check(e => flags.has(e))
  }
  input.addEventListener('input', update)
  box.append(el('div', 'sm-big', '🔑 პაროლის შემმოწმებელი'), input, meter, verdict, checks)
  setTimeout(() => input.focus(), 0)
}

// ---------- ბიტები ----------

interface BinaryConfig {
  bits?: number
  /** ასოების ცხრილი: A = 01000001 */
  letters?: boolean
}

export function binarySim(host: HTMLElement, tasks: SimTask[], config: BinaryConfig, ctx: ExerciseCtx) {
  const { box, runner } = stage(host, tasks, ctx)
  const n = config.bits ?? 8
  const bits = new Array<number>(n).fill(0)
  const row = el('div', 'sm-bits')
  const code = el('div', 'sm-big')
  const value = el('div', 'sm-big')
  const lamps = bits.map((_, i) => {
    const cell = el('div', 'sm-bit')
    const lamp = btn('sm-lamp', '0', () => {
      bits[i] = bits[i] ? 0 : 1
      paint()
    })
    cell.append(lamp, el('span', 'sm-place', String(2 ** (n - 1 - i))))
    row.appendChild(cell)
    return lamp
  })
  const paint = () => {
    bits.forEach((b, i) => {
      lamps[i].textContent = String(b)
      lamps[i].classList.toggle('on', !!b)
    })
    const num = bits.reduce((acc, b) => acc * 2 + b, 0)
    code.textContent = `კოდი: ${bits.join('')}`
    const letter = config.letters && num >= 65 && num <= 90 ? String.fromCharCode(num) : ''
    value.textContent = config.letters ? (letter ? `ასო: ${letter}` : 'ასო: —') : `რიცხვი: ${num}`
    runner.check(e => e === `value:${num}` || (!!letter && e === `letter:${letter}`) || (e === 'on' && num > 0))
  }
  box.append(el('div', 'sm-big', '💡 ჩართე და გამორთე ნათურები: 1 = ანთია, 0 = ჩამქრალია'), row, code, value)
  paint()
}

// ---------- პიქსელები ----------

interface PixelsConfig {
  /** სამიზნე სურათი სტრიქონებით, მაგ. ['0110', '1111'] */
  target: string[]
}

export function pixelsSim(host: HTMLElement, tasks: SimTask[], config: PixelsConfig, ctx: ExerciseCtx) {
  const { box, runner } = stage(host, tasks, ctx)
  const target = config.target
  const rows = target.length
  const cols = target[0].length
  const grid = (readonly: boolean, read: (r: number, c: number) => boolean, onClick?: (r: number, c: number) => void) => {
    const g = el('div', 'sm-px')
    g.style.gridTemplateColumns = `repeat(${cols}, 34px)`
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const on = read(r, c)
        const cell = btn(`sm-cell${on ? ' on' : ''}${readonly ? ' ro' : ''}`, on ? '1' : '0', () => onClick?.(r, c))
        g.appendChild(cell)
      }
    return g
  }
  const mine = target.map(line => line.split('').map(() => false))
  const codeBox = el('div')
  const myBox = el('div')
  const render = () => {
    codeBox.replaceChildren(el('div', 'sm-place', '📜 კოდი (1 = შავი უჯრა)'), grid(true, (r, c) => target[r][c] === '1'))
    myBox.replaceChildren(
      el('div', 'sm-place', '🖌️ შენი ეკრანი — დააწკაპუნე უჯრებს'),
      grid(false, (r, c) => mine[r][c], (r, c) => {
        mine[r][c] = !mine[r][c]
        render()
      }),
    )
    const count = mine.flat().filter(Boolean).length
    const same = mine.every((line, r) => line.every((v, c) => v === (target[r][c] === '1')))
    runner.check(e => (e === 'match' && same) || e === `cells:${count}` || (e === 'some' && count > 0))
  }
  const row = el('div', 'sm-row')
  row.append(codeBox, myBox)
  box.append(row)
  render()
}

// ---------- ლოგიკური ჭიშკრები ----------

type Gate = 'not' | 'and' | 'or'
const GATE_NAME: Record<Gate, string> = { not: 'არა (NOT)', and: 'და (AND)', or: 'ან (OR)' }

export function gatesSim(host: HTMLElement, tasks: SimTask[], config: { gates?: Gate[] }, ctx: ExerciseCtx) {
  const { box, runner } = stage(host, tasks, ctx)
  const gates = config.gates ?? ['not', 'and', 'or']
  let gate: Gate = gates[0]
  let a = false
  let b = false
  const tabs = el('div', 'sm-tabs')
  const circuit = el('div', 'sm-row')
  const explain = el('div', 'sm-check')
  explain.style.justifyContent = 'center'
  const render = () => {
    tabs.replaceChildren(
      ...gates.map(g =>
        btn(`sm-tab${g === gate ? ' on' : ''}`, GATE_NAME[g], () => {
          gate = g
          render()
        }),
      ),
    )
    const out = gate === 'not' ? !a : gate === 'and' ? a && b : a || b
    const sw = (label: string, on: boolean, set: () => void) => {
      const s = el('div', 'sm-switch')
      s.append(el('span', '', label), btn(`sm-toggle${on ? ' on' : ''}`, on ? '1' : '0', set))
      return s
    }
    const inputs = el('div')
    inputs.style.cssText = 'display: flex; flex-direction: column; gap: 10px;'
    inputs.appendChild(sw('A', a, () => ((a = !a), render())))
    if (gate !== 'not') inputs.appendChild(sw('B', b, () => ((b = !b), render())))
    const bulb = el('div', `sm-bulb${out ? ' on' : ''}`, '💡')
    circuit.replaceChildren(inputs, el('div', `sm-wire${a || b ? ' live' : ''}`), el('div', 'sm-gate', GATE_NAME[gate]), el('div', `sm-wire${out ? ' live' : ''}`), bulb)
    rich(
      explain,
      gate === 'not'
        ? `**არა**: შემავალი ${a ? '1' : '0'} → გამომავალი **${out ? '1' : '0'}** (პირიქით აბრუნებს)`
        : gate === 'and'
          ? `**და**: A=${a ? 1 : 0}, B=${b ? 1 : 0} → **${out ? '1' : '0'}** (1 მხოლოდ მაშინ, როცა ორივე 1-ია)`
          : `**ან**: A=${a ? 1 : 0}, B=${b ? 1 : 0} → **${out ? '1' : '0'}** (1, როცა ერთი მაინც 1-ია)`,
    )
    const ev = `${gate}:${out ? 1 : 0}`
    const evAB = `${gate}:${a ? 1 : 0}${gate === 'not' ? '' : b ? 1 : 0}`
    runner.check(e => e === ev || e === evAB)
  }
  box.append(tabs, circuit, explain)
  render()
}

// ---------- ელექტრული წრედი ----------

interface CircuitConfig {
  mode?: 'basic' | 'material' | 'series' | 'parallel'
}

const MATERIALS: [string, string, boolean][] = [
  ['🔩', 'ლურსმანი (რკინა)', true],
  ['🪙', 'მონეტა (ლითონი)', true],
  ['🧷', 'ქინძისთავი', true],
  ['🪵', 'ხის ჯოხი', false],
  ['🧽', 'რეზინი', false],
  ['📄', 'ქაღალდი', false],
]

export function circuitSim(host: HTMLElement, tasks: SimTask[], config: CircuitConfig, ctx: ExerciseCtx) {
  const { box, runner } = stage(host, tasks, ctx)
  const mode = config.mode ?? 'basic'
  let closed = false
  let material: number | null = null
  const bulbsIn = [true, true]
  const view = el('div', 'sm-row')
  const extra = el('div', 'sm-tabs')
  const info = el('div', 'sm-check')
  info.style.justifyContent = 'center'

  const render = () => {
    view.replaceChildren()
    extra.replaceChildren()
    const part = (icon: string, label: string, onClick?: () => void) => {
      const p = el('div', 'sm-part')
      const b = btn('', icon, onClick ?? (() => {}))
      if (!onClick) b.style.cursor = 'default'
      p.append(b, el('span', '', label))
      return p
    }
    if (mode === 'basic' || mode === 'material') {
      const conducts = mode === 'basic' ? closed : material !== null && MATERIALS[material][2]
      view.append(part('🔋', 'ბატარეა'), el('div', `sm-wire${conducts ? ' live' : ''}`))
      if (mode === 'basic') {
        view.append(part(closed ? '🔛' : '🔘', closed ? 'ჩამრთველი: ჩართულია' : 'ჩამრთველი: გამორთულია', () => {
          closed = !closed
          render()
        }))
      } else {
        const gap = el('div', 'sm-gap', material === null ? '?' : MATERIALS[material][0])
        const p = el('div', 'sm-part')
        p.append(gap, el('span', '', 'ცარიელი ადგილი'))
        view.append(p)
        MATERIALS.forEach(([icon, name, ok], i) =>
          extra.appendChild(
            btn(`sm-tab${material === i ? ' on' : ''}`, `${icon} ${name}`, () => {
              material = i
              render()
              runner.emit(ok ? 'conductor' : 'insulator')
            }),
          ),
        )
      }
      view.append(el('div', `sm-wire${conducts ? ' live' : ''}`), el('div', `sm-bulb${conducts ? ' on' : ''}`, '💡'))
      rich(
        info,
        mode === 'basic'
          ? closed
            ? 'წრედი **შეკრულია** — დენი დადის და ნათურა ანთია.'
            : 'წრედი **გაწყვეტილია** — დენი ვერ გადის და ნათურა ჩამქრალია.'
          : material === null
            ? 'ჩადე ცარიელ ადგილას რომელიმე საგანი.'
            : MATERIALS[material][2]
              ? `${MATERIALS[material][1]} **გამტარია** — დენს ატარებს და ნათურა ანთია.`
              : `${MATERIALS[material][1]} **იზოლატორია** — დენს არ ატარებს.`,
      )
      if (mode === 'basic') runner.check(e => (e === 'on' && closed) || (e === 'off' && !closed))
      return
    }
    // მიმდევრობითი / პარალელური: ორი ნათურა, ერთის ამოხრახნა შეიძლება
    const series = mode === 'series'
    const lit = (i: number) => (series ? bulbsIn[0] && bulbsIn[1] : bulbsIn[i])
    const bulb = (i: number) => {
      const p = el('div', 'sm-part')
      const b = btn('', bulbsIn[i] ? '💡' : '⭕', () => {
        bulbsIn[i] = !bulbsIn[i]
        render()
      })
      b.style.filter = lit(i) && bulbsIn[i] ? 'drop-shadow(0 0 12px #ffd24a)' : bulbsIn[i] ? 'grayscale(1) brightness(0.8)' : ''
      p.append(b, el('span', '', bulbsIn[i] ? `ნათურა ${i + 1}` : `ნათურა ${i + 1} ამოღებულია`))
      return p
    }
    if (series) {
      view.append(part('🔋', 'ბატარეა'), el('div', `sm-wire${lit(0) ? ' live' : ''}`), bulb(0), el('div', `sm-wire${lit(0) ? ' live' : ''}`), bulb(1))
    } else {
      const col = el('div')
      col.style.cssText = 'display: flex; flex-direction: column; gap: 10px;'
      ;[0, 1].forEach(i => {
        const r = el('div', 'sm-row')
        r.append(el('div', `sm-wire${lit(i) ? ' live' : ''}`), bulb(i))
        col.appendChild(r)
      })
      view.append(part('🔋', 'ბატარეა'), col)
    }
    const out = bulbsIn.some(x => !x)
    rich(
      info,
      series
        ? out
          ? '**მიმდევრობითი** შეერთება: ერთი ნათურა ამოიღე და **ორივე ჩაქრა** — დენს ერთადერთი გზა აქვს.'
          : '**მიმდევრობითი** შეერთება: ნათურები ერთ ხაზზეა, ერთმანეთის მიყოლებით. სცადე ერთის ამოღება (დააწკაპუნე).'
        : out
          ? '**პარალელური** შეერთება: ერთი ნათურა ამოიღე, **მეორე ისევ ანთია** — თითოეულს თავისი გზა აქვს.'
          : '**პარალელური** შეერთება: თითოეულ ნათურას თავისი ხაზი აქვს. სცადე ერთის ამოღება (დააწკაპუნე).',
    )
    if (out) runner.emit(`${mode}:out`)
    if (!out) runner.emit(`${mode}:in`)
  }
  box.append(view, extra, info)
  render()
}

// ---------- საძიებო სისტემა ----------

interface SearchResult {
  title: string
  text: string
  site: string
  /** საეჭვო/არაუსაფრთხო საიტი */
  bad?: boolean
}
interface SearchConfig {
  name?: string
  /** საკვანძო სიტყვა → შედეგები */
  results: Record<string, SearchResult[]>
}

export function searchSim(host: HTMLElement, tasks: SimTask[], config: SearchConfig, ctx: ExerciseCtx) {
  const { box, runner } = stage(host, tasks, ctx)
  box.style.justifyContent = 'flex-start'
  const logo = el('div', 'sm-logo')
  logo.innerHTML = (config.name ?? 'Search').split('').map((ch, i) => `<span style="color:${['#4285f4', '#ea4335', '#fbbc05', '#4285f4', '#34a853', '#ea4335'][i % 6]}">${ch}</span>`).join('')
  const form = el('form', 'sm-search')
  const input = el('input', 'sm-input')
  input.type = 'text'
  input.placeholder = 'ჩაწერე საკვანძო სიტყვები...'
  input.autocomplete = 'off'
  guardKeys(input)
  const go = el('button', 'sm-go', '🔎 ძებნა')
  go.type = 'submit'
  form.append(input, go)
  const list = el('div', 'sm-results')
  form.addEventListener('submit', event => {
    event.preventDefault()
    const q = input.value.trim().toLowerCase()
    list.replaceChildren()
    if (!q) return
    const words = q.split(/\s+/)
    const keys = Object.keys(config.results).filter(k => words.some(w => k.split(/\s+/).some(kw => kw.startsWith(w.slice(0, Math.max(3, w.length - 2))))))
    const found = keys.flatMap(k => config.results[k])
    if (found.length === 0) {
      list.appendChild(el('div', 'sm-check', '🤷 ვერაფერი ვიპოვე. სცადე სხვა საკვანძო სიტყვა.'))
    }
    found.forEach((r, i) => {
      const item = btn(`sm-result${r.bad ? ' bad' : ''}`, '', () => {
        if (r.bad) {
          ctx.say(`⚠️ **${r.site}** საეჭვო საიტია! უცნობ, ფერად რეკლამებიან საიტებზე არ შევდივართ — ვეკითხებით უფროსს.`, 'warn')
          runner.emit('unsafe')
        } else {
          ctx.say(`📄 გაიხსნა: **${r.title}**. ${r.text}`, 'good')
          runner.emit(`open:${i}`)
          runner.emit('open')
        }
      })
      const t = el('b')
      t.textContent = r.title
      const s = el('i')
      s.textContent = r.bad ? `⚠️ ${r.site}` : `🔒 ${r.site}`
      const d = el('span')
      d.textContent = r.text
      item.append(t, s, d)
      list.appendChild(item)
    })
    words.forEach(w => runner.emit(`search:${w}`))
    keys.forEach(k => runner.emit(`search:${k}`))
    runner.emit('search')
  })
  box.append(logo, form, list)
  setTimeout(() => input.focus(), 0)
}
