import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createExtension } from "../src/extensions/create";
import { diagnoseExtensions } from "../src/extensions/diagnose";
import { repairExtension } from "../src/extensions/repair";
import { readExtensionRegistry, writeExtensionRegistry } from "../src/extensions/registry";
import type { ChecksumEnvironment } from "../src/extensions/registry";
import type { TargetFileEnvironment } from "../src/extensions/create";

function realRegistryEnv(dir: string): ChecksumEnvironment {
  const path = join(dir, "extensions.json");
  return {
    read: () => (existsSync(path) ? readFileSync(path, "utf8") : ""),
    write: (contents: string) => {
      mkdirSync(dir, { recursive: true });
      writeFileSync(path, contents);
    },
  };
}

function realTargetEnv(dir: string): TargetFileEnvironment {
  return {
    read: (path: string) => {
      const full = join(dir, path);
      return existsSync(full) ? readFileSync(full, "utf8") : "";
    },
    write: (path: string, content: string) => {
      const full = join(dir, path);
      mkdirSync(join(full, ".."), { recursive: true });
      writeFileSync(full, content);
    },
  };
}

describe("AC-134 — repair moves the divergent one to quarantine and restores the original", () => {
  // TRACEABILITY: US-081 FR-083 FR-084 FR-085 NFR-081 NFR-082 AC-134
  it("for real in a temp directory: create, diverge, repair", () => {
    const root = mkdtempSync(join(tmpdir(), "crs-ext-"));
    const registryEnv = realRegistryEnv(join(root, ".maestro"));
    const targetEnv = realTargetEnv(root);

    const created = createExtension({
      category: "extension",
      name: "my-extension",
      target: "my-hook",
      content: "# original content",
      registryEnv,
      targetEnv,
      managedHooks: [],
    });
    expect(created.ok).toBe(true);

    const realTarget = ".maestro/extensions/my-hook.md";
    const divergentContent = targetEnv.read(realTarget).replace("# original content", "# someone edited this by hand");
    targetEnv.write(realTarget, divergentContent);

    const registry = readExtensionRegistry(registryEnv);
    const divergent = diagnoseExtensions(registry, targetEnv, []);
    expect(divergent).toHaveLength(1);

    const quarantineDir = join(root, ".maestro", "quarantine");
    const result = repairExtension(divergent[0], {
      registry,
      targetEnv,
      quarantineEnv: {
        write: (name: string, content: string) => {
          mkdirSync(quarantineDir, { recursive: true });
          writeFileSync(join(quarantineDir, name), content);
        },
      },
    });

    expect(result.ok).toBe(true);
    expect(existsSync(quarantineDir)).toBe(true);
    expect(readdirSync(quarantineDir).length).toBeGreaterThan(0);
    expect(targetEnv.read(realTarget)).toContain("# original content");

    const finalRegistry = readExtensionRegistry(registryEnv);
    expect(diagnoseExtensions(finalRegistry, targetEnv, [])).toHaveLength(0);
  });
});
