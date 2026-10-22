import { describe, it, expect } from "vitest";
import { resolveChannel } from "../src/approval/context";
import { fixedContext } from "./aprovacao-fixtures";

describe("AC-064 — without a terminal, the decision comes from the document", () => {
  // TRACEABILITY: US-061 FR-061 AC-064
  it("the chosen channel is the document one", () => {
    expect(resolveChannel(fixedContext(false))).toBe("document");
  });

  // TRACEABILITY: US-061 FR-061 AC-064
  it("absence of a terminal never results in the interactive channel", () => {
    expect(resolveChannel(fixedContext(false))).not.toBe("interactive");
  });

  // TRACEABILITY: US-061 FR-061 AC-064
  it("the choice is deterministic for the same context", () => {
    const ctx = fixedContext(false);
    expect(resolveChannel(ctx)).toBe(resolveChannel(ctx));
  });
});
