import { useMemo } from 'react'
import { Game } from '../game/engine'
import { Controls } from '../game/input'
import { GameControls } from '../components/GameControls'

export function GameControlsFixture({ levelId = 0 }: { levelId?: number }) {
  const { game, controls } = useMemo(() => {
    const nextGame = new Game()
    nextGame.start(levelId)
    return { game: nextGame, controls: new Controls() }
  }, [levelId])
  return <GameControls game={game} controls={controls} />
}
