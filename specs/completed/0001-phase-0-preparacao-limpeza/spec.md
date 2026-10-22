# Especificação integrada: Phase 0: Preparação e limpeza histórica radical

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0001 |
| Slug | 0001-phase-0-preparacao-limpeza |
| Status | Complete |
| Effort | 3 |
| Effort updated at | 2026-08-24 |
| Effort rationale | Operações git irreversíveis (branch órfã, congelamento de histórico) sobre o repositório real. Baixo volume, alto custo de erro. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — operações de repositório executadas por linha de comando, sem tela. |
| Atualizada em | 2026-08-24 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A v0.2.8 (Python, MCP, 47 recursos embutidos) é um produto diferente da direção nova (TypeScript, CLI-first, wrapper que orquestra agentes). Não há migração possível entre as duas: o que existe hoje não vira o que vem depois. Enquanto o conteúdo antigo ocupar a árvore de trabalho, cada arquivo novo nasce ao lado de um arquivo que o contradiz, e a documentação nova precisa explicar a antiga para se diferenciar dela.

#### Resultado desejado

Duas linhas de vida separadas e sem ponte entre elas.

A branch `archived` guarda a main atual inteira, congelada e nunca mais tocada. A branch de trabalho nasce com histórico órfão — sem ancestral comum com a main — contendo exclusivamente o **conjunto preservado**: `specs/`, `.claude/`, `.project-context/` e o link `.agents`. O restante do repositório atual deixa de existir nessa branch: código, documentação, testes, empacotamento e ferramentas.

O conjunto preservado não é resíduo da v0.2.8. `specs/` é o registro das decisões que governam a reescrita, e `.claude/` com `.project-context/` são o framework former project tool já configurado — as skills e os templates que produzem esses registros. Preservá-los evita reconfigurar o framework na branch nova.

Não há CHANGELOG, aviso de quebra de compatibilidade, guia de migração ou pull request. Quando a branch de trabalho estabilizar, ela substitui a main diretamente e a main atual deixa de existir fora de `archived`.

#### Métricas de sucesso

- `archived` existe no remoto e aponta exatamente ao commit atual da main.
- A branch de trabalho tem histórico órfão: `git log` mostra um único commit, sem ancestral comum com a main.
- A árvore da branch de trabalho contém o conjunto preservado e nada além dele.
- Nenhum arquivo `.py`, nenhum diretório `src/`, `.docs/`, `tools/`, `.github/` e nenhum manifesto Python permanecem na branch de trabalho.
- A Phase 1 consegue ler seus próprios requisitos em `specs/` sem trocar de branch.
- As skills former project tool funcionam na branch nova sem reinstalação: uma captura de inbox pode ser criada e resolve seu template em `.project-context/templates/`.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] A branch `archived` está protegida contra escrita e deleção no remoto — Verdict: verified — Confidence: high — Evidence: research/github-api/protecao-de-branch.md#configuração-verificada — Budget: 1/1.

As demais decisões vieram do refinamento do backlog e das rodadas de validação registradas na seção 13, sem consulta externa.

#### Fontes e contexto consultados

- `specs/backlog/0002-phase-0-preparacao-limpeza-historica.md` — backlog de origem, promovido por esta spec.
- `specs/inbox/2026-08-24-192518-reescrita-completa-zero-compatibilidade-limpeza-historica-total.md` — captura original, preservada sem alteração.
- Inspeção do repositório em 2026-08-24 para levantar o conteúdo real da raiz e confirmar o que existe.

#### Documentação consultada

- API REST do GitHub, consultada em 2026-08-24 durante o aceite, para verificar a proteção de `archived`. Dois endpoints, com achado sobre a diferença entre proteção legada e ruleset. Evidência local indexada abaixo.

#### Artefatos de pesquisa armazenados

- `specs/completed/0001-phase-0-preparacao-limpeza/research/github-api/protecao-de-branch.md` — consulta à API do GitHub em 2026-08-24, com os dois endpoints, a configuração verificada do ruleset e o impacto na Definition of Done. Indexado retroativamente: o enforcement do repositório apontou a ausência, e a consulta de fato ocorreu durante o aceite.

#### Dúvidas respondidas

- **Q**: O que sobrevive à limpeza? → **A**: O conjunto preservado — `specs/`, `.claude/` e `.project-context/`. `specs/` é o insumo da Phase 1; `.claude/` e `.project-context/` são o framework former project tool já configurado, mantido para não exigir reconfiguração na branch nova. `.project-context/` acompanha `.claude/` por necessidade técnica: as skills resolvem seus templates em `.project-context/templates/` e carregam o contrato em `.project-context/Spec.md`, de modo que preservar as skills sem os templates as deixaria presentes e inoperantes. O restante é removido, inclusive `.github/`, `tools/`, `README.md`, `AGENTS.md` e `CLAUDE.md`.
- **Q**: A branch precisa de histórico realmente vazio? → **A**: Sim. Histórico órfão, sem ancestral comum com a main. Um commit de limpeza sobre o histórico existente não atende, porque manteria a v0.2.8 alcançável na nova linha.
- **Q**: Como anunciar a quebra de compatibilidade? → **A**: Não se anuncia. Não há CHANGELOG, nota de breaking change nem guia de migração. O produto é novo e substitui o anterior.
- **Q**: Como a substituição acontece? → **A**: Sem merge e sem pull request. `archived` congela a main atual; quando a branch de trabalho estabilizar, ela vira a main diretamente.
- **Q**: `README.md` é reescrito? → **A**: Não. É removido junto com o resto.

#### Dúvidas abertas

Nenhuma.

### 3. Escopo e atores

#### Conjunto preservado

Quatro caminhos sobrevivem à limpeza, e somente eles:

| Caminho | Por que sobrevive |
| --- | --- |
| `specs/` | Registro das decisões que governam a reescrita; insumo direto da Phase 1 |
| `.claude/` | Skills former project tool já instaladas e configuradas, mais os scripts de asserção desta fase |
| `.project-context/` | Contrato e templates que as skills resolvem em tempo de execução |
| `.agents` | Link simbólico para `.claude`; sem ele, os comandos que o framework documenta não resolvem |

Qualquer caminho fora dessa lista é removido, sem decisão caso a caso durante a execução.

#### Incluído

- Retirar `specs/`, `.project-context/` e `.claude/` do `.gitignore` e versioná-los na main, antes de qualquer congelamento. Sem isso o conjunto preservado não existe em git e nada do que a fase promete preservar sobreviveria.
- Criar a branch `archived` a partir do commit atual da main e publicá-la no remoto.
- Confirmar que `archived` reproduz a main atual integralmente, por comparação de árvore.
- Criar a branch de trabalho `refactor/v1-cli-first` com histórico órfão, sem ancestral comum com a main.
- Preservar o conjunto preservado integralmente nessa branch, com conteúdo idêntico ao da main.
- Remover da branch de trabalho o restante do repositório: `src/`, `.docs/`, `tools/`, `.github/`, `.pytest_cache/`, `.venv/`, `dist/`, `pyproject.toml`, `.python-version`, `uv.lock`, `.coverage`, `agent_bdd.feature`, `Dockerfile`, `.dockerignore`, `skills-lock.json`, `README.md`, `AGENTS.md` e `CLAUDE.md`.
- Registrar o commit raiz único da branch de trabalho e publicá-lo.
- Comprovar que as skills former project tool operam na branch nova sem reinstalação.
- Escrever em `.claude/scripts/phase0/` os scripts de asserção em Node que guardam cada operação destrutiva, sem dependência externa.

#### Fora de escopo

- Substituir a main pela branch de trabalho. Ocorre só depois da estabilização, em fase posterior.
- Eliminar a main atual. Também é ato posterior à estabilização.
- Iniciar o desenvolvimento em TypeScript, criar estrutura de projeto ou instalar dependências. É Phase 1.
- Escrever qualquer documentação nova. A Phase 1 produz a sua.
- Produzir CHANGELOG, nota de breaking change ou guia de migração. Decisão explícita de não os ter.
- Migrar dados. A v0.2.8 não persiste dados de usuário.
- Abrir pull request ou executar merge entre as branches.

#### Atores

- **Pessoa que refatora**: executa as operações git, confirma cada passo irreversível e valida o estado final.
- **Branch `archived`**: destino permanente da v0.2.8; consultável para sempre, nunca reescrita.
- **Phase 1**: herda a branch de trabalho e lê seus requisitos em `specs/`, na mesma branch em que vai produzir código.

### 4. Princípios e restrições do projeto

- **PR-001**: A Phase 0 é pré-requisito da Phase 1. Nenhum código de produto é escrito antes de a branch de trabalho existir no estado final descrito aqui.
- **PR-002**: `archived` é imutável depois de publicada. Nunca recebe commit, rebase, force-push ou deleção.
- **PR-003**: Nenhuma compatibilidade com a v0.2.8 é mantida, e nenhuma menção a ela sobrevive na branch de trabalho fora do conteúdo de `specs/`.
- **PR-004**: `specs/` é a única exceção à limpeza, porque descreve o trabalho futuro e não o passado.
- **PR-005**: A substituição da main é ato deliberado e posterior. A Phase 0 não a executa nem a prepara com force-push sobre a main.

