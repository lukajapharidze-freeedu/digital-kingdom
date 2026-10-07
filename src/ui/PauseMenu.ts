export type PauseAction =
  | 'resume'
  | 'restart'
  | 'change-character'

export class PauseMenu {
  private readonly overlay: HTMLDivElement
  private visible = false

  private actionHandler:
    ((action: PauseAction) => void) | null = null

  constructor() {
    this.overlay =
      document.createElement('div')

    this.overlay.className =
      'pause-menu'

    this.overlay.innerHTML = `
      <div class="pause-backdrop"></div>

      <div class="pause-panel">

        <div class="pause-crown">
          ♛
        </div>

        <h2>თამაში შეჩერებულია</h2>

        <p class="pause-subtitle">
          DIGITAL KINGDOM
        </p>

        <div class="pause-buttons">

          <button
            class="pause-button pause-primary"
            data-action="resume"
            type="button"
          >
            <span class="pause-button-icon">
              ▶
            </span>

            <span>
              გაგრძელება
            </span>
          </button>

          <button
            class="pause-button"
            data-action="change-character"
            type="button"
          >
            <span class="pause-button-icon">
              👤
            </span>

            <span>
              გმირის შეცვლა
            </span>
          </button>

          <button
            class="pause-button"
            data-action="restart"
            type="button"
          >
            <span class="pause-button-icon">
              ↻
            </span>

            <span>
              თავიდან დაწყება
            </span>
          </button>

        </div>

        <div class="pause-hint">
          <kbd>ESC</kbd>
          გაგრძელება
        </div>

      </div>
    `

    document.body.appendChild(
      this.overlay
    )

    const buttons =
      this.overlay
        .querySelectorAll<HTMLButtonElement>(
          '[data-action]'
        )

    buttons.forEach((button) => {
      button.addEventListener(
        'click',
        () => {
          const action =
            button.dataset
              .action as PauseAction

          this.actionHandler?.(
            action
          )
        }
      )
    })
  }

  public onAction(
    handler:
      (action: PauseAction) => void
  ) {
    this.actionHandler = handler
  }

  public show() {
    this.visible = true

    this.overlay.classList.add(
      'pause-menu-visible'
    )
  }

  public hide() {
    this.visible = false

    this.overlay.classList.remove(
      'pause-menu-visible'
    )
  }

  public isVisible() {
    return this.visible
  }

  public destroy() {
    this.overlay.remove()
  }
}