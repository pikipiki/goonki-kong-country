import type { Game } from '../gameSession'
import { spawnAnimalsAndCompanion, spawnPlayer } from './spawnPlayerAndAnimals'
import { spawnLevelEnemies } from './spawnLevelEnemies'

export function spawnLevelPopulation(
  game: Game,
  startX: number,
  floor: number,
): void {
  spawnPlayer(game, startX, floor)
  spawnAnimalsAndCompanion(game, startX, floor)
  spawnLevelEnemies(game, startX, floor)
}
