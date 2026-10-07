import './style.css'
import * as THREE from 'three'

// ============================================================
// DIGITAL KINGDOM — First 3D World
// ============================================================

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x72c8f5)
scene.fog = new THREE.Fog(0x72c8f5, 35, 95)

// Camera
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  200
)

camera.position.set(0, 7, 14)

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
})

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace

document.body.appendChild(renderer.domElement)

// ============================================================
// LIGHTING
// ============================================================

const ambientLight = new THREE.HemisphereLight(
  0xcceeff,
  0x6d8c3c,
  2.2
)
scene.add(ambientLight)

const sun = new THREE.DirectionalLight(0xfff0d0, 3.5)
sun.position.set(-10, 20, 10)
sun.castShadow = true

sun.shadow.mapSize.width = 2048
sun.shadow.mapSize.height = 2048

sun.shadow.camera.left = -30
sun.shadow.camera.right = 30
sun.shadow.camera.top = 30
sun.shadow.camera.bottom = -30

scene.add(sun)

// ============================================================
// MATERIALS
// ============================================================

const grassMaterial = new THREE.MeshStandardMaterial({
  color: 0x75c442,
  roughness: 0.9,
})

const dirtMaterial = new THREE.MeshStandardMaterial({
  color: 0xa96f46,
  roughness: 1,
})

const pathMaterial = new THREE.MeshStandardMaterial({
  color: 0xf4ba67,
  roughness: 1,
})

const rockMaterial = new THREE.MeshStandardMaterial({
  color: 0x88939c,
  roughness: 1,
})

const trunkMaterial = new THREE.MeshStandardMaterial({
  color: 0x765039,
  roughness: 1,
})

const leafMaterial = new THREE.MeshStandardMaterial({
  color: 0x4f9e42,
  roughness: 0.9,
})

// ============================================================
// FLOATING ISLAND
// ============================================================

const island = new THREE.Group()

const ground = new THREE.Mesh(
  new THREE.CylinderGeometry(14, 11, 2.2, 10),
  grassMaterial
)

ground.position.y = -1.1
ground.receiveShadow = true
ground.castShadow = true
island.add(ground)

const underside = new THREE.Mesh(
  new THREE.ConeGeometry(10.5, 8, 9),
  dirtMaterial
)

underside.position.y = -6
underside.rotation.y = 0.15
underside.castShadow = true
island.add(underside)

scene.add(island)

// ============================================================
// PATH
// ============================================================

const path = new THREE.Mesh(
  new THREE.BoxGeometry(4, 0.12, 20),
  pathMaterial
)

path.position.set(0, 0.07, -1)
path.receiveShadow = true
scene.add(path)

// ============================================================
// LOW-POLY TREES
// ============================================================

function createTree(x: number, z: number, scale = 1) {
  const tree = new THREE.Group()

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.32 * scale,
      0.45 * scale,
      2.8 * scale,
      6
    ),
    trunkMaterial
  )

  trunk.position.y = 1.4 * scale
  trunk.castShadow = true

  tree.add(trunk)

  const crown1 = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.65 * scale, 1),
    leafMaterial
  )

  crown1.position.set(0, 3.4 * scale, 0)
  crown1.castShadow = true

  tree.add(crown1)

  const crown2 = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.25 * scale, 1),
    leafMaterial
  )

  crown2.position.set(
    0.8 * scale,
    3.1 * scale,
    0.15 * scale
  )

  crown2.castShadow = true

  tree.add(crown2)

  tree.position.set(x, 0, z)

  scene.add(tree)
}

createTree(-6, 1, 1.2)
createTree(6, -2, 1)
createTree(-7, -6, 0.9)
createTree(7, 5, 1.15)
createTree(-8, 6, 0.75)

// ============================================================
// ROCKS
// ============================================================

function createRock(
  x: number,
  z: number,
  scale: number
) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(scale, 0),
    rockMaterial
  )

  rock.position.set(x, scale * 0.55, z)

  rock.scale.y = 0.65
  rock.rotation.set(
    Math.random(),
    Math.random(),
    Math.random()
  )

  rock.castShadow = true
  rock.receiveShadow = true

  scene.add(rock)
}

createRock(-4.5, 5, 0.8)
createRock(5, 4, 1.1)
createRock(-5.5, -3, 0.65)
createRock(5.5, -7, 0.9)

// ============================================================
// SIMPLE CASTLE
// ============================================================

const castle = new THREE.Group()

const castleWhite = new THREE.MeshStandardMaterial({
  color: 0xf1f2e8,
  roughness: 0.8,
})

const castleBlue = new THREE.MeshStandardMaterial({
  color: 0x397bdc,
  roughness: 0.75,
})

