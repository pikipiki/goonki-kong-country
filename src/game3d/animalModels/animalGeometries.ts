import {
  BoxGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  ExtrudeGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import type { V3 } from './types'

export const animalSphere = new SphereGeometry(1, 20, 14)
export const animalCone = new ConeGeometry(1, 1, 12)
export const animalBox = new BoxGeometry(1, 1, 1)
export const chargeRing = new TorusGeometry(0.65, 0.025, 6, 32)
export function animalTube(points: V3[], radius: number) {
  return new TubeGeometry(
    new CatmullRomCurve3(points.map((point) => new Vector3(...point))),
    16,
    radius,
    8,
    false,
  )
}
function animalFin(points: [number, number][]) {
  const shape = new Shape()
  shape.moveTo(...points[0])
  points.slice(1).forEach((point) => shape.lineTo(...point))
  shape.closePath()
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.018,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 6,
  })
  geometry.translate(0, 0, -0.0225)
  return geometry
}

export const rhinoTail = animalTube(
  [
    [-0.77, 0.94, 0],
    [-1.03, 0.87, 0],
    [-1.11, 0.58, 0.03],
  ],
  0.045,
)
export const ostrichNeck = animalTube(
  [
    [0.3, 1.35, 0],
    [0.56, 1.59, 0],
    [0.53, 1.96, 0],
    [0.69, 2.2, 0],
  ],
  0.105,
)
export const fishDorsal = animalFin([
  [-0.42, 0.8],
  [-0.13, 1.31],
  [0.15, 0.83],
  [0.42, 0.74],
])
export const fishTail = animalFin([
  [-1.02, 0.64],
  [-1.5, 1.18],
  [-1.36, 0.65],
  [-1.55, 0.11],
  [-1.05, 0.48],
])
export const fishSideFin = animalFin([
  [0.02, 0.59],
  [-0.43, 0.21],
  [0.27, 0.49],
])
export const frogMouth = animalTube(
  [
    [0.2, 0.63, 0.3],
    [0.45, 0.54, 0.29],
    [0.67, 0.61, 0.24],
  ],
  0.018,
)
export const mainHorn = (() => {
  const curve = new CatmullRomCurve3([
    new Vector3(1.02, 0.9, 0),
    new Vector3(1.25, 1.03, 0),
    new Vector3(1.39, 1.3, 0),
    new Vector3(1.42, 1.56, 0),
  ])
  const geometry = new TubeGeometry(curve, 18, 1, 12, false)
  const positions = geometry.attributes.position
  for (let ring = 0; ring <= 18; ring++) {
    const center = curve.getPointAt(ring / 18)
    const radius = 0.155 * Math.pow(1 - ring / 18, 0.85) + 0.002
    for (let side = 0; side <= 12; side++) {
      const index = ring * 13 + side
      positions.setXYZ(
        index,
        center.x + (positions.getX(index) - center.x) * radius,
        center.y + (positions.getY(index) - center.y) * radius,
        center.z + (positions.getZ(index) - center.z) * radius,
      )
    }
  }
  positions.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
})()
