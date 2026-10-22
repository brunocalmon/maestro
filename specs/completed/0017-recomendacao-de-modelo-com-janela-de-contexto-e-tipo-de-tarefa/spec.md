# Especificação integrada: Recomendacao de modelo com janela de contexto e tipo de tarefa

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0017 |
| Slug | 0017-recomendacao-de-modelo-com-janela-de-contexto-e-tipo-de-tarefa |
| Status | Complete |
| Effort | 5 |
| Effort rationale | Estende uma função pura já entregue e acrescenta uma leitura local nova (`ollama show`), uma seção de schema e a passagem do tipo por dois comandos. Menor que MA-1 e MA-2: não cria mecanismo novo, encaixa dois critérios numa decisão que já existe. O que exige cuidado é não quebrar o comportamento atual de quem chama sem tipo. |
| Effort updated at | 2026-09-07 |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — função pura, leitura local e saída de terminal, sem tela. |
| Atualizada em | 2026-09-07 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

`recommend()` escolhe o maior modelo local que cabe na memória livre. Só isso.
Um modelo pode caber com folga e ainda assim ser inviável para a tarefa: se a
janela de contexto não comporta o que vai ser entregue a ele, a execução falha
no ponto mais caro — depois de gastar os tokens. O `behavior.md` semeado pela
`SPEC-0015` instrui o maestro a "vigiar a janela de contexto antes de
delegar", e hoje não existe dado no sistema que sustente essa instrução.

Não há também como diferenciar exigências por natureza do trabalho: uma
revisão que precisa ler um repositório inteiro e um ajuste pontual de texto
recebem exatamente a mesma recomendação.

#### Resultado desejado

`recommend()` passa a considerar dois critérios novos, ambos explícitos:
a **janela de contexto** de cada modelo, lida localmente de `ollama show`, e
o **tipo de tarefa**, informado por quem chama. Os tipos e o que cada um exige
vivem em `.maestro/config.yaml`, semeados de fábrica como arquivo real.

Um modelo cuja janela não alcança o mínimo do tipo é descartado antes da
comparação por tamanho — não é uma escolha pior, é inviável. Sem tipo
informado, nenhuma exigência de janela é inventada e a recomendação é
exatamente a de hoje.

#### Métricas de sucesso

- Com um tipo que exige janela grande, um modelo de janela pequena deixa de ser recomendado mesmo sendo o maior que cabe na memória.
- Sem tipo informado, a recomendação é idêntica à atual, byte a byte no relatório exceto pela linha que declara a ausência de tipo.
- Nenhuma janela é consultada para modelo que já foi descartado por memória.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] `ollama show <modelo>` expõe a janela de contexto localmente, sem rede e sem autenticação — Verdict: verified — Confidence: high — Evidence: execução real nesta máquina durante a descoberta, `ollama show cogito:14b` devolvendo `context length 131072` entre `parameters` e `embedding length` — Budget: 1/1.

#### Fontes e contexto consultados

- `src/models/recommend.ts` — `recommendLocalModel` (maior que cabe em `capacity.freeBytes`), `renderReport` e a regra de override que não revalida (`DEC-039`).
- `src/models/ollama.ts` — `OllamaModel { name, sizeBytes }` e `OllamaSnapshot { present, models }`, hoje alimentados só por `ollama list`.
- `src/models/capacity.ts` — origem de `freeBytes`.
- `src/config/schema.ts` — `SCHEMA_KEYS` e o padrão da seção `maestro:` entregue pela `SPEC-0015`, incluindo o wrapper `{ value, mode }`.
- `src/plan/assemble.ts` — como a recomendação entra no plano (`SPEC-0016`).
- `src/cli.ts` — `formatRecommend` e `parseRecommendOverride`.

#### Documentação consultada

- Nenhuma documentação externa; a capacidade do `ollama show` foi verificada por execução real, não por leitura de documentação.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo. `R-001` foi verificado por execução local, cuja saída está transcrita acima.

#### Dúvidas respondidas

- **Q**: De onde vem o tipo de tarefa? → **A**: entrada explícita de quem chama; o código não infere tipo a partir do texto, consistente com `PR-002` da `SPEC-0016` (rodada 1).
- **Q**: Quem define os tipos e seus requisitos? → **A**: `.maestro/config.yaml`, com defaults semeados como arquivo real; nada hardcoded em `src/` (rodada 2).
- **Q**: Como a janela entra na escolha? → **A**: filtro duro primeiro, tamanho depois — janela insuficiente torna o modelo inviável, não apenas pior (rodada 3).
- **Q**: Como tratar o custo de ler a janela? → **A**: consultar sob demanda, só os modelos que já passaram no filtro de memória; sem cache nem estado novo em disco (rodada 4).
- **Q**: E se nenhum modelo satisfizer a janela mínima? → **A**: `localModel: null`, declarando o motivo, o mínimo exigido e a maior janela disponível (rodada 5).
- **Q**: E quando nenhum tipo é informado? → **A**: nenhuma exigência é inventada; comporta-se como hoje e o relatório declara que nenhum tipo foi informado (rodada 6).

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Leitura da janela de contexto de um modelo, local, via `ollama show`.
- Seção de tipos de tarefa em `.maestro/config.yaml`, com requisito de janela mínima por tipo, semeada de fábrica.
- Extensão de `recommend()` para receber o tipo e aplicar o filtro de janela antes da comparação por tamanho.
- Passagem do tipo pelos comandos `recommend` e `plan`.
- Relatório declarando o tipo considerado, o mínimo exigido e o motivo de uma ausência.

#### Fora de escopo

- Inferir tipo de tarefa a partir do texto (decisão rodada 1).
- Cache de janelas em disco (decisão rodada 4).
- Estimar quanto contexto uma tarefa concreta vai consumir — o requisito vem do tipo, não de medição da tarefa.
- Janela de contexto de modelos de nuvem: `recommend` só calcula modelo local, e essa fronteira não muda aqui.
- Custo e uso de plano, que a `SPEC-0009` já colocou deliberadamente fora.
- Executar qualquer coisa com o modelo recomendado (fatias MA-4 e MA-5).

#### Atores

- **Agente que planeja**: leu a tarefa e sabe o tipo; informa-o ao pedir a recomendação.
- **Pessoa no terminal**: pode informar o tipo por flag ao rodar `recommend`, ou omitir e obter o comportamento atual.
- **Pessoa que configura**: declara em `.maestro/config.yaml` quais tipos existem e o que cada um exige.

