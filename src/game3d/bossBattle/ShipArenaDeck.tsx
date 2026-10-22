import { bossArenaBounds } from '../../game/bossArena'
import type { Game } from '../../game/engine'
import { BossPart } from './BossPart'
import { bossBox } from './bossGeometries'
import { bossMaterial } from './bossMaterials'
import { pick } from '../../utils/pick'

const PLANK_COUNT = 50

export function ShipArenaDeck({ game }: { game: Game }) {
  const bounds = bossArenaBounds(game.level.length)

  const edgePositions = [bounds.left, bounds.right]

  return (
    <>
      {edgePositions.map((edgeX) => (
        <BossPart
          key={`edge-${String(edgeX)}`}
          pos={[edgeX, 4.4, 0.1]}
          size={[0.18, 9, 0.2]}
          color="#6d4b2b"
          shape="box"
        />
      ))}
      <mesh
        geometry={bossBox}
        position={[11, -0.65, 0]}
        scale={[25, 1.2, 4.6]}
        material={bossMaterial('#694528')}
      />
      {Array.from({ length: PLANK_COUNT }, (_, plankIdx) => (
        <mesh
          key={plankIdx}
          geometry={bossBox}
          position={[-1.25 + plankIdx * 0.5, -0.045, 0]}
          scale={[0.475, 0.1, 4.5]}
          material={bossMaterial(pick(plankIdx % 3, '#c69a50', '#ae7a36'))}
        />
      ))}
      <BossPart
        pos={[11, 0.65, -2.2]}
        size={[25, 0.18, 0.25]}
        color="#8d572b"
        shape="box"
      />
    </>
  )
}
