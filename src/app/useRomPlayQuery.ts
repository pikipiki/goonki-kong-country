import { useEffect } from 'react'
import type { AudioSystem } from '../game/audio'
import type { Game } from '../game/engine'
import { applyRomPlayQuery } from './romPlayQuery'
import { pick } from '../utils/pick'

export function useRomPlayQuery(
  game: Game,
  audio: AudioSystem,
  change: (action: () => void) => void,
  setDemo2D: (value: boolean) => void,
) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mode2d =
      params.get('demo') === '2d' ||
      params.get('mode') === '2d' ||
      params.get('play') === '2d'
    if (mode2d) {
      audio.boot()
      setDemo2D(true)
      change(() => {
        game.start(
          pick(
            params.get('stage') === 'boss' || params.get('stage') === '6',
            6,
            0,
          ),
          true,
        )
        const xParam = params.get('x')
        const yParam = params.get('y')
        if (xParam !== null && xParam !== '') {
          game.player.x = Number(xParam)
        }
        if (yParam !== null && yParam !== '') {
          game.player.y = Number(yParam)
        }
      })
      return
    }
    const play = params.get('play') ?? params.get('level')
    const hasPlay =
      play === 'coral' ||
      play === 'lagoon' ||
      play === '3' ||
      play === 'jungle' ||
      play === '0' ||
      play === 'reverb' ||
      play === 'canyon' ||
      play === 'cave' ||
      play === '1' ||
      play === 'minecart' ||
      play === 'mine-cart' ||
      play === 'cart' ||
      play === '2'
    if (!hasPlay) {
      return
    }
    audio.boot()
    change(() => {
      applyRomPlayQuery(game, params)
    })
  }, [audio, change, game, setDemo2D])
}
