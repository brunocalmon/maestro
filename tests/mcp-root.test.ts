import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { validateRoot } from "../src/mcp/root";
import { disposableProject, emptyDirectory } from "./mcp-fixtures";

describe("AC-011 — a path that doesn't exist is refused", () => {
  const missing = join(emptyDirectory(), "does-not-exist", "not-even-a-bit");

  // TRACEABILITY: US-002 FR-003 AC-011
  it("refuses the path", () => {
    expect(validateRoot(missing).ok).toBe(false);
  });

  // TRACEABILITY: US-002 FR-006 AC-011
  it("states the path wasn't found", () => {
    const r = validateRoot(missing);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/not found/i);
  });

  // TRACEABILITY: US-002 NFR-001 AC-011
  it("doesn't create any directory to accommodate it", () => {
    validateRoot(missing);
    expect(existsSync(missing)).toBe(false);
  });
});

describe("AC-012 — a relative path is refused", () => {
  // TRACEABILITY: US-002 FR-003 AC-012
  it("refuses instead of resolving against some base", () => {
    expect(validateRoot("./some/project").ok).toBe(false);
  });

  // TRACEABILITY: US-002 FR-002 AC-012
  it("asks for an absolute path in the explanation", () => {
    const r = validateRoot("./some/project");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/absolut/i);
  });

  // TRACEABILITY: US-002 NFR-003 AC-012
  it("refuses even when the relative path would exist from the working directory", () => {
    // The name is chosen to exist under the valid root, so resolving
    // against the working directory would produce a plausible, silent write.
    const root = disposableProject();
    expect(existsSync(join(root, ".claude"))).toBe(true);
    expect(validateRoot(".claude").ok).toBe(false);
  });
});

describe("AC-003 — validation accepts a real root and refuses a directory with no marker", () => {
  // TRACEABILITY: US-002 FR-003 AC-003
  it("accepts a root with a project marker", () => {
    expect(validateRoot(disposableProject()).ok).toBe(true);
  });

  // TRACEABILITY: US-002 FR-003 AC-003
  it("refuses a directory with no marker at all", () => {
    expect(validateRoot(emptyDirectory()).ok).toBe(false);
  });
});
