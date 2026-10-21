import { describe, expect, it } from "vitest";
import { Game, emptyInput } from "../src/game/engine";
import { ROM_CORAL } from "../src/game/originalCoral";

describe("ROM Coral Capers exit", () => {
  it("clears the level inside UnderwaterExitDoor finish volume", () => {
    const game = new Game();
    game.start(3, true);
    game.enemies = [];
    const zone = ROM_CORAL.finishZone!;
    game.player.x = zone.x;
    game.player.y = zone.y;
    game.player.vx = 0;
    game.player.vy = 0;
    game.update(emptyInput());
    expect(game.phase).toBe("clear");
  });
});
