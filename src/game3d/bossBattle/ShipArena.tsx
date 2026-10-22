import { type Game } from '../../game/engine'
import { FakeCredits } from './FakeCredits'
import { BossPart } from './BossPart'
import { bossRing, bossMaterial, bossBox } from './bossGeometries'
import { bossArenaBounds } from '../../game/bossArena'
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

const ISLAND_PEAKS = [-0.6, 0.15, 0.7]

const CLOUD_COUNT = 24

export function ShipArenaBackdrop() {
  return (
    <>
      <mesh name="galleon-sea" position={[11, -40, -17]}>
        <planeGeometry args={[200, 80]} />
        <meshBasicMaterial color="#8397b5" fog={false} />
      </mesh>
      <group name="distant-island" position={[11, 0, -30]} scale={0.55}>
        <BossPart
          pos={[0, 0, 0]}
          size={[4, 1.4, 1.5]}
          color="#627249"
          shape="cone"
        />
        <BossPart
          pos={[0, 1, 0]}
          size={[1.7, 3.2, 1]}
          color="#8c8c7c"
          shape="cone"
        />
        {ISLAND_PEAKS.map((peakX, peakIdx) => (
          <group key={peakX} position={[peakX, 2.3 + (peakIdx % 2) * 0.6, 0.1]}>
            <BossPart size={[0.22, 0.9, 0.3]} color="#e5e3cf" shape="box" />
            <BossPart
              pos={[0, 0.7, 0]}
              size={[0.28, 0.55, 0.32]}
              color="#bac6cd"
              shape="cone"
            />
          </group>
        ))}
      </group>
      <group name="galleon-clouds">
        {Array.from({ length: CLOUD_COUNT }, (_, cloudIdx) => (
          <BossPart
            key={cloudIdx}
            pos={[-28 + cloudIdx * 3.4, 1 + Math.sin(cloudIdx * 2) * 0.7, -37]}
            size={[5, 0.8 + (cloudIdx % 3) * 0.3, 1]}
            color={cloudIdx % 3 ? '#9ca8c2' : '#c2cadb'}
          />
        ))}
      </group>
    </>
  )
}

const PORT_CANNON_X = [0.5, 21.5]

const BARREL_STACKS: [number, number][] = [
  [9.8, 0.46],
  [11, 0.46],
  [12.2, 0.46],
  [10.4, 1.35],
  [11.6, 1.35],
  [11, 2.24],
]

const BARREL_RING_OFFSETS = [-0.42, 0.42]

function PortCannon({ anchorX }: { anchorX: number }) {
  return (
    <group position={[anchorX, 0.48, -1.95]}>
      <BossPart size={[0.6, 0.52, 0.4]} color="#59452e" shape="box" />
      <BossPart
        pos={[0, 0.35, 0.17]}
        size={[0.3, 1.15, 0.3]}
        color="#353636"
        shape="cylinder"
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        geometry={bossRing}
        position={[0, 0.35, 0.73]}
        scale={0.3}
        material={bossMaterial('#847046')}
      />
    </group>
  )
}

export function ShipArenaCannons() {
  return (
    <>
      {PORT_CANNON_X.map((anchorX) => (
        <PortCannon key={anchorX} anchorX={anchorX} />
      ))}
      {BARREL_STACKS.map(([stackX, stackY], stackIdx) => (
        <group
          key={stackIdx}
          position={[stackX, stackY, -2.9]}
          rotation={[Math.PI / 2, 0, ((stackIdx % 3) - 1) * 0.16]}
        >
          <BossPart
            size={[0.55, 0.65, 0.55]}
            color={stackIdx % 2 ? '#85542c' : '#986738'}
            shape="cylinder"
          />
          {BARREL_RING_OFFSETS.map((ringY) => (
            <BossPart
              key={ringY}
              pos={[0, ringY, 0]}
              size={[0.57, 0.06, 0.57]}
              color="#433827"
              shape="cylinder"
            />
          ))}
        </group>
      ))}
    </>
  )
}

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
          material={bossMaterial(plankIdx % 3 ? '#c69a50' : '#ae7a36')}
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

const MAST_COLUMNS = [0, 1, 2, 3, 4, 5]
const RIG_YARDS = [2, 3, 4, 5, 6, 7, 8]
const RIG_MAST_X = [-0.2, 19.5]
function ShipMastCluster({ anchorX }: { anchorX: number }) {
  return (
    <group position={[anchorX, 0, -2.8]}>
      {MAST_COLUMNS.map((columnIdx) => (
        <group key={columnIdx} position={[columnIdx * 0.55, 0, 0]}>
          <BossPart
            pos={[0, 5, 0]}
            size={[0.045, 8.6, 0.045]}
            color="#55432b"
            shape="box"
            rotation={[0, 0, (columnIdx - 2.5) * 0.007]}
          />
          <mesh
            geometry={bossRing}
            position={[0, 0.95, 0]}
            scale={[0.13, 0.26, 0.13]}
            material={bossMaterial('#715635')}
          />
        </group>
      ))}
      {RIG_YARDS.map((yardY) => (
        <BossPart
          key={yardY}
          pos={[1.37, yardY, 0]}
          size={[2.8, 0.045, 0.045]}
          color="#55432b"
          shape="box"
          rotation={[0, 0, 0.03]}
        />
      ))}
    </group>
  )
}

export function ShipArenaRigging() {
  return (
    <>
      {RIG_MAST_X.map((anchorX) => (
        <ShipMastCluster key={anchorX} anchorX={anchorX} />
      ))}
    </>
  )
}
