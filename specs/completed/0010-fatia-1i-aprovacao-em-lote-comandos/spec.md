# Especificação integrada: Fatia 1i: aprovação em lote dos comandos das dependências

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0010 |
| Slug | 0010-fatia-1i-aprovacao-em-lote-comandos |
| Status | Complete |
| Effort | 5 |
| Effort updated at | 2026-08-30 |
| Effort rationale | Comparável à 1c (SPEC-0007, effort 5): estende o mesmo mecanismo de aprovação com um registro persistente, e liga um comando real (a ponte Python) que hoje nunca dispara. Não introduz camada nova de infraestrutura, mas toca três módulos existentes (`approval/`, `setup/run.ts`, `setup/bridge.ts`) e um registro novo. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — a entrega estende o texto/documento de aprovação de terminal já existente (SPEC-0007) e um registro em disco, sem tela. |
| Atualizada em | 2026-08-30 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

`common-rules setup` pede aprovação uma vez por execução (`SPEC-0007`), mas
duas lacunas reais foram encontradas ao investigar esta fatia, lendo o código
de aprovação e de instalação antes de especificar:

1. **O plano aprovado não é o que executa.** `PR-062` (`SPEC-0007`) já
   declara "o plano apresentado é o que será executado, e não uma descrição
   paralela" — mas `src/approval/render.ts`'s `PlannedItem`/`renderPlan` só
   descrevem hooks. A instalação de skills, do framework former project tool e, quando
   ligada, da ponte Python acontece depois da mesma aprovação, sem nunca
   aparecer no texto ou documento que a pessoa de fato viu. A pessoa aprova
   uma lista de hooks e, sem saber, autoriza também um instalador de skills e
   um instalador de framework.
2. **A ponte Python nunca executa de verdade.** `bridgePythonSubsystem`
   (`src/setup/bridge.ts`) criaria uma cópia local de `code-review-graph` via
   `uv venv`/`uv pip install` quando ausente das duas origens. Em produção,
   `src/setup/run.ts:204` chama essa ponte com `execute: false` fixo, e
   `src/cli.ts` nunca fornece `bridgeEnv` — o comando real nunca dispara,
   testado só por fixture injetada. Mesma classe de achado já corrigida duas
   vezes nesta iniciativa (gap de skills, `SPEC-0005`; gap de aprovação,
   `SPEC-0007`): implementação e teste existem, a integração ponta a ponta
   nunca foi ligada.

Sobre essas duas lacunas, a decisão original desta fatia (`D1`,
`specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md`) já previa que a
aprovação em lote de comandos é **configuração persistente e sensível**,
distinta da aprovação efêmera de plano da 1c: quem aprova um comando de
dependência uma vez não deveria precisar aprovar o mesmo comando de novo só
porque `setup` rodou outra vez — hoje, apagar `.claude/skills/` por fora e
rodar `setup` de novo (o cenário de drift já coberto pela reabertura da
`SPEC-0005`) faz a pessoa aprovar tudo de novo, mesmo que nada tenha mudado
no que seria executado.

#### Resultado desejado

O plano apresentado para aprovação lista cada comando de dependência que a
execução de fato dispararia — hooks, instalador de skills por origem,
instalador do framework former project tool e a ponte Python — cumprindo `PR-062` pela
primeira vez de ponta a ponta. Um registro persistente, local ao projeto,
lembra cada comando já aprovado pelo par binário+argv exato; comandos já
registrados não pedem aprovação de novo, mesmo quando a execução precisa
reinstalar por drift. Qualquer diferença no argv — uma versão diferente, por
exemplo — conta como comando novo e pede aprovação de novo. A ponte Python
passa a executar de verdade quando aprovada.

#### Métricas de sucesso

- O texto e o documento de aprovação listam hooks, skills, framework former project tool e ponte Python, quando cada um se aplica — nunca só hooks.
- Um comando já aprovado antes, com o mesmo binário e argv exatos, não aparece como pendência de aprovação numa execução seguinte, mesmo após um cenário de drift que force reinstalação.
- Um comando cujo argv mudou desde a última aprovação pede aprovação de novo, sem herdar a aprovação anterior.
- Aprovar um plano com comando novo grava esse comando no registro; recusar não grava nada.
- Com `code-review-graph` ausente das duas origens e `uv` disponível, aprovar a instalação cria `.venv-crg/` de verdade nesta máquina.
- Nenhuma chamada de rede nem prompt de autenticação é introduzido por este mecanismo.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-036** [critical] O plano de aprovação hoje (`SPEC-0007`) só lista hooks; skills, former project tool e a ponte Python escrevem depois da mesma aprovação sem aparecer nela — Verdict: verified — Confidence: high — Evidence: research/aprovacao/leitura-do-fluxo-real.md#o-plano-só-lista-hooks — Budget: 1/1.
- **R-037** [critical] A ponte Python nunca executa em produção: `execute: false` fixo em `run.ts:204`, nenhum `bridgeEnv` fornecido por `cli.ts`, nenhuma `realBridgeEnvironment()` existe — Verdict: verified — Confidence: high — Evidence: research/aprovacao/leitura-do-fluxo-real.md#a-ponte-python-nunca-dispara — Budget: 1/1.

#### Fontes e contexto consultados

- `src/approval/context.ts`, `src/approval/decide.ts`, `src/approval/render.ts` (`SPEC-0007`) — mecanismo de aprovação existente, canal e interpretação da decisão.
- `src/setup/run.ts`, `src/setup/bridge.ts`, `src/setup/env.ts`, `src/cli.ts` — onde o plano é montado, onde a ponte é chamada, e a ausência de fonte real para ela.
- `src/skills/executor.ts`, `src/framework/executor.ts` — os dois instaladores que já executam de verdade hoje, e a forma de seus comandos reais (`spawnSync(bin, args)`).
- `src/setup/record.ts` (`InstallRecord`, `matches()`) — o registro existente de idempotência, cuja forma e ritual de leitura/escrita este registro novo segue, sem reutilizar o mesmo arquivo.
- `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md`, pela `D1` que separou esta fatia da 1c.
- `specs/inbox/2026-08-30-155149-ponte-python-nunca-executa-de-verdade-no-setup-real.md` — captura formal dos dois achados acima, com a decisão já tomada com a pessoa de incluir o wireup da ponte no escopo desta fatia.

#### Documentação consultada

Nenhuma documentação externa publicada; os dois achados vêm de leitura direta do código de produção deste repositório.

#### Artefatos de pesquisa armazenados

- `specs/completed/0010-fatia-1i-aprovacao-em-lote-comandos/research/aprovacao/leitura-do-fluxo-real.md` — os dois achados, com caminho e linha exatos.

#### Dúvidas respondidas

