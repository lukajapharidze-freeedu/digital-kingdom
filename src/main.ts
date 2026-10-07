import './style.css'
import * as THREE from 'three'

// ============================================================
// DIGITAL KINGDOM v0.2
// ============================================================

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x74c9f5)
scene.fog = new THREE.Fog(0x74c9f5, 38, 100)

// ============================================================
// RENDERER
// ============================================================

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
// CAMERA
// ============================================================

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  200
)

let cameraYaw = 0
let cameraPitch = 0.42
const cameraDistance = 11

let draggingCamera = false
let previousMouseX = 0
let previousMouseY = 0

// ============================================================
// LIGHT
// ============================================================

const hemisphere = new THREE.HemisphereLight(
  0xdaf3ff,
  0x7fa34b,
  2.4
)

scene.add(hemisphere)

const sun = new THREE.DirectionalLight(0xfff1d2, 3.4)
sun.position.set(-12, 20, 10)
sun.castShadow = true

sun.shadow.mapSize.set(2048, 2048)

sun.shadow.camera.left = -30
sun.shadow.camera.right = 30
sun.shadow.camera.top = 30
sun.shadow.camera.bottom = -30

scene.add(sun)

// ============================================================
// MATERIALS
// ============================================================

function material(color: number) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    flatShading: true,
  })
}

const grass = material(0x78d641)
const grassDark = material(0x58b637)
const dirt = material(0x9d6949)
const pathMat = material(0xf4bd6b)

const trunkMat = material(0x765039)
const leavesA = material(0x4da83d)
const leavesB = material(0x67bf43)

const rockMat = material(0x89959d)

const castleWhite = material(0xecefdc)
const castleBlue = material(0x3d7edb)
const castleDarkBlue = material(0x2864bd)
const woodMat = material(0x795036)
const goldMat = material(0xf8c83c)

// ============================================================
// FLOATING ISLAND
// ============================================================

const island = new THREE.Group()

const islandTop = new THREE.Mesh(
  new THREE.CylinderGeometry(
    15,
    13.2,
    1.5,
    12
  ),
  grass
)

islandTop.position.y = -0.75
islandTop.receiveShadow = true
islandTop.castShadow = true

island.add(islandTop)

const islandMiddle = new THREE.Mesh(
  new THREE.CylinderGeometry(
    13.2,
    10,
    3,
    12
  ),
  dirt
)

islandMiddle.position.y = -3
islandMiddle.castShadow = true

island.add(islandMiddle)

const islandBottom = new THREE.Mesh(
  new THREE.ConeGeometry(
    10,
    8,
    12
  ),
  dirt
)

islandBottom.position.y = -8.5
islandBottom.rotation.y = 0.15
islandBottom.castShadow = true

island.add(islandBottom)

scene.add(island)

// ============================================================
// PATH
// ============================================================

const path = new THREE.Mesh(
  new THREE.BoxGeometry(4.2, 0.12, 21),
  pathMat
)

path.position.set(0, 0.07, -0.5)
path.receiveShadow = true

scene.add(path)

// ============================================================
// TREES
// ============================================================

function createTree(
  x: number,
  z: number,
  scale = 1,
  rotation = 0
) {
  const tree = new THREE.Group()

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.32,
      0.48,
      3,
      6
    ),
    trunkMat
  )

  trunk.position.y = 1.5
  trunk.castShadow = true

  tree.add(trunk)

  const crown1 = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.55, 1),
    leavesA
  )

  crown1.position.set(0, 3.5, 0)
  crown1.castShadow = true

  tree.add(crown1)

  const crown2 = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.2, 1),
    leavesB
  )

  crown2.position.set(0.85, 3.3, 0.1)
  crown2.castShadow = true

  tree.add(crown2)

  const crown3 = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.05, 1),
    leavesA
  )

  crown3.position.set(-0.65, 3.65, 0.2)
  crown3.castShadow = true

  tree.add(crown3)

  tree.position.set(x, 0, z)
  tree.rotation.y = rotation
  tree.scale.setScalar(scale)

  scene.add(tree)
}

createTree(-7.5, 3.5, 1.15, 0.3)
createTree(7.4, 4.2, 1.25, 1)
createTree(-8, -3.8, 0.85, 2)
createTree(8, -4.5, 0.9, 0.5)
createTree(-6.5, -8, 0.75, 1.7)
createTree(6.6, -8, 0.8, 0.4)

