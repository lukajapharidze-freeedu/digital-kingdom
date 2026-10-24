import type { Grade } from './GradeSelect'
import { ECONOMY, GAMES } from '../progress/economy'
import { gameVisual } from '../progress/gameIcons'
import { decorateCurrency } from './currencyIcons'
import { showGuideModal } from './GuideModal'
import { hasPictureIcon, pictureIconSvg } from './pictureIcons'
import { TEACHER_GRADES, topicsInLessonOrder, type TeacherCodes } from '../content/teacher'
import type { GameState } from '../progress/GameState'
import {
  findTopicByCode,
  isAnswerCorrect,
  questionPrompt,
  roundQuestions,
  topicsForGrade,
  type Topic,
  type TopicPicture,
  type TopicQuestion,
} from '../content/topics'

export type PanelKind = 'library' | 'academy' | 'shop' | 'wallet' | 'codes'

interface PanelsOptions {
  state: GameState
  getGrade: () => Grade
  toast: (text: string) => void
  onClose?: (kind: PanelKind | null) => void
}

const OVERLAY_CSS = `
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(12, 22, 39, 0.76);
  backdrop-filter: blur(8px);
  font-family: Arial, sans-serif;
`

const CARD_CSS = `
  width: min(800px, 100%);
  max-height: 88vh;
  overflow-y: auto;
  box-sizing: border-box;
  padding: 28px;
  border: 2px solid rgba(255,255,255,0.75);
  border-radius: 24px;
  background: linear-gradient(145deg, #fff8e7, #e6f4ff);
  color: #26364a;
  text-align: center;
  box-shadow: 0 24px 80px rgba(0,0,0,0.4);
`

function make<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  css = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (css) node.style.cssText = css
  if (text) node.textContent = text
  return node
}

function button(
  text: string,
  background: string,
  onClick: () => void,
  disabled = false,
): HTMLButtonElement {
  const btn = make(
    'button',
    `
      border: 0;
      border-radius: 12px;
      padding: 12px 18px;
      min-width: 140px;
      background: ${disabled ? '#a9b4c0' : background};
      color: white;
      font-size: 16px;
      font-weight: bold;
      cursor: ${disabled ? 'not-allowed' : 'pointer'};
      box-shadow: 0 4px 0 rgba(0,0,0,0.12);
    `,
    text,
  )
  btn.type = 'button'
  btn.disabled = disabled
  btn.addEventListener('click', () => {
    if (!btn.disabled) onClick()
  })
  return btn
}

const STRONG_CSS = `
  font-weight: 800;
  color: #17406f;
  background: linear-gradient(transparent 58%, #ffe08a 58%);
  padding: 0 2px;
  border-radius: 3px;
`

/** ტექსტი, სადაც **ორმაგ ვარსკვლავებს** შორის სიტყვები მსხვილად და მონიშნულად ჩანს */
function richText(parent: HTMLElement, text: string) {
  const parts = text.split('**')
  parts.forEach((part, index) => {
    if (!part) return
    parent.appendChild(
      index % 2 === 1 ? make('strong', STRONG_CSS, part) : make('span', '', part),
    )
  })
}

// ილუსტრაციის ფონები — გვერდიდან გვერდზე იცვლება, რომ ყოველი გვერდი განსხვავებულად დაამახსოვრდეთ
const PICTURE_TONES = [
  ['#e8f3ff', '#f5fbff', '#3d86c6'],
  ['#fff1dc', '#fffaf1', '#e39a2d'],
  ['#e7f8ec', '#f6fff8', '#38a169'],
  ['#f3ebff', '#fbf8ff', '#8a5cc7'],
  ['#ffe9ef', '#fff7f9', '#d0567a'],
]

const EMOJI_FONT = `'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`

