# Evidência: ferramentas que executam shell ou editam arquivos fora do tool `Bash`

- Origem: catálogo de ferramentas exposto nesta sessão do Claude Code 2.1.273 (2026-09-17), lido do próprio prompt de ferramentas; e `node_modules/context-mode/hooks/hooks.json` (context-mode 1.0.169, ELv2 — só estrutura).
- Data de acesso: 2026-09-17. Licença: não aplicável (observação local).

## Ferramentas observadas

| Ferramenta | Campo com o comando/código | Executa shell? | Coberta pelos guards hoje? |
| --- | --- | --- | --- |
| `Bash` | `tool_input.command` | sim | sim (`matcher: Bash`) |
| `mcp__plugin_context-mode_context-mode__ctx_execute` | `tool_input.code` + `tool_input.language` (`shell`, `javascript`, `python`) | sim, quando `language: shell` | não |
| `mcp__plugin_context-mode_context-mode__ctx_batch_execute` | `tool_input.commands[]` | sim | não |
| `mcp__terminal__run_in_terminal` | `tool_input.command` | sim | não |
| `mcp__plugin_playwright_playwright__browser_run_code_unsafe` | `tool_input.code` | JS no browser; não é shell | não (fora do escopo dos guards) |
| `Edit`, `Write`, `MultiEdit`, `NotebookEdit` | `tool_input.file_path` | não | `code-review-graph-update` (PostToolUse) |
| `Agent` (subagente) | — | as ferramentas do subagente disparam os mesmos hooks do projeto | a confirmar em execução real |

## O que o context-mode já cobre no upstream

`PreToolUse` em `Bash`, `WebFetch`, `Read`, `Grep`, `Agent`, `mcp__…ctx_*`, `mcp__`; `PostToolUse` amplo. Não cobre `mcp__terminal__*` nem playwright.

## Conclusão

1. O comando pode chegar em `command`, `code` ou `commands[]`; `language` distingue shell de outras linguagens no `ctx_execute`.
2. Um regex de ferramenta `Bash|mcp__.*(execute|run_in_terminal|shell)` cobre as ferramentas de shell observadas sem capturar o playwright.
3. Edições via `Bash` (heredoc, `sed -i`, `git rm`) não são detectáveis pelo nome da ferramenta; só pela mudança no working tree.
