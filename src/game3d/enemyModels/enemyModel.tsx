import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { r3fClock } from '../r3fClock'
import { Group } from 'three'
import { enemyRenderVisible, type Enemy, type Game } from '../../game/engine'
import { KingBossModel } from '../BossBattle3D'
import { ENEMY_DESIGNS } from '../../game/enemies'
import { Beaver } from './beaver'
import { Crocodile } from './crocodile'
import { Necky } from './necky'
import { Zinger } from './zinger'
import { enemyBobOffset, enemyBodyYaw } from './enemyFacing'
export function EnemyModel({
  enemy,
  game,
  preview = false,
}: {
  enemy: Enemy
  game?: Game
  preview?: boolean
}) {
  const root = useRef<Group>(null)

  const body = useRef<Group>(null)

  const gait = useRef<Group>(null)

  const wings = useRef<Group>(null)

  useFrame((state) => {
    const clock = r3fClock(state)
    const tick = clock.elapsedTime

    if (root.current) {
      if (!preview) {
        root.current.position.set(enemy.x, enemy.y, 0)
      }

      root.current.visible = enemyRenderVisible(enemy, tick, game, preview)
    }

    if (body.current) {
      body.current.rotation.y = enemyBodyYaw(enemy)
      body.current.position.y = enemyBobOffset(enemy, tick)
    }

    gait.current?.children.forEach((limb, limbIndex) => {
      limb.rotation.z = Math.sin(tick * 8 + limbIndex * Math.PI) * 0.28
    })
    wings.current?.children.forEach((wing, wingIndex) => {
      let direction
      if (wingIndex === 0) {
        direction = -1
      } else {
        direction = 1
      }

      wing.rotation.x = direction * (0.6 + Math.sin(tick * 45) * 0.65)
    })
  })

  return (
    <group ref={root} dispose={null} name="enemy" userData={{ enemy }}>
      <group ref={body}>
        <EnemyBody enemy={enemy} game={game} gait={gait} wings={wings} />
      </group>
    </group>
  )
}

export function EnemyBody({
  enemy,
  game,
  gait,
  wings,
}: {
  enemy: Enemy
  game?: Game
  gait: RefObject<Group | null>
  wings: RefObject<Group | null>
}) {
  if (enemy.kind === 'boss') {
    return (
      <group scale={ENEMY_DESIGNS.boss.height / 1.72}>
        <KingBossModel enemy={enemy} game={game} />
      </group>
    )
  }
  if (enemy.pattern === 'necky') {
    return <Necky wings={wings} />
  }
  if (enemy.kind === 'bee') {
    return <Zinger wings={wings} />
  }
  if (enemy.kind === 'beetle') {
    return <Beaver gait={gait} />
  }
  return (
    <Crocodile helmet={enemy.kind === 'armored'} king={false} gait={gait} />
  )
}
