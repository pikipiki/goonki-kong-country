import type { TFunction } from 'i18next'
import type { Phase } from '../game/engine'

export function panelFlowerGlyph(phase: Phase): string {
  if (phase === 'gameover') {
    return '☁'
  }
  if (phase === 'paused') {
    return '❋'
  }
  return '✦'
}

export function panelEyebrowKey(phase: Phase): string {
  if (phase === 'paused') {
    return 'panelPauseEyebrow'
  }
  if (phase === 'gameover') {
    return 'panelGameoverEyebrow'
  }
  if (phase === 'victory') {
    return 'panelVictoryEyebrow'
  }
  return 'panelClearEyebrow'
}

export function panelTitleKey(phase: Phase): string {
  if (phase === 'paused') {
    return 'panelPauseTitle'
  }
  if (phase === 'clear') {
    return 'panelClearTitle'
  }
  if (phase === 'victory') {
    return 'panelVictoryTitle'
  }
  return 'panelGameoverTitle'
}

export function panelDescriptionKey(phase: Phase): string {
  if (phase === 'paused') {
    return 'panelPauseDesc'
  }
  if (phase === 'victory') {
    return 'panelVictoryDesc'
  }
  if (phase === 'gameover') {
    return 'panelGameoverDesc'
  }
  return 'panelClearDesc'
}

export function panelPrimaryKey(phase: Phase): string {
  if (phase === 'paused') {
    return 'resume'
  }
  if (phase === 'clear') {
    return 'continueOnMap'
  }
  if (phase === 'gameover') {
    return 'retry'
  }
  return 'play'
}

export function panelEyebrowText(
  phase: Phase,
  translate: TFunction,
  levelLabel: string,
): string {
  if (phase === 'clear') {
    return translate('panelClearEyebrow', { id: levelLabel })
  }
  return translate(panelEyebrowKey(phase))
}
