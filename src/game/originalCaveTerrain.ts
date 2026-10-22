/** Barrel Cannon Canyon collision metadata (legacy module filename), extracted read-only from USA Rev2.
 * SHA256: 628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527
 * Reproduce: python3 scripts/analyze_level_tables.py && python3 scripts/generate_original_cave_terrain.py
 * Jungle environment $D90000; 234 jungle attributes. Verified entrance $17 sets environment 0.
 */
import tiles from './data/canyon-tiles.json'
import attributes from './data/jungle-attributes.json'
import profiles from './data/collision-profiles.json'
import { createHorizontalTerrain } from './horizontalTerrain'
export { attributes, profiles }
export type { TerrainContact, TerrainOrigin } from './horizontalTerrain'

const terrain = createHorizontalTerrain({
  tiles,
  attributes,
  profiles,
  checkTorso: true,
})
export const ORIGINAL_CAVE_TERRAIN = terrain.metadata
export const {
  terrainCellSNES,
  probeSNES,
  query,
  nearestCandidateBelowSNES,
  ceilingSNES,
  ceilingWorld,
  blocksHorizontalWorld,
} = terrain
