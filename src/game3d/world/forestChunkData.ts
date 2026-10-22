import type { Biome } from '../../game/levels'
import { worldRandom } from './worldPalettes'
import {
  emptyBuckets,
  fillForestLayers,
  fillShipChunk,
  type ForestChunkBuckets,
} from './forestChunkFill'
import { fillForegroundRow } from './forestChunkForeground'

export type { ForestChunkBuckets } from './forestChunkFill'

export function buildForestChunkData(
  chunkX: number,
  biome: Biome,
): ForestChunkBuckets {
  const out = emptyBuckets()
  const cave = biome === 'mine' || biome === 'temple'
  const sea = biome === 'lagoon'
  const snow = biome === 'snow'
  const ship = biome === 'ship'
  if (ship) {
    fillShipChunk(chunkX, out)
    return out
  }
  fillForestLayers(chunkX, biome, cave, sea, snow, out)
  if (!snow) {
    fillForegroundRow(chunkX, biome, cave, sea, out)
  }
  if (!cave && !sea) {
    for (let rockIdx = 0; rockIdx < 5; rockIdx++) {
      out.stones.push({
        position: [chunkX + rockIdx * 3.4, -3, -23],
        scale: [5, 6 + worldRandom(rockIdx + chunkX) * 5, 3],
        color: '#284c32',
      })
    }
  }
  return out
}
