import { describe, expect, it } from "vitest";
import { Game, emptyInput } from "../src/game/engine";
import runtime from "../reference/runtime-player-analysis.json";

const rawSpeed = (value: number) => value / 256 * 60 / 32;
const rawVelocity = (value: number) => Math.round(value / rawSpeed(1));
function isolated(active = 0) {
  const game = new Game();
  game.start();
  game.enemies = [];
  game.animals = [];
  game.player.active = active;
  game.level.barrels.forEach((_, index) => game.usedBarrels.add(index));
  return game;
}

describe("actual Rev 2 player motion oracle", () => {
  for (const [active, scenario] of [[0, "dk-walk"], [1, "diddy-walk"]] as const) {
    it(`matches the first twelve measured horizontal velocity samples for ${scenario}`, () => {
      const game = isolated(active);
      const input = emptyInput();
      input.held.add("right");
      const expected = runtime.scenarios[scenario].trace.slice(0, 12);
      for (const row of expected) {
        const before = game.player.x;
        game.update(input);
        expect(rawVelocity(game.player.vx)).toBe(row.vxRaw);
        expect(game.player.x - before).toBeCloseTo(row.vxRaw / 256 / 32, 10);
      }
    });
  }

  for (const [active, heldScenario, tapScenario] of [
    [0, "dk-jump-held", "dk-jump-tap"],
    [1, "diddy-jump-held", "diddy-jump-tap"],
  ] as const) {
    for (const [held, name] of [[true, heldScenario], [false, tapScenario]] as const) {
      it(`matches every airborne velocity and position after the measured impulse for ${name}`, () => {
        const recording = runtime.scenarios[name];
        const game = isolated(active);
        // Align at ROM frame 2, after the animation callback set the impulse.
        // Input-to-impulse preparation remains documented separately.
        game.player.grounded = false;
        game.player.coyote = 0;
        game.player.vy = rawSpeed(recording.jump.initialImpulseRaw);
        const input = emptyInput();
        if (held) input.held.add("jump");
        let peak = 0;
        for (const row of recording.trace.filter(row => row.frame > recording.jump.impulseFrame && row.groundDistance < 0)) {
          game.update(input);
          expect(rawVelocity(game.player.vy)).toBe(row.vyRaw);
          const measuredRise = row.y + row.yFractionRaw / 65536 - recording.initial.y;
          expect(game.player.y).toBeCloseTo(measuredRise / 32, 9);
          peak = Math.max(peak, game.player.y);
        }
        expect(peak).toBeCloseTo(recording.jump.risePrecisePixels / 32, 9);
      });
    }
  }
});