### 4. Princípios e restrições do projeto

- **PR-001**: O código não infere semanticamente o tipo da tarefa — quem sabe informa (`SPEC-0016`, `PR-002`).
- **PR-002**: Nada implícito, nada hardcoded: os tipos e seus requisitos são arquivo real, referenciado explicitamente (`SPEC-0015`, `PR-001`).
- **PR-003**: Detecção é local, sem rede e sem autenticação (`SPEC-0008`).
- **PR-004**: Ausência é declarada, nunca disfarçada de escolha (`SPEC-0009`).
- **PR-005**: Um override humano não é revalidado contra cálculo (`SPEC-0009`, `DEC-039`) — o filtro novo também não se aplica sobre um modelo escolhido à mão.

### 5. Histórias de usuário

#### US-001 — Recomendar um modelo que comporte o trabalho (P1)

Como quem vai delegar uma tarefa, quero que a recomendação descarte modelos
cuja janela de contexto não comporta o tipo de trabalho, para não descobrir a
inviabilidade depois de gastar os tokens.

**Por que P1**: é a única história da fatia.
**Teste independente**: informar um tipo que exige janela grande e confirmar que um modelo de janela pequena deixa de ser recomendado, mesmo sendo o maior que cabe na memória.
**Requisitos**: FR-001, FR-002, FR-003, FR-004

### 6. Cenários BDD de aceite

#### AC-001 — a janela é lida do modelo, localmente

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-001
Feature: leitura da janela de contexto

  Scenario: modelo com janela declarada
    Given a saída de ollama show para um modelo instalado
    When a janela de contexto é extraída
    Then o valor devolvido é o número declarado como context length
```

#### AC-002 — saída sem janela não vira zero

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-002
Feature: leitura da janela de contexto

  Scenario: modelo que não declara context length
    Given uma saída de ollama show sem a linha de context length
    When a janela de contexto é extraída
    Then o resultado é ausência declarada, não o número zero
```

#### AC-003 — falha na leitura é ausência, não exceção

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-003
Feature: leitura da janela de contexto

  Scenario: o comando falha para um modelo
    Given um modelo cujo ollama show retorna erro
    When a janela de contexto é consultada
    Then o resultado é ausência declarada
    And nenhuma exceção escapa para quem chamou
```

#### AC-004 — os tipos de tarefa vêm da configuração

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-004
Feature: tipos de tarefa configuráveis

  Scenario: projeto recém-configurado
    Given um projeto onde o setup rodou
    When alguém inspeciona a configuração
    Then a seção de tipos de tarefa está presente
    And cada tipo declara sua janela mínima exigida
```

#### AC-005 — a configuração da pessoa não é sobrescrita

**Cobre**: US-001, FR-002, NFR-002

```gherkin
@US-001 @FR-002 @NFR-002 @AC-005
Feature: tipos de tarefa configuráveis

  Scenario: tipo acrescentado pela pessoa
    Given uma configuração com um tipo de tarefa próprio declarado
    When o setup roda de novo
    Then o tipo próprio continua declarado, inalterado
```

#### AC-006 — tipo desconhecido é recusado

**Cobre**: US-001, FR-002, NFR-002

```gherkin
@US-001 @FR-002 @NFR-002 @AC-006
Feature: tipos de tarefa configuráveis

  Scenario: tipo que a configuração não declara
    Given uma configuração com os tipos de fábrica
    When a recomendação é pedida para um tipo inexistente
    Then o pedido é recusado nomeando o tipo e os tipos disponíveis
```

#### AC-007 — janela insuficiente descarta o modelo

**Cobre**: US-001, FR-003, NFR-001

```gherkin
@US-001 @FR-003 @NFR-001 @AC-007
Feature: filtro por janela de contexto

  Scenario: o maior modelo não comporta a janela exigida
    Given um modelo grande de janela pequena e um menor de janela suficiente
    And um tipo de tarefa que exige a janela maior
    When a recomendação é calculada
    Then o modelo recomendado é o de janela suficiente
```

#### AC-008 — entre os viáveis, o maior continua vencendo

**Cobre**: US-001, FR-003, NFR-001

```gherkin
@US-001 @FR-003 @NFR-001 @AC-008
Feature: filtro por janela de contexto

  Scenario: dois modelos satisfazem a janela
    Given dois modelos que cabem na memória e satisfazem a janela exigida
    When a recomendação é calculada
    Then o modelo recomendado é o maior deles
```

#### AC-009 — nenhum viável declara o motivo

**Cobre**: US-001, FR-003, FR-004, NFR-002

```gherkin
@US-001 @FR-003 @FR-004 @NFR-002 @AC-009
Feature: filtro por janela de contexto

  Scenario: nenhum modelo alcança a janela exigida
    Given apenas modelos cuja janela é menor que a exigida pelo tipo
    When a recomendação é calculada
    Then nenhum modelo local é recomendado
    And o relatório declara o mínimo exigido e a maior janela disponível
```

#### AC-010 — sem tipo, o comportamento é o de hoje

**Cobre**: US-001, FR-004, NFR-002

```gherkin
@US-001 @FR-004 @NFR-002 @AC-010
Feature: ausência de tipo

  Scenario: recomendação pedida sem tipo de tarefa
    Given modelos de janelas diferentes que cabem na memória
    When a recomendação é calculada sem tipo informado
    Then o modelo recomendado é o maior que cabe, como antes
    And o relatório declara que nenhum tipo foi informado
```

#### AC-011 — sem tipo, nenhuma janela é consultada

**Cobre**: US-001, FR-001, FR-004, NFR-001

```gherkin
@US-001 @FR-001 @FR-004 @NFR-001 @AC-011
Feature: ausência de tipo

  Scenario: custo de uma recomendação sem exigência
    Given uma máquina com vários modelos instalados
    When a recomendação é calculada sem tipo informado
    Then nenhuma consulta de janela é feita
```

#### AC-012 — a janela só é consultada para quem passou na memória

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-012
Feature: custo da leitura

  Scenario: modelo que não cabe na memória
    Given um modelo maior que a memória livre e outro que cabe
    And um tipo de tarefa com janela exigida
    When a recomendação é calculada
    Then a janela é consultada apenas para o modelo que cabe
