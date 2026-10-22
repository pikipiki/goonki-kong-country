import { BOSS_CARRY } from '../game/bossArena'
import { SCENE2D_PIXELS_PER_WORLD } from './scene2dConstants'
import { type BossPaintContext } from './bossScene2dPaintTypes'
import { drawBossBarrel } from './bossScene2dPaintBarrels'
export function paintBossPlush(paint: BossPaintContext) {
  const { ctx, game, plush, toCanvasX, toCanvasY, scale } = paint
  const player = game.player
  const plushScale = scale / SCENE2D_PIXELS_PER_WORLD
  const pose = (pink: boolean, facing: number, companion: boolean) => ({
    pink,
    facing,
    walking: Math.abs(player.vx),
    grounded: player.grounded,
    roll: !companion && player.roll > 0,
    rollAngle: player.rollAngle,
    rollFacing: player.rollFacing,
    cannonFlight: player.launched > 0,
    swapping: false,
    swapHop: 0,
    companion,
    riding: false,
    carrying: !companion && player.carry >= 0,
    celebrating: game.phase === 'clear' || game.phase === 'victory',
    time: game.time,
  })
  if (player.hp === 2) {
    plush.draw(
      ctx,
      toCanvasX(game.companion.x),
      toCanvasY(game.companion.y),
      pose(player.active !== 0, game.companion.facing, true),
      plushScale,
    )
  }
  if (!(player.invincible > 0 && Math.sin(game.time * 34) < -0.45)) {
    plush.draw(
      ctx,
      toCanvasX(player.x),
      toCanvasY(player.y),
      pose(player.active === 0, player.facing, false),
      plushScale,
    )
  }
  if (player.carry >= 0) {
    drawBossBarrel(
      ctx,
      paint.assets,
      game.level.barrels[player.carry]?.kind ?? 'throw',
      toCanvasX(player.x + player.facing * BOSS_CARRY.x),
      toCanvasY(player.y + BOSS_CARRY.y),
      'centre',
      game.time,
      scale,
    )
  }
}
