/**
 * Typing Champion — ბეჭდვის რბოლა ლოკალურ ქსელში (LAN), 2–4 მოთამაშე.
 *
 * ერთი მოთამაშე ქმნის ოთახს და იღებს 4-ნიშნა კოდს, დანარჩენები კოდით უერთდებიან.
 * ყოველ ეტაპზე ტექსტი 5 სიტყვით იზრდება (15, 20, 25...) და მრბოლელი ფორმას იცვლის:
 * ფეხით → მანქანა → მოტოციკლი → რაკეტა → მფრინავი თეფში.
 * რბოლა 3D კუბიკების სამყაროში მიმდინარეობს: ყოველი სიტყვა კიბის ერთი საფეხურია (TypingChampionScene).
 *
 * კავშირი მიდის მასპინძლის კომპიუტერზე გაშვებულ რელეზე (server/typingChampionRelay.mjs),
 * რომელიც `npm run lan`-ით ირთვება. Vercel-ზე რელე არ არის — მაშინ თამაში ამას გვეუბნება.
 */

import { TypingChampionScene, type VehicleKind } from './TypingChampionScene'

export interface TypingChampionOptions {
  onClose?: () => void
}

type Phase = 'lobby' | 'countdown' | 'race' | 'results' | 'final'

interface NetPlayer {
  id: number
  name: string
  lane: number
  chars: number
  finishMs: number | null
  place: number | null
  points: number
  stageSteps: number
  stageBonus: number
  left: boolean
}

interface RoomState {
  code: string
  hostId: number
  phase: Phase
  stage: number
  stageCount: number
  players: NetPlayer[]
}

type ServerMessage =
  | { t: 'hello'; lanUrls: string[] }
  | { t: 'joined'; code: string; id: number }
  | ({ t: 'room' } & RoomState)
  | { t: 'stage'; stage: number; stageCount: number; text: string; startsIn: number }
  | { t: 'progress'; id: number; chars: number }
  | { t: 'hurry'; seconds: number }
  | { t: 'error'; msg: string }

const WS_PATH = '/typing-champion-ws'
const FIRST_STAGE_WORDS = 15
const WORDS_PER_STAGE_STEP = 5
const RESULTS_SECONDS = 6
const LANE_COLORS = ['#e8443a', '#2f86e8', '#f3b81f', '#3fbf5a']
const MEDALS = ['🥇', '🥈', '🥉', '🏅']

const VEHICLES: { kind: VehicleKind; name: string; icon: string }[] = [
  { kind: 'foot', name: 'ფეხით', icon: '🏃' },
  { kind: 'car', name: 'მანქანა', icon: '🚗' },
  { kind: 'moto', name: 'მოტოციკლი', icon: '🏍️' },
  { kind: 'rocket', name: 'რაკეტა', icon: '🚀' },
  { kind: 'ufo', name: 'მფრინავი თეფში', icon: '🛸' },
]

// მარტივი სიტყვები 2–4 კლასისთვის: სახლი, ბუნება, სკოლა და ცოტა კომპიუტერი
const WORD_BANK = [
  'მზე', 'ცა', 'ხე', 'ზღვა', 'მთა', 'ტყე', 'ქარი', 'წვიმა', 'თოვლი', 'მთვარე',
  'ღრუბელი', 'ყვავილი', 'მდინარე', 'ვარსკვლავი', 'ბაღი', 'ეზო', 'ხიდი', 'სოფელი', 'ქალაქი', 'სახლი',
  'დედა', 'მამა', 'ბებია', 'ბაბუა', 'ძმა', 'და', 'მეგობარი', 'მასწავლებელი', 'სკოლა', 'კლასი',
  'წიგნი', 'რვეული', 'კალამი', 'ფანქარი', 'ჩანთა', 'დაფა', 'ცარცი', 'გაკვეთილი', 'ბურთი', 'თამაში',
  'კატა', 'ძაღლი', 'ჩიტი', 'თევზი', 'ლომი', 'ზებრა', 'ჟირაფი', 'სპილო', 'კურდღელი', 'ციყვი',
  'ფუტკარი', 'პეპელა', 'ჭიანჭველა', 'ზღარბი', 'ვაშლი', 'მსხალი', 'ყურძენი', 'პური', 'წყალი', 'რძე',
  'ნამცხვარი', 'თაფლი', 'ყველი', 'წითელი', 'მწვანე', 'ლურჯი', 'ყვითელი', 'დიდი', 'პატარა', 'სწრაფი',
  'მხიარული', 'კარგი', 'ლამაზი', 'ახალი', 'თბილი', 'დილა', 'საღამო', 'ღამე', 'ზამთარი', 'ზაფხული',
  'კოდი', 'ბიტი', 'ჩიპი', 'მაუსი', 'ეკრანი', 'ფაილი', 'ქსელი', 'დისკი', 'რობოტი', 'ღილაკი',
  'სურათი', 'მუსიკა', 'პაროლი', 'პროგრამა', 'კომპიუტერი', 'კლავიატურა', 'ჯადოქარი', 'ჰაერი', 'ჯოხი', 'შოკოლადი',
]

