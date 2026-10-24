import * as THREE from 'three'

import {
  showGradeSelect,
  type Grade,
} from '../ui/GradeSelect'

import {
  PauseMenu,
  type PauseAction,
} from '../ui/PauseMenu'

import type { TeacherCodes } from '../content/teacher'

import { createWorld } from './World'
import { CollisionSystem } from './Collision'
import { Player } from './Player'
import { GameCamera } from './Camera'
import { CPUDash } from '../minigames/CPUDash'
import { GameState } from '../progress/GameState'
import { ECONOMY, GAMES } from '../progress/economy'
import { KingdomPanels } from '../ui/KingdomPanels'
import { gameVisual } from '../progress/gameIcons'
import { TypingGrandmaster } from '../minigames/TypingGrandmaster'
import { FlappyFloppy } from '../minigames/FlappyFloppy'
import { JumpUpTower } from '../minigames/JumpUpTower'

import {
  createKingdomWorld,
  type KingdomWorldData,
  type KingdomBuilding,
} from '../worlds/KingdomWorld'

import {
  DayNightCycle,
  type DayPhase,
} from '../worlds/DayNightCycle'

type WorldName = 'island' | 'kingdom'

const FORGE_INTRO_TEXT =
  'სამჭედლოში უნდა გამოვწრთოთ შენი ცოდნა, რომელიც იქნება ისეთივე ბასრი, როგორც სამურაის ხმალი. წინ გელოდება თამაშის სამყარო, თუმცა დაბრკოლებებით სავსე. მზად ხარ ამ გამოწვევისთვის?'

export class Game {
  private readonly scene: THREE.Scene
  private readonly renderer: THREE.WebGLRenderer
  private readonly player: Player
  private readonly gameCamera: GameCamera
  private readonly clock: THREE.Clock
  private readonly pauseMenu: PauseMenu

  private readonly islandObjects: THREE.Object3D[]
  private readonly islandCollision: CollisionSystem
  private readonly kingdomCollision: CollisionSystem
  private readonly kingdom: KingdomWorldData
  private readonly state: GameState
  private readonly panels: KingdomPanels
  private readonly hud: HTMLDivElement
  private readonly sun: THREE.DirectionalLight | null
  private readonly cycle: DayNightCycle | null
  private lastTimeLabel = ''

  private readonly interactionPrompt: HTMLDivElement
  private readonly locationLabel: HTMLDivElement

  private forgeIntroOverlay: HTMLDivElement | null = null
  private forgeGamesOverlay: HTMLDivElement | null = null

  private cpuDashActive = false
  private cpuDash: CPUDash | null = null

  private typingGrandmasterActive = false
  private flappyActive = false
  private flappyFloppy: FlappyFloppy | null = null
  private jumpTowerActive = false
  private jumpUpTower: JumpUpTower | null = null
  private typingGrandmaster: TypingGrandmaster | null = null

  private currentWorld: WorldName = 'island'
  private grade: Grade
  /** მასწავლებლის რეჟიმში — კლასების კოდები (ღილაკი M), მოსწავლისთვის null */
  private teacherCodes: TeacherCodes | null
  private paused = false
  private changingGrade = false

  private currentInteraction:
    | { type: 'enter' }
    | { type: 'exit' }
    | { type: 'building'; building: KingdomBuilding }
    | null = null

