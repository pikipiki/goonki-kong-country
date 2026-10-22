import { memo } from 'react'
import type { Game } from '../../game/engine'
import { BossProjectiles3D } from '../BossBattle3D'
import { ContactShadows } from '../ContactShadows'
import { BonusPickups } from './BonusRooms'
import { OriginalLevelProps } from './OriginalLevelProps'
import { Pickups } from './Pickups'
import {
  ActorsCombatGroups,
  LevelBarrels,
  LevelExitSign,
  MineCart,
  SealedBonusEntrance,
} from './ActorsSceneParts'
import { useActorsFrame } from './useActorsFrame'

export const Actors = memo(function Actors({ game }: { game: Game }) {
  const level = game.level

  const { barrels, carried, cart, projectiles, nuts, effects } = useActorsFrame(
    game,
    level,
  )

  return (
    <>
      <ContactShadows game={game} />
      {level.biome === 'ship' && <BossProjectiles3D game={game} />}
      <Pickups game={game} />
      <BonusPickups game={game} />
      {game.bonus && <SealedBonusEntrance />}
      <OriginalLevelProps game={game} />
      <LevelBarrels level={level} barrelsRef={barrels} />
      <ActorsCombatGroups
        game={game}
        carriedRef={carried}
        projectilesRef={projectiles}
        nutsRef={nuts}
      />
      <MineCart cartRef={cart} />
      <group ref={effects} />
      <LevelExitSign game={game} />
    </>
  )
})
