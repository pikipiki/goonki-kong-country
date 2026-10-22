import type { Group } from 'three'

export type TravelerAnim = 'idle' | 'walk' | 'celebrate'

export function stepTowardSelected(
  selected: number,
  nodeAt: {
    current: number
  },
  destination: {
    current: number
  },
  progress: {
    current: number
  },
  lastHop: {
    current: number
  },
  celebrateTimer: {
    current: number
  },
) {
  if (destination.current === nodeAt.current && nodeAt.current !== selected) {
    destination.current = nodeAt.current + Math.sign(selected - nodeAt.current)
    progress.current = 0
    lastHop.current = -1
    celebrateTimer.current = 0
  }
}

export function animateTravelerHop(
  root: Group,
  nodes: [number, number][],
  nodeAt: number,
  destination: number,
  progress: number,
  lastHop: {
    current: number
  },
  onStep?: () => void,
): 'walk' | 'arrived' {
  const blend = progress
  const hopIndex = Math.min(2, Math.floor(blend * 3))
  if (hopIndex !== lastHop.current) {
    lastHop.current = hopIndex
    onStep?.()
  }
  const start = nodes[nodeAt] ?? nodes[0]
  const end = nodes[destination] ?? nodes[0]
  const ease = blend * blend * (3 - 2 * blend)
  const hopY = Math.abs(Math.sin(blend * Math.PI * 3)) * 0.52
  const deltaX = end[0] - start[0]
  const deltaZ = end[1] - start[1]
  root.position.set(
    start[0] + deltaX * ease,
    0.3 + hopY,
    start[1] + deltaZ * ease,
  )
  root.rotation.y = Math.atan2(deltaX, Math.abs(deltaZ) + 1.5) * 0.45
  if (blend >= 1) {
    return 'arrived'
  }
  return 'walk'
}

export function animateTravelerCelebrate(
  root: Group,
  anchor: [number, number],
  frameDelta: number,
  clockElapsed: number,
  celebrateTimer: {
    current: number
  },
): boolean {
  celebrateTimer.current = Math.max(0, celebrateTimer.current - frameDelta)
  const hopY = Math.abs(Math.sin(clockElapsed * 10)) * 0.38
  root.position.set(anchor[0], 0.3 + hopY, anchor[1])
  root.rotation.y = Math.sin(clockElapsed * 9) * 0.28
  return celebrateTimer.current === 0
}
