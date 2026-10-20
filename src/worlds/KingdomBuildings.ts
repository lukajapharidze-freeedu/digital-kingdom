import * as THREE from 'three'
import { createSchoolLogoMesh } from '../assets/schoolLogo'
import {
  type BuildContext, P, make, block, cyl, cone, group, place, gable,
  archWindow, cylinderWindow, doorArch, steps, column, merlonsRect,
  banner, flag, torch, cylG, coneG, icoG, octG, torusG, domeG,
} from './KingdomKit'

/* =========================================================
 * ხელმისაწვდომი პროფილები: ყველა შენობა თავის ადგილზე დგას
 * (იგივე ფართით, რაც კოლაიდერებში არის), წინა მხარე — +z
 * ========================================================= */

// ---------------------------------------------------------
// სამეფო ციხესიმაგრე
// ---------------------------------------------------------
export function buildCastle(ctx: BuildContext, parent: THREE.Object3D) {
  const g = group(parent, 0, 0, -32)
  const roofMat = P.blue
  const gold = P.gold

  // ძირი და კედლები
  block(g, 14, 0.7, 8, P.base)
  block(g, 13, 7.3, 7, P.stone, 0, 0.7)
  block(g, 13.2, 0.25, 7.2, P.trim, 0, 4.3)
  block(g, 13.4, 0.35, 7.4, P.trim, 0, 8.0)
  merlonsRect(g, 13.2, 7.2, 8.35, P.stone)

  // ბრტყელი კარიბჭის სახურავი კრენელაციის უკან
  const hip = place(g, coneG(7.2, 2.4, 4), roofMat, 0, 8.35 + 1.2, 0)
  hip.rotation.y = Math.PI / 4
  hip.scale.set(1.25, 1, 0.68)

  // მთავარი შესასვლელი: თაღი, ღია ბადე, ფარი, საფეხურები
  doorArch(g, 0, 0.7, 3.5, 3.0, 4.2, P.darkWood, P.trim)
  for (let i = -3; i <= 3; i++) {
    cyl(g, 0.05, 0.05, 2.1, P.iron, i * 0.38, 2.9, 3.66, 5, false)
  }
  for (const y of [3.4, 4.1, 4.8]) block(g, 3.0, 0.08, 0.1, P.iron, 0, y, 3.67, false)
  // სკოლის ლოგო შესასვლელის ზემოთ
  const logo = createSchoolLogoMesh(2.2)
  logo.position.set(0, 6.55, 3.56)
  g.add(logo)
  steps(g, 0, 3.6, 5.2, 3, P.base)

  for (const x of [-2.1, 2.1]) torch(ctx, g, x, 2.3, 3.68)
  banner(g, -2.2, 3.7, 3.58, 0.9, 2.7, P.blue)
  banner(g, 2.2, 3.7, 3.58, 0.9, 2.7, P.blue)

  // ფანჯრები
  for (const x of [-4.0, -5.7, 4.0, 5.7]) archWindow(ctx, g, x, 1.5, 3.5, 0.9, 1.9)
  for (const x of [-3.2, -5.0, 3.2, 5.0]) archWindow(ctx, g, x, 5.0, 3.5, 0.8, 1.7)

  // გვერდითი კოშკები
  for (const sx of [-8, 8]) {
    const t = group(g, sx, 0, 0)
    cyl(t, 2.45, 2.55, 0.8, P.base, 0, 0, 0, 10)
    cyl(t, 2.0, 2.2, 10, P.stone, 0, 0.8, 0, 10)
    cyl(t, 2.28, 2.28, 0.28, P.trim, 0, 4.0, 0, 10, false)
    cyl(t, 2.18, 2.18, 0.28, P.trim, 0, 8.0, 0, 10, false)
    cyl(t, 2.65, 2.15, 0.75, P.trim, 0, 10.8, 0, 10)
    cone(t, 2.95, 3.7, roofMat, 0, 11.55, 0, 10)
    place(t, icoG(0.2), gold, 0, 15.45, 0, false)
    for (const y of [3.0, 6.5, 9.2]) {
      const r = 2.2 - (y - 0.8) * 0.02
      cylinderWindow(ctx, t, 0, 0, r * 0.951, Math.PI / 2, y, 0.5, 1.4)
      cylinderWindow(ctx, t, 0, 0, r * 0.951, sx < 0 ? Math.PI : 0, y, 0.5, 1.4)
    }
    flag(ctx, t, 0, 15.55, 0, 2.4, make(sx < 0 ? 0x4789d0 : 0xf1ba43), 1.3, 0.75)
  }

  // ზურგის მაღალი მთავარი კოშკი
  const k = group(g, 0, 0, -2)
  cyl(k, 2.8, 2.9, 0.8, P.base, 0, 0, 0, 10)
  cyl(k, 2.2, 2.5, 12, P.stone, 0, 0.8, 0, 10)
  cyl(k, 2.6, 2.6, 0.3, P.trim, 0, 6.0, 0, 10, false)
  cyl(k, 3.0, 2.3, 0.85, P.trim, 0, 12.8, 0, 10)
  cone(k, 3.3, 5.2, P.deepBlue, 0, 13.65, 0, 10)
  place(k, icoG(0.28), gold, 0, 19.0, 0, false)
  for (const y of [9.6, 11.0]) {
    cylinderWindow(ctx, k, 0, 0, 2.3 * 0.951, Math.PI / 2, y, 0.6, 1.1)
  }
  flag(ctx, k, 0, 19.1, 0, 3.0, make(0xf1ba43), 1.7, 1.0)

  // ღამის თბილი შუქი შესასვლელთან
  ctx.rig.light(g, 0xffc57a, 0, 8, 16, 0, 3.6, 6.2, 0.1)
}

