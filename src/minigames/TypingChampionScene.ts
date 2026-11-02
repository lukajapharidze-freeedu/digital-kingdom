/**
 * Typing Champion — 3D "კუბიკების" სამყარო (Three.js).
 *
 * კიბე ცაში, მზის ჩასვლა, კუბიკის ღრუბლები, ხეები და შორს ქალაქი.
 * ყოველი საფეხური ერთი სიტყვაა: რამდენ სიტყვასაც დაბეჭდავ, იმდენ საფეხურზე ადის შენი გმირი.
 * გმირები ორიგინალური კუბიკის კაცუნებია (ლაბადით, ნიღბით, ემბლემით), ყოველ ეტაპზე სხვა ტრანსპორტით.
 */
import * as THREE from 'three'

export type VehicleKind = 'foot' | 'car' | 'moto' | 'rocket' | 'ufo'

export interface ScenePlayer {
  id: number
  lane: number
  name: string
  /** 0..N — რამდენი სიტყვა (საფეხური) აქვს გავლილი, წილადითაც */
  steps: number
  place: number | null
  left: boolean
}

// --- ზომები ---
const STEP_D = 1.8
const STEP_H = 0.6
const HALF_W = 3.9
const LANE_Z = [2.4, 0.8, -0.8, -2.4]
const LANE_COLORS = [0xe8443a, 0x2f86e8, 0xf3b81f, 0x3fbf5a]
const MEDALS = ['🥇', '🥈', '🥉', '🏅']

// ---------------------------------------------------------------- პიქსელური ტექსტურები

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pixelCanvas(size: number, draw: (put: (x: number, y: number, c: string) => void, r: () => number) => void, seed = 7) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  draw((x, y, c) => {
    ctx.fillStyle = c
    ctx.fillRect(x, y, 1, 1)
  }, rng(seed))
  return canvas
}

const pick = (r: () => number, list: string[]) => list[Math.floor(r() * list.length)]

type BlockKind = 'grass' | 'grassSide' | 'dirt' | 'stone' | 'brick' | 'planks' | 'log' | 'leaves' | 'window'

function blockCanvas(kind: BlockKind): HTMLCanvasElement {
  const greens = ['#5fae3a', '#6cbc43', '#57a234', '#78c64c', '#4f9a2f']
  const browns = ['#8a5a35', '#7a4d2c', '#96653d', '#6f4426', '#a0703f']
  const grays = ['#8d8d8d', '#7f7f7f', '#999999', '#757575', '#a3a3a3']
  return pixelCanvas(16, (put, r) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        let c = '#ff00ff'
        switch (kind) {
          case 'grass':
            c = pick(r, greens)
            break
          case 'grassSide':
            c = y < 3 + (r() < 0.5 ? 1 : 0) ? pick(r, greens) : pick(r, browns)
            break
          case 'dirt':
            c = pick(r, browns)
            break
          case 'stone':
            c = pick(r, grays)
            break
          case 'brick': {
            const row = Math.floor(y / 4)
            const offset = row % 2 === 0 ? 0 : 4
            const mortar = y % 4 === 3 || (x + offset) % 8 === 7
            c = mortar ? '#5e5e5e' : pick(r, grays)
            break
          }
          case 'planks': {
            const seam = y % 4 === 3 || (x === (Math.floor(y / 4) * 5) % 16)
            c = seam ? '#6b4423' : pick(r, ['#b9844e', '#c08b54', '#ad7843', '#c6955e'])
            break
          }
          case 'log':
            c = x % 4 === 0 ? '#4a2f19' : pick(r, ['#6a4526', '#5c3b20', '#73502d'])
            break
          case 'leaves':
            c = r() < 0.12 ? '#2d5a1c' : pick(r, ['#3f8a2c', '#4b9a33', '#367a25', '#56a83b'])
            break
          case 'window': {
            const isWin = x % 4 !== 0 && y % 4 !== 0
            c = isWin ? (r() < 0.55 ? '#ffd76a' : '#2a3350') : '#1c2238'
            break
          }
        }
        put(x, y, c)
      }
    }
  }, kind.length * 97 + 3)
}

class Textures {
  private readonly canvases = new Map<BlockKind, HTMLCanvasElement>()
  private readonly cache = new Map<string, THREE.Material>()
  readonly owned: (THREE.Texture | THREE.Material)[] = []

