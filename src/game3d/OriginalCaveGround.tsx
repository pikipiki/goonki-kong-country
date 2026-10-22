import { memo, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { CanvasTexture } from 'three'
import type { Group } from 'three'
import type { Game } from '../game/engine'
import { ORIGINAL_CAVE_TERRAIN } from '../game/originalCaveTerrain'
import { GROUND_CHUNK_COLUMN_PIXELS } from './original/groundChunkVisibility'
import { createCaveGroundGeometry } from './original/caveGroundGeometry'
import { caveGroundChunkVisible } from './original/caveGroundVisibility'
import { createCaveSoilTexture } from './original/caveSoilTexture'
const CHUNK_COLUMNS = 16
const COLUMN_COUNT = Math.ceil(
  ORIGINAL_CAVE_TERRAIN.widthPixels / GROUND_CHUNK_COLUMN_PIXELS,
)
function CaveGroundChunk({
  game,
  chunkIndex,
  map,
}: {
  game: Game
  chunkIndex: number
  map: CanvasTexture
}) {
  const root = useRef<Group>(null)
  const geometry = useMemo(
    () => createCaveGroundGeometry(chunkIndex * CHUNK_COLUMNS, CHUNK_COLUMNS),
    [chunkIndex],
  )
  useEffect(
    () => () => {
      geometry.dispose()
    },
    [geometry],
  )
  useFrame(() => {
    if (root.current) {
      root.current.visible = caveGroundChunkVisible(
        chunkIndex * CHUNK_COLUMNS,
        game.player.x,
      )
    }
  })
  return (
    <group ref={root} name="canyon-ground-chunk">
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={map}
          bumpMap={map}
          bumpScale={0.035}
          vertexColors
          roughness={1}
        />
      </mesh>
    </group>
  )
}

export const OriginalCaveGround = memo(function OriginalCaveGround({
  game,
}: {
  game: Game
}) {
  const map = useMemo(() => createCaveSoilTexture(), [])
  useEffect(
    () => () => {
      map.dispose()
    },
    [map],
  )
  return (
    <>
      {Array.from(
        { length: Math.ceil(COLUMN_COUNT / CHUNK_COLUMNS) },
        (_, chunkIdx) => (
          <CaveGroundChunk
            key={chunkIdx}
            game={game}
            chunkIndex={chunkIdx}
            map={map}
          />
        ),
      )}
    </>
  )
})
