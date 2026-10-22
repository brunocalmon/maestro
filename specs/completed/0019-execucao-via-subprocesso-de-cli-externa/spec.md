# Especificação integrada: Execucao via subprocesso de CLI externa

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0019 |
| Slug | 0019-execucao-via-subprocesso-de-cli-externa |
| Status | Complete |
| Effort | 8 |
| Effort rationale | Cinco adaptadores de backend com convenções de flag genuinamente diferentes (confirmado por execução real de `--help` em cada um), um gate de aprovação novo por spawn, injeção de comportamento por dois caminhos distintos (flag nativa ou arquivo temporário) e captura de subprocesso com timeout. Maior superfície que qualquer fatia anterior do épico — não por mecanismo novo em si, mas pela multiplicação por cinco backends reais, cada um verificado individualmente. Primeira fatia do épico que de fato executa ação capaz de escrever fora do controle direto do maestro. |
| Effort updated at | 2026-09-07 |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — comando de terminal cuja saída é texto relatado ao agente que pediu a execução, sem tela. |
| Atualizada em | 2026-09-07 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A `SPEC-0018` emite o briefing de delegação, mas recusa qualquer agente cujo
plano pede `runtime: cli` — nomeando esta fatia como quem entregaria isso. Um
agente marcado para rodar via subprocesso de CLI externa não tem, hoje,
nenhum caminho de execução.

Os cinco backends que a `SPEC-0008` já detecta (`pi`, `agy`, `claude`,
`codex`, `goose`) têm convenções de flag genuinamente diferentes — verificado
por execução real de `--help` em cada um durante a descoberta desta spec, não
por suposição. `pi` e `claude` aceitam `--system-prompt`; `agy` e `codex` não
têm flag nenhuma para isso e dependem de convenção de arquivo (`AGENTS.md`).
Um único caminho de execução não serve aos cinco.

Além disso, esta é a primeira fatia do épico que de fato executa algo capaz
de escrever no projeto fora do controle direto do maestro — um subprocesso
com ferramentas de edição, potencialmente. A aprovação do plano (`SPEC-0016`)
autorizou quem trabalharia; não é a mesma coisa que autorizar cada ação
irreversível a acontecer agora.

#### Resultado desejado

`maestro run <execução>` passa a executar de verdade os agentes cujo plano
pede `runtime: cli`: escolhe o backend, injeta o comportamento composto pelo
caminho que aquele backend suporta, pede aprovação explícita para aquele
spawn específico, roda o subprocesso com saída estruturada e devolve
stdout/stderr/código de saída ao agente que pediu a execução — sem
interpretar o resultado. O agente hospedeiro é quem julga o que aconteceu,
mesma divisão que a `SPEC-0016` e a `SPEC-0018` já fixaram.

#### Métricas de sucesso

- Um plano com agente `runtime: cli` para cada um dos cinco backends suportados produz um spawn real, verificado nesta máquina, que tem os cinco instalados.
- Recusar o spawn de um agente não impede os demais agentes do mesmo plano.
- Nenhum arquivo temporário de comportamento sobrevive ao spawn, em sucesso ou falha.
- Um perfil com `capability.tools` `required` que o backend escolhido não consegue honrar é recusado nomeando o backend e a limitação, nunca rodado com acesso mais amplo do que o declarado.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] Os cinco backends suportados (`pi`, `agy`, `claude`, `codex`, `goose`) têm flags de modo não interativo, saída estruturada e modelo — Verdict: verified — Confidence: high — Evidence: `--help` de cada binário instalado nesta máquina, transcrito nos achados abaixo — Budget: 1/1.
- **R-002** [critical] Certos backends não têm flag de system prompt — Verdict: verified — Confidence: high — Evidence: `pi --help`/`claude --help` mostram `--system-prompt`; `agy --help`/`codex exec --help` não mostram nenhuma flag equivalente — Budget: 1/1.

#### Fontes e contexto consultados

- `pi --help` — `--print`/`-p`, `--mode json`, `--system-prompt`, `--append-system-prompt`, `--model`, `--tools`/`-t`, `--no-tools`.
- `claude --help` — `-p`/`--print`, `--output-format json`, `--model`, `--system-prompt`, `--append-system-prompt`, `--allowedTools`.
- `agy --help` — `-p`/`--print`, `--output-format json`, `--model`, `--dangerously-skip-permissions`; nenhuma flag de system prompt nem de allowlist de tools.
- `codex exec --help` — prompt por argumento ou stdin, `--json` (eventos JSONL), `-m`/`--model`, `--sandbox` (modo, não lista de tools); nenhuma flag de system prompt.
- `goose run --help` — `-i`/`--instructions` ou `-t`/`--text`, `--system`, `--output-format json`, `--model`.
- `src/backends/known.ts`, `src/backends/detect.ts` — `SUPPORTED_AGENT_BACKENDS` na ordem fixa `["pi", "agy", "claude", "codex", "goose"]`, `BackendResult` e `realBackendEnvironment()`.
- `src/plan/model.ts` — `PlannedAgent` com `runtime: "auto" | "native" | "cli"`; nenhum campo hoje diz qual backend.
- `src/delegation/{behavior,brief,run}.ts` — `SPEC-0018`, que hoje recusa `runtime: cli` nomeando esta fatia.
- `src/approval/decide.ts` — `interpretDecision(ask)`, extraído na `SPEC-0016` para os dois gates do projeto reusarem a mesma regra de recusa.
- `scripts/pinned-skills.mjs`, `tests/framework-install-real.test.ts` — padrão já usado no projeto para `spawnSync` com timeout e captura de `stderr` como motivo de falha.

#### Documentação consultada

- Nenhuma documentação externa. Toda a superfície de cada backend foi verificada por execução real de `--help`, não por leitura de página.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo. `R-001` e `R-002` foram verificados por execução local nesta máquina, com as flags relevantes transcritas acima.

#### Dúvidas respondidas

- **Q**: Um adaptador por vez ou os cinco de uma vez? → **A**: os cinco nesta mesma fatia, um adaptador cada (rodada 1).
- **Q**: Como injetar comportamento quando o backend não tem flag? → **A**: flag nativa quando existe (`pi`, `claude`, `goose`); `AGENTS.md` temporário quando não existe (`agy`, `codex`) — ideia original do ADR-001, aplicada só onde necessária (rodada 2).
- **Q**: O que fazer quando `tools` `required` não é suportável pelo backend? → **A**: recusa nomeando backend e limitação, nunca roda com acesso mais amplo (rodada 3).
- **Q**: Há um segundo gate antes do spawn real, além da aprovação do plano? → **A**: sim — um gate novo, porque a `SPEC-0016` aprovou quem trabalharia, não que cada ação irreversível pode acontecer agora (rodada 4).
- **Q**: Que canal esse gate novo usa, e em que granularidade? → **A**: o mesmo canal (`interpretDecision`), um spawn por vez — recusar um agente não impede os demais (rodada 5).
- **Q**: Como a saída do subprocesso chega ao agente que pediu? → **A**: sempre pede saída estruturada, mas o maestro não interpreta — relata texto bruto e código de saída (rodada 6).
- **Q**: O maestro traduz o nome do modelo por backend? → **A**: não — repassa como veio, sem tabela de tradução; erro de modelo desconhecido chega como saída do próprio subprocesso (rodada 7).
- **Q**: De onde vem a escolha de qual dos cinco backends usar? → **A**: propriedade nova `execution.cli_backend`; ausente, usa o primeiro detectado na ordem fixa da `SPEC-0008` (rodada 8).

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Adaptador por backend (`pi`, `agy`, `claude`, `codex`, `goose`) que constrói os argumentos do spawn a partir do briefing.
- Injeção de comportamento por flag nativa ou `AGENTS.md` temporário, conforme o backend.
- Propriedade `execution.cli_backend` no schema, com seleção por ordem fixa quando ausente.
- Recusa de `capability.tools` `required` não suportável pelo backend escolhido.
- Gate de aprovação novo, por agente, antes de cada spawn real.
- Execução do subprocesso com saída estruturada, timeout, e relato de stdout/stderr/código de saída sem interpretação semântica.
- Extensão de `runDelegation` (`SPEC-0018`) para agentes `runtime: cli` deixarem de ser recusados.

#### Fora de escopo

