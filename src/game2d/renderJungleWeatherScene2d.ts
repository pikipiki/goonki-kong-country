import { jungleAtmosphereBlends } from './jungleAtmosphereBlends'
import type { JungleRenderContext } from './jungleRenderContext'

export function renderJungleWeatherScene2d(render: JungleRenderContext) {
  const { game, ctx, screenW, screenH } = render
  const { nightBlend, dawnBlend } = jungleAtmosphereBlends(game.player.x)
  if (nightBlend > 0.02) {
    ctx.save()
    ctx.fillStyle = `rgba(8, 22, 46, ${(nightBlend * 0.42).toFixed(2)})`
    ctx.fillRect(0, 0, screenW, screenH)
    ctx.restore()
  }
  if (dawnBlend > 0.02) {
    ctx.save()
    ctx.fillStyle = `rgba(255, 165, 85, ${(dawnBlend * 0.14).toFixed(2)})`
    ctx.fillRect(0, 0, screenW, screenH)
    ctx.restore()
  }
  if (nightBlend <= 0.15) {
    return
  }
  ctx.save()
  ctx.strokeStyle = `rgba(185, 215, 255, ${(nightBlend * 0.42).toFixed(2)})`
  ctx.lineWidth = 1
  const rainStep = Math.floor(game.time * 240)
  ctx.beginPath()
  for (let drop = 0; drop < 42; drop++) {
    const rainX = ((drop * 73 - rainStep + screenW * 10) % (screenW + 32)) - 16
    const rainY = ((drop * 47 + rainStep * 1.4) % (screenH + 24)) - 12
    ctx.moveTo(rainX, rainY)
    ctx.lineTo(rainX - 5, rainY + 10)
  }
  ctx.stroke()
  const flashCycle = (game.time * 0.45) % 1
  if (flashCycle > 0.96) {
    ctx.fillStyle = `rgba(235, 245, 255, ${(nightBlend * 0.28).toFixed(2)})`
    ctx.fillRect(0, 0, screenW, screenH)
  }
  ctx.restore()
}
