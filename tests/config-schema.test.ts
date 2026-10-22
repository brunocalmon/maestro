import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildDefaultConfig, SCHEMA_KEYS } from "../src/config/schema";
import { backfillConfigFile } from "../src/config/write";

const FORBIDDEN_KEY_TERMS = ["token", "secret", "password", "credential"];

describe("AC-001 — setup creates a complete config.yaml for a new project", () => {
  // TRACEABILITY: US-001 FR-001 FR-002 FR-003 FR-004 NFR-001 NFR-003 AC-001
  it("has every top-level section present", () => {
    const doc = buildDefaultConfig({ platform: () => "linux" });
    expect(Object.keys(doc).sort()).toEqual(["git", "language", "maestro", "project", "system"]);
  });

  // TRACEABILITY: US-001 FR-001 FR-002 FR-003 FR-004 NFR-001 NFR-003 AC-001
  it("omits no key declared by the schema", () => {
    const doc = buildDefaultConfig({ platform: () => "linux" });
    for (const path of SCHEMA_KEYS) {
      const segments = path.split(".");
      let cursor: unknown = doc;
      for (const segment of segments) {
        expect(cursor && typeof cursor === "object" && segment in (cursor as object)).toBe(true);
        cursor = (cursor as Record<string, unknown>)[segment];
      }
    }
  });

  // TRACEABILITY: US-001 FR-001 FR-002 FR-003 FR-004 NFR-001 NFR-003 AC-001
  it("never names a secret, token, password or credential key", () => {
    const flatten = (value: unknown, out: string[]): void => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const [key, nested] of Object.entries(value)) {
          out.push(key.toLowerCase());
          flatten(nested, out);
        }
      }
    };
    const names: string[] = [];
    flatten(buildDefaultConfig({ platform: () => "linux" }), names);
    for (const name of names) {
      for (const term of FORBIDDEN_KEY_TERMS) {
        expect(name.includes(term)).toBe(false);
      }
    }
  });
});

describe("AC-002 — real language and git-tracking defaults are already populated", () => {
  // TRACEABILITY: US-001 FR-002 FR-003 NFR-001 NFR-003 AC-002
  it("starts with no language exceptions", () => {
    const doc = buildDefaultConfig({ platform: () => "linux" });
    expect(doc.language.exceptions).toEqual([]);
  });

  // TRACEABILITY: US-001 FR-002 FR-003 NFR-001 NFR-003 AC-002
  it("pre-populates git groups with the confirmed ignored flags", () => {
    const doc = buildDefaultConfig({ platform: () => "linux" });
    expect(doc.git.groups.common_rules_config.ignored).toBe(false);
    expect(doc.git.groups.common_rules_state.ignored).toBe(true);
    expect(doc.git.groups.installed_skills.ignored).toBe(true);
  });
});

describe("AC-003 — a field with no available evidence stays empty, never absent", () => {
  // TRACEABILITY: US-001 FR-001 FR-003 FR-004 NFR-001 NFR-003 AC-003
  it("leaves code-review-graph and context-mode groups with empty paths", () => {
    const doc = buildDefaultConfig({ platform: () => "linux" });
    expect(doc.git.groups.code_review_graph.paths).toEqual([]);
    expect(doc.git.groups.context_mode.paths).toEqual([]);
    expect(doc.git.groups.code_review_graph.ignored).toBe(true);
    expect(doc.git.groups.context_mode.ignored).toBe(true);
  });

  // TRACEABILITY: US-001 FR-001 FR-003 FR-004 NFR-001 NFR-003 AC-003
  it("leaves unmapped project fields as empty text, not absent", () => {
    const doc = buildDefaultConfig({ platform: () => "linux" });
    expect(doc.project.package_manager).toBe("");
    expect(doc.project.framework).toBe("");
    expect(doc.project.documentation_style).toBe("");
  });

  // TRACEABILITY: US-001 FR-001 FR-003 FR-004 NFR-001 NFR-003 AC-003
  it("fills system.os from the platform and leaves the rest empty", () => {
    const doc = buildDefaultConfig({ platform: () => "linux" });
    expect(doc.system.os).toBe("linux");
    expect(doc.system.distro).toBe("");
    expect(doc.system.cpu).toBe("");
    expect(doc.system.gpu).toBe("");
    expect(doc.system.ram_gb).toBeNull();
    expect(doc.system.baremetal).toBeNull();
    expect(doc.system.container).toBeNull();
  });
});

describe("AC-004 — the default config.yaml no longer forces docs/ into pt_BR", () => {
  // TRACEABILITY: US-001 FR-002 AC-004
  it("keeps docs language under the configured default", () => {
    const doc = buildDefaultConfig({ platform: () => "linux" });
    expect(doc.language.exceptions).toEqual([]);
  });

  // TRACEABILITY: US-001 FR-002 AC-004
  it("has no language exceptions by default", () => {
    const doc = buildDefaultConfig({ platform: () => "linux" });
    expect(doc.language.exceptions).toHaveLength(0);
  });
});

describe("AC-005 — a person's customized exception is never overwritten by setup", () => {
  // TRACEABILITY: FR-002 US-001 AC-005
  it("preserves a hand-added docs/ exception across a rerun of backfillConfigFile", () => {
    const root = mkdtempSync(join(tmpdir(), "maestro-config-docs-exception-"));
    const path = join(root, ".maestro", "config.yaml");
    mkdirSync(join(root, ".maestro"), { recursive: true });
    writeFileSync(
      path,
      [
        "language:",
        "  default: en_US",
        "  exceptions:",
        "    - id: framework_specs",
        "      paths: [specs/**/spec.md]",
        "      language: pt_BR",
        "      reason: upstream validator",
        "    - id: my_custom_docs_exception",
        "      paths: [docs/**/*.md]",
        "      language: es_ES",
        "      reason: a pessoa escolheu manter docs em espanhol",
        "",
      ].join("\n"),
      "utf8",
    );

    backfillConfigFile(root);

    const after = readFileSync(path, "utf8");
    expect(after).toMatch(/my_custom_docs_exception/);
    expect(after).toMatch(/es_ES/);
  });
});
