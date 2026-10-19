export type TypingStats = {
  wpm: number
  accuracy: number
  totalTimeSeconds: number
  errors: number
}

export type TypingGrandmasterOptions = {
  onClose?: () => void
  onSuccess?: (stats: TypingStats) => void
}

type Platform = {
  x: number
  y: number
  width: number
  word: string
  typedLength: number
  level: number
}

type Theme = 'chip' | 'data' | 'tower' | 'quantum' | 'summit'
type ParticleKind = 'bits' | 'digits' | 'embers' | 'orbs' | 'snow'
type Pt = [number, number]

type Celestial = {
  x: number
  y: number
  r: number
  color: string
  ring?: boolean
}

type StageConfig = {
  name: string
  words: string[]
  bgGradient: [string, string, string]
  platformColor: string
  accentColor: string
  // --- გარემოს პარამეტრები (ყველა ფერი 6-ნიშნა hex) ---
  theme: Theme
  horizon: string
  rock: [string, string]
  ground: [string, string]
  cloud: string
  celestial: Celestial
  particle: ParticleKind
  aurora: number
}

type Star = {
  x: number // 0..1 (ეკრანის წილი)
  y: number // 0..1
  size: number
  alpha: number
  twinkleSpeed: number
}

type ShootingStar = {
  x: number
  y: number
  length: number
  speed: number
  alpha: number
  delay: number
  life: number
  age: number
}

type Cloud = {
  x: number
  y: number
  scale: number
  speed: number
  front: boolean
}

type Particle = {
  x: number
  y: number
  size: number
  phase: number
  speed: number
  glyph: string
}

// რამდენი სიტყვა მოდის თითო ეტაპზე (ბანკიდან შემთხვევითად)
const WORDS_PER_STAGE = 10
const STAGE_BANNER_SECONDS = 2.6
const STAGE_TRANSITION_SECONDS = 1.8

const STAGES: StageConfig[] = [
  {
    name: 'ეტაპი 1 — ჩიპების ხეობა',
    words: ['კოდი', 'ჩიპი', 'ბიტი', 'ფაილი', 'ქსელი', 'ეკრანი', 'მაუსი', 'დისკი', 'ბოტი', 'პორტი'],
    bgGradient: ['#1d0836', '#321052', '#140524'],
    platformColor: '#2b3a68',
    accentColor: '#43e7ff',
    theme: 'chip',
    horizon: '#2a7bff',
    rock: ['#17133a', '#3b3585'],
    ground: ['#1b3358', '#2f6296'],
    cloud: '#7a9cff',
    celestial: { x: 0.82, y: 0.2, r: 46, color: '#43e7ff' },
    particle: 'bits',
    aurora: 0,
  },
  {
    name: 'ეტაპი 2 — მონაცემთა კიბე',
    words: ['ბაზა', 'სერვერი', 'ფლეშკა', 'ხაზი', 'საიტი', 'ბლოგი', 'რუტერი', 'ლინკი', 'კლასი', 'ჰოსტი'],
    bgGradient: ['#280838', '#451259', '#170324'],
    platformColor: '#531b73',
    accentColor: '#ff4fd8',
    theme: 'data',
    horizon: '#ff4fd8',
    rock: ['#2e0d3a', '#7a2a85'],
    ground: ['#4d1768', '#8a31ab'],
    cloud: '#ff9be8',
    celestial: { x: 0.2, y: 0.22, r: 40, color: '#ff7ee8', ring: true },
    particle: 'digits',
    aurora: 0,
  },
  {
    name: 'ეტაპი 3 — პროცესორის კოშკი',
    words: ['პროცესორი', 'მეხსიერება', 'პროგრამა', 'სისტემა', 'ვირუსი', 'დაფა', 'ბირთვი', 'კლავიატურა', 'მონიტორი', 'კოდერი'],
    bgGradient: ['#2e0921', '#4d122e', '#1a0312'],
    platformColor: '#6e1d3b',
    accentColor: '#ffb83f',
    theme: 'tower',
    horizon: '#ff8a3f',
    rock: ['#331019', '#8a2b3a'],
    ground: ['#5e1a33', '#a02d4a'],
    cloud: '#ffb27a',
    celestial: { x: 0.75, y: 0.28, r: 78, color: '#ffb83f' },
    particle: 'embers',
    aurora: 0,
  },
  {
    name: 'ეტაპი 4 — კვანტური ლაბორატორია',
    words: ['ალგორითმი', 'ინტერნეტი', 'მონაცემი', 'პიქსელი', 'უსაფრთხოება', 'პროტოკოლი', 'სკრიპტი', 'ფუნქცია', 'ობიექტი', 'მასივი'],
    bgGradient: ['#140b36', '#2b1357', '#0d0426'],
    platformColor: '#1a5448',
    accentColor: '#30fca8',
    theme: 'quantum',
    horizon: '#30fca8',
    rock: ['#0b2428', '#22706a'],
    ground: ['#14463d', '#2a8a72'],
    cloud: '#7affd0',
    celestial: { x: 0.25, y: 0.2, r: 36, color: '#30fca8' },
    particle: 'orbs',
    aurora: 0.55,
  },
  {
    name: 'ეტაპი 5 — ციფრული მწვერვალი',
    words: ['ინფორმაცია', 'ტექნოლოგია', 'პროგრამისტი', 'ინჟინერია', 'არქიტექტურა', 'კომპილატორი', 'მონაცემები', 'აპლიკაცია', 'პლატფორმა', 'ავტომატიზაცია'],
    bgGradient: ['#220642', '#3d0a6e', '#130229'],
    platformColor: '#4a1d8a',
    accentColor: '#a855f7',
    theme: 'summit',
    horizon: '#a855f7',
    rock: ['#1f0f45', '#5d33b8'],
    ground: ['#3d1a78', '#6d3bd1'],
    cloud: '#c9a8ff',
    celestial: { x: 0.7, y: 0.18, r: 70, color: '#e6dcff' },
    particle: 'snow',
    aurora: 1,
  },
]

const TOTAL_WORDS = STAGES.reduce((sum, s) => sum + Math.min(s.words.length, WORDS_PER_STAGE), 0)

