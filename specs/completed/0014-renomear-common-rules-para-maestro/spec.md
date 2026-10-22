# Especificação integrada: Renomear common-rules para maestro

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0014 |
| Slug | 0014-renomear-common-rules-para-maestro |
| Status | Complete |
| Effort | 3 |
| Effort updated at | 2026-09-06 |
| Effort rationale | Sem lógica de negócio nova — é substituição de identificador em superfícies conhecidas (pacote, binários, ~10 módulos com path local, Dockerfile, CI, docs). Comparável ao topo de `light`/início de `standard`: mecânico, mas espalhado por superfícies internas e externas (GitHub, Docker Hub) que exigem sequenciamento correto para não quebrar CI no meio da troca. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — mudança de identidade em pacote, binários, diretório local, repositório e imagem publicada; nenhuma tela envolvida. |
| Atualizada em | 2026-09-06 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

`common-rules` descrevia um agrupador de regras. Hoje a ferramenta é um
orchestrator/wrapper que resolve e integra subsistemas (`framework`,
`context-mode`, `code-review-graph`) e agentes de codificação, com
detecção de backends, aprovação de plano, extensões locais verificáveis e
telemetria de ponta a ponta — treze specs completas (`SPEC-0001` a
`SPEC-0013`) entregaram esse papel. O nome atual não comunica mais o que a
ferramenta faz.

#### Resultado desejado

O nome do projeto — pacote npm, binários, diretório local que o `setup`
gerencia em cada projeto consumidor, repositório GitHub e imagem Docker Hub —
passa a ser `maestro` em toda superfície ativa, sem nenhuma referência
residual ao nome antigo em código de produção. Specs já concluídas
permanecem citando `common-rules` como registro histórico do nome vigente
quando cada uma foi entregue.

#### Métricas de sucesso

- `grep -r "common-rules" src/ resources/ package.json Dockerfile .github/` não retorna nenhuma ocorrência fora de comentário que cite proveniência histórica explícita.
- Um projeto com `.common-rules/install.json` de uma instalação anterior, ao rodar o `setup` da versão renomeada, termina com `.maestro/` populado e nenhuma leitura do diretório antigo.
- O job `docker` do CI publica a imagem como `maestro` e nenhuma tag nova aparece no repositório Docker Hub `brunocalmon/common-rules-server` a partir do commit da troca.

### 2. Research e esclarecimentos

#### Researchs executados

- Nenhum research externo necessário — a mudança é interna ao repositório e às contas (GitHub, Docker Hub, npm) já controladas pela pessoa responsável. Escopo levantado por inspeção direta do código-fonte durante o refinamento de backlog (ver Fontes e contexto consultados).

#### Fontes e contexto consultados

- `package.json` — nome atual `@brunocalmon/common-rules`, `private: true`, binários `common-rules` e `common-rules-mcp`.
- `src/approval/registry.ts`, `src/config/write.ts`, `src/setup/record.ts`, `src/extensions/repair.ts`, `src/extensions/registry.ts`, `src/extensions/create.ts`, `src/config/schema.ts` — constantes de caminho local (`REGISTRY_PATH`, `CONFIG_PATH`, `RECORD_PATH`, `QUARANTINE_DIR`, `EXTENSIONS_DIR`) que fixam `.common-rules/` como raiz do diretório gerenciado.
- `src/extensions/router.ts`, `src/extensions/anchor.ts` — texto gerado para `CLAUDE.md`/`AGENTS.md`, incluindo a âncora HTML `<!-- common-rules:extension:...` definida em `SPEC-0011` (`D6`).
- `Dockerfile`, `.github/workflows/ci.yml` — comentário do Dockerfile referencia `common-rules-mcp`; `ci.yml` define `IMAGE_NAME` com `common-rules-server` em três pontos (build, checagem de tag existente, push).
- `specs/backlog/0008-renomear-common-rules-para-maestro.md` — brief consolidado desta entrega, com oito decisões tomadas em entrevista numerada.
- `specs/inbox/2026-09-06-172334-renomear-common-rules-para-maestro.md` e `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md:108` — origem e primeira menção da intenção, 2026-08-29.

#### Documentação consultada

- Nenhuma documentação externa consultada — decisões vieram inteiramente da entrevista com a pessoa responsável.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo. O levantamento inteiro é inspeção do próprio repositório, já citada com caminho relativo acima.

#### Dúvidas respondidas

- **Q**: Qual o motivo da renomeação? → **A**: o nome atual não representa mais o papel de orchestrator da ferramenta (`BACKLOG-0008`, rodada 1).
- **Q**: A renomeação troca só a superfície ou também o diretório `.common-rules/` já em produção nos consumidores? → **A**: troca tudo, incluindo o diretório (rodada 2).
- **Q**: O que acontece com o conteúdo de um `.common-rules/` pré-existente quando o `setup` renomeado roda? → **A**: nada — é tratado como instalação nova, o diretório antigo fica órfão, sem migração (rodada 3).
- **Q**: Specs concluídas que citam o nome atual são reescritas? → **A**: não, permanecem como registro histórico (rodada 4).
- **Q**: Repositório GitHub e imagem Docker Hub também renomeiam? → **A**: sim, os dois (rodada 5).
- **Q**: Qual a convenção de nome para pacote e binários? → **A**: `@brunocalmon/maestro`, binários `maestro` e `maestro-mcp` (rodada 6).
- **Q**: Existe prazo ou gatilho? → **A**: não, entra quando priorizado (rodada 7).
- **Q**: O Docker Hub publica em paralelo durante uma transição, ou troca de vez? → **A**: troca de vez, sem publicação dupla (rodada 8).
- **Q**: O que fazer se `.common-rules/` e `.maestro/` coexistirem no mesmo projeto? → **A**: ignorar `.common-rules/` e operar normalmente sobre `.maestro/`, sem caso especial (esclarecimento desta etapa).

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- `package.json`: nome do pacote, nomes dos binários.
- Código-fonte inteiro (`src/`) que referencia `common-rules` em identificador, string, comentário ou âncora gerada, incluindo as constantes de caminho local.
- O diretório que o `setup` gerencia em cada projeto consumidor: `.common-rules/` → `.maestro/`.
- `Dockerfile` e `.github/workflows/ci.yml`: nome da imagem publicada.
- Repositório GitHub (`brunocalmon/common-rules-server` → `brunocalmon/maestro` ou equivalente).
- Imagem Docker Hub (`brunocalmon/common-rules-server` → `brunocalmon/maestro`).
- Documentação viva: `docs/`, `PROJECT.md`, `STACK.md` (este repositório não tem `README.md` na raiz), e o conteúdo gerado em `CLAUDE.md`/`AGENTS.md` pelo próprio `setup`.

#### Fora de escopo

- Reescrita de qualquer spec em `specs/completed/`.
- Qualquer mecanismo de migração automática ou manual do conteúdo de um `.common-rules/` pré-existente.
- Publicação pública do pacote no registro npm — `private: true` não muda nesta entrega.
- Manutenção paralela do nome antigo em qualquer superfície após a troca (sem alias, sem shim de compatibilidade, sem publicação dupla no Docker Hub).
- Renomear commits ou tags git anteriores à troca.

#### Atores

- **Pessoa mantenedora**: decide quando priorizar a execução, detém as contas GitHub e Docker Hub onde a renomeação externa acontece, e é quem roda os comandos de rename fora do escopo automatizável (rename do repositório GitHub, criação do novo repositório Docker Hub).
- **Projeto consumidor já instalado**: qualquer repositório que já rodou `setup` sob o nome antigo e tem `.common-rules/` em disco; passa a ser tratado como instalação nova na primeira execução do `setup` renomeado.

### 4. Princípios e restrições do projeto

- **PR-001**: Zero compatibilidade com o nome antigo depois da troca — mesma cultura já estabelecida em `SPEC-0001` para a reescrita completa; sem alias, sem shim, sem migração automática.
- **PR-002**: Specs concluídas são evidência fechada e não são reescritas para manter vocabulário corrente (decisão rodada 4, consistente com a prática já usada para preservar histórico no restante do projeto).

### 5. Histórias de usuário

