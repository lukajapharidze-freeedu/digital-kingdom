import * as THREE from 'three'
import type { NightRig } from './KingdomNight'

const material = (color: number, emissive = 0) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    flatShading: true,
    emissive,
    emissiveIntensity: emissive ? 0.45 : 0,
  })

const flowerColors = [
  material(0xff719c), material(0xffdb57),
  material(0xa58aff), material(0xffffff),
]
const green = material(0x338c47)
const darkGreen = material(0x266b40)
const wood = material(0x805235)
const stone = material(0xe6d9bb)
const iron = material(0x4b6472)
const warmLight = material(0xffdc83, 0xffba48)
const pebble = material(0xf2e1b9)

function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  mat: THREE.Material,
  x: number, y: number, z: number,
) {
  const object = new THREE.Mesh(geometry, mat)
  object.position.set(x, y, z)
  object.castShadow = true
  object.receiveShadow = true
  parent.add(object)
  return object
}

function flower(parent: THREE.Group, x: number, z: number, color: THREE.Material) {
  addMesh(parent, new THREE.CylinderGeometry(0.035, 0.045, 0.34, 5),
    darkGreen, x, 0.19, z)
  addMesh(parent, new THREE.IcosahedronGeometry(0.17, 0),
    color, x, 0.4, z)
  addMesh(parent, new THREE.IcosahedronGeometry(0.09, 0),
    green, x + 0.1, 0.2, z)
}

function lantern(parent: THREE.Group, x: number, z: number, rig: NightRig) {
  // ღამით ფარნის შუშა ანათებს და ირგვლივ რბილი ნათება ჩნდება
  const glow = rig.glowMaterial('lantern', 0xffdc83, 0xffba48, 0.35, 2.6, 0.4)
  addMesh(parent, new THREE.CylinderGeometry(0.12, 0.18, 3.2, 7),
    iron, x, 1.6, z)
  addMesh(parent, new THREE.BoxGeometry(0.8, 0.85, 0.8),
    iron, x, 3.45, z)
  addMesh(parent, new THREE.BoxGeometry(0.59, 0.6, 0.59),
    glow, x, 3.45, z)
  addMesh(parent, new THREE.ConeGeometry(0.62, 0.55, 4),
    iron, x, 4.15, z).rotation.y = Math.PI / 4
  rig.halo(parent, x, 3.45, z, 3.4, 0xffc766, 0.85, 0)
}

function bench(parent: THREE.Group, x: number, z: number, rotation = 0) {
  const group = new THREE.Group()
  group.position.set(x, 0, z)
  group.rotation.y = rotation
  parent.add(group)
  addMesh(group, new THREE.BoxGeometry(2.3, 0.2, 0.65), wood, 0, 0.75, 0)
  addMesh(group, new THREE.BoxGeometry(2.3, 0.95, 0.18), wood, 0, 1.2, -0.32)
  for (const dx of [-0.88, 0.88]) {
    addMesh(group, new THREE.BoxGeometry(0.17, 0.7, 0.55), iron, dx, 0.37, 0)
  }
}

function sign(parent: THREE.Group, label: string, x: number, z: number) {
  // The canvas is rendered by the browser, so Georgian lettering remains crisp.
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#294966'
  ctx.beginPath()
  ctx.roundRect(18, 20, 988, 216, 36)
  ctx.fill()
  ctx.strokeStyle = '#efc36b'
  ctx.lineWidth = 13
  ctx.stroke()
  ctx.fillStyle = '#fff5dc'
  ctx.font = 'bold 72px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 512, 130, 930)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  }))
  sprite.position.set(x, 4.1, z)
  sprite.scale.set(5.4, 1.35, 1)
  parent.add(sprite)

  addMesh(parent, new THREE.CylinderGeometry(0.09, 0.12, 2.8, 6),
    wood, x, 1.4, z)
}

function flag(parent: THREE.Group, x: number, z: number, color: number) {
  const cloth = material(color)
  addMesh(parent, new THREE.CylinderGeometry(0.06, 0.06, 5, 6),
    iron, x, 2.5, z)
  addMesh(parent, new THREE.BoxGeometry(1.45, 0.82, 0.09),
    cloth, x + 0.73, 4.4, z)
  addMesh(parent, new THREE.IcosahedronGeometry(0.18, 0),
    warmLight, x, 5.1, z)
}

export function decorateKingdom(parent: THREE.Group, rig: NightRig) {
  // The entrance avenue stays clear for the player.
  for (const z of [8, 16, 24, 31]) {
    lantern(parent, -4.3, z, rig)
    lantern(parent, 4.3, z, rig)
  }
  for (const z of [-9, -17, -25]) {
    lantern(parent, -4.3, z, rig)
    lantern(parent, 4.3, z, rig)
  }

  for (const [x, z, rotation] of [
    [-8, 10, 0], [8, 10, Math.PI],
    [-8, -9, 0], [8, -9, Math.PI],
    [-10, 25, 0], [10, 25, Math.PI],
  ]) {
    bench(parent, x, z, rotation)
  }

  // Small flower beds around the central plaza and side paths.
  for (let i = 0; i < 88; i++) {
    const angle = i * 2.399963229728653
    const ring = 12.4 + (i % 4) * 0.62
    const x = Math.cos(angle) * ring
    const z = Math.sin(angle) * ring
    // Keep main paths and the fountain clear.
    if (Math.abs(x) < 3.2 || Math.abs(z) < 3.2) continue
    flower(parent, x, z, flowerColors[i % flowerColors.length])
  }

  // Flower patches in open green areas, away from building footprints.
  for (const [cx, cz] of [
    [-12, 20], [12, 20], [-12, -21], [12, -21],
    [-31, 5], [31, 9], [-8, 31], [8, 31],
  ]) {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2
      const r = 0.5 + (i % 3) * 0.45
      flower(parent, cx + Math.cos(a) * r,
        cz + Math.sin(a) * r, flowerColors[(i + Math.round(cx)) & 3])
    }
  }

  // Stone detailing around the plaza.
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2
    const x = Math.cos(a) * 10.9
    const z = Math.sin(a) * 10.9
    addMesh(parent, new THREE.BoxGeometry(1.15, 0.1, 0.6),
      pebble, x, 0.13, z).rotation.y = -a
  }

  // Decorative banners on the kingdom entrance.
  flag(parent, -8.7, 36, 0x4789d0)
  flag(parent, 8.7, 36, 0xf1ba43)

  // Name signs sit on the approach side of each building.
  sign(parent, 'ცოდნის კოშკი', -29, -12.3)
  sign(parent, 'აკადემია', -21, -15.2)
  sign(parent, 'ბიბლიოთეკა', 23, -13.3)
  sign(parent, 'მაღაზია', -23, 27.4)
  sign(parent, 'სამჭედლო', 24, 24.8)
  sign(parent, 'საგანძურის საცავი', 30, 3.5)

  // Gentle decorative rocks in the lawns (no gameplay collision).
  for (const [x, z] of [
    [-15, 28], [15, 29], [-32, 12], [34, 14],
    [-13, -30], [14, -30], [-35, -4], [35, -13],
  ]) {
    const rock = addMesh(parent, new THREE.DodecahedronGeometry(0.58, 0),
      stone, x, 0.38, z)
    rock.scale.set(1.3, 0.65, 0.95)
  }
}
