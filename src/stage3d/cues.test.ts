import { describe, expect, it } from "vitest";

import { BEATS, curtainAt, LINES, Q, ROOM, roomAt, roomCue, workCue } from "./cues";

describe("act II: one room at a time", () => {
  it("gives every room its own stretch of the stage, in order", () => {
    for (let i = 0; i < 4; i++) {
      const c = roomCue(i);
      expect(c.a).toBeLessThan(c.b);
      expect(c.b).toBeLessThan(c.c);
      expect(c.c).toBeLessThan(c.d);
      if (i > 0) expect(c.a).toBeGreaterThanOrEqual(roomCue(i - 1).d);
    }
  });

  it("finishes the last room before act III's card", () => {
    expect(roomCue(3).d).toBeLessThanOrEqual(Q.act3.card[0]);
    expect(ROOM.first).toBeGreaterThan(Q.act2.card[0]);
  });

  it("knows which room is on stage", () => {
    expect(roomAt(roomCue(0).b + 0.5)).toBe(0);
    expect(roomAt(roomCue(2).b + 0.5)).toBe(2);
    expect(roomAt(roomCue(3).c)).toBe(3);
  });

  it("speaks two lines in each room, one after the other", () => {
    for (let i = 0; i < 4; i++) {
      expect(LINES[`room${i}`][3]).toBeLessThanOrEqual(LINES[`room${i}b`][0] + 0.01);
    }
  });
});

describe("the running order", () => {
  it("fits every act inside the performance", () => {
    expect(workCue(3).c).toBeLessThan(Q.interval.curtainClose[0]);
    expect(Q.finale.fin[1]).toBeLessThan(BEATS);
  });

  it("opens the curtain for the play and closes it for the interval and the bow", () => {
    expect(curtainAt(0)).toBe(0);
    expect(curtainAt(roomCue(1).b)).toBe(1);
    expect(curtainAt(Q.interval.menu[1])).toBe(0);
    expect(curtainAt(Q.act4.pins[0])).toBe(1);
    expect(curtainAt(Q.finale.bow[1])).toBe(0);
  });
});
