import type { Platform } from '../../game/levels'
import { worldRandom } from './worldPalettes'
import type { WorldInstance } from './worldTypes'

function rockEdgeColor(edgeIdx: number) {
  if (edgeIdx % 3 === 0) {
    return '#8c8265'
  }

  if (edgeIdx % 2) {
    return '#78644c'
  }

  return '#a18357'
}

export type GroundInstanceBuckets = {
  edge: WorldInstance[]
  rocks: WorldInstance[]
  roots: WorldInstance[]
  plants: WorldInstance[]
  planks: WorldInstance[]
}

export function buildGroundInstances(
  platform: Platform,
): GroundInstanceBuckets {
  const edge: WorldInstance[] = []

  const rocks: WorldInstance[] = []

  const roots: WorldInstance[] = []

  const plants: WorldInstance[] = []

  const planks: WorldInstance[] = []

  for (let edgeIdx = 0; edgeIdx < Math.ceil(platform.w * 1.7); edgeIdx++) {
    const localX = -platform.w / 2 + edgeIdx * 0.59

    const rand = worldRandom(edgeIdx + platform.x)

    edge.push({
      position: [localX, -0.15 - rand * 0.04, 1.6],
      scale: [0.42 + rand * 0.2, 0.14 + rand * 0.1, 0.3],
      rotation: [0, rand * 2, rand * 0.1],
      color: edgeIdx % 3 === 0 ? '#718b2a' : '#4d6e23',
    })
    rocks.push({
      position: [localX, -0.55 - rand * 0.7, 1.47],
      scale: [0.48 + rand * 0.3, 0.45 + rand * 0.7, 0.38],
      rotation: [rand * 0.3, rand * 3, rand * 0.8],
      color: rockEdgeColor(edgeIdx),
    })
  }

  for (let rootIdx = 0; rootIdx < Math.floor(platform.w / 3); rootIdx++) {
    roots.push({
      position: [-platform.w / 2 + rootIdx * 3 + 0.6, -0.15, 1.68],
      scale: [1, 1 + worldRandom(rootIdx) * 1.2, 1],
    })
  }

  for (let plantIdx = 0; plantIdx < Math.ceil(platform.w / 2); plantIdx++) {
    for (let ringIdx = 0; ringIdx < 4; ringIdx++) {
      plants.push({
        position: [-platform.w / 2 + plantIdx * 2, -0.02, -2.5],
        scale: [0.2, 0.26, 0.32],
        rotation: [0, ringIdx * 1.5, -0.2],
        color: '#5c8a27',
      })
    }
  }

  for (let plankIdx = 0; plankIdx < Math.ceil(platform.w / 0.7); plankIdx++) {
    planks.push({
      position: [-platform.w / 2 + plankIdx * 0.7, -0.04, 0],
      scale: [0.64, 0.16, 3.4],
      color: plankIdx % 2 ? '#8b6537' : '#aa8145',
    })
  }

  return { edge, rocks, roots, plants, planks }
}
