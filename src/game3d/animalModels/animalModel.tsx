import { mountAction } from '../../config/gameplay.json'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { r3fClock } from '../r3fClock'
import { Group, type Object3D } from 'three'
import { animateAnimalGroups } from './animateAnimalGroups'
import { AnimalChargeWindup } from './animalPart'
import { AnimalKindMesh } from './animalKindMesh'
import {
  applyAnimalRootMotion,
  type AnimalMotionInput,
} from './animalMotionState'
import { type AnimalKind } from './types'
export function AnimalModel({
  kind,
  moving = false,
  attacking = false,
  time = 0,
  motion,
}: {
  kind: AnimalKind
  moving?: boolean
  attacking?: boolean
  time?: number
  motion?: () => AnimalMotionInput
}) {
  const root = useRef<Group>(null)

  const windup = useRef<Group>(null)

  const animated = useRef<Object3D[]>([])

  const metadata = useMemo(() => ({ kind }), [kind])

  useLayoutEffect(() => {
    animated.current = []
    root.current?.traverse((node: Object3D) => {
      if (!node.name.startsWith('animal-')) {
        return
      }

      animated.current.push(node)
    })
  }, [kind])

  useFrame((frame) => {
    const clock = r3fClock(frame)
    let tick
    if (time > 0) {
      tick = time
    } else {
      tick = clock.elapsedTime
    }

    const state = motion?.()

    const move = state?.moving ?? moving

    const attack = state?.attacking ?? attacking

    const glide = state?.gliding ?? false

    const charge = Math.min(
      1,
      (state?.charging ?? 0) / mountAction.readyChargeSeconds,
    )

    const ready = charge >= 1

    const ctx = { kind, tick, move, attack, glide, charge, ready }

    applyAnimalRootMotion(root.current, ctx)

    if (windup.current) {
      windup.current.visible = charge > 0.04
      windup.current.scale.setScalar(
        0.65 + charge * 0.35 + Math.sin(tick * (ready ? 22 : 12)) * 0.04,
      )
      windup.current.rotation.z = tick * 2
    }

    animateAnimalGroups(animated.current, ctx)
  })

  return (
    <group ref={root} name="animal-model" userData={metadata} dispose={null}>
      <group ref={windup} name="animal-charge-windup">
        <AnimalChargeWindup />
      </group>
      <AnimalKindMesh kind={kind} />
    </group>
  )
}
