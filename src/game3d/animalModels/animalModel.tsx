import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, type Object3D } from 'three'
import { animateAnimalGroups } from './animateAnimalGroups'
import { AnimalChargeWindup } from './animalChargeWindup'
import { AnimalKindMesh } from './animalKindMesh'
import { pick } from '../../utils/pick'
import {
  rootAnimationLabel,
  rootOffsetX,
  rootOffsetY,
  type AnimalMotionInput,
} from './animalMotionState'
import type { AnimalKind } from './types'

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

  useFrame(({ clock }) => {
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

    const charge = Math.min(1, (state?.charging ?? 0) / 0.65)

    const ready = charge >= 1

    const ctx = { kind, tick, move, attack, glide, charge, ready }

    if (root.current) {
      root.current.position.x = rootOffsetX(charge, ready, tick)
      root.current.position.y = rootOffsetY(kind, glide, charge, tick)
      if (kind === 'enguarde') {
        root.current.rotation.z = charge * 0.08
      } else {
        root.current.rotation.z = 0
      }
      root.current.scale.set(
        1 + pick(attack, 0.08, charge * 0.03),
        1 - charge * 0.06,
        1,
      )
      root.current.userData.animation = rootAnimationLabel(
        glide,
        charge,
        ready,
        attack,
        move,
      )
    }

    if (windup.current) {
      windup.current.visible = charge > 0.04
      windup.current.scale.setScalar(
        0.65 + charge * 0.35 + Math.sin(tick * pick(ready, 22, 12)) * 0.04,
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
