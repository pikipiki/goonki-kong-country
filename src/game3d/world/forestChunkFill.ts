import type { Biome } from '../../game/levels'
import { worldRandom } from './worldPalettes'
import type { WorldInstance } from './worldTypes'

export type ForestChunkBuckets = {
  trunks: WorldInstance[]
  foliage: WorldInstance[]
  ferns: WorldInstance[]
  corals: WorldInstance[]
  roots: WorldInstance[]
  stones: WorldInstance[]
  vines: WorldInstance[]
  extras: WorldInstance[]
}

export function emptyBuckets(): ForestChunkBuckets {
  return {
    trunks: [],
    foliage: [],
    ferns: [],
    corals: [],
    roots: [],
    stones: [],
    vines: [],
    extras: [],
  }
}

function canopyFoliageColor(layer: number, ringIdx: number) {
  if (layer === 2) {
    return '#355a43'
  }

  if (ringIdx % 3 === 0) {
    return '#8baf44'
  }

  return '#518c2a'
}

export function fillShipChunk(chunkX: number, out: ForestChunkBuckets) {
  for (let mastIdx = 0; mastIdx < 2; mastIdx++) {
    out.trunks.push({
      position: [chunkX + mastIdx * 8, 4, -7],
      scale: [0.18, 14, 0.18],
    })
    out.extras.push({
      position: [chunkX + mastIdx * 8 + 1.5, 5.5, -7.2],
      scale: [4, 4.5, 0.12],
      color: '#a9a58a',
    })
  }
}

function fillCaveCell(
  biome: Biome,
  layer: number,
  treeX: number,
  depthZ: number,
  rand: number,
  out: ForestChunkBuckets,
) {
  out.stones.push({
    position: [treeX, layer === 0 ? -1 : 6, depthZ],
    scale: [2 + rand * 2, layer === 0 ? 2 + rand * 3 : 7, 2],
  })

  if (biome === 'temple') {
    out.trunks.push({ position: [treeX, 2.8, depthZ], scale: [0.65, 8, 0.65] })
  } else {
    out.extras.push({
      position: [treeX, 7, depthZ],
      scale: [0.7 + rand, 4 + rand * 4, 1.1],
      rotation: [0, 0, Math.PI],
      color: '#5b5648',
    })
  }
}

function fillSeaCell(
  cellIdx: number,
  treeX: number,
  depthZ: number,
  rand: number,
  out: ForestChunkBuckets,
) {
  out.stones.push({
    position: [treeX, -2.7, depthZ],
    scale: [2.7, 1.3 + rand, 2],
    color: '#557b6b',
  })

  for (let ringIdx = 0; ringIdx < 4; ringIdx++) {
    if (ringIdx === 0) {
      out.corals.push({
        position: [treeX, -2.5, depthZ],
        scale: [0.8 + rand, 1.1 + rand * 1.1, 0.8],
        rotation: [0, rand * 4, 0],
        color: cellIdx % 2 ? '#db8caa' : '#d4af76',
      })
    }

    out.foliage.push({
      position: [treeX + 1.8, -2.7, depthZ],
      scale: [1.1, 0.4, 0.5],
      rotation: [0, ringIdx * 0.3, 1.1 + ringIdx * 0.15],
      color: '#408f6f',
    })
  }
}

function fillSnowCell(treeX: number, depthZ: number, out: ForestChunkBuckets) {
  for (let tier = 0; tier < 4; tier++) {
    out.extras.push({
      position: [treeX, tier * 1.2 + 1, depthZ],
      scale: [2.1 - tier * 0.4, 2.3, 2.1 - tier * 0.4],
      color: tier % 2 ? '#b8d0bf' : '#3d6450',
    })
  }
}

function fillJungleCell(
  layer: number,
  cellIdx: number,
  chunkX: number,
  seed: number,
  treeX: number,
  depthZ: number,
  scale: number,
  treeHeight: number,
  rand: number,
  out: ForestChunkBuckets,
) {
  let trunkWidth
  if (layer === 0) {
    trunkWidth = 0.42
  } else {
    trunkWidth = 0.28
  }

  out.trunks.push({
    position: [treeX + 0.25, treeHeight * 0.48 - 1, depthZ],
    scale: [trunkWidth * scale, treeHeight, trunkWidth * scale],
    rotation: [0, 0, -0.07 + rand * 0.1],
    color: layer === 2 ? '#50715a' : '#b29a64',
  })

  for (let rootIdx = 0; rootIdx < 5; rootIdx++) {
    out.roots.push({
      position: [treeX + (rootIdx - 2) * 0.22, -0.8, depthZ],
      scale: [0.16 + rand * 0.14, 2.1 + rand, 0.28],
      rotation: [
        Math.sin(rootIdx * 1.7) * 0.3,
        rootIdx * 1.3,
        (rootIdx - 2) * 0.3,
      ],
      color: layer === 2 ? '#4e6d4c' : '#947948',
    })
  }

  for (let ringIdx = 0; ringIdx < 7; ringIdx++) {
    out.foliage.push({
      position: [treeX + 0.4, treeHeight - 1, depthZ],
      scale: [
        scale *
          (layer === 0 ? 0.72 : 1) *
          (0.85 + worldRandom(seed + ringIdx) * 0.3),
        scale * (layer === 0 ? 0.8 : 1),
        scale * (layer === 0 ? 0.72 : 1),
      ],
      rotation: [
        0.1 + rand * 0.3,
        (ringIdx * Math.PI * 2) / 7,
        -0.07 + worldRandom(seed + ringIdx) * 0.17,
      ],
      color: canopyFoliageColor(layer, ringIdx),
    })
  }

  if (cellIdx % 2 === 0) {
    out.vines.push({
      position: [treeX + 1, treeHeight - 1, depthZ + 0.6],
      scale: [1, Math.max(0.5, (treeHeight - 1.1) / 1.8), 1],
      color: '#476b2b',
    })
  }

  for (let ringIdx = 0; ringIdx < 5; ringIdx++) {
    out.foliage.push({
      position: [treeX, -1.2, depthZ + 1],
      scale: [0.35 + rand * 0.22, 0.5, 0.6],
      rotation: [0.2, ringIdx * 1.3, -0.1],
      color: '#35652b',
    })
  }
}

export function fillForestLayers(
  chunkX: number,
  biome: Biome,
  cave: boolean,
  sea: boolean,
  snow: boolean,
  out: ForestChunkBuckets,
) {
  for (let layer = 0; layer < 3; layer++) {
    for (let cellIdx = 0; cellIdx < 3; cellIdx++) {
      const seed = chunkX * 21 + cellIdx + layer * 89

      const rand = worldRandom(seed)

      const treeX = chunkX + cellIdx * 5.5 + rand * 2

      const depthZ = -4 - layer * 9 - rand * 4

      const scale = 0.85 + rand * 0.65

      const treeHeight = 5 + layer * 1.3 + rand * 2

      if (cave) {
        fillCaveCell(biome, layer, treeX, depthZ, rand, out)
        continue
      }

      if (sea) {
        fillSeaCell(cellIdx, treeX, depthZ, rand, out)
        continue
      }

      if (snow) {
        fillSnowCell(treeX, depthZ, out)
        continue
      }

      fillJungleCell(
        layer,
        cellIdx,
        chunkX,
        seed,
        treeX,
        depthZ,
        scale,
        treeHeight,
        rand,
        out,
      )
    }
  }
}
