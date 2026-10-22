import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { r3fClock } from '../game3d/r3fClock'
import type { Group } from 'three'
import {
  animateTravelerCelebrate,
  stepTowardSelected,
  type TravelerAnim,
} from './travelerMotion'
import { runTravelerWalkFrame } from './travelersWalkFrame'

export function useTravelersMotion(
  selected: number,
  initial: number,
  nodes: [number, number][],
  onSound?: (name: 'map-step' | 'map-arrive') => void,
) {
  const root = useRef<Group>(null)
  const nodeAt = useRef(initial)
  const destination = useRef(initial)
  const progress = useRef(0)
  const lastHop = useRef(-1)
  const celebrateTimer = useRef(0)
  const [animState, setAnimState] = useState<TravelerAnim>('idle')
  const prevAnimState = useRef<TravelerAnim>('idle')
  useFrame((state, delta) => {
    const clock = r3fClock(state)
    const group = root.current
    if (!group) {
      return
    }
    const frameDelta = Math.min(delta, 0.1)
    stepTowardSelected(
      selected,
      nodeAt,
      destination,
      progress,
      lastHop,
      celebrateTimer,
    )
    if (destination.current !== nodeAt.current) {
      progress.current = Math.min(1, progress.current + frameDelta * 1.65)
      runTravelerWalkFrame(
        group,
        nodes,
        nodeAt,
        destination,
        progress,
        lastHop,
        selected,
        celebrateTimer,
        prevAnimState,
        setAnimState,
        onSound,
      )
      return
    }
    const anchor = nodes[nodeAt.current] ?? nodes[0]
    if (celebrateTimer.current > 0) {
      const done = animateTravelerCelebrate(
        group,
        anchor,
        frameDelta,
        clock.elapsedTime,
        celebrateTimer,
      )
      if (done && prevAnimState.current !== 'idle') {
        prevAnimState.current = 'idle'
        setAnimState('idle')
      }
      return
    }
    group.position.set(anchor[0], 0.3, anchor[1])
    group.rotation.y = 0
  })
  return { animState, root }
}
