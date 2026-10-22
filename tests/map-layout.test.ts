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
        // Cover mode deliberately pans: only the focused node must stay
        // visible while every named destination remains selectable.
        const focused = romMapLayout(width, height, true, nodes[i]);
        const [x,y] = nodes[i];
        expect(focused.offsetX).toBeLessThanOrEqual(0);
        expect(focused.offsetY).toBeLessThanOrEqual(0);
        expect(focused.offsetX + 256*focused.scale).toBeGreaterThanOrEqual(width-.001);
        expect(focused.offsetY + 224*focused.scale).toBeGreaterThanOrEqual(height-.001);
        expect(focused.offsetX+x*focused.scale).toBeGreaterThan(0);
        expect(focused.offsetX+x*focused.scale).toBeLessThan(width);
        expect(focused.offsetY+y*focused.scale).toBeGreaterThan(60);
        expect(focused.offsetY+y*focused.scale).toBeLessThan(height-80);
        for (const other of map.labels.slice(i + 1)) {
          expect(Math.abs(label.x-other.x) >= buttonWidth || Math.abs(label.y-other.y) >= 46).toBe(true);
        }
      }
    });
  }
});
