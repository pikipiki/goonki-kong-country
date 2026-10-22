import { OrthographicCamera } from '@react-three/drei'
import {
  ISLAND_MAP_HEMI_GROUND,
  ISLAND_MAP_HEMI_SKY,
  ISLAND_MAP_LAND,
  ISLAND_MAP_SEA,
  ISLAND_MAP_SKY,
  ISLAND_MAP_SUN,
} from './romMapPalette'
import { pick } from '../utils/pick'

export function MapIsland3dEnvironment({
  zoom,
  portrait,
}: {
  zoom: number
  portrait: boolean
}) {
  return (
    <>
      <OrthographicCamera makeDefault position={[0, 26, 13]} zoom={zoom} />
      <color attach="background" args={[ISLAND_MAP_SKY]} />
      <hemisphereLight
        args={[ISLAND_MAP_HEMI_SKY, ISLAND_MAP_HEMI_GROUND, 2.2]}
      />
      <directionalLight
        position={[-8, 15, 9]}
        intensity={3}
        color={ISLAND_MAP_SUN}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
        <circleGeometry args={[35, 48]} />
        <meshStandardMaterial color={ISLAND_MAP_SEA} roughness={0.45} />
      </mesh>
      <mesh
        position={[0, -2.3, pick(portrait, 1, 0)]}
        scale={pick(portrait, [7, 2.5, 12] as const, [13, 2.5, 6] as const)}
      >
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color={ISLAND_MAP_LAND} flatShading />
      </mesh>
    </>
  )
}
