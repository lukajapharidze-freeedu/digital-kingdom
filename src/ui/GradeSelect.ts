import * as THREE from 'three'

// პიქსელური ფონტი თამაშის სათაურისთვის (თამაშთან ერთად იტვირთება, ინტერნეტი არ სჭირდება)
import '@fontsource/press-start-2p/latin-400.css'

import {
  createCharacter,
} from '../characters/Character'

import { SCHOOL_LOGO_URL } from '../assets/schoolLogo'

import {
  unlockTeacherCodes,
  type TeacherCodes,
} from '../content/teacher'

export type Grade =
  | 2
  | 3
  | 4

export interface GradeSelectResult {
  grade: Grade
  /** მასწავლებლის რეჟიმში — გაშიფრული კოდები, მოსწავლისთვის null */
  teacherCodes: TeacherCodes | null
}

// მასწავლებელი თამაშს მე-4 კლასის სამეფოში იწყებს (იქ ყველა შენობა და სამჭედლოა)
const TEACHER_GRADE: Grade = 4

export function showGradeSelect():
  Promise<GradeSelectResult> {
  return new Promise(
    (resolve) => {
      let selectedGrade:
        Grade = 2

      let teacherSelected = false

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
            <img
              class="school-logo"
              src="${SCHOOL_LOGO_URL}"
              alt="თბილისის თავისუფალი სკოლა"
              draggable="false"
            />

            <div class="game-title">
              DIGITAL KINGDOM
            </div>
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

            <button
              class="grade-card grade-card-teacher"
              data-grade="teacher"
              type="button"
            >
              <span class="grade-number grade-teacher-icon">
                <svg viewBox="0 0 64 64" aria-hidden="true">
                  <path d="M32 10 L60 23 L32 36 L4 23 Z" fill="#234b64"/>
                  <path d="M16 29 V42 C16 48 48 48 48 42 V29 L32 36.5 Z" fill="#2f6488"/>
                  <path d="M54 25.5 V40" stroke="#f2b53a" stroke-width="3" stroke-linecap="round"/>
                  <circle cx="54" cy="43" r="4" fill="#f2b53a"/>
                </svg>
              </span>

              <span class="grade-label">
                მასწავლებელი
              </span>

              <span class="grade-check">
                ✓
              </span>
            </button>

          </div>

          <form
            class="teacher-login"
            hidden
          >
            <label
              class="teacher-login-label"
              for="teacher-password"
            >
              🔒 მასწავლებლის პაროლი
            </label>

            <input
              id="teacher-password"
              class="teacher-login-input"
              type="password"
              autocomplete="off"
            />

            <p class="teacher-login-error"></p>
          </form>

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

      const teacherForm =
        overlay
          .querySelector<HTMLFormElement>(
            '.teacher-login'
          )!

      const teacherInput =
        overlay
          .querySelector<HTMLInputElement>(
            '.teacher-login-input'
          )!

      const teacherError =
        overlay
          .querySelector<HTMLParagraphElement>(
            '.teacher-login-error'
          )!

      // პაროლის აკრეფისას თამაშის კლავიშები (WASD, E, T) არ უნდა ამუშავდეს
      teacherInput.addEventListener(
        'keydown',
        (event) => event.stopPropagation()
      )

      teacherInput.addEventListener(
        'keyup',
        (event) => event.stopPropagation()
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
              teacherSelected =
                card.dataset.grade ===
                'teacher'

              if (!teacherSelected) {
                selectedGrade =
                  Number(
                    card.dataset.grade
                  ) as Grade
              }

              teacherForm.hidden =
                !teacherSelected

              teacherError.textContent = ''

              if (teacherSelected) {
                teacherInput.focus()
              }

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

      const start =
        () => {
          let teacherCodes:
            TeacherCodes | null = null

          if (teacherSelected) {
            teacherCodes =
              unlockTeacherCodes(
                teacherInput.value
              )

            if (!teacherCodes) {
              teacherError.textContent =
                '❌ პაროლი არასწორია'

              teacherInput.select()
              return
            }
          } else {
            localStorage.setItem(
              'digitalKingdomGrade',
              String(
                selectedGrade
              )
            )
          }

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
                  teacherCodes
                    ? TEACHER_GRADE
                    : selectedGrade,
                teacherCodes,
              })
            },
            450
          )
        }

      startButton.addEventListener(
        'click',
        start
      )

      // პაროლის ველში Enter = დაწყება
      teacherForm.addEventListener(
        'submit',
        (event) => {
          event.preventDefault()
          start()
        }
      )
    }
  )
}