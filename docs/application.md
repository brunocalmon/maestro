[← Back to Root Homepage](../README.md) | [Portal Index](README.md)

---

# Application and Module Inventory (`src/`)

<!-- specsfy:documentator:start -->
## Application Structure

The **Maestro** codebase is located in `src/` and consists of 45+ TypeScript modules organized across 12 functional domains. Each module is designed following single-responsibility principles and decoupled I/O to facilitate deterministic automated testing.

### Functional Domain Overview

| Domain | Directory | Primary Responsibility |
| --- | --- | --- |
| **Agents & Profiles** | `src/agents/` | Reading, schema validation, and seeding of subagent profiles in `.maestro/subagents/`. |
| **Approval & TTY** | `src/approval/` | Interactive TTY and batch JSON `stdin` approval gates, recording approved commands in `approved-commands.json`. |
| **Agent Backends** | `src/backends/` | Probing presence, version, and invocation capability of CLI agents (`pi`, `agy`, `claude`, `codex`, `goose`). |
| **Configuration** | `src/config/` | `.maestro/config.yaml` schema validation, synchronization with `.specsfy/STACK.md`, and language rule enforcement. |
| **Delegation Engine** | `src/delegation/` | Briefing composition, external CLI adapters, backend selection, and timeout subprocess execution. |
| **Diagnostics (Doctor)** | `src/doctor.ts` | System health diagnostics, detecting drift in hooks, skills, extensions, and environment dependencies. |
| **Extension System** | `src/extensions/` | Creating local extensions with HTML anchors, SHA-256 checksum verification, and non-destructive quarantine. |
| **Hooks & Editors** | `src/hooks/` | Translating Claude Code hooks, shell escaping, and resolving guardian executables. |
| **MCP Server** | `src/mcp/` | Model Context Protocol STDIO server with strict project root confinement validation. |
| **Models & Ollama** | `src/models/` | Free memory probing, context window evaluation per task type, and deterministic model recommendation. |
| **Plan Orchestration** | `src/plan/` | Multi-agent execution plan assembly, presentation, decision rendering, and storage (`.maestro/plans/`). |
| **Setup & Reconciler** | `src/setup/` | Drift reconciliation across hooks, skills, Specsfy framework, and Python `venv` bridge. |
| **Skills & Specsfy** | `src/skills/`, `src/specsfy/` | Delivering bundled skills, inventory inspections, official sources, and invoking Vercel-Labs/Specsfy installers. |
| **Telemetry & Tracing** | `src/telemetry/` | Structured telemetry recording and report rendering for CLI agent executions (`.maestro/telemetry/`). |

---

## Detailed Module and Exported Symbols Inventory

### 1. Agents Domain (`src/agents/`)
- `diagnose.ts`: `diagnoseAgents`, `formatAgentProblems`. (Diagnoses configuration drift in subagent profile files).
- `profile.ts`: `PROFILE_GROUPS`, `ProfileProblem`, `validateProfileShape`, `validateUniqueNames`. (Validates the 5 profile groups: identity, cognition, instruction, capability, execution).
- `read.ts`: `readAgentConfig`, `realAgentEnvironment`. (Reads and parses project subagent configurations).
- `seed.ts`: `seedAgentDefaults`, `PACKAGE_ROOT`. (Seeds initial default subagent profiles into `.maestro/subagents/`).

### 2. Approval Domain (`src/approval/`)
- `context.ts`: `TerminalContext`, `realTerminalContext`, `resolveChannel`. (Detects interactive TTY vs piped `stdin` execution).
- `decide.ts`: `interpretDecision`, `ApprovalResult`, `interactiveSource`. (Processes human approval or rejection decisions).
- `plan.ts`: `assembleDependencyCommands`, `recordApproval`, `partitionByApproval`. (Assembles dependency commands requiring approval).
- `registry.ts`: `ApprovalRegistry`, `readApprovalRegistry`, `writeApprovalRegistry`, `isApproved`. (Manages `.maestro/approved-commands.json`).
- `render.ts`: `renderPlan`. (Renders execution plans in human-readable terminal format).
- `tty-read.ts`: `readTtyLine`, `realSyncReader`. (Atomic synchronous reader for interactive terminal input).

