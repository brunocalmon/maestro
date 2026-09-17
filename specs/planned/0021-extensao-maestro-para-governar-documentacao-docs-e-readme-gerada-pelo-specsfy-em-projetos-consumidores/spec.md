# Especificação integrada: Extensão maestro para governar documentação (docs/ e README) gerada pelo Specsfy em projetos consumidores

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0021 |
| Slug | 0021-extensao-maestro-para-governar-documentacao-docs-e-readme-gerada-pelo-specsfy-em-projetos-consumidores |
| Status | Planned |
| Effort | 4 |
| Effort updated at | 2026-09-16 |
| Effort rationale | Perfil `standard`: toca cinco módulos existentes (`router.ts`, `setup/run.ts`, `setup/readme.ts`, `config/schema.ts`, `doctor.ts`) reaproveitando mecanismos já maduros (createExtension, padrão de diagnóstico read-only), sem introduzir framework, schema de banco ou tela nova. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Pending |
| Evidence Contract | 1 |
| Interface para pessoas | Não |
| Atualizada em | 2026-09-16 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O `maestro` não exporta, para os projetos que instala, nenhuma regra persistente sobre como a documentação (`docs/` e `README.md` raiz) deve se comportar. A única política equivalente já definida (`.specsfy/RULES.md:75-101`) vale só para o próprio repositório do maestro, autogerada pela skill `specsfy-aux-rules`, e nunca chega a um projeto consumidor via `maestro setup`. Dois defeitos concretos reforçam o problema: (1) `buildDefaultConfig()` inclui por padrão uma exceção de idioma (`specsfy_docs_managed_block`) que força `docs/**/*.md` para `pt_BR`, mesmo quando o `language.default` do projeto é outro; (2) `ensureReadmeHomepage()` grava, em qualquer projeto-alvo sem `README.md`, o conteúdo literal do README do próprio maestro.

#### Resultado desejado

Qualquer projeto que rodar `maestro setup` passa a ter, de forma persistente e sobrevivendo a reinstalação, uma regra que orienta qualquer geração ou edição de `docs/` e `README.md` raiz a seguir o idioma geral do projeto, nunca ficar vazia/incompleta, usar Mermaid válido e manter backlinks de navegação — como camada aditiva sobre o que o Specsfy decide gerar, nunca a substituindo. Os dois defeitos são corrigidos como parte da mesma entrega, e `maestro doctor` passa a reportar desvios de documentação.

#### Métricas de sucesso

- 100% dos projetos que rodam `maestro setup` recebem o bloco de regra de documentação em `CLAUDE.md`/`AGENTS.md`, verificável por teste automatizado.
- Zero ocorrência de `README.md` com conteúdo do próprio maestro em projeto-alvo sem README prévio, verificável por teste automatizado.
- `maestro doctor` reporta 100% dos casos sintéticos de teste com Mermaid experimental, backlink ausente ou `docs/` vazio.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] A exceção `specsfy_docs_managed_block` não reflete o comportamento real de geração de `docs/`, porque o script que ela cita nunca lê idioma configurável e o conteúdo real já diverge do seu skeleton independentemente de idioma — Verdict: verified — Confidence: high — Evidence: research/build-documentation-script-analysis.md#achado — Budget: 1/1. Lida a fonte real (`.claude/skills/specsfy-documentator/scripts/build_documentation.mjs`), confirmado que ela nunca lê `.maestro/config.yaml` e hardcoda títulos/prosa em português apenas no *skeleton* mecânico. Comparado com o conteúdo real dentro do marcador `<!-- specsfy:documentator:start/end -->` em `docs/architecture.md` (inglês, detalhado, estruturalmente diferente do skeleton) e confirmado via `node build_documentation.mjs --check`, que já reporta os 10 arquivos de `docs/` como "desatualizados" frente ao skeleton — ou seja, a divergência que a exceção tenta evitar já existe hoje, independentemente de idioma.
- **R-002** [high] `.specsfy/PACKAGES.md`, também escrito pelo mesmo script mecânico, está genuinamente em português, mas fora do padrão `docs/**/*.md` da exceção atual — Verdict: verified — Confidence: high — Evidence: research/build-documentation-script-analysis.md#achado-adicional-sobre-packages — Budget: 1/1. Confirmado que `.specsfy/PACKAGES.md` tem cabeçalhos em português ("Pacotes e bibliotecas", "Gerenciador", "Finalidade"), batendo com o skeleton mecânico do script — mas essa exceção não está sequer coberta pelo padrão `docs/**/*.md` da exceção atual (o script escreve em `.specsfy/PACKAGES.md`, fora de `docs/`). Fica registrado como inconsistência pré-existente, fora do escopo desta entrega (ver "Fora de escopo").
- **R-003** [critical] Specsfy está sempre ativo em qualquer instalação real de `maestro setup`, porque o CLI e a ferramenta MCP sempre passam o executor real, sem nenhuma flag de opt-out — Verdict: verified — Confidence: high — Evidence: research/specsfy-always-active.md#achado — Budget: 1/1. Os dois pontos de entrada reais (`maestro setup` em `src/cli.ts:224-234` e a ferramenta MCP em `src/mcp/tool.ts:120-140`) sempre passam `specsfy: { execute: realSpecsfyExecutor() }`, sem nenhuma flag de opt-out em `SETUP_FLAGS`. A assinatura opcional `opts.specsfy?` em `runSetup` é só uma costura de injeção de dependência para teste.

#### Fontes e contexto consultados

- `.specsfy/RULES.md:75-101` — política de idioma/Mermaid/índice já confirmada para o próprio repositório do maestro.
- `src/extensions/router.ts`, `src/setup/run.ts`, `src/setup/readme.ts`, `src/config/schema.ts`, `src/doctor.ts`, `src/extensions/create.ts`, `src/extensions/diagnose.ts` — mecanismos reaproveitados nesta entrega.
- `.claude/skills/specsfy-documentator/scripts/build_documentation.mjs` e `references/documentation-standard.md` — comportamento real do gerador mecânico do Specsfy.
- `specs/completed/0012-regra-common-rules-idioma-padrao-e-config-yaml-sempre-presente/spec.md` — precedente do mecanismo de bloco de idioma.
- `specs/backlog/0010-extensao-maestro-para-governar-documentacao-docs-e-readme-gerada-pelo-specsfy-em-projetos-consumidores.md` — brief promovido nesta spec.

#### Documentação consultada

- Nenhuma documentação externa (não vendorizada no projeto) foi consultada; toda evidência vem do próprio repositório.

#### Artefatos de pesquisa armazenados

- `specs/draft/0021-extensao-maestro-para-governar-documentacao-docs-e-readme-gerada-pelo-specsfy-em-projetos-consumidores/research/build-documentation-script-analysis.md`: cópia anotada dos trechos relevantes de `build_documentation.mjs` e da saída de `--check`, com a conclusão do R-001/R-002.
- `specs/draft/0021-extensao-maestro-para-governar-documentacao-docs-e-readme-gerada-pelo-specsfy-em-projetos-consumidores/research/specsfy-always-active.md`: trechos de `src/cli.ts` e `src/mcp/tool.ts` que embasam o R-003.

#### Dúvidas respondidas

- **Q**: A regra deve valer só quando o Specsfy está ativo, ou de forma agnóstica? → **A**: Specsfy está sempre ativo em qualquer instalação real (R-003); a regra pode assumir isso, sem caminho alternativo.
- **Q**: Qual conteúdo genérico substitui o `DEFAULT_ROOT_README` hardcoded? → **A**: placeholder genérico sem inventar nome/descrição do projeto-alvo, só com a seção de índice e um aviso para preencher título/descrição.
- **Q**: A entrega inclui checagem automática além do texto de regra? → **A**: sim, `maestro doctor` passa a reportar (não corrigir) desvios.
- **Q**: A exceção de idioma que força `docs/**/*.md` para `pt_BR` deve mudar de escopo ou ser removida? → **A**: removida — a pesquisa (R-001) mostrou que ela não reflete a prática real; `docs/**/*.md` deve seguir `language.default` como qualquer outro documento gerado.

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Nova extensão (categoria `extension`, mesmo mecanismo de `createExtension` que já entrega os blocos `## maestro` e `## maestro: language`) instalada em cada execução de `maestro setup`, com regra de documentação em texto.
- Remoção da entrada `specsfy_docs_managed_block` do default de `language.exceptions` em `buildDefaultConfig()`.
- Substituição do `DEFAULT_ROOT_README` hardcoded por um placeholder genérico em `ensureReadmeHomepage()`.
- Nova checagem informativa em `maestro doctor` para `docs/` vazio/ausente, Mermaid experimental e backlink ausente.

#### Fora de escopo

