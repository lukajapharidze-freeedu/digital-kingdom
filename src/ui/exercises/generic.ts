import type { Exercise, ExOption } from '../../content/topics'
import { btn, css, el, rich, shake, shuffle, type ExerciseCtx } from './dom'

/** მრავალჯერადი სავარჯიშოები: წყვილები, რიგი, ჯგუფები, არჩევა, სიტყვის ჩასმა, ბარათები, კი/არა */

type Of<K extends Exercise['kind']> = Extract<Exercise, { kind: K }>

css(
  'generic',
  `
.ex-match { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5em 1.2em; align-items: stretch; }
.ex-match .ex-chip { width: 100%; }
.ex-order-list { display: grid; gap: 0.35em; margin: 0 0 0.55em; }
.ex-order-item { display: flex; gap: 0.6em; align-items: flex-start; padding: 0.4em 0.7em; border-radius: 12px; border-left: 5px solid #38a169; background: #eefaf2; line-height: 1.45; }
.ex-order-num { flex: 0 0 1.7em; height: 1.7em; border-radius: 50%; background: #38a169; color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.ex-order-slot { padding: 0.4em 0.7em; border-radius: 12px; border: 2px dashed #c3d2e2; color: #8a9bb0; font-weight: 700; }
.ex-card-now { margin: 0 auto 0.55em; max-width: 30em; padding: 0.6em 1em; border-radius: 16px; border: 3px solid #f0a51c; background: #fff6d8; font-weight: 800; font-size: 1.08em; text-align: center; line-height: 1.4; }
.ex-count { text-align: center; color: #6b7c8f; font-size: 0.82em; font-weight: 700; margin-bottom: 0.3em; }
.ex-groups { display: grid; gap: 0.6em; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.ex-group { font: inherit; text-align: center; cursor: pointer; padding: 0.5em 0.6em; border-radius: 16px; border: 3px solid #9dbfe0; background: #f1f7ff; min-height: 5.2em; color: #26364a; }
.ex-group:hover { border-color: #3d86c6; background: #e3efff; }
.ex-group-name { font-weight: 800; color: #315b88; margin-bottom: 0.3em; }
.ex-group-items { display: flex; flex-wrap: wrap; gap: 0.3em; justify-content: center; }
.ex-group-item { padding: 0.15em 0.55em; border-radius: 999px; background: #e3f8ea; border: 1px solid #a9dcbc; font-size: 0.82em; font-weight: 700; }
.ex-opts { display: grid; gap: 0.5em; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
.ex-opt { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.15em; min-height: 3.6em; }
.ex-opt-icon { font-size: 1.7em; line-height: 1.1; }
.ex-line { padding: 0.4em 0.7em; border-radius: 12px; border: 2px solid transparent; line-height: 1.7; }
.ex-line.now { border-color: #f0a51c; background: #fffaf0; }
.ex-line.ok { background: #f2fbf5; }
.ex-slot { display: inline-block; min-width: 5em; padding: 0 0.5em; margin: 0 0.15em; border-bottom: 3px solid #f0a51c; border-radius: 6px 6px 0 0; background: #fff3cf; text-align: center; font-weight: 800; color: #17406f; }
.ex-line.ok .ex-slot { border-bottom-color: #38a169; background: #e3f8ea; }
.ex-reveal { display: grid; gap: 0.55em; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
.ex-flip { font: inherit; cursor: pointer; text-align: center; padding: 0.55em 0.7em; border-radius: 16px; border: 3px solid #9dbfe0; background: linear-gradient(135deg, #e8f3ff, #f5fbff); color: #26364a; min-height: 6.4em; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.2em; }
.ex-flip:hover { border-color: #3d86c6; }
.ex-flip.open { border-color: #38a169; background: #ffffff; cursor: default; }
.ex-flip-icon { font-size: 2em; line-height: 1.1; }
.ex-flip-title { font-weight: 800; color: #315b88; }
.ex-flip-text { font-size: 0.86em; line-height: 1.45; }
.ex-flip-hint { font-size: 0.78em; color: #6b7c8f; font-weight: 700; }
.ex-yn-done { display: grid; gap: 0.3em; margin-bottom: 0.5em; }
.ex-yn-row { display: flex; gap: 0.5em; padding: 0.3em 0.7em; border-radius: 10px; background: #f4f8fc; font-size: 0.86em; line-height: 1.45; }
.ex-yn-btns { display: flex; gap: 0.8em; justify-content: center; }
.ex-yn-btns .ex-chip { min-width: 8em; font-size: 1.05em; }
.ex-yn-yes { border-color: #8fd0a6; background: #f0fbf4; }
.ex-yn-no { border-color: #e8b0b0; background: #fdf3f3; }
`,
)

