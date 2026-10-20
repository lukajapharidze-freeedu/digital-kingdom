import * as THREE from 'three'

import type { WorldCollider } from './Collision'
import { buildGrid, findPath, type PathGrid, type Point2 } from './pathfinding'

const ARROW_SPACING = 2
const MAX_ARROWS = 40
const ARROW_HEIGHT = 0.16

/**
 * მიმთითებელი მწვანე გზა: მოძრავი ისრები გმირიდან სამიზნემდე და
 * სამიზნეზე მაღლა მოხტუნავე ისარი ნათების სვეტით.
 */
export class GuidePath {
  readonly group = new THREE.Group()

  private readonly arrows: THREE.Group[] = []
  private readonly beacon = new THREE.Group()
  private readonly ring: THREE.Mesh

  private grid: PathGrid | null = null
  private target: Point2 | null = null
  private path: Point2[] = []
  private cumulative: number[] = []
  private pathLength = 0
  private repathTimer = 0
  private lastStart: Point2 = { x: 0, z: 0 }
  private time = 0
  private offset = 0

  constructor() {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0.7)
    shape.lineTo(0.62, -0.05)
    shape.lineTo(0.24, -0.05)
    shape.lineTo(0.24, -0.7)
    shape.lineTo(-0.24, -0.7)
    shape.lineTo(-0.24, -0.05)
    shape.lineTo(-0.62, -0.05)
    shape.closePath()
    const arrowGeometry = new THREE.ShapeGeometry(shape)

    const fill = new THREE.MeshBasicMaterial({
      color: 0x3fe06f,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      depthWrite: false,
    })
    const outline = new THREE.MeshBasicMaterial({
      color: 0x0f5a28,
      transparent: true,
      opacity: 0.85,
      depthTest: false,
      depthWrite: false,
    })

    for (let i = 0; i < MAX_ARROWS; i++) {
      const holder = new THREE.Group()
      const back = new THREE.Mesh(arrowGeometry, outline)
      back.rotation.x = -Math.PI / 2
      back.scale.set(1.28, 1.28, 1)
      back.renderOrder = 20
      const front = new THREE.Mesh(arrowGeometry, fill)
      front.rotation.x = -Math.PI / 2
      front.position.y = 0.01
      front.renderOrder = 21
      holder.add(back, front)
      holder.visible = false
      this.arrows.push(holder)
      this.group.add(holder)
    }

    // სამიზნის ნიშანი: მხოლოდ მწვანე რგოლი მიწაზე
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.35, 40),
      new THREE.MeshBasicMaterial({
        color: 0x58ff8a,
        transparent: true,
        opacity: 0.85,
        depthTest: false,
        depthWrite: false,
      }),
    )
    this.ring.rotation.x = -Math.PI / 2
    this.ring.position.y = ARROW_HEIGHT
    this.ring.renderOrder = 22

    this.beacon.add(this.ring)
    this.beacon.visible = false
    this.group.add(this.beacon)
    this.group.visible = false
  }

  /** რომელ სამყაროში ვართ: მისი დაბრკოლებები და რადიუსი */
  setWorld(colliders: WorldCollider[], radius: number) {
    this.grid = buildGrid(colliders, radius)
    this.path = []
    this.repathTimer = 0
  }

  setTarget(point: Point2 | null) {
    const changed =
      (point === null) !== (this.target === null) ||
      (point !== null && this.target !== null && (point.x !== this.target.x || point.z !== this.target.z))
    this.target = point
    if (changed) {
      this.path = []
      this.repathTimer = 0
    }
    this.beacon.visible = point !== null
    if (point) this.beacon.position.set(point.x, 0, point.z)
    if (!point) this.hideArrows()
  }

  private hideArrows() {
    for (const arrow of this.arrows) arrow.visible = false
  }

  private recompute(start: Point2) {
    this.lastStart = { x: start.x, z: start.z }
    if (!this.grid || !this.target) return

    const found = findPath(this.grid, start, this.target)
    // თუ გზა ვერ მოიძებნა, პირდაპირ ხაზი მაინც ავიღოთ
    this.path = found ?? [start, this.target]

    this.cumulative = [0]
    for (let i = 1; i < this.path.length; i++) {
      const a = this.path[i - 1]
      const b = this.path[i]
      this.cumulative.push(this.cumulative[i - 1] + Math.hypot(b.x - a.x, b.z - a.z))
    }
    this.pathLength = this.cumulative[this.cumulative.length - 1]
  }

  /** წერტილი გზაზე დაშორებით d და მიმართულება */
  private pointAt(d: number): { x: number; z: number; dx: number; dz: number } {
    let i = 1
    while (i < this.cumulative.length - 1 && this.cumulative[i] < d) i++
    const a = this.path[i - 1]
    const b = this.path[i]
    const segment = Math.max(0.0001, this.cumulative[i] - this.cumulative[i - 1])
    const t = Math.max(0, Math.min(1, (d - this.cumulative[i - 1]) / segment))
    return {
      x: a.x + (b.x - a.x) * t,
      z: a.z + (b.z - a.z) * t,
      dx: (b.x - a.x) / segment,
      dz: (b.z - a.z) / segment,
    }
  }

  update(dt: number, playerX: number, playerZ: number) {
    if (!this.target) return
    this.time += dt

    this.repathTimer -= dt
    const moved = Math.hypot(playerX - this.lastStart.x, playerZ - this.lastStart.z)
    if (this.path.length === 0 || this.repathTimer <= 0 || moved > 2.5) {
      this.repathTimer = 0.5
      this.recompute({ x: playerX, z: playerZ })
    }

    // რგოლის პულსაცია
    const pulse = 1 + 0.25 * Math.sin(this.time * 5)
    this.ring.scale.set(pulse, pulse, 1)

    // ისრები: მოძრაობენ სამიზნისკენ (კონვეიერივით)
    this.offset = (this.offset + dt * 2.6) % ARROW_SPACING
    const startAt = 1.8
    const endAt = this.pathLength - 1.6
    let used = 0

    for (let k = 0; k < MAX_ARROWS; k++) {
      const d = startAt + this.offset + k * ARROW_SPACING
      if (d > endAt) break
      const p = this.pointAt(d)
      const arrow = this.arrows[k]
      arrow.visible = true
      arrow.position.set(p.x, ARROW_HEIGHT, p.z)
      arrow.rotation.y = Math.atan2(-p.dx, -p.dz)
      const wave = 0.9 + 0.14 * Math.sin(this.time * 6 - d * 0.9)
      arrow.scale.set(wave, 1, wave)
      used++
    }
    for (let k = used; k < MAX_ARROWS; k++) this.arrows[k].visible = false
  }
}
