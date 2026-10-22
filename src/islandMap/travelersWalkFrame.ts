import type { Group } from 'three'
import { animateTravelerHop, type TravelerAnim } from './travelerMotion'

export function runTravelerWalkFrame(
  group: Group,
  nodes: [number, number][],
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
  selected: number,
  celebrateTimer: {
    current: number
  },
  prevAnimState: {
    current: TravelerAnim
  },
  setAnimState: (state: TravelerAnim) => void,
  onSound?: (name: 'map-step' | 'map-arrive') => void,
) {
  const hopResult = animateTravelerHop(
    group,
    nodes,
    nodeAt.current,
    destination.current,
    progress.current,
    lastHop,
    () => {
      onSound?.('map-step')
    },
  )
  if (prevAnimState.current !== 'walk') {
    prevAnimState.current = 'walk'
    setAnimState('walk')
  }
  if (hopResult !== 'arrived') {
    return
  }
  nodeAt.current = destination.current
  progress.current = 0
  if (nodeAt.current === selected) {
    celebrateTimer.current = 1.25
    onSound?.('map-arrive')
    prevAnimState.current = 'celebrate'
    setAnimState('celebrate')
  }
}
