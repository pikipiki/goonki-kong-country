import type { BossBattle, BossProjectile } from '../game/bossBattle'
import type { Game } from '../game/engine'
import { PlushSpriteRenderer } from './plushSprite'
import type { BossAssets } from './bossScene2dAssets'

export type BossPaintContext = {
  ctx: CanvasRenderingContext2D
  game: Game
  assets: BossAssets | null
  plush: PlushSpriteRenderer
  width: number
  height: number
  floor: number
  scale: number
  roomCentre: number
  roomScale: number
  toCanvasX: (worldX: number) => number
  toCanvasY: (worldY: number) => number
  bossBattle?: BossBattle | null
  bossProjectiles?: BossProjectile[]
}
