import * as THREE from 'three'

import {
  createCharacter,
} from '../characters/Character'

export type Grade =
  | 2
  | 3
  | 4

export interface GradeSelectResult {
  grade: Grade
}

export function showGradeSelect():
  Promise<GradeSelectResult> {
  return new Promise(
    (resolve) => {
      let selectedGrade:
        Grade = 2

      const overlay =
        document.createElement(
          'div'
        )

      overlay.className =
        'grade-select'

      overlay.innerHTML = `
        <div class="grade-select-bg">
        </div>

        <div class="grade-select-content">

          <div class="game-logo">
            <div class="logo-crown">
              ♛
            </div>

            DIGITAL KINGDOM
          </div>

          <div class="grade-hero-area">

            <canvas
              id="robot-preview"
              class="robot-preview">
            </canvas>

          </div>

          <h1 class="select-heading">
            აირჩიე შენი კლასი
          </h1>

          <p class="grade-description">
            დავალებები შენს კლასს
            მოერგება
          </p>

          <div class="grade-cards">

            <button
              class="grade-card selected"
              data-grade="2"
              type="button"
            >
              <span class="grade-number">
                II
              </span>

              <span class="grade-label">
                კლასი
              </span>

              <span class="grade-check">
                ✓
              </span>
            </button>

            <button
              class="grade-card"
              data-grade="3"
              type="button"
            >
              <span class="grade-number">
                III
              </span>

              <span class="grade-label">
                კლასი
              </span>

              <span class="grade-check">
                ✓
              </span>
            </button>

            <button
              class="grade-card"
              data-grade="4"
              type="button"
            >
              <span class="grade-number">
                IV
              </span>

              <span class="grade-label">
                კლასი
              </span>

              <span class="grade-check">
                ✓
              </span>
            </button>

          </div>

          <button
            class="start-adventure"
            type="button"
          >
            დაიწყე თავგადასავალი
            →
          </button>

        </div>
      `

      document.body.appendChild(
        overlay
      )

      const cards =
        overlay
          .querySelectorAll<HTMLButtonElement>(
            '.grade-card'
          )

      cards.forEach(
        (card) => {
          card.addEventListener(
            'click',
            () => {
              const value =
                Number(
                  card.dataset.grade
                ) as Grade

              selectedGrade =
                value

              cards.forEach(
                (otherCard) => {
                  otherCard
                    .classList
                    .remove(
                      'selected'
                    )
                }
              )

              card.classList.add(
                'selected'
              )
            }
          )
        }
      )

      // ========================================================
      // ROBOT 3D PREVIEW
      // ========================================================

      const canvas =
        overlay
          .querySelector<HTMLCanvasElement>(
            '#robot-preview'
          )!

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

      renderer.setSize(
        300,
        300,
        false
      )

      renderer.outputColorSpace =
        THREE.SRGBColorSpace

      const scene =
        new THREE.Scene()

      const camera =
        new THREE.PerspectiveCamera(
          35,
          1,
          0.1,
          100
        )

      camera.position.set(
        0,
        2.8,
        8.5
      )

      camera.lookAt(
        0,
        1.8,
        0
      )

      const ambient =
        new THREE.HemisphereLight(
          0xffffff,
          0x7a9a70,
          3
        )

      scene.add(ambient)

      const light =
        new THREE.DirectionalLight(
          0xffffff,
          3
        )

      light.position.set(
        -4,
        7,
        6
      )

      scene.add(light)

      const character =
        createCharacter()

      // Character faces -Z.
      // Preview camera is +Z,
      // so rotate it toward us.
      character.group.rotation.y =
        Math.PI

      character.group.position.y =
        -0.2

      scene.add(
        character.group
      )

      let animationFrame = 0

      const animatePreview =
        () => {
          animationFrame =
            requestAnimationFrame(
              animatePreview
            )

          const time =
            performance.now() *
            0.001

          character.group.position.y =
            -0.2 +
            Math.sin(
              time * 2
            ) * 0.05

          character.group.rotation.y =
            Math.PI +
            Math.sin(
              time * 0.8
            ) * 0.15

          renderer.render(
            scene,
            camera
          )
        }

      animatePreview()

      const startButton =
        overlay
          .querySelector<HTMLButtonElement>(
            '.start-adventure'
          )!

      startButton.addEventListener(
        'click',
        () => {
          localStorage.setItem(
            'digitalKingdomGrade',
            String(
              selectedGrade
            )
          )

          overlay.classList.add(
            'grade-select-leaving'
          )

          window.setTimeout(
            () => {
              cancelAnimationFrame(
                animationFrame
              )

              renderer.dispose()

              overlay.remove()

              resolve({
                grade:
                  selectedGrade,
              })
            },
            450
          )
        }
      )
    }
  )
}