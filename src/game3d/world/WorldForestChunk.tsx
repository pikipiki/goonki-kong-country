import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import type { Biome } from '../../game/levels'
import type { Game } from '../../game/engine'
import { buildForestChunkData } from './forestChunkData'
import { PALETTES } from './worldPalettes'
import {
  worldBox,
  worldCone,
  worldCoral,
  worldCylinder,
  worldFern,
  worldLeaf,
  worldRock,
  worldVine,
} from './worldSharedGeometries'
import { WorldBatch } from './WorldBatch'

export function WorldForestChunk({
  chunkX,
  biome,
  game,
}: {
  chunkX: number
  biome: Biome
  game: Game
}) {
  const root = useRef<Group>(null)

  const palette = PALETTES[biome]

  useFrame(() => {
    if (root.current) {
      root.current.visible = Math.abs(chunkX - game.player.x) < 34
    }
  })
  const data = useMemo(
    () => buildForestChunkData(chunkX, biome),
    [chunkX, biome],
  )

  return (
    <group ref={root} name="background-decor" position={[0, 0, -4]}>
      <WorldBatch
        geometry={worldCylinder}
        items={data.trunks}
        color={biome === 'lagoon' ? '#c5b1a2' : '#aaa28a'}
        map="bark"
      />
      <WorldBatch
        geometry={worldLeaf}
        items={data.foliage}
        color="#c2dc91"
        map="leaf"
        vertexColors
      />
      <WorldBatch
        geometry={worldFern}
        items={data.ferns}
        color="#c1dba1"
        vertexColors
      />
      <WorldBatch geometry={worldCoral} items={data.corals} color="#f4dacb" />
      <WorldBatch
        geometry={worldCylinder}
        items={data.roots}
        color="#bda788"
        map="bark"
      />
      <WorldBatch
        geometry={worldRock}
        items={data.stones}
        color={biome === 'lagoon' ? '#a8c6bc' : palette.ground}
        map="soil"
      />
      <WorldBatch geometry={worldVine} items={data.vines} color="#75953e" />
      <WorldBatch
        geometry={biome === 'ship' ? worldBox : worldCone}
        items={data.extras}
        color="#a9a18b"
        map={biome === 'ship' ? ('wood' as const) : undefined}
      />
    </group>
  )
}
