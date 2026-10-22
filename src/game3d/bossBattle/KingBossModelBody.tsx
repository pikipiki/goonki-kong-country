import type { RefObject } from 'react'
import type { Group } from 'three'
import { BossPart } from './BossPart'
import { Crown } from './Crown'
import { KingBossModelCore } from './KingBossModelCore'
const TAIL_SEGMENTS = [0, 1, 2, 3, 4]
const TOE_ROWS = [0, 1, 2]
function KingBossArm({ side }: { side: number }) {
  return (
    <group position={[-0.12, 1.07, side * 0.36]}>
      <BossPart
        color="#5b8235"
        pos={[0.13, -0.22, 0]}
        size={[0.14, 0.3, 0.13]}
      />
      <BossPart
        color="#638e3a"
        pos={[0.28, -0.43, 0]}
        size={[0.2, 0.15, 0.18]}
      />
      <BossPart
        color="#e1c351"
        pos={[0.19, -0.32, 0]}
        size={[0.16, 0.06, 0.16]}
        shape="cylinder"
      />
    </group>
  )
}
function KingBossLeg({ side }: { side: number }) {
  return (
    <group position={[-0.16, 0.35, side * 0.24]}>
      <BossPart color="#567b32" pos={[0, -0.05, 0]} size={[0.24, 0.29, 0.23]} />
      <BossPart
        color="#638a36"
        pos={[0.25, -0.26, 0.02]}
        size={[0.35, 0.12, 0.23]}
      />
      {TOE_ROWS.map((toeIdx) => (
        <BossPart
          key={toeIdx}
          color="#eadcaa"
          pos={[0.54, -0.26, (toeIdx - 1) * 0.13]}
          size={[0.11, 0.04, 0.035]}
        />
      ))}
    </group>
  )
}

export function KingBossModelBody({
  armsRef,
  legsRef,
  capeRef,
  crownRef,
}: {
  armsRef: RefObject<Group | null>
  legsRef: RefObject<Group | null>
  capeRef: RefObject<Group | null>
  crownRef: RefObject<Group | null>
}) {
  return (
    <>
      <KingBossModelCore />
      <group ref={armsRef}>
        {[-1, 1].map((side) => (
          <KingBossArm key={side} side={side} />
        ))}
      </group>
      <group ref={legsRef}>
        {[-1, 1].map((side) => (
          <KingBossLeg key={side} side={side} />
        ))}
      </group>
      <group ref={capeRef} position={[-0.56, 1.23, -0.1]}>
        <BossPart
          color="#992c2a"
          pos={[-0.03, -0.5, -0.04]}
          size={[0.12, 0.64, 0.51]}
          rotation={[0, 0, -0.16]}
        />
        <BossPart
          color="#e6cc7c"
          pos={[0, 0.03, 0]}
          size={[0.16, 0.09, 0.47]}
        />
      </group>
      {TAIL_SEGMENTS.map((segIdx) => (
        <BossPart
          key={segIdx}
          color="#527c31"
          pos={[-0.65 - segIdx * 0.14, 0.36 - segIdx * 0.04, 0]}
          size={[
            0.2 - segIdx * 0.025,
            0.14 - segIdx * 0.018,
            0.19 - segIdx * 0.025,
          ]}
        />
      ))}
      <group ref={crownRef} position={[0.15, 1.88, 0]}>
        <Crown />
      </group>
    </>
  )
}