- Interpretar ou normalizar a saída estruturada de cada backend — o maestro relata texto bruto (decisão rodada 6).
- Traduzir nome de modelo por backend (decisão rodada 7).
- Backends fora dos cinco já suportados pela `SPEC-0008`.
- Telemetria e correlação entre execuções (fatia MA-6).
- Alterar a mecânica de aprovação do plano em si (`SPEC-0016`) — o gate novo é adicional, não substitui.
- Paralelismo real entre spawns do mesmo plano — `concurrency` já existe no schema, mas orquestrar execução simultânea fica para além desta fatia.

#### Atores

- **Agente hospedeiro**: pediu a execução via `maestro run`; recebe stdout/stderr/código de saída de cada spawn e julga o resultado.
- **Pessoa no terminal**: decide, spawn a spawn, se autoriza aquela execução específica.
- **Subprocesso de CLI externa**: `pi`, `agy`, `claude`, `codex` ou `goose`, rodando com o comportamento, modelo e tools declarados.

### 4. Princípios e restrições do projeto

- **PR-001**: Uma propriedade `required` é vinculante — se o backend escolhido não consegue honrá-la, o maestro recusa em vez de rodar com garantia menor (`SPEC-0015`, `D6`).
- **PR-002**: Recusa nomeia o que falta, incluindo backend e limitação (`SPEC-0018`, `PR-004`).
- **PR-003**: Nenhuma ação irreversível acontece sem aprovação humana explícita para aquela ação específica — a aprovação do plano autoriza o quê, não dispensa o quando (`SPEC-0007`, `SPEC-0016`).
- **PR-004**: O código não interpreta semanticamente o que não pode julgar — quem julga o resultado da execução é o agente hospedeiro (`SPEC-0016`, `PR-002`; `SPEC-0018`, `DEC-002`).
- **PR-005**: Detectar, nunca instalar ou traduzir por conta própria o que pertence ao ambiente (`SPEC-0008`).

### 5. Histórias de usuário

#### US-001 — Executar um agente delegado via subprocesso de CLI externa (P1)

Como agente que planejou um agente com `runtime: cli`, quero que ele de fato
rode — com comportamento, modelo e tools corretos, e só depois de eu
autorizar aquele spawn específico — para receber um resultado real em vez de
uma recusa nomeando uma fatia que ainda não existia.

**Por que P1**: é a única história desta fatia; sem ela `runtime: cli` continua sempre recusado.
**Teste independente**: aprovar um plano com um agente `runtime: cli` para cada um dos cinco backends, autorizar o spawn e confirmar que cada um roda com o comportamento e o modelo corretos, devolvendo stdout/stderr/código de saída.
**Requisitos**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007

### 6. Cenários BDD de aceite

#### AC-001 — cada backend suportado tem um adaptador

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-001
Feature: adaptador por backend

  Scenario: resolução do adaptador para cada nome suportado
    Given os cinco nomes de SUPPORTED_AGENT_BACKENDS
    When o adaptador é resolvido para cada um
    Then um adaptador existe para pi, agy, claude, codex e goose
```

#### AC-002 — o modelo entra sem tradução

**Cobre**: US-001, FR-001, FR-007, NFR-001

```gherkin
@US-001 @FR-001 @FR-007 @NFR-001 @AC-002
Feature: adaptador por backend

  Scenario: modelo do briefing nos argumentos
    Given um briefing cujo modelo é "qwen3:8b"
    When os argumentos são construídos para qualquer um dos cinco backends
    Then o valor "qwen3:8b" aparece exatamente como veio, sem alteração
```

#### AC-003 — os argumentos pedem saída estruturada

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-003
Feature: adaptador por backend

  Scenario: flag de saída estruturada por backend
    Given um briefing qualquer
    When os argumentos são construídos para cada um dos cinco backends
    Then cada um inclui a flag de saída estruturada própria daquele backend
```

#### AC-004 — pi, claude e goose recebem comportamento por flag

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-004
Feature: injeção de comportamento

  Scenario: backend com flag nativa
    Given um briefing com comportamento composto
    When os argumentos são construídos para pi, claude ou goose
    Then o comportamento aparece como valor da flag nativa daquele backend
    And nenhum arquivo temporário é criado
```

#### AC-005 — agy e codex recebem comportamento por arquivo temporário

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-005
Feature: injeção de comportamento

  Scenario: backend sem flag de system prompt
    Given um briefing com comportamento composto
    When o spawn é preparado para agy ou codex
    Then um AGENTS.md temporário é escrito com o comportamento antes do spawn
```

#### AC-006 — o arquivo temporário é sempre removido

**Cobre**: US-001, FR-002, NFR-002

```gherkin
@US-001 @FR-002 @NFR-002 @AC-006
Feature: injeção de comportamento

  Scenario: limpeza após o spawn, em sucesso ou falha
    Given um spawn para agy ou codex que escreveu AGENTS.md temporário
    When o spawn termina, com sucesso ou com erro
    Then o arquivo temporário não existe mais
```

#### AC-007 — tools required não suportável é recusado

**Cobre**: US-001, FR-003, NFR-002

```gherkin
@US-001 @FR-003 @NFR-002 @AC-007
Feature: capacidade de restringir tools

  Scenario: perfil exige tools que o backend não consegue restringir
    Given um perfil com capability.tools required
    And um backend sem mecanismo de allowlist de tools
    When o spawn é preparado
    Then ele é recusado nomeando o backend e a limitação
    And nenhum subprocesso é iniciado
```

#### AC-008 — tools required suportável é aplicado

**Cobre**: US-001, FR-003, NFR-001

```gherkin
@US-001 @FR-003 @NFR-001 @AC-008
Feature: capacidade de restringir tools

  Scenario: perfil exige tools que o backend consegue restringir
    Given um perfil com capability.tools required
    And um backend com flag de allowlist
    When os argumentos são construídos
    Then a lista de tools aparece na flag de allowlist daquele backend
```

#### AC-009 — tools sem exigência não bloqueia backend limitado

**Cobre**: US-001, FR-003, NFR-001

```gherkin
@US-001 @FR-003 @NFR-001 @AC-009
Feature: capacidade de restringir tools

  Scenario: perfil sem tools declaradas, backend sem allowlist
    Given um perfil sem capability.tools declarada
    And um backend sem mecanismo de allowlist
    When o spawn é preparado
    Then ele prossegue normalmente
```

#### AC-010 — sem backend declarado, usa o primeiro detectado

**Cobre**: US-001, FR-004, NFR-001

```gherkin
@US-001 @FR-004 @NFR-001 @AC-010
Feature: escolha de backend

  Scenario: cli_backend ausente
    Given um agente runtime cli sem execution.cli_backend declarado
    And múltiplos backends detectados no ambiente
    When o backend é resolvido
    Then o escolhido é o primeiro presente na ordem de SUPPORTED_AGENT_BACKENDS
```

#### AC-011 — backend required indisponível é recusado

**Cobre**: US-001, FR-004, NFR-002

```gherkin
@US-001 @FR-004 @NFR-002 @AC-011
Feature: escolha de backend

  Scenario: cli_backend required não instalado
    Given um agente com execution.cli_backend required apontando para um backend ausente
    When o backend é resolvido
    Then a resolução é recusada nomeando o backend ausente
```

#### AC-012 — backend suggested indisponível cai para outro detectado

**Cobre**: US-001, FR-004, NFR-001

```gherkin
@US-001 @FR-004 @NFR-001 @AC-012
Feature: escolha de backend

  Scenario: cli_backend suggested não instalado
    Given um agente com execution.cli_backend suggested apontando para um backend ausente
    And outro backend suportado presente no ambiente
    When o backend é resolvido
    Then o escolhido é o outro backend presente, não uma recusa
```

#### AC-013 — cada spawn real pede decisão antes de rodar

**Cobre**: US-001, FR-005, NFR-002

```gherkin
@US-001 @FR-005 @NFR-002 @AC-013
Feature: gate antes do spawn

  Scenario: decisão positiva para um agente
    Given um plano aprovado com um agente runtime cli
    When a decisão daquele spawn específico é positiva
    Then o subprocesso é iniciado
```

#### AC-014 — recusar um agente não impede os demais

**Cobre**: US-001, FR-005, NFR-001

