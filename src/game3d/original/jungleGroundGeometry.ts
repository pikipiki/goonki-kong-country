import { BufferGeometry, Color, Float32BufferAttribute } from 'three'
import { ORIGINAL_TERRAIN } from '../../game/originalTerrain'
import { SNES_METATILE_SIZE_PX } from '../../game/snesCollisionMetatile'
import { terrainSolidSpans, type SolidSpan } from '../../game/terrainSolids'
import { ORIGINAL_JUNGLE_ORIGIN } from '../../game/originalJungle'
import { themeColors } from '../theme'
import {
  ORIGINAL_GROUND_BACK_Z,
  ORIGINAL_GROUND_CHUNK_COLUMNS,
  ORIGINAL_GROUND_COLUMN_NOISE_STRIDE_PX,
  ORIGINAL_GROUND_FRONT_Z,
  ORIGINAL_GROUND_SHADE_NOISE_MIN,
  ORIGINAL_GROUND_SHADE_NOISE_SPAN,
  ORIGINAL_GROUND_SPAN_NOISE_SEED_STEP,
  ORIGINAL_GROUND_STRIP_PIXELS,
  ORIGINAL_GROUND_UV_SCALE,
} from './originalGroundRender'
import { terrainNoise } from './terrainNoise'

const jungleGround = themeColors.scene.jungleGround

const CHUNK_COLUMNS = ORIGINAL_GROUND_CHUNK_COLUMNS

const STRIP_PIXELS = ORIGINAL_GROUND_STRIP_PIXELS

const FRONT_Z = ORIGINAL_GROUND_FRONT_Z

const BACK_Z = ORIGINAL_GROUND_BACK_Z

const JUNGLE_BRANCH_BASE_Y = 1

const JUNGLE_BRANCH_TOP_Y = 3

type GroundPlane = 'front' | 'top' | 'side'

function pushQuad(
  positions: number[],
  uvs: number[],
  colors: number[],
  points: number[][],
  tint: string,
  seed: number,
  plane: GroundPlane = 'front',
) {
  const shade = new Color(tint).multiplyScalar(
    ORIGINAL_GROUND_SHADE_NOISE_MIN +
      terrainNoise(seed) * ORIGINAL_GROUND_SHADE_NOISE_SPAN,
  )

  for (const cornerIdx of [0, 1, 2, 0, 2, 3]) {
    const [posX, posY, posZ] = points[cornerIdx]

    positions.push(posX, posY, posZ)
    uvs.push(
      (plane === 'side' ? posZ : posX) * ORIGINAL_GROUND_UV_SCALE,
      (plane === 'top' ? posZ : posY) * ORIGINAL_GROUND_UV_SCALE,
    )
    colors.push(shade.r, shade.g, shade.b)
  }
}

function exposedSolidPieces(span: SolidSpan, neighbours: readonly SolidSpan[]) {
  let pieces = [span]

  for (const other of neighbours) {
    pieces = pieces.flatMap((piece) => {
      if (other.top <= piece.bottom || other.bottom >= piece.top) {
        return [piece]
      }

      const remaining: SolidSpan[] = []

      if (other.bottom > piece.bottom) {
        remaining.push({ bottom: piece.bottom, top: other.bottom })
      }

      if (other.top < piece.top) {
        remaining.push({ bottom: other.top, top: piece.top })
      }

      return remaining
    })
  }

  return pieces
}

function pushJungleBoxQuads(
  positions: number[],
  uvs: number[],
  colors: number[],
  baseY: number,
  topY: number,
  stripMinX: number,
  stripMaxX: number,
  seed: number,
  branch: boolean,
) {
  const frontTint = branch ? jungleGround.branchFront : jungleGround.trunkFront
  const backTint = branch ? jungleGround.branchBack : jungleGround.trunkBack
  const topTint = branch ? jungleGround.branchTop : jungleGround.trunkTop

  pushQuad(
    positions,
    uvs,
    colors,
    [
      [stripMinX, baseY, FRONT_Z],
      [stripMaxX, baseY, FRONT_Z],
      [stripMaxX, topY, FRONT_Z],
      [stripMinX, topY, FRONT_Z],
    ],
    frontTint,
    seed,
  )
  pushQuad(
    positions,
    uvs,
    colors,
    [
      [stripMaxX, baseY, BACK_Z],
      [stripMinX, baseY, BACK_Z],
      [stripMinX, topY, BACK_Z],
      [stripMaxX, topY, BACK_Z],
    ],
    backTint,
    seed,
  )
  pushQuad(
    positions,
    uvs,
    colors,
    [
      [stripMinX, topY, FRONT_Z],
      [stripMaxX, topY, FRONT_Z],
      [stripMaxX, topY, BACK_Z],
      [stripMinX, topY, BACK_Z],
    ],
    topTint,
    seed + 3,
    'top',
  )
  pushQuad(
    positions,
    uvs,
    colors,
    [
      [stripMinX, baseY, BACK_Z],
      [stripMaxX, baseY, BACK_Z],
      [stripMaxX, baseY, FRONT_Z],
      [stripMinX, baseY, FRONT_Z],
    ],
    jungleGround.bottomFace,
    seed,
    'top',
  )
}

