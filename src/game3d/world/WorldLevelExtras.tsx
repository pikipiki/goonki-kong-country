import { CORAL_WATER_FLOOR_Y } from '../../game/marineScale'
import type { Level } from '../../game/levels'
import { worldProceduralTexture } from './worldProceduralTexture'
import { worldBox } from './worldSharedGeometries'
import { WorldCoralScatter } from './WorldCoralScatter'

export function WorldLevelExtras({ level }: { level: Level }) {
  return (
    <>
      {level.biome === 'lagoon' && (
        <mesh
          geometry={worldBox}
          name="background-water"
          position={[level.length / 2, -4.8, -18]}
          scale={[level.length + 70, 0.12, 20]}
        >
          <meshStandardMaterial
            color="#286d62"
            metalness={0.3}
            roughness={0.28}
          />
        </mesh>
      )}
      {level.originalTerrain === 'coral' && (
        <>
          <WorldCoralScatter length={level.length} />
          <mesh
            geometry={worldBox}
            position={[level.length / 2, CORAL_WATER_FLOOR_Y - 0.4, 0]}
            scale={[level.length + 4, 0.8, 3.2]}
          >
            <meshStandardMaterial
              color="#637b64"
              roughness={0.95}
              map={worldProceduralTexture('soil')}
            />
          </mesh>
        </>
      )}
    </>
  )
}