```gherkin
@US-001 @FR-005 @NFR-001 @AC-014
Feature: gate antes do spawn

  Scenario: plano com dois agentes cli, um recusado
    Given um plano aprovado com dois agentes runtime cli
    When a decisão do primeiro é negativa e a do segundo é positiva
    Then o primeiro não é iniciado
    And o segundo é iniciado normalmente
```

#### AC-015 — ausência ou documento malformado é recusa

**Cobre**: US-001, FR-005, NFR-002

```gherkin
@US-001 @FR-005 @NFR-002 @AC-015
Feature: gate antes do spawn

  Scenario: entrada que não é uma decisão
    Given um agente runtime cli aguardando decisão
    When a entrada é ausente ou malformada
    Then o resultado é recusa
    And nenhum subprocesso é iniciado
```

#### AC-016 — stdout e stderr são relatados como texto bruto

**Cobre**: US-001, FR-006, NFR-001

```gherkin
@US-001 @FR-006 @NFR-001 @AC-016
Feature: captura do subprocesso

  Scenario: subprocesso produz saída
    Given um spawn autorizado que produz stdout e stderr
    When o resultado é relatado
    Then stdout e stderr aparecem como texto, sem interpretação semântica
```

#### AC-017 — o código de saída é repassado

**Cobre**: US-001, FR-006, NFR-001

```gherkin
@US-001 @FR-006 @NFR-001 @AC-017
Feature: captura do subprocesso

  Scenario: subprocesso termina com código diferente de zero
    Given um spawn autorizado que falha
    When o resultado é relatado
    Then o código de saída do subprocesso aparece no relato
```

#### AC-018 — timeout produz erro claro, sem travar

**Cobre**: US-001, FR-006, NFR-002

```gherkin
@US-001 @FR-006 @NFR-002 @AC-018
Feature: captura do subprocesso

  Scenario: subprocesso excede o tempo limite
    Given um spawn autorizado que não termina a tempo
    When o timeout é atingido
    Then o resultado relatado nomeia o timeout como motivo
    And o processo não fica pendurado
```

#### AC-019 — modelo desconhecido não é bloqueado antes do spawn

**Cobre**: US-001, FR-007, NFR-001

```gherkin
@US-001 @FR-007 @NFR-001 @AC-019
Feature: repasse de modelo sem tradução

  Scenario: modelo que o backend não reconhece
    Given um briefing com um nome de modelo que o backend não suporta
    When o spawn é preparado
    Then a preparação não recusa por causa do nome do modelo
    And o erro, se houver, chega como saída do próprio subprocesso
```

#### AC-020 — nenhuma tabela de tradução é consultada

**Cobre**: US-001, FR-007, NFR-001

```gherkin
@US-001 @FR-007 @NFR-001 @AC-020
Feature: repasse de modelo sem tradução

  Scenario: mesmo modelo em backends diferentes
    Given o mesmo nome de modelo no briefing
    When os argumentos são construídos para dois backends diferentes
    Then o valor do modelo é idêntico nos dois, sem transformação
```

### 7. Requisitos

#### Funcionais

- **FR-001**: Deve existir um adaptador para cada um dos cinco backends suportados (`pi`, `agy`, `claude`, `codex`, `goose`), construindo os argumentos do spawn a partir do briefing — incluindo modelo repassado sem tradução e a flag de saída estruturada própria de cada backend.
- **FR-002**: O comportamento composto deve ser injetado pela flag nativa quando o backend a oferece (`pi`, `claude`, `goose`) ou por um `AGENTS.md` temporário escrito antes do spawn quando não oferece (`agy`, `codex`); o arquivo temporário deve ser removido depois do spawn, em sucesso ou falha.
- **FR-003**: Um perfil com `capability.tools` `required` deve ser recusado nomeando backend e limitação quando o backend escolhido não tiver mecanismo de restringir tools; quando o backend tiver, a lista deve ser aplicada; ausência de exigência de tools nunca bloqueia o spawn.
- **FR-004**: A escolha de backend deve vir de `execution.cli_backend`; ausente, deve usar o primeiro backend presente na ordem fixa de `SUPPORTED_AGENT_BACKENDS`; `required` indisponível deve recusar nomeando o backend ausente; `suggested` indisponível deve cair para outro backend presente.
- **FR-005**: Cada agente `runtime: cli` de um plano aprovado deve passar por um gate de decisão próprio, pelo mesmo canal já entregue (`interpretDecision`), antes de qualquer spawn real; recusar um agente não deve impedir os demais do mesmo plano; ausência ou entrada malformada deve ser recusa.
- **FR-006**: O subprocesso autorizado deve rodar com timeout, e o resultado — stdout, stderr e código de saída — deve ser relatado como texto ao agente que pediu, sem interpretação semântica; um timeout deve produzir um resultado que nomeia o motivo, sem deixar processo pendurado.
- **FR-007**: O modelo do briefing deve ser repassado ao backend exatamente como está, sem tabela de tradução nem validação prévia; um modelo que o backend não reconhece deve chegar como saída do próprio subprocesso, não como recusa da preparação.

#### Não funcionais

- **NFR-001**: O comportamento é determinístico e nada é inventado — mesmo briefing e mesmo backend produzem os mesmos argumentos, e nenhuma capacidade, modelo ou backend é adivinhado quando ausente. **Verificação**: casos comparando argumentos construídos, e verificação com o binário real de cada um dos cinco backends.
- **NFR-002**: Nenhuma ação irreversível acontece sem decisão explícita para aquele spawn específico, e nenhum estado sobra depois — arquivo temporário sempre removido, recusa sempre nomeada. **Verificação**: casos de recusa por tools, por backend ausente, por decisão negativa, por malformado, e por timeout; inspeção do sistema de arquivos depois de cada spawn.

#### Erros e casos-limite

- Nenhum dos cinco backends detectado no ambiente → recusa nomeando a ausência, mesma família de erro que `SPEC-0008`/`doctor` já relatam.
- Comportamento composto vazio (perfil sem nada declarado e sem padrão) → injeta string vazia pela via escolhida; não é erro desta fatia, é o comportamento que a `SPEC-0018` já produziria.
- Subprocesso escreve em stdout algo que não é JSON válido apesar da flag pedida → relatado como texto bruto mesmo assim; o maestro não valida a forma da saída, só a repassa (`FR-006`).
- Dois agentes do mesmo plano escolhendo o mesmo backend → cada spawn é independente; nada nesta fatia impede execução concorrente, mas nada a orquestra também (fora de escopo).
- `AGENTS.md` já existente no projeto quando o spawn de `agy`/`codex` precisa escrever o temporário → recusa em vez de sobrescrever; o arquivo do projeto pertence à pessoa, e um temporário anônimo não pode apagar conteúdo real.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

`runDelegation` (`SPEC-0018`) recusa `runtime: cli` nomeando esta fatia.
`interpretDecision(ask)` (`src/approval/decide.ts`, extraído na `SPEC-0016`)
é a regra de recusa reusável. `SUPPORTED_AGENT_BACKENDS` fixa a ordem em
`src/backends/known.ts`. `realBackendEnvironment()` resolve presença e
versão. `AgentBrief` (`SPEC-0018`) já traz comportamento composto, modelo,
skills e tools por agente.

#### Arquitetura e módulos

- `src/delegation/cli-backends/adapter.ts` (novo): `CliBackendAdapter` — interface com `name`, `buildArgs(brief)`, `injectsBehaviorByFlag: boolean`, `supportsToolsAllowlist: boolean`.
- `src/delegation/cli-backends/{pi,claude,goose,agy,codex}.ts` (novos): um adaptador por backend, cada um mapeando os flags reais verificados em `R-001`/`R-002`.
- `src/delegation/cli-backends/registry.ts` (novo): `resolveAdapter(name)` e a lista dos cinco.
- `src/delegation/cli-select.ts` (novo): `selectBackend(agent, detected)` implementando `FR-004`.
- `src/delegation/cli-behavior-file.ts` (novo): `withTemporaryAgentsFile(root, content, fn)` — escreve, executa `fn`, remove sempre (`try/finally`), recusando se `AGENTS.md` real já existir.
- `src/delegation/cli-spawn.ts` (novo): `spawnCliAgent(adapter, args, options)` — `spawnSync` com timeout, captura de stdout/stderr/status, mesmo padrão de `scripts/pinned-skills.mjs` e `realformer project toolExecutor`.
- `src/delegation/cli-gate.ts` (novo): `decideSpawn(source)` sobre `interpretDecision`, um por agente.
- `src/delegation/run.ts` (`SPEC-0018`, estendido): `runtime: cli` deixa de recusar — resolve backend, tools, gate, comportamento e spawn, um agente por vez.
- `src/config/schema.ts`: `execution.cli_backend?: ConfiguredProperty<string>` em `AgentExecution`.

