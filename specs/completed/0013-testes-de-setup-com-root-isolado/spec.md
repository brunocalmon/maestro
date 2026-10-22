# Especificação integrada: Testes de setup com root isolado

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0013 |
| Slug | 0013-testes-de-setup-com-root-isolado |
| Status | Complete |
| Effort | 1 |
| Effort updated at | 2026-09-05 |
| Effort rationale | Estimativa inicial; revisar durante a descoberta. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não |
| Atualizada em | 2026-09-06 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

Cinco arquivos de teste da suíte (Node/TypeScript, Vitest) chamam
`runSetup({ env, write: true })` sem passar `root`. Em
`src/setup/run.ts:227`, `root` usa `opts.root ?? process.cwd()` como
fallback — e ao rodar `npx vitest run`, `process.cwd()` é o próprio
diretório deste repositório, não um diretório temporário isolado. Cada
rodada completa da suíte escreve de verdade em `.common-rules/install.json`
do próprio projeto (o `trace` e o `installedAt` de cada hook mudam),
deixando o `git status` sujo. Reproduzido duas vezes na mesma sessão,
exigindo `git checkout -- .common-rules/install.json` manual antes de
commitar os fixes reais que estavam sendo trabalhados. Não é um bug de
produção: é um problema de isolamento da própria suíte de testes.

Arquivos afetados: `tests/setup-idempotent.test.ts`,
`tests/setup-revert.test.ts`, `tests/setup-record.test.ts`,
`tests/setup-install.test.ts` e `tests/setup-dryrun.test.ts`. A maioria dos
demais testes de `runSetup` já passa `root` explicitamente, criado com
`mkdtempSync(join(tmpdir(), ...))` — ver `tests/setup-writes.test.ts`, cujo
helper `project()` é a convenção de referência.

#### Resultado desejado

Depois de rodar `npx vitest run` (a suíte completa) a partir de um
repositório limpo, `git status --porcelain` continua vazio. Nenhum teste
deste conjunto lê ou escreve fora do diretório temporário que ele mesmo
cria.

#### Métricas de sucesso

- `git status --porcelain` do repositório vazio antes de `npx vitest run` e
  vazio de novo depois — verificado rodando o comando de verdade, não por
  inspeção de código.
- As 16 asserções hoje existentes nesses cinco arquivos continuam passando,
  sem nenhuma mudar de resultado.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [non-critical] A causa da poluição é o fallback `opts.root ??
  process.cwd()` de `src/setup/run.ts:227`, acionado porque os cinco
  arquivos citados chamam `runSetup` sem `root` — Verdict: verified —
  Confidence: high — Evidence: research/codigo-fonte/causa-raiz.md#causa-raiz-testes-de-setup-sem-root-isolado — Budget: 1/1.

#### Fontes e contexto consultados

- `src/setup/run.ts` (fallback de `root`, linha 227).
- `tests/setup-idempotent.test.ts`, `tests/setup-revert.test.ts`,
  `tests/setup-record.test.ts`, `tests/setup-install.test.ts`,
  `tests/setup-dryrun.test.ts` (os cinco arquivos a corrigir).
- `tests/setup-writes.test.ts` (convenção de isolamento já em uso neste
  repositório, tomada como padrão de referência).
- `specs/backlog/0007-testes-de-setup-sem-root-isolado-poluem-o-repo-real.md`
  (backlog de origem).
- `specs/inbox/2026-09-05-190102-testes-de-setup-sem-root-isolado-poluem-o-repo-real.md`
  (captura original).
- Nenhuma fonte externa.

#### Documentação consultada

- Nenhuma — o comportamento e a causa vêm inteiramente do código deste
  repositório.

#### Artefatos de pesquisa armazenados

- `specs/draft/0013-testes-de-setup-com-root-isolado/research/codigo-fonte/causa-raiz.md`: cópia de trechos deste próprio
  repositório (não é fonte externa) — o fallback de `root` em
  `src/setup/run.ts:227`, as chamadas sem `root` nos cinco arquivos
  afetados, o padrão correto já usado em `tests/setup-writes.test.ts` e os
  passos de reprodução observados na sessão. Serve como evidência ancorada
  para R-001.

#### Dúvidas respondidas

