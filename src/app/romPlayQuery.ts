import type { Game } from '../game/engine'

export function applyRomPlayQuery(
  game: Game,
  params: URLSearchParams,
): boolean {
  const play = params.get('play') ?? params.get('level')
  const coral = play === 'coral' || play === 'lagoon' || play === '3'
  const jungle = play === 'jungle' || play === '0'
  const reverb =
    play === 'reverb' || play === 'canyon' || play === 'cave' || play === '1'
  const minecart =
    play === 'minecart' ||
    play === 'mine-cart' ||
    play === 'cart' ||
    play === '2'
  if (!coral && !jungle && !reverb && !minecart) {
    return false
  }
  if (reverb) {
    game.start(1, true)
    return true
  }
  if (minecart) {
    game.start(2, true)
    return true
  }
  if (jungle) {
    game.start(0, true)
    return true
  }
  game.start(3, true)
  const depth = params.get('depth') ?? 'mid'
  if (depth === 'start') {
    return true
  }
  game.player.x = Number(params.get('x') ?? 20)
  const yParam = params.get('y')
  if (yParam !== null && yParam !== '') {
    game.player.y = Number(yParam)
  } else if (depth === 'deep') {
    game.player.y = 1.1
  } else if (depth === 'shallow') {
    game.player.y = 4.8
  } else {
    game.player.y = 3.2
  }
  game.player.vx = 0
  game.player.vy = 0
  game.player.grounded = false
  game.checkpoint = { x: game.player.x, y: game.player.y }
  return true
}
