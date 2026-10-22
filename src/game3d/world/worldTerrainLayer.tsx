import type { Game } from '../../game/engine'
import type { Level } from '../../game/levels'
import { OriginalCaveGround } from '../OriginalCaveGround'
import { OriginalCoralGround } from '../OriginalCoralGround'
import { OriginalGround } from '../OriginalGround'
import { OriginalMineCartGround } from '../OriginalMineCartGround'
import { WorldGround } from './WorldGround'

export function WorldTerrainLayer({
  game,
  level,
}: {
  game: Game
  level: Level
}) {
  const terrain = level.originalTerrain
  if (terrain === 'jungle') {
    return <OriginalGround game={game} />
  }
  if (terrain === 'cave') {
    return <OriginalCaveGround game={game} />
  }
  if (terrain === 'mineCart') {
    return <OriginalMineCartGround game={game} />
  }
  if (terrain === 'coral') {
    return <OriginalCoralGround game={game} />
  }
  if (level.biome === 'ship') {
    return null
  }
  return (
    <>
      {level.platforms.map((platform, platformIdx) => (
        <WorldGround key={platformIdx} platform={platform} game={game} />
      ))}
    </>
  )
}
