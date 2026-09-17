# Evidência: sub-doctors disponíveis e rastros de configuração

- Origem: execução local em 2026-09-17 dos CLIs instalados (`node_modules/@promovaweb/specsfy/bin/specsfy.cjs doctor`, `node_modules/.bin/context-mode --help`, `node_modules/skills/bin/cli.mjs --help`, `code-review-graph --help`) e leitura de `src/doctor.ts`, `resources/hooks/setup-check.md`, `src/setup/run.ts`. Sem cópia de conteúdo protegido.

## Sub-doctors

| Subsistema | Comando | O que cobre | Exit em falha |
| --- | --- | --- | --- |
| Specsfy | `specsfy doctor --project <raiz>` | node, git, npm, `npx skills`, projeto gravável (só pré-requisitos) | ≠0 |
| context-mode | `context-mode doctor` | runtime, hooks, FTS5, versão | ≠0 |
| skills (vercel-labs) | `skills list` | skills instaladas por diretório e origem (sem doctor) | ≠0 |
| code-review-graph | `code-review-graph status` | existência e estatísticas do grafo; avisa branch/commit divergente | ≠0 sem grafo |

Nenhum deles verifica se `specsfy-setup` ou `setup-matt-pocock-skills` foram executados.

## Rastros que as skills conversacionais deixam

| Skill | Rastros |
| --- | --- |
| `specsfy-setup` | `PROJECT.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/DATABASE.md`, `.specsfy/USER-PROFILE.md`, `INTERFACE.md`, `DESIGNSYSTEM.MD` |
| `setup-matt-pocock-skills` | seção `## Agent skills` (em `AGENTS.md` após a SPEC-0024) e `docs/agents/*.md` |

## Doctor atual do maestro

`inspectDependencies` (npm/python/agent), `reportSkills`, `readTrace`, `diagnoseExtensions` (checksum dos blocos), `diagnoseAgents`; exit 1 em dependência ausente, skill divergente, extensão ou perfil divergentes; nada sobre hooks, direção dos blocos, projeções, rastros de configuração ou sub-doctors.

## Conclusao

1. Os sub-doctors existem e são executáveis por subprocesso com timeout; o do Specsfy não cobre configuração.
2. "Configurado" só pode ser derivado dos rastros das skills conversacionais mais os blocos esperados.
3. O `setup-check` atual avisa só por `install.json` + `.specsfy/`.
