export type BarrelKind = 'throw' | 'rescue' | 'checkpoint' | 'cannon'

export function barrelBodyColor(kind: BarrelKind) {
  if (kind === 'rescue') {
    return '#c47aa6'
  }
  if (kind === 'checkpoint') {
    return '#568c72'
  }
  return '#a47b46'
}

export function barrelRingColor(kind: BarrelKind) {
  if (kind === 'rescue') {
    return '#f5c1d9'
  }
  return '#4d5654'
}

export function barrelLabelText(kind: BarrelKind) {
  if (kind === 'rescue') {
    return '♥'
  }
  if (kind === 'checkpoint') {
    return '✓'
  }
  return '✦'
}
