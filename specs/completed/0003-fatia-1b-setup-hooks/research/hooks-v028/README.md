# Hooks da v0.2.8 consultados — 2026-08-24

## Proveniência

| Campo | Valor |
| --- | --- |
| Origem | Branch `archived` deste repositório, commit `aac477a` |
| Caminho original | `src/common_rules_server/resources/hooks/` |
| Licença | Código do próprio projeto |
| Natureza | Evidência informativa; a fonte normativa é o `spec.md` |

Cópias literais dos sete hooks que a fatia 1b redistribui. Servem para que o
comportamento seja portado a partir do que existiu, e não reinventado de
memória.

## Dimensionamento observado

| Arquivo em `archived` | Tamanho |
| --- | --- |
| `service/hook_service.py` | 494 linhas, 13 funções |
| `mcp_server.py` | 536 linhas |
| Os sete hooks somados | 7159 bytes |

Comparação: a fatia 1a inteira produziu 207 linhas em três módulos e rendeu 24
tarefas. Foi essa medição que motivou separar o servidor MCP para a fatia 1f.

## Os três hooks descartados

`orchestration-briefing`, `completion-gate` e `format-after-edit` não foram
copiados. Pressupõem o kit de 47 recursos removido na Phase 0, e orquestração
passou a ser território do `framework`. Seguem consultáveis em `archived`.
