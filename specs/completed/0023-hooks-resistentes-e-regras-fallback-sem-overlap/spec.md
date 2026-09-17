# Especificação integrada: Hooks resistentes a qualquer ferramenta e regras só como fallback sem overlap

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0023 |
| Slug | 0023-hooks-resistentes-e-regras-fallback-sem-overlap |
| Status | Complete |
| Effort | 6 |
| Effort updated at | 2026-09-17 |
| Effort rationale | Perfil `standard` alto: estende o pipeline de hooks da SPEC-0022 (preâmbulo, wrapper com `context`, três hooks novos, dois reescritos, estado por sessão) e um bloco de regras-fallback; sem framework, banco ou interface; a única parte não automatizável é a confirmação manual de subagentes. |
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

Os guards do maestro (`guard-destructive`, `guard-secrets`, `protect-authorship`) só interceptam o tool `Bash` e só leem `tool_input.command`; qualquer ferramenta que execute shell por outro caminho — `mcp__…context-mode__ctx_execute` com `language: shell`, `ctx_batch_execute`, `mcp__terminal__run_in_terminal` — passa sem guarda. O `code-review-graph-update` só dispara em `Edit|Write|MultiEdit|NotebookEdit`: uma edição por `sed -i`, heredoc ou `git rm` via `Bash` nunca atualiza o grafo (o deste repositório ficou parado de 2026-08-30 a 2026-09-17 apesar de dezenas de edições). Nenhum hook garante o uso do `code-review-graph` durante pesquisa e discovery, e a alternativa — regras em texto — infla o contexto a cada sessão e tende a repetir o que o hook já faz. Além disso, o `build_documentation.mjs` do Specsfy sobrescreve `docs/` com um esqueleto quando executado sem `--check` (FIND-EXT-001), e nada impede o agente de executá-lo.

#### Resultado desejado

Cada hook do maestro é resistente à ferramenta usada: os guards bloqueiam os mesmos casos em qualquer ferramenta que execute shell; o grafo é atualizado silenciosamente após qualquer edição real do working tree e ao fim da rodada; uma dica curta, uma única vez por sessão, lembra o grafo antes de `Grep`/`Glob` quando ele existe; um guard impede a execução destrutiva do `build_documentation.mjs`; as regras em texto se limitam a três linhas de fallback condicionadas ao `maestro doctor`, sem descrever o que o hook já executa. Custo de contexto no caminho feliz: zero.

#### Métricas de sucesso

- 100% dos casos que `guard-destructive`, `guard-secrets` e `protect-authorship` bloqueiam via `Bash` são bloqueados também via `ctx_execute` (`language: shell`), `ctx_batch_execute` e `run_in_terminal` — verificável por teste de subprocesso com os JSONs de cada ferramenta.
- Após uma edição via `Bash`, o grafo reflete a mudança antes da próxima ferramenta; após uma chamada sem mudança no working tree, o CLI não é executado — verificável por teste com binário de teste que registra invocações.
- Em uma sessão, a dica do grafo aparece exatamente uma vez — verificável por teste com dois eventos de mesmo `session_id`.
- O bloco de regras-fallback tem no máximo três itens, cada um citando um hook instalado e a condição "se o doctor reportar" — verificável por teste sobre o texto gerado.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] O comando de shell chega em campos diferentes conforme a ferramenta (command, code + language, commands[]) e um regex de nome de ferramenta cobre as de shell sem capturar o playwright — Verdict: verified — Confidence: high — Evidence: research/ferramentas-de-shell-observadas.md#ferramentas-observadas — Budget: 1/3
  - Tabela levantada do catálogo de ferramentas desta sessão e do `hooks.json` do context-mode.
- **R-002** [critical] Contexto adicional em PreToolUse exige JSON em stdout com hookSpecificOutput.additionalContext, e cada evento traz session_id, chave para "uma vez por sessão" — Verdict: verified — Confidence: high — Evidence: research/claude-code-hooks-contrato.md#observado — Budget: 1/3
  - Observado nesta sessão após a SPEC-0022 (bloqueio por `exit 2` e "hook additional context" do context-mode).
- **R-003** [high] Edições feitas via Bash não são detectáveis pelo nome da ferramenta; só pela mudança do working tree — Verdict: verified — Confidence: high — Evidence: research/ferramentas-de-shell-observadas.md#conclusao — Budget: 1/3
  - Grafo parado de 30/08 a 17/09 com dezenas de edições por `sed -i`/heredoc.

#### Fontes e contexto consultados

- `src/hooks/claude-code.ts` (preâmbulo `PREAMBLE`/`POSTAMBLE`, `MATCHER_MAP`, `tools:`), `src/hooks/source.ts`, `src/hooks/resolve.ts`, `src/setup/run.ts`, `src/setup/write.ts`, `src/extensions/router.ts`, `src/extensions/create.ts` (recusa de nome já registrado — DEC-002 da SPEC-0012).
- `resources/hooks/*.md` — os 5 hooks canônicos.
- `specs/completed/0022-hooks-do-maestro-validos-no-claude-code/spec.md` — base desta spec.
- `specs/backlog/0014-hooks-resistentes-a-qualquer-ferramenta-e-regras-so-como-fallback-sem-overlap.md` — brief promovido.
- `specs/inbox/2026-09-17-160600-hooks-resistentes-a-qualquer-ferramenta-e-uso-garantido-dos-clis-em-pesquisa-com-regras-so-como-fallback-sem-overlap.md` — captura de origem, preservada.
- `findings/external/FIND-EXT-001-specsfy-documentator-sobrescreve-docs.md`, `findings/internal/FIND-INT-001-guards-so-interceptam-bash.md`, `findings/internal/FIND-INT-002-code-review-graph-update-nao-cobre-edicoes-via-bash.md`.
- Decisões do usuário em 2026-09-17: hook resolve, regra só como fallback sem overlap; backlog próprio antes da 0013.

#### Documentação consultada

- `context-mode` 1.0.169 `hooks/hooks.json` e scripts `hooks/*.mjs` (local): formato de saída para o Claude Code e cobertura de ferramentas.

#### Artefatos de pesquisa armazenados

- `specs/completed/0023-hooks-resistentes-e-regras-fallback-sem-overlap/research/ferramentas-de-shell-observadas.md`: tabela ferramenta → campo do comando → executa shell → cobertura atual (R-001, R-003).
- `specs/completed/0023-hooks-resistentes-e-regras-fallback-sem-overlap/research/claude-code-hooks-contrato.md`: contrato de entrada/saída por evento observado (R-002).

#### Dúvidas respondidas

- **Q**: Regras em texto são necessárias? → **A**: só como fallback condicional ao doctor, no máximo três linhas, sem descrever o que o hook faz (decisão do usuário).
- **Q**: Dica do grafo por prompt ou por sessão? → **A**: por sessão, via `session_id`, para não inflar contexto (default reversível).
- **Q**: Como o `code-review-graph-update` detecta edição via `Bash`? → **A**: hash de `git status --porcelain` guardado em `.maestro/state/`; só executa o CLI quando o hash mudou.
- **Q**: Como impedir o `build_documentation.mjs` destrutivo? → **A**: guard que bloqueia a execução sem `--check`, com mensagem apontando `--check` e a variável `MAESTRO_ALLOW_DOCS_BUILD=1` para quem quer mesmo reescrever.
- **Q**: Onde vivem as regras-fallback? → **A**: bloco anchorado novo (`hooks-fallback`), nunca dentro do `router`, porque `createExtension` recusa atualizar nome já registrado (DEC-002 da SPEC-0012).

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Preâmbulo dos scripts extraindo `tool_name` e o comando de `command`, `code` (quando `language` é shell/bash/sh ou ausente) ou `commands[]`.
- `tools:` dos três guards ampliado para `Bash|mcp__.*(execute|run_in_terminal|shell).*`.
- `code-review-graph-update` reescrito como script em `after-tool` amplo com detecção de mudança do working tree; novo `code-review-graph-stop` em `stop`.
- Novo `graph-hint` em `before-tool` para `Grep|Glob`, uma vez por sessão, só com grafo presente.
- Novo `guard-docs` bloqueando `build_documentation.mjs` sem `--check`.
- Wrapper com suporte a `context` (contexto adicional via JSON em stdout).
- Resoluções de binário disponíveis ao fragmento como variáveis `MAESTRO_BIN_*`.
- Bloco anchorado `hooks-fallback` com até três regras condicionais ao doctor, em `AGENTS.md`/`CLAUDE.md` pelo mesmo mecanismo dos blocos existentes.
- `.maestro/state/` criado pelo setup e adicionado ao `.gitignore` do projeto quando ausente.
- Confirmação manual de que os hooks valem para subagentes.

#### Fora de escopo

- Negar `Grep`/`Read`/`Glob` para forçar o grafo.
- Alterar o context-mode ou o Specsfy upstream (FIND-EXT-001 segue como issue).
- O doctor em si (BACKLOG-0013) — esta spec define a cobertura; a 0013 a confere.
- Direção dos blocos `AGENTS.md`/`CLAUDE.md` (BACKLOG-0012); o bloco `hooks-fallback` segue a direção vigente no momento da entrega.
- Guard para o playwright (`browser_run_code_unsafe` executa JS no browser, não shell).

#### Atores

- **Agente no Claude Code** (principal ou subagente): usa `Bash`, ferramentas MCP de shell, `Edit`/`Write`, `Grep`/`Glob`.
- **Pessoa que mantém o projeto**: quer guards e grafo garantidos sem ler regras; abre a issue upstream do FIND-EXT-001.
- **`maestro setup`**: instala os hooks e o bloco `hooks-fallback`.
- **`maestro doctor`** (BACKLOG-0013): confere cobertura hook ↔ regra.

### 4. Princípios e restrições do projeto

- **PR-001**: Hook primeiro. Uma regra em texto só existe quando o hook não consegue garantir o resultado; ela descreve o fallback, nunca o comportamento que o hook executa.
- **PR-002**: Custo de contexto zero no caminho feliz: nenhum hook escreve em stdout, exceto a dica única por sessão e os bloqueios (stderr + `exit 2`).
- **PR-003**: Fragmentos continuam em `bash` com o preâmbulo/postâmbulo da SPEC-0022; nenhum hook novo depende de Node ou Python além dos CLIs já instalados.
- **PR-004**: Estado por sessão fica em `.maestro/state/`, nunca versionado e nunca fora do projeto.
- **PR-005**: O maestro instala somente no projeto atual.

### 5. Histórias de usuário

#### US-001 — Guards em qualquer ferramenta de shell (P1)

