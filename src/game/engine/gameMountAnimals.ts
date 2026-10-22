import {
  ANIMAL_DESIGNS,
  ENGUARDE_SWIM_BODY,
  type Animal,
  type AnimalKind,
} from '../animals'
import { tr } from '../../i18n'
import { resolveI18nKey } from '../../i18n/resolveText'
import {
  nearestCoralOpenY,
  resolveCoralMotion,
  resolveLandMotion,
} from '../terrainSolids'
import type { Game } from './gameSession'
import type { Input } from './types'

function mountGreeting(kind: AnimalKind) {
  const name = resolveI18nKey(ANIMAL_DESIGNS[kind].name)

  let tip = tr('game.mountRambi')

  if (kind === 'winky') {
    tip = tr('game.mountWinky')
  } else if (kind === 'expresso') {
    tip = tr('game.mountExpresso')
  } else if (kind === 'enguarde') {
    tip = tr('game.mountEnguarde')
  }

  return `${tr('game.mountGreeting', { name })} ${tip}`
}

function settleLandAnimal(
  game: Game,
  animal: Animal,
  lastX: number,
  lastY: number,
) {
  if (game.level.originalTerrain) {
    const floor = game.supportAt(lastX, lastY, 0.2)

    const contact = resolveLandMotion(
      game.level.originalTerrain,
      lastX,
      lastY,
      animal.x,
      animal.y,
      floor !== null && Math.abs(floor - lastY) < 0.2,
      animal.vy,
    )

    animal.x = contact.x
    animal.y = contact.y

    if (contact.blockedY) {
      animal.vy = 0
    }

    if (contact.blockedX) {
      animal.vx *= -1
    }

    return
  }

  const floor = game.supportAt(animal.x, lastY, 0.2)

  if (
    floor !== null &&
    animal.vy <= 0 &&
    animal.y <= floor &&
    lastY >= floor - 0.2
  ) {
    animal.y = floor
    animal.vy = 0
  }
}

export function advanceLooseAnimal(
  game: Game,
  animal: Animal,
  water: boolean,
  deltaTime: number,
) {
  const lastX = animal.x,
    lastY = animal.y

  if (animal.state === 'fleeing') {
    animal.x += animal.vx * deltaTime
  }

  if (!water) {
    animal.vy -= 28 * deltaTime
    animal.y += animal.vy * deltaTime
    settleLandAnimal(game, animal, lastX, lastY)
  } else if (animal.state === 'fleeing') {
    animal.y += Math.sin(animal.timer * 5) * deltaTime

    if (game.level.originalTerrain === 'coral') {
      const contact = resolveCoralMotion(lastX, lastY, animal.x, animal.y)

      animal.x = contact.x
      animal.y = contact.y
    }
  }

  if (animal.state === 'fleeing' && animal.timer > 1.25) {
    animal.state = 'idle'
    animal.vx = 0
  }
}

export function releaseMountAnimal(game: Game, animal: Animal) {
  animal.state = 'idle'
  game.pop(
    animal.x,
    animal.y + 1.8,
    resolveI18nKey(ANIMAL_DESIGNS[animal.kind].name),
    '#f9df93',
  )
  game.onEvent('rescue')
  if (animal.kind === 'enguarde') {
    game.message(tr('game.releaseEnguarde'), 5)
  } else {
    game.message(
      tr('game.releaseMount', {
        name: resolveI18nKey(ANIMAL_DESIGNS[animal.kind].name),
      }),
      5,
    )
  }
}

function tryMountPlayerFromAnimal(
  game: Game,
  animal: Animal,
  index: number,
  oldY: number,
  water: boolean,
) {
  const player = game.player

  if (player.mount >= 0 || player.mountCooldown > 0 || animal.y < -7) {
    return
  }

  const seat = ANIMAL_DESIGNS[animal.kind].seat

  const descending =
    player.vy <= 0 &&
    oldY >= animal.y + seat - 0.2 &&
    player.y <= animal.y + seat

  const inMountRange = water ? Math.abs(player.y - animal.y) < 1.2 : descending

  if (
    Math.abs(player.x - animal.x) >= ANIMAL_DESIGNS[animal.kind].width ||
    !inMountRange
  ) {
    return
  }

  animal.state = 'ridden'
  animal.timer = 0
  player.mount = index
  if (game.level.originalTerrain === 'coral') {
    player.y = nearestCoralOpenY(animal.x, animal.y, ENGUARDE_SWIM_BODY.height)
  } else {
    player.y = animal.y
  }
  animal.y = player.y
  player.vy = 0
  player.grounded = !water
  player.roll = 0
  player.rollJump = false
  player.rollJumpMomentum = 0
  player.carry = -1
  player.coyote = 0
  game.onEvent('mount')
  game.message(mountGreeting(animal.kind), 5)
}

export function updateMountAnimals(
  game: Game,
  _input: Input,
  oldY: number,
  deltaTime: number,
) {
  const player = game.player

  const water = game.level.biome === 'lagoon'

  game.animals.forEach((animal, index) => {
    animal.timer += deltaTime

    if (animal.state === 'ridden') {
      animal.x = player.x
      animal.y = player.y
      animal.facing = player.facing
      animal.vx = player.vx
      return
    }

    if (animal.state === 'fleeing' || animal.state === 'idle') {
      advanceLooseAnimal(game, animal, water, deltaTime)
    }

    if (animal.state === 'crate') {
      if (
        Math.abs(player.x - animal.x) < 0.9 &&
        Math.abs(player.y - animal.y) < 1.35 &&
        (player.roll > 0 || (player.vy < 0 && oldY >= animal.y + 0.85) || water)
      ) {
        releaseMountAnimal(game, animal)
      }

      return
    }

    tryMountPlayerFromAnimal(game, animal, index, oldY, water)
  })
}
