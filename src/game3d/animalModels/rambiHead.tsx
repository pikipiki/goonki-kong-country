import { mainHorn } from './animalGeometries'
import { animalMat } from './animalMaterials'
import { AnimalEyes } from './animalEyes'
import { AnimalPart } from './animalPart'

export function RambiHead() {
  return (
    <group name="animal-attack" position={[0.53, 0.93, 0]}>
      <AnimalPart color="#899291" size={[0.39, 0.34, 0.32]} />
      <AnimalPart
        color="#919a97"
        pos={[0.31, -0.13, 0]}
        size={[0.4, 0.23, 0.32]}
      />
      <AnimalPart
        color="#525f5c"
        pos={[0.46, -0.1, 0.25]}
        size={[0.045, 0.035, 0.025]}
      />
      <AnimalPart
        color="#525f5c"
        pos={[0.46, -0.1, -0.25]}
        size={[0.045, 0.035, 0.025]}
      />
      <mesh
        geometry={mainHorn}
        material={animalMat('#eee3bf')}
        position={[-0.53, -0.93, 0]}
        dispose={null}
      />
      <AnimalPart
        color="#dbd0ae"
        pos={[0.2, 0.2, 0]}
        size={[0.11, 0.24, 0.11]}
        rotate={[0, 0, -0.28]}
        shape="cone"
      />
      <AnimalEyes pos={[0.1, 0.14, 0.285]} size={0.1} iris="#bd332a" />
      <AnimalPart
        color="#626d69"
        pos={[-0.06, 0.23, 0.25]}
        size={[0.17, 0.045, 0.095]}
        rotate={[0, 0, -0.17]}
      />
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[-0.25, 0.28, side * 0.25]}
          rotation={[side * 0.45, 0, 0.32]}
        >
          <AnimalPart color="#747f7a" size={[0.11, 0.2, 0.085]} />
          <AnimalPart
            color="#a4a79d"
            pos={[0.025, 0.015, side * 0.055]}
            size={[0.05, 0.12, 0.025]}
          />
        </group>
      ))}
    </group>
  )
}
