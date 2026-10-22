import { memo, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { CanvasTexture } from 'three'
import type { Group } from 'three'
import type { Game } from '../game/engine'
import { createOriginalGroundGeometry } from './original/jungleGroundGeometry'
import { createJungleSoilTexture } from './original/jungleSoilTexture'
const CHUNK_COLUMNS = 16
const JUNGLE_COLUMN_COUNT = 169
function JungleGroundChunk({
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
    () =>
      createOriginalGroundGeometry(chunkIndex * CHUNK_COLUMNS, CHUNK_COLUMNS),
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
          chunkIndex * CHUNK_COLUMNS + CHUNK_COLUMNS / 2 - game.player.x,
        ) < 28
    }
  })
  return (
    <group ref={root} name="jungle-ground-chunk">
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

export const OriginalGround = memo(function OriginalGround({
  game,
}: {
  game: Game
}) {
  const map = useMemo(() => createJungleSoilTexture(), [])
  useEffect(
    () => () => {
      map.dispose()
    },
    [map],
  )
  return (
    <>
      {Array.from(
        { length: Math.ceil(JUNGLE_COLUMN_COUNT / CHUNK_COLUMNS) },
        (_, chunkIdx) => (
          <JungleGroundChunk
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
