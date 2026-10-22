# Especificação integrada: Briefing de delegacao para subagent nativo

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0018 |
| Slug | 0018-briefing-de-delegacao-para-subagent-nativo |
| Status | Complete |
| Effort | 5 |
| Effort rationale | Um comando novo que lê um artefato já existente, resolve arquivos de comportamento e compõe texto. Sem mecanismo novo, sem I/O externo, sem concorrência. O que exige cuidado é a fronteira: a fatia precisa entregar exatamente o que a CLI consegue garantir e recusar o resto em voz alta, sem sugerir execução que ela não realiza. |
| Effort updated at | 2026-09-07 |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — comando de terminal cuja saída é texto lido por um agente, sem tela. |
| Atualizada em | 2026-09-07 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A `SPEC-0016` entrega um plano aprovado e persistido em
`.maestro/plans/<execução>.json`. Nada o consome. Quem fosse delegar teria de
reabrir o arquivo, localizar o perfil de cada agente na configuração, ler os
arquivos de comportamento, aplicar a regra de substituir-versus-somar da
`SPEC-0015` e montar o texto à mão — ou, mais provavelmente, improvisar sem
nada disso.

Há um limite que a fatia precisa respeitar em vez de contornar: **um processo
de terminal não aciona o mecanismo de subagent da ferramenta hospedeira**. A
Agent tool do Claude Code é chamada pelo agente, de dentro da sessão; a CLI
não tem acesso a ela. Uma fatia que prometesse "executar via subagent nativo"
estaria prometendo o que não pode cumprir.

#### Resultado desejado

`maestro run <execução>` lê o plano aprovado e emite, por agente planejado, o
**briefing de delegação**: o comportamento já composto, as skills, as tools e
o modelo. O agente hospedeiro lê essa saída e aciona os próprios subagents.

A divisão é a mesma que a `SPEC-0016` fixou para o planejamento: a CLI faz o
que é determinístico — resolver perfil, ler arquivos, compor texto — e o
agente faz o que exige a sessão. Nada aqui afirma que algo executou.

#### Métricas de sucesso

- Dado um plano aprovado, o briefing traz o comportamento já composto, sem exigir que quem lê abra qualquer arquivo referenciado.
- Um plano cujo agente pede runtime ainda não entregue é recusado nomeando a fatia ausente, em vez de receber um briefing que ninguém sabe executar.
- Nenhum estado novo é gravado: emitir briefing não é evidência de execução.

### 2. Research e esclarecimentos

#### Researchs executados

- Nenhum research externo. A fronteira central da fatia (a CLI não aciona a Agent tool) é fato de arquitetura do ambiente hospedeiro, verificável por inspeção do próprio projeto: nenhum módulo em `src/` tem acesso a esse mecanismo, e o servidor MCP expõe uma tool de `setup`, não de delegação.

#### Fontes e contexto consultados

- `src/plan/store.ts` — `readApprovedPlan(root, traceId)` e `PLANS_DIR`, a origem do que esta fatia consome (`SPEC-0016`).
- `src/plan/model.ts` — `ApprovedPlan`, `PlannedAgent` com `profile`, `model` e `runtime`.
- `src/agents/read.ts` — `readAgentConfig(root)` devolvendo `{ maestro, subagents }` validados (`SPEC-0015`).
- `src/config/schema.ts` — `AgentProfile` com `instruction.behavior`/`additional_behavior`, `capability.skills`/`tools`/`mcp_servers`.
- `resources/agents/maestro/behavior.md` — o comportamento padrão semeado, que a composição usa como base.
- `src/cli.ts` — tabela de comandos, `USAGE_*`, e o padrão de recusa de flag desconhecida.

#### Documentação consultada

- Nenhuma documentação externa.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo. O levantamento inteiro é inspeção do próprio repositório, citada com caminho relativo acima.

#### Dúvidas respondidas

- **Q**: O que a fatia entrega, se a CLI não aciona a Agent tool? → **A**: o briefing de delegação; o agente hospedeiro é quem aciona. A CLI não finge executar o que não pode (rodada 1).
- **Q**: Quem resolve `behavior` versus `additional_behavior`? → **A**: a CLI, entregando o texto final composto — assim a regra da `SPEC-0015` fica verificável em teste, num lugar só, em vez de virar convenção de prompt (rodada 2).
- **Q**: O que fazer com `runtime: cli`, que é a MA-5? → **A**: `native` e `auto` emitem briefing; `cli` é recusado em voz alta nomeando a fatia ausente (rodada 3).
- **Q**: A CLI registra que a execução foi entregue? → **A**: não. Emitir briefing não é evidência de que algo rodou, e um registro de "entregue" mentiria sobre execução; a telemetria real é a MA-6 (rodada 4).

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Comando `maestro run <execução>`, com `--help` no padrão dos demais.
- Leitura do plano aprovado pelo identificador de execução.
- Resolução do perfil de cada agente planejado contra a configuração.
- Composição do comportamento: `behavior` substitui o padrão, `additional_behavior` soma.
- Briefing por agente com comportamento composto, skills, tools e modelo.
- Recusa nomeada para runtime ainda não entregue.

#### Fora de escopo

