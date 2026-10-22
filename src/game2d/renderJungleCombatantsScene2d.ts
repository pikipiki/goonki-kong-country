import type { Animal } from '../game/animals'
import type { Enemy } from '../game/engine/types'
import { drawChunkedLayer, drawPlushCast } from './drawRom2d'
import type { JungleRenderContext } from './jungleRenderContext'
import type { Scene2dSpriteDrawer } from './scene2dSpriteDraw'
import { DEFAULT_CHUNK_W } from './scene2dConstants'
import { hurtFlashVisible } from '../game/hurtFlash'
import { pick } from '../utils/pick'

function rambiAnimGroup(animal: Animal, game: JungleRenderContext['game']) {
  const moving =
    animal.state === 'fleeing' ||
    (animal.state === 'ridden' && Math.abs(game.player.vx) > 0.25)

  const attacking = animal.state === 'ridden' && game.player.mountAttack > 0

  const jumping = animal.state === 'ridden' && !game.player.grounded

  if (attacking) {
    return 'rambi_attack'
  }

  if (jumping) {
    return 'rambi_jump'
  }

  if (moving) {
    return 'rambi_walk'
  }

  return 'rambi_idle'
}

function drawJungleEnemies(
  game: JungleRenderContext['game'],
  ctx: CanvasRenderingContext2D,
  toPixel: JungleRenderContext['toPixel'],
  drawGroupAnim: Scene2dSpriteDrawer['drawGroupAnim'],
) {
  game.enemies.forEach((enemy: Enemy) => {
    if (!enemy.alive) {
      return
    }

    if (enemy.hurt > 0 && !hurtFlashVisible(game.time)) {
      return
    }

    const { px, py } = toPixel(enemy.x, enemy.y)

    if (enemy.pattern === 'necky') {
      const flipX = game.player.x > enemy.x

      drawGroupAnim(ctx, 'necky_throw', enemy.timer, 8, px, py - 14, flipX)
      return
    }

    if (enemy.kind === 'beetle') {
      drawGroupAnim(
        ctx,
        'gnawty_walk',
        enemy.timer,
        12,
        px,
        py - 10,
        enemy.vx < 0,
      )
      return
    }

    if (enemy.kind === 'armored') {
      drawGroupAnim(
        ctx,
        'klump_walk',
        enemy.timer,
        10,
        px,
        py - 16,
        enemy.vx < 0,
      )
      return
    }

    drawGroupAnim(
      ctx,
      'kritter_walk',
      enemy.timer,
      11,
      px,
      py - 15,
      enemy.vx < 0,
    )
  })
}

export function renderJungleCombatantsScene2d(render: JungleRenderContext) {
  const {
    game,
    assets,
    ctx,
    camX,
    camY,
    screenW,
    screenH,
    plushRenderer,
    toPixel,
    drawer,
    fxList,
  } = render

  const { drawGroupAnim, drawSprite } = drawer

  const chunkW = assets.manifest.layer1ChunkWidth ?? DEFAULT_CHUNK_W

  game.animals.forEach((animal) => {
    if (animal.y <= -7) {
      return
    }

    const { px, py } = toPixel(animal.x, animal.y)

    if (animal.state === 'crate') {
      const boxFrames = assets.manifest.groups['rambi_box']

      if (boxFrames.length > 0) {
        drawSprite(ctx, boxFrames[0], px, py - 14)
      }

      return
    }

    const flipX = animal.facing < 0

    const moving =
      animal.state === 'fleeing' ||
      (animal.state === 'ridden' && Math.abs(game.player.vx) > 0.25)

    drawGroupAnim(
      ctx,
      rambiAnimGroup(animal, game),
      game.time,
      pick(moving, 16, 8),
      px,
      py - 12,
      flipX,
    )
  })

  drawJungleEnemies(game, ctx, toPixel, drawGroupAnim)

  game.enemyShots.forEach((shot) => {
    if (!shot.active) {
      return
    }

    const { px, py } = toPixel(shot.x, shot.y)

    drawGroupAnim(ctx, 'necky_nut', game.time, 14, px, py, shot.vx > 0)
  })

  drawPlushCast(ctx, game, plushRenderer, toPixel, camX, camY)

  fxList.forEach((effect) => {
    drawGroupAnim(
      ctx,
      effect.group,
      effect.age,
      effect.fps,
      effect.x,
      effect.y,
      effect.flipX,
      false,
    )
  })

  drawChunkedLayer(
    ctx,
    assets.l1FrontChunks,
    chunkW,
    camX,
    camY,
    screenW,
    screenH,
  )
}
