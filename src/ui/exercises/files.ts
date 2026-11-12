import type { SimTask } from '../../content/topics'
import { btn, css, el, guardKeys, taskRunner, EMOJI_FONT, type ExerciseCtx } from './dom'

/**
 * OneDrive-ის მსგავსი ღრუბელი: საქაღალდის შექმნა, ატვირთვა, ფაილის საქაღალდეში გადატანა,
 * ძებნა, ჩამოტვირთვა, გაზიარება (ნახვა / რედაქტირება), სხვა მოწყობილობიდან გახსნა.
 *
 * მოვლენები: select, folder:<სახელი>, folder, upload, move, moved-all, search, download, share:view, share:edit, device
 */

interface CloudFile {
  icon: string
  name: string
  folder: string | null
}

interface FilesConfig {
  /** ატვირთვისთვის მზა ფაილები კომპიუტერში */
  local?: [string, string][]
  /** ღრუბელში უკვე არსებული ფაილები */
  cloud?: [string, string][]
  /** საქაღალდეები, რომლებიც უკვე არსებობს */
  folders?: string[]
  /** ფაილის სახელის დასაწყისი → საქაღალდე (moved-all-ისთვის) */
  sortRule?: Record<string, string>
  share?: boolean
  device?: boolean
}

css(
  'files',
  `
.fl { display: flex; height: var(--ex-h, 320px); border-radius: 14px; overflow: hidden; border: 3px solid #26364a; background: #fff; font-size: 13px; color: #1d2733; font-family: Arial, ${EMOJI_FONT}; }
.fl * { box-sizing: border-box; }
.fl button { font: inherit; cursor: pointer; }
.fl-side { flex: 0 0 140px; display: flex; flex-direction: column; gap: 5px; padding: 8px; background: #0f5aa8; color: #fff; }
.fl-logo { font-weight: 900; font-size: 14px; }
.fl-pc { margin-top: auto; padding: 6px; border-radius: 9px; background: rgba(255,255,255,0.15); font-size: 12px; }
.fl-pc-title { font-weight: 900; margin-bottom: 4px; }
.fl-local { display: flex; gap: 4px; align-items: center; width: 100%; border: 0; border-radius: 7px; padding: 4px 6px; margin-top: 3px; background: rgba(255,255,255,0.9); color: #1d2733; text-align: left; font-size: 12px; font-weight: 700; }
.fl-local:hover { background: #ffe07d; }
.fl-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; overflow-y: auto; }
.fl-bar { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; }
.fl-act { border: 2px solid #c9d6e4; border-radius: 9px; background: #fff; padding: 5px 9px; font-weight: 800; }
.fl-act:hover { border-color: #0f5aa8; }
.fl-act.main { background: #0f5aa8; border-color: #0f5aa8; color: #fff; }
.fl-act:disabled { opacity: 0.45; cursor: default; }
.fl-in { flex: 1; min-width: 80px; padding: 5px 8px; border: 2px solid #c9d6e4; border-radius: 9px; font: inherit; }
.fl-path { font-weight: 900; color: #0f5aa8; }
.fl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 6px; }
.fl-item { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 4px; border: 2px solid transparent; border-radius: 10px; background: #f3f7fb; text-align: center; font-size: 12px; font-weight: 700; word-break: break-word; }
.fl-item:hover { border-color: #9dbfe0; }
.fl-item.sel { border-color: #f0a51c; background: #fff3cf; }
.fl-item span:first-child { font-size: 28px; line-height: 1.1; }
.fl-empty { color: #6b7c8f; font-weight: 700; padding: 10px; text-align: center; }
.fl-pop { position: relative; padding: 8px; border-radius: 10px; border: 2px solid #0f5aa8; background: #eef5ff; display: grid; gap: 5px; }
.fl-note { padding: 5px 9px; border-radius: 9px; background: #e3f8ea; border: 1px solid #a9dcbc; font-weight: 800; color: #1f7a45; }
`,
)

