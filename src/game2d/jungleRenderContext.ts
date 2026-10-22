import type { Game } from '../game/engine'
import type { Assets2D } from './assets2d'
import type { PlushSpriteRenderer } from './plushSprite'
import type { Scene2dSpriteDrawer } from './scene2dSpriteDraw'
import type { TransientFx } from './scene2dConstants'

export type ToScenePixel = (
  worldX: number,
  worldY: number,
) => {
  px: number
  py: number
}

export type JungleRenderContext = {
  game: Game
  assets: Assets2D
  ctx: CanvasRenderingContext2D
  camX: number
  camY: number
  screenW: number
  screenH: number
  plushRenderer: PlushSpriteRenderer
  toPixel: ToScenePixel
  drawer: Scene2dSpriteDrawer
  fxList: TransientFx[]
}
