import {
  bossBox,
  bossCone,
  bossCylinder,
  bossSphere,
  bossMaterial,
} from './bossGeometries'
export function BossPart({
  pos = [0, 0, 0],
  size = [1, 1, 1],
  color,
  shape = 'sphere',
  rotation = [0, 0, 0],
}: {
  pos?: [number, number, number]
  size?: [number, number, number]
  color: string
  shape?: 'sphere' | 'box' | 'cone' | 'cylinder'
  rotation?: [number, number, number]
}) {
  const geometry = {
    box: bossBox,
    sphere: bossSphere,
    cone: bossCone,
    cylinder: bossCylinder,
  }[shape]
  return (
    <mesh
      position={pos}
      scale={size}
      rotation={rotation}
      geometry={geometry}
      material={bossMaterial(color)}
      castShadow
      dispose={null}
    />
  )
}

const CROWN_SPIKES = [-1, 0, 1]
export function Crown() {
  return (
    <group name="king-crown">
      <BossPart color="#e7b538" shape="cylinder" size={[0.34, 0.1, 0.28]} />
      {[-1, 1].flatMap((side) =>
        CROWN_SPIKES.map((spikeIdx) => (
          <BossPart
            key={`${String(side)}-${String(spikeIdx)}`}
            color="#ffd66b"
            shape="cone"
            pos={[spikeIdx * 0.23, 0.18, side * 0.19]}
            size={[0.08, 0.36, 0.08]}
          />
        )),
      )}
      <BossPart
        color="#b32835"
        pos={[0.03, 0, 0.29]}
        size={[0.07, 0.09, 0.03]}
      />
    </group>
  )
}
