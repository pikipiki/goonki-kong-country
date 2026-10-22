import { LEVELS } from '../../levels'
import type { Game } from '../gameSession'
import type { Input } from '../types'
import { applyBossBattleFinish } from './stepFinishBoss'

export function runFinish(game: Game, input: Input): void {
  const player = game.player
  if (game.bossBattle) {
    applyBossBattleFinish(game)
  }
  const zone = game.level.finishZone
  if (game.bonus && player.x >= game.level.length - 2) {
    game.leaveBonus()
  } else if (zone) {
    if (
      player.x >= zone.x - zone.w / 2 &&
      player.x <= zone.x + zone.w / 2 &&
      player.y >= zone.y - 0.6 &&
      player.y <= zone.y + zone.h
    ) {
      game.finish()
    }
  } else if (
    game.levelId !== LEVELS.length - 1 &&
    player.x >= game.level.length - 2
  ) {
    game.finish()
  }
  input.pressed.clear()
  input.released.clear()
}
