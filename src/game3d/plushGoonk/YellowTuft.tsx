import { themeColors } from '@game3d/theme'
import { useEffect, useMemo } from 'react'
import { BufferGeometry, Float32BufferAttribute } from 'three'
const plush = themeColors.plush
export function YellowTuft() {
  const geometry = useMemo(() => {
    const points: number[] = []
    for (let tuft = 0; tuft < 85; tuft++) {
      const angle = tuft * 2.39996,
        posX = Math.sin(angle) * 0.033,
        posZ = Math.cos(angle) * 0.025
      const height = 0.065 + (Math.sin(tuft * 71) + 1) * 0.035
      points.push(
        posX,
        0.755,
        posZ,
        posX * 1.4,
        0.755 + height * 0.55,
        posZ - 0.008,
        posX * 1.4,
        0.755 + height * 0.55,
        posZ - 0.008,
        posX * 1.8 + 0.015,
        0.755 + height,
        posZ - 0.023,
      )
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
    return geometry
  }, [])
  useEffect(
    () => () => {
      geometry.dispose()
    },
    [geometry],
  )
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={plush.tuftYellow} />
    </lineSegments>
  )
}
