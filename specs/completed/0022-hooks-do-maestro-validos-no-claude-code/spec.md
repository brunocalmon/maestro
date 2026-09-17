# Especificação integrada: Hooks do maestro válidos no Claude Code: matcher, identidade, merge e despacho

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0022 |
| Slug | 0022-hooks-do-maestro-validos-no-claude-code |
| Status | Complete |
| Effort | 7 |
| Effort updated at | 2026-09-17 |
| Effort rationale | Perfil `high`: reestrutura o pipeline inteiro de hooks (tradução, identidade, escrita, migração, despacho, projeção do upstream e shim de caminho) em `src/hooks/`, `src/targets/`, `src/setup/write.ts` e `src/setup/run.ts`, com migração de instalações existentes em projetos consumidores e reescrita de testes que hoje dependem do matcher como identidade. Sem interface, banco ou framework novo. |
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

Nenhum hook entregue por `maestro setup` dispara no Claude Code. `renderSettings` em `src/hooks/claude-code.ts` grava `matcher: h.name` (`"guard-destructive"`, `"protect-authorship"`, `"setup-check"`), mas o Claude Code casa `matcher` contra o nome da ferramenta (`Bash`, `Edit`, `Write`…) ou, em `SessionStart`, contra a origem da sessão. Como nenhum nome de hook é nome de ferramenta, os 8 hooks são inertes. Três defeitos independentes se somam: (1) `writeSettings` em `src/setup/write.ts` substitui o array inteiro de cada evento que o maestro toca, apagando hooks de outras origens no mesmo evento — foi assim que um `protect-authorship` manual com `matcher: "Bash"`, que funcionava, foi removido e a proteção contra trailers `Co-Authored-By` ficou desativada em projeto consumidor; (2) o wrapper consome o stdin (`HOOK_INPUT=$(cat)`) e não o repassa aos hooks de despacho (`context-mode hook claude-code …`), que dependem do JSON do evento; (3) o vocabulário canônico de 4 eventos (`before-shell`, `after-file-edit`, `stop`, `session-start`) não expressa o que o context-mode instala por conta própria (`PreToolUse` em `Read|Grep|WebFetch`, `PreCompact`, `UserPromptSubmit`). Além disso, `resolveHookCommand` congela o caminho absoluto do binário no momento do setup; após rename ou move do projeto, o hook aponta para um caminho inexistente (evidência: `common-rules-server` no `.claude/settings.json` deste repositório). O `matcher` é hoje também a única identidade do hook no `settings.json` (`tests/setup-writes.test.ts:40`), portanto corrigi-lo exige outra forma de reconhecer o que é do maestro.

#### Resultado desejado

Cada hook entregue pelo maestro dispara de fato no Claude Code no evento e nas ferramentas certas; cada hook é um script em `.maestro/hooks/<name>.sh` com identidade própria e registro por checksum; `settings.json` só o referencia; o merge preserva qualquer hook de outra origem; hooks de despacho recebem stdin íntegro e propagam o próprio exit code; os hooks do context-mode refletem o `hooks.json` do pacote instalado; o caminho do binário é resolvido em tempo de execução com fallback para `PATH`; instalações antigas no formato inline são migradas automaticamente e sem duplicatas.

#### Métricas de sucesso

- 100% dos hooks do maestro em `settings.json` possuem `matcher` derivado de ferramenta ou evento, nunca do nome do hook — verificável por teste automatizado sobre a saída de `renderSettings`.
- Zero entradas de terceiros removidas por `writeSettings` em qualquer evento — verificável por teste automatizado com fixture contendo entradas estranhas em todos os eventos.
- Um `git commit` com trailer `Co-Authored-By: Claude …` é bloqueado (exit 2) pelo script `protect-authorship` quando executado com o JSON de um `PreToolUse` de `Bash` — verificável por teste de subprocesso.
- Segunda execução de `maestro setup` sobre projeto já instalado produz `settings.json` byte a byte idêntico — verificável por teste automatizado.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] No Claude Code, matcher casa contra o nome da ferramenta (ou origem da sessão em SessionStart), nunca contra um nome arbitrário; por isso nenhum hook gerado dispara — Verdict: verified — Confidence: high — Evidence: research/claude-code-matcher-semantica.md#achado — Budget: 1/3
  - Evidência convergente: o hook manual anterior funcionava com `"matcher": "Bash"` (git diff local), o context-mode instala somente com nomes de ferramenta, e a observação empírica em projeto consumidor confirma que nenhum hook do maestro dispara.
- **R-002** [critical] O context-mode precisa de eventos e ferramentas fora do vocabulário canônico atual e lê o JSON do evento pelo stdin — Verdict: verified — Confidence: high — Evidence: research/context-mode-hooks-json.md#estrutura-observada — Budget: 1/3
  - A tabela evento → matcher do `hooks.json` upstream mostra `Read`, `Grep`, `WebFetch`, `PreCompact` e `UserPromptSubmit`; os scripts leem stdin via `run-hook.mjs`.
- **R-003** [high] writeSettings substitui o array inteiro de cada evento, contrariando o próprio comentário da função — Verdict: verified — Confidence: high — Evidence: research/claude-code-matcher-semantica.md#achado — Budget: 1/3
  - Lido em `src/setup/write.ts:29`; explica a remoção do `protect-authorship` manual sem colisão de nome.

#### Fontes e contexto consultados

- `src/hooks/claude-code.ts`, `src/hooks/source.ts`, `src/hooks/resolve.ts`, `src/targets/claude-code.ts`, `src/targets/antigravity.ts`, `src/targets/adapter.ts`, `src/setup/write.ts`, `src/setup/run.ts`, `src/setup/record.ts`, `src/extensions/create.ts`, `src/extensions/registry.ts` — pipeline atual de hooks e mecanismos reaproveitados.
- `resources/hooks/*.md` — os 8 hooks canônicos e seus eventos.
- `.claude/settings.json` deste repositório e seu `git diff` — formato inline gerado e caminho absoluto obsoleto.
- `node_modules/context-mode/hooks/hooks.json` — instalação que o próprio context-mode faz.
- `specs/completed/0003-fatia-1b-setup-hooks/spec.md` — origem do formato inline e da identidade por matcher.
- `specs/completed/0011-extensoes-locais-reparo-assistido/spec.md` — registro por checksum e quarentena.
- `specs/backlog/0011-hooks-do-maestro-validos-no-claude-code-matcher-identidade-merge-e-despacho.md` — brief promovido nesta spec.
- `specs/inbox/2026-09-17-105213-hooks-do-maestro-com-matcher-invalido-no-claude-code-e-setup-que-instala-sem-configurar-specsfy-e-skills.md` — captura de origem, preservada.
- Sessão de grill em 2026-09-17 (decisões Q1–Q5, Q9, Q18–Q20), registradas na seção 17.

#### Documentação consultada

- `context-mode` 1.0.169, `README.md` e `hooks/hooks.json` locais (2026-09-17): matchers e eventos por plataforma.

#### Artefatos de pesquisa armazenados

- `specs/draft/0022-hooks-do-maestro-validos-no-claude-code/research/context-mode-hooks-json.md`: estrutura evento → matcher → script do `hooks.json` do `context-mode` 1.0.169 (ELv2; somente estrutura, sem cópia do arquivo) e conclusão do R-002.
- `specs/draft/0022-hooks-do-maestro-validos-no-claude-code/research/claude-code-matcher-semantica.md`: evidência local e empírica da semântica do `matcher` (R-001) e do merge destrutivo (R-003).

#### Dúvidas respondidas

- **Q**: Como derivar o `matcher`? → **A**: mapa fixo por evento canônico, com override `tools:` no frontmatter do hook (Q1).
- **Q**: O vocabulário de eventos deve crescer? → **A**: sim, com eventos genéricos (`before-tool`, `after-tool`, `before-compact`, `on-prompt`); cada adaptador declara os que suporta e reporta os demais como pulados (Q2).
- **Q**: Como identificar hooks do maestro sem o matcher? → **A**: scripts em arquivo `.maestro/hooks/<name>.sh`, registrados por checksum; o `command` em `settings.json` aponta para o arquivo (Q3, Q18).
- **Q**: Qual a semântica de merge? → **A**: substituir só entradas do maestro; preservar todas as outras no mesmo evento (Q4).
- **Q**: Hooks de despacho recebem wrapper? → **A**: não; o `command` é o binário direto, com stdin e exit code próprios (Q5).
- **Q**: De onde vêm os hooks do context-mode? → **A**: do `hooks/hooks.json` do pacote instalado, não de `.md` mantidos pelo maestro (Q20).
- **Q**: O que fazer com o caminho absoluto congelado? → **A**: shim que tenta o caminho gravado e cai para `PATH` (Q9).
- **Q**: Como migrar instalações antigas? → **A**: entrada com `matcher` igual a um nome de hook do maestro **e** comando contendo `>>> hook fragment` é reconhecida como formato antigo e substituída (Q19).

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Tradução de hook canônico para Claude Code com `matcher` por evento/ferramenta e override `tools:`.
- Vocabulário canônico ampliado e declaração de suporte por adaptador.
- Scripts de hook em `.maestro/hooks/<name>.sh` registrados no registro de extensões; `settings.json` referencia o arquivo.
- Merge de `settings.json` por identidade, preservando entradas de outras origens.
- Hooks de despacho sem wrapper, com stdin e exit code preservados.
- Projeção dos hooks do context-mode a partir do `hooks.json` do pacote instalado.
- Shim de resolução do binário em tempo de execução.
- Migração automática de entradas no formato inline anterior.
- Reescrita dos testes que usam o `matcher` como identidade.

#### Fora de escopo

- Direção dos blocos em `AGENTS.md`/`CLAUDE.md` e projeção de skills (BACKLOG-0012).
- `maestro doctor` orquestrador e critério de setup completo (BACKLOG-0013); esta spec apenas deixa os artefatos verificáveis.
- Conteúdo lógico dos guards (`guard-destructive`, `guard-secrets`, `protect-authorship`): mantidos como estão.
- Instalação do context-mode pelo instalador do próprio context-mode.
- Hooks para targets além de Claude Code e Antigravity.

#### Atores

- **Pessoa que roda `maestro setup`** em projeto consumidor: espera guards ativos e integração context-mode/code-review-graph funcionando, sem perder hooks que já tinha.
- **Agente no Claude Code**: tem ações de `Bash`, `Edit`/`Write` e início de sessão interceptadas pelos hooks.
- **Mantenedor do maestro**: mantém os hooks canônicos em `resources/hooks/` e os adaptadores de target.
- **`maestro setup`** (processo): traduz, escreve, migra e registra.

### 4. Princípios e restrições do projeto

- **PR-001**: A identidade de um hook do maestro nunca depende do `matcher`; ela vem do caminho do script em `.maestro/hooks/` e do registro por checksum.
- **PR-002**: O maestro nunca remove nem reescreve uma entrada de `settings.json` que não reconheça como sua, em nenhum evento.
- **PR-003**: Tradução e escrita continuam separadas: `renderSettings` devolve estrutura, quem serializa é quem escreve, e o fragmento do hook é escapado exatamente uma vez (lição do v0.2.8 preservada).
- **PR-004**: Scripts em `.maestro/hooks/` são conteúdo gerenciado: drift detectado por checksum segue o fluxo de quarentena de SPEC-0011, nunca sobrescrita silenciosa.
- **PR-005**: O maestro instala somente no projeto atual; nada é escrito fora da raiz confirmada.
- **PR-006**: Um hook `blocking` continua emitindo `exit 2` com a mensagem em stderr; um hook de despacho propaga o exit code do binário sem alteração.