```

#### AC-013 — o relatório declara o tipo considerado

**Cobre**: US-001, FR-004, NFR-001

```gherkin
@US-001 @FR-004 @NFR-001 @AC-013
Feature: relato da decisão

  Scenario: recomendação com tipo informado
    Given um tipo de tarefa informado e um modelo recomendado
    When o relatório é gerado
    Then ele nomeia o tipo considerado e a janela mínima que ele exige
```

#### AC-014 — um override escapa do filtro

**Cobre**: US-001, FR-003, NFR-002

```gherkin
@US-001 @FR-003 @NFR-002 @AC-014
Feature: relato da decisão

  Scenario: modelo escolhido à mão apesar da janela
    Given um tipo que exige janela grande
    And um override humano apontando um modelo de janela pequena
    When a recomendação é calculada
    Then o modelo do override é mantido
    And o relatório o marca como escolha humana
```

### 7. Requisitos

#### Funcionais

- **FR-001**: Deve existir uma leitura local da janela de contexto de um modelo, a partir de `ollama show <modelo>`, devolvendo o número declarado como `context length`; saída sem essa linha, ou comando que falha, devem produzir ausência declarada, nunca zero nem exceção; a consulta só pode acontecer para modelos que já passaram no filtro de memória, e não deve acontecer quando nenhum tipo foi informado.
- **FR-002**: `.maestro/config.yaml` deve declarar os tipos de tarefa e a janela mínima exigida por cada um, semeados de fábrica quando ausentes e nunca sobrescritos depois; um tipo que a configuração não declara deve ser recusado nomeando o tipo pedido e os disponíveis.
- **FR-003**: `recommend()` deve descartar, antes de comparar tamanhos, qualquer modelo cuja janela seja menor que a exigida pelo tipo informado; entre os viáveis, deve manter a regra atual do maior que cabe na memória; um `localModel` vindo de override humano não passa por esse filtro.
- **FR-004**: Sem tipo informado, nenhuma exigência de janela deve ser aplicada e a recomendação deve ser a atual; o relatório deve declarar o tipo considerado e o mínimo exigido quando houver tipo, declarar a ausência de tipo quando não houver, e, quando nenhum modelo alcançar o mínimo, declarar o mínimo exigido e a maior janela disponível.

#### Não funcionais

- **NFR-001**: A escolha e o custo da recomendação são explicáveis a partir do relatório e determinísticos para a mesma entrada — mesmos modelos, mesma memória e mesmo tipo produzem a mesma saída, e nenhuma consulta de janela acontece além das necessárias. **Verificação**: casos com ambiente injetado contando consultas, e comparação de relatórios.
- **NFR-002**: Nenhuma ausência vira valor: janela não declarada, comando falho ou tipo desconhecido nunca produzem um número inventado nem uma recomendação silenciosa. **Verificação**: casos de saída sem `context length`, comando com erro e tipo inexistente.

#### Erros e casos-limite

- `ollama show` falha ou o modelo sumiu entre o `list` e o `show` → ausência declarada para aquele modelo, que fica de fora dos viáveis; os demais seguem sendo avaliados.
- Tipo declarado na configuração sem janela mínima → tratado como tipo sem exigência de janela, não como exigência zero.
- Janela mínima maior que a de qualquer modelo instalado → `localModel: null` com o motivo (AC-009).
- Nenhum modelo cabe na memória → o filtro de janela nem chega a ser aplicado; o motivo continua sendo memória, como hoje.
- Override humano apontando modelo inexistente → comportamento atual preservado: o override não é revalidado (`PR-005`).

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

`recommendLocalModel(ollama, capacity)` filtra por `sizeBytes <= freeBytes` e
reduz ao maior. `renderReport` monta o texto. `OllamaModel` tem só `name` e
`sizeBytes`. `listOllamaModels()` executa `ollama list` uma vez. `formatRecommend`
resolve as três fontes reais e imprime `recommendation.report`.

#### Arquitetura e módulos

- `src/models/context-window.ts` (novo): `parseContextLength(output)` puro sobre a saída de `ollama show`, e `realContextWindowReader()` executando o comando; ambos devolvendo `number | null`.
- `src/models/task-type.ts` (novo): tipos do domínio e `resolveTaskType(config, name)` devolvendo o requisito ou uma recusa nomeando os disponíveis.
- `src/config/schema.ts`: seção `task_types` dentro de `maestro:`, com `context_window_min` por tipo, no mesmo wrapper `{ value, mode }`; entra em `SCHEMA_KEYS`.
- `src/models/recommend.ts`: `recommend()` ganha um parâmetro opcional com o requisito resolvido e um leitor de janela injetável; `recommendLocalModel` passa a filtrar por janela antes de reduzir por tamanho; `renderReport` ganha as linhas novas.
- `src/cli.ts`: flag `--task-type` em `recommend` e em `plan`, resolvida contra a configuração antes de chamar `recommend()`.
- `src/plan/assemble.ts`: nenhuma mudança de assinatura — recebe a recomendação já calculada, como hoje.

#### Migrations

- Não aplicável.

#### Models

- `TaskType`: `{ name: string; contextWindowMin: number | null }`. Invariante: `null` significa "tipo sem exigência", distinto de `0`.
- `ContextWindowReader`: `(model: string) => number | null`, injetável para o custo e a falha serem exercitáveis sem `ollama` instalado.

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
specs/draft/0017-recomendacao-de-modelo-com-janela-de-contexto-e-tipo-de-tarefa/
  spec.md
src/
  models/context-window.ts
  models/task-type.ts
  models/recommend.ts
  config/schema.ts
  cli.ts
resources/
  agents/maestro/
tests/
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| `TaskType` | `name` | `contextWindowMin` nulo é ausência de exigência, não zero | declarado em `maestro.task_types` |
| Janela de um modelo | `name` do modelo | número ou ausência; nunca zero por falha | derivada de `ollama show`, não persistida |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Modelo candidato | cabe na memória | janela consultada e suficiente | viável | só consultado depois do filtro de memória |
| Modelo candidato | cabe na memória | janela insuficiente ou ausente | descartado | descarte é declarado no relatório |

#### Migração e retenção

- Nada persistido: a janela é lida no momento do cálculo e descartada (decisão rodada 4).

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não. Função pura, leitura local e texto em stdout.

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

- `maestro recommend [--task-type <nome>]` e `maestro plan --task "<descrição>" [--task-type <nome>]`.
- `parseContextLength(output)`, `realContextWindowReader()`, `resolveTaskType(config, name)`.
- `recommend(backends, ollama, capacity, override, requirement?, reader?)`.

#### APIs externas utilizadas

- Nenhuma pela rede. `ollama show` é subprocesso local, mesma fronteira do `ollama list` já usado.

#### Documentação das APIs consultadas

- Não aplicável.

#### Eventos e outros contratos

- Não aplicável.

### 11. Estratégia TDD

- **Unidade**: extração da janela sobre saída fixa; resolução de tipo; filtro e ordenação em `recommendLocalModel`; texto do relatório.
- **Integração/contrato**: semeadura da seção de tipos pelo `setup`; contagem de consultas com leitor injetado.
- **BDD/aceite**: os catorze cenários da seção 6 orientam os catorze casos TDD (um por AC).
- **Runner TDD**: Vitest, já materializado em `test:tdd`.
- **E2E**: não aplicável.
- **Verificação manual**: uma única, complementar e não substitutiva — rodar `maestro recommend --task-type <tipo>` nesta máquina, que tem `ollama` com modelos de janelas diferentes, para confirmar que a leitura real casa com o que os casos exercitam com saída fixa.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, AC-001 | AC-001 na seção 6 | tests/context-window.test.ts (T001) | `Cannot find module '../src/models/context-window'` | GREEN | 476/476 na suíte completa |
| US-001, FR-001, NFR-002, AC-002 | AC-002 na seção 6 | tests/context-window.test.ts (T002) | `Cannot find module '../src/models/context-window'` | GREEN | 476/476 na suíte completa |
| US-001, FR-001, NFR-002, AC-003 | AC-003 na seção 6 | tests/context-window.test.ts (T003) | `Cannot find module '../src/models/context-window'` | GREEN | 476/476 na suíte completa |
| US-001, FR-002, NFR-001, AC-004 | AC-004 na seção 6 | tests/task-types-config.test.ts (T004) | `maestro.task_types` ausente na config semeada | GREEN | 476/476 na suíte completa |
| US-001, FR-002, NFR-002, AC-005 | AC-005 na seção 6 | tests/task-types-config.test.ts (T005) | `task_types` inexistente, então o tipo próprio não tem onde sobreviver | GREEN | 476/476 na suíte completa |
| US-001, FR-002, NFR-002, AC-006 | AC-006 na seção 6 | tests/task-types-config.test.ts (T006) | `Cannot find module '../src/models/task-type'` | GREEN | 476/476 na suíte completa |
| US-001, FR-003, NFR-001, AC-007 | AC-007 na seção 6 | tests/recommend-context-window.test.ts (T007) | recomenda `grande:14b` (o maior que cabe), ignorando a janela insuficiente | GREEN | 476/476 na suíte completa |
| US-001, FR-003, NFR-001, AC-008 | AC-008 na seção 6 | tests/recommend-context-window.test.ts (T008) | **guard-rail**: passa hoje, porque sem filtro o maior já vence — precisa continuar vencendo entre os viáveis depois do filtro | GREEN | 476/476 na suíte completa |
| US-001, FR-003, FR-004, NFR-002, AC-009 | AC-009 na seção 6 | tests/recommend-context-window.test.ts (T009) | recomenda um modelo em vez de declarar ausência; o relatório não cita mínimo nem maior janela | GREEN | 476/476 na suíte completa |
| US-001, FR-004, NFR-002, AC-010 | AC-010 na seção 6 | tests/recommend-sem-tipo.test.ts (T010) | o relatório não declara que nenhum tipo foi informado | GREEN | 476/476 na suíte completa |
| US-001, FR-001, FR-004, NFR-001, AC-011 | AC-011 na seção 6 | tests/recommend-sem-tipo.test.ts (T011) | **guard-rail**: passa hoje, porque o leitor ainda não existe — precisa seguir sem consultas depois do filtro existir | GREEN | 476/476 na suíte completa |
| US-001, FR-001, NFR-001, AC-012 | AC-012 na seção 6 | tests/recommend-sem-tipo.test.ts (T012) | nenhuma consulta é feita (`[]`), quando o esperado é uma só, para o modelo que coube | GREEN | 476/476 na suíte completa |
| US-001, FR-004, NFR-001, AC-013 | AC-013 na seção 6 | tests/recommend-relato.test.ts (T013) | o relatório não nomeia o tipo nem a janela mínima | GREEN | 476/476 na suíte completa |
| US-001, FR-003, NFR-002, AC-014 | AC-014 na seção 6 | tests/recommend-relato.test.ts (T014) | **guard-rail**: passa hoje, porque não há filtro do qual escapar — o override precisa continuar escapando depois | GREEN | 476/476 na suíte completa |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Unidade (pura) | `tests/context-window.test.ts` | Passed |
| FR-001 | AC-002 | Unidade (pura) | `tests/context-window.test.ts` | Passed |
| FR-001 | AC-003 | Unidade (ambiente injetado) | `tests/context-window.test.ts` | Passed |
| FR-002 | AC-004 | Integração (root isolado) | `tests/task-types-config.test.ts` | Passed |
| FR-002 | AC-005 | Integração (root isolado) | `tests/task-types-config.test.ts` | Passed |
| FR-002 | AC-006 | Unidade | `tests/task-types-config.test.ts` | Passed |
| FR-003 | AC-007 | Unidade (pura) | `tests/recommend-context-window.test.ts` | Passed |
| FR-003 | AC-008 | Unidade (pura) | `tests/recommend-context-window.test.ts` | Passed |
| FR-003 | AC-009 | Unidade (pura) | `tests/recommend-context-window.test.ts` | Passed |
| FR-004 | AC-010 | Unidade (pura) | `tests/recommend-sem-tipo.test.ts` | Passed |
| FR-004 | AC-011 | Unidade (leitor contado) | `tests/recommend-sem-tipo.test.ts` | Passed |
| FR-001 | AC-012 | Unidade (leitor contado) | `tests/recommend-sem-tipo.test.ts` | Passed |
| FR-004 | AC-013 | Unidade (pura) | `tests/recommend-relato.test.ts` | Passed |
| FR-003 | AC-014 | Unidade (pura) | `tests/recommend-relato.test.ts` | Passed |
| NFR-001 | AC-001, AC-007, AC-008, AC-011, AC-012, AC-013 | Unidade | ver linhas acima | Passed |
| NFR-002 | AC-002, AC-003, AC-005, AC-006, AC-009, AC-010, AC-014 | Unidade + integração | ver linhas acima | Passed |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-09-07)
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/draft/0017-recomendacao-de-modelo-com-janela-de-contexto-e-tipo-de-tarefa/spec.md --allow-draft` → `VALID DRAFT`.
- **Achados**: Nenhum `BLOCKER`. As seis decisões da entrevista viraram `FR`, `AC` ou `DEC` rastreáveis. Cobertura: US-001 → 14 AC; FR-001 → 5; FR-002 → 3; FR-003 → 5; FR-004 → 5; NFR-001 → 6; NFR-002 → 7. `R-001` é o único claim material da fatia e foi verificado por execução real (`ollama show cogito:14b` devolvendo `context length 131072`), não por leitura de documentação — o que importa porque a fatia inteira depende de esse dado existir localmente, sem rede. `Interface para pessoas: Não` justificada. Sem findings de segurança: a leitura é subprocesso local na mesma fronteira do `ollama list` já em uso.

