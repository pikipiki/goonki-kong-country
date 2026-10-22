import { ShipArena } from './BossBattle3D'
import { memo, useMemo } from 'react'
import type { Level } from '../game/levels'
import type { Game } from '../game/engine'
import { WorldJungleMonument } from './world/WorldJungleMonument'
import { WorldLevelExtras } from './world/WorldLevelExtras'
import { WorldForestChunk } from './world/WorldForestChunk'
import { WorldMotes } from './world/WorldMotes'
import { PALETTES } from './world/worldPalettes'
import { WorldTerrainLayer } from './world/worldTerrainLayer'
import {
  worldAmbient,
  worldFillColor,
  worldFogFar,
  worldFogNear,
  worldHemiSky,
} from './world/worldLevelFog'

export { PALETTES } from './world/worldPalettes'

export const World = memo(function World({
  game,
  level,
}: {
  game: Game
  level: Level
}) {
  const palette = PALETTES[level.biome]

  const chunks = useMemo(
    () =>
      Array.from(
        { length: Math.ceil(level.length / 16) + 4 },
        (_, chunkIdx) => chunkIdx * 16 - 16,
      ),
    [level],
  )

  const forestChunks: number[] = level.biome === 'ship' ? [] : chunks

  const fogNear = worldFogNear(level)
  const fogFar = worldFogFar(level)
  const hemiSky = worldHemiSky(level)
  const ambient = worldAmbient(level)
  const fillColor = worldFillColor(level)

  return (
    <>
      <color attach="background" args={[palette.sky]} />
      <fog attach="fog" args={[palette.mist, fogNear, fogFar]} />
      <hemisphereLight args={[hemiSky, '#1a2013', 1.3]} />
      <ambientLight intensity={ambient} />
      <directionalLight
        position={[-7, 12, 9]}
        color={palette.light}
        intensity={2.8}
      />
      <directionalLight
        position={[-9, 5, -6]}
        color={fillColor}
        intensity={0.8}
      />
      <WorldTerrainLayer game={game} level={level} />
      {level.biome === 'ship' && <ShipArena game={game} />}
      {forestChunks.map((chunkX) => (
        <WorldForestChunk
          key={chunkX}
          chunkX={chunkX}
          biome={level.biome}
          game={game}
        />
      ))}
      <WorldLevelExtras level={level} />
      {level.biome === 'jungle' && !level.originalTerrain && (
        <WorldJungleMonument />
      )}
      <WorldMotes game={game} />
    </>
  )
})
