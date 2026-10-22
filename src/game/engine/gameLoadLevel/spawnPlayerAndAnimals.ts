import { ENGUARDE_SWIM_BODY } from '../../animals'
import { nearestCoralOpenY } from '../../terrainSolids'
import type { Game } from '../gameSession'

export function spawnStartFloor(game: Game): { startX: number; floor: number } {
  const sourceFloor = game.level.start?.y ?? game.level.platforms[0].y

  const startX = game.level.start?.x ?? 3

  let floor
  if (game.level.originalTerrain === 'coral') {
    floor = nearestCoralOpenY(startX, sourceFloor)
  } else {
    floor = sourceFloor
  }

  game.checkpoint = { x: startX, y: floor }
  return { startX, floor }
}

export function spawnPlayer(game: Game, startX: number, floor: number): void {
  game.player = {
    x: startX,
    y: floor,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: game.level.biome !== 'lagoon',
    active: 0,
    hp: 2,
    invincible: 0,
    roll: 0,
    rollJump: false,
    rollJumpMomentum: 0,
    cartRebound: false,
    rollSpeed: 0,
    rollFacing: 1,
    rollChain: 0,
    rollAngle: 0,
    recentRun: 1,
    mount: -1,
    mountAttack: 0,
    mountCharge: 0,
    mountCharged: false,
    mountCooldown: 0,
    carry: -1,
    cannon: -1,
    cannonLock: -1,
    cannonTime: 0,
    launched: 0,
    cannonGravityDelay: 0,
    cannonControlDelay: 0,
    jumpDelay: 0,
    coyote: 0.1,
    buffer: 0,
  }
}

export function spawnAnimalsAndCompanion(
  game: Game,
  startX: number,
  floor: number,
): void {
  game.animals = (game.level.animals ?? []).map((spawn) => ({
    ...spawn,
    state: 'crate',
    vx: 0,
    vy: 0,
    facing: 1,
    timer: 0,
  }))
  game.companion = { x: startX - 1.8, y: floor, facing: 1 }
  game.swap = null
}

export function adjustCoralAnimalHeights(game: Game): void {
  for (const animal of game.animals) {
    animal.y = nearestCoralOpenY(animal.x, animal.y, ENGUARDE_SWIM_BODY.height)
  }
}
