# Evidência: hooks upstream do context-mode

- Origem: `node_modules/context-mode/hooks/hooks.json` (pacote npm `context-mode` 1.0.169, dependência local do maestro).
- Data de acesso: 2026-09-17.
- Licença: Elastic License 2.0 (ELv2). Por isso esta nota registra somente a estrutura observada (evento → matcher → script), sem copiar o arquivo.
- Propósito: provar que o vocabulário de 4 eventos do maestro e o matcher por nome não reproduzem a instalação que o próprio context-mode faz.

## Estrutura observada

| Evento Claude Code | Matcher | Script |
| --- | --- | --- |
| PreToolUse | `Bash` | `hooks/pretooluse.mjs` |
| PreToolUse | `WebFetch` | `hooks/pretooluse.mjs` |
| PreToolUse | `Read` | `hooks/pretooluse.mjs` |
| PreToolUse | `Grep` | `hooks/pretooluse.mjs` |
| PostToolUse | `Bash\|Read\|Write\|Edit\|NotebookEdit\|Glob\|Grep\|TodoWrite\|TaskCreate\|TaskUpdate\|EnterPlanMode\|ExitPlanMode\|Skill\|Agent\|AskUserQuestion\|EnterWorktree\|mcp__` | `hooks/posttooluse.mjs` |
| PreCompact | `""` | `hooks/precompact.mjs` |
| SessionStart | — | `hooks/sessionstart.mjs` |
| UserPromptSubmit | — | `hooks/userpromptsubmit.mjs` |
| Stop | — | `hooks/stop.mjs` |

Os scripts leem o JSON do evento pelo stdin (`hooks/run-hook.mjs`).

## Conclusão

1. Todo matcher é um nome de ferramenta ou regex de nomes de ferramenta; nenhum é um nome de hook.
2. O context-mode precisa de eventos (`PreCompact`, `UserPromptSubmit`) e ferramentas (`Read`, `Grep`, `WebFetch`) que o vocabulário canônico atual do maestro (`before-shell`, `after-file-edit`, `stop`, `session-start`) não expressa.
3. Os scripts dependem do stdin; o wrapper do maestro (`HOOK_INPUT=$(cat)`) o consome antes de executar o fragmento.