- **Q**: A aprovação em lote é granular — aprovar um comando e recusar outro na mesma execução? → **A**: Não nesta fatia. Mantém-se a mesma granularidade de "aprovar o plano inteiro" já usada pela 1c; a diferença é que comandos já no registro deixam de entrar nessa pergunta. Granularidade por item fica para quando houver pedido concreto — inventar essa UI agora seria a mesma classe de "heurística sem dado real" que a 1e já evitou para memória.
- **Q**: O registro expira aprovação por tempo? → **A**: Não. Sem pedido concreto de prazo, um TTL seria número inventado. Apagar o arquivo do registro é o mecanismo de "esquecer tudo" nesta fatia.
- **Q**: A ponte Python passa a instalar globalmente? → **A**: Não. Continua só local (`.venv-crg/`), exatamente como `bridgePythonSubsystem` já era desenhada — só o `execute: false` fixo sai, e a decisão de executar passa a vir da aprovação real.
- **Q**: O registro novo se funde com `.common-rules/install.json`? → **A**: Não — arquivo próprio. `install.json` é idempotência (o que já está instalado); este registro é permissão (o que já foi aprovado para rodar). Um comando pode estar aprovado sem nunca ter sido executado (plano recusado depois de uma execução anterior tê-lo aprovado não se aplica — mas a distinção semântica se mantém), e fundir os dois acopla dois ciclos de vida diferentes.

#### Dúvidas abertas

Nenhuma que bloqueie esta fatia.

### 3. Escopo e atores

#### Incluído

- Um registro persistente de comandos de dependência aprovados, identificados pelo par binário+argv exato, local ao projeto.
- Extensão do plano de aprovação (texto e documento JSON) para listar cada comando de dependência que a execução dispararia: hooks, instalador de skills por origem, instalador do framework former project tool e a ponte Python.
- Comparação entre o plano da execução atual e o registro: comando já presente não pede aprovação de novo; comando novo ou com argv diferente pede.
- Gravação no registro dos comandos aprovados, no momento em que o plano é aprovado.
- Wireup real da ponte Python: `realBridgeEnvironment()`, `bridgeEnv` fornecido por `src/cli.ts`, e `execute` decidido pela aprovação em vez de fixo em falso.

#### Fora de escopo

- Aprovação granular por item dentro da mesma execução — mantém-se "aprovar o plano inteiro"; só o que já está no registro deixa de entrar na pergunta.
- Expiração ou revogação automática de aprovação por tempo — sem fonte real de prazo, seria heurística inventada.
- Interface de gerenciamento do registro (listar, remover uma aprovação específica) — apagar o arquivo continua sendo o mecanismo de reset nesta fatia.
- Instalação global de `code-review-graph` — a ponte permanece só local, como já era desenhada.
- Qualquer mudança no canal de aprovação em si (interativo vs. documento) — `SPEC-0007` já resolveu isso; esta fatia consome o mesmo mecanismo.

#### Atores

- **Pessoa operando `common-rules setup`**: aprova ou recusa o plano completo, interativamente ou por documento JSON; espera não repetir aprovação do que já aprovou antes.
- **Automação (CI, script)**: fornece aprovação por documento; precisa que o registro já aprovado não trave em espera de aprovação para comandos que já foram aprovados numa execução anterior da mesma automação.

### 4. Princípios e restrições do projeto

- **PR-070**: A identidade de um comando aprovado é o par binário+argv exato — nenhuma correspondência aproximada, prefixo ou wildcard decide equivalência. Mudar qualquer argumento, inclusive uma versão pinada, é comando novo.
- **PR-071**: Cada fonte de leitura/escrita do registro de aprovação é local ao projeto e injetável, no mesmo padrão de `BackendEnvironment`/`OllamaEnvironment`/`CapacityEnvironment` já estabelecido.
- Esta fatia também passa a **cumprir** `PR-062` (`SPEC-0007`, "o plano apresentado é o que será executado") pela primeira vez de ponta a ponta — reafirmado aqui, não reescrito.

### 5. Histórias de usuário

#### US-070 — Não repetir aprovação do que já aprovei (P1)

Como pessoa que roda `common-rules setup` mais de uma vez no mesmo projeto,
quero que um comando de dependência já aprovado antes não peça aprovação de
novo, para que um cenário de drift (por exemplo, apagar skills por fora e
rodar `setup` de novo) não vire fricção repetida sobre o que já decidi.

**Por que P1**: sem isso, a reconciliação de drift que a `SPEC-0005` já
entrega fica mais custosa a cada repetição, mesmo quando nada realmente novo
precisa de decisão.
**Teste independente**: aprovar um plano, simular drift, rodar `setup` de
novo, e confirmar que nenhuma pergunta de aprovação aparece quando o argv de
cada comando é idêntico ao já registrado.
**Requisitos**: FR-070, FR-072, FR-073

#### US-071 — Ver exatamente o que vai rodar (P1)

Como pessoa aprovando o plano de `setup`, quero ver cada comando de
dependência que seria executado — não só os hooks — para aprovar com
informação completa, cumprindo o que `PR-062` já promete.

**Por que P1**: aprovar uma lista parcial e autorizar, sem saber, comandos
que não apareceram nela contradiz o próprio propósito de pedir aprovação.
**Teste independente**: montar um plano com hooks, skills, former project tool e ponte
Python todos pendentes, e conferir que os quatro aparecem no texto e no
documento antes de qualquer escrita.
**Requisitos**: FR-071

#### US-072 — A ponte Python realmente instala quando aprovada (P1)

Como pessoa sem `code-review-graph` disponível localmente nem no `PATH`,
quero que `setup`, uma vez aprovado, efetivamente crie o ambiente virtual e
instale o pacote, para que o subsistema fique disponível sem passo manual
fora da ferramenta.

**Por que P1**: a ponte já existe e é testada; não executar de verdade é uma
lacuna, não uma escolha de escopo — confirmado com a pessoa antes de
especificar.
**Teste independente**: com as duas origens ausentes e `uv` disponível,
aprovar o plano e conferir `.venv-crg/` criado de verdade nesta máquina.
**Requisitos**: FR-074

### 6. Cenários BDD de aceite

#### AC-110 — O plano completo lista cada comando de dependência

**Cobre**: US-071, FR-071

```gherkin
@US-071 @FR-071 @AC-110
Feature: Plano completo de aprovação

  Scenario: Hooks, skills, former project tool e ponte Python, todos pendentes
    Given hooks, skills, o framework former project tool e a ponte Python, todos pendentes de instalação
    When o plano é montado para aprovação
    Then o texto e o documento listam os quatro, não só os hooks
```

#### AC-111 — Comando desconhecido pede aprovação

**Cobre**: US-070, US-071, FR-070, FR-072, NFR-072

```gherkin
@US-070 @US-071 @FR-070 @FR-072 @NFR-072 @AC-111
Feature: Comando novo pede aprovação

  Scenario: Registro vazio, comando de skills pendente
    Given um registro de aprovação vazio
    And um comando de instalação de skills pendente
    When o plano é avaliado contra o registro
    Then esse comando aparece como pendência de aprovação
    And nenhuma chamada de rede ocorre nessa avaliação
```

#### AC-112 — Comando já aprovado, argv idêntico, não pede de novo

**Cobre**: US-070, FR-070, FR-072, NFR-070

```gherkin
@US-070 @FR-070 @FR-072 @NFR-070 @AC-112
Feature: Comando já aprovado não repete pergunta

  Scenario: Mesmo comando de skills, registrado antes, drift força reinstalação
    Given um comando de instalação de skills com um argv exato já registrado como aprovado
    And esse mesmo comando, byte a byte, precisa rodar de novo por causa de drift
    When o plano é avaliado contra o registro
    Then esse comando não aparece como pendência de aprovação
    And a execução prossegue direto para ele
```

