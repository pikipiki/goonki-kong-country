import { memo, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { CanvasTexture } from 'three'
import type { Group } from 'three'
import type { Game } from '../game/engine'
import { ORIGINAL_MINE_CART_TERRAIN } from '../game/originalMineCartTerrain'
import { GROUND_CHUNK_COLUMN_PIXELS } from './original/groundChunkVisibility'
import { createMineCartGroundGeometry } from './original/mineCartGroundGeometry'
import { mineCartGroundChunkVisible } from './original/mineCartGroundVisibility'
import { createSoilTexture } from './original/soilTexture'
const CHUNK_COLUMNS = 16
const COLUMN_COUNT = Math.ceil(
  ORIGINAL_MINE_CART_TERRAIN.widthPixels / GROUND_CHUNK_COLUMN_PIXELS,
)
function MineCartGroundChunk({
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
      createMineCartGroundGeometry(chunkIndex * CHUNK_COLUMNS, CHUNK_COLUMNS),
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
      root.current.visible = mineCartGroundChunkVisible(
        chunkIndex * CHUNK_COLUMNS,
        game.player.x,
      )
    }
  })
  return (
    <group ref={root} name="mine-cart-ground-chunk">
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

export const OriginalMineCartGround = memo(function OriginalMineCartGround({
  game,
}: {
  game: Game
}) {
  const map = useMemo(() => createSoilTexture('mineCart'), [])
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
          <MineCartGroundChunk
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