Como pessoa que mantém o projeto, quero que comando destrutivo, exposição de credencial e trailer de IA sejam bloqueados independentemente de o agente usar `Bash`, `ctx_execute`, `ctx_batch_execute` ou `run_in_terminal`, para que a proteção não dependa da ferramenta escolhida.

**Por que P1**: é o buraco de segurança ativo (FIND-INT-001).
**Teste independente**: executar os scripts dos guards com os JSONs de cada ferramenta e observar `exit 2` nos casos bloqueados e `exit 0` nos permitidos.
**Requisitos**: FR-001, FR-002, FR-006

#### US-002 — Grafo sempre atualizado sem gastar contexto (P1)

Como agente, quero que o `code-review-graph` reflita qualquer edição real do working tree, feita por qualquer ferramenta, sem que eu precise lembrar de rodá-lo e sem nada entrar no meu contexto, para que consultas ao grafo sejam confiáveis.

**Por que P1**: o grafo ficou 18 dias parado (FIND-INT-002).
**Teste independente**: hook executado após uma edição via `Bash` invoca o CLI de teste; executado de novo sem mudança, não invoca.
**Requisitos**: FR-003, FR-007

#### US-003 — Dica única do grafo em pesquisa (P2)

Como agente iniciando pesquisa com `Grep`/`Glob` num projeto com grafo, quero receber uma única dica curta apontando `code-review-graph search/impact`, para lembrar do grafo sem repetição a cada chamada.

**Por que P2**: melhora o uso do CLI sem custo recorrente; depende do grafo existir.
**Teste independente**: dois eventos `PreToolUse` com o mesmo `session_id` → uma saída JSON, depois nenhuma.
**Requisitos**: FR-004, FR-007

#### US-004 — Regras só como fallback, sem overlap (P2)

Como pessoa que mantém o projeto, quero que as regras em `AGENTS.md`/`CLAUDE.md` sobre hooks se limitem a fallbacks condicionados ao doctor, para que o contexto não seja inflado com o que o hook já garante.

**Por que P2**: princípio definido pelo usuário; verificável no texto gerado.
**Teste independente**: `buildHooksFallbackBlock()` produz no máximo três itens, cada um citando hook e a condição do doctor.
**Requisitos**: FR-005

#### US-005 — Proteção contra o build destrutivo do documentator (P1)

Como pessoa que mantém `docs/`, quero que a execução de `build_documentation.mjs` sem `--check` seja bloqueada com orientação, para que um bug do Specsfy não apague a documentação.

**Por que P1**: perda real e recorrente (FIND-EXT-001), reproduzida duas vezes em 2026-09-17.
**Teste independente**: guard com JSON de `Bash` contendo o script sem `--check` → `exit 2`; com `--check` → `exit 0`; com `MAESTRO_ALLOW_DOCS_BUILD=1` → `exit 0`.
**Requisitos**: FR-008

### 6. Cenários BDD de aceite

#### AC-001 — Comando destrutivo via `ctx_execute` shell é bloqueado

**Cobre**: US-001, FR-001, FR-002, FR-006, NFR-002

```gherkin
@US-001 @FR-001 @FR-002 @FR-006 @NFR-002 @AC-001
Feature: Guards em qualquer ferramenta de shell

  Scenario: rm -rf via ctx_execute
    Given o script .maestro/hooks/guard-destructive.sh instalado
    When ele recebe o JSON {"tool_name":"mcp__plugin_context-mode_context-mode__ctx_execute","tool_input":{"language":"shell","code":"rm -rf /"}}
    Then termina com exit 2 e a mesma mensagem usada para o Bash
```

#### AC-002 — Trailer de IA via `run_in_terminal` é bloqueado

**Cobre**: US-001, FR-001, FR-002, FR-006, NFR-002

```gherkin
@US-001 @FR-001 @FR-002 @FR-006 @NFR-002 @AC-002
Feature: Guards em qualquer ferramenta de shell

  Scenario: commit com trailer de agente via terminal MCP
    Given o script .maestro/hooks/protect-authorship.sh instalado
    When ele recebe um evento de mcp__terminal__run_in_terminal cujo command é um git commit com o trailer Co-Authored-By de um agente de IA
    Then termina com exit 2
```

#### AC-003 — Código não-shell em `ctx_execute` não é avaliado como comando

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-003
Feature: Extração por linguagem

  Scenario: JavaScript que menciona rm -rf
    Given o script .maestro/hooks/guard-destructive.sh instalado
    When ele recebe {"tool_name":"mcp__plugin_context-mode_context-mode__ctx_execute","tool_input":{"language":"javascript","code":"const s = 'rm -rf /'"}}
    Then termina com exit 0 sem mensagem
```

#### AC-004 — `ctx_batch_execute` avalia cada comando da lista

**Cobre**: US-001, FR-001, FR-002

```gherkin
@US-001 @FR-001 @FR-002 @AC-004
Feature: Lote de comandos

  Scenario: um comando sensível no meio do lote
    Given o script .maestro/hooks/guard-secrets.sh instalado
    When ele recebe {"tool_name":"mcp__plugin_context-mode_context-mode__ctx_batch_execute","tool_input":{"commands":["ls","cat .env","pwd"]}}
    Then termina com exit 2 com a mensagem de credencial
```

#### AC-005 — Os três guards declaram `tools:` cobrindo as ferramentas de shell

**Cobre**: US-001, FR-002

```gherkin
@US-001 @FR-002 @AC-005
Feature: Matcher dos guards

  Scenario: settings.json gerado
    Given maestro setup executado numa raiz temporária
    When settings.json é lido
    Then as entradas de guard-destructive, guard-secrets e protect-authorship em PreToolUse têm matcher "Bash|mcp__.*(execute|run_in_terminal|shell).*"
    And o regex casa "mcp__plugin_context-mode_context-mode__ctx_execute" e "mcp__terminal__run_in_terminal" e não casa "mcp__plugin_playwright_playwright__browser_run_code_unsafe"
```

#### AC-006 — Hooks valem para subagentes (verificação manual)

**Cobre**: US-001, FR-006

```gherkin
@US-001 @FR-006 @AC-006
Feature: Subagentes

  Scenario: subagente executa comando bloqueável
    Given uma sessão do Claude Code neste repositório com os hooks instalados
    When um subagente lançado por Agent executa via Bash um comando que o guard bloqueia no agente principal
    Then o bloqueio ocorre igual ao agente principal
    And o resultado é registrado na seção 11 como verificação manual com data e responsável
```

#### AC-007 — Edição via `Bash` atualiza o grafo

**Cobre**: US-002, FR-003, FR-007, NFR-001

```gherkin
@US-002 @FR-003 @FR-007 @NFR-001 @AC-007
Feature: Grafo atualizado após qualquer edição

  Scenario: sed -i seguido do hook PostToolUse
    Given um repositório git temporário com um binário de teste code-review-graph que registra invocações
    And o script code-review-graph-update.sh com MAESTRO_BIN_code_review_graph apontando para o binário de teste
    When um arquivo é alterado e o hook recebe {"tool_name":"Bash","tool_input":{"command":"sed -i s/a/b/ x.ts"}}
    Then o binário de teste é invocado com "update --brief"
    And nada é escrito em stdout
    And .maestro/state/crg-tree.hash contém o hash do git status --porcelain atual
```

#### AC-008 — Sem mudança no working tree, o CLI não executa

**Cobre**: US-002, FR-003, FR-007, NFR-001

```gherkin
@US-002 @FR-003 @FR-007 @NFR-001 @AC-008
Feature: Detecção de mudança

  Scenario: segunda chamada sem edição
    Given o hook já executado uma vez e o hash gravado
    When o hook recebe outro evento PostToolUse sem alteração no working tree
    Then o binário de teste não é invocado
```

#### AC-009 — `Stop` fecha a rodada

**Cobre**: US-002, FR-003, NFR-001

```gherkin
@US-002 @FR-003 @NFR-001 @AC-009
Feature: Rede final da rodada

  Scenario: edição sem PostToolUse correspondente
    Given um arquivo alterado por fora do ciclo de ferramentas
    When o script code-review-graph-stop.sh recebe um evento Stop
    Then o binário de teste é invocado uma vez e nada é escrito em stdout
```

#### AC-010 — `PostToolUse` amplo instalado com o matcher correto

**Cobre**: US-002, FR-003

```gherkin
@US-002 @FR-003 @AC-010
Feature: Matcher do code-review-graph-update

  Scenario: settings.json gerado
    Given maestro setup executado numa raiz temporária
    When settings.json é lido
    Then existe entrada PostToolUse com matcher "Edit|Write|MultiEdit|NotebookEdit|Bash|mcp__.*" referenciando .maestro/hooks/code-review-graph-update.sh
    And existe entrada Stop referenciando .maestro/hooks/code-review-graph-stop.sh
```

#### AC-011 — Dica do grafo aparece uma vez por sessão

**Cobre**: US-003, FR-004, FR-007, NFR-001

```gherkin
@US-003 @FR-004 @FR-007 @NFR-001 @AC-011
Feature: Dica única

  Scenario: dois Grep na mesma sessão
    Given um projeto com .code-review-graph/ e o script graph-hint.sh
    When o hook recebe {"session_id":"s1","tool_name":"Grep","tool_input":{"pattern":"x"}} duas vezes
    Then a primeira execução escreve em stdout um JSON com hookSpecificOutput.hookEventName "PreToolUse" e additionalContext citando "code-review-graph"
    And a segunda execução não escreve nada
    And existe .maestro/state/graph-hint-s1
```

#### AC-012 — Sem grafo, silêncio

**Cobre**: US-003, FR-004, NFR-001

```gherkin
@US-003 @FR-004 @NFR-001 @AC-012
Feature: Dica condicionada ao grafo

  Scenario: projeto sem .code-review-graph/
    Given o script graph-hint.sh num projeto sem grafo
    When o hook recebe um evento Grep
    Then nada é escrito em stdout e o exit é 0
```

#### AC-013 — Nova sessão recebe a dica de novo; `Glob` também conta

**Cobre**: US-003, FR-004, FR-007

```gherkin
@US-003 @FR-004 @FR-007 @AC-013
Feature: Escopo da dica

  Scenario: session_id diferente e ferramenta Glob
    Given a dica já emitida para a sessão s1
    When o hook recebe {"session_id":"s2","tool_name":"Glob","tool_input":{"pattern":"**/*.ts"}}
    Then a dica é escrita uma vez para s2
    And a entrada de settings.json do graph-hint tem matcher "Grep|Glob"
