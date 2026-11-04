/**
 * Penalty Shooter — ლოკალური თამაში ორ მოთამაშეზე (ერთ კომპიუტერზე).
 *
 * რიგ-რიგობით პენალტები: მოთამაშე 1 (მასპინძელი) ურტყამს პირველი. ყოველ დარტყმაზე ორივეს
 * (დამრტყმელსაც და მეკარესაც) თავისი კითხვა ეძლევა ბიბლიოთეკის იმ თემებიდან, რომლებიც
 * შეყვანილ კოდამდეა.
 *
 *   დამრტყმელი სწორია, მეკარე არასწორი/დაგვიანებული  → გოლი
 *   დამრტყმელი სწორია, მეკარე სწორია                → მეკარემ აიღო
 *   დამრტყმელი არასწორია/დაგვიანებული               → ბურთი კარს აცდა
 * როცა ერთი სწორად უპასუხებს, მეორეს 5 წამი რჩება.
 * ანგარიში 5-5-ზე → დამატებითი დარტყმები პირველ "გაფუჭებამდე" (როგორც ფეხბურთში).
 */

export type PenaltyQuestion = {
  prompt: string
  answers: string[]
  hint?: string
  check?: (input: string) => boolean
}

export type PenaltyPool = {
  topicTitle: string
  questions: PenaltyQuestion[]
}

export type PenaltyShooterOptions = {
  onClose?: () => void
  /** კოდიდან კითხვების ნაკრები (null — კოდი არასწორია) */
  findPool: (code: string) => PenaltyPool | null
}

type Phase = 'setup' | 'intro' | 'question' | 'shot' | 'over'
type Answer = 'pending' | 'correct' | 'wrong' | 'timeout'
type KickResult = 'goal' | 'saved' | 'missed'
type Role = 'shooter' | 'keeper'

/**
 * local — ორივე ერთ კომპიუტერზე; host — ოთახის შემქმნელი (მატჩს მისი ბრაუზერი მართავს);
 * guest — სტუმარი, რომელიც ოთახის კოდით შედის და მასპინძლის მდგომარეობას აჩვენებს.
 */
type Mode = 'local' | 'host' | 'guest'

/** მასპინძელი → სტუმარი: მატჩის სრული მდგომარეობა */
type NetState = {
  k: 'state'
  phase: Phase
  names: [string, string]
  scores: [number, number]
  kicks: [KickResult[], KickResult[]]
  kickIndex: number
  shooter: 0 | 1
  winner: 0 | 1 | null
  prompts: Record<Role, string | null>
  answers: Record<Role, Answer>
  master: number
  grace: { role: Role; left: number } | null
  shot: { outcome: KickResult; spot: number; miss: number; keeperSpot: number; keeperCorrect: boolean }
  resultTitle: string
  resultLines: string[]
}

/** სტუმარი → მასპინძელი: პასუხი */
type NetAnswer = { k: 'answer'; kick: number; role: Role; value: string }

type ServerMessage =
  | { t: 'hello'; lanUrls: string[] }
  | { t: 'joined'; role: 'host' | 'guest'; code: string }
  | { t: 'guest'; name: string }
  | { t: 'left' }
  | { t: 'error'; msg: string }
  | { t: 'msg'; data: NetState | NetAnswer }

const WS_PATH = '/penalty-shooter-ws'
/** მასპინძელი კითხვის დროს მდგომარეობას ამ ინტერვალით უგზავნის სტუმარს (წამი) */
const SYNC_SECONDS = 0.5

type Spot = {
  x: number
  y: number
  /** მეკარის ხტომა: ბარძაყის წერტილი და დახრა */
  hipX: number
  hipY: number
  rot: number
}

type Confetti = {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  size: number
  color: string
  life: number
}

// ---------- მუდმივები ----------

const LW = 1280
const LH = 640
const REGULATION_KICKS = 5
const FIRST_SECONDS = 40
const GRACE_SECONDS = 5
const INTRO_SECONDS = 1.3
const SHOT_SECONDS = 3.1
const DOCK_HEIGHT = 236

const GOAL = { left: 180, right: 1100, top: 130, ground: 395, post: 14 }
const BALL_START = { x: 640, y: 560, r: 62 }
const KEEPER_IDLE = { hipX: 640, hipY: 322 }

const SPOTS: Spot[] = [
  { x: 285, y: 205, hipX: 345, hipY: 270, rot: -0.95 },
  { x: 640, y: 182, hipX: 640, hipY: 255, rot: 0 },
  { x: 995, y: 205, hipX: 935, hipY: 270, rot: 0.95 },
  { x: 268, y: 330, hipX: 360, hipY: 335, rot: -1.4 },
  { x: 1012, y: 330, hipX: 920, hipY: 335, rot: 1.4 },
]

/** ბურთის აცდენის წერტილები: მარცხნივ, მარჯვნივ, ზემოთ */
const MISS_SPOTS = [
  { x: 80, y: 240 },
  { x: 1200, y: 240 },
  { x: 640, y: 104 },
]

const CONFETTI_COLORS = ['#ffe066', '#ff5fa0', '#5ef2c3', '#66b8ff', '#ffffff', '#ff9a3d']

// ---------- დამხმარე ----------

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - (1 - clamp(t, 0, 1)) ** 3
const easeInOut = (t: number) => {
  const k = clamp(t, 0, 1)
  return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2
}

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[\s.,!?'"„“«»()\-–—:;]+/g, '')
}

export class PenaltyShooter {
  private readonly onClose: (() => void) | undefined
  private readonly findPool: (code: string) => PenaltyPool | null

  private root!: HTMLDivElement
  private canvas!: HTMLCanvasElement
  private ctx!: CanvasRenderingContext2D
  private stage!: HTMLDivElement
  private dock!: HTMLDivElement
  private setupModal!: HTMLDivElement
  private overModal!: HTMLDivElement
  private codeInput!: HTMLInputElement
  private name1Input!: HTMLInputElement
  private name2Input!: HTMLInputElement
  private setupError!: HTMLElement
  private overTitle!: HTMLElement
  private overScore!: HTMLElement
  private overInfo!: HTMLElement
  private roomInput!: HTMLInputElement
  private modeHint!: HTMLElement
  private startButton!: HTMLButtonElement
  private startHint!: HTMLElement
  private againButton!: HTMLButtonElement
  private newCodeButton!: HTMLButtonElement
  private lobbyModal!: HTMLDivElement
  private lobbyHint!: HTMLElement
  private lobbyCode!: HTMLElement
  private lobbyInfo!: HTMLElement
  private lobbyNote!: HTMLElement
  private lobbyStart!: HTMLButtonElement

  // LAN
  private mode: Mode = 'local'
  private socket: WebSocket | null = null
  private roomCode = ''
  private lanUrls: string[] = []
  private guestName: string | null = null
  /** რომელი მოთამაშე ვარ ამ კომპიუტერზე (LAN-ში): 0 — მასპინძელი, 1 — სტუმარი */
  private myIndex: 0 | 1 = 0
  private syncClock = 0
  private oppStatus: HTMLElement | null = null

  private frame = 0
  private lastTime = 0
  private disposed = false
  private time = 0
  private resizeObserver: ResizeObserver | null = null

  // ხედი
  private viewScale = 1
  private viewW = LW
  private viewH = LH
  private offsetX = 0
  private offsetY = 0

  // მატჩი
  private phase: Phase = 'setup'
  private pool: PenaltyPool | null = null
  private deck: PenaltyQuestion[] = []
  private names: [string, string] = ['მოთამაშე 1', 'მოთამაშე 2']
  private scores: [number, number] = [0, 0]
  private kicks: [KickResult[], KickResult[]] = [[], []]
  private kickIndex = 0
  private winner: 0 | 1 | null = null

  // მიმდინარე დარტყმა
  private phaseTime = 0
  private shooter: 0 | 1 = 0
  private questions: Record<Role, PenaltyQuestion | null> = { shooter: null, keeper: null }
  private answers: Record<Role, Answer> = { shooter: 'pending', keeper: 'pending' }
  private typed: Record<Role, string> = { shooter: '', keeper: '' }
  private master = FIRST_SECONDS
  private grace: { role: Role; left: number } | null = null
  private activeRole: Role = 'shooter'
  private resultTitle = ''
  private resultLines: string[] = []

  // დარტყმის ანიმაცია
  private shot = {
    outcome: 'missed' as KickResult,
    spot: 0,
    miss: 0,
    keeperSpot: -1,
    keeperCorrect: false,
    confettiSpawned: false,
    resolved: false,
  }
  private confetti: Confetti[] = []
  private flash = 0
  private shake = 0

  // წინასწარ დახატული ფონები
  private crowdCanvas: HTMLCanvasElement | null = null
  private netCanvas: HTMLCanvasElement | null = null

  // dock-ის ელემენტები
  private cards: Partial<Record<Role, { card: HTMLElement; input: HTMLInputElement; status: HTMLElement; button: HTMLElement }>> = {}
  private timerBar: HTMLElement | null = null