- **Q**: algum dos cinco arquivos depende deliberadamente do `cwd` real do
  processo por um motivo não documentado (ex.: ler algo do próprio
  repositório além do que `env` já fornece)? → **A**: não, lendo os cinco
  arquivos por completo — cada um usa apenas o `env` fixo (`{ hasClaudeCode:
  true, files: [".claude/settings.json"] }`) já embutido no próprio teste;
  nenhuma asserção lê ou depende de um caminho fora do que `runSetup`
  escreve. Herdado do backlog como suposição a confirmar; confirmado nesta
  leitura.

#### Dúvidas abertas

- Nenhuma bloqueante.

### 3. Escopo e atores

#### Incluído

- Os cinco arquivos de teste passarem a criar um diretório temporário
  isolado (`mkdtempSync(join(tmpdir(), ...))`) e passar `root` explicitamente
  a cada chamada de `runSetup({ ..., write: true })`.

#### Fora de escopo

- Mudar o fallback `opts.root ?? process.cwd()` em `src/setup/run.ts` — é o
  comportamento real e intencional da CLI (`common-rules setup` sem
  `--root` explícito precisa mesmo usar o `cwd` do processo); alterar isso
  afetaria produção e não foi o que foi relatado.
- Auditar a suíte inteira em busca de outros padrões de não isolamento não
  relacionados a `runSetup` — o achado se limita ao que foi reproduzido.
- Extrair um helper de fixture compartilhado entre os cinco arquivos (cada
  um pode criar seu próprio diretório inline, como já faz
  `tests/setup-writes.test.ts`); uma extração futura fica como melhoria
  opcional, não bloqueante (ver DEC-001).

#### Atores

- **Pessoa desenvolvedora**: roda a suíte completa localmente durante o
  desenvolvimento e espera que isso não produza mudanças não intencionais
  no próprio repositório.
- **Revisor(a) de diff antes do commit**: depende de `git status`/`git diff`
  refletirem apenas mudanças intencionais para revisar com confiança.

### 4. Princípios e restrições do projeto

- **PR-001**: Nenhum teste deste repositório deve ler ou escrever fora de um
  diretório temporário que ele mesmo cria — princípio já seguido pela
  maioria dos testes de `runSetup` (`tests/setup-writes.test.ts`,
  `tests/trace-*.test.ts`); esta spec estende esse mesmo princípio aos cinco
  arquivos que ainda não o seguem.

### 5. Histórias de usuário

#### US-001 — Suíte de testes isolada do repositório real (P1)

Como pessoa desenvolvedora deste repositório, quero que rodar a suíte
completa de testes (`npx vitest run`) nunca modifique um arquivo do próprio
repositório, para que eu possa confiar no `git status` ao revisar e
commitar meu trabalho.

**Por que P1**: sem isso, toda rodada completa da suíte arrisca poluir o
diff com ruído não intencional (trace id e timestamp), e já exigiu reversão
manual duas vezes na mesma sessão antes de um commit real — é um atrito
recorrente, não um incidente isolado.
**Teste independente**: comparar `git status --porcelain` do repositório
antes e depois de `npx vitest run` completo; devem ser idênticos.
**Requisitos**: FR-001, FR-002

### 6. Cenários BDD de aceite

#### AC-001 — a suíte completa não modifica o repositório real

**Cobre**: US-001, FR-001, FR-002, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @NFR-001 @AC-001
Feature: Isolamento da suíte de testes de setup

  Scenario: Repositório permanece limpo após a suíte completa
    Given um checkout limpo deste repositório, com "git status --porcelain" vazio
    When a suíte completa roda com "npx vitest run"
    Then "git status --porcelain" continua vazio ao final
```

#### AC-002 — cada arquivo afetado passa root isolado explicitamente

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-002
Feature: Isolamento da suíte de testes de setup

  Scenario: Cada teste cria seu próprio diretório temporário
    Given um dos cinco arquivos afetados (tests/setup-idempotent.test.ts,
      tests/setup-revert.test.ts, tests/setup-record.test.ts,
      tests/setup-install.test.ts, tests/setup-dryrun.test.ts)
    When esse arquivo chama "runSetup({ ..., write: true })"
    Then a chamada inclui "root" apontando para um diretório criado por
      "mkdtempSync(join(tmpdir(), ...))" no próprio teste
```

