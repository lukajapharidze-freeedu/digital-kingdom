import * as THREE from 'three'

/**
 * ღამის სისტემა სამეფოსთვის.
 *
 * ყველა მანათობელი ელემენტი (ფანჯრები, ფარნები, ჩირაღდნები, ცეცხლი, კრისტალები)
 * რეგისტრირდება აქ და ერთი ციფრით იმართება:
 *   setLevel(0) — სრული დღე, setLevel(1) — ღრმა ღამე.
 * ეს ციფრს DayNightCycle აწვდის, მაგრამ ხელითაც შეგიძლია გამოიძახო.
 */

interface GlowEntry {
  mat: THREE.MeshStandardMaterial
  day: number
  night: number
}

interface LightEntry {
  light: THREE.PointLight
  day: number
  night: number
  flicker: number
  seed: number
}

let glowTexture: THREE.CanvasTexture | null = null

/** რბილი რადიალური ნათების ტექსტურა (ჰალოებისთვის და ციცინათელებისთვის). */
export function getGlowTexture(): THREE.CanvasTexture {
  if (glowTexture) return glowTexture
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.22, 'rgba(255,255,255,0.55)')
    g.addColorStop(0.55, 'rgba(255,255,255,0.14)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  }
  glowTexture = new THREE.CanvasTexture(canvas)
  glowTexture.colorSpace = THREE.SRGBColorSpace
  return glowTexture
}

export class NightRig {
  /** 0 — დღე, 1 — ღამე */
  level = 0

  /**
   * წერტილოვანი შუქების მასშტაბი. თუ შენს პროექტში Three.js-ის ძველი
   * (r155-მდე) ვერსიაა, ან შუქი ზედმეტად ძლიერი/სუსტია, აქ დაარეგულირე.
   */
  lightScale = 1

  private glows: GlowEntry[] = []
  private lights: LightEntry[] = []
  private halos = new Map<number, { mat: THREE.SpriteMaterial; day: number; night: number }>()
  private shared = new Map<string, THREE.MeshStandardMaterial>()
  private time = 0

  /** მანათობელი მასალა: emissive-ის სიძლიერე დღისა და ღამის მიხედვით იცვლება. */
  glowMaterial(
    key: string,
    color: number,
    emissive: number,
    day: number,
    night: number,
    roughness = 0.6,
  ): THREE.MeshStandardMaterial {
    const cached = this.shared.get(key)
    if (cached) return cached
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: day,
      roughness,
      flatShading: true,
    })
    this.shared.set(key, mat)
    this.glows.push({ mat, day, night })
    return mat
  }

  /** ფანჯრის მინა: დღისით მოლურჯო, ღამით თბილად ანათებს. */
  windowMaterial(): THREE.MeshStandardMaterial {
    return this.glowMaterial('window', 0x8fc4e3, 0xffb54a, 0.06, 1.35, 0.35)
  }

  /** ბიბლიოთეკის/ლაბორატორიის ფანჯარა — უფრო ყვითელი ან ცივი ტონი. */
  tintedWindowMaterial(name: string, color: number, emissive: number): THREE.MeshStandardMaterial {
    return this.glowMaterial(`window:${name}`, color, emissive, 0.05, 1.3, 0.35)
  }

  /** წერტილოვანი შუქი (ცეცხლი, ფარანი). day/night — ინტენსივობა. */
  light(
    parent: THREE.Object3D,
    color: number,
    day: number,
    night: number,
    distance: number,
    x: number,
    y: number,
    z: number,
    flicker = 0,
  ): THREE.PointLight {
    const light = new THREE.PointLight(color, day, distance, 2)
    light.position.set(x, y, z)
    light.castShadow = false
    parent.add(light)
    this.lights.push({ light, day, night, flicker, seed: Math.random() * 100 })
    return light
  }

  /** დამატებითი ნათების სფერო (ჰალო) — ღამით ჩნდება. */
  halo(
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    size: number,
    color = 0xffc766,
    night = 0.9,
    day = 0,
  ): THREE.Sprite {
    let entry = this.halos.get(color)
    if (!entry) {
      const mat = new THREE.SpriteMaterial({
        map: getGlowTexture(),
        color,
        transparent: true,
        opacity: day,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      entry = { mat, day, night }
      this.halos.set(color, entry)
    }
    const sprite = new THREE.Sprite(entry.mat)
    sprite.position.set(x, y, z)
    sprite.scale.set(size, size, 1)
    sprite.renderOrder = 5
    parent.add(sprite)
    return sprite
  }

  setLevel(level: number) {
    const n = Math.min(1, Math.max(0, level))
    this.level = n
    for (const g of this.glows) {
      g.mat.emissiveIntensity = g.day + (g.night - g.day) * n
    }
    for (const h of this.halos.values()) {
      h.mat.opacity = h.day + (h.night - h.day) * n
    }
    this.applyLights()
  }

  /** ცეცხლის ციმციმი; ყოველ კადრზე გამოიძახება. */
  update(dt: number) {
    this.time += dt
    this.applyLights()
  }

  private applyLights() {
    for (const l of this.lights) {
      const base = l.day + (l.night - l.day) * this.level
      const wobble = l.flicker
        ? 1 + l.flicker * (Math.sin(this.time * 11 + l.seed) * 0.5 + Math.sin(this.time * 23 + l.seed * 2) * 0.5)
        : 1
      l.light.intensity = base * wobble * this.lightScale
    }
  }
}
