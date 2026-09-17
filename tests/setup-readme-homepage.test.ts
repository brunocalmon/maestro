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

describe("AC-007 — a missing README gets a generic placeholder, never maestro's own content", () => {
  // SPECSFY: US-002 FR-003 AC-007
  test("does not mention maestro, its package name or its own commands", () => {
    const root = mkdtempSync(join(tmpdir(), "maestro-test-readme-generic-"));
    mkdirSync(join(root, "docs"), { recursive: true });

    ensureReadmeHomepage(root);

    const content = readFileSync(join(root, "README.md"), "utf8").toLowerCase();
    expect(content).not.toContain("maestro");
    expect(content).not.toContain("@brunocalmon");
    expect(content).not.toContain("specsfy");
  });

  // SPECSFY: US-002 FR-003 AC-007
  test("still points to docs/README.md as the index and warns that title/description are pending", () => {
    const root = mkdtempSync(join(tmpdir(), "maestro-test-readme-generic-index-"));
    mkdirSync(join(root, "docs"), { recursive: true });

    ensureReadmeHomepage(root);

    const content = readFileSync(join(root, "README.md"), "utf8");
    expect(content).toContain("docs/README.md");
    expect(content.toLowerCase()).toMatch(/fill in the (project )?(title|name) and description/);
  });
});

describe("AC-008 — an existing README is never replaced by the generic placeholder", () => {
  // SPECSFY: US-002 FR-003 AC-008
  test("keeps the project's own content untouched", () => {
    const root = mkdtempSync(join(tmpdir(), "maestro-test-readme-preserve-"));
    mkdirSync(join(root, "docs"), { recursive: true });
    const path = join(root, "README.md");
    writeFileSync(path, "# My Own Project\n\nThis is my project's own README.\n", "utf8");

    ensureReadmeHomepage(root);

    expect(readFileSync(path, "utf8")).toBe("# My Own Project\n\nThis is my project's own README.\n");
  });
});

describe("AC-009 — malformed links in an existing README are still sanitized", () => {
  // SPECSFY: US-002 FR-003 AC-009
  test("old-style docs/ links are normalized without touching the rest of the content", () => {
    const root = mkdtempSync(join(tmpdir(), "maestro-test-readme-sanitize-only-"));
    mkdirSync(join(root, "docs"), { recursive: true });
    const path = join(root, "README.md");
    writeFileSync(path, "# Real Project\n[Architecture](/docs/architecture.md)\n", "utf8");

    ensureReadmeHomepage(root);

    const content = readFileSync(path, "utf8");
    expect(content).toBe("# Real Project\n[Architecture](docs/architecture.md)\n");
  });
});
