import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { totalmem, freemem } from "node:os";
import { readCapacity } from "../src/models/capacity";
import { listOllamaModels } from "../src/models/ollama";

const hasOllama = (): boolean => {
  try {
    execFileSync("which", ["ollama"], { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
};

function realOllamaList(): string[] {
  const output = execFileSync("ollama", ["list"], { encoding: "utf8" });
  return output
    .split("\n")
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.split(/\s{2,}/)[0]);
}

describe("AC-099 — parity between the real source and the machine", () => {
  // TRACEABILITY: US-035 NFR-034 AC-099
  it("memory used matches os.freemem() and os.totalmem()", () => {
    const before = freemem();
    const capacity = readCapacity();
    const after = freemem();
    expect(capacity.totalBytes).toBe(totalmem());
    expect(capacity.freeBytes).toBeGreaterThanOrEqual(Math.min(before, after) * 0.9);
    expect(capacity.freeBytes).toBeLessThanOrEqual(Math.max(before, after) * 1.1);
  });

  // TRACEABILITY: US-035 NFR-034 AC-099
  it("local models match the real output of 'ollama list'", () => {
    if (!hasOllama()) return;
    const expected = realOllamaList();
    const snapshot = listOllamaModels();
    expect(snapshot.present).toBe(true);
    expect(snapshot.models.map((m) => m.name).sort()).toEqual(expected.sort());
  });
});
