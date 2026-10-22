import { ostrichNeck } from './animalGeometries'
import { animalMat } from './animalMaterials'
import { AnimalEyes } from './animalEyes'
import { AnimalPart } from './animalPart'
import { ExpressoLeg } from './expressoLegs'
import { ExpressoWing } from './expressoWings'

export function Expresso() {
  return (
    <group>
      <AnimalPart
        color="#252c2c"
        pos={[-0.14, 1.3, 0]}
        size={[0.59, 0.39, 0.38]}
      />
      <AnimalPart
        color="#e9e5d1"
        pos={[0.12, 1.15, 0]}
        size={[0.35, 0.23, 0.32]}
      />
      <AnimalPart
        color="#f1eddb"
        pos={[-0.67, 1.48, 0]}
        size={[0.32, 0.17, 0.22]}
        rotate={[0, 0, -0.33]}
      />
      <AnimalPart
        color="#d9d9c7"
        pos={[-0.72, 1.34, 0]}
        size={[0.28, 0.13, 0.21]}
        rotate={[0, 0, 0.14]}
      />
      <mesh
        geometry={ostrichNeck}
        material={animalMat('#d89b87')}
        dispose={null}
      />
      <AnimalPart
        color="#e5ac94"
        pos={[0.73, 2.22, 0]}
        size={[0.22, 0.24, 0.2]}
      />
      <AnimalPart
        color="#dd985b"
        pos={[1.0, 2.17, 0]}
        size={[0.1, 0.4, 0.11]}
        rotate={[0, 0, -Math.PI / 2]}
        shape="cone"
      />
      <AnimalPart
        color="#9d6441"
        pos={[0.97, 2.13, 0.055]}
        size={[0.21, 0.014, 0.08]}
      />
      <AnimalEyes pos={[0.78, 2.29, 0.165]} size={0.095} iris="#466c91" />
      <AnimalPart
        color="#eeeece"
        pos={[0.63, 2.42, 0]}
        size={[0.14, 0.08, 0.14]}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <ExpressoWing side={side} />
          <ExpressoLeg side={side} />
        </group>
      ))}
    </group>
  )
}
