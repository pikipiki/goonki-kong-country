import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Group, OrthographicCamera } from 'three'
import { Goonk } from './game3d/Goonk'
import { Animals } from './game3d/Animals'
import { Actors } from './game3d/Actors'
import { World } from './game3d/World'
import { STEP, type Game, type Input } from './game/engine'
import {
  simulation,
  camera3D,
  render as renderSettings,
} from './config/presentation.json'
import { tr } from './i18n'
import { applyDirectorCamera } from './scene/directorCamera'

function Director({
  game,
  input,
  onTick,
}: {
  game: Game
  input: Input
  onTick: () => void
}) {
  const accumulator = useRef(0)
  const nextUI = useRef(0)
  const lastLevel = useRef(game.levelId)
  const focus = useRef(6)
  const engineRef = useRef(game)
  const { size } = useThree()

  useEffect(() => {
    engineRef.current = game
  }, [game])

  useFrame(({ camera }, delta) => {
    const engine = engineRef.current
    accumulator.current += Math.min(delta, simulation.maxFrameDeltaSeconds)
    while (accumulator.current >= STEP) {
      engine.update(input)
      accumulator.current -= STEP
    }
    applyDirectorCamera({
      engine,
      camera: camera as OrthographicCamera,
      size,
      delta,
      focus,
      lastLevel,
    })
    nextUI.current += delta
    if (nextUI.current > simulation.hudRefreshSeconds) {
      nextUI.current = 0
      onTick()
    }
  })
  return null
}

function Cast({ game }: { game: Game }) {
  const group = useRef<Group>(null)
  useFrame(() => {
    if (group.current) {
      group.current.visible = game.phase !== 'title'
    }
  })
  return (
    <group ref={group}>
      <Goonk pink={game.player.active === 0} game={game} />
      <Goonk pink={game.player.active !== 0} game={game} companion />
    </group>
  )
}

function TitleCast({ game }: { game: Game }) {
  const root = useRef<Group>(null)
  const { size } = useThree()
  useFrame(() => {
    if (!root.current) {
      return
    }
    root.current.visible = game.phase === 'title'
    const portrait = size.width / size.height < camera3D.portraitAspect
    if (portrait) {
      root.current.children[0].position.x = 9.15
    } else {
      root.current.children[0].position.x = 11
    }
    if (portrait) {
      root.current.children[1].position.x = 11.85
    } else {
      root.current.children[1].position.x = 14.5
    }
    root.current.children[0].scale.setScalar(portrait ? 1.6 : 1.85)
    root.current.children[1].scale.setScalar(portrait ? 1.48 : 1.65)
  })
  return (
    <group ref={root}>
      <group position={[11, 0.05, 1]} scale={1.85}>
        <Goonk pink preview />
      </group>
      <group position={[14.5, 0.05, 0]} scale={1.65}>
        <Goonk pink={false} preview />
      </group>
    </group>
  )
}

function ContextNotice() {
  const { gl } = useThree()
  const [lost, setLost] = useState(false)
  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault()
      setLost(true)
    }
    gl.domElement.addEventListener('webglcontextlost', handler)
    return () => {
      gl.domElement.removeEventListener('webglcontextlost', handler)
    }
  }, [gl])
  useEffect(() => {
    if (lost) {
      window.dispatchEvent(new Event('goonk-context-lost'))
    }
  }, [lost])
  return null
}

function RenderBudget({ game }: { game: Game }) {
  const { gl, setDpr } = useThree()
  const samples = useRef({ count: 0, seconds: 0, window: 0 })
  useFrame((_, delta) => {
    const frame = samples.current
    frame.count++
    frame.seconds += Math.min(delta, renderSettings.maxSampleDeltaSeconds)
    frame.window += delta
    if (frame.window > renderSettings.sampleWindowSeconds) {
      const fps = frame.count / frame.seconds
      if (fps < renderSettings.minimumFps && gl.getPixelRatio() > 1) {
        setDpr(renderSettings.fallbackDevicePixelRatio)
      }
      Object.defineProperty(window, 'goonkDiagnostics', {
        configurable: true,
        value: {
          stageId: game.levelId,
          sceneRevision: game.sceneRevision,
          fps: Math.round(fps),
          drawCalls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          dpr: gl.getPixelRatio(),
        },
      })
      frame.count = 0
      frame.seconds = 0
      frame.window = 0
    }
  })
  return null
}

export function Scene({
  game,
  input,
  onTick,
}: {
  game: Game
  input: Input
  onTick: () => void
}) {
  let sceneFrameloop: 'always' | 'demand'
  if (game.phase === 'playing' || game.phase === 'title') {
    sceneFrameloop = 'always'
  } else {
    sceneFrameloop = 'demand'
  }

  return (
    <Canvas
      onCreated={({ scene }) => {
        Object.defineProperty(window, 'goonkScene', {
          configurable: true,
          value: scene,
        })
      }}
      orthographic
      frameloop={sceneFrameloop}
      camera={{ position: [8, 5, 22], zoom: 60, near: 0.1, far: 100 }}
      dpr={[
        renderSettings.fallbackDevicePixelRatio,
        renderSettings.maxDevicePixelRatio,
      ]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      fallback={<div className="webgl-fallback">{tr('webglFallback')}</div>}
    >
      <Director game={game} input={input} onTick={onTick} />
      <ContextNotice />
      <RenderBudget game={game} />
      <World
        key={`world-${String(game.sceneRevision)}`}
        game={game}
        level={game.level}
      />
      {game.phase !== 'title' && (
        <group key={`actors-${String(game.sceneRevision)}`}>
          <Actors game={game} />
          <Animals game={game} />
        </group>
      )}
      <Cast game={game} />
      <TitleCast game={game} />
    </Canvas>
  )
}