#### Gate do Ato II — Plano

- **Resultado**: READY (2026-09-07)
- **Comando**: `node .claude/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/defined/0017-recomendacao-de-modelo-com-janela-de-contexto-e-tipo-de-tarefa/spec.md` — `READY` (`total=20 complete=14 tdd=15 code=4 covered_spec_ids=21 required_spec_ids=21`).
- **Achados**: Nenhum bloqueio. Das 14 tarefas `[TEST][TDD]` (uma por `AC`), **onze observaram RED literal** — módulo inexistente, seção de schema ausente, ou a recomendação atual escolhendo o modelo errado. As outras três (`AC-008`, `AC-011`, `AC-014`) passam hoje e estão registradas como **guard-rails**, não como RED: elas afirmam comportamento que já existe e que precisa sobreviver ao filtro novo — o maior vence entre os viáveis, nenhuma janela é consultada sem tipo, e o override escapa do filtro. Forçá-las a falhar exigiria mudar o que o `AC` afirma, o que seria fabricar evidência em vez de produzi-la. Mesma postura já registrada em `AC-010` da `SPEC-0014`. As quatro `[CODE]` têm três ou mais predecessores TDD concluídos cada.

#### Gate do Ato III — Entrega

- **Resultado**: READY (2026-09-07) — 20/20 tarefas, 120/120 itens de checklist
- **Comando**: `node .claude/skills/framework-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0017-recomendacao-de-modelo-com-janela-de-contexto-e-tipo-de-tarefa/spec.md .`
- **Achados**: Nenhum bloqueio. **476/476 testes** em 176 arquivos, `tsc` limpo, `build_documentation.mjs --check` limpo. Verificado com o binário instalado numa máquina com três modelos de janelas reais diferentes (32768, 40960, 131072): sem tipo, recomenda como antes e declara a ausência; com um tipo de exigência baixa, recomenda citando a exigência; com um tipo de exigência alta, não recomenda e explica por quê; tipo inexistente é recusado nomeando os disponíveis.
- Um defeito foi encontrado e corrigido nessa verificação, e não aparecia em teste nenhum: o relatório dizia `Largest available window: 32768` quando havia um modelo de 131072 instalado — cortado antes pela memória. A frase induzia a conclusão de que a ferramenta estava errada; passou a nomear a restrição real.
- Uma regressão apareceu, e era interação legítima entre fatias: o `AC-002` da `SPEC-0015` percorre toda propriedade da seção `maestro:` exigindo o formato `{ value, mode }`, e `task_types` é mapa de tipos, não propriedade — mesmo status de `subagents`. O guard foi estendido para alcançar as propriedades aninhadas, em vez de apenas ignorar o grupo novo: assim um grupo futuro não escapa da invariante só por ser aninhado.

