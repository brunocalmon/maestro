# Findings

Registro de defeitos, contradições e limitações encontrados durante o trabalho
no maestro. Cada finding é um arquivo próprio, mantido enquanto o problema
existir.

| Pasta | Escopo | Como resolve |
| --- | --- | --- |
| `internal/` | Defeito ou lacuna do próprio maestro | Spec/backlog do maestro |
| `external/` | Defeito, contradição ou limitação em dependência externa (Specsfy, skills do matt-pocock, Claude Code, context-mode, code-review-graph…) | Issue/PR no repositório alvo; o maestro só mitiga localmente |
| `archived/` | Findings resolvidos (fix entregue ou upstream corrigido) | Movidos para cá com a referência do fix |

Cabeçalho obrigatório de cada finding:

| Campo | Valor |
| --- | --- |
| ID | `FIND-INT-NNN` ou `FIND-EXT-NNN` |
| Status | `open` \| `mitigated` \| `fixed` |
| Alvo | pacote/repositório e versão |
| Evidência | caminho:linha, comando e data |
| Mitigação local | o que o maestro faz enquanto o fix não chega |
| Fix definitivo | spec do maestro ou link da issue/PR upstream |

Regra: todo achado é documentado no momento em que aparece; quando o fix é
identificado e entregue, o arquivo é movido para `archived/` com a referência.
