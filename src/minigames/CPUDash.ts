export type CPUDashOptions = {
  onClose?: () => void
}

type Question = {
  prompt: string
  answers: string[]
  // true — მიიღება ჩამოთვლილი პასუხებიდან ნებისმიერი (ან რამდენიმე მათგანი ერთად)
  anyOf?: boolean
}

type ObstacleKind =
  | 'spike'
  | 'block'
  | 'electric'
  | 'data'
  | 'bridge'
  | 'super_bridge'
  | 'finish'
  | 'wall'
  | 'drone'
  | 'saw'
  | 'drop'

type Obstacle = {
  x: number
  width: number
  height: number
  kind: ObstacleKind
  passed?: boolean
  yOffset?: number
  vx?: number // დამატებითი სიჩქარე მოთამაშისკენ (მოძრავი ხერხი)
  baseOffset?: number // ტივტივა დრონის საშუალო სიმაღლე
  bobAmp?: number
  bobSpeed?: number
  bobPhase?: number
  dropY?: number // ჩამოვარდნილი ბლოკი: რამდენით არის ზემოთ საბოლოო ადგილიდან
  triggerX?: number // სად დაიწყოს ბლოკმა ვარდნა
  impact?: boolean
}

type Meteor = {
  x: number
  y: number
  length: number
  speed: number
  alpha: number
}

type Theme = 'chip' | 'data' | 'core' | 'city' | 'virus' | 'ocean' | 'tunnel' | 'server' | 'storm'

type ChunkKind =
  | 'plain'
  | 'triple'
  | 'pad'
  | 'padWall'
  | 'bridge'
  | 'bridgeWall'
  | 'drone'
  | 'drop'
  | 'saw'

type Features = {
  superBridge: number // სუპერ-ხტომის პლატფორმა
  bridge: number // ხიდი
  bridgeHazard: boolean // ხიდზე/ხიდის შემდეგ დაბრკოლება
  wall: number // მაღალი ბარიერი (ხიდით ან სუპერ-ხტომით გასავლელი)
  drone: number // დრონი ჰაერში
  droneCombo: number // დრონის შემდეგ მიწის დაბრკოლება
  bob: boolean // ტივტივა დრონები
  drop: number // ცაზე ჩამოვარდნილი ბლოკი
  saw: number // მოძრავი ხერხი
  double: number // ორმაგი ეკალი
  triple: number // სამმაგი ეკალი
}

type LevelConfig = {
  name: string
  speed: number
  gapMin: number
  gapMax: number
  obstacleChance: number
  color: string
  background: string
  accent: string
  theme: Theme
  sky: [string, string, string]
  tip: string
  features: Features
}

const QUESTION_BANK: Question[] = [
  {
    prompt: 'ვინ იყო პირველი პროგრამისტი ადამიანი?',
    answers: ['ადა ლავლეისი', 'ada lovelace'],
  },
  {
    prompt: 'რომელი კომპიუტერის ნაწილი ამუშავებს ინფორმაციას?',
    answers: ['პროცესორი', 'cpu'],
  },
  {
    prompt: 'დინამიკები ინფორმაციის შემტანი მოწყობილობაა თუ გამომტანი?',
    answers: ['გამომტანი', 'გამომტანი მოწყობილობა'],
  },
  {
    prompt: 'რა ქვია შეცდომას პროგრამირებაში?',
    answers: ['bug', 'ბაგი'],
  },
  {
    prompt: 'რომელი ნაწილი ინახავს მეხსიერებას?',
    answers: ['hdd', 'ვინჩესტერი', 'მყარი დისკი'],
  },
  {
    prompt: 'რომელ ნაწილს ავიწყდება ყველაფერი გათიშვის მერე?',
    answers: ['ram', 'ოპერატიული', 'ოპერატიული მეხსიერება'],
  },
  {
    prompt: 'რამდენი სიმბოლო უნდა იყოს პაროლი, როდესაც ვქმნით ახალს?',
    answers: ['რვა', '8', 'რვა სიმბოლო', '8 სიმბოლო'],
  },
  {
    prompt: 'ვის უნდა გავუზიაროთ ჩვენი პაროლი?',
    answers: ['არავის'],
  },
  {
    prompt: 'როგორი შეცდომა ან შეცდომები იცი პროგრამირებაში?',
    answers: ['სინტაქსური', 'ლოგიკური', 'სტილისტიკური'],
    anyOf: true,
  },
]

// ერთი ეტაპის სიგრძე მეტრებში
const LEVEL_LENGTH = 2000

// რთული ნაკრებების წინ დამატებითი დრო (წამებში) — წინა დაბრკოლების გადალახვის შემდეგ მოსამზადებლად
const CHUNK_LEAD: Partial<Record<ChunkKind, number>> = {
  bridgeWall: 0.3,
  padWall: 0.3,
  saw: 0.25,
  drone: 0.12,
  triple: 0.08,
}
const DROP_SPEED = 1500

const NO_FEATURES: Features = {
  superBridge: 0,
  bridge: 0,
  bridgeHazard: false,
  wall: 0,
  drone: 0,
  droneCombo: 0,
  bob: false,
  drop: 0,
  saw: 0,
  double: 0,
  triple: 0,
}

const LEVELS: LevelConfig[] = [
  {
    name: 'ეტაპი 1 — ჩიპის ველი',
    speed: 350,
    gapMin: 280,
    gapMax: 410,
    obstacleChance: 0.72,
    color: '#43e7ff',
    background: '#06132b',
    accent: '#00f2fe',
    theme: 'chip',
    sky: ['#06132b', '#080816', '#02040a'],
    tip: '',
    features: { ...NO_FEATURES },
  },
  {
    name: 'ეტაპი 2 — მონაცემთა ნაკადი',
    speed: 415,
    gapMin: 270,
    gapMax: 390,
    obstacleChance: 0.78,
    color: '#ff4fd8',
    background: '#1d0833',
    accent: '#ff0844',
    theme: 'data',
    sky: ['#1d0833', '#080816', '#02040a'],
    tip: '',
    features: { ...NO_FEATURES, bridge: 0.35 },
  },
  {
    name: 'ეტაპი 3 — პროცესორის ბირთვი',
    speed: 500,
    gapMin: 270,
    gapMax: 390,
    obstacleChance: 0.88,
    color: '#ffb83f',
    background: '#2b0a12',
    accent: '#f77062',
    theme: 'core',
    sky: ['#2b0a12', '#080816', '#02040a'],
    tip: '',
    features: { ...NO_FEATURES, superBridge: 0.22, bridge: 0.22, bridgeHazard: true, double: 0.25 },
  },
  {
    name: 'ეტაპი 4 — ქსელის ქალაქი',
    speed: 540,
    gapMin: 250,
    gapMax: 360,
    obstacleChance: 0.9,
    color: '#5ef2c3',
    background: '#06203a',
    accent: '#3d9bff',
    theme: 'city',
    sky: ['#06203a', '#0a1130', '#02040a'],
    tip: 'ახალი: მაღალი ბარიერები და დრონები — გადახტი ხიდიდან ან სუპერ-ხტომის პლატფორმიდან',
    features: {
      ...NO_FEATURES,
      superBridge: 0.1,
      bridge: 0.16,
      bridgeHazard: true,
      wall: 0.14,
      drone: 0.12,
      droneCombo: 0.5,
      double: 0.3,
    },
  },
  {
    name: 'ეტაპი 5 — ვირუსის ზონა',
    speed: 575,
    gapMin: 245,
    gapMax: 350,
    obstacleChance: 0.92,
    color: '#8dff4f',
    background: '#1a0a1f',
    accent: '#ff2d55',
    theme: 'virus',
    sky: ['#1a0a1f', '#14081a', '#04010a'],
    tip: 'ახალი: ცაზე ჩამოვარდნილი ბლოკები და სამმაგი ეკლები',
    features: {
      ...NO_FEATURES,
      superBridge: 0.1,
      bridge: 0.14,
      bridgeHazard: true,
      wall: 0.14,
      drone: 0.12,
      droneCombo: 0.55,
      drop: 0.1,
      double: 0.3,
      triple: 0.12,
    },
  },
  {
    name: 'ეტაპი 6 — მეხსიერების ოკეანე',
    speed: 610,
    gapMin: 245,
    gapMax: 345,
    obstacleChance: 0.93,
    color: '#4fc3ff',
    background: '#031b3a',
    accent: '#00e0c6',
    theme: 'ocean',
    sky: ['#031b3a', '#061a38', '#01050d'],
    tip: 'ახალი: მოძრავი ხერხები და ტივტივა დრონები',
    features: {
      ...NO_FEATURES,
      superBridge: 0.1,
      bridge: 0.12,
      bridgeHazard: true,
      wall: 0.14,
      drone: 0.12,
      droneCombo: 0.6,
      bob: true,
      drop: 0.1,
      saw: 0.1,
      double: 0.32,
      triple: 0.15,
    },
  },
  {
    name: 'ეტაპი 7 — კვანტური გვირაბი',
    speed: 645,
    gapMin: 240,
    gapMax: 335,
    obstacleChance: 0.94,
    color: '#b06bff',
    background: '#12062e',
    accent: '#ff6bd6',
    theme: 'tunnel',
    sky: ['#12062e', '#0a0420', '#02010a'],
    tip: 'ტემპი იზრდება — დაბრკოლებები ერთმანეთს უფრო მალე მოჰყვება',
    features: {
      ...NO_FEATURES,
      superBridge: 0.1,
      bridge: 0.12,
      bridgeHazard: true,
      wall: 0.15,
      drone: 0.12,
      droneCombo: 0.6,
      bob: true,
      drop: 0.11,
      saw: 0.11,
      double: 0.33,
      triple: 0.17,
    },
  },
  {
    name: 'ეტაპი 8 — სერვერების ბნელი ოთახი',
    speed: 680,
    gapMin: 240,
    gapMax: 330,
    obstacleChance: 0.95,
    color: '#ffd34f',
    background: '#1d1405',
    accent: '#ff7a3d',
    theme: 'server',
    sky: ['#1d1405', '#120c05', '#050302'],
    tip: 'ყველა სახის დაბრკოლება ერთად — არ დაიძინო!',
    features: {
      ...NO_FEATURES,
      superBridge: 0.1,
      bridge: 0.11,
      bridgeHazard: true,
      wall: 0.16,
      drone: 0.12,
      droneCombo: 0.65,
      bob: true,
      drop: 0.12,
      saw: 0.12,
      double: 0.35,
      triple: 0.18,
    },
  },
  {
    name: 'ეტაპი 9 — ციფრული ქარიშხალი',
    speed: 720,
    gapMin: 235,
    gapMax: 325,
    obstacleChance: 0.96,
    color: '#7df9ff',
    background: '#0b0b1f',
    accent: '#ffeb3b',
    theme: 'storm',
    sky: ['#0b0b1f', '#070714', '#010103'],
    tip: 'ფინალი! ქარიშხალი, ელვა და ყველაზე სწრაფი ტემპი',
    features: {
      ...NO_FEATURES,
      superBridge: 0.1,
      bridge: 0.1,
      bridgeHazard: true,
      wall: 0.17,
      drone: 0.12,
      droneCombo: 0.7,
      bob: true,
      drop: 0.13,
      saw: 0.13,
      double: 0.36,
      triple: 0.2,
    },
  },
]

