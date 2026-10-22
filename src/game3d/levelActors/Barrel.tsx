import { Label } from './Label'
import { BarrelCannonMarker } from './BarrelCannonMarker'
import {
  barrelBodyColor,
  barrelLabelText,
  barrelRingColor,
  type BarrelKind,
} from './barrelKind'
import {
  actorBox,
  actorCannonBore,
  actorCannonTube,
  actorCylinder,
  actorRing,
} from './geometries'

const RING_OFFSETS = [-0.32, 0.32]

const RIVET_COUNT = 8

function BarrelRings({ kind }: { kind: BarrelKind }) {
  const ringColor = barrelRingColor(kind)

  return (
    <>
      {RING_OFFSETS.map((offsetY) => (
        <mesh
          key={offsetY}
          geometry={actorRing}
          position={[0, offsetY, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial
            color={ringColor}
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
      ))}
    </>
  )
}

function BarrelRivets() {
  return (
    <>
      {Array.from({ length: RIVET_COUNT }, (_, rivetIdx) => (
        <mesh
          key={rivetIdx}
          geometry={actorBox}
          position={[
            Math.sin((rivetIdx * Math.PI) / 4) * 0.448,
            0,
            Math.cos((rivetIdx * Math.PI) / 4) * 0.448,
          ]}
          rotation={[0, (rivetIdx * Math.PI) / 4, 0]}
          scale={[0.013, 0.86, 0.015]}
        >
          <meshStandardMaterial color="#685336" />
        </mesh>
      ))}
    </>
  )
}

function BarrelCannonExtras() {
  return (
    <>
      <mesh geometry={actorCannonBore} position={[0, 0.36, 0]}>
        <meshStandardMaterial color="#10160f" roughness={1} />
      </mesh>
      <mesh
        geometry={actorRing}
        position={[0, 0.48, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color="#d5b461" metalness={0.4} />
      </mesh>
      <BarrelCannonMarker />
    </>
  )
}

export function Barrel({ kind = 'throw' }: { kind?: BarrelKind }) {
  const color = barrelBodyColor(kind)

  let bodyGeometry
  if (kind === 'cannon') {
    bodyGeometry = actorCannonTube
  } else {
    bodyGeometry = actorCylinder
  }

  let groupY
  if (kind === 'cannon') {
    groupY = 0
  } else {
    groupY = 0.5
  }

  return (
    <group position={[0, groupY, 0]}>
      <mesh geometry={bodyGeometry} castShadow>
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <BarrelRings kind={kind} />
      <BarrelRivets />
      {kind === 'cannon' ? (
        <BarrelCannonExtras />
      ) : (
        <Label
          text={barrelLabelText(kind)}
          scale={0.55}
          position={[0, 0, 0.48]}
          color="#fff0c6"
        />
      )}
    </group>
  )
}
