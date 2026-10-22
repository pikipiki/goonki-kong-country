import type { JungleRenderContext } from './jungleRenderContext'
import { renderJungleMovingPlatforms } from './renderJungleMovingPlatforms'

export function renderJungleDecorScene2d(render: JungleRenderContext) {
  const { game, ctx, toPixel, drawer } = render

  const { drawGroupAnim } = drawer

  game.level.breakableWalls?.forEach((wall, wallIdx) => {
    const { px, py } = toPixel(wall.x, wall.y)

    if (game.brokenWalls.has(wallIdx)) {
      if (wallIdx > 0) {
        drawGroupAnim(ctx, 'cave_hole', 0, 1, px + 6, py - 18)
      }
    } else if (wallIdx > 0) {
      drawGroupAnim(ctx, 'breakable_wall', 0, 1, px + 6, py - 18)
    }
  })

  game.level.itemCaches?.forEach((cache, cacheIdx) => {
    if (game.collectedCaches.has(cacheIdx)) {
      return
    }

    const { px, py } = toPixel(cache.x, cache.y)

    if (!game.revealedCaches.has(cacheIdx)) {
      if (cache.y <= 3.0) {
        drawGroupAnim(ctx, 'ground_cover', 0, 1, px, py - 2)
      }

      return
    }

    const bob = Math.sin(game.time * 6 + cacheIdx) * 3

    let amount
    if ('amount' in cache.reward) {
      amount = cache.reward.amount ?? 1
    } else {
      amount = 1
    }

    let cacheSprite
    if (amount > 1) {
      cacheSprite = 'banana_bunch'
    } else {
      cacheSprite = 'banana_spin'
    }

    drawGroupAnim(ctx, cacheSprite, game.time, 10, px, py - 10 + bob)
  })

  game.level.decors?.forEach((decor, decorIdx) => {
    const { px, py } = toPixel(decor.x, decor.y)

    if (decor.kind === 'butterfly') {
      const flutterX = px + Math.sin(game.time * 1.8 + decorIdx) * 10

      const flutterY = py - 8 + Math.cos(game.time * 2.7 + decorIdx) * 6

      drawGroupAnim(
        ctx,
        'butterfly',
        game.time + decorIdx * 0.3,
        12,
        flutterX,
        flutterY,
      )
      return
    }

    if (decor.kind === 'token' && !game.isTokenCollected(decor)) {
      const tokenY = py - 12 + Math.sin(game.time * 3) * 3

      drawGroupAnim(ctx, 'token_expresso', game.time, 1, px, tokenY)
      return
    }

    if (decor.kind === 'sign') {
      let signGroup
      if (decor.x > 160) {
        signGroup = 'sign_exit'
      } else {
        signGroup = 'sign_arrow'
      }

      drawGroupAnim(ctx, signGroup, game.time, 1, px, py - 14)
      return
    }

    if (decor.kind === 'sparkle') {
      drawGroupAnim(ctx, 'sparkle', game.time + decorIdx * 0.25, 12, px, py - 8)
    }
  })

  renderJungleMovingPlatforms(render)
}