#### AC-003 — o comportamento hoje coberto continua passando

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-003
Feature: Isolamento da suíte de testes de setup

  Scenario: Nenhuma asserção existente muda de resultado
    Given as 16 asserções hoje existentes nos cinco arquivos afetados,
      cobrindo idempotência, reversão, registro, instalação e dry-run
    When o root de cada chamada passa a ser um diretório isolado em vez de
      "process.cwd()"
    Then todas as 16 asserções continuam passando exatamente como antes
```

#### AC-004 — cada arquivo, rodado sozinho, não escapa do próprio diretório

**Cobre**: US-001, FR-001, FR-002

```gherkin
@US-001 @FR-001 @FR-002 @AC-004
Feature: Isolamento da suíte de testes de setup

  Scenario: Execução isolada de um único arquivo não depende da suíte inteira
    Given um dos cinco arquivos afetados, rodado sozinho (ex.:
      "npx vitest run tests/setup-idempotent.test.ts"), sem os demais
      arquivos da suíte no mesmo processo
    When o arquivo cria seu próprio diretório temporário e passa "root"
      explicitamente a cada "runSetup"
    Then o arquivo passa sozinho, com o mesmo resultado de quando roda
      dentro da suíte completa, e nenhum arquivo aparece fora desse
      diretório temporário
```

### 7. Requisitos

#### Funcionais

- **FR-001**: Cada um dos cinco arquivos de teste
  (`tests/setup-idempotent.test.ts`, `tests/setup-revert.test.ts`,
  `tests/setup-record.test.ts`, `tests/setup-install.test.ts`,
  `tests/setup-dryrun.test.ts`) deve criar um diretório temporário isolado
  com `mkdtempSync(join(tmpdir(), ...))` e passar esse caminho como `root`
  em toda chamada a `runSetup({ ..., write: true })`.
- **FR-002**: A mudança não pode alterar o resultado de nenhuma asserção
  hoje existente nesses cinco arquivos — é uma mudança de isolamento, não de
  cobertura ou comportamento testado.

#### Não funcionais

- **NFR-001**: Isolamento. Nenhum teste deste conjunto lê ou escreve fora do
  diretório temporário que ele mesmo cria. **Verificação**: comparação de
  `git status --porcelain` do repositório antes e depois de `npx vitest
  run` completo, em ambiente controlado — o mesmo padrão de verificação já
  usado por `NFR-001` de `specs/completed/0003-fatia-1b-setup-hooks/spec.md`.

#### Erros e casos-limite

- Diretório temporário não pode ser criado (ex.: disco cheio, permissão
  negada) → o teste falha com o erro nativo de `mkdtempSync` (ex.:
  `ENOSPC`/`EACCES`); nenhum tratamento especial é necessário, é o mesmo
  comportamento já herdado por `tests/setup-writes.test.ts` e demais testes
  que já usam esse padrão.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Node/TypeScript, testado com Vitest (`npm run test:tdd` → `vitest run`).
  `runSetup()` (`src/setup/run.ts`) é a função central do subsistema de
  setup; recebe `SetupOptions` incluindo `root?: string`, com fallback
  `opts.root ?? process.cwd()` na linha 227. A convenção de isolamento já
  estabelecida por outros testes deste mesmo subsistema
  (`tests/setup-writes.test.ts`) é criar o diretório com
  `mkdtempSync(join(tmpdir(), "setup-"))`, opcionalmente popular
  `.claude/` dentro dele, e passar esse caminho como `root`.

#### Arquitetura e módulos

- Nenhuma mudança de arquitetura ou de código de produção. A mudança é
  cirúrgica, restrita aos cinco arquivos de teste listados no escopo,
  replicando o padrão já em uso em `tests/setup-writes.test.ts` — cada
  arquivo passa a criar seu próprio diretório temporário e passar `root`
  explicitamente a cada `runSetup({ ..., write: true })` que já chama hoje.

#### Migrations

- Não aplicável.

#### Models

- Não aplicável — não há camada de modelo de dados nesta mudança.

#### Controllers e casos de uso

- Não aplicável — projeto CLI sem camada de controller; a mudança fica
  inteira em arquivos de teste.

#### Views e experiência

- Não aplicável — sem interface para pessoas.

#### Queries e repositórios

- Não aplicável.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/draft/0013-testes-de-setup-com-root-isolado/
  spec.md
tests/
  setup-idempotent.test.ts   (edição: root isolado)
  setup-revert.test.ts       (edição: root isolado)
  setup-record.test.ts       (edição: root isolado)
  setup-install.test.ts      (edição: root isolado)
  setup-dryrun.test.ts       (edição: root isolado)
  setup-writes.test.ts       (referência de convenção, não modificado)
src/setup/run.ts             (lido, não modificado — fallback preservado)
```

