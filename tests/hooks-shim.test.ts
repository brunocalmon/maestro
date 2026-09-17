import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { buildDispatchCommand } from "../src/hooks/shim";
import { executable } from "./helpers-spec-0022";

const run = (command: string, extraPath = "") =>
  spawnSync("/bin/sh", ["-c", command], { input: "{}", encoding: "utf8", timeout: 10_000, env: { ...process.env, PATH: `${extraPath}:${process.env.PATH ?? ""}` } });

describe("AC-017 — shim usa o caminho gravado quando ele existe", () => {
  // SPECSFY: US-004 FR-008 AC-017
  it("executa o binário gravado mesmo com homônimo no PATH", () => {
    const recorded = executable("ctxbin", 'echo recorded; exit 0');
    const other = executable("ctxbin", 'echo frompath; exit 0');
    const r = run(buildDispatchCommand("ctxbin", recorded, ["hook", "claude-code", "pretooluse"]), dirname(other));
    expect(r.stdout.trim()).toBe("recorded");
    expect(r.status).toBe(0);
  });
});

describe("AC-018 — shim cai para PATH após rename ou move", () => {
  // SPECSFY: US-004 FR-008 AC-018
  it("resolve pelo PATH quando o caminho gravado não existe e propaga o exit code", () => {
    const gone = join(mkdtempSync(join(tmpdir(), "spec0022-gone-")), "ctxbin");
    const fromPath = executable("ctxbin", 'echo frompath; exit 3');
    const r = run(buildDispatchCommand("ctxbin", gone, ["hook"]), dirname(fromPath));
    expect(r.stdout.trim()).toBe("frompath");
    expect(r.status).toBe(3);
  });
});

describe("AC-019 — sem binário em lugar nenhum: mensagem clara e não bloqueante", () => {
  // SPECSFY: US-004 FR-008 AC-019
  it("nomeia o binário ausente em stderr e termina com exit 0", () => {
    const gone = join(mkdtempSync(join(tmpdir(), "spec0022-gone-")), "ctxbin-inexistente");
    const r = spawnSync("/bin/sh", ["-c", buildDispatchCommand("ctxbin-inexistente", gone, ["hook"])], { input: "{}", encoding: "utf8", timeout: 10_000, env: { PATH: "/nonexistent" } });
    expect(r.status).toBe(0);
    expect(r.stderr).toContain("ctxbin-inexistente");
    expect(r.stderr).toMatch(/maestro setup/);
  });
});