/** გვერდის ნახატი: დიდი ხატულები წარწერებით, მათ შორის ისრები ან ნიშნები */
function pictureBox(picture: TopicPicture, tone: number): HTMLElement {
  const [from, to, accent] = PICTURE_TONES[tone % PICTURE_TONES.length]
  const box = make(
    'figure',
    `
      margin: 0 0 0.6em;
      padding: 0.55em 0.7em;
      border-radius: 16px;
      background: linear-gradient(135deg, ${from}, ${to});
      border: 2px dashed ${accent}55;
      text-align: center;
    `,
  )

  const strip = make(
    'div',
    'display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 0.45em;',
  )
  picture.items.forEach((item, index) => {
    if (index > 0 && picture.joiner) {
      strip.appendChild(
        make('span', `font-size: 1.5em; font-weight: 900; color: ${accent}; font-family: ${EMOJI_FONT};`, picture.joiner),
      )
    }
    const tile = make(
      'div',
      `
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.15em;
        min-width: 4.6em;
        max-width: 12em;
        padding: 0.35em 0.55em 0.3em;
        border-radius: 14px;
        background: #ffffff;
        box-shadow: 0 3px 0 ${accent}33, 0 4px 12px rgba(38, 54, 74, 0.08);
      `,
    )
    if (hasPictureIcon(item.icon)) {
      const holder = make('div', 'line-height: 0;')
      holder.innerHTML = pictureIconSvg(item.icon)
      tile.appendChild(holder)
    } else {
      // ემოჯი დიდად; ჩვეულებრივი ტექსტი (Ctrl+C, 01000001, „პაროლი“) — კლავიშის/კოდის სახით
      const symbols = [...item.icon.replace(/[️‍]/g, '')].length
      const plain = !/\p{Extended_Pictographic}/u.test(item.icon) && symbols > 2
      const emojiSize = symbols > 6 ? 1.25 : symbols > 3 ? 1.6 : 2.1
      tile.appendChild(
        make(
          'div',
          plain
            ? `
              font-family: Consolas, 'Courier New', monospace;
              font-size: 1.05em;
              font-weight: 800;
              line-height: 1.35;
              color: #17406f;
              padding: 0.2em 0.5em;
              border-radius: 8px;
              border: 1px solid #c9d6e4;
              border-bottom-width: 3px;
              background: #f6f9fc;
              white-space: ${symbols > 16 ? 'normal' : 'nowrap'};
            `
            : `font-size: ${emojiSize}em; line-height: 1.15; font-family: ${EMOJI_FONT};`,
          item.icon,
        ),
      )
    }
    if (item.label) {
      tile.appendChild(
        make('div', 'font-size: 0.68em; font-weight: 700; line-height: 1.25; color: #3c4f63;', item.label),
      )
    }
    if (item.mark) {
      tile.appendChild(
        make(
          'span',
          `position: absolute; top: -0.45em; right: -0.45em; font-size: 0.95em; font-family: ${EMOJI_FONT};`,
          item.mark === 'yes' ? '✅' : '❌',
        ),
      )
    }
    strip.appendChild(tile)
  })
  box.appendChild(strip)

  if (picture.caption) {
    box.appendChild(
      make('figcaption', `margin-top: 0.4em; font-size: 0.78em; font-weight: 700; color: ${accent};`, picture.caption),
    )
  }
  return box
}

const ROMAN: Record<Grade, string> = { 2: 'II', 3: 'III', 4: 'IV' }

/** კლასის სათაური მასწავლებლის სიებში */
function gradeHeading(grade: Grade): HTMLElement {
  return make(
    'div',
    'margin: 8px 0 0; font-size: 18px; font-weight: 900; color: #315b88; border-bottom: 2px solid #d1dfeb; padding-bottom: 4px;',
    `${ROMAN[grade]} კლასი`,
  )
}

function row(...children: HTMLElement[]): HTMLDivElement {
  const box = make(
    'div',
    'display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; margin-top: 16px;',
  )
  box.append(...children)
  return box
}

export class KingdomPanels {
  private readonly state: GameState
  private readonly getGrade: () => Grade
  private readonly toast: (text: string) => void
  private readonly onCloseCallback: ((kind: PanelKind | null) => void) | undefined
  private kind: PanelKind | null = null
  private overlay: HTMLDivElement | null = null
  private card: HTMLDivElement | null = null
  /** ბიბლიოთეკის ტექსტის ფანჯარაში ჩასატევი ფუნქცია (ეკრანის ზომის შეცვლისას თავიდან ეშვება) */
  private readerFit: (() => void) | null = null

  constructor(options: PanelsOptions) {
    this.state = options.state
    this.getGrade = options.getGrade
    this.toast = options.toast
    this.onCloseCallback = options.onClose
    window.addEventListener('resize', () => this.readerFit?.())
  }

  isOpen(): boolean {
    return this.overlay !== null
  }

  /**
   * შეიძლება თუ არა პანელის დახურვა მოსწავლის მიერ (ღილაკი/Esc).
   * ბიბლიოთეკის პირველ ვიზიტზე — არა, სანამ ტექსტს ბოლომდე არ წაიკითხავს.
   */
  canClose(): boolean {
    return this.kind !== 'library' || this.state.libraryReadDone
  }

  close() {
    if (!this.overlay) return
    this.overlay.remove()
    const closed = this.kind
    this.overlay = null
    this.card = null
    this.readerFit = null
    this.kind = null
    this.onCloseCallback?.(closed)
  }

  // ---------- საერთო ნაწილები ----------

  private mount(): HTMLDivElement {
    if (!this.overlay || !this.card) {
      const overlay = make('div', OVERLAY_CSS)
      const card = make('div', CARD_CSS)
      overlay.appendChild(card)
      document.body.appendChild(overlay)
      this.overlay = overlay
      this.card = card
    }
    this.card.replaceChildren()
    this.card.style.cssText = CARD_CSS
    this.card.scrollTop = 0
    this.readerFit = null
    return this.card
  }

