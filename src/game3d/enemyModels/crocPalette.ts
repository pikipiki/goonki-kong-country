import { ENEMY_DESIGNS } from '../../game/enemies'

export function crocGreen(helmet: boolean, king: boolean): string {
  if (helmet) {
    return '#738547'
  }
  if (king) {
    return '#5b893b'
  }
  return '#528638'
}

export function crocBelly(king: boolean): string {
  if (king) {
    return '#d6b24e'
  }
  return '#bcb76b'
}

export function crocDesignKey(
  helmet: boolean,
  king: boolean,
): keyof typeof ENEMY_DESIGNS {
  if (king) {
    return 'boss'
  }
  if (helmet) {
    return 'armored'
  }
  return 'croc'
}

export function crocTorsoWidth(king: boolean, helmet: boolean): number {
  if (king) {
    return 0.59
  }
  if (helmet) {
    return 0.53
  }
  return 0.41
}

export function crocTorsoDepth(helmet: boolean): number {
  if (helmet) {
    return 0.41
  }
  return 0.36
}

export function crocBellyWidth(helmet: boolean): number {
  if (helmet) {
    return 0.36
  }
  return 0.29
}

export function crocBellyDepth(helmet: boolean): number {
  if (helmet) {
    return 0.39
  }
  return 0.34
}
