import * as THREE from 'three'
import { getGlowTexture } from './KingdomNight'

/**
 * დღე / საღამო / ღამის ციკლი.
 *
 * რას აკეთებს:
 *  - ცის გრადიენტი, მზე, მთვარე, ვარსკვლავები, ღრუბლები, ციცინათელები;
 *  - აკონტროლებს შენს არსებულ მთავარ შუქს (sun) და გარემოს შუქს (ambient);
 *  - თუ სცენას აქვს fog / background — მათ ფერსაც ცას უხამებს;
 *  - world.setNightLevel(n)-ს ყოველ კადრზე აწვდის, რომ ფანჯრები და ფარნები აინთოს.
 *
 * გამოყენება:
 *   const cycle = new DayNightCycle({ scene, sun, ambient, camera, world: kingdom })
 *   // თამაშის ციკლში:
 *   cycle.update(dt); kingdom.update(dt)
 */

export type DayPhase = 'dawn' | 'day' | 'evening' | 'night'

export interface DayNightOptions {
  scene: THREE.Scene
  /** არსებული მთავარი მიმართული შუქი, რომელიც ახლა მზეს ასრულებს */
  sun: THREE.DirectionalLight
  /** არსებული გარემოს შუქი (AmbientLight ან HemisphereLight) */
  ambient?: THREE.AmbientLight | THREE.HemisphereLight
  /** კამერა — ცა და ვარსკვლავები მას მიჰყვება */
  camera?: THREE.Camera
  /** სამეფო (setNightLevel-ის მქონე ობიექტი) */
  world?: { setNightLevel(level: number): void }
  /** საწყისი საათი 0–24 (ნაგულისხმევი 10:00) */
  startHour?: number
  /** რეალურ წამებში რამდენ ხანს გრძელდება ერთი სრული დღე (ნაგულისხმევი 240) */
  dayLengthSeconds?: number
  /** კუნძულის ცენტრი ღრუბლებისა და ციცინათელებისთვის */
  center?: THREE.Vector3
  /** ციცინათელების რადიუსი */
  fireflyRadius?: number
  onPhaseChange?: (phase: DayPhase) => void
}

interface SkyKey {
  h: number
  top: number
  horizon: number
}

const SKY_KEYS: SkyKey[] = [
  { h: 0, top: 0x050818, horizon: 0x141c44 },
  { h: 4.5, top: 0x070b20, horizon: 0x1b2550 },
  { h: 5.5, top: 0x1f2d63, horizon: 0xff8f6a },
  { h: 6.6, top: 0x4b7fd0, horizon: 0xffc08a },
  { h: 8, top: 0x4a9be8, horizon: 0xbfe6ff },
  { h: 16.5, top: 0x4a9be8, horizon: 0xbfe6ff },
  { h: 17.8, top: 0x5b86d4, horizon: 0xffd9a0 },
  { h: 18.6, top: 0x4a4a9a, horizon: 0xff7a4a },
  { h: 19.4, top: 0x252a66, horizon: 0xb85a82 },
  { h: 20.5, top: 0x0b1030, horizon: 0x25306a },
  { h: 21.5, top: 0x050818, horizon: 0x141c44 },
  { h: 24, top: 0x050818, horizon: 0x141c44 },
]

const { clamp, lerp, smoothstep } = THREE.MathUtils

function makeMoonTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const ctx = c.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(54, 54, 6, 64, 64, 56)
    g.addColorStop(0, '#fffdf2')
    g.addColorStop(1, '#d9dff2')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(64, 64, 52, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(150,160,190,0.35)'
    for (const [x, y, r] of [[48, 50, 11], [76, 70, 14], [62, 38, 7], [82, 44, 6], [46, 80, 8]]) {
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export class DayNightCycle {
  /** მიმდინარე საათი 0–24 */
  hour: number
  dayLengthSeconds: number
  paused = false

  private readonly scene: THREE.Scene
  private readonly sun: THREE.DirectionalLight
  private readonly ambient?: THREE.AmbientLight | THREE.HemisphereLight
  private readonly camera?: THREE.Camera
  private readonly world?: { setNightLevel(level: number): void }
  private readonly onPhaseChange?: (phase: DayPhase) => void

  private readonly sunBaseIntensity: number
  private readonly lightDistance: number
  private readonly ambientBaseIntensity: number
  private readonly ambientBaseColor = new THREE.Color()
  private readonly ambientBaseGround = new THREE.Color()

  private readonly root = new THREE.Group()
  private readonly dome: THREE.Mesh
  private readonly domeColors: THREE.BufferAttribute
  private readonly domePositions: THREE.BufferAttribute
  private readonly skyRadius = 380
  private readonly stars: THREE.Points
  private readonly sunGlow: THREE.Sprite
  private readonly sunCore: THREE.Sprite
  private readonly moon: THREE.Sprite
  private readonly moonGlow: THREE.Sprite
  private readonly cloudMat: THREE.MeshBasicMaterial
  private readonly clouds: { group: THREE.Group; radius: number; angle: number; speed: number; y: number }[] = []
  private readonly fireflies: THREE.Points
  private readonly fireflyData: { x: number; z: number; phase: number; speed: number }[] = []
  private readonly center: THREE.Vector3

  private time = 0
  private level = 0
  private enabled = true
  private readonly snapshot: {
    sunPos: THREE.Vector3
    sunIntensity: number
    sunColor: THREE.Color
    ambColor: THREE.Color | null
    ambGround: THREE.Color | null
    fog: THREE.Color | null
    bg: THREE.Color | null
  }
  private currentPhase: DayPhase = 'day'

  // მუშა ცვლადები (ყოველ კადრზე ახალი ობიექტები რომ არ შეიქმნას)
  private readonly cTop = new THREE.Color()
  private readonly cHorizon = new THREE.Color()
  private readonly cTmpA = new THREE.Color()
  private readonly cTmpB = new THREE.Color()
  private readonly vSun = new THREE.Vector3()
  private readonly vMoon = new THREE.Vector3()
  private readonly vDir = new THREE.Vector3()
  private readonly vCam = new THREE.Vector3()

  constructor(opts: DayNightOptions) {
    this.scene = opts.scene
    this.sun = opts.sun
    this.ambient = opts.ambient
    this.camera = opts.camera
    this.world = opts.world
    this.onPhaseChange = opts.onPhaseChange
    this.hour = ((opts.startHour ?? 10) % 24 + 24) % 24
    this.dayLengthSeconds = opts.dayLengthSeconds ?? 240
    this.center = opts.center ? opts.center.clone() : new THREE.Vector3(0, 0, 0)

    // არსებული შუქების საბაზისო (დღის) მნიშვნელობები ვიმახსოვრებთ
    this.sunBaseIntensity = this.sun.intensity
    this.lightDistance = Math.max(10, this.sun.position.distanceTo(this.sun.target.position))
    this.ambientBaseIntensity = this.ambient ? this.ambient.intensity : 1
    if (this.ambient) {
      this.ambientBaseColor.copy(this.ambient.color)
      const hemi = this.ambient as THREE.HemisphereLight
      if (hemi.groundColor) this.ambientBaseGround.copy(hemi.groundColor)
    }

    // საწყისი (ცვლილებამდე) მდგომარეობა — ციკლის გამორთვისას აქ ვბრუნდებით
    const fog0 = this.scene.fog as THREE.Fog | null
    const bg0 = this.scene.background as THREE.Color | null
    this.snapshot = {
      sunPos: this.sun.position.clone(),
      sunIntensity: this.sun.intensity,
      sunColor: this.sun.color.clone(),
      ambColor: this.ambient ? this.ambient.color.clone() : null,
      ambGround: this.ambient && (this.ambient as THREE.HemisphereLight).groundColor
        ? (this.ambient as THREE.HemisphereLight).groundColor.clone()
        : null,
      fog: fog0 ? fog0.color.clone() : null,
      bg: bg0 && bg0.isColor ? bg0.clone() : null,
    }

    this.scene.add(this.root)

    // ცის გუმბათი (წვეროების ფერები ყოველ კადრზე იცვლება)
    const domeGeo = new THREE.SphereGeometry(this.skyRadius, 24, 16)
    this.domePositions = domeGeo.getAttribute('position') as THREE.BufferAttribute
    this.domeColors = new THREE.BufferAttribute(new Float32Array(this.domePositions.count * 3), 3)
    domeGeo.setAttribute('color', this.domeColors)
    this.dome = new THREE.Mesh(
      domeGeo,
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    )
    this.dome.renderOrder = -10
    this.dome.frustumCulled = false
    this.root.add(this.dome)

    // ვარსკვლავები
    const starCount = 700
    const starPos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const u = Math.random()
      const v = Math.random()
      const theta = u * Math.PI * 2
      const y = 0.05 + v * 0.95
      const r = Math.sqrt(1 - y * y)
      starPos[i * 3] = Math.cos(theta) * r * 360
      starPos[i * 3 + 1] = y * 360
      starPos[i * 3 + 2] = Math.sin(theta) * r * 360
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    this.stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.8,
        sizeAttenuation: false,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        fog: false,
      }),
    )
    this.stars.frustumCulled = false
    this.stars.renderOrder = -9
    this.root.add(this.stars)

    // მზე და მთვარე
    const glow = getGlowTexture()
    const spriteMat = (map: THREE.Texture, color: number, additive: boolean) =>
      new THREE.SpriteMaterial({
        map,
        color,
        transparent: true,
        depthWrite: false,
        fog: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      })
    this.sunGlow = new THREE.Sprite(spriteMat(glow, 0xffd27a, true))
    this.sunGlow.scale.set(150, 150, 1)
    this.sunCore = new THREE.Sprite(spriteMat(glow, 0xfff4d6, true))
    this.sunCore.scale.set(44, 44, 1)
    this.moonGlow = new THREE.Sprite(spriteMat(glow, 0x8ea8ff, true))
    this.moonGlow.scale.set(120, 120, 1)
    this.moon = new THREE.Sprite(spriteMat(makeMoonTexture(), 0xffffff, false))
    this.moon.scale.set(34, 34, 1)
    for (const s of [this.sunGlow, this.sunCore, this.moonGlow, this.moon]) {
      s.renderOrder = -8
      this.root.add(s)
    }

    // ღრუბლები (ლოუ-პოლი)
    this.cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })
    const blob = new THREE.IcosahedronGeometry(1, 0)
    for (let i = 0; i < 16; i++) {
      const g = new THREE.Group()
      const parts = 3 + (i % 3)
      for (let k = 0; k < parts; k++) {
        const m = new THREE.Mesh(blob, this.cloudMat)
        const s = 4 + Math.random() * 4
        m.scale.set(s * 1.5, s * 0.8, s)
        m.position.set((k - parts / 2) * 5.2 + Math.random() * 2, Math.random() * 1.5, Math.random() * 3)
        g.add(m)
      }
      const below = i % 4 === 3
      this.clouds.push({
        group: g,
        radius: 85 + Math.random() * 60,
        angle: Math.random() * Math.PI * 2,
        speed: (0.006 + Math.random() * 0.01) * (i % 2 ? 1 : -1),
        y: below ? -30 + Math.random() * 18 : 18 + Math.random() * 32,
      })
      this.root.add(g)
    }

    // ციცინათელები
    const fCount = 80
    const fRadius = opts.fireflyRadius ?? 38
    const fPos = new Float32Array(fCount * 3)
    for (let i = 0; i < fCount; i++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * fRadius
      this.fireflyData.push({
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        phase: Math.random() * 10,
        speed: 0.4 + Math.random() * 0.6,
      })
    }
    const fGeo = new THREE.BufferGeometry()
    fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3))
    this.fireflies = new THREE.Points(
      fGeo,
      new THREE.PointsMaterial({
        map: glow,
        color: 0xd9ff7a,
        size: 0.9,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    this.fireflies.frustumCulled = false
    this.root.add(this.fireflies)

    this.apply(0)
  }

  /** ამჟამინდელი ღამის დონე 0..1 */
  get nightLevel(): number {
    return this.level
  }

  get phase(): DayPhase {
    return this.currentPhase
  }

  /** "HH:MM" */
  get timeLabel(): string {
    const h = Math.floor(this.hour)
    const m = Math.floor((this.hour - h) * 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  setHour(hour: number) {
    this.hour = ((hour % 24) + 24) % 24
    if (this.enabled) this.apply(0)
  }

  /**
   * ციკლის ჩართვა/გამორთვა. გამორთვისას სცენა ზუსტად ისე ბრუნდება,
   * როგორც ციკლის შექმნამდე იყო (ცა, ნისლი, შუქები), დრო კი ინახება.
   */
  setEnabled(on: boolean) {
    if (on === this.enabled) return
    this.enabled = on
    this.root.visible = on
    if (on) {
      this.apply(0)
    } else {
      this.restore()
    }
  }

  /** დროის გადახვევა ახალ ფაზამდე: 'day' = 10:00, 'evening' = 18:30, 'night' = 23:00 */
  setPhase(phase: DayPhase) {
    this.setHour({ dawn: 6, day: 10, evening: 18.5, night: 23 }[phase])
  }

  update(dt: number) {
    if (!this.enabled) return
    if (!this.paused) {
      this.hour = (this.hour + (dt * 24) / this.dayLengthSeconds) % 24
    }
    this.apply(dt)
  }

  dispose() {
    this.scene.remove(this.root)
    this.root.traverse((obj: THREE.Object3D) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
    })
  }

  // ---------------------------------------------------------

  private restore() {
    const snap = this.snapshot
    this.sun.position.copy(snap.sunPos)
    this.sun.intensity = snap.sunIntensity
    this.sun.color.copy(snap.sunColor)
    if (this.ambient) {
      this.ambient.intensity = this.ambientBaseIntensity
      if (snap.ambColor) this.ambient.color.copy(snap.ambColor)
      const hemi = this.ambient as THREE.HemisphereLight
      if (snap.ambGround && hemi.groundColor) hemi.groundColor.copy(snap.ambGround)
    }
    const fog = this.scene.fog as THREE.Fog | null
    if (fog && snap.fog) fog.color.copy(snap.fog)
    const bg = this.scene.background as THREE.Color | null
    if (bg && bg.isColor && snap.bg) bg.copy(snap.bg)
    this.world?.setNightLevel(0)
  }

  private nightFor(h: number): number {
    if (h >= 7 && h <= 17.5) return 0
    if (h > 17.5 && h < 20.5) return smoothstep(h, 17.5, 20.5)
    if (h >= 20.5 || h <= 4.5) return 1
    return 1 - smoothstep(h, 4.5, 7)
  }

  private sampleSky(h: number) {
    let a = SKY_KEYS[0]
    let b = SKY_KEYS[SKY_KEYS.length - 1]
    for (let i = 0; i < SKY_KEYS.length - 1; i++) {
      if (h >= SKY_KEYS[i].h && h <= SKY_KEYS[i + 1].h) {
        a = SKY_KEYS[i]
        b = SKY_KEYS[i + 1]
        break
      }
    }
    const t = smoothstep(h, a.h, b.h)
    this.cTop.setHex(a.top).lerp(this.cTmpA.setHex(b.top), t)
    this.cHorizon.setHex(a.horizon).lerp(this.cTmpB.setHex(b.horizon), t)
  }

  private apply(dt: number) {
    this.time += dt
    const h = this.hour
    const n = this.nightFor(h)
    this.level = n

    // მზისა და მთვარის მდებარეობა
    const theta = (Math.PI * (h - 6)) / 12
    this.vSun.set(-Math.cos(theta) * 0.9, Math.sin(theta), 0.35).normalize()
    this.vMoon.set(Math.cos(theta) * 0.9, -Math.sin(theta), 0.35).normalize()
    const sunY = this.vSun.y
    const moonY = this.vMoon.y

    // ფაზა
    let phase: DayPhase = 'night'
    if (h >= 5 && h < 7) phase = 'dawn'
    else if (h >= 7 && h < 17.5) phase = 'day'
    else if (h >= 17.5 && h < 20) phase = 'evening'
    if (phase !== this.currentPhase) {
      this.currentPhase = phase
      this.onPhaseChange?.(phase)
    }

    // ზეცის ფერები
    this.sampleSky(h)
    const warm = Math.exp(-Math.pow((h - 18.4) / 0.9, 2)) + Math.exp(-Math.pow((h - 5.9) / 0.8, 2))

    // ძირითადი შუქი: მზე ან მთვარე, რომელიც უფრო ძლიერია
    const sunK = smoothstep(sunY, -0.05, 0.25)
    const sunPower = sunK * (0.25 + 0.75 * clamp(sunY * 1.4, 0, 1))
    const moonK = smoothstep(moonY, -0.05, 0.25)
    const moonPower = 0.3 * moonK * smoothstep(n, 0.2, 0.8)
    const useSun = sunPower >= moonPower
    const dir = useSun ? this.vSun : this.vMoon
    const target = this.sun.target.position
    this.sun.position.copy(target).addScaledVector(dir, this.lightDistance)
    this.sun.intensity = this.sunBaseIntensity * (useSun ? sunPower : moonPower)
    if (useSun) {
      this.sun.color.setHex(0xff8a4a).lerp(this.cTmpA.setHex(0xfff4e0), clamp(sunY * 3, 0, 1))
    } else {
      this.sun.color.setHex(0x9db4ff)
    }

    if (this.ambient) {
      this.ambient.intensity = this.ambientBaseIntensity * lerp(1, 0.42, n)
      this.cTmpA.setHex(0x6f86c9)
      this.ambient.color.copy(this.ambientBaseColor).lerp(this.cTmpA, n * 0.75)
      this.cTmpB.setHex(0xffb69a)
      this.ambient.color.lerp(this.cTmpB, clamp(warm, 0, 1) * 0.3)
      const hemi = this.ambient as THREE.HemisphereLight
      if (hemi.groundColor) {
        this.cTmpA.setHex(0x1d2440)
        hemi.groundColor.copy(this.ambientBaseGround).lerp(this.cTmpA, n * 0.8)
      }
    }

    // კამერა — ცა მას მიჰყვება
    if (this.camera) this.camera.getWorldPosition(this.vCam)
    else this.vCam.copy(this.center)
    this.root.position.copy(this.vCam)
    if (this.camera) {
      const far = (this.camera as THREE.PerspectiveCamera).far
      const k = far && far < this.skyRadius * 1.05 ? (far * 0.92) / this.skyRadius : 1
      this.dome.scale.set(k, k, k)
      this.stars.scale.set(k, k, k)
    }

    // ცის გუმბათის ფერები
    for (let i = 0; i < this.domePositions.count; i++) {
      const y = this.domePositions.getY(i) / this.skyRadius
      const x = this.domePositions.getX(i) / this.skyRadius
      const z = this.domePositions.getZ(i) / this.skyRadius
      if (y >= 0) {
        this.cTmpA.copy(this.cHorizon).lerp(this.cTop, Math.pow(y, 0.55))
      } else {
        this.cTmpA.copy(this.cHorizon).multiplyScalar(1 - clamp(-y * 2.2, 0, 0.55))
      }
      // მზის/მთვარის ირგვლივ ნათება
      this.vDir.set(x, y, z)
      const dSun = Math.max(0, this.vDir.dot(this.vSun))
      const sunGlow = Math.pow(dSun, 9) * (0.15 + 0.7 * clamp(warm, 0, 1)) * (1 - n * 0.6)
      this.cTmpA.r += 1.0 * sunGlow
      this.cTmpA.g += 0.55 * sunGlow
      this.cTmpA.b += 0.25 * sunGlow
      const dMoon = Math.max(0, this.vDir.dot(this.vMoon))
      const moonGlow = Math.pow(dMoon, 18) * 0.25 * n
      this.cTmpA.r += 0.4 * moonGlow
      this.cTmpA.g += 0.5 * moonGlow
      this.cTmpA.b += 0.8 * moonGlow
      this.domeColors.setXYZ(i, this.cTmpA.r, this.cTmpA.g, this.cTmpA.b)
    }
    this.domeColors.needsUpdate = true

    // ნისლი და ფონი ცას უხამდება
    const fogColor = this.cTmpB.copy(this.cHorizon).multiplyScalar(0.92)
    const fog = this.scene.fog as THREE.Fog | null
    if (fog) fog.color.copy(fogColor)
    const bg = this.scene.background as THREE.Color | null
    if (bg && (bg as THREE.Color).isColor) (bg as THREE.Color).copy(this.cHorizon)

    // მზე და მთვარე სპრაიტები
    const D = 330
    this.sunGlow.position.copy(this.vSun).multiplyScalar(D)
    this.sunCore.position.copy(this.vSun).multiplyScalar(D)
    this.moon.position.copy(this.vMoon).multiplyScalar(D)
    this.moonGlow.position.copy(this.vMoon).multiplyScalar(D)
    const sunVis = smoothstep(sunY, -0.12, 0.05)
    ;(this.sunGlow.material as THREE.SpriteMaterial).opacity = sunVis * (0.55 + 0.35 * clamp(warm, 0, 1))
    ;(this.sunCore.material as THREE.SpriteMaterial).opacity = sunVis
    const moonVis = smoothstep(moonY, -0.12, 0.05) * smoothstep(n, 0.15, 0.6)
    ;(this.moon.material as THREE.SpriteMaterial).opacity = moonVis
    ;(this.moonGlow.material as THREE.SpriteMaterial).opacity = moonVis * 0.55
    ;(this.sunGlow.material as THREE.SpriteMaterial).color.setHex(0xffd27a).lerp(this.cTmpA.setHex(0xff7a3a), clamp(warm, 0, 1))

    // ვარსკვლავები
    const starMat = this.stars.material as THREE.PointsMaterial
    starMat.opacity = smoothstep(n, 0.35, 0.9) * (0.8 + 0.2 * Math.sin(this.time * 1.7))

    // ღრუბლები
    this.cloudMat.color.setHex(0xffffff).lerp(this.cTmpA.setHex(0x2d3560), n)
    this.cloudMat.color.lerp(this.cTmpB.setHex(0xffa77a), clamp(warm, 0, 1) * 0.65)
    for (const c of this.clouds) {
      c.angle += c.speed * dt
      c.group.position.set(
        this.center.x - this.vCam.x + Math.cos(c.angle) * c.radius,
        c.y - this.vCam.y,
        this.center.z - this.vCam.z + Math.sin(c.angle) * c.radius,
      )
      c.group.rotation.y = -c.angle
    }

    // ციცინათელები
    const fMat = this.fireflies.material as THREE.PointsMaterial
    fMat.opacity = Math.pow(n, 1.5) * 0.95
    this.fireflies.visible = n > 0.05
    if (this.fireflies.visible) {
      const pos = this.fireflies.geometry.getAttribute('position') as THREE.BufferAttribute
      this.fireflyData.forEach((f, i) => {
        const t = this.time * f.speed + f.phase
        pos.setXYZ(
          i,
          this.center.x - this.vCam.x + f.x + Math.sin(t * 0.7) * 1.2,
          0.8 + 1.6 * (0.5 + 0.5 * Math.sin(t * 0.9)) - this.vCam.y,
          this.center.z - this.vCam.z + f.z + Math.cos(t * 0.6) * 1.2,
        )
      })
      pos.needsUpdate = true
    }

    this.world?.setNightLevel(n)
  }
}
