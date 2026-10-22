/** Mine Cart Madness collision metadata, extracted read-only from USA Rev2.
 * SHA256: 628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527
 * Reproduce: python3 scripts/analyze_level_tables.py && python3 scripts/generate_original_mine_cart_terrain.py
 * Walkway environment $CB0000; 121 attributes at $F00000. Entrance $27 sets environment 2.
 */
import tiles from './data/mine-cart-tiles.json'
import attributes from './data/mine-cart-attributes.json'
import profiles from './data/collision-profiles.json'
import { createHorizontalTerrain } from './horizontalTerrain'
export { attributes, profiles }
export type { TerrainContact, TerrainOrigin } from './horizontalTerrain'

const terrain = createHorizontalTerrain({
  tiles,
  attributes,
  profiles,
  checkTorso: false,
})
export const ORIGINAL_MINE_CART_TERRAIN = terrain.metadata
export const {
  terrainCellSNES,
  probeSNES,
  query,
  nearestCandidateBelowSNES,
  ceilingSNES,
  ceilingWorld,
  blocksHorizontalWorld,
} = terrain