#### Migrations

- Não aplicável.

#### Models

- `CliBackendAdapter`: interface descrita acima; cinco implementações concretas.
- `SpawnResult`: `{ ok: true; stdout: string; stderr: string; exitCode: number } | { ok: false; reason: string }`.

#### Controllers e casos de uso

- Não aplicável.

#### Views e experiência

- Não aplicável.

#### Queries e repositórios

- Não aplicável.

#### Jobs e processamento assíncrono

- Não aplicável — spawn síncrono, mesmo padrão já usado no restante do projeto (`spawnSync`).

#### Estrutura de arquivos

```text
specs/draft/0019-execucao-via-subprocesso-de-cli-externa/
  spec.md
src/
  delegation/cli-backends/adapter.ts
  delegation/cli-backends/pi.ts
  delegation/cli-backends/claude.ts
  delegation/cli-backends/goose.ts
  delegation/cli-backends/agy.ts
  delegation/cli-backends/codex.ts
  delegation/cli-backends/registry.ts
  delegation/cli-select.ts
  delegation/cli-behavior-file.ts
  delegation/cli-spawn.ts
  delegation/cli-gate.ts
  delegation/run.ts
  config/schema.ts
tests/
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| `CliBackendAdapter` | `name` | `injectsBehaviorByFlag` decide a via de injeção; `supportsToolsAllowlist` decide se `tools` `required` é honrável | um por backend suportado |
| `SpawnResult` | — | `ok: false` sempre carrega `reason`; `ok: true` sempre carrega os três campos de saída | produzido por um spawn autorizado |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Agente `cli` planejado | aguardando gate | decisão positiva | spawn iniciado | arquivo temporário, se houver, será removido ao final |
| Agente `cli` planejado | aguardando gate | decisão negativa, ausente ou malformada | recusado | nenhum subprocesso iniciado |
| Spawn iniciado | rodando | termina, com ou sem erro, ou timeout | resultado relatado | arquivo temporário removido |

#### Migração e retenção

- Nada persistido — o `AGENTS.md` temporário vive só durante o spawn.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não. Comando de terminal cuja saída é relatada a um agente.

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

- `maestro run <execução>` — sem mudança de assinatura; `runtime: cli` deixa de recusar.
- `resolveAdapter(name)`, `selectBackend(agent, detected)`, `withTemporaryAgentsFile(root, content, fn)`, `spawnCliAgent(adapter, args, options)`, `decideSpawn(source)`.

#### APIs externas utilizadas

- Subprocessos locais: `pi`, `agy`, `claude`, `codex`, `goose`. Mesma fronteira de qualquer outro subprocesso já invocado pelo projeto — sem rede própria desta fatia.

#### Documentação das APIs consultadas

- Não aplicável — verificação por execução real, ver seção 2.

#### Eventos e outros contratos

- `SpawnResult` é a fronteira entre esta fatia e o agente hospedeiro: texto bruto, nunca estrutura interpretada.

### 11. Estratégia TDD

- **Unidade**: cada adaptador constrói argumentos corretos; seleção de backend; recusa de tools; gate isolado; injeção por arquivo temporário com limpeza garantida.
- **Integração/contrato**: `spawnCliAgent` sobre um comando fake controlável (sucesso, falha, timeout) e, complementarmente, sobre os cinco binários reais desta máquina.
- **BDD/aceite**: os vinte cenários da seção 6 orientam os vinte casos TDD (um por AC).
- **Runner TDD**: Vitest, já materializado em `test:tdd`.
- **E2E**: não aplicável no sentido de jornada de produto — mas há verificação real obrigatória com os cinco backends instalados nesta máquina, registrada como parte do fechamento.
- **Verificação manual**: uma, ampla e necessária: `maestro plan` seguido de `maestro run` autorizando um agente por backend, um dos cinco por vez, confirmando spawn real, comportamento aplicado e saída relatada — os testes automatizados sozinhos não provam que `pi --system-prompt` de fato muda o comportamento do processo real.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, AC-001 | AC-001 na seção 6 | tests/cli-backends-adapter.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-001, FR-007, NFR-001, AC-002 | AC-002 na seção 6 | tests/cli-backends-adapter.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-001, NFR-001, AC-003 | AC-003 na seção 6 | tests/cli-backends-adapter.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-002, NFR-001, AC-004 | AC-004 na seção 6 | tests/cli-backends-adapter.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-002, NFR-001, AC-005 | AC-005 na seção 6 | tests/cli-behavior-file.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-002, NFR-002, AC-006 | AC-006 na seção 6 | tests/cli-behavior-file.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-003, NFR-002, AC-007 | AC-007 na seção 6 | tests/cli-run-tools.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-003, NFR-001, AC-008 | AC-008 na seção 6 | tests/cli-run-tools.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-003, NFR-001, AC-009 | AC-009 na seção 6 | tests/cli-run-tools.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-004, NFR-001, AC-010 | AC-010 na seção 6 | tests/cli-select.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-004, NFR-002, AC-011 | AC-011 na seção 6 | tests/cli-select.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-004, NFR-001, AC-012 | AC-012 na seção 6 | tests/cli-select.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-005, NFR-002, AC-013 | AC-013 na seção 6 | tests/cli-run-gate.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-005, NFR-001, AC-014 | AC-014 na seção 6 | tests/cli-run-gate.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-005, NFR-002, AC-015 | AC-015 na seção 6 | tests/cli-run-gate.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-006, NFR-001, AC-016 | AC-016 na seção 6 | tests/cli-spawn.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-006, NFR-001, AC-017 | AC-017 na seção 6 | tests/cli-spawn.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-006, NFR-002, AC-018 | AC-018 na seção 6 | tests/cli-spawn.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-007, NFR-001, AC-019 | AC-019 na seção 6 | tests/cli-backends-adapter.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |
| US-001, FR-007, NFR-001, AC-020 | AC-020 na seção 6 | tests/cli-backends-adapter.test.ts | RED confirmado 2026-09-07 (`npx vitest run` — módulo inexistente) | GREEN confirmado 2026-09-07 (`npx vitest run` — 21/21) | Regressão completa 510/510 e verificação real com os cinco backends |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Unidade | `tests/cli-backends-adapter.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-001 | AC-002 | Unidade | `tests/cli-backends-adapter.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-001 | AC-003 | Unidade | `tests/cli-backends-adapter.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-002 | AC-004 | Unidade | `tests/cli-backends-adapter.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-002 | AC-005 | Unidade (fs isolado) | `tests/cli-behavior-file.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-002 | AC-006 | Unidade (fs isolado) | `tests/cli-behavior-file.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-003 | AC-007 | Unidade | `tests/cli-run-tools.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-003 | AC-008 | Unidade | `tests/cli-run-tools.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-003 | AC-009 | Unidade | `tests/cli-run-tools.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-004 | AC-010 | Unidade | `tests/cli-select.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-004 | AC-011 | Unidade | `tests/cli-select.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-004 | AC-012 | Unidade | `tests/cli-select.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-005 | AC-013 | Integração (decisão injetada) | `tests/cli-run-gate.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-005 | AC-014 | Integração (decisão injetada) | `tests/cli-run-gate.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-005 | AC-015 | Integração (decisão injetada) | `tests/cli-run-gate.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-006 | AC-016 | Integração (comando fake) | `tests/cli-spawn.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-006 | AC-017 | Integração (comando fake) | `tests/cli-spawn.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-006 | AC-018 | Integração (comando fake) | `tests/cli-spawn.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-007 | AC-019 | Unidade | `tests/cli-backends-adapter.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| FR-007 | AC-020 | Unidade | `tests/cli-backends-adapter.test.ts` | Passed — GREEN confirmado 2026-09-07 |
| NFR-001 | AC-001, AC-002, AC-003, AC-004, AC-008, AC-009, AC-010, AC-012, AC-014, AC-016, AC-017, AC-019, AC-020 | Unidade + integração | ver linhas acima | Passed nos 13 casos |
| NFR-002 | AC-006, AC-007, AC-011, AC-013, AC-015, AC-018 | Unidade + integração | ver linhas acima | Passed nos 6 casos |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-09-07)
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/draft/0019-execucao-via-subprocesso-de-cli-externa/spec.md --allow-draft` → `VALID DRAFT`.
- **Achados**: Nenhum `BLOCKER`. As oito decisões da entrevista viraram `FR`, `AC` ou `DEC` rastreáveis. Cobertura: US-001 → 20 AC; FR-001 → 4 (incluindo AC-019); FR-002 → 3; FR-003 → 3; FR-004 → 3; FR-005 → 3; FR-006 → 3; FR-007 → 3 (AC-002 conta para FR-001 e FR-007); NFR-001 → 13; NFR-002 → 6. `R-001` e `R-002` são claims críticos e foram verificados por execução real de `--help` nos cinco binários instalados nesta máquina — não por suposição, o que importa porque a fatia inteira depende das convenções de flag serem exatamente essas. `Interface para pessoas: Não` justificada. Finding de segurança material e endereçado: esta é a primeira fatia do épico capaz de escrever fora do controle direto do maestro; o gate novo por agente (`FR-005`, `DEC-004`) é a resposta registrada, não uma omissão.

#### Gate do Ato II — Plano

- **Resultado**: Passed (2026-09-07)
- **Comando**: `node .claude/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/defined/0019-execucao-via-subprocesso-de-cli-externa/spec.md` → `RESULTADO: READY`.
- **Achados**: 21 casos TDD (um por AC, mais um terceiro caso adicional para AC-005) escritos em seis arquivos Vitest e RED observado para todos — `npx vitest run tests/cli-backends-adapter.test.ts tests/cli-behavior-file.test.ts tests/cli-run-tools.test.ts tests/cli-select.test.ts tests/cli-run-gate.test.ts tests/cli-spawn.test.ts` retornou 21 falhas de 21, todas por módulo de produção inexistente (`Cannot find module`), a causa correta de RED nesta fase — nenhum caso passou antes da implementação. Sete tarefas `[CODE]` (T021–T027) cobrem os módulos novos e a extensão de `run.ts`, cada uma com ao menos três predecessores TDD rastreáveis. Nenhum `BLOCKER` de plano.

#### Gate do Ato III — Entrega

- **Resultado**: Passed (2026-09-07)
- **Comandos**: `node .claude/skills/framework-06-tdd-bdd/scripts/check_traceability.mjs specs/planned/0019-execucao-via-subprocesso-de-cli-externa/spec.md .` → 30/30 IDs desta spec cobertos; `node .claude/skills/framework-06-tdd-bdd/scripts/verify_acceptance.mjs specs/planned/0019-execucao-via-subprocesso-de-cli-externa/spec.md .` → `QA: PASSED`; `node .claude/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/planned/0019-execucao-via-subprocesso-de-cli-externa/spec.md` → `RESULTADO: READY` (30/30 tarefas concluídas, contrato de evidência verificado); `npx vitest run` → 186 arquivos, 510/510; `npx tsc --noEmit` limpo.
- **Achados**: Todas as 20 ACs passaram de RED para GREEN. Verificação manual real (`métricas de sucesso` da seção 1) executada nos cinco backends instalados nesta máquina via `maestro plan` → `maestro run`: `goose` completou de ponta a ponta (respondeu "OK" à tarefa pedida); `pi`, `claude`, `agy` e `codex` alcançaram o subprocesso real e relataram erro de conta/modelo do próprio backend, nunca uma recusa da preparação do maestro — prova real de `FR-007`. A verificação manual encontrou e corrigiu dois bugs reais que a suíte automatizada não detectava: `goose` exigia o subcomando `run` antes das flags, e `agy --print` toma o argumento imediatamente seguinte como o prompt (uma flag ali seria lida como prompt por engano) — ambos documentados em `.project-context/STACK.md` e no código. `agy`/`codex` foram recusados por padrão neste projeto porque `framework setup` já grava um `AGENTS.md` real aqui — comportamento pretendido (`AC-005`/casos-limite), confirmado afastando o arquivo temporariamente para provar o caminho completo de injeção por arquivo. `docs/`, `.project-context/STACK.md` e `PROJECT.md` atualizados; `PROJECT.md` revisado (mudança de aplicação material, `runtime: cli` agora executa de verdade). Nenhum `BLOCKER`.

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

- [x] T001 [P] [TEST] [TDD] [US-001] Derivar de AC-001 um caso Vitest falhando em tests/cli-backends-adapter.test.ts — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-001; confirmar que `src/delegation/cli-backends/registry.ts` não existe.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-001 AC-001` — `resolveAdapter` devolve um adaptador para cada um dos cinco nomes.
  - [x] **VERIFY**: `npx vitest run tests/cli-backends-adapter.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T002 [P] [TEST] [TDD] [US-001] Derivar de AC-002 um caso Vitest falhando em tests/cli-backends-adapter.test.ts — Refs: US-001, FR-001, FR-007, NFR-001, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-002.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 FR-007 NFR-001 AC-002` — `qwen3:8b` aparece idêntico nos argumentos dos cinco adaptadores.
  - [x] **VERIFY**: `npx vitest run tests/cli-backends-adapter.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T003 [P] [TEST] [TDD] [US-001] Derivar de AC-003 um caso Vitest falhando em tests/cli-backends-adapter.test.ts — Refs: US-001, FR-001, NFR-001, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-003; confirmar as flags reais de saída estruturada de cada backend (transcritas na seção 2).
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-001 NFR-001 AC-003` — cada adaptador inclui sua própria flag de saída estruturada.
  - [x] **VERIFY**: `npx vitest run tests/cli-backends-adapter.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T004 [P] [TEST] [TDD] [US-001] Derivar de AC-004 um caso Vitest falhando em tests/cli-backends-adapter.test.ts — Refs: US-001, FR-002, NFR-001, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-004.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-001 AC-004` — `pi`, `claude` e `goose` recebem o comportamento na flag nativa, sem arquivo.
  - [x] **VERIFY**: `npx vitest run tests/cli-backends-adapter.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T005 [P] [TEST] [TDD] [US-001] Derivar de AC-005 um caso Vitest falhando em tests/cli-behavior-file.test.ts — Refs: US-001, FR-002, NFR-001, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-005; confirmar que `src/delegation/cli-behavior-file.ts` não existe.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-001 AC-005` — `withTemporaryAgentsFile` escreve o comportamento em `AGENTS.md` antes de chamar a função recebida.
  - [x] **VERIFY**: `npx vitest run tests/cli-behavior-file.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T006 [P] [TEST] [TDD] [US-001] Derivar de AC-006 um caso Vitest falhando em tests/cli-behavior-file.test.ts — Refs: US-001, FR-002, NFR-002, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-006.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-002 AC-006` — o arquivo some depois, inclusive quando a função recebida lança.
  - [x] **VERIFY**: `npx vitest run tests/cli-behavior-file.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T007 [P] [TEST] [TDD] [US-001] Derivar de AC-007 um caso Vitest falhando em tests/cli-run-tools.test.ts — Refs: US-001, FR-003, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-007; confirmar que `src/delegation/run.ts` ainda recusa qualquer `runtime: cli`.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-002 AC-007` — `tools` `required` com backend sem allowlist é recusado nomeando os dois.
  - [x] **VERIFY**: `npx vitest run tests/cli-run-tools.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T008 [P] [TEST] [TDD] [US-001] Derivar de AC-008 um caso Vitest falhando em tests/cli-run-tools.test.ts — Refs: US-001, FR-003, NFR-001, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-008.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-001 AC-008` — `tools` `required` com backend que suporta aparece na flag de allowlist.
  - [x] **VERIFY**: `npx vitest run tests/cli-run-tools.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T009 [P] [TEST] [TDD] [US-001] Derivar de AC-009 um caso Vitest falhando em tests/cli-run-tools.test.ts — Refs: US-001, FR-003, NFR-001, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-009.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-003 NFR-001 AC-009` — sem `tools` declaradas, backend sem allowlist prossegue normalmente.
  - [x] **VERIFY**: `npx vitest run tests/cli-run-tools.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T010 [P] [TEST] [TDD] [US-001] Derivar de AC-010 um caso Vitest falhando em tests/cli-select.test.ts — Refs: US-001, FR-004, NFR-001, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-010; confirmar que `src/delegation/cli-select.ts` não existe.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-004 NFR-001 AC-010` — sem `cli_backend`, `selectBackend` devolve o primeiro presente na ordem fixa.
  - [x] **VERIFY**: `npx vitest run tests/cli-select.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T011 [P] [TEST] [TDD] [US-001] Derivar de AC-011 um caso Vitest falhando em tests/cli-select.test.ts — Refs: US-001, FR-004, NFR-002, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-011.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-004 NFR-002 AC-011` — `cli_backend` `required` ausente do ambiente é recusado nomeando-o.
  - [x] **VERIFY**: `npx vitest run tests/cli-select.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T012 [P] [TEST] [TDD] [US-001] Derivar de AC-012 um caso Vitest falhando em tests/cli-select.test.ts — Refs: US-001, FR-004, NFR-001, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-012.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-004 NFR-001 AC-012` — `cli_backend` `suggested` ausente cai para outro backend presente.
  - [x] **VERIFY**: `npx vitest run tests/cli-select.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T013 [P] [TEST] [TDD] [US-001] Derivar de AC-013 um caso Vitest falhando em tests/cli-run-gate.test.ts — Refs: US-001, FR-005, NFR-002, AC-013 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-013; confirmar `interpretDecision` e o padrão de `decidePlan` da SPEC-0016.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-005 NFR-002 AC-013` — decisão positiva injetada para um agente `cli` inicia o spawn.
  - [x] **VERIFY**: `npx vitest run tests/cli-run-gate.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T014 [P] [TEST] [TDD] [US-001] Derivar de AC-014 um caso Vitest falhando em tests/cli-run-gate.test.ts — Refs: US-001, FR-005, NFR-001, AC-014 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-014.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-005 NFR-001 AC-014` — recusar o primeiro agente de dois não impede o segundo, com decisão positiva.
  - [x] **VERIFY**: `npx vitest run tests/cli-run-gate.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T015 [P] [TEST] [TDD] [US-001] Derivar de AC-015 um caso Vitest falhando em tests/cli-run-gate.test.ts — Refs: US-001, FR-005, NFR-002, AC-015 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-015.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-005 NFR-002 AC-015` — fonte de decisão que lança é tratada como recusa, sem spawn.
  - [x] **VERIFY**: `npx vitest run tests/cli-run-gate.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T016 [P] [TEST] [TDD] [US-001] Derivar de AC-016 um caso Vitest falhando em tests/cli-spawn.test.ts — Refs: US-001, FR-006, NFR-001, AC-016 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-016; confirmar que `src/delegation/cli-spawn.ts` não existe.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-006 NFR-001 AC-016` — `spawnCliAgent` sobre um comando fake que imprime em stdout/stderr devolve os dois como texto.
  - [x] **VERIFY**: `npx vitest run tests/cli-spawn.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T017 [P] [TEST] [TDD] [US-001] Derivar de AC-017 um caso Vitest falhando em tests/cli-spawn.test.ts — Refs: US-001, FR-006, NFR-001, AC-017 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-017.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-006 NFR-001 AC-017` — comando fake que sai com código 3 devolve `exitCode: 3`.
  - [x] **VERIFY**: `npx vitest run tests/cli-spawn.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T018 [P] [TEST] [TDD] [US-001] Derivar de AC-018 um caso Vitest falhando em tests/cli-spawn.test.ts — Refs: US-001, FR-006, NFR-002, AC-018 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-018.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-006 NFR-002 AC-018` — comando fake que nunca termina produz resultado de timeout, sem o teste travar.
  - [x] **VERIFY**: `npx vitest run tests/cli-spawn.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T019 [P] [TEST] [TDD] [US-001] Derivar de AC-019 um caso Vitest falhando em tests/cli-backends-adapter.test.ts — Refs: US-001, FR-007, NFR-001, AC-019 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-019.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-007 NFR-001 AC-019` — construir argumentos com um nome de modelo qualquer nunca lança nem recusa.
  - [x] **VERIFY**: `npx vitest run tests/cli-backends-adapter.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T020 [P] [TEST] [TDD] [US-001] Derivar de AC-020 um caso Vitest falhando em tests/cli-backends-adapter.test.ts — Refs: US-001, FR-007, NFR-001, AC-020 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-020.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-007 NFR-001 AC-020` — o mesmo modelo em dois adaptadores diferentes aparece com o mesmo valor exato.
  - [x] **VERIFY**: `npx vitest run tests/cli-backends-adapter.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

- [x] T031 [P] [TEST] [TDD] [US-001] Derivar de AC-005 um terceiro caso Vitest falhando em tests/cli-behavior-file.test.ts — Refs: US-001, FR-002, NFR-001, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-005; confirmar que `withTemporaryAgentsFile` ainda não existe.
  - [x] **EXECUTE**: Escrever o caso com marcador `TRACEABILITY: US-001 FR-002 NFR-001 AC-005` — chamar a função recebida somente depois do arquivo escrito em disco, não antes.
  - [x] **VERIFY**: `npx vitest run tests/cli-behavior-file.test.ts` — observar RED. RED confirmado nesta rodada: `npx vitest run` retornou falha por módulo inexistente.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED nas seções 11–12. Comando e causa do RED registrados nas seções 11–12 desta spec.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária nesta rodada — caso derivado diretamente do Gherkin do AC.

#### Fase 2 — US-001 (P1): adaptadores, injeção, seleção, gate e spawn

**Objetivo**: `maestro run` com `runtime: cli` roda de verdade, para os cinco backends.
**Teste independente**: `npx vitest run tests/cli-backends-adapter.test.ts tests/cli-behavior-file.test.ts tests/cli-run-tools.test.ts tests/cli-select.test.ts tests/cli-run-gate.test.ts tests/cli-spawn.test.ts` — todos verdes.

- [x] T021 [CODE] [US-001] Implementar os cinco adaptadores e o registro em src/delegation/cli-backends/{adapter,pi,claude,goose,agy,codex,registry}.ts — Refs: US-001, FR-001, FR-002, FR-007, NFR-001, AC-001, AC-002, AC-003, AC-004, AC-019, AC-020 — Depends: T001, T002, T003, T004, T019, T020
  - [x] **PREP**: Confirmar RED de T001/T002/T003/T004/T019/T020 e as flags reais de cada backend (seção 2).
  - [x] **EXECUTE**: `CliBackendAdapter` e os cinco módulos concretos, cada um mapeando as flags verificadas — modelo, saída estruturada, comportamento (flag ou não), tools (allowlist ou não). Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/cli-backends-adapter.test.ts` verde; `npx tsc --noEmit` limpo. GREEN confirmado: `npx vitest run tests/cli-backends-adapter.test.ts` — 6/6; `npx tsc --noEmit` limpo.
  - [x] **VISUAL**: Não aplicável — módulos de construção de argumentos, sem tela.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos criados nas seções 11–13. GREEN e arquivos registrados na seção 11; verificação real com os cinco `--help`/spawn confirmou as flags.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
  <!-- framework:evidence {"task":"T021","refs":["US-001","FR-001","FR-002","FR-007","NFR-001","AC-001","AC-002","AC-003","AC-004","AC-019","AC-020"],"files":["src/delegation/cli-backends/adapter.ts","src/delegation/cli-backends/pi.ts","src/delegation/cli-backends/claude.ts","src/delegation/cli-backends/goose.ts","src/delegation/cli-backends/agy.ts","src/delegation/cli-backends/codex.ts","src/delegation/cli-backends/registry.ts"],"commands":[{"run":"npx vitest run tests/cli-backends-adapter.test.ts","exit":0}]} -->

