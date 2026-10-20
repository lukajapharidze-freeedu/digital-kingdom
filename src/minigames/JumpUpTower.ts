/** საკონტროლო კითხვა (აკადემიის/CPU Dash-ის იგივე ფორმატი) */
export type TowerQuestion = {
  prompt: string
  answers: string[]
  hint?: string
  check?: (input: string) => boolean
}

/** შენახული checkpoint: რომელ ეტაპზეა, რამდენი სართული აქვს და ელოდება თუ არა კითხვას */
export type TowerCheckpoint = {
  stage: number
  floors: number
  gate: boolean
}

export type JumpUpTowerOptions = {
  onClose?: () => void
  questions?: TowerQuestion[]
  checkpoint?: TowerCheckpoint | null
  onCheckpoint?: (checkpoint: TowerCheckpoint | null) => void
}

type PlatformType = 'wood' | 'stone' | 'ice' | 'cracked' | 'moving' | 'checkpoint'

type Platform = {
  id: number
  type: PlatformType
  x: number
  y: number // ზედა ზედაპირი (სამყაროს კოორდინატები, y ქვევით იზრდება)
  w: number
  h: number
  baseX: number
  amp: number
  speed: number
  phase: number
  dx: number // ამ კადრში გადაადგილება (რომ მოძრავმა საფეხურმა გმირი წაიღოს)
  state: 'idle' | 'shaking' | 'falling'
  timer: number
  triggered: boolean
  vy: number
  floor: number
  stageNo: number // checkpoint-ისთვის: რომელი ეტაპი იწყება აქ
}

type Star = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  rot: number
  vr: number
  size: number
  color: string
}

type Debris = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  w: number
  color: string
}

// ---------- მუდმივები ----------

const PW = 640 // სათამაშო დერეფნის სიგანე (ლოგიკური ერთეული)
const LEFT = 38 // მარცხენა კედელი (დერეფნის შიგნით)
const RIGHT = PW - 38
const BASE_VIEW_H = 720

const PHYS = {
  gravity: 1800,
  maxFall: 1250,
  jump: 800,
  boostJump: 520, // ბუსტის მაქსიმალური დამატებითი სიჩქარე
  runMax: 360,
  boostFill: 1.15, // წამში (ადრე 0.85)
  boostDecay: 0.13, // ნელა ჩამოდის (ახტომაზე არ იკარგება)
  accelGround: 2400,
  frictionGround: 2600,
  accelIce: 650,
  frictionIce: 230,
  accelAir: 1500,
  dragAir: 60,
  coyote: 0.1,
  jumpBuffer: 0.12,
}

const BODY_W = 26
const BODY_H = 48
const HALF_W = 11 // საფეხურზე დადგომის ნახევარ-სიგანე

const BOOST_READY = 0.35
/** ყოველი რამდენი გავლილი ეტაპის შემდეგ ამოდის საკონტროლო კითხვა */
const QUESTION_EVERY_STAGES = 2
const FLIP_TIME_SHARE = 0.8

/** ეტაპები: საფეხურების რაოდენობა და სახეობები */
const STAGES: {
  count: number
  gap: [number, number]
  width: [number, number]
  types: [PlatformType, number][]
  tint: string
  window: string
  name: string
}[] = [
  { count: 12, gap: [108, 130], width: [170, 240], types: [['wood', 1]], tint: '#6a6f7a', window: '#3a5fa8', name: 'ქვის დარბაზი' },
  { count: 16, gap: [112, 136], width: [150, 220], types: [['wood', 5], ['stone', 3], ['cracked', 1]], tint: '#7a6248', window: '#c27a2d', name: 'ცეცხლის დერეფანი' },
  { count: 20, gap: [114, 140], width: [140, 210], types: [['wood', 3], ['stone', 2], ['ice', 4]], tint: '#4c7fa8', window: '#7fd2ff', name: 'ყინულის კოშკი' },
  { count: 24, gap: [116, 142], width: [130, 200], types: [['ice', 3], ['moving', 3], ['wood', 2], ['stone', 1]], tint: '#4f7f5a', window: '#7ee08a', name: 'ხავსიანი სარდაფი' },
  { count: 28, gap: [118, 144], width: [120, 190], types: [['ice', 3], ['moving', 3], ['cracked', 2], ['wood', 2]], tint: '#6a4a8a', window: '#c58cff', name: 'მაგიის დარბაზი' },
  { count: 32, gap: [120, 146], width: [110, 180], types: [['ice', 3], ['moving', 3], ['cracked', 3], ['stone', 1], ['wood', 1]], tint: '#8a3a46', window: '#ff6b6b', name: 'მეფის კოშკი' },
]

const FALL_DELAY: Record<PlatformType, number> = {
  wood: 1.6,
  stone: 2.2,
  ice: 1.5,
  cracked: 0.6,
  moving: 1.6,
  checkpoint: 1e9,
}

const STAR_COLORS = ['#ffe066', '#ffffff', '#ffd1f0', '#a6f0ff', '#ffc857']

// ---------- დამხმარე ----------

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`
}

function mixHex(a: string, b: string, t: number): string {
  const k = Math.max(0, Math.min(1, t))
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const f = (x: number, y: number) => Math.round(x + (y - x) * k).toString(16).padStart(2, '0')
  return `#${f(ar, br)}${f(ag, bg)}${f(ab, bb)}`
}

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function mod(a: number, m: number): number {
  return ((a % m) + m) % m
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

function pickType(types: [PlatformType, number][]): PlatformType {
  const total = types.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [type, w] of types) {
    r -= w
    if (r <= 0) return type
  }
  return types[0][0]
}

export class JumpUpTower {
  private static best = 0

  private readonly onClose: (() => void) | undefined
  private readonly questions: TowerQuestion[]
  private readonly onCheckpoint: ((cp: TowerCheckpoint | null) => void) | undefined
  private readonly savedCheckpoint: TowerCheckpoint | null
  private root!: HTMLDivElement
  private canvas!: HTMLCanvasElement
  private ctx!: CanvasRenderingContext2D
  private modal!: HTMLDivElement
  private startModal!: HTMLDivElement
  private quizModal!: HTMLDivElement
  private bigEl!: HTMLElement
  private infoEl!: HTMLElement
  private cpButton!: HTMLElement
  private topCpButton!: HTMLButtonElement
  private startInfoEl!: HTMLElement
  private quizText!: HTMLElement
  private quizResult!: HTMLElement
  private quizHint!: HTMLElement
  private quizInput!: HTMLInputElement
  private quizSubmit!: HTMLElement
  private quizRetry!: HTMLElement

  private frame = 0
  private lastTime = 0
  private disposed = false

  // ხედვა
  private viewScale = 1
  private viewW = PW
  private viewH = BASE_VIEW_H
  private offsetX = 0
  private camY = 0

  // მდგომარეობა
  private time = 0
  private dead = false
  private deadTime = 0
  private started = false
  private idCounter = 0
  private platforms: Platform[] = []
  private topY = 0
  private genStage = 1
  private genIndex = 0
  private genFloor = 0
  private placedInStage = 0
  private floors = 0
  private floorsAtCheckpoint = 0
  private checkpointStage = 1
  private banner = 0
  private bannerText = ''
  private tintFrom = STAGES[0].tint
  private tintTo = STAGES[0].tint
  private windowFrom = STAGES[0].window
  private windowTo = STAGES[0].window
  private tintT = 1

  // გმირი
  private px = PW / 2
  private py = 0
  private vx = 0
  private vy = 0
  private grounded = false
  private support: Platform | null = null
  private facing = 1
  private runPhase = 0
  private coyoteT = 0
  private jumpBufferT = 0
  private boost = 0
  private lastDir = 0
  private starsLeft = 0
  private starTimer = 0