```

#### AC-014 — Bloco `hooks-fallback` com até três regras condicionais

**Cobre**: US-004, FR-005, NFR-003

```gherkin
@US-004 @FR-005 @NFR-003 @AC-014
Feature: Regras só como fallback

  Scenario: texto gerado
    Given buildHooksFallbackBlock()
    When o texto é inspecionado
    Then contém no máximo três itens de lista
    And cada item cita um nome de hook instalado e a expressão "maestro doctor"
    And nenhum item descreve o comando que o hook executa
```

#### AC-015 — Bloco instalado uma vez e idempotente

**Cobre**: US-004, FR-005, NFR-003

```gherkin
@US-004 @FR-005 @NFR-003 @AC-015
Feature: Instalação do bloco

  Scenario: dois setups
    Given uma raiz temporária
    When maestro setup roda duas vezes
    Then o bloco anchorado hooks-fallback existe uma única vez no arquivo de instruções do target
    And o registro de extensões tem exatamente um artefato "hooks-fallback"
```

#### AC-016 — Bloco separado do router

**Cobre**: US-004, FR-005, NFR-003

```gherkin
@US-004 @FR-005 @NFR-003 @AC-016
Feature: Bloco próprio

  Scenario: projeto que já tinha o router instalado
    Given uma raiz onde o setup já registrou "router" antes desta versão
    When maestro setup roda
    Then o bloco hooks-fallback é adicionado sem alterar o conteúdo registrado do router
```

#### AC-017 — `guard-docs` bloqueia o build sem `--check`

**Cobre**: US-005, FR-008, NFR-002

```gherkin
@US-005 @FR-008 @NFR-002 @AC-017
Feature: Proteção do documentator

  Scenario: build destrutivo
    Given o script .maestro/hooks/guard-docs.sh instalado
    When ele recebe {"tool_name":"Bash","tool_input":{"command":"node .claude/skills/specsfy-documentator/scripts/build_documentation.mjs --project ."}}
    Then termina com exit 2 e a mensagem cita "--check" e "MAESTRO_ALLOW_DOCS_BUILD=1"
```

#### AC-018 — `--check` e autorização explícita passam

**Cobre**: US-005, FR-008, NFR-002

```gherkin
@US-005 @FR-008 @NFR-002 @AC-018
Feature: Caminhos permitidos

  Scenario: check e variável de autorização
    Given o script guard-docs.sh
    When ele recebe o mesmo comando com "--check"
    Then exit 0
    When ele recebe o comando sem --check com "MAESTRO_ALLOW_DOCS_BUILD=1" no início da linha
    Then exit 0
```

#### AC-019 — `guard-docs` também cobre ferramentas MCP de shell

**Cobre**: US-005, FR-008, FR-002

```gherkin
@US-005 @FR-008 @FR-002 @AC-019
Feature: guard-docs em qualquer shell

  Scenario: build via ctx_execute
    Given o script guard-docs.sh
    When ele recebe {"tool_name":"mcp__plugin_context-mode_context-mode__ctx_execute","tool_input":{"language":"shell","code":"node x/build_documentation.mjs --project ."}}
    Then exit 2
```

#### AC-020 — Resoluções de binário chegam ao fragmento

**Cobre**: US-002, FR-003, FR-007

```gherkin
@US-002 @FR-003 @FR-007 @AC-020
Feature: Variáveis de resolução

  Scenario: setup com resolução conhecida do code-review-graph
    Given runSetup com dependencyResolution {"code-review-graph": "/opt/x/code-review-graph"}
    When .maestro/hooks/code-review-graph-update.sh é lido
    Then o preâmbulo define MAESTRO_BIN_code_review_graph='/opt/x/code-review-graph'
    And sem resolução conhecida o preâmbulo cai para command -v code-review-graph
```

#### AC-021 — Estado por sessão fica em `.maestro/state/` e é ignorado pelo git

**Cobre**: FR-007, NFR-001, NFR-003

```gherkin
@FR-007 @NFR-001 @NFR-003 @AC-021
Feature: Estado local

  Scenario: setup numa raiz com .gitignore sem a entrada
    Given uma raiz temporária com .gitignore que não cita .maestro/state/
    When maestro setup roda
    Then .maestro/state/ existe
    And .gitignore passa a conter a linha ".maestro/state/" uma única vez, mesmo após um segundo setup
```

#### AC-022 — Estado não gravável não bloqueia os hooks

**Cobre**: FR-007, FR-003, FR-004

```gherkin
@FR-007 @FR-003 @FR-004 @AC-022
Feature: Degradação

  Scenario: .maestro/state/ somente leitura
    Given .maestro/state/ sem permissão de escrita
    When code-review-graph-update.sh recebe um evento após uma edição
    Then o binário de teste é invocado mesmo assim e o exit é 0
    When graph-hint.sh recebe um evento Grep
    Then a dica é escrita e o exit é 0
```

#### AC-023 — Preâmbulo expõe `HOOK_TOOL` e o wrapper suporta `context`

**Cobre**: FR-001, FR-004, NFR-002

```gherkin
@FR-001 @FR-004 @NFR-002 @AC-023
Feature: Contrato do wrapper

  Scenario: fragmento que define context
    Given um hook sintético cujo fragmento define context="dica"
    When o script gerado é executado com um evento PreToolUse
    Then stdout contém o JSON com hookSpecificOutput.additionalContext "dica" e o exit é 0
    And a variável HOOK_TOOL contém o tool_name do evento
```

#### AC-024 — Latência do `PostToolUse` amplo sem mudança

**Cobre**: NFR-001, FR-003

```gherkin
@NFR-001 @FR-003 @AC-024
Feature: Custo por chamada

  Scenario: vinte eventos sem mudança
    Given o hash já gravado
    When code-review-graph-update.sh é executado 20 vezes sem alteração no working tree
    Then a mediana por execução fica abaixo de 200 ms e o binário de teste nunca é invocado
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O preâmbulo dos scripts deve expor `HOOK_TOOL` (de `tool_name`) e `HOOK_COMMAND` extraído de `tool_input.command`, de `tool_input.code` quando `tool_input.language` for ausente, `shell`, `bash` ou `sh`, ou da concatenação de `tool_input.commands[]` com `;`; qualquer outra linguagem deixa `HOOK_COMMAND` vazio.
- **FR-002**: `guard-destructive`, `guard-secrets`, `protect-authorship` e `guard-docs` devem declarar `tools: Bash|mcp__.*(execute|run_in_terminal|shell).*` e produzir o mesmo veredito para o mesmo comando em qualquer dessas ferramentas.
- **FR-003**: `code-review-graph-update` deve ser um hook de script em `after-tool` com `tools: Edit|Write|MultiEdit|NotebookEdit|Bash|mcp__.*` que executa `update --brief` (saída suprimida) somente quando o hash de `git status --porcelain` difere do gravado em `.maestro/state/crg-tree.hash`; `code-review-graph-stop` deve executar o mesmo em `stop`.
- **FR-004**: `graph-hint` deve, em `before-tool` com `tools: Grep|Glob`, escrever uma única vez por `session_id` (marca em `.maestro/state/graph-hint-<session_id>`) o JSON `hookSpecificOutput.additionalContext` com uma frase apontando `code-review-graph search/impact`, e nada quando `.code-review-graph/` não existir.
- **FR-005**: O setup deve instalar um bloco anchorado `hooks-fallback` (separado do `router`) com no máximo três regras, cada uma na forma "o hook X garante Y; se `maestro doctor` reportar X ausente ou inerte, faça Y manualmente".
- **FR-006**: A entrega deve registrar verificação manual de que os hooks do projeto valem para subagentes, com data e responsável, na seção 11.
- **FR-007**: O setup deve criar `.maestro/state/`, garantir a linha `.maestro/state/` no `.gitignore` uma única vez, e o preâmbulo deve expor as resoluções conhecidas como `MAESTRO_BIN_<nome_com_underscores>`; estado não gravável degrada para "executa sempre"/"dica sempre", nunca bloqueia.
- **FR-008**: `guard-docs` deve bloquear (`exit 2`) comando cujo `HOOK_COMMAND` contenha `build_documentation.mjs` sem `--check`, exceto quando a linha começar com `MAESTRO_ALLOW_DOCS_BUILD=1`, com mensagem citando `--check` e a variável.

#### Não funcionais

- **NFR-001**: Custo de contexto zero no caminho feliz — hooks não escrevem em stdout, exceto a dica única por sessão; `PostToolUse` amplo sem mudança custa menos de 200 ms (mediana). **Verificação**: testes de subprocesso medindo stdout e tempo.
- **NFR-002**: Paridade de veredito entre ferramentas — para o mesmo comando, `Bash`, `ctx_execute` shell, `ctx_batch_execute` e `run_in_terminal` produzem o mesmo exit e mensagem. **Verificação**: teste parametrizado por ferramenta sobre os quatro guards.
- **NFR-003**: Sem overlap e sem drift — regras-fallback ≤ 3, condicionais ao doctor, em bloco próprio idempotente; estado local nunca versionado. **Verificação**: testes sobre o texto gerado, o registro de extensões e o `.gitignore`.

#### Erros e casos-limite

- `tool_input` sem `command`/`code`/`commands` → `HOOK_COMMAND` vazio → guards permitem.
- `code-review-graph` ausente e sem resolução → hook silencioso, exit 0.
- Diretório sem git → `code-review-graph-update` executa sempre (sem hash) e permanece silencioso.
- `session_id` ausente no evento → dica emitida (sem marca), nunca bloqueia.
- `.gitignore` ausente → criado só com a linha `.maestro/state/`.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

Node/TypeScript com Vitest (`test:tdd`). Pipeline de hooks da SPEC-0022: `readHook` (`tools:`, `kind`), `translateForClaudeCode` (`MATCHER_MAP`, `wrap` com `PREAMBLE`/`POSTAMBLE`), scripts em `.maestro/hooks/` via `writeHookScripts`, `resolveHookCommand`/`resolveDispatchCommand`, blocos anchorados via `createExtension` (nome novo obrigatório — DEC-002 da SPEC-0012).

#### Arquitetura e módulos

