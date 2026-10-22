import type { Group } from 'three'
import type { RefObject } from 'react'
import { ENEMY_DESIGNS } from '../../game/enemies'
import { BeaverBody, BeaverGaitLegs } from './beaverBody'

export function Beaver({ gait }: { gait: RefObject<Group | null> }) {
  return (
    <group scale={ENEMY_DESIGNS.beetle.scale}>
      <BeaverBody />
      <group ref={gait}>
        <BeaverGaitLegs />
      </group>
    </group>
  )
}