### 9. Modelo de dados

#### Entidades

- Não aplicável — nenhuma entidade de domínio ou persistência envolvida
  nesta mudança.

#### Estados e transições

- Não aplicável.

#### Migração e retenção

- Não aplicável.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não. A mudança é inteira em arquivos de
  teste (`tests/*.test.ts`); nenhuma tela, comando de CLI visível ou saída
  destinada a uma pessoa muda como resultado desta spec.

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

- Não aplicável — nenhuma tarefa desta spec produz ou altera uma superfície
  visual; o motivo é o mesmo declarado em "Interface para pessoas".

#### APIs expostas

- Não aplicável.

#### APIs externas utilizadas

- Nenhuma.

#### Documentação das APIs consultadas

- Nenhuma.

#### Eventos e outros contratos

- Não aplicável.

### 11. Estratégia TDD

- **Unidade**: Cada um dos cinco arquivos passa a criar `root` isolado e
  invocar `runSetup` com ele; as próprias asserções já existentes (16 no
  total) continuam sendo a unidade de verificação de comportamento.
- **Integração/contrato**: Não há fronteira nova — `runSetup` já é exercitado
  de ponta a ponta por esses testes; nenhum contrato muda.
- **BDD/aceite**: os três cenários da seção 6 (AC-001, AC-002, AC-003).
- **Runner TDD**: Node → **Vitest**, decisão já confirmada e materializada em
  `npm run test:tdd` (`vitest run`) neste repositório — convenção existente,
  não uma nova escolha.