  private header(card: HTMLElement, icon: string, title: string, subtitle = '') {
    card.appendChild(make('div', 'font-size: 46px; margin-bottom: 4px;', icon))
    card.appendChild(
      make('h1', 'margin: 0 0 8px; font-size: clamp(24px, 4vw, 34px); color: #315b88;', title),
    )
    if (subtitle) {
      card.appendChild(
        make('p', 'margin: 0 0 18px; color: #536579; line-height: 1.6; font-size: 16px;', subtitle),
      )
    }
  }

  private balance(card: HTMLElement) {
    card.appendChild(
      make(
        'div',
        `
          display: inline-flex;
          gap: 18px;
          padding: 8px 18px;
          margin-bottom: 16px;
          border-radius: 999px;
          background: rgba(255,255,255,0.85);
          border: 1px solid #d1dfeb;
          font-weight: bold;
          font-size: 17px;
        `,
        `🪙 ${this.state.coins}      📘 ${this.state.books}`,
      ),
    )
  }

  private footer(card: HTMLElement, ...extra: HTMLElement[]) {
    card.appendChild(
      row(...extra, ...(this.canClose() ? [button('დახურვა (Esc)', '#315b88', () => this.close())] : [])),
    )
    decorateCurrency(card)
  }

  private message(card: HTMLElement, text: string, color = '#26364a') {
    card.appendChild(
      make('p', `margin: 14px 0 0; font-weight: bold; color: ${color}; line-height: 1.5;`, text),
    )
  }

  /** ტექსტის ველში აკრეფისას თამაშის კლავიშები (WASD, E, T, SPACE) არ უნდა ამუშავდეს */
  private protectInput(input: HTMLInputElement) {
    input.addEventListener('keydown', event => {
      event.stopPropagation()
      if (event.code === 'Escape' && this.canClose()) this.close()
    })
    input.addEventListener('keyup', event => event.stopPropagation())
  }

  private solvedCount(topic: Topic, round: 1 | 2): number {
    return roundQuestions(topic, round).filter(q => this.state.isSolved(topic.id, q.id)).length
  }

  private roundDone(topic: Topic, round: 1 | 2): boolean {
    const total = roundQuestions(topic, round).length
    return total > 0 && this.solvedCount(topic, round) === total
  }

  /** მოსწავლე თავისი კლასის თემებს ხედავს, მასწავლებელი — სამივე კლასისას, საიტის რიგით */
  private visibleTopics(): Topic[] {
    if (!this.state.teacherMode) return topicsForGrade(this.getGrade())
    return TEACHER_GRADES.flatMap(grade => topicsInLessonOrder(grade))
  }

  /** მასწავლებლის სიაში კლასის სათაური ჩნდება იქ, სადაც ახალი კლასი იწყება */
  private addGradeHeading(list: HTMLElement, topic: Topic, previous: Topic | undefined) {
    if (!this.state.teacherMode) return
    const grade = topic.grades[0]
    if (previous?.grades[0] !== grade) list.appendChild(gradeHeading(grade))
  }

  // ---------- ბიბლიოთეკა ----------

  openLibrary() {
    this.kind = 'library'
    this.renderLibraryHome()
  }

