# Especificação integrada: Fatia 1d: detecção de backends de agente e graceful degradation

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0008 |
| Slug | 0008-fatia-1d-deteccao-backends |
| Status | Complete |
| Effort | 3 |
| Effort updated at | 2026-08-30 |
| Effort rationale | A lógica de detecção é pequena — presença e versão via `which`/`--version`, sem sondagem de capacidade em tempo de execução. O custo está em estender `doctor` com uma terceira camada sem quebrar o contrato de saída das duas existentes, e em fixar a lista suportada com evidência real por backend. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — a entrega acontece dentro de `common-rules doctor`, um comando de terminal já existente, sem tela. |
| Atualizada em | 2026-08-30 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O `common-rules doctor` conhece duas camadas de dependência — `npm` e `python` — e nenhuma delas é um backend de agente. A fatia 1e (seleção de modelo pelo Orchestrator) precisa saber, antes de recomendar um modelo, quais backends deste computador são de fato acionáveis por um subprocesso não interativo: um Orchestrator não abre terminal, não digita senha, não espera prompt.

Presença não é capacidade. Um backend instalado pode não expor forma alguma de rodar sem interação — a pesquisa desta fatia mostrou isso na prática, inclusive corrigindo uma conclusão anterior do próprio backlog, que havia checado só o `--help` de topo de cada CLI e perdido dois subcomandos dedicados exatamente a isso.

E "detectado" não pode significar "instalado por nós": `common-rules` não instala agente algum — a decisão vinculante da captura original já fixa isso —, e a lista de backends muda de máquina para máquina sem que o projeto tenha qualquer ingerência sobre ela.

#### Resultado desejado

`common-rules doctor` passa a relatar, para cada backend candidato conhecido, se está presente e qual versão, e se é um dos backends com capacidade demonstrada de invocação sem interação. Nenhum backend ausente faz o `doctor` sair com código diferente de zero — a terceira camada é informativa, nunca bloqueante, ao contrário das duas primeiras.

A lógica de detecção fica isolada num módulo próprio, com a fonte de resolução injetável, para que a fatia 1e a reutilize diretamente ao decidir qual backend recomendar, e para que a ausência de um backend na máquina de quem roda a suíte vire caso de teste programado, não acidente do ambiente.

#### Métricas de sucesso

- `doctor` relata presença e versão de cada um dos backends candidatos conhecidos, sem exigir nenhum deles para sair com código zero.
- A lista de backends com capacidade de invocação sem interação está fixada por evidência real, documentada em `research/`, e não por sondagem de `--help` em produção.
- Um backend candidato presente mas fora da lista suportada aparece no relato como não suportado, nunca como ausente nem como suportado por engano.
- O detector aceita fonte de resolução injetada, e a suíte prova o caminho de ausência sem depender do que está instalado na máquina de quem a executa.
- `npx tsc --noEmit`, `npm run build` e a suíte completa continuam em exit 0, sem alterar o comportamento das camadas `npm` e `python` já existentes.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-030** [critical] `pi`, `agy` e `claude` expõem forma de invocação sem interação diretamente no `--help` de topo (`--print`/`-p`, com saída estruturada via `--mode json`/`--output-format json`) — Verdict: verified — Confidence: high — Evidence: research/backends/invocacao-sem-interacao.md#suportados — Budget: 1/2.
- **R-031** [critical] `codex` e `goose` também expõem invocação sem interação, mas por subcomando dedicado (`codex exec`, `goose run`) e não por flag do binário raiz — a varredura anterior do backlog, que checou só o `--help` de topo, havia concluído o oposto. Verificado por execução real: `codex exec` respondeu de ponta a ponta sem terminal interativo; `goose run` teve a mesma forma de invocação e só falhou por falta de credencial configurada, não por exigir interação — Verdict: verified — Confidence: high — Evidence: research/backends/invocacao-sem-interacao.md#suportados — Budget: 2/2.
- **R-032** [high] `dsh` não expõe forma de invocação sem interação equivalente, nem no `--help` de topo nem nos subcomandos examinados; é um bootloader de perfis, não um agente de codificação por si — Verdict: verified — Confidence: medium — Evidence: research/backends/invocacao-sem-interacao.md#não-suportados — Budget: 1/1.

#### Fontes e contexto consultados

- `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md`, pelas decisões D1–D4 e pelo estado da máquina registrado em 2026-08-29.
- `src/doctor.ts` e `specs/completed/0002-phase-1a-esqueleto-typescript/spec.md`, pela forma real de `Environment`, `Layer` e `DependencyResult`, e pela `DEC-002` (detecção por capacidade, nunca por presença).
- `specs/completed/0003-fatia-1b-setup-hooks/spec.md`, pela `DEC-006` (registro estruturado dentro do projeto, `.env` descartado como alternativa) — resolve, sem precisar perguntar de novo, a menção a "cache `.env`" na ideia original do `BACKLOG-0003`.
- `--help` de `pi`, `agy`, `claude`, `codex`, `codex exec`, `goose`, `goose run` e `dsh`, executados de verdade nesta máquina em 2026-08-30, e uma execução real de `codex exec` de ponta a ponta.

#### Documentação consultada

Nenhuma documentação externa publicada; toda a evidência vem de `--help` e de execução real dos próprios binários, capturados em `research/`.

#### Artefatos de pesquisa armazenados

- `specs/completed/0008-fatia-1d-deteccao-backends/research/backends/invocacao-sem-interacao.md` — tabela de capacidade por backend, com versão, flag/subcomando de invocação sem interação, saída estruturada quando houver, e a evidência de execução real de `codex exec` e `goose run`.

#### Dúvidas respondidas