- **E2E**: Não aplicável — não há jornada de usuário final nesta mudança.
- **Verificação manual**: rodar `npx vitest run` completo duas vezes seguidas
  e comparar `git status --porcelain` do repositório antes e depois, nas
  duas rodadas. É a única verificação capaz de provar AC-001 (\"o
  repositório real permanece limpo\"): o sintoma só se manifesta rodando a
  suíte de verdade contra este repositório, não é observável isolando um
  único `it()`.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, FR-002, NFR-001, AC-001 | AC-001 na seção 6 | Verificação manual: `git status --porcelain` antes/depois de `npx vitest run` completo (sem unidade isolada possível, ver "Verificação manual" acima); marcador `TRACEABILITY:` registrado no changelog da tarefa T006 | **RED** (histórico da sessão): a suíte completa sujava o repositório em toda rodada, exigindo reversão manual repetida | **GREEN (T006)**: duas rodadas completas seguidas, 425/425 testes, `git status --porcelain` vazio nas duas | **Passed** |
| US-001, FR-001, NFR-001, AC-002 | AC-002 na seção 6 | Por arquivo (T001–T005): RED = rodar `npx vitest run <arquivo>` no estado atual e `git status --porcelain` fica sujo; edição para criar `root` via `mkdtempSync` e passá-lo a `runSetup`, marcador `TRACEABILITY:` no comentário do helper; GREEN = mesmo comando, `git status --porcelain` vazio | **RED, T001–T004**: cada arquivo, rodado no estado original, passa (4/4) mas suja `.claude/settings.json` e `.common-rules/install.json`. **T005 (dryrun) é exceção**: já rodava limpo — `dryRun: true` retorna antes de qualquer escrita, independente de `root` | **GREEN, T001–T005**: todos os cinco, com `root` via `project()`, mantêm as mesmas asserções e `git status --porcelain` limpo | **Passed — T001–T005 completos** |
| US-001, FR-002, NFR-001, AC-003 | AC-003 na seção 6 | As 16 asserções já existentes nesses cinco arquivos, executadas sem alteração de expectativa | Pending | Pending | Pending |
| US-001, FR-001, FR-002, AC-004 | AC-004 na seção 6 | Cada um dos cinco arquivos rodado individualmente (`npx vitest run tests/<arquivo>.test.ts`), fora da suíte completa | Ver T001–T005 acima | Ver T001–T005 acima | **Passed** — os cinco rodam isoladamente sem depender da suíte completa |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-002 | Unidade (edição) | tests/setup-idempotent.test.ts, tests/setup-revert.test.ts, tests/setup-record.test.ts, tests/setup-install.test.ts, tests/setup-dryrun.test.ts | Passed — todos os cinco (T001–T005) |
| FR-002 | AC-003 | Regressão | `npx vitest run tests/setup-idempotent.test.ts tests/setup-revert.test.ts tests/setup-record.test.ts tests/setup-install.test.ts tests/setup-dryrun.test.ts` | Passed — 19/19 asserções, mesmo resultado de antes das edições (ver T006 para a regressão da suíte completa) |
| NFR-001 | AC-001 | Verificação manual | `git status --porcelain` antes/depois de `npx vitest run` completo | Passed — duas rodadas completas seguidas (T006), 425/425, repositório limpo nas duas |
| FR-001, FR-002 | AC-004 | Unidade (por arquivo) | `npx vitest run tests/setup-idempotent.test.ts` (e o mesmo comando para cada um dos outros quatro) | Passed — os cinco rodados individualmente, ver T001–T005 |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-09-06)
- **Comando**: `node .agents/skills/framework-04-validate/scripts/validate_spec.mjs specs/draft/0013-testes-de-setup-com-root-isolado/spec.md` — `VALID DRAFT` (estrutura); revisão semântica feita manualmente contra `references/quality-gates.md`.
- **Achados**: Nenhum `BLOCKER`. Um ponto corrigido durante a própria validação (não um achado residual): o RED-GREEN de AC-002/AC-004 estava descrito de forma agregada demais para uma correção só em código de teste; refinado para RED/GREEN concreto por arquivo (`git status --porcelain` antes/depois de rodar cada arquivo isoladamente), já refletido nas tarefas T001–T005 e na seção 11. Sem findings de produto, arquitetura ou segurança — não materiais nesta mudança (mudança restrita a arquivos de teste, seção 16 já documenta ausência de risco de segurança).
- Cobertura mínima confirmada: US-001 → 4 AC; FR-001 → 3 AC (AC-001, AC-002, AC-004); FR-002 → 3 AC (AC-001, AC-003, AC-004); NFR-001 → 3 AC (AC-001, AC-002, AC-003).
- `Interface para pessoas: Não` — seção 10 corretamente marcada `Não aplicável` em todas as subseções; não é CRUD, não bloqueia.
- Findings especializados, quando aplicáveis, seguem `FIND-PROD|ARCH|SEC-NNN`,
  severidade `P1|P2|P3`, estado `Open|Resolved|Accepted`, refs e evidência.

#### Gate do Ato II — Plano

- **Resultado**: READY (2026-09-06)
- **Comando**: `node .agents/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/defined/0013-testes-de-setup-com-root-isolado/spec.md` — `VALID DRAFT`.
- **Achados**: Nenhum bloqueio. Seção 14 preenchida: 6 tarefas `[TEST][TDD]`, sem `[CODE]` (a correção inteira vive em arquivos de teste, então não há predecessor TDD de tarefa CODE a exigir — a checagem estrita de "Plan Gate exige predecessor concluído" não se aplica aqui). T001-T005 marcadas `[P]` (arquivos independentes, sem dependência). Cobertura completa dos 8 IDs da spec confirmada pelo validador (`covered_spec_ids=8 required_spec_ids=8`). RED da primeira tarefa (T001) já observado e registrado na seção 11 antes desta promoção — ver `checklist_complete=1`.

#### Gate do Ato III — Entrega

- **Resultado**: READY (2026-09-06)
- **Comando**: `node .agents/skills/framework-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0013-testes-de-setup-com-root-isolado/spec.md .` — `Rastreabilidade: 8/8 IDs cobertos em 166 arquivos de teste`.
- **Achados**: Nenhum bloqueio real. A ferramenta também reporta uma lista de "marcadores órfãos" (centenas de IDs de outras specs) — confirmado como condição pré-existente e estrutural do projeto, não algo introduzido por esta spec: rodei o mesmo comando contra `specs/completed/0012-.../spec.md` (já `completed`, Delivery Gate Passed há tempos) e o mesmo padrão aparece, porque este projeto numera IDs de forma local por spec (não global), e a ferramenta compara contra o universo inteiro de marcadores do repositório. `verify_acceptance.mjs`: `QA: PASSED`. `build_documentation.mjs --check`: limpo após reconstrução (commit `b69d9fe`, drift acumulado da sessão inteira, não específico desta spec). 6/6 tarefas concluídas, 36/36 itens de checklist, 425/425 testes em duas rodadas completas consecutivas sem sujar o repositório (T006) — a prova final do AC-001.

