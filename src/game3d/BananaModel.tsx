import { CylinderGeometry, MeshStandardMaterial, SphereGeometry } from 'three'
import { BANANA_GEOMETRY } from './bananaGeometry'
const peel = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.44,
    metalness: 0.04,
  }),
  stem = new MeshStandardMaterial({ color: '#727125', roughness: 0.86 }),
  tip = new MeshStandardMaterial({ color: '#513216', roughness: 0.85 })
const stemGeometry = new CylinderGeometry(0.026, 0.036, 0.14, 7),
  tipGeometry = new SphereGeometry(1, 8, 6)
export function BananaModel({ scale = 0.78 }: { scale?: number }) {
  return (
    <group scale={scale} rotation={[0.1, 0, -0.25]} dispose={null}>
      <mesh geometry={BANANA_GEOMETRY} material={peel} castShadow />
      <mesh
        geometry={stemGeometry}
        material={stem}
        position={[-0.55, 0.055, 0]}
        rotation={[0, 0, -0.5]}
      />
      <mesh
        geometry={tipGeometry}
        material={tip}
        position={[0.524, 0.12, 0]}
        scale={[0.028, 0.024, 0.023]}
      />
      <mesh
        geometry={tipGeometry}
        material={tip}
        position={[-0.583, 0.116, 0]}
        scale={[0.027, 0.018, 0.027]}
      />
    </group>
  )
}
