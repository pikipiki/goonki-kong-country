import { describe, expect, it } from "vitest";
import { resolveAudioEffectId } from "../src/game/audio";

describe("Rev 2 audio effect routing", () => {
  it("maps lagoon jumps to swim SFX only when inWater", () => {
    expect(resolveAudioEffectId("jump", { character: 1, inWater: true })).toBe(0x75);
    expect(resolveAudioEffectId("jump", { character: 0, inWater: true })).toBe(0x76);
    expect(resolveAudioEffectId("jump", { character: 0, inWater: false })).toBeUndefined();
  });

  it("keeps mount jump overrides", () => {
    expect(resolveAudioEffectId("jump", { animal: "enguarde", inWater: true })).toBe(0x57);
    expect(resolveAudioEffectId("jump", { animal: "rambi" })).toBe(0x5f);
  });
});
