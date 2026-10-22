import type { Platform } from '../../game/levels'
import type { Biome } from '../../game/levels'
import { worldProceduralTexture } from './worldProceduralTexture'
import { worldBox, worldCylinder } from './worldSharedGeometries'

export function WorldGroundRails({
  biome,
  platform,
}: {
  biome: Biome
  platform: Platform
}) {
  return (
    <>
      {biome === 'mine' &&
        [-0.8, 0.8].map((railZ) => (
          <mesh
            key={railZ}
            geometry={worldBox}
            position={[0, 0.12, railZ]}
            scale={[platform.w, 0.1, 0.12]}
          >
            <meshStandardMaterial
              color="#8a8c84"
              metalness={0.7}
              roughness={0.45}
            />
          </mesh>
        ))}
      {platform.kind === 'moving' &&
        [-1, 1].map((side) => (
          <mesh
            key={side}
            geometry={worldCylinder}
            position={[side * platform.w * 0.4, 3, -1]}
            scale={[0.025, 6, 0.025]}
          >
            <meshStandardMaterial
              color="#9d814c"
              map={worldProceduralTexture('bark')}
            />
          </mesh>
        ))}
    </>
  )
}
