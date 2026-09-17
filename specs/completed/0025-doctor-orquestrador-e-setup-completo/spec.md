# Especificação integrada: Doctor orquestrador e critério de setup completo: instalado e configurado

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0025 |
| Slug | 0025-doctor-orquestrador-e-setup-completo |
| Status | Complete |
| Effort | 6 |
| Effort updated at | 2026-09-17 |
| Effort rationale | Perfil `standard` alto: nova camada de diagnóstico (função pura de layout esperado, seis checagens, quatro sub-doctors por subprocesso com timeout), mudança de critério do hook `setup-check`, README/relatório do setup e remoção do short-circuit dos instaladores; sem interface, banco ou framework novo. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não |
| Atualizada em | 2026-09-17 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

"Setup completo" no maestro significa só que `.maestro/install.json` e `.specsfy/` existem. Nada verifica se as skills conversacionais que configuram o projeto (`specsfy-setup`, que cria `PROJECT.md`, `.specsfy/STACK.md`, `RULES.md`, `USER-PROFILE.md`; `setup-matt-pocock-skills`) foram executadas, e nenhum canal — hook, README gerado, relatório do `setup` — orienta a executá-las (relato do usuário em `../dev-bootstrap`). O short-circuit "já configurado" pula os instaladores de skills e do Specsfy mesmo com instalação parcial. O `maestro doctor` não consulta os diagnósticos dos subsistemas (`specsfy doctor`, `context-mode doctor`, `skills list`, `code-review-graph status`) nem valida o que as SPEC-0022/0023/0024 passaram a garantir: matchers dos hooks, scripts presentes, direção dos blocos, marcadores sem par (FIND-INT-004), projeções divergentes, cobertura entre hooks e regras-fallback.

#### Resultado desejado

"Configurado" passa a significar instalado **e** com os rastros do `specsfy-setup` **e** com os blocos esperados em `AGENTS.md`/`CLAUDE.md`. O hook `setup-check` diz exatamente o que falta e quais skills executar, e fica em silêncio quando tudo está presente; README gerado e relatório do `setup` orientam os passos seguintes. Os instaladores rodam a cada `setup` (são idempotentes); o short-circuit só evita nova aprovação. `maestro doctor` orquestra os sub-doctors reais e adiciona a camada do maestro, derivando o layout esperado de uma função pura compartilhada com o `setup`; só reporta, sai com código ≠0 em `FAIL` e usa `WARN` para pendências que só o agente resolve.

#### Métricas de sucesso

- Projeto com `.specsfy/` mas sem `PROJECT.md`: o `SessionStart` injeta uma mensagem citando `/specsfy-setup`; projeto completo: stdout vazio — verificável por execução do script.
- `.agents/skills` apagado após um setup: o segundo `setup` reinstala sem nova pergunta de aprovação — verificável por teste com executor contado.
- `maestro doctor` num projeto com hook de matcher inválido, bloco na direção antiga ou marcador sem par: item `FAIL` e exit ≠0; sem rastros do `specsfy-setup`: `WARN` e exit 0 — verificável por fixtures.
- Sub-doctor ausente ou em timeout não impede os demais e aparece como `ABSENT`/`FAIL` do subsistema — verificável com executores falsos.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] Os quatro sub-doctors existem como comandos de subprocesso e nenhum verifica se as skills conversacionais foram executadas — Verdict: verified — Confidence: high — Evidence: research/sub-doctors-e-rastros.md#sub-doctors — Budget: 1/3
  - Execução local dos CLIs em 2026-09-17.
- **R-002** [critical] "Configurado" só é derivável dos rastros das skills conversacionais mais os blocos esperados — Verdict: verified — Confidence: high — Evidence: research/sub-doctors-e-rastros.md#rastros-que-as-skills-conversacionais-deixam — Budget: 1/3
  - Rastros lidos das skills instaladas e das SPEC-0024.
- **R-003** [high] O doctor atual não cobre hooks, blocos, projeções nem rastros — Verdict: verified — Confidence: high — Evidence: research/sub-doctors-e-rastros.md#doctor-atual-do-maestro — Budget: 1/3
  - `src/doctor.ts` lido em 2026-09-17.

#### Fontes e contexto consultados

- `src/doctor.ts`, `src/cli.ts` (`formatReport`/`renderReport`), `src/setup/run.ts` (short-circuit `alreadyDone`, aprovação), `src/setup/readme.ts`, `resources/hooks/setup-check.md`, `src/extensions/diagnose.ts`, `src/extensions/instructions.ts`, `src/skills/project.ts`, `src/hooks/identity.ts`.
- SPEC-0022/0023/0024 (o que o doctor passa a verificar); SPEC-0021 (`Planned`: checagens de documentação no doctor, a não duplicar).
- `specs/backlog/0013-doctor-orquestrador-e-criterio-de-setup-completo-instalado-e-configurado.md` — brief promovido; Inbox `2026-09-17-105213-…`.
- `findings/internal/FIND-INT-003`, `FIND-INT-004`; `findings/external/FIND-EXT-001`.
- Decisões do usuário em 2026-09-17 (grill Q6–Q8, Q15–Q16; resposta sobre doctors em camadas).

#### Documentação consultada

- Saída de `--help`/execução dos CLIs `specsfy`, `context-mode`, `skills` e `code-review-graph` instalados (local).

#### Artefatos de pesquisa armazenados

- `specs/completed/0025-doctor-orquestrador-e-setup-completo/research/sub-doctors-e-rastros.md`: tabela de sub-doctors, rastros e cobertura do doctor atual (R-001 a R-003).

#### Dúvidas respondidas

- **Q**: O que é "setup completo"? → **A**: instalado + rastros do `specsfy-setup` + blocos esperados (Q6).
- **Q**: Quem dispara as skills conversacionais? → **A**: `SessionStart` injeta a instrução; README e relatório dizem o mesmo (Q7).
- **Q**: Instalação malfeita? → **A**: instaladores rodam sempre; short-circuit só para aprovação (Q8).
- **Q**: Doctor repara? → **A**: não; só reporta; `FAIL` → exit ≠0, `WARN` para pendências do agente (Q15).
- **Q**: Como o doctor antecipa a normalização do maestro? → **A**: função pura `expectedLayout` compartilhada com o `setup`, sem estado gravado como verdade (Q16).
- **Q**: Como orquestrar os sub-doctors? → **A**: subprocesso com timeout, cada um com status próprio, sem abortar os demais (resposta do usuário sobre "doctors em camadas").

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- `src/setup/layout.ts`: `expectedLayout(root)` (pura) e `assessConfiguration(root)` → rastros, blocos e hooks esperados vs presentes.
- `setup-check` reescrito com o critério novo e mensagem que lista o que falta e as skills a executar.
- README gerado e relatório do `setup` com os passos seguintes.
- Instaladores sem short-circuit; aprovação continua memorizada.
- `src/doctor/subsystems.ts`: sub-doctors por executor injetável com timeout; status `OK`/`FAIL`/`ABSENT`.
- `src/doctor/maestro.ts`: checagens de hooks, blocos, marcadores sem par, conteúdo não padronizado, projeções, rastros, cobertura hook ↔ regra.
- `Report` e renderização do `doctor` com seções por camada e níveis `FAIL`/`WARN`/`OK`.

#### Fora de escopo

- `doctor --fix` (o `setup` repara).
- Executar skills conversacionais.
- Checagens de documentação (SPEC-0021, `Planned`) — o doctor desta spec não usa o `--check` do documentator como sinal.
- Mudanças nos sub-doctors upstream.

#### Atores

- **Pessoa que roda `maestro setup`/`doctor`** em projeto consumidor.
- **Agente no Claude Code**: recebe a instrução do `SessionStart` e executa as skills.
- **`maestro doctor`**: processo read-only.

