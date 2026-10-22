import { useEffect, useMemo } from 'react'
import { textTexture } from './textTexture'

export function Label({
  text,
  color = '#ffecab',
  bg,
  scale = 1,
  position = [0, 0, 0],
}: {
  text: string
  color?: string
  bg?: string
  scale?: number
  position?: [number, number, number]
}) {
  const texture = useMemo(() => textTexture(text, color, bg), [text, color, bg])
  useEffect(
    () => () => {
      texture.dispose()
    },
    [texture],
  )
  return (
    <sprite position={position} scale={[scale * 2, scale, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  )
}
