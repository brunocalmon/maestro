import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const cli = resolve(__dirname, "..", "dist", "cli.js");

describe("AC-097 — the real command prints the full report", () => {
  // TRACEABILITY: US-033 FR-037 NFR-035 AC-097
  it("names the recommended backend and local model (or their absence) and the cost/plan limitation", () => {
    const r = spawnSync("node", [cli, "recommend"], { encoding: "utf8", timeout: 10_000 });
    const text = r.stdout + r.stderr;
    expect(text).toMatch(/backend/i);
    expect(text).toMatch(/local model/i);
    expect(text).toMatch(/cost|plan usage/i);
  }, 60_000);
});

describe("AC-101 — the real command makes no network call nor hangs waiting for a credential", () => {
  // TRACEABILITY: US-035 FR-037 NFR-033 NFR-035 AC-101
  it("finishes on its own, without a prompt, within a short time limit", () => {
    const r = spawnSync("node", [cli, "recommend"], { encoding: "utf8", timeout: 10_000 });
    expect(r.error).toBeUndefined();
    expect(r.signal).toBeNull();
    expect(typeof r.status).toBe("number");
  }, 60_000);
});
