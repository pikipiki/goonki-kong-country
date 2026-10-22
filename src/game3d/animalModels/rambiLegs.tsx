import { AnimalPart } from './animalPart'
import { pick } from '../../utils/pick'

function RambiStrideLeg({ side, front }: { side: number; front: number }) {
  let frontX
  if (front === 1) {
    frontX = 0.4
  } else {
    frontX = -0.62
  }

  return (
    <group
      name="animal-stride"
      position={[frontX, 0.56, side * 0.28]}
      userData={{
        phase: pick(side * front > 0, 0, Math.PI),
        amplitude: 0.37,
      }}
    >
      <AnimalPart
        color={pick(side > 0, '#7b8383', '#606b6d')}
        pos={[0, -0.19, 0]}
        size={[0.19, 0.29, 0.18]}
      />
      <AnimalPart
        color="#687373"
        pos={[0.065, -0.44, 0.015]}
        size={[0.22, 0.12, 0.19]}
      />
      {[-1, 0, 1].map((toe) => (
        <AnimalPart
          key={toe}
          color="#cbc6b4"
          pos={[0.23, -0.455, toe * 0.105]}
          size={[0.075, 0.055, 0.044]}
        />
      ))}
    </group>
  )
}

export function RambiLegs() {
  return (
    <>
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((front) => (
          <RambiStrideLeg
            key={`${String(side)}-${String(front)}`}
            side={side}
            front={front}
          />
        )),
      )}
    </>
  )
}
