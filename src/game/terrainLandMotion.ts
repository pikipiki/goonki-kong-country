import { terrainSolidSpans } from './terrainSolidSpansCore'

type LandBody = { radius: number; height: number }

function horizontalWallBlocks(
  walls: readonly { bottom: number; top: number }[],
  curY: number,
  targetY: number,
  stepHeight: number,
  maxBottom: number,
): boolean {
  return walls.some(
    (span) =>
      span.top > curY + stepHeight &&
      span.bottom < maxBottom &&
      span.top > Math.min(curY, targetY) + 0.1,
  )
}

function sweepLandX(
  kind: string,
  oldX: number,
  targetX: number,
  targetY: number,
  grounded: boolean,
  startY: number,
  body: LandBody,
  stepHeight: number,
): { nextX: number; curY: number; blockedX: boolean } {
  const steps = Math.max(1, Math.ceil(Math.abs(targetX - oldX) / 0.04))

  const dir = Math.sign(targetX - oldX)

  let nextX = oldX

  let curY = startY

  let blockedX = false

  for (let step = 1; step <= steps; step++) {
    const probeX = oldX + ((targetX - oldX) * step) / steps

    if (grounded && dir !== 0) {
      for (const offset of [0, 0.08, 0.16, body.radius - 0.04]) {
        const stepTops = terrainSolidSpans(kind, probeX + dir * offset)
          .filter((span) => span.top > curY && span.top <= curY + stepHeight)
          .map((span) => span.top)

        if (stepTops.length) {
          curY = Math.max(...stepTops)
        }
      }
    }

    const edge = probeX + dir * body.radius

    const walls = terrainSolidSpans(kind, edge)

    const maxBottom = grounded ? curY + 0.5 : curY + body.height - 0.03

    if (horizontalWallBlocks(walls, curY, targetY, stepHeight, maxBottom)) {
      blockedX = true
      break
    }

    nextX = probeX
  }

  return { nextX, curY, blockedX }
}

function landVerticalFromSpans(
  spans: readonly { bottom: number; top: number }[],
  curY: number,
  targetY: number,
  oldY: number,
  grounded: boolean,
  velocityY: number,
  height: number,
): { nextY: number; landed: boolean; blockedY: boolean } {
  let nextY = targetY

  let landed = false

  let blockedY = false

  if (velocityY <= 0) {
    const tops = spans
      .filter(
        (span) =>
          span.top <= curY + (grounded ? 0.45 : 0.12) &&
          span.top >= Math.min(targetY, curY) - 0.001,
      )
      .map((span) => span.top)

    if (tops.length) {
      nextY = Math.max(...tops)
      landed = true
      blockedY = true
    } else if (grounded) {
      const below = spans
        .filter((span) => span.top <= curY && span.top >= curY - 0.45)
        .map((span) => span.top)

      if (below.length) {
        nextY = Math.max(...below)
        landed = true
        blockedY = true
      }
    }
  } else {
    const roofs = spans
      .filter(
        (span) =>
          span.bottom >= oldY + height - 0.02 &&
          span.bottom <= targetY + height,
      )
      .map((span) => span.bottom)

    if (roofs.length) {
      nextY = Math.min(...roofs) - height
      blockedY = true
    }
  }

  return { nextY, landed, blockedY }
}

export function resolveLandMotion(
  kind: string,
  oldX: number,
  oldY: number,
  worldX: number,
  worldY: number,
  grounded: boolean,
  velocityY: number,
  body: LandBody = { radius: 0.3, height: 1.35 },
): {
  x: number
  y: number
  grounded: boolean
  blockedX: boolean
  blockedY: boolean
} {
  let stepHeight
  if (grounded) {
    stepHeight = 0.45
  } else {
    stepHeight = 0.02
  }

  const { nextX, curY, blockedX } = sweepLandX(
    kind,
    oldX,
    worldX,
    worldY,
    grounded,
    oldY,
    body,
    stepHeight,
  )

  const spans = [
    nextX - body.radius + 0.04,
    nextX,
    nextX + body.radius - 0.04,
  ].flatMap((sampleX) => terrainSolidSpans(kind, sampleX))

  const vertical = landVerticalFromSpans(
    spans,
    curY,
    worldY,
    oldY,
    grounded,
    velocityY,
    body.height,
  )

  return {
    x: nextX,
    y: vertical.nextY,
    grounded: vertical.landed,
    blockedX,
    blockedY: vertical.blockedY,
  }
}
