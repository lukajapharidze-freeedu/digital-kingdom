/**
 * Ping-Pong-Dong — კომპიუტერული "ბლოკების მტვრევა".
 * ჩოგანი არის RAM მოდული, ბურთი — ბიტი (0/1). ეტაპები თანდათან რთულდება,
 * კომბოებზე ზემოდან ბონუსები ცვივა: CPU (ბურთების გამრავლება), RAM (ორი მოდული),
 * ქულერი (შენელება), ფაირვოლი (ქვედა დამცავი) და ბატარეა (+1 სიცოცხლე).
 */

export type PingPongDongOptions = {
  onClose?: () => void
}

type Phase = 'ready' | 'play' | 'clear' | 'over'

type Ball = {
  x: number
  y: number
  vx: number
  vy: number
  /** ბიტის მნიშვნელობა — ყოველ ასხლეტაზე იცვლება */
  bit: 0 | 1
  stuck: boolean
}

/** 0 — ცარიელი, 1..3 — სიცოცხლე, STEEL — დაუმტვრეველი */
type Cell = number

type Mover = {
  baseX: number
  x: number
  y: number
  w: number
  h: number
  amp: number
  speed: number
  phase: number
}

type BonusKind = 'cpu' | 'ram' | 'cooler' | 'firewall' | 'battery'

type Bonus = {
  kind: BonusKind
  x: number
  y: number
  vy: number
  spin: number
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
}

type FloatText = {
  x: number
  y: number
  text: string
  color: string
  life: number
}

type HudButton = { id: 'restart' | 'pause' | 'exit'; x: number; y: number; r: number }

// ---------- მუდმივები (ლოგიკური ერთეულები) ----------

const FW = 528
const FH = 860
const HUD_H = 76
const WALL_Y = 96
const TOP = WALL_Y + 10
const COLS = 24
const CELL = 22
const GRID_Y = 132
const MAX_ROWS = 18
const STEEL = 9
/** დასამტვრევი აგურების რა წილი რჩება ეტაპზე */
const BRICK_KEEP = 0.7

const PADDLE_Y = FH - 92
const PADDLE_H = 24
const MODULE_W = 104
const BALL_R = 9
const MAX_BALLS = 24
const MAX_LIVES = 5

const COMBO_WINDOW = 4.5
const COMBO_STEP = 5
const RAM_SECONDS = 20
const COOLER_SECONDS = 9
const FIREWALL_SECONDS = 12

const BRICK_COLORS: Record<number, [string, string, string]> = {
  1: ['#39ff6a', '#b4ffc8', '#169a3b'],
  2: ['#35e0ff', '#b8f5ff', '#137c99'],
  3: ['#ffb02e', '#ffe0a3', '#a0620a'],
  [STEEL]: ['#4a5470', '#7a86a6', '#262c3d'],
}

const BONUS_INFO: Record<BonusKind, { label: string; toast: string; color: string }> = {
  cpu: { label: 'CPU', toast: 'CPU: ბიტები გამრავლდა!', color: '#43e7ff' },
  ram: { label: 'RAM', toast: 'RAM: ახლა ორი მოდული გაქვს!', color: '#39ff6a' },
  cooler: { label: 'ქულერი', toast: 'ქულერი: ბიტები შენელდა', color: '#9fd8ff' },
  firewall: { label: 'ფაირვოლი', toast: 'ფაირვოლი: ქვემოთ დამცავი კედელია!', color: '#ff7a3d' },
  battery: { label: '+1', toast: 'ბატარეა: +1 სიცოცხლე', color: '#ff4d6d' },
}

// ეტაპის ნიმუშები: '.' ცარიელი, 1-3 სიცოცხლე, '#' ფოლადი. sx/sy — გადიდება.
type Pattern = { name: string; rows: string[]; sx: number; sy: number }

const PATTERNS: Pattern[] = [
  {
    name: 'პირველი ბაიტები',
    sx: 2,
    sy: 1,
    rows: [
      '.1111111111.',
      '............',
      '111111111111',
      '............',
      '.1111111111.',
    ],
  },
  {
    name: 'მონიტორი',
    sx: 2,
    sy: 1,
    rows: [
      '333333333333',
      '311111111113',
      '312222222213',
      '312111111213',
      '312111111213',
      '312222222213',
      '311111111113',
      '333333333333',
      '.....##.....',
      '...######...',
    ],
  },
  {
    name: 'ვირუსი',
    sx: 2,
    sy: 2,
    rows: [
      '..1.....1..',
      '...1...1...',
      '..2222222..',
      '.22.333.22.',
      '22222222222',
      '2.2222222.2',
      '2.1.....1.2',
      '...11.11...',
    ],
  },
  {
    name: 'ნული და ერთი',
    sx: 2,
    sy: 2,
    rows: [
      '.222....11..',
      '2...2..1.1..',
      '2..22....1..',
      '2.2.2....1..',
      '22..2....1..',
      '2...2....1..',
      '.222....333.',
    ],
  },
]