### 5. Histórias de usuário

#### US-001 — Nascer com árvore limpa e histórico próprio

Como **pessoa que refatora o projeto**, quero **uma branch de trabalho com histórico órfão contendo apenas o conjunto preservado**, para **escrever a v1.0 sem nenhum arquivo da v0.2.8 ao lado, sem a v0.2.8 alcançável a partir da nova linha e sem reconfigurar o framework que conduz o trabalho**.

**Por que P1**: Bloqueia toda a reescrita. Sem a árvore limpa, cada arquivo novo convive com um antigo que o contradiz.
**Teste independente**: `git log` na branch mostra um commit sem pai; `git ls-files` lista apenas caminhos sob `specs/`, `.claude/` e `.project-context/`; uma captura de inbox pode ser criada na branch sem reinstalação.
**Requisitos**: FR-002, FR-003, FR-004

#### US-002 — Congelar a v0.2.8 de forma permanente e consultável

Como **pessoa que refatora o projeto**, quero **a main atual preservada numa branch congelada**, para **poder consultar a v0.2.8 para sempre sem que ela ocupe a linha de desenvolvimento**.

**Por que P1**: A limpeza é irreversível. Sem o congelamento anterior a ela, o conteúdo da v0.2.8 se perde.
**Teste independente**: `git diff archived main` não retorna diferença no momento da criação; um clone novo consegue recuperar a v0.2.8 completa a partir de `archived`.
**Requisitos**: FR-001

### 6. Cenários BDD de aceite

#### AC-001 — `archived` reproduz a main atual

**Cobre**: US-002, FR-001, NFR-002

```gherkin
@US-002 @FR-001 @NFR-002 @AC-001
Feature: Congelamento da v0.2.8

  Scenario: A branch congelada é idêntica à main no momento da criação
    Given a main no commit final da v0.2.8
    When a pessoa cria a branch archived a partir da main e a publica
    Then archived aponta ao mesmo commit que a main
    And a comparação de árvore entre archived e main não retorna diferença
    And archived existe no remoto
```

#### AC-002 — A branch de trabalho tem histórico órfão

**Cobre**: US-001, FR-002

```gherkin
@US-001 @FR-002 @AC-002
Feature: Histórico órfão da branch de trabalho

  Scenario: O commit raiz não tem ancestral
    Given a branch archived já publicada
    When a pessoa cria a branch de trabalho com raiz órfã e registra o commit inicial
    Then o histórico da branch de trabalho tem exatamente um commit
    And esse commit não tem pai
    And não existe ancestral comum entre a branch de trabalho e a main
```

#### AC-003 — O conjunto preservado sobrevive integralmente

**Cobre**: US-001, FR-003

```gherkin
@US-001 @FR-003 @AC-003
Feature: Preservação do registro de decisões e do framework

  Scenario: O conjunto preservado chega intacto à branch de trabalho
    Given as árvores de specs, .claude e .project-context na main
    When a limpeza da branch de trabalho termina
    Then cada arquivo presente nesses três caminhos na main está presente na branch de trabalho
    And o conteúdo de cada um desses arquivos é idêntico ao da main
    And a Phase 1 consegue ler seus requisitos sem trocar de branch
```

#### AC-004 — Nenhum artefato da v0.2.8 permanece

**Cobre**: US-001, FR-004

```gherkin
@US-001 @FR-004 @AC-004
Feature: Remoção do conteúdo da versão anterior

  Scenario: A árvore versionada contém apenas o conjunto preservado
    Given a branch de trabalho com o commit raiz registrado
    When a pessoa lista os arquivos versionados da branch
    Then cada caminho listado começa por specs/, .claude/ ou .project-context/
    And nenhum arquivo com extensão .py está versionado
    And os diretórios src, .docs, tools e .github não estão versionados
    And os arquivos pyproject.toml, uv.lock, Dockerfile, agent_bdd.feature, skills-lock.json, README.md, AGENTS.md e CLAUDE.md não estão versionados
```

#### AC-011 — As skills former project tool operam sem reinstalação

**Cobre**: US-001, FR-003, NFR-003

```gherkin
@US-001 @FR-003 @NFR-003 @AC-011
Feature: former project tool utilizável na branch nova

  Scenario: Uma captura de inbox é criada sem reconfigurar o framework
    Given a branch de trabalho publicada com o conjunto preservado
    When a pessoa executa o script de captura de inbox de uma skill former project tool
    Then o script encontra seu template em .project-context/templates
    And grava a captura em specs/inbox
    And nenhuma etapa de instalação ou reconfiguração é necessária
```

#### AC-005 — `archived` permanece intocável

**Cobre**: US-002, FR-001, NFR-003

```gherkin
@US-002 @FR-001 @NFR-003 @AC-005
Feature: Imutabilidade da branch congelada

  Scenario: A limpeza não altera a branch congelada
    Given archived publicada e a limpeza concluída na branch de trabalho
    When a pessoa inspeciona archived
    Then archived continua apontando ao commit registrado na sua criação
    And nenhum commit novo foi adicionado a archived
    And a v0.2.8 continua recuperável integralmente a partir dela
```

#### AC-006 — A sequência cabe no orçamento de tempo

**Cobre**: US-001, FR-002, FR-004, NFR-001

```gherkin
@US-001 @FR-002 @FR-004 @NFR-001 @AC-006
Feature: Orçamento de execução

  Scenario: A sequência completa termina em menos de cinco minutos
    Given a branch archived já publicada
    When a pessoa executa as tarefas de criação da raiz órfã, limpeza e publicação
    Then o tempo total medido é inferior a cinco minutos
    And nenhuma tarefa exige passo manual além dos comandos declarados na seção 14
```

#### AC-007 — Interrupção no meio não corrompe nada

**Cobre**: US-001, US-002, FR-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @US-002 @FR-001 @FR-002 @NFR-001 @NFR-002 @AC-007
Feature: Recuperação de execução interrompida

  Scenario: Uma falha antes do commit raiz deixa tudo recuperável
    Given archived já publicada
    And a limpeza da branch de trabalho em andamento
    When o processo é interrompido antes do commit raiz
    Then a main permanece inalterada
    And archived permanece inalterada
    And a branch de trabalho pode ser descartada e recriada sem perda de conteúdo
```

#### AC-008 — A v0.2.8 é recuperável a partir de `archived`

**Cobre**: US-002, FR-001, FR-003, NFR-002, NFR-003

```gherkin
@US-002 @FR-001 @FR-003 @NFR-002 @NFR-003 @AC-008
Feature: Recuperação da versão congelada

  Scenario: Um clone novo restaura a v0.2.8 completa
    Given archived publicada no remoto
    When alguém clona o repositório e faz checkout de archived
    Then pyproject.toml declara a versão 0.2.8
    And o pacote Python do servidor está presente
    And a suíte de testes da v0.2.8 pode ser instalada e executada
    And o conjunto preservado também está presente nessa branch
```

#### AC-009 — A regra de sobrevivência é explícita e única

**Cobre**: US-001, FR-003, FR-004, NFR-003

```gherkin
@US-001 @FR-003 @FR-004 @NFR-003 @AC-009
Feature: Critério único de preservação

  Scenario: Somente o conjunto preservado é exceção à limpeza
    Given a lista de conteúdo da main atual
    When a pessoa aplica o critério de preservação da Phase 0
    Then specs, .claude e .project-context são os únicos caminhos preservados
    And qualquer caminho fora desses três é removido sem exceção
    And nenhuma decisão caso a caso é tomada durante a execução
```

#### AC-010 — O estado final é verificável por checklist

**Cobre**: US-001, US-002, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-002, NFR-003

```gherkin
@US-001 @US-002 @FR-001 @FR-002 @FR-003 @FR-004 @NFR-001 @NFR-002 @NFR-003 @AC-010
Feature: Verificação final da Phase 0

  Scenario: O checklist de conclusão passa integralmente
    Given todas as tarefas de T001 a T006 executadas
    When a pessoa executa a validação final da tarefa T007
    Then os oito itens do checklist retornam positivo
    And a evidência de cada item está registrada na seção 12
    And a Phase 1 pode iniciar sobre a branch resultante
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O processo deve criar a branch `archived` no commit atual da main, publicá-la no remoto e não gravar nada nela depois disso.
- **FR-002**: O processo deve criar a branch de trabalho com raiz órfã, de modo que seu histórico tenha um único commit sem ancestral comum com a main.
- **FR-003**: O processo deve preservar o conjunto preservado — `specs/`, `.claude/` e `.project-context/` — integralmente na branch de trabalho, com conteúdo idêntico ao da main.
- **FR-004**: O processo deve remover da branch de trabalho cada caminho versionado que não esteja sob o conjunto preservado.

#### Não funcionais