- Acionar qualquer subagent: a CLI emite o briefing, o agente delega (decisão rodada 1).
- Execução por subprocesso de CLI externa (fatia MA-5).
- Telemetria e correlação do que de fato rodou (fatia MA-6).
- Gravar estado de "entregue" ou "em execução" (decisão rodada 4).
- Reabrir o gate de aprovação: esta fatia só lê um plano que já foi aprovado.
- Montar plano: quem monta é `maestro plan` (`SPEC-0016`).

#### Atores

- **Agente hospedeiro**: lê o briefing e aciona seus próprios subagents; é o único que executa.
- **Pessoa no terminal**: pode rodar o comando para inspecionar o que seria delegado, antes ou depois de aprovar.

### 4. Princípios e restrições do projeto

- **PR-001**: A CLI entrega o que consegue garantir e recusa o resto em voz alta — nunca sugere capacidade que não tem (`SPEC-0004`, `DEC-002`).
- **PR-002**: A regra de composição da `SPEC-0015` vive em código testável, não em convenção de prompt.
- **PR-003**: Nada é gravado sem que represente um fato verificável (`SPEC-0016`, `PR-003`).
- **PR-004**: Recusa nomeia o que falta, incluindo a fatia responsável quando a capacidade ainda não existe.
- **PR-005**: Nada é escrito fora da raiz do projeto (`SPEC-0003`).

### 5. Histórias de usuário

#### US-001 — Delegar a partir do plano aprovado (P1)

Como agente que vai delegar, quero receber o briefing pronto de cada agente
planejado — comportamento composto, skills, tools e modelo — para acionar os
subagents sem reabrir configuração nem remontar texto por conta própria.

**Por que P1**: é a única história da fatia; sem ela o plano aprovado não tem consumidor.
**Teste independente**: aprovar um plano, rodar `maestro run <execução>` e confirmar que o briefing traz o comportamento composto e as capacidades declaradas.
**Requisitos**: FR-001, FR-002, FR-003, FR-004

### 6. Cenários BDD de aceite

#### AC-001 — o comando exige a execução

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-001
Feature: entrada do comando run

  Scenario: invocação sem identificador
    Given um projeto configurado
    When a pessoa roda maestro run sem informar a execução
    Then o comando recusa explicando que o identificador é obrigatório
    And nenhum briefing é emitido
```

#### AC-002 — o comando publica seu uso

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-002
Feature: entrada do comando run

  Scenario: pedido de ajuda
    Given qualquer projeto
    When a pessoa roda maestro run --help
    Then o uso do comando é impresso
    And o código de saída é zero
```

#### AC-003 — execução inexistente é recusada

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-003
Feature: entrada do comando run

  Scenario: identificador sem plano aprovado
    Given um projeto sem nenhum plano gravado
    When a pessoa roda maestro run para um identificador qualquer
    Then o comando recusa dizendo que não há plano aprovado com esse identificador
```

#### AC-004 — o comportamento padrão vale quando nada é declarado

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-004
Feature: composição do comportamento

  Scenario: perfil sem instrução própria
    Given um perfil que não declara behavior nem additional_behavior
    When o comportamento é composto
    Then o texto resultante é o comportamento padrão semeado
```

#### AC-005 — behavior substitui o padrão

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-005
Feature: composição do comportamento

  Scenario: perfil com behavior próprio
    Given um perfil cujo behavior aponta para um arquivo próprio
    When o comportamento é composto
    Then o texto resultante é o do arquivo próprio
    And o comportamento padrão não aparece nele
```

#### AC-006 — additional_behavior soma ao que vale

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-006
Feature: composição do comportamento

  Scenario: perfil que estende em vez de substituir
    Given um perfil que declara additional_behavior e não declara behavior
    When o comportamento é composto
    Then o texto traz o comportamento padrão
    And traz também o conteúdo do additional_behavior
```

#### AC-007 — o briefing traz o comportamento já composto

**Cobre**: US-001, FR-003, NFR-001

```gherkin
@US-001 @FR-003 @NFR-001 @AC-007
Feature: briefing de delegação

  Scenario: agente planejado com comportamento próprio
    Given um plano aprovado cujo agente tem behavior próprio
    When o briefing é emitido
    Then ele contém o texto do comportamento
    And não exige que quem lê abra qualquer arquivo referenciado
```

#### AC-008 — o briefing declara capacidades e modelo

**Cobre**: US-001, FR-003, NFR-001

```gherkin
@US-001 @FR-003 @NFR-001 @AC-008
Feature: briefing de delegação

  Scenario: agente com skills, tools e modelo
    Given um plano aprovado cujo agente declara skills e tools
    When o briefing é emitido
    Then ele nomeia o modelo do plano
    And lista as skills e as tools do perfil
```

#### AC-009 — um briefing por agente planejado

**Cobre**: US-001, FR-003, NFR-001

```gherkin
@US-001 @FR-003 @NFR-001 @AC-009
Feature: briefing de delegação

  Scenario: plano com mais de um agente
    Given um plano aprovado com dois agentes
    When o briefing é emitido
    Then há um bloco para cada agente
    And cada bloco nomeia o perfil a que pertence
```

#### AC-010 — runtime não entregue é recusado

**Cobre**: US-001, FR-004, NFR-002

```gherkin
@US-001 @FR-004 @NFR-002 @AC-010
Feature: fronteira de runtime

  Scenario: plano marcado para execução por CLI externa
    Given um plano aprovado cujo agente pede runtime cli
    When o comando roda
    Then ele recusa dizendo que a execução por subprocesso ainda não existe
    And nomeia a fatia responsável
```

