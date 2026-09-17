# FIND-INT-004 — Marcador órfão `<!-- common-rules:extension:router:start -->` em `CLAUDE.md` deste repositório

| Campo | Valor |
| --- | --- |
| ID | FIND-INT-004 |
| Status | open |
| Alvo | maestro ≤ 2.1.25 — `CLAUDE.md` deste repositório (linhas 4–5 em `HEAD`), resquício da renomeação `common-rules → maestro` (SPEC-0014) |
| Evidência | `git show HEAD:CLAUDE.md` mostra `<!-- common-rules:extension:router:start -->` seguido de `## common-rules` sem marcador de fim; a migração da SPEC-0024 não o toca (não é bloco do maestro nem assinatura conhecida), então ele permanece como texto solto que o Claude Code lê. |
| Mitigação local | Remoção manual das duas linhas quando a pessoa responsável autorizar; nenhuma ação automática porque não há assinatura registrada. |
| Fix definitivo | BACKLOG-0013: o doctor reporta marcadores de abertura/fechamento sem par em `CLAUDE.md`/`AGENTS.md`, com os prefixos históricos (`common-rules:`) na lista. |