// ============================================================
// BUSHES
// ============================================================

function createBush(
  x: number,
  z: number,
  scale = 1
) {
  const bush = new THREE.Group()

  const a = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.65, 1),
    leavesB
  )

  const b = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 1),
    leavesA
  )

  const c = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.48, 1),
    leavesB
  )

  a.position.set(0, 0.5, 0)
  b.position.set(0.55, 0.42, 0.05)
  c.position.set(-0.48, 0.4, 0.1)

  a.castShadow = true
  b.castShadow = true
  c.castShadow = true

  bush.add(a, b, c)

  bush.position.set(x, 0, z)
  bush.scale.setScalar(scale)

  scene.add(bush)
}

createBush(-4.5, 3, 0.9)
createBush(5.2, 2.5, 0.8)
createBush(-6, -5.8, 0.7)
createBush(6, -6.5, 0.75)

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
    rockMat
  )

  rock.position.set(x, scale * 0.5, z)

  rock.scale.set(
    1,
    0.65,
    0.8
  )

  rock.rotation.y = Math.random() * Math.PI

  rock.castShadow = true
  rock.receiveShadow = true

  scene.add(rock)
}

createRock(-5, 6, 0.7)
createRock(5.4, 5.2, 0.9)
createRock(-5.8, -1.5, 0.55)
createRock(6, -1, 0.65)

// ============================================================
// CASTLE
// ============================================================

const castle = new THREE.Group()

function createTower(
  x: number,
  z: number,
  height: number,
  radius = 1.3
) {
  const tower = new THREE.Group()

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius,
      radius * 1.08,
      height,
      8
    ),
    castleWhite
  )

  body.position.y = height / 2
  body.castShadow = true
  body.receiveShadow = true

  tower.add(body)

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(
      radius * 1.35,
      2.3,
      8
    ),
    castleBlue
  )

  roof.position.y = height + 1.15
  roof.castShadow = true

  tower.add(roof)

  const flagPole = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.04,
      0.04,
      1.5,
      6
    ),
    woodMat
  )

  flagPole.position.y = height + 3

  tower.add(flagPole)

  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.45),
    castleDarkBlue
  )

  flag.position.set(
    0.4,
    height + 3.45,
    0
  )

  tower.add(flag)

  tower.position.set(x, 0, z)

  return tower
}

castle.add(createTower(-3.2, 0, 5))
castle.add(createTower(3.2, 0, 5))
castle.add(createTower(0, -0.6, 7.2, 1.45))

const castleBody = new THREE.Mesh(
  new THREE.BoxGeometry(6.5, 4, 3.2),
  castleWhite
)

castleBody.position.set(0, 2, 0)
castleBody.castShadow = true
castleBody.receiveShadow = true

castle.add(castleBody)

const door = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 2.5, 0.18),
  woodMat
)

door.position.set(0, 1.25, 1.7)

castle.add(door)

// Crown above door

const crown = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.35),
  goldMat
)

crown.position.set(0, 3.25, 1.75)
crown.rotation.z = Math.PI / 4

castle.add(crown)

castle.position.set(0, 0, -10)

scene.add(castle)

// ============================================================
// HERO
// ============================================================

const player = new THREE.Group()

const hoodieMat = material(0xe74b3c)
const hoodieDarkMat = material(0xc93832)
const pantsMat = material(0x2862aa)
const shoesMat = material(0xf4f4ef)
const skinMat = material(0xf0b48d)
const hairMat = material(0x4b3027)
const backpackMat = material(0xf1a629)
const backpackDarkMat = material(0xc87d18)

// Torso

const torso = new THREE.Mesh(
  new THREE.BoxGeometry(1.05, 1.35, 0.68),
  hoodieMat
)

torso.position.y = 1.85
torso.castShadow = true

player.add(torso)

// Hood

const hood = new THREE.Mesh(
  new THREE.TorusGeometry(
    0.42,
    0.13,
    8,
    12
  ),
  hoodieDarkMat
)

hood.position.set(0, 2.45, -0.08)
hood.rotation.x = Math.PI / 2

player.add(hood)

// Head

const head = new THREE.Mesh(
  new THREE.SphereGeometry(
    0.53,
    12,
    10
  ),
  skinMat
)

