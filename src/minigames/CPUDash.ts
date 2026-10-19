export type CPUDashOptions = {
  onClose?: () => void
}

type Question = {
  prompt: string
  answers: string[]
}

type Obstacle = {
  x: number
  width: number
  height: number
  kind: 'spike' | 'block' | 'electric' | 'data' | 'bridge' | 'super_bridge' | 'finish'
  passed?: boolean
  yOffset?: number
}

type Meteor = {
  x: number
  y: number
  length: number
  speed: number
  alpha: number
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
]

const LEVELS = [
  {
    name: 'ეტაპი 1 — ჩიპის ველი',
    speed: 350,
    gapMin: 280,
    gapMax: 410,
    obstacleChance: 0.72,
    color: '#43e7ff',
    background: '#06132b',
    accent: '#00f2fe',
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
  },
]

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
    this.playerY = 0
    this.velocityY = 0
    this.grounded = true
    this.jumpQueued = false
    this.flash = 0
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
    const title = intro.querySelector('.cpu-level-intro-title') as HTMLDivElement
    title.textContent = LEVELS[this.levelIndex].name.replace(' — ', ' - ')
    intro.hidden = false
    this.levelIntroUntil = performance.now() + 1100
  }

  private updateHUD() {
    const level = LEVELS[this.levelIndex]
    this.root.querySelector('.cpu-level')!.textContent = level.name

    const label = this.root.querySelector('.cpu-progress-label')!
    label.textContent = `ეტაპი ${this.levelIndex + 1}/3 · ${Math.floor(this.distance)} მ / 1900 მ`

    const progress = Math.min(this.distance / 1900, 1) * 100
    ;(this.root.querySelector('.cpu-progress > div') as HTMLDivElement)
      .style.width = `${progress}%`
  }

  private readonly loop = (now: number) => {
    if (this.disposed) return

    this.frame = requestAnimationFrame(this.loop)

    const delta = Math.min((now - this.lastTime) / 1000, 0.035)
    this.lastTime = now

    if (this.running && !this.questionOpen && now >= this.levelIntroUntil) {
      const intro = this.root.querySelector('.cpu-level-intro') as HTMLDivElement | null
      if (intro && !intro.hidden) intro.hidden = true
      this.update(delta)
    }

    this.draw()
  }

  private update(delta: number) {
    const level = LEVELS[this.levelIndex]
    const ground = this.groundY()

    this.distance += level.speed * delta * 0.18

    if (this.distance >= 1680 && !this.finishSpawned) {
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

    for (const meteor of this.meteors) {
      meteor.x -= meteor.speed * delta
      meteor.y += meteor.speed * 0.45 * delta
      if (meteor.x < -100 || meteor.y > ground) {
        meteor.x = window.innerWidth + Math.random() * 200
        meteor.y = Math.random() * (window.innerHeight * 0.5)
      }
    }

    this.nextObstacleX -= level.speed * delta

    if (!this.finishSpawned && this.nextObstacleX < window.innerWidth + 80) {
      this.spawnObstacle()
    }

    for (const obstacle of this.obstacles) {
      obstacle.x -= level.speed * delta

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
          } else {
            this.velocityY = 0
            this.grounded = true
          }
        }
        continue
      }

      const yOffset = obstacle.yOffset || 0
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

  private spawnObstacle() {
    const level = LEVELS[this.levelIndex]
    const spawnX = this.nextObstacleX
    let structureLength = 0

    if (this.levelIndex === 2 && Math.random() < 0.22) {
      const width = 150
      this.obstacles.push({
        x: spawnX,
        width,
        height: 70,
        kind: 'super_bridge',
      })
      structureLength = width
    } else if (this.levelIndex >= 1 && Math.random() < (this.levelIndex === 1 ? 0.35 : 0.28)) {
      const bridgeWidth = 210
      const bridgeHeight = 82

      this.obstacles.push({
        x: spawnX,
        width: bridgeWidth,
        height: bridgeHeight,
        kind: 'bridge',
      })

      structureLength = bridgeWidth

      if (this.levelIndex === 2) {
        if (Math.random() < 0.55) {
          this.obstacles.push({
            x: spawnX + 85,
            width: 32,
            height: 38,
            kind: 'spike',
            yOffset: bridgeHeight,
          })
        } else {
          const extraX = spawnX + bridgeWidth + 40
          this.obstacles.push({
            x: extraX,
            width: 28,
            height: 60,
            kind: 'electric',
          })
          structureLength = bridgeWidth + 40 + 28
        }
      }
    } else {
      if (Math.random() > level.obstacleChance) {
        this.nextObstacleX = spawnX + 110
        return
      }

      const kinds: Obstacle['kind'][] = ['spike', 'block', 'electric', 'data']
      const kind = kinds[Math.floor(Math.random() * kinds.length)]

      let width = 34
      let height = 42

      if (kind === 'spike') {
        width = 38
        height = 42
      } else if (kind === 'block') {
        width = 38
        height = 42 + Math.random() * 22
      } else if (kind === 'electric') {
        width = 25
        height = 62
      } else {
        width = 48
        height = 52
      }

      this.obstacles.push({
        x: spawnX,
        width,
        height,
        kind,
      })

      structureLength = width

      if (this.levelIndex > 1 && Math.random() > 0.75) {
        const secondWidth = 34
        const gapBetween = 35
        this.obstacles.push({
          x: spawnX + width + gapBetween,
          width: secondWidth,
          height: 40,
          kind: 'spike',
        })
        structureLength = width + gapBetween + secondWidth
      }
    }

    const gap = level.gapMin + Math.random() * (level.gapMax - level.gapMin)
    this.nextObstacleX = spawnX + structureLength + gap
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

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, level.background)
    gradient.addColorStop(0.6, '#080816')
    gradient.addColorStop(1, '#02040a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    ctx.globalAlpha = 0.08
    for (let i = 0; i < 5; i++) {
      const beamX = ((i * 280) + this.distance * 2) % (width + 200) - 100
      const beamGrad = ctx.createLinearGradient(beamX, 0, beamX + 80, 0)
      beamGrad.addColorStop(0, 'transparent')
      beamGrad.addColorStop(0.5, level.accent)
      beamGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = beamGrad
      ctx.fillRect(beamX, 0, 80, ground)
    }
    ctx.globalAlpha = 1

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
      mGrad.addColorStop(1, 'transparent')
      ctx.strokeStyle = mGrad
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(meteor.x, meteor.y)
      ctx.lineTo(meteor.x + meteor.length, meteor.y - meteor.length * 0.45)
      ctx.stroke()
      ctx.restore()
    }

    ctx.globalAlpha = 0.45
    for (let i = 0; i < 55; i++) {
      const x = (i * 137 + this.distance * (6 + i % 3)) % width
      const y = (i * 73) % Math.max(1, ground - 60)
      ctx.fillStyle = i % 2 === 0 ? level.color : '#ffffff'
      ctx.fillRect(x, y, i % 4 === 0 ? 3 : 1.5, i % 4 === 0 ? 3 : 1.5)
    }
    ctx.globalAlpha = 1

    ctx.strokeStyle = `${level.color}44`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, ground)
    ctx.lineTo(width, ground)
    for (let x = -((this.distance * 3) % 48); x < width; x += 48) {
      ctx.moveTo(x, ground)
      ctx.lineTo(x - 90, height)
    }
    ctx.stroke()

    ctx.fillStyle = '#050c18'
    ctx.fillRect(0, ground, width, height - ground)

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

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,50,70,${Math.min(this.flash * 2, 0.3)})`
      ctx.fillRect(0, 0, width, height)
    }
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
    const yOffset = obstacle.yOffset || 0
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

      const correct = question.answers.some(
        expected => this.normalize(expected) === answer,
      )

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
          სამივე ეტაპი გაიარე და ციფრული ცოდნაც დაამტკიცე.
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