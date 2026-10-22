import { Goonk } from '../game3d/Goonk'
import { useTravelersMotion } from './travelersUseFrame'

export function Travelers({
  selected,
  initial,
  nodes,
  onSound,
}: {
  selected: number
  initial: number
  nodes: [number, number][]
  onSound?: (name: 'map-step' | 'map-arrive') => void
}) {
  const { animState, root } = useTravelersMotion(
    selected,
    initial,
    nodes,
    onSound,
  )
  let walkSpeed
  if (animState === 'walk') {
    walkSpeed = 5.5
  } else {
    walkSpeed = 0
  }
  const celebrating = animState === 'celebrate'

  return (
    <group ref={root}>
      <group scale={0.58}>
        <Goonk pink preview mapWalk={walkSpeed} mapCelebrate={celebrating} />
      </group>
      <group position={[-0.85, 0, -0.35]} scale={0.51}>
        <Goonk
          pink={false}
          preview
          mapWalk={walkSpeed}
          mapCelebrate={celebrating}
        />
      </group>
    </group>
  )
}