#### AC-011 — auto resolve para o nativo enquanto for a única via

**Cobre**: US-001, FR-004, NFR-001

```gherkin
@US-001 @FR-004 @NFR-001 @AC-011
Feature: fronteira de runtime

  Scenario: plano com runtime auto
    Given um plano aprovado cujo agente pede runtime auto
    When o briefing é emitido
    Then ele é emitido normalmente, como no runtime nativo
```

#### AC-012 — emitir briefing não grava nada

**Cobre**: US-001, FR-004, NFR-002

```gherkin
@US-001 @FR-004 @NFR-002 @AC-012
Feature: fronteira de runtime

  Scenario: estado do projeto depois do comando
    Given um projeto com um plano aprovado
    When o briefing é emitido
    Then nenhum arquivo é criado ou alterado
    And o plano aprovado permanece idêntico
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O CLI deve expor o comando `run`, exigindo o identificador da execução; sem ele deve recusar explicando o que falta; um identificador sem plano aprovado correspondente deve ser recusado dizendo isso; `--help` deve imprimir o uso e sair com zero, e flag desconhecida deve ser recusada nomeando-a.
- **FR-002**: A composição do comportamento deve devolver o padrão semeado quando o perfil não declara nada, o conteúdo de `behavior` quando ele é declarado — sem o padrão junto — e o padrão somado ao `additional_behavior` quando só este é declarado.
- **FR-003**: O briefing deve trazer, por agente planejado, o comportamento já composto, o modelo do plano e as skills e tools do perfil, num bloco que nomeia o perfil; quem lê não deve precisar abrir nenhum arquivo referenciado.
- **FR-004**: Um agente com `runtime` `native` ou `auto` deve receber briefing; `cli` deve ser recusado nomeando a fatia que ainda não existe; o comando não deve criar nem alterar arquivo algum.

#### Não funcionais

- **NFR-001**: O briefing é autossuficiente e determinístico — a mesma configuração e o mesmo plano produzem o mesmo texto, e nada nele exige leitura adicional. **Verificação**: casos comparando o texto emitido com o conteúdo dos arquivos, e repetição da emissão.
- **NFR-002**: Nenhuma recusa é silenciosa e nenhuma capacidade inexistente é sugerida — identificador ausente, plano inexistente e runtime não entregue produzem mensagem nomeando o que falta. **Verificação**: casos de cada recusa, conferindo a mensagem e o código de saída.

#### Erros e casos-limite

- Plano aprovado cujo perfil não existe mais na configuração → recusa nomeando o perfil ausente; o briefing seria sobre um agente que ninguém declarou.
- Arquivo de comportamento referenciado que sumiu depois da aprovação → a leitura da `SPEC-0015` já recusa em voz alta; o comando propaga essa recusa.
- Plano com agentes de runtimes diferentes, um deles `cli` → recusa a execução inteira, em vez de emitir briefing parcial: um plano aprovado é uma unidade, e entregar metade dele seria decidir por conta própria o que fazer com a outra metade.
- `.maestro/plans/` inexistente → mesmo tratamento de plano inexistente (AC-003).

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

`readApprovedPlan(root, traceId)` devolve `ApprovedPlan | null`.
`readAgentConfig(root)` devolve `{ maestro, subagents }` já validados e recusa
em voz alta diante de referência quebrada. `AgentProfile` traz
`instruction.behavior`/`additional_behavior` como caminhos e
`capability.skills`/`tools`. O comportamento padrão vive em
`resources/agents/maestro/behavior.md` e é semeado em
`.maestro/subagents/maestro/behavior.md`.

#### Arquitetura e módulos

- `src/delegation/behavior.ts` (novo): `composeBehavior({ base, behavior, additional })` puro, aplicando a regra substitui-versus-soma sobre conteúdo já lido.
- `src/delegation/brief.ts` (novo): `buildBriefs(plan, config, readFile)` devolvendo um briefing por agente, e `renderBriefs(briefs)` para o texto.
- `src/delegation/run.ts` (novo): orquestra — lê plano, lê configuração, valida runtime, compõe e devolve o texto ou a recusa.
- `src/cli.ts`: `USAGE_RUN`, entrada `run` na tabela de comandos e o parsing do identificador posicional.

#### Migrations

- Não aplicável.

#### Models

- `AgentBrief`: `{ profile: string; model: string | null; behavior: string; skills: string[]; tools: string[] }`. Invariante: `behavior` é texto, nunca caminho.

#### Controllers e casos de uso

- Não aplicável.

#### Views e experiência

- Não aplicável.

#### Queries e repositórios

- Não aplicável.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/draft/0018-briefing-de-delegacao-para-subagent-nativo/
  spec.md
src/
  delegation/behavior.ts
  delegation/brief.ts
  delegation/run.ts
  cli.ts
tests/
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| `AgentBrief` | `profile` dentro da execução | `behavior` é conteúdo já composto; `model` nulo declara ausência | derivado de um `PlannedAgent` e do `AgentProfile` correspondente |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Plano aprovado | gravado | `run` com runtime coberto | briefing emitido | nada gravado; o plano permanece idêntico |
| Plano aprovado | gravado | `run` com runtime `cli` | recusado | nada emitido nem gravado |

#### Migração e retenção

- Não aplicável — a fatia não persiste nada.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não. Comando de terminal cuja saída é texto lido por um agente.

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

- `maestro run <execução>` — emite o briefing ou recusa; sai com zero na emissão e diferente de zero na recusa.
- `composeBehavior(parts)`, `buildBriefs(plan, config, readFile)`, `renderBriefs(briefs)`.

#### APIs externas utilizadas

- Nenhuma.

#### Documentação das APIs consultadas

- Não aplicável.

#### Eventos e outros contratos

- O formato do briefing é a fronteira com o agente hospedeiro: ele lê o texto e delega. Nenhum contrato de máquina é imposto, porque quem consome é um leitor com cognição, não um parser.

### 11. Estratégia TDD

- **Unidade**: composição do comportamento nos três casos; montagem e renderização do briefing; validação de runtime.
- **Integração/contrato**: comando de ponta a ponta sobre um projeto com plano gravado, incluindo a ausência de escrita.
- **BDD/aceite**: os doze cenários da seção 6 orientam os doze casos TDD (um por AC).
- **Runner TDD**: Vitest, já materializado em `test:tdd`.
- **E2E**: não aplicável — nada executa nesta fatia.
- **Verificação manual**: uma, complementar: rodar `maestro run` neste projeto sobre um plano aprovado de verdade, para confirmar que o briefing sai autossuficiente com a configuração real.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-002, AC-001 | AC-001 na seção 6 | tests/run-command.test.ts (T001) | `unrecognized command "run"` — o comando não existe na tabela | GREEN | 488/488 na suíte completa |
| US-001, FR-001, NFR-001, AC-002 | AC-002 na seção 6 | tests/run-command.test.ts (T002) | saída 2 em vez de 0; `run --help` não é reconhecido | GREEN | 488/488 na suíte completa |
| US-001, FR-001, NFR-002, AC-003 | AC-003 na seção 6 | tests/run-command.test.ts (T003) | `unrecognized command "run"` — nem chega a checar o plano | GREEN | 488/488 na suíte completa |
| US-001, FR-002, NFR-001, AC-004 | AC-004 na seção 6 | tests/delegation-behavior.test.ts (T004) | `Cannot find module '../src/delegation/behavior'` | GREEN | 488/488 na suíte completa |
| US-001, FR-002, NFR-001, AC-005 | AC-005 na seção 6 | tests/delegation-behavior.test.ts (T005) | `Cannot find module '../src/delegation/behavior'` | GREEN | 488/488 na suíte completa |
| US-001, FR-002, NFR-001, AC-006 | AC-006 na seção 6 | tests/delegation-behavior.test.ts (T006) | `Cannot find module '../src/delegation/behavior'` | GREEN | 488/488 na suíte completa |
| US-001, FR-003, NFR-001, AC-007 | AC-007 na seção 6 | tests/delegation-brief.test.ts (T007) | `Cannot find module '../src/delegation/brief'` | GREEN | 488/488 na suíte completa |
| US-001, FR-003, NFR-001, AC-008 | AC-008 na seção 6 | tests/delegation-brief.test.ts (T008) | `Cannot find module '../src/delegation/brief'` | GREEN | 488/488 na suíte completa |
| US-001, FR-003, NFR-001, AC-009 | AC-009 na seção 6 | tests/delegation-brief.test.ts (T009) | `Cannot find module '../src/delegation/brief'` | GREEN | 488/488 na suíte completa |
| US-001, FR-004, NFR-002, AC-010 | AC-010 na seção 6 | tests/delegation-runtime.test.ts (T010) | `Cannot find module '../src/delegation/run'` | GREEN | 488/488 na suíte completa |
| US-001, FR-004, NFR-001, AC-011 | AC-011 na seção 6 | tests/delegation-runtime.test.ts (T011) | `Cannot find module '../src/delegation/run'` | GREEN | 488/488 na suíte completa |
| US-001, FR-004, NFR-002, AC-012 | AC-012 na seção 6 | tests/delegation-runtime.test.ts (T012) | `Cannot find module '../src/delegation/run'` | GREEN | 488/488 na suíte completa |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Integração (CLI) | `tests/run-command.test.ts` | Passed |
| FR-001 | AC-002 | Integração (CLI) | `tests/run-command.test.ts` | Passed |
| FR-001 | AC-003 | Integração (CLI) | `tests/run-command.test.ts` | Passed |
| FR-002 | AC-004 | Unidade (pura) | `tests/delegation-behavior.test.ts` | Passed |
| FR-002 | AC-005 | Unidade (pura) | `tests/delegation-behavior.test.ts` | Passed |
| FR-002 | AC-006 | Unidade (pura) | `tests/delegation-behavior.test.ts` | Passed |
| FR-003 | AC-007 | Unidade | `tests/delegation-brief.test.ts` | Passed |
| FR-003 | AC-008 | Unidade | `tests/delegation-brief.test.ts` | Passed |
| FR-003 | AC-009 | Unidade | `tests/delegation-brief.test.ts` | Passed |
| FR-004 | AC-010 | Unidade | `tests/delegation-runtime.test.ts` | Passed |
| FR-004 | AC-011 | Unidade | `tests/delegation-runtime.test.ts` | Passed |
| FR-004 | AC-012 | Integração (root isolado) | `tests/delegation-runtime.test.ts` | Passed |
| NFR-001 | AC-002, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-011 | Unidade + integração | ver linhas acima | Passed |
| NFR-002 | AC-001, AC-003, AC-010, AC-012 | Unidade + integração | ver linhas acima | Passed |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-09-07)
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/draft/0018-briefing-de-delegacao-para-subagent-nativo/spec.md --allow-draft` → `VALID DRAFT`.
- **Achados**: Nenhum `BLOCKER`. As quatro decisões da entrevista viraram `FR`, `AC` ou `DEC` rastreáveis. Cobertura: US-001 → 12 AC; FR-001 → 3; FR-002 → 3; FR-003 → 3; FR-004 → 3; NFR-001 → 8; NFR-002 → 4. A fatia tem uma fronteira incomum e ela está declarada em vez de contornada: a CLI não aciona subagent porque não tem acesso ao mecanismo da ferramenta hospedeira, e o escopo diz isso explicitamente em vez de prometer execução. `Interface para pessoas: Não` justificada. Sem findings de segurança: nada executa e nada é gravado.