  private keys = { left: false, right: false }
  private stars: Star[] = []
  private debris: Debris[] = []
  private brickPattern: CanvasPattern | null = null
  private flash = 0

  // კითხვები და პაუზა
  private paused = false
  private gatePending = false
  private currentQuestion: TowerQuestion | null = null
  private lastQuestionPrompt = ''

  // ბუსტით ახტომის ტრიუკები
  private flipAngle = 0
  private flipTarget = 0
  private flipRate = 0
  private lastJumpBoosted = false
  private boostChain = 0
  private popups: { text: string; x: number; y: number; life: number }[] = []

  constructor(options: JumpUpTowerOptions = {}) {
    this.onClose = options.onClose
    this.questions = options.questions ?? []
    this.onCheckpoint = options.onCheckpoint
    this.savedCheckpoint = options.checkpoint && options.checkpoint.stage > 1 ? options.checkpoint : null
    this.build()

    if (this.savedCheckpoint) {
      // შენახული checkpoint ჯერ არ ვკარგავთ: მოსწავლე თავად ირჩევს
      this.newRun(1)
      this.checkpointStage = this.savedCheckpoint.stage
      this.floorsAtCheckpoint = this.savedCheckpoint.floors
      this.gatePending = this.savedCheckpoint.gate && this.questions.length > 0
      this.startInfoEl.textContent = `ეტაპი ${this.savedCheckpoint.stage} • სართული ${this.savedCheckpoint.floors}`
      this.paused = true
      this.startModal.hidden = false
    } else {
      this.newRun(1)
    }
    this.lastTime = performance.now()
    this.frame = requestAnimationFrame(this.loop)
  }

  // ---------- DOM ----------

