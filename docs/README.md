[← Back to Root Homepage](../README.md)

---

# Technical Documentation Portal (`@brunocalmon/maestro`)

<!-- specsfy:documentator:start -->
## Visão geral

- Frameworks detectados: não identificados.
- Arquivos de código: 320.
- Arquivos de teste: 229.

## Roteiro

- [Arquitetura](architecture.md)
- [Aplicação](application.md)
- [Banco de dados](database.md)
- [Testes](testing.md)
- [Pacotes](packages.md)
<!-- specsfy:documentator:end -->

<!-- O bloco specsfy:documentator acima é o inventário mecânico gerado pelo Specsfy e é reescrito a cada build (findings/external/FIND-EXT-001). A documentação do projeto vive fora dele, a partir daqui. -->

## Overview

**Maestro** (`@brunocalmon/maestro`) is a CLI orchestrator and MCP Server that manages AI coding agents and development subsystems through a verifiable dependency contract. It functions as a control and coordination layer over existing tools (such as `pi`, `agy`, `claude`, `codex`, `goose`, `specsfy`, `context-mode`, and `code-review-graph`), without reimplementing their native capabilities.

The system operates under strict integrity and security guarantees:
- **Zero undeclared global installations**: Strict preference for local project subsystem copies or resolved environment binaries.
- **Approval Gates**: Requirement of explicit human confirmation before executing disk writes or spawning external agent subprocesses.
- **Isolation and determinism**: Offline LLM recommendation based on free RAM/GPU memory and context window requirements, non-destructive quarantine for divergent extensions, and structured telemetry without `stdout`/`stderr` secret capture.

### Project Metrics
- **TypeScript Source Files (`src/`)**: 45+ modules structured across 12 functional domains.
- **Test Files (`tests/`)**: 200 unit and integration test suites powered by Vitest.
- **Supported Agent Backends**: `pi`, `agy`, `claude`, `codex`, and `goose`.

---

## Documentation Roadmap

Navigate the technical documentation by topic area:

1. **[System Design & Architecture](architecture.md)**
   - 3-Layer dependency model, component diagrams, module relationships, and security boundary confinement.
2. **[Application & Source Modules (`src/`)](application.md)**
   - Detailed inventory of all 45+ TypeScript source files organized by functional domain and exported symbols.
3. **[Persistence & Data Storage](database.md)**
   - Schemas of `.maestro/` files (`config.yaml`, `approved-commands.json`, `extensions.json`, plans, and telemetry) with ER diagrams.
4. **[Architecture Decision Records (ADRs)](decisions.md)**
   - Record of formal design choices (`SPEC-0001` through `SPEC-0019`), rationale, and deliberate system boundaries.
5. **[Execution Flows & Diagrams](flows.md)**
   - Mermaid sequence and state diagrams covering `maestro setup`, `maestro plan`/`run`, and extension quarantine repair.
6. **[CLI & Interface Architecture](frontend.md)**
   - Headless CLI interface design, atomic TTY reader, JSON `stdin` stream fallbacks, and ANSI formatting.
7. **[Integrations & External Backends](integrations.md)**
   - Adapters for the 5 CLI agent backends, MCP STDIO server, local Ollama API probing, and Claude Code hook injection.
8. **[Test Suite & Quality Assurance](testing.md)**
   - Vitest deterministic testing strategy, mock environments, and inventory of all 200 test files.
9. **[Dependencies & Package Inventory](packages.md)**
   - Core production dependency roles and complete npm package inventory.
