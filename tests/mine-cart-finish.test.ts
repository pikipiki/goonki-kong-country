import { describe, expect, it } from "vitest";
import { Game, emptyInput } from "../src/game/engine";
import { ROM_MINE_CART } from "../src/game/originalMineCart";

describe("ROM Mine Cart Carnage exit", () => {
  it("clears the level inside ExitDoor finish volume", () => {
    const game = new Game();
    game.start(2, true);
    game.enemies = [];
    const zone = ROM_MINE_CART.finishZone!;
    game.player.x = zone.x;
    game.player.y = zone.y;
    game.player.vx = 0;
    game.player.vy = 0;
    game.update(emptyInput());
    expect(game.phase).toBe("clear");
  });
});
