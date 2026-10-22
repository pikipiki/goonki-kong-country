import { ANIMAL_DESIGNS } from '../animals'
import { nearestCoralOpenY } from '../terrainSolids'
import { tr } from '../../i18n'
import type { Game } from './gameSession'

export function dismountPlayer(game: Game, flee = false) {
  const player = game.player

  let buddy
  if (player.mount >= 0) {
    buddy = game.animals[player.mount]
  } else {
    buddy = undefined
  }

  if (!buddy) {
    return
  }

  if (flee) {
    buddy.state = 'fleeing'
  } else {
    buddy.state = 'idle'
  }
  buddy.x = player.x
  buddy.y = player.y
  buddy.facing = player.facing
  if (flee) {
    buddy.vx = player.facing * 6
  } else {
    buddy.vx = 0
  }
  if (flee) {
    buddy.vy = 4
  } else {
    buddy.vy = 0
  }
  buddy.timer = 0
  player.y += ANIMAL_DESIGNS[buddy.kind].seat

  if (game.level.originalTerrain === 'coral') {
    player.y = nearestCoralOpenY(player.x, player.y)
  }

  if (game.level.biome === 'lagoon') {
    player.vy = 0
  } else {
    player.vy = 9
  }
  player.grounded = false
  player.coyote = 0
  player.buffer = 0
  player.mount = -1
  player.mountAttack = 0
  player.mountCharge = 0
  player.mountCharged = false
  player.mountCooldown = 0.55

  if (flee) {
    player.invincible = 1.4
  }

  game.onEvent('jump')

  if (flee) {
    game.message(tr('game.catchBuddyFlee'))
  } else {
    game.message(tr('game.catchBuddyMount'))
  }
}
