import { rhinoTail } from './animalGeometries'
import { animalMat } from './animalMaterials'
import { AnimalPart } from './animalPart'
import { RambiHead } from './rambiHead'
import { RambiLegs } from './rambiLegs'

export function Rambi() {
  return (
    <group>
      <AnimalPart
        color="#747b7b"
        pos={[-0.12, 0.86, 0]}
        size={[0.86, 0.49, 0.44]}
      />
      <AnimalPart
        color="#8b9191"
        pos={[0.37, 0.95, 0]}
        size={[0.49, 0.51, 0.43]}
      />
      <AnimalPart
        color="#616a6a"
        pos={[-0.66, 0.8, 0]}
        size={[0.3, 0.4, 0.36]}
      />
      <mesh
        geometry={rhinoTail}
        material={animalMat('#687171')}
        dispose={null}
      />
      <AnimalPart
        color="#333c3c"
        pos={[-1.1, 0.57, 0.03]}
        size={[0.075, 0.11, 0.07]}
      />
      <RambiLegs />
      <RambiHead />
    </group>
  )
}
