import { pick } from '../../utils/pick'
import { BossPart } from './BossPart'
import { bossRing } from './bossGeometries'
import { bossMaterial } from './bossMaterials'

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
            color={pick(stackIdx % 2, '#85542c', '#986738')}
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
