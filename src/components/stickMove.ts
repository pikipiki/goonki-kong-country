import type { PointerEvent, RefObject } from 'react'
import type { Game } from '../game/engine'
import type { Controls } from '../game/input'

export function readStickMove(
  event: PointerEvent<HTMLDivElement>,
  pad: HTMLDivElement,
) {
  const rect = pad.getBoundingClientRect()
  const offsetX = event.clientX - rect.left - rect.width / 2
  const offsetY = event.clientY - rect.top - rect.height / 2
  const distance = Math.hypot(offsetX, offsetY)
  const factor = Math.min(1, 38 / Math.max(1, distance))
  return {
    offsetX,
    offsetY,
    stickX: offsetX * factor,
    stickY: offsetY * factor,
  }
}

export function useDpadMove(
  game: Game,
  controls: Controls,
  clickMode: boolean,
  padRef: RefObject<HTMLDivElement | null>,
  pointerRef: RefObject<number | null>,
  steer: (next: number, running?: boolean) => void,
  setStick: (value: { x: number; y: number }) => void,
) {
  return (event: PointerEvent<HTMLDivElement>) => {
    const pad = padRef.current
    if (pointerRef.current !== event.pointerId || clickMode || !pad) {
      return
    }
    const motion = readStickMove(event, pad)
    setStick({ x: motion.stickX, y: motion.stickY })
    steer(
      Math.abs(motion.offsetX) > 13 ? Math.sign(motion.offsetX) : 0,
      Math.abs(motion.offsetX) > 32,
    )
    controls.set(
      'virtual-up',
      'up',
      game.level.biome === 'lagoon' && motion.offsetY < -22,
    )
    controls.set(
      'virtual-down',
      'down',
      game.level.biome === 'lagoon' && motion.offsetY > 22,
    )
  }
}