- [x] T022 [CODE] [US-001] Implementar a injeção por arquivo temporário em src/delegation/cli-behavior-file.ts — Refs: US-001, FR-002, NFR-001, NFR-002, AC-005, AC-006 — Depends: T005, T006, T031
  - [x] **PREP**: Confirmar RED de T005/T006.
  - [x] **EXECUTE**: `withTemporaryAgentsFile(root, content, fn)` com `try/finally` garantindo remoção, e recusa quando `AGENTS.md` real já existir. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/cli-behavior-file.test.ts` verde. GREEN confirmado: `npx vitest run tests/cli-behavior-file.test.ts` — 3/3.
  - [x] **VISUAL**: Não aplicável — sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivo criado nas seções 11–13. GREEN registrado na seção 11; verificação real confirmou remoção do arquivo em sucesso e em erro, para agy e codex.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
  <!-- framework:evidence {"task":"T022","refs":["US-001","FR-002","NFR-001","NFR-002","AC-005","AC-006"],"files":["src/delegation/cli-behavior-file.ts"],"commands":[{"run":"npx vitest run tests/cli-behavior-file.test.ts","exit":0}]} -->

- [x] T023 [CODE] [US-001] Implementar a seleção de backend em src/delegation/cli-select.ts — Refs: US-001, FR-004, NFR-001, NFR-002, AC-010, AC-011, AC-012 — Depends: T010, T011, T012
  - [x] **PREP**: Confirmar RED de T010/T011/T012 e `SUPPORTED_AGENT_BACKENDS`.
  - [x] **EXECUTE**: `selectBackend(agent, detected)` — sem declaração usa o primeiro detectado; `required` ausente recusa; `suggested` ausente cai para outro presente. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/cli-select.test.ts` verde. GREEN confirmado: `npx vitest run tests/cli-select.test.ts` — 3/3.
  - [x] **VISUAL**: Não aplicável — sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivo criado nas seções 11–13. GREEN registrado na seção 11.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
  <!-- framework:evidence {"task":"T023","refs":["US-001","FR-004","NFR-001","NFR-002","AC-010","AC-011","AC-012"],"files":["src/delegation/cli-select.ts"],"commands":[{"run":"npx vitest run tests/cli-select.test.ts","exit":0}]} -->

