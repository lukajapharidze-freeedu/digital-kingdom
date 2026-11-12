import type { SimTask } from '../../content/topics'
import { btn, css, el, guardKeys, taskRunner, EMOJI_FONT, type ExerciseCtx } from './dom'

/**
 * მინი სამუშაო მაგიდა სამი სისტემის სტილში (Windows / macOS / Ubuntu):
 * აიქონები, ფანჯრები თავისი ღილაკებით, გამორთვის მენიუ, Paint, ჩანაწერები და ტერმინალი.
 *
 * მოვლენები დავალებებისთვის:
 *  poweron, wake, menu, open:<app>, close:<app>, min:<app>, max:<app>,
 *  power:sleep | power:restart | power:shutdown,
 *  type:notes, paint:draw | paint:fill | paint:undo | paint:save, set:<name>, cmd:<command>
 */

type OS = 'windows' | 'macos' | 'ubuntu'
type Emit = (event: string) => void

interface AppDef {
  icon: string
  name: string
  build(body: HTMLElement, emit: Emit, stage: HTMLElement): void
}

css(
  'desktop',
  `
.dk { position: relative; height: var(--ex-h, 340px); border-radius: 14px; overflow: hidden; border: 3px solid #26364a; font-size: 13px; line-height: 1.35; color: #1d2733; user-select: none; font-family: Arial, ${EMOJI_FONT}; }
.dk * { box-sizing: border-box; }
.dk-windows { background: linear-gradient(135deg, #2f7fd6, #7cc4f5 60%, #bfe6ff); }
.dk-macos { background: linear-gradient(160deg, #6a4fc4, #e0719a 55%, #f7c27a); }
.dk-ubuntu { background: linear-gradient(135deg, #4a154b, #a63a50 60%, #e9692c); }
.dk.dark { filter: brightness(0.82) saturate(0.8); }
.dk button { font: inherit; cursor: pointer; }
.dk-work { position: absolute; }
.dk-windows .dk-work { inset: 0 0 36px 0; }
.dk-macos .dk-work { inset: 24px 0 52px 0; }
.dk-ubuntu .dk-work { inset: 24px 0 0 54px; }
.dk-icons { position: absolute; top: 8px; left: 8px; display: grid; grid-auto-flow: column; grid-template-rows: repeat(3, auto); gap: 4px 6px; }
.dk-icon { width: 74px; padding: 5px 2px; border: 2px solid transparent; border-radius: 8px; background: transparent; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.6); font-size: 11px; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.dk-icon:hover { background: rgba(255,255,255,0.22); border-color: rgba(255,255,255,0.5); }
.dk-icon span:first-child { font-size: 27px; line-height: 1.1; text-shadow: none; }

/* პანელები */
.dk-taskbar { position: absolute; left: 0; right: 0; bottom: 0; height: 36px; background: rgba(20,32,52,0.92); display: flex; align-items: center; gap: 4px; padding: 0 6px; color: #fff; }
.dk-start { width: 34px; height: 28px; border: 0; border-radius: 6px; background: #2f7fd6; color: #fff; font-size: 16px; font-weight: 900; }
.dk-start:hover { background: #4d9bef; }
.dk-running { height: 28px; padding: 0 8px; border: 0; border-bottom: 3px solid #7cc4f5; border-radius: 5px; background: rgba(255,255,255,0.14); color: #fff; font-size: 12px; }
.dk-clock { margin-left: auto; font-size: 12px; font-weight: 700; padding: 0 6px; }
.dk-topbar { position: absolute; left: 0; right: 0; top: 0; height: 24px; display: flex; align-items: center; gap: 10px; padding: 0 8px; font-size: 12px; font-weight: 700; color: #fff; }
.dk-macos .dk-topbar { background: rgba(255,255,255,0.28); color: #1d2733; backdrop-filter: blur(6px); }
.dk-ubuntu .dk-topbar { background: #1d1d1d; }
.dk-topbtn { border: 0; background: transparent; color: inherit; font-weight: 800; padding: 2px 6px; border-radius: 5px; height: 20px; }
.dk-topbtn:hover { background: rgba(255,255,255,0.3); }
.dk-dock { position: absolute; display: flex; gap: 6px; padding: 5px 8px; }
.dk-macos .dk-dock { bottom: 6px; left: 50%; transform: translateX(-50%); border-radius: 14px; background: rgba(255,255,255,0.35); border: 1px solid rgba(255,255,255,0.6); }
.dk-ubuntu .dk-dock { top: 24px; bottom: 0; left: 0; width: 54px; flex-direction: column; align-items: center; background: rgba(20,10,25,0.78); }
.dk-dockbtn { position: relative; width: 38px; height: 38px; border: 0; border-radius: 10px; background: rgba(255,255,255,0.85); font-size: 22px; line-height: 1; }
.dk-ubuntu .dk-dockbtn { background: rgba(255,255,255,0.14); }
.dk-dockbtn:hover { transform: scale(1.12); }
.dk-dockbtn.run::after { content: ''; position: absolute; width: 6px; height: 6px; border-radius: 50%; background: #f6bd35; left: 50%; bottom: -5px; transform: translateX(-50%); }
.dk-ubuntu .dk-dockbtn.run::after { left: -6px; bottom: 50%; transform: translateY(50%); }

/* მენიუები */
.dk-menu { position: absolute; z-index: 40; min-width: 170px; padding: 5px; border-radius: 10px; background: #ffffff; box-shadow: 0 8px 28px rgba(0,0,0,0.4); display: grid; gap: 2px; }
.dk-menu button { display: flex; gap: 8px; align-items: center; width: 100%; padding: 6px 9px; border: 0; border-radius: 7px; background: transparent; color: #1d2733; font-weight: 700; text-align: left; }
.dk-menu button:hover { background: #dbeafb; }
.dk-menu hr { width: 100%; margin: 2px 0; border: 0; border-top: 1px solid #d5dee8; }
.dk-menu-title { padding: 2px 9px; font-size: 11px; color: #6b7c8f; font-weight: 700; }

/* ფანჯრები */
.dk-win { position: absolute; z-index: 10; display: flex; flex-direction: column; border-radius: 9px; overflow: hidden; background: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.45); border: 1px solid rgba(0,0,0,0.35); }
.dk-win.max { inset: 0 !important; width: auto !important; height: auto !important; border-radius: 0; }
.dk-title { flex: 0 0 26px; display: flex; align-items: center; gap: 6px; padding: 0 6px; font-weight: 800; font-size: 12px; background: #e8eef5; }
.dk-ubuntu .dk-title { background: #2c2c2c; color: #fff; }
.dk-title-name { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.dk-macos .dk-title-name { text-align: center; }
.dk-ctrls { display: flex; gap: 4px; }
.dk-windows .dk-ctrls { order: 2; }
.dk-ubuntu .dk-ctrls { order: 2; }
.dk-ctrl { width: 26px; height: 20px; border: 0; border-radius: 4px; background: transparent; font-weight: 900; font-size: 12px; color: inherit; padding: 0; }
.dk-windows .dk-ctrl:hover { background: #cfd9e4; }
.dk-windows .dk-ctrl.close:hover { background: #e2453c; color: #fff; }
.dk-macos .dk-ctrl { width: 15px; height: 15px; border-radius: 50%; font-size: 0; }
.dk-macos .dk-ctrl.close { background: #ff5f57; }
.dk-macos .dk-ctrl.min { background: #febc2e; }
.dk-macos .dk-ctrl.max { background: #28c840; }
.dk-macos .dk-ctrl:hover { outline: 2px solid rgba(0,0,0,0.35); }
.dk-ubuntu .dk-ctrl { width: 20px; height: 20px; border-radius: 50%; background: #4a4a4a; color: #fff; font-size: 10px; }
.dk-ubuntu .dk-ctrl.close { background: #e9692c; }
.dk-body { flex: 1; min-height: 0; overflow: auto; padding: 8px 10px; user-select: text; }

/* ეკრანის მდგომარეობები */
.dk-cover { position: absolute; inset: 0; z-index: 60; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; background: #05070b; color: #cfd9e4; font-weight: 700; text-align: center; padding: 10px; }
.dk-cover.sleep { background: rgba(5,7,11,0.9); cursor: pointer; }
.dk-power { width: 66px; height: 66px; border-radius: 50%; border: 3px solid #5c6b7c; background: #151b24; color: #7cf0a0; font-size: 30px; font-weight: 900; box-shadow: 0 0 18px rgba(124,240,160,0.35); }
.dk-power:hover { border-color: #7cf0a0; }
.dk-big { font-size: 40px; line-height: 1; }

/* პროგრამები */
.dk-list { display: grid; gap: 4px; }
.dk-file { display: flex; gap: 8px; align-items: center; padding: 5px 8px; border-radius: 7px; background: #f3f7fb; font-weight: 700; }
.dk-note { color: #5b6c7d; font-size: 12px; margin-bottom: 6px; }
.dk-notes { width: 100%; height: 100%; min-height: 90px; resize: none; border: 1px solid #c9d6e4; border-radius: 7px; padding: 7px; font: inherit; font-size: 14px; }
.dk-tools { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin-bottom: 6px; }
.dk-tool { min-width: 30px; height: 28px; padding: 0 6px; border: 2px solid #c9d6e4; border-radius: 7px; background: #fff; font-size: 12px; font-weight: 700; }
.dk-tool:hover { border-color: #3d86c6; }
.dk-tool.on { border-color: #f0a51c; background: #fff3cf; }
.dk-swatch { width: 24px; height: 24px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 0 1px #9aa9b8; padding: 0; }
.dk-swatch.on { box-shadow: 0 0 0 3px #1d2733; }
.dk-canvas { display: grid; grid-template-columns: repeat(12, 1fr); gap: 1px; background: #c9d6e4; border: 1px solid #c9d6e4; }
.dk-px { aspect-ratio: 1; background: #fff; border: 0; padding: 0; }
.dk-toggle { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 6px 9px; border: 2px solid #d5dee8; border-radius: 8px; background: #fff; font-weight: 700; }
.dk-toggle.on { border-color: #38a169; background: #eefaf2; }
.dk-calc { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.dk-calc-out { grid-column: 1 / -1; padding: 6px 9px; border-radius: 7px; background: #1d2733; color: #7cf0a0; font-family: Consolas, monospace; font-size: 16px; text-align: right; min-height: 32px; }
.dk-calc button { height: 28px; border: 1px solid #c9d6e4; border-radius: 6px; background: #f3f7fb; font-weight: 800; }

/* ტერმინალი */
.tm { display: flex; flex-direction: column; height: 100%; min-height: 150px; background: #2b0a24; color: #f1f1f1; font-family: Consolas, 'Courier New', monospace; font-size: 13px; line-height: 1.45; border-radius: 6px; padding: 6px 8px; user-select: text; }
.tm-out { flex: 1; min-height: 0; overflow-y: auto; white-space: pre-wrap; word-break: break-word; }
.tm-row { display: flex; gap: 6px; align-items: center; }
.tm-prompt { color: #8ae234; font-weight: 700; white-space: nowrap; }
.tm-in { flex: 1; min-width: 40px; border: 0; outline: 0; background: transparent; color: #fff; font: inherit; }
.tm-dir { color: #729fcf; font-weight: 700; }
.tm-err { color: #ff8a80; }
.tm-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
.tm-chip { border: 1px solid #7a5c75; border-radius: 6px; background: #45173b; color: #ffd866; font-family: inherit; font-size: 12px; padding: 2px 7px; }
.tm-chip:hover { background: #5d2350; }
.dk-body.tm-host { padding: 0; background: #2b0a24; }
`,
)

