import * as THREE from 'three'

export class GameCamera {
  public readonly camera:
    THREE.PerspectiveCamera

  public yaw = 0

  private pitch = 0.42
  private distance = 11

  private dragging = false

  private previousMouseX = 0
  private previousMouseY = 0

  constructor(
    private readonly domElement:
      HTMLElement
  ) {
    this.camera =
      new THREE.PerspectiveCamera(
        55,
        window.innerWidth /
          window.innerHeight,
        0.1,
        200
      )

    this.domElement
      .addEventListener(
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

    this.domElement
      .addEventListener(
        'contextmenu',
        this.onContextMenu
      )
  }

  private onMouseDown = (
    event: MouseEvent
  ) => {
    this.dragging = true

    this.previousMouseX =
      event.clientX

    this.previousMouseY =
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
      this.previousMouseX

    const deltaY =
      event.clientY -
      this.previousMouseY

    this.previousMouseX =
      event.clientX

    this.previousMouseY =
      event.clientY

    this.yaw -=
      deltaX * 0.006

    this.pitch +=
      deltaY * 0.004

    this.pitch =
      THREE.MathUtils.clamp(
        this.pitch,
        0.15,
        0.85
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

    this.dragging = false
  }

  public resize() {
    this.camera.aspect =
      window.innerWidth /
      window.innerHeight

    this.camera
      .updateProjectionMatrix()
  }
}