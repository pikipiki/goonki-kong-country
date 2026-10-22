import type { Phase } from '../game/engine'

export function sceneAriaLabel(phase: Phase, demo2D: boolean): string {
  if (demo2D && phase !== 'title' && phase !== 'map') {
    return '2D game scene'
  }
  return '3D game scene'
}
