import * as THREE from 'three'
import { NightRig } from './KingdomNight'

export type Animator = (dt: number, t: number) => void

export interface BuildContext {
  rig: NightRig
  animate: (fn: Animator) => void
}

const std = (
  color: number,
  o: { metalness?: number; roughness?: number; emissive?: number; ei?: number } = {},
) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: o.roughness ?? 0.82,
    metalness: o.metalness ?? 0,
    flatShading: true,
    emissive: o.emissive ?? 0,
    emissiveIntensity: o.ei ?? 0,
  })

/** საერთო პალიტრა ყველა შენობისთვის */
export const P = {
  stone: std(0xe8dcc0),
  cream: std(0xf3e8cd),
  marble: std(0xf6f1e6),
  base: std(0xb3a07e),
  trim: std(0xc7b690),
  darkStone: std(0x8a8274),
  soot: std(0xb8ab94),
  blue: std(0x347ec4),
  deepBlue: std(0x24507e),
  slate: std(0x3b4252),
  purple: std(0x5b4bb7),
  gold: std(0xf3bb46, { metalness: 0.2, emissive: 0xffa000, ei: 0.12 }),
  wood: std(0x855333),
  darkWood: std(0x5a3722),
  leather: std(0x6a4230),
  red: std(0xc95743),
  brick: std(0xa8523d),
  iron: std(0x4b6472),
  steel: std(0x39485a),
  coal: std(0x2a2a30),
  copper: std(0x4fa3a5),
  leaf: std(0x4ba853),
  white: std(0xffffff),
}

export const make = std

// ---------- გეომეტრიის ქეში (იგივე ზომის ფორმები საერთო გეომეტრიას იყენებს) ----------

const geoCache = new Map<string, THREE.BufferGeometry>()

function cached<T extends THREE.BufferGeometry>(key: string, create: () => T): T {
  const hit = geoCache.get(key) as T | undefined
  if (hit) return hit
  const geo = create()
  geoCache.set(key, geo)
  return geo
}

export const boxG = (w: number, h: number, d: number) =>
  cached(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d))

export const cylG = (rt: number, rb: number, h: number, seg = 8) =>
  cached(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg))

export const coneG = (r: number, h: number, seg = 8) =>
  cached(`n${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg))

export const icoG = (r: number, detail = 0) =>
  cached(`i${r},${detail}`, () => new THREE.IcosahedronGeometry(r, detail))

export const octG = (r: number) => cached(`o${r}`, () => new THREE.OctahedronGeometry(r, 0))

export const torusG = (r: number, tube: number, rs = 6, ts = 24) =>
  cached(`t${r},${tube},${rs},${ts}`, () => new THREE.TorusGeometry(r, tube, rs, ts))

export const domeG = (r: number, seg = 16) =>
  cached(`d${r},${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(6, seg >> 1), 0, Math.PI * 2, 0, Math.PI / 2))

/** თაღოვანი ფორმა (ფანჯრები, კარები). ზედაპირი z=0-ზეა, სიღრმე +z მიმართულებით. */
export const archG = (w: number, h: number, depth: number) =>
  cached(`a${w},${h},${depth}`, () => {
    const r = w / 2
    const s = new THREE.Shape()
    s.moveTo(-r, 0)
    s.lineTo(r, 0)
    s.lineTo(r, h - r)
    s.absarc(0, h - r, r, 0, Math.PI, false)
    s.lineTo(-r, 0)
    return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false })
  })

// ---------- განლაგების დამხმარეები ----------

export function place(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  shadow = true,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(x, y, z)
  mesh.castShadow = shadow
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

/** ყუთი, სადაც y არის ქვედა წერტილი */
export function block(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x = 0,
  y0 = 0,
  z = 0,
  shadow = true,
) {
  return place(parent, boxG(w, h, d), mat, x, y0 + h / 2, z, shadow)
}

export function cyl(
  parent: THREE.Object3D,
  rt: number,
  rb: number,
  h: number,
  mat: THREE.Material,
  x = 0,
  y0 = 0,
  z = 0,
  seg = 8,
  shadow = true,
) {
  return place(parent, cylG(rt, rb, h, seg), mat, x, y0 + h / 2, z, shadow)
}

export function cone(
  parent: THREE.Object3D,
  r: number,
  h: number,
  mat: THREE.Material,
  x = 0,
  y0 = 0,
  z = 0,
  seg = 8,
) {
  return place(parent, coneG(r, h, seg), mat, x, y0 + h / 2, z)
}

export function group(parent: THREE.Object3D, x = 0, y = 0, z = 0): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  parent.add(g)
  return g
}

