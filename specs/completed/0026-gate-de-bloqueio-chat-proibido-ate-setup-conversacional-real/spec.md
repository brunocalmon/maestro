# Especificação integrada: Gate de bloqueio: chat proibido até setup conversacional real

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0026 |
| Slug | 0026-gate-de-bloqueio-chat-proibido-ate-setup-conversacional-real |
| Status | Complete |
| Effort | 6 |
| Effort updated at | 2026-09-18 |
| Effort rationale | Perfil `standard` alto: novo hook `on-prompt`/`UserPromptSubmit` com decisão de negação, extensão do `PREAMBLE` do gerador de hooks (`HOOK_PROMPT`), novo guard `PreToolUse` para o comando de adiamento, nova flag de CLI, cálculo e comparação de identificador de contrato de traços, e integração com `doctor`/`setup-check` sem duplicar mensagens; sem interface, banco ou framework novo. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não |
| Atualizada em | 2026-09-18 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

SPEC-0025 já detecta e avisa quando `specsfy-setup` ou `setup-matt-pocock-skills` não rodaram de verdade num projeto instalado pelo maestro (`WARN` no `doctor`, mensagem do hook `setup-check` no início da sessão), mas nada impede o uso do chat enquanto isso. O aviso pode ser ignorado indefinidamente: o projeto segue sendo usado sem `PROJECT.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/USER-PROFILE.md` nem a seção `## Agent skills` em `AGENTS.md` — exatamente o gap que o usuário encontrou ao inspecionar este próprio repositório depois de rodar `maestro setup`.

#### Resultado desejado

Em Claude Code, o chat fica bloqueado — nenhuma mensagem chega ao modelo, exceto a invocação exata de `/specsfy-setup` ou `/setup-matt-pocock-skills` — enquanto os traços reais dessas duas skills não existirem no projeto. Quem precisa seguir trabalhando sem completar a configuração agora tem uma saída deliberada e auditável (`maestro setup --defer-conversational`, só via terminal real), não um bloqueio permanente sem escape.

#### Métricas de sucesso

- Um projeto recém-instalado pelo maestro em Claude Code, sem `specsfy-setup` nem `setup-matt-pocock-skills` executados, tem toda mensagem de chat negada exceto os dois comandos de setup — verificável por teste automatizado do hook gerado.
- Nenhum campo novo de checklist booleano ou checksum aparece em `config.yaml` ou `install.json` para este recurso — verificável por revisão do schema.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] "`UserPromptSubmit` do Claude Code bloqueia de fato o prompt, e por qual mecanismo?" — Verdict: verified — Confidence: high — Evidence: `src/hooks/claude-code.ts:168-182` (POSTAMBLE já traduz `decision: deny|ask` em `exit 2` para qualquer evento, incluindo `on-prompt`/`UserPromptSubmit`) — Budget: 1/1.
- **R-002** [critical] "O JSON de entrada do `UserPromptSubmit` traz o texto do prompt, e existe extração equivalente no gerador de hooks deste repo?" — Verdict: verified — Confidence: high — Evidence: campo `prompt` confirmado no payload oficial; `HOOK_PROMPT` não existe ainda em `src/hooks/claude-code.ts` (PREAMBLE só extrai `HOOK_TOOL`, `HOOK_SESSION`, `HOOK_FILE`, `HOOK_COMMAND`), mas o padrão de extração via `_hook_str` (`src/hooks/claude-code.ts:150`) é diretamente reaproveitável.
- **R-003** "Onde já existe rastreamento de versão e onde vive a checagem 'configurado' hoje?" → `install.json` já guarda `version` no topo (`.maestro/install.json`); `config.yaml` não tem campo `version` (`src/config/schema.ts`); a checagem "configurado" já existe em `diagnoseMaestroProject`/`assessConfiguration` (SPEC-0025, `src/doctor/maestro.ts`, `src/setup/layout.ts`) — nenhum estado novo é necessário para derivar o estado do gate.

#### Fontes e contexto consultados

- `src/hooks/claude-code.ts`, `src/hooks/source.ts` (gerador e tradução de hooks canônicos para Claude Code).
- `src/setup/layout.ts`, `src/doctor/maestro.ts` (traços de configuração e diagnóstico, SPEC-0025).
- `resources/hooks/setup-check.md`, `resources/hooks/guard-destructive.md` (padrão de hook de aviso e de guard `PreToolUse` já existentes).
- `.maestro/install.json`, `src/config/schema.ts` (schema de estado atual, ausência de campo `version` em `config.yaml`).
- `specs/backlog/0015-gate-de-bloqueio-chat-proibido-ate-setup-conversacional-real.md` (brief já refinado, decisões fechadas em sessão de `/grill-me`).

#### Documentação consultada

- Nenhuma fonte externa consultada; cada levantamento foi feito sobre o próprio repositório e conhecimento já confirmado do comportamento de hooks do Claude Code.

#### Artefatos de pesquisa armazenados

- Nenhum artefato externo — evidência já citada por caminho e linha do próprio repositório, sem necessidade de cópia em `research/`.

#### Dúvidas respondidas

- **Q**: O checklist booleano + checksum imutável proposto originalmente deveria ser implementado? → **A**: Não — rejeitado em `/grill-me`: um checksum derivado dos mesmos campos que protege é forjável trivialmente e é estritamente mais fraco que a checagem de traços de arquivo real já existente (SPEC-0025). A checagem "configurado" é sempre ao vivo.
- **Q**: Um hook deveria "flipar" o campo `matt-pocock`/`specsfy` quando a skill correspondente for chamada? → **A**: Não — não existe evento de hook Claude Code para "a skill terminou com sucesso" (`PostToolUse` do `Skill` tool dispara no início da conversa multi-turno, não no fim); a checagem ao vivo dos traços dispensa esse evento.
- **Q**: O bloqueio deve resetar a cada bump de versão do pacote? → **A**: Não — dissolvido pela checagem ao vivo; o único gatilho de reavaliação é o identificador do contrato de traços exigidos mudar, não a versão do pacote em si.
- **Q**: O escape hatch pode ser aceito como comando dentro do próprio chat bloqueado? → **A**: Não — só via terminal real, fora de qualquer tool do agente, para não virar mais uma porta de allowlist.

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Novo hook `on-prompt` → `UserPromptSubmit` que nega (`exit 2`) mensagens de chat quando `specsfy-setup` ou `setup-matt-pocock-skills` não tiverem seus traços reais no projeto.
- Extração de `HOOK_PROMPT` no `PREAMBLE` do gerador de hooks Claude Code (`src/hooks/claude-code.ts`).
- Allowlist por prefixo exato de `/specsfy-setup` e `/setup-matt-pocock-skills`.
- Comando `maestro setup --defer-conversational` (CLI), que grava um adiamento vinculado ao identificador do contrato de traços vigente.
- Guard `PreToolUse` que bloqueia a execução desse comando por qualquer tool do agente (Bash ou MCP shell), exigindo execução real em terminal.
- Expiração automática do adiamento quando o identificador do contrato de traços mudar.
- Relato do adiamento ativo em `maestro doctor` e no aviso de sessão (`setup-check`), sem esconder o estado.

#### Fora de escopo

- Bloqueio de chat no target `antigravity` — o `on-prompt` já está fora de `supportedEvents` desse adapter (src/targets/antigravity.ts), então o hook de bloqueio nunca é instalado lá; nenhuma mudança de código é necessária para essa exclusão.
- Qualquer checklist booleano ou checksum persistido em `config.yaml`/`install.json` para representar "configurado" (rejeitado no grilling).
- Hook que grava/flipa um campo ao detectar chamada de skill (rejeitado por falha estrutural de timing).
- Ampliação da allowlist para comandos de diagnóstico (`doctor`, `git status`, etc.) — permanece deliberadamente de fora.
- Reset do gate por bump de versão do pacote maestro — só o contrato de traços aciona reavaliação.

#### Atores

- **Pessoa usuária do maestro em Claude Code**: interage com o chat de um projeto configurado pelo maestro; é bloqueada ou liberada conforme o estado real de configuração conversacional.
- **CLI `maestro`**: executa `setup --defer-conversational` fora do contexto de qualquer sessão de agente, gravando o adiamento.
- **`maestro doctor`**: relata o estado de configuração e de adiamento, sem nunca silenciá-lo.

### 4. Princípios e restrições do projeto

- **PR-001**: A checagem "configurado" usada por este gate deve ser sempre ao vivo, lida diretamente dos traços de arquivo já definidos por SPEC-0025 (`SPECSFY_SETUP_TRACES`, `AGENT_SKILLS_HEADING`), sem introduzir checklist booleano, checksum ou qualquer outro estado persistido novo para representar "configurado".
- **PR-002**: Nenhum hook grava campo de estado ao detectar a chamada de uma skill; toda decisão de bloqueio deriva de leitura direta do disco no momento do prompt.
- **PR-003**: O gate nunca deve travar o fluxo por falha própria do hook (leitura impossível, arquivo ausente por erro): falha do hook implica `allow`, nunca `deny` por omissão.
- **PR-004**: Nenhuma mensagem deste gate duplica o conteúdo já mostrado pelo `setup-check` (SessionStart); a mensagem de negação é curta e aponta de volta para os dois comandos.

### 5. Histórias de usuário

#### US-001 — Bloqueio do chat até a configuração conversacional ser real (P1)

Como pessoa usuária do maestro em Claude Code, quero que o chat fique bloqueado enquanto `specsfy-setup` e `setup-matt-pocock-skills` não tiverem seus traços reais no projeto, para não seguir trabalhando num projeto que parece configurado mas não foi.

**Por que P1**: é o comportamento central do backlog — sem ele, o aviso de SPEC-0025 continua sendo ignorável indefinidamente, que foi o problema relatado pelo usuário neste próprio repositório.
**Teste independente**: instalar o maestro num projeto novo sem rodar as skills conversacionais, abrir uma sessão Claude Code e confirmar que qualquer mensagem além dos dois comandos de setup é negada.
**Requisitos**: FR-001, FR-002, FR-005

