import { mountAction } from '../config/gameplay.json'
import type { TFunction } from 'i18next'
import type { Game } from '../game/engine'
import type { Controls } from '../game/input'

export function controllerHint(
  game: Game,
  clickMode: boolean,
  translate: TFunction,
) {
  if (game.mount?.kind === 'enguarde') {
    return translate('tapEnguardeHint')
  }
  if (game.mount?.kind === 'rambi') {
    return translate('tapChargeHint')
  }
  if (game.mount?.kind === 'expresso') {
    return translate('tapFlutterHint')
  }
  if (game.player.carry >= 0) {
    return translate('tapCarryHint')
  }
  if (clickMode) {
    return translate('clickModeHint')
  }
  return translate('touchModeHint')
}

export function primaryActionTitle(game: Game, translate: TFunction): string {
  if (game.player.cannon >= 0) {
    return translate('fire')
  }
  if (game.mount?.kind === 'enguarde' || game.mount?.kind === 'rambi') {
    if (game.player.mountCharge >= mountAction.readyChargeSeconds) {
      return translate('launchCharge')
    }
    return translate('charge')
  }
  if (game.player.carry >= 0) {
    return translate('throw')
  }
  return translate('action')
}

export function jumpActionTitle(
  game: Game,
  controls: Controls,
  translate: TFunction,
): string {
  if (game.player.cannon >= 0) {
    return translate('blastOff')
  }
  if (game.mount?.kind === 'enguarde') {
    return translate('quickAttack')
  }
  if (game.mount?.kind === 'expresso') {
    if (controls.input.held.has('jump')) {
      return translate('stopFlutter')
    }
    return translate('flutter')
  }
  if (game.mount?.kind === 'winky') {
    return translate('leap')
  }
  if (game.level.biome === 'lagoon') {
    return translate('swim')
  }
  return translate('jump')
}
