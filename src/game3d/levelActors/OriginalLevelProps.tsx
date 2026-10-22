import { useEffect, useMemo } from 'react'
import type { Game } from '../../game/engine'
import { Butterfly, GoldenAnimalToken } from './LevelDecors'
import { BreakableWall, HiddenCache } from './LevelObstacles'
import { actorBox } from './geometries'
import { textTexture } from './textTexture'

function uniqueDecors(level: Game['level']) {
  const decors = level.decors

  if (!decors) {
    return []
  }

  return decors.filter(
    (decor, decorIdx, all) =>
      all.findIndex(
        (other) =>
          other.kind === decor.kind &&
          other.x === decor.x &&
          other.y === decor.y &&
          other.text === decor.text,
      ) === decorIdx,
  )
}

export function OriginalLevelProps({ game }: { game: Game }) {
  const level = game.level

  const sparkle = useMemo(() => textTexture('✦', '#ffe6a5'), [])

  useEffect(
    () => () => {
      sparkle.dispose()
    },
    [sparkle],
  )
  const caches = level.itemCaches

  const walls = level.breakableWalls

  const decors = useMemo(() => uniqueDecors(level), [level])

  if (!caches?.length && !walls?.length && !decors.length) {
    return null
  }

  return (
    <group>
      {walls?.map((_, wallIdx) => (
        <BreakableWall
          key={`wall-${String(wallIdx)}`}
          game={game}
          index={wallIdx}
        />
      ))}
      {caches?.map((_, cacheIdx) => (
        <HiddenCache key={cacheIdx} game={game} index={cacheIdx} />
      ))}
      {decors.map((decor, decorIdx) => (
        <group
          key={`decor-${String(decorIdx)}`}
          position={[decor.x, decor.y, 0.15]}
        >
          {decor.kind === 'butterfly' && (
            <Butterfly game={game} worldX={decor.x} />
          )}
          {decor.kind === 'token' && (
            <GoldenAnimalToken game={game} posX={decor.x} posY={decor.y} />
          )}
          {decor.kind === 'sign' && (
            <>
              <mesh
                geometry={actorBox}
                position={[0, 0.5, 0]}
                scale={[0.08, 1, 0.08]}
              >
                <meshStandardMaterial color="#6b4a2a" />
              </mesh>
              <mesh
                geometry={actorBox}
                position={[0.15, 0.85, 0]}
                scale={[0.5, 0.35, 0.06]}
              >
                <meshStandardMaterial color="#8d6840" />
              </mesh>
            </>
          )}
          {decor.kind === 'sparkle' && (
            <sprite position={[0, 0, 0]} scale={[0.4, 0.4, 1]}>
              <spriteMaterial map={sparkle} transparent depthWrite={false} />
            </sprite>
          )}
        </group>
      ))}
    </group>
  )
}