  private renderLibraryHome(message = '', messageColor = '#b44c48') {
    const card = this.mount()
    this.header(
      card,
      '📚',
      'ბიბლიოთეკა',
      this.state.teacherMode
        ? '🧑‍🏫 მასწავლებლის რეჟიმი: ყველა კლასის ყველა თემა გახსნილია. კოდები — ღილაკით M.'
        : 'აქ ვიგებთ ახალ თემებს. შეიყვანე მასწავლებლის კოდი და წაიკითხე ტექსტი.',
    )

    const topics = this.visibleTopics()

    if (topics.length === 0) {
      this.message(card, 'ამ კლასისთვის თემები მალე დაემატება.')
    }

    const list = make('div', 'display: grid; gap: 10px; text-align: left; margin-bottom: 18px;')
    topics.forEach((topic, index) => {
      if (!this.state.isTopicOpened(topic.id)) return
      this.addGradeHeading(list, topic, topics[index - 1])

      const item = make(
        'div',
        `
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding: 14px 16px;
          border: 2px solid #38a169;
          border-radius: 14px;
          background: linear-gradient(135deg, #f0fff4, #ffffff);
        `,
      )
      const info = make('div', 'font-weight: bold; font-size: 17px;', `${topic.icon} ${topic.title}`)
      const actions = make('div', 'display: flex; gap: 8px; flex-wrap: wrap;')
      // კოდის შეყვანისას ორივე ტექსტი ერთად იხსნება; დამატებითს ვინც უნდა, ის კითხულობს
      actions.append(
        button('📖 ძირითადი ტექსტი', '#27834a', () => this.renderReader(topic, false, 0)),
        button('➕ დამატებითი ტექსტი', '#315b88', () => this.renderReader(topic, true, 0)),
      )
      item.append(info, actions)
      list.appendChild(item)
    })
    card.appendChild(list)

    const form = make('form', 'display: flex; justify-content: center; flex-wrap: wrap; gap: 10px;')
    const input = make(
      'input',
      `
        padding: 12px 14px;
        border: 2px solid #b9c9da;
        border-radius: 12px;
        font-size: 18px;
        width: 220px;
        text-align: center;
        letter-spacing: 2px;
      `,
    )
    input.type = 'text'
    input.placeholder = 'კვირის კოდი'
    input.autocomplete = 'off'
    this.protectInput(input)

    const submit = make(
      'button',
      `
        border: 0;
        border-radius: 12px;
        padding: 12px 20px;
        background: #27834a;
        color: white;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
      `,
      '🔑 გახსნა',
    )
    submit.type = 'submit'

    form.append(input, submit)
    form.addEventListener('submit', event => {
      event.preventDefault()
      const topic = findTopicByCode(input.value)

      if (!topic) {
        this.renderLibraryHome('❌ ასეთი კოდი ვერ ვიპოვე. შეამოწმე და სცადე თავიდან.')
        return
      }
      if (!this.state.teacherMode && !topic.grades.includes(this.getGrade())) {
        this.renderLibraryHome('ეს კოდი სხვა კლასის თემისაა.')
        return
      }

      const first = !this.state.isTopicOpened(topic.id)
      this.state.openTopic(topic.id)
      if (first) this.toast(`🔓 თემა გაიხსნა: ${topic.title}`)
      // ჯერ დასათანხმებელი ფანჯარა, შემდეგ პირდაპირ ძირითადი ტექსტი (დამატებითი სიაში ღილაკით რჩება)
      submit.disabled = true
      void showGuideModal({ text: 'ყურადღებით წაიკითხე დავალება', icon: '📖' }).then(() => {
        if (this.kind === 'library') this.renderReader(topic, false, 0)
      })
    })
    card.appendChild(form)

    if (message) this.message(card, message, messageColor)
    this.footer(card)

    setTimeout(() => input.focus(), 0)
  }

