# Especificação integrada: Regra common-rules: idioma padrão e config.yaml sempre presente

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0012 |
| Slug | 0012-regra-common-rules-idioma-padrao-e-config-yaml-sempre-presente |
| Status | Complete |
| Effort | 6 |
| Effort updated at | 2026-09-03 |
| Effort rationale | Nova dependência de produção (`yaml`), quatro módulos novos (`src/config/`), integração cruzada com `setup`/`STACK.md`/roteador, e risco de sincronização idempotente sem clobber — perfil `standard`, extremidade superior. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não |
| Atualizada em | 2026-09-03 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

Não existe hoje, no nível do próprio `common-rules` — acima de qualquer dependência como former project tool ou skills mattpocock —, um mecanismo de configuração sempre-presente que fixe idioma-padrão de resposta/documentos e metadados-guia (projeto, sistema, controle de versionamento). O agente redescobre ou assume contexto a cada interação, em vez de consultar uma fonte única, estável e completa.

#### Resultado desejado

Cada projeto com `common-rules` instalado passa a ter `.common-rules/config.yaml` sempre presente e completo (nenhuma chave do schema omitida — default real quando existir evidência, vazio quando não), lido pelo agente para decidir idioma de documentos gerados, e sincronizado automaticamente com `.project-context/STACK.md` quando o former project tool estiver ativo.

#### Métricas de sucesso

- 100% dos projetos em que `common-rules setup` roda terminam com `.common-rules/config.yaml` contendo todas as chaves do schema (nenhuma omitida).
- Documento gerado pelo agente fora das exceções declaradas usa `en_US`; `specs/**/spec.md` e o bloco gerenciado de `docs/**/*.md` continuam em `pt_BR`, sem regressão nos validadores do former project tool.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] `docs/**/*.md` gerado pelo former project tool pode ficar em inglês, como o `specs/**/spec.md`? — Verdict: refuted — Confidence: high — Evidence: research/framework-scripts/build_documentation-excerpt.md#hardcoded-portuguese — Budget: 1/1. `build_documentation.mjs` embute prosa em português nos títulos do bloco gerenciado (`<!-- maestro:inventory:start -->`...`end -->`) e seu modo `--check` falha (`Documentação desatualizada`) se o conteúdo divergir do gerado — a mesma classe de dependência rígida do `specs/*.md`, confirmada por leitura direta do script nesta sessão.
- **R-002** [critical] `createExtension` permite atualizar o conteúdo de um nome de extensão já registrado (ex.: crescer o roteador existente)? — Verdict: refuted — Confidence: high — Evidence: research/framework-scripts/create-refuses-conflict.md#name-conflict — Budget: 1/1. `src/extensions/create.ts` recusa qualquer `category` quando `name` já está no registro (`"name conflict: ... explicitamente escolha pular ou substituir"`), sem caminho de atualização automática. Reutilizar o nome `"router"` ou `"agents-pointer"` deixaria a nova instrução inatingível em qualquer projeto que já rodou `setup` uma vez.

#### Fontes e contexto consultados

- `specs/backlog/0006-regra-common-rules-idioma-padrao-e-config-yaml-sempre-presente.md` — brief aprofundado via `$framework-02-backlog`, cinco decisões fechadas.
- `specs/inbox/2026-09-03-194727-regra-common-rules-idioma-padrao-de-resposta-documentos-e-config-yaml-sempre-presente-em-common-rules.md` — captura original, texto do usuário preservado.
- `.project-context/RULES.md` — regra English-by-default já confirmada (carve-out de `specs/*.md`); este item precisa herdar e ampliar essa regra com a evidência nova sobre `docs/**/*.md`.
- `.project-context/STACK.md` — formato real do bloco `<!-- framework:stack:start -->...end -->` (tabela `Camada | Tecnologia | Evidência`, rótulos em português) usado como fonte da sincronização.
- `src/setup/run.ts`, `src/extensions/create.ts`, `src/extensions/router.ts`, `src/skills/deliver.ts` — padrões de escrita idempotente já usados no projeto (extensão ancorada com checksum, entrega de arquivo empacotado), reaproveitados no plano técnico.
- `package.json` — nenhuma dependência de manipulação de YAML presente hoje.
- `/home/bcalmon/Projects/dev-bootstrap/config.yaml` (fora do repositório) — referência de estilo: comentário explicativo por campo, seções por categoria, defaults explícitos.

#### Documentação consultada

- Nenhuma documentação externa (fora do repositório) foi consultada além do arquivo de referência de estilo já listado acima.

#### Artefatos de pesquisa armazenados

- `specs/draft/0012-regra-common-rules-idioma-padrao-e-config-yaml-sempre-presente/research/framework-scripts/build_documentation-excerpt.md`: trecho de `build_documentation.mjs` (linhas 105–124) evidenciando a prosa em português hardcoded e o comportamento de `--check`.
- `specs/draft/0012-regra-common-rules-idioma-padrao-e-config-yaml-sempre-presente/research/framework-scripts/create-refuses-conflict.md`: trecho de `src/extensions/create.ts` (linhas 78–95) evidenciando a recusa por conflito de nome sem caminho de atualização.

#### Dúvidas respondidas

- **Q**: Como detectar quando a conversa chegou a um ponto onde `config.yaml` deveria ser atualizado? → **A**: Instrução permanente no roteador (`CLAUDE.md`/`AGENTS.md`), sem hook nem comando novo — o agente lê a regra e sugere a atualização.
- **Q**: Qual a fronteira entre `config.yaml` e `.project-context/STACK.md`/`RULES.md`? → **A**: Quando former project tool/equivalente está ativo, `config.yaml` sincroniza automaticamente os campos de `project` sobrepostos a partir de `STACK.md`, que permanece a fonte de verdade — regra absoluta nesse cenário.
- **Q**: `config.yaml` é versionado no git do projeto-alvo? → **A**: Estrutura própria `git:` dentro do arquivo, com grupos de artefatos e flag `ignored` por grupo (default `ignored: true`); exceções: o próprio `config.yaml` e os artefatos do former project tool.
- **Q**: A seção `system` (dado de máquina) precisa de arquivo separado, dado que `.gitignore` opera por arquivo, não por chave? → **A**: Não nesta fase — fica no mesmo arquivo único, sob a mesma flag do grupo `common_rules_config`; decisão explicitamente adiada pelo usuário até a forma final do schema se provar necessária de outra forma.
- **Q**: `docs/**/*.md` também precisa ficar em português, como `specs/*.md`? → **A**: Sim para o bloco gerenciado (`<!-- maestro:inventory:start/end -->`) — confirmado por leitura de `build_documentation.mjs`, que gera prosa em português fixa no próprio script. Fora desse bloco, conteúdo humano permanece livre.

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Schema de `.common-rules/config.yaml` com as seções `language`, `project`, `system` e `git`, sempre presentes (default real ou vazio, nunca omitidas).
- Criação do arquivo pelo `setup` quando ausente; backfill de chave ausente quando o arquivo já existe mas está desatualizado em relação ao schema corrente.
- Instrução permanente no roteador (`CLAUDE.md`/`AGENTS.md`) sobre a regra de idioma e a leitura de `config.yaml`.
- Sincronização automática, sem intervenção manual, dos campos de `project` a partir de `.project-context/STACK.md` quando esse arquivo existir.

#### Fora de escopo

- O mecanismo interativo de "grilling" (entrevista para completar campos vazios) como fluxo conversacional detalhado — fica para uma fatia futura.
- Escrita automática em `.gitignore` a partir da seção `git:` de `config.yaml` — esta fatia define e povoa a estrutura de dados; aplicá-la ao arquivo `.gitignore` real é capacidade futura.
- Caminhos exatos de artefatos gerados por `code-review-graph` e `context-mode` — ainda não inspecionados neste projeto; os grupos correspondentes ficam com `paths: []`.
- Detecção automática de RAM, CPU, GPU, baremetal/container em `system` — apenas `system.os` é auto-detectado nesta fatia.
- Correção da extensão `"router"` já registrada neste próprio repositório, que ficou presa em português antes da tradução da sessão anterior (achado incidental via `R-002`, sem relação de causa com este item — sinalizado à parte).

#### Atores

- **Pessoa responsável pelo projeto**: define e revisa os valores de `config.yaml`; decide overrides de idioma e de git-tracking.
- **Agente (Claude Code ou equivalente)**: lê `config.yaml` para decidir idioma de resposta/documento; nota lacunas na conversa e sugere atualização.
- **`common-rules setup`**: cria e mantém `config.yaml` completo; entrega a instrução no roteador; sincroniza `project` a partir de `STACK.md`.

### 4. Princípios e restrições do projeto