#### US-001 — Identidade única do projeto sob o nome maestro (P1)

Como pessoa mantenedora do `common-rules`, quero que pacote, binários,
diretório local, repositório e imagem publicada passem a se chamar
`maestro`, para que a identidade do projeto comunique corretamente seu
papel de orchestrator, sem nenhuma superfície ativa ainda presa ao nome
antigo.

**Por que P1**: é a única história desta entrega — sem ela, o item não tem valor observável.
**Teste independente**: depois da execução, `grep -r "common-rules" src/ resources/ package.json Dockerfile .github/` não retorna ocorrência fora de proveniência histórica explícita; um `setup` novo cria `.maestro/`; o CI publica só como `maestro`.
**Requisitos**: FR-001, FR-002, FR-003, FR-004

### 6. Cenários BDD de aceite

#### AC-001 — pacote e binários declaram o nome novo

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-001
Feature: identidade do pacote e dos binários

  Scenario: package.json reflete o nome renomeado
    Given a renomeação concluída no código-fonte
    When alguém inspeciona package.json
    Then o campo name é "@brunocalmon/maestro"
    And o campo bin declara "maestro" e "maestro-mcp"
```

#### AC-002 — binário antigo deixa de existir

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-002
Feature: identidade do pacote e dos binários

  Scenario: o binário antigo não é mais instalado
    Given a renomeação concluída
    When o pacote é instalado do zero
    Then nenhum binário chamado "common-rules" ou "common-rules-mcp" é criado
    And apenas "maestro" e "maestro-mcp" resolvem
```

#### AC-003 — nenhuma referência residual no código de produção

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-003
Feature: identidade do pacote e dos binários

  Scenario: busca por texto do nome antigo não encontra nada em produção
    Given a renomeação concluída
    When alguém executa grep -r "common-rules" src/ resources/ package.json Dockerfile .github/
    Then nenhuma ocorrência é encontrada
```

#### AC-004 — setup cria o diretório novo do zero

**Cobre**: US-001, FR-002, NFR-002

```gherkin
@US-001 @FR-002 @NFR-002 @AC-004
Feature: diretório local renomeado

  Scenario: projeto com instalação antiga recebe .maestro/ novo
    Given um projeto com .common-rules/install.json de uma instalação anterior
    And nenhum .maestro/ presente
    When a pessoa roda o setup da versão renomeada
    Then o setup cria .maestro/ com o conteúdo inteiro esperado de uma primeira instalação
    And nada do conteúdo de .common-rules/ é lido, migrado ou copiado
```

#### AC-005 — coexistência dos dois diretórios não muda o comportamento

**Cobre**: US-001, FR-002, NFR-002

```gherkin
@US-001 @FR-002 @NFR-002 @AC-005
Feature: diretório local renomeado

  Scenario: .common-rules/ e .maestro/ coexistindo no mesmo projeto
    Given um projeto com .common-rules/ (antigo) e .maestro/ (novo) presentes ao mesmo tempo
    When a pessoa roda o setup da versão renomeada
    Then o setup ignora .common-rules/ por completo
    And opera normalmente apenas sobre .maestro/, como se .common-rules/ não existisse
```

#### AC-006 — execução é relatada como primeira instalação

**Cobre**: US-001, FR-002, NFR-002

```gherkin
@US-001 @FR-002 @NFR-002 @AC-006
Feature: diretório local renomeado

  Scenario: relato da execução não menciona atualização
    Given um projeto sem .maestro/ presente, com ou sem .common-rules/ antigo
    When a pessoa roda o setup da versão renomeada
    Then o relatório final descreve uma primeira instalação
    And não descreve a execução como atualização ou migração
```

#### AC-007 — CI publica exclusivamente sob o nome novo

**Cobre**: US-001, FR-003, NFR-002

```gherkin
@US-001 @FR-003 @NFR-002 @AC-007
Feature: superfícies publicadas renomeadas

  Scenario: push em main depois da troca publica só a imagem nova
    Given a renomeação do workflow de CI concluída
    When um push acontece em main
    Then o job docker publica a imagem como maestro no Docker Hub
```

#### AC-008 — repositório Docker Hub antigo para de receber tags

**Cobre**: US-001, FR-003, NFR-002

```gherkin
@US-001 @FR-003 @NFR-002 @AC-008
Feature: superfícies publicadas renomeadas

  Scenario: nenhuma tag nova aparece no repositório antigo
    Given a renomeação do workflow de CI concluída
    When um push acontece em main
    Then nenhuma tag nova é publicada em brunocalmon/common-rules-server no Docker Hub
```

#### AC-009 — repositório GitHub reflete o nome novo

**Cobre**: US-001, FR-003

```gherkin
@US-001 @FR-003 @AC-009
Feature: superfícies publicadas renomeadas

  Scenario: package.json declara o repositório renomeado
    Given a renomeação de código concluída
    When alguém inspeciona o campo repository.url de package.json
    Then a URL referencia o repositório maestro

  Scenario: remoto git aponta para o repositório renomeado
    Given a renomeação do repositório GitHub concluída
    When alguém inspeciona a URL do repositório
    Then o nome do repositório reflete maestro
```

#### AC-010 — specs concluídas permanecem inalteradas

**Cobre**: US-001, FR-004, NFR-002

```gherkin
@US-001 @FR-004 @NFR-002 @AC-010
Feature: preservação de evidência histórica

  Scenario: nenhuma spec completa é reescrita por esta entrega
    Given o conjunto de specs em specs/completed/ antes desta entrega
    When a renomeação é concluída
    Then o conteúdo de cada spec em specs/completed/ permanece byte a byte idêntico
```

#### AC-011 — documentação viva usa o nome novo

**Cobre**: US-001, FR-004

```gherkin
@US-001 @FR-004 @AC-011
Feature: preservação de evidência histórica

  Scenario: documentação corrente reflete o nome atual
    Given a renomeação concluída
    When alguém lê docs/, PROJECT.md ou STACK.md
    Then o texto usa maestro, não common-rules
```

#### AC-012 — a troca é auditável como rebranding puro

**Cobre**: US-001, FR-004, NFR-002

```gherkin
@US-001 @FR-004 @NFR-002 @AC-012
Feature: preservação de evidência histórica

  Scenario: mensagens de commit desta entrega seguem convenção verificável
    Given uma lista de mensagens de commit candidatas a esta entrega
    When scripts/check-rename-commits.mjs analisa a lista
    Then commits com prefixo "rename:" são aceitos como rebranding puro
    And qualquer mensagem sem esse prefixo é sinalizada para revisão manual antes do merge
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O pacote npm deve se chamar `@brunocalmon/maestro`, com binários `maestro` (CLI) e `maestro-mcp` (servidor MCP); o binário antigo não deve mais existir; nenhuma referência textual a `common-rules` deve restar em código-fonte de produção (`src/`, `resources/`, `package.json`, `Dockerfile`, `.github/`).
- **FR-002**: O diretório local que o `setup` grava por projeto consumidor deve ser `.maestro/` em vez de `.common-rules/`; a presença de um `.common-rules/` pré-existente — sozinho ou coexistindo com `.maestro/` — não deve ser lida, migrada ou copiada; a execução deve ser relatada como primeira instalação.
- **FR-003**: O repositório GitHub e a imagem Docker Hub publicada pelo CI devem usar o nome `maestro`; a partir da troca, o CI deve publicar exclusivamente sob esse nome, sem publicação dupla ou período de transição no repositório Docker Hub antigo.
- **FR-004**: Nenhuma spec em `specs/completed/` deve ser alterada por esta entrega; a documentação viva (`docs/`, `PROJECT.md`, `STACK.md`) deve usar o nome novo; a mudança deve ficar isolada em commit(s) identificáveis como rebranding puro.

#### Não funcionais

- **NFR-001**: Nenhuma referência residual ao nome antigo deve restar em código de produção depois da troca. **Verificação**: `grep -r "common-rules" src/ resources/ package.json Dockerfile .github/` sem resultado, executado como parte da evidência de T-final.
- **NFR-002**: A mudança deve ser observável como troca completa e imediata em cada superfície — sem estado intermediário onde duas superfícies equivalentes coexistem ativamente (ex: publicação dupla, diretório local que ora lê o antigo ora o novo). **Verificação**: inspeção manual do workflow de CI e do código do `setup` contra os cenários AC-005 a AC-008.

