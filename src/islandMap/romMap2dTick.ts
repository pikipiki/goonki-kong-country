import type { PlushSpriteRenderer } from '../game2d/plushSprite'
import { romMapLayout } from '../mapLayout'
import { romMapNodes } from './mapData'
import { paintRomMap2dScene } from './romMap2dDraw'
import { resolveRomMapLayout } from './romMap2dLayout'
import { advanceRomTravel, type RomTravelState } from './romMap2dMotion'
import { resizeRomCanvas } from './romMap2dResize'

export type RomMap2dTickInput = {
  canvas: HTMLCanvasElement
  mapImg: HTMLImageElement | null
  plushRenderer: PlushSpriteRenderer
  travel: RomTravelState
  elapsed: number
  frameDelta: number
  selected: number
  unlocked: number
  onProject: (
    points: {
      x: number
      y: number
    }[],
  ) => void
  onSound?: (name: 'map-step' | 'map-arrive') => void
  pan: {
    x: number
    y: number
  }
  follow: number[]
  lastSize: {
    width: number
    height: number
  }
  viewRef: {
    current: ReturnType<typeof romMapLayout> | null
  }
}

export function tickRomMap2dFrame(input: RomMap2dTickInput): number[] {
  const frame = resolveRomMapLayout(input.canvas, input.pan, input.follow)
  input.viewRef.current = {
    ...frame.layout,
    offsetX: frame.offsetX,
    offsetY: frame.offsetY,
  }
  if (
    resizeRomCanvas(
      input.canvas,
      frame.canvasWidth,
      frame.canvasHeight,
      input.lastSize,
    )
  ) {
    input.onProject(frame.layout.labels)
  }
  advanceRomTravel(
    input.travel,
    input.selected,
    input.frameDelta,
    input.elapsed,
    () => {
      input.onSound?.('map-step')
    },
    () => {
      input.onSound?.('map-arrive')
    },
  )
  const ctx = input.canvas.getContext('2d')
  if (!ctx) {
    return [input.travel.posX, input.travel.posY]
  }
  paintRomMap2dScene(
    ctx,
    frame,
    input.mapImg,
    input.travel,
    input.unlocked,
    input.selected,
    input.elapsed,
    input.plushRenderer,
  )
  return [input.travel.posX, input.travel.posY]
}

export function initialRomFollow(initial: number): number[] {
  const anchor = romMapNodes[initial] ?? romMapNodes[0]
  return [anchor[0], anchor[1]]
}
