import { memo, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { CanvasTexture } from 'three'
import type { Group } from 'three'
import type { Game } from '../game/engine'
import { ORIGINAL_CORAL_TERRAIN } from '../game/originalCoralTerrain'
import { coralWorldFromSource } from '../game/marineScale'
import { createCoralGroundGeometry } from './original/coralGroundGeometry'
import { createCoralReefTexture } from './original/coralReefTexture'
import { GROUND_CHUNK_COLUMN_PIXELS } from './original/groundChunkVisibility'

const CHUNK_COLUMNS = 16
function CoralGroundChunk({
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
    () => createCoralGroundGeometry(chunkIndex * CHUNK_COLUMNS, CHUNK_COLUMNS),
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
      root.current.visible =
        Math.abs(
          coralWorldFromSource(chunkIndex * CHUNK_COLUMNS + CHUNK_COLUMNS / 2) -
            game.player.x,
        ) <
        coralWorldFromSource(CHUNK_COLUMNS / 2) + 28
    }
  })
  return (
    <group ref={root}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          map={map}
          bumpMap={map}
          bumpScale={0.02}
          vertexColors
          roughness={0.95}
        />
      </mesh>
    </group>
  )
}

export const OriginalCoralGround = memo(function OriginalCoralGround({
  game,
}: {
  game: Game
}) {
  const map = useMemo(() => createCoralReefTexture(), [])
  useEffect(
    () => () => {
      map.dispose()
    },
    [map],
  )
  const chunkCount = Math.ceil(
    ORIGINAL_CORAL_TERRAIN.widthPixels /
      GROUND_CHUNK_COLUMN_PIXELS /
      CHUNK_COLUMNS,
  )
  return (
    <>
      {Array.from({ length: chunkCount }, (_, chunkIdx) => (
        <CoralGroundChunk
          key={chunkIdx}
          game={game}
          chunkIndex={chunkIdx}
          map={map}
        />
      ))}
    </>
  )
})
