import * as THREE from 'three'

/**
 * სკოლის ლოგო 3D სამყაროსთვის.
 * ფაილი უნდა იდოს აქ: src/assets/school-logo.png
 */
export const SCHOOL_LOGO_URL = new URL('./school-logo.png', import.meta.url).href

let cachedTexture: THREE.Texture | null = null

function logoTexture(): THREE.Texture {
  if (cachedTexture) return cachedTexture

  const texture = new THREE.TextureLoader().load(SCHOOL_LOGO_URL)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  cachedTexture = texture
  return texture
}

/**
 * წრიული ლოგო, რომელიც კედელზე ეკვრის (ბრტყელი დისკი, +Z მიმართულებით "იყურება").
 * diameter — ზომა სამყაროს ერთეულებში; პოზიციას გარედან დააყენებ.
 */
export function createSchoolLogoMesh(diameter: number): THREE.Mesh {
  const texture = logoTexture()
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    // ოდნავ თვითნათება, რომ ღამითაც კარგად იკითხებოდეს
    emissive: 0xffffff,
    emissiveMap: texture,
    emissiveIntensity: 0.28,
    roughness: 0.9,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  })

  const mesh = new THREE.Mesh(new THREE.CircleGeometry(diameter / 2, 64), material)
  mesh.castShadow = false
  mesh.receiveShadow = false
  mesh.name = 'school-logo'
  return mesh
}
