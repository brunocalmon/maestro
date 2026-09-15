[← Back to Root Homepage](../README.md) | [Portal Index](README.md)

---

# Test Suite and Quality Assurance of Maestro

<!-- specsfy:documentator:start -->
## Testing Strategy Overview

**Maestro** prioritizes absolute execution reliability through a rigorous test suite built with **Vitest**. The codebase achieves high coverage by combining deterministic unit tests with integration tests against temporary filesystem environments and simulated subprocesses.

### Core Testing Principles
1. **Absolute Determinism**: Tests do not depend on external network connectivity or global mutable state.
2. **Environment & Time Injection**: Date/time, TTY readers, memory probes, and executable path lists are injected via interfaces.
3. **I/O Isolation in Disposable Workspaces**: Integration tests create temporary directories (`mktemp`) that are automatically cleaned up post-test.
4. **Side-Effect Suppression**: Third-party commands are mocked using simulated executables to test failure recovery without affecting host development environments.

---

## Quality Scripts Architecture

npm scripts declared in `package.json` enforce build and test integrity:

- **`npm run test:tdd`** (`vitest run`): Runs the complete suíte of 200 test files.
- **`npm run build`** (`tsc`): Validates TypeScript type compilation without emitting errors.
- **`npm run prebuild`** (`node scripts/check-version-checksum.mjs`): Verifies version checksum integrity.
- **`npm run verify`** (`node scripts/cycle.mjs`): Executes the full verification cycle (compilation, test suite, and checksums).

---

## Inventory of 200 Test Files by Functional Domain

The 200 test files located in `tests/` are organized across core domains:

### 1. Approval Gate Tests
- `approval-comando-argv-alterado.test.ts`: Verifies that argument changes require new human approval.
- `approval-comando-ja-aprovado.test.ts`: Tests legitimate approval bypass for identical pre-registered commands.
- `approval-documento-json-registro.test.ts`: Validates batch approval via JSON payloads over `stdin`.
- `approval-grava-no-registro.test.ts`: Confirms proper recording in `.maestro/approved-commands.json`.
- `approval-recusa-nao-grava.test.ts`: Ensures user rejections do not write commands to the registry.
- `approval-registro-corrompido.test.ts`: Validates resilient handling of malformed registry JSON files.
- `approval-tty-read.test.ts`: Tests atomic synchronous terminal line reading.
- `aprovacao-contexto-canalizado.test.ts`, `aprovacao-contexto-terminal.test.ts`: Validates TTY vs `stdin` channel resolution.
- `aprovacao-documento-aprova.test.ts`, `aprovacao-documento-recusa.test.ts`, `aprovacao-documento-sem-campo.test.ts`.

### 2. Backends and Agent Adapter Tests
- `backends-detector-injetavel.test.ts`: Injects custom environment state to test binary detection.
- `backends-determinismo-misto.test.ts`: Validates detection stability under partial agent presence.
- `backends-lista-fixa-sem-sondagem.test.ts`: Ensures fixed deterministic backend preference order (`pi`, `agy`, `claude`, `codex`, `goose`).
- `backends-versao-sem-help.test.ts`: Tests version extraction for binaries that do not implement `--help`.
- `cli-backends-adapter.test.ts`: Tests CLI argument construction for each agent adapter.

### 3. Configuration & Schema Tests
- `config-backfill.test.ts`: Validates automatic backfilling of missing keys in `.maestro/config.yaml`.
- `config-router-block.test.ts`: Tests injection of Maestro router blocks into `CLAUDE.md` and `AGENTS.md`.
- `config-schema.test.ts`: Validates Zod schemas for global configurations and agent profiles.
- `config-sync.test.ts`: Ensures synchronization between `config.yaml` and `.specsfy/STACK.md`.
- `config-write.test.ts`: Validates safe writing of configuration files.

### 4. Delegation & CLI Spawning Tests
- `delegation-behavior.test.ts`: Validates brief behavior composition (`composeBehavior`).
- `delegation-brief.test.ts`: Tests brief rendering for host agent consumption.
- `delegation-runtime.test.ts`: Validates execution flow for agents with `runtime: cli`.
- `cli-spawn.test.ts`: Tests spawning CLI agent subprocesses under timeouts and status capture.
- `cli-select.test.ts`: Validates automatic backend selection and manual overrides.
- `cli-run-gate.test.ts`: Tests the secondary individual approval gate before spawning.

### 5. Extension System & Quarantine Tests
- `extensions-checksum-ausente.test.ts`: Tests handling of extensions without recorded hashes.
- `extensions-conflito-nome.test.ts`: Ensures rejection of creation requests conflicting with managed hooks.
- `extensions-create-sobrevive-setup.test.ts`: Proves local extension artifacts survive `maestro setup`.
- `extensions-doctor-divergencia.test.ts`: Validates reporting of checksum *drift* by `maestro doctor`.
- `extensions-repair-quarentena.test.ts`: Validates isolation of divergent extensions in `.maestro/quarantine/` and original restoration.
- `extensions-repair-quarentena-nao-gravavel.test.ts`: Tests total operation abort if quarantine directory is read-only.

### 6. Hooks, MCP, and Model Selection Tests
- `hooks-blocking.test.ts`, `hooks-permissive.test.ts`: Tests destructive operation block enforcement.
- `hooks-translate.test.ts`: Validates hook translation into `.claude/settings.json` format.
- `mcp-confinement.test.ts`, `mcp-root.test.ts`: Validates rejection of MCP executions outside project root.
- `mcp-surface.test.ts`, `mcp-tool-install.test.ts`: Validates execution of `setup` tool over MCP protocol.
- `models-capacity.test.ts`, `models-context-window.test.ts`: Validates RAM and context window length filtering.
- `models-recommend.test.ts`, `models-ollama.test.ts`: Tests deterministic model recommendation logic.

### 7. Telemetry & Tracing Tests
- `telemetry-record.test.ts`, `telemetry-store.test.ts`: Tests structured telemetry storage in `.maestro/telemetry/`.
- `telemetry-report.test.ts`: Validates report rendering by `maestro report`.
- `trace-*.test.ts`: Validates deterministic trace ID generation (`traceId`).
<!-- specsfy:documentator:end -->