#### US-002 — Adiamento deliberado e auditável do bloqueio (P2)

Como pessoa usuária do maestro, quero poder adiar conscientemente o bloqueio via terminal, para continuar trabalhando quando decidir postergar a configuração conversacional, sem que o próprio agente bloqueado possa se autoliberar.

**Por que P2**: depende do gate (US-001) já existir; sem ele não há o que adiar. É P2 porque nem cada projeto vai precisar do escape hatch no dia a dia, mas sua ausência tornaria o bloqueio impraticável em casos legítimos de adiamento.
**Teste independente**: rodar `maestro setup --defer-conversational` num terminal real e confirmar que o chat do mesmo projeto deixa de ser bloqueado, mas que pedir ao agente para rodar esse mesmo comando por dentro do chat continua sendo negado.
**Requisitos**: FR-003, FR-004

### 6. Cenários BDD de aceite

#### AC-001 — Bloqueio padrão quando nada está configurado

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-001
Feature: Gate de configuração conversacional

  Scenario: Projeto sem nenhum traço configurado bloqueia mensagem comum
    Given um projeto instalado pelo maestro em Claude Code sem os 4 traços de specsfy-setup e sem "## Agent skills" em AGENTS.md
    When a pessoa envia a mensagem "explique este arquivo para mim"
    Then o hook nega a mensagem com exit 2 e uma mensagem curta apontando /specsfy-setup e /setup-matt-pocock-skills
```

#### AC-002 — Comando exato `/specsfy-setup` passa

**Cobre**: US-001, FR-001, FR-002

```gherkin
@US-001 @FR-001 @FR-002 @AC-002
Feature: Gate de configuração conversacional

  Scenario: Invocação exata do comando de setup do Specsfy não é bloqueada
    Given um projeto sem os 4 traços de specsfy-setup
    When a pessoa envia a mensagem "/specsfy-setup"
    Then o hook permite a mensagem e a skill specsfy-setup é carregada normalmente
```

#### AC-003 — Comando exato `/setup-matt-pocock-skills` passa

**Cobre**: US-001, FR-001, FR-002

```gherkin
@US-001 @FR-001 @FR-002 @AC-003
Feature: Gate de configuração conversacional

  Scenario: Invocação exata do comando de setup do matt-pocock não é bloqueada
    Given um projeto sem "## Agent skills" em AGENTS.md
    When a pessoa envia a mensagem "/setup-matt-pocock-skills"
    Then o hook permite a mensagem e a skill setup-matt-pocock-skills é carregada normalmente
```

#### AC-004 — Bloqueio parcial quando só uma das duas skills está configurada

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-004
Feature: Gate de configuração conversacional

  Scenario: specsfy-setup completo mas matt-pocock pendente continua bloqueando
    Given um projeto com os 4 traços de specsfy-setup presentes e sem "## Agent skills" em AGENTS.md
    When a pessoa envia qualquer mensagem que não seja /setup-matt-pocock-skills
    Then o hook nega a mensagem com exit 2
```

#### AC-005 — Liberação total quando ambas as skills estão configuradas

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-005
Feature: Gate de configuração conversacional

  Scenario: Projeto totalmente configurado não bloqueia nada
    Given um projeto com os 4 traços de specsfy-setup e "## Agent skills" em AGENTS.md presentes
    When a pessoa envia qualquer mensagem
    Then o hook permite a mensagem sem restrição
```

#### AC-006 — Quase-match não conta como comando de setup

**Cobre**: US-001, FR-002

```gherkin
@US-001 @FR-002 @AC-006
Feature: Gate de configuração conversacional

  Scenario: Mensagem que só menciona o comando no meio do texto continua bloqueada
    Given um projeto sem os traços de nenhuma das duas skills
    When a pessoa envia a mensagem "me explica o que /specsfy-setup faz antes de eu rodar"
    Then o hook nega a mensagem com exit 2, porque a mensagem não começa com o prefixo exato do comando
```

#### AC-007 — Fail-open quando o próprio hook não consegue ler o disco

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-007
Feature: Gate de configuração conversacional

  Scenario: Erro de leitura no hook nunca bloqueia por conta própria
    Given um projeto onde a leitura de AGENTS.md ou dos traços de specsfy-setup falha por erro do ambiente, não por ausência real
    When a pessoa envia qualquer mensagem
    Then o hook permite a mensagem (decision allow) em vez de negar por incerteza
```

#### AC-008 — Backend fora do Claude Code não é afetado

**Cobre**: US-001, FR-005

```gherkin
@US-001 @FR-005 @AC-008
Feature: Gate de configuração conversacional

  Scenario: Backend sem suporte a bloqueio de prompt mantém só o aviso
    Given um projeto instalado pelo maestro com o target `antigravity` detectado, sem os traços das duas skills
    When a pessoa envia qualquer mensagem nesse target
    Then nenhuma mensagem é bloqueada, porque `antigravity` não tem `on-prompt` em `supportedEvents` — e apenas o aviso não-bloqueante existente (`setup-check`, evento `session-start`, suportado por ambos os targets) continua aparecendo
```

#### AC-009 — Adiamento via CLI libera o chat

**Cobre**: US-002, FR-003

```gherkin
@US-002 @FR-003 @AC-009
Feature: Adiamento deliberado do gate

  Scenario: Comando de adiamento executado em terminal real libera o chat
    Given um projeto não configurado com o gate ativo
    When a pessoa executa "maestro setup --defer-conversational" em um terminal real, fora de qualquer sessão de agente
    Then o adiamento é gravado com o identificador do contrato de traços vigente e o chat deixa de ser bloqueado para mensagens comuns
```

#### AC-010 — Guard bloqueia o comando de adiamento executado via Bash pelo agente

**Cobre**: US-002, FR-004

```gherkin
@US-002 @FR-004 @AC-010
Feature: Adiamento deliberado do gate

  Scenario: Agente tentando rodar o comando de adiamento por dentro do chat é barrado
    Given uma sessão de agente já dentro de /specsfy-setup ou /setup-matt-pocock-skills
    When o agente tenta executar "maestro setup --defer-conversational" via tool Bash
    Then o guard PreToolUse nega a execução e informa que o comando só é válido rodado diretamente em terminal
```

#### AC-011 — Guard cobre também tools MCP de shell, não só Bash

**Cobre**: US-002, FR-004

```gherkin
@US-002 @FR-004 @AC-011
Feature: Adiamento deliberado do gate

  Scenario: Agente tentando rodar o comando de adiamento via tool MCP de shell é barrado
    Given uma sessão de agente com acesso a uma tool MCP que executa comandos de shell (ex.: run_in_terminal)
    When o agente tenta executar "maestro setup --defer-conversational" por essa tool
    Then o guard PreToolUse nega a execução do mesmo jeito que negaria via Bash
```

#### AC-012 — Adiamento expira quando o contrato de traços muda

**Cobre**: US-002, FR-003

```gherkin
@US-002 @FR-003 @AC-012
Feature: Adiamento deliberado do gate

  Scenario: Nova versão do maestro muda os traços exigidos e invalida o adiamento anterior
    Given um projeto com adiamento ativo, vinculado ao identificador do contrato de traços da versão anterior
    When uma versão nova do maestro passa a exigir um traço adicional (o identificador do contrato muda)
    Then o adiamento anterior deixa de cobrir o novo contrato e o chat volta a ser bloqueado até nova decisão
```

#### AC-013 — Adiamento permanece válido quando o contrato não muda

**Cobre**: US-002, FR-003

```gherkin
@US-002 @FR-003 @AC-013
Feature: Adiamento deliberado do gate

  Scenario: Bump de versão que não altera os traços exigidos não invalida o adiamento
    Given um projeto com adiamento ativo
    When o maestro é atualizado para uma versão nova cujo contrato de traços (SPECSFY_SETUP_TRACES + AGENT_SKILLS_HEADING) permanece idêntico
    Then o adiamento continua válido e o chat continua liberado
```

#### AC-014 — `doctor` relata adiamento ativo

**Cobre**: US-002, NFR-003

```gherkin
@US-002 @NFR-003 @AC-014
Feature: Adiamento deliberado do gate

  Scenario: doctor nunca esconde um adiamento ativo
    Given um projeto não configurado com adiamento ativo
    When a pessoa roda "maestro doctor"
    Then o relatório mostra explicitamente que o gate está desligado por adiamento deliberado, distinto de "nunca configurado"
```

#### AC-015 — Guard permite quando o comando não vem de nenhuma tool do agente

**Cobre**: US-002, FR-004

```gherkin
@US-002 @FR-004 @AC-015
Feature: Adiamento deliberado do gate

  Scenario: Execução direta em terminal real, sem tool de agente envolvida, não é interceptada pelo guard
    Given a pessoa abre um terminal comum fora de qualquer sessão de agente
    When ela executa "maestro setup --defer-conversational" diretamente
    Then o comando roda normalmente, porque nenhum hook PreToolUse de agente intercepta uma execução fora do agente
```

#### AC-016 — `setup-gate` nunca é rejeitado por evento não suportado no target antigravity

**Cobre**: FR-005

```gherkin
@FR-005 @AC-016
Feature: Gate de configuração conversacional

  Scenario: setup-check é classificado como installed, não skipped, no target antigravity
    Given o hook setup-check (evento session-start, suportado por antigravity)
    When antigravityAdapter.formatHooks classifica esse hook
    Then ele aparece em installed, nunca em skipped — ao contrário de setup-gate, que é skipped por evento on-prompt não suportado (AC-008)
```