/** სამკუთხა სახურავი (პრიზმა). span — სიგანე x-ზე, length — სიგრძე z-ზე (rotY-ით შეტრიალდება). */
export function gable(
  parent: THREE.Object3D,
  span: number,
  length: number,
  rise: number,
  over: number,
  mat: THREE.Material,
  x: number,
  y0: number,
  z: number,
  rotY = 0,
) {
  const half = span / 2 + over
  const len = length + over * 2
  const s = new THREE.Shape()
  s.moveTo(-half, 0)
  s.lineTo(half, 0)
  s.lineTo(0, rise)
  s.closePath()
  const geo = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false })
  geo.translate(0, 0, -len / 2)
  const mesh = place(parent, geo, mat, x, y0, z)
  mesh.rotation.y = rotY
  return mesh
}

/** ბრტყელი ამოსახულება: ფერადი პლაკეტი (ფარი) */
export function shield(parent: THREE.Object3D, x: number, y: number, z: number, scale: number, main: THREE.Material) {
  const s = new THREE.Shape()
  s.moveTo(-0.5, 0.6)
  s.lineTo(0.5, 0.6)
  s.lineTo(0.5, -0.1)
  s.quadraticCurveTo(0.5, -0.55, 0, -0.8)
  s.quadraticCurveTo(-0.5, -0.55, -0.5, -0.1)
  s.closePath()
  const outer = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false })
  const inner = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: false })
  const g = group(parent, x, y, z)
  g.scale.set(scale, scale, scale)
  place(g, outer, P.gold, 0, 0, 0, false)
  const face = place(g, inner, main, 0, 0, 0.05, false)
  face.scale.set(0.8, 0.8, 1)
  face.position.y = -0.02
  return g
}

// ---------- არქიტექტურული დეტალები ----------

/** თაღოვანი ფანჯარა (კედლის ზედაპირზე z). ღამით ანათებს. */
export function archWindow(
  ctx: BuildContext,
  parent: THREE.Object3D,
  x: number,
  y0: number,
  z: number,
  w: number,
  h: number,
  paneMat?: THREE.Material,
  frameMat: THREE.Material = P.trim,
) {
  const pane = paneMat ?? ctx.rig.windowMaterial()
  place(parent, archG(+(w + 0.28).toFixed(3), +(h + 0.18).toFixed(3), 0.1), frameMat, x, y0 - 0.09, z, false)
  place(parent, archG(w, h, 0.14), pane, x, y0, z, false)
  block(parent, 0.05, h * 0.92, 0.17, P.darkWood, x, y0, z, false)
  block(parent, w * 0.92, 0.05, 0.17, P.darkWood, x, y0 + h * 0.42, z, false)
  block(parent, w + 0.5, 0.12, 0.3, frameMat, x, y0 - 0.2, z + 0.1, false)
}

/** სვეტზე (ცილინდრულ კოშკზე) მიმაგრებული ფანჯარა: ang — მიმართულება x/z სიბრტყეში */
export function cylinderWindow(
  ctx: BuildContext,
  parent: THREE.Object3D,
  cx: number,
  cz: number,
  r: number,
  ang: number,
  y0: number,
  w: number,
  h: number,
  paneMat?: THREE.Material,
) {
  const g = group(parent, cx + Math.cos(ang) * r, 0, cz + Math.sin(ang) * r)
  g.rotation.y = Math.PI / 2 - ang
  archWindow(ctx, g, 0, y0, 0, w, h, paneMat)
  return g
}

export function doorArch(
  parent: THREE.Object3D,
  x: number,
  y0: number,
  z: number,
  w: number,
  h: number,
  doorMat: THREE.Material = P.wood,
  frameMat: THREE.Material = P.trim,
) {
  place(parent, archG(+(w + 0.5).toFixed(3), +(h + 0.4).toFixed(3), 0.16), frameMat, x, y0 - 0.05, z, false)
  place(parent, archG(w, h, 0.22), doorMat, x, y0, z, false)
  block(parent, 0.06, h * 0.86, 0.26, P.darkWood, x, y0, z, false)
  for (const side of [-1, 1]) {
    place(parent, icoG(0.07), P.gold, x + side * w * 0.12, y0 + h * 0.42, z + 0.27, false)
  }
  for (const f of [0.25, 0.6]) {
    block(parent, w * 0.92, 0.07, 0.25, P.iron, x, y0 + h * f, z, false)
  }
}

export function steps(
  parent: THREE.Object3D,
  x: number,
  z0: number,
  w: number,
  count: number,
  mat: THREE.Material,
  depth = 0.45,
  rise = 0.18,
) {
  for (let k = 0; k < count; k++) {
    block(parent, w, rise * (count - k), depth, mat, x, 0, z0 + depth / 2 + k * depth)
  }
}

