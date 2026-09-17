# FIND-INT-000 — Hooks do maestro nunca disparavam no Claude Code (`matcher` = nome do hook) e o merge apagava hooks de terceiros

| Campo | Valor |
| --- | --- |
| ID | FIND-INT-000 |
| Status | fixed — arquivado em 2026-09-17 |
| Alvo | maestro ≤ 2.1.22 — `src/hooks/claude-code.ts` (`matcher: h.name`), `src/setup/write.ts` (substituição do array por evento), wrapper consumindo stdin dos despachos, vocabulário de 4 eventos, caminho absoluto congelado |
| Evidência | `.claude/settings.json` deste repositório com `"matcher": "guard-destructive"` e caminho `common-rules-server`; `git diff` mostrando o `protect-authorship` manual (`matcher: Bash`) substituído; observação em `../dev-bootstrap`; `specs/completed/0022-hooks-do-maestro-validos-no-claude-code/research/`. |
| Mitigação local | — |
| Fix definitivo | SPEC-0022 (Complete, release 2.1.23): matcher por evento/`tools:`, scripts em `.maestro/hooks/`, merge por identidade, despacho sem wrapper, projeção do `hooks.json` do context-mode, shim de caminho, migração do formato inline. Verificado ao vivo: hook bloqueando comando na própria sessão. |
