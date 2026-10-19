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

type StageConfig = {
  name: string
  words: string[]
  bgGradient: [string, string, string]
  platformColor: string
  accentColor: string
}

type Star = {
  x: number
  y: number
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
}

type Cloud = {
  x: number
  y: number
  scale: number
  speed: number
}

const STAGES: StageConfig[] = [
  {
    name: 'ეტაპი 1 — ჩიპების ხეობა',
    words: ['კოდი', 'ჩიპი', 'ბიტი', 'ფაილი', 'ქსელი', 'ეკრანი', 'მაუსი', 'დისკი', 'ბოტი', 'პორტი'],
    bgGradient: ['#1d0836', '#321052', '#140524'],
    platformColor: '#2b3a68',
    accentColor: '#43e7ff',
  },
  {
    name: 'ეტაპი 2 — მონაცემთა კიბე',
    words: ['ბაზა', 'სერვერი', 'ფლეშკა', 'ხაზი', 'საიტი', 'ბლოგი', 'რუტერი', 'ლინკი', 'კლასი', 'ჰოსტი'],
    bgGradient: ['#280838', '#451259', '#170324'],
    platformColor: '#531b73',
    accentColor: '#ff4fd8',
  },
  {
    name: 'ეტაპი 3 — პროცესორის კოშკი',
    words: ['პროცესორი', 'მეხსიერება', 'პროგრამა', 'სისტემა', 'ვირუსი', 'დაფა', 'ბირთვი', 'კლავიატურა', 'მონიტორი', 'კოდერი'],
    bgGradient: ['#2e0921', '#4d122e', '#1a0312'],
    platformColor: '#6e1d3b',
    accentColor: '#ffb83f',
  },
  {
    name: 'ეტაპი 4 — კვანტური ლაბორატორია',
    words: ['ალგორითმი', 'ინტერნეტი', 'მონაცემი', 'პიქსელი', 'უსაფრთხოება', 'პროტოკოლი', 'სკრიპტი', 'ფუნქცია', 'ობიექტი', 'მასივი'],
    bgGradient: ['#140b36', '#2b1357', '#0d0426'],
    platformColor: '#1a5448',
    accentColor: '#30fca8',
  },
  {
    name: 'ეტაპი 5 — ციფრული მწვერვალი',
    words: ['ინფორმაცია', 'ტექნოლოგია', 'პროგრამისტი', 'ინჟინერია', 'არქიტექტურა', 'კომპილატორი', 'მონაცემები', 'აპლიკაცია', 'პლატფორმა', 'ავტომატიზაცია'],
    bgGradient: ['#220642', '#3d0a6e', '#130229'],
    platformColor: '#4a1d8a',
    accentColor: '#a855f7',
  },
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
    this.stars = []
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: 1 + Math.random() * 2.8,
        alpha: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 1 + Math.random() * 3,
      })
    }

    this.shootingStars = []
    for (let i = 0; i < 3; i++) {
      this.spawnShootingStar()
    }

    this.clouds = [
      { x: window.innerWidth * 0.08, y: 90, scale: 0.9, speed: 12 },
      { x: window.innerWidth * 0.42, y: 60, scale: 1.15, speed: 9 },
      { x: window.innerWidth * 0.78, y: 110, scale: 0.85, speed: 15 },
    ]
  }

  private spawnShootingStar() {
    this.shootingStars.push({
      x: Math.random() * window.innerWidth * 1.2 - 100,
      y: Math.random() * (window.innerHeight * 0.4),
      length: 60 + Math.random() * 90,
      speed: 350 + Math.random() * 450,
      alpha: 0.4 + Math.random() * 0.6,
    })
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.floor(window.innerWidth * dpr)
    this.canvas.height = Math.floor(window.innerHeight * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  private start() {
    this.stageIndex = 0
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

    const startY = window.innerHeight * 0.75
    const xStep = Math.min(210, window.innerWidth * 0.2)
    const yStep = 150 // გაზრდილი მანძილი (150px), რომ სიტყვა არ დაეჯახოს ზედა პლატფორმას

    let currentX = window.innerWidth * 0.15
    let currentY = startY

    for (let i = 0; i < stage.words.length; i++) {
      const word = stage.words[i]
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

    if (this.running) {
      this.update(delta)
    }
    this.draw()
  }

  private update(delta: number) {
    this.playerPos.x += (this.targetPlayerPos.x - this.playerPos.x) * 10 * delta
    this.playerPos.y += (this.targetPlayerPos.y - this.playerPos.y) * 10 * delta

    this.cameraY += (this.targetCameraY - this.cameraY) * 4 * delta

    if (this.flashError > 0) this.flashError -= delta

    for (const ss of this.shootingStars) {
      ss.x += ss.speed * delta
      ss.y += ss.speed * 0.5 * delta
      if (ss.x > window.innerWidth + 100 || ss.y > window.innerHeight) {
        ss.x = Math.random() * window.innerWidth * 1.2 - 200
        ss.y = -50
        ss.speed = 350 + Math.random() * 450
      }
    }

    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * delta
      if (cloud.x > window.innerWidth + 120) {
        cloud.x = -120
      }
    }

    const elapsedMinutes = Math.max(0.01, (performance.now() - this.startTime) / 60000)
    const wpm = Math.round((this.totalTypedCorrect / 5) / elapsedMinutes)
    const totalAttempts = this.totalTypedCorrect + this.errors
    const accuracy = totalAttempts > 0 ? Math.round((this.totalTypedCorrect / totalAttempts) * 100) : 100

    this.root.querySelector('.id-wpm')!.textContent = wpm.toString()
    this.root.querySelector('.id-acc')!.textContent = `${accuracy}%`
    this.root.querySelector('.id-err')!.textContent = this.errors.toString()
  }

  private draw() {
    const ctx = this.ctx
    const width = window.innerWidth
    const height = window.innerHeight
    const stage = STAGES[this.stageIndex] || STAGES[STAGES.length - 1]

    ctx.clearRect(0, 0, width, height)

    // 1. იასამნისფერი ფონური გრადიენტი
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, stage.bgGradient[0])
    grad.addColorStop(0.5, stage.bgGradient[1])
    grad.addColorStop(1, stage.bgGradient[2])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    // 2. ციმციმა ვარსკვლავები
    ctx.save()
    for (const star of this.stars) {
      const alpha = Math.abs(Math.sin(performance.now() / 1000 * star.twinkleSpeed)) * star.alpha
      ctx.fillStyle = `rgba(255, 245, 230, ${alpha})`
      ctx.fillRect(star.x, star.y, star.size, star.size)
    }
    ctx.restore()

    // 3. ვარსკვლავთცვენა
    ctx.save()
    for (const ss of this.shootingStars) {
      const mGrad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.length, ss.y - ss.length * 0.5)
      mGrad.addColorStop(0, `rgba(255, 255, 255, ${ss.alpha})`)
      mGrad.addColorStop(1, 'transparent')
      ctx.strokeStyle = mGrad
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(ss.x, ss.y)
      ctx.lineTo(ss.x - ss.length, ss.y - ss.length * 0.5)
      ctx.stroke()
    }
    ctx.restore()

    // 4. Low-Poly მცურავი ღრუბლები
    ctx.save()
    for (const cloud of this.clouds) {
      this.drawLowPolyCloud(cloud.x, cloud.y, cloud.scale)
    }
    ctx.restore()

    // 5. პარალაქსით მცურავი Low-Poly კუნძულები
    ctx.save()
    ctx.translate(0, -this.cameraY * 0.2)
    this.drawDetailedLowPolyScene(width, height)
    ctx.restore()

    // 6. სათამაშო სამყარო (კამერის აყოლებით)
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

    if (this.flashError > 0) {
      ctx.fillStyle = `rgba(255, 50, 70, ${Math.min(this.flashError, 0.25)})`
      ctx.fillRect(0, 0, width, height)
    }
  }

  private drawDetailedLowPolyScene(width: number, height: number) {
    const ctx = this.ctx
    const cx = width * 0.5
    const cy = height * 0.72

    this.drawMiniIsland(cx - width * 0.32, cy - 180, 0.55)
    this.drawMiniIsland(cx + width * 0.35, cy - 240, 0.65)

    ctx.save()

    ctx.fillStyle = '#4a2d1e'
    ctx.beginPath()
    ctx.moveTo(cx - 240, cy)
    ctx.lineTo(cx - 160, cy + 140)
    ctx.lineTo(cx, cy + 220)
    ctx.lineTo(cx + 150, cy + 120)
    ctx.lineTo(cx + 250, cy)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#331e13'
    ctx.beginPath()
    ctx.moveTo(cx - 160, cy + 140)
    ctx.lineTo(cx, cy + 220)
    ctx.lineTo(cx - 30, cy + 60)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#5c3926'
    ctx.beginPath()
    ctx.moveTo(cx, cy + 220)
    ctx.lineTo(cx + 150, cy + 120)
    ctx.lineTo(cx + 60, cy + 40)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#3a6627'
    ctx.beginPath()
    ctx.moveTo(cx - 260, cy)
    ctx.lineTo(cx - 120, cy - 25)
    ctx.lineTo(cx + 120, cy - 20)
    ctx.lineTo(cx + 270, cy)
    ctx.lineTo(cx + 130, cy + 30)
    ctx.lineTo(cx - 130, cy + 35)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#4d8234'
    ctx.beginPath()
    ctx.moveTo(cx - 260, cy)
    ctx.lineTo(cx, cy - 35)
    ctx.lineTo(cx + 270, cy)
    ctx.lineTo(cx + 130, cy + 15)
    ctx.lineTo(cx - 130, cy + 20)
    ctx.closePath()
    ctx.fill()

    const treePositions = [-200, -160, -110, -70, 70, 120, 170, 210]
    for (const tx of treePositions) {
      this.drawLowPolyTree(cx + tx, cy - 5, 0.8 + Math.abs(tx % 3) * 0.2)
    }

    ctx.fillStyle = '#c85e1b'
    ctx.beginPath()
    ctx.moveTo(cx - 150, cy - 20)
    ctx.lineTo(cx - 80, cy - 210)
    ctx.lineTo(cx - 20, cy - 20)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#e87323'
    ctx.beginPath()
    ctx.moveTo(cx - 80, cy - 210)
    ctx.lineTo(cx - 20, cy - 20)
    ctx.lineTo(cx - 70, cy - 20)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#d96118'
    ctx.beginPath()
    ctx.moveTo(cx - 50, cy - 20)
    ctx.lineTo(cx + 30, cy - 310)
    ctx.lineTo(cx + 110, cy - 20)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#f57a27'
    ctx.beginPath()
    ctx.moveTo(cx + 30, cy - 310)
    ctx.lineTo(cx + 110, cy - 20)
    ctx.lineTo(cx + 20, cy - 20)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#ad4910'
    ctx.beginPath()
    ctx.moveTo(cx + 60, cy - 20)
    ctx.lineTo(cx + 130, cy - 190)
    ctx.lineTo(cx + 190, cy - 20)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#d95d18'
    ctx.beginPath()
    ctx.moveTo(cx + 130, cy - 190)
    ctx.lineTo(cx + 190, cy - 20)
    ctx.lineTo(cx + 120, cy - 20)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  private drawMiniIsland(x: number, y: number, scale: number) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.globalAlpha = 0.55

    ctx.fillStyle = '#3d2518'
    ctx.beginPath()
    ctx.moveTo(-60, 0)
    ctx.lineTo(0, 70)
    ctx.lineTo(60, 0)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#3e6b2b'
    ctx.beginPath()
    ctx.moveTo(-65, 0)
    ctx.lineTo(0, -10)
    ctx.lineTo(65, 0)
    ctx.lineTo(0, 10)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#c85e1b'
    ctx.beginPath()
    ctx.moveTo(-30, -5)
    ctx.lineTo(0, -80)
    ctx.lineTo(30, -5)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  private drawLowPolyTree(x: number, y: number, scale: number) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)

    ctx.fillStyle = '#2b1a11'
    ctx.fillRect(-2, -6, 4, 8)

    ctx.fillStyle = '#234a17'
    ctx.beginPath()
    ctx.moveTo(-10, -6)
    ctx.lineTo(0, -28)
    ctx.lineTo(10, -6)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#346623'
    ctx.beginPath()
    ctx.moveTo(0, -28)
    ctx.lineTo(10, -6)
    ctx.lineTo(0, -6)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  private drawLowPolyCloud(x: number, y: number, scale: number) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.fillStyle = 'rgba(230, 190, 150, 0.45)'

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(18, -14)
    ctx.lineTo(42, -10)
    ctx.lineTo(60, 0)
    ctx.lineTo(35, 12)
    ctx.lineTo(12, 10)
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
        <h2>🏆 50-ვე სიტყვა აკრეფილია!</h2>
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