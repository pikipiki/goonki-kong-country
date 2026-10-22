import type { Game } from '../gameSession'
import type { Input } from '../types'
import { collectLevelPickups } from './worldInteractPickups'
import { interactLevelBarrels } from './worldInteractBarrels'
import {
  simulateEnemyShots,
  simulateThrownBarrels,
} from './worldInteractThrown'
export function runWorldInteract(
  game: Game,
  input: Input,
  deltaTime: number,
): void {
  const player = game.player
  collectLevelPickups(game, player)
  interactLevelBarrels(game, player)
  simulateThrownBarrels(game, player, deltaTime)
  simulateEnemyShots(game, player, deltaTime)
}
