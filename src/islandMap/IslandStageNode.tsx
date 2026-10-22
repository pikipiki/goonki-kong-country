import { stageRingColor } from './stageRingColor'
import { stageColors } from './mapData'
import { pick } from '../utils/pick'

export function IslandStageNode({
  index,
  nodeX,
  nodeZ,
  selected,
  unlocked,
  onSelect,
}: {
  index: number
  nodeX: number
  nodeZ: number
  selected: number
  unlocked: number
  onSelect: (index: number) => void
}) {
  const ringColor = stageRingColor(index, selected, unlocked)
  let emissive
  if (index === selected) {
    emissive = '#8c5c0e'
  } else {
    emissive = '#000000'
  }

  return (
    <group position={[nodeX, 0, nodeZ]}>
      <mesh position={[0, -0.4, 0]} scale={[2.2, 0.7, 1.9]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color={stageColors[index]} roughness={0.95} />
      </mesh>
      {(index === 2 || index === 4 || index === 5) && (
        <mesh
          position={[0, 0.85, -0.7]}
          scale={[1.1, pick(index === 4, 2.2, 1.5), 1.1]}
        >
          <coneGeometry args={[1, 1.6, 7]} />
          <meshStandardMaterial
            color={pick(index === 4, '#e1e5d8', '#79705a')}
            flatShading
          />
        </mesh>
      )}
      {(index === 0 || index === 1) &&
        [-1, 1].map((side) => (
          <group key={side} position={[side * 0.9, 0, -0.65]}>
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.1, 0.18, 1.2, 6]} />
              <meshStandardMaterial color="#79513a" />
            </mesh>
            <mesh position={[0, 1.35, 0]} scale={[0.9, 0.75, 0.9]}>
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color="#315b31" flatShading />
            </mesh>
          </group>
        ))}
      <mesh
        position={[0, 0.11, 0.4]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(event) => {
          event.stopPropagation()
          if (index <= unlocked) {
            onSelect(index)
          }
        }}
      >
        <ringGeometry args={[0.38, 0.62, 24]} />
        <meshStandardMaterial color={ringColor} emissive={emissive} />
      </mesh>
    </group>
  )
}
