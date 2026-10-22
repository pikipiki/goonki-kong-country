import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { Canvas } from '@react-three/fiber'
import { useTranslation } from 'react-i18next'
import { tr } from '../i18n'
import { MapIsland3d } from './MapIsland3d'
import { MapLabels } from './MapLabels'
import { RomMap2d } from './RomMap2d'
import { mapKeyboardDirection } from './mapKeyboard'
import type { MapProps } from './types'

function handleMapKeyDown(event: KeyboardEvent, props: MapProps) {
  const direction = mapKeyboardDirection(event.key)
  if (direction) {
    event.preventDefault()
    props.onSelect(
      (props.selected + direction + props.stages.length) % props.stages.length,
    )
    return
  }
  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    props.onSelect(event.key === 'Home' ? 0 : props.stages.length - 1)
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    props.onConfirm()
  }
}

export function IslandMapView(props: MapProps) {
  useTranslation()
  const root = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([])
  const onProject = useCallback((points: { x: number; y: number }[]) => {
    setPositions(points)
  }, [])

  useEffect(() => {
    root.current?.focus({ preventScroll: true })
  }, [])

  let modeClass
  if (props.mode2D) {
    modeClass = 'island-map-2d'
  } else {
    modeClass = 'island-map-3d'
  }

  return (
    <div
      ref={root}
      className={`island-map ${modeClass}`}
      role="group"
      tabIndex={0}
      aria-label={tr('islandMapAria')}
      aria-describedby="map-instructions"
      onKeyDown={(event) => {
        handleMapKeyDown(event, props)
      }}
    >
      {props.mode2D ? (
        <RomMap2d {...props} onProject={onProject} />
      ) : (
        <Canvas
          orthographic
          dpr={[1, 1.25]}
          camera={{ position: [0, 26, 13], zoom: 21, near: 0.1, far: 100 }}
          onCreated={({ camera }) => {
            camera.lookAt(0, 0, 0)
            camera.updateProjectionMatrix()
          }}
        >
          <MapIsland3d {...props} onProject={onProject} />
        </Canvas>
      )}
      <MapLabels
        positions={positions}
        selected={props.selected}
        unlocked={props.unlocked}
        stages={props.stages}
        onSelect={props.onSelect}
      />
    </div>
  )
}
