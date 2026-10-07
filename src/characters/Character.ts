import * as THREE from 'three'

export interface GameCharacter {
  group: THREE.Group
  leftArm: THREE.Group
  rightArm: THREE.Group
  leftLeg: THREE.Group
  rightLeg: THREE.Group
}

function material(
  color: number
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    flatShading: true,
  })
}

function box(
  width: number,
  height: number,
  depth: number,
  color: number
) {
  const mesh =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        width,
        height,
        depth
      ),
      material(color)
    )

  mesh.castShadow = true
  mesh.receiveShadow = true

  return mesh
}

export function createCharacter():
  GameCharacter {
  // ============================================================
  // ROOT
  //
  // group = gameplay position.
  // model = visual character.
  //
  // Keeping them separate lets group.position.y = 0
  // represent the actual ground under the character.
  // ============================================================

  const group =
    new THREE.Group()

  const model =
    new THREE.Group()

  group.add(model)

  // ============================================================
  // COLORS
  // ============================================================

  const dark =
    0x292d30

  const television =
    0xb7b5b1

  const televisionDark =
    0x74716f

  const screenFrame =
    0xf1f1eb

  const shirtRed =
    0xa94137

  const shortsBlue =
    0x4164aa

  const skin =
    0xe3aa77

  const shoe =
    0x272d2e

  // ============================================================
  // BODY
  //
  // Character faces toward -Z.
  // ============================================================

  const torso =
    box(
      1.25,
      1.25,
      0.68,
      shirtRed
    )

  torso.position.y = 1.85

  model.add(torso)

  const waist =
    box(
      1.2,
      0.35,
      0.7,
      shortsBlue
    )

  waist.position.y = 1.08

  model.add(waist)

  // ============================================================
  // TV HEAD
  // ============================================================

  const head =
    new THREE.Group()

  head.position.y = 3.15

  const tvBody =
    box(
      2.05,
      1.65,
      0.92,
      television
    )

  head.add(tvBody)

  const tvBack =
    box(
      1.72,
      1.35,
      0.30,
      televisionDark
    )

  tvBack.position.z = 0.53

  head.add(tvBack)

  const frame =
    box(
      1.68,
      1.27,
      0.08,
      screenFrame
    )

  frame.position.z = -0.49

  head.add(frame)

  const screen =
    box(
      1.46,
      1.04,
      0.07,
      dark
    )

  screen.position.z = -0.55

  head.add(screen)

  // ============================================================
  // TV TEST PATTERN
  // ============================================================

  const testColors = [
    0x50bfd1,
    0xf4f2e7,
    0xf6d632,
    0x52b9c8,
    0x72a94c,
    0xa6549b,
    0x42437d,
    0x4fb8ce,
  ]

  const stripeWidth =
    1.38 /
    testColors.length

  testColors.forEach(
    (color, index) => {
      const stripe =
        box(
          stripeWidth,
          0.19,
          0.025,
          color
        )

      stripe.position.set(
        -0.69 +
          stripeWidth / 2 +
          index *
            stripeWidth,
        0.40,
        -0.595
      )

      head.add(stripe)
    }
  )

  testColors.forEach(
    (color, index) => {
      const stripe =
        box(
          stripeWidth,
          0.32,
          0.025,
          color
        )

      stripe.position.set(
        -0.69 +
          stripeWidth / 2 +
          index *
            stripeWidth,
        -0.31,
        -0.595
      )

      head.add(stripe)
    }
  )

  // ============================================================
  // FACE
  // ============================================================

  const faceBand =
    box(
      1.38,
      0.39,
      0.035,
      0x303436
    )

  faceBand.position.set(
    0,
    0.06,
    -0.62
  )

  head.add(faceBand)

  const leftEye =
    box(
      0.30,
      0.17,
      0.035,
      0x4fc1d4
    )

  leftEye.position.set(
    -0.38,
    0.07,
    -0.65
  )

  head.add(leftEye)

  const rightEye =
    box(
      0.30,
      0.17,
      0.035,
      0xe85c54
    )

  rightEye.position.set(
    0.38,
    0.07,
    -0.65
  )

  head.add(rightEye)

  const mouth =
    box(
      0.32,
      0.07,
      0.035,
      0x171a1b
    )

  mouth.position.set(
    0,
    -0.55,
    -0.64
  )

  head.add(mouth)

  // ============================================================
  // ANTENNAS
  // ============================================================

  const leftAntenna =
    new THREE.Group()

  const leftStem =
    box(
      0.12,
      0.72,
      0.12,
      dark
    )

  leftStem.position.y =
    0.32

  leftAntenna.add(
    leftStem
  )

  const leftTip =
    box(
      0.30,
      0.30,
      0.30,
      dark
    )

  leftTip.position.y =
    0.72

  leftAntenna.add(
    leftTip
  )

  leftAntenna.position.set(
    -0.48,
    0.88,
    0
  )

  leftAntenna.rotation.z =
    -0.55

  head.add(
    leftAntenna
  )

  const rightAntenna =
    new THREE.Group()

  const rightStem =
    box(
      0.12,
      0.72,
      0.12,
      dark
    )

  rightStem.position.y =
    0.32

  rightAntenna.add(
    rightStem
  )

  const rightTip =
    box(
      0.30,
      0.30,
      0.30,
      dark
    )

  rightTip.position.y =
    0.72

  rightAntenna.add(
    rightTip
  )

  rightAntenna.position.set(
    0.48,
    0.88,
    0
  )

  rightAntenna.rotation.z =
    0.55

  head.add(
    rightAntenna
  )

  model.add(head)

  // ============================================================
  // ARMS
  // ============================================================

  const leftArm =
    new THREE.Group()

  leftArm.position.set(
    -0.78,
    2.30,
    0
  )

  const leftSleeve =
    box(
      0.34,
      0.72,
      0.40,
      shirtRed
    )

  leftSleeve.position.y =
    -0.32

  leftArm.add(
    leftSleeve
  )

  const leftHand =
    box(
      0.30,
      0.30,
      0.34,
      skin
    )

  leftHand.position.y =
    -0.83

  leftArm.add(
    leftHand
  )

  model.add(leftArm)

  const rightArm =
    new THREE.Group()

  rightArm.position.set(
    0.78,
    2.30,
    0
  )

  const rightSleeve =
    box(
      0.34,
      0.72,
      0.40,
      shirtRed
    )

  rightSleeve.position.y =
    -0.32

  rightArm.add(
    rightSleeve
  )

  const rightHand =
    box(
      0.30,
      0.30,
      0.34,
      skin
    )

  rightHand.position.y =
    -0.83

  rightArm.add(
    rightHand
  )

  model.add(rightArm)

  // ============================================================
  // LEGS
  // ============================================================

  const leftLeg =
    new THREE.Group()

  leftLeg.position.set(
    -0.34,
    0.92,
    0
  )

  const leftLegPart =
    box(
      0.43,
      0.72,
      0.48,
      shortsBlue
    )

  leftLegPart.position.y =
    -0.30

  leftLeg.add(
    leftLegPart
  )

  const leftAnkle =
    box(
      0.40,
      0.23,
      0.45,
      skin
    )

  leftAnkle.position.y =
    -0.75

  leftLeg.add(
    leftAnkle
  )

  const leftShoe =
    box(
      0.47,
      0.27,
      0.72,
      shoe
    )

  leftShoe.position.set(
    0,
    -0.99,
    -0.10
  )

  leftLeg.add(
    leftShoe
  )

  model.add(leftLeg)

  const rightLeg =
    new THREE.Group()

  rightLeg.position.set(
    0.34,
    0.92,
    0
  )

  const rightLegPart =
    box(
      0.43,
      0.72,
      0.48,
      shortsBlue
    )

  rightLegPart.position.y =
    -0.30

  rightLeg.add(
    rightLegPart
  )

  const rightAnkle =
    box(
      0.40,
      0.23,
      0.45,
      skin
    )

  rightAnkle.position.y =
    -0.75

  rightLeg.add(
    rightAnkle
  )

  const rightShoe =
    box(
      0.47,
      0.27,
      0.72,
      shoe
    )

  rightShoe.position.set(
    0,
    -0.99,
    -0.10
  )

  rightLeg.add(
    rightShoe
  )

  model.add(rightLeg)

  // ============================================================
  // SCALE + GROUND ALIGNMENT
  // ============================================================

  // Smaller than the previous 0.78.
  // This gives the castle/world a much larger sense of scale.
  const characterScale =
    0.42

  model.scale.setScalar(
    characterScale
  )

  // Lowest unscaled point:
  //
  // leg pivot       0.92
  // shoe center    -0.99
  // half shoe      -0.135
  // ---------------------
  // bottom          -0.205
  //
  // After scaling, move the complete visual model upward
  // so its shoe sole sits exactly at local Y = 0.
  model.position.y =
    0.205 *
    characterScale

  return {
    group,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
  }
}