// ---------------------------------------------------------
// ცოდნის კოშკი — ჯადოსნური მრავალსართულიანი ობსერვატორია
// ---------------------------------------------------------
export function buildKnowledgeTower(ctx: BuildContext, parent: THREE.Object3D) {
  const g = group(parent, -29, 0, -17)
  const radiusAt = (y: number) => 2.8 - ((y - 0.5) / 9.6) * 0.65

  cyl(g, 3.5, 3.7, 0.5, P.base, 0, 0, 0, 10)
  cyl(g, 2.15, 2.8, 9.6, P.stone, 0, 0.5, 0, 10)
  for (const y of [3.2, 6.4]) cyl(g, radiusAt(y) + 0.12, radiusAt(y) + 0.12, 0.22, P.trim, 0, y, 0, 10, false)

  doorArch(g, 0, 0.5, radiusAt(1) * 0.951 - 0.04, 1.4, 2.4, P.purple, P.trim)

  // გარე სპირალური კიბე
  for (let i = 0; i < 24; i++) {
    const y = 0.8 + i * 0.36
    const a = Math.PI / 2 + 0.95 + i * 0.36
    const r = radiusAt(y) + 0.5
    const step = block(g, 1.05, 0.14, 0.62, P.trim, Math.cos(a) * r, y, Math.sin(a) * r, false)
    step.rotation.y = -a
    if (i % 3 === 0) {
      cyl(g, 0.04, 0.04, 0.75, P.iron, Math.cos(a) * (r + 0.45), y + 0.14, Math.sin(a) * (r + 0.45), 5, false)
    }
  }

  // სასეირნო გალერეა
  cyl(g, 3.05, 2.85, 0.35, P.trim, 0, 10.1, 0, 10)
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    cyl(g, 0.05, 0.05, 0.85, P.iron, Math.cos(a) * 2.85, 10.45, Math.sin(a) * 2.85, 5, false)
  }
  const rail = place(g, torusG(2.85, 0.06, 5, 28), P.iron, 0, 11.3, 0, false)
  rail.rotation.x = Math.PI / 2

  // ზედა ობსერვატორია
  cyl(g, 1.7, 1.9, 2.4, P.stone, 0, 10.45, 0, 10)
  for (const a of [Math.PI / 2, Math.PI / 2 - 1.05, Math.PI / 2 + 1.05, -Math.PI / 2]) {
    cylinderWindow(ctx, g, 0, 0, 1.85 * 0.951, a, 11.0, 0.7, 1.3, ctx.rig.tintedWindowMaterial('mage', 0x9fb8ff, 0x7aa2ff))
  }
  cone(g, 2.5, 3.6, P.purple, 0, 12.85, 0, 10)
  place(g, octG(0.3), P.gold, 0, 16.7, 0, false)

  // ტელესკოპი გალერეაზე
  const scope = place(g, cylG(0.17, 0.22, 1.5, 7), P.iron, -1.7, 11.3, 1.5)
  scope.rotation.set(-0.9, 0.5, 0)
  cyl(g, 0.05, 0.05, 1.0, P.darkWood, -1.7, 10.45, 1.5, 5, false)

  // მოლივლივე კრისტალი რგოლებით
  const crystalMat = ctx.rig.glowMaterial('crystal', 0x6fd6ff, 0x1a9ad6, 0.55, 2.4, 0.25)
  const crystal = place(g, octG(1.15), crystalMat, 0, 19.2, 0)
  crystal.scale.set(0.85, 1.25, 0.85)
  const ringA = place(g, torusG(1.9, 0.06, 5, 32), P.gold, 0, 19.2, 0, false)
  const ringB = place(g, torusG(2.35, 0.05, 5, 32), P.iron, 0, 19.2, 0, false)
  ctx.rig.halo(g, 0, 19.2, 0, 8, 0x6fd6ff, 0.8, 0.08)
  ctx.rig.light(g, 0x6fd6ff, 0.5, 10, 24, 0, 18.6, 0, 0.08)
  ctx.animate((_dt, t) => {
    crystal.rotation.y = t * 0.9
    crystal.position.y = 19.2 + Math.sin(t * 1.3) * 0.28
    ringA.position.y = ringB.position.y = crystal.position.y
    ringA.rotation.set(t * 0.6, t * 0.4, 0.4)
    ringB.rotation.set(-t * 0.35, 0.6, t * 0.5)
  })

  // მაგიური წრე ზემოთ ბილიკზე
  const runeMat = ctx.rig.glowMaterial('rune', 0x7be3ff, 0x39c5ff, 0.4, 2.2, 0.4)
  for (const r of [4.2, 3.4]) {
    const ring = place(g, torusG(r, 0.07, 4, 48), runeMat, 0, 0.11, 0, false)
    ring.rotation.x = Math.PI / 2
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const rune = block(g, 0.34, 0.05, 0.34, runeMat, Math.cos(a) * 3.8, 0.08, Math.sin(a) * 3.8, false)
    rune.rotation.y = -a + Math.PI / 4
  }
}

