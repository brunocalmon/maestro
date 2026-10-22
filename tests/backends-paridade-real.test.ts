import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { detectBackends, realBackendEnvironment } from "../src/backends/detect";
import { SUPPORTED_AGENT_BACKENDS } from "../src/backends/known";

const onPath = (name: string): boolean => {
  try {
    execFileSync("which", [name], { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
};

describe("AC-085 — parity between the real source and the machine", () => {
  // TRACEABILITY: US-032 NFR-032 AC-085
  it("the real source resolves what's actually installed", () => {
    const result = detectBackends(realBackendEnvironment());
    for (const name of SUPPORTED_AGENT_BACKENDS) {
      const entry = result.find((r) => r.name === name);
      expect(entry?.present).toBe(onPath(name));
    }
  });

  // TRACEABILITY: NFR-032 AC-085
  it("claude's version, whose real output has parentheses, comes out clean", () => {
    if (!onPath("claude")) return;
    const entry = detectBackends(realBackendEnvironment()).find((r) => r.name === "claude");
    expect(entry?.version).toMatch(/^\d/);
    expect(entry?.version).not.toMatch(/[()]/);
  });
});
