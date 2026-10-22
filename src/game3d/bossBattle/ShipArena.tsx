import type { Game } from '../../game/engine'
import { FakeCredits } from './FakeCredits'
import { ShipArenaBackdrop } from './ShipArenaBackdrop'
import { ShipArenaCannons } from './ShipArenaCannons'
import { ShipArenaDeck } from './ShipArenaDeck'
import { ShipArenaRigging } from './ShipArenaRigging'
/** The ROM scene frames a gold deck with hanging rigging, port cannons,
 * stacked barrels and the distant island; keep these silhouettes in 3D. */
export function ShipArena({ game }: { game: Game }) {
  return (
    <group name="gangplank-galleon-arena">
      <ShipArenaDeck game={game} />
      <ShipArenaRigging />
      <ShipArenaCannons />
      <ShipArenaBackdrop />
      <FakeCredits game={game} />
    </group>
  )
}
