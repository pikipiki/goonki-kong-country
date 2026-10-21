import { describe, expect, it } from "vitest";
import { Game, emptyInput } from "../src/game/engine";
import motion from "../reference/underwater-motion.json";
import { CORAL_WATER_SURFACE_Y, coralWorldFromSource as world } from "../src/game/marineScale";

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
    game.player.y = CORAL_WATER_SURFACE_Y + 1;
    game.update(emptyInput());
    expect(game.player.y).toBeLessThanOrEqual(CORAL_WATER_SURFACE_Y);
    game.player.x = world(20);
    game.player.y = world(3.2);
    game.player.vy = 0;
    const input = emptyInput();
    for (let i = 0; i < 30; i++) game.update(input);
    expect(game.player.y).toBeGreaterThan(world(1.5));
    expect(game.player.y).toBeLessThan(world(3.5));
  });

  it("rises with jump held and idles with slow sink in open water", () => {
    const game = coralGame();
    game.enemies = [];
    game.player.x = world(20);
    game.player.y = world(2.8);
    game.player.vy = 0;
    const rise = emptyInput();
    rise.held.add("jump");
    for (let i = 0; i < 40; i++) game.update(rise);
    expect(game.player.y).toBeGreaterThan(world(2.8)+.05);
    const idle = emptyInput();
    let peak=game.player.y;
    for (let i = 0; i < 90; i++) {game.update(idle);peak=Math.max(peak,game.player.y);}
    expect(game.player.y).toBeGreaterThan(world(1.2));
    expect(game.player.y).toBeLessThan(peak-.1);
    expect(game.player.vy).toBeLessThan(0);
    expect(game.player.grounded).toBe(false);
  });
});
