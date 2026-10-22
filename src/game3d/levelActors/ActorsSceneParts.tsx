import type { RefObject } from 'react'
import type { Group } from 'three'
import type { Game } from '../../game/engine'
import { EnemyModel } from '../EnemyModels'
import { Label } from './Label'
import { Barrel } from './Barrel'
import { actorBox, actorCylinder, actorSphere } from './geometries'

const SEALED_SLATS = [0, 1, 2, 3, 4, 5, 6]

const PROJECTILE_SLOTS = 8

const NUT_SLOTS = 12

const WHEEL_SIDES = [-1, 1]

export function SealedBonusEntrance() {
  return (
    <group name="sealed-bonus-entrance" position={[0, 0, 1.72]}>
      {SEALED_SLATS.map((slatIdx) => (
        <mesh
          key={slatIdx}
          geometry={actorBox}
          position={[0, 0.3 + slatIdx * 0.48, 0]}
          scale={[1.5, 0.43, 0.18]}
        >
          <meshStandardMaterial
            color={slatIdx % 2 ? '#70502f' : '#88613a'}
            roughness={1}
          />
        </mesh>
      ))}
      <mesh
        geometry={actorBox}
        position={[0, 1.7, 0.12]}
        scale={[1.55, 0.15, 0.16]}
        rotation={[0, 0, 0.7]}
      >
        <meshStandardMaterial color="#b58b4d" />
      </mesh>
    </group>
  )
}

export function LevelBarrels({
  level,
  barrelsRef,
}: {
  level: Game['level']
  barrelsRef: RefObject<Group | null>
}) {
  return (
    <group ref={barrelsRef}>
      {level.barrels.map((barrel, barrelIdx) => (
        <group
          key={barrelIdx}
          name={barrel.kind === 'cannon' ? 'cannon' : 'barrel'}
          userData={{ barrelIndex: barrelIdx }}
          position={[barrel.x, barrel.y, 0]}
        >
          <Barrel kind={barrel.kind} />
        </group>
      ))}
    </group>
  )
}

export function ActorsCombatGroups({
  game,
  carriedRef,
  projectilesRef,
  nutsRef,
}: {
  game: Game
  carriedRef: RefObject<Group | null>
  projectilesRef: RefObject<Group | null>
  nutsRef: RefObject<Group | null>
}) {
  return (
    <>
      {game.enemies.map((enemy, enemyIdx) => (
        <EnemyModel key={enemyIdx} enemy={enemy} game={game} />
      ))}
      <group ref={carriedRef}>
        <Barrel />
      </group>
      <group ref={projectilesRef}>
        {Array.from({ length: PROJECTILE_SLOTS }, (_, slotIdx) => (
          <group key={slotIdx} visible={false}>
            <Barrel />
          </group>
        ))}
      </group>
      <group ref={nutsRef}>
        {Array.from({ length: NUT_SLOTS }, (_, slotIdx) => (
          <mesh
            key={slotIdx}
            geometry={actorSphere}
            visible={false}
            scale={0.22}
            castShadow
          >
            <meshStandardMaterial color="#6b4a28" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </>
  )
}

export function MineCart({ cartRef }: { cartRef: RefObject<Group | null> }) {
  return (
    <group ref={cartRef} name="mine-cart">
      <mesh
        geometry={actorBox}
        scale={[1.9, 0.55, 1.25]}
        position={[0, 0.1, 0]}
        castShadow
      >
        <meshStandardMaterial color="#746c63" metalness={0.5} />
      </mesh>
      {WHEEL_SIDES.flatMap((sideX) =>
        WHEEL_SIDES.map((sideZ) => (
          <mesh
            key={`${String(sideX)}${String(sideZ)}`}
            geometry={actorCylinder}
            scale={[0.5, 0.18, 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
            position={[sideX * 0.63, -0.32, sideZ * 0.66]}
          >
            <meshStandardMaterial color="#353e3d" metalness={0.6} />
          </mesh>
        )),
      )}
    </group>
  )
}

export function LevelExitSign({ game }: { game: Game }) {
  if (game.level.biome === 'ship') {
    return null
  }

  return (
    <group position={[game.level.length - 1, 0, 0]}>
      <mesh
        geometry={actorBox}
        position={[0, 1.4, 0]}
        scale={[0.14, 2.8, 0.14]}
      >
        <meshStandardMaterial color="#856744" />
      </mesh>
      <mesh
        geometry={actorBox}
        position={[0.3, 2.5, 0]}
        scale={[2, 0.8, 0.22]}
        rotation={[0, 0, -0.06]}
      >
        <meshStandardMaterial color="#96734b" roughness={1} />
      </mesh>
      <Label text="SORTIE →" position={[0.3, 2.5, 0.2]} scale={0.5} />
    </group>
  )
}