  private renderReader(topic: Topic, extra: boolean, index: number) {
    const pages = extra ? topic.extraPages : topic.pages
    const page = pages[index]
    if (!page) {
      this.renderLibraryHome()
      return
    }

    const card = this.mount()

    // კითხვის ფანჯარა: ფართო და მაღალი, რომ ტექსტი სრულად ეტეოდეს (ჩასქროლვის გარეშე)
    card.style.width = 'min(1040px, 98vw)'
    card.style.maxHeight = 'calc(100vh - 28px)'
    card.style.padding = '14px 24px 16px'
    card.style.textAlign = 'left'

    // ზედა ზოლი: თემა მარცხნივ, გვერდის ნომერი მარჯვნივ
    const label = extra ? '➕ დამატებითი ტექსტი' : '📖 ძირითადი ტექსტი'
    const top = make(
      'div',
      'display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 8px;',
    )
    top.appendChild(
      make(
        'div',
        'font-size: clamp(18px, 2.2vw, 24px); font-weight: 800; color: #315b88; line-height: 1.3;',
        `${topic.icon} ${topic.title}`,
      ),
    )
    top.appendChild(
      make(
        'div',
        'color: #536579; font-size: 15px; font-weight: bold; white-space: nowrap;',
        `${label} • გვერდი ${index + 1} / ${pages.length}`,
      ),
    )
    card.appendChild(top)

    const bar = make('div', 'height: 6px; border-radius: 999px; background: #d9e3ee; margin: 0 0 10px; overflow: hidden;')
    bar.appendChild(
      make(
        'div',
        `height: 100%; width: ${((index + 1) / pages.length) * 100}%; background: linear-gradient(90deg, #38a169, #f6bd35); border-radius: 999px;`,
      ),
    )
    card.appendChild(bar)

    const icons = ['🌟', '🔍', '🧩', '💡', '🛠️']
    // ტექსტის ზომა em-ებშია, ამიტომ ერთი font-size ცვლის ყველაფერს (ფანჯარაში ჩატევისას)
    const body = make(
      'div',
      `
        padding: 0.8em 1.1em;
        border-radius: 16px;
        background: #ffffff;
        border: 1px solid #d1dfeb;
        box-shadow: 0 6px 22px rgba(49, 91, 136, 0.1);
        color: #26364a;
        font-size: 19px;
        line-height: 1.65;
      `,
    )

    body.appendChild(
      make(
        'h2',
        `
          margin: 0 0 0.5em;
          padding-bottom: 0.3em;
          border-bottom: 3px solid #f6bd35;
          font-size: 1.28em;
          line-height: 1.3;
          color: #7a3b0a;
        `,
        `${icons[index % icons.length]} ${page.title}`,
      ),
    )

    if (page.picture) body.appendChild(pictureBox(page.picture, index + (extra ? 2 : 0)))

    for (const paragraph of page.body) {
      const p = make('p', 'margin: 0 0 0.55em;')
      richText(p, paragraph)
      body.appendChild(p)
    }

    if (page.points && page.points.length > 0) {
      const list = make('div', 'display: grid; gap: 0.4em; margin: 0.2em 0 0.65em;')
      page.points.forEach(point => {
        const item = make(
          'div',
          `
            display: flex;
            gap: 0.6em;
            align-items: flex-start;
            padding: 0.4em 0.8em;
            border-radius: 12px;
            border-left: 5px solid #3d86c6;
            background: linear-gradient(135deg, #f1f7ff, #ffffff);
          `,
        )
        item.appendChild(make('span', 'line-height: 1.65;', '▸'))
        const text = make('div', 'flex: 1;')
        richText(text, point)
        item.appendChild(text)
        list.appendChild(item)
      })
      body.appendChild(list)
    }

    if (page.example) {
      const box = make(
        'div',
        `
          margin: 0.3em 0 0.55em;
          padding: 0.5em 0.85em;
          border-left: 5px solid #f6bd35;
          border-radius: 12px;
          background: #fff6d8;
          font-size: 0.95em;
          line-height: 1.6;
        `,
      )
      box.appendChild(make('strong', 'display: block; margin-bottom: 0.1em; color: #8a5a00;', '💡 მაგალითი'))
      const text = make('div')
      richText(text, page.example)
      box.appendChild(text)
      body.appendChild(box)
    }

    if (page.remember) {
      const box = make(
        'div',
        `
          margin-top: 0.3em;
          padding: 0.5em 0.85em;
          border-radius: 12px;
          background: linear-gradient(135deg, #e6f9ec, #f4fff8);
          border: 2px solid #38a169;
          line-height: 1.6;
        `,
      )
      box.appendChild(make('strong', 'display: block; margin-bottom: 0.1em; color: #1f7a45;', '⭐ დაიმახსოვრე'))
      const text = make('div')
      richText(text, page.remember)
      box.appendChild(text)
      body.appendChild(box)
    }
    card.appendChild(body)

    // ყველა ღილაკი ერთ რიგში (ადგილის დასაზოგად)
    const isLast = index === pages.length - 1
    const controls = row(
      button('← წინა', '#6b7c8f', () => this.renderReader(topic, extra, index - 1), index === 0),
      isLast
        ? button('✅ დასრულება', '#27834a', () => {
            // ტექსტის დასრულებისას პირდაპირ გამოვდივართ ბიბლიოთეკიდან; ამიერიდან დახურვა/სიაში ღილაკები აქტიურია
            this.state.markLibraryReadDone()
            this.close()
            this.toast('✨ ტექსტი წაკითხულია! ახლა აკადემიაში გამოსცადე თავი და მიიღე 📘 წიგნები.')
          })
        : button('შემდეგი →', '#27834a', () => this.renderReader(topic, extra, index + 1)),
      ...(this.canClose()
        ? [
            button('სიაში', '#315b88', () => this.renderLibraryHome()),
            button('დახურვა (Esc)', '#315b88', () => this.close()),
          ]
        : []),
    )
    controls.style.marginTop = '12px'
    card.appendChild(controls)

    // ტექსტის ზომა ისე, რომ ყველაფერი ერთ ფანჯარაში ეტეოდეს (ჩასქროლვის გარეშე)
    const fit = () => {
      if (!(card.clientHeight > 0)) return
      let size = 19
      body.style.fontSize = `${size}px`
      while (card.scrollHeight > card.clientHeight + 1 && size > 13.5) {
        size -= 0.5
        body.style.fontSize = `${size}px`
      }
    }
    fit()
    this.readerFit = fit
    document.fonts?.ready.then(() => {
      if (this.readerFit === fit) fit()
    })
  }

  // ---------- აკადემია ----------

  openAcademy() {
    this.kind = 'academy'
    this.renderAcademyHome()

    // თუ ამოსახსნელი ქვიზი არსებობს: ჯერ დასათანხმებელი ფანჯარა, შემდეგ პირდაპირ კითხვები
    // (მასწავლებელი სიიდან თავად ირჩევს)
    if (this.state.teacherMode) return
    const next = this.nextQuiz()
    if (!next) return
    void showGuideModal({ text: 'უპასუხე კითხვებს', icon: '🎓' }).then(() => {
      if (this.kind === 'academy') this.renderQuiz(next.topic, next.round)
    })
  }

  /** პირველი გახსნილი თემის დაუსრულებელი ქვიზი (ჯერ ქვიზი 1, შემდეგ ქვიზი 2) */
  private nextQuiz(): { topic: Topic; round: 1 | 2 } | null {
    const opened = this.visibleTopics().filter(topic => this.state.isTopicOpened(topic.id))
    for (const topic of opened) {
      if (!this.roundDone(topic, 1)) return { topic, round: 1 }
      if (!this.roundDone(topic, 2)) return { topic, round: 2 }
    }
    return null
  }

