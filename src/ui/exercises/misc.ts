import type { SimTask } from '../../content/topics'
import { btn, css, el, taskRunner, type ExerciseCtx } from './dom'

/** პატარა სიმულატორები */

css(
  'misc',
  `
.ab { padding: 18px 16px; border-radius: 14px; border: 3px solid #7a4a1e; background: linear-gradient(180deg, #f3dfc1, #e6c79a); }
.ab-rod { position: relative; height: 54px; margin: 6px 0; display: flex; align-items: center; justify-content: space-between; }
.ab-rod::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 6px; margin-top: -3px; border-radius: 3px; background: #7a4a1e; }
.ab-side { position: relative; display: flex; gap: 3px; min-height: 44px; }
.ab-bead { width: 40px; height: 44px; border-radius: 50%; border: 3px solid rgba(0,0,0,0.25); cursor: pointer; padding: 0; box-shadow: inset -4px -5px 0 rgba(0,0,0,0.15); }
.ab-bead:hover { transform: scale(1.08); }
.ab-count { text-align: center; font-weight: 900; font-size: 1.3em; color: #5a3310; }
`,
)

/** აბაკი: ერთი ღერძი 10 მძივით. დავალებები: count:<n> — მარცხნივ გადაწეული მძივების რაოდენობა */
export function abacusSim(host: HTMLElement, tasks: SimTask[], _config: unknown, ctx: ExerciseCtx) {
  const wrap = el('div', 'ex-simwrap')
  const stage = el('div', 'ex-stage ab')
  wrap.appendChild(stage)
  host.appendChild(wrap)
  const runner = taskRunner(wrap, tasks, ctx)

  let count = 0
  const colors = ['#e2453c', '#e2453c', '#e2453c', '#e2453c', '#e2453c', '#2f7fd6', '#2f7fd6', '#2f7fd6', '#2f7fd6', '#2f7fd6']
  const rod = el('div', 'ab-rod')
  const left = el('div', 'ab-side')
  const right = el('div', 'ab-side')
  rod.append(left, right)
  const label = el('div', 'ab-count')
  stage.append(el('div', 'ab-count', '🧮 აბაკი'), rod, label)

  const render = () => {
    left.replaceChildren()
    right.replaceChildren()
    colors.forEach((color, i) => {
      const moved = i < count
      const bead = btn('ab-bead', '', () => {
        // მძივს რომ გადავწევთ, მასთან ერთად გადადის ყველა, რაც გზაზეა
        count = moved ? i : i + 1
        render()
        runner.check(event => event === `count:${count}`)
      })
      bead.style.background = color
      ;(moved ? left : right).appendChild(bead)
    })
    label.textContent = `გადაწეულია: ${count} მძივი`
  }
  render()
}