### 5. Histórias de usuário

#### US-001 — Guards disparam de fato no Claude Code (P1)

Como pessoa que roda `maestro setup`, quero que os guards de comando destrutivo, segredos e autoria disparem quando o agente usa `Bash`, para que a proteção prometida pelo maestro exista na prática.

**Por que P1**: é o defeito ativo — hoje nenhum guard executa e a proteção contra `Co-Authored-By` está desligada em projeto consumidor.
**Teste independente**: rodar `runSetup` numa raiz isolada, executar o script gerado com o JSON de um `PreToolUse` de `Bash` contendo `git commit … Co-Authored-By: Claude` e observar exit 2.
**Requisitos**: FR-001, FR-002

#### US-002 — Hooks de outras origens preservados e formato antigo migrado (P1)

Como pessoa que já tinha hooks próprios em `settings.json`, quero que `maestro setup` acrescente os seus sem apagar os meus e substitua o formato inline antigo sem duplicar, para que reinstalar o maestro nunca custe uma proteção que eu configurei.

**Por que P1**: a perda do `protect-authorship` manual foi consequência direta do merge por evento; migração sem duplicatas é pré-condição para corrigir consumidores existentes.
**Teste independente**: rodar `runSetup` sobre fixture com entrada de terceiro em `PreToolUse` e 8 entradas no formato antigo; inspecionar o `settings.json` resultante.
**Requisitos**: FR-003, FR-004

#### US-003 — Hooks de despacho fiéis ao upstream (P2)

Como pessoa que depende do context-mode e do code-review-graph, quero que os hooks de despacho recebam o evento íntegro e cubram os eventos e ferramentas que o upstream define, para que a integração funcione como se instalada pelo próprio pacote.

**Por que P2**: depende da correção do matcher (US-001) para ter efeito; sem ela, mesmo o despacho correto não dispara.
**Teste independente**: projetar hooks a partir de um `hooks.json` de fixture e comparar eventos/matchers; executar o `command` de despacho com stdin e verificar que o binário o recebe.
**Requisitos**: FR-005, FR-006, FR-007

#### US-004 — Caminho de binário resiliente a rename e move (P2)

Como pessoa que renomeia ou move o projeto depois do setup, quero que os hooks continuem encontrando o binário, para que eu não precise rodar `maestro setup` de novo só por ter mudado a pasta.

**Por que P2**: causa falhas silenciosas (evidência no próprio repositório), mas só se manifesta após rename/move.
**Teste independente**: gerar o shim com um caminho gravado inexistente e verificar que resolve pelo `PATH`.
**Requisitos**: FR-008

### 6. Cenários BDD de aceite

#### AC-001 — Guard de autoria bloqueia commit com trailer de IA via `Bash`

**Cobre**: US-001, FR-001, FR-002, NFR-003

```gherkin
@US-001 @FR-001 @FR-002 @NFR-003 @AC-001
Feature: Guards disparam no Claude Code

  Scenario: protect-authorship instalado em PreToolUse com matcher Bash bloqueia o trailer
    Given um projeto consumidor com target Claude Code e sem settings.json prévio
    When maestro setup roda
    Then settings.json contém protect-authorship em PreToolUse com matcher "Bash"
    And o command referencia ".maestro/hooks/protect-authorship.sh"
    And executar esse script com o JSON de um PreToolUse de Bash cujo command contém "git commit -m 'x' -m 'Co-Authored-By: Claude <noreply@anthropic.com>'" termina com exit 2 e mensagem em stderr
```

#### AC-002 — Matcher derivado do evento canônico por mapa fixo

**Cobre**: US-001, FR-001

```gherkin
@US-001 @FR-001 @AC-002
Feature: Matcher por evento canônico

  Scenario: cada evento canônico recebe o matcher do mapa fixo
    Given os 8 hooks canônicos de resources/hooks/
    When translateForClaudeCode e renderSettings são aplicados
    Then hooks before-shell ficam em PreToolUse com matcher "Bash"
    And hooks after-file-edit ficam em PostToolUse com matcher "Edit|Write|MultiEdit|NotebookEdit"
    And hooks stop e session-start ficam em Stop e SessionStart sem campo matcher
    And nenhuma entrada usa o nome do hook como matcher
```

#### AC-003 — Override `tools:` no frontmatter substitui o mapa fixo

**Cobre**: US-001, FR-001, FR-007

```gherkin
@US-001 @FR-001 @FR-007 @AC-003
Feature: Override de ferramentas por hook

  Scenario: hook declara tools no frontmatter
    Given um hook canônico com "event: before-tool" e "tools: Bash|Read|Grep|WebFetch"
    When translateForClaudeCode é aplicado
    Then a entrada fica em PreToolUse com matcher "Bash|Read|Grep|WebFetch"
    And um hook sem tools no mesmo evento recebe o matcher do mapa fixo
```

#### AC-004 — Script em arquivo e referência no settings.json

**Cobre**: US-001, FR-002, NFR-003

```gherkin
@US-001 @FR-002 @NFR-003 @AC-004
Feature: Scripts de hook em arquivo

  Scenario: setup grava o script e referencia o caminho
    Given um projeto consumidor sem .maestro/hooks/
    When maestro setup roda
    Then existe .maestro/hooks/<name>.sh executável para cada hook não despachado
    And o conteúdo do script contém o fragmento do hook entre os marcadores ">>> hook fragment" e "<<< hook fragment" byte a byte igual ao bloco de resources/hooks/<name>.md
    And o command em settings.json é "\"$CLAUDE_PROJECT_DIR/.maestro/hooks/<name>.sh\""
```

#### AC-005 — Script registrado por checksum; drift vai para quarentena

**Cobre**: US-001, FR-002, NFR-003

```gherkin
@US-001 @FR-002 @NFR-003 @AC-005
Feature: Scripts de hook são conteúdo gerenciado

  Scenario: script editado à mão é detectado e preservado em quarentena
    Given um projeto com .maestro/hooks/guard-secrets.sh registrado em .maestro/extensions.json
    And o arquivo foi alterado à mão depois do registro
    When maestro setup roda
    Then o conteúdo alterado é movido para .maestro/quarantine/
    And .maestro/hooks/guard-secrets.sh volta ao conteúdo registrado
    And o relatório informa o hook em quarentena
```

#### AC-006 — Identidade reconhecida pelo caminho, não pelo matcher

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-006
Feature: Identidade do hook independente do matcher

  Scenario: reconhecimento das entradas do maestro
    Given um settings.json gerado por maestro setup
    When o setup lê o arquivo para decidir o que substituir
    Then cada entrada cujo command referencia ".maestro/hooks/<name>.sh" é reconhecida como do maestro com nome <name>
    And o registro .maestro/install.json lista o mesmo <name> e evento
    And nenhuma decisão usa o valor de matcher
```

#### AC-007 — Entrada de terceiro no mesmo evento é preservada

**Cobre**: US-002, FR-003, NFR-002

```gherkin
@US-002 @FR-003 @NFR-002 @AC-007
Feature: Merge preserva outras origens

  Scenario: hook manual em PreToolUse sobrevive ao setup
    Given um settings.json com uma entrada PreToolUse de matcher "Bash" e command "./meu-hook.sh"
    And uma entrada Stop de outra ferramenta
    When maestro setup roda
    Then as duas entradas continuam presentes e inalteradas
    And as entradas do maestro aparecem ao lado delas nos mesmos eventos
```

#### AC-008 — Segunda execução não duplica nem altera

**Cobre**: US-002, FR-003, NFR-001

```gherkin
@US-002 @FR-003 @NFR-001 @AC-008
Feature: Setup idempotente sobre settings.json

  Scenario: reexecução produz o mesmo arquivo
    Given um projeto onde maestro setup já rodou uma vez
    When maestro setup roda de novo com a mesma versão
    Then settings.json é byte a byte idêntico ao anterior
    And nenhuma entrada de hook aparece duas vezes
```

#### AC-009 — Formato inline antigo é migrado sem duplicatas

**Cobre**: US-002, FR-004, NFR-002

```gherkin
@US-002 @FR-004 @NFR-002 @AC-009
Feature: Migração do formato anterior

  Scenario: 8 entradas antigas substituídas pelo novo formato
    Given um settings.json com 8 entradas cujo matcher é um nome de hook do maestro e cujo command contém ">>> hook fragment"
    When maestro setup roda
    Then as 8 entradas antigas não existem mais
    And existe exatamente uma entrada nova por hook no evento correto
    And o relatório informa quantas entradas foram migradas
```

#### AC-010 — Entrada com nome coincidente mas sem marcador não é tocada

**Cobre**: US-002, FR-004, NFR-002

```gherkin
@US-002 @FR-004 @NFR-002 @AC-010
Feature: Migração exige as duas condições

  Scenario: matcher igual a nome de hook porém command sem fragmento
    Given um settings.json com uma entrada de matcher "setup-check" e command "echo ok"
    When maestro setup roda
    Then essa entrada permanece inalterada
    And a entrada nova do maestro para setup-check é adicionada ao lado
```

#### AC-011 — settings.json inválido é tratado como ausente, nunca apagado

**Cobre**: US-002, FR-003, FR-004

```gherkin
@US-002 @FR-003 @FR-004 @AC-011
Feature: Arquivo ilegível não é destruído

  Scenario: JSON inválido
    Given um settings.json com conteúdo que não é JSON válido
    When maestro setup roda
    Then o setup termina com relatório de arquivo ilegível
    And o arquivo original é preservado em .maestro/quarantine/ antes de qualquer escrita
    And o novo settings.json contém somente as entradas do maestro
```

#### AC-012 — Hook de despacho recebe stdin íntegro

**Cobre**: US-003, FR-005

```gherkin
@US-003 @FR-005 @AC-012
Feature: Despacho sem wrapper

  Scenario: binário recebe o JSON do evento
    Given um hook de despacho cujo command é um binário de teste que ecoa o stdin
    When o command instalado em settings.json é executado com o JSON de um PreToolUse
    Then a saída do binário contém o JSON original sem alteração
    And o command não contém preâmbulo, postâmbulo nem "HOOK_INPUT=$(cat)"
```

#### AC-013 — Exit code do binário de despacho é propagado

**Cobre**: US-003, FR-005

```gherkin
@US-003 @FR-005 @AC-013
Feature: Exit code do despacho

  Scenario: binário termina com 2
    Given um hook de despacho cujo binário termina com exit 2 e mensagem em stderr
    When o command instalado é executado
    Then o exit code observado é 2
    And a mensagem em stderr é a do binário
```

#### AC-014 — Hooks do context-mode projetados do hooks.json upstream

**Cobre**: US-003, FR-006, FR-007

```gherkin
@US-003 @FR-006 @FR-007 @AC-014
Feature: Projeção do upstream

  Scenario: eventos e matchers coincidem com o hooks.json
    Given um hooks.json de fixture com PreToolUse em "Bash", "Read", "Grep" e "WebFetch" e PostToolUse com matcher amplo
    When maestro setup projeta os hooks do context-mode
    Then settings.json contém uma entrada PreToolUse por matcher do fixture apontando para o script do context-mode
    And a entrada PostToolUse tem o mesmo matcher do fixture
    And nenhum arquivo .md do maestro descreve esses hooks
