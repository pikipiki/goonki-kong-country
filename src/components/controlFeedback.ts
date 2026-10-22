export function controlFeedback() {
  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate(9)
  }
}
