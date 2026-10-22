# `former tool install --project <raiz>`: o instalador do framework, separado do `skills`

Data: 2026-08-30. Execução real, sem fixture, em diretório descartável (`git init` prévio).

## Comando

```bash
former tool install --project . --json
```

## Resultado (primeira execução, projeto vazio)

```json
{"changed": 34, "paths": [".project-context/Spec.md", ..., "AGENTS.md", "CLAUDE.md", ".agents/skills/framework-01-inbox", ...]}
```

- Código de saída: 0.
- Cria `.project-context/` (templates, `Spec.md`), `.agents/skills/` (20 diretórios, mesmo conjunto do `skills add removed-project-tool`, mas em `.agents/skills` e não em `.claude/skills`), `CLAUDE.md` e `AGENTS.md`.
- `CLAUDE.md`/`AGENTS.md` recebem um bloco gerenciado com marcadores próprios do instalador (`installer.js` grava `FRAMEWORK_START`/`FRAMEWORK_END` mais uma referência a `.project-context/Spec.md`); o conteúdo não é escrito pelo `common-rules`.
- Reexecução (`former tool install --project . --json` de novo, sem mudanças) devolve `{"changed":0,"paths":[]}` — idempotente, sem exigir flag adicional.

## O que este comando NÃO faz

Não escreve `.claude/skills/` — isso é exclusividade do instalador `skills` (ver `segunda-origem-oficial.md`). Os dois instaladores são independentes e cobrem diretórios diferentes.

## Consequência para o plano

Esta é uma terceira invocação real de subprocesso, com formato de opções e saída diferentes das duas chamadas ao `skills` (JSON estruturado em vez de TUI). Merece módulo próprio (`src/framework/install.ts` ou equivalente), com o mesmo padrão de `Executor` injetável já usado em `src/skills/install.ts`, mas com um parser mais simples por já vir em JSON.
