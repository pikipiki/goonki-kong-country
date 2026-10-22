/** ESLint-friendly alternative to `condition ? whenTrue : whenFalse` (`no-ternary`). */
type PickBranch<T> = T | (() => T)

function evaluate<T>(branch: PickBranch<T>): T {
  if (typeof branch === 'function') {
    return (branch as () => T)()
  }

  return branch
}

export function pick<T>(
  condition: boolean,
  whenTrue: PickBranch<T>,
  whenFalse: PickBranch<T>,
): T {
  if (condition) {
    return evaluate(whenTrue)
  }

  return evaluate(whenFalse)
}