// ---------------------------------------------------------
// აკადემია — კლასიკური პორტიკი, საათის კოშკი, ორი კოშკი
// ---------------------------------------------------------
export function buildAcademy(ctx: BuildContext, parent: THREE.Object3D) {
  const g = group(parent, -21, 0, -21)

  block(g, 8.6, 0.5, 7.6, P.base)
  block(g, 8, 5.0, 7, P.cream, 0, 0.5)
  block(g, 8.5, 0.35, 7.5, P.trim, 0, 5.5)
  gable(g, 7.6, 8.6, 2.0, 0.35, P.deepBlue, 0, 5.85, 0, Math.PI / 2)
  block(g, 8.9, 0.14, 0.3, P.gold, 0, 7.8, 0, false)

  // პორტიკი
  block(g, 7.4, 0.5, 1.7, P.trim, 0, 0, 4.35)
  for (const x of [-2.7, -0.9, 0.9, 2.7]) column(g, x, 0.5, 4.4, 4.5, 0.3, P.marble, P.trim)
  block(g, 7.8, 0.55, 1.95, P.cream, 0, 5.0, 4.3)
  gable(g, 7.8, 1.95, 1.15, 0.05, P.cream, 0, 5.55, 4.3)
  const emblem = place(g, cylG(0.5, 0.5, 0.12, 20), P.gold, 0, 6.05, 5.3, false)
  emblem.rotation.x = Math.PI / 2
  block(g, 0.5, 0.35, 0.1, P.deepBlue, 0, 5.88, 5.38, false)

  doorArch(g, 0, 0.5, 3.5, 1.6, 2.9, P.wood, P.trim)
  for (const x of [-1.8, 1.8, -3.5, 3.5]) archWindow(ctx, g, x, 1.3, 3.5, 0.85, 2.0)
  for (const x of [-1.8, 0, 1.8, -3.5, 3.5]) archWindow(ctx, g, x, 3.5, 3.5, 0.7, 1.2)

  // გვერდითი ფანჯრები
  for (const side of [-1, 1]) {
    const wall = group(g, side * 4.0, 0, 0)
    wall.rotation.y = side * Math.PI / 2
    for (const z of [-2, 0, 2]) archWindow(ctx, wall, z, 1.6, 0, 0.8, 2.1)
    for (const z of [-2, 0, 2]) archWindow(ctx, wall, z, 3.9, 0, 0.7, 1.1)
  }

  // საათის კოშკი
  block(g, 2.4, 3.6, 2.4, P.cream, 0, 5.85, -0.6)
  block(g, 2.7, 0.3, 2.7, P.trim, 0, 9.45, -0.6)
  const clock = group(g, 0, 8.0, 0.62)
  const face = place(clock, cylG(0.8, 0.8, 0.1, 24), P.white, 0, 0, 0, false)
  face.rotation.x = Math.PI / 2
  const rim = place(clock, torusG(0.82, 0.07, 5, 24), P.gold, 0, 0, 0.03, false)
  rim.scale.set(1, 1, 1)
  const hourHand = block(clock, 0.08, 0.45, 0.04, P.darkWood, 0, 0, 0.08, false)
  const minuteHand = block(clock, 0.05, 0.65, 0.04, P.darkWood, 0, 0, 0.1, false)
  ctx.animate((_dt, t) => {
    minuteHand.rotation.z = -t * 0.12
    hourHand.rotation.z = -t * 0.01
  })
  for (const side of [-1, 1]) {
    const bell = group(g, side * 1.21, 0, -0.6)
    bell.rotation.y = side * Math.PI / 2
    archWindow(ctx, bell, 0, 6.2, 0, 0.7, 1.5)
  }
  cone(g, 2.05, 2.6, P.deepBlue, 0, 9.75, -0.6, 4).rotation.y = Math.PI / 4
  place(g, icoG(0.17), P.gold, 0, 12.5, -0.6, false)

  // კუთხის კოშკები
  for (const sx of [-4, 4]) {
    const t = group(g, sx, 0, -2)
    cyl(t, 1.5, 1.55, 0.5, P.base, 0, 0, 0, 8)
    cyl(t, 1.15, 1.3, 6.5, P.cream, 0, 0.5, 0, 8)
    cyl(t, 1.55, 1.2, 0.5, P.trim, 0, 7.0, 0, 8)
    cone(t, 1.8, 2.7, P.blue, 0, 7.5, 0, 8)
    for (const y of [3.4, 5.3]) {
      cylinderWindow(ctx, t, 0, 0, 1.2 * 0.924, sx < 0 ? Math.PI : 0, y, 0.45, 1.1)
    }
    cylinderWindow(ctx, t, 0, 0, 1.2 * 0.924, Math.PI / 2, 6.1, 0.45, 0.8)
    flag(ctx, t, 0, 10.2, 0, 1.7, make(0xf1ba43), 1.1, 0.65)
  }
}

