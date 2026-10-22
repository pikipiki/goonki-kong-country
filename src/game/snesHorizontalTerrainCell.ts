import {
  SNES_COLLISION_ATTR_PROFILE_FLAG_MASK,
  SNES_COLLISION_ATTR_VFLIP_BIT,
  SNES_COLLISION_PROFILE_ID_MASK,
  SNES_HORIZONTAL_LAST_ROW_FROM_TOP,
  SNES_HORIZONTAL_LEVEL_MAX_Y_PX,
  SNES_HORIZONTAL_METATILE_ROW_COUNT,
  SNES_METATILE_ID_MASK,
  SNES_METATILE_LOCAL_X_MASK,
  SNES_METATILE_LOCAL_Y_MASK,
  SNES_METATILE_MAP_HFLIP_BIT,
  SNES_METATILE_RIGHT_HALF_BIT,
  SNES_METATILE_SIZE_PX,
  SNES_METATILE_SOLID_HEIGHT_MAX,
} from './snesCollisionMetatile'

/** Rows to scan downward when the selected row has no collision (CODE_8180FF). */
export const SNES_HORIZONTAL_PROBE_EMPTY_ROWS_BELOW = 2

/** Foot lift for horizontal wall probes (world units, pre-scale). */
export const SNES_HORIZONTAL_WALL_PROBE_FOOT_LIFT = 0.2

/** Horizontal offset for ahead-of-feet wall probes (world units). */
export const SNES_HORIZONTAL_WALL_PROBE_OFFSET_X = 0.4

/** Torso height for jungle wall probes (world units above foot). */
export const SNES_HORIZONTAL_WALL_PROBE_TORSO_LIFT = 1

/** SNES pixels: ledge too high when ahead floor exceeds current by this much. */
export const SNES_HORIZONTAL_WALL_STEP_UP_THRESHOLD_PX = 10

/** SNES pixels: torso blocked when ahead floor exceeds feet by this much. */
export const SNES_HORIZONTAL_WALL_TORSO_BLOCK_THRESHOLD_PX = 6

export type HorizontalTerrainCellCore = {
  floorY: number
  x: number
  rowFromTop: number
  tileId: number
  tileWord: number
  attribute: number
  correctedAttribute: number
  profileFlags: number
  profileId: number
  localHeight: number
}

export type HorizontalTerrainCellLookup = (
  pixelX: number,
  rowFromTop: number,
) => Omit<HorizontalTerrainCellCore, never> | null

export function referenceRowFromTopForPixelY(pixelY: number) {
  const clamped = Math.max(
    0,
    Math.min(SNES_HORIZONTAL_LEVEL_MAX_Y_PX, Math.floor(pixelY)),
  )

  return (
    SNES_HORIZONTAL_LAST_ROW_FROM_TOP -
    Math.floor(clamped / SNES_METATILE_SIZE_PX)
  )
}

export function resolveHorizontalTerrainCell(
  pixelX: number,
  rowFromTop: number,
  tileWord: number,
  attributePairs: readonly (readonly number[])[],
  profileSamples: readonly (readonly number[])[],
): HorizontalTerrainCellCore | null {
  const tileId = tileWord & SNES_METATILE_ID_MASK

  if (tileId === 0 || tileId >= attributePairs.length) {
    return null
  }

  let local = Math.floor(pixelX) & SNES_METATILE_LOCAL_X_MASK

  if (tileWord & SNES_METATILE_MAP_HFLIP_BIT) {
    local ^= SNES_METATILE_LOCAL_X_MASK
  }

  const attribute =
    attributePairs[tileId][local & SNES_METATILE_RIGHT_HALF_BIT ? 1 : 0]

  if (attribute & SNES_COLLISION_ATTR_VFLIP_BIT) {
    local ^= SNES_METATILE_LOCAL_Y_MASK
  }

  const profileId = attribute & SNES_COLLISION_PROFILE_ID_MASK

  if (profileId === 0 || !profileSamples[profileId]) {
    return null
  }

  const localHeight =
    profileSamples[profileId][local & SNES_METATILE_LOCAL_Y_MASK]

  if (localHeight < 0) {
    return null
  }

  const correctedAttribute =
    attribute ^
    (tileWord & SNES_METATILE_MAP_HFLIP_BIT ? SNES_COLLISION_ATTR_VFLIP_BIT : 0)

  return {
    floorY:
      (SNES_HORIZONTAL_LAST_ROW_FROM_TOP - rowFromTop) * SNES_METATILE_SIZE_PX +
      localHeight,
    x: pixelX,
    rowFromTop,
    tileId,
    tileWord,
    attribute,
    correctedAttribute,
    profileFlags: correctedAttribute & SNES_COLLISION_ATTR_PROFILE_FLAG_MASK,
    profileId,
    localHeight,
  }
}

