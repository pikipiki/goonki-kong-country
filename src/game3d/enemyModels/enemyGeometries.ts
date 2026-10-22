import {
  BoxGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  MeshStandardMaterial,
} from 'three'
export const enemyShapes = {
  round: new SphereGeometry(1, 18, 12),
  limb: new CapsuleGeometry(0.1, 0.35, 5, 12),
  tooth: new ConeGeometry(1, 1, 7),
  box: new BoxGeometry(1, 1, 1),
  cylinder: new CylinderGeometry(1, 1, 1, 16),
  ring: new TorusGeometry(1, 0.05, 6, 24),
}

export const crocTail = new TubeGeometry(
  new CatmullRomCurve3([
    new Vector3(-0.2, 0.35, 0),
    new Vector3(-0.7, 0.24, 0),
    new Vector3(-1.05, 0.18, 0.1),
    new Vector3(-1.27, 0.25, 0.15),
  ]),
  16,
  0.09,
  8,
  false,
)

const materials = new Map<string, MeshStandardMaterial>()

export function enemyMaterial(color: string) {
  const cached = materials.get(color)

  if (cached) {
    return cached
  }

  const translucent = color === '#ccded3' || color === '#e4ead1'

  const created = new MeshStandardMaterial({
    color,
    roughness: 0.68,
    transparent: translucent,
    opacity: translucent ? 0.53 : 1,
    depthWrite: !translucent,
  })

  materials.set(color, created)
  return created
}