// ---------- ტერმინალი ----------

type Dir = { [name: string]: Dir | string }

/** პატარა Linux-ის ბრძანების სტრიქონი: ls, pwd, cd, mkdir, cat, echo, date, whoami, clear, help */
export function buildTerminal(host: HTMLElement, emit: Emit, chips: string[] = ['help', 'ls', 'pwd', 'mkdir games', 'cd games', 'clear']) {
  const root: Dir = {
    documents: { 'letter.txt': 'გამარჯობა! ეს წერილი ტერმინალიდან წაიკითხე.' },
    pictures: { 'cat.png': '🐱 (სურათი)' },
    'notes.txt': 'ბრძანების სტრიქონში ყველაფერს ტექსტით ვწერთ.',
  }
  let path: string[] = []

  const box = el('div', 'tm')
  const out = el('div', 'tm-out')
  const rowEl = el('div', 'tm-row')
  const prompt = el('span', 'tm-prompt')
  const input = el('input', 'tm-in')
  input.type = 'text'
  input.autocomplete = 'off'
  input.spellcheck = false
  guardKeys(input)
  rowEl.append(prompt, input)
  box.append(out, rowEl)

  const here = (): Dir => {
    let dir = root
    for (const part of path) dir = dir[part] as Dir
    return dir
  }
  const where = () => (path.length ? `~/${path.join('/')}` : '~')
  const paintPrompt = () => {
    prompt.textContent = `user@ubuntu:${where()}$`
  }
  const print = (text: string, className = '') => {
    const line = el('div', className)
    line.textContent = text
    out.appendChild(line)
    out.scrollTop = out.scrollHeight
  }

  const run = (raw: string) => {
    const text = raw.trim()
    print(`user@ubuntu:${where()}$ ${text}`)
    if (!text) return
    const [cmd, ...args] = text.split(/\s+/)
    const arg = args.join(' ')
    const dir = here()
    let ok = true
    switch (cmd) {
      case 'help':
        print('ბრძანებები:\n  ls — რა არის ამ საქაღალდეში\n  pwd — სად ვარ ახლა\n  cd სახელი — საქაღალდეში შესვლა (cd .. — უკან)\n  mkdir სახელი — ახალი საქაღალდე\n  cat ფაილი — ფაილის წაკითხვა\n  echo ტექსტი — ტექსტის დაბეჭდვა\n  date, whoami, clear')
        break
      case 'ls': {
        const names = Object.keys(dir)
        if (names.length === 0) print('(ცარიელია)')
        else {
          const line = el('div')
          names.forEach(name => {
            const isDir = typeof dir[name] !== 'string'
            const span = el('span', isDir ? 'tm-dir' : '')
            span.textContent = `${isDir ? '📁' : '📄'} ${name}   `
            line.appendChild(span)
          })
          out.appendChild(line)
        }
        break
      }
      case 'pwd':
        print(`/home/user${path.length ? `/${path.join('/')}` : ''}`)
        break
      case 'cd':
        if (!arg || arg === '~') path = []
        else if (arg === '..') path = path.slice(0, -1)
        else if (dir[arg] !== undefined && typeof dir[arg] !== 'string') path = [...path, arg]
        else {
          ok = false
          print(`cd: ასეთი საქაღალდე არ არის: ${arg}`, 'tm-err')
        }
        break
      case 'mkdir':
        if (!arg) {
          ok = false
          print('mkdir: დაწერე საქაღალდის სახელი, მაგალითად: mkdir games', 'tm-err')
        } else if (dir[arg] !== undefined) {
          ok = false
          print(`mkdir: „${arg}“ უკვე არსებობს`, 'tm-err')
        } else {
          dir[arg] = {}
          print(`📁 საქაღალდე „${arg}“ შეიქმნა`)
        }
        break
      case 'cat':
        if (typeof dir[arg] === 'string') print(dir[arg] as string)
        else {
          ok = false
          print(`cat: ასეთი ფაილი არ არის: ${arg || '?'}`, 'tm-err')
        }
        break
      case 'echo':
        print(arg)
        break
      case 'date':
        print(new Date().toLocaleString('ka-GE'))
        break
      case 'whoami':
        print('user')
        break
      case 'clear':
        out.replaceChildren()
        break
      default:
        ok = false
        print(`ბრძანება ვერ მოიძებნა: ${cmd}. აკრიფე help`, 'tm-err')
    }
    out.scrollTop = out.scrollHeight
    paintPrompt()
    if (ok) emit(`cmd:${cmd}`)
  }

  input.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return
    run(input.value)
    input.value = ''
  })
  box.addEventListener('click', () => input.focus())

  if (chips.length) {
    const chipRow = el('div', 'tm-chips')
    chips.forEach(text =>
      chipRow.appendChild(
        btn('tm-chip', '', () => {
          input.value = text
          input.focus()
        }),
      ).append(text),
    )
    box.appendChild(chipRow)
  }

  print('Ubuntu ტერმინალი. აკრიფე ბრძანება და დააჭირე Enter-ს. დახმარება: help')
  paintPrompt()
  host.appendChild(box)
  setTimeout(() => input.focus(), 0)
}

