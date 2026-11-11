import { describe, expect, it } from "vitest";
import {
  ANTICIPATION_MS,
  STRIDE_MS,
  gaitAt,
  surfaceAt,
} from "@/components/migo/gait";
import {
  canSoundContact,
  type ContactPolicy,
} from "@/components/audio/contact";

describe("Migo's two-pose stepping", () => {
  it("anticipates without traveling and alternates left/right artwork", () => {
    expect(gaitAt(100).offset).toBe(0);
    expect(gaitAt(100).contact).toBe(false);
    expect(gaitAt(ANTICIPATION_MS + 400).frame).toBe(0);
    expect(gaitAt(ANTICIPATION_MS + STRIDE_MS + 400).frame).toBe(1);
  });
  it("holds travel stationary through each contact window", () => {
    const contact = gaitAt(ANTICIPATION_MS + 400);
    expect(contact.contact).toBe(true);
    expect(gaitAt(ANTICIPATION_MS + 510).offset).toBe(contact.offset);
  });
  it("eases travel in and out, never jumps at a stride boundary", () => {
    const before = gaitAt(ANTICIPATION_MS + STRIDE_MS - 1).offset;
    expect(gaitAt(ANTICIPATION_MS + STRIDE_MS).offset).toBe(before);
    expect(gaitAt(ANTICIPATION_MS + 1).offset).toBeLessThan(0.01);
  });
  it("selects only an appropriate surface", () => {
    expect(surfaceAt("/ships", true)).toBe("cabin");
    expect(surfaceAt("/ships")).toBe("deck");
    expect(surfaceAt("/excursions/coz-beach")).toBe("sand");
  });
});

describe("foot-contact sound safeguards", () => {
  const allowed: ContactPolicy = {
    enabled: true,
    character: true,
    footsteps: true,
    volume: 0.6,
    reduced: false,
    hidden: false,
    checkout: false,
    docked: false,
  };
  it("permits a real contact only when explicitly enabled", () => {
    expect(canSoundContact(allowed, "deck")).toBe(true);
    expect(canSoundContact({ ...allowed, enabled: false }, "deck")).toBe(false);
  });
  for (const flag of ["reduced", "hidden", "checkout", "docked"] as const) {
    it(`suppresses contacts while ${flag}`, () =>
      expect(canSoundContact({ ...allowed, [flag]: true }, "deck")).toBe(
        false,
      ));
  }
  it("respects character mute, footstep mute, zero volume and underwater silence", () => {
    expect(canSoundContact({ ...allowed, character: false }, "deck")).toBe(
      false,
    );
    expect(canSoundContact({ ...allowed, footsteps: false }, "sand")).toBe(
      false,
    );
    expect(canSoundContact({ ...allowed, volume: 0 }, "cabin")).toBe(false);
    expect(canSoundContact(allowed, "underwater")).toBe(false);
  });
});
