import { describe, it, expect } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { backfillConfigFile } from "../src/config/write";

function mktemp(): string {
  return mkdtempSync(join(tmpdir(), "maestro-config-backfill-"));
}

function writeExisting(root: string, content: string): string {
  const dir = join(root, ".maestro");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "config.yaml");
  writeFileSync(path, content);
  return path;
}

const COMPLETE_YAML = `language:
  default: en_US
  exceptions: []
project:
  prog_lang: ""
  runtime: ""
  package_manager: ""
  framework: ""
  test_framework: ""
  documentation_style: wiki
system:
  os: linux
  distro: ""
  ram_gb: null
  cpu: ""
  gpu: ""
  baremetal: null
  container: null
git:
  default: ignored
  groups:
    common_rules_config:
      description: ""
      paths: [".maestro/config.yaml"]
      ignored: false
    common_rules_state:
      description: ""
      paths: []
      ignored: true
    framework:
      description: ""
      paths: []
      ignored: false
    installed_skills:
      description: ""
      paths: []
      ignored: true
    code_review_graph:
      description: ""
      paths: []
      ignored: true
    context_mode:
      description: ""
      paths: []
      ignored: true
`;

describe("AC-004 — setup doesn't overwrite a value the person already edited", () => {
  // TRACEABILITY: US-001 FR-005 FR-008 NFR-001 AC-004
  it("keeps a manually edited value after running again", () => {
    const root = mktemp();
    const path = writeExisting(root, COMPLETE_YAML);
    backfillConfigFile(root);
    backfillConfigFile(root);
    const content = readFileSync(path, "utf8");
    expect(content).toContain("documentation_style: wiki");
  });
});

describe("AC-005 — a new schema key is added without touching existing ones", () => {
  // TRACEABILITY: US-001 FR-008 NFR-001 AC-005
  it("backfills a missing schema key while preserving existing ones", () => {
    const root = mktemp();
    const withoutInstalledSkills = COMPLETE_YAML.replace(
      /    installed_skills:\n      description: ""\n      paths: \[\]\n      ignored: true\n/,
      "",
    );
    const path = writeExisting(root, withoutInstalledSkills);
    backfillConfigFile(root);
    const content = readFileSync(path, "utf8");
    expect(content).toContain("installed_skills:");
    expect(content).toContain("documentation_style: wiki");
  });
});

describe("AC-006 — backfill is idempotent over an already-complete file", () => {
  // TRACEABILITY: US-001 FR-008 NFR-001 NFR-002 AC-006
  it("produces byte-identical content on a second run", () => {
    const root = mktemp();
    const path = writeExisting(root, COMPLETE_YAML);
    backfillConfigFile(root);
    const first = readFileSync(path, "utf8");
    backfillConfigFile(root);
    const second = readFileSync(path, "utf8");
    expect(second).toBe(first);
  });
});
