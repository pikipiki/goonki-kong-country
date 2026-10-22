import { camera3D as camera } from '../config/presentation.json'

/** Frame both the landing area and the player; UI safe areas live outside this viewport. */
export function cameraLayout(width: number, height: number, title = false) {
  const portrait = width / Math.max(1, height) < camera.portraitAspect

  let landscapeMinWidth
  if (portrait) {
    landscapeMinWidth = camera.portraitMinWorldWidth
  } else {
    landscapeMinWidth = camera.landscapeMinWorldWidth
  }

  let worldWidth
  if (title) {
    worldWidth = width / (height / camera.titleWorldHeight)
  } else {
    worldWidth = Math.max(
      landscapeMinWidth,
      (width / Math.max(1, height)) * camera.landscapeWorldHeight,
    )
  }

  let zoom
  if (title) {
    zoom = height / camera.titleWorldHeight
  } else {
    zoom = width / worldWidth
  }

  const worldHeight = height / zoom

  return {
    portrait,
    zoom,
    worldWidth,
    worldHeight,
    ahead:
      portrait && !title
        ? camera.portraitAhead
        : Math.min(camera.maxAhead, worldWidth * camera.aheadRatio),
    lookY: title
      ? camera.titleLookY
      : Math.max(camera.minLookY, worldHeight * camera.lookYRatio),
  }
}
