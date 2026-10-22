import type { Level } from '../levels'
import type { Game } from './gameSession'
import type { Input, Player } from './types'

export function isBonusCompleted(game: Game, index: number) {
  const completed = (
    game as {
      completedBonus?: Set<number>
    }
  ).completedBonus
  const rooms = game.level.bonusRooms
  if (completed?.has(index)) {
    return true
  }
  const room = rooms?.[index]
  if (!room) {
    return false
  }
  return room.pickups.some((_, pickupIndex) =>
    game.collectedBonus.has(`${String(index)}-${String(pickupIndex)}`),
  )
}

export function findEnterableBonusIndex(
  game: Game,
  input: Input,
  oldX: number,
): number {
  const player = game.player
  const rooms = game.level.bonusRooms
  if (!rooms) {
    return -1
  }
  return rooms.findIndex((room, roomIndex) => {
    if (isBonusCompleted(game, roomIndex)) {
      return false
    }
    const wall = game.level.breakableWalls?.[room.wallIndex]
    if (!wall || !game.brokenWalls.has(room.wallIndex)) {
      return false
    }
    const toward = Math.sign(wall.x - oldX)
    const walking =
      Math.abs(player.x - oldX) > 0.001 && Math.sign(player.x - oldX) === toward
    return (
      Math.abs(player.x - wall.x) < wall.w / 2 + 0.7 &&
      player.y + 1.35 > wall.y &&
      player.y < wall.y + wall.h &&
      (walking || input.pressed.has('up') || input.pressed.has('action'))
    )
  })
}

export function buildBonusStage(
  source: Level,
  room: NonNullable<Level['bonusRooms']>[number],
  roomIndex: number,
  sourceIndices: number[],
): Level {
  return {
    id: source.id,
    name: room.label,
    subtitle: 'game.bonusSubtitle',
    biome: 'jungle',
    length: 17,
    platforms: [
      { x: 8.5, y: 0, w: 19, h: 4.4 },
      { x: 0, y: 10, w: 1.5, h: 10, kind: 'stone' },
    ],
    enemies: [],
    barrels: [],
    pickups: sourceIndices.map((pickupIndex) => ({
      ...room.pickups[pickupIndex],
      x: 5 + pickupIndex * 2.5,
      y: 1.05,
    })),
    decors: [{ x: 13, y: 1.5, kind: 'sign', text: 'game.bonusSign' }],
    tip: 'game.bonusTip',
  }
}

export function snapshotBonusWorld(game: Game, player: Player, oldX: number) {
  return {
    player: { ...player, x: oldX },
    enemies: game.enemies,
    animals: game.animals,
    collected: game.collected,
    letters: game.letters,
    usedBarrels: game.usedBarrels,
    thrown: game.thrown,
    enemyShots: game.enemyShots,
    checkpoint: game.checkpoint,
    companion: game.companion,
    trail: game.trail,
  }
}

export function resetPlayerForBonus(player: Player) {
  return {
    ...player,
    x: 2,
    y: 0,
    vx: 0,
    vy: 0,
    grounded: true,
    carry: -1,
    cannon: -1,
    mount: -1,
    roll: 0,
    rollJump: false,
    rollJumpMomentum: 0,
    cartRebound: false,
    mountAttack: 0,
    mountCharge: 0,
    mountCharged: false,
    invincible: 1,
  }
}
