import { pick } from '../utils/pick'
/** Frame both the landing area and the player; UI safe areas live outside this viewport. */
export function cameraLayout(width: number, height: number, title = false) {
  const portrait = width / height < 0.9

  let landscapeMinWidth
  if (portrait) {
    landscapeMinWidth = 8.2
  } else {
    landscapeMinWidth = 15.5
  }

  let worldWidth
  if (title) {
    worldWidth = width / (height / 12.8)
  } else {
    worldWidth = Math.max(landscapeMinWidth, (width / height) * 9.7)
  }

  let zoom
  if (title) {
    zoom = height / 12.8
  } else {
    zoom = width / worldWidth
  }

  const worldHeight = height / zoom

  return {
    portrait,
    zoom,
    worldWidth,
    worldHeight,
    ahead: pick(portrait && !title, 1.45, Math.min(3.7, worldWidth * 0.2)),
    lookY: pick(title, 2.7, Math.max(1.9, worldHeight * 0.19)),
  }
}
