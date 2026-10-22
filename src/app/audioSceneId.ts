import type { Game } from '../game/engine'

export function resolveAudioScene(game: Game): string {
  if (game.bonus) {
    return 'bonus'
  }
  if (game.level.originalTerrain === 'cave') {
    return 'cave'
  }
  return game.level.biome
}
