import { createBossBattle, BOSS_MAX_HITS } from '../../bossBattle'
import { ENEMY_DESIGNS } from '../../enemies'
import { pick } from '../../../utils/pick'
import {
  normalizeLandEnemyFeet,
  mineBeePatrolBounds,
  mineEncounterClearance,
} from '../../routeSafety'
import { nearestCoralOpenY } from '../../terrainSolids'
import { NECKY_SHOOT_PERIOD } from '../romPhysics'
import { clamp } from '../math'
import type { EnemySpec } from '../../levels'
import type { Game } from '../gameSession'
import { adjustCoralAnimalHeights } from './spawnPlayerAndAnimals'

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
      vx: pick(index % 2, 1, -1) * enemyPatrolSpeed(spec),
      alive: true,
      hp: pick(spec.kind === 'boss', BOSS_MAX_HITS, 1),
      vy: 0,
      timer: 0,
      hurt: 0,
      vulnerable: false,
      shootCooldown: pick(
        spec.throwsNuts,
        NECKY_SHOOT_PERIOD * (0.85 + (index % 3) * 0.05),
        0,
      ),
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
