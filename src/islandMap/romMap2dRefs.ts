export type RomMap2dRefs = {
  selected: number
  unlocked: number
  onSelect: (index: number) => void
  onProject: (points: { x: number; y: number }[]) => void
  onSound?: (name: 'map-step' | 'map-arrive') => void
}
