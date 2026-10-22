import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import type { Game } from '../../game/engine'
import { Label } from './Label'
import { actorBox } from './geometries'

export function HiddenCache({ game, index }: { game: Game; index: number }) {
  const root = useRef<Group>(null)

  const caches = game.level.itemCaches

  const cache = caches?.[index]

  useFrame(() => {
    if (!cache || !root.current) {
      return
    }

    root.current.visible =
      game.revealedCaches.has(index) &&
      !game.collectedCaches.has(index) &&
      Math.abs(cache.x - game.player.x) < 24
  })

  if (!cache) {
    return null
  }

  return (
    <group ref={root} name="hidden-cache" position={[cache.x, cache.y, 0.2]}>
      <mesh geometry={actorBox} scale={[0.4, 0.3, 0.25]}>
        <meshStandardMaterial color="#c9a227" />
      </mesh>
      <Label text="!" position={[0, 0.35, 0.15]} scale={0.28} />
    </group>
  )
}

export function BreakableWall({ game, index }: { game: Game; index: number }) {
  const root = useRef<Mesh>(null)

  const walls = game.level.breakableWalls

  const wall = walls?.[index]

  useFrame(() => {
    if (!wall || !root.current) {
      return
    }

    root.current.visible =
      !game.brokenWalls.has(index) && Math.abs(wall.x - game.player.x) < 28
  })

  if (!wall) {
    return null
  }

  return (
    <mesh
      ref={root}
      name="breakable-wall"
      userData={{ wallIndex: index }}
      geometry={actorBox}
      position={[wall.x, wall.y + wall.h / 2, 0]}
      scale={[wall.w, wall.h, 0.35]}
    >
      <meshStandardMaterial
        color={game.level.biome === 'jungle' ? '#5e4931' : '#4a4038'}
        roughness={0.95}
      />
    </mesh>
  )
}
