import { WORLD_PIXELS } from '../game/engine/romPhysics'
import { type Game } from '../game/engine'
export const SCREEN_H = 224
export const LEVEL_W = 5408
export const LEVEL_H = 512
export const DEFAULT_CHUNK_W = 2048
/** Letterbox padding when fitting the SNES playfield into wider canvases. */
export const SCENE2D_VIEWPORT_PAD_PX = 32
export interface TransientFx {
  x: number
  y: number
  vx: number
  vy: number
  gravity: number
  group: string
  fps: number
  age: number
  duration: number
  flipX: boolean
}

/** World units → SNES pixels for jungle / ROM 2D scenes. */
export const SCENE2D_PIXELS_PER_WORLD = WORLD_PIXELS

/** Jungle level bitmap: world Y=0 sits on this scanline (512px-tall ROM buffer). */
export const SCENE2D_JUNGLE_BASE_PY = 337

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
