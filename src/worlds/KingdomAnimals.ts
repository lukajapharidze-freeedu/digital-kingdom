import * as THREE from 'three'
import type { WorldCollider } from '../game/Collision'

type Species = 'dog' | 'cat' | 'horse' | 'giraffe' | 'raccoon' | 'sheep'
type Animal = {
  root: THREE.Group
  legs: THREE.Group[]
  tail: THREE.Group
  phase: number
  heading: number
  speed: number
  wait: number
  turnIn: number
  radius: number
  home: THREE.Vector2
  roam: number
}

const mat = (color: number) => new THREE.MeshStandardMaterial({
  color, roughness: 0.9, flatShading: true,
})
const brown = mat(0xb8783d)
const cream = mat(0xf4d4a0)
const black = mat(0x2b2729)
const pink = mat(0xf6a1a8)
const orange = mat(0xf0a04d)
const darkBrown = mat(0x56372c)
const white = mat(0xfff4e3)

function part(parent: THREE.Object3D, geometry: THREE.BufferGeometry,
  material: THREE.Material, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function cube(parent: THREE.Object3D, w: number, h: number, d: number,
  material: THREE.Material, x: number, y: number, z: number) {
  return part(parent, new THREE.BoxGeometry(w, h, d), material, x, y, z)
}

// New low-poly animals share the same walking/obstacle logic.
function newAnimalModel(species: 'giraffe' | 'raccoon' | 'sheep') {
  const root = new THREE.Group()
  const legs: THREE.Group[] = []
  const isGiraffe = species === 'giraffe'
  const isSheep = species === 'sheep'
  const coat = isGiraffe ? mat(0xf2bf55) : isSheep ? mat(0xf8f0d8) : mat(0x888b91)
  const dark = isGiraffe ? mat(0xa46c30) : isSheep ? mat(0x5c514b) : mat(0x41454b)
  const bodyY = isGiraffe ? 2.15 : isSheep ? 0.82 : 0.63
  const bodyW = isGiraffe ? 1.25 : isSheep ? 0.95 : 0.7
  const bodyH = isGiraffe ? 1.25 : isSheep ? 0.95 : 0.58
  const bodyD = isGiraffe ? 2.1 : isSheep ? 1.45 : 1.1
  cube(root, bodyW, bodyH, bodyD, coat, 0, bodyY, 0)

  if (isGiraffe) {
    cube(root, 0.52, 3.15, 0.55, coat, 0, 3.45, -0.72)
    cube(root, 0.9, 0.75, 0.85, coat, 0, 5.15, -0.91)
    cube(root, 0.67, 0.42, 0.72, cream, 0, 4.99, -1.53)
    for (const side of [-1, 1]) {
      cube(root, 0.14, 0.48, 0.14, dark, side * 0.27, 5.75, -0.85)
      part(root, new THREE.SphereGeometry(0.15, 8, 6), dark,
        side * 0.27, 6.02, -0.85)
      cube(root, 0.24, 0.12, 0.31, dark, side * 0.5, 5.37, -0.76)
      part(root, new THREE.SphereGeometry(0.085, 8, 6), black,
        side * 0.34, 5.29, -1.34)
    }
    // Giraffe's recognizable brown spots.
    for (const [x, y, z] of [
      [-0.63, 2.32, -0.45], [-0.63, 2.02, 0.35],
      [0.63, 2.4, 0.28], [0.63, 1.98, -0.5],
      [0, 3.1, -1.02], [0, 3.9, -1.02], [0, 4.65, -1.02],
      [-0.28, 3.52, -0.72], [0.28, 4.24, -0.72],
    ]) {
      cube(root, 0.28, 0.32, 0.055, dark, x, y, z)
    }
  } else if (isSheep) {
    // Woolly body, head and small ears.
    for (const x of [-0.37, 0, 0.37]) {
      for (const z of [-0.5, 0, 0.5]) {
        part(root, new THREE.IcosahedronGeometry(0.42, 0), coat,
          x, 1.26, z)
      }
    }
    cube(root, 0.53, 0.62, 0.56, dark, 0, 1.02, -0.94)
    for (const side of [-1, 1]) {
      cube(root, 0.32, 0.16, 0.22, dark, side * 0.38, 1.23, -0.88)
      part(root, new THREE.SphereGeometry(0.07, 8, 6), black,
        side * 0.2, 1.12, -1.23)
    }
  } else {
    // Raccoon's mask, striped tail and pointed ears.
    cube(root, 0.62, 0.59, 0.57, coat, 0, 0.9, -0.75)
    for (const side of [-1, 1]) {
      cube(root, 0.26, 0.22, 0.075, dark, side * 0.19, 0.98, -1.065)
      part(root, new THREE.SphereGeometry(0.065, 8, 6), black,
        side * 0.19, 0.98, -1.12)
      part(root, new THREE.ConeGeometry(0.18, 0.33, 4), dark,
        side * 0.25, 1.33, -0.75)
    }
    cube(root, 0.18, 0.13, 0.17, black, 0, 0.75, -1.11)
  }

  const legLength = isGiraffe ? 1.57 : isSheep ? 0.52 : 0.42
  for (const x of [-bodyW * 0.33, bodyW * 0.33]) {
    for (const z of [-bodyD * 0.34, bodyD * 0.34]) {
      const pivot = new THREE.Group()
      pivot.position.set(x, bodyY - bodyH * 0.32, z)
      root.add(pivot)
      cube(pivot, isGiraffe ? 0.29 : 0.19, legLength,
        isGiraffe ? 0.32 : 0.2, isGiraffe ? coat : dark,
        0, -legLength / 2, 0)
      cube(pivot, isGiraffe ? 0.35 : 0.23, 0.14,
        isGiraffe ? 0.37 : 0.25, dark,
        0, -legLength + 0.07, -0.03)
      legs.push(pivot)
    }
  }

  const tail = new THREE.Group()
  tail.position.set(0, bodyY + 0.12, bodyD / 2)
  root.add(tail)
  if (isGiraffe) {
    cube(tail, 0.13, 0.65, 0.15, coat, 0, -0.27, 0.2)
    cube(tail, 0.2, 0.32, 0.2, dark, 0, -0.58, 0.22)
  } else if (isSheep) {
    part(tail, new THREE.IcosahedronGeometry(0.27, 0), coat, 0, 0.12, 0.1)
  } else {
    for (let i = 0; i < 5; i++) {
      cube(tail, 0.23 + i * 0.045, 0.23, 0.23,
        i % 2 === 0 ? dark : coat, 0, 0.12 + i * 0.09, 0.17 + i * 0.2)
    }
  }
  return { root, legs, tail }
}

function animalModel(species: Species) {
  const root = new THREE.Group()
  const legs: THREE.Group[] = []
  const horse = species === 'horse'
  const cat = species === 'cat'
  const coat = horse ? brown : cat ? orange : cream
  const bodyY = horse ? 1.65 : cat ? 0.52 : 0.7
  const bodyW = horse ? 1.2 : cat ? 0.56 : 0.82
  const bodyH = horse ? 1.2 : cat ? 0.55 : 0.7
  const bodyD = horse ? 2.25 : cat ? 1.0 : 1.35

  cube(root, bodyW, bodyH, bodyD, coat, 0, bodyY, 0)
  const neckY = horse ? 2.35 : cat ? 0.78 : 0.96
  const neckZ = horse ? -0.86 : -0.55
  cube(root, horse ? 0.65 : 0.48, horse ? 1.35 : 0.4,
    horse ? 0.7 : 0.45, coat, 0, neckY, neckZ)

  const headY = horse ? 3.03 : cat ? 1.0 : 1.25
  const headZ = horse ? -1.1 : cat ? -0.75 : -0.88
  cube(root, horse ? 0.8 : 0.67, horse ? 0.8 : 0.65,
    horse ? 1.05 : 0.7, coat, 0, headY, headZ)
  cube(root, horse ? 0.68 : 0.42, horse ? 0.43 : 0.26,
    horse ? 0.6 : 0.34, cat ? white : darkBrown,
    0, headY - 0.15, headZ - (horse ? 0.66 : 0.42))

  for (const side of [-1, 1]) {
    const x = side * (horse ? 0.23 : 0.21)
    const eye = part(root, new THREE.SphereGeometry(horse ? 0.09 : 0.075, 8, 6),
      black, x, headY + 0.1, headZ - (horse ? 0.53 : 0.36))
    eye.castShadow = false
    if (cat) {
      const ear = part(root, new THREE.ConeGeometry(0.19, 0.4, 4),
        orange, side * 0.24, headY + 0.49, headZ)
      ear.rotation.y = Math.PI / 4
      part(root, new THREE.ConeGeometry(0.1, 0.22, 4),
        pink, side * 0.24, headY + 0.51, headZ - 0.06)
    } else {
      const ear = cube(root, horse ? 0.23 : 0.28, horse ? 0.46 : 0.37,
        0.2, coat, side * (horse ? 0.28 : 0.33), headY + 0.44, headZ + 0.1)
      if (!horse) ear.rotation.z = side * 0.5
    }
  }

  const legLength = horse ? 1.12 : cat ? 0.4 : 0.52
  for (const x of [-bodyW * 0.34, bodyW * 0.34]) {
    for (const z of [-bodyD * 0.33, bodyD * 0.33]) {
      const pivot = new THREE.Group()
      pivot.position.set(x, bodyY - bodyH * 0.35, z)
      root.add(pivot)
      cube(pivot, horse ? 0.27 : 0.2, legLength, horse ? 0.3 : 0.22,
        coat, 0, -legLength / 2, 0)
      cube(pivot, horse ? 0.33 : 0.25, 0.14, horse ? 0.39 : 0.28,
        horse ? black : coat, 0, -legLength + 0.06, -0.04)
      legs.push(pivot)
    }
  }

  const tail = new THREE.Group()
  tail.position.set(0, bodyY + 0.1, bodyD / 2)
  root.add(tail)
  if (cat) {
    cube(tail, 0.15, 0.8, 0.15, orange, 0, 0.24, 0.27)
    cube(tail, 0.15, 0.42, 0.15, orange, 0, 0.6, 0.33)
  } else {
    cube(tail, horse ? 0.35 : 0.28, horse ? 1.05 : 0.48,
      horse ? 0.34 : 0.3, horse ? darkBrown : cream,
      0, horse ? -0.47 : -0.18, 0.17)
  }
  if (horse) {
    for (let i = 0; i < 5; i++) {
      cube(root, 0.25, 0.35, 0.38, darkBrown,
        0, 2.45 + i * 0.17, -0.45 - i * 0.17)
    }
  }
  return { root, legs, tail }
}

function blocked(x: number, z: number, r: number,
  colliders: WorldCollider[], limit: number) {
  if (Math.hypot(x, z) + r > limit) return true
  for (const c of colliders) {
    if (c.type === 'circle') {
      if (Math.hypot(x - c.x, z - c.z) < r + c.radius + 0.5) return true
    } else {
      const dx = x - THREE.MathUtils.clamp(x, c.x - c.halfWidth, c.x + c.halfWidth)
      const dz = z - THREE.MathUtils.clamp(z, c.z - c.halfDepth, c.z + c.halfDepth)
      if (Math.hypot(dx, dz) < r + 0.5) return true
    }
  }
  return false
}

export class KingdomAnimals {
  public readonly group = new THREE.Group()
  private readonly animals: Animal[] = []
  private readonly colliders: WorldCollider[]
  private readonly limit: number

  constructor(colliders: WorldCollider[], worldRadius: number) {
    this.colliders = colliders
    this.limit = worldRadius - 2.5
    const entries: { species: Species; x: number; z: number; roam: number }[] = [
      { species: 'dog', x: -11, z: 13, roam: 9 },
      { species: 'cat', x: 12, z: 13, roam: 9 },
      { species: 'horse', x: -12, z: -12, roam: 10 },
      { species: 'giraffe', x: 12, z: -12, roam: 8 },
      { species: 'raccoon', x: 11, z: 24, roam: 7 },
      { species: 'sheep', x: -12, z: 25, roam: 7 },
    ]
    for (const entry of entries) {
      const radius = entry.species === 'giraffe' ? 1.1
        : entry.species === 'horse' ? 1.3
        : entry.species === 'sheep' ? 0.6
        : entry.species === 'raccoon' ? 0.35 : 0.325
      if (blocked(entry.x, entry.z, radius, colliders, this.limit)) continue
      const model = entry.species === 'giraffe' || entry.species === 'raccoon' || entry.species === 'sheep'
        ? newAnimalModel(entry.species)
        : animalModel(entry.species)
      if (entry.species === 'dog' || entry.species === 'cat' || entry.species === 'raccoon') {
        model.root.scale.setScalar(0.5)
      }
      model.root.position.set(entry.x, 0, entry.z)
      this.group.add(model.root)
      this.animals.push({
        ...model,
        phase: Math.random() * 10,
        heading: Math.random() * Math.PI * 2,
        speed: entry.species === 'horse' ? 1.15
          : entry.species === 'giraffe' ? 0.85
          : entry.species === 'sheep' ? 0.9
          : entry.species === 'cat' ? 1.1
          : entry.species === 'raccoon' ? 1.05 : 1.5,
        wait: Math.random() * 2,
        turnIn: 0,
        radius,
        home: new THREE.Vector2(entry.x, entry.z),
        roam: entry.roam,
      })
    }
  }

  update(delta: number) {
    const dt = Math.min(delta, 0.05)
    for (const a of this.animals) {
      a.phase += dt
      if (a.wait > 0) {
        a.wait -= dt
        for (const leg of a.legs) leg.rotation.x *= 0.85
        a.tail.rotation.z = Math.sin(a.phase * 3) * 0.18
        continue
      }
      a.turnIn -= dt
      if (a.turnIn <= 0) {
        a.turnIn = 1.2 + Math.random() * 3
        a.heading += (Math.random() - 0.5) * 1.8
        if (Math.random() < 0.22) a.wait = 0.8 + Math.random() * 2.8
      }
      const x = a.root.position.x + Math.sin(a.heading) * a.speed * dt
      const z = a.root.position.z + Math.cos(a.heading) * a.speed * dt
      const farFromHome = Math.hypot(x - a.home.x, z - a.home.y) > a.roam
      if (farFromHome || blocked(x, z, a.radius, this.colliders, this.limit)) {
        a.heading += Math.PI * (0.6 + Math.random() * 0.7)
        a.turnIn = 0.5
        continue
      }
      a.root.position.set(x, 0, z)
      a.root.rotation.y = a.heading + Math.PI
      const swing = Math.sin(a.phase * 9 * a.speed) * 0.32
      a.legs[0].rotation.x = swing
      a.legs[1].rotation.x = -swing
      a.legs[2].rotation.x = -swing
      a.legs[3].rotation.x = swing
      a.tail.rotation.z = Math.sin(a.phase * 6) * 0.22
    }
  }
}
