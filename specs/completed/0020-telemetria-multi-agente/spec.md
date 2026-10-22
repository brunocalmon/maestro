# Especificação integrada: Telemetria multi-agente

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0020 |
| Slug | 0020-telemetria-multi-agente |
| Status | Complete |
| Effort | 4 |
| Effort rationale | Reaproveita padrões já entregues (persistência por trace de `SPEC-0016`, injeção de decisão/fonte de `SPEC-0007`/`SPEC-0019`) — não descobre superfície externa nova como a `SPEC-0019` descobriu cinco backends. O trabalho real é desenhar um formato de registro correto (o que guardar, o que nunca guardar) e ligá-lo ao ponto certo de `run.ts` sem reabrir os gates da `SPEC-0019`. |
| Effort updated at | 2026-09-07 |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — comando de terminal cuja saída é texto relatado ao agente ou pessoa que pediu o relatório, sem tela. |
| Atualizada em | 2026-09-07 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A `SPEC-0019` faz `runtime: cli` executar de verdade, mas nada do que
aconteceu fica registrado depois que o texto do relato é lido: qual backend
rodou, se foi recusado e por quê, qual código de saída teve, quanto tempo
levou. Uma orquestração com vários agentes não tem como ser reconstruída
depois — nem para auditoria, nem para comparar execuções, nem para saber se
um agente específico do plano chegou a rodar.

#### Resultado desejado

Cada tentativa de spawn de um agente `runtime: cli` — recusada ou executada
— grava um registro correlacionado ao `trace` do plano que a aprovou.
`maestro report <trace>` lê e apresenta esses registros de forma legível.
Nenhum conteúdo de stdout/stderr é persistido — só metadados estruturais.

#### Métricas de sucesso

- Um plano aprovado com um agente `runtime: cli` que roda produz um registro
  com backend, modelo, código de saída e duração, recuperável por
  `maestro report <trace>`.
- Um agente `runtime: cli` recusado (tools, backend ausente ou decisão
  negativa) também produz um registro, nomeando o motivo — telemetria cobre
  recusa tanto quanto sucesso.
- Um agente `runtime: native`/`auto` nunca produz registro de telemetria.
- Nenhum registro, em nenhuma circunstância, contém o texto de stdout ou
  stderr do subprocesso.

### 2. Research e esclarecimentos

#### Researchs executados

- Nenhuma pesquisa externa crítica: esta fatia reaproveita padrões já
  verificados no próprio repositório — persistência por identificador em
  `src/plan/store.ts` (`SPEC-0016`), injeção de fonte de decisão em
  `src/approval/decide.ts` (`SPEC-0007`), e o próprio mecanismo de spawn já
  entregue e verificado com binário real pela `SPEC-0019`. Não há
  comportamento de terceiro a confirmar.

#### Fontes e contexto consultados

- `src/telemetry/trace.ts` — `TraceSource`, `generateId()`, `realSource()`;
  o `trace` já é o identificador que conecta plano e execução.
- `src/plan/store.ts` — `PLANS_DIR`, `writeApprovedPlan`,
  `readApprovedPlan`; mesmo padrão de arquivo-por-identificador que esta
  fatia replica para telemetria.
- `src/delegation/run.ts`, `src/delegation/cli-spawn.ts`,
  `src/delegation/cli-gate.ts`, `src/delegation/cli-select.ts`,
  `src/delegation/cli-tools.ts` — os quatro pontos onde um agente `cli`
  pode ser recusado ou rodar de verdade (`SPEC-0019`).
- `src/cli.ts` — `formatRun`, `formatPlan`; o padrão de comando de terminal
  que `maestro report` replica.

#### Documentação consultada

- Nenhuma documentação externa.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo. Toda fonte consultada é código já existente
  neste repositório, citado acima.

#### Dúvidas respondidas

- **Q**: Registrar só metadados estruturados ou também stdout/stderr? → **A**: só metadados estruturados — nunca o conteúdo do subprocesso, que pode ser grande ou sensível.
- **Q**: Onde gravar? → **A**: um arquivo por trace, `.maestro/telemetry/<trace>.json`, mesmo padrão de `.maestro/plans/<trace>.json`.
- **Q**: `native`/`auto` também grava telemetria? → **A**: não — só `runtime: cli`, porque só ele tem prova real de execução; `native`/`auto` apenas emitem briefing (`SPEC-0018`), gravar telemetria ali fingiria uma evidência que não existe.
- **Q**: Precisa de comando de leitura novo? → **A**: sim — `maestro report <trace>`, mesmo padrão de `maestro plan`/`maestro run`.

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Registro de telemetria por tentativa de spawn de agente `runtime: cli` —
  recusado (tools, backend, gate) ou executado (com código de saída e
  duração).
- Persistência em `.maestro/telemetry/<trace>.json`, um arquivo por trace,
  acumulando um registro por agente do plano.
- `maestro report <trace>`: lê e apresenta os registros de um trace,
  recusando de forma nomeada quando não há nada registrado.
- Extensão aditiva de `CliRuntimeContext` (`SPEC-0019`) com hooks de
  telemetria opcionais — sem reabrir os gates daquela spec.

#### Fora de escopo

- Telemetria de agentes `native`/`auto` (decisão rodada 3).
- Qualquer conteúdo de stdout/stderr do subprocesso (decisão rodada 1).
- Agregação entre traces diferentes, dashboards, métricas de custo ou
  correlação com uso de plano de terceiros — esta fatia entrega o registro e
  a leitura de um trace por vez, nada além.
