import { animalBox, chargeRing } from './animalGeometries'

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
