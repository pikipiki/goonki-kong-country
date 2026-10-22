import { tr } from '../../i18n'
import { nearestCoralOpenY } from '../terrainSolids'
import type { Game } from './gameSession'

export function applyPlayerDamage(game: Game, fall = false) {
  const player = game.player

  if (!fall && player.invincible > 0) {
    return
  }

  if (fall && game.bonus) {
    game.leaveBonus()
    return
  }

  if (game.player.mount >= 0) {
    game.dismount(true)

    if (!fall) {
      game.onEvent('hurt')
      return
    }
  }

  game.onEvent('hurt')
  player.rollJumpMomentum = 0

  if (!fall && player.hp === 2) {
    player.hp = 1
    player.active = 1 - player.active
    player.invincible = 2.3
    player.vy = 6
    player.vx = -player.facing * 3
    player.roll = 0
    player.carry = -1
    game.pop(player.x, player.y + 2, tr('game.holdOn'), '#f6a4c9')
    return
  }

  game.lives--

  if (game.lives <= 0) {
    game.phase = 'gameover'
    return
  }

  Object.assign(player, {
    x: game.checkpoint.x,
    y:
      game.level.originalTerrain === 'coral'
        ? nearestCoralOpenY(game.checkpoint.x, game.checkpoint.y)
        : game.checkpoint.y,
    grounded: game.level.biome !== 'lagoon',
    buffer: 0,
    coyote: 0,
    vx: 0,
    vy: 0,
    hp: 1,
    invincible: 2.5,
    carry: -1,
    cannon: -1,
    cannonLock: -1,
    cannonTime: 0,
    launched: 0,
    cannonGravityDelay: 0,
    cannonControlDelay: 0,
    jumpDelay: 0,
    roll: 0,
    rollJump: false,
    rollJumpMomentum: 0,
    cartRebound: false,
    rollChain: 0,
    mount: -1,
    mountAttack: 0,
    mountCharge: 0,
    mountCharged: false,
    mountCooldown: 0.55,
  })
  game.trail = []
  game.companion = { ...game.checkpoint, facing: 1 }
  game.level.barrels.forEach((barrel, index) => {
    if (barrel.kind === 'rescue') {
      game.usedBarrels.delete(index)
    }
  })
  game.message(tr('game.extraChance'))
}
