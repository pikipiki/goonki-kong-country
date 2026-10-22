import { actorBox, actorCone } from './geometries'

export function BarrelCannonMarker() {
  return (
    <group name="cannon-direction" position={[0, 0, 0.5]}>
      <mesh
        geometry={actorBox}
        position={[0, -0.03, 0]}
        scale={[0.065, 0.4, 0.035]}
      >
        <meshBasicMaterial color="#fff0b0" />
      </mesh>
      <mesh
        geometry={actorCone}
        position={[0, 0.22, 0]}
        scale={[0.18, 0.22, 0.04]}
      >
        <meshBasicMaterial color="#fff0b0" />
      </mesh>
    </group>
  )
}