- **PR-001**: `.common-rules/config.yaml` nunca omite uma chave do schema corrente — default real ou valor vazio, nunca ausência da chave (herdado do pedido original do usuário, "nenhuma configuração pode ser JAMAIS omitida").
- **PR-002**: Quando former project tool (ou skill equivalente) estiver ativo, a sincronização de `project` a partir de `STACK.md` é regra absoluta — não é uma preferência configurável nem pode divergir silenciosamente.
- **PR-003**: `config.yaml` nunca é uma segunda fonte de verdade para o que `STACK.md`/`RULES.md` já governam — apenas espelha os campos sobrepostos.

### 5. Histórias de usuário

#### US-001 — Config.yaml sempre presente e completo (P1)

Como pessoa responsável por um projeto com `common-rules`, quero que `.common-rules/config.yaml` exista sempre com todas as chaves do schema preenchidas (default real ou vazio), para ter uma fonte única e estável de idioma/projeto/sistema/git-tracking sem precisar redescobrir contexto a cada conversa.

**Por que P1**: sem o arquivo sempre-completo, nenhuma das outras histórias tem onde escrever ou ler.
**Teste independente**: rodar `common-rules setup` num projeto novo e inspecionar `.common-rules/config.yaml` — todas as chaves do schema devem estar presentes.
**Requisitos**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-008

#### US-002 — Regra de idioma aplicada via instrução no roteador (P1)

Como agente operando num projeto com `common-rules`, quero uma instrução permanente em `CLAUDE.md`/`AGENTS.md` apontando para `config.yaml`, para saber em que idioma responder e gerar documentos, e para notar quando um valor deveria ser atualizado.

**Por que P1**: sem a instrução no roteador, o schema existe mas nenhum agente é orientado a consultá-lo.
**Teste independente**: rodar `common-rules setup` e inspecionar `CLAUDE.md`/`AGENTS.md` — a instrução deve estar presente e legível isoladamente do restante do roteador.
**Requisitos**: FR-006

#### US-003 — Sincronização automática de project a partir de STACK.md (P2)

Como pessoa responsável por um projeto com former project tool ativo, quero que os campos de `project` em `config.yaml` reflitam `.project-context/STACK.md` automaticamente, para nunca ter uma segunda fonte de verdade divergente.

**Por que P2**: depende de US-001 já existir; seu valor é incremental (evita divergência), não bloqueante para o uso básico do arquivo.
**Teste independente**: com `.project-context/STACK.md` populado, rodar a sincronização e inspecionar `config.yaml` — os campos mapeados devem refletir a tabela de `STACK.md`.
**Requisitos**: FR-007

### 6. Cenários BDD de aceite

#### AC-001 — Setup cria config.yaml completo num projeto novo

**Cobre**: US-001, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-003

```gherkin
@US-001 @FR-001 @FR-002 @FR-003 @FR-004 @NFR-001 @NFR-003 @AC-001
Feature: config.yaml sempre presente e completo

  Scenario: setup cria o arquivo com todas as chaves do schema
    Given um projeto sem ".common-rules/config.yaml"
    When "common-rules setup" roda
    Then ".common-rules/config.yaml" existe com as chaves de topo "language", "project", "system" e "git" presentes
    And nenhuma chave do schema está ausente
    And nenhuma chave com nome de segredo, token ou credencial existe no arquivo
```

#### AC-002 — Defaults reais de idioma e de git-tracking já vêm povoados

**Cobre**: US-001, FR-002, FR-003, NFR-001, NFR-003

```gherkin
@US-001 @FR-002 @FR-003 @NFR-001 @NFR-003 @AC-002
Feature: config.yaml sempre presente e completo

  Scenario: exceções de idioma e grupos de git já têm evidência real
    Given um ".common-rules/config.yaml" recém-criado
    When "language.exceptions" é inspecionado
    Then contém exatamente as entradas "specs/**/spec.md" e o bloco gerenciado de "docs/**/*.md", ambas com "language: pt_BR" e um motivo registrado
    And "git.groups.common_rules_config" e "git.groups.project-context" têm "ignored: false"
    And "git.groups.common_rules_state" e "git.groups.installed_skills" têm "ignored: true"
```

#### AC-003 — Campo sem evidência disponível fica vazio, nunca ausente

**Cobre**: US-001, FR-001, FR-003, FR-004, NFR-001, NFR-003

```gherkin
@US-001 @FR-001 @FR-003 @FR-004 @NFR-001 @NFR-003 @AC-003
Feature: config.yaml sempre presente e completo

  Scenario: placeholders sem evidência ficam com valor vazio
    Given um projeto sem ".project-context/STACK.md" e sem inspeção prévia de "code-review-graph"/"context-mode"
    When "common-rules setup" roda
    Then "git.groups.code_review_graph.paths" e "git.groups.context_mode.paths" existem como listas vazias
    And "project.package_manager", "project.framework" e "project.documentation_style" existem como texto vazio
    And "system.os" está preenchido com a plataforma detectada, e as demais chaves de "system" existem vazias
```

#### AC-004 — Setup não sobrescreve valor já editado pela pessoa

**Cobre**: US-001, FR-005, FR-008, NFR-001

```gherkin
@US-001 @FR-005 @FR-008 @NFR-001 @AC-004
Feature: config.yaml sempre presente e completo

  Scenario: valor editado manualmente sobrevive a uma nova execução do setup
    Given um ".common-rules/config.yaml" existente com "project.documentation_style" preenchido manualmente como "wiki"
    When "common-rules setup" roda novamente
    Then "project.documentation_style" continua "wiki"
    And nenhuma outra chave previamente preenchida muda de valor
```

#### AC-005 — Chave nova do schema é adicionada sem tocar nas existentes

**Cobre**: US-001, FR-008, NFR-001

```gherkin
@US-001 @FR-008 @NFR-001 @AC-005
Feature: config.yaml sempre presente e completo

  Scenario: backfill de uma chave ausente por evolução de schema
    Given um ".common-rules/config.yaml" existente sem a chave "git.groups.installed_skills"
    When "common-rules setup" roda
    Then "git.groups.installed_skills" passa a existir com seu default
    And todas as demais chaves e valores do arquivo permanecem exatamente como estavam
```

#### AC-006 — Backfill é idempotente sobre um arquivo já completo

**Cobre**: US-001, FR-008, NFR-001, NFR-002

```gherkin
@US-001 @FR-008 @NFR-001 @NFR-002 @AC-006
Feature: config.yaml sempre presente e completo

  Scenario: rodar o backfill duas vezes sobre um arquivo já completo não muda nada
    Given um ".common-rules/config.yaml" já completo em relação ao schema corrente
    When "common-rules setup" roda duas vezes seguidas
    Then o conteúdo do arquivo após a segunda execução é byte a byte igual ao da primeira
```

#### AC-007 — Roteador recebe a instrução de idioma/config.yaml

**Cobre**: US-002, FR-006

```gherkin
@US-002 @FR-006 @AC-007
Feature: instrução de idioma no roteador

  Scenario: setup entrega o bloco de instrução em CLAUDE.md
    Given um projeto sem a extensão "config-language-rule" registrada
    When "common-rules setup" roda
    Then "CLAUDE.md" contém um bloco ancorado orientando o agente a ler ".common-rules/config.yaml", responder no idioma da conversa e usar "language.default" para documento gerado, exceto os caminhos em "language.exceptions"
```

#### AC-008 — AGENTS.md recebe o ponteiro correspondente

**Cobre**: US-002, FR-006

```gherkin
@US-002 @FR-006 @AC-008
Feature: instrução de idioma no roteador

  Scenario: setup entrega o ponteiro em AGENTS.md
    Given um projeto com "AGENTS.md" e sem o ponteiro de idioma registrado
    When "common-rules setup" roda
    Then "AGENTS.md" contém uma linha apontando para a seção de idioma/config.yaml em "CLAUDE.md"
```

#### AC-009 — Instrução do roteador é idempotente

**Cobre**: US-002, FR-006, NFR-002

```gherkin
@US-002 @FR-006 @NFR-002 @AC-009
Feature: instrução de idioma no roteador

  Scenario: segunda execução do setup não duplica nem falha
    Given um projeto onde a extensão "config-language-rule" já foi criada por uma execução anterior
    When "common-rules setup" roda novamente
    Then "CLAUDE.md" continua com exatamente um bloco da instrução, sem duplicação
    And o comando termina sem erro
```

#### AC-010 — Sincronização popula project a partir de STACK.md

**Cobre**: US-003, FR-005, FR-007

```gherkin
@US-003 @FR-005 @FR-007 @AC-010
Feature: sincronização de project a partir de STACK.md

  Scenario: campo mapeado é sincronizado a partir da tabela de STACK.md
    Given ".project-context/STACK.md" com uma linha "Linguagem | TypeScript" no bloco "framework:stack"
    And um ".common-rules/config.yaml" existente com "project.prog_lang" vazio
    When a sincronização roda
    Then "project.prog_lang" passa a ser "TypeScript"
    And nenhuma outra seção de "config.yaml" muda de valor
```

