import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { r3fClock } from '../r3fClock'
import type { Group } from 'three'
import { Sprite, SpriteMaterial } from 'three'
import type { Game } from '../../game/engine'
import { particles as settings } from '../../config/presentation.json'
import { textTexture } from './textTexture'

export function useActorsFrame(game: Game, level: Game['level']) {
  const barrels = useRef<Group>(null)
  const carried = useRef<Group>(null)
  const cart = useRef<Group>(null)
  const projectiles = useRef<Group>(null)
  const nuts = useRef<Group>(null)
  const effects = useRef<Group>(null)
  const texture = useMemo(() => textTexture('✦', '#ffe6a5'), [])
  useEffect(() => {
    const effectGroup = effects.current
    return () => {
      disposeParticleSprites(effectGroup)
      texture.dispose()
    }
  }, [texture])
  useFrame((state) => {
    const clock = r3fClock(state)
    syncBarrels(game, level, barrels.current)
    syncCarried(game, carried.current)
    syncCart(game, cart.current)
    syncProjectiles(game, projectiles.current, clock.elapsedTime)
    syncEnemyShots(game, nuts.current)
    syncParticles(game, effects.current, texture)
  })
  return { barrels, carried, cart, projectiles, nuts, effects }
}
function syncBarrels(game: Game, level: Game['level'], group: Group | null) {
  group?.children.forEach((obj, barrelIdx) => {
    const barrel = level.barrels[barrelIdx]
    obj.visible = !game.usedBarrels.has(barrelIdx)
    if (barrel.kind === 'cannon') {
      const position = game.cannonPosition(barrelIdx, level)
      obj.position.set(position.x, position.y, 0)
      obj.rotation.z = game.cannonAngle(barrelIdx, level) - Math.PI / 2
    }
  })
}
function syncCarried(game: Game, group: Group | null) {
  if (!group) {
    return
  }
  group.visible = game.player.carry >= 0
  group.position.set(game.player.x, game.player.y + 1.9, 0.2)
}
function syncCart(game: Game, group: Group | null) {
  if (!group) {
    return
  }
  group.visible =
    game.level.originalTerrain === 'mineCart' ||
    (game.level.biome === 'mine' && game.level.originalTerrain !== 'cave')
  group.position.set(game.player.x, game.player.y + 0.55, 0)
}
function syncProjectiles(game: Game, group: Group | null, elapsed: number) {
  group?.children.forEach((obj, shotIdx) => {
    const projectile = game.thrown.at(shotIdx)
    obj.visible = projectile !== undefined
    if (!projectile) {
      return
    }
    obj.position.set(projectile.x, projectile.y, 0.2)
    obj.rotation.z = -elapsed * 12
  })
}
function syncEnemyShots(game: Game, group: Group | null) {
  group?.children.forEach((obj, shotIdx) => {
    const shot = game.enemyShots.at(shotIdx)
    obj.visible = shot !== undefined
    if (!shot) {
      return
    }
    obj.position.set(shot.x, shot.y, 0.25)
  })
}
function syncParticles(
  game: Game,
  group: Group | null,
  texture: ReturnType<typeof textTexture>,
) {
  if (!group) {
    return
  }
  while (group.children.length < game.particles.length) {
    const sprite = new Sprite(
      new SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      }),
    )
    group.add(sprite)
  }
  group.children.forEach((obj, particleIdx) => {
    const particle = game.particles.at(particleIdx)
    obj.visible = particle !== undefined
    if (!particle) {
      return
    }
    obj.position.set(
      particle.x,
      particle.y + particle.age * settings.risePerSecond,
      1,
    )
    obj.scale.setScalar(
      settings.startScale * (1 - particle.age / settings.lifetimeSeconds),
    )
    const sprite = obj as Sprite
    sprite.material.opacity = 1 - particle.age / settings.lifetimeSeconds
  })
}

/** Imperative sprites are owned here, outside React Three Fiber's tree. */
export function disposeParticleSprites(group: Group | null) {
  group?.children.forEach((child) => {
    if (child instanceof Sprite) child.material.dispose()
  })
  group?.clear()
}