// ---------- პროგრამები ----------

function fileList(note: string, files: [string, string][]): AppDef['build'] {
  return body => {
    body.appendChild(el('div', 'dk-note', note))
    const list = el('div', 'dk-list')
    files.forEach(([icon, name]) => {
      const rowEl = el('div', 'dk-file')
      rowEl.append(el('span', '', icon), el('span', '', name))
      list.appendChild(rowEl)
    })
    body.appendChild(list)
  }
}

const PAINT_COLORS = ['#e2453c', '#f6bd35', '#38a169', '#2f7fd6', '#8a5cc7', '#1d2733']

function paintApp(body: HTMLElement, emit: Emit) {
  let color = PAINT_COLORS[0]
  let fillMode = false
  const cells: HTMLButtonElement[] = []
  const history: string[][] = []
  const snapshot = () => history.push(cells.map(c => c.style.background || '#fff'))

  const tools = el('div', 'dk-tools')
  const swatches = PAINT_COLORS.map(c => {
    const s = btn('dk-swatch', '', () => {
      color = c
      swatches.forEach(x => x.classList.toggle('on', x === s))
    })
    s.style.background = c
    s.title = 'ფერი'
    return s
  })
  swatches[0].classList.add('on')
  const brush = btn('dk-tool on', '🖌️ ფუნჯი', () => {
    fillMode = false
    brush.classList.add('on')
    fill.classList.remove('on')
  })
  const fill = btn('dk-tool', '💧 ჩასხმა', () => {
    fillMode = true
    fill.classList.add('on')
    brush.classList.remove('on')
  })
  const undo = btn('dk-tool', '↩️ უკან', () => {
    const last = history.pop()
    if (!last) return
    cells.forEach((c, i) => (c.style.background = last[i]))
    emit('paint:undo')
  })
  const saved = el('span', 'dk-note')
  saved.style.margin = '0'
  const save = btn('dk-tool', '💾 შენახვა', () => {
    saved.textContent = '✔ ნახატი შენახულია'
    emit('paint:save')
  })
  tools.append(...swatches, brush, fill, undo, save, saved)

  const canvas = el('div', 'dk-canvas')
  for (let i = 0; i < 12 * 5; i++) {
    const cell = btn('dk-px', '', () => {
      snapshot()
      saved.textContent = ''
      if (fillMode) {
        cells.forEach(c => (c.style.background = color))
        emit('paint:fill')
      } else {
        cell.style.background = color
        emit('paint:draw')
      }
    })
    cells.push(cell)
    canvas.appendChild(cell)
  }
  body.append(tools, canvas)
}