head.position.y = 2.85
head.castShadow = true

player.add(head)

// Hair

const hair = new THREE.Mesh(
  new THREE.SphereGeometry(
    0.55,
    10,
    8,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  ),
  hairMat
)

hair.position.y = 3.02
hair.castShadow = true

player.add(hair)

// Arms

function createArm(x: number) {
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(
      0.32,
      1.15,
      0.38
    ),
    hoodieMat
  )

  arm.position.set(x, 1.85, 0)
  arm.castShadow = true

  player.add(arm)

  return arm
}

const leftArm = createArm(-0.68)
const rightArm = createArm(0.68)

// Hands

function createHand(x: number) {
  const hand = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 6),
    skinMat
  )

  hand.position.set(x, 1.22, 0)
  hand.castShadow = true

  player.add(hand)
}

createHand(-0.68)
createHand(0.68)

// Legs

function createLeg(x: number) {
  const leg = new THREE.Mesh(
    new THREE.BoxGeometry(
      0.38,
      1.05,
      0.45
    ),
    pantsMat
  )

  leg.position.set(x, 0.7, 0)
  leg.castShadow = true

  player.add(leg)

  return leg
}

const leftLeg = createLeg(-0.27)
const rightLeg = createLeg(0.27)

// Shoes

function createShoe(x: number) {
  const shoe = new THREE.Mesh(
    new THREE.BoxGeometry(
      0.43,
      0.25,
      0.68
    ),
    shoesMat
  )

  shoe.position.set(x, 0.15, -0.1)
  shoe.castShadow = true

  player.add(shoe)
}

createShoe(-0.27)
createShoe(0.27)

// Backpack

const backpack = new THREE.Mesh(
  new THREE.BoxGeometry(
    0.78,
    0.95,
    0.3
  ),
  backpackMat
)

backpack.position.set(0, 1.9, 0.48)
backpack.castShadow = true

player.add(backpack)

const backpackPocket = new THREE.Mesh(
  new THREE.BoxGeometry(
    0.48,
    0.38,
    0.15
  ),
  backpackDarkMat
)

backpackPocket.position.set(
  0,
  1.65,
  0.68
)

player.add(backpackPocket)

player.position.set(0, 0, 7)

scene.add(player)

// ============================================================
// KEYBOARD
// Uses physical keys — works with Georgian keyboard layout.
// ============================================================

const keys: Record<string, boolean> = {}

window.addEventListener('keydown', (event) => {
  keys[event.code] = true
})

window.addEventListener('keyup', (event) => {
  keys[event.code] = false
})

// ============================================================
// MOUSE CAMERA
// ============================================================

renderer.domElement.addEventListener(
  'mousedown',
  (event) => {
    draggingCamera = true

    previousMouseX = event.clientX
    previousMouseY = event.clientY
  }
)

window.addEventListener(
  'mouseup',
  () => {
    draggingCamera = false
  }
)

window.addEventListener(
  'mousemove',
  (event) => {
    if (!draggingCamera) return

    const deltaX =
      event.clientX - previousMouseX

    const deltaY =
      event.clientY - previousMouseY

    previousMouseX = event.clientX
    previousMouseY = event.clientY

    cameraYaw -= deltaX * 0.006
    cameraPitch += deltaY * 0.004

    cameraPitch = THREE.MathUtils.clamp(
      cameraPitch,
      0.15,
      0.85
    )
  }
)

// Prevent context menu

renderer.domElement.addEventListener(
  'contextmenu',
  (event) => {
    event.preventDefault()
  }
)

// ============================================================
// MOVEMENT
// ============================================================

const clock = new THREE.Clock()

let walkTime = 0

