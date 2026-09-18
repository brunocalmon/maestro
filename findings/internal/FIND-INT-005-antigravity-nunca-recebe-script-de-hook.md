# FIND-INT-005 — O target `antigravity` nunca recebe nenhum script de hook, mesmo para eventos que ele suporta

| Campo | Valor |
| --- | --- |
| ID | FIND-INT-005 |
| Status | open |
| Alvo | maestro ≤ 2.1.29 — `src/setup/run.ts` (`adapter.settingsPath ? writeHookScripts(...) : { written: [], ... }`), `src/targets/antigravity.ts` (`settingsPath: null`) |
| Evidência | `tests/setup-write-gate.test.ts` (SPEC-0026, escrito ao materializar RED para AC-017): `runSetup({ target: "antigravity", ... })` nunca cria nenhum arquivo em `.maestro/hooks/*.sh`, nem para hooks cujo evento está em `antigravityAdapter.supportedEvents` (ex.: `setup-check`, evento `session-start`). `antigravityAdapter.formatHooks(...)` classifica esses hooks como `installed` (não `skipped`), mas essa classificação nunca chega a produzir um arquivo real no disco, porque `runSetup` condiciona a escrita de scripts à existência de `adapter.settingsPath`, que é sempre `null` para `antigravity`. |
| Mitigação local | Nenhuma — o maestro não afirma hoje que hooks funcionam de fato no target `antigravity`; SPEC-0026 (FR-005) só garante que `setup-gate` nunca é instalado lá, sem depender de nenhum hook antigravity estar realmente ativo. |
| Fix definitivo | Não avaliado. Precisa de decisão de produto: `antigravity` deveria ganhar um mecanismo real de execução de hooks (algum arquivo/config que ele de fato lê, análogo a `.claude/settings.json`), ou a intenção é que esse target nunca rode hooks automatizados e dependa só de `ensureInstructions`/conteúdo estático? Levar para `specs/backlog/` como item novo quando houver decisão. |
