import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Default root README content in English with `./docs/` relative links. */
const DEFAULT_ROOT_README = `# Maestro (\`@brunocalmon/maestro\`)

[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-green.svg)](https://nodejs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-yellow.svg)](https://vitest.dev/)
[![MCP](https://img.shields.io/badge/MCP-1.30-purple.svg)](https://modelcontextprotocol.io/)

A lightweight command-line wrapper and Model Context Protocol (MCP) server that orchestrates AI coding agents and development subsystems through a verifiable dependency contract.

Package: \`@brunocalmon/maestro\` | CLI Binary: \`maestro\` | MCP Binary: \`maestro-mcp\`

---

## Technical Documentation Index

All primary technical documentation is maintained in [docs/README.md](docs/README.md) in English (\`en_US\`). Use the index below to navigate the system design, architecture, schemas, and API contracts:

| Document | Description | Key Topics |
| --- | --- | --- |
| **[docs/README.md](docs/README.md)** | Technical Documentation Portal | Overview, system scope, reading roadmap |
| **[docs/architecture.md](docs/architecture.md)** | System Design & Architecture | 3-Layer dependency model, Mermaid system diagrams, security boundaries |
| **[docs/application.md](docs/application.md)** | Application & Source Modules | Domain mapping for all 45+ TypeScript modules in \`src/\` |
| **[docs/database.md](docs/database.md)** | Data Storage & File Schemas | File-based storage (\`.maestro/\`), schemas, Mermaid ER diagram |
| **[docs/decisions.md](docs/decisions.md)** | Architecture Decision Records (ADRs) | Key design decisions (\`SPEC-0001\` through \`SPEC-0019\`) and trade-offs |
| **[docs/flows.md](docs/flows.md)** | Execution Flows & Sequence | Mermaid sequence & state diagrams for \`setup\`, \`plan\`, \`run\`, and \`repair\` |
| **[docs/frontend.md](docs/frontend.md)** | CLI & Interface Architecture | Headless CLI design, atomic TTY reader, JSON stdin fallback |
| **[docs/integrations.md](docs/integrations.md)** | External Agent & Editor Integrations | Adapters (\`pi\`, \`agy\`, \`claude\`, \`codex\`, \`goose\`), Ollama API, Claude Code hooks |
| **[docs/testing.md](docs/testing.md)** | Test Suite & Quality Assurance | Vitest testing architecture, mock strategy, inventory of 200 test files |
| **[docs/packages.md](docs/packages.md)** | Dependencies & Package Inventory | Core production dependencies and complete npm package inventory |

---

## Core Features & Commands

| Command | Description |
| --- | --- |
| \`maestro --version\` | Prints the version declared in the package manifest. |
| \`maestro doctor\` | Reports subsystem dependencies, detected agent backends, installed skill sets, and extension drift. |
| \`maestro setup\` | Installs editor hooks, delivers skill sets, initializes Specsfy, and maintains \`.maestro/config.yaml\` and root \`README.md\`. |
| \`maestro recommend\` | Recommends an available agent backend and the optimal local Ollama model fitting free memory & context length. |
| \`maestro plan --task "..."\` | Generates a multi-agent orchestration plan requiring explicit human approval before persisting. |
| \`maestro run <execution-id>\` | Executes an approved plan by constructing briefs and spawning CLI agent subprocesses under individual gate approval. |
| \`maestro report <execution-id>\` | Renders structured telemetry metrics (duration, status, exit code) for an execution trace. |
| \`maestro extension create\` | Creates a local override/extension artifact (hook, rule, or router) that survives reinstalls. |
| \`maestro extension repair\` | Safely moves divergent extension content to \`.maestro/quarantine/\` and restores the registered version. |

---

## Architecture Principles

1. **3-Layer Dependency Hierarchy**:
   - **Local npm Subsystems** (\`@promovaweb/specsfy\`, \`context-mode\`): Pinned version, resolved from project local copy.
   - **Local Python Subsystems** (\`code-review-graph\`): Isolated in local project \`venv\`, installed via \`uv\` upon explicit approval.
   - **Agent CLI Backends** (\`pi\`, \`agy\`, \`claude\`, \`codex\`, \`goose\`): Detected dynamically in \`PATH\` by capability. Never installed by Maestro.
2. **Approval Gate Security**:
   - Every file modification or subprocess spawn requires prior explicit human approval (interactive TTY or JSON batch stdin).
   - Re-executions with exact binary and \`argv\` match use automatic registry bypass.
3. **Offline & Zero-Leak Telemetry**:
   - Deterministic model selection without remote network dependencies.
   - Telemetry records strictly capture metadata (\`duration_ms\`, \`exit_code\`, \`status\`) and **never** capture \`stdout\` or \`stderr\`.

---

## License & Private Status

This package is private (\`"private": true\` in \`package.json\`). Internal project managed under Specsfy framework contracts.
`;

/**
 * Normalizes link paths in root README.md to strictly use clean `docs/` relative paths.
 * Replaces leading slashes (`/docs/`), file URIs (`file:///.../docs/`), or leading `./` (`./docs/`) with `docs/`.
 */
export function sanitizeRootReadmeLinks(content: string): string {
  return content
    .replace(/\(file:\/\/\/[^)]*?\/docs\//g, "(docs/")
    .replace(/\(\/docs\//g, "(docs/")
    .replace(/\(\.\/docs\//g, "(docs/")
    .replace(/\[\.\/docs\//g, "[docs/")
    .replace(/\[docs\/?\]\(docs\/?\)/g, "[docs/README.md](docs/README.md)")
    .replace(/\(docs\/\)/g, "(docs/README.md)");
}

/**
 * Normalizes back-links in docs/*.md files to strictly use `../README.md` and clean relative filenames without `./`.
 * Replaces invalid root-relative `/README.md` or absolute file URIs with `../README.md`.
 */
export function sanitizeDocBackLinks(content: string): string {
  return content
    .replace(/\(file:\/\/\/[^)]*?\/README\.md\)/g, "(../README.md)")
    .replace(/\(\/README\.md\)/g, "(../README.md)")
    .replace(/\(\.\/([a-zA-Z0-9_-]+\.md)\)/g, "($1)");
}

/**
 * Ensures the root `README.md` exists as a project homepage pointing to `./docs/`,
 * and validates that documentation relative links use proper `./docs/` and `../README.md` paths.
 */
export function ensureReadmeHomepage(root: string): void {
  const rootReadmePath = join(root, "README.md");

  if (!existsSync(rootReadmePath)) {
    writeFileSync(rootReadmePath, DEFAULT_ROOT_README, "utf8");
  } else {
    const existing = readFileSync(rootReadmePath, "utf8");
    const sanitized = sanitizeRootReadmeLinks(existing);
    if (sanitized !== existing) {
      writeFileSync(rootReadmePath, sanitized, "utf8");
    }
  }

  const docsDir = join(root, "docs");
  if (existsSync(docsDir)) {
    try {
      const files = readdirSync(docsDir);
      for (const file of files) {
        if (file.endsWith(".md")) {
          const docPath = join(docsDir, file);
          const docContent = readFileSync(docPath, "utf8");
          const sanitizedDoc = sanitizeDocBackLinks(docContent);
          if (sanitizedDoc !== docContent) {
            writeFileSync(docPath, sanitizedDoc, "utf8");
          }
        }
      }
    } catch {
      // Ignore directory read errors
    }
  }
}
