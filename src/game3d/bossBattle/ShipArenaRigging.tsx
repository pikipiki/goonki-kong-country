import { BossPart } from './BossPart'
import { bossRing } from './bossGeometries'
import { bossMaterial } from './bossMaterials'
const MAST_COLUMNS = [0, 1, 2, 3, 4, 5]
const RIG_YARDS = [2, 3, 4, 5, 6, 7, 8]
const RIG_MAST_X = [-0.2, 19.5]
function ShipMastCluster({ anchorX }: { anchorX: number }) {
  return (
    <group position={[anchorX, 0, -2.8]}>
      {MAST_COLUMNS.map((columnIdx) => (
        <group key={columnIdx} position={[columnIdx * 0.55, 0, 0]}>
          <BossPart
            pos={[0, 5, 0]}
            size={[0.045, 8.6, 0.045]}
            color="#55432b"
            shape="box"
            rotation={[0, 0, (columnIdx - 2.5) * 0.007]}
          />
          <mesh
            geometry={bossRing}
            position={[0, 0.95, 0]}
            scale={[0.13, 0.26, 0.13]}
            material={bossMaterial('#715635')}
          />
        </group>
      ))}
      {RIG_YARDS.map((yardY) => (
        <BossPart
          key={yardY}
          pos={[1.37, yardY, 0]}
          size={[2.8, 0.045, 0.045]}
          color="#55432b"
          shape="box"
          rotation={[0, 0, 0.03]}
        />
      ))}
    </group>
  )
}

export function ShipArenaRigging() {
  return (
    <>
      {RIG_MAST_X.map((anchorX) => (
        <ShipMastCluster key={anchorX} anchorX={anchorX} />
      ))}
    </>
  )
}
