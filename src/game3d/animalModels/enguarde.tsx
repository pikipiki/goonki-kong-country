import {
  fishDorsal,
  fishSideFin,
  fishTail,
  animalMat,
} from './animalGeometries'
import { AnimalEyes, AnimalPart } from './animalPart'
export function Enguarde() {
  return (
    <group>
      <AnimalPart
        color="#277eaf"
        pos={[-0.15, 0.66, 0]}
        size={[0.91, 0.33, 0.29]}
      />
      <AnimalPart
        color="#7ecbd6"
        pos={[-0.03, 0.49, 0.025]}
        size={[0.73, 0.16, 0.255]}
      />
      <AnimalPart
        color="#348dc1"
        pos={[0.51, 0.7, 0]}
        size={[0.35, 0.29, 0.26]}
      />
      <AnimalPart
        color="#1a6295"
        pos={[1.12, 0.72, 0]}
        size={[0.085, 0.99, 0.075]}
        rotate={[0, 0, -Math.PI / 2]}
        shape="cone"
      />
      <AnimalPart
        color="#66b5d3"
        pos={[0.87, 0.64, 0]}
        size={[0.38, 0.043, 0.09]}
      />
      <mesh
        geometry={fishDorsal}
        material={animalMat('#d8b54d')}
        dispose={null}
      />
      {[-1, 1].map((side) => (
        <group
          key={side}
          name="animal-fin"
          position={[0, 0, side * 0.23]}
          userData={{ phase: side > 0 ? 0 : Math.PI, axis: 'x' }}
        >
          <mesh
            geometry={fishSideFin}
            material={animalMat('#e8ca63')}
            rotation={[side * 0.5, 0, 0]}
            dispose={null}
          />
        </group>
      ))}
      <group name="animal-tail" position={[-0.95, 0.63, 0]}>
        <AnimalPart
          color="#2776a1"
          pos={[-0.08, 0, 0]}
          size={[0.26, 0.11, 0.1]}
        />
        <mesh
          geometry={fishTail}
          material={animalMat('#e1c153')}
          position={[0.95, -0.63, 0]}
          dispose={null}
        />
      </group>
      <AnimalEyes pos={[0.52, 0.83, 0.218]} size={0.13} iris="#275680" />
      <AnimalPart
        color="#164e79"
        pos={[0.76, 0.675, 0.14]}
        size={[0.17, 0.012, 0.018]}
        rotate={[0, 0, 0.04]}
      />
      <AnimalPart
        color="#164e79"
        pos={[0.76, 0.675, -0.14]}
        size={[0.17, 0.012, 0.018]}
        rotate={[0, 0, 0.04]}
      />
    </group>
  )
}
