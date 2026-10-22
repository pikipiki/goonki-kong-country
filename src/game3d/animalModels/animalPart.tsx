import { animalBox, animalCone, animalSphere } from './animalGeometries'
import { animalMat } from './animalMaterials'
import type { V3 } from './types'
function partGeometry(shape: 'sphere' | 'cone' | 'box') {
  if (shape === 'cone') {
    return animalCone
  }
  if (shape === 'box') {
    return animalBox
  }
  return animalSphere
}

export function AnimalPart({
  color,
  pos = [0, 0, 0],
  size = [1, 1, 1],
  rotate = [0, 0, 0],
  shape = 'sphere',
}: {
  color: string
  pos?: V3
  size?: V3
  rotate?: V3
  shape?: 'sphere' | 'cone' | 'box'
}) {
  return (
    <mesh
      position={pos}
      scale={size}
      rotation={rotate}
      geometry={partGeometry(shape)}
      material={animalMat(color)}
      castShadow
      dispose={null}
    />
  )
}
