import { ANIMAL_DESIGNS } from '../animals'
import { tr } from '../../i18n'
import { resolveI18nKey } from '../../i18n/resolveText'
import type { LevelDecor } from '../levels'
import { openBonusRoom } from './gameBonusRoom'
import type { Game } from './gameSession'
import type { Input, Player } from './types'

export function cacheBananaEventName(amount: number) {
  if (amount > 1) {
    return 'banana-bunch'
  } else {
    return 'banana'
  }
}

export function throwableBarrelIndex(game: Game, player: Player) {
  return game.level.barrels.findIndex(
    (barrel, index) =>
      barrel.kind === 'throw' &&
      !game.usedBarrels.has(index) &&
      Math.abs(barrel.x - player.x) < 1.7 &&
      Math.abs(barrel.y - player.y) < 1.2,
  )
}

function mountRammingWall(game: Game, player: Player) {
  const mount = game.mount

  if (!mount) {
    return false
  }

  return (
    mount.kind === 'rambi' &&
    (player.mountAttack > 0 || Math.abs(player.vx) > 0.1)
  )
}

export function resolveBreakableWalls(
  game: Game,
  player: Player,
  oldX: number,
) {
  const walls = game.level.breakableWalls

  if (!walls) {
    return
  }

  for (let index = 0; index < walls.length; index++) {
    if (game.brokenWalls.has(index)) {
      continue
    }

    const wall = walls[index]

    const left = wall.x - wall.w / 2

    const right = wall.x + wall.w / 2

    const bottom = wall.y

    const top = wall.y + wall.h

    const overlap =
      player.x + 0.35 > left &&
      player.x - 0.35 < right &&
      player.y + 1.1 > bottom &&
      player.y < top - 0.65

    if (!overlap) {
      continue
    }

    if (player.roll > 0.12 || mountRammingWall(game, player)) {
      game.brokenWalls.add(index)
      game.onEvent('barrel-break')
      openBonusRoom(game, index)
      game.pop(wall.x, wall.y + wall.h * 0.5, tr('game.bonusBanner'), '#f5c98a')
      continue
    }

    if ((player.x - oldX) * (wall.x - oldX) > 0) {
      player.x = oldX
      player.vx = 0
    }
  }
}

export function breakWallsWithThrown(game: Game) {
  const walls = game.level.breakableWalls

  if (!walls) {
    return
  }

  for (const barrel of game.thrown) {
    if (!barrel.active) {
      continue
    }

    for (let index = 0; index < walls.length; index++) {
      if (game.brokenWalls.has(index)) {
        continue
      }

      const wall = walls[index]

      if (
        Math.abs(barrel.x - wall.x) < wall.w / 2 + 0.5 &&
        barrel.y > wall.y - 0.5 &&
        barrel.y < wall.y + wall.h + 0.5
      ) {
        game.brokenWalls.add(index)
        barrel.active = false
        game.onEvent('barrel-break')
        openBonusRoom(game, index)
      }
    }
  }
}

export function updateItemCaches(game: Game, player: Player, input: Input) {
  const caches = game.level.itemCaches

  if (!caches) {
    return
  }

  caches.forEach((cache, index) => {
    if (game.collectedCaches.has(index)) {
      return
    }

    const deltaX = Math.abs(player.x - cache.x)

    const deltaY = Math.abs(player.y + 0.8 - cache.y)

    if (!game.revealedCaches.has(index)) {
      const slap =
        player.roll > 0.1 ||
        (input.pressed.has('action') &&
          player.grounded &&
          input.held.has('down'))

      if (slap && deltaX < 1.5 && deltaY < 1.8) {
        game.revealedCaches.add(index)
        game.onEvent('reveal')
        game.pop(cache.x, cache.y, '?', '#ffe08a')
      }

      return
    }

    if (deltaX > 0.85 || deltaY > 1.2) {
      return
    }

    game.collectedCaches.add(index)
    const reward = cache.reward

    if (reward.kind === 'letter') {
      game.pop(cache.x, cache.y, reward.letter, '#ffdf80')
      game.onEvent('letter')
      return
    }

    if (reward.kind === 'balloon') {
      game.pop(cache.x, cache.y, '1UP', '#ff9fd0')
      game.onEvent('life')
      return
    }

    const amount = reward.amount ?? 1

    game.bananas += amount
    game.levelBananas += amount
    game.total += amount
    game.pop(cache.x, cache.y, `+${String(amount)}`)
    game.onEvent(cacheBananaEventName(amount))
  })
}

export function isTokenCollected(game: Game, token: LevelDecor) {
  const tokens = (game as { collectedTokens?: Set<string> }).collectedTokens

  return tokens?.has(`${String(token.x)}:${String(token.y)}`) ?? false
}

export function collectAnimalTokens(game: Game, player: Player) {
  for (const token of game.level.decors ?? []) {
    if (token.kind !== 'token' || isTokenCollected(game, token)) {
      continue
    }

    const tokenY = token.y + 0.72

    if (
      Math.abs(player.x - token.x) > 0.85 ||
      player.y > tokenY + 0.6 ||
      player.y + 1.6 < tokenY - 0.6
    ) {
      continue
    }

    const tokenKey = `${String(token.x)}:${String(token.y)}`

    let tokens
    if (game.collectedTokens instanceof Set) {
      tokens = game.collectedTokens
    } else {
      tokens = new Set<string>()
    }

    tokens.add(tokenKey)
    game.collectedTokens = tokens
    const animal = token.animal ?? 'expresso'

    const counts =
      (game as { animalTokens?: Record<string, number> }).animalTokens ?? {}

    game.animalTokens = counts
    const count = (counts[animal] = (counts[animal] ?? 0) + 1)

    const label = tr('game.animalToken', {
      name: resolveI18nKey(ANIMAL_DESIGNS[animal].name),
      count,
    })

    game.pop(token.x, tokenY + 0.8, label, '#ffdf80')
    game.message(label, 3)
    game.onEvent(`animal-token-${String(Math.min(3, count))}`)
  }
}

export function maybeSignHint(game: Game, player: Player) {
  if (game.toastTimer > 0) {
    return
  }

  for (const decor of game.level.decors ?? []) {
    if (decor.kind !== 'sign' || !decor.text) {
      continue
    }

    if (
      Math.abs(player.x - decor.x) < 2.2 &&
      Math.abs(player.y - decor.y) < 2.5
    ) {
      game.message(resolveI18nKey(decor.text), 3)
      return
    }
  }
}
