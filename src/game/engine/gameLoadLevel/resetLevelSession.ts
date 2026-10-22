import { LEVELS } from '../../levels'
import { clamp } from '../math'
import type { Game } from '../gameSession'
import type { Phase } from '../types'

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
  game.levelId = clamp(levelId, 0, LEVELS.length - 1)
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