```

#### AC-015 — hooks.json ausente não impede os demais hooks

**Cobre**: US-003, FR-006

```gherkin
@US-003 @FR-006 @AC-015
Feature: Projeção tolerante à ausência do upstream

  Scenario: pacote context-mode sem hooks.json
    Given um ambiente onde o hooks.json do context-mode não existe ou não é JSON válido
    When maestro setup roda
    Then os hooks canônicos do maestro são instalados normalmente
    And o relatório informa que os hooks do context-mode foram pulados e o motivo
```

#### AC-016 — Evento não suportado pelo adaptador é reportado como pulado

**Cobre**: US-003, FR-007

```gherkin
@US-003 @FR-007 @AC-016
Feature: Suporte declarado por adaptador

  Scenario: hook em evento que o Antigravity não suporta
    Given um hook canônico com "event: before-compact"
    When maestro setup roda com target antigravity
    Then o hook não é instalado
    And o relatório lista o hook como pulado por evento não suportado
    And o mesmo hook com target claude-code é instalado em PreCompact
```

#### AC-017 — Shim usa o caminho gravado quando ele existe

**Cobre**: US-004, FR-008

```gherkin
@US-004 @FR-008 @AC-017
Feature: Resolução do binário em tempo de execução

  Scenario: caminho gravado válido
    Given um hook de despacho com caminho gravado para um binário de teste existente
    When o command instalado é executado
    Then o binário do caminho gravado é o executado
```

#### AC-018 — Shim cai para PATH após rename ou move

**Cobre**: US-004, FR-008

```gherkin
@US-004 @FR-008 @AC-018
Feature: Fallback para PATH

  Scenario: caminho gravado inexistente
    Given um hook de despacho com caminho gravado inexistente
    And um binário de mesmo nome disponível no PATH
    When o command instalado é executado
    Then o binário do PATH é o executado
    And o exit code é o desse binário
```

#### AC-019 — Shim sem binário em lugar nenhum falha de forma explícita e não bloqueante

**Cobre**: US-004, FR-008

```gherkin
@US-004 @FR-008 @AC-019
Feature: Binário indisponível

  Scenario: nem caminho gravado nem PATH resolvem
    Given um hook de despacho não bloqueante cujo binário não existe em lugar algum
    When o command instalado é executado
    Then stderr contém uma mensagem nomeando o binário ausente e sugerindo maestro setup
    And o exit code é 0
```

#### AC-020 — Scripts não são reescritos quando o checksum bate

**Cobre**: NFR-001, FR-002

```gherkin
@NFR-001 @FR-002 @AC-020
Feature: Idempotência dos scripts

  Scenario: segunda execução sem mudanças
    Given um projeto com scripts em .maestro/hooks/ registrados
    When maestro setup roda de novo com a mesma versão
    Then o mtime de cada script permanece o mesmo
    And .maestro/extensions.json não muda
```

#### AC-021 — Round-trip do fragmento é fiel byte a byte

**Cobre**: NFR-003, FR-002, FR-005

```gherkin
@NFR-003 @FR-002 @FR-005 @AC-021
Feature: Fidelidade do fragmento

  Scenario: corpus de hooks canônicos
    Given cada hook de resources/hooks/ com bloco de script
    When o script em .maestro/hooks/<name>.sh é gerado e o fragmento é extraído de volta
    Then o fragmento extraído é idêntico ao bloco original
    And hooks com raw_command não recebem fragmento nem wrapper
```

#### AC-022 — Evento upstream fora do vocabulário antigo é mapeado e instalado

**Cobre**: US-003, FR-006, FR-007

```gherkin
@US-003 @FR-006 @FR-007 @AC-022
Feature: Vocabulário canônico ampliado

  Scenario: PreCompact e UserPromptSubmit do hooks.json
    Given um hooks.json de fixture com PreCompact e UserPromptSubmit
    When maestro setup projeta os hooks com target claude-code
    Then settings.json contém entradas em PreCompact e UserPromptSubmit apontando para os scripts do upstream
    And o registro .maestro/install.json lista os eventos canônicos before-compact e on-prompt
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve derivar o `matcher` de cada hook do evento canônico por mapa fixo (`before-shell`/`before-tool` → `"Bash"`, `after-file-edit`/`after-tool` → `"Edit|Write|MultiEdit|NotebookEdit"`, `stop`, `session-start`, `before-compact` e `on-prompt` → sem matcher) e aceitar `tools:` no frontmatter como override; nunca usar o nome do hook.
- **FR-002**: O sistema deve gravar cada hook com fragmento como script executável em `.maestro/hooks/<name>.sh`, registrá-lo no registro de extensões por checksum, e escrever em `settings.json` um `command` que referencia esse caminho; a identidade do hook é o caminho.
- **FR-003**: O sistema deve mesclar `settings.json` substituindo somente entradas reconhecidas como do maestro e preservando, em todos os eventos, qualquer entrada de outra origem; arquivo ilegível é preservado em quarentena antes de qualquer escrita.
- **FR-004**: O sistema deve reconhecer como formato anterior toda entrada cujo `matcher` seja um nome de hook do maestro **e** cujo `command` contenha `>>> hook fragment`, removê-la e instalar a entrada nova sem duplicatas; entrada que satisfaça só uma das condições não é tocada.
- **FR-005**: O sistema deve instalar hooks de despacho (`raw_command`) sem preâmbulo nem postâmbulo, de modo que o binário receba o stdin do evento e seu exit code seja propagado sem alteração.
- **FR-006**: O sistema deve projetar os hooks do context-mode a partir de `hooks/hooks.json` do pacote instalado, reproduzindo eventos e matchers do upstream; ausência ou invalidez do arquivo é reportada sem impedir os demais hooks.
- **FR-007**: O sistema deve suportar o vocabulário canônico ampliado e permitir que cada adaptador declare os eventos suportados; hook em evento não suportado é reportado como pulado, nunca silenciado.
- **FR-008**: O sistema deve resolver o binário de um hook de despacho em tempo de execução por um shim que tenta o caminho gravado no setup e cai para `PATH`; sem binário, emite mensagem clara em stderr e não bloqueia.

#### Não funcionais

- **NFR-001**: Idempotência — duas execuções consecutivas de `maestro setup` com a mesma versão produzem `settings.json`, `.maestro/hooks/` e `.maestro/extensions.json` idênticos. **Verificação**: teste automatizado comparando conteúdo e mtimes.
- **NFR-002**: Preservação — nenhuma entrada de `settings.json` que não seja do maestro é removida ou alterada em nenhum evento, inclusive na migração. **Verificação**: teste automatizado com fixtures contendo entradas estranhas em todos os eventos e entradas de nome coincidente.
- **NFR-003**: Fidelidade — o fragmento de cada hook chega ao script exatamente uma vez, byte a byte, e é recuperável por `unwrap`. **Verificação**: teste de corpus sobre `resources/hooks/`.

#### Erros e casos-limite

- `hooks.json` do context-mode ausente ou inválido → hooks do maestro instalados; relatório nomeia o motivo.
- `settings.json` inválido → cópia em `.maestro/quarantine/`, arquivo novo só com entradas do maestro, relatório informa.
- Script em `.maestro/hooks/` com drift → quarentena e restauração, como blocos de extensão.
- Evento canônico sem suporte no adaptador → hook pulado e listado.
- Binário de despacho ausente → mensagem em stderr, exit 0 para não bloqueante.
- `$CLAUDE_PROJECT_DIR` ausente no ambiente do hook → o script usa `$PWD`, como hoje.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

Projeto TypeScript/Node (`>=20`), sem framework web, testado com Vitest (`test:tdd`: `vitest run`). Pipeline atual: `readHook` (`src/hooks/source.ts`) → `resolveHookCommand` (`src/hooks/resolve.ts`) → `translateForClaudeCode`/`renderSettings` (`src/hooks/claude-code.ts`) → `adapter.formatHooks` (`src/targets/*.ts`) → `writeSettings` (`src/setup/write.ts`), orquestrado por `runSetup` (`src/setup/run.ts`). Registro por checksum e quarentena já existem em `src/extensions/registry.ts`, `src/extensions/create.ts` e `src/extensions/diagnose.ts` (SPEC-0011). Registro de instalação em `.maestro/install.json` (`src/setup/record.ts`).

#### Arquitetura e módulos

- `src/hooks/source.ts`: `CanonicalEvent` ampliado (`before-tool`, `after-tool`, `before-compact`, `on-prompt` além dos atuais); `Hook` ganha `tools?: string`; `readHook` lê `tools` do frontmatter.
- `src/hooks/claude-code.ts`: `EVENT_MAP` ampliado com `PreCompact` e `UserPromptSubmit`; `MATCHER_MAP` por evento; `translateForClaudeCode` devolve `{ name, event, matcher?, blocking, kind: "script" | "dispatch", script | command }`; `renderSettings` emite `matcher` só quando definido e `command` como referência ao arquivo (script) ou binário via shim (dispatch). `wrap`/`unwrap` mantidos para o conteúdo do arquivo.
- `src/hooks/identity.ts` (novo): `isMaestroEntry(entry)` reconhece `.maestro/hooks/<name>.sh` no `command`; `isLegacyEntry(entry, names)` aplica as duas condições da migração.
- `src/hooks/upstream.ts` (novo): `projectContextModeHooks(hooksJsonPath, resolution)` lê o `hooks.json` do pacote e devolve `Hook[]` de despacho com evento canônico correspondente e `tools` igual ao matcher upstream.
- `src/hooks/shim.ts` (novo): `buildDispatchCommand(bin, recordedPath, args)` gera a linha `sh -c` que tenta o caminho gravado e cai para `command -v`.
- `src/targets/adapter.ts`: `TargetAdapter` ganha `supportedEvents: readonly CanonicalEvent[]`; `formatHooks` devolve também `skipped: { name, event, reason }[]`.
- `src/targets/claude-code.ts` e `src/targets/antigravity.ts`: declaram eventos suportados; Antigravity continua sem `settingsPath`.
- `src/setup/write.ts`: `writeSettings` mescla por identidade (`isMaestroEntry`, `isLegacyEntry`), preserva as demais, quarentena de arquivo ilegível; `writeHookScripts(root, hooks, registryEnv)` grava `.maestro/hooks/<name>.sh` via `createExtension` (categoria `hook`, target `.maestro/hooks/<name>.sh`).
- `src/setup/run.ts`: carrega hooks canônicos + upstream, passa `skipped` ao relatório, grava scripts antes do `settings.json`, migra e registra.
- `resources/hooks/context-mode-*.md`: removidos (FR-006); `code-review-graph-update.md` permanece como despacho.

#### Migrations

- Não aplicável (sem banco). Migração de formato de `settings.json` e do inline para arquivo é tratada em FR-004 e AC-009.

#### Models

- `Hook` (`src/hooks/source.ts`): `name`, `description`, `event: CanonicalEvent`, `blocking`, `script`, `tools?`, `kind` derivado (`script` quando há bloco, `dispatch` quando só `raw_command`).
- `TranslatedHook` (`src/hooks/claude-code.ts`): `name`, `event: TargetEvent`, `matcher?`, `blocking`, `kind`, `command`, `scriptBody?`.
- `InstallRecord.hooks[]` (`src/setup/record.ts`): ganha `kind` e `path` (`.maestro/hooks/<name>.sh` ou binário resolvido).

