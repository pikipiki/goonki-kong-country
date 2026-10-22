import type { Game } from '../game/engine'
import {
  SCENE2D_JUNGLE_BASE_PY,
  SCENE2D_PIXELS_PER_WORLD,
} from './scene2dWorldUnits'

export function toScenePixel(game: Game, worldX: number, worldY: number) {
  if (game.bonus) {
    return {
      px: (worldX / 16) * 212 + 22,
      py: 192 - worldY * 26,
    }
  }
  return {
    px: worldX * SCENE2D_PIXELS_PER_WORLD,
    py: SCENE2D_JUNGLE_BASE_PY - worldY * SCENE2D_PIXELS_PER_WORLD,
  }
}
