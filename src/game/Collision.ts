import * as THREE from 'three'

export interface CircleCollider {
  type: 'circle'
  x: number
  z: number
  radius: number
  height: number
}

export interface BoxCollider {
  type: 'box'
  x: number
  z: number
  halfWidth: number
  halfDepth: number
  height: number
}

export type WorldCollider =
  | CircleCollider
  | BoxCollider

export class CollisionSystem {
  private readonly colliders:
    WorldCollider[]

  private readonly playerRadius =
    0.38

  constructor(
    colliders: WorldCollider[]
  ) {
    this.colliders = colliders
  }

  public canMoveTo(
    position: THREE.Vector3,
    playerY: number
  ) {
    for (
      const collider
      of this.colliders
    ) {
      // If the player is high enough,
      // allow jumping over the obstacle.
      if (
        playerY >
        collider.height
      ) {
        continue
      }

      if (
        collider.type ===
        'circle'
      ) {
        if (
          this.hitsCircle(
            position,
            collider
          )
        ) {
          return false
        }
      }

      if (
        collider.type ===
        'box'
      ) {
        if (
          this.hitsBox(
            position,
            collider
          )
        ) {
          return false
        }
      }
    }

    return true
  }

  private hitsCircle(
    position: THREE.Vector3,
    collider: CircleCollider
  ) {
    const dx =
      position.x -
      collider.x

    const dz =
      position.z -
      collider.z

    const minDistance =
      this.playerRadius +
      collider.radius

    return (
      dx * dx +
      dz * dz
    ) <
      minDistance *
      minDistance
  }

  private hitsBox(
    position: THREE.Vector3,
    collider: BoxCollider
  ) {
    const closestX =
      THREE.MathUtils.clamp(
        position.x,
        collider.x -
          collider.halfWidth,
        collider.x +
          collider.halfWidth
      )

    const closestZ =
      THREE.MathUtils.clamp(
        position.z,
        collider.z -
          collider.halfDepth,
        collider.z +
          collider.halfDepth
      )

    const dx =
      position.x -
      closestX

    const dz =
      position.z -
      closestZ

    return (
      dx * dx +
      dz * dz
    ) <
      this.playerRadius *
      this.playerRadius
  }
}