#### AC-113 — Comando com argv alterado pede aprovação de novo

**Cobre**: US-070, FR-072, FR-073, NFR-070

```gherkin
@US-070 @FR-072 @FR-073 @NFR-070 @AC-113
Feature: Argv diferente é comando novo

  Scenario: Mesma ponte Python, versão pinada diferente da registrada
    Given um comando de instalação da ponte Python com uma versão registrada como aprovada
    And o comando desta execução pina uma versão diferente
    When o plano é avaliado contra o registro
    Then esse comando aparece como pendência de aprovação, mesmo com o mesmo binário
```

#### AC-114 — Aprovar grava o comando novo no registro

**Cobre**: US-070, FR-073, NFR-071

```gherkin
@US-070 @FR-073 @NFR-071 @AC-114
Feature: Aprovação grava no registro

  Scenario: Plano com um comando novo é aprovado
    Given um plano com um comando de dependência ainda não registrado
    When a pessoa aprova o plano
    Then esse comando passa a constar do registro, local ao projeto
```

#### AC-115 — Recusar não grava nada nem executa nada

**Cobre**: US-071, FR-071, FR-073

```gherkin
@US-071 @FR-071 @FR-073 @AC-115
Feature: Recusa não grava nem executa

  Scenario: Plano com comando novo é recusado
    Given um plano com um comando de dependência ainda não registrado
    When a pessoa recusa o plano
    Then esse comando não passa a constar do registro
    And nenhum comando do plano é executado
```

#### AC-116 — A ponte Python executa de verdade quando aprovada

**Cobre**: US-072, FR-074, NFR-072

```gherkin
@US-072 @FR-074 @NFR-072 @AC-116
Feature: Ponte Python real

  Scenario: code-review-graph ausente das duas origens, uv disponível, plano aprovado
    Given code-review-graph ausente da cópia local e do PATH, com uv disponível
    And o plano incluindo a instalação da ponte é aprovado
    When setup executa
    Then .venv-crg/ é criado de verdade nesta máquina, com code-review-graph instalado
```

#### AC-117 — A ponte Python não executa quando já presente

**Cobre**: US-072, FR-074, NFR-072

```gherkin
@US-072 @FR-074 @NFR-072 @AC-117
Feature: Ponte Python ausente do plano quando desnecessária

  Scenario: code-review-graph já presente localmente
    Given code-review-graph presente na cópia local do projeto
    When o plano é montado
    Then a ponte Python não aparece como pendência, e nenhum comando de instalação é executado
```

#### AC-118 — Execução por documento JSON usa o mesmo registro

**Cobre**: US-070, US-071, US-072, FR-071, FR-074, NFR-071

```gherkin
@US-070 @US-071 @US-072 @FR-071 @FR-074 @NFR-071 @AC-118
Feature: Automação não trava em aprovação repetida

  Scenario: Cada comando do plano já está no registro, aprovação por documento
    Given cada comando do plano atual já consta do registro de aprovação
    And a aprovação chega por documento JSON, sem pessoa interativa
    When setup executa
    Then nenhuma pergunta de aprovação é necessária
    And os comandos, incluindo a ponte Python quando aplicável, executam direto
```

#### AC-119 — Registro corrompido é tratado como vazio, falha segura

**Cobre**: FR-070, NFR-070, NFR-071

```gherkin
@FR-070 @NFR-070 @NFR-071 @AC-119
Feature: Registro corrompido nunca vira aprovação implícita

  Scenario: Arquivo de registro com conteúdo inválido
    Given um arquivo de registro de aprovação com JSON inválido
    When o plano é avaliado contra o registro
    Then cada comando do plano é tratado como não aprovado
    And nenhuma exceção é lançada
```

### 7. Requisitos

#### Funcionais

- **FR-070**: O sistema deve manter um registro persistente, local ao projeto, dos comandos de dependência já aprovados, identificados pelo par binário+argv exato.
- **FR-071**: O plano apresentado para aprovação (texto e documento) deve listar cada comando de dependência que a execução de fato dispararia — hooks, instalador de skills por origem, instalador do framework former project tool e a ponte Python, quando cada um se aplica.
- **FR-072**: Um comando cujo binário e argv exato já constam do registro não deve gerar pendência de aprovação; a execução prossegue direto para ele.
- **FR-073**: Aprovar um plano deve gravar no registro cada comando dele que ainda não constava; recusar não deve gravar nada.
- **FR-074**: A ponte Python deve executar de verdade (`uv venv` seguido de `uv pip install`) quando aprovada e a dependência estiver ausente das duas origens, substituindo o `execute: false` hoje fixo.

#### Não funcionais

- **NFR-070**: **Identidade exata**. Nenhuma correspondência aproximada, prefixo ou wildcard decide se um comando já foi aprovado — só igualdade exata de binário e argv. **Verificação**: caso de unidade com argv diferindo em um único caractere, confirmando pendência de aprovação.
- **NFR-071**: **Registro local**. O registro de aprovação nunca é lido nem escrito fora do projeto, no mesmo padrão de `.common-rules/install.json`. **Verificação**: inspeção do código e caso confirmando o caminho gravado sob a raiz do projeto.
- **NFR-072**: **Sem rede, sem autenticação**. Nenhuma chamada de rede nem prompt de autenticação é introduzida por este mecanismo, em ponto algum do módulo. **Verificação**: inspeção do código e execução real sem prompt.

#### Erros e casos-limite

- Registro ausente (primeira execução) → tratado como vazio; cada comando do plano é pendência de aprovação.
- Registro com JSON inválido ou corrompido → tratado como vazio, nunca como exceção nem como aprovação implícita (`AC-119`).
- Plano vazio (nada pendente) → nenhuma aprovação é solicitada, no mesmo comportamento de "já estava configurado" que a `SPEC-0005` já entrega.
- Comando aprovado antes, mas cujo binário deixou de existir no `PATH` — fora do escopo desta fatia: a existência do binário continua responsabilidade da camada de detecção (`doctor`, fatia 1d), não da aprovação.
- `uv pip install` aprovado, mas sem alcance de rede no momento da execução (PyPI inacessível) → reportado como falha da ponte, no mesmo texto de erro que já existe para `uv` ausente; nunca lançado como exceção não tratada — a criação de `.venv-crg/` em si (`uv venv`) não depende de rede e prossegue mesmo que o passo seguinte falhe.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- `src/approval/context.ts`/`decide.ts`/`render.ts` (`SPEC-0007`) — canal, decisão e renderização do plano, hoje limitados a hooks.
- `src/setup/run.ts` — monta `planned` só a partir dos hooks traduzidos; chama `bridgePythonSubsystem` com `execute: false` fixo.
- `src/setup/bridge.ts` — `bridgePythonSubsystem`, já com `execute: boolean` na assinatura, sem fonte real (`realBridgeEnvironment`) nem chamador que passe `execute: true`.
- `src/skills/executor.ts`/`src/framework/executor.ts` — os dois instaladores que já executam de verdade, cada um com seu próprio `Executor` injetável e comando real (`spawnSync(bin, args)`).
- `src/setup/record.ts` — `InstallRecord`/`matches()`, o registro de idempotência existente; este trabalho segue o mesmo ritual de leitura/escrita, em arquivo próprio.

#### Arquitetura e módulos