function settingsApp(body: HTMLElement, emit: Emit, stage: HTMLElement) {
  body.appendChild(el('div', 'dk-note', 'აქ კომპიუტერს ვმართავთ: ხმა, ეკრანი, ქსელი.'))
  const list = el('div', 'dk-list')
  const toggles: [string, string, boolean][] = [
    ['dark', '🌙 მუქი ეკრანი', false],
    ['sound', '🔊 ხმა', true],
    ['wifi', '📶 Wi-Fi', true],
  ]
  toggles.forEach(([id, label, initial]) => {
    let on = initial
    const state = el('span')
    const toggle = btn(`dk-toggle${on ? ' on' : ''}`, '', () => {
      on = !on
      toggle.classList.toggle('on', on)
      state.textContent = on ? 'ჩართულია ✔' : 'გამორთულია'
      if (id === 'dark') stage.classList.toggle('dark', on)
      emit(`set:${id}`)
    })
    state.textContent = on ? 'ჩართულია ✔' : 'გამორთულია'
    toggle.append(el('span', '', label), state)
    list.appendChild(toggle)
  })
  body.appendChild(list)
}

function calcApp(body: HTMLElement, emit: Emit) {
  const box = el('div', 'dk-calc')
  const out = el('div', 'dk-calc-out', '0')
  box.appendChild(out)
  let expr = ''
  const keys = ['7', '8', '9', '+', '4', '5', '6', '-', '1', '2', '3', '=', '0', 'C']
  keys.forEach(key =>
    box.appendChild(
      btn('', key, () => {
        if (key === 'C') expr = ''
        else if (key === '=') {
          const parts = expr.match(/\d+|[+-]/g) ?? []
          let total = 0
          let sign = 1
          parts.forEach(p => {
            if (p === '+') sign = 1
            else if (p === '-') sign = -1
            else total += sign * Number(p)
          })
          expr = String(total)
          emit('calc:equals')
        } else if (expr.length < 12) expr += key
        out.textContent = expr || '0'
      }),
    ),
  )
  body.appendChild(box)
}