#### Aceite final (`$framework-04-validate`)

- **Resultado**: READY (2026-09-06)
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/review/0013-testes-de-setup-com-root-isolado/spec.md` — `RESULTADO: READY`.
- **Achados**: Nenhum `BLOCKER`. Os três Gates dos Atos I, II e III permanecem `Passed` com evidência real e verificável (comandos, saídas e IDs citados acima). Definition of Done (seção 18) integralmente comprovada: `npx tsc --noEmit` limpo, `npx vitest run` 425/425 em duas rodadas consecutivas sem sujar o repositório, `verify_acceptance.mjs` `QA: PASSED`, 6/6 tarefas e 36/36 itens de checklist concluídos. Nenhuma decisão de produto, arquitetura ou segurança pendente — mudança restrita a arquivos de teste. `Status: Complete`.

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

#### Fase 1 — US-001 (P1): isolar cada arquivo de teste

**Objetivo**: cada um dos cinco arquivos passa a criar seu próprio diretório
temporário e a passar `root` explicitamente, seguindo a convenção de
`tests/setup-writes.test.ts`.
**Teste independente**: rodar cada arquivo isoladamente
(`npx vitest run tests/setup-idempotent.test.ts`, etc.) e confirmar que as
mesmas asserções de hoje continuam passando.

- [x] T001 [P] [TEST] [TDD] [US-001] Isolar root em tests/setup-idempotent.test.ts — Refs: US-001, FR-001, FR-002, NFR-001, AC-002, AC-003, AC-004 — Depends: none
  - [x] **PREP**: Ler o arquivo e confirmar as 4 chamadas a `runSetup({ env, write: true, ... })` que hoje não passam `root`. RED: rodar `npx vitest run tests/setup-idempotent.test.ts` no estado atual (antes da edição) e confirmar que `git status --porcelain` fica sujo em `.common-rules/install.json` — a evidência concreta do problema, por arquivo. **RED observado**: 4/4 asserções passam, mas `git status --porcelain` fica sujo em `.claude/settings.json` e `.common-rules/install.json`; revertido com `git checkout --`.
  - [x] **EXECUTE**: Criar `root` com `mkdtempSync(join(tmpdir(), "setup-"))` (populando `.claude/` quando `env.hasClaudeCode` exigir), passar `root` a cada chamada; marcador `TRACEABILITY:` no comentário do helper. Helper `project()` adicionado seguindo o padrão de `tests/setup-writes.test.ts`; as 4 chamadas a `runSetup` agora recebem `root`.
  - [x] **VERIFY**: `npx vitest run tests/setup-idempotent.test.ts` — as 4 asserções continuam passando (GREEN: repita `git status --porcelain` — vazio, ao contrário do RED do PREP). **GREEN observado**: 4/4 passam, `git status --porcelain` mostra só a edição do próprio arquivo de teste — nada em `.claude/` ou `.common-rules/`.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional necessária — o helper `project()` replica exatamente o padrão já em uso em `tests/setup-writes.test.ts`, sem introduzir uma segunda convenção.

- [x] T002 [P] [TEST] [TDD] [US-001] Isolar root em tests/setup-revert.test.ts — Refs: US-001, FR-001, FR-002, NFR-001, AC-002, AC-003, AC-004 — Depends: none
  - [x] **PREP**: Ler o arquivo e confirmar as 4 chamadas a `runSetup` sem `root`. **RED observado**: `npx vitest run tests/setup-revert.test.ts` no estado original — 4/4 passam, `git status --porcelain` sujo em `.claude/settings.json` e `.common-rules/install.json`; revertido.
  - [x] **EXECUTE**: Mesmo padrão de T001 (helper `project()`), aplicado a este arquivo — as 4 chamadas a `runSetup` agora recebem `root`.
  - [x] **VERIFY**: `npx vitest run tests/setup-revert.test.ts` — **GREEN observado**: 4/4 passam, `git status --porcelain` mostra só a edição do próprio arquivo.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional — mesmo helper de T001, sem nova convenção.

- [x] T003 [P] [TEST] [TDD] [US-001] Isolar root em tests/setup-record.test.ts — Refs: US-001, FR-001, FR-002, NFR-001, AC-002, AC-003, AC-004 — Depends: none
  - [x] **PREP**: Ler o arquivo e confirmar as 4 chamadas a `runSetup` sem `root`. **RED observado**: 4/4 passam no estado original, `git status --porcelain` sujo em `.claude/settings.json` e `.common-rules/install.json`; revertido.
  - [x] **EXECUTE**: Mesmo padrão de T001 (helper `project()`), aplicado a este arquivo.
  - [x] **VERIFY**: `npx vitest run tests/setup-record.test.ts` — **GREEN observado**: 4/4 passam, `git status --porcelain` só com a edição do próprio arquivo.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional — mesmo helper de T001.

- [x] T004 [P] [TEST] [TDD] [US-001] Isolar root em tests/setup-install.test.ts — Refs: US-001, FR-001, FR-002, NFR-001, AC-002, AC-003, AC-004 — Depends: none
  - [x] **PREP**: Ler o arquivo e confirmar as 4 chamadas a `runSetup` sem `root`. **RED observado**: 4/4 passam no estado original, `git status --porcelain` sujo em `.claude/settings.json` e `.common-rules/install.json`; revertido.
  - [x] **EXECUTE**: Mesmo padrão de T001 (helper `project()`), aplicado a este arquivo.
  - [x] **VERIFY**: `npx vitest run tests/setup-install.test.ts` — **GREEN observado**: 4/4 passam, `git status --porcelain` só com a edição do próprio arquivo.
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional — mesmo helper de T001.

- [x] T005 [P] [TEST] [TDD] [US-001] Isolar root em tests/setup-dryrun.test.ts — Refs: US-001, FR-001, FR-002, NFR-001, AC-002, AC-003, AC-004 — Depends: none
  - [x] **PREP**: Ler o arquivo e confirmar as 3 chamadas a `runSetup` sem `root`. **Achado**: diferente dos outros quatro, este arquivo NÃO sujava o repositório — rodado no estado original, `git status --porcelain` ficou limpo, porque `dryRun: true` faz `runSetup` retornar antes de qualquer escrita em disco, independentemente de `root`. Corrigido mesmo assim: o FR-001 exige `root` em toda chamada com `write: true`, incondicionalmente, e isso blinda o arquivo caso o retorno antecipado do dry-run algum dia mude.
  - [x] **EXECUTE**: Mesmo padrão de T001 (helper `project()`), aplicado a este arquivo.
  - [x] **VERIFY**: `npx vitest run tests/setup-dryrun.test.ts` — **GREEN observado**: 3/3 passam, `git status --porcelain` só com a edição do próprio arquivo (já estava limpo antes também, ver PREP).
  - [x] **VISUAL**: Não aplicável — arquivo de teste sem superfície visual.
  - [x] **EVIDENCE**: Registrado nas seções 11–12.
  - [x] **IMPROVE**: Achado registrado no PREP — vale considerar, fora do escopo desta spec, se `runSetup` deveria validar `root` mesmo em dry-run, para não depender do retorno antecipado permanecer assim.
  <!-- framework:evidence {"task":"T005","refs":["US-001","FR-001","FR-002","NFR-001","AC-002","AC-003","AC-004"],"files":["tests/setup-dryrun.test.ts"],"commands":[{"run":"npx vitest run tests/setup-dryrun.test.ts","exit":0}]} -->

**Checkpoint**: os cinco arquivos passam individualmente com `root` isolado,
sem nenhuma asserção mudando de resultado.

#### Fase final — Qualidade

- [x] T006 [TEST] [TDD] Regressão completa e verificação de isolamento real, medida em .common-rules/install.json — Refs: US-001, FR-001, FR-002, NFR-001, AC-001, AC-002, AC-003, AC-004 — Depends: T001, T002, T003, T004, T005
  - [x] **PREP**: Confirmar repositório limpo (`git status --porcelain` vazio) antes de iniciar. Confirmado vazio.
  - [x] **EXECUTE**: Rodar `npx vitest run` (suíte completa) duas vezes seguidas. Executado.
  - [x] **VERIFY**: `git status --porcelain` vazio depois de cada uma das duas rodadas, e que todos os testes continuam passando. **Rodada 1**: 158 arquivos, 425/425 testes, `git status --porcelain` vazio. **Rodada 2**: idêntico, 158/425, vazio de novo. É a primeira vez nesta sessão inteira que a suíte completa roda sem sujar o repositório — antes exigia reverter manualmente (`git checkout -- .claude/settings.json .common-rules/install.json`) toda vez.
  - [x] **VISUAL**: Não aplicável — nenhuma superfície visual envolvida.
  - [x] **EVIDENCE**: Registrado acima e nas seções 11–12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional necessária agora — a extração de um helper de fixture compartilhado (DEC-001) permanece uma melhoria futura opcional, deliberadamente fora de escopo desta entrega.
  <!-- framework:evidence {"task":"T006","refs":["US-001","FR-001","FR-002","NFR-001","AC-001","AC-002","AC-003","AC-004"],"files":[],"commands":[{"run":"npx vitest run","exit":0},{"run":"git status --porcelain","exit":0}]} -->

### 15. Ordem de execução

- Caminho crítico: T001/T002/T003/T004/T005 → T006.
- Tarefas paralelas: T001, T002, T003, T004 e T005 são independentes entre si
  — cada uma edita um arquivo de teste distinto, sem dependência de dados ou
  ordem entre elas.
- Estratégia de MVP: não aplicável no sentido de "menor história entregável"
  — as cinco tarefas T001–T005 formam um único incremento coeso (isolar os
  cinco arquivos); entregar apenas parte deles deixaria o problema
  parcialmente resolvido (o repositório continuaria sendo poluído pelos
  arquivos ainda não corrigidos).

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Nenhuma.

#### Riscos

- Algum dos cinco arquivos depender implicitamente do `cwd` real por um
  motivo não documentado → mitigação: já investigado na descoberta (seção
  2, "Dúvidas respondidas") lendo os cinco arquivos por completo; nenhuma
  evidência encontrada. Risco residual baixo, a confirmar durante a
  execução de cada tarefa (PREP de T001–T005).
- Isolar o `root` exigir popular `.claude/` dentro do diretório temporário
  para que a detecção de evidência (`env.hasClaudeCode`) continue
  consistente com o `env` fixo já usado em cada arquivo → mitigação: seguir
  exatamente o helper `project()` de `tests/setup-writes.test.ts`, que já
  resolve isso.

#### Suposições

- Nenhum dos cinco arquivos depende do `cwd` real do processo por um motivo
  não documentado (confirmado por leitura completa, seção 2).
- Um diretório temporário por `it()` (ou por `describe()`, quando os casos
  dentro dele compartilham estado via `previous`/`record`, como em
  `tests/setup-idempotent.test.ts` e `tests/setup-revert.test.ts`) é
  suficiente; não é necessário um diretório por asserção individual.

### 17. Decisões

- **DEC-001**: Cada um dos cinco arquivos cria seu próprio diretório
  temporário inline (replicando o helper `project()` de
  `tests/setup-writes.test.ts`), em vez de extrair um fixture
  compartilhado num arquivo novo — razão: reduz o risco de introduzir um
  segundo padrão de isolamento concorrente com o já existente; a
  duplicação entre cinco arquivos pequenos é aceitável. Alternativa
  considerada: extrair `project()` para um módulo de fixture compartilhado
  — fica registrada como melhoria futura opcional (ver Escopo, "Fora de
  escopo"), não bloqueante para esta entrega.
- **DEC-002**: O fallback `opts.root ?? process.cwd()` em
  `src/setup/run.ts:227` não é alterado — razão: é o comportamento real e
  intencional da CLI (`common-rules setup` sem `--root` explícito precisa
  usar o `cwd` do processo que a invoca); mudar isso é uma decisão de
  produção distinta do problema relatado, que é sobre a suíte de testes.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam — AC-001 a AC-004, ver seções 11–12.
- [x] Todos os requisitos possuem evidência de verificação — FR-001, FR-002, NFR-001, ver seções 11–12.
- [x] Todas as tarefas na seção 14 estão concluídas — 6/6, `checklist_complete=36`.
- [x] Testes e checks estáticos disponíveis passam — `npx tsc --noEmit` limpo, `npx vitest run` 425/425 (duas rodadas, T006), `verify_acceptance.mjs` `QA: PASSED`.