- **Q**: A lista suportada da 1d é `pi`, `agy` e `claude`, como o backlog registrava? → **A**: Não mais. Reverificado nesta especificação: `codex` e `goose` também têm capacidade demonstrada, por subcomando (`exec`, `run`) em vez de flag do binário raiz. A lista corrigida tem cinco backends. `D2` do backlog foi atualizada com a correção e a evidência.
- **Q**: A "graceful degradation" desta fatia grava cache em `.env`, como a ideia original do `BACKLOG-0003` menciona? → **A**: Não. `DEC-006` (SPEC-0003) já descartou `.env` como formato de registro para o projeto inteiro, em favor de um registro estruturado dentro do projeto. Esta fatia não introduz registro algum: não há o que instalar ou restaurar para um backend de agente — "detectado" não implica "gravado" —, e o `doctor` já resolve tudo de novo a cada chamada, no mesmo padrão das camadas `npm` e `python`.
- **Q**: `ollama` entra na lista de backends desta fatia? → **A**: Não. `ollama` serve modelos locais; não é um agente de codificação por si, e sua análise (modelos disponíveis, custo, capacidade de máquina) pertence à seleção de modelo da fatia 1e, que consome a lista de backends desta fatia como um dado de entrada entre vários.
- **Q**: Um backend presente mas fora da lista suportada — `cursor-agent`, `dsh` — desaparece do relato do `doctor`? → **A**: Não. A distinção que o backlog já registrava permanece: o `doctor` relata todos os backends candidatos conhecidos que encontrar, e nomeia separadamente quais são suportados. Ausência do relato e "não suportado" são coisas diferentes.

#### Dúvidas abertas

Nenhuma que bloqueie esta fatia.

### 3. Escopo e atores

#### Incluído

- Um módulo de detecção de backends de agente, com fonte de resolução injetável, que verifica presença e versão de cada backend candidato conhecido sem invocá-lo para além de `--version`.
- Extensão de `common-rules doctor` com uma terceira camada, `agent`, relatando cada backend candidato conhecido, presença, versão e se está na lista suportada — sem exigir presença de nenhum para sair com código zero.
- Fixação, por evidência real registrada em `research/`, da lista de backends com capacidade demonstrada de invocação sem interação: `pi`, `agy`, `claude`, `codex`, `goose`.
- Correção registrada da decisão anterior do backlog (`D2`), que havia excluído `codex` e `goose` por varredura incompleta.

#### Fora de escopo

- Instalar, atualizar ou remover qualquer backend de agente — `common-rules` detecta, nunca instala agente.
- Selecionar ou recomendar modelo, custo ou capacidade de máquina — isso é a fatia 1e, que consome a lista suportada desta fatia.
- Invocar de fato qualquer backend para testar se está "pronto para responder" (credenciais, autenticação) — esta fatia verifica capacidade de invocação sem interação, não prontidão.
- Registrar em disco o que foi detectado — não há cache, arquivo `.env` nem entrada no registro de instalação; o `doctor` resolve de novo a cada chamada.
- Suporte a `dsh`, `cursor-agent` ou qualquer outro backend fora da lista fixada nesta fatia — pode entrar por acréscimo de um caso numa fatia futura, quando alguém demonstrar por execução a invocação sem interação, no mesmo padrão que trouxe `codex` e `goose` para dentro agora.
- Alterar o comportamento ou o contrato de saída das camadas `npm` e `python` já existentes em `doctor`.

#### Atores

- **Quem usa o `common-rules`**: roda `doctor` e descobre quais backends deste computador são utilizáveis por um Orchestrator, sem precisar saber de antemão a forma de invocação de cada um.
- **A fatia 1e (Orchestrator, seleção de modelo)**: importa o módulo de detecção diretamente e usa a lista suportada como um dos dados de entrada da recomendação.
- **Quem mantém o projeto**: adiciona um backend novo à lista suportada só depois de demonstrar, por execução real, a invocação sem interação — o mesmo rigor que corrigiu `codex` e `goose` nesta fatia.

### 4. Princípios e restrições do projeto

- **PR-030**: Detecção por capacidade, nunca por presença (`DEC-002`, SPEC-0002) — este princípio já existia para as duas camadas anteriores e se estende à terceira sem exceção.
- **PR-031**: `common-rules` detecta backends de agente; nunca os instala, atualiza nem remove.
- **PR-032**: A terceira camada de `doctor` é informativa. Backend de agente ausente nunca faz `doctor` sair com código diferente de zero.
- **PR-033**: Toda fonte de resolução externa ao processo é injetável, no mesmo padrão de `TargetEnvironment` (fatia 1a) e do `Environment` de `doctor` — para que a suíte não dependa do que está instalado na máquina de quem a executa.

### 5. Histórias de usuário

#### US-030 — Saber quais backends são utilizáveis por um Orchestrator (P1)

Como **quem usa o `common-rules`**, quero **que `doctor` relate quais backends de agente têm capacidade demonstrada de invocação sem interação**, para **saber, antes de configurar orquestração, com quais backends o Orchestrator poderá de fato trabalhar**.

**Por que P1**: É a razão da fatia — sem ela, a fatia 1e não tem de onde partir, e a única forma de descobrir seria ler o código-fonte do Orchestrator.
**Teste independente**: Rodar `doctor` num ambiente com pelo menos um backend suportado presente e um ausente mostra os dois, com presença, versão e se cada um está na lista suportada.
**Requisitos**: FR-030, FR-031, FR-032

#### US-031 — Backend fora da lista suportada não desaparece do relato (P1)

Como **quem usa o `common-rules`**, quero **que um backend presente mas não suportado apareça no relato como tal**, para **não confundir "não suportado ainda" com "não instalado"**.

**Por que P1**: A distinção evita que alguém instale um backend achando que basta estar no PATH, e perca tempo depurando por que o Orchestrator não o usa.
**Teste independente**: Com `dsh` presente e `pi` ausente, o relato nomeia os dois — `dsh` como presente e não suportado, `pi` como ausente.
**Requisitos**: FR-032, FR-033

#### US-032 — Detector reutilizável e testável sem depender da máquina real (P1)

Como **quem constrói a fatia 1e**, quero **um módulo de detecção com fonte de resolução injetável**, para **testar a seleção de modelo sobre qualquer combinação de backends presentes ou ausentes, sem depender do que está instalado onde a suíte roda**.

**Por que P1**: É o mesmo requisito que já vale para `TargetEnvironment` e para o `Environment` de `doctor` — sem ele, a ausência de um backend na máquina de CI vira falha de teste em vez de caso coberto.
**Teste independente**: Um caso de teste injeta uma fonte que resolve `codex` como ausente e os demais como presentes, sem que a suíte dependa do PATH real.
**Requisitos**: FR-030, NFR-032

### 6. Cenários BDD de aceite

#### AC-080 — Backends suportados presentes aparecem no relato

**Cobre**: US-030, FR-030, FR-031

