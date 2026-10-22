import { clamp } from '../game/engine/math'
import { jungleAtmosphereBlends } from './jungleAtmosphereBlends'
import { type JungleRenderContext } from './jungleRenderContext'
import { drawChunkedLayer } from './drawRom2d'
import { DEFAULT_CHUNK_W } from './scene2dConstants'
function rgbLine(red: number, green: number, blue: number) {
  const channelR = red | 0
  const channelG = green | 0
  const channelB = blue | 0
  return `rgb(${String(channelR)},${String(channelG)},${String(channelB)})`
}

export function renderJungleSkyScene2d(render: JungleRenderContext) {
  const { game, assets, ctx, camX, camY, screenW, screenH } = render
  const { nightBlend, dawnBlend } = jungleAtmosphereBlends(game.player.x)
  const skyDay = assets.manifest.skyDay
  const skyNight = assets.manifest.skyNight
  const skyHeightPx = Math.round(screenH * 0.34)
  const skyHorizLen = Math.min(71, skyDay.length)
  for (let scanY = 0; scanY < skyHeightPx; scanY++) {
    const scanNorm = scanY / Math.max(1, skyHeightPx - 1)
    const dayIdx = Math.min(
      skyHorizLen - 1,
      Math.floor(scanNorm * (skyHorizLen - 1)),
    )
    const nightIdx = Math.min(skyNight.length - 1, Math.floor(scanNorm * 70))
    const dayRgb = skyDay[dayIdx] ?? [224, 216, 128]
    const nightRgb = skyNight[nightIdx] ?? [8, 16, 24]
    const warmR = Math.min(255, dayRgb[0] * 1.06 + scanNorm * 18)
    const warmG = Math.min(255, dayRgb[1] * 0.98 + scanNorm * 8)
    const warmB = Math.max(0, dayRgb[2] * (1 - scanNorm * 0.28))
    let red = warmR * (1 - nightBlend) + nightRgb[0] * nightBlend
    let green = warmG * (1 - nightBlend) + nightRgb[1] * nightBlend
    let blue = warmB * (1 - nightBlend) + nightRgb[2] * nightBlend
    if (dawnBlend > 0) {
      const dawnR = 255 * (1 - scanNorm * 0.25)
      const dawnG = 135 + scanNorm * 95
      const dawnB = 75 + scanNorm * 80
      const mix = dawnBlend * 0.65
      red = red * (1 - mix) + dawnR * mix
      green = green * (1 - mix) + dawnG * mix
      blue = blue * (1 - mix) + dawnB * mix
    }
    ctx.fillStyle = rgbLine(red, green, blue)
    ctx.fillRect(0, scanY, screenW, 1)
  }
  const bgR = Math.round(4 * (1 - nightBlend) + 2 * nightBlend)
  const bgG = Math.round(24 * (1 - nightBlend) + 10 * nightBlend)
  const bgB = Math.round(6 * (1 - nightBlend) + 20 * nightBlend)
  ctx.fillStyle = rgbLine(bgR, bgG, bgB)
  ctx.fillRect(0, skyHeightPx, screenW, screenH - skyHeightPx)
  const skyBandTop = Math.max(0, skyHeightPx - 7)
  const l3ScrollX = Math.floor(camX * 0.25) % 256
  for (let tileX = -l3ScrollX; tileX < screenW; tileX += 256) {
    ctx.drawImage(assets.l3, tileX, skyBandTop)
  }
  const l2ScrollX = Math.floor(camX * 0.5) % 512
  const l2ScrollY = clamp(
    Math.round(screenH - 256 - (camY - 168) * 0.15),
    screenH - 256,
    0,
  )
  for (let tileX = -l2ScrollX; tileX < screenW; tileX += 512) {
    ctx.drawImage(assets.l2, tileX, l2ScrollY)
  }
  const chunkW = assets.manifest.layer1ChunkWidth ?? DEFAULT_CHUNK_W
  drawChunkedLayer(
    ctx,
    assets.l1BackChunks,
    chunkW,
    camX,
    camY,
    screenW,
    screenH,
  )
}