- `src/hooks/claude-code.ts`: `PREAMBLE` extrai `HOOK_TOOL`, `HOOK_COMMAND` (command | code+language | commands[]), `HOOK_FILE`, `HOOK_SESSION`; recebe um bloco de variáveis `MAESTRO_BIN_*` injetado por `wrap(hook, bins)`; `POSTAMBLE` passa a emitir o JSON de `additionalContext` quando `context` não estiver vazio.
- `src/hooks/resolve.ts`: `binVariables(resolution)` → linhas `MAESTRO_BIN_<nome>='<caminho>'` para nomes resolvidos.
- `src/setup/run.ts`: passa as resoluções ao `translate` dos scripts; `ensureStateDir(root)` cria `.maestro/state/` e a linha no `.gitignore`; instala o bloco `hooks-fallback` via `createExtension` no mesmo ponto de `ensureConfigLanguageRouterCandidate`.
- `src/extensions/router.ts`: `buildHooksFallbackBlock()` e `buildHooksFallbackPointer()`.
- `resources/hooks/guard-destructive.md`, `guard-secrets.md`, `protect-authorship.md`: `tools:` ampliado.
- `resources/hooks/code-review-graph-update.md`: reescrito como fragmento (`after-tool`, `tools`), com hash e binário via `MAESTRO_BIN_code_review_graph` ou `command -v`.
- `resources/hooks/code-review-graph-stop.md` (novo, `stop`), `graph-hint.md` (novo, `before-tool`, `tools: Grep|Glob`), `guard-docs.md` (novo, `before-tool`, `tools` dos guards, `blocking: true`).

#### Migrations

- Não aplicável.

#### Models

- `Hook` (`src/hooks/source.ts`): sem mudança de forma; `code-review-graph-update` muda de `dispatch` para `script`.
- Estado local: `.maestro/state/crg-tree.hash` (texto) e `.maestro/state/graph-hint-<session_id>` (arquivo vazio).

#### Controllers e casos de uso

- `runSetup`: além do fluxo atual, `ensureStateDir` e o candidato `hooks-fallback`.

#### Views e experiência

- Não aplicável: sem interface.

#### Queries e repositórios

- Leitura de `.gitignore`, `.maestro/state/*`, `git status --porcelain` (via `git` no `PATH`).

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/completed/0023-hooks-resistentes-e-regras-fallback-sem-overlap/
  spec.md
  research/
    ferramentas-de-shell-observadas.md
    claude-code-hooks-contrato.md
src/hooks/claude-code.ts      (PREAMBLE/POSTAMBLE, wrap com bins)
src/hooks/resolve.ts          (binVariables)
src/setup/run.ts              (ensureStateDir, hooks-fallback)
src/extensions/router.ts      (buildHooksFallbackBlock/Pointer)
resources/hooks/
  guard-destructive.md        (tools:)
  guard-secrets.md            (tools:)
  protect-authorship.md       (tools:)
  code-review-graph-update.md (script, after-tool)
  code-review-graph-stop.md   (novo)
  graph-hint.md               (novo)
  guard-docs.md               (novo)
tests/
  hooks-any-shell-guards.test.ts
  hooks-graph-update.test.ts
  hooks-graph-hint.test.ts
  hooks-fallback-block.test.ts
  hooks-guard-docs.test.ts
  hooks-wrapper-context.test.ts
  setup-state-dir.test.ts
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Hash do working tree | `.maestro/state/crg-tree.hash` | sha256 de `git status --porcelain`; ausente = "nunca executado" | lido/escrito por `code-review-graph-update` e `-stop` |
| Marca de dica | `.maestro/state/graph-hint-<session_id>` | arquivo vazio; existe = dica já emitida | escrito por `graph-hint` |
| Bloco `hooks-fallback` | nome no registro de extensões | conteúdo e checksum | mesmo mecanismo dos blocos `router`/`config-language-rule` |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Hash | ausente/diferente | evento pós-ferramenta ou Stop | igual ao atual, CLI executado | CLI só executa na transição |
| Marca de dica | ausente | primeiro Grep/Glob da sessão | presente, dica emitida | uma emissão por sessão |

#### Migração e retenção

- `.maestro/state/` não versionado; pode ser apagado a qualquer momento (o custo é uma execução extra do CLI ou uma dica repetida).

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não. A entrega são hooks, um bloco de instruções e estado local; a pessoa só observa bloqueios e o relatório do setup.

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

- `buildHooksFallbackBlock(): string`, `buildHooksFallbackPointer(): string`.
- `binVariables(resolution): string[]`.
- Variáveis do preâmbulo disponíveis a fragmentos: `HOOK_TOOL`, `HOOK_COMMAND`, `HOOK_FILE`, `HOOK_SESSION`, `MAESTRO_BIN_*`, `decision`, `message`, `context`.

#### APIs externas utilizadas

- `git status --porcelain` (git local); `code-review-graph update --brief` (CLI local); nenhuma rede.

#### Documentação das APIs consultadas

- Contrato de hooks do Claude Code conforme observado (research/claude-code-hooks-contrato.md).

#### Eventos e outros contratos

- `PreToolUse`: `exit 2` bloqueia; stdout JSON `hookSpecificOutput.additionalContext` injeta contexto. `PostToolUse`/`Stop`: stdout vazio.

### 11. Estratégia TDD

