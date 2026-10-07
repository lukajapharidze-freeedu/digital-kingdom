import * as THREE from 'three'

import {
  type WorldCollider,
} from './Collision'

export interface WorldData {
  colliders: WorldCollider[]
}

function mat(color: number) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    flatShading: true,
  })
}

function enableShadows(
  object: THREE.Object3D
) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
}

export function createWorld(
  scene: THREE.Scene
): WorldData {
  const colliders: WorldCollider[] = []

  scene.background =
    new THREE.Color(0x74c9f5)

  scene.fog =
    new THREE.Fog(
      0x74c9f5,
      35,
      80
    )

  // ============================================================
  // LIGHTING
  // ============================================================

  const hemisphere =
    new THREE.HemisphereLight(
      0xdff6ff,
      0x6e9b55,
      2.3
    )

  scene.add(hemisphere)

  const sun =
    new THREE.DirectionalLight(
      0xffffff,
      3.2
    )

  sun.position.set(
    -10,
    18,
    12
  )

  sun.castShadow = true

  sun.shadow.mapSize.set(
    2048,
    2048
  )

  sun.shadow.camera.left = -25
  sun.shadow.camera.right = 25
  sun.shadow.camera.top = 25
  sun.shadow.camera.bottom = -25

  scene.add(sun)

  // ============================================================
  // FLOATING ISLAND
  // ============================================================

  const island =
    new THREE.Group()

  const grass =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        15,
        13.2,
        1.5,
        12
      ),
      mat(0x72c94b)
    )

  grass.position.y = -0.75

  island.add(grass)

  const dirt =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        13.2,
        10,
        3,
        12
      ),
      mat(0x9b6a43)
    )

  dirt.position.y = -3

  island.add(dirt)

  const bottom =
    new THREE.Mesh(
      new THREE.ConeGeometry(
        10,
        8,
        12
      ),
      mat(0x855738)
    )

  bottom.position.y = -8.5

  island.add(bottom)

  enableShadows(island)

  scene.add(island)

  // ============================================================
  // PATH
  // ============================================================

  const path =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        4.2,
        0.12,
        21
      ),
      mat(0xe7cf8c)
    )

  path.position.set(
    0,
    0.02,
    -0.5
  )

  path.receiveShadow = true

  scene.add(path)

  // ============================================================
  // TREES
  // ============================================================

  const treePositions = [
    [-7.5, 4.5],
    [-9.5, 0.5],
    [-7.7, -4.5],
    [7.5, 4.7],
    [9.3, 0.2],
    [7.5, -4.5],
    [-5.2, 7.2],
    [5.3, 7.3],
  ]

  for (
    const [x, z]
    of treePositions
  ) {
    createTree(
      scene,
      x,
      z
    )

    colliders.push({
      type: 'circle',
      x,
      z,
      radius: 0.65,
      height: 2.2,
    })
  }

  // ============================================================
  // BUSHES
  // ============================================================

  const bushPositions = [
    [-5.5, 2.3],
    [-6.2, -1.8],
    [5.7, 2.5],
    [6.2, -1.6],
    [-4.5, 5.4],
    [4.6, 5.6],
  ]

  for (
    const [x, z]
    of bushPositions
  ) {
    createBush(
      scene,
      x,
      z
    )
  }

  // ============================================================
  // ROCKS
  // ============================================================

  const rockData = [
    [-10.2, 4.8, 0.3],
    [-8.8, -6.0, 1.1],
    [9.7, 5.0, 0.8],
    [9.0, -6.0, 1.6],
    [-4.7, -7.0, 2.2],
    [4.8, -7.1, 2.8],
  ]

  for (
    const [x, z, rotation]
    of rockData
  ) {
    createRock(
      scene,
      x,
      z,
      rotation
    )

    colliders.push({
      type: 'circle',
      x,
      z,
      radius: 0.65,
      height: 0.75,
    })
  }

  // ============================================================
  // CASTLE
  // ============================================================

  createCastle(
    scene,
    0,
    -10
  )

  // ============================================================
// CASTLE COLLISION
// Matches the castle's 1.35 visual scale.
// ============================================================

const castleScale = 1.35

// Left tower
colliders.push({
  type: 'circle',
  x: -3.2 * castleScale,
  z: -10,
  radius: 1.35 * castleScale,
  height: 7 * castleScale,
})

// Right tower
colliders.push({
  type: 'circle',
  x: 3.2 * castleScale,
  z: -10,
  radius: 1.35 * castleScale,
  height: 7 * castleScale,
})

// Rear / main body
colliders.push({
  type: 'box',
  x: 0,
  z:
    -10 +
    (-0.65 * castleScale),
  halfWidth:
    2.5 * castleScale,
  halfDepth:
    0.65 * castleScale,
  height:
    7 * castleScale,
})

// Left front wall
colliders.push({
  type: 'box',
  x:
    -1.65 * castleScale,
  z:
    -10 +
    (1.25 * castleScale),
  halfWidth:
    0.85 * castleScale,
  halfDepth:
    0.65 * castleScale,
  height:
    5 * castleScale,
})

// Right front wall
colliders.push({
  type: 'box',
  x:
    1.65 * castleScale,
  z:
    -10 +
    (1.25 * castleScale),
  halfWidth:
    0.85 * castleScale,
  halfDepth:
    0.65 * castleScale,
  height:
    5 * castleScale,
})

// Door
colliders.push({
  type: 'box',
  x: 0,
  z:
    -10 +
    (1.38 * castleScale),
  halfWidth:
    0.68 * castleScale,
  halfDepth:
    0.18 * castleScale,
  height:
    3 * castleScale,
})

  return {
    colliders,
  }
}

function createTree(
  scene: THREE.Scene,
  x: number,
  z: number
) {
  const tree =
    new THREE.Group()

  const trunk =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.35,
        0.48,
        2.2,
        7
      ),
      mat(0x8b5a35)
    )

  trunk.position.y = 1.1

  tree.add(trunk)

  const crown1 =
    new THREE.Mesh(
      new THREE.ConeGeometry(
        1.6,
        2.8,
        7
      ),
      mat(0x3f9f4b)
    )

  crown1.position.y = 2.8

  tree.add(crown1)

  const crown2 =
    new THREE.Mesh(
      new THREE.ConeGeometry(
        1.25,
        2.3,
        7
      ),
      mat(0x55b957)
    )

  crown2.position.y = 4

  tree.add(crown2)

  tree.position.set(
    x,
    0,
    z
  )

  tree.rotation.y =
    (x + z) * 0.12

  enableShadows(tree)

  scene.add(tree)
}

function createBush(
  scene: THREE.Scene,
  x: number,
  z: number
) {
  const bush =
    new THREE.Group()

  const pieces = [
    [-0.45, 0, 0.7],
    [0.35, 0, 0.8],
    [0, 0.2, 0.9],
  ]

  for (
    const [
      offsetX,
      offsetZ,
      size,
    ]
    of pieces
  ) {
    const piece =
      new THREE.Mesh(
        new THREE.DodecahedronGeometry(
          size,
          0
        ),
        mat(0x54b94e)
      )

    piece.position.set(
      offsetX,
      size * 0.65,
      offsetZ
    )

    bush.add(piece)
  }

  bush.position.set(
    x,
    0,
    z
  )

  enableShadows(bush)

  scene.add(bush)
}

function createRock(
  scene: THREE.Scene,
  x: number,
  z: number,
  rotation: number
) {
  const rock =
    new THREE.Mesh(
      new THREE.DodecahedronGeometry(
        0.85,
        0
      ),
      mat(0x8d9696)
    )

  rock.position.set(
    x,
    0.55,
    z
  )

  rock.scale.set(
    1.2,
    0.8,
    0.9
  )

  rock.rotation.set(
    0.15,
    rotation,
    -0.1
  )

  rock.castShadow = true
  rock.receiveShadow = true

  scene.add(rock)
}

function createCastle(
  scene: THREE.Scene,
  x: number,
  z: number
) {
  const castle =
    new THREE.Group()

  const wallMaterial =
    mat(0xf1e0bd)

  const roofMaterial =
    mat(0x377fbd)

  const darkMaterial =
    mat(0x294d67)

  const goldMaterial =
    mat(0xf6bd35)

  // Main building
  const body =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        5,
        4,
        2.6
      ),
      wallMaterial
    )

  body.position.y = 2

  castle.add(body)

  // Central upper section
  const upper =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        2.4,
        2.2,
        2.3
      ),
      wallMaterial
    )

  upper.position.set(
    0,
    4.6,
    0
  )

  castle.add(upper)

  // Side towers
  const towerPositions = [
    -3.2,
    3.2,
  ]

  for (
    const towerX
    of towerPositions
  ) {
    const tower =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          1.2,
          1.35,
          5,
          8
        ),
        wallMaterial
      )

    tower.position.set(
      towerX,
      2.5,
      0
    )

    castle.add(tower)

    const roof =
      new THREE.Mesh(
        new THREE.ConeGeometry(
          1.6,
          2.5,
          8
        ),
        roofMaterial
      )

    roof.position.set(
      towerX,
      6.2,
      0
    )

    castle.add(roof)

    const flagPole =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.05,
          0.05,
          1.5,
          6
        ),
        darkMaterial
      )

    flagPole.position.set(
      towerX,
      8,
      0
    )

    castle.add(flagPole)

    const flag =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.9,
          0.55,
          0.06
        ),
        goldMaterial
      )

    flag.position.set(
      towerX + 0.45,
      8.35,
      0
    )

    castle.add(flag)
  }

  // Central roof
  const centerRoof =
    new THREE.Mesh(
      new THREE.ConeGeometry(
        1.7,
        2.3,
        8
      ),
      roofMaterial
    )

  centerRoof.position.y = 6.8

  castle.add(centerRoof)

  // Door
  const door =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        1.35,
        2.1,
        0.18
      ),
      darkMaterial
    )

  door.position.set(
    0,
    1.05,
    1.39
  )

  castle.add(door)

  // Crown / emblem
  const crown =
    new THREE.Mesh(
      new THREE.OctahedronGeometry(
        0.42,
        0
      ),
      goldMaterial
    )

  crown.position.set(
    0,
    4.5,
    1.25
  )

  crown.rotation.z =
    Math.PI / 4

  castle.add(crown)

  castle.position.set(
    x,
    0,
    z
  )

castle.scale.setScalar(
  1.35
)

  enableShadows(castle)

  scene.add(castle)
}