function optionTile(option: ExOption): HTMLButtonElement {
  const tile = btn('ex-chip ex-opt', '', () => {})
  if (option.icon) tile.appendChild(el('span', 'ex-opt-icon', option.icon))
  tile.appendChild(el('span', '', option.text))
  return tile
}

export function matchExercise(host: HTMLElement, ex: Of<'match'>, ctx: ExerciseCtx) {
  const grid = el('div', 'ex-match')
  const lefts = ex.pairs.map(pair => btn('ex-chip', pair.left, () => {}))
  const rightOrder = shuffle(ex.pairs.map((_, i) => i))
  const rights = rightOrder.map(i => btn('ex-chip', ex.pairs[i].right, () => {}))
  let selected = -1
  let solved = 0

  const select = (index: number) => {
    selected = index
    lefts.forEach((b, i) => b.classList.toggle('sel', i === index))
  }
  const selectNext = () => select(lefts.findIndex(b => !b.classList.contains('ok')))

  lefts.forEach((b, i) =>
    b.addEventListener('click', () => {
      if (!b.classList.contains('ok')) select(i)
    }),
  )
  rights.forEach((b, slot) =>
    b.addEventListener('click', () => {
      if (b.classList.contains('ok')) return
      if (selected < 0) return
      const pair = ex.pairs[selected]
      if (ex.pairs[rightOrder[slot]].right === pair.right) {
        lefts[selected].classList.remove('sel')
        lefts[selected].classList.add('ok')
        b.classList.add('ok', 'ex-pop')
        solved += 1
        const note = pair.note ?? `**${pair.left}** — ${pair.right}`
        if (solved === ex.pairs.length) {
          selected = -1
          ctx.say(`✅ ${note}`, 'good')
          ctx.done()
        } else {
          ctx.say(`✅ ${note}`, 'good')
          selectNext()
        }
      } else {
        shake(b)
        ctx.say('🤔 ეს წყვილი არ არის. სცადე სხვა!', 'warn')
      }
    }),
  )

  // სტრიქონებად: მარცხნივ ნიშანი, მარჯვნივ არეული მნიშვნელობები
  ex.pairs.forEach((_, i) => grid.append(lefts[i], rights[i]))
  host.appendChild(grid)
  selectNext()
  ctx.say('👆 მონიშნულია მარცხენა ბარათი. მარჯვნივ იპოვე მისი წყვილი.')
}

export function orderExercise(host: HTMLElement, ex: Of<'order'>, ctx: ExerciseCtx) {
  const list = el('div', 'ex-order-list')
  const slot = el('div', 'ex-order-slot')
  const pool = el('div', 'ex-row')
  let placed = 0

  const paintSlot = () => {
    if (placed >= ex.steps.length) slot.remove()
    else slot.textContent = `${placed + 1}. აირჩიე ქვემოთ: რა არის ${placed === 0 ? 'პირველი' : 'შემდეგი'}?`
  }

  shuffle(ex.steps.map((_, i) => i)).forEach(i => {
    const step = ex.steps[i]
    const chip = btn('ex-chip', step.text, () => {
      if (i !== placed) {
        shake(chip)
        ctx.say(i < placed ? '' : '🤔 ეს ჯერ ადრეა. დაფიქრდი, რა ხდება მანამდე.', 'warn')
        return
      }
      chip.remove()
      const item = el('div', 'ex-order-item ex-pop')
      item.appendChild(el('span', 'ex-order-num', String(placed + 1)))
      const text = el('div')
      rich(text, step.note ? `**${step.text}** — ${step.note}` : step.text)
      item.appendChild(text)
      list.insertBefore(item, slot)
      placed += 1
      paintSlot()
      if (placed === ex.steps.length) {
        ctx.say('🎉 ყველაფერი სწორი რიგითაა!', 'good')
        ctx.done()
      } else {
        ctx.say('✅ სწორია! რა არის შემდეგი?', 'good')
      }
    })
    pool.appendChild(chip)
  })

  list.appendChild(slot)
  paintSlot()
  host.append(list, pool)
  ctx.say('👆 დააწკაპუნე ბარათებს სწორი რიგით — პირველიდან ბოლომდე.')
}