| Módulo | Responsabilidade | Arquivo |
| --- | --- | --- |
| Registro de aprovação | Lê/grava comandos aprovados (binário+argv), com fonte injetável | `src/approval/registry.ts` |
| Plano estendido | Deriva a lista completa de comandos de dependência pendentes (hooks + skills + former project tool + ponte) a partir das mesmas fontes que `runSetup` já resolve | `src/approval/plan.ts` |
| Ponte Python real | `realBridgeEnvironment()`, fonte real para `BridgeEnvironment` | `src/setup/bridge.ts` (estendido) |

`src/approval/render.ts` passa a receber hooks (`PlannedItem[]`, forma
inalterada) e comandos de dependência (`DependencyCommandItem[]`, binário+argv)
como dois parâmetros — sem fundir os dois tipos numa estrutura só, sem
quebrar a renderização de hooks já testada. `src/setup/run.ts` passa a montar
os candidatos de skills/former project tool/ponte, comparar contra o registro
(`src/approval/registry.ts`) antes de decidir se pergunta, e gravar no
registro após aprovação.

#### Migrations

Não aplicável.

#### Models

```ts
interface ApprovedCommand { bin: string; args: string[] }
interface ApprovalRegistry { commands: ApprovedCommand[] }
interface DependencyCommandItem { kind: "skills" | "framework" | "bridge"; label: string; bin: string; args: string[] }
interface CommandCandidate { kind: "skills" | "framework" | "bridge"; label: string; command: { bin: string; args: string[] } | null; pending: boolean }
```

`DependencyCommandItem` cobre só os três comandos que de fato disparam
subprocesso — skills, former project tool e ponte Python. Hooks continuam representados
por `PlannedItem` (`name`/`target`/`event`, inalterado): não são subprocesso,
não têm `bin`/`args`, e o registro persistente desta fatia (`PR-070`,
identidade por binário+argv) não se aplica a eles — hooks continuam pedindo
aprovação a cada execução em que estiverem pendentes, exatamente como já
era. `FR-071` ("o plano lista cada comando de dependência") cobre os dois
tipos juntos no texto/documento, não junta os dois na mesma estrutura de
dado.

#### Controllers e casos de uso

- `readApprovalRegistry(env?)`/`writeApprovalRegistry(registry, env?)`, em `src/approval/registry.ts`, com `RegistryEnvironment` injetável (`PR-071`); registro corrompido ou ausente resolve para `{ commands: [] }`, nunca lança.
- `isApproved(registry, item)`: comparação exata de `bin` e `args` (`Array.prototype.every` posição a posição, mesmo comprimento) — nenhuma normalização, nenhum wildcard.
- `assembleDependencyCommands(candidates: CommandCandidate[])`, em `src/approval/plan.ts`: função pura que filtra `pending && command !== null` e devolve `DependencyCommandItem[]` — quem monta os candidatos (skills por origem, former project tool, ponte) é `src/setup/run.ts`, que já sabe o que está pendente para hooks e passa a saber o mesmo para os três novos.
- `partitionByApproval(registry, items)`: separa os itens em já aprovados e pendentes; só os pendentes entram no texto/documento que `interpret()` avalia.
- `recordApproval(registry, items)`: função pura que devolve um novo registro com os itens recém-aprovados acrescentados, sem duplicar os já presentes.
- `renderPlan(hooks, commands)` (`src/approval/render.ts`, estendida) e `DecisionSource.ask(hooks, commands)`/`interpret(source, hooks, commands)` (`src/approval/decide.ts`, estendidos) passam a receber os dois grupos — hooks continuam no formato de sempre, `commands` é só o que `partitionByApproval` devolveu como pendente.
- `src/setup/run.ts` monta os candidatos de skills/former project tool/ponte, resolve `registro = readApprovalRegistry()`, particiona, só invoca a aprovação quando há hook ou comando pendente, e grava `recordApproval` no registro após aprovação — antes da escrita real de cada comando.
- `bridgePythonSubsystem` deixa de receber `execute` fixo: `src/setup/run.ts` decide `execute` a partir do resultado da aprovação (aprovado e a ponte é pendência ⇒ `execute: true`). Ganha também um `cwd?: string` opcional (ausente hoje — achado ao planejar a real execução, já que `execFileSync` sem `cwd` roda relativo a `process.cwd()`, não à raiz do projeto alvo), repassado para as duas chamadas de `uv`; e passa a capturar exceção de cada `execFileSync`, reportando falha (ex.: `uv pip install` sem alcance de rede) em vez de deixar a exceção propagar sem tratamento — a criação de `.venv-crg/` em si não depende de rede.

**Como o `bin`/`args` de cada comando é conhecido sem executar nada.** `Executor`
(`src/skills/install.ts`, `src/framework/install.ts`) hoje é só uma função
chamável — o binário e o argv reais ficam fechados dentro de
`realSkillsExecutor`/`realformer project toolExecutor`, invisíveis para quem chama. Os
candidatos precisam do argv sem rodar nada, então o argv sai de onde já era
construído, extraído para uma função pura e reaproveitada nos dois lugares —
nunca duplicado, para não abrir a mesma divergência que `PR-062` existe para
fechar:

- `src/skills/install.ts` exporta `buildSkillsAddArgs(source): string[]`, extraída do `base` que `installSkills` já construía inline; `src/skills/executor.ts` exporta `describeSkillsCommand(source, root?): { bin: string; args: string[] } | null`, compondo esse argv com o mesmo `resolveSkillsBin` que `realSkillsExecutor` já usa — `null` quando o binário não existe, mesma convenção de `Executor`.
- `src/framework/install.ts` exporta `buildformer project toolInstallArgs(root): string[]` (`["install", "--project", root, "--json"]`, já totalmente estático); `src/framework/executor.ts` exporta `describeformer project toolCommand(root?): { bin: string; args: string[] } | null`, mesma composição.
- Para a ponte Python, `bridgePythonSubsystem` sempre executa `uv venv` seguido de `uv pip install` como par atômico — nunca um sem o outro. Só o segundo varia (a versão pinada em `PINNED_VERSION`), então o item do plano rastreia identidade só pelo `uv pip install --python <VENV_DIR> <spec>`; `uv venv <VENV_DIR>` nunca muda e não precisa de identidade própria no registro. Evita duas entradas que sempre andariam juntas — a mesma economia que `DEC-073` já aplicou contra granularidade sem pedido real.

#### Views e experiência

Não aplicável. A seção 10 registra a ausência de interface.

#### Queries e repositórios

Não aplicável.

#### Jobs e processamento assíncrono

Síncrono, como as fatias anteriores.

#### Estrutura de arquivos

