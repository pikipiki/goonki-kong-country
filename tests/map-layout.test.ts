import { describe, expect, it } from "vitest";
import { romMapLayout } from "../src/mapLayout";

const nodes = [[54,76],[114,82],[108,126],[60,148],[148,146],[136,188],[216,182]];
describe("fullscreen ROM map framing", () => {
  for (const [width, height] of [[390,844],[320,640],[844,390],[1000,900]]) {
    it(`keeps all seven named destinations visible and apart at ${width}x${height}`, () => {
      const map = romMapLayout(width, height);
      const buttonWidth = width > height && height <= 560 ? 150 : 138;
      expect(map.labels).toHaveLength(7);
      for (let i = 0; i < 7; i++) {
        const label = map.labels[i];
        expect(label.x - buttonWidth / 2).toBeGreaterThanOrEqual(0);
        expect(label.x + buttonWidth / 2).toBeLessThanOrEqual(width);
        expect(label.y - 24).toBeGreaterThan(50);
        expect(label.y + 22).toBeLessThan(height - (height > width ? 130 : 82));
        const [x,y] = nodes[i];
        expect(map.offsetX + x * map.scale).toBeGreaterThan(0);
        expect(map.offsetX + x * map.scale).toBeLessThan(width);
        expect(map.offsetY + y * map.scale).toBeGreaterThan(0);
        expect(map.offsetY + y * map.scale).toBeLessThan(height);
        for (const other of map.labels.slice(i + 1)) {
          expect(Math.abs(label.x-other.x) >= buttonWidth || Math.abs(label.y-other.y) >= 46).toBe(true);
        }
      }
    });
  }
});
