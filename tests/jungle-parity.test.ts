import { describe, expect, it } from "vitest";
import { Game, emptyInput } from "../src/game/engine";
import { ORIGINAL_JUNGLE_ORIGIN } from "../src/game/originalJungle";
import parity from "../reference/jungle-parity-walk.json";

const rawSpeed = (value: number) => value / 256 * 60 / 32;
const rawVelocity = (value: number) => Math.round(value / rawSpeed(1));
const snesYToWorld = (y: number) => (y - ORIGINAL_JUNGLE_ORIGIN.y) / 32;

function isolatedJungleGame() {
  const game = new Game();
  game.start(0, true);
  game.enemies = [];
  game.animals = [];
  game.level.barrels.forEach((_, index) => game.usedBarrels.add(index));
  return game;
}

describe("jungle ROM walk parity fixture", () => {
  it("replays horizontal motion against SNES dk-walk trace", () => {
    const game = isolatedJungleGame();
    const input = emptyInput();
    input.held.add("right");
    for (const row of parity.walkFrames) {
      const before = game.player.x;
      game.update(input);
      expect(rawVelocity(game.player.vx)).toBe(row.vxRaw);
      expect(game.player.x - before).toBeCloseTo(row.vxRaw / 256 / 32, 10);
    }
  });

  it("maps original jungle floor height to SNES ground samples along the walk", () => {
    const game = isolatedJungleGame();
    const terrain = parity.terrainFrames ?? [];
    for (const row of terrain) {
      const worldX = row.x / 32;
      const floor = game.floorAt(worldX, snesYToWorld(row.y));
      expect(floor).not.toBeNull();
      expect(snesYToWorld(row.y)).toBeCloseTo(floor!, 2);
    }
  });
});
