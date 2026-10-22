/** Rev2 marine addressing is row-major (128-byte rows), with its own 197
 * attribute pairs and marine profile table. See coral-terrain-v2.json. */
import data from '../../reference/coral-terrain-v2.json'
import { pick } from '../utils/pick'
import type { TerrainOrigin } from './originalTerrain'
import { CORAL_PIXELS_PER_WORLD_UNIT } from './marineScale'
import {
  SNES_COLLISION_ATTR_PROFILE_FLAG_MASK,
  SNES_COLLISION_ATTR_VFLIP_BIT,
  SNES_COLLISION_PROFILE_ID_MASK,
  SNES_MARINE_COLLISION_PROFILE_CEILING_BIT,
  SNES_MARINE_ROM_Y_BAND_HEIGHT_PX,
  SNES_METATILE_ID_MASK,
  SNES_METATILE_LOCAL_X_MASK,
  SNES_METATILE_LOCAL_Y_MASK,
  SNES_METATILE_MAP_HFLIP_BIT,
  SNES_METATILE_RIGHT_HALF_BIT,
  SNES_METATILE_SIZE_PX,
  SNES_METATILE_SOLID_HEIGHT_MAX,
} from './snesCollisionMetatile'

/** World-space tolerances for coral collision queries (not ROM constants). */
const CORAL_FLOOR_QUERY_Y_EPSILON = 0.1
const CORAL_CEILING_HEAD_EPSILON = 0.02
const CORAL_HORIZONTAL_PROBE_OFFSET_X = 0.4
const CORAL_WALL_PROBE_FEET_CLEARANCE = 0.05
const CORAL_WALL_PROBE_HEADROOM = 1.55

export const ORIGINAL_CORAL_TERRAIN = Object.freeze({
  tileSizePixels: SNES_METATILE_SIZE_PX,
  heightPixels: data.maxRomYExclusive - data.minRomY,
  widthPixels: data.widthPixels,
  pixelsPerWorldUnit: CORAL_PIXELS_PER_WORLD_UNIT,
  sourcePixelsPerUnit: SNES_METATILE_SIZE_PX,
  marineOriginY: data.originY,
  rows: data.columns[0].length,
})
export const coralRomYFromWeb = (y: number) =>
  data.originY + y * CORAL_PIXELS_PER_WORLD_UNIT
export const coralWebYFromRom = (y: number) =>
  (y - data.originY) / CORAL_PIXELS_PER_WORLD_UNIT
export function marineBandLocal(romY: number) {
  const rel = romY - data.minRomY

  const band = Math.floor(rel / SNES_MARINE_ROM_Y_BAND_HEIGHT_PX)

  return {
    band,
    local: rel - band * SNES_MARINE_ROM_Y_BAND_HEIGHT_PX,
  }
}

export function coralTerrainCellSNES(px: number, row: number) {
  if (
    !Number.isFinite(px) ||
    row < 0 ||
    row >= ORIGINAL_CORAL_TERRAIN.rows ||
    px < 0 ||
    px >= data.widthPixels
  ) {
    return null
  }

  const index = ORIGINAL_CORAL_TERRAIN.rows - 1 - row

  const tileWord = data.columns[Math.floor(px / SNES_METATILE_SIZE_PX)][index],
    tileId = tileWord & SNES_METATILE_ID_MASK

  if (!tileId || tileId >= data.attributes.length) {
    return null
  }

  let local = Math.floor(px) & SNES_METATILE_LOCAL_X_MASK

  if (tileWord & SNES_METATILE_MAP_HFLIP_BIT) {
    local ^= SNES_METATILE_LOCAL_X_MASK
  }

  let attributeIndex
  if (local & SNES_METATILE_RIGHT_HALF_BIT) {
    attributeIndex = 1
  } else {
    attributeIndex = 0
  }

  const attribute = data.attributes[tileId][attributeIndex]

  if (attribute & SNES_COLLISION_ATTR_VFLIP_BIT) {
    local ^= SNES_METATILE_LOCAL_Y_MASK
  }

  const profileId = attribute & SNES_COLLISION_PROFILE_ID_MASK

  if (!profileId || !data.profiles[profileId]) {
    return null
  }

  const ceiling = !!(profileId & SNES_MARINE_COLLISION_PROFILE_CEILING_BIT),
    raw = data.profiles[profileId][local & SNES_METATILE_LOCAL_Y_MASK]

  let height
  if (ceiling) {
    height = SNES_METATILE_SOLID_HEIGHT_MAX - raw
  } else {
    height = raw
  }

  if (
    (!ceiling && height <= 0) ||
    (ceiling && height >= SNES_METATILE_SIZE_PX)
  ) {
    return null
  }

  const base = data.minRomY + index * SNES_METATILE_SIZE_PX

  const { romBottom, romTop } = coralCellRomSpan(base, ceiling, height)

  const flipMask = pick(
    !!(tileWord & SNES_METATILE_MAP_HFLIP_BIT),
    SNES_COLLISION_ATTR_VFLIP_BIT,
    0,
  )

  return {
    floorY: base + height,
    romBottom,
    romTop,
    localHeight: height,
    ceiling,
    x: px,
    rowFromTop: row,
    tileId,
    tileWord,
    attribute,
    profileId,
    profileFlags: attribute & SNES_COLLISION_ATTR_PROFILE_FLAG_MASK,
    correctedAttribute: attribute ^ flipMask,
  }
}