Retificado durante `$specsfy-07-implement` (T017/T027): a formulação original
prometia que o aviso do `setup-check` "continua ativo" no target antigravity —
mas `runSetup` nunca grava nenhum script de hook para esse target hoje,
mesmo para eventos suportados, porque `antigravityAdapter.settingsPath` é
`null` e `src/setup/run.ts` condiciona a escrita de scripts a esse campo
(gap pré-existente, fora do escopo desta spec, registrado em
`findings/internal/FIND-INT-005-antigravity-nunca-recebe-script-de-hook.md`).
O que este AC garante de fato é mais estreito e ainda verdadeiro: `setup-gate`
nunca é a causa de `setup-check` ficar indisponível em `antigravity` — a
classificação por evento os trata de forma diferente, `installed` para um,
`skipped` para o outro.

#### AC-017 — Instalação no target antigravity nunca grava o hook de bloqueio

**Cobre**: FR-005

```gherkin
@FR-005 @AC-017
Feature: Gate de configuração conversacional

  Scenario: maestro setup não instala o hook on-prompt fora do Claude Code
    Given um projeto cujo target detectado é antigravity
    When "maestro setup" é executado
    Then nenhum hook de bloqueio UserPromptSubmit é instalado para esse target — partitionByEvent (src/targets/claude-code.ts, reaproveitado por antigravity.ts) já reporta setup-gate como skipped por evento não suportado
```

#### AC-018 — Fail-open quando AGENTS.md existe mas está ilegível

**Cobre**: NFR-002

```gherkin
@NFR-002 @AC-018
Feature: Gate de configuração conversacional

  Scenario: AGENTS.md ilegível (não ausente) não trava o chat
    Given um projeto onde AGENTS.md existe mas está com permissão de leitura negada por erro de ambiente
    When a pessoa envia qualquer mensagem
    Then o hook trata a falha de leitura como incerteza e permite a mensagem — diferente de AGENTS.md genuinamente ausente, que é o sinal normal de "matt-pocock não configurado" e deve continuar sendo negado (AC-001/AC-004)
```

#### AC-019 — Fail-open quando `.specsfy/` existe mas está ilegível

**Cobre**: NFR-002

```gherkin
@NFR-002 @AC-019
Feature: Gate de configuração conversacional

  Scenario: .specsfy/ ilegível (não ausente) não trava o chat por erro do hook
    Given um projeto onde o diretório .specsfy/ existe mas está com permissão de leitura negada por erro de ambiente
    When a pessoa envia qualquer mensagem
    Then o hook aplica o mesmo tratamento de falha do AC-018 e permite a mensagem — diferente de .specsfy/ genuinamente ausente, que é o sinal normal de "specsfy-setup não configurado" e deve continuar sendo negado (AC-001/AC-004)
```

#### AC-020 — `setup-check` continua avisando mesmo com adiamento ativo

**Cobre**: NFR-003

```gherkin
@NFR-003 @AC-020
Feature: Adiamento deliberado do gate

  Scenario: Adiamento desliga o bloqueio, não o aviso de sessão
    Given um projeto não configurado com adiamento ativo
    When uma nova sessão Claude Code inicia
    Then o hook setup-check continua mostrando a mensagem de configuração pendente, mesmo com o chat liberado
```

#### AC-021 — `doctor` distingue "adiado" de "nunca configurado"

**Cobre**: NFR-003