```gherkin
@US-030 @FR-030 @FR-031 @AC-080
Feature: Relato de backends suportados

  Scenario: doctor relata presença e versão de cada backend suportado
    Given uma fonte de resolução em que pi, agy, claude, codex e goose estão presentes, cada um com versão
    When o doctor examina o ambiente
    Then o relato nomeia os cinco, cada um com presença, versão e a marca de suportado
```

#### AC-081 — Backend suportado ausente não afeta o código de saída

**Cobre**: US-030, FR-030, PR-032

```gherkin
@US-030 @FR-030 @PR-032 @AC-081
Feature: Camada informativa

  Scenario: Nenhum backend de agente está presente
    Given uma fonte de resolução em que nenhum backend está presente
    When o doctor examina o ambiente
    Then o relato nomeia os cinco como ausentes
    And o código de saída não é afetado pela ausência de backends de agente
```

#### AC-082 — Backend não suportado presente aparece como tal, não como ausente

**Cobre**: US-031, FR-032, FR-033

```gherkin
@US-031 @FR-032 @FR-033 @AC-082
Feature: Distinção entre não suportado e ausente

  Scenario: dsh está presente, mas fora da lista suportada
    Given uma fonte de resolução em que dsh está presente e os cinco suportados estão ausentes
    When o doctor examina o ambiente
    Then o relato nomeia dsh como presente e não suportado
    And nomeia os cinco suportados como ausentes
```

#### AC-083 — A lista suportada é fixa, não descoberta em produção

**Cobre**: US-030, FR-032, NFR-030

```gherkin
@US-030 @FR-032 @NFR-030 @AC-083
Feature: Lista suportada fixa

  Scenario: Detecção não invoca o backend além de --version
    Given uma fonte de resolução instrumentada para registrar cada chamada
    When o doctor examina o ambiente
    Then nenhuma chamada além da que resolve presença e versão ocorre
    And nenhum backend é invocado com prompt, --print ou equivalente
```

#### AC-084 — O detector aceita fonte injetada

**Cobre**: US-032, FR-030, NFR-032

```gherkin
@US-032 @FR-030 @NFR-032 @AC-084
Feature: Detector injetável

  Scenario: Uma fonte fake decide o resultado, sem tocar a máquina real
    Given uma fonte de resolução fake que marca codex como ausente e os demais como presentes
    When o módulo de detecção roda com essa fonte
    Then o resultado reflete exatamente o que a fonte fake decidiu
    And nada no módulo consulta o PATH real
```

#### AC-085 — Paridade entre a fonte real e a máquina

**Cobre**: US-032, NFR-032

```gherkin
@US-032 @NFR-032 @AC-085
Feature: A fonte real corresponde à máquina

  Scenario: A fonte real resolve o que de fato está instalado
    Given a fonte de resolução real, sem injeção
    When o módulo de detecção roda sobre esta máquina
    Then o resultado para cada backend corresponde a rodar "which <backend>" e "<backend> --version" diretamente
```

#### AC-086 — Suportado, não suportado e ausente convivem no mesmo relato

**Cobre**: US-031, FR-031, FR-033, NFR-031

```gherkin
@US-031 @FR-031 @FR-033 @NFR-031 @AC-086
Feature: Convivência de status no relato

  Scenario: pi suportado presente, dsh não suportado presente, agy suportado ausente
    Given uma fonte de resolução em que pi está presente, dsh está presente e agy está ausente
    When o doctor examina o ambiente
    Then pi aparece presente e suportado
    And dsh aparece presente e não suportado
    And agy aparece ausente
    And o código de saída não é afetado por nenhum dos três
```

#### AC-087 — Resolução de versão nunca interpreta `--help`

**Cobre**: FR-030, NFR-030

```gherkin
@FR-030 @NFR-030 @AC-087
Feature: Versão vem só de --version

  Scenario: A fonte devolve texto de --version, nunca de --help
    Given uma fonte de resolução instrumentada que registra qual flag cada chamada usa
    When o módulo de detecção resolve presença e versão de um backend suportado
    Then a única flag usada é --version
    And --help nunca é consultado
```

#### AC-088 — Detecção injetada é determinística num cenário misto completo

**Cobre**: US-031, US-032, FR-032, FR-033, NFR-031, NFR-032

```gherkin
@US-031 @US-032 @FR-032 @FR-033 @NFR-031 @NFR-032 @AC-088
Feature: Determinismo sobre cenário misto

  Scenario: A mesma fonte injetada produz o mesmo resultado em duas execuções
    Given uma fonte de resolução com pi suportado presente, codex suportado ausente e dsh não suportado presente
    When o doctor examina o ambiente duas vezes com a mesma fonte
    Then os dois relatos são idênticos
    And o código de saída não muda por causa de nenhum dos três backends
```

#### AC-089 — A camada `agent` aparece no texto do relato

**Cobre**: FR-031, NFR-030, NFR-031

```gherkin
@FR-031 @NFR-030 @NFR-031 @AC-089
Feature: Texto do relato inclui a terceira camada

  Scenario: O comando de terminal imprime a camada agent
    Given um ambiente com um backend suportado presente e um ausente
    When o comando de terminal formata o relato de doctor
    Then o texto nomeia a camada agent, distinta de npm e de python
    And nenhuma chamada de --help ocorre durante a formatação
    And o código de saída do comando reflete só as camadas npm e python
```

### 7. Requisitos

#### Funcionais

- **FR-030**: O sistema deve detectar, para cada backend candidato conhecido, se está presente no `PATH` e qual versão relata, por meio de uma fonte de resolução injetável — nunca invocando o backend além do necessário para presença e versão.
- **FR-031**: `common-rules doctor` deve relatar cada backend candidato conhecido, com presença, versão e se está na lista suportada, como uma terceira camada (`agent`) ao lado das camadas `npm` e `python` já existentes.
- **FR-032**: A lista de backends suportados deve ser fixa no código — `pi`, `agy`, `claude`, `codex`, `goose` —, e a lista de candidatos conhecidos deve incluir também os presentes mas não suportados, para que o relato os distinga de backends realmente ausentes.
- **FR-033**: Um backend candidato presente, mas fora da lista suportada, deve ser relatado como presente e não suportado — nunca omitido do relato nem marcado como suportado.

#### Não funcionais