- Retenção, expiração ou limpeza automática de registros antigos.

#### Atores

- **Agente hospedeiro ou pessoa no terminal**: pede a execução via
  `maestro run` e, depois, pode consultar o que aconteceu via
  `maestro report <trace>`.
- **Pipeline de execução de `runtime: cli`** (`SPEC-0019`): produz o
  resultado — recusa ou spawn — que esta fatia grava sem reinterpretar.

### 4. Princípios e restrições do projeto

- **PR-001**: O código não interpreta semanticamente o que não pode julgar — telemetria grava o resultado, nunca julga se foi "bom" ou "ruim" (`SPEC-0016`, `PR-002`; `SPEC-0019`, `PR-004`).
- **PR-002**: Nada é inventado quando ausente — sem backend selecionado, o campo é `null`, nunca um valor adivinhado (`SPEC-0019`, `NFR-001`).
- **PR-003**: Nenhum dado potencialmente sensível do projeto ou do subprocesso é persistido além do estritamente estrutural (novo nesta fatia, decisão rodada 1).

### 5. Histórias de usuário

#### US-001 — Registrar o resultado de cada tentativa de spawn (P1)

Como agente hospedeiro que aprovou um plano com agentes `runtime: cli`,
quero que cada tentativa de spawn — recusada ou executada — fique
registrada, para poder reconstruir depois o que aconteceu numa orquestração,
sem depender de ter lido o texto do relato na hora.

**Por que P1**: sem isso, telemetria não existe — é a única história desta fatia.
**Teste independente**: aprovar um plano com dois agentes `runtime: cli`, um recusado e um executado, e confirmar que `.maestro/telemetry/<trace>.json` tem os dois registros.
**Requisitos**: FR-001, FR-002, FR-003

#### US-002 — Consultar a telemetria de um trace (P1)

Como agente hospedeiro ou pessoa no terminal, quero rodar
`maestro report <trace>` e ver os registros daquele trace de forma legível,
para não precisar abrir o JSON manualmente.

**Por que P1**: telemetria gravada sem uma forma de ler é só um arquivo — a leitura fecha o ciclo de valor.
**Teste independente**: rodar `maestro report <trace>` sobre um trace com registros e confirmar que a saída nomeia agente, backend, modelo e resultado de cada um.
**Requisitos**: FR-004

### 6. Cenários BDD de aceite

#### AC-001 — spawn executado grava um registro completo

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-001
Feature: registro de telemetria

  Scenario: agente cli autorizado e executado
    Given um plano aprovado com um agente runtime cli
    And a decisão do gate é positiva
    When o spawn roda e termina
    Then um registro é gravado com backend, modelo, código de saída e duração
```

#### AC-002 — tools required não suportável grava recusa

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-002
Feature: registro de telemetria

  Scenario: recusa por tools não suportável
    Given um perfil com capability.tools required
    And um backend sem allowlist de tools
    When o spawn é preparado
    Then um registro é gravado com resultado recusado e o motivo de tools
```

#### AC-003 — backend ausente grava recusa

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-003
Feature: registro de telemetria

  Scenario: recusa por backend ausente
    Given um agente com execution.cli_backend required apontando para um backend ausente
    When o spawn é preparado
    Then um registro é gravado com resultado recusado e o motivo de backend
```

#### AC-004 — decisão negativa do gate grava recusa

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-004
Feature: registro de telemetria

  Scenario: recusa pela decisão do spawn
    Given um agente runtime cli aguardando decisão
    When a decisão é negativa
    Then um registro é gravado com resultado recusado e o motivo do gate
```

#### AC-005 — native e auto nunca geram registro

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-005
Feature: registro de telemetria

  Scenario: agente sem runtime cli
    Given um plano aprovado com um agente runtime native ou auto
    When runDelegation processa o plano
    Then nenhum registro de telemetria é gravado para esse agente
```

#### AC-006 — dois agentes do mesmo plano acumulam sem se sobrescrever

**Cobre**: US-001, FR-003, NFR-001

```gherkin
@US-001 @FR-003 @NFR-001 @AC-006
Feature: persistência por trace

  Scenario: plano com dois agentes cli
    Given um plano aprovado com dois agentes runtime cli
    When os dois são processados, um recusado e um executado
    Then o arquivo de telemetria daquele trace contém os dois registros
```

#### AC-007 — nenhum registro contém stdout/stderr

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-007
Feature: privacidade do registro

  Scenario: spawn produz saída extensa
    Given um spawn autorizado que produz stdout e stderr
    When o registro de telemetria é gravado
    Then nenhum dos dois textos aparece em nenhum campo do registro
```

#### AC-008 — `maestro report` apresenta os registros de um trace

**Cobre**: US-002, FR-004, NFR-001

```gherkin
@US-002 @FR-004 @NFR-001 @AC-008
Feature: leitura da telemetria

  Scenario: trace com registros
    Given um trace com registros de telemetria gravados
    When "maestro report <trace>" roda
    Then a saída nomeia agente, backend, modelo e resultado de cada registro
```

#### AC-009 — trace sem telemetria é recusado nomeando a ausência

**Cobre**: US-002, FR-004, NFR-002

```gherkin
@US-002 @FR-004 @NFR-002 @AC-009
Feature: leitura da telemetria

  Scenario: trace sem nenhum registro
    Given um trace sem arquivo de telemetria
    When "maestro report <trace>" roda
    Then a saída recusa nomeando a ausência de telemetria para aquele trace
```