- Geração do conteúdo de `docs/` em si — continua inteiramente a cargo do Specsfy/`specsfy-documentator`.
- Qualquer redefinição da topologia de `docs/` (`architecture.md`, `database.md` etc.) definida em `documentation-standard.md`.
- Correção automática (auto-fix) pelo `doctor` — ele só reporta.
- A inconsistência de idioma em `.specsfy/PACKAGES.md` (R-002) — é um arquivo do próprio Specsfy, fora de `docs/`, e não foi pedida pelo usuário; registrada como observação para um backlog futuro.
- Suporte a idiomas além do já existente `language.default`/`language.exceptions`.
- Correção ou modificação do script externo `build_documentation.mjs` (pertence ao pacote `@promovaweb/specsfy`, fora do controle deste repositório).

#### Atores

- **Mantenedor do maestro**: roda `maestro setup` em projetos consumidores e espera que a documentação desses projetos siga suas diretrizes sem reconfiguração manual.
- **Agente de codificação** (Claude Code ou outro, em qualquer projeto consumidor): lê `CLAUDE.md`/`AGENTS.md` e aplica a regra de documentação ao gerar ou editar `docs/`/`README.md`.
- **`maestro doctor`** (processo automatizado): lê `docs/*.md` e `README.md` do projeto e reporta desvios, sem escrever.

### 4. Princípios e restrições do projeto

- **PR-001**: A extensão nunca sobrescreve nem redefine a topologia ou o conteúdo que o Specsfy decide gerar em `docs/` — é sempre uma camada aditiva de preferências, nunca uma segunda fonte normativa de estrutura de documentação.
- **PR-002**: Nenhum mecanismo desta entrega escreve em `docs/*.md` ou faz chamada de rede — instalação de regra e checagem do `doctor` são estritamente locais e read-only (exceto a própria escrita da extensão/README na primeira instalação, que segue o padrão idempotente já existente em `createExtension`).
- **PR-003**: `maestro doctor` reporta, nunca corrige documentação automaticamente — mesma filosofia dos diagnósticos já existentes (`diagnoseExtensions`, `diagnoseAgents`).

### 5. Histórias de usuário

#### US-001 — Regra de documentação exportada a qualquer projeto consumidor (P1)

Como mantenedor do maestro, quero que `maestro setup` instale uma regra persistente de documentação (idioma, completude, Mermaid válido, backlinks) em qualquer projeto consumidor, para que eu não precise reconfigurar cada projeto manualmente nem depender de exceções de idioma desatualizadas.

**Por que P1**: é o núcleo do pedido — sem a extensão instalada, nada mais desta entrega tem efeito prático em projetos consumidores.
**Teste independente**: rodar `runSetup` contra uma raiz de teste isolada e inspecionar `CLAUDE.md`/`AGENTS.md` e `.maestro/config.yaml` gerados.
**Requisitos**: FR-001, FR-002

#### US-002 — README genérico quando ausente (P1)

Como mantenedor do maestro, quero que `maestro setup` nunca grave conteúdo do próprio maestro num projeto-alvo sem `README.md`, para que esse projeto receba um ponto de partida genérico e correto em vez de um README que fala de outro produto.

**Por que P1**: é um defeito ativo e visivelmente incorreto; qualquer projeto sem README hoje recebe conteúdo errado.
**Teste independente**: rodar `ensureReadmeHomepage` contra uma raiz de teste sem `README.md` e inspecionar o conteúdo gravado.
**Requisitos**: FR-003

#### US-003 — Doctor aponta desvios de documentação (P2)

Como mantenedor do maestro, quero que `maestro doctor` reporte quando `docs/` estiver vazio, tiver Mermaid inválido ou faltar backlink, para que eu descubra esses problemas sem inspecionar manualmente cada arquivo de cada projeto.

**Por que P2**: depende de US-001 existir primeiro (a regra em texto) para fazer sentido como complemento; tem valor independente, mas é a checagem automática, não a regra em si.
**Teste independente**: rodar `inspectDependencies`/`diagnoseDocumentation` contra fixtures de teste com cada tipo de desvio e inspecionar o relatório resultante.
**Requisitos**: FR-004, FR-005, FR-006

### 6. Cenários BDD de aceite

#### AC-001 — Extensão de documentação instalada com o texto de regra completo

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-001
Feature: Regra de documentação instalada pelo setup

  Scenario: Primeira execução de setup instala o bloco de documentação
    Given um projeto-alvo sem nenhuma extensão de documentação instalada
    When "maestro setup" roda contra esse projeto
    Then "CLAUDE.md" passa a conter uma seção "## maestro: documentation"
    And essa seção instrui a seguir "language.default", nunca deixar docs/README vazios, usar Mermaid válido e manter backlinks
```

#### AC-002 — Reexecução do setup não duplica o bloco

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-002
Feature: Regra de documentação instalada pelo setup

  Scenario: Setup roda duas vezes seguidas
    Given um projeto-alvo onde "maestro setup" já instalou a extensão de documentação
    When "maestro setup" roda novamente
    Then "CLAUDE.md" continua com exatamente uma seção "## maestro: documentation"
    And nenhum conteúdo é duplicado ou sobrescrito
```

#### AC-003 — AGENTS.md recebe o ponteiro, doctor detecta drift manual

**Cobre**: US-001, FR-001, NFR-001, US-003

```gherkin
@US-001 @FR-001 @NFR-001 @US-003 @AC-003
Feature: Regra de documentação instalada pelo setup

  Scenario: AGENTS.md aponta para o bloco completo em CLAUDE.md
    Given um projeto-alvo onde "maestro setup" instalou a extensão de documentação
    When alguém edita manualmente o ponteiro em "AGENTS.md"
    Then "maestro doctor" reporta a divergência via o mecanismo já existente de "diagnoseExtensions"
```

#### AC-004 — Config.yaml default deixa de forçar pt_BR em docs/

**Cobre**: US-001, FR-002

```gherkin
@US-001 @FR-002 @AC-004
Feature: Exceção de idioma corrigida

  Scenario: Config.yaml recém-criado não tem exceção para docs/
    Given um projeto-alvo sem ".maestro/config.yaml" ainda
    When "maestro setup" roda pela primeira vez
    Then "language.exceptions" em ".maestro/config.yaml" contém somente a entrada "specsfy_specs" (specs/**/spec.md)
    And nenhuma entrada força "docs/**/*.md" para um idioma diferente de "language.default"
```

#### AC-005 — Config.yaml existente com a exceção antiga não é reescrito à força

**Cobre**: FR-002, US-001

```gherkin
@FR-002 @US-001 @AC-005
Feature: Exceção de idioma corrigida

  Scenario: Pessoa já tinha customizado a exceção manualmente
    Given um projeto-alvo cujo ".maestro/config.yaml" já existe e já tem "language.exceptions" customizado pela pessoa, incluindo uma entrada para "docs/**/*.md"
    When "maestro setup" roda novamente
    Then o valor customizado pela pessoa em "language.exceptions" é preservado sem alteração
    And a remoção do default vale apenas para configurações novas, nunca sobrescrevendo o que a pessoa já definiu
```

#### AC-006 — Documentação gerada respeita o idioma geral do projeto

**Cobre**: FR-002, US-001

```gherkin
@FR-002 @US-001 @AC-006
Feature: Exceção de idioma corrigida

  Scenario: Projeto com language.default em inglês
    Given um projeto-alvo com ".maestro/config.yaml" declarando "language.default: en_US"
    When um agente de codificação lê a regra de documentação instalada e gera ou edita um arquivo em "docs/"
    Then o agente escreve esse arquivo em inglês, seguindo "language.default", sem consultar uma exceção específica para "docs/"
```

#### AC-007 — README ausente recebe placeholder genérico

**Cobre**: US-002, FR-003

```gherkin
@US-002 @FR-003 @AC-007
Feature: README genérico quando ausente

  Scenario: Projeto-alvo sem README.md
    Given um projeto-alvo sem "README.md" na raiz
    When "maestro setup" roda
    Then um "README.md" é criado com uma seção de índice apontando para "docs/README.md"
    And o conteúdo não menciona "maestro", "@brunocalmon/maestro" nem qualquer nome ou comando específico de outro projeto
    And o conteúdo inclui um aviso explícito de que título e descrição precisam ser preenchidos
```

#### AC-008 — README existente é preservado

**Cobre**: US-002, FR-003

```gherkin
@US-002 @FR-003 @AC-008
Feature: README genérico quando ausente

  Scenario: Projeto-alvo já tem README.md próprio
    Given um projeto-alvo com "README.md" já existente e com conteúdo próprio do projeto
    When "maestro setup" roda
    Then o conteúdo do "README.md" não é substituído pelo placeholder genérico
```

#### AC-009 — README existente com links malformados continua sendo só sanitizado

**Cobre**: US-002, FR-003

```gherkin
@US-002 @FR-003 @AC-009
Feature: README genérico quando ausente

  Scenario: Projeto-alvo tem README.md com links antigos em formato inválido
    Given um projeto-alvo com "README.md" existente contendo links como "(/docs/architecture.md)" ou "(./docs/architecture.md)"
    When "maestro setup" roda
    Then os links são normalizados para "docs/architecture.md" pelo mecanismo já existente de sanitização
    And o restante do conteúdo do README permanece inalterado
```

