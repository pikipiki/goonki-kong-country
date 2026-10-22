import { pick } from '../../utils/pick'
import { BossPart } from './BossPart'

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
            color={pick(cloudIdx % 3, '#9ca8c2', '#c2cadb')}
          />
        ))}
      </group>
    </>
  )
}
