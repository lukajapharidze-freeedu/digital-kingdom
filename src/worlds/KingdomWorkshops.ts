import * as THREE from 'three'
import {
  type BuildContext, P, make, block, cyl, cone, group, place, gable, shield,
  archWindow, cylinderWindow, doorArch, steps, column, merlonsRect,
  banner, flag, torch, boxG, cylG, icoG, octG, torusG, domeG, archG,
} from './KingdomKit'

// ---------------------------------------------------------
// ბაზარი — ზოლიანი ტენტები, საქონელი, სანათების გირლიანდები
// ---------------------------------------------------------
type StallTheme = 'fruit' | 'potion' | 'cloth' | 'gems'

function stall(
  ctx: BuildContext,
  parent: THREE.Object3D,
  x: number,
  z: number,
  theme: StallTheme,
  mainColor: number,
) {
  const s = group(parent, x, 0, z)
  const main = make(mainColor)
  const cream = make(0xf5ecd6)
  const lampMat = ctx.rig.glowMaterial('bulb', 0xffe6a0, 0xffc04d, 0.25, 2.3, 0.4)

  block(s, 3.5, 2.7, 0.18, P.darkWood, 0, 0, -1.3)
  block(s, 3.5, 0.95, 1.0, P.wood, 0, 0, 0.8)
  block(s, 3.7, 0.1, 1.2, P.darkWood, 0, 0.95, 0.8)

  for (const dx of [-1.75, 1.75]) {
    cyl(s, 0.07, 0.07, 2.8, P.wood, dx, 0, 1.3, 6, false)
    cyl(s, 0.07, 0.07, 3.3, P.wood, dx, 0, -1.3, 6, false)
  }

  // ზოლიანი ტენტი
  const canopy = group(s, 0, 3.1, 0)
  canopy.rotation.x = 0.2
  for (let k = 0; k < 6; k++) {
    block(canopy, 0.72, 0.12, 3.5, k % 2 ? cream : main, (k - 2.5) * 0.72, -0.06, 0)
  }
  for (let k = 0; k < 6; k++) {
    block(s, 0.72, 0.3, 0.07, k % 2 ? main : cream, (k - 2.5) * 0.72, 2.42, 1.72, false)
  }

  // ჩამოკიდებული ფარანი
  cyl(s, 0.015, 0.015, 0.45, P.iron, 0, 2.6, 0.5, 4, false)
  place(s, boxG(0.24, 0.26, 0.24), lampMat, 0, 2.45, 0.5, false)
  ctx.rig.halo(s, 0, 2.45, 0.5, 2.2, 0xffc766, 0.8, 0)

  const top = 1.05
  if (theme === 'fruit') {
    const apple = [0xd23b3b, 0x7cc243, 0xf0c13a, 0xd23b3b, 0x7cc243, 0xf0c13a].map(c => make(c))
    for (const cx of [-1.1, 0, 1.1]) {
      block(s, 0.9, 0.3, 0.6, P.wood, cx, top, 0.8, false)
      for (let j = 0; j < 6; j++) {
        place(s, icoG(0.1), apple[(j + Math.round(cx * 3)) % 6],
          cx + ((j % 3) - 1) * 0.22, top + 0.38 + (j > 2 ? 0.1 : 0), 0.8 + ((j % 2) - 0.5) * 0.22, false)
      }
    }
    block(s, 3.3, 0.08, 0.35, P.wood, 0, 1.55, -1.1, false)
    for (let j = 0; j < 5; j++) place(s, icoG(0.14), apple[j], -1.2 + j * 0.6, 1.72, -1.1, false)
  } else if (theme === 'potion') {
    const colors: [number, number][] = [[0xff5c7a, 0xff2d55], [0x58d4ff, 0x1a9ad6], [0xa9ff6a, 0x58c922]]
    for (let i = 0; i < 7; i++) {
      const [c, e] = colors[i % 3]
      const mat = ctx.rig.glowMaterial(`potion${i % 3}`, c, e, 0.18, 1.1, 0.3)
      cyl(s, 0.09, 0.09, 0.34, mat, -1.3 + i * 0.43, top, 0.8, 6, false)
      cyl(s, 0.04, 0.04, 0.14, mat, -1.3 + i * 0.43, top + 0.34, 0.8, 5, false)
      cyl(s, 0.05, 0.05, 0.05, P.wood, -1.3 + i * 0.43, top + 0.48, 0.8, 5, false)
    }
    for (const y of [1.4, 1.95]) {
      block(s, 3.3, 0.08, 0.35, P.wood, 0, y, -1.1, false)
      for (let i = 0; i < 6; i++) {
        const [c, e] = colors[(i + (y > 1.5 ? 1 : 0)) % 3]
        const mat = ctx.rig.glowMaterial(`potion${(i + (y > 1.5 ? 1 : 0)) % 3}`, c, e, 0.18, 1.1, 0.3)
        cyl(s, 0.1, 0.1, 0.3, mat, -1.3 + i * 0.52, y + 0.08, -1.1, 6, false)
      }
    }
  } else if (theme === 'cloth') {
    const cols = [0xc23d62, 0x3d7bc2, 0xe0b73a, 0x7a4fb8, 0x3fa56b]
    for (let i = 0; i < 5; i++) {
      const roll = place(s, cylG(0.17, 0.17, 0.95, 8), make(cols[i]), -1.2 + i * 0.6, top + 0.2, 0.8, false)
      roll.rotation.z = Math.PI / 2
    }
    for (let i = 0; i < 4; i++) {
      block(s, 0.38, 1.1, 0.04, make(cols[(i + 1) % 5]), -1.2 + i * 0.8, 1.55, 1.35, false)
    }
  } else {
    const gems: [number, number][] = [[0xff5c9d, 0xff2d7a], [0x6fd6ff, 0x1a9ad6], [0xa9ff6a, 0x58c922], [0xc59bff, 0x8a4dff]]
    gems.forEach(([c, e], i) => {
      const mat = ctx.rig.glowMaterial(`gem${i}`, c, e, 0.25, 1.4, 0.2)
      block(s, 0.5, 0.14, 0.4, P.deepBlue, -1.2 + i * 0.8, top, 0.8, false)
      place(s, octG(0.13), mat, -1.2 + i * 0.8, top + 0.28, 0.8, false)
    })
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) cyl(s, 0.13, 0.13, 0.04, P.gold, 1.5 - i * 0.1, top + j * 0.04, -0.3 + i * 0.3, 8, false)
    }
  }
}