// ---------- დამხმარე ფუნქციები ----------

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`
}

// დეტერმინისტული "შემთხვევითობა" ფონის ელემენტებისთვის (0..1)
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function mod(a: number, m: number): number {
  return ((a % m) + m) % m
}

// უსასრულოდ მოძრავი ელემენტების განლაგება: x — პოზიცია, id — უნიკალური იდენტობა
function slot(i: number, gap: number, offset: number, count: number): { x: number; id: number } {
  const span = gap * count
  const raw = i * gap - offset
  const cycle = Math.floor(raw / span)
  return { x: raw - cycle * span - gap, id: i + cycle * count }
}

export class CPUDash {
  private root!: HTMLDivElement
  private canvas!: HTMLCanvasElement
  private ctx!: CanvasRenderingContext2D
  private frame = 0
  private lastTime = 0
  private running = false
  private disposed = false

  private levelIndex = 0
  private distance = 0
  private score = 0
  private obstacles: Obstacle[] = []
  private meteors: Meteor[] = []
  private nextObstacleX = 0
  private playerY = 0
  private velocityY = 0
  private grounded = true
  private jumpQueued = false
  private questionOpen = false
  private lastQuestion = -1
  private currentQuestionIndex = -1
  private readonly answeredQuestionIndices = new Set<number>()
  private flash = 0
  private levelIntroUntil = 0
  private finishSpawned = false
  private time = 0
  private scroll = 0
  private shake = 0
  private levelFade = 0
  private tipShownFor = -1

  private readonly playerSize = 38
  private currentGravity = 1900
  private currentJumpPower = 690

  private readonly resizeHandler = () => this.resize()
  private readonly keyHandler = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    const typing = !!target?.closest('input, textarea, [contenteditable="true"]')

    if (event.code === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      this.close()
      return
    }

    if (typing) return

    if (
      event.code === 'Space' ||
      event.code === 'ArrowUp' ||
      event.code === 'KeyW'
    ) {
      event.preventDefault()
      if (!this.questionOpen && this.running) {
        this.jumpQueued = true
      }
    }
  }

  private readonly pointerHandler = (event: PointerEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('button, input')) return

    if (!this.questionOpen && this.running) {
      this.jumpQueued = true
    }
  }

  constructor(options: CPUDashOptions = {}) {
    this.onClose = options.onClose
    this.createInterface()
    this.initMeteors()
    this.start()
  }

  private onClose?: () => void

  private initMeteors() {
    this.meteors = []
    for (let i = 0; i < 12; i++) {
      this.meteors.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight * 0.6),
        length: 40 + Math.random() * 80,
        speed: 400 + Math.random() * 500,
        alpha: 0.3 + Math.random() * 0.6,
      })
    }
  }

  private createInterface() {
    const root = document.createElement('div')
    root.id = 'cpu-dash-root'

    root.innerHTML = `
      <style>
        #cpu-dash-root {
          position: fixed;
          inset: 0;
          z-index: 100000;
          background: #07101f;
          color: #fff;
          font-family: Inter, system-ui, sans-serif;
          overflow: hidden;
          user-select: none;
        }

        #cpu-dash-root * { box-sizing: border-box; }
        #cpu-dash-root [hidden] { display: none !important; }

        .cpu-level-intro {
          position: absolute;
          inset: 0;
          z-index: 4;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
          pointer-events: none;
          background: linear-gradient(180deg, #020817b8, transparent 65%);
          animation: cpu-intro-in .35s ease-out;
        }
        .cpu-level-intro-card {
          padding: 22px 32px;
          border: 1px solid #ffffff55;
          border-radius: 18px;
          background: #09162be8;
          box-shadow: 0 0 38px #43e7ff30;
        }
        .cpu-level-intro-kicker {
          color: #9fb7d8;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .cpu-level-intro-title {
          font-size: clamp(24px, 4vw, 42px);
          font-weight: 950;
          line-height: 1.2;
          color: #fff;
          text-shadow: 0 0 22px #43e7ff55;
        }
        .cpu-level-intro-subtitle {
          margin-top: 10px;
          color: #c6d7f2;
          font-size: 14px;
        }
        @keyframes cpu-intro-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        #cpu-dash-root canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          touch-action: manipulation;
        }

        .cpu-hud {
          position: absolute;
          inset: 0 0 auto;
          z-index: 2;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 26px;
          pointer-events: none;
        }

        .cpu-logo {
          font-size: clamp(22px, 3.5vw, 34px);
          font-weight: 1000;
          letter-spacing: 2px;
          color: #fff;
          text-shadow: 0 0 20px #43e7ff88;
        }

        .cpu-logo span { color: #43e7ff; }

        .cpu-level {
          margin-top: 6px;
          color: #b9cce9;
          font-size: 15px;
          font-weight: 600;
        }

        .cpu-progress-wrap {
          width: min(42vw, 340px);
          padding-top: 4px;
          text-align: right;
        }

        .cpu-progress-label {
          margin-bottom: 8px;
          color: #eaf2ff;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 0.5px;
          text-shadow: 0 2px 10px #0008;
        }

        .cpu-progress {
          height: 14px;
          overflow: hidden;
          border: 1.5px solid #ffffff50;
          border-radius: 20px;
          background: #ffffff18;
          box-shadow: 0 2px 12px #0006;
        }

        .cpu-progress > div {
          height: 100%;
          width: 0;
          border-radius: inherit;
          background: linear-gradient(90deg, #43e7ff, #a5fffa);
          box-shadow: 0 0 16px #43e7ff;
          transition: width .08s linear;
        }

        .cpu-hint {
          position: absolute;
          bottom: 20px;
          left: 50%;
          z-index: 2;
          transform: translateX(-50%);
          color: #c8d7ef;
          font-size: 13px;
          white-space: nowrap;
          text-shadow: 0 2px 8px #000;
          pointer-events: none;
        }

        .cpu-exit {
          position: absolute;
          right: 20px;
          bottom: 18px;
          z-index: 3;
          padding: 9px 13px;
          color: #d9e6ff;
          background: #ffffff12;
          border: 1px solid #ffffff2a;
          border-radius: 10px;
          cursor: pointer;
        }

        #cpu-dash-root .cpu-modal[hidden] { display: none !important; }

        .cpu-modal {
          position: absolute;
          inset: 0;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: #030817c9;
          backdrop-filter: blur(9px);
        }

        .cpu-card {
          width: min(570px, 100%);
          padding: clamp(22px, 5vw, 38px);
          border: 1px solid #43e7ff75;
          border-radius: 22px;
          background:
            radial-gradient(ellipse at top right, #234b7888, transparent 60%),
            linear-gradient(145deg, #152440, #0a1224);
          box-shadow: 0 0 65px #43e7ff1c, 0 22px 70px #0008;
          text-align: center;
          animation: cpu-card-in .22s ease-out;
        }

        @keyframes cpu-card-in {
          from { opacity: 0; transform: translateY(12px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .cpu-card-icon { font-size: 42px; margin-bottom: 10px; }

        .cpu-card h2 {
          margin: 0 0 12px;
          font-size: clamp(23px, 4vw, 31px);
          line-height: 1.25;
        }

        .cpu-card p {
          margin: 0 0 22px;
          color: #c2d3ec;
          line-height: 1.65;
        }

        .cpu-answer {
          display: block;
          width: 100%;
          padding: 15px 16px;
          color: #fff;
          border: 1px solid #6887ad;
          border-radius: 12px;
          outline: none;
          background: #061126;
          font-size: 17px;
          text-align: center;
        }

        .cpu-answer:focus {
          border-color: #43e7ff;
          box-shadow: 0 0 0 3px #43e7ff22;
        }

        .cpu-submit {
          width: 100%;
          margin-top: 12px;
          padding: 14px;
          border: 0;
          border-radius: 12px;
          color: #04101e;
          background: linear-gradient(90deg, #43e7ff, #9bfff0);
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .cpu-submit:hover { filter: brightness(1.08); }

        .cpu-feedback {
          min-height: 25px;
          margin-top: 13px;
          color: #ffb3b3;
          font-size: 14px;
        }

        .cpu-small {
          margin-top: 16px;
          color: #8199bb;
          font-size: 12px;
        }

        @media (max-width: 560px) {
          .cpu-hud { padding: 15px; }
          .cpu-progress-wrap { width: min(50vw, 220px); }
          .cpu-progress-label { font-size: 13px; }
          .cpu-progress { height: 10px; }
          .cpu-hint { bottom: 68px; font-size: 11px; }
          .cpu-exit { right: 12px; bottom: 12px; }
        }
      </style>

      <canvas aria-label="CPU Dash თამაში"></canvas>

      <div class="cpu-hud">
        <div>
          <div class="cpu-logo">CPU <span>DASH</span></div>
          <div class="cpu-level"></div>
        </div>
        <div class="cpu-progress-wrap">
          <div class="cpu-progress-label"></div>
          <div class="cpu-progress"><div></div></div>
        </div>
      </div>

      <div class="cpu-hint">
        SPACE / ↑ / W / ეკრანზე დაჭერა — ხტომა
      </div>

      <button class="cpu-exit" type="button">✕ გასვლა (Esc)</button>
      <div class="cpu-level-intro" hidden>
        <div class="cpu-level-intro-card">
          <div class="cpu-level-intro-kicker">CPU DASH</div>
          <div class="cpu-level-intro-title"></div>
          <div class="cpu-level-intro-subtitle">მოემზადე! SPACE / ↑ / W — ხტომა</div>
        </div>
      </div>
      <div class="cpu-modal" hidden></div>
    `

    document.body.appendChild(root)
    this.root = root
    this.canvas = root.querySelector('canvas')!
    this.ctx = this.canvas.getContext('2d')!

    this.root.querySelector('.cpu-exit')!
      .addEventListener('click', () => this.close())

    this.root.addEventListener('pointerdown', this.pointerHandler)
    window.addEventListener('keydown', this.keyHandler, true)
    window.addEventListener('resize', this.resizeHandler)

    this.resize()
  }

  private resize() {
    if (!this.canvas || !this.root) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = window.innerWidth
    const height = window.innerHeight

    this.canvas.width = Math.floor(width * dpr)
    this.canvas.height = Math.floor(height * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  private start() {
    this.levelIndex = 0
    this.distance = 0
    this.score = 0
    this.lastQuestion = -1
    this.currentQuestionIndex = -1
    this.tipShownFor = -1
    this.answeredQuestionIndices.clear()
    this.running = true
    this.questionOpen = false
    this.resetLevel()
    this.lastTime = performance.now()
    this.frame = requestAnimationFrame(this.loop)
  }

  private resetLevel() {
    this.obstacles = []
    this.distance = 0
    this.scroll = 0
    this.playerY = 0
    this.velocityY = 0
    this.grounded = true
    this.jumpQueued = false
    this.flash = 0
    this.shake = 0
    this.finishSpawned = false

    const level = LEVELS[this.levelIndex]
    const speedRatio = level.speed / LEVELS[0].speed
    this.currentGravity = 1900 * speedRatio
    this.currentJumpPower = 690 * Math.sqrt(speedRatio)

    this.nextObstacleX = this.playerX() + (200 / 0.18)
    this.updateHUD()
    this.showLevelIntro()
  }

  private showLevelIntro() {
    const intro = this.root.querySelector('.cpu-level-intro') as HTMLDivElement | null
    if (!intro) return
    const level = LEVELS[this.levelIndex]
    const title = intro.querySelector('.cpu-level-intro-title') as HTMLDivElement
    const subtitle = intro.querySelector('.cpu-level-intro-subtitle') as HTMLDivElement
    title.textContent = level.name.replace(' — ', ' - ')

    // ახალი მექანიკის აღწერა მხოლოდ ეტაპის პირველ დაწყებაზე ჩანს
    const showTip = !!level.tip && this.tipShownFor !== this.levelIndex
    subtitle.textContent = showTip ? level.tip : 'მოემზადე! SPACE / ↑ / W — ხტომა'
    if (showTip) this.tipShownFor = this.levelIndex

    intro.hidden = false
    this.levelIntroUntil = performance.now() + (showTip ? 2200 : 1100)
    this.levelFade = 1
  }

  private updateHUD() {
    const level = LEVELS[this.levelIndex]
    this.root.querySelector('.cpu-level')!.textContent = level.name

    const shown = Math.min(Math.floor(this.distance), LEVEL_LENGTH)
    const label = this.root.querySelector('.cpu-progress-label')!
    label.textContent = `ეტაპი ${this.levelIndex + 1}/${LEVELS.length} · ${shown} მ / ${LEVEL_LENGTH} მ`

    const progress = Math.min(this.distance / LEVEL_LENGTH, 1) * 100
    ;(this.root.querySelector('.cpu-progress > div') as HTMLDivElement)
      .style.width = `${progress}%`
  }

  private readonly loop = (now: number) => {
    if (this.disposed) return

    this.frame = requestAnimationFrame(this.loop)

    const delta = Math.min((now - this.lastTime) / 1000, 0.035)
    this.lastTime = now

    this.updateAmbient(delta)

    if (this.running && !this.questionOpen && now >= this.levelIntroUntil) {
      const intro = this.root.querySelector('.cpu-level-intro') as HTMLDivElement | null
      if (intro && !intro.hidden) intro.hidden = true
      this.update(delta)
    }

    this.draw()
  }

  // ფონის ანიმაცია — მუშაობს კითხვის ფანჯრის დროსაც
  private updateAmbient(delta: number) {
    this.time += delta
    if (this.levelFade > 0) this.levelFade = Math.max(0, this.levelFade - delta * 1.6)
    if (this.shake > 0) this.shake = Math.max(0, this.shake - delta)

    const ground = this.groundY()
    for (const meteor of this.meteors) {
      meteor.x -= meteor.speed * delta
      meteor.y += meteor.speed * 0.45 * delta
      if (meteor.x < -100 || meteor.y > ground) {
        meteor.x = window.innerWidth + Math.random() * 200
        meteor.y = Math.random() * (window.innerHeight * 0.5)
      }
    }
  }

  // ფინიშის გამოჩენის მომენტი ისე, რომ მოთამაშე ფინიშს ზუსტად LEVEL_LENGTH მეტრზე შეხვდეს
  private finishSpawnDistance() {
    const travel = window.innerWidth + 180 - (this.playerX() + this.playerSize / 2)
    return LEVEL_LENGTH - travel * 0.18
  }

  private update(delta: number) {
    const level = LEVELS[this.levelIndex]
    const ground = this.groundY()

    this.distance += level.speed * delta * 0.18
    this.scroll += level.speed * delta

    if (!this.finishSpawned && this.distance >= this.finishSpawnDistance()) {
      this.finishSpawned = true
      this.obstacles.push({
        x: window.innerWidth + 180,
        width: 60,
        height: 180,
        kind: 'finish',
      })
    }

    if (this.jumpQueued && this.grounded) {
      this.velocityY = -this.currentJumpPower
      this.grounded = false
    }
    this.jumpQueued = false

    this.velocityY += this.currentGravity * delta
    this.playerY += this.velocityY * delta

    if (this.playerY >= 0) {
      this.playerY = 0
      this.velocityY = 0
      this.grounded = true
    }

    const playerX = this.playerX()

    if (this.grounded && this.playerY < 0) {
      const supported = this.obstacles.some(obstacle =>
        (obstacle.kind === 'bridge' || obstacle.kind === 'super_bridge') &&
        playerX + this.playerSize > obstacle.x &&
        playerX < obstacle.x + obstacle.width &&
        Math.abs(this.playerY + obstacle.height) < 5
      )
      if (!supported) this.grounded = false
    }

    this.nextObstacleX -= level.speed * delta

    // ფინიშთან ახლოს ახალი დაბრკოლებები აღარ ჩნდება
    if (
      !this.finishSpawned &&
      this.distance < this.finishSpawnDistance() - 100 &&
      this.nextObstacleX < window.innerWidth + 80
    ) {
      this.spawnObstacle()
    }

    for (const obstacle of this.obstacles) {
      obstacle.x -= (level.speed + (obstacle.vx || 0)) * delta

      if (obstacle.bobAmp) {
        obstacle.yOffset =
          (obstacle.baseOffset || 0) +
          Math.sin(this.time * (obstacle.bobSpeed || 2) + (obstacle.bobPhase || 0)) * obstacle.bobAmp
      }

      if (obstacle.kind === 'drop' && (obstacle.dropY || 0) > 0 && obstacle.x < (obstacle.triggerX || 0)) {
        obstacle.dropY = Math.max(0, (obstacle.dropY || 0) - DROP_SPEED * delta)
        if (obstacle.dropY === 0 && !obstacle.impact) {
          obstacle.impact = true
          this.shake = 0.22
        }
      }

      const px1 = playerX + 5
      const px2 = playerX + this.playerSize - 5

      if (obstacle.kind === 'finish') {
        if (obstacle.x <= playerX + this.playerSize / 2) {
          this.finishLevel()
          return
        }
        continue
      }

      const ox1 = obstacle.x
      const ox2 = obstacle.x + obstacle.width

      if (obstacle.kind === 'bridge' || obstacle.kind === 'super_bridge') {
        const platformTop = ground - obstacle.height
        const playerBottom = ground + this.playerY
        const overlapsBridge = px1 < ox2 && px2 > ox1

        if (
          overlapsBridge &&
          this.velocityY > 0 &&
          playerBottom >= platformTop &&
          playerBottom - this.velocityY * delta <= platformTop + 14
        ) {
          this.playerY = -obstacle.height

          if (obstacle.kind === 'super_bridge') {
            this.velocityY = -this.currentJumpPower * 1.4
            this.grounded = false
            this.shake = 0.12
          } else {
            this.velocityY = 0
            this.grounded = true
          }
        }
        continue
      }

      const yOffset = (obstacle.yOffset || 0) + (obstacle.dropY || 0)
      const obstacleY = ground - obstacle.height - yOffset
      const playerScreenYNow = ground - this.playerSize + this.playerY
      const py1 = playerScreenYNow + 5
      const py2 = playerScreenYNow + this.playerSize - 3
      const oy1 = obstacleY + (obstacle.kind === 'spike' ? 8 : 0)
      const oy2 = ground - yOffset

      if (px1 < ox2 && px2 > ox1 && py1 < oy2 && py2 > oy1) {
        this.fail()
        return
      }

      if (!obstacle.passed && obstacle.x + obstacle.width < playerX) {
        obstacle.passed = true
        this.score++
      }
    }

    this.obstacles = this.obstacles.filter(
      obstacle => obstacle.x + obstacle.width > -120,
    )

    if (this.flash > 0) this.flash -= delta
    this.updateHUD()
  }

  // ---------- დაბრკოლებების ნაკრებები (chunks) ----------
  // ყოველი ნაკრები ისეა აგებული, რომ ერთი ან ორი ხტომით აუცილებლად გადალახვადი იყოს

  private buildChunk(
    kind: ChunkKind,
    x: number,
    level: LevelConfig,
  ): { length: number; extraGap: number } {
    const f = level.features
    const speed = level.speed
    const ground = this.groundY()
    const pX = this.playerX()

    switch (kind) {
      case 'pad': {
        this.obstacles.push({ x, width: 150, height: 70, kind: 'super_bridge' })
        return { length: 150, extraGap: 0 }
      }

      case 'padWall': {
        // სუპერ-ხტომის პლატფორმა + ძალიან მაღალი ბარიერი — მხოლოდ სუპერ-ხტომით გადადიხარ
        this.obstacles.push({ x, width: 150, height: 70, kind: 'super_bridge' })
        this.obstacles.push({
          x: x + 150 + 110,
          width: 40,
          height: 190 + Math.random() * 25,
          kind: 'wall',
        })
        return { length: 150 + 110 + 40, extraGap: speed * 0.8 }
      }

      case 'bridge': {
        const bridgeWidth = 210
        const bridgeHeight = 82
        this.obstacles.push({ x, width: bridgeWidth, height: bridgeHeight, kind: 'bridge' })
        let length = bridgeWidth

        if (f.bridgeHazard) {
          if (Math.random() < 0.55) {
            this.obstacles.push({
              x: x + 85,
              width: 32,
              height: 38,
              kind: 'spike',
              yOffset: bridgeHeight,
            })
          } else {
            this.obstacles.push({
              x: x + bridgeWidth + 40,
              width: 28,
              height: 60,
              kind: 'electric',
            })
            length = bridgeWidth + 40 + 28
          }
        }
        return { length, extraGap: 0 }
      }

      case 'bridgeWall': {
        // ხიდი + მაღალი ბარიერი — ხიდზე ასვლა და იქიდან გადახტომა
        this.obstacles.push({ x, width: 210, height: 82, kind: 'bridge' })
        this.obstacles.push({
          x: x + 210 + 30,
          width: 36,
          height: 135 + Math.random() * 25,
          kind: 'wall',
        })
        return { length: 210 + 30 + 36, extraGap: speed * 0.5 }
      }

      case 'drone': {
        // დრონი ჰაერში: ქვემოდან გადის, ან ზემოდან გადახტება
        const base = 62 + Math.random() * 10
        const drone: Obstacle = {
          x,
          width: 46,
          height: 30,
          kind: 'drone',
          yOffset: base,
        }
        if (f.bob) {
          drone.baseOffset = base
          drone.bobAmp = 10
          drone.bobSpeed = 2.2 + Math.random()
          drone.bobPhase = Math.random() * Math.PI * 2
        }
        this.obstacles.push(drone)
        let length = 46

        if (Math.random() < f.droneCombo) {
          // დრონის შემდეგ მიწის ეკალი — გადახტომა მხოლოდ დრონის გავლის შემდეგ შეიძლება
          const comboGap = Math.max(speed * 0.3, 160)
          this.obstacles.push({ x: x + 46 + comboGap, width: 38, height: 42, kind: 'spike' })
          length = 46 + comboGap + 38
        }
        return { length, extraGap: length > 46 ? speed * 0.15 : 0 }
      }

      case 'drop': {
        // ბლოკი ეკრანის შუაში ზემოდან ჩამოვარდება და მიწაზე დაბრკოლებად დარჩება
        const width = 44
        const height = 46
        const startUp = ground + 90
        const fallTime = startUp / DROP_SPEED
        const trigger = pX + this.playerSize + speed * fallTime + 200

        if (x > trigger + 20) {
          this.obstacles.push({
            x,
            width,
            height,
            kind: 'drop',
            dropY: startUp,
            triggerX: trigger,
          })
        } else {
          // ვიწრო ეკრანზე ჩამოვარდნისთვის ადგილი არ არის — ჩვეულებრივი ბლოკი
          this.obstacles.push({ x, width, height, kind: 'block' })
        }
        return { length: width, extraGap: 0 }
      }

      case 'saw': {
        // ხერხი ჩვეულებრივზე უფრო სწრაფად მოდის; დაწევას წინასწარ ვაკომპენსირებთ
        const vx = 110 + Math.random() * 80 + Math.max(0, LEVELS.indexOf(level) - 5) * 10
        const t = Math.max(0, (x - pX) / (speed + vx))
        const catchUp = vx * t
        this.obstacles.push({ x: x + catchUp, width: 46, height: 46, kind: 'saw', vx })
        return { length: catchUp + 46, extraGap: speed * 0.12 }
      }

      case 'triple': {
        const w = 34
        const spacing = 22
        for (let i = 0; i < 3; i++) {
          this.obstacles.push({ x: x + i * (w + spacing), width: w, height: 42, kind: 'spike' })
        }
        return { length: w * 3 + spacing * 2, extraGap: speed * 0.12 }
      }

      default: {
        const kinds: ObstacleKind[] = ['spike', 'block', 'electric', 'data']
        const k = kinds[Math.floor(Math.random() * kinds.length)]

        let width = 34
        let height = 42

        if (k === 'spike') {
          width = 38
          height = 42
        } else if (k === 'block') {
          width = 38
          height = 42 + Math.random() * 22
        } else if (k === 'electric') {
          width = 25
          height = 62
        } else {
          width = 48
          height = 52
        }

        this.obstacles.push({ x, width, height, kind: k })
        let length = width

        if (Math.random() < f.double) {
          const secondWidth = 34
          const gapBetween = 35
          this.obstacles.push({
            x: x + width + gapBetween,
            width: secondWidth,
            height: 40,
            kind: 'spike',
          })
          length = width + gapBetween + secondWidth
        }
        return { length, extraGap: 0 }
      }
    }
  }

  private spawnObstacle() {
    const level = LEVELS[this.levelIndex]
    const f = level.features
    const spawnX = this.nextObstacleX

    let kind: ChunkKind = 'plain'
    const roll = Math.random()
    let acc = 0
    const hit = (p: number) => {
      acc += p
      return roll < acc
    }

    if (hit(f.superBridge)) {
      kind = f.wall > 0 && Math.random() < 0.55 ? 'padWall' : 'pad'
    } else if (hit(f.bridge)) {
      kind = 'bridge'
    } else if (hit(f.wall)) {
      kind = 'bridgeWall'
    } else if (hit(f.drone)) {
      kind = 'drone'
    } else if (hit(f.drop)) {
      kind = 'drop'
    } else if (hit(f.saw)) {
      kind = 'saw'
    } else {
      if (Math.random() > level.obstacleChance) {
        this.nextObstacleX = spawnX + 110
        return
      }
      kind = f.triple > 0 && Math.random() < f.triple ? 'triple' : 'plain'
    }

    const x = spawnX + (CHUNK_LEAD[kind] || 0) * level.speed
    const { length, extraGap } = this.buildChunk(kind, x, level)
    const gap = level.gapMin + Math.random() * (level.gapMax - level.gapMin)
    this.nextObstacleX = x + length + gap + extraGap
  }

  private playerX() {
    return Math.max(75, Math.min(150, window.innerWidth * 0.17))
  }

  private groundY() {
    return window.innerHeight * 0.78
  }

  private draw() {
    const ctx = this.ctx
    const width = window.innerWidth
    const height = window.innerHeight
    const level = LEVELS[this.levelIndex] ?? LEVELS[0]
    const ground = this.groundY()

    ctx.clearRect(0, 0, width, height)

    ctx.save()
    if (this.shake > 0) {
      const s = Math.min(this.shake * 36, 8)
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s)
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, level.sky[0])
    gradient.addColorStop(0.6, level.sky[1])
    gradient.addColorStop(1, level.sky[2])
    ctx.fillStyle = gradient
    ctx.fillRect(-20, -20, width + 40, height + 40)

    // თემატური დინამიური ფონი
    this.drawBackground(level, width, ground)

    for (const meteor of this.meteors) {
      ctx.save()
      ctx.globalAlpha = meteor.alpha
      const mGrad = ctx.createLinearGradient(
        meteor.x,
        meteor.y,
        meteor.x + meteor.length,
        meteor.y - meteor.length * 0.45
      )
      mGrad.addColorStop(0, level.color)
      mGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.strokeStyle = mGrad
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(meteor.x, meteor.y)
      ctx.lineTo(meteor.x + meteor.length, meteor.y - meteor.length * 0.45)
      ctx.stroke()
      ctx.restore()
    }

    if (level.theme !== 'server' && level.theme !== 'tunnel') {
      ctx.globalAlpha = 0.45
      for (let i = 0; i < 55; i++) {
        const x = (i * 137 + this.scroll * 0.18 * (6 + (i % 3))) % width
        const y = (i * 73) % Math.max(1, ground - 60)
        ctx.fillStyle = i % 2 === 0 ? level.color : '#ffffff'
        ctx.fillRect(width - x, y, i % 4 === 0 ? 3 : 1.5, i % 4 === 0 ? 3 : 1.5)
      }
      ctx.globalAlpha = 1
    }

    this.drawSpeedLines(level, width, ground)

    // მიწა
    ctx.fillStyle = '#050c18'
    ctx.fillRect(0, ground, width, height - ground)

    // პერსპექტივიანი ბადე მიწაზე (ახლა ჩანს და მოძრაობს)
    ctx.strokeStyle = `${level.color}44`
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = -mod(this.scroll * 0.5, 48); x < width + 100; x += 48) {
      ctx.moveTo(x, ground)
      ctx.lineTo(x - 90, height)
    }
    for (let k = 1; k < 5; k++) {
      const y = ground + (height - ground) * (k / 5) * (k / 5) * 1.2
      if (y < height) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
    }
    ctx.stroke()

    ctx.strokeStyle = level.color
    ctx.lineWidth = 3
    ctx.shadowColor = level.color
    ctx.shadowBlur = 16
    ctx.beginPath()
    ctx.moveTo(0, ground)
    ctx.lineTo(width, ground)
    ctx.stroke()
    ctx.shadowBlur = 0

    for (const obstacle of this.obstacles) {
      this.drawObstacle(obstacle, ground, level.color)
    }

    this.drawCPU(
      this.playerX(),
      ground - this.playerSize + this.playerY,
      this.playerSize,
      level.color,
    )

    ctx.restore()

    if (this.levelFade > 0) {
      ctx.fillStyle = rgba(level.color, this.levelFade * 0.35)
      ctx.fillRect(0, 0, width, height)
    }

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,50,70,${Math.min(this.flash * 2, 0.3)})`
      ctx.fillRect(0, 0, width, height)
    }
  }

  private drawSpeedLines(level: LevelConfig, W: number, G: number) {
    const ctx = this.ctx
    const strong = level.speed > 520
    ctx.save()
    ctx.lineWidth = 1.5
    for (let i = 0; i < 16; i++) {
      const sp = 1.4 + hash(i) * 1.6
      const x = W - mod(this.scroll * sp + i * 97, W + 240) + 60
      const y = 30 + hash(i + 40) * (G - 60)
      const len = 50 + hash(i + 80) * 110
      ctx.strokeStyle = rgba(level.color, strong ? 0.16 : 0.09)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + len, y)
      ctx.stroke()
    }
    ctx.restore()
  }

  private drawBackground(level: LevelConfig, W: number, G: number) {
    switch (level.theme) {
      case 'chip':
        this.bgChip(level, W, G)
        break
      case 'data':
        this.bgData(level, W, G)
        break
      case 'core':
        this.bgCore(level, W, G)
        break
      case 'city':
        this.bgCity(level, W, G)
        break
      case 'virus':
        this.bgVirus(level, W, G)
        break
      case 'ocean':
        this.bgOcean(level, W, G)
        break
      case 'tunnel':
        this.bgTunnel(level, W, G)
        break
      case 'server':
        this.bgServer(level, W, G)
        break
      case 'storm':
        this.bgStorm(level, W, G)
        break
    }
  }

  // ეტაპი 1: ჩიპების ქალაქი სიგნალის ბილიკებით
  private bgChip(level: LevelConfig, W: number, G: number) {
    const ctx = this.ctx
    const t = this.time

    ctx.save()
    ctx.strokeStyle = rgba(level.color, 0.07)
    ctx.lineWidth = 1
    ctx.beginPath()
    const cell = 64
    for (let x = -mod(this.scroll * 0.12, cell); x < W; x += cell) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, G)
    }
    for (let y = 0; y < G; y += cell) {
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
    }
    ctx.stroke()
    ctx.restore()

    ctx.globalAlpha = 0.08
    for (let i = 0; i < 5; i++) {
      const beamX = ((i * 280) + this.scroll * 0.36) % (W + 200) - 100
      const beamGrad = ctx.createLinearGradient(beamX, 0, beamX + 80, 0)
      beamGrad.addColorStop(0, 'rgba(0,0,0,0)')
      beamGrad.addColorStop(0.5, level.accent)
      beamGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = beamGrad
      ctx.fillRect(beamX, 0, 80, G)
    }
    ctx.globalAlpha = 1

    const count = Math.ceil(W / 330) + 3
    for (let i = 0; i < count; i++) {
      const { x, id } = slot(i, 330, this.scroll * 0.28, count)
      const w = 140 + hash(id) * 90
      const h = 70 + hash(id + 1) * 70
      const y = G - h - 26 - hash(id + 2) * 30

      ctx.fillStyle = '#0a1a36'
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = rgba(level.color, 0.4)
      ctx.lineWidth = 1.5
      ctx.strokeRect(x, y, w, h)

      ctx.fillStyle = rgba(level.color, 0.35)
      for (let px = x + 10; px < x + w - 6; px += 14) {
        ctx.fillRect(px, y - 6, 4, 6)
        ctx.fillRect(px, y + h, 4, 6)
      }

      const pulse = 0.5 + 0.5 * Math.sin(t * 2 + id)
      ctx.fillStyle = rgba(level.color, 0.08 + 0.14 * pulse)
      ctx.fillRect(x + w * 0.25, y + h * 0.25, w * 0.5, h * 0.5)

      ctx.strokeStyle = rgba(level.color, 0.3)
      ctx.beginPath()
      ctx.moveTo(x + w / 2, y + h + 6)
      ctx.lineTo(x + w / 2, G)
      ctx.stroke()
      const dotY = y + h + 6 + mod(t * 60 + id * 20, Math.max(1, G - y - h - 6))
      ctx.fillStyle = rgba('#ffffff', 0.7)
      ctx.fillRect(x + w / 2 - 2, dotY, 4, 4)
    }
  }

  // ეტაპი 2: ორობითი წვიმა და მონაცემთა ნაკადები
  private bgData(level: LevelConfig, W: number, G: number) {
    const ctx = this.ctx
    const t = this.time

    ctx.save()
    ctx.font = '14px ui-monospace, Menlo, monospace'
    const colW = 34
    const cols = Math.ceil(W / colW) + 1
    for (let c = 0; c < cols; c++) {
      const x = c * colW + 6 - mod(this.scroll * 0.05, colW)
      const sp = 40 + hash(c) * 90
      const head = mod(t * sp + hash(c + 50) * G * 2, G + 200) - 100
      for (let k = 0; k < 9; k++) {
        const y = head - k * 17
        if (y < 0 || y > G) continue
        ctx.fillStyle = k === 0 ? 'rgba(255,255,255,0.55)' : rgba(level.color, (1 - k / 9) * 0.35)
        ctx.fillText(hash(c * 31 + k + Math.floor(t * 3 + c)) > 0.5 ? '1' : '0', x, y)
      }
    }
    ctx.restore()

    ctx.save()
    ctx.lineWidth = 2
    for (let i = 0; i < 7; i++) {
      const y = G * (0.12 + i * 0.12)
      ctx.strokeStyle = rgba(level.accent, 0.2)
      ctx.setLineDash([28 + hash(i) * 30, 50 + hash(i + 9) * 60])
      ctx.lineDashOffset = this.scroll * (0.6 + hash(i + 3) * 0.8)
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
    ctx.restore()
  }

  private drawGear(cx: number, cy: number, r: number, teeth: number, rot: number, color: string, alpha: number) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)
    ctx.fillStyle = rgba(color, alpha)
    ctx.strokeStyle = rgba(color, alpha * 2)
    ctx.lineWidth = 2
    ctx.beginPath()
    const steps = teeth * 4
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2
      const rr = i % 4 < 2 ? r : r * 0.86
      const px = Math.cos(a) * rr
      const py = Math.sin(a) * rr
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.moveTo(r * 0.55, 0)
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2)
    ctx.fill('evenodd')
    ctx.stroke()
    ctx.restore()
  }

  // ეტაპი 3: პროცესორის გული — მბრუნავი მექანიზმები და სითბო
  private bgCore(level: LevelConfig, W: number, G: number) {
    const ctx = this.ctx
    const t = this.time
    const cx = W * 0.62
    const cy = G * 0.46
    const R = Math.max(80, Math.min(W, G) * 0.42)

    const pulse = 0.5 + 0.5 * Math.sin(t * 1.6)
    const glow = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.4)
    glow.addColorStop(0, rgba(level.color, 0.22 + 0.12 * pulse))
    glow.addColorStop(1, rgba(level.color, 0))
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, G)

    ctx.save()
    this.drawGear(cx, cy, R, 18, t * 0.25, level.color, 0.12)
    this.drawGear(cx - R * 0.95, cy + R * 0.6, R * 0.45, 10, -t * 0.5 + 0.2, level.accent, 0.12)
    ctx.restore()

    for (let i = 0; i < 4; i++) {
      const y = G * (0.22 + i * 0.18) + Math.sin(t * 0.8 + i) * 10
      const g = ctx.createLinearGradient(0, y - 30, 0, y + 30)
      g.addColorStop(0, rgba(level.accent, 0))
      g.addColorStop(0.5, rgba(level.accent, 0.07))
      g.addColorStop(1, rgba(level.accent, 0))
      ctx.fillStyle = g
      ctx.fillRect(0, y - 30, W, 60)
    }

    for (let i = 0; i < 28; i++) {
      const x = mod(hash(i) * W - this.scroll * 0.35 + Math.sin(t + i) * 12, W)
      const y = G - mod(t * (30 + hash(i + 3) * 40) + hash(i + 7) * G, G)
      ctx.fillStyle = rgba('#ffcf7a', 0.2 + 0.4 * hash(i + 11))
      ctx.beginPath()
      ctx.arc(x, y, 1.2 + hash(i + 5) * 1.6, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // ეტაპი 4: ქსელის ქალაქი — ცათამბჯენები და მოძრავი პაკეტები
  private bgCity(level: LevelConfig, W: number, G: number) {
    const ctx = this.ctx
    const t = this.time

    const horizon = ctx.createLinearGradient(0, G * 0.4, 0, G)
    horizon.addColorStop(0, rgba(level.accent, 0))
    horizon.addColorStop(1, rgba(level.accent, 0.2))
    ctx.fillStyle = horizon
    ctx.fillRect(0, G * 0.4, W, G * 0.6)

    // შორეული ფენა
    {
      const gap = 62
      const count = Math.ceil(W / gap) + 4
      for (let i = 0; i < count; i++) {
        const { x, id } = slot(i, gap, this.scroll * 0.1, count)
        const h = 70 + hash(id) * 130
        ctx.fillStyle = '#0a2442'
        ctx.fillRect(x, G - h, gap - 6, h)
      }
    }

    // ახლო ფენა ციმციმა ფანჯრებით
    const gap = 96
    const count = Math.ceil(W / gap) + 4
    const roofs: { x: number; y: number; id: number }[] = []
    for (let i = 0; i < count; i++) {
      const { x, id } = slot(i, gap, this.scroll * 0.3, count)
      const bw = gap - 10
      const bh = 110 + hash(id + 5) * 190
      const top = G - bh
      ctx.fillStyle = '#0c3358'
      ctx.fillRect(x, top, bw, bh)
      ctx.strokeStyle = rgba(level.color, 0.25)
      ctx.lineWidth = 1
      ctx.strokeRect(x, top, bw, bh)

      for (let r = 0; r < Math.floor(bh / 18); r++) {
        for (let c = 0; c < 4; c++) {
          const lit = hash(id * 13 + r * 7 + c) > 0.55
          if (!lit) continue
          const blink = 0.5 + 0.5 * Math.sin(t * (0.6 + hash(id + r)) + r + c)
          ctx.fillStyle = rgba(level.color, 0.2 + 0.5 * blink)
          ctx.fillRect(x + 8 + c * 19, top + 10 + r * 18, 9, 9)
        }
      }

      roofs.push({ x: x + bw / 2, y: top, id })
      if (hash(id + 9) > 0.5) {
        ctx.fillStyle = Math.sin(t * 3 + id) > 0 ? '#ff4d4d' : '#550000'
        ctx.fillRect(x + bw / 2 - 2, top - 14, 4, 4)
        ctx.fillRect(x + bw / 2 - 1, top - 10, 2, 10)
      }
    }

    roofs.sort((a, b) => a.x - b.x)
    ctx.lineWidth = 1.5
    for (let i = 0; i + 1 < roofs.length; i++) {
      const a = roofs[i]
      const b = roofs[i + 1]
      const mx = (a.x + b.x) / 2
      const my = Math.min(a.y, b.y) - 40
      ctx.strokeStyle = rgba(level.color, 0.22)
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.quadraticCurveTo(mx, my, b.x, b.y)
      ctx.stroke()
      const p = mod(t * 0.5 + hash(a.id), 1)
      const px = (1 - p) * (1 - p) * a.x + 2 * (1 - p) * p * mx + p * p * b.x
      const py = (1 - p) * (1 - p) * a.y + 2 * (1 - p) * p * my + p * p * b.y
      ctx.fillStyle = rgba('#ffffff', 0.85)
      ctx.beginPath()
      ctx.arc(px, py, 2.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // ეტაპი 5: ვირუსის ზონა — მცურავი ვირუსები და გლიჩები
  private bgVirus(level: LevelConfig, W: number, G: number) {
    const ctx = this.ctx
    const t = this.time

    const count = Math.ceil(W / 220) + 3
    for (let i = 0; i < count; i++) {
      const { x, id } = slot(i, 220, this.scroll * 0.15, count)
      const r = 18 + hash(id) * 26
      const y = G * (0.15 + 0.55 * hash(id + 3)) + Math.sin(t * 0.8 + id) * 22
      const spin = t * (0.4 + hash(id + 8)) + id

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(spin)
      ctx.strokeStyle = rgba(level.color, 0.3)
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2
        ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
        ctx.lineTo(Math.cos(a) * (r + 9), Math.sin(a) * (r + 9))
      }
      ctx.stroke()
      const body = ctx.createRadialGradient(0, 0, 2, 0, 0, r)
      body.addColorStop(0, rgba(level.accent, 0.45))
      body.addColorStop(1, rgba(level.color, 0.18))
      ctx.fillStyle = body
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // გლიჩი დროდადრო
    const glitch = Math.sin(t * 2.3) + Math.sin(t * 5.1) > 1.55
    if (glitch) {
      for (let k = 0; k < 4; k++) {
        const gy = hash(Math.floor(t * 20) + k) * G
        const gw = W * (0.2 + hash(k + 7) * 0.5)
        const gx = hash(Math.floor(t * 20) + k + 3) * (W - gw)
        ctx.fillStyle = rgba(k % 2 ? level.accent : level.color, 0.14)
        ctx.fillRect(gx, gy, gw, 4 + hash(k) * 10)
      }
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let y = 0; y < G; y += 5) {
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
    }
    ctx.stroke()
  }

  // ეტაპი 6: მეხსიერების ოკეანე — RAM-ის სვეტები და ტალღები
  private bgOcean(level: LevelConfig, W: number, G: number) {
    const ctx = this.ctx
    const t = this.time

    const sun = ctx.createRadialGradient(W * 0.78, G * 0.28, 10, W * 0.78, G * 0.28, 260)
    sun.addColorStop(0, rgba(level.accent, 0.3))
    sun.addColorStop(1, rgba(level.accent, 0))
    ctx.fillStyle = sun
    ctx.fillRect(0, 0, W, G)

    const waterline = G * 0.78
    const count = Math.ceil(W / 230) + 3
    for (let i = 0; i < count; i++) {
      const { x, id } = slot(i, 230, this.scroll * 0.2, count)
      const h = 120 + hash(id) * 140
      ctx.fillStyle = '#0a2a45'
      ctx.fillRect(x, waterline - h, 34, h)
      ctx.strokeStyle = rgba(level.color, 0.35)
      ctx.lineWidth = 1.5
      ctx.strokeRect(x, waterline - h, 34, h)
      ctx.fillStyle = '#05121f'
      for (let c = 0; c < 3; c++) ctx.fillRect(x + 6, waterline - h + 14 + c * 38, 22, 24)
      ctx.fillStyle = rgba(level.accent, 0.5 + 0.4 * Math.sin(t * 2 + id))
      ctx.fillRect(x + 14, waterline - h - 6, 6, 6)
    }

    const fills = [rgba(level.accent, 0.16), rgba(level.color, 0.18), 'rgba(11,58,102,0.5)']
    for (let k = 0; k < 3; k++) {
      const base = G * (0.74 + k * 0.07)
      const amp = 6 + k * 3
      ctx.fillStyle = fills[k]
      ctx.beginPath()
      ctx.moveTo(0, G)
      for (let x = 0; x <= W + 14; x += 14) {
        const y = base + Math.sin((x + this.scroll * (0.35 + k * 0.2)) * 0.012 + t * (0.9 + k * 0.3)) * amp
        ctx.lineTo(x, y)
      }
      ctx.lineTo(W + 14, G)
      ctx.closePath()
      ctx.fill()
    }

    for (let i = 0; i < 22; i++) {
      const x = mod(hash(i) * W - this.scroll * 0.3, W)
      const y = G - mod(t * (20 + hash(i + 2) * 30) + hash(i + 5) * G, G * 0.5)
      ctx.strokeStyle = rgba('#ffffff', 0.25)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y, 2 + hash(i + 8) * 3, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  // ეტაპი 7: კვანტური გვირაბი — პერსპექტივაში მოფრინავი რგოლები
  private bgTunnel(level: LevelConfig, W: number, G: number) {
    const ctx = this.ctx
    const t = this.time
    const vx = W * 0.68
    const vy = G * 0.45
    const maxR = Math.max(W, G) * 1.1

    const core = ctx.createRadialGradient(vx, vy, 4, vx, vy, maxR * 0.5)
    core.addColorStop(0, rgba(level.accent, 0.4))
    core.addColorStop(1, rgba(level.accent, 0))
    ctx.fillStyle = core
    ctx.fillRect(0, 0, W, G)

    ctx.strokeStyle = rgba(level.color, 0.1)
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8 + t * 0.05
      ctx.moveTo(vx, vy)
      ctx.lineTo(vx + Math.cos(a) * maxR * 1.5, vy + Math.sin(a) * maxR * 1.5)
    }
    ctx.stroke()

    for (let k = 0; k < 12; k++) {
      const z = mod(k / 12 + t * 0.22, 1)
      const r = 20 + z * z * maxR
      ctx.save()
      ctx.translate(vx, vy)
      ctx.rotate(t * 0.3 + k * 0.28)
      ctx.strokeStyle = rgba(k % 2 ? level.color : level.accent, 0.08 + z * 0.5)
      ctx.lineWidth = 1 + z * 3
      ctx.strokeRect(-r, -r, r * 2, r * 2)
      ctx.restore()
    }
  }

  // ეტაპი 8: სერვერების ბნელი ოთახი — თაროები, ნათურები, ნისლი
  private bgServer(level: LevelConfig, W: number, G: number) {
    const ctx = this.ctx
    const t = this.time
    const ledColors = ['#39ff7a', level.color, '#ff4d4d']

    const layer = (par: number, gap: number, alpha: number) => {
      const count = Math.ceil(W / gap) + 3
      for (let i = 0; i < count; i++) {
        const { x, id } = slot(i, gap, this.scroll * par, count)
        const h = G * 0.55 + hash(id) * G * 0.25
        const y = G - h
        const w = gap - 24
        ctx.fillStyle = `rgba(18, 13, 6, ${0.55 + alpha * 0.45})`
        ctx.fillRect(x, y, w, h)
        ctx.strokeStyle = rgba(level.color, 0.25 * alpha + 0.05)
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, w, h)
        for (let r = 0; r < Math.floor(h / 14); r++) {
          const on = Math.sin(t * (1 + hash(id + r)) * 2 + r + id) > -0.2
          if (!on) continue
          ctx.fillStyle = rgba(ledColors[Math.floor(hash(id * 7 + r) * 3)], 0.3 + 0.6 * alpha)
          ctx.fillRect(x + 8, y + 8 + r * 14, 4, 4)
          ctx.fillRect(x + 16, y + 8 + r * 14, 18, 2)
        }
      }
    }
    layer(0.12, 150, 0.35)
    layer(0.28, 170, 1)

    ctx.strokeStyle = rgba(level.color, 0.2)
    ctx.lineWidth = 2
    for (let k = 0; k < 3; k++) {
      const off = mod(this.scroll * 0.3 + k * 300, W + 300) - 150
      ctx.beginPath()
      ctx.moveTo(W - off, 0)
      ctx.quadraticCurveTo(W - off - 120, 90 + k * 25, W - off - 240, 0)
      ctx.stroke()
    }

    for (let i = 0; i < 2; i++) {
      const fx = mod(t * 20 * (i + 1) + i * 500, W + 600) - 300
      const g = ctx.createLinearGradient(fx, 0, fx + 600, 0)
      g.addColorStop(0, rgba(level.accent, 0))
      g.addColorStop(0.5, rgba(level.accent, 0.07))
      g.addColorStop(1, rgba(level.accent, 0))
      ctx.fillStyle = g
      ctx.fillRect(fx, G * (0.55 + i * 0.2), 600, 80)
    }

    const flick = hash(Math.floor(t * 12)) > 0.15 ? 0.5 : 0.1
    ctx.fillStyle = rgba('#ffffff', flick * 0.5)
    for (let i = 0; i < 4; i++) ctx.fillRect(W * (0.1 + i * 0.25), 0, W * 0.12, 5)
  }

  // ეტაპი 9: ციფრული ქარიშხალი — ღრუბლები, ელვა, წვიმა
  private bgStorm(level: LevelConfig, W: number, G: number) {
    const ctx = this.ctx
    const t = this.time

    for (let l = 0; l < 2; l++) {
      const gap = 260
      const count = Math.ceil(W / gap) + 3
      for (let i = 0; i < count; i++) {
        const { x, id } = slot(i, gap, this.scroll * (0.08 + 0.1 * l), count)
        const y = 30 + l * 60 + hash(id + l * 17) * 50
        const w = 150 + hash(id + 2) * 90
        ctx.fillStyle = l ? 'rgba(26, 26, 58, 0.75)' : 'rgba(18, 18, 42, 0.6)'
        ctx.beginPath()
        ctx.ellipse(x + w / 2, y, w, 34 + hash(id + 5) * 20, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const cycle = 3.2
    const ph = t % cycle
    const idx = Math.floor(t / cycle)
    if (ph < 0.28) {
      const a = ph < 0.08 ? 1 : ph < 0.14 ? 0.2 : ph < 0.2 ? 0.8 : 0.2
      ctx.fillStyle = `rgba(207, 233, 255, ${a * 0.18})`
      ctx.fillRect(0, 0, W, G)

      ctx.save()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.shadowColor = level.color
      ctx.shadowBlur = 20
      ctx.beginPath()
      let bx = W * (0.2 + hash(idx) * 0.7)
      let by = 0
      ctx.moveTo(bx, by)
      for (let s = 0; s < 9; s++) {
        bx += (hash(idx * 13 + s) - 0.5) * 90
        by += (G * 0.8) / 9
        ctx.lineTo(bx, by)
      }
      ctx.stroke()
      ctx.restore()
    }

    ctx.strokeStyle = rgba('#9bd7ff', 0.22)
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < 80; i++) {
      const x = mod(hash(i) * W - this.scroll * 0.5 - t * 120 * hash(i + 4), W + 100)
      const y = mod(hash(i + 9) * G + t * (700 + hash(i + 2) * 400), G)
      ctx.moveTo(x, y)
      ctx.lineTo(x - 6, y + 16)
    }
    ctx.stroke()
  }

  private drawCPU(x: number, y: number, size: number, glow: string) {
    const ctx = this.ctx
    const bob = this.grounded ? Math.sin(performance.now() / 85) * 1.3 : 0
    const top = y + bob

    ctx.save()
    ctx.shadowColor = glow
    ctx.shadowBlur = 22

    const gradient = ctx.createLinearGradient(x, top, x + size, top + size)
    gradient.addColorStop(0, '#f7ffff')
    gradient.addColorStop(0.45, '#7fefff')
    gradient.addColorStop(1, '#2688d7')

    ctx.fillStyle = gradient
    ctx.fillRect(x, top, size, size)

    ctx.shadowBlur = 0
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(x + 3, top + 3, size - 6, size - 6)

    ctx.strokeStyle = '#a9faff'
    ctx.lineWidth = 3
    for (let i = 0; i < 4; i++) {
      const offset = 7 + i * 8
      ctx.beginPath()
      ctx.moveTo(x + offset, top - 4)
      ctx.lineTo(x + offset, top)
      ctx.moveTo(x + offset, top + size)
      ctx.lineTo(x + offset, top + size + 4)
      ctx.stroke()
    }

    ctx.fillStyle = '#08203a'
    ctx.fillRect(x + 7, top + 8, size - 14, size - 16)
    ctx.fillStyle = '#b9fffb'
    ctx.fillRect(x + 11, top + 13, 5, 5)
    ctx.fillRect(x + size - 16, top + 13, 5, 5)
    ctx.fillStyle = '#43e7ff'
    ctx.fillRect(x + 12, top + 24, size - 24, 3)

    ctx.restore()
  }

  private drawObstacle(obstacle: Obstacle, ground: number, glow: string) {
    const ctx = this.ctx
    const x = obstacle.x
    const yOffset = (obstacle.yOffset || 0) + (obstacle.dropY || 0)
    const baseGround = ground - yOffset
    const y = baseGround - obstacle.height

    ctx.save()

    if (obstacle.kind === 'finish') {
      ctx.shadowColor = '#00ffcc'
      ctx.shadowBlur = 25

      ctx.fillStyle = '#00ffcc'
      ctx.fillRect(x, ground - 180, 10, 180)
      ctx.fillRect(x + 50, ground - 180, 10, 180)

      ctx.fillRect(x, ground - 180, 60, 20)

      ctx.fillStyle = '#051329'
      ctx.fillRect(x + 4, ground - 176, 52, 12)

      ctx.fillStyle = '#00ffcc'
      ctx.font = '900 10px monospace'
      ctx.fillText('FINISH', x + 8, ground - 167)

      ctx.shadowBlur = 0
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#000000'
          ctx.fillRect(x + 5 + c * 10, ground - 155 + r * 10, 10, 10)
        }
      }
      ctx.restore()
      return
    }

    ctx.shadowColor = obstacle.kind === 'electric' ? '#ff4fd8' : glow
    ctx.shadowBlur = 14

    if (obstacle.kind === 'bridge') {
      const top = ground - obstacle.height
      ctx.fillStyle = '#172c50'
      ctx.fillRect(x, top, obstacle.width, 12)
      ctx.fillStyle = '#43e7ff'
      ctx.fillRect(x, top, obstacle.width, 4)
      ctx.strokeStyle = '#b5faff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x + 12, top + 12)
      ctx.lineTo(x + 28, ground)
      ctx.moveTo(x + obstacle.width - 12, top + 12)
      ctx.lineTo(x + obstacle.width - 28, ground)
      ctx.stroke()
      for (let bx = x + 14; bx < x + obstacle.width - 8; bx += 28) {
        ctx.fillStyle = '#6a8ab7'
        ctx.fillRect(bx, top + 5, 3, 7)
      }
    } else if (obstacle.kind === 'super_bridge') {
      const top = ground - obstacle.height
      ctx.fillStyle = '#ffaa00'
      ctx.fillRect(x, top, obstacle.width, 14)
      ctx.fillStyle = '#ffffa0'
      ctx.fillRect(x, top, obstacle.width, 4)
      ctx.shadowColor = '#ffaa00'
      ctx.shadowBlur = 18
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px monospace'
      ctx.fillText('⚡ SUPER JUMP ⚡', x + 18, top - 6)
    } else if (obstacle.kind === 'wall') {
      // მაღალი ბარიერი (firewall)
      const g = ctx.createLinearGradient(x, y, x + obstacle.width, y)
      g.addColorStop(0, '#ff3b3b')
      g.addColorStop(1, '#a01030')
      ctx.fillStyle = g
      ctx.fillRect(x, y, obstacle.width, obstacle.height)
      ctx.shadowBlur = 0
      ctx.strokeStyle = 'rgba(255, 230, 120, 0.55)'
      ctx.lineWidth = 4
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, obstacle.width, obstacle.height)
      ctx.clip()
      ctx.beginPath()
      for (let sy = y - obstacle.width; sy < y + obstacle.height; sy += 22) {
        ctx.moveTo(x, sy + obstacle.width)
        ctx.lineTo(x + obstacle.width, sy)
      }
      ctx.stroke()
      ctx.restore()
      ctx.fillStyle = '#ffe9a8'
      ctx.fillRect(x - 2, y - 4, obstacle.width + 4, 6)
    } else if (obstacle.kind === 'drone') {
      // დრონი ჰაერში
      const cx = x + obstacle.width / 2
      const cy = y + obstacle.height / 2
      ctx.fillStyle = '#2b3550'
      ctx.beginPath()
      ctx.ellipse(cx, cy + 2, obstacle.width / 2, obstacle.height / 2 - 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#8ea4d6'
      ctx.lineWidth = 2
      ctx.stroke()
      const blink = 0.5 + 0.5 * Math.sin(this.time * 8 + x)
      ctx.fillStyle = `rgba(255, 70, 90, ${0.5 + 0.5 * blink})`
      ctx.beginPath()
      ctx.arc(cx, cy + 2, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = '#c9d6f5'
      ctx.lineWidth = 3
      const spin = Math.sin(this.time * 40) * (obstacle.width / 2)
      ctx.beginPath()
      ctx.moveTo(cx - spin, y - 2)
      ctx.lineTo(cx + spin, y - 2)
      ctx.moveTo(cx, y - 2)
      ctx.lineTo(cx, y + 4)
      ctx.stroke()
    } else if (obstacle.kind === 'saw') {
      // მბრუნავი ხერხი
      const cx = x + obstacle.width / 2
      const cy = y + obstacle.height / 2
      const r = obstacle.width / 2
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(-this.time * 12)
      ctx.fillStyle = '#d9e2f2'
      ctx.beginPath()
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2
        const rr = i % 2 ? r : r * 0.78
        const px = Math.cos(a) * rr
        const py = Math.sin(a) * rr
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#ff4d6d'
      ctx.beginPath()
      ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    } else if (obstacle.kind === 'drop') {
      const falling = (obstacle.dropY || 0) > 0
      if (falling) {
        // გაფრთხილება: წითელი სვეტი და ნიშანი დაცემის ადგილას
        const wx = x + obstacle.width / 2
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 14)
        ctx.shadowBlur = 0
        ctx.strokeStyle = `rgba(255, 70, 90, ${0.2 + 0.3 * pulse})`
        ctx.lineWidth = 2
        ctx.setLineDash([10, 8])
        ctx.beginPath()
        ctx.moveTo(wx, 0)
        ctx.lineTo(wx, ground)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = `rgba(255, 70, 90, ${0.5 + 0.5 * pulse})`
        ctx.font = '900 20px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('!', wx, ground - 10)
        ctx.textAlign = 'start'
        ctx.shadowColor = '#ff7a3d'
        ctx.shadowBlur = 24
      }
      ctx.fillStyle = '#5a3a2a'
      ctx.fillRect(x, y, obstacle.width, obstacle.height)
      ctx.strokeStyle = '#ff9a5a'
      ctx.lineWidth = 2
      ctx.strokeRect(x + 3, y + 3, obstacle.width - 6, obstacle.height - 6)
      ctx.fillStyle = '#ffb066'
      ctx.fillRect(x + 10, y + 10, 8, 8)
      ctx.fillRect(x + obstacle.width - 18, y + 22, 8, 8)
      if (falling) {
        ctx.fillStyle = 'rgba(255, 140, 60, 0.45)'
        ctx.fillRect(x + 6, y - 40, obstacle.width - 12, 40)
      }
    } else if (obstacle.kind === 'spike') {
      ctx.fillStyle = '#ff5477'
      ctx.beginPath()
      ctx.moveTo(x, baseGround)
      ctx.lineTo(x + obstacle.width / 2, y)
      ctx.lineTo(x + obstacle.width, baseGround)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#ffd3de'
      ctx.lineWidth = 2
      ctx.stroke()
    } else if (obstacle.kind === 'block') {
      ctx.fillStyle = '#f04d72'
      ctx.fillRect(x, y, obstacle.width, obstacle.height)
      ctx.strokeStyle = '#ffc0d0'
      ctx.lineWidth = 2
      ctx.strokeRect(x + 4, y + 4, obstacle.width - 8, obstacle.height - 8)
      ctx.fillStyle = '#591c48'
      ctx.fillRect(x + 10, y + 11, 5, 5)
      ctx.fillRect(x + 22, y + 11, 5, 5)
    } else if (obstacle.kind === 'electric') {
      ctx.fillStyle = '#ff4fd8'
      ctx.fillRect(x, y, obstacle.width, obstacle.height)
      ctx.strokeStyle = '#ffe7ff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x + obstacle.width / 2, y + 5)
      ctx.lineTo(x + 5, y + 27)
      ctx.lineTo(x + obstacle.width - 4, y + 34)
      ctx.lineTo(x + obstacle.width / 2, y + obstacle.height - 5)
      ctx.stroke()
    } else {
      ctx.fillStyle = '#7e69ff'
      ctx.fillRect(x, y, obstacle.width, obstacle.height)
      ctx.strokeStyle = '#c5bcff'
      ctx.lineWidth = 2
      ctx.strokeRect(x + 4, y + 4, obstacle.width - 8, obstacle.height - 8)
      ctx.fillStyle = '#e8e2ff'
      ctx.font = 'bold 14px monospace'
      ctx.fillText('01', x + 7, y + 20)
      ctx.fillText('10', x + 7, y + 38)
    }

    ctx.restore()
  }

  private finishLevel() {
    this.running = false
    this.questionOpen = true

    if (this.levelIndex >= LEVELS.length - 1) {
      this.showVictory()
      return
    }

    this.showQuestion()
  }

  private showQuestion() {
    const questionIndex = this.pickQuestion()
    this.currentQuestionIndex = questionIndex
    const question = QUESTION_BANK[questionIndex]
    const modal = this.root.querySelector('.cpu-modal') as HTMLDivElement

    modal.hidden = false
    modal.innerHTML = `
      <div class="cpu-card">
        <div class="cpu-card-icon">🧠</div>
        <h2>ციფრული ცოდნის შემოწმება</h2>
        <p>${question.prompt}</p>
        <form>
          <input
            class="cpu-answer"
            type="text"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            aria-label="შეიყვანე პასუხი"
            placeholder="ჩაწერე პასუხი..."
            required
          />
          <button class="cpu-submit" type="submit">პასუხის შემოწმება →</button>
          <div class="cpu-feedback" aria-live="polite"></div>
        </form>
        <div class="cpu-small">პასუხი თავად აკრიფე — ვარიანტები არ არის.</div>
      </div>
    `

    const form = modal.querySelector('form')!
    const input = modal.querySelector('input')!
    const feedback = modal.querySelector('.cpu-feedback')!

    form.addEventListener('submit', event => {
      event.preventDefault()
      const answer = this.normalize(input.value)

      if (!answer) {
        feedback.textContent = 'პასუხი ჯერ ჩაწერე.'
        input.focus()
        return
      }

      const correct = this.isCorrect(question, answer)

      if (!correct) {
        feedback.textContent = 'პასუხი არასწორია. გამოწვევა თავიდან იწყება…'
        input.disabled = true
        ;(form.querySelector('button') as HTMLButtonElement).disabled = true

        window.setTimeout(() => {
          if (this.disposed) return
          modal.hidden = true
          this.resetLevel()
          this.questionOpen = false
          this.running = true
          this.lastTime = performance.now()
        }, 1100)
        return
      }

      this.answeredQuestionIndices.add(this.currentQuestionIndex)
      modal.hidden = true
      this.levelIndex++
      this.resetLevel()
      this.questionOpen = false
      this.running = true
      this.lastTime = performance.now()
    })

    window.setTimeout(() => input.focus(), 50)
  }

  private showVictory() {
    const modal = this.root.querySelector('.cpu-modal') as HTMLDivElement
    modal.hidden = false
    modal.innerHTML = `
      <div class="cpu-card">
        <div class="cpu-card-icon">🏆</div>
        <h2>CPU Dash დასრულებულია!</h2>
        <p>
          ყველა ${LEVELS.length} ეტაპი გაიარე და ციფრული ცოდნაც დაამტკიცე.
          შესანიშნავი შედეგია!
        </p>
        <button class="cpu-submit" type="button">სამეფოში დაბრუნება</button>
        <div class="cpu-small">გადალახული დაბრკოლებები: ${this.score}</div>
      </div>
    `

    modal.querySelector('button')!.addEventListener('click', () => this.close())
  }

  private pickQuestion() {
    const available = QUESTION_BANK
      .map((_, index) => index)
      .filter(index => !this.answeredQuestionIndices.has(index))

    const pool = available.length > 0
      ? available
      : QUESTION_BANK.map((_, index) => index)

    let candidates = pool.filter(index => index !== this.lastQuestion)
    if (candidates.length === 0) candidates = pool

    const index = candidates[Math.floor(Math.random() * candidates.length)]
    this.lastQuestion = index
    return index
  }

  private isCorrect(question: Question, answer: string) {
    const expected = question.answers.map(a => this.normalize(a))
    if (expected.includes(answer)) return true
    if (!question.anyOf) return false

    // რამდენიმე სწორი პასუხიდან ნებისმიერი ან რამდენიმე ერთად ("სინტაქსური და ლოგიკური")
    const filler = new Set(['და', 'შეცდომა', 'შეცდომები'])
    const tokens = answer.split(' ').filter(tk => tk && !filler.has(tk))
    return tokens.length > 0 && tokens.every(tk => expected.includes(tk))
  }

  private normalize(value: string) {
    return value
      .trim()
      .toLocaleLowerCase('ka-GE')
      .replace(/[.,!?;:'"“”‘’()[\]{}]/g, '')
      .replace(/\s+/g, ' ')
  }

  private fail() {
    this.flash = 0.18
    this.running = false
    this.questionOpen = true

    const modal = this.root.querySelector('.cpu-modal') as HTMLDivElement
    modal.hidden = false
    modal.innerHTML = `
      <div class="cpu-card">
        <div class="cpu-card-icon">💥</div>
        <h2>შეჯახება!</h2>
        <p>CPU დაბრკოლებას შეეჯახა. სცადე თავიდან!</p>
        <button class="cpu-submit" type="button">თავიდან დაწყება ↻</button>
      </div>
    `

    modal.querySelector('button')!.addEventListener('click', () => {
      modal.hidden = true
      this.resetLevel()
      this.questionOpen = false
      this.running = true
      this.lastTime = performance.now()
    })
  }

  private close() {
    if (this.disposed) return

    this.disposed = true
    this.running = false
    cancelAnimationFrame(this.frame)

    window.removeEventListener('keydown', this.keyHandler, true)
    window.removeEventListener('resize', this.resizeHandler)
    this.root.removeEventListener('pointerdown', this.pointerHandler)

    this.root.remove()
    this.onClose?.()
  }
}