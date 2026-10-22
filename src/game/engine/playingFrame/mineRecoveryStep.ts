import { mineEncounterClearance, mineBirdHasCloseBee } from '../../routeSafety'
import type { Game } from '../gameSession'

export function applyMineBeeRecovery(game: Game) {
  if (game.level.originalTerrain !== 'mineCart') {
    return
  }
  if (game.mineRecoveryLayout === 1) {
    return
  }
  const layout = mineEncounterClearance(game.level.enemies)
  for (const bird of game.level.enemies.filter((spec) =>
    mineBirdHasCloseBee(spec, game.level.enemies),
  )) {
    for (const beeSpec of layout.filter(
      (spec) =>
        spec.kind === 'bee' &&
        spec.pattern !== 'necky' &&
        spec.x > bird.x &&
        spec.x - bird.x < 12,
    )) {
      const actor = game.enemies.find(
        (enemy) =>
          enemy.kind === 'bee' &&
          enemy.pattern !== 'necky' &&
          Math.abs(enemy.x - beeSpec.x) < 0.65,
      )
      if (actor) {
        actor.originY = beeSpec.y
        actor.y = beeSpec.y
        actor.hoverAmplitude = 0
      }
    }
  }
  game.mineRecoveryLayout = 1
}
