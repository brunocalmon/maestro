import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project } from "./aprovacao-fixtures";

describe("AC-115 — refusing writes nothing and runs nothing", () => {
  // TRACEABILITY: US-071 FR-071 FR-073 AC-115
  it("a refused command stays pending on the next run, never silently ends up approved", () => {
    const root = project();
    const throwingExecutor = (): never => {
      throw new Error("shouldn't run");
    };

    const first = runSetup({
      env: detectEnvironment(root),
      root,
      write: true,
      skills: { execute: throwingExecutor },
      approval: { source: { ask: () => false } },
    });
    expect(first.exitCode).not.toBe(0);

    let seenCommands: { bin: string; args: string[] }[] = [];
    runSetup({
      env: detectEnvironment(root),
      root,
      write: true,
      skills: { execute: throwingExecutor },
      approval: {
        source: {
          ask: (_hooks: unknown, commands: { bin: string; args: string[] }[]) => {
            seenCommands = commands ?? [];
            return false;
          },
        },
      },
    });

    expect(seenCommands.length).toBeGreaterThan(0);
  });
});
