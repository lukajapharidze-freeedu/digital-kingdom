import type { SimTask } from '../../content/topics'

/** სავარჯიშოების საერთო დამხმარეები: ელემენტები, ტექსტი, სტილები, დავალებების სია */

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) rich(node, text)
  return node
}

/** ტექსტი, სადაც **ორმაგ ვარსკვლავებს** შორის სიტყვები მონიშნულად ჩანს */
export function rich(parent: HTMLElement, text: string) {
  parent.replaceChildren()
  text.split('**').forEach((part, index) => {
    if (!part) return
    if (index % 2 === 1) {
      const strong = document.createElement('strong')
      strong.className = 'ex-strong'
      strong.textContent = part
      parent.appendChild(strong)
    } else {
      parent.appendChild(document.createTextNode(part))
    }
  })
}

export function btn(className: string, text: string, onClick: () => void): HTMLButtonElement {
  const node = el('button', className, text)
  node.type = 'button'
  node.addEventListener('click', onClick)
  return node
}

/** არეული რიგი (თუ შესაძლებელია — საწყისისგან განსხვავებული) */
export function shuffle<T>(list: readonly T[]): T[] {
  const out = [...list]
  for (let attempt = 0; attempt < 6; attempt++) {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    if (out.length < 2 || out.some((item, index) => item !== list[index])) break
  }
  return out
}

/** მოკლე „შეცდომის“ ანიმაცია */
export function shake(node: HTMLElement) {
  node.classList.remove('ex-shake')
  void node.offsetWidth
  node.classList.add('ex-shake')
}

/** თამაშის კლავიშები (WASD, E, SPACE...) ველში აკრეფისას არ უნდა ამუშავდეს */
export function guardKeys(input: HTMLElement) {
  input.addEventListener('keydown', event => {
    if (event.code !== 'Escape') event.stopPropagation()
  })
  input.addEventListener('keyup', event => event.stopPropagation())
  input.addEventListener('keypress', event => event.stopPropagation())
}

export type Tone = 'info' | 'good' | 'warn'

export interface ExerciseCtx {
  /** ახსნა/მინიშნება სავარჯიშოს ქვეშ */
  say(text: string, tone?: Tone): void
  /** სავარჯიშო დასრულდა */
  done(): void
}

const injected = new Set<string>()

/** სტილების ერთჯერადი ჩამატება დოკუმენტში */
export function css(id: string, text: string) {
  if (injected.has(id)) return
  injected.add(id)
  const style = document.createElement('style')
  style.dataset.ex = id
  style.textContent = text
  document.head.appendChild(style)
}

export const EMOJI_FONT = `'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`

css(
  'base',
  `
.ex { margin: 0.5em 0 0.4em; --ex-h: clamp(250px, calc(100vh - 412px), 400px); }
.ex-strong { font-weight: 800; color: #17406f; background: linear-gradient(transparent 58%, #ffe08a 58%); padding: 0 2px; border-radius: 3px; }
.ex-chip {
  font: inherit; font-weight: 700; color: #26364a; line-height: 1.35;
  padding: 0.5em 0.85em; min-height: 2.7em; border-radius: 14px;
  border: 2px solid #c3d2e2; border-bottom-width: 4px; background: #ffffff;
  cursor: pointer; text-align: center; transition: transform 0.08s, background 0.15s, border-color 0.15s;
  font-family: Arial, ${EMOJI_FONT};
}
.ex-chip:hover:not(:disabled) { border-color: #3d86c6; transform: translateY(-1px); }
.ex-chip.sel { border-color: #f0a51c; background: #fff3cf; }
.ex-chip.ok { border-color: #38a169; background: #e3f8ea; color: #1f6b3e; cursor: default; }
.ex-chip.no { border-color: #e2b4b4; background: #fbeeee; color: #9b6a6a; cursor: default; }
.ex-chip:disabled { cursor: default; }
.ex-chip.used { opacity: 0.35; }
.ex-row { display: flex; flex-wrap: wrap; gap: 0.5em; justify-content: center; }
.ex-q { font-weight: 800; color: #315b88; margin: 0 0 0.45em; text-align: center; }
.ex-say {
  margin-top: 0.55em; padding: 0.45em 0.8em; min-height: 1.7em; border-radius: 12px;
  border-left: 5px solid #3d86c6; background: #eef5ff; line-height: 1.5; font-size: 0.95em;
}
.ex-say.good { border-left-color: #38a169; background: #e6f9ec; }
.ex-say.warn { border-left-color: #e39a2d; background: #fff4de; }
.ex-shake { animation: ex-shake 0.35s; }
@keyframes ex-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-7px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
.ex-pop { animation: ex-pop 0.3s; }
@keyframes ex-pop { 0% { transform: scale(0.85); opacity: 0.4; } 100% { transform: scale(1); opacity: 1; } }

/* სიმულატორი + დავალებების სია გვერდიგვერდ */
.ex-simwrap { display: flex; gap: 0.7em; align-items: stretch; flex-wrap: wrap; }
.ex-simwrap > .ex-stage { flex: 1 1 420px; min-width: 0; }
.ex-tasks { flex: 0 1 250px; min-width: 200px; max-height: var(--ex-h); overflow-y: auto; display: flex; flex-direction: column; gap: 0.35em; font-size: 0.82em; line-height: 1.4; padding-right: 2px; }
.ex-task { flex: 0 0 auto; }
.ex-tasks-title { font-weight: 800; color: #315b88; }
.ex-task { display: flex; gap: 0.45em; padding: 0.4em 0.55em; border-radius: 10px; border: 2px solid #dbe5ef; background: #f7fafd; color: #7b8a9a; }
.ex-task.now { border-color: #f0a51c; background: #fff6d8; color: #26364a; font-weight: 700; }
.ex-task.ok { border-color: #bfe6cd; background: #eefaf2; color: #2a7a4b; }
.ex-task-mark { flex: 0 0 1.3em; text-align: center; font-family: ${EMOJI_FONT}; }
`,
)