#### Gate do Ato II — Plano

- **Resultado**: READY (2026-09-07)
- **Comando**: `node .claude/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/defined/0018-briefing-de-delegacao-para-subagent-nativo/spec.md` — `READY` (`total=18 complete=12 tdd=13 code=4 covered_spec_ids=19 required_spec_ids=19`).
- **Achados**: Nenhum bloqueio. As 12 tarefas `[TEST][TDD]` (uma por `AC`) estão concluídas com RED real — três porque `run` ainda não existe na tabela do CLI, nove por módulo inexistente (`src/delegation/{behavior,brief,run}.ts`). Nenhum RED foi fabricado. As quatro `[CODE]` (T013–T016) têm três predecessores TDD concluídos cada.

#### Gate do Ato III — Entrega

- **Resultado**: READY (2026-09-07) — 18/18 tarefas, 108/108 itens de checklist
- **Comando**: `node .claude/skills/framework-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0018-briefing-de-delegacao-para-subagent-nativo/spec.md .` — `Rastreabilidade: 19/19 IDs cobertos em 190 arquivos de teste`.
- **Achados**: Nenhum bloqueio. **488/488 testes** em 180 arquivos, `tsc` limpo, `build_documentation.mjs --check` limpo. Verificado com o binário instalado: ciclo real `maestro plan` (aprovado) seguido de `maestro run <trace>` produziu o briefing do perfil `maestro`, autossuficiente — comportamento composto, modelo, capacidades — e nada novo foi escrito em disco além do plano já existente.
- Duas regressões apareceram, terceira vez que a mesma família se repete: testes de specs anteriores (`SPEC-0003`, `SPEC-0004`) fixam a lista exata de comandos do CLI e precisam de ajuste a cada comando novo. Atualizadas preservando a intenção. Candidato a melhoria futura, fora do escopo desta spec: um guard que afirme a propriedade real (nenhum comando ganha tool MCP própria) em vez de comparar a lista inteira.