#### Aceite final (`$framework-04-validate`)

- **Resultado**: READY (2026-09-07)
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/review/0017-recomendacao-de-modelo-com-janela-de-contexto-e-tipo-de-tarefa/spec.md` — `RESULTADO: READY`.
- **Achados**: Nenhum `BLOCKER`. Três gates `Passed` e Definition of Done comprovada. A instrução que a `SPEC-0015` semeou no `behavior.md` — "vigie a janela de contexto antes de delegar" — passou a ter dado que a sustente: antes era conselho sem base no sistema. Os três guard-rails declarados no Plan Gate seguiram verdes depois do filtro entrar, que era exatamente sua função. O único defeito da fatia foi de clareza do relatório e só apareceu com modelos reais de janelas diferentes; está corrigido e registrado. `Status: Complete`.

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

- [x] T001 [P] [TEST] [TDD] [US-001] Derivar de AC-001 um caso Vitest falhando em tests/context-window.test.ts — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-001; confirmar que `src/models/context-window.ts` não existe e capturar uma saída real de `ollama show`.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-001 AC-001` — `parseContextLength` sobre a saída real devolve o número declarado como `context length`.
  - [x] **VERIFY**: `npx vitest run tests/context-window.test.ts` — **RED observado**: `Cannot find module '../src/models/context-window'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T002 [P] [TEST] [TDD] [US-001] Derivar de AC-002 um caso Vitest falhando em tests/context-window.test.ts — Refs: US-001, FR-001, NFR-002, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-002.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-002 AC-002` — saída sem a linha devolve `null`, e o caso afirma explicitamente que não é `0`.
  - [x] **VERIFY**: `npx vitest run tests/context-window.test.ts` — **RED observado**: `Cannot find module '../src/models/context-window'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T003 [P] [TEST] [TDD] [US-001] Derivar de AC-003 um caso Vitest falhando em tests/context-window.test.ts — Refs: US-001, FR-001, NFR-002, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-003.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-002 AC-003` — leitor com ambiente injetado que falha devolve `null` sem lançar.
  - [x] **VERIFY**: `npx vitest run tests/context-window.test.ts` — **RED observado**: `Cannot find module '../src/models/context-window'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T004 [P] [TEST] [TDD] [US-001] Derivar de AC-004 um caso Vitest falhando em tests/task-types-config.test.ts — Refs: US-001, FR-002, NFR-001, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-004; confirmar que `maestro.task_types` não existe no schema.
  - [x] **EXECUTE**: Escrever o caso com root isolado e marcador `TRACEABILITY: US-001 FR-002 NFR-001 AC-004` — depois do `setup`, a seção existe e cada tipo declara sua janela mínima.
  - [x] **VERIFY**: `npx vitest run tests/task-types-config.test.ts` — **RED observado**: `maestro.task_types` ausente na config semeada.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T005 [P] [TEST] [TDD] [US-001] Derivar de AC-005 um caso Vitest falhando em tests/task-types-config.test.ts — Refs: US-001, FR-002, NFR-002, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-005.
  - [x] **EXECUTE**: Escrever o caso com root isolado e marcador `TRACEABILITY: US-001 FR-002 NFR-002 AC-005` — tipo próprio declarado pela pessoa sobrevive a uma segunda execução do `setup`.
  - [x] **VERIFY**: `npx vitest run tests/task-types-config.test.ts` — **RED observado**: `task_types` inexistente, então o tipo próprio não tem onde sobreviver.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T006 [P] [TEST] [TDD] [US-001] Derivar de AC-006 um caso Vitest falhando em tests/task-types-config.test.ts — Refs: US-001, FR-002, NFR-002, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-006.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-002 AC-006` — `resolveTaskType` com nome inexistente recusa nomeando o pedido e os disponíveis.
  - [x] **VERIFY**: `npx vitest run tests/task-types-config.test.ts` — **RED observado**: `Cannot find module '../src/models/task-type'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T007 [P] [TEST] [TDD] [US-001] Derivar de AC-007 um caso Vitest falhando em tests/recommend-context-window.test.ts — Refs: US-001, FR-003, NFR-001, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-007; confirmar a assinatura atual de `recommend`.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-001 AC-007` — modelo grande de janela pequena perde para o menor de janela suficiente.
  - [x] **VERIFY**: `npx vitest run tests/recommend-context-window.test.ts` — **RED observado**: recomenda `grande:14b` (o maior que cabe), ignorando a janela insuficiente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T008 [P] [TEST] [TDD] [US-001] Derivar de AC-008 um caso Vitest falhando em tests/recommend-context-window.test.ts — Refs: US-001, FR-003, NFR-001, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-008.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-001 AC-008` — entre dois viáveis, o maior continua vencendo.
  - [x] **VERIFY**: `npx vitest run tests/recommend-context-window.test.ts` — **Resultado observado**: **guard-rail**: passa hoje, porque sem filtro o maior já vence — precisa continuar vencendo entre os viáveis depois do filtro.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T009 [P] [TEST] [TDD] [US-001] Derivar de AC-009 um caso Vitest falhando em tests/recommend-context-window.test.ts — Refs: US-001, FR-003, FR-004, NFR-002, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-009.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 FR-004 NFR-002 AC-009` — nenhum modelo alcança o mínimo: `localModel` nulo e relatório citando mínimo exigido e maior janela disponível.
  - [x] **VERIFY**: `npx vitest run tests/recommend-context-window.test.ts` — **RED observado**: recomenda um modelo em vez de declarar ausência; o relatório não cita mínimo nem maior janela.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T010 [P] [TEST] [TDD] [US-001] Derivar de AC-010 um caso Vitest falhando em tests/recommend-sem-tipo.test.ts — Refs: US-001, FR-004, NFR-002, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-010; capturar o relatório atual como baseline.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-004 NFR-002 AC-010` — sem tipo, o modelo escolhido é o maior que cabe e o relatório declara a ausência de tipo.
  - [x] **VERIFY**: `npx vitest run tests/recommend-sem-tipo.test.ts` — **RED observado**: o relatório não declara que nenhum tipo foi informado.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T011 [P] [TEST] [TDD] [US-001] Derivar de AC-011 um caso Vitest falhando em tests/recommend-sem-tipo.test.ts — Refs: US-001, FR-001, FR-004, NFR-001, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-011.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 FR-004 NFR-001 AC-011` — leitor de janela instrumentado registra zero consultas quando nenhum tipo é informado.
  - [x] **VERIFY**: `npx vitest run tests/recommend-sem-tipo.test.ts` — **Resultado observado**: **guard-rail**: passa hoje, porque o leitor ainda não existe — precisa seguir sem consultas depois do filtro existir.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T012 [P] [TEST] [TDD] [US-001] Derivar de AC-012 um caso Vitest falhando em tests/recommend-sem-tipo.test.ts — Refs: US-001, FR-001, NFR-001, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-012.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-001 AC-012` — com tipo informado, o leitor é chamado só para o modelo que passou no filtro de memória.
  - [x] **VERIFY**: `npx vitest run tests/recommend-sem-tipo.test.ts` — **RED observado**: nenhuma consulta é feita (`[]`), quando o esperado é uma só, para o modelo que coube.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T013 [P] [TEST] [TDD] [US-001] Derivar de AC-013 um caso Vitest falhando em tests/recommend-relato.test.ts — Refs: US-001, FR-004, NFR-001, AC-013 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-013; confirmar o formato atual de `renderReport`.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-004 NFR-001 AC-013` — o relatório nomeia o tipo considerado e a janela mínima exigida.
  - [x] **VERIFY**: `npx vitest run tests/recommend-relato.test.ts` — **RED observado**: o relatório não nomeia o tipo nem a janela mínima.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T014 [P] [TEST] [TDD] [US-001] Derivar de AC-014 um caso Vitest falhando em tests/recommend-relato.test.ts — Refs: US-001, FR-003, NFR-002, AC-014 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-014; confirmar a regra de override que não revalida (`DEC-039`).
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-002 AC-014` — override de modelo com janela insuficiente é mantido e marcado como escolha humana.
  - [x] **VERIFY**: `npx vitest run tests/recommend-relato.test.ts` — **Resultado observado**: **guard-rail**: passa hoje, porque não há filtro do qual escapar — o override precisa continuar escapando depois.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

#### Fase 2 — US-001 (P1): leitura, tipos, filtro e superfície

**Objetivo**: `recommend` considera janela e tipo, e ambos chegam pelos comandos.
**Teste independente**: `npx vitest run tests/context-window.test.ts tests/task-types-config.test.ts tests/recommend-context-window.test.ts tests/recommend-sem-tipo.test.ts tests/recommend-relato.test.ts` — todos verdes.

- [x] T015 [CODE] [US-001] Implementar a leitura da janela de contexto em src/models/context-window.ts — Refs: US-001, FR-001, NFR-001, NFR-002, AC-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [x] **PREP**: Confirmar RED de T001/T002/T003 e a saída real de `ollama show` usada como referência.
  - [x] **EXECUTE**: `parseContextLength` puro e `realContextWindowReader` com ambiente injetável, ambos devolvendo `number | null`; falha e ausência produzem `null`, nunca `0` nem exceção. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/context-window.test.ts` — AC-001, AC-002 e AC-003 **GREEN**; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — leitura local, sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos criados nas seções 11–13.
  - [x] **IMPROVE**: Melhoria aplicada: `parseContextLength` rejeita zero e não-finito além de ausência da linha — um `0` vindo de saída estranha compararia como "menor que qualquer exigência" e desqualificaria o modelo pelo motivo errado.
  <!-- framework:evidence {"task":"T015","refs":["US-001","FR-001","NFR-001","NFR-002","AC-001","AC-002","AC-003"],"files":["src/models/context-window.ts"],"commands":[{"run":"npx vitest run tests/context-window.test.ts","exit":0}]} -->

