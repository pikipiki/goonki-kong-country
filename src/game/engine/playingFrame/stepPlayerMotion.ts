import type { Game } from '../gameSession'
import type { Input } from '../types'
import type { PlayingEnv } from './playingEnv'
import { applyPlayerHorizontalMotion } from './playerMotionHorizontal'
import { applyPlayerVerticalMotion } from './playerMotionVertical'

export function runPlayerMotion(
  game: Game,
  input: Input,
  deltaTime: number,
  env: PlayingEnv,
): void {
  applyPlayerHorizontalMotion(game, input, deltaTime, env)
  applyPlayerVerticalMotion(game, input, deltaTime, env)
}
