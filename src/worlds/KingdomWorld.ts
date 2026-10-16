import * as THREE from 'three'
import type { WorldCollider } from '../game/Collision'
import { decorateKingdom } from './KingdomDecorations'
import { KingdomAnimals } from './KingdomAnimals'

export type KingdomBuildingId =
  | 'knowledge' | 'academy' | 'library'
  | 'market' | 'forge' | 'treasury'

export interface KingdomBuilding {
  id: KingdomBuildingId
  name: string
  position: THREE.Vector3
  interactionRadius: number
}

export interface KingdomWorldData {
  group: THREE.Group
  colliders: WorldCollider[]
  buildings: KingdomBuilding[]
  spawn: THREE.Vector3
  radius: number
  animals: KingdomAnimals
}

const material = (color: number, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness, flatShading: true })

const stone = material(0xe8dcc0)
const trim = material(0xb9a783)
const blue = material(0x347ec4)
const darkBlue = material(0x24507e)
const gold = material(0xf3bb46, 0.15)
const grass = material(0x78c75c)
const soil = material(0x936342)
const pathMat = material(0xdcc8a1)
const wood = material(0x855333)
const leaves = material(0x4ba853)

function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry,
  mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const object = new THREE.Mesh(geometry, mat)
  object.position.set(x, y, z)
  object.castShadow = true
  object.receiveShadow = true
  parent.add(object)
  return object
}

function box(parent: THREE.Object3D, w: number, h: number, d: number,
  mat: THREE.Material, x = 0, y = h / 2, z = 0) {
  return mesh(parent, new THREE.BoxGeometry(w, h, d), mat, x, y, z)
}

function tower(parent: THREE.Object3D, x: number, z: number,
  height: number, radius = 1.4, roof = blue) {
  mesh(parent, new THREE.CylinderGeometry(radius * 0.88, radius, height, 8),
    stone, x, height / 2, z)
  mesh(parent, new THREE.ConeGeometry(radius * 1.35, 2.6, 8),
    roof, x, height + 1.3, z)
  mesh(parent, new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6),
    gold, x, height + 3.1, z)
  box(parent, 0.9, 0.45, 0.08, gold, x + 0.45, height + 3.4, z)
}

function building(parent: THREE.Object3D, x: number, z: number,
  width: number, depth: number, height: number, roof: THREE.Material) {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  parent.add(g)
  box(g, width, height, depth, stone)
  const top = mesh(g, new THREE.ConeGeometry(Math.max(width, depth) * 0.78,
    2.6, 4), roof, 0, height + 1.3, 0)
  top.rotation.y = Math.PI / 4
  box(g, 1.3, 2.2, 0.12, wood, 0, 1.1, depth / 2 + 0.08)
  box(g, 0.65, 0.85, 0.1, darkBlue, -width * 0.28, height * 0.6, depth / 2 + 0.09)
  box(g, 0.65, 0.85, 0.1, darkBlue, width * 0.28, height * 0.6, depth / 2 + 0.09)
  return g
}

function tree(parent: THREE.Object3D, x: number, z: number, scale = 1) {
  mesh(parent, new THREE.CylinderGeometry(0.25 * scale, 0.35 * scale,
    1.7 * scale, 6), wood, x, 0.85 * scale, z)
  mesh(parent, new THREE.IcosahedronGeometry(1.1 * scale, 0),
    leaves, x, 2.2 * scale, z)
  mesh(parent, new THREE.IcosahedronGeometry(0.85 * scale, 0),
    grass, x + 0.4 * scale, 2.65 * scale, z)
}

function pavedPath(parent: THREE.Object3D, x: number, z: number,
  w: number, d: number) {
  box(parent, w, 0.08, d, pathMat, x, 0.035, z)
}