### 4. Princípios e restrições do projeto

- **PR-001**: O doctor nunca escreve; o `setup` é o único reparador.
- **PR-002**: Layout esperado derivado por função pura; nenhum arquivo de estado é a verdade.
- **PR-003**: Sub-doctor é executado com timeout e nunca aborta os demais.
- **PR-004**: `FAIL` = defeito que o `setup` corrige ou dependência ausente; `WARN` = pendência que só o agente/pessoa resolve (configuração conversacional) ou conteúdo não padronizado.
- **PR-005**: O maestro instala somente no projeto atual.

### 5. Histórias de usuário

#### US-001 — Setup completo significa configurado (P1)

Como pessoa que instala o maestro num projeto, quero que "setup completo" inclua a configuração conversacional e que o agente seja orientado a executá-la, para não descobrir depois que `PROJECT.md` e `STACK.md` nunca existiram.

**Por que P1**: origem do relato (FIND-INT-003).
**Teste independente**: executar `setup-check.sh` em fixtures com e sem rastros; inspecionar README e relatório.
**Requisitos**: FR-001, FR-002, FR-003

#### US-002 — Instaladores confiáveis a cada setup (P2)

Como pessoa que teve uma instalação parcial, quero que `maestro setup` reinstale o que falta sem perguntar de novo o que já aprovei, para que o comando seja de reconciliação.

**Por que P2**: já mitigado em parte pela SPEC-0022 (scripts ausentes forçam reexecução); falta skills/Specsfy.
**Teste independente**: executores contados em dois `setup` consecutivos, com e sem apagamento de `.agents/skills`.
**Requisitos**: FR-004

#### US-003 — Doctor orquestrador (P1)

Como mantenedor, quero que `maestro doctor` rode os diagnósticos dos subsistemas e verifique o que o maestro garante (hooks, blocos, projeções, rastros, regras), para descobrir num comando o que está inerte ou fora do padrão.

**Por que P1**: sem isso as garantias das SPEC-0022/0023/0024 não são verificáveis.
**Teste independente**: `inspectDependencies` com executores falsos e fixtures de projeto.
**Requisitos**: FR-005, FR-006, FR-007, FR-008

### 6. Cenários BDD de aceite

#### AC-001 — SessionStart orienta quando faltam rastros

**Cobre**: US-001, FR-001, FR-002, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @NFR-001 @AC-001
Feature: Setup completo significa configurado

  Scenario: instalado mas não configurado
    Given uma raiz com .maestro/install.json, .specsfy/ e sem PROJECT.md nem .specsfy/STACK.md
    When setup-check.sh recebe um evento SessionStart
    Then stdout cita "/specsfy-setup" e lista PROJECT.md e .specsfy/STACK.md como ausentes
    And o exit é 0
```

#### AC-002 — SessionStart silencioso quando completo

**Cobre**: US-001, FR-001, FR-002, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @NFR-001 @AC-002
Feature: Silêncio no caminho feliz

  Scenario: projeto configurado
    Given uma raiz com install.json, .specsfy/, PROJECT.md, .specsfy/STACK.md, RULES.md, USER-PROFILE.md, AGENTS.md com o bloco router e CLAUDE.md com o bloco agents-import
    When setup-check.sh recebe um evento SessionStart
    Then stdout é vazio e o exit é 0
```

#### AC-003 — SessionStart cita a skill do matt-pocock quando falta a seção

**Cobre**: US-001, FR-001, FR-002

```gherkin
@US-001 @FR-001 @FR-002 @AC-003
Feature: Skills conversacionais orientadas

  Scenario: rastros do Specsfy presentes, seção Agent skills ausente
    Given uma raiz configurada pelo specsfy-setup e sem "## Agent skills" em AGENTS.md
    When setup-check.sh recebe um evento SessionStart
    Then stdout cita "/setup-matt-pocock-skills" e não cita "/specsfy-setup"
```

#### AC-004 — README gerado e relatório do setup orientam os próximos passos

**Cobre**: US-001, FR-003, NFR-003

```gherkin
@US-001 @FR-003 @NFR-003 @AC-004
Feature: Comunicação

  Scenario: primeiro setup
    Given uma raiz sem README.md
    When maestro setup roda
    Then o relatório termina com uma linha "next: run /specsfy-setup and /setup-matt-pocock-skills in your agent"
    And o README.md gerado contém a mesma orientação
```

#### AC-005 — Relatório não repete a orientação quando já configurado

**Cobre**: US-001, FR-003, FR-001, NFR-003

```gherkin
@US-001 @FR-003 @FR-001 @NFR-003 @AC-005
Feature: Orientação só quando necessária

  Scenario: projeto já configurado
    Given uma raiz com todos os rastros e a seção Agent skills
    When maestro setup roda
    Then o relatório não contém "next: run"
```

#### AC-006 — Instaladores rodam no segundo setup sem nova aprovação

**Cobre**: US-002, FR-004, NFR-002

```gherkin
@US-002 @FR-004 @NFR-002 @AC-006
Feature: Reconciliação

  Scenario: .agents/skills apagado
    Given um setup concluído com executores de skills e Specsfy contados e aprovação registrada
    And .agents/skills apagado
    When maestro setup roda de novo com fonte de aprovação que recusaria
    Then os executores de skills e Specsfy são invocados
    And a fonte de aprovação não é consultada
```

#### AC-007 — Segundo setup sem mudança também invoca os instaladores, sem escrita desnecessária

**Cobre**: US-002, FR-004, NFR-002

```gherkin
@US-002 @FR-004 @NFR-002 @AC-007
Feature: Idempotência dos instaladores

  Scenario: nada mudou
    Given um setup concluído
    When maestro setup roda de novo
    Then os executores são invocados uma vez cada
    And settings.json, extensions.json e os scripts permanecem byte a byte iguais
    And o relatório diz que hooks estão inalterados
```

#### AC-008 — Instalador falhando não bloqueia o restante e é reportado

**Cobre**: US-002, FR-004, NFR-002

```gherkin
@US-002 @FR-004 @NFR-002 @AC-008
Feature: Falha isolada

  Scenario: Specsfy recusa por alterações locais
    Given um executor do Specsfy que devolve status 1 com razão
    When maestro setup roda
    Then hooks e blocos são instalados
    And o relatório contém a razão do instalador
```

#### AC-009 — Sub-doctors executados com status próprio

**Cobre**: US-003, FR-005, NFR-002

```gherkin
@US-003 @FR-005 @NFR-002 @AC-009
Feature: Doctor orquestrador

  Scenario: quatro subsistemas
    Given executores falsos: specsfy OK, context-mode FAIL, skills OK, code-review-graph ausente
    When maestro doctor roda
    Then o relatório lista specsfy OK, context-mode FAIL, skills OK e code-review-graph ABSENT
    And o exit é 1
```

#### AC-010 — Sub-doctor em timeout não aborta os demais

**Cobre**: US-003, FR-005, NFR-002

```gherkin
@US-003 @FR-005 @NFR-002 @AC-010
Feature: Tolerância

  Scenario: timeout
    Given um executor de context-mode que devolve timeout
    When maestro doctor roda
    Then context-mode aparece como FAIL com "timeout"
    And os outros três subsistemas aparecem com seus status
```

#### AC-011 — Todos os sub-doctors OK não alteram o exit

**Cobre**: US-003, FR-005, FR-008

```gherkin
@US-003 @FR-005 @FR-008 @AC-011
Feature: Caminho feliz

  Scenario: tudo OK
    Given executores falsos todos OK e um projeto configurado
    When maestro doctor roda
    Then o exit é 0
```

#### AC-012 — Hook com matcher inválido ou script ausente é FAIL

**Cobre**: US-003, FR-006, FR-008

