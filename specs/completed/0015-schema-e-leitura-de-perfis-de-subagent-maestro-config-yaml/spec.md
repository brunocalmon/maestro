# Especificação integrada: Schema e leitura de perfis de subagent (.maestro/config.yaml)

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0015 |
| Slug | 0015-schema-e-leitura-de-perfis-de-subagent-maestro-config-yaml |
| Status | Complete |
| Effort | 6 |
| Effort updated at | 2026-09-06 |
| Effort rationale | Mecanismo novo sem precedente direto no projeto (composição de agente em cinco grupos, wrapper `{value, mode}` uniforme, semeadura de arquivos físicos), somado a integração com três superfícies já existentes (`setup`, leitor de config da SPEC-0012, `doctor` da SPEC-0011). Sem I/O de rede, concorrência ou execução de agente — a execução em si pertence às fatias MA-4/MA-5. Faixa `standard` alta. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — arquivo de configuração YAML e comandos de terminal já existentes (`setup`, `doctor`), sem tela. |
| Atualizada em | 2026-09-06 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O épico de orquestração multi-agente (`BACKLOG-0009`) exige que a pessoa possa
declarar perfis de agente — o próprio maestro e seus subagents — com modelo,
comportamento, capacidades e forma de execução, e que cada propriedade possa
ser uma *sugestão* (o planejamento pode propor algo diferente, explicando o
trade-off) ou *obrigatória* (não negociável). Hoje nada disso existe:
`.maestro/config.yaml` (renomeado de `.common-rules/config.yaml` pela
`SPEC-0014`) tem apenas as seções `language`, `project`, `system` e `git`
entregues pela `SPEC-0012`, e o projeto não tem nenhum conceito de perfil de
agente, nem em código nem em disco.

Sem essa fundação, nenhuma das fatias seguintes do épico consegue existir: o
planejamento (MA-2) não tem perfis para referenciar, a recomendação de modelo
estendida (MA-3) não tem onde ler restrição por agente, e as duas fatias de
execução (MA-4 nativa, MA-5 CLI externa) não têm como saber qual runtime cada
agente deve usar.

#### Resultado desejado

`.maestro/config.yaml` ganha uma seção `maestro:` que descreve o agente mestre
e sua lista de `subagents`, cada um composto por cinco grupos de propriedades
(`identity`, `cognition`, `instruction`, `capability`, `execution`), com toda
propriedade no formato uniforme `{ value, mode }` — `mode` sendo `suggested`
ou `required`. O `setup` semeia os arquivos de fábrica reais quando ausentes
(nunca sobrescrevendo o que existe); um leitor carrega e valida a seção; e o
`doctor` relata referência quebrada sem alterar nada.

#### Métricas de sucesso

- Um projeto recém-configurado tem `.maestro/config.yaml` com a seção `maestro:` preenchida e os arquivos que ela referencia existindo fisicamente em `.maestro/subagents/maestro/`.
- Nenhum comportamento padrão de agente vive como string embutida no código — cada default de fábrica é um arquivo real, referenciado explicitamente pela config.
- Uma referência quebrada (arquivo apagado, caminho inválido) faz a leitura recusar em voz alta nomeando o perfil e o arquivo, e aparece no relatório do `doctor` com código de saída diferente de zero.

### 2. Research e esclarecimentos

#### Researchs executados

- Nenhum research externo. O desenho vem da entrevista de descoberta desta sessão (8 perguntas numeradas, registradas em `Dúvidas respondidas`) e da inspeção do código existente.

#### Fontes e contexto consultados

- `src/config/schema.ts` — seções atuais (`language`, `project`, `system`, `git`), interface `ConfigDocument` e a lista `SCHEMA_KEYS` que prova a invariante "nenhuma chave omitida" (`SPEC-0012`, `NFR-001`).
- `src/config/write.ts` — `CONFIG_PATH` e `ensureConfigFile(root)`, que cria o arquivo somente quando ausente e nunca sobrescreve valor já definido pela pessoa.
- `src/setup/run.ts:158` — ponto onde o `setup` já garante `config.yaml` presente e completo; é onde a semeadura desta fatia se conecta.
- `src/extensions/diagnose.ts`, `src/doctor.ts` — padrão de diagnóstico só-leitura que relata divergência sem tocar em disco (`SPEC-0011`, `PR-082`).
- `specs/backlog/0009-orchestrator-monta-times-multi-agente-dinamicos-e-delega-para-clis-externas.md` — épico de origem, decisões D1–D7 e a decomposição em fatias MA-1 a MA-6.

#### Documentação consultada

- Nenhuma documentação externa.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo. O levantamento inteiro é inspeção do próprio repositório, citada com caminho relativo acima.

#### Dúvidas respondidas

- **Q**: Como expressar a flag sugestão-vs-obrigatória no YAML? → **A**: formato objeto uniforme `{ value, mode }` em toda propriedade, sempre — sem forma curta alternativa (rodada 1).
- **Q**: Onde fica a config do próprio maestro? → **A**: chave `maestro:` de topo, com suas próprias propriedades, e `maestro.subagents:` como lista aninhada de perfis (rodada 2).
- **Q**: `behavior` substitui ou soma ao padrão? → **A**: duas chaves separadas — `behavior` substitui, `additional_behavior` soma (rodada 3).
- **Q**: Qual a estrutura de composição de um agente e onde vivem seus arquivos? → **A**: cinco grupos (`identity`, `cognition`, `instruction`, `capability`, `execution`), com diretório físico `.maestro/subagents/<nome>/` por agente; nada hardcoded, cada default de fábrica é arquivo real referenciado explicitamente; `capability.skills` aceita caminho para `.agents/skills/*` já instalada, sem duplicar (rodada 4).
- **Q**: O que acontece com referência quebrada? → **A**: recusa em voz alta na leitura, nomeando perfil e arquivo; `doctor` relata a mesma divergência sem alterar nada (rodada 5).
- **Q**: Os defaults de fábrica entram no checksum da `SPEC-0011`? → **A**: não — são sementes livres, escritas uma vez quando ausentes e a partir daí pertencentes à pessoa, mesmo espírito do `config.yaml` da `SPEC-0012` (rodada 6).
- **Q**: Qual a fronteira da MA-1? → **A**: fatia vertical completa — semear no `setup`, ler, validar e relatar no `doctor` (rodada 7).
- **Q**: Existe camada de config por máquina/usuário? → **A**: não, apenas por projeto (rodada 8).

#### Dúvidas abertas

- Nenhuma bloqueante. Uma decisão deliberadamente adiada está registrada em `17. Decisões` (`DEC-005`): herança/composição entre perfis (`extends`) fica fora desta fatia, e pode ser acrescentada depois como propriedade opcional sem quebrar o schema.

### 3. Escopo e atores

#### Incluído

