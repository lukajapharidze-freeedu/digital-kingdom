import * as THREE from 'three'
import type { WorldCollider } from '../game/Collision'
import { decorateKingdom } from './KingdomDecorations'
import { KingdomAnimals } from './KingdomAnimals'
import { NightRig } from './KingdomNight'
import {
  type Animator, type BuildContext, P, make, block, cyl, cone, group, place,
  cylG, icoG, octG, torusG, coneG,
} from './KingdomKit'
import { buildCastle, buildKnowledgeTower, buildAcademy, buildLibrary } from './KingdomBuildings'
import { buildMarket, buildForge, buildTreasury, buildGate } from './KingdomWorkshops'

export type KingdomBuildingId =
  | 'academy' | 'library'
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
  /** ანიმაციები (კვამლი, დროშები, წყალი, კრისტალები...). ყოველ კადრზე გამოიძახე. */
  update: (dt: number) => void
  /** 0 — დღე, 1 — ღამე. ჩვეულებრივ DayNightCycle იძახებს. */
  setNightLevel: (level: number) => void
  night: NightRig
}

const grass = make(0x78c75c)
const soil = make(0x936342)
const soilDark = make(0x6f4a30)
const pathMat = make(0xdcc8a1)
const leaves = make(0x4ba853)
const leavesLight = make(0x78c75c)
const pine = make(0x2f7d4a)
const pineLight = make(0x3f9a5c)
const birchLeaf = make(0x9bd35f)
const rockMat = make(0xcfc4a6)

function pavedPath(parent: THREE.Object3D, x: number, z: number, w: number, d: number) {
  block(parent, w, 0.08, d, pathMat, x, 0, z, false)
}

/** ხეები: მრგვალი, ფიჭვი, არყი — ოდნავ ირხევა ქარში */
function tree(ctx: BuildContext, parent: THREE.Object3D, x: number, z: number, scale: number, kind: number) {
  const t = group(parent, x, 0, z)
  const crown = group(t, 0, 0, 0)
  if (kind === 0) {
    cyl(t, 0.25 * scale, 0.35 * scale, 1.7 * scale, P.wood, 0, 0, 0, 6)
    place(crown, icoG(1.1 * scale), leaves, 0, 2.2 * scale, 0)
    place(crown, icoG(0.85 * scale), leavesLight, 0.4 * scale, 2.65 * scale, 0)
  } else if (kind === 1) {
    cyl(t, 0.2 * scale, 0.3 * scale, 1.2 * scale, P.darkWood, 0, 0, 0, 6)
    for (let i = 0; i < 3; i++) {
      cone(crown, (1.45 - i * 0.38) * scale, 1.7 * scale, i % 2 ? pineLight : pine, 0, (0.9 + i * 1.05) * scale, 0, 7)
    }
  } else {
    cyl(t, 0.18 * scale, 0.26 * scale, 2.2 * scale, make(0xe9e2d0), 0, 0, 0, 6)
    place(crown, icoG(0.95 * scale), birchLeaf, 0, 2.7 * scale, 0)
    place(crown, icoG(0.65 * scale), leavesLight, -0.4 * scale, 3.2 * scale, 0.2 * scale)
  }
  const seed = x * 0.37 + z * 0.21
  ctx.animate((_dt, time) => {
    crown.rotation.z = Math.sin(time * 0.9 + seed) * 0.025
    crown.rotation.x = Math.cos(time * 0.7 + seed) * 0.02
  })
  return t
}

function bush(parent: THREE.Object3D, x: number, z: number, s: number, flowery: boolean) {
  const b = group(parent, x, 0, z)
  place(b, icoG(0.6 * s), leaves, 0, 0.45 * s, 0, false).scale.set(1.2, 0.8, 1)
  place(b, icoG(0.42 * s), leavesLight, 0.4 * s, 0.4 * s, 0.2 * s, false)
  if (flowery) {
    const pink = make(0xff8fb0)
    for (let i = 0; i < 4; i++) place(b, icoG(0.08 * s), pink, (i - 1.5) * 0.28 * s, 0.75 * s, ((i % 2) - 0.5) * 0.4 * s, false)
  }
}

