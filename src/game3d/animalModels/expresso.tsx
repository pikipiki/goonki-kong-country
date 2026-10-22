import { ostrichNeck, animalMat } from './animalGeometries'
import { AnimalEyes, AnimalPart } from './animalPart'
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

export function ExpressoLeg({ side }: { side: number }) {
  return (
    <group
      name="animal-stride"
      position={[0.05, 1.12, side * 0.19]}
      userData={{ phase: side > 0 ? 0 : Math.PI, amplitude: 0.75 }}
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

export function ExpressoWing({ side }: { side: number }) {
  return (
    <group
      name="animal-wing"
      position={[-0.12, 1.4, side * 0.32]}
      userData={{ phase: side > 0 ? 0 : Math.PI, side }}
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
          color={feather === 0 ? '#fff9e7' : '#e1dfcc'}
          pos={[-0.35 + feather * 0.07, -0.17 + feather * 0.08, side * 0.08]}
          size={[0.23, 0.07, 0.065]}
          rotate={[0, 0, 0.35 + feather * 0.15]}
        />
      ))}
    </group>
  )
}