- [x] T016 [CODE] [US-001] Declarar maestro.task_types em src/config/schema.ts e a resolução em src/models/task-type.ts — Refs: US-001, FR-002, NFR-001, NFR-002, AC-004, AC-005, AC-006 — Depends: T004, T005, T006
  - [x] **PREP**: Confirmar RED de T004/T005/T006 e o padrão da seção `maestro:` já entregue.
  - [x] **EXECUTE**: Seção `task_types` no default semeado e em `SCHEMA_KEYS`, com `context_window_min` por tipo; `resolveTaskType` devolvendo o requisito ou recusa nomeando os disponíveis. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/task-types-config.test.ts` — AC-004, AC-005 e AC-006 **GREEN**.
  - [x] **VISUAL**: Não aplicável — schema e resolução, sem tela.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados nas seções 11–13.
  - [x] **IMPROVE**: Melhoria aplicada: os três tipos de fábrica trazem no próprio comentário do schema por que aqueles valores (8k para ajuste pontual, 32k para trabalho em arquivos, 128k para leitura ampla), para quem editar não tratar os números como mágicos.
  <!-- framework:evidence {"task":"T016","refs":["US-001","FR-002","NFR-001","NFR-002","AC-004","AC-005","AC-006"],"files":["src/config/schema.ts","src/models/task-type.ts"],"commands":[{"run":"npx vitest run tests/task-types-config.test.ts","exit":0}]} -->

- [x] T017 [CODE] [US-001] Aplicar o filtro de janela e as linhas novas do relatório em src/models/recommend.ts — Refs: US-001, FR-003, FR-004, NFR-001, NFR-002, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014 — Depends: T007, T008, T009, T010, T011, T012, T013, T014
  - [x] **PREP**: Confirmar RED das oito tarefas predecessoras e a regra de override que não revalida.
  - [x] **EXECUTE**: `recommend` recebe requisito opcional e leitor injetável; filtro de janela antes da redução por tamanho; leitor não é chamado sem tipo nem para modelo já descartado por memória; relatório declara tipo, mínimo, ausência de tipo e o motivo quando nada é viável. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/recommend-context-window.test.ts tests/recommend-sem-tipo.test.ts tests/recommend-relato.test.ts` — os 8 casos **GREEN**, incluindo os três guard-rails que precisavam sobreviver ao filtro.
  - [x] **VISUAL**: Não aplicável — função pura, sem tela.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados nas seções 11–13.
  - [x] **IMPROVE**: **Defeito de clareza encontrado só com o binário real**: o relatório dizia `Largest available window: 32768`, mas `cogito:14b` tem 131072 — ele fora cortado antes, pela memória. A frase lia-se como "a maior janela desta máquina", e quem soubesse do modelo maior concluiria que a ferramenta estava errada. Passou a nomear a restrição: `Largest window among the models that fit in free memory`. Um relatório que engana é pior que um que cala.
  <!-- framework:evidence {"task":"T017","refs":["US-001","FR-003","FR-004","NFR-001","NFR-002","AC-007","AC-008","AC-009","AC-010","AC-011","AC-012","AC-013","AC-014"],"files":["src/models/recommend.ts"],"commands":[{"run":"npx vitest run tests/recommend-context-window.test.ts","exit":0}]} -->