// ---------------------------------------------------------
// ბიბლიოთეკა — წიგნის ზურგებით მორთული ფასადი, სპილენძის კუპოლი
// ---------------------------------------------------------
export function buildLibrary(ctx: BuildContext, parent: THREE.Object3D) {
  const g = group(parent, 23, 0, -19)
  const warm = make(0xecd7b0)
  const libWindow = ctx.rig.tintedWindowMaterial('library', 0xe9c07a, 0xffa530)

  block(g, 9.6, 0.5, 7.6, P.base)
  block(g, 9, 4.5, 7, warm, 0, 0.5)

  // წიგნის ზურგების ფრიზი
  const spines = [0xb23a3a, 0x2f7a4a, 0x2b5f9e, 0xd9a43b, 0x6a4aa8, 0x2a8a8a].map(c => make(c))
  for (let i = 0; i < 26; i++) {
    const h = 0.5 + ((i * 7) % 5) * 0.06
    block(g, 0.26, h, 0.14, spines[i % spines.length], -4.0 + i * 0.32, 4.3, 3.55, false)
  }
  block(g, 9.2, 0.12, 0.3, P.gold, 0, 4.22, 3.55, false)

  // წინა ფრონტონი წითელი სახურავით
  gable(g, 9.4, 7.6, 2.8, 0.3, P.red, 0, 5.0, 0)
  gable(g, 9.0, 0.15, 2.7, 0, warm, 0, 5.0, 3.85)
  block(g, 0.3, 0.22, 8.0, P.gold, 0, 7.75, 0, false)
  const rose = place(g, cylG(0.75, 0.75, 0.12, 18), ctx.rig.windowMaterial(), 0, 6.3, 3.9, false)
  rose.rotation.x = Math.PI / 2
  const roseRing = place(g, torusG(0.78, 0.07, 5, 24), P.gold, 0, 6.3, 3.93, false)
  roseRing.rotation.z = 0
  for (const rot of [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4]) {
    const spoke = block(g, 1.5, 0.05, 0.05, P.darkWood, 0, 6.28, 3.98, false)
    spoke.rotation.z = rot
  }
  ctx.rig.halo(g, 0, 6.3, 4.4, 4.2, 0xffb24a, 0.7, 0)

  // შესასვლელი: ოქროს ჩარჩო, ორფრთიანი კარი, ნახევარსვეტები
  doorArch(g, 0, 0.5, 3.5, 2.4, 3.3, P.darkWood, P.gold)
  for (const x of [-2.0, 2.0]) column(g, x, 0.5, 3.75, 4.3, 0.24, P.marble, P.gold)
  steps(g, 0, 3.6, 4.2, 2, P.base)
  for (const x of [-3.4, 3.4]) archWindow(ctx, g, x, 1.3, 3.5, 0.95, 2.5, libWindow, P.gold)

  for (const side of [-1, 1]) {
    const wall = group(g, side * 4.5, 0, 0)
    wall.rotation.y = side * Math.PI / 2
    for (const z of [-2, 0, 2]) archWindow(ctx, wall, z, 1.4, 0, 0.9, 2.5, libWindow)
  }

  // სახურავზე გაშლილი წიგნი
  const book = group(g, 0, 7.95, 2.3)
  block(book, 2.9, 0.1, 1.9, P.red, 0, 0, 0, false)
  for (const side of [-1, 1]) {
    const page = block(book, 1.35, 0.1, 1.7, make(0xfff6dd), side * 0.7, 0.12, 0, false)
    page.rotation.z = -side * 0.3
  }
  block(book, 0.12, 0.3, 1.9, P.gold, 0, 0.0, 0, false)

  // სპილენძის კუპოლი ქედზე
  cyl(g, 1.2, 1.35, 1.6, warm, 0, 7.0, -1.8, 12)
  place(g, domeG(1.4, 14), P.copper, 0, 8.6, -1.8)
  cyl(g, 0.22, 0.3, 0.6, P.gold, 0, 9.95, -1.8, 6, false)
  place(g, icoG(0.22), P.gold, 0, 10.7, -1.8, false)

  // წიგნის გროვები და სურო
  for (const side of [-1, 1]) {
    const stack = group(g, side * 3.6, 0, 4.6)
    const cols = [0xb23a3a, 0x2b5f9e, 0x2f7a4a, 0xd9a43b]
    cols.forEach((c, i) => {
      const b = block(stack, 0.95 - i * 0.08, 0.2, 0.65, make(c), 0, i * 0.2, 0, false)
      b.rotation.y = (i - 1.5) * 0.25 * side
    })
  }
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9
    const blob = place(g, icoG(0.32 + (i % 3) * 0.05), P.leaf, alt(i) * 4.4, 0.6 + (i % 4) * 0.8, 3.0 + Math.cos(a) * 0.3, false)
    blob.scale.set(1, 0.9, 0.8)
  }
}

function alt(i: number): number {
  return i % 2 === 0 ? -1 : 1
}

