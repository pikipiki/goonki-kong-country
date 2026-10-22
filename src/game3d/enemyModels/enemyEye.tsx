import { EnemyPart } from './enemyPart'
import { pick } from '../../utils/pick'

export function EnemyEye({
  pos,
  size = 0.12,
}: {
  pos: [number, number, number]
  size?: number
}) {
  return (
    <group position={pos} rotation={[0, pick(pos[2] < 0, Math.PI, 0), 0]}>
      <EnemyPart color="#f6efbb" size={[size, size * 1.14, size * 0.7]} />
      <EnemyPart
        color="#a52e22"
        pos={[0.035, -0.005, size * 0.6]}
        size={[size * 0.58, size * 0.67, size * 0.32]}
      />
      <EnemyPart
        color="#11120c"
        pos={[0.045, -0.005, size * 0.83]}
        size={[size * 0.29, size * 0.49, size * 0.12]}
      />
      <EnemyPart
        color="#fffef0"
        pos={[0.055, 0.035, size * 0.96]}
        size={[size * 0.14, size * 0.18, size * 0.09]}
      />
    </group>
  )
}
