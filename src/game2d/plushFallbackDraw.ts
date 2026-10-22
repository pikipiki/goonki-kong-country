import type { PlushPoseState } from './plushSprite'
import { drawPlushFallbackBody } from './plushFallbackDrawBody'

export function drawPlushFallback2D(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  state: PlushPoseState,
  userScale = 1,
) {
  const {
    pink,
    facing,
    walking,
    grounded,
    roll,
    rollAngle,
    time: animTime,
  } = state

  const scale = (pink ? 42 : 39) * (state.riding ? 0.78 : 1) * userScale

  let bounce
  if (grounded) {
    bounce =
      Math.abs(Math.sin(animTime * walking * 2.1)) *
      Math.min(2.5, walking * 0.5)
  } else {
    bounce = 1
  }

  ctx.save()
  ctx.translate(
    Math.round(screenX),
    Math.round(screenY - scale * 0.39 + 3 * userScale - bounce),
  )

  if (roll) {
    ctx.rotate(-rollAngle * state.rollFacing)
  } else if (state.cannonFlight) {
    ctx.rotate(animTime * 14 * facing)
  }

  ctx.scale(facing < 0 ? -1 : 1, 1)

  drawPlushFallbackBody(ctx, state, scale, animTime, walking, pink)
  ctx.restore()
}
