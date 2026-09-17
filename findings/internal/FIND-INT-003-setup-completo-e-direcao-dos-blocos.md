# FIND-INT-003 — "Setup completo" não verifica configuração; blocos do maestro na direção inversa à do Specsfy

| Campo | Valor |
| --- | --- |
| ID | FIND-INT-003 |
| Status | open — parte resolvida: direção dos blocos e interceptação do matt-pocock entregues pela SPEC-0024 (release 2.1.25); permanece a parte do critério de setup completo e do SessionStart (BACKLOG-0013) |
| Alvo | maestro 2.1.23 — `resources/hooks/setup-check.md` (critério `.maestro/install.json` + `.specsfy/`), `src/extensions/router.ts` (conteúdo em `CLAUDE.md`, ponteiro em `AGENTS.md`), `src/setup/readme.ts` ("initializes Specsfy") |
| Evidência | Relato do usuário em `../dev-bootstrap` (2026-09-17): `specsfy-setup` e `setup-matt-pocock-skills` nunca executadas e nenhum aviso; Specsfy escreve conteúdo em `AGENTS.md` e `@.specsfy/Spec.md` em `CLAUDE.md`, o maestro faz o oposto; matt-pocock edita só `CLAUDE.md`. |
| Mitigação local | Executar `/specsfy-setup` e `/setup-matt-pocock-skills` manualmente após o `maestro setup`. |
| Fix definitivo | BACKLOG-0012 (direção dos blocos, `@AGENTS.md`, interceptação do matt-pocock) e BACKLOG-0013 (critério de configurado, `SessionStart` orientando, doctor orquestrador). |
