import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { Game } from '../../game/engine'
import { BananaModel } from '../BananaModel'
import { Label } from './Label'
import { actorBox, actorSphere } from './geometries'
function PickupItem({ item }: { item: Game['level']['pickups'][number] }) {
  if (item.kind === 'banana') {
    return <BananaModel />
  }
  if (item.kind === 'letter') {
    return (
      <group>
        <mesh
          rotation={[0, 0, Math.PI / 4]}
          geometry={actorBox}
          scale={[0.72, 0.72, 0.12]}
        >
          <meshStandardMaterial
            color="#b79042"
            metalness={0.45}
            roughness={0.3}
          />
        </mesh>
        <Label text={item.letter ?? ''} position={[0, 0, 0.15]} scale={0.62} />
      </group>
    )
  }
  return (
    <>
      <mesh geometry={actorSphere} scale={[0.35, 0.44, 0.26]}>
        <meshStandardMaterial color="#ef91ad" roughness={0.28} />
      </mesh>
      <Label text="1" position={[0, 0, 0.3]} scale={0.35} />
      <mesh
        geometry={actorBox}
        position={[0, -0.8, 0]}
        scale={[0.01, 0.8, 0.01]}
      >
        <meshStandardMaterial color="#ddd3ad" />
      </mesh>
    </>
  )
}

export function Pickups({ game }: { game: Game }) {
  const items = game.level.pickups
  const root = useRef<Group>(null)
  useFrame(({ clock }) => {
    const group = root.current
    if (!group) {
      return
    }
    group.children.forEach((object, childIdx) => {
      const item = items[childIdx]
      object.visible =
        !game.collected.has(childIdx) && Math.abs(item.x - game.player.x) < 22
      object.position.y =
        item.y + Math.sin(clock.elapsedTime * 2 + childIdx) * 0.1
      if (item.kind === 'banana') {
        object.rotation.y = Math.sin(clock.elapsedTime * 1.4 + childIdx) * 0.42
      }
    })
  })
  return (
    <group ref={root}>
      {items.map((item, index) => (
        <group key={index} position={[item.x, item.y, 0.3]}>
          <PickupItem item={item} />
        </group>
      ))}
    </group>
  )
}