#### Aceite final (`$framework-04-validate`)

- **Resultado**: READY (2026-09-07)
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/review/0018-briefing-de-delegacao-para-subagent-nativo/spec.md` — `RESULTADO: READY`.
- **Achados**: Nenhum `BLOCKER`. Três gates `Passed`, Definition of Done comprovada. A fatia entrega exatamente o que declarou desde o Ato I — nenhuma promessa de execução que a arquitetura não permite. O plano aprovado da SPEC-0016 tem consumidor agora: verificado de ponta a ponta com o binário real, `plan` seguido de `run` produzindo briefing autossuficiente sem escrever nada novo. `Status: Complete`.

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

- [x] T001 [P] [TEST] [TDD] [US-001] Derivar de AC-001 um caso Vitest falhando em tests/run-command.test.ts — Refs: US-001, FR-001, NFR-002, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-001; confirmar que `run` não está na tabela de comandos de `src/cli.ts`.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-002 AC-001` — sem identificador, recusa explicando o que falta.
  - [x] **VERIFY**: `npx vitest run tests/run-command.test.ts` — **RED observado**: `unrecognized command "run"` — o comando não existe na tabela.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T002 [P] [TEST] [TDD] [US-001] Derivar de AC-002 um caso Vitest falhando em tests/run-command.test.ts — Refs: US-001, FR-001, NFR-001, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-002.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-001 AC-002` — `run --help` imprime o uso e sai com zero.
  - [x] **VERIFY**: `npx vitest run tests/run-command.test.ts` — **RED observado**: saída 2 em vez de 0; `run --help` não é reconhecido.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T003 [P] [TEST] [TDD] [US-001] Derivar de AC-003 um caso Vitest falhando em tests/run-command.test.ts — Refs: US-001, FR-001, NFR-002, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-003.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-002 AC-003` — identificador sem plano gravado é recusado dizendo isso.
  - [x] **VERIFY**: `npx vitest run tests/run-command.test.ts` — **RED observado**: `unrecognized command "run"` — nem chega a checar o plano.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T004 [P] [TEST] [TDD] [US-001] Derivar de AC-004 um caso Vitest falhando em tests/delegation-behavior.test.ts — Refs: US-001, FR-002, NFR-001, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-004; confirmar que `src/delegation/behavior.ts` não existe.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-001 AC-004` — sem `behavior` nem `additional_behavior`, o resultado é o padrão.
  - [x] **VERIFY**: `npx vitest run tests/delegation-behavior.test.ts` — **RED observado**: `Cannot find module '../src/delegation/behavior'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T005 [P] [TEST] [TDD] [US-001] Derivar de AC-005 um caso Vitest falhando em tests/delegation-behavior.test.ts — Refs: US-001, FR-002, NFR-001, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-005.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-001 AC-005` — com `behavior`, o padrão não aparece no resultado.
  - [x] **VERIFY**: `npx vitest run tests/delegation-behavior.test.ts` — **RED observado**: `Cannot find module '../src/delegation/behavior'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T006 [P] [TEST] [TDD] [US-001] Derivar de AC-006 um caso Vitest falhando em tests/delegation-behavior.test.ts — Refs: US-001, FR-002, NFR-001, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-006.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-001 AC-006` — com `additional_behavior` e sem `behavior`, o resultado traz os dois textos.
  - [x] **VERIFY**: `npx vitest run tests/delegation-behavior.test.ts` — **RED observado**: `Cannot find module '../src/delegation/behavior'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T007 [P] [TEST] [TDD] [US-001] Derivar de AC-007 um caso Vitest falhando em tests/delegation-brief.test.ts — Refs: US-001, FR-003, NFR-001, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-007; confirmar que `src/delegation/brief.ts` não existe.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-001 AC-007` — o briefing contém o texto do comportamento, não o caminho.
  - [x] **VERIFY**: `npx vitest run tests/delegation-brief.test.ts` — **RED observado**: `Cannot find module '../src/delegation/brief'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T008 [P] [TEST] [TDD] [US-001] Derivar de AC-008 um caso Vitest falhando em tests/delegation-brief.test.ts — Refs: US-001, FR-003, NFR-001, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-008.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-001 AC-008` — o briefing nomeia o modelo do plano e lista skills e tools do perfil.
  - [x] **VERIFY**: `npx vitest run tests/delegation-brief.test.ts` — **RED observado**: `Cannot find module '../src/delegation/brief'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T009 [P] [TEST] [TDD] [US-001] Derivar de AC-009 um caso Vitest falhando em tests/delegation-brief.test.ts — Refs: US-001, FR-003, NFR-001, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-009.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-001 AC-009` — plano com dois agentes gera dois blocos, cada um nomeando seu perfil.
  - [x] **VERIFY**: `npx vitest run tests/delegation-brief.test.ts` — **RED observado**: `Cannot find module '../src/delegation/brief'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T010 [P] [TEST] [TDD] [US-001] Derivar de AC-010 um caso Vitest falhando em tests/delegation-runtime.test.ts — Refs: US-001, FR-004, NFR-002, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-010; confirmar que `src/delegation/run.ts` não existe.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-004 NFR-002 AC-010` — runtime `cli` é recusado nomeando a fatia ausente.
  - [x] **VERIFY**: `npx vitest run tests/delegation-runtime.test.ts` — **RED observado**: `Cannot find module '../src/delegation/run'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T011 [P] [TEST] [TDD] [US-001] Derivar de AC-011 um caso Vitest falhando em tests/delegation-runtime.test.ts — Refs: US-001, FR-004, NFR-001, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-011.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-004 NFR-001 AC-011` — runtime `auto` emite briefing normalmente.
  - [x] **VERIFY**: `npx vitest run tests/delegation-runtime.test.ts` — **RED observado**: `Cannot find module '../src/delegation/run'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T012 [P] [TEST] [TDD] [US-001] Derivar de AC-012 um caso Vitest falhando em tests/delegation-runtime.test.ts — Refs: US-001, FR-004, NFR-002, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-012.
  - [x] **EXECUTE**: Escrever o caso com root isolado e marcador `TRACEABILITY: US-001 FR-004 NFR-002 AC-012` — hash da árvore antes e depois da emissão permanece idêntico.
  - [x] **VERIFY**: `npx vitest run tests/delegation-runtime.test.ts` — **RED observado**: `Cannot find module '../src/delegation/run'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

#### Fase 2 — US-001 (P1): composição, briefing, fronteira e comando

**Objetivo**: `maestro run <execução>` emite o briefing pronto ou recusa nomeando o que falta.
**Teste independente**: `npx vitest run tests/delegation-behavior.test.ts tests/delegation-brief.test.ts tests/delegation-runtime.test.ts tests/run-command.test.ts` — todos verdes.

- [x] T013 [CODE] [US-001] Implementar a composição do comportamento em src/delegation/behavior.ts — Refs: US-001, FR-002, NFR-001, AC-004, AC-005, AC-006 — Depends: T004, T005, T006
  - [x] **PREP**: Confirmar RED de T004/T005/T006 e a regra de substituir-versus-somar da `SPEC-0015`.
  - [x] **EXECUTE**: `composeBehavior` puro sobre conteúdo já lido, com os três casos: padrão, substituição e soma. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/delegation-behavior.test.ts` — AC-004, AC-005 e AC-006 **GREEN**; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — função pura, sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivo criado nas seções 11–13.
  - [x] **IMPROVE**: Nenhuma melhoria adicional — a função é intencionalmente pequena, três ramos que espelham exatamente a regra da SPEC-0015.
  <!-- framework:evidence {"task":"T013","refs":["US-001","FR-002","NFR-001","AC-004","AC-005","AC-006"],"files":["src/delegation/behavior.ts"],"commands":[{"run":"npx vitest run tests/delegation-behavior.test.ts","exit":0}]} -->