function bulbString(
  ctx: BuildContext,
  parent: THREE.Object3D,
  a: [number, number, number],
  b: [number, number, number],
  count: number,
  sag: number,
) {
  const mat = ctx.rig.glowMaterial('bulb', 0xffe6a0, 0xffc04d, 0.25, 2.3, 0.4)
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count
    const px = a[0] + (b[0] - a[0]) * t
    const py = a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t)
    const pz = a[2] + (b[2] - a[2]) * t
    place(parent, icoG(0.07), mat, px, py, pz, false)
  }
}

export function buildMarket(ctx: BuildContext, parent: THREE.Object3D) {
  const g = group(parent, -26, 0, 19)
  // დახლების წინა მხარე (+z) აღმოსავლეთით, ბილიკისკენ
  g.rotation.y = Math.PI / 2

  stall(ctx, g, -3, -3, 'fruit', 0xc95743)
  stall(ctx, g, 3, -3, 'potion', 0x347ec4)
  stall(ctx, g, -3, 3, 'cloth', 0x3f9a55)
  stall(ctx, g, 3, 3, 'gems', 0xe0a93a)

  // გირლიანდები სტენდებს შორის
  bulbString(ctx, g, [-1.25, 2.75, -1.29], [1.25, 2.75, -1.29], 6, 0.3)
  bulbString(ctx, g, [-1.25, 3.45, 1.29], [1.25, 3.45, 1.29], 6, 0.3)
  bulbString(ctx, g, [-1.25, 2.75, -1.29], [-1.25, 3.45, 1.29], 6, 0.3)
  bulbString(ctx, g, [1.25, 2.75, -1.29], [1.25, 3.45, 1.29], 6, 0.3)
  for (const [x, y, z] of [[0, 2.6, -1.29], [0, 3.3, 1.29], [-1.25, 3.0, 0], [1.25, 3.0, 0]]) {
    ctx.rig.halo(g, x, y, z, 2.8, 0xffc766, 0.8, 0)
  }
  ctx.rig.light(g, 0xffc766, 0, 9, 14, 0, 3.0, 0, 0.05)

  // ბოჭკები, ყუთები, ტომრები გარშემო
  for (const [x, z] of [[-6.0, -1.5], [-6.6, -0.4], [6.1, 2.2]]) {
    cyl(g, 0.45, 0.5, 0.95, P.wood, x, 0, z, 8)
    for (const y of [0.22, 0.68]) cyl(g, 0.52, 0.52, 0.07, P.iron, x, y, z, 8, false)
  }
  block(g, 0.9, 0.9, 0.9, P.wood, 6.2, 0, -0.6)
  const top = block(g, 0.7, 0.7, 0.7, P.darkWood, 6.2, 0.9, -0.6)
  top.rotation.y = 0.5
  for (const [x, z, s] of [[6.5, 0.7, 1], [6.1, 0.2, 0.8], [-6.3, 2.0, 0.9]]) {
    const sack = place(g, icoG(0.42 * s, 1), make(0xcdb487), x, 0.38 * s, z)
    sack.scale.set(1, 1.15, 0.9)
  }
}

