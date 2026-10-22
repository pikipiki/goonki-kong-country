import { pick } from '../utils/pick'
/** Camera changes affect rendering only, never plush sizes or collision bodies. */
export function jungleViewport2D(width: number, height: number) {
  const aspect = width / Math.max(1, height),
    portrait = aspect < 0.95

  let viewHeight
  if (portrait) {
    viewHeight = Math.round(192 / aspect)
  } else {
    viewHeight = 180
  }

  return {
    width: pick(portrait, 192, Math.round(viewHeight * aspect)),
    height: viewHeight,
    portrait,
  }
}

export function bossViewport2D(width: number, height: number) {
  const aspect = width / Math.max(1, height),
    portrait = aspect < 1.14

  let viewHeight
  if (portrait) {
    viewHeight = Math.round(240 / aspect)
  } else {
    viewHeight = 192
  }

  return {
    width: pick(portrait, 240, Math.round(viewHeight * aspect)),
    height: viewHeight,
    worldWidth: pick(portrait, 9, 18),
    portrait,
  }
}

export function bossCameraLeft(
  playerX: number,
  worldWidth: number,
  arenaWidth: number,
) {
  return Math.max(
    -1,
    Math.min(arenaWidth + 1 - worldWidth, playerX - worldWidth * 0.42),
  )
}