- **Unidade**: `buildHooksFallbackBlock`, `binVariables`, tradução dos novos hooks (`tools`, evento, kind).
- **Integração/contrato**: execução real dos scripts gerados via `bash` com JSONs por ferramenta; `runSetup` em raiz temporária (settings, `.maestro/state/`, `.gitignore`, bloco); binário de teste `code-review-graph` que registra invocações; medição de latência.
- **BDD/aceite**: AC-001 a AC-024 na seção 6, um caso TDD por AC (AC-006 é manual).
- **Runner TDD**: Vitest (`npm run test:tdd`).
- **E2E**: Não aplicável.
- **Verificação manual**: AC-006 (subagentes) — só observável numa sessão real do Claude Code; registrada com data e responsável.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, FR-002, FR-006, NFR-002, AC-001 | AC-001 na seção 6 | caso 1 em tests/hooks-any-shell-guards.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: exit 0 em vez de 2: o preâmbulo só extrai `command`, não `code` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-001, FR-001, FR-002, FR-006, NFR-002, AC-002 | AC-002 na seção 6 | caso 2 em tests/hooks-any-shell-guards.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: matcher da entrada é `Bash` e não casa `mcp__terminal__run_in_terminal` (o script isolado já bloqueia; o gap é o `tools:`) | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-001, FR-001, NFR-002, AC-003 | AC-003 na seção 6 | caso 3 em tests/hooks-any-shell-guards.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: exit 0 esperado ocorre, mas o par shell devolve 0 em vez de 2 (`code` não extraído) | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-001, FR-001, FR-002, AC-004 | AC-004 na seção 6 | caso 4 em tests/hooks-any-shell-guards.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: exit 0 em vez de 2: `commands[]` não é extraído | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-001, FR-002, AC-005 | AC-005 na seção 6 | caso 5 em tests/hooks-any-shell-guards.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: matcher `Bash` em vez do regex de ferramentas de shell | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-001, FR-006, AC-006 | AC-006 na seção 6 | caso documental 6 em tests/hooks-any-shell-guards.test.ts com marcador próprio `SPECSFY:` (verificação manual) | RED 2026-09-17: célula GREEN de AC-006 na seção 11 ainda era `Pending` | Verificação manual 2026-09-17, responsável: Bruno Calmon (sessão do Claude Code neste repositório, operada pelo agente com sua autorização): subagente `general-purpose` (Haiku) lançado por `Agent` executou `cat .env` via `Bash` e recebeu `Blocked: this command would print credentials into the transcript…` (guard-secrets); `echo probe-ok` executou normalmente — os hooks de projeto valem para subagentes | Caso documental verde após o registro |
| US-002, FR-003, FR-007, NFR-001, AC-007 | AC-007 na seção 6 | caso 1 em tests/hooks-graph-update.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `hook code-review-graph-update produced no script body` (ainda é despacho) | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-002, FR-003, FR-007, NFR-001, AC-008 | AC-008 na seção 6 | caso 2 em tests/hooks-graph-update.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: idem — sem script | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-002, FR-003, NFR-001, AC-009 | AC-009 na seção 6 | caso 3 em tests/hooks-graph-update.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `ENOENT resources/hooks/code-review-graph-stop.md` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-002, FR-003, AC-010 | AC-010 na seção 6 | caso 4 em tests/hooks-graph-update.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: matcher `undefined`: entrada continua como despacho `code-review-graph update --brief` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-003, FR-004, FR-007, NFR-001, AC-011 | AC-011 na seção 6 | caso 1 em tests/hooks-graph-hint.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `ENOENT resources/hooks/graph-hint.md` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-003, FR-004, NFR-001, AC-012 | AC-012 na seção 6 | caso 2 em tests/hooks-graph-hint.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: idem | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-003, FR-004, FR-007, AC-013 | AC-013 na seção 6 | caso 3 em tests/hooks-graph-hint.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: idem | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-004, FR-005, NFR-003, AC-014 | AC-014 na seção 6 | caso 1 em tests/hooks-fallback-block.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `buildHooksFallbackBlock` inexistente (`expected 0 to be greater than 0`) | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-004, FR-005, NFR-003, AC-015 | AC-015 na seção 6 | caso 2 em tests/hooks-fallback-block.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: nenhuma âncora `hooks-fallback` nos arquivos (`expected [] to have length 1`) | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-004, FR-005, NFR-003, AC-016 | AC-016 na seção 6 | caso 3 em tests/hooks-fallback-block.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: artefato `hooks-fallback` ausente no registro | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-005, FR-008, NFR-002, AC-017 | AC-017 na seção 6 | caso 1 em tests/hooks-guard-docs.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `ENOENT resources/hooks/guard-docs.md` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-005, FR-008, NFR-002, AC-018 | AC-018 na seção 6 | caso 2 em tests/hooks-guard-docs.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: idem | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-005, FR-008, FR-002, AC-019 | AC-019 na seção 6 | caso 3 em tests/hooks-guard-docs.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: idem | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| US-002, FR-003, FR-007, AC-020 | AC-020 na seção 6 | caso 5 em tests/hooks-graph-update.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: sem script body; `kind` é `dispatch` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| FR-007, NFR-001, NFR-003, AC-021 | AC-021 na seção 6 | caso 1 em tests/setup-state-dir.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `.maestro/state/` não criado pelo setup (`expected false to be true`) | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| FR-007, FR-003, FR-004, AC-022 | AC-022 na seção 6 | caso 2 em tests/setup-state-dir.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: sem script de update | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| FR-001, FR-004, NFR-002, AC-023 | AC-023 na seção 6 | caso 1 em tests/hooks-wrapper-context.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: stdout vazio: postâmbulo não emite `context` (`Unexpected end of JSON input`) | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |
| NFR-001, FR-003, AC-024 | AC-024 na seção 6 | caso 6 em tests/hooks-graph-update.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: sem script de update | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 579/590, falhas restantes são o RED da SPEC-0021 |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Integração | tests/hooks-any-shell-guards.test.ts | Passed (2026-09-17) |
| FR-001 | AC-002 | Integração | tests/hooks-any-shell-guards.test.ts | Passed (2026-09-17) |
| FR-001 | AC-003 | Integração | tests/hooks-any-shell-guards.test.ts | Passed (2026-09-17) |
| FR-001 | AC-004 | Integração | tests/hooks-any-shell-guards.test.ts | Passed (2026-09-17) |
| FR-001 | AC-023 | Integração | tests/hooks-wrapper-context.test.ts | Passed (2026-09-17) |
| FR-002 | AC-001 | Integração | tests/hooks-any-shell-guards.test.ts | Passed (2026-09-17) |
| FR-002 | AC-002 | Integração | tests/hooks-any-shell-guards.test.ts | Passed (2026-09-17) |
| FR-002 | AC-004 | Integração | tests/hooks-any-shell-guards.test.ts | Passed (2026-09-17) |
| FR-002 | AC-005 | Integração | tests/hooks-any-shell-guards.test.ts | Passed (2026-09-17) |
| FR-002 | AC-019 | Integração | tests/hooks-guard-docs.test.ts | Passed (2026-09-17) |
| FR-003 | AC-007 | Integração | tests/hooks-graph-update.test.ts | Passed (2026-09-17) |
| FR-003 | AC-008 | Integração | tests/hooks-graph-update.test.ts | Passed (2026-09-17) |
| FR-003 | AC-009 | Integração | tests/hooks-graph-update.test.ts | Passed (2026-09-17) |
| FR-003 | AC-010 | Integração | tests/hooks-graph-update.test.ts | Passed (2026-09-17) |
| FR-003 | AC-020 | Integração | tests/hooks-graph-update.test.ts | Passed (2026-09-17) |
| FR-003 | AC-022 | Integração | tests/setup-state-dir.test.ts | Passed (2026-09-17) |
| FR-003 | AC-024 | Integração | tests/hooks-graph-update.test.ts | Passed (2026-09-17) |
| FR-004 | AC-011 | Integração | tests/hooks-graph-hint.test.ts | Passed (2026-09-17) |
| FR-004 | AC-012 | Integração | tests/hooks-graph-hint.test.ts | Passed (2026-09-17) |
| FR-004 | AC-013 | Integração | tests/hooks-graph-hint.test.ts | Passed (2026-09-17) |
| FR-004 | AC-022 | Integração | tests/setup-state-dir.test.ts | Passed (2026-09-17) |
| FR-004 | AC-023 | Integração | tests/hooks-wrapper-context.test.ts | Passed (2026-09-17) |
| FR-005 | AC-014 | Unidade | tests/hooks-fallback-block.test.ts | Passed (2026-09-17) |
| FR-005 | AC-015 | Integração | tests/hooks-fallback-block.test.ts | Passed (2026-09-17) |
| FR-005 | AC-016 | Integração | tests/hooks-fallback-block.test.ts | Passed (2026-09-17) |
| FR-006 | AC-006 | Manual | sessão real do Claude Code; registro em tests/hooks-any-shell-guards.test.ts | Passed (2026-09-17) |
| FR-006 | AC-001 | Integração | tests/hooks-any-shell-guards.test.ts | Passed (2026-09-17) |
| FR-006 | AC-002 | Integração | tests/hooks-any-shell-guards.test.ts | Passed (2026-09-17) |
| FR-007 | AC-007 | Integração | tests/hooks-graph-update.test.ts | Passed (2026-09-17) |
| FR-007 | AC-011 | Integração | tests/hooks-graph-hint.test.ts | Passed (2026-09-17) |
| FR-007 | AC-020 | Integração | tests/hooks-graph-update.test.ts | Passed (2026-09-17) |
| FR-007 | AC-021 | Integração | tests/setup-state-dir.test.ts | Passed (2026-09-17) |
| FR-007 | AC-022 | Integração | tests/setup-state-dir.test.ts | Passed (2026-09-17) |
| FR-008 | AC-017 | Integração | tests/hooks-guard-docs.test.ts | Passed (2026-09-17) |
| FR-008 | AC-018 | Integração | tests/hooks-guard-docs.test.ts | Passed (2026-09-17) |
| FR-008 | AC-019 | Integração | tests/hooks-guard-docs.test.ts | Passed (2026-09-17) |
| NFR-001 | AC-007 | Integração | tests/hooks-graph-update.test.ts | Passed (2026-09-17) |
| NFR-001 | AC-011 | Integração | tests/hooks-graph-hint.test.ts | Passed (2026-09-17) |
| NFR-001 | AC-024 | Integração | tests/hooks-graph-update.test.ts | Passed (2026-09-17) |
| NFR-002 | AC-001 | Integração | tests/hooks-any-shell-guards.test.ts | Passed (2026-09-17) |
| NFR-002 | AC-003 | Integração | tests/hooks-any-shell-guards.test.ts | Passed (2026-09-17) |
| NFR-002 | AC-017 | Integração | tests/hooks-guard-docs.test.ts | Passed (2026-09-17) |
| NFR-003 | AC-014 | Unidade | tests/hooks-fallback-block.test.ts | Passed (2026-09-17) |
| NFR-003 | AC-015 | Integração | tests/hooks-fallback-block.test.ts | Passed (2026-09-17) |
| NFR-003 | AC-021 | Integração | tests/setup-state-dir.test.ts | Passed (2026-09-17) |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-09-17); aceite final em `review` (2026-09-17): entrega conferida contra cada AC/FR/NFR e a DoD, findings FIND-SEC-001/002 e FIND-PROD-001 permanecem `Accepted` com as mitigações entregues (aviso explícito no guard-docs, cobertura por regex documentada para o doctor da 0013, regra-fallback do grafo) — spec movida para `completed`.
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/completed/0023-hooks-resistentes-e-regras-fallback-sem-overlap/spec.md`
- **Achados**: estrutura VALID; research PASSED (R-001, R-002 critical verificados; R-003 high verificado); cobertura mínima atendida — 5 US, 8 FR, 3 NFR com ≥3 AC cada, 24 AC (ciclo 1 acrescentou FR-006 a AC-001/AC-002); NOTE editorial resolvido (homógrafo de marcador pendente na seção 16). Sem BLOCKER.
- **FIND-SEC-001** [P2] [Accepted] O escape `MAESTRO_ALLOW_DOCS_BUILD=1` do `guard-docs` pode ser usado pelo próprio agente para contornar o bloqueio — Refs: FR-008, AC-018 — Evidence: findings/external/FIND-EXT-001-specsfy-documentator-sobrescreve-docs.md:1 — Effect: a proteção detém execução acidental, não intenção deliberada — Suggestion: manter o escape explícito (a mensagem do guard torna o risco visível e o `build` sem `--check` com docs relocada é inofensivo); a proteção definitiva é o fix upstream (FIND-EXT-001).
- **FIND-SEC-002** [P3] [Accepted] O regex `Bash|mcp__.*(execute|run_in_terminal|shell).*` cobre as ferramentas de shell observadas; uma ferramenta MCP futura com nome fora do padrão passa sem guarda — Refs: FR-002, AC-005 — Evidence: specs/completed/0023-hooks-resistentes-e-regras-fallback-sem-overlap/research/ferramentas-de-shell-observadas.md:1 — Effect: cobertura por convenção de nome, não por semântica — Suggestion: BACKLOG-0013 faz o doctor listar as ferramentas MCP registradas no projeto e reportar as de shell fora do regex; o `tools:` pode ser ampliado por extensão local sem release.
- **FIND-ARCH-001** [P2] [Resolved] `code-review-graph-update` muda de despacho (`raw_command`) para script; consumidores já migrados pela SPEC-0022 têm a entrada de despacho com marcador `# maestro:hook=code-review-graph-update` — Refs: FR-003, AC-010 — Evidence: src/hooks/identity.ts:1 — Effect: sem tratamento, a entrada antiga ficaria ao lado da nova — Suggestion: resolvido por desenho — `isMaestroEntry` reconhece o marcador e o merge por identidade substitui a entrada pelo mesmo nome; AC-010 confirma uma única entrada.
- **FIND-PROD-001** [P3] [Accepted] A dica do grafo é um lembrete, não uma garantia de uso — Refs: FR-004, AC-011 — Evidence: specs/completed/0023-hooks-resistentes-e-regras-fallback-sem-overlap/research/claude-code-hooks-contrato.md:1 — Effect: o agente pode ignorar a dica — Suggestion: aceito por decisão do usuário (negar `Grep`/`Read` está fora de escopo); a regra-fallback única sobre o grafo cobre o caso do hook ausente.

#### Gate do Ato II — Plano

- **Resultado**: Pending
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/completed/0023-hooks-resistentes-e-regras-fallback-sem-overlap/spec.md`
- **Achados**: Pending.

#### Gate do Ato III — Entrega

- **Resultado**: Pending
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/completed/0023-hooks-resistentes-e-regras-fallback-sem-overlap/spec.md .`
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

Cada tarefa `[CODE]` grava no **PREP** um snapshot do `code-review-graph` (`status`) e no **VERIFY** roda `update --brief` + `detect-changes --base HEAD --brief`, registrando o delta na evidência; a reconstrução de `docs/` é dirigida (o `build_documentation.mjs` só com `--check`, por FIND-EXT-001). Nenhuma tarefa tem superfície visual.

#### Fase 1 — RED TDD informado pelo BDD (um caso por `AC`)

- [x] T001 [TEST] [TDD] [US-001] Derivar de AC-001 um caso Vitest falhando em tests/hooks-any-shell-guards.test.ts — Refs: US-001, FR-001, FR-002, FR-006, NFR-002, AC-001 — Depends: none
  - [x] **PREP**: Gherkin de AC-001 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-any-shell-guards.test.ts com marcador `SPECSFY: … AC-001`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — exit 0 em vez de 2: o preâmbulo só extrai `command`, não `code`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-any-shell-guards` → falha em AC-001 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T002 [TEST] [TDD] [US-001] Derivar de AC-002 um caso Vitest falhando em tests/hooks-any-shell-guards.test.ts — Refs: US-001, FR-001, FR-002, FR-006, NFR-002, AC-002 — Depends: none
  - [x] **PREP**: Gherkin de AC-002 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-any-shell-guards.test.ts com marcador `SPECSFY: … AC-002`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — matcher da entrada é `Bash` e não casa `mcp__terminal__run_in_terminal` (o script isolado já bloqueia; o gap é o `tools:`).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-any-shell-guards` → falha em AC-002 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Caso refinado após passar antes da mudança no nível do script: passou a exigir o matcher com `run_in_terminal`, que é o gap real.