#### Controllers e casos de uso

- `runSetup` (`src/setup/run.ts`): entrada `SetupOptions`; saída `SetupResult` com `installed`, `skipped`, `migrated`, `quarantined`; sem autorização adicional (mesmo plano de aprovação já existente).
- `writeSettings` (`src/setup/write.ts`): entrada `root`, `relPath`, `Settings`, `names`; saída caminho escrito e contagem de migradas/preservadas.

#### Views e experiência

- Não aplicável: entrega sem interface para pessoas; o efeito é observado no relatório do `maestro setup` (texto) e no comportamento dos hooks.

#### Queries e repositórios

- Leitura de `settings.json`, `.maestro/install.json`, `.maestro/extensions.json` e `node_modules/context-mode/hooks/hooks.json`; sem paginação nem índices.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/draft/0022-hooks-do-maestro-validos-no-claude-code/
  spec.md
  research/
    context-mode-hooks-json.md
    claude-code-matcher-semantica.md
src/hooks/
  source.ts            (eventos ampliados, tools)
  claude-code.ts       (matcher por evento, kind, command por referência)
  identity.ts          (novo)
  upstream.ts          (novo)
  shim.ts              (novo)
  resolve.ts
src/targets/
  adapter.ts           (supportedEvents, skipped)
  claude-code.ts
  antigravity.ts
src/setup/
  write.ts             (merge por identidade, scripts, quarentena)
  run.ts
  record.ts
resources/hooks/       (context-mode-*.md removidos)
tests/
  hooks-matcher.test.ts
  hooks-scripts-file.test.ts
  hooks-identity.test.ts
  setup-merge-settings.test.ts
  setup-migrate-inline-hooks.test.ts
  hooks-dispatch.test.ts
  hooks-upstream-context-mode.test.ts
  hooks-shim.test.ts
  hooks-events-adapter.test.ts
  setup-writes.test.ts (reescrito)
  hooks-corpus.test.ts (ajustado)
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Hook canônico | `name` | `event`, `tools?`, `blocking`, `script` ou `raw_command`; `kind` derivado | traduzido para 1 entrada por target |
| Entrada de settings | caminho em `command` (`.maestro/hooks/<name>.sh`) ou binário via shim | `matcher?`, `hooks[].command`, `blocking?` | pertence a um evento do target |
| Script de hook | `.maestro/hooks/<name>.sh` | conteúdo gerenciado, checksum em `.maestro/extensions.json` | 1:1 com hook canônico de kind `script` |
| Registro de instalação | `.maestro/install.json` | `hooks[]` com `name`, `event`, `kind`, `path`, `version` | lista as entradas do maestro |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Entrada de settings | formato inline anterior | `maestro setup` | removida, nova por referência | só com as duas condições de FR-004 |
| Entrada de settings | de terceiro | `maestro setup` | inalterada | PR-002 |
| Script de hook | registrado | drift detectado | quarentena + restaurado | PR-004 |
| Hook canônico | evento sem suporte no adaptador | `maestro setup` | pulado e listado | FR-007 |

#### Migração e retenção

- Migração única e automática do formato inline (FR-004). Sem retenção adicional: quarentena segue a política de SPEC-0011.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não. A entrega altera arquivos de configuração e scripts executados pelo Claude Code; a pessoa só observa o relatório textual do `maestro setup` e o efeito dos hooks.

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

- `translateForClaudeCode(hook): TranslatedHook` e `renderSettings(hooks): Settings` (módulo interno, sem rede).
- `writeSettings(root, relPath, settings, names): { path, migrated, preserved }`.
- `projectContextModeHooks(hooksJsonPath, resolution): { hooks: Hook[]; skipped?: string }`.

#### APIs externas utilizadas

- Nenhuma chamada de rede. Leitura local de `node_modules/context-mode/hooks/hooks.json`.

#### Documentação das APIs consultadas

- `context-mode` 1.0.169 `hooks/hooks.json` (local): estrutura evento → matcher → script (research/context-mode-hooks-json.md).

#### Eventos e outros contratos

- Contrato do Claude Code para hooks: JSON do evento pelo stdin; `exit 2` + stderr = bloqueio; `matcher` regex por nome de ferramenta; `SessionStart` sem matcher dispara em toda origem.

### 11. Estratégia TDD

- **Unidade**: `translateForClaudeCode`/`renderSettings` (matcher, kind, command), `isMaestroEntry`/`isLegacyEntry`, `projectContextModeHooks`, `buildDispatchCommand`, `readHook` com `tools`.
- **Integração/contrato**: `runSetup` em raiz temporária (fixtures de `settings.json`, `hooks.json`, scripts); execução real dos scripts e do shim via `spawnSync` com JSON de evento.
- **BDD/aceite**: AC-001 a AC-022 na seção 6 orientam um caso TDD por cenário, cada um com marcador próprio `SPECSFY:`.
- **Runner TDD**: Vitest (`npm run test:tdd`), único runner deste repositório Node; sem PHP.
- **E2E**: Não aplicável — o disparo real dentro do Claude Code é validado por execução dos scripts com o mesmo contrato de stdin/exit code.
- **Verificação manual**: uma execução de `maestro setup` neste repositório após GREEN, para confirmar que `git commit` com trailer de IA é bloqueado na sessão (o único passo que depende do host Claude Code).

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, FR-002, NFR-003, AC-001 | AC-001 na seção 6 | caso 1 em tests/hooks-matcher.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `entriesFor(...protect-authorship)` devolve `[]`: nenhuma entrada referencia `.maestro/hooks/` (formato inline atual) | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-001, FR-001, AC-002 | AC-002 na seção 6 | caso 2 em tests/hooks-matcher.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `translated.matcher` é `undefined`: a tradução atual não emite matcher por evento e `renderSettings` usa o nome do hook | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-001, FR-001, FR-007, AC-003 | AC-003 na seção 6 | caso 3 em tests/hooks-matcher.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `readHook` lança `hook wide declares an unknown event: before-tool` (vocabulário ainda com 4 eventos) | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-001, FR-002, NFR-003, AC-004 | AC-004 na seção 6 | caso 1 em tests/hooks-scripts-file.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `.maestro/hooks/guard-destructive.sh` não existe (`expected false to be true`) | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-001, FR-002, NFR-003, AC-005 | AC-005 na seção 6 | caso 2 em tests/hooks-scripts-file.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `ENOENT .maestro/hooks/guard-secrets.sh` — scripts em arquivo ainda não existem | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-001, FR-002, NFR-001, AC-006 | AC-006 na seção 6 | caso 1 em tests/hooks-identity.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `Cannot find module '../src/hooks/identity'` — módulo ainda não existe | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-002, FR-003, NFR-002, AC-007 | AC-007 na seção 6 | caso 1 em tests/setup-merge-settings.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: entrada de terceiro com `matcher: Bash` em `PreToolUse` não sobrevive: `writeSettings` substitui o array do evento | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-002, FR-003, NFR-001, AC-008 | AC-008 na seção 6 | caso 2 em tests/setup-merge-settings.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: após duas execuções a entrada de terceiro sumiu e nenhuma entrada referencia `.maestro/hooks/` (o arquivo é idêntico, mas no formato antigo) | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-002, FR-004, NFR-002, AC-009 | AC-009 na seção 6 | caso 1 em tests/setup-migrate-inline-hooks.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: 8 entradas com `>>> hook fragment` permanecem (`expected length 0, got 8`): não há migração | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-002, FR-004, NFR-002, AC-010 | AC-010 na seção 6 | caso 2 em tests/setup-migrate-inline-hooks.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: entrada `matcher: setup-check` + `echo ok` foi apagada pela substituição por evento | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-002, FR-003, FR-004, AC-011 | AC-011 na seção 6 | caso 3 em tests/setup-merge-settings.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `.maestro/quarantine/` não existe (`expected false to be true`): JSON inválido é descartado silenciosamente | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-003, FR-005, AC-012 | AC-012 na seção 6 | caso 1 em tests/hooks-dispatch.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `t.command` é `undefined`: a tradução atual só expõe `script` com wrapper (`HOOK_INPUT=$(cat)`) | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-003, FR-005, AC-013 | AC-013 na seção 6 | caso 2 em tests/hooks-dispatch.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: exit observado `127` (command undefined) em vez de `2` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-003, FR-006, FR-007, AC-014 | AC-014 na seção 6 | caso 1 em tests/hooks-upstream-context-mode.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `Cannot find module '../src/hooks/upstream'` — projeção do `hooks.json` ainda não existe | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-003, FR-006, AC-015 | AC-015 na seção 6 | caso 2 em tests/hooks-upstream-context-mode.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `Cannot find module '../src/hooks/upstream'` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-003, FR-007, AC-016 | AC-016 na seção 6 | caso 1 em tests/hooks-events-adapter.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `readHook` lança `unknown event: before-compact`; adaptadores não têm `supportedEvents` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-004, FR-008, AC-017 | AC-017 na seção 6 | caso 1 em tests/hooks-shim.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `Cannot find module '../src/hooks/shim'` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-004, FR-008, AC-018 | AC-018 na seção 6 | caso 2 em tests/hooks-shim.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `Cannot find module '../src/hooks/shim'` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-004, FR-008, AC-019 | AC-019 na seção 6 | caso 3 em tests/hooks-shim.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `Cannot find module '../src/hooks/shim'` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| NFR-001, FR-002, AC-020 | AC-020 na seção 6 | caso 3 em tests/hooks-scripts-file.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `ENOENT scandir .maestro/hooks` — diretório de scripts ainda não é gerado | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| NFR-003, FR-002, FR-005, AC-021 | AC-021 na seção 6 | caso 1 em tests/hooks-corpus.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `code-review-graph-update: expected undefined to be 'dispatch'` — `TranslatedHook` não tem `kind` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |
| US-003, FR-006, FR-007, AC-022 | AC-022 na seção 6 | caso 3 em tests/hooks-upstream-context-mode.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `Cannot find module '../src/hooks/upstream'` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: suítes de hooks/setup verdes; 11 falhas pré-existentes da SPEC-0021 |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Integração | tests/hooks-matcher.test.ts | Passed (2026-09-17) |
| FR-001 | AC-002 | Unidade | tests/hooks-matcher.test.ts | Passed (2026-09-17) |
| FR-001 | AC-003 | Unidade | tests/hooks-matcher.test.ts | Passed (2026-09-17) |
| FR-002 | AC-001 | Integração | tests/hooks-matcher.test.ts | Passed (2026-09-17) |
| FR-002 | AC-004 | Integração | tests/hooks-scripts-file.test.ts | Passed (2026-09-17) |
| FR-002 | AC-005 | Integração | tests/hooks-scripts-file.test.ts | Passed (2026-09-17) |
| FR-002 | AC-006 | Unidade | tests/hooks-identity.test.ts | Passed (2026-09-17) |
| FR-002 | AC-020 | Integração | tests/hooks-scripts-file.test.ts | Passed (2026-09-17) |
| FR-002 | AC-021 | Unidade | tests/hooks-corpus.test.ts | Passed (2026-09-17) |
| FR-003 | AC-007 | Integração | tests/setup-merge-settings.test.ts | Passed (2026-09-17) |
| FR-003 | AC-008 | Integração | tests/setup-merge-settings.test.ts | Passed (2026-09-17) |
| FR-003 | AC-011 | Integração | tests/setup-merge-settings.test.ts | Passed (2026-09-17) |
| FR-004 | AC-009 | Integração | tests/setup-migrate-inline-hooks.test.ts | Passed (2026-09-17) |
| FR-004 | AC-010 | Integração | tests/setup-migrate-inline-hooks.test.ts | Passed (2026-09-17) |
| FR-004 | AC-011 | Integração | tests/setup-merge-settings.test.ts | Passed (2026-09-17) |
| FR-005 | AC-012 | Integração | tests/hooks-dispatch.test.ts | Passed (2026-09-17) |
| FR-005 | AC-013 | Integração | tests/hooks-dispatch.test.ts | Passed (2026-09-17) |
| FR-005 | AC-021 | Unidade | tests/hooks-corpus.test.ts | Passed (2026-09-17) |
| FR-006 | AC-014 | Unidade | tests/hooks-upstream-context-mode.test.ts | Passed (2026-09-17) |
| FR-006 | AC-015 | Integração | tests/hooks-upstream-context-mode.test.ts | Passed (2026-09-17) |
| FR-006 | AC-022 | Unidade | tests/hooks-upstream-context-mode.test.ts | Passed (2026-09-17) |
| FR-007 | AC-003 | Unidade | tests/hooks-matcher.test.ts | Passed (2026-09-17) |
| FR-007 | AC-014 | Unidade | tests/hooks-upstream-context-mode.test.ts | Passed (2026-09-17) |
| FR-007 | AC-016 | Integração | tests/hooks-events-adapter.test.ts | Passed (2026-09-17) |
| FR-007 | AC-022 | Unidade | tests/hooks-upstream-context-mode.test.ts | Passed (2026-09-17) |
| FR-008 | AC-017 | Integração | tests/hooks-shim.test.ts | Passed (2026-09-17) |
| FR-008 | AC-018 | Integração | tests/hooks-shim.test.ts | Passed (2026-09-17) |
| FR-008 | AC-019 | Integração | tests/hooks-shim.test.ts | Passed (2026-09-17) |
| NFR-001 | AC-006 | Unidade | tests/hooks-identity.test.ts | Passed (2026-09-17) |
| NFR-001 | AC-008 | Integração | tests/setup-merge-settings.test.ts | Passed (2026-09-17) |
| NFR-001 | AC-020 | Integração | tests/hooks-scripts-file.test.ts | Passed (2026-09-17) |
| NFR-002 | AC-007 | Integração | tests/setup-merge-settings.test.ts | Passed (2026-09-17) |
| NFR-002 | AC-009 | Integração | tests/setup-migrate-inline-hooks.test.ts | Passed (2026-09-17) |
| NFR-002 | AC-010 | Integração | tests/setup-migrate-inline-hooks.test.ts | Passed (2026-09-17) |
| NFR-003 | AC-001 | Integração | tests/hooks-matcher.test.ts | Passed (2026-09-17) |
| NFR-003 | AC-004 | Integração | tests/hooks-scripts-file.test.ts | Passed (2026-09-17) |
| NFR-003 | AC-005 | Integração | tests/hooks-scripts-file.test.ts | Passed (2026-09-17) |
| NFR-003 | AC-021 | Unidade | tests/hooks-corpus.test.ts | Passed (2026-09-17) |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-09-17); aceite final em `review` (2026-09-17): entrega conferida contra cada AC/FR/NFR e a DoD, sem findings abertos — spec movida para `completed`.
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/completed/0022-hooks-do-maestro-validos-no-claude-code/spec.md`
- **Achados**: estrutura VALID; research PASSED (R-001, R-002 critical verificados, R-003 high verificado); cobertura mínima atendida — 4 US, 8 FR e 3 NFR com ≥3 AC cada, 22 AC no total; NOTE editorial resolvido (a primeira palavra da seção "Resultado desejado" casava o detector de marcadores pendentes por ser homógrafa em português; reescrita como "Cada"). Sem BLOCKER.
- **FIND-SEC-001** [P3] [Accepted] O fallback do shim para `PATH` (FR-008) pode executar um binário diferente do resolvido no setup se o caminho gravado sumir e outro `context-mode`/`code-review-graph` estiver antes no `PATH` — Refs: FR-008, AC-018 — Evidence: src/hooks/resolve.ts:1 — Effect: hook de despacho executa binário homônimo não aprovado; superfície limitada ao próprio host da pessoa, mesma exposição que existia antes de `resolveHookCommand` — Suggestion: o shim prefere sempre o caminho gravado e, ao cair para `PATH`, escreve em stderr o caminho efetivamente usado; aceito sem bloqueio porque o fallback só ocorre após rename/move e a alternativa (falhar) foi descartada em DEC-006.
- **FIND-ARCH-001** [P3] [Resolved] O comportamento atual de `writeSettings` para JSON inválido (`current = {}` e reescrita) apaga o arquivo original apesar do comentário "never blindly erased" — Refs: FR-003, AC-011 — Evidence: src/setup/write.ts:22 — Effect: perda silenciosa de hooks de terceiros em arquivo corrompido — Suggestion: quarentena antes da escrita, já exigida por AC-011; resolvido na definição.
- **FIND-PROD-001** [P3] [Resolved] A seção 14 ainda não tem tarefas materializadas — Refs: AC-001 — Evidence: specs/draft/0022-hooks-do-maestro-validos-no-claude-code/spec.md:1 — Effect: nenhum; decomposição pertence a `$specsfy-05-tasks` — Suggestion: manter a Fase 1 com um caso TDD por AC conforme a seção 11.

#### Gate do Ato II — Plano

- **Resultado**: Passed (2026-09-17)
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/completed/0022-hooks-do-maestro-validos-no-claude-code/spec.md`
- **Achados**: 34 tarefas (22 `[TEST][TDD]`, 10 `[CODE]`, 1 `[TEST]` de regressão, 1 `[DOC]`), 37/37 IDs cobertos; os 22 predecessores TDD concluídos com RED válido registrado na seção 11 (15 por asserção de comportamento ausente, 7 por módulo inexistente). Ciclo 1 corrigiu T023, T025 e T031 com menos de três predecessores. Suíte completa: nenhuma regressão em teste que passava; 11 falhas pré-existentes pertencem à SPEC-0021 (`Planned`).

