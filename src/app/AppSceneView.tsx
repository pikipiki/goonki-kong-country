import { BossScene2D } from '../game2d/BossScene2D'
import { Scene2D } from '../game2d/Scene2D'
import type { Game, Input, Phase } from '../game/engine'
import { Scene } from '../Scene'

export function AppSceneContent({
  phase,
  demo2D,
  game,
  input,
  onTick,
}: {
  phase: Phase
  demo2D: boolean
  game: Game
  input: Input
  onTick: () => void
}) {
  if (phase === 'map' || phase === 'clear') {
    return null
  }
  if (demo2D && phase !== 'title') {
    if (game.levelId === 6) {
      return <BossScene2D game={game} input={input} onTick={onTick} />
    }
    return <Scene2D game={game} input={input} onTick={onTick} />
  }
  return <Scene game={game} input={input} onTick={onTick} />
}
