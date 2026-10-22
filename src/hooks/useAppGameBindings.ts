import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AudioSystem } from '../game/audio'
import type { Game } from '../game/engine'
import { SAVE_STORAGE_KEY } from '@lib/gameSession'

export function useAppGameBindings(game: Game, audio: AudioSystem) {
  const { t } = useTranslation()
  const engineRef = useRef(game)
  const audioRef = useRef(audio)
  useEffect(() => {
    engineRef.current = game
    audioRef.current = audio
  }, [game, audio])
  useEffect(() => {
    const engine = engineRef.current
    const sound = audioRef.current
    engine.onEvent = (name) => {
      sound.effect(name, {
        character: engine.player.active,
        animal: engine.mount?.kind,
        letterIndex: engine.letters.size - 1,
        inWater: engine.level.biome === 'lagoon',
      })
    }
    sound.onError = (message) => {
      engine.message(message)
    }
    engine.onSave = (save) => {
      try {
        localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save))
      } catch {
        engine.message(t('saveUnavailable'))
      }
    }
    return () => {
      engine.onEvent = () => {}
      engine.onSave = () => {}
      sound.onError = () => {}
    }
  }, [game, audio, t])
}
