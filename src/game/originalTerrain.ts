/** Original Jungle Hijinxs collision metadata, extracted read-only from USA Rev2.
 * SHA256: 628147468c3539283197f58f03b94df49758a332831857481ea9cc31645f0527
 * Reproduce source metadata: python3 scripts/analyze_level_tables.py
 * Numeric tables only; no original graphics/music or emulator code.
 * Probe follows verified CODE_81800D / CODE_8180FF and bounded neighbour checks.
 * It does NOT implement player collision resolution, dynamic platforms or hazards.
 */
import tiles from './data/jungle-tiles.json'
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
export const ORIGINAL_TERRAIN = terrain.metadata
export const {
  terrainCellSNES,
  probeSNES,
  query,
  nearestCandidateBelowSNES,
  ceilingSNES,
  ceilingWorld,
  blocksHorizontalWorld,
} = terrain
