import type { Game } from '../gameSession'
import type { Input } from '../types'
import type { PlayingEnv } from './playingEnv'
import { applyMineBeeRecovery } from './mineRecoveryStep'
import { tickParticles, tickPlayerTimers } from './playerClockTimers'
import { runTeamSwap } from './teamSwapStep'

export function runMineAndClock(
  game: Game,
  input: Input,
  deltaTime: number,
): PlayingEnv {
  applyMineBeeRecovery(game)
  game.time += deltaTime
  game.bonusDoorCooldown = Math.max(0, game.bonusDoorCooldown - deltaTime)
  game.toastTimer = Math.max(0, game.toastTimer - deltaTime)
  tickParticles(game, deltaTime)
  const water = game.level.biome === 'lagoon'
  const cart =
    game.level.originalTerrain === 'mineCart' ||
    (game.level.biome === 'mine' && game.level.originalTerrain !== 'cave')
  tickPlayerTimers(game, input, deltaTime, cart)
  const swapping = runTeamSwap(game, input, deltaTime)
  return { water, cart, swapping, chargeable: false, oldX: 0, oldY: 0 }
}
