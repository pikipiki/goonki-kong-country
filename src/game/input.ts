import { emptyInput, type Key } from './engine'

export const KEYBOARD: Record<string, Key> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  KeyQ: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'jump',
  KeyW: 'jump',
  KeyZ: 'jump',
  ArrowUp: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  KeyX: 'action',
  KeyJ: 'action',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  KeyC: 'swap',
  KeyK: 'swap',
  Tab: 'swap',
}

export class Controls {
  input = emptyInput()
  sources = new Map<string, Key>()
  set(source: string, key: Key, down: boolean) {
    const wasHeld = this.input.held.has(key)

    if (down) {
      this.sources.set(source, key)

      if (!wasHeld) {
        this.input.pressed.add(key)

        if (key === 'action') {
          this.input.tapAction = source === 'screen-action'
        }
      }
    } else {
      this.sources.delete(source)
    }

    this.input.held = new Set(this.sources.values())

    // Releasing one finger must not release a key still held by another source.
    if (wasHeld && !this.input.held.has(key)) {
      this.input.released.add(key)
    }
  }
  reset() {
    this.input.tapAction = false
    this.sources.clear()
    this.input.held.clear()
    this.input.pressed.clear()
    this.input.released.clear()
  }
  setClickMode(mode: boolean) {
    this.input.clickMode = mode
  }
  gamepad() {
    let gamepads
    if (typeof navigator.getGamepads === 'function') {
      gamepads = navigator.getGamepads()
    } else {
      gamepads = []
    }

    const pad = Array.from(gamepads).find(
      (gamepad): gamepad is Gamepad => gamepad !== null,
    )

    const bindings: [string, Key, boolean][] = [
      [
        'pad-left',
        'left',
        Boolean(
          pad &&
          ((pad.axes[0] ?? 0) < -0.25 || (pad.buttons[14]?.pressed ?? false)),
        ),
      ],
      [
        'pad-right',
        'right',
        Boolean(
          pad &&
          ((pad.axes[0] ?? 0) > 0.25 || (pad.buttons[15]?.pressed ?? false)),
        ),
      ],
      ['pad-jump', 'jump', pad?.buttons[0]?.pressed ?? false],
      ['pad-action', 'action', pad?.buttons[2]?.pressed ?? false],
      ['pad-swap', 'swap', pad?.buttons[1]?.pressed ?? false],
      ['pad-run', 'run', pad?.buttons[5]?.pressed ?? false],
      ['pad-up', 'up', pad?.buttons[12]?.pressed ?? false],
      ['pad-down', 'down', pad?.buttons[13]?.pressed ?? false],
    ]

    for (const [source, key, down] of bindings) {
      this.set(source, key, down)
    }
  }
}