export function filesSim(host: HTMLElement, tasks: SimTask[], config: FilesConfig, ctx: ExerciseCtx) {
  const wrap = el('div', 'ex-simwrap')
  const stage = el('div', 'ex-stage fl')
  wrap.appendChild(stage)
  host.appendChild(wrap)
  const runner = taskRunner(wrap, tasks, ctx)

  const local = (config.local ?? []).map(([icon, name]) => ({ icon, name, up: false }))
  const files: CloudFile[] = (config.cloud ?? []).map(([icon, name]) => ({ icon, name, folder: null }))
  const folders: string[] = [...(config.folders ?? [])]
  let at: string | null = null
  let selected: CloudFile | null = null
  let query = ''
  let panel: 'none' | 'folder' | 'share' | 'move' = 'none'
  let note = ''

  const side = el('div', 'fl-side')
  const main = el('div', 'fl-main')
  stage.append(side, main)

  const checkSorted = () => {
    if (!config.sortRule) return
    const ok = files.every(f => {
      const rule = Object.entries(config.sortRule!).find(([prefix]) => f.name.startsWith(prefix))
      return !rule || f.folder === rule[1]
    })
    if (ok) runner.emit('moved-all')
  }

  const render = () => {
    side.replaceChildren(el('div', 'fl-logo', '☁️ OneDrive'))
    side.appendChild(
      btn('fl-act', '🏠 ჩემი ფაილები', () => {
        at = null
        selected = null
        panel = 'none'
        render()
      }),
    )
    if (config.device) {
      const dev = btn('fl-act', '📱 გახსენი ტელეფონიდან', () => {
        note = '📱 ტელეფონზე შეხვედი შენს ანგარიშში — იგივე ფაილები ჩანს! ღრუბელში შენახულს ნებისმიერი მოწყობილობიდან ვხსნით, სადაც ინტერნეტია.'
        runner.emit('device')
        render()
      })
      side.appendChild(dev)
    }
    if (local.length) {
      const pc = el('div', 'fl-pc')
      pc.appendChild(el('div', 'fl-pc-title', '💻 ჩემი კომპიუტერი'))
      local.forEach(f =>
        pc.appendChild(
          btn('fl-local', `${f.up ? '✅' : '⬆️'} ${f.icon} ${f.name}`, () => {
            if (f.up) return
            f.up = true
            files.push({ icon: f.icon, name: f.name, folder: at })
            note = `⬆️ ფაილი „${f.name}“ აიტვირთა ღრუბელში.`
            runner.emit('upload')
            render()
          }),
        ),
      )
      side.appendChild(pc)
    }

    main.replaceChildren()
    const bar = el('div', 'fl-bar')
    bar.appendChild(el('span', 'fl-path', at ? `📁 ${at}` : '🏠 ჩემი ფაილები'))
    const search = el('input', 'fl-in')
    search.placeholder = '🔎 ძებნა...'
    search.value = query
    guardKeys(search)
    search.addEventListener('input', () => {
      query = search.value
      if (query.trim().length >= 2) runner.emit('search')
      renderGrid()
    })
    bar.appendChild(search)
    main.appendChild(bar)

    const actions = el('div', 'fl-bar')
    if (!at) actions.appendChild(btn('fl-act main', '➕ ახალი საქაღალდე', () => ((panel = 'folder'), render())))
    const sel = !!selected
    const dl = btn('fl-act', '⬇️ ჩამოტვირთვა', () => {
      note = `⬇️ „${selected!.name}“ ჩამოიტვირთა კომპიუტერში.`
      runner.emit('download')
      render()
    })
    dl.disabled = !sel
    const mv = btn('fl-act', '📂 გადატანა', () => ((panel = 'move'), render()))
    mv.disabled = !sel || folders.length === 0
    actions.append(dl, mv)
    if (config.share) {
      const sh = btn('fl-act', '🔗 გაზიარება', () => ((panel = 'share'), render()))
      sh.disabled = !sel
      actions.appendChild(sh)
    }
    main.appendChild(actions)

    if (panel === 'folder') {
      const pop = el('div', 'fl-pop')
      const row = el('div', 'fl-bar')
      const name = el('input', 'fl-in')
      name.placeholder = 'საქაღალდის სახელი'
      guardKeys(name)
      const create = () => {
        const n = name.value.trim()
        if (!n) return
        if (!folders.includes(n)) folders.push(n)
        panel = 'none'
        note = `📁 შეიქმნა საქაღალდე „${n}“.`
        runner.emit(`folder:${n.toLowerCase()}`)
        runner.emit('folder')
        render()
      }
      name.addEventListener('keydown', e => {
        if (e.key === 'Enter') create()
      })
      row.append(name, btn('fl-act main', 'შექმნა', create))
      pop.append(el('div', '', 'ახალი საქაღალდე'), row)
      main.appendChild(pop)
      setTimeout(() => name.focus(), 0)
    } else if (panel === 'move' && selected) {
      const pop = el('div', 'fl-pop')
      pop.appendChild(el('div', '', `სად გადავიტანოთ „${selected.name}“?`))
      const row = el('div', 'fl-bar')
      folders.forEach(f =>
        row.appendChild(
          btn('fl-act', `📁 ${f}`, () => {
            selected!.folder = f
            note = `📂 „${selected!.name}“ გადავიდა საქაღალდეში „${f}“.`
            selected = null
            panel = 'none'
            runner.emit('move')
            checkSorted()
            render()
          }),
        ),
      )
      pop.appendChild(row)
      main.appendChild(pop)
    } else if (panel === 'share' && selected) {
      const pop = el('div', 'fl-pop')
      pop.appendChild(el('div', '', `🔗 როგორ გავუზიაროთ „${selected.name}“ თანაკლასელს?`))
      const row = el('div', 'fl-bar')
      row.append(
        btn('fl-act', '👁️ მხოლოდ ნახვა', () => {
          note = '👁️ თანაკლასელი ფაილს **ნახავს**, მაგრამ ვერ შეცვლის.'
          panel = 'none'
          runner.emit('share:view')
          render()
        }),
        btn('fl-act', '✏️ რედაქტირება', () => {
          note = '✏️ თანაკლასელს ფაილის **შეცვლაც** შეეძლება — ერთად ვიმუშავებთ.'
          panel = 'none'
          runner.emit('share:edit')
          render()
        }),
      )
      pop.appendChild(row)
      main.appendChild(pop)
    }

    if (note) {
      const n = el('div', 'fl-note ex-pop', note)
      main.appendChild(n)
    }
    const grid = el('div', 'fl-grid')
    main.appendChild(grid)
    const renderGrid = () => {
      grid.replaceChildren()
      const q = query.trim().toLowerCase()
      const shownFolders = at || q ? [] : folders
      const shownFiles = q ? files.filter(f => f.name.toLowerCase().includes(q)) : files.filter(f => f.folder === at)
      shownFolders.forEach(f => {
        const item = btn('fl-item', '', () => {
          at = f
          selected = null
          panel = 'none'
          note = ''
          render()
        })
        item.append(el('span', '', '📁'), el('span', '', f))
        grid.appendChild(item)
      })
      shownFiles.forEach(f => {
        const item = btn(`fl-item${selected === f ? ' sel' : ''}`, '', () => {
          selected = selected === f ? null : f
          panel = 'none'
          render()
          if (selected) runner.emit('select')
        })
        item.append(el('span', '', f.icon), el('span', '', f.name))
        grid.appendChild(item)
      })
      if (!shownFolders.length && !shownFiles.length) grid.appendChild(el('div', 'fl-empty', q ? 'ვერაფერი მოიძებნა' : 'აქ ჯერ არაფერია'))
    }
    renderGrid()
  }
  render()
}