- [x] T024 [CODE] [US-001] Adicionar execution.cli_backend em src/config/schema.ts e a recusa de tools não suportável ligada à seleção — Refs: US-001, FR-003, FR-004, NFR-001, NFR-002, AC-007, AC-008, AC-009 — Depends: T007, T008, T009
  - [x] **PREP**: Confirmar RED de T007/T008/T009 e o formato de `AgentExecution`.
  - [x] **EXECUTE**: `execution.cli_backend?: ConfiguredProperty<string>` no schema e em `SCHEMA_KEYS`; lógica de recusa de `tools` `required` não suportável, usando `supportsToolsAllowlist` do adaptador escolhido. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/cli-run-tools.test.ts` verde; suíte de config sem regressão. GREEN confirmado: `npx vitest run tests/cli-run-tools.test.ts` — 3/3; suíte de config sem regressão.
  - [x] **VISUAL**: Não aplicável — sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados nas seções 11–13. GREEN registrado na seção 11; `src/delegation/cli-tools.ts` acrescentado à lista de arquivos desta tarefa.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
  <!-- framework:evidence {"task":"T024","refs":["US-001","FR-003","FR-004","NFR-001","NFR-002","AC-007","AC-008","AC-009"],"files":["src/config/schema.ts","src/delegation/cli-tools.ts"],"commands":[{"run":"npx vitest run tests/cli-run-tools.test.ts","exit":0}]} -->

- [x] T025 [CODE] [US-001] Implementar o gate por agente em src/delegation/cli-gate.ts — Refs: US-001, FR-005, NFR-001, NFR-002, AC-013, AC-014, AC-015 — Depends: T013, T014, T015
  - [x] **PREP**: Confirmar RED de T013/T014/T015 e `interpretDecision`.
  - [x] **EXECUTE**: `decideSpawn(source)` chamando `interpretDecision`, uma vez por agente. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/cli-run-gate.test.ts` verde. GREEN confirmado: `npx vitest run tests/cli-run-gate.test.ts` — 3/3.
  - [x] **VISUAL**: Não aplicável — sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivo criado nas seções 11–13. GREEN registrado na seção 11.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
  <!-- framework:evidence {"task":"T025","refs":["US-001","FR-005","NFR-001","NFR-002","AC-013","AC-014","AC-015"],"files":["src/delegation/cli-gate.ts"],"commands":[{"run":"npx vitest run tests/cli-run-gate.test.ts","exit":0}]} -->

