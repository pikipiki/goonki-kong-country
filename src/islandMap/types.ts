export type Destination = {
  name: string
  subtitle: string
}

export type MapProps = {
  selected: number
  unlocked: number
  initial: number
  onSelect: (index: number) => void
  onConfirm: () => void
  stages: Destination[]
  mode2D?: boolean
  onSound?: (name: 'map-step' | 'map-arrive') => void
}
