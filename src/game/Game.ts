import * as THREE from 'three'

import {
  type CharacterGender,
} from '../characters/Character'

import {
  showCharacterSelect,
} from '../ui/CharacterSelect'

import {
  PauseMenu,
  type PauseAction,
} from '../ui/PauseMenu'

import {
  createWorld,
} from './World'

import {
  CollisionSystem,
} from './Collision'

import {
  Player,
} from './Player'

import {
  GameCamera,
} from './Camera'

export class Game {
  private readonly scene:
    THREE.Scene

  private readonly renderer:
    THREE.WebGLRenderer

  private player:
    Player

  private readonly gameCamera:
    GameCamera

  private readonly clock:
    THREE.Clock

  private readonly pauseMenu:
    PauseMenu

  private readonly collisionSystem:
    CollisionSystem

  private paused = false

  private changingCharacter = false

  constructor(
    gender: CharacterGender
  ) {
    this.scene =
      new THREE.Scene()

    this.renderer =
      new THREE.WebGLRenderer({
        antialias: true,
      })

    this.renderer.setSize(
      window.innerWidth,
      window.innerHeight
    )

    this.renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2
      )
    )

    this.renderer.shadowMap.enabled =
      true

    this.renderer.shadowMap.type =
      THREE.PCFSoftShadowMap

    this.renderer.outputColorSpace =
      THREE.SRGBColorSpace

    document.body.appendChild(
      this.renderer.domElement
    )

    // Build world and receive
    // its collision information.
    const world =
      createWorld(this.scene)

    this.collisionSystem =
      new CollisionSystem(
        world.colliders
      )

    this.player =
      new Player(
        gender,
        this.collisionSystem
      )

    this.scene.add(
      this.player.group
    )

    this.gameCamera =
      new GameCamera(
        this.renderer.domElement
      )

    this.clock =
      new THREE.Clock()

    this.createUI()

    this.pauseMenu =
      new PauseMenu()

    this.pauseMenu.onAction(
      this.handlePauseAction
    )

    window.addEventListener(
      'keydown',
      this.onKeyDown
    )

    window.addEventListener(
      'resize',
      this.onResize
    )

    this.animate()
  }

  private createUI() {
    const ui =
      document.createElement('div')

    ui.className =
      'game-ui'

    ui.innerHTML = `
      <div class="title">
        DIGITAL KINGDOM
      </div>

      <div class="stars">
        ⭐ <span>0 / 5</span>
      </div>

      <div class="welcome">
        <strong>
          კეთილი იყოს შენი მობრძანება!
        </strong>

        <span>
          გამოიკვლიე ციფრული სამეფო ✨
        </span>
      </div>

      <div class="controls">

        <div>
          <kbd>W</kbd>
          <kbd>A</kbd>
          <kbd>S</kbd>
          <kbd>D</kbd>
          მოძრაობა
        </div>

        <div>
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          <kbd>←</kbd>
          <kbd>→</kbd>
          მოძრაობა
        </div>

        <div>
          🖱️ კამერა
        </div>

        <div>
          <kbd>SPACE</kbd>
          ახტომა
        </div>

        <div>
          <kbd>E</kbd>
          ინტერაქცია
        </div>

        <div>
          <kbd>ESC</kbd>
          მენიუ
        </div>

      </div>
    `

    document.body.appendChild(
      ui
    )
  }

  private onKeyDown = (
    event: KeyboardEvent
  ) => {
    if (
      event.code !==
      'Escape'
    ) {
      return
    }

    if (
      this.changingCharacter
    ) {
      return
    }

    if (this.paused) {
      this.resumeGame()
    } else {
      this.pauseGame()
    }
  }

  private pauseGame() {
    this.paused = true

    this.pauseMenu.show()

    document.body.classList.add(
      'game-paused'
    )
  }

  private resumeGame() {
    this.paused = false

    this.pauseMenu.hide()

    document.body.classList.remove(
      'game-paused'
    )

    this.clock.getDelta()
  }

  private handlePauseAction = (
    action: PauseAction
  ) => {
    if (
      action === 'resume'
    ) {
      this.resumeGame()
      return
    }

    if (
      action === 'restart'
    ) {
      this.restartGame()
      return
    }

    if (
      action ===
      'change-character'
    ) {
      void this.changeCharacter()
    }
  }

  private restartGame() {
    this.player.reset()

    this.gameCamera.reset()

    this.resumeGame()
  }

  private async changeCharacter() {
    if (
      this.changingCharacter
    ) {
      return
    }

    this.changingCharacter = true

    this.pauseMenu.hide()

    const selection =
      await showCharacterSelect()

    this.scene.remove(
      this.player.group
    )

    this.player.destroy()

    this.player =
      new Player(
        selection.gender,
        this.collisionSystem
      )

    this.scene.add(
      this.player.group
    )

    this.gameCamera.reset()

    this.changingCharacter = false

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
    requestAnimationFrame(
      this.animate
    )

    const delta =
      Math.min(
        this.clock.getDelta(),
        0.05
      )

    if (!this.paused) {
      this.player.update(
        delta,
        this.gameCamera.yaw
      )

      this.gameCamera.update(
        this.player.group
      )
    }

    this.renderer.render(
      this.scene,
      this.gameCamera.camera
    )
  }
}