#### AC-010 — plano misto grava telemetria só para o agente cli

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-010
Feature: registro de telemetria

  Scenario: plano com um agente native e um agente cli
    Given um plano aprovado com um agente runtime native e um agente runtime cli
    When runDelegation processa os dois
    Then só o agente cli produz registro de telemetria
```

#### AC-011 — plano só com native/auto não cria arquivo de telemetria

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-011
Feature: registro de telemetria

  Scenario: plano sem nenhum agente cli
    Given um plano aprovado só com agentes runtime native ou auto
    When runDelegation processa o plano inteiro
    Then nenhum arquivo de telemetria é criado para aquele trace
```

#### AC-012 — duas chamadas para o mesmo trace acumulam, não sobrescrevem

**Cobre**: US-001, FR-003, NFR-001

```gherkin
@US-001 @FR-003 @NFR-001 @AC-012
Feature: persistência por trace

  Scenario: dois registros gravados em momentos diferentes
    Given um trace com um registro já gravado
    When um segundo registro é gravado para o mesmo trace
    Then o arquivo contém os dois registros, na ordem em que foram gravados
```

#### AC-013 — diretório de telemetria é criado quando ausente

**Cobre**: US-001, FR-003, NFR-001

```gherkin
@US-001 @FR-003 @NFR-001 @AC-013
Feature: persistência por trace

  Scenario: primeiro registro de um projeto
    Given um projeto sem .maestro/telemetry/
    When o primeiro registro de telemetria é gravado
    Then o diretório é criado e o arquivo do trace existe com esse registro
```

#### AC-014 — relatório com só recusas ainda é legível

**Cobre**: US-002, FR-004, NFR-001

```gherkin
@US-002 @FR-004 @NFR-001 @AC-014
Feature: leitura da telemetria

  Scenario: trace onde cada agente foi recusado
    Given um trace com registros só de recusa, nenhum executado
    When "maestro report <trace>" roda
    Then a saída nomeia cada recusa e seu motivo, sem exigir nenhum registro "ran"
```

### 7. Requisitos

#### Funcionais

- **FR-001**: Toda tentativa de spawn de um agente `runtime: cli` — recusada por tools, por backend ausente, pela decisão do gate, ou executada — deve gravar um registro contendo agente, backend (quando resolvido), modelo, resultado (recusado ou rodou), motivo quando recusado ou código de saída quando rodou, instante e duração; nunca o conteúdo de stdout/stderr.
- **FR-002**: Agentes `runtime: native` ou `auto` não devem gravar nenhum registro de telemetria.
- **FR-003**: Registros do mesmo `trace` devem acumular por agente em `.maestro/telemetry/<trace>.json`, sem um sobrescrever o outro.
- **FR-004**: `maestro report <trace>` deve ler e apresentar os registros de telemetria daquele trace de forma legível; um trace sem registro deve ser recusado nomeando a ausência.

#### Não funcionais

- **NFR-001**: O comportamento é determinístico — o mesmo resultado de spawn produz o mesmo registro, sem inventar campo ausente. **Verificação**: casos comparando o registro produzido para cada resultado possível do pipeline de `SPEC-0019`.
- **NFR-002**: Nenhum dado potencialmente sensível é persistido além do estritamente estrutural — nunca stdout/stderr, nunca o texto de um comportamento composto. **Verificação**: caso dedicado inspecionando as chaves do registro gravado; recusa de `maestro report` para trace inexistente nomeada, não silenciosa.

#### Erros e casos-limite

- `.maestro/telemetry/` ainda não existe quando o primeiro registro é gravado → o diretório é criado, mesmo padrão de `.maestro/plans/`.
- Dois agentes `cli` do mesmo plano escolhem o mesmo backend → cada um grava seu próprio registro independente, sem mesclar.
- `maestro report` aponta para um trace que tem plano aprovado mas nenhum agente `cli` chegou a ser processado (ex: todos `native`) → mesma recusa nomeada de "sem telemetria", sem distinguir a causa — não é este comando que decide se isso é esperado.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

`runDelegation` (`src/delegation/run.ts`, `SPEC-0019`) já processa cada
agente `cli` por quatro pontos de possível recusa (`selectBackend`,
`checkToolsSupport`, `decideSpawn`) ou execução (`spawnCliAgent`), retornando
texto agregado. `CliRuntimeContext` já é o objeto injetado com o ambiente
real (`detected`, `ask`, `spawn`) — o padrão a seguir para os hooks novos.
`src/plan/store.ts` já grava um artefato por `trace` em `.maestro/`.

#### Arquitetura e módulos

- `src/telemetry/record.ts` (novo): `AgentTelemetryEntry` — union discriminada `{ outcome: "refused"; stage: "tools" | "backend" | "gate"; reason } | { outcome: "ran"; exitCode }`, com os campos comuns `agent`, `backend`, `model`, `startedAt`, `durationMs`.
- `src/telemetry/store.ts` (novo): `TELEMETRY_DIR = ".maestro/telemetry"`, `TelemetryRecord { trace; agents: AgentTelemetryEntry[] }`, `readTelemetryRecord(root, trace)`, `appendTelemetryEntry(root, trace, entry)` — lê o arquivo existente (ou parte de lista vazia), acrescenta, grava; mesmo padrão de `writeApprovedPlan`/`readApprovedPlan`.
- `src/telemetry/render.ts` (novo): `renderTelemetry(record)` — texto por agente, mesmo padrão de `renderPlan`/`renderBriefs`.
- `src/delegation/run.ts` (`SPEC-0019`, estendido aditivamente): `CliRuntimeContext` ganha `telemetry?: { now(): string; record(entry): void }`; `runCliAgent` mede o tempo em cada um dos quatro desfechos (tools, backend, gate, spawn) e chama `cliRuntime.telemetry?.record(...)` antes de retornar o texto daquele agente — nunca altera o texto retornado, só acrescenta o efeito colateral opcional.
- `src/cli.ts` (estendido): `formatRun` passa `telemetry: { now: () => new Date().toISOString(), record: (entry) => appendTelemetryEntry(root, traceId, entry) }` dentro de `cliRuntime`; novo `formatReport(args)` e `USAGE_REPORT`, registrado em `COMMANDS`.