- [x] T018 [CODE] [US-001] Aceitar --task-type em recommend e plan, resolvendo contra a configuração, em src/cli.ts — Refs: US-001, FR-002, FR-004, NFR-002, AC-006, AC-010, AC-013 — Depends: T006, T010, T013
  - [x] **PREP**: Confirmar RED de T006/T010/T013 e o padrão de `PLAN_FLAGS`/`parseRecommendOverride`.
  - [x] **EXECUTE**: Flag `--task-type` nos dois comandos, resolvida por `resolveTaskType` antes de chamar `recommend`; tipo desconhecido recusado nomeando os disponíveis; ausência mantém o comportamento atual. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: Suíte de CLI verde. Verificado com o binário real nesta máquina, que tem três modelos de janelas diferentes (32768, 40960, 131072): sem tipo recomenda `qwen2.5:3b` e declara a ausência de tipo; com `ajuste_pontual` (8192) recomenda o mesmo modelo citando a exigência; com `leitura_ampla` (131072) recomenda nada e explica o motivo; tipo inexistente é recusado com saída 2 nomeando os disponíveis.
  - [x] **VISUAL**: Não aplicável — comando de terminal, sem tela.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados nas seções 11–13.
  - [x] **IMPROVE**: Melhoria aplicada: o leitor de janela só é construído quando há tipo informado, então a ausência de exigência não paga nem a criação do leitor, muito menos um subprocesso.
  <!-- framework:evidence {"task":"T018","refs":["US-001","FR-002","FR-004","NFR-002","AC-006","AC-010","AC-013"],"files":["src/cli.ts"],"commands":[{"run":"npx vitest run tests/plan-command.test.ts","exit":0}]} -->

**Checkpoint**: um tipo que exige janela grande deixa de recomendar o modelo de janela pequena, mesmo sendo o maior que cabe na memória.

#### Fase final — Documentação e qualidade