export function probeHorizontalTerrainSNES(
  pixelX: number,
  pixelY: number,
  cellAt: HorizontalTerrainCellLookup,
): (HorizontalTerrainCellCore & { referenceRowFromTop: number }) | null {
  if (!Number.isFinite(pixelX) || !Number.isFinite(pixelY)) {
    return null
  }

  const referenceRowFromTop = referenceRowFromTopForPixelY(pixelY)

  let contact = cellAt(pixelX, referenceRowFromTop)

  if (contact?.localHeight === SNES_METATILE_SOLID_HEIGHT_MAX) {
    const above = cellAt(pixelX, referenceRowFromTop - 1)

    if (above) {
      contact = above
    }
  } else if (!contact) {
    for (let step = 1; step <= SNES_HORIZONTAL_PROBE_EMPTY_ROWS_BELOW; step++) {
      contact = cellAt(pixelX, referenceRowFromTop + step)

      if (contact) {
        break
      }
    }
  }

  if (contact) {
    return { ...contact, referenceRowFromTop }
  } else {
    return null
  }
}

export function nearestCandidateBelowHorizontalTerrainSNES(
  pixelX: number,
  pixelY: number,
  cellAt: HorizontalTerrainCellLookup,
): (HorizontalTerrainCellCore & { referenceRowFromTop: number }) | null {
  if (!Number.isFinite(pixelX) || !Number.isFinite(pixelY)) {
    return null
  }

  let best: HorizontalTerrainCellCore | null = null

  for (let row = 0; row < SNES_HORIZONTAL_METATILE_ROW_COUNT; row++) {
    const candidate = cellAt(pixelX, row)

    if (
      candidate &&
      candidate.floorY <= pixelY &&
      (!best || candidate.floorY > best.floorY)
    ) {
      best = candidate
    }
  }

  if (best) {
    return {
      ...best,
      referenceRowFromTop: referenceRowFromTopForPixelY(pixelY),
    }
  } else {
    return null
  }
}

export function ceilingHorizontalTerrainSNES(
  pixelX: number,
  pixelY: number,
  cellAt: HorizontalTerrainCellLookup,
): number | null {
  if (!Number.isFinite(pixelX) || !Number.isFinite(pixelY)) {
    return null
  }

  let ceiling: number | null = null

  for (let row = 0; row < SNES_HORIZONTAL_METATILE_ROW_COUNT; row++) {
    const cell = cellAt(pixelX, row)

    if (!cell || cell.localHeight < 0) {
      continue
    }

    if (cell.floorY > pixelY && (ceiling === null || cell.floorY < ceiling)) {
      ceiling = cell.floorY
    }
  }

  return ceiling
}

export function blocksHorizontalTerrainWorld(
  probeAt: (pixelX: number, pixelY: number) => HorizontalTerrainCellCore | null,
  scale: number,
  xWorld: number,
  footWorld: number,
  dir: -1 | 1,
  originX: number,
  originY: number,
  options?: { checkTorso?: boolean },
) {
  const footLift = SNES_HORIZONTAL_WALL_PROBE_FOOT_LIFT

  const here = probeAt(
    xWorld * scale + originX,
    (footWorld + footLift) * scale + originY,
  )

  if (!here) {
    return false
  }

  const edgePx =
    (xWorld + dir * SNES_HORIZONTAL_WALL_PROBE_OFFSET_X) * scale + originX

  const feetPy = (footWorld + footLift) * scale + originY

  const aheadFeet = probeAt(edgePx, feetPy)

  if (
    aheadFeet &&
    aheadFeet.floorY > here.floorY + SNES_HORIZONTAL_WALL_STEP_UP_THRESHOLD_PX
  ) {
    return true
  }

  if (!options?.checkTorso) {
    return false
  }

  const torsoPy =
    (footWorld + SNES_HORIZONTAL_WALL_PROBE_TORSO_LIFT) * scale + originY

  const aheadTorso = probeAt(edgePx, torsoPy)

  return !!(
    aheadTorso &&
    aheadTorso.floorY > feetPy + SNES_HORIZONTAL_WALL_TORSO_BLOCK_THRESHOLD_PX
  )
}
