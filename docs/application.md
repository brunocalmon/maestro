[← Back to Root Homepage](../README.md) | [Portal Index](README.md)

---

# Application and Module Inventory (`src/`)

<!-- specsfy:documentator:start -->
## Superfícies

Categorias: Serviços, Rotas e APIs, Páginas, Componentes, Testes e Outras fontes.

Relação: relaciona cada arquivo observado à sua superfície.

| Categoria | Arquivo | Símbolos |
| --- | --- | --- |
| Outras fontes | src/agents/diagnose.ts | diagnoseAgents, formatAgentProblems |
| Outras fontes | src/agents/profile.ts | PROPERTY_MODES, PROFILE_GROUPS, ProfileProblem, describeProblem, isConfiguredProperty, profileName, validateProfileShape, validateUniqueNames |
| Outras fontes | src/agents/read.ts | PATH_PROPERTIES, AgentEnvironment, realAgentEnvironment, AgentConfig, collectProblems, readAgentConfig |
| Outras fontes | src/agents/seed.ts | PACKAGE_ROOT, AGENT_RESOURCES_DIR, seedAgentDefaults |
| Outras fontes | src/approval/context.ts | TerminalContext, realTerminalContext, resolveChannel |
| Outras fontes | src/approval/decide.ts | DecisionSource, StdinReader, documentSource, interactiveSource, realSource, ApprovalResult, interpretDecision, interpret |
| Outras fontes | src/approval/plan.ts | DependencyCommandItem, CommandCandidate, assembleDependencyCommands, partitionByApproval, recordApproval |
| Outras fontes | src/approval/registry.ts | ApprovedCommand, ApprovalRegistry, RegistryEnvironment, REGISTRY_PATH, realRegistryEnvironment, readApprovalRegistry, writeApprovalRegistry, isApproved |
| Outras fontes | src/approval/render.ts | PlannedItem, RenderedPlan, renderPlan |
| Outras fontes | src/approval/tty-read.ts | SyncReader, atomicsSleep, realSyncReader, NEWLINE, RETRY_DELAY_MS, readTtyLine |
| Outras fontes | src/backends/detect.ts | BackendEnvironment, BackendResult, realBackendEnvironment, detectBackends |
| Outras fontes | src/backends/known.ts | SUPPORTED_AGENT_BACKENDS, KNOWN_AGENT_BACKENDS |
| Outras fontes | src/cli.ts | CommandOutcome, HELP_FLAGS, USAGE_VERSION, USAGE_DOCTOR, USAGE_SETUP, USAGE_PLAN, USAGE_RUN, USAGE_REPORT |
| Outras fontes | src/config/read.ts | readMaestroSection |
| Outras fontes | src/config/schema.ts | LanguageException, LanguageSection, ProjectSection, SystemSection, GitGroup, GitSection, ConfiguredProperty, AgentIdentity |
| Outras fontes | src/config/sync.ts | STACK_PATH, BLOCK, ROW, readMappedFields, syncProjectFromStack |
| Outras fontes | src/config/write.ts | CONFIG_PATH, ensureConfigFile, backfillConfigFile |
| Outras fontes | src/config/yaml.ts | SECTION_COMMENTS, serialize, parse, resolveDefault, mergeMissingKeys |
| Outras fontes | src/delegation/behavior.ts | BehaviorParts, composeBehavior |
| Outras fontes | src/delegation/brief.ts | DelegationConfig, AgentBrief, findProfile, readOrNull, resolveBehavior, buildBriefs, renderBriefs |
| Outras fontes | src/delegation/cli-backends/adapter.ts | CliBackendAdapter |
| Outras fontes | src/delegation/cli-backends/agy.ts | — |
| Outras fontes | src/delegation/cli-backends/claude.ts | — |
| Outras fontes | src/delegation/cli-backends/codex.ts | — |
| Outras fontes | src/delegation/cli-backends/goose.ts | — |
| Outras fontes | src/delegation/cli-backends/pi.ts | — |
| Outras fontes | src/delegation/cli-backends/registry.ts | ADAPTERS, resolveAdapter |
| Outras fontes | src/delegation/cli-behavior-file.ts | withTemporaryAgentsFile |
| Outras fontes | src/delegation/cli-gate.ts | decideSpawn |
| Outras fontes | src/delegation/cli-select.ts | selectBackend |
| Outras fontes | src/delegation/cli-spawn.ts | SpawnOptions, spawnCliAgent |
| Outras fontes | src/delegation/cli-tools.ts | checkToolsSupport |
| Outras fontes | src/delegation/run.ts | TelemetryHooks, CliRuntimeContext, renderNativeAgent, runCliAgent, runDelegation |
| Outras fontes | src/doctor/maestro.ts | MaestroFinding, diagnoseMaestro, diagnoseMaestroProject |
| Outras fontes | src/doctor/subsystems.ts | SubsystemResult, SpawnOutcome, SubsystemSpec, subsystemSpecs, SUBSYSTEM_TIMEOUT_MS, runSubsystemDoctors |
| Outras fontes | src/doctor.ts | DependencyResult, Report, Environment, NPM_SUBSYSTEMS, PYTHON_SUBSYSTEM, NPM_HINT, PYTHON_HINT, pick |
| Outras fontes | src/extensions/anchor.ts | anchorMarkers, insertAnchor, removeAnchor, readAnchor, readAnchorRange, computeChecksum |
| Outras fontes | src/extensions/create.ts | TargetFileEnvironment, ROUTER_FILES, resolveTargetPath, EXTENSIONS_DIR, realTargetFileEnvironment, listPresentExtensionNames, CreateOptions, CreateResult |
| Outras fontes | src/extensions/diagnose.ts | DivergentArtifact, diagnoseExtensions |
| Outras fontes | src/extensions/foreign.ts | ForeignSignature, FOREIGN_SIGNATURES, RelocationResult, extractSection, relocateForeignSections |
| Outras fontes | src/extensions/instructions.ts | InstructionEnvs, realInstructionEnvs, InstructionsResult, SHARED_BLOCKS, ensureInstructions |
| Outras fontes | src/extensions/migrate.ts | MigrationStep, MigrationResult, migrateExtensionTargets, DIRECTION_PLAN |
| Outras fontes | src/extensions/registry.ts | ExtensionArtifact, ExtensionRegistry, ChecksumEnvironment, REGISTRY_PATH, realChecksumEnvironment, readExtensionRegistry, writeExtensionRegistry |
| Outras fontes | src/extensions/repair.ts | QuarantineEnvironment, QUARANTINE_DIR, realQuarantineEnvironment, RepairResult, repairExtension |
| Outras fontes | src/extensions/router.ts | buildRouterBlock, buildAgentsImport, buildAgentsPointer, buildConfigLanguageBlock, buildConfigLanguagePointer, buildHooksFallbackBlock, buildHooksFallbackPointer |
| Outras fontes | src/hooks/claude-code.ts | HOOKS_DIR, scriptReference, dispatchMarker, TranslatedHook, EVENT_MAP, MATCHER_MAP, translateForClaudeCode, wrap |
| Outras fontes | src/hooks/detect.ts | TARGET, KNOWN_TARGETS, detectTarget |
| Outras fontes | src/hooks/identity.ts | LEGACY_HOOK_NAMES, REFERENCE, MARKER, isMaestroEntry, isLegacyEntry |
| Outras fontes | src/hooks/resolve.ts | shellQuote, resolveHookCommand, resolveDispatchCommand, binVariables |
| Outras fontes | src/hooks/shim.ts | shellQuote, buildDispatchCommand |
| Outras fontes | src/hooks/source.ts | Hook, EVENTS, scalar, scriptFrom, readHook |
| Outras fontes | src/hooks/upstream.ts | of, EVENT_TO_CANONICAL, UpstreamEntry, UpstreamProjection, projectContextModeHooks |
| Outras fontes | src/mcp/main.ts | — |
| Outras fontes | src/mcp/root.ts | PROJECT_MARKERS, never, validateRoot |
| Outras fontes | src/mcp/server.ts | SERVER_NAME, createServer |
| Outras fontes | src/mcp/tool.ts | TOOL_NAME, TOOL_DESCRIPTION, SetupToolResult, executeSetup |
| Outras fontes | src/models/capacity.ts | Capacity, CapacityEnvironment, realCapacityEnvironment, readCapacity |
| Outras fontes | src/models/context-window.ts | ContextWindowEnvironment, CONTEXT_LENGTH, parseContextLength, contextWindowReader, realContextWindowEnvironment, realContextWindowReader |
| Outras fontes | src/models/ollama.ts | OllamaModel, OllamaSnapshot, OllamaEnvironment, UNITS, sizeToBytes, parseOllamaList, realOllamaEnvironment, listOllamaModels |
| Outras fontes | src/models/recommend.ts | RecommendOverride, Recommendation, recommendBackend, WindowShortfall, LocalModelChoice, recommendLocalModel, largest, renderReport |
| Outras fontes | src/models/task-type.ts | ResolvedTaskType, resolveTaskType |
| Outras fontes | src/plan/assemble.ts | AssembleInput, has, assemblePlan |
| Outras fontes | src/plan/model.ts | PlannedAgent, OrchestrationPlan, ApprovedPlan |
| Outras fontes | src/plan/render.ts | renderPlan |
| Outras fontes | src/plan/run.ts | PlanDecisionSource, PlanDecision, decidePlan |
| Outras fontes | src/plan/store.ts | PLANS_DIR, planPath, writeApprovedPlan, readApprovedPlan |
| Outras fontes | src/setup/bridge.ts | PYTHON_SUBSYSTEM, PINNED_VERSION, VENV_DIR, BridgeEnvironment, BridgeResult, bridgePythonSubsystem, realBridgeEnvironment |
| Outras fontes | src/setup/dependency-resolution.ts | CONTEXT_MODE, only, buildDependencyResolution, codeReviewGraphWillBeLocal |
| Outras fontes | src/setup/env.ts | detectEnvironment |
| Outras fontes | src/setup/layout.ts | SPECSFY_SETUP_TRACES, AGENT_SKILLS_HEADING, SHARED_INSTRUCTION_BLOCKS, ExpectedLayout, expectedLayout, DivergentProjection, UncoveredFallbackHook, ConfigurationAssessment |
| Outras fontes | src/setup/readme.ts | DEFAULT_ROOT_README, sanitizeRootReadmeLinks, sanitizeDocBackLinks, NEXT_STEPS_HEADING, withNextSteps, ensureReadmeHomepage |
| Outras fontes | src/setup/record.ts | RecordEntry, SkillsRecordEntry, InstallRecord, RECORD_PATH, readRecord, writeRecord, entriesToRemove, matches |
| Outras fontes | src/setup/run.ts | TARGET_SETTINGS, SetupOptions, SetupResult, ensureConfigYaml, STATE_DIR, ensureStateDir, BUNDLED_SKILLS, SKILL_TARGET_DIRS |
| Outras fontes | src/setup/write.ts | WriteSettingsResult, writeSettings, hasLegacyEntries, realQuarantine, WriteHookScriptsResult, hookScriptPath, writeHookScripts, writeRecordFile |
| Outras fontes | src/skills/deliver.ts | BundledSkillFile, readBundledSkill, SkillWriteEnvironment, realSkillWriteEnvironment, deliverBundledSkill |
| Outras fontes | src/skills/executor.ts | resolveSkillsBin, parseSkillNames, realSkillsExecutor, describeSkillsCommand |
| Outras fontes | src/skills/install.ts | TARGET_AGENT, buildSkillsAddArgs, InstallOptions, InstallResult, installSkills |
| Outras fontes | src/skills/inventory.ts | SKILLS_DIR, SkillsInspection, inspectSkills |
| Outras fontes | src/skills/project.ts | ProjectionRecord, ProjectionResult, directoryChecksum, containsSymlink, projectSkills |
| Outras fontes | src/skills/record.ts | LOCK_PATH, LockEntry, SkillRecordEntry, SkillReportRow, SkillReport, GUARANTEE_NOTE, readLock, toRecordEntries |
| Outras fontes | src/skills/source.ts | OFFICIAL_SOURCE, OFFICIAL_SOURCES, resolveSource |
| Outras fontes | src/specsfy/executor.ts | resolveSpecsfyBin, SpecsfyJson, realSpecsfyExecutor, describeSpecsfyCommand |
| Outras fontes | src/specsfy/install.ts | buildSpecsfyInstallArgs, InstallOptions, InstallResult, installSpecsfy |
| Outras fontes | src/targets/adapter.ts | TargetEnvironment, DetectionResult, SkippedHook, TargetAdapter |
| Outras fontes | src/targets/antigravity.ts | EVIDENCE, SUPPORTED |
| Outras fontes | src/targets/claude-code.ts | EVIDENCE, SUPPORTED, partitionByEvent |
| Outras fontes | src/targets/registry.ts | ADAPTERS, DEFAULT_TARGET, KNOWN_TARGETS, getTargetAdapter, detectTarget |
| Outras fontes | src/telemetry/read.ts | readTrace |
| Outras fontes | src/telemetry/record.ts | — |
| Outras fontes | src/telemetry/render.ts | renderTelemetry |
| Outras fontes | src/telemetry/store.ts | TELEMETRY_DIR, TelemetryRecord, recordPath, readTelemetryRecord, appendTelemetryEntry |
| Outras fontes | src/telemetry/trace.ts | TRACE_ID_LENGTH, TraceSource, generateId, nowIso, realSource |
| Outras fontes | src/version.ts | readVersion |
| Testes | tests/agents-config-schema.test.ts | setup, readConfig, properties |
| Testes | tests/agents-doctor.test.ts | setup, walk, hashTree, brokenProject |
| Testes | tests/agents-read.test.ts | writeConfig, MAESTRO_BASE |
| Testes | tests/agents-seed.test.ts | ROOT, setup, walk |
| Testes | tests/approval-comando-argv-alterado.test.ts | — |
| Testes | tests/approval-comando-ja-aprovado.test.ts | — |
| Testes | tests/approval-command-fixtures.ts | itemFake, registryFake |
| Testes | tests/approval-documento-json-registro.test.ts | projectWithTarget, run |
| Testes | tests/approval-grava-no-registro.test.ts | — |
| Testes | tests/approval-plan-completo.test.ts | — |
| Testes | tests/approval-recusa-nao-grava.test.ts | — |
| Testes | tests/approval-registro-corrompido.test.ts | — |
| Testes | tests/approval-tty-read.test.ts | fakeTty |
| Testes | tests/aprovacao-contexto-canalizado.test.ts | — |
| Testes | tests/aprovacao-contexto-terminal.test.ts | — |
| Testes | tests/aprovacao-documento-aprova.test.ts | — |
| Testes | tests/aprovacao-documento-malformado.test.ts | — |
| Testes | tests/aprovacao-documento-recusa.test.ts | — |
| Testes | tests/aprovacao-documento-sem-campo.test.ts | — |
| Testes | tests/aprovacao-entrada-vazia.test.ts | — |
| Testes | tests/aprovacao-fixtures.ts | project, fileTree, fixedContext, fixedDecision, decisionThatThrowsIfCalled, fixedDocument |
| Testes | tests/aprovacao-fonte-injetada.test.ts | — |
| Testes | tests/aprovacao-formas-equivalentes.test.ts | PLANO |
| Testes | tests/aprovacao-libera-escrita.test.ts | — |
| Testes | tests/aprovacao-padrao-producao.test.ts | — |
| Testes | tests/aprovacao-plano-apresentado.test.ts | — |
| Testes | tests/aprovacao-plano-fiel.test.ts | — |
| Testes | tests/aprovacao-recusa-preserva.test.ts | — |
| Testes | tests/aprovacao-sem-alvo.test.ts | — |
| Testes | tests/aprovacao-sem-mudanca.test.ts | — |
| Testes | tests/backends-ausencia-nao-afeta-saida.test.ts | — |
| Testes | tests/backends-convivencia-status.test.ts | — |
| Testes | tests/backends-detector-injetavel.test.ts | — |
| Testes | tests/backends-determinismo-misto.test.ts | — |
| Testes | tests/backends-fixtures.ts | sourceFake |
| Testes | tests/backends-lista-fixa-sem-sondagem.test.ts | — |
| Testes | tests/backends-nao-suportado-presente.test.ts | — |
| Testes | tests/backends-paridade-real.test.ts | — |
| Testes | tests/backends-suportados-presentes.test.ts | — |
| Testes | tests/backends-versao-sem-help.test.ts | — |
| Testes | tests/bridge-ausente-do-plano.test.ts | — |
| Testes | tests/bridge-real.test.ts | — |
| Testes | tests/budget.test.ts | BUDGET_SECONDS |
| Testes | tests/build.test.ts | ROOT |
| Testes | tests/cli-approval-real.test.ts | projectWithTarget |
| Testes | tests/cli-backends-adapter.test.ts | — |
| Testes | tests/cli-behavior-file.test.ts | project |
| Testes | tests/cli-help.test.ts | — |
| Testes | tests/cli-run-gate.test.ts | — |
| Testes | tests/cli-run-tools.test.ts | — |
| Testes | tests/cli-select.test.ts | — |
| Testes | tests/cli-setup-drift-real.test.ts | projectWithTarget, run |
| Testes | tests/cli-setup-real.test.ts | — |
| Testes | tests/cli-spawn.test.ts | — |
| Testes | tests/cli-symlink.test.ts | viaLink |
| Testes | tests/config-backfill.test.ts | mktemp, writeExisting, COMPLETE_YAML |
| Testes | tests/config-router-block.test.ts | mktemp |
| Testes | tests/config-schema.test.ts | FORBIDDEN_KEY_TERMS |
| Testes | tests/config-sync.test.ts | mktemp, COMPLETE_YAML, writeConfig, writeStack |
| Testes | tests/config-write.test.ts | mktemp |
| Testes | tests/context-window.test.ts | REAL_OUTPUT |
| Testes | tests/cycle-command.test.ts | ROOT |
| Testes | tests/cycle-failure.test.ts | ROOT |
| Testes | tests/cycle-timings.test.ts | ROOT |
| Testes | tests/delegation-behavior.test.ts | BASE, OWN, EXTRA |
| Testes | tests/delegation-brief.test.ts | BASE |
| Testes | tests/delegation-fixtures.ts | profile, plan |
| Testes | tests/delegation-runtime.test.ts | project, BASE |
| Testes | tests/doctor-camada-agent-texto.test.ts | — |
| Testes | tests/doctor-cli-nomeia-extensao-divergente.test.ts | — |
| Testes | tests/doctor-documentation-issues.test.ts | rootWithDocumentationIssue |
| Testes | tests/doctor-maestro-layer.test.ts | configuredProject, walk, hashTree |
| Testes | tests/doctor-missing.test.ts | — |
| Testes | tests/doctor-ok.test.ts | — |
| Testes | tests/doctor-subsystems.test.ts | — |
| Testes | tests/documentation-diagnose.test.ts | mktemp, withSpecsfy, walk, hashTree |
| Testes | tests/extensions-checksum-ausente.test.ts | — |
| Testes | tests/extensions-conflito-nome.test.ts | — |
| Testes | tests/extensions-create-sobrevive-setup.test.ts | — |
| Testes | tests/extensions-diagnose-nome-diferente-do-alvo.test.ts | — |
| Testes | tests/extensions-doctor-divergencia.test.ts | — |
| Testes | tests/extensions-facade-nao-escreve.test.ts | — |
| Testes | tests/extensions-fixtures.ts | registryFake, checksumEnvFake, targetEnvFake |
| Testes | tests/extensions-foreign-sections.test.ts | — |
| Testes | tests/extensions-migrate-direction.test.ts | — |
| Testes | tests/extensions-new-recusado-hook.test.ts | — |
| Testes | tests/extensions-repair-quarentena-nao-gravavel.test.ts | — |
| Testes | tests/extensions-repair-quarentena.test.ts | realRegistryEnv, realTargetEnv |
| Testes | tests/extensions-router-agents-md.test.ts | — |
| Testes | tests/extensions-router-claude-md.test.ts | — |
| Testes | tests/helpers-spec-0022.ts | project, readSettings, SettingsEntry, entriesFor, corpusHook, syntheticHook, executable, legacyEntry |
| Testes | tests/helpers-spec-0023.ts | CTX_EXECUTE, CTX_BATCH, TERMINAL, PLAYWRIGHT_CODE, AI_TRAILER, scriptFor, RunResult, runScript |
| Testes | tests/helpers-spec-0024.ts | registerBlock, OLD_ROUTER, OLD_LANGUAGE, OLD_FALLBACK, oldDirectionRoot, AGENT_SKILLS_SECTION, skill |
| Testes | tests/hooks-any-shell-guards.test.ts | TOOLS_REGEX |
| Testes | tests/hooks-blocking.test.ts | CORPUS, runGuard |
| Testes | tests/hooks-context-mode-comando.test.ts | REAL_HOOKS_JSON |
| Testes | tests/hooks-corpus.test.ts | CORPUS |
| Testes | tests/hooks-dispatch.test.ts | — |
| Testes | tests/hooks-escape.test.ts | HOSTILE |
| Testes | tests/hooks-events-adapter.test.ts | COMPACT |
| Testes | tests/hooks-fallback-block.test.ts | HOOKS |
| Testes | tests/hooks-graph-hint.test.ts | — |
| Testes | tests/hooks-graph-update.test.ts | — |
| Testes | tests/hooks-guard-docs.test.ts | BUILD |
| Testes | tests/hooks-identity.test.ts | — |
| Testes | tests/hooks-matcher.test.ts | CANONICAL |
| Testes | tests/hooks-permissive.test.ts | CORPUS, runGuard |
| Testes | tests/hooks-raw-command.test.ts | SYNTHETIC_DIR, HOOKS_WITHOUT_BLOCK, declaredCommand |
| Testes | tests/hooks-resolve.test.ts | — |
| Testes | tests/hooks-scripts-file.test.ts | QUARANTINE |
| Testes | tests/hooks-shim.test.ts | — |
| Testes | tests/hooks-skills-project.test.ts | — |
| Testes | tests/hooks-translate.test.ts | CORPUS |
| Testes | tests/hooks-upstream-context-mode.test.ts | — |
| Testes | tests/hooks-wrapper-context.test.ts | — |
| Testes | tests/local-run.test.ts | ROOT |
| Testes | tests/manifest.test.ts | NPM_SUBSYSTEMS |
| Testes | tests/mcp-confinement.test.ts | — |
| Testes | tests/mcp-environment.test.ts | — |
| Testes | tests/mcp-failure.test.ts | rootWithoutPermission |
| Testes | tests/mcp-fixtures.ts | disposableProject, emptyDirectory, projectWithoutClaudeCode, fileTree |
| Testes | tests/mcp-idempotent.test.ts | — |
| Testes | tests/mcp-parity.test.ts | viaCommandLine |
| Testes | tests/mcp-root.test.ts | — |
| Testes | tests/mcp-surface.test.ts | connect |
| Testes | tests/mcp-tool-full-parity.test.ts | — |
| Testes | tests/mcp-tool-install.test.ts | — |
| Testes | tests/mcp-tool-invalid-root.test.ts | — |
| Testes | tests/mcp-tool-missing-root.test.ts | — |
| Testes | tests/mcp-tool-target.test.ts | — |
| Testes | tests/models-backend-ausente.test.ts | — |
| Testes | tests/models-backend-recomendado.test.ts | — |
| Testes | tests/models-fixtures.ts | backendsFake, modelFake, ollamaPresent, capacityFake |
| Testes | tests/models-injetavel.test.ts | — |
| Testes | tests/models-local-nao-cabe.test.ts | — |
| Testes | tests/models-local-recomendado.test.ts | — |
| Testes | tests/models-ollama-ausente.test.ts | — |
| Testes | tests/models-override-backend.test.ts | — |
| Testes | tests/models-override-local.test.ts | — |
| Testes | tests/models-override-parcial.test.ts | — |
| Testes | tests/models-paridade-real.test.ts | realOllamaList |
| Testes | tests/models-recommend-real.test.ts | — |
| Testes | tests/models-recommend.test.ts | — |
| Testes | tests/models-sem-credencial.test.ts | CREDENTIAL_VARIABLES |
| Testes | tests/pinning.test.ts | PINNED |
| Testes | tests/plan-approval.test.ts | project, PLAN, plansIn |
| Testes | tests/plan-assemble.test.ts | profile, FULL, EMPTY |
| Testes | tests/plan-command.test.ts | — |
| Testes | tests/plan-store.test.ts | project, PLAN |
| Testes | tests/recommend-context-window.test.ts | — |
| Testes | tests/recommend-fixtures.ts | GB, BIG_SMALL_WINDOW, SMALL_BIG_WINDOW, countingReader |
| Testes | tests/recommend-relato.test.ts | — |
| Testes | tests/recommend-sem-tipo.test.ts | — |
| Testes | tests/rename-ci-workflow.test.ts | — |
| Testes | tests/rename-commit-convention.test.ts | — |
| Testes | tests/rename-completed-specs-untouched.test.ts | ROOT, walk, predatesRename, hashTree, EXPECTED_COMPLETED_SPECS_HASH |
| Testes | tests/rename-package-identity.test.ts | — |
<!-- specsfy:documentator:end -->

<!-- O bloco specsfy:documentator acima é o inventário mecânico gerado pelo Specsfy e é reescrito a cada build (findings/external/FIND-EXT-001). A documentação do projeto vive fora dele, a partir daqui. -->

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
| **Hooks & Editors** | `src/hooks/` | Translating Claude Code hooks (matcher by event/tools, script files in `.maestro/hooks/`, dispatch without wrapper), entry identity (`identity.ts`), context-mode projection from the upstream `hooks.json` (`upstream.ts`) and the runtime binary shim (`shim.ts`). |
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
