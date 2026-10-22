# Especificação integrada: Plano de orquestracao e aprovacao humana

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0016 |
| Slug | 0016-plano-de-orquestracao-e-aprovacao-humana |
| Status | Complete |
| Effort | 6 |
| Effort rationale | Comando novo com quatro peças (montagem do esqueleto, renderização, gate de aprovação, persistência), integrando três mecanismos já entregues (`recommend` da SPEC-0009, canal de decisão da SPEC-0007, trace da SPEC-0006) e um recém-entregue (perfis da SPEC-0015). Sem execução de agente, sem rede, sem concorrência — o que segura o esforço é a superfície, não a profundidade. Faixa `standard` alta, mesma da MA-1. |
| Effort updated at | 2026-09-07 |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — comando de terminal e um artefato JSON; a apresentação do plano é texto em stdout, sem tela. |
| Atualizada em | 2026-09-07 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A `SPEC-0015` entregou perfis de agente configuráveis: o projeto sabe ler,
validar e relatar quem poderia trabalhar. Nada consome isso. Não existe um
passo que olhe uma tarefa, junte o que está disponível — perfis, backends
detectados, modelos que cabem na memória — e proponha quem faria o quê, e
não existe gate que obrigue aprovação humana antes de qualquer delegação.

A regra central do épico (`BACKLOG-0009`) é que **o maestro nunca inicia
execução sem apresentar o plano e obter aprovação explícita**. Sem esta
fatia, essa regra não tem onde morar: as fatias de execução (MA-4, MA-5)
chegariam sem nada que as obrigue a passar por um humano, e a garantia
viraria convenção de prompt em vez de comportamento verificável.

#### Resultado desejado

`maestro plan --task "<descrição>"` monta um plano candidato a partir do que
o código consegue determinar sem adivinhar, apresenta-o, e só devolve um
plano aprovado depois de decisão humana explícita. A aprovação persiste em
`.maestro/plans/<trace-id>.json`, para as fatias de execução consumirem o que
foi de fato aprovado em vez de replanejarem por conta própria.

O código não finge cognição: o esqueleto propõe sempre um agente e anexa os
candidatos que detectou; decompor a tarefa em mais agentes é refinamento do
agente que lê a saída, guiado pelo `behavior.md` semeado pela `SPEC-0015`.

#### Métricas de sucesso

- Rodar `maestro plan --task "..."` num projeto configurado produz um plano com agente, modelo recomendado e runtime viável, sem nenhum campo inventado quando a informação não existe no ambiente.
- Recusa, ausência de resposta e entrada malformada não produzem plano aprovado nem arquivo em `.maestro/plans/`.
- Um plano aprovado existe em disco com o mesmo `trace-id` que a execução relatou, legível por outro comando sem replanejar.

### 2. Research e esclarecimentos

#### Researchs executados

- Nenhum research externo. O desenho vem da entrevista desta sessão (6 perguntas numeradas, registradas em `Dúvidas respondidas`) e da inspeção dos mecanismos já entregues.

#### Fontes e contexto consultados

- `src/approval/decide.ts` — `DecisionSource`, `realSource(channel, stdin)`, `interpret()` e `ApprovalResult`; o canal que a `SPEC-0007` entregou trata TTY, documento JSON por stdin, ausência e malformado como negativa.
- `src/approval/render.ts`, `src/approval/plan.ts` — como o `setup` apresenta o que fará antes de escrever.
- `src/models/recommend.ts` — `recommend(backends, ollama, capacity, override)` devolvendo `Recommendation` com `backend`, `localModel`, `freeBytesConsidered` e `report`; a fatia usa como está, sem estendê-la (isso é MA-3).
- `src/agents/read.ts`, `src/agents/profile.ts` — `readAgentConfig(root)` devolvendo `{ maestro, subagents }` validados (`SPEC-0015`).
- `src/backends/detect.ts` — detecção dos backends de agente (`SPEC-0008`).
- `src/telemetry/trace.ts` — `TraceSource` com `now()`/`id()` injetáveis e `generateId()`; a fatia reusa o identificador em vez de criar numeração própria.
- `src/cli.ts` — tabela de comandos e o padrão de `USAGE_*`/`--help` seguido por cada comando.

#### Documentação consultada

- Nenhuma documentação externa.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo. O levantamento inteiro é inspeção do próprio repositório, citada com caminho relativo acima.

#### Dúvidas respondidas

- **Q**: Quem monta o plano — o código ou o agente? → **A**: o CLI monta o esqueleto determinístico (perfis, backends, modelo recomendado, runtime viável) e o agente refina e apresenta; o código não finge cognição (rodada 1).
- **Q**: O gate reaproveita o canal de decisão da `SPEC-0007`? → **A**: sim, com conteúdo próprio — o canal é mecânica de como se pergunta a um humano, independente do que se pergunta (rodada 2).
- **Q**: Onde a fatia aparece? → **A**: comando novo `maestro plan`, só no CLI; o servidor MCP continua com a tool `setup` única, decisão da `SPEC-0004` não reaberta aqui (rodada 3).
- **Q**: O que acontece com o plano aprovado? → **A**: persistido em `.maestro/plans/<trace-id>.json`, para MA-4/MA-5 lerem em vez de replanejar (rodada 4).
- **Q**: Como a tarefa chega ao comando? → **A**: argumento obrigatório `--task`; ausente, o comando recusa em voz alta (rodada 5).
- **Q**: Que time o esqueleto determinístico propõe? → **A**: sempre singleton, com os candidatos anexados; decompor é decisão do agente ao refinar (rodada 6).

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Comando `maestro plan --task "<descrição>"`, com `--help` no mesmo padrão dos demais.
- Montagem determinística do esqueleto: um agente, modelo recomendado, runtime viável, e os candidatos detectados anexados.
- Apresentação do plano em texto legível antes da decisão.
- Gate de aprovação reusando o canal da `SPEC-0007` (TTY interativo ou documento JSON por stdin).
- Persistência do plano aprovado em `.maestro/plans/<trace-id>.json`.

#### Fora de escopo

- Qualquer execução do plano — nativa ou por subprocesso (fatias MA-4 e MA-5).
- Estender `recommend()` com janela de contexto e tipo de tarefa (fatia MA-3); esta fatia consome a versão atual.
- Decompor a tarefa em múltiplos agentes por conta do código (decisão rodada 6).
- Tool nova no servidor MCP (decisão rodada 3).
- Reabrir a whitelist de comandos da `SPEC-0010`: aprovar um plano de orquestração não aprova comando de dependência nenhum (`D3` do épico).
- Casamento textual entre a descrição da tarefa e o `identity.description` dos perfis.