  constructor(options: PenaltyShooterOptions) {
    this.onClose = options.onClose
    this.findPool = options.findPool
    this.build()
    this.lastTime = performance.now()
    this.frame = requestAnimationFrame(this.loop)
  }

  // ====================================================== DOM

  private build() {
    this.root = document.createElement('div')
    this.root.className = 'pen-root'
    this.root.innerHTML = `
      <style>
        .pen-root { position: fixed; inset: 0; z-index: 2000; display: flex; flex-direction: column;
          background: #08142a; font-family: Arial, sans-serif; color: #fff; user-select: none; }
        .pen-stage { position: relative; flex: 1; min-height: 240px; overflow: hidden; }
        .pen-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        .pen-exit { position: absolute; top: 12px; right: 12px; z-index: 5; padding: 9px 14px; border: 0;
          border-radius: 12px; background: rgba(15, 28, 52, 0.85); color: #fff; font-size: 14px;
          font-weight: bold; cursor: pointer; }
        .pen-exit:hover { background: rgba(40, 70, 110, 0.95); }
        .pen-dock { height: ${DOCK_HEIGHT}px; flex: none; position: relative; display: flex; gap: 14px;
          padding: 16px 16px 14px; background: linear-gradient(180deg, #0c1a36, #060d1c);
          border-top: 3px solid #2b4f94; box-sizing: border-box; }
        .pen-bar { position: absolute; left: 0; top: -3px; height: 3px; width: 100%; background: #ffd24a;
          transform-origin: left; }
        .pen-card { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; padding: 12px 16px;
          border-radius: 18px; background: rgba(255,255,255,0.07); border: 3px solid rgba(255,255,255,0.18);
          box-sizing: border-box; }
        .pen-card.pen-shooter { border-color: #ff9a3d; }
        .pen-card.pen-keeper { border-color: #4cd68a; }
        .pen-card.pen-active { background: rgba(255,255,255,0.15); box-shadow: 0 0 0 3px rgba(255,255,255,0.35); }
        .pen-card.pen-done { opacity: 0.6; }
        .pen-role { font-size: 15px; font-weight: 800; letter-spacing: 0.3px; }
        .pen-q { flex: 1; font-size: clamp(16px, 1.9vw, 22px); line-height: 1.4; font-weight: 700;
          overflow: hidden; }
        .pen-row { display: flex; gap: 8px; }
        .pen-input { flex: 1; min-width: 0; padding: 10px 12px; border-radius: 12px; border: 2px solid #6e86b8;
          background: #07101f; color: #fff; font-size: 19px; outline: none; user-select: text; }
        .pen-input:focus { border-color: #ffd86b; }
        .pen-input:disabled { opacity: 0.55; }
        .pen-go { padding: 0 16px; border: 0; border-radius: 12px; background: #2a9a56; color: #fff;
          font-size: 16px; font-weight: 800; cursor: pointer; }
        .pen-go:disabled { background: #4a5870; cursor: default; }
        .pen-status { min-height: 20px; font-size: 14px; color: #b9c9e6; font-weight: 700; }
        .pen-status.pen-hot { color: #ffd24a; }
        .pen-msg { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; gap: 6px; }
        .pen-msg h2 { margin: 0; font-size: clamp(28px, 4vw, 44px); }
        .pen-msg p { margin: 0; color: #c8d6ee; font-size: 17px; line-height: 1.5; }
        .pen-modal { position: absolute; inset: 0; z-index: 6; display: flex; align-items: center;
          justify-content: center; background: rgba(4, 9, 20, 0.78); backdrop-filter: blur(5px); }
        .pen-modal[hidden] { display: none; }
        .pen-cardbox { width: min(520px, 94vw); padding: 26px; border-radius: 22px; text-align: center;
          background: linear-gradient(145deg, #15264a, #0b1630); border: 2px solid rgba(120, 190, 255, 0.45);
          box-shadow: 0 20px 70px rgba(0,0,0,0.55); box-sizing: border-box; }
        .pen-cardbox h2 { margin: 0 0 6px; font-size: 30px; }
        .pen-sub { color: #aebfdc; font-size: 15px; line-height: 1.5; margin-bottom: 14px; }
        .pen-field { display: block; width: 100%; box-sizing: border-box; margin: 8px 0; padding: 12px 14px;
          border-radius: 12px; border: 2px solid #6e86b8; background: #07101f; color: #fff; font-size: 19px;
          text-align: center; outline: none; user-select: text; }
        .pen-field:focus { border-color: #ffd86b; }
        .pen-names { display: flex; gap: 10px; }
        .pen-err { min-height: 22px; color: #ff8a8a; font-weight: 700; margin: 4px 0 8px; }
        .pen-btn { border: 0; border-radius: 12px; padding: 13px 22px; min-width: 150px; font-size: 17px;
          font-weight: 800; color: #fff; cursor: pointer; background: #27834a; margin: 4px; }
        .pen-btn.pen-alt { background: #315b88; }
        .pen-big { font-size: 54px; font-weight: 900; margin: 8px 0; color: #ffd86b; }
        .pen-list { font-size: 15px; color: #c7d6ee; line-height: 1.7; }
        .pen-root [hidden] { display: none !important; }
        .pen-modes { display: flex; gap: 6px; margin: 4px 0 10px; }
        .pen-mode { flex: 1; padding: 10px 6px; border-radius: 12px; border: 2px solid #315b88; background: #0b1630;
          color: #c8d6ee; font-size: 14px; font-weight: 800; cursor: pointer; }
        .pen-mode.pen-on { background: #27834a; border-color: #4cd68a; color: #fff; }
        .pen-card.pen-opp { opacity: 0.85; }
        .pen-urls { color: #ffd86b; font-weight: 800; word-break: break-all; }
      </style>
      <div class="pen-stage">
        <canvas class="pen-canvas"></canvas>
        <button class="pen-exit" type="button" tabindex="-1">✕ გასვლა (Esc)</button>
        <div class="pen-modal pen-setup">
          <div class="pen-cardbox">
            <h2>⚽ Penalty Shooter</h2>
            <div class="pen-modes">
              <button class="pen-mode" data-mode="local" type="button">🖥 ერთ კომპიუტერზე</button>
              <button class="pen-mode" data-mode="host" type="button">👑 ოთახის შექმნა</button>
              <button class="pen-mode" data-mode="guest" type="button">🔑 შესვლა კოდით</button>
            </div>
            <div class="pen-sub pen-modehint"></div>
            <input class="pen-field pen-code" type="text" autocomplete="off" spellcheck="false" placeholder="ბიბლიოთეკის კოდი (მაგ. BUG4)" />
            <input class="pen-field pen-room" type="text" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="ოთახის კოდი (4 ციფრი)" />
            <div class="pen-names">
              <input class="pen-field pen-name1" type="text" autocomplete="off" maxlength="14" placeholder="1 · მასპინძელი" />
              <input class="pen-field pen-name2" type="text" autocomplete="off" maxlength="14" placeholder="2 · სტუმარი" />
            </div>
            <div class="pen-err"></div>
            <button class="pen-btn pen-start" type="button">▶ დაწყება</button>
            <div class="pen-sub pen-starthint" style="margin: 10px 0 0"></div>
          </div>
        </div>
        <div class="pen-modal pen-lobby" hidden>
          <div class="pen-cardbox">
            <h2>🏟 ოთახის კოდი</h2>
            <div class="pen-big pen-roomcode">----</div>
            <div class="pen-sub pen-lobbyhint"></div>
            <div class="pen-list pen-lobbyinfo"></div>
            <div class="pen-err pen-lobbynote"></div>
            <button class="pen-btn pen-lobbystart" type="button">▶ დაწყება</button>
            <button class="pen-btn pen-alt pen-lobbyback" type="button">← უკან</button>
          </div>
        </div>
        <div class="pen-modal pen-over" hidden>
          <div class="pen-cardbox">
            <h2 class="pen-overtitle">🏆</h2>
            <div class="pen-big pen-overscore">0 : 0</div>
            <div class="pen-list pen-overinfo"></div>
            <div style="margin-top: 14px">
              <button class="pen-btn pen-again" type="button">↻ გადათამაშება</button>
              <button class="pen-btn pen-alt pen-newcode" type="button">კოდის შეცვლა</button>
              <button class="pen-btn pen-alt pen-leave" type="button">გასვლა</button>
            </div>
          </div>
        </div>
      </div>
      <div class="pen-dock"></div>
    `
    document.body.appendChild(this.root)

    const q = <T extends HTMLElement>(sel: string) => this.root.querySelector(sel) as T
    this.canvas = q<HTMLCanvasElement>('.pen-canvas')
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
    this.stage = q<HTMLDivElement>('.pen-stage')
    this.dock = q<HTMLDivElement>('.pen-dock')
    this.setupModal = q<HTMLDivElement>('.pen-setup')
    this.overModal = q<HTMLDivElement>('.pen-over')
    this.codeInput = q<HTMLInputElement>('.pen-code')
    this.name1Input = q<HTMLInputElement>('.pen-name1')
    this.name2Input = q<HTMLInputElement>('.pen-name2')
    this.setupError = q('.pen-err')
    this.overTitle = q('.pen-overtitle')
    this.overScore = q('.pen-overscore')
    this.overInfo = q('.pen-overinfo')
    this.roomInput = q<HTMLInputElement>('.pen-room')
    this.modeHint = q('.pen-modehint')
    this.startButton = q<HTMLButtonElement>('.pen-start')
    this.startHint = q('.pen-starthint')
    this.againButton = q<HTMLButtonElement>('.pen-again')
    this.newCodeButton = q<HTMLButtonElement>('.pen-newcode')
    this.lobbyModal = q<HTMLDivElement>('.pen-lobby')
    this.lobbyHint = q('.pen-lobbyhint')
    this.lobbyCode = q('.pen-roomcode')
    this.lobbyInfo = q('.pen-lobbyinfo')
    this.lobbyNote = q('.pen-lobbynote')
    this.lobbyStart = q<HTMLButtonElement>('.pen-lobbystart')

    q('.pen-exit').addEventListener('click', () => this.close())
    q('.pen-leave').addEventListener('click', () => this.close())
    q('.pen-start').addEventListener('click', () => this.tryStart())
    q('.pen-again').addEventListener('click', () => this.restartMatch())
    q('.pen-newcode').addEventListener('click', () => this.showSetup())
    this.lobbyStart.addEventListener('click', () => this.startLanMatch())
    q('.pen-lobbyback').addEventListener('click', () => {
      this.disconnect()
      this.showSetup()
    })
    for (const button of Array.from(this.root.querySelectorAll<HTMLButtonElement>('.pen-mode'))) {
      button.addEventListener('click', () => this.setMode(button.dataset.mode as Mode))
    }

    for (const input of [this.codeInput, this.roomInput, this.name1Input, this.name2Input]) {
      input.addEventListener('keydown', (event: KeyboardEvent) => {
        event.stopPropagation() // თამაშის სხვა კლავიშებმა (მაგ. Space) ტექსტში არ შეუშალოს ხელი
        if (event.key === 'Escape') {
          this.close()
          return
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          this.tryStart()
        }
      })
    }

    window.addEventListener('keydown', this.keyHandler, true)
    window.addEventListener('resize', this.resizeHandler)
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize())
      this.resizeObserver.observe(this.stage)
    }

    this.resize()
    this.setMode('local')
    this.renderDock()
    this.showSetup()
  }

  private setMode(mode: Mode) {
    if (this.socket) return
    this.mode = mode
    for (const button of Array.from(this.root.querySelectorAll<HTMLButtonElement>('.pen-mode'))) {
      button.classList.toggle('pen-on', button.dataset.mode === mode)
    }
    const lan = mode !== 'local'
    this.codeInput.hidden = mode === 'guest'
    this.roomInput.hidden = mode !== 'guest'
    this.name2Input.hidden = lan
    this.name1Input.placeholder = lan ? 'შენი სახელი' : '1 · მასპინძელი'
    if (mode === 'local') {
      this.modeHint.textContent =
        'ორი მოთამაშე ერთ კომპიუტერზე. შეიყვანე ბიბლიოთეკის კოდი — კითხვები ამ თემიდან და წინა თემებიდან იქნება.'
      this.startButton.textContent = '▶ დაწყება'
      this.startHint.textContent = 'მასპინძელი (მოთამაშე 1) ურტყამს პირველი.'
    } else if (mode === 'host') {
      this.modeHint.textContent =
        'ორი კომპიუტერი ერთ ქსელში. შენ ქმნი ოთახს და მიიღებ კოდს, მეორე მოთამაშე მას თავის კომპიუტერზე ჩაწერს. ბიბლიოთეკის კოდი კითხვებს ირჩევს.'
      this.startButton.textContent = '👑 ოთახის შექმნა'
      this.startHint.textContent = 'მასპინძელი (შენ) ურტყამს პირველი.'
    } else {
      this.modeHint.textContent = 'ჩაწერე ოთახის კოდი, რომელსაც მასპინძლის ეკრანზე ხედავ.'
      this.startButton.textContent = '🔑 შესვლა'
      this.startHint.textContent = 'კითხვებს მასპინძელი ირჩევს. ის ურტყამს პირველი.'
    }
    this.setupError.textContent = ''
    ;(mode === 'guest' ? this.roomInput : this.codeInput).focus?.()
  }

  private isLan(): boolean {
    return this.mode !== 'local'
  }

  private isGuest(): boolean {
    return this.mode === 'guest'
  }

  /** LAN-ში: ამ კომპიუტერის მოთამაშის როლი მიმდინარე დარტყმაზე */
  private myRole(): Role {
    return this.shooter === this.myIndex ? 'shooter' : 'keeper'
  }

  private readonly resizeHandler = () => this.resize()

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const w = Math.max(320, this.stage.clientWidth || window.innerWidth)
    const h = Math.max(200, this.stage.clientHeight || window.innerHeight - DOCK_HEIGHT)
    this.canvas.width = Math.floor(w * dpr)
    this.canvas.height = Math.floor(h * dpr)

    this.viewScale = Math.min(w / LW, h / LH)
    this.viewW = w / this.viewScale
    this.viewH = h / this.viewScale
    this.offsetX = (this.viewW - LW) / 2
    this.offsetY = (this.viewH - LH) / 2
    this.ctx.setTransform(dpr * this.viewScale, 0, 0, dpr * this.viewScale, 0, 0)
  }

  private readonly keyHandler = (event: KeyboardEvent) => {
    if (event.code === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      this.close()
      return
    }

    // Tab: კლავიატურა გადადის მეორე მოთამაშის ველზე
    if (event.code === 'Tab' && this.phase === 'question') {
      event.preventDefault()
      event.stopPropagation()
      this.focusRole(this.activeRole === 'shooter' ? 'keeper' : 'shooter', true)
    }
  }

  // ====================================================== დაყენება და მატჩი

  private showSetup() {
    this.phase = 'setup'
    this.overModal.hidden = true
    this.lobbyModal.hidden = true
    this.setupModal.hidden = false
    this.setupError.textContent = ''
    this.renderDock()
    ;(this.mode === 'guest' ? this.roomInput : this.codeInput).focus?.()
  }

  private tryStart() {
    if (this.socket) return

    if (this.mode === 'guest') {
      const room = this.roomInput.value.trim()
      if (!/^\d{4}$/.test(room)) {
        this.setupError.textContent = 'ჩაწერე 4-ნიშნა ოთახის კოდი'
        return
      }
      this.connect({ t: 'join', code: room, name: this.name1Input.value.trim() || 'სტუმარი' })
      return
    }

    const code = this.codeInput.value.trim()
    if (!code) {
      this.setupError.textContent = 'შეიყვანე ბიბლიოთეკის კოდი'
      return
    }

    const pool = this.findPool(code)
    if (!pool || pool.questions.length === 0) {
      this.setupError.textContent = 'ასეთი კოდი არ არსებობს — სცადე ხელახლა'
      return
    }

    this.pool = pool

    if (this.mode === 'host') {
      const name = this.name1Input.value.trim() || 'მასპინძელი'
      this.names = [name, 'სტუმარი']
      this.connect({ t: 'host', name })
      return
    }

    this.names = [
      this.name1Input.value.trim() || 'მოთამაშე 1',
      this.name2Input.value.trim() || 'მოთამაშე 2',
    ]
    this.setupModal.hidden = true
    this.startMatch()
  }

  // ====================================================== LAN

  private connect(first: object) {
    if (this.socket) return
    this.setupError.textContent = '🔌 ვუკავშირდები…'
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    let socket: WebSocket
    try {
      socket = new WebSocket(`${protocol}://${location.host}${WS_PATH}`)
    } catch {
      this.setupError.textContent = 'კავშირი ვერ დამყარდა.'
      return
    }
    let opened = false
    this.socket = socket
    socket.addEventListener('open', () => {
      opened = true
      socket.send(JSON.stringify(first))
    })
    socket.addEventListener('message', event => {
      try {
        this.onNet(JSON.parse(String(event.data)) as ServerMessage)
      } catch (error) {
        console.warn('Penalty Shooter: ცუდი შეტყობინება', error)
      }
    })
    socket.addEventListener('close', () => {
      if (this.socket !== socket || this.disposed) return
      this.socket = null
      this.guestName = null
      this.showSetup()
      this.setupError.textContent = opened
        ? 'კავშირი გაწყდა 😕 სცადე თავიდან.'
        : 'LAN სერვერი ვერ მოიძებნა. მასპინძელ კომპიუტერზე თამაში "npm run lan"-ით უნდა გაეშვას და ორივემ მისი მისამართი გახსნას.'
    })
  }

  private disconnect() {
    const socket = this.socket
    this.socket = null
    this.guestName = null
    socket?.close()
  }

  private send(data: NetState | NetAnswer) {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ t: 'msg', data }))
  }

  private onNet(msg: ServerMessage) {
    switch (msg.t) {
      case 'hello':
        this.lanUrls = Array.isArray(msg.lanUrls) ? msg.lanUrls.map(String) : []
        break
      case 'joined':
        this.roomCode = String(msg.code)
        this.myIndex = msg.role === 'host' ? 0 : 1
        this.showLobby()
        break
      case 'error':
        this.disconnect()
        this.showSetup()
        this.setupError.textContent = String(msg.msg)
        break
      case 'guest':
        this.guestName = String(msg.name).slice(0, 14)
        if (this.phase === 'setup') this.showLobby()
        break
      case 'left':
        if (this.mode === 'host') {
          // ოთახი რჩება — მასპინძელი ახალ სტუმარს ელოდება
          this.guestName = null
          this.showLobby('😕 მეორე მოთამაშე გავიდა.')
        } else {
          this.disconnect()
          this.showSetup()
          this.setupError.textContent = 'მასპინძელი გავიდა 😕'
        }
        break
      case 'msg':
        if (msg.data?.k === 'answer' && this.mode === 'host') this.onRemoteAnswer(msg.data)
        if (msg.data?.k === 'state' && this.mode === 'guest') this.applyState(msg.data)
        break
    }
  }

  private showLobby(note = '') {
    this.phase = 'setup'
    this.setupModal.hidden = true
    this.overModal.hidden = true
    this.lobbyModal.hidden = false
    this.lobbyCode.textContent = this.roomCode
    this.lobbyNote.textContent = note
    this.lobbyHint.textContent = ''

    if (this.mode === 'host') {
      this.lobbyHint.append('უთხარი მეორე მოთამაშეს ეს კოდი. თავის კომპიუტერზე გახსნას ')
      const urls = document.createElement('span')
      urls.className = 'pen-urls'
      urls.textContent = this.lanUrls.length > 0 ? this.lanUrls.join(' ან ') : 'ამ კომპიუტერის მისამართი'
      this.lobbyHint.append(urls, ' → სამჭედლო → Penalty Shooter → „შესვლა კოდით“.')
      this.lobbyInfo.textContent = this.guestName
        ? `🧤 ${this.guestName} შემოვიდა! დააჭირე „დაწყებას“.`
        : '⏳ ველოდებით მეორე მოთამაშეს…'
      this.lobbyStart.hidden = false
      this.lobbyStart.disabled = !this.guestName
      this.lobbyStart.style.opacity = this.guestName ? '1' : '0.5'
    } else {
      this.lobbyHint.textContent = 'შეხვედი ოთახში.'
      this.lobbyInfo.textContent = '⏳ ველოდებით, რომ მასპინძელმა დაიწყოს…'
      this.lobbyStart.hidden = true
    }
    this.renderDock()
  }

  private startLanMatch() {
    if (this.mode !== 'host' || !this.guestName || !this.pool) return
    this.names = [this.names[0], this.guestName]
    this.lobbyModal.hidden = true
    this.startMatch()
  }

  /** მასპინძელი → სტუმარი */
  private sync() {
    if (this.mode !== 'host' || !this.socket) return
    this.syncClock = 0
    this.send({
      k: 'state',
      phase: this.phase,
      names: this.names,
      scores: this.scores,
      kicks: this.kicks,
      kickIndex: this.kickIndex,
      shooter: this.shooter,
      winner: this.winner,
      prompts: {
        shooter: this.questions.shooter?.prompt ?? null,
        keeper: this.questions.keeper?.prompt ?? null,
      },
      answers: this.answers,
      master: this.master,
      grace: this.grace,
      shot: {
        outcome: this.shot.outcome,
        spot: this.shot.spot,
        miss: this.shot.miss,
        keeperSpot: this.shot.keeperSpot,
        keeperCorrect: this.shot.keeperCorrect,
      },
      resultTitle: this.resultTitle,
      resultLines: this.resultLines,
    })
  }

  private onRemoteAnswer(data: NetAnswer) {
    const guestRole: Role = this.shooter === 1 ? 'shooter' : 'keeper'
    if (data.kick !== this.kickIndex || data.role !== guestRole || typeof data.value !== 'string') return
    this.applyAnswer(guestRole, data.value.slice(0, 200))
  }

  /** სტუმარი: მასპინძლის მდგომარეობის ჩვენება (თვითონ არაფერს ითვლის) */
  private applyState(s: NetState) {
    const prevPhase = this.phase
    const prevKick = this.kickIndex
    const prevPrompts = `${this.questions.shooter?.prompt}|${this.questions.keeper?.prompt}`

    this.names = s.names
    this.scores = s.scores
    this.kicks = s.kicks
    this.kickIndex = s.kickIndex
    this.shooter = s.shooter
    this.winner = s.winner
    this.answers = s.answers
    this.master = s.master
    this.grace = s.grace ? { role: s.grace.role, left: s.grace.left } : null
    this.questions = {
      shooter: s.prompts.shooter !== null ? { prompt: s.prompts.shooter, answers: [] } : null,
      keeper: s.prompts.keeper !== null ? { prompt: s.prompts.keeper, answers: [] } : null,
    }
    this.resultTitle = s.resultTitle
    this.resultLines = s.resultLines
    if (s.phase === 'shot' && prevPhase !== 'shot') {
      const pick = (value: number, length: number) => clamp(Math.floor(Number(value) || 0), 0, length - 1)
      this.shot.outcome = s.shot.outcome
      this.shot.spot = pick(s.shot.spot, SPOTS.length)
      this.shot.miss = pick(s.shot.miss, MISS_SPOTS.length)
      this.shot.keeperSpot = s.shot.keeperSpot < 0 ? -1 : pick(s.shot.keeperSpot, SPOTS.length)
      this.shot.keeperCorrect = s.shot.keeperCorrect
      this.shot.confettiSpawned = false
      this.shot.resolved = true
    }

    this.phase = s.phase
    if (s.phase !== prevPhase) this.phaseTime = 0
    this.setupModal.hidden = true
    this.lobbyModal.hidden = true

    if (s.phase === 'over') {
      if (prevPhase !== 'over') this.showOver()
      return
    }
    this.overModal.hidden = true

    const prompts = `${this.questions.shooter?.prompt}|${this.questions.keeper?.prompt}`
    if (s.phase !== prevPhase || s.kickIndex !== prevKick || prompts !== prevPrompts) {
      this.renderDock()
      if (s.phase === 'question') this.focusRole(this.myRole(), false)
    } else {
      this.refreshLanStatus()
    }
  }

  /** სტუმარი: ბარათების სტატუსი ახალი მდგომარეობის მიხედვით (შეყვანილი ტექსტი არ იკარგება) */
  private refreshLanStatus() {
    if (this.phase !== 'question') return
    const mine = this.myRole()
    const card = this.cards[mine]
    if (card && this.answers[mine] !== 'pending' && !card.input.disabled) this.lockCard(card)
    if (this.oppStatus) {
      this.oppStatus.textContent = this.answers[this.otherRole(mine)] === 'pending' ? '✍ ფიქრობს…' : '✔ უპასუხა'
    }
  }

  private lockCard(card: { card: HTMLElement; input: HTMLInputElement; status: HTMLElement; button: HTMLElement }) {
    card.input.disabled = true
    ;(card.button as HTMLButtonElement).disabled = true
    card.status.textContent = '✔ პასუხი გაიგზავნა'
    card.status.classList.remove('pen-hot')
    card.card.classList.add('pen-done')
  }

  /** დარჩენილი 5 წამის ჩვენება (საკუთარ ან მეტოქის ბარათზე) */
  private showGrace() {
    if (!this.grace) return
    const seconds = Math.max(0, Math.ceil(this.grace.left))
    const card = this.cards[this.grace.role]
    if (card) {
      card.status.textContent = `⏱ დარჩა ${seconds} წამი!`
      card.status.classList.add('pen-hot')
    } else if (this.oppStatus) {
      this.oppStatus.textContent = `⏱ მეტოქეს დარჩა ${seconds} წამი`
    }
  }

  private startMatch() {
    this.scores = [0, 0]
    this.kicks = [[], []]
    this.kickIndex = 0
    this.winner = null
    this.deck = []
    this.confetti = []
    this.overModal.hidden = true
    this.beginKick()
  }

  private restartMatch() {
    if (this.isGuest()) return
    if (this.mode === 'host' && !this.guestName) {
      this.showLobby()
      return
    }
    if (!this.pool) {
      this.showSetup()
      return
    }
    this.startMatch()
  }

  /** ვინ ურტყამს: მასპინძელი (მოთამაშე 1) პირველი, შემდეგ რიგ-რიგობით */
  private beginKick() {
    this.shooter = (this.kickIndex % 2) as 0 | 1
    this.phase = 'intro'
    this.phaseTime = 0
    this.questions = { shooter: null, keeper: null }
    this.answers = { shooter: 'pending', keeper: 'pending' }
    this.typed = { shooter: '', keeper: '' }
    this.grace = null
    this.master = FIRST_SECONDS
    this.shot.resolved = false
    this.shot.confettiSpawned = false
    this.renderDock()
    this.sync()
  }

  private drawQuestion(exclude?: PenaltyQuestion): PenaltyQuestion {
    if (this.deck.length === 0 && this.pool) this.deck = shuffle(this.pool.questions)
    let index = this.deck.findIndex(item => item !== exclude)
    if (index < 0) index = 0
    const [picked] = this.deck.splice(index, 1)
    return picked
  }

  private beginQuestions() {
    const shooterQuestion = this.drawQuestion()
    const keeperQuestion = this.drawQuestion(shooterQuestion)
    this.questions = { shooter: shooterQuestion, keeper: keeperQuestion }
    this.phase = 'question'
    this.phaseTime = 0
    this.master = FIRST_SECONDS
    this.grace = null
    this.activeRole = 'shooter'
    this.renderDock()
    this.focusRole(this.isLan() ? this.myRole() : 'shooter', false)
    this.sync()
  }

  private otherRole(role: Role): Role {
    return role === 'shooter' ? 'keeper' : 'shooter'
  }

  private isCorrect(question: PenaltyQuestion, value: string): boolean {
    if (question.check) return question.check(value)
    const given = normalize(value)
    return given.length > 0 && question.answers.some(answer => normalize(answer) === given)
  }

  private submit(role: Role) {
    if (this.phase !== 'question' || this.answers[role] !== 'pending') return
    const card = this.cards[role]
    if (!card) return

    const value = card.input.value
    if (value.trim() === '') return

    // სტუმარი პასუხს მასპინძელს უგზავნის — შემოწმება იქ ხდება
    if (this.isGuest()) {
      if (card.input.disabled) return
      this.lockCard(card)
      this.send({ k: 'answer', kick: this.kickIndex, role, value })
      return
    }
    this.applyAnswer(role, value)
  }

  private applyAnswer(role: Role, value: string) {
    if (this.phase !== 'question' || this.answers[role] !== 'pending') return
    const question = this.questions[role]
    if (!question) return
    this.typed[role] = value

    const ok = this.isCorrect(question, value)
    this.answers[role] = ok ? 'correct' : 'wrong'
    const card = this.cards[role]
    if (card) this.lockCard(card)

    const other = this.otherRole(role)

    // დამრტყმელი არასწორია → ბურთი აცდება, მეორის პასუხი აღარ არის საჭირო
    if (role === 'shooter' && !ok) {
      this.resolveKick()
      return
    }

    if (this.answers[other] !== 'pending') {
      this.resolveKick()
      return
    }

    // სწორი პასუხის შემდეგ მეორეს 5 წამი რჩება
    if (ok) {
      this.grace = { role: other, left: GRACE_SECONDS }
      this.focusRole(other, false)
      const otherCard = this.cards[other]
      if (otherCard) otherCard.status.classList.add('pen-hot')
    } else {
      // მეკარემ არასწორად უპასუხა: დამრტყმელს ზოგადი დრო აქვს
      this.focusRole(other, false)
    }
    if (this.oppStatus && role !== this.myRole()) {
      this.oppStatus.textContent = '✔ უპასუხა'
    }
    this.showGrace()
    this.sync()
  }

  private focusRole(role: Role, wrap: boolean) {
    const card = this.cards[role]
    if (!card) return
    if (card.input.disabled) {
      if (wrap) return
    }
    this.activeRole = role
    for (const key of ['shooter', 'keeper'] as Role[]) {
      this.cards[key]?.card.classList.toggle('pen-active', key === role)
    }
    if (!card.input.disabled) card.input.focus?.()
  }

  // ====================================================== შედეგი

  private resolveKick() {
    if (this.shot.resolved) return
    this.shot.resolved = true

    for (const role of ['shooter', 'keeper'] as Role[]) {
      if (this.answers[role] === 'pending') this.answers[role] = 'timeout'
    }

    const s = this.answers.shooter
    const k = this.answers.keeper
    let outcome: KickResult
    if (s !== 'correct') outcome = 'missed'
    else outcome = k === 'correct' ? 'saved' : 'goal'

    this.shot.outcome = outcome
    this.shot.spot = Math.floor(Math.random() * SPOTS.length)
    this.shot.miss = Math.floor(Math.random() * MISS_SPOTS.length)
    this.shot.keeperCorrect = k === 'correct'

    if (outcome === 'saved') {
      this.shot.keeperSpot = this.shot.spot
    } else if (outcome === 'goal') {
      // მეკარე სხვა მხარეს ხტება
      const others = SPOTS.map((_, i) => i).filter(i => i !== this.shot.spot)
      this.shot.keeperSpot = others[Math.floor(Math.random() * others.length)]
    } else if (k === 'correct') {
      this.shot.keeperSpot = -1 // მეკარე მშვიდად დგას
    } else {
      this.shot.keeperSpot = Math.floor(Math.random() * SPOTS.length) // უაზროდ ხტება
    }

    const shooterName = this.names[this.shooter]
    const keeperName = this.names[this.shooter === 0 ? 1 : 0]
    const lines: string[] = []
    if (outcome === 'goal') this.resultTitle = '⚽ გოლი!'
    else if (outcome === 'saved') this.resultTitle = '🧤 მეკარემ აიღო!'
    else this.resultTitle = '❌ ბურთი კარს აცდა!'

    const describe = (role: Role, name: string, icon: string) => {
      const a = this.answers[role]
      const text = a === 'correct' ? 'სწორი პასუხი' : a === 'timeout' ? 'დრო ამოიწურა' : 'არასწორი პასუხი'
      lines.push(`${a === 'correct' ? '✔' : a === 'timeout' ? '⏱' : '✖'} ${icon} ${name}: ${text}`)
    }
    describe('shooter', shooterName, '⚽')
    describe('keeper', keeperName, '🧤')

    // ვინც არასწორად უპასუხა ან დააგვიანა, მისი სწორი პასუხი ვაჩვენოთ
    for (const role of ['shooter', 'keeper'] as Role[]) {
      const question = this.questions[role]
      if (question && this.answers[role] !== 'correct') {
        lines.push(`სწორი პასუხი (${role === 'shooter' ? shooterName : keeperName}): ${question.answers[0]}`)
      }
    }
    this.resultLines = lines

    this.phase = 'shot'
    this.phaseTime = 0
    this.renderDock()
    this.sync()
  }

  private finishKick() {
    const shooter = this.shooter
    this.kicks[shooter].push(this.shot.outcome)
    if (this.shot.outcome === 'goal') this.scores[shooter]++
    this.kickIndex++

    const winner = this.checkWinner()
    if (winner !== null) {
      this.finishMatch(winner)
      return
    }
    this.beginKick()
  }

  /** ფეხბურთის წესები: ადრეული დასრულება და დამატებითი დარტყმები პირველ გაფუჭებამდე */
  private checkWinner(): 0 | 1 | null {
    const [a, b] = this.scores
    const na = this.kicks[0].length
    const nb = this.kicks[1].length

    if (na >= REGULATION_KICKS && nb >= REGULATION_KICKS) {
      if (na === nb && a !== b) return a > b ? 0 : 1
      return null
    }

    // ძირითადი სერია: ვერ ეწევა
    const remainA = REGULATION_KICKS - na
    const remainB = REGULATION_KICKS - nb
    if (a > b + remainB) return 0
    if (b > a + remainA) return 1
    return null
  }

  private finishMatch(winner: 0 | 1) {
    this.winner = winner
    this.phase = 'over'
    this.phaseTime = 0
    this.showOver()
    this.sync()
  }

  /** მატჩის დასასრულის ეკრანი (მასპინძელზეც და სტუმარზეც) */
  private showOver() {
    if (this.winner === null) return
    const winner = this.winner
    this.flash = 0.6
    this.spawnConfetti(120, 640, 120)

    const extra = Math.max(this.kicks[0].length, this.kicks[1].length) > REGULATION_KICKS
    this.overTitle.textContent = `🏆 ${this.names[winner]} იგებს!`
    this.overScore.textContent = `${this.scores[0]} : ${this.scores[1]}`
    const mark = (r: KickResult) => (r === 'goal' ? '⚽' : r === 'saved' ? '🧤' : '✖')
    this.overInfo.textContent =
      `${this.names[0]}: ${this.kicks[0].map(mark).join(' ')}\n${this.names[1]}: ${this.kicks[1].map(mark).join(' ')}` +
      (extra ? '\n(იყო დამატებითი დარტყმები)' : '') +
      (this.isGuest() ? '\n⏳ გადათამაშებას მასპინძელი იწყებს' : '')
    this.overInfo.style.whiteSpace = 'pre-line'
    this.againButton.hidden = this.isGuest()
    this.newCodeButton.hidden = this.isLan()
    this.lobbyModal.hidden = true
    this.overModal.hidden = false
    this.renderDock()
  }

  // ====================================================== dock

  private renderDock() {
    this.dock.innerHTML = ''
    this.cards = {}
    this.timerBar = null
    this.oppStatus = null

    if (this.phase === 'question') {
      this.timerBar = document.createElement('div')
      this.timerBar.className = 'pen-bar'
      this.dock.appendChild(this.timerBar)

      for (const role of ['shooter', 'keeper'] as Role[]) {
        const question = this.questions[role]
        const playerIndex = role === 'shooter' ? this.shooter : this.shooter === 0 ? 1 : 0
        const card = document.createElement('div')
        card.className = `pen-card pen-${role}`

        const title = document.createElement('div')
        title.className = 'pen-role'
        title.textContent =
          role === 'shooter'
            ? `⚽ დამრტყმელი: ${this.names[playerIndex]}`
            : `🧤 მეკარე: ${this.names[playerIndex]}`

        const text = document.createElement('div')
        text.className = 'pen-q'
        text.textContent = question ? question.prompt : ''

        // LAN: მეტოქის ბარათი მხოლოდ საჩვენებელია — პასუხს ის თავის კომპიუტერზე წერს
        if (this.isLan() && role !== this.myRole()) {
          const opp = document.createElement('div')
          opp.className = 'pen-status'
          opp.textContent = this.answers[role] === 'pending' ? '✍ ფიქრობს…' : '✔ უპასუხა'
          card.classList.add('pen-opp')
          card.append(title, text, opp)
          this.dock.appendChild(card)
          this.oppStatus = opp
          continue
        }
        if (this.isLan()) title.textContent += ' (შენ)'

        const row = document.createElement('div')
        row.className = 'pen-row'
        const input = document.createElement('input')
        input.className = 'pen-input'
        input.type = 'text'
        input.autocomplete = 'off'
        input.spellcheck = false
        input.placeholder = 'ჩაწერე პასუხი…'
        const button = document.createElement('button')
        button.className = 'pen-go'
        button.type = 'button'
        button.textContent = 'პასუხი'
        button.tabIndex = -1
        row.append(input, button)

        const status = document.createElement('div')
        status.className = 'pen-status'
        status.textContent = this.isLan() ? 'Enter — გაგზავნა' : 'Enter — გაგზავნა • Tab — მეორე მოთამაშე'

        input.addEventListener('keydown', (event: KeyboardEvent) => {
          event.stopPropagation()
          if (event.key === 'Escape') {
            this.close()
            return
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            this.submit(role)
          }
          if (event.key === 'Tab') {
            event.preventDefault()
            this.focusRole(this.otherRole(role), true)
          }
        })
        input.addEventListener('focus', () => this.focusRoleSilently(role))
        button.addEventListener('click', () => this.submit(role))

        card.append(title, text, row, status)
        this.dock.appendChild(card)
        this.cards[role] = { card, input, status, button }
        if (this.answers[role] !== 'pending') this.lockCard(this.cards[role]!)
      }
      return
    }

    const message = document.createElement('div')
    message.className = 'pen-msg'
    const title = document.createElement('h2')
    const sub = document.createElement('p')

    const shooterName = this.names[this.shooter]
    const keeperName = this.names[this.shooter === 0 ? 1 : 0]

    if (this.phase === 'intro') {
      title.textContent = `⚽ ${shooterName} ურტყამს`
      sub.textContent = `🧤 ${keeperName} იცავს კარს • მოემზადეთ, ორივეს თავისი კითხვა ექნება`
    } else if (this.phase === 'shot') {
      title.textContent = this.resultTitle
      sub.innerHTML = ''
      for (const line of this.resultLines) {
        const div = document.createElement('div')
        div.textContent = line
        sub.appendChild(div)
      }
    } else if (this.phase === 'over' && this.winner !== null) {
      title.textContent = `🏆 ${this.names[this.winner]} იგებს! ${this.scores[0]} : ${this.scores[1]}`
      sub.textContent = ''
    } else {
      title.textContent = '⚽ Penalty Shooter'
      sub.textContent = 'შეიყვანე კოდი და დაიწყეთ'
    }
    message.append(title, sub)
    this.dock.appendChild(message)
  }

  private focusRoleSilently(role: Role) {
    this.activeRole = role
    for (const key of ['shooter', 'keeper'] as Role[]) {
      this.cards[key]?.card.classList.toggle('pen-active', key === role)
    }
  }

  // ====================================================== ციკლი

  private readonly loop = (now: number) => {
    if (this.disposed) return
    this.frame = requestAnimationFrame(this.loop)

    const dt = Math.min((now - this.lastTime) / 1000, 0.05)
    this.lastTime = now
    this.update(dt)
    this.draw()
  }

  private update(dt: number) {
    this.time += dt
    this.phaseTime += dt
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 1.6)
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3)
    this.updateConfetti(dt)

    // დარტყმის ეფექტები (ორივე კომპიუტერზე)
    if (this.phase === 'shot' && this.phaseTime >= 0.95 && !this.shot.confettiSpawned) {
      this.shot.confettiSpawned = true
      if (this.shot.outcome === 'goal') {
        this.flash = 0.5
        this.shake = 0.35
        this.spawnConfetti(70, 640, 90)
      } else if (this.shot.outcome === 'saved') {
        this.shake = 0.2
      }
    }

    // სტუმარი მხოლოდ დროს აჩვენებს — გადაწყვეტილებებს მასპინძელი იღებს
    if (this.isGuest()) {
      if (this.phase === 'question') {
        this.master = Math.max(0, this.master - dt)
        if (this.grace) {
          this.grace.left = Math.max(0, this.grace.left - dt)
          this.showGrace()
        }
        if (this.timerBar) {
          this.timerBar.style.transform = `scaleX(${clamp(this.master / FIRST_SECONDS, 0, 1)})`
        }
      }
      return
    }

    if (this.phase === 'intro' && this.phaseTime >= INTRO_SECONDS) {
      this.beginQuestions()
      return
    }

    if (this.phase === 'question') {
      this.master -= dt
      if (this.grace) {
        this.grace.left -= dt
        this.showGrace()
        if (this.grace.left <= 0) {
          this.answers[this.grace.role] = 'timeout'
          this.resolveKick()
          return
        }
      }
      if (this.timerBar) {
        this.timerBar.style.transform = `scaleX(${clamp(this.master / FIRST_SECONDS, 0, 1)})`
      }
      if (this.master <= 0) {
        this.resolveKick()
        return
      }
      this.syncClock += dt
      if (this.syncClock >= SYNC_SECONDS) this.sync()
      return
    }

    if (this.phase === 'shot' && this.phaseTime >= SHOT_SECONDS) this.finishKick()
  }

  private spawnConfetti(count: number, x: number, y: number) {
    for (let i = 0; i < count; i++) {
      this.confetti.push({
        x: x + (Math.random() - 0.5) * 400,
        y,
        vx: (Math.random() - 0.5) * 520,
        vy: -200 - Math.random() * 380,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 12,
        size: 6 + Math.random() * 7,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        life: 1.8 + Math.random() * 1.2,
      })
    }
    if (this.confetti.length > 260) this.confetti.splice(0, this.confetti.length - 260)
  }

  private updateConfetti(dt: number) {
    for (const c of this.confetti) {
      c.life -= dt
      c.x += c.vx * dt
      c.y += c.vy * dt
      c.vy += 620 * dt
      c.rot += c.vr * dt
    }
    this.confetti = this.confetti.filter(c => c.life > 0 && c.y < LH + 80)
  }

  // ====================================================== ხატვა

  private draw() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.viewW + 2, this.viewH + 2)

    ctx.save()
    ctx.translate(this.offsetX, this.offsetY)
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake * 14, (Math.random() - 0.5) * this.shake * 14)
    }

    this.drawStadium()
    this.drawGoalBack()
    this.drawKeeperAndBall()
    this.drawGoalFront()
    this.drawTargets()
    this.drawConfetti()
    ctx.restore()

    this.drawScoreboard()

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 244, 190, ${this.flash * 0.35})`
      ctx.fillRect(0, 0, this.viewW, this.viewH)
    }

    if (this.phase === 'shot' && this.phaseTime > 0.9) this.drawBanner()
  }

  // ---------- ფონი ----------

  private makeCrowd(): HTMLCanvasElement {
    const c = document.createElement('canvas')
    c.width = 1280
    c.height = 250
    const g = c.getContext('2d')
    if (!g) return c

    const sky = g.createLinearGradient(0, 0, 0, 250)
    sky.addColorStop(0, '#0b2a63')
    sky.addColorStop(1, '#16407f')
    g.fillStyle = sky
    g.fillRect(0, 0, 1280, 250)

    for (let i = 0; i < 2600; i++) {
      const x = hash(i * 3.1) * 1280
      const y = hash(i * 7.7 + 1) * 250
      const tone = hash(i * 1.3 + 5)
      const depth = y / 250
      const palette = ['#1c3f7a', '#274f94', '#33267a', '#7a2a62', '#2c6a9a', '#c9d3ee']
      g.fillStyle = palette[Math.floor(tone * palette.length)]
      g.globalAlpha = 0.35 + depth * 0.5
      g.beginPath()
      g.arc(x, y, 2 + depth * 3.5, 0, Math.PI * 2)
      g.fill()
    }
    g.globalAlpha = 1

    // სტადიონის სხივები
    for (const x of [140, 520, 900, 1180]) {
      const beam = g.createRadialGradient(x, 0, 4, x, 0, 230)
      beam.addColorStop(0, 'rgba(255,255,255,0.55)')
      beam.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = beam
      g.fillRect(x - 230, 0, 460, 250)
    }
    return c
  }

  private makeNet(): HTMLCanvasElement {
    const w = GOAL.right - GOAL.left
    const h = GOAL.ground - GOAL.top
    const c = document.createElement('canvas')
    c.width = w * 2
    c.height = h * 2
    const g = c.getContext('2d')
    if (!g) return c

    g.scale(2, 2)
    g.strokeStyle = 'rgba(214, 230, 255, 0.55)'
    g.lineWidth = 1.4
    const r = 13
    const dx = r * Math.sqrt(3)
    const dy = r * 1.5
    g.beginPath()
    for (let row = -1, y = 0; y < h + r; row++, y += dy) {
      for (let x = (row % 2 ? dx / 2 : 0) - dx; x < w + dx; x += dx) {
        for (let k = 0; k < 6; k++) {
          const a = (Math.PI / 3) * k + Math.PI / 6
          const px = x + Math.cos(a) * r
          const py = y + Math.sin(a) * r
          if (k === 0) g.moveTo(px, py)
          else g.lineTo(px, py)
        }
        g.closePath()
      }
    }
    g.stroke()
    return c
  }

  private drawStadium() {
    const ctx = this.ctx
    const w = this.viewW
    const left = -this.offsetX - 20
    const width = w + 40

    if (!this.crowdCanvas) this.crowdCanvas = this.makeCrowd()
    ctx.drawImage(this.crowdCanvas, left, 0, width, 250)

    // ხალხის "ტალღა" და გოლზე გაციმციმება
    const wave = 0.06 + 0.04 * Math.sin(this.time * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${wave + (this.flash > 0 ? this.flash * 0.25 : 0)})`
    ctx.fillRect(left, 60 + Math.sin(this.time * 1.4) * 20, width, 30)

    // რეკლამის დაფები
    ctx.fillStyle = '#0a1a38'
    ctx.fillRect(left, 238, width, 62)
    ctx.fillStyle = '#12306a'
    ctx.fillRect(left, 238, width, 4)
    ctx.font = '900 34px Inter, system-ui, sans-serif'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(120, 170, 255, 0.28)'
    for (let x = ((-this.offsetX - 20) % 420) - 420; x < w + 420; x += 420) {
      ctx.fillText('PENALTY SHOOT-OUT', x, 270)
    }

    // დაფის უკან ბალახი
    const back = ctx.createLinearGradient(0, 300, 0, GOAL.ground)
    back.addColorStop(0, '#1c6a34')
    back.addColorStop(1, '#2a8b43')
    ctx.fillStyle = back
    ctx.fillRect(left, 300, width, GOAL.ground - 300)

    // მოედანი: ზოლები პერსპექტივით
    const bands = [395, 418, 448, 486, 532, 590, 660]
    for (let i = 0; i < bands.length - 1; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#2f9a4a' : '#3bb058'
      ctx.fillRect(left, bands[i], width, bands[i + 1] - bands[i] + 1)
    }

    // ხაზები
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(left, GOAL.ground)
    ctx.lineTo(left + width, GOAL.ground)
    ctx.stroke()
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(60, 612)
    ctx.lineTo(1220, 612)
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.beginPath()
    ctx.ellipse(BALL_START.x, BALL_START.y + 58, 22, 7, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // ---------- კარი ----------

  private drawGoalBack() {
    const ctx = this.ctx
    // ბადის ფონი (ოდნავ მუქი)
    const w = GOAL.right - GOAL.left
    const h = GOAL.ground - GOAL.top
    ctx.fillStyle = 'rgba(8, 24, 60, 0.42)'
    ctx.fillRect(GOAL.left, GOAL.top, w, h)
  }

  private drawGoalFront() {
    const ctx = this.ctx
    const w = GOAL.right - GOAL.left
    const h = GOAL.ground - GOAL.top

    if (!this.netCanvas) this.netCanvas = this.makeNet()
    ctx.drawImage(this.netCanvas, GOAL.left, GOAL.top, w, h)

    // ბადის ტალღა გოლზე
    if (this.phase === 'shot' && this.shot.outcome === 'goal' && this.phaseTime > 0.9) {
      const t = this.phaseTime - 0.9
      const spot = SPOTS[this.shot.spot]
      for (let i = 0; i < 3; i++) {
        const radius = 20 + t * 220 + i * 26
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, 0.55 - t * 0.5 - i * 0.12)})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(spot.x, spot.y, radius, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // ძელები
    const post = GOAL.post
    ctx.fillStyle = '#f4f7ff'
    ctx.fillRect(GOAL.left - post, GOAL.top - post, post, h + post)
    ctx.fillRect(GOAL.right, GOAL.top - post, post, h + post)
    ctx.fillRect(GOAL.left - post, GOAL.top - post, w + post * 2, post)
    ctx.fillStyle = 'rgba(0,0,40,0.28)'
    ctx.fillRect(GOAL.left - 3, GOAL.top, 3, h)
    ctx.fillRect(GOAL.right, GOAL.top, 3, h)
  }

  /** 5 სამიზნე ბურთი კარში (როგორც სანიმუშო სურათზე) */
  private drawTargets() {
    if (this.phase !== 'question' && this.phase !== 'intro') return
    const ctx = this.ctx
    for (let i = 0; i < SPOTS.length; i++) {
      const s = SPOTS[i]
      const pulse = 1 + 0.06 * Math.sin(this.time * 3 + i)
      ctx.save()
      ctx.globalAlpha = 0.45
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.beginPath()
      ctx.arc(s.x, s.y, 44 * pulse, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
      this.drawBall(s.x, s.y, 26 * pulse, this.time * 0.4 + i, 0.5)
    }
  }

  // ---------- მეკარე და ბურთი ----------

  private drawKeeperAndBall() {
    const shot = this.shot
    const inShot = this.phase === 'shot'
    const t = inShot ? this.phaseTime : 0

    // მეკარის პოზიცია
    let hipX = KEEPER_IDLE.hipX
    let hipY = KEEPER_IDLE.hipY
    let rot = 0
    let reach = 0

    if (inShot && shot.keeperSpot >= 0) {
      const spot = SPOTS[shot.keeperSpot]
      const p = easeOut((t - 0.3) / 0.5)
      hipX = lerp(KEEPER_IDLE.hipX, spot.hipX, p)
      hipY = lerp(KEEPER_IDLE.hipY, spot.hipY, p)
      rot = spot.rot * p
      reach = p
      if (spot.rot === 0) hipY -= Math.sin(p * Math.PI) * 30
    } else {
      // მოლოდინი: პატარა ხტუნვა მუხლებზე
      hipY += Math.sin(this.time * 5) * 3
      if (this.phase === 'question' || this.phase === 'intro') reach = 0.15 * (0.5 + 0.5 * Math.sin(this.time * 3))
    }

    this.drawKeeper(hipX, hipY, rot, reach)

    // ბურთი
    let bx: number = BALL_START.x
    let by: number = BALL_START.y
    let br: number = BALL_START.r
    let spin = this.time * 0.3

    if (inShot) {
      const tx = shot.outcome === 'missed' ? MISS_SPOTS[shot.miss].x : SPOTS[shot.spot].x
      const ty = shot.outcome === 'missed' ? MISS_SPOTS[shot.miss].y : SPOTS[shot.spot].y
      const p = clamp((t - 0.3) / 0.55, 0, 1)
      const e = easeInOut(p)
      bx = lerp(BALL_START.x, tx, e)
      by = lerp(BALL_START.y, ty, e) - Math.sin(p * Math.PI) * 40
      br = lerp(BALL_START.r, shot.outcome === 'missed' ? 18 : 27, e)
      spin = t * 14

      if (p >= 1) {
        const after = t - 0.85
        if (shot.outcome === 'goal') {
          by += Math.min(60, after * 90 + after * after * 120)
        } else if (shot.outcome === 'saved') {
          // ბურთი მეკარის ხელებიდან ეშვება
          const fall = Math.max(0, after - 0.15)
          by += Math.min(70, fall * fall * 260)
          bx += Math.min(40, fall * 40) * (SPOTS[shot.spot].x < 640 ? 1 : -1)
        } else {
          bx += (tx < 640 ? -1 : tx > 640 ? 1 : 0) * Math.min(120, after * 140)
          by -= tx === 640 ? Math.min(60, after * 80) : 0
          br = Math.max(6, br - after * 4)
        }
      }
    }

    // ბურთის ჩრდილი
    const ctx = this.ctx
    if (!inShot || t < 0.4) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.beginPath()
      ctx.ellipse(bx, BALL_START.y + br * 0.95, br * 0.95, br * 0.28, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    this.drawBall(bx, by, br, spin, 1)
  }

  private drawBall(x: number, y: number, r: number, spin: number, alpha: number) {
    const ctx = this.ctx
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(x, y)

    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(1, '#c9d2e0')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fill()

    // ხუთკუთხედები (ბურთის ნახატი)
    ctx.save()
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.clip()
    ctx.rotate(spin)
    ctx.fillStyle = '#1c2230'
    const pent = (cx: number, cy: number, size: number, rotation: number) => {
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const a = rotation + (i / 5) * Math.PI * 2
        const px = cx + Math.cos(a) * size
        const py = cy + Math.sin(a) * size
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
    }
    pent(0, 0, r * 0.34, -Math.PI / 2)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + Math.PI / 5
      pent(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92, r * 0.3, a + Math.PI)
    }
    ctx.restore()

    ctx.strokeStyle = 'rgba(30, 40, 60, 0.7)'
    ctx.lineWidth = Math.max(1.2, r * 0.05)
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  /** მეკარე (ლოკალური კოორდინატები: ბარძაყის ცენტრი = 0,0) */
  private drawKeeper(hipX: number, hipY: number, rot: number, reach: number) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(hipX, hipY)
    ctx.rotate(rot)

    const green = '#2fb96a'
    const greenLight = '#8be8ae'
    const dark = '#1c7a47'
    const pink = '#ff5fa0'

    // ფეხები
    const legSpread = 14 + reach * 6
    for (const side of [-1, 1]) {
      ctx.fillStyle = dark
      ctx.fillRect(side * legSpread - 11, 6, 22, 38) // შორტი
      ctx.fillStyle = green
      ctx.fillRect(side * legSpread - 8, 40, 16, 32) // წინდები
      ctx.fillStyle = pink
      ctx.beginPath()
      ctx.ellipse(side * legSpread + side * 3, 74, 14, 7, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // მკლავები (ხელთათმანებით): მოლოდინში გვერდზე, ხტომისას ზემოთ
    const armAngle = lerp(1.25, 2.85, reach)
    for (const side of [-1, 1]) {
      ctx.save()
      ctx.translate(side * 26, -58)
      ctx.rotate(-side * armAngle)
      ctx.fillStyle = green
      ctx.fillRect(-6, -2, 12, 46)
      ctx.fillStyle = pink
      ctx.fillRect(-6, -2, 12, 8)
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(0, 54, 14, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ff9a3d'
      ctx.fillRect(-8, 40, 16, 6)
      ctx.restore()
    }

    // ტანი (ზოლებიანი მაისური)
    ctx.fillStyle = green
    ctx.beginPath()
    ctx.moveTo(-28, -64)
    ctx.lineTo(28, -64)
    ctx.lineTo(24, 12)
    ctx.lineTo(-24, 12)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = greenLight
    ctx.fillRect(-26, -44, 52, 11)
    ctx.fillRect(-25, -22, 50, 11)
    ctx.fillStyle = pink
    ctx.beginPath()
    ctx.moveTo(-12, -66)
    ctx.lineTo(0, -48)
    ctx.lineTo(12, -66)
    ctx.closePath()
    ctx.fill()

    // თავი
    ctx.fillStyle = '#e9b48a'
    ctx.beginPath()
    ctx.arc(0, -86, 21, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#e9b48a'
    ctx.fillRect(-7, -70, 14, 10)
    ctx.fillStyle = '#1a1f2b'
    ctx.beginPath()
    ctx.moveTo(-22, -92)
    for (let i = 0; i < 6; i++) {
      ctx.lineTo(-22 + i * 8.8 + 2, -112 - (i % 2) * 8)
      ctx.lineTo(-22 + i * 8.8 + 6, -96)
    }
    ctx.lineTo(22, -90)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#1a1f2b'
    ctx.beginPath()
    ctx.arc(-7, -86, 2.4, 0, Math.PI * 2)
    ctx.arc(7, -86, 2.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#7a3b2b'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, -78, 6, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()

    ctx.restore()
  }

  private drawConfetti() {
    const ctx = this.ctx
    for (const c of this.confetti) {
      ctx.save()
      ctx.globalAlpha = clamp(c.life, 0, 1)
      ctx.translate(c.x, c.y)
      ctx.rotate(c.rot)
      ctx.fillStyle = c.color
      ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2)
      ctx.restore()
    }
  }

  // ---------- ანგარიშის დაფა ----------

  private drawScoreboard() {
    const ctx = this.ctx
    const cx = this.viewW / 2
    const top = 10

    ctx.save()
    ctx.textBaseline = 'middle'

    const suddenDeath =
      this.kicks[0].length >= REGULATION_KICKS && this.kicks[1].length >= REGULATION_KICKS && this.phase !== 'over'
    const plateW = 600
    const plateH = suddenDeath ? 108 : 84
    ctx.fillStyle = 'rgba(7, 16, 38, 0.82)'
    this.roundRect(cx - plateW / 2, top, plateW, plateH, 18)
    ctx.fill()
    ctx.strokeStyle = 'rgba(120, 170, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.stroke()

    // ანგარიში
    ctx.textAlign = 'center'
    ctx.font = '900 44px Inter, system-ui, sans-serif'
    ctx.fillStyle = '#ffd86b'
    ctx.fillText(`${this.scores[0]} : ${this.scores[1]}`, cx, top + 30)

    // სახელები და დარტყმების ინდიკატორები
    const regularCount = Math.max(REGULATION_KICKS, this.kicks[0].length, this.kicks[1].length)
    for (const p of [0, 1] as const) {
      const sx = p === 0 ? cx - plateW / 2 + 22 : cx + plateW / 2 - 22
      const align: CanvasTextAlign = p === 0 ? 'left' : 'right'
      ctx.textAlign = align
      ctx.font = '800 20px Inter, system-ui, sans-serif'
      const isShooter = this.phase !== 'setup' && this.phase !== 'over' && this.shooter === p
      ctx.fillStyle = isShooter ? '#ffb15a' : '#ffffff'
      ctx.fillText(`${isShooter ? '⚽ ' : this.phase === 'setup' || this.phase === 'over' ? '' : '🧤 '}${this.names[p]}`, sx, top + 24)

      // წრეები
      const gap = 22
      const total = regularCount
      for (let i = 0; i < total; i++) {
        const dx = p === 0 ? sx + 8 + i * gap : sx - 8 - i * gap
        const dy = top + 56
        const result = this.kicks[p][i]
        ctx.beginPath()
        ctx.arc(dx, dy, 8, 0, Math.PI * 2)
        ctx.fillStyle = result === 'goal' ? '#3fe06f' : result ? '#ff5a5a' : 'rgba(255,255,255,0.18)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.65)'
        ctx.lineWidth = 1.5
        ctx.stroke()
        if (result && result !== 'goal') {
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(dx - 3.5, dy - 3.5)
          ctx.lineTo(dx + 3.5, dy + 3.5)
          ctx.moveTo(dx + 3.5, dy - 3.5)
          ctx.lineTo(dx - 3.5, dy + 3.5)
          ctx.stroke()
        }
      }
    }

    // დამატებითი დარტყმების აღნიშვნა
    if (suddenDeath) {
      ctx.textAlign = 'center'
      ctx.font = '800 16px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#ffd86b'
      ctx.fillText('⚡ დამატებითი დარტყმები — პირველ გაფუჭებამდე', cx, top + plateH - 16)
    }
    ctx.restore()
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    const ctx = this.ctx
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  private drawBanner() {
    const ctx = this.ctx
    const p = easeOut((this.phaseTime - 0.9) / 0.35)
    ctx.save()
    ctx.translate(this.viewW / 2, this.viewH * 0.68)
    ctx.scale(0.6 + 0.4 * p, 0.6 + 0.4 * p)
    ctx.globalAlpha = p
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '900 76px Inter, system-ui, sans-serif'
    ctx.lineWidth = 12
    ctx.strokeStyle = 'rgba(10, 16, 40, 0.8)'
    ctx.strokeText(this.resultTitle, 0, 0)
    ctx.fillStyle =
      this.shot.outcome === 'goal' ? '#ffe066' : this.shot.outcome === 'saved' ? '#7be7a5' : '#ff8a8a'
    ctx.fillText(this.resultTitle, 0, 0)
    ctx.restore()
  }

  // ====================================================== დახურვა

  private close() {
    if (this.disposed) return

    this.disposed = true
    this.disconnect()
    cancelAnimationFrame(this.frame)
    window.removeEventListener('keydown', this.keyHandler, true)
    window.removeEventListener('resize', this.resizeHandler)
    this.resizeObserver?.disconnect()

    this.root.remove()
    this.onClose?.()
  }
}
