import * as THREE from 'three'

/** რამდენად სწრაფად ეწყობა კამერა გმირის უკან (მეტი = სწრაფად) */
const AUTO_FOLLOW_SPEED = 1.6

/** მაუსით ხელით გასწორების შემდეგ რამდენ ხანს არ ერევა ავტომატური თვალყური (მილიწამი) */
const MANUAL_HOLD_MS = 1800

/** რამდენად სწრაფად მისდევს კამერის ცენტრი გმირს (მეტი = მჭიდროდ) */
const TARGET_SMOOTHING = 10

/** თუ გმირი კამერისკენ მოდის (კუთხე ამაზე დიდია), კამერა არ ტრიალდება — ასე არ "ხტება" */
const MAX_FOLLOW_ANGLE = 2.2

export class GameCamera {
  public readonly camera:
    THREE.PerspectiveCamera

  public yaw = 0
  public pitch = 0.42
  public distance = 11

  private readonly domElement:
    HTMLElement

  private dragging = false

  /** გლუვად მოძრავი წერტილი, რომელსაც კამერა უყურებს */
  private readonly focus =
    new THREE.Vector3()

  private hasFocus = false

  /** ამ დრომდე (performance.now) ხელით გასწორებულია — ავტომატური თვალყური ელოდება */
  private manualUntil = 0

  private lastMouseX = 0
  private lastMouseY = 0

  constructor(
    domElement: HTMLElement
  ) {
    this.domElement =
      domElement

    this.camera =
      new THREE.PerspectiveCamera(
        55,
        window.innerWidth /
          window.innerHeight,
        0.1,
        200
      )

    this.domElement.addEventListener(
      'mousedown',
      this.onMouseDown
    )

    window.addEventListener(
      'mouseup',
      this.onMouseUp
    )

    window.addEventListener(
      'mousemove',
      this.onMouseMove
    )

    this.domElement.addEventListener(
      'contextmenu',
      this.onContextMenu
    )
  }

  private onMouseDown = (
    event: MouseEvent
  ) => {
    this.dragging = true
    this.manualUntil = performance.now() + MANUAL_HOLD_MS

    this.lastMouseX =
      event.clientX

    this.lastMouseY =
      event.clientY
  }

  private onMouseUp = () => {
    this.dragging = false
  }

  private onMouseMove = (
    event: MouseEvent
  ) => {
    if (!this.dragging) {
      return
    }

    const deltaX =
      event.clientX -
      this.lastMouseX

    const deltaY =
      event.clientY -
      this.lastMouseY

    this.lastMouseX =
      event.clientX

    this.lastMouseY =
      event.clientY

    this.manualUntil = performance.now() + MANUAL_HOLD_MS

    this.yaw -=
      deltaX * 0.005

    this.pitch +=
      deltaY * 0.004

    this.pitch =
      THREE.MathUtils.clamp(
        this.pitch,
        0.15,
        1.05
      )
  }

  private onContextMenu = (
    event: MouseEvent
  ) => {
    event.preventDefault()
  }

  public update(
    target: THREE.Object3D,
    delta: number
  ) {
    // გლუვი სამიზნე (კადრების სიხშირისგან დამოუკიდებელი), რომ კამერა არ კანკალებდეს
    const smoothing =
      1 - Math.exp(-TARGET_SMOOTHING * delta)

    if (!this.hasFocus) {
      this.focus.copy(target.position)
      this.hasFocus = true
    } else {
      this.focus.lerp(
        target.position,
        smoothing
      )
    }

    const horizontal =
      Math.cos(this.pitch) *
      this.distance

    const vertical =
      Math.sin(this.pitch) *
      this.distance

    this.camera.position.set(
      this.focus.x +
        Math.sin(this.yaw) *
          horizontal,

      this.focus.y +
        vertical,

      this.focus.z +
        Math.cos(this.yaw) *
          horizontal
    )

    this.camera.lookAt(
      this.focus.x,
      this.focus.y + 1.6,
      this.focus.z
    )
  }

  /**
   * ავტომატური თვალყური: კამერა ნელა ეწყობა გმირის უკან (targetYaw = გმირის მიმართულება),
   * რომ მაუსით გასწორება ნაკლებად დასჭირდეს. მაუსით ატრიალებისას და მის შემდეგ მცირე ხანს არ მუშაობს.
   */
  public follow(
    targetYaw: number,
    delta: number
  ) {
    if (
      this.dragging ||
      performance.now() < this.manualUntil
    ) {
      return
    }

    const difference = Math.atan2(
      Math.sin(targetYaw - this.yaw),
      Math.cos(targetYaw - this.yaw)
    )

    if (
      Math.abs(difference) < 0.02 ||
      Math.abs(difference) > MAX_FOLLOW_ANGLE
    ) {
      return
    }

    // გლუვი, კადრების სიხშირისგან დამოუკიდებელი მობრუნება
    this.yaw +=
      difference *
      (1 - Math.exp(-AUTO_FOLLOW_SPEED * delta))
  }

  public reset() {
    this.manualUntil = 0
    this.hasFocus = false
    this.yaw = 0
    this.pitch = 0.42
    this.distance = 11
  }

  public resize() {
    this.camera.aspect =
      window.innerWidth /
      window.innerHeight

    this.camera
      .updateProjectionMatrix()
  }

  public destroy() {
    this.domElement
      .removeEventListener(
        'mousedown',
        this.onMouseDown
      )

    window.removeEventListener(
      'mouseup',
      this.onMouseUp
    )

    window.removeEventListener(
      'mousemove',
      this.onMouseMove
    )

    this.domElement
      .removeEventListener(
        'contextmenu',
        this.onContextMenu
      )
  }
}