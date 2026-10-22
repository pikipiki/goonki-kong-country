import type { JungleRenderContext } from './jungleRenderContext'

function drawJunglePickups(render: JungleRenderContext) {
  const { game, ctx, toPixel, drawer } = render

  const { drawGroupAnim } = drawer

  game.level.pickups.forEach((item, pickupIdx) => {
    if (game.collected.has(pickupIdx)) {
      return
    }

    const { px, py } = toPixel(item.x, item.y)

    const bob = Math.sin(game.time * 2.5 + pickupIdx) * 2

    if (item.kind === 'letter') {
      const key = `letter_${(item.letter ?? 'k').toLowerCase()}`

      drawGroupAnim(ctx, key, game.time, 1, px, py + bob)
      return
    }

    if (item.kind === 'balloon') {
      drawGroupAnim(
        ctx,
        'balloon',
        game.time + pickupIdx * 0.2,
        8,
        px,
        py + bob - 4,
      )
      return
    }

    if ((item as { amount?: number }).amount === 10) {
      drawGroupAnim(
        ctx,
        'banana_bunch',
        game.time + pickupIdx * 0.15,
        10,
        px,
        py + bob,
      )
      return
    }

    drawGroupAnim(
      ctx,
      'banana_spin',
      game.time + pickupIdx * 0.1,
      12,
      px,
      py + bob,
    )
  })
}

function drawJungleBarrels(render: JungleRenderContext) {
  const { game, assets, ctx, toPixel, drawer } = render

  const { drawGroupAnim, drawSprite } = drawer

  game.level.barrels.forEach((barrel, barrelIdx) => {
    if (game.usedBarrels.has(barrelIdx)) {
      return
    }

    if (barrel.kind === 'cannon') {
      const cPos = game.cannonPosition(barrelIdx)

      const { px, py } = toPixel(cPos.x, cPos.y)

      const angle = game.cannonAngle(barrelIdx)

      const sector =
        ((Math.round(((angle - Math.PI / 2) / (Math.PI * 2)) * 16) % 16) + 16) %
        16

      let group
      if (barrel.autoFire) {
        group = assets.manifest.groups['cannon_auto']
      } else {
        group = assets.manifest.groups['cannon_normal']
      }

      if (group.length > 0) {
        drawSprite(ctx, group[sector % group.length], px, py)
      }

      return
    }

    const { px, py } = toPixel(barrel.x, barrel.y)

    if (barrel.kind === 'rescue') {
      drawGroupAnim(ctx, 'dk_barrel', game.time + barrelIdx, 10, px, py - 12)
      drawGroupAnim(ctx, 'dk_letters', game.time + barrelIdx, 10, px, py - 12)
      drawGroupAnim(ctx, 'dk_letters', game.time + barrelIdx, 10, px, py - 12)
      return
    }

    if (barrel.kind === 'checkpoint') {
      drawGroupAnim(ctx, 'checkpoint_barrel', game.time, 10, px, py - 12)
      return
    }

    drawGroupAnim(ctx, 'barrel_idle', game.time, 1, px, py - 12)
  })

  if (game.player.carry >= 0) {
    const { px, py } = toPixel(game.player.x, game.player.y + 1.45)

    drawGroupAnim(ctx, 'barrel_idle', game.time, 1, px, py - 8)
  }

  game.thrown.forEach((thrown) => {
    if (!thrown.active) {
      return
    }

    const { px, py } = toPixel(thrown.x, thrown.y)

    drawGroupAnim(ctx, 'barrel_roll', game.time, 18, px, py - 6, thrown.vx < 0)
  })
}

export function renderJunglePickupsBarrelsScene2d(render: JungleRenderContext) {
  drawJunglePickups(render)
  drawJungleBarrels(render)
}