export function column(
  parent: THREE.Object3D,
  x: number,
  y0: number,
  z: number,
  h: number,
  r: number,
  mat: THREE.Material,
  capMat: THREE.Material = mat,
) {
  cyl(parent, r * 1.4, r * 1.5, 0.22, capMat, x, y0, z, 8, false)
  cyl(parent, r, r * 1.1, h - 0.5, mat, x, y0 + 0.22, z, 8)
  cyl(parent, r * 1.6, r * 1.15, 0.28, capMat, x, y0 + h - 0.28, z, 8, false)
}

export function merlonsRect(
  parent: THREE.Object3D,
  w: number,
  d: number,
  y0: number,
  mat: THREE.Material,
  x = 0,
  z = 0,
  size = 0.55,
) {
  const stepX = Math.max(1, Math.floor(w / (size * 1.9)))
  const stepZ = Math.max(1, Math.floor(d / (size * 1.9)))
  for (let i = 0; i <= stepX; i++) {
    const px = x - w / 2 + (w * i) / stepX
    block(parent, size, size * 1.1, size, mat, px, y0, z - d / 2, false)
    block(parent, size, size * 1.1, size, mat, px, y0, z + d / 2, false)
  }
  for (let i = 1; i < stepZ; i++) {
    const pz = z - d / 2 + (d * i) / stepZ
    block(parent, size, size * 1.1, size, mat, x - w / 2, y0, pz, false)
    block(parent, size, size * 1.1, size, mat, x + w / 2, y0, pz, false)
  }
}

export function merlonsRing(
  parent: THREE.Object3D,
  r: number,
  y0: number,
  count: number,
  mat: THREE.Material,
  x = 0,
  z = 0,
  size = 0.5,
) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    const m = block(parent, size, size * 1.15, size * 0.8, mat, x + Math.cos(a) * r, y0, z + Math.sin(a) * r, false)
    m.rotation.y = -a
  }
}

export function banner(
  parent: THREE.Object3D,
  x: number,
  y0: number,
  z: number,
  w: number,
  h: number,
  mat: THREE.Material,
) {
  block(parent, w + 0.16, 0.12, 0.1, P.gold, x, y0 + h, z, false)
  block(parent, w, h, 0.07, mat, x, y0, z, false)
  place(parent, coneG(w / 2, 0.4, 3), mat, x, y0 - 0.2, z, false).rotation.x = Math.PI
  place(parent, icoG(0.11), P.gold, x, y0 + h * 0.55, z + 0.07, false)
}

/** ფრიალა დროშა */
export function flag(
  ctx: BuildContext,
  parent: THREE.Object3D,
  x: number,
  y0: number,
  z: number,
  h: number,
  mat: THREE.Material,
  w = 1.5,
  ht = 0.85,
) {
  cyl(parent, 0.05, 0.06, h, P.iron, x, y0, z, 6, false)
  place(parent, icoG(0.14), P.gold, x, y0 + h + 0.1, z, false)
  const pivot = group(parent, x, y0 + h - ht - 0.12, z)
  const cloth = place(pivot, boxG(w, ht, 0.06), mat, w / 2, ht / 2, 0, false)
  const tail = place(pivot, boxG(w * 0.45, ht, 0.06), mat, w + w * 0.22, ht / 2, 0, false)
  const seed = Math.random() * 6
  ctx.animate((_dt, t) => {
    pivot.rotation.y = Math.sin(t * 2.2 + seed) * 0.28
    tail.rotation.y = Math.sin(t * 3.1 + seed) * 0.4
    cloth.rotation.z = Math.sin(t * 2.6 + seed) * 0.03
  })
}

/** ჩირაღდანი კედელზე — ცეცხლი ციმციმებს, ღამით ჰალო ჩნდება */
export function torch(ctx: BuildContext, parent: THREE.Object3D, x: number, y: number, z: number) {
  const flameMat = ctx.rig.glowMaterial('flame', 0xff9a3c, 0xff6a00, 1.0, 2.6)
  block(parent, 0.14, 0.7, 0.14, P.darkWood, x, y, z, false)
  cyl(parent, 0.14, 0.09, 0.2, P.iron, x, y + 0.7, z, 6, false)
  const flame = place(parent, coneG(0.14, 0.42, 5), flameMat, x, y + 1.1, z, false)
  ctx.rig.halo(parent, x, y + 1.15, z, 2.6, 0xffa64d, 0.9, 0.05)
  const seed = Math.random() * 10
  ctx.animate((_dt, t) => {
    const s = 1 + Math.sin(t * 14 + seed) * 0.18
    flame.scale.set(s, 1 + Math.sin(t * 9 + seed) * 0.25, s)
  })
}