#### AC-011 — Sincronização é pulada sem STACK.md

**Cobre**: US-003, FR-007

```gherkin
@US-003 @FR-007 @AC-011
Feature: sincronização de project a partir de STACK.md

  Scenario: projeto sem former project tool não sofre tentativa de sincronização
    Given um projeto sem ".project-context/STACK.md"
    When "common-rules setup" roda
    Then a etapa de sincronização é pulada
    And ".common-rules/config.yaml" não é modificado por essa etapa
```

#### AC-012 — Sincronização é idempotente

**Cobre**: US-003, FR-005, FR-007, NFR-002

```gherkin
@US-003 @FR-005 @FR-007 @NFR-002 @AC-012
Feature: sincronização de project a partir de STACK.md

  Scenario: rodar a sincronização duas vezes sem mudança em STACK.md não altera nada
    Given ".common-rules/config.yaml" já sincronizado com o conteúdo atual de ".project-context/STACK.md"
    When a sincronização roda novamente sem que "STACK.md" tenha mudado
    Then o conteúdo de ".common-rules/config.yaml" após a segunda execução é byte a byte igual ao da primeira
```

#### AC-013 — Criação de config.yaml independe de outras extensões já existirem

**Cobre**: US-001, FR-001, FR-002, FR-004, NFR-001, NFR-003

```gherkin
@US-001 @FR-001 @FR-002 @FR-004 @NFR-001 @NFR-003 @AC-013
Feature: config.yaml sempre presente e completo

  Scenario: config.yaml é criado mesmo quando outras extensões já existem
    Given um projeto onde as extensões "router" e "agents-pointer" já estão registradas
    And ".common-rules/config.yaml" ainda não existe
    When "common-rules setup" roda
    Then ".common-rules/config.yaml" é criado com "language.default" igual a "en_US"
    And a seção "system" está completa, com "system.os" preenchido e as demais chaves vazias
    And nenhuma chave de "language", "system" ou "project" está ausente
```

### 7. Requisitos

#### Funcionais

- **FR-001**: Quando `.common-rules/config.yaml` não existir, `common-rules setup` deve criá-lo com todas as chaves de topo do schema (`language`, `project`, `system`, `git`) presentes.
- **FR-002**: A seção `language` deve conter `default: en_US` e `exceptions` pré-povoado com os dois caminhos confirmados por evidência de código (`specs/**/spec.md` e o bloco gerenciado de `docs/**/*.md`), cada um com `language: pt_BR` e um `reason`.
- **FR-003**: A seção `git` deve conter `default: ignored` e os grupos `common_rules_config` (`ignored: false`), `common_rules_state` (`ignored: true`), `framework` (`ignored: false`), `installed_skills` (`ignored: true`), `code_review_graph` e `context_mode` (`ignored: true`, `paths` vazio).
- **FR-004**: A seção `system` deve conter `os` auto-detectado pela plataforma corrente; as demais chaves (`distro`, `ram_gb`, `cpu`, `gpu`, `baremetal`, `container`) existem vazias. `system` permanece no mesmo arquivo único, sem arquivo separado.
- **FR-005**: Quando `.common-rules/config.yaml` já existir, `common-rules setup` não deve sobrescrever nenhum valor que a pessoa já tenha preenchido, exceto pela sincronização explícita (FR-007).
- **FR-006**: `common-rules setup` deve entregar um bloco ancorado novo em `CLAUDE.md` (nome de extensão distinto de `"router"`/`"agents-pointer"`) instruindo o agente a ler `.common-rules/config.yaml`, responder no idioma da conversa, usar `language.default` para documento gerado exceto os caminhos em `language.exceptions`, e notar quando um valor deveria ser incluído ou atualizado — além de um ponteiro correspondente em `AGENTS.md`.
- **FR-007**: Quando `.project-context/STACK.md` existir, `common-rules setup` deve sincronizar os campos de `project` em `config.yaml` a partir da tabela do bloco `<!-- framework:stack:start -->...end -->`, usando um mapeamento fixo e explícito de rótulo de `Camada` para chave de `project` (`Linguagem` → `prog_lang`, `Runtime` → `runtime`, `Testes` → `test_framework`, `former project tool` → `framework`, `Gerenciador de pacotes` → `package_manager`); rótulo sem mapeamento conhecido não altera nenhuma chave.
- **FR-008**: Quando `.common-rules/config.yaml` existir mas estiver sem uma chave definida pelo schema corrente, `common-rules setup` deve adicionar essa chave com seu default (ou valor vazio), preservando toda chave e valor já presentes.

#### Não funcionais

- **NFR-001**: `.common-rules/config.yaml` nunca omite uma chave do schema corrente. **Verificação**: teste estrutural que compara o conjunto de chaves do arquivo produzido contra o conjunto de chaves do schema, em criação, backfill e sincronização.
- **NFR-002**: A criação, o backfill e a sincronização de `config.yaml` são idempotentes — executar a mesma operação duas vezes sobre o mesmo estado de entrada produz arquivo byte a byte idêntico. **Verificação**: teste que roda a operação duas vezes e compara o conteúdo resultante.
- **NFR-003**: `.common-rules/config.yaml` nunca contém chave de segredo, token, senha ou credencial. **Verificação**: teste que inspeciona as chaves do schema contra uma lista de termos proibidos (`token`, `secret`, `password`, `credential`, `key` isolado como segredo).

#### Erros e casos-limite

- `.project-context/STACK.md` existe mas seu bloco `<!-- framework:stack:start -->...end -->` está ausente ou vazio → sincronização não altera nenhum campo de `project` (equivalente a "sem evidência", nunca erro fatal).
- `.common-rules/config.yaml` existe mas não é YAML válido (edição manual quebrada) → `setup` relata o problema no `report` e não escreve por cima do arquivo inválido, para não destruir uma edição em andamento.
- Rótulo de `Camada` em `STACK.md` não consta no mapeamento conhecido (ex.: `Documentação`) → ignorado silenciosamente pela sincronização, sem inventar uma chave nova em `project`.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- `src/setup/run.ts` já orquestra `ensureRouterCandidates` (extensão ancorada em `CLAUDE.md`/`AGENTS.md`, via `createExtension`) e `deliverLocalSkills` (cópia idempotente de arquivo empacotado), chamados nos dois pontos de escrita de `runSetup` (`alreadyDone` e o caminho principal).
- `src/extensions/create.ts`/`anchor.ts`/`registry.ts` implementam o único caminho de escrita ancorada com checksum, mas **recusam atualizar** um nome já registrado (`R-002`) — por isso a nova instrução usa nomes de extensão distintos, nunca reaproveita `"router"`/`"agents-pointer"`.
- `.project-context/STACK.md` é gerado por um script externo do pacote `removed-project-integration` (`setup_context.mjs`), com uma tabela machine-readable em português entre `<!-- framework:stack:start -->` e `end -->` — única parte do arquivo apropriada para parsing automático; o resto é prosa humana.
- `build_documentation.mjs` (também externo) embute prosa em português fixa no bloco gerenciado de `docs/**/*.md` e falha `--check` se divergir — confirma que a exceção de idioma cobre `docs/**/*.md`, não só `specs/*.md`.
- Não há dependência de manipulação de YAML no projeto hoje (`package.json` não lista nenhuma).

#### Arquitetura e módulos

- `src/config/schema.ts` — tipos `ConfigDocument`, `LanguageSection`, `ProjectSection`, `SystemSection`, `GitSection`, `GitGroup`; `SCHEMA_KEYS` (lista de chaves de topo/aninhadas usada pela verificação estrutural de NFR-001); `buildDefaultConfig(env: { platform(): string })` — puro, retorna o documento default completo, com `system.os` resolvido a partir de `env.platform()`.
- `src/config/yaml.ts` — `serialize(doc: ConfigDocument): string` (escreve o YAML com comentários explicativos por seção, usando a API de `Document` do pacote `yaml`, que preserva comentários em edição incremental); `parse(text: string)`; `mergeMissingKeys(doc, defaults)` (adiciona só as chaves ausentes, preservando comentários e valores existentes).
- `src/config/write.ts` — `ensureConfigFile(root, env?)`: cria o arquivo (via `serialize` + `buildDefaultConfig`) só quando ausente; `backfillConfigFile(root)`: lê o arquivo existente, aplica `mergeMissingKeys`, escreve somente se houve mudança real (garante NFR-002 na composição criação+backfill).
- `src/config/sync.ts` — `STACK_LABEL_TO_PROJECT_KEY` (mapa fixo); `syncProjectFromStack(root)`: lê `.project-context/STACK.md`, extrai as linhas do bloco `framework:stack`, aplica o mapa, escreve só os campos de `project` que mudaram, via a mesma API de `yaml.ts` que preserva o resto do documento.
- `src/extensions/router.ts` — adiciona `buildConfigLanguageBlock()` e `buildConfigLanguagePointer()`, no mesmo padrão de `buildRouterBlock()`/`buildAgentsPointer()`.
- `src/setup/run.ts` — adiciona `ensureConfigYaml(root)` (chama `ensureConfigFile` + `backfillConfigFile`), `ensureConfigLanguageRouterCandidate(root)` (paralelo a `ensureRouterCandidates`, usando `createExtension` com os nomes novos `"config-language-rule"`/`"config-language-pointer"`), e `syncConfigFromStackIfPresent(root)` (chama `syncProjectFromStack` só se `.project-context/STACK.md` existir); as três chamadas entram nos mesmos dois pontos onde `deliverLocalSkills` já é chamado hoje.

