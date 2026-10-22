import type { JungleRenderContext } from './jungleRenderContext'

export function renderJungleMovingPlatforms(render: JungleRenderContext) {
  const { game, ctx, toPixel, drawer } = render

  game.level.platforms.forEach((plat) => {
    if (plat.kind !== 'moving') {
      return
    }

    const pyWorld = game.surface(plat)

    const { px, py } = toPixel(plat.x, pyWorld)

    drawer.drawGroupAnim(ctx, 'platform', game.time, 1, px, py + 4)
  })
}
