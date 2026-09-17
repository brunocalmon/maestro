# Evidência: contrato dos hooks do Claude Code usado nesta spec

- Origem: comportamento observado nesta máquina (Claude Code 2.1.273) em 2026-09-17 e o `hooks/hooks.json` + scripts do context-mode 1.0.169 (`hooks/pretooluse.mjs`, `sessionstart.mjs`), que produzem JSON de saída para o Claude Code. Sem cópia de conteúdo.
- Data de acesso: 2026-09-17.

## Observado

| Evento | Entrada (stdin) | Saída usada | Observação local |
| --- | --- | --- | --- |
| `PreToolUse` | JSON com `session_id`, `tool_name`, `tool_input` | `exit 2` + stderr = bloqueio; stdout JSON `{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"…"}}` = contexto adicional | Bloqueio do `protect-authorship` e "hook additional context" do context-mode apareceram nesta sessão após a SPEC-0022 |
| `PostToolUse` | JSON com `tool_name`, `tool_input`, `tool_response` | stdout ignorado se vazio | — |
| `Stop` | JSON com `session_id`, `stop_hook_active` | — | context-mode usa para captura de fim de rodada |
| `SessionStart` | JSON com `session_id`, `source` | stdout = contexto injetado | `setup-check` usa stdout |

## Conclusão

- Existe `session_id` em todos os eventos: serve de chave para "uma vez por sessão".
- Contexto adicional em `PreToolUse` exige JSON em stdout com `hookSpecificOutput.additionalContext`; texto solto em stdout não é injetado nesse evento.
- Hooks configurados em `.claude/settings.json` do projeto valem para subagentes lançados por `Agent` (afirmação a confirmar por execução real na Fase final; não há como provar em teste unitário).