#### Atores

- **Pessoa que decide**: lê o plano apresentado, aprova, recusa ou não responde; sua decisão é a única coisa que transforma um candidato em plano aprovado.
- **Agente que refina**: lê a saída do comando e a usa como ponto de partida, ajustando recorte e alternativas conforme o `behavior.md`; não é quem aprova.
- **Fatias de execução (MA-4, MA-5)**: consumidoras do artefato persistido; dependem de ele descrever exatamente o que foi aprovado.

### 4. Princípios e restrições do projeto

- **PR-001**: Nenhuma delegação começa sem aprovação humana explícita — recusa, silêncio e entrada malformada são negativa, nunca consentimento (`SPEC-0007`, `DEC-002`).
- **PR-002**: O código não finge cognição: o que não dá para determinar sem entender a tarefa fica como candidato anexado, não como decisão tomada.
- **PR-003**: O plano apresentado é o mesmo que será persistido — não uma descrição paralela que possa divergir (`SPEC-0007`).
- **PR-004**: Nada é escrito fora da raiz do projeto (`SPEC-0003`).
- **PR-005**: Recusar em vez de adivinhar diante de estado não confirmável (`SPEC-0004`, `DEC-002`).

### 5. Histórias de usuário

#### US-001 — Decidir antes que qualquer agente trabalhe (P1)

Como pessoa que usa o maestro, quero ver quem trabalharia na minha tarefa,
com qual modelo e por qual via, e aprovar ou recusar antes de qualquer
execução, para que nenhuma delegação aconteça sem eu ter decidido.

**Por que P1**: é a garantia central do épico; sem ela as fatias de execução não têm gate.
**Teste independente**: rodar `maestro plan --task "..."` e confirmar que o plano aparece, que recusar não grava nada, e que aprovar deixa `.maestro/plans/<trace-id>.json` legível.
**Requisitos**: FR-001, FR-002, FR-003, FR-004

### 6. Cenários BDD de aceite

#### AC-001 — o comando exige a tarefa

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-001
Feature: entrada do comando plan

  Scenario: invocação sem --task
    Given um projeto configurado
    When a pessoa roda maestro plan sem informar --task
    Then o comando recusa explicando que a tarefa é obrigatória
    And nenhum plano é apresentado ou gravado
```

#### AC-002 — o comando publica seu uso

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-002
Feature: entrada do comando plan

  Scenario: pedido de ajuda
    Given qualquer projeto
    When a pessoa roda maestro plan --help
    Then o uso do comando é impresso
    And o código de saída é zero
```

#### AC-013 — flag desconhecida é recusada, não ignorada

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-013
Feature: entrada do comando plan

  Scenario: opção que o comando não reconhece
    Given um projeto configurado
    When a pessoa roda maestro plan --task "x" --modo-turbo
    Then o comando recusa nomeando a opção desconhecida
    And nenhum plano é apresentado ou gravado
```

#### AC-003 — o esqueleto propõe um agente com o que foi detectado

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-003
Feature: montagem do esqueleto

  Scenario: plano candidato num projeto configurado
    Given um projeto com a seção maestro presente e um backend detectado
    When o esqueleto é montado para uma tarefa
    Then ele propõe exatamente um agente
    And nomeia o perfil, o modelo recomendado e o runtime desse agente
```

#### AC-004 — o esqueleto não inventa o que não detectou

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-004
Feature: montagem do esqueleto

  Scenario: ambiente sem backend nem modelo local
    Given um projeto onde nenhum backend de agente foi detectado
    When o esqueleto é montado
    Then o modelo recomendado aparece como ausente, declarado
    And nenhum nome de modelo ou backend é inventado
```

#### AC-005 — os candidatos detectados ficam anexados ao plano

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-005
Feature: montagem do esqueleto

  Scenario: material para o agente refinar
    Given um projeto com perfis configurados e backends detectados
    When o esqueleto é montado
    Then o plano carrega a lista de perfis disponíveis
    And carrega os backends detectados, para o agente refinar sobre eles
```

#### AC-006 — o plano é apresentado antes da decisão

**Cobre**: US-001, FR-003, NFR-001

```gherkin
@US-001 @FR-003 @NFR-001 @AC-006
Feature: gate de aprovação

  Scenario: apresentação legível
    Given um plano candidato montado
    When ele é renderizado para a pessoa
    Then o texto nomeia o agente, o modelo e o runtime propostos
    And declara que nada será executado sem aprovação
```

#### AC-007 — aprovar produz o plano aprovado

**Cobre**: US-001, FR-003, FR-004

```gherkin
@US-001 @FR-003 @FR-004 @AC-007
Feature: gate de aprovação

  Scenario: decisão positiva
    Given um plano candidato apresentado
    When a decisão recebida é de aprovação
    Then o comando devolve o plano como aprovado
    And grava o artefato em .maestro/plans/
```

#### AC-008 — recusar não grava nada

**Cobre**: US-001, FR-003, FR-004, NFR-002

```gherkin
@US-001 @FR-003 @FR-004 @NFR-002 @AC-008
Feature: gate de aprovação

  Scenario: decisão negativa
    Given um plano candidato apresentado
    When a decisão recebida é de recusa
    Then nenhum arquivo aparece em .maestro/plans/
    And o comando sai com código diferente de zero
```

#### AC-009 — resposta ausente ou malformada é negativa

**Cobre**: US-001, FR-003, NFR-002

```gherkin
@US-001 @FR-003 @NFR-002 @AC-009
Feature: gate de aprovação

  Scenario: entrada que não é uma decisão
    Given um plano candidato apresentado
    When a entrada padrão traz um documento malformado ou nada
    Then o resultado é tratado como recusa
    And nada é gravado
```

#### AC-010 — o plano aprovado é identificado pelo trace da execução

**Cobre**: US-001, FR-004, NFR-001

```gherkin
@US-001 @FR-004 @NFR-001 @AC-010
Feature: persistência do plano aprovado

  Scenario: identificador do artefato
    Given uma execução aprovada com um identificador de execução
    When o artefato é gravado
    Then o nome do arquivo é o identificador dessa execução
    And o conteúdo declara o mesmo identificador
```

#### AC-011 — o gravado é o mesmo que foi apresentado

**Cobre**: US-001, FR-004, NFR-001

```gherkin
@US-001 @FR-004 @NFR-001 @AC-011
Feature: persistência do plano aprovado

  Scenario: plano apresentado e plano gravado
    Given um plano candidato apresentado e aprovado
    When o artefato é lido de volta
    Then o agente, o modelo e o runtime gravados são os que foram apresentados
```

#### AC-012 — o artefato é legível sem replanejar