function createTower(x: number, height: number) {
  const tower = new THREE.Group()

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(1.25, 1.4, height, 8),
    castleWhite
  )

  body.position.y = height / 2
  body.castShadow = true
  body.receiveShadow = true

  tower.add(body)

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.65, 2.4, 8),
    castleBlue
  )

  roof.position.y = height + 1.2
  roof.castShadow = true

  tower.add(roof)

  tower.position.x = x

  return tower
}

castle.add(createTower(-3, 5))
castle.add(createTower(3, 5))

const centerTower = createTower(0, 7)
castle.add(centerTower)

const castleBody = new THREE.Mesh(
  new THREE.BoxGeometry(6.5, 4, 3),
  castleWhite
)

castleBody.position.y = 2
castleBody.castShadow = true
castleBody.receiveShadow = true

castle.add(castleBody)

// Castle door

const doorMaterial = new THREE.MeshStandardMaterial({
  color: 0x70452d,
})

const door = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 2.5, 0.15),
  doorMaterial
)

door.position.set(0, 1.25, 1.56)

castle.add(door)

castle.position.set(0, 0, -9)

scene.add(castle)

// ============================================================
// TEMPORARY HERO
// ============================================================

const player = new THREE.Group()

const bodyMaterial = new THREE.MeshStandardMaterial({
  color: 0xe94b3c,
})

const pantsMaterial = new THREE.MeshStandardMaterial({
  color: 0x285da8,
})

const skinMaterial = new THREE.MeshStandardMaterial({
  color: 0xf1b48d,
})

const body = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1.4, 0.65),
  bodyMaterial
)

body.position.y = 1.7
body.castShadow = true

player.add(body)

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.55, 16, 12),
  skinMaterial
)

head.position.y = 2.75
head.castShadow = true

player.add(head)

const leftLeg = new THREE.Mesh(
  new THREE.BoxGeometry(0.35, 1, 0.4),
  pantsMaterial
)

leftLeg.position.set(-0.27, 0.65, 0)
leftLeg.castShadow = true

player.add(leftLeg)

const rightLeg = leftLeg.clone()
rightLeg.position.x = 0.27

player.add(rightLeg)

player.position.set(0, 0, 6)

scene.add(player)

// ============================================================
// MOVEMENT
// ============================================================

const keys: Record<string, boolean> = {}

window.addEventListener('keydown', (event) => {
  keys[event.key.toLowerCase()] = true
})

window.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false
})

const clock = new THREE.Clock()

function updatePlayer(delta: number) {
  const speed = 5

  const movement = new THREE.Vector3()

  if (keys['w']) movement.z -= 1
  if (keys['s']) movement.z += 1
  if (keys['a']) movement.x -= 1
  if (keys['d']) movement.x += 1

  if (movement.length() > 0) {
    movement.normalize()

    player.position.x += movement.x * speed * delta
    player.position.z += movement.z * speed * delta

    player.rotation.y = Math.atan2(
      movement.x,
      movement.z
    )
  }

  // Keep player on island
  player.position.x = THREE.MathUtils.clamp(
    player.position.x,
    -11,
    11
  )

  player.position.z = THREE.MathUtils.clamp(
    player.position.z,
    -10,
    10
  )
}

// ============================================================
// CAMERA FOLLOW
// ============================================================

function updateCamera() {
  const targetPosition = new THREE.Vector3(
    player.position.x,
    player.position.y + 6,
    player.position.z + 11
  )

  camera.position.lerp(targetPosition, 0.06)

  camera.lookAt(
    player.position.x,
    player.position.y + 1.5,
    player.position.z - 2
  )
}

// ============================================================
// UI
// ============================================================

const ui = document.createElement('div')

ui.innerHTML = `
  <div class="title">
    DIGITAL KINGDOM
  </div>

  <div class="stars">
    ⭐ <span>0 / 5</span>
  </div>

  <div class="controls">
    <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> მოძრაობა</div>
    <div><kbd>E</kbd> ინტერაქცია</div>
    <div><kbd>ESC</kbd> მენიუ</div>
  </div>

  <div class="welcome">
    <strong>კეთილი იყოს შენი მობრძანება!</strong>
    <span>გამოიკვლიე ციფრული სამეფო ✨</span>
  </div>
`

document.body.appendChild(ui)

// ============================================================
// RESIZE
// ============================================================

window.addEventListener('resize', () => {
  camera.aspect =
    window.innerWidth / window.innerHeight

  camera.updateProjectionMatrix()

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  )
})

// ============================================================
// GAME LOOP
// ============================================================

function animate() {
  requestAnimationFrame(animate)

  const delta = Math.min(clock.getDelta(), 0.05)

  updatePlayer(delta)
  updateCamera()

  renderer.render(scene, camera)
}

animate()