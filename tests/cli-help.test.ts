import { describe, it, expect } from "vitest";
import { run } from "../src/cli";

describe("AC-091 — every command documents its own usage", () => {
  // No entry point had any of this before: `maestro --help` and a
  // bare `maestro` both fell through to "unrecognized command", and
  // per-command --help wasn't checked at all — it silently fell through
  // parseFlags and ran the real command instead (the incident this whole
  // fatia guards against, reproduced running `setup --help` for real: it
  // wrote to disk instead of printing usage).
  // TRACEABILITY: US-060 FR-060 AC-091
  it("a bare invocation lists every command, refusing rather than succeeding silently", () => {
    const r = run([]);
    expect(r.exitCode).not.toBe(0);
    for (const c of ["version", "doctor", "setup", "recommend", "extension"]) expect(r.output).toContain(c);
  });

  // TRACEABILITY: US-060 FR-060 AC-091
  it("--help and -h at the top level both succeed and list every command", () => {
    for (const flag of ["--help", "-h"]) {
      const r = run([flag]);
      expect(r.exitCode).toBe(0);
      expect(r.output).toContain("setup");
    }
  });

  // TRACEABILITY: US-060 FR-060 AC-091
  it("setup --help documents --target without running setup", () => {
    const r = run(["setup", "--help"]);
    expect(r.exitCode).toBe(0);
    expect(r.output).toContain("--target");
    expect(r.output).not.toMatch(/hook.*installed|not written/);
  });

  // The exact incident: an unrecognized flag used to be silently dropped
  // and the real command ran anyway.
  // TRACEABILITY: US-060 FR-060 NFR-060 AC-091
  it("an unknown flag on setup is refused, not silently ignored", () => {
    const r = run(["setup", "--bogus", "whatever"]);
    expect(r.exitCode).not.toBe(0);
    expect(r.output).toMatch(/unrecognized/);
  });

  // TRACEABILITY: US-060 FR-060 AC-091
  it("doctor --help documents itself without running the real check", () => {
    const r = run(["doctor", "--help"]);
    expect(r.exitCode).toBe(0);
    expect(r.output).toMatch(/usage: maestro doctor/);
  });

  // TRACEABILITY: US-060 FR-060 AC-091
  it("recommend --help documents its flags", () => {
    const r = run(["recommend", "--help"]);
    expect(r.exitCode).toBe(0);
    expect(r.output).toContain("--backend");
    expect(r.output).toContain("--local-model");
  });

  // TRACEABILITY: US-060 FR-060 AC-091
  it("extension --help lists both subcommands", () => {
    const r = run(["extension", "--help"]);
    expect(r.exitCode).toBe(0);
    expect(r.output).toContain("create");
    expect(r.output).toContain("repair");
  });

  // TRACEABILITY: US-060 FR-060 AC-091
  it("extension create --help and extension repair --help each document their own flags", () => {
    const create = run(["extension", "create", "--help"]);
    expect(create.exitCode).toBe(0);
    expect(create.output).toContain("--category");

    const repair = run(["extension", "repair", "--help"]);
    expect(repair.exitCode).toBe(0);
    expect(repair.output).toContain("--name");
  });

  // TRACEABILITY: US-060 FR-060 AC-091
  it("version --help doesn't just print the version number", () => {
    const r = run(["version", "--help"]);
    expect(r.exitCode).toBe(0);
    expect(r.output).toMatch(/usage: maestro version/);
  });
});