**Cobre**: US-001, FR-004, NFR-001

```gherkin
@US-001 @FR-004 @NFR-001 @AC-012
Feature: persistência do plano aprovado

  Scenario: consumo pelas fatias de execução
    Given um plano aprovado gravado em .maestro/plans/
    When ele é lido pelo identificador
    Then o plano volta com a mesma forma que foi gravada
    And nenhuma montagem de esqueleto é necessária para lê-lo
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O CLI deve expor o comando `plan`, exigindo `--task "<descrição>"`; sem a tarefa, deve recusar em voz alta explicando o que falta, sem apresentar nem gravar plano; `--help` deve imprimir o uso e sair com zero; uma flag que o comando não reconhece deve ser recusada nomeando-a, nunca ignorada em silêncio, no mesmo padrão de `SETUP_FLAGS`.
- **FR-002**: A montagem do esqueleto deve produzir exatamente um agente proposto, com perfil, modelo recomendado e runtime; deve anexar os candidatos detectados (perfis configurados e backends) para o agente refinar; e deve declarar ausência quando o ambiente não oferece modelo ou backend, nunca inventando nome.
- **FR-003**: O plano candidato deve ser apresentado em texto legível antes de qualquer decisão, e a decisão deve ser obtida pelo canal já entregue pela `SPEC-0007` — TTY interativo quando houver terminal, documento JSON por stdin quando não houver; recusa, ausência e entrada malformada são negativa.
- **FR-004**: Um plano aprovado deve ser gravado em `.maestro/plans/<trace-id>.json`, com o mesmo identificador que a execução reporta e o mesmo conteúdo que foi apresentado; uma decisão negativa não deve gravar arquivo algum; o artefato deve ser legível de volta pelo identificador, sem exigir nova montagem.

#### Não funcionais

- **NFR-001**: O plano apresentado, o plano gravado e o plano lido de volta descrevem o mesmo agente, modelo e runtime — nenhuma divergência entre as três formas. **Verificação**: casos que comparam a estrutura apresentada com a lida de volta, e inspeção do conteúdo gravado.
- **NFR-002**: Nenhum caminho leva a um plano aprovado sem decisão positiva explícita, e nenhuma falha de entrada é interpretada como consentimento. **Verificação**: casos de recusa, ausência e malformado confirmando ausência de artefato e código de saída diferente de zero.

#### Erros e casos-limite

- `--task` ausente ou vazio → recusa nomeando o que falta (AC-001).
- Seção `maestro:` ausente ou inválida no `config.yaml` → a leitura da `SPEC-0015` já recusa em voz alta; o comando propaga essa recusa em vez de planejar sobre estado parcial.
- Nenhum backend detectado e nenhum modelo local disponível → o plano é montado mesmo assim, declarando as ausências (AC-004); planejar não exige ambiente completo, executar é que vai exigir.
- `.maestro/plans/` inexistente na primeira aprovação → criado; escrever nunca falha por diretório ausente.
- Dois planos aprovados na mesma execução → impossível por construção, já que o identificador vem da execução; o caso existe para deixar explícito que o nome do arquivo não é sequencial nem sobrescreve o anterior.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

`src/approval/decide.ts` expõe `realSource(channel, stdin)` e `interpret()`,
que já tratam TTY, documento JSON, ausência e malformado — a `SPEC-0007`
resolveu a mecânica da decisão. `src/models/recommend.ts` devolve
`Recommendation` a partir de backends, snapshot do ollama e capacidade.
`src/agents/read.ts` devolve `{ maestro, subagents }` já validados
(`SPEC-0015`). `src/telemetry/trace.ts` fornece `TraceSource` injetável com
`now()` e `id()`. `src/cli.ts` mantém a tabela de comandos e o padrão
`USAGE_*` com `--help`.

#### Arquitetura e módulos

- `src/plan/model.ts` (novo): tipos do plano — `PlannedAgent` (perfil, modelo, runtime), `OrchestrationPlan` (tarefa, agentes, candidatos anexados, trace) e `ApprovedPlan`.
- `src/plan/assemble.ts` (novo): função pura que recebe perfis, backends e recomendação e devolve o esqueleto; sem I/O, para o caso de "ambiente vazio" ser exercitável sem simular máquina.
- `src/plan/render.ts` (novo): texto apresentado à pessoa, derivado do mesmo objeto que será gravado (`PR-003`).
- `src/plan/store.ts` (novo): `writeApprovedPlan(root, plan)` e `readApprovedPlan(root, traceId)`; `PLANS_DIR = ".maestro/plans"`.
- `src/plan/run.ts` (novo): orquestra a fatia — lê perfis, detecta backends, recomenda, monta, renderiza, decide pelo canal da `SPEC-0007`, grava quando aprovado.
- `src/cli.ts`: `USAGE_PLAN`, entrada `plan` na tabela de comandos e o parsing de `--task`.

#### Migrations

- Não aplicável.

#### Models

- `PlannedAgent`: `{ profile: string; model: string | null; runtime: "auto" | "native" | "cli" }`. Invariante: `model` é `null` quando nada foi detectado, nunca string vazia disfarçando ausência.
- `OrchestrationPlan`: `{ trace: string; createdAt: string; task: string; agents: PlannedAgent[]; candidates: { profiles: string[]; backends: string[] } }`. Invariante: `agents` tem exatamente um item na montagem determinística.
- `ApprovedPlan`: `OrchestrationPlan & { approvedAt: string }`.

#### Controllers e casos de uso

- Não aplicável — CLI, sem camada de controller.

#### Views e experiência

- Não aplicável — texto em stdout, sem tela.

#### Queries e repositórios

- Não aplicável.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/draft/0016-plano-de-orquestracao-e-aprovacao-humana/
  spec.md
src/
  plan/model.ts
  plan/assemble.ts
  plan/render.ts
  plan/store.ts
  plan/run.ts
  cli.ts
tests/
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| `OrchestrationPlan` | `trace` | tarefa, agentes, candidatos, instante; um agente na montagem determinística | referencia perfis lidos da `SPEC-0015` |
| `ApprovedPlan` | `trace` | o plano mais `approvedAt` | gravado em `.maestro/plans/<trace>.json` |
| `PlannedAgent` | `profile` dentro do plano | `model` nulo declara ausência; `runtime` no domínio fechado | pertence a um plano |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Plano | candidato | decisão positiva | aprovado e gravado | conteúdo gravado idêntico ao apresentado |
| Plano | candidato | recusa, ausência ou malformado | descartado | nenhum arquivo em `.maestro/plans/` |

#### Migração e retenção

- Sem expiração automática de planos gravados, mesma razão da quarentena da `SPEC-0011` (`D7`): expirar implicaria apagar, e apagar histórico de aprovação não é decisão do sistema.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não. A entrega é um comando de terminal e um artefato JSON; a apresentação do plano é texto em stdout.

#### Stack e convenções de interface

- Não aplicável.

#### Telas e responsabilidades

- Não aplicável.

#### Fluxo de informação e navegação

- Não aplicável.

#### Menus e navegação principal

- Não aplicável.

#### Formulários e ações

- Não aplicável.

#### Composição e disposição

- Não aplicável.

#### Blocos React e componentes selecionados

- Não aplicável.

#### Estados e acessibilidade

- Não aplicável.

#### Contrato CRUD

- Não aplicável.

#### Revisão visual durante o desenvolvimento

- Não aplicável — nenhuma superfície visual nesta entrega.

#### APIs expostas

- `maestro plan --task "<descrição>"` — apresenta o plano, obtém decisão, grava quando aprovado; sai com zero na aprovação e diferente de zero na recusa.
- `assemblePlan(profiles, backends, recommendation, task, trace)` — função pura do esqueleto.
- `writeApprovedPlan(root, plan)` / `readApprovedPlan(root, traceId)` — persistência e leitura do artefato.

#### APIs externas utilizadas

- Nenhuma.

#### Documentação das APIs consultadas

- Não aplicável.

#### Eventos e outros contratos

- O formato de `ApprovedPlan` é a fronteira entre esta fatia e as de execução (MA-4, MA-5): elas leem o artefato em vez de replanejar.

### 11. Estratégia TDD

- **Unidade**: montagem do esqueleto (`assemble.ts`) com ambiente cheio e vazio; renderização; leitura e escrita do artefato.
- **Integração/contrato**: o comando de ponta a ponta com decisão injetada, cobrindo aprovação, recusa, ausência e malformado.
- **BDD/aceite**: os treze cenários da seção 6 orientam os treze casos TDD (um por AC).
- **Runner TDD**: Vitest, já materializado em `test:tdd`.
- **E2E**: não aplicável — nenhuma execução de agente nesta fatia.
- **Verificação manual**: nenhuma; todos os ACs são automatizáveis, inclusive o gate, porque o canal de decisão é injetável desde a `SPEC-0007`.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-002, AC-001 | AC-001 na seção 6 | tests/plan-command.test.ts (T001) | `unrecognized command "plan"` — o comando não existe na tabela | GREEN | 462/462 na suíte completa |
| US-001, FR-001, NFR-001, AC-002 | AC-002 na seção 6 | tests/plan-command.test.ts (T002) | saída 2 em vez de 0; `plan --help` não é reconhecido | GREEN | 462/462 na suíte completa |
| US-001, FR-001, NFR-002, AC-013 | AC-013 na seção 6 | tests/plan-command.test.ts (T013) | `unrecognized command "plan"` — flag nem chega a ser avaliada | GREEN | 462/462 na suíte completa |
| US-001, FR-002, NFR-001, AC-003 | AC-003 na seção 6 | tests/plan-assemble.test.ts (T003) | `Cannot find module '../src/plan/assemble'` | GREEN | 462/462 na suíte completa |
| US-001, FR-002, NFR-001, AC-004 | AC-004 na seção 6 | tests/plan-assemble.test.ts (T004) | `Cannot find module '../src/plan/assemble'` | GREEN | 462/462 na suíte completa |
| US-001, FR-002, NFR-001, AC-005 | AC-005 na seção 6 | tests/plan-assemble.test.ts (T005) | `Cannot find module '../src/plan/assemble'` | GREEN | 462/462 na suíte completa |
| US-001, FR-003, NFR-001, AC-006 | AC-006 na seção 6 | tests/plan-approval.test.ts (T006) | `Cannot find module '../src/plan/render'` | GREEN | 462/462 na suíte completa |
| US-001, FR-003, FR-004, AC-007 | AC-007 na seção 6 | tests/plan-approval.test.ts (T007) | `Cannot find module '../src/plan/run'` | GREEN | 462/462 na suíte completa |
| US-001, FR-003, FR-004, NFR-002, AC-008 | AC-008 na seção 6 | tests/plan-approval.test.ts (T008) | `Cannot find module '../src/plan/run'` | GREEN | 462/462 na suíte completa |
| US-001, FR-003, NFR-002, AC-009 | AC-009 na seção 6 | tests/plan-approval.test.ts (T009) | `Cannot find module '../src/plan/run'` | GREEN | 462/462 na suíte completa |
| US-001, FR-004, NFR-001, AC-010 | AC-010 na seção 6 | tests/plan-store.test.ts (T010) | `Cannot find module '../src/plan/store'` | GREEN | 462/462 na suíte completa |
| US-001, FR-004, NFR-001, AC-011 | AC-011 na seção 6 | tests/plan-store.test.ts (T011) | `Cannot find module '../src/plan/store'` | GREEN | 462/462 na suíte completa |
| US-001, FR-004, NFR-001, AC-012 | AC-012 na seção 6 | tests/plan-store.test.ts (T012) | `Cannot find module '../src/plan/store'` | GREEN | 462/462 na suíte completa |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Integração (CLI) | `tests/plan-command.test.ts` | Passed |
| FR-001 | AC-002 | Integração (CLI) | `tests/plan-command.test.ts` | Passed |
| FR-001 | AC-013 | Integração (CLI) | `tests/plan-command.test.ts` | Passed |
| FR-002 | AC-003 | Unidade (pura) | `tests/plan-assemble.test.ts` | Passed |
| FR-002 | AC-004 | Unidade (pura) | `tests/plan-assemble.test.ts` | Passed |
| FR-002 | AC-005 | Unidade (pura) | `tests/plan-assemble.test.ts` | Passed |
| FR-003 | AC-006 | Unidade | `tests/plan-approval.test.ts` | Passed |
| FR-003 | AC-007 | Integração (decisão injetada) | `tests/plan-approval.test.ts` | Passed |
| FR-003 | AC-008 | Integração (decisão injetada) | `tests/plan-approval.test.ts` | Passed |
| FR-003 | AC-009 | Integração (decisão injetada) | `tests/plan-approval.test.ts` | Passed |
| FR-004 | AC-010 | Unidade (root isolado) | `tests/plan-store.test.ts` | Passed |
| FR-004 | AC-011 | Unidade (root isolado) | `tests/plan-store.test.ts` | Passed |
| FR-004 | AC-012 | Unidade (root isolado) | `tests/plan-store.test.ts` | Passed |
| NFR-001 | AC-003, AC-006, AC-011, AC-012 | Unidade + integração | ver linhas acima | Passed |
| NFR-002 | AC-001, AC-008, AC-009, AC-013 | Integração | ver linhas acima | Passed |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-09-07)
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/draft/0016-plano-de-orquestracao-e-aprovacao-humana/spec.md --allow-draft` → `VALID DRAFT`.
- **Achados**: Nenhum `BLOCKER`. As seis decisões da entrevista viraram `FR`, `AC` ou `DEC` rastreáveis. Cobertura: US-001 → 13 AC; FR-001 → 3 (AC-001, AC-002, AC-013); FR-002 → 3 (AC-003, AC-004, AC-005); FR-003 → 4 (AC-006 a AC-009); FR-004 → 4 (AC-007, AC-008, AC-010 a AC-012); NFR-001 → 8; NFR-002 → 4. Uma correção durante a própria validação: `FR-001` tinha só dois cenários, e o validador barrou; em vez de dividir um cenário existente em dois, entrou `AC-013` cobrindo comportamento real e ainda não coberto — flag desconhecida recusada em vez de ignorada, no mesmo padrão que `SETUP_FLAGS` já aplica. `Interface para pessoas: Não` justificada. Sem findings de segurança: o gate é justamente o que impede execução não autorizada, e nada nesta fatia executa.

