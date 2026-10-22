import { camera2D } from '../config/presentation.json'

/** Camera changes affect rendering only, never plush sizes or collision bodies. */
export function jungleViewport2D(width: number, height: number) {
  const aspect = width / Math.max(1, height),
    portrait = aspect < camera2D.jungle.portraitAspect

  let viewHeight
  if (portrait) {
    viewHeight = Math.round(camera2D.jungle.portraitWidthPixels / aspect)
  } else {
    viewHeight = camera2D.jungle.landscapeHeightPixels
  }

  return {
    width: portrait
      ? camera2D.jungle.portraitWidthPixels
      : Math.round(viewHeight * aspect),
    height: viewHeight,
    portrait,
  }
}

export function bossViewport2D(width: number, height: number) {
  const aspect = width / Math.max(1, height),
    portrait = aspect < camera2D.boss.portraitAspect

  let viewHeight
  if (portrait) {
    viewHeight = Math.round(camera2D.boss.portraitWidthPixels / aspect)
  } else {
    viewHeight = camera2D.boss.landscapeHeightPixels
  }

  return {
    width: portrait
      ? camera2D.boss.portraitWidthPixels
      : Math.round(viewHeight * aspect),
    height: viewHeight,
    worldWidth: portrait
      ? camera2D.boss.portraitWorldWidth
      : camera2D.boss.landscapeWorldWidth,
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
    Math.min(
      arenaWidth + 1 - worldWidth,
      playerX - worldWidth * camera2D.boss.playerAnchorRatio,
    ),
  )
}