  private texture(kind: BlockKind, rx: number, ry: number) {
    let canvas = this.canvases.get(kind)
    if (!canvas) {
      canvas = blockCanvas(kind)
      this.canvases.set(kind, canvas)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.magFilter = THREE.NearestFilter
    tex.minFilter = THREE.NearestFilter
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(rx, ry)
    this.owned.push(tex)
    return tex
  }

  /** ბლოკის მასალა: ტექსტურა მეორდება ზომის მიხედვით, რომ "პიქსელი" ყველგან ერთნაირი იყოს */
  mat(kind: BlockKind, rx: number, ry: number) {
    const key = `${kind}:${rx.toFixed(2)}:${ry.toFixed(2)}`
    let material = this.cache.get(key)
    if (!material) {
      material =
        kind === 'window'
          ? new THREE.MeshLambertMaterial({ color: 0x5a6290, map: this.texture(kind, rx, ry), emissive: 0xffffff, emissiveMap: this.texture(kind, rx, ry), emissiveIntensity: 0.45 })
          : new THREE.MeshLambertMaterial({ map: this.texture(kind, rx, ry), transparent: kind === 'leaves', alphaTest: 0 })
      this.cache.set(key, material)
      this.owned.push(material)
    }
    return material
  }
}

/** ყუთი, რომლის ყოველ წახნაგზე ტექსტურა ზომის მიხედვით მეორდება (1 ერთეული = 1 ბლოკი) */
function voxelBox(tx: Textures, w: number, h: number, d: number, side: BlockKind, top: BlockKind = side, bottom: BlockKind = side, unit = 1) {
  const sx = w / unit
  const sy = h / unit
  const sz = d / unit
  const materials = [
    tx.mat(side, sz, sy),
    tx.mat(side, sz, sy),
    tx.mat(top, sx, sz),
    tx.mat(bottom, sx, sz),
    tx.mat(side, sx, sy),
    tx.mat(side, sx, sy),
  ]
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), materials)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function textCanvas(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d')!)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, start: number) {
  let size = start
  do {
    ctx.font = `900 ${size}px Arial, "Noto Sans Georgian", Sylfaen, sans-serif`
    size -= 2
  } while (ctx.measureText(text).width > maxWidth && size > 10)
}

// ---------------------------------------------------------------- კუბიკის კაცუნები

interface HeroLook {
  suit: string
  legs: string
  hair: string
  skin: string
  emblem: 'bolt' | 'star' | 'leaf' | 'moon'
  emblemColor: string
  cape: string | null
  mask: string | null
}

const HEROES: HeroLook[] = [
  { suit: '#d8302b', legs: '#24376e', hair: '#1f1a17', skin: '#f1c49b', emblem: 'bolt', emblemColor: '#ffd23f', cape: '#ffb31f', mask: null },
  { suit: '#2f6fd6', legs: '#2a2f3a', hair: '#6b3d1e', skin: '#e8b48a', emblem: 'star', emblemColor: '#ffffff', cape: null, mask: '#1b1f2a' },
  { suit: '#f1b52a', legs: '#7a3b12', hair: '#d45a1c', skin: '#f6d0ae', emblem: 'moon', emblemColor: '#6a2ca0', cape: '#7b3fc4', mask: null },
  { suit: '#2f9e4a', legs: '#1d4a2a', hair: '#151515', skin: '#c98d62', emblem: 'leaf', emblemColor: '#c8ff7a', cape: null, mask: '#0f3a1f' },
]

function pixelTexture(canvas: HTMLCanvasElement, owned: (THREE.Texture | THREE.Material)[]) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.colorSpace = THREE.SRGBColorSpace
  owned.push(tex)
  return tex
}

function lambert(color: string | number, owned: (THREE.Texture | THREE.Material)[], map?: THREE.Texture) {
  const m = new THREE.MeshLambertMaterial(map ? { map } : { color })
  owned.push(m)
  return m
}

interface Hero {
  root: THREE.Group
  head: THREE.Mesh
  armL: THREE.Group
  armR: THREE.Group
  legL: THREE.Group
  legR: THREE.Group
  cape: THREE.Group | null
}

function makeHero(look: HeroLook, owned: (THREE.Texture | THREE.Material)[]): Hero {
  const mat = (c: string) => lambert(c, owned)

  // სახე 8x8 პიქსელით
  const face = pixelCanvas(8, (put) => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) put(x, y, look.skin)
    for (let x = 0; x < 8; x++) {
      put(x, 0, look.hair)
      put(x, 1, look.hair)
    }
    put(0, 2, look.hair)
    put(7, 2, look.hair)
    if (look.mask) for (let x = 0; x < 8; x++) put(x, 3, look.mask)
    put(1, 3, '#ffffff')
    put(2, 3, '#2b3a8a')
    put(5, 3, '#2b3a8a')
    put(6, 3, '#ffffff')
    if (look.mask) {
      put(1, 3, '#ffffff')
      put(6, 3, '#ffffff')
    }
    put(3, 5, '#a8664a')
    put(4, 5, '#a8664a')
    put(2, 6, '#7a3a2a')
    put(3, 6, '#7a3a2a')
    put(4, 6, '#7a3a2a')
    put(5, 6, '#7a3a2a')
  })
  const hairSide = pixelCanvas(8, (put) => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) put(x, y, y < 3 || x > 5 ? look.hair : look.skin)
  })
  const hairBack = pixelCanvas(8, (put) => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) put(x, y, y < 6 ? look.hair : look.skin)
  })
  const hairTop = pixelCanvas(8, (put) => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) put(x, y, look.hair)
  })
  const sideMat = lambert(0, owned, pixelTexture(hairSide, owned))
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), [
    sideMat,
    sideMat,
    lambert(0, owned, pixelTexture(hairTop, owned)),
    mat(look.skin),
    lambert(0, owned, pixelTexture(face, owned)),
    lambert(0, owned, pixelTexture(hairBack, owned)),
  ])
  head.position.y = 1.75
  head.castShadow = true

  // მაისური ემბლემით
  const chest = pixelCanvas(8, (put) => {
    for (let y = 0; y < 12; y++) for (let x = 0; x < 8; x++) put(x, y, look.suit)
    const e = look.emblemColor
    const shapes: Record<HeroLook['emblem'], [number, number][]> = {
      bolt: [[4, 1], [3, 2], [4, 2], [2, 3], [3, 3], [4, 3], [5, 3], [3, 4], [4, 4], [3, 5], [2, 6]],
      star: [[3, 1], [4, 1], [2, 2], [3, 2], [4, 2], [5, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [2, 4], [5, 4], [2, 5], [5, 5]],
      leaf: [[4, 1], [3, 2], [4, 2], [5, 2], [2, 3], [3, 3], [4, 3], [5, 3], [3, 4], [4, 4], [3, 5], [3, 6]],
      moon: [[3, 1], [4, 1], [2, 2], [3, 2], [2, 3], [2, 4], [3, 5], [4, 5], [5, 5], [3, 4]],
    }
    for (const [x, y] of shapes[look.emblem]) put(x, y, e)
    for (let x = 0; x < 8; x++) put(x, 7, '#2a2a2a')
  })
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.25), [
    mat(look.suit),
    mat(look.suit),
    mat(look.suit),
    mat(look.suit),
    lambert(0, owned, pixelTexture(chest, owned)),
    mat(look.suit),
  ])
  body.position.y = 1.125
  body.castShadow = true

  const limb = (color: string, endColor: string, x: number, y: number) => {
    const pivot = new THREE.Group()
    pivot.position.set(x, y, 0)
    const tex = pixelCanvas(4, (put) => {
      for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 4; xx++) put(xx, yy, yy === 3 ? endColor : color)
    })
    const m = lambert(0, owned, pixelTexture(tex, owned))
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.75, 0.25), [m, m, mat(color), mat(endColor), m, m])
    mesh.position.y = -0.375
    mesh.castShadow = true
    pivot.add(mesh)
    return pivot
  }
  const armL = limb(look.suit, look.skin, -0.375, 1.5)
  const armR = limb(look.suit, look.skin, 0.375, 1.5)
  const legL = limb(look.legs, '#3a2416', -0.125, 0.75)
  const legR = limb(look.legs, '#3a2416', 0.125, 0.75)

  const root = new THREE.Group()
  root.add(head, body, armL, armR, legL, legR)

  let cape: THREE.Group | null = null
  if (look.cape) {
    cape = new THREE.Group()
    cape.position.set(0, 1.48, -0.14)
    const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.95, 0.05), mat(look.cape))
    cloth.position.y = -0.47
    cloth.castShadow = true
    cape.add(cloth)
    root.add(cape)
  }
  return { root, head, armL, armR, legL, legR, cape }
}