#### Erros e casos-limite

- `.common-rules/` e `.maestro/` coexistindo no mesmo projeto → `setup` ignora `.common-rules/` por completo, opera só sobre `.maestro/` (AC-005).
- Binário antigo (`common-rules`) invocado depois da renomeação → comando não encontrado; não há alias nem shim de compatibilidade (AC-002).
- Push em `main` acontecendo durante a janela de troca do workflow de CI (antes do `IMAGE_NAME` ser atualizado) → risco operacional de execução, não requisito desta spec; mitigado na ordem de execução da seção 15 (código e workflow trocam no mesmo commit/PR, sem janela intermediária).

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

Projeto TypeScript/Node ESM, `package.json` privado (`private: true`, sem
publicação no registro npm público). O nome atual aparece em: identificador
de pacote e binários (`package.json`); comentários e strings em ~19 arquivos
de `src/`; cinco constantes centralizadas de caminho local
(`REGISTRY_PATH` em `src/approval/registry.ts` e `src/extensions/registry.ts`,
`CONFIG_PATH` em `src/config/write.ts`, `RECORD_PATH` em
`src/setup/record.ts`, `QUARANTINE_DIR` e `EXTENSIONS_DIR` em
`src/extensions/repair.ts` e `src/extensions/create.ts`); a âncora HTML de
extensões (`<!-- common-rules:extension:...`, `SPEC-0011` `D6`) gerada por
`src/extensions/anchor.ts`/`router.ts`; o comentário do `Dockerfile`; e três
pontos de `IMAGE_NAME` em `.github/workflows/ci.yml`.

#### Arquitetura e módulos

- `package.json`: `name`, `bin.common-rules` → `bin.maestro`, `bin.common-rules-mcp` → `bin.maestro-mcp`, e um campo `repository.url` novo apontando para o repositório GitHub renomeado (não existe hoje — adicionado por esta entrega para dar a `AC-009` uma asserção verificável em arquivo, sem depender só de inspeção externa).
- `scripts/check-rename-commits.mjs`: script novo, função pura que recebe uma lista de mensagens de commit e classifica cada uma como convenção aceita (prefixo `rename:`) ou sinalizada para revisão manual — usado por `AC-012` para tornar a auditabilidade do rebranding testável sem depender de inspecionar o histórico git real dentro da suíte.
- `src/approval/registry.ts`, `src/extensions/registry.ts`: `REGISTRY_PATH` — trocar prefixo `.common-rules/` → `.maestro/` nos dois arquivos (nomes de arquivo mantidos: `approved-commands.json`, `extensions.json`).
- `src/config/write.ts`: `CONFIG_PATH` — `.common-rules/config.yaml` → `.maestro/config.yaml`.
- `src/setup/record.ts`: `RECORD_PATH` — `.common-rules/install.json` → `.maestro/install.json`.
- `src/extensions/repair.ts`: `QUARANTINE_DIR` — `.common-rules/quarantine` → `.maestro/quarantine`.
- `src/extensions/create.ts`: `EXTENSIONS_DIR` — `.common-rules/extensions` → `.maestro/extensions`.
- `src/config/schema.ts`: lista de `paths` usada por validação/relato — atualizar os quatro caminhos citados.
- `src/extensions/anchor.ts`, `src/extensions/router.ts`: âncora HTML `common-rules:extension:` → `maestro:extension:` (e equivalente de `override`); texto do roteador em `CLAUDE.md`/`AGENTS.md`.
- `src/setup/run.ts`, `src/setup/bridge.ts`, `src/doctor.ts`, `src/cli.ts`, `src/mcp/server.ts`, `src/hooks/resolve.ts`, `src/skills/executor.ts`, `src/framework/executor.ts`, `src/approval/tty-read.ts`, `src/extensions/diagnose.ts`, `src/setup/dependency-resolution.ts`: revisão de comentários e strings residuais que citam `common-rules` (identificado pelo research da seção 2; escopo exato confirmado por `grep` no início da execução, não replicado aqui para não congelar uma lista que o próprio `grep` de T-final revalida).
- `Dockerfile`: comentário de cabeçalho.
- `.github/workflows/ci.yml`: três ocorrências de `IMAGE_NAME=... common-rules-server` → `maestro`.
- `docs/`, `PROJECT.md`, `.project-context/STACK.md`: nome do projeto na documentação viva (fora da árvore `specs/completed/`).
- Superfícies externas fora do repositório (não são arquivo de código): rename do repositório GitHub (`gh repo rename` ou equivalente na interface) e criação/uso do repositório Docker Hub `maestro` sob a mesma conta.

#### Migrations

- Não aplicável — não há schema de banco de dados nesta entrega.

#### Models

- Não aplicável.

#### Controllers e casos de uso

- Não aplicável — não há camada de controller nesta stack (CLI + servidor MCP stdio).

#### Views e experiência

- Não aplicável — sem interface para pessoas (ver seção 10).

#### Queries e repositórios

- Não aplicável.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/draft/0014-renomear-common-rules-para-maestro/
  spec.md
package.json
Dockerfile
.github/workflows/ci.yml
src/
  approval/registry.ts
  config/write.ts
  config/schema.ts
  setup/record.ts
  setup/run.ts
  extensions/repair.ts
  extensions/create.ts
  extensions/registry.ts
  extensions/anchor.ts
  extensions/router.ts
  ... (demais arquivos com referência textual residual)
