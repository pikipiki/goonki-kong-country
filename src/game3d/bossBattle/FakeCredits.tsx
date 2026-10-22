import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, SpriteMaterial } from 'three'
import type { Group } from 'three'
import type { Game } from '../../game/engine'

export function FakeCredits({ game }: { game: Game }) {
  const root = useRef<Group>(null)
  const material = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Canvas 2d context unavailable')
    }
    context.fillStyle = '#121b17e8'
    context.fillRect(0, 0, 512, 128)
    context.fillStyle = '#f4d46c'
    context.font = 'bold 48px Georgia'
    context.textAlign = 'center'
    context.fillText('KREDITS', 256, 64)
    context.font = '20px Georgia'
    context.fillText('THE END…?', 256, 105)
    return new SpriteMaterial({
      map: new CanvasTexture(canvas),
      transparent: true,
      depthTest: false,
    })
  }, [])
  useEffect(
    () => () => {
      material.map?.dispose()
      material.dispose()
    },
    [material],
  )
  useFrame(() => {
    if (root.current) {
      root.current.visible = game.bossBattle?.phase === 'fakeDeath'
    }
  })
  return (
    <group
      ref={root}
      visible={false}
      name="boss-fake-credits"
      position={[11, 4, 1]}
    >
      <sprite material={material} scale={[8, 2, 1]} />
    </group>
  )
}
