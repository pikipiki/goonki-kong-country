import { describe, it, expect } from 'vitest'
import { Game, emptyInput } from '../src/game/engine'

function advance(
  game: Game,
  held: Parameters<Set<string>['add']>[0][],
  frames: number,
) {
  const input = emptyInput()
  held.forEach((key) => input.held.add(key as never))
  for (let count = 0; count < frames; count++) {
    game.update(input)
  }
}

describe('team, barrels, and collectibles', () => {
  it('switches characters only while both are available', () => {
    const game = new Game()
    game.start()
    const input = emptyInput()
    input.pressed.add('swap')
    game.update(input)
    expect(game.player.active).toBe(1)
    expect(game.swap).not.toBeNull()
    for (let index = 0; index < 30; index++) {
      game.update(emptyInput())
    }
    expect(game.swap).toBeNull()
    game.player.hp = 1
    input.pressed.add('swap')
    game.update(input)
    expect(game.player.active).toBe(1)
  })
  it('loses one partner before a life and ignores repeated contact while invincible', () => {
    const game = new Game()
    game.start()
    game.damage()
    expect(game.player.hp).toBe(1)
    expect(game.lives).toBe(5)
    game.damage()
    expect(game.lives).toBe(5)
    game.player.invincible = 0
    game.damage()
    expect(game.lives).toBe(4)
  })
  it('respawns a falling player at the checkpoint', () => {
    const game = new Game()
    game.start()
    game.checkpoint = { x: 53, y: 0 }
    game.player.x = 62
    game.player.y = -9
    game.update(emptyInput())
    expect(game.player.x).toBe(53)
    expect(game.lives).toBe(4)
  })
  it('collects a banana once and grants a life at 100', () => {
    const game = new Game()
    game.start()
    const index = game.level.pickups.findIndex(
        (pickup) => pickup.kind === 'banana',
      ),
      item = game.level.pickups[index]
    game.bananas = 99
    game.player.x = item.x
    game.player.y = item.y - 0.85
    game.update(emptyInput())
    expect(game.bananas).toBe(0)
    expect(game.lives).toBe(6)
    advance(game, [], 2)
    expect(game.total).toBe(1)
  })
  it('restores the missing partner from a rescue barrel', () => {
    const game = new Game()
    game.start()
    game.player.hp = 1
    game.player.x = 6
    game.update(emptyInput())
    expect(game.player.hp).toBe(2)
    expect(game.usedBarrels.has(0)).toBe(true)
  })
})

describe('barrel carry and cannon', () => {
  it('throws a carried barrel on action tap in click mode', () => {
    const game = new Game()
    game.start()
    game.player.x = 19
    const input = emptyInput()
    input.clickMode = true
    input.held.add('action')
    input.pressed.add('action')
    game.update(input)
    expect(game.player.carry).toBe(1)
    input.pressed.clear()
    input.held.delete('action')
    input.pressed.add('action')
    input.held.add('action')
    game.update(input)
    expect(game.player.carry).toBe(-1)
    expect(game.thrown).toHaveLength(1)
  })
  it('picks up and throws a nearby barrel', () => {
    const game = new Game()
    game.start()
    game.player.x = 19
    const pickup = emptyInput()
    pickup.pressed.add('action')
    pickup.held.add('action')
    game.update(pickup)
    expect(game.player.carry).toBe(1)
    const release = emptyInput()
    release.released.add('action')
    game.update(release)
    expect(game.player.carry).toBe(-1)
    expect(game.thrown).toHaveLength(1)
    expect(game.thrown[0].vx).toBeGreaterThan(0)
    const initial = game.thrown[0].vx
    let slowed = initial
    for (let index2 = 0; index2 < 8; index2++) {
      game.update(emptyInput())
      if (game.thrown[0]?.active) {
        slowed = game.thrown[0].vx
      }
    }
    expect(slowed).toBeLessThan(initial)
    expect(slowed).toBeGreaterThan(0)
  })
  it('picks up a barrel while holding action in range (ROM hold path)', () => {
    const game = new Game()
    game.start()
    game.player.x = 19
    const input = emptyInput()
    input.held.add('action')
    game.update(input)
    expect(game.player.carry).toBe(1)
  })
  it('launches from cannon and permits a subsequent landing', () => {
    const game = new Game()
    game.start(1)
    const cannon = game.level.barrels.findIndex(
      (barrel) => barrel.kind === 'cannon',
    )
    game.player.cannon = cannon
    const input = emptyInput()
    input.pressed.add('jump')
    game.update(input)
    expect(game.player.cannon).toBe(-1)
    expect(game.player.vy).toBeGreaterThan(10)
  })
})