  private renderAcademyHome(message = '') {
    const card = this.mount()
    this.header(
      card,
      '🎓',
      'აკადემია',
      `პასუხი ჩაწერე ტექსტით. ყოველი სწორი პასუხი = ${ECONOMY.BOOKS_PER_CORRECT_ANSWER} 📘. პასუხები ბიბლიოთეკის ტექსტშია!`,
    )
    this.balance(card)

    const opened = this.visibleTopics().filter(topic => this.state.isTopicOpened(topic.id))
    const teacher = this.state.teacherMode

    if (opened.length === 0) {
      this.message(card, 'ჯერ ბიბლიოთეკაში გახსენი თემა მასწავლებლის კოდით.')
    }

    const list = make('div', 'display: grid; gap: 12px; text-align: left; margin-bottom: 6px;')
    opened.forEach((topic, index) => {
      this.addGradeHeading(list, topic, opened[index - 1])
      const item = make(
        'div',
        `
          padding: 14px 16px;
          border: 2px solid #315b88;
          border-radius: 14px;
          background: rgba(255,255,255,0.9);
        `,
      )
      item.appendChild(make('div', 'font-weight: bold; font-size: 18px;', `${topic.icon} ${topic.title}`))

      const r1Total = roundQuestions(topic, 1).length
      const r2Total = roundQuestions(topic, 2).length
      const r1Done = this.roundDone(topic, 1)
      const r2Done = this.roundDone(topic, 2)

      const actions = make('div', 'display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;')
      actions.append(
        button(
          r1Done
            ? `✅ ქვიზი 1 (${r1Total}/${r1Total})`
            : `🧠 ქვიზი 1 (${this.solvedCount(topic, 1)}/${r1Total})`,
          '#27834a',
          () => this.renderQuiz(topic, 1),
          r1Done,
        ),
        button(
          r2Done
            ? `✅ ქვიზი 2 (${r2Total}/${r2Total})`
            : r1Done || teacher
              ? `🧠 ქვიზი 2 (${this.solvedCount(topic, 2)}/${r2Total})`
              : '🔒 ქვიზი 2',
          '#315b88',
          () => this.renderQuiz(topic, 2),
          (!r1Done && !teacher) || r2Done,
        ),
      )
      item.appendChild(actions)

      if (!r1Done && !teacher) {
        item.appendChild(
          make(
            'div',
            'margin-top: 8px; font-size: 14px; color: #586b7c;',
            'ქვიზი 2 იხსნება, როცა ქვიზ 1-ს დაასრულებ. მისი კითხვები დამატებით ტექსტზეა — წაიკითხე ის ბიბლიოთეკაში.',
          ),
        )
      }
      list.appendChild(item)
    })
    card.appendChild(list)

    if (message) this.message(card, message, '#18834a')
    this.footer(card)
  }

  // ---------- მასწავლებელი: კლასის კოდები ----------

  isCodesOpen(): boolean {
    return this.kind === 'codes'
  }

  /** მასწავლებლის ფანჯარა (ღილაკი M): კლასები სიად; კლასის გახსნისას — თემები საიტის რიგით და მათი კოდები */
  openTeacherCodes(codes: TeacherCodes, openGrade: Grade | null = null) {
    this.kind = 'codes'
    const card = this.mount()
    this.header(card, '🔑', 'კლასის კოდები', 'აირჩიე კლასი — თემები ჩამოთვლილია ისე, როგორც school.emis.ge-ზეა.')

    const list = make('div', 'display: grid; gap: 10px; text-align: left;')
    for (const grade of TEACHER_GRADES) {
      const open = openGrade === grade
      const toggle = make(
        'button',
        `
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 14px 18px;
          border: 2px solid ${open ? '#315b88' : '#c9d6e4'};
          border-radius: 14px;
          background: ${open ? '#e6f1fb' : 'rgba(255,255,255,0.9)'};
          color: #26364a;
          font-size: 19px;
          font-weight: 900;
          cursor: pointer;
        `,
      )
      toggle.type = 'button'
      toggle.append(
        make('span', '', `${ROMAN[grade]} კლასი`),
        make('span', 'font-size: 15px; color: #536579;', `${codes[grade].length} თემა ${open ? '▲' : '▼'}`),
      )
      toggle.addEventListener('click', () => this.openTeacherCodes(codes, open ? null : grade))
      list.appendChild(toggle)

      if (!open) continue

      const table = make('div', 'display: grid; gap: 6px; margin: 2px 0 6px;')
      for (const entry of codes[grade]) {
        const line = make(
          'div',
          `
            display: grid;
            grid-template-columns: 2.2em 1fr auto;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            border-radius: 12px;
            background: #ffffff;
            border: 1px solid #d1dfeb;
          `,
        )
        line.append(
          make('span', 'font-weight: 900; color: #8a9bb0;', `${entry.lesson}.`),
          make('span', 'font-weight: 700; line-height: 1.35;', `${entry.topic.icon} ${entry.topic.title}`),
          make(
            'span',
            `
              font-family: Consolas, 'Courier New', monospace;
              font-size: 18px;
              font-weight: 900;
              letter-spacing: 2px;
              color: #17406f;
              padding: 4px 10px;
              border-radius: 8px;
              border: 1px solid #c9d6e4;
              border-bottom-width: 3px;
              background: #f6f9fc;
            `,
            entry.code,
          ),
        )
        table.appendChild(line)
      }
      list.appendChild(table)
    }
    card.appendChild(list)
    this.footer(card)
  }

