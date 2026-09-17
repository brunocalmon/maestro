# FIND-INT-002 — `code-review-graph-update` só dispara em `Edit|Write|MultiEdit|NotebookEdit`; edições via Bash/MCP não atualizam o grafo

| Campo | Valor |
| --- | --- |
| ID | FIND-INT-002 |
| Status | fixed — arquivado em 2026-09-17 |
| Alvo | maestro 2.1.23 — `resources/hooks/code-review-graph-update.md` (evento `after-file-edit`) |
| Evidência | Grafo deste repositório parado em 2026-08-30 (branch `refactor/v1-cli-first`) até 2026-09-17, apesar de dezenas de edições; edições feitas por `sed -i`, heredocs e `git rm` via `Bash` não acionam o hook. |
| Mitigação local | Rodar `code-review-graph build/status` antes e `update --brief` + `detect-changes` depois de cada tarefa, explicitamente. |
| Fix definitivo | SPEC-0023 (release 2.1.24): `code-review-graph-update` em `PostToolUse` amplo com hash do working tree + `code-review-graph-stop` em `Stop`; `graph-hint` uma vez por sessão. |