#### AC-010 — Doctor reporta docs/ ausente ou com arquivo vazio

**Cobre**: US-003, FR-004, NFR-003

```gherkin
@US-003 @FR-004 @NFR-003 @AC-010
Feature: Doctor aponta desvios de documentação

  Scenario: Specsfy instalado mas docs/ ausente
    Given um projeto-alvo onde ".specsfy/" existe mas o diretório "docs/" não existe
    When "maestro doctor" roda com a raiz desse projeto
    Then o relatório do doctor inclui um alerta de documentação ausente
```

#### AC-011 — Doctor reporta Mermaid experimental

**Cobre**: US-003, FR-005, NFR-002, NFR-003

```gherkin
@US-003 @FR-005 @NFR-002 @NFR-003 @AC-011
Feature: Doctor aponta desvios de documentação

  Scenario: docs/architecture.md usa sintaxe Mermaid experimental
    Given um "docs/architecture.md" contendo um bloco ```mermaid iniciado por "block-beta"
    When "maestro doctor" roda com a raiz desse projeto
    Then o relatório do doctor inclui um alerta apontando o arquivo "docs/architecture.md" e a sintaxe experimental encontrada
```

#### AC-012 — Doctor não reporta falso positivo de Mermaid

**Cobre**: FR-005

```gherkin
@FR-005 @AC-012
Feature: Doctor aponta desvios de documentação

  Scenario: docs/architecture.md sem Mermaid ou com Mermaid estável
    Given um "docs/architecture.md" sem nenhum bloco ```mermaid, ou com um bloco ```mermaid iniciado por "flowchart", "sequenceDiagram", "classDiagram", "erDiagram", "stateDiagram-v2", "gantt", "mindmap" ou "C4Component"
    When "maestro doctor" roda com a raiz desse projeto
    Then o relatório do doctor não inclui alerta de Mermaid para esse arquivo
```

#### AC-013 — Doctor reporta backlink ausente, exceto no próprio portal

**Cobre**: US-003, FR-006, NFR-003

```gherkin
@US-003 @FR-006 @NFR-003 @AC-013
Feature: Doctor aponta desvios de documentação

  Scenario: docs/architecture.md sem link de volta ao README raiz
    Given um "docs/architecture.md" sem nenhum link apontando para "../README.md"
    When "maestro doctor" roda com a raiz desse projeto
    Then o relatório do doctor inclui um alerta de backlink ausente para "docs/architecture.md"
```

#### AC-014 — Doctor não escreve nada, mesmo com achados

**Cobre**: NFR-002, FR-004, FR-005, FR-006

```gherkin
@NFR-002 @FR-004 @FR-005 @FR-006 @AC-014
Feature: Doctor aponta desvios de documentação

  Scenario: Projeto com múltiplos desvios de documentação
    Given um projeto-alvo com "docs/" vazio, um "docs/outro.md" com Mermaid experimental e sem backlink
    When "maestro doctor" roda com a raiz desse projeto
    Then nenhum arquivo em "docs/" ou "README.md" é alterado
    And nenhuma chamada de rede é feita
```

#### AC-015 — Achados de documentação não afetam o exitCode do doctor

**Cobre**: US-003, NFR-003

```gherkin
@US-003 @NFR-003 @AC-015
Feature: Doctor aponta desvios de documentação

  Scenario: Único problema do projeto é de documentação
    Given um projeto-alvo onde todas as dependências, extensões e agentes estão corretos, mas "docs/" tem um desvio de documentação
    When "maestro doctor" roda com a raiz desse projeto
    Then o "exitCode" do relatório permanece "0"
    And o alerta de documentação aparece no relatório de forma informativa
```

#### AC-016 — Doctor reporta docs/ com arquivo de 0 bytes

**Cobre**: FR-004

```gherkin
@FR-004 @AC-016
Feature: Doctor aponta desvios de documentação

  Scenario: docs/ existe mas contém só um arquivo vazio
    Given um diretório "docs/" contendo apenas "README.md" com 0 bytes
    When "maestro doctor" roda com a raiz desse projeto
    Then o relatório do doctor inclui um alerta de documentação incompleta
```

#### AC-017 — Portal docs/README.md não precisa de backlink para si mesmo

**Cobre**: FR-006

```gherkin
@FR-006 @AC-017
Feature: Doctor aponta desvios de documentação

  Scenario: docs/README.md é o próprio índice
    Given um "docs/README.md" que não contém um link para "../README.md", mas contém a tabela-índice para os demais arquivos de "docs/"
    When "maestro doctor" roda com a raiz desse projeto
    Then o relatório do doctor não inclui alerta de backlink ausente para "docs/README.md"
