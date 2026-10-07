import * as THREE from 'three'

export class GameCamera {
  public readonly camera:
    THREE.PerspectiveCamera

  public yaw = 0
  public pitch = 0.42
  public distance = 11

  private readonly domElement:
    HTMLElement

  private dragging = false

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
    target: THREE.Object3D
  ) {
    const horizontal =
      Math.cos(this.pitch) *
      this.distance

    const vertical =
      Math.sin(this.pitch) *
      this.distance

    const desired =
      new THREE.Vector3(
        target.position.x +
          Math.sin(this.yaw) *
            horizontal,

        target.position.y +
          vertical,

        target.position.z +
          Math.cos(this.yaw) *
            horizontal
      )

    this.camera.position.lerp(
      desired,
      0.1
    )

    this.camera.lookAt(
      target.position.x,
      target.position.y + 1.6,
      target.position.z
    )
  }

  public reset() {
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