const APPS: Record<string, AppDef> = {
  trash: {
    icon: '🗑️',
    name: 'ნაგვის ყუთი',
    build: fileList('აქ წაშლილი ფაილებია. აქედან მათი დაბრუნება ჯერ კიდევ შეიძლება.', [
      ['📄', 'ძველი დავალება.docx'],
      ['🖼️', 'გაფუჭებული ნახატი.png'],
    ]),
  },
  docs: {
    icon: '📁',
    name: 'დოკუმენტები',
    build: fileList('საქაღალდეში ჩვენი ფაილები ინახება.', [
      ['📄', 'ჩემი მოთხრობა.docx'],
      ['🖼️', 'ზაფხულის ფოტო.jpg'],
      ['📊', 'პრეზენტაცია.pptx'],
    ]),
  },
  music: {
    icon: '🎵',
    name: 'მუსიკა',
    build: fileList('აქ სიმღერებია.', [
      ['▶️', 'საბავშვო სიმღერა.mp3'],
      ['▶️', 'ქართული ცეკვა.mp3'],
    ]),
  },
  calc: { icon: '🧮', name: 'კალკულატორი', build: calcApp },
  settings: { icon: '⚙️', name: 'პარამეტრები', build: settingsApp },
  paint: { icon: '🎨', name: 'სახატავი', build: paintApp },
  notes: {
    icon: '📝',
    name: 'ჩანაწერები',
    build(body, emit) {
      const area = el('textarea', 'dk-notes')
      area.placeholder = 'აკრიფე აქ რამე კლავიატურით...'
      guardKeys(area)
      area.addEventListener('input', () => {
        if (area.value.trim().length >= 3) emit('type:notes')
      })
      body.appendChild(area)
      setTimeout(() => area.focus(), 0)
    },
  },
  terminal: {
    icon: '⌨️',
    name: 'ტერმინალი',
    build(body, emit) {
      body.classList.add('tm-host')
      buildTerminal(body, emit)
    },
  },
}