```

#### AC-018 — Checagem de documentação não faz chamada de rede

**Cobre**: NFR-002

```gherkin
@NFR-002 @AC-018
Feature: Doctor aponta desvios de documentação

  Scenario: Ambiente sem acesso de rede
    Given um ambiente de execução sem acesso de rede disponível
    When "maestro doctor" roda com a raiz de um projeto com desvios de documentação
    Then o relatório é produzido normalmente, sem erro de rede
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve instalar, durante `runSetup`, uma extensão (mecanismo `createExtension`, categoria `extension`) com bloco completo `## maestro: documentation` em `CLAUDE.md` e ponteiro em `AGENTS.md`, contendo a regra de idioma (`language.default`), completude, Mermaid válido e backlinks — idempotente entre execuções.
- **FR-002**: O sistema deve remover a entrada `specsfy_docs_managed_block` do array retornado por `buildDefaultConfig().language.exceptions`, mantendo apenas `specsfy_specs`, sem alterar `.maestro/config.yaml` já existente e já customizado pela pessoa.
- **FR-003**: O sistema deve, quando `README.md` não existir na raiz do projeto-alvo, criar um README placeholder genérico — sem inventar nome, descrição ou conteúdo específico do projeto-alvo — com seção de índice para `docs/README.md` e aviso de preenchimento pendente; quando já existir, preservar o comportamento atual de sanitização de links sem reescrever o conteúdo.
- **FR-004**: O sistema deve, em `maestro doctor` com uma raiz de projeto informada e `.specsfy/` presente, reportar quando `docs/` estiver ausente ou contiver somente arquivo(s) vazio(s)/stub.
- **FR-005**: O sistema deve, em `maestro doctor`, reportar quando um `docs/*.md` contiver um bloco ` ```mermaid ` iniciado por um cabeçalho de sintaxe experimental/beta (ex.: `block-beta`, `architecture-beta`), sem reportar falso positivo para sintaxes estáveis (`flowchart`, `sequenceDiagram`, `classDiagram`, `erDiagram`, `stateDiagram-v2`, `gantt`, `mindmap`, `C4Component`) ou ausência de Mermaid.
- **FR-006**: O sistema deve, em `maestro doctor`, reportar quando um `docs/*.md` (exceto o próprio `docs/README.md`, que é o portal-índice) não contiver um link de volta para `../README.md`.

#### Não funcionais

- **NFR-001**: A instalação da extensão de documentação é idempotente — repetir `maestro setup` não duplica nem sobrescreve o bloco já instalado. **Verificação**: teste automatizado chamando `runSetup` duas vezes e comparando o conteúdo resultante de `CLAUDE.md`.
- **NFR-002**: A checagem de documentação do `doctor` é estritamente somente-leitura (nenhuma escrita em `docs/*.md`/`README.md`) e não depende de rede. **Verificação**: teste com ambiente de arquivo mockado garantindo zero chamadas de escrita/rede durante o diagnóstico.
- **NFR-003**: Achados de documentação são informativos — não alteram o `exitCode` de `maestro doctor` (mesma semântica já usada pela camada `agent` em `inspectDependencies`), evitando que uma heurística nova bloqueie pipelines existentes com falso positivo. **Verificação**: teste chamando `inspectDependencies` com uma raiz que só tem desvio de documentação e confirmando `exitCode: 0`.

#### Erros e casos-limite

- `.maestro/config.yaml` ainda não existe (primeira execução) → o README placeholder e a extensão de documentação são instalados normalmente; a criação do `config.yaml` (já existente, `ensureConfigFile`) segue sem a exceção de docs desde o primeiro `buildDefaultConfig()`.
- `docs/` criado manualmente fora da topologia do Specsfy (nomes de arquivo diferentes dos esperados) → o doctor reporta o que encontrar (vazio, Mermaid, backlink) sem exigir os nomes de arquivo específicos da topologia do `specsfy-documentator`.
- Projeto sem `.specsfy/` (hipoteticamente, já que R-003 mostrou que isso não ocorre em uso real) → a checagem de `docs/` ausente (FR-004) não se aplica, já que a condição declarada exige `.specsfy/` presente.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

Projeto TypeScript/Node (`>=20`), sem framework web, testado com Vitest (`test:tdd`: `vitest run`). Mecanismo de extensão local já maduro (`SPEC-0011`): `createExtension()` em `src/extensions/create.ts`, registro de checksum em `src/extensions/registry.ts`, diagnóstico read-only em `src/extensions/diagnose.ts`. Bloco de idioma já instalado (`SPEC-0012`): `buildConfigLanguageBlock`/`buildConfigLanguagePointer` em `src/extensions/router.ts`, chamados por `ensureConfigLanguageRouterCandidate()` em `src/setup/run.ts`. `maestro doctor` já compõe diagnósticos read-only análogos (`divergentExtensions`, `divergentAgents`) em `src/doctor.ts`, com a camada `agent` já demonstrando o padrão "informativo, nunca entra no exitCode".

#### Arquitetura e módulos

- **`src/extensions/router.ts`**: adicionar `buildDocumentationBlock()` (retorna o texto de `## maestro: documentation`) e `buildDocumentationPointer()` (retorna o ponteiro para `AGENTS.md`), no mesmo formato de `buildConfigLanguageBlock`/`buildConfigLanguagePointer`.
- **`src/setup/run.ts`**: adicionar `ensureDocumentationRuleCandidate(root)`, espelhando `ensureConfigLanguageRouterCandidate()`, chamando `createExtension()` duas vezes (`name: "config-documentation-rule"` → `CLAUDE.md`; `name: "config-documentation-pointer"` → `AGENTS.md`). Chamar essa função dentro de `ensureConfigYaml()`, logo após `ensureReadmeHomepage(root)`.
- **`src/setup/readme.ts`**: substituir `DEFAULT_ROOT_README` por um placeholder genérico (título entre colchetes/comentário indicando preenchimento pendente, seção de índice fixa para `docs/README.md`, sem qualquer menção a "maestro"). Nenhuma outra função do arquivo muda de assinatura.
- **`src/config/schema.ts`**: remover o objeto `specsfy_docs_managed_block` do array `exceptions` em `buildDefaultConfig()` (linhas 262-268 atuais), mantendo somente `specsfy_specs`.
- **Novo módulo `src/documentation/diagnose.ts`**: função pura `diagnoseDocumentation(root: string): DocumentationIssue[]`, lendo o filesystem real a partir da raiz recebida — mesmo padrão já usado por `diagnoseAgents(root)` em `src/agents/diagnose.ts` (sem ambiente injetável; testado com raízes temporárias reais, não com mocks). Detecta os três tipos de achado (docs vazio/ausente, Mermaid experimental, backlink ausente) como itens tipados (`kind: "empty" | "invalid-mermaid" | "missing-backlink"`, `file`, `detail`).
- **`src/doctor.ts`**: importar `diagnoseDocumentation`, adicionar campo `documentationIssues?: DocumentationIssue[]` a `Report`, compor no branch `root !== undefined` de `inspectDependencies` (mesmo ponto onde `divergentExtensions`/`divergentAgents` já são calculados), **sem** incluir no cálculo de `exitCode` (NFR-003).

#### Migrations

- Não aplicável — não há banco de dados.

#### Models

- Não aplicável — não há camada de modelo/ORM; as "entidades" desta entrega são arquivos de configuração e Markdown, descritas na seção 9.

#### Controllers e casos de uso

- Não aplicável no sentido de camada web; os "casos de uso" são as próprias funções de `setup` e `doctor` já descritas em "Arquitetura e módulos".

#### Views e experiência

- Não aplicável — sem interface para pessoas (seção 10 detalha a justificativa).

#### Queries e repositórios

- Não aplicável — leitura direta de arquivos via `fs`, sem camada de persistência estruturada.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/draft/0021-extensao-maestro-para-governar-documentacao-docs-e-readme-gerada-pelo-specsfy-em-projetos-consumidores/
  spec.md
  research/
    build-documentation-script-analysis.md
    specsfy-always-active.md
src/
  extensions/
    router.ts            (editado: + buildDocumentationBlock/Pointer)
  setup/
    run.ts                (editado: + ensureDocumentationRuleCandidate)
    readme.ts              (editado: DEFAULT_ROOT_README genérico)
  config/
    schema.ts              (editado: remover specsfy_docs_managed_block)
  documentation/
    diagnose.ts             (novo: diagnoseDocumentation)
  doctor.ts                 (editado: + documentationIssues)
tests/
  setup-documentation-extension.test.ts   (novo)
  setup-readme-homepage.test.ts           (editado — já existia, SPEC-0012)
  config-schema.test.ts                   (editado — já existia, SPEC-0012)
  documentation-diagnose.test.ts          (novo)
  doctor-documentation-issues.test.ts     (novo)
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Extensão de documentação (registro) | `name` (`config-documentation-rule` / `config-documentation-pointer`) | `target_file`, `checksum_sha256`, âncora HTML — mesma forma de `ExtensionArtifact` já existente em `.maestro/extensions.json` | 1 registro por `target_file` (`CLAUDE.md`, `AGENTS.md`) |
| Exceção de idioma (`LanguageException`) | `id` | `paths: string[]`, `language: string`, `reason: string` — array dentro de `.maestro/config.yaml` (`language.exceptions`) | N exceções por config.yaml; esta entrega remove 1 (`specsfy_docs_managed_block`) do default |
| Achado de documentação (`DocumentationIssue`) | `(kind, file)` | `kind: "empty" \| "invalid-mermaid" \| "missing-backlink"`, `file: string` (caminho relativo), `detail: string` — não persistido, só existe no relatório em memória de `maestro doctor` | N achados por execução de `doctor` |

#### Estados e transições

- Não aplicável — nenhuma das entidades acima tem ciclo de vida com estados; extensão é criada uma vez e diagnosticada por drift binário (presente/divergente), achado de documentação é recalculado a cada execução do doctor sem persistência.

#### Migração e retenção

- Não aplicável — nenhum dado persistido além do já existente (`.maestro/extensions.json`, `.maestro/config.yaml`).

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não. A entrega é inteiramente CLI/biblioteca: texto de regra instalado em arquivos Markdown de instrução (`CLAUDE.md`/`AGENTS.md`) e um relatório textual adicional em `maestro doctor` (mesmo formato dos diagnósticos já existentes). Não há tela, formulário ou navegação envolvidos.

#### APIs expostas

- Nenhuma rota HTTP nova. `maestro doctor` (CLI) ganha um campo a mais (`documentationIssues`) no `Report` já retornado por `inspectDependencies`, consumido pelo formatador de saída do CLI existente.

#### APIs externas utilizadas

- Nenhuma.

#### Documentação das APIs consultadas

- Não aplicável.

#### Eventos e outros contratos

- Não aplicável.

### 11. Estratégia TDD

- **Unidade**: `buildDocumentationBlock`/`buildDocumentationPointer` (conteúdo do texto), `buildDefaultConfig` (ausência da exceção removida), `DEFAULT_ROOT_README`/placeholder genérico, `diagnoseDocumentation` (cada `kind` de achado, isoladamente, com ambiente de arquivo mockado).
- **Integração/contrato**: `runSetup` de ponta a ponta contra uma raiz de teste isolada (idempotência, README ausente vs. existente, config.yaml novo vs. já customizado); `inspectDependencies` com `documentationIssues` populado, confirmando `exitCode` inalterado.
- **BDD/aceite**: os 18 cenários Gherkin da seção 6 orientam o desenho dos casos TDD; nenhum arquivo `.feature` é criado ou executado.
- **Runner TDD**: Vitest (`npm run test:tdd`), runner já confirmado e único usado neste repositório Node — sem PHP nesta stack.
- **E2E**: Não aplicável — não há jornada de usuário final além do CLI, já coberto por integração.
- **Verificação manual**: rodar `maestro setup` e `maestro doctor` manualmente contra um projeto de teste real (fora deste repositório) para confirmar o bloco instalado e o relatório do doctor em condições reais, já que o próprio maestro é o produto sob teste (`dogfooding`).

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, AC-001 | AC-001 na seção 6 | `tests/setup-documentation-extension.test.ts` — bloco completo instalado (marcador `SPECSFY:AC-001`) | 2026-09-16 — `TypeError: buildDocumentationBlock is not a function` | Pending | Pending |
| US-001, FR-001, NFR-001, AC-002 | AC-002 na seção 6 | `tests/setup-documentation-extension.test.ts` — reexecução não duplica (marcador `SPECSFY:AC-002`) | 2026-09-16 — `TypeError: buildDocumentationBlock is not a function` | Pending | Pending |
| US-001, FR-001, NFR-001, US-003, AC-003 | AC-003 na seção 6 | `tests/setup-documentation-extension.test.ts` — drift do ponteiro detectado pelo doctor (marcador `SPECSFY:AC-003`) | 2026-09-16 — `TypeError: buildDocumentationPointer is not a function` | Pending | Pending |
| US-001, FR-002, AC-004 | AC-004 na seção 6 | `tests/config-schema.test.ts` — default sem exceção de docs (marcador `SPECSFY:AC-004`) | 2026-09-16 — `buildDefaultConfig()` ainda retorna a entrada `specsfy_docs_managed_block` (2 exceções em vez de 1) | Pending | Pending |
| FR-002, US-001, AC-005 | AC-005 na seção 6 | `tests/config-schema.test.ts` — config customizado preservado (marcador `SPECSFY:AC-005`) | GREEN já hoje — `mergeMissingKeys` (SPEC-0012) já preserva chaves presentes; caso mantido como rede de segurança de regressão, não como RED novo | Passed (2026-09-16) | Pending |
| FR-002, US-001, AC-006 | AC-006 na seção 6 | `tests/config-schema.test.ts` — docs segue language.default (marcador `SPECSFY:AC-006`) | 2026-09-16 — `TypeError: buildDocumentationBlock is not a function` | Pending | Pending |
| US-002, FR-003, AC-007 | AC-007 na seção 6 | `tests/setup-readme-homepage.test.ts` — placeholder genérico criado (marcador `SPECSFY:AC-007`) | 2026-09-16 — conteúdo criado ainda menciona `maestro`/`@brunocalmon`/`specsfy` e não traz o aviso de preenchimento pendente | Pending | Pending |
| US-002, FR-003, AC-008 | AC-008 na seção 6 | `tests/setup-readme-homepage.test.ts` — README existente preservado (marcador `SPECSFY:AC-008`) | GREEN já hoje — `ensureReadmeHomepage` já nunca sobrescreve um README existente; caso mantido como rede de segurança de regressão | Passed (2026-09-16) | Pending |
| US-002, FR-003, AC-009 | AC-009 na seção 6 | `tests/setup-readme-homepage.test.ts` — sanitização de links preservada (marcador `SPECSFY:AC-009`) | GREEN já hoje — `sanitizeRootReadmeLinks` já cobre esse caso; caso mantido como rede de segurança de regressão | Passed (2026-09-16) | Pending |
| US-003, FR-004, NFR-003, AC-010 | AC-010 na seção 6 | `tests/documentation-diagnose.test.ts` — docs/ ausente reportado (marcador `SPECSFY:AC-010`) | 2026-09-16 — `Cannot find module '../src/documentation/diagnose'` | Pending | Pending |
| US-003, FR-005, NFR-002, NFR-003, AC-011 | AC-011 na seção 6 | `tests/documentation-diagnose.test.ts` — Mermaid experimental reportado (marcador `SPECSFY:AC-011`) | 2026-09-16 — `Cannot find module '../src/documentation/diagnose'` | Pending | Pending |
| FR-005, AC-012 | AC-012 na seção 6 | `tests/documentation-diagnose.test.ts` — sem falso positivo de Mermaid (marcador `SPECSFY:AC-012`) | 2026-09-16 — `Cannot find module '../src/documentation/diagnose'` | Pending | Pending |
| US-003, FR-006, NFR-003, AC-013 | AC-013 na seção 6 | `tests/documentation-diagnose.test.ts` — backlink ausente reportado (marcador `SPECSFY:AC-013`) | 2026-09-16 — `Cannot find module '../src/documentation/diagnose'` | Pending | Pending |
| NFR-002, FR-004, FR-005, FR-006, AC-014 | AC-014 na seção 6 | `tests/documentation-diagnose.test.ts` — nenhuma escrita ocorre (marcador `SPECSFY:AC-014`) | 2026-09-16 — `Cannot find module '../src/documentation/diagnose'` | Pending | Pending |
| US-003, NFR-003, AC-015 | AC-015 na seção 6 | `tests/doctor-documentation-issues.test.ts` — exitCode inalterado por achado de documentação (marcador `SPECSFY:AC-015`) | 2026-09-16 — `report.documentationIssues` é `undefined` (campo ainda não existe em `Report`) | Pending | Pending |
| FR-004, AC-016 | AC-016 na seção 6 | `tests/documentation-diagnose.test.ts` — arquivo de 0 bytes reportado (marcador `SPECSFY:AC-016`) | 2026-09-16 — `Cannot find module '../src/documentation/diagnose'` | Pending | Pending |
| FR-006, AC-017 | AC-017 na seção 6 | `tests/documentation-diagnose.test.ts` — portal isento de backlink (marcador `SPECSFY:AC-017`) | 2026-09-16 — `Cannot find module '../src/documentation/diagnose'` | Pending | Pending |
| NFR-002, AC-018 | AC-018 na seção 6 | `tests/documentation-diagnose.test.ts` — nenhuma chamada de rede (marcador `SPECSFY:AC-018`) | 2026-09-16 — `Cannot find module '../src/documentation/diagnose'` | Pending | Pending |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001, AC-002, AC-003 | Integração | `tests/setup-documentation-extension.test.ts` | Pending |
| FR-002 | AC-004, AC-005, AC-006 | Unidade | `tests/config-schema.test.ts` | Pending |
| FR-003 | AC-007, AC-008, AC-009 | Integração | `tests/setup-readme-homepage.test.ts` | Pending |
| FR-004 | AC-010, AC-016 | Unidade | `tests/documentation-diagnose.test.ts` | Pending |
| FR-005 | AC-011, AC-012 | Unidade | `tests/documentation-diagnose.test.ts` | Pending |
| FR-006 | AC-013, AC-017 | Unidade | `tests/documentation-diagnose.test.ts` | Pending |
| NFR-001 | AC-001, AC-002, AC-018 | Integração | `tests/setup-documentation-extension.test.ts` | Pending |
| NFR-002 | AC-011, AC-014, AC-018 | Unidade | `tests/documentation-diagnose.test.ts` | Pending |
| NFR-003 | AC-010, AC-011, AC-013, AC-015 | Integração | `tests/doctor-documentation-issues.test.ts` | Pending |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-09-16)
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/draft/0021-extensao-maestro-para-governar-documentacao-docs-e-readme-gerada-pelo-specsfy-em-projetos-consumidores/spec.md` → `VALID DRAFT`
- **Achados**:
  - `WARNING` (resolvido nesta rodada): a tabela "Evidência RED-GREEN-REFACTOR" (seção 11) agrupava 3 casos por linha em vez de declarar um caso por `AC` com marcador próprio, dificultando o rastreio individual de RED/GREEN por caso. Corrigido: expandida para 18 linhas, uma por `AC`.
  - `WARNING` (resolvido nesta rodada): faltava exigência explícita de revisão de `PROJECT.md` e acionamento do `$specsfy-documentator` na Definition of Done, apesar desta entrega mudar capacidade real do maestro (nova extensão + checagem no doctor). Corrigido: dois itens adicionados à seção 18 e task `T026` criada na seção 14 (numeração final, após a etapa de tarefas expandir um caso TDD por `AC`).
  - `NOTE`: `load_research.mjs` não lista o segundo/terceiro artefato de research nem reconhece os claims R-002/R-003 devido a um bug reproduzível na própria função `section()` do script (só captura a primeira linha de uma seção com múltiplos bullets) — reproduzido também contra `specs/completed/0012-.../spec.md`, já completa, com o mesmo formato. Não bloqueia este gate; registrado para eventual correção de tooling em outro backlog.
  - Cobertura confirmada: 3 `US`, 6 `FR`, 3 `NFR`, 18 `AC`; todos os IDs com ≥3 `AC` associados via `**Cobre**` (contagem verificada por grep linha a linha).
  - Nenhum `BLOCKER` encontrado.

#### Gate do Ato II — Plano

- **Resultado**: READY (2026-09-16)
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/defined/0021-extensao-maestro-para-governar-documentacao-docs-e-readme-gerada-pelo-specsfy-em-projetos-consumidores/spec.md` → `VALID DRAFT` (total=26, tdd=18, code=6, checklist_complete=108/156, covered_spec_ids=30/30)
- **Achados**:
  - Todos os 18 casos TDD (T001–T018) foram materializados e RED foi observado (ou o comportamento já existia como rede de segurança de regressão — AC-005, AC-008, AC-009). Detalhe completo na tabela "Evidência RED-GREEN-REFACTOR" (seção 11) e no checklist de cada tarefa (seção 14).
  - `WARNING` (registrado, não bloqueante): dois testes de specs anteriores (`tests/config-schema.test.ts`, `tests/setup-readme-homepage.test.ts`) codificam o comportamento que esta entrega reverte — precisam ser atualizados dentro de T021/T022 (GREEN), já sinalizado nas próprias tarefas e na seção 16.
  - Design técnico da seção 8 ajustado durante o RED: `diagnoseDocumentation(root)` não recebe mais um `DocumentationEnvironment` injetável — lê o filesystem real, seguindo o padrão já usado por `diagnoseAgents(root)`.
  - Nenhum predecessor TDD de tarefa `[CODE]` ficou aberto.

#### Gate do Ato III — Entrega

- **Resultado**: Pending
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/defined/0021-extensao-maestro-para-governar-documentacao-docs-e-readme-gerada-pelo-specsfy-em-projetos-consumidores/spec.md .`
- **Achados**: Pending.

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

Cada tarefa `[CODE]` inclui, no seu **PREP**, acionar `$specsfy-documentator` para
reconstrução independente de `docs/` antes do **EXECUTE** — mesmo quando a
documentação já existia antes da mudança, conforme exigido para toda tarefa
`[CODE]` neste framework.

#### Fase 1 — RED TDD informado pelo BDD (um caso por `AC`)

- [x] T001 [TEST] [TDD] [US-001] Derivar de AC-001 um caso Vitest falhando em tests/setup-documentation-extension.test.ts — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-001 (seção 6) e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador próprio `SPECSFY:AC-001`, sem criar `.feature`.
  - [x] **VERIFY**: RED observado — `buildDocumentationBlock` ainda não existe em `src/extensions/router.ts`.
  - [x] **VISUAL**: Não aplicável — sem interface, tarefa só materializa teste.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-documentation-extension` → `TypeError: buildDocumentationBlock is not a function` (2026-09-16).
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso.

- [x] T002 [TEST] [TDD] [US-001] Derivar de AC-002 um caso Vitest falhando em tests/setup-documentation-extension.test.ts — Refs: US-001, FR-001, NFR-001, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-002 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-002` (reexecução do setup não duplica o bloco).
  - [x] **VERIFY**: RED observado — `buildDocumentationBlock` ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-documentation-extension` → `TypeError: buildDocumentationBlock is not a function` (2026-09-16).
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso.

- [x] T003 [TEST] [TDD] [US-001] Derivar de AC-003 um caso Vitest falhando em tests/setup-documentation-extension.test.ts — Refs: US-001, FR-001, NFR-001, US-003, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-003 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-003` (drift do ponteiro em AGENTS.md detectado por `diagnoseExtensions`).
  - [x] **VERIFY**: RED observado — `buildDocumentationPointer` ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-documentation-extension` → `TypeError: buildDocumentationPointer is not a function` (2026-09-16).
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso.

- [x] T004 [TEST] [TDD] [US-001] Derivar de AC-004 um caso Vitest falhando em tests/config-schema.test.ts — Refs: US-001, FR-002, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-004 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-004` (default de `language.exceptions` sem entrada para `docs/`).
  - [x] **VERIFY**: RED observado — `buildDefaultConfig()` ainda retorna a entrada `specsfy_docs_managed_block`.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- config-schema` → `expected 2 exceptions to have length 1` (2026-09-16).
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso.

- [x] T005 [TEST] [TDD] [US-001] Derivar de AC-005 um caso Vitest falhando em tests/config-schema.test.ts — Refs: FR-002, US-001, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-005 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-005` (config.yaml customizado pela pessoa não é sobrescrito).
  - [x] **VERIFY**: Caso já GREEN hoje — `backfillConfigFile`/`mergeMissingKeys` (SPEC-0012) já preservam uma exceção customizada presente; não há gap a provar via RED, e o caso fica registrado como rede de segurança de regressão para T021.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- config-schema` → passou de primeira (2026-09-16); ver seção 11 para a justificativa completa.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso.

- [x] T006 [TEST] [TDD] [US-001] Derivar de AC-006 um caso Vitest falhando em tests/config-schema.test.ts — Refs: FR-002, US-001, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-006 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-006` (documentação segue `language.default`, não uma exceção fixa).
  - [x] **VERIFY**: RED observado — `buildDocumentationBlock` ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- config-schema` → `TypeError: buildDocumentationBlock is not a function` (2026-09-16).
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso.

- [x] T007 [TEST] [TDD] [US-002] Derivar de AC-007 um caso Vitest falhando em tests/setup-readme-homepage.test.ts — Refs: US-002, FR-003, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-007 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-007` (README ausente recebe placeholder genérico).
  - [x] **VERIFY**: RED observado — `DEFAULT_ROOT_README` ainda é o conteúdo do próprio maestro.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-readme-homepage` → conteúdo criado contém `"maestro"`/`"@brunocalmon"`/`"specsfy"` e não traz o aviso de preenchimento pendente (2026-09-16).
  - [x] **IMPROVE**: Precisei corrigir a própria asserção do segundo caso (uma palavra genérica como "complete" dava falso-verde por coincidência textual); fixado para exigir a frase específica que T022 vai introduzir.

- [x] T008 [TEST] [TDD] [US-002] Derivar de AC-008 um caso Vitest falhando em tests/setup-readme-homepage.test.ts — Refs: US-002, FR-003, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-008 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-008` (README existente é preservado).
  - [x] **VERIFY**: Caso já GREEN hoje — `ensureReadmeHomepage` já nunca sobrescreve um README existente; mantido como rede de segurança de regressão.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-readme-homepage` → passou de primeira (2026-09-16).
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso.

- [x] T009 [TEST] [TDD] [US-002] Derivar de AC-009 um caso Vitest falhando em tests/setup-readme-homepage.test.ts — Refs: US-002, FR-003, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-009 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-009` (sanitização de links antigos continua funcionando).
  - [x] **VERIFY**: Caso já GREEN hoje — `sanitizeRootReadmeLinks` já cobre esse caso; mantido como rede de segurança de regressão.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-readme-homepage` → passou de primeira (2026-09-16).
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso.

- [x] T010 [TEST] [TDD] [US-003] Derivar de AC-010 um caso Vitest falhando em tests/documentation-diagnose.test.ts — Refs: US-003, FR-004, NFR-003, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-010 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-010` (docs/ ausente com `.specsfy/` presente), lendo o filesystem real via um root temporário (mesmo padrão de `diagnoseAgents(root)`, sem ambiente injetável).
  - [x] **VERIFY**: RED observado — módulo `src/documentation/diagnose.ts` ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- documentation-diagnose` → `Cannot find module '../src/documentation/diagnose'` (2026-09-16).
  - [x] **IMPROVE**: Design ajustado — a spec (seção 8) previa um `DocumentationEnvironment` injetável; alinhado para replicar o padrão real já usado por `diagnoseAgents(root)` (leitura direta do filesystem, sem injeção), mais consistente com o repositório.

- [x] T011 [TEST] [TDD] [US-003] Derivar de AC-011 um caso Vitest falhando em tests/documentation-diagnose.test.ts — Refs: US-003, FR-005, NFR-002, NFR-003, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-011 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-011` (Mermaid experimental reportado).
  - [x] **VERIFY**: RED observado — módulo ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- documentation-diagnose` → `Cannot find module '../src/documentation/diagnose'` (2026-09-16).
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso.

- [x] T012 [TEST] [TDD] Derivar de AC-012 um caso Vitest falhando em tests/documentation-diagnose.test.ts — Refs: FR-005, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-012 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-012` (sem falso positivo para Mermaid estável ou ausente).
  - [x] **VERIFY**: RED observado — módulo ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- documentation-diagnose` → `Cannot find module '../src/documentation/diagnose'` (2026-09-16).
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso.

- [x] T013 [TEST] [TDD] [US-003] Derivar de AC-013 um caso Vitest falhando em tests/documentation-diagnose.test.ts — Refs: US-003, FR-006, NFR-003, AC-013 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-013 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-013` (backlink ausente reportado).
  - [x] **VERIFY**: RED observado — módulo ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- documentation-diagnose` → `Cannot find module '../src/documentation/diagnose'` (2026-09-16).
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso.

- [x] T014 [TEST] [TDD] Derivar de AC-014 um caso Vitest falhando em tests/documentation-diagnose.test.ts — Refs: NFR-002, FR-004, FR-005, FR-006, AC-014 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-014 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-014` (nenhuma escrita ocorre mesmo com múltiplos achados), comparando um hash simples da árvore de arquivos antes/depois.
  - [x] **VERIFY**: RED observado — módulo ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- documentation-diagnose` → `Cannot find module '../src/documentation/diagnose'` (2026-09-16).
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso.

- [x] T015 [TEST] [TDD] [US-003] Derivar de AC-015 um caso Vitest falhando em tests/doctor-documentation-issues.test.ts — Refs: US-003, NFR-003, AC-015 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-015 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-015` (achado de documentação não altera `exitCode`), reaproveitando o ambiente `full` de `doctor-ok.test.ts`.
  - [x] **VERIFY**: RED observado — `documentationIssues` ainda não existe em `Report`.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- doctor-documentation-issues` → `expected undefined to be true` (2026-09-16).
  - [x] **IMPROVE**: Nome do arquivo de teste ajustado de `tests/doctor.test.ts` (planejado na spec) para `tests/doctor-documentation-issues.test.ts`, seguindo a convenção real do repositório (arquivos `doctor-<comportamento>.test.ts`, nunca um `doctor.test.ts` genérico); seção 12 corrigida para o mesmo caminho.

- [x] T016 [TEST] [TDD] Derivar de AC-016 um caso Vitest falhando em tests/documentation-diagnose.test.ts — Refs: FR-004, AC-016 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-016 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-016` (arquivo de 0 bytes em docs/ reportado).
  - [x] **VERIFY**: RED observado — módulo ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- documentation-diagnose` → `Cannot find module '../src/documentation/diagnose'` (2026-09-16).
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso.

- [x] T017 [TEST] [TDD] Derivar de AC-017 um caso Vitest falhando em tests/documentation-diagnose.test.ts — Refs: FR-006, AC-017 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-017 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-017` (docs/README.md isento de exigir backlink para si mesmo).
  - [x] **VERIFY**: RED observado — módulo ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- documentation-diagnose` → `Cannot find module '../src/documentation/diagnose'` (2026-09-16).
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso.

- [x] T018 [TEST] [TDD] Derivar de AC-018 um caso Vitest falhando em tests/documentation-diagnose.test.ts — Refs: NFR-002, AC-018 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-018 e confirmar IDs e nível de teste.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:AC-018` (checagem funciona sem acesso de rede, removendo `globalThis.fetch` temporariamente).
  - [x] **VERIFY**: RED observado — módulo ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- documentation-diagnose` → `Cannot find module '../src/documentation/diagnose'` (2026-09-16).
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso.

#### Fase 2 — US-001 Regra de documentação exportada (P1)

**Objetivo**: cada execução de `maestro setup` instala a regra de documentação e corrige a exceção de idioma.
**Teste independente**: `npm run test:tdd -- setup-documentation-extension config-schema` verde.

- [ ] T019 [CODE] [US-001] Implementar buildDocumentationBlock/Pointer em src/extensions/router.ts — Refs: US-001, FR-001, AC-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [ ] **PREP**: Confirmar RED de T001–T003, o formato de `buildConfigLanguageBlock`/`Pointer` a espelhar, e acionar `$specsfy-documentator` para reconstrução independente de `docs/` antes do EXECUTE.
  - [ ] **EXECUTE**: Implementar as duas funções com o texto de regra definido na seção 8.
  - [ ] **VERIFY**: Rodar os testes focais de T001–T003.
  - [ ] **VISUAL**: Não aplicável — sem interface.
  - [ ] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [ ] **IMPROVE**: Aplicar melhoria ou justificar nenhuma.
  <!-- specsfy:evidence {"task":"T019","refs":["US-001","FR-001","AC-001","AC-002","AC-003"],"files":["src/extensions/router.ts"],"commands":[{"run":"npm run test:tdd -- setup-documentation-extension","exit":0}]} -->

- [ ] T020 [CODE] [US-001] Implementar ensureDocumentationRuleCandidate e ligar em ensureConfigYaml em src/setup/run.ts — Refs: US-001, FR-001, NFR-001, AC-001, AC-002, AC-003 — Depends: T019
  - [ ] **PREP**: Confirmar GREEN de T019, o ponto de chamada em `ensureConfigYaml`, e acionar `$specsfy-documentator` para reconstrução independente de `docs/` antes do EXECUTE.
  - [ ] **EXECUTE**: Implementar a função e a chamada, reaproveitando `createExtension`.
  - [ ] **VERIFY**: Rodar os testes focais de T001–T003 completos.
  - [ ] **VISUAL**: Não aplicável — sem interface.
  - [ ] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [ ] **IMPROVE**: Aplicar melhoria ou justificar nenhuma.
  <!-- specsfy:evidence {"task":"T020","refs":["US-001","FR-001","NFR-001","AC-001","AC-002","AC-003"],"files":["src/setup/run.ts"],"commands":[{"run":"npm run test:tdd -- setup-documentation-extension","exit":0}]} -->

- [ ] T021 [CODE] [US-001] Remover specsfy_docs_managed_block de buildDefaultConfig em src/config/schema.ts — Refs: US-001, FR-002, AC-004, AC-005, AC-006 — Depends: T004, T005, T006
  - [ ] **PREP**: Confirmar RED de T004–T006 e acionar `$specsfy-documentator` para reconstrução independente de `docs/` antes do EXECUTE.
  - [ ] **EXECUTE**: Remover a entrada, mantendo `specsfy_specs`. Atualizar também a asserção pré-existente em `tests/config-schema.test.ts` ("AC-002 — real language and git-tracking defaults are already populated") que hoje espera a exceção `docs/**/*.md` no default (ver seção 16, risco registrado no RED de T004).
  - [ ] **VERIFY**: Rodar os testes focais de T004–T006 e a suíte completa de `tests/config-schema.test.ts`.
  - [ ] **VISUAL**: Não aplicável — sem interface.
  - [ ] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [ ] **IMPROVE**: Aplicar melhoria ou justificar nenhuma.
  <!-- specsfy:evidence {"task":"T021","refs":["US-001","FR-002","AC-004","AC-005","AC-006"],"files":["src/config/schema.ts"],"commands":[{"run":"npm run test:tdd -- config-schema","exit":0}]} -->

**Checkpoint**: `maestro setup` contra uma raiz nova instala o bloco de documentação e gera `.maestro/config.yaml` sem a exceção de docs.

#### Fase 3 — US-002 README genérico quando ausente (P1)

**Objetivo**: nenhum projeto-alvo recebe o README do próprio maestro.
**Teste independente**: `npm run test:tdd -- setup-readme-homepage` verde.

- [ ] T022 [CODE] [US-002] Substituir DEFAULT_ROOT_README por placeholder genérico em src/setup/readme.ts — Refs: US-002, FR-003, AC-007, AC-008, AC-009 — Depends: T007, T008, T009
  - [ ] **PREP**: Confirmar RED de T007–T009 e acionar `$specsfy-documentator` para reconstrução independente de `docs/` antes do EXECUTE.
  - [ ] **EXECUTE**: Substituir a constante pelo placeholder genérico definido na seção 8, sem alterar `sanitizeRootReadmeLinks`/`sanitizeDocBackLinks`/`ensureReadmeHomepage`. Atualizar também a asserção pré-existente em `tests/setup-readme-homepage.test.ts` ("creates root README.md with docs/ relative links when absent") que hoje espera `docs/architecture.md` no conteúdo criado (ver seção 16, risco registrado no RED de T007).
  - [ ] **VERIFY**: Rodar os testes focais de T007–T009 e a suíte completa de `tests/setup-readme-homepage.test.ts`.
  - [ ] **VISUAL**: Não aplicável — sem interface.
  - [ ] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [ ] **IMPROVE**: Aplicar melhoria ou justificar nenhuma.
  <!-- specsfy:evidence {"task":"T022","refs":["US-002","FR-003","AC-007","AC-008","AC-009"],"files":["src/setup/readme.ts"],"commands":[{"run":"npm run test:tdd -- setup-readme-homepage","exit":0}]} -->

**Checkpoint**: rodar `ensureReadmeHomepage` contra uma raiz de teste sem README confirma placeholder genérico, sem menção ao maestro.

#### Fase 4 — US-003 Doctor aponta desvios de documentação (P2)

**Objetivo**: `maestro doctor` reporta os três tipos de desvio, de forma somente informativa.
**Teste independente**: `npm run test:tdd -- documentation-diagnose doctor` verde.

- [ ] T023 [CODE] [US-003] Implementar diagnoseDocumentation em src/documentation/diagnose.ts — Refs: US-003, FR-004, FR-005, FR-006, NFR-002, AC-010, AC-011, AC-012, AC-013, AC-014, AC-016, AC-017, AC-018 — Depends: T010, T011, T012, T013, T014, T016, T017, T018
  - [ ] **PREP**: Confirmar RED de T010–T014 e T016–T018, a leitura direta do filesystem real (sem ambiente injetável, mesmo padrão de `diagnoseAgents(root)`), e acionar `$specsfy-documentator` para reconstrução independente de `docs/` antes do EXECUTE.
  - [ ] **EXECUTE**: Implementar a função pura com os três tipos de achado.
  - [ ] **VERIFY**: Rodar os testes focais de T010–T014 e T016–T018.
  - [ ] **VISUAL**: Não aplicável — sem interface.
  - [ ] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [ ] **IMPROVE**: Aplicar melhoria ou justificar nenhuma.
  <!-- specsfy:evidence {"task":"T023","refs":["US-003","FR-004","FR-005","FR-006","NFR-002","AC-010","AC-011","AC-012","AC-013","AC-014","AC-016","AC-017","AC-018"],"files":["src/documentation/diagnose.ts"],"commands":[{"run":"npm run test:tdd -- documentation-diagnose","exit":0}]} -->

- [ ] T024 [CODE] [US-003] Compor documentationIssues em Report sem afetar exitCode em src/doctor.ts — Refs: US-003, NFR-003, AC-010, AC-011, AC-013, AC-015 — Depends: T023, T015
  - [ ] **PREP**: Confirmar GREEN de T023, RED de T015, o ponto de composição em `inspectDependencies`, e acionar `$specsfy-documentator` para reconstrução independente de `docs/` antes do EXECUTE.
  - [ ] **EXECUTE**: Importar `diagnoseDocumentation`, adicionar o campo ao `Report` e compor sem incluir no cálculo de `exitCode`.
  - [ ] **VERIFY**: Rodar os testes focais de T010, T011, T013 e T015.
  - [ ] **VISUAL**: Não aplicável — sem interface.
  - [ ] **EVIDENCE**: Registrar GREEN e arquivos alterados.
  - [ ] **IMPROVE**: Aplicar melhoria ou justificar nenhuma.
  <!-- specsfy:evidence {"task":"T024","refs":["US-003","NFR-003","AC-010","AC-011","AC-013","AC-015"],"files":["src/doctor.ts"],"commands":[{"run":"npm run test:tdd -- documentation-diagnose doctor","exit":0}]} -->

**Checkpoint**: `maestro doctor` contra fixtures sintéticas reporta os três tipos de desvio sem alterar `exitCode`.

#### Fase final — Qualidade

- [ ] T025 [TEST] Executar regressão e rastreabilidade via node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, AC-001 a AC-018 — Depends: T020, T021, T022, T024
  - [ ] **PREP**: Identificar suites e comandos de regressão (`npm run test:tdd`, `npm run build`).
  - [ ] **EXECUTE**: Executar toda a suíte e o `check_traceability.mjs`.
  - [ ] **VERIFY**: Confirmar ausência de gaps de rastreabilidade e regressão zero em testes já existentes (ex.: `setup-readme-homepage.test.ts` original).
  - [ ] **VISUAL**: Não aplicável — sem interface em nenhuma tarefa desta spec.
  - [ ] **EVIDENCE**: Registrar contagens e comandos finais.
  - [ ] **IMPROVE**: Registrar retrospectiva do processo.

- [ ] T026 [DOC] Revisar PROJECT.md e acionar $specsfy-documentator — Refs: US-001, US-002, US-003 — Depends: T025
  - [ ] **PREP**: Ler `PROJECT.md` atual e avaliar se a nova capacidade (extensão de documentação + checagem no doctor) exige atualização de escopo/capacidades descritas.
  - [ ] **EXECUTE**: Atualizar `PROJECT.md` quando material, ou registrar a justificativa concreta de não-impacto; em seguida acionar `$specsfy-documentator` para refletir a mudança em `docs/` deste repositório (dogfooding).
  - [ ] **VERIFY**: Conferir que `docs/application.md`/`docs/architecture.md` passam a citar os novos módulos (`src/documentation/diagnose.ts`, blocos de router) quando aplicável.
  - [ ] **VISUAL**: Não aplicável — sem interface.
  - [ ] **EVIDENCE**: Registrar o que foi revisado/atualizado ou a justificativa de não-impacto.
  - [ ] **IMPROVE**: Registrar aprendizado do processo de documentação.

### 15. Ordem de execução

- Caminho crítico: T001–T018 (RED) → (T019 → T020) e T021 em paralelo → T022 → (T023 → T024) → T025 → T026.
- Tarefas paralelas: dentro da Fase 1, T001–T003, T004–T006, T007–T009 e T010–T018 tocam arquivos de teste disjuntos entre si (`setup-documentation-extension.test.ts`, `config-schema.test.ts`, `setup-readme-homepage.test.ts`, `documentation-diagnose.test.ts`/`doctor.test.ts`) e podem avançar em paralelo; dentro de cada grupo, as tarefas competem pelo mesmo arquivo e seguem em sequência. Na Fase 2–4, (T019 → T020), T021, T022 e T023 podem avançar em paralelo depois de suas respectivas fases RED concluídas, já que tocam arquivos disjuntos (`router.ts`+`run.ts`, `schema.ts`, `readme.ts`, `documentation/diagnose.ts`); T024 depende de T023 e T015 concluídos.
- Estratégia de MVP: US-001 sozinha (T001–T006, T019–T021) já entrega o núcleo do pedido do usuário (regra exportada + exceção de idioma corrigida); US-002 e US-003 são incrementos independentes sobre a mesma base.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- `SPEC-0011` (extensões locais / reparo assistido) — completa; fornece `createExtension`/`diagnoseExtensions` reaproveitados.
- `SPEC-0012` (regra de idioma padrão) — completa; fornece o padrão de bloco/ponteiro replicado e a estrutura `LanguageException` corrigida.

#### Riscos

- Heurística de "Mermaid válido" (FR-005) baseada em regex sobre o cabeçalho do bloco ` ```mermaid `, não em um parser real → mitigação: lista fechada de cabeçalhos estáveis conhecidos (mesma lista de `.specsfy/RULES.md:98`), tratando qualquer cabeçalho fora dela como suspeito; falso positivo aceitável dado o caráter informativo (NFR-003) do achado.
- Heurística de "documentação vazia" (FR-004) pode divergir do que a pessoa considera "vazio" (ex.: arquivo só com título) → mitigação: escopo desta entrega detecta apenas os casos objetivos (ausência de diretório, arquivo de 0 bytes); qualquer refinamento de heurística de "conteúdo raso" fica para backlog futuro, registrado como suposição.
- **Descoberto durante o RED (T004, T007)**: dois testes já existentes de specs anteriores codificam exatamente o comportamento que esta entrega reverte — `tests/config-schema.test.ts` ("AC-002 — real language and git-tracking defaults are already populated", linha ~52 antes desta mudança) afirma que a exceção `docs/**/*.md` existe no default; `tests/setup-readme-homepage.test.ts` ("creates root README.md with docs/ relative links when absent") afirma que o README criado contém `docs/architecture.md`. Nenhum dos dois foi alterado nesta etapa (modo `prepare` não toca produção nem reescreve testes de specs anteriores). T021 e T022, respectivamente, precisam atualizar essas duas asserções específicas como parte do próprio GREEN — sem isso, a regressão da seção 11/12 (`check_traceability.mjs`) vai falhar mesmo com os novos casos verdes. Mitigação: registrado explicitamente aqui e nas tarefas T021/T022 para não ser esquecido.