// ---------- დამხმარე ფუნქციები ----------

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mix(a: string, b: string, t: number): string {
  const k = Math.max(0, Math.min(1, t))
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const r = Math.round(ar + (br - ar) * k)
  const g = Math.round(ag + (bg - ag) * k)
  const bl = Math.round(ab + (bb - ab) * k)
  return '#' + [r, g, bl].map((v) => v.toString(16).padStart(2, '0')).join('')
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

// ---------- მცურავი კუნძულის გეომეტრია (ლოკალური კოორდინატები) ----------
// 0-4: ზედა კიდე, 5-8: შუა რგოლი, 9-10: ქვედა რგოლი, 11: წვერი
const ISLAND_VERTS: Pt[] = [
  [-260, 0], [-150, 30], [-20, 42], [140, 34], [265, 2],
  [-180, 80], [-80, 125], [50, 140], [160, 95],
  [-30, 215], [70, 200],
  [20, 275],
]
const ISLAND_FACES: [number, number, number][] = [
  [0, 1, 5], [1, 5, 6], [1, 2, 6], [2, 6, 7], [2, 3, 7], [3, 7, 8], [3, 4, 8],
  [5, 6, 9], [6, 7, 9], [7, 9, 10], [7, 8, 10], [9, 10, 11],
]
const ISLAND_JITTER = [0.06, -0.07, 0.1, -0.04, 0.08, -0.09, 0.05, 0.03, -0.08, 0.09, -0.05, 0.02]

// ზედა ზედაპირი (საათის ისრის მიმართულებით)
const ISLAND_TOP: Pt[] = [
  [-260, 0], [-170, -26], [0, -34], [170, -24], [265, 2], [140, 34], [-20, 42], [-150, 30],
]
const ISLAND_TOP_JITTER = [0.1, 0.45, 0.3, 0.55, 0.2, 0.4, 0.05, 0.35]

const MINI_ISLANDS = [
  { x: 0.1, y: 0.34, s: 0.55, ph: 0.0, f: 0.12 },
  { x: 0.88, y: 0.27, s: 0.7, ph: 1.7, f: 0.14 },
  { x: 0.78, y: 0.6, s: 0.42, ph: 3.1, f: 0.1 },
  { x: 0.16, y: 0.66, s: 0.46, ph: 4.4, f: 0.1 },
  { x: 0.5, y: 0.1, s: 0.32, ph: 2.2, f: 0.08 },
  { x: 0.3, y: -0.25, s: 0.5, ph: 5.1, f: 0.2 },
  { x: 0.7, y: -0.4, s: 0.6, ph: 0.9, f: 0.22 },
]

export class TypingGrandmaster {
  private root!: HTMLDivElement
  private canvas!: HTMLCanvasElement
  private ctx!: CanvasRenderingContext2D
  private frame = 0
  private lastTime = 0
  private running = false
  private disposed = false

  private stageIndex = 0
  private typedIndex = 0

  private errors = 0
  private totalTypedCorrect = 0
  private startTime = 0
  private endTime = 0

  private platforms: Platform[] = []
  private stars: Star[] = []
  private shootingStars: ShootingStar[] = []
  private clouds: Cloud[] = []
  private activePlatformIndex = 0

  private playerPos = { x: 100, y: 300 }
  private targetPlayerPos = { x: 100, y: 300 }

  private cameraY = 0
  private targetCameraY = 0

  private flashError = 0

  // --- ფონისა და გარემოს მდგომარეობა ---
  private particles: Particle[] = []
  private time = 0
  private envFrom = 0
  private envTo = 0
  private envT = 1
  private altitude = 0
  private bannerT = 0
  private stageFlash = 0

  private readonly keyHandler = (e: KeyboardEvent) => {
    if (e.code === 'Escape') {
      this.close()
      return
    }

    if (!this.running || this.stageIndex >= STAGES.length) return

    const key = e.key
    if (key.length !== 1 && key !== ' ') return

    const currentPlatform = this.platforms[this.activePlatformIndex]
    if (!currentPlatform) return

    const targetChar = currentPlatform.word[this.typedIndex]

    if (key.toLocaleLowerCase('ka-GE') === targetChar?.toLocaleLowerCase('ka-GE')) {
      this.typedIndex++
      this.totalTypedCorrect++
      currentPlatform.typedLength = this.typedIndex

      if (this.typedIndex >= currentPlatform.word.length) {
        this.onWordCompleted()
      }
    } else {
      this.errors++
      this.flashError = 0.25
    }
  }

  private readonly resizeHandler = () => this.resize()
  private onClose?: () => void
  private onSuccess?: (stats: TypingStats) => void

  constructor(options: TypingGrandmasterOptions = {}) {
    this.onClose = options.onClose
    this.onSuccess = options.onSuccess
    this.createInterface()
    this.initBackgroundEffects()
    this.start()
  }

  private createInterface() {
    const root = document.createElement('div')
    root.id = 'typing-grandmaster-root'

    root.innerHTML = `
      <style>
        #typing-grandmaster-root {
          position: fixed;
          inset: 0;
          z-index: 100000;
          background: #120424;
          color: #fff;
          font-family: Inter, system-ui, sans-serif;
          overflow: hidden;
          user-select: none;
        }

        #typing-grandmaster-root * { box-sizing: border-box; }
        #typing-grandmaster-root [hidden] { display: none !important; }

        #typing-grandmaster-root canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        .tg-hud {
          position: absolute;
          inset: 0 0 auto;
          z-index: 2;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 22px 28px;
          pointer-events: none;
        }

        .tg-title {
          font-size: clamp(20px, 3vw, 30px);
          font-weight: 1000;
          letter-spacing: 2px;
          text-shadow: 0 0 20px #ff4fd888;
        }
        .tg-title span { color: #ff4fd8; }

        .tg-stage-name {
          font-size: 14px;
          color: #e2c2f0;
          margin-top: 4px;
          font-weight: 600;
        }

        .tg-stats-box {
          display: flex;
          gap: 18px;
          background: rgba(35, 10, 56, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.25);
          padding: 10px 18px;
          border-radius: 14px;
          backdrop-filter: blur(8px);
        }

        .tg-stat {
          text-align: center;
        }
        .tg-stat-val {
          font-size: 18px;
          font-weight: 900;
          color: #ffb83f;
        }
        .tg-stat-lbl {
          font-size: 11px;
          color: #d1b1e6;
          text-transform: uppercase;
        }

        .tg-exit {
          position: absolute;
          right: 20px;
          bottom: 18px;
          z-index: 3;
          padding: 9px 14px;
          color: #f3e6ff;
          background: #ffffff18;
          border: 1px solid #ffffff33;
          border-radius: 10px;
          cursor: pointer;
        }

        .tg-modal {
          position: absolute;
          inset: 0;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(18, 4, 36, 0.88);
          backdrop-filter: blur(10px);
        }

        .tg-card {
          width: min(540px, 100%);
          padding: 34px;
          border: 1px solid #ff4fd875;
          border-radius: 22px;
          background: linear-gradient(145deg, #2a0b47, #130324);
          box-shadow: 0 0 60px rgba(255, 79, 216, 0.25);
          text-align: center;
        }

        .tg-card h2 { margin: 0 0 14px; font-size: 28px; }
        .tg-card p { color: #e5cdfa; line-height: 1.6; margin-bottom: 24px; }

        .tg-result-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .tg-res-item {
          background: rgba(255, 255, 255, 0.06);
          padding: 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .tg-res-val { font-size: 20px; font-weight: 900; color: #ffb83f; }
        .tg-res-lbl { font-size: 12px; color: #c4a1e0; margin-top: 2px; }

        .tg-btn {
          width: 100%;
          padding: 14px;
          border: 0;
          border-radius: 12px;
          color: #120324;
          background: linear-gradient(90deg, #ff4fd8, #ffb83f);
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }
      </style>

      <canvas></canvas>

      <div class="tg-hud">
        <div>
          <div class="tg-title">TYPING <span>GRANDMASTER</span></div>
          <div class="tg-stage-name"></div>
        </div>
        <div class="tg-stats-box">
          <div class="tg-stat">
            <div class="tg-stat-val id-wpm">0</div>
            <div class="tg-stat-lbl">WPM</div>
          </div>
          <div class="tg-stat">
            <div class="tg-stat-val id-acc">100%</div>
            <div class="tg-stat-lbl">სიზუსტე</div>
          </div>
          <div class="tg-stat">
            <div class="tg-stat-val id-err">0</div>
            <div class="tg-stat-lbl">შეცდომა</div>
          </div>
        </div>
      </div>

      <button class="tg-exit" type="button">✕ გასვლა (Esc)</button>
      <div class="tg-modal" hidden></div>
    `

    document.body.appendChild(root)
    this.root = root
    this.canvas = root.querySelector('canvas')!
    this.ctx = this.canvas.getContext('2d')!

    this.root.querySelector('.tg-exit')!.addEventListener('click', () => this.close())
    window.addEventListener('keydown', this.keyHandler)
    window.addEventListener('resize', this.resizeHandler)
    this.resize()
  }


  private initBackgroundEffects() {
    const w = window.innerWidth
    const h = window.innerHeight

    this.stars = []
    for (let i = 0; i < 140; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: 1 + Math.random() * 2.4,
        alpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 1 + Math.random() * 3,
      })
    }

    // ვარსკვლავთცვენა ახლა დროდადრო ჩნდება და არა მუდმივად
    this.shootingStars = []
    for (let i = 0; i < 3; i++) {
      this.shootingStars.push(this.createShootingStar(1 + Math.random() * 5))
    }

    this.clouds = [
      { x: w * 0.05, y: 80, scale: 1.6, speed: 10, front: false },
      { x: w * 0.4, y: 50, scale: 2.1, speed: 7, front: false },
      { x: w * 0.75, y: 120, scale: 1.4, speed: 13, front: false },
      { x: w * 0.92, y: h * 0.45, scale: 1.9, speed: 16, front: false },
      { x: w * 0.22, y: h * 0.55, scale: 2.6, speed: 18, front: true },
      { x: w * 0.62, y: h * 0.78, scale: 3.2, speed: 24, front: true },
    ]

    this.particles = []
    for (let i = 0; i < 70; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 1.5 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.9,
        glyph: Math.random() < 0.5 ? '0' : '1',
      })
    }
  }

  private createShootingStar(delay: number): ShootingStar {
    return {
      x: Math.random() * window.innerWidth * 0.8 - 60,
      y: Math.random() * window.innerHeight * 0.35,
      length: 70 + Math.random() * 90,
      speed: 450 + Math.random() * 400,
      alpha: 0.5 + Math.random() * 0.5,
      delay,
      life: 0.9 + Math.random() * 0.7,
      age: 0,
    }
  }


  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.floor(window.innerWidth * dpr)
    this.canvas.height = Math.floor(window.innerHeight * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  private start() {
    this.stageIndex = 0
    this.envFrom = 0
    this.envTo = 0
    this.envT = 1
    this.errors = 0
    this.totalTypedCorrect = 0
    this.startTime = performance.now()
    this.running = true

    this.buildPlatformsForStage()
    this.lastTime = performance.now()
    this.frame = requestAnimationFrame(this.loop)
  }


  private buildPlatformsForStage() {
    const stage = STAGES[this.stageIndex]
    this.root.querySelector('.tg-stage-name')!.textContent = stage.name
    this.platforms = []
    this.typedIndex = 0
    this.bannerT = STAGE_BANNER_SECONDS

    // სიტყვები ბანკიდან შემთხვევითი რიგით — ყოველ თამაშზე და ყოველ ეტაპზე სხვადასხვანაირად
    const words = shuffle(stage.words).slice(0, WORDS_PER_STAGE)

    const startY = window.innerHeight * 0.75
    const xStep = Math.min(210, window.innerWidth * 0.2)
    const yStep = 150 // გაზრდილი მანძილი (150px), რომ სიტყვა არ დაეჯახოს ზედა პლატფორმას

    let currentX = window.innerWidth * 0.15
    let currentY = startY

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const width = Math.max(140, word.length * 24)

      this.platforms.push({
        x: currentX,
        y: currentY,
        width,
        word,
        typedLength: 0,
        level: i,
      })

      currentX += (i % 2 === 0 ? 1 : -0.35) * xStep + 70
      if (currentX > window.innerWidth - width - 80) {
        currentX = window.innerWidth * 0.2
      } else if (currentX < 60) {
        currentX = window.innerWidth * 0.3
      }
      currentY -= yStep
    }

    this.activePlatformIndex = 0
    const firstPlatform = this.platforms[0]
    this.playerPos = { x: firstPlatform.x + firstPlatform.width / 2, y: firstPlatform.y }
    this.targetPlayerPos = { ...this.playerPos }
    this.targetCameraY = firstPlatform.y - window.innerHeight * 0.65
    // ახალი ეტაპი იწყება ახალი გარემოს თავიდან — კამერა ერთბაშად დგება საწყის წერტილში
    this.cameraY = this.targetCameraY
    this.altitude = 0
  }

  private onWordCompleted() {
    this.activePlatformIndex++
    this.typedIndex = 0

    if (this.activePlatformIndex < this.platforms.length) {
      const nextP = this.platforms[this.activePlatformIndex]
      this.targetPlayerPos = { x: nextP.x + nextP.width / 2, y: nextP.y }
      this.targetCameraY = nextP.y - window.innerHeight * 0.6
    } else {
      this.stageIndex++
      if (this.stageIndex < STAGES.length) {
        // გარემოს გადასვლა წინა ეტაპიდან ახალზე
        this.envFrom = this.stageIndex - 1
        this.envTo = this.stageIndex
        this.envT = 0
        this.stageFlash = 1
        this.buildPlatformsForStage()
      } else {
        this.finishGame()
      }
    }
  }

  private readonly loop = (now: number) => {
    if (this.disposed) return
    this.frame = requestAnimationFrame(this.loop)

    const delta = Math.min((now - this.lastTime) / 1000, 0.035)
    this.lastTime = now

    this.updateAmbient(delta)
    if (this.running) {
      this.update(delta)
    }
    this.draw()
  }

  private update(delta: number) {
    this.playerPos.x += (this.targetPlayerPos.x - this.playerPos.x) * 10 * delta
    this.playerPos.y += (this.targetPlayerPos.y - this.playerPos.y) * 10 * delta

    this.cameraY += (this.targetCameraY - this.cameraY) * 4 * delta

    const elapsedMinutes = Math.max(0.01, (performance.now() - this.startTime) / 60000)
    const wpm = Math.round((this.totalTypedCorrect / 5) / elapsedMinutes)
    const totalAttempts = this.totalTypedCorrect + this.errors
    const accuracy = totalAttempts > 0 ? Math.round((this.totalTypedCorrect / totalAttempts) * 100) : 100

    this.root.querySelector('.id-wpm')!.textContent = wpm.toString()
    this.root.querySelector('.id-acc')!.textContent = `${accuracy}%`
    this.root.querySelector('.id-err')!.textContent = this.errors.toString()
  }

  // ფონის ანიმაცია — მუშაობს თამაშის დასრულების შემდეგაც
  private updateAmbient(delta: number) {
    const w = window.innerWidth
    const h = window.innerHeight

    this.time += delta
    if (this.envT < 1) this.envT = Math.min(1, this.envT + delta / STAGE_TRANSITION_SECONDS)
    if (this.bannerT > 0) this.bannerT -= delta
    if (this.stageFlash > 0) this.stageFlash = Math.max(0, this.stageFlash - delta * 1.6)
    if (this.flashError > 0) this.flashError -= delta

    // რაც მაღლა ადიხარ ეტაპზე, მით უფრო "კოსმოსური" ხდება ცა
    const targetAlt = this.platforms.length ? this.activePlatformIndex / this.platforms.length : 0
    this.altitude += (targetAlt - this.altitude) * 2 * delta

    for (let i = 0; i < this.shootingStars.length; i++) {
      const ss = this.shootingStars[i]
      if (ss.delay > 0) {
        ss.delay -= delta
        continue
      }
      ss.age += delta
      ss.x += ss.speed * delta
      ss.y += ss.speed * 0.5 * delta
      if (ss.age >= ss.life) {
        this.shootingStars[i] = this.createShootingStar(1.5 + Math.random() * 5)
      }
    }

    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * delta
      if (cloud.x > w + 80 * cloud.scale) {
        cloud.x = -80 * cloud.scale
      }
    }

    // ნაწილაკები მიჰყვება მიმდინარე ეტაპის თემას
    const kind = (this.envT < 0.5 ? STAGES[this.envFrom] : STAGES[this.envTo]).particle
    for (const p of this.particles) {
      p.phase += delta
      switch (kind) {
        case 'bits':
          p.y -= 28 * p.speed * delta
          p.x += Math.sin(p.phase * 0.8) * 6 * delta
          break
        case 'digits':
          p.y += 45 * p.speed * delta
          break
        case 'embers':
          p.y -= 50 * p.speed * delta
          p.x += Math.sin(p.phase * 1.5) * 18 * delta
          break
        case 'orbs':
          p.y -= 14 * p.speed * delta
          p.x += Math.cos(p.phase * 0.7) * 16 * delta
          break
        case 'snow':
          p.y += 26 * p.speed * delta
          p.x += Math.sin(p.phase * 0.9) * 12 * delta
          break
      }
      if (p.y < -20) p.y = h + 20
      else if (p.y > h + 20) p.y = -20
      if (p.x < -20) p.x = w + 20
      else if (p.x > w + 20) p.x = -20
    }
  }

  private draw() {
    const ctx = this.ctx
    const width = window.innerWidth
    const height = window.innerHeight
    const stage = STAGES[this.stageIndex] || STAGES[STAGES.length - 1]
    const from = STAGES[this.envFrom]
    const to = STAGES[this.envTo]
    const e = this.envT < 1 ? easeInOut(this.envT) : 1

    ctx.clearRect(0, 0, width, height)

    // 1. ცა + ჰორიზონტის ნათება (ეტაპიდან ეტაპზე ნელა გადადის)
    this.drawSky(from, to, e, width, height)

    // 2. პლანეტა / მთვარე / მზე
    if (e >= 1) {
      this.drawBody(to, 1, width, height)
    } else {
      this.drawBody(from, 1 - e, width, height)
      this.drawBody(to, e, width, height)
    }

    // 3. ვარსკვლავები, ჩრდილოეთის ციალი, ვარსკვლავთცვენა
    this.drawStars(width, height)
    this.drawAurora(from, to, e, width, height)
    this.drawShootingStars()

    // 4. შორეული პატარა მცურავი კუნძულები
    this.drawLayered(from, to, e, (env, alpha) => this.drawFarIslands(env, alpha, width, height))

    // 5. ღრუბლები კუნძულის უკან, მერე მთავარი მცურავი კუნძული, მერე წინა ღრუბლები
    this.drawClouds(from, to, e, false)
    this.drawLayered(from, to, e, (env, alpha) => this.drawMainIsland(env, alpha, width, height))
    this.drawClouds(from, to, e, true)

    // 6. ეტაპის თემის ნაწილაკები
    this.drawParticles(from, to)

    // 7. სათამაშო სამყარო
    this.drawWorld(stage)

    // 8. ვინეტი, გადასვლის ციმციმი, შეცდომის ციმციმი, ეტაპის სათაური
    this.drawOverlays(stage, width, height)
  }

  // ქვედა ფენა სრულად, ზედა — გამჭვირვალობით: სუფთა crossfade
  private drawLayered(
    from: StageConfig,
    to: StageConfig,
    e: number,
    fn: (env: StageConfig, alpha: number) => void,
  ) {
    if (e >= 1 || from === to) {
      fn(to, 1)
    } else {
      fn(from, 1)
      fn(to, e)
    }
  }

  private drawSky(from: StageConfig, to: StageConfig, e: number, w: number, h: number) {
    const ctx = this.ctx
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    const stops = [0, 0.5, 1]
    for (let i = 0; i < 3; i++) {
      grad.addColorStop(stops[i], mix(from.bgGradient[i], to.bgGradient[i], e))
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    const hc = mix(from.horizon, to.horizon, e)
    const gy = h * 0.95 - this.cameraY * 0.08
    const glow = ctx.createRadialGradient(w * 0.5, gy, 0, w * 0.5, gy, Math.max(w, h) * 0.85)
    glow.addColorStop(0, rgba(hc, 0.5 * (1 - 0.5 * this.altitude)))
    glow.addColorStop(0.5, rgba(hc, 0.14))
    glow.addColorStop(1, rgba(hc, 0))
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)
  }

  private drawBody(env: StageConfig, alpha: number, w: number, h: number) {
    if (alpha <= 0.001) return
    const ctx = this.ctx
    const c = env.celestial
    const x = w * c.x
    const y = h * c.y - this.cameraY * 0.04
    const r = c.r * Math.min(1.25, Math.max(0.7, w / 1200))

    ctx.save()
    ctx.globalAlpha = alpha

    const halo = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 3.2)
    halo.addColorStop(0, rgba(c.color, 0.35))
    halo.addColorStop(1, rgba(c.color, 0))
    ctx.fillStyle = halo
    ctx.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4)

    const ringStyle = rgba(mix(c.color, '#ffffff', 0.3), 0.55)
    if (c.ring) {
      // რგოლის უკანა ნახევარი
      ctx.strokeStyle = ringStyle
      ctx.lineWidth = Math.max(2, r * 0.09)
      ctx.beginPath()
      ctx.ellipse(x, y, r * 1.9, r * 0.5, -0.35, Math.PI, Math.PI * 2)
      ctx.stroke()
    }

    const body = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r)
    body.addColorStop(0, mix(c.color, '#ffffff', 0.55))
    body.addColorStop(1, c.color)
    ctx.fillStyle = body
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()

    if (env.theme === 'summit' || env.theme === 'chip') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      const craters: [number, number, number][] = [[-0.3, 0.2, 0.18], [0.25, -0.15, 0.12], [0.1, 0.4, 0.1]]
      for (const [dx, dy, k] of craters) {
        ctx.beginPath()
        ctx.arc(x + r * dx, y + r * dy, r * k, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (c.ring) {
      // რგოლის წინა ნახევარი
      ctx.strokeStyle = ringStyle
      ctx.lineWidth = Math.max(2, r * 0.09)
      ctx.beginPath()
      ctx.ellipse(x, y, r * 1.9, r * 0.5, -0.35, 0, Math.PI)
      ctx.stroke()
    }

    ctx.restore()
  }

  private drawStars(w: number, h: number) {
    const ctx = this.ctx
    const boost = 0.55 + 0.45 * this.altitude
    ctx.save()
    for (const star of this.stars) {
      const a = Math.abs(Math.sin(this.time * star.twinkleSpeed + star.x * 10)) * star.alpha * boost
      ctx.fillStyle = `rgba(255, 245, 230, ${a})`
      ctx.fillRect(star.x * w, star.y * h, star.size, star.size)
    }
    ctx.restore()
  }

  private drawAurora(from: StageConfig, to: StageConfig, e: number, w: number, h: number) {
    const intensity = from.aurora + (to.aurora - from.aurora) * e
    if (intensity < 0.02) return

    const ctx = this.ctx
    const colA = mix(from.accentColor, to.accentColor, e)
    const colB = mix(from.horizon, to.horizon, e)
    const colors = [colA, colB, mix(colA, '#ffffff', 0.25)]

    ctx.save()
    for (let k = 0; k < 3; k++) {
      const baseY = h * (0.14 + k * 0.07) - this.cameraY * 0.05
      const g = ctx.createLinearGradient(0, baseY - 40, 0, baseY + 170)
      g.addColorStop(0, rgba(colors[k], 0))
      g.addColorStop(0.35, rgba(colors[k], 0.22 * intensity))
      g.addColorStop(1, rgba(colors[k], 0))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(0, baseY + 170)
      for (let x = 0; x <= w + 24; x += 24) {
        const y =
          baseY +
          Math.sin(x * 0.004 + this.time * 0.35 + k * 1.7) * 38 +
          Math.sin(x * 0.011 - this.time * 0.6 + k) * 14
        ctx.lineTo(x, y)
      }
      ctx.lineTo(w + 24, baseY + 170)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }

  private drawShootingStars() {
    const ctx = this.ctx
    ctx.save()
    for (const ss of this.shootingStars) {
      if (ss.delay > 0) continue
      const fade = Math.sin(Math.PI * Math.min(1, ss.age / ss.life)) * ss.alpha
      const g = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.length, ss.y - ss.length * 0.5)
      g.addColorStop(0, `rgba(255, 255, 255, ${fade})`)
      g.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.strokeStyle = g
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(ss.x, ss.y)
      ctx.lineTo(ss.x - ss.length, ss.y - ss.length * 0.5)
      ctx.stroke()
    }
    ctx.restore()
  }

  private drawClouds(from: StageConfig, to: StageConfig, e: number, front: boolean) {
    const color = mix(from.cloud, to.cloud, e)
    for (const cloud of this.clouds) {
      if (cloud.front !== front) continue
      this.drawLowPolyCloud(cloud.x, cloud.y - this.cameraY * 0.08, cloud.scale, color, front ? 0.75 : 1)
    }
  }

  private drawParticles(from: StageConfig, to: StageConfig) {
    const env = this.envT < 0.5 ? from : to
    const kind = env.particle
    const fade = Math.abs(this.envT * 2 - 1)
    const color = kind === 'snow' ? '#ffffff' : env.accentColor
    const ctx = this.ctx

    ctx.save()
    if (kind === 'digits') ctx.font = '12px ui-monospace, Menlo, monospace'

    for (const p of this.particles) {
      const tw = 0.5 + 0.5 * Math.sin(p.phase * 2 + p.x)
      switch (kind) {
        case 'bits':
          ctx.fillStyle = rgba(color, 0.55 * tw * fade)
          ctx.fillRect(p.x, p.y, p.size, p.size)
          break
        case 'digits':
          ctx.fillStyle = rgba(color, 0.35 * (0.4 + tw) * fade)
          ctx.fillText(p.glyph, p.x, p.y)
          break
        case 'embers':
          ctx.fillStyle = rgba(color, 0.18 * tw * fade)
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 2.6, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = rgba(mix(color, '#ffffff', 0.3), 0.85 * tw * fade)
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2)
          ctx.fill()
          break
        case 'orbs':
          ctx.fillStyle = rgba(color, 0.14 * fade)
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 3.2, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = rgba(color, (0.4 + 0.4 * tw) * fade)
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2)
          ctx.fill()
          break
        case 'snow':
          ctx.fillStyle = rgba(color, 0.6 * fade)
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2)
          ctx.fill()
          break
      }
    }
    ctx.restore()
  }

  private drawWorld(stage: StageConfig) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(0, -this.cameraY)

    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i]
      const isActive = i === this.activePlatformIndex

      ctx.shadowColor = isActive ? stage.accentColor : 'transparent'
      ctx.shadowBlur = isActive ? 22 : 0

      ctx.fillStyle = isActive ? stage.accentColor : stage.platformColor
      ctx.fillRect(p.x, p.y, p.width, 14)

      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
      ctx.fillRect(p.x, p.y, p.width, 3)

      // სიტყვა თავსდება p.y - 80-ზე (გმირის თავზე მაღლა და ზედა პლატფორმის დაბლა)
      ctx.font = '900 22px Inter, sans-serif'
      ctx.textAlign = 'center'

      const wordY = p.y - 80
      const centerX = p.x + p.width / 2

      const textWidth = ctx.measureText(p.word).width
      ctx.fillStyle = 'rgba(12, 3, 28, 0.88)'
      ctx.fillRect(centerX - textWidth / 2 - 12, wordY - 22, textWidth + 24, 32)

      ctx.strokeStyle = isActive ? stage.accentColor : 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(centerX - textWidth / 2 - 12, wordY - 22, textWidth + 24, 32)

      let currentDrawX = centerX - textWidth / 2

      for (let charIdx = 0; charIdx < p.word.length; charIdx++) {
        const char = p.word[charIdx]
        const isTyped = charIdx < p.typedLength

        ctx.fillStyle = isTyped ? '#30fca8' : (isActive ? '#ffffff' : '#9f85c7')
        ctx.textAlign = 'left'
        ctx.fillText(char, currentDrawX, wordY)
        currentDrawX += ctx.measureText(char).width
      }
    }

    this.drawTVHeadHero(this.playerPos.x, this.playerPos.y, stage.accentColor)

    ctx.restore()
  }

  private drawOverlays(stage: StageConfig, w: number, h: number) {
    const ctx = this.ctx

    // ვინეტი
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75)
    vg.addColorStop(0, 'rgba(8, 2, 20, 0)')
    vg.addColorStop(1, 'rgba(8, 2, 20, 0.55)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, w, h)

    // ეტაპის შეცვლისას — თემის ფერის ციმციმი
    if (this.stageFlash > 0) {
      ctx.fillStyle = rgba(stage.accentColor, this.stageFlash * 0.55)
      ctx.fillRect(0, 0, w, h)
    }

    if (this.flashError > 0) {
      ctx.fillStyle = `rgba(255, 50, 70, ${Math.min(this.flashError, 0.25)})`
      ctx.fillRect(0, 0, w, h)
    }

    // ეტაპის სათაური
    if (this.bannerT > 0) {
      const a = Math.max(0, Math.min(1, (STAGE_BANNER_SECONDS - this.bannerT) / 0.5, this.bannerT / 0.7))
      const parts = stage.name.split(' — ')
      const label = parts.length > 1 ? parts[0] : ''
      const title = parts.length > 1 ? parts[1] : stage.name
      const size = Math.min(44, Math.max(22, w * 0.045))

      ctx.save()
      ctx.globalAlpha = a
      ctx.textAlign = 'center'
      ctx.shadowColor = stage.accentColor
      ctx.shadowBlur = 24
      ctx.fillStyle = '#ffffff'
      ctx.font = `900 ${size}px Inter, system-ui, sans-serif`
      ctx.fillText(title, w / 2, h * 0.3)
      ctx.shadowBlur = 0
      if (label) {
        ctx.fillStyle = stage.accentColor
        ctx.font = `700 ${Math.round(size * 0.45)}px Inter, system-ui, sans-serif`
        ctx.fillText(label, w / 2, h * 0.3 - size * 1.05)
      }
      ctx.restore()
    }
  }

  // ---------- შორეული პატარა კუნძულები ----------

  private drawFarIslands(env: StageConfig, alpha: number, w: number, h: number) {
    if (alpha <= 0.001) return
    const ctx = this.ctx
    const k = Math.min(1.3, Math.max(0.75, w / 1100))

    ctx.save()
    ctx.globalAlpha = alpha * 0.8
    for (const m of MINI_ISLANDS) {
      const x = w * m.x + Math.sin(this.time * 0.2 + m.ph) * 14
      const y = h * m.y + Math.sin(this.time * 0.7 + m.ph) * 9 - this.cameraY * m.f
      this.drawMiniIsland(x, y, m.s * k, env, m.ph)
    }
    ctx.restore()
  }

  private drawMiniIsland(x: number, y: number, scale: number, env: StageConfig, phase: number) {
    const ctx = this.ctx
    const acc = env.accentColor
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)

    ctx.fillStyle = mix(env.rock[0], env.rock[1], 0.7)
    ctx.beginPath()
    ctx.moveTo(-62, 0)
    ctx.lineTo(0, 8)
    ctx.lineTo(6, 82)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = mix(env.rock[0], env.rock[1], 0.3)
    ctx.beginPath()
    ctx.moveTo(0, 8)
    ctx.lineTo(62, 0)
    ctx.lineTo(6, 82)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = mix(env.ground[0], env.ground[1], 0.55)
    ctx.beginPath()
    ctx.moveTo(-66, 0)
    ctx.lineTo(-30, -9)
    ctx.lineTo(34, -9)
    ctx.lineTo(66, 0)
    ctx.lineTo(30, 10)
    ctx.lineTo(-30, 10)
    ctx.closePath()
    ctx.fill()

    const variant = Math.floor(phase) % 2
    switch (env.theme) {
      case 'chip':
        this.drawBox(-16, 2, 16, 30 + variant * 14, 6, '#26306b')
        this.drawBox(16, 4, 14, 16, 6, '#1d2a5c')
        ctx.fillStyle = rgba(acc, 0.85)
        ctx.fillRect(-21, -20, 3, 4)
        ctx.fillRect(-21, -12, 3, 4)
        break
      case 'data':
        this.drawBox(-24, 2, 18, 14, 6, '#4a1a63')
        this.drawBox(-4, 0, 18, 28, 6, '#4a1a63')
        this.drawBox(16, -2, 18, 42, 6, '#4a1a63')
        break
      case 'tower':
        this.drawBox(0, 2, 16, 70 + variant * 16, 6, '#6e1d3b')
        ctx.fillStyle = rgba(acc, 0.9)
        ctx.beginPath()
        ctx.arc(6, -70 - variant * 16, 5, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'quantum':
        this.drawCrystal(0, 0, 46 + variant * 10, acc)
        this.drawCrystal(-26, 2, 20, acc)
        break
      case 'summit':
        this.drawPeak(0, 2, 70, 76 + variant * 20, env.rock)
        break
    }

    ctx.restore()
  }

  // ---------- მთავარი მცურავი კუნძული ----------

  private drawMainIsland(env: StageConfig, alpha: number, w: number, h: number) {
    if (alpha <= 0.001) return
    const ctx = this.ctx
    const s = Math.min(1.35, Math.max(0.75, w / 1000))
    const bob = Math.sin(this.time * 0.9) * 9

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(w * 0.5, h * 0.7 + bob - this.cameraY * 0.25)
    ctx.scale(s, s)
    this.drawIslandBody(env)
    this.drawIslandProps(env)
    ctx.restore()
  }

  private drawIslandBody(env: StageConfig) {
    const ctx = this.ctx
    const acc = env.accentColor

    // ქვემოდან მომავალი ჯადოსნური ნათება
    const glow = ctx.createRadialGradient(0, 250, 10, 0, 250, 260)
    glow.addColorStop(0, rgba(acc, 0.35))
    glow.addColorStop(1, rgba(acc, 0))
    ctx.fillStyle = glow
    ctx.fillRect(-300, 0, 600, 560)

    // მცურავი ქვები კუნძულის ქვეშ
    const debris: [number, number, number, number][] = [
      [-120, 285, 14, 0],
      [110, 262, 10, 1.3],
      [-20, 330, 8, 2.4],
      [185, 215, 7, 3.1],
    ]
    for (const [dx, dy, r, ph] of debris) {
      const oy = dy + Math.sin(this.time * 1.2 + ph) * 6
      ctx.fillStyle = mix(env.rock[0], env.rock[1], 0.6)
      ctx.beginPath()
      ctx.moveTo(dx, oy - r)
      ctx.lineTo(dx - r * 0.8, oy)
      ctx.lineTo(dx, oy + r * 1.1)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = mix(env.rock[0], env.rock[1], 0.25)
      ctx.beginPath()
      ctx.moveTo(dx, oy - r)
      ctx.lineTo(dx + r * 0.8, oy)
      ctx.lineTo(dx, oy + r * 1.1)
      ctx.closePath()
      ctx.fill()
    }

    // ქვედა ნაწილი — Low-Poly წახნაგები
    for (let i = 0; i < ISLAND_FACES.length; i++) {
      const f = ISLAND_FACES[i]
      const a = ISLAND_VERTS[f[0]]
      const b = ISLAND_VERTS[f[1]]
      const c = ISLAND_VERTS[f[2]]
      const mx = (a[0] + b[0] + c[0]) / 3
      const my = (a[1] + b[1] + c[1]) / 3
      const t = 0.62 - mx / 560 - my / 520 + ISLAND_JITTER[i]
      const col = mix(env.rock[0], env.rock[1], t)
      ctx.fillStyle = col
      ctx.strokeStyle = col
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(a[0], a[1])
      ctx.lineTo(b[0], b[1])
      ctx.lineTo(c[0], c[1])
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }

    // ენერგიის ძარღვები ქვაში
    ctx.save()
    ctx.strokeStyle = rgba(acc, 0.5 + 0.25 * Math.sin(this.time * 2))
    ctx.lineWidth = 2
    ctx.shadowColor = acc
    ctx.shadowBlur = 8
    const veins: Pt[][] = [
      [[-110, 48], [-90, 84], [-60, 98], [-40, 150]],
      [[70, 60], [90, 100], [70, 140], [60, 190]],
    ]
    for (const v of veins) {
      ctx.beginPath()
      ctx.moveTo(v[0][0], v[0][1])
      for (let i = 1; i < v.length; i++) ctx.lineTo(v[i][0], v[i][1])
      ctx.stroke()
    }
    ctx.restore()

    // ზედა ზედაპირი
    const cx = 0
    const cy = 4
    for (let i = 0; i < ISLAND_TOP.length; i++) {
      const a = ISLAND_TOP[i]
      const b = ISLAND_TOP[(i + 1) % ISLAND_TOP.length]
      const col = mix(env.ground[0], env.ground[1], ISLAND_TOP_JITTER[i])
      ctx.fillStyle = col
      ctx.strokeStyle = col
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(a[0], a[1])
      ctx.lineTo(b[0], b[1])
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }

    // წინა კიდის შუქი
    ctx.strokeStyle = rgba(mix(env.ground[1], '#ffffff', 0.35), 0.8)
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.beginPath()
    const rim = [0, 7, 6, 5, 4]
    ctx.moveTo(ISLAND_TOP[rim[0]][0], ISLAND_TOP[rim[0]][1])
    for (let i = 1; i < rim.length; i++) ctx.lineTo(ISLAND_TOP[rim[i]][0], ISLAND_TOP[rim[i]][1])
    ctx.stroke()
  }

  // ეტაპის თემა — რა დგას კუნძულზე
  private drawIslandProps(env: StageConfig) {
    const ctx = this.ctx
    const acc = env.accentColor

    switch (env.theme) {
      case 'chip': {
        // მბრუნავი სიგნალის ბილიკები
        ctx.save()
        ctx.strokeStyle = rgba(acc, 0.85)
        ctx.lineWidth = 2
        ctx.shadowColor = acc
        ctx.shadowBlur = 8
        ctx.setLineDash([10, 14])
        ctx.lineDashOffset = -this.time * 45
        const traces: Pt[][] = [
          [[-235, 6], [-170, 6], [-140, 20], [-70, 20], [-50, 34]],
          [[235, 10], [170, 10], [140, -2], [80, -2]],
          [[-120, -14], [-60, -14], [-30, -4], [30, -4]],
          [[60, 26], [110, 26], [135, 14]],
        ]
        for (const tr of traces) {
          ctx.beginPath()
          ctx.moveTo(tr[0][0], tr[0][1])
          for (let i = 1; i < tr.length; i++) ctx.lineTo(tr[i][0], tr[i][1])
          ctx.stroke()
        }
        ctx.restore()

        this.drawTower(-95, -12, 44, 40, 12, '#1d2a5c', acc, 3, 3, 2)
        this.drawTower(95, -10, 40, 96, 14, '#2a3475', acc, 3, 7, 3)
        this.drawTower(-175, 4, 34, 74, 12, '#26306b', acc, 3, 5, 1)
        this.drawTower(190, 4, 30, 56, 10, '#26306b', acc, 2, 4, 4)
        this.drawTower(10, 16, 70, 24, 16, '#16204a', acc, 5, 2, 5)

        // ჩიპის გული
        ctx.save()
        ctx.shadowColor = acc
        ctx.shadowBlur = 16
        ctx.fillStyle = rgba(acc, 0.8 + 0.2 * Math.sin(this.time * 3))
        ctx.fillRect(6, -15, 24, 6)
        ctx.restore()
        break
      }

      case 'data': {
        const stairs: [number, number, number, number][] = [
          [-190, 10, 54, 28],
          [-136, 6, 54, 50],
          [-82, 2, 54, 72],
          [-28, -2, 54, 94],
          [26, -6, 54, 116],
        ]
        stairs.forEach(([x, y, w, h], i) => {
          this.drawTower(x, y, w, h, 14, '#4a1a63', acc, 2, Math.max(2, Math.round(h / 16)), i + 1)
        })
        this.drawTower(110, 8, 40, 62, 12, '#3b1450', acc, 2, 4, 9)
        this.drawTower(166, 14, 34, 40, 12, '#3b1450', acc, 2, 3, 10)

        // კაბელები მონაცემთა ნაკადით
        ctx.save()
        ctx.strokeStyle = rgba(acc, 0.8)
        ctx.lineWidth = 2
        ctx.shadowColor = acc
        ctx.shadowBlur = 8
        ctx.setLineDash([8, 12])
        ctx.lineDashOffset = -this.time * 40
        ctx.beginPath()
        ctx.moveTo(-150, 12)
        ctx.quadraticCurveTo(-60, 56, 30, 34)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(40, 34)
        ctx.quadraticCurveTo(100, 52, 125, 14)
        ctx.stroke()
        ctx.restore()

        // ზედა საფეხურიდან ამომავალი სხივი
        const bx = 33
        const by = -126
        const pulse = 0.65 + 0.35 * Math.sin(this.time * 2.2)
        const beam = ctx.createLinearGradient(0, by, 0, by - 560)
        beam.addColorStop(0, rgba(acc, 0.55 * pulse))
        beam.addColorStop(1, rgba(acc, 0))
        ctx.fillStyle = beam
        ctx.fillRect(bx - 9, by - 560, 18, 560)
        const disc = ctx.createRadialGradient(bx, by, 2, bx, by, 40)
        disc.addColorStop(0, rgba(acc, 0.7 * pulse))
        disc.addColorStop(1, rgba(acc, 0))
        ctx.fillStyle = disc
        ctx.fillRect(bx - 40, by - 40, 80, 80)
        break
      }

      case 'tower': {
        // სითბოს ნათება კოშკის გარშემო
        const aura = ctx.createRadialGradient(8, -90, 10, 8, -90, 190)
        aura.addColorStop(0, rgba(acc, 0.22))
        aura.addColorStop(1, rgba(acc, 0))
        ctx.fillStyle = aura
        ctx.fillRect(-200, -290, 400, 400)

        // რადიატორის ფირფიტები
        for (let k = 0; k < 6; k++) {
          this.drawBox(-205 + k * 12, 8, 6, 36 + (k % 2) * 12, 4, '#7a2a3e')
          this.drawBox(133 + k * 12, 8, 6, 36 + ((k + 1) % 2) * 12, 4, '#7a2a3e')
        }

        // პროცესორის ფირფიტა და ოქროსფერი კონტაქტები
        this.drawBox(0, 20, 190, 12, 30, '#5c1d33')
        ctx.fillStyle = '#ffb83f'
        for (let i = 0; i < 14; i++) ctx.fillRect(-88 + i * 13.5, 20, 4, 5)

        this.drawTower(8, 0, 62, 220, 16, '#6e1d3b', acc, 3, 14, 7)
        this.drawTower(11, -220, 40, 46, 12, '#7d2444', acc, 2, 3, 8)

        // ანძა და მაჯის შუქი
        const pulse = 0.7 + 0.3 * Math.sin(this.time * 3)
        ctx.strokeStyle = '#ffb83f'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(17, -269)
        ctx.lineTo(17, -306)
        ctx.stroke()
        const halo = ctx.createRadialGradient(17, -306, 2, 17, -306, 36 * pulse)
        halo.addColorStop(0, rgba(acc, 0.9))
        halo.addColorStop(1, rgba(acc, 0))
        ctx.fillStyle = halo
        ctx.fillRect(-30, -350, 94, 90)
        break
      }

      case 'quantum': {
        this.drawTower(-190, 6, 30, 58, 10, '#12423f', acc, 2, 4, 11)
        this.drawTower(192, 8, 28, 42, 10, '#12423f', acc, 2, 3, 12)

        // მინის გუმბათები ატომებით
        const domes: [number, number, number][] = [
          [-95, 16, 62],
          [115, 18, 44],
        ]
        for (const [dx, dy, dr] of domes) {
          ctx.fillStyle = rgba(acc, 0.13)
          ctx.beginPath()
          ctx.arc(dx, dy, dr, Math.PI, 0)
          ctx.closePath()
          ctx.fill()

          ctx.strokeStyle = rgba(acc, 0.6)
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(dx, dy, dr, Math.PI, 0)
          ctx.stroke()

          ctx.strokeStyle = rgba(acc, 0.28)
          ctx.lineWidth = 1
          for (let k = 1; k < 4; k++) {
            const a = Math.PI + (Math.PI * k) / 4
            ctx.beginPath()
            ctx.moveTo(dx, dy)
            ctx.lineTo(dx + Math.cos(a) * dr, dy + Math.sin(a) * dr)
            ctx.stroke()
          }

          ctx.save()
          ctx.shadowColor = acc
          ctx.shadowBlur = 12
          ctx.fillStyle = rgba(acc, 0.9)
          ctx.beginPath()
          ctx.arc(dx, dy - dr * 0.35 + Math.sin(this.time * 2 + dx) * 3, 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }

        // მცურავი კვანტური სფერო რგოლებით
        const ox = 10
        const oy = -150 + Math.sin(this.time * 1.4) * 6

        const col = ctx.createLinearGradient(0, oy, 0, 14)
        col.addColorStop(0, rgba(acc, 0.35))
        col.addColorStop(1, rgba(acc, 0))
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.moveTo(ox - 6, oy)
        ctx.lineTo(ox + 6, oy)
        ctx.lineTo(ox + 40, 14)
        ctx.lineTo(ox - 40, 14)
        ctx.closePath()
        ctx.fill()

        const halo = ctx.createRadialGradient(ox, oy, 4, ox, oy, 80)
        halo.addColorStop(0, rgba(acc, 0.5))
        halo.addColorStop(1, rgba(acc, 0))
        ctx.fillStyle = halo
        ctx.fillRect(ox - 80, oy - 80, 160, 160)

        ctx.fillStyle = mix(acc, '#ffffff', 0.55)
        ctx.beginPath()
        ctx.arc(ox, oy, 20, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = acc
        ctx.beginPath()
        ctx.arc(ox + 4, oy + 4, 13, 0, Math.PI * 2)
        ctx.fill()

        for (let k = 0; k < 3; k++) {
          ctx.save()
          ctx.translate(ox, oy)
          ctx.rotate(this.time * (0.5 + 0.2 * k) + k * 1.05)
          ctx.scale(1, 0.32)
          ctx.strokeStyle = rgba(acc, 0.75)
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(0, 0, 54 + k * 12, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        }

        for (let k = 0; k < 5; k++) {
          const a = this.time * 0.6 + k * 1.2566
          this.drawCrystal(ox + Math.cos(a) * 110, oy + Math.sin(a) * 30 + 12, 18, acc)
        }
        break
      }

      case 'summit': {
        this.drawPeak(10, -4, 120, 270, env.rock)
        this.drawPeak(-100, 4, 140, 165, env.rock)
        this.drawPeak(130, 6, 120, 150, env.rock)

        const trees: [number, number, number][] = [
          [-215, 10, 0.9], [-185, 18, 1.1], [-150, 24, 0.8], [165, 26, 1],
          [200, 14, 1.1], [225, 6, 0.8], [60, 34, 0.7], [-40, 38, 0.8],
        ]
        for (const [tx, ty, ts] of trees) {
          this.drawLowPolyTree(tx, ty, ts, '#2c2460', '#4a3b9a')
        }

        // მწვერვალის შუქურა
        const bx = 14.8
        const by = -274
        const pulse = 0.65 + 0.35 * Math.sin(this.time * 2)
        const beam = ctx.createLinearGradient(0, by, 0, by - 700)
        beam.addColorStop(0, rgba(acc, 0.6 * pulse))
        beam.addColorStop(1, rgba(acc, 0))
        ctx.fillStyle = beam
        ctx.fillRect(bx - 8, by - 700, 16, 700)
        const disc = ctx.createRadialGradient(bx, by, 2, bx, by, 46)
        disc.addColorStop(0, rgba('#ffffff', 0.9 * pulse))
        disc.addColorStop(0.3, rgba(acc, 0.6 * pulse))
        disc.addColorStop(1, rgba(acc, 0))
        ctx.fillStyle = disc
        ctx.fillRect(bx - 46, by - 46, 92, 92)
        break
      }
    }
  }

  // ---------- დამხმარე ფორმები ----------

  // ობიექტის სამგანზომილებიანი ყუთი (წინა + ზედა + მარჯვენა წახნაგი)
  private drawBox(x: number, y: number, w: number, h: number, d: number, base: string) {
    const ctx = this.ctx
    ctx.fillStyle = base
    ctx.fillRect(x - w / 2, y - h, w, h)

    ctx.fillStyle = mix(base, '#ffffff', 0.28)
    ctx.beginPath()
    ctx.moveTo(x - w / 2, y - h)
    ctx.lineTo(x - w / 2 + d, y - h - d * 0.5)
    ctx.lineTo(x + w / 2 + d, y - h - d * 0.5)
    ctx.lineTo(x + w / 2, y - h)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = mix(base, '#000000', 0.38)
    ctx.beginPath()
    ctx.moveTo(x + w / 2, y - h)
    ctx.lineTo(x + w / 2 + d, y - h - d * 0.5)
    ctx.lineTo(x + w / 2 + d, y - d * 0.5)
    ctx.lineTo(x + w / 2, y)
    ctx.closePath()
    ctx.fill()
  }

  // ყუთი ციმციმა ფანჯრებით
  private drawTower(
    x: number,
    y: number,
    w: number,
    h: number,
    d: number,
    base: string,
    accent: string,
    cols: number,
    rows: number,
    seed: number,
  ) {
    const ctx = this.ctx
    this.drawBox(x, y, w, h, d, base)

    const padX = w * 0.16
    const padY = Math.min(8, h * 0.1)
    const cw = (w - padX * 2) / cols
    const ch = (h - padY * 2) / rows
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const k = Math.sin(this.time * 1.3 + r * 7 + c * 13 + seed * 5.3)
        ctx.fillStyle = rgba(accent, 0.2 + 0.7 * Math.max(0, (k + 1) / 2))
        ctx.fillRect(x - w / 2 + padX + c * cw + cw * 0.2, y - h + padY + r * ch + ch * 0.22, cw * 0.6, ch * 0.5)
      }
    }
  }

  // მანათობელი კრისტალი (y — ქვედა წერტილი)
  private drawCrystal(x: number, y: number, h: number, color: string) {
    const ctx = this.ctx
    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur = 12
    ctx.fillStyle = mix(color, '#ffffff', 0.3)
    ctx.beginPath()
    ctx.moveTo(x, y - h)
    ctx.lineTo(x - h * 0.22, y - h * 0.45)
    ctx.lineTo(x, y)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = mix(color, '#000000', 0.25)
    ctx.beginPath()
    ctx.moveTo(x, y - h)
    ctx.lineTo(x + h * 0.22, y - h * 0.45)
    ctx.lineTo(x, y)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // ზედ თოვლიანი Low-Poly მწვერვალი
  private drawPeak(cx: number, by: number, bw: number, h: number, rock: [string, string]) {
    const ctx = this.ctx
    const ax = cx + bw * 0.04
    const ay = by - h
    const ridgeX = cx + bw * 0.08

    ctx.fillStyle = mix(rock[0], rock[1], 0.75)
    ctx.beginPath()
    ctx.moveTo(cx - bw / 2, by)
    ctx.lineTo(ax, ay)
    ctx.lineTo(ridgeX, by)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = mix(rock[0], rock[1], 0.25)
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(ridgeX, by)
    ctx.lineTo(cx + bw / 2, by)
    ctx.closePath()
    ctx.fill()

    const f = 0.32
    const lx = ax + (cx - bw / 2 - ax) * f
    const rx = ax + (cx + bw / 2 - ax) * f
    const mx = ax + (ridgeX - ax) * f
    const sy = ay + h * f

    ctx.fillStyle = mix(rock[1], '#ffffff', 0.85)
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(lx, sy)
    ctx.lineTo(lx + (mx - lx) * 0.4, sy + h * 0.06)
    ctx.lineTo(lx + (mx - lx) * 0.7, sy - h * 0.005)
    ctx.lineTo(mx, sy)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = mix(rock[1], '#ffffff', 0.55)
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(mx, sy)
    ctx.lineTo(mx + (rx - mx) * 0.35, sy + h * 0.05)
    ctx.lineTo(mx + (rx - mx) * 0.7, sy - h * 0.005)
    ctx.lineTo(rx, sy)
    ctx.closePath()
    ctx.fill()
  }

  private drawLowPolyTree(x: number, y: number, scale: number, dark = '#234a17', light = '#346623') {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)

    ctx.fillStyle = '#2b1a11'
    ctx.fillRect(-2, -6, 4, 8)

    ctx.fillStyle = dark
    ctx.beginPath()
    ctx.moveTo(-10, -6)
    ctx.lineTo(0, -28)
    ctx.lineTo(10, -6)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = light
    ctx.beginPath()
    ctx.moveTo(0, -28)
    ctx.lineTo(10, -6)
    ctx.lineTo(0, -6)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  private drawLowPolyCloud(x: number, y: number, scale: number, color: string, opacity: number) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)

    ctx.fillStyle = rgba(color, 0.38 * opacity)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(18, -14)
    ctx.lineTo(42, -10)
    ctx.lineTo(60, 0)
    ctx.lineTo(35, 12)
    ctx.lineTo(12, 10)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = rgba(mix(color, '#ffffff', 0.35), 0.3 * opacity)
    ctx.beginPath()
    ctx.moveTo(18, -14)
    ctx.lineTo(30, -26)
    ctx.lineTo(46, -12)
    ctx.lineTo(42, -10)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = rgba(color, 0.22 * opacity)
    ctx.beginPath()
    ctx.moveTo(-26, 6)
    ctx.lineTo(0, 0)
    ctx.lineTo(12, 10)
    ctx.lineTo(-8, 16)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }


  private drawTVHeadHero(x: number, y: number, glowColor: string) {
    const ctx = this.ctx
    const top = y - 62

    ctx.save()
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 15

    ctx.strokeStyle = '#222222'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x - 6, top - 2)
    ctx.lineTo(x - 14, top - 14)
    ctx.moveTo(x + 6, top - 2)
    ctx.lineTo(x + 14, top - 14)
    ctx.stroke()

    ctx.fillStyle = '#111111'
    ctx.beginPath()
    ctx.arc(x - 14, top - 14, 3.5, 0, Math.PI * 2)
    ctx.arc(x + 14, top - 14, 3.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#d1d5db'
    ctx.fillRect(x - 18, top, 36, 28)
    ctx.strokeStyle = '#9ca3af'
    ctx.lineWidth = 2
    ctx.strokeRect(x - 18, top, 36, 28)

    const screenX = x - 14
    const screenY = top + 4
    const screenW = 28
    const screenH = 20

    ctx.fillStyle = '#1f2937'
    ctx.fillRect(screenX, screenY, screenW, screenH)

    const colors = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6']
    const barW = screenW / colors.length
    for (let i = 0; i < colors.length; i++) {
      ctx.fillStyle = colors[i]
      ctx.fillRect(screenX + i * barW, screenY, barW, screenH)
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
    ctx.fillRect(screenX, screenY + 6, screenW, 8)

    ctx.fillStyle = '#ef4444'
    ctx.fillRect(screenX + 4, screenY + 7, 7, 5)
    ctx.fillStyle = '#06b6d4'
    ctx.fillRect(screenX + 17, screenY + 7, 7, 5)

    ctx.shadowBlur = 0

    ctx.fillStyle = '#b91c1c'
    ctx.fillRect(x - 13, top + 28, 26, 16)

    ctx.fillStyle = '#fca5a5'
    ctx.fillRect(x - 17, top + 28, 4, 14)
    ctx.fillRect(x + 13, top + 28, 4, 14)

    ctx.fillStyle = '#1d4ed8'
    ctx.fillRect(x - 12, top + 44, 10, 16)
    ctx.fillRect(x + 2, top + 44, 10, 16)

    ctx.fillStyle = '#1f2937'
    ctx.fillRect(x - 13, top + 57, 11, 5)
    ctx.fillRect(x + 2, top + 57, 11, 5)

    ctx.restore()
  }

  private finishGame() {
    this.running = false
    this.endTime = performance.now()

    const totalTimeSeconds = Math.round((this.endTime - this.startTime) / 1000)
    const elapsedMinutes = Math.max(0.01, totalTimeSeconds / 60)
    const wpm = Math.round((this.totalTypedCorrect / 5) / elapsedMinutes)
    const totalAttempts = this.totalTypedCorrect + this.errors
    const accuracy = totalAttempts > 0 ? Math.round((this.totalTypedCorrect / totalAttempts) * 100) : 100

    let feedbackText = ''
    if (accuracy >= 92 && wpm >= 28 && this.errors <= 5) {
      feedbackText = '🚀 ყოჩაღ! შენ პროფესიონალი პროგრამისტივით წერ კლავიატურაზე!'
    } else if (accuracy >= 75 && wpm >= 16) {
      feedbackText = '⚡ ძალიან კარგი შედეგია! მეტი ვარჯიშით ნამდვილი პროფესიონალი გახდები.'
    } else {
      feedbackText = '✨ დარწმუნებული ვარ, თუ კლავიატურას უკეთ შეიგრძნობ, ისეთ შედეგს დადებ, შენც კი გაგიკვირდება!'
    }

    const modal = this.root.querySelector('.tg-modal') as HTMLDivElement
    modal.hidden = false
    modal.innerHTML = `
      <div class="tg-card">
        <h2>🏆 ${TOTAL_WORDS}-ვე სიტყვა აკრეფილია!</h2>
        <p>${feedbackText}</p>
        
        <div class="tg-result-grid">
          <div class="tg-res-item">
            <div class="tg-res-val">${wpm}</div>
            <div class="tg-res-lbl">WPM</div>
          </div>
          <div class="tg-res-item">
            <div class="tg-res-val">${accuracy}%</div>
            <div class="tg-res-lbl">სიზუსტე</div>
          </div>
          <div class="tg-res-item">
            <div class="tg-res-val">${this.errors}</div>
            <div class="tg-res-lbl">შეცდომა</div>
          </div>
        </div>

        <button class="tg-btn" type="button">სამეფოში დაბრუნება</button>
      </div>
    `

    modal.querySelector('button')!.addEventListener('click', () => {
      this.onSuccess?.({ wpm, accuracy, totalTimeSeconds, errors: this.errors })
      this.close()
    })
  }

  private close() {
    if (this.disposed) return
    this.disposed = true
    this.running = false
    cancelAnimationFrame(this.frame)

    window.removeEventListener('keydown', this.keyHandler)
    window.removeEventListener('resize', this.resizeHandler)
    this.root.remove()
    this.onClose?.()
  }
}