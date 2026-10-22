import { AnimalPart } from './animalPart'
import { pick } from '../../utils/pick'

export function WinkyBackLeg({ side }: { side: number }) {
  return (
    <group
      name="animal-stride"
      position={[-0.39, 0.44, side * 0.33]}
      userData={{ phase: pick(side > 0, 0, Math.PI), amplitude: 0.3 }}
    >
      <AnimalPart
        color="#4a8e2c"
        pos={[-0.13, -0.01, 0]}
        size={[0.29, 0.26, 0.21]}
        rotate={[0, 0, -0.4]}
      />
      <AnimalPart
        color="#619d36"
        pos={[-0.08, -0.24, 0.02]}
        size={[0.3, 0.095, 0.15]}
      />
      <AnimalPart
        color="#8eab45"
        pos={[0.13, -0.32, 0.045]}
        size={[0.34, 0.075, 0.2]}
      />
      {[-1, 0, 1].map((toe) => (
        <AnimalPart
          key={toe}
          color="#b2bf5c"
          pos={[0.39, -0.32, toe * 0.12]}
          size={[0.12, 0.042, 0.035]}
        />
      ))}
    </group>
  )
}

export function WinkyFrontLeg({ side }: { side: number }) {
  return (
    <group
      name="animal-stride"
      position={[0.31, 0.48, side * 0.3]}
      userData={{ phase: pick(side > 0, Math.PI, 0), amplitude: 0.16 }}
    >
      <AnimalPart
        color="#5b9534"
        pos={[0.09, -0.16, 0.015]}
        size={[0.075, 0.24, 0.07]}
        rotate={[0, 0, 0.34]}
      />
      <AnimalPart
        color="#a2b651"
        pos={[0.18, -0.36, 0.045]}
        size={[0.2, 0.053, 0.12]}
      />
    </group>
  )
}