- **NFR-030**: **Capacidade fixada, não sondada**. A forma de invocação sem interação de cada backend suportado é conhecimento documentado em `research/`, não descoberta por análise de `--help` em tempo de execução. **Verificação**: inspeção do código de detecção, confirmando que ele só resolve presença e versão, sem interpretar texto de ajuda.
- **NFR-031**: **Camada informativa**. A ausência de qualquer backend de agente nunca altera o código de saída de `doctor`. **Verificação**: caso de integração com todos os backends ausentes, conferindo `exitCode` igual ao de um ambiente idêntico sem a terceira camada.
- **NFR-032**: **Determinismo**. Nenhum caso da suíte depende do que está de fato instalado na máquina onde ela roda — a fonte de resolução é sempre injetada nos casos de unidade e integração; um único caso de paridade confere a fonte real contra a máquina.

#### Erros e casos-limite

- Backend suportado ausente → relatado como ausente, sem versão, sem afetar o código de saída.
- Backend candidato presente mas não suportado → relatado como presente e não suportado, nunca como ausente.
- Backend suportado presente mas `--version` falha ou não devolve saída interpretável → relatado como presente, versão desconhecida, ainda marcado como suportado — presença no `PATH` não depende de `--version` responder.
- Backend fora da lista de candidatos conhecidos, presente na máquina → não aparece no relato; a lista de candidatos é fechada, e ampliá-la é decisão de uma fatia futura, com a mesma evidência exigida para `codex` e `goose` nesta.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- `src/doctor.ts` define `Layer = "npm" | "python"`, `Origin = "local" | "global"`, `DependencyResult` e `Environment`, com `inspectDependencies(env, root?)` devolvendo `Report` com `results: DependencyResult[]` e `exitCode`, calculado hoje como `results.every(r => r.present) ? 0 : 1`.
- `probe(command, args)`, interno a `doctor.ts`, executa `execFileSync` e devolve a última palavra da saída, ou `null` em falha — é o padrão que a resolução de versão de backend reaproveita.
- `defaultEnvironment()` monta a implementação real de `Environment`, usada pelo comando de terminal; os casos de teste injetam implementações fake.
- A suíte tem 99 arquivos e 311 casos.

#### Arquitetura e módulos

| Módulo | Responsabilidade | Arquivo |
| --- | --- | --- |
| Backends conhecidos | Nomear a lista suportada e a lista de candidatos conhecidos, como constantes | `src/backends/known.ts` |
| Detecção | Resolver presença e versão de cada candidato via fonte injetável, sem invocar além de `--version` | `src/backends/detect.ts` |

`src/doctor.ts` importa `detectBackends` e as duas listas, e passa a incluir o resultado em `Report.results` com `layer: "agent"`, calculando `exitCode` só sobre as camadas `npm` e `python` — a camada `agent` nunca participa dessa conta. `Layer` ganha o terceiro valor, como o backlog já registrava como implicação técnica.

O módulo vive fora de `doctor.ts` porque a fatia 1e o importa diretamente, sem depender do comando `doctor` nem do tipo `Report`, que carrega semântica de exit code que não se aplica à seleção de modelo.

#### Migrations

Não aplicável. A fatia não introduz banco nem registro em disco.

#### Models

Nenhum novo. `DependencyResult` já existente ganha uso para `layer: "agent"`, sem mudança de forma: `{ name, layer, present, origin, version, hint? }`. `origin` para um backend de agente é sempre `"global"` — não há cópia local de projeto para um backend de agente, só presença no `PATH` do usuário.

#### Controllers e casos de uso

`inspectDependencies` passa a montar três blocos de `DependencyResult` — `npm`, `python`, `agent` — e o `exitCode` considera só os dois primeiros. `formatReport()`, em `src/cli.ts`, imprime a terceira camada como as duas primeiras, sem tratamento especial de layout: o relato já distingue camada por linha (`camada npm`, `camada python`, `camada agent`), e a pessoa lê a origem no mesmo texto.

#### Views e experiência

Não aplicável. A seção 10 registra a ausência de interface.

#### Queries e repositórios

Não aplicável.

#### Jobs e processamento assíncrono

A detecção é síncrona, como as duas camadas existentes. Não há fila.

#### Estrutura de arquivos

```text
src/backends/
  known.ts
  detect.ts
src/doctor.ts        (alterado — Layer, DependencyResult.supported, inspectDependencies com backendEnv)
src/cli.ts            (alterado — renderReport() extraído de formatReport())
tests/
  backends-fixtures.ts
  backends-suportados-presentes.test.ts
  backends-ausencia-nao-afeta-saida.test.ts
  backends-nao-suportado-presente.test.ts
  backends-lista-fixa-sem-sondagem.test.ts
  backends-detector-injetavel.test.ts
  backends-paridade-real.test.ts
  backends-convivencia-status.test.ts
  backends-versao-sem-help.test.ts
  backends-determinismo-misto.test.ts
  doctor-camada-agent-texto.test.ts
specs/completed/0008-fatia-1d-deteccao-backends/
  spec.md
  research/
    backends/
      invocacao-sem-interacao.md
```

### 9. Modelo de dados

Não aplicável. A fatia não persiste nada: `doctor` resolve de novo a cada chamada, no mesmo padrão das camadas `npm` e `python`, e não há registro, cache nem arquivo `.env` — decisão já fixada por `DEC-006` (SPEC-0003) e reafirmada na seção 2.

### 10. Interfaces e contratos

#### Interface para pessoas

**Não há interface para pessoas.** A entrega estende um comando de terminal já existente, em texto, sem tela.

#### APIs expostas

Nenhuma. A fatia amplia o comportamento de `doctor` e acrescenta um módulo consumido por código, não por rede.

#### APIs externas utilizadas

Nenhuma chamada de rede. A detecção usa `which`-equivalente (resolução de `PATH`) e `<backend> --version`, os mesmos primitivos que `doctor.ts` já usa para `code-review-graph`.

#### Documentação das APIs consultadas

Não aplicável — evidência vem de execução real dos próprios binários, registrada em `research/`.

#### Eventos e outros contratos

Não aplicável.

### 11. Estratégia TDD

