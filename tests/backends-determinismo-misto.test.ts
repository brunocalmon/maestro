import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { sourceFake } from "./backends-fixtures";

const fullEnv = {
  resolveNpm: () => "1.0.0",
  resolveLocalPython: () => "1.0.0",
  resolveOnPath: () => "1.0.0",
};

describe("AC-088 — injected detection is deterministic in a full mixed scenario", () => {
  // TRACEABILITY: US-031 US-032 FR-032 FR-033 NFR-031 NFR-032 AC-088
  it("the same injected source produces the same result across two runs", () => {
    const scenario = () => sourceFake({ pi: "0.84.3", dsh: "0.1.1-rc.1" }).env;
    const first = inspectDependencies(fullEnv, undefined, scenario());
    const second = inspectDependencies(fullEnv, undefined, scenario());

    const agentsA = first.results.filter((d) => d.layer === "agent");
    const agentsB = second.results.filter((d) => d.layer === "agent");
    expect(agentsA).toEqual(agentsB);
    expect(first.exitCode).toBe(0);
    expect(second.exitCode).toBe(0);

    const codex = agentsA.find((d) => d.name === "codex");
    expect(codex?.present).toBe(false);
  });
});
