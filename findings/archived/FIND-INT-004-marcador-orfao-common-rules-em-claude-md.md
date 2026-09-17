# FIND-INT-004 — Marcador órfão `<!-- common-rules:extension:router:start -->` em `CLAUDE.md` deste repositório

| Campo | Valor |
| --- | --- |
| ID | FIND-INT-004 |
| Status | fixed — arquivado em 2026-09-17 |
| Alvo | maestro ≤ 2.1.25 — `CLAUDE.md` deste repositório (linhas 4–5 em `HEAD`), resquício da renomeação `common-rules → maestro` (SPEC-0014) |
| Evidência | `git show HEAD:CLAUDE.md` mostra `<!-- common-rules:extension:router:start -->` seguido de `## common-rules` sem marcador de fim; a migração da SPEC-0024 não o toca (não é bloco do maestro nem assinatura conhecida), então ele permanece como texto solto que o Claude Code lê. |
| Mitigação local | Removido manualmente em 2026-09-17, com autorização, como parte do fechamento da SPEC-0025. |
| Fix definitivo | SPEC-0025 (release 2.1.28): `assessConfiguration`/`diagnoseMaestro` detectam qualquer marcador `<!-- prefixo:...:start/end -->` sem par, não só `maestro:`, e reportam como `FAIL`; o próprio marcador órfão deste repositório foi removido de `CLAUDE.md` como verificação real. |
