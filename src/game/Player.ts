
import * as THREE from 'three'
import {
  createCharacter,
  type GameCharacter,
} from '../characters/Character'
import { CollisionSystem } from './Collision'

export class Player {
  public readonly character: GameCharacter
  public readonly group: THREE.Group

  private collisionSystem: CollisionSystem
  private readonly keys: Record<string, boolean> = {}

  private walkTime = 0
  private verticalVelocity = 0
  private isGrounded = true

  private readonly gravity = 18
  private readonly jumpForce = 7.2
  private readonly groundY = 0

  private worldRadius = 12.5
  private spawnX = 0
  private spawnZ = 7

  constructor(collisionSystem: CollisionSystem) {
    this.collisionSystem = collisionSystem
    this.character = createCharacter()
    this.group = this.character.group

    this.group.position.set(0, this.groundY, 7)

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.clearKeys)
  }

  private onKeyDown = (event: KeyboardEvent) => {
    this.keys[event.code] = true

    if (
      event.code === 'Space' &&
      this.isGrounded &&
      !event.repeat
    ) {
      this.verticalVelocity = this.jumpForce
      this.isGrounded = false
    }
  }

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys[event.code] = false
  }

  private clearKeys = () => {
    for (const key in this.keys) {
      this.keys[key] = false
    }
  }

  public enterWorld(
    collisionSystem: CollisionSystem,
    x: number,
    z: number,
    radius: number,
  ) {
    this.collisionSystem = collisionSystem
    this.spawnX = x
    this.spawnZ = z
    this.worldRadius = radius
    this.reset()
  }

  public update(delta: number, cameraYaw: number) {
    const speed = 5.2
    let inputX = 0
    let inputZ = 0

    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputZ--
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputZ++
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX--
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX++

    const moving = inputX !== 0 || inputZ !== 0

    if (moving) {
      const input = new THREE.Vector3(
        inputX, 0, inputZ
      ).normalize()

      const forward = new THREE.Vector3(
        -Math.sin(cameraYaw), 0, -Math.cos(cameraYaw)
      )

      const right = new THREE.Vector3(
        Math.cos(cameraYaw), 0, -Math.sin(cameraYaw)
      )

      const movement = new THREE.Vector3()
      movement.addScaledVector(forward, -input.z)
      movement.addScaledVector(right, input.x)
      movement.normalize()

      this.moveWithCollision(movement, speed * delta)

      const targetRotation =
        Math.atan2(movement.x, movement.z) + Math.PI

      const difference = Math.atan2(
        Math.sin(targetRotation - this.group.rotation.y),
        Math.cos(targetRotation - this.group.rotation.y)
      )

      this.group.rotation.y +=
        difference * Math.min(1, delta * 12)

      if (this.isGrounded) {
        this.walkTime += delta * 10

        const legSwing = Math.sin(this.walkTime) * 0.55
        const armSwing = Math.sin(this.walkTime) * 0.45

        this.character.leftLeg.rotation.x = legSwing
        this.character.rightLeg.rotation.x = -legSwing
        this.character.leftArm.rotation.x = -armSwing
        this.character.rightArm.rotation.x = armSwing
      }
    } else if (this.isGrounded) {
      this.character.leftLeg.rotation.x *= 0.78
      this.character.rightLeg.rotation.x *= 0.78
      this.character.leftArm.rotation.x *= 0.78
      this.character.rightArm.rotation.x *= 0.78
    }

    if (!this.isGrounded) {
      this.verticalVelocity -= this.gravity * delta
      this.group.position.y += this.verticalVelocity * delta

      this.character.leftLeg.rotation.x = -0.25
      this.character.rightLeg.rotation.x = 0.25
      this.character.leftArm.rotation.x = -0.35
      this.character.rightArm.rotation.x = -0.35

      if (this.group.position.y <= this.groundY) {
        this.group.position.y = this.groundY
        this.verticalVelocity = 0
        this.isGrounded = true
      }
    }

    this.keepInsideWorld()
  }

  private moveWithCollision(
    direction: THREE.Vector3,
    distance: number
  ) {
    const current = this.group.position

    const nextX = current.clone()
    nextX.x += direction.x * distance

    if (this.collisionSystem.canMoveTo(nextX, current.y)) {
      current.x = nextX.x
    }

    const nextZ = current.clone()
    nextZ.z += direction.z * distance

    if (this.collisionSystem.canMoveTo(nextZ, current.y)) {
      current.z = nextZ.z
    }
  }

  private keepInsideWorld() {
    const x = this.group.position.x
    const z = this.group.position.z
    const distance = Math.hypot(x, z)

    if (distance <= this.worldRadius) return

    const angle = Math.atan2(z, x)
    this.group.position.x =
      Math.cos(angle) * this.worldRadius
    this.group.position.z =
      Math.sin(angle) * this.worldRadius
  }

  public reset() {
    this.group.position.set(
      this.spawnX,
      this.groundY,
      this.spawnZ
    )

    this.group.rotation.set(0, 0, 0)
    this.verticalVelocity = 0
    this.isGrounded = true
    this.walkTime = 0

    this.character.leftArm.rotation.x = 0
    this.character.rightArm.rotation.x = 0
    this.character.leftLeg.rotation.x = 0
    this.character.rightLeg.rotation.x = 0

    this.clearKeys()
  }

  public destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.clearKeys)
  }
}
