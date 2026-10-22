import { useMemo } from 'react'
import { worldCone, worldSphere } from './worldSharedGeometries'
import { worldRandom } from './worldPalettes'
function hslColor(hue: number, sat: number, light: number) {
  return `hsl(${String(hue)}, ${String(sat)}%, ${String(light)}%)`
}

export function WorldCoralScatter({ length }: { length: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: Math.ceil(length / 6) + 2 }, (_, itemIdx) => ({
        posX: itemIdx * 6 + worldRandom(itemIdx) * 4,
        posZ: -7 - worldRandom(itemIdx + 11) * 6,
        scale: 0.35 + worldRandom(itemIdx + 23) * 0.9,
        rot: worldRandom(itemIdx + 37) * Math.PI * 2,
        tone: 0.42 + worldRandom(itemIdx + 51) * 0.35,
      })),
    [length],
  )
  return (
    <group>
      {items.map((item, itemIdx) => (
        <group
          key={itemIdx}
          position={[item.posX, -2.8 - item.scale * 0.6, item.posZ]}
        >
          <mesh
            geometry={worldCone}
            rotation={[0.15, item.rot, 0]}
            scale={[item.scale, item.scale * 1.55, item.scale]}
          >
            <meshStandardMaterial
              color={hslColor(
                158 + item.tone * 48,
                48 + item.tone * 20,
                38 + item.tone * 18,
              )}
              roughness={0.72}
              metalness={0.05}
            />
          </mesh>
          <mesh
            geometry={worldSphere}
            position={[item.scale * 0.35, item.scale * 0.2, item.scale * 0.2]}
            scale={[item.scale * 0.35, item.scale * 0.35, item.scale * 0.35]}
          >
            <meshStandardMaterial
              color={hslColor(185 + item.tone * 30, 70, 72 + item.tone * 12)}
              emissive="#4a9aaa"
              emissiveIntensity={0.15}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
