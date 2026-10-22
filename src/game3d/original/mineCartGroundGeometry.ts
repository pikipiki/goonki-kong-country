import { BufferGeometry, Color, Float32BufferAttribute } from 'three'
import { pick } from '../../utils/pick'
import {
  ORIGINAL_MINE_CART_TERRAIN,
  terrainCellSNES,
} from '../../game/originalMineCartTerrain'
import { ORIGINAL_MINE_CART_ORIGIN } from '../../game/originalMineCart'
import {
  SNES_HORIZONTAL_LAST_ROW_FROM_TOP,
  SNES_METATILE_SIZE_PX,
} from '../../game/snesCollisionMetatile'
import { themeColors } from '../theme'
import {
  ORIGINAL_GROUND_BACK_FACE_SEED_OFFSET,
  ORIGINAL_GROUND_BACK_Z,
  ORIGINAL_GROUND_CHUNK_COLUMNS,
  ORIGINAL_GROUND_COLUMN_NOISE_STRIDE_PX,
  ORIGINAL_GROUND_FRONT_Z,
  ORIGINAL_GROUND_STRIP_PIXELS,
  ORIGINAL_GROUND_UV_SCALE,
} from './originalGroundRender'
import { terrainNoise } from './terrainNoise'

const mineCartGround = themeColors.scene.mineCartGround

const CHUNK_COLUMNS = ORIGINAL_GROUND_CHUNK_COLUMNS

const STRIP_PIXELS = ORIGINAL_GROUND_STRIP_PIXELS

const FRONT_Z = ORIGINAL_GROUND_FRONT_Z

const BACK_Z = ORIGINAL_GROUND_BACK_Z

const MINECART_RAIL_OFFSET_Z = 0.8

const MINECART_RAIL_LIFT_Y = 0.035

const MINECART_RAIL_HALF_THICKNESS = 0.045

const MINECART_GROUND_SHADE_NOISE_MIN = 0.85

const MINECART_GROUND_SHADE_NOISE_SPAN = 0.3

function pushQuad(
  positions: number[],
  uvs: number[],
  colors: number[],
  points: number[][],
  tint: string,
  seed: number,
  top = false,
) {
  const shade = new Color(tint).multiplyScalar(
    MINECART_GROUND_SHADE_NOISE_MIN +
      terrainNoise(seed) * MINECART_GROUND_SHADE_NOISE_SPAN,
  )

  for (const cornerIdx of [0, 1, 2, 0, 2, 3]) {
    const [posX, posY, posZ] = points[cornerIdx]

    positions.push(posX, posY, posZ)
    uvs.push(
      posX * ORIGINAL_GROUND_UV_SCALE,
      pick(top, posZ, posY) * ORIGINAL_GROUND_UV_SCALE,
    )
    colors.push(shade.r, shade.g, shade.b)
  }
}

function pushMineCartRails(
  positions: number[],
  uvs: number[],
  colors: number[],
  stripMinX: number,
  stripMaxX: number,
  leftY: number,
  rightY: number,
) {
  for (const railZ of [-MINECART_RAIL_OFFSET_Z, MINECART_RAIL_OFFSET_Z]) {
    pushQuad(
      positions,
      uvs,
      colors,
      [
        [
          stripMinX,
          leftY + MINECART_RAIL_LIFT_Y,
          railZ + MINECART_RAIL_HALF_THICKNESS,
        ],
        [
          stripMaxX,
          rightY + MINECART_RAIL_LIFT_Y,
          railZ + MINECART_RAIL_HALF_THICKNESS,
        ],
        [
          stripMaxX,
          rightY + MINECART_RAIL_LIFT_Y,
          railZ - MINECART_RAIL_HALF_THICKNESS,
        ],
        [
          stripMinX,
          leftY + MINECART_RAIL_LIFT_Y,
          railZ - MINECART_RAIL_HALF_THICKNESS,
        ],
      ],
      mineCartGround.rail,
      0,
      true,
    )
  }
}

