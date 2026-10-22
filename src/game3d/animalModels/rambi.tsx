import { rhinoTail, animalMat, mainHorn } from './animalGeometries'
import { AnimalPart, AnimalEyes } from './animalPart'
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
        phase: side * front > 0 ? 0 : Math.PI,
        amplitude: 0.37,
      }}
    >
      <AnimalPart
        color={side > 0 ? '#7b8383' : '#606b6d'}
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
