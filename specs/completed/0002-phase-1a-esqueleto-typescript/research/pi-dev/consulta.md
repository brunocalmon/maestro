# Consulta a pi.dev — 2026-08-24

## Proveniência

| Campo | Valor |
| --- | --- |
| Origem | `https://pi.dev/` |
| Data de acesso | 2026-08-24 |
| Confirmação independente | `npm view @earendil-works/pi-coding-agent version description bin` |
| Licença | Não declarada na página; nenhum trecho foi copiado |

Nenhum conteúdo da página foi reproduzido. O que segue são identificadores
factuais, cada um confirmado contra o registro npm, que é fonte independente.

## Identidade do agente

| Fato | Valor |
| --- | --- |
| Pacote npm | `@earendil-works/pi-coding-agent` |
| Versão no registro em 2026-08-24 | 0.84.3 |
| Binário | `pi` |
| Modo print | `-p` |
| Saída estruturada | `--mode json` |

## Candidato descartado

`@mariozechner/pi` foi descartado. `npm view` descreve o pacote como
gerenciador de deployments vLLM em pods de GPU, e seu binário é `pi-pods`.
Não é o agente de codificação.

## Impacto na spec

A consulta refutou a premissa registrada em `R-001`. O backlog tratava quatro
ferramentas como dependências fixadas por npm sob os nomes `framework`,
`context-mode`, `pi.dev` e `code-review-graph`. A verificação mostrou que três
desses nomes estavam errados e que a categoria era uma só quando deveria ser
duas: `pi` é agente intercambiável, não subsistema, e pertence à camada 3 de
DEC-002.
