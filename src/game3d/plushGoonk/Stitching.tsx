import { themeColors } from '@game3d/theme'
import { useEffect, useMemo } from 'react'

const plush = themeColors.plush

import { BufferGeometry, Float32BufferAttribute } from 'three'
import { bodyPoint } from '@game3d/plushGoonk/profile'

export function Stitching({ pink }: { pink: boolean }) {
  const geometry = useMemo(() => {
    const points: number[] = []

    for (const angle of [
      Math.PI / 4,
      -Math.PI / 4,
      Math.PI * 0.75,
      -Math.PI * 0.75,
    ]) {
      for (let stitch = 3; stitch < 58; stitch++) {
        const start = bodyPoint(stitch / 64, angle - 0.008, 0.0015)

        const end = bodyPoint((stitch + 0.45) / 64, angle + 0.008, 0.0015)

        points.push(...start.toArray(), ...end.toArray())
      }
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
      <lineBasicMaterial
        color={pink ? plush.stitchPink : plush.stitchPurple}
        transparent
        opacity={0.65}
      />
    </lineSegments>
  )
}
