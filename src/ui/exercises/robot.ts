import type { SimTask } from '../../content/topics'
import { btn, css, el, taskRunner, EMOJI_FONT, type ExerciseCtx } from './dom'

/**
 * პროგრამა ისრებით: მოსწავლე ისრებისგან აწყობს პროგრამას და გმირი მას უჯრებზე ასრულებს.
 *
 * config:
 *  cols, rows, start, goal — ბადე და წერტილები ([სვეტი, სტრიქონი], 0-დან);
 *  walls — დაბრკოლებები, stars — შესაგროვებელი ⭐;
 *  hero, goalIcon, wallIcon — ხატულები;
 *  repeat — პროგრამის ნაბიჯზე დაწკაპუნებით ის მეორდება (×2, ×3...);
 *  program + predict — მზა პროგრამა: მოსწავლე წინასწარ ირჩევს უჯრას, სადაც გმირი გაჩერდება.
 *
 * მოვლენები: run, goal, goal:loop (მიზანი გამეორების გამოყენებით), goal:short (≤ maxLen ბრძანება), predicted
 */

type Dir = 'up' | 'down' | 'left' | 'right'
type Cell = [number, number]

interface RobotConfig {
  cols?: number
  rows?: number
  start?: Cell
  goal?: Cell
  walls?: Cell[]
  stars?: Cell[]
  hero?: string
  goalIcon?: string
  wallIcon?: string
  repeat?: boolean
  maxLen?: number
  program?: (Dir | [Dir, number])[]
  predict?: boolean
}

const ARROW: Record<Dir, string> = { up: '⬆️', down: '⬇️', left: '⬅️', right: '➡️' }
const DELTA: Record<Dir, Cell> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }

css(
  'robot',
  `
.rb { display: flex; flex-direction: column; gap: 8px; padding: 10px; border-radius: 14px; border: 3px solid #26364a; background: linear-gradient(180deg, #eaf7ee, #f8fbff); font-family: Arial, ${EMOJI_FONT}; min-height: var(--ex-h, 300px); box-sizing: border-box; }
.rb-top { display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; flex: 1; }
.rb-grid { display: grid; gap: 3px; padding: 5px; border-radius: 10px; background: #b9d8c2; }
.rb-cell { width: 44px; height: 44px; border-radius: 7px; background: #f4fbf6; border: 0; padding: 0; font-size: 26px; line-height: 44px; text-align: center; font-family: ${EMOJI_FONT}; }
button.rb-cell { cursor: pointer; }
button.rb-cell:hover { background: #fff3cf; }
.rb-cell.wall { background: #cfe6f7; }
.rb-cell.pick { background: #ffe08a; box-shadow: inset 0 0 0 3px #f0a51c; }
.rb-cell.trail { background: #dff5e7; }
.rb-pad { display: grid; grid-template-columns: repeat(3, 46px); grid-template-rows: repeat(2, 46px); gap: 4px; }
.rb-key { border: 2px solid #9dbfe0; border-bottom-width: 4px; border-radius: 10px; background: #fff; font-size: 22px; cursor: pointer; padding: 0; font-family: ${EMOJI_FONT}; }
.rb-key:hover { border-color: #3d86c6; background: #eef5ff; }
.rb-prog { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; min-height: 44px; padding: 5px 8px; border-radius: 10px; background: #fff; border: 2px dashed #9dbfe0; }
.rb-prog-label { font-size: 12px; font-weight: 800; color: #536579; margin-right: 4px; }
.rb-step { position: relative; min-width: 36px; height: 34px; border-radius: 8px; border: 2px solid #c3d2e2; background: #f6f9fc; font-size: 18px; padding: 0 4px; font-family: ${EMOJI_FONT}; font-weight: 800; color: #17406f; }
button.rb-step { cursor: pointer; }
.rb-step.now { border-color: #f0a51c; background: #fff3cf; }
.rb-btns { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.rb-act { border: 0; border-radius: 10px; padding: 7px 14px; color: #fff; font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 3px 0 rgba(0,0,0,0.15); background: #6b7c8f; }
.rb-act.go { background: #27834a; }
.rb-act:disabled { opacity: 0.5; cursor: default; }
`,
)