const POWER_ITEMS: [string, string, string][] = [
  ['sleep', '🌙', 'ძილის რეჟიმი'],
  ['restart', '🔄', 'გადატვირთვა'],
  ['shutdown', '⏻', 'გამორთვა'],
]

interface DesktopConfig {
  os?: OS
  apps?: string[]
  startOff?: boolean
}

export function desktopSim(host: HTMLElement, tasks: SimTask[], config: DesktopConfig, ctx: ExerciseCtx) {
  const os: OS = config.os ?? 'windows'
  const apps = (config.apps ?? ['docs', 'paint', 'notes', 'trash']).filter(id => APPS[id])

  const wrap = el('div', 'ex-simwrap')
  const stage = el('div', `ex-stage dk dk-${os}`)
  wrap.appendChild(stage)
  host.appendChild(wrap)
  const runner = taskRunner(wrap, tasks, ctx)
  const emit: Emit = event => runner.emit(event)

  const work = el('div', 'dk-work')
  stage.appendChild(work)

  // ----- ფანჯრები -----
  const windows = new Map<string, { win: HTMLElement; mark: HTMLElement | null }>()
  const launchers = new Map<string, HTMLElement>()
  let running: HTMLElement | null = null
  let z = 10

  const closeMenus = () => stage.querySelectorAll('.dk-menu').forEach(m => m.remove())

  const refreshRunning = () => {
    launchers.forEach((node, id) => node.classList.toggle('run', windows.has(id)))
    if (!running) return
    running.replaceChildren()
    windows.forEach((entry, id) => {
      const app = APPS[id]
      running!.appendChild(
        btn('dk-running', `${app.icon} ${app.name}`, () => {
          entry.win.style.display = 'flex'
          entry.win.style.zIndex = String(++z)
          emit(`open:${id}`)
        }),
      )
    })
  }

  const closeApp = (id: string, silent = false) => {
    const entry = windows.get(id)
    if (!entry) return
    entry.win.remove()
    windows.delete(id)
    refreshRunning()
    if (!silent) emit(`close:${id}`)
  }

  const openApp = (id: string) => {
    closeMenus()
    const existing = windows.get(id)
    if (existing) {
      existing.win.style.display = 'flex'
      existing.win.style.zIndex = String(++z)
      emit(`open:${id}`)
      return
    }
    const app = APPS[id]
    const win = el('div', 'dk-win ex-pop')
    const offset = windows.size * 16
    win.style.cssText = `right: ${10 + offset}px; top: ${8 + offset}px; width: min(370px, calc(100% - 40px)); height: min(250px, calc(100% - 16px)); z-index: ${++z};`
    const title = el('div', 'dk-title')
    const ctrls = el('div', 'dk-ctrls')
    const minB = btn('dk-ctrl min', os === 'windows' ? '—' : os === 'ubuntu' ? '–' : '', () => {
      win.style.display = 'none'
      emit(`min:${id}`)
    })
    minB.title = 'ჩაკეცვა'
    const maxB = btn('dk-ctrl max', os === 'windows' ? '☐' : os === 'ubuntu' ? '□' : '', () => {
      win.classList.toggle('max')
      emit(`max:${id}`)
    })
    maxB.title = 'გადიდება'
    const closeB = btn('dk-ctrl close', os === 'macos' ? '' : '✕', () => closeApp(id))
    closeB.title = 'დახურვა'
    // macOS-ში ღილაკები მარცხნივაა: წითელი, ყვითელი, მწვანე
    if (os === 'macos') ctrls.append(closeB, minB, maxB)
    else ctrls.append(minB, maxB, closeB)
    title.append(ctrls, el('span', 'dk-title-name', `${app.icon} ${app.name}`))
    const body = el('div', 'dk-body')
    win.append(title, body)
    win.addEventListener('mousedown', () => (win.style.zIndex = String(++z)))
    // ფანჯრის გადატანა სათაურის ზოლით
    title.addEventListener('pointerdown', event => {
      if ((event.target as HTMLElement).closest('.dk-ctrl') || win.classList.contains('max')) return
      const area = work.getBoundingClientRect()
      const box = win.getBoundingClientRect()
      const dx = event.clientX - box.left
      const dy = event.clientY - box.top
      const move = (e: PointerEvent) => {
        const x = Math.min(Math.max(e.clientX - area.left - dx, 60 - box.width), area.width - 60)
        const y = Math.min(Math.max(e.clientY - area.top - dy, 0), area.height - 26)
        win.style.right = 'auto'
        win.style.left = `${x}px`
        win.style.top = `${y}px`
      }
      const stop = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', stop)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', stop)
    })
    title.style.cursor = 'grab'
    work.appendChild(win)
    windows.set(id, { win, mark: null })
    app.build(body, emit, stage)
    refreshRunning()
    emit(`open:${id}`)
  }

  // ----- ჩართვა / გამორთვა -----
  let cover: HTMLElement | null = null
  const setCover = (node: HTMLElement | null) => {
    cover?.remove()
    cover = node
    if (node) stage.appendChild(node)
  }

  const boot = (event: string) => {
    const loading = el('div', 'dk-cover')
    loading.append(el('div', 'dk-big', '⏳'), el('div', '', 'იტვირთება...'))
    setCover(loading)
    setTimeout(() => {
      if (cover !== loading) return
      setCover(null)
      emit(event)
    }, 900)
  }

  const showOff = () => {
    const off = el('div', 'dk-cover')
    const power = btn('dk-power', '⏻', () => boot('poweron'))
    power.title = 'ჩართვა'
    off.append(power, el('div', '', 'კომპიუტერი გამორთულია. დააჭირე ღილაკს ⏻'))
    setCover(off)
  }

  const power = (mode: string) => {
    closeMenus()
    if (mode === 'sleep') {
      const sleep = el('div', 'dk-cover sleep')
      sleep.append(el('div', 'dk-big', '🌙'), el('div', '', 'ძილის რეჟიმი. ფანჯრები ადგილზე დარჩა — დააწკაპუნე გასაღვიძებლად.'))
      sleep.addEventListener('click', () => {
        setCover(null)
        emit('wake')
      })
      setCover(sleep)
      emit('power:sleep')
      return
    }
    ;[...windows.keys()].forEach(id => closeApp(id, true))
    stage.classList.remove('dark')
    if (mode === 'restart') {
      const re = el('div', 'dk-cover')
      re.append(el('div', 'dk-big', '🔄'), el('div', '', 'გადატვირთვა: კომპიუტერი გამოირთო და ისევ ირთვება...'))
      setCover(re)
      emit('power:restart')
      setTimeout(() => {
        if (cover === re) setCover(null)
      }, 1500)
    } else {
      showOff()
      emit('power:shutdown')
    }
  }

  const powerButtons = (menu: HTMLElement) =>
    POWER_ITEMS.forEach(([mode, icon, name]) => {
      const item = btn('', '', () => power(mode))
      item.append(el('span', '', icon), el('span', '', name))
      menu.appendChild(item)
    })

  const toggleMenu = (build: (menu: HTMLElement) => void, style: string) => {
    const open = stage.querySelector('.dk-menu')
    closeMenus()
    if (open) return
    const menu = el('div', 'dk-menu ex-pop')
    menu.style.cssText = style
    build(menu)
    stage.appendChild(menu)
    emit('menu')
  }

  work.addEventListener('mousedown', event => {
    if (event.target === work) closeMenus()
  })

  const clock = () => new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })

  const launcher = (id: string, className: string, withLabel: boolean) => {
    const app = APPS[id]
    const node = btn(className, '', () => openApp(id))
    node.title = app.name
    node.append(el('span', '', app.icon))
    if (withLabel) node.append(el('span', '', app.name))
    return node
  }

  if (os === 'windows') {
    const icons = el('div', 'dk-icons')
    apps.forEach(id => icons.appendChild(launcher(id, 'dk-icon', true)))
    work.appendChild(icons)

    const bar = el('div', 'dk-taskbar')
    const start = btn('dk-start', '⊞', () =>
      toggleMenu(menu => {
        menu.appendChild(el('div', 'dk-menu-title', 'პროგრამები'))
        apps.forEach(id => {
          const item = btn('', '', () => openApp(id))
          item.append(el('span', '', APPS[id].icon), el('span', '', APPS[id].name))
          menu.appendChild(item)
        })
        menu.appendChild(el('hr'))
        // გამორთვის ნიშანი — მენიუს ქვედა მარცხენა კუთხეში
        const powerItem = btn('', '', () => {
          menu.replaceChildren(el('div', 'dk-menu-title', '⏻ რა გავაკეთოთ?'))
          powerButtons(menu)
        })
        powerItem.append(el('span', '', '⏻'), el('span', '', 'გამორთვის მენიუ'))
        menu.appendChild(powerItem)
      }, 'left: 6px; bottom: 40px;'),
    )
    start.title = 'Start — დაწყება'
    running = el('div')
    running.style.cssText = 'display: flex; gap: 4px; overflow: hidden;'
    bar.append(start, running, el('div', 'dk-clock', clock()))
    stage.appendChild(bar)
  } else if (os === 'macos') {
    const top = el('div', 'dk-topbar')
    const menuBtn = btn('dk-topbtn', '◆', () =>
      toggleMenu(menu => {
        menu.appendChild(el('div', 'dk-menu-title', 'ამ კომპიუტერის შესახებ'))
        menu.appendChild(el('hr'))
        powerButtons(menu)
      }, 'left: 6px; top: 26px;'),
    )
    menuBtn.title = 'მთავარი მენიუ'
    const right = el('span', '', clock())
    right.style.marginLeft = 'auto'
    top.append(menuBtn, el('span', '', 'Finder'), el('span', '', 'File'), el('span', '', 'Edit'), right)
    stage.appendChild(top)

    const dock = el('div', 'dk-dock')
    apps.forEach(id => {
      const node = launcher(id, 'dk-dockbtn', false)
      launchers.set(id, node)
      dock.appendChild(node)
    })
    stage.appendChild(dock)
  } else {
    const top = el('div', 'dk-topbar')
    const mid = el('span', '', clock())
    mid.style.cssText = 'margin: 0 auto;'
    const sys = btn('dk-topbtn', '📶 🔊 ⏻', () =>
      toggleMenu(menu => {
        menu.appendChild(el('div', 'dk-menu-title', 'სისტემის მენიუ'))
        powerButtons(menu)
      }, 'right: 6px; top: 26px;'),
    )
    sys.title = 'სისტემის მენიუ'
    top.append(el('span', '', 'Activities'), mid, sys)
    stage.appendChild(top)

    const dock = el('div', 'dk-dock')
    apps.forEach(id => {
      const node = launcher(id, 'dk-dockbtn', false)
      launchers.set(id, node)
      dock.appendChild(node)
    })
    stage.appendChild(dock)
  }

  if (config.startOff) showOff()
}

/** მხოლოდ ტერმინალი — კომპიუტერი გრაფიკული ინტერფეისის გარეშე */
export function terminalSim(host: HTMLElement, tasks: SimTask[], config: { chips?: string[] }, ctx: ExerciseCtx) {
  const wrap = el('div', 'ex-simwrap')
  const stage = el('div', 'ex-stage')
  stage.style.cssText = 'height: min(var(--ex-h, 300px), 320px); border-radius: 14px; overflow: hidden; border: 3px solid #26364a;'
  wrap.appendChild(stage)
  host.appendChild(wrap)
  const runner = taskRunner(wrap, tasks, ctx)
  buildTerminal(stage, event => runner.emit(event), config.chips)
}
