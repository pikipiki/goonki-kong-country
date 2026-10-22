import type { RefObject } from 'react'
import type { Group } from 'three'
import { actorBox } from './geometries'

const PLUG_SLATS = [0, 1, 2, 3, 4]

export function BonusRoomPlug({
  plugRef,
}: {
  plugRef: RefObject<Group | null>
}) {
  return (
    <group ref={plugRef} name="completed-bonus-plug" visible={false}>
      {PLUG_SLATS.map((slatIdx) => (
        <mesh
          key={slatIdx}
          geometry={actorBox}
          position={[0, 0.22 + slatIdx * 0.43, 0.16]}
          scale={[1.45, 0.41, 0.2]}
        >
          <meshStandardMaterial
            color={slatIdx % 2 ? '#70502f' : '#88613a'}
            roughness={1}
          />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={actorBox}
          position={[0, 1.07, 0.3]}
          scale={[2.25, 0.16, 0.12]}
          rotation={[0, 0, side * 0.85]}
        >
          <meshStandardMaterial color="#b58b4d" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}
