import {
  animalBox,
  animalCone,
  animalSphere,
  animalMat,
  chargeRing,
} from './animalGeometries'
import { type V3 } from './types'
function partGeometry(shape: 'sphere' | 'cone' | 'box') {
  if (shape === 'cone') {
    return animalCone
  }
  if (shape === 'box') {
    return animalBox
  }
  return animalSphere
}

export function AnimalPart({
  color,
  pos = [0, 0, 0],
  size = [1, 1, 1],
  rotate = [0, 0, 0],
  shape = 'sphere',
}: {
  color: string
  pos?: V3
  size?: V3
  rotate?: V3
  shape?: 'sphere' | 'cone' | 'box'
}) {
  return (
    <mesh
      position={pos}
      scale={size}
      rotation={rotate}
      geometry={partGeometry(shape)}
      material={animalMat(color)}
      castShadow
      dispose={null}
    />
  )
}

export function AnimalEyes({
  pos,
  size = 0.11,
  iris = '#4b2520',
  yellow = false,
}: {
  pos: V3
  size?: number
  iris?: string
  yellow?: boolean
}) {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side} position={[pos[0], pos[1], side * pos[2]]}>
          <AnimalPart
            color={yellow ? '#f4d94a' : '#faf1d8'}
            size={[size, size * 1.16, size * 0.54]}
          />
          <AnimalPart
            color={iris}
            pos={[size * 0.25, 0, side * size * 0.47]}
            size={[size * 0.49, size * 0.69, size * 0.24]}
          />
          <AnimalPart
            color="#101410"
            pos={[size * 0.36, 0, side * size * 0.64]}
            size={[size * 0.23, size * 0.45, size * 0.12]}
          />
          <AnimalPart
            color="#fffbee"
            pos={[size * 0.45, size * 0.35, side * size * 0.72]}
            size={[size * 0.16, size * 0.2, size * 0.08]}
          />
        </group>
      ))}
    </>
  )
}

export function AnimalChargeWindup() {
  return (
    <group visible={false} position={[0, 0.8, 0.52]}>
      <mesh geometry={chargeRing}>
        <meshBasicMaterial
          color="#ffe395"
          transparent
          opacity={0.75}
          depthWrite={false}
        />
      </mesh>
      {[0, 1, 2].map((bar) => (
        <mesh
          key={bar}
          geometry={animalBox}
          position={[-0.82, 0.25 - bar * 0.25, 0]}
          scale={[0.2, 0.035, 0.025]}
        >
          <meshBasicMaterial color="#ffe395" />
        </mesh>
      ))}
    </group>
  )
}