- Seção `maestro:` no schema de `.maestro/config.yaml`, com os cinco grupos de propriedades e a lista `subagents`.
- Wrapper uniforme `{ value, mode }` para toda propriedade configurável, com `mode` ∈ `suggested | required`.
- Semeadura pelo `setup`: cria `.maestro/subagents/maestro/description.md` e `behavior.md` e a seção `maestro:` do `config.yaml` quando ausentes, sem sobrescrever o que já existir.
- Leitor que carrega a seção, resolve os caminhos referenciados e valida a estrutura.
- Relato do `doctor` sobre referência quebrada, só-leitura, com código de saída diferente de zero.

#### Fora de escopo

- Planejamento de orquestração e o gate de aprovação humana (fatia MA-2).
- Extensão do `recommend()` com janela de contexto e tipo de tarefa (fatia MA-3).
- Qualquer execução de agente, nativa ou por subprocesso (fatias MA-4 e MA-5).
- Telemetria multi-agente (fatia MA-6).
- Herança entre perfis (`extends`) — ver `DEC-005`.
- Camada de configuração por máquina/usuário (`~/.maestro/`) — rejeitada na rodada 8.
- Submeter os arquivos-semente ao checksum/quarentena da `SPEC-0011` — rejeitado na rodada 6.

#### Atores

- **Pessoa que configura o projeto**: escreve e edita perfis em `.maestro/config.yaml` e os arquivos Markdown em `.maestro/subagents/<nome>/`; espera que o sistema recuse em voz alta quando algo estiver inconsistente, em vez de operar sobre estado parcial.
- **Fatias seguintes do épico (MA-2 a MA-6)**: consumidoras do leitor entregue aqui; dependem de um contrato estável de perfil carregado e validado.

### 4. Princípios e restrições do projeto

- **PR-001**: Nada implícito, nada hardcoded — cada comportamento padrão de agente é um arquivo real em disco, referenciado explicitamente pela config; o código nunca carrega comportamento embutido em string.
- **PR-002**: Recusa em voz alta em vez de operar sobre estado parcial, mesmo princípio já fixado em `SPEC-0004` (`DEC-002`) e `SPEC-0011`.
- **PR-003**: `doctor` permanece estritamente só-leitura, nunca altera o sistema de arquivos (`PR-082`, `SPEC-0011`).
- **PR-004**: Nada é escrito fora da raiz do projeto (`SPEC-0003`, `NFR-001`) — a config é por projeto, sem camada de máquina.
- **PR-005**: O `setup` cria somente o que está ausente e nunca sobrescreve valor já definido pela pessoa — regra estabelecida pela `SPEC-0012` na garantia de presença do `config.yaml`.

### 5. Histórias de usuário

#### US-001 — Declarar perfis de agente verificáveis (P1)

Como pessoa que configura o maestro, quero declarar em `.maestro/config.yaml`
o perfil do agente mestre e de cada subagent — com modelo, comportamento,
capacidades e forma de execução, marcando cada propriedade como sugestão ou
obrigatória — para que as fatias de planejamento e execução tenham uma fonte
explícita e validada de como cada agente deve operar.

**Por que P1**: é a fundação do épico; nenhuma fatia seguinte existe sem ela.
**Teste independente**: rodar `setup` num projeto novo e confirmar `.maestro/config.yaml` com seção `maestro:` completa e os arquivos referenciados existindo; apagar um arquivo referenciado e confirmar recusa em voz alta na leitura e relato no `doctor`.
**Requisitos**: FR-001, FR-002, FR-003, FR-004

### 6. Cenários BDD de aceite

#### AC-001 — a seção maestro existe e está completa após o setup

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-001
Feature: schema de perfis de agente

  Scenario: setup num projeto sem configuração prévia
    Given um projeto sem .maestro/config.yaml
    When a pessoa roda o setup
    Then .maestro/config.yaml contém a seção maestro
    And a seção declara os cinco grupos identity, cognition, instruction, capability e execution
    And declara uma lista subagents
```

#### AC-002 — toda propriedade usa o formato uniforme value/mode

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-002
Feature: schema de perfis de agente

  Scenario: formato das propriedades semeadas
    Given a seção maestro recém-semeada pelo setup
    When alguém inspeciona qualquer propriedade configurável
    Then ela é um objeto com as chaves value e mode
    And mode vale suggested ou required
```

#### AC-003 — o setup não sobrescreve configuração já existente

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-003
Feature: schema de perfis de agente

  Scenario: rodar o setup sobre uma configuração já customizada
    Given um projeto cuja seção maestro já declara um subagent chamado gitops-dev
    When a pessoa roda o setup de novo
    Then o subagent gitops-dev continua declarado, inalterado
    And nenhuma propriedade já definida pela pessoa é substituída pelo default de fábrica
```

#### AC-004 — os arquivos de fábrica existem fisicamente

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-004
Feature: sementes de fábrica em disco

  Scenario: arquivos referenciados pela config de fábrica
    Given um projeto recém-configurado pelo setup
    When alguém abre os caminhos que a seção maestro referencia
    Then .maestro/subagents/maestro/description.md existe com conteúdo
    And .maestro/subagents/maestro/behavior.md existe com conteúdo
```

#### AC-005 — nenhum comportamento padrão vive embutido no código

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-005
Feature: sementes de fábrica em disco

  Scenario: origem do comportamento padrão
    Given o código de produção do projeto
    When alguém procura o texto do comportamento padrão do maestro
    Then ele aparece somente em um arquivo de recurso versionado, nunca como string embutida na lógica
    And a semeadura copia esse recurso para .maestro/subagents/maestro/behavior.md
```

#### AC-006 — a semeadura não apaga arquivo de comportamento já editado

**Cobre**: US-001, FR-002, NFR-002

```gherkin
@US-001 @FR-002 @NFR-002 @AC-006
Feature: sementes de fábrica em disco

  Scenario: comportamento customizado sobrevive a uma reexecução
    Given .maestro/subagents/maestro/behavior.md editado à mão pela pessoa
    When a pessoa roda o setup de novo
    Then o conteúdo editado permanece intacto
    And nenhum aviso de divergência é emitido, porque o arquivo pertence à pessoa
```

#### AC-007 — o leitor carrega perfis válidos

**Cobre**: US-001, FR-003, NFR-001

```gherkin
@US-001 @FR-003 @NFR-001 @AC-007
Feature: leitura e validação de perfis

  Scenario: config válida com um subagent declarado
    Given uma seção maestro válida declarando o subagent gitops-dev com model required
    When o leitor carrega a configuração
    Then o perfil gitops-dev é devolvido com seu modelo e o mode required preservado
    And o perfil do próprio maestro é devolvido junto
```

#### AC-008 — referência quebrada faz a leitura recusar em voz alta

**Cobre**: US-001, FR-003, NFR-002

```gherkin
@US-001 @FR-003 @NFR-002 @AC-008
Feature: leitura e validação de perfis

  Scenario: arquivo de behavior apagado
    Given um perfil cujo behavior aponta para um arquivo inexistente
    When o leitor carrega a configuração
    Then a leitura falha nomeando o perfil e o caminho quebrado
    And nenhum perfil parcialmente válido é devolvido