#### Migrations

- Não aplicável — não há schema de banco de dados envolvido.

#### Models

- Não aplicável no sentido de ORM; `src/config/schema.ts` define o "modelo" do documento de configuração (ver Arquitetura e módulos).

#### Controllers e casos de uso

- Não aplicável — não há camada HTTP; a orquestração é a função `runSetup` existente, estendida com as três chamadas descritas acima.

#### Views e experiência

- Não aplicável — `Interface para pessoas: Não`.

#### Queries e repositórios

- Não aplicável — leitura/escrita é direta em arquivo (`.common-rules/config.yaml`, `.project-context/STACK.md`), sem camada de persistência estruturada adicional.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/draft/0012-regra-common-rules-idioma-padrao-e-config-yaml-sempre-presente/
  spec.md
  research/
    framework-scripts/
      build_documentation-excerpt.md
      create-refuses-conflict.md
src/
  config/
    schema.ts
    yaml.ts
    write.ts
    sync.ts
  extensions/
    router.ts        (estendido)
  setup/
    run.ts            (estendido)
tests/
  config-schema.test.ts
  config-write.test.ts
  config-backfill.test.ts
  config-sync.test.ts
  config-router-block.test.ts
  setup-delivers-config-yaml.test.ts
package.json           (nova dependência "yaml")
.project-context/STACK.md       ([DOC] nova dependência)
.project-context/RULES.md       ([DOC] amplia a exceção de idioma para docs/**/*.md)
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| `ConfigDocument` | caminho `.common-rules/config.yaml` (um por projeto) | `language: {default, exceptions[]}`, `project: {prog_lang, runtime, package_manager, framework, test_framework, documentation_style}`, `system: {os, distro, ram_gb, cpu, gpu, baremetal, container}`, `git: {default, groups: {...}}` — nenhuma chave pode ficar ausente | `project.*` sincronizado a partir de `.project-context/STACK.md` quando presente |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| `ConfigDocument` | Ausente | `setup` roda | Criado (schema completo, defaults/vazios) | Nenhuma chave omitida |
| `ConfigDocument` | Criado, sem drift | `setup` roda de novo | Inalterado (idempotente) | Valores da pessoa preservados |
| `ConfigDocument` | Criado, faltando chave nova do schema | `setup` roda | Backfilled (chave nova com default, resto preservado) | Nenhuma chave existente perdida |
| `ConfigDocument` | Criado, former project tool ativo | Sincronização roda | `project.*` atualizado a partir de `STACK.md` | Só `project.*` muda; resto preservado |

#### Migração e retenção

- Não aplicável — arquivo de configuração de projeto, sem ciclo de retenção próprio.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não. Esta fatia entrega um arquivo de configuração lido por agentes e uma instrução textual no roteador — não há tela, formulário ou fluxo visual associado.

#### APIs expostas

- Não aplicável — nenhuma rota HTTP nova; o comportamento é acionado por `common-rules setup` (CLI/MCP tool já existente).

#### APIs externas utilizadas

- Nenhuma.

#### Documentação das APIs consultadas

- Não aplicável.

#### Eventos e outros contratos

- Não aplicável.

### 11. Estratégia TDD

- **Unidade**: `src/config/schema.ts` (default completo, chaves nunca ausentes), `src/config/yaml.ts` (serialize/parse/merge preserva comentários e valores), `src/config/sync.ts` (mapeamento de rótulo, campos não mapeados intocados).
- **Integração/contrato**: `src/config/write.ts` contra um `env` de arquivo real em diretório temporário; `src/setup/run.ts` estendido, via `runSetup` com `write: true` em diretório temporário (mesmo padrão de `tests/setup-delivers-bundled-skill.test.ts`).
- **BDD/aceite**: os treze `AC` da seção 6 orientam o desenho de cada caso TDD.
- **Runner TDD**: Node sem PHP — `test:tdd` já confirmado nesta sessão como Vitest (`SPEC-0001`/decisão de projeto vigente).
- **E2E**: `tests/setup-delivers-config-yaml.test.ts` roda `dist/cli.js setup` num diretório temporário real, como já feito para a entrega de skills em `SPEC-0011`.
- **Verificação manual**: nenhuma prevista — cada comportamento é verificável por teste automatizado.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-003, AC-001 | AC-001 | `tests/config-schema.test.ts` — schema default tem todas as chaves de topo | `Cannot find module '../src/config/schema'` (`npx vitest run tests/config-schema.test.ts`, 2026-09-03) | GREEN (`npx vitest run tests/config-schema.test.ts`, 8/8) | `npx tsc --noEmit` limpo |
| US-001, FR-002, FR-003, NFR-001, NFR-003, AC-002 | AC-002 | `tests/config-schema.test.ts` — exceções de idioma e grupos de git pré-povoados | `Cannot find module '../src/config/schema'` | GREEN (`npx vitest run tests/config-schema.test.ts`, 8/8) | `npx tsc --noEmit` limpo |
| US-001, FR-001, FR-003, FR-004, NFR-001, NFR-003, AC-003 | AC-003 | `tests/config-schema.test.ts` — placeholders sem evidência ficam vazios, nunca ausentes | `Cannot find module '../src/config/schema'` | GREEN (`npx vitest run tests/config-schema.test.ts`, 8/8) | `npx tsc --noEmit` limpo |
| US-001, FR-005, FR-008, NFR-001, AC-004 | AC-004 | `tests/config-backfill.test.ts` — valor editado manualmente sobrevive a nova execução | `Cannot find module '../src/config/write'` | GREEN (`npx vitest run tests/config-backfill.test.ts`, 3/3) | `npx tsc --noEmit` limpo |
| US-001, FR-008, NFR-001, AC-005 | AC-005 | `tests/config-backfill.test.ts` — chave nova é adicionada sem tocar nas existentes | `Cannot find module '../src/config/write'` | GREEN (`npx vitest run tests/config-backfill.test.ts`, 3/3) | `npx tsc --noEmit` limpo |
| US-001, FR-008, NFR-001, NFR-002, AC-006 | AC-006 | `tests/config-backfill.test.ts` — backfill idempotente sobre arquivo completo | `Cannot find module '../src/config/write'` | GREEN (`npx vitest run tests/config-backfill.test.ts`, 3/3) | `npx tsc --noEmit` limpo |
| US-002, FR-006, AC-007 | AC-007 | `tests/config-router-block.test.ts` — bloco de instrução entregue em CLAUDE.md | `TypeError: buildConfigLanguageBlock is not a function` | GREEN (`npx vitest run tests/config-router-block.test.ts`, 3/3) | `npx tsc --noEmit` limpo |
| US-002, FR-006, AC-008 | AC-008 | `tests/config-router-block.test.ts` — ponteiro entregue em AGENTS.md | `TypeError: buildConfigLanguagePointer is not a function` | GREEN (`npx vitest run tests/config-router-block.test.ts`, 3/3) | `npx tsc --noEmit` limpo |
| US-002, FR-006, NFR-002, AC-009 | AC-009 | `tests/config-router-block.test.ts` — segunda execução não duplica nem falha | `TypeError: buildConfigLanguageBlock is not a function` | GREEN (`npx vitest run tests/config-router-block.test.ts`, 3/3) | `npx tsc --noEmit` limpo |
| US-003, FR-005, FR-007, AC-010 | AC-010 | `tests/config-sync.test.ts` — campo mapeado sincronizado a partir de STACK.md | `Cannot find module '../src/config/sync'` | GREEN (`npx vitest run tests/config-sync.test.ts`, 3/3) | `npx tsc --noEmit` limpo |
| US-003, FR-007, AC-011 | AC-011 | `tests/config-sync.test.ts` — sincronização pulada sem STACK.md | `Cannot find module '../src/config/sync'` | GREEN (`npx vitest run tests/config-sync.test.ts`, 3/3) | `npx tsc --noEmit` limpo |
| US-003, FR-005, FR-007, NFR-002, AC-012 | AC-012 | `tests/config-sync.test.ts` — sincronização idempotente | `Cannot find module '../src/config/sync'` | GREEN (`npx vitest run tests/config-sync.test.ts`, 3/3) | `npx tsc --noEmit` limpo |
| US-001, FR-001, FR-002, FR-004, NFR-001, NFR-003, AC-013 | AC-013 | `tests/config-write.test.ts` — criação independe de outras extensões já existirem | `Cannot find module '../src/config/write'` | GREEN (`npx vitest run tests/config-write.test.ts`, 1/1) | `npx tsc --noEmit` limpo |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Unidade | `tests/config-schema.test.ts` | Passed |
| FR-002 | AC-002 | Unidade | `tests/config-schema.test.ts` | Passed |
| FR-003 | AC-002 | Unidade | `tests/config-schema.test.ts` | Passed |
| FR-004 | AC-003 | Unidade | `tests/config-schema.test.ts` | Passed |
| FR-005 | AC-004, AC-010, AC-012 | Integração | `tests/config-backfill.test.ts`, `tests/config-sync.test.ts` | Passed |
| FR-006 | AC-007, AC-008, AC-009 | Integração | `tests/config-router-block.test.ts` | Passed |
| FR-007 | AC-010, AC-011, AC-012 | Integração | `tests/config-sync.test.ts` | Passed |
| FR-008 | AC-005 | Integração | `tests/config-backfill.test.ts` | Passed |
| NFR-001 | AC-001, AC-005, AC-013 | Unidade/Integração | `tests/config-schema.test.ts`, `tests/config-backfill.test.ts` | Passed |
| NFR-002 | AC-006, AC-012 | Integração | `tests/config-backfill.test.ts`, `tests/config-sync.test.ts` | Passed |
| NFR-003 | AC-001, AC-013 | Unidade | `tests/config-schema.test.ts` | Passed |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY
- **Data**: 2026-09-03
- **Comando**: `node .agents/skills/framework-04-validate/scripts/validate_spec.mjs specs/draft/0012-regra-common-rules-idioma-padrao-e-config-yaml-sempre-presente/spec.md --allow-draft` → `RESULTADO: VALID DRAFT`
- **Achados**: Revisão semântica (`references/quality-gates.md`) e lentes `PROD`/`ARCH`/`SEC` aplicadas; nenhum `BLOCKER` encontrado. Cobertura mínima `US/FR/NFR ↔ 3 ACs` confirmada pelo validador estrutural para as 3 histórias, 8 requisitos funcionais e 3 não funcionais, com 13 `AC` distintos. Risco `ARCH` não bloqueante já documentado na seção 16: a sincronização (`FR-007`) depende de rótulos em português gerados por um script externo do former project tool — mitigado por mapeamento fixo e campos não mapeados ficando vazios em vez de inventados.