#### Gate do Ato II — Plano

- **Resultado**: READY (2026-09-07)
- **Comando**: `node .claude/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/defined/0016-plano-de-orquestracao-e-aprovacao-humana/spec.md` — `READY` (`total=19 complete=13 tdd=14 code=4 covered_spec_ids=20 required_spec_ids=20`).
- **Achados**: Nenhum bloqueio. As 13 tarefas `[TEST][TDD]` (uma por `AC`) estão concluídas com RED real: três porque o comando `plan` ainda não existe na tabela do CLI, e dez por módulo inexistente (`src/plan/{assemble,render,run,store}.ts`). Nenhum RED foi fabricado alterando produção. As quatro `[CODE]` (T014–T017) têm três ou mais predecessores TDD concluídos cada. O gate desta fatia é integralmente automatizável porque o canal de decisão da `SPEC-0007` aceita fonte injetada — não sobrou `AC` dependendo de verificação manual, diferente do que aconteceu na `SPEC-0014`.

#### Gate do Ato III — Entrega

- **Resultado**: READY (2026-09-07) — 19/19 tarefas, 114/114 itens de checklist
- **Comando**: `node .claude/skills/framework-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0016-plano-de-orquestracao-e-aprovacao-humana/spec.md .` — `Rastreabilidade: 20/20 IDs cobertos em 179 arquivos de teste`.
- **Achados**: Nenhum bloqueio. **462/462 testes** em 171 arquivos, `tsc` limpo, `build_documentation.mjs --check` limpo. Verificado com o binário instalado, não só pela suíte: `maestro plan --help` imprime o uso; sem `--task` recusa com saída 2; flag desconhecida é recusada nomeando-a; recusa imprime o plano e não grava nada; aprovação grava `.maestro/plans/<trace>.json` com agente, modelo, runtime e candidatos idênticos aos apresentados.
- Uma refatoração de código já entregue aconteceu aqui, e é o cumprimento da `DEC-002` em vez de um desvio dela: `interpret()` da `SPEC-0007` era tipado ao conteúdo daquela fatia, então "reusar o canal" ainda deixaria a regra de recusa duplicada. A regra virou `interpretDecision(ask)` e os dois gates passam por ela.
- Duas regressões apareceram, ambas de testes de specs anteriores que fixavam a lista exata de comandos do CLI (`SPEC-0003`, `SPEC-0004`). Nenhuma era defeito — a lista cresce a cada fatia. Atualizadas preservando a intenção de cada guard; a de `mcp-surface` passou a afirmar o que realmente protege (o servidor MCP mantém uma tool só enquanto o CLI cresce) em vez de depender de uma lista que envelhece a cada entrega.

