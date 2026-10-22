import { romMapLayout } from '../mapLayout'
import type { PlushSpriteRenderer } from '../game2d/plushSprite'
import type { RomTravelState } from './romMap2dMotion'
import { romMapNodes } from './mapData'
import { romNodeFill } from './stageRingColor'
import {
  ROM_MAP_ART_HEIGHT,
  ROM_MAP_ART_WIDTH,
  ROM_MAP_BACKDROP,
  ROM_MAP_LEADER_STROKE,
  ROM_MAP_NODE_LABEL_ACTIVE,
  ROM_MAP_NODE_LABEL_LOCKED,
  ROM_MAP_NODE_SHADOW,
  ROM_MAP_STRIPE_EVEN,
  ROM_MAP_STRIPE_ODD,
  ROM_MAP_TRAVELER_STROKE_ACTIVE,
  ROM_MAP_TRAVELER_STROKE_IDLE,
} from './romMapPalette'

export function drawRomBackdrop(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
) {
  ctx.fillStyle = ROM_MAP_BACKDROP
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  for (let row = 0; row < canvasHeight; row += 28) {
    if (row % 56) {
      ctx.fillStyle = ROM_MAP_STRIPE_ODD
    } else {
      ctx.fillStyle = ROM_MAP_STRIPE_EVEN
    }
    ctx.fillRect(0, row, canvasWidth, 2)
  }
}

export function drawRomMapImage(
  ctx: CanvasRenderingContext2D,
  mapImg: HTMLImageElement,
  offsetX: number,
  offsetY: number,
  drawWidth: number,
  drawHeight: number,
) {
  ctx.drawImage(
    mapImg,
    0,
    0,
    ROM_MAP_ART_WIDTH,
    ROM_MAP_ART_HEIGHT,
    offsetX,
    offsetY,
    drawWidth,
    drawHeight,
  )
}

export function drawRomLeaders(
  ctx: CanvasRenderingContext2D,
  layout: ReturnType<typeof romMapLayout>,
  mapScale: number,
  offsetX: number,
  offsetY: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  ctx.strokeStyle = ROM_MAP_LEADER_STROKE
  ctx.lineWidth = 1
  romMapNodes.forEach(([nodeX, nodeY], index) => {
    const screenX = offsetX + nodeX * mapScale
    const screenY = offsetY + nodeY * mapScale
    if (
      screenX < 0 ||
      screenX > canvasWidth ||
      screenY < 0 ||
      screenY > canvasHeight
    ) {
      return
    }
    ctx.beginPath()
    ctx.moveTo(screenX, screenY)
    ctx.lineTo(layout.labels[index].x, layout.labels[index].y)
    ctx.stroke()
  })
}

