import { BufferGeometry, Color, Float32BufferAttribute } from 'three'
import {
  ORIGINAL_CORAL_TERRAIN,
  coralSolidSpansWorld,
} from '../../game/originalCoralTerrain'
import { CORAL_PIXELS_PER_WORLD_UNIT } from '../../game/marineScale'
import { SNES_METATILE_SIZE_PX } from '../../game/snesCollisionMetatile'
import { themeColors } from '../theme'
import {
  ORIGINAL_GROUND_BACK_Z,
  ORIGINAL_GROUND_CHUNK_COLUMNS,
  ORIGINAL_GROUND_FRONT_Z,
  ORIGINAL_GROUND_STRIP_PIXELS,
  ORIGINAL_GROUND_UV_SCALE,
} from './originalGroundRender'
import { terrainNoise } from './terrainNoise'

const coralReef = themeColors.scene.coralReef
const CHUNK_COLUMNS = ORIGINAL_GROUND_CHUNK_COLUMNS
const STRIP_PIXELS = ORIGINAL_GROUND_STRIP_PIXELS
const FRONT_Z = ORIGINAL_GROUND_FRONT_Z
const BACK_Z = ORIGINAL_GROUND_BACK_Z
const CORAL_UV_SCALE = ORIGINAL_GROUND_UV_SCALE
const CORAL_SHADE_NOISE_MIN = 0.85
const CORAL_SHADE_NOISE_SPAN = 0.3
const CORAL_COLUMN_NOISE_STRIDE_PX = 12
const CORAL_SPAN_NOISE_SEED_STEP = 19
function pushQuad(
  positions: number[],
  uvs: number[],
  colors: number[],
  points: number[][],
  tint: string,
  seed: number,
) {
  const shade = new Color(tint).multiplyScalar(
    CORAL_SHADE_NOISE_MIN + terrainNoise(seed) * CORAL_SHADE_NOISE_SPAN,
  )
  for (const cornerIdx of [0, 1, 2, 0, 2, 3]) {
    const [posX, posY, posZ] = points[cornerIdx]
    positions.push(posX, posY, posZ)
    uvs.push(posX * CORAL_UV_SCALE, posY * CORAL_UV_SCALE)
    colors.push(shade.r, shade.g, shade.b)
  }
}
function appendCoralColumnStrip(
  positions: number[],
  uvs: number[],
  colors: number[],
  pixelX: number,
) {
  const stripMinX = pixelX / CORAL_PIXELS_PER_WORLD_UNIT
  const stripMaxX = (pixelX + STRIP_PIXELS) / CORAL_PIXELS_PER_WORLD_UNIT
  coralSolidSpansWorld(stripMinX + 0.00001).forEach((span, spanIndex) => {
    const baseY = span.bottom
    const leftTop = span.top
    const rightTop = span.top
    const seed =
      Math.floor(pixelX / CORAL_COLUMN_NOISE_STRIDE_PX) +
      spanIndex * CORAL_SPAN_NOISE_SEED_STEP
    pushQuad(
      positions,
      uvs,
      colors,
      [
        [stripMinX, baseY, FRONT_Z],
        [stripMaxX, baseY, FRONT_Z],
        [stripMaxX, rightTop, FRONT_Z],
        [stripMinX, leftTop, FRONT_Z],
      ],
      coralReef.frontFace,
      seed,
    )
    pushQuad(
      positions,
      uvs,
      colors,
      [
        [stripMaxX, baseY, BACK_Z],
        [stripMinX, baseY, BACK_Z],
        [stripMinX, leftTop, BACK_Z],
        [stripMaxX, rightTop, BACK_Z],
      ],
      coralReef.backFace,
      seed,
    )
    pushQuad(
      positions,
      uvs,
      colors,
      [
        [stripMinX, leftTop, FRONT_Z],
        [stripMaxX, rightTop, FRONT_Z],
        [stripMaxX, rightTop, BACK_Z],
        [stripMinX, leftTop, BACK_Z],
      ],
      coralReef.topFace,
      seed,
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
      coralReef.bottomFace,
      seed,
    )
  })
}

export function createCoralGroundGeometry(
  firstColumn: number,
  columnCount = CHUNK_COLUMNS,
) {
  const positions: number[] = []
  const uvs: number[] = []
  const colors: number[] = []
  const maxPixel = Math.min(
    ORIGINAL_CORAL_TERRAIN.widthPixels,
    (firstColumn + columnCount) * SNES_METATILE_SIZE_PX,
  )
  for (
    let pixelX = firstColumn * SNES_METATILE_SIZE_PX;
    pixelX < maxPixel;
    pixelX += STRIP_PIXELS
  ) {
    appendCoralColumnStrip(positions, uvs, colors, pixelX)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
