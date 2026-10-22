import type { Biome } from '../../game/levels'
import type { ForestChunkBuckets } from './forestChunkFill'
import { worldRandom } from './worldPalettes'

function lagoonFernColor(slotIdx: number) {
  if (slotIdx % 3 === 0) {
    return '#b85d86'
  }

  if (slotIdx % 3 === 1) {
    return '#b99754'
  }

  return '#428b62'
}

function fillForegroundSea(
  slotIdx: number,
  treeX: number,
  depthZ: number,
  rand: number,
  out: ForestChunkBuckets,
) {
  for (let ringIdx = 0; ringIdx < 5; ringIdx++) {
    out.ferns.push({
      position: [treeX, -2.6, depthZ],
      scale: [0.55 + rand * 0.38, 1, 0.5],
      rotation: [0.2, ringIdx * 1.17, 0.85 + rand * 0.6],
      color: lagoonFernColor(slotIdx),
    })

    if (ringIdx === 0) {
      out.corals.push({
        position: [treeX, -2.6, depthZ],
        scale: [0.45 + rand * 0.35, 0.7 + rand * 0.65, 0.5],
        rotation: [0, rand * 5, 0],
        color: '#da91ae',
      })
    }
  }
}

function fillForegroundCave(
  biome: Biome,
  treeX: number,
  rand: number,
  out: ForestChunkBuckets,
) {
  const stoneColor = biome === 'temple' ? '#7a7c58' : '#61665c'

  out.stones.push({
    position: [treeX, 1.3 + rand * 2, -8],
    scale: [1.8 + rand, 4.4 + rand * 2, 1.7],
    rotation: [0, rand, rand * 0.25],
    color: stoneColor,
  })
}

function fillForegroundJungle(
  treeX: number,
  depthZ: number,
  rand: number,
  out: ForestChunkBuckets,
) {
  for (let ringIdx = 0; ringIdx < 6; ringIdx++) {
    out.ferns.push({
      position: [treeX, -0.9, depthZ],
      scale: [0.58 + rand * 0.25, 0.8, 0.75],
      rotation: [0.15 + rand * 0.2, ringIdx * 1.05, 0.35 + rand * 0.2],
      color: ringIdx % 3 === 0 ? '#739e35' : '#3f762b',
    })
  }

  for (let ringIdx = 0; ringIdx < 4; ringIdx++) {
    out.ferns.push({
      position: [treeX + 0.4, -1.3, -10 - rand * 5],
      scale: [0.8 + rand * 0.45, 1, 1.1],
      rotation: [0.15, ringIdx * 1.57, 0.4 + rand * 0.35],
      color: '#376942',
    })
  }
}

export function fillForegroundRow(
  chunkX: number,
  biome: Biome,
  cave: boolean,
  sea: boolean,
  out: ForestChunkBuckets,
) {
  for (let slotIdx = 0; slotIdx < 7; slotIdx++) {
    const seed = chunkX * 13 + slotIdx * 37

    const treeX = chunkX + slotIdx * 2.5

    const rand = worldRandom(seed)

    const depthZ = -3.5 - rand * 2

    if (sea) {
      fillForegroundSea(slotIdx, treeX, depthZ, rand, out)
      continue
    }

    if (cave) {
      fillForegroundCave(biome, treeX, rand, out)
      continue
    }

    fillForegroundJungle(treeX, depthZ, rand, out)
  }
}
