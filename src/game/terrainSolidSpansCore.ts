import { terrainCellSNES as jungleCell } from './originalTerrain'
import { terrainCellSNES as caveCell } from './canyonTerrain'
import { terrainCellSNES as cartCell } from './originalMineCartTerrain'
import { ORIGINAL_JUNGLE_ORIGIN } from './originalJungle'
import { ORIGINAL_REVERB_ORIGIN } from './originalReverb'
import { ORIGINAL_MINE_CART_ORIGIN } from './originalMineCart'
import { coralSolidSpansWorld } from './originalCoralTerrain'
import { WORLD_PIXELS } from './engine/romPhysics'
import { SNES_HORIZONTAL_METATILE_ROW_COUNT } from './snesCollisionMetatile'

export interface SolidSpan {
  bottom: number
  top: number
}
type CellAt = (
  pixelX: number,
  row: number,
) => {
  floorY: number
} | null
type Origin = {
  x: number
  y: number
}
function cellAtForKind(kind: string): CellAt {
  if (kind === 'cave') {
    return caveCell
  }
  if (kind === 'mineCart') {
    return cartCell
  }
  return jungleCell
}
function originForKind(kind: string): Origin {
  if (kind === 'cave') {
    return ORIGINAL_REVERB_ORIGIN
  }
  if (kind === 'mineCart') {
    return ORIGINAL_MINE_CART_ORIGIN
  }
  return ORIGINAL_JUNGLE_ORIGIN
}
function mergeSpanRow(pixels: SolidSpan[], bottom: number, top: number): void {
  const previous = pixels.at(-1)
  if (previous && bottom <= previous.top + 1) {
    previous.top = Math.max(previous.top, top)
    return
  }
  pixels.push({ bottom, top })
}
/** The same solid metatile intervals as the terrain meshes, without internal seams. */
export function terrainSolidSpans(kind: string, worldX: number): SolidSpan[] {
  if (kind === 'coral') {
    return coralSolidSpansWorld(worldX)
  }
  const cellAt = cellAtForKind(kind)
  const origin = originForKind(kind)
  const pixelX = worldX * WORLD_PIXELS + origin.x
  const pixels: SolidSpan[] = []
  const lastRow = SNES_HORIZONTAL_METATILE_ROW_COUNT - 1
  for (let row = lastRow; row >= 0; row--) {
    const cell = cellAt(pixelX, row)
    if (!cell) {
      continue
    }
    const bottom = (lastRow - row) * WORLD_PIXELS
    const top = cell.floorY
    if (top <= bottom) {
      continue
    }
    mergeSpanRow(pixels, bottom, top)
  }
  return pixels.map((span) => ({
    bottom: (span.bottom - origin.y) / WORLD_PIXELS,
    top: (span.top - origin.y) / WORLD_PIXELS,
  }))
}
