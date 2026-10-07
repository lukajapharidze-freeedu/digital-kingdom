import * as THREE from 'three'
import { createBoy } from '../characters/Boy'
import { createGirl } from '../characters/Girl'
import type { CharacterGender } from '../characters/Character'

export interface CharacterSelectResult {
  gender: CharacterGender
}

export function showCharacterSelect(): Promise<CharacterSelectResult> {
  return new Promise((resolve) => {
    let selectedGender: CharacterGender = 'boy'

    // ========================================================
    // OVERLAY
    // ========================================================

    const overlay = document.createElement('div')
    overlay.className = 'character-select'

    overlay.innerHTML = `
      <div class="character-select-bg"></div>

      <div class="character-select-content">

        <div class="game-logo">
          <div class="logo-crown">♛</div>
          <h1>DIGITAL KINGDOM</h1>
          <p>ციფრული თავგადასავალი იწყება აქ</p>
        </div>

        <div class="select-heading">
          <h2>აირჩიე შენი გმირი</h2>
          <p>ვისთან ერთად დაიწყებ თავგადასავალს?</p>
        </div>

        <div class="character-cards">

          <button
            class="character-card selected"
            data-character="boy"
            type="button"
          >
            <div class="character-preview">
              <canvas id="boy-preview"></canvas>
            </div>

            <div class="character-name">
              ბიჭი
            </div>

            <div class="character-check">
              ✓
            </div>
          </button>

          <button
            class="character-card"
            data-character="girl"
            type="button"
          >
            <div class="character-preview">
              <canvas id="girl-preview"></canvas>
            </div>

            <div class="character-name">
              გოგო
            </div>

            <div class="character-check">
              ✓
            </div>
          </button>

        </div>

        <button
          class="start-adventure"
          type="button"
        >
          დაიწყე თავგადასავალი
          <span>→</span>
        </button>

      </div>
    `

    document.body.appendChild(overlay)

    // ========================================================
    // THREE.JS PREVIEW
    // ========================================================

    const boyCanvas =
      overlay.querySelector<HTMLCanvasElement>(
        '#boy-preview'
      )!

    const girlCanvas =
      overlay.querySelector<HTMLCanvasElement>(
        '#girl-preview'
      )!

    const boy = createBoy()
    const girl = createGirl()

    interface Preview {
      renderer: THREE.WebGLRenderer
      scene: THREE.Scene
      camera: THREE.PerspectiveCamera
      character: THREE.Group
    }

    function createPreview(
      canvas: HTMLCanvasElement,
      character: THREE.Group
    ): Preview {
      const renderer =
        new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
        })

      renderer.setPixelRatio(
        Math.min(
          window.devicePixelRatio,
          2
        )
      )

      renderer.outputColorSpace =
        THREE.SRGBColorSpace

      const scene = new THREE.Scene()

      const camera =
        new THREE.PerspectiveCamera(
          35,
          1,
          0.1,
          50
        )

      camera.position.set(
        0,
        2.3,
        7.5
      )

      camera.lookAt(
        0,
        1.55,
        0
      )

      const hemisphere =
        new THREE.HemisphereLight(
          0xffffff,
          0x557744,
          3
        )

      scene.add(hemisphere)

      const light =
        new THREE.DirectionalLight(
          0xfff0d5,
          4
        )

      light.position.set(
        -3,
        6,
        5
      )

      scene.add(light)

      // Our character faces -Z.
      // Rotate it so it faces the preview camera.

      character.rotation.y = Math.PI

      scene.add(character)

      return {
        renderer,
        scene,
        camera,
        character,
      }
    }

    const boyPreview =
      createPreview(
        boyCanvas,
        boy.group
      )

    const girlPreview =
      createPreview(
        girlCanvas,
        girl.group
      )

    function resizePreview(
      preview: Preview,
      canvas: HTMLCanvasElement
    ) {
      const width =
        canvas.clientWidth

      const height =
        canvas.clientHeight

      if (
        canvas.width !== width ||
        canvas.height !== height
      ) {
        preview.renderer.setSize(
          width,
          height,
          false
        )

        preview.camera.aspect =
          width / height

        preview.camera
          .updateProjectionMatrix()
      }
    }

    // ========================================================
    // CHARACTER SELECTION
    // ========================================================

    const cards =
      Array.from(
        overlay.querySelectorAll<HTMLButtonElement>(
          '.character-card'
        )
      )

    function selectCharacter(
      gender: CharacterGender
    ) {
      selectedGender = gender

      cards.forEach((card) => {
        const selected =
          card.dataset.character === gender

        card.classList.toggle(
          'selected',
          selected
        )
      })
    }

    cards.forEach((card) => {
      card.addEventListener(
        'click',
        () => {
          const gender =
            card.dataset.character as CharacterGender

          selectCharacter(gender)
        }
      )
    })

    // ========================================================
    // START GAME
    // ========================================================

    const startButton =
      overlay.querySelector<HTMLButtonElement>(
        '.start-adventure'
      )!

    startButton.addEventListener(
      'click',
      () => {
        localStorage.setItem(
          'digitalKingdomCharacter',
          selectedGender
        )

        overlay.classList.add(
          'character-select-leaving'
        )

        window.setTimeout(
          () => {
            boyPreview.renderer.dispose()
            girlPreview.renderer.dispose()

            overlay.remove()

            resolve({
              gender: selectedGender,
            })
          },
          500
        )
      }
    )

    // ========================================================
    // PREVIEW ANIMATION
    // ========================================================

    const clock =
      new THREE.Clock()

    let animationFrame = 0

    function animate() {
      if (!document.body.contains(overlay)) {
        cancelAnimationFrame(
          animationFrame
        )

        return
      }

      animationFrame =
        requestAnimationFrame(
          animate
        )

      const time =
        clock.getElapsedTime()

      resizePreview(
        boyPreview,
        boyCanvas
      )

      resizePreview(
        girlPreview,
        girlCanvas
      )

      boyPreview.character.position.y =
        Math.sin(time * 2) * 0.04

      girlPreview.character.position.y =
        Math.sin(
          time * 2 + 0.5
        ) * 0.04

      boyPreview.character.rotation.y =
        Math.PI +
        Math.sin(time * 0.8) *
          0.08

      girlPreview.character.rotation.y =
        Math.PI +
        Math.sin(
          time * 0.8 + 0.4
        ) *
          0.08

      boyPreview.renderer.render(
        boyPreview.scene,
        boyPreview.camera
      )

      girlPreview.renderer.render(
        girlPreview.scene,
        girlPreview.camera
      )
    }

    animate()
  })
}