```

#### AC-009 — mode inválido é recusado

**Cobre**: US-001, FR-003, NFR-002

```gherkin
@US-001 @FR-003 @NFR-002 @AC-009
Feature: leitura e validação de perfis

  Scenario: valor de mode fora do domínio
    Given uma propriedade cujo mode não é suggested nem required
    When o leitor carrega a configuração
    Then a leitura falha nomeando a propriedade e o valor inválido
```

#### AC-010 — o doctor relata referência quebrada

**Cobre**: US-001, FR-004, NFR-002

```gherkin
@US-001 @FR-004 @NFR-002 @AC-010
Feature: relato do doctor

  Scenario: diagnóstico sobre config com referência quebrada
    Given um perfil cujo behavior aponta para um arquivo inexistente
    When a pessoa roda o doctor
    Then o relatório nomeia o perfil e o caminho quebrado
    And o código de saída é diferente de zero
```

#### AC-011 — o doctor não altera nada

**Cobre**: US-001, FR-004, NFR-002

```gherkin
@US-001 @FR-004 @NFR-002 @AC-011
Feature: relato do doctor

  Scenario: sistema de arquivos após o diagnóstico
    Given um projeto com config de agentes quebrada
    When a pessoa roda o doctor
    Then nenhum arquivo é criado, alterado ou removido
```

#### AC-012 — config íntegra passa limpa pelo doctor

**Cobre**: US-001, FR-004, NFR-001

```gherkin
@US-001 @FR-004 @NFR-001 @AC-012
Feature: relato do doctor

  Scenario: diagnóstico sobre config íntegra
    Given um projeto recém-configurado, com todas as referências resolvendo
    When a pessoa roda o doctor
    Then nenhuma divergência de perfil de agente é relatada
