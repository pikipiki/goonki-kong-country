import { frogMouth } from './animalGeometries'
import { animalMat } from './animalMaterials'
import { AnimalPart } from './animalPart'
import { WinkyBackLeg, WinkyFrontLeg } from './winkyLegs'

export function Winky() {
  return (
    <group>
      <AnimalPart
        color="#4b8d31"
        pos={[-0.16, 0.56, 0]}
        size={[0.58, 0.39, 0.4]}
      />
      <AnimalPart
        color="#d8d39a"
        pos={[0.16, 0.4, 0.02]}
        size={[0.34, 0.25, 0.34]}
      />
      <AnimalPart
        color="#5a9e37"
        pos={[0.27, 0.73, 0]}
        size={[0.45, 0.28, 0.38]}
      />
      <AnimalPart
        color="#80a74a"
        pos={[0.48, 0.59, 0]}
        size={[0.27, 0.12, 0.34]}
      />
      <mesh
        geometry={frogMouth}
        material={animalMat('#334e27')}
        dispose={null}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <AnimalPart
            color="#427c2c"
            pos={[0.21, 0.94, side * 0.24]}
            size={[0.19, 0.25, 0.18]}
          />
          <AnimalPart
            color="#e2c94c"
            pos={[0.31, 1.0, side * 0.29]}
            size={[0.13, 0.18, 0.12]}
          />
          <AnimalPart
            color="#171e11"
            pos={[0.38, 1.015, side * 0.36]}
            size={[0.046, 0.11, 0.036]}
          />
          <AnimalPart
            color="#f8f0c2"
            pos={[0.4, 1.08, side * 0.38]}
            size={[0.02, 0.03, 0.015]}
          />
          <WinkyBackLeg side={side} />
          <WinkyFrontLeg side={side} />
        </group>
      ))}
    </group>
  )
}
