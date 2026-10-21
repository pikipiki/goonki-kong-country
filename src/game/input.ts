import { emptyInput, type Key } from "./engine";
export const KEYBOARD: Record<string, Key> = {
  ArrowLeft: "left",
  KeyA: "left",
  KeyQ: "left",
  ArrowRight: "right",
  KeyD: "right",
  Space: "jump",
  KeyW: "jump",
  KeyZ: "jump",
  ArrowUp: "up",
  ArrowDown: "down",
  KeyS: "down",
  KeyX: "action",
  KeyJ: "action",
  ShiftLeft: "run",
  ShiftRight: "run",
  KeyC: "swap",
  KeyK: "swap",
  Tab: "swap",
};
export class Controls {
  input = emptyInput();
  sources = new Map<string, Key>();
  set(source: string, key: Key, down: boolean) {
    if (down) {
      if (!this.input.held.has(key)) this.input.pressed.add(key);
      this.sources.set(source, key);
    } else {
      if (this.sources.get(source) === key) this.input.released.add(key);
      this.sources.delete(source);
    }
    this.input.held = new Set(this.sources.values());
  }
  reset() {
    this.sources.clear();
    this.input.held.clear();
    this.input.pressed.clear();
    this.input.released.clear();
  }
  gamepad() {
    const pad = Array.from(navigator.getGamepads?.() ?? []).find(Boolean);
    const bindings: [string, Key, boolean][] = [
      [
        "pad-left",
        "left",
        !!pad && ((pad.axes[0] ?? 0) < -0.25 || !!pad.buttons[14]?.pressed),
      ],
      [
        "pad-right",
        "right",
        !!pad && ((pad.axes[0] ?? 0) > 0.25 || !!pad.buttons[15]?.pressed),
      ],
      ["pad-jump", "jump", !!pad?.buttons[0]?.pressed],
      ["pad-action", "action", !!pad?.buttons[2]?.pressed],
      ["pad-swap", "swap", !!pad?.buttons[1]?.pressed],
      ["pad-run", "run", !!pad?.buttons[5]?.pressed],
      ["pad-up", "up", !!pad?.buttons[12]?.pressed],
      ["pad-down", "down", !!pad?.buttons[13]?.pressed],
    ];
    for (const [source, key, down] of bindings) this.set(source, key, down);
  }
}
