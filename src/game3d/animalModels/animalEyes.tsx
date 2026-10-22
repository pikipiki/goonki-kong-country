import { pick } from '../../utils/pick'
import { AnimalPart } from './animalPart'
import type { V3 } from './types'

export function AnimalEyes({
  pos,
  size = 0.11,
  iris = '#4b2520',
  yellow = false,
}: {
  pos: V3
  size?: number
  iris?: string
  yellow?: boolean
}) {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side} position={[pos[0], pos[1], side * pos[2]]}>
          <AnimalPart
            color={pick(yellow, '#f4d94a', '#faf1d8')}
            size={[size, size * 1.16, size * 0.54]}
          />
          <AnimalPart
            color={iris}
            pos={[size * 0.25, 0, side * size * 0.47]}
            size={[size * 0.49, size * 0.69, size * 0.24]}
          />
          <AnimalPart
            color="#101410"
            pos={[size * 0.36, 0, side * size * 0.64]}
            size={[size * 0.23, size * 0.45, size * 0.12]}
          />
          <AnimalPart
            color="#fffbee"
            pos={[size * 0.45, size * 0.35, side * size * 0.72]}
            size={[size * 0.16, size * 0.2, size * 0.08]}
          />
        </group>
      ))}
    </>
  )
}
