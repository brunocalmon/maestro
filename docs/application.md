# Aplicação e implementações

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
| Outras fontes | src/doctor.ts | DependencyResult, Report, Environment, NPM_SUBSYSTEMS, PYTHON_SUBSYSTEM, NPM_HINT, PYTHON_HINT, pick |
| Outras fontes | src/extensions/anchor.ts | anchorMarkers, insertAnchor, readAnchor, readAnchorRange, computeChecksum |
| Outras fontes | src/extensions/create.ts | TargetFileEnvironment, ROUTER_FILES, resolveTargetPath, EXTENSIONS_DIR, realTargetFileEnvironment, listPresentExtensionNames, CreateOptions, CreateResult |
| Outras fontes | src/extensions/diagnose.ts | DivergentArtifact, diagnoseExtensions |
| Outras fontes | src/extensions/registry.ts | ExtensionArtifact, ExtensionRegistry, ChecksumEnvironment, REGISTRY_PATH, realChecksumEnvironment, readExtensionRegistry, writeExtensionRegistry |
| Outras fontes | src/extensions/repair.ts | QuarantineEnvironment, QUARANTINE_DIR, realQuarantineEnvironment, RepairResult, repairExtension |
| Outras fontes | src/extensions/router.ts | buildRouterBlock, buildAgentsPointer, buildConfigLanguageBlock, buildConfigLanguagePointer |
| Outras fontes | src/hooks/claude-code.ts | TranslatedHook, EVENT_MAP, translateForClaudeCode, wrap, unwrap, FRAGMENT_START, FRAGMENT_END, PREAMBLE |
| Outras fontes | src/hooks/detect.ts | TARGET, KNOWN_TARGETS, detectTarget |
| Outras fontes | src/hooks/resolve.ts | shellQuote, resolveHookCommand |
| Outras fontes | src/hooks/source.ts | Hook, EVENTS, scalar, scriptFrom, readHook |
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
| Outras fontes | src/setup/record.ts | RecordEntry, SkillsRecordEntry, InstallRecord, RECORD_PATH, readRecord, writeRecord, entriesToRemove, matches |
| Outras fontes | src/setup/run.ts | TARGET_SETTINGS, SetupOptions, SetupResult, ensureRouterCandidates, ensureConfigLanguageRouterCandidate, ensureConfigYaml, BUNDLED_SKILLS, SKILL_TARGET_DIRS |
| Outras fontes | src/setup/write.ts | writeSettings, writeRecordFile, readRecordFile |
| Outras fontes | src/skills/deliver.ts | BundledSkillFile, readBundledSkill, SkillWriteEnvironment, realSkillWriteEnvironment, deliverBundledSkill |
| Outras fontes | src/skills/executor.ts | resolveSkillsBin, parseSkillNames, realSkillsExecutor, describeSkillsCommand |
| Outras fontes | src/skills/install.ts | TARGET_AGENT, buildSkillsAddArgs, InstallOptions, InstallResult, installSkills |
| Outras fontes | src/skills/inventory.ts | SKILLS_DIR, SkillsInspection, inspectSkills |
| Outras fontes | src/skills/record.ts | LOCK_PATH, LockEntry, SkillRecordEntry, SkillReportRow, SkillReport, GUARANTEE_NOTE, readLock, toRecordEntries |
| Outras fontes | src/skills/source.ts | OFFICIAL_SOURCE, OFFICIAL_SOURCES, resolveSource |
| Outras fontes | src/specsfy/executor.ts | resolveSpecsfyBin, SpecsfyJson, realSpecsfyExecutor, describeSpecsfyCommand |
| Outras fontes | src/specsfy/install.ts | buildSpecsfyInstallArgs, InstallOptions, InstallResult, installSpecsfy |
| Outras fontes | src/targets/adapter.ts | TargetEnvironment, DetectionResult, TargetAdapter |
| Outras fontes | src/targets/antigravity.ts | EVIDENCE |
| Outras fontes | src/targets/claude-code.ts | EVIDENCE |
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
| Testes | tests/doctor-missing.test.ts | — |
| Testes | tests/doctor-ok.test.ts | — |
| Testes | tests/extensions-checksum-ausente.test.ts | — |
| Testes | tests/extensions-conflito-nome.test.ts | — |
| Testes | tests/extensions-create-sobrevive-setup.test.ts | — |
| Testes | tests/extensions-diagnose-nome-diferente-do-alvo.test.ts | — |
| Testes | tests/extensions-doctor-divergencia.test.ts | — |
| Testes | tests/extensions-facade-nao-escreve.test.ts | — |
| Testes | tests/extensions-fixtures.ts | registryFake, checksumEnvFake, targetEnvFake |
| Testes | tests/extensions-new-recusado-hook.test.ts | — |
| Testes | tests/extensions-repair-quarentena-nao-gravavel.test.ts | — |
| Testes | tests/extensions-repair-quarentena.test.ts | realRegistryEnv, realTargetEnv |
| Testes | tests/extensions-router-agents-md.test.ts | — |
| Testes | tests/extensions-router-claude-md.test.ts | — |
| Testes | tests/hooks-blocking.test.ts | CORPUS, runGuard |
| Testes | tests/hooks-context-mode-comando.test.ts | CONTEXT_MODE_HOOKS |
| Testes | tests/hooks-corpus.test.ts | CORPUS |
| Testes | tests/hooks-escape.test.ts | HOSTILE |
| Testes | tests/hooks-permissive.test.ts | CORPUS, runGuard |
| Testes | tests/hooks-raw-command.test.ts | HOOKS_WITHOUT_BLOCK, declaredCommand |
| Testes | tests/hooks-resolve.test.ts | — |
| Testes | tests/hooks-translate.test.ts | CORPUS |
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
| Testes | tests/rename-setup-directory.test.ts | project, LEGACY_RECORD |
| Testes | tests/run-command.test.ts | — |
| Testes | tests/scripts.test.ts | — |
| Testes | tests/setup-antigravity.test.ts | — |
| Testes | tests/setup-bridge.test.ts | — |
| Testes | tests/setup-delivers-bundled-skill.test.ts | — |
| Testes | tests/setup-delivers-config-yaml.test.ts | — |
| Testes | tests/setup-dependency-resolution.test.ts | commandsIn |
| Testes | tests/setup-detect.test.ts | — |
| Testes | tests/setup-dryrun.test.ts | project |
| Testes | tests/setup-idempotent.test.ts | project |
| Testes | tests/setup-install.test.ts | project |
| Testes | tests/setup-jafeito-skills-specsfy.test.ts | fakeSpecsfyExecutor, specsfyExecutorThatThrowsIfCalled |
| Testes | tests/setup-record.test.ts | project |
| Testes | tests/setup-revert.test.ts | project |
| Testes | tests/setup-skills-sem-registro-anterior.test.ts | — |
| Testes | tests/setup-surface.test.ts | FORBIDDEN |
| Testes | tests/setup-writes.test.ts | project |
| Testes | tests/skills-confinamento.test.ts | — |
| Testes | tests/skills-conflito.test.ts | withConflict |
| Testes | tests/skills-deliver.test.ts | writeEnvFake |
| Testes | tests/skills-doctor-deriva.test.ts | divergentProject |
| Testes | tests/skills-doctor-garantia.test.ts | installedProject |
| Testes | tests/skills-doctor-presenca.test.ts | consistentProject |
| Testes | tests/skills-executor-real.test.ts | cleanRoot |
| Testes | tests/skills-fixtures.ts | SPECSFY_SET, MATTPOCOCK_SET, projectWithSkills, fileTree, replaceWithSymlink, fakeExecutor, writeLock, dualSourceExecutor |
| Testes | tests/skills-idempotente.test.ts | — |
| Testes | tests/skills-install-alvo.test.ts | — |
| Testes | tests/skills-install-copia.test.ts | — |
| Testes | tests/skills-install-falha.test.ts | — |
| Testes | tests/skills-install-parcial.test.ts | — |
| Testes | tests/skills-inventory-symlink.test.ts | — |
| Testes | tests/skills-nao-destrutivo.test.ts | — |
| Testes | tests/skills-registro-persistido.test.ts | writtenRecord |
<!-- specsfy:documentator:end -->
