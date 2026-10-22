import { resolveI18nKey } from '../../i18n/resolveText'
import { type Game } from './gameSession'
import { type Phase } from './types'
import { normalizeStageId } from '../stageCatalog'
import { ENGUARDE_SWIM_BODY } from '../animals'
import { nearestCoralOpenY } from '../terrainSolids'
import { createBossBattle, BOSS_MAX_HITS } from '../bossBattle'
import { ENEMY_DESIGNS } from '../enemies'
import {
  normalizeLandEnemyFeet,
  mineBeePatrolBounds,
  mineEncounterClearance,
} from '../routeSafety'
import { NECKY_SHOOT_PERIOD } from './romPhysics'
import { clamp } from './math'
import { type EnemySpec } from '../levels'
export function loadGameLevel(
  game: Game,
  levelId: number,
  phase: Phase = 'playing',
): void {
  resetLevelSession(game, levelId, phase)
  const { startX, floor } = spawnStartFloor(game)
  spawnLevelPopulation(game, startX, floor)
  game.enemyShots = []
  game.message(resolveI18nKey(game.level.tip), 6)
}

export function resetLevelSession(
  game: Game,
  levelId: number,
  phase: Phase,
): void {
  game.bonus = null
  game.bonusDoorCooldown = 0
  game.bossBattle = null
  game.bossProjectiles = []
  game.sceneRevision++
  game.cameraBounds = null
  game.mineRecoveryLayout = 1
  game.levelId = normalizeStageId(levelId)
  game.phase = phase
  game.time = 0
  game.levelBananas = 0
  game.letters = new Set()
  game.collected = new Set()
  game.collectedTokens = new Set()
  game.revealedCaches = new Set()
  game.collectedCaches = new Set()
  game.brokenWalls = new Set()
  game.collectedBonus = new Set()
  game.completedBonus = new Set()
  game.usedBarrels = new Set()
  game.cannonTimes = []
  game.particles = []
  game.thrown = []
  game.trail = []
}

export function spawnLevelPopulation(
  game: Game,
  startX: number,
  floor: number,
): void {
  spawnPlayer(game, startX, floor)
  spawnAnimalsAndCompanion(game, startX, floor)
  spawnLevelEnemies(game, startX, floor)
}

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

function enemyPatrolSpeed(spec: EnemySpec): number {
  if (spec.patrolSpeed !== undefined) {
    return spec.patrolSpeed
  }

  if (spec.kind === 'croc') {
    return 1.8
  } else {
    return 1.25
  }
}

export function spawnLevelEnemies(
  game: Game,
  startX: number,
  floor: number,
): void {
  const spawnStart = game.level.start

  let encounterSpecs
  if (game.level.originalTerrain === 'mineCart') {
    encounterSpecs = mineEncounterClearance(game.level.enemies)
  } else {
    encounterSpecs = game.level.enemies
  }

  game.enemies = encounterSpecs.map((spec, index) => {
    let spawnX = spec.x

    if (
      game.level.originalTerrain === 'coral' &&
      spawnStart &&
      Math.hypot(spec.x - spawnStart.x, spec.y - spawnStart.y) < 0.85
    ) {
      spawnX = Math.min(spec.max - 0.4, spec.x + 4)
    }

    return {
      ...spec,
      x: spawnX,
      originY: spec.y,
      vx: (index % 2 ? 1 : -1) * enemyPatrolSpeed(spec),
      alive: true,
      hp: spec.kind === 'boss' ? BOSS_MAX_HITS : 1,
      vy: 0,
      timer: 0,
      hurt: 0,
      vulnerable: false,
      shootCooldown: spec.throwsNuts
        ? NECKY_SHOOT_PERIOD * (0.85 + (index % 3) * 0.05)
        : 0,
    }
  })
  const boss = game.enemies.find((enemy) => enemy.kind === 'boss')

  if (boss) {
    game.bossBattle = createBossBattle(boss)
  }

  if (game.level.biome !== 'lagoon') {
    normalizeLandEnemyPositions(game)
  }

  if (game.level.originalTerrain === 'mineCart') {
    applyMineBeePatrols(game)
  }

  if (game.level.originalTerrain === 'coral') {
    adjustCoralEnemyPositions(game, startX, floor)
    adjustCoralAnimalHeights(game)
  }
}

function normalizeLandEnemyPositions(game: Game): void {
  for (const enemy of game.enemies) {
    if (
      enemy.kind === 'bee' ||
      enemy.kind === 'boss' ||
      enemy.pattern === 'necky'
    ) {
      continue
    }

    let enemyFloor
    if (game.level.originalTerrain) {
      enemyFloor = normalizeLandEnemyFeet(
        game.level.originalTerrain,
        enemy.x,
        enemy.y,
        {
          radius: ENEMY_DESIGNS[enemy.kind].width * 0.65,
          height: ENEMY_DESIGNS[enemy.kind].height,
        },
      )
    } else {
      enemyFloor = game.supportAt(enemy.x, enemy.y, 0.5)
    }

    if (enemyFloor !== null) {
      enemy.y = enemyFloor
      enemy.originY = enemyFloor
    }
  }
}

function applyMineBeePatrols(game: Game): void {
  for (const enemy of game.enemies) {
    if (enemy.kind === 'bee' && enemy.pattern !== 'necky') {
      Object.assign(
        enemy,
        mineBeePatrolBounds(enemy, game.level.enemies, game.level.length),
      )
    }
  }
}

function adjustCoralEnemyPositions(
  game: Game,
  startX: number,
  floor: number,
): void {
  for (const enemy of game.enemies) {
    enemy.y = nearestCoralOpenY(
      enemy.x,
      enemy.y,
      ENEMY_DESIGNS[enemy.kind].height,
    )

    if (Math.abs(enemy.x - startX) < 2 && Math.abs(enemy.y - floor) < 1.6) {
      enemy.x = clamp(startX + 4, enemy.min, enemy.max)
      enemy.y = nearestCoralOpenY(
        enemy.x,
        enemy.y,
        ENEMY_DESIGNS[enemy.kind].height,
      )
    }

    enemy.originY = enemy.y
  }
}
