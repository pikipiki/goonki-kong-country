import type { Game } from '../game/engine'
import { AnimalBuddy } from './animals/AnimalBuddy'

export function Animals({ game }: { game: Game }) {
  return (
    <>
      {game.animals.map((animal, animalIdx) => (
        <AnimalBuddy key={animalIdx} animal={animal} game={game} />
      ))}
    </>
  )
}