```gherkin
@US-003 @FR-006 @FR-008 @AC-012
Feature: Camada maestro — hooks

  Scenario: entrada legada e script apagado
    Given um settings.json com uma entrada no formato inline antigo e um script de .maestro/hooks/ apagado
    When maestro doctor roda
    Then há um FAIL "hooks" citando a entrada legada e o script ausente
    And o exit é 1
```

#### AC-013 — Bloco na direção antiga ou marcador sem par é FAIL; conteúdo não padronizado é WARN

**Cobre**: US-003, FR-006, FR-007, FR-008

```gherkin
@US-003 @FR-006 @FR-007 @FR-008 @AC-013
Feature: Camada maestro — instruções

  Scenario: três desvios
    Given CLAUDE.md com o bloco router (direção antiga), um marcador "<!-- common-rules:extension:router:start -->" sem par e uma seção "## Minhas notas"
    When maestro doctor roda
    Then há FAIL para a direção antiga e para o marcador sem par
    And há WARN "conteúdo não padronizado em CLAUDE.md: ## Minhas notas"
```

#### AC-014 — Rastros ausentes são WARN com a skill a executar; exit 0

**Cobre**: US-003, FR-006, FR-008, NFR-001

```gherkin
@US-003 @FR-006 @FR-008 @NFR-001 @AC-014
Feature: Camada maestro — configuração

  Scenario: sem PROJECT.md
    Given um projeto instalado sem PROJECT.md e com todos os hooks e blocos corretos
    When maestro doctor roda
    Then há WARN citando PROJECT.md e "/specsfy-setup"
    And o exit é 0
```

#### AC-015 — Projeção divergente e cobertura hook ↔ regra

**Cobre**: US-003, FR-006, FR-007

```gherkin
@US-003 @FR-006 @FR-007 @AC-015
Feature: Camada maestro — projeções e regras

  Scenario: cópia editada e hook citado na regra ausente
    Given uma projeção registrada cuja cópia em .claude/skills foi editada
    And o bloco hooks-fallback citando guard-docs com o script guard-docs.sh apagado
    When maestro doctor roda
    Then há WARN "projeção divergente: <nome>"
    And há FAIL "regra-fallback aponta hook ausente: guard-docs"
```

#### AC-016 — Layout esperado é a mesma função no setup e no doctor

**Cobre**: US-003, FR-007, NFR-001

```gherkin
@US-003 @FR-007 @NFR-001 @AC-016
Feature: Função pura

  Scenario: sem estado gravado
    Given uma raiz onde maestro setup acabou de rodar
    When expectedLayout(root) é comparado com o disco por assessConfiguration(root)
    Then nenhum FAIL e nenhum WARN de hooks, blocos ou projeções
    And expectedLayout não lê .maestro/install.json
```

#### AC-017 — Doctor nunca escreve

**Cobre**: US-003, FR-008, NFR-001

```gherkin
@US-003 @FR-008 @NFR-001 @AC-017
Feature: Read-only

  Scenario: projeto com todos os desvios
    Given uma raiz com entrada legada, bloco na direção antiga, projeção divergente e sem rastros
    When maestro doctor roda
    Then nenhum arquivo da raiz muda (hash antes = hash depois)
```

#### AC-018 — Nível WARN não altera o exit; qualquer FAIL altera

**Cobre**: US-003, FR-008, NFR-002

```gherkin
@US-003 @FR-008 @NFR-002 @AC-018
Feature: Semântica do exit

  Scenario: só WARN e depois um FAIL
    Given um projeto com apenas conteúdo não padronizado em CLAUDE.md
    When maestro doctor roda
    Then o exit é 0
    Given o mesmo projeto com um script de hook apagado
    When maestro doctor roda
    Then o exit é 1
```

#### AC-019 — A linha `next:` cita só a skill que falta, nunca as duas quando só uma está pendente

**Cobre**: US-001, FR-003, NFR-003

```gherkin
@US-001 @FR-003 @NFR-003 @AC-019
Feature: Orientação mínima no relatório

  Scenario: só falta o matt-pocock
    Given uma raiz com PROJECT.md, .specsfy/STACK.md, .specsfy/RULES.md, .specsfy/USER-PROFILE.md presentes e sem a seção "## Agent skills" em AGENTS.md
    When maestro setup roda
    Then o relatório contém "next: run /setup-matt-pocock-skills in your agent"
    And o relatório não contém "/specsfy-setup"
```

### 7. Requisitos

#### Funcionais

- **FR-001**: `expectedLayout(root)`/`assessConfiguration(root)` devem definir "configurado" como: `.maestro/install.json` e `.specsfy/` presentes; rastros do `specsfy-setup` (`PROJECT.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/USER-PROFILE.md`); bloco `router` em `AGENTS.md` e `agents-import` em `CLAUDE.md` (target Claude Code); seção `## Agent skills` em `AGENTS.md` como rastro do `setup-matt-pocock-skills`.
- **FR-002**: `setup-check` (`session-start`) deve listar os itens ausentes e citar `/specsfy-setup` quando faltarem rastros do Specsfy e `/setup-matt-pocock-skills` quando faltar a seção; stdout vazio quando tudo estiver presente; nunca bloqueia.
- **FR-003**: O relatório do `setup` deve terminar com `next: run /specsfy-setup and /setup-matt-pocock-skills in your agent` (só as que faltam) quando a configuração estiver incompleta, e o README gerado deve conter a mesma orientação.
- **FR-004**: `runSetup` deve invocar os instaladores de skills e Specsfy em toda execução com executores configurados, usando o registro de aprovação para não perguntar de novo; falha de um instalador é relatada com a razão e não impede hooks e blocos; sem mudanças, arquivos gerenciados permanecem idênticos.
- **FR-005**: `maestro doctor` deve executar `specsfy doctor --project <raiz>`, `context-mode doctor`, `skills list` e `code-review-graph status` via executor injetável com timeout, reportando cada um como `OK`, `FAIL` (com motivo, inclusive `timeout`) ou `ABSENT`, sem abortar os demais.
- **FR-006**: A camada maestro do doctor deve verificar: entradas legadas e scripts ausentes em `.maestro/hooks/` (`FAIL`); blocos do maestro em `CLAUDE.md` (direção antiga) e marcadores `<!-- …:start -->` sem par (`FAIL`); seções de nível 2 em `CLAUDE.md` fora de blocos conhecidos (`WARN`); projeções cuja cópia difere do registrado (`WARN`); rastros de configuração ausentes (`WARN` com a skill); hooks citados no bloco `hooks-fallback` sem script instalado (`FAIL`).
- **FR-007**: O layout esperado deve vir de uma função pura compartilhada por `setup` e `doctor`, sem ler `install.json` como verdade.
- **FR-008**: O doctor deve ser read-only; exit ≠0 se houver qualquer `FAIL` (dependência, sub-doctor, camada maestro); `WARN` não altera o exit.

#### Não funcionais

- **NFR-001**: Silêncio e read-only — `setup-check` sem stdout quando completo; doctor não altera nenhum arquivo. **Verificação**: hash da raiz antes/depois; stdout vazio.
- **NFR-002**: Tolerância — sub-doctor ausente, em falha ou timeout e instalador falhando nunca interrompem o restante. **Verificação**: executores falsos.
- **NFR-003**: Orientação mínima — a linha `next:` aparece só quando há pendência e cita só as skills que faltam. **Verificação**: teste sobre o relatório.

#### Erros e casos-limite

- Sem `git`/sub-doctor no `PATH` → `ABSENT`.
- `settings.json` inválido → `FAIL` hooks.
- Target Antigravity → checagem de `CLAUDE.md` e projeções não se aplica.
- `install.json` ausente → doctor reporta "setup nunca executado" como `FAIL` único da camada maestro.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