// ---------------------------------------------------------
// სამჭედლო — ქვა, ხის კარკასი, გახურებული ღუმელი, კვამლი, ნაპერწკლები
// ---------------------------------------------------------
export function buildForge(ctx: BuildContext, parent: THREE.Object3D) {
  const g = group(parent, 27.3, 0, 19)
  // კარი (+z) დასავლეთით, ბილიკისკენ
  g.rotation.y = -Math.PI / 2
  const forgeWindow = ctx.rig.tintedWindowMaterial('forge', 0xffb070, 0xff7a22)
  const fireMat = ctx.rig.glowMaterial('fire', 0xff7d22, 0xff4d00, 1.6, 3.2, 0.5)

  block(g, 9.6, 0.5, 7.6, P.darkStone)
  block(g, 9, 2.2, 7, P.darkStone, 0, 0.5)
  block(g, 9, 1.6, 7, P.soot, 0, 2.7)

  for (const x of [-4.5, -1.5, 1.5, 4.5]) block(g, 0.25, 1.6, 0.18, P.darkWood, x, 2.7, 3.55, false)
  for (const y of [2.65, 4.2]) {
    block(g, 9.1, 0.22, 0.2, P.darkWood, 0, y, 3.55, false)
    for (const sx of [-1, 1]) block(g, 0.2, 0.22, 7.1, P.darkWood, sx * 4.55, y, 0, false)
  }
  for (const sx of [-3, 3]) {
    place(g, boxG(0.18, 1.9, 0.16), P.darkWood, sx, 3.5, 3.56, false).rotation.z = sx > 0 ? 0.7 : -0.7
  }

  gable(g, 7.6, 9.8, 2.1, 0.35, P.slate, 0, 4.3, 0, Math.PI / 2)
  block(g, 9.9, 0.2, 0.3, P.iron, 0, 6.3, 0, false)

  // დიდი აგურის საკვამური
  block(g, 1.7, 8.8, 1.7, P.brick, 3.0, 0.5, -2.0)
  block(g, 2.2, 0.3, 2.2, P.iron, 3.0, 9.3, -2.0)
  for (let k = 0; k < 4; k++) block(g, 1.78, 0.08, 1.78, P.darkStone, 3.0, 2.2 + k * 2, -2.0, false)

  // კარი და ფანჯრები
  doorArch(g, 0, 0.5, 3.5, 1.5, 2.4, P.darkWood, P.base)
  archWindow(ctx, g, -3.4, 2.95, 3.5, 0.8, 1.1, forgeWindow, P.darkWood)
  archWindow(ctx, g, 3.9, 2.95, 3.5, 0.8, 1.1, forgeWindow, P.darkWood)
  for (const sx of [-1, 1]) {
    const wall = group(g, sx * 4.5, 0, 0)
    wall.rotation.y = sx * Math.PI / 2
    for (const z of [-1.5, 1.2]) archWindow(ctx, wall, z, 2.95, 0, 0.8, 1.1, forgeWindow, P.darkWood)
  }

  // ღუმელი: კერა, ცეცხლის პირი, მილი
  block(g, 2.6, 1.2, 1.0, P.darkStone, 2.5, 0.5, 4.0)
  block(g, 2.9, 0.18, 1.2, P.base, 2.5, 1.7, 4.0)
  place(g, archG(1.35, 1.4, 0.1), P.iron, 2.5, 0.52, 4.47, false)
  place(g, archG(0.95, 0.95, 0.12), fireMat, 2.5, 0.62, 4.5, false)
  block(g, 1.3, 3.2, 0.8, P.darkStone, 2.5, 1.7, 3.95)
  block(g, 1.6, 0.2, 1.1, P.iron, 2.5, 4.9, 3.95, false)
  ctx.rig.light(g, 0xff8a3a, 2.4, 14, 13, 2.5, 1.3, 5.1, 0.28)
  ctx.rig.halo(g, 2.5, 1.2, 4.9, 4.2, 0xff8a3a, 0.8, 0.12)

  // გახურებული ანძა: გვერდითი მაგიდა და ქვანახშირი
  for (let i = 0; i < 5; i++) {
    const coal = place(g, icoG(0.2 + (i % 3) * 0.04, 0), P.coal, 4.4 + (i % 2) * 0.35, 0.22 + (i > 2 ? 0.26 : 0), 5.0 + (i % 3) * 0.2)
    coal.rotation.set(i, i * 2, 0)
  }

  // კვერთხი და გორგალი
  cyl(g, 0.5, 0.58, 0.7, P.wood, -1.7, 0, 4.9, 8)
  const anvil = group(g, -1.7, 0.7, 4.9)
  block(anvil, 0.75, 0.18, 0.42, P.iron, 0, 0, 0)
  block(anvil, 0.42, 0.3, 0.3, P.iron, 0, 0.18, 0)
  block(anvil, 1.05, 0.22, 0.46, P.steel, 0, 0.48, 0)
  place(anvil, cylG(0.04, 0.2, 0.55, 6), P.steel, 0.78, 0.59, 0).rotation.z = -Math.PI / 2
  const hammer = group(anvil, -0.15, 0.7, 0.05)
  hammer.rotation.z = 0.2
  cyl(hammer, 0.035, 0.035, 0.62, P.wood, 0, -0.05, 0, 5, false)
  block(hammer, 0.3, 0.14, 0.14, P.iron, 0, 0.52, 0, false)

  // იარაღის თარო კედელზე
  block(g, 2.2, 0.1, 0.12, P.darkWood, -3.2, 1.0, 3.62, false)
  block(g, 2.2, 0.1, 0.12, P.darkWood, -3.2, 2.35, 3.62, false)
  for (let i = 0; i < 5; i++) {
    const x = -3.9 + i * 0.35
    block(g, 0.07, 1.05, 0.03, P.steel, x, 1.28, 3.62, false)
    block(g, 0.26, 0.05, 0.05, P.gold, x, 1.2, 3.64, false)
    block(g, 0.05, 0.2, 0.05, P.darkWood, x, 1.0, 3.62, false)
  }

  // სალესი ბორბალი
  const gs = group(g, -4.9, 0.75, 4.4)
  const wheel = place(gs, cylG(0.6, 0.6, 0.2, 14), make(0xb9b0a0), 0, 0, 0)
  wheel.rotation.x = Math.PI / 2
  for (const dz of [-0.22, 0.22]) block(g, 0.1, 0.85, 0.1, P.darkWood, -4.9, 0, 4.4 + dz, false)
  ctx.animate((dt) => {
    gs.rotation.z += dt * 0.6
  })

  // წყლის კასრი
  cyl(g, 0.5, 0.55, 0.95, P.wood, -4.3, 0, 5.7, 8)
  place(g, cylG(0.46, 0.46, 0.04, 8), make(0x3bc7f5), -4.3, 0.95, 5.7, false)
  for (const y of [0.22, 0.7]) cyl(g, 0.56, 0.56, 0.07, P.iron, -4.3, y, 5.7, 8, false)

  // კვამლი საკვამურიდან
  const puffs: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial }[] = []
  for (let i = 0; i < 8; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x8a8f99, roughness: 1, flatShading: true, transparent: true, opacity: 0, depthWrite: false,
    })
    const mesh = place(g, icoG(0.5, 0), mat, 3, 10, -2, false)
    puffs.push({ mesh, mat })
  }
  // ნაპერწკლები ანძიდან და ღუმელიდან
  const sparkMat = ctx.rig.glowMaterial('spark', 0xffc04d, 0xff8a00, 2.0, 3.5, 0.3)
  const sparks = Array.from({ length: 14 }, (_, i) => {
    const mesh = place(g, icoG(0.045), sparkMat, 0, -10, 0, false)
    return {
      mesh,
      age: -Math.random() * 3,
      life: 0.5 + Math.random() * 0.6,
      ox: i < 8 ? -1.7 : 2.5,
      oy: i < 8 ? 1.4 : 1.5,
      oz: i < 8 ? 4.9 : 4.6,
      vx: 0, vy: 0, vz: 0, x: 0, y: 0, z: 0,
    }
  })
  ctx.animate((dt, t) => {
    puffs.forEach((p, i) => {
      const a = (t * 0.32 + i / puffs.length) % 1
      p.mesh.position.set(3 + a * 2.2 + Math.sin(t + i) * 0.2, 9.7 + a * 5.5, -2 + a * 0.8)
      const sc = 0.55 + a * 1.5
      p.mesh.scale.set(sc, sc, sc)
      p.mat.opacity = 0.55 * (1 - a) * Math.min(1, a * 8)
    })
    for (const s of sparks) {
      s.age += dt
      if (s.age < 0) continue
      if (s.age > s.life) {
        s.age = -Math.random() * 2.5
        s.x = s.ox; s.y = s.oy; s.z = s.oz
        s.vx = (Math.random() - 0.5) * 1.6
        s.vy = 1.6 + Math.random() * 1.8
        s.vz = Math.random() * 1.1
        s.mesh.position.set(0, -10, 0)
        continue
      }
      if (s.age === dt) { s.x = s.ox; s.y = s.oy; s.z = s.oz }
      s.vy -= 6 * dt
      s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt
      const k = 1 - s.age / s.life
      s.mesh.position.set(s.x, s.y, s.z)
      s.mesh.scale.set(k, k, k)
    }
  })
}