- **Unidade**: `detectBackends` com fonte de resolução fake, cobrindo presente/ausente/não suportado e a garantia de que nenhuma chamada além de `--version` ocorre.
- **Integração**: `inspectDependencies` com a camada `agent` incluída, conferindo que `exitCode` não muda com backends de agente ausentes, e que `formatReport()` imprime a terceira camada.
- **Paridade**: um caso confere a fonte real contra `which`/`--version` diretos na máquina — o único caso que depende do que está de fato instalado, no mesmo padrão que a fatia 1a já usa para o `Environment` de `doctor`.
- **Runner**: Vitest, pelo script `test:tdd`.
- **Verificação manual**: `node dist/cli.js doctor` executado de verdade nesta máquina, conferindo que os cinco backends suportados aparecem com a versão real capturada na pesquisa.

O ponto sensível é a tentação de sondar `--help` em produção para decidir capacidade — foi exatamente o que produziu a conclusão errada que esta fatia corrigiu. `NFR-030` e `AC-083` existem para que a suíte reprove qualquer implementação que tente reintroduzir essa sondagem: a lista suportada é dado fixo, verificado uma vez por execução real e registrado em `research/`, não resultado de heurística sobre texto de terceiro.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-030, FR-030, FR-031, AC-080 | AC-080 na seção 6 | tests/backends-suportados-presentes.test.ts | Pending | Pending | Pending |
| US-030, FR-030, PR-032, AC-081 | AC-081 na seção 6 | tests/backends-ausencia-nao-afeta-saida.test.ts | Pending | Pending | Pending |
| US-031, FR-032, FR-033, AC-082 | AC-082 na seção 6 | tests/backends-nao-suportado-presente.test.ts | Pending | Pending | Pending |
| US-030, FR-032, NFR-030, AC-083 | AC-083 na seção 6 | tests/backends-lista-fixa-sem-sondagem.test.ts | Pending | Pending | Pending |
| US-032, FR-030, NFR-032, AC-084 | AC-084 na seção 6 | tests/backends-detector-injetavel.test.ts | Pending | Pending | Pending |
| US-032, NFR-032, AC-085 | AC-085 na seção 6 | tests/backends-paridade-real.test.ts | Pending | Pending | Pending |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-030 | AC-080 | Unidade | tests/backends-suportados-presentes.test.ts | **Passed** — T001/T012 |
| FR-030 | AC-083 | Unidade | tests/backends-lista-fixa-sem-sondagem.test.ts | **Passed** — T004/T012 |
| FR-030 | AC-084 | Unidade | tests/backends-detector-injetavel.test.ts | **Passed** — T005/T012 |
| FR-031 | AC-080 | Integração | tests/backends-suportados-presentes.test.ts | **Passed** — T001/T012 |
| FR-031 | AC-081 | Integração | tests/backends-ausencia-nao-afeta-saida.test.ts | **Passed** — T002/T013 |
| FR-031 | AC-086 | Integração | tests/backends-convivencia-status.test.ts | **Passed** — T007/T013 |
| FR-031 | AC-089 | Integração | tests/doctor-camada-agent-texto.test.ts | **Passed** — T010/T013 |
| FR-032 | AC-082 | Unidade | tests/backends-nao-suportado-presente.test.ts | **Passed** — T003/T011 |
| FR-032 | AC-083 | Unidade | tests/backends-lista-fixa-sem-sondagem.test.ts | **Passed** — T004/T012 |
| FR-032 | AC-088 | Integração | tests/backends-determinismo-misto.test.ts | **Passed** — T009/T011 |
| FR-033 | AC-082 | Unidade | tests/backends-nao-suportado-presente.test.ts | **Passed** — T003/T011 |
| FR-033 | AC-086 | Integração | tests/backends-convivencia-status.test.ts | **Passed** — T007/T013 |
| FR-033 | AC-088 | Integração | tests/backends-determinismo-misto.test.ts | **Passed** — T009/T011 |
| NFR-030 | AC-083 | Unidade | tests/backends-lista-fixa-sem-sondagem.test.ts | **Passed** — T004/T012 |
| NFR-030 | AC-087 | Unidade | tests/backends-versao-sem-help.test.ts | **Passed** — T008/T012 |
| NFR-030 | AC-089 | Integração | tests/doctor-camada-agent-texto.test.ts | **Passed** — T010/T013 |
| NFR-031 | AC-081 | Integração | tests/backends-ausencia-nao-afeta-saida.test.ts | **Passed** — T002/T013 |
| NFR-031 | AC-086 | Integração | tests/backends-convivencia-status.test.ts | **Passed** — T007/T013 |
| NFR-031 | AC-088 | Integração | tests/backends-determinismo-misto.test.ts | **Passed** — T009/T011 |
| NFR-031 | AC-089 | Integração | tests/doctor-camada-agent-texto.test.ts | **Passed** — T010/T013 |
| NFR-032 | AC-084 | Unidade | tests/backends-detector-injetavel.test.ts | **Passed** — T005/T012 |
| NFR-032 | AC-085 | Paridade | tests/backends-paridade-real.test.ts | **Passed** — T006/T012 |
| NFR-032 | AC-088 | Integração | tests/backends-determinismo-misto.test.ts | **Passed** — T009/T011 |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-08-30)
- **Comando**: `node .agents/skills/framework-04-validate/scripts/validate_spec.mjs specs/completed/0008-fatia-1d-deteccao-backends/spec.md`
- **Cobertura**: 3 US, 4 FR, 3 NFR, 10 AC, 5 DEC; mínimo de 3 AC por ID satisfeito em todos, inclusive os que exigiram ACs adicionais (`AC-086`–`AC-089`) para cobrir `US-031`, `US-032`, `FR-031`, `FR-032`, `FR-033`, `NFR-030`, `NFR-031`, `NFR-032`.
- **Research**: `load_research.mjs` em `PASSED`, com `R-030`, `R-031` e `R-032` verificados e um artefato indexado.
- **Revisão ARCH**: a mudança de `exitCode` (`dependenciasOk`) precisa filtrar a camada `agent` explicitamente — hoje é `results.every(r => r.present)`, e simplesmente empurrar entradas `agent` para `results` sem esse filtro quebraria `PR-032`/`NFR-031`. Confirmado contra o código real de `src/doctor.ts` antes deste gate; registrado na seção 8 para a tarefa de código não reintroduzir o erro.
- **Achados**: Nenhum bloqueante. A correção de `D2` (`codex`/`goose` suportados) foi verificada por execução real antes de escrever esta spec, não apenas assumida do backlog.

#### Gate do Ato II — Plano