```

### 7. Requisitos

#### Funcionais

- **FR-001**: `.maestro/config.yaml` deve aceitar uma seção `maestro:` composta pelos grupos `identity`, `cognition`, `instruction`, `capability` e `execution`, mais a lista `subagents` (cada item com a mesma composição); toda propriedade configurável deve usar o formato `{ value, mode }`, com `mode` ∈ `suggested | required`; o `setup` deve semear essa seção quando ausente sem sobrescrever nada já definido pela pessoa.
- **FR-002**: O `setup` deve criar `.maestro/subagents/maestro/description.md` e `.maestro/subagents/maestro/behavior.md` a partir de recursos versionados quando ausentes, sem sobrescrever conteúdo existente; nenhum comportamento padrão pode existir como string embutida na lógica de produção.
- **FR-003**: Um leitor deve carregar a seção `maestro:`, resolver os caminhos referenciados por `instruction.behavior`, `instruction.additional_behavior` e `capability.skills`, e recusar em voz alta — nomeando perfil, propriedade e caminho — diante de referência quebrada, `mode` fora do domínio ou estrutura inválida, nunca devolvendo perfil parcialmente válido.
- **FR-004**: O `doctor` deve relatar as mesmas divergências que o leitor recusa, nomeando perfil e caminho, sair com código diferente de zero quando houver alguma, e não alterar o sistema de arquivos sob nenhuma condição.

#### Não funcionais

- **NFR-001**: Nenhuma chave do schema pode ser omitida na semeadura, e nenhum default pode vir de string embutida no código. **Verificação**: lista `SCHEMA_KEYS` estendida com as chaves novas e teste que confirma que o texto do comportamento padrão vive em recurso versionado, não em `src/`.
- **NFR-002**: Nenhuma operação desta fatia destrói ou sobrescreve conteúdo da pessoa, e nenhum estado parcialmente válido é devolvido. **Verificação**: testes de reexecução do `setup` sobre config customizada e de leitura sobre config quebrada, mais inspeção do `doctor` confirmando ausência de escrita.

#### Erros e casos-limite

- Arquivo referenciado por `behavior`/`additional_behavior` inexistente → leitura recusa nomeando perfil e caminho (AC-008); `doctor` relata (AC-010).
- Caminho em `capability.skills` que não existe → mesmo tratamento de referência quebrada.
- `mode` fora de `suggested | required` → recusa nomeando propriedade e valor (AC-009).
- Seção `maestro:` ausente num projeto que nunca rodou o `setup` renomeado → o leitor devolve ausência explícita (não erro), e o `setup` semeia na próxima execução.
- Dois subagents com o mesmo `identity.name` → recusa; nome é o identificador usado pelo planejamento e por logs, precisa ser único.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

`src/config/schema.ts` define `ConfigDocument` com quatro seções e a lista
`SCHEMA_KEYS` que prova a invariante de completude. `src/config/write.ts`
expõe `CONFIG_PATH` e `ensureConfigFile(root)`, que cria o arquivo somente
quando ausente. `src/setup/run.ts:158` já chama essa garantia durante o
`setup`. `src/doctor.ts` compõe seu relatório a partir de funções de
diagnóstico puras e só-leitura (padrão de `src/extensions/diagnose.ts`).

#### Arquitetura e módulos

- `src/config/schema.ts`: acrescenta `MaestroSection`, `AgentProfile`,
  `ConfiguredProperty<T>` (`{ value, mode }`), `PropertyMode` e os cinco
  grupos; estende `ConfigDocument` e `SCHEMA_KEYS`.
- `src/agents/profile.ts` (novo): tipos de domínio do perfil carregado e a
  função pura de validação estrutural (formato, `mode` no domínio, nomes
  únicos), sem tocar em disco.
- `src/agents/read.ts` (novo): leitor que resolve caminhos referenciados
  contra a raiz do projeto e recusa em voz alta; recebe um ambiente injetado
  (existência de arquivo) para ser testável sem I/O real.
- `src/agents/diagnose.ts` (novo): diagnóstico só-leitura consumido pelo
  `doctor`, no mesmo formato de `src/extensions/diagnose.ts`.
- `src/agents/seed.ts` (novo): semeadura dos arquivos de fábrica a partir de
  `resources/agents/maestro/`, criando somente o ausente.
- `resources/agents/maestro/description.md` e
  `resources/agents/maestro/behavior.md` (novos): os defaults de fábrica como
  arquivos versionados — a fonte que a semeadura copia.
- `src/doctor.ts`: passa a compor também o diagnóstico de perfis de agente.
- `src/setup/run.ts`: chama a semeadura junto da garantia de `config.yaml`.

#### Migrations

- Não aplicável — não há banco de dados.

#### Models

- `AgentProfile`: identidade (`name`, `description`), cognição (`model`, `context_budget`, `reasoning_effort`), instrução (`behavior`, `additional_behavior`), capacidade (`skills`, `tools`, `mcp_servers`) e execução (`runtime`, `concurrency`, `cli`). Invariante: `name` único entre perfis; cada campo configurável é `ConfiguredProperty<T>`.

#### Controllers e casos de uso

- Não aplicável — CLI e servidor MCP, sem camada de controller.

#### Views e experiência

- Não aplicável — sem interface para pessoas.

#### Queries e repositórios

- Não aplicável.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/draft/0015-schema-e-leitura-de-perfis-de-subagent-maestro-config-yaml/
  spec.md
src/
  config/schema.ts
  agents/profile.ts
  agents/read.ts
  agents/diagnose.ts
  agents/seed.ts
  doctor.ts
  setup/run.ts
resources/
  agents/maestro/description.md
  agents/maestro/behavior.md
tests/
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| `AgentProfile` | `identity.name.value`, único | cinco grupos; cada campo configurável no formato `{ value, mode }`; `mode` ∈ `suggested \| required` | o perfil `maestro` contém 0..N subagents |
| `ConfiguredProperty<T>` | — | `value: T`; `mode: PropertyMode` | composta por cada campo de `AgentProfile` |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Configuração | ausente | `setup` | semeada com defaults de fábrica | nada existente é sobrescrito |
| Configuração | semeada | edição pela pessoa | customizada | arquivos pertencem à pessoa, sem checksum |
| Configuração | customizada | referência apagada | inválida | leitura recusa; `doctor` relata; disco intocado |

#### Migração e retenção

- Não aplicável — seção nova, sem dado prévio a migrar.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não. A entrega é schema de configuração YAML, semeadura de arquivos e relato em comandos de terminal já existentes.

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

- `readAgentConfig(root, env)` — devolve os perfis validados ou lança recusa nomeando perfil, propriedade e caminho.
- `diagnoseAgents(root, env)` — devolve a lista de divergências, sem escrever nada.
- `seedAgentDefaults(root, env)` — cria o ausente e devolve o que escreveu.

#### APIs externas utilizadas

- Nenhuma.

#### Documentação das APIs consultadas

- Não aplicável.

#### Eventos e outros contratos

- Contrato consumido pelas fatias MA-2 a MA-6: o formato de `AgentProfile` devolvido pelo leitor é a fronteira estável entre esta fatia e o restante do épico.

### 11. Estratégia TDD

- **Unidade**: validação estrutural pura (`profile.ts`), resolução de caminho e recusa (`read.ts`), diagnóstico (`diagnose.ts`), semeadura idempotente (`seed.ts`).
- **Integração/contrato**: `setup` num root isolado produzindo config + arquivos semeados; `doctor` compondo o diagnóstico novo.
- **BDD/aceite**: os doze cenários da seção 6 orientam os doze casos TDD (um por AC).
- **Runner TDD**: Vitest, já materializado em `test:tdd` (decisão vigente do projeto, reaproveitada sem nova pergunta).
- **E2E**: não aplicável — nenhuma execução de agente nesta fatia.
- **Verificação manual**: nenhuma; todos os ACs desta fatia são automatizáveis.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, AC-001 | AC-001 na seção 6 | tests/agents-config-schema.test.ts (T001) | seção `maestro` ausente em `.maestro/config.yaml` | GREEN | 449/449 na suíte completa |
| US-001, FR-001, NFR-001, AC-002 | AC-002 na seção 6 | tests/agents-config-schema.test.ts (T002) | nenhuma propriedade `{ value, mode }` para percorrer | GREEN | 449/449 na suíte completa |
| US-001, FR-001, NFR-002, AC-003 | AC-003 na seção 6 | tests/agents-config-schema.test.ts (T003) | `readConfig(root).maestro` é `undefined` na segunda execução | GREEN | 449/449 na suíte completa |
| US-001, FR-002, NFR-001, AC-004 | AC-004 na seção 6 | tests/agents-seed.test.ts (T004) | `.maestro/subagents/maestro/description.md` não existe | GREEN | 449/449 na suíte completa |
| US-001, FR-002, NFR-001, AC-005 | AC-005 na seção 6 | tests/agents-seed.test.ts (T005) | `resources/agents/maestro/behavior.md` não existe | GREEN | 449/449 na suíte completa |
| US-001, FR-002, NFR-002, AC-006 | AC-006 na seção 6 | tests/agents-seed.test.ts (T006) | `ENOENT` ao abrir `behavior.md` semeado | GREEN | 449/449 na suíte completa |
| US-001, FR-003, NFR-001, AC-007 | AC-007 na seção 6 | tests/agents-read.test.ts (T007) | `Cannot find module '../src/agents/read'` | GREEN | 449/449 na suíte completa |
| US-001, FR-003, NFR-002, AC-008 | AC-008 na seção 6 | tests/agents-read.test.ts (T008) | `Cannot find module '../src/agents/read'` | GREEN | 449/449 na suíte completa |
| US-001, FR-003, NFR-002, AC-009 | AC-009 na seção 6 | tests/agents-read.test.ts (T009) | `Cannot find module '../src/agents/read'` | GREEN | 449/449 na suíte completa |
| US-001, FR-004, NFR-002, AC-010 | AC-010 na seção 6 | tests/agents-doctor.test.ts (T010) | `Cannot find module '../src/agents/diagnose'` | GREEN | 449/449 na suíte completa |
| US-001, FR-004, NFR-002, AC-011 | AC-011 na seção 6 | tests/agents-doctor.test.ts (T011) | `Cannot find module '../src/agents/diagnose'` | GREEN | 449/449 na suíte completa |
| US-001, FR-004, NFR-001, AC-012 | AC-012 na seção 6 | tests/agents-doctor.test.ts (T012) | `Cannot find module '../src/agents/diagnose'` | GREEN | 449/449 na suíte completa |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Integração (root isolado) | `tests/agents-config-schema.test.ts` | Passed |
| FR-001 | AC-002 | Unidade | `tests/agents-config-schema.test.ts` | Passed |
| FR-001 | AC-003 | Integração (root isolado) | `tests/agents-config-schema.test.ts` | Passed |
| FR-002 | AC-004 | Integração (root isolado) | `tests/agents-seed.test.ts` | Passed |
| FR-002 | AC-005 | Unidade (inspeção de fonte) | `tests/agents-seed.test.ts` | Passed |
| FR-002 | AC-006 | Integração (root isolado) | `tests/agents-seed.test.ts` | Passed |
| FR-003 | AC-007 | Unidade | `tests/agents-read.test.ts` | Passed |
| FR-003 | AC-008 | Unidade | `tests/agents-read.test.ts` | Passed |
| FR-003 | AC-009 | Unidade | `tests/agents-read.test.ts` | Passed |
| FR-004 | AC-010 | Unidade | `tests/agents-doctor.test.ts` | Passed |
| FR-004 | AC-011 | Integração (root isolado) | `tests/agents-doctor.test.ts` | Passed |
| FR-004 | AC-012 | Unidade | `tests/agents-doctor.test.ts` | Passed |
| NFR-001 | AC-001, AC-002, AC-004, AC-005, AC-012 | Unidade + integração | ver linhas acima | Passed |
| NFR-002 | AC-003, AC-006, AC-008, AC-009, AC-010, AC-011 | Unidade + integração | ver linhas acima | Passed |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-09-06)
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/draft/0015-schema-e-leitura-de-perfis-de-subagent-maestro-config-yaml/spec.md --allow-draft` → `VALID DRAFT`.
- **Achados**: Nenhum `BLOCKER`. Revisão semântica: as 8 decisões da entrevista (`BACKLOG-0009`, fatia MA-1) viraram `FR`, `AC` ou `DEC` rastreáveis. Cobertura mínima confirmada: US-001 → 12 AC; FR-001 → 3 AC (AC-001/002/003); FR-002 → 3 AC (AC-004/005/006); FR-003 → 3 AC (AC-007/008/009); FR-004 → 3 AC (AC-010/011/012); NFR-001 → 5 AC; NFR-002 → 6 AC. `Interface para pessoas: Não` justificada. Uma decisão foi deliberadamente adiada e registrada como tal (`DEC-005`, herança entre perfis), não como lacuna. Dependência dura registrada na seção 16: esta fatia não vai a GREEN antes da `SPEC-0014` estar implementada, porque `.maestro/` só existe depois dela. Um falso positivo do validador foi corrigido: a citação cruzada a um requisito de outra spec era lida como requisito local sem cenários.

