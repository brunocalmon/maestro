import { describe, it, expect } from "vitest";
import { detectBackends } from "../src/backends/detect";
import { sourceFake } from "./backends-fixtures";

describe("AC-087 — version resolution never interprets --help", () => {
  // TRACEABILITY: FR-030 NFR-030 AC-087
  it("the only flag used is --version; --help is never consulted", () => {
    const { env, calls } = sourceFake({ claude: "2.1.251" });
    detectBackends(env);
    expect(calls.some((c) => c.kind === "version")).toBe(true);
    const usedKinds = new Set(calls.map((c) => c.kind));
    expect([...usedKinds].sort()).toEqual(["presence", "version"]);
  });
});
