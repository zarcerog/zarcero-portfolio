import { describe, expect, it } from "vitest";

import { telegraphese } from "./telegraph";

describe("telegraphese", () => {
  it("turns full stops into STOP and shouts", () => {
    expect(telegraphese("Have a project in mind. Would like to talk.")).toBe("HAVE A PROJECT IN MIND STOP WOULD LIKE TO TALK STOP");
  });

  it("tidies whitespace", () => {
    expect(telegraphese("  hello   there!  ")).toBe("HELLO THERE STOP");
  });
});