- [x] T014 [CODE] [US-001] Implementar a montagem e a renderização do briefing em src/delegation/brief.ts — Refs: US-001, FR-003, NFR-001, AC-007, AC-008, AC-009 — Depends: T007, T008, T009
  - [x] **PREP**: Confirmar RED de T007/T008/T009 e o formato de `ApprovedPlan` e `AgentProfile`.
  - [x] **EXECUTE**: `buildBriefs` resolvendo perfil por nome e compondo o comportamento, e `renderBriefs` produzindo um bloco por agente. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/delegation-brief.test.ts` — AC-007, AC-008 e AC-009 **GREEN**.
  - [x] **VISUAL**: Não aplicável — texto para leitura de agente, sem tela.
  - [x] **EVIDENCE**: Registrar GREEN e arquivo criado nas seções 11–13.
  - [x] **IMPROVE**: Melhoria aplicada: `readOrNull` trata `""` (nada declarado, convenção da SPEC-0015) como ausência antes de chamar o leitor — sem isso, um perfil sem `behavior` tentaria ler um arquivo chamado string vazia.
  <!-- framework:evidence {"task":"T014","refs":["US-001","FR-003","NFR-001","AC-007","AC-008","AC-009"],"files":["src/delegation/brief.ts"],"commands":[{"run":"npx vitest run tests/delegation-brief.test.ts","exit":0}]} -->

- [x] T015 [CODE] [US-001] Implementar a fronteira de runtime e a orquestração em src/delegation/run.ts — Refs: US-001, FR-004, NFR-001, NFR-002, AC-010, AC-011, AC-012 — Depends: T010, T011, T012
  - [x] **PREP**: Confirmar RED de T010/T011/T012 e o domínio de `runtime` no plano.
  - [x] **EXECUTE**: Leitura do plano, validação de runtime (`native`/`auto` emitem, `cli` recusa nomeando a fatia), composição e devolução do texto — sem escrever nada em disco. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/delegation-runtime.test.ts` — AC-010, AC-011 e AC-012 **GREEN**.
  - [x] **VISUAL**: Não aplicável — sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivo criado nas seções 11–13.
  - [x] **IMPROVE**: Nenhuma melhoria adicional — a recusa por `cli` e a ausência de escrita são o resultado mais direto possível da decisão já tomada.
  <!-- framework:evidence {"task":"T015","refs":["US-001","FR-004","NFR-001","NFR-002","AC-010","AC-011","AC-012"],"files":["src/delegation/run.ts"],"commands":[{"run":"npx vitest run tests/delegation-runtime.test.ts","exit":0}]} -->