#### Gate do Ato II — Plano

- **Resultado**: READY (2026-09-06)
- **Comando**: `node .claude/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/defined/0015-schema-e-leitura-de-perfis-de-subagent-maestro-config-yaml/spec.md` — `READY` (`total=18 complete=12 tdd=13 code=4 checklist_complete=72 covered_spec_ids=19 required_spec_ids=19`).
- **Achados**: Nenhum bloqueio. As 12 tarefas `[TEST][TDD]` (uma por `AC`) estão concluídas com RED real observado — três por falta da seção `maestro:` no schema, três por falta dos arquivos semeados, e seis por módulo inexistente (`src/agents/read.ts` e `src/agents/diagnose.ts`). Nenhum RED foi fabricado alterando produção: todos falham pela ausência do comportamento que a fatia vai entregar. As quatro tarefas `[CODE]` (T013–T016) têm exatamente três predecessores TDD concluídos cada, satisfazendo a checagem estrita. A dependência dura sobre a `SPEC-0014` deixou de existir: aquela spec foi concluída antes desta rodada, então `.maestro/` já existe e os testes puderam ser escritos contra o caminho real.

#### Gate do Ato III — Entrega

- **Resultado**: READY (2026-09-06) — 18/18 tarefas, 108/108 itens de checklist
- **Comando**: `node .claude/skills/framework-06-tdd-bdd/scripts/check_traceability.mjs specs/planned/0015-schema-e-leitura-de-perfis-de-subagent-maestro-config-yaml/spec.md .` — `Rastreabilidade: 19/19 IDs cobertos em 175 arquivos de teste`; `verify_acceptance.mjs`: `QA: PASSED`.
- **Achados**: Nenhum bloqueio. **449/449 testes** em 167 arquivos, `tsc` limpo, `build_documentation.mjs --check` limpo, `monitor_context.mjs --check` `CURRENT`. Verificado fora da suíte, com o binário instalado: `maestro setup` num projeto sem `.common-rules/` nem `.maestro/` criou `.maestro/config.yaml` com a seção `maestro:` completa e os dois arquivos semeados em `.maestro/subagents/maestro/`; `maestro doctor` saiu com 0 na config íntegra e, com o `behavior` apontando para um arquivo inexistente, imprimiu `agent profile: maestro: instruction.behavior — arquivo não encontrado: .maestro/subagents/maestro/apagado.md` e saiu com 1.
- Três correções aconteceram durante a execução e ficaram registradas em vez de silenciadas: a validação exigia os cinco grupos e contradizia a decisão `D6` do épico; o relatório do `doctor` saía silencioso enquanto o `exitCode` já era 1 (defeito que a suíte não pegava porque o caso afirmava sobre a função, não sobre a saída real); e os dois recursos de fábrica saíram em português, violando `language.default: en_US`, além de escritos como meta-comentário em vez de instrução operacional.
- Contexto ambiental que atrapalhou o diagnóstico: `/tmp` encheu (7,5 GB, 5.978 diretórios de fixture acumulados de execuções anteriores) e derrubou 14 testes com `ENOSPC`, o que por um momento pareceu regressão da renomeação. Limpo antes de concluir.

#### Aceite final (`$framework-04-validate`)