function updatePlayer(delta: number) {
  const speed = 5.2

  let inputX = 0
  let inputZ = 0

  if (
    keys['KeyW'] ||
    keys['ArrowUp']
  ) {
    inputZ -= 1
  }

  if (
    keys['KeyS'] ||
    keys['ArrowDown']
  ) {
    inputZ += 1
  }

  if (
    keys['KeyA'] ||
    keys['ArrowLeft']
  ) {
    inputX -= 1
  }

  if (
    keys['KeyD'] ||
    keys['ArrowRight']
  ) {
    inputX += 1
  }

  const moving =
    inputX !== 0 ||
    inputZ !== 0

  if (moving) {
    const input =
      new THREE.Vector3(
        inputX,
        0,
        inputZ
      ).normalize()

    // Movement relative to camera direction

    const forward =
      new THREE.Vector3(
        -Math.sin(cameraYaw),
        0,
        -Math.cos(cameraYaw)
      )

    const right =
      new THREE.Vector3(
        Math.cos(cameraYaw),
        0,
        -Math.sin(cameraYaw)
      )

    const movement =
      new THREE.Vector3()

    movement.addScaledVector(
      forward,
      -input.z
    )

    movement.addScaledVector(
      right,
      input.x
    )

    movement.normalize()

    player.position.addScaledVector(
      movement,
      speed * delta
    )

    const targetRotation =
      Math.atan2(
        movement.x,
        movement.z
      )

    let rotationDifference =
      targetRotation -
      player.rotation.y

    rotationDifference =
      Math.atan2(
        Math.sin(rotationDifference),
        Math.cos(rotationDifference)
      )

    player.rotation.y +=
      rotationDifference *
      Math.min(1, delta * 12)

    // Walking animation

    walkTime += delta * 10

    leftLeg.rotation.x =
      Math.sin(walkTime) * 0.55

    rightLeg.rotation.x =
      Math.sin(
        walkTime + Math.PI
      ) * 0.55

    leftArm.rotation.x =
      Math.sin(
        walkTime + Math.PI
      ) * 0.45

    rightArm.rotation.x =
      Math.sin(walkTime) * 0.45
  } else {
    leftLeg.rotation.x *= 0.8
    rightLeg.rotation.x *= 0.8

    leftArm.rotation.x *= 0.8
    rightArm.rotation.x *= 0.8
  }

  // Island boundary

  const maxRadius = 12.5

  const distance =
    Math.sqrt(
      player.position.x ** 2 +
      player.position.z ** 2
    )

  if (distance > maxRadius) {
    const angle =
      Math.atan2(
        player.position.z,
        player.position.x
      )

    player.position.x =
      Math.cos(angle) *
      maxRadius

    player.position.z =
      Math.sin(angle) *
      maxRadius
  }
}

// ============================================================
// CAMERA FOLLOW
// ============================================================

function updateCamera() {
  const horizontalDistance =
    Math.cos(cameraPitch) *
    cameraDistance

  const verticalDistance =
    Math.sin(cameraPitch) *
    cameraDistance

  const desiredPosition =
    new THREE.Vector3(
      player.position.x +
        Math.sin(cameraYaw) *
        horizontalDistance,

      player.position.y +
        verticalDistance,

      player.position.z +
        Math.cos(cameraYaw) *
        horizontalDistance
    )

  camera.position.lerp(
    desiredPosition,
    0.1
  )

  camera.lookAt(
    player.position.x,
    player.position.y + 1.6,
    player.position.z
  )
}

// ============================================================
// UI
// ============================================================

const ui =
  document.createElement('div')

ui.innerHTML = `
  <div class="title">
    DIGITAL KINGDOM
  </div>

  <div class="stars">
    ⭐ <span>0 / 5</span>
  </div>

  <div class="welcome">
    <strong>კეთილი იყოს შენი მობრძანება!</strong>
    <span>გამოიკვლიე ციფრული სამეფო ✨</span>
  </div>

  <div class="controls">
    <div>
      <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
      მოძრაობა
    </div>

    <div>
      <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd>
      მოძრაობა
    </div>

    <div>
      <span class="mouse-icon">🖱️</span>
      კამერა
    </div>

    <div>
      <kbd>E</kbd>
      ინტერაქცია
    </div>

    <div>
      <kbd>ESC</kbd>
      მენიუ
    </div>
  </div>
`

document.body.appendChild(ui)

// ============================================================
// RESIZE
// ============================================================

window.addEventListener(
  'resize',
  () => {
    camera.aspect =
      window.innerWidth /
      window.innerHeight

    camera.updateProjectionMatrix()

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    )
  }
)

// ============================================================
// GAME LOOP
// ============================================================

function animate() {
  requestAnimationFrame(animate)

  const delta =
    Math.min(
      clock.getDelta(),
      0.05
    )

  updatePlayer(delta)
  updateCamera()

  renderer.render(
    scene,
    camera
  )
}

animate()