#### Aceite final (`$framework-04-validate`)

- **Resultado**: READY (2026-09-07)
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/review/0016-plano-de-orquestracao-e-aprovacao-humana/spec.md` — `RESULTADO: READY`.
- **Achados**: Nenhum `BLOCKER`. Três gates `Passed` com evidência verificável e Definition of Done comprovada. A garantia central do épico — nada delegado sem aprovação humana explícita — deixou de ser convenção de prompt e virou comportamento verificado: recusa, silêncio e documento malformado chegam ao mesmo ponto do código e nenhum deles grava. Diferente da `SPEC-0014`, nenhum `AC` dependeu de inspeção externa, e diferente da `SPEC-0015`, nenhum defeito escapou para a verificação com o binário real. `Status: Complete`.

### 14. Tarefas

Formato:
`- [ ] TNNN [P?] [TIPO] [US-NNN?] Ação com caminho — Refs: IDs — Depends: IDs|none`

Cada tarefa possui exatamente este checklist, atualizado durante a execução:

```markdown
  - [ ] **PREP**: Confirmar escopo, IDs, dependências e baseline.
  - [ ] **EXECUTE**: Produzir a entrega no caminho declarado.
  - [ ] **VERIFY**: Executar a verificação focal adequada.
  - [ ] **VISUAL**: Conferir bordas, espaçamentos, margens, padding e tipografia do sistema; se não houver interface, registrar `Não aplicável` e o motivo.
  - [ ] **EVIDENCE**: Registrar comando, resultado e IDs nas seções 11–13.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
```

#### Fase 1 — RED TDD informado pelo BDD (uma tarefa por AC)

- [x] T001 [P] [TEST] [TDD] [US-001] Derivar de AC-001 um caso Vitest falhando em tests/plan-command.test.ts — Refs: US-001, FR-001, NFR-002, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-001; confirmar que `plan` ainda não existe na tabela de comandos de `src/cli.ts`.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-002 AC-001` — invoca o comando sem `--task` e afirma recusa nomeando o que falta, sem plano apresentado.
  - [x] **VERIFY**: `npx vitest run tests/plan-command.test.ts` — **RED observado**: `unrecognized command "plan"` — o comando não existe na tabela.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T002 [P] [TEST] [TDD] [US-001] Derivar de AC-002 um caso Vitest falhando em tests/plan-command.test.ts — Refs: US-001, FR-001, NFR-001, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-002; confirmar o padrão de `--help` dos comandos existentes.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-001 AC-002` — `plan --help` imprime o uso e sai com zero.
  - [x] **VERIFY**: `npx vitest run tests/plan-command.test.ts` — **RED observado**: saída 2 em vez de 0; `plan --help` não é reconhecido.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T013 [P] [TEST] [TDD] [US-001] Derivar de AC-013 um caso Vitest falhando em tests/plan-command.test.ts — Refs: US-001, FR-001, NFR-002, AC-013 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-013; confirmar como `SETUP_FLAGS` recusa flag desconhecida hoje.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-002 AC-013` — flag não reconhecida é recusada nomeando-a, nunca ignorada.
  - [x] **VERIFY**: `npx vitest run tests/plan-command.test.ts` — **RED observado**: `unrecognized command "plan"` — flag nem chega a ser avaliada.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T003 [P] [TEST] [TDD] [US-001] Derivar de AC-003 um caso Vitest falhando em tests/plan-assemble.test.ts — Refs: US-001, FR-002, NFR-001, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-003; confirmar que `src/plan/assemble.ts` ainda não existe.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-001 AC-003` — ambiente com perfil e backend produz exatamente um agente, com perfil, modelo e runtime nomeados.
  - [x] **VERIFY**: `npx vitest run tests/plan-assemble.test.ts` — **RED observado**: `Cannot find module '../src/plan/assemble'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T004 [P] [TEST] [TDD] [US-001] Derivar de AC-004 um caso Vitest falhando em tests/plan-assemble.test.ts — Refs: US-001, FR-002, NFR-001, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-004.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-001 AC-004` — ambiente sem backend e sem modelo local produz `model` nulo declarado, sem nome inventado.
  - [x] **VERIFY**: `npx vitest run tests/plan-assemble.test.ts` — **RED observado**: `Cannot find module '../src/plan/assemble'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T005 [P] [TEST] [TDD] [US-001] Derivar de AC-005 um caso Vitest falhando em tests/plan-assemble.test.ts — Refs: US-001, FR-002, NFR-001, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-005.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-001 AC-005` — o plano carrega perfis disponíveis e backends detectados como candidatos anexados.
  - [x] **VERIFY**: `npx vitest run tests/plan-assemble.test.ts` — **RED observado**: `Cannot find module '../src/plan/assemble'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T006 [P] [TEST] [TDD] [US-001] Derivar de AC-006 um caso Vitest falhando em tests/plan-approval.test.ts — Refs: US-001, FR-003, NFR-001, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-006; confirmar o formato de `src/approval/render.ts`.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-001 AC-006` — o texto renderizado nomeia agente, modelo e runtime e declara que nada roda sem aprovação.
  - [x] **VERIFY**: `npx vitest run tests/plan-approval.test.ts` — **RED observado**: `Cannot find module '../src/plan/render'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T007 [P] [TEST] [TDD] [US-001] Derivar de AC-007 um caso Vitest falhando em tests/plan-approval.test.ts — Refs: US-001, FR-003, FR-004, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-007; confirmar a assinatura de `interpret()` e `DecisionSource`.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 FR-004 AC-007` — decisão positiva injetada devolve plano aprovado e grava o artefato.
  - [x] **VERIFY**: `npx vitest run tests/plan-approval.test.ts` — **RED observado**: `Cannot find module '../src/plan/run'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T008 [P] [TEST] [TDD] [US-001] Derivar de AC-008 um caso Vitest falhando em tests/plan-approval.test.ts — Refs: US-001, FR-003, FR-004, NFR-002, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-008.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 FR-004 NFR-002 AC-008` — recusa não grava nada em `.maestro/plans/` e sai diferente de zero.
  - [x] **VERIFY**: `npx vitest run tests/plan-approval.test.ts` — **RED observado**: `Cannot find module '../src/plan/run'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T009 [P] [TEST] [TDD] [US-001] Derivar de AC-009 um caso Vitest falhando em tests/plan-approval.test.ts — Refs: US-001, FR-003, NFR-002, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-009.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-002 AC-009` — documento malformado e ausência de resposta são tratados como recusa, sem gravar.
  - [x] **VERIFY**: `npx vitest run tests/plan-approval.test.ts` — **RED observado**: `Cannot find module '../src/plan/run'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T010 [P] [TEST] [TDD] [US-001] Derivar de AC-010 um caso Vitest falhando em tests/plan-store.test.ts — Refs: US-001, FR-004, NFR-001, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-010; confirmar `TraceSource` e `generateId()`.
  - [x] **EXECUTE**: Escrever o caso com root isolado e marcador `TRACEABILITY: US-001 FR-004 NFR-001 AC-010` — o nome do arquivo é o identificador da execução, e o conteúdo declara o mesmo identificador.
  - [x] **VERIFY**: `npx vitest run tests/plan-store.test.ts` — **RED observado**: `Cannot find module '../src/plan/store'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T011 [P] [TEST] [TDD] [US-001] Derivar de AC-011 um caso Vitest falhando em tests/plan-store.test.ts — Refs: US-001, FR-004, NFR-001, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-011.
  - [x] **EXECUTE**: Escrever o caso com root isolado e marcador `TRACEABILITY: US-001 FR-004 NFR-001 AC-011` — agente, modelo e runtime lidos de volta são os apresentados.
  - [x] **VERIFY**: `npx vitest run tests/plan-store.test.ts` — **RED observado**: `Cannot find module '../src/plan/store'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T012 [P] [TEST] [TDD] [US-001] Derivar de AC-012 um caso Vitest falhando em tests/plan-store.test.ts — Refs: US-001, FR-004, NFR-001, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-012.
  - [x] **EXECUTE**: Escrever o caso com root isolado e marcador `TRACEABILITY: US-001 FR-004 NFR-001 AC-012` — o artefato volta pela leitura por identificador, sem montar esqueleto.
  - [x] **VERIFY**: `npx vitest run tests/plan-store.test.ts` — **RED observado**: `Cannot find module '../src/plan/store'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

#### Fase 2 — US-001 (P1): montagem, apresentação, gate e persistência

**Objetivo**: `maestro plan --task "..."` monta, apresenta, decide e grava.
**Teste independente**: `npx vitest run tests/plan-assemble.test.ts tests/plan-render.test.ts tests/plan-store.test.ts tests/plan-approval.test.ts tests/plan-command.test.ts` — todos verdes.

- [x] T014 [CODE] [US-001] Declarar os tipos do plano em src/plan/model.ts e a montagem pura em src/plan/assemble.ts — Refs: US-001, FR-002, NFR-001, AC-003, AC-004, AC-005 — Depends: T003, T004, T005
  - [x] **PREP**: Confirmar RED de T003/T004/T005 e os tipos devolvidos por `readAgentConfig` e `recommend`.
  - [x] **EXECUTE**: `PlannedAgent`, `OrchestrationPlan` e `ApprovedPlan` em `model.ts`; `assemblePlan` puro em `assemble.ts`, sempre um agente, `model` nulo quando ausente, candidatos anexados. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/plan-assemble.test.ts` — AC-003, AC-004 e AC-005 **GREEN**; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — tipos e função pura, sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos criados nas seções 11–13.
  - [x] **IMPROVE**: Melhoria aplicada: o modelo configurado no perfil tem precedência sobre a recomendação — a pessoa escreveu, o cálculo apenas sugeriu. Vazio cai para o detectado e, na ausência, para `null`.
  <!-- framework:evidence {"task":"T014","refs":["US-001","FR-002","NFR-001","AC-003","AC-004","AC-005"],"files":["src/plan/model.ts","src/plan/assemble.ts"],"commands":[{"run":"npx vitest run tests/plan-assemble.test.ts","exit":0}]} -->

- [x] T015 [CODE] [US-001] Implementar a persistência do plano aprovado em src/plan/store.ts — Refs: US-001, FR-004, NFR-001, AC-010, AC-011, AC-012 — Depends: T010, T011, T012
  - [x] **PREP**: Confirmar RED de T010/T011/T012 e o padrão de escrita local dos outros estados em `.maestro/`.
  - [x] **EXECUTE**: `PLANS_DIR`, `writeApprovedPlan(root, plan)` criando o diretório quando ausente, e `readApprovedPlan(root, traceId)`. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/plan-store.test.ts` — AC-010, AC-011 e AC-012 **GREEN**.
  - [x] **VISUAL**: Não aplicável — persistência em disco, sem tela.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos criados nas seções 11–13.
  - [x] **IMPROVE**: Melhoria aplicada: `readApprovedPlan` devolve `null` para artefato ilegível em vez de lançar — um arquivo corrompido prova que nada foi aprovado, que é a leitura segura para quem for executar.
  <!-- framework:evidence {"task":"T015","refs":["US-001","FR-004","NFR-001","AC-010","AC-011","AC-012"],"files":["src/plan/store.ts"],"commands":[{"run":"npx vitest run tests/plan-store.test.ts","exit":0}]} -->

- [x] T016 [CODE] [US-001] Implementar a renderização em src/plan/render.ts e o gate em src/plan/run.ts, reusando o canal da SPEC-0007 — Refs: US-001, FR-003, FR-004, NFR-001, NFR-002, AC-006, AC-007, AC-008, AC-009 — Depends: T006, T007, T008, T009
  - [x] **PREP**: Confirmar RED de T006/T007/T008/T009 e as assinaturas de `realSource`/`interpret` em `src/approval/decide.ts`.
  - [x] **EXECUTE**: `renderPlan` derivando o texto do mesmo objeto que será gravado; `runPlan` lendo perfis, detectando backends, recomendando, montando, renderizando, decidindo pelo canal existente e gravando só na aprovação. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/plan-approval.test.ts` — AC-006, AC-007, AC-008 e AC-009 **GREEN**.
  - [x] **VISUAL**: Não aplicável — texto em stdout, sem tela.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos criados nas seções 11–13.
  - [x] **IMPROVE**: **Refatoração feita para honrar a DEC-002 de verdade**: `interpret()` da `SPEC-0007` era tipado ao conteúdo dela (hooks e comandos), então reusar "o canal" ainda deixaria a regra "exceção é recusa" duplicada. A regra foi extraída para `interpretDecision(ask)` em `src/approval/decide.ts`, e os dois gates passam por ela — o `interpret` original agora delega. Duplicar esse try/catch é exatamente onde um consentimento silencioso apareceria.
  <!-- framework:evidence {"task":"T016","refs":["US-001","FR-003","FR-004","NFR-001","NFR-002","AC-006","AC-007","AC-008","AC-009"],"files":["src/plan/render.ts","src/plan/run.ts"],"commands":[{"run":"npx vitest run tests/plan-approval.test.ts","exit":0}]} -->

- [x] T017 [CODE] [US-001] Ligar o comando plan em src/cli.ts, com USAGE_PLAN, parsing de --task e recusa de flag desconhecida — Refs: US-001, FR-001, NFR-001, NFR-002, AC-001, AC-002, AC-013 — Depends: T001, T002, T013
  - [x] **PREP**: Confirmar RED de T001/T002/T013 e o padrão de `SETUP_FLAGS`/`hasHelp`.
  - [x] **EXECUTE**: `USAGE_PLAN`, entrada `plan` na tabela de comandos, parsing de `--task` com recusa quando ausente e recusa nomeada para flag desconhecida. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/plan-command.test.ts` — AC-001, AC-002 e AC-013 **GREEN**. Verificado com o binário real: `maestro plan --help` imprime o uso; sem `--task` recusa com saída 2; `--modo-turbo` é recusada nomeando a flag.
  - [x] **VISUAL**: Não aplicável — comando de terminal, sem tela.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados nas seções 11–13.
  - [x] **IMPROVE**: Melhoria aplicada: a recusa de flag desconhecida também cobre flag sem valor (`--modo-turbo` sozinha), que `parseFlags` descartaria em silêncio — o mesmo buraco que a `SPEC-0007` já tinha encontrado com `--help`.
  <!-- framework:evidence {"task":"T017","refs":["US-001","FR-001","NFR-001","NFR-002","AC-001","AC-002","AC-013"],"files":["src/cli.ts"],"commands":[{"run":"npx vitest run tests/plan-command.test.ts","exit":0}]} -->

**Checkpoint**: `maestro plan --task "..."` apresenta o plano; aprovar deixa `.maestro/plans/<trace>.json` legível; recusar não deixa nada.

#### Fase final — Documentação e qualidade

- [x] T018 [DOC] [US-001] Registrar o comando e o artefato de plano em .project-context/STACK.md e revisar PROJECT.md — Refs: US-001, FR-001, FR-004, AC-002, AC-010 — Depends: T014, T015, T016, T017
  - [x] **PREP**: Confirmar T014–T017 GREEN e o conteúdo atual de `.project-context/STACK.md` e `PROJECT.md`.
  - [x] **EXECUTE**: Seção nova em `.project-context/STACK.md` para o comando `plan` e o artefato `.maestro/plans/`; em `PROJECT.md`, registrar a capacidade e corrigir "O que ainda não existe", que hoje diz que nada consome os perfis.
  - [x] **VERIFY**: `build_documentation.mjs --project . --check` limpo. `.project-context/STACK.md` ganhou a seção do comando `plan` e do artefato; `PROJECT.md` registrou a capacidade e corrigiu "O que ainda não existe", que dizia que nada consumia os perfis — agora nomeia exatamente o que falta (execução, MA-3 a MA-6).
  - [x] **VISUAL**: Não aplicável — documentação em Markdown, sem tela.
  - [x] **EVIDENCE**: Registrar comandos e resultado nas seções 11–13.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T019 [TEST] Regressão completa e verificação com o binário real sobre tests/plan-*.test.ts e a suíte inteira — Refs: US-001, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013 — Depends: T014, T015, T016, T017, T018
  - [x] **PREP**: Identificar suites, checks e gates aplicáveis.
  - [x] **EXECUTE**: `npx vitest run`, `npx tsc --noEmit`, `check_traceability.mjs`, `verify_acceptance.mjs`, e o comando real (`maestro plan`) contra este projeto.
  - [x] **VERIFY**: **462/462 testes** em 171 arquivos, `tsc` limpo, `Rastreabilidade: 20/20 IDs cobertos`. Com o binário real: recusa (`{"approved": false}`) imprimiu o plano e `refused: refused. Nothing was written.`, deixando `.maestro/plans/` vazio; aprovação gravou `.maestro/plans/cf534daaa4024145e29eb01e64f12ab7.json` com agente, modelo, runtime e candidatos exatamente como apresentados.
  - [x] **VISUAL**: Não aplicável — repasse final sem superfície visual própria.
  - [x] **EVIDENCE**: Registrar contagens e comandos finais nas seções 11–13.
  - [x] **IMPROVE**: Retrospectiva: duas regressões apareceram, ambas da mesma família — testes de specs anteriores (`SPEC-0003` e `SPEC-0004`) que fixavam a lista exata de comandos do CLI. Nenhuma era defeito: a lista cresce a cada fatia. Atualizei mantendo a intenção de cada guard, e no caso do `mcp-surface` reforcei o teste para afirmar o que ele realmente protege (o MCP segue com uma tool só enquanto o CLI cresce), em vez de depender de uma lista que envelhece. Diferente da `SPEC-0015`, nenhum defeito escapou para a verificação com o binário real — o gate ser injetável desde a `SPEC-0007` deixou tudo exercitável na suíte.

### 15. Ordem de execução

- Caminho crítico: T001–T013 (paralelas) → T014/T015 (paralelas) → T016 → T017 → T018 → T019.
- Tarefas paralelas: T001–T013 são independentes entre si. T014 (tipos e montagem) e T015 (persistência) tocam arquivos disjuntos; T016 depende de T014 porque renderiza e grava o objeto que ela define, e T017 depende de T016 porque o comando é a casca do fluxo que ela orquestra — dependências declaradas por ID, não por posição.
- Restrição de sequenciamento: a verificação com o binário real (T017 e T019) exige `npm run build`, que por sua vez exige bump de versão quando `src/` mudou — a regra de checksum do projeto entra no caminho crítico do fechamento.
- Estratégia de MVP: não aplicável — é uma história só, e uma fatia parcial (montar sem gate, ou gate sem persistir) entregaria justamente a garantia pela metade, que é o ponto da fatia.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- `SPEC-0015` (perfis de agente) — entregue; fornece `readAgentConfig`.
- `SPEC-0007` (aprovação do plano) — entregue; fornece o canal de decisão reusado aqui.
- `SPEC-0009` (seleção de modelo) — entregue; consumida como está, sem extensão (isso é MA-3).
- `SPEC-0006` (trace) — entregue; fornece o identificador do artefato.

#### Riscos

- O esqueleto sempre singleton pode dar a impressão de que o sistema não sabe delegar → mitigado pela renderização, que declara explicitamente que decompor é refinamento do agente, não omissão do plano.
- O formato de `ApprovedPlan` vira fronteira com MA-4/MA-5 antes de existir consumidor real, e pode se revelar insuficiente quando a execução chegar → aceito: mudá-lo depois é barato enquanto nenhuma execução depende dele, e adiar a persistência deixaria a aprovação sem rastro.
- Reusar o canal da `SPEC-0007` acopla duas fatias a um mesmo módulo de decisão → aceito deliberadamente; duplicar o tratamento de TTY, malformado e ausência seria pior, e é justamente onde falha silenciosa nasceria.

#### Suposições

- O agente que refina lê a saída do comando; nada nesta fatia depende de o agente existir, e o comando é útil sozinho para uma pessoa inspecionar o que seria proposto.
- `.maestro/plans/` acompanha o mesmo tratamento de versionamento que o restante do estado operacional do diretório gerenciado; se precisar entrar no `git.groups` do `config.yaml`, isso é ajuste de configuração, não de código.

### 17. Decisões

- **DEC-001**: O CLI monta o esqueleto determinístico e o agente refina — razão: o código consegue apurar perfis, backends e memória livre sem adivinhar, e não consegue julgar decomposição de tarefa; separar assim mantém o código testável e não finge cognição. Alternativas descartadas: só o agente planejar (deixaria o código sem nada verificável) e só o código planejar (exigiria heurística de compreensão de tarefa) — rodada 1.
- **DEC-002**: O gate reusa o canal de decisão da `SPEC-0007` — razão: como se pergunta a um humano é mecânica independente do que se pergunta, e aquele canal já trata TTY, documento, ausência e malformado com a regra de negativa por omissão. Alternativa descartada: canal próprio, que duplicaria exatamente o tratamento onde falha silenciosa nasce — rodada 2.
- **DEC-003**: Comando novo `maestro plan`, sem tool nova no MCP — razão: segue o padrão de `recommend` e não reabre a decisão da `SPEC-0004` de manter o servidor MCP com uma tool única — rodada 3.
- **DEC-004**: O plano aprovado é persistido em `.maestro/plans/<trace-id>.json` — razão: as fatias de execução precisam consumir o que foi aprovado em vez de replanejar, e o identificador de execução já existe desde a `SPEC-0006`. Alternativa descartada: só stdout, que deixaria a aprovação sem rastro auditável — rodada 4.
- **DEC-005**: A tarefa entra por `--task` obrigatório — razão: mesmo espírito de `setup --target`; sem tarefa declarada, recusar é melhor que adivinhar o que planejar — rodada 5.
- **DEC-006**: O esqueleto propõe sempre um agente — razão: decompor exige entender a tarefa, e o código não entende; propor um e anexar os candidatos é o máximo honesto que o determinismo alcança — rodada 6.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Os cenários `AC-001` a `AC-013` passam.
- [x] `FR-001` a `FR-004` e `NFR-001`/`NFR-002` têm evidência de verificação nas seções 11–12.
- [x] Todas as tarefas da seção 14 estão concluídas — 19/19, 114/114 itens.
- [x] `.project-context/STACK.md` registra o comando novo e o artefato de plano.
- [x] `PROJECT.md` revisado quanto à capacidade nova e à correção de "O que ainda não existe".