- [x] T016 [CODE] [US-001] Ligar o comando run em src/cli.ts, com USAGE_RUN e o identificador posicional — Refs: US-001, FR-001, NFR-001, NFR-002, AC-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [x] **PREP**: Confirmar RED de T001/T002/T003 e o padrão de `hasHelp` e recusa de flag desconhecida.
  - [x] **EXECUTE**: `USAGE_RUN`, entrada `run` na tabela, identificador posicional obrigatório e recusa nomeada quando ausente ou sem plano. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/run-command.test.ts` — AC-001, AC-002 e AC-003 **GREEN**. Verificado com o binário real: ciclo completo `maestro plan` (aprovado) seguido de `maestro run <trace>` produziu o briefing autossuficiente do perfil `maestro`, com comportamento composto, modelo e capacidades — e nenhum arquivo novo foi criado além do próprio plano já existente.
  - [x] **VISUAL**: Não aplicável — comando de terminal, sem tela.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados nas seções 11–13.
  - [x] **IMPROVE**: **Correção durante a implementação**: o teste de AC-001 original esperava a mensagem em português/inglês combinados; a mensagem real do comando é em inglês, como todas as outras `USAGE_*` do projeto — ajustado o caso, não o comando, para manter consistência de idioma entre comandos.
  <!-- framework:evidence {"task":"T016","refs":["US-001","FR-001","NFR-001","NFR-002","AC-001","AC-002","AC-003"],"files":["src/cli.ts"],"commands":[{"run":"npx vitest run tests/run-command.test.ts","exit":0}]} -->

**Checkpoint**: `maestro plan` aprova, `maestro run` emite o briefing pronto para o agente delegar.

#### Fase final — Documentação e qualidade

- [x] T017 [DOC] [US-001] Registrar o comando e o formato do briefing em .project-context/STACK.md e revisar PROJECT.md — Refs: US-001, FR-001, FR-003, AC-002, AC-007 — Depends: T013, T014, T015, T016
  - [x] **PREP**: Confirmar T013–T016 GREEN e o conteúdo atual dos dois documentos.
  - [x] **EXECUTE**: Seção nova em `.project-context/STACK.md` (comando, composição do comportamento, fronteira de runtime) e revisão de `PROJECT.md`, corrigindo "O que ainda não existe" para dizer que o plano já tem consumidor, e o que continua faltando.
  - [x] **VERIFY**: `build_documentation.mjs --project . --check` limpo; `docs/` reconstruído. `.project-context/STACK.md` ganhou a seção do comando e `PROJECT.md` registrou a capacidade nova, corrigindo "O que ainda não existe" para dizer que o briefing sai pronto, mas ninguém prova que um subagent de fato rodou. `monitor_context.mjs --check` sinaliza `.project-context/PACKAGES.md` pendente por causa do bump de versão do próprio pacote — sem dependência real alterada (`git diff package.json` mostra só a versão).
  - [x] **VISUAL**: Não aplicável — documentação em Markdown, sem tela.
  - [x] **EVIDENCE**: Registrar comandos e resultado nas seções 11–13.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T018 [TEST] Regressão completa e verificação com o binário real sobre tests/delegation-*.test.ts e a suíte inteira — Refs: US-001, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 — Depends: T013, T014, T015, T016, T017
  - [x] **PREP**: Identificar suites, checks e gates aplicáveis.
  - [x] **EXECUTE**: `npx vitest run`, `npx tsc --noEmit`, `check_traceability.mjs`, `verify_acceptance.mjs`, e o ciclo real `maestro plan` seguido de `maestro run` neste projeto.
  - [x] **VERIFY**: **488/488 testes** em 180 arquivos, `tsc` limpo, `Rastreabilidade: 19/19 IDs cobertos`. Ciclo real `maestro plan` → `maestro run` confirmado, briefing autossuficiente, nada gravado além do plano preexistente.
  - [x] **VISUAL**: Não aplicável — repasse final sem superfície visual própria.
  - [x] **EVIDENCE**: Registrar contagens e comandos finais nas seções 11–13.
  - [x] **IMPROVE**: Retrospectiva: duas regressões de novo da mesma família das fatias anteriores — `mcp-surface` e `setup-surface` fixavam a lista exata de comandos, e `run` chegou. Atualizadas sem drama, terceira vez que esse padrão se repete; talvez valha considerar, fora do escopo desta spec, um guard que afirme só a propriedade real (nenhum comando tem tool MCP própria) em vez de comparar lista inteira — mas isso é decisão de outra sessão, não desta fatia.

### 15. Ordem de execução

- Caminho crítico: T001–T012 (paralelas) → T013 → T014 → T015 → T016 → T017 → T018.
- Tarefas paralelas: T001–T012 são independentes entre si. T014 depende de T013 porque compõe o texto que ela produz; T015 depende de T014 porque decide sobre o briefing montado; T016 é a casca dos três.
- Restrição de sequenciamento: a verificação com o binário real (T016 e T018) exige `npm run build`, que exige bump de versão quando `src/` mudou.
- Estratégia de MVP: não aplicável — é uma história só, e um briefing sem composição de comportamento entregaria caminhos em vez de texto, que é exatamente o que a `DEC-002` desta spec rejeita.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- `SPEC-0016` (plano aprovado) — entregue; fornece o artefato consumido aqui.
- `SPEC-0015` (perfis de agente) — entregue; fornece a configuração e a regra de composição.

#### Riscos

- O briefing é texto para um leitor com cognição, não contrato de máquina: mudanças de formato não quebram parser nenhum, mas também não são detectáveis por teste de contrato → mitigado por afirmar presença de conteúdo (comportamento, modelo, skills) em vez de forma exata.
- Recusar o plano inteiro quando um agente pede `cli` pode frustrar quem tem um plano misto → aceito deliberadamente: emitir metade de um plano aprovado seria decidir por conta própria o que fazer com a outra metade.
- A fatia entrega valor só quando alguém lê o briefing e delega; sozinha ela não muda nada observável no sistema → aceito: é a natureza da fronteira que a arquitetura impõe, e reconhecê-la é melhor que fingir execução.

#### Suposições

- O comportamento padrão a usar como base é o do perfil `maestro` semeado; um subagent sem `behavior` próprio herda esse texto, que é o único padrão que o projeto distribui.
- O identificador da execução chega como argumento posicional, não como flag, por ser o único argumento obrigatório do comando.

### 17. Decisões

- **DEC-001**: A CLI emite briefing e não aciona subagent — razão: um processo de terminal não tem acesso ao mecanismo de subagent da ferramenta hospedeira; prometer execução seria prometer o que não se pode cumprir. Alternativa descartada: gravar arquivos que o agente carrega, que troca a mesma divisão de trabalho por mais estado em disco — rodada 1.
- **DEC-002**: A CLI resolve a composição e entrega texto final — razão: a regra da `SPEC-0015` fica verificável em teste, num lugar só; deixá-la para o agente a transformaria em convenção de prompt, que ninguém consegue provar que foi seguida — rodada 2.
- **DEC-003**: `native` e `auto` emitem; `cli` é recusado nomeando a fatia ausente — razão: emitir briefing para uma via que ninguém sabe executar sugeriria capacidade inexistente. Alternativa descartada: emitir para os três e deixar o agente se virar — rodada 3.
- **DEC-004**: Nada é gravado — razão: emitir briefing não é evidência de que algo rodou, e um registro de "entregue" mentiria sobre execução; a telemetria com resultado real é a MA-6. Alternativa descartada: marcar o plano como despachado — rodada 4.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Os cenários `AC-001` a `AC-012` passam.
- [x] `FR-001` a `FR-004` e `NFR-001`/`NFR-002` têm evidência de verificação nas seções 11–12.
- [x] Todas as tarefas da seção 14 estão concluídas — 18/18, 108/108 itens.
- [x] `.project-context/STACK.md` registra o comando novo e o formato do briefing.
- [x] `PROJECT.md` revisado quanto à capacidade nova e à correção de "O que ainda não existe".
