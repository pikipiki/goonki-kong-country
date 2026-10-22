import {
  ISLAND_TRAIL_DOT_ACTIVE,
  ISLAND_TRAIL_DOT_LOCKED,
} from './romMapPalette'

export function IslandTrailDots({
  nodes,
  unlocked,
}: {
  nodes: [number, number][]
  unlocked: number
}) {
  return (
    <>
      {nodes.slice(1).flatMap((endNode, segment) => {
        const startNode = nodes[segment]
        return Array.from({ length: 10 }, (_, dot) => {
          const blend = (dot + 0.5) / 10
          return (
            <mesh
              key={`${String(segment)}-${String(dot)}`}
              position={[
                startNode[0] + (endNode[0] - startNode[0]) * blend,
                0.18,
                startNode[1] + (endNode[1] - startNode[1]) * blend,
              ]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <circleGeometry args={[0.085, 8]} />
              <meshBasicMaterial
                color={
                  segment < unlocked
                    ? ISLAND_TRAIL_DOT_ACTIVE
                    : ISLAND_TRAIL_DOT_LOCKED
                }
              />
            </mesh>
          )
        })
      })}
    </>
  )
}
