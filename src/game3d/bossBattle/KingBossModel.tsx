import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { type Group } from 'three'
import { type Enemy, type Game } from '../../game/engine'
import { animateKingBoss } from './kingBossMotion'
import { BossPart, Crown } from './BossPart'
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

const BELT_LINKS = [0, 1, 2, 3]
function KingBossFace({ side }: { side: number }) {
  const FANG_ROWS = [0, 1, 2]
  return (
    <group key={side}>
      <BossPart
        color="#faf0c8"
        pos={[0.32, 1.54, side * 0.25]}
        size={[0.14, 0.16, 0.08]}
      />
      <BossPart
        color="#c33d2c"
        pos={[0.38, 1.54, side * 0.3]}
        size={[0.065, 0.08, 0.025]}
      />
      <BossPart
        color="#171b11"
        pos={[0.4, 1.54, side * 0.32]}
        size={[0.025, 0.05, 0.02]}
      />
      <BossPart
        color="#304f23"
        pos={[0.35, 1.68, side * 0.25]}
        size={[0.18, 0.04, 0.1]}
        rotation={[0, 0, -0.18]}
      />
      {FANG_ROWS.map((fangIdx) => (
        <BossPart
          key={fangIdx}
          color="#fff0b9"
          shape="cone"
          pos={[0.4 + fangIdx * 0.18, 1.08, side * 0.27]}
          size={[0.03, 0.12, 0.03]}
          rotation={[0, 0, Math.PI]}
        />
      ))}
    </group>
  )
}

export function KingBossModelCore() {
  return (
    <>
      <BossPart
        color="#547c37"
        pos={[-0.18, 0.82, 0]}
        size={[0.59, 0.69, 0.41]}
      />
      <BossPart
        color="#d8b34a"
        pos={[0.17, 0.72, 0.08]}
        size={[0.38, 0.52, 0.38]}
      />
      {BELT_LINKS.map((linkIdx) => (
        <BossPart
          key={linkIdx}
          color="#ad8933"
          pos={[0.5, 0.42 + linkIdx * 0.16, 0.12]}
          size={[0.025, 0.018, 0.24]}
          shape="box"
        />
      ))}
      <BossPart
        color="#5e8b3a"
        pos={[0.18, 1.43, 0]}
        size={[0.38, 0.31, 0.3]}
      />
      <BossPart
        color="#658f3c"
        pos={[0.61, 1.22, 0]}
        size={[0.49, 0.21, 0.31]}
      />
      <BossPart
        color="#263b1b"
        pos={[0.67, 1.07, 0.02]}
        size={[0.4, 0.04, 0.27]}
      />
      <BossPart
        color="#dfbf63"
        pos={[0.6, 1.02, 0.02]}
        size={[0.4, 0.06, 0.27]}
      />
      {[-1, 1].map((side) => (
        <KingBossFace key={side} side={side} />
      ))}
    </>
  )
}
