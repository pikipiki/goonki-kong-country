import { type Group } from 'three'
import { type RefObject } from 'react'
import { EnemyEye, EnemyPart } from './enemyPart'
const stripeOffsets = [-0.25, 0, 0.25]
export function Zinger({ wings }: { wings: RefObject<Group | null> }) {
  return (
    <group position={[0, 0.34, 0]}>
      <EnemyPart color="#e9b72b" size={[0.52, 0.3, 0.28]} />
      {stripeOffsets.map((offset) => (
        <EnemyPart
          key={offset}
          color="#29281b"
          pos={[offset, 0, 0]}
          size={[0.078, 0.293, 0.285]}
        />
      ))}
      <EnemyPart
        color="#edae21"
        pos={[0.48, 0.03, 0]}
        size={[0.25, 0.25, 0.25]}
      />
      <EnemyEye pos={[0.52, 0.12, 0.21]} size={0.1} />
      <EnemyEye pos={[0.52, 0.12, -0.21]} size={0.1} />
      <EnemyPart
        color="#e5d6a2"
        pos={[-0.7, -0.03, 0]}
        size={[0.13, 0.36, 0.12]}
        shape="tooth"
        rotation={[0, 0, Math.PI / 2]}
      />
      {[0, 1].map((antenna) => (
        <group key={antenna}>
          <EnemyPart
            color="#46371e"
            pos={[0.48 + antenna * 0.2, 0.31, 0]}
            size={[0.018, 0.22, 0.018]}
            rotation={[0, 0, -0.3 + antenna * 0.6]}
          />
          <EnemyPart
            color="#3c2c1e"
            pos={[0.52 + antenna * 0.12, 0.48, 0]}
            size={[0.055, 0.055, 0.05]}
          />
        </group>
      ))}
      <group ref={wings}>
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[-0.05, 0.2, side * 0.15]}
            rotation={[side * 0.5, 0, 0]}
          >
            <EnemyPart
              color="#ccded3"
              pos={[-0.15, 0.23, side * 0.2]}
              size={[0.34, 0.035, 0.43]}
              rotation={[0, 0, -0.35]}
            />
            <EnemyPart
              color="#e4ead1"
              pos={[0.06, 0.3, side * 0.3]}
              size={[0.24, 0.022, 0.39]}
            />
          </group>
        ))}
      </group>
      {[-1, 1].map((side) =>
        [0, 1, 2].map((leg) => (
          <EnemyPart
            key={`${String(side)}-${String(leg)}`}
            color="#4d341c"
            pos={[-0.25 + leg * 0.2, -0.29, side * 0.18]}
            size={[0.019, 0.19, 0.019]}
            rotation={[side * 0.4, 0, 0.3]}
          />
        )),
      )}
    </group>
  )
}
