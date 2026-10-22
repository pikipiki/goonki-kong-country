import { afterEach, expect, it, vi } from 'vitest'
import { updateBossPhaseMotion } from '../src/game/bossBattlePhaseMotion'
import { createBossBattle, type BossPhase } from '../src/game/bossBattle'
import { AudioSystem, resolveAudioEffectId } from '../src/game/audio'
import { hurtFlashVisible } from '../src/game/hurtFlash'
import {
  CANNON_VECTORS,
  Game,
  cannonLaunchVelocity,
  emptyInput,
  enemyRenderVisible,
  enemySimulationActive,
  enemyVisibleToCamera,
  readSave,
} from '../src/game/engine'
import { cannonAimAngle } from '../src/game/engine/gameSessionCannon'
import { finishLevel } from '../src/game/engine/gameSessionFinish'
import {
  isBonusCompleted,
  leaveBonusRoom,
} from '../src/game/engine/gameBonusRoom'
import { dismountPlayer } from '../src/game/engine/gameSessionDismount'
import { floorAtWorld } from '../src/game/engine/gameSessionLevelQuery'
import { tryEnterBonusRoom } from '../src/game/engine/gameBonusRoom'
import * as bonusEnter from '../src/game/engine/bonusRoomEnter'
import { tickPlayerCannonLock } from '../src/game/engine/playingFrame/playerClockTimers'
import { applyRollJumpHorizontal } from '../src/game/engine/playingFrame/playerMotionHorizontal'
import { resolvePlayerEnemyTouch } from '../src/game/engine/playingFrame/enemyPlayerContact'
import { updateBossEnemy } from '../src/game/engine/playingFrame/stepEnemies'
import { updateCompanionTrail } from '../src/game/engine/playingFrame/stepPlayerCompanion'
import {
  cullThrownBarrel,
  simulateEnemyShots,
} from '../src/game/engine/playingFrame/worldInteractThrown'
import { blocksCoralHorizontal } from '../src/game/originalCoralTerrain'
import { ORIGINAL_CORAL_ORIGIN } from '../src/game/originalCoral'
import { isDemo2DStage, isOriginalStage } from '../src/game/stageCatalog'
import { createAudioTestHarness } from './helpers/audioTestHarness'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const playingEnv = (game: Game) => ({
  water: false,
  cart: false,
  swapping: false,
  chargeable: false,
  oldX: game.player.x,
  oldY: game.player.y,
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

it('covers catalog, hurt flash, save null, and idle finish', () => {
  expect(isDemo2DStage(0)).toBe(true)
  expect(isDemo2DStage(2)).toBe(false)
  expect(isOriginalStage(0)).toBe(true)
  expect(isOriginalStage(4)).toBe(false)
  expect(hurtFlashVisible(0)).toBe(true)
  expect(hurtFlashVisible((Math.PI * 3) / 64)).toBe(false)
  expect(readSave(null).unlocked).toBe(0)
  expect(resolveAudioEffectId('roll', { animal: 'winky' })).toBeUndefined()
  const idle = new Game()
  finishLevel(idle)
  expect(idle.phase).toBe('title')
  leaveBonusRoom(idle)
})

it('covers dead enemies, missing bonus rooms, and a zero cannon vector', () => {
  const game = new Game()
  game.start(0, false)
  const enemy = game.enemies[0]
  enemy.alive = false
  expect(enemyVisibleToCamera(game, enemy)).toBe(false)
  expect(enemySimulationActive(game, enemy)).toBe(false)
  enemy.alive = true
  enemy.hurt = 1
  enemy.x = game.player.x
  enemy.y = game.player.y
  expect(enemyRenderVisible(enemy, 0, game)).toBe(true)
  const bonusRooms = game.level.bonusRooms
  try {
    game.level.bonusRooms = undefined
    expect(isBonusCompleted(game, 0)).toBe(false)
  } finally {
    game.level.bonusRooms = bonusRooms
  }
  const savedVectors = CANNON_VECTORS.map((vector) => ({
    velocityXRaw: vector.velocityXRaw,
    velocityYRaw: vector.velocityYRaw,
  }))
  try {
    for (const vector of CANNON_VECTORS) {
      vector.velocityXRaw = 0
      vector.velocityYRaw = 0
    }
    expect(cannonLaunchVelocity(0)).toEqual({ vx: 0, vy: 0 })
  } finally {
    CANNON_VECTORS.forEach((vector, index) => {
      vector.velocityXRaw = savedVectors[index].velocityXRaw
      vector.velocityYRaw = savedVectors[index].velocityYRaw
    })
  }
  expect(cannonAimAngle(game, 999)).toBe(0.75)
})

it('covers coral dismount, boss creation, and thrown culls', () => {
  const coral = new Game()
  coral.start(3, true)
  coral.animals.push({
    kind: 'enguarde',
    x: coral.player.x,
    y: coral.player.y,
    state: 'ridden',
    vx: 0,
    vy: 0,
    facing: 1,
    timer: 0,
  })
  coral.player.mount = coral.animals.length - 1
  dismountPlayer(coral)
  expect(coral.player.mount).toBe(-1)
  blocksCoralHorizontal(8, 2, 1, ORIGINAL_CORAL_ORIGIN, { swim: true })
  const bossGame = new Game()
  bossGame.start(6)
  const boss = bossGame.enemies[0]
  bossGame.bossBattle = null
  updateBossEnemy(bossGame, boss, 0.016)
  expect(bossGame.bossBattle).not.toBeNull()
  const battle = createBossBattle(boss)
  battle.phase = 'glide' as BossPhase
  updateBossPhaseMotion(battle, boss, [], 0.016, () => undefined)
  bossGame.animals = [
    {
      kind: 'rambi',
      x: bossGame.player.x,
      y: bossGame.player.y,
      state: 'ridden',
      vx: 0,
      vy: 0,
      facing: 1,
      timer: 0,
    },
  ]
  bossGame.player.mount = 0
  bossGame.player.facing = 1
  boss.x = bossGame.player.x + 0.4
  resolvePlayerEnemyTouch(bossGame, boss, playingEnv(bossGame), true, 1, false)
  cullThrownBarrel(
    bossGame,
    { x: 0, y: -10, vx: 0, vy: 0, active: true },
    bossGame.player.x,
  )
  cullThrownBarrel(
    bossGame,
    { x: bossGame.player.x + 40, y: 1, vx: 0, vy: 0, active: true },
    bossGame.player.x,
  )
})

it('covers platform floors, cannon lock, roll jump, and inactive shots', () => {
  const game = new Game()
  game.start(4, false)
  const platforms = game.level.platforms
  try {
    game.level.platforms = [
      { x: 0, y: 5, w: 2, h: 1 },
      { x: 0, y: 1, w: 2, h: 1 },
      { x: 30, y: 1, w: 2, h: 1 },
    ]
    expect(floorAtWorld(game, 0, -100)).toBeNull()
    expect(floorAtWorld(game, 0, 20)).toBe(5)
  } finally {
    game.level.platforms = platforms
  }
  game.player.cannonLock = 99
  tickPlayerCannonLock(game)
  expect(game.player.cannonLock).toBe(-1)
  game.player.rollJumpMomentum = 0.2
  applyRollJumpHorizontal(game.player, -1, 40, 1)
  expect(game.player.rollJumpMomentum).toBe(0)
  game.enemyShots = [{ x: 1, y: 1, vx: 1, vy: 1, active: false }]
  simulateEnemyShots(game, game.player, 0.016)
  const walls = game.level.breakableWalls
  try {
    game.level.breakableWalls = [{ x: 1, y: 1, w: 1, h: 1 }]
    game.thrown = [{ x: 1, y: 1, vx: 0, vy: 0, active: false }]
    game.breakWallsWithThrown()
  } finally {
    game.level.breakableWalls = walls
  }
  game.trail = Array.from({ length: 23 }, () => ({
    x: 0,
    y: 0,
    facing: 1 as const,
  }))
  game.trail.shift = () => undefined
  updateCompanionTrail(game, false)
  expect(game.companion.x).toBeTypeOf('number')
})

it('covers a bonus index whose room disappeared', () => {
  const game = new Game()
  game.start(0, false)
  game.bonus = null
  game.bonusDoorCooldown = 0
  const bonusRooms = game.level.bonusRooms
  try {
    game.level.bonusRooms = []
    vi.spyOn(bonusEnter, 'findEnterableBonusIndex').mockReturnValue(0)
    expect(tryEnterBonusRoom(game, emptyInput(), game.player.x)).toBe(false)
  } finally {
    game.level.bonusRooms = bonusRooms
  }
})

it('covers manifest rejection and a missing effect buffer', async () => {
  const { audio, fetcher } = createAudioTestHarness()
  vi.stubGlobal(
    'AudioContext',
    vi.fn(function audioContextStub() {
      return {
        state: 'running',
        destination: {},
        resume: () => Promise.resolve(),
        createGain: () => ({
          connect: () => undefined,
          gain: { value: 0.6, setTargetAtTime: () => undefined },
        }),
      }
    }),
  )
  fetcher.mockImplementation(() => Promise.reject(new Error('offline')))
  audio.boot()
  await flush()
  const missing = new AudioSystem()
  await expect(
    (
      missing as unknown as {
        loadEffectBuffer(
          effectId: number,
          entry: { id: number; url: string; seconds: number },
        ): Promise<unknown>
      }
    ).loadEffectBuffer(4, { id: 4, url: '/missing.m4a', seconds: 1 }),
  ).rejects.toThrow('Audio context unavailable')
  const ready = new AudioSystem()
  fetcher.mockImplementation(() =>
    Promise.resolve({
      ok: false,
      status: 404,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      json: () => Promise.resolve({}),
    }),
  )
  ready.boot()
  const silent = new AudioSystem()
  silent.toggle()
  await expect(
    (
      ready as unknown as {
        loadEffectBuffer(
          effectId: number,
          entry: { id: number; url: string; seconds: number },
        ): Promise<unknown>
      }
    ).loadEffectBuffer(8, { id: 8, url: '/gone.m4a', seconds: 1 }),
  ).rejects.toThrow('Missing effect')
})
