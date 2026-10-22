import { resolveI18nKey } from '../../i18n/resolveText'
import type { Game } from './gameSession'
import type { Phase } from './types'
import { resetLevelSession } from './gameLoadLevel/resetLevelSession'
import { spawnLevelPopulation } from './gameLoadLevel/spawnLevelPopulation'
import { spawnStartFloor } from './gameLoadLevel/spawnPlayerAndAnimals'

export function loadGameLevel(
  game: Game,
  levelId: number,
  phase: Phase = 'playing',
): void {
  resetLevelSession(game, levelId, phase)
  const { startX, floor } = spawnStartFloor(game)
  spawnLevelPopulation(game, startX, floor)
  game.enemyShots = []
  game.message(resolveI18nKey(game.level.tip), 6)
}