// ---------------------------------------------------------------- ტრანსპორტი

interface Vehicle {
  group: THREE.Group
  wheels: THREE.Object3D[]
  flames: THREE.Object3D[]
  lights: THREE.MeshLambertMaterial[]
  /** რამდენად მაღლა დაფრინავს საფეხურებს ზემოთ */
  hover: number
  /** გმირი ზის (ფეხები წინ) */
  seated: boolean
  heroY: number
}

function makeVehicle(kind: VehicleKind, color: number, owned: (THREE.Texture | THREE.Material)[]): Vehicle {
  const group = new THREE.Group()
  const wheels: THREE.Object3D[] = []
  const flames: THREE.Object3D[] = []
  const lights: THREE.MeshLambertMaterial[] = []
  const box = (w: number, h: number, d: number, c: string | number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lambert(c, owned))
    m.position.set(x, y, z)
    m.castShadow = true
    group.add(m)
    return m
  }
  const wheel = (x: number, y: number, z: number, r: number) => {
    const w = new THREE.Group()
    w.position.set(x, y, z)
    const tire = new THREE.Mesh(new THREE.BoxGeometry(r * 2, r * 2, 0.22), lambert('#1e1e1e', owned))
    const hub = new THREE.Mesh(new THREE.BoxGeometry(r * 0.8, r * 0.8, 0.24), lambert('#c9c9c9', owned))
    tire.castShadow = true
    w.add(tire, hub)
    group.add(w)
    wheels.push(w)
  }
  const dark = new THREE.Color(color).multiplyScalar(0.6).getHex()

  switch (kind) {
    case 'foot':
      return { group, wheels, flames, lights, hover: 0, seated: false, heroY: 0 }
    case 'car':
      box(2.3, 0.5, 1.25, color, 0, 0.55, 0)
      box(1.0, 0.45, 1.15, dark, -0.25, 1.0, 0)
      box(0.08, 0.38, 1.0, '#bfe9ff', 0.27, 1.0, 0)
      box(0.12, 0.16, 0.3, '#fff3a0', 1.16, 0.62, 0.38)
      box(0.12, 0.16, 0.3, '#fff3a0', 1.16, 0.62, -0.38)
      box(0.1, 0.14, 0.3, '#ff3030', -1.16, 0.62, 0.4)
      box(0.1, 0.14, 0.3, '#ff3030', -1.16, 0.62, -0.4)
      for (const x of [-0.7, 0.75]) for (const z of [0.62, -0.62]) wheel(x, 0.3, z, 0.3)
      return { group, wheels, flames, lights, hover: 0, seated: true, heroY: 0.25 }
    case 'moto':
      wheel(-0.8, 0.38, 0, 0.38)
      wheel(0.85, 0.38, 0, 0.38)
      box(1.3, 0.3, 0.3, color, 0, 0.75, 0)
      box(0.5, 0.25, 0.4, dark, 0.25, 0.95, 0)
      box(0.45, 0.12, 0.35, '#2a2a2a', -0.35, 0.95, 0)
      box(0.1, 0.55, 0.1, '#555555', 0.75, 1.0, 0)
      box(0.1, 0.1, 0.7, '#333333', 0.72, 1.28, 0)
      box(0.4, 0.12, 0.12, '#888888', -0.75, 0.55, 0.22)
      return { group, wheels, flames, lights, hover: 0, seated: true, heroY: 0.2 }
    case 'rocket': {
      box(2.2, 0.6, 0.6, '#eef2f7', 0, 0.9, 0)
      box(0.4, 0.62, 0.62, color, 0.9, 0.9, 0)
      box(0.3, 0.4, 0.4, color, 1.25, 0.9, 0)
      box(0.18, 0.2, 0.2, color, 1.45, 0.9, 0)
      box(0.5, 0.5, 0.1, color, -0.85, 1.25, 0)
      box(0.5, 0.1, 0.9, color, -0.85, 0.85, 0)
      box(0.1, 0.3, 0.3, '#7fd3ff', 0.55, 1.15, 0)
      for (let i = 0; i < 3; i++) {
        const flame = box(0.4 - i * 0.1, 0.4 - i * 0.1, 0.4 - i * 0.1, i === 0 ? '#ff7a1f' : i === 1 ? '#ffb23f' : '#fff1a0', -1.2 - i * 0.18, 0.9, 0)
        ;(flame.material as THREE.MeshLambertMaterial).emissive = new THREE.Color(i === 0 ? 0xff5a00 : 0xffc040)
        flames.push(flame)
      }
      return { group, wheels, flames, lights, hover: 0.5, seated: true, heroY: 0.55 }
    }
    case 'ufo': {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.45, 0.32, 8), lambert('#b9c3cf', owned))
      disc.position.y = 0.6
      disc.castShadow = true
      group.add(disc)
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.1, 8), lambert(color, owned))
      ring.position.y = 0.6
      group.add(ring)
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        const light = box(0.16, 0.12, 0.16, '#fff6a8', Math.cos(a) * 1.35, 0.55, Math.sin(a) * 1.35)
        const m = light.material as THREE.MeshLambertMaterial
        m.emissive = new THREE.Color(0xffe066)
        lights.push(m)
      }
      return { group, wheels, flames, lights, hover: 0.8, seated: false, heroY: 0.76 }
    }
  }
}

