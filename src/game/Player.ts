import * as THREE from 'three'

import {
  createCharacter,
  type CharacterGender,
  type GameCharacter,
} from '../characters/Character'

import {
  CollisionSystem,
} from './Collision'

export class Player {
  public readonly character:
    GameCharacter

  public readonly group:
    THREE.Group

  private readonly keys:
    Record<string, boolean> = {}

  private walkTime = 0

  private verticalVelocity = 0
  private isGrounded = true

  private readonly gravity = 18
  private readonly jumpForce = 7.2
  private readonly groundY = 0

  constructor(
    gender: CharacterGender,
    private readonly collisionSystem:
      CollisionSystem
  ) {
    this.character =
      createCharacter(gender)

    this.group =
      this.character.group

    this.group.position.set(
      0,
      this.groundY,
      7
    )

    window.addEventListener(
      'keydown',
      this.onKeyDown
    )

    window.addEventListener(
      'keyup',
      this.onKeyUp
    )
  }

  private onKeyDown = (
    event: KeyboardEvent
  ) => {
    this.keys[event.code] = true

    if (
      event.code === 'Space' &&
      this.isGrounded &&
      !event.repeat
    ) {
      this.jump()
    }
  }

  private onKeyUp = (
    event: KeyboardEvent
  ) => {
    this.keys[event.code] = false
  }

  private jump() {
    this.verticalVelocity =
      this.jumpForce

    this.isGrounded = false
  }

  public update(
    delta: number,
    cameraYaw: number
  ) {
    const speed = 5.2

    let inputX = 0
    let inputZ = 0

    if (
      this.keys['KeyW'] ||
      this.keys['ArrowUp']
    ) {
      inputZ -= 1
    }

    if (
      this.keys['KeyS'] ||
      this.keys['ArrowDown']
    ) {
      inputZ += 1
    }

    if (
      this.keys['KeyA'] ||
      this.keys['ArrowLeft']
    ) {
      inputX -= 1
    }

    if (
      this.keys['KeyD'] ||
      this.keys['ArrowRight']
    ) {
      inputX += 1
    }

    const moving =
      inputX !== 0 ||
      inputZ !== 0

    if (moving) {
      const input =
        new THREE.Vector3(
          inputX,
          0,
          inputZ
        ).normalize()

      const forward =
        new THREE.Vector3(
          -Math.sin(cameraYaw),
          0,
          -Math.cos(cameraYaw)
        )

      const right =
        new THREE.Vector3(
          Math.cos(cameraYaw),
          0,
          -Math.sin(cameraYaw)
        )

      const movement =
        new THREE.Vector3()

      movement.addScaledVector(
        forward,
        -input.z
      )

      movement.addScaledVector(
        right,
        input.x
      )

      movement.normalize()

      this.moveWithCollision(
        movement,
        speed * delta
      )

      const targetRotation =
        Math.atan2(
          movement.x,
          movement.z
        ) + Math.PI

      let difference =
        targetRotation -
        this.group.rotation.y

      difference =
        Math.atan2(
          Math.sin(difference),
          Math.cos(difference)
        )

      this.group.rotation.y +=
        difference *
        Math.min(
          1,
          delta * 12
        )

      if (this.isGrounded) {
        this.walkTime +=
          delta * 10

        const legSwing =
          Math.sin(
            this.walkTime
          ) * 0.55

        const armSwing =
          Math.sin(
            this.walkTime
          ) * 0.45

        this.character
          .leftLeg.rotation.x =
          legSwing

        this.character
          .rightLeg.rotation.x =
          -legSwing

        this.character
          .leftArm.rotation.x =
          -armSwing

        this.character
          .rightArm.rotation.x =
          armSwing
      }
    } else if (
      this.isGrounded
    ) {
      this.character
        .leftLeg.rotation.x *=
        0.78

      this.character
        .rightLeg.rotation.x *=
        0.78

      this.character
        .leftArm.rotation.x *=
        0.78

      this.character
        .rightArm.rotation.x *=
        0.78
    }

    // ========================================================
    // JUMP + GRAVITY
    // ========================================================

    if (!this.isGrounded) {
      this.verticalVelocity -=
        this.gravity * delta

      this.group.position.y +=
        this.verticalVelocity *
        delta

      this.character
        .leftLeg.rotation.x =
        -0.25

      this.character
        .rightLeg.rotation.x =
        0.25

      this.character
        .leftArm.rotation.x =
        -0.35

      this.character
        .rightArm.rotation.x =
        -0.35

      if (
        this.group.position.y <=
        this.groundY
      ) {
        this.group.position.y =
          this.groundY

        this.verticalVelocity = 0
        this.isGrounded = true
      }
    }

    this.keepOnIsland()
  }

  private moveWithCollision(
    direction: THREE.Vector3,
    distance: number
  ) {
    const current =
      this.group.position

    // First try X movement.
    const nextX =
      current.clone()

    nextX.x +=
      direction.x *
      distance

    if (
      this.collisionSystem
        .canMoveTo(
          nextX,
          current.y
        )
    ) {
      current.x =
        nextX.x
    }

    // Then try Z separately.
    //
    // Doing X and Z separately
    // lets the player slide along
    // walls and trees instead of
    // getting completely stuck.
    const nextZ =
      current.clone()

    nextZ.z +=
      direction.z *
      distance

    if (
      this.collisionSystem
        .canMoveTo(
          nextZ,
          current.y
        )
    ) {
      current.z =
        nextZ.z
    }
  }

  private keepOnIsland() {
    const maxRadius = 12.5

    const x =
      this.group.position.x

    const z =
      this.group.position.z

    const distance =
      Math.sqrt(
        x * x +
        z * z
      )

    if (
      distance <= maxRadius
    ) {
      return
    }

    const angle =
      Math.atan2(
        z,
        x
      )

    this.group.position.x =
      Math.cos(angle) *
      maxRadius

    this.group.position.z =
      Math.sin(angle) *
      maxRadius
  }

  public reset() {
    this.group.position.set(
      0,
      this.groundY,
      7
    )

    this.group.rotation.set(
      0,
      0,
      0
    )

    this.verticalVelocity = 0
    this.isGrounded = true
    this.walkTime = 0

    for (
      const key
      in this.keys
    ) {
      this.keys[key] = false
    }
  }

  public destroy() {
    window.removeEventListener(
      'keydown',
      this.onKeyDown
    )

    window.removeEventListener(
      'keyup',
      this.onKeyUp
    )
  }
}