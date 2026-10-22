# Backlog: Orchestrator monta times multi-agente dinâmicos e delega para CLIs externas

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0009 |
| Status | Promoted (épico — todas as seis fatias MA-1 a MA-6 entregues; ver decomposição) |
| Produto | common-rules / maestro |
| Épico | Orquestração multi-agente configurável (Phase 3, sucessora da Phase 2 já entregue) |
| Funcionalidade | Perfis de subagent configuráveis, planejamento com aprovação humana, execução híbrida (nativa da IDE ou subprocesso CLI) |
| Tipo | épico |
| Prioridade | Desbloqueada — Phase 1 e Phase 2 fechadas (`SPEC-0001` a `SPEC-0013`); sem prazo externo |
| Milestones | |
| Criado em | 2026-09-06 |
| Spec promovida | MA-1 → specs/completed/0015-... (Complete, 2026-09-06); MA-2 → specs/completed/0016-plano-de-orquestracao-e-aprovacao-humana/spec.md (Complete, 2026-09-07); MA-3 → specs/completed/0017-recomendacao-de-modelo-com-janela-de-contexto-e-tipo-de-tarefa/spec.md (Complete, 2026-09-07); MA-4 → specs/completed/0018-briefing-de-delegacao-para-subagent-nativo/spec.md (Complete, 2026-09-07); MA-5 → specs/completed/0019-execucao-via-subprocesso-de-cli-externa/spec.md (Complete, 2026-09-07); MA-6 → specs/completed/0020-telemetria-multi-agente/spec.md (Complete, 2026-09-07) |

## Ideia original

O Orchestrator monta times dinâmicos de 3 a 9 instâncias operacionais sob demanda, ou atua em modo solo. Tem liberdade para escolher subagents nativos da IDE ou subprocessos CLI de agentes externos (pi.dev, aider, goose, agy), injetando regras dinamicamente, rodando em modo headless, definindo o modelo por subprocesso, com hierarquia de reporte centralizada e aprovação obrigatória do plano antes de executar.

## Problema percebido

Declaração original: o Orchestrator não tinha capacidade de delegar dinamicamente para múltiplas instâncias especializadas ou para CLIs de terceiros, limitando paralelismo e escolha de modelo por subtarefa.

## Pessoa afetada ou beneficiada

Quem usa o common-rules/maestro para orquestrar tarefas de codificação complexas que se beneficiariam de paralelismo ou de ferramentas CLI externas especializadas.

## Resultado ou valor esperado

Orquestração híbrida de IAs locais e na nuvem, com relatório único ao humano e aprovação obrigatória do plano antes da execução.

## Contexto

Sobreposição real com decisões já vinculantes: SPEC-0002/DEC-002 fixa três subsistemas orquestrados sem pi.dev; SPEC-0008 já entrega detecção de backends de agente; SPEC-0010 já entrega aprovação em lote de comandos. backlog-0003 já classificou esse tema como Phase 2+ sem desenho.

## Referências relacionadas

| Caminho | Relação |
| --- | --- |
| `specs/inbox/2026-09-06-212859-orchestrator-monta-times-multi-agente-dinamicos-3-9-instancias-e-delega-para-clis-externas.md` | origem — captura formal desta anotação |
| `specs/inbox/2026-08-24-191151-reestruturacao-mcp-para-cli-com-orchestrator-multi-agente.md` | origem original — texto completo, 2026-08-24 |
| `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md:34` | limita — classifica "multi-agente orchestration" como Phase 2+, sem desenho |
| `specs/completed/0002-phase-1a-esqueleto-typescript/spec.md` | limita — DEC-002 fixa três subsistemas orquestrados (framework, context-mode, code-review-graph); `pi` não é dependência fixada |
| `specs/completed/0008-fatia-1d-deteccao-backends/spec.md` | relacionada — já entrega detecção de backends de agente (CLIs externas) sem instalar globalmente |
| `specs/completed/0010-fatia-1i-aprovacao-em-lote-comandos/spec.md` | relacionada — já entrega aprovação em lote de comandos; possível sobreposição com "aprovação obrigatória do plano" |
| `specs/completed/0006-fatia-1g-telemetria-trace-id/spec.md` | relacionada — trace_id já existe, possível base para rastrear execução multi-agente |

## Comportamento esperado

O maestro (agente mestre) sempre começa qualquer trabalho não trivial montando
um **plano de orquestração** — de um subagent só (modo singleton, ele mesmo)
a múltiplos, sem faixa numérica fixa — e o apresenta ao humano para aprovação
antes de executar qualquer coisa. O plano nomeia quais subagents serão usados
(perfis já configurados ou criados ad-hoc), qual modelo cada um usará, se a
execução é via subagent nativo da IDE ou via subprocesso de CLI externa, e
propõe alternativas quando fizer sentido (ex: "esta opção otimiza custo",
"esta aumenta precisão, custando mais", "esta é um meio-termo"). O humano lê,
entende as motivações e pode aprovar, pedir mudança ou recusar — nunca o
maestro presume e começa sozinho.

`.maestro/config.yaml` guarda, opcionalmente, uma lista de **perfis de
subagent** nomeados pela pessoa. Cada perfil pode declarar qualquer
combinação de: nome, modelo, referência a um arquivo Markdown de
`behavior`/`additional-behaviour` (instrução própria da pessoa, substituindo
ou estendendo o comportamento padrão), e ferramentas permitidas. O próprio
maestro também é configurável dessa forma — pode ter seu próprio `behavior`
sobrescrito ou estendido. **Cada propriedade**, não o perfil inteiro, carrega
uma flag independente de **sugestão** (o maestro considera no planejamento,
mas pode propor algo diferente, sempre explicando o trade-off) ou
**obrigatória** (não negociável — se configurada assim, o maestro tem que
respeitar ou usar outro agente/perfil, nunca ignorar). Sem nenhuma
configuração, tudo assume o default de fábrica: usa o recurso disponível
(nativo da IDE quando existir, senão subprocesso CLI), sempre com o modelo
mais econômico disponível, e sempre espera aprovação humana.

Quando a IDE/ferramenta hospedeira não oferece subagents nativos, a única
via possível é o orchestrator próprio do maestro (subprocesso CLI headless,
como `pi.dev`/`aider`/`goose`, com `-p`/`--mode json`, injetando regras via
`AGENTS.md` temporário ou parâmetros).

## Regras de negócio

- O maestro nunca inicia execução multi-agente (ou mesmo delegação a um
  único subagent) sem apresentar o plano e obter aprovação humana explícita
  — nenhuma suposição implícita, em nenhuma circunstância.
- O tamanho do time (1 = singleton, ou N subagents) é decidido pelo
  planejamento, tarefa a tarefa; não existe faixa numérica fixa no sistema
  (decisão rodada 2 — "3 a 9" do texto original de 24/08 era ilustrativo).
- pi.dev/aider/goose/agy nunca são dependência npm fixada pelo projeto — são
  apenas detectados no ambiente, mesma regra já vigente na fatia 1d
  (`SPEC-0008`); `DEC-002` da `SPEC-0002` não muda (decisão rodada 4).
- A aprovação do plano de orquestração é um gate próprio, distinto da
  aprovação em lote de comandos de dependência já entregue pela `SPEC-0010`
  (decisão rodada 3) — não reaproveita aquele mecanismo.
- A recomendação de modelo por subagent estende `recommend()` (`SPEC-0009`)
  com janela de contexto e tipo de tarefa como novos critérios, em vez de
  duplicar a lógica de seleção de modelo em um mecanismo paralelo (decisão
  rodada 5).
- Um perfil de subagent em `.maestro/config.yaml` pode declarar qualquer
  subconjunto de `name`, `model`, `behavior`/`additional-behaviour` (arquivo
  Markdown), `tools` — nenhuma combinação é obrigatória.
- Cada propriedade de um perfil carrega individualmente uma flag
  `suggested`/`required` (nome exato a decidir na especificação); uma
  propriedade `required` é vinculante — se o maestro não puder respeitá-la
  com o perfil configurado, ele usa outro perfil ou cria um subagent ad-hoc,
  nunca ignora a restrição.
- O maestro pode, a qualquer momento, optar por criar um subagent ad-hoc em
  vez de usar um perfil configurado, desde que explique o motivo no plano
  apresentado ao humano.

## Critérios de aceitação

A especificar por fatia (ver decomposição abaixo); o brief garante decisão
sobre cada ponto listado em "Regras de negócio", mas os cenários Given/When/
Then concretos nascem em cada `spec.md` de fatia, não neste backlog.

## Qualidades e operação

- **Governança**: toda decisão de execução passa por aprovação humana
  explícita — nenhum caminho de execução autônoma sem esse gate.
- **Auditoria**: cada execução multi-agente deveria ficar correlacionável
  (hipótese: estender o `trace_id` já entregue pela `SPEC-0006` para cobrir
  múltiplos subagents de uma mesma orquestração — decisão técnica adiada
  para a fatia de telemetria).
- Segurança e privacidade: a avaliar por fatia — subprocessos CLI externos
  rodando com acesso ao projeto têm superfície de risco maior que subagents
  nativos da IDE; a fatia de execução via CLI externa precisa tratar isso
  explicitamente.
- Desempenho: não avaliado nesta rodada — depende de decisões técnicas ainda
  não tomadas (paralelismo real vs sequencial, limites de recursos).

## Dependências

- Phase 1 e Phase 2 completas (`SPEC-0001` a `SPEC-0013`) — confirmado.
- `SPEC-0009` (`recommend()`) — estendida, não substituída.
- `SPEC-0008` (detecção de backends) — reaproveitada para localizar CLIs
  externas no ambiente.
- `SPEC-0006` (trace_id) — hipótese de extensão para telemetria multi-agente.

## Situações de erro

- A especificar por fatia — nenhuma decidida nesta rodada de backlog.

## Escopo

- **Dentro**: planejamento de orquestração com aprovação humana obrigatória;
  perfis de subagent configuráveis em `.maestro/config.yaml` com
  propriedades por-flag (sugestão/obrigatória); execução via subagent nativo
  da IDE quando disponível; execução via subprocesso CLI externo quando não
  houver alternativa nativa; extensão de `recommend()` com janela de
  contexto e tipo de tarefa.
- **Fora**: fixar pi.dev/aider/goose como dependência npm; reaproveitar o
  gate de aprovação em lote da `SPEC-0010` para planos de orquestração;
  faixa numérica fixa de tamanho de time; qualquer decisão de nome exato de
  propriedade do schema de config (`suggested`/`required` ou equivalente,
  `behavior`/`additional-behaviour` — nomes de trabalho, não finais) — essas
  nascem na especificação técnica de cada fatia.

## Dúvidas, decisões e riscos

**Decisões tomadas nesta rodada**

- **D1**: subagents podem ser nativos da IDE OU subprocesso CLI externo,
  configurável, não uma escolha binária de arquitetura — rodada 1.
- **D2**: tamanho de time é decisão do planejamento, sem faixa fixa — rodada 2.
- **D3**: aprovação do plano de orquestração é gate próprio, distinto da
  aprovação em lote de comandos (`SPEC-0010`) — rodada 3.
- **D4**: pi.dev/aider/goose continuam apenas detectados, nunca fixados como
  dependência; `DEC-002` não muda — rodada 4.
- **D5**: recomendação de modelo estende `recommend()` (`SPEC-0009`) em vez
  de duplicar — rodada 5.
- **D6**: perfis de subagent em `.maestro/config.yaml` são flexíveis por
  completo — qualquer combinação de propriedades, cada uma com flag própria
  de sugestão/obrigatória; o próprio maestro também é configurável dessa
  forma; o planejamento escolhe entre perfil nomeado e criação ad-hoc,
  sempre explicando a escolha ao humano — rodada 6.
- **D7**: dado o tamanho revelado (comparável ao épico inteiro já entregue),
  este item vira um épico próprio, decomposto em fatias menores — rodada 7.

**Risco identificado, não resolvido nesta rodada**

- O nome exato das flags de propriedade (`suggested`/`required` são nomes de
  trabalho usados nesta entrevista, não decisão final de schema) e o formato
  exato do arquivo de `behavior` referenciado por um perfil ficam para a
  especificação técnica da fatia de configuração — риsco de retrabalho se a
  fatia de planejamento for especificada antes da fatia de configuração.

## Decomposição proposta em fatias

Nenhuma promovida ainda; ordem sugerida por dependência real (perfis de
subagent precisam existir enquanto conceito antes do planejamento poder
referenciá-los; execução depende do planejamento já ter decidido o quê
executar):

1. **Fatia MA-1 — Schema e leitura de `.maestro/config.yaml`** — *entregue em `SPEC-0015`, `Complete` em 2026-09-06*: perfis de
   subagent (nome, modelo, behavior via Markdown, tools, flag por
   propriedade), incluindo o próprio maestro como um perfil configurável.
   Fundação: nada mais funciona sem isso existir como conceito lido e
   validado.
2. **Fatia MA-2 — Planejamento de orquestração e aprovação humana** — *entregue em `SPEC-0016`, `Complete` em 2026-09-07*: o
   maestro monta o plano (singleton ou múltiplo, perfil ou ad-hoc, modelo
   recomendado), apresenta alternativas com trade-offs, e obtém aprovação
   explícita antes de prosseguir. Depende de MA-1 para saber quais perfis
   existem (mas funciona com defaults se `.maestro/config.yaml` estiver
   ausente ou vazio).
3. **Fatia MA-3 — Extensão de `recommend()` com contexto e tipo de tarefa** — *entregue em `SPEC-0017`, `Complete` em 2026-09-07*:
   adiciona os dois critérios novos à seleção de modelo existente
   (`SPEC-0009`). Pode andar em paralelo com MA-2.
4. **Fatia MA-4 — Execução via subagent nativo da IDE** — *promovida em `SPEC-0018`, `Planned` em 2026-09-07; entregue como emissão de briefing de delegação, não como acionamento direto — a CLI não tem acesso ao mecanismo de subagent da ferramenta hospedeira*: aciona o mecanismo
   nativo (ex: Agent tool do Claude Code) quando o plano aprovado escolher
   essa via. Depende de MA-2.
5. **Fatia MA-5 — Execução via subprocesso CLI externo**: spawn headless
   (`-p`/`--mode json`), injeção de regras via `AGENTS.md` temporário ou
   parâmetros, captura de saída, para quando o plano aprovado escolher essa
   via ou a IDE não tiver alternativa nativa. Depende de MA-2 e reaproveita
   a detecção da `SPEC-0008`.
6. **Fatia MA-6 — Telemetria multi-agente**: correlaciona execução de uma
   orquestração inteira (possivelmente estendendo `trace_id` da
   `SPEC-0006`). Depende de MA-4 e/ou MA-5 já existirem para ter o que
   telemetrar.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros — para o épico
      como um todo; cada fatia aprofunda o próprio Ato I na especificação.
- [x] Permissões, regras e exceções relevantes estão claras nas decisões
      D1–D7 acima.
- [ ] O resultado pode ser verificado objetivamente — pendente por fatia,
      nasce nos critérios de aceite de cada `spec.md`.
- [ ] Segurança, privacidade e desempenho foram avaliados conforme o risco —
      pendente, em especial para MA-5 (execução via CLI externa).
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

Diagnóstico: o épico como um todo está maduro o bastante para nomear e
sequenciar fatias, mas nenhuma fatia individual está pronta para
`Definition Gate: Passed` sem sua própria rodada de descoberta técnica — os
nomes de propriedade do schema (MA-1) e o formato exato do plano apresentado
ao humano (MA-2) são decisões que ainda precisam de uma conversa dedicada.

## Próximo passo

Especificar `MA-1` primeiro — fundação técnica de que as demais fatias
dependem conceitualmente (perfil de subagent precisa existir como conceito
lido antes do planejamento poder referenciá-lo); ordem escolhida por
dependência, não por preferência declarada.
