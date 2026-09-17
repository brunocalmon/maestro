import { describe, it, expect } from "vitest";
import { installedHookCount } from "./helpers-spec-0022";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { readTrace } from "../src/telemetry/read";
import { project, FIXED_INSTANT } from "./trace-fixtures";

/** Source whose generator returns empty, an edge case from section 7. */
const emptySource = { now: () => FIXED_INSTANT, id: () => "" };

function record(): { root: string; rec: Record<string, unknown> } {
  const root = project();
  runSetup({ env: detectEnvironment(root), root, write: true, trace: emptySource });
  return { root, rec: JSON.parse(readFileSync(join(root, ".maestro", "install.json"), "utf8")) };
}

describe("Edge case — generator that returns an empty value", () => {
  // SPECSFY: US-040 FR-040 AC-040
  it("the field isn't written empty", () => {
    expect("trace" in record().rec).toBe(false);
  });

  // SPECSFY: US-040 FR-044 AC-047
  it("the read reports unidentified", () => {
    expect(readTrace(record().root).kind).toBe("unidentified");
  });

  // SPECSFY: US-040 FR-040 AC-040
  it("the rest of the record remains", () => {
    const { rec } = record();
    expect((rec["hooks"] as unknown[]).length).toBe(installedHookCount());
    for (const h of rec["hooks"] as { installedAt: string }[]) expect(h.installedAt).toBe(FIXED_INSTANT);
  });
});
