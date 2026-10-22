import { enemyShapes } from './enemyGeometries'
import { enemyMaterial } from './enemyMaterials'

export function EnemyPart({
  color,
  pos = [0, 0, 0],
  size = [1, 1, 1],
  rotation = [0, 0, 0],
  shape = 'round',
}: {
  color: string
  pos?: [number, number, number]
  size?: [number, number, number]
  rotation?: [number, number, number]
  shape?: keyof typeof enemyShapes
}) {
  return (
    <mesh
      geometry={enemyShapes[shape]}
      material={enemyMaterial(color)}
      position={pos}
      scale={size}
      rotation={rotation}
      castShadow
      dispose={null}
    />
  )
}
