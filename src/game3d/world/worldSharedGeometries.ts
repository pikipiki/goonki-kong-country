import { pick } from '../../utils/pick'
import {
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import { worldRandom } from './worldPalettes'

export const worldSphere = new SphereGeometry(1, 12, 8)
export const worldBox = new BoxGeometry(1, 1, 1)
export const worldCylinder = new CylinderGeometry(0.75, 1, 1, 10, 2)
export const worldRock = new IcosahedronGeometry(1, 1)
export const worldCone = new ConeGeometry(1, 1, 7)

export const worldVine = new TubeGeometry(
  new CatmullRomCurve3([
    new Vector3(0, 0, 0),
    new Vector3(0.15, -0.5, 0.04),
    new Vector3(-0.16, -1.1, 0.04),
    new Vector3(0.07, -1.8, 0),
  ]),
  14,
  0.025,
  5,
  false,
)

const rockPositions = worldRock.attributes.position

for (let vertIdx = 0; vertIdx < rockPositions.count; vertIdx++) {
  const scale =
    0.86 +
    worldRandom(
      Math.round(rockPositions.getX(vertIdx) * 1000) +
        Math.round(rockPositions.getY(vertIdx) * 1000) * 11 +
        Math.round(rockPositions.getZ(vertIdx) * 1000) * 113,
    ) *
      0.24

  rockPositions.setXYZ(
    vertIdx,
    rockPositions.getX(vertIdx) * scale,
    rockPositions.getY(vertIdx) * scale,
    rockPositions.getZ(vertIdx) * scale,
  )
}

worldRock.computeVertexNormals()

function buildLeafGeometry() {
  const vertices: number[] = []

  const uvCoords: number[] = []

  const indices: number[] = []

  const colors: number[] = []

  const rows = 12

  const columns = 4

  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= columns; col++) {
      const rowNorm = row / rows

      const side = (col / columns) * 2 - 1

      const width =
        Math.pow(Math.sin(rowNorm * Math.PI), 0.65) *
        0.59 *
        pick(row % 3 === 0, 0.92, 1)

      vertices.push(
        rowNorm * 3.4,
        Math.sin(rowNorm * Math.PI) * 0.34 -
          rowNorm * rowNorm * 0.7 +
          Math.abs(side) * 0.16,
        side * width,
      )
      uvCoords.push(rowNorm, col / columns)
      const shade =
        1 - Math.abs(side) * 0.16 + pick(col === columns / 2, 0.12, 0)

      colors.push(shade, shade, shade)

      if (row < rows && col < columns) {
        const vertA = row * (columns + 1) + col

        const vertB = vertA + columns + 1

        indices.push(vertA, vertA + 1, vertB, vertB, vertA + 1, vertB + 1)
      }
    }
  }

  const geometry = new BufferGeometry()

  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvCoords, 2))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export const worldLeaf = buildLeafGeometry()

function buildFernGeometry() {
  const positions: number[] = []

  const colors: number[] = []

  const indices: number[] = []

  for (let frondIdx = 0; frondIdx < 17; frondIdx++) {
    const rowNorm = (frondIdx + 1) / 18

    const posX = rowNorm * 2.8

    const posY = Math.sin(rowNorm * Math.PI) * 0.6 - rowNorm * rowNorm * 0.5

    const length = Math.pow(Math.sin(rowNorm * Math.PI), 0.7) * 0.72

    for (const side of [-1, 1]) {
      const first = positions.length / 3

      const points = [
        [posX - 0.09, posY, 0],
        [posX + length * 0.22, posY + 0.065, side * length * 0.52],
        [posX + length * 0.56, posY - 0.07, side * length],
        [posX + 0.12, posY - 0.03, side * 0.08],
      ]

      points.forEach((point, pointIdx) => {
        positions.push(...point)
        const shade = 0.76 + rowNorm * 0.17 + pick(pointIdx === 1, 0.12, 0)

        colors.push(shade, shade, shade)
      })
      indices.push(first, first + 1, first + 2, first, first + 2, first + 3)
    }
  }

  const geometry = new BufferGeometry()

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export const worldFern = buildFernGeometry()

function buildCoralGeometry() {
  const vertices: number[] = []

  const indices: number[] = []

  function pushBranchRing(
    center: Vector3,
    tangent: Vector3,
    bitangent: Vector3,
    radius: number,
    ringScale: number,
  ) {
    for (let segIdx = 0; segIdx < 7; segIdx++) {
      const angle = (segIdx * Math.PI * 2) / 7

      const point = center
        .clone()
        .addScaledVector(tangent, Math.cos(angle) * radius * ringScale)
        .addScaledVector(bitangent, Math.sin(angle) * radius * ringScale)

      vertices.push(point.x, point.y, point.z)
    }
  }

  function branch(start: Vector3, end: Vector3, radius: number, depth: number) {
    const axis = end.clone().sub(start).normalize()

    const tangent = new Vector3(0, 0, 1).cross(axis).normalize()

    const bitangent = axis.clone().cross(tangent).normalize()

    const first = vertices.length / 3

    pushBranchRing(start, tangent, bitangent, radius, 1)
    pushBranchRing(end, tangent, bitangent, radius, 0.65)

    for (let segIdx = 0; segIdx < 7; segIdx++) {
      const next = (segIdx + 1) % 7

      indices.push(
        first + segIdx,
        first + next,
        first + 7 + segIdx,
        first + next,
        first + 7 + next,
        first + 7 + segIdx,
      )
    }

    if (depth > 0) {
      for (let branchIdx = 0; branchIdx < 3; branchIdx++) {
        const angle = branchIdx * 2.1 + depth * 0.7

        const tip = end
          .clone()
          .add(
            new Vector3(
              Math.cos(angle) * 0.42 * depth,
              0.4 + depth * 0.2,
              Math.sin(angle) * 0.26 * depth,
            ),
          )

        branch(end, tip, radius * 0.58, depth - 1)
      }
    }
  }

  branch(new Vector3(), new Vector3(0, 0.8, 0), 0.12, 2)
  const geometry = new BufferGeometry()

  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export const worldCoral = buildCoralGeometry()