```text
src/approval/
  context.ts       (inalterado)
  decide.ts         (estendido — ask()/interpret() recebem hooks e commands)
  render.ts         (estendido — texto/documento cobrem hooks e commands)
  registry.ts        (novo)
  plan.ts             (novo)
src/setup/
  run.ts             (alterado — monta plano completo, particiona, grava registro, decide execute da ponte)
  bridge.ts          (alterado — realBridgeEnvironment())
src/cli.ts           (alterado — fornece bridgeEnv real)
tests/
  approval-registry-*.test.ts
  approval-plan-completo.test.ts
  approval-comando-ja-aprovado.test.ts
  approval-comando-argv-alterado.test.ts
  approval-grava-no-registro.test.ts
  approval-recusa-nao-grava.test.ts
  bridge-real.test.ts
  bridge-ausente-do-plano.test.ts
  approval-documento-json-registro.test.ts
  approval-registro-corrompido.test.ts
specs/completed/0010-fatia-1i-aprovacao-em-lote-comandos/
  spec.md
  research/
    aprovacao/
      leitura-do-fluxo-real.md
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Comando aprovado | `(bin, args)` exato | `bin: string`, `args: string[]` | Pertence ao registro de aprovação do projeto |
| Registro de aprovação | Caminho no projeto (`.common-rules/approved-commands.json`) | Lista de comandos aprovados | Um por projeto |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Comando aprovado | Ausente do registro | Plano aprovado com este comando pendente | Presente no registro | Nunca removido automaticamente; só por edição manual do arquivo |
| Registro de aprovação | Ausente ou corrompido | Leitura | Tratado como `{ commands: [] }` | Leitura nunca lança |

#### Migração e retenção

Não aplicável — arquivo novo, sem dado anterior a migrar.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não — estende o texto/documento de aprovação de terminal já existente (`SPEC-0007`), sem tela nova.

#### APIs expostas

Não aplicável — comando de terminal (`common-rules setup`, inalterado na assinatura) e um módulo de biblioteca (`src/approval/registry.ts`, `src/approval/plan.ts`).

#### APIs externas utilizadas

Nenhuma.

#### Documentação das APIs consultadas

Não aplicável.

#### Eventos e outros contratos

- `.common-rules/approved-commands.json`: `{ "commands": [{ "bin": string, "args": string[] }] }`. Arquivo de projeto, versionável a critério de quem usa o repositório — a mesma decisão que já vale para `.common-rules/install.json`.

### 11. Estratégia TDD

- **Unidade**: `isApproved`, `partitionByApproval`, `recordApproval`, `readApprovalRegistry`/`writeApprovalRegistry` com ambiente fake; montagem do plano completo com fontes fake para skills/former project tool/ponte.
- **Integração**: `runSetup` de ponta a ponta — plano com item novo pede aprovação, item já registrado não pede, aprovação grava, recusa não grava.
- **Real**: a ponte Python criando `.venv-crg/` de verdade nesta máquina, quando aprovada; execução por documento JSON com registro pré-populado, sem travar em prompt.
- **Runner**: Vitest, pelo script `test:tdd`.
- **Verificação manual**: `node dist/cli.js setup`, real, num diretório temporário, confirmando o texto do plano completo e a criação real de `.venv-crg/` após aprovação.

O ponto sensível é a tentação de normalizar o argv para decidir equivalência
(ex.: ignorar espaços, ordenar flags). `NFR-070`/`PR-070` existem para que
isso nunca aconteça: qualquer diferença, por menor que seja, é comando novo.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-071, FR-071, AC-110 | AC-110 na seção 6 | tests/approval-plan-completo.test.ts | `renderPlan` ignorava o segundo parâmetro (`commands` inexistente) | `npx vitest run tests/approval-*.test.ts tests/bridge-*.test.ts` — 14/14 | Teste corrigido de `doc.hooks` para `doc.items` (compat com AC-069/SPEC-0007), antes do GREEN |
| US-070, FR-070/072, AC-111 | AC-111 na seção 6 | tests/approval-comando-ja-aprovado.test.ts | `Cannot find module '../src/approval/plan'` | idem | Nenhuma |
| US-070, FR-072, AC-112 | AC-112 na seção 6 | tests/approval-comando-ja-aprovado.test.ts | `Cannot find module '../src/approval/plan'` | idem | Nenhuma |
| US-070, FR-072/073, AC-113 | AC-113 na seção 6 | tests/approval-comando-argv-alterado.test.ts | `Cannot find module '../src/approval/plan'` | idem | Nenhuma |
| US-070, FR-073, AC-114 | AC-114 na seção 6 | tests/approval-grava-no-registro.test.ts | `Cannot find module '../src/approval/plan'` | idem | Nenhuma |
| US-071, FR-071/073, AC-115 | AC-115 na seção 6 | tests/approval-recusa-nao-grava.test.ts | `comandosVistos.length` ficava 0 — `ask()` só recebia `hooks`, `commands` inexistente | idem | Teste redesenhado: assinatura vacuamente verdadeira (nada grava porque nada gravava antes) trocada por asserção sobre `ask()` receber os comandos, antes do RED valer |
| US-072, FR-074, AC-116 | AC-116 na seção 6 | tests/bridge-real.test.ts | `.venv-crg` não era criado (`execute: false` fixo em `run.ts:204`) | `npx vitest run tests/bridge-real.test.ts`, `uv`/rede reais nesta máquina | `bridgeCwd` acrescentado à opção de teste para não poluir a raiz do próprio pacote, antes do GREEN |
| US-072, FR-074, AC-117 | AC-117 na seção 6 | tests/bridge-ausente-do-plano.test.ts | `Cannot find module '../src/approval/plan'` | idem | Nenhuma |
| US-070/071/072, FR-071/074, AC-118 | AC-118 na seção 6 | tests/approval-documento-json-registro.test.ts | `.common-rules/approved-commands.json` nunca era criado (mecanismo inexistente) | `npx vitest run tests/approval-documento-json-registro.test.ts`, via `dist/cli.js setup` real | Gate de aprovação corrigido para só perguntar quando `!hooksJaFeito \|\| comandosPendentes.length > 0` — sem isso, o documento vazio sempre recusava, mesmo com tudo já aprovado |
| NFR-070/071, AC-119 | AC-119 na seção 6 | tests/approval-registro-corrompido.test.ts | `Cannot find module '../src/approval/registry'` | idem | Nenhuma |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-070 | AC-111 | Unidade | tests/approval-comando-ja-aprovado.test.ts | **Passed** — T002 |
| FR-070 | AC-112 | Unidade | tests/approval-comando-ja-aprovado.test.ts | **Passed** — T003 |
| FR-070 | AC-119 | Unidade | tests/approval-registro-corrompido.test.ts | **Passed** — T010 |
| FR-071 | AC-110 | Unidade | tests/approval-plan-completo.test.ts | **Passed** — T001 |
| FR-071 | AC-115 | Integração | tests/approval-recusa-nao-grava.test.ts | **Passed** — T006 |
| FR-071 | AC-118 | Integração | tests/approval-documento-json-registro.test.ts | **Passed** — T009 |
| FR-072 | AC-111 | Unidade | tests/approval-comando-ja-aprovado.test.ts | **Passed** — T002 |
| FR-072 | AC-112 | Unidade | tests/approval-comando-ja-aprovado.test.ts | **Passed** — T003 |
| FR-072 | AC-113 | Unidade | tests/approval-comando-argv-alterado.test.ts | **Passed** — T004 |
| FR-073 | AC-113 | Unidade | tests/approval-comando-argv-alterado.test.ts | **Passed** — T004 |
| FR-073 | AC-114 | Integração | tests/approval-grava-no-registro.test.ts | **Passed** — T005 |
| FR-073 | AC-115 | Integração | tests/approval-recusa-nao-grava.test.ts | **Passed** — T006 |
| FR-074 | AC-116 | Real | tests/bridge-real.test.ts | **Passed** — T007 |
| FR-074 | AC-117 | Unidade | tests/bridge-ausente-do-plano.test.ts | **Passed** — T008 |
| FR-074 | AC-118 | Integração | tests/approval-documento-json-registro.test.ts | **Passed** — T009 |
| NFR-070 | AC-112 | Unidade | tests/approval-comando-ja-aprovado.test.ts | **Passed** — T003 |
| NFR-070 | AC-113 | Unidade | tests/approval-comando-argv-alterado.test.ts | **Passed** — T004 |
| NFR-070 | AC-119 | Unidade | tests/approval-registro-corrompido.test.ts | **Passed** — T010 |
| NFR-071 | AC-114 | Integração | tests/approval-grava-no-registro.test.ts | **Passed** — T005 |
| NFR-071 | AC-118 | Integração | tests/approval-documento-json-registro.test.ts | **Passed** — T009 |
| NFR-071 | AC-119 | Unidade | tests/approval-registro-corrompido.test.ts | **Passed** — T010 |
| NFR-072 | AC-111 | Unidade | tests/approval-comando-ja-aprovado.test.ts | **Passed** — T002 |
| NFR-072 | AC-116 | Real | tests/bridge-real.test.ts | **Passed** — T007 |
| NFR-072 | AC-117 | Unidade | tests/bridge-ausente-do-plano.test.ts | **Passed** — T008 |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-08-30)
- **Comando**: `node .agents/skills/framework-04-validate/scripts/validate_spec.mjs specs/completed/0010-fatia-1i-aprovacao-em-lote-comandos/spec.md`
- **Cobertura**: 3 US, 5 FR, 3 NFR, 10 AC, 4 DEC; mínimo de 3 AC por ID satisfeito em todos.
- **Research**: `load_research.mjs` em `PASSED`, com `R-036` e `R-037` verificados por leitura direta do código de produção, e um artefato indexado.
- **Revisão PROD**: as duas lacunas (plano incompleto, ponte inerte) foram confirmadas por leitura de código antes de escrever a spec, capturadas em `specs/inbox/2026-08-30-155149-...`, com a decisão de incluir o wireup da ponte no escopo desta fatia tomada com a pessoa antes da especificação.
- **Achados**: Nenhum bloqueante.

#### Gate do Ato II — Plano

- **Resultado**: Passed (2026-08-30)
- **Comando**: `node .agents/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/completed/0010-fatia-1i-aprovacao-em-lote-comandos/spec.md`
- **Plano**: 17 tarefas — 10 `[TEST] [TDD]`, 4 `[CODE]`, 2 `[DOC]`, 1 `[OPS]`; 85 itens de checklist; 21 de 21 IDs cobertos.
- **Achados**: Nenhum bloqueante.

#### Gate do Ato III — Entrega

- **Resultado**: Passed (2026-08-30)
- **Verificação**: `npm run verify` em exit 0 a partir de clone limpo (install 3s, build 0s, test 38s, total 41s) — **352 casos em 130 arquivos** (era 339/121 antes desta fatia); `npx tsc --noEmit` e `npm run build` em exit 0.
- **Auditorias**: `check_traceability.mjs` em 21/21 IDs próprios cobertos (ressalva de marcadores órfãos de outras specs persiste, mesma causa já conhecida das fatias anteriores); `verify_acceptance.mjs` em `QA: PASSED`; `verify_evidence.mjs` em `PASSED (strict)` para T011, T012, T013 e T014.
- **Verificação manual real**: `node dist/cli.js setup`, num diretório temporário, aprova o plano completo por documento JSON (7 hooks, 2 origens de skills, framework former project tool — `code-review-graph` já presente nesta máquina, então a ponte não aparece como pendência), grava `.common-rules/approved-commands.json` com os três comandos aprovados; uma segunda execução relata "já estava configurado"; apagando `.claude/skills/` e rodando de novo com entrada padrão **vazia** (sem documento de aprovação), o comando ainda restaura as skills, sem pedir aprovação — o comando já constava do registro.
- **Ponte Python real, separadamente** (`tests/bridge-real.test.ts`, ambiente forçado a ausente): `uv venv` + `uv pip install code-review-graph==2.3.7` executam de verdade, instalando 76 pacotes Python via rede real nesta máquina.
- **Achado durante a implementação, corrigido antes do GREEN**: o gate de aprovação original perguntava sempre que qualquer coisa estivesse pendente, mesmo quando só a lista de hooks (sempre não vazia, independente de estar ou não desatualizada) acionava a pergunta — um comando de dependência já aprovado nunca teria como pular a pergunta de fato. Corrigido condicionando a pergunta a `!hooksJaFeito || comandosPendentes.length > 0`, coberto por `AC-118`.
- **Achado relacionado, corrigido antes do GREEN**: a primeira versão dos candidatos de skills/former project tool só era construída quando `skillsJaFeito`/`frameworkJaFeito` eram falsos — mas esses sinais são triviais (`true`) quando não há registro anterior, deixando uma instalação genuinamente nova de fora do plano de aprovação. Corrigido para sempre montar o candidato quando `opts.skills`/`opts.project-context` está configurado, deixando a decisão de "já aprovado" inteiramente para o registro (`partitionByApproval`), não para este sinal.
- **Achados**: Nenhum bloqueante.

### 14. Tarefas

Formato:
`- [ ] TNNN [P?] [TIPO] [US-NNN?] Ação com caminho — Refs: IDs — Depends: IDs|none`

Checklist obrigatório por tarefa, na ordem:

```markdown
  - [x] **PREP**: Confirmar escopo, IDs, dependências e baseline.
  - [x] **EXECUTE**: Produzir a entrega no caminho declarado.
  - [x] **VERIFY**: Executar a verificação focal adequada.
  - [x] **EVIDENCE**: Registrar comando, resultado e IDs nas seções 11–13.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