function coralCellRomSpan(
  base: number,
  ceiling: boolean,
  height: number,
): { romBottom: number; romTop: number } {
  if (ceiling) {
    return {
      romBottom: base + Math.max(0, height),
      romTop: base + SNES_METATILE_SIZE_PX,
    }
  }

  return { romBottom: base, romTop: base + height }
}

export function coralSolidSpansWorld(x: number) {
  const spans: { bottom: number; top: number }[] = []

  for (let row = ORIGINAL_CORAL_TERRAIN.rows - 1; row >= 0; row--) {
    const cell = coralTerrainCellSNES(x * CORAL_PIXELS_PER_WORLD_UNIT, row)

    if (!cell) {
      continue
    }

    const bottom = coralWebYFromRom(cell.romBottom),
      top = coralWebYFromRom(cell.romTop),
      last = spans[spans.length - 1]

    if (
      spans.length > 0 &&
      bottom <= last.top + 1 / CORAL_PIXELS_PER_WORLD_UNIT
    ) {
      last.top = Math.max(last.top, top)
    } else {
      spans.push({ bottom, top })
    }
  }

  return spans
}

export function queryCoral(x: number, y: number, origin: TerrainOrigin) {
  const spans = coralSolidSpansWorld(x + origin.x - origin.x)
    .filter((s) => s.top <= y + CORAL_FLOOR_QUERY_Y_EPSILON)
    .sort((a, b) => b.top - a.top)

  if (spans[0]) {
    return {
      floorY: spans[0].top,
      originalFloorY: coralRomYFromWeb(spans[0].top),
    }
  } else {
    return null
  }
}

export function probeCoralSNES(px: number, py: number) {
  return queryCoral(px / CORAL_PIXELS_PER_WORLD_UNIT, coralWebYFromRom(py), {
    x: 0,
    y: data.originY,
  })
}

export function ceilingCoralWorld(
  x: number,
  head: number,
  origin: TerrainOrigin,
) {
  const spans = coralSolidSpansWorld(x + origin.x - origin.x)
    .filter((s) => s.bottom >= head - CORAL_CEILING_HEAD_EPSILON)
    .sort((a, b) => a.bottom - b.bottom)

  return spans[0]?.bottom ?? null
}

export function blocksCoralHorizontal(
  x: number,
  feet: number,
  dir: -1 | 1,
  origin: TerrainOrigin,
  options?: { swim?: boolean },
) {
  const headroom = options?.swim
    ? CORAL_WALL_PROBE_HEADROOM + 0.15
    : CORAL_WALL_PROBE_HEADROOM

  return coralSolidSpansWorld(
    x + dir * CORAL_HORIZONTAL_PROBE_OFFSET_X + origin.x - origin.x,
  ).some(
    (s) =>
      s.top > feet + CORAL_WALL_PROBE_FEET_CLEARANCE &&
      s.bottom < feet + headroom,
  )
}
