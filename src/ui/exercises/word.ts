import type { SimTask } from '../../content/topics'
import { btn, css, el, taskRunner, EMOJI_FONT, type ExerciseCtx } from './dom'

/**
 * მინი Word: აბზაცზე დაწკაპუნებით ვმონიშნავთ, ინსტრუმენტებით ვაფორმებთ.
 * config.tools — რომელი ჯგუფები გამოჩნდეს:
 *  font, style, color, align, spacing, indent, list, table, picture, shape, wordart, link,
 *  orient, columns, count, pagenum, save, copy, keys
 *
 * მოვლენები: select, font:<name>, size:up, size:down, bold, italic, underline, color,
 *  align:left|center|right|justify, spacing:<1|1.5|2>, indent, bullets, numbers, table, table:<r>x<c>,
 *  picture, shape, wordart, link, orient:landscape|portrait, cols:<n>, count, pagenum, save:docx|pdf,
 *  copy, paste, key:<ctrl+..>
 */

type Tool =
  | 'font' | 'style' | 'color' | 'align' | 'spacing' | 'indent' | 'list' | 'table' | 'picture' | 'shape'
  | 'wordart' | 'link' | 'orient' | 'columns' | 'count' | 'pagenum' | 'save' | 'copy' | 'keys'

interface WordConfig {
  tools?: Tool[]
  text?: string[]
  /** WordArt-ის წარწერა */
  art?: string
}

interface Para {
  text: string
  font: string
  size: number
  bold: boolean
  italic: boolean
  underline: boolean
  color: string
  align: 'left' | 'center' | 'right' | 'justify'
  spacing: number
  indent: boolean
  list: '' | 'bullets' | 'numbers'
  kind: 'text' | 'table' | 'picture' | 'shape' | 'wordart' | 'link'
  rows?: number
  cols?: number
}

css(
  'word',
  `
.wd { display: flex; flex-direction: column; height: var(--ex-h, 320px); border-radius: 14px; overflow: hidden; border: 3px solid #26364a; background: #e9edf2; font-size: 12.5px; color: #1d2733; font-family: Arial, ${EMOJI_FONT}; }
.wd * { box-sizing: border-box; }
.wd button, .wd select { font: inherit; cursor: pointer; }
.wd-title { flex: 0 0 24px; display: flex; align-items: center; justify-content: center; background: #2b579a; color: #fff; font-weight: 800; font-size: 12px; }
.wd-ribbon { flex: 0 0 auto; display: flex; flex-wrap: wrap; gap: 3px 8px; padding: 5px 7px; background: #f6f8fa; border-bottom: 1px solid #c9d6e4; }
.wd-group { display: flex; gap: 2px; align-items: center; padding-right: 7px; border-right: 1px solid #d5dee8; }
.wd-group:last-child { border-right: 0; }
.wd-b { min-width: 28px; height: 26px; padding: 0 6px; border: 1px solid #c9d6e4; border-radius: 6px; background: #fff; font-weight: 800; white-space: nowrap; }
.wd-b:hover { border-color: #2b579a; background: #e8eefb; }
.wd-b.on { background: #c9daf5; border-color: #2b579a; }
.wd-sel { height: 26px; border: 1px solid #c9d6e4; border-radius: 6px; background: #fff; }
.wd-sw { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #9aa9b8; padding: 0; }
.wd-desk { flex: 1; min-height: 0; overflow: auto; padding: 10px; display: flex; justify-content: center; }
.wd-page { background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.18); padding: 18px 22px 26px; width: 100%; max-width: 420px; min-height: 100%; position: relative; transition: max-width 0.3s; }
.wd-page.land { max-width: 600px; }
.wd-body { gap: 0 18px; }
.wd-p { margin: 0 0 8px; padding: 2px 4px; border-radius: 4px; border: 2px solid transparent; cursor: pointer; line-height: 1.35; }
.wd-p:hover { border-color: #d5e2f3; }
.wd-p.sel { border-color: #f0a51c; background: #fffaf0; }
.wd-p table { border-collapse: collapse; width: 100%; }
.wd-p td { border: 1px solid #555; height: 20px; }
.wd-art { font-size: 26px; font-weight: 900; background: linear-gradient(90deg, #e2453c, #f0a51c, #38a169, #2f7fd6); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }
.wd-link { color: #1a4fa0; text-decoration: underline; }
.wd-pnum { position: absolute; bottom: 6px; left: 0; right: 0; text-align: center; color: #6b7c8f; font-size: 11px; }
.wd-status { flex: 0 0 22px; display: flex; align-items: center; gap: 12px; padding: 0 8px; background: #2b579a; color: #fff; font-size: 11.5px; font-weight: 700; }
.wd-pick { display: grid; grid-template-columns: repeat(4, 18px); gap: 2px; padding: 4px; background: #fff; border: 1px solid #c9d6e4; border-radius: 6px; position: absolute; z-index: 5; }
.wd-pick button { width: 18px; height: 18px; border: 1px solid #9aa9b8; background: #fff; padding: 0; }
.wd-pick button.hl { background: #c9daf5; }
`,
)

