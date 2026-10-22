export function mapKeyboardDirection(key: string): number {
  if (key === 'ArrowRight' || key === 'ArrowDown') {
    return 1
  }
  if (key === 'ArrowLeft' || key === 'ArrowUp') {
    return -1
  }
  return 0
}