- **Resultado**: READY (2026-09-06)
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/review/0015-schema-e-leitura-de-perfis-de-subagent-maestro-config-yaml/spec.md` — `RESULTADO: READY`.
- **Achados**: Nenhum `BLOCKER`. Os três gates estão `Passed` com evidência verificável, e a Definition of Done está comprovada. A entrega foi confirmada com o binário instalado, não só pela suíte: `maestro setup` criou `.maestro/` do zero e `maestro doctor` nomeou a divergência e saiu com 1. Três correções de rumo ficaram registradas em vez de silenciadas (validação exigindo grupos que a `D6` permite omitir; relatório do `doctor` silencioso enquanto o `exitCode` já era 1; recursos de fábrica em português violando `language.default: en_US`). Uma lacuna de cobertura ficou explicitamente aberta na seção 16, sem teste heurístico para disfarçá-la: nada verifica idioma de recurso semeado. `Status: Complete`.

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

- [x] T001 [P] [TEST] [TDD] [US-001] Derivar de AC-001 um caso Vitest falhando em tests/agents-config-schema.test.ts — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-001; confirmar que `ConfigDocument` hoje tem só `language`, `project`, `system` e `git`.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-001 AC-001` — roda o `setup` num root isolado e afirma que `.maestro/config.yaml` traz a seção `maestro` com os cinco grupos e a lista `subagents`.
  - [x] **VERIFY**: `npx vitest run tests/agents-config-schema.test.ts` — **RED observado**: seção `maestro` ausente em `.maestro/config.yaml`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T002 [P] [TEST] [TDD] [US-001] Derivar de AC-002 um caso Vitest falhando em tests/agents-config-schema.test.ts — Refs: US-001, FR-001, NFR-001, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-002.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-001 AC-002` — percorre cada propriedade configurável da seção semeada e afirma que é um objeto `{ value, mode }` com `mode` em `suggested|required`.
  - [x] **VERIFY**: `npx vitest run tests/agents-config-schema.test.ts` — **RED observado**: nenhuma propriedade `{ value, mode }` para percorrer.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T003 [P] [TEST] [TDD] [US-001] Derivar de AC-003 um caso Vitest falhando em tests/agents-config-schema.test.ts — Refs: US-001, FR-001, NFR-002, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-003; confirmar que `ensureConfigFile` hoje nunca sobrescreve valor existente.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-002 AC-003` — semeia, injeta um subagent `gitops-dev` na config, roda o `setup` de novo e afirma que o perfil continua declarado e inalterado.
  - [x] **VERIFY**: `npx vitest run tests/agents-config-schema.test.ts` — **RED observado**: `readConfig(root).maestro` é `undefined` na segunda execução.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T004 [P] [TEST] [TDD] [US-001] Derivar de AC-004 um caso Vitest falhando em tests/agents-seed.test.ts — Refs: US-001, FR-002, NFR-001, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-004; confirmar que `.maestro/subagents/` não existe hoje.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-001 AC-004` — roda o `setup` num root isolado e afirma que `.maestro/subagents/maestro/description.md` e `behavior.md` existem com conteúdo não vazio.
  - [x] **VERIFY**: `npx vitest run tests/agents-seed.test.ts` — **RED observado**: `.maestro/subagents/maestro/description.md` não existe.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T005 [P] [TEST] [TDD] [US-001] Derivar de AC-005 um caso Vitest falhando em tests/agents-seed.test.ts — Refs: US-001, FR-002, NFR-001, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-005.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-001 AC-005` — afirma que o texto do comportamento padrão vive em `resources/agents/maestro/behavior.md` e que nenhum arquivo de `src/` carrega esse texto como string embutida.
  - [x] **VERIFY**: `npx vitest run tests/agents-seed.test.ts` — **RED observado**: `resources/agents/maestro/behavior.md` não existe.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T006 [P] [TEST] [TDD] [US-001] Derivar de AC-006 um caso Vitest falhando em tests/agents-seed.test.ts — Refs: US-001, FR-002, NFR-002, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-006.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-002 AC-006` — semeia, edita `behavior.md` à mão, roda o `setup` de novo e afirma que o conteúdo editado permanece byte a byte e que nenhuma divergência é relatada.
  - [x] **VERIFY**: `npx vitest run tests/agents-seed.test.ts` — **RED observado**: `ENOENT` ao abrir `behavior.md` semeado.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T007 [P] [TEST] [TDD] [US-001] Derivar de AC-007 um caso Vitest falhando em tests/agents-read.test.ts — Refs: US-001, FR-003, NFR-001, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-007; confirmar que `src/agents/read.ts` ainda não existe.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-001 AC-007` — monta uma config válida com o subagent `gitops-dev` (`model` em `required`) e afirma que o leitor devolve o perfil com modelo e `mode` preservados, junto do perfil do maestro.
  - [x] **VERIFY**: `npx vitest run tests/agents-read.test.ts` — **RED observado**: `Cannot find module '../src/agents/read'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T008 [P] [TEST] [TDD] [US-001] Derivar de AC-008 um caso Vitest falhando em tests/agents-read.test.ts — Refs: US-001, FR-003, NFR-002, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-008.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-002 AC-008` — aponta `behavior` para um arquivo inexistente e afirma que a leitura falha nomeando perfil e caminho, sem devolver perfil parcial.
  - [x] **VERIFY**: `npx vitest run tests/agents-read.test.ts` — **RED observado**: `Cannot find module '../src/agents/read'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T009 [P] [TEST] [TDD] [US-001] Derivar de AC-009 um caso Vitest falhando em tests/agents-read.test.ts — Refs: US-001, FR-003, NFR-002, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-009.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-002 AC-009` — usa `mode` fora de `suggested|required` e afirma que a leitura falha nomeando a propriedade e o valor inválido.
  - [x] **VERIFY**: `npx vitest run tests/agents-read.test.ts` — **RED observado**: `Cannot find module '../src/agents/read'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T010 [P] [TEST] [TDD] [US-001] Derivar de AC-010 um caso Vitest falhando em tests/agents-doctor.test.ts — Refs: US-001, FR-004, NFR-002, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-010; confirmar o formato atual do relatório do `doctor`.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-004 NFR-002 AC-010` — config com `behavior` quebrado, afirma que o relatório nomeia perfil e caminho e que o código de saída é diferente de zero.
  - [x] **VERIFY**: `npx vitest run tests/agents-doctor.test.ts` — **RED observado**: `Cannot find module '../src/agents/diagnose'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T011 [P] [TEST] [TDD] [US-001] Derivar de AC-011 um caso Vitest falhando em tests/agents-doctor.test.ts — Refs: US-001, FR-004, NFR-002, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-011.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-004 NFR-002 AC-011` — tira um snapshot de hash do root antes do `doctor`, roda, e afirma que a árvore permanece idêntica (nada criado, alterado ou removido).
  - [x] **VERIFY**: `npx vitest run tests/agents-doctor.test.ts` — **RED observado**: `Cannot find module '../src/agents/diagnose'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

- [x] T012 [P] [TEST] [TDD] [US-001] Derivar de AC-012 um caso Vitest falhando em tests/agents-doctor.test.ts — Refs: US-001, FR-004, NFR-001, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-012.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-004 NFR-001 AC-012` — projeto recém-semeado, com todas as referências resolvendo, e afirma que nenhuma divergência de perfil de agente é relatada.
  - [x] **VERIFY**: `npx vitest run tests/agents-doctor.test.ts` — **RED observado**: `Cannot find module '../src/agents/diagnose'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12.
  - [x] **IMPROVE**: Registrar aprendizado ou ausência justificada.

#### Fase 2 — US-001 (P1): schema, semeadura, leitura e diagnóstico

**Objetivo**: a seção `maestro:` existe, é semeada com arquivos reais, é lida e validada, e o `doctor` relata divergência sem alterar nada.
**Teste independente**: `npx vitest run tests/agents-config-schema.test.ts tests/agents-seed.test.ts tests/agents-read.test.ts tests/agents-doctor.test.ts` — os quatro arquivos verdes.

- [x] T013 [CODE] [US-001] Acrescentar MaestroSection, AgentProfile, ConfiguredProperty e PropertyMode em src/config/schema.ts, estendendo ConfigDocument e SCHEMA_KEYS — Refs: US-001, FR-001, NFR-001, NFR-002, AC-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [x] **PREP**: Confirmar RED de T001/T002/T003 e o formato atual de `ConfigDocument`/`SCHEMA_KEYS`.
  - [x] **EXECUTE**: Declarar os tipos dos cinco grupos e o wrapper `{ value, mode }`; acrescentar as chaves novas a `SCHEMA_KEYS` e ao default semeado, preservando a regra de nunca sobrescrever valor existente. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/agents-config-schema.test.ts` — AC-001, AC-002 e AC-003 **GREEN**; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — schema de configuração, sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados nas seções 11–13.
  - [x] **IMPROVE**: Nenhuma melhoria adicional — o wrapper `{ value, mode }` saiu de dois helpers (`suggested`/`required`) em vez de repetir a forma em cada propriedade do default.
  <!-- framework:evidence {"task":"T013","refs":["US-001","FR-001","NFR-001","NFR-002","AC-001","AC-002","AC-003"],"files":["src/config/schema.ts"],"commands":[{"run":"npx vitest run tests/agents-config-schema.test.ts","exit":0}]} -->

