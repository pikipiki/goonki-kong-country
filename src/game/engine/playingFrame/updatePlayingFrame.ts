import { type Game } from '../gameSession'
import { type Input } from '../types'
import { runMineAndClock } from './stepMineAndClock'
import { runCannonAndActions } from './stepCannonAndActions'
import { runPlayerMotion } from './stepPlayerMotion'
import { runPlayerResolve } from './stepPlayerResolve'
import { runWorldInteract } from './stepWorldInteract'
import { runEnemies } from './stepEnemies'
import { runFinish } from './stepFinish'
export function updatePlayingFrame(
  game: Game,
  input: Input,
  deltaTime: number,
): void {
  if (game.phase !== 'playing') {
    return
  }
  const env = runMineAndClock(game, input, deltaTime)
  if (runCannonAndActions(game, input, deltaTime, env)) {
    return
  }
  runPlayerMotion(game, input, deltaTime, env)
  if (runPlayerResolve(game, input, deltaTime, env)) {
    return
  }
  runWorldInteract(game, input, deltaTime)
  runEnemies(game, input, deltaTime, env)
  runFinish(game, input)
}
