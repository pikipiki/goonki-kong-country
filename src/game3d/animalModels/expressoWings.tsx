import { AnimalPart } from './animalPart'
import { pick } from '../../utils/pick'

export function ExpressoWing({ side }: { side: number }) {
  return (
    <group
      name="animal-wing"
      position={[-0.12, 1.4, side * 0.32]}
      userData={{ phase: pick(side > 0, 0, Math.PI), side }}
    >
      <AnimalPart
        color="#f4f0db"
        pos={[-0.14, -0.1, side * 0.045]}
        size={[0.42, 0.19, 0.12]}
        rotate={[side * 0.1, 0, -0.17]}
      />
      {[-1, 0, 1].map((feather) => (
        <AnimalPart
          key={feather}
          color={pick(feather === 0, '#fff9e7', '#e1dfcc')}
          pos={[-0.35 + feather * 0.07, -0.17 + feather * 0.08, side * 0.08]}
          size={[0.23, 0.07, 0.065]}
          rotate={[0, 0, 0.35 + feather * 0.15]}
        />
      ))}
    </group>
  )
}