// ---------- დამხმარე ფუნქციები ----------

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${clamp(alpha, 0, 1)})`
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export class PingPongDong {
  /** რეკორდი ინახება მხოლოდ გვერდის ამჟამინდელ გახსნამდე */
  private static best = 0

  private readonly onClose: (() => void) | undefined
  private root!: HTMLDivElement
  private canvas!: HTMLCanvasElement
  private ctx!: CanvasRenderingContext2D
  private modal!: HTMLDivElement
  private glowSprite!: HTMLCanvasElement

  private frame = 0
  private lastTime = 0
  private disposed = false
  private paused = false

  // ეკრანზე მოთავსება
  private dpr = 1
  private scale = 1
  private offX = 0
  private offY = 0

  private phase: Phase = 'ready'
  private time = 0
  private phaseTime = 0
  private stage = 1
  private stageName = ''
  private lives = 3
  private score = 0

  private grid: Cell[][] = []
  private movers: Mover[] = []
  private balls: Ball[] = []
  private bonuses: Bonus[] = []
  private particles: Particle[] = []
  private texts: FloatText[] = []

  private paddleX = FW / 2
  private targetX = FW / 2
  private paddleW = MODULE_W
  private modules = 1
  private ramTime = 0
  private coolerTime = 0
  private firewallTime = 0

  private combo = 0
  private comboTimer = 0
  private bestCombo = 0

  private toast = ''
  private toastTime = 0
  private shake = 0
  private readonly keys = new Set<string>()
  private readonly buttons: HudButton[] = [
    { id: 'restart', x: FW - 140, y: HUD_H / 2, r: 22 },
    { id: 'pause', x: FW - 88, y: HUD_H / 2, r: 22 },
    { id: 'exit', x: FW - 36, y: HUD_H / 2, r: 22 },
  ]

  constructor(options: PingPongDongOptions = {}) {
    this.onClose = options.onClose
    this.build()
    this.newRun()
    this.lastTime = performance.now()
    this.frame = requestAnimationFrame(this.loop)
  }

  // ---------- DOM ----------

  private build() {
    this.root = document.createElement('div')
    this.root.className = 'ppd-root'
    this.root.innerHTML = `
      <style>
        .ppd-root { position: fixed; inset: 0; z-index: 2000; overflow: hidden; touch-action: none;
          background: radial-gradient(circle at 50% 30%, #0d1c4d, #040920 70%);
          font-family: Arial, sans-serif; user-select: none; }
        .ppd-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        .ppd-modal { position: absolute; inset: 0; z-index: 6; display: flex; align-items: center;
          justify-content: center; background: rgba(4, 8, 24, 0.62); backdrop-filter: blur(5px); }
        .ppd-modal[hidden] { display: none; }
        .ppd-card { width: min(440px, 92vw); padding: 28px; border-radius: 24px; text-align: center;
          background: linear-gradient(145deg, #13235a, #0a1438); color: #e8f4ff;
          border: 2px solid rgba(57, 255, 106, 0.45); box-shadow: 0 20px 70px rgba(0,0,0,0.55); }
        .ppd-card h2 { margin: 0 0 6px; font-size: 25px; }
        .ppd-big { font-size: 54px; font-weight: 900; margin: 6px 0; color: #39ff6a;
          text-shadow: 0 0 18px rgba(57,255,106,0.5); }
        .ppd-info { color: #b9c9ea; font-size: 15px; line-height: 1.6; }
        .ppd-small { color: #8ea2c8; font-size: 13px; margin-top: 12px; }
        .ppd-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
        .ppd-btn { border: 0; border-radius: 999px; padding: 12px 22px; min-width: 130px; font-size: 16px;
          font-weight: bold; color: #062033; cursor: pointer; background: #2fe0f0; }
        .ppd-btn.ppd-secondary { background: #2a3f7a; color: #fff; }
      </style>
      <canvas class="ppd-canvas"></canvas>
      <div class="ppd-modal" hidden>
        <div class="ppd-card">
          <h2>💥 ბიტები დაიკარგა!</h2>
          <div class="ppd-big">0</div>
          <div class="ppd-info"></div>
          <div class="ppd-row">
            <button class="ppd-btn ppd-again" type="button">↻ თავიდან</button>
            <button class="ppd-btn ppd-secondary ppd-leave" type="button">გასვლა</button>
          </div>
          <div class="ppd-small">Enter — თავიდან დაწყება</div>
        </div>
      </div>
    `
    document.body.appendChild(this.root)

    this.canvas = this.root.querySelector('.ppd-canvas') as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
    this.modal = this.root.querySelector('.ppd-modal') as HTMLDivElement

    this.root.querySelector('.ppd-leave')!.addEventListener('click', () => this.close())
    this.root.querySelector('.ppd-again')!.addEventListener('click', () => this.newRun())

    // ბიტის ნათება — წინასწარ დახატული, რომ ბევრი ბურთიც სწრაფად იხატებოდეს
    this.glowSprite = document.createElement('canvas')
    this.glowSprite.width = this.glowSprite.height = 64
    const g = this.glowSprite.getContext('2d') as CanvasRenderingContext2D
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255,255,255,0.9)')
    grad.addColorStop(0.25, 'rgba(190,240,255,0.45)')
    grad.addColorStop(1, 'rgba(120,200,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 64, 64)

    this.canvas.addEventListener('pointerdown', this.pointerDownHandler)
    this.root.addEventListener('pointermove', this.pointerMoveHandler)
    window.addEventListener('keydown', this.keyDownHandler, true)
    window.addEventListener('keyup', this.keyUpHandler, true)
    window.addEventListener('resize', this.resizeHandler)
    this.resize()
  }

  private readonly resizeHandler = () => this.resize()

  private resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const w = window.innerWidth
    const h = window.innerHeight
    this.canvas.width = Math.floor(w * this.dpr)
    this.canvas.height = Math.floor(h * this.dpr)
    // ველი ყოველთვის 528×860 ლოგიკური ერთეულია და ეკრანზე მთლიანად ეტევა
    this.scale = Math.min(w / FW, h / FH)
    this.offX = (w - FW * this.scale) / 2
    this.offY = (h - FH * this.scale) / 2
  }

  private toLogical(event: PointerEvent): { x: number; y: number } {
    return {
      x: (event.clientX - this.offX) / this.scale,
      y: (event.clientY - this.offY) / this.scale,
    }
  }

  // ---------- შეყვანა ----------

  private readonly keyDownHandler = (event: KeyboardEvent) => {
    // სამეფოს კლავიშები (WASD, E...) ამ დროს არ უნდა მუშაობდეს
    event.stopPropagation()

    if (event.code === 'Escape') {
      event.preventDefault()
      this.close()
      return
    }
    if (!this.modal.hidden) {
      if (event.code === 'Enter') {
        event.preventDefault()
        this.newRun()
      }
      return
    }
    if (event.code === 'KeyP') {
      this.togglePause()
      return
    }
    if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW' || event.code === 'Enter') {
      event.preventDefault()
      if (!event.repeat) this.launch()
      return
    }
    if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) {
      event.preventDefault()
      this.keys.add(event.code)
    }
  }

  private readonly keyUpHandler = (event: KeyboardEvent) => {
    this.keys.delete(event.code)
  }

  private readonly pointerMoveHandler = (event: PointerEvent) => {
    if (this.paused) return
    this.targetX = this.toLogical(event).x
  }

  private readonly pointerDownHandler = (event: PointerEvent) => {
    const p = this.toLogical(event)
    for (const b of this.buttons) {
      if (Math.hypot(p.x - b.x, p.y - b.y) <= b.r + 6) {
        if (b.id === 'restart') this.newRun()
        if (b.id === 'pause') this.togglePause()
        if (b.id === 'exit') this.close()
        return
      }
    }
    if (this.paused) {
      this.togglePause()
      return
    }
    this.targetX = p.x
    this.launch()
  }

  private togglePause() {
    if (this.phase === 'over') return
    this.paused = !this.paused
    this.keys.clear()
  }

  // ---------- თამაშის მდგომარეობა ----------

  private newRun() {
    this.modal.hidden = true
    this.paused = false
    this.stage = 1
    this.lives = 3
    this.score = 0
    this.bestCombo = 0
    this.modules = 1
    this.paddleW = MODULE_W
    this.ramTime = 0
    this.loadStage()
  }

  private loadStage() {
    const s = this.stage
    this.grid = this.thinGrid(this.buildGrid(s))
    this.movers = []
    // მე-3 ეტაპიდან ჩნდება მოძრავი ფოლადის ბარიერები
    const moverCount = s >= 3 ? Math.min(Math.floor((s - 1) / 2), 3) : 0
    const rowsUsed = this.grid.reduce((n, row, r) => (row.some(c => c > 0) ? r + 1 : n), 0)
    for (let i = 0; i < moverCount; i++) {
      const w = 70 + Math.random() * 30
      const amp = (FW - w) / 2 - 20
      this.movers.push({
        baseX: FW / 2 - w / 2,
        x: FW / 2 - w / 2,
        y: GRID_Y + rowsUsed * CELL + 40 + i * 58,
        w,
        h: 14,
        amp,
        speed: 0.6 + Math.random() * 0.35 + s * 0.04,
        phase: Math.random() * Math.PI * 2,
      })
    }

    this.bonuses = []
    this.particles = []
    this.texts = []
    this.combo = 0
    this.comboTimer = 0
    this.coolerTime = 0
    this.firewallTime = 0
    this.resetBalls()
    this.phase = 'ready'
    this.phaseTime = 0
    this.showToast(`ეტაპი ${s}: ${this.stageName}`)
  }

  private resetBalls() {
    this.balls = [{ x: this.paddleX, y: PADDLE_Y - BALL_R - 1, vx: 0, vy: 0, bit: 1, stuck: true }]
  }

  /**
   * ბავშვებისთვის მსუბუქი ვერსია: აგური მაქსიმუმ 2 დარტყმით იმტვრევა
   * და დასამტვრევი აგურების მხოლოდ 70% რჩება (სიმეტრიულად ვაკლებთ).
   */
  private thinGrid(grid: Cell[][]): Cell[][] {
    const cells: [number, number][] = []
    for (let r = 0; r < MAX_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] > 2 && grid[r][c] !== STEEL) grid[r][c] = 2
        if (grid[r][c] > 0 && grid[r][c] !== STEEL) cells.push([r, c])
      }
    }

    let toRemove = Math.round(cells.length * (1 - BRICK_KEEP))
    const left = cells.filter(([, c]) => c < COLS / 2)
    for (let i = left.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[left[i], left[j]] = [left[j], left[i]]
    }
    for (const [r, c] of left) {
      if (toRemove <= 0) break
      grid[r][c] = 0
      toRemove--
      const m = COLS - 1 - c
      if (toRemove > 0 && grid[r][m] > 0 && grid[r][m] !== STEEL) {
        grid[r][m] = 0
        toRemove--
      }
    }
    return grid
  }

  private buildGrid(stage: number): Cell[][] {
    const grid: Cell[][] = Array.from({ length: MAX_ROWS }, () => new Array<Cell>(COLS).fill(0))

    if (stage <= PATTERNS.length) {
      const p = PATTERNS[stage - 1]
      this.stageName = p.name
      const w = p.rows[0].length * p.sx
      const left = Math.floor((COLS - w) / 2)
      p.rows.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
          const ch = row[c]
          const v = ch === '#' ? STEEL : ch === '.' ? 0 : Number(ch)
          for (let dy = 0; dy < p.sy; dy++) {
            for (let dx = 0; dx < p.sx; dx++) {
              const gr = 1 + r * p.sy + dy
              const gc = left + c * p.sx + dx
              if (gr < MAX_ROWS && gc >= 0 && gc < COLS) grid[gr][gc] = v
            }
          }
        }
      })
      return grid
    }

    if (stage === PATTERNS.length + 1) {
      // პროცესორის ჩიპი: სხეული, ბირთვი და ფეხები
      this.stageName = 'პროცესორი'
      for (let r = 4; r <= 11; r++) for (let c = 6; c <= 17; c++) grid[r][c] = 2
      for (let r = 6; r <= 9; r++) for (let c = 9; c <= 14; c++) grid[r][c] = 3
      for (const c of [7, 9, 11, 12, 14, 16]) {
        grid[2][c] = grid[3][c] = 1
        grid[12][c] = grid[13][c] = 1
      }
      for (let r = 5; r <= 10; r += 2) {
        grid[r][3] = grid[r][4] = grid[r][5] = 1
        grid[r][18] = grid[r][19] = grid[r][20] = 1
      }
      return grid
    }

    // შემდეგი ეტაპები: შემთხვევითი სიმეტრიული "მიკროსქემა", ყოველ ეტაპზე უფრო მკვრივი და მაგარი
    const names = ['დედაპლატა', 'სერვერი', 'ღრუბელი', 'ქსელის კვანძი', 'სუპერკომპიუტერი']
    this.stageName = names[(stage - PATTERNS.length - 2) % names.length]
    const rows = Math.min(10 + Math.floor(stage / 2), MAX_ROWS - 2)
    const density = Math.min(0.5 + stage * 0.03, 0.85)
    const tough = Math.min((stage - 4) * 0.09, 0.6)
    let breakable = 0
    while (breakable < 40) {
      breakable = 0
      for (let r = 1; r <= rows; r++) {
        for (let c = 0; c < COLS / 2; c++) {
          let v = 0
          if (Math.random() < density) {
            v = 1
            if (Math.random() < tough) v++
            if (Math.random() < tough * 0.6) v++
            v = Math.min(v, 3)
            if (stage >= 7 && Math.random() < 0.04) v = STEEL
          }
          grid[r][c] = v
          grid[r][COLS - 1 - c] = v
          if (v > 0 && v !== STEEL) breakable += 2
        }
      }
    }
    return grid
  }

  private ballSpeed(): number {
    const base = Math.min(340 + (this.stage - 1) * 26, 600)
    return this.coolerTime > 0 ? base * 0.62 : base
  }

  private launch() {
    if (this.paused) return
    if (this.phase !== 'ready' && this.phase !== 'play') return
    let launched = false
    for (const b of this.balls) {
      if (!b.stuck) continue
      const a = (Math.random() - 0.5) * 0.6
      const sp = this.ballSpeed()
      b.vx = Math.sin(a) * sp
      b.vy = -Math.cos(a) * sp
      b.stuck = false
      launched = true
    }
    if (launched) this.phase = 'play'
  }

  private showToast(text: string) {
    this.toast = text
    this.toastTime = 2.2
  }

  // ---------- განახლება ----------

  private readonly loop = (now: number) => {
    if (this.disposed) return
    this.frame = requestAnimationFrame(this.loop)
    const dt = Math.min((now - this.lastTime) / 1000, 0.035)
    this.lastTime = now
    if (!this.paused) this.update(dt)
    this.draw()
  }

  private update(dt: number) {
    this.time += dt
    this.phaseTime += dt
    this.toastTime = Math.max(0, this.toastTime - dt)
    this.shake = Math.max(0, this.shake - dt * 3)

    this.updatePaddle(dt)
    this.updateParticles(dt)

    if (this.phase === 'over') return

    if (this.phase === 'clear') {
      if (this.phaseTime > 2.2) {
        this.stage++
        this.loadStage()
      }
      return
    }

    // ეფექტების ტაიმერები
    if (this.ramTime > 0) {
      this.ramTime -= dt
      if (this.ramTime <= 0) {
        this.modules = 1
        this.showToast('RAM-ის დამატებითი მოდული გაითიშა')
      }
    }
    const wasCool = this.coolerTime > 0
    this.coolerTime = Math.max(0, this.coolerTime - dt)
    if (wasCool && this.coolerTime === 0) this.normalizeSpeeds()
    this.firewallTime = Math.max(0, this.firewallTime - dt)

    if (this.combo > 0) {
      this.comboTimer -= dt
      if (this.comboTimer <= 0) this.combo = 0
    }

    for (const m of this.movers) {
      m.x = m.baseX + Math.sin(this.time * m.speed + m.phase) * m.amp
    }

    this.updateBalls(dt)
    this.updateBonuses(dt)

    if (this.balls.length === 0) this.loseLife()
    else if (!this.grid.some(row => row.some(c => c > 0 && c !== STEEL))) this.stageClear()
  }

  private updatePaddle(dt: number) {
    const targetW = MODULE_W * this.modules + (this.modules - 1) * 6
    this.paddleW += (targetW - this.paddleW) * (1 - Math.exp(-dt * 10))

    let dir = 0
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) dir -= 1
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) dir += 1
    if (dir !== 0) {
      this.paddleX += dir * 760 * dt
      this.targetX = this.paddleX
    } else {
      this.paddleX += (this.targetX - this.paddleX) * (1 - Math.exp(-dt * 28))
    }
    const half = this.paddleW / 2
    this.paddleX = clamp(this.paddleX, half + 4, FW - half - 4)

    for (const b of this.balls) {
      if (b.stuck) {
        b.x = this.paddleX
        b.y = PADDLE_Y - BALL_R - 1
      }
    }
  }

  private normalizeSpeeds() {
    const sp = this.ballSpeed()
    for (const b of this.balls) {
      if (b.stuck) continue
      const len = Math.hypot(b.vx, b.vy) || 1
      b.vx = (b.vx / len) * sp
      b.vy = (b.vy / len) * sp
    }
  }

  private updateBalls(dt: number) {
    const sp = this.ballSpeed()
    const survivors: Ball[] = []

    for (const b of this.balls) {
      if (b.stuck) {
        survivors.push(b)
        continue
      }
      const dist = Math.hypot(b.vx, b.vy) * dt
      const steps = Math.max(1, Math.ceil(dist / (BALL_R * 0.6)))
      let lost = false

      for (let i = 0; i < steps; i++) {
        b.x += (b.vx * dt) / steps
        b.y += (b.vy * dt) / steps

        // კედლები
        if (b.x < BALL_R) {
          b.x = BALL_R
          b.vx = Math.abs(b.vx)
        } else if (b.x > FW - BALL_R) {
          b.x = FW - BALL_R
          b.vx = -Math.abs(b.vx)
        }
        if (b.y < TOP + BALL_R) {
          b.y = TOP + BALL_R
          b.vy = Math.abs(b.vy)
        }

        // ფაირვოლი — ქვედა დამცავი ხაზი
        if (this.firewallTime > 0 && b.vy > 0 && b.y > FH - 30 - BALL_R) {
          b.y = FH - 30 - BALL_R
          b.vy = -Math.abs(b.vy)
          this.burst(b.x, FH - 30, 4, '#ff7a3d')
        }

        if (b.y > FH + BALL_R * 2) {
          lost = true
          break
        }

        // RAM ჩოგანი
        if (b.vy > 0 && this.hitPaddle(b, sp)) continue

        // მოძრავი ბარიერები
        let hit = false
        for (const m of this.movers) {
          if (this.collideRect(b, m.x, m.y, m.w, m.h)) {
            hit = true
            break
          }
        }
        if (hit) continue

        this.collideBricks(b)
      }

      // ზედმეტად ჰორიზონტალური სვლა არ უნდა იყოს — ბიტი არ "გაიჭედება"
      const len = Math.hypot(b.vx, b.vy) || 1
      if (Math.abs(b.vy) < len * 0.28) {
        b.vy = Math.sign(b.vy || -1) * len * 0.28
        b.vx = Math.sign(b.vx || 1) * Math.sqrt(len * len - b.vy * b.vy)
      }

      if (!lost) survivors.push(b)
      else this.burst(clamp(b.x, 10, FW - 10), FH - 6, 8, '#9fd8ff')
    }
    this.balls = survivors
  }

  private hitPaddle(b: Ball, sp: number): boolean {
    const half = this.paddleW / 2
    const top = PADDLE_Y
    if (b.y + BALL_R < top || b.y - BALL_R > top + PADDLE_H) return false
    if (b.x < this.paddleX - half - BALL_R || b.x > this.paddleX + half + BALL_R) return false

    // დარტყმის ადგილი განსაზღვრავს კუთხეს: კიდეზე — უფრო ირიბად
    const offset = clamp((b.x - this.paddleX) / (half + BALL_R), -1, 1)
    const angle = offset * 1.05
    b.vx = Math.sin(angle) * sp
    b.vy = -Math.cos(angle) * sp
    b.y = top - BALL_R - 0.5
    b.bit = b.bit === 1 ? 0 : 1
    return true
  }

  /** წრე-მართკუთხედის შეჯახება; აბრუნებს true-ს, თუ ბურთი აისხლიტა */
  private collideRect(b: Ball, x: number, y: number, w: number, h: number): boolean {
    const cx = clamp(b.x, x, x + w)
    const cy = clamp(b.y, y, y + h)
    const dx = b.x - cx
    const dy = b.y - cy
    if (dx * dx + dy * dy > BALL_R * BALL_R) return false

    if (dx === 0 && dy === 0) {
      // ცენტრი შიგნითაა — უახლოეს გვერდზე გამოვაგდოთ
      const l = b.x - x
      const r = x + w - b.x
      const t = b.y - y
      const bo = y + h - b.y
      const m = Math.min(l, r, t, bo)
      if (m === t) {
        b.y = y - BALL_R
        b.vy = -Math.abs(b.vy)
      } else if (m === bo) {
        b.y = y + h + BALL_R
        b.vy = Math.abs(b.vy)
      } else if (m === l) {
        b.x = x - BALL_R
        b.vx = -Math.abs(b.vx)
      } else {
        b.x = x + w + BALL_R
        b.vx = Math.abs(b.vx)
      }
    } else if (Math.abs(dx) > Math.abs(dy)) {
      b.vx = Math.sign(dx) * Math.abs(b.vx)
      b.x = cx + Math.sign(dx) * BALL_R
    } else {
      b.vy = Math.sign(dy) * Math.abs(b.vy)
      b.y = cy + Math.sign(dy) * BALL_R
    }
    b.bit = b.bit === 1 ? 0 : 1
    return true
  }

  private collideBricks(b: Ball) {
    const c0 = Math.floor((b.x - BALL_R) / CELL)
    const c1 = Math.floor((b.x + BALL_R) / CELL)
    const r0 = Math.floor((b.y - BALL_R - GRID_Y) / CELL)
    const r1 = Math.floor((b.y + BALL_R - GRID_Y) / CELL)
    if (r1 < 0 || r0 >= MAX_ROWS) return

    // უახლოესი აგური ჯერ — ასე ბურთი კუთხეებში ნაკლებად "ცდება"
    let best: { r: number; c: number; d: number } | null = null
    for (let r = Math.max(0, r0); r <= Math.min(MAX_ROWS - 1, r1); r++) {
      for (let c = Math.max(0, c0); c <= Math.min(COLS - 1, c1); c++) {
        if (this.grid[r][c] <= 0) continue
        const cx = c * CELL + CELL / 2
        const cy = GRID_Y + r * CELL + CELL / 2
        const d = (b.x - cx) ** 2 + (b.y - cy) ** 2
        if (!best || d < best.d) best = { r, c, d }
      }
    }
    if (!best) return
    const { r, c } = best
    if (!this.collideRect(b, c * CELL, GRID_Y + r * CELL, CELL, CELL)) return
    this.hitBrick(r, c)
  }

  private hitBrick(r: number, c: number) {
    const v = this.grid[r][c]
    const x = c * CELL + CELL / 2
    const y = GRID_Y + r * CELL + CELL / 2
    if (v === STEEL) {
      this.burst(x, y, 3, '#9aa6c6')
      return
    }

    this.combo++
    this.comboTimer = COMBO_WINDOW
    this.bestCombo = Math.max(this.bestCombo, this.combo)
    const mult = 1 + Math.floor(this.combo / COMBO_STEP)

    this.grid[r][c] = v - 1
    const color = BRICK_COLORS[v][0]
    this.burst(x, y, v - 1 === 0 ? 9 : 4, color)
    this.score += (v - 1 === 0 ? 10 : 4) * mult

    if (this.combo % COMBO_STEP === 0) {
      this.texts.push({ x, y, text: `კომბო ×${this.combo}!`, color: '#ffe066', life: 1.1 })
      this.dropBonus(x, y)
    }
  }

  private dropBonus(x: number, y: number) {
    // ბევრი ბიტის დროს კომბოები სწრაფად იზრდება — ერთდროულად მაქსიმუმ ორი ბონუსი ცვივა
    if (this.bonuses.length >= 2) return
    const pool: [BonusKind, number][] = [
      ['cpu', this.balls.length < 6 ? 34 : this.balls.length < 12 ? 12 : 3],
      ['ram', this.modules < 2 ? 30 : 12],
      ['cooler', 14],
      ['firewall', 14],
      ['battery', this.lives < MAX_LIVES ? 6 : 0],
    ]
    const total = pool.reduce((s, [, w]) => s + w, 0)
    let roll = Math.random() * total
    let kind: BonusKind = 'cpu'
    for (const [k, w] of pool) {
      roll -= w
      if (roll <= 0) {
        kind = k
        break
      }
    }
    this.bonuses.push({ kind, x: clamp(x, 24, FW - 24), y, vy: 150, spin: Math.random() * 6 })
  }

  private updateBonuses(dt: number) {
    const half = this.paddleW / 2
    this.bonuses = this.bonuses.filter(bn => {
      bn.y += bn.vy * dt
      bn.vy = Math.min(bn.vy + 60 * dt, 260)
      bn.spin += dt
      const caught =
        bn.y + 16 > PADDLE_Y &&
        bn.y - 16 < PADDLE_Y + PADDLE_H &&
        Math.abs(bn.x - this.paddleX) < half + 18
      if (caught) {
        this.applyBonus(bn)
        return false
      }
      return bn.y < FH + 30
    })
  }

  private applyBonus(bn: Bonus) {
    const info = BONUS_INFO[bn.kind]
    this.burst(bn.x, PADDLE_Y, 14, info.color)
    this.showToast(info.toast)
    this.score += 25

    if (bn.kind === 'cpu') {
      // ყოველი ბიტი სამად იყოფა
      const sp = this.ballSpeed()
      const extra: Ball[] = []
      for (const b of this.balls) {
        if (this.balls.length + extra.length >= MAX_BALLS) break
        const base = b.stuck ? -Math.PI / 2 : Math.atan2(b.vy, b.vx)
        for (const da of [-0.45, 0.45]) {
          if (this.balls.length + extra.length >= MAX_BALLS) break
          let a = base + da
          // ახალი ბიტები ყოველთვის ზემოთ მიფრინავენ
          if (Math.sin(a) > -0.3) a = -Math.PI / 2 + da
          extra.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, bit: b.bit === 1 ? 0 : 1, stuck: false })
        }
      }
      this.balls.push(...extra)
      if (extra.length > 0) this.phase = 'play'
    } else if (bn.kind === 'ram') {
      // მაქსიმუმ ორი მოდული — მეორედ დაჭერა მხოლოდ დროს აგრძელებს
      this.modules = 2
      this.ramTime = RAM_SECONDS
    } else if (bn.kind === 'cooler') {
      this.coolerTime = COOLER_SECONDS
      this.normalizeSpeeds()
    } else if (bn.kind === 'firewall') {
      this.firewallTime = FIREWALL_SECONDS
    } else {
      this.lives = Math.min(MAX_LIVES, this.lives + 1)
    }
  }

  private loseLife() {
    this.lives--
    this.combo = 0
    this.shake = 1
    this.bonuses = []
    this.coolerTime = 0
    this.firewallTime = 0
    this.modules = 1
    this.ramTime = 0
    if (this.lives <= 0) {
      this.gameOver()
      return
    }
    this.showToast('ბიტი დაიკარგა! −1 ❤')
    this.resetBalls()
    this.phase = 'ready'
  }

  private stageClear() {
    this.phase = 'clear'
    this.phaseTime = 0
    this.score += 100 * this.stage
    this.bonuses = []
    for (const b of this.balls) this.burst(b.x, b.y, 6, '#ffffff')
    this.balls = []
    for (let i = 0; i < 4; i++) this.burst(Math.random() * FW, GRID_Y + Math.random() * 200, 14, '#39ff6a')
  }

  private gameOver() {
    this.phase = 'over'
    this.balls = []
    PingPongDong.best = Math.max(PingPongDong.best, this.score)
    ;(this.modal.querySelector('.ppd-big') as HTMLElement).textContent = String(this.score)
    ;(this.modal.querySelector('.ppd-info') as HTMLElement).innerHTML =
      `მიაღწიე ეტაპს: <b>${this.stage}</b><br>საუკეთესო კომბო: <b>${this.bestCombo}</b><br>რეკორდი: <b>${PingPongDong.best}</b>`
    window.setTimeout(() => {
      if (!this.disposed && this.phase === 'over') this.modal.hidden = false
    }, 700)
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 40 + Math.random() * 200
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.4 + Math.random() * 0.4,
        max: 0.8,
        color,
        size: 2 + Math.random() * 3,
      })
    }
    if (this.particles.length > 260) this.particles.splice(0, this.particles.length - 260)
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 320 * dt
    }
    this.particles = this.particles.filter(p => p.life > 0)
    for (const t of this.texts) {
      t.life -= dt
      t.y -= 40 * dt
    }
    this.texts = this.texts.filter(t => t.life > 0)
  }

  // ---------- ხატვა ----------

  private draw() {
    const ctx = this.ctx
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const s = this.dpr * this.scale
    const sx = this.shake > 0 ? (Math.random() - 0.5) * 8 * this.shake : 0
    const sy = this.shake > 0 ? (Math.random() - 0.5) * 8 * this.shake : 0
    ctx.setTransform(s, 0, 0, s, (this.offX + sx) * this.dpr, (this.offY + sy) * this.dpr)

    this.drawBackground()
    this.drawBricks()
    this.drawMovers()
    if (this.firewallTime > 0) this.drawFirewall()
    this.drawBonuses()
    this.drawPaddle()
    this.drawBalls()
    this.drawParticles()
    this.drawHud()
    this.drawOverlayText()
  }

  private drawBackground() {
    const ctx = this.ctx
    const g = ctx.createLinearGradient(0, 0, 0, FH)
    g.addColorStop(0, '#0f2266')
    g.addColorStop(1, '#0a1748')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, FW, FH)

    // სუსტი მიკროსქემის ბადე
    ctx.strokeStyle = 'rgba(80, 140, 255, 0.07)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = CELL; x < FW; x += CELL * 2) {
      ctx.moveTo(x, TOP)
      ctx.lineTo(x, FH)
    }
    for (let y = GRID_Y; y < FH; y += CELL * 2) {
      ctx.moveTo(0, y)
      ctx.lineTo(FW, y)
    }
    ctx.stroke()

    // ჩამომდინარე ბინარული სვეტები
    ctx.font = 'bold 13px monospace'
    ctx.textAlign = 'center'
    for (let i = 0; i < 9; i++) {
      const x = 30 + i * 60
      const speed = 22 + ((i * 37) % 23)
      for (let k = 0; k < 6; k++) {
        const y = TOP + (((this.time * speed + k * 120 + i * 53) % (FH - TOP)) | 0)
        ctx.fillStyle = 'rgba(120, 180, 255, 0.07)'
        ctx.fillText(((i + k) * 7) % 3 === 0 ? '0' : '1', x, y)
      }
    }

    // ზედა ფოლადის კედელი (როგორც პიქსელური ზოლი)
    for (let x = 0; x < FW; x += 12) {
      ctx.fillStyle = '#3a4460'
      ctx.fillRect(x + 1, WALL_Y, 10, 10)
      ctx.fillStyle = '#56628a'
      ctx.fillRect(x + 1, WALL_Y, 10, 2)
    }
  }

  private drawBrick(x: number, y: number, v: number) {
    const ctx = this.ctx
    const [main, light, dark] = BRICK_COLORS[v]
    const size = CELL - 2
    ctx.fillStyle = dark
    ctx.fillRect(x + 1, y + 1, size, size)
    ctx.fillStyle = main
    ctx.fillRect(x + 1, y + 1, size - 3, size - 3)
    ctx.fillStyle = light
    ctx.fillRect(x + 1, y + 1, size - 3, 3)
    ctx.fillRect(x + 1, y + 1, 3, size - 3)
    if (v === STEEL) {
      ctx.fillStyle = '#262c3d'
      ctx.fillRect(x + 8, y + 8, 4, 4)
    }
  }

  private drawBricks() {
    for (let r = 0; r < MAX_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = this.grid[r][c]
        if (v > 0) this.drawBrick(c * CELL, GRID_Y + r * CELL, v)
      }
    }
  }

  private drawMovers() {
    const ctx = this.ctx
    for (const m of this.movers) {
      for (let x = m.x; x < m.x + m.w - 1; x += 12) {
        const w = Math.min(10, m.x + m.w - x - 1)
        ctx.fillStyle = '#4a5470'
        ctx.fillRect(x + 1, m.y, w, m.h)
        ctx.fillStyle = '#7a86a6'
        ctx.fillRect(x + 1, m.y, w, 3)
      }
    }
  }

  private drawFirewall() {
    const ctx = this.ctx
    const y = FH - 30
    const fade = this.firewallTime < 2.5 ? (Math.sin(this.time * 18) > 0 ? 1 : 0.3) : 1
    ctx.globalAlpha = fade
    ctx.fillStyle = 'rgba(255, 122, 61, 0.25)'
    ctx.fillRect(0, y, FW, 8)
    for (let x = 0; x < FW; x += 18) {
      const flick = 4 + Math.sin(this.time * 12 + x) * 3
      ctx.fillStyle = '#ff7a3d'
      ctx.fillRect(x + 2, y - flick, 14, 4 + flick)
      ctx.fillStyle = '#ffd34f'
      ctx.fillRect(x + 6, y - flick + 2, 6, 3)
    }
    ctx.globalAlpha = 1
  }

  /** RAM მოდული: მწვანე დაფა, შავი ჩიპები, ოქროსფერი კონტაქტები და ჭრილი */
  private drawRamStick(x: number, y: number, w: number, h: number, scale = 1) {
    const ctx = this.ctx
    roundRect(ctx, x, y, w, h, 3 * scale)
    ctx.fillStyle = '#1d8f4e'
    ctx.fill()
    ctx.strokeStyle = '#0c4d29'
    ctx.lineWidth = 2 * scale
    ctx.stroke()

    // ჩიპები
    const chips = Math.max(2, Math.round(w / (26 * scale)))
    const gap = w / chips
    for (let i = 0; i < chips; i++) {
      const cx = x + i * gap + gap * 0.18
      ctx.fillStyle = '#14161c'
      ctx.fillRect(cx, y + 3 * scale, gap * 0.64, h * 0.42)
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.fillRect(cx, y + 3 * scale, gap * 0.64, 1.5 * scale)
    }

    // კონტაქტები და ჭრილი
    const pinY = y + h - 6 * scale
    const notch = x + w * 0.42
    for (let px = x + 3 * scale; px < x + w - 4 * scale; px += 4 * scale) {
      if (Math.abs(px - notch) < 3 * scale) continue
      ctx.fillStyle = '#f2c33a'
      ctx.fillRect(px, pinY, 2.4 * scale, 5 * scale)
    }
    ctx.fillStyle = '#0a1748'
    ctx.fillRect(notch - 2 * scale, y + h - 5 * scale, 4 * scale, 5 * scale)
  }

  private drawPaddle() {
    const ctx = this.ctx
    const w = this.paddleW
    const x = this.paddleX - w / 2
    const y = PADDLE_Y

    // ნათება ქვემოთ
    ctx.fillStyle = 'rgba(57, 255, 106, 0.16)'
    roundRect(ctx, x - 6, y - 4, w + 12, PADDLE_H + 10, 10)
    ctx.fill()

    const blink = this.ramTime > 0 && this.ramTime < 3 && Math.sin(this.time * 20) < 0
    if (w > MODULE_W + 8 && !blink) {
      // ორი მოდული გვერდიგვერდ
      const each = (w - 6) / 2
      this.drawRamStick(x, y, each, PADDLE_H)
      this.drawRamStick(x + each + 6, y, each, PADDLE_H)
    } else {
      this.drawRamStick(this.paddleX - Math.min(w, MODULE_W) / 2, y, Math.min(w, MODULE_W), PADDLE_H)
    }
  }

  private drawBalls() {
    const ctx = this.ctx
    for (const b of this.balls) {
      const sp = Math.hypot(b.vx, b.vy)
      if (sp > 1) {
        // კუდი
        const len = 46
        const tx = b.x - (b.vx / sp) * len
        const ty = b.y - (b.vy / sp) * len
        const g = ctx.createLinearGradient(b.x, b.y, tx, ty)
        g.addColorStop(0, 'rgba(255,255,255,0.75)')
        g.addColorStop(1, 'rgba(160,220,255,0)')
        ctx.strokeStyle = g
        ctx.lineWidth = BALL_R * 1.3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(b.x, b.y)
        ctx.lineTo(tx, ty)
        ctx.stroke()
      }
      ctx.drawImage(this.glowSprite, b.x - 26, b.y - 26, 52, 52)
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0d1f5c'
      ctx.font = 'bold 13px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(b.bit), b.x, b.y + 1)
    }
    ctx.textBaseline = 'alphabetic'
  }

  private drawBonuses() {
    const ctx = this.ctx
    for (const bn of this.bonuses) {
      const info = BONUS_INFO[bn.kind]
      ctx.save()
      ctx.translate(bn.x, bn.y)
      // ნათების რგოლი
      ctx.strokeStyle = rgba(info.color, 0.55 + Math.sin(this.time * 8) * 0.25)
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, 22, 0, Math.PI * 2)
      ctx.stroke()

      if (bn.kind === 'cpu') this.drawCpuIcon()
      else if (bn.kind === 'ram') this.drawRamStick(-17, -7, 34, 14, 0.5)
      else if (bn.kind === 'cooler') this.drawFanIcon(bn.spin)
      else if (bn.kind === 'firewall') this.drawFirewallIcon()
      else this.drawBatteryIcon()

      ctx.fillStyle = info.color
      ctx.font = 'bold 11px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(info.label, 0, 36)
      ctx.restore()
    }
  }

  private drawCpuIcon() {
    const ctx = this.ctx
    ctx.fillStyle = '#c0c7d6'
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect(i * 5 - 1, -17, 2, 5)
      ctx.fillRect(i * 5 - 1, 12, 2, 5)
      ctx.fillRect(-17, i * 5 - 1, 5, 2)
      ctx.fillRect(12, i * 5 - 1, 5, 2)
    }
    ctx.fillStyle = '#1b2233'
    ctx.fillRect(-13, -13, 26, 26)
    ctx.fillStyle = '#43e7ff'
    ctx.fillRect(-8, -8, 16, 16)
    ctx.fillStyle = '#0b1a3a'
    ctx.font = 'bold 8px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('CPU', 0, 3)
  }

  private drawFanIcon(spin: number) {
    const ctx = this.ctx
    ctx.fillStyle = '#1b2233'
    ctx.fillRect(-14, -14, 28, 28)
    ctx.save()
    ctx.rotate(spin * 10)
    ctx.fillStyle = '#9fd8ff'
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2)
      ctx.beginPath()
      ctx.ellipse(0, -6, 4, 7, 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(0, 0, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawFirewallIcon() {
    const ctx = this.ctx
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const off = r % 2 === 0 ? 0 : -5
        ctx.fillStyle = '#c4462a'
        ctx.fillRect(-15 + c * 10 + off, -2 + r * 6, 9, 5)
      }
    }
    ctx.fillStyle = '#ff7a3d'
    ctx.beginPath()
    ctx.moveTo(-10, -3)
    ctx.quadraticCurveTo(-8, -14, 0, -18)
    ctx.quadraticCurveTo(2, -10, 8, -12)
    ctx.quadraticCurveTo(12, -6, 10, -3)
    ctx.fill()
  }

  private drawBatteryIcon() {
    const ctx = this.ctx
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(-6, -16, 12, 4)
    roundRect(ctx, -11, -12, 22, 28, 3)
    ctx.fillStyle = '#1b2233'
    ctx.fill()
    ctx.fillStyle = '#ff4d6d'
    ctx.fillRect(-7, -8, 14, 20)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('+', 0, 6)
  }

  private drawParticles() {
    const ctx = this.ctx
    for (const p of this.particles) {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1)
      ctx.fillStyle = p.color
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
    }
    ctx.globalAlpha = 1
    ctx.textAlign = 'center'
    for (const t of this.texts) {
      ctx.globalAlpha = clamp(t.life / 0.6, 0, 1)
      ctx.font = 'bold 18px Arial, sans-serif'
      ctx.lineWidth = 4
      ctx.strokeStyle = '#0a1748'
      ctx.strokeText(t.text, t.x, t.y)
      ctx.fillStyle = t.color
      ctx.fillText(t.text, t.x, t.y)
    }
    ctx.globalAlpha = 1
  }

  private drawHeart(x: number, y: number, full: boolean) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, y)
    ctx.beginPath()
    ctx.moveTo(0, 7)
    ctx.bezierCurveTo(-13, -2, -9, -12, 0, -5)
    ctx.bezierCurveTo(9, -12, 13, -2, 0, 7)
    ctx.fillStyle = full ? '#ff4d6d' : '#1a2550'
    ctx.fill()
    ctx.strokeStyle = full ? '#ffb3c1' : '#33427a'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()
  }

  private drawHud() {
    const ctx = this.ctx
    ctx.fillStyle = '#081440'
    ctx.fillRect(0, 0, FW, HUD_H)

    // სიცოცხლეები
    const shown = Math.max(3, this.lives)
    for (let i = 0; i < shown; i++) this.drawHeart(26 + i * 26, 30, i < this.lives)

    ctx.fillStyle = '#9fb4e8'
    ctx.font = 'bold 13px Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`ქულა: ${this.score}`, 14, 62)

    // დონე
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 22px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`დონე: ${this.stage}`, FW / 2 - 30, 36)
    ctx.fillStyle = '#7f95c9'
    ctx.font = '12px Arial, sans-serif'
    ctx.fillText(this.stageName, FW / 2 - 30, 56)

    // მრგვალი ღილაკები
    for (const b of this.buttons) {
      ctx.fillStyle = '#21d4e6'
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#062033'
      ctx.strokeStyle = '#062033'
      ctx.lineWidth = 3.5
      ctx.lineCap = 'round'
      if (b.id === 'restart') {
        ctx.beginPath()
        ctx.arc(b.x, b.y, 10, -Math.PI * 0.35, Math.PI * 1.45)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(b.x + 3, b.y - 15)
        ctx.lineTo(b.x + 11, b.y - 9)
        ctx.lineTo(b.x + 2, b.y - 5)
        ctx.fill()
      } else if (b.id === 'pause') {
        if (this.paused) {
          ctx.beginPath()
          ctx.moveTo(b.x - 6, b.y - 10)
          ctx.lineTo(b.x + 10, b.y)
          ctx.lineTo(b.x - 6, b.y + 10)
          ctx.fill()
        } else {
          ctx.fillRect(b.x - 8, b.y - 10, 5, 20)
          ctx.fillRect(b.x + 3, b.y - 10, 5, 20)
        }
      } else {
        ctx.beginPath()
        ctx.moveTo(b.x - 8, b.y - 8)
        ctx.lineTo(b.x + 8, b.y + 8)
        ctx.moveTo(b.x + 8, b.y - 8)
        ctx.lineTo(b.x - 8, b.y + 8)
        ctx.stroke()
      }
    }

    // აქტიური ეფექტები კედლის ქვემოთ
    const effects: [string, number, number, string][] = []
    if (this.ramTime > 0) effects.push(['RAM ×2', this.ramTime, RAM_SECONDS, '#39ff6a'])
    if (this.coolerTime > 0) effects.push(['ქულერი', this.coolerTime, COOLER_SECONDS, '#9fd8ff'])
    if (this.firewallTime > 0) effects.push(['ფაირვოლი', this.firewallTime, FIREWALL_SECONDS, '#ff7a3d'])
    effects.forEach(([label, t, max, color], i) => {
      const x = 10 + i * 112
      const y = TOP + 6
      ctx.fillStyle = 'rgba(8, 20, 64, 0.8)'
      roundRect(ctx, x, y, 104, 18, 9)
      ctx.fill()
      ctx.fillStyle = rgba(color, 0.35)
      roundRect(ctx, x, y, 104 * clamp(t / max, 0, 1), 18, 9)
      ctx.fill()
      ctx.fillStyle = color
      ctx.font = 'bold 11px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${label} ${Math.ceil(t)}წ`, x + 52, y + 13)
    })

    // კომბოს მთვლელი
    if (this.combo >= 2) {
      const next = COMBO_STEP - (this.combo % COMBO_STEP)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#ffe066'
      ctx.font = 'bold 16px Arial, sans-serif'
      ctx.fillText(`კომბო ×${this.combo}`, FW - 12, TOP + 20)
      ctx.fillStyle = '#c9b45a'
      ctx.font = '11px Arial, sans-serif'
      ctx.fillText(`ბონუსამდე: ${next}`, FW - 12, TOP + 35)
    }
  }

  private drawCentered(text: string, y: number, size: number, color: string) {
    const ctx = this.ctx
    ctx.font = `bold ${size}px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.lineWidth = 5
    ctx.strokeStyle = '#06103a'
    ctx.strokeText(text, FW / 2, y)
    ctx.fillStyle = color
    ctx.fillText(text, FW / 2, y)
  }

  private drawOverlayText() {
    if (this.toastTime > 0 && this.phase !== 'clear') {
      this.ctx.globalAlpha = clamp(this.toastTime / 0.4, 0, 1)
      this.drawCentered(this.toast, PADDLE_Y - 150, 18, '#e8f4ff')
      this.ctx.globalAlpha = 1
    }

    if (this.phase === 'ready' && !this.paused) {
      const pulse = 0.55 + Math.sin(this.time * 4) * 0.35
      this.ctx.globalAlpha = pulse
      this.drawCentered('SPACE ან დაწკაპუნება — ბიტის გაშვება', PADDLE_Y - 70, 15, '#9fe8ff')
      this.drawCentered('მაუსი / ← → — RAM-ის მოძრაობა', PADDLE_Y - 48, 13, '#7f95c9')
      this.ctx.globalAlpha = 1
    }

    if (this.phase === 'clear') {
      this.drawCentered(`ეტაპი ${this.stage} დასრულდა! 🎉`, FH / 2 - 20, 28, '#39ff6a')
      this.drawCentered(`შემდეგი: ეტაპი ${this.stage + 1} — უფრო სწრაფი ბიტები`, FH / 2 + 16, 15, '#e8f4ff')
    }

    if (this.paused) {
      this.ctx.fillStyle = 'rgba(4, 8, 24, 0.55)'
      this.ctx.fillRect(0, HUD_H, FW, FH - HUD_H)
      this.drawCentered('პაუზა', FH / 2 - 10, 34, '#ffffff')
      this.drawCentered('P ან დაწკაპუნება — გაგრძელება', FH / 2 + 24, 15, '#9fb4e8')
    }
  }

  // ---------- დახურვა ----------

  private close() {
    if (this.disposed) return

    this.disposed = true
    cancelAnimationFrame(this.frame)

    window.removeEventListener('keydown', this.keyDownHandler, true)
    window.removeEventListener('keyup', this.keyUpHandler, true)
    window.removeEventListener('resize', this.resizeHandler)

    this.root.remove()
    this.onClose?.()
  }
}