// ---------------------------------------------------------------- მრბოლელი

interface Racer {
  id: number
  lane: number
  rig: THREE.Group
  tilt: THREE.Group
  hero: Hero
  vehicle: Vehicle
  label: THREE.Sprite
  labelTex: THREE.Texture
  medal: THREE.Sprite | null
  shownPlace: number | null
  t: number
  target: number
  phase: number
}

function nameSprite(name: string, color: number, isMe: boolean) {
  const tex = textCanvas(512, 112, (ctx) => {
    fitFont(ctx, name, 460, 60)
    const w = Math.min(500, ctx.measureText(name).width + 50)
    ctx.fillStyle = isMe ? '#ffd23f' : `#${new THREE.Color(color).getHexString()}`
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.roundRect((512 - w) / 2, 14, w, 84, 22)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = isMe ? '#3a2400' : '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(name, 256, 58)
  })
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }))
  sprite.scale.set(2.4, 0.525, 1)
  sprite.renderOrder = 10
  return { sprite, tex }
}

function medalSprite(place: number) {
  const tex = textCanvas(128, 128, (ctx) => {
    ctx.font = '100px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(MEDALS[place - 1] ?? '🏅', 64, 70)
  })
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }))
  sprite.scale.set(0.9, 0.9, 1)
  sprite.renderOrder = 11
  return sprite
}

// ---------------------------------------------------------------- სცენა

export class TypingChampionScene {
  private readonly container: HTMLElement
  private readonly renderer: THREE.WebGLRenderer
  private readonly camera: THREE.PerspectiveCamera
  private readonly resizeObserver: ResizeObserver
  private scene = new THREE.Scene()
  private textures = new Textures()
  private owned: (THREE.Texture | THREE.Material)[] = []
  private sun!: THREE.DirectionalLight
  private sunQuad: THREE.Group | null = null
  private sky: THREE.Mesh | null = null
  private racers = new Map<number, Racer>()
  private panels: { mat: THREE.MeshBasicMaterial; mesh: THREE.Mesh }[] = []
  private clouds: THREE.Group[] = []
  private steps = 0
  private vehicle: VehicleKind = 'foot'
  private myId = 0
  private myWord = -1
  private frame = 0
  private last = performance.now()
  private time = 0
  private camFocus = new THREE.Vector3()