export function sortExercise(host: HTMLElement, ex: Of<'sort'>, ctx: ExerciseCtx) {
  const queue = shuffle(ex.items)
  const count = el('div', 'ex-count')
  const now = el('div', 'ex-card-now')
  const groups = el('div', 'ex-groups')
  let index = 0

  const show = () => {
    if (index >= queue.length) {
      now.remove()
      count.remove()
      return
    }
    count.textContent = `ბარათი ${index + 1} / ${queue.length}`
    rich(now, queue[index].text)
    now.classList.remove('ex-pop')
    void now.offsetWidth
    now.classList.add('ex-pop')
  }

  ex.groups.forEach((name, g) => {
    const box = btn('ex-group', '', () => {
      const item = queue[index]
      if (!item) return
      if (item.group !== g) {
        shake(box)
        ctx.say('🤔 არა, ეს სხვა ჯგუფისაა. სცადე კიდევ!', 'warn')
        return
      }
      const pill = el('span', 'ex-group-item ex-pop', item.text)
      items.appendChild(pill)
      index += 1
      const note = item.note ?? `**${item.text}** → ${name}`
      show()
      if (index === queue.length) {
        ctx.say(`✅ ${note} 🎉 ყველა ბარათი თავის ადგილზეა!`, 'good')
        ctx.done()
      } else {
        ctx.say(`✅ ${note}`, 'good')
      }
    })
    box.appendChild(el('div', 'ex-group-name', name))
    const items = el('div', 'ex-group-items')
    box.appendChild(items)
    groups.appendChild(box)
  })

  host.append(count, now, groups)
  show()
  ctx.say('👆 წაიკითხე ბარათი და დააწკაპუნე ჯგუფს, რომელსაც ის ეკუთვნის.')
}

export function pickExercise(host: HTMLElement, ex: Of<'pick'>, ctx: ExerciseCtx) {
  const total = ex.options.filter(o => o.correct).length
  let found = 0
  host.appendChild(el('div', 'ex-q', ex.question))
  const grid = el('div', 'ex-opts')
  shuffle(ex.options).forEach(option => {
    const tile = optionTile(option)
    tile.addEventListener('click', () => {
      if (tile.classList.contains('ok') || tile.classList.contains('no')) return
      if (option.correct) {
        tile.classList.add('ok', 'ex-pop')
        found += 1
        const rest = total - found
        const note = option.note ?? `**${option.text}** — სწორია!`
        if (rest === 0) {
          ctx.say(`✅ ${note} 🎉 ყველა იპოვე!`, 'good')
          ctx.done()
        } else {
          ctx.say(`✅ ${note} (დარჩა კიდევ ${rest})`, 'good')
        }
      } else {
        tile.classList.add('no')
        shake(tile)
        ctx.say(`❌ ${option.note ?? `**${option.text}** — არა, ეს არ არის.`}`, 'warn')
      }
    })
    grid.appendChild(tile)
  })
  host.appendChild(grid)
  ctx.say(total > 1 ? `👆 იპოვე ყველა სწორი ბარათი — სულ ${total}.` : '👆 დააწკაპუნე სწორ ბარათს.')
}

export function blankExercise(host: HTMLElement, ex: Of<'blank'>, ctx: ExerciseCtx) {
  const lines = ex.lines.map(line => {
    const row = el('div', 'ex-line')
    const [before, after = ''] = line.text.split('___')
    const slot = el('span', 'ex-slot', ' ')
    const a = el('span')
    rich(a, before)
    const b = el('span')
    rich(b, after)
    row.append(a, slot, b)
    host.appendChild(row)
    return { row, slot }
  })
  let index = 0
  const paint = () =>
    lines.forEach((l, i) => {
      l.row.className = `ex-line${i < index ? ' ok' : i === index ? ' now' : ''}`
    })

  const pool = el('div', 'ex-row')
  pool.style.marginTop = '0.5em'
  const words = shuffle([...new Set([...ex.lines.map(l => l.answer), ...(ex.extra ?? [])])])
  words.forEach(word => {
    const chip = btn('ex-chip', word, () => {
      const line = ex.lines[index]
      if (!line) return
      if (line.answer !== word) {
        shake(chip)
        ctx.say('🤔 ეს სიტყვა აქ არ ჯდება. სცადე სხვა!', 'warn')
        return
      }
      lines[index].slot.textContent = word
      lines[index].slot.classList.add('ex-pop')
      index += 1
      paint()
      if (!ex.lines.slice(index).some(l => l.answer === word)) {
        chip.disabled = true
        chip.classList.add('used')
      }
      if (index === ex.lines.length) {
        ctx.say(`✅ ${line.note ?? 'სწორია!'} 🎉 ყველა წინადადება შევსებულია!`, 'good')
        ctx.done()
      } else {
        ctx.say(`✅ ${line.note ?? 'სწორია! გადადი შემდეგ წინადადებაზე.'}`, 'good')
      }
    })
    pool.appendChild(chip)
  })
  host.appendChild(pool)
  paint()
  ctx.say('👆 წაიკითხე მონიშნული წინადადება და ქვემოთ აირჩიე გამოტოვებული სიტყვა.')
}

