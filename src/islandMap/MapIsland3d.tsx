import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { tallNodes, wideNodes } from './mapData'
import { IslandStageNode } from './IslandStageNode'
import { IslandTrailDots } from './IslandTrailDots'
import { Travelers } from './Travelers'
import type { MapProps } from './types'
import { useMapIslandProjection } from './useMapIslandProjection'
import { MapIsland3dEnvironment } from './MapIsland3dEnvironment'

export function MapIsland3d({
  selected,
  unlocked,
  onSelect,
  initial,
  onProject,
  onSound,
}: Omit<MapProps, 'onConfirm'> & {
  onProject: (points: { x: number; y: number }[]) => void
}) {
  const { camera, size } = useThree()
  const portrait = size.width < 600 && size.height > size.width * 0.8
  const nodes = portrait ? tallNodes : wideNodes
  const zoom = useMemo(() => {
    if (portrait) {
      return Math.min(size.width / 18, size.height / 23)
    }
    return Math.min(size.width / 27, size.height / 10.5)
  }, [portrait, size.width, size.height])
  const lookTarget = portrait ? 1 : 0

  useMapIslandProjection(
    camera,
    lookTarget,
    nodes,
    onProject,
    size.width,
    size.height,
  )

  return (
    <>
      <MapIsland3dEnvironment zoom={zoom} portrait={portrait} />
      {nodes.map(([nodeX, nodeZ], index) => (
        <IslandStageNode
          key={index}
          index={index}
          nodeX={nodeX}
          nodeZ={nodeZ}
          selected={selected}
          unlocked={unlocked}
          onSelect={onSelect}
        />
      ))}
      <IslandTrailDots nodes={nodes} unlocked={unlocked} />
      <Travelers
        selected={selected}
        initial={initial}
        nodes={nodes}
        onSound={onSound}
      />
    </>
  )
}
