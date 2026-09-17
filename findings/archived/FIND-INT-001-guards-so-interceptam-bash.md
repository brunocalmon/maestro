# FIND-INT-001 — Guards só interceptam o tool `Bash`; shells via MCP e subagentes passam sem guarda

| Campo | Valor |
| --- | --- |
| ID | FIND-INT-001 |
| Status | fixed — arquivado em 2026-09-17 |
| Alvo | maestro 2.1.23 — `resources/hooks/guard-destructive.md`, `guard-secrets.md`, `protect-authorship.md` (evento `before-shell` → `matcher: Bash`; preâmbulo lê só `tool_input.command`) |
| Evidência | `src/hooks/claude-code.ts` (`MATCHER_MAP`), preâmbulo em `wrap()`; ferramentas observadas nesta máquina que executam shell fora do `Bash`: `mcp__…context-mode__ctx_execute`/`ctx_batch_execute` (`language: shell`), `mcp__terminal__run_in_terminal`, `mcp__…playwright__browser_run_code_unsafe`. |
| Mitigação local | Nenhuma até a entrega. |
| Fix definitivo | SPEC-0023 (release 2.1.24): preâmbulo extrai `command`/`code`+`language`/`commands[]`, guards com `tools: Bash|mcp__.*(execute|run_in_terminal|shell).*`; verificado com JSONs de `ctx_execute`, `ctx_batch_execute` e `run_in_terminal`, e ao vivo com subagente. |