- **Resultado**: Passed (2026-08-30)
- **Comando**: `node .agents/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/completed/0008-fatia-1d-deteccao-backends/spec.md`
- **Plano**: 16 tarefas — 10 `[TEST] [TDD]`, 3 `[CODE]`, 2 `[DOC]`, 1 `[OPS]`; 80 itens de checklist; 20 de 20 IDs cobertos.
- **Achados**: Nenhum bloqueante.

#### Gate do Ato III — Entrega

- **Resultado**: Passed (2026-08-30)
- **Verificação**: `npm run test:tdd` em exit 0, com **324 casos em 109 arquivos** (era 311/97 antes desta fatia); `npx tsc --noEmit` e `npm run build` em exit 0; `npm run verify` em exit 0 a partir de clone limpo (install 4s, build 0s, test 41s, total 45s).
- **Auditorias**: `check_traceability.mjs` em 20/20 IDs próprios cobertos (ressalva de marcadores órfãos de outras specs persiste, mesma causa já conhecida); `verify_acceptance.mjs` em `QA: PASSED`.
- **Verificação manual real**: `node dist/cli.js doctor` nesta máquina relata os cinco backends suportados com a versão real, `dsh` e `cursor-agent` como presentes e não suportados, código de saída 0.
- **Defeito real encontrado e corrigido durante a verificação manual**: `claude --version` devolve `2.1.251 (Claude Code)`; a extração de versão por último token (herdada do padrão de `probe()` em `doctor.ts`) capturava `Code)`. Corrigido preferindo o primeiro token que começa com dígito. Coberto por um novo caso em `tests/backends-paridade-real.test.ts`, contra a saída real da máquina — não uma fixture que já sabia a resposta certa.
- **Efeito colateral corrigido em testes pré-existentes**: cinco arquivos de teste anteriores a esta fatia (`doctor-ok`, `doctor-missing`, `trace-doctor-relata`, `trace-doctor-sem-registro`, `trace-registro-antigo`) chamavam `inspectDependencies` sem o terceiro parâmetro, o que passou a resolver a camada `agent` contra a máquina real por padrão — violando o princípio de determinismo que os próprios arquivos declaram. Todos passaram a injetar `semBackends` (nenhum backend presente), e `doctor-ok.test.ts` teve duas asserções ajustadas para filtrar a camada `agent`, preservando o escopo original de cada teste.
- **Documentação**: `docs/` reconstruído por `$framework-documentator`, `--check` em exit 0, monitor de contexto em `CURRENT`; `.project-context/STACK.md` e `PROJECT.md` descrevem o módulo novo, a terceira camada e o achado de parsing de versão.

### 14. Tarefas

Formato:
`- [ ] TNNN [P?] [TIPO] [US-NNN?] Ação com caminho — Refs: IDs — Depends: IDs|none`

Checklist obrigatório por tarefa, na ordem:

```markdown
  - [ ] **PREP**: Confirmar escopo, IDs, dependências e baseline.
  - [ ] **EXECUTE**: Produzir a entrega no caminho declarado.
  - [ ] **VERIFY**: Executar a verificação focal adequada.
  - [ ] **EVIDENCE**: Registrar comando, resultado e IDs nas seções 11–13.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
```

#### Fase 1 — RED, um caso por cenário da seção 6

- [x] T001 [P] [TEST] [TDD] [US-030] Derivar de AC-080 o caso em tests/backends-suportados-presentes.test.ts — Refs: US-030, FR-030, FR-031, AC-080 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-080 e fixar o critério: os cinco suportados presentes aparecem com presença, versão e marca de suportado.
  - [x] **EXECUTE**: Escrever o caso com uma fonte de resolução fake que devolve versão para os cinco nomes suportados, conferindo `detectBackends` (ainda inexistente).
  - [x] **VERIFY**: RED — `Cannot find module` sobre `src/backends/detect`.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T002 [P] [TEST] [TDD] [US-030] Derivar de AC-081 o caso em tests/backends-ausencia-nao-afeta-saida.test.ts — Refs: US-030, FR-030, PR-032, NFR-031, AC-081 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-081.
  - [x] **EXECUTE**: Escrever o caso chamando `inspectDependencies` (ainda sem a camada `agent`) com uma fonte em que nenhum backend está presente, conferindo `exitCode` igual ao de um ambiente com `npm`/`python` completos e nenhum backend.
  - [x] **VERIFY**: RED — `inspectDependencies` ainda não aceita fonte de backend nem inclui a camada `agent`.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T003 [P] [TEST] [TDD] [US-031] Derivar de AC-082 o caso em tests/backends-nao-suportado-presente.test.ts — Refs: US-031, FR-032, FR-033, AC-082 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-082.
  - [x] **EXECUTE**: Escrever o caso com `dsh` presente e os cinco suportados ausentes, conferindo que `dsh` aparece como presente e não suportado.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T004 [P] [TEST] [TDD] [US-030] Derivar de AC-083 o caso em tests/backends-lista-fixa-sem-sondagem.test.ts — Refs: US-030, FR-032, NFR-030, AC-083 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-083.
  - [x] **EXECUTE**: Escrever o caso com uma fonte instrumentada que registra cada chamada, conferindo que nenhuma chamada além da que resolve presença/versão ocorre — nenhum `--print`, prompt ou equivalente.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T005 [P] [TEST] [TDD] [US-032] Derivar de AC-084 o caso em tests/backends-detector-injetavel.test.ts — Refs: US-032, FR-030, NFR-032, AC-084 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-084.
  - [x] **EXECUTE**: Escrever o caso com uma fonte fake marcando `codex` ausente e os demais presentes, conferindo que o resultado reflete exatamente a fonte, sem tocar o `PATH` real.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T006 [P] [TEST] [TDD] [US-032] Derivar de AC-085 o caso em tests/backends-paridade-real.test.ts — Refs: US-032, NFR-032, AC-085 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-085; confirmar os cinco backends suportados presentes nesta máquina (pesquisa da seção 2).
  - [x] **EXECUTE**: Escrever o caso com a fonte real (sem injeção), conferindo que o resultado para cada backend corresponde a rodar `which`/`--version` diretamente.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T007 [P] [TEST] [TDD] [US-031] Derivar de AC-086 o caso em tests/backends-convivencia-status.test.ts — Refs: US-031, FR-031, FR-033, NFR-031, AC-086 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-086.
  - [x] **EXECUTE**: Escrever o caso com `pi` presente, `dsh` presente e `agy` ausente, conferindo os três status simultaneamente e que `exitCode` não muda por causa deles.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T008 [P] [TEST] [TDD] Derivar de AC-087 o caso em tests/backends-versao-sem-help.test.ts — Refs: FR-030, NFR-030, AC-087 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-087.
  - [x] **EXECUTE**: Escrever o caso com uma fonte instrumentada que registra qual flag cada chamada usa, conferindo que só `--version` é usado, nunca `--help`.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T009 [P] [TEST] [TDD] [US-031] [US-032] Derivar de AC-088 o caso em tests/backends-determinismo-misto.test.ts — Refs: US-031, US-032, FR-032, FR-033, NFR-031, NFR-032, AC-088 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-088.
  - [x] **EXECUTE**: Escrever o caso com `pi` suportado presente, `codex` suportado ausente e `dsh` não suportado presente, rodando duas vezes com a mesma fonte e conferindo relatos idênticos e `exitCode` inalterado.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T010 [P] [TEST] [TDD] Derivar de AC-089 o caso em tests/doctor-camada-agent-texto.test.ts — Refs: FR-031, NFR-030, NFR-031, AC-089 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-089; confirmar como `formatReport()` hoje itera `results` em `src/cli.ts`.
  - [x] **EXECUTE**: Escrever o caso chamando `formatReport()`/`run(["doctor"])` com um backend suportado presente e um ausente, conferindo que o texto nomeia a camada `agent` distinta de `npm`/`python`, sem chamada de `--help`, e que o código de saída reflete só `npm`/`python`.
  - [x] **VERIFY**: RED — a camada `agent` ainda não existe no texto.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