  private build() {
    this.root = document.createElement('div')
    this.root.className = 'jt-root'
    this.root.innerHTML = `
      <style>
        .jt-root { position: fixed; inset: 0; z-index: 2000; background: #0b0d14; overflow: hidden;
          font-family: Arial, sans-serif; user-select: none; touch-action: none; }
        .jt-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        .jt-exit { position: absolute; top: 16px; right: 16px; z-index: 5; padding: 10px 16px; border: 0;
          border-radius: 12px; background: rgba(21, 42, 64, 0.85); color: #fff; font-size: 15px;
          font-weight: bold; cursor: pointer; }
        .jt-exit:hover { background: rgba(40, 70, 104, 0.95); }
        .jt-cpbtn { position: absolute; top: 16px; right: 156px; z-index: 5; padding: 10px 16px; border: 0;
          border-radius: 12px; background: rgba(160, 108, 20, 0.92); color: #fff; font-size: 15px;
          font-weight: bold; cursor: pointer; }
        .jt-cpbtn:hover { background: rgba(196, 134, 30, 0.97); }
        .jt-cpbtn:disabled { opacity: 0.45; cursor: default; background: rgba(60, 70, 90, 0.9); }
        .jt-modal { position: absolute; inset: 0; z-index: 6; display: flex; align-items: center;
          justify-content: center; background: rgba(4, 8, 18, 0.66); backdrop-filter: blur(5px); }
        .jt-modal[hidden] { display: none; }
        .jt-card { width: min(470px, 92vw); padding: 28px; border-radius: 22px; text-align: center;
          background: linear-gradient(145deg, #1a2140, #0e1428); color: #e8f4ff;
          border: 2px solid rgba(255, 210, 120, 0.5); box-shadow: 0 20px 70px rgba(0,0,0,0.55); }
        .jt-card h2 { margin: 0 0 6px; font-size: 26px; }
        .jt-big { font-size: 46px; font-weight: 900; margin: 6px 0; color: #ffd86b; }
        .jt-small { color: #9fb4d0; font-size: 14px; margin-top: 12px; }
        .jt-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 14px; }
        .jt-btn { border: 0; border-radius: 12px; padding: 12px 20px; min-width: 130px; font-size: 16px;
          font-weight: bold; color: #fff; cursor: pointer; background: #27834a; }
        .jt-btn.jt-secondary { background: #315b88; }
        .jt-btn[hidden] { display: none; }
        .jt-qtext { font-size: 22px; line-height: 1.5; margin: 12px 0 14px; color: #fff; }
        .jt-input { width: 100%; padding: 12px 14px; border-radius: 12px; border: 2px solid #6e86b8;
          background: #0b1226; color: #fff; font-size: 20px; text-align: center; outline: none; }
        .jt-input:focus { border-color: #ffd86b; }
        .jt-input[hidden] { display: none; }
        .jt-result { min-height: 24px; margin-top: 12px; font-size: 17px; line-height: 1.5; font-weight: bold; }
        .jt-hint { margin-top: 6px; color: #ffd28a; font-size: 15px; line-height: 1.5; }
      </style>
      <canvas class="jt-canvas"></canvas>
      <button class="jt-cpbtn" type="button" tabindex="-1" disabled>🚩 checkpoint-იდან</button>
      <button class="jt-exit" type="button" tabindex="-1">✕ გასვლა (Esc)</button>
      <div class="jt-modal" hidden>
        <div class="jt-card">
          <h2>🏰 ჩამოვარდი!</h2>
          <div class="jt-big">0</div>
          <div class="jt-info"></div>
          <div class="jt-row">
            <button class="jt-btn jt-checkpoint" type="button">🚩 ბოლო checkpoint-იდან</button>
            <button class="jt-btn jt-secondary jt-again" type="button">↻ თავიდან</button>
            <button class="jt-btn jt-secondary jt-leave" type="button">გასვლა</button>
          </div>
          <div class="jt-small">Enter — გაგრძელება</div>
        </div>
      </div>
      <div class="jt-modal jt-start" hidden>
        <div class="jt-card">
          <h2>🚩 შენახული checkpoint</h2>
          <div class="jt-big jt-startinfo"></div>
          <div class="jt-small">გინდა იქიდან გააგრძელო, საიდანაც გაჩერდი?</div>
          <div class="jt-row">
            <button class="jt-btn jt-continue" type="button">🚩 გაგრძელება</button>
            <button class="jt-btn jt-secondary jt-restart" type="button">↻ თავიდან</button>
          </div>
        </div>
      </div>
      <div class="jt-modal jt-quiz" hidden>
        <div class="jt-card">
          <h2>🧠 საკონტროლო კითხვა</h2>
          <div class="jt-small">ორი ეტაპი გაიარე! უპასუხე და გააგრძელე.</div>
          <div class="jt-qtext"></div>
          <input class="jt-input" type="text" autocomplete="off" spellcheck="false" placeholder="ჩაწერე პასუხი..." />
          <div class="jt-result"></div>
          <div class="jt-hint"></div>
          <div class="jt-row">
            <button class="jt-btn jt-submit" type="button">✔ პასუხი</button>
            <button class="jt-btn jt-secondary jt-qretry" type="button" hidden>↻ ახალი კითხვა</button>
            <button class="jt-btn jt-secondary jt-qleave" type="button">გასვლა</button>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(this.root)

    this.canvas = this.root.querySelector('.jt-canvas') as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
    const q = <T extends HTMLElement>(sel: string) => this.root.querySelector(sel) as T
    this.modal = q<HTMLDivElement>('.jt-modal:not(.jt-start):not(.jt-quiz)')
    this.startModal = q<HTMLDivElement>('.jt-start')
    this.quizModal = q<HTMLDivElement>('.jt-quiz')
    this.bigEl = q('.jt-big')
    this.infoEl = q('.jt-info')
    this.cpButton = q('.jt-checkpoint')
    this.topCpButton = q<HTMLButtonElement>('.jt-cpbtn')
    this.topCpButton.disabled = true
    this.startInfoEl = q('.jt-startinfo')
    this.quizText = q('.jt-qtext')
    this.quizResult = q('.jt-result')
    this.quizHint = q('.jt-hint')
    this.quizInput = q<HTMLInputElement>('.jt-input')
    this.quizSubmit = q('.jt-submit')
    this.quizRetry = q('.jt-qretry')

    this.root.querySelector('.jt-exit')!.addEventListener('click', () => this.close())
    this.root.querySelector('.jt-leave')!.addEventListener('click', () => this.close())
    this.topCpButton.addEventListener('click', () => {
      this.topCpButton.blur?.() // SPACE (ახტომა) ღილაკს შემთხვევით არ უნდა "დააჭიროს"
      if (this.checkpointStage > 1) this.resumeFromCheckpoint()
    })
    this.root.querySelector('.jt-again')!.addEventListener('click', () => this.startFresh())
    this.root.querySelector('.jt-checkpoint')!.addEventListener('click', () => this.resumeFromCheckpoint())
    this.root.querySelector('.jt-continue')!.addEventListener('click', () => {
      this.startModal.hidden = true
      this.resumeFromCheckpoint()
    })
    this.root.querySelector('.jt-restart')!.addEventListener('click', () => {
      this.startModal.hidden = true
      this.startFresh()
    })
    this.root.querySelector('.jt-qleave')!.addEventListener('click', () => this.close())
    this.quizSubmit.addEventListener('click', () => this.submitAnswer())
    this.quizRetry.addEventListener('click', () => this.openQuiz())
    this.quizInput.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        this.submitAnswer()
      }
    })

    window.addEventListener('keydown', this.keyDownHandler, true)
    window.addEventListener('keyup', this.keyUpHandler, true)
    window.addEventListener('blur', this.blurHandler)
    window.addEventListener('resize', this.resizeHandler)
    this.resize()
  }

  private readonly resizeHandler = () => this.resize()

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
    const realW = window.innerWidth
    const realH = window.innerHeight
    this.canvas.width = Math.floor(realW * dpr)
    this.canvas.height = Math.floor(realH * dpr)

    this.viewScale = Math.min(realH / BASE_VIEW_H, realW / (PW + 40))
    this.viewW = realW / this.viewScale
    this.viewH = realH / this.viewScale
    this.offsetX = (this.viewW - PW) / 2
    this.ctx.setTransform(dpr * this.viewScale, 0, 0, dpr * this.viewScale, 0, 0)
  }

  // ---------- შეყვანა ----------

  private readonly keyDownHandler = (event: KeyboardEvent) => {
    if (event.code === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      this.close()
      return
    }

    // კითხვის/არჩევანის ფანჯარა: კლავიშები ტექსტის ველს უნდა დარჩეს (SPACE, ისრები, A/D...)
    if (this.paused) return

    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      this.keys.left = true
    } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      this.keys.right = true
    } else if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
      event.preventDefault()
      if (!event.repeat) this.jumpBufferT = PHYS.jumpBuffer
    } else if (event.code === 'Enter' && this.dead && this.deadTime > 0.5) {
      event.preventDefault()
      if (this.checkpointStage > 1) this.resumeFromCheckpoint()
      else this.startFresh()
      return
    } else {
      return
    }
    event.preventDefault()
    event.stopPropagation()
  }

  private readonly keyUpHandler = (event: KeyboardEvent) => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') this.keys.left = false
    if (event.code === 'ArrowRight' || event.code === 'KeyD') this.keys.right = false
  }

  private readonly blurHandler = () => {
    this.keys.left = false
    this.keys.right = false
  }

  // ---------- სამყაროს აგება ----------

  /** იწყებს თამაშს მოცემული ეტაპის checkpoint-იდან */
  private newRun(stage: number, keepFloors = false) {
    this.modal.hidden = true
    this.quizModal.hidden = true
    this.paused = false
    this.currentQuestion = null
    this.flipAngle = 0
    this.flipTarget = 0
    this.lastJumpBoosted = false
    this.boostChain = 0
    this.popups = []
    this.dead = false
    this.deadTime = 0
    this.platforms = []
    this.stars = []
    this.debris = []
    this.idCounter = 0
    this.genStage = stage
    this.genIndex = Math.min(stage - 1, STAGES.length - 1)
    this.placedInStage = 0
    this.camY = 0
    this.started = false

    if (stage === 1 || !keepFloors) {
      this.floors = 0
      this.floorsAtCheckpoint = 0
      this.checkpointStage = stage
    } else {
      this.floors = this.floorsAtCheckpoint
      this.checkpointStage = stage
    }
    this.genFloor = this.floors

    const baseY = BASE_VIEW_H - 90
    this.platforms.push(this.makeCheckpoint(stage, baseY))
    this.topY = baseY

    this.px = PW / 2
    this.py = baseY
    this.vx = 0
    this.vy = 0
    this.grounded = true
    this.support = this.platforms[0]
    this.boost = 0
    this.starsLeft = 0
    this.coyoteT = 0
    this.jumpBufferT = 0
    this.banner = 2.4
    this.bannerText = `ეტაპი ${stage}`
    const st = STAGES[this.genIndex]
    this.tintFrom = st.tint
    this.tintTo = st.tint
    this.windowFrom = st.window
    this.windowTo = st.window
    this.tintT = 1
    this.generateAhead()
  }

  /** თავიდან დაწყება: შენახული checkpoint იშლება */
  private startFresh() {
    this.gatePending = false
    this.onCheckpoint?.(null)
    this.newRun(1)
  }

  /** ბოლო checkpoint-იდან გაგრძელება (თუ კითხვა ჯერ პასუხგაუცემელია, ისევ ამოდის) */
  private resumeFromCheckpoint() {
    const stage = this.checkpointStage
    const gate = this.gatePending
    this.newRun(stage, true)
    this.gatePending = gate && this.questions.length > 0
    if (this.gatePending) this.openQuiz()
  }

  private isGateStage(stage: number): boolean {
    return stage > QUESTION_EVERY_STAGES && (stage - 1) % QUESTION_EVERY_STAGES === 0
  }

  private persistCheckpoint() {
    if (this.checkpointStage <= 1) {
      this.onCheckpoint?.(null)
      return
    }
    this.onCheckpoint?.({
      stage: this.checkpointStage,
      floors: this.floorsAtCheckpoint,
      gate: this.gatePending,
    })
  }

  // ---------- საკონტროლო კითხვები ----------

  private openQuiz() {
    if (this.questions.length === 0) {
      this.gatePending = false
      this.paused = false
      this.persistCheckpoint()
      return
    }

    const pool = this.questions.filter(q => q.prompt !== this.lastQuestionPrompt)
    const list = pool.length > 0 ? pool : this.questions
    const question = list[Math.floor(Math.random() * list.length)]
    this.currentQuestion = question
    this.lastQuestionPrompt = question.prompt

    this.paused = true
    this.quizModal.hidden = false
    this.quizText.textContent = question.prompt
    this.quizResult.textContent = ''
    this.quizHint.textContent = ''
    this.quizInput.value = ''
    this.quizInput.hidden = false
    this.quizSubmit.hidden = false
    this.quizRetry.hidden = true
    this.quizInput.focus?.()
  }

  private submitAnswer() {
    const question = this.currentQuestion
    if (!question || !this.paused || this.quizInput.hidden) return

    const value = this.quizInput.value
    if (value.trim() === '') return

    const normalize = (text: string) => text.toLowerCase().replace(/[\s.,!?'"„“]+/g, '')
    const ok = question.check
      ? question.check(value)
      : question.answers.some(answer => normalize(answer) === normalize(value))

    if (ok) {
      this.quizModal.hidden = true
      this.paused = false
      this.currentQuestion = null
      this.gatePending = false
      this.persistCheckpoint()
      this.banner = 2
      this.bannerText = '✅ სწორია!'
      this.flash = 0.3
      this.burstStars(32)
      return
    }

    // არასწორი პასუხი: თამაში აქ ჩერდება, checkpoint კი რჩება
    this.quizResult.textContent = '❌ არასწორია — თამაში აქ ჩერდება'
    this.quizHint.textContent =
      `${question.hint ?? ''} შენი checkpoint შენახულია (ეტაპი ${this.checkpointStage}). ` +
      'გადაიკითხე ბიბლიოთეკაში და მერე სცადე ხელახლა.'
    this.quizInput.hidden = true
    this.quizSubmit.hidden = true
    this.quizRetry.hidden = false
  }

  private makeCheckpoint(stageNo: number, y: number): Platform {
    return {
      id: this.idCounter++,
      type: 'checkpoint',
      x: 0,
      y,
      w: PW,
      h: 26,
      baseX: 0,
      amp: 0,
      speed: 0,
      phase: 0,
      dx: 0,
      state: 'idle',
      timer: 1e9,
      triggered: true,
      vy: 0,
      floor: this.genFloor,
      stageNo,
    }
  }

  private generateAhead() {
    while (this.topY > this.camY - 900) this.addNext()
  }

  private addNext() {
    const st = STAGES[this.genIndex]
    const count = st.count + Math.max(0, this.genStage - STAGES.length) * 4

    // ეტაპის ბოლოს — checkpoint ხაზი
    if (this.placedInStage >= count) {
      const gap = 120
      const y = this.topY - gap
      this.genStage += 1
      this.genIndex = Math.min(this.genStage - 1, STAGES.length - 1)
      this.platforms.push(this.makeCheckpoint(this.genStage, y))
      this.topY = y
      this.placedInStage = 0
      return
    }

    const gap = st.gap[0] + Math.random() * (st.gap[1] - st.gap[0])
    const y = this.topY - gap
    const type = pickType(st.types)
    let w = st.width[0] + Math.random() * (st.width[1] - st.width[0])
    if (type === 'stone') w = Math.min(w + 40, RIGHT - LEFT - 20)
    if (type === 'cracked') w = Math.max(100, w - 30)

    // წინა საფეხურთან შედარებით ჰორიზონტალური გადახრა: ისე, რომ ჩვეულებრივი ხტომა მისწვდეს
    const prev = this.platforms[this.platforms.length - 1]
    const prevCenter = prev.x + prev.w / 2
    const maxDx = 210 + Math.min(this.genStage, 8) * 12
    let center = prevCenter + (Math.random() * 2 - 1) * maxDx
    if (prev.type === 'checkpoint') center = PW / 2 + (Math.random() * 2 - 1) * 160
    center = clamp(center, LEFT + w / 2 + 6, RIGHT - w / 2 - 6)

    const moving = type === 'moving'
    const amp = moving ? Math.min(70, (RIGHT - LEFT - w) / 2 - 6) : 0
    if (moving) center = clamp(center, LEFT + w / 2 + amp + 6, RIGHT - w / 2 - amp - 6)

    this.platforms.push({
      id: this.idCounter++,
      type,
      x: center - w / 2,
      y,
      w,
      h: 18,
      baseX: center - w / 2,
      amp: Math.max(0, amp),
      speed: 0.9 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      dx: 0,
      state: 'idle',
      timer: FALL_DELAY[type],
      triggered: false,
      vy: 0,
      floor: ++this.genFloor,
      stageNo: this.genStage,
    })
    this.topY = y
    this.placedInStage++
  }

  // ---------- ფიზიკა ----------

  private update(dt: number) {
    this.time += dt
    const hasCheckpoint = this.checkpointStage > 1
    if (this.topCpButton.disabled === hasCheckpoint) this.topCpButton.disabled = !hasCheckpoint
    if (this.banner > 0) this.banner = Math.max(0, this.banner - dt)
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2)
    if (this.tintT < 1) this.tintT = Math.min(1, this.tintT + dt / 1.8)

    this.updateParticles(dt)
    for (const popup of this.popups) {
      popup.life -= dt
      popup.y -= 46 * dt
    }
    this.popups = this.popups.filter(popup => popup.life > 0)

    // კითხვის ან არჩევანის ფანჯარა: სამყარო ჩერდება
    if (this.paused) return

    this.updatePlatforms(dt)

    if (this.dead) {
      this.deadTime += dt
      return
    }

    this.updateHero(dt)
    this.updateCamera(dt)
    this.generateAhead()

    // ჩამოვარდნა ეკრანის ქვემოთ
    if (this.py - this.camY > this.viewH + 90) this.die()
  }

  private updatePlatforms(dt: number) {
    for (const p of this.platforms) {
      p.dx = 0

      if (p.type === 'moving' && p.state === 'idle' && p.amp > 0) {
        const nx = p.baseX + Math.sin(this.time * p.speed + p.phase) * p.amp
        p.dx = nx - p.x
        p.x = nx
      }

      if (p.type !== 'checkpoint' && p.triggered && p.state !== 'falling') {
        p.timer -= dt
        if (p.timer <= 0.45) p.state = 'shaking'
        if (p.timer <= 0) {
          p.state = 'falling'
          p.vy = 0
          this.spawnDebris(p)
          if (this.support === p) {
            this.support = null
            this.grounded = false
          }
        }
      }

      if (p.state === 'falling') {
        p.vy = Math.min(1400, p.vy + 1900 * dt)
        p.y += p.vy * dt
      }
    }

    this.platforms = this.platforms.filter(p => p.y - this.camY < this.viewH + 400)
  }

  private updateHero(dt: number) {
    const dir = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0)
    const onIce = this.grounded && this.support?.type === 'ice'

    // მოძრაობა
    const accel = this.grounded ? (onIce ? PHYS.accelIce : PHYS.accelGround) : PHYS.accelAir
    if (dir !== 0) {
      this.vx += dir * accel * dt
      this.vx = clamp(this.vx, -PHYS.runMax, PHYS.runMax)
      this.facing = dir
    } else if (this.grounded) {
      const fr = (onIce ? PHYS.frictionIce : PHYS.frictionGround) * dt
      if (Math.abs(this.vx) <= fr) this.vx = 0
      else this.vx -= Math.sign(this.vx) * fr
    } else {
      this.vx -= this.vx * Math.min(1, PHYS.dragAir * dt * 0.02)
    }

    // ბუსტი: სწრაფი მოძრაობა საფეხურზე ავსებს, მიმართულების შეცვლა ამატებს
    const fast = Math.abs(this.vx) > PHYS.runMax * 0.68
    if (this.grounded && fast) {
      this.boost = Math.min(1, this.boost + dt * PHYS.boostFill)
    } else {
      // ბუსტი ახტომაზე არ იკარგება, უბრალოდ ნელა ჩამოდის
      this.boost = Math.max(0, this.boost - dt * PHYS.boostDecay)
    }
    if (dir !== 0 && this.lastDir !== 0 && dir !== this.lastDir && this.grounded && Math.abs(this.vx) > 120) {
      this.boost = Math.min(1, this.boost + 0.16)
    }
    if (dir !== 0) this.lastDir = dir

    // ხტომა (დაბუფერებით და "койот"-დროით)
    if (this.grounded) this.coyoteT = PHYS.coyote
    else this.coyoteT = Math.max(0, this.coyoteT - dt)
    this.jumpBufferT = Math.max(0, this.jumpBufferT - dt)

    if (this.jumpBufferT > 0 && this.coyoteT > 0) {
      this.doJump()
    }

    // გრავიტაცია და გადაადგილება
    const prevBottom = this.py
    this.vy = Math.min(PHYS.maxFall, this.vy + PHYS.gravity * dt)
    this.px += this.vx * dt
    this.py += this.vy * dt

    // მოძრავი საფეხური წაიღებს
    if (this.grounded && this.support) this.px += this.support.dx

    // კედლები: ჰაერში ხტება უკან, მიწაზე ჩერდება
    const minX = LEFT + BODY_W / 2
    const maxX = RIGHT - BODY_W / 2
    if (this.px < minX) {
      this.px = minX
      this.vx = this.grounded ? 0 : Math.abs(this.vx) * 0.55
    } else if (this.px > maxX) {
      this.px = maxX
      this.vx = this.grounded ? 0 : -Math.abs(this.vx) * 0.55
    }

    // დაშვება საფეხურზე
    this.grounded = false
    this.support = null
    if (this.vy >= 0) {
      for (const p of this.platforms) {
        if (p.state === 'falling') continue
        const top = p.y
        if (prevBottom > top + 8 || this.py < top) continue
        if (this.px + HALF_W < p.x || this.px - HALF_W > p.x + p.w) continue
        this.land(p)
        break
      }
    }

    // ტრიუკი: ჰაერში ბრუნავს, დაშვებისას სწრაფად სწორდება
    if (!this.grounded && this.flipTarget !== 0 && Math.abs(this.flipAngle) < Math.abs(this.flipTarget)) {
      this.flipAngle += Math.sign(this.flipTarget) * this.flipRate * dt
      if (Math.abs(this.flipAngle) > Math.abs(this.flipTarget)) this.flipAngle = this.flipTarget
    } else if (this.grounded && this.flipTarget !== 0) {
      this.flipAngle += (this.flipTarget - this.flipAngle) * Math.min(1, 22 * dt)
      if (Math.abs(this.flipTarget - this.flipAngle) < 0.03) {
        this.flipAngle = 0
        this.flipTarget = 0
      }
    }

    // ცხოველმყოფელი მახასიათებლები: სირბილის ფაზა, ვარსკვლავები
    if (this.grounded) this.runPhase += Math.abs(this.vx) * dt * 0.055
    this.updateStarTrail(dt)

    if (!this.started && (dir !== 0 || !this.grounded)) this.started = true
  }

  private doJump() {
    const ready = this.boost >= BOOST_READY
    const extra = ready ? this.boost * PHYS.boostJump : 0
    const v = PHYS.jump + extra
    this.vy = -v
    this.grounded = false
    this.support = null
    this.coyoteT = 0
    this.jumpBufferT = 0

    if (!ready) {
      this.lastJumpBoosted = false
      this.boostChain = 0
      return
    }

    this.starsLeft = 0.5 + this.boost * 0.9
    this.burstStars(18 + Math.round(this.boost * 22))
    this.flash = 0.2

    // ბუსტიანი ახტომა: ხან front flip, ხან backflip; ზედიზედ ბუსტებზე — double flip
    this.boostChain = this.lastJumpBoosted ? this.boostChain + 1 : 1
    this.lastJumpBoosted = true
    const flips = this.boostChain >= 2 ? 2 : 1
    const direction = Math.random() < 0.5 ? 1 : -1
    const airTime = (2 * v) / PHYS.gravity
    this.flipAngle = 0
    this.flipTarget = direction * flips * Math.PI * 2
    this.flipRate = Math.abs(this.flipTarget) / (airTime * FLIP_TIME_SHARE)

    const label = flips === 2 ? 'DOUBLE FLIP!' : direction > 0 ? 'FRONT FLIP!' : 'BACK FLIP!'
    this.popups.push({ text: label, x: this.px, y: this.py - BODY_H - 18, life: 1.1 })
  }

  private land(p: Platform) {
    this.py = p.y
    this.vy = 0
    this.grounded = true
    this.support = p

    if (!p.triggered) {
      p.triggered = true
      p.timer = FALL_DELAY[p.type]
    }

    if (p.type === 'checkpoint') {
      // ახალი ეტაპი: ვინახავთ checkpoint-ს და ვაჩვენებთ ბანერს
      if (p.stageNo > this.checkpointStage) {
        this.checkpointStage = p.stageNo
        this.floorsAtCheckpoint = this.floors
        const gate = this.isGateStage(p.stageNo) && this.questions.length > 0
        this.gatePending = gate
        this.persistCheckpoint()
        this.banner = 2.4
        this.bannerText = `ეტაპი ${p.stageNo}`
        const st = STAGES[Math.min(p.stageNo - 1, STAGES.length - 1)]
        this.tintFrom = this.tintTo
        this.windowFrom = this.windowTo
        this.tintTo = st.tint
        this.windowTo = st.window
        this.tintT = 0
        this.flash = 0.3
        this.burstStars(26)
        if (gate) {
          this.vx = 0
          this.openQuiz()
        }
      }
    } else if (p.floor > this.floors) {
      this.floors = p.floor
    }
  }

  private updateCamera(dt: number) {
    const target = this.py - this.viewH * 0.46
    if (target < this.camY) {
      this.camY += (target - this.camY) * Math.min(1, 7 * dt)
    }
  }

  private die() {
    this.dead = true
    this.deadTime = 0
    JumpUpTower.best = Math.max(JumpUpTower.best, this.floors)

    this.bigEl.textContent = `სართული ${this.floors}`
    this.infoEl.textContent = `ეტაპი ${this.checkpointStage} • რეკორდი: ${JumpUpTower.best}`
    this.cpButton.hidden = this.checkpointStage <= 1

    window.setTimeout(() => {
      if (!this.disposed && this.dead) this.modal.hidden = false
    }, 500)
  }

  // ---------- ეფექტები ----------

  private burstStars(count: number) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 60 + Math.random() * 280
      this.stars.push({
        x: this.px,
        y: this.py - BODY_H * 0.4,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 80,
        life: 0.7 + Math.random() * 0.6,
        max: 1.3,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 10,
        size: 5 + Math.random() * 6,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      })
    }
    if (this.stars.length > 260) this.stars.splice(0, this.stars.length - 260)
  }

  private updateStarTrail(dt: number) {
    if (this.starsLeft <= 0) return
    this.starsLeft -= dt
    this.starTimer -= dt
    if (this.starTimer > 0) return
    this.starTimer = 0.025
    for (let i = 0; i < 2; i++) {
      this.stars.push({
        x: this.px + (Math.random() - 0.5) * 16,
        y: this.py - BODY_H * 0.3 + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 80,
        vy: 60 + Math.random() * 120,
        life: 0.55 + Math.random() * 0.35,
        max: 0.9,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 8,
        size: 4 + Math.random() * 5,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      })
    }
  }

  private spawnDebris(p: Platform) {
    const colors = p.type === 'ice' ? ['#bfeaff', '#8fd3ff', '#ffffff'] : p.type === 'stone' ? ['#8c8f99', '#6f7380', '#a7abb5'] : ['#8a5a2b', '#a9713a', '#6b4421']
    for (let i = 0; i < 12; i++) {
      this.debris.push({
        x: p.x + Math.random() * p.w,
        y: p.y + Math.random() * p.h,
        vx: (Math.random() - 0.5) * 140,
        vy: -20 + Math.random() * 60,
        life: 0.7 + Math.random() * 0.5,
        w: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }
    if (this.debris.length > 160) this.debris.splice(0, this.debris.length - 160)
  }

  private updateParticles(dt: number) {
    for (const s of this.stars) {
      s.life -= dt
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.vy += 260 * dt
      s.rot += s.vr * dt
    }
    this.stars = this.stars.filter(s => s.life > 0)

    for (const d of this.debris) {
      d.life -= dt
      d.x += d.vx * dt
      d.y += d.vy * dt
      d.vy += 900 * dt
    }
    this.debris = this.debris.filter(d => d.life > 0)
  }

  // ---------- ციკლი ----------

  private readonly loop = (now: number) => {
    if (this.disposed) return
    this.frame = requestAnimationFrame(this.loop)

    const dt = Math.min((now - this.lastTime) / 1000, 0.035)
    this.lastTime = now
    this.update(dt)
    this.draw()
  }

  // ---------- ხატვა ----------

  private draw() {
    const ctx = this.ctx
    const W = this.viewW
    const H = this.viewH

    ctx.clearRect(0, 0, W + 2, H + 2)

    const tint = mixHex(this.tintFrom, this.tintTo, this.tintT)
    const winColor = mixHex(this.windowFrom, this.windowTo, this.tintT)

    this.drawCastle(tint, winColor, W, H)

    ctx.save()
    ctx.translate(this.offsetX, -this.camY)
    this.drawPlatforms()
    this.drawDebris()
    this.drawHero()
    this.drawStars()
    this.drawPopups()
    ctx.restore()

    this.drawHud(W, H, winColor)

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 240, 180, ${this.flash * 0.35})`
      ctx.fillRect(0, 0, W, H)
    }
  }

  private makeBrickTile(): CanvasPattern | null {
    const tile = document.createElement('canvas')
    tile.width = 128
    tile.height = 96
    const c = tile.getContext('2d')
    if (!c) return null

    c.fillStyle = '#8b8f99'
    c.fillRect(0, 0, 128, 96)
    const rows = 4
    const bh = 96 / rows
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? 32 : 0
      for (let i = -1; i < 3; i++) {
        const x = i * 64 + off
        const shade = 0.82 + hash(r * 7 + i * 3 + 1) * 0.3
        const v = Math.round(139 * shade)
        c.fillStyle = `rgb(${v}, ${Math.round(v * 1.02)}, ${Math.round(v * 1.08)})`
        c.fillRect(x + 2, r * bh + 2, 60, bh - 4)
        c.fillStyle = 'rgba(255,255,255,0.10)'
        c.fillRect(x + 2, r * bh + 2, 60, 3)
        c.fillStyle = 'rgba(0,0,0,0.16)'
        c.fillRect(x + 2, r * bh + bh - 6, 60, 4)
      }
    }
    return c.createPattern(tile, 'repeat')
  }

  /** სასახლის კედლები: აგური, თაღოვანი ფანჯრები, ჩირაღდნები, დროშები */
  private drawCastle(tint: string, winColor: string, W: number, H: number) {
    const ctx = this.ctx

    if (!this.brickPattern) this.brickPattern = this.makeBrickTile()

    // დაშორებული კედელი (ნელა მოძრაობს)
    const par = 0.55
    const oy = mod(-this.camY * par, 96)
    ctx.save()
    ctx.translate(0, oy - 96)
    ctx.fillStyle = this.brickPattern ?? '#6f737d'
    ctx.fillRect(0, 0, W, H + 192)
    ctx.restore()

    // ფერადი ეტაპის ტონი
    ctx.fillStyle = rgba(tint, 0.58)
    ctx.fillRect(0, 0, W, H)

    // თაღოვანი ფანჯრები
    const wy = -this.camY * par
    const period = 300
    const first = Math.floor((-wy - 200) / period) - 1
    const last = Math.ceil((H - wy + 200) / period) + 1
    for (let k = first; k <= last; k++) {
      const y = wy + k * period
      for (const fx of [W * 0.5 - 175, W * 0.5 + 175]) {
        this.drawWindow(fx, y + 70, winColor, k)
      }
    }

    // ჩრდილი დერეფნის გარეთ
    const ox = this.offsetX
    ctx.fillStyle = 'rgba(8, 10, 20, 0.62)'
    ctx.fillRect(0, 0, ox, H)
    ctx.fillRect(ox + PW, 0, W - ox - PW, H)

    // დერეფნის კედლის სვეტები
    this.drawPillar(ox - 4, H, tint)
    this.drawPillar(ox + PW - LEFT + 4, H, tint)

    // ჩირაღდნები და დროშები სვეტებზე (უფრო სწრაფი პარალაქსი)
    const ty = -this.camY * 0.9
    const tp = 260
    const tf = Math.floor((-ty - 100) / tp) - 1
    const tl = Math.ceil((H - ty + 100) / tp) + 1
    for (let k = tf; k <= tl; k++) {
      const y = ty + k * tp + 90
      this.drawTorch(ox + LEFT - 10, y, k)
      this.drawTorch(ox + PW - LEFT + 10, y + 130, k + 50)
      if (k % 3 === 0) this.drawBanner(ox + LEFT - 2, y - 70, k, '#b02a3c')
      if (k % 3 === 1) this.drawBanner(ox + PW - LEFT + 2, y + 60, k, '#2a4fb0')
    }
  }

  private drawWindow(cx: number, y: number, color: string, seed: number) {
    const ctx = this.ctx
    const w = 62
    const h = 130

    ctx.fillStyle = '#4a4d57'
    ctx.beginPath()
    ctx.moveTo(cx - w / 2 - 7, y + h)
    ctx.lineTo(cx - w / 2 - 7, y + w / 2)
    ctx.arc(cx, y + w / 2, w / 2 + 7, Math.PI, 0)
    ctx.lineTo(cx + w / 2 + 7, y + h)
    ctx.closePath()
    ctx.fill()

    const g = ctx.createLinearGradient(0, y, 0, y + h)
    g.addColorStop(0, rgba(color, 0.95))
    g.addColorStop(1, rgba(mixHex(color, '#05060d', 0.7), 0.95))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(cx - w / 2, y + h)
    ctx.lineTo(cx - w / 2, y + w / 2)
    ctx.arc(cx, y + w / 2, w / 2, Math.PI, 0)
    ctx.lineTo(cx + w / 2, y + h)
    ctx.closePath()
    ctx.fill()

    // მთვარე / ვარსკვლავები
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.beginPath()
    ctx.arc(cx + (hash(seed) - 0.5) * 20, y + 40 + hash(seed + 1) * 20, 5, 0, Math.PI * 2)
    ctx.fill()

    // გისოსი
    ctx.strokeStyle = 'rgba(20, 22, 30, 0.75)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(cx, y)
    ctx.lineTo(cx, y + h)
    ctx.moveTo(cx - w / 2, y + 70)
    ctx.lineTo(cx + w / 2, y + 70)
    ctx.stroke()
  }

  private drawPillar(x: number, H: number, tint: string) {
    const ctx = this.ctx
    const w = LEFT + 4
    const g = ctx.createLinearGradient(x, 0, x + w, 0)
    g.addColorStop(0, mixHex('#2a2d36', tint, 0.15))
    g.addColorStop(0.5, mixHex('#5a5f6b', tint, 0.25))
    g.addColorStop(1, mixHex('#2a2d36', tint, 0.15))
    ctx.fillStyle = g
    ctx.fillRect(x, 0, w, H)
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let y = mod(-this.camY * 0.9, 64); y < H; y += 64) {
      ctx.moveTo(x, y)
      ctx.lineTo(x + w, y)
    }
    ctx.stroke()
  }

  private drawTorch(x: number, y: number, seed: number) {
    const ctx = this.ctx
    const t = this.time
    const f = 0.85 + 0.15 * Math.sin(t * 12 + seed * 3) + 0.08 * Math.sin(t * 27 + seed)

    ctx.fillStyle = 'rgba(255, 150, 60, 0.12)'
    ctx.beginPath()
    ctx.arc(x, y - 16, 46 * f, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255, 190, 90, 0.16)'
    ctx.beginPath()
    ctx.arc(x, y - 16, 26 * f, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#3d2a1a'
    ctx.fillRect(x - 4, y, 8, 26)
    ctx.fillStyle = '#6a6e79'
    ctx.fillRect(x - 8, y - 2, 16, 6)

    ctx.fillStyle = '#ff7a1f'
    ctx.beginPath()
    ctx.moveTo(x - 7, y - 2)
    ctx.quadraticCurveTo(x - 9, y - 18 * f, x, y - 30 * f)
    ctx.quadraticCurveTo(x + 9, y - 18 * f, x + 7, y - 2)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#ffd34f'
    ctx.beginPath()
    ctx.moveTo(x - 4, y - 2)
    ctx.quadraticCurveTo(x - 4, y - 12 * f, x, y - 19 * f)
    ctx.quadraticCurveTo(x + 4, y - 12 * f, x + 4, y - 2)
    ctx.closePath()
    ctx.fill()
  }

  private drawBanner(x: number, y: number, seed: number, color: string) {
    const ctx = this.ctx
    const sway = Math.sin(this.time * 1.6 + seed) * 3
    ctx.fillStyle = '#d9a441'
    ctx.fillRect(x - 15, y, 30, 5)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x - 13, y + 5)
    ctx.lineTo(x + 13, y + 5)
    ctx.lineTo(x + 13 + sway, y + 70)
    ctx.lineTo(x + sway, y + 58)
    ctx.lineTo(x - 13 + sway, y + 70)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#ffd86b'
    ctx.beginPath()
    ctx.arc(x + sway * 0.5, y + 28, 6, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawPlatforms() {
    for (const p of this.platforms) {
      if (p.y - this.camY > this.viewH + 60 || p.y - this.camY < -120) continue
      if (p.type === 'checkpoint') this.drawCheckpoint(p)
      else this.drawPlatform(p)
    }
  }

  private drawPlatform(p: Platform) {
    const ctx = this.ctx
    let ox = 0
    let oy = 0
    if (p.state === 'shaking') {
      ox = Math.sin(this.time * 70) * 2.2
      oy = Math.cos(this.time * 55) * 1.2
    }
    const x = p.x + ox
    const y = p.y + oy
    const w = p.w
    const h = p.h

    ctx.save()
    ctx.globalAlpha = p.state === 'falling' ? Math.max(0.25, 1 - p.vy / 900) : 1

    if (p.type === 'ice') {
      const g = ctx.createLinearGradient(0, y, 0, y + h)
      g.addColorStop(0, '#e9fbff')
      g.addColorStop(1, '#8fd3f0')
      ctx.fillStyle = g
      ctx.fillRect(x, y, w, h)
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillRect(x + 6, y + 3, w * 0.45, 3)
      ctx.strokeStyle = '#5fb4d8'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)
      // ყინულის წვეტიანები ქვემოთ
      ctx.fillStyle = '#b9ecff'
      for (let i = 0; i < w; i += 26) {
        const len = 7 + hash(p.id * 11 + i) * 12
        ctx.beginPath()
        ctx.moveTo(x + i + 3, y + h)
        ctx.lineTo(x + i + 13, y + h)
        ctx.lineTo(x + i + 8, y + h + len)
        ctx.closePath()
        ctx.fill()
      }
    } else if (p.type === 'stone') {
      ctx.fillStyle = '#7d818c'
      ctx.fillRect(x, y, w, h)
      ctx.fillStyle = '#9ca0ab'
      ctx.fillRect(x, y, w, 5)
      ctx.strokeStyle = '#4b4f5a'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)
      ctx.beginPath()
      for (let i = 34; i < w; i += 46) {
        ctx.moveTo(x + i, y + 5)
        ctx.lineTo(x + i, y + h)
      }
      ctx.stroke()
    } else if (p.type === 'cracked') {
      ctx.fillStyle = '#9b6a3a'
      ctx.fillRect(x, y, w, h)
      ctx.fillStyle = '#b98550'
      ctx.fillRect(x, y, w, 4)
      ctx.strokeStyle = '#4a2c12'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)
      ctx.beginPath()
      let cx = x + 14
      while (cx < x + w - 10) {
        ctx.moveTo(cx, y)
        ctx.lineTo(cx + 5, y + h * 0.45)
        ctx.lineTo(cx - 3, y + h)
        cx += 30 + hash(p.id + cx) * 14
      }
      ctx.stroke()
    } else if (p.type === 'moving') {
      ctx.fillStyle = '#4d6f8f'
      ctx.fillRect(x, y, w, h)
      ctx.fillStyle = '#7fd2ff'
      ctx.fillRect(x, y, w, 4)
      ctx.strokeStyle = '#1f3a52'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)
      ctx.fillStyle = '#ffe066'
      for (let i = 14; i < w - 8; i += 24) {
        ctx.beginPath()
        ctx.moveTo(x + i, y + 5)
        ctx.lineTo(x + i + 8, y + h / 2 + 1)
        ctx.lineTo(x + i, y + h - 4)
        ctx.closePath()
        ctx.fill()
      }
    } else {
      // ხის საფეხური
      ctx.fillStyle = '#a06f3c'
      ctx.fillRect(x, y, w, h)
      ctx.fillStyle = '#c28a52'
      ctx.fillRect(x, y, w, 4)
      ctx.strokeStyle = '#4a2c12'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)
      ctx.beginPath()
      for (let i = 0; i < w; i += 40) {
        ctx.moveTo(x + i, y + 4)
        ctx.lineTo(x + i, y + h)
      }
      ctx.stroke()
      ctx.fillStyle = '#6b6f7a'
      ctx.fillRect(x + 6, y + 7, 4, 4)
      ctx.fillRect(x + w - 10, y + 7, 4, 4)
    }
    ctx.restore()
  }

  /** checkpoint: დიდი ჰორიზონტალური ხაზი ეტაპის ნომრით */
  private drawCheckpoint(p: Platform) {
    const ctx = this.ctx
    const x = p.x
    const y = p.y
    const reached = this.checkpointStage >= p.stageNo

    const g = ctx.createLinearGradient(0, y, 0, y + p.h)
    g.addColorStop(0, reached ? '#ffe28a' : '#d9dce6')
    g.addColorStop(1, reached ? '#d19a1f' : '#7b8190')
    ctx.fillStyle = g
    ctx.fillRect(x, y, p.w, p.h)
    ctx.strokeStyle = '#3a2d12'
    ctx.lineWidth = 3
    ctx.strokeRect(x, y, p.w, p.h)

    // ორნამენტი
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    for (let i = 8; i < p.w; i += 32) ctx.fillRect(x + i, y + 4, 12, 4)

    // წარწერა
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '900 20px Inter, system-ui, sans-serif'
    ctx.lineWidth = 4
    ctx.strokeStyle = 'rgba(40, 24, 0, 0.7)'
    const label = `🚩 ეტაპი ${p.stageNo} 🚩`
    ctx.strokeText(label, x + p.w / 2, y + p.h / 2 + 1)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(label, x + p.w / 2, y + p.h / 2 + 1)
    ctx.restore()

    // ნათება ხაზის თავზე
    ctx.fillStyle = reached ? 'rgba(255, 226, 138, 0.16)' : 'rgba(210, 220, 255, 0.1)'
    ctx.fillRect(x, y - 16, p.w, 16)
  }

  private drawPopups() {
    const ctx = this.ctx
    ctx.save()
    ctx.textAlign = 'center'
    ctx.font = '900 22px Inter, system-ui, sans-serif'
    ctx.lineWidth = 5
    for (const popup of this.popups) {
      ctx.globalAlpha = Math.max(0, Math.min(1, popup.life / 0.4))
      ctx.strokeStyle = 'rgba(40, 20, 0, 0.75)'
      ctx.strokeText(popup.text, popup.x, popup.y)
      ctx.fillStyle = popup.text.startsWith('DOUBLE') ? '#ff9ad6' : '#ffe066'
      ctx.fillText(popup.text, popup.x, popup.y)
    }
    ctx.restore()
  }

  private drawDebris() {
    const ctx = this.ctx
    for (const d of this.debris) {
      ctx.globalAlpha = Math.max(0, Math.min(1, d.life / 0.5))
      ctx.fillStyle = d.color
      ctx.fillRect(d.x, d.y, d.w, d.w * 0.7)
    }
    ctx.globalAlpha = 1
  }

  private drawStars() {
    const ctx = this.ctx
    for (const s of this.stars) {
      ctx.globalAlpha = Math.max(0, Math.min(1, s.life / s.max * 1.4))
      ctx.fillStyle = s.color
      ctx.save()
      ctx.translate(s.x, s.y)
      ctx.rotate(s.rot)
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? s.size : s.size * 0.45
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2
        const px = Math.cos(a) * r
        const py = Math.sin(a) * r
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }

  /** ტელევიზორთავიანი გმირი (ფეხები სწორია — y არის ტერფების დონე) */
  private drawHero() {
    const ctx = this.ctx
    const x = this.px
    const y = this.py
    const airborne = !this.grounded
    const speed = Math.abs(this.vx)
    const swing = airborne ? 0.6 : Math.sin(this.runPhase) * Math.min(1, speed / 220)
    const squash = airborne ? (this.vy < 0 ? 1.06 : 0.96) : 1

    // ბუსტის ნათება
    if (this.boost >= BOOST_READY || this.starsLeft > 0) {
      const a = this.starsLeft > 0 ? 0.35 : 0.18 + 0.2 * this.boost
      ctx.fillStyle = `rgba(255, 224, 102, ${a})`
      ctx.beginPath()
      ctx.arc(x, y - BODY_H * 0.5, 38 + Math.sin(this.time * 12) * 3, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.save()
    ctx.translate(x, y)
    ctx.scale(this.facing * 1, squash)
    if (this.flipAngle !== 0) {
      ctx.translate(0, -26)
      ctx.rotate(this.flipAngle)
      ctx.translate(0, 26)
    }

    // ფეხები
    ctx.fillStyle = '#2f5fb8'
    ctx.save()
    ctx.translate(-5, -14)
    ctx.rotate(swing * 0.7)
    ctx.fillRect(-4, 0, 8, 12)
    ctx.fillStyle = '#4a2c12'
    ctx.fillRect(-5, 11, 11, 4)
    ctx.restore()
    ctx.save()
    ctx.fillStyle = '#2f5fb8'
    ctx.translate(5, -14)
    ctx.rotate(-swing * 0.7)
    ctx.fillRect(-4, 0, 8, 12)
    ctx.fillStyle = '#4a2c12'
    ctx.fillRect(-5, 11, 11, 4)
    ctx.restore()

    // ტანი
    ctx.fillStyle = '#c0392b'
    ctx.fillRect(-9, -28, 18, 15)
    ctx.fillStyle = '#e25b4c'
    ctx.fillRect(-9, -28, 18, 3)

    // ხელები
    ctx.fillStyle = '#c0392b'
    ctx.save()
    ctx.translate(-10, -26)
    ctx.rotate(-swing * 0.9 + (airborne ? -1.1 : 0))
    ctx.fillRect(-3, 0, 5, 11)
    ctx.restore()
    ctx.save()
    ctx.translate(10, -26)
    ctx.rotate(swing * 0.9 + (airborne ? 1.1 : 0))
    ctx.fillRect(-2, 0, 5, 11)
    ctx.restore()

    // ანტენა
    ctx.strokeStyle = '#2b2f36'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-3, -52)
    ctx.lineTo(-10, -62)
    ctx.moveTo(3, -52)
    ctx.lineTo(10, -62)
    ctx.stroke()
    ctx.fillStyle = '#2b2f36'
    ctx.beginPath()
    ctx.arc(-10, -62, 2, 0, Math.PI * 2)
    ctx.arc(10, -62, 2, 0, Math.PI * 2)
    ctx.fill()

    // ტელევიზორი-თავი
    ctx.fillStyle = '#9aa3ab'
    ctx.fillRect(-16, -52, 32, 25)
    ctx.fillStyle = '#6d757d'
    ctx.fillRect(-16, -30, 32, 3)
    ctx.fillStyle = '#1d2329'
    ctx.fillRect(-13, -49, 26, 19)
    const bars = ['#f2f2f2', '#f5e04a', '#4ad8f5', '#52d86a', '#e24fe0', '#e24a4a', '#4a63e2']
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = bars[i]
      ctx.fillRect(-12 + i * 3.4, -48, 3.4, 16)
    }
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.fillRect(-12, -48, 24, 4)
    ctx.restore()
  }

  private drawHud(W: number, H: number, accent: string) {
    const ctx = this.ctx
    const x0 = this.offsetX

    ctx.save()
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.font = '900 30px Inter, system-ui, sans-serif'
    ctx.lineWidth = 5
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'
    const stageText = `ეტაპი ${this.checkpointStage}`
    ctx.strokeText(stageText, x0 + 52, 52)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(stageText, x0 + 52, 52)

    ctx.font = '700 18px Inter, system-ui, sans-serif'
    ctx.lineWidth = 4
    const floorText = `სართული ${this.floors}  •  რეკორდი ${JumpUpTower.best}`
    ctx.strokeText(floorText, x0 + 52, 78)
    ctx.fillStyle = '#ffe28a'
    ctx.fillText(floorText, x0 + 52, 78)
    ctx.restore()

    // ბუსტის ზოლი
    const bw = 220
    const bx = W / 2 - bw / 2
    const by = H - 40
    ctx.fillStyle = 'rgba(8, 12, 24, 0.7)'
    ctx.fillRect(bx - 4, by - 4, bw + 8, 22)
    const ready = this.boost >= BOOST_READY
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0)
    g.addColorStop(0, '#ffb13b')
    g.addColorStop(1, ready ? '#fff07a' : '#ffd86b')
    ctx.fillStyle = g
    ctx.fillRect(bx, by, bw * this.boost, 14)
    ctx.strokeStyle = ready ? '#fff07a' : 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 2
    ctx.strokeRect(bx - 4, by - 4, bw + 8, 22)
    ctx.fillStyle = ready ? '#fff07a' : '#c9d4e6'
    ctx.font = '800 12px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(ready ? '⭐ BOOST მზადაა — ახტი!' : 'BOOST: გარბოდე მარცხნივ-მარჯვნივ', W / 2, by - 9)

    // ეტაპის ბანერი
    if (this.banner > 0) {
      ctx.save()
      ctx.globalAlpha = Math.min(1, this.banner / 0.5, (2.4 - this.banner) / 0.3)
      ctx.textAlign = 'center'
      ctx.font = '900 44px Inter, system-ui, sans-serif'
      ctx.lineWidth = 8
      ctx.strokeStyle = 'rgba(30, 18, 0, 0.7)'
      ctx.strokeText(this.bannerText, W / 2, H * 0.3)
      ctx.fillStyle = '#ffe28a'
      ctx.fillText(this.bannerText, W / 2, H * 0.3)
      ctx.font = '700 20px Inter, system-ui, sans-serif'
      const st = STAGES[Math.min(this.checkpointStage - 1, STAGES.length - 1)]
      ctx.fillStyle = accent
      ctx.fillText(st.name, W / 2, H * 0.3 + 34)
      ctx.restore()
    }

    // დასაწყისის მინიშნება
    if (!this.started && !this.dead) {
      ctx.save()
      ctx.textAlign = 'center'
      ctx.font = '700 20px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.globalAlpha = 0.75 + 0.25 * Math.sin(this.time * 4)
      ctx.fillText('← → გადაადგილება • SPACE ახტომა • საფეხური ცოტა ხანში ჩავარდება!', W / 2, H * 0.52)
      ctx.restore()
    }
  }

  // ---------- დახურვა ----------

  private close() {
    if (this.disposed) return

    this.disposed = true
    cancelAnimationFrame(this.frame)

    window.removeEventListener('keydown', this.keyDownHandler, true)
    window.removeEventListener('keyup', this.keyUpHandler, true)
    window.removeEventListener('blur', this.blurHandler)
    window.removeEventListener('resize', this.resizeHandler)

    this.root.remove()
    this.onClose?.()
  }
}