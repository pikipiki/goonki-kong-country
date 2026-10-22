import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { type Group } from 'three'
import { type Game } from '../../game/engine'
import { Crown } from './BossPart'
import { bossRing, bossSphere, bossMaterial } from './bossGeometries'
const PROJECTILE_POOL = 32

export function BossProjectiles3D({ game }: { game: Game }) {
  const root = useRef<Group>(null)

  useFrame(() => {
    root.current?.children.forEach((groupNode, poolIdx) => {
      const projectile = game.bossProjectiles.at(poolIdx)

      groupNode.visible = projectile?.active === true

      if (!projectile) {
        return
      }

      groupNode.position.set(
        projectile.x,
        projectile.warning > 0 ? 0.03 : projectile.y,
        0.2,
      )
      if (projectile.kind === 'crown') {
        groupNode.rotation.z = projectile.rotation
      } else {
        groupNode.rotation.z = 0
      }
      const crownChild = groupNode.children[0]
      const ballChild = groupNode.children[1]
      const warningChild = groupNode.children[2]
      if (!crownChild || !ballChild || !warningChild) {
        return
      }

      crownChild.visible = projectile.kind === 'crown'
      ballChild.visible =
        projectile.kind === 'cannonball' && projectile.warning <= 0
      const impact = (projectile.impact ?? 0) > 0

      ballChild.scale.set(
        impact ? 0.43 : 0.34,
        impact ? 0.21 : 0.34,
        impact ? 0.4 : 0.34,
      )
      ballChild.rotation.z = (Math.floor(projectile.age * 12) * Math.PI) / 8
      warningChild.visible =
        projectile.kind === 'cannonball' && projectile.warning > 0
      warningChild.scale.setScalar(0.6 + Math.sin(game.time * 18) * 0.12)
    })
  })
  return (
    <group ref={root} name="boss-projectiles">
      {Array.from({ length: PROJECTILE_POOL }, (_, poolIdx) => (
        <group key={poolIdx} visible={false}>
          <group scale={0.85}>
            <Crown />
          </group>
          <mesh
            geometry={bossSphere}
            scale={0.34}
            material={bossMaterial('#293039')}
            castShadow
          />
          <mesh geometry={bossRing} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color="#ffd56d" transparent opacity={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