export function createKingdomWorld(): KingdomWorldData {
  const root = new THREE.Group()
  root.visible = false
  const colliders: WorldCollider[] = []
  const buildings: KingdomBuilding[] = []
  const radius = 43

  const rig = new NightRig()
  const animators: Animator[] = []
  const ctx: BuildContext = { rig, animate: fn => animators.push(fn) }
  let time = 0

  // ---------- მცურავი კუნძული ----------
  place(root, cylG(45, 41, 3, 24), grass, 0, -1.5, 0)
  place(root, cylG(41, 29, 9, 20), soil, 0, -7.5, 0)
  // ქვედა კონუსი წვეროთი ქვემოთ (ორიგინალში წვერო ზემოთ იყო მიმართული)
  place(root, coneG(29, 17, 20).clone().rotateX(Math.PI), soil, 0, -20.5, 0)

  const rockBands = [
    { r: 40.2, y: -4.2, h: 1.2, m: soilDark },
    { r: 36.0, y: -9.6, h: 1.0, m: soilDark },
    { r: 31.4, y: -14.2, h: 0.9, m: soilDark },
  ]
  for (const b of rockBands) cyl(root, b.r, b.r - 0.8, b.h, b.m, 0, b.y, 0, 20, false)

  // ქვედა ნაწილზე მანათობელი კრისტალები (ღამით ჩანს)
  const under = rig.glowMaterial('underCrystal', 0x6fd6ff, 0x1a9ad6, 0.35, 2.6, 0.3)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.2
    const r = 27 + (i % 3) * 1.6
    const c = place(root, octG(1), under, Math.cos(a) * r, -14 - (i % 4) * 1.2, Math.sin(a) * r, false)
    c.scale.set(0.7, 2.2 + (i % 3) * 0.6, 0.7)
    c.rotation.set(0.2 * Math.cos(a), a, 0.2 * Math.sin(a))
    if (i % 3 === 0) rig.halo(root, Math.cos(a) * r, -14 - (i % 4) * 1.2, Math.sin(a) * r, 5, 0x6fd6ff, 0.7, 0.05)
  }

  // კიდეზე ქვები
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2
    const r = 44 + ((i * 7) % 5) * 0.2
    const rock = place(root, new THREE.DodecahedronGeometry(0.45 + ((i * 13) % 4) * 0.12, 0), rockMat,
      Math.cos(a) * r, 0.1, Math.sin(a) * r, false)
    rock.scale.set(1.3, 0.7, 1)
    rock.rotation.y = a
  }

  // ბილიკები (შესასვლელი სამხრეთით, +Z)
  place(root, cylG(11, 11, 0.12, 32), pathMat, 0, 0.055, 0, false)
  pavedPath(root, 0, 22, 5, 34)
  pavedPath(root, 0, -20, 5, 30)
  pavedPath(root, -18, 0, 24, 4)
  pavedPath(root, 18, 0, 24, 4)
  pavedPath(root, -19, -14, 4, 24)
  pavedPath(root, 19, -14, 4, 24)
  pavedPath(root, -19, 15, 4, 24)
  pavedPath(root, 19, 15, 4, 24)

  // მოედნის ორნამენტი
  for (const r of [6.6, 9.4]) {
    const ring = place(root, torusG(r, 0.1, 4, 72), P.trim, 0, 0.1, 0, false)
    ring.rotation.x = Math.PI / 2
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12
    const spoke = block(root, 0.14, 0.03, 2.4, P.trim, Math.cos(a) * 8.0, 0.1, Math.sin(a) * 8.0, false)
    spoke.rotation.y = -a + Math.PI / 2
  }

  // ---------- შადრევანი ----------
  const water = rig.glowMaterial('water', 0x3bc7f5, 0x137da8, 0.35, 1.5, 0.22)
  cyl(root, 4.1, 4.3, 0.75, P.trim, 0, 0, 0, 24)
  const rim = place(root, torusG(4.15, 0.2, 5, 36), P.base, 0, 0.78, 0, false)
  rim.rotation.x = Math.PI / 2
  cyl(root, 3.55, 3.55, 0.08, water, 0, 0.8, 0, 24, false)
  cyl(root, 1.0, 1.25, 1.35, P.stone, 0, 0.75, 0, 12)
  cyl(root, 2.1, 2.3, 0.35, P.trim, 0, 1.75, 0, 16)
  cyl(root, 1.75, 1.75, 0.06, water, 0, 2.08, 0, 16, false)
  cyl(root, 0.42, 0.58, 1.1, P.stone, 0, 2.1, 0, 10)
  const crystal = place(root, octG(1.15), water, 0, 4.0, 0)
  crystal.scale.set(0.9, 1.3, 0.9)
  rig.halo(root, 0, 4.0, 0, 9, 0x58c8ff, 0.9, 0.06)
  rig.light(root, 0x58c8ff, 0.4, 11, 22, 0, 3.6, 0, 0.06)

  // წყლის წვეთები: ტოტებიდან აუზში
  const dropMat = rig.glowMaterial('drop', 0x9be4ff, 0x4dc0f0, 0.3, 1.4, 0.2)
  const drops: { mesh: THREE.Mesh; dir: number; phase: number }[] = []
  for (let d = 0; d < 6; d++) {
    for (let k = 0; k < 6; k++) {
      drops.push({ mesh: place(root, icoG(0.07), dropMat, 0, -5, 0, false), dir: (d / 6) * Math.PI * 2, phase: k / 6 })
    }
  }
  ctx.animate((_dt, t) => {
    crystal.rotation.y = t * 0.8
    crystal.position.y = 4.0 + Math.sin(t * 1.2) * 0.2
    for (const p of drops) {
      const u = (t * 0.55 + p.phase) % 1
      const rr = 0.5 + u * 2.6
      p.mesh.position.set(Math.cos(p.dir) * rr, 2.15 + 1.9 * 4 * u * (1 - u) - 1.35 * u, Math.sin(p.dir) * rr)
    }
  })
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

  // ---------- შენობები ----------
  buildCastle(ctx, root)
  colliders.push({ type: 'box', x: 0, z: -32, halfWidth: 6.5, halfDepth: 3.5, height: 13 })
  colliders.push({ type: 'circle', x: -8, z: -32, radius: 2.1, height: 14 })
  colliders.push({ type: 'circle', x: 8, z: -32, radius: 2.1, height: 14 })

  // ცოდნის კოშკი: მხოლოდ შენობაა (ინტერაქციის გარეშე)
  buildKnowledgeTower(ctx, root)
  colliders.push({ type: 'box', x: -29, z: -17, halfWidth: 2.8, halfDepth: 2.8, height: 15 })

  buildAcademy(ctx, root)
  register('academy', 'აკადემია', -21, -21, 8, 7, 7)

  buildLibrary(ctx, root)
  register('library', 'ბიბლიოთეკა', 23, -19, 9, 7, 5.2)

  // მაღაზია: დახლები აღმოსავლეთით, ბილიკისკენ (x = -19) იყურება
  buildMarket(ctx, root)
  buildings.push({
    id: 'market', name: 'მაღაზია',
    position: new THREE.Vector3(-19.6, 0, 19), interactionRadius: 3,
  })
  for (const sx of [-3, 3]) {
    for (const sz of [-3, 3]) {
      // დახლის ცენტრი (sx, sz + 0.2) 90°-ით შემობრუნებული: x ← z, z ← -x
      colliders.push({
        type: 'box', x: -26 + sz + 0.2, z: 19 - sx,
        halfWidth: 1.5, halfDepth: 1.9, height: 3.5,
      })
    }
  }

  // ბაზრის კასრები, ყუთი და ტომრები (ადგილობრივი (x, z) → (-26 + z, 19 - x))
  for (const [x, z, radius, height] of [
    [-27.5, 25, 0.5, 1.0], [-26.4, 25.6, 0.5, 1.0], [-23.8, 12.9, 0.5, 1.0],
    [-26.6, 12.8, 0.6, 1.6], [-25.3, 12.5, 0.45, 0.9], [-24, 25.3, 0.45, 0.9],
  ]) {
    colliders.push({ type: 'circle', x, z, radius, height })
  }

  // სამჭედლო: კარი დასავლეთით, ბილიკისკენ (x = 19)
  buildForge(ctx, root)
  buildings.push({
    id: 'forge', name: 'სამჭედლო',
    position: new THREE.Vector3(20, 0, 19), interactionRadius: 2.8,
  })
  colliders.push({ type: 'box', x: 27.3, z: 19, halfWidth: 3.5, halfDepth: 4.5, height: 10 })
  // სამჭედლოს ეზო: ღუმელი, გრდემლი, კასრი, სალესი ბორბალი, ნახშირი (ადგილობრივი (x, z) → (27.3 - z, 19 + x))
  colliders.push({ type: 'box', x: 23.3, z: 21.5, halfWidth: 0.6, halfDepth: 1.4, height: 5 })
  for (const [x, z, radius, height] of [
    [22.4, 17.3, 0.6, 1.4], [21.6, 14.7, 0.55, 1.0], [22.9, 14.1, 0.6, 1.4], [22.1, 23.55, 0.4, 0.6],
  ]) {
    colliders.push({ type: 'circle', x, z, radius, height })
  }

  buildTreasury(ctx, root)
  register('treasury', 'საგანძურის საცავი', 30, -2, 7, 7, 5.7)

  // შესასვლელი კარიბჭე
  buildGate(ctx, root)
  colliders.push({ type: 'circle', x: -5.5, z: 37, radius: 1.6, height: 8 })
  colliders.push({ type: 'circle', x: 5.5, z: 37, radius: 1.6, height: 8 })
  // თაღის ქვის მხრები (გამავალი სივრცე — 4.8 სიგანის)
  colliders.push({ type: 'box', x: -3.1, z: 37, halfWidth: 0.7, halfDepth: 0.7, height: 8 })
  colliders.push({ type: 'box', x: 3.1, z: 37, halfWidth: 0.7, halfDepth: 0.7, height: 8 })

  // ---------- ხეები და ბუჩქები ----------
  for (let i = 0; i < 28; i++) {
    const angle = (i / 28) * Math.PI * 2
    const r = 36 + (i % 3) * 1.4
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    if (Math.abs(x) < 10 && (z > 28 || z < -28)) continue
    if (x < -26 && z > 9 && z < 28) continue
    if (x > 22 && z > 9 && z < 28) continue
    tree(ctx, root, x, z, 0.75 + (i % 4) * 0.13, i % 3)
    colliders.push({ type: 'circle', x, z, radius: 0.4, height: 2 })
  }
  for (let i = 0; i < 26; i++) {
    const angle = (i / 26) * Math.PI * 2 + 0.12
    const r = 33.2 + (i % 2) * 0.9
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    if (Math.abs(x) < 8 && (z > 26 || z < -26)) continue
    if (x < -24 && z > 9 && z < 28) continue
    if (x > 20 && z > 9 && z < 28) continue
    const scale = 0.8 + (i % 3) * 0.2
    bush(root, x, z, scale, i % 3 === 0)
    colliders.push({ type: 'circle', x, z, radius: 0.6 * scale, height: 0.9 })
  }

  // ---------- მცურავი პატარა კუნძულები ----------
  const islets: [number, number, number, number][] = [
    [-64, -4, -22, 1.0], [60, -9, 30, 0.85], [8, -12, -72, 1.1], [-42, -8, 56, 0.9],
  ]
  islets.forEach(([x, y, z, s], idx) => {
    const g = group(root, x, y, z)
    g.scale.set(s, s, s)
    cyl(g, 3.4, 3.0, 0.9, grass, 0, -0.9, 0, 10)
    cone(g, 3.0, 4.5, soil, 0, -5.4, 0, 10).rotation.x = Math.PI
    if (idx % 2 === 0) {
      tree(ctx, g, 0.4, 0, 0.8, idx % 3)
    } else {
      const c = place(g, octG(0.8), under, 0, 1.0, 0)
      c.scale.set(0.8, 1.6, 0.8)
      rig.halo(g, 0, 1.0, 0, 4.5, 0x6fd6ff, 0.7, 0.05)
    }
    const seed = idx * 1.7
    ctx.animate((_dt, t) => {
      g.position.y = y + Math.sin(t * 0.6 + seed) * 0.6
    })
  })

  decorateKingdom(root, rig, colliders)

  // წარმადობა: პატარა დეტალები ჩრდილს აღარ ქმნის
  root.traverse((obj: THREE.Object3D) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh || !mesh.castShadow) return
    const geo = mesh.geometry
    if (!geo.boundingBox) geo.computeBoundingBox()
    const bb = geo.boundingBox
    if (!bb) return
    const size = Math.max(
      (bb.max.x - bb.min.x) * mesh.scale.x,
      (bb.max.y - bb.min.y) * mesh.scale.y,
      (bb.max.z - bb.min.z) * mesh.scale.z,
    )
    if (size < 0.7) mesh.castShadow = false
  })

  const animals = new KingdomAnimals(colliders, radius)
  root.add(animals.group)

  return {
    group: root, colliders, buildings, animals,
    spawn: new THREE.Vector3(0, 0, 33),
    radius,
    update(dt: number) {
      time += dt
      for (const a of animators) a(dt, time)
      rig.update(dt)
    },
    setNightLevel(level: number) {
      rig.setLevel(level)
    },
    night: rig,
  }
}
