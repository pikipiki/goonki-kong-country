import { useEffect, type RefObject } from 'react'
import { PlushSpriteRenderer, loadPlushAtlas } from '../game2d/plushSprite'
import { createRomTravelState } from './romMap2dMotion'
import { initialRomFollow, tickRomMap2dFrame } from './romMap2dTick'

type RomRefs = {
  selected: number
  unlocked: number
  onSelect: (index: number) => void
  onProject: (
    points: {
      x: number
      y: number
    }[],
  ) => void
  onSound?: (name: 'map-step' | 'map-arrive') => void
}
function romAssetBase(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env.BASE_URL) {
    return import.meta.env.BASE_URL
  }
  return '/'
}

export function useRomMap2dAnimation(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  initial: number,
  refs: RefObject<RomRefs>,
  pan: RefObject<{
    x: number
    y: number
  }>,
  viewRef: RefObject<ReturnType<
    typeof import('../mapLayout').romMapLayout
  > | null>,
) {
  useEffect(() => {
    let active = true
    let raf = 0
    const plushRenderer = new PlushSpriteRenderer()
    void loadPlushAtlas().then((atlas) => {
      if (active) plushRenderer.setAtlas(atlas)
    })
    let mapImg: HTMLImageElement | null = null
    const img = new Image()
    img.onload = () => {
      if (active) {
        mapImg = img
      }
    }
    img.src = `${romAssetBase().replace(/\/?$/, '/')}rom2d/map-kongo.png`
    const travel = createRomTravelState(initial)
    let lastTime = performance.now()
    let elapsed = 0
    const lastSize = { width: 0, height: 0 }
    let follow = initialRomFollow(initial)
    let lastSelected = initial
    const step = (now: number) => {
      if (!active) {
        return
      }
      raf = requestAnimationFrame(step)
      const frameDelta = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      elapsed += frameDelta
      const canvas = canvasRef.current
      const romRefs = refs.current
      if (!canvas) {
        return
      }
      const { selected, unlocked, onProject, onSound } = romRefs
      if (lastSelected !== selected) {
        pan.current.x = 0
        pan.current.y = 0
        lastSelected = selected
      }
      follow = tickRomMap2dFrame({
        canvas,
        mapImg,
        plushRenderer,
        travel,
        elapsed,
        frameDelta,
        selected,
        unlocked,
        onProject,
        onSound,
        pan: pan.current,
        follow,
        lastSize,
        viewRef,
      })
    }
    raf = requestAnimationFrame(step)
    return () => {
      active = false
      cancelAnimationFrame(raf)
      plushRenderer.dispose()
    }
  }, [canvasRef, initial, refs, pan, viewRef])
}