  constructor(container: HTMLElement) {
    this.container = container
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;'
    container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 400)
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()
    this.loop()
  }

  private resize() {
    const w = Math.max(1, this.container.clientWidth)
    const h = Math.max(1, this.container.clientHeight)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    // ვიწრო ეკრანზე ცოტა მეტი ხედი
    this.camera.fov = w / h < 1.2 ? 62 : 48
    this.camera.updateProjectionMatrix()
  }

  // ---------------------------------------------------------------- აგება

  /** ახალი ეტაპი: ამდენი საფეხური, ეს სიტყვები და ეს ტრანსპორტი */
  setStage(words: string[], vehicle: VehicleKind, players: ScenePlayer[], myId: number) {
    this.clear()
    this.steps = words.length
    this.vehicle = vehicle
    this.myId = myId
    this.myWord = -1

    const scene = this.scene
    scene.background = new THREE.Color(0xf2b07e)
    this.sky = this.skyDome()
    scene.add(this.sky)
    scene.fog = new THREE.Fog(0xf2b07e, 70, 420)

    scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x7a5a3a, 1.1))
    const sun = new THREE.DirectionalLight(0xffd9a8, 2.2)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    const sc = sun.shadow.camera
    sc.left = -22
    sc.right = 22
    sc.top = 16
    sc.bottom = -16
    sc.near = 1
    sc.far = 90
    sun.shadow.bias = -0.0008
    scene.add(sun, sun.target)
    this.sun = sun

    this.buildStairs(words)
    this.buildStart()
    this.buildSummit()
    this.buildBackdrop()

    for (const p of players) this.addRacer(p)
    this.setPlayers(players)
    for (const r of this.racers.values()) r.t = r.target

    // კამერა თავიდან შორიდან იწყებს და გმირთან "მიფრინავს"
    const me = this.racers.get(myId)
    const fx = me ? me.rig.position.x : 0
    this.camFocus.set(fx + 10, 6, 0)
    this.camera.position.set(fx + 16, 14, 30)
  }

  /** ცის გუმბათი: ზემოთ ლურჯი, ჰორიზონტთან მზის ჩასვლის ნარინჯისფერი */
  private skyDome() {
    const geometry = new THREE.SphereGeometry(380, 32, 16)
    const stops: [number, THREE.Color][] = [
      [-1, new THREE.Color(0xf5b77e)],
      [0, new THREE.Color(0xffc98a)],
      [0.08, new THREE.Color(0xf79a68)],
      [0.22, new THREE.Color(0xb889c4)],
      [0.45, new THREE.Color(0x5f86d8)],
      [1, new THREE.Color(0x2c58bd)],
    ]
    const pos = geometry.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const c = new THREE.Color()
    for (let v = 0; v < pos.count; v++) {
      const y = pos.getY(v) / 380
      let k = 0
      while (k < stops.length - 2 && y > stops[k + 1][0]) k++
      const [y0, c0] = stops[k]
      const [y1, c1] = stops[k + 1]
      c.copy(c0).lerp(c1, Math.min(1, Math.max(0, (y - y0) / (y1 - y0))))
      colors.set([c.r, c.g, c.b], v * 3)
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })
    this.owned.push(material)
    const dome = new THREE.Mesh(geometry, material)
    dome.renderOrder = -1
    return dome
  }

  private stepTop(i: number) {
    return (i + 1) * STEP_H
  }

  private buildStairs(words: string[]) {
    const tx = this.textures
    const n = words.length
    for (let i = 0; i < n; i++) {
      const top = this.stepTop(i)
      const cx = (i + 0.5) * STEP_D
      const slab = voxelBox(tx, STEP_D, STEP_H, HALF_W * 2, 'planks', 'planks', 'planks', 0.9)
      slab.position.set(cx, top - STEP_H / 2, 0)
      this.scene.add(slab)
      for (const side of [1, -1]) {
        const curb = voxelBox(tx, STEP_D, 0.3, 0.45, 'brick', 'brick', 'brick', 0.6)
        curb.position.set(cx, top + 0.15, side * (HALF_W + 0.22))
        this.scene.add(curb)
      }
      // სიტყვის მბზინავი დაფა კიბის შორეულ მხარეს
      this.addPanel(words[i], cx, top + 1.25, -HALF_W - 0.7)
    }
    // ქვის საყრდენი სხივები კიბის ქვეშ
    const length = n * STEP_D
    const rise = n * STEP_H
    const slope = Math.atan2(rise, length)
    const beamLen = Math.hypot(length, rise)
    for (const side of [1, -1]) {
      const beam = voxelBox(tx, beamLen, 0.7, 0.6, 'brick', 'brick', 'brick', 0.7)
      beam.position.set(length / 2, rise / 2 - 0.65, side * (HALF_W - 0.1))
      beam.rotation.z = slope
      this.scene.add(beam)
    }
    // რამდენიმე სვეტი წყლამდე
    for (let i = 6; i < n - 2; i += 8) {
      const top = this.stepTop(i) - 1
      const h = top + 14
      for (const side of [1, -1]) {
        const pillar = voxelBox(tx, 0.9, h, 0.9, 'brick', 'brick', 'brick', 0.9)
        pillar.position.set((i + 0.5) * STEP_D, top - h / 2, side * (HALF_W - 0.1))
        this.scene.add(pillar)
      }
    }
  }

  private addPanel(word: string, x: number, y: number, z: number) {
    const tex = textCanvas(512, 160, (ctx) => {
      ctx.fillStyle = 'rgba(70, 200, 255, 0.28)'
      ctx.strokeStyle = 'rgba(200, 245, 255, 0.95)'
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.roundRect(8, 8, 496, 144, 18)
      ctx.fill()
      ctx.stroke()
      fitFont(ctx, word, 450, 92)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(120, 230, 255, 0.9)'
      ctx.shadowBlur = 16
      ctx.fillStyle = '#ffffff'
      ctx.fillText(word, 256, 84)
    })
    this.owned.push(tex)
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    this.owned.push(mat)
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(STEP_D * 0.98, STEP_D * 0.31), mat)
    mesh.position.set(x, y, z)
    mesh.rotation.y = -0.12
    this.scene.add(mesh)
    this.panels.push({ mat, mesh })
  }

  private tree(x: number, y: number, z: number, height = 4) {
    const tx = this.textures
    const trunk = voxelBox(tx, 1, height, 1, 'log', 'log', 'log')
    trunk.position.set(x, y + height / 2, z)
    const crown = voxelBox(tx, 3, 2, 3, 'leaves')
    crown.position.set(x, y + height + 0.5, z)
    const cap = voxelBox(tx, 1.6, 1, 1.6, 'leaves')
    cap.position.set(x, y + height + 2, z)
    this.scene.add(trunk, crown, cap)
  }

  private island(x0: number, x1: number, z0: number, z1: number, top: number, depth: number) {
    const tx = this.textures
    const w = x1 - x0
    const d = z1 - z0
    const grass = voxelBox(tx, w, 1, d, 'grassSide', 'grass', 'dirt')
    grass.position.set((x0 + x1) / 2, top - 0.5, (z0 + z1) / 2)
    const dirt = voxelBox(tx, w, 2, d, 'dirt')
    dirt.position.set((x0 + x1) / 2, top - 2, (z0 + z1) / 2)
    const rock = voxelBox(tx, w - 2, depth, d - 2, 'stone')
    rock.position.set((x0 + x1) / 2, top - 3 - depth / 2, (z0 + z1) / 2)
    this.scene.add(grass, dirt, rock)
  }

  private buildStart() {
    const tx = this.textures
    this.island(-16, 0.2, -9, 9, 0, 8)
    this.tree(-12, 0, -6, 5)
    this.tree(-6, 0, -7.5, 4)
    this.tree(-14, 0, 5, 4)

    // ქვის დაფა წარწერით
    const sign = voxelBox(tx, 3.6, 2.6, 0.7, 'stone')
    sign.position.set(-7.5, 1.3, 6.8)
    sign.rotation.y = 0.35
    this.scene.add(sign)
    const tex = textCanvas(512, 370, (ctx) => {
      ctx.fillStyle = '#2e2e2e'
      ctx.textAlign = 'center'
      ctx.font = '900 54px Arial, "Noto Sans Georgian", Sylfaen, sans-serif'
      const lines = ['ყოველი', 'სიტყვა —', 'ერთი', 'საფეხური!']
      lines.forEach((line, i) => ctx.fillText(line, 256, 80 + i * 84))
    })
    this.owned.push(tex)
    const textMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    this.owned.push(textMat)
    const text = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.4), textMat)
    text.position.set(0, 0, 0.36)
    sign.add(text)

    // ზოლების ნომრიანი ქვები
    LANE_Z.forEach((z, lane) => {
      const block = voxelBox(tx, 0.7, 0.5, 0.7, 'stone')
      block.position.set(-1.6, 0.25, z)
      this.scene.add(block)
      const numTex = textCanvas(64, 64, (ctx) => {
        ctx.fillStyle = `#${new THREE.Color(LANE_COLORS[lane]).getHexString()}`
        ctx.fillRect(0, 0, 64, 64)
        ctx.fillStyle = '#ffffff'
        ctx.font = '900 48px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(lane + 1), 32, 36)
      })
      this.owned.push(numTex)
      const numMat = new THREE.MeshBasicMaterial({ map: numTex })
      this.owned.push(numMat)
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), numMat)
      label.rotation.x = -Math.PI / 2
      label.position.y = 0.26
      block.add(label)
    })
  }

  private buildSummit() {
    const tx = this.textures
    const x0 = this.steps * STEP_D
    const top = this.steps * STEP_H
    this.island(x0 - 0.1, x0 + 12, -8, 8, top, top + 10)
    // ხეები მწვერვალის შორეულ კუთხეში, რომ ფინიშს არ ფარავდნენ
    this.tree(x0 + 11, top, -7, 3)

    // ფინიშის თაღი ჭადრაკული დროშით
    const fx = x0 + 1.2
    for (const side of [1, -1]) {
      const pole = voxelBox(tx, 0.35, 4.2, 0.35, 'log', 'log', 'log', 0.5)
      pole.position.set(fx, top + 2.1, side * (HALF_W + 0.3))
      this.scene.add(pole)
    }
    const checker = pixelCanvas(16, (put) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) put(x, y, (Math.floor(x / 2) + Math.floor(y / 2)) % 2 ? '#111111' : '#ffffff')
    })
    const tex = new THREE.CanvasTexture(checker)
    tex.magFilter = THREE.NearestFilter
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(5, 1)
    this.owned.push(tex)
    const bannerMat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide })
    this.owned.push(bannerMat)
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(HALF_W * 2 + 0.6, 1.0), bannerMat)
    banner.rotation.y = Math.PI / 2
    banner.position.set(fx, top + 3.7, 0)
    this.scene.add(banner)
  }

  private buildBackdrop() {
    const tx = this.textures
    const mid = (this.steps * STEP_D) / 2

    // წყალი
    const waterMat = new THREE.MeshLambertMaterial({ color: 0x3f7fd0, emissive: 0x1a3a70, emissiveIntensity: 0.4 })
    this.owned.push(waterMat)
    const water = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), waterMat)
    water.rotation.x = -Math.PI / 2
    water.position.set(mid, -12, -60)
    water.receiveShadow = true
    this.scene.add(water)

    // მზე — დიდი კვადრატი ჰორიზონტზე
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff6d0, fog: false })
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.35, fog: false })
    this.owned.push(sunMat, haloMat)
    const sunQuad = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), sunMat)
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), haloMat)
    this.sunQuad = new THREE.Group()
    halo.position.z = -1
    this.sunQuad.add(sunQuad, halo)
    this.scene.add(this.sunQuad)
    this.sun.position.set(mid + 40, 40, -60)

    // შორეული ქალაქი
    const r = rng(42)
    for (let i = 0; i < 64; i++) {
      if (r() < 0.25) continue
      const w = 5 + r() * 7
      const h = 6 + r() * 22 * (0.3 + Math.sin((i / 64) * Math.PI))
      const d = 5 + r() * 6
      const b = voxelBox(tx, w, h, d, 'window', 'stone', 'stone', 2)
      b.castShadow = false
      b.position.set(mid - 150 + i * 4.8 + r() * 2, -12 + h / 2, -230 - r() * 40)
      this.scene.add(b)
    }
    // მწვანე კუნძულები ქალაქამდე
    this.island(mid - 70, mid - 40, -70, -50, -6, 4)
    this.tree(mid - 60, -6, -60, 4)
    this.island(mid + 30, mid + 52, -62, -46, -8, 4)

    // კუბიკის ღრუბლები
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffd9c0, emissiveIntensity: 0.25, transparent: true, opacity: 0.92 })
    this.owned.push(cloudMat)
    for (let i = 0; i < 14; i++) {
      const cloud = new THREE.Group()
      const parts = 3 + Math.floor(r() * 4)
      for (let p = 0; p < parts; p++) {
        const piece = new THREE.Mesh(new THREE.BoxGeometry(4 + r() * 8, 1.5 + r() * 1.5, 3 + r() * 5), cloudMat)
        piece.position.set(r() * 10 - 5, r() * 1.5, r() * 6 - 3)
        cloud.add(piece)
      }
      cloud.position.set(mid - 80 + r() * 200, 22 + r() * 22, -30 - r() * 90)
      this.scene.add(cloud)
      this.clouds.push(cloud)
    }
  }

  private addRacer(p: ScenePlayer) {
    const color = LANE_COLORS[p.lane] ?? 0xffffff
    const hero = makeHero(HEROES[p.lane % HEROES.length], this.owned)
    const vehicle = makeVehicle(this.vehicle, color, this.owned)
    const rig = new THREE.Group()
    const tilt = new THREE.Group()
    rig.add(tilt)
    tilt.add(vehicle.group)
    // გმირი +z-ისკენ იყურება; ვაბრუნებთ, რომ კიბეზე (+x) ავიდეს
    hero.root.rotation.y = Math.PI / 2
    hero.root.scale.setScalar(0.95)
    hero.root.position.y = vehicle.heroY
    if (vehicle.seated) {
      hero.legL.rotation.x = -Math.PI / 2
      hero.legR.rotation.x = -Math.PI / 2
      hero.root.position.y = vehicle.heroY + (this.vehicle === 'car' ? 0.3 : 0.45)
      if (this.vehicle === 'car') hero.root.position.x = -0.25
      if (this.vehicle === 'moto') hero.root.position.x = -0.2
      if (this.vehicle === 'rocket') hero.root.position.x = 0.25
    }
    tilt.add(hero.root)
    // ოდნავ კამერისკენ, რომ სახე ჩანდეს
    rig.rotation.y = -0.45
    const { sprite, tex } = nameSprite(p.name, color, p.id === this.myId)
    this.owned.push(tex, sprite.material)
    rig.add(sprite)
    sprite.position.y = 2.75 + vehicle.hover
    this.scene.add(rig)
    this.racers.set(p.id, {
      id: p.id,
      lane: p.lane,
      rig,
      tilt,
      hero,
      vehicle,
      label: sprite,
      labelTex: tex,
      medal: null,
      shownPlace: null,
      t: 0,
      target: 0,
      phase: Math.random() * 10,
    })
  }

  // ---------------------------------------------------------------- განახლება

  setPlayers(players: ScenePlayer[]) {
    for (const p of players) {
      let racer = this.racers.get(p.id)
      if (!racer) {
        this.addRacer(p)
        racer = this.racers.get(p.id)!
      }
      racer.rig.visible = !p.left
      // ფინიშის შემდეგ მწვერვალზე, თაღის მიღმა გადადის
      racer.target = p.place !== null ? this.steps + 2.2 + (4 - p.place) * 0.3 : Math.min(this.steps, p.steps)
      if (p.place !== racer.shownPlace) {
        racer.shownPlace = p.place
        if (racer.medal) {
          racer.rig.remove(racer.medal)
          racer.medal.material.map?.dispose()
          racer.medal.material.dispose()
          racer.medal = null
        }
        if (p.place !== null) {
          racer.medal = medalSprite(p.place)
          racer.medal.position.y = racer.label.position.y + 0.8
          racer.rig.add(racer.medal)
        }
      }
    }
  }

  /** ჩემი მიმდინარე სიტყვა: დაბეჭდილი მწვანეა, მიმდინარე — ყვითელი */
  setMyWord(index: number) {
    if (index === this.myWord) return
    this.myWord = index
    this.panels.forEach(({ mat, mesh }, i) => {
      mat.color.set(i < index ? 0x7dffa0 : i === index ? 0xffe066 : 0xffffff)
      mat.opacity = i < index ? 0.75 : 1
      mesh.scale.setScalar(i === index ? 1.18 : 1)
    })
  }

  private placeRacer(r: Racer, dt: number) {
    const prev = r.t
    r.t += (r.target - r.t) * Math.min(1, dt * 5)
    if (Math.abs(r.target - r.t) < 0.002) r.t = r.target
    const speed = Math.abs(r.t - prev) / Math.max(dt, 0.001)
    const moving = speed > 0.15
    const n = this.steps
    const t = r.t
    const x = t * STEP_D - STEP_D / 2
    const z = LANE_Z[r.lane] ?? 0
    r.phase += dt * (moving ? 12 : 2)

    let y: number
    let pitch = 0
    if (this.vehicle === 'foot') {
      // ფეხით: საფეხურიდან საფეხურზე ახტება
      const stepIndex = Math.max(0, Math.min(n, Math.floor(t + 0.5)))
      y = stepIndex * STEP_H
      if (moving && t < n) y += Math.sin(((t + 0.5) % 1) * Math.PI) * 0.35
    } else {
      // ტრანსპორტი კიბეზე ფერდობივით მიცურავს
      y = Math.max(0, Math.min(n, t)) * STEP_H
      if (t > 0 && t < n && this.vehicle !== 'ufo') pitch = Math.atan2(STEP_H, STEP_D)
      y += r.vehicle.hover + (r.vehicle.hover > 0 ? Math.sin(this.time * 3 + r.phase) * 0.12 : 0)
    }
    r.rig.position.set(x, y, z)
    r.tilt.rotation.z += (pitch - r.tilt.rotation.z) * Math.min(1, dt * 6)

    const h = r.hero
    if (this.vehicle === 'ufo') {
      // თეფშზე დგას და ხელებს იქნევს
      h.armL.rotation.z = -0.5 - Math.sin(this.time * 4 + r.phase) * 0.3
      h.armR.rotation.z = 0.5 + Math.sin(this.time * 4 + r.phase) * 0.3
    } else if (!r.vehicle.seated) {
      const swing = moving ? Math.sin(r.phase) * 0.9 : 0
      h.legL.rotation.x = swing
      h.legR.rotation.x = -swing
      h.armL.rotation.x = -swing
      h.armR.rotation.x = swing
    } else {
      // ხელები საჭეზე
      h.armL.rotation.x = -1.2
      h.armR.rotation.x = -1.2
    }
    if (h.cape) h.cape.rotation.x = -0.25 - (moving ? 0.5 + Math.sin(this.time * 14) * 0.12 : Math.sin(this.time * 2) * 0.05)

    for (const wheel of r.vehicle.wheels) wheel.rotation.z -= speed * dt * 4
    r.vehicle.flames.forEach((f, i) => {
      const s = (moving ? 1.3 : 0.7) + Math.sin(this.time * 30 + i) * 0.25
      f.scale.set(s, 0.8 + s * 0.2, 0.8 + s * 0.2)
    })
    r.vehicle.lights.forEach((m, i) => {
      m.emissiveIntensity = (Math.floor(this.time * 4) + i) % 2 ? 1 : 0.2
    })
  }

  private loop = () => {
    this.frame = requestAnimationFrame(this.loop)
    const now = performance.now()
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.time += dt
    if (this.steps === 0) return

    for (const r of this.racers.values()) this.placeRacer(r, dt)
    for (const [i, c] of this.clouds.entries()) c.position.x += dt * (0.4 + (i % 3) * 0.2)

    // კამერა ჩემს გმირს მისდევს, ცოტა წინ იყურება
    const me = this.racers.get(this.myId)
    let focus: THREE.Vector3
    if (me && me.rig.visible && me.target > this.steps) {
      // ფინიშის შემდეგ კამერა ფინიშის ხაზთან ჩერდება და დანარჩენებს უყურებს
      focus = new THREE.Vector3(this.steps * STEP_D + 0.3, this.steps * STEP_H - 0.9, 0)
    } else if (me && me.rig.visible) focus = me.rig.position.clone()
    else {
      const leader = [...this.racers.values()].filter((r) => r.rig.visible).sort((a, b) => b.t - a.t)[0]
      focus = leader ? leader.rig.position.clone() : new THREE.Vector3()
    }
    focus.z = 0
    const k = Math.min(1, dt * 2.2)
    this.camFocus.lerp(new THREE.Vector3(focus.x + 3.4, focus.y + 1.6, -0.6), k)
    const desired = new THREE.Vector3(this.camFocus.x - 3.5, this.camFocus.y + 2.6, 11.5)
    this.camera.position.lerp(desired, k)
    this.camera.lookAt(this.camFocus)
    this.sky?.position.copy(this.camera.position)

    // მზე ყოველთვის ჩანს კადრის მარჯვენა ზედა მხარეს, ჰორიზონტთან
    this.sunQuad?.position.set(this.camFocus.x + 70, this.camFocus.y * 0.5 + 22, -260)
    this.sun.target.position.copy(this.camFocus)
    this.sun.position.set(this.camFocus.x + 18, this.camFocus.y + 30, this.camFocus.z - 22)

    this.renderer.render(this.scene, this.camera)
  }

  // ---------------------------------------------------------------- გასუფთავება

  private clear() {
    this.sunQuad = null
    this.sky = null
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
    })
    for (const item of [...this.owned, ...this.textures.owned]) item.dispose()
    this.owned = []
    this.textures = new Textures()
    this.scene = new THREE.Scene()
    this.racers.clear()
    this.panels = []
    this.clouds = []
    this.steps = 0
  }

  dispose() {
    cancelAnimationFrame(this.frame)
    this.resizeObserver.disconnect()
    this.clear()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