// სტანდარტული ქართული განლაგება: ლათინური კლავიშიც მიიღება, თუ ბავშვს ქართული განლაგება არ აქვს
const LATIN_TO_KA: Record<string, string> = {
  a: 'ა', b: 'ბ', c: 'ც', d: 'დ', e: 'ე', f: 'ფ', g: 'გ', h: 'ჰ', i: 'ი', j: 'ჯ', k: 'კ', l: 'ლ', m: 'მ',
  n: 'ნ', o: 'ო', p: 'პ', q: 'ქ', r: 'რ', s: 'ს', t: 'ტ', u: 'უ', v: 'ვ', w: 'წ', x: 'ხ', y: 'ყ', z: 'ზ',
  W: 'ჭ', R: 'ღ', T: 'თ', S: 'შ', J: 'ჟ', Z: 'ძ', C: 'ჩ',
}
const KA_TO_KEY: Record<string, string> = {}
for (const [latin, ka] of Object.entries(LATIN_TO_KA)) {
  KA_TO_KEY[ka] = latin === latin.toUpperCase() ? `Shift + ${latin}` : latin.toUpperCase()
}

function keyToChar(key: string): string {
  return LATIN_TO_KA[key] ?? LATIN_TO_KA[key.toLowerCase()] ?? key
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`)
}

function stageWordCount(stage: number): number {
  return FIRST_STAGE_WORDS + WORDS_PER_STAGE_STEP * stage
}

/** ეტაპის ტექსტი: პირველ ეტაპებზე მოკლე სიტყვები, მერე უფრო გრძელიც */
function makeStageText(stage: number): string {
  const maxLen = 5 + stage * 2
  const pool = WORD_BANK.filter((w) => w.length <= maxLen)
  const words: string[] = []
  let bag: string[] = []
  while (words.length < stageWordCount(stage)) {
    if (bag.length === 0) bag = [...pool].sort(() => Math.random() - 0.5)
    const word = bag.pop()!
    if (word !== words[words.length - 1]) words.push(word)
  }
  return words.join(' ')
}

function vehicleFor(stage: number) {
  return VEHICLES[stage % VEHICLES.length]
}

const STYLE = `
  .tc-root {
    position: fixed; inset: 0; z-index: 2000; overflow: auto;
    display: flex; flex-direction: column;
    background: linear-gradient(160deg, #1f2b5c, #3a2a73 55%, #19163d);
    color: #1f2d3d; font-family: Arial, sans-serif;
  }
  .tc-root * { box-sizing: border-box; }
  .tc-root [hidden] { display: none !important; }
  .tc-top {
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
    padding: 12px 18px; color: #fff;
  }
  .tc-title { font-size: 22px; font-weight: 900; letter-spacing: .5px; text-shadow: 0 3px 0 rgba(0,0,0,.3); }
  .tc-title span { color: #ffd23f; }
  .tc-info { font-size: 15px; font-weight: 800; opacity: .9; }
  .tc-spacer { flex: 1; }
  .tc-btn {
    padding: 11px 18px; border: 0; border-radius: 12px; cursor: pointer;
    font: 900 16px Arial, sans-serif; color: #fff; background: #3a7bd5;
    box-shadow: 0 4px 0 rgba(0,0,0,.25); transition: transform .1s;
  }
  .tc-btn:hover { transform: translateY(-1px); }
  .tc-btn:active { transform: translateY(2px); box-shadow: 0 2px 0 rgba(0,0,0,.25); }
  .tc-btn:disabled { opacity: .5; cursor: default; transform: none; }
  .tc-btn.tc-green { background: #2fa760; }
  .tc-btn.tc-orange { background: #e5832a; }
  .tc-btn.tc-ghost { background: rgba(255,255,255,.92); color: #3a2a73; }
  .tc-center { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .tc-card {
    width: min(560px, 100%); padding: 26px; border-radius: 22px;
    background: #fff; box-shadow: 0 18px 50px rgba(0,0,0,.35);
  }
  .tc-card h2 { margin: 0 0 6px; font-size: 26px; }
  .tc-card p { margin: 6px 0; color: #4b5d70; font-weight: 700; line-height: 1.4; }
  .tc-field { display: flex; flex-direction: column; gap: 6px; margin: 16px 0; font-weight: 800; }
  .tc-input {
    padding: 12px 14px; border: 2px solid #c9d5e3; border-radius: 12px;
    font: 800 18px Arial, sans-serif; outline: none;
  }
  .tc-input:focus { border-color: #3a7bd5; }
  .tc-row { display: flex; gap: 10px; align-items: stretch; flex-wrap: wrap; }
  .tc-row .tc-input { flex: 1; min-width: 120px; }
  .tc-code-input { letter-spacing: 8px; text-align: center; font-size: 24px; }
  .tc-or { text-align: center; margin: 14px 0; color: #8696a7; font-weight: 900; }
  .tc-error { min-height: 22px; color: #d23a3a !important; }
  .tc-code {
    margin: 10px 0 14px; padding: 12px; border-radius: 16px; text-align: center;
    background: #fff4cc; border: 3px dashed #e0a030;
    font-size: 54px; font-weight: 900; letter-spacing: 14px; color: #8a4d00;
  }
  .tc-players { list-style: none; margin: 10px 0; padding: 0; display: grid; gap: 8px; }
  .tc-players li {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    border-radius: 12px; background: #f2f5fa; font-weight: 900; font-size: 17px;
  }
  .tc-dot { width: 16px; height: 16px; border-radius: 50%; flex: none; }
  .tc-tag { margin-left: auto; font-size: 13px; color: #6a7a8c; }
  .tc-small { font-size: 13px !important; }
  .tc-select { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 14px; }
  .tc-select button {
    flex: 1; min-width: 90px; padding: 9px; border-radius: 10px; cursor: pointer;
    border: 2px solid #c9d5e3; background: #fff; font: 900 14px Arial, sans-serif; color: #33475b;
  }
  .tc-select button.tc-on { border-color: #3a7bd5; background: #e7f0ff; color: #1d4f9c; }

  /* --- რბოლა --- */
  .tc-race { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 12px; padding: 0 18px 18px; position: relative; }
  .tc-stage3d {
    position: relative; flex: 1; min-height: 260px; border-radius: 18px; overflow: hidden;
    background: #f2a06e; box-shadow: 0 10px 30px rgba(0,0,0,.35);
  }
  .tc-standings {
    position: absolute; top: 10px; left: 10px; z-index: 2; display: grid; gap: 5px;
    min-width: 190px; max-width: 46%;
  }
  .tc-standing {
    display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 12px;
    background: rgba(20, 24, 48, .62); color: #fff; font-weight: 900; font-size: 14px;
    backdrop-filter: blur(3px);
  }
  .tc-standing.tc-me { background: rgba(255, 210, 63, .92); color: #2b1b00; }
  .tc-standing.tc-gone { opacity: .5; }
  .tc-rank {
    width: 24px; height: 24px; flex: none; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    background: #fff; color: #222; font-size: 13px;
  }
  .tc-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  .tc-prog { font-size: 12px; opacity: .9; white-space: nowrap; }
  .tc-timer {
    position: absolute; top: 46px; left: 50%; transform: translateX(-50%); z-index: 2;
    padding: 6px 18px; border-radius: 16px; background: rgba(230, 50, 60, .88); color: #fff;
    font-weight: 900; font-size: 22px; text-align: center; box-shadow: 0 6px 16px rgba(0,0,0,.25);
    pointer-events: none;
  }
  .tc-timer b { font-size: 34px; }
  .tc-stage3d .tc-ticker { position: absolute; top: 12px; left: 0; right: 0; z-index: 1; pointer-events: none; }
  .tc-ticker {
    min-height: 34px; padding: 0 12px; text-align: center; color: #fff; font-weight: 900; font-size: 18px;
    text-shadow: 0 2px 0 rgba(0,0,0,.35); transition: opacity .3s;
  }
  .tc-typing {
    padding: 12px 18px; border-radius: 18px; background: #fff;
    box-shadow: 0 10px 30px rgba(0,0,0,.35);
  }
  .tc-text {
    max-height: 84px; overflow: auto; font-size: 24px; line-height: 1.6;
    font-weight: 700; color: #9aa7b6; word-break: break-word;
  }
  .tc-text .tc-done { color: #23a35a; }
  .tc-text .tc-cur { color: #1f2d3d; background: #ffe98a; border-radius: 4px; box-shadow: 0 3px 0 #e0a030; }
  .tc-text .tc-cur.tc-space { padding: 0 6px; }
  .tc-text .tc-cur.tc-wrong { background: #ff9b9b; box-shadow: 0 3px 0 #d23a3a; }
  .tc-stats { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 10px; font-weight: 800; color: #4b5d70; font-size: 14px; }
  .tc-stats b { color: #1f2d3d; }
  .tc-hint { margin-left: auto; color: #8a4d00; }

  .tc-overlay {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    background: rgba(10,10,30,.55); z-index: 5; padding: 16px;
  }
  .tc-count {
    font-size: 150px; font-weight: 900; color: #fff;
    text-shadow: 0 8px 0 rgba(0,0,0,.35); animation: tc-pop .9s ease-out infinite;
  }
  .tc-results { list-style: none; margin: 12px 0; padding: 0; display: grid; gap: 8px; }
  .tc-results li {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px;
    background: #f2f5fa; font-weight: 900; font-size: 17px;
  }
  .tc-results .tc-medal { font-size: 26px; width: 34px; text-align: center; }
  .tc-results .tc-score { margin-left: auto; color: #2b6cb0; }
  .tc-next { margin-top: 10px; font-size: 18px !important; color: #1f2d3d !important; }

  @keyframes tc-pop { from { transform: scale(1.3); opacity: .4; } 30% { transform: scale(1); opacity: 1; } }
  @keyframes tc-shake { 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
  .tc-shake { animation: tc-shake .15s linear 2; }
  @media (max-width: 640px) {
    .tc-standings { min-width: 140px; }
    .tc-standing { font-size: 12px; padding: 4px 8px; }
    .tc-stage3d .tc-ticker { top: auto; bottom: 10px; font-size: 15px; }
    .tc-text { font-size: 20px; }
  }
`

export class TypingChampion {
  private readonly onClose: (() => void) | undefined
  private readonly root: HTMLDivElement
  private readonly style: HTMLStyleElement
  private readonly top: HTMLDivElement
  private readonly body: HTMLDivElement
  private closed = false

  private socket: WebSocket | null = null
  private myId = 0
  private myName = ''
  private room: RoomState | null = null
  private lanUrls: string[] = []
  private stageCount = 4
  private menuEnter: ((input: HTMLInputElement) => void) | null = null

  // --- მიმდინარე ეტაპი ---
  private text = ''
  private builtStage = -1
  private typed = 0
  private errors = 0
  private startAt = 0
  private raceStarted = false
  private hurryUntil = 0
  private prevOrder: number[] = []
  private tickerTimer = 0
  private scene3d: TypingChampionScene | null = null
  private wordStarts: number[] = []
  private wordLens: number[] = []
  private timer = 0

  constructor(options: TypingChampionOptions = {}) {
    this.onClose = options.onClose

    this.style = document.createElement('style')
    this.style.textContent = STYLE
    document.head.appendChild(this.style)

    this.root = document.createElement('div')
    this.root.className = 'tc-root'
    this.top = document.createElement('div')
    this.top.className = 'tc-top'
    this.body = document.createElement('div')
    this.body.className = 'tc-center'
    this.root.append(this.top, this.body)
    document.body.appendChild(this.root)

    window.addEventListener('keydown', this.onKeyDown, true)
    this.timer = window.setInterval(() => this.tick(), 200)
    this.showMenu()
  }

  // ---------------------------------------------------------------- ეკრანები

  private setTop(info: string) {
    this.top.innerHTML = `
      <div class="tc-title">⌨️ Typing <span>Champion</span></div>
      <div class="tc-info">${info}</div>
      <div class="tc-spacer"></div>
      <button class="tc-btn tc-ghost" type="button">✕ გასვლა (Esc)</button>
    `
    this.top.querySelector('button')?.addEventListener('click', () => this.close())
  }

  private setBody(className: string, html: string) {
    this.body.className = className
    this.body.innerHTML = html
  }

  private showMenu(error = '') {
    this.disposeScene()
    this.builtStage = -1
    this.room = null
    this.setTop('ბეჭდვის რბოლა ლოკალურ ქსელში · 2–4 მოთამაშე')
    this.setBody(
      'tc-center',
      `<div class="tc-card">
        <h2>🏁 მზად ხარ რბოლისთვის?</h2>
        <p>ბეჭდე სწრაფად და სწორად — რაც მეტს დაბეჭდავ, მით უფრო წინ წავა შენი მრბოლელი!</p>
        <label class="tc-field">შენი სახელი
          <input class="tc-input" data-name maxlength="14" placeholder="მაგ: ნინო" autocomplete="off">
        </label>
        <button class="tc-btn tc-green" data-host type="button" style="width:100%">🏠 ოთახის შექმნა (მასპინძელი)</button>
        <div class="tc-or">— ან —</div>
        <div class="tc-row">
          <input class="tc-input tc-code-input" data-code inputmode="numeric" placeholder="0000" autocomplete="off">
          <button class="tc-btn" data-join type="button">🚪 შესვლა კოდით</button>
        </div>
        <p class="tc-error">${escapeHtml(error)}</p>
        <p class="tc-small">ყველა კომპიუტერი ერთ Wi-Fi ქსელში უნდა იყოს. მასპინძელ კომპიუტერზე თამაში <b>npm run lan</b>-ით უნდა იყოს გაშვებული.</p>
      </div>`
    )
    const nameInput = this.body.querySelector<HTMLInputElement>('[data-name]')!
    const codeInput = this.body.querySelector<HTMLInputElement>('[data-code]')!
    const errorEl = this.body.querySelector<HTMLParagraphElement>('.tc-error')!
    nameInput.value = this.myName
    nameInput.focus()
    codeInput.addEventListener('input', () => {
      codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 4)
    })

    const readName = () => {
      const name = nameInput.value.trim()
      if (!name) {
        errorEl.textContent = 'ჯერ შენი სახელი ჩაწერე ✍️'
        nameInput.focus()
        return null
      }
      this.myName = name
      return name
    }
    const host = () => {
      const name = readName()
      if (name) this.connect({ t: 'host', name }, errorEl)
    }
    const join = () => {
      const name = readName()
      if (!name) return
      if (codeInput.value.length !== 4) {
        errorEl.textContent = 'ოთახის კოდი 4 ციფრია 🔢'
        codeInput.focus()
        return
      }
      this.connect({ t: 'join', name, code: codeInput.value }, errorEl)
    }
    this.body.querySelector('[data-host]')!.addEventListener('click', host)
    this.body.querySelector('[data-join]')!.addEventListener('click', join)
    // Enter-ს onKeyDown იჭერს (capture-ში), რადგან ველამდე მოვლენა აღარ მიდის
    this.menuEnter = (input) => {
      if (input === codeInput || codeInput.value.length === 4) join()
      else host()
    }
  }

  private showLobby() {
    const room = this.room!
    this.disposeScene()
    this.builtStage = -1
    this.menuEnter = null
    const isHost = room.hostId === this.myId
    this.setTop(`ოთახი ${room.code}`)
    const players = [...room.players].sort((a, b) => a.lane - b.lane)
    const items = players
      .map(
        (p) => `<li><span class="tc-dot" style="background:${LANE_COLORS[p.lane]}"></span>${escapeHtml(p.name)}
          <span class="tc-tag">${p.id === room.hostId ? '👑 მასპინძელი' : ''}${p.id === this.myId ? ' (შენ)' : ''}</span></li>`
      )
      .join('')
    const urls = this.lanUrls.length
      ? this.lanUrls.map((u) => `<b>${escapeHtml(u)}</b>`).join(' ან ')
      : '<b>ამ კომპიუტერის IP მისამართი</b>'
    const stageButtons = [3, 4, 5]
      .map((n) => {
        const words = Array.from({ length: n }, (_, i) => stageWordCount(i)).join('→')
        return `<button type="button" data-stages="${n}" class="${n === this.stageCount ? 'tc-on' : ''}">${n} ეტაპი<br><span class="tc-small">${words}</span></button>`
      })
      .join('')

    this.setBody(
      'tc-center',
      `<div class="tc-card">
        <h2>🏟️ ოთახის კოდი</h2>
        <div class="tc-code">${room.code}</div>
        <p class="tc-small">მეგობრებმა გახსნან ${urls} → სამჭედლო → Typing Champion → შესვლა კოდით.</p>
        <p>მოთამაშეები (${players.length}/4):</p>
        <ul class="tc-players">${items}</ul>
        ${
          isHost
            ? `<p>რამდენი ეტაპი იყოს?</p>
               <div class="tc-select">${stageButtons}</div>
               <button class="tc-btn tc-green" data-start type="button" style="width:100%" ${players.length < 2 ? 'disabled' : ''}>🏁 რბოლის დაწყება</button>
               <p class="tc-small">${players.length < 2 ? 'დაელოდე, სულ მცირე ერთი მეგობარი შემოვიდეს.' : 'ყველა მზადაა? დააჭირე დაწყებას!'}</p>`
            : `<p>⏳ დაელოდე, მასპინძელი რბოლას დაიწყებს...</p>`
        }
      </div>`
    )
    this.body.querySelectorAll<HTMLButtonElement>('[data-stages]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.stageCount = Number(btn.dataset.stages)
        this.showLobby()
      })
    )
    this.body.querySelector('[data-start]')?.addEventListener('click', () => {
      const stages = Array.from({ length: this.stageCount }, (_, i) => makeStageText(i))
      this.send({ t: 'start', stages })
    })
  }

  private buildRace(stage: number, stageCount: number, startsIn: number) {
    const vehicle = vehicleFor(stage)
    this.builtStage = stage
    this.typed = 0
    this.errors = 0
    this.raceStarted = false
    this.hurryUntil = 0
    this.prevOrder = []
    this.startAt = performance.now() + startsIn
    for (const p of this.room?.players ?? []) {
      p.chars = 0
      p.place = null
      p.finishMs = null
    }

    const words = this.text.split(' ').length
    this.setTop(
      `ეტაპი ${stage + 1}/${stageCount} · ${vehicle.icon} ${vehicle.name} · ${words} სიტყვა · ოთახი ${this.room?.code ?? ''}`
    )
    const chars = [...this.text].map((ch) => `<span>${ch === ' ' ? ' ' : escapeHtml(ch)}</span>`).join('')
    const wordList = this.text.split(' ')
    this.wordStarts = []
    this.wordLens = []
    let offset = 0
    for (const word of wordList) {
      this.wordStarts.push(offset)
      this.wordLens.push(word.length)
      offset += word.length + 1
    }

    this.disposeScene()
    this.setBody(
      'tc-race',
      `<div class="tc-stage3d">
         <div class="tc-standings"></div>
         <div class="tc-ticker"></div>
         <div class="tc-timer" hidden></div>
       </div>
       <div class="tc-typing">
         <div class="tc-text">${chars}</div>
         <div class="tc-stats">
           <span>პროგრესი: <b data-stat="progress">0%</b></span>
           <span>სიჩქარე: <b data-stat="wpm">0</b> სიტყვა/წთ</span>
           <span>შეცდომა: <b data-stat="errors">0</b></span>
           <span class="tc-hint" data-stat="hint"></span>
         </div>
       </div>
       <div class="tc-overlay" data-overlay><div class="tc-count">3</div></div>`
    )
    try {
      this.scene3d = new TypingChampionScene(this.body.querySelector<HTMLDivElement>('.tc-stage3d')!)
      this.scene3d.setStage(wordList, vehicle.kind, this.scenePlayers(), this.myId)
    } catch (err) {
      // WebGL არ მუშაობს — რბოლა მაინც გრძელდება ცხრილით და ტექსტით
      console.warn('Typing Champion: 3D სცენა ვერ ჩაირთო', err)
      this.scene3d = null
    }
    this.renderText()
    this.updateLanes()
  }

  private showResults(final: boolean) {
    const room = this.room!
    const overlay = this.body.querySelector<HTMLDivElement>('[data-overlay]')
    if (!overlay) return
    overlay.hidden = false
    const players = room.players.filter((p) => !p.left)

    let html: string
    if (final) {
      const ranked = [...players].sort((a, b) => b.points - a.points || a.lane - b.lane)
      let place = 0
      let lastPoints = -1
      const rows = ranked
        .map((p, i) => {
          if (p.points !== lastPoints) place = i
          lastPoints = p.points
          return `<li><span class="tc-medal">${MEDALS[place] ?? ''}</span><span class="tc-dot" style="background:${LANE_COLORS[p.lane]}"></span>
            ${escapeHtml(p.name)}${p.id === this.myId ? ' (შენ)' : ''}<span class="tc-score">${p.points} ქულა</span></li>`
        })
        .join('')
      const champion = ranked[0]
      const isHost = room.hostId === this.myId
      html = `<div class="tc-card">
        <h2>🏆 ჩემპიონი: ${escapeHtml(champion?.name ?? '')}!</h2>
        <p>ყველა ეტაპის ქულების ჯამი: ყოველი გავლილი საფეხური = 1 ქულა, ფინიშის ბონუსი 5 / 3 / 2 / 1.</p>
        <ul class="tc-results">${rows}</ul>
        <div class="tc-row">
          ${isHost ? '<button class="tc-btn tc-green" data-again type="button">🔁 ხელახლა თამაში</button>' : '<p>მასპინძელს შეუძლია ახალი რბოლის დაწყება.</p>'}
          <button class="tc-btn tc-orange" data-exit type="button">🚪 გასვლა</button>
        </div>
      </div>`
    } else {
      const ranked = [...players].sort(
        (a, b) => (a.place ?? 99) - (b.place ?? 99) || b.chars - a.chars || a.lane - b.lane
      )
      const total = [...this.text].length
      const rows = ranked
        .map((p) => {
          const result =
            p.place !== null
              ? `${((p.finishMs ?? 0) / 1000).toFixed(1)} წმ`
              : `ვერ მოასწრო (${Math.round((p.chars / total) * 100)}%)`
          const earned = `+${p.stageSteps + p.stageBonus} (${p.stageSteps} საფეხური${p.stageBonus ? ` + ${p.stageBonus} ბონუსი` : ''})`
          return `<li><span class="tc-medal">${p.place ? MEDALS[p.place - 1] : '⏱️'}</span><span class="tc-dot" style="background:${LANE_COLORS[p.lane]}"></span>
            ${escapeHtml(p.name)} <span class="tc-small">${result} · ${earned}</span><span class="tc-score">${p.points} ქულა</span></li>`
        })
        .join('')
      const next = vehicleFor(room.stage + 1)
      html = `<div class="tc-card">
        <h2>✅ ეტაპი ${room.stage + 1} დასრულდა!</h2>
        <ul class="tc-results">${rows}</ul>
        <p class="tc-next">შემდეგი ეტაპი: ${next.icon} <b>${next.name}</b> · ${stageWordCount(room.stage + 1)} სიტყვა
          — <span data-next>${RESULTS_SECONDS}</span> წამში</p>
      </div>`
      const shownAt = performance.now()
      this.startAt = shownAt + RESULTS_SECONDS * 1000
    }
    overlay.innerHTML = html
    overlay.querySelector('[data-again]')?.addEventListener('click', () => this.send({ t: 'lobby' }))
    overlay.querySelector('[data-exit]')?.addEventListener('click', () => this.close())
  }

  // ---------------------------------------------------------------- რბოლის განახლება

  private ranking(): NetPlayer[] {
    const players = (this.room?.players ?? []).filter((p) => !p.left)
    return players.sort((a, b) => (a.place ?? 99) - (b.place ?? 99) || b.chars - a.chars || a.lane - b.lane)
  }

  /** რამდენი სიტყვა (საფეხური) აქვს გავლილი ამდენი ასოთი, წილადით */
  private stepsFor(chars: number): number {
    let steps = 0
    for (let i = 0; i < this.wordStarts.length; i++) {
      const start = this.wordStarts[i]
      const len = this.wordLens[i]
      if (chars >= start + len) steps = i + 1
      else {
        if (chars > start) steps = i + (chars - start) / len
        break
      }
    }
    return steps
  }

  private charsOf(player: NetPlayer) {
    return player.id === this.myId ? Math.max(this.typed, player.chars) : player.chars
  }

  private scenePlayers() {
    return (this.room?.players ?? []).map((p) => ({
      id: p.id,
      lane: p.lane,
      name: p.name,
      steps: this.stepsFor(this.charsOf(p)),
      place: p.place,
      left: p.left,
    }))
  }

  private updateLanes() {
    const room = this.room
    if (!room || this.builtStage < 0) return
    const total = this.text.length || 1
    const order = this.ranking()
    const racing = room.phase === 'race'

    this.scene3d?.setPlayers(this.scenePlayers())
    this.scene3d?.setMyWord(Math.floor(this.stepsFor(this.typed)))

    // ცხრილი: ვინ რომელ ადგილზეა ახლა
    const box = this.body.querySelector<HTMLDivElement>('.tc-standings')
    if (box) {
      const gone = room.players.filter((p) => p.left)
      box.innerHTML = [...order, ...gone]
        .map((p, i) => {
          const chars = this.charsOf(p)
          const rank = p.left ? '–' : i === 0 && chars > 0 ? '👑' : String(i + 1)
          const status = p.left
            ? 'გავიდა'
            : p.place !== null
              ? `${MEDALS[p.place - 1] ?? ''} ${((p.finishMs ?? 0) / 1000).toFixed(1)} წმ`
              : `${Math.floor(this.stepsFor(chars))}/${this.wordStarts.length} · ${Math.round((chars / total) * 100)}%`
          const classes = ['tc-standing', p.id === this.myId ? 'tc-me' : '', p.left ? 'tc-gone' : ''].join(' ')
          return `<div class="${classes}"><span class="tc-rank">${rank}</span>
            <span class="tc-dot" style="background:${LANE_COLORS[p.lane]}"></span>
            <span class="tc-name">${escapeHtml(p.name)}${p.id === this.myId ? ' (შენ)' : ''}</span>
            <span class="tc-prog">${status}</span></div>`
        })
        .join('')
    }

    if (racing) this.detectOvertakes(order)
  }

  private detectOvertakes(order: NetPlayer[]) {
    const ids = order.map((p) => p.id)
    const prev = this.prevOrder
    this.prevOrder = ids
    // პირველ წამებში ყველა ერთად იწყებს — ეს "გასწრება" არ არის
    if (prev.length === 0 || performance.now() - this.startAt < 1500) return
    for (let i = 0; i < ids.length; i++) {
      const passer = order[i]
      const before = prev.indexOf(passer.id)
      if (before <= i || before < 0) continue
      // ვინ დარჩა უკან: ვინც ადრე passer-ის წინ იყო და ახლა უკანაა
      const passedId = prev.slice(i, before).find((id) => ids.indexOf(id) > i)
      const passed = order.find((p) => p.id === passedId)
      if (!passed) continue
      const text =
        i === 0
          ? `👑 ${passer.name} ლიდერი გახდა! (გაასწრო: ${passed.name})`
          : `⚡ ${passer.name} წინ გავიდა! (გაასწრო: ${passed.name})`
      this.setTicker(text)
      return
    }
  }

  private setTicker(text: string) {
    const ticker = this.body.querySelector<HTMLDivElement>('.tc-ticker')
    if (!ticker) return
    ticker.textContent = text
    ticker.style.opacity = '1'
    window.clearTimeout(this.tickerTimer)
    this.tickerTimer = window.setTimeout(() => {
      ticker.style.opacity = '0'
    }, 2200)
  }

  private renderText(wrong = false) {
    const box = this.body.querySelector<HTMLDivElement>('.tc-text')
    if (!box) return
    const spans = box.children
    for (let i = 0; i < spans.length; i++) {
      const span = spans[i] as HTMLSpanElement
      span.className = i < this.typed ? 'tc-done' : i === this.typed ? 'tc-cur' : ''
      if (i === this.typed) {
        if (this.text[i] === ' ') span.classList.add('tc-space')
        if (wrong) span.classList.add('tc-wrong')
        // მიმდინარე ასო ყოველთვის ჩანდეს გრძელ ტექსტშიც
        const top = span.offsetTop - box.offsetTop
        if (top > box.scrollTop + box.clientHeight - 40 || top < box.scrollTop) box.scrollTop = top - 40
      }
    }
    const total = this.text.length
    const set = (name: string, value: string) => {
      const el = this.body.querySelector(`[data-stat="${name}"]`)
      if (el) el.textContent = value
    }
    set('progress', `${Math.round((this.typed / total) * 100)}%`)
    set('errors', String(this.errors))
    const next = this.text[this.typed]
    set(
      'hint',
      next === undefined ? '🏁 ფინიში!' : next === ' ' ? 'შემდეგი: ჰარი (Space)' : `შემდეგი: ${next}  →  კლავიში ${KA_TO_KEY[next] ?? next}`
    )
  }

  private tick() {
    const room = this.room
    if (!room || this.builtStage < 0) return
    const now = performance.now()
    const overlay = this.body.querySelector<HTMLDivElement>('[data-overlay]')

    if (room.phase === 'countdown' || (room.phase === 'race' && !this.raceStarted)) {
      const left = Math.ceil((this.startAt - now) / 1000)
      if (left > 0) {
        const count = overlay?.querySelector('.tc-count')
        if (count && count.textContent !== String(left)) count.textContent = String(left)
      } else if (!this.raceStarted) {
        this.raceStarted = true
        if (overlay) overlay.hidden = true
        this.setTicker('🚦 წადი! ბეჭდე რაც შეიძლება სწრაფად!')
      }
    }

    if (room.phase === 'race' && this.raceStarted) {
      const minutes = (now - this.startAt) / 60000
      const doneWords = this.text.slice(0, this.typed).split(' ').length - 1 + (this.typed >= this.text.length ? 1 : 0)
      const me = room.players.find((p) => p.id === this.myId)
      if (minutes > 0.02 && me?.place === null) {
        const el = this.body.querySelector('[data-stat="wpm"]')
        if (el) el.textContent = String(Math.round(doneWords / minutes))
      }
      // პირველი ფინიშის შემდეგ ყველას უჩანს წამზომი
      const timerEl = this.body.querySelector<HTMLDivElement>('.tc-timer')
      if (timerEl && this.hurryUntil > 0) {
        const left = Math.max(0, Math.ceil((this.hurryUntil - now) / 1000))
        timerEl.hidden = false
        timerEl.innerHTML =
          me?.place === null
            ? `⏱️ <b>${left}</b> წამი დარჩა — იჩქარე!`
            : `⏱️ სხვებს რჩება <b>${left}</b> წამი`
      }
    }

    if (room.phase === 'results') {
      const el = overlay?.querySelector('[data-next]')
      if (el) el.textContent = String(Math.max(0, Math.ceil((this.startAt - now) / 1000)))
    }
  }

  // ---------------------------------------------------------------- კლავიატურა

  private onKeyDown = (event: KeyboardEvent) => {
    // სამყაროს კლავიშები (WASD, E...) თამაშის დროს არ უნდა მუშაობდეს
    event.stopPropagation()
    if (event.code === 'Escape') {
      event.preventDefault()
      this.close()
      return
    }
    if (event.target instanceof HTMLInputElement) {
      if (event.key === 'Enter' && this.menuEnter) {
        event.preventDefault()
        this.menuEnter(event.target)
      }
      return
    }
    const room = this.room
    if (!room || room.phase !== 'race' || !this.raceStarted || this.builtStage !== room.stage) return
    if (event.key === ' ' || event.key === 'Backspace') event.preventDefault()
    if (event.ctrlKey || event.altKey || event.metaKey) return
    if (event.key.length !== 1) return

    const me = room.players.find((p) => p.id === this.myId)
    if (!me || me.place !== null || this.typed >= this.text.length) return

    const target = this.text[this.typed]
    // ლათინურ კლავიშზე Shift წყვეტს, რომელი ასოა (T = თ, t = ტ); ჩართული CapsLock ხელს არ უშლის
    const key = /^[a-z]$/i.test(event.key)
      ? event.shiftKey
        ? event.key.toUpperCase()
        : event.key.toLowerCase()
      : event.key
    const typed = keyToChar(key)
    if (typed === target || event.key === target) {
      this.typed++
      // საკუთარ პროგრესს სერვერის პასუხს არ ველოდებით — ადგილიც მაშინვე უნდა განახლდეს
      me.chars = this.typed
      this.renderText()
      this.send({ t: 'progress', chars: this.typed })
      this.updateLanes()
    } else {
      this.errors++
      this.renderText(true)
      const box = this.body.querySelector<HTMLDivElement>('.tc-typing')
      box?.classList.remove('tc-shake')
      void box?.offsetWidth
      box?.classList.add('tc-shake')
    }
  }

  // ---------------------------------------------------------------- ქსელი

  private connect(first: object, errorEl: HTMLElement) {
    if (this.socket) return
    errorEl.textContent = '🔌 ვუკავშირდები...'
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    let opened = false
    let socket: WebSocket
    try {
      socket = new WebSocket(`${protocol}://${location.host}${WS_PATH}`)
    } catch {
      errorEl.textContent = 'კავშირი ვერ დამყარდა.'
      return
    }
    this.socket = socket
    socket.addEventListener('open', () => {
      opened = true
      socket.send(JSON.stringify(first))
    })
    socket.addEventListener('message', (e) => {
      try {
        this.onMessage(JSON.parse(String(e.data)) as ServerMessage)
      } catch (err) {
        console.warn('Typing Champion: ცუდი შეტყობინება', err)
      }
    })
    socket.addEventListener('close', () => {
      if (this.socket !== socket || this.closed) return
      this.socket = null
      const wasInRoom = this.room !== null
      this.room = null
      this.myId = 0
      if (!opened) {
        this.showMenu(
          'LAN სერვერი ვერ მოიძებნა. მასპინძელ კომპიუტერზე თამაში "npm run lan"-ით უნდა გაეშვას და ყველამ მისი მისამართი გახსნას.'
        )
      } else if (wasInRoom) {
        this.showMenu('კავშირი გაწყდა 😕 სცადე თავიდან.')
      }
    })
  }

  private send(msg: object) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(msg))
  }

  private onMessage(msg: ServerMessage) {
    switch (msg.t) {
      case 'hello':
        this.lanUrls = msg.lanUrls
        break
      case 'joined':
        this.myId = msg.id
        break
      case 'error': {
        // შეცდომის შემდეგ კავშირს ვხურავთ, რომ თავიდან ცდა სუფთად დაიწყოს
        const socket = this.socket
        this.socket = null
        socket?.close()
        this.showMenu(msg.msg)
        break
      }
      case 'stage':
        this.text = msg.text
        this.buildRace(msg.stage, msg.stageCount, msg.startsIn)
        break
      case 'progress': {
        if (msg.id === this.myId) break
        const player = this.room?.players.find((p) => p.id === msg.id)
        if (player) {
          player.chars = msg.chars
          this.updateLanes()
        }
        break
      }
      case 'hurry':
        this.hurryUntil = performance.now() + msg.seconds * 1000
        break
      case 'room': {
        const prevPhase = this.room?.phase
        const state: RoomState = {
          code: msg.code,
          hostId: msg.hostId,
          phase: msg.phase,
          stage: msg.stage,
          stageCount: msg.stageCount,
          players: msg.players,
        }
        this.room = state
        const me = state.players.find((p) => p.id === this.myId)
        if (me && me.place === null && this.builtStage === state.stage) me.chars = Math.max(me.chars, this.typed)
        if (state.phase === 'lobby') {
          this.showLobby()
        } else if (state.phase === 'countdown' || state.phase === 'race') {
          this.updateLanes()
        } else if (state.phase !== prevPhase) {
          this.updateLanes()
          this.showResults(state.phase === 'final')
        } else if (state.phase === 'final') {
          // ფინალში ვინმე გავიდა — სია განვაახლოთ
          this.showResults(true)
        }
        break
      }
    }
  }

  private disposeScene() {
    this.scene3d?.dispose()
    this.scene3d = null
  }

  close() {
    if (this.closed) return
    this.closed = true
    this.disposeScene()
    window.removeEventListener('keydown', this.onKeyDown, true)
    window.clearInterval(this.timer)
    window.clearTimeout(this.tickerTimer)
    const socket = this.socket
    this.socket = null
    socket?.close()
    this.root.remove()
    this.style.remove()
    this.onClose?.()
  }
}