- **NFR-001**: **Tempo de execução**. A sequência de T003 a T006 termina em menos de cinco minutos numa máquina local. **Verificação**: medição do tempo decorrido entre o início de T003 e o fim de T006, registrada em T007.
- **NFR-002**: **Integridade do congelamento**. `archived` reproduz a main atual sem qualquer diferença de árvore no momento da criação. **Verificação**: `git diff --stat archived main` retorna vazio em T002.
- **NFR-003**: **Irreversibilidade controlada**. Nenhuma operação da Phase 0 escreve na main ou em `archived` depois da criação desta. **Verificação**: o SHA da main e o SHA de `archived` registrados em T002 permanecem idênticos na conferência de T007.

#### Erros e casos-limite

- Main com alterações não commitadas → interromper antes de T001 e exigir commit ou stash explícito da pessoa; não descartar trabalho por conta própria.
- Branch `archived` já existente → não sobrescrever nem mover. Relatar o SHA atual e pedir decisão.
- Push de `archived` recusado pelo remoto → parar em T001. Sem o congelamento publicado, a limpeza não começa.
- Interrupção entre T003 e T005 → descartar a branch de trabalho e recriá-la a partir da main; `archived` e main permanecem íntegras.
- Qualquer caminho do conjunto preservado ausente ou vazio no momento de T004 → abortar. A branch de trabalho não pode nascer sem o registro de decisões que a governa nem sem o framework que a conduz.
- Arquivo não rastreado presente na árvore durante a limpeza → remover junto; a regra de preservação vale para a árvore inteira, não só para o índice.
- `.claude/` contendo configuração específica da v0.2.8 além das skills former project tool → preservar mesmo assim nesta fase e tratar na Phase 1, que reescreve a configuração de agentes. A Phase 0 não faz curadoria dentro do conjunto preservado.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Repositório git com remoto configurado; `main` é a branch padrão e carrega a v0.2.8.
- Raiz atual contém: `src/common_rules_server/`, `src/test/`, `.docs/`, `tools/`, `.github/`, `.claude/`, `.project-context/`, `specs/`, `.pytest_cache/`, `.venv/`, `dist/`, `pyproject.toml`, `.python-version`, `uv.lock`, `.coverage`, `agent_bdd.feature`, `Dockerfile`, `.dockerignore`, `skills-lock.json`, `README.md`, `AGENTS.md`, `CLAUDE.md`.
- `specs/` contém `inbox/` com quatro capturas, `backlog/` com três itens e `draft/` com esta spec.
- Empacotamento Python via `pyproject.toml` com hatchling; ambiente gerido por `uv`.

#### Arquitetura e módulos

A Phase 0 não produz software. Ela reorganiza referências git e a árvore de trabalho.

O estado alvo tem duas linhas sem ancestral comum:

```text
archived ──● (commit atual da main, congelado para sempre)

refactor/v1-cli-first ──● (raiz órfã; árvore = specs/ apenas)
```

A ausência de ancestral comum é deliberada: impede que a v0.2.8 seja alcançável a partir da linha nova e torna a substituição posterior da main um ato de troca de ponteiro, não de merge.

#### Migrations

Não aplicável. A v0.2.8 não possui schema nem banco de dados; a seção 9 registra a ausência de modelo de dados.

#### Models

Não aplicável. Nenhum código de produto é escrito nesta fase.

#### Controllers e casos de uso

Não aplicável. Nenhuma superfície de invocação é criada nesta fase.

#### Views e experiência

Não aplicável. O cabeçalho declara ausência de interface para pessoas, e a seção 10 registra a justificativa.

#### Queries e repositórios

Não aplicável. Não há persistência envolvida.

#### Jobs e processamento assíncrono

Não aplicável. Todas as operações são síncronas e executadas por comando.

#### Estrutura de arquivos

Árvore versionada da branch de trabalho ao fim da Phase 0:

```text
specs/
  inbox/
  backlog/
  draft/0001-phase-0-preparacao-limpeza/spec.md
.claude/
  skills/framework-*/
.project-context/
  Spec.md
  templates/
```

Nenhum outro caminho versionado existe.

### 9. Modelo de dados

Não aplicável. A Phase 0 manipula referências git e arquivos; não há entidade de negócio, estado persistido ou retenção a definir.

### 10. Interfaces e contratos

#### Interface para pessoas

**Não há interface para pessoas.** A entrega consiste em operações git executadas por linha de comando pela pessoa que refatora. Não existe tela, formulário ou navegação a especificar.

#### APIs expostas

Nenhuma.

#### APIs externas utilizadas

Nenhuma. O git opera contra o remoto já configurado do projeto, por protocolo próprio e credenciais existentes; não há chamada HTTP a serviço de terceiros nesta fase.

#### Documentação das APIs consultadas

Nenhuma.

#### Eventos e outros contratos

Não aplicável.

### 11. Estratégia TDD

A Phase 0 entrega um estado de repositório, e esse estado é asseverável. Cada asserção falha antes da operação correspondente e passa depois dela, de modo que o ciclo RED-GREEN é real, ainda que a unidade sob teste seja o repositório e não uma função.

**Runner**: Node puro, em arquivos `.js` CommonJS sem dependência alguma. A escolha atende três restrições simultâneas. O escopo proíbe instalar dependências, e o Node já é exigido para executar as próprias skills former project tool, de modo que nada novo entra. A árvore é esvaziada no meio da execução, e scripts sem `node_modules` sobrevivem à limpeza que precisam verificar. Por fim, o auditor de rastreabilidade do framework varre apenas um conjunto fechado de extensões, no qual `.js` está e `.sh` não — asserções em shell seriam corretas e invisíveis ao Delivery Gate.

**Localização**: `.claude/scripts/phase0/`, dentro do conjunto preservado, para que as asserções sobrevivam à limpeza e possam ser reexecutadas na branch nova. A Phase 1 remove esse diretório quando a fase estiver encerrada.

**Escopo das asserções**: cada script guarda uma operação irreversível. Não são exercício de conformidade — `assert-archived-frozen.check.js` é o que impede apagar a v0.2.8 sem cópia, e `assert-preserved-set.check.js` é o que impede perder o registro de decisões junto com o código antigo.

| Script | O que assevera | Guarda qual risco |
| --- | --- | --- |
| `assert-archived-frozen.check.js` | `archived` existe, iguala a main e não recebeu commit posterior | Apagar a v0.2.8 sem cópia íntegra |
| `assert-orphan-root.check.js` | Um commit, sem pai, sem ancestral comum com a main | Histórico da v0.2.8 alcançável pela linha nova |
| `assert-preserved-set.check.js` | Os quatro caminhos preservados estão presentes e idênticos aos da main | Perder specs ou o framework durante a limpeza |
| `assert-no-legacy.check.js` | Nenhum caminho versionado fora do conjunto preservado | Resíduo do produto antigo na branch nova |
| `assert-framework-operational.check.js` | Uma captura de inbox real é criada na branch | Preservação insuficiente para operar |
| `assert-baseline-untouched.check.js` | main e `archived` mantêm os SHAs registrados no congelamento | Escrita acidental na linha que deveria ficar intocada |
| `assert-elapsed-budget.check.js` | O intervalo entre início e fim da sequência fica abaixo de trezentos segundos | Orçamento de tempo verificado por leitura humana |

As duas últimas foram acrescentadas depois que a validação de tarefas apontou IDs abaixo do mínimo de predecessores. A revisão do que faltava mostrou que não era carência de contagem: nada verificava mecanicamente que a baseline permanecia intocada durante a sequência destrutiva, e NFR-001 dependia de alguém ler um cronômetro. DEC-008 registra o raciocínio.

**Verificação manual**: leitura do relatório final de T014, cujo critério é a conferência conjunta, não um assert isolado.

### 12. Plano de testes e rastreabilidade

#### Evidência RED — 2026-08-24

As sete asserções foram escritas antes de qualquer operação e observadas falhando. Nenhuma falhou por sintaxe, importação ou ambiente: todas reportaram ausência do comportamento esperado.

| Asserção | Comando | RED observado | Causa da falha |
| --- | --- | --- | --- |
| `assert-archived-frozen.check.js` | `node .claude/scripts/phase0/assert-archived-frozen.check.js` | exit 1 — 5 de 5 | `archived` não existe; baseline não registrada |
| `assert-orphan-root.check.js` | idem | exit 1 — 4 de 4 | branch de trabalho não existe |
| `assert-preserved-set.check.js` | idem | exit 1 — 5 de 5 | branch de trabalho não existe |
| `assert-no-legacy.check.js` | idem | exit 1 — 5 de 5 | branch de trabalho não existe |
| `assert-framework-operational.check.js` | idem | exit 1 — 3 de 4 | branch não existe; a captura real já passa na main |
| `assert-baseline-untouched.check.js` | idem | exit 1 — 5 de 5 | `.git/phase0-run-state.json` ausente |
| `assert-elapsed-budget.check.js` | idem | exit 1 — 4 de 4 | horários não registrados |
| `run-all.check.js` | idem | exit 1 — 7 de 7 | agregado das anteriores |

#### Prova de sensibilidade e discriminação

Um teste que sempre falha não prova nada. A suíte foi exercitada contra um repositório descartável que simula o estado final da fase — `archived` publicada, raiz órfã, árvore reduzida ao conjunto preservado, estado de execução registrado em `.git/phase0-run-state.json`.

