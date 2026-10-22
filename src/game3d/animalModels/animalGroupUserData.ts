import type { Object3D } from 'three'

export type AnimalGroupUserData = {
  phase?: number
  amplitude?: number
  side?: number
}
function readData(node: Object3D): AnimalGroupUserData {
  return node.userData as AnimalGroupUserData
}

export function readAnimalPhase(node: Object3D): number {
  return readData(node).phase ?? 0
}

export function readStrideAmplitude(node: Object3D): number {
  return readData(node).amplitude ?? 0.025
}

export function readWingSide(node: Object3D): number {
  return readData(node).side ?? 1
}
