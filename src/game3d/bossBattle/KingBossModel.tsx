import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { Enemy, Game } from '../../game/engine'
import { KingBossModelBody } from './KingBossModelBody'
import { animateKingBoss } from './kingBossMotion'

export function KingBossModel({ enemy, game }: { enemy: Enemy; game?: Game }) {
  const root = useRef<Group>(null)
  const crown = useRef<Group>(null)
  const arms = useRef<Group>(null)
  const legs = useRef<Group>(null)
  const cape = useRef<Group>(null)
  useFrame(() => {
    animateKingBoss(enemy, game, {
      root: root.current,
      crown: crown.current,
      arms: arms.current,
      legs: legs.current,
      cape: cape.current,
    })
  })
  return (
    <group ref={root} name="king-boss-model">
      <KingBossModelBody
        armsRef={arms}
        legsRef={legs}
        capeRef={cape}
        crownRef={crown}
      />
    </group>
  )
}
