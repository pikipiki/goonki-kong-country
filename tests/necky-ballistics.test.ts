import { describe, expect, it } from "vitest";
import necky from "../reference/necky-ballistics.json";

describe("necky ROM ballistics evidence", () => {
  it("pins nut template speeds from relocated Rev 2 bytes", () => {
    expect(necky.nutSpawnTemplate.vxRaw).toBe(-300);
    expect(necky.nutSpawnTemplate.vyRaw).toBe(768);
    expect(necky.engine.gravityRawPerFrame).toBe(-112);
    expect(necky.jungleHijinxsNutThrowingNecky.spawnRam11A1Frames).toBe(39);
  });
});