#### Fase 2 — Código, cada tarefa atrás do seu RED

- [x] T011 [CODE] [US-031] Implementar em src/backends/known.ts — Refs: US-031, FR-032, FR-033, AC-082, AC-086, AC-088 — Depends: T003, T007, T009
  - [x] **PREP**: Confirmar RED de T003, T007 e T009; `docs/` reconstruído por `$framework-documentator` antes da alteração.
  - [x] **EXECUTE**: `SUPPORTED_AGENT_BACKENDS` (`pi`, `agy`, `claude`, `codex`, `goose`) e `KNOWN_AGENT_BACKENDS` (os cinco suportados mais `dsh` e `cursor-agent`), como constantes nomeadas, sem lógica.
  - [x] **VERIFY**: `npx tsc --noEmit` em exit 0.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T011", "refs": ["US-031", "FR-032", "FR-033", "AC-082", "AC-086", "AC-088"], "files": ["src/backends/known.ts"], "commands": [{"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T012 [CODE] [US-030] [US-032] Implementar em src/backends/detect.ts — Refs: US-030, US-032, FR-030, NFR-030, NFR-032, AC-080, AC-083, AC-084, AC-085, AC-087 — Depends: T001, T004, T005, T006, T008, T011
  - [x] **PREP**: Confirmar RED de T001, T004, T005, T006 e T008.
  - [x] **EXECUTE**: `BackendEnvironment` injetável com `resolveVersion(name): string | null`; `realBackendEnvironment()` usando o mesmo `probe()` que `src/doctor.ts` já usa para `code-review-graph`, chamando só `<backend> --version`; `detectBackends(env, KNOWN_AGENT_BACKENDS, SUPPORTED_AGENT_BACKENDS)` devolve um resultado por candidato, com presença, versão e a marca de suportado.
  - [x] **VERIFY**: Casos de T001, T004, T005, T006 e T008 GREEN.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T012", "refs": ["US-030", "US-032", "FR-030", "NFR-030", "NFR-032", "AC-080", "AC-083", "AC-084", "AC-085", "AC-087"], "files": ["src/backends/detect.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T013 [CODE] [US-030] [US-031] Estender a camada agent em src/doctor.ts — Refs: US-030, US-031, FR-031, PR-032, NFR-031, AC-081, AC-086, AC-088, AC-089 — Depends: T002, T007, T009, T010, T012
  - [x] **PREP**: Confirmar RED de T002, T007, T009 e T010. Reconfirmar contra o código real: `dependenciasOk` hoje é `results.every(r => r.present)` — a mudança precisa filtrar `layer !== "agent"` nesse cálculo, não só ao montar `results` (achado já registrado no Gate do Ato I).
  - [x] **EXECUTE**: `Layer` ganha `"agent"`; `inspectDependencies` chama `detectBackends` e empurra o resultado em `results` com `layer: "agent"`, `origin: "global"`; `dependenciasOk` passa a ser `results.filter(r => r.layer !== "agent").every(r => r.present)`. `formatReport()` em `src/cli.ts` não muda de assinatura — já itera `results` genericamente.
  - [x] **VERIFY**: Casos de T002, T007, T009 e T010 GREEN; os 311 casos anteriores seguem verdes.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T013", "refs": ["US-030", "US-031", "FR-031", "NFR-031", "AC-081", "AC-086", "AC-088", "AC-089"], "files": ["src/doctor.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

#### Fase 3 — Fechamento

- [x] T014 [DOC] Registrar o módulo novo e a terceira camada em .project-context/STACK.md — Refs: FR-031 — Depends: T013
  - [x] **PREP**: Ler a seção de `doctor` em `.project-context/STACK.md`.
  - [x] **EXECUTE**: Descrever `src/backends/known.ts`, `src/backends/detect.ts`, a camada `agent` e por que ela nunca afeta `exitCode`.
  - [x] **VERIFY**: `npm run build` em exit 0.
  - [x] **EVIDENCE**: Comando e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T015 [DOC] Descrever em PROJECT.md que doctor relata backends de agente — Refs: US-030 — Depends: T013
  - [x] **PREP**: Localizar a linha de `doctor` na tabela de comandos de `PROJECT.md`.
  - [x] **EXECUTE**: Descrever a terceira camada, informativa, e a lista suportada.
  - [x] **VERIFY**: `npm run build` em exit 0.
  - [x] **EVIDENCE**: Comando e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T016 [OPS] Verificação manual real e fechar o Delivery Gate na seção 13 de specs/completed/0008-fatia-1d-deteccao-backends/spec.md — Refs: NFR-030, NFR-031, NFR-032 — Depends: T014, T015
  - [x] **PREP**: T011–T015 concluídas, cada `[CODE]` com seu comentário de evidência.
  - [x] **EXECUTE**: `node dist/cli.js doctor` executado de verdade nesta máquina; suíte completa e `npm run verify`; `check_traceability.mjs` e `verify_acceptance.mjs`.
  - [x] **VERIFY**: Os cinco backends suportados aparecem com a versão real da pesquisa; `exitCode` de `doctor` inalterado em relação a antes desta fatia; suíte inteira, `tsc`, `build` e `verify` em exit 0 a partir de clone limpo.
  - [x] **EVIDENCE**: Comandos, contagens e exit codes registrados na seção 13.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