docs/
PROJECT.md
.project-context/STACK.md
tests/
```

### 9. Modelo de dados

#### Entidades

- Não aplicável — nenhuma entidade de domínio nova; a mudança é de identificador em arquivos de configuração já existentes (`install.json`, `extensions.json`, `approved-commands.json`), cujo schema interno não muda, só o caminho do diretório que os contém.

#### Estados e transições

- Não aplicável.

#### Migração e retenção

- Não aplicável — decisão já tomada (FR-002): sem migração de `.common-rules/` para `.maestro/`. O diretório antigo permanece em disco, órfão, até a pessoa usuária decidir removê-lo manualmente; esta entrega não apaga nada.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não. A entrega renomeia identificadores de pacote, binário, diretório local, repositório e imagem publicada — nenhuma tela, formulário ou fluxo visual é criado ou alterado.

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

- Não aplicável — nenhuma superfície visual envolvida nesta entrega.

#### APIs expostas

- Não aplicável — a tool MCP `setup` já existente não muda de contrato, apenas o caminho interno que ela grava.

#### APIs externas utilizadas

- Nenhuma nova. GitHub e Docker Hub são operados via ação humana/CLI já existente (`gh`, `docker login`/`push`), sem integração de API nova.

#### Documentação das APIs consultadas

- Não aplicável.

#### Eventos e outros contratos

- Não aplicável.

### 11. Estratégia TDD

- **Unidade**: constantes de caminho (`REGISTRY_PATH`, `CONFIG_PATH`, `RECORD_PATH`, `QUARANTINE_DIR`, `EXTENSIONS_DIR`) apontam para `.maestro/`; comportamento do `setup` diante de `.common-rules/` sozinho, `.maestro/` sozinho, e os dois coexistindo; classificação pura de mensagem de commit por `scripts/check-rename-commits.mjs`.
- **Integração/contrato**: `package.json` resolve `name`, `bin` e `repository.url` corretos; `.github/workflows/ci.yml` declara `IMAGE_NAME` novo; `dist/cli.js`/`dist/mcp/main.js` seguem executáveis sob os novos nomes de binário.
- **BDD/aceite**: os doze cenários da seção 6 orientam os doze casos TDD (um por AC) abaixo.
- **Runner TDD**: Node sem PHP — `test:tdd` já confirmado como Vitest neste projeto (decisão vigente desde `SPEC-0002`/`SPEC-0006`, reaproveitada sem nova pergunta).
- **E2E**: verificação manual do CI real após o push da troca (job `docker` publica sob o nome novo) — complementa os casos automatizados que verificam o conteúdo estático do workflow (AC-007/AC-008), confirmando que a publicação de fato aconteceu; registrada como tarefa `T020`.
- **Verificação manual**: rename do repositório GitHub e criação do repositório Docker Hub `maestro` — ações de conta externa, fora do alcance de teste automatizado; registradas como tarefas `[OPS]` `T018`/`T019` na seção 14.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, AC-001 | AC-001 na seção 6 c7/437 na suíte completa |
| US-001, FR-001, NFR-001, AC-002 | AC-002 na seção 6 c7/437 na suíte completa |
| US-001, FR-001, NFR-001, AC-003 | AC-003 na seção 6 c7/437 na suíte completa |
| US-001, FR-002, NFR-002, AC-004 | AC-004 na seção 6 c7/437 na suíte completa |
| US-001, FR-002, NFR-002, AC-005 | AC-005 na seção 6 c7/437 na suíte completa |
| US-001, FR-002, NFR-002, AC-006 | AC-006 na seção 6 c7/437 na suíte completa |
| US-001, FR-003, NFR-002, AC-007 | AC-007 na seção 6 c7/437 na suíte completa |
| US-001, FR-003, NFR-002, AC-008 | AC-008 na seção 6 c7/437 na suíte completa |
| US-001, FR-003, AC-009 | AC-009 na seção 6 c7/437 na suíte completa |
| US-001, FR-004, NFR-002, AC-010 | AC-010 na seção 6 | tests/rename-completed-specs-untouched.test.ts (T010) | Passa hoje (guard-rail intencional) | Passed — `specs/completed/` byte a byte idêntico ao fim da entrega | Passed |
| US-001, FR-004, AC-011 | AC-011 na seção 6 c7/437 na suíte completa |
| US-001, FR-004, NFR-002, AC-012 | AC-012 na seção 6 c7/437 na suíte completa |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Unidade | `tests/rename-package-identity.test.ts` | Passed |
| FR-001 | AC-002 | Unidade | `tests/rename-package-identity.test.ts` | Passed |
| FR-001 | AC-003 | Unidade (grep via child_process) | `tests/rename-package-identity.test.ts` | Passed |
| FR-002 | AC-004 | Unidade (edição, root isolado) | `tests/rename-setup-directory.test.ts` | Passed |
| FR-002 | AC-005 | Unidade (edição, root isolado) | `tests/rename-setup-directory.test.ts` | Passed |
| FR-002 | AC-006 | Unidade (edição, root isolado) | `tests/rename-setup-directory.test.ts` | Passed |
| FR-003 | AC-007 | Unidade (leitura de arquivo) + verificação manual (T020) | `tests/rename-ci-workflow.test.ts` + inspeção do Actions após push real | Passed |
| FR-003 | AC-008 | Unidade (leitura de arquivo) + verificação manual (T020) | `tests/rename-ci-workflow.test.ts` + inspeção do Docker Hub após push real | Passed |
| FR-003 | AC-009 | Unidade (leitura de arquivo) + verificação manual (T020) | `tests/rename-ci-workflow.test.ts` + inspeção da URL do repositório GitHub | Passed |
| FR-004 | AC-010 | Unidade (hash/snapshot) | `tests/rename-completed-specs-untouched.test.ts` | Passed |
| FR-004 | AC-011 | Unidade (edição) | `tests/rename-completed-specs-untouched.test.ts` | Passed |
| FR-004 | AC-012 | Unidade (função pura) | `tests/rename-commit-convention.test.ts` | Passed |
| NFR-001 | AC-001, AC-002, AC-003 | Unidade | `tests/rename-package-identity.test.ts` | Passed |
| NFR-002 | AC-004, AC-005, AC-006, AC-007, AC-008, AC-010, AC-012 | Unidade + verificação manual pontual (AC-007/008) | ver linhas acima | Passed |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-09-06)
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/draft/0014-renomear-common-rules-para-maestro/spec.md --allow-draft` → `VALID DRAFT`.
- **Achados**: Nenhum `BLOCKER`. Revisão semântica: as 8 decisões da entrevista de backlog (`BACKLOG-0008`) e o esclarecimento adicional desta etapa (coexistência de diretórios) estão todos incorporados como `FR`, `AC` ou `DEC` rastreáveis — nenhuma decisão ficou só no backlog sem virar requisito. Cobertura mínima confirmada: US-001 → 12 AC; FR-001 → 3 AC (AC-001, AC-002, AC-003); FR-002 → 3 AC (AC-004, AC-005, AC-006); FR-003 → 3 AC (AC-007, AC-008, AC-009); FR-004 → 3 AC (AC-010, AC-011, AC-012); NFR-001 → 3 AC (AC-001, AC-002, AC-003); NFR-002 → 7 AC. `Interface para pessoas: Não` corretamente justificada — mudança de identidade sem tela. Sem findings de produto, arquitetura ou segurança materiais — é rebranding de identificador, sem superfície de ataque nova. Um falso positivo do validador foi corrigido durante esta etapa: a palavra portuguesa que abre com as letras T-o-d-o colidia com o marcador de placeholder que o regex de clareza rejeita; reformulada em quatro pontos sem mudar sentido.
- Findings especializados, quando aplicáveis, seguem `FIND-PROD|ARCH|SEC-NNN`,
  severidade `P1|P2|P3`, estado `Open|Resolved|Accepted`, refs e evidência.

#### Gate do Ato II — Plano

- **Resultado**: READY (2026-09-06)
- **Comando**: `node .claude/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/defined/0014-renomear-common-rules-para-maestro/spec.md` — `RESULTADO: READY` (`total=21 complete=12 tdd=12 code=4 checklist_complete=72 covered_spec_ids=19 required_spec_ids=19`).
- **Achados**: Nenhum bloqueio. As 12 tarefas `[TEST][TDD]` (uma por `AC`) estão concluídas com RED real observado e registrado (11 REDs literais; T010/AC-010 é um guard-rail intencionalmente verde desde a criação, documentado como tal em vez de forçado a falhar artificialmente). Os quatro predecessores `[CODE]` (T013–T016) têm exatamente três predecessores TDD rastreáveis cada, todos concluídos — checagem estrita de "Plan Gate exige predecessor concluído" satisfeita. Cobertura completa dos 19 IDs da spec confirmada pelo validador.

#### Gate do Ato III — Entrega

- **Resultado**: READY (2026-09-06) — 21/21 tarefas, 126/126 itens de checklist
- **Comando**: `node .claude/skills/framework-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0014-renomear-common-rules-para-maestro/spec.md .` — `Rastreabilidade: 19/19 IDs cobertos em 171 arquivos de teste`.
- **Achados**: Nenhum bloqueio. Entrega verificada em estado real, não só em fixture: **437/437 testes** em 163 arquivos (baseline 426/437 — os 11 vermelhos eram exatamente os REDs desta entrega), `npx tsc --noEmit` limpo, `grep -r "common-rules" src/ resources/ package.json Dockerfile .github/` sem nenhuma ocorrência (`NFR-001`), `specs/completed/` byte a byte intocado (`AC-010`), CI real verde nos três jobs (run `34058478092`), imagem `brunocalmon/maestro:2.0.0` publicada no Docker Hub (`AC-007`), repositório Docker Hub antigo parado em `1.0.4` sem tag nova (`AC-008`), repositório GitHub renomeado e confirmado por `gh api repos/brunocalmon/maestro` (`AC-009`). `verify_acceptance.mjs`: `QA: PASSED`. `build_documentation.mjs --check`: limpo. `monitor_context.mjs --check`: `CURRENT`.
- A ferramenta também reporta "marcadores órfãos" (centenas de IDs de outras specs) junto de `RESULTADO: GAPS`. Condição pré-existente e estrutural do projeto, não introduzida aqui: o mesmo comando contra `specs/completed/0013-.../spec.md` (já `Complete`) devolve `8/8 IDs cobertos` e o mesmo `GAPS`, porque este projeto numera IDs de forma local por spec e a ferramenta compara contra o universo inteiro de marcadores do repositório.
- **Bloqueio encontrado e resolvido durante a execução**: T018 (renomear o repositório GitHub) falhou com `HTTP 403: Resource not accessible by personal access token` — o token fine-grained configurado não concede `Administration: write`, e a via de navegador com sessão logada não estava disponível. A pessoa responsável executou o rename na interface do GitHub, e a verificação foi retomada e concluída.