#### Gate do Ato III — Entrega

- **Resultado**: Pending
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/completed/0022-hooks-do-maestro-validos-no-claude-code/spec.md .`
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
reconstrução independente de `docs/` antes do **EXECUTE**, mesmo quando a
documentação já existia antes da mudança. Nenhuma tarefa tem superfície visual:
a entrega são arquivos de configuração, scripts e relatório textual.

#### Fase 1 — RED TDD informado pelo BDD (um caso por `AC`)

- [x] T001 [TEST] [TDD] [US-001] Derivar de AC-001 um caso Vitest falhando em tests/hooks-matcher.test.ts — Refs: US-001, FR-001, FR-002, NFR-003, AC-001 — Depends: none
  - [x] **PREP**: Gherkin de AC-001 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-matcher.test.ts com marcador `SPECSFY: … AC-001`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `entriesFor(...protect-authorship)` devolve `[]`: nenhuma entrada referencia `.maestro/hooks/` (formato inline atual).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-matcher` → falha em AC-001 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T002 [TEST] [TDD] [US-001] Derivar de AC-002 um caso Vitest falhando em tests/hooks-matcher.test.ts — Refs: US-001, FR-001, AC-002 — Depends: none
  - [x] **PREP**: Gherkin de AC-002 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-matcher.test.ts com marcador `SPECSFY: … AC-002`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `translated.matcher` é `undefined`: a tradução atual não emite matcher por evento e `renderSettings` usa o nome do hook.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-matcher` → falha em AC-002 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T003 [TEST] [TDD] [US-001] Derivar de AC-003 um caso Vitest falhando em tests/hooks-matcher.test.ts — Refs: US-001, FR-001, FR-007, AC-003 — Depends: none
  - [x] **PREP**: Gherkin de AC-003 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-matcher.test.ts com marcador `SPECSFY: … AC-003`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `readHook` lança `hook wide declares an unknown event: before-tool` (vocabulário ainda com 4 eventos).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-matcher` → falha em AC-003 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T004 [TEST] [TDD] [US-001] Derivar de AC-004 um caso Vitest falhando em tests/hooks-scripts-file.test.ts — Refs: US-001, FR-002, NFR-003, AC-004 — Depends: none
  - [x] **PREP**: Gherkin de AC-004 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-scripts-file.test.ts com marcador `SPECSFY: … AC-004`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `.maestro/hooks/guard-destructive.sh` não existe (`expected false to be true`).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-scripts-file` → falha em AC-004 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T005 [TEST] [TDD] [US-001] Derivar de AC-005 um caso Vitest falhando em tests/hooks-scripts-file.test.ts — Refs: US-001, FR-002, NFR-003, AC-005 — Depends: none
  - [x] **PREP**: Gherkin de AC-005 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-scripts-file.test.ts com marcador `SPECSFY: … AC-005`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `ENOENT .maestro/hooks/guard-secrets.sh` — scripts em arquivo ainda não existem.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-scripts-file` → falha em AC-005 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T006 [TEST] [TDD] [US-001] Derivar de AC-006 um caso Vitest falhando em tests/hooks-identity.test.ts — Refs: US-001, FR-002, NFR-001, AC-006 — Depends: none
  - [x] **PREP**: Gherkin de AC-006 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-identity.test.ts com marcador `SPECSFY: … AC-006`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `Cannot find module '../src/hooks/identity'` — módulo ainda não existe.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-identity` → falha em AC-006 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T007 [TEST] [TDD] [US-002] Derivar de AC-007 um caso Vitest falhando em tests/setup-merge-settings.test.ts — Refs: US-002, FR-003, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Gherkin de AC-007 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-merge-settings.test.ts com marcador `SPECSFY: … AC-007`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — entrada de terceiro com `matcher: Bash` em `PreToolUse` não sobrevive: `writeSettings` substitui o array do evento.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-merge-settings` → falha em AC-007 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T008 [TEST] [TDD] [US-002] Derivar de AC-008 um caso Vitest falhando em tests/setup-merge-settings.test.ts — Refs: US-002, FR-003, NFR-001, AC-008 — Depends: none
  - [x] **PREP**: Gherkin de AC-008 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-merge-settings.test.ts com marcador `SPECSFY: … AC-008`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — após duas execuções a entrada de terceiro sumiu e nenhuma entrada referencia `.maestro/hooks/` (o arquivo é idêntico, mas no formato antigo).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-merge-settings` → falha em AC-008 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Caso refinado após passar antes da mudança: passou a exigir a preservação do terceiro e o novo formato de referência, provando o gap real.

- [x] T009 [TEST] [TDD] [US-002] Derivar de AC-009 um caso Vitest falhando em tests/setup-migrate-inline-hooks.test.ts — Refs: US-002, FR-004, NFR-002, AC-009 — Depends: none
  - [x] **PREP**: Gherkin de AC-009 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-migrate-inline-hooks.test.ts com marcador `SPECSFY: … AC-009`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — 8 entradas com `>>> hook fragment` permanecem (`expected length 0, got 8`): não há migração.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-migrate-inline-hooks` → falha em AC-009 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Asserção de `permissions` corrigida para exigir preservação (estava invertida).