  private renderQuiz(topic: Topic, round: 1 | 2, focusId?: string, feedback = '', good = false) {
    // კითხვები ყოველ მოსწავლეს თავისი შემთხვევითი რიგით ეძლევა
    const base = roundQuestions(topic, round)
    const orderIds = this.state.quizOrderFor(topic.id, round, base.map(q => q.id))
    const questions = orderIds
      .map(id => base.find(q => q.id === id))
      .filter((q): q is TopicQuestion => q !== undefined)
    const unsolved = questions.filter(q => !this.state.isSolved(topic.id, q.id))

    if (unsolved.length === 0) {
      this.renderAcademyHome(
        round === 1
          ? '🎉 ქვიზი 1 დასრულდა! ახლა ქვიზი 2 გაიხსნა — მისი კითხვები დამატებით ტექსტზეა. მაღაზიასა და სამჭედლოში გახსენი თამაშები.'
          : '🏆 ქვიზი 2 დასრულდა! კარგი მუშაობა!',
      )
      return
    }

    const current: TopicQuestion = unsolved.find(q => q.id === focusId) ?? unsolved[0]
    const number = questions.indexOf(current) + 1

    const card = this.mount()
    this.header(card, topic.icon, `${topic.title} — ქვიზი ${round}`)
    this.balance(card)

    // პროგრესის წერტილები
    const dots = make('div', 'display: flex; justify-content: center; gap: 8px; margin-bottom: 14px;')
    for (const q of questions) {
      const solved = this.state.isSolved(topic.id, q.id)
      dots.appendChild(
        make(
          'span',
          `
            width: 14px; height: 14px; border-radius: 50%;
            background: ${solved ? '#27834a' : q.id === current.id ? '#f6bd35' : '#c5d1de'};
            display: inline-block;
          `,
        ),
      )
    }
    card.appendChild(dots)

    card.appendChild(
      make(
        'div',
        `
          text-align: left;
          padding: 18px 20px;
          border-radius: 16px;
          background: rgba(255,255,255,0.92);
          border: 1px solid #d1dfeb;
          font-size: 20px;
          line-height: 1.6;
          font-weight: bold;
        `,
        `${number}. ${questionPrompt(current)}`,
      ),
    )

    const form = make('form', 'display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; margin-top: 16px;')
    const input = make(
      'input',
      `
        padding: 12px 14px;
        border: 2px solid #b9c9da;
        border-radius: 12px;
        font-size: 18px;
        width: min(380px, 100%);
        text-align: center;
      `,
    )
    input.type = 'text'
    input.placeholder = 'პასუხი...'
    input.autocomplete = 'off'
    this.protectInput(input)

    const submit = make(
      'button',
      `
        border: 0;
        border-radius: 12px;
        padding: 12px 20px;
        background: #27834a;
        color: white;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
      `,
      'შემოწმება',
    )
    submit.type = 'submit'
    form.append(input, submit)

    form.addEventListener('submit', event => {
      event.preventDefault()

      if (isAnswerCorrect(current, input.value)) {
        const first = this.state.markSolved(topic.id, current.id)
        if (first) {
          this.state.addQuizBooks(ECONOMY.BOOKS_PER_CORRECT_ANSWER)
          this.toast(`📘 +${ECONOMY.BOOKS_PER_CORRECT_ANSWER} წიგნი — სწორია!`)
        }
        const nextUnsolved = questions.find(
          q => q.id !== current.id && !this.state.isSolved(topic.id, q.id),
        )
        this.renderQuiz(
          topic,
          round,
          nextUnsolved?.id,
          `✅ სწორია! +${ECONOMY.BOOKS_PER_CORRECT_ANSWER} 📘`,
          true,
        )
      } else {
        const where = round === 1 ? 'ძირითადი ტექსტის' : 'დამატებითი ტექსტის'
        this.renderQuiz(
          topic,
          round,
          current.id,
          `❌ ჯერ არ არის სწორი. მინიშნება: პასუხი ბიბლიოთეკაში, ${where} ${current.page}-ე გვერდზეა.`,
          false,
        )
      }
    })
    card.appendChild(form)

    if (feedback) this.message(card, feedback, good ? '#18834a' : '#b44c48')

    const skipTarget = unsolved.find(q => q.id !== current.id)
    this.footer(
      card,
      ...(skipTarget
        ? [button('გამოტოვება →', '#6b7c8f', () => this.renderQuiz(topic, round, skipTarget.id))]
        : []),
      button('← სიაში', '#315b88', () => this.renderAcademyHome()),
    )

    setTimeout(() => input.focus(), 0)
  }