export function createKingdomWorld(): KingdomWorldData {
  const group = new THREE.Group()
  group.visible = false
  const colliders: WorldCollider[] = []
  const buildings: KingdomBuilding[] = []
  const radius = 43

  // Floating island, with a broad playable surface.
  mesh(group, new THREE.CylinderGeometry(45, 41, 3, 16),
    grass, 0, -1.5, 0)
  mesh(group, new THREE.CylinderGeometry(41, 29, 9, 16),
    soil, 0, -7.5, 0)
  mesh(group, new THREE.ConeGeometry(29, 17, 16),
    soil, 0, -20.5, 0)

  // Plaza and paths; entry is at the south end (positive Z).
  mesh(group, new THREE.CylinderGeometry(11, 11, 0.12, 24),
    pathMat, 0, 0.055, 0)
  pavedPath(group, 0, 22, 5, 34)
  pavedPath(group, 0, -20, 5, 30)
  pavedPath(group, -18, 0, 24, 4)
  pavedPath(group, 18, 0, 24, 4)
  pavedPath(group, -19, -14, 4, 24)
  pavedPath(group, 19, -14, 4, 24)
  pavedPath(group, -19, 15, 4, 24)
  pavedPath(group, 19, 15, 4, 24)

  // Fountain with luminous blue crystal.
  const water = new THREE.MeshStandardMaterial({
    color: 0x3bc7f5, emissive: 0x137da8,
    emissiveIntensity: 0.35, roughness: 0.22, metalness: 0.12,
  })
  mesh(group, new THREE.CylinderGeometry(4.1, 4.3, 0.75, 20),
    trim, 0, 0.42, 0)
  mesh(group, new THREE.CylinderGeometry(3.55, 3.55, 0.08, 20),
    water, 0, 0.84, 0)
  mesh(group, new THREE.CylinderGeometry(1, 1.25, 1.35, 12),
    stone, 0, 1.5, 0)
  const crystal = mesh(group, new THREE.OctahedronGeometry(1.15, 0),
    water, 0, 3.2, 0)
  crystal.rotation.y = Math.PI / 4
  colliders.push({ type: 'circle', x: 0, z: 0, radius: 4.2, height: 3.5 })

  function register(id: KingdomBuildingId, name: string,
    x: number, z: number, width: number, depth: number, height: number) {
    buildings.push({
      id, name,
      position: new THREE.Vector3(x, 0, z + depth / 2 + 2.3),
      interactionRadius: 2.8,
    })
    colliders.push({
      type: 'box', x, z,
      halfWidth: width / 2, halfDepth: depth / 2,
      height: height + 4,
    })
  }

  // Castle at the far end of the courtyard.
  building(group, 0, -32, 13, 7, 8, blue)
  tower(group, -8, -32, 11, 2.1)
  tower(group, 8, -32, 11, 2.1)
  tower(group, 0, -34, 13, 2.3)
  colliders.push({ type: 'box', x: 0, z: -32,
    halfWidth: 6.5, halfDepth: 3.5, height: 13 })
  colliders.push({ type: 'circle', x: -8, z: -32, radius: 2.1, height: 14 })
  colliders.push({ type: 'circle', x: 8, z: -32, radius: 2.1, height: 14 })

  // Knowledge Tower — tall glowing tower.
  tower(group, -29, -17, 11, 2.8)
  mesh(group, new THREE.OctahedronGeometry(1.1, 0),
    water, -29, 16, -17)
  register('knowledge', 'ცოდნის კოშკი', -29, -17, 5.6, 5.6, 11)

  // Academy — twin-tower school.
  building(group, -21, -21, 8, 7, 5.5, blue)
  tower(group, -25, -23, 7, 1.3)
  tower(group, -17, -23, 7, 1.3)
  register('academy', 'აკადემია', -21, -21, 8, 7, 7)

  // Library — warm red roof and oversized book sign.
  const red = material(0xc95743)
  building(group, 23, -19, 9, 7, 5.2, red)
  box(group, 2.2, 0.28, 1.4, gold, 23, 7.9, -19)
  register('library', 'ბიბლიოთეკა', 23, -19, 9, 7, 5.2)

  // Market — open stalls with colorful canopies.
  const market = new THREE.Group()
  market.position.set(-23, 0, 19)
  group.add(market)
  for (let i = 0; i < 4; i++) {
    const x = (i % 2) * 6 - 3
    const z = Math.floor(i / 2) * 6 - 3
    box(market, 3.7, 0.9, 2.8, wood, x, 0.55, z)
    box(market, 4.3, 0.35, 3.4, i % 2 ? blue : red,
      x, 3.2, z)
    for (const dx of [-1.7, 1.7]) {
      for (const dz of [-1.2, 1.2]) {
        box(market, 0.12, 2.7, 0.12, wood,
          x + dx, 1.8, z + dz)
      }
    }
  }
  buildings.push({ id: 'market', name: 'მაღაზია',
    position: new THREE.Vector3(-23, 0, 25), interactionRadius: 3 })
  for (const x of [-26, -20]) {
    for (const z of [-3, 3]) {
      colliders.push({ type: 'box', x, z: 19 + z,
        halfWidth: 1.9, halfDepth: 1.5, height: 3.5 })
    }
  }

  // Forge — chimney and glowing furnace.
  building(group, 24, 19, 9, 7, 4.8, darkBlue)
  box(group, 1.7, 6.5, 1.7, trim, 27, 6, 17)
  const fire = new THREE.MeshStandardMaterial({
    color: 0xff7d22, emissive: 0xff4d00, emissiveIntensity: 1.5,
  })
  box(group, 1.5, 1.1, 0.18, fire, 24, 1.3, 22.62)
  register('forge', 'სამჭედლო', 24, 19, 9, 7, 6)

  // Treasury — fortified vault with golden ornament.
  building(group, 30, -2, 7, 7, 5.7, gold)
  mesh(group, new THREE.OctahedronGeometry(1.1, 0),
    gold, 30, 8.6, -2)
  register('treasury', 'საგანძურის საცავი', 30, -2, 7, 7, 5.7)

  // Entrance gate; an opening in the front of the courtyard.
  tower(group, -5.5, 37, 5, 1.6)
  tower(group, 5.5, 37, 5, 1.6)
  box(group, 8, 1.4, 1.2, stone, 0, 6.3, 37)
  colliders.push({ type: 'circle', x: -5.5, z: 37, radius: 1.6, height: 8 })
  colliders.push({ type: 'circle', x: 5.5, z: 37, radius: 1.6, height: 8 })

  // Trees along the perimeter, away from main roads.
  for (let i = 0; i < 28; i++) {
    const angle = (i / 28) * Math.PI * 2
    const r = 36 + (i % 3) * 1.4
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    if (Math.abs(x) < 10 && (z > 28 || z < -28)) continue
    if (x < -26 && z > 9 && z < 28) continue
    if (x > 22 && z > 9 && z < 28) continue
    tree(group, x, z, 0.75 + (i % 4) * 0.13)
    colliders.push({ type: 'circle', x, z, radius: 0.4, height: 2 })
  }

  decorateKingdom(group)

  const animals = new KingdomAnimals(colliders, radius)
  group.add(animals.group)

  return {
    group, colliders, buildings, animals,
    spawn: new THREE.Vector3(0, 0, 33),
    radius,
  }
}