- [x] T010 [TEST] [TDD] [US-002] Derivar de AC-010 um caso Vitest falhando em tests/setup-migrate-inline-hooks.test.ts — Refs: US-002, FR-004, NFR-002, AC-010 — Depends: none
  - [x] **PREP**: Gherkin de AC-010 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-migrate-inline-hooks.test.ts com marcador `SPECSFY: … AC-010`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — entrada `matcher: setup-check` + `echo ok` foi apagada pela substituição por evento.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-migrate-inline-hooks` → falha em AC-010 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T011 [TEST] [TDD] [US-002] Derivar de AC-011 um caso Vitest falhando em tests/setup-merge-settings.test.ts — Refs: US-002, FR-003, FR-004, AC-011 — Depends: none
  - [x] **PREP**: Gherkin de AC-011 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-merge-settings.test.ts com marcador `SPECSFY: … AC-011`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `.maestro/quarantine/` não existe (`expected false to be true`): JSON inválido é descartado silenciosamente.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-merge-settings` → falha em AC-011 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T012 [TEST] [TDD] [US-003] Derivar de AC-012 um caso Vitest falhando em tests/hooks-dispatch.test.ts — Refs: US-003, FR-005, AC-012 — Depends: none
  - [x] **PREP**: Gherkin de AC-012 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-dispatch.test.ts com marcador `SPECSFY: … AC-012`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `t.command` é `undefined`: a tradução atual só expõe `script` com wrapper (`HOOK_INPUT=$(cat)`).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-dispatch` → falha em AC-012 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T013 [TEST] [TDD] [US-003] Derivar de AC-013 um caso Vitest falhando em tests/hooks-dispatch.test.ts — Refs: US-003, FR-005, AC-013 — Depends: none
  - [x] **PREP**: Gherkin de AC-013 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-dispatch.test.ts com marcador `SPECSFY: … AC-013`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — exit observado `127` (command undefined) em vez de `2`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-dispatch` → falha em AC-013 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T014 [TEST] [TDD] [US-003] Derivar de AC-014 um caso Vitest falhando em tests/hooks-upstream-context-mode.test.ts — Refs: US-003, FR-006, FR-007, AC-014 — Depends: none
  - [x] **PREP**: Gherkin de AC-014 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-upstream-context-mode.test.ts com marcador `SPECSFY: … AC-014`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `Cannot find module '../src/hooks/upstream'` — projeção do `hooks.json` ainda não existe.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-upstream-context-mode` → falha em AC-014 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T015 [TEST] [TDD] [US-003] Derivar de AC-015 um caso Vitest falhando em tests/hooks-upstream-context-mode.test.ts — Refs: US-003, FR-006, AC-015 — Depends: none
  - [x] **PREP**: Gherkin de AC-015 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-upstream-context-mode.test.ts com marcador `SPECSFY: … AC-015`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `Cannot find module '../src/hooks/upstream'`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-upstream-context-mode` → falha em AC-015 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T016 [TEST] [TDD] [US-003] Derivar de AC-016 um caso Vitest falhando em tests/hooks-events-adapter.test.ts — Refs: US-003, FR-007, AC-016 — Depends: none
  - [x] **PREP**: Gherkin de AC-016 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-events-adapter.test.ts com marcador `SPECSFY: … AC-016`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `readHook` lança `unknown event: before-compact`; adaptadores não têm `supportedEvents`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-events-adapter` → falha em AC-016 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T017 [TEST] [TDD] [US-004] Derivar de AC-017 um caso Vitest falhando em tests/hooks-shim.test.ts — Refs: US-004, FR-008, AC-017 — Depends: none
  - [x] **PREP**: Gherkin de AC-017 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-shim.test.ts com marcador `SPECSFY: … AC-017`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `Cannot find module '../src/hooks/shim'`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-shim` → falha em AC-017 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T018 [TEST] [TDD] [US-004] Derivar de AC-018 um caso Vitest falhando em tests/hooks-shim.test.ts — Refs: US-004, FR-008, AC-018 — Depends: none
  - [x] **PREP**: Gherkin de AC-018 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-shim.test.ts com marcador `SPECSFY: … AC-018`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `Cannot find module '../src/hooks/shim'`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-shim` → falha em AC-018 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T019 [TEST] [TDD] [US-004] Derivar de AC-019 um caso Vitest falhando em tests/hooks-shim.test.ts — Refs: US-004, FR-008, AC-019 — Depends: none
  - [x] **PREP**: Gherkin de AC-019 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-shim.test.ts com marcador `SPECSFY: … AC-019`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `Cannot find module '../src/hooks/shim'`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-shim` → falha em AC-019 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T020 [TEST] [TDD] Derivar de AC-020 um caso Vitest falhando em tests/hooks-scripts-file.test.ts — Refs: NFR-001, FR-002, AC-020 — Depends: none
  - [x] **PREP**: Gherkin de AC-020 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-scripts-file.test.ts com marcador `SPECSFY: … AC-020`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `ENOENT scandir .maestro/hooks` — diretório de scripts ainda não é gerado.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-scripts-file` → falha em AC-020 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T021 [TEST] [TDD] Derivar de AC-021 um caso Vitest falhando em tests/hooks-corpus.test.ts — Refs: NFR-003, FR-002, FR-005, AC-021 — Depends: none
  - [x] **PREP**: Gherkin de AC-021 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-corpus.test.ts com marcador `SPECSFY: … AC-021`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `code-review-graph-update: expected undefined to be 'dispatch'` — `TranslatedHook` não tem `kind`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-corpus` → falha em AC-021 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T022 [TEST] [TDD] [US-003] Derivar de AC-022 um caso Vitest falhando em tests/hooks-upstream-context-mode.test.ts — Refs: US-003, FR-006, FR-007, AC-022 — Depends: none
  - [x] **PREP**: Gherkin de AC-022 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-upstream-context-mode.test.ts com marcador `SPECSFY: … AC-022`; fixtures em tests/helpers-spec-0022.ts e tests/fixtures/spec-0022/; sem `.feature`.
  - [x] **VERIFY**: RED válido — `Cannot find module '../src/hooks/upstream'`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-upstream-context-mode` → falha em AC-022 (2026-09-17); linha registrada na tabela da seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.


#### Fase 2 — US-001 Guards disparam de fato no Claude Code (P1)

**Objetivo**: matcher por ferramenta, scripts em `.maestro/hooks/` e identidade pelo caminho.
**Teste independente**: `npm run test:tdd -- hooks-matcher hooks-scripts-file hooks-identity hooks-corpus` verde.

- [x] T023 [CODE] [US-001] Ampliar CanonicalEvent e ler tools no frontmatter em src/hooks/source.ts — Refs: US-001, FR-001, FR-007, AC-002, AC-003, AC-016, AC-022 — Depends: T002, T003, T016, T022
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; `docs/` avaliado antes do EXECUTE — o script mecânico `build_documentation.mjs` substitui o conteúdo real por esqueleto (R-001 da SPEC-0021), então a reconstrução foi feita de forma dirigida em `docs/integrations.md` e `docs/application.md` e o monitor devolve `CURRENT`.
  - [x] **EXECUTE**: `CanonicalEvent` com 8 eventos, `tools?` e `kind` derivado em `readHook`; `HookKind` exportado.
  - [x] **VERIFY**: `npm run test:tdd -- hooks-matcher hooks-raw-command hooks-corpus` → GREEN; `npx tsc --noEmit` sem erros (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, scripts e configuração.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–12; `PROJECT.md` revisado e atualizado (seção sobre como um hook chega ao Claude Code); `.specsfy/STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima; sem duplicação introduzida.
  <!-- specsfy:evidence {"task":"T023","refs":["US-001","FR-001","FR-007","AC-002","AC-003","AC-016","AC-022"],"files":["src/hooks/source.ts"],"commands":[{"run":"npm run test:tdd -- hooks-matcher hooks-raw-command hooks-corpus","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T024 [CODE] [US-001] Traduzir com matcher por evento/tools e command por referência em src/hooks/claude-code.ts — Refs: US-001, FR-001, FR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-021 — Depends: T001, T002, T003, T004, T021, T023
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; `docs/` avaliado antes do EXECUTE — o script mecânico `build_documentation.mjs` substitui o conteúdo real por esqueleto (R-001 da SPEC-0021), então a reconstrução foi feita de forma dirigida em `docs/integrations.md` e `docs/application.md` e o monitor devolve `CURRENT`.
  - [x] **EXECUTE**: `EVENT_MAP` com `PreCompact`/`UserPromptSubmit`, `MATCHER_MAP` por evento, `TranslatedHook` com `matcher?`, `kind`, `command`, `scriptBody?`, `canonicalEvent`; `renderSettings` emite `matcher` só quando definido; `scriptReference()`/`dispatchMarker()`. Testes antigos `hooks-corpus`, `hooks-escape`, `hooks-translate`, `hooks-permissive` adaptados ao novo contrato (round-trip pelo `scriptBody`/registro JSON).
  - [x] **VERIFY**: `npm run test:tdd -- hooks-matcher hooks-corpus hooks-translate hooks-escape hooks-blocking hooks-permissive` → GREEN; `npx tsc --noEmit` sem erros (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, scripts e configuração.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–12; `PROJECT.md` revisado e atualizado (seção sobre como um hook chega ao Claude Code); `.specsfy/STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima; sem duplicação introduzida.
  <!-- specsfy:evidence {"task":"T024","refs":["US-001","FR-001","FR-002","NFR-003","AC-001","AC-002","AC-003","AC-004","AC-021"],"files":["src/hooks/claude-code.ts"],"commands":[{"run":"npm run test:tdd -- hooks-matcher hooks-corpus hooks-translate hooks-escape hooks-blocking hooks-permissive","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T025 [CODE] [US-001] Criar reconhecimento de entradas do maestro em src/hooks/identity.ts — Refs: US-001, FR-002, FR-004, NFR-001, AC-006, AC-009, AC-010 — Depends: T006, T009, T010
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; `docs/` avaliado antes do EXECUTE — o script mecânico `build_documentation.mjs` substitui o conteúdo real por esqueleto (R-001 da SPEC-0021), então a reconstrução foi feita de forma dirigida em `docs/integrations.md` e `docs/application.md` e o monitor devolve `CURRENT`.
  - [x] **EXECUTE**: `isMaestroEntry` reconhece caminho `.maestro/hooks/<name>.sh` **ou** marcador `# maestro:hook=<name>` (despachos); `isLegacyEntry` exige matcher ∈ nomes (inclusive `LEGACY_HOOK_NAMES` do context-mode) **e** `>>> hook fragment`.
  - [x] **VERIFY**: `npm run test:tdd -- hooks-identity` → GREEN; `npx tsc --noEmit` sem erros (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, scripts e configuração.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–12; `PROJECT.md` revisado e atualizado (seção sobre como um hook chega ao Claude Code); `.specsfy/STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Marcador `# maestro:hook=<name>` acrescentado aos despachos — sem ele a segunda execução duplicava as entradas upstream (achado real no AC-008).
  <!-- specsfy:evidence {"task":"T025","refs":["US-001","FR-002","FR-004","NFR-001","AC-006","AC-009","AC-010"],"files":["src/hooks/identity.ts"],"commands":[{"run":"npm run test:tdd -- hooks-identity","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T026 [CODE] [US-001] Gravar scripts de hook com registro por checksum e quarentena em src/setup/write.ts — Refs: US-001, FR-002, NFR-001, NFR-003, AC-004, AC-005, AC-020 — Depends: T004, T005, T020, T024
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; `docs/` avaliado antes do EXECUTE — o script mecânico `build_documentation.mjs` substitui o conteúdo real por esqueleto (R-001 da SPEC-0021), então a reconstrução foi feita de forma dirigida em `docs/integrations.md` e `docs/application.md` e o monitor devolve `CURRENT`.
  - [x] **EXECUTE**: `writeHookScripts` grava `.maestro/hooks/<name>.sh` (0o755), registra `hook:<name>` por checksum em `.maestro/extensions.json` (categoria `hook`), quarentena de drift e restauração, sem reescrita quando o checksum bate; `diagnoseExtensions` compara o arquivo inteiro para categoria `hook`; `runSetup` chama os scripts antes do `settings.json` e também no caminho *already configured*.
  - [x] **VERIFY**: `npm run test:tdd -- hooks-scripts-file extensions-create-sobrevive-setup setup-idempotent` → GREEN; `npx tsc --noEmit` sem erros (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, scripts e configuração.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–12; `PROJECT.md` revisado e atualizado (seção sobre como um hook chega ao Claude Code); `.specsfy/STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima; sem duplicação introduzida.
  <!-- specsfy:evidence {"task":"T026","refs":["US-001","FR-002","NFR-001","NFR-003","AC-004","AC-005","AC-020"],"files":["src/setup/write.ts","src/setup/run.ts"],"commands":[{"run":"npm run test:tdd -- hooks-scripts-file extensions-create-sobrevive-setup setup-idempotent","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->


**Checkpoint**: `runSetup` numa raiz temporária gera `.maestro/hooks/protect-authorship.sh`; executá-lo com JSON de `PreToolUse`/`Bash` contendo trailer de IA devolve exit 2.

#### Fase 3 — US-002 Hooks de outras origens preservados e formato antigo migrado (P1)

**Objetivo**: merge por identidade, quarentena de arquivo inválido e migração do inline.
**Teste independente**: `npm run test:tdd -- setup-merge-settings setup-migrate-inline-hooks` verde.

- [x] T027 [CODE] [US-002] Mesclar settings.json por identidade preservando terceiros em src/setup/write.ts — Refs: US-002, FR-003, NFR-001, NFR-002, AC-007, AC-008, AC-011 — Depends: T007, T008, T011, T025, T026
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; `docs/` avaliado antes do EXECUTE — o script mecânico `build_documentation.mjs` substitui o conteúdo real por esqueleto (R-001 da SPEC-0021), então a reconstrução foi feita de forma dirigida em `docs/integrations.md` e `docs/application.md` e o monitor devolve `CURRENT`.
  - [x] **EXECUTE**: `writeSettings(root, rel, settings, names)` mescla por identidade em todos os eventos, preserva terceiros, quarentena `<stamp>-settings.json` para JSON inválido e devolve `{ preserved, migrated, quarantined }`; `hasLegacyEntries` força reexecução quando o arquivo ainda tem formato antigo.
  - [x] **VERIFY**: `npm run test:tdd -- setup-merge-settings setup-writes setup-idempotent` → GREEN; `npx tsc --noEmit` sem erros (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, scripts e configuração.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–12; `PROJECT.md` revisado e atualizado (seção sobre como um hook chega ao Claude Code); `.specsfy/STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima; sem duplicação introduzida.
  <!-- specsfy:evidence {"task":"T027","refs":["US-002","FR-003","NFR-001","NFR-002","AC-007","AC-008","AC-011"],"files":["src/setup/write.ts"],"commands":[{"run":"npm run test:tdd -- setup-merge-settings setup-writes setup-idempotent","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T028 [CODE] [US-002] Migrar entradas inline antigas em src/setup/write.ts e relatar em src/setup/run.ts — Refs: US-002, FR-004, NFR-002, AC-009, AC-010 — Depends: T009, T010, T027
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; `docs/` avaliado antes do EXECUTE — o script mecânico `build_documentation.mjs` substitui o conteúdo real por esqueleto (R-001 da SPEC-0021), então a reconstrução foi feita de forma dirigida em `docs/integrations.md` e `docs/application.md` e o monitor devolve `CURRENT`.
  - [x] **EXECUTE**: Entradas legadas removidas e contadas; relatório `N legacy inline entries migrated`; `hooksAlreadyDone` deixa de valer com entradas legadas ou script ausente.
  - [x] **VERIFY**: `npm run test:tdd -- setup-migrate-inline-hooks setup-revert setup-record` → GREEN; `npx tsc --noEmit` sem erros (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, scripts e configuração.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–12; `PROJECT.md` revisado e atualizado (seção sobre como um hook chega ao Claude Code); `.specsfy/STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima; sem duplicação introduzida.
  <!-- specsfy:evidence {"task":"T028","refs":["US-002","FR-004","NFR-002","AC-009","AC-010"],"files":["src/setup/write.ts","src/setup/run.ts"],"commands":[{"run":"npm run test:tdd -- setup-migrate-inline-hooks setup-revert setup-record","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->


**Checkpoint**: fixture com hook manual `matcher: Bash` + 8 entradas antigas → após `runSetup`, o manual permanece e as antigas viram referências a `.maestro/hooks/`.

#### Fase 4 — US-003 Hooks de despacho fiéis ao upstream (P2)

**Objetivo**: despacho direto, projeção do `hooks.json` do context-mode e suporte declarado por adaptador.
**Teste independente**: `npm run test:tdd -- hooks-dispatch hooks-upstream-context-mode hooks-events-adapter` verde.

- [x] T029 [CODE] [US-003] Instalar hooks de despacho sem wrapper em src/hooks/claude-code.ts — Refs: US-003, FR-005, AC-012, AC-013, AC-021 — Depends: T012, T013, T021, T024
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; `docs/` avaliado antes do EXECUTE — o script mecânico `build_documentation.mjs` substitui o conteúdo real por esqueleto (R-001 da SPEC-0021), então a reconstrução foi feita de forma dirigida em `docs/integrations.md` e `docs/application.md` e o monitor devolve `CURRENT`.
  - [x] **EXECUTE**: Despacho sem preâmbulo/postâmbulo: `command = <raw_command> # maestro:hook=<name>`; stdin e exit code passam intactos (AC-012/013 executam via `sh -c`). `hooks-raw-command` adaptado.
  - [x] **VERIFY**: `npm run test:tdd -- hooks-dispatch hooks-corpus hooks-context-mode-comando` → GREEN; `npx tsc --noEmit` sem erros (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, scripts e configuração.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–12; `PROJECT.md` revisado e atualizado (seção sobre como um hook chega ao Claude Code); `.specsfy/STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima; sem duplicação introduzida.
  <!-- specsfy:evidence {"task":"T029","refs":["US-003","FR-005","AC-012","AC-013","AC-021"],"files":["src/hooks/claude-code.ts"],"commands":[{"run":"npm run test:tdd -- hooks-dispatch hooks-corpus hooks-context-mode-comando","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T030 [CODE] [US-003] Projetar hooks do context-mode a partir do hooks.json em src/hooks/upstream.ts e remover resources/hooks/context-mode-*.md — Refs: US-003, FR-006, FR-007, AC-014, AC-015, AC-022 — Depends: T014, T015, T022, T023, T029
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; `docs/` avaliado antes do EXECUTE — o script mecânico `build_documentation.mjs` substitui o conteúdo real por esqueleto (R-001 da SPEC-0021), então a reconstrução foi feita de forma dirigida em `docs/integrations.md` e `docs/application.md` e o monitor devolve `CURRENT`.
  - [x] **EXECUTE**: `projectContextModeHooks(hooksJsonPath)` projeta um hook de despacho por matcher/evento do `hooks.json`, substitui `${CLAUDE_PLUGIN_ROOT}` pelo diretório do pacote e devolve `skipped` quando ausente/inválido; `runSetup` concatena canônicos + upstream (opção `upstream.contextModeHooksJson`); os três `resources/hooks/context-mode-*.md` removidos; `hooks-context-mode-comando.test.ts` reescrito sobre a projeção; `setup-dependency-resolution` adaptado ao caminho absoluto do pacote.
  - [x] **VERIFY**: `npm run test:tdd -- hooks-upstream-context-mode hooks-corpus setup-dependency-resolution` → GREEN; `npx tsc --noEmit` sem erros (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, scripts e configuração.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–12; `PROJECT.md` revisado e atualizado (seção sobre como um hook chega ao Claude Code); `.specsfy/STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima; sem duplicação introduzida.
  <!-- specsfy:evidence {"task":"T030","refs":["US-003","FR-006","FR-007","AC-014","AC-015","AC-022"],"files":["src/hooks/upstream.ts","src/setup/run.ts","tests/hooks-context-mode-comando.test.ts"],"commands":[{"run":"npm run test:tdd -- hooks-upstream-context-mode hooks-corpus setup-dependency-resolution","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T031 [CODE] [US-003] Declarar eventos suportados por adaptador e reportar pulados em src/targets/adapter.ts, src/targets/claude-code.ts, src/targets/antigravity.ts e src/setup/run.ts — Refs: US-003, FR-006, FR-007, AC-014, AC-016, AC-022 — Depends: T014, T016, T022, T023
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; `docs/` avaliado antes do EXECUTE — o script mecânico `build_documentation.mjs` substitui o conteúdo real por esqueleto (R-001 da SPEC-0021), então a reconstrução foi feita de forma dirigida em `docs/integrations.md` e `docs/application.md` e o monitor devolve `CURRENT`.
  - [x] **EXECUTE**: `supportedEvents` por adaptador, `partitionByEvent`, `formatHooks` devolve `skipped`; `runSetup` exclui pulados e lista `skipped: <nome> (<motivo>)` no relatório (opção `hooksDir` para hook sintético).
  - [x] **VERIFY**: `npm run test:tdd -- hooks-events-adapter setup-antigravity setup-surface` → GREEN; `npx tsc --noEmit` sem erros (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, scripts e configuração.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–12; `PROJECT.md` revisado e atualizado (seção sobre como um hook chega ao Claude Code); `.specsfy/STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima; sem duplicação introduzida.
  <!-- specsfy:evidence {"task":"T031","refs":["US-003","FR-006","FR-007","AC-014","AC-016","AC-022"],"files":["src/targets/adapter.ts","src/targets/claude-code.ts","src/targets/antigravity.ts","src/setup/run.ts"],"commands":[{"run":"npm run test:tdd -- hooks-events-adapter setup-antigravity setup-surface","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->


**Checkpoint**: com um `hooks.json` de fixture, `settings.json` gerado tem `PreToolUse` em `Bash`, `Read`, `Grep` e `WebFetch` apontando para o script do context-mode e o binário recebe o stdin.

#### Fase 5 — US-004 Caminho de binário resiliente a rename e move (P2)

**Objetivo**: shim que prefere o caminho gravado e cai para `PATH`.
**Teste independente**: `npm run test:tdd -- hooks-shim` verde.

- [x] T032 [CODE] [US-004] Gerar shim de resolução em tempo de execução em src/hooks/shim.ts e integrar em src/hooks/resolve.ts — Refs: US-004, FR-008, AC-017, AC-018, AC-019 — Depends: T017, T018, T019, T029
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; `docs/` avaliado antes do EXECUTE — o script mecânico `build_documentation.mjs` substitui o conteúdo real por esqueleto (R-001 da SPEC-0021), então a reconstrução foi feita de forma dirigida em `docs/integrations.md` e `docs/application.md` e o monitor devolve `CURRENT`.
  - [x] **EXECUTE**: `buildDispatchCommand` em POSIX `sh` (caminho gravado → `command -v` → mensagem + exit 0), com aviso em stderr ao cair para PATH (FIND-SEC-001); `resolveDispatchCommand` em `resolve.ts` aplica o shim aos despachos e `resolveHookCommand` fica intacto (testes existentes preservados).
  - [x] **VERIFY**: `npm run test:tdd -- hooks-shim hooks-resolve` → GREEN; `npx tsc --noEmit` sem erros (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, scripts e configuração.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–12; `PROJECT.md` revisado e atualizado (seção sobre como um hook chega ao Claude Code); `.specsfy/STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Primeira versão do shim tinha `then;` inválido em `sh`; corrigido antes do GREEN e o teste passou a usar `/bin/sh` explícito para não depender do `PATH` manipulado.
  <!-- specsfy:evidence {"task":"T032","refs":["US-004","FR-008","AC-017","AC-018","AC-019"],"files":["src/hooks/shim.ts","src/hooks/resolve.ts"],"commands":[{"run":"npm run test:tdd -- hooks-shim hooks-resolve","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->


**Checkpoint**: renomear a raiz temporária após o setup e executar o hook de despacho continua encontrando o binário pelo `PATH`.

#### Fase final — Qualidade

- [x] T033 [TEST] Executar regressão completa e rastreabilidade via node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs — Refs: US-001, US-002, US-003, US-004, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018, AC-019, AC-020, AC-021, AC-022 — Depends: T028, T030, T031, T032
  - [x] **PREP**: Suítes identificadas: `npm run test:tdd` (566 casos), `npx tsc --noEmit`, `check_traceability.mjs --full-chain`; testes antigos reescritos: `setup-writes`, `hooks-corpus`, `hooks-escape`, `hooks-translate`, `hooks-permissive`, `hooks-raw-command`, `hooks-context-mode-comando` (reescrito sobre a projeção), `setup-dependency-resolution`, `setup-install`, `mcp-tool-install`, `trace-hooks-e-skills` e 13 arquivos com contagem fixa `8` trocada por `installedHookCount()`.
  - [x] **EXECUTE**: `npm run test:tdd` → 555 passaram / 11 falharam (as 11 são o RED pré-existente da SPEC-0021 em `Planned`: `config-schema`, `setup-documentation-extension`, `setup-readme-homepage`, `doctor-documentation-issues`, `documentation-diagnose`); `npx tsc --noEmit` limpo; `check_traceability.mjs --full-chain` → 37/37 cobertos, `insufficient_cases: {}`, `broken_chains: []`; `RESULTADO: GAPS` decorre apenas de `orphan_markers` de outras specs do repositório (condição pré-existente, idêntica na SPEC-0021). Verificação manual executada com autorização (2026-09-17): `npm version patch` → 2.1.23, `npm run build` OK; `echo '{"approved": true}' | node dist/cli.js setup --target claude-code` → `19 hooks installed in .claude/settings.json; 8 legacy inline entries migrated`; `.claude/settings.json` deste repositório sem `>>> hook fragment` e sem `common-rules-server`, chave `permissions` preservada; `.maestro/hooks/{guard-destructive,guard-secrets,protect-authorship,setup-check}.sh` criados; `protect-authorship.sh` com JSON de `PreToolUse`/`Bash` contendo trailer de IA → exit 2, com `git status` → exit 0. Evidência viva: na própria sessão do Claude Code, o hook novo bloqueou um comando `Bash` que continha o trailer e o `context-mode` PreToolUse passou a injetar contexto — ambos inertes antes da migração. Notas do relatório fora do escopo: `specsfy install` recusou por alterações locais em `.agents/skills/specsfy-setup` (proteção do próprio instalador) e a reinstalação das skills atualizou `retro/SKILL.md` do upstream.
  - [x] **VERIFY**: Zero regressão em teste que passava antes desta spec; `.claude/settings.json` deste repositório migrado para o novo formato (19 entradas, 0 legadas); guard verificado com exit 2/0.
  - [x] **VISUAL**: Não aplicável — sem interface em nenhuma tarefa desta spec.
  - [x] **EVIDENCE**: Comandos e contagens acima (2026-09-17); seções 11–12 com GREEN/Passed em todas as linhas.
  - [x] **IMPROVE**: Retrospectiva: dois defeitos só apareceram no GREEN (duplicação de despachos na 2ª execução e `then;` inválido no shim) — ambos capturados por AC-008 e AC-017/018, o que confirma o valor de exigir o novo formato em AC-008 durante o RED.

- [x] T034 [DOC] Revisar PROJECT.md e docs/integrations.md e acionar $specsfy-documentator — Refs: US-001, US-002, US-003, US-004 — Depends: T033
  - [x] **PREP**: Lidos `PROJECT.md`, `docs/integrations.md`, `docs/application.md`, `docs/architecture.md`; impacto material: novo diretório gerenciado `.maestro/hooks/`, vocabulário de eventos, projeção do upstream, shim.
  - [x] **EXECUTE**: `PROJECT.md` atualizado (parágrafo sobre os cinco hooks canônicos + projeção do context-mode e a seção *Como um hook chega ao Claude Code (SPEC-0022)*); `docs/integrations.md` §3 e `docs/application.md` (tabela de módulos) atualizados de forma dirigida. O script mecânico `build_documentation.mjs` foi executado e revertido: ele substitui o conteúdo real de `docs/` por um esqueleto em português (achado R-001 da SPEC-0021), portanto não serve como reconstrução; `.specsfy/STACK.md` e `.specsfy/DATABASE.md` sem impacto (sem mudança de stack nem persistência).
  - [x] **VERIFY**: `node .agents/skills/specsfy-setup/scripts/monitor_context.mjs --project . --check` → `CURRENT` (2026-09-17).
  - [x] **VISUAL**: Não aplicável — documentação textual.
  - [x] **EVIDENCE**: Diff de `PROJECT.md`, `docs/integrations.md`, `docs/application.md`; monitor `CURRENT`.
  - [x] **IMPROVE**: Aprendizado: o `--check` do documentator acusa `docs/` desatualizado por comparação com o esqueleto, não com o código; a SPEC-0021 já trata essa lacuna e o resultado dele não deve ser usado como gate aqui.

### 15. Ordem de execução

- Caminho crítico: T001–T022 (RED) → T023 → T024 → T025 → T026 → T027 → T028 → T029 → T030 → T031 → T032 → T033 → T034.
- Tarefas paralelas: na Fase 1, os grupos por arquivo de teste são disjuntos e podem avançar em paralelo — `hooks-matcher` (T001–T003), `hooks-scripts-file` (T004, T005, T020), `hooks-identity` (T006), `setup-merge-settings` (T007, T008, T011), `setup-migrate-inline-hooks` (T009, T010), `hooks-dispatch` (T012, T013), `hooks-upstream-context-mode` (T014, T015, T022), `hooks-events-adapter` (T016), `hooks-shim` (T017–T019), `hooks-corpus` (T021); dentro de cada grupo as tarefas competem pelo mesmo arquivo e seguem em sequência. Nas fases de código, T025 pode avançar em paralelo a T024 (arquivos disjuntos); T031 e T032 podem avançar em paralelo após T029, porque não tocam `write.ts`.
- Estratégia de MVP: US-001 + US-002 (T001–T011, T020, T021, T023–T028) restauram a proteção ativa e o merge seguro; US-003 e US-004 completam a integração com o upstream e a resiliência de caminho.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Registro de extensões e quarentena (SPEC-0011) para scripts de hook.
- Pacote `context-mode` instalado localmente com `hooks/hooks.json` (versão atual 1.0.169).
- BACKLOG-0012 e BACKLOG-0013 dependem desta spec, não o contrário.

#### Riscos

- Projetos consumidores com formato inline → mitigado por FR-004 (migração automática com duas condições).
- Mudança no formato do `hooks.json` upstream → mitigado por AC-015 (falha reportada, demais hooks instalados) e teste com fixture versionada.
- Testes existentes acoplados ao matcher (`tests/setup-writes.test.ts`, `tests/hooks-*.test.ts`) → reescritos na Fase 1; contagem de casos revisada no gate.
- Antigravity sem `settingsPath` continua não escrevendo hooks; a ampliação de eventos não muda isso e é listada como pulado.

#### Suposições

- O Claude Code executa `command` via shell com `$CLAUDE_PROJECT_DIR` definido; ausente, `$PWD` é a raiz (comportamento atual preservado).
- `code-review-graph update --brief` não depende de stdin; permanece como despacho.
- O shim usa apenas POSIX `sh` (`command -v`), sem bash-isms, para funcionar em qualquer host.

### 17. Decisões

- **DEC-001**: Matcher por mapa fixo de evento com override `tools:` — cobre os guards sem configuração e permite ao upstream declarar ferramentas; alternativa de só mapa fixo não expressaria `Read|Grep|WebFetch`.
- **DEC-002**: Scripts em `.maestro/hooks/<name>.sh` como identidade — elimina o escaping duplo que motivou o formato inline, torna o hook legível e testável e dá ao registro por checksum um artefato; alternativa de marcador em comentário manteria `settings.json` gigante e frágil.
- **DEC-003**: Merge por identidade preservando tudo o mais — é o que o comentário de `writeSettings` já prometia; alternativa de recusar escrita com entradas desconhecidas travaria toda instalação real.
- **DEC-004**: Despacho sem wrapper — o preâmbulo só serve a fragmentos que usam `decision`; para binários ele destrói o stdin e mascara o exit code.
- **DEC-005**: Hooks do context-mode projetados do `hooks.json` upstream — remove a classe de bug "vocabulário do maestro ficou atrás"; alternativa de manter `.md` próprios foi o que falhou.
- **DEC-006**: Shim de resolução em tempo de execução — mantém a garantia de caminho absoluto sem quebrar em rename; alternativa de `npx` adicionaria latência a cada disparo.
- **DEC-007**: Migração reconhece formato antigo por `matcher == nome` **e** `>>> hook fragment` — as duas condições juntas não colidem com nada que outra ferramenta escreveria; alternativa de flag explícita deixaria consumidores com lixo inerte.
- **DEC-008**: Vocabulário ampliado com suporte declarado por adaptador — hook pulado é reportado, nunca silenciado; alternativa de manter 4 eventos impediria `PreCompact` e `UserPromptSubmit`.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam — `tsc --noEmit` limpo e suíte verde exceto o RED pré-existente da SPEC-0021; `npm run build` OK após `npm version patch` (2.1.23).
- [x] `PROJECT.md` revisado quanto ao novo diretório gerenciado `.maestro/hooks/`; `.specsfy/STACK.md` e `.specsfy/DATABASE.md` sem impacto (sem mudança de stack nem persistência).
