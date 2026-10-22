import { useEffect } from 'react'
import { AudioSystem } from '../game/audio'

export function useAppWakeAudio(audio: AudioSystem) {
  useEffect(() => {
    const wake = () => {
      audio.wake()
    }
    window.addEventListener('pointerdown', wake, true)
    window.addEventListener('keydown', wake, true)
    return () => {
      window.removeEventListener('pointerdown', wake, true)
      window.removeEventListener('keydown', wake, true)
    }
  }, [audio])
}
