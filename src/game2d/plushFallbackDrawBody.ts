import { BODY_PROFILE } from '../game3d/plushGoonk/profile'
import { themeColors } from '../game3d/theme'
import type { PlushPoseState } from './plushSprite'
import { pick } from '../utils/pick'

const plush = themeColors.plush

function drawPlushFallbackEye(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.fillStyle = plush.eyeWhite
  ctx.beginPath()
  ctx.ellipse(scale * 0.11, -scale * 0.16, 2.6, 3.4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = plush.eyeInk
  ctx.beginPath()
  ctx.ellipse(scale * 0.13, -scale * 0.15, 1.5, 2.0, 0, 0, Math.PI * 2)
  ctx.fill()
}

export function drawPlushFallbackBody(
  ctx: CanvasRenderingContext2D,
  state: PlushPoseState,
  scale: number,
  animTime: number,
  walking: number,
  pink: boolean,
) {
  let swing
  if (walking > 0.1) {
    swing = Math.sin(animTime * walking * 2.1) * 4
  } else {
    swing = 0
  }

  const bodyCol = pick(pink, plush.fabricPink, plush.fabricPurple)
  const sheenCol = pick(pink, plush.sheenPink, plush.sheenPurple)
  const stitchCol = pick(pink, plush.stitchPink, plush.stitchPurple)

  ctx.fillStyle = stitchCol
  ctx.beginPath()
  ctx.ellipse(-3 - swing, scale * 0.38, 5, 3.2, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = bodyCol
  ctx.beginPath()

  for (let seg = 0; seg <= 20; seg++) {
    const point = BODY_PROFILE.getPoint(seg / 20)

    const pointX = point.x * scale

    const pointY = (0.42 - point.y) * scale

    if (seg === 0) {
      ctx.moveTo(pointX, pointY)
    } else {
      ctx.lineTo(pointX, pointY)
    }
  }

  for (let seg = 20; seg >= 0; seg--) {
    const point = BODY_PROFILE.getPoint(seg / 20)

    ctx.lineTo(-point.x * scale, (0.42 - point.y) * scale)
  }

  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = sheenCol
  ctx.beginPath()
  ctx.ellipse(2, 0, scale * 0.18, scale * 0.24, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = bodyCol
  ctx.beginPath()
  ctx.ellipse(
    scale * 0.26,
    -scale * 0.02,
    scale * pick(pink, 0.18, 0.15),
    scale * 0.08,
    0.32,
    0,
    Math.PI * 2,
  )
  ctx.fill()

  if (pink) {
    ctx.strokeStyle = plush.tuftYellow
    ctx.lineWidth = 1.6

    for (let tuft = -2; tuft <= 2; tuft++) {
      ctx.beginPath()
      ctx.moveTo(tuft * 1.2, -scale * 0.35)
      ctx.lineTo(tuft * 2.2, -scale * 0.45)
      ctx.stroke()
    }
  }

  drawPlushFallbackEye(ctx, scale)

  ctx.fillStyle = bodyCol
  const armY = pick(state.carrying, -scale * 0.28, 2 + swing * 0.5)

  ctx.beginPath()
  ctx.ellipse(-1 + swing * 0.5, armY, 3.2, 6.5, -0.25, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(3 + swing, scale * 0.39, 5.2, 3.4, 0, 0, Math.PI * 2)
  ctx.fill()
}
