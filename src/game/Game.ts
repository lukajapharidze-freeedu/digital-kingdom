
import * as THREE from 'three'

import {
  showGradeSelect,
  type Grade,
} from '../ui/GradeSelect'

import {
  PauseMenu,
  type PauseAction,
} from '../ui/PauseMenu'

import { createWorld } from './World'
import { CollisionSystem } from './Collision'
import { Player } from './Player'
import { GameCamera } from './Camera'
import { CPUDash } from '../minigames/CPUDash'

import {
  createKingdomWorld,
  type KingdomWorldData,
  type KingdomBuilding,
} from '../worlds/KingdomWorld'

type WorldName = 'island' | 'kingdom'

const FORGE_INTRO_TEXT =
  'სამჭედლოში უნდა გამოვწრთოთ შენი ცოდნა, რომელიც იქნება ისეთივე ბასრი, როგორც სამურაის ხმალი. წინ გელოდება თამაშის სამყარო, თუმცა დაბრკოლებებით სავსე. მზად ხარ ამ გამოწვევისთვის?'

const MINI_GAMES = [
  'CPU Dash',
  'Ping-Pong-Dong',
  'Cliff Climber',
  'Flappy Floppy',
  'Jump Up Tower',
  'Typing Grandmaster',
]

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

  private readonly interactionPrompt: HTMLDivElement
  private readonly locationLabel: HTMLDivElement

  private forgeIntroOverlay: HTMLDivElement | null = null
  private forgeGamesOverlay: HTMLDivElement | null = null
  private cpuDashActive = false
  private cpuDash: CPUDash | null = null

  private currentWorld: WorldName = 'island'
  private grade: Grade
  private paused = false
  private changingGrade = false

  private currentInteraction:
    | { type: 'enter' }
    | { type: 'exit' }
    | { type: 'building'; building: KingdomBuilding }
    | null = null

  constructor(grade: Grade) {
    this.grade = grade
    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    })

    this.renderer.setSize(
      window.innerWidth,
      window.innerHeight
    )

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    )

    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    document.body.appendChild(this.renderer.domElement)

    const island = createWorld(this.scene)

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

    this.pauseMenu = new PauseMenu()
    this.pauseMenu.onAction(this.handlePauseAction)

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('resize', this.onResize)

    this.animate()
  }

  private getGradeRoman(): string {
    if (this.grade === 2) return 'II'
    if (this.grade === 3) return 'III'
    return 'IV'
  }

  private createUI() {
    const ui = document.createElement('div')
    ui.className = 'game-ui'

    ui.innerHTML = `
      <div class="title">DIGITAL KINGDOM</div>
      <div class="stars">⭐ <span>0 / 5</span></div>
      <div class="welcome">
        <strong>კეთილი იყოს შენი მობრძანება!</strong>
        <span>${this.getGradeRoman()} კლასი • გამოიკვლიე ციფრული სამეფო ✨</span>
      </div>
      <div class="controls">
        <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> მოძრაობა</div>
        <div><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> მოძრაობა</div>
        <div>🖱️ კამერა</div>
        <div><kbd>SPACE</kbd> ახტომა</div>
        <div><kbd>E</kbd> ინტერაქცია</div>
        <div><kbd>ESC</kbd> მენიუ</div>
      </div>
    `

    document.body.appendChild(ui)
  }

  private updateGradeUI() {
    const welcome = document.querySelector('.welcome span')

    if (welcome) {
      welcome.textContent =
        `${this.getGradeRoman()} კლასი • გამოიკვლიე ციფრული სამეფო ✨`
    }
  }

  private updateLocationLabel() {
    this.locationLabel.textContent =
      this.currentWorld === 'island'
        ? '🏝️ საწყისი კუნძული'
        : '🏰 ციფრული სამეფოს ეზო'
  }

  private distanceTo(x: number, z: number) {
    const position = this.player.group.position
    return Math.hypot(position.x - x, position.z - z)
  }

  private isForgeModalOpen() {
    return (
      this.forgeIntroOverlay !== null ||
      this.forgeGamesOverlay !== null
    )
  }

  private updateInteractions() {
    if (
      this.paused ||
      this.changingGrade ||
      this.isForgeModalOpen() ||
      this.cpuDashActive
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
          // სამჭედლოს სპეციალური ფუნქცია მხოლოდ IV კლასისთვისაა.
          if (building.id === 'forge' && this.grade !== 4) {
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
    if (this.grade !== 4 || this.isForgeModalOpen()) return

    this.interactionPrompt.style.display = 'none'
    this.currentInteraction = null

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
    if (this.grade !== 4) {
      this.closeForgeModal()
      return
    }

    this.forgeIntroOverlay?.remove()
    this.forgeIntroOverlay = null

    const overlay = this.createModalOverlay()
    const card = this.createModalCard()

    const icon = document.createElement('div')
    icon.textContent = '🕹️'
    icon.style.cssText = 'font-size: 48px; margin-bottom: 6px;'

    const title = document.createElement('h1')
    title.textContent = 'აირჩიე შენი გამოწვევა!'
    title.style.cssText = `
      margin: 0 0 8px;
      font-size: clamp(24px, 4vw, 34px);
      color: #315b88;
    `

    const subtitle = document.createElement('p')
    subtitle.textContent =
      'თითოეული თამაში ახალი უნარის გამომუშავებაში დაგეხმარება.'
    subtitle.style.cssText = `
      margin: 0 0 22px;
      color: #536579;
      line-height: 1.6;
    `

    const list = document.createElement('div')
    list.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 12px;
      text-align: left;
    `

    const gameIcons = ['💻', '🏓', '🧗', '🐦', '🗼', '⌨️']

    for (let i = 0; i < MINI_GAMES.length; i++) {
      const item = document.createElement('div')

      item.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 15px;
        border: 1px solid #d1dfeb;
        border-radius: 14px;
        background: rgba(255,255,255,0.8);
        color: #26364a;
        font-size: 15px;
        font-weight: bold;
      `

      const gameIcon = document.createElement('span')
      gameIcon.textContent = gameIcons[i]
      gameIcon.style.fontSize = '27px'

      const details = document.createElement('div')
      details.style.cssText = 'display: flex; flex-direction: column; gap: 5px;'

      const name = document.createElement('span')
      name.textContent = MINI_GAMES[i]

      const status = document.createElement('small')
      status.textContent = i === 0 ? '▶ თამაში' : 'მალე დაემატება'
      status.style.cssText = `
        color: ${i === 0 ? '#18834a' : '#718197'};
        font-size: 11px;
        font-weight: normal;
      `

      details.append(name, status)
      item.append(gameIcon, details)

      if (i === 0) {
        item.style.cursor = 'pointer'
        item.style.border = '2px solid #38a169'
        item.style.background = 'linear-gradient(135deg, #f0fff4, #ffffff)'
        item.setAttribute('role', 'button')
        item.tabIndex = 0
        item.setAttribute('aria-label', 'CPU Dash თამაშის დაწყება')
        item.addEventListener('click', () => this.startCPUDash())
        item.addEventListener('mouseenter', () => {
          item.style.transform = 'translateY(-2px)'
          item.style.boxShadow = '0 8px 18px rgba(25, 120, 70, 0.18)'
        })
        item.addEventListener('mouseleave', () => {
          item.style.transform = 'none'
          item.style.boxShadow = 'none'
        })
        item.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            this.startCPUDash()
          }
        })
      } else {
        item.style.opacity = '0.78'
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

    const closeButton = this.createModalButton(
      'დახურვა',
      '#315b88'
    )

    closeButton.style.marginTop = '12px'
    closeButton.addEventListener('click', () => {
      this.closeForgeModal()
    })

    card.append(icon, title, subtitle, list, footer, closeButton)
    overlay.appendChild(card)
    document.body.appendChild(overlay)

    this.forgeGamesOverlay = overlay
  }

  private startCPUDash() {
    if (this.grade !== 4 || this.cpuDashActive) return

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

  private closeForgeModal() {
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
    if (this.cpuDashActive) return

    // სამჭედლოს ფანჯრებში Escape პაუზას არ ხსნის.
    if (event.code === 'Escape' && this.isForgeModalOpen()) {
      event.preventDefault()
      event.stopPropagation()
      this.closeForgeModal()
      return
    }

    // Enter ადასტურებს თანხმობას და აჩვენებს თამაშების სიას.
    if (
      event.code === 'Enter' &&
      this.forgeIntroOverlay !== null
    ) {
      event.preventDefault()
      event.stopPropagation()
      this.showForgeGames()
      return
    }

    // სამჭედლოს ფანჯრის დროს სხვა თამაშის მართვის ღილაკები იგნორირდება.
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
        if (this.grade === 4) {
          this.showForgeIntro()
        }
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

    if (!this.paused && !this.changingGrade && !modalOpen && !this.cpuDashActive) {
      this.player.update(
        delta,
        this.gameCamera.yaw
      )

      if (this.currentWorld === 'kingdom') {
        this.kingdom.animals.update(delta)
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
