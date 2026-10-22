import { type Group } from 'three'
import { type RefObject } from 'react'
import { EnemyEye, EnemyPart } from './enemyPart'
export function Necky({ wings }: { wings: RefObject<Group | null> }) {
  return (
    <group name="enemy-necky-bird">
      <EnemyPart
        color="#795948"
        pos={[-0.05, 0.37, 0]}
        size={[0.46, 0.27, 0.27]}
      />
      <EnemyPart
        color="#d5b29a"
        pos={[0.15, 0.32, 0.04]}
        size={[0.28, 0.2, 0.22]}
      />
      <EnemyPart
        color="#ad7d65"
        pos={[0.3, 0.55, 0]}
        size={[0.17, 0.27, 0.17]}
        rotation={[0, 0, 0.3]}
      />
      <EnemyPart
        color="#9065a2"
        pos={[0.43, 0.69, 0]}
        size={[0.24, 0.19, 0.19]}
      />
      <EnemyPart
        color="#e9b84e"
        pos={[0.72, 0.62, 0]}
        size={[0.09, 0.35, 0.1]}
        shape="tooth"
        rotation={[0, 0, -Math.PI / 2]}
      />
      <EnemyEye pos={[0.49, 0.75, 0.155]} size={0.065} />
      <EnemyEye pos={[0.49, 0.75, -0.155]} size={0.065} />
      <EnemyPart
        color="#62445f"
        pos={[-0.48, 0.35, 0]}
        size={[0.3, 0.08, 0.17]}
        rotation={[0, 0, -0.25]}
      />
      <group ref={wings}>
        {[-1, 1].map((side) => (
          <group key={side} position={[-0.04, 0.45, side * 0.2]}>
            <EnemyPart
              color="#6d526c"
              pos={[-0.12, -0.03, side * 0.23]}
              size={[0.36, 0.08, 0.36]}
            />
            {[0, 1, 2].map((feather) => (
              <EnemyPart
                key={feather}
                color="#ad917e"
                pos={[-0.29 + feather * 0.11, -0.04, side * 0.48]}
                size={[0.22, 0.055, 0.25]}
                rotation={[0, side * 0.2, 0]}
              />
            ))}
          </group>
        ))}
      </group>
    </group>
  )
}
