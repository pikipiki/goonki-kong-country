import type { Group } from 'three'
import type { RefObject } from 'react'
import { KingBossModel } from '../BossBattle3D'
import { ENEMY_DESIGNS } from '../../game/enemies'
import type { Enemy, Game } from '../../game/engine'
import { Beaver } from './beaver'
import { Crocodile } from './crocodile'
import { Necky } from './necky'
import { Zinger } from './zinger'

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