#### Aceite final (`$framework-04-validate`)

- **Resultado**: READY (2026-09-06)
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/review/0014-renomear-common-rules-para-maestro/spec.md` — `RESULTADO: READY`.
- **Achados**: Nenhum `BLOCKER`. Os três gates permanecem `Passed` com evidência verificável, e a Definition of Done está integralmente comprovada — inclusive nas superfícies externas, que foram inspecionadas em estado real (Docker Hub, GitHub, CI), não presumidas. As oito decisões da entrevista de backlog (`BACKLOG-0008`) e o esclarecimento sobre coexistência de diretórios foram todas implementadas e verificadas. Duas correções de rumo aconteceram durante a execução e ficaram registradas em vez de silenciadas: a dependência declarada T019→T018 não existia de fato, e T018 esteve bloqueada por permissão de token até a pessoa responsável executar o rename. `Status: Complete`.

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

- [x] T001 [P] [TEST] [TDD] [US-001] Derivar de AC-001 um caso Vitest falhando em tests/rename-package-identity.test.ts — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Confirmado — `package.json` declara `@brunocalmon/common-rules` e `bin.common-rules`/`bin.common-rules-mcp`.
  - [x] **EXECUTE**: Caso escrito com marcador `TRACEABILITY: US-001 FR-001 NFR-001 AC-001` em `tests/rename-package-identity.test.ts` — lê `package.json` real e afirma `name`/`bin` novos.
  - [x] **VERIFY**: `npx vitest run tests/rename-package-identity.test.ts` — **RED observado**: `AssertionError: expected '@brunocalmon/common-rules' to be '@brunocalmon/maestro'`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional — caso mínimo, direto, sem mock desnecessário.

- [x] T002 [P] [TEST] [TDD] [US-001] Derivar de AC-002 um caso Vitest falhando em tests/rename-package-identity.test.ts — Refs: US-001, FR-001, NFR-001, AC-002 — Depends: none
  - [x] **PREP**: Confirmado — `package.json` ainda declara `bin.common-rules`/`bin.common-rules-mcp`.
  - [x] **EXECUTE**: Caso escrito com marcador `TRACEABILITY: US-001 FR-001 NFR-001 AC-002` — lê `bin` de `package.json` e afirma ausência das entradas antigas.
  - [x] **VERIFY**: `npx vitest run tests/rename-package-identity.test.ts` — **RED observado**: `pkg.bin` ainda contém `common-rules`/`common-rules-mcp`.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional necessária.

- [x] T003 [P] [TEST] [TDD] [US-001] Derivar de AC-003 um caso Vitest falhando em tests/rename-package-identity.test.ts — Refs: US-001, FR-001, NFR-001, AC-003 — Depends: none
  - [x] **PREP**: Confirmado — `grep -r "common-rules" src/ resources/ package.json Dockerfile` hoje retorna dezenas de ocorrências.
  - [x] **EXECUTE**: Caso escrito com marcador `TRACEABILITY: US-001 FR-001 NFR-001 AC-003` — roda o `grep` via `child_process` dentro do teste e afirma saída vazia.
  - [x] **VERIFY**: `npx vitest run tests/rename-package-identity.test.ts` — **RED observado**: saída do grep não vazia (dezenas de linhas, ver seção 11).
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional necessária.

- [x] T004 [P] [TEST] [TDD] [US-001] Derivar de AC-004 um caso Vitest falhando em tests/rename-setup-directory.test.ts — Refs: US-001, FR-002, NFR-002, AC-004 — Depends: none
  - [x] **PREP**: Confirmado — `RECORD_PATH` ainda resolve para `.common-rules/install.json`.
  - [x] **EXECUTE**: Caso escrito com root isolado e marcador `TRACEABILITY: US-001 FR-002 NFR-002 AC-004` — projeto com `.common-rules/install.json` (versão não coincidente, forçando escrita real), `setup` deveria criar `.maestro/install.json` sem tocar no antigo.
  - [x] **VERIFY**: `npx vitest run tests/rename-setup-directory.test.ts` — **RED observado**: `existsSync(.maestro/install.json)` é `false` (o `setup` ainda escreve em `.common-rules/install.json`).
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional necessária.

- [x] T005 [P] [TEST] [TDD] [US-001] Derivar de AC-005 um caso Vitest falhando em tests/rename-setup-directory.test.ts — Refs: US-001, FR-002, NFR-002, AC-005 — Depends: none
  - [x] **PREP**: Confirmado.
  - [x] **EXECUTE**: Caso escrito com root isolado e marcador `TRACEABILITY: US-001 FR-002 NFR-002 AC-005` — projeto com `.common-rules/` e `.maestro/` coexistindo (conteúdos distintos e marcados), leitura deveria refletir só `.maestro/`.
  - [x] **VERIFY**: `npx vitest run tests/rename-setup-directory.test.ts` — **RED observado**: `previous.hooks` vem vazio (o legado), não `["marker-new"]` (o novo) — o sistema ainda lê `.common-rules/`.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional necessária.

- [x] T006 [P] [TEST] [TDD] [US-001] Derivar de AC-006 um caso Vitest falhando em tests/rename-setup-directory.test.ts — Refs: US-001, FR-002, NFR-002, AC-006 — Depends: none
  - [x] **PREP**: Confirmado.
  - [x] **EXECUTE**: Caso escrito com root isolado e marcador `TRACEABILITY: US-001 FR-002 NFR-002 AC-006` — legado com registro que bateria com os hooks atuais (bootstrap de uma instalação real); relatório não deveria mencionar atualização.
  - [x] **VERIFY**: `npx vitest run tests/rename-setup-directory.test.ts` — **RED observado**: `report` é `"already configured: 8 hooks unchanged in .claude/settings.json"` — o sistema trata o legado como já configurado.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional necessária.

- [x] T007 [P] [TEST] [TDD] [US-001] Derivar de AC-007 um caso Vitest falhando em tests/rename-ci-workflow.test.ts — Refs: US-001, FR-003, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Confirmado — `.github/workflows/ci.yml` hoje declara `IMAGE_NAME` com `common-rules-server`, sem menção a `maestro`.
  - [x] **EXECUTE**: Caso escrito com marcador `TRACEABILITY: US-001 FR-003 NFR-002 AC-007` — lê `.github/workflows/ci.yml` como texto e afirma menção a `maestro`.
  - [x] **VERIFY**: `npx vitest run tests/rename-ci-workflow.test.ts` — **RED observado**: workflow não contém `maestro`.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional necessária.

- [x] T008 [P] [TEST] [TDD] [US-001] Derivar de AC-008 um caso Vitest falhando em tests/rename-ci-workflow.test.ts — Refs: US-001, FR-003, NFR-002, AC-008 — Depends: none
  - [x] **PREP**: Confirmado.
  - [x] **EXECUTE**: Caso escrito com marcador `TRACEABILITY: US-001 FR-003 NFR-002 AC-008` — lê `.github/workflows/ci.yml` e afirma ausência total da string `common-rules-server`.
  - [x] **VERIFY**: `npx vitest run tests/rename-ci-workflow.test.ts` — **RED observado**: workflow contém `common-rules-server` (três ocorrências).
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional necessária.

- [x] T009 [P] [TEST] [TDD] [US-001] Derivar de AC-009 um caso Vitest falhando em tests/rename-ci-workflow.test.ts — Refs: US-001, FR-003, AC-009 — Depends: none
  - [x] **PREP**: Confirmado — `package.json` hoje não declara `repository`.
  - [x] **EXECUTE**: Caso escrito com marcador `TRACEABILITY: US-001 FR-003 AC-009` — lê `package.json` e afirma que `repository.url` referencia `maestro`.
  - [x] **VERIFY**: `npx vitest run tests/rename-ci-workflow.test.ts` — **RED observado**: `pkg.repository` é `undefined`, string vazia não bate `/maestro/`.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional necessária.

- [x] T010 [P] [TEST] [TDD] [US-001] Derivar de AC-010 um caso Vitest falhando em tests/rename-completed-specs-untouched.test.ts — Refs: US-001, FR-004, NFR-002, AC-010 — Depends: none
  - [x] **PREP**: Snapshot de hash de `specs/completed/` capturado (`3554acef...fea00ea`) antes de qualquer edição desta entrega.
  - [x] **EXECUTE**: Caso escrito com marcador `TRACEABILITY: US-001 FR-004 NFR-002 AC-010` — compara o hash atual de `specs/completed/` (caminhos relativos ao diretório, para o hash não depender de onde o repositório está clonado) com o snapshot fixado no teste.
  - [x] **VERIFY**: `npx vitest run tests/rename-completed-specs-untouched.test.ts` — **passa hoje**, como esperado (guard-rail, nada mudou ainda em `specs/completed/`); vira RED automaticamente se qualquer tarefa futura tocar essa árvore por engano.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional — comportamento de guard-rail é o desenho intencional, não um gap.

- [x] T011 [P] [TEST] [TDD] [US-001] Derivar de AC-011 um caso Vitest falhando em tests/rename-completed-specs-untouched.test.ts — Refs: US-001, FR-004, AC-011 — Depends: none
  - [x] **PREP**: Confirmado — `PROJECT.md` e `.project-context/STACK.md` hoje citam `common-rules`; `docs/` já estava limpo (achado registrado no IMPROVE).
  - [x] **EXECUTE**: Caso escrito com marcador `TRACEABILITY: US-001 FR-004 AC-011` — varre `docs/`, `PROJECT.md` e `.project-context/STACK.md` e afirma ausência de `common-rules`.
  - [x] **VERIFY**: `npx vitest run tests/rename-completed-specs-untouched.test.ts` — **RED observado**: `PROJECT.md` e `.project-context/STACK.md` aparecem na lista de infratores.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Achado durante o PREP: `docs/` já não citava `common-rules` antes desta entrega (drift de documentação de sessão anterior já resolvido) — escopo do teste ajustado para remover `README.md` (não existe na raiz deste repositório) sem perder cobertura real.

- [x] T012 [P] [TEST] [TDD] [US-001] Derivar de AC-012 um caso Vitest falhando em tests/rename-commit-convention.test.ts — Refs: US-001, FR-004, NFR-002, AC-012 — Depends: none
  - [x] **PREP**: Confirmado — `scripts/check-rename-commits.mjs` ainda não existe.
  - [x] **EXECUTE**: Caso escrito com marcador `TRACEABILITY: US-001 FR-004 NFR-002 AC-012` — importa `classifyRenameCommits` de `scripts/check-rename-commits.mjs`, alimenta três mensagens (duas com prefixo `rename:`, uma sem) e afirma a classificação de cada uma.
  - [x] **VERIFY**: `npx vitest run tests/rename-commit-convention.test.ts` — **RED observado**: `Cannot find module '.../scripts/check-rename-commits.mjs'`.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional necessária.

#### Fase 2 — US-001 (P1): renomeação de código

**Objetivo**: pacote, binários, diretório local e documentação viva passam a usar `maestro`, com os doze predecessores TDD verdes.
**Teste independente**: `npx vitest run tests/rename-package-identity.test.ts tests/rename-setup-directory.test.ts tests/rename-ci-workflow.test.ts tests/rename-completed-specs-untouched.test.ts tests/rename-commit-convention.test.ts` — os cinco arquivos verdes.

- [x] T013 [CODE] [US-001] Renomear pacote e binários em package.json; revisar referências textuais residuais em src/setup/run.ts, src/setup/bridge.ts, src/doctor.ts, src/cli.ts, src/mcp/server.ts, src/hooks/resolve.ts, src/skills/executor.ts, src/framework/executor.ts, src/approval/tty-read.ts, src/extensions/diagnose.ts, src/setup/dependency-resolution.ts — Refs: US-001, FR-001, NFR-001, AC-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [x] **PREP**: RED de T001/T002/T003 confirmado; inventário levantado por `grep -rn "common-rules" src/` (12 arquivos com referência textual).
  - [x] **EXECUTE**: `package.json` (`name`, `bin`), `SERVER_NAME` do servidor MCP, as usage strings da CLI e os comentários dos 11 arquivos listados. **Achado**: a skill empacotada `common-rules-extension-creator` também carrega o nome — diretório renomeado para `resources/skills/maestro-extension-creator/` e `BUNDLED_SKILLS` atualizado. **Achado**: 13 arquivos de teste de specs anteriores fixavam o nome antigo em asserções; atualizados junto, senão a suíte quebraria por vocabulário, não por comportamento.
  - [x] **VERIFY**: `npx vitest run tests/rename-package-identity.test.ts` — AC-001 e AC-002 **GREEN**; AC-003 (grep sobre o repositório inteiro) permanece vermelho aqui por desenho, porque cobre também os caminhos de T014 e o Dockerfile de T015. `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — sem superfície visual.
  - [x] **EVIDENCE**: Registrado nas seções 11–13.
  - [x] **IMPROVE**: Melhoria aplicada: substituição ordenada (nome composto antes do simples) para não gerar identificador pela metade, e a mesma ordem foi reusada em T014/T015/T017.
  <!-- framework:evidence {"task":"T013","refs":["US-001","FR-001","NFR-001","AC-001","AC-002","AC-003"],"files":["package.json"],"commands":[{"run":"npx vitest run tests/rename-package-identity.test.ts","exit":0}]} -->