- [x] T019 [DOC] [US-001] Registrar a seção de tipos e a leitura de janela em .project-context/STACK.md e revisar PROJECT.md — Refs: US-001, FR-001, FR-002, AC-001, AC-004 — Depends: T015, T016, T017, T018
  - [x] **PREP**: Confirmar T015–T018 GREEN e o conteúdo atual dos dois documentos.
  - [x] **EXECUTE**: Seção nova em `.project-context/STACK.md` (schema de tipos, leitura via `ollama show`, filtro duro) e revisão de `PROJECT.md` sobre a capacidade nova de seleção de modelo.
  - [x] **VERIFY**: `build_documentation.mjs --project . --check` limpo; `docs/` reconstruído. `.project-context/STACK.md` ganhou a seção da recomendação por janela e `PROJECT.md` registrou a capacidade nova.
  - [x] **VISUAL**: Não aplicável — documentação em Markdown, sem tela.
  - [x] **EVIDENCE**: Registrar comandos e resultado nas seções 11–13.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T020 [TEST] Regressão completa e verificação com o binário real sobre tests/recommend-*.test.ts e a suíte inteira — Refs: US-001, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014 — Depends: T015, T016, T017, T018, T019
  - [x] **PREP**: Identificar suites, checks e gates aplicáveis.
  - [x] **EXECUTE**: `npx vitest run`, `npx tsc --noEmit`, `check_traceability.mjs`, `verify_acceptance.mjs`, e o comando real com e sem `--task-type`.
  - [x] **VERIFY**: **476/476 testes** em 176 arquivos, `tsc` limpo. A recomendação real muda com o tipo nesta máquina, comprovado acima em T018.
  - [x] **VISUAL**: Não aplicável — repasse final sem superfície visual própria.
  - [x] **EVIDENCE**: Registrar contagens e comandos finais nas seções 11–13.
  - [x] **IMPROVE**: Retrospectiva: os três guard-rails registrados no Plan Gate provaram seu valor — `AC-008` (o maior vence entre os viáveis) e `AC-014` (override escapa do filtro) continuaram passando depois do filtro entrar, que é exatamente o que eles existiam para garantir. O único defeito da fatia não apareceu em teste nenhum: era uma frase do relatório que enganava, e só a execução com modelos reais de janelas diferentes revelou. Segunda vez seguida (a primeira foi a SPEC-0015) em que o achado real vem do binário, não da suíte.

### 15. Ordem de execução

- Caminho crítico: T001–T014 (paralelas) → T015/T016 (paralelas) → T017 → T018 → T019 → T020.
- Tarefas paralelas: T001–T014 são independentes entre si. T015 (leitura de janela) e T016 (tipos) tocam arquivos disjuntos; T017 depende das duas porque combina o requisito com a janela lida, e T018 depende de T017 estar de pé para a flag ter efeito observável.
- Restrição de sequenciamento: a verificação com o binário real (T018 e T020) exige `npm run build`, que exige bump de versão quando `src/` mudou — a regra de checksum entra no caminho crítico do fechamento, como nas fatias anteriores.
- Estratégia de MVP: não aplicável — é uma história só; entregar a leitura de janela sem o filtro, ou o filtro sem os tipos, não muda nenhuma recomendação observável.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- `SPEC-0009` (seleção de modelo) — estendida, não substituída.
- `SPEC-0015` (perfis de agente) — fornece o padrão da seção `maestro:` e da semeadura.
- `SPEC-0016` (plano) — consumidora: passa a poder informar o tipo.
- `ollama` instalado é condição para haver janela a ler; sem ele, o comportamento atual de "nenhum modelo local" já cobre o caso.

#### Riscos

- `ollama show` pode mudar o rótulo `context length` numa versão futura, quebrando a extração → mitigado por tratar ausência como ausência declarada (`AC-002`), degradando para "sem janela conhecida" em vez de quebrar a recomendação inteira.
- Um subprocesso por modelo candidato pode ficar lento numa máquina com muitos modelos que cabem na memória → mitigado pelo filtro de memória vir primeiro (`AC-012`); se ainda assim doer, o cache descartado na rodada 4 volta a ser uma opção, sem mudar o contrato.
- Tipos configuráveis criam vocabulário que ninguém mantém → aceito: o mesmo já vale para os perfis da `SPEC-0015`, e um tipo desconhecido é recusado nomeando os disponíveis, o que torna a divergência visível em vez de silenciosa.

#### Suposições

- Os tipos de fábrica são um ponto de partida, não uma taxonomia definitiva; a pessoa acrescenta os seus, e nada no código depende dos nomes semeados.
- `context length` em `ollama show` está em tokens, e a janela mínima do tipo é declarada na mesma unidade — a comparação é direta, sem conversão.

### 17. Decisões

- **DEC-001**: O tipo de tarefa é entrada explícita, nunca inferido do texto — razão: inferir exigiria entender a tarefa, que é exatamente o que a `SPEC-0016` decidiu não fingir; quem leu a tarefa (agente ou pessoa) sabe o tipo e informa. Alternativa descartada: classificação por palavra-chave — rodada 1.
- **DEC-002**: Tipos e requisitos vivem em `.maestro/config.yaml`, semeados como arquivo real — razão: consistente com `PR-002` e com o que a `SPEC-0015` já faz; permite acrescentar tipo sem tocar em código. Alternativa descartada: taxonomia fechada no código — rodada 2.
- **DEC-003**: A janela é filtro duro aplicado antes da comparação por tamanho — razão: um modelo que não comporta o contexto não é uma escolha pior, é inviável; tratá-lo como desempate deixaria a recomendação apontar algo que falharia na execução. Alternativa descartada: usar a janela só para desempatar — rodada 3.
- **DEC-004**: A janela é consultada sob demanda, só para quem passou no filtro de memória, sem cache — razão: o custo fica proporcional aos modelos que realmente disputam, e um cache seria mais um estado em disco a manter correto por um ganho ainda não medido. Alternativa descartada: cache em `.maestro/` — rodada 4.
- **DEC-005**: Nenhum modelo viável devolve ausência declarada com o motivo — razão: mesma postura que a `SPEC-0009` já tem para memória; recomendar algo insuficiente empurraria a falha para a execução. Alternativa descartada: recomendar o de maior janela com aviso — rodada 5.
- **DEC-006**: Sem tipo informado, nenhuma exigência é aplicada — razão: ausência de informação não pode virar requisito inventado, e quem já usa `recommend` hoje não deve ver o comportamento mudar. Alternativas descartadas: tipo padrão implícito e recusa sem tipo — rodada 6.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Os cenários `AC-001` a `AC-014` passam.
- [x] `FR-001` a `FR-004` e `NFR-001`/`NFR-002` têm evidência de verificação nas seções 11–12.
- [x] Todas as tarefas da seção 14 estão concluídas — 20/20, 120/120 itens.
- [x] `.project-context/STACK.md` registra a seção nova do schema e a leitura de janela.
- [x] `PROJECT.md` revisado quanto à capacidade nova.