Doctor em `src/doctor.ts` (`inspectDependencies`, `Report`, `defaultEnvironment`), renderização em `src/cli.ts`; setup em `src/setup/run.ts` (short-circuit `alreadyDone`, `partitionByApproval`); hooks/blocos/projeções das SPEC-0022–0024; `setup-check` como script.

#### Arquitetura e módulos

- `src/setup/layout.ts` (novo): `expectedLayout(root, target)` → `{ hooks: string[]; blocks: {file, name}[]; traces: string[]; foreignSections: string[] }` (pura, a partir do corpus de hooks e das tabelas de blocos/assinaturas); `assessConfiguration(root, target)` → `{ missingTraces, missingBlocks, legacyEntries, missingScripts, wrongDirection, unpairedMarkers, unknownSections, divergentProjections, uncoveredFallbackHooks }`.
- `resources/hooks/setup-check.md`: fragmento em shell que reproduz o critério (lista de arquivos e blocos) e monta a mensagem com o que falta.
- `src/setup/readme.ts` e `run.ts`: linha `next:` no relatório; README com a orientação; remoção do gate `skillsAlreadyDone`/`specsfyAlreadyDone` do `alreadyDone` (mantido só para hooks/scripts), instaladores sempre chamados quando configurados.
- `src/doctor/subsystems.ts` (novo): `runSubsystemDoctors(executor)` com `SubsystemExecutor = (bin, args, timeoutMs) => { status | "absent" | "timeout", output }`.
- `src/doctor/maestro.ts` (novo): `diagnoseMaestro(root)` usando `assessConfiguration`; níveis `FAIL`/`WARN`.
- `src/doctor.ts`: `Report` ganha `subsystems`, `maestro`; `exitCode` inclui `FAIL`s; `src/cli.ts` renderiza por camada.

#### Migrations

- Não aplicável.

#### Models

- `SubsystemResult { name, status: "OK"|"FAIL"|"ABSENT", detail }`; `MaestroFinding { level: "FAIL"|"WARN", area, message }`.

#### Controllers e casos de uso

- `inspectDependencies(env, root, …, subsystems?)`; `runSetup` (instaladores sempre; `next:`).

#### Views e experiência

- Não aplicável.

#### Queries e repositórios

- Leitura de `settings.json`, `.maestro/*`, `AGENTS.md`, `CLAUDE.md`, diretórios de skills.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/completed/0025-doctor-orquestrador-e-setup-completo/{spec.md,research/sub-doctors-e-rastros.md}
src/setup/layout.ts (novo)   src/doctor/subsystems.ts (novo)   src/doctor/maestro.ts (novo)
src/doctor.ts   src/cli.ts   src/setup/run.ts   src/setup/readme.ts   resources/hooks/setup-check.md
tests/setup-check-configured.test.ts   tests/setup-next-steps.test.ts   tests/setup-installers-always.test.ts
tests/doctor-subsystems.test.ts   tests/doctor-maestro-layer.test.ts
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Layout esperado | derivado | hooks, blocos, rastros, seções foreign | função pura de corpus + tabelas |
| Achado do doctor | `area` + `message` | `level` FAIL/WARN | compõe `Report.maestro` |
| Resultado de subsistema | `name` | `status`, `detail` | compõe `Report.subsystems` |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Projeto | instalado | rastros + blocos presentes | configurado | derivado, nunca gravado |

#### Migração e retenção

- Não aplicável.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não. Saída textual de `doctor`/`setup` e mensagem de hook.

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

| Tela | Bloco React | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| Não aplicável | — | — | — | — | — | — |

- Não aplicável: sem interface.

#### Estados e acessibilidade

- Não aplicável.

#### Contrato CRUD

- Não aplicável.

#### Revisão visual durante o desenvolvimento

- Não aplicável em todas as tarefas: nenhum artefato é renderizado para uma pessoa.

#### APIs expostas

- `expectedLayout`, `assessConfiguration`, `runSubsystemDoctors`, `diagnoseMaestro`; `Report.subsystems`, `Report.maestro`.

#### APIs externas utilizadas

- CLIs locais: `specsfy doctor`, `context-mode doctor`, `skills list`, `code-review-graph status` (timeout 20 s cada); sem rede.

#### Documentação das APIs consultadas

- `--help` dos CLIs (research).

#### Eventos e outros contratos

- `SessionStart`: stdout = contexto injetado (vazio no caminho feliz).

### 11. Estratégia TDD