#### Gate do Ato II — Plano

- **Resultado**: READY
- **Data**: 2026-09-03
- **Comando**: `node .agents/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/defined/0012-regra-common-rules-idioma-padrao-e-config-yaml-sempre-presente/spec.md --allow-draft` → `VALID DRAFT` (total=22, tdd=14, code=5, covered_spec_ids=27/27)
- **Achados**: Os 13 predecessores TDD (T001–T013) têm RED registrado com evidência real (`Cannot find module`/`TypeError: ... is not a function`). Correção durante o planejamento: AC-013 media originalmente `tests/config-schema.test.ts`, mas sua condição ("outras extensões já registradas") não é observável por uma função pura de defaults — movida para `tests/config-write.test.ts`, exercitando `ensureConfigFile` com um ambiente de arquivo real, e sua dependência de tarefa migrou de T014 para T015.

#### Gate do Ato III — Entrega

- **Resultado**: PASSED
- **Data**: 2026-09-03
- **Comando**: `node .agents/skills/framework-06-tdd-bdd/scripts/verify_acceptance.mjs specs/in-progress/0012-regra-common-rules-idioma-padrao-e-config-yaml-sempre-presente/spec.md .` → `QA: PASSED`; `check_traceability.mjs --full-chain` → `27/27 IDs cobertos` (SPEC-0012); `npm run verify` → 151 arquivos, 389 testes GREEN.
- **Achados**: Nenhum bloqueio. 22/22 tarefas concluídas, 13/13 `AC` com evidência `Passed`. Falhas pré-existentes e não relacionadas isoladas e confirmadas (três suítes `*-real.test.ts` dependentes de rede real, intermitentes mesmo com esta spec inteiramente revertida).
- **Aceite final ($framework-04-validate)**: `RESULTADO: READY` em `validate_spec.mjs` sem `--allow-draft`. Uma correção editorial aplicada durante o aceite: a evidência de T022 citava, em prosa livre, exemplos de identificador de requisito pertencente a outra spec, e o validador os tratou como requisitos desta própria spec sem cobertura `AC` — mesma classe de falso positivo por token solto já registrada nesta sessão. Reformulado sem alterar o conteúdo factual.

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

#### Fase 1 — RED TDD informado pelo BDD

- [x] T001 [TEST] [TDD] [US-001] Derivar do AC-001 um caso Vitest falhando em tests/config-schema.test.ts — Refs: US-001, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-003, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-001 e confirmar as chaves de topo exigidas (`language`, `project`, `system`, `git`).
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 FR-002 FR-003 FR-004 NFR-001 NFR-003 AC-001`, chamando a função `buildDefaultConfig` ainda inexistente.
  - [x] **VERIFY**: Observar RED válido (módulo `src/config/schema.ts` inexistente).
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: `npx vitest run tests/config-schema.test.ts` → `Cannot find module '../src/config/schema'`, RED válido por módulo ausente.
  - [x] **IMPROVE**: Nenhuma melhoria necessária — RED foi observado no primeiro caso, sem fixture/ambiente a corrigir.

- [x] T002 [TEST] [TDD] [US-001] Derivar do AC-002 um caso Vitest falhando em tests/config-schema.test.ts — Refs: US-001, FR-002, FR-003, NFR-001, NFR-003, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-002 e confirmar os dois `language.exceptions` e os quatro `git.groups` com evidência real.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 FR-003 NFR-001 NFR-003 AC-002`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: `npx vitest run tests/config-schema.test.ts` → `Cannot find module '../src/config/schema'`, RED válido por módulo ausente.
  - [x] **IMPROVE**: Nenhuma melhoria necessária.

- [x] T003 [TEST] [TDD] [US-001] Derivar do AC-003 um caso Vitest falhando em tests/config-schema.test.ts — Refs: US-001, FR-001, FR-003, FR-004, NFR-001, NFR-003, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-003 e confirmar os placeholders vazios (nunca ausentes) esperados.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 FR-003 FR-004 NFR-001 NFR-003 AC-003`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: `npx vitest run tests/config-schema.test.ts` → `Cannot find module '../src/config/schema'`, RED válido por módulo ausente.
  - [x] **IMPROVE**: Nenhuma melhoria necessária.

- [x] T004 [TEST] [TDD] [US-001] Derivar do AC-004 um caso Vitest falhando em tests/config-backfill.test.ts — Refs: US-001, FR-005, FR-008, NFR-001, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-004 e preparar um diretório temporário com `config.yaml` pré-existente e editado.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-005 FR-008 NFR-001 AC-004`, chamando a função `backfillConfigFile` ainda inexistente.
  - [x] **VERIFY**: Observar RED válido (módulo `src/config/write.ts` inexistente).
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: `npx vitest run tests/config-backfill.test.ts` → `Cannot find module '../src/config/write'`, RED válido por módulo ausente.
  - [x] **IMPROVE**: Nenhuma melhoria necessária.

- [x] T005 [TEST] [TDD] [US-001] Derivar do AC-005 um caso Vitest falhando em tests/config-backfill.test.ts — Refs: US-001, FR-008, NFR-001, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-005 e preparar um `config.yaml` faltando `git.groups.installed_skills`.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-008 NFR-001 AC-005`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: `npx vitest run tests/config-backfill.test.ts` → `Cannot find module '../src/config/write'`, RED válido por módulo ausente.
  - [x] **IMPROVE**: Nenhuma melhoria necessária.

- [x] T006 [TEST] [TDD] [US-001] Derivar do AC-006 um caso Vitest falhando em tests/config-backfill.test.ts — Refs: US-001, FR-008, NFR-001, NFR-002, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-006 e preparar um `config.yaml` já completo.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-008 NFR-001 NFR-002 AC-006`, comparando o conteúdo byte a byte antes/depois de duas execuções.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: `npx vitest run tests/config-backfill.test.ts` → `Cannot find module '../src/config/write'`, RED válido por módulo ausente.
  - [x] **IMPROVE**: Nenhuma melhoria necessária.