function pushMineCartSpanQuads(
  positions: number[],
  uvs: number[],
  colors: number[],
  span: { bottom: number; left: number; right: number },
  worldX: number,
  originY: number,
  scale: number,
  pixelX: number,
) {
  const baseY = (span.bottom - originY) / scale

  const leftY = (span.left - originY) / scale

  const rightY = (span.right - originY) / scale

  const stripMinX = worldX - STRIP_PIXELS / scale / 2

  const stripMaxX = worldX + STRIP_PIXELS / scale / 2

  const floorSeed = Math.floor(pixelX / ORIGINAL_GROUND_COLUMN_NOISE_STRIDE_PX)

  pushMineCartRails(positions, uvs, colors, stripMinX, stripMaxX, leftY, rightY)

  pushQuad(
    positions,
    uvs,
    colors,
    [
      [stripMinX, leftY, FRONT_Z],
      [stripMaxX, rightY, FRONT_Z],
      [stripMaxX, rightY, BACK_Z],
      [stripMinX, leftY, BACK_Z],
    ],
    mineCartGround.slopedTop,
    floorSeed,
    true,
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
    mineCartGround.bottomFace,
    floorSeed,
    true,
  )
  pushQuad(
    positions,
    uvs,
    colors,
    [
      [worldX - STRIP_PIXELS / scale / 2, baseY, FRONT_Z],
      [worldX + STRIP_PIXELS / scale / 2, baseY, FRONT_Z],
      [worldX + STRIP_PIXELS / scale / 2, rightY, FRONT_Z],
      [worldX - STRIP_PIXELS / scale / 2, leftY, FRONT_Z],
    ],
    mineCartGround.frontFace,
    pixelX + span.bottom,
  )
  pushQuad(
    positions,
    uvs,
    colors,
    [
      [worldX + STRIP_PIXELS / scale / 2, baseY, BACK_Z],
      [worldX - STRIP_PIXELS / scale / 2, baseY, BACK_Z],
      [worldX - STRIP_PIXELS / scale / 2, leftY, BACK_Z],
      [worldX + STRIP_PIXELS / scale / 2, rightY, BACK_Z],
    ],
    mineCartGround.backFace,
    pixelX + span.bottom + ORIGINAL_GROUND_BACK_FACE_SEED_OFFSET,
  )
}

function appendMineCartColumnStrip(
  positions: number[],
  uvs: number[],
  colors: number[],
  pixelX: number,
  originX: number,
  originY: number,
  scale: number,
) {
  const intervals: { bottom: number; left: number; right: number }[] = []

  for (let row = SNES_HORIZONTAL_LAST_ROW_FROM_TOP; row >= 0; row--) {
    const left = terrainCellSNES(pixelX, row)

    const right = terrainCellSNES(pixelX + STRIP_PIXELS - 1, row)

    if ((left?.localHeight ?? 0) <= 0 && (right?.localHeight ?? 0) <= 0) {
      continue
    }

    const bottom =
      (SNES_HORIZONTAL_LAST_ROW_FROM_TOP - row) * SNES_METATILE_SIZE_PX

    const leftY = left?.floorY ?? bottom

    const rightY = right?.floorY ?? bottom

    const last = intervals.at(-1)

    if (last && bottom <= Math.min(last.left, last.right) + 1) {
      last.left = Math.max(last.left, leftY)
      last.right = Math.max(last.right, rightY)
    } else {
      intervals.push({ bottom, left: leftY, right: rightY })
    }
  }

  const worldX = (pixelX + STRIP_PIXELS / 2 - originX) / scale

  for (const span of intervals) {
    pushMineCartSpanQuads(
      positions,
      uvs,
      colors,
      span,
      worldX,
      originY,
      scale,
      pixelX,
    )
  }
}

export function createMineCartGroundGeometry(
  firstColumn: number,
  columnCount = CHUNK_COLUMNS,
) {
  const positions: number[] = []

  const uvs: number[] = []

  const colors: number[] = []

  const originX = ORIGINAL_MINE_CART_ORIGIN.x

  const originY = ORIGINAL_MINE_CART_ORIGIN.y

  const scale = ORIGINAL_MINE_CART_TERRAIN.pixelsPerWorldUnit

  const maxPixel = Math.min(
    ORIGINAL_MINE_CART_TERRAIN.widthPixels,
    (firstColumn + columnCount) * SNES_METATILE_SIZE_PX,
  )

  for (
    let pixelX = firstColumn * SNES_METATILE_SIZE_PX;
    pixelX < maxPixel;
    pixelX += STRIP_PIXELS
  ) {
    appendMineCartColumnStrip(
      positions,
      uvs,
      colors,
      pixelX,
      originX,
      originY,
      scale,
    )
  }

  const geometry = new BufferGeometry()

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