- [x] T014 [CODE] [US-001] Criar resources/agents/maestro/description.md e behavior.md e a semeadura em src/agents/seed.ts, ligada ao setup em src/setup/run.ts — Refs: US-001, FR-002, NFR-001, NFR-002, AC-004, AC-005, AC-006 — Depends: T004, T005, T006
  - [x] **PREP**: Confirmar RED de T004/T005/T006 e o ponto de `src/setup/run.ts` onde a garantia de config já acontece.
  - [x] **EXECUTE**: Escrever os dois recursos versionados com o comportamento padrão real (nenhum texto embutido em `src/`), implementar `seedAgentDefaults` criando somente o ausente, e chamá-la no `setup`. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/agents-seed.test.ts` — AC-004, AC-005 e AC-006 **GREEN**.
  - [x] **VISUAL**: Não aplicável — arquivos Markdown de recurso e código de semeadura, sem tela.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos criados nas seções 11–13.
  - [x] **IMPROVE**: Melhoria aplicada: a semeadura copia o diretório inteiro de `resources/agents/<agente>/` em vez de listar arquivo por arquivo, então acrescentar um recurso novo no futuro não exige tocar no código. **Defeito próprio, apontado pela pessoa responsável e corrigido**: a primeira versão dos dois recursos de fábrica saiu em português e como meta-comentário sobre o próprio arquivo, em vez de instrução operacional. Violava `language.default: en_US` do `config.yaml` — e justamente neste projeto, que é quem implementa essa regra (`SPEC-0012`); os caminhos `.maestro/subagents/**` não estão entre as exceções, que cobrem só `specs/**/spec.md` e `docs/**/*.md`. Reescritos em inglês e como instrução de operação real (planejar antes de agir, dimensionar o time, respeitar `required` vs `suggested`, vigiar a janela de contexto, reportar como uma voz só), e re-semeados no projeto para conferir o resultado.
  <!-- framework:evidence {"task":"T014","refs":["US-001","FR-002","NFR-001","NFR-002","AC-004","AC-005","AC-006"],"files":["resources/agents/maestro/behavior.md","resources/agents/maestro/description.md","src/agents/seed.ts","src/setup/run.ts"],"commands":[{"run":"npx vitest run tests/agents-seed.test.ts","exit":0}]} -->

- [x] T015 [CODE] [US-001] Implementar os tipos e a validação pura em src/agents/profile.ts e o leitor com recusa em voz alta em src/agents/read.ts — Refs: US-001, FR-003, NFR-001, NFR-002, AC-007, AC-008, AC-009 — Depends: T007, T008, T009
  - [x] **PREP**: Confirmar RED de T007/T008/T009 e o contrato de perfil declarado na seção 9.
  - [x] **EXECUTE**: `profile.ts` com validação estrutural pura (formato `{ value, mode }`, `mode` no domínio, nomes únicos) e `read.ts` resolvendo caminhos contra a raiz com ambiente injetado, recusando nomeando perfil, propriedade e caminho. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/agents-read.test.ts` — AC-007, AC-008 e AC-009 **GREEN**.
  - [x] **VISUAL**: Não aplicável — módulos de leitura e validação, sem tela.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos criados nas seções 11–13.
  - [x] **IMPROVE**: **Correção de rumo**: a primeira versão exigia os cinco grupos presentes, o que contradiz a decisão `D6` do épico (perfil declara qualquer combinação). Os testes pegaram isso; a validação passou a checar só o que o perfil declara, e grupo ausente deixou de ser divergência.
  <!-- framework:evidence {"task":"T015","refs":["US-001","FR-003","NFR-001","NFR-002","AC-007","AC-008","AC-009"],"files":["src/agents/profile.ts","src/agents/read.ts"],"commands":[{"run":"npx vitest run tests/agents-read.test.ts","exit":0}]} -->