// ---------------------------------------------------------
// საგანძურის საცავი — მარმარილო, ოქროს გუმბათი, მრგვალი სეიფის კარი
// ---------------------------------------------------------
export function buildTreasury(ctx: BuildContext, parent: THREE.Object3D) {
  const g = group(parent, 30, 0, -2)
  const goldWin = ctx.rig.tintedWindowMaterial('treasury', 0xd8b24a, 0xffd35e)
  const vault = make(0x39485a, { metalness: 0.3 })

  block(g, 8.2, 0.3, 8.2, P.marble)
  block(g, 7.6, 0.3, 7.6, P.marble, 0, 0.3)
  block(g, 7, 4.2, 7, P.marble, 0, 0.6)
  block(g, 7.15, 0.2, 7.15, P.gold, 0, 1.6, 0, false)
  block(g, 7.15, 0.2, 7.15, P.gold, 0, 4.4, 0, false)
  block(g, 7.5, 0.45, 7.5, P.trim, 0, 4.8)

  // კუთხის სვეტები
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      cyl(g, 0.45, 0.5, 4.2, P.marble, sx * 3.5, 0.6, sz * 3.5, 10)
      cyl(g, 0.6, 0.5, 0.3, P.gold, sx * 3.5, 4.5, sz * 3.5, 10, false)
      cyl(g, 0.55, 0.6, 0.25, P.gold, sx * 3.5, 0.6, sz * 3.5, 10, false)
    }
  }

  // ოქროს გუმბათი
  cyl(g, 3.2, 3.4, 0.8, P.marble, 0, 5.25, 0, 16)
  place(g, domeG(3.1, 20), P.gold, 0, 6.05)
  for (let i = 0; i < 4; i++) {
    const rib = place(g, torusG(3.12, 0.05, 4, 20), P.trim, 0, 6.05, 0, false)
    rib.rotation.y = (i * Math.PI) / 4
  }
  cyl(g, 0.45, 0.55, 0.9, P.gold, 0, 9.1, 0, 8, false)
  const gem = place(g, octG(0.7), ctx.rig.glowMaterial('goldgem', 0xffd35e, 0xffa000, 0.4, 1.6, 0.25), 0, 10.7, 0)
  gem.scale.set(0.85, 1.3, 0.85)
  ctx.rig.halo(g, 0, 10.7, 0, 6.5, 0xffd27a, 0.7, 0.1)
  ctx.animate((_dt, t) => {
    gem.rotation.y = t * 1.1
    gem.position.y = 10.7 + Math.sin(t * 1.5) * 0.15
  })

  // სეიფის მრგვალი კარი
  const door = group(g, 0, 2.5, 3.55)
  place(door, torusG(1.35, 0.22, 10, 28), P.gold, 0, 0, 0)
  const disc = place(door, cylG(1.3, 1.3, 0.18, 24), vault, 0, 0, 0)
  disc.rotation.x = Math.PI / 2
  const hub = place(door, cylG(0.34, 0.34, 0.3, 12), P.gold, 0, 0, 0.1, false)
  hub.rotation.x = Math.PI / 2
  for (let i = 0; i < 3; i++) {
    const spoke = block(door, 1.9, 0.12, 0.1, P.gold, 0, -0.06, 0.2, false)
    spoke.rotation.z = (i * Math.PI) / 3
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    place(door, icoG(0.07), P.gold, Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0.12, false)
  }
  steps(g, 0, 3.6, 4.6, 2, P.marble)

  // მცველების ქანდაკებები
  for (const sx of [-1, 1]) {
    const st = group(g, sx * 2.75, 0, 4.2)
    block(st, 0.8, 0.7, 0.8, P.trim)
    cyl(st, 0.26, 0.34, 1.15, P.iron, 0, 0.7, 0, 8)
    place(st, icoG(0.22), make(0xd9d3c4), 0, 2.0, 0, false)
    cone(st, 0.22, 0.3, P.gold, 0, 2.1, 0, 6)
    cyl(st, 0.03, 0.03, 2.5, P.darkWood, sx * 0.4, 0.7, 0.1, 5, false)
    cone(st, 0.07, 0.25, P.gold, sx * 0.4, 3.2, 0.1, 5)
    block(st, 0.1, 0.6, 0.45, P.deepBlue, -sx * 0.38, 1.0, 0.1, false)
  }

  // ფანჯრები გისოსებით
  for (const sx of [-1, 1]) {
    archWindow(ctx, g, sx * 2.5, 1.5, 3.5, 0.6, 1.5, goldWin, P.gold)
    for (const bx of [-0.15, 0, 0.15]) block(g, 0.03, 1.2, 0.04, P.gold, sx * 2.5 + bx, 1.55, 3.66, false)
  }
  for (const side of [-1, 1]) {
    const wall = group(g, side * 3.5, 0, 0)
    wall.rotation.y = side * Math.PI / 2
    for (const z of [-1.5, 1.5]) archWindow(ctx, wall, z, 1.5, 0, 0.6, 1.5, goldWin, P.gold)
  }

  // ოქრო: მონეტების გროვა და სკივრი
  for (let i = 0; i < 4; i++) {
    cyl(g, 0.55 - i * 0.1, 0.55 - i * 0.1, 0.12, P.gold, -4.1, i * 0.12, 4.3, 10, false)
  }
  for (let i = 0; i < 6; i++) {
    cyl(g, 0.12, 0.12, 0.03, P.gold, -4.5 + (i % 3) * 0.3, 0.02 + (i > 3 ? 0.03 : 0), 4.9 + (i % 2) * 0.25, 8, false)
  }
  block(g, 1.0, 0.5, 0.6, P.wood, 4.2, 0, 4.4)
  const lid = place(g, cylG(0.3, 0.3, 1.0, 10), P.wood, 4.2, 0.5, 4.4)
  lid.rotation.z = Math.PI / 2
  block(g, 1.04, 0.1, 0.64, P.gold, 4.2, 0.25, 4.4, false)
  place(g, icoG(0.08), P.gold, 4.2, 0.55, 4.72, false)
  ctx.rig.light(g, 0xffd27a, 0, 8, 12, 0, 4.0, 4.9, 0.05)
}

