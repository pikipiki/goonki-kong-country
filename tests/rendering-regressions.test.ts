import { BODY_PROFILE } from '../src/game3d/plushGoonk/profile'
import contour from '../src/game2d/plush-contour.json'
import { fallbackSegments } from '../src/config/plush-profile.json'
import { describe, expect, it, vi } from 'vitest'
import { Group, OrthographicCamera, Sprite, SpriteMaterial } from 'three'
import { Game } from '../src/game/engine'
import { applyDirectorCamera } from '../src/scene/directorCamera'
import {
  createBossAtlasDrawer,
  bossObjectFrame,
} from '../src/game2d/bossScene2dSprite'
import type { BossAssets } from '../src/game2d/bossScene2dAssets'
import { tickParticles } from '../src/game/engine/playingFrame/playerClockTimers'
import { disposeParticleSprites } from '../src/game3d/levelActors/useActorsFrame'

function atlasFixture() {
  // Canvas only needs the image identity; this unit test never uploads pixels.
  const image = {} as HTMLImageElement
  const manifest = {
    frames: [{ x: 0, y: 0, w: 20, h: 40, ox: -10, oy: -40 }],
    groups: { idle: [0] },
  }
  const assets: BossAssets = {
    image,
    manifest,
    background: null,
    objects: image,
    objectManifest: manifest,
  }
  const context = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
  }
  return { draw: createBossAtlasDrawer(assets), context }
}
describe('rendering correctness and resource budgets', () => {
  it.each([0.5, 1, 2])('honors the boss explicit sprite scale %s', (scale) => {
    const { draw, context } = atlasFixture()
    draw(
      'idle',
      0,
      0,
      0,
      context as unknown as CanvasRenderingContext2D,
      false,
      100,
      true,
      scale,
    )
    expect(context.drawImage.mock.calls[0].slice(-2)).toEqual([
      20 * scale,
      40 * scale,
    ])
  })
  it('still derives sprite scale from desired height when no override is supplied', () => {
    const { draw, context } = atlasFixture()
    draw(
      'idle',
      0,
      0,
      0,
      context as unknown as CanvasRenderingContext2D,
      false,
      100,
    )
    expect(context.drawImage.mock.calls[0].slice(-2)).toEqual([50, 100])
  })
})
describe('rendering performance and resource lifetime', () => {
  it('updates the projection only when zoom changes, while following movement', () => {
    const game = new Game()
    game.start(0, true)
    const camera = new OrthographicCamera(-10, 10, 10, -10)
    const projection = vi.spyOn(camera, 'updateProjectionMatrix')
    const args = {
      engine: game,
      camera,
      size: { width: 390, height: 600 },
      delta: 1 / 60,
      focus: { current: 6 },
      lastLevel: { current: -1 },
    }
    applyDirectorCamera(args)
    expect(projection).toHaveBeenCalledTimes(1)
    const previousX = camera.position.x
    game.player.x += 2
    for (let frame = 0; frame < 60; frame++) applyDirectorCamera(args)
    expect(projection).toHaveBeenCalledTimes(1)
    expect(camera.position.x).toBeGreaterThan(previousX)
    applyDirectorCamera({ ...args, size: { width: 844, height: 390 } })
    expect(projection).toHaveBeenCalledTimes(2)
  })
  it('expires particles without replacing their array or reordering survivors', () => {
    const game = new Game()
    game.particles = [0, 1.29, 0.5].map((age, index) => ({
      x: index,
      y: 0,
      age,
      text: 'test',
      color: '#fff',
    }))
    const pool = game.particles
    tickParticles(game, 0.1)
    expect(game.particles).toBe(pool)
    expect(pool.map((particle) => particle.x)).toEqual([0, 2])
  })
  it('releases every pooled sprite material when its scene is removed', () => {
    const group = new Group()
    const materials = [new SpriteMaterial(), new SpriteMaterial()]
    const released = materials.map((material) => vi.spyOn(material, 'dispose'))
    for (const material of materials) group.add(new Sprite(material))
    disposeParticleSprites(group)
    expect(group.children).toHaveLength(0)
    for (const dispose of released) expect(dispose).toHaveBeenCalledOnce()
    disposeParticleSprites(group)
    for (const dispose of released) expect(dispose).toHaveBeenCalledOnce()
  })
})

describe('2D and 3D plush silhouette parity', () => {
  it('keeps the generated 2D fallback identical to the 3D curve', () => {
    expect(contour).toHaveLength(fallbackSegments + 1)
    contour.forEach(([radius, height], index) => {
      const point = BODY_PROFILE.getPoint(index / fallbackSegments)
      expect(radius).toBeCloseTo(point.x, 12)
      expect(height).toBeCloseTo(point.y, 12)
    })
  })
})

describe('boss object atlas groups', () => {
  it('uses the frame IDs in the requested animation group', () => {
    const image = {} as HTMLImageElement
    const frames = [0, 1, 2].map((index) => ({
      x: index * 20,
      y: 0,
      w: 20,
      h: 40,
      ox: -10,
      oy: -40,
    }))
    const manifest = { frames, groups: { barrel_idle: [2, 0] } }
    const assets: BossAssets = {
      image,
      background: null,
      manifest,
      objects: image,
      objectManifest: manifest,
    }
    expect(bossObjectFrame(assets, 'barrel_idle', 0)).toBe(frames[2])
    expect(bossObjectFrame(assets, 'barrel_idle', 1 / 12)).toBe(frames[0])
    expect(bossObjectFrame(assets, 'barrel_idle', 2 / 12)).toBe(frames[2])
    expect(bossObjectFrame(assets, 'missing', 0)).toBeUndefined()
  })
})
