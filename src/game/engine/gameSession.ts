import { type BossBattle, type BossProjectile } from '../bossBattle'
import { type Animal } from '../animals'
import { ROM_JUNGLE } from '../originalJungle'
import { ROM_CORAL } from '../originalCoral'
import { ROM_REVERB } from '../originalReverb'
import { ROM_MINE_CART } from '../originalMineCart'
import { LEVELS, type Platform, type Level } from '../levels'

import { STEP } from './romPhysics'
import { defaultSave } from './save'
import type {
  TeamSwap,
  Phase,
  Input,
  Enemy,
  Particle,
  Thrown,
  EnemyShot,
  Save,
  Player,
} from './types'
import {
  isBonusCompleted,
  leaveBonusRoom,
  openBonusRoom as unlockBonusRoom,
  tryEnterBonusRoom,
} from './gameBonusRoom'
import { loadGameLevel } from './gameLoadLevel'
import {
  breakWallsWithThrown as breakThrownWalls,
  collectAnimalTokens as collectTokens,
  isTokenCollected as tokenCollected,
  maybeSignHint as signHint,
  resolveBreakableWalls as resolveWalls,
  throwableBarrelIndex as findThrowableBarrel,
  updateItemCaches as refreshItemCaches,
} from './gameWorldInteract'
import { groundEnemy as simulateGroundEnemy } from './gameGroundEnemy'
import { releaseMountAnimal, updateMountAnimals } from './gameMountAnimals'
import { applyPlayerDamage } from './gamePlayerDamage'
import { updatePlayingFrame } from './updatePlayingFrame'
import { cannonAimAngle, cannonWorldAt } from './gameSessionCannon'
import { dismountPlayer } from './gameSessionDismount'
import { finishLevel } from './gameSessionFinish'
import {
  floorAtWorld,
  supportAtFeet,
  surfacePlatform,
} from './gameSessionLevelQuery'

export { readSave } from './save'
export { cannonLaunchVelocity } from './cannonLaunch'
export { testApproachFootVelocity } from './math'
export {
  emptyInput,
  enemyViewportBand,
  enemyVisibleToCamera,
  enemySimulationActive,
  enemyRenderVisible,
} from './enemyPresence'
export * from './types'
export { STEP, TEAM_SWAP_DURATION, ROM, romSwimIdleSink } from './romPhysics'

export class Game {
  phase: Phase = 'title'
  levelId = 0
  sceneRevision = 0
  mineRecoveryLayout = 1
  cameraBounds: { x: number; y: number; halfX: number; halfY: number } | null =
    null
  originalRoute = false
  /** Separate playable bonus scene; source-room layouts are still adapted. */
  bonus: {
    index: number
    stage: Level
    sourceIndices: number[]
    world: Pick<
      Game,
      | 'player'
      | 'enemies'
      | 'animals'
      | 'collected'
      | 'letters'
      | 'usedBarrels'
      | 'thrown'
      | 'enemyShots'
      | 'checkpoint'
      | 'companion'
      | 'trail'
    >
  } | null = null
  bonusDoorCooldown = 0
  lives = 5
  bananas = 0
  total = 0
  levelBananas = 0
  letters = new Set<number>()
  collected = new Set<number>()
  collectedTokens = new Set<string>()
  animalTokens: Record<string, number> = {}
  revealedCaches = new Set<number>()
  collectedCaches = new Set<number>()
  brokenWalls = new Set<number>()
  collectedBonus = new Set<string>()
  completedBonus = new Set<number>()
  usedBarrels = new Set<number>()
  cannonTimes: number[] = []
  enemies: Enemy[] = []
  animals: Animal[] = []
  particles: Particle[] = []
  thrown: Thrown[] = []
  enemyShots: EnemyShot[] = []
  bossBattle: BossBattle | null = null
  bossProjectiles: BossProjectile[] = []
  player!: Player
  time = 0
  checkpoint = { x: 3, y: 0 }
  trail: { x: number; y: number; facing: number }[] = []
  companion = { x: 1.3, y: 0, facing: 1 }
  swap: TeamSwap | null = null
  toast = ''
  toastTimer = 0
  save: Save
  onEvent: (name: string) => void = () => {}
  onSave: (save: Save) => void = () => {}
  constructor(save = defaultSave()) {
    this.save = save
    this.load(0, 'title')
  }
  get level(): Level {
    if (this.bonus) {
      return this.bonus.stage
    }

    if (!this.originalRoute) {
      return LEVELS[this.levelId]
    }

    if (this.levelId === 0) {
      return ROM_JUNGLE
    }

    if (this.levelId === 1) {
      return ROM_REVERB
    }

    if (this.levelId === 2) {
      return ROM_MINE_CART
    }

    if (this.levelId === 3) {
      return ROM_CORAL
    }

    return LEVELS[this.levelId]
  }
  get letterWord() {
    return this.level.letterWord ?? 'GOONK'
  }
  get mount(): Animal | undefined {
    const mountIndex = this.player.mount

    if (mountIndex >= 0) {
      return this.animals[mountIndex]
    } else {
      return undefined
    }
  }
  floorAt(worldX: number, worldY: number) {
    return floorAtWorld(this, worldX, worldY)
  }
  supportAt(posX: number, feet: number, rise = 0.3) {
    return supportAtFeet(this, posX, feet, rise)
  }
  groundEnemy(enemy: Enemy, deltaTime: number) {
    simulateGroundEnemy(this, enemy, deltaTime)
  }
  load(levelIndex: number, phase: Phase = 'playing') {
    loadGameLevel(this, levelIndex, phase)
  }
  start(levelIndex = 0, original = false) {
    this.originalRoute = original
    this.lives = 5
    this.bananas = 0
    this.total = 0
    this.animalTokens = {}
    this.load(levelIndex)
  }
  message(text: string, duration = 3) {
    this.toast = text
    this.toastTimer = duration
  }
  throwableBarrelIndex(player: Player) {
    return findThrowableBarrel(this, player)
  }
  pop(posX: number, posY: number, text: string, color = '#ffdd75') {
    this.particles.push({ x: posX, y: posY, text, color, age: 0 })
  }
  isBonusCompleted(index: number) {
    return isBonusCompleted(this, index)
  }
  tryEnterBonus(input: Input, oldX: number) {
    return tryEnterBonusRoom(this, input, oldX)
  }
  leaveBonus() {
    leaveBonusRoom(this)
  }
  openBonusRoom(index: number) {
    unlockBonusRoom(this, index)
  }
  resolveBreakableWalls(player: Player, oldX: number) {
    resolveWalls(this, player, oldX)
  }
  breakWallsWithThrown() {
    breakThrownWalls(this)
  }
  updateItemCaches(player: Player, input: Input) {
    refreshItemCaches(this, player, input)
  }
  isTokenCollected(token: Parameters<typeof tokenCollected>[1]) {
    return tokenCollected(this, token)
  }
  collectAnimalTokens(player: Player) {
    collectTokens(this, player)
  }
  maybeSignHint(player: Player) {
    signHint(this, player)
  }
  pause() {
    if (this.phase === 'playing') {
      this.phase = 'paused'
    } else if (this.phase === 'paused') {
      this.phase = 'playing'
    }
  }
  surface(platform: Platform) {
    return surfacePlatform(this, platform)
  }
  dismount(flee = false) {
    dismountPlayer(this, flee)
  }
  damage(fall = false) {
    applyPlayerDamage(this, fall)
  }
  cannonPosition(index: number, level = this.level) {
    return cannonWorldAt(this, index, level)
  }
  cannonAngle(index: number, level = this.level) {
    return cannonAimAngle(this, index, level)
  }
  releaseAnimal(animal: Animal) {
    releaseMountAnimal(this, animal)
  }
  updateAnimals(input: Input, oldY: number, deltaTime: number) {
    updateMountAnimals(this, input, oldY, deltaTime)
  }
  finish() {
    finishLevel(this)
  }
  update(input: Input, deltaTime = STEP) {
    updatePlayingFrame(this, input, deltaTime)
  }
}
