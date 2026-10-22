import { clamp } from '../game/engine/math'
import type { Game } from '../game/engine'
import type { Assets2D } from './assets2d'

type HudManifest = Assets2D['manifest']

function drawHudFrame(
  ctx: CanvasRenderingContext2D,
  sprites: HTMLImageElement,
  frames: HudManifest['frames'],
  frameIdx: number | undefined,
  destX: number,
  destY: number,
) {
  if (frameIdx === undefined) {
    return
  }

  const frame = frames.at(frameIdx)

  if (frame === undefined) {
    return
  }

  ctx.drawImage(
    sprites,
    frame.x,
    frame.y,
    frame.w,
    frame.h,
    destX,
    destY,
    frame.w,
    frame.h,
  )
}

export function drawRomHudKong(
  ctx: CanvasRenderingContext2D,
  assets: Assets2D,
  game: Game,
  screenW: number,
  hudY: number,
  isPortrait: boolean,
) {
  const { frames, groups } = assets.manifest

  const kongDark = groups.hud_kong_dark

  const kongLit = groups.hud_kong_lit

  const letters = ['K', 'O', 'N', 'G']

  let kongStartX
  if (isPortrait) {
    kongStartX = Math.round(screenW * 0.5 - 12)
  } else {
    kongStartX = Math.round(screenW * 0.5 - 36)
  }

  for (let index = 0; index < 4; index++) {
    const found = [...game.letters].some(
      (pickupIndex) =>
        game.level.pickups[pickupIndex]?.letter === letters[index],
    )

    const darkFrame = kongDark[index]

    const litFrame = kongLit[index]

    let frameIdx
    if (found) {
      frameIdx = litFrame
    } else {
      frameIdx = darkFrame
    }

    drawHudFrame(
      ctx,
      assets.sprites,
      frames,
      frameIdx,
      kongStartX + index * 17,
      hudY,
    )
  }

  return { kongStartX }
}

export function drawRomHudBananas(
  ctx: CanvasRenderingContext2D,
  assets: Assets2D,
  game: Game,
  kongStartX: number,
  hudY: number,
  isPortrait: boolean,
) {
  const { frames, groups } = assets.manifest

  const digits = groups.hud_digits

  const bananaGroup = groups.banana_spin

  let bananaX
  if (isPortrait) {
    bananaX = kongStartX - 42
  } else {
    bananaX = kongStartX - 54
  }

  if (bananaGroup.length > 0) {
    const frameIdx =
      bananaGroup[Math.floor(game.time * 10) % bananaGroup.length]

    drawHudFrame(ctx, assets.sprites, frames, frameIdx, bananaX, hudY)
  }

  if (digits.length === 10) {
    const bananaStr = String(clamp(game.bananas, 0, 999)).padStart(2, '0')

    for (let index = 0; index < bananaStr.length; index++) {
      const digit = Number(bananaStr[index]) || 0

      drawHudFrame(
        ctx,
        assets.sprites,
        frames,
        digits[digit],
        bananaX + 18 + index * 9,
        hudY,
      )
    }
  }
}

export function drawRomHudLives(
  ctx: CanvasRenderingContext2D,
  assets: Assets2D,
  game: Game,
  kongStartX: number,
  hudY: number,
) {
  const { frames, groups } = assets.manifest

  const digits = groups.hud_digits

  const balloonGroup = groups.hud_balloon

  const rightX = kongStartX + 72

  if (balloonGroup.length > 0) {
    const frameIdx =
      balloonGroup[Math.floor(game.time * 6) % balloonGroup.length]

    const frame = frames.at(frameIdx)

    if (frame !== undefined) {
      ctx.drawImage(
        assets.sprites,
        frame.x,
        frame.y,
        frame.w,
        Math.min(22, frame.h),
        rightX,
        hudY - 4,
        frame.w,
        Math.min(22, frame.h),
      )
    }
  }

  if (digits.length === 10) {
    const livesStr = String(clamp(game.lives, 0, 99)).padStart(2, '0')

    for (let index = 0; index < livesStr.length; index++) {
      const digit = Number(livesStr[index]) || 0

      drawHudFrame(
        ctx,
        assets.sprites,
        frames,
        digits[digit],
        rightX + 17 + index * 9,
        hudY,
      )
    }
  }
}