- [x] T003 [TEST] [TDD] [US-001] Derivar de AC-003 um caso Vitest falhando em tests/hooks-any-shell-guards.test.ts — Refs: US-001, FR-001, NFR-002, AC-003 — Depends: none
  - [x] **PREP**: Gherkin de AC-003 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-any-shell-guards.test.ts com marcador `SPECSFY: … AC-003`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — exit 0 esperado ocorre, mas o par shell devolve 0 em vez de 2 (`code` não extraído).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-any-shell-guards` → falha em AC-003 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T004 [TEST] [TDD] [US-001] Derivar de AC-004 um caso Vitest falhando em tests/hooks-any-shell-guards.test.ts — Refs: US-001, FR-001, FR-002, AC-004 — Depends: none
  - [x] **PREP**: Gherkin de AC-004 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-any-shell-guards.test.ts com marcador `SPECSFY: … AC-004`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — exit 0 em vez de 2: `commands[]` não é extraído.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-any-shell-guards` → falha em AC-004 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T005 [TEST] [TDD] [US-001] Derivar de AC-005 um caso Vitest falhando em tests/hooks-any-shell-guards.test.ts — Refs: US-001, FR-002, AC-005 — Depends: none
  - [x] **PREP**: Gherkin de AC-005 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-any-shell-guards.test.ts com marcador `SPECSFY: … AC-005`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — matcher `Bash` em vez do regex de ferramentas de shell.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-any-shell-guards` → falha em AC-005 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T006 [TEST] [TDD] [US-001] Derivar de AC-006 um caso Vitest falhando em tests/hooks-any-shell-guards.test.ts — Refs: US-001, FR-006, AC-006 — Depends: none
  - [x] **PREP**: Gherkin de AC-006 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-any-shell-guards.test.ts com marcador `SPECSFY: … AC-006`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — célula GREEN de AC-006 na seção 11 ainda é `Pending` (sem data/responsável).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-any-shell-guards` → falha em AC-006 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T007 [TEST] [TDD] [US-002] Derivar de AC-007 um caso Vitest falhando em tests/hooks-graph-update.test.ts — Refs: US-002, FR-003, FR-007, NFR-001, AC-007 — Depends: none
  - [x] **PREP**: Gherkin de AC-007 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-graph-update.test.ts com marcador `SPECSFY: … AC-007`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — `hook code-review-graph-update produced no script body` (ainda é despacho).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-graph-update` → falha em AC-007 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T008 [TEST] [TDD] [US-002] Derivar de AC-008 um caso Vitest falhando em tests/hooks-graph-update.test.ts — Refs: US-002, FR-003, FR-007, NFR-001, AC-008 — Depends: none
  - [x] **PREP**: Gherkin de AC-008 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-graph-update.test.ts com marcador `SPECSFY: … AC-008`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — idem — sem script.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-graph-update` → falha em AC-008 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T009 [TEST] [TDD] [US-002] Derivar de AC-009 um caso Vitest falhando em tests/hooks-graph-update.test.ts — Refs: US-002, FR-003, NFR-001, AC-009 — Depends: none
  - [x] **PREP**: Gherkin de AC-009 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-graph-update.test.ts com marcador `SPECSFY: … AC-009`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — `ENOENT resources/hooks/code-review-graph-stop.md`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-graph-update` → falha em AC-009 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T010 [TEST] [TDD] [US-002] Derivar de AC-010 um caso Vitest falhando em tests/hooks-graph-update.test.ts — Refs: US-002, FR-003, AC-010 — Depends: none
  - [x] **PREP**: Gherkin de AC-010 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-graph-update.test.ts com marcador `SPECSFY: … AC-010`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — matcher `undefined`: entrada continua como despacho `code-review-graph update --brief`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-graph-update` → falha em AC-010 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T011 [TEST] [TDD] [US-003] Derivar de AC-011 um caso Vitest falhando em tests/hooks-graph-hint.test.ts — Refs: US-003, FR-004, FR-007, NFR-001, AC-011 — Depends: none
  - [x] **PREP**: Gherkin de AC-011 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-graph-hint.test.ts com marcador `SPECSFY: … AC-011`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — `ENOENT resources/hooks/graph-hint.md`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-graph-hint` → falha em AC-011 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T012 [TEST] [TDD] [US-003] Derivar de AC-012 um caso Vitest falhando em tests/hooks-graph-hint.test.ts — Refs: US-003, FR-004, NFR-001, AC-012 — Depends: none
  - [x] **PREP**: Gherkin de AC-012 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-graph-hint.test.ts com marcador `SPECSFY: … AC-012`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — idem.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-graph-hint` → falha em AC-012 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T013 [TEST] [TDD] [US-003] Derivar de AC-013 um caso Vitest falhando em tests/hooks-graph-hint.test.ts — Refs: US-003, FR-004, FR-007, AC-013 — Depends: none
  - [x] **PREP**: Gherkin de AC-013 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-graph-hint.test.ts com marcador `SPECSFY: … AC-013`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — idem.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-graph-hint` → falha em AC-013 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T014 [TEST] [TDD] [US-004] Derivar de AC-014 um caso Vitest falhando em tests/hooks-fallback-block.test.ts — Refs: US-004, FR-005, NFR-003, AC-014 — Depends: none
  - [x] **PREP**: Gherkin de AC-014 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-fallback-block.test.ts com marcador `SPECSFY: … AC-014`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — `buildHooksFallbackBlock` inexistente (`expected 0 to be greater than 0`).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-fallback-block` → falha em AC-014 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T015 [TEST] [TDD] [US-004] Derivar de AC-015 um caso Vitest falhando em tests/hooks-fallback-block.test.ts — Refs: US-004, FR-005, NFR-003, AC-015 — Depends: none
  - [x] **PREP**: Gherkin de AC-015 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-fallback-block.test.ts com marcador `SPECSFY: … AC-015`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — nenhuma âncora `hooks-fallback` nos arquivos (`expected [] to have length 1`).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-fallback-block` → falha em AC-015 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T016 [TEST] [TDD] [US-004] Derivar de AC-016 um caso Vitest falhando em tests/hooks-fallback-block.test.ts — Refs: US-004, FR-005, NFR-003, AC-016 — Depends: none
  - [x] **PREP**: Gherkin de AC-016 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-fallback-block.test.ts com marcador `SPECSFY: … AC-016`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — artefato `hooks-fallback` ausente no registro.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-fallback-block` → falha em AC-016 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T017 [TEST] [TDD] [US-005] Derivar de AC-017 um caso Vitest falhando em tests/hooks-guard-docs.test.ts — Refs: US-005, FR-008, NFR-002, AC-017 — Depends: none
  - [x] **PREP**: Gherkin de AC-017 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-guard-docs.test.ts com marcador `SPECSFY: … AC-017`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — `ENOENT resources/hooks/guard-docs.md`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-guard-docs` → falha em AC-017 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T018 [TEST] [TDD] [US-005] Derivar de AC-018 um caso Vitest falhando em tests/hooks-guard-docs.test.ts — Refs: US-005, FR-008, NFR-002, AC-018 — Depends: none
  - [x] **PREP**: Gherkin de AC-018 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-guard-docs.test.ts com marcador `SPECSFY: … AC-018`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — idem.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-guard-docs` → falha em AC-018 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T019 [TEST] [TDD] [US-005] Derivar de AC-019 um caso Vitest falhando em tests/hooks-guard-docs.test.ts — Refs: US-005, FR-008, FR-002, AC-019 — Depends: none
  - [x] **PREP**: Gherkin de AC-019 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-guard-docs.test.ts com marcador `SPECSFY: … AC-019`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — idem.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-guard-docs` → falha em AC-019 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T020 [TEST] [TDD] [US-002] Derivar de AC-020 um caso Vitest falhando em tests/hooks-graph-update.test.ts — Refs: US-002, FR-003, FR-007, AC-020 — Depends: none
  - [x] **PREP**: Gherkin de AC-020 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-graph-update.test.ts com marcador `SPECSFY: … AC-020`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — sem script body; `kind` é `dispatch`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-graph-update` → falha em AC-020 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T021 [TEST] [TDD] Derivar de AC-021 um caso Vitest falhando em tests/setup-state-dir.test.ts — Refs: FR-007, NFR-001, NFR-003, AC-021 — Depends: none
  - [x] **PREP**: Gherkin de AC-021 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-state-dir.test.ts com marcador `SPECSFY: … AC-021`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — `.maestro/state/` não criado pelo setup (`expected false to be true`).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-state-dir` → falha em AC-021 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T022 [TEST] [TDD] Derivar de AC-022 um caso Vitest falhando em tests/setup-state-dir.test.ts — Refs: FR-007, FR-003, FR-004, AC-022 — Depends: none
  - [x] **PREP**: Gherkin de AC-022 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-state-dir.test.ts com marcador `SPECSFY: … AC-022`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — sem script de update.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-state-dir` → falha em AC-022 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T023 [TEST] [TDD] Derivar de AC-023 um caso Vitest falhando em tests/hooks-wrapper-context.test.ts — Refs: FR-001, FR-004, NFR-002, AC-023 — Depends: none
  - [x] **PREP**: Gherkin de AC-023 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-wrapper-context.test.ts com marcador `SPECSFY: … AC-023`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — stdout vazio: postâmbulo não emite `context` (`Unexpected end of JSON input`).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-wrapper-context` → falha em AC-023 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T024 [TEST] [TDD] Derivar de AC-024 um caso Vitest falhando em tests/hooks-graph-update.test.ts — Refs: NFR-001, FR-003, AC-024 — Depends: none
  - [x] **PREP**: Gherkin de AC-024 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-graph-update.test.ts com marcador `SPECSFY: … AC-024`; helpers em tests/helpers-spec-0023.ts (scripts gerados, repo git temporário, binário de teste do grafo); sem `.feature`.
  - [x] **VERIFY**: RED válido — sem script de update.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-graph-update` → falha em AC-024 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.


#### Fase 2 — Wrapper resistente (fundação)

**Objetivo**: preâmbulo com `HOOK_TOOL`, extração por ferramenta, `MAESTRO_BIN_*` e postâmbulo com `context`.
**Teste independente**: `npm run test:tdd -- hooks-wrapper-context hooks-any-shell-guards` verde nos casos de extração.