export function revealExercise(host: HTMLElement, ex: Of<'reveal'>, ctx: ExerciseCtx) {
  const grid = el('div', 'ex-reveal')
  const checkBox = el('div')
  checkBox.style.marginTop = '0.6em'
  let opened = 0

  const showCheck = () => {
    const check = ex.check
    if (!check) {
      ctx.say('🎉 ყველა ბარათი გახსენი!', 'good')
      ctx.done()
      return
    }
    checkBox.appendChild(el('div', 'ex-q', `🧠 ${check.question}`))
    const opts = el('div', 'ex-opts')
    shuffle(check.options).forEach(option => {
      const tile = optionTile(option)
      tile.addEventListener('click', () => {
        if (tile.classList.contains('ok') || tile.classList.contains('no')) return
        if (option.correct) {
          tile.classList.add('ok', 'ex-pop')
          ctx.say(`✅ ${option.note ?? 'სწორია!'}`, 'good')
          ctx.done()
        } else {
          tile.classList.add('no')
          shake(tile)
          ctx.say(`❌ ${option.note ?? 'არა. კიდევ ერთხელ გადახედე ბარათებს.'}`, 'warn')
        }
      })
      opts.appendChild(tile)
    })
    checkBox.appendChild(opts)
    ctx.say('👇 ყველა ბარათი გახსენი. ახლა უპასუხე კითხვას.', 'info')
  }

  ex.cards.forEach(card => {
    const tile = btn('ex-flip', '', () => {
      if (tile.classList.contains('open')) return
      tile.classList.add('open', 'ex-pop')
      hint.remove()
      tile.appendChild(el('span', 'ex-flip-text', card.text))
      opened += 1
      if (opened === ex.cards.length) showCheck()
      else ctx.say(`📖 წაიკითხე ბარათი. დარჩა გასახსნელი: ${ex.cards.length - opened}.`)
    })
    const hint = el('span', 'ex-flip-hint', '👆 გახსენი')
    tile.append(el('span', 'ex-flip-icon', card.icon), el('span', 'ex-flip-title', card.title), hint)
    grid.appendChild(tile)
  })
  host.append(grid, checkBox)
  ctx.say('👆 დააწკაპუნე ბარათებს და წაიკითხე, რა წერია თითოეულში.')
}

export function yesnoExercise(host: HTMLElement, ex: Of<'yesno'>, ctx: ExerciseCtx) {
  const doneList = el('div', 'ex-yn-done')
  const count = el('div', 'ex-count')
  const now = el('div', 'ex-card-now')
  const buttons = el('div', 'ex-yn-btns')
  let index = 0

  const show = () => {
    if (index >= ex.items.length) {
      count.remove()
      now.remove()
      buttons.remove()
      return
    }
    count.textContent = `${index + 1} / ${ex.items.length}`
    rich(now, ex.items[index].text)
  }

  const answer = (yes: boolean, button: HTMLElement) => {
    const item = ex.items[index]
    if (!item) return
    if (item.yes !== yes) {
      shake(button)
      ctx.say('🤔 დაფიქრდი კიდევ ერთხელ!', 'warn')
      return
    }
    const rowEl = el('div', 'ex-yn-row ex-pop')
    const text = el('span')
    rich(text, item.note ?? item.text)
    rowEl.append(el('span', '', item.yes ? '✅' : '🚫'), text)
    doneList.appendChild(rowEl)
    index += 1
    show()
    if (index === ex.items.length) {
      ctx.say('🎉 ყველაფერს სწორად უპასუხე!', 'good')
      ctx.done()
    } else {
      ctx.say('✅ სწორია!', 'good')
    }
  }

  const yes = btn('ex-chip ex-yn-yes', ex.yes ?? '✅ კი', () => answer(true, yes))
  const no = btn('ex-chip ex-yn-no', ex.no ?? '🚫 არა', () => answer(false, no))
  buttons.append(yes, no)
  host.append(doneList, count, now, buttons)
  show()
  ctx.say('👆 წაიკითხე ბარათი და აირჩიე პასუხი.')
}