export function drawRomTrail(
  ctx: CanvasRenderingContext2D,
  mapScale: number,
  offsetX: number,
  offsetY: number,
  unlocked: number,
) {
  for (let segment = 0; segment < romMapNodes.length - 1; segment++) {
    const start = romMapNodes[segment]
    const end = romMapNodes[segment + 1]
    const pathUnlocked = segment < unlocked
    for (let dot = 1; dot <= 6; dot++) {
      const blend = dot / 7
      const dotX = offsetX + (start[0] + (end[0] - start[0]) * blend) * mapScale
      const dotY = offsetY + (start[1] + (end[1] - start[1]) * blend) * mapScale
      ctx.fillStyle = ROM_MAP_NODE_SHADOW
      ctx.beginPath()
      ctx.arc(dotX, dotY, Math.max(2, 2.6 * mapScale), 0, Math.PI * 2)
      ctx.fill()
      if (pathUnlocked) {
        ctx.fillStyle = ROM_MAP_NODE_LABEL_ACTIVE
      } else {
        ctx.fillStyle = ROM_MAP_NODE_LABEL_LOCKED
      }
      ctx.beginPath()
      ctx.arc(dotX, dotY, Math.max(1.2, 1.8 * mapScale), 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

export function drawRomNodes(
  ctx: CanvasRenderingContext2D,
  mapScale: number,
  offsetX: number,
  offsetY: number,
  selected: number,
  unlocked: number,
  elapsed: number,
) {
  romMapNodes.forEach(([nodeX, nodeY], index) => {
    const screenX = offsetX + nodeX * mapScale
    const screenY = offsetY + nodeY * mapScale
    const isSelected = index === selected
    let pulse
    if (isSelected) {
      pulse = 1 + Math.sin(elapsed * 6) * 0.16
    } else {
      pulse = 1
    }
    const radius = Math.max(4, 5.5 * mapScale * pulse)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.beginPath()
    ctx.ellipse(
      screenX,
      screenY + 1.5 * mapScale,
      radius * 1.15,
      radius * 0.65,
      0,
      0,
      Math.PI * 2,
    )
    ctx.fill()

    ctx.fillStyle = romNodeFill(index, selected, unlocked)
    if (isSelected) {
      ctx.strokeStyle = ROM_MAP_TRAVELER_STROKE_ACTIVE
    } else {
      ctx.strokeStyle = ROM_MAP_TRAVELER_STROKE_IDLE
    }
    ctx.lineWidth = Math.max(1.5, 1.4 * mapScale)
    ctx.beginPath()
    ctx.ellipse(screenX, screenY, radius, radius * 0.62, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })
}

export function paintRomMap2dScene(
  ctx: CanvasRenderingContext2D,
  frame: {
    canvasWidth: number
    canvasHeight: number
    layout: ReturnType<typeof romMapLayout>
    mapScale: number
    offsetX: number
    offsetY: number
  },
  mapImg: HTMLImageElement | null,
  travel: RomTravelState,
  unlocked: number,
  selected: number,
  elapsed: number,
  plushRenderer: PlushSpriteRenderer,
) {
  ctx.imageSmoothingEnabled = false
  drawRomBackdrop(ctx, frame.canvasWidth, frame.canvasHeight)
  if (mapImg) {
    drawRomMapImage(
      ctx,
      mapImg,
      frame.offsetX,
      frame.offsetY,
      256 * frame.mapScale,
      224 * frame.mapScale,
    )
  }
  drawRomLeaders(
    ctx,
    frame.layout,
    frame.mapScale,
    frame.offsetX,
    frame.offsetY,
    frame.canvasWidth,
    frame.canvasHeight,
  )
  drawRomTrail(ctx, frame.mapScale, frame.offsetX, frame.offsetY, unlocked)
  drawRomNodes(
    ctx,
    frame.mapScale,
    frame.offsetX,
    frame.offsetY,
    selected,
    unlocked,
    elapsed,
  )
  drawRomPlushies(
    ctx,
    plushRenderer,
    travel,
    frame.mapScale,
    frame.offsetX,
    frame.offsetY,
    elapsed,
  )
}

export function drawRomPlushies(
  ctx: CanvasRenderingContext2D,
  renderer: PlushSpriteRenderer,
  travel: RomTravelState,
  mapScale: number,
  offsetX: number,
  offsetY: number,
  elapsed: number,
) {
  const plushScale = Math.max(0.5, mapScale * 0.28)
  const compX = offsetX + (travel.posX - travel.facing * 11) * mapScale
  const compY = offsetY + (travel.posY - 2 - travel.hopY * 0.85) * mapScale
  renderer.draw(
    ctx,
    compX,
    compY,
    {
      pink: false,
      facing: travel.facing,
      walking: travel.walking,
      grounded: travel.hopY < 1,
      roll: false,
      rollAngle: 0,
      rollFacing: 1,
      cannonFlight: false,
      swapping: false,
      swapHop: travel.hopY > 2 ? 0.5 : 0,
      companion: true,
      riding: false,
      carrying: false,
      celebrating: travel.celebrating,
      time: elapsed,
    },
    plushScale * 0.92,
  )

  const leadX = offsetX + travel.posX * mapScale
  const leadY = offsetY + (travel.posY - travel.hopY) * mapScale
  renderer.draw(
    ctx,
    leadX,
    leadY,
    {
      pink: true,
      facing: travel.facing,
      walking: travel.walking,
      grounded: travel.hopY < 1,
      roll: false,
      rollAngle: 0,
      rollFacing: 1,
      cannonFlight: false,
      swapping: false,
      swapHop: travel.hopY > 2 ? 0.5 : 0,
      companion: false,
      riding: false,
      carrying: false,
      celebrating: travel.celebrating,
      time: elapsed,
    },
    plushScale,
  )
}
