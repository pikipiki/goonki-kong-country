/** Narrow optional values in tests without non-null assertions. */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Expected value to be defined',
): T {
  if (value === null || value === undefined) {
    throw new Error(message)
  }
  return value
}