  constructor(grade: Grade, teacherCodes: TeacherCodes | null = null) {
    this.grade = grade
    this.teacherCodes = teacherCodes
    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    })

    this.renderer.setSize(
      window.innerWidth,
      window.innerHeight
    )

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 1.5)
    )

    // ჩრდილები გამორთულია — წარმადობისთვის (ცის/შუქის ფერის ცვლილება საკმარისია)
    this.renderer.shadowMap.enabled = false
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    document.body.appendChild(this.renderer.domElement)

    const island = createWorld(this.scene)

    // ნისლი გამორთულია (წარმადობა და სიცხადე)
    this.scene.fog = null

    this.islandObjects = this.scene.children.filter(
      object => !(object instanceof THREE.Light)
    )

    this.islandCollision = new CollisionSystem(
      island.colliders
    )

    this.kingdom = createKingdomWorld()

    this.kingdomCollision = new CollisionSystem(
      this.kingdom.colliders
    )

    this.scene.add(this.kingdom.group)
    this.kingdom.group.visible = false

    this.player = new Player(this.islandCollision)
    this.scene.add(this.player.group)

    this.gameCamera = new GameCamera(
      this.renderer.domElement
    )

    this.clock = new THREE.Clock()

    // დღე/საღამო/ღამის ციკლი მუშაობს მხოლოდ სამეფოში;
    // საწყის კუნძულზე სცენა ზუსტად ისე რჩება, როგორც იყო.
    this.sun =
      this.scene.children.find(
        (object): object is THREE.DirectionalLight =>
          object instanceof THREE.DirectionalLight
      ) ?? null

    if (this.sun) this.sun.castShadow = false

    const ambient = this.scene.children.find(
      (object): object is THREE.HemisphereLight =>
        object instanceof THREE.HemisphereLight
    )

    this.cycle = this.sun
      ? new DayNightCycle({
          scene: this.scene,
          sun: this.sun,
          ambient,
          camera: this.gameCamera.camera,
          world: this.kingdom,
          startHour: 10,
          dayLengthSeconds: 300,
        })
      : null

    this.cycle?.setEnabled(false)

    this.createUI()

    this.interactionPrompt = document.createElement('div')
    this.interactionPrompt.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 105px;
      transform: translateX(-50%);
      z-index: 20;
      padding: 13px 24px;
      border-radius: 16px;
      background: rgba(21, 42, 64, 0.92);
      color: white;
      font-family: Arial, sans-serif;
      font-size: 17px;
      font-weight: bold;
      text-align: center;
      pointer-events: none;
      display: none;
      box-shadow: 0 5px 22px rgba(0,0,0,0.25);
      backdrop-filter: blur(8px);
    `
    document.body.appendChild(this.interactionPrompt)

    this.locationLabel = document.createElement('div')
    this.locationLabel.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      padding: 10px 20px;
      border-radius: 14px;
      background: rgba(255,255,255,0.9);
      color: #29445d;
      font-family: Arial, sans-serif;
      font-size: 16px;
      font-weight: bold;
      pointer-events: none;
      box-shadow: 0 3px 14px rgba(0,0,0,0.15);
    `
    document.body.appendChild(this.locationLabel)
    this.updateLocationLabel()

    // პროგრესი (მონეტები, წიგნები, გახსნილი თამაშები) მხოლოდ მიმდინარე სესიაში ინახება
    this.state = new GameState()
    this.state.setTeacherMode(this.teacherCodes !== null)

    this.panels = new KingdomPanels({
      state: this.state,
      getGrade: () => this.grade,
      toast: text => this.showToast(text),
      onClose: () => this.updateInteractions(),
    })

    this.hud = document.createElement('div')
    this.hud.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10;
      padding: 10px 16px;
      border-radius: 14px;
      background: rgba(255,255,255,0.9);
      color: #29445d;
      font-family: Arial, sans-serif;
      font-size: 16px;
      font-weight: bold;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 3px 14px rgba(0,0,0,0.15);
    `
    document.body.appendChild(this.hud)
    this.updateHud()
    this.state.onChange(() => this.updateHud())
    window.addEventListener('beforeunload', this.onBeforeUnload)

    this.pauseMenu = new PauseMenu()
    this.pauseMenu.onAction(this.handlePauseAction)

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('resize', this.onResize)

    // ზედა პანელების განლაგება — მხოლოდ მაშინ, როცა ყველა ელემენტი უკვე შექმნილია
    this.layoutHud()
    document.fonts?.ready.then(() => this.layoutHud())

    this.animate()
  }

  private getGradeRoman(): string {
    if (this.grade === 2) return 'II'
    if (this.grade === 3) return 'III'
    return 'IV'
  }

  private gradeTitle(): string {
    return this.teacherCodes ? '🧑‍🏫 მასწავლებელი' : `${this.getGradeRoman()} კლასი`
  }

  private createUI() {
    const ui = document.createElement('div')
    ui.className = 'game-ui'

    ui.innerHTML = `
      <div class="title">DIGITAL KINGDOM</div>
      <div class="stars">⭐ <span>0 / 5</span></div>
      <div class="welcome">
        <strong>კეთილი იყოს შენი მობრძანება!</strong>
        <span>${this.gradeTitle()} • გამოიკვლიე ციფრული სამეფო ✨</span>
      </div>
      <div class="controls">
        <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> მოძრაობა</div>
        <div><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> მოძრაობა</div>
        <div>🖱️ კამერა</div>
        <div><kbd>SPACE</kbd> ახტომა</div>
        <div><kbd>E</kbd> ინტერაქცია</div>
        <div><kbd>T</kbd> დრო (დღე / საღამო / ღამე)</div>
        <div><kbd>ESC</kbd> მენიუ</div>
        <div class="teacher-only" style="display: ${this.teacherCodes ? '' : 'none'}"><kbd>M</kbd> კლასის კოდები</div>
      </div>
    `

    document.body.appendChild(ui)
  }

  private updateGradeUI() {
    const welcome = document.querySelector('.welcome span')

    if (welcome) {
      welcome.textContent =
        `${this.gradeTitle()} • გამოიკვლიე ციფრული სამეფო ✨`
    }

    const teacherHint = document.querySelector('.game-ui .teacher-only') as HTMLElement | null
    if (teacherHint) teacherHint.style.display = this.teacherCodes ? '' : 'none'
  }

  private updateLocationLabel() {
    if (this.currentWorld === 'island' || !this.cycle) {
      this.locationLabel.textContent =
        this.currentWorld === 'island'
          ? '🏝️ საწყისი კუნძული'
          : '🏰 ციფრული სამეფოს ეზო'
      return
    }

    const icons: Record<DayPhase, string> = {
      dawn: '🌅',
      day: '☀️',
      evening: '🌇',
      night: '🌙',
    }

    this.lastTimeLabel = this.cycle.timeLabel
    this.locationLabel.textContent =
      `🏰 ციფრული სამეფოს ეზო • ${icons[this.cycle.phase]} ${this.lastTimeLabel}`
  }

  private distanceTo(x: number, z: number) {
    const position = this.player.group.position
    return Math.hypot(position.x - x, position.z - z)
  }

  // სამჭედლო და მისი თამაშები მესამე და მეოთხე კლასისთვის ირთვება
  private miniGameActive(): boolean {
    return (
      this.cpuDashActive ||
      this.typingGrandmasterActive ||
      this.flappyActive ||
      this.jumpTowerActive
    )
  }

  // სამჭედლო და მისი თამაშები მესამე და მეოთხე კლასისთვის ირთვება
  private forgeEnabled(): boolean {
    return this.grade === 3 || this.grade === 4
  }

  /**
   * ზედა პანელები ერთმანეთს არ ეხვევა: მონეტა/წიგნების პანელი ვარსკვლავების პანელის ქვეშ დგება,
   * ადგილის წარწერა კი სათაურის ქვეშ. ზომებს რეალურად ვზომავთ, ამიტომ სტილის ფაილზე არ არის დამოკიდებული.
   */
  private layoutHud() {
    if (!this.hud || !this.locationLabel) return

    const title = document.querySelector('.game-ui .title') as HTMLElement | null
    const stars = document.querySelector('.game-ui .stars') as HTMLElement | null

    if (title) {
      const rect = title.getBoundingClientRect()
      if (rect.height > 0) {
        this.locationLabel.style.top = `${Math.round(rect.bottom + 8)}px`
      }
    }

    if (stars) {
      const rect = stars.getBoundingClientRect()
      if (rect.height > 0) {
        this.hud.style.top = `${Math.round(rect.bottom + 8)}px`
        this.hud.style.right = `${Math.max(12, Math.round(window.innerWidth - rect.right))}px`
      }
    }
  }

  private updateHud() {
    this.hud.textContent = `🪙 ${this.state.coins}   📘 ${this.state.books}`
  }

  private showToast(text: string) {
    const toast = document.createElement('div')
    toast.textContent = text
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100000;
      padding: 12px 22px;
      border-radius: 14px;
      background: rgba(21, 42, 64, 0.95);
      color: white;
      font-family: Arial, sans-serif;
      font-size: 17px;
      font-weight: bold;
      pointer-events: none;
      box-shadow: 0 6px 24px rgba(0,0,0,0.3);
      transition: opacity 0.4s;
    `
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.opacity = '0'
    }, 1800)
    setTimeout(() => toast.remove(), 2300)
  }

  private onBeforeUnload = (event: BeforeUnloadEvent) => {
    // გვერდის შემთხვევით დახურვისას პროგრესი რომ არ დაიკარგოს
    if (this.state.hasProgress()) {
      event.preventDefault()
    }
  }

  private isForgeModalOpen() {
    return (
      this.forgeIntroOverlay !== null ||
      this.forgeGamesOverlay !== null ||
      this.panels.isOpen()
    )
  }

  private updateInteractions() {
    if (
      this.paused ||
      this.changingGrade ||
      this.isForgeModalOpen() ||
      this.miniGameActive()
    ) {
      this.currentInteraction = null
      this.interactionPrompt.style.display = 'none'
      return
    }

    this.currentInteraction = null

    if (this.currentWorld === 'island') {
      if (this.distanceTo(0, -8.12) < 2.8) {
        this.currentInteraction = { type: 'enter' }
      }
    } else {
      if (this.distanceTo(0, 37) < 5.5) {
        this.currentInteraction = { type: 'exit' }
      } else {
        let nearestDistance = Infinity

        for (const building of this.kingdom.buildings) {
          if (building.id === 'forge' && !this.forgeEnabled()) {
            continue
          }

          const distance = this.distanceTo(
            building.position.x,
            building.position.z
          )

          if (
            distance < building.interactionRadius &&
            distance < nearestDistance
          ) {
            nearestDistance = distance
            this.currentInteraction = {
              type: 'building',
              building,
            }
          }
        }
      }
    }

    if (!this.currentInteraction) {
      this.interactionPrompt.style.display = 'none'
      return
    }

    let message = ''

    if (this.currentInteraction.type === 'enter') {
      message = '🏰 [E] — სამეფოში შესვლა'
    } else if (this.currentInteraction.type === 'exit') {
      message = '🚪 [E] — საწყის კუნძულზე დაბრუნება'
    } else {
      message = `✨ [E] — ${this.currentInteraction.building.name}`
    }

    this.interactionPrompt.textContent = message
    this.interactionPrompt.style.display = 'block'
  }

  private createModalOverlay(): HTMLDivElement {
    const overlay = document.createElement('div')

    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(12, 22, 39, 0.76);
      backdrop-filter: blur(8px);
      font-family: Arial, sans-serif;
    `

    return overlay
  }

  private createModalCard(): HTMLDivElement {
    const card = document.createElement('div')

    card.style.cssText = `
      width: min(680px, 100%);
      max-height: 85vh;
      overflow-y: auto;
      box-sizing: border-box;
      padding: 32px;
      border: 2px solid rgba(255,255,255,0.75);
      border-radius: 24px;
      background: linear-gradient(145deg, #fff8e7, #e6f4ff);
      color: #26364a;
      text-align: center;
      box-shadow: 0 24px 80px rgba(0,0,0,0.4);
    `

    return card
  }

  private createModalButton(
    text: string,
    background: string,
  ): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = text

    button.style.cssText = `
      border: 0;
      border-radius: 12px;
      padding: 13px 20px;
      min-width: 150px;
      background: ${background};
      color: white;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 0 rgba(0,0,0,0.12);
    `

    return button
  }

  private showForgeIntro() {
    if (!this.forgeEnabled() || this.isForgeModalOpen()) return

    this.interactionPrompt.style.display = 'none'
    this.currentInteraction = null

    // მისალმების ტექსტი ერთ სესიაში მხოლოდ პირველ მისვლაზე ჩანს
    this.state.markForgeIntroSeen()

    const overlay = this.createModalOverlay()
    const card = this.createModalCard()

    const icon = document.createElement('div')
    icon.textContent = '⚒️'
    icon.style.cssText = 'font-size: 54px; margin-bottom: 8px;'

    const title = document.createElement('h1')
    title.textContent = 'სამჭედლო'
    title.style.cssText = `
      margin: 0 0 18px;
      font-size: clamp(26px, 5vw, 38px);
      color: #784323;
    `

    const text = document.createElement('p')
    text.textContent = FORGE_INTRO_TEXT
    text.style.cssText = `
      margin: 0 auto 24px;
      max-width: 560px;
      font-size: clamp(17px, 2.6vw, 21px);
      line-height: 1.75;
    `

    const controls = document.createElement('p')
    controls.textContent =
      'Enter — ვეთანხმები  •  Esc — უარი'
    controls.style.cssText = `
      margin: 0 0 22px;
      color: #586b7c;
      font-size: 14px;
      font-weight: bold;
    `

    const buttons = document.createElement('div')
    buttons.style.cssText = `
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 12px;
    `

    const accept = this.createModalButton(
      '↵ ვეთანხმები',
      '#27834a'
    )

    const decline = this.createModalButton(
      'Esc — უარი',
      '#b44c48'
    )

    accept.addEventListener('click', () => {
      this.showForgeGames()
    })

    decline.addEventListener('click', () => {
      this.closeForgeModal()
    })

    buttons.append(accept, decline)
    card.append(icon, title, text, controls, buttons)
    overlay.appendChild(card)
    document.body.appendChild(overlay)

    this.forgeIntroOverlay = overlay
  }

  private showForgeGames() {
    if (!this.forgeEnabled()) {
      this.closeForgeModal()
      return
    }

    this.forgeIntroOverlay?.remove()
    this.forgeIntroOverlay = null
    this.forgeGamesOverlay?.remove()
    this.forgeGamesOverlay = null

    this.interactionPrompt.style.display = 'none'
    this.currentInteraction = null

    const overlay = this.createModalOverlay()
    const card = this.createModalCard()
    card.style.maxWidth = 'min(860px, 96vw)'

    const title = document.createElement('h1')
    title.textContent = '⚒️ სამჭედლო'
    title.style.cssText = `
      margin: 0 0 6px;
      font-size: clamp(26px, 4vw, 36px);
      color: #784323;
    `

    const subtitle = document.createElement('p')
    subtitle.textContent =
      `აირჩიე თამაში. ფასიანი თამაშის გასახსნელად ${ECONOMY.BOOKS_PER_GAME} 📘 გჭირდება.`
    subtitle.style.cssText = `
      margin: 0 0 14px;
      color: #536579;
      line-height: 1.6;
    `

    const balance = document.createElement('div')
    balance.textContent = `🪙 ${this.state.coins}      📘 ${this.state.books}`
    balance.style.cssText = `
      display: inline-block;
      margin-bottom: 18px;
      padding: 8px 18px;
      border-radius: 999px;
      background: rgba(255,255,255,0.85);
      border: 1px solid #d1dfeb;
      font-weight: bold;
      font-size: 17px;
    `

    const list = document.createElement('div')
    list.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
      text-align: left;
    `

    for (const game of GAMES) {
      const unlocked = game.free || this.state.isGameUnlocked(game.id)
      const playable = game.available && unlocked
      const buyable = game.available && !unlocked
      const visual = gameVisual(game.id)

      const item = document.createElement('div')
      item.style.cssText = `
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px;
        border: 2px solid #d1dfeb;
        border-radius: 20px;
        background: rgba(255,255,255,0.85);
        color: #26364a;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      `

      // ხატულა: ფერადი ფილა თამაშის სახით
      const tile = document.createElement('div')
      tile.innerHTML = visual.svg
      tile.style.cssText = `
        position: relative;
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 76px;
        height: 76px;
        border-radius: 22px;
        background: linear-gradient(145deg, ${visual.colors[0]}, ${visual.colors[1]});
        box-shadow: 0 6px 14px rgba(30, 60, 90, 0.22), inset 0 2px 0 rgba(255,255,255,0.45);
        ${game.available ? '' : 'filter: grayscale(0.85) brightness(1.05); opacity: 0.8;'}
      `
      const svgEl = tile.querySelector('svg')
      if (svgEl) {
        svgEl.setAttribute('width', '56')
        svgEl.setAttribute('height', '56')
      }

      if (buyable) {
        const lock = document.createElement('span')
        lock.textContent = '🔒'
        lock.style.cssText = `
          position: absolute;
          right: -6px;
          bottom: -6px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #fff3d6;
          border: 2px solid #e0a030;
          font-size: 14px;
        `
        tile.appendChild(lock)
      }

      const details = document.createElement('div')
      details.style.cssText = 'display: flex; flex-direction: column; gap: 8px; min-width: 0;'

      const name = document.createElement('span')
      name.textContent = game.name
      name.style.cssText = 'font-size: 18px; font-weight: 800; line-height: 1.2;'

      const status = document.createElement('span')
      status.textContent = playable
        ? game.free
          ? '▶ უფასო თამაში'
          : '▶ თამაში'
        : buyable
          ? `🔓 გახსნა — ${ECONOMY.BOOKS_PER_GAME} 📘`
          : 'მალე დაემატება'
      const pillColors = playable
        ? 'background: #def7e6; color: #17703d; border: 1px solid #8fd3a8;'
        : buyable
          ? 'background: #fff0cf; color: #9a5a00; border: 1px solid #e8bb66;'
          : 'background: #eceff3; color: #6a7a8c; border: 1px solid #d3dae2;'
      status.style.cssText = `
        align-self: flex-start;
        padding: 4px 12px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 800;
        ${pillColors}
      `

      details.append(name, status)
      item.append(tile, details)

      if (playable || buyable) {
        item.style.cursor = 'pointer'
        item.style.borderColor = playable ? '#4cb877' : '#e0a030'
        item.style.background = playable
          ? 'linear-gradient(135deg, #f0fff4, #ffffff)'
          : 'linear-gradient(135deg, #fff8e8, #ffffff)'
        item.setAttribute('role', 'button')
        item.tabIndex = 0
        item.setAttribute('aria-label', game.name)

        const handler = () => {
          if (playable) {
            if (game.id === 'cpu-dash') this.startCPUDash()
            if (game.id === 'typing-grandmaster') this.startTypingGrandmaster()
            if (game.id === 'flappy-floppy') this.startFlappyFloppy()
            if (game.id === 'jump-up-tower') this.startJumpUpTower()
            return
          }

          if (this.state.unlockGame(game.id)) {
            this.showToast(`🔓 ${game.name} გაიხსნა!`)
            this.showForgeGames()
          } else {
            this.showToast(
              `არ გაკლია წიგნი: ${game.name}-ის გასახსნელად ${ECONOMY.BOOKS_PER_GAME} 📘 გჭირდება`
            )
          }
        }

        item.addEventListener('click', handler)
        item.addEventListener('mouseenter', () => {
          item.style.transform = 'translateY(-3px)'
          item.style.boxShadow = '0 10px 22px rgba(30, 90, 70, 0.18)'
        })
        item.addEventListener('mouseleave', () => {
          item.style.transform = 'none'
          item.style.boxShadow = 'none'
        })
        item.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handler()
          }
        })
      } else {
        item.style.opacity = '0.85'
      }

      list.appendChild(item)
    }

    const footer = document.createElement('p')
    footer.textContent = 'Esc — დახურვა'
    footer.style.cssText = `
      margin: 22px 0 0;
      color: #586b7c;
      font-size: 14px;
      font-weight: bold;
    `

    const closeButton = this.createModalButton('დახურვა', '#315b88')
    closeButton.style.marginTop = '12px'
    closeButton.addEventListener('click', () => {
      this.closeForgeModal()
    })

    card.append(title, subtitle, balance, list, footer, closeButton)
    overlay.appendChild(card)
    document.body.appendChild(overlay)

    this.forgeGamesOverlay = overlay
  }

  private startCPUDash() {
    if (!this.forgeEnabled() || this.cpuDashActive) return
    if (!this.state.isGameUnlocked('cpu-dash')) return

    this.forgeGamesOverlay?.remove()
    this.forgeGamesOverlay = null
    this.forgeIntroOverlay?.remove()
    this.forgeIntroOverlay = null

    this.interactionPrompt.style.display = 'none'
    this.currentInteraction = null
    this.cpuDashActive = true
    this.clock.getDelta()

    this.cpuDash = new CPUDash({
      onClose: () => {
        this.cpuDash = null
        this.cpuDashActive = false
        this.clock.getDelta()
        this.updateInteractions()
      },
    })
  }

  private startTypingGrandmaster() {
    if (!this.forgeEnabled() || this.typingGrandmasterActive) return

    this.forgeGamesOverlay?.remove()
    this.forgeGamesOverlay = null
    this.forgeIntroOverlay?.remove()
    this.forgeIntroOverlay = null

    this.interactionPrompt.style.display = 'none'
    this.currentInteraction = null
    this.typingGrandmasterActive = true
    this.clock.getDelta()

    this.typingGrandmaster = new TypingGrandmaster({
      onClose: () => {
        this.typingGrandmaster = null
        this.typingGrandmasterActive = false
        this.clock.getDelta()
        this.updateInteractions()
      },
      onStageComplete: (stage) => {
        const coins = ECONOMY.TYPING_COINS_PER_STAGE
        this.state.addTypingCoins(coins)
        this.showToast(`🪙 +${coins} მონეტა — ეტაპი ${stage} დასრულდა!`)
      },
      onSuccess: (stats) => {
        console.log('Typing Grandmaster completed:', stats)
      },
    })
  }

  private startFlappyFloppy() {
    if (!this.forgeEnabled() || this.flappyActive) return
    if (!this.state.isGameUnlocked('flappy-floppy')) return

    this.forgeGamesOverlay?.remove()
    this.forgeGamesOverlay = null
    this.forgeIntroOverlay?.remove()
    this.forgeIntroOverlay = null

    this.interactionPrompt.style.display = 'none'
    this.currentInteraction = null
    this.flappyActive = true
    this.clock.getDelta()

    this.flappyFloppy = new FlappyFloppy({
      onClose: () => {
        this.flappyFloppy = null
        this.flappyActive = false
        this.clock.getDelta()
        this.updateInteractions()
      },
    })
  }

  private startJumpUpTower() {
    if (!this.forgeEnabled() || this.jumpTowerActive) return
    if (!this.state.isGameUnlocked('jump-up-tower')) return

    this.forgeGamesOverlay?.remove()
    this.forgeGamesOverlay = null
    this.forgeIntroOverlay?.remove()
    this.forgeIntroOverlay = null

    this.interactionPrompt.style.display = 'none'
    this.currentInteraction = null
    this.jumpTowerActive = true
    this.clock.getDelta()

    this.jumpUpTower = new JumpUpTower({
      onClose: () => {
        this.jumpUpTower = null
        this.jumpTowerActive = false
        this.clock.getDelta()
        this.updateInteractions()
      },
    })
  }

  private closeForgeModal() {
    this.panels.close()
    this.forgeIntroOverlay?.remove()
    this.forgeGamesOverlay?.remove()

    this.forgeIntroOverlay = null
    this.forgeGamesOverlay = null

    this.currentInteraction = null
    this.updateInteractions()
  }

  private enterKingdom() {
    this.currentWorld = 'kingdom'

    for (const object of this.islandObjects) {
      object.visible = false
    }

    this.kingdom.group.visible = true
    this.cycle?.setEnabled(true)

    this.player.enterWorld(
      this.kingdomCollision,
      this.kingdom.spawn.x,
      this.kingdom.spawn.z,
      this.kingdom.radius
    )

    this.gameCamera.reset()
    this.updateLocationLabel()
    this.updateInteractions()
  }

  private returnToIsland() {
    this.closeForgeModal()
    this.currentWorld = 'island'
    this.kingdom.group.visible = false
    this.cycle?.setEnabled(false)

    for (const object of this.islandObjects) {
      object.visible = true
    }

    this.player.enterWorld(
      this.islandCollision,
      0,
      -5.5,
      12.5
    )

    this.gameCamera.reset()
    this.updateLocationLabel()
    this.updateInteractions()
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (this.changingGrade) return
    if (this.miniGameActive()) return

    if (event.code === 'Escape' && this.isForgeModalOpen()) {
      event.preventDefault()
      event.stopPropagation()
      this.closeForgeModal()
      return
    }

    if (
      event.code === 'Enter' &&
      this.forgeIntroOverlay !== null
    ) {
      event.preventDefault()
      event.stopPropagation()
      this.showForgeGames()
      return
    }

    // მასწავლებლის კოდების ფანჯარა: M ხსნის და ხურავს
    if (event.code === 'KeyM' && !event.repeat && !this.paused && this.teacherCodes) {
      if (this.panels.isCodesOpen()) {
        this.closeForgeModal()
      } else if (!this.isForgeModalOpen()) {
        this.panels.openTeacherCodes(this.teacherCodes)
        this.updateInteractions()
      }
      return
    }

    if (this.isForgeModalOpen()) return

    if (event.code === 'Escape') {
      if (this.paused) {
        this.resumeGame()
      } else {
        this.pauseGame()
      }
      return
    }

    if (
      event.code === 'KeyT' &&
      !event.repeat &&
      !this.paused &&
      this.currentWorld === 'kingdom' &&
      this.cycle
    ) {
      const order: DayPhase[] = ['day', 'evening', 'night', 'dawn']
      const next = order[(order.indexOf(this.cycle.phase) + 1) % order.length]
      this.cycle.setPhase(next)
      this.updateLocationLabel()
      return
    }

    if (
      event.code !== 'KeyE' ||
      event.repeat ||
      this.paused
    ) {
      return
    }

    this.updateInteractions()

    if (!this.currentInteraction) return

    if (this.currentInteraction.type === 'enter') {
      this.enterKingdom()
      return
    }

    if (this.currentInteraction.type === 'exit') {
      this.returnToIsland()
      return
    }

    if (this.currentInteraction.type === 'building') {
      const building = this.currentInteraction.building

      if (building.id === 'forge') {
        if (!this.forgeEnabled()) return

        // პირველ მისვლაზე მისალმების ტექსტი, შემდეგ — პირდაპირ თამაშების არჩევანი
        if (this.state.forgeIntroSeen) {
          this.showForgeGames()
        } else {
          this.showForgeIntro()
        }
        return
      }

      if (building.id === 'library') {
        this.panels.openLibrary()
        return
      }

      if (building.id === 'academy') {
        this.panels.openAcademy()
        return
      }

      if (building.id === 'market') {
        this.panels.openShop()
        return
      }

      if (building.id === 'treasury') {
        this.panels.openWallet()
        return
      }

      this.interactionPrompt.textContent =
        `🏗️ ${building.name} — მისიები მალე დაემატება`
    }
  }

  private pauseGame() {
    this.paused = true
    this.pauseMenu.show()

    document.body.classList.add('game-paused')
    this.interactionPrompt.style.display = 'none'
  }

  private resumeGame() {
    this.paused = false
    this.pauseMenu.hide()

    document.body.classList.remove('game-paused')
    this.clock.getDelta()
  }

  private handlePauseAction = (action: PauseAction) => {
    if (action === 'resume') {
      this.resumeGame()
      return
    }

    if (action === 'restart') {
      this.restartGame()
      return
    }

    if (action === 'change-grade') {
      void this.changeGrade()
    }
  }

  private restartGame() {
    if (this.currentWorld === 'kingdom') {
      this.returnToIsland()
    }

    this.player.enterWorld(
      this.islandCollision,
      0,
      7,
      12.5
    )

    this.gameCamera.reset()
    this.resumeGame()
  }

  private async changeGrade() {
    if (this.changingGrade) return

    this.changingGrade = true
    this.closeForgeModal()
    this.pauseMenu.hide()

    const selection = await showGradeSelect()

    this.grade = selection.grade
    this.teacherCodes = selection.teacherCodes
    this.state.setTeacherMode(this.teacherCodes !== null)
    this.updateGradeUI()

    if (this.currentWorld === 'kingdom') {
      this.returnToIsland()
    }

    this.player.enterWorld(
      this.islandCollision,
      0,
      7,
      12.5
    )

    this.gameCamera.reset()
    this.changingGrade = false
    this.resumeGame()
  }

  private onResize = () => {
    this.layoutHud()
    this.renderer.setSize(
      window.innerWidth,
      window.innerHeight
    )

    this.gameCamera.resize()
  }

  private animate = () => {
    requestAnimationFrame(this.animate)

    const delta = Math.min(
      this.clock.getDelta(),
      0.05
    )

    const modalOpen = this.isForgeModalOpen()

    if (!this.paused && !this.changingGrade && !modalOpen && !this.miniGameActive()) {
      this.player.update(
        delta,
        this.gameCamera.yaw
      )

      if (this.currentWorld === 'kingdom') {
        this.kingdom.animals.update(delta)
        this.kingdom.update(delta)
        this.cycle?.update(delta)

        if (this.cycle && this.cycle.timeLabel !== this.lastTimeLabel) {
          this.updateLocationLabel()
        }
      }

      this.gameCamera.update(this.player.group)
      this.updateInteractions()
    }

    this.renderer.render(
      this.scene,
      this.gameCamera.camera
    )
  }
}