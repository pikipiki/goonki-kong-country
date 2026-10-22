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