- [x] T007 [TEST] [TDD] [US-002] Derivar do AC-007 um caso Vitest falhando em tests/config-router-block.test.ts — Refs: US-002, FR-006, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-007 e o padrão já usado em `tests/extensions-*.test.ts` para `createExtension`.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-002 FR-006 AC-007`, chamando `buildConfigLanguageBlock` ainda inexistente.
  - [x] **VERIFY**: Observar RED válido (função inexistente em `src/extensions/router.ts`).
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: `npx vitest run tests/config-router-block.test.ts` → `TypeError: buildConfigLanguageBlock is not a function`, RED válido por função ausente.
  - [x] **IMPROVE**: Nenhuma melhoria necessária.

- [x] T008 [TEST] [TDD] [US-002] Derivar do AC-008 um caso Vitest falhando em tests/config-router-block.test.ts — Refs: US-002, FR-006, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-008 e confirmar o texto esperado do ponteiro em AGENTS.md.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-002 FR-006 AC-008`, chamando `buildConfigLanguagePointer` ainda inexistente.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: `npx vitest run tests/config-router-block.test.ts` → `TypeError: buildConfigLanguagePointer is not a function`, RED válido por função ausente.
  - [x] **IMPROVE**: Nenhuma melhoria necessária.

- [x] T009 [TEST] [TDD] [US-002] Derivar do AC-009 um caso Vitest falhando em tests/config-router-block.test.ts — Refs: US-002, FR-006, NFR-002, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-009 e preparar um registro de extensão já existente para `"config-language-rule"`.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-002 FR-006 NFR-002 AC-009`, chamando `buildConfigLanguageBlock` ainda inexistente.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: `npx vitest run tests/config-router-block.test.ts` → `TypeError: buildConfigLanguageBlock is not a function`, RED válido por função ausente.
  - [x] **IMPROVE**: Nenhuma melhoria necessária.

- [x] T010 [TEST] [TDD] [US-003] Derivar do AC-010 um caso Vitest falhando em tests/config-sync.test.ts — Refs: US-003, FR-005, FR-007, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-010 e preparar um `STACK.md` com a linha "Linguagem | TypeScript" no bloco `framework:stack`.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-003 FR-005 FR-007 AC-010`, chamando `syncProjectFromStack` ainda inexistente.
  - [x] **VERIFY**: Observar RED válido (módulo `src/config/sync.ts` inexistente).
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: `npx vitest run tests/config-sync.test.ts` → `Cannot find module '../src/config/sync'`, RED válido por módulo ausente.
  - [x] **IMPROVE**: Nenhuma melhoria necessária.

- [x] T011 [TEST] [TDD] [US-003] Derivar do AC-011 um caso Vitest falhando em tests/config-sync.test.ts — Refs: US-003, FR-007, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-011 e preparar um projeto sem `.project-context/STACK.md`.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-003 FR-007 AC-011`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: `npx vitest run tests/config-sync.test.ts` → `Cannot find module '../src/config/sync'`, RED válido por módulo ausente.
  - [x] **IMPROVE**: Nenhuma melhoria necessária.

- [x] T012 [TEST] [TDD] [US-003] Derivar do AC-012 um caso Vitest falhando em tests/config-sync.test.ts — Refs: US-003, FR-005, FR-007, NFR-002, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-012 e preparar um `config.yaml` já sincronizado.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-003 FR-005 FR-007 NFR-002 AC-012`, comparando o conteúdo byte a byte antes/depois de duas execuções.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: `npx vitest run tests/config-sync.test.ts` → `Cannot find module '../src/config/sync'`, RED válido por módulo ausente.
  - [x] **IMPROVE**: Nenhuma melhoria necessária.