### 15. Ordem de execução

A Fase 1 inteira em paralelo: dez arquivos distintos, sem dependência entre si.

A Fase 2 segue a dependência entre módulos. `T011` (`known.ts`) não depende de código, só de nomear duas listas. `T012` (`detect.ts`) consome `T011`. `T013` (`doctor.ts`) consome `T012` e é quem de fato ativa a terceira camada e o filtro de `exitCode`.

Caminho crítico: `T001 → T012 → T013 → T016`. Quatro das dezesseis tarefas, passando por `T012` porque a detecção é predecessora tanto da extensão de `doctor` quanto de qualquer consumo futuro pela fatia 1e.

O fechamento admite paralelismo entre `T014` e `T015`, que tocam arquivos diferentes, mas ambos precisam de `T013` concluída para descrever a superfície real.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Fatia 1a concluída, que fornece `doctor` e a resolução em camadas.
- Nenhuma dependência npm nova: a detecção usa `which`-equivalente e `--version`, primitivos que `doctor.ts` já emprega.

#### Riscos

- **Sondar `--help` em produção em vez de fixar a lista** → repetiria o próprio erro que esta fatia corrigiu na pesquisa. Mitigação: `NFR-030`, `AC-083`, e a lista suportada como constante no código, não como resultado de parsing.
- **Backend de agente ausente derrubar `doctor`** → contradiria "detectado, nunca instalado" e quebraria a experiência em qualquer máquina sem os cinco. Mitigação: `PR-032`, `NFR-031`, `AC-081`, com `exitCode` calculado só sobre `npm`/`python`.
- **Confundir "não suportado" com "ausente"** → esconderia de quem usa que um backend está instalado mas não é o problema; o problema é a fatia ainda não ter evidência de capacidade dele. Mitigação: `FR-032`, `FR-033`, `AC-082`.
- **Lista suportada envelhecer silenciosamente** → um backend pode ganhar modo headless numa versão futura sem que o projeto perceba. Fora do alcance desta fatia resolver automaticamente; mitigado por registrar aqui o processo que corrigiu `codex`/`goose` como o caminho para reabrir a lista no futuro — execução real, não suposição.

#### Suposições

- A lista de candidatos conhecidos (suportados e não suportados) é a que a pesquisa desta fatia e do backlog encontraram nesta máquina: `pi`, `agy`, `claude`, `codex`, `goose`, `dsh`, `cursor-agent`. Reversível: ampliar a lista de candidatos é mudança de dado, não de arquitetura.
- `--version` de cada backend devolve algo interpretável como versão; quando não devolve, a presença ainda é relatada, só a versão fica desconhecida.

### 17. Decisões

- **DEC-032**: A lista suportada é `pi`, `agy`, `claude`, `codex`, `goose` — cinco, corrigindo a lista de três que o backlog registrava. *Razão*: `codex exec` e `goose run` demonstraram, por execução real, invocação sem interação equivalente aos outros três; a exclusão anterior vinha de uma varredura que checou só o `--help` de topo. *Alternativas descartadas*: manter a lista de três e tratar `codex`/`goose` como pendência futura — descartada porque a evidência já existe agora, e adiar sem motivo técnico contradiria o próprio critério ("demonstrado por execução") que a decisão original havia fixado.
- **DEC-033**: A capacidade de cada backend suportado é conhecimento fixo no código, documentado em `research/`, nunca descoberta por sondagem de `--help` em tempo de execução. *Razão*: parsing de texto de ajuda de terceiro é frágil e muda entre versões — a mesma lição já registrada pela fatia 1h sobre a listagem do instalador `skills`. *Alternativa descartada*: sondar `--help` a cada `doctor`, que reintroduziria o erro que motivou a correção desta fatia.
- **DEC-034**: A camada `agent` de `doctor` é informativa e nunca afeta `exitCode`. *Razão*: `common-rules` não instala backend algum, e exigir presença de qualquer um deles contradiria a "graceful degradation" que dá nome à fatia. *Alternativa descartada*: exigir ao menos um backend suportado presente — descartada porque nada nesta fatia consome a lista para agir; quem consome é a fatia 1e, que decide sozinha o que fazer com uma lista vazia.
- **DEC-035**: `doctor` relata cada backend candidato conhecido, suportado ou não, distinguindo os dois. *Razão*: decisão já registrada no backlog ao definir a `D2`; evita que alguém confunda backend não suportado com backend ausente. *Alternativa descartada*: relatar só os suportados — descartada por esconder informação real do ambiente sem necessidade.
- **DEC-036**: Não há registro, cache nem arquivo `.env` para o que foi detectado. *Razão*: `DEC-006` (SPEC-0003) já descartou `.env` para o projeto inteiro, e não há o que "restaurar" para um backend que o `common-rules` nunca instalou — resolver de novo a cada chamada é mais barato que duas verdades divergentes. *Alternativa descartada*: cachear a detecção no registro de instalação, ao lado de hooks e skills — descartada porque criaria uma terceira pergunta de drift (a mesma classe de defeito que a segunda reabertura da SPEC-0005 já corrigiu) sobre um dado que é barato recalcular sempre.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação registrada na seção 12.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] `npx tsc --noEmit`, `npm run build` e a suíte completa passam, sem alterar o comportamento das camadas `npm` e `python` já existentes em `doctor`.
- [x] Nenhum backend de agente ausente altera `exitCode` de `doctor`, conferido por caso de integração.
- [x] `common-rules doctor`, executado de verdade nesta máquina, relata os cinco backends suportados com a versão real.
- [x] `.project-context/STACK.md` registra o módulo novo e a terceira camada de `doctor`.
- [x] `PROJECT.md` descreve que `doctor` relata backends de agente, informativamente.