- **Unidade**: `expectedLayout`, `assessConfiguration`, `diagnoseMaestro`, `runSubsystemDoctors` com executores falsos.
- **Integração/contrato**: `runSetup` com executores contados; execução real de `setup-check.sh`; `inspectDependencies` completo em fixtures; hash da raiz antes/depois do doctor.
- **BDD/aceite**: AC-001 a AC-018, um caso por AC.
- **Runner TDD**: Vitest.
- **E2E**: Não aplicável.
- **Verificação manual**: `maestro doctor` neste repositório após o GREEN.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, FR-002, NFR-001, AC-001 | AC-001 na seção 6 | caso 1 em tests/setup-check-configured.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-001, FR-001, FR-002, NFR-001, AC-002 | AC-002 na seção 6 | caso 2 em tests/setup-check-configured.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-001, FR-001, FR-002, AC-003 | AC-003 na seção 6 | caso 3 em tests/setup-check-configured.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-001, FR-003, NFR-003, AC-004 | AC-004 na seção 6 | caso 1 em tests/setup-next-steps.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-001, FR-003, FR-001, AC-005 | AC-005 na seção 6 | caso 2 em tests/setup-next-steps.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-002, FR-004, NFR-002, AC-006 | AC-006 na seção 6 | caso 1 em tests/setup-installers-always.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-002, FR-004, NFR-002, AC-007 | AC-007 na seção 6 | caso 2 em tests/setup-installers-always.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-002, FR-004, NFR-002, AC-008 | AC-008 na seção 6 | caso 3 em tests/setup-installers-always.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-003, FR-005, NFR-002, AC-009 | AC-009 na seção 6 | caso 1 em tests/doctor-subsystems.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-003, FR-005, NFR-002, AC-010 | AC-010 na seção 6 | caso 2 em tests/doctor-subsystems.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-003, FR-005, FR-008, AC-011 | AC-011 na seção 6 | caso 3 em tests/doctor-subsystems.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-003, FR-006, FR-008, AC-012 | AC-012 na seção 6 | caso 1 em tests/doctor-maestro-layer.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-003, FR-006, FR-007, FR-008, AC-013 | AC-013 na seção 6 | caso 2 em tests/doctor-maestro-layer.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-003, FR-006, FR-008, NFR-001, AC-014 | AC-014 na seção 6 | caso 3 em tests/doctor-maestro-layer.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-003, FR-006, FR-007, AC-015 | AC-015 na seção 6 | caso 4 em tests/doctor-maestro-layer.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-003, FR-007, NFR-001, AC-016 | AC-016 na seção 6 | caso 5 em tests/doctor-maestro-layer.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-003, FR-008, NFR-001, AC-017 | AC-017 na seção 6 | caso 6 em tests/doctor-maestro-layer.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-003, FR-008, NFR-002, AC-018 | AC-018 na seção 6 | caso 7 em tests/doctor-maestro-layer.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |
| US-001, FR-003, NFR-003, AC-019 | AC-019 na seção 6 | caso 3 em tests/setup-next-steps.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17 (verificado por remoção temporária dos módulos novos) | GREEN 2026-09-17 | Regressão: 619/630 focal + doctor/setup real verificados no dist compilado |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Integração | tests/setup-check-configured.test.ts | Passed (2026-09-17) |
| FR-001 | AC-002 | Integração | tests/setup-check-configured.test.ts | Passed (2026-09-17) |
| FR-001 | AC-003 | Integração | tests/setup-check-configured.test.ts | Passed (2026-09-17) |
| FR-001 | AC-005 | Integração | tests/setup-next-steps.test.ts | Passed (2026-09-17) |
| FR-002 | AC-001 | Integração | tests/setup-check-configured.test.ts | Passed (2026-09-17) |
| FR-002 | AC-002 | Integração | tests/setup-check-configured.test.ts | Passed (2026-09-17) |
| FR-002 | AC-003 | Integração | tests/setup-check-configured.test.ts | Passed (2026-09-17) |
| FR-003 | AC-004 | Integração | tests/setup-next-steps.test.ts | Passed (2026-09-17) |
| FR-003 | AC-005 | Integração | tests/setup-next-steps.test.ts | Passed (2026-09-17) |
| FR-003 | AC-019 | Integração | tests/setup-next-steps.test.ts | Passed (2026-09-17) |
| FR-003 | AC-001 | Integração | tests/setup-check-configured.test.ts | Passed (2026-09-17) |
| FR-004 | AC-006 | Integração | tests/setup-installers-always.test.ts | Passed (2026-09-17) |
| FR-004 | AC-007 | Integração | tests/setup-installers-always.test.ts | Passed (2026-09-17) |
| FR-004 | AC-008 | Integração | tests/setup-installers-always.test.ts | Passed (2026-09-17) |
| FR-005 | AC-009 | Unidade | tests/doctor-subsystems.test.ts | Passed (2026-09-17) |
| FR-005 | AC-010 | Unidade | tests/doctor-subsystems.test.ts | Passed (2026-09-17) |
| FR-005 | AC-011 | Unidade | tests/doctor-subsystems.test.ts | Passed (2026-09-17) |
| FR-006 | AC-012 | Integração | tests/doctor-maestro-layer.test.ts | Passed (2026-09-17) |
| FR-006 | AC-013 | Integração | tests/doctor-maestro-layer.test.ts | Passed (2026-09-17) |
| FR-006 | AC-014 | Integração | tests/doctor-maestro-layer.test.ts | Passed (2026-09-17) |
| FR-006 | AC-015 | Integração | tests/doctor-maestro-layer.test.ts | Passed (2026-09-17) |
| FR-007 | AC-013 | Integração | tests/doctor-maestro-layer.test.ts | Passed (2026-09-17) |
| FR-007 | AC-015 | Integração | tests/doctor-maestro-layer.test.ts | Passed (2026-09-17) |
| FR-007 | AC-016 | Unidade | tests/doctor-maestro-layer.test.ts | Passed (2026-09-17) |
| FR-008 | AC-011 | Unidade | tests/doctor-subsystems.test.ts | Passed (2026-09-17) |
| FR-008 | AC-012 | Integração | tests/doctor-maestro-layer.test.ts | Passed (2026-09-17) |
| FR-008 | AC-014 | Integração | tests/doctor-maestro-layer.test.ts | Passed (2026-09-17) |
| FR-008 | AC-017 | Integração | tests/doctor-maestro-layer.test.ts | Passed (2026-09-17) |
| FR-008 | AC-018 | Integração | tests/doctor-maestro-layer.test.ts | Passed (2026-09-17) |
| NFR-001 | AC-002 | Integração | tests/setup-check-configured.test.ts | Passed (2026-09-17) |
| NFR-001 | AC-014 | Integração | tests/doctor-maestro-layer.test.ts | Passed (2026-09-17) |
| NFR-001 | AC-017 | Integração | tests/doctor-maestro-layer.test.ts | Passed (2026-09-17) |
| NFR-002 | AC-006 | Integração | tests/setup-installers-always.test.ts | Passed (2026-09-17) |
| NFR-002 | AC-009 | Unidade | tests/doctor-subsystems.test.ts | Passed (2026-09-17) |
| NFR-002 | AC-010 | Unidade | tests/doctor-subsystems.test.ts | Passed (2026-09-17) |
| NFR-003 | AC-004 | Integração | tests/setup-next-steps.test.ts | Passed (2026-09-17) |
| NFR-003 | AC-005 | Integração | tests/setup-next-steps.test.ts | Passed (2026-09-17) |
| NFR-003 | AC-019 | Integração | tests/setup-next-steps.test.ts | Passed (2026-09-17) |
| NFR-003 | AC-003 | Integração | tests/setup-check-configured.test.ts | Passed (2026-09-17) |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-09-17); aceite final em `review` (2026-09-17): entrega conferida contra cada AC/FR/NFR e a DoD; `maestro doctor` e `maestro setup` verificados de verdade no `dist/` compilado contra este repositório — spec movida para `completed`.
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/completed/0025-doctor-orquestrador-e-setup-completo/spec.md`
- **Achados**: estrutura VALID; research PASSED (R-001, R-002 critical verificados; R-003 high verificado); cobertura mínima atendida — 3 US, 8 FR, 3 NFR com ≥3 AC cada, 19 AC (ciclo 1 tag NFR-003 em AC-005 e criou AC-019 para fechar FR-003/NFR-003). Sem BLOCKER.
- **FIND-ARCH-001** [P2] [Resolved] `maestro doctor` e `maestro setup` precisam concordar byte a byte sobre o que é "esperado" (hooks, blocos, rastros) sem duplicar a lógica — Refs: FR-007, AC-016 — Evidence: src/setup/run.ts:1 — Effect: duas implementações divergentes fariam o doctor mentir sobre o que o setup acabou de instalar — Suggestion: resolvido por desenho: `expectedLayout`/`assessConfiguration` como função pura em `src/setup/layout.ts`, importada por `setup` e `doctor`; AC-016 prova a ausência de discrepância logo após um `setup`.
- **FIND-SEC-001** [P3] [Accepted] Rodar quatro sub-doctors por subprocesso a cada `maestro doctor` expande a superfície de execução de binários locais (`specsfy`, `context-mode`, `skills`, `code-review-graph`) — Refs: FR-005, AC-009 — Evidence: specs/completed/0025-doctor-orquestrador-e-setup-completo/research/sub-doctors-e-rastros.md:1 — Effect: mesmo risco que já existia em `maestro setup`/`doctor` chamando esses binários; nenhuma superfície nova é introduzida, só orquestração — Suggestion: aceito; timeout de 20s por sub-doctor (FR-005) já limita o impacto de um binário travado ou malicioso.
- **FIND-PROD-001** [P3] [Accepted] A tabela de rastros do `specsfy-setup` é fixa (`PROJECT.md`, `STACK.md`, `RULES.md`, `USER-PROFILE.md`); uma versão futura da skill que grave outros arquivos não é detectada — Refs: FR-001, AC-001 — Evidence: specs/completed/0025-doctor-orquestrador-e-setup-completo/research/sub-doctors-e-rastros.md:1 — Effect: falso "configurado" se o Specsfy mudar seus artefatos — Suggestion: aceito (mesmo padrão de tabela fixa já usado para blocos/assinaturas na SPEC-0024); revisão fica para quando o Specsfy upstream mudar de fato.

#### Gate do Ato II — Plano

- **Resultado**: Pending
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/completed/0025-doctor-orquestrador-e-setup-completo/spec.md`
- **Achados**: Pending.

#### Gate do Ato III — Entrega