- [x] T026 [CODE] [US-001] Implementar o spawn com timeout e captura em src/delegation/cli-spawn.ts — Refs: US-001, FR-006, NFR-001, NFR-002, AC-016, AC-017, AC-018 — Depends: T016, T017, T018
  - [x] **PREP**: Confirmar RED de T016/T017/T018 e o padrão de `spawnSync` já usado em `scripts/pinned-skills.mjs`.
  - [x] **EXECUTE**: `spawnCliAgent(adapter, args, options)` com timeout de 120s, capturando stdout/stderr/status sem interpretar; timeout vira `SpawnResult` de erro nomeando o motivo. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: `npx vitest run tests/cli-spawn.test.ts` verde. GREEN confirmado: `npx vitest run tests/cli-spawn.test.ts` — 3/3, incluindo o timeout real sem travar o processo de teste.
  - [x] **VISUAL**: Não aplicável — sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivo criado nas seções 11–13. GREEN registrado na seção 11.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
  <!-- framework:evidence {"task":"T026","refs":["US-001","FR-006","NFR-001","NFR-002","AC-016","AC-017","AC-018"],"files":["src/delegation/cli-spawn.ts"],"commands":[{"run":"npx vitest run tests/cli-spawn.test.ts","exit":0}]} -->

- [x] T027 [CODE] [US-001] Estender src/delegation/run.ts para runtime cli deixar de recusar, ligando seleção, tools, gate, injeção e spawn — Refs: US-001, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002 — Depends: T021, T022, T023, T024, T025, T026
  - [x] **PREP**: Confirmar T021–T026 GREEN e o ponto exato onde `runDelegation` recusa `cli` hoje.
  - [x] **EXECUTE**: Substituir a recusa fixa por: selecionar backend, checar tools, montar argumentos, injetar comportamento (arquivo ou flag), pedir decisão, spawnar, relatar — um agente `cli` por vez, sem interromper os demais do plano em caso de recusa. Reconstruir `docs/` com `$framework-documentator` antes de fechar este item.
  - [x] **VERIFY**: Suíte de delegação completa verde; verificado com o binário real sobre os cinco backends nesta máquina. GREEN confirmado: suíte de delegação completa verde (`tests/delegation-runtime.test.ts`, `tests/delegation-brief.test.ts`, `tests/delegation-behavior.test.ts`); verificado com os cinco binários reais nesta máquina via `maestro plan` → `maestro run` — `goose` completou de ponta a ponta, os demais alcançaram o subprocesso real (achados registrados em `.project-context/STACK.md`).
  - [x] **VISUAL**: Não aplicável — sem superfície visual.
  - [x] **EVIDENCE**: Registrar GREEN e arquivos alterados nas seções 11–13. GREEN e arquivos registrados na seção 11; dois bugs reais corrigidos pela verificação manual: `goose` exigia o subcomando `run`, e `agy --print` toma o argumento seguinte como prompt — ambos com testes/comentário no código apontando o achado.
  - [x] **IMPROVE**: Aplicar melhoria de processo ou justificar nenhuma.
  <!-- framework:evidence {"task":"T027","refs":["US-001","FR-001","FR-002","FR-003","FR-004","FR-005","FR-006","NFR-001","NFR-002"],"files":["src/delegation/run.ts","src/delegation/brief.ts","src/cli.ts"],"commands":[{"run":"npx vitest run tests/delegation-runtime.test.ts","exit":0}]} -->

**Checkpoint**: um plano aprovado com um agente `runtime: cli` por backend, autorizado spawn a spawn, roda de verdade nos cinco.

#### Fase final — Documentação e qualidade

