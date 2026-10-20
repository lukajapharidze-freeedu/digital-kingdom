export type FlappyFloppyOptions = {
  onClose?: () => void
}

type Phase = 'ready' | 'play' | 'dead'

type Theme = {
  name: string
  sky: [string, string, string]
  accent: string
  kind: 'circuit' | 'binary' | 'city' | 'server' | 'storm' | 'tunnel'
}

type Gate = {
  x: number
  /** ხვრელის ცენტრი (საბაზო) */
  baseY: number
  gapH: number
  /** მოძრავი ჭიშკრისთვის: რხევის ამპლიტუდა და ფაზა */
  amp: number
  phase: number
  passed: boolean
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

// ---------- მუდმივები (ლოგიკური ერთეულები: სიმაღლე ყოველთვის 720) ----------

const H = 720
const FLOOR_H = 64
const FLOOR_Y = H - FLOOR_H
const GATE_W = 78
const FLOPPY_SIZE = 46
const HIT = 17 // დისკეტის შეჯახების ნახევარ-ზომა (ვიზუალზე ოდნავ პატარა)

const PHYS = {
  gravity: 1500,
  flap: 430,
  maxFall: 640,
}

/** ყოველ რამდენ ქულაზე იცვლება ფონი */
const POINTS_PER_THEME = 10

// ნათება (shadowBlur) მძიმეა სუსტ კომპიუტერებზე. true-ზე დააყენე, თუ ლამაზი ნათება გინდა.
const GLOW = false
const fxBlur = (n: number): number => (GLOW ? n : 0)
const TRANSITION_SECONDS = 2.4

const THEMES: Theme[] = [
  { name: 'ჩიპის ველი', sky: ['#06132b', '#0a1d3f', '#02040a'], accent: '#43e7ff', kind: 'circuit' },
  { name: 'ბინარული წვიმა', sky: ['#1d0833', '#2a0b4a', '#080816'], accent: '#ff4fd8', kind: 'binary' },
  { name: 'ქსელის ქალაქი', sky: ['#06203a', '#0a1a3a', '#02040a'], accent: '#5ef2c3', kind: 'city' },
  { name: 'სერვერების დარბაზი', sky: ['#1d1405', '#2a1a08', '#050302'], accent: '#ffd34f', kind: 'server' },
  { name: 'ციფრული ქარიშხალი', sky: ['#0b0b1f', '#12122e', '#010103'], accent: '#7df9ff', kind: 'storm' },
  { name: 'კვანტური გვირაბი', sky: ['#12062e', '#1c0a45', '#02010a'], accent: '#b06bff', kind: 'tunnel' },
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

function slot(i: number, gap: number, offset: number, count: number): { x: number; id: number } {
  const span = gap * count
  const raw = i * gap - offset
  const cycle = Math.floor(raw / span)
  return { x: raw - cycle * span - gap, id: i + cycle * count }
}

function ease(t: number): number {
  const k = Math.max(0, Math.min(1, t))
  return k * k * (3 - 2 * k)
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export class FlappyFloppy {
  /** რეკორდი ინახება მხოლოდ გვერდის ამჟამინდელ გახსნამდე */
  private static best = 0

  private readonly onClose: (() => void) | undefined
  private root!: HTMLDivElement
  private canvas!: HTMLCanvasElement
  private ctx!: CanvasRenderingContext2D
  private modal!: HTMLDivElement

  private frame = 0
  private lastTime = 0
  private disposed = false

  private phase: Phase = 'ready'
  private time = 0
  private deadTime = 0
  private scroll = 0

  // სამყარო (ლოგიკური კოორდინატები)
  private viewScale = 1
  private logicalW = 1280
  private floppyX = 380
  private floppyY = H / 2
  private vy = 0
  private angle = 0

  private gates: Gate[] = []
  private nextGateX = 0
  private lastCenter = H / 2 - 40

  private score = 0
  private scorePulse = 0
  private themeFrom = 0
  private themeTo = 0
  private transT = 1
  private banner = 0
  private bannerText = ''

  private particles: Particle[] = []
  private trailTimer = 0
  private flash = 0

  constructor(options: FlappyFloppyOptions = {}) {
    this.onClose = options.onClose
    this.build()
    this.resetRun()
    this.lastTime = performance.now()
    this.frame = requestAnimationFrame(this.loop)
  }

  // ---------- DOM ----------

  private build() {
    this.root = document.createElement('div')
    this.root.className = 'ff-root'
    this.root.innerHTML = `
      <style>
        .ff-root { position: fixed; inset: 0; z-index: 2000; background: #02040a; overflow: hidden;
          font-family: Arial, sans-serif; user-select: none; touch-action: none; }
        .ff-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        .ff-exit { position: absolute; top: 16px; right: 16px; z-index: 5; padding: 10px 16px; border: 0;
          border-radius: 12px; background: rgba(21, 42, 64, 0.85); color: #fff; font-size: 15px;
          font-weight: bold; cursor: pointer; }
        .ff-exit:hover { background: rgba(40, 70, 104, 0.95); }
        .ff-modal { position: absolute; inset: 0; z-index: 6; display: flex; align-items: center;
          justify-content: center; background: rgba(4, 8, 18, 0.62); backdrop-filter: blur(5px); }
        .ff-modal[hidden] { display: none; }
        .ff-card { width: min(460px, 92vw); padding: 28px; border-radius: 22px; text-align: center;
          background: linear-gradient(145deg, #121c36, #0b1226); color: #e8f4ff;
          border: 2px solid rgba(120, 190, 255, 0.45); box-shadow: 0 20px 70px rgba(0,0,0,0.55); }
        .ff-card h2 { margin: 0 0 6px; font-size: 26px; }
        .ff-big { font-size: 56px; font-weight: 900; margin: 6px 0; color: #7df9ff; }
        .ff-small { color: #9fb4d0; font-size: 14px; margin-top: 12px; }
        .ff-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 14px; }
        .ff-btn { border: 0; border-radius: 12px; padding: 12px 20px; min-width: 130px; font-size: 16px;
          font-weight: bold; color: #fff; cursor: pointer; background: #27834a; }
        .ff-btn.ff-secondary { background: #315b88; }
      </style>
      <canvas class="ff-canvas"></canvas>
      <button class="ff-exit" type="button">✕ გასვლა (Esc)</button>
      <div class="ff-modal" hidden>
        <div class="ff-card">
          <h2>💾 დისკეტა გაფუჭდა!</h2>
          <div class="ff-big">0</div>
          <div class="ff-best"></div>
          <div class="ff-row">
            <button class="ff-btn ff-again" type="button">↻ თავიდან</button>
            <button class="ff-btn ff-secondary ff-leave" type="button">გასვლა</button>
          </div>
          <div class="ff-small">SPACE / Enter — თავიდან დაწყება</div>
        </div>
      </div>
    `
    document.body.appendChild(this.root)

    this.canvas = this.root.querySelector('.ff-canvas') as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
    this.modal = this.root.querySelector('.ff-modal') as HTMLDivElement

    this.root.querySelector('.ff-exit')!.addEventListener('click', () => this.close())
    this.root.querySelector('.ff-leave')!.addEventListener('click', () => this.close())
    this.root.querySelector('.ff-again')!.addEventListener('click', () => this.restart())

    this.root.addEventListener('pointerdown', this.pointerHandler)
    window.addEventListener('keydown', this.keyHandler, true)
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

    // სიმაღლე ყოველთვის 720 ლოგიკური ერთეულია — სირთულე ყველა ეკრანზე ერთნაირია
    this.viewScale = realH / H
    this.logicalW = realW / this.viewScale
    this.floppyX = clamp(this.logicalW * 0.3, 120, 460)
    this.ctx.setTransform(dpr * this.viewScale, 0, 0, dpr * this.viewScale, 0, 0)
  }

  // ---------- შეყვანა ----------

  private readonly keyHandler = (event: KeyboardEvent) => {
    if (event.code === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      this.close()
      return
    }

    if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
      event.preventDefault()
      event.stopPropagation()
      if (!event.repeat) this.flap()
      return
    }

    if (event.code === 'Enter' && this.phase === 'dead') {
      event.preventDefault()
      this.restart()
    }
  }

  private readonly pointerHandler = (event: PointerEvent) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('button')) return
    this.flap()
  }

  /** დაჭერა: ზემოთ ასვლა. დასაწყისში თამაშს იწყებს, წაგების შემდეგ — თავიდან იწყებს. */
  private flap() {
    if (this.disposed) return

    if (this.phase === 'ready') {
      this.phase = 'play'
      this.vy = -PHYS.flap
      return
    }

    if (this.phase === 'play') {
      this.vy = -PHYS.flap
      this.burst(this.floppyX - 12, this.floppyY + 14, 3, THEMES[this.themeTo].accent)
      return
    }

    // წაგებულია: შემთხვევითი ორმაგი დაჭერის თავიდან ასაცილებლად მცირე პაუზა
    if (this.deadTime > 0.55) this.restart()
  }

  // ---------- თამაშის მდგომარეობა ----------

  private resetRun() {
    this.phase = 'ready'
    this.time = 0
    this.deadTime = 0
    this.score = 0
    this.scorePulse = 0
    this.vy = 0
    this.angle = 0
    this.floppyY = H / 2
    this.gates = []
    this.nextGateX = this.logicalW + 260
    this.lastCenter = H / 2 - 40
    this.themeFrom = 0
    this.themeTo = 0
    this.transT = 1
    this.banner = 0
    this.particles = []
    this.flash = 0
    this.modal.hidden = true
  }

  private restart() {
    this.resetRun()
  }

  private speed(): number {
    return 220 + Math.min(this.score, 40) * 2.2
  }

  private makeGate(x: number): Gate {
    const s = this.score
    const gapH = Math.max(185, 252 - s * 1.7)
    const margin = 70
    const minC = margin + gapH / 2
    const maxC = FLOOR_Y - margin - gapH / 2
    const span = maxC - minC

    // ზონა: ზემოთ / შუაში / ქვემოთ
    const zone = Math.floor(Math.random() * 3)
    let center = minC + span * (zone / 2) + (Math.random() - 0.5) * span * 0.2

    // წინა ჭიშკართან შედარებით ზედმეტად დიდი გადახტომა არ უნდა იყოს (ასვლა უფრო რთულია, ვიდრე ჩამოსვლა)
    center = clamp(center, this.lastCenter - 190, this.lastCenter + 260)
    center = clamp(center, minC, maxC)

    let amp = 0
    if (s >= 20 && Math.random() < 0.4) {
      amp = Math.min(24 + Math.random() * 16, center - minC, maxC - center)
      amp = Math.max(0, amp)
    }

    const rise = Math.max(0, this.lastCenter - center)
    this.lastCenter = center

    const gate: Gate = { x, baseY: center, gapH, amp, phase: Math.random() * Math.PI * 2, passed: false }
    // შემდეგი ჭიშკრის დაშორება: ასვლისას მეტი დრო სჭირდება
    this.nextGateX = x + GATE_W + (330 - Math.min(s, 40) * 1.4) + rise * 0.9
    return gate
  }

  private gateCenter(g: Gate): number {
    return g.baseY + (g.amp > 0 ? Math.sin(this.time * 2.4 + g.phase) * g.amp : 0)
  }

  private update(dt: number) {
    this.time += dt
    if (this.scorePulse > 0) this.scorePulse = Math.max(0, this.scorePulse - dt * 3)
    if (this.banner > 0) this.banner = Math.max(0, this.banner - dt)
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.5)
    if (this.transT < 1) this.transT = Math.min(1, this.transT + dt / TRANSITION_SECONDS)

    this.updateParticles(dt)

    if (this.phase === 'ready') {
      this.scroll += 60 * dt
      this.floppyY = H / 2 + Math.sin(this.time * 3) * 10
      this.angle = Math.sin(this.time * 3) * 0.05
      return
    }

    if (this.phase === 'dead') {
      this.deadTime += dt
      this.vy = Math.min(PHYS.maxFall, this.vy + PHYS.gravity * dt)
      this.floppyY = Math.min(FLOOR_Y - HIT, this.floppyY + this.vy * dt)
      this.angle = Math.min(1.4, this.angle + dt * 5)
      return
    }

    const speed = this.speed()
    this.scroll += speed * dt

    // ფიზიკა
    this.vy = Math.min(PHYS.maxFall, this.vy + PHYS.gravity * dt)
    this.floppyY += this.vy * dt
    this.angle = clamp(this.vy / 650, -0.6, 1.1)

    // ჭერი: უბრალოდ აჩერებს (წაგება არ არის)
    if (this.floppyY - HIT < 0) {
      this.floppyY = HIT
      if (this.vy < 0) this.vy = 0
    }

    // კვალი
    this.trailTimer -= dt
    if (this.trailTimer <= 0) {
      this.trailTimer = 0.05
      this.particles.push({
        x: this.floppyX - 16,
        y: this.floppyY + (Math.random() - 0.5) * 14,
        vx: -speed * 0.35,
        vy: (Math.random() - 0.5) * 20,
        life: 0.45,
        max: 0.45,
        color: THEMES[this.themeTo].accent,
        size: 3,
      })
    }

    // ჭიშკრები
    for (const g of this.gates) g.x -= speed * dt
    this.nextGateX -= speed * dt
    while (this.nextGateX < this.logicalW + 120 && this.gates.length < 12) {
      this.gates.push(this.makeGate(this.nextGateX))
    }
    this.gates = this.gates.filter(g => g.x + GATE_W > -120)

    // ქულა
    for (const g of this.gates) {
      if (!g.passed && g.x + GATE_W < this.floppyX - HIT) {
        g.passed = true
        this.score++
        this.scorePulse = 1
        if (this.score % POINTS_PER_THEME === 0) this.startTransition()
      }
    }

    // შეჯახება
    if (this.floppyY + HIT >= FLOOR_Y) {
      this.die()
      return
    }
    const x0 = this.floppyX - HIT
    const x1 = this.floppyX + HIT
    const y0 = this.floppyY - HIT
    const y1 = this.floppyY + HIT
    for (const g of this.gates) {
      if (x1 < g.x - 4 || x0 > g.x + GATE_W + 4) continue
      const c = this.gateCenter(g)
      if (y0 < c - g.gapH / 2 || y1 > c + g.gapH / 2) {
        this.die()
        return
      }
    }
  }

  private startTransition() {
    this.themeFrom = this.themeTo
    this.themeTo = (this.themeTo + 1) % THEMES.length
    this.transT = 0
    this.banner = 2.6
    this.bannerText = `ახალი გარემო: ${THEMES[this.themeTo].name}`
    this.flash = 0.35
  }

  private die() {
    this.phase = 'dead'
    this.deadTime = 0
    this.vy = -180
    this.burst(this.floppyX, this.floppyY, 22, '#ff4d6d')
    this.flash = 0.6

    FlappyFloppy.best = Math.max(FlappyFloppy.best, this.score)
    ;(this.modal.querySelector('.ff-big') as HTMLElement).textContent = String(this.score)
    ;(this.modal.querySelector('.ff-best') as HTMLElement).textContent = `რეკორდი: ${FlappyFloppy.best}`

    window.setTimeout(() => {
      if (!this.disposed && this.phase === 'dead') this.modal.hidden = false
    }, 650)
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 40 + Math.random() * 220
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.5 + Math.random() * 0.4,
        max: 0.9,
        color,
        size: 2 + Math.random() * 3,
      })
    }
    if (this.particles.length > 220) this.particles.splice(0, this.particles.length - 220)
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 300 * dt
    }
    this.particles = this.particles.filter(p => p.life > 0)
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
    const W = this.logicalW
    const e = ease(this.transT)
    const from = THEMES[this.themeFrom]
    const to = THEMES[this.themeTo]

    ctx.clearRect(0, 0, W + 2, H + 2)

    // ფონი: წინა თემა სრულად, ახალი — თანდათან ჩნდება
    this.drawTheme(from, 1, W)
    if (e < 1 || from !== to) {
      if (from !== to) this.drawTheme(to, e, W)
    }

    const accent = mixHex(from.accent, to.accent, e)

    this.drawGates(accent, W)
    this.drawFloor(accent, W)
    this.drawParticles()
    this.drawFloppy(accent)
    this.drawHud(accent, W)

    if (this.flash > 0) {
      ctx.fillStyle = rgba(this.phase === 'dead' ? '#ff4d6d' : accent, this.flash * 0.35)
      ctx.fillRect(0, 0, W, H)
    }
  }

  private drawTheme(theme: Theme, alpha: number, W: number) {
    if (alpha <= 0.002) return
    const ctx = this.ctx
    ctx.save()
    ctx.globalAlpha = alpha

    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, theme.sky[0])
    g.addColorStop(0.6, theme.sky[1])
    g.addColorStop(1, theme.sky[2])
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    switch (theme.kind) {
      case 'circuit':
        this.bgCircuit(theme, W)
        break
      case 'binary':
        this.bgBinary(theme, W)
        break
      case 'city':
        this.bgCity(theme, W)
        break
      case 'server':
        this.bgServer(theme, W)
        break
      case 'storm':
        this.bgStorm(theme, W)
        break
      case 'tunnel':
        this.bgTunnel(theme, W)
        break
    }
    ctx.restore()
  }

  private bgCircuit(theme: Theme, W: number) {
    const ctx = this.ctx
    const t = this.time
    ctx.strokeStyle = rgba(theme.accent, 0.07)
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = -mod(this.scroll * 0.15, 64); x < W; x += 64) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, FLOOR_Y)
    }
    for (let y = 0; y < FLOOR_Y; y += 64) {
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
    }
    ctx.stroke()

    // მიკროსქემის ბილიკები
    ctx.save()
    ctx.lineWidth = 2
    ctx.strokeStyle = rgba(theme.accent, 0.22)
    ctx.setLineDash([12, 14])
    ctx.lineDashOffset = this.scroll * 0.4
    const count = Math.ceil(W / 260) + 3
    for (let i = 0; i < count; i++) {
      const { x, id } = slot(i, 260, this.scroll * 0.3, count)
      const y = 60 + hash(id) * (FLOOR_Y - 140)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + 90, y)
      ctx.lineTo(x + 130, y + (hash(id + 3) - 0.5) * 90)
      ctx.lineTo(x + 260, y + (hash(id + 3) - 0.5) * 90)
      ctx.stroke()
    }
    ctx.restore()

    // ჩიპების სილუეტები
    const chips = Math.ceil(W / 380) + 3
    for (let i = 0; i < chips; i++) {
      const { x, id } = slot(i, 380, this.scroll * 0.2, chips)
      const w = 110 + hash(id) * 80
      const h = 70 + hash(id + 1) * 70
      const y = 50 + hash(id + 2) * (FLOOR_Y - h - 100)
      ctx.fillStyle = 'rgba(10, 26, 54, 0.8)'
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = rgba(theme.accent, 0.35)
      ctx.lineWidth = 1.5
      ctx.strokeRect(x, y, w, h)
      ctx.fillStyle = rgba(theme.accent, 0.3)
      for (let px = x + 10; px < x + w - 6; px += 14) {
        ctx.fillRect(px, y - 6, 4, 6)
        ctx.fillRect(px, y + h, 4, 6)
      }
      const pulse = 0.5 + 0.5 * Math.sin(t * 2 + id)
      ctx.fillStyle = rgba(theme.accent, 0.08 + 0.14 * pulse)
      ctx.fillRect(x + w * 0.25, y + h * 0.25, w * 0.5, h * 0.5)
    }
  }

  private bgBinary(theme: Theme, W: number) {
    const ctx = this.ctx
    const t = this.time
    ctx.font = '15px ui-monospace, Menlo, monospace'
    const colW = 32
    const cols = Math.ceil(W / colW) + 1
    for (let c = 0; c < cols; c++) {
      const x = c * colW + 6 - mod(this.scroll * 0.08, colW)
      const sp = 40 + hash(c) * 100
      const head = mod(t * sp + hash(c + 50) * H * 2, FLOOR_Y + 240) - 120
      for (let k = 0; k < 10; k++) {
        const y = head - k * 18
        if (y < 0 || y > FLOOR_Y) continue
        ctx.fillStyle = k === 0 ? 'rgba(255,255,255,0.6)' : rgba(theme.accent, (1 - k / 10) * 0.38)
        ctx.fillText(hash(c * 31 + k + Math.floor(t * 3 + c)) > 0.5 ? '1' : '0', x, y)
      }
    }
    ctx.save()
    ctx.lineWidth = 2
    for (let i = 0; i < 6; i++) {
      const y = FLOOR_Y * (0.12 + i * 0.15)
      ctx.strokeStyle = rgba(theme.accent, 0.16)
      ctx.setLineDash([26 + hash(i) * 30, 50 + hash(i + 9) * 60])
      ctx.lineDashOffset = this.scroll * (0.5 + hash(i + 3) * 0.6)
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
    ctx.restore()
  }

  private bgCity(theme: Theme, W: number) {
    const ctx = this.ctx
    const t = this.time
    const horizon = ctx.createLinearGradient(0, FLOOR_Y * 0.4, 0, FLOOR_Y)
    horizon.addColorStop(0, rgba(theme.accent, 0))
    horizon.addColorStop(1, rgba(theme.accent, 0.18))
    ctx.fillStyle = horizon
    ctx.fillRect(0, FLOOR_Y * 0.4, W, FLOOR_Y * 0.6)

    const far = Math.ceil(W / 62) + 4
    for (let i = 0; i < far; i++) {
      const { x, id } = slot(i, 62, this.scroll * 0.12, far)
      const h = 80 + hash(id) * 190
      ctx.fillStyle = '#0a2442'
      ctx.fillRect(x, FLOOR_Y - h, 56, h)
    }
    const near = Math.ceil(W / 96) + 4
    for (let i = 0; i < near; i++) {
      const { x, id } = slot(i, 96, this.scroll * 0.3, near)
      const h = 120 + hash(id + 5) * 230
      const top = FLOOR_Y - h
      ctx.fillStyle = '#0c3358'
      ctx.fillRect(x, top, 86, h)
      ctx.strokeStyle = rgba(theme.accent, 0.25)
      ctx.lineWidth = 1
      ctx.strokeRect(x, top, 86, h)
      for (let r = 0; r < Math.floor(h / 20); r++) {
        for (let c = 0; c < 4; c++) {
          if (hash(id * 13 + r * 7 + c) < 0.55) continue
          const blink = 0.5 + 0.5 * Math.sin(t * (0.6 + hash(id + r)) + r + c)
          ctx.fillStyle = rgba(theme.accent, 0.2 + 0.5 * blink)
          ctx.fillRect(x + 8 + c * 19, top + 10 + r * 20, 9, 9)
        }
      }
    }
  }

  private bgServer(theme: Theme, W: number) {
    const ctx = this.ctx
    const t = this.time
    const leds = ['#39ff7a', theme.accent, '#ff4d4d']
    const layer = (par: number, gap: number, alpha: number) => {
      const count = Math.ceil(W / gap) + 3
      for (let i = 0; i < count; i++) {
        const { x, id } = slot(i, gap, this.scroll * par, count)
        const h = FLOOR_Y * 0.55 + hash(id) * FLOOR_Y * 0.3
        const y = FLOOR_Y - h
        const w = gap - 24
        ctx.fillStyle = `rgba(18, 13, 6, ${0.55 + alpha * 0.45})`
        ctx.fillRect(x, y, w, h)
        ctx.strokeStyle = rgba(theme.accent, 0.25 * alpha + 0.05)
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, w, h)
        for (let r = 0; r < Math.floor(h / 15); r++) {
          if (Math.sin(t * (1 + hash(id + r)) * 2 + r + id) < -0.2) continue
          ctx.fillStyle = rgba(leds[Math.floor(hash(id * 7 + r) * 3)], 0.3 + 0.6 * alpha)
          ctx.fillRect(x + 8, y + 8 + r * 15, 4, 4)
          ctx.fillRect(x + 16, y + 8 + r * 15, 18, 2)
        }
      }
    }
    layer(0.12, 150, 0.35)
    layer(0.3, 170, 1)
    for (let i = 0; i < 2; i++) {
      const fx = mod(t * 20 * (i + 1) + i * 500, W + 600) - 300
      const g = ctx.createLinearGradient(fx, 0, fx + 600, 0)
      g.addColorStop(0, rgba(theme.accent, 0))
      g.addColorStop(0.5, rgba(theme.accent, 0.07))
      g.addColorStop(1, rgba(theme.accent, 0))
      ctx.fillStyle = g
      ctx.fillRect(fx, FLOOR_Y * (0.5 + i * 0.2), 600, 80)
    }
  }

  private bgStorm(theme: Theme, W: number) {
    const ctx = this.ctx
    const t = this.time
    for (let l = 0; l < 2; l++) {
      const gap = 260
      const count = Math.ceil(W / gap) + 3
      for (let i = 0; i < count; i++) {
        const { x, id } = slot(i, gap, this.scroll * (0.08 + 0.1 * l), count)
        const y = 40 + l * 70 + hash(id + l * 17) * 60
        const w = 150 + hash(id + 2) * 90
        ctx.fillStyle = l ? 'rgba(26, 26, 58, 0.75)' : 'rgba(18, 18, 42, 0.6)'
        ctx.beginPath()
        ctx.ellipse(x + w / 2, y, w, 34 + hash(id + 5) * 20, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    const cycle = 3.4
    const ph = t % cycle
    const idx = Math.floor(t / cycle)
    if (ph < 0.28) {
      const a = ph < 0.08 ? 1 : ph < 0.14 ? 0.2 : ph < 0.2 ? 0.8 : 0.2
      ctx.fillStyle = `rgba(207, 233, 255, ${a * 0.16})`
      ctx.fillRect(0, 0, W, FLOOR_Y)
      ctx.save()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.shadowColor = theme.accent
      ctx.shadowBlur = fxBlur(20)
      ctx.beginPath()
      let bx = W * (0.2 + hash(idx) * 0.7)
      let by = 0
      ctx.moveTo(bx, by)
      for (let s = 0; s < 9; s++) {
        bx += (hash(idx * 13 + s) - 0.5) * 90
        by += (FLOOR_Y * 0.85) / 9
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
      const y = mod(hash(i + 9) * FLOOR_Y + t * (700 + hash(i + 2) * 400), FLOOR_Y)
      ctx.moveTo(x, y)
      ctx.lineTo(x - 6, y + 16)
    }
    ctx.stroke()
  }

  private bgTunnel(theme: Theme, W: number) {
    const ctx = this.ctx
    const t = this.time
    const vx = W * 0.68
    const vy = FLOOR_Y * 0.45
    const maxR = Math.max(W, H) * 1.1

    const core = ctx.createRadialGradient(vx, vy, 4, vx, vy, maxR * 0.5)
    core.addColorStop(0, rgba('#ff6bd6', 0.4))
    core.addColorStop(1, rgba('#ff6bd6', 0))
    ctx.fillStyle = core
    ctx.fillRect(0, 0, W, FLOOR_Y)

    ctx.strokeStyle = rgba(theme.accent, 0.1)
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
      ctx.strokeStyle = rgba(k % 2 ? theme.accent : '#ff6bd6', 0.08 + z * 0.5)
      ctx.lineWidth = 1 + z * 3
      ctx.strokeRect(-r, -r, r * 2, r * 2)
      ctx.restore()
    }
  }

  private drawGates(accent: string, W: number) {
    const ctx = this.ctx

    for (const g of this.gates) {
      if (g.x > W + 100 || g.x + GATE_W < -100) continue
      const c = this.gateCenter(g)
      const topEdge = c - g.gapH / 2
      const bottomEdge = c + g.gapH / 2

      const body = ctx.createLinearGradient(g.x, 0, g.x + GATE_W, 0)
      body.addColorStop(0, '#0b1633')
      body.addColorStop(0.5, mixHex('#13244d', accent, 0.18))
      body.addColorStop(1, '#0b1633')

      ctx.save()
      ctx.fillStyle = body
      ctx.fillRect(g.x, -4, GATE_W, topEdge + 4)
      ctx.fillRect(g.x, bottomEdge, GATE_W, FLOOR_Y - bottomEdge)

      // მეხსიერების მოდულის ზოლები და LED-ები
      ctx.strokeStyle = rgba(accent, 0.22)
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let y = topEdge - 40; y > 0; y -= 40) {
        ctx.moveTo(g.x, y)
        ctx.lineTo(g.x + GATE_W, y)
      }
      for (let y = bottomEdge + 40 + 26; y < FLOOR_Y; y += 40) {
        ctx.moveTo(g.x, y)
        ctx.lineTo(g.x + GATE_W, y)
      }
      ctx.stroke()
      for (let y = topEdge - 60; y > 8; y -= 40) {
        ctx.fillStyle = rgba(accent, 0.35 + 0.35 * Math.sin(this.time * 3 + y))
        ctx.fillRect(g.x + 12, y, 8, 8)
      }
      for (let y = bottomEdge + 54; y < FLOOR_Y - 8; y += 40) {
        ctx.fillStyle = rgba(accent, 0.35 + 0.35 * Math.sin(this.time * 3 + y))
        ctx.fillRect(g.x + 12, y, 8, 8)
      }

      // თავსახურები ხვრელის კიდეებზე
      ctx.shadowColor = accent
      ctx.shadowBlur = fxBlur(14)
      ctx.fillStyle = '#16295a'
      ctx.strokeStyle = accent
      ctx.lineWidth = 3
      ctx.fillRect(g.x - 6, topEdge - 26, GATE_W + 12, 26)
      ctx.strokeRect(g.x - 6, topEdge - 26, GATE_W + 12, 26)
      ctx.fillRect(g.x - 6, bottomEdge, GATE_W + 12, 26)
      ctx.strokeRect(g.x - 6, bottomEdge, GATE_W + 12, 26)

      // გვერდითი ნათება
      ctx.shadowBlur = fxBlur(10)
      ctx.beginPath()
      ctx.moveTo(g.x, 0)
      ctx.lineTo(g.x, topEdge - 26)
      ctx.moveTo(g.x + GATE_W, 0)
      ctx.lineTo(g.x + GATE_W, topEdge - 26)
      ctx.moveTo(g.x, bottomEdge + 26)
      ctx.lineTo(g.x, FLOOR_Y)
      ctx.moveTo(g.x + GATE_W, bottomEdge + 26)
      ctx.lineTo(g.x + GATE_W, FLOOR_Y)
      ctx.stroke()
      ctx.restore()
    }
  }

  private drawFloor(accent: string, W: number) {
    const ctx = this.ctx
    const g = ctx.createLinearGradient(0, FLOOR_Y, 0, H)
    g.addColorStop(0, '#0a1226')
    g.addColorStop(1, '#03050d')
    ctx.fillStyle = g
    ctx.fillRect(0, FLOOR_Y, W, FLOOR_H + 2)

    ctx.save()
    ctx.strokeStyle = accent
    ctx.lineWidth = 3
    ctx.shadowColor = accent
    ctx.shadowBlur = fxBlur(16)
    ctx.beginPath()
    ctx.moveTo(0, FLOOR_Y)
    ctx.lineTo(W, FLOOR_Y)
    ctx.stroke()
    ctx.restore()

    ctx.strokeStyle = rgba(accent, 0.28)
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = -mod(this.scroll, 48); x < W + 60; x += 48) {
      ctx.moveTo(x, FLOOR_Y)
      ctx.lineTo(x - 30, H)
    }
    ctx.stroke()
  }

  private drawParticles() {
    const ctx = this.ctx
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.max))
      ctx.fillStyle = p.color
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
    }
    ctx.globalAlpha = 1
  }

  /** 3,5" დისკეტა */
  private drawFloppy(accent: string) {
    const ctx = this.ctx
    const s = FLOPPY_SIZE
    const h = s / 2

    ctx.save()
    ctx.translate(this.floppyX, this.floppyY)
    ctx.rotate(this.angle)
    ctx.shadowColor = accent
    ctx.shadowBlur = fxBlur(18)

    // კორპუსი (კუთხე მოჭრილი)
    ctx.fillStyle = '#1d2a4a'
    ctx.strokeStyle = accent
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(-h + 4, -h)
    ctx.lineTo(h - 10, -h)
    ctx.lineTo(h, -h + 10)
    ctx.lineTo(h, h - 4)
    ctx.quadraticCurveTo(h, h, h - 4, h)
    ctx.lineTo(-h + 4, h)
    ctx.quadraticCurveTo(-h, h, -h, h - 4)
    ctx.lineTo(-h, -h + 4)
    ctx.quadraticCurveTo(-h, -h, -h + 4, -h)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.shadowBlur = 0

    // ლითონის ფარი ზემოთ
    ctx.fillStyle = '#c9d6ea'
    ctx.fillRect(-h * 0.5, -h + 2, h * 0.95, h * 0.62)
    ctx.fillStyle = '#26354f'
    ctx.fillRect(h * 0.08, -h + 5, h * 0.22, h * 0.45)

    // ეტიკეტი ქვემოთ
    ctx.fillStyle = '#f4f7ff'
    ctx.fillRect(-h * 0.7, h * 0.05, h * 1.4, h * 0.82)
    ctx.fillStyle = accent
    ctx.fillRect(-h * 0.7, h * 0.05, h * 1.4, 4)
    ctx.fillStyle = '#8a97b3'
    ctx.fillRect(-h * 0.5, h * 0.38, h * 0.95, 2)
    ctx.fillRect(-h * 0.5, h * 0.58, h * 0.7, 2)
    ctx.restore()
  }

  private drawHud(accent: string, W: number) {
    const ctx = this.ctx
    ctx.save()
    ctx.textAlign = 'center'

    const pulse = 1 + this.scorePulse * 0.25
    ctx.translate(W / 2, 92)
    ctx.scale(pulse, pulse)
    ctx.font = '900 64px Inter, system-ui, sans-serif'
    ctx.lineWidth = 6
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.strokeText(String(this.score), 0, 0)
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = accent
    ctx.shadowBlur = fxBlur(18)
    ctx.fillText(String(this.score), 0, 0)
    ctx.restore()

    if (this.banner > 0) {
      ctx.save()
      ctx.globalAlpha = Math.min(1, this.banner / 0.6, (2.6 - this.banner) / 0.4)
      ctx.textAlign = 'center'
      ctx.font = '700 22px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = accent
      ctx.shadowBlur = fxBlur(14)
      ctx.fillText(this.bannerText, W / 2, 140)
      ctx.restore()
    }

    if (this.phase === 'ready') {
      ctx.save()
      ctx.textAlign = 'center'
      ctx.font = '700 22px Inter, system-ui, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = accent
      ctx.shadowBlur = fxBlur(12)
      const pulse2 = 0.7 + 0.3 * Math.sin(this.time * 4)
      ctx.globalAlpha = pulse2
      ctx.fillText('დააჭირე: SPACE / ↑ / კლიკი — დისკეტა ზემოთ ადის', W / 2, H / 2 + 110)
      ctx.restore()
    }
  }

  // ---------- დახურვა ----------

  private close() {
    if (this.disposed) return

    this.disposed = true
    cancelAnimationFrame(this.frame)

    window.removeEventListener('keydown', this.keyHandler, true)
    window.removeEventListener('resize', this.resizeHandler)
    this.root.removeEventListener('pointerdown', this.pointerHandler)

    this.root.remove()
    this.onClose?.()
  }
}