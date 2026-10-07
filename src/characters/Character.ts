import * as THREE from 'three'

export type CharacterGender = 'boy' | 'girl'

export interface GameCharacter {
  group: THREE.Group
  leftArm: THREE.Group
  rightArm: THREE.Group
  leftLeg: THREE.Group
  rightLeg: THREE.Group
}

function mat(color: number) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    flatShading: true,
  })
}

function shadow(mesh: THREE.Mesh) {
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function createCharacter(
  gender: CharacterGender
): GameCharacter {
  const character = new THREE.Group()

  const skin = mat(0xf0b48d)
  const hair = mat(
    gender === 'boy'
      ? 0x493027
      : 0x5b3528
  )

  const top = mat(
    gender === 'boy'
      ? 0xe94b3c
      : 0x8e63d8
  )

  const topDark = mat(
    gender === 'boy'
      ? 0xc83b32
      : 0x7049ba
  )

  const pants = mat(
    gender === 'boy'
      ? 0x2862aa
      : 0x315b91
  )

  const shoes = mat(0xf6f4ed)

  const backpack = mat(
    gender === 'boy'
      ? 0xf1a629
      : 0xf2a63b
  )

  const backpackDark = mat(0xc87c18)

  // ==========================================================
  // BODY
  // ==========================================================

  const torso = shadow(
    new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 1.3, 0.65),
      top
    )
  )

  torso.position.y = 1.85
  character.add(torso)

  // ==========================================================
  // HEAD
  // ==========================================================

  const head = shadow(
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.53,
        14,
        10
      ),
      skin
    )
  )

  head.position.y = 2.85
  character.add(head)

  // ==========================================================
  // HAIR
  // ==========================================================

  if (gender === 'boy') {
    const boyHair = shadow(
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.56,
          10,
          8,
          0,
          Math.PI * 2,
          0,
          Math.PI / 2
        ),
        hair
      )
    )

    boyHair.position.y = 3.03
    character.add(boyHair)
  } else {
    const topHair = shadow(
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.57,
          12,
          10,
          0,
          Math.PI * 2,
          0,
          Math.PI * 0.63
        ),
        hair
      )
    )

    topHair.position.y = 3.02
    character.add(topHair)

    const ponytail = shadow(
      new THREE.Mesh(
        new THREE.IcosahedronGeometry(
          0.34,
          1
        ),
        hair
      )
    )

    // Character faces toward -Z.
    // +Z is therefore the back.
    ponytail.position.set(
      0,
      2.72,
      0.52
    )

    character.add(ponytail)
  }

  // ==========================================================
  // HOOD / COLLAR
  // ==========================================================

  const collar = shadow(
    new THREE.Mesh(
      new THREE.TorusGeometry(
        0.42,
        0.11,
        8,
        12
      ),
      topDark
    )
  )

  collar.position.set(0, 2.43, 0)
  collar.rotation.x = Math.PI / 2

  character.add(collar)

  // ==========================================================
  // ARMS
  // ==========================================================

  function createArm(x: number) {
    const pivot = new THREE.Group()

    pivot.position.set(x, 2.25, 0)

    const arm = shadow(
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.32,
          1.05,
          0.38
        ),
        top
      )
    )

    arm.position.y = -0.5

    const hand = shadow(
      new THREE.Mesh(
        new THREE.SphereGeometry(
          0.19,
          8,
          6
        ),
        skin
      )
    )

    hand.position.y = -1.05

    pivot.add(arm, hand)
    character.add(pivot)

    return pivot
  }

  const leftArm = createArm(-0.68)
  const rightArm = createArm(0.68)

  // ==========================================================
  // LEGS
  // ==========================================================

  function createLeg(x: number) {
    const pivot = new THREE.Group()

    pivot.position.set(x, 1.2, 0)

    const leg = shadow(
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.38,
          1,
          0.44
        ),
        pants
      )
    )

    leg.position.y = -0.5

    const shoe = shadow(
      new THREE.Mesh(
        new THREE.BoxGeometry(
          0.43,
          0.25,
          0.65
        ),
        shoes
      )
    )

    shoe.position.set(
      0,
      -1.05,
      -0.1
    )

    pivot.add(leg, shoe)
    character.add(pivot)

    return pivot
  }

  const leftLeg = createLeg(-0.27)
  const rightLeg = createLeg(0.27)

  // ==========================================================
  // BACKPACK
  //
  // IMPORTANT:
  // Character faces -Z, so backpack belongs on +Z.
  // ==========================================================

  const bag = shadow(
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.8,
        0.95,
        0.3
      ),
      backpack
    )
  )

  bag.position.set(
    0,
    1.88,
    0.48
  )

  character.add(bag)

  const pocket = shadow(
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.5,
        0.38,
        0.14
      ),
      backpackDark
    )
  )

  pocket.position.set(
    0,
    1.65,
    0.69
  )

  character.add(pocket)

  // Backpack straps on the shoulders

  const strapGeometry =
    new THREE.BoxGeometry(
      0.1,
      0.9,
      0.08
    )

  const strapMaterial = topDark

  const leftStrap = shadow(
    new THREE.Mesh(
      strapGeometry,
      strapMaterial
    )
  )

  leftStrap.position.set(
    -0.32,
    1.9,
    -0.37
  )

  const rightStrap = leftStrap.clone()
  rightStrap.position.x = 0.32

  character.add(
    leftStrap,
    rightStrap
  )

  return {
    group: character,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
  }
}