import type { Game, Phase } from '../game/engine'

export function runPhasePrimaryAction(
  phase: Phase,
  demo2D: boolean,
  game: Game,
  change: (action: () => void) => void,
  start: (levelId?: number) => void,
  startDemo2D: (levelId?: number) => void,
  showClearedMap: () => void,
) {
  if (phase === 'paused') {
    change(() => {
      game.pause()
    })
    return
  }
  if (demo2D && phase !== 'clear') {
    startDemo2D(game.levelId)
    return
  }
  if (phase === 'clear') {
    showClearedMap()
    return
  }
  let levelId
  if (phase === 'gameover') {
    levelId = game.levelId
  } else {
    levelId = 0
  }
  start(levelId)
}
