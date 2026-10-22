import { bossBox, bossCone, bossCylinder, bossSphere } from './bossGeometries'
import { bossMaterial } from './bossMaterials'

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