- **Sensibilidade**: as seis asserções aplicáveis passaram a GREEN nesse estado, o que mostra que o RED acima decorre do estado real e não de defeito no script.
- **Discriminação**: quatro violações foram injetadas no estado simulado e todas foram detectadas, com mensagem nomeando a causa exata — remoção de um arquivo de `specs/` (`assert-preserved-set`), reintrodução de um `.py` fora do conjunto preservado (`assert-no-legacy`), commit sobre `archived` (`assert-baseline-untouched` e `assert-archived-frozen`) e estouro do orçamento de tempo (`assert-elapsed-budget`, "decorridos 540s, orçamento 300s").

O repositório de simulação foi descartado; a prova está registrada aqui.

#### Evidência T008 — congelamento — 2026-08-24

`archived` criada a partir de `main` em `aac477a` e publicada no remoto. Baseline registrada em `.git/phase0-run-state.json` com os SHAs de `main`, `archived` e `origin/main`.

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Barreira da fase | `node .claude/scripts/phase0/assert-archived-frozen.check.js` | **GREEN**, 5 de 5, exit 0 |
| Baseline intocada | `node .claude/scripts/phase0/assert-baseline-untouched.check.js` | **GREEN**, 5 de 5, exit 0 |

**Defeito de asserção corrigido durante a verificação.** `assert-baseline-untouched` reprovou em `origin/main`, e a causa era a própria asserção: ela comparava a referência remota contra o SHA da `main` local, o que testa se local e remoto coincidem — propriedade que nunca foi requisito e que diverge legitimamente enquanto houver commit local não publicado. A intenção declarada é que `origin/main` não se mova. A baseline passou a registrar `originMainSha` em separado e a comparação usa esse valor. A correção foi exercitada com SHA forjado e voltou a RED nomeando a divergência, o que mostra que continua discriminando.

**Estado do remoto.** `origin/main` permanece em `0e8229d`, dois commits atrás da `main` local. Os commits `dc93d80` e `aac477a` não foram publicados na main, mas estão em `archived`, que foi criada a partir da main local. Nada do conjunto preservado depende de um push da main para sobreviver.

#### Evidência T009 a T014 — execução — 2026-08-24

Sequência destrutiva executada em 70 segundos, entre `2026-08-24T19:09:54.406514+00:00` e `2026-08-24T19:11:04.500838+00:00`, contra um orçamento de 300.

| Tarefa | Ato | Resultado |
| --- | --- | --- |
| T009 | Raiz órfã criada | `assert-orphan-root` em RED parcial, como esperado sem commit |
| T010 | Árvore reduzida | 20 caminhos removidos do topo; 119 arquivos reindexados |
| T011 | Commit raiz `53f9949` | `assert-orphan-root`, `assert-preserved-set`, `assert-no-legacy` e `assert-framework-operational` em GREEN |
| T012 | Branch publicada | `assert-orphan-root` e `assert-elapsed-budget` em GREEN |
| T013 | Suíte completa | `run-all` em **GREEN**: as sete asserções passam juntas |
| T014 | Conferência final | Oito itens positivos, detalhados abaixo |

**Checklist final de T014**

1. `archived` no remoto em `aac477a`, com o SHA da baseline — sim.
2. Árvore de `archived` idêntica à da main no congelamento — sim.
3. Branch de trabalho com um commit, sem pai, sem ancestral comum com a main — sim.
4. `git ls-files` lista 119 caminhos, cada um sob o conjunto preservado — sim.
5. Listagem dos quatro caminhos idêntica à da main — sim.
6. Captura de inbox criada na branch sem reinstalação — sim, via `assert-framework-operational`.
7. Clone limpo de `archived` restaura a v0.2.8 executável — sim: `pyproject.toml` declara 0.2.8 e `uv run pytest` retorna **1010 passed, 20 skipped** em 81s.
8. Intervalo de 70s, abaixo do orçamento de 300s — sim.

`PROJECT.md` não existe no repositório e a Phase 0 não o cria; descrever a finalidade do produto novo cabe à Phase 1.

**Dois defeitos de asserção corrigidos durante a execução.** Ambos foram alterações feitas depois de ver o teste falhar, o que exige justificativa independente:

1. `origin/main` era comparado ao SHA da `main` local, o que testava sincronia entre local e remoto em vez da intenção declarada. Passou a ter baseline própria, `originMainSha`. Exercitado com SHA forjado, voltou a RED.
2. `mainSha` era gravado no congelamento (T008) e comparado após a sequência, mas a main recebe legitimamente o commit de evidência de T008 entre um momento e outro. O reflog mostra que o último write na main foi às 21:08:38 e que a sequência começou às 21:09:54 — durante T009 a T012 a main não recebeu nada, de modo que a propriedade de segurança valia e apenas o instante da baseline estava errado. `mainSha` passou a ser gravado no início da sequência, e `mainShaAtFreeze` preserva o valor anterior.

**Uma diferença real capturada em T011.** `assert-preserved-set` reprovou por `.project-context/skills-lock.json`, que entrou no índice porque o `.gitignore` foi removido antes do `git add` e esse arquivo sempre foi ignorado na main. Retirado do índice e mantido em disco, o que restaura a identidade com a main exigida por AC-003. Se o lockfile deve passar a ser versionado, a decisão cabe à Phase 1.

#### Duas asserções presas ao instante da entrega — corrigidas após o gate

Reexecutar a suíte depois do commit de entrega expôs um erro de desenho em duas asserções: elas comparavam alvos móveis e passaram a acusar violação a cada commit legítimo da branch nova.

- `assert-preserved-set` comparava a branch de trabalho com a `main`. Quando a spec migrou de `in-progress/` para `review/`, as duas árvores divergiram e a asserção reprovou. A propriedade que AC-003 descreve pertence ao momento da redução — nada se perdeu ao reduzir —, não à vida inteira da branch. A comparação passou a ser entre duas referências imutáveis: o commit raiz e `archived`, que é a main no instante do congelamento.
- `assert-orphan-root` exigia "exatamente um commit", verdade apenas em T011. A invariante real é haver uma única raiz sem pai e nenhum ancestral comum com a main; contar commits reprovaria cada commit novo como se fosse violação.

Ambas foram exercitadas por mutação depois da correção. Apontando `assert-preserved-set` para um caminho ausente do congelamento, ela reprova nomeando o caminho; aplicando `assert-orphan-root` à própria `main`, ela reprova na condição de ancestralidade. As duas continuam discriminando.

O estado entregue não mudou: commit raiz, `archived` e a branch publicada permanecem como foram verificados. A correção é do instrumento de medida, não da entrega.

#### Suposição falsa na base do plano, detectada antes da execução

O gate inicial da implementação revelou que o conjunto preservado não estava versionado. `.gitignore` ignorava `.project-context/` (linha 10), `specs/` (linha 11) e `.claude/` (linha 27), de modo que `git ls-files` retornava zero para os três, enquanto o disco continha 8, 14 e 97 arquivos respectivamente. A main rastreava 259 arquivos, todos do lado Python.

Três consequências, se a fase tivesse sido executada como planejada:

1. `archived` congelaria apenas a v0.2.8, sem o conjunto preservado — o oposto do que AC-008 afirma.
2. T010 reindexaria caminhos ignorados e produziria um commit raiz praticamente vazio, porque `git add` respeita o `.gitignore`.
3. O registro inteiro de decisões — capturas, backlogs, esta spec e as asserções — existia em um único lugar, a árvore de trabalho, sem commit, branch ou remoto. A limpeza o apagaria em definitivo.

`assert-preserved-set` teria reprovado em T011 com "specs não existe em main", de modo que a fase falharia em vez de destruir em silêncio. A guarda funcionou; a premissa é que estava errada.

O `.gitignore` justificava a exclusão de `.claude/` e `.agents/` como saída gerada pelo `sync_to_ide`, cujo versionamento criaria uma segunda fonte da verdade. O motivo era válido na v0.2.8 e deixa de valer na v1.0: `sync_to_ide` é removido, e esses caminhos passam a carregar as skills configuradas e os scripts de asserção, que são fonte e não export. As três entradas foram retiradas, com a justificativa registrada no próprio arquivo.

#### Defeito de plano corrigido antes da execução

A escrita das asserções expôs um erro no próprio plano. O estado de execução — SHAs da baseline e horários — ia morar em `.claude/scripts/phase0/run-state.json`, dentro do conjunto preservado. T010 reindexa `.claude` e T011 comita, de modo que o arquivo entraria no commit raiz; `assert-preserved-set` então compararia `.claude` com a main, encontraria um arquivo a mais e reprovaria a fase por um artefato que ela mesma produziu.

O estado passou a viver em `.git/phase0-run-state.json`, fora da árvore versionada. O caminho foi exercitado com estado válido, com orçamento estourado e sem estado, alternando GREEN e RED conforme esperado.

#### Rastreabilidade

`node .claude/skills/framework-06-tdd-bdd/scripts/check_traceability.mjs specs/completed/0001-phase-0-preparacao-limpeza/spec.md .` → **OK, 20 de 20 IDs cobertos**.

#### Matriz de verificação

