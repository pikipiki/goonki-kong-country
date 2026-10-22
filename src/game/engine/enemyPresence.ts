import { hurtFlashVisible } from '../hurtFlash'
import type { Game } from './gameSession'
import type { Enemy, Input } from './types'

export const emptyInput = (): Input => ({
  held: new Set(),
  pressed: new Set(),
  released: new Set(),
})
/** Padded for portrait, landscape, camera look-ahead and enemy body size.
 * Activate before rendering, never hide an enemy already inside the play area. */
export function enemyViewportBand() {
  return { halfX: 28, halfY: 24, simHalfX: 36, simHalfY: 30 }
}

export function enemyVisibleToCamera(game: Game, enemy: Enemy, margin = 1) {
  if (!enemy.alive) {
    return false
  }
  const band = enemyViewportBand(),
    bounds = game.cameraBounds
  const anchorX = bounds?.x ?? game.player.x,
    anchorY = bounds?.y ?? game.player.y
  return (
    Math.abs(enemy.x - anchorX) <= (bounds?.halfX ?? band.halfX) * margin + 2 &&
    Math.abs(enemy.y - anchorY) <= (bounds?.halfY ?? band.halfY) * margin + 3
  )
}

export function enemySimulationActive(game: Game, enemy: Enemy) {
  if (!enemy.alive) {
    return false
  }
  const band = enemyViewportBand(),
    bounds = game.cameraBounds
  // Include the player too while the camera catches up after a respawn.
  return (
    enemyVisibleToCamera(game, enemy) ||
    (Math.abs(enemy.x - game.player.x) <=
      (bounds?.halfX ?? band.simHalfX) + 8 &&
      Math.abs(enemy.y - game.player.y) <= (bounds?.halfY ?? band.simHalfY) + 8)
  )
}
/** Damage flashing must never override death or camera visibility. */
export function enemyRenderVisible(
  enemy: Enemy,
  time: number,
  game?: Game,
  preview = false,
) {
  return (
    preview ||
    (enemy.alive &&
      (!game || enemyVisibleToCamera(game, enemy)) &&
      (enemy.hurt <= 0 || hurtFlashVisible(time)))
  )
}