#### Migrations

- Não aplicável.

#### Models

- `AgentTelemetryEntry`: união discriminada descrita acima.
- `TelemetryRecord`: `{ trace: string; agents: AgentTelemetryEntry[] }`.

#### Controllers e casos de uso

- Não aplicável.

#### Views e experiência

- Não aplicável.

#### Queries e repositórios

- Não aplicável.

#### Jobs e processamento assíncrono

- Não aplicável — gravação síncrona, mesmo padrão de `writeApprovedPlan`.

#### Estrutura de arquivos

```text
specs/draft/0020-telemetria-multi-agente/
  spec.md
src/
  telemetry/record.ts
  telemetry/store.ts
  telemetry/render.ts
  delegation/run.ts
  cli.ts
tests/
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| `AgentTelemetryEntry` | posição na lista do trace | `outcome: "refused"` sempre carrega `stage`/`reason`; `outcome: "ran"` sempre carrega `exitCode`; nenhuma variante carrega stdout/stderr | pertence a um `TelemetryRecord` |
| `TelemetryRecord` | `trace` | lista de `AgentTelemetryEntry`, uma por tentativa de spawn `cli` | um arquivo por trace |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Agente `cli` em processamento | sem registro | recusa (tools/backend/gate) ou spawn concluído | registro gravado | arquivo do trace contém o novo registro sem perder os anteriores |

#### Migração e retenção

- Não aplicável — sem retenção ou expiração nesta fatia (fora de escopo, seção 3).

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não — `maestro report` é um comando de terminal cuja saída é texto, mesmo padrão de `maestro plan`/`maestro run`.

#### APIs expostas

- `maestro report <trace>`: lê `.maestro/telemetry/<trace>.json`; devolve texto formatado ou recusa nomeada; código de saída `0` com registros, diferente de zero sem eles.

#### APIs externas utilizadas

- Nenhuma.

#### Documentação das APIs consultadas

- Não aplicável.

#### Eventos e outros contratos

- Não aplicável.

### 11. Estratégia TDD

- **Unidade**: `appendTelemetryEntry`/`readTelemetryRecord` (persistência); `renderTelemetry` (formatação); `runCliAgent` gravando o hook de telemetria correto para cada um dos quatro desfechos.
- **Integração**: `runDelegation` com `CliRuntimeContext.telemetry` injetado, sobre os quatro caminhos já cobertos pela `SPEC-0019` (tools, backend, gate, spawn).
- **BDD/aceite**: os nove cenários da seção 6 orientam os nove casos TDD (um por AC).
- **Runner TDD**: Vitest, já materializado em `test:tdd`.
- **E2E**: não aplicável.
- **Verificação manual**: uma, necessária: `maestro plan` → `maestro run` com um agente `cli` real (reaproveitando o mesmo backend já disponível desta máquina) seguido de `maestro report <trace>`, confirmando que o registro gravado bate com o que realmente aconteceu — os testes automatizados provam a lógica, não que a integração ponta a ponta com o pipeline real de `SPEC-0019` está correta.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, AC-001 | AC-001 na seção 6 | tests/telemetry-record.test.ts | RED confirmado 2026-09-07 | GREEN confirmado 2026-09-07 | Regressão completa 524/524 e verificação real com goose |
| US-001, FR-001, NFR-002, AC-002 | AC-002 na seção 6 | tests/telemetry-record.test.ts | RED confirmado 2026-09-07 | GREEN confirmado 2026-09-07 | Regressão completa 524/524 e verificação real com goose |
| US-001, FR-001, NFR-002, AC-003 | AC-003 na seção 6 | tests/telemetry-record.test.ts | RED confirmado 2026-09-07 | GREEN confirmado 2026-09-07 | Regressão completa 524/524 e verificação real com goose |
| US-001, FR-001, NFR-002, AC-004 | AC-004 na seção 6 | tests/telemetry-record.test.ts | RED confirmado 2026-09-07 | GREEN confirmado 2026-09-07 | Regressão completa 524/524 e verificação real com goose |
| US-001, FR-002, NFR-001, AC-005 | AC-005 na seção 6 | tests/telemetry-record.test.ts | RED confirmado 2026-09-07 | GREEN confirmado 2026-09-07 | Regressão completa 524/524 e verificação real com goose |
| US-001, FR-003, NFR-001, AC-006 | AC-006 na seção 6 | tests/telemetry-store.test.ts | RED confirmado 2026-09-07 | GREEN confirmado 2026-09-07 | Regressão completa 524/524 e verificação real com goose |
| US-001, FR-001, NFR-002, AC-007 | AC-007 na seção 6 | tests/telemetry-record.test.ts | RED confirmado 2026-09-07 | GREEN confirmado 2026-09-07 | Regressão completa 524/524 e verificação real com goose |
| US-002, FR-004, NFR-001, AC-008 | AC-008 na seção 6 | tests/telemetry-report.test.ts | RED confirmado 2026-09-07 | GREEN confirmado 2026-09-07 | Regressão completa 524/524 e verificação real com goose |
| US-002, FR-004, NFR-002, AC-009 | AC-009 na seção 6 | tests/telemetry-report.test.ts | RED confirmado 2026-09-07 | GREEN confirmado 2026-09-07 | Regressão completa 524/524 e verificação real com goose |
| US-001, FR-002, NFR-001, AC-010 | AC-010 na seção 6 | tests/telemetry-record.test.ts | RED confirmado 2026-09-07 | GREEN confirmado 2026-09-07 | Regressão completa 524/524 e verificação real com goose |
| US-001, FR-002, NFR-001, AC-011 | AC-011 na seção 6 | tests/telemetry-record.test.ts | RED confirmado 2026-09-07 | GREEN confirmado 2026-09-07 | Regressão completa 524/524 e verificação real com goose |
| US-001, FR-003, NFR-001, AC-012 | AC-012 na seção 6 | tests/telemetry-store.test.ts | RED confirmado 2026-09-07 | GREEN confirmado 2026-09-07 | Regressão completa 524/524 e verificação real com goose |
| US-001, FR-003, NFR-001, AC-013 | AC-013 na seção 6 | tests/telemetry-store.test.ts | RED confirmado 2026-09-07 | GREEN confirmado 2026-09-07 | Regressão completa 524/524 e verificação real com goose |
| US-002, FR-004, NFR-001, AC-014 | AC-014 na seção 6 | tests/telemetry-report.test.ts | RED confirmado 2026-09-07 | GREEN confirmado 2026-09-07 | Regressão completa 524/524 e verificação real com goose |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Integração (CliRuntimeContext injetado) | `tests/telemetry-record.test.ts` | Passed — GREEN confirmado |
| FR-001 | AC-002 | Integração | `tests/telemetry-record.test.ts` | Passed — GREEN confirmado |
| FR-001 | AC-003 | Integração | `tests/telemetry-record.test.ts` | Passed — GREEN confirmado |
| FR-001 | AC-004 | Integração | `tests/telemetry-record.test.ts` | Passed — GREEN confirmado |
| FR-001 | AC-007 | Integração | `tests/telemetry-record.test.ts` | Passed — GREEN confirmado |
| FR-002 | AC-005 | Integração | `tests/telemetry-record.test.ts` | Passed — GREEN confirmado |
| FR-003 | AC-006 | Unidade (fs isolado) | `tests/telemetry-store.test.ts` | Passed — GREEN confirmado |
| FR-004 | AC-008 | Unidade | `tests/telemetry-report.test.ts` | Passed — GREEN confirmado |
| FR-004 | AC-009 | Unidade | `tests/telemetry-report.test.ts` | Passed — GREEN confirmado |
| FR-002 | AC-010 | Integração | `tests/telemetry-record.test.ts` | Passed — GREEN confirmado |
| FR-002 | AC-011 | Integração | `tests/telemetry-record.test.ts` | Passed — GREEN confirmado |
| FR-003 | AC-012 | Unidade (fs isolado) | `tests/telemetry-store.test.ts` | Passed — GREEN confirmado |
| FR-003 | AC-013 | Unidade (fs isolado) | `tests/telemetry-store.test.ts` | Passed — GREEN confirmado |
| FR-004 | AC-014 | Unidade | `tests/telemetry-report.test.ts` | Passed — GREEN confirmado |
| NFR-001 | AC-001, AC-005, AC-006, AC-008, AC-010, AC-011, AC-012, AC-013, AC-014 | Unidade + integração | ver linhas acima | Passed — GREEN confirmado |
| NFR-002 | AC-002, AC-003, AC-004, AC-007, AC-009 | Unidade + integração | ver linhas acima | Passed — GREEN confirmado |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-09-07)
- **Comando**: `node .agents/skills/framework-04-validate/scripts/validate_spec.mjs specs/draft/0020-telemetria-multi-agente/spec.md --allow-draft` → `VALID DRAFT`.
- **Achados**: Nenhum `BLOCKER`. As quatro decisões da rodada de descoberta viraram `FR`/`DEC` rastreáveis. Cobertura: US-001 → 10 AC; US-002 → 3 AC; FR-001 → 5; FR-002 → 3; FR-003 → 3; FR-004 → 3; NFR-001 → 9; NFR-002 → 5. Sem claim externo crítico — a fatia reaproveita mecanismo já verificado com binário real pela `SPEC-0019`. `Interface para pessoas: Não` justificada. Finding de privacidade material e endereçado: `PR-003`/`NFR-002`/`AC-007` existem precisamente para impedir que telemetria vire um segundo canal de vazamento do que o subprocesso produziu.

#### Gate do Ato II — Plano

- **Resultado**: Passed (2026-09-07)
- **Comando**: `node .agents/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/defined/0020-telemetria-multi-agente/spec.md` → `RESULTADO: READY`.
- **Achados**: 14 casos TDD (um por AC) escritos em três arquivos Vitest. RED confirmado para todos, incluindo AC-005/AC-007/AC-011, cuja primeira versão passava vacuamente por ausência total do mecanismo (não por comportamento correto) — refinados para provar, no mesmo teste, que o coletor de fato grava para `cli` antes de afirmar que não grava para `native`/`auto`. Quatro tarefas `[CODE]` (T015–T018) cobrem os módulos novos e a extensão aditiva de `run.ts`/`cli.ts`, cada uma com ao menos três predecessores TDD rastreáveis. Nenhum `BLOCKER` de plano.

#### Gate do Ato III — Entrega

- **Resultado**: Passed (2026-09-07)
- **Comandos**: `check_traceability.mjs` → 22/22 IDs desta spec cobertos; `verify_acceptance.mjs` → `QA: PASSED`; `validate_tasks.mjs` → `RESULTADO: READY` (20/20 tarefas, contrato de evidência verificado); `npx vitest run` → 189 arquivos, 524/524; `npx tsc --noEmit` limpo.
- **Achados**: Todas as 14 ACs passaram de RED para GREEN. Verificação manual real: `maestro plan` → `maestro run` → `maestro report <trace>` com um agente `runtime: cli` real sobre `goose` nesta máquina — o modelo respondeu "OK" à tarefa pedida, e `.maestro/telemetry/<trace>.json` gravou exatamente `agent`, `backend: "goose"`, `model: "qwen2.5:3b"`, `startedAt`, `durationMs: 16683`, `outcome: "ran"`, `exitCode: 0` — nenhum stdout/stderr, confirmando `NFR-002` fora do teste unitário. `maestro report` sobre um trace inexistente recusou nomeando a ausência, código de saída `2`. `docs/` e `.project-context/STACK.md` atualizados; `PROJECT.md` revisado. Nenhum `BLOCKER`.

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

- [x] T001 [P] [TEST] [TDD] [US-001] Derivar de AC-001 um caso Vitest falhando em tests/telemetry-record.test.ts — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-001; confirmar que `CliRuntimeContext.telemetry` ainda não existe.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-001 AC-001` — um agente cli autorizado e executado grava um registro `outcome: "ran"` com backend, modelo, exitCode e duração.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-record.test.ts` — observar RED.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T002 [P] [TEST] [TDD] [US-001] Derivar de AC-002 um caso Vitest falhando em tests/telemetry-record.test.ts — Refs: US-001, FR-001, NFR-002, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-002.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-002 AC-002` — tools required não suportável grava `outcome: "refused", stage: "tools"`.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-record.test.ts` — observar RED.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T003 [P] [TEST] [TDD] [US-001] Derivar de AC-003 um caso Vitest falhando em tests/telemetry-record.test.ts — Refs: US-001, FR-001, NFR-002, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-003.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-002 AC-003` — backend required ausente grava `outcome: "refused", stage: "backend"`.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-record.test.ts` — observar RED.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T004 [P] [TEST] [TDD] [US-001] Derivar de AC-004 um caso Vitest falhando em tests/telemetry-record.test.ts — Refs: US-001, FR-001, NFR-002, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-004.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-002 AC-004` — decisão negativa do gate grava `outcome: "refused", stage: "gate"`.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-record.test.ts` — observar RED.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T005 [P] [TEST] [TDD] [US-001] Derivar de AC-005 um caso Vitest falhando em tests/telemetry-record.test.ts — Refs: US-001, FR-002, NFR-001, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-005.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-001 AC-005` — agente native/auto nunca chama o hook de telemetria.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-record.test.ts` — observar RED.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T006 [P] [TEST] [TDD] [US-001] Derivar de AC-006 um caso Vitest falhando em tests/telemetry-store.test.ts — Refs: US-001, FR-003, NFR-001, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-006; confirmar que `src/telemetry/store.ts` não existe.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-001 AC-006` — dois agentes cli do mesmo plano produzem dois registros no arquivo do trace, nenhum sobrescrevendo o outro.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-store.test.ts` — observar RED.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T007 [P] [TEST] [TDD] [US-001] Derivar de AC-007 um caso Vitest falhando em tests/telemetry-record.test.ts — Refs: US-001, FR-001, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-007.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-002 AC-007` — inspecionar todas as chaves do registro gravado e confirmar que nenhuma contém o texto de stdout/stderr do spawn.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-record.test.ts` — observar RED.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T008 [P] [TEST] [TDD] [US-002] Derivar de AC-008 um caso Vitest falhando em tests/telemetry-report.test.ts — Refs: US-002, FR-004, NFR-001, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-008; confirmar que `src/telemetry/render.ts` não existe.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-002 FR-004 NFR-001 AC-008` — `renderTelemetry` sobre um registro com entradas nomeia agente, backend, modelo e resultado de cada uma.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-report.test.ts` — observar RED.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T009 [P] [TEST] [TDD] [US-002] Derivar de AC-009 um caso Vitest falhando em tests/telemetry-report.test.ts — Refs: US-002, FR-004, NFR-002, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-009.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-002 FR-004 NFR-002 AC-009` — `formatReport` sobre um trace sem arquivo de telemetria recusa nomeando a ausência, código de saída diferente de zero.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-report.test.ts` — observar RED.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T010 [P] [TEST] [TDD] [US-001] Derivar de AC-010 um caso Vitest falhando em tests/telemetry-record.test.ts — Refs: US-001, FR-002, NFR-001, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-010.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-001 AC-010` — plano com um agente native e um agente cli grava telemetria só para o cli.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-record.test.ts` — observar RED.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T011 [P] [TEST] [TDD] [US-001] Derivar de AC-011 um caso Vitest falhando em tests/telemetry-record.test.ts — Refs: US-001, FR-002, NFR-001, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-011.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-001 AC-011` — plano só com native/auto não cria nenhum arquivo de telemetria.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-record.test.ts` — observar RED.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T012 [P] [TEST] [TDD] [US-001] Derivar de AC-012 um caso Vitest falhando em tests/telemetry-store.test.ts — Refs: US-001, FR-003, NFR-001, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-012.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-001 AC-012` — duas chamadas de `appendTelemetryEntry` para o mesmo trace acumulam na ordem em que foram gravadas.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-store.test.ts` — observar RED.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T013 [P] [TEST] [TDD] [US-001] Derivar de AC-013 um caso Vitest falhando em tests/telemetry-store.test.ts — Refs: US-001, FR-003, NFR-001, AC-013 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-013.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-001 AC-013` — `appendTelemetryEntry` cria `.maestro/telemetry/` quando ausente.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-store.test.ts` — observar RED.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T014 [P] [TEST] [TDD] [US-002] Derivar de AC-014 um caso Vitest falhando em tests/telemetry-report.test.ts — Refs: US-002, FR-004, NFR-001, AC-014 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-014.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-002 FR-004 NFR-001 AC-014` — `renderTelemetry` sobre um registro só com entradas recusadas nomeia cada uma sem exigir nenhuma `"ran"`.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-report.test.ts` — observar RED.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

#### Fase 2 — US-001/US-002: persistência, registro e leitura

**Objetivo**: `runtime: cli` grava e `maestro report` lê a telemetria de um trace.
**Teste independente**: `npx vitest run tests/telemetry-record.test.ts tests/telemetry-store.test.ts tests/telemetry-report.test.ts` — todos verdes.

- [x] T015 [CODE] [US-001] Implementar a persistência por trace em src/telemetry/store.ts — Refs: US-001, FR-003, NFR-001, AC-006, AC-012, AC-013 — Depends: T006, T012, T013
  - [x] **PREP**: Confirmar RED de T006/T012/T013 e o padrão de `src/plan/store.ts`.
  - [x] **EXECUTE**: `TELEMETRY_DIR`, `TelemetryRecord`, `readTelemetryRecord(root, trace)`, `appendTelemetryEntry(root, trace, entry)` — cria o diretório quando ausente, lê o arquivo existente (ou parte de lista vazia), acrescenta e grava. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-store.test.ts` verde; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — persistência sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivo criado nas seções 11–13.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
  <!-- framework:evidence {"task":"T015","refs":["US-001","FR-003","NFR-001","AC-006","AC-012","AC-013"],"files":["src/telemetry/store.ts"],"commands":[{"run":"npx vitest run tests/telemetry-store.test.ts","exit":0}]} -->

