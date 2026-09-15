[← Back to Root Homepage](../README.md) | [Portal Index](README.md)

---

# Packages and Libraries of Maestro (`@brunocalmon/maestro`)

## Architectural Summary of Production Dependencies

The `@brunocalmon/maestro` package minimizes third-party dependencies to maintain a lightweight, fast, and predictable runtime. Production dependencies strictly support core system pillars:

1. **`@modelcontextprotocol/sdk` (v1.30.0)**:
   - **Role**: Native implementation of the Model Context Protocol (MCP).
   - **Usage**: Powers the `maestro-mcp` binary via STDIO JSON-RPC 2.0 communication.
2. **`@promovaweb/specsfy` (v0.22.2)**:
   - **Role**: CLI and TUI for the Specsfy specification engineering framework.
   - **Usage**: Installation and synchronization of project specifications, rules, and stack metadata.
3. **`context-mode` (v1.0.169)**:
   - **Role**: MCP plugin for context window optimization and token savings.
   - **Usage**: Injected as a guardian hook into `.claude/settings.json`.
4. **`skills` (v1.5.23)**:
   - **Role**: Official agent skills ecosystem management library from Vercel Labs.
   - **Usage**: Enables idempotent delivery of skill sets to `.claude/skills/` and `.agents/skills/`.
5. **`yaml` (v2.9.0)**:
   - **Role**: High-performance JavaScript/TypeScript YAML parser and stringifier.
   - **Usage**: Reading, resilient manipulation, and backfilling of `.maestro/config.yaml`.
6. **`zod` (v3.25.76)**:
   - **Role**: TypeScript-first schema declaration and runtime validation library with static type inference.
   - **Usage**: Strict validation of subagent profile configurations, projects, systems, and approval schemas.

---

<!-- specsfy:documentator:start -->
## Complete Package Inventory (Direct and Transitive)

| Category | Scope | Package | Version | Purpose | Source | GitHub |
| --- | --- | --- | --- | --- | --- | --- |
| Third-party | production | @modelcontextprotocol/sdk | 1.30.0 | Model Context Protocol implementation for TypeScript | https://github.com/modelcontextprotocol/typescript-sdk | https://github.com/modelcontextprotocol/typescript-sdk |
| Third-party | production | @promovaweb/specsfy | 0.22.2 | Specsfy CLI & TUI to install skills and track specifications. | https://github.com/promovaweb/specsfy | https://github.com/promovaweb/specsfy |
| Third-party | production | context-mode | 1.0.169 | MCP plugin that saves 98% of your context window. Works with Claude Code, Gemini CLI, VS Code Copilot, OpenCode, and Codex CLI. Sandboxed code execution, FTS5 knowledge base, and intent-driven search. | https://github.com/mksglu/context-mode | https://github.com/mksglu/context-mode |
| Third-party | production | skills | 1.5.23 | The open agent skills ecosystem | https://github.com/vercel-labs/skills | https://github.com/vercel-labs/skills |
| Third-party | production | yaml | 2.9.0 | JavaScript parser and stringifier for YAML | github:eemeli/yaml | — |
| Third-party | production | zod | 3.25.76 | TypeScript-first schema declaration and validation library with static type inference | https://github.com/colinhacks/zod | https://github.com/colinhacks/zod |
| Third-party | development | @types/node | 26.3.0 | TypeScript definitions for node | https://github.com/DefinitelyTyped/DefinitelyTyped | https://github.com/DefinitelyTyped/DefinitelyTyped |
| Third-party | development | @vitest/coverage-v8 | 4.1.11 | V8 coverage provider for Vitest | https://github.com/vitest-dev/vitest | https://github.com/vitest-dev/vitest |
| Third-party | development | typescript | 7.0.2 | TypeScript is a language for application scale JavaScript development | https://github.com/microsoft/TypeScript | https://github.com/microsoft/TypeScript |
| Third-party | development | vitest | 4.1.11 | Next generation testing framework powered by Vite | https://github.com/vitest-dev/vitest | https://github.com/vitest-dev/vitest |
<!-- specsfy:documentator:end -->