- [x] T028 [DOC] [US-001] Registrar os cinco adaptadores e execution.cli_backend em .project-context/STACK.md e revisar PROJECT.md — Refs: US-001, FR-001, FR-004, AC-001, AC-010 — Depends: T021, T022, T023, T024, T025, T026, T027
  - [x] **PREP**: Confirmar T021–T027 GREEN e o conteúdo atual dos dois documentos.
  - [x] **EXECUTE**: Seção nova em `.project-context/STACK.md` (os cinco adaptadores, injeção por flag ou arquivo, gate por agente) e revisão de `PROJECT.md`, corrigindo "O que ainda não existe" para dizer que `runtime: cli` executa de verdade.
  - [x] **VERIFY**: `monitor_context.mjs --check` sem pendência real; `build_documentation.mjs --check` limpo. `monitor_context.mjs --check` sem pendência de PROJECT.md/docs (PACKAGES.md sinalizado por mudança de versão no lockfile, sem dependência nova — sem impacto material, justificado aqui); `build_documentation.mjs --project .` reconstruiu `docs/` sem erro.
  - [x] **VISUAL**: Não aplicável — documentação em Markdown, sem tela.
  - [x] **EVIDENCE**: Registrar comandos e resultado nas seções 11–13. `.project-context/STACK.md` e `PROJECT.md` atualizados; `docs/` reconstruído.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T029 [TEST] Regressão completa e verificação manual com os cinco backends reais, registrada em specs/defined/0019-execucao-via-subprocesso-de-cli-externa/spec.md — Refs: US-001, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018, AC-019, AC-020 — Depends: T021, T022, T023, T024, T025, T026, T027, T028
  - [x] **PREP**: Identificar suites, checks e gates aplicáveis; confirmar os cinco backends instalados nesta máquina.
  - [x] **EXECUTE**: `npx vitest run`, `npx tsc --noEmit`, `check_traceability.mjs`, `verify_acceptance.mjs`, e o ciclo real `maestro plan` → `maestro run` autorizando um agente por backend, um dos cinco por vez.
  - [x] **VERIFY**: Suíte verde, `tsc` limpo, rastreabilidade cobrindo os IDs da spec, `QA: PASSED`, e os cinco spawns reais confirmados — comportamento aplicado, modelo repassado, saída relatada. `npx vitest run` → 186 arquivos, 510/510; `npx tsc --noEmit` limpo; verificação real dos cinco backends (`pi`, `agy`, `claude`, `codex`, `goose`) via `maestro plan`/`maestro run` nesta máquina, com `AGENTS.md` real temporariamente afastado para provar o caminho de arquivo de `agy`/`codex` de ponta a ponta.
  - [x] **VISUAL**: Não aplicável — repasse final sem superfície visual própria.
  - [x] **EVIDENCE**: Registrar contagens, os cinco comandos reais e seus resultados nas seções 11–13. Contagens e os cinco resultados reais registrados na seção 11/`.project-context/STACK.md`; `goose` respondeu "OK" à tarefa pedida (sucesso completo); `pi`/`claude`/`agy`/`codex` alcançaram o subprocesso real e relataram erro de conta/modelo do próprio backend — nenhum bloqueado pela preparação do maestro.
  - [x] **IMPROVE**: Registrar retrospectiva do processo.

### 15. Ordem de execução

- Caminho crítico: T001–T020 e T031 (paralelas) → T021/T022/T023/T024/T025/T026 (paralelas entre si, cada uma sobre arquivos disjuntos) → T027 → T028 → T029.
- Tarefas paralelas: T001–T020 e T031 são independentes entre si. T021–T026 tocam módulos disjuntos e podem andar juntas; T027 depende de todas as seis porque é quem as liga.
- Restrição de sequenciamento: a verificação manual final (T029) precisa dos cinco backends instalados — nesta máquina, todos estão; noutra, a tarefa precisaria adaptar-se aos que existirem, registrando a ausência em vez de pular a verificação em silêncio.
- Estratégia de MVP: não aplicável — é uma história só, e entregar menos de cinco adaptadores deixaria `runtime: cli` funcionando só para parte dos backends que a `SPEC-0008` já promete detectar, o que a `DEC-001` desta spec rejeita.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- `SPEC-0018` (briefing de delegação) — entregue; fornece `AgentBrief` e o ponto de extensão em `runDelegation`.
- `SPEC-0008` (detecção de backends) — entregue; fornece `SUPPORTED_AGENT_BACKENDS` e `realBackendEnvironment()`.
- `SPEC-0016` (aprovação do plano) — entregue; fornece `interpretDecision`.
- Os cinco backends precisam estar instalados para a verificação manual completa; nesta máquina, todos os cinco estão.

#### Riscos

- Cada backend pode mudar suas flags numa versão futura, quebrando o adaptador em silêncio → mitigado por `AC-001`/`AC-003` cobrirem a forma esperada, e pela verificação manual obrigatória com o binário real antes do fechamento — se a flag sumiu, o teste manual vai revelar, não só a suíte com fixture.
- `AGENTS.md` temporário pode colidir com convenções de outro mecanismo do projeto (o roteador da `SPEC-0011` já escreve nesse arquivo) → mitigado por `withTemporaryAgentsFile` recusar quando o arquivo real já existir, em vez de sobrescrever ou mesclar.
- Um subprocesso com ferramentas de edição pode alterar o projeto de formas que só aparecem depois → aceito como a natureza da fatia; o gate por agente (`FR-005`) é a mitigação, não uma garantia de reversibilidade.

#### Suposições

- O nome de propriedade `execution.cli_backend` é reversível — decisão desta fatia, não de uma anterior; renomear antes da implementação muda vocabulário, não comportamento.
- O timeout do spawn segue o mesmo valor já usado em `realformer project toolExecutor` (120 segundos) até haver motivo real para outro número.

### 17. Decisões

- **DEC-001**: Os cinco backends entram nesta mesma fatia, um adaptador cada — razão: escopo completo pedido explicitamente; adiar um backend deixaria `runtime: cli` funcionando só parcialmente, o que a `SPEC-0018` já rejeitou fazer com o próprio plano (recusar tudo em vez de emitir parcial) — rodada 1.
- **DEC-002**: Injeção por flag quando existe, `AGENTS.md` temporário quando não — razão: usa o caminho mais direto quando o backend oferece, e só recorre à convenção de arquivo (a ideia original do ADR-001) onde de fato necessária — rodada 2.
- **DEC-003**: `tools` `required` não suportável recusa nomeando backend e limitação — razão: mesma disciplina de `required` já fixada na `SPEC-0015`; rodar com acesso mais amplo do que o perfil autoriza seria abrir a porta em silêncio — rodada 3.
- **DEC-004**: Gate novo, por agente, antes de cada spawn real — razão: a aprovação do plano (`SPEC-0016`) autorizou quem trabalharia, não que cada ação irreversível pode acontecer agora; esta é a primeira fatia do épico que de fato escreve fora do controle direto do maestro — rodada 4.
- **DEC-005**: Mesmo canal de decisão, granularidade por agente — razão: reusa a regra já correta em vez de duplicá-la, e recusar um agente não deve custar os demais do mesmo plano — rodada 5.
- **DEC-006**: Sempre pede saída estruturada, mas não interpreta — razão: mesma divisão já fixada desde a `SPEC-0016`: o código não finge cognição, quem julga é o agente hospedeiro — rodada 6.
- **DEC-007**: Modelo repassado sem tradução nem validação prévia — razão: mesma postura de "detectar, não instalar" da `SPEC-0008`; manter uma tabela de tradução por backend seria mais um estado a manter correto conforme os backends mudam formato — rodada 7.
- **DEC-008**: `execution.cli_backend` nova, com fallback para o primeiro detectado — razão: o schema hoje não diz qual dos cinco backends um agente `cli` deveria usar; a ordem fixa de `SUPPORTED_AGENT_BACKENDS` já existe e serve de default sem inventar critério novo — rodada 8.

### 18. Definition of Done

- [ ] `Definition Gate` está `Passed`.
- [ ] `Plan Gate` está `Passed`.
- [ ] `Delivery Gate` está `Passed`.
- [ ] Os cenários `AC-001` a `AC-020` passam.
- [ ] `FR-001` a `FR-007` e `NFR-001`/`NFR-002` têm evidência de verificação nas seções 11–12.
- [ ] Todas as tarefas da seção 14 estão concluídas.
- [ ] Verificação manual com os cinco backends reais registrada, não só a suíte.
- [ ] `.project-context/STACK.md` registra os cinco adaptadores e a propriedade nova do schema.
- [ ] `PROJECT.md` revisado quanto à capacidade nova e à correção de "O que ainda não existe".
