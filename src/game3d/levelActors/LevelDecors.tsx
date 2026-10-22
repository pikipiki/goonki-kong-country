import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { Game } from '../../game/engine'
import { actorCylinder, actorSphere } from './geometries'
import { pick } from '../../utils/pick'

export function Butterfly({ game, worldX }: { game: Game; worldX: number }) {
  const root = useRef<Group>(null)

  const wings = useRef<Group>(null)

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime

    if (root.current) {
      root.current.visible = Math.abs(worldX - game.player.x) < 24
      root.current.position.y = Math.sin(elapsed * 2 + worldX) * 0.12
    }

    wings.current?.children.forEach((wing, wingIdx) => {
      wing.rotation.y =
        pick(wingIdx, 1, -1) * (0.5 + Math.sin(elapsed * 15) * 0.65)
    })
  })
  return (
    <group ref={root} position={[0, 0, -2.4]} name="background-butterfly">
      <mesh geometry={actorSphere} scale={[0.025, 0.1, 0.025]}>
        <meshStandardMaterial color="#59415a" />
      </mesh>
      <group ref={wings}>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh
              geometry={actorSphere}
              position={[side * 0.11, 0.015, 0]}
              rotation={[0, 0, -side * 0.4]}
              scale={[0.12, 0.16, 0.018]}
            >
              <meshStandardMaterial color="#e4a6c2" roughness={0.85} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

export function GoldenAnimalToken({
  game,
  posX,
  posY,
}: {
  game: Game
  posX: number
  posY: number
}) {
  const root = useRef<Group>(null)

  useFrame(() => {
    if (!root.current) {
      return
    }

    root.current.visible = !game.isTokenCollected({
      kind: 'token',
      x: posX,
      y: posY,
    })
    root.current.position.y = 0.72 + Math.sin(game.time * 3) * 0.09
  })
  return (
    <group ref={root}>
      <mesh
        geometry={actorCylinder}
        scale={[0.35, 0.12, 0.35]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color="#e8c84a" metalness={0.7} />
      </mesh>
    </group>
  )
}
