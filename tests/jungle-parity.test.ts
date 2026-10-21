import { describe, expect, it } from "vitest";
import { Game, emptyInput } from "../src/game/engine";
import parity from "../reference/jungle-parity-walk.json";

const rawSpeed = (value: number) => value / 256 * 60 / 32;
const rawVelocity = (value: number) => Math.round(value / rawSpeed(1));

describe("jungle ROM walk parity fixture", () => {
  it("replays dk-walk frames on isolated original jungle start", () => {
    const game = new Game();
    game.start(0, true);
    game.enemies = [];
    game.animals = [];
    game.level.barrels.forEach((_, index) => game.usedBarrels.add(index));
    const input = emptyInput();
    input.held.add("right");
    for (const row of parity.frames) {
      const before = game.player.x;
      game.update(input);
      expect(rawVelocity(game.player.vx)).toBe(row.vxRaw);
      expect(game.player.x - before).toBeCloseTo(row.vxRaw / 256 / 32, 10);
    }
  });
});
