import { useEffect } from 'react'
import type { Game } from '../game/engine'
import { KEYBOARD, type Controls } from '../game/input'
function bindKeyboardHandlers(
  game: Game,
  controls: Controls,
  change: (action: () => void) => void,
  setMapLevel: (id: number) => void,
) {
  const keydown = (event: KeyboardEvent) => {
    if (event.code === 'Escape' || event.code === 'KeyP') {
      event.preventDefault()
      change(() => {
        game.pause()
      })
      return
    }
    if (event.code === 'Enter' && game.phase === 'title') {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('button')
      ) {
        return
      }
      event.preventDefault()
      change(() => {
        game.phase = 'map'
        setMapLevel(game.levelId)
      })
      return
    }
    if (game.phase !== 'playing') {
      return
    }
    if (!Object.hasOwn(KEYBOARD, event.code)) {
      return
    }
    const key = KEYBOARD[event.code]
    event.preventDefault()
    controls.set(`keyboard-${event.code}`, key, true)
  }
  const keyup = (event: KeyboardEvent) => {
    if (!Object.hasOwn(KEYBOARD, event.code)) {
      return
    }
    const key = KEYBOARD[event.code]
    controls.set(`keyboard-${event.code}`, key, false)
  }
  return { keydown, keyup }
}

export function useGameInputBindings(
  game: Game,
  controls: Controls,
  change: (action: () => void) => void,
  tick: () => void,
  setMapLevel: (id: number) => void,
  setContextLost: (lost: boolean) => void,
  setShowControls: (show: boolean) => void,
) {
  useEffect(() => {
    const { keydown, keyup } = bindKeyboardHandlers(
      game,
      controls,
      change,
      setMapLevel,
    )
    const blur = () => {
      controls.reset()
      if (game.phase === 'playing') {
        game.pause()
        tick()
      }
    }
    const lost = () => {
      setContextLost(true)
      blur()
    }
    const resized = () => {
      controls.reset()
      if (window.matchMedia('(pointer: coarse)').matches || innerWidth < 900) {
        setShowControls(true)
      }
    }
    window.addEventListener('resize', resized)
    const visibility = () => {
      if (document.hidden) {
        blur()
      }
    }
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', blur)
    window.addEventListener('goonk-context-lost', lost)
    document.addEventListener('visibilitychange', visibility)
    let frame = 0
    const poll = () => {
      if (game.phase === 'playing') {
        controls.gamepad()
      }
      frame = requestAnimationFrame(poll)
    }
    frame = requestAnimationFrame(poll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resized)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', blur)
      window.removeEventListener('goonk-context-lost', lost)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [
    game,
    controls,
    change,
    tick,
    setMapLevel,
    setContextLost,
    setShowControls,
  ])
}
