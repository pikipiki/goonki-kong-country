import { AnimalPart } from './animalPart'
import { pick } from '../../utils/pick'

export function ExpressoLeg({ side }: { side: number }) {
  return (
    <group
      name="animal-stride"
      position={[0.05, 1.12, side * 0.19]}
      userData={{ phase: pick(side > 0, 0, Math.PI), amplitude: 0.75 }}
    >
      <AnimalPart
        color="#cf9984"
        pos={[-0.04, -0.23, 0]}
        size={[0.055, 0.3, 0.055]}
        rotate={[0, 0, -0.15]}
      />
      <AnimalPart
        color="#dbab90"
        pos={[-0.075, -0.64, 0]}
        size={[0.045, 0.23, 0.045]}
        rotate={[0, 0, 0.12]}
      />
      <AnimalPart
        color="#e2e7d5"
        pos={[0.03, -0.85, 0]}
        size={[0.1, 0.1, 0.1]}
      />
      <AnimalPart
        color="#ac3441"
        pos={[0.14, -0.98, 0]}
        size={[0.28, 0.13, 0.13]}
      />
      <AnimalPart
        color="#f5eacb"
        pos={[0.16, -1.065, 0.005]}
        size={[0.29, 0.044, 0.14]}
      />
      <AnimalPart
        color="#e5d8b7"
        pos={[0.29, -0.965, side * 0.11]}
        size={[0.085, 0.035, 0.018]}
      />
    </group>
  )
}
