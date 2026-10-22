import { BufferGeometry, Color, Float32BufferAttribute } from 'three'
import { pick } from '../utils/pick'

export function createBananaGeometry() {
  const positions: number[] = []

  const colors: number[] = []

  const indices: number[] = []

  const uvCoords: number[] = []

  const rows = 28

  const sides = 10

  const bright = new Color('#ffe45b')

  const dark = new Color('#c58b10')

  for (let row = 0; row <= rows; row++) {
    const rowNorm = row / rows

    const posX = (rowNorm - 0.5) * 1.04

    const posY = -Math.sin(rowNorm * Math.PI) * 0.34 + rowNorm * 0.12

    const tangentY = -Math.cos(rowNorm * Math.PI) * 0.34 * Math.PI + 0.12

    const length = Math.hypot(1.04, tangentY)

    const normalX = -tangentY / length

    const normalY = 1.04 / length

    const radius =
      0.018 +
      Math.pow(Math.sin(rowNorm * Math.PI), 0.65) * 0.108 * (1 - rowNorm * 0.14)

    for (let side = 0; side <= sides; side++) {
      const angle = (side / sides) * Math.PI * 2

      const ringRadius = radius * pick(side % 2 === 0, 1, 0.88)

      const shade =
        0.38 + Math.cos(angle - 0.6) * 0.23 + pick(side % 2 === 0, 0.1, 0)

      positions.push(
        posX + normalX * Math.cos(angle) * ringRadius,
        posY + normalY * Math.cos(angle) * ringRadius,
        Math.sin(angle) * ringRadius,
      )
      const color = dark
        .clone()
        .lerp(bright, Math.max(0.1, Math.min(1, shade + 0.3)))

      colors.push(color.r, color.g, color.b)
      uvCoords.push(rowNorm, side / sides)

      if (row < rows && side < sides) {
        const vertA = row * (sides + 1) + side

        const vertB = vertA + sides + 1

        indices.push(vertA, vertB, vertA + 1, vertB, vertB + 1, vertA + 1)
      }
    }
  }

  const geometry = new BufferGeometry()

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvCoords, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  return geometry
}

export const BANANA_GEOMETRY = createBananaGeometry()