export function robotSim(host: HTMLElement, tasks: SimTask[], config: RobotConfig, ctx: ExerciseCtx) {
  const cols = config.cols ?? 5
  const rows = config.rows ?? 4
  const start: Cell = config.start ?? [0, rows - 1]
  const goal: Cell = config.goal ?? [cols - 1, 0]
  const walls = config.walls ?? []
  const stars = config.stars ?? []
  const hero = config.hero ?? '🤖'
  const fixed = !!config.program

  const wrap = el('div', 'ex-simwrap')
  const stage = el('div', 'ex-stage rb')
  wrap.appendChild(stage)
  host.appendChild(wrap)
  const runner = taskRunner(wrap, tasks, ctx)

  const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1]
  let program: { dir: Dir; n: number }[] = (config.program ?? []).map(p => (Array.isArray(p) ? { dir: p[0], n: p[1] } : { dir: p, n: 1 }))
  let pos: Cell = [...start]
  let taken: Cell[] = []
  let trail: Cell[] = []
  let running = false
  let active = -1
  let guess: Cell | null = null

  const top = el('div', 'rb-top')
  const grid = el('div', 'rb-grid')
  grid.style.gridTemplateColumns = `repeat(${cols}, 44px)`
  const progBox = el('div', 'rb-prog')
  const buttons = el('div', 'rb-btns')
  top.appendChild(grid)
  stage.append(top, progBox, buttons)

  const renderGrid = () => {
    grid.replaceChildren()
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const here: Cell = [c, r]
        const isWall = walls.some(w => same(w, here))
        const clickable = !!config.predict && !running && !isWall
        const cell = clickable ? el('button', 'rb-cell') : el('div', 'rb-cell')
        if (clickable) {
          ;(cell as HTMLButtonElement).type = 'button'
          cell.addEventListener('click', () => {
            guess = here
            renderGrid()
            ctx.say('👍 უჯრა არჩეულია. ახლა დააჭირე **▶ გაშვება** და შეამოწმე შენი პროგნოზი.')
          })
        }
        if (isWall) cell.classList.add('wall')
        if (trail.some(t => same(t, here))) cell.classList.add('trail')
        if (guess && same(guess, here)) cell.classList.add('pick')
        cell.textContent = same(pos, here)
          ? hero
          : isWall
            ? (config.wallIcon ?? '💧')
            : same(goal, here) && !config.predict
              ? (config.goalIcon ?? '🏁')
              : stars.some(s => same(s, here)) && !taken.some(s => same(s, here))
                ? '⭐'
                : ''
        grid.appendChild(cell)
      }
    }
  }

  const renderProgram = () => {
    progBox.replaceChildren(el('span', 'rb-prog-label', 'პროგრამა:'))
    if (program.length === 0) progBox.appendChild(el('span', 'rb-prog-label', 'ჯერ ცარიელია — დაამატე ისრები'))
    program.forEach((step, i) => {
      const label = `${ARROW[step.dir]}${step.n > 1 ? ` ×${step.n}` : ''}`
      const canRepeat = !!config.repeat && !fixed && !running
      const node = canRepeat ? el('button', 'rb-step') : el('span', 'rb-step')
      node.textContent = label
      if (!canRepeat) node.style.cssText = 'display: inline-flex; align-items: center; justify-content: center;'
      if (i === active) node.classList.add('now')
      if (canRepeat) {
        ;(node as HTMLButtonElement).type = 'button'
        node.title = 'დააწკაპუნე — გამეორდება'
        node.addEventListener('click', () => {
          step.n = step.n >= 6 ? 1 : step.n + 1
          renderProgram()
        })
      }
      progBox.appendChild(node)
    })
  }

  const reset = () => {
    pos = [...start]
    taken = []
    trail = []
    active = -1
  }

  const finish = (crashed: string | null) => {
    running = false
    active = -1
    go.disabled = false
    renderProgram()
    runner.emit('run')
    if (config.predict) {
      if (guess && same(guess, pos)) {
        ctx.say('🎉 შენი პროგნოზი სწორია! გმირი ზუსტად იქ გაჩერდა.', 'good')
        runner.emit('predicted')
      } else {
        ctx.say('🤔 გმირი სხვა უჯრაზე გაჩერდა. მიჰყევი ისრებს თითით სათითაოდ და სცადე კიდევ.', 'warn')
        setTimeout(() => {
          if (running || !stage.isConnected) return
          reset()
          guess = null
          renderGrid()
        }, 1600)
      }
      renderGrid()
      return
    }
    if (crashed) {
      ctx.say(crashed, 'warn')
      return
    }
    const allStars = stars.every(s => taken.some(t => same(t, s)))
    if (same(pos, goal) && allStars) {
      const count = program.length
      runner.emit('goal')
      if (program.some(s => s.n > 1)) runner.emit('goal:loop')
      if (config.maxLen && count <= config.maxLen) runner.emit('goal:short')
      else if (config.maxLen && runner.current()?.event === 'goal:short') {
        ctx.say(`👍 მიზანს მიაღწიე, მაგრამ ${count} ბრძანებით. სცადე არაუმეტეს ${config.maxLen} ბრძანებით — გამოიყენე გამეორება!`, 'warn')
      } else if (runner.current()?.event === 'goal:loop') {
        ctx.say('👍 მიზანს მიაღწიე! ახლა სცადე გამეორებით: დააწკაპუნე პროგრამაში ისარს და ის ×2, ×3 გახდება.', 'warn')
      }
    } else if (same(pos, goal)) {
      ctx.say('🤔 მიზანთან მიხვედი, მაგრამ ყველა ⭐ არ შეგიგროვებია.', 'warn')
    } else {
      ctx.say('🤔 გმირი მიზნამდე ვერ მივიდა. შეასწორე პროგრამა და ისევ გაუშვი.', 'warn')
    }
  }

  const run = () => {
    if (running) return
    if (program.length === 0) return ctx.say('🤔 პროგრამა ცარიელია. ჯერ ისრები დაამატე.', 'warn')
    if (config.predict && !guess) return ctx.say('🤔 ჯერ დააწკაპუნე უჯრას, სადაც შენი აზრით გმირი გაჩერდება.', 'warn')
    reset()
    running = true
    go.disabled = true
    const flat: { dir: Dir; index: number }[] = []
    program.forEach((s, index) => {
      for (let k = 0; k < s.n; k++) flat.push({ dir: s.dir, index })
    })
    let i = 0
    renderGrid()
    const tick = () => {
      if (!stage.isConnected) return
      if (i >= flat.length) return finish(null)
      const { dir, index } = flat[i++]
      active = index
      const next: Cell = [pos[0] + DELTA[dir][0], pos[1] + DELTA[dir][1]]
      if (next[0] < 0 || next[1] < 0 || next[0] >= cols || next[1] >= rows) {
        renderProgram()
        return finish('💥 გმირი მოედნიდან გავიდა! შეასწორე პროგრამა.')
      }
      if (walls.some(w => same(w, next))) {
        renderProgram()
        return finish('💥 გზაზე დაბრკოლებაა! მას გვერდი უნდა აუარო.')
      }
      trail.push(pos)
      pos = next
      const star = stars.find(s => same(s, pos))
      if (star && !taken.some(t => same(t, star))) taken.push(star)
      renderGrid()
      renderProgram()
      setTimeout(tick, 380)
    }
    setTimeout(tick, 250)
  }

  const go = btn('rb-act go', '▶ გაშვება', run)
  buttons.appendChild(go)

  if (!fixed) {
    const pad = el('div', 'rb-pad')
    const add = (dir: Dir) => {
      if (running) return
      if (program.length >= 14) return ctx.say('🤔 პროგრამა ძალიან გრძელია. წაშალე რამე ან გამოიყენე გამეორება.', 'warn')
      program.push({ dir, n: 1 })
      renderProgram()
    }
    const key = (dir: Dir) => {
      const node = btn('rb-key', '', () => add(dir))
      node.textContent = ARROW[dir]
      return node
    }
    pad.append(el('span'), key('up'), el('span'), key('left'), key('down'), key('right'))
    top.appendChild(pad)
    buttons.append(
      btn('rb-act', '⌫ ბოლოს წაშლა', () => {
        if (running) return
        program.pop()
        renderProgram()
      }),
      btn('rb-act', '🗑️ თავიდან', () => {
        if (running) return
        program = []
        reset()
        renderGrid()
        renderProgram()
      }),
    )
  }

  renderGrid()
  renderProgram()
  ctx.say(
    config.predict
      ? '🔮 წაიკითხე პროგრამა და დააწკაპუნე უჯრას, სადაც გმირი გაჩერდება. მერე გაუშვი.'
      : `👆 ისრებით ააწყვე პროგრამა და დააჭირე **▶ გაშვება**.${config.repeat ? ' პროგრამაში ისარზე დაწკაპუნებით ის მეორდება (×2, ×3...).' : ''}`,
  )
}
