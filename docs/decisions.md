[← Back to Root Homepage](../README.md) | [Portal Index](README.md)

---

# Architecture Decision Records (ADRs) of Maestro

<!-- specsfy:documentator:start -->
## Política

Decisões explícitas em `PROJECT.md` e `.specsfy/` prevalecem sobre inferências deste documento.
<!-- specsfy:documentator:end -->

<!-- O bloco specsfy:documentator acima é o inventário mecânico gerado pelo Specsfy e é reescrito a cada build (findings/external/FIND-EXT-001). A documentação do projeto vive fora dele, a partir daqui. -->

## Decisions Overview

Architecture decisions in **Maestro** are formally recorded through specifications (`specs/`) and aligned with principles of deterministic, secure, and non-destructive orchestration.

In case of conflict, the following normative hierarchy applies:
1. Explicit rules in `PROJECT.md` and `.specsfy/RULES.md`.
2. Formal specifications approved in `specs/completed/`.
3. Contents of this decision synthesis document.

---

## ADRs and Key Design Decisions

### ADR-001: 3-Layer Dependency Hierarchy (SPEC-0002)
- **Context**: Maestro must integrate npm tools (`@promovaweb/specsfy`, `context-mode`), Python utilities (`code-review-graph`), and AI agents (`pi`, `agy`, `claude`, `codex`, `goose`).
- **Decision**: 
  - **npm Subsystems**: Strictly pinned to local project dependency versions.
  - **Python Subsystems**: Isolated in local project `venv` (`.venv`) upon prior approval. Never installed globally.
  - **Agent Backends**: Dynamically detected in `PATH` by demonstrated invocation capability. Backends are interchangeable by design and Maestro never installs them.
- **Consequence**: Preserves host environment integrity without global version conflicts.

### ADR-002: Approval Gate with Exact argv Matching (SPEC-0004)
- **Context**: Unauthorized commands or background installations by AI tools can compromise user repositories or host systems.
- **Decision**: Require explicit prior human approval before executing disk writes or subsystem commands. Approval is interactive via TTY or batch via JSON over `stdin`.
- **Registry Rule**: Bypass for re-executions requires exact binary and `argv` array matching. If an argument or version changes, approval is prompted again.
- **Consequence**: Guaranteed security without annoying users on identical, legitimate reinstalls.

### ADR-003: Offline & Deterministic LLM Recommendation (SPEC-0007 / SPEC-0014)
- **Context**: Recommend language models without exposing API credentials or depending on remote network availability.
- **Decision**: Recommendation probes the local Ollama API (when active) and selects the largest model fitting free system RAM/GPU memory. Additionally, it evaluates minimum context window requirements declared per task type (`.maestro/config.yaml`).
- **Deliberate Limitation**: Cost and pricing calculations per backend are deliberately omitted because no CLI backend exposes these metrics offline without remote login authentication.

### ADR-004: Non-Destructive Quarantine for Extension Repair (SPEC-0009)
- **Context**: When a user modifies an extension file manually, `doctor` flags the checksum *drift*. The repair engine must not overwrite user modifications silently.
- **Decision**: `maestro extension repair` moves the divergent file to `.maestro/quarantine/` before restoring the original version. If the quarantine directory is not writable, the entire repair operation is aborted.
- **Consequence**: User modifications are never lost involuntarily.

### ADR-005: External CLI Agent Subprocess Execution (SPEC-0019)
- **Context**: Support real execution for agents configured with `runtime: cli`.
- **Decision**: Create dedicated backend adapters building native invocation arguments (`pi`, `claude`, `goose`) or generating isolated temporary `AGENTS.md` files (`agy`, `codex`, always cleaned up post-execution). Each agent execution undergoes an independent secondary approval gate prior to spawning.
- **Consequence**: Secure execution with environment isolation and clean subprocess error handling.

### ADR-006: Telemetry Recording with Strict Output Redaction
- **Context**: Record agent execution history for performance auditing.
- **Decision**: Telemetry files (`.maestro/telemetry/<exec>.json`) strictly store structured metadata (duration, agent, backend, result status, exit code, timestamp).
- **Prohibition**: **Capturing or storing `stdout` or `stderr` subprocess output in telemetry is strictly prohibited**, preventing accidental leaks of API keys, tokens, or confidential code.

---

## Deliberate System Boundaries

1. **No Manual Global Installations**: Maestro never runs `npm install -g`, `apt`, or system-level installer commands.
2. **No Native Lifecycle Scripts**: npm package installations execute with `--ignore-scripts`.
3. **Private Package**: Package `@brunocalmon/maestro` declares `"private": true` in `package.json`, preventing accidental public npm registry publishing.
