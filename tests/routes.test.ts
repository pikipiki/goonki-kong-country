import { it, expect } from "vitest";
import { Game, emptyInput } from "../src/game/engine";
import { LEVELS } from "../src/game/levels";

it("allows every consecutive platform gap to be crossed using the real simulation", () => {
  const failures: string[] = [];
  for (const level of LEVELS) {
    if (level.biome === "lagoon" || level.biome === "ship") continue;
    const route = level.platforms
      .filter((p) => p.w >= 4)
      .sort((a, b) => a.x - b.x);
    for (let index = 0; index < route.length - 1; index++) {
      const from = route[index],
        to = route[index + 1],
        edge = from.x + from.w / 2,
        left = to.x - to.w / 2;
      if (left <= edge) continue;
      let reachable = false;
      for (const active of [0, 1])
        for (const offset of [0.12, 0.4, 0.9, 1.5])
          for (const startTime of [0, 1.5, 3, 4.5]) {
            if (reachable) continue;
            const game = new Game();
            game.start(level.id);
            game.enemies = [];
            game.time = startTime;
            game.level.barrels.forEach((_, i) => game.usedBarrels.add(i));
            Object.assign(game.player, {
              x: edge - offset,
              y: game.surface(from),
              vx: level.biome === "mine" ? 8.5 : 5.625 * (active ? 1.125 : 1),
              active,
              grounded: true,
            });
            const input = emptyInput();
            input.held.add("right");
            input.held.add("run");
            input.held.add("jump");
            input.pressed.add("jump");
            for (let frame = 0; frame < 100; frame++) {
              game.update(input);
              if (game.lives < 5) break;
              if (
                game.player.grounded &&
                game.player.x >= left - 0.29 &&
                game.player.x < to.x + to.w / 2 + 0.3 &&
                Math.abs(game.player.y - game.surface(to)) < 0.2
              ) {
                reachable = true;
                break;
              }
            }
          }
      if (!reachable)
        failures.push(
          `${level.id}: ${from.x} → ${to.x} (gap ${left - edge})`,
        );
    }
  }
  expect(failures).toEqual([]);
});