// ---------------------------------------------------------
// შესასვლელი კარიბჭე — ქვის თაღი და ორი კოშკი
// ---------------------------------------------------------
export function buildGate(ctx: BuildContext, parent: THREE.Object3D) {
  const g = group(parent, 0, 0, 37)

  for (const sx of [-5.5, 5.5]) {
    const t = group(g, sx, 0, 0)
    cyl(t, 1.9, 2.0, 0.6, P.base, 0, 0, 0, 10)
    cyl(t, 1.5, 1.65, 5.6, P.stone, 0, 0.6, 0, 10)
    cyl(t, 2.05, 1.6, 0.5, P.trim, 0, 6.2, 0, 10)
    cone(t, 2.3, 3.0, P.blue, 0, 6.7, 0, 10)
    place(t, icoG(0.18), P.gold, 0, 9.85, 0, false)
    for (const y of [2.4, 4.4]) {
      cylinderWindow(ctx, t, 0, 0, 1.58 * 0.951, Math.PI / 2, y, 0.45, 1.2)
    }
    flag(ctx, t, 0, 9.95, 0, 2.0, make(sx < 0 ? 0x4789d0 : 0xf1ba43), 1.2, 0.7)
  }

  // თაღოვანი კარიბჭე
  const s = new THREE.Shape()
  s.moveTo(-3.8, 0)
  s.lineTo(-3.8, 8.0)
  s.lineTo(3.8, 8.0)
  s.lineTo(3.8, 0)
  s.lineTo(2.4, 0)
  s.lineTo(2.4, 3.9)
  s.absarc(0, 3.9, 2.4, 0, Math.PI, false)
  s.lineTo(-2.4, 0)
  s.closePath()
  const geo = new THREE.ExtrudeGeometry(s, { depth: 1.4, bevelEnabled: false })
  geo.translate(0, 0, -0.7)
  place(g, geo, P.stone, 0, 0, 0)
  block(g, 7.9, 0.3, 1.6, P.trim, 0, 8.0)
  merlonsRect(g, 7.6, 1.4, 8.3, P.stone)
  shield(g, 0, 7.25, 0.72, 0.8, P.deepBlue)
  for (const x of [-3.1, 3.1]) torch(ctx, g, x, 2.4, 0.82)
  banner(g, -3.1, 4.4, 0.78, 0.8, 2.2, P.blue)
  banner(g, 3.1, 4.4, 0.78, 0.8, 2.2, P.blue)

  // თაღიდან ჩამოკიდებული ფარანი
  const lamp = ctx.rig.glowMaterial('lantern', 0xffdc83, 0xffba48, 0.35, 2.6, 0.4)
  cyl(g, 0.02, 0.02, 0.6, P.iron, 0, 5.4, 0, 4, false)
  place(g, boxG(0.34, 0.4, 0.34), lamp, 0, 5.1, 0, false)
  ctx.rig.halo(g, 0, 5.1, 0, 3.4, 0xffc766, 0.85, 0)

  // ბილიკის სვეტები
  for (const sx of [-1, 1]) {
    column(g, sx * 2.9, 0, 1.2, 1.1, 0.22, P.marble, P.gold)
  }
}
