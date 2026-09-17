[← Back to Root Homepage](../README.md) | [Portal Index](README.md)

---

# Execution Flows of Maestro

<!-- specsfy:documentator:start -->
## Fluxo principal

```mermaid
flowchart LR
  Entrada --> Aplicação --> Saída
```

```mermaid
sequenceDiagram
  participant Cliente
  participant Aplicação
  Cliente->>Aplicação: requisição
```
<!-- specsfy:documentator:end -->

<!-- O bloco specsfy:documentator acima é o inventário mecânico gerado pelo Specsfy e é reescrito a cada build (findings/external/FIND-EXT-001). A documentação do projeto vive fora dele, a partir daqui. -->

## Flow Overview

**Maestro** operates as a strict pipeline of verification and execution. All primary workflows (setup, planning, execution, and repair) adhere to the principle of **preventive verification before state modification**, ensuring full user transparency over disk writes and process execution.

---

## 1. Bootstrapping and Reconciliation Flow (`maestro setup`)

`maestro setup` verifies whether hooks, skills, and the Specsfy framework are present on disk. When drift or missing files are detected, the system calculates an execution plan and requests human approval prior to applying changes.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Editor
    participant CLI as Maestro CLI / MCP
    participant Doctor as Drift Detector (doctor.ts)
    participant Gate as Approval Gate (src/approval/)
    participant Registry as Command Registry (.maestro/approved-commands.json)
    participant FS as Filesystem

    User->>CLI: maestro setup
    CLI->>Doctor: Probe hooks, skills, and Specsfy presence
    Doctor-->>CLI: Drift Report (missing or modified files)
    
    CLI->>Gate: Assemble dependency installation command plan
    Gate->>Registry: Check if exact argv was previously approved
    
    alt Command previously approved
        Registry-->>Gate: Approved (Bypass)
    else New command or modified argv
        Gate->>User: Render plan & prompt approval (TTY / JSON stdin)
        User-->>Gate: Response (Approved / Rejected)
    end

    alt Approval Granted
        Gate->>FS: Install 7 hooks into .claude/settings.json
        Gate->>FS: Deliver skills to .claude/skills/ and .agents/skills/
        Gate->>FS: Execute specsfy install --project <root>
        Gate->>FS: Synchronize & backfill .maestro/config.yaml
        Gate->>Registry: Record approved commands
        CLI-->>User: Success: Setup completed & recorded
    else Rejection or Malformed Input
        Gate-->>CLI: Write Permission Denied
        CLI-->>User: Aborted: No files were modified
    end
```

---

## 2. Multi-Agent Planning and Execution Flow (`maestro plan` / `maestro run`)

This workflow details the complete lifecycle from task specification to external CLI agent subprocess spawning and telemetry logging.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Host Agent
    participant PlanCmd as maestro plan
    participant Models as Model Recommender (src/models/)
    participant Gate as Approval Gate
    participant RunCmd as maestro run
    participant Spawner as CLI Spawner (cli-spawn.ts)
    participant AgentCLI as Subprocess CLI (pi/claude/goose)
    participant Telemetry as Telemetry Store (.maestro/telemetry/)

    User->>PlanCmd: maestro plan --task "Feature X"
    PlanCmd->>Models: Evaluate free memory & context window
    Models-->>PlanCmd: Deterministic LLM Recommendation
    PlanCmd->>Gate: Present Proposed Orchestration Plan
    User->>Gate: Approve Plan
    Gate->>PlanCmd: Save .maestro/plans/<execution-id>.json

    User->>RunCmd: maestro run <execution-id>
    RunCmd->>RunCmd: Load approved plan & render Agent Briefs
    
    loop For each planned agent (runtime: cli)
        RunCmd->>Gate: Prompt Individual Agent Spawn Gate
        User-->>Gate: Confirm Spawn
        Gate->>Spawner: Execute CLI Adapter under timeout
        Spawner->>AgentCLI: Spawn Subprocess (e.g. goose run ...)
        AgentCLI-->>Spawner: Return exit code & output
        Spawner->>Telemetry: Record structured metrics (Duration, Status, ExitCode)
    end

    RunCmd-->>User: Execution complete with telemetry report
```

---

## 3. Extension Management and Quarantine Repair State Diagram (`extension create` / `repair`)

The state diagram below illustrates extension integrity checking and the non-destructive quarantine recovery lifecycle:

```mermaid
stateDiagram-v2
    [*] --> Unmodified : maestro extension create
    Unmodified --> ChecksumRecorded : Compute SHA-256 & Insert HTML Anchors
    
    ChecksumRecorded --> VerifiedOK : maestro doctor (Hashes Match)
    ChecksumRecorded --> DriftDetected : External File Edit (Hash Mismatch)
    
    DriftDetected --> QuarantineCheck : maestro extension repair --name <name>
    
    QuarantineCheck --> Aborted : .maestro/quarantine/ Not Writable
    QuarantineCheck --> Quarantined : Move Divergent File to .maestro/quarantine/
    
    Quarantined --> Restored : Restore Registered Original Content
    Restored --> VerifiedOK
    Aborted --> DriftDetected
```
