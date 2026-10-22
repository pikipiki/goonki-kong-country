import { LEVELS } from '../levels'
import type { Game } from './gameSession'

function priorBest(game: Game, levelKey: string) {
  if (Object.prototype.hasOwnProperty.call(game.save.best, levelKey)) {
    return game.save.best[levelKey]
  } else {
    return undefined
  }
}

export function finishLevel(game: Game) {
  if (game.phase !== 'playing') {
    return
  }

  if (game.levelId === LEVELS.length - 1) {
    game.phase = 'victory'
  } else {
    game.phase = 'clear'
  }
  game.save.unlocked = Math.max(
    game.save.unlocked,
    Math.min(LEVELS.length - 1, game.levelId + 1),
  )
  const levelKey = String(game.levelId)

  const previous = priorBest(game, levelKey)

  game.save.best[levelKey] = {
    bananas: Math.max(previous?.bananas ?? 0, game.levelBananas),
    letters: Math.max(previous?.letters ?? 0, game.letters.size),
    time: Math.min(previous?.time ?? Infinity, game.time),
  }
  game.onSave(game.save)
  game.onEvent('clear')
}
