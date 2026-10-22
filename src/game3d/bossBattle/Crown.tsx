import { BossPart } from './BossPart'
const CROWN_SPIKES = [-1, 0, 1]
export function Crown() {
  return (
    <group name="king-crown">
      <BossPart color="#e7b538" shape="cylinder" size={[0.34, 0.1, 0.28]} />
      {[-1, 1].flatMap((side) =>
        CROWN_SPIKES.map((spikeIdx) => (
          <BossPart
            key={`${String(side)}-${String(spikeIdx)}`}
            color="#ffd66b"
            shape="cone"
            pos={[spikeIdx * 0.23, 0.18, side * 0.19]}
            size={[0.08, 0.36, 0.08]}
          />
        )),
      )}
      <BossPart
        color="#b32835"
        pos={[0.03, 0, 0.29]}
        size={[0.07, 0.09, 0.03]}
      />
    </group>
  )
}