- **Resultado**: Passed (2026-09-17)
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/completed/0025-doctor-orquestrador-e-setup-completo/spec.md . --full-chain`
- **Achados**: 28/28 tarefas concluídas; 19/19 AC verdes; dois defeitos reais encontrados e corrigidos rodando o binário compilado (`__dirname` em ESM, resolução de path de hooks divergentes no doctor); releases 2.1.26-2.1.29 (bumps para build e docs); `tsc` limpo; `npm run test:tdd` 619/630 com as 11 falhas do RED da SPEC-0021; `maestro doctor` real neste repositório passou de silencioso-mas-quebrado para `FAIL`/`WARN` corretos; findings FIND-INT-003/FIND-INT-004 arquivados.

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

Cada tarefa `[CODE]` grava no **PREP** um snapshot do `code-review-graph` (`status`) e no **VERIFY** roda `update --brief` + `detect-changes --base HEAD --brief`, registrando o delta na evidência; `docs/` só com `build_documentation.mjs --check` (FIND-EXT-001). Nenhuma tarefa tem superfície visual.

#### Fase 1 — RED TDD informado pelo BDD (um caso por `AC`)

- [x] T001 [TEST] [TDD] [US-001] Derivar de AC-001 um caso Vitest falhando em tests/setup-check-configured.test.ts — Refs: US-001, FR-001, FR-002, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Gherkin de AC-001 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-check-configured.test.ts com marcador `SPECSFY: … AC-001`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-check-configured` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T002 [TEST] [TDD] [US-001] Derivar de AC-002 um caso Vitest falhando em tests/setup-check-configured.test.ts — Refs: US-001, FR-001, FR-002, NFR-001, AC-002 — Depends: none
  - [x] **PREP**: Gherkin de AC-002 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-check-configured.test.ts com marcador `SPECSFY: … AC-002`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-check-configured` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T003 [TEST] [TDD] [US-001] Derivar de AC-003 um caso Vitest falhando em tests/setup-check-configured.test.ts — Refs: US-001, FR-001, FR-002, AC-003 — Depends: none
  - [x] **PREP**: Gherkin de AC-003 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-check-configured.test.ts com marcador `SPECSFY: … AC-003`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-check-configured` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T004 [TEST] [TDD] [US-001] Derivar de AC-004 um caso Vitest falhando em tests/setup-next-steps.test.ts — Refs: US-001, FR-003, NFR-003, AC-004 — Depends: none
  - [x] **PREP**: Gherkin de AC-004 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-next-steps.test.ts com marcador `SPECSFY: … AC-004`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-next-steps` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T005 [TEST] [TDD] [US-001] Derivar de AC-005 um caso Vitest falhando em tests/setup-next-steps.test.ts — Refs: US-001, FR-003, FR-001, NFR-003, AC-005 — Depends: none
  - [x] **PREP**: Gherkin de AC-005 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-next-steps.test.ts com marcador `SPECSFY: … AC-005`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-next-steps` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T006 [TEST] [TDD] [US-002] Derivar de AC-006 um caso Vitest falhando em tests/setup-installers-always.test.ts — Refs: US-002, FR-004, NFR-002, AC-006 — Depends: none
  - [x] **PREP**: Gherkin de AC-006 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-installers-always.test.ts com marcador `SPECSFY: … AC-006`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-installers-always` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T007 [TEST] [TDD] [US-002] Derivar de AC-007 um caso Vitest falhando em tests/setup-installers-always.test.ts — Refs: US-002, FR-004, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Gherkin de AC-007 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-installers-always.test.ts com marcador `SPECSFY: … AC-007`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-installers-always` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T008 [TEST] [TDD] [US-002] Derivar de AC-008 um caso Vitest falhando em tests/setup-installers-always.test.ts — Refs: US-002, FR-004, NFR-002, AC-008 — Depends: none
  - [x] **PREP**: Gherkin de AC-008 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-installers-always.test.ts com marcador `SPECSFY: … AC-008`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-installers-always` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T009 [TEST] [TDD] [US-003] Derivar de AC-009 um caso Vitest falhando em tests/doctor-subsystems.test.ts — Refs: US-003, FR-005, NFR-002, AC-009 — Depends: none
  - [x] **PREP**: Gherkin de AC-009 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/doctor-subsystems.test.ts com marcador `SPECSFY: … AC-009`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- doctor-subsystems` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T010 [TEST] [TDD] [US-003] Derivar de AC-010 um caso Vitest falhando em tests/doctor-subsystems.test.ts — Refs: US-003, FR-005, NFR-002, AC-010 — Depends: none
  - [x] **PREP**: Gherkin de AC-010 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/doctor-subsystems.test.ts com marcador `SPECSFY: … AC-010`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- doctor-subsystems` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T011 [TEST] [TDD] [US-003] Derivar de AC-011 um caso Vitest falhando em tests/doctor-subsystems.test.ts — Refs: US-003, FR-005, FR-008, AC-011 — Depends: none
  - [x] **PREP**: Gherkin de AC-011 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/doctor-subsystems.test.ts com marcador `SPECSFY: … AC-011`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- doctor-subsystems` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T012 [TEST] [TDD] [US-003] Derivar de AC-012 um caso Vitest falhando em tests/doctor-maestro-layer.test.ts — Refs: US-003, FR-006, FR-008, AC-012 — Depends: none
  - [x] **PREP**: Gherkin de AC-012 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/doctor-maestro-layer.test.ts com marcador `SPECSFY: … AC-012`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- doctor-maestro-layer` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T013 [TEST] [TDD] [US-003] Derivar de AC-013 um caso Vitest falhando em tests/doctor-maestro-layer.test.ts — Refs: US-003, FR-006, FR-007, FR-008, AC-013 — Depends: none
  - [x] **PREP**: Gherkin de AC-013 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/doctor-maestro-layer.test.ts com marcador `SPECSFY: … AC-013`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- doctor-maestro-layer` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T014 [TEST] [TDD] [US-003] Derivar de AC-014 um caso Vitest falhando em tests/doctor-maestro-layer.test.ts — Refs: US-003, FR-006, FR-008, NFR-001, AC-014 — Depends: none
  - [x] **PREP**: Gherkin de AC-014 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/doctor-maestro-layer.test.ts com marcador `SPECSFY: … AC-014`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- doctor-maestro-layer` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T015 [TEST] [TDD] [US-003] Derivar de AC-015 um caso Vitest falhando em tests/doctor-maestro-layer.test.ts — Refs: US-003, FR-006, FR-007, AC-015 — Depends: none
  - [x] **PREP**: Gherkin de AC-015 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/doctor-maestro-layer.test.ts com marcador `SPECSFY: … AC-015`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- doctor-maestro-layer` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T016 [TEST] [TDD] [US-003] Derivar de AC-016 um caso Vitest falhando em tests/doctor-maestro-layer.test.ts — Refs: US-003, FR-007, NFR-001, AC-016 — Depends: none
  - [x] **PREP**: Gherkin de AC-016 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/doctor-maestro-layer.test.ts com marcador `SPECSFY: … AC-016`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- doctor-maestro-layer` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T017 [TEST] [TDD] [US-003] Derivar de AC-017 um caso Vitest falhando em tests/doctor-maestro-layer.test.ts — Refs: US-003, FR-008, NFR-001, AC-017 — Depends: none
  - [x] **PREP**: Gherkin de AC-017 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/doctor-maestro-layer.test.ts com marcador `SPECSFY: … AC-017`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- doctor-maestro-layer` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T018 [TEST] [TDD] [US-003] Derivar de AC-018 um caso Vitest falhando em tests/doctor-maestro-layer.test.ts — Refs: US-003, FR-008, NFR-002, AC-018 — Depends: none
  - [x] **PREP**: Gherkin de AC-018 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/doctor-maestro-layer.test.ts com marcador `SPECSFY: … AC-018`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- doctor-maestro-layer` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T019 [TEST] [TDD] [US-001] Derivar de AC-019 um caso Vitest falhando em tests/setup-next-steps.test.ts — Refs: US-001, FR-003, NFR-003, AC-019 — Depends: none
  - [x] **PREP**: Gherkin de AC-019 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-next-steps.test.ts com marcador `SPECSFY: … AC-019`; sem `.feature`.
  - [x] **VERIFY**: RED confirmado por remoção temporária de `src/setup/layout.ts`, `src/doctor/subsystems.ts`, `src/doctor/maestro.ts` e reversão de `setup-check.md`/`readme.ts`/`run.ts`/`doctor.ts`/`cli.ts`/`diagnose.ts`: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always doctor-subsystems doctor-maestro-layer` → 6/9 arquivos falham (módulo ausente ou asserção não satisfeita); implementação restaurada em seguida com GREEN confirmado (2026-09-17).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-next-steps` → GREEN após a implementação; linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.


#### Fase 2 — US-001/US-002 Layout esperado, setup-check e instaladores sempre (P1)

**Objetivo**: função pura de layout, setup-check reescrito, orientação no relatório/README, instaladores sem short-circuit.
**Teste independente**: `npm run test:tdd -- setup-check-configured setup-next-steps setup-installers-always` verde.

- [x] T020 [CODE] [US-001] Criar expectedLayout/assessConfiguration em src/setup/layout.ts — Refs: US-001, FR-001, FR-007, AC-001, AC-002, AC-003, AC-016 — Depends: T001, T002, T003, T016
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes (commit 8a5a1d1): 1746 nós; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `src/setup/layout.ts` criado: `expectedLayout(target)` (função pura, sem parâmetro `root`, lê apenas o corpus de `resources/hooks/`), `assessConfiguration(root, target)` compara com o disco (rastros, blocos, hooks legados/ausentes, direção, marcadores sem par, seções desconhecidas, projeções divergentes, cobertura do fallback) e `nextStepsNote(assessment)`.
  - [x] **VERIFY**: `npm run test:tdd -- setup-check-configured` → GREEN; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código e relatório de CLI.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima.
  <!-- specsfy:evidence {"task":"T020","refs":["US-001","FR-001","FR-007","AC-001","AC-002","AC-003","AC-016"],"files":["src/setup/layout.ts"],"commands":[{"run":"npm run test:tdd -- setup-check-configured","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T021 [CODE] [US-001] Reescrever resources/hooks/setup-check.md com o critério novo — Refs: US-001, FR-001, FR-002, NFR-001, AC-001, AC-002, AC-003 — Depends: T020
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes (commit 8a5a1d1): 1746 nós; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `resources/hooks/setup-check.md` reescrito: mantém o aviso base (`install.json`/`.specsfy/` ausentes) e acrescenta a checagem shell dos quatro rastros do `specsfy-setup` e da seção `## Agent skills`, citando `/specsfy-setup` e/ou `/setup-matt-pocock-skills` só com o que falta; silencioso quando completo.
  - [x] **VERIFY**: `npm run test:tdd -- setup-check-configured` → GREEN; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código e relatório de CLI.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima.
  <!-- specsfy:evidence {"task":"T021","refs":["US-001","FR-001","FR-002","NFR-001","AC-001","AC-002","AC-003"],"files":["resources/hooks/setup-check.md"],"commands":[{"run":"npm run test:tdd -- setup-check-configured","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T022 [CODE] [US-001] Adicionar a linha next: ao relatório do setup em src/setup/run.ts e ao README gerado em src/setup/readme.ts — Refs: US-001, FR-003, NFR-003, AC-004, AC-005, AC-019 — Depends: T004, T005, T019, T020
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes (commit 8a5a1d1): 1746 nós; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `nextStepsNote`/`withNextSteps` (`src/setup/readme.ts`) e fiação em `src/setup/run.ts` (`ensureConfigYaml(root, nextNote)`, `nextNote` computado nos dois caminhos de escrita e anexado ao relatório).
  - [x] **VERIFY**: `npm run test:tdd -- setup-next-steps` → GREEN; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código e relatório de CLI.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima.
  <!-- specsfy:evidence {"task":"T022","refs":["US-001","FR-003","NFR-003","AC-004","AC-005","AC-019"],"files":["src/setup/run.ts","src/setup/readme.ts"],"commands":[{"run":"npm run test:tdd -- setup-next-steps","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T023 [CODE] [US-002] Remover o short-circuit de skills/Specsfy em src/setup/run.ts — Refs: US-002, FR-004, NFR-002, AC-006, AC-007, AC-008 — Depends: T006, T007, T008
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes (commit 8a5a1d1): 1746 nós; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: Short-circuit de `src/setup/run.ts` reduzido a `hooksAlreadyDone && !opts.skills && !opts.specsfy && !bridgePending`; `installSkills`/`installSpecsfy` passam a rodar em toda chamada configurada, com a aprovação decidida só pelo registro (`partitionByApproval`); `installSpecsfy` (`src/specsfy/install.ts`) passou a propagar `result.reason` na falha, achado real ao escrever o teste de falha isolada.
  - [x] **VERIFY**: `npm run test:tdd -- setup-installers-always` → GREEN; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código e relatório de CLI.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: `installSpecsfy` passou a propagar a razão do executor na falha — descoberto ao escrever o teste de instalador falhando (AC-008).
  <!-- specsfy:evidence {"task":"T023","refs":["US-002","FR-004","NFR-002","AC-006","AC-007","AC-008"],"files":["src/setup/run.ts"],"commands":[{"run":"npm run test:tdd -- setup-installers-always","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->


**Checkpoint**: raiz com `.agents/skills` apagado → segundo `setup` reinstala sem nova pergunta; `setup-check.sh` silencioso só quando tudo presente.

#### Fase 3 — US-003 Doctor orquestrador (P1)

**Objetivo**: sub-doctors por subprocesso + camada maestro, tudo read-only.
**Teste independente**: `npm run test:tdd -- doctor-subsystems doctor-maestro-layer` verde.

- [x] T024 [CODE] [US-003] Criar runSubsystemDoctors em src/doctor/subsystems.ts — Refs: US-003, FR-005, NFR-002, AC-009, AC-010, AC-011 — Depends: T009, T010, T011
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes (commit 8a5a1d1): 1746 nós; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `src/doctor/subsystems.ts` criado: `SubsystemExecutor` injetável, `runSubsystemDoctors` chama `specsfy doctor`, `context-mode doctor`, `skills list`, `code-review-graph status` com timeout de 20s, cada um com status próprio (`OK`/`FAIL`/`ABSENT`), nunca aborta os demais.
  - [x] **VERIFY**: `npm run test:tdd -- doctor-subsystems` → GREEN; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código e relatório de CLI.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima.
  <!-- specsfy:evidence {"task":"T024","refs":["US-003","FR-005","NFR-002","AC-009","AC-010","AC-011"],"files":["src/doctor/subsystems.ts"],"commands":[{"run":"npm run test:tdd -- doctor-subsystems","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T025 [CODE] [US-003] Criar diagnoseMaestro em src/doctor/maestro.ts usando layout.ts — Refs: US-003, FR-006, FR-007, FR-008, AC-012, AC-013, AC-014, AC-015, AC-016, AC-017 — Depends: T012, T013, T014, T015, T016, T017, T020
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes (commit 8a5a1d1): 1746 nós; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `src/doctor/maestro.ts` criado: `diagnoseMaestro(assessment)` classifica cada gap de `assessConfiguration` em `FAIL`/`WARN` conforme PR-004; `diagnoseMaestroProject(root, target)` como entrada read-only.
  - [x] **VERIFY**: `npm run test:tdd -- doctor-maestro-layer` → GREEN; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código e relatório de CLI.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima.
  <!-- specsfy:evidence {"task":"T025","refs":["US-003","FR-006","FR-007","FR-008","AC-012","AC-013","AC-014","AC-015","AC-016","AC-017"],"files":["src/doctor/maestro.ts"],"commands":[{"run":"npm run test:tdd -- doctor-maestro-layer","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T026 [CODE] [US-003] Integrar subsystems/maestro ao Report e exitCode em src/doctor.ts e src/cli.ts — Refs: US-003, FR-005, FR-008, AC-009, AC-011, AC-018 — Depends: T009, T011, T018, T024, T025
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes (commit 8a5a1d1): 1746 nós; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `src/doctor.ts` (`Report.subsystems`/`Report.maestro`, `exitCode` considera qualquer `FAIL`) e `src/cli.ts` (`renderReport` imprime as duas camadas novas). Achado real corrigido no caminho: `src/extensions/diagnose.ts` resolvia o `target` de artefatos `hook` por `resolveTargetPath` (convenção só de `router`/blocos), produzindo falso `checksum-mismatch` em cada hook, sempre — corrigido para usar `artifact.target` diretamente nessa categoria.
  - [x] **VERIFY**: `npm run test:tdd -- doctor-maestro-layer` → GREEN; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código e relatório de CLI.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Bug real corrigido em `diagnose.ts`: cada hook aparecia divergente em qualquer `maestro doctor`, desde a SPEC-0022, por um `resolveTargetPath` aplicado ao caminho já resolvido dos scripts de hook.
  <!-- specsfy:evidence {"task":"T026","refs":["US-003","FR-005","FR-008","AC-009","AC-011","AC-018"],"files":["src/doctor.ts","src/cli.ts"],"commands":[{"run":"npm run test:tdd -- doctor-maestro-layer","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->


**Checkpoint**: `maestro doctor` numa raiz com desvios mistos mostra FAIL/WARN por área e sai com o código certo.

#### Fase final — Qualidade

- [x] T027 [TEST] Executar regressão completa e rastreabilidade via node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018, AC-019 — Depends: T021, T022, T023, T026
  - [x] **PREP**: Suítes: `npm run test:tdd` (630 casos), `npx tsc --noEmit`, testes antigos que dependiam do short-circuit por presença de diretório (`setup-jafeito-skills-specsfy`, `mcp-idempotent`) e da resolução `resolveTargetPath` para hooks (`extensions-doctor-divergencia`, `skills-doctor-*`).
  - [x] **EXECUTE**: `npm run test:tdd` → 619/630 (11 falhas são o RED da SPEC-0021, `Planned`); `tsc` limpo; `npm version patch` → 2.1.26; `npm run build` falhou por `__dirname` indefinido em ESM em `src/setup/layout.ts` — corrigido para `fileURLToPath(import.meta.url)`; nova versão 2.1.28 buildada; `echo '{"approved": true}' | node dist/cli.js setup` executado numa raiz real (confirma o bug do build antes do fix e o sucesso depois); `node dist/cli.js doctor` executado neste repositório: revelou o marcador órfão real `common-rules:extension:router:start` em `CLAUDE.md` (FIND-INT-004) e a ausência da seção `## Agent skills` (rastro do `setup-matt-pocock-skills` nunca executado aqui) — ambos removidos/documentados no fechamento.
  - [x] **VERIFY**: Zero regressão em teste que passava (dois testes antigos adaptados ao novo contrato de instaladores: `setup-jafeito-skills-specsfy`, `mcp-idempotent`); 33/33 IDs cobertos; `maestro doctor` neste repositório passou a reportar `FAIL`/`WARN` reais em vez de silêncio.
  - [x] **VISUAL**: Não aplicável — sem interface em nenhuma tarefa desta spec.
  - [x] **EVIDENCE**: Comandos, versões (2.1.26–2.1.29) e saída real do `doctor`/`setup` registrados acima e nas seções 11–13.
  - [x] **IMPROVE**: Retrospectiva: dois defeitos reais só apareceram ao rodar o binário compilado de verdade (`__dirname` em ESM, `resolveTargetPath` para hooks) — nenhum dos dois aparecia nos testes que importam `src/` diretamente; T027 seguiu executando o CLI compilado à parte da suíte justamente para cobrir essa lacuna.

- [x] T028 [DOC] Revisar PROJECT.md, docs/ e arquivar findings — Refs: US-001, US-002, US-003 — Depends: T027
  - [x] **PREP**: Lidos `PROJECT.md`, `docs/integrations.md`, `findings/internal/FIND-INT-003` e `FIND-INT-004`.
  - [x] **EXECUTE**: `PROJECT.md` (linha da tabela de `maestro doctor` e parágrafo *"Instalado" não é "configurado"*) e `docs/integrations.md` (seção 6, orquestração do doctor) atualizados fora do bloco documentator; blocos mecânicos regenerados com `MAESTRO_ALLOW_DOCS_BUILD=1` + `--check`; FIND-INT-003 e FIND-INT-004 movidos para `findings/archived/` com o fix (release 2.1.25/2.1.28); marcador órfão removido de `CLAUDE.md` deste repositório com autorização, como verificação real do FR-006; `.specsfy/STACK.md`/`.specsfy/PACKAGES.md` com nota sobre os bumps de versão sem mudança de dependência; `.specsfy/RULES.md` reconhecido sem nova regra.
  - [x] **VERIFY**: `monitor_context.mjs --project . --check` → `CURRENT`; `build_documentation.mjs --check` → exit 0; `node dist/cli.js doctor` neste repositório → só o `FAIL absent skills` (binário `skills` não está no PATH global deste container, achado real e correto, fora do escopo desta spec corrigir).
  - [x] **VISUAL**: Não aplicável — documentação textual.
  - [x] **EVIDENCE**: Arquivos revisados e findings arquivados conforme EXECUTE.
  - [x] **IMPROVE**: Aprendizado: testes que só importam `src/` nunca exercitam o ESM real do `dist/`; specs futuras que mexam em caminho de arquivo (`import.meta.url`, `__dirname`) devem rodar o binário compilado pelo menos uma vez antes de fechar o Delivery Gate.

### 15. Ordem de execução

- Caminho crítico: T001–T019 (RED) → T020 → T021 → T022 → T023 → T024 → T025 → T026 → T027 → T028.
- Tarefas paralelas: T021–T023 (US-001/US-002) e T024 (sub-doctors) podem avançar em paralelo após T020, por tocarem arquivos distintos; T025 depende de T020.
- Estratégia de MVP: T020–T023 (critério e instaladores) e T024–T026 (doctor) resolvem cada metade do problema; ambas necessárias para a DoD.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- SPEC-0022/0023/0024 (Complete); SPEC-0021 (`Planned`) para as checagens de documentação, não duplicadas aqui.

#### Riscos

- Instaladores sempre executados custam tempo/rede por `setup` → decisão do usuário (Q8); executores continuam idempotentes e os testes existentes que exigiam "não invocar" são adaptados.
- Sub-doctors lentos → timeout 20 s e status `FAIL: timeout`.
- Assinaturas de seções conhecidas limitadas → conteúdo desconhecido é só `WARN`.

#### Suposições

- Target Claude Code para as checagens de `CLAUDE.md`/projeções; Antigravity as ignora.
- `skills list` com exit 0 e saída não vazia é `OK`.

### 17. Decisões

- **DEC-001**: "Configurado" derivado de rastros + blocos, sem marcador gravado por skills alheias.
- **DEC-002**: Orientação por `SessionStart`, README e relatório — o único canal que chega ao agente sem depender de leitura de docs é o hook.
- **DEC-003**: Instaladores sempre; short-circuit só para aprovação.
- **DEC-004**: Doctor read-only com `FAIL`/`WARN`; `setup` repara.
- **DEC-005**: Layout esperado por função pura compartilhada — `setup` e `doctor` nunca discordam por construção.
- **DEC-006**: Sub-doctors por subprocesso com timeout e status próprio.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam.
- [ ] `PROJECT.md`/`docs/` revisados; FIND-INT-003 e FIND-INT-004 fechados; `STACK.md`/`DATABASE.md` sem impacto.
