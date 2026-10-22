import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import type { Platform } from '../../game/levels'
import type { Game } from '../../game/engine'
import { PALETTES } from './worldPalettes'
import { worldProceduralTexture } from './worldProceduralTexture'
import { buildGroundInstances } from './worldGroundInstances'
import { worldBox } from './worldSharedGeometries'
import { WorldBatch } from './WorldBatch'
import { WorldGroundDecor, WorldGroundGrassCap } from './WorldGroundDecor'
import { WorldGroundRails } from './WorldGroundRails'

export function WorldGround({
  platform,
  game,
}: {
  platform: Platform
  game: Game
}) {
  const ref = useRef<Group>(null)

  const biome = game.level.biome

  const palette = PALETTES[biome]

  const wood = platform.kind === 'wood' || biome === 'mine'

  const stone = platform.kind === 'stone'

  useFrame(() => {
    if (ref.current) {
      ref.current.position.y = game.surface(platform)
      ref.current.visible =
        Math.abs(platform.x - game.player.x) < 34 &&
        !(game.phase === 'title' && platform.y > 0)
    }
  })
  let depth
  if (wood && platform.h < 2) {
    depth = 0.2
  } else {
    depth = platform.h
  }

  const data = useMemo(() => buildGroundInstances(platform), [platform])

  return (
    <group ref={ref} position={[platform.x, platform.y, 0]}>
      <mesh
        geometry={worldBox}
        position={[0, -depth / 2, 0]}
        scale={[platform.w, depth, 3.2]}
      >
        <meshStandardMaterial
          color={wood ? '#644726' : palette.ground}
          map={worldProceduralTexture(wood ? 'wood' : 'soil')}
          bumpMap={worldProceduralTexture(wood ? 'wood' : 'soil')}
          bumpScale={0.065}
          roughness={1}
        />
      </mesh>
      {wood ? (
        <WorldBatch
          geometry={worldBox}
          items={data.planks}
          color="#d6b16e"
          map="wood"
        />
      ) : (
        <>
          <mesh
            geometry={worldBox}
            position={[0, -0.08, 0]}
            scale={[platform.w + 0.06, 0.17, 3.35]}
          >
            <WorldGroundGrassCap biome={biome} />
          </mesh>
          <WorldGroundDecor biome={biome} stone={stone} data={data} />
        </>
      )}
      <WorldGroundRails biome={biome} platform={platform} />
    </group>
  )
}