- [x] T016 [CODE] [US-001] Implementar o diagnóstico só-leitura em src/agents/diagnose.ts e compô-lo no relatório de src/doctor.ts — Refs: US-001, FR-004, NFR-001, NFR-002, AC-010, AC-011, AC-012 — Depends: T010, T011, T012
  - [x] **PREP**: Confirmar RED de T010/T011/T012 e o padrão só-leitura de `src/extensions/diagnose.ts`.
  - [x] **EXECUTE**: `diagnoseAgents` devolvendo as divergências sem escrever nada, e `doctor.ts` compondo-as no relatório com código de saída diferente de zero quando houver alguma. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/agents-doctor.test.ts` — AC-010, AC-011 e AC-012 **GREEN**; verificado também no binário real: `maestro doctor` imprime `agent profile: maestro: instruction.behavior — arquivo não encontrado: ...` e sai com 1, e volta a 0 com a config restaurada.
  - [x] **VISUAL**: Não aplicável — relatório de terminal já existente, sem superfície visual nova.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados nas seções 11–13.
  - [x] **IMPROVE**: **Achado grave, corrigido**: o teste original afirmava sobre `diagnoseAgents()` e passava enquanto o relatório do CLI saía silencioso — o `exitCode` virava 1 sem dizer por quê. É o mesmo modo de falha que reabriu a `SPEC-0005` duas vezes (testar a forma, não o uso real). O caso foi reescrito para exercitar `renderReport`, e a linha do perfil foi ligada em `src/cli.ts`.
  <!-- framework:evidence {"task":"T016","refs":["US-001","FR-004","NFR-001","NFR-002","AC-010","AC-011","AC-012"],"files":["src/agents/diagnose.ts","src/doctor.ts"],"commands":[{"run":"npx vitest run tests/agents-doctor.test.ts","exit":0}]} -->

**Checkpoint**: um `setup` num projeto novo produz `.maestro/config.yaml` com a seção `maestro:` e os arquivos referenciados em `.maestro/subagents/maestro/`; apagar um deles faz o `doctor` relatar e sair com código diferente de zero.

#### Fase final — Documentação e qualidade

- [x] T017 [DOC] [US-001] Registrar a seção nova do schema de configuração em .project-context/STACK.md e revisar PROJECT.md quanto à capacidade nova — Refs: US-001, FR-001, FR-002, AC-001, AC-004 — Depends: T013, T014, T015, T016
  - [x] **PREP**: Confirmar T013–T016 GREEN e o conteúdo atual de `.project-context/STACK.md` e `PROJECT.md`.
  - [x] **EXECUTE**: Acrescentar a seção `maestro:` do schema em `.project-context/STACK.md` e registrar em `PROJECT.md` a capacidade nova (perfis de agente configuráveis); se não houver impacto material em `PROJECT.md`, registrar a justificativa na evidência em vez de criar conteúdo artificial.
  - [x] **VERIFY**: `build_documentation.mjs --project . --check` limpo; `docs/` reconstruído. `monitor_context.mjs --check` fica `PENDING` em três itens, todos justificados aqui em vez de contornados: (1) `.project-context/PACKAGES.md` — o monitor sinaliza porque `package.json`/`package-lock.json` mudaram, mas `git diff` mostra que a única mudança foi a versão do próprio pacote (`2.0.0` → `2.1.2`); nenhuma dependência entrou, saiu ou mudou de versão, então o inventário não tem o que registrar. (2) `PROJECT.md` — revisado de fato, com a capacidade nova descrita e a seção "O que ainda não existe" corrigida. (3) `.project-context/RULES.md` — `AGENTS.md`/`CLAUDE.md` mudaram porque a execução real do `setup` regravou os blocos do roteador com as âncoras `maestro:`; é efeito mecânico da renomeação já entregue, não regra nova confirmada. `.project-context/STACK.md` ganhou a seção "Perfis de agente configuráveis" e `PROJECT.md` registrou a capacidade nova, além de corrigir "O que ainda não existe" para dizer que os perfis são lidos e validados, mas nada os executa.
  - [x] **VISUAL**: Não aplicável — documentação em Markdown, sem tela.
  - [x] **EVIDENCE**: Registrar comandos e resultado nas seções 11–13.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T018 [TEST] Regressão completa e rastreabilidade final sobre tests/agents-*.test.ts e a suíte inteira — Refs: US-001, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 — Depends: T013, T014, T015, T016, T017
  - [x] **PREP**: Identificar suites, checks e gates aplicáveis.
  - [x] **EXECUTE**: `npx vitest run` completo, `npx tsc --noEmit`, `check_traceability.mjs` e `verify_acceptance.mjs`.
  - [x] **VERIFY**: **449/449 testes** em 167 arquivos, `tsc` limpo, `Rastreabilidade: 19/19 IDs cobertos`, `QA: PASSED`. Verificado também fora da suíte: `maestro setup` real neste projeto criou `.maestro/` do zero (config com a seção `maestro:` e os dois arquivos semeados) partindo de um projeto sem `.common-rules/` nem `.maestro/`.
  - [x] **VISUAL**: Não aplicável — repasse final sem superfície visual própria.
  - [x] **EVIDENCE**: Registrar contagens e comandos finais nas seções 11–13.
  - [x] **IMPROVE**: Retrospectiva: o único defeito real desta fatia (relatório silencioso do `doctor`) só apareceu ao rodar o binário de verdade, não na suíte — reforça que a verificação com o executável instalado precisa vir antes de declarar a tarefa pronta, não depois. Um segundo achado foi ambiental: `/tmp` encheu (7,5 GB, 5.978 diretórios de fixture acumulados) e derrubou 14 testes por `ENOSPC`, o que por um momento pareceu regressão do rename.

### 15. Ordem de execução

- Caminho crítico: T001–T012 (paralelas) → T013/T014/T015/T016 → T017 → T018.
- Tarefas paralelas: T001–T012 são independentes entre si (cada uma materializa um caso isolado). T013 e T015 tocam arquivos disjuntos e podem andar juntas; T014 depende de T013 na prática porque semeia as chaves que o schema declara, e T016 depende de T015 porque relata as divergências que o leitor expõe — essas duas ordens estão registradas na restrição abaixo em vez de escondidas no paralelismo.
- Restrição de sequenciamento (seção 15 original): a semeadura (`seed.ts`) exige os recursos versionados em `resources/agents/maestro/` já existentes, e o diagnóstico do `doctor` exige o leitor já expondo as divergências que ele relata.
- Estratégia de MVP: não aplicável no sentido de "menor história entregável" — é uma única história (US-001) e uma fatia parcial (por exemplo, schema sem leitor) não teria valor demonstrável: a fundação só serve às fatias seguintes do épico quando lê, valida e relata de ponta a ponta.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- `SPEC-0014` (renomeação para `maestro`) precisa estar entregue antes desta fatia, porque o caminho `.maestro/config.yaml` e o diretório `.maestro/subagents/` só existem depois dela. Enquanto `SPEC-0014` não for implementada, esta fatia não pode ir a GREEN.
- `SPEC-0012` (config.yaml sempre presente) — mecanismo de garantia de config reaproveitado, não substituído.

#### Riscos

- Schema muito rico entregue de uma vez pode revelar, nas fatias seguintes, que uma propriedade não serve como desenhada → mitigado por manter o formato `{ value, mode }` uniforme, que aceita acrescentar propriedade sem quebrar as existentes.
- `capability.skills` apontando para `.agents/skills/*` cria acoplamento com a instalação do former project tool → mitigado por tratar caminho inexistente como referência quebrada comum, sem lógica especial por origem da skill.
- **Lacuna de cobertura encontrada durante a implementação, não fechada aqui**: nada verifica que um recurso de fábrica respeita `language.default`. O defeito real aconteceu (recursos semeados em português num projeto `en_US`) e passou pela suíte inteira, porque nenhum `AC` cobre idioma de recurso semeado. Não foi criado um teste heurístico de detecção de idioma: daria falsa confiança. Fica como candidato explícito a uma fatia futura, provavelmente junto de decidir o que um projeto consumidor com `language.default` diferente de `en_US` deveria receber — hoje o pacote distribui um idioma só.

#### Suposições

- Os nomes de propriedade propostos (`context_budget`, `reasoning_effort`, `concurrency`, `runtime`) são defaults reversíveis desta especificação; renomeá-los antes da implementação não muda comportamento, só vocabulário.
- `resources/` é o lugar certo para os defaults de fábrica, por consistência com `resources/hooks/` e `resources/skills/` já existentes.

### 17. Decisões

- **DEC-001**: formato uniforme `{ value, mode }` em toda propriedade, sem forma curta alternativa — razão: uma única forma de escrever a mesma coisa elimina ambiguidade de parsing e de leitura humana; o custo é verbosidade. Alternativa descartada: valor simples significando `suggested` e objeto significando `required` (rodada 1).
- **DEC-002**: composição do agente em cinco grupos (`identity`, `cognition`, `instruction`, `capability`, `execution`) — razão: separa dimensões que mudam por motivos diferentes (o que o agente é, como pensa, como se comporta, o que pode fazer, como roda); `identity.description` existe especificamente para o planejamento (MA-2) ter critério de casamento perfil↔tarefa.
- **DEC-003**: `behavior` e `additional_behavior` como chaves separadas (substituir vs somar) em vez de um campo `apply` dentro de uma única chave — razão: a distinção é semântica o bastante para merecer nome próprio, e evita um terceiro campo que só existiria para uma propriedade (rodada 3).
- **DEC-004**: sementes de fábrica são arquivos livres da pessoa, fora do checksum da `SPEC-0011` — razão: comportamento de agente é exatamente o que se espera que a pessoa edite; tratá-lo como artefato gerenciado transformaria uso legítimo em divergência (rodada 6).
- **DEC-005**: herança entre perfis (`extends`) fica fora desta fatia — razão: pode ser acrescentada depois como propriedade opcional sem quebrar o schema, e incluí-la agora ampliaria a fatia fundacional sem necessidade comprovada. Registrado como decisão adiada, não rejeitada.
- **DEC-006**: configuração apenas por projeto, sem camada `~/.maestro/` — razão: consistente com `PR-004` (nada fora da raiz do projeto) e com o objetivo de duas máquinas nunca divergirem em silêncio (rodada 8).

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Os cenários `AC-001` a `AC-012` passam.
- [x] `FR-001` a `FR-004` e `NFR-001`/`NFR-002` têm evidência de verificação nas seções 11–12.
- [x] Todas as tarefas da seção 14 estão concluídas — 18/18, 108/108 itens.
- [x] `.project-context/STACK.md` registra a seção nova do schema de configuração.
- [x] `PROJECT.md` revisado quanto à capacidade nova (perfis de agente configuráveis), inclusive corrigindo "O que ainda não existe".