function pushJungleExposedSides(
  positions: number[],
  uvs: number[],
  colors: number[],
  span: SolidSpan,
  stripMinX: number,
  stripMaxX: number,
  leftNeighbours: readonly SolidSpan[],
  rightNeighbours: readonly SolidSpan[],
  seed: number,
) {
  for (const face of exposedSolidPieces(span, leftNeighbours)) {
    pushQuad(
      positions,
      uvs,
      colors,
      [
        [stripMinX, face.bottom, BACK_Z],
        [stripMinX, face.bottom, FRONT_Z],
        [stripMinX, face.top, FRONT_Z],
        [stripMinX, face.top, BACK_Z],
      ],
      jungleGround.exposedSide,
      seed,
      'side',
    )
  }

  for (const face of exposedSolidPieces(span, rightNeighbours)) {
    pushQuad(
      positions,
      uvs,
      colors,
      [
        [stripMaxX, face.bottom, FRONT_Z],
        [stripMaxX, face.bottom, BACK_Z],
        [stripMaxX, face.top, BACK_Z],
        [stripMaxX, face.top, FRONT_Z],
      ],
      jungleGround.exposedSide,
      seed,
      'side',
    )
  }
}

function pushJungleSpan(
  positions: number[],
  uvs: number[],
  colors: number[],
  span: SolidSpan,
  stripMinX: number,
  stripMaxX: number,
  leftNeighbours: readonly SolidSpan[],
  rightNeighbours: readonly SolidSpan[],
  spanIndex: number,
  pixelX: number,
) {
  const baseY = span.bottom

  const topY = span.top

  const seed =
    Math.floor(pixelX / ORIGINAL_GROUND_COLUMN_NOISE_STRIDE_PX) +
    spanIndex * ORIGINAL_GROUND_SPAN_NOISE_SEED_STEP

  const branch = baseY > JUNGLE_BRANCH_BASE_Y && topY > JUNGLE_BRANCH_TOP_Y

  pushJungleBoxQuads(
    positions,
    uvs,
    colors,
    baseY,
    topY,
    stripMinX,
    stripMaxX,
    seed,
    branch,
  )
  pushJungleExposedSides(
    positions,
    uvs,
    colors,
    span,
    stripMinX,
    stripMaxX,
    leftNeighbours,
    rightNeighbours,
    seed,
  )
}

function appendJungleColumnStrip(
  positions: number[],
  uvs: number[],
  colors: number[],
  pixelX: number,
) {
  const stripMinX = (pixelX - ORIGINAL_JUNGLE_ORIGIN.x) / SNES_METATILE_SIZE_PX

  const stripMaxX = stripMinX + STRIP_PIXELS / SNES_METATILE_SIZE_PX

  const intervals = terrainSolidSpans('jungle', stripMinX)

  const leftNeighbours = terrainSolidSpans(
    'jungle',
    stripMinX - 1 / SNES_METATILE_SIZE_PX,
  )

  const rightNeighbours = terrainSolidSpans('jungle', stripMaxX)

  intervals.forEach((span, spanIndex) => {
    pushJungleSpan(
      positions,
      uvs,
      colors,
      span,
      stripMinX,
      stripMaxX,
      leftNeighbours,
      rightNeighbours,
      spanIndex,
      pixelX,
    )
  })
}

export function createOriginalGroundGeometry(
  firstColumn: number,
  columnCount = CHUNK_COLUMNS,
) {
  const positions: number[] = []

  const uvs: number[] = []

  const colors: number[] = []

  const maxPixel = Math.min(
    ORIGINAL_TERRAIN.widthPixels,
    (firstColumn + columnCount) * SNES_METATILE_SIZE_PX,
  )

  for (
    let pixelX = firstColumn * SNES_METATILE_SIZE_PX;
    pixelX < maxPixel;
    pixelX += STRIP_PIXELS
  ) {
    appendJungleColumnStrip(positions, uvs, colors, pixelX)
  }

  const geometry = new BufferGeometry()

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
