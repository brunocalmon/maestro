import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { isMaestroEntry } from "../src/hooks/identity";
import { claudeEnv, project, readSettings } from "./helpers-spec-0022";

describe("AC-006 — identidade reconhecida pelo caminho, não pelo matcher", () => {
  // SPECSFY: US-001 FR-002 NFR-001 AC-006
  it("reconhece pelo command e registra o mesmo nome e evento no install.json", () => {
    expect(isMaestroEntry({ matcher: "Bash", hooks: [{ type: "command", command: '"$CLAUDE_PROJECT_DIR/.maestro/hooks/guard-secrets.sh"' }] })).toBe("guard-secrets");
    expect(isMaestroEntry({ matcher: "qualquer-coisa", hooks: [{ type: "command", command: '"$CLAUDE_PROJECT_DIR/.maestro/hooks/guard-secrets.sh"' }] })).toBe("guard-secrets");
    expect(isMaestroEntry({ matcher: "guard-secrets", hooks: [{ type: "command", command: "echo ok" }] })).toBeNull();

    const root = project();
    runSetup({ env: claudeEnv, root, write: true });
    const settings = readSettings(root);
    const record = JSON.parse(readFileSync(resolve(root, ".maestro", "install.json"), "utf8")) as { hooks: { name: string; event: string; path?: string }[] };
    const recognized = new Map<string, string>();
    for (const [event, entries] of Object.entries(settings.hooks)) {
      for (const e of entries) { const n = isMaestroEntry(e); if (n) recognized.set(n, event); }
    }
    for (const h of record.hooks.filter((h) => h.path?.startsWith(".maestro/hooks/"))) {
      expect(recognized.get(h.name), h.name).toBe(h.event);
    }
    expect(recognized.size).toBeGreaterThanOrEqual(4);
  });
});