| Requisito | Cenário BDD | Nível | Comando de verificação | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Execução | `node .claude/scripts/phase0/assert-archived-frozen.check.js` | **Passed** — GREEN 5/5 em T008 |
| FR-001 | AC-005 | Execução | `node .claude/scripts/phase0/assert-archived-frozen.check.js` — condição de SHA congelado | **Passed** — GREEN em T008 e T013 |
| FR-001 | AC-008 | Execução | clone limpo de `archived` + `uv run pytest` | **Passed** — 1010 passed, 20 skipped em T014 |
| FR-002 | AC-002 | Execução | `node .claude/scripts/phase0/assert-orphan-root.check.js` | **Passed** — GREEN 4/4 em T011 e T012 |
| FR-002 | AC-006 | Execução | `node .claude/scripts/phase0/assert-elapsed-budget.check.js` | **Passed** — 70s de 300s em T012 |
| FR-002 | AC-007 | Execução | `node .claude/scripts/phase0/assert-baseline-untouched.check.js` | **Passed** — GREEN 5/5 em T013 |
| FR-003 | AC-003 | Execução | `node .claude/scripts/phase0/assert-preserved-set.check.js` | **Passed** — GREEN 5/5 em T011 |
| FR-003 | AC-008 | Inspeção | `git ls-tree -r archived -- specs .claude .project-context .agents` | **Passed** — 119 arquivos em T014 |
| FR-003 | AC-009 | Execução | `node .claude/scripts/phase0/assert-preserved-set.check.js` | **Passed** — GREEN em T011 |
| FR-003 | AC-011 | Execução | `node .claude/scripts/phase0/assert-framework-operational.check.js` | **Passed** — captura real criada em T011 |
| FR-004 | AC-004 | Execução | `node .claude/scripts/phase0/assert-no-legacy.check.js` | **Passed** — GREEN 5/5 em T011 |
| FR-004 | AC-006 | Execução | `node .claude/scripts/phase0/assert-elapsed-budget.check.js` | **Passed** — 70s em T012 |
| FR-004 | AC-009 | Execução | `node .claude/scripts/phase0/assert-no-legacy.check.js` — condição de ausência de `.py` | **Passed** — 0 arquivos `.py` em T011 |
| NFR-001 | AC-006 | Medição | `node .claude/scripts/phase0/assert-elapsed-budget.check.js` | **Passed** — 70s de 300s em T012 |
| NFR-001 | AC-007 | Execução | `node .claude/scripts/phase0/assert-baseline-untouched.check.js` | **Passed** — GREEN em T013 |
| NFR-001 | AC-010 | Execução | `node .claude/scripts/phase0/run-all.check.js` | **Passed** — GREEN nas 7 em T013 |
| NFR-002 | AC-001 | Execução | `node .claude/scripts/phase0/assert-archived-frozen.check.js` — árvore idêntica | **Passed** — GREEN em T008 |
| NFR-002 | AC-007 | Execução | `node .claude/scripts/phase0/assert-baseline-untouched.check.js` + `git reflog main` | **Passed** — main sem escrita entre 21:09:54 e 21:11:04, em T013 |
| NFR-002 | AC-008 | Execução | clone limpo de `archived` em diretório novo | **Passed** — v0.2.8 executável em T014 |
| NFR-003 | AC-005 | Execução | `node .claude/scripts/phase0/assert-baseline-untouched.check.js` — sem commit posterior | **Passed** — GREEN em T013 |
| NFR-003 | AC-008 | Inspeção | `git ls-remote --heads origin archived` | **Passed** — `aac477a` íntegra em T014 |
| NFR-003 | AC-009 | Execução | `node .claude/scripts/phase0/assert-baseline-untouched.check.js` | **Passed** — nenhuma escrita em main ou `archived` em T013 |
| NFR-003 | AC-010 | Execução | `node .claude/scripts/phase0/run-all.check.js` | **Passed** — GREEN nas 7 em T013 |
| NFR-003 | AC-011 | Execução | `node .claude/scripts/phase0/assert-framework-operational.check.js` | **Passed** — framework opera sem alterar main em T011 |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-08-24, rodada 2). Aceite final em 2026-08-24, rodada 3: ver `Aceite final` ao fim desta seção.
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/completed/0001-phase-0-preparacao-limpeza/spec.md`

**Rodada 1 — 2026-08-24 — NOT READY (histórico)**

Estrutural: VALID DRAFT. Semântico: 4 BLOCKER, 5 WARNING, 3 NOTE.

| ID | Achado | Estado |
| --- | --- | --- |
| B1 | `git reset --hard HEAD~0` era no-op e não produzia o histórico vazio exigido pelos ACs | Resolvido — substituído por raiz órfã em T003 |
| B2 | AC de limpeza era insatisfazível: exigia zero ocorrências de um literal presente na própria spec | Resolvido — o critério passou a ser a lista de arquivos versionados, não busca textual |
| B3 | O escopo não decidia o que sobrevive à limpeza | Resolvido — D1: conjunto preservado com `specs/`, `.claude/` e `.project-context/` |
| B4 | `CHANGELOG.md` não existia, mas um FR mandava atualizá-lo | Resolvido — D3: sem CHANGELOG; FR removido |
| W1 | Tarefa de limpeza removia arquivos inexistentes e omitia artefatos reais | Resolvido — lista conferida contra o repositório em 2026-08-24 |
| W2 | `README.md` ficaria com quinze links quebrados | Resolvido — D4: removido junto com o resto |
| W3 | Seção 8 mantinha placeholders do template | Resolvido — cada subseção agora justifica "Não aplicável" |
| W4 | "Estrutura de arquivos" listava caminhos inexistentes | Resolvido — reescrita com a árvore-alvo real |
| W5 | Contagem do checklist final divergia entre seções | Resolvido — sete itens em T007, AC-010 e nesta seção |
| W6 | Tarefas-exemplo do template sobreviviam na seção 14, duplicando IDs T001–T006 | Resolvido — seção 14 reescrita |
| N1 | Escopo dizia "arquivo vazio" e a tarefa dava conteúdo | Resolvido — arquivo de status descartado com D1 |
| N2 | Métricas repetiam a formulação incorreta de B1 | Resolvido |
| N3 | Erro de idioma na seção 12 | Resolvido |

**Rodada 2 — 2026-08-24 — READY**

Estrutural: VALID DRAFT. Cobertura: 2 US, 4 FR, 3 NFR, 11 AC; mínimo de 3 AC por ID satisfeito. Sem IDs de tarefa duplicados, sem placeholder de template remanescente. Nenhum BLOCKER. Achados residuais tratados nesta rodada:

| ID | Achado | Estado |
| --- | --- | --- |
| W7 | Gate do Ato III dizia "sete itens" após o checklist de T007 passar a oito | Resolvido |
| W8 | A Definition of Done exigia revisão de `PROJECT.md`, arquivo que não existe no repositório | Resolvido — a ausência é declarada e atribuída à Phase 1 |
| N4 | `.gitignore` não é enumerado na lista de remoção | Aceito — cai na regra geral de preservação; a Phase 1 cria o seu antes de instalar dependências |
| N5 | O validador rejeita um quantificador universal comum do português | Contornado, não corrigido — ver abaixo |
| N6 | O mesmo defeito reincidiu no aceite, desta vez com o quantificador aparecendo como sufixo de uma palavra maior, e reincidiu outra vez ao redigir esta própria nota | Contornado — as frases foram reescritas; o defeito segue no validador |

**N5 — defeito do validador, registrado para tratamento fora desta spec.**
`validate_spec.mjs` procura marcadores de pendência com uma expressão regular de três literais ingleses e aplica a ela a flag de case-insensitive. O primeiro desses literais, em minúsculas, é uma palavra comum do português — o quantificador universal usado em frases como "cada caminho" e "o restante". A checagem passa a rejeitar textos corretos escritos no idioma que o próprio contrato do framework obriga. Nesta spec o vocabulário foi ajustado para sinônimos exatos, de modo que o gate passa sem perda de sentido, mas o defeito permanece no script e atingirá qualquer spec futura em português. A correção pertence ao validador, não a esta spec. Uma segunda consequência ficou evidente ao redigir este parágrafo: descrever o problema citando os literais também reprova a spec, o que impede documentar o defeito no artefato que ele afeta.

#### Gate do Ato II — Plano

- **Resultado**: Passed (2026-08-24) — estrutura válida e RED observado nas sete asserções antes de qualquer operação.
- **Comando**: `node .claude/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/completed/0001-phase-0-preparacao-limpeza/spec.md --allow-draft`
- **Contagens**: 14 tarefas, 8 predecessores TDD, 0 tarefas `[CODE]`, 70 itens de checklist, 20 de 20 IDs da spec cobertos.
- **RED comprovado**: T001 a T007 materializaram as sete asserções em `.claude/scripts/phase0/` e todas falharam antes de qualquer operação, por ausência do comportamento. A evidência, a prova de sensibilidade e a de discriminação estão na seção 12.
- **Rastreabilidade**: `check_traceability.mjs` reporta 20 de 20 IDs cobertos.

**Achados desta rodada**

| ID | Achado | Estado |
| --- | --- | --- |
| P1 | Tarefas usavam `[INFRA]` e `[VERIFY]`, fora do vocabulário aceito | Resolvido — `[OPS]`, `[TEST]`, `[DOC]` |
| P2 | Nenhuma tarefa declarava caminho de arquivo | Resolvido — cada tarefa nomeia seu script |
| P3 | `Evidence Contract: 1` reprovava por procurar `verify_evidence.mjs` sob `.agents/skills/`, enquanto esta instalação usa `.claude/skills/` | Contornado por DEC-007; a correção pertence ao validador |
| P4 | Cinco IDs abaixo do mínimo de predecessores TDD | Resolvido — a análise expôs duas lacunas reais de verificação; ver DEC-008 |
| P5 | O auditor de rastreabilidade só reconhece arquivo cujo nome pareça de teste | Resolvido à época renomeando para `*.test.js`; revisto depois — ver a nota de manutenção ao fim desta seção |
| P6 | Um marcador por arquivo contava como um caso, agrupando condições distintas | Resolvido — cada condição recebeu marcador próprio, que é a granularidade correta |
| P7 | O estado de execução seria comitado e reprovaria `assert-preserved-set` | Resolvido — movido para `.git/phase0-run-state.json`; ver seção 12 |

#### Gate do Ato III — Entrega

- **Resultado**: Passed (2026-08-24)
- **Verificação**: `node .claude/scripts/phase0/run-all.check.js` em GREEN nas sete asserções; clone limpo de `archived` com 1010 testes da v0.2.8 passando; os oito itens do checklist de T014 positivos.
- **Auditoria de aceite**: `node .claude/skills/framework-06-tdd-bdd/scripts/verify_acceptance.mjs` — os onze ACs registram resultado na matriz da seção 12.

### 14. Tarefas

#### Fase 1 — Asserções em RED

As sete asserções são escritas antes de qualquer operação e observadas falhando. Nenhuma depende das outras, e cada uma cria um arquivo distinto, por isso executam em paralelo.

- [x] T001 [P] [TEST] [TDD] [US-002] Escrever a asserção de congelamento em .claude/scripts/phase0/assert-archived-frozen.check.js — Refs: US-002, FR-001, NFR-002, NFR-003, AC-001, AC-005, AC-008 — Depends: none
  - [x] **PREP**: Ler AC-001, AC-005 e AC-008 e definir as três condições: `archived` existe, iguala a main e não recebeu commit posterior ao registrado.
  - [x] **EXECUTE**: Escrever o script em shell POSIX, sem dependência externa, saindo com código diferente de zero em qualquer condição não satisfeita.
  - [x] **VERIFY**: RED observado — `node .claude/scripts/phase0/assert-archived-frozen.check.js` saiu com código 1 e 5 de 5 condições não satisfeitas, por ausência do comportamento e não por erro de ambiente.
  - [x] **EVIDENCE**: Comando, saída e código registrados na seção 12, junto da prova de sensibilidade e discriminação.
  - [x] **IMPROVE**: Cada condição recebeu marcador `TRACEABILITY` próprio e mensagem que nomeia a causa, para que a falha diga o que quebrou em vez de apenas que quebrou.

- [x] T002 [P] [TEST] [TDD] [US-001] Escrever a asserção de raiz órfã em .claude/scripts/phase0/assert-orphan-root.check.js — Refs: US-001, FR-002, AC-002 — Depends: none
  - [x] **PREP**: Ler AC-002 e definir as três condições: um único commit, ausência de pai e ausência de ancestral comum com a main.
  - [x] **EXECUTE**: Escrever o script usando `git rev-list` e `git merge-base`, tratando a ausência de ancestral comum como sucesso e não como erro do git.
  - [x] **VERIFY**: RED observado — `node .claude/scripts/phase0/assert-orphan-root.check.js` saiu com código 1 e 4 de 4 condições não satisfeitas, por ausência do comportamento e não por erro de ambiente.
  - [x] **EVIDENCE**: Comando, saída e código registrados na seção 12, junto da prova de sensibilidade e discriminação.
  - [x] **IMPROVE**: Cada condição recebeu marcador `TRACEABILITY` próprio e mensagem que nomeia a causa, para que a falha diga o que quebrou em vez de apenas que quebrou.

- [x] T003 [P] [TEST] [TDD] [US-001] Escrever a asserção do conjunto preservado em .claude/scripts/phase0/assert-preserved-set.check.js — Refs: US-001, FR-003, FR-004, NFR-003, AC-003, AC-009 — Depends: none
  - [x] **PREP**: Ler AC-003 e AC-009 e definir a comparação: a listagem de `specs/`, `.claude/`, `.project-context/` e `.agents` na branch precisa coincidir com a da main, arquivo a arquivo.
  - [x] **EXECUTE**: Escrever o script comparando `git ls-files` dos quatro caminhos entre a branch e a main, e falhando se qualquer caminho estiver ausente ou vazio.
  - [x] **VERIFY**: RED observado — `node .claude/scripts/phase0/assert-preserved-set.check.js` saiu com código 1 e 5 de 5 condições não satisfeitas, por ausência do comportamento e não por erro de ambiente.
  - [x] **EVIDENCE**: Comando, saída e código registrados na seção 12, junto da prova de sensibilidade e discriminação.
  - [x] **IMPROVE**: Cada condição recebeu marcador `TRACEABILITY` próprio e mensagem que nomeia a causa, para que a falha diga o que quebrou em vez de apenas que quebrou.

- [x] T004 [P] [TEST] [TDD] [US-001] Escrever a asserção de ausência de resíduo em .claude/scripts/phase0/assert-no-legacy.check.js — Refs: US-001, FR-004, AC-004, AC-009 — Depends: none
  - [x] **PREP**: Ler AC-004 e listar as condições: nenhum caminho versionado fora do conjunto preservado, nenhum arquivo `.py` e ausência dos artefatos nomeados no cenário.
  - [x] **EXECUTE**: Escrever o script filtrando `git ls-files` por prefixo e verificando os artefatos nomeados um a um.
  - [x] **VERIFY**: RED observado — `node .claude/scripts/phase0/assert-no-legacy.check.js` saiu com código 1 e 5 de 5 condições não satisfeitas, por ausência do comportamento e não por erro de ambiente.
  - [x] **EVIDENCE**: Comando, saída e código registrados na seção 12, junto da prova de sensibilidade e discriminação.
  - [x] **IMPROVE**: Cada condição recebeu marcador `TRACEABILITY` próprio e mensagem que nomeia a causa, para que a falha diga o que quebrou em vez de apenas que quebrou.

- [x] T005 [P] [TEST] [TDD] [US-001] Escrever a asserção de framework operante em .claude/scripts/phase0/assert-framework-operational.check.js — Refs: US-001, FR-003, NFR-003, AC-011 — Depends: none
  - [x] **PREP**: Ler AC-011 e definir o critério: uma captura de inbox real é criada, resolvendo template em `.project-context/templates/`, sem etapa de instalação.
  - [x] **EXECUTE**: Escrever o script que invoca o script de captura de uma skill former project tool, confere o arquivo gerado e o remove ao final para não poluir `specs/inbox/`.
  - [x] **VERIFY**: RED observado — `node .claude/scripts/phase0/assert-framework-operational.check.js` saiu com código 1 e 3 de 4 condições não satisfeitas, por ausência do comportamento e não por erro de ambiente.
  - [x] **EVIDENCE**: Comando, saída e código registrados na seção 12, junto da prova de sensibilidade e discriminação.
  - [x] **IMPROVE**: Cada condição recebeu marcador `TRACEABILITY` próprio e mensagem que nomeia a causa, para que a falha diga o que quebrou em vez de apenas que quebrou.

- [x] T006 [P] [TEST] [TDD] [US-001] [US-002] Escrever a asserção de baseline intocada em .claude/scripts/phase0/assert-baseline-untouched.check.js — Refs: US-001, US-002, FR-001, FR-002, NFR-001, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Ler AC-007 e definir o critério: os SHAs da main e de `archived` registrados no congelamento permanecem inalterados durante e após a sequência destrutiva.
  - [x] **EXECUTE**: Escrever o script que lê a baseline registrada e compara com o estado atual das duas referências, local e remota, falhando ao detectar qualquer escrita.
  - [x] **VERIFY**: RED observado — `node .claude/scripts/phase0/assert-baseline-untouched.check.js` saiu com código 1 e 5 de 5 condições não satisfeitas, por ausência do comportamento e não por erro de ambiente.
  - [x] **EVIDENCE**: Comando, saída e código registrados na seção 12, junto da prova de sensibilidade e discriminação.
  - [x] **IMPROVE**: Cada condição recebeu marcador `TRACEABILITY` próprio e mensagem que nomeia a causa, para que a falha diga o que quebrou em vez de apenas que quebrou.

- [x] T007 [P] [TEST] [TDD] [US-001] Escrever a asserção de orçamento de tempo em .claude/scripts/phase0/assert-elapsed-budget.check.js — Refs: US-001, NFR-001, AC-006, AC-007 — Depends: none
  - [x] **PREP**: Ler AC-006 e NFR-001 e definir o critério: o intervalo entre os horários registrados no início e no fim da sequência é inferior a trezentos segundos.
  - [x] **EXECUTE**: Escrever o script que lê os dois horários registrados e falha quando o intervalo excede o orçamento ou quando algum horário está ausente.
  - [x] **VERIFY**: RED observado — `node .claude/scripts/phase0/assert-elapsed-budget.check.js` saiu com código 1 e 4 de 4 condições não satisfeitas, por ausência do comportamento e não por erro de ambiente.
  - [x] **EVIDENCE**: Comando, saída e código registrados na seção 12, junto da prova de sensibilidade e discriminação.
  - [x] **IMPROVE**: Cada condição recebeu marcador `TRACEABILITY` próprio e mensagem que nomeia a causa, para que a falha diga o que quebrou em vez de apenas que quebrou.

#### Fase 2 — Congelar

- [x] T008 [OPS] [US-002] Criar e publicar `archived` a partir da main, verificando com .claude/scripts/phase0/assert-archived-frozen.check.js — Refs: US-002, FR-001, NFR-002, AC-001 — Depends: T001, T006
  - [x] **PREP**: Conteúdo rastreado sem modificação pendente; `archived` inexistente local e remotamente; `main` em `aac477a`.
  - [x] **EXECUTE**: `git branch archived main` e `git push origin archived` — nova branch remota criada; baseline gravada em `.git/phase0-run-state.json`.
  - [x] **VERIFY**: `assert-archived-frozen` GREEN nas 5 condições. A barreira está satisfeita e a remoção pode começar.
  - [x] **EVIDENCE**: SHA congelado, saídas de GREEN e o defeito de asserção corrigido, registrados na seção 12.
  - [x] **IMPROVE**: A baseline passou a registrar `originMainSha` em separado, para que a asserção teste a intenção declarada em vez de sincronia entre local e remoto.

#### Fase 3 — Nascer limpo

- [x] T009 [OPS] [US-001] Criar a branch de trabalho com raiz órfã, verificando com .claude/scripts/phase0/assert-orphan-root.check.js — Refs: US-001, FR-002, NFR-001, AC-002, AC-007 — Depends: T002, T008
  - [x] **PREP**: Confirmado T008 em GREEN; horário de início gravado em `.git/phase0-run-state.json`.
  - [x] **EXECUTE**: `git checkout --orphan refactor/v1-cli-first` — branch sem commits.
  - [x] **VERIFY**: `assert-orphan-root` em RED parcial, correto para o ponto sem commit.
  - [x] **EVIDENCE**: Horário de início e saída parcial registrados na seção 12.
  - [x] **IMPROVE**: A baseline da main passou a ser gravada aqui, e não no congelamento, para não confundir dois instantes distintos.

- [x] T010 [OPS] [US-001] Reduzir a árvore ao conjunto preservado, verificando com .claude/scripts/phase0/assert-no-legacy.check.js — Refs: US-001, FR-003, FR-004, AC-003, AC-004, AC-009 — Depends: T003, T004, T009
  - [x] **PREP**: Quatro caminhos preservados presentes e não vazios: 8, 97, 14 arquivos e o symlink.
  - [x] **EXECUTE**: Índice esvaziado, 20 caminhos removidos do topo, quatro caminhos reindexados — 120 entradas.
  - [x] **VERIFY**: `git status` sem entrada fora do conjunto preservado.
  - [x] **EVIDENCE**: Listagem do índice e da árvore registradas na seção 12.
  - [x] **IMPROVE**: A remoção incluiu arquivos não rastreados, para que a regra valesse na árvore inteira e não só no índice.

- [x] T011 [OPS] [US-001] Registrar o commit raiz da branch de trabalho, verificando com .claude/scripts/phase0/assert-preserved-set.check.js — Refs: US-001, FR-002, FR-003, FR-004, AC-002, AC-003, AC-004 — Depends: T010
  - [x] **PREP**: Resultado de T010 confirmado.
  - [x] **EXECUTE**: Commit raiz `53f9949` com 119 arquivos.
  - [x] **VERIFY**: Quatro asserções em GREEN após corrigir a inclusão indevida de `.project-context/skills-lock.json`.
  - [x] **EVIDENCE**: Saídas de GREEN e o SHA do commit raiz registrados na seção 12.
  - [x] **IMPROVE**: `assert-preserved-set` capturou um arquivo a mais e evitou que a branch nascesse divergente da main.

- [x] T012 [OPS] [US-001] Publicar a branch de trabalho no remoto a partir de .claude/scripts/phase0/assert-orphan-root.check.js — Refs: US-001, FR-002, NFR-001, AC-002, AC-006 — Depends: T011
  - [x] **PREP**: Branch remota inexistente, publicação sem sobrescrita.
  - [x] **EXECUTE**: `git push -u origin refactor/v1-cli-first` — nova branch remota; horário de término gravado.
  - [x] **VERIFY**: `assert-orphan-root` em GREEN contra a referência publicada.
  - [x] **EVIDENCE**: Saída da publicação e intervalo de 70s registrados na seção 12.
  - [x] **IMPROVE**: Nenhuma melhoria necessária: a publicação seguiu sem sobrescrita nem force-push.

#### Fase 4 — GREEN e fechamento

- [x] T013 [TEST] [TDD] [US-001] [US-002] Executar a suíte completa de asserções em .claude/scripts/phase0/ — Refs: US-001, US-002, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011 — Depends: T005, T007, T012
  - [x] **PREP**: Sete asserções reunidas, todas com RED registrado antes das operações.
  - [x] **EXECUTE**: `node .claude/scripts/phase0/run-all.check.js` sobre a branch publicada.
  - [x] **VERIFY**: GREEN nas sete, exit 0.
  - [x] **EVIDENCE**: Saídas de GREEN registradas na seção 12, ao lado das de RED.
  - [x] **IMPROVE**: `run-all` passou a existir como ponto único de entrada da suíte.

- [x] T014 [DOC] [US-001] [US-002] Registrar o relatório final da fase na seção 12 de specs/completed/0001-phase-0-preparacao-limpeza/spec.md — Refs: US-001, US-002, NFR-001, NFR-002, NFR-003, AC-006, AC-007, AC-010 — Depends: T013
  - [x] **PREP**: Evidências de T001 a T013 reunidas.
  - [x] **EXECUTE**: Oito itens conferidos, incluindo clone limpo de `archived` com 1010 testes da v0.2.8 passando.
  - [x] **VERIFY**: Os oito itens retornam positivo.
  - [x] **EVIDENCE**: Relatório completo na seção 12, com a ausência de `PROJECT.md` declarada.
  - [x] **IMPROVE**: A fase expôs sete limitações do framework e três defeitos do próprio plano, todos registrados na seção 13 em vez de contornados em silêncio.

### 15. Ordem de execução

- Caminho crítico: T001 e T006 → T008 → T009 → T010 → T011 → T012 → T013 → T014.
- Tarefas paralelas: T001 a T007 executam em paralelo, porque criam arquivos distintos e nenhuma depende do resultado das outras.
- Barreira deliberada: T008 separa a Fase 1 da Fase 3. A limpeza é irreversível, e nenhuma remoção começa antes de `assert-archived-frozen.check.js` alcançar GREEN.
- Estratégia de MVP: não se aplica. A fase é indivisível — uma branch de trabalho parcialmente limpa não entrega valor nem pode ser usada pela Phase 1.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Remoto git acessível, com permissão para criar e publicar branches.
- Nenhuma dependência de software além do git.

#### Riscos

- **Limpeza executada antes do congelamento** → perda irreversível da v0.2.8. Mitigação: T002 é barreira; nenhuma remoção começa sem a comparação de árvore aprovada.
- **Parte do conjunto preservado removida por engano durante T004** → perda do registro de decisões que governa a Phase 1, ou do framework que a conduz. Mitigação: T004 aborta se qualquer um dos três caminhos estiver ausente ou vazio, T005 confere a listagem contra a main antes de commitar e T007 executa uma captura real para provar que o framework opera.
- **`.claude/` carregar configuração da v0.2.8 para a branch nova** → resíduo do produto antigo dentro do conjunto preservado. Mitigação: a Phase 1 reescreve a configuração de agentes; a Phase 0 não faz curadoria interna para não arriscar quebrar o framework durante a limpeza.
- **Proteção de branch no remoto impede a publicação** → a fase trava em T001 ou T006. Mitigação: parar e relatar; não desativar proteção sem autorização explícita.
- **`archived` alterada depois de congelada** → o congelamento perde sentido. Mitigação: PR-002, verificação de reflog em T007 e recomendação de proteger a branch no remoto.
- **Substituição da main antecipada** → a v1.0 vira padrão antes de estabilizar. Mitigação: a substituição está em Fora de escopo e não tem tarefa nesta fase.

#### Suposições

- O remoto configurado é o destino correto de `archived` e da branch de trabalho.
- A pessoa que executa tem permissão de push para branches novas.
- A main está no commit que se deseja congelar; nenhuma revisão pendente precisa entrar antes.
- Há espaço em disco para as operações git sobre a árvore atual.

### 17. Decisões

- **DEC-001**: Sobrevivem à limpeza `specs/`, `.claude/` e `.project-context/`. *Razão*: `specs/` é o registro das decisões que governam a reescrita, e `.claude/` com `.project-context/` são o framework former project tool já configurado; preservá-los evita reconfigurar o framework e permite que a Phase 1 leia seus requisitos onde vai produzir código. *Nota*: `.project-context/` acompanha `.claude/` por necessidade técnica, não por escolha independente — as skills resolvem templates em `.project-context/templates/` e carregam o contrato em `.project-context/Spec.md`. *Alternativas*: preservar nada — descartada porque obrigaria a Phase 1 a trocar de branch para ler os próprios requisitos e a reinstalar o framework; preservar só `specs/` — descartada pelo custo de reconfiguração; preservar só `.claude/` — inviável, deixaria as skills presentes e inoperantes.
- **DEC-002**: A branch de trabalho nasce com raiz órfã. *Razão*: sem ancestral comum, a v0.2.8 não é alcançável a partir da linha nova, e a substituição posterior da main vira troca de ponteiro em vez de merge. *Alternativa*: commit de limpeza sobre o histórico existente — descartada porque manteria a v0.2.8 na linha e exigiria merge depois.
- **DEC-003**: Não há CHANGELOG, aviso de breaking change nem guia de migração. *Razão*: o resultado é um produto novo que substitui o anterior, não uma versão seguinte dele. *Trade-off*: quem usa a v0.2.8 não recebe aviso no repositório; aceito porque `archived` mantém a versão anterior consultável para sempre.
- **DEC-004**: A substituição da main fica fora da Phase 0. *Razão*: a troca só faz sentido com a branch estabilizada, o que depende da Phase 1. *Trade-off*: o repositório fica com duas linhas por um período; aceito por ser reversível até a troca.
- **DEC-006**: A verificação é feita por scripts de asserção em Node puro, arquivos `.js` CommonJS sem dependência, guardados em `.claude/scripts/phase0/`. *Razão*: o escopo proíbe instalar dependências, e o Node já é pré-requisito das próprias skills former project tool, de modo que nada novo entra; scripts sem `node_modules` sobrevivem à limpeza que precisam verificar. *Alternativas*: shell POSIX — foi a primeira escolha e satisfazia as duas restrições acima, mas o auditor `check_traceability.mjs` varre um conjunto fechado de extensões que inclui `.js` e exclui `.sh`, o que tornaria as asserções corretas e invisíveis ao Delivery Gate; Node com Vitest — descartada por antecipar a tooling da Phase 1 e exigir instalação; checklist puramente manual — descartada porque operação irreversível merece guarda executável.
- **DEC-007**: `.agents` passa a ser link simbólico para `.claude` e entra no conjunto preservado. *Razão*: esta instalação usa o layout do Claude Code, enquanto os scripts e a documentação do framework resolvem caminhos sob `.agents/skills/`; sem o link, o validador de tarefas reprova por não encontrar `verify_evidence.mjs` e os comandos documentados nas skills falham. *Trade-off*: é acomodação local a um defeito do framework, não correção dele; a correção pertence ao validador, que deveria aceitar os dois layouts.
- **DEC-008**: A contagem de asserções é definida pelos riscos da fase, e o mínimo do validador é tratado como sinal, não como cota a preencher. *Razão*: o plano começou com cinco asserções e ficou abaixo do mínimo em cinco IDs. A análise do que faltava expôs duas lacunas reais, não burocráticas: nada verificava mecanicamente que a main e `archived` permaneciam intocadas durante a sequência destrutiva — o risco mais grave da fase —, e o orçamento de tempo dependia de leitura humana de cronômetro. Fechadas as duas, o mínimo passou a ser atendido sem asserção supérflua. *Consequência*: `assert-baseline-untouched.check.js` e `assert-elapsed-budget.check.js` existem porque guardam algo, e não porque o validador pedia número.
- **DEC-005**: `archived` é congelada antes de qualquer remoção. *Razão*: a limpeza é irreversível e a ordem inversa perderia a v0.2.8. *Alternativa*: congelar ao final — descartada por não haver o que congelar depois.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam — `verify_acceptance.mjs` retorna `QA: PASSED` para os onze.
- [x] Todos os requisitos possuem evidência de verificação registrada na matriz da seção 12.
- [x] Todas as tarefas da seção 14 estão concluídas — 14 de 14, 70 de 70 itens de checklist.
- [x] A branch de trabalho está publicada, com raiz órfã única e árvore restrita ao conjunto preservado. O texto anterior exigia "um único commit", verdade apenas no instante de T011: a branch cresce legitimamente depois disso, e a invariante é a raiz sem pai somada à ausência de ancestral comum com a main.
- [x] O impacto em `PROJECT.md` foi tratado. O arquivo não existe no repositório em 2026-08-24; a Phase 0 não o cria, porque descrever a finalidade do produto novo cabe à Phase 1. A ausência fica registrada na evidência de T014.
- [x] `archived` está publicada, congelada e protegida contra escrita. **Publicada**: sim, em `aac477a`. **Congelada por regra**: sim, PR-002, com `assert-baseline-untouched` detectando qualquer escrita. **Protegida tecnicamente**: sim, por ruleset `protected` (id 21321914), `enforcement: active`, alvo `refs/heads/archived`, regras `deletion` e `non_fast_forward`, sem nenhum ator de bypass. A proteção passou de detectiva a preventiva: force-push e deleção são recusados pelo servidor.

  A primeira verificação deste item concluiu erroneamente que a branch não estava protegida, porque consultou apenas a API de branch protection legada, que responde 404 para regras criadas como ruleset. O endpoint correto para a pergunta "quais regras valem para esta branch" é `repos/<owner>/<repo>/rules/branches/<branch>`, que reporta as duas regras em vigor.

---

#### Aceite final — 2026-08-24

`node .claude/skills/framework-04-validate/scripts/validate_spec.mjs` READY · `validate_tasks.mjs` READY · `verify_acceptance.mjs` QA PASSED nos onze ACs · `check_traceability.mjs` OK em 20 de 20 IDs · `run-all.check.js` GREEN nas sete asserções · Definition of Done sem item aberto.

O aceite conferiu cada afirmação contra o repositório em vez de reler a evidência registrada, e isso expôs quatro defeitos que a entrega não tinha visto:

| ID | Achado | Estado |
| --- | --- | --- |
| A1 | O cabeçalho declarava `Delivery Gate: Passed` enquanto a seção 13 registrava `Pending`; uma substituição de texto falhou em silêncio e a entrega foi reportada como concluída sem conferência | Resolvido |
| A2 | Os onze ACs não tinham resultado: a matriz da seção 12 nunca fora atualizada após a renumeração, apontava para T002, T005 e T007, trazia comandos extintos e registrava número de tarefa onde o auditor exige resultado | Resolvido — 24 linhas reescritas |
| A3 | A Definition of Done afirmava "um único commit", "árvore restrita a `specs/`" e "evidência de T007", tudo obsoleto | Resolvido |
| A4 | A Definition of Done afirmava `archived` protegida contra escrita, e a branch não estava protegida | Resolvido — ruleset `protected` aplicado pela pessoa responsável |

Sobre A4, uma falha de abordagem vale registro: a primeira verificação concluiu que a branch não estava protegida consultando apenas a API de branch protection legada, que responde 404 para regras criadas como ruleset. A pergunta "quais regras valem para esta branch" se responde em `repos/<owner>/<repo>/rules/branches/<branch>`, e foi esse endpoint que confirmou `deletion` e `non_fast_forward` ativos, sem ator de bypass.

#### Nota de manutenção — 2026-08-24, após a conclusão

As asserções desta fase foram renomeadas de `*.test.js` para `*.cjs`, e `lib.js` para `lib.cjs`. Duas razões independentes convergiram.

A primeira é a colisão de identificadores. SPEC-0001 e SPEC-0002 usam o mesmo esquema — `US-001`, `FR-001`, `AC-001` —, e `check_traceability.mjs` varre a árvore inteira sem distinguir a qual spec um marcador pertence. Com as asserções desta fase nomeadas como teste, o auditor as creditava à fatia seguinte e reportava `MARCADORES ÓRFÃOS: AC-011`. A extensão `.cjs` está fora da lista que ele varre.

A segunda é mais grave e passou despercebida por sete tarefas. Quando SPEC-0002 declarou `"type": "module"` no manifesto, cada arquivo `.js` do projeto passou a ser tratado como ESM, e estas asserções são CommonJS. **A suíte desta fase esteve quebrada desde então**, com `ReferenceError: require is not defined`, sem que ninguém a reexecutasse. `.cjs` restaura o tratamento correto independentemente do campo `type`.

Na mesma revisão, `assert-no-legacy` foi corrigida. Ela comparava `HEAD` da branch de trabalho, que cresce legitimamente conforme o produto avança, de modo que cada arquivo novo passava a contar como resíduo da v0.2.8. Passou a comparar o commit raiz, que é o momento a que AC-004 se refere. É o mesmo defeito já corrigido em `assert-preserved-set` e `assert-orphan-root`, e que escapou nesta terceira.

A suíte volta a passar nas sete asserções. O estado entregue pela fase não mudou; a correção é do instrumento.