### 3. Backends Domain (`src/backends/`)
- `detect.ts`: `detectBackends`, `realBackendEnvironment`. (Probes `PATH` to detect presence and version of CLI agents).
- `known.ts`: `SUPPORTED_AGENT_BACKENDS`, `KNOWN_AGENT_BACKENDS`. (List of supported and recognized CLI agent backends).

### 4. Configuration Domain (`src/config/`)
- `read.ts`: `readMaestroSection`. (Reads Maestro configuration sections from `.maestro/config.yaml`).
- `schema.ts`: Zod schemas for `ProjectSection`, `SystemSection`, `GitSection`, `LanguageSection`, `MaestroSection`.
- `sync.ts`: `syncProjectFromStack`. (Synchronizes `config.yaml` fields with `.specsfy/STACK.md` without silent divergence).
- `write.ts`: `ensureConfigFile`, `backfillConfigFile`. (Ensures `config.yaml` contains all schema keys).
- `yaml.ts`: `serialize`, `parse`, `mergeMissingKeys`. (Resilient YAML parsing and formatting utilities).

### 5. Delegation Domain (`src/delegation/`)
- `behavior.ts`: `composeBehavior`. (Combines base and additional behaviors for briefings).
- `brief.ts`: `buildBriefs`, `renderBriefs`. (Generates structured agent briefs for host delegation).
- `cli-gate.ts`: `decideSpawn`. (Individual secondary approval gate prior to spawning each CLI agent subprocess).
- `cli-select.ts`: `selectBackend`. (Selects the appropriate agent backend based on availability and overrides).
- `cli-spawn.ts`: `spawnCliAgent`. (Spawns external CLI agent subprocesses under configured timeouts).
- `cli-tools.ts`: `checkToolsSupport`. (Validates whether a backend supports mandatory tool restrictions).
- `cli-backends/adapter.ts`: Base interface `CliBackendAdapter`.
- `cli-backends/registry.ts`: `resolveAdapter`, `ADAPTERS`. (Resolves backend adapters for `agy`, `claude`, `codex`, `goose`, `pi`).
- `run.ts`: `runCliAgent`, `runDelegation`. (Coordinates delegation execution).

### 6. Diagnostics & Extensions (`src/doctor.ts`, `src/extensions/`)
- `doctor.ts`: `Report`, `Environment`, `NPM_SUBSYSTEMS`. (Comprehensive health report printed by `maestro doctor`).
- `anchor.ts`: `insertAnchor`, `readAnchor`, `computeChecksum`. (Inserts HTML anchors and computes SHA-256 checksums).
- `create.ts`: `listPresentExtensionNames`, `resolveTargetPath`. (Creates local extension artifacts without overwriting essential files).
- `diagnose.ts`: `diagnoseExtensions`. (Compares local file hashes against `.maestro/extensions.json`).
- `repair.ts`: `repairExtension`, `QUARANTINE_DIR`. (Isolates unrecorded changes into `.maestro/quarantine/` and restores original).

### 7. MCP & Models Domain (`src/mcp/`, `src/models/`)
- `mcp/server.ts`: `createServer`. (Instantiates the MCP server and registers available tools).
- `mcp/root.ts`: `validateRoot`. (Enforces strict execution confinement to the project root).
- `models/capacity.ts`: `readCapacity`. (Evaluates free RAM/GPU memory available in the environment).
- `models/context-window.ts`: `parseContextLength`. (Validates context window length capacity per task type).
- `models/ollama.ts`: `listOllamaModels`. (Probes installed Ollama models via local REST API).
- `models/recommend.ts`: `recommendBackend`, `recommendLocalModel`. (Calculates deterministic model recommendations).

---

## Test Suite Coverage Mapping

Every module in `src/` has corresponding test suites in `tests/` validating expected behaviors, edge cases, I/O failures, and side-effect suppression. Refer to [testing.md](testing.md) for the complete 200 test file inventory mapping.
<!-- specsfy:documentator:end -->
