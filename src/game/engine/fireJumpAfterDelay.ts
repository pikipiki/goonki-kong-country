export function fireJumpAfterDelay(
  jumpDelay: number,
  coyote: number,
  rollJump: boolean,
) {
  if (jumpDelay !== 0) {
    return false
  }
  return coyote > 0 || rollJump
}
