import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { Game } from '../../game/engine'
import { BonusRoomPlug } from './BonusRoomPlug'
import { Label } from './Label'
import { actorBox } from './geometries'

const DOOR_OFFSETS = [-0.77, 0.77]

function BonusRoom({ game, index }: { game: Game; index: number }) {
  const root = useRef<Group>(null)

  const open = useRef<Group>(null)

  const plug = useRef<Group>(null)

  const rooms = game.level.bonusRooms

  const walls = game.level.breakableWalls

  const room = rooms?.[index]

  let wall
  if (room && walls) {
    wall = walls[room.wallIndex]
  } else {
    wall = undefined
  }

  useFrame(() => {
    if (!room || !wall) {
      return
    }

    const completed = game.isBonusCompleted(index)

    if (root.current) {
      root.current.visible =
        game.brokenWalls.has(room.wallIndex) &&
        Math.abs(wall.x - game.player.x) < 24
    }

    if (open.current) {
      open.current.visible = !completed
    }

    if (plug.current) {
      plug.current.visible = completed
    }
  })

  if (!room || !wall) {
    return null
  }

  return (
    <group
      ref={root}
      name="bonus-door"
      userData={{ roomIndex: index }}
      position={[wall.x, wall.y, 1.7]}
    >
      <mesh
        geometry={actorBox}
        position={[0, 1.05, 0]}
        scale={[1.45, 2.1, 0.1]}
      >
        <meshStandardMaterial color="#10170d" roughness={1} />
      </mesh>
      {DOOR_OFFSETS.map((offsetX) => (
        <mesh
          key={offsetX}
          geometry={actorBox}
          position={[offsetX, 1.1, 0.1]}
          scale={[0.16, 2.3, 0.22]}
        >
          <meshStandardMaterial color="#9b723d" />
        </mesh>
      ))}
      <mesh
        geometry={actorBox}
        position={[0, 2.25, 0.1]}
        scale={[1.7, 0.2, 0.22]}
      >
        <meshStandardMaterial color="#b79552" />
      </mesh>
      <group ref={open} name="open-bonus-entrance">
        <Label text="BONUS →" position={[0, 2.65, 0.15]} scale={0.32} />
      </group>
      <BonusRoomPlug plugRef={plug} />
    </group>
  )
}

export function BonusPickups({ game }: { game: Game }) {
  const rooms = game.level.bonusRooms

  if (!rooms?.length) {
    return null
  }

  return (
    <>
      {rooms.map((_, roomIdx) => (
        <BonusRoom key={roomIdx} game={game} index={roomIdx} />
      ))}
    </>
  )
}