  // ---------- მაღაზია ----------

  openShop() {
    this.kind = 'shop'
    this.renderShop()
  }

  private renderShop(message = '') {
    const card = this.mount()
    this.header(
      card,
      '🛒',
      'მაღაზია',
      `აქ მონეტები წიგნებად იცვლება: ${ECONOMY.COINS_PER_BOOK} 🪙 = 1 📘. ${ECONOMY.BOOKS_PER_GAME} 📘 ღირს ერთი თამაშის გახსნა სამჭედლოში.`,
    )
    this.balance(card)

    const canOne = this.state.coins >= ECONOMY.COINS_PER_BOOK
    const allCount = Math.floor(this.state.coins / ECONOMY.COINS_PER_BOOK)

    card.appendChild(
      row(
        button(
          `1 📘 ← ${ECONOMY.COINS_PER_BOOK} 🪙`,
          '#27834a',
          () => {
            this.state.exchangeBooks(1)
            this.renderShop('✅ გაცვლა შესრულდა!')
          },
          !canOne,
        ),
        button(
          `ყველა მონეტა (${allCount} 📘)`,
          '#315b88',
          () => {
            const count = this.state.exchangeAll()
            this.renderShop(`✅ მიიღე ${count} 📘`)
          },
          allCount === 0,
        ),
      ),
    )

    if (!canOne) {
      this.message(
        card,
        'მონეტებს Typing Grandmaster-ში აგროვებ (სამჭედლოში). წიგნები კი ბიბლიოთეკა + აკადემიიდან მოდის.',
        '#586b7c',
      )
    }
    if (message) this.message(card, message, '#18834a')
    this.footer(card)
  }

  // ---------- საგანძურის საცავი ----------

  openWallet() {
    this.kind = 'wallet'
    const card = this.mount()
    this.header(card, '💎', 'საგანძურის საცავი', 'აქ ინახება შენი მონეტები, წიგნები და გახსნილი თამაშები.')
    this.balance(card)

    const games = make('div', 'display: grid; gap: 8px; text-align: left; margin-bottom: 14px;')
    for (const game of GAMES) {
      const unlocked = game.free || this.state.isGameUnlocked(game.id)
      const status = !game.available
        ? 'მალე დაემატება'
        : unlocked
          ? '✅ გახსნილია'
          : `🔒 ${ECONOMY.BOOKS_PER_GAME} 📘`
      const visual = gameVisual(game.id)

      const rowEl = make(
        'div',
        `
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 12px;
          border: 1px solid #d1dfeb;
          border-radius: 14px;
          background: rgba(255,255,255,0.85);
          font-weight: bold;
          opacity: ${game.available ? 1 : 0.7};
        `,
      )
      const left = make('div', 'display: flex; align-items: center; gap: 10px;')
      const tile = make(
        'div',
        `
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(145deg, ${visual.colors[0]}, ${visual.colors[1]});
          ${game.available ? '' : 'filter: grayscale(0.85);'}
        `,
      )
      tile.innerHTML = visual.svg
      const svgEl = tile.querySelector('svg')
      if (svgEl) {
        svgEl.setAttribute('width', '30')
        svgEl.setAttribute('height', '30')
      }
      left.append(tile, make('span', '', game.name))
      rowEl.append(left, make('span', 'font-size: 14px;', status))
      games.appendChild(rowEl)
    }
    card.appendChild(games)

    const stats = this.state.stats
    card.appendChild(
      make(
        'p',
        'margin: 0; color: #586b7c; font-size: 14px; line-height: 1.6;',
        `ამ სესიაში: Typing-ით 🪙 ${stats.typingCoins} • ქვიზებით 📘 ${stats.quizBooks} • გაცვლილი 🪙 ${stats.coinsExchanged} • გახარჯული 📘 ${stats.booksSpentOnGames}`,
      ),
    )
    this.footer(card, this.resetButton())
  }

  /** განულება ორ დაწკაპუნებაში, რომ შემთხვევით არ მოხდეს */
  private resetButton(): HTMLButtonElement {
    let armed = false
    const btn = button('🔄 ახალი სესია', '#b44c48', () => {
      if (!armed) {
        armed = true
        btn.textContent = 'დარწმუნებული ხარ? კიდევ დააჭირე'
        return
      }
      this.state.reset()
      this.toast('🔄 პროგრესი განულდა')
      this.openWallet()
    })
    return btn
  }
}