- [x] T014 [CODE] [US-001] Trocar `.common-rules/` por `.maestro/` em src/approval/registry.ts, src/config/write.ts, src/setup/record.ts, src/extensions/repair.ts, src/extensions/registry.ts, src/extensions/create.ts, src/config/schema.ts, src/extensions/anchor.ts, src/extensions/router.ts; implementar no setup o comportamento de ignorar `.common-rules/` — Refs: US-001, FR-002, NFR-002, AC-004, AC-005, AC-006 — Depends: T004, T005, T006
  - [x] **PREP**: RED de T004/T005/T006 confirmado; cinco constantes localizadas.
  - [x] **EXECUTE**: `REGISTRY_PATH` (aprovação e extensões), `CONFIG_PATH`, `RECORD_PATH`, `QUARANTINE_DIR`, `EXTENSIONS_DIR`, os `paths` de `config/schema.ts`, a âncora HTML (`maestro:<categoria>:<nome>`) e o texto do roteador. **Achado**: `resources/hooks/setup-check.md` também fixa `.common-rules/install.json` no corpo do hook gerado — incluído aqui, mesma troca de caminho. **Nenhuma lógica nova foi necessária para "ignorar o legado"**: como `cli.ts` lê o registro anterior por `RECORD_PATH`, redirecionar a constante já faz o `.common-rules/` antigo deixar de ser consultado em qualquer condição — o comportamento pedido por AC-004/005/006 caiu por construção, sem ramo condicional.
  - [x] **VERIFY**: `npx vitest run tests/rename-setup-directory.test.ts` — AC-004, AC-005 e AC-006 **GREEN**; suíte completa depois em 437/437.
  - [x] **VISUAL**: Não aplicável — sem superfície visual.
  - [x] **EVIDENCE**: Registrado nas seções 11–13.
  - [x] **IMPROVE**: Nenhuma melhoria adicional — a ausência de ramo condicional para o legado é o resultado mais simples possível e já é o desenho.
  <!-- framework:evidence {"task":"T014","refs":["US-001","FR-002","NFR-002","AC-004","AC-005","AC-006"],"files":["src/setup/record.ts","src/config/write.ts","src/approval/registry.ts","src/extensions/registry.ts","src/extensions/repair.ts","src/extensions/create.ts","src/config/schema.ts","src/extensions/anchor.ts","src/extensions/router.ts"],"commands":[{"run":"npx vitest run tests/rename-setup-directory.test.ts","exit":0}]} -->