```gherkin
@NFR-003 @AC-021
Feature: Adiamento deliberado do gate

  Scenario: Relato do doctor diferencia os dois estados
    Given dois projetos não configurados, um com adiamento ativo e outro sem nenhuma ação tomada
    When "maestro doctor" roda em cada um
    Then a saída de cada projeto identifica claramente qual dos dois estados se aplica
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O sistema deve negar (exit 2), via um novo hook no evento canônico `on-prompt` (traduzido para `UserPromptSubmit` em Claude Code), toda mensagem de chat que não corresponda à allowlist, enquanto os traços reais de `specsfy-setup` ou de `setup-matt-pocock-skills` não existirem no projeto (checagem sempre ao vivo, conforme PR-001), com uma mensagem curta de negação que não duplica o conteúdo do `setup-check`.
- **FR-002**: O sistema deve reconhecer como allowlist apenas mensagens cujo prefixo exato seja `/specsfy-setup` ou `/setup-matt-pocock-skills` (com ou sem argumentos depois), rejeitando qualquer correspondência por substring ou menção no meio do texto.
- **FR-003**: O sistema deve expor `maestro setup --defer-conversational` na CLI, que grava um registro de adiamento vinculado a um identificador do contrato de traços vigente (derivado de `SPECSFY_SETUP_TRACES` + `AGENT_SKILLS_HEADING`); esse adiamento desliga o bloqueio do FR-001 enquanto o identificador do contrato não mudar, e deixa de valer automaticamente quando mudar.
- **FR-004**: O sistema deve bloquear, via um guard `PreToolUse` (mesmo padrão de `guard-destructive`), a execução do comando `maestro setup --defer-conversational` por qualquer tool do agente (Bash ou MCP de shell), permitindo apenas execução direta em terminal, fora de qualquer sessão de agente.
- **FR-005**: O bloqueio do FR-001 deve se aplicar somente ao target `claude-code`; o hook `setup-gate` (evento `on-prompt`) nunca deve ser instalado no target `antigravity`, mantendo apenas o aviso não-bloqueante já existente (`setup-check`, evento `session-start`, suportado por ambos os targets). Este requisito é satisfeito pelo mecanismo genérico já existente (`partitionByEvent`/`supportedEvents` em `src/targets/*.ts`), sem exigir lógica nova de seleção por target.

#### Não funcionais

- **NFR-001**: A checagem ao vivo usada pelo hook de bloqueio deve custar menos de 50ms de execução de shell (leituras de arquivo locais equivalentes às já usadas por `setup-check.md`), sem chamada de rede e sem subprocesso Node, para não introduzir latência perceptível a cada mensagem enviada. **Verificação**: medição do tempo de execução do script gerado em teste automatizado, com limite explícito de 50ms.
- **NFR-002**: Uma falha do próprio hook ao ler o disco (permissão, ausência inesperada de arquivo, erro de ambiente) nunca deve resultar em bloqueio — o hook deve tratar erro de leitura como `allow`, nunca como `deny` por omissão. **Verificação**: teste simulando erro de leitura e observando `decision: allow`.
- **NFR-003**: O estado de adiamento ativo nunca deve ficar oculto — `maestro doctor` e o aviso de sessão (`setup-check`) devem continuar reportando a situação real do projeto (não configurado, configurado ou adiado), distinguindo adiamento de ausência total de configuração. **Verificação**: inspeção da saída de `maestro doctor` e do hook `setup-check` nos três estados possíveis.

#### Erros e casos-limite

- `AGENTS.md` ou `.specsfy/` existentes mas ilegíveis por erro de ambiente (permissão negada, I/O) → tratado como erro de leitura, resultando em `allow` (NFR-002, AC-018, AC-019). Importante: ausência genuína desses caminhos não é esse caso — é o sinal normal de "nunca configurado" e continua resultando em `deny` (AC-001, AC-004), senão o próprio requisito central (FR-001) nunca teria efeito, já que "não configurado" sempre significa exatamente esses arquivos ausentes.
- Comando `maestro setup --defer-conversational` executado num projeto já totalmente configurado → o comando avisa que não há nada pendente e não grava um adiamento inútil.
- Contrato de traços muda sem que o usuário rode `maestro setup` novamente → o adiamento anterior simplesmente para de cobrir a checagem nova, sem exigir migração ativa de dado antigo.
- Mensagem de chat vazia ou só espaços → tratada como não correspondente à allowlist, portanto negada como qualquer outra mensagem fora do prefixo exato.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- `src/hooks/source.ts` já declara `on-prompt` como `CanonicalEvent` válido (adicionado em SPEC-0023); falta um hook real registrado nesse evento.
- `src/hooks/claude-code.ts` já mapeia `on-prompt` → `UserPromptSubmit` em `EVENT_MAP` e já traduz `decision: deny` em `exit 2` no `POSTAMBLE`; falta apenas `HOOK_PROMPT` no `PREAMBLE`.
- `src/setup/layout.ts` (SPEC-0025) já expõe `SPECSFY_SETUP_TRACES`, `AGENT_SKILLS_HEADING`, `assessConfiguration`; `src/doctor/maestro.ts` já expõe `diagnoseMaestroProject`. Ambos são reaproveitados sem alteração de contrato.
- `resources/hooks/guard-destructive.md` é o precedente direto para o novo guard: hook `PreToolUse`, `tools: Bash|mcp__.*(execute|run_in_terminal|shell).*`, inspeciona o conteúdo do comando e nega com mensagem explicativa.
- `.maestro/install.json` é o arquivo machine-owned que já guarda `version`; é o local natural para o novo registro de adiamento, evitando duplicar versão em `config.yaml` (decisão do grilling).

#### Arquitetura e módulos

- **Novo hook de bloqueio** (`resources/hooks/setup-gate.md`, `kind: dispatch` ou script, `event: on-prompt`): lê `HOOK_PROMPT`, `PROJECT_DIR`; chama a mesma lógica de traços de `setup-check.md` mais a verificação de adiamento ativo (arquivo/campo em `.maestro/install.json`); decide `deny` com mensagem curta ou `allow`.
- **Novo guard** (`resources/hooks/guard-defer-conversational.md`, `event: before-tool`, `tools: Bash|mcp__.*(execute|run_in_terminal|shell).*`, `blocking: true`): inspeciona `HOOK_COMMAND` procurando o padrão `maestro setup ... --defer-conversational`; nega com mensagem explicando que o comando só é válido em terminal real.
- **`src/hooks/claude-code.ts`**: adicionar `"HOOK_PROMPT=$(_hook_str prompt)"` ao array `PREAMBLE`, logo após a extração de `HOOK_SESSION`, seguindo o padrão existente.
- **`src/setup/defer.ts`** (novo): `configurationContractId(root)` (hash estável de `SPECSFY_SETUP_TRACES` + `AGENT_SKILLS_HEADING`), `readDeferral(root)`, `writeDeferral(root, contractId)`, `isDeferralActive(root)` (compara `contractId` gravado com o atual).
- **`src/cli.ts`**: nova flag `--defer-conversational` no comando `setup`, chamando `writeDeferral`; se o projeto já estiver totalmente configurado, informa que não há nada para adiar e não grava nada.
- **`src/doctor/maestro.ts`**: `diagnoseMaestroProject` passa a reportar um estado adicional (`WARN` "adiado" distinto de `WARN` "nunca configurado") quando `isDeferralActive` for verdadeiro.
- **`resources/hooks/setup-check.md`**: sem mudança de comportamento — continua avisando independentemente do adiamento (NFR-003); pode ganhar uma linha extra citando que o bloqueio está desligado por adiamento, sem duplicar o motivo já explicado.
- **`src/targets/antigravity.ts`** e **`src/targets/claude-code.ts`**: nenhuma mudança necessária — `SUPPORTED` de `antigravity` já exclui `on-prompt` (comentário existente: "Antigravity has no settings file to run compaction or prompt hooks from"), então `partitionByEvent` já reporta `setup-gate` como `skipped` automaticamente assim que o hook for registrado no corpus (FR-005). `guard-defer-conversational` (evento `before-tool`) é suportado por ambos os targets e é instalado nos dois, o que é desejável — o guard é uma rede de segurança geral, não específica de um target.

#### Migrations

- Não aplicável — não há banco de dados neste projeto.

#### Models

- Não aplicável — o "modelo" relevante é o registro de adiamento em `.maestro/install.json`, descrito na seção 9.

#### Controllers e casos de uso

- `runSetupCommand` (`src/cli.ts`, já existente) ganha o novo caso `--defer-conversational`, delegando para `src/setup/defer.ts`.
- `runDoctorCommand` (`src/cli.ts`, já existente) passa a exibir o estado de adiamento retornado por `diagnoseMaestroProject`.

#### Views e experiência

- Não aplicável — não há interface para pessoas (CLI e hooks apenas).

#### Queries e repositórios

- Leitura direta de arquivos (`existsSync`/`readFileSync`) sobre `AGENTS.md`, `.specsfy/*`, `.maestro/install.json` — mesmo padrão já usado por `assessConfiguration` e `diagnoseMaestroProject`, sem novo mecanismo de acesso a dados.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/draft/0026-gate-de-bloqueio-chat-proibido-ate-setup-conversacional-real/
  spec.md
  research/
resources/hooks/
  setup-gate.md (novo)
  guard-defer-conversational.md (novo)
src/hooks/claude-code.ts (HOOK_PROMPT no PREAMBLE)
src/setup/defer.ts (novo)
src/targets/*.ts (nenhuma mudança; partitionByEvent já cobre o escopo por target)
src/doctor/maestro.ts (estado "adiado")
src/cli.ts (flag --defer-conversational, relato do doctor)
tests/
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Registro de adiamento | Único por projeto, dentro de `.maestro/install.json` | `contractId` (hash de `SPECSFY_SETUP_TRACES` + `AGENT_SKILLS_HEADING`), `at` (data ISO da decisão) | Comparado, a cada checagem ao vivo, contra o `contractId` computado no momento; nunca referencia diretamente traços individuais |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Gate do projeto | Bloqueado | `maestro setup --defer-conversational` executado em terminal real | Liberado por adiamento | Só transita fora de qualquer tool de agente (FR-004) |
| Gate do projeto | Liberado por adiamento | Contrato de traços muda (nova versão do maestro) | Bloqueado | O registro de adiamento antigo não é apagado, só deixa de cobrir o novo `contractId` |
| Gate do projeto | Bloqueado ou liberado por adiamento | Traços reais das duas skills passam a existir | Liberado por configuração real | Checagem sempre ao vivo; nenhuma transição depende de estado persistido para este caso |

#### Migração e retenção

- Não aplicável — o único registro novo (`contractId`/`at` em `.maestro/install.json`) já nasce no formato final; não há dado legado a migrar.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não — este recurso é inteiramente hooks (Claude Code) e um comando de CLI; a única superfície observável pela pessoa é texto de terminal/chat, sem tela, formulário ou componente visual.

#### APIs expostas

- `maestro setup --defer-conversational` (CLI): sem autenticação (execução local); grava o registro de adiamento em `.maestro/install.json`; sem resposta HTTP, apenas saída de texto no terminal confirmando o adiamento ou informando que não havia nada pendente.
- `maestro doctor` (CLI, já existente): passa a incluir o estado de adiamento no relatório textual já produzido.

#### APIs externas utilizadas

- Nenhuma.

#### Documentação das APIs consultadas

- Não aplicável — nenhuma API externa envolvida.

#### Eventos e outros contratos

- Hook `on-prompt`/`UserPromptSubmit`: contrato de entrada é o JSON padrão do Claude Code (`prompt`, `session_id`, `cwd`, `hook_event_name`); contrato de saída é `exit 0` (allow) ou `exit 2` com mensagem em stderr (deny) — mesmo contrato já usado pelos demais hooks deste repositório.
- Hook `before-tool`/`PreToolUse` do guard: mesmo contrato já usado por `guard-destructive`, `guard-secrets` e `protect-authorship`.

### 11. Estratégia TDD

- **Unidade**: função de decisão do hook de bloqueio (dado um estado de traços + prompt, produzir `allow`/`deny`); `configurationContractId`; `isDeferralActive`; parsing do comando pelo guard.
- **Integração/contrato**: tradução do hook `on-prompt` para o script Claude Code gerado (verificar `HOOK_PROMPT` presente e `exit 2` correto); partição por target via `partitionByEvent` já existente, sem lógica nova.
- **BDD/aceite**: os 21 cenários da seção 6 orientam o desenho dos casos TDD; nenhum arquivo `.feature` é criado ou executado.
- **Runner TDD**: Node sem PHP — Vitest, já usado no restante do projeto (`test:tdd` já materializado nas specs anteriores).
- **E2E**: instalação real via `dist/cli.js setup` num projeto de teste, seguida de simulação do hook gerado com um input JSON de `UserPromptSubmit`, replicando a verificação manual já feita para SPEC-0022/0025.
- **Verificação manual**: rodar `maestro setup` neste próprio repositório (que hoje não tem `## Agent skills`) e confirmar que uma mensagem comum é de fato negada pelo hook gerado, e que `/setup-matt-pocock-skills` passa — mesmo padrão de dogfooding já usado nas specs anteriores desta sessão.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, FR-002, NFR-001 | AC-001 na seção 6 | Caso 1: hook nega mensagem comum quando nada configurado, em tests/hooks-setup-gate.test.ts | RED (ENOENT resources/hooks/setup-gate.md) | GREEN | GREEN (regressão completa em T029) |
| US-001, FR-002 | AC-002/AC-003/AC-006 na seção 6 | Caso 2: allowlist por prefixo exato, em tests/hooks-setup-gate.test.ts | RED (ENOENT resources/hooks/setup-gate.md) | GREEN | GREEN (regressão completa em T029) |
| US-001, FR-001, NFR-002 | AC-007/AC-018/AC-019 na seção 6 | Caso 3: fail-open em erro de leitura, em tests/hooks-setup-gate.test.ts | RED (ENOENT resources/hooks/setup-gate.md) | GREEN | GREEN (regressão completa em T029) |
| US-002, FR-003 | AC-009/AC-012/AC-013 na seção 6 | Caso 4: adiamento grava e expira por contrato, em tests/setup-defer.test.ts | RED (Cannot find module ../src/setup/defer) | GREEN | GREEN (regressão completa em T029) |
| US-002, FR-004 | AC-010/AC-011/AC-015 na seção 6 | Caso 5: guard bloqueia execução via tool, permite fora do agente, em tests/hooks-guard-defer.test.ts | RED (ENOENT resources/hooks/guard-defer-conversational.md) | GREEN | GREEN (regressão completa em T029) |
| US-001, FR-005 | AC-008/AC-016/AC-017 na seção 6 | Caso 6: partição por target (claude-code aceita on-prompt, antigravity não) via partitionByEvent, em tests/setup-write-gate.test.ts | RED em AC-008/AC-017 (ENOENT setup-gate.md); AC-016 já GREEN sem mudança (comportamento pré-existente, corrigido para refletir FIND-INT-005) | GREEN (nenhum diff em src/targets/*.ts — T027) | GREEN (regressão completa em T029) |
| US-002, NFR-003 | AC-014/AC-020/AC-021 na seção 6 | Caso 7: doctor e setup-check distinguem adiado de não-configurado, em tests/doctor-maestro.test.ts | RED (Cannot find module ../src/setup/defer) | GREEN | GREEN (regressão completa em T029) |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001, AC-004, AC-005, AC-007 | Unidade | tests/hooks-setup-gate.test.ts | Passed |
| FR-002 | AC-002, AC-003, AC-006 | Unidade | tests/hooks-setup-gate.test.ts | Passed |
| FR-003 | AC-009, AC-012, AC-013 | Unidade | tests/setup-defer.test.ts | Passed |
| FR-004 | AC-010, AC-011, AC-015 | Unidade | tests/hooks-guard-defer.test.ts | Passed |
| FR-005 | AC-008, AC-016, AC-017 | Integração | tests/setup-write-gate.test.ts | Passed |
| NFR-001 | AC-001, AC-004, AC-005 | Unidade | tests/hooks-setup-gate.test.ts (medição de tempo) | Passed |
| NFR-002 | AC-007, AC-018, AC-019 | Unidade | tests/hooks-setup-gate.test.ts | Passed |
| NFR-003 | AC-014, AC-020, AC-021 | Integração | tests/doctor-maestro.test.ts | Passed |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY — 2026-09-18
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/draft/0026-gate-de-bloqueio-chat-proibido-ate-setup-conversacional-real/spec.md`
- **Achados**:
  - `NOTE`: a tabela de evidência RED-GREEN-REFACTOR (seção 11) agrupa múltiplos `AC` por caso de teste em vez de um caso por `FR`/`NFR` individual; suficiente para o Definition Gate (cobertura de `AC` por `US`/`FR`/`NFR` já confirmada na seção 6), mas `$specsfy-05-tasks`/`$specsfy-06-tdd-bdd` devem expandir para casos TDD explícitos por requisito ao quebrar a seção 14.
  - `NOTE`: nenhuma fonte externa foi consultada; toda a pesquisa (`R-001`–`R-003`) é leitura direta do próprio repositório, sem necessidade de `research/`.
  - Nenhum achado `BLOCKER` ou `WARNING` de produto, arquitetura ou segurança: as decisões de alto risco (checksum forjável, timing de hook, escopo por target, trust boundary do guard) já estão explicitadas em `DEC-001`–`DEC-005` e nos riscos da seção 16, não escondidas.
  - `NOTE` (retificação pós-Defined, durante `$specsfy-06-tdd-bdd` modo `prepare`): AC-018/AC-019 originalmente descreviam "arquivo ausente" como gatilho de fail-open, contradizendo o próprio FR-001 — ausência de `AGENTS.md`/`.specsfy/` é o sinal normal de "não configurado" e deve continuar negando (AC-001/AC-004), não liberar. Corrigido para "arquivo existente mas ilegível por erro de ambiente" (permissão negada), coerente com o AC-007 original, que já fazia essa distinção corretamente. Também corrigido: FR-005 e os ACs 008/016/017 descreviam incorretamente "backends agy/codex/goose/pi" (o conceito real de backend de agente CLI do doctor, não relacionado) em vez do mecanismo real de instalação por target (`claude-code`/`antigravity`, `src/targets/*.ts`) — corrigido para refletir que `partitionByEvent`/`supportedEvents` já cobre esse escopo sem código novo (DEC-006).

#### Gate do Ato II — Plano

- **Resultado**: READY — 2026-09-18
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/defined/0026-gate-de-bloqueio-chat-proibido-ate-setup-conversacional-real/spec.md`
- **Achados**:
  - 29 tarefas (22 `[TEST][TDD]` + 7 `[CODE]`), 21 predecessoras TDD concluídas (T001–T021) com RED observado real via `npx vitest run`, cobrindo os 21 `AC`, 5 `FR` e 3 `NFR`. `covered_spec_ids=31/31`.
  - `NOTE`: T017 (AC-016) observou GREEN de imediato, sem RED — documentado explicitamente como comportamento pré-existente (`setup-check` já suportado pelo target `antigravity` desde SPEC-0022/0023), não como predecessor de nenhum `[CODE]` novo; nenhuma tarefa de produção depende dela para GREEN.
  - `NOTE`: durante a materialização, dois problemas reais no Ato I foram corrigidos ainda dentro deste ciclo (sem consumidor externo dependendo da spec): AC-018/AC-019 (contradição fail-open vs. "não configurado", corrigida para cenário de permissão negada) e FR-005/AC-008/016/017 (terminologia incorreta "backends agy/codex/goose/pi" trocada pelo mecanismo real `partitionByEvent`/target `antigravity`, registrado como `DEC-006`); `validate_spec.mjs` re-executado após as correções, `READY`.
  - Nenhum achado `BLOCKER`.

#### Gate do Ato III — Entrega

- **Resultado**: Passed — 2026-09-18
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0026-gate-de-bloqueio-chat-proibido-ate-setup-conversacional-real/spec.md .` + `node .agents/skills/specsfy-07-implement/scripts/verify_evidence.mjs specs/in-progress/0026-gate-de-bloqueio-chat-proibido-ate-setup-conversacional-real/spec.md .`
- **Achados**:
  - 29/29 tarefas concluídas (22 `[TEST][TDD]` + 7 `[CODE]`); `verify_evidence.mjs`: `PASSED (strict)`; `check_traceability.mjs` (escopo desta spec): 31/31 IDs cobertos, nenhuma cadeia quebrada.
  - Suíte completa: 653 testes, 642 GREEN, 11 falhas pré-existentes e não relacionadas (confirmadas por `git stash`/`git stash pop` contra a árvore antes desta spec). `tsc --noEmit` e `npm run build` limpos.
  - Dois achados registrados fora do escopo de correção desta spec, ambos documentados sem serem silenciados: `FIND-INT-005` (target `antigravity` nunca recebe nenhum script de hook, mesmo para eventos suportados — pré-existente) e `DEC-006` (mecanismo genérico de partição por target já cobria FR-005, T027 não precisou de código novo).
  - Verificação manual real neste repositório: `maestro setup --defer-conversational --target claude-code` e `maestro doctor` mostrando o `WARN` de adiamento distinto de "nunca configurado".
  - Nenhum achado `BLOCKER`.

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

Runner TDD: Vitest (Node sem PHP), script `test:tdd`. Toda tarefa `[CODE]` exige rodar `$specsfy-documentator` antes de `EXECUTE`, mesmo quando a documentação já existir. Nenhuma tarefa desta fatia altera manifest, dependência estrutural, schema ou banco — nenhuma tarefa `[DOC]` para `STACK.md`/`DATABASE.md` é necessária; a evidência de cada `[CODE]` registra essa justificativa em vez de criar conteúdo artificial.

#### Fase 1 — RED TDD informado pelo BDD (grupo A: bloqueio e allowlist, `tests/hooks-setup-gate.test.ts`)

- [x] T001 [TEST] [TDD] [US-001] Derivar do AC-001 um caso Vitest falhando em tests/hooks-setup-gate.test.ts — Refs: US-001, FR-001, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-001 (projeto sem nenhum traço, mensagem comum) e confirmar o shape do input JSON de UserPromptSubmit usado pelos demais hooks do repositório.
  - [x] **EXECUTE**: Escrever o caso com marcador próprio `SPECSFY:`, chamando a função de decisão do hook `setup-gate` com um projeto sem traços e uma mensagem comum, esperando `decision: deny`.
  - [x] **VERIFY**: Observar RED por ausência da função/hook ainda não implementados.
  - [x] **VISUAL**: Não aplicável — hook sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando `npm run test:tdd -- hooks-setup-gate` e a causa do RED.
  - [x] **IMPROVE**: Registrar aprendizado sobre o shape mínimo de input necessário para os demais casos do grupo.

- [x] T002 [TEST] [TDD] [US-001] Derivar do AC-002 um caso Vitest falhando em tests/hooks-setup-gate.test.ts — Refs: US-001, FR-001, FR-002, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-002 (prefixo exato `/specsfy-setup` passa mesmo sem traços).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` esperando `decision: allow` quando o prompt é exatamente `/specsfy-setup`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — hook sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

- [x] T003 [TEST] [TDD] [US-001] Derivar do AC-003 um caso Vitest falhando em tests/hooks-setup-gate.test.ts — Refs: US-001, FR-001, FR-002, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-003 (prefixo exato `/setup-matt-pocock-skills` passa).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` esperando `decision: allow` para esse segundo comando.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — hook sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

- [x] T004 [TEST] [TDD] [US-001] Derivar do AC-004 um caso Vitest falhando em tests/hooks-setup-gate.test.ts — Refs: US-001, FR-001, NFR-001, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-004 (specsfy-setup completo, matt-pocock pendente, mensagem comum continua bloqueada).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` esperando `decision: deny` quando só um dos dois estiver configurado.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — hook sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

- [x] T005 [TEST] [TDD] [US-001] Derivar do AC-005 um caso Vitest falhando em tests/hooks-setup-gate.test.ts — Refs: US-001, FR-001, NFR-001, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-005 (ambos os traços presentes, tudo liberado).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` esperando `decision: allow` sem restrição quando os 4 traços de specsfy-setup e `## Agent skills` estiverem presentes.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — hook sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

- [x] T006 [TEST] [TDD] [US-001] Derivar do AC-006 um caso Vitest falhando em tests/hooks-setup-gate.test.ts — Refs: US-001, FR-002, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-006 (menção ao comando no meio do texto não conta como prefixo).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` esperando `decision: deny` para a mensagem "me explica o que /specsfy-setup faz antes de eu rodar".
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — hook sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

- [x] T007 [TEST] [TDD] [US-001] Derivar do AC-007 um caso Vitest falhando em tests/hooks-setup-gate.test.ts — Refs: US-001, FR-001, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-007 (erro de leitura do hook nunca bloqueia por conta própria).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` simulando uma leitura de arquivo que lança erro e esperando `decision: allow`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — hook sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

- [x] T008 [TEST] [TDD] [US-001] Derivar do AC-018 um caso Vitest falhando em tests/hooks-setup-gate.test.ts — Refs: NFR-002, AC-018 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-018 (AGENTS.md ilegível, não ausente, não trava) — distinguir de AC-001/AC-004, onde a ausência real continua negando.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` simulando AGENTS.md com permissão de leitura negada (chmod 000 ou equivalente) e esperando `decision: allow`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — hook sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

- [x] T009 [TEST] [TDD] [US-001] Derivar do AC-019 um caso Vitest falhando em tests/hooks-setup-gate.test.ts — Refs: NFR-002, AC-019 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-019 (.specsfy/ ilegível, não ausente, não trava) — mesma distinção de AC-018.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` simulando .specsfy/ com permissão de leitura negada (chmod 000 ou equivalente) e esperando `decision: allow`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — hook sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Consolidar T007/T008/T009 num helper de simulação de erro de leitura reutilizável pelos três casos.

#### Fase 1 — RED TDD informado pelo BDD (grupo B: adiamento e expiração, `tests/setup-defer.test.ts`)

- [x] T010 [TEST] [TDD] [US-002] Derivar do AC-009 um caso Vitest falhando em tests/setup-defer.test.ts — Refs: US-002, FR-003, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-009 (adiamento grava contractId vigente e libera o chat).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` chamando `writeDeferral`/`isDeferralActive` de `src/setup/defer.ts` e esperando adiamento ativo logo após a gravação.
  - [x] **VERIFY**: Observar RED por ausência do módulo `src/setup/defer.ts`.
  - [x] **VISUAL**: Não aplicável — comando de CLI sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

- [x] T011 [TEST] [TDD] [US-002] Derivar do AC-012 um caso Vitest falhando em tests/setup-defer.test.ts — Refs: US-002, FR-003, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-012 (mudança no contrato de traços invalida o adiamento anterior).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` gravando um adiamento sob um contractId simulado e depois recalculando `isDeferralActive` com um contractId diferente, esperando `false`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — comando de CLI sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

- [x] T012 [TEST] [TDD] [US-002] Derivar do AC-013 um caso Vitest falhando em tests/setup-defer.test.ts — Refs: US-002, FR-003, AC-013 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-013 (contrato inalterado mantém o adiamento válido).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` gravando um adiamento e recalculando `isDeferralActive` com o mesmo contractId, esperando `true`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — comando de CLI sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

#### Fase 1 — RED TDD informado pelo BDD (grupo C: guard do comando de adiamento, `tests/hooks-guard-defer.test.ts`)

- [x] T013 [TEST] [TDD] [US-002] Derivar do AC-010 um caso Vitest falhando em tests/hooks-guard-defer.test.ts — Refs: US-002, FR-004, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-010 (guard nega `--defer-conversational` executado via Bash pelo agente).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` chamando a função de decisão do guard com `tool_name: Bash` e `command` contendo `maestro setup --defer-conversational`, esperando `decision: deny`.
  - [x] **VERIFY**: Observar RED por ausência da função/hook ainda não implementados.
  - [x] **VISUAL**: Não aplicável — guard sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

- [x] T014 [TEST] [TDD] [US-002] Derivar do AC-011 um caso Vitest falhando em tests/hooks-guard-defer.test.ts — Refs: US-002, FR-004, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-011 (guard cobre também tool MCP de shell, não só Bash).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` chamando a mesma função de decisão com `tool_name` casando o padrão `mcp__.*(execute|run_in_terminal|shell).*`, esperando `decision: deny`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — guard sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

- [x] T015 [TEST] [TDD] [US-002] Derivar do AC-015 um caso Vitest falhando em tests/hooks-guard-defer.test.ts — Refs: US-002, FR-004, AC-015 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-015 (execução fora de qualquer tool de agente não é interceptada).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` chamando a mesma função de decisão sem `tool_name` presente no input (execução direta em terminal), esperando `decision: allow`.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — guard sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

#### Fase 1 — RED TDD informado pelo BDD (grupo D: partição por target, `tests/setup-write-gate.test.ts`)

- [x] T016 [TEST] [TDD] [US-001] Derivar do AC-008 um caso Vitest falhando em tests/setup-write-gate.test.ts — Refs: US-001, FR-005, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-008 (target antigravity nunca bloqueia) e reler `partitionByEvent`/`SUPPORTED` em src/targets/claude-code.ts e src/targets/antigravity.ts.
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` chamando `antigravityAdapter.formatHooks([corpusHook("setup-gate")])` e confirmando que o hook volta em `skipped`, não em `installed`.
  - [x] **VERIFY**: Observar RED por ausência do arquivo `resources/hooks/setup-gate.md` (corpusHook lança ENOENT) — a lógica de partição em si já existe e não muda.
  - [x] **VISUAL**: Não aplicável — instalação sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

- [x] T017 [TEST] [TDD] Derivar do AC-016 um caso Vitest falhando em tests/setup-write-gate.test.ts — Refs: FR-005, AC-016 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-016 (aviso não-bloqueante continua ativo fora do Claude Code).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` chamando `antigravityAdapter.formatHooks([corpusHook("setup-check")])` e confirmando que `setup-check` (evento `session-start`) volta em `installed`, não em `skipped`, em ambos os targets.
  - [x] **VERIFY**: Passou de imediato, GREEN — não RED. `setup-check` já é evento `session-start`, já suportado por `antigravity` desde SPEC-0022/0023; nada nesta fatia muda esse fato. Tratado como o caso previsto pela própria disciplina TDD ("se passar antes da mudança... prove que a funcionalidade já existe"), não como RED fabricado.
  - [x] **VISUAL**: Não aplicável — instalação sem superfície visual.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-write-gate` (caso AC-016 isolado): GREEN sem nenhuma alteração de produção. Registrado como prova de comportamento pré-existente, não como predecessor bloqueante de um `[CODE]`.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária; achado registrado para não ser confundido com RED ausente em revisão futura.

- [x] T018 [TEST] [TDD] Derivar do AC-017 um caso Vitest falhando em tests/setup-write-gate.test.ts — Refs: FR-005, AC-017 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-017 (instalação não grava o hook de bloqueio fora do Claude Code).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` rodando `runSetup` com `target: "antigravity"` sobre um hooksDir que inclui o novo `setup-gate.md` e confirmando que `.maestro/hooks/setup-gate.sh` nunca é criado nesse target.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — instalação sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

#### Fase 1 — RED TDD informado pelo BDD (grupo E: relato do doctor, `tests/doctor-maestro.test.ts`)

- [x] T019 [TEST] [TDD] [US-002] Derivar do AC-014 um caso Vitest falhando em tests/doctor-maestro.test.ts — Refs: US-002, NFR-003, AC-014 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-014 (doctor nunca esconde um adiamento ativo).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` chamando `diagnoseMaestroProject` com adiamento ativo e esperando um finding distinto mencionando o adiamento.
  - [x] **VERIFY**: Observar RED por ausência do novo ramo em `diagnoseMaestroProject`.
  - [x] **VISUAL**: Não aplicável — CLI sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

- [x] T020 [TEST] [TDD] Derivar do AC-020 um caso Vitest falhando em tests/doctor-maestro.test.ts — Refs: NFR-003, AC-020 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-020 (setup-check continua avisando mesmo com adiamento ativo).
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` confirmando que o script do hook `setup-check` não muda de comportamento com adiamento ativo.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — CLI sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Nenhuma melhoria adicional identificada neste caso.

- [x] T021 [TEST] [TDD] Derivar do AC-021 um caso Vitest falhando em tests/doctor-maestro.test.ts — Refs: NFR-003, AC-021 — Depends: none
  - [x] **PREP**: Ler o Gherkin do AC-021 (doctor distingue "adiado" de "nunca configurado").
  - [x] **EXECUTE**: Escrever o caso com marcador `SPECSFY:` comparando a saída de `diagnoseMaestroProject` para os dois projetos simulados, esperando mensagens distintas.
  - [x] **VERIFY**: Observar RED válido.
  - [x] **VISUAL**: Não aplicável — CLI sem superfície visual.
  - [x] **EVIDENCE**: Registrar comando e causa do RED.
  - [x] **IMPROVE**: Consolidar T019/T021 reaproveitando os mesmos fixtures de projeto simulado.

#### Fase 2 — US-001: bloqueio do chat até a configuração conversacional ser real (P1)

**Objetivo**: nenhuma mensagem além dos dois comandos de setup chega ao modelo enquanto o projeto não estiver configurado.
**Teste independente**: `npm run test:tdd -- hooks-setup-gate` com todos os casos GREEN, mais instalação real via `dist/cli.js setup` neste repositório confirmando negação de uma mensagem comum.

- [x] T022 [CODE] [US-001] Adicionar HOOK_PROMPT ao PREAMBLE em src/hooks/claude-code.ts — Refs: FR-001, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — Depends: T001, T002, T003, T004, T005, T006
  - [x] **PREP**: Confirmado o padrão de extração `_hook_str` já usado por HOOK_TOOL/HOOK_SESSION (src/hooks/claude-code.ts:148-150).
  - [x] **EXECUTE**: Adicionado `"HOOK_PROMPT=$(_hook_str prompt)"` ao array PREAMBLE, logo após a extração de HOOK_SESSION.
  - [x] **VERIFY**: `npx tsc --noEmit` limpo; `npx vitest run tests/hooks-setup-gate.test.ts` confirmou (junto de T023) 10/10 GREEN.
  - [x] **VISUAL**: Não aplicável — mudança em gerador de shell script, sem interface.
  - [x] **EVIDENCE**: Arquivo alterado: src/hooks/claude-code.ts (única linha nova + comentário). Sem regressão nos demais hooks (suíte completa em T029).
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária; mudança pontual e isolada.
  <!-- specsfy:evidence {"task":"T022","refs":["US-001","FR-001","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006"],"files":["src/hooks/claude-code.ts"],"commands":[{"run":"npx vitest run tests/hooks-setup-gate.test.ts","exit":0}]} -->

- [x] T023 [CODE] [US-001] Criar resources/hooks/setup-gate.md (hook on-prompt: checagem ao vivo, allowlist e fail-open) — Refs: FR-001, FR-002, NFR-001, NFR-002, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-018, AC-019 — Depends: T001, T002, T003, T004, T005, T006, T007, T008, T009, T022
  - [x] **PREP**: Relido `resources/hooks/setup-check.md` (mesma lógica de traços) e `resources/hooks/guard-destructive.md` (padrão decision/message); `SPECSFY_SETUP_TRACES`/`AGENT_SKILLS_HEADING` de src/setup/layout.ts.
  - [x] **EXECUTE**: Escrito o hook (`event: on-prompt`) — allowlist por prefixo exato sobre `$HOOK_PROMPT`; checagem ao vivo dos 4 traços de specsfy-setup e da seção `## Agent skills`; distingue ausência genuína (nega) de erro de leitura (`cat`/`ls` falhando, permissão negada — libera); checa adiamento comparando o hash do contrato (mesmo material de `configurationContractId`) contra `.maestro/install.json`.
  - [x] **VERIFY**: `npx vitest run tests/hooks-setup-gate.test.ts` — 10/10 GREEN.
  - [x] **VISUAL**: Não aplicável — hook sem interface.
  - [x] **EVIDENCE**: Arquivo criado: resources/hooks/setup-gate.md. Verificado manualmente também via `maestro doctor` e `--defer-conversational` num projeto de teste real (/tmp/maestro-defer-test-2).
  - [x] **IMPROVE**: Nenhuma duplicação de lógica evitável — a checagem de traços é inerentemente um bloco de shell independente do TypeScript de `assessConfiguration` (hooks são scripts standalone, sem import possível); a mesma duplicação já existe entre `setup-check.md` e `assessConfiguration` desde SPEC-0025, então este hook segue o padrão já aceito no repositório em vez de introduzir um novo.
  <!-- specsfy:evidence {"task":"T023","refs":["FR-001","FR-002","NFR-001","NFR-002","AC-001","AC-002","AC-003","AC-004","AC-005","AC-006","AC-007","AC-018","AC-019"],"files":["resources/hooks/setup-gate.md"],"commands":[{"run":"npx vitest run tests/hooks-setup-gate.test.ts","exit":0}]} -->

**Checkpoint**: instalar o hook num projeto de teste sem traços e confirmar negação de mensagem comum e passagem dos dois comandos exatos.

#### Fase 3 — US-002: adiamento deliberado e auditável do bloqueio (P2)

**Objetivo**: escape hatch funcional só via terminal real, com expiração por contrato, sem esconder o estado.
**Teste independente**: `npm run test:tdd -- setup-defer hooks-guard-defer doctor-maestro` com todos os casos GREEN, mais execução manual de `maestro setup --defer-conversational` neste repositório confirmando liberação do chat.

- [x] T024 [CODE] [US-002] Criar src/setup/defer.ts (configurationContractId, readDeferral, writeDeferral, isDeferralActive) — Refs: FR-003, AC-009, AC-012, AC-013 — Depends: T010, T011, T012
  - [x] **PREP**: Confirmado o schema atual de `.maestro/install.json` via `readRecordFile`/`writeRecordFile` (src/setup/write.ts) — round-trip JSON sem normalização que descartasse campos extras, seguro para um campo novo (`conversationalGateDeferral`) sem tocar o schema `InstallRecord` compartilhado.
  - [x] **EXECUTE**: Implementado `configurationContractId(root)` (SHA-256 de `SPECSFY_SETUP_TRACES` + `AGENT_SKILLS_HEADING`, primeiros 16 hex), `writeDeferral(root, contractId, now?)`, `readDeferral(root)` e `isDeferralActive(root)`, persistindo em `.maestro/install.json` via `readRecordFile`/`writeRecordFile` já existentes.
  - [x] **VERIFY**: `npx vitest run tests/setup-defer.test.ts` — 3/3 GREEN.
  - [x] **VISUAL**: Não aplicável — módulo interno sem interface.
  - [x] **EVIDENCE**: Arquivo criado: src/setup/defer.ts. Corrigido um import errado durante o desenvolvimento (`readRecordFile`/`writeRecordFile` vivem em `./write.js`, não em `./record.js`) — detectado pelo próprio teste falhando com `TypeError: readRecordFile is not a function`.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária além da correção de import já registrada acima.
  <!-- specsfy:evidence {"task":"T024","refs":["US-002","FR-003","AC-009","AC-012","AC-013"],"files":["src/setup/defer.ts"],"commands":[{"run":"npx vitest run tests/setup-defer.test.ts","exit":0}]} -->

- [x] T025 [CODE] [US-002] Adicionar flag --defer-conversational ao comando setup em src/cli.ts — Refs: FR-003, AC-009 — Depends: T024
  - [x] **PREP**: Relido `formatSetup`/`parseFlags` — `parseFlags` só captura pares `--flag valor`, então a flag booleana precisou de detecção própria (`args.includes(...)`) antes de repassar o resto para `parseFlags`/`SETUP_FLAGS`.
  - [x] **EXECUTE**: Adicionada a flag como ação standalone (não roda o resto do `setup`): chama `writeDeferral(root, configurationContractId(root))` quando há algo pendente (via `assessConfiguration`), ou avisa "nothing pending" sem gravar nada quando o projeto já está totalmente configurado (caso-limite da seção 7). `USAGE_SETUP` documentado com a nova flag.
  - [x] **VERIFY**: `npx tsc --noEmit` limpo; `npm version patch --no-git-tag-version` + `npm run build` (2.1.28 → 2.1.29, checksum de versão exige bump a cada mudança de src/); `node dist/cli.js setup --defer-conversational --target claude-code` num projeto de teste real (/tmp/maestro-defer-test-2) — gravou `conversationalGateDeferral` em `.maestro/install.json` com `contractId` e `at` corretos, exit 0.
  - [x] **VISUAL**: Não aplicável — CLI sem interface.
  - [x] **EVIDENCE**: Arquivo alterado: src/cli.ts. Saída real observada: "maestro: conversational setup deferred. The setup-gate chat block is off until the configuration contract changes (...)".
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária.
  <!-- specsfy:evidence {"task":"T025","refs":["FR-003","AC-009"],"files":["src/cli.ts"],"commands":[{"run":"node dist/cli.js setup --defer-conversational --target claude-code","exit":0}]} -->

- [x] T026 [CODE] [US-002] Criar resources/hooks/guard-defer-conversational.md (guard PreToolUse) — Refs: FR-004, AC-010, AC-011, AC-015 — Depends: T013, T014, T015, T024
  - [x] **PREP**: Relido `resources/hooks/guard-destructive.md` como precedente direto de guard `PreToolUse` (frontmatter `tools:`/`blocking:`, variável `decision`/`message`).
  - [x] **EXECUTE**: Escrito o guard (`event: before-tool`, `tools: Bash|mcp__.*(execute|run_in_terminal|shell).*`, `blocking: true`) que inspeciona `$HOOK_COMMAND` procurando `maestro setup ... --defer-conversational` e nega (sem perguntar — diferente de `guard-destructive`, não há uso legítimo desse comando via tool) com mensagem explicando a exigência de terminal real.
  - [x] **VERIFY**: `npx vitest run tests/hooks-guard-defer.test.ts` — 4/4 GREEN.
  - [x] **VISUAL**: Não aplicável — guard sem interface.
  - [x] **EVIDENCE**: Arquivo criado: resources/hooks/guard-defer-conversational.md.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária além do reaproveitamento do padrão de `guard-destructive`.
  <!-- specsfy:evidence {"task":"T026","refs":["FR-004","AC-010","AC-011","AC-015"],"files":["resources/hooks/guard-defer-conversational.md"],"commands":[{"run":"npx vitest run tests/hooks-guard-defer.test.ts","exit":0}]} -->

- [x] T027 [CODE] [US-001] Confirmar em src/targets/antigravity.ts, sem alterar seu conteúdo, que partitionByEvent já cobre o escopo por target de setup-gate e guard-defer-conversational — Refs: FR-005, AC-008, AC-016, AC-017 — Depends: T016, T017, T018, T023, T026
  - [x] **PREP**: Reler `partitionByEvent`/`SUPPORTED` em src/targets/claude-code.ts e src/targets/antigravity.ts, confirmando que `on-prompt` já está fora do `SUPPORTED` de antigravity e que `before-tool` está em ambos.
  - [x] **EXECUTE**: Nenhuma mudança de produção necessária — o mecanismo genérico já existente cobre FR-005 assim que T023/T026 registraram os novos hooks no corpus; confirmado, sem diff em src/targets/*.ts nem src/setup/write.ts.
  - [x] **VERIFY**: `npm run test:tdd -- setup-write-gate` com os 3 casos do grupo D em GREEN.
  - [x] **VISUAL**: Não aplicável — instalação sem interface.
  - [x] **EVIDENCE**: GREEN confirmado sem diff de produção. Achado adicional durante esta tarefa: `antigravityAdapter.settingsPath` é sempre `null`, então `runSetup` nunca grava NENHUM script de hook para esse target hoje, mesmo para eventos que ele suporta (ex.: `setup-check`) — gap pré-existente, fora do escopo de SPEC-0026, registrado em `findings/internal/FIND-INT-005-antigravity-nunca-recebe-script-de-hook.md`. AC-016 e seu teste foram corrigidos para não afirmar algo que o sistema não entrega hoje (ver seção 6).
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária; achado registrado como DEC-006 (seção 17) e FIND-INT-005 para não ser perdido em revisão futura.
  <!-- specsfy:evidence {"task":"T027","refs":["FR-005","AC-008","AC-016","AC-017"],"files":["src/targets/antigravity.ts"],"commands":[{"run":"npx vitest run tests/setup-write-gate.test.ts","exit":0}]} -->

- [x] T028 [CODE] [US-002] Reportar estado de adiamento em src/doctor/maestro.ts — Refs: NFR-003, AC-014, AC-020, AC-021 — Depends: T019, T020, T021, T024
  - [x] **PREP**: Relido `diagnoseMaestroProject`/`diagnoseMaestro` e o formato de `MaestroFinding`; confirmado que `renderReport` (src/cli.ts:187-188) já mapeia genericamente cada `report.maestro[]` para uma linha — nenhuma mudança própria necessária em `src/cli.ts` para este achado aparecer no relatório, então o título da tarefa foi ajustado (era "src/doctor/maestro.ts e src/cli.ts").
  - [x] **EXECUTE**: `diagnoseMaestroProject` agora chama `isDeferralActive(root)`; quando verdadeiro, substitui os `WARN area:"configuration"` genéricos por um único `WARN` nomeando o adiamento explicitamente. `resources/hooks/setup-check.md` não foi alterado — continua avisando de forma idêntica, independente do adiamento.
  - [x] **VERIFY**: `npx vitest run tests/doctor-maestro.test.ts` — 3/3 GREEN (após corrigir a regex do próprio teste, ver EVIDENCE).
  - [x] **VISUAL**: Não aplicável — CLI sem interface.
  - [x] **EVIDENCE**: Arquivo alterado: src/doctor/maestro.ts. Dois ajustes descobertos rodando de verdade: (1) o teste original checava `/adiad/i`, mas a mensagem foi escrita em inglês para bater com a convenção do resto do arquivo (`"legacy inline hook entries..."` etc.) — corrigido para `/deferred/i`; (2) o AC-020 assumia que `setup-check` sempre emite a mensagem granular "missing from /specsfy-setup: ..." — mas um projeto sem `.specsfy/` nenhum cai no branch genérico "hasn't completed setup yet", então o regex do teste foi ampliado. Verificado também manualmente: `node dist/cli.js doctor` (após `npm version patch` → 2.1.30 + rebuild) num projeto com adiamento ativo mostrou exatamente uma linha `WARN configuration — conversational setup ... deliberately deferred ...` no lugar das 5 linhas `WARN configuration — missing ...` que apareciam antes do adiamento.
  - [x] **IMPROVE**: Nenhuma melhoria de processo necessária além das duas correções já registradas.
  <!-- specsfy:evidence {"task":"T028","refs":["NFR-003","AC-014","AC-020","AC-021"],"files":["src/doctor/maestro.ts"],"commands":[{"run":"npx vitest run tests/doctor-maestro.test.ts","exit":0}]} -->

**Checkpoint**: rodar `maestro doctor` num projeto com adiamento ativo e confirmar que o achado aparece distinto de "nunca configurado", e que `setup-check` continua avisando.

#### Fase final — Qualidade

- [x] T029 [TEST] Executar regressão completa em tests/hooks-setup-gate.test.ts, tests/setup-defer.test.ts, tests/hooks-guard-defer.test.ts, tests/setup-write-gate.test.ts e tests/doctor-maestro.test.ts, e rastreabilidade via .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs — Refs: US-001, US-002, FR-001, FR-002, FR-003, FR-004, FR-005, NFR-001, NFR-002, NFR-003, AC-001 a AC-021 — Depends: T022, T023, T024, T025, T026, T027, T028
  - [x] **PREP**: Identificada toda a suíte tocada por esta fatia (5 arquivos novos, 29 casos) e os checks estáticos do repositório (`tsc --noEmit`, `npm run build`).
  - [x] **EXECUTE**: `npx vitest run` (suíte inteira, 653 testes): 641→642 GREEN conforme tarefas avançaram, 11 falhas pré-existentes confirmadas via `git stash`/`git stash pop` (config-schema, documentation-diagnose, setup-documentation-extension, setup-readme-homepage, doctor-documentation-issues — nenhuma toca hooks/setup/doctor/defer, mesmas falhas na árvore limpa antes de qualquer mudança desta spec). `npx tsc --noEmit` limpo. `npm run build` limpo (2.1.28 → 2.1.30, dois bumps de patch exigidos pelo `check-version-checksum.mjs` a cada mudança de `src/`/`resources/`).
  - [x] **VERIFY**: `check_traceability.mjs` (escopo desta spec): 31/31 IDs cobertos, nenhuma `CADEIA QUEBRADA` para IDs desta spec (com `--full-chain` e `--task`, após corrigir T027 sem `specsfy:evidence` e US-001/US-002 ausentes dos `refs` de T022/T024). `verify_evidence.mjs`: `PASSED (strict)`. Os "MARCADORES ÓRFÃOS" que `--full-chain` reporta são de outras specs (confirmado rodando o mesmo comando contra `specs/completed/0025-.../spec.md`, que também reporta `GAPS` pelo mesmo motivo) — fenômeno pré-existente do repositório inteiro, não desta fatia.
  - [x] **VISUAL**: Não aplicável — sem interface em toda a fatia.
  - [x] **EVIDENCE**: 653 testes totais, 642 GREEN, 11 falhas pré-existentes não relacionadas (confirmadas antes desta spec existir). 29/29 testes desta spec GREEN. Verificação manual real neste repositório: `maestro setup --defer-conversational --target claude-code` grava o adiamento; `maestro doctor` mostra o `WARN` distinto de adiamento em vez das 5 linhas de "missing".
  - [x] **IMPROVE**: Duas correções de rastreabilidade aplicadas nesta tarefa (comentário `specsfy:evidence` ausente em T027; `US-001`/`US-002` ausentes dos `refs` de T022/T024) — registradas para lembrete futuro: toda tarefa `[CODE]`, mesmo sem diff de produção, precisa do comentário de evidência, e `refs` deve incluir o nível `US`, não só `FR`/`AC`.

### 15. Ordem de execução

- Caminho crítico: T001–T009 → T022 → T023 → (T010–T012 → T024) → T025 → (T013–T015 → T026) → (T016–T018 → T027) → (T019–T021 → T028) → T029.
- Tarefas paralelas: `[P]` entre T010–T012, T013–T015, T016–T018 e T019–T021 (grupos B, C, D e E não compartilham arquivo nem estado mutável entre si, todos dependem apenas de T024 ou de seus próprios predecessores TDD); T025, T026 e T027 podem avançar em paralelo assim que T024 estiver GREEN, porque tocam arquivos distintos (`src/cli.ts`, `resources/hooks/guard-defer-conversational.md`, `src/setup/write.ts`).
- Estratégia de MVP: T001–T009, T022 e T023 (FR-001/FR-002, US-001) entregam o bloqueio observável isoladamente — é o menor conjunto que já resolve o problema relatado. T010–T021 e T024–T028 (US-002) completam o escape hatch, o guard e a observabilidade sem os quais o bloqueio se tornaria impraticável no dia a dia.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- SPEC-0022 (tradução de hooks canônicos para Claude Code, `src/hooks/claude-code.ts`, `src/hooks/source.ts`).
- SPEC-0025 (`diagnoseMaestroProject`, `assessConfiguration`, `SPECSFY_SETUP_TRACES`, `AGENT_SKILLS_HEADING`, hook `setup-check`).
- SPEC-0024 (traço `## Agent skills` em `AGENTS.md`, direção de instrução que este gate consulta).

#### Riscos

- Alguém com acesso de escrita ao repositório pode remover ou desativar o hook de bloqueio ou o guard — mesmo trust boundary já aceito para `protect-authorship` e demais guards locais; o gate é fricção contra esquecimento, não controle de segurança contra adulteração deliberada.
- Um `PreToolUse` guard mal calibrado pode falsear negativos (deixar passar variações do comando de adiamento não previstas) ou falsos positivos (bloquear um comando legítimo que apenas menciona `--defer-conversational` em texto, não em execução) → mitigado por inspecionar `HOOK_COMMAND` de forma análoga aos guards já existentes, testado com os casos de AC-010/AC-011.

#### Suposições

- O identificador do contrato de traços pode ser um hash simples (ex.: SHA-256) da concatenação ordenada de `SPECSFY_SETUP_TRACES` e `AGENT_SKILLS_HEADING`; não precisa ser criptograficamente forte, só estável e determinístico para a mesma lista de traços.
- O registro de adiamento em `.maestro/install.json` é aceitável mesmo sendo um arquivo majoritariamente machine-owned, porque `--defer-conversational` só é gravado por uma execução real de CLI, nunca por um hook automático.

### 17. Decisões

- **DEC-001**: Rejeitar o checklist booleano + checksum imutável em `config.yaml`, proposto originalmente pelo usuário — motivo: um checksum derivado dos mesmos campos que protege é forjável por qualquer pessoa com acesso de escrita ao arquivo, sem adicionar defesa real; a checagem de traços de arquivo já existente (SPEC-0025) é estritamente mais forte. Alternativa adotada: checagem sempre ao vivo, sem estado novo (PR-001).
- **DEC-002**: Rejeitar o hook que "flipa" um campo booleano quando a skill conversacional é chamada — motivo: não existe evento de hook Claude Code para "a skill terminou com sucesso" (`PostToolUse` do `Skill` tool dispara no início, não no fim de uma conversa multi-turno); qualquer flip seria um falso positivo estrutural. Alternativa adotada: checagem ao vivo dos traços reais (PR-002).
- **DEC-003**: Rejeitar reset do gate por bump de versão do pacote maestro — motivo: a maioria dos bumps (ex.: `chore(deps)`) não muda o que as skills perguntam nem os traços exigidos; resetar sempre penalizaria uso honesto sem impedir burla deliberada. Alternativa adotada: reavaliação só quando o identificador do contrato de traços mudar (FR-003).
- **DEC-004**: Restringir o escape hatch a execução via terminal real, nunca aceito como comando dentro do próprio chat bloqueado — motivo: aceitar dentro do chat reabriria a allowlist e permitiria o agente bloqueado se autoliberar. Alternativa adotada: guard `PreToolUse` dedicado (FR-004), mesmo padrão de `guard-destructive`.
- **DEC-005**: Escopo do bloqueio restrito ao target `claude-code` nesta entrega — motivo: `antigravity` não tem canal de execução para eventos `on-prompt`/`before-compact` (`src/targets/antigravity.ts`, comentário existente); prometer bloqueio real lá seria uma garantia falsa. O target `antigravity` mantém o aviso não-bloqueante já existente (`setup-check`, evento `session-start`, suportado por ambos).
- **DEC-006**: FR-005 não exige nenhum código novo em `src/setup/write.ts` — descoberto durante a materialização do RED de T016–T018 (grupo D): o mecanismo genérico `partitionByEvent`/`supportedEvents` (introduzido em SPEC-0022/0023, `src/targets/claude-code.ts`, reaproveitado por `src/targets/antigravity.ts`) já exclui `on-prompt` do target `antigravity` antes desta spec existir. A seção 8 e a tarefa T027 foram corrigidas para refletir isso; a versão anterior descrevia incorretamente uma lógica de seleção por "backend" (confundindo com os backends de agente CLI do doctor — agy/codex/goose/pi, um conceito não relacionado) que precisaria ser escrita em `src/setup/write.ts`.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam.
