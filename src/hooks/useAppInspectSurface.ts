import { useEffect } from 'react'
import { AudioSystem } from '../game/audio'
import type { Game } from '../game/engine'

export function useAppInspectSurface(game: Game, audio: AudioSystem) {
  useEffect(() => {
    Object.defineProperty(window, 'goonk', { value: game, configurable: true })
    Object.defineProperty(window, 'goonkAudio', {
      value: audio,
      configurable: true,
    })
    return () => {
      Reflect.deleteProperty(window, 'goonk')
      Reflect.deleteProperty(window, 'goonkAudio')
    }
  }, [game, audio])
}
