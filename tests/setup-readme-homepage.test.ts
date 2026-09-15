import { describe, test, expect } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ensureReadmeHomepage, sanitizeRootReadmeLinks, sanitizeDocBackLinks } from "../src/setup/readme.js";

describe("Root README Homepage and Docs Relative Links Sanitization", () => {
  test("sanitizeRootReadmeLinks converts file URIs, leading slashes, and bare directory links to docs/", () => {
    const input = "[architecture](file:///home/user/project/docs/architecture.md) and [database](/docs/database.md) and [./docs/](./docs/)";
    const sanitized = sanitizeRootReadmeLinks(input);
    expect(sanitized).toBe("[architecture](docs/architecture.md) and [database](docs/database.md) and [docs/README.md](docs/README.md)");
  });

  test("sanitizeDocBackLinks converts root-relative or file URIs to ../README.md and removes ./ prefix", () => {
    const input = "[Homepage](file:///home/user/project/README.md) and [Back](/README.md) and [Decisions](./decisions.md)";
    const sanitized = sanitizeDocBackLinks(input);
    expect(sanitized).toBe("[Homepage](../README.md) and [Back](../README.md) and [Decisions](decisions.md)");
  });

  test("ensureReadmeHomepage creates root README.md with docs/ relative links when absent", () => {
    const root = mkdtempSync(join(tmpdir(), "maestro-test-readme-"));
    mkdirSync(join(root, "docs"), { recursive: true });

    ensureReadmeHomepage(root);

    const rootReadmePath = join(root, "README.md");
    expect(existsSync(rootReadmePath)).toBe(true);

    const content = readFileSync(rootReadmePath, "utf8");
    expect(content).toContain("[docs/README.md](docs/README.md)");
    expect(content).toContain("[docs/architecture.md](docs/architecture.md)");
    expect(content).not.toContain("file://");
    expect(content).not.toContain("(/docs/");
    expect(content).not.toContain("(./docs/");
  });

  test("ensureReadmeHomepage sanitizes invalid links in existing root README and docs files", () => {
    const root = mkdtempSync(join(tmpdir(), "maestro-test-readme-sanitize-"));
    const docsDir = join(root, "docs");
    mkdirSync(docsDir, { recursive: true });

    const rootReadmePath = join(root, "README.md");
    writeFileSync(rootReadmePath, "# Title\n[docs](/docs/architecture.md)", "utf8");

    const docPath = join(docsDir, "architecture.md");
    writeFileSync(docPath, "# Arch\n[Back](/README.md) and [Decisions](./decisions.md)", "utf8");

    ensureReadmeHomepage(root);

    const updatedRoot = readFileSync(rootReadmePath, "utf8");
    expect(updatedRoot).toBe("# Title\n[docs](docs/architecture.md)");

    const updatedDoc = readFileSync(docPath, "utf8");
    expect(updatedDoc).toBe("# Arch\n[Back](../README.md) and [Decisions](decisions.md)");
  });
});
