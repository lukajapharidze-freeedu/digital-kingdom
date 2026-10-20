export type CPUDashOptions = {
  onClose?: () => void
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
  | 'pit'

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

// რაკეტის ეტაპის დაბრკოლებები (კოორდინატები გვირაბის ცენტრის მიმართ)
type RocketObstacle = {
  kind: 'gate' | 'spike' | 'hole'
  /** სამყაროს x (მარცხენა კიდე; ხვრელისთვის — ცენტრი) */
  wx: number
  width: number
  gapOffset?: number // gate: ხვრელის ცენტრი გვირაბის ცენტრიდან
  gapH?: number // gate: ხვრელის სიმაღლე
  height?: number // spike
  fromTop?: boolean // spike: ჭერიდან ეშვება თუ იატაკიდან ადის
  r?: number // hole: რადიუსი
  offset?: number // hole: ცენტრის გადახრა გვირაბის ცენტრიდან
  /** სად უნდა გაიაროს რაკეტამ (გვირაბის ცენტრიდან გადახრა) — გამოიყენება დაშორებისთვის და ტესტებში */
  passY: number
  passed?: boolean
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
  | 'padHigh'
  | 'padWall'
  | 'bridge'
  | 'bridgeWall'
  | 'drone'
  | 'drop'
  | 'saw'
  | 'pit'
  | 'pitBridge'

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
  pit: number // ორმო მიწაზე: ჩავარდნა = წაგება
  pitBridge: number // ფართო ორმო ხიდით
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
  /** 'rocket' — გმირი რაკეტაზეა და კედლებს შორის დაფრინავს */
  mode?: 'run' | 'rocket'
  sky: [string, string, string]
  tip: string
  features: Features
}

// ერთი ეტაპის სიგრძე მეტრებში
// ეტაპის სიგრძე მეტრებში: პირველი 2000 მ, ყოველ შემდეგს +150 მ; მე-9 ეტაპის შემდეგ აღარ იზრდება
const LEVEL_LENGTH_BASE = 2000
const LEVEL_LENGTH_STEP = 150
const LEVEL_LENGTH_MAX_STAGE = 9

function levelLengthFor(levelIndex: number): number {
  const stage = Math.min(levelIndex + 1, LEVEL_LENGTH_MAX_STAGE)
  return LEVEL_LENGTH_BASE + (stage - 1) * LEVEL_LENGTH_STEP
}
// ვიზუალური მასშტაბი: გმირი და დაბრკოლებები უფრო დიდად ჩანს (თამაშის სიჩქარე და მანძილები არ იცვლება)
const ZOOM = 1.3
const TAU = Math.PI * 2

// ნათება (shadowBlur) ძალიან მძიმეა სუსტ კომპიუტერებზე. true-ზე დააყენე, თუ ლამაზი ნათება გინდა.
const GLOW = false
const fxBlur = (n: number): number => (GLOW ? n : 0)

// რაკეტის ეტაპი (მე-7): ფიზიკა და ზომები
const ROCKET = {
  climb: 260, // ასვლის სიჩქარე, როცა ღილაკი დაჭერილია
  fall: 240, // ჩასვლის სიჩქარე, როცა ღილაკი გაშვებულია
  response: 8, // რამდენად სწრაფად ცვლის გმირი სიჩქარეს (მეტი = უფრო მკვეთრი მართვა)
  top: 41, // რაკეტის ცენტრიდან ზევით (გმირითურთ)
  bottom: 17, // ცენტრიდან ქვევით (ფრთებით)
  width: 58,
}

// რთული ნაკრებების წინ დამატებითი დრო (წამებში) — წინა დაბრკოლების გადალახვის შემდეგ მოსამზადებლად
const CHUNK_LEAD: Partial<Record<ChunkKind, number>> = {
  bridge: 0.2,
  bridgeWall: 0.25,
  padHigh: 0.2,
  padWall: 0.25,
  drop: 0.1,
  saw: 0.25,
  drone: 0.12,
  triple: 0.08,
  pit: 0.15,
  pitBridge: 0.15,
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
  pit: 0,
  pitBridge: 0,
}

const LEVELS: LevelConfig[] = [
  {
    name: 'ეტაპი 1 — ჩიპის ველი',
    speed: 380,
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
    speed: 450,
    gapMin: 255,
    gapMax: 320,
    obstacleChance: 0.85,
    color: '#ff4fd8',
    background: '#1d0833',
    accent: '#ff0844',
    theme: 'data',
    sky: ['#1d0833', '#080816', '#02040a'],
    tip: '',
    features: {
      ...NO_FEATURES,
      bridge: 0.22,
    },
  },
  {
    name: 'ეტაპი 3 — პროცესორის ბირთვი',
    speed: 540,
    gapMin: 235,
    gapMax: 295,
    obstacleChance: 0.95,
    color: '#ffb83f',
    background: '#2b0a12',
    accent: '#f77062',
    theme: 'core',
    sky: ['#2b0a12', '#080816', '#02040a'],
    tip: '',
    features: {
      ...NO_FEATURES,
      superBridge: 0.1,
      bridge: 0.14,
      double: 0.28,
      pit: 0.12,
    },
  },
  {
    name: 'ეტაპი 4 — ქსელის ქალაქი',
    speed: 575,
    gapMin: 225,
    gapMax: 275,
    obstacleChance: 1,
    color: '#5ef2c3',
    background: '#06203a',
    accent: '#3d9bff',
    theme: 'city',
    sky: ['#06203a', '#0a1130', '#02040a'],
    tip: 'ახალი: მაღალი ბარიერები და დრონები — გადახტი ხიდიდან ან სუპერ-ხტომის პლატფორმიდან',
    features: {
      ...NO_FEATURES,
      superBridge: 0.1,
      bridge: 0.12,
      bridgeHazard: true,
      wall: 0.1,
      drone: 0.1,
      droneCombo: 0.5,
      double: 0.3,
      pit: 0.08,
      pitBridge: 0.08,
    },
  },
  {
    name: 'ეტაპი 5 — ვირუსის ზონა',
    speed: 605,
    gapMin: 222,
    gapMax: 268,
    obstacleChance: 1,
    color: '#8dff4f',
    background: '#1a0a1f',
    accent: '#ff2d55',
    theme: 'virus',
    sky: ['#1a0a1f', '#14081a', '#04010a'],
    tip: 'ახალი: ცაზე ჩამოვარდნილი ბლოკები და სამმაგი ეკლები',
    features: {
      ...NO_FEATURES,
      superBridge: 0.1,
      bridge: 0.1,
      bridgeHazard: true,
      wall: 0.1,
      drone: 0.1,
      droneCombo: 0.55,
      drop: 0.1,
      double: 0.3,
      triple: 0.12,
      pit: 0.08,
      pitBridge: 0.08,
    },
  },
  {
    name: 'ეტაპი 6 — მეხსიერების ოკეანე',
    speed: 635,
    gapMin: 225,
    gapMax: 265,
    obstacleChance: 1,
    color: '#4fc3ff',
    background: '#031b3a',
    accent: '#00e0c6',
    theme: 'ocean',
    sky: ['#031b3a', '#061a38', '#01050d'],
    tip: 'ახალი: მოძრავი ხერხები და ტივტივა დრონები',
    features: {
      ...NO_FEATURES,
      superBridge: 0.09,
      bridge: 0.09,
      bridgeHazard: true,
      wall: 0.1,
      drone: 0.1,
      droneCombo: 0.6,
      bob: true,
      drop: 0.09,
      saw: 0.1,
      double: 0.32,
      triple: 0.14,
      pit: 0.08,
      pitBridge: 0.08,
    },
  },
  {
    name: 'ეტაპი 7 — რაკეტა კვანტურ გვირაბში',
    speed: 665,
    gapMin: 245,
    gapMax: 340,
    obstacleChance: 0.94,
    color: '#b06bff',
    background: '#12062e',
    accent: '#ff6bd6',
    theme: 'tunnel',
    mode: 'rocket',
    sky: ['#12062e', '#0a0420', '#02010a'],
    tip: 'ახალი: რაკეტა! დაჭერა — ზემოთ, გაშვება — ქვემოთ. გაძვერი ხვრელებში, მოერიდე ეკლებს და შავ ხვრელებს, კედლებს არ შეეხო!',
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
      pit: 0.08,
      pitBridge: 0.12,
    },
  },
  {
    name: 'ეტაპი 8 — სერვერების ბნელი ოთახი',
    speed: 695,
    gapMin: 236,
    gapMax: 270,
    obstacleChance: 1,
    color: '#ffd34f',
    background: '#1d1405',
    accent: '#ff7a3d',
    theme: 'server',
    sky: ['#1d1405', '#120c05', '#050302'],
    tip: 'ყველა სახის დაბრკოლება ერთად — არ დაიძინო!',
    features: {
      ...NO_FEATURES,
      superBridge: 0.09,
      bridge: 0.09,
      bridgeHazard: true,
      wall: 0.1,
      drone: 0.1,
      droneCombo: 0.65,
      bob: true,
      drop: 0.1,
      saw: 0.1,
      double: 0.35,
      triple: 0.16,
      pit: 0.07,
      pitBridge: 0.09,
    },
  },
  {
    name: 'ეტაპი 9 — ციფრული ქარიშხალი',
    speed: 730,
    gapMin: 250,
    gapMax: 280,
    obstacleChance: 1,
    color: '#7df9ff',
    background: '#0b0b1f',
    accent: '#ffeb3b',
    theme: 'storm',
    sky: ['#0b0b1f', '#070714', '#010103'],
    tip: 'ფინალი! ქარიშხალი, ელვა და ყველაზე სწრაფი ტემპი',
    features: {
      ...NO_FEATURES,
      superBridge: 0.09,
      bridge: 0.08,
      bridgeHazard: true,
      wall: 0.1,
      drone: 0.1,
      droneCombo: 0.7,
      bob: true,
      drop: 0.1,
      saw: 0.11,
      double: 0.36,
      triple: 0.18,
      pit: 0.07,
      pitBridge: 0.1,
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
  private jumpHeld = false
  private flipAngle = 0
  private flipRate = 0
  private rocketY = 0
  private rocketVY = 0
  private rocketGrace = 0
  private levelTime = 0
  private skyGradient: CanvasGradient | null = null
  private skyKey = ''
  private rocketObs: RocketObstacle[] = []
  private nextRocketWx = 0
  private lastRocketPass = 0
  private modalOpen = false
  private fallingIntoPit = false
  private fallTimer = 0
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
      if (!this.modalOpen && this.running) {
        this.jumpQueued = true
        this.jumpHeld = true
      }
    }
  }

  // ღილაკის გაშვება: გმირი ხტომას წყვეტს (დაჭერილ ღილაკზე განუწყვეტლად ხტება)
  private readonly keyUpHandler = (event: KeyboardEvent) => {
    if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
      this.jumpHeld = false
    }
  }

  private readonly releaseHandler = () => {
    this.jumpHeld = false
  }

  private readonly pointerHandler = (event: PointerEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('button, input')) return

    if (!this.modalOpen && this.running) {
      this.jumpQueued = true
      this.jumpHeld = true
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
        x: Math.random() * this.viewW(),
        y: Math.random() * (this.viewH() * 0.6),
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
    window.addEventListener('keyup', this.keyUpHandler, true)
    window.addEventListener('pointerup', this.releaseHandler)
    window.addEventListener('pointercancel', this.releaseHandler)
    window.addEventListener('blur', this.releaseHandler)
    window.addEventListener('resize', this.resizeHandler)

    this.resize()
  }

  private resize() {
    if (!this.canvas || !this.root) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
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
    this.tipShownFor = -1
    this.running = true
    this.modalOpen = false
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
    this.fallingIntoPit = false
    this.fallTimer = 0
    this.levelTime = 0
    this.flipAngle = 0

    const level = LEVELS[this.levelIndex]
    const speedRatio = level.speed / LEVELS[0].speed
    this.currentGravity = 1900 * speedRatio
    this.currentJumpPower = 690 * Math.sqrt(speedRatio)
    // ერთი სრული ფლიპი ერთ ჩვეულებრივ ხტომაზე
    this.flipRate = TAU / ((2 * this.currentJumpPower) / this.currentGravity)

    // რაკეტა იწყებს ეკრანის შუაში
    this.rocketY = this.viewH() * 0.5
    this.rocketVY = 0
    this.rocketGrace = 1.4
    this.rocketObs = []
    this.nextRocketWx = 1500
    this.lastRocketPass = this.viewH() * 0.5

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

    const length = levelLengthFor(this.levelIndex)
    const shown = Math.min(Math.floor(this.distance), length)
    const label = this.root.querySelector('.cpu-progress-label')!
    label.textContent = `ეტაპი ${this.levelIndex + 1}/${LEVELS.length} · ${shown} მ / ${length} მ`

    const progress = Math.min(this.distance / length, 1) * 100
    ;(this.root.querySelector('.cpu-progress > div') as HTMLDivElement)
      .style.width = `${progress}%`
  }

  private readonly loop = (now: number) => {
    if (this.disposed) return

    this.frame = requestAnimationFrame(this.loop)

    const delta = Math.min((now - this.lastTime) / 1000, 0.035)
    this.lastTime = now

    this.updateAmbient(delta)

    if (this.running && !this.modalOpen && now >= this.levelIntroUntil) {
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
        meteor.x = this.viewW() + Math.random() * 200
        meteor.y = Math.random() * (this.viewH() * 0.5)
      }
    }
  }

  // ფინიშის გამოჩენის მომენტი ისე, რომ მოთამაშე ფინიშს ზუსტად ეტაპის სიგრძეზე შეხვდეს
  private finishSpawnDistance() {
    const travel = this.viewW() + 180 - (this.playerX() + this.playerSize / 2)
    return levelLengthFor(this.levelIndex) - travel * 0.18
  }

  private update(delta: number) {
    const level = LEVELS[this.levelIndex]
    const ground = this.groundY()

    // ორმოში ჩავარდნა: გმირი ძირს ეშვება, შემდეგ წაგება
    if (this.fallingIntoPit) {
      this.velocityY += this.currentGravity * delta
      this.playerY += this.velocityY * delta
      this.fallTimer -= delta
      if (this.fallTimer <= 0) {
        this.fallingIntoPit = false
        this.fail()
      }
      return
    }

    this.distance += level.speed * delta * 0.18
    this.scroll += level.speed * delta

    if (!this.finishSpawned && this.distance >= this.finishSpawnDistance()) {
      this.finishSpawned = true
      this.obstacles.push({
        x: this.viewW() + 180,
        width: 60,
        height: 180,
        kind: 'finish',
      })
    }

    if (level.mode === 'rocket') {
      this.updateRocket(delta, level)
      return
    }

    if ((this.jumpQueued || this.jumpHeld) && this.grounded) {
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

    // ფრონტ ფლიპი: პირდაპირ ჰაერში ბრუნავს, დაშვებისას ბრუნვა ნელ-ნელა დგება
    if (!this.grounded) {
      this.flipAngle += this.flipRate * delta
    } else if (this.flipAngle !== 0) {
      const target = Math.round(this.flipAngle / TAU) * TAU
      this.flipAngle += (target - this.flipAngle) * Math.min(1, 18 * delta)
      if (Math.abs(target - this.flipAngle) < 0.02) this.flipAngle = 0
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
      this.nextObstacleX < this.viewW() + 80
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

      if (obstacle.kind === 'pit') {
        // ჩავარდნა: გმირის ცენტრი ორმოს თავზე და ის მიწის დონეზე (არ ხტება)
        const center = playerX + this.playerSize / 2
        if (this.playerY >= -1 && center > ox1 + 8 && center < ox2 - 8) {
          this.fallingIntoPit = true
          this.fallTimer = 0.4
          this.velocityY = 150
          this.shake = 0.12
          return
        }
        if (!obstacle.passed && ox2 < playerX) {
          obstacle.passed = true
          this.score++
        }
        continue
      }

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

  // ---------- რაკეტის ეტაპი ----------

  /** გვირაბი: ჭერისა და იატაკის სიმაღლე მოცემულ სამყაროს x-ზე. თავიდან ფართოა, ბოლოსკენ ვიწროვდება. */
  private corridor(worldX: number): { top: number; bottom: number } {
    const H = this.viewH()
    const t = Math.min(1, Math.max(0, worldX / 1400))
    const ramp = t * t * (3 - 2 * t)
    const center =
      H * 0.5 +
      ramp * (H * 0.1 * Math.sin(worldX * 0.0021) + H * 0.04 * Math.sin(worldX * 0.0047 + 1.3))
    const p = Math.min(1, Math.max(0, worldX / (levelLengthFor(this.levelIndex) / 0.18)))
    const half = Math.max(115, H * (0.33 - 0.09 * p))
    return {
      top: center - half + Math.sin(worldX * 0.031) * 5,
      bottom: center + half + Math.sin(worldX * 0.027 + 2) * 5,
    }
  }

  private updateRocket(delta: number, level: LevelConfig) {
    this.levelTime += delta
    const playerX = this.playerX()

    for (const obstacle of this.obstacles) {
      obstacle.x -= level.speed * delta
      if (obstacle.kind === 'finish' && obstacle.x <= playerX + this.playerSize / 2) {
        this.finishLevel()
        return
      }
    }

    // დაჭერა = ზემოთ, გაშვება = ქვემოთ (დასაწყისში მცირე ხნით ჰაერში ჩერდება)
    let targetV = this.jumpHeld ? -ROCKET.climb : ROCKET.fall
    if (this.rocketGrace > 0) {
      if (this.jumpHeld) {
        this.rocketGrace = 0
      } else {
        this.rocketGrace -= delta
        targetV = 0
        this.rocketVY = 0
      }
    }
    this.rocketVY += (targetV - this.rocketVY) * Math.min(1, ROCKET.response * delta)
    this.rocketY += this.rocketVY * delta

    // შეჯახება ჭერთან ან იატაკთან (წინა, შუა და უკანა წერტილში)
    for (const dx of [4, ROCKET.width / 2, ROCKET.width - 4]) {
      const c = this.corridor(this.scroll + playerX + dx)
      if (this.rocketY - ROCKET.top < c.top || this.rocketY + ROCKET.bottom > c.bottom) {
        this.fail()
        return
      }
    }

    // ახალი დაბრკოლებები (ფინიშთან ახლოს აღარ)
    const totalPx = levelLengthFor(this.levelIndex) / 0.18
    while (
      this.nextRocketWx < this.scroll + this.viewW() + 140 &&
      this.nextRocketWx < totalPx - 1100
    ) {
      this.spawnRocketObstacle(level, totalPx)
    }

    if (this.rocketObstacleHit(playerX)) {
      this.fail()
      return
    }

    for (const o of this.rocketObs) {
      if (!o.passed && o.wx - this.scroll + o.width < playerX) {
        o.passed = true
        this.score++
      }
    }
    this.rocketObs = this.rocketObs.filter(o => o.wx - this.scroll + o.width > -160)

    this.updateHUD()
  }

  /** რაკეტის შეჯახების მართკუთხედი (გმირითურთ, მცირე დათმობით) */
  private rocketRect(playerX: number) {
    return {
      x0: playerX + 6,
      x1: playerX + ROCKET.width - 4,
      y0: this.rocketY - ROCKET.top + 5,
      y1: this.rocketY + ROCKET.bottom - 3,
    }
  }

  private rocketObstacleHit(playerX: number): boolean {
    const r = this.rocketRect(playerX)

    for (const o of this.rocketObs) {
      const sx = o.wx - this.scroll
      if (sx > r.x1 + 4 || sx + o.width < r.x0 - 4) continue

      if (o.kind === 'gate') {
        if (sx > r.x1 || sx + o.width < r.x0) continue
        const c = this.corridor(o.wx)
        const gapCenter = (c.top + c.bottom) / 2 + (o.gapOffset ?? 0)
        const half = (o.gapH ?? 150) / 2
        if (r.y0 < gapCenter - half || r.y1 > gapCenter + half) return true
      } else if (o.kind === 'spike') {
        const h = o.height ?? 80
        const cx = sx + o.width / 2
        const c = this.corridor(o.wx + o.width / 2)
        let depth: number
        if (o.fromTop) {
          if (r.y0 >= c.top + h) continue
          depth = Math.max(r.y0, c.top) - c.top
        } else {
          if (r.y1 <= c.bottom - h) continue
          depth = c.bottom - Math.min(r.y1, c.bottom)
        }
        const halfW = (o.width / 2) * (1 - depth / h)
        if (r.x1 > cx - halfW && r.x0 < cx + halfW) return true
      } else {
        const hr = o.r ?? 38
        const hx = sx + hr
        const c = this.corridor(o.wx + hr)
        const cy = (c.top + c.bottom) / 2 + (o.offset ?? 0)
        const radius = hr * 0.82
        const nx = Math.max(r.x0, Math.min(hx, r.x1))
        const ny = Math.max(r.y0, Math.min(cy, r.y1))
        if (Math.hypot(nx - hx, ny - cy) < radius) return true
      }
    }
    return false
  }

  /** ახალი დაბრკოლება: გასაძრომი (ჭიშკარი), ეკლები ჭერიდან/იატაკიდან ან შავი ხვრელი შუაში */
  private spawnRocketObstacle(level: LevelConfig, totalPx: number) {
    const wx = this.nextRocketWx
    const c = this.corridor(wx)
    const center = (c.top + c.bottom) / 2
    const gap = c.bottom - c.top
    const need = ROCKET.top + ROCKET.bottom
    const p = Math.min(1, wx / totalPx)
    const roll = Math.random()
    let obstacle: RocketObstacle | null = null

    if (roll >= 0.7) {
      // შავი ხვრელი შუაში: ორივე მხარეს არხი რჩება (ვიწრო გვირაბში მინიმუმ ერთ მხარეს)
      const r = 30 + Math.random() * 12
      const cc = this.corridor(wx + r)
      const hCenter = (cc.top + cc.bottom) / 2
      const hGap = cc.bottom - cc.top
      const channel = need + 92
      if (hGap >= channel + 2 * r + 30) {
        const lo = cc.top + channel + r // ყველაზე მაღალი ადგილი, სადაც ზემოთ არხი ჯერ კიდევ საკმარისია
        const hi = cc.bottom - channel - r // ყველაზე დაბალი ადგილი, სადაც ქვემოთ არხი საკმარისია
        let cy: number
        if (lo <= hi) {
          // ორივე არხი საკმარისია — ხვრელი შუა არეშია
          cy = hCenter + (Math.random() * 2 - 1) * Math.min(hi - hCenter, hCenter - lo)
        } else {
          cy = Math.random() < 0.5 ? lo : hi
        }
        const topChannel = cy - r - cc.top
        const bottomChannel = cc.bottom - (cy + r)
        const passAbs =
          topChannel >= bottomChannel ? (cc.top + (cy - r)) / 2 : (cy + r + cc.bottom) / 2
        obstacle = {
          kind: 'hole',
          wx,
          width: r * 2,
          r,
          offset: cy - hCenter,
          passY: passAbs - hCenter,
        }
      }
    } else if (roll >= 0.4) {
      // ეკალი ჭერიდან ან იატაკიდან
      const fromTop = Math.random() < 0.5
      const hMax = Math.min(120, gap - need - 125)
      if (hMax >= 60) {
        const height = 60 + Math.random() * (hMax - 60)
        const freeTop = fromTop ? c.top + height : c.top
        const freeBottom = fromTop ? c.bottom : c.bottom - height
        obstacle = {
          kind: 'spike',
          wx,
          width: 84,
          height,
          fromTop,
          passY: (freeTop + freeBottom) / 2 - center,
        }
      }
    }

    if (!obstacle) {
      // გასაძრომი: ორი სვეტი ჭერიდან და იატაკიდან, შუაში ხვრელით
      const gapH = need + (140 - 30 * p) + Math.random() * 20
      const maxOff = Math.max(0, (gap - gapH) / 2 - 14)
      let abs = center + (Math.random() * 2 - 1) * Math.min(maxOff, 125)
      abs = Math.max(this.lastRocketPass - 170, Math.min(this.lastRocketPass + 170, abs))
      abs = Math.max(center - maxOff, Math.min(center + maxOff, abs))
      obstacle = { kind: 'gate', wx, width: 46, gapOffset: abs - center, gapH, passY: abs - center }
    }

    this.rocketObs.push(obstacle)

    // დაშორება ისეა, რომ ერთი დაბრკოლებიდან მეორესთან გადასასვლელად დრო ეყოს
    let passCenter = center
    if (obstacle.kind === 'hole') {
      const cc = this.corridor(wx + (obstacle.r ?? 0))
      passCenter = (cc.top + cc.bottom) / 2
    }
    const passAbs = passCenter + obstacle.passY
    const dy = Math.abs(passAbs - this.lastRocketPass)
    this.lastRocketPass = passAbs
    this.nextRocketWx = wx + obstacle.width + level.speed * (0.95 + dy / 210) + 90
  }

  /** რამდენ პიქსელზე რჩება ჩვეულებრივი ხტომა 42 სიმაღლეზე მაღლა (გადასახტომი ველის მაქსიმალური სიგრძე) */
  private normalJumpWindow(level: LevelConfig): number {
    return 207 * Math.sqrt(level.speed / LEVELS[0].speed)
  }

  /**
   * სუპერ-ხტომის ფრენა: პლატფორმის (70) ზემოდან აფრენისას რამდენ პიქსელში ეშვება გმირი
   * მოცემული სიმაღლის (targetH) პლატფორმაზე
   */
  private superLanding(level: LevelConfig, targetH: number): number {
    const ratio = level.speed / LEVELS[0].speed
    const gravity = 1900 * ratio
    const v = 690 * Math.sqrt(ratio) * 1.4
    const disc = v * v - 2 * gravity * (targetH - 70)
    const time = (v + Math.sqrt(Math.max(0, disc))) / gravity
    return level.speed * time
  }

  /** სუპერ-ხტომის ფრენის მანძილი (პიქსელი) პლატფორმის (70 სიმაღლის) ზემოდან ძირამდე */
  private superJumpFlight(level: LevelConfig): number {
    const ratio = level.speed / LEVELS[0].speed
    const gravity = 1900 * ratio
    const v = 690 * Math.sqrt(ratio) * 1.4
    const time = (v + Math.sqrt(v * v + 2 * gravity * 70)) / gravity
    return level.speed * time
  }

  // ---------- დაბრკოლებების ნაკრებები (chunks) ----------
  // ყოველი ნაკრები ისეა აგებული, რომ ერთი ან ორი ხტომით აუცილებლად გადალახვადი იყოს

  /** დაბრკოლებებს შორის დამატებითი მანძილების მასშტაბი: მაღალ ეტაპებზე უფრო ხშირი დაბრკოლებები */
  private spacingScale(level: LevelConfig): number {
    const index = LEVELS.indexOf(level)
    return index >= 3 ? Math.max(0.68, 0.86 - (index - 3) * 0.035) : 1
  }

  /** ნაკრების წინ დამატებითი მანძილი (პიქსელი) */
  private chunkLead(kind: ChunkKind, level: LevelConfig): number {
    return (CHUNK_LEAD[kind] || 0) * level.speed * this.spacingScale(level)
  }

  private buildChunk(
    kind: ChunkKind,
    x: number,
    level: LevelConfig,
  ): { length: number; extraGap: number } {
    const raw = this.buildChunkRaw(kind, x, level)
    // სუპერ-ხტომის ნაკრებები მკაცრად გაანგარიშებულია (დაშვების ზონა), მათ არ ვამცირებთ
    const keep = kind === 'padWall' || kind === 'padHigh'
    return { length: raw.length, extraGap: keep ? raw.extraGap : raw.extraGap * this.spacingScale(level) }
  }

  private buildChunkRaw(
    kind: ChunkKind,
    x: number,
    level: LevelConfig,
  ): { length: number; extraGap: number } {
    const f = level.features
    const speed = level.speed
    const ground = this.groundY()
    const pX = this.playerX()

    switch (kind) {
      case 'padWall': {
        // სუპერ-ხტომის პლატფორმა + ძალიან მაღალი ბარიერი — მხოლოდ სუპერ-ხტომით გადადიხარ
        this.obstacles.push({ x, width: 150, height: 70, kind: 'super_bridge' })
        this.obstacles.push({
          x: x + 150 + 135,
          width: 40,
          height: 190 + Math.random() * 25,
          kind: 'wall',
        })
        // შემდეგი დაბრკოლება მხოლოდ დაშვების ზონის შემდეგ იწყება (ხაფანგი არ უნდა იყოს)
        const wallChunk = 150 + 135 + 40
        const extra = 150 + this.superJumpFlight(level) + speed * 0.38 - wallChunk - level.gapMin
        return { length: wallChunk, extraGap: Math.max(0, extra) }
      }

      case 'padHigh': {
        // სუპერ-ხტომის პლატფორმა + მაღალი ხიდი (150) ფართო ორმოზე — მხოლოდ სუპერ-ხტომით ადიხარ
        const platH = 150
        const landing = this.superLanding(level, platH)
        const start = x + landing - 110
        const runLen = 120 + Math.random() * 120
        const platLen = 110 + 150 + 110 + runLen
        this.obstacles.push({ x, width: 150, height: 70, kind: 'super_bridge' })
        this.obstacles.push({ x: start, width: platLen, height: platH, kind: 'bridge' })
        this.obstacles.push({ x: start + 35, width: platLen - 70, height: 0, kind: 'pit' })
        return { length: start + platLen - x, extraGap: speed * 0.3 }
      }

      case 'bridge': {
        // ხიდი ძირზე გრძელი დაბრკოლებების ველის თავზე — ჩვეულებრივი ხტომით გადასვლა შეუძლებელია
        const fieldLen = this.normalJumpWindow(level) + 45 + Math.random() * 100
        const overhang = 45
        const bridgeHeight = 82
        this.obstacles.push({
          x,
          width: fieldLen + overhang * 2,
          height: bridgeHeight,
          kind: 'bridge',
        })

        // ველი: ეკლები (და ზოგჯერ ელექტრო სვეტები) ერთმანეთის გვერდით
        const electricLevel = LEVELS.indexOf(level) >= 2
        let px = x + overhang
        let n = 0
        while (px < x + overhang + fieldLen - 30) {
          const electric = electricLevel && n % 3 === 2
          const w = electric ? 25 : 34
          this.obstacles.push({
            x: px,
            width: w,
            height: electric ? 60 : 42,
            kind: electric ? 'electric' : 'spike',
          })
          px += w + 20
          n++
        }

        // უფრო მაღალ ეტაპებზე ხიდზეც ზოგჯერ ეკალია — ხიდზე კიდევ ერთი ხტომა სჭირდება
        if (f.bridgeHazard && LEVELS.indexOf(level) >= 3 && Math.random() < 0.3) {
          this.obstacles.push({
            x: x + overhang + fieldLen / 2,
            width: 32,
            height: 38,
            kind: 'spike',
            yOffset: bridgeHeight,
          })
        }

        return { length: fieldLen + overhang * 2, extraGap: speed * 0.1 }
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
        return { length, extraGap: length > 46 ? speed * 0.25 : speed * 0.15 }
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
        return { length: width, extraGap: speed * 0.18 }
      }

      case 'saw': {
        // ხერხი ჩვეულებრივზე უფრო სწრაფად მოდის; დაწევას წინასწარ ვაკომპენსირებთ
        const vx = 110 + Math.random() * 80 + Math.max(0, LEVELS.indexOf(level) - 5) * 10
        const t = Math.max(0, (x - pX) / (speed + vx))
        const catchUp = vx * t
        this.obstacles.push({ x: x + catchUp, width: 46, height: 46, kind: 'saw', vx })
        return { length: catchUp + 46, extraGap: speed * 0.12 }
      }

      case 'pit': {
        // ორმო მიწაზე: მასზე გადახტომაა საჭირო, ჩავარდნისას თამაში წაგებულია
        const width = 100 + Math.random() * 30 + Math.max(0, LEVELS.indexOf(level) - 2) * 8
        this.obstacles.push({ x, width, height: 0, kind: 'pit' })
        return { length: width, extraGap: speed * 0.12 }
      }

      case 'pitBridge': {
        // ფართო ორმო, რომელზეც გადახტომა შეუძლებელია — ხიდზე უნდა ახტე და გადაირბინო
        const overlap = 60
        // ორმო ჩვეულებრივი ხტომის სრულ მანძილზე გრძელია — ხიდის გარეშე გადასვლა შეუძლებელია
        const arc = 276 * Math.sqrt(level.speed / LEVELS[0].speed)
        const width = arc + 40 + Math.random() * 90
        this.obstacles.push({ x: x + overlap, width, height: 0, kind: 'pit' })
        this.obstacles.push({ x, width: width + overlap * 2, height: 82, kind: 'bridge' })
        return { length: width + overlap * 2, extraGap: speed * 0.3 }
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
      kind = this.levelIndex >= 3 && Math.random() < 0.5 ? 'padHigh' : 'padWall'
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
    } else if (hit(f.pit)) {
      kind = 'pit'
    } else if (hit(f.pitBridge)) {
      kind = 'pitBridge'
    } else {
      if (Math.random() > level.obstacleChance) {
        this.nextObstacleX = spawnX + 60
        return
      }
      kind = f.triple > 0 && Math.random() < f.triple ? 'triple' : 'plain'
    }

    const x = spawnX + this.chunkLead(kind, level)
    const { length, extraGap } = this.buildChunk(kind, x, level)
    const gap = level.gapMin + Math.random() * (level.gapMax - level.gapMin)
    this.nextObstacleX = x + length + gap + extraGap
  }

  // ლოგიკური ხედვის ზომა: ეკრანის ზომა გაყოფილი მასშტაბზე (ZOOM)
  private viewW() {
    return window.innerWidth / ZOOM
  }

  private viewH() {
    return window.innerHeight / ZOOM
  }

  private playerX() {
    return Math.max(75, Math.min(150, this.viewW() * 0.17))
  }

  private groundY() {
    return this.viewH() * 0.78
  }

  private draw() {
    const ctx = this.ctx
    const realW = window.innerWidth
    const realH = window.innerHeight
    const width = this.viewW()
    const height = this.viewH()
    const level = LEVELS[this.levelIndex] ?? LEVELS[0]
    const ground = this.groundY()
    const rocketMode = level.mode === 'rocket'

    ctx.clearRect(0, 0, realW, realH)

    ctx.save()
    ctx.scale(ZOOM, ZOOM)
    if (this.shake > 0) {
      const s = Math.min(this.shake * 36, 8)
      ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s)
    }

    const skyKey = `${this.levelIndex}:${Math.round(height)}`
    if (this.skyKey !== skyKey || !this.skyGradient) {
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, level.sky[0])
      gradient.addColorStop(0.6, level.sky[1])
      gradient.addColorStop(1, level.sky[2])
      this.skyGradient = gradient
      this.skyKey = skyKey
    }
    ctx.fillStyle = this.skyGradient
    ctx.fillRect(-20, -20, width + 40, height + 40)

    // თემატური დინამიური ფონი
    this.drawBackground(level, width, ground)

    for (const meteor of this.meteors) {
      ctx.save()
      ctx.globalAlpha = meteor.alpha
      ctx.strokeStyle = rgba(level.color, 0.75)
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

    if (!rocketMode) {
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

    // ორმოები: უფსკრული და გამაფრთხილებელი კიდეები (ჩავარდნისას თამაში წაგებულია)
    const pits = this.obstacles.filter(o => o.kind === 'pit').sort((a, b) => a.x - b.x)
    for (const pit of pits) {
      const abyss = ctx.createLinearGradient(0, ground, 0, height)
      abyss.addColorStop(0, '#000000')
      abyss.addColorStop(1, level.sky[2])
      ctx.fillStyle = abyss
      ctx.fillRect(pit.x, ground, pit.width, height - ground + 40)

      const pulse = 0.6 + 0.4 * Math.sin(this.time * 8)
      ctx.fillStyle = `rgba(255, 70, 90, ${0.55 * pulse})`
      ctx.fillRect(pit.x - 3, ground, 3, height - ground)
      ctx.fillRect(pit.x + pit.width, ground, 3, height - ground)
      for (let k = 0; k < pit.width; k += 20) {
        ctx.fillStyle = (k / 20) % 2 === 0 ? '#ffcc00' : '#1a1a1a'
        ctx.fillRect(pit.x + k, ground - 5, Math.min(10, pit.width - k), 5)
      }
    }

    ctx.strokeStyle = level.color
    ctx.lineWidth = 3
    ctx.shadowColor = level.color
    ctx.shadowBlur = fxBlur(16)
    ctx.beginPath()
    let cursor = 0
    for (const pit of pits) {
      if (pit.x > cursor) {
        ctx.moveTo(cursor, ground)
        ctx.lineTo(Math.min(pit.x, width), ground)
      }
      cursor = Math.max(cursor, pit.x + pit.width)
    }
    if (cursor < width) {
      ctx.moveTo(cursor, ground)
      ctx.lineTo(width, ground)
    }
    if (!GLOW) {
      // იაფი "ნათება": უფრო განიერი გამჭვირვალე ხაზი
      ctx.save()
      ctx.strokeStyle = rgba(level.color, 0.16)
      ctx.lineWidth = 10
      ctx.stroke()
      ctx.restore()
    }
    ctx.stroke()
    ctx.shadowBlur = 0
    }

    if (rocketMode) {
      this.drawRocketScene(level, width, height)
    } else {
      for (const obstacle of this.obstacles) {
        if (obstacle.kind === 'pit') continue
        this.drawObstacle(obstacle, ground, level.color)
      }

      const cpuX = this.playerX()
      const cpuY = ground - this.playerSize + this.playerY
      if (this.flipAngle !== 0) {
        const cx = cpuX + this.playerSize / 2
        const cy = cpuY + this.playerSize / 2
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(this.flipAngle)
        ctx.translate(-cx, -cy)
        this.drawCPU(cpuX, cpuY, this.playerSize, level.color)
        ctx.restore()
      } else {
        this.drawCPU(cpuX, cpuY, this.playerSize, level.color)
      }
    }

    ctx.restore()

    if (this.levelFade > 0) {
      ctx.fillStyle = rgba(level.color, this.levelFade * 0.35)
      ctx.fillRect(0, 0, realW, realH)
    }

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,50,70,${Math.min(this.flash * 2, 0.3)})`
      ctx.fillRect(0, 0, realW, realH)
    }
  }

  private drawRocketScene(level: LevelConfig, W: number, H: number) {
    const ctx = this.ctx
    const step = 12
    const n = Math.ceil(W / step) + 1
    const tops: number[] = []
    const bottoms: number[] = []
    for (let i = 0; i <= n; i++) {
      const c = this.corridor(this.scroll + i * step)
      tops.push(c.top)
      bottoms.push(c.bottom)
    }

    // კედლები: ჭერი და იატაკი
    const wall = ctx.createLinearGradient(0, 0, 0, H)
    wall.addColorStop(0, '#05010f')
    wall.addColorStop(0.5, '#1b0b3a')
    wall.addColorStop(1, '#05010f')
    ctx.fillStyle = wall
    ctx.beginPath()
    ctx.moveTo(0, 0)
    for (let i = 0; i <= n; i++) ctx.lineTo(i * step, tops[i])
    ctx.lineTo(n * step, 0)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(0, H)
    for (let i = 0; i <= n; i++) ctx.lineTo(i * step, bottoms[i])
    ctx.lineTo(n * step, H)
    ctx.closePath()
    ctx.fill()

    // საშიში კიდეები: წითელი გაფრთხილება და ნეონის ხაზი
    ctx.save()
    for (const edge of [tops, bottoms]) {
      const dir = edge === tops ? 1 : -1
      ctx.strokeStyle = 'rgba(255, 70, 90, 0.35)'
      ctx.lineWidth = 3
      ctx.beginPath()
      for (let i = 0; i <= n; i++) {
        if (i === 0) ctx.moveTo(0, edge[0] + dir * 9)
        else ctx.lineTo(i * step, edge[i] + dir * 9)
      }
      ctx.stroke()

      ctx.strokeStyle = level.color
      ctx.lineWidth = 3
      ctx.shadowColor = level.color
      ctx.shadowBlur = fxBlur(14)
      ctx.beginPath()
      for (let i = 0; i <= n; i++) {
        if (i === 0) ctx.moveTo(0, edge[0])
        else ctx.lineTo(i * step, edge[i])
      }
      ctx.stroke()
      ctx.shadowBlur = 0
    }
    ctx.restore()

    // ფინიშის ჭიშკარი
    for (const obstacle of this.obstacles) {
      if (obstacle.kind !== 'finish') continue
      for (let y = 0; y < H; y += 24) {
        ctx.fillStyle = (y / 24) % 2 === 0 ? '#ffffff' : '#111111'
        ctx.fillRect(obstacle.x, y, 24, 24)
        ctx.fillStyle = (y / 24) % 2 === 0 ? '#111111' : '#ffffff'
        ctx.fillRect(obstacle.x + 24, y, 24, 24)
      }
    }

    this.drawRocketObstacles(level, H)
    this.drawRocket(level)

    // მინიშნება დასაწყისში
    if (this.levelTime < 6) {
      ctx.save()
      ctx.globalAlpha = Math.min(1, (6 - this.levelTime) / 1.5)
      ctx.textAlign = 'center'
      ctx.font = '700 20px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = level.color
      ctx.shadowBlur = fxBlur(12)
      ctx.fillText('დაჭერა (SPACE / მაუსი) — ზემოთ   •   გაშვება — ქვემოთ', W / 2, H * 0.17)
      ctx.restore()
    }
  }

  private drawRocketObstacles(level: LevelConfig, H: number) {
    const ctx = this.ctx

    for (const o of this.rocketObs) {
      const sx = o.wx - this.scroll
      if (sx > this.viewW() + 120 || sx + o.width < -120) continue

      if (o.kind === 'gate') {
        const c = this.corridor(o.wx)
        const gapCenter = (c.top + c.bottom) / 2 + (o.gapOffset ?? 0)
        const half = (o.gapH ?? 150) / 2
        const topEdge = gapCenter - half
        const bottomEdge = gapCenter + half

        const body = ctx.createLinearGradient(sx, 0, sx + o.width, 0)
        body.addColorStop(0, '#2b1560')
        body.addColorStop(0.5, '#4a2590')
        body.addColorStop(1, '#2b1560')
        ctx.fillStyle = body
        ctx.fillRect(sx, 0, o.width, topEdge)
        ctx.fillRect(sx, bottomEdge, o.width, H - bottomEdge)

        // გამაფრთხილებელი ზოლები ხვრელის კიდეებზე
        for (let k = 0; k < o.width; k += 12) {
          ctx.fillStyle = (k / 12) % 2 === 0 ? '#ffcc00' : '#1a1a1a'
          ctx.fillRect(sx + k, topEdge - 8, Math.min(12, o.width - k), 8)
          ctx.fillRect(sx + k, bottomEdge, Math.min(12, o.width - k), 8)
        }
        ctx.save()
        ctx.strokeStyle = level.color
        ctx.lineWidth = 2
        ctx.shadowColor = level.color
        ctx.shadowBlur = fxBlur(10)
        ctx.strokeRect(sx, -4, o.width, topEdge + 4)
        ctx.strokeRect(sx, bottomEdge, o.width, H - bottomEdge + 4)
        ctx.restore()
      } else if (o.kind === 'spike') {
        const h = o.height ?? 80
        const c = this.corridor(o.wx + o.width / 2)
        const dir = o.fromTop ? 1 : -1
        const baseY = (o.fromTop ? c.top : c.bottom) - dir * 6
        const tipY = (o.fromTop ? c.top : c.bottom) + dir * h

        const grad = ctx.createLinearGradient(0, baseY, 0, tipY)
        grad.addColorStop(0, '#4a2590')
        grad.addColorStop(1, '#ff4d6d')
        ctx.save()
        ctx.fillStyle = grad
        ctx.strokeStyle = '#ff9aaa'
        ctx.lineWidth = 2
        ctx.shadowColor = '#ff4d6d'
        ctx.shadowBlur = fxBlur(12)
        ctx.beginPath()
        ctx.moveTo(sx, baseY)
        ctx.lineTo(sx + o.width, baseY)
        ctx.lineTo(sx + o.width / 2, tipY)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        ctx.restore()
      } else {
        const r = o.r ?? 38
        const c = this.corridor(o.wx + r)
        const cy = (c.top + c.bottom) / 2 + (o.offset ?? 0)
        const t = this.time
        const hx = sx + r

        ctx.save()
        // გარე ნათება
        const halo = ctx.createRadialGradient(hx, cy, r * 0.8, hx, cy, r * 2.2)
        halo.addColorStop(0, 'rgba(176, 107, 255, 0.45)')
        halo.addColorStop(1, 'rgba(176, 107, 255, 0)')
        ctx.fillStyle = halo
        ctx.fillRect(hx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4)

        // მბრუნავი დისკო
        ctx.lineWidth = 3
        for (let k = 0; k < 3; k++) {
          ctx.strokeStyle = `rgba(${200 + k * 20}, ${120 + k * 40}, 255, ${0.8 - k * 0.2})`
          ctx.beginPath()
          ctx.ellipse(hx, cy, r * (1.35 - k * 0.12), r * (0.55 - k * 0.08), t * (1.4 + k * 0.5), 0, Math.PI * 1.5)
          ctx.stroke()
        }

        // ხვრელი
        const core = ctx.createRadialGradient(hx, cy, 2, hx, cy, r)
        core.addColorStop(0, '#000000')
        core.addColorStop(0.8, '#0a0016')
        core.addColorStop(1, '#3d1a7a')
        ctx.fillStyle = core
        ctx.beginPath()
        ctx.arc(hx, cy, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }
  }

  private drawRocket(level: LevelConfig) {
    const ctx = this.ctx
    const x = this.playerX()
    const y = this.rocketY
    const tilt = Math.max(-0.4, Math.min(0.4, this.rocketVY / 900))

    ctx.save()
    ctx.translate(x + ROCKET.width / 2, y)
    ctx.rotate(tilt)
    ctx.translate(-ROCKET.width / 2, 0)

    // ალი
    const flame = (this.jumpHeld ? 36 : 15) + Math.random() * 10
    const fg = ctx.createLinearGradient(0, 0, -flame, 0)
    fg.addColorStop(0, '#fff3a0')
    fg.addColorStop(0.5, '#ff9a3c')
    fg.addColorStop(1, 'rgba(255, 60, 30, 0)')
    ctx.fillStyle = fg
    ctx.beginPath()
    ctx.moveTo(0, -7)
    ctx.lineTo(-flame, 0)
    ctx.lineTo(0, 7)
    ctx.closePath()
    ctx.fill()

    // ფრთები
    ctx.fillStyle = '#e0405a'
    ctx.beginPath()
    ctx.moveTo(4, -9)
    ctx.lineTo(18, -9)
    ctx.lineTo(2, -17 + 6)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(4, 9)
    ctx.lineTo(18, 9)
    ctx.lineTo(2, 17)
    ctx.closePath()
    ctx.fill()

    // კორპუსი
    ctx.shadowColor = level.color
    ctx.shadowBlur = fxBlur(14)
    ctx.fillStyle = '#e8f4ff'
    ctx.beginPath()
    ctx.moveTo(0, -11)
    ctx.lineTo(42, -11)
    ctx.quadraticCurveTo(66, 0, 42, 11)
    ctx.lineTo(0, 11)
    ctx.closePath()
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#e0405a'
    ctx.fillRect(26, -11, 7, 22)
    ctx.fillStyle = '#3d9bff'
    ctx.beginPath()
    ctx.arc(46, 0, 5, 0, Math.PI * 2)
    ctx.fill()

    // გმირი რაკეტაზე
    this.drawCPU(10, -ROCKET.top, this.playerSize * 0.9, level.color)
    ctx.restore()
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
    const colW = 48
    const cols = Math.ceil(W / colW) + 1
    for (let c = 0; c < cols; c++) {
      const x = c * colW + 6 - mod(this.scroll * 0.05, colW)
      const sp = 40 + hash(c) * 90
      const head = mod(t * sp + hash(c + 50) * G * 2, G + 200) - 100
      for (let k = 0; k < 6; k++) {
        const y = head - k * 20
        if (y < 0 || y > G) continue
        ctx.fillStyle = k === 0 ? 'rgba(255,255,255,0.55)' : rgba(level.color, (1 - k / 6) * 0.35)
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
          const lit = hash(id * 13 + r * 7 + c) > 0.72
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
          if (alpha < 0.5 && r % 3 !== 0) continue
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
      ctx.shadowBlur = fxBlur(20)
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
    if (!GLOW) {
      ctx.fillStyle = rgba(glow, 0.16)
      ctx.beginPath()
      ctx.arc(x + size / 2, top + size / 2, size * 0.85, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.shadowColor = glow
    ctx.shadowBlur = fxBlur(22)

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
      ctx.shadowBlur = fxBlur(25)

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
    ctx.shadowBlur = fxBlur(14)

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
      ctx.shadowBlur = fxBlur(18)
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
        ctx.shadowBlur = fxBlur(24)
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
    this.modalOpen = true

    if (this.levelIndex >= LEVELS.length - 1) {
      this.showVictory()
      return
    }

    this.showLevelComplete()
  }

  /** ეტაპი გავლილია: მცირე პაუზა და გადასვლა შემდეგ ეტაპზე (საკონტროლო კითხვის გარეშე) */
  private showLevelComplete() {
    const modal = this.root.querySelector('.cpu-modal') as HTMLDivElement
    modal.hidden = false
    modal.innerHTML = `
      <div class="cpu-card">
        <div class="cpu-card-icon">✅</div>
        <h2>ეტაპი ${this.levelIndex + 1} გავლილია!</h2>
        <p>შესანიშნავია! შემდეგი ეტაპი უფრო სწრაფია.</p>
        <button class="cpu-submit" type="button">შემდეგი ეტაპი →</button>
      </div>
    `

    const button = modal.querySelector('button') as HTMLButtonElement
    button.addEventListener('click', () => {
      modal.hidden = true
      this.levelIndex++
      this.resetLevel()
      this.modalOpen = false
      this.running = true
      this.lastTime = performance.now()
    })

    window.setTimeout(() => button.focus(), 50)
  }

  private showVictory() {
    const modal = this.root.querySelector('.cpu-modal') as HTMLDivElement
    modal.hidden = false
    modal.innerHTML = `
      <div class="cpu-card">
        <div class="cpu-card-icon">🏆</div>
        <h2>CPU Dash დასრულებულია!</h2>
        <p>
          ყველა ${LEVELS.length} ეტაპი გაიარე.
          შესანიშნავი შედეგია!
        </p>
        <button class="cpu-submit" type="button">სამეფოში დაბრუნება</button>
        <div class="cpu-small">გადალახული დაბრკოლებები: ${this.score}</div>
      </div>
    `

    modal.querySelector('button')!.addEventListener('click', () => this.close())
  }

  private fail() {
    this.flash = 0.18
    this.running = false
    this.modalOpen = true

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
      this.modalOpen = false
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
    window.removeEventListener('keyup', this.keyUpHandler, true)
    window.removeEventListener('pointerup', this.releaseHandler)
    window.removeEventListener('pointercancel', this.releaseHandler)
    window.removeEventListener('blur', this.releaseHandler)
    window.removeEventListener('resize', this.resizeHandler)
    this.root.removeEventListener('pointerdown', this.pointerHandler)

    this.root.remove()
    this.onClose?.()
  }
}