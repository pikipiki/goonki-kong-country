import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BOSS_MAX_HITS,
  createBossBattle,
  updateBossBattle,
  type BossActor,
} from '../src/game/bossBattle'
import { resolveAudioEffectId } from '../src/game/audio'
import { Game, ROM, emptyInput } from '../src/game/engine'
import { advanceGame } from './helpers/simulation'
import { assertDefined } from './helpers/assertDefined'
import { createAudioTestHarness } from './helpers/audioTestHarness'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('refactor coverage — winky and pickups', () => {
  it('covers mount action on winky and jump delay', () => {
    const winkyAct = new Game()
    winkyAct.start(0)
    winkyAct.enemies = []
    winkyAct.animals[0] = {
      ...winkyAct.animals[0],
      kind: 'winky',
      state: 'ridden',
    }
    Object.assign(winkyAct.player, { mount: 0, grounded: true })
    const act = emptyInput()
    act.pressed.add('action')
    advanceGame(winkyAct, act)

    const delayed = new Game()
    delayed.start(0)
    delayed.enemies = []
    delayed.player.jumpDelay = 1
    delayed.player.coyote = 0.2
    delayed.player.rollJump = true
    delayed.player.grounded = true
    advanceGame(delayed, emptyInput(), 2)
    expect(delayed.player.jumpDelay).toBeLessThan(1)
  })

  it('covers banana bunch, letters, thrown hit, and boss dead', () => {
    const bunch = new Game()
    bunch.start(0, true)
    bunch.enemies = []
    const banana = bunch.level.pickups.find(
      (pickup2) => pickup2.kind === 'banana' && (pickup2.amount ?? 1) > 1,
    )
    if (banana) {
      const idx = bunch.level.pickups.indexOf(banana)
      Object.assign(bunch.player, {
        x: banana.x,
        y: banana.y - 1,
        grounded: true,
      })
      bunch.bananas = ROM.bananas - 2
      advanceGame(bunch)
      expect(bunch.collected.has(idx)).toBe(true)
    }

    const thrownHit = new Game()
    thrownHit.start(0, true)
    const foe = thrownHit.enemies.find(
      (entry3) => entry3.alive && entry3.kind === 'beetle',
    )
    if (foe) {
      thrownHit.thrown.push({
        x: foe.x,
        y: foe.y + 0.5,
        vx: 0,
        vy: 0,
        active: true,
      })
      advanceGame(thrownHit)
      expect(foe.alive).toBe(false)
    }

    const bossDead: BossActor = {
      x: 8,
      y: 2,
      vx: 0,
      vy: 0,
      min: 4,
      max: 18,
      hp: BOSS_MAX_HITS,
      vulnerable: false,
    }
    const battle = createBossBattle(bossDead)
    battle.phase = 'dead'
    updateBossBattle(battle, bossDead, [], 0.02)
    expect(bossDead.y).toBe(0)
  })
})

describe('refactor coverage — mine and shots', () => {
  it('covers mine actor relocation and ground enemy landing', () => {
    const mine = new Game()
    mine.start(2, true)
    mine.mineRecoveryLayout = 0
    const bee = mine.enemies.find(
      (entry4) => entry4.kind === 'bee' && entry4.pattern !== 'necky',
    )
    if (bee) {
      bee.hoverAmplitude = 1
    }
    advanceGame(mine)

    const ground = new Game()
    ground.start(0, true)
    const beetle = ground.enemies.find(
      (entry5) => entry5.kind === 'beetle' && entry5.alive,
    )
    if (beetle) {
      beetle.y = ground.supportAt(beetle.x, beetle.y) ?? beetle.y
      beetle.vy = -5
      advanceGame(ground, emptyInput(), 8)
      expect(beetle.vy).toBeGreaterThanOrEqual(-5)
    }
  })

  it('covers shot-barrel clash', () => {
    const shot = new Game()
    shot.start(0, true)
    shot.enemies = []
    shot.enemyShots.push({
      x: shot.player.x,
      y: shot.player.y + 0.5,
      vx: 0,
      vy: 0,
      active: true,
    })
    shot.thrown.push({
      x: shot.player.x,
      y: shot.player.y + 0.5,
      vx: 0,
      vy: 0,
      active: true,
    })
    advanceGame(shot)
    expect(shot.enemyShots).toHaveLength(0)
  })
})

describe('refactor coverage — audio manifest', () => {
  it('covers audio hurt id and manifest boot failure', async () => {
    expect(resolveAudioEffectId('hurt', {})).toBe(0x46)
    const { audio, fetcher } = createAudioTestHarness()
    fetcher.mockImplementation((url: string) => {
      if (url.includes('manifest')) {
        return Promise.resolve({ ok: false, status: 500, json: () => ({}) })
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      })
    })
    audio.boot()
    await flush()
    expect(audio.inspect().loadedEffects).toBe(0)
  })

  it('covers missing effect entries', async () => {
    const { audio, fetcher } = createAudioTestHarness()
    fetcher.mockImplementation((url: string) => {
      if (url.includes('manifest')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ music: {}, effects: {} }),
        })
      }
      return Promise.reject(new Error('missing'))
    })
    audio.boot()
    audio.effect('banana')
    await flush()
    await flush()
    expect(fetcher).toHaveBeenCalled()
  })
})

describe('refactor coverage — session branches', () => {
  it('covers title pause and static platform surface', () => {
    const title = new Game()
    title.pause()
    expect(title.phase).toBe('title')
    title.start(0)
    title.pause()
    expect(title.phase).toBe('paused')

    const staticPlat = new Game()
    staticPlat.start(0)
    const fixed = staticPlat.level.platforms.find(
      (pickup4) => pickup4.kind !== 'moving',
    )
    if (fixed) {
      expect(staticPlat.surface(fixed)).toBe(fixed.y)
    }
  })

  it('covers roll wall break and cache bunch', () => {
    const rollWall = new Game()
    rollWall.start(0, true)
    rollWall.enemies = []
    const width = assertDefined(rollWall.level.breakableWalls)[1]
    Object.assign(rollWall.player, {
      x: width.x,
      y: width.y + 0.5,
      roll: 0.2,
      grounded: true,
      vx: 0,
    })
    rollWall.resolveBreakableWalls(rollWall.player, rollWall.player.x)
    expect(rollWall.brokenWalls.size).toBeGreaterThan(0)

    const cacheBunch = new Game()
    cacheBunch.start(0)
    cacheBunch.enemies = []
    cacheBunch.level.itemCaches = [
      { x: 9, y: 0, reward: { kind: 'banana', amount: 5 } },
    ]
    cacheBunch.revealedCaches.add(0)
    Object.assign(cacheBunch.player, { x: 9, y: -0.2, grounded: true })
    advanceGame(cacheBunch)
    expect(cacheBunch.bananas).toBeGreaterThan(0)
  })

  it('covers fleeing animals and water crate', () => {
    const fleeWall = new Game()
    fleeWall.start(0, true)
    fleeWall.enemies = []
    const animal = fleeWall.animals[0]
    animal.state = 'fleeing'
    animal.vx = 12
    animal.x = 5
    animal.timer = 0
    advanceGame(fleeWall, emptyInput(), 30)

    const waterCrate = new Game()
    waterCrate.start(3, true)
    waterCrate.enemies = []
    const wcRef = waterCrate.animals.find((actor3) => actor3.state === 'crate')
    if (wcRef) {
      Object.assign(waterCrate.player, {
        x: wcRef.x,
        y: wcRef.y,
        roll: 0,
        vy: 0,
      })
      advanceGame(waterCrate)
      expect(waterCrate.player.x).toBeCloseTo(wcRef.x, 0)
    }
  })
})