```

#### Fase 1 — RED, um caso por cenário da seção 6

- [x] T001 [P] [TEST] [TDD] [US-071] Derivar de AC-110 o caso em tests/approval-plan-completo.test.ts — Refs: US-071, FR-071, AC-110 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-110.
  - [x] **EXECUTE**: Escrever caso montando o plano completo (função ainda inexistente) com hooks, skills, former project tool e ponte, todos pendentes, conferindo que os quatro aparecem no texto e no documento.
  - [x] **VERIFY**: RED — `Cannot find module` sobre `src/approval/plan`.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T002 [P] [TEST] [TDD] [US-070] Derivar de AC-111 o caso em tests/approval-comando-ja-aprovado.test.ts — Refs: US-070, US-071, FR-070, FR-072, NFR-072, AC-111 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-111.
  - [x] **EXECUTE**: Escrever caso com registro vazio e um comando de skills pendente, conferindo que ele aparece como pendência de aprovação.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T003 [P] [TEST] [TDD] [US-070] Derivar de AC-112 o caso em tests/approval-comando-ja-aprovado.test.ts — Refs: US-070, FR-070, FR-072, NFR-070, AC-112 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-112.
  - [x] **EXECUTE**: Escrever caso com um comando de argv exato já no registro, conferindo que ele não aparece como pendência mesmo quando precisa rodar de novo por drift.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T004 [P] [TEST] [TDD] [US-070] Derivar de AC-113 o caso em tests/approval-comando-argv-alterado.test.ts — Refs: US-070, FR-072, FR-073, NFR-070, AC-113 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-113.
  - [x] **EXECUTE**: Escrever caso com a ponte Python registrada numa versão e pedida noutra, conferindo que o comando com a versão nova aparece como pendência.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T005 [P] [TEST] [TDD] [US-070] Derivar de AC-114 o caso em tests/approval-grava-no-registro.test.ts — Refs: US-070, FR-073, NFR-071, AC-114 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-114.
  - [x] **EXECUTE**: Escrever caso aprovando um plano com um comando novo, conferindo que ele passa a constar do registro devolvido.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T006 [P] [TEST] [TDD] [US-071] Derivar de AC-115 o caso em tests/approval-recusa-nao-grava.test.ts — Refs: US-071, FR-071, FR-073, AC-115 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-115.
  - [x] **EXECUTE**: Escrever caso recusando um plano com comando novo, conferindo que o registro não muda e nada é executado (executor fake que lança se chamado).
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T007 [TEST] [TDD] [US-072] Derivar de AC-116 o caso em tests/bridge-real.test.ts — Refs: US-072, FR-074, NFR-072, AC-116 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-116; confirmar `uv` disponível nesta máquina.
  - [x] **EXECUTE**: Escrever caso real, sem fake, com `code-review-graph` ausente da cópia local (diretório temporário) e do `PATH` simulado ausente, aprovando e conferindo `.venv-crg/` criado de verdade.
  - [x] **VERIFY**: RED — `bridgePythonSubsystem` ainda ignora `execute` vindo de aprovação (chamada real não existe).
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T008 [P] [TEST] [TDD] [US-072] Derivar de AC-117 o caso em tests/bridge-ausente-do-plano.test.ts — Refs: US-072, FR-074, NFR-072, AC-117 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-117.
  - [x] **EXECUTE**: Escrever caso com `code-review-graph` presente na cópia local, conferindo que a ponte não aparece no plano e nenhum comando de instalação executa (executor fake que lança se chamado).
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T009 [TEST] [TDD] [US-070] Derivar de AC-118 o caso em tests/approval-documento-json-registro.test.ts — Refs: US-070, US-071, US-072, FR-071, FR-074, NFR-071, AC-118 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-118.
  - [x] **EXECUTE**: Escrever caso real com `dist/cli.js setup`, registro pré-populado com cada comando do plano, aprovação por documento JSON, conferindo execução sem pergunta.
  - [x] **VERIFY**: RED — comando real ainda não reflete o registro (`setup` não lê `approved-commands.json`).
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T010 [P] [TEST] [TDD] Derivar de AC-119 o caso em tests/approval-registro-corrompido.test.ts — Refs: FR-070, NFR-070, NFR-071, AC-119 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-119.
  - [x] **EXECUTE**: Escrever caso com um arquivo de registro contendo JSON inválido, conferindo que cada comando do plano é tratado como não aprovado e nenhuma exceção é lançada.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

#### Fase 2 — Código, cada tarefa atrás do seu RED

- [x] T011 [CODE] Implementar em src/approval/registry.ts — Refs: FR-070, NFR-070, NFR-071, AC-112, AC-113, AC-119 — Depends: T002, T003, T004, T010
  - [x] **PREP**: Confirmar RED de T002, T003, T004 e T010; `docs/` reconstruído por `$framework-documentator` antes da alteração.
  - [x] **EXECUTE**: `RegistryEnvironment` injetável com `read()`/`write(registry)`; `realRegistryEnvironment()` lendo/gravando `.common-rules/approved-commands.json`; `readApprovalRegistry`/`writeApprovalRegistry`/`isApproved` (comparação exata de `bin`+`args`, mesmo comprimento); JSON inválido ou ausente resolve para `{ commands: [] }`, nunca lança.
  - [x] **VERIFY**: Casos de T002, T003, T004 e T010 GREEN.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T011", "refs": ["FR-070", "NFR-070", "NFR-071", "AC-112", "AC-113", "AC-119"], "files": ["src/approval/registry.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T012 [CODE] [US-070] [US-071] Implementar em src/approval/plan.ts — Refs: US-070, US-071, FR-071, FR-072, FR-073, AC-110, AC-114, AC-115 — Depends: T001, T005, T006, T011
  - [x] **PREP**: Confirmar RED de T001, T005 e T006.
  - [x] **EXECUTE**: `DependencyCommandItem` (`kind`, `label`, `bin`, `args`); `assembleDependencyCommands(candidates)` filtrando candidatos pendentes com comando resolvido; `partitionByApproval(registry, items)` separando aprovados/pendentes; `recordApproval(registry, items)`, função pura que devolve novo registro sem duplicar.
  - [x] **VERIFY**: Casos de T001, T005 e T006 GREEN.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T012", "refs": ["US-070", "US-071", "FR-071", "FR-072", "FR-073", "AC-110", "AC-114", "AC-115"], "files": ["src/approval/plan.ts", "src/approval/render.ts", "src/approval/decide.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T013 [CODE] [US-072] Implementar realBridgeEnvironment em src/setup/bridge.ts — Refs: US-072, FR-074, AC-116, AC-117, AC-118 — Depends: T007, T008, T009
  - [x] **PREP**: Confirmar RED de T007, T008 e T009.
  - [x] **EXECUTE**: `realBridgeEnvironment()`, resolvendo `localVenv`/`onPath`/`hasUv` de verdade (sem subprocesso além de `which uv`/versão local); `bridgePythonSubsystem` sem alterar sua assinatura pública (`execute` já existia).
  - [x] **VERIFY**: Casos de T007 e T008 GREEN.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T013", "refs": ["US-072", "FR-074", "AC-116", "AC-117"], "files": ["src/setup/bridge.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T014 [CODE] [US-070] [US-071] [US-072] Ligar plano, registro e ponte em src/setup/run.ts e src/cli.ts — Refs: US-070, US-071, US-072, FR-070, FR-071, FR-072, FR-073, FR-074, AC-118 — Depends: T009, T012, T013
  - [x] **PREP**: Confirmar RED de T009.
  - [x] **EXECUTE**: `runSetup` monta os candidatos de skills/former project tool/ponte, resolve os comandos via `assembleDependencyCommands`, lê o registro, particiona, só invoca `interpret(source, hooks, pendentes)` quando há hook ou comando pendente, grava `recordApproval` após aprovação, e decide `execute` da ponte a partir do resultado; `src/cli.ts`'s `formatSetup()` passa `bridgeEnv: realBridgeEnvironment()`.
  - [x] **VERIFY**: Caso de T009 GREEN, com `dist/cli.js setup` real.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T014", "refs": ["US-070", "US-071", "US-072", "FR-070", "FR-071", "FR-072", "FR-073", "FR-074", "AC-118"], "files": ["src/setup/run.ts", "src/cli.ts", "src/skills/install.ts", "src/skills/executor.ts", "src/framework/install.ts", "src/framework/executor.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

#### Fase 3 — Fechamento

- [x] T015 [DOC] Registrar o registro de aprovação e o wireup da ponte Python em .project-context/STACK.md — Refs: FR-070, FR-074 — Depends: T014
  - [x] **PREP**: Ler a seção de aprovação (fatia 1c) em `.project-context/STACK.md`.
  - [x] **EXECUTE**: Descrever `src/approval/registry.ts`, `src/approval/plan.ts`, a extensão de `render.ts`, e `realBridgeEnvironment()`, incluindo a regra de identidade exata (`PR-070`).
  - [x] **VERIFY**: `npm run build` em exit 0.
  - [x] **EVIDENCE**: Comando e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T016 [DOC] Descrever em PROJECT.md a aprovação em lote e a ponte Python real — Refs: US-070, US-072 — Depends: T014
  - [x] **PREP**: Ler o parágrafo de aprovação do plano em `PROJECT.md`.
  - [x] **EXECUTE**: Descrever o registro persistente, que o plano agora lista cada comando de dependência, e que a ponte Python instala de verdade quando aprovada.
  - [x] **VERIFY**: `npm run build` em exit 0.
  - [x] **EVIDENCE**: Comando e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T017 [OPS] Verificação manual real e fechar o Delivery Gate na seção 13 de specs/completed/0010-fatia-1i-aprovacao-em-lote-comandos/spec.md — Refs: NFR-070, NFR-071, NFR-072 — Depends: T015, T016
  - [x] **PREP**: T011–T016 concluídas, cada `[CODE]` com seu comentário de evidência.
  - [x] **EXECUTE**: `node dist/cli.js setup` real num diretório temporário, mostrando o plano completo, aprovando e conferindo `.venv-crg/` criado; segunda execução com drift, confirmando que nada pede aprovação de novo; suíte completa e `npm run verify`; `check_traceability.mjs` e `verify_acceptance.mjs`.
  - [x] **VERIFY**: As duas execuções reais se comportam como descrito; suíte inteira, `tsc`, `build` e `verify` em exit 0 a partir de clone limpo.
  - [x] **EVIDENCE**: Comandos, contagens e exit codes registrados na seção 13.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

### 15. Ordem de execução

A Fase 1 quase inteira em paralelo: nove arquivos distintos (T002/T003 compartilham `tests/approval-comando-ja-aprovado.test.ts`, sem tocar o mesmo bloco), sem dependência entre si. `T007` e `T009` não são `[P]`: `T007` precisa de `uv` disponível e não compartilha arquivo com nada, mas é sensível o bastante (comando real) para não empilhar com outra tarefa da mesma fase sem revisão; `T009` depende implicitamente do build mais recente ao rodar `dist/cli.js`.

A Fase 2 segue a dependência entre módulos: `T011` (`registry.ts`) e `T013` (`bridge.ts`) não dependem de código, só das fontes que cada um resolve. `T012` (`plan.ts`) consome `T011`. `T014` (`run.ts`/`cli.ts`) consome `T012` e `T013` e é quem de fato liga tudo no comando real.

Caminho crítico: `T002 → T011 → T012 → T014 → T017`. Cinco das dezessete tarefas, passando por `T012` porque a montagem do plano completo é predecessora tanto da ligação final quanto de qualquer consumo futuro do registro.

O fechamento admite paralelismo entre `T015` e `T016`, que tocam arquivos diferentes, mas ambos precisam de `T014` concluída para descrever a superfície real.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Consome `src/skills/executor.ts`/`src/framework/executor.ts` (já reais) e `src/backends/detect.ts` (padrão de fonte injetável) sem alterá-los.
- Consome o mecanismo de aprovação da `SPEC-0007` (`resolveChannel`, `interpret`, `DecisionSource`) sem alterar seu contrato externo.

#### Riscos

- **Registro em disco sensível** → mitigado por `PR-070` (identidade exata, sem correspondência aproximada) e por manter o arquivo local ao projeto (`NFR-071`), nunca em local compartilhado entre projetos.
- **Ligar a ponte Python pela primeira vez em produção pode expor um defeito real não capturado por fixture** → mitigado pelo mesmo padrão que pegou o bug de `claude --version` na fatia 1d: um caso `real` (`AC-116`) roda `uv venv`/`uv pip install` de verdade nesta máquina, não só contra fake.

#### Suposições

- `uv` está disponível nesta máquina para exercitar `AC-116` de verdade; ausente, o caso é condicionalmente pulado, no mesmo padrão de `tests/backends-paridade-real.test.ts` para binários ausentes.
- A pessoa que aprova tem acesso de escrita ao projeto onde `.common-rules/approved-commands.json` será gravado.

### 17. Decisões

- **DEC-070**: A identidade de um comando aprovado é o par binário+argv exato, sem normalização. *Razão*: qualquer normalização (ordenar flags, ignorar espaços) abriria uma classe de comando que parece igual mas não é — inaceitável para uma permissão persistente e sensível (`D1` do backlog). *Alternativa descartada*: normalizar espaços/ordem de flags — descartada por reduzir a precisão da permissão sem pedido concreto que justifique o risco.
- **DEC-071**: O registro de aprovação vive em arquivo próprio (`.common-rules/approved-commands.json`), não em `install.json`. *Razão*: idempotência ("o que já está instalado") e permissão ("o que já foi aprovado para rodar") são ciclos de vida diferentes — um comando pode ser aprovado numa execução e a instalação em si falhar depois, e os dois registros não deveriam precisar concordar sobre isso. *Alternativa descartada*: um campo a mais em `InstallRecord` — descartada por acoplar dois conceitos com motivos de mudança diferentes.
- **DEC-072**: A ponte Python entra no escopo desta fatia, não como fatia própria nem como remoção de código morto. *Razão*: confirmado com a pessoa (`specs/inbox/2026-08-30-155149-...`) — sem a ponte executar de verdade, não há "comando de dependência" ali para o mecanismo desta fatia aprovar; as duas lacunas são a mesma investigação. *Alternativa descartada*: tratar como fatia separada — descartada por criar uma dependência de ordem artificial entre duas fatias que na prática precisam do mesmo plano estendido.
- **DEC-073**: Aprovação continua "tudo ou nada" por execução — sem granularidade por item. *Razão*: granularidade por item é mudança de UX maior que o pedido original desta fatia, e inventá-la sem pedido concreto seria a mesma classe de sobre-engenharia que `PR-035`/`DEC-038` já evitaram para custo. *Alternativa descartada*: permitir aprovar item a item na mesma execução — adiada para quando houver pedido real.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação registrada na seção 12.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] `npx tsc --noEmit`, `npm run build` e a suíte completa passam.
- [x] O mecanismo de aprovação e registro em si — decidir o que pedir, o que já está aprovado, o que gravar — não faz chamada de rede nem prompt de autenticação, conferido por inspeção do código; a instalação real da ponte Python (`uv pip install`), quando de fato dispara, depende de rede por natureza, e sua falha é reportada, nunca lançada como exceção.
- [x] `node dist/cli.js setup`, executado de verdade num diretório temporário, mostra o plano completo (hooks, skills, former project tool, ponte Python quando aplicável) e, aprovado, cria `.venv-crg/` de verdade quando `code-review-graph` está ausente das duas origens.
- [x] Uma segunda execução, com tudo já aprovado antes e drift forçando reinstalação, não pergunta de novo.
- [x] `.project-context/STACK.md` registra o registro de aprovação e o wireup real da ponte Python.
- [x] `PROJECT.md` descreve o mecanismo de aprovação em lote e que a ponte Python agora executa de verdade quando aprovada.