const FONTS = ['Arial', 'Times New Roman', 'Comic Sans MS', 'Courier New']
const COLORS = ['#1d2733', '#e2453c', '#2f7fd6', '#38a169', '#8a5cc7', '#f0a51c']

export function wordSim(host: HTMLElement, tasks: SimTask[], config: WordConfig, ctx: ExerciseCtx) {
  const tools = new Set<Tool>(config.tools ?? ['font', 'style', 'color', 'align'])
  const wrap = el('div', 'ex-simwrap')
  const stage = el('div', 'ex-stage wd')
  wrap.appendChild(stage)
  host.appendChild(wrap)
  const runner = taskRunner(wrap, tasks, ctx)
  const emit = (e: string) => runner.emit(e)

  const base = (text: string): Para => ({
    text, font: 'Arial', size: 14, bold: false, italic: false, underline: false, color: COLORS[0],
    align: 'left', spacing: 1, indent: false, list: '', kind: 'text',
  })
  const paras: Para[] = (config.text ?? ['ჩემი სკოლა', 'ჩემი სკოლა დიდი და ნათელია. აქ ბევრი მეგობარი მყავს.', 'ყველაზე მეტად ინფორმატიკის გაკვეთილი მიყვარს.']).map(base)
  let sel: Para | null = null
  let landscape = false
  let cols = 1
  let pageNums = false
  let clipboard: Para | null = null
  let status = ''

  const title = el('div', 'wd-title', '📝 დოკუმენტი1 — Word')
  const ribbon = el('div', 'wd-ribbon')
  const desk = el('div', 'wd-desk')
  const page = el('div', 'wd-page')
  const body = el('div', 'wd-body')
  page.appendChild(body)
  desk.appendChild(page)
  const statusBar = el('div', 'wd-status')
  stage.append(title, ribbon, desk, statusBar)

  const need = (): Para | null => {
    if (!sel) {
      ctx.say('👆 ჯერ **მონიშნე** ტექსტი: დააწკაპუნე აბზაცს ფურცელზე.', 'warn')
      return null
    }
    return sel
  }
  const apply = (fn: (p: Para) => void, event: string) => {
    const p = need()
    if (!p) return
    fn(p)
    render()
    emit(event)
  }
  const insert = (p: Para, event: string) => {
    const at = sel ? paras.indexOf(sel) + 1 : paras.length
    paras.splice(at, 0, p)
    sel = p
    render()
    emit(event)
  }

  const group = (...nodes: HTMLElement[]) => {
    const g = el('div', 'wd-group')
    g.append(...nodes)
    ribbon.appendChild(g)
  }
  const b = (label: string, title: string, onClick: () => void, on = false) => {
    const node = btn(`wd-b${on ? ' on' : ''}`, label, onClick)
    node.title = title
    return node
  }

  const buildRibbon = () => {
    ribbon.replaceChildren()
    const p = sel
    if (tools.has('font')) {
      const s = el('select', 'wd-sel')
      FONTS.forEach(f => {
        const o = el('option')
        o.value = f
        o.textContent = f
        o.selected = p?.font === f
        s.appendChild(o)
      })
      s.addEventListener('change', () => apply(x => (x.font = s.value), `font:${s.value}`))
      group(s, b('A+', 'ზომის გაზრდა', () => apply(x => (x.size = Math.min(36, x.size + 4)), 'size:up')), b('A−', 'ზომის შემცირება', () => apply(x => (x.size = Math.max(8, x.size - 2)), 'size:down')))
    }
    if (tools.has('style')) {
      group(
        b('B', 'მსხვილი (Bold)', () => apply(x => (x.bold = !x.bold), 'bold'), p?.bold),
        b('I', 'დახრილი (Italic)', () => apply(x => (x.italic = !x.italic), 'italic'), p?.italic),
        b('U', 'ხაზგასმული (Underline)', () => apply(x => (x.underline = !x.underline), 'underline'), p?.underline),
      )
    }
    if (tools.has('color')) {
      group(
        ...COLORS.map(c => {
          const s = btn('wd-sw', '', () => apply(x => (x.color = c), 'color'))
          s.style.background = c
          s.title = 'ტექსტის ფერი'
          return s
        }),
      )
    }
    if (tools.has('align')) {
      const al: [Para['align'], string, string][] = [
        ['left', '⫷ მარცხნივ', 'მარცხნივ სწორება (Ctrl+L)'],
        ['center', '☰ ცენტრში', 'ცენტრში სწორება (Ctrl+E)'],
        ['right', 'მარჯვნივ ⫸', 'მარჯვნივ სწორება (Ctrl+R)'],
        ['justify', '▤ ორივე მხარეს', 'ორივე მხარეს სწორება (Ctrl+J)'],
      ]
      group(...al.map(([a, label, t]) => b(label, t, () => apply(x => (x.align = a), `align:${a}`), p?.align === a)))
    }
    if (tools.has('spacing')) {
      const s = el('select', 'wd-sel')
      ;[1, 1.5, 2].forEach(v => {
        const o = el('option')
        o.value = String(v)
        o.textContent = `↕ ${v}`
        o.selected = p?.spacing === v
        s.appendChild(o)
      })
      s.title = 'სტრიქონებს შორის მანძილი'
      s.addEventListener('change', () => apply(x => (x.spacing = Number(s.value)), `spacing:${s.value}`))
      group(el('span', '', 'ინტერვალი:'), s)
    }
    if (tools.has('indent')) group(b('⇥ აბზაცი', 'აბზაცის დაშორება', () => apply(x => (x.indent = !x.indent), 'indent'), p?.indent))
    if (tools.has('list')) {
      group(
        b('• სია', 'ბულეტები', () => apply(x => (x.list = x.list === 'bullets' ? '' : 'bullets'), 'bullets'), p?.list === 'bullets'),
        b('1. სია', 'დანომრილი სია', () => apply(x => (x.list = x.list === 'numbers' ? '' : 'numbers'), 'numbers'), p?.list === 'numbers'),
      )
    }
    if (tools.has('table')) {
      const t = b('▦ ცხრილი', 'ცხრილის ჩასმა', () => {
        const old = ribbon.querySelector('.wd-pick')
        if (old) return old.remove()
        const pick = el('div', 'wd-pick')
        const cells: HTMLButtonElement[] = []
        for (let r = 1; r <= 4; r++)
          for (let c = 1; c <= 4; c++) {
            const cell = btn('', '', () => {
              pick.remove()
              insert({ ...base(''), kind: 'table', rows: r, cols: c }, 'table')
              emit(`table:${r}x${c}`)
              status = `▦ ჩაისვა ცხრილი: ${r} სტრიქონი × ${c} სვეტი`
              render()
            })
            cell.title = `${r} × ${c}`
            cell.addEventListener('mouseenter', () => cells.forEach((x, i) => x.classList.toggle('hl', Math.floor(i / 4) < r && (i % 4) < c)))
            cells.push(cell)
            pick.appendChild(cell)
          }
        t.parentElement!.style.position = 'relative'
        pick.style.top = '28px'
        t.parentElement!.appendChild(pick)
      })
      group(t)
    }
    const inserts: [Tool, string, string, () => Para, string][] = [
      ['picture', '🖼️ სურათი', 'სურათის ჩასმა', () => ({ ...base('🏞️'), kind: 'picture', size: 48, align: 'center' }), 'picture'],
      ['shape', '⬛ ფიგურა', 'ფიგურის ჩასმა', () => ({ ...base('⭐'), kind: 'shape', size: 40, align: 'center' }), 'shape'],
      ['wordart', '🅰️ WordArt', 'ლამაზი სათაური', () => ({ ...base(config.art ?? 'ჩემი წიგნი'), kind: 'wordart', align: 'center' }), 'wordart'],
      ['link', '🔗 ბმული', 'ჰიპერლინკის ჩასმა', () => ({ ...base('school.emis.ge'), kind: 'link' }), 'link'],
    ]
    const ins = inserts.filter(([tool]) => tools.has(tool))
    if (ins.length) group(...ins.map(([, label, t, make, ev]) => b(label, t, () => insert(make(), ev))))
    if (tools.has('orient')) {
      group(
        b('📄 წიგნური', 'Portrait', () => ((landscape = false), render(), emit('orient:portrait')), !landscape),
        b('📃 ალბომური', 'Landscape', () => ((landscape = true), render(), emit('orient:landscape')), landscape),
      )
    }
    if (tools.has('columns')) group(el('span', '', 'სვეტები:'), ...[1, 2, 3].map(n => b(String(n), `${n} სვეტი`, () => ((cols = n), render(), emit(`cols:${n}`)), cols === n)))
    if (tools.has('pagenum')) group(b('#️⃣ გვერდის ნომერი', 'გვერდების გადანომვრა', () => ((pageNums = !pageNums), render(), emit('pagenum')), pageNums))
    if (tools.has('count')) {
      group(
        b('🔢 სიტყვების დათვლა', 'Word Count', () => {
          const words = paras.filter(x => x.kind === 'text').map(x => x.text).join(' ').split(/\s+/).filter(w => /[\p{L}\d]/u.test(w)).length
          status = `🔢 სიტყვების რაოდენობა: ${words}`
          render()
          emit('count')
        }),
      )
    }
    if (tools.has('copy') || tools.has('keys')) {
      group(
        b('📋 Copy (Ctrl+C)', 'კოპირება', () => {
          const x = need()
          if (!x) return
          clipboard = { ...x }
          status = '📋 მონიშნული ტექსტი დაკოპირდა'
          render()
          emit('copy')
          emit('key:ctrl+c')
        }),
        b('📌 Paste (Ctrl+V)', 'ჩასმა', () => {
          if (!clipboard) return ctx.say('🤔 ჯერ რამე დააკოპირე (Ctrl+C).', 'warn')
          insert({ ...clipboard }, 'paste')
          emit('key:ctrl+v')
        }),
      )
    }
    if (tools.has('save')) {
      group(
        b('💾 Word (.docx)', 'შენახვა Word-ის ფორმატში', () => ((status = '💾 შეინახა: ჩემი დოკუმენტი.docx — შემდეგ ისევ შეგვიძლია მისი შეცვლა'), render(), emit('save:docx'))),
        b('📕 PDF', 'შენახვა PDF-ად', () => ((status = '📕 შეინახა: ჩემი დოკუმენტი.pdf — ნებისმიერ მოწყობილობაზე ერთნაირად გამოჩნდება'), render(), emit('save:pdf'))),
      )
    }
  }

  const renderPage = () => {
    page.classList.toggle('land', landscape)
    body.style.columnCount = String(cols)
    body.style.display = cols > 1 ? 'block' : ''
    body.replaceChildren()
    let num = 0
    paras.forEach(p => {
      const node = el('div', `wd-p${sel === p ? ' sel' : ''}`)
      node.style.cssText = `font-family: '${p.font}', ${EMOJI_FONT}; font-size: ${p.size}px; font-weight: ${p.bold ? 800 : 400}; font-style: ${p.italic ? 'italic' : 'normal'}; text-decoration: ${p.underline ? 'underline' : 'none'}; color: ${p.color}; text-align: ${p.align}; line-height: ${1.35 * p.spacing}; text-indent: ${p.indent ? '2em' : '0'};`
      if (p.kind === 'table') {
        const t = el('table')
        for (let r = 0; r < (p.rows ?? 2); r++) {
          const tr = el('tr')
          for (let c = 0; c < (p.cols ?? 2); c++) tr.appendChild(el('td'))
          t.appendChild(tr)
        }
        node.appendChild(t)
      } else if (p.kind === 'wordart') {
        node.appendChild(el('span', 'wd-art', p.text))
      } else if (p.kind === 'link') {
        node.appendChild(el('span', 'wd-link', p.text))
      } else {
        num = p.list === 'numbers' ? num + 1 : 0
        const prefix = p.list === 'bullets' ? '• ' : p.list === 'numbers' ? `${num}. ` : ''
        node.textContent = prefix + p.text
      }
      node.addEventListener('click', () => {
        sel = sel === p ? null : p
        render()
        if (sel) emit('select')
      })
      body.appendChild(node)
    })
    page.querySelector('.wd-pnum')?.remove()
    if (pageNums) page.appendChild(el('div', 'wd-pnum', '— 1 —'))
  }

  const render = () => {
    buildRibbon()
    renderPage()
    statusBar.replaceChildren(el('span', '', landscape ? 'ალბომური' : 'წიგნური'), el('span', '', `სვეტები: ${cols}`), el('span', '', status))
  }

  // კლავიშთა კომბინაციები (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+C, Ctrl+V, Ctrl+L/E/R/J)
  stage.tabIndex = 0
  stage.addEventListener('keydown', event => {
    if (!(event.ctrlKey || event.metaKey)) return
    const k = event.key.toLowerCase()
    const map: Record<string, () => void> = {
      b: () => apply(x => (x.bold = !x.bold), 'bold'),
      i: () => apply(x => (x.italic = !x.italic), 'italic'),
      u: () => apply(x => (x.underline = !x.underline), 'underline'),
      l: () => apply(x => (x.align = 'left'), 'align:left'),
      e: () => apply(x => (x.align = 'center'), 'align:center'),
      r: () => apply(x => (x.align = 'right'), 'align:right'),
      j: () => apply(x => (x.align = 'justify'), 'align:justify'),
      c: () => {
        if (!need()) return
        clipboard = { ...sel! }
        status = '📋 დაკოპირდა (Ctrl+C)'
        render()
        emit('copy')
      },
      v: () => {
        if (clipboard) insert({ ...clipboard }, 'paste')
      },
      s: () => {
        status = '💾 ფაილი შეინახა (Ctrl+S)'
        render()
        emit('save:docx')
      },
    }
    const fn = map[k]
    if (!fn) return
    event.preventDefault()
    event.stopPropagation()
    // ფორმატირებას და კოპირებას მონიშნული ტექსტი სჭირდება
    if (k !== 's' && k !== 'v' && !need()) return
    if (k === 'v' && !clipboard) return ctx.say('🤔 ჯერ რამე დააკოპირე (Ctrl+C).', 'warn')
    fn()
    emit(`key:ctrl+${k}`)
  })
  stage.addEventListener('keyup', e => e.stopPropagation())

  render()
}
