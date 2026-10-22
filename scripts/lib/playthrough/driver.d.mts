import type { Game, Input, Key } from '../../../src/game/engine'

export function packGame(game: Game): Record<string, unknown>
export function offlineGame(
  constructor: typeof Game,
  state: Game | Record<string, unknown>,
): Game
export function inputTransition(
  factory: () => Input,
  previous: Key[],
  next: Key[],
): Input
export function assertPrediction(expected: Game, actual: Game): void
