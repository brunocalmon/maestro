[← Back to Root Homepage](../README.md) | [Portal Index](README.md)

---

# Test Suite and Quality Assurance of Maestro

<!-- specsfy:documentator:start -->
## Resumo

- Arquivos de teste: 234.
- Runner: Vitest.
- Scripts: prepare: node scripts/install-git-hooks.mjs; prebuild: node scripts/check-version-checksum.mjs; build: tsc; test:tdd: vitest run; verify: node scripts/cycle.mjs.

| Arquivo |
| --- |
| tests/agents-config-schema.test.ts |
| tests/agents-doctor.test.ts |
| tests/agents-read.test.ts |
| tests/agents-seed.test.ts |
| tests/approval-comando-argv-alterado.test.ts |
| tests/approval-comando-ja-aprovado.test.ts |
| tests/approval-command-fixtures.ts |
| tests/approval-documento-json-registro.test.ts |
| tests/approval-grava-no-registro.test.ts |
| tests/approval-plan-completo.test.ts |
| tests/approval-recusa-nao-grava.test.ts |
| tests/approval-registro-corrompido.test.ts |
| tests/approval-tty-read.test.ts |
| tests/aprovacao-contexto-canalizado.test.ts |
| tests/aprovacao-contexto-terminal.test.ts |
| tests/aprovacao-documento-aprova.test.ts |
| tests/aprovacao-documento-malformado.test.ts |
| tests/aprovacao-documento-recusa.test.ts |
| tests/aprovacao-documento-sem-campo.test.ts |
| tests/aprovacao-entrada-vazia.test.ts |
| tests/aprovacao-fixtures.ts |
| tests/aprovacao-fonte-injetada.test.ts |
| tests/aprovacao-formas-equivalentes.test.ts |
| tests/aprovacao-libera-escrita.test.ts |
| tests/aprovacao-padrao-producao.test.ts |
| tests/aprovacao-plano-apresentado.test.ts |
| tests/aprovacao-plano-fiel.test.ts |
| tests/aprovacao-recusa-preserva.test.ts |
| tests/aprovacao-sem-alvo.test.ts |
| tests/aprovacao-sem-mudanca.test.ts |
| tests/backends-ausencia-nao-afeta-saida.test.ts |
| tests/backends-convivencia-status.test.ts |
| tests/backends-detector-injetavel.test.ts |
| tests/backends-determinismo-misto.test.ts |
| tests/backends-fixtures.ts |
| tests/backends-lista-fixa-sem-sondagem.test.ts |
| tests/backends-nao-suportado-presente.test.ts |
| tests/backends-paridade-real.test.ts |
| tests/backends-suportados-presentes.test.ts |
| tests/backends-versao-sem-help.test.ts |
| tests/bridge-ausente-do-plano.test.ts |
| tests/bridge-real.test.ts |
| tests/budget.test.ts |
| tests/build.test.ts |
| tests/cli-approval-real.test.ts |
| tests/cli-backends-adapter.test.ts |
| tests/cli-behavior-file.test.ts |
| tests/cli-help.test.ts |
| tests/cli-run-gate.test.ts |
| tests/cli-run-tools.test.ts |
| tests/cli-select.test.ts |
| tests/cli-setup-drift-real.test.ts |
| tests/cli-setup-real.test.ts |
| tests/cli-spawn.test.ts |
| tests/cli-symlink.test.ts |
| tests/config-backfill.test.ts |
| tests/config-router-block.test.ts |
| tests/config-schema.test.ts |
| tests/config-sync.test.ts |
| tests/config-write.test.ts |
| tests/context-window.test.ts |
| tests/cycle-command.test.ts |
| tests/cycle-failure.test.ts |
| tests/cycle-timings.test.ts |
| tests/delegation-behavior.test.ts |
| tests/delegation-brief.test.ts |
| tests/delegation-fixtures.ts |
| tests/delegation-runtime.test.ts |
| tests/doctor-camada-agent-texto.test.ts |
| tests/doctor-cli-nomeia-extensao-divergente.test.ts |
| tests/doctor-documentation-issues.test.ts |
| tests/doctor-maestro-layer.test.ts |
| tests/doctor-missing.test.ts |
| tests/doctor-ok.test.ts |
| tests/doctor-subsystems.test.ts |
| tests/documentation-diagnose.test.ts |
| tests/extensions-checksum-ausente.test.ts |
| tests/extensions-conflito-nome.test.ts |
| tests/extensions-create-sobrevive-setup.test.ts |
| tests/extensions-diagnose-nome-diferente-do-alvo.test.ts |
| tests/extensions-doctor-divergencia.test.ts |
| tests/extensions-facade-nao-escreve.test.ts |
| tests/extensions-fixtures.ts |
| tests/extensions-foreign-sections.test.ts |
| tests/extensions-migrate-direction.test.ts |
| tests/extensions-new-recusado-hook.test.ts |
| tests/extensions-repair-quarentena-nao-gravavel.test.ts |
| tests/extensions-repair-quarentena.test.ts |
| tests/extensions-router-agents-md.test.ts |
| tests/extensions-router-claude-md.test.ts |
| tests/helpers-spec-0022.ts |
| tests/helpers-spec-0023.ts |
| tests/helpers-spec-0024.ts |
| tests/hooks-any-shell-guards.test.ts |
| tests/hooks-blocking.test.ts |
| tests/hooks-context-mode-comando.test.ts |
| tests/hooks-corpus.test.ts |
| tests/hooks-dispatch.test.ts |
| tests/hooks-escape.test.ts |
| tests/hooks-events-adapter.test.ts |
| tests/hooks-fallback-block.test.ts |
| tests/hooks-graph-hint.test.ts |
| tests/hooks-graph-update.test.ts |
| tests/hooks-guard-docs.test.ts |
| tests/hooks-identity.test.ts |
| tests/hooks-matcher.test.ts |
| tests/hooks-permissive.test.ts |
| tests/hooks-raw-command.test.ts |
| tests/hooks-resolve.test.ts |
| tests/hooks-scripts-file.test.ts |
| tests/hooks-shim.test.ts |
| tests/hooks-skills-project.test.ts |
| tests/hooks-translate.test.ts |
| tests/hooks-upstream-context-mode.test.ts |
| tests/hooks-wrapper-context.test.ts |
| tests/local-run.test.ts |
| tests/manifest.test.ts |
| tests/mcp-confinement.test.ts |
| tests/mcp-environment.test.ts |
| tests/mcp-failure.test.ts |
| tests/mcp-fixtures.ts |
| tests/mcp-idempotent.test.ts |
| tests/mcp-parity.test.ts |
| tests/mcp-root.test.ts |
| tests/mcp-surface.test.ts |
| tests/mcp-tool-full-parity.test.ts |
| tests/mcp-tool-install.test.ts |
| tests/mcp-tool-invalid-root.test.ts |
| tests/mcp-tool-missing-root.test.ts |
| tests/mcp-tool-target.test.ts |
| tests/models-backend-ausente.test.ts |
| tests/models-backend-recomendado.test.ts |
| tests/models-fixtures.ts |
| tests/models-injetavel.test.ts |
| tests/models-local-nao-cabe.test.ts |
| tests/models-local-recomendado.test.ts |
| tests/models-ollama-ausente.test.ts |
| tests/models-override-backend.test.ts |
| tests/models-override-local.test.ts |
| tests/models-override-parcial.test.ts |
| tests/models-paridade-real.test.ts |
| tests/models-recommend-real.test.ts |
| tests/models-recommend.test.ts |
| tests/models-sem-credencial.test.ts |
| tests/pinning.test.ts |
| tests/plan-approval.test.ts |
| tests/plan-assemble.test.ts |
| tests/plan-command.test.ts |
| tests/plan-store.test.ts |
| tests/recommend-context-window.test.ts |
| tests/recommend-fixtures.ts |
| tests/recommend-relato.test.ts |
| tests/recommend-sem-tipo.test.ts |
| tests/rename-ci-workflow.test.ts |
| tests/rename-commit-convention.test.ts |
| tests/rename-completed-specs-untouched.test.ts |
| tests/rename-package-identity.test.ts |
| tests/rename-setup-directory.test.ts |
| tests/run-command.test.ts |
| tests/scripts.test.ts |
| tests/setup-antigravity.test.ts |
| tests/setup-bridge.test.ts |
| tests/setup-check-configured.test.ts |
| tests/setup-delivers-bundled-skill.test.ts |
| tests/setup-delivers-config-yaml.test.ts |
| tests/setup-dependency-resolution.test.ts |
| tests/setup-detect.test.ts |
| tests/setup-documentation-extension.test.ts |
| tests/setup-dryrun.test.ts |
| tests/setup-idempotent.test.ts |
| tests/setup-install.test.ts |
| tests/setup-installers-always.test.ts |
| tests/setup-instructions-direction.test.ts |
| tests/setup-jafeito-skills-specsfy.test.ts |
| tests/setup-merge-settings.test.ts |
| tests/setup-migrate-inline-hooks.test.ts |
| tests/setup-next-steps.test.ts |
| tests/setup-readme-homepage.test.ts |
| tests/setup-record.test.ts |
| tests/setup-revert.test.ts |
| tests/setup-skills-sem-registro-anterior.test.ts |
| tests/setup-state-dir.test.ts |
| tests/setup-surface.test.ts |
| tests/setup-writes.test.ts |
| tests/skills-canonical-agents.test.ts |
| tests/skills-confinamento.test.ts |
| tests/skills-conflito.test.ts |
| tests/skills-deliver.test.ts |
| tests/skills-doctor-deriva.test.ts |
| tests/skills-doctor-garantia.test.ts |
| tests/skills-doctor-presenca.test.ts |
| tests/skills-executor-real.test.ts |
| tests/skills-fixtures.ts |
| tests/skills-idempotente.test.ts |
| tests/skills-install-alvo.test.ts |
| tests/skills-install-copia.test.ts |
| tests/skills-install-falha.test.ts |
| tests/skills-install-parcial.test.ts |
| tests/skills-inventory-symlink.test.ts |
| tests/skills-nao-destrutivo.test.ts |
| tests/skills-projection.test.ts |
| tests/skills-registro-persistido.test.ts |
| tests/skills-registro.test.ts |
| tests/skills-segunda-origem.test.ts |
| tests/skills-source-arbitraria.test.ts |
| tests/skills-source-oficial.test.ts |
| tests/skills-source-terceiro.test.ts |
| tests/specsfy-install-alvo.test.ts |
| tests/specsfy-install-falha.test.ts |
| tests/specsfy-install-idempotente.test.ts |
| tests/specsfy-install-real.test.ts |
| tests/surface.test.ts |
| tests/task-types-config.test.ts |
| tests/telemetry-record.test.ts |
| tests/telemetry-report.test.ts |
| tests/telemetry-store.test.ts |
| tests/trace-doctor-relata.test.ts |
| tests/trace-doctor-sem-registro.test.ts |
| tests/trace-execucoes-distintas.test.ts |
| tests/trace-fixtures.ts |
| tests/trace-forma.test.ts |
| tests/trace-gerador-deterministico.test.ts |
| tests/trace-gerador-vazio.test.ts |
| tests/trace-hooks-e-skills.test.ts |
| tests/trace-instante-epoca.test.ts |
| tests/trace-instante-injetado.test.ts |
| tests/trace-marca-execucao.test.ts |
| tests/trace-no-relato.test.ts |
| tests/trace-opacidade.test.ts |
| tests/trace-padrao-producao.test.ts |
| tests/trace-registro-antigo.test.ts |
| tests/trace-relogio-deterministico.test.ts |
| tests/trace-sem-epoca.test.ts |
| tests/version.test.ts |
<!-- specsfy:documentator:end -->

<!-- O bloco specsfy:documentator acima é o inventário mecânico gerado pelo Specsfy e é reescrito a cada build (findings/external/FIND-EXT-001). A documentação do projeto vive fora dele, a partir daqui. -->

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