- [x] T016 [CODE] [US-002] Implementar a formatação de leitura em src/telemetry/render.ts — Refs: US-002, FR-004, NFR-001, NFR-002, AC-008, AC-009, AC-014 — Depends: T008, T009, T014
  - [x] **PREP**: Confirmar RED de T008/T009/T014 e o padrão de `renderPlan`/`renderBriefs`.
  - [x] **EXECUTE**: `renderTelemetry(record)` — texto por agente, distinguindo `refused`/`ran`; ausência de registro tratada por quem chama (`formatReport`), não aqui. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-report.test.ts` verde.
  - [x] **VISUAL**: Não aplicável — sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivo criado nas seções 11–13.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
  <!-- framework:evidence {"task":"T016","refs":["US-002","FR-004","NFR-001","NFR-002","AC-008","AC-009","AC-014"],"files":["src/telemetry/render.ts"],"commands":[{"run":"npx vitest run tests/telemetry-report.test.ts","exit":0}]} -->

- [x] T017 [CODE] [US-001] Implementar AgentTelemetryEntry em src/telemetry/record.ts e ligar o hook de telemetria em src/delegation/run.ts — Refs: US-001, FR-001, FR-002, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-007, AC-010, AC-011 — Depends: T001, T002, T003, T004, T005, T007, T010, T011
  - [x] **PREP**: Confirmar RED de T001–T005/T007/T010/T011 e os quatro pontos de desfecho de `runCliAgent` (`src/delegation/run.ts`, `SPEC-0019`).
  - [x] **EXECUTE**: `src/telemetry/record.ts` com a união discriminada `AgentTelemetryEntry`; `CliRuntimeContext.telemetry?: { now(): string; record(entry): void }` em `src/delegation/run.ts`; `runCliAgent` mede o tempo e chama `cliRuntime.telemetry?.record(...)` em cada um dos quatro desfechos, sem alterar o texto já retornado. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-record.test.ts` verde; suíte de delegação (`SPEC-0019`) sem regressão.
  - [x] **VISUAL**: Não aplicável — sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados nas seções 11–13.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
  <!-- framework:evidence {"task":"T017","refs":["US-001","FR-001","FR-002","NFR-001","NFR-002","AC-001","AC-002","AC-003","AC-004","AC-005","AC-007","AC-010","AC-011"],"files":["src/telemetry/record.ts","src/delegation/run.ts"],"commands":[{"run":"npx vitest run tests/telemetry-record.test.ts","exit":0}]} -->

