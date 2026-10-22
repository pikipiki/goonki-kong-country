import { type Group } from 'three'
import { type RefObject } from 'react'
import { EnemyPart } from './enemyPart'
export function CrocGait({
  gait,
  green,
  helmet,
}: {
  gait: RefObject<Group | null>
  green: string
  helmet: boolean
}) {
  return (
    <group ref={gait}>
      {[-1, 1].map((side) => (
        <group key={side} position={[-0.17, 0.26, side * 0.24]}>
          <EnemyPart
            color={helmet ? '#645386' : green}
            size={[0.22, 0.28, 0.22]}
          />
          <EnemyPart
            color={green}
            pos={[0.22, -0.16, 0.025]}
            size={[0.3, 0.105, 0.22]}
          />
          {[0, 1, 2].map((toe) => (
            <EnemyPart
              key={toe}
              color="#e4d8a2"
              pos={[0.46, -0.15, (toe - 1) * 0.095]}
              size={[0.08, 0.035, 0.025]}
              shape="tooth"
              rotation={[0, 0, -Math.PI / 2]}
            />
          ))}
        </group>
      ))}
    </group>
  )
}
