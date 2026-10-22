import type { Game } from '../game/engine'
import { pick } from '../utils/pick'

function letterFound(game: Game, letter: string, index: number): boolean {
  return [...game.letters].some((pickupIndex) => {
    const pickup = game.level.pickups[pickupIndex]
    if (pickup.letter !== letter) {
      return false
    }
    const letterPickups = game.level.pickups.filter(
      (entry) => entry.kind === 'letter',
    )
    const letterIndex = letterPickups.findIndex(
      (entry) => entry === game.level.pickups[pickupIndex],
    )
    return letterIndex === index
  })
}

export function PlayingHudLetters({ game }: { game: Game }) {
  return (
    <div className="letter-track">
      {game.letterWord.split('').map((letter, index) => (
        <span
          key={index}
          className={pick(letterFound(game, letter, index), 'found', '')}
        >
          {letter}
        </span>
      ))}
    </div>
  )
}
