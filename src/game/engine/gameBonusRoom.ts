import { tr } from '../../i18n'
import { resolveI18nKey } from '../../i18n/resolveText'
import type { Game } from './gameSession'
import type { Input } from './types'
import {
  buildBonusStage,
  findEnterableBonusIndex,
  isBonusCompleted,
  resetPlayerForBonus,
  snapshotBonusWorld,
} from './bonusRoomEnter'

export { isBonusCompleted }

export function openBonusRoom(game: Game, wallIndex: number) {
  const room = game.level.bonusRooms?.find(
    (bonusRoom) => bonusRoom.wallIndex === wallIndex,
  )

  if (room) {
    game.message(
      tr('game.bonusOpened', { label: resolveI18nKey(room.label) }),
      4,
    )
  }
}

export function tryEnterBonusRoom(game: Game, input: Input, oldX: number) {
  if (game.bonus || game.bonusDoorCooldown > 0) {
    return false
  }

  const index = findEnterableBonusIndex(game, input, oldX)

  if (index < 0) {
    return false
  }

  const source = game.level

  const room = source.bonusRooms?.[index]

  if (!room) {
    return false
  }

  const sourceIndices = room.pickups
    .map((_, pickupIndex) => pickupIndex)
    .filter(
      (pickupIndex) =>
        !game.collectedBonus.has(`${String(index)}-${String(pickupIndex)}`),
    )

  const world = snapshotBonusWorld(game, game.player, oldX)

  const stage = buildBonusStage(source, room, index, sourceIndices)

  game.bonus = { index, stage, sourceIndices, world }
  game.player = resetPlayerForBonus(game.player)
  game.enemies = []
  game.animals = []
  game.collected = new Set()
  game.letters = new Set()
  game.usedBarrels = new Set()
  game.thrown = []
  game.enemyShots = []
  game.checkpoint = { x: 2, y: 0 }
  game.companion = { x: 0.75, y: 0, facing: 1 }
  game.trail = []
  game.swap = null
  game.sceneRevision++
  game.cameraBounds = null
  game.message(resolveI18nKey(stage.tip), 5)
  game.onEvent('enter-cannon')
  input.pressed.clear()
  input.released.clear()
  return true
}

export function leaveBonusRoom(game: Game) {
  const visit = game.bonus

  if (!visit) {
    return
  }

  for (const pickup of game.collected) {
    game.collectedBonus.add(
      `${String(visit.index)}-${String(visit.sourceIndices[pickup])}`,
    )
  }

  const hitPoints = game.player.hp

  const activeBuddy = game.player.active

  Object.assign(game, visit.world)
  game.bonus = null
  let completedSet
  if (game.completedBonus instanceof Set) {
    completedSet = game.completedBonus
  } else {
    completedSet = new Set<number>()
  }

  completedSet.add(visit.index)
  game.completedBonus = completedSet
  Object.assign(game.player, {
    hp: hitPoints,
    active: activeBuddy,
    vx: 0,
    vy: 0,
    roll: 0,
    rollJump: false,
    rollJumpMomentum: 0,
    cartRebound: false,
    mountAttack: 0,
    mountCharge: 0,
    mountCharged: false,
    invincible: 1.2,
  })
  game.bonusDoorCooldown = 1
  game.sceneRevision++
  game.cameraBounds = null
  game.swap = null
  game.message(tr('game.returnToLevel'), 3)
}