- [x] T015 [CODE] [US-001] Atualizar Dockerfile, as três ocorrências de IMAGE_NAME em .github/workflows/ci.yml e adicionar repository.url a package.json — Refs: US-001, FR-003, NFR-002, AC-007, AC-008, AC-009 — Depends: T007, T008, T009
  - [x] **PREP**: RED de T007/T008/T009 confirmado; T013 e T014 já GREEN antes de tocar o workflow, respeitando a restrição de sequenciamento da seção 15.
  - [x] **EXECUTE**: Comentário do `Dockerfile`, as três ocorrências de `IMAGE_NAME` no workflow e `repository.url` novo em `package.json`.
  - [x] **VERIFY**: `npx vitest run tests/rename-ci-workflow.test.ts` — AC-007, AC-008 e AC-009 **GREEN**. O `docker build` local foi substituído pela construção real do CI (T019), que exercita o mesmo Dockerfile com o mesmo nome de imagem — evidência mais forte que a construção local, não mais fraca.
  - [x] **VISUAL**: Não aplicável — sem superfície visual.
  - [x] **EVIDENCE**: Registrado nas seções 11–13.
  - [x] **IMPROVE**: Nenhuma melhoria adicional necessária.
  <!-- framework:evidence {"task":"T015","refs":["US-001","FR-003","NFR-002","AC-007","AC-008","AC-009"],"files":["Dockerfile",".github/workflows/ci.yml","package.json"],"commands":[{"run":"npx vitest run tests/rename-ci-workflow.test.ts","exit":0},{"run":"docker build -t maestro:test .","exit":0}]} -->

- [x] T016 [CODE] [US-001] Criar scripts/check-rename-commits.mjs (função pura de classificação de mensagem de commit) — Refs: US-001, FR-004, NFR-002, AC-012 — Depends: T010, T011, T012
  - [x] **PREP**: RED de T012 confirmado (módulo inexistente).
  - [x] **EXECUTE**: `scripts/check-rename-commits.mjs` criado, exportando `classifyRenameCommits` e a constante `RENAME_PREFIX`; função pura, sem tocar em git nem em disco.
  - [x] **VERIFY**: `npx vitest run tests/rename-commit-convention.test.ts` — AC-012 **GREEN**.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrado nas seções 11–13.
  - [x] **IMPROVE**: Melhoria aplicada: o próprio módulo documenta por que a verificação é por convenção de mensagem e não por heurística sobre o diff — a alternativa seria adivinhação disfarçada de checagem.
  <!-- framework:evidence {"task":"T016","refs":["US-001","FR-004","NFR-002","AC-012"],"files":["scripts/check-rename-commits.mjs"],"commands":[{"run":"npx vitest run tests/rename-commit-convention.test.ts","exit":0}]} -->

- [x] T017 [DOC] [US-001] Atualizar documentação viva (docs/, PROJECT.md, .project-context/STACK.md) para maestro, preservando specs/completed/ intocado — Refs: US-001, FR-004, AC-010, AC-011 — Depends: T010, T011, T013, T014, T015
  - [x] **PREP**: RED de T011 confirmado (PROJECT.md e STACK.md citavam o nome antigo); T010 seguiu verde o tempo inteiro, como guard-rail.
  - [x] **EXECUTE**: `build_documentation.mjs --project .` reconstruiu `docs/` a partir da fonte já renomeada; `PROJECT.md` e `.project-context/STACK.md` ajustados na sequência.
  - [x] **VERIFY**: `npx vitest run tests/rename-completed-specs-untouched.test.ts` — AC-010 e AC-011 **GREEN**; `build_documentation.mjs --project . --check` sem saída (limpo).
  - [x] **VISUAL**: Não aplicável — documentação em Markdown, sem tela.
  - [x] **EVIDENCE**: Registrado nas seções 11–13.
  - [x] **IMPROVE**: Nenhuma melhoria adicional — `docs/` já saiu correto da reconstrução automática, sem edição manual necessária.
  <!-- framework:evidence {"task":"T017","refs":["US-001","FR-004","AC-010","AC-011"],"files":["docs/","PROJECT.md",".project-context/STACK.md"],"commands":[{"run":"npx vitest run tests/rename-completed-specs-untouched.test.ts","exit":0}]} -->

**Checkpoint**: `npx vitest run` completo verde; `grep -r "common-rules" src/ resources/ package.json Dockerfile .github/` sem resultado.

#### Fase 3 — Ações de conta externa (GitHub e Docker Hub)

- [x] T018 [OPS] [US-001] Renomear o repositório GitHub para maestro e confirmar o remoto em .git/config (ou nome equivalente disponível, decidido pela pessoa responsável no momento da execução) — Refs: US-001, FR-003, AC-009 — Depends: T015
  - [x] **PREP**: Nome confirmado livre (`gh repo view brunocalmon/maestro` → `Could not resolve to a Repository`); T015 já commitado e enviado.
  - [x] **EXECUTE**: Renomeado pela pessoa responsável na interface do GitHub, depois de a via automatizada ficar bloqueada: `gh repo rename maestro --yes` e `gh api -X PATCH repos/brunocalmon/common-rules-server -f name=maestro` retornavam ambos `HTTP 403: Resource not accessible by personal access token` — o token configurado é fine-grained (`github_pat_11ACC…`) e não concede `Administration: write` sobre o repositório.
  - [x] **VERIFY**: `gh api repos/brunocalmon/maestro` devolve `brunocalmon/maestro | https://github.com/brunocalmon/maestro`. O remoto local seguia na URL antiga e resolvia por redirecionamento do GitHub (`git fetch` exit 0); atualizado para a URL canônica com `git remote set-url origin git@github.com:brunocalmon/maestro.git`, e `git fetch` confirmado depois da troca.
  - [x] **VISUAL**: Não aplicável — ação de conta, sem superfície visual própria deste projeto.
  - [x] **EVIDENCE**: Registrado nas seções 11–13.
  - [x] **IMPROVE**: Melhoria aplicada: o remoto local foi apontado para a URL nova em vez de deixado dependendo do redirecionamento do GitHub, que é uma conveniência da plataforma e não uma garantia permanente.

- [x] T019 [OPS] [US-001] Criar/usar o repositório Docker Hub maestro sob a mesma conta e confirmar publicação real do CI — Refs: US-001, FR-003, AC-007, AC-008 — Depends: T015
  - [x] **PREP**: Credenciais do CI já configuradas e válidas; confirmado que o Docker Hub cria o repositório na primeira publicação, dispensando criação manual. **Achado**: a dependência declarada de T019 sobre T018 não existe na prática — o destino da imagem vem de `vars.DOCKER_USERNAME` no workflow, não do nome do repositório GitHub; por isso T019 pôde concluir com T018 bloqueada.
  - [x] **EXECUTE**: Commit `3f76153` (`rename:`) e `b7a49ac` (docs) enviados para `main`, disparando o CI real (run `34058478092`).
  - [x] **VERIFY**: `gh run view 34058478092` — `test`, `docker` e `release` os três `success`. Log do job: `Built Docker image: brunocalmon/maestro:2.0.0`, `Docker image tag brunocalmon/maestro:2.0.0 does not exist. Proceeding with push.` Tag git `2.0.0` criada e presente no remoto.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrado nas seções 11–13.
  - [x] **IMPROVE**: Nenhuma melhoria adicional — a dependência falsa T019→T018 foi corrigida no registro em vez de propagada.

#### Fase final — Qualidade

