import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { Game, emptyInput } from '../src/game/engine'
describe('cannon travel and thrown barrels', () => {
  it('keeps flight momentum and re-enters another cannon', () => {
    const game = new Game()
    game.start(1)
    game.enemies = []
    game.animals = []
    const source = game.level.barrels.findIndex(
      (barrel) => barrel.kind === 'cannon',
    )
    const barrel2 = game.level.barrels[source]
    Object.assign(game.player, {
      x: barrel2.x,
      y: barrel2.y,
      cannon: source,
      grounded: false,
    })
    const input = emptyInput()
    input.pressed.add('jump')
    game.update(input)
    const velX = game.player.vx
    game.update(emptyInput())
    expect(game.player.cannon).toBe(-1)
    expect(game.player.vx).toBe(velX)
    expect(game.player.launched).toBeGreaterThan(0)
    // Another existing barrel is temporarily made a cannon, then restored.
    const targetIndex = game.level.barrels.findIndex(
      (_, index) => index !== source,
    )
    const target = game.level.barrels[targetIndex],
      saved = { ...target }
    try {
      Object.assign(target, {
        kind: 'cannon',
        x: game.player.x + velX / 60,
        y: game.player.y,
      })
      game.update(emptyInput())
      expect(game.player.cannon).toBe(targetIndex)
    } finally {
      Object.assign(target, saved)
    }
  })
})
describe('cannon barrel geometry', () => {
  it("the rotating cannon's visual and firing direction share one angle", () => {
    const game2 = new Game()
    game2.start(1)
    const index2 = game2.level.barrels.findIndex(
      (barrel3) => barrel3.rotationSpeed,
    )
    const actor = game2.cannonAngle(index2)
    game2.time = 0.8
    expect(game2.cannonAngle(index2)).not.toBe(actor)
  })
  it('points the mouth and non-billboard arrow along the actual quantized shot', () => {
    const game3 = new Game()
    game3.start(1)
    game3.enemies = []
    game3.animals = []
    const index3 = game3.level.barrels.findIndex(
        (barrel4) => barrel4.kind === 'cannon',
      ),
      barrel5 = game3.level.barrels[index3],
      saved = { ...barrel5 }
    try {
      for (const angle of [
        0,
        Math.PI / 2,
        Math.PI,
        -Math.PI / 2,
        0.25,
        0.8,
        2.6,
        -2.2,
      ]) {
        barrel5.angle = angle
        barrel5.rotationSpeed = 0
        Object.assign(game3.player, {
          x: barrel5.x,
          y: barrel5.y,
          cannon: index3,
          grounded: false,
          cannonTime: 0,
        })
        const display = game3.cannonAngle(index3),
          axis = new Vector3(0, 1, 0).applyAxisAngle(
            new Vector3(0, 0, 1),
            display - Math.PI / 2,
          )
        const input = emptyInput()
        input.pressed.add('jump')
        game3.update(input)
        const velocity = new Vector3(
          game3.player.vx,
          game3.player.vy,
          0,
        ).normalize()
        expect(axis.dot(velocity)).toBeCloseTo(1, 8)
      }
    } finally {
      Object.assign(barrel5, saved)
    }
  })
})
describe('cannon travel and thrown barrels — flight', () => {
  it('fires an automatic cannon without a button press', () => {
    const game4 = new Game()
    game4.start(1)
    game4.enemies = []
    const index4 = game4.level.barrels.findIndex(
        (barrel6) => barrel6.kind === 'cannon',
      ),
      barrel7 = game4.level.barrels[index4]
    const saved = barrel7.autoFire
    try {
      barrel7.autoFire = true
      Object.assign(game4.player, {
        x: barrel7.x,
        y: barrel7.y,
        cannon: index4,
        grounded: false,
      })
      for (let count = 0; count < 12; count++) {
        game4.update(emptyInput())
      }
      expect(game4.player.cannon).toBe(-1)
      expect(game4.player.launched).toBeGreaterThan(0)
    } finally {
      barrel7.autoFire = saved
    }
  })
  it('wooden projectiles roll over a platform without falling through it', () => {
    const game5 = new Game()
    game5.start()
    game5.enemies = []
    game5.thrown.push({ x: 4, y: 1, vx: 5, vy: -2, active: true })
    for (let count2 = 0; count2 < 25; count2++) {
      game5.update(emptyInput())
    }
    expect(game5.thrown[0].y).toBe(0.5)
    expect(game5.thrown[0].x).toBeGreaterThan(5)
  })
})
