import { worldProceduralTexture } from './worldProceduralTexture'
import { worldBox, worldRock, worldSphere } from './worldSharedGeometries'

export function WorldJungleMonument() {
  return (
    <group position={[21, 2, -23]}>
      <mesh geometry={worldRock} scale={[4, 8, 3]} position={[-3, -1, -2]}>
        <meshStandardMaterial
          color="#3a5944"
          map={worldProceduralTexture('soil')}
        />
      </mesh>
      <mesh geometry={worldBox} scale={[1.7, 12, 0.08]}>
        <meshStandardMaterial
          color="#b4d4bd"
          transparent
          opacity={0.68}
          emissive="#6d9c89"
          emissiveIntensity={0.25}
        />
      </mesh>
      <mesh geometry={worldSphere} position={[0, -5, 0]} scale={[4, 0.15, 1]}>
        <meshBasicMaterial color="#8ab6a4" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}
