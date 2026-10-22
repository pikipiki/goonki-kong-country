import { BossPart } from './BossPart'
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
