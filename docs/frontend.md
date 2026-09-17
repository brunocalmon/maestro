[← Back to Root Homepage](../README.md) | [Portal Index](README.md)

---

# CLI Architecture and Interface Design

<!-- specsfy:documentator:start -->
## Superfícies observadas

- Componentes, páginas ou views: 0.
- Tailwind: não identificado.
- Tokens CSS: não identificados.

| Arquivo |
| --- |
| Nenhuma superfície frontend identificada |
<!-- specsfy:documentator:end -->

<!-- O bloco specsfy:documentator acima é o inventário mecânico gerado pelo Specsfy e é reescrito a cada build (findings/external/FIND-EXT-001). A documentação do projeto vive fora dele, a partir daqui. -->

## Interface Overview

**Maestro** is a strictly **Headless** application (command-line interface and protocol server). It **does not contain** a graphical web interface, React components, HTML pages, CSS stylesheets, or visual utility frameworks such as TailwindCSS.

The user interface consists of two operational surfaces:
1. **CLI Surface (Headless Command Line)**: Executed directly by users or scripts in terminal environments via the `maestro` command.
2. **MCP Server Surface (STDIO)**: Communication via JSON-RPC 2.0 over standard input and output for editor integrations (e.g. Claude Code, Antigravity IDE).

---

## CLI / TTY Interface Architecture

```
                    ┌─────────────────────────────────────────┐
                    │       User / Editor in Terminal         │
                    └────────────────────┬────────────────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
              Interactive Mode (TTY)           Non-Interactive Mode (JSON / Pipe)
             ┌───────────────────────┐       ┌───────────────────────────────┐
             │ Atomic Synchronous TTY │       │ Stream Payload Reader (stdin) │
             │ (src/approval/tty.ts) │       │ (src/approval/decide.ts)      │
             └───────────┬───────────┘       └───────────────┬───────────────┘
                         │                                   │
                         └───────────────┬───────────────────┘
                                         ▼
                         ┌───────────────────────────────┐
                         │   Report Renderer & ANSI      │
                         │   Terminal Output Formatting  │
                         │   (src/approval/render.ts)    │
                         └───────────────────────────────┘
```

---

## Interface Subsystem Breakdown

### 1. Atomic Synchronous TTY Reader (`src/approval/tty-read.ts`)
When Maestro is invoked in an interactive terminal (`isInteractive = true`), plan approval is prompted on the command line.
- **Mechanism**: Utilizes a native synchronous reader (`readTtyLine`) executing atomic input reads from `/dev/tty`, preventing event loop deadlocks in Node.js.
- **Retry Handling**: Manages micro-delays (`RETRY_DELAY_MS`) to ensure accurate character capture without CPU spinning.

### 2. Stream Channel Fallbacks (`src/approval/context.ts`)
In CI/CD pipelines or when Maestro commands are chained via shell pipes:
- **Automatic Detection**: `resolveChannel` detects the absence of an interactive TTY.
- **JSON Payload via stdin**: Approvals are parsed from JSON documents streamed over standard input. Empty, null, or malformed payloads default to immediate rejection.

### 3. Terminal Renderer and ANSI Styling (`src/approval/render.ts`, `src/telemetry/render.ts`)
Output printed to the terminal is formatted for human scannability:
- **Health Report (`maestro doctor`)**: Tabular alignment with clear status indicators (`ok`, `divergent`, `missing`).
- **Approval Plans (`maestro plan`)**: Hierarchical display of dependency commands to be executed, featuring ANSI color highlighting for binaries and arguments.
- **Telemetry Report (`maestro report`)**: Clean summary of execution metrics, durations, and subprocess exit codes.
