import type { OrthographicCamera } from 'three'
import type { Game } from '../game/engine'
import { cameraLayout } from '../game/camera'
import { pick } from '../utils/pick'

export function titleCameraZoom(portrait: boolean): number {
  if (portrait) {
    return 10.5
  }
  return 8
}

export function applyDirectorCamera({
  engine,
  camera,
  size,
  delta,
  focus,
  lastLevel,
}: {
  engine: Game
  camera: OrthographicCamera
  size: { width: number; height: number }
  delta: number
  focus: { current: number }
  lastLevel: { current: number }
}) {
  const title = engine.phase === 'title'
  const layout = cameraLayout(size.width, size.height, title)
  let desired
  if (title) {
    desired = titleCameraZoom(layout.portrait)
  } else {
    desired = engine.player.x + layout.ahead
  }
  if (
    lastLevel.current !== engine.levelId ||
    Math.abs(focus.current - desired) > 18
  ) {
    focus.current = desired
    lastLevel.current = engine.levelId
  }
  focus.current += (desired - focus.current) * (1 - Math.exp(-delta * 5))
  const bossArena = !title && engine.level.biome === 'ship'
  const wideBossArena = bossArena && !layout.portrait
  if (wideBossArena) {
    camera.zoom = Math.min(layout.zoom, size.width / 24, size.height / 9)
  } else {
    camera.zoom = layout.zoom
  }
  if (wideBossArena) {
    focus.current = 11
  } else if (bossArena) {
    focus.current = Math.max(
      layout.worldWidth / 2 - 1,
      Math.min(engine.level.length + 1 - layout.worldWidth / 2, focus.current),
    )
  }
  const depthFollow =
    Boolean(engine.level.originalTerrain) || (bossArena && layout.portrait)
  let followY = 0
  if (depthFollow && Math.abs(engine.player.y) > 1.2) {
    followY = engine.player.y - Math.sign(engine.player.y) * 1.5
  }
  const lookY = layout.lookY + followY
  const cameraY = lookY + 2.25
  engine.cameraBounds = {
    x: focus.current,
    y: lookY,
    halfX: pick(
      wideBossArena,
      size.width / camera.zoom / 2,
      layout.worldWidth / 2,
    ),
    halfY: pick(
      wideBossArena,
      size.height / camera.zoom / 2,
      layout.worldHeight / 2 + 0.5,
    ),
  }
  camera.position.set(focus.current, cameraY, 22)
  camera.lookAt(focus.current, lookY, 0)
  camera.updateProjectionMatrix()
}
