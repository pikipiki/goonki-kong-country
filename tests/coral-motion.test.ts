import { describe, expect, it } from "vitest";
import { Game, emptyInput } from "../src/game/engine";
import motion from "../reference/underwater-motion.json";

const rawSpeed = (value: number) => value / 256 * 60 / 32;
const rawVelocity = (value: number) => Math.round(value / rawSpeed(1));

function coralGame() {
  const game = new Game();
  game.start(3, true);
  game.enemies = [];
  game.animals = [];
  return game;
}

describe("ROM Coral Capers swim", () => {
  it("cruises horizontally at vxRaw from underwater-motion.json", () => {
    const game = coralGame();
    const input = emptyInput();
    input.held.add("right");
    for (let i = 0; i < 90; i++) game.update(input);
    expect(rawVelocity(game.player.vx)).toBe(motion.horizontalCruiseVxRaw);
  });

  it("clamps at the surface and lands on coral terrain, not a flat global floor", () => {
    const game = coralGame();
    game.player.y = motion.depthBandWeb.surfaceY + 1;
    game.update(emptyInput());
    expect(game.player.y).toBeLessThanOrEqual(motion.depthBandWeb.surfaceY);
    game.player.x = 20;
    game.player.y = 3.2;
    game.player.vy = 0;
    const input = emptyInput();
    for (let i = 0; i < 30; i++) game.update(input);
    expect(game.player.y).toBeGreaterThan(1.5);
    expect(game.player.y).toBeLessThan(3.5);
  });

  it("rises with jump held and idles with slow sink in open water", () => {
    const game = coralGame();
    game.enemies = [];
    game.player.x = 20;
    game.player.y = 2.8;
    game.player.vy = 0;
    const rise = emptyInput();
    rise.held.add("jump");
    for (let i = 0; i < 40; i++) game.update(rise);
    expect(game.player.y).toBeGreaterThan(2.85);
    const idle = emptyInput();
    for (let i = 0; i < 45; i++) game.update(idle);
    expect(game.player.y).toBeGreaterThan(1.2);
    expect(game.player.y).toBeLessThan(5.02);
    expect(game.player.grounded).toBe(false);
  });
});
