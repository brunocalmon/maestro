import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { sourceFake } from "./backends-fixtures";

const fullEnv = {
  resolveNpm: () => "1.0.0",
  resolveLocalPython: () => "1.0.0",
  resolveOnPath: () => "1.0.0",
};

describe("AC-086 — supported, unsupported and absent coexist in the same report", () => {
  // TRACEABILITY: US-031 FR-031 FR-033 NFR-031 AC-086
  it("pi present and supported, dsh present and unsupported, agy absent", () => {
    const { env: backendEnv } = sourceFake({ pi: "0.84.3", dsh: "0.1.1-rc.1" });
    const r = inspectDependencies(fullEnv, undefined, backendEnv);
    const agents = r.results.filter((d) => d.layer === "agent");
    const pi = agents.find((d) => d.name === "pi");
    const dsh = agents.find((d) => d.name === "dsh");
    const agy = agents.find((d) => d.name === "agy");
    expect(pi?.present).toBe(true);
    expect(pi?.supported).toBe(true);
    expect(dsh?.present).toBe(true);
    expect(dsh?.supported).toBe(false);
    expect(agy?.present).toBe(false);
    expect(r.exitCode).toBe(0);
  });
});