- [x] T018 [CODE] [US-002] Implementar maestro report e ligar os hooks reais em src/cli.ts — Refs: US-002, FR-004, NFR-001, NFR-002, AC-008, AC-009, AC-014 — Depends: T015, T016, T017, T008, T009, T014
  - [x] **PREP**: Confirmar T015–T017 GREEN e o padrão de `formatPlan`/`formatRun` em `src/cli.ts`.
  - [x] **EXECUTE**: `USAGE_REPORT`, `formatReport(args)` — lê `.maestro/telemetry/<trace>.json`, renderiza ou recusa nomeado; registro em `COMMANDS`; `formatRun` passa `telemetry: { now, record }` real dentro de `cliRuntime`. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/telemetry-report.test.ts` verde; suíte de CLI sem regressão.
  - [x] **VISUAL**: Não aplicável — sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados nas seções 11–13.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
  <!-- framework:evidence {"task":"T018","refs":["US-002","FR-004","NFR-001","NFR-002","AC-008","AC-009","AC-014"],"files":["src/cli.ts"],"commands":[{"run":"npx vitest run tests/telemetry-report.test.ts","exit":0}]} -->

**Checkpoint**: um plano aprovado com agentes `cli` grava telemetria de cada tentativa, e `maestro report <trace>` lê o resultado.

#### Fase final — Documentação e qualidade

- [x] T019 [DOC] [US-001] Registrar o módulo de telemetria em .project-context/STACK.md e revisar PROJECT.md — Refs: US-001, US-002, FR-001, FR-004, AC-001, AC-008 — Depends: T017, T018
  - [x] **PREP**: Confirmar T017/T018 GREEN e o conteúdo atual dos dois documentos.
  - [x] **EXECUTE**: Seção nova em `.project-context/STACK.md` (formato do registro, o que nunca é gravado, `maestro report`) e revisão de `PROJECT.md` registrando a telemetria entregue.
  - [x] **VERIFY**: `monitor_context.mjs --check` sem pendência real; `build_documentation.mjs --project .` limpo.
  - [x] **VISUAL**: Não aplicável — documentação em Markdown, sem tela.
  - [x] **EVIDENCE**: Registrar comandos e resultado nas seções 11–13.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T020 [TEST] Regressão completa e verificação manual com um backend real, registrada em specs/defined/0020-telemetria-multi-agente/spec.md — Refs: US-001, US-002, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014 — Depends: T015, T016, T017, T018, T019
  - [x] **PREP**: Identificar suites, checks e gates aplicáveis; confirmar ao menos um backend `cli` instalado nesta máquina.
  - [x] **EXECUTE**: `npx vitest run`, `npx tsc --noEmit`, `check_traceability.mjs`, `verify_acceptance.mjs`, e o ciclo real `maestro plan` → `maestro run` → `maestro report <trace>` com um agente `cli` real.
  - [x] **VERIFY**: Suíte verde, `tsc` limpo, rastreabilidade cobrindo os IDs da spec, `QA: PASSED`, e o registro real conferido contra o que de fato aconteceu no spawn.
  - [x] **VISUAL**: Não aplicável — repasse final sem superfície visual própria.
  - [x] **EVIDENCE**: Registrar contagens, o comando real e seu resultado nas seções 11–13.
  - [x] **IMPROVE**: Registrar retrospectiva do processo.

### 15. Ordem de execução

- Caminho crítico: T001–T014 (paralelas) → T015/T016/T017 (paralelas entre si, arquivos disjuntos) → T018 → T019 → T020.
- Tarefas paralelas: T001–T014 são independentes entre si. T015 e T016 tocam módulos disjuntos e podem andar com T017; T018 depende das três porque é quem as liga ao comando real.
- Restrição de sequenciamento: a verificação manual final (T020) precisa de ao menos um backend `cli` instalado — nesta máquina, os cinco da `SPEC-0019` estão.
- Estratégia de MVP: não aplicável — é uma história de gravação e uma de leitura, e entregar só a gravação deixaria o valor pela metade (registrar sem forma de consultar).

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- `SPEC-0019` (execução via CLI externa) — telemetria observa o pipeline já entregue, não o reabre.
- `SPEC-0016` (plano de orquestração) — o `trace` que correlaciona tudo já existe.

#### Riscos

- Um campo novo esquecido em `AgentTelemetryEntry` poderia, no futuro, carregar dado sensível sem intenção → mitigado por `NFR-002` e um caso TDD dedicado (`AC-007`) que inspeciona exatamente as chaves gravadas, não só a ausência de duas strings específicas.

#### Suposições

- Um agente `cli` processado sequencialmente por vez (mesma suposição de `SPEC-0019`, `PR-003`/escopo) — telemetria não precisa lidar com escrita concorrente no mesmo arquivo.

### 17. Decisões

- **DEC-001**: Só metadados estruturados, nunca stdout/stderr — razão: privacidade e volume; alternativa rejeitada (guardar tudo) traria risco de reter segredo de projeto sem necessidade real (decisão rodada 1).
- **DEC-002**: Um arquivo por trace em `.maestro/telemetry/<trace>.json`, não um ledger único — razão: espelha `.maestro/plans/<trace>.json` já entregue, e correlaciona naturalmente ao plano que aprovou aquela execução (decisão rodada 2).
- **DEC-003**: Só `runtime: cli` grava telemetria — razão: é o único runtime com prova real de execução; gravar para `native`/`auto` fingiria uma evidência que a `SPEC-0018` deliberadamente não tem (decisão rodada 3).
- **DEC-004**: Novo comando `maestro report <trace>` — razão: fecha o ciclo de valor da telemetria; sem leitura, gravar é trabalho sem uso (decisão rodada 4).

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Todos os cenários `AC` aplicáveis passam.
- [ ] Todos os requisitos possuem evidência de verificação.
- [ ] Todas as tarefas na seção 14 estão concluídas.
- [ ] Testes e checks estáticos disponíveis passam.