export interface TaskRunner {
  /** მოვლენა სიმულატორიდან: თუ მიმდინარე დავალებას ემთხვევა, ის სრულდება */
  emit(event: string): void
  /** მდგომარეობის შემოწმება: სრულდება ყველა მომდევნო დავალება, რომელიც უკვე მართალია */
  check(test: (event: string) => boolean): void
  current(): SimTask | null
}

function eventMatches(pattern: string, event: string): boolean {
  return pattern.split('|').some(p => (p.endsWith('*') ? event.startsWith(p.slice(0, -1)) : p === event))
}

/**
 * დავალებების სია სიმულატორის გვერდით. დავალებები რიგით სრულდება;
 * ყოველი შესრულებისას ჩნდება მისი ახსნა (note), ბოლოს — ctx.done().
 */
export function taskRunner(host: HTMLElement, tasks: SimTask[], ctx: ExerciseCtx): TaskRunner {
  const box = el('div', 'ex-tasks')
  box.appendChild(el('div', 'ex-tasks-title', '📋 დავალებები'))
  const rows = tasks.map(task => {
    const rowEl = el('div', 'ex-task')
    const mark = el('span', 'ex-task-mark', '○')
    const text = el('span', '', task.text)
    rowEl.append(mark, text)
    box.appendChild(rowEl)
    return { rowEl, mark }
  })
  host.appendChild(box)

  let index = 0
  const paint = () => {
    rows.forEach((r, i) => {
      r.rowEl.className = `ex-task${i < index ? ' ok' : i === index ? ' now' : ''}`
      r.mark.textContent = i < index ? '✅' : i === index ? '👉' : '○'
    })
    // მიმდინარე დავალება ყოველთვის ჩანს (სია თვითონ ჩაისქროლება)
    const now = rows[Math.min(index, rows.length - 1)]?.rowEl
    if (now) box.scrollTop = Math.max(0, now.offsetTop - box.offsetTop - 34)
  }
  paint()
  if (tasks.length === 0) ctx.done()

  const complete = () => {
    const task = tasks[index]
    index += 1
    paint()
    rows[index - 1].rowEl.classList.add('ex-pop')
    if (index >= tasks.length) {
      ctx.say(`${task.note ?? '✅ შესრულდა!'} 🎉 ყველა დავალება შესრულებულია!`, 'good')
      ctx.done()
    } else {
      ctx.say(task.note ?? '✅ შესრულდა! გადადი შემდეგ დავალებაზე.', 'good')
    }
  }

  return {
    emit(event) {
      const task = tasks[index]
      if (task && eventMatches(task.event, event)) complete()
    },
    check(test) {
      while (index < tasks.length && tasks[index].event.split('|').some(test)) complete()
    },
    current: () => tasks[index] ?? null,
  }
}