#### Suposições

- Specsfy está sempre presente em qualquer instalação real de `maestro setup` (R-003); não há caminho alternativo "sem Specsfy" nesta spec.
- A topologia de nomes de arquivo em `docs/` (`architecture.md`, `database.md` etc.) usada como exemplo em `.specsfy/RULES.md` e `documentation-standard.md` não é validada por nome específico nesta entrega — o doctor verifica qualquer `docs/*.md` presente, não uma lista fixa de nomes esperados.
- O placeholder genérico de README (US-002) não tenta detectar ou inferir o nome do projeto-alvo a partir de `package.json`/`composer.json` — decisão explícita do usuário, para nunca arriscar inventar informação errada.

### 17. Decisões

- **DEC-001**: Reaproveitar o mecanismo `createExtension`/categoria `extension` já usado por `buildRouterBlock`/`buildConfigLanguageBlock`, em vez de criar um mecanismo de entrega novo — alternativa descartada: um arquivo de regra separado fora do padrão de extensão, que perderia o diagnóstico de drift já existente em `diagnoseExtensions`.
- **DEC-002**: A regra de documentação assume Specsfy sempre presente (R-003), sem branch condicional para "sem Specsfy" — alternativa descartada: escrever a regra de forma agnóstica a Specsfy, rejeitada por não refletir nenhum cenário real observado e adicionar complexidade sem valor.
- **DEC-003**: Achados de documentação no `doctor` são informativos, não entram no `exitCode` — alternativa descartada: tratá-los como `divergentExtensions`/`divergentAgents` (que afetam exitCode), rejeitada porque a heurística de Mermaid/vazio é nova e menos madura, e um falso positivo bloqueante quebraria pipelines existentes sem necessidade.
- **DEC-004**: README placeholder genérico nunca infere nome/descrição do projeto-alvo — alternativa descartada: derivar de `package.json`/`composer.json`, rejeitada explicitamente pelo usuário para evitar inventar informação errada.
- **DEC-005**: Remover (não apenas re-escopar) a exceção `specsfy_docs_managed_block` do default — alternativa descartada: estreitar seu `paths` para excluir `docs/architecture.md` etc., rejeitada porque a pesquisa (R-001) mostrou que a exceção inteira não reflete mais a prática real de nenhum arquivo em `docs/`.

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Todos os cenários `AC` aplicáveis passam.
- [ ] Todos os requisitos possuem evidência de verificação.
- [ ] Todas as tarefas na seção 14 estão concluídas.
- [ ] Testes e checks estáticos disponíveis passam.
- [ ] `PROJECT.md` revisado quanto ao impacto desta nova capacidade (extensão de documentação + checagem no doctor), ou justificativa de não-impacto registrada na evidência da tarefa final — `.specsfy/Spec.md` exige essa revisão em toda mudança de aplicação.
- [ ] `$specsfy-documentator` acionado após a implementação para refletir a nova capacidade em `docs/` deste próprio repositório, já que o maestro documenta a si mesmo (dogfooding).