- [x] T025 [CODE] [US-001] Estender PREAMBLE/POSTAMBLE e wrap(hook, bins) em src/hooks/claude-code.ts — Refs: US-001, FR-001, FR-004, NFR-002, AC-001, AC-003, AC-004, AC-023 — Depends: T001, T003, T004, T023
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes: 1746 nós / 14061 arestas / 322 arquivos; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `PREAMBLE` expõe `HOOK_TOOL`, `HOOK_SESSION`, `HOOK_FILE` e `HOOK_COMMAND` (command | code+language shell/bash/sh/zsh | commands[] unidos por `;`) via `_hook_str`; `wrap(hook, bins)` injeta `HOOK_TARGET_EVENT` e `MAESTRO_BIN_*`; `POSTAMBLE` emite o JSON `hookSpecificOutput.additionalContext` quando `context` não é vazio.
  - [x] **VERIFY**: `npm run test:tdd -- hooks-wrapper-context hooks-any-shell-guards hooks-corpus hooks-escape` → GREEN; `npx tsc --noEmit` limpo; grafo após: 1750 nós / 14093 arestas / 322 arquivos, `detect-changes --base HEAD` → 64 arquivos, 94 funções, risco 0,65, 0 fluxos afetados (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, hooks e configuração.
  - [x] **EVIDENCE**: GREEN e delta do grafo registrados nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `.specsfy/RULES.md` com as três regras confirmadas; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima.
  <!-- specsfy:evidence {"task":"T025","refs":["US-001","FR-001","FR-004","NFR-002","AC-001","AC-003","AC-004","AC-023"],"files":["src/hooks/claude-code.ts"],"commands":[{"run":"npm run test:tdd -- hooks-wrapper-context hooks-any-shell-guards hooks-corpus hooks-escape","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T026 [CODE] [US-002] Gerar variáveis de resolução em src/hooks/resolve.ts e passá-las ao wrapper em src/setup/run.ts — Refs: US-002, FR-003, FR-007, AC-007, AC-020, AC-022 — Depends: T007, T020, T022, T025
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes: 1746 nós / 14061 arestas / 322 arquivos; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `binVariables(resolution)` em `resolve.ts`; `formatHooks(hooks, bins)` nos adaptadores e `runSetup` passando `dependencyResolution`.
  - [x] **VERIFY**: `npm run test:tdd -- hooks-graph-update hooks-resolve` → GREEN; `npx tsc --noEmit` limpo; grafo após: 1750 nós / 14093 arestas / 322 arquivos, `detect-changes --base HEAD` → 64 arquivos, 94 funções, risco 0,65, 0 fluxos afetados (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, hooks e configuração.
  - [x] **EVIDENCE**: GREEN e delta do grafo registrados nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `.specsfy/RULES.md` com as três regras confirmadas; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima.
  <!-- specsfy:evidence {"task":"T026","refs":["US-002","FR-003","FR-007","AC-007","AC-020","AC-022"],"files":["src/hooks/resolve.ts","src/setup/run.ts"],"commands":[{"run":"npm run test:tdd -- hooks-graph-update hooks-resolve","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->


**Checkpoint**: um hook sintético com `context="x"` executado com JSON de `ctx_execute` shell expõe `HOOK_TOOL`, `HOOK_COMMAND` e emite o JSON de contexto.

#### Fase 3 — US-001 Guards em qualquer ferramenta de shell (P1)

**Objetivo**: os três guards com `tools:` ampliado, mesmo veredito em qualquer shell.
**Teste independente**: `npm run test:tdd -- hooks-any-shell-guards` verde.

- [x] T027 [CODE] [US-001] Ampliar tools: em resources/hooks/guard-destructive.md, guard-secrets.md e protect-authorship.md — Refs: US-001, FR-002, FR-006, NFR-002, AC-001, AC-002, AC-004, AC-005, AC-006 — Depends: T001, T002, T004, T005, T006, T025
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes: 1746 nós / 14061 arestas / 322 arquivos; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `tools: Bash|mcp__.*(execute|run_in_terminal|shell).*` nos três guards; `guard-secrets` passou a aceitar `;&|` como fronteira após `.env`/`.pem` para cobrir lotes (achado do AC-004).
  - [x] **VERIFY**: `npm run test:tdd -- hooks-any-shell-guards hooks-blocking hooks-permissive` → GREEN; `npx tsc --noEmit` limpo; grafo após: 1750 nós / 14093 arestas / 322 arquivos, `detect-changes --base HEAD` → 64 arquivos, 94 funções, risco 0,65, 0 fluxos afetados (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, hooks e configuração.
  - [x] **EVIDENCE**: GREEN e delta do grafo registrados nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `.specsfy/RULES.md` com as três regras confirmadas; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Fronteira `;&|` acrescentada ao guard-secrets — sem ela o lote do AC-004 passava.
  <!-- specsfy:evidence {"task":"T027","refs":["US-001","FR-002","FR-006","NFR-002","AC-001","AC-002","AC-004","AC-005","AC-006"],"files":["resources/hooks/guard-destructive.md","resources/hooks/guard-secrets.md","resources/hooks/protect-authorship.md"],"commands":[{"run":"npm run test:tdd -- hooks-any-shell-guards hooks-blocking hooks-permissive","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->


**Checkpoint**: `.maestro/hooks/protect-authorship.sh` com JSON de `run_in_terminal` contendo trailer de agente → exit 2.

#### Fase 4 — US-005 Proteção contra o build destrutivo do documentator (P1)

**Objetivo**: `guard-docs` bloqueando `build_documentation.mjs` sem `--check`.
**Teste independente**: `npm run test:tdd -- hooks-guard-docs` verde.

- [x] T028 [CODE] [US-005] Criar resources/hooks/guard-docs.md — Refs: US-005, FR-008, FR-002, NFR-002, AC-017, AC-018, AC-019 — Depends: T017, T018, T019, T027
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes: 1746 nós / 14061 arestas / 322 arquivos; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `resources/hooks/guard-docs.md` criado (before-tool, blocking, tools dos guards) bloqueando `build_documentation.mjs` sem `--check` salvo prefixo `MAESTRO_ALLOW_DOCS_BUILD=1`.
  - [x] **VERIFY**: `npm run test:tdd -- hooks-guard-docs hooks-corpus` → GREEN; `npx tsc --noEmit` limpo; grafo após: 1750 nós / 14093 arestas / 322 arquivos, `detect-changes --base HEAD` → 64 arquivos, 94 funções, risco 0,65, 0 fluxos afetados (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, hooks e configuração.
  - [x] **EVIDENCE**: GREEN e delta do grafo registrados nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `.specsfy/RULES.md` com as três regras confirmadas; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima.
  <!-- specsfy:evidence {"task":"T028","refs":["US-005","FR-008","FR-002","NFR-002","AC-017","AC-018","AC-019"],"files":["resources/hooks/guard-docs.md"],"commands":[{"run":"npm run test:tdd -- hooks-guard-docs hooks-corpus","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->


**Checkpoint**: comando com o script sem `--check` bloqueado; com `--check` ou com a variável, permitido.

#### Fase 5 — US-002 Grafo sempre atualizado sem gastar contexto (P1)

**Objetivo**: `code-review-graph-update` amplo com detecção de mudança, `code-review-graph-stop`, `.maestro/state/`.
**Teste independente**: `npm run test:tdd -- hooks-graph-update setup-state-dir` verde.

- [x] T029 [CODE] [US-002] Criar ensureStateDir em src/setup/run.ts e garantir .gitignore — Refs: US-002, FR-007, NFR-001, NFR-003, AC-021, AC-022 — Depends: T021, T022, T026
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes: 1746 nós / 14061 arestas / 322 arquivos; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `ensureStateDir(root)` em `run.ts` cria `.maestro/state/` e a linha única em `.gitignore`, chamada nos dois caminhos de escrita; `STATE_DIR` exportado.
  - [x] **VERIFY**: `npm run test:tdd -- setup-state-dir setup-idempotent` → GREEN; `npx tsc --noEmit` limpo; grafo após: 1750 nós / 14093 arestas / 322 arquivos, `detect-changes --base HEAD` → 64 arquivos, 94 funções, risco 0,65, 0 fluxos afetados (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, hooks e configuração.
  - [x] **EVIDENCE**: GREEN e delta do grafo registrados nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `.specsfy/RULES.md` com as três regras confirmadas; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima.
  <!-- specsfy:evidence {"task":"T029","refs":["US-002","FR-007","NFR-001","NFR-003","AC-021","AC-022"],"files":["src/setup/run.ts"],"commands":[{"run":"npm run test:tdd -- setup-state-dir setup-idempotent","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T030 [CODE] [US-002] Reescrever resources/hooks/code-review-graph-update.md como script e criar code-review-graph-stop.md — Refs: US-002, FR-003, FR-007, NFR-001, AC-007, AC-008, AC-009, AC-010, AC-020, AC-022, AC-024 — Depends: T007, T008, T009, T010, T020, T022, T024, T026, T029
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes: 1746 nós / 14061 arestas / 322 arquivos; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `code-review-graph-update.md` reescrito como script (after-tool, tools amplo) com hash de `git status --porcelain -- . ':(exclude).maestro' ':(exclude).code-review-graph'` (sha256sum/shasum) e execução silenciosa via `MAESTRO_BIN_code_review_graph` ou `command -v`; `code-review-graph-stop.md` com o mesmo fragmento em `stop`. Achado: sem excluir `.maestro/` e `.code-review-graph/` o próprio hook mudava o hash e rodava duas vezes.
  - [x] **VERIFY**: `npm run test:tdd -- hooks-graph-update hooks-corpus setup-dependency-resolution` → GREEN; `npx tsc --noEmit` limpo; grafo após: 1750 nós / 14093 arestas / 322 arquivos, `detect-changes --base HEAD` → 64 arquivos, 94 funções, risco 0,65, 0 fluxos afetados (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, hooks e configuração.
  - [x] **EVIDENCE**: GREEN e delta do grafo registrados nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `.specsfy/RULES.md` com as três regras confirmadas; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Exclusão de `.maestro/` e `.code-review-graph/` do hash — evita a dupla execução detectada no GREEN.
  <!-- specsfy:evidence {"task":"T030","refs":["US-002","FR-003","FR-007","NFR-001","AC-007","AC-008","AC-009","AC-010","AC-020","AC-022","AC-024"],"files":["resources/hooks/code-review-graph-update.md","resources/hooks/code-review-graph-stop.md"],"commands":[{"run":"npm run test:tdd -- hooks-graph-update hooks-corpus setup-dependency-resolution","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->


**Checkpoint**: `sed -i` via `Bash` seguido do hook invoca o binário de teste uma vez; a chamada seguinte, não.

#### Fase 6 — US-003 Dica única do grafo em pesquisa (P2)

**Objetivo**: `graph-hint` uma vez por sessão, só com grafo.
**Teste independente**: `npm run test:tdd -- hooks-graph-hint` verde.

- [x] T031 [CODE] [US-003] Criar resources/hooks/graph-hint.md — Refs: US-003, FR-004, FR-007, NFR-001, AC-011, AC-012, AC-013, AC-022 — Depends: T011, T012, T013, T022, T025, T029
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes: 1746 nós / 14061 arestas / 322 arquivos; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `graph-hint.md` (before-tool, tools `Grep|Glob`) emite `context` uma vez por `session_id` com marca em `.maestro/state/`; sem grafo, silêncio; estado não gravável só repete a dica.
  - [x] **VERIFY**: `npm run test:tdd -- hooks-graph-hint hooks-corpus` → GREEN; `npx tsc --noEmit` limpo; grafo após: 1750 nós / 14093 arestas / 322 arquivos, `detect-changes --base HEAD` → 64 arquivos, 94 funções, risco 0,65, 0 fluxos afetados (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, hooks e configuração.
  - [x] **EVIDENCE**: GREEN e delta do grafo registrados nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `.specsfy/RULES.md` com as três regras confirmadas; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima.
  <!-- specsfy:evidence {"task":"T031","refs":["US-003","FR-004","FR-007","NFR-001","AC-011","AC-012","AC-013","AC-022"],"files":["resources/hooks/graph-hint.md"],"commands":[{"run":"npm run test:tdd -- hooks-graph-hint hooks-corpus","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->


**Checkpoint**: dois eventos `Grep` com o mesmo `session_id` → um JSON, depois silêncio.

#### Fase 7 — US-004 Regras só como fallback, sem overlap (P2)

**Objetivo**: bloco `hooks-fallback` com ≤3 regras condicionais ao doctor.
**Teste independente**: `npm run test:tdd -- hooks-fallback-block` verde.

- [x] T032 [CODE] [US-004] Criar buildHooksFallbackBlock/Pointer em src/extensions/router.ts e instalar em src/setup/run.ts — Refs: US-004, FR-005, NFR-003, AC-014, AC-015, AC-016 — Depends: T014, T015, T016, T029
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes: 1746 nós / 14061 arestas / 322 arquivos; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `buildHooksFallbackBlock()`/`buildHooksFallbackPointer()` com três itens condicionados a `maestro doctor`; instalados como `hooks-fallback`/`hooks-fallback-pointer` (Claude Code) e `agents-hooks-fallback` (Antigravity) via `createExtension`.
  - [x] **VERIFY**: `npm run test:tdd -- hooks-fallback-block extensions-router-claude-md setup-antigravity` → GREEN; `npx tsc --noEmit` limpo; grafo após: 1750 nós / 14093 arestas / 322 arquivos, `detect-changes --base HEAD` → 64 arquivos, 94 funções, risco 0,65, 0 fluxos afetados (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, hooks e configuração.
  - [x] **EVIDENCE**: GREEN e delta do grafo registrados nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `.specsfy/RULES.md` com as três regras confirmadas; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Cada item do bloco passou a carregar a condição `maestro doctor` explicitamente (AC-014 reprovava o texto com a condição só no cabeçalho).
  <!-- specsfy:evidence {"task":"T032","refs":["US-004","FR-005","NFR-003","AC-014","AC-015","AC-016"],"files":["src/extensions/router.ts","src/setup/run.ts","src/targets/claude-code.ts","src/targets/antigravity.ts"],"commands":[{"run":"npm run test:tdd -- hooks-fallback-block extensions-router-claude-md setup-antigravity","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->


**Checkpoint**: dois `runSetup` deixam um único bloco `hooks-fallback` e o router intacto.

#### Fase final — Qualidade

- [x] T033 [TEST] Executar regressão completa e rastreabilidade via node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs — Refs: US-001, US-002, US-003, US-004, US-005, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018, AC-019, AC-020, AC-021, AC-022, AC-023, AC-024 — Depends: T027, T028, T030, T031, T032
  - [x] **PREP**: Suítes: `npm run test:tdd` (590 casos), `npx tsc --noEmit`, `check_traceability.mjs --full-chain`; testes antigos adaptados: `hooks-matcher` (matcher dos guards por regex), `hooks-raw-command` (hook de despacho sintético), `setup-dependency-resolution` (script com `command -v`), `hooks-corpus` (8 hooks).
  - [x] **EXECUTE**: `npm run test:tdd` → 578/590 antes do registro manual e 579/590 após (as 11 falhas são o RED da SPEC-0021, `Planned`); `tsc` limpo; `npm version patch` → 2.1.24; `npm run build` OK; `echo '{"approved": true}' | node dist/cli.js setup --target claude-code` → `22 hooks installed`, 8 scripts em `.maestro/hooks/`, bloco `maestro: hooks fallback` em `CLAUDE.md` + ponteiro em `AGENTS.md`, `.maestro/state/` no `.gitignore`. Verificação manual AC-006 executada e registrada na seção 11 (subagente bloqueado pelo `guard-secrets`).
  - [x] **VERIFY**: Zero regressão em teste que passava; 40/40 IDs cobertos; hooks novos presentes em `.claude/settings.json` deste repositório (matchers conferidos).
  - [x] **VISUAL**: Não aplicável — sem interface em nenhuma tarefa desta spec.
  - [x] **EVIDENCE**: Comandos e contagens acima (2026-09-17); seções 11–12 com GREEN/Passed.
  - [x] **IMPROVE**: Retrospectiva: três achados só apareceram no GREEN (fronteira do guard-secrets, hash contaminado pelo próprio hook, condição do doctor por item) — todos capturados pelos casos RED, que provaram valor.

- [x] T034 [DOC] Revisar PROJECT.md, docs/integrations.md e arquivar findings internos — Refs: US-001, US-002, US-003, US-004, US-005 — Depends: T033
  - [x] **PREP**: Lidos `PROJECT.md`, `docs/integrations.md`, `findings/internal/FIND-INT-001` e `FIND-INT-002`.
  - [x] **EXECUTE**: `PROJECT.md` (parágrafo *Hooks resistentes a qualquer ferramenta*) e `docs/integrations.md` (§3) atualizados fora do bloco documentator; blocos mecânicos regenerados com `MAESTRO_ALLOW_DOCS_BUILD=1` (conteúdo rico intacto, diff conferido) e `--check` verde; FIND-INT-001 e FIND-INT-002 movidos para `findings/archived/` com o fix; `.specsfy/RULES.md` com três regras confirmadas (hook primeiro; grafo antes/depois; documentator só com --check); `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **VERIFY**: `monitor_context.mjs --project . --check` → `CURRENT`; `build_documentation.mjs --check` → exit 0 (2026-09-17).
  - [x] **VISUAL**: Não aplicável — documentação textual.
  - [x] **EVIDENCE**: Arquivos revisados e findings arquivados conforme EXECUTE.
  - [x] **IMPROVE**: Aprendizado: o bloco mecânico depende de contagens de arquivos, então qualquer arquivo novo o torna 'desatualizado'; a regeneração com o escape explícito passa a fazer parte do fechamento de cada spec.

### 15. Ordem de execução

- Caminho crítico: T001–T024 (RED) → T025 → T026 → T027 → T028 → T029 → T030 → T031 → T032 → T033 → T034.
- Tarefas paralelas: na Fase 1, grupos por arquivo de teste são disjuntos (`hooks-any-shell-guards` T001–T006, `hooks-graph-update` T007–T010/T020/T024, `hooks-graph-hint` T011–T013, `hooks-fallback-block` T014–T016, `hooks-guard-docs` T017–T019, `setup-state-dir` T021–T022, `hooks-wrapper-context` T023); após T025, T027 e T028 (guards e guard-docs) podem avançar em paralelo a T026/T029; T031 e T032 em paralelo após T029.
- Estratégia de MVP: T025 + T027 + T028 (guards em qualquer shell e `guard-docs`) fecham os dois buracos de segurança; o restante completa grafo, dica e regras.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- SPEC-0022 (Complete): `tools:`, scripts em arquivo, wrapper.
- BACKLOG-0013 consome a cobertura definida aqui.

#### Riscos

- Latência do `PostToolUse` amplo → mitigada por `git status --porcelain` + hash; medida em AC-024.
- Regex de ferramentas casar demais → limitado a `execute|run_in_terminal|shell`; playwright excluído (AC-005).
- Contrato de `additionalContext` mudar no Claude Code → isolado no `POSTAMBLE`, um único ponto.
- Subagentes ignorarem hooks de projeto → só a verificação manual (AC-006) confirma; se falhar, vira finding externo.

#### Suposições

- `git` disponível no `PATH` do hook; sem git, o hook executa sempre.
- `session_id` presente em cada evento (observado).
- O bloco `hooks-fallback` segue a direção de instruções vigente (conteúdo em `CLAUDE.md`, ponteiro em `AGENTS.md`) até a BACKLOG-0012 inverter — a inversão migra este bloco junto com os demais.

### 17. Decisões

- **DEC-001**: Extração por ferramenta no preâmbulo, não em cada guard — um ponto único para `command`/`code`/`commands[]`; alternativa de duplicar por hook multiplicaria bugs.
- **DEC-002**: Detecção de edição por hash do working tree, não por nome de ferramenta — única forma de cobrir `Bash`/MCP (R-003); `Stop` como rede final.
- **DEC-003**: Dica única por sessão via `session_id` e arquivo de marca — contexto zero no caminho feliz; alternativa por prompt inflaria a cada mensagem.
- **DEC-004**: `guard-docs` bloqueia sem `--check` com escape explícito `MAESTRO_ALLOW_DOCS_BUILD=1` — proteção local enquanto FIND-EXT-001 não é corrigido upstream; alternativa de detectar "conteúdo rico" em shell seria frágil.
- **DEC-005**: Regras-fallback em bloco anchorado próprio (`hooks-fallback`), no máximo três, condicionais ao doctor — cumpre "sem overlap" e respeita a recusa de nome já registrado do `createExtension`.
- **DEC-006**: `.maestro/state/` no `.gitignore` do projeto — estado efêmero nunca versionado.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam.
- [x] `PROJECT.md` e `docs/integrations.md` revisados para os hooks novos; `findings/internal/FIND-INT-001` e `FIND-INT-002` arquivados; `.specsfy/STACK.md`/`DATABASE.md` sem impacto.