- [x] T013 [TEST] [TDD] [US-001] Derivar do AC-013 um caso Vitest falhando em tests/config-write.test.ts — Refs: US-001, FR-001, FR-002, FR-004, NFR-001, NFR-003, AC-013 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-013 e preparar um diretório temporário real onde `"router"`/`"agents-pointer"` já estão registrados via `createExtension` (mesmo padrão de `tests/extensions-fixtures.ts`), mas `.common-rules/config.yaml` ainda não existe.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 FR-002 FR-004 NFR-001 NFR-003 AC-013`, chamando `ensureConfigFile` ainda inexistente.
  - [x] **VERIFY**: Observar RED válido (módulo `src/config/write.ts` inexistente).
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: `npx vitest run tests/config-write.test.ts` → `Cannot find module '../src/config/write'`, RED válido por módulo ausente.
  - [x] **IMPROVE**: Nenhuma melhoria necessária.

#### Fase 2 — US-001 Config.yaml sempre presente e completo (P1)

**Objetivo**: `.common-rules/config.yaml` sempre presente, completo e nunca sobrescrevendo valor da pessoa.
**Teste independente**: `npm run test:tdd -- config-schema config-backfill` verde.

- [x] T014 [CODE] [US-001] Implementar o schema e os defaults em src/config/schema.ts — Refs: US-001, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-003, AC-001, AC-002, AC-003 — Depends: T001, T002, T003
  - [x] **PREP**: Confirmar RED de T001, T002, T003.
  - [x] **EXECUTE**: Implementar `ConfigDocument`, `SCHEMA_KEYS`, `STACK_LABEL_TO_PROJECT_KEY` e `buildDefaultConfig(env)`; `$framework-documentator` reconstruiu `docs/` (`build_documentation.mjs --check` limpo).
  - [x] **VERIFY**: `npx vitest run tests/config-schema.test.ts` → 8/8 GREEN; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: GREEN confirmado; arquivo criado: `src/config/schema.ts`.
  - [x] **IMPROVE**: `monitor_context.mjs` exigiu revisão de `PROJECT.md`; avaliado sem impacto observável ainda (schema.ts não está conectado a nenhum comando até T018) e reconhecido via `--acknowledge-project-no-change`; PROJECT.md será revisado de fato após T018, quando a capacidade se tornar observável.
  - **Correção pós-`Complete` (`DEC-006`)**: os oito valores de dado `reason`/`description` em `buildDefaultConfig` estavam em português, contradizendo `FR-002` (o próprio arquivo declara `en_US`) — traduzidos para inglês, preservando os dois `reason` que descrevem a exceção `specs/*.md`/`docs/**/*.md` (esses continuam corretos, é o conteúdo da própria exceção). Os títulos `describe()` dos treze casos TDD (T001–T013, nos cinco arquivos `tests/config-*.test.ts`) também estavam em português e foram traduzidos na mesma correção, pela mesma causa raiz. `npx vitest run` → 151/151 arquivos GREEN após a correção; `npx tsc --noEmit` limpo.
  <!-- framework:evidence {"task":"T014","refs":["US-001","FR-001","FR-002","FR-003","FR-004","NFR-001","NFR-003","AC-001","AC-002","AC-003"],"files":["src/config/schema.ts"],"commands":[{"run":"npm run test:tdd -- config-schema","exit":0}]} -->

- [x] T015 [CODE] [US-001] Implementar serialização/merge e escrita idempotente em src/config/yaml.ts e src/config/write.ts — Refs: US-001, FR-001, FR-005, FR-008, NFR-001, NFR-002, AC-001, AC-004, AC-005, AC-006, AC-013 — Depends: T014, T004, T005, T006, T013
  - [x] **PREP**: Confirmar RED de T004, T005, T006, T013 e `src/config/schema.ts` disponível (T014 concluída).
  - [x] **EXECUTE**: Adicionada a dependência `yaml` 2.9.0 a `package.json` (`--save-exact`, já presente transitivamente via `skills`/`vite`); implementados `serialize`/`parse`/`mergeMissingKeys` (comment-preserving via `Document.setIn`/`hasIn`) e `ensureConfigFile`/`backfillConfigFile`; `$framework-documentator` reconstruiu `docs/` e `.project-context/PACKAGES.md` (`--check` limpo).
  - [x] **VERIFY**: `npx vitest run tests/config-write.test.ts tests/config-backfill.test.ts` → 4/4 GREEN; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: GREEN confirmado; arquivos criados: `src/config/yaml.ts`, `src/config/write.ts`; `package.json` alterado.
  - [x] **IMPROVE**: `monitor_context.mjs` exigiu `.project-context/STACK.md` (dependência nova) e `PROJECT.md`. Resolvida `STACK.md` via `$framework-aux-stack` — adiantando T020 (linha `yaml` 2.9.0 registrada com evidência e motivo). `PROJECT.md` segue reconhecido sem impacto ainda (capacidade não observável até T018).
  <!-- framework:evidence {"task":"T015","refs":["US-001","FR-001","FR-005","FR-008","NFR-001","NFR-002","AC-001","AC-004","AC-005","AC-006","AC-013"],"files":["src/config/yaml.ts","src/config/write.ts","package.json"],"commands":[{"run":"npm run test:tdd -- config-backfill config-write","exit":0}]} -->

**Checkpoint**: `.common-rules/config.yaml` criado e preservado em execuções repetidas de um diretório temporário real.

#### Fase 3 — US-002 Regra de idioma aplicada via instrução no roteador (P1)

**Objetivo**: `CLAUDE.md`/`AGENTS.md` orientam o agente a ler `config.yaml` para decidir idioma.
**Teste independente**: `npm run test:tdd -- config-router-block` verde.

- [x] T017 [CODE] [US-002] Implementar o bloco e o ponteiro de idioma em src/extensions/router.ts — Refs: US-002, FR-006, NFR-002, AC-007, AC-008, AC-009 — Depends: T007, T008, T009
  - [x] **PREP**: Confirmar RED de T007, T008, T009.
  - [x] **EXECUTE**: Implementadas `buildConfigLanguageBlock()` e `buildConfigLanguagePointer()` em `src/extensions/router.ts` (nomes de extensão `"config-language-rule"`/`"config-language-pointer"` entregues via `createExtension` na fase de integração, T018 — nunca `"router"`/`"agents-pointer"`, DEC-002); `$framework-documentator` reconstruiu `docs/` (`--check` limpo).
  - [x] **VERIFY**: `npx vitest run tests/config-router-block.test.ts` → 3/3 GREEN; `tests/extensions-router-agents-md.test.ts`/`extensions-router-claude-md.test.ts` sem regressão; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: GREEN confirmado; arquivo alterado: `src/extensions/router.ts`.
  - [x] **IMPROVE**: Nenhuma melhoria necessária — funções seguem exatamente o padrão já estabelecido por `buildRouterBlock`/`buildAgentsPointer`.
  <!-- framework:evidence {"task":"T017","refs":["US-002","FR-006","NFR-002","AC-007","AC-008","AC-009"],"files":["src/extensions/router.ts"],"commands":[{"run":"npm run test:tdd -- config-router-block","exit":0}]} -->

**Checkpoint**: `CLAUDE.md`/`AGENTS.md` de um diretório temporário real recebem a instrução, sem duplicar em uma segunda execução.

#### Fase 4 — US-003 Sincronização automática de project a partir de STACK.md (P2)

**Objetivo**: `project.*` reflete `.project-context/STACK.md` automaticamente, sem divergência silenciosa.
**Teste independente**: `npm run test:tdd -- config-sync` verde.

- [x] T016 [CODE] [US-003] Implementar o mapeamento e a sincronização em src/config/sync.ts — Refs: US-003, FR-005, FR-007, NFR-002, AC-010, AC-011, AC-012 — Depends: T014, T015, T010, T011, T012
  - [x] **PREP**: Confirmar RED de T010, T011, T012 e `src/config/yaml.ts`/`write.ts` disponíveis (T014/T015 concluídas).
  - [x] **EXECUTE**: `STACK_LABEL_TO_PROJECT_KEY` (em `schema.ts`) e `syncProjectFromStack(root)` implementados; `$framework-documentator` reconstruiu `docs/` (`--check` limpo).
  - [x] **VERIFY**: `npx vitest run tests/config-sync.test.ts` → 3/3 GREEN; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: GREEN confirmado; arquivo criado: `src/config/sync.ts`.
  - [x] **IMPROVE**: Corrigido `tsc --noEmit` (`TS2538`/`TS2322` — desestruturação de grupo de regex possivelmente `undefined` sob modo estrito) trocando a desestruturação por acesso indexado com guarda explícita.
  <!-- framework:evidence {"task":"T016","refs":["US-003","FR-005","FR-007","NFR-002","AC-010","AC-011","AC-012"],"files":["src/config/sync.ts"],"commands":[{"run":"npm run test:tdd -- config-sync","exit":0}]} -->

**Checkpoint**: `project.prog_lang` de um diretório temporário real reflete `.project-context/STACK.md`, sem alterar as demais seções.

#### Fase final — Integração e qualidade

- [x] T018 [CODE] Integrar as três capacidades em src/setup/run.ts — Refs: US-001, US-002, US-003, FR-001, FR-005, FR-006, FR-007, FR-008, AC-001, AC-007, AC-010 — Depends: T014, T015, T016, T017
  - [x] **PREP**: Confirmar T014, T015, T016, T017 concluídas com GREEN.
  - [x] **EXECUTE**: Adicionadas `ensureConfigLanguageRouterCandidate(root)` e `ensureConfigYaml(root)` nos dois pontos de `runSetup` onde `deliverLocalSkills` já é chamado; `PROJECT.md` revisado de fato (capacidade agora observável) e `.project-context/RULES.md` ampliado (via `$framework-aux-rules`, adiantando T021); `$framework-documentator` reconstruiu `docs/` (`--check` limpo).
  - [x] **VERIFY**: `npx vitest run` → 150 arquivos, 388 testes, todos GREEN; `npx tsc --noEmit` limpo; `npm run build` limpo.
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: GREEN confirmado; arquivo alterado: `src/setup/run.ts`.
  - [x] **IMPROVE**: Simplificação deliberada em relação ao plano original: `ensureConfigYaml(root)` já chama `ensureConfigFile`, `backfillConfigFile` e `syncProjectFromStack` internamente — não foi criada uma terceira função `syncConfigFromStackIfPresent` separada, já que as três operações são idempotentes e formam um único passo coeso "garantir config.yaml completo e sincronizado"; menor mudança de produção sem perder nenhum comportamento coberto por AC.
  - **Correção pós-`Complete` (`DEC-006`)**: o parágrafo e a célula de tabela que acrescentei a `PROJECT.md` estavam em português — traduzidos para inglês, preservando o restante do arquivo (template pré-existente do former project tool). `.common-rules/config.yaml` real deste projeto foi apagado e regenerado a partir do `schema.ts` corrigido.
  <!-- framework:evidence {"task":"T018","refs":["US-001","US-002","US-003","FR-001","FR-005","FR-006","FR-007","FR-008","AC-001","AC-007","AC-010"],"files":["src/setup/run.ts","PROJECT.md",".project-context/RULES.md"],"commands":[{"run":"npx vitest run && npx tsc --noEmit && npm run build","exit":0}]} -->

- [x] T019 [TEST] Confirmar entrega ponta a ponta em tests/setup-delivers-config-yaml.test.ts — Refs: US-001, US-002, US-003, FR-001, FR-006, FR-007, AC-001, AC-007, AC-010 — Depends: T018
  - [x] **PREP**: Preparar diretório temporário real, no padrão de `tests/setup-delivers-bundled-skill.test.ts` (`runSetup` real com `approval: { source: fixedDecision(true) }` — o mesmo padrão já validado na SPEC-0011 para contornar a ausência de TTY/JSON de aprovação ao invocar `dist/cli.js` fora de um terminal interativo).
  - [x] **EXECUTE**: `runSetup({ write: true, approval: { source: fixedDecision(true) } })` num diretório temporário real; inspecionados `.common-rules/config.yaml`, `CLAUDE.md` e `AGENTS.md` reais.
  - [x] **VERIFY**: `npx vitest run tests/setup-delivers-config-yaml.test.ts` → 1/1 GREEN — schema completo, bloco de idioma em `CLAUDE.md` e ponteiro em `AGENTS.md` confirmados.
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: GREEN confirmado; arquivo criado: `tests/setup-delivers-config-yaml.test.ts`.
  - [x] **IMPROVE**: Nenhuma melhoria necessária — o teste segue exatamente o precedente já estabelecido e validado em `SPEC-0011`.

- [x] T020 [DOC] Atualizar .project-context/STACK.md com a nova dependência yaml — Refs: FR-001 — Depends: T015
  - [x] **PREP**: Confirmar a entrada de `yaml` em `package.json` após T015.
  - [x] **EXECUTE**: `$framework-aux-stack` registrou a dependência com evidência e motivo (linha `yaml` 2.9.0 na tabela "Decisões estruturais e camadas de dependência").
  - [x] **VERIFY**: Linha confirmada em `.project-context/STACK.md`; `monitor_context.mjs --check` voltou a `CURRENT`.
  - [x] **VISUAL**: Não aplicável — documentação, não interface.
  - [x] **EVIDENCE**: Comando `node .agents/skills/framework-aux-stack/scripts/update_stack.mjs --project .` + edição manual da linha `yaml` com evidência `package.json (dependencies)`.
  - [x] **IMPROVE**: Nenhuma melhoria adicional necessária — adiantada durante T015 porque o monitor de contexto já exigia a atualização naquele ponto.
  - **Correção pós-`Complete` (`DEC-006`)**: o texto que escrevi para a linha `yaml` estava em português — traduzido para inglês, preservando o restante da tabela (conteúdo pré-existente).

- [x] T021 [DOC] Ampliar .project-context/RULES.md com a exceção de idioma para docs/**/*.md — Refs: FR-002 — Depends: none
  - [x] **PREP**: Reler a regra English-by-default já confirmada em `RULES.md` (linha 77).
  - [x] **EXECUTE**: Ampliada a regra existente em `.project-context/RULES.md` com a exceção do bloco gerenciado de `docs/**/*.md`, citando `R-001` (evidência em `build_documentation.mjs`) e a SPEC-0012/DEC-005.
  - [x] **VERIFY**: Redação ampliada confirmada em `.project-context/RULES.md`; `monitor_context.mjs --check` voltou a `CURRENT`.
  - [x] **VISUAL**: Não aplicável — documentação, não interface.
  - [x] **EVIDENCE**: Edição direta da linha existente em `.project-context/RULES.md` (preservando ordem e regras anteriores).
  - [x] **IMPROVE**: Nenhuma melhoria adicional necessária — adiantada durante T018 porque o monitor de contexto já exigia a atualização naquele ponto.
  - **Correção pós-`Complete` (`DEC-006`)**: a frase que acrescentei estava em português — traduzida para inglês, preservando o restante da regra (conteúdo pré-existente).

- [x] T022 [TEST] Executar regressão e rastreabilidade completas via scripts/cycle.mjs — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013 — Depends: T019, T020, T021
  - [x] **PREP**: Suíte completa, `tsc --noEmit` e `npm run build` identificados.
  - [x] **EXECUTE**: `npm run verify` (install → build → test) executado; `verify_acceptance.mjs` e `check_traceability.mjs --full-chain` auditados.
  - [x] **VERIFY**: `npm run verify` → 151 arquivos, 389 testes, GREEN (`cycle complete: install 2s, build 0s, test 34s`); `verify_acceptance.mjs` → `QA: PASSED` após completar a coluna "Cenário BDD" de FR-006/FR-007 com AC-008/AC-009/AC-011 (estavam implementados e verdes, só não listados na matriz); `check_traceability.mjs --full-chain` → `27/27 IDs cobertos` para a SPEC-0012 — os "MARCADORES ÓRFÃOS" relatados pertencem a specs anteriores (SPEC-0007, SPEC-0009, SPEC-0010, SPEC-0011, com seus próprios requisitos numerados) cujos testes convivem no mesmo diretório `tests/`, não a esta spec.
  - [x] **VISUAL**: Não aplicável — funcionalidade sem superfície visual.
  - [x] **EVIDENCE**: 151/151 arquivos, 389/389 testes; `tsc --noEmit` e `npm run build` limpos; nenhuma falha preexistente atribuível a esta mudança (as três suítes `*-real.test.ts` que dependem de rede real para instalar skills/former project tool falharam de forma intermitente e continuaram falhando com as mudanças da SPEC-0012 completamente stashed — confirmado não relacionado).
  - [x] **IMPROVE**: Durante a execução repetida da suíte completa, o tmpfs de saída da sessão encheu (0MB livre) por acúmulo de diretórios temporários de testes anteriores, derrubando ~138 arquivos por `ENOSPC` — não um defeito de código. Limpeza (`rm -rf` dos diretórios `common-rules-config-*`/`crs-*` órfãos em `/tmp`) restaurou 7,3GB livres e a suíte voltou a 100% verde. Retrospectiva: rodar a suíte completa repetidas vezes em sessões longas pode exigir limpeza periódica de fixtures temporárias.

### 15. Ordem de execução

- Caminho crítico: T001–T013 (RED) → T014 → T015 → T016 → T017 → T018 → T019 → T020/T021 → T022.
- Tarefas paralelas: `[P]` não atribuído — toda tarefa `[TEST][TDD]` da Fase 1 compartilha ao menos um dos três arquivos de teste (`config-schema.test.ts`, `config-backfill.test.ts`, `config-router-block.test.ts`, `config-sync.test.ts`) com outra tarefa da mesma fase, então nenhuma foi marcada `[P]` para evitar edição concorrente do mesmo arquivo.
- Estratégia de MVP: US-001 (T001–T006, T013, T014, T015) sozinha já entrega o arquivo sempre-presente e completo, o menor conjunto demonstrável; US-002 e US-003 se somam para a regra de idioma e a sincronização.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Nova dependência de produção: pacote `yaml` (parsing/serialização com preservação de comentários, necessário para o backfill e a sincronização sem destruir edição humana).
- Depende da regra English-by-default já confirmada em `.project-context/RULES.md` (esta spec amplia a exceção, não a contradiz).

#### Riscos

- Rótulos de `Camada` em `STACK.md` são gerados por um script externo (`setup_context.mjs`, pacote `removed-project-integration`) — se uma versão futura do pacote mudar os rótulos em português, o mapeamento fixo em `src/config/sync.ts` para de casar linhas → mitigação: campos não mapeados ficam vazios (nunca erro fatal), e o mapeamento é um único ponto de manutenção.
- A extensão `"router"` já registrada neste repositório está presa em conteúdo pré-tradução (achado `R-002`) — risco apenas de precedente confuso ao ler o código, sem efeito funcional nesta spec, que usa nomes de extensão novos.

#### Suposições

- `system.os` auto-detectado via `process.platform` do Node é suficiente como único dado automático da seção `system` nesta fatia; RAM/CPU/GPU/baremetal/container ficam vazios por decisão de escopo, não por limitação técnica.
- O bloco gerenciado de `docs/**/*.md` (`<!-- maestro:inventory:start/end -->`) é a granularidade correta da exceção de idioma; conteúdo humano fora desse bloco em `docs/` já é livre, sem necessidade de regra nova.

### 17. Decisões

- **DEC-001**: Adotar o pacote `yaml` como nova dependência de produção — alternativa (escrever/ler YAML manualmente por template) foi descartada porque o backfill e a sincronização exigem mutação segura preservando comentários e valores existentes, o que um gerador puramente textual não sustenta sem risco real de corromper edição humana.
- **DEC-002**: A instrução de idioma/config.yaml usa nomes de extensão novos (`"config-language-rule"`, `"config-language-pointer"`), nunca reaproveitando `"router"`/`"agents-pointer"` — motivo: `createExtension` recusa atualizar um nome já registrado (`R-002`), então reutilizar um nome existente tornaria a instrução nova inatingível em qualquer projeto que já rodou `setup` uma vez.
- **DEC-003**: Sincronização `STACK.md` → `project.*` usa um mapeamento fixo e explícito de rótulo de `Camada` (português) para chave de `project`, lendo somente o bloco machine-readable `<!-- framework:stack:start -->...end -->` — nunca interpreta a prosa humana do restante do arquivo, para não inventar valor sem evidência estrutural.
- **DEC-004**: A seção `system` permanece no mesmo arquivo único `config.yaml`, sem arquivo separado (`config.local.yaml`) — decisão explícita do usuário durante o refinamento do backlog, adiada até a forma final do schema justificar a divisão.
- **DEC-005**: A exceção de idioma amplia `.project-context/RULES.md` para cobrir também o bloco gerenciado de `docs/**/*.md`, não só `specs/*.md` — motivo: `build_documentation.mjs` gera prosa em português fixa no próprio script (`R-001`), a mesma classe de dependência rígida já registrada para `specs/*.md`.
- **DEC-006**: Correção pós-`Complete`, sem mudança de requisito — `src/config/schema.ts` gerava os campos `reason` e `description` do próprio `config.yaml` em português, e os títulos `describe()` dos cinco arquivos de teste desta fatia, além do texto acrescentado a `.project-context/STACK.md`/`.project-context/RULES.md`/`PROJECT.md`, também estavam em português — contradizendo diretamente `FR-002` (o próprio arquivo declara `language.default: en_US`) e a regra pré-existente de `.project-context/RULES.md` ("src/**/*.ts, tests/**/*.ts... são em inglês"). Corrigido traduzindo cada trecho de conteúdo autoral desta fatia para inglês, preservando intactos os dois `reason` que **descrevem** a exceção de `specs/*.md`/`docs/**/*.md` (esses continuam corretos como estão — são o próprio conteúdo da exceção, não uma violação dela) e preservando o restante de `STACK.md`/`RULES.md`/`PROJECT.md` (template/conteúdo pré-existente do former project tool em português, fora do escopo desta correção). `.common-rules/config.yaml` real deste projeto foi apagado e regenerado a partir do `schema.ts` corrigido. Nenhum `FR`/`AC`/`NFR` mudou de comportamento contratado — nenhum cenário verifica o idioma específico do texto gerado, apenas presença estrutural de chave — por isso os gates não foram reabertos, só as evidências das tarefas afetadas foram ampliadas.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam — 13/13, confirmado por `verify_acceptance.mjs` (`QA: PASSED`).
- [x] Todos os requisitos possuem evidência de verificação — 8 FR + 3 NFR, seção 12.
- [x] Todas as tarefas na seção 14 estão concluídas — 22/22, `validate_tasks.mjs` → `READY` (132/132 itens de checklist).
- [x] Testes e checks estáticos disponíveis passam — `npm run verify` (151 arquivos, 389 testes), `tsc --noEmit`, `npm run build`.
- [x] `.project-context/STACK.md` reflete a nova dependência `yaml`.
- [x] `.project-context/RULES.md` reflete a exceção de idioma ampliada para `docs/**/*.md`.