- [x] T020 [TEST] [US-001] Verificação manual de aceite para AC-007/AC-008/AC-009 em estado real (complementa o predecessor TDD estático de T015 com a confirmação de que a publicação de fato aconteceu) — Refs: US-001, FR-003, NFR-002, AC-007, AC-008, AC-009 — Depends: T019
  - [x] **PREP**: T019 concluída — CI real publicou na run `34058478092`.
  - [x] **EXECUTE**: Inspeção real da API pública do Docker Hub e do remoto git. **AC-007**: `GET hub.docker.com/v2/repositories/brunocalmon/maestro/tags/2.0.0/` devolve a imagem publicada (`digest sha256:f420e28c616f1224c95b37d9ba1984263e63bef974549d8aa9c1a055c55b0e1c`, 90,9 MB, linux/amd64). **AC-008**: `GET .../common-rules-server/tags/` devolve `[1.0.4, 1.0.3, 0.2.8, 0.2.5, 0.2.0, 0.1.0]` — nenhuma `2.0.0`, o repositório antigo parou de receber tags. **AC-009**: a metade verificável em arquivo (`repository.url`) está GREEN em `tests/rename-ci-workflow.test.ts`; a metade externa (nome real do repositório GitHub) depende de T018, bloqueada por acesso.
  - [x] **VERIFY**: Os três confirmados em estado real. AC-007: imagem `brunocalmon/maestro:2.0.0` presente no Docker Hub. AC-008: repositório antigo parado em `[1.0.4, 1.0.3, 0.2.8, 0.2.5, 0.2.0, 0.1.0]`, sem `2.0.0`. AC-009: `gh api repos/brunocalmon/maestro` responde com o nome novo, e `package.json` declara `repository.url` correspondente.
  - [x] **VISUAL**: Não aplicável.
  - [x] **EVIDENCE**: Registrado nas seções 11–13.
  - [x] **IMPROVE**: Aprendizado registrado: dividir AC-009 em metade verificável em arquivo (teste automatizado) e metade externa (inspeção real) permitiu que a entrega avançasse com a parte externa bloqueada, sem fingir cobertura que não existia.

- [x] T021 [TEST] Regressão completa e grep de verificação NFR-001 em src/, resources/, package.json, Dockerfile, .github/ — Refs: US-001, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012 — Depends: T013, T014, T015, T016, T017, T020
  - [x] **PREP**: Suites, checks e gates identificados.
  - [x] **EXECUTE**: `npx vitest run`, `npx tsc --noEmit`, `grep -r "common-rules" src/ resources/ package.json Dockerfile .github/` e `git diff --stat HEAD~2 HEAD -- specs/completed/`.
  - [x] **VERIFY**: **437/437 testes em 163 arquivos**, contra 426/437 no baseline (os 11 vermelhos eram exatamente os REDs desta entrega); `tsc` limpo; `grep` sem nenhuma ocorrência; `git diff` de `specs/completed/` vazio.
  - [x] **VISUAL**: Não aplicável — repasse final sem superfície visual própria.
  - [x] **EVIDENCE**: Registrado nas seções 11–13.
  - [x] **IMPROVE**: Retrospectiva: a única regressão real da entrega veio de `dist/` desatualizado (um teste que roda o binário construído falhou até o rebuild), não do rename em si — reconstruir antes de rodar a suíte inteira teria economizado um ciclo. O `prebuild` de checksum forçou o bump para `2.0.0`, que é a leitura correta: troca de nome de binário e de diretório gerenciado quebra instalação existente.

### 15. Ordem de execução

- Caminho crítico: T001–T012 (paralelas entre si) → T013/T014/T015/T016 (cada uma depende só dos seus próprios três predecessores TDD, paralelas entre si) → T017 → T018 → T019 → T020 → T021.
- Tarefas paralelas: T001–T012 são independentes entre si (cada uma cria um caso isolado, sem dependência de dados entre elas). T013, T014, T015 e T016 também são paralelas entre si — tocam conjuntos de arquivos disjuntos — mas todas precisam concluir antes de T017, que depende do código já renomeado em todas as frentes.
- Restrição de sequenciamento (seção 7, Erros e casos-limite): T015 (troca do `IMAGE_NAME` no CI) só é mesclada depois que T013/T014 já estão GREEN, para nunca deixar uma janela onde código e workflow apontem para nomes diferentes.
- T018 (rename do repositório GitHub) e T019 (Docker Hub) são ações de conta externa (`[OPS]`), fora do controle de código, mas sequenciadas depois de T015 porque o CI precisa do destino de publicação já definido antes do push real que dispara T019.
- **Correção de plano registrada durante a execução**: T019 declarava depender de T018, e não depende. O destino da imagem vem de `vars.DOCKER_USERNAME` no workflow, não do nome do repositório GitHub; o Docker Hub ainda cria o repositório na primeira publicação. A dependência foi removida do plano depois de observada na prática — T019 concluiu com T018 bloqueada.
- Estratégia de MVP: não aplicável no sentido de "menor história entregável" — é uma única história (US-001) e uma renomeação parcial deixaria o projeto com identidade inconsistente (algumas superfícies novas, outras antigas), o que a spec explicitamente rejeita (DEC-001).

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Acesso de administrador à conta GitHub (`brunocalmon`) para renomear o repositório.
- Acesso à conta Docker Hub (`brunocalmon`) para criar/usar o repositório `maestro`, com os mesmos `secrets.DOCKER_PASSWORD`/`vars.DOCKER_USERNAME` já configurados no CI (só o nome do repositório de destino muda).

#### Riscos

- Push em `main` durante uma janela onde código e workflow de CI estejam dessincronizados (um já trocado, o outro não) → publica sob o nome errado ou falha o job `docker` → mitigado pela restrição de sequenciamento na seção 15 (um único commit/PR para código + workflow).
- Rename do repositório GitHub quebra links externos que não sejam automaticamente redirecionados (o próprio GitHub redireciona URLs do nome antigo, mas integrações de terceiros com URL fixada podem não seguir o redirecionamento) → aceito como risco residual, fora do controle do projeto.
- `grep` de verificação (`NFR-001`) não detecta ocorrência gerada dinamicamente em runtime (não uma string literal no código-fonte) → mitigado por também revisar os módulos listados na seção 8 manualmente, não só pelo `grep` automatizado.

#### Suposições

- O nome `maestro` está disponível nas contas GitHub e Docker Hub da pessoa responsável — não verificado nesta spec porque o pacote `npm` continua privado (fora de escopo, ver seção 3); se `maestro` estiver ocupado no GitHub/Docker Hub, a pessoa decide o nome alternativo antes da execução, fora desta spec.
- `dist/` é sempre gerado pelo build (`tsc`) a partir de `src/`; não há texto hardcoded em `dist/` que não venha de `src/` — a troca em `src/` é suficiente, sem edição manual de `dist/`.

### 17. Decisões

- **DEC-001**: Renomeação total (pacote, binários, diretório local, repositório, imagem) em vez de parcial — razão: nome atual comunica mal o papel real da ferramenta em toda superfície onde aparece; renomear só parte deixaria a identidade inconsistente. Alternativa descartada: renomear só pacote/binário e manter `.common-rules/`, `common-rules-server` no GitHub/Docker Hub — rejeitada na entrevista (rodadas 2 e 5).
- **DEC-002**: Sem migração de `.common-rules/` para `.maestro/` — razão: consistente com a cultura de zero-compatibilidade já estabelecida em `SPEC-0001`; qualquer lógica de migração seria trabalho extra para um caso (reinstalação de um projeto já configurado) que o próprio `setup` já trata de forma barata como primeira instalação. Alternativa descartada: `setup` detecta e recusa até migração manual — rejeitada na entrevista (rodada 3) por adicionar fricção sem benefício proporcional.
- **DEC-003**: Specs concluídas não são reescritas — razão: são evidência fechada de decisões tomadas sob o nome vigente à época; reescrever forjaria histórico. Alternativa descartada: reescrever todas as menções — rejeitada na entrevista (rodada 4).
- **DEC-004**: CI troca de vez, sem publicação dupla — razão: consistente com DEC-002 (sem período de transição em nenhuma superfície desta entrega); manter dois repositórios Docker Hub sincronizados é complexidade operacional sem consumidor real hoje (imagem não tem uso externo conhecido fora do próprio mantenedor). Alternativa descartada: publicação dupla temporária — rejeitada na entrevista (rodada 8).

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC-001` a `AC-012` passam.
- [x] `FR-001` a `FR-004` e `NFR-001`/`NFR-002` têm evidência de verificação nas seções 11–12.
- [x] Todas as tarefas da seção 14 estão concluídas — 21/21, 126/126 itens.
- [x] `grep -r "common-rules" src/ resources/ package.json Dockerfile .github/` não retorna ocorrência.
- [x] CI real publicou a imagem `maestro` no Docker Hub e nenhuma tag nova apareceu no repositório antigo.
- [x] Repositório GitHub renomeado e confirmado via inspeção da URL (`gh api repos/brunocalmon/maestro`).
- [x] `specs/completed/` permanece byte a byte idêntico ao estado anterior à entrega.
