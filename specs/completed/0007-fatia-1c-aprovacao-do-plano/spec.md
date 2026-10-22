# Especificação integrada: Fatia 1c: aprovacao do plano, interativa e por JSON

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0007 |
| Slug | 0007-fatia-1c-aprovacao-do-plano |
| Status | Complete |
| Effort | 5 |
| Effort updated at | 2026-08-29 |
| Effort rationale | O plano a aprovar já existe, mas o comando não lê entrada alguma hoje e é inteiramente síncrono, com 232 casos dependendo disso. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — a entrega acontece dentro de um comando de terminal, em texto, sem tela. |
| Atualizada em | 2026-08-29 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O `setup` decide o que escrever e escreve, na mesma execução. Quem o roda descobre o que ele fez lendo o relato depois, e o único jeito de olhar antes é lembrar de pedir um ensaio.

Isso é aceitável enquanto o que se escreve são sete hooks conhecidos. Deixa de ser quando as fatias seguintes acrescentarem orquestração: a decisão registrada desde a captura original é que o Orchestrator apresenta um plano, a pessoa revisa, recebe a recomendação de modelo e aprova antes de qualquer execução.

Há duas restrições concretas na superfície atual. O comando não lê entrada alguma — a varredura por `stdin`, `readline` e `isTTY` não devolve ocorrência — e o despacho é síncrono, com 232 casos dependendo dessa forma. E há ambientes sem pessoa: em integração contínua ninguém responde a uma pergunta no terminal.

**Reabertura — 2026-08-30.** A entrega original implementou `src/approval/context.ts`, `render.ts` e `decide.ts` por completo, e `runSetup` já consulta a decisão antes de escrever — mas `src/cli.ts` nunca chegou a fornecer `opts.approval` real. O gap foi registrado explicitamente no próprio Delivery Gate original ("o wiring do comando fica para tarefa futura"), no mesmo padrão exato que `skills` teve antes da fatia 1h ser reaberta. Corrigido o gap de `skills`, a pessoa responsável pediu o mesmo tratamento para este. Nenhuma FR muda: `FR-060` a `FR-065` já exigiam exatamente este comportamento em produção — só a última linha, ligar `src/cli.ts`, nunca foi escrita.

#### Resultado desejado

O `setup` mostra o que fará e só faz depois de receber aprovação.

Ao fim da fatia, o comando apresenta o plano, detecta se há alguém no terminal e, quando há, pergunta; quando não há, lê a decisão de um documento JSON pela entrada padrão. Recusa, ausência de resposta e entrada malformada são tratadas como negativa, e nada é escrito.

O plano apresentado é o mesmo que será executado, e não uma descrição paralela que possa divergir dele.

#### Métricas de sucesso

- Nenhuma escrita ocorre antes de uma aprovação.
- O plano apresentado descreve exatamente o que a execução aprovada escreve.
- Com terminal, a pergunta é feita; sem terminal, a decisão vem da entrada padrão.
- Recusa, ausência e entrada malformada resultam em nenhuma escrita.
- Nenhum caso da suíte depende de um terminal real.
- Quando não há o que fazer, aprovação alguma é pedida.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-060** [critical] O comando de terminal não lê entrada e é síncrono, e o plano a aprovar já existe — Verdict: verified — Confidence: high — Evidence: research/superficie-do-cli/sincronia-e-entrada.md#observação — Budget: 1/1.

A varredura por `stdin`, `readline`, `prompt`, `question` e `isTTY` em `src/` não devolve ocorrência. `run(args)` devolve `CommandOutcome` diretamente, sem promessa, e os comandos registrados não recebem argumentos. Ao mesmo tempo, `runSetup` já aceita `dryRun` e devolve `planned`, com nome, destino e evento de cada hook, sem efeito colateral.

#### Fontes e contexto consultados

- `src/cli.ts` e `src/setup/run.ts`, pela superfície real.
- `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md`, fatia 1c e decisões de 2026-08-29.
- `specs/inbox/2026-08-24-191840-refatoracao-para-typescript-com-orchestrator-self-aware-e-approval-workflow.md`, pela formulação original.
- `specs/completed/0002-phase-1a-esqueleto-typescript/spec.md`, pelo padrão de injeção de ambiente.
- `specs/completed/0006-fatia-1g-telemetria-trace-id/spec.md`, pelo padrão de injeção de relógio e gerador.

#### Documentação consultada

Nenhuma documentação externa. As observações são do próprio código.

#### Artefatos de pesquisa armazenados

- `specs/completed/0007-fatia-1c-aprovacao-do-plano/research/superficie-do-cli/sincronia-e-entrada.md` — a ausência de entrada, a sincronia do despacho, o plano que já existe e a consequência para o desenho.

#### Dúvidas respondidas

- **Q**: Qual plano é aprovado, se o Orchestrator ainda não existe? → **A**: O do `setup`, que já é produzido por `dryRun` sem efeito colateral. As fatias seguintes passam seus planos pelo mesmo canal.
- **Q**: Como distinguir terminal de execução automatizada? → **A**: Pela presença de terminal na entrada padrão, e a detecção é injetável como tudo que depende do ambiente.
- **Q**: A aprovação em lote de comandos entra aqui? → **A**: Não. A decisão de 2026-08-29 a separou como fatia 1i, por ser configuração permanente e não decisão por execução.
- **Q**: O despacho vira assíncrono? → **A**: Não. `R-060` mostra que isso alcançaria os 232 casos existentes, e a injeção da fonte de decisão resolve sem essa mudança.

#### Dúvidas abertas

Nenhuma que bloqueie esta fatia.

### 3. Escopo e atores

#### Incluído

- Apresentação do plano antes de qualquer escrita.
- Detecção do contexto: terminal com pessoa, ou entrada canalizada.
- Pergunta no terminal, e leitura de decisão em JSON pela entrada padrão fora dele.
- Tratamento de recusa, ausência de decisão e entrada malformada como negativa.
- Fonte de decisão injetável, com implementações reais como padrão.
- Ausência de pergunta quando não há o que fazer.

#### Fora de escopo

- Aprovação em lote de comandos das dependências, que é a fatia 1i.
- Recomendação de modelo, que é a fatia 1e.
- Planos de orquestração, que dependem das fatias 1d e 1e.
- Tornar o despacho do comando assíncrono.
- Persistir a decisão entre execuções.
- Interface gráfica ou qualquer tela.

#### Atores

- **Quem executa no terminal**: vê o plano e responde.
- **Integração contínua**: fornece a decisão por documento, sem pessoa presente.
- **As fatias 1d, 1e e 1i**: herdam o canal de aprovação sem recriá-lo.

### 4. Princípios e restrições do projeto

- **PR-060**: Nada é escrito antes de aprovação. Na dúvida, não escreve.
- **PR-061**: Ausência de resposta é negativa, nunca consentimento.
- **PR-062**: O plano apresentado é o que será executado, e não uma descrição paralela.
- **PR-063**: O despacho permanece síncrono. A fonte da decisão é injetada, como o ambiente, o executor e o relógio já são.

### 5. Histórias de usuário

#### US-060 — Ver antes que aconteça

Como **quem executa o comando**, quero **ver o plano e aprová-lo antes de qualquer escrita**, para **não descobrir o que foi feito lendo o relato depois**.

**Por que P1**: É a razão da fatia, e a decisão registrada desde a captura original.
**Teste independente**: O plano é apresentado; sem aprovação nada é escrito; com aprovação, o que se escreve corresponde ao plano apresentado.
**Requisitos**: FR-060, FR-061, FR-063

#### US-061 — Aprovar onde não há ninguém

Como **integração contínua**, quero **fornecer a decisão por documento**, para **que o comando funcione sem pessoa no terminal**.

**Por que P1**: Sem isso o comando trava em ambiente automatizado, ou pior, escreve sem aprovação.
**Teste independente**: Com entrada canalizada, a decisão é lida de JSON; recusa, ausência e documento malformado resultam em nenhuma escrita.
**Requisitos**: FR-061, FR-062, FR-064

#### US-062 — Não perguntar à toa

Como **quem executa o comando**, quero **não ser interrompido quando não há o que decidir**, para **que a aprovação signifique alguma coisa quando aparecer**.

**Por que P1**: Pergunta que sempre aparece deixa de ser lida, e a aprovação vira ritual.
**Teste independente**: Sem alvo detectado ou sem mudança a fazer, aprovação alguma é pedida; e a fonte injetada mantém os casos previsíveis.
**Requisitos**: FR-060, FR-063, FR-065

### 6. Cenários BDD de aceite

#### AC-060 — O plano é apresentado antes de escrever

**Cobre**: US-060, FR-060, FR-063, FR-065

```gherkin
@US-060 @FR-060 @FR-063 @FR-065 @AC-060
Feature: Apresentação do plano

  Scenario: O plano chega a quem decide antes de qualquer escrita
    Given um projeto com evidência de uso do alvo
    When o setup é executado com uma fonte de decisão injetada
    Then a fonte recebe o plano antes de o comando escrever
    And o plano descreve cada hook com seu destino e evento
```

#### AC-061 — Sem aprovação, nada é escrito

**Cobre**: US-060, FR-060, NFR-060

```gherkin
@US-060 @FR-060 @NFR-060 @AC-061
Feature: Recusa preserva o projeto

  Scenario: A negativa impede a escrita
    Given um projeto com evidência de uso do alvo
    When a decisão recebida é negativa
    Then nenhum arquivo é criado ou alterado
    And o relato informa que nada foi escrito por falta de aprovação
```

#### AC-062 — Aprovação libera a escrita

**Cobre**: US-060, FR-060, NFR-062

```gherkin
@US-060 @FR-060 @NFR-062 @AC-062
Feature: Aprovação executa o plano

  Scenario: O que se escreve é o que foi apresentado
    Given um plano apresentado e aprovado
    When o setup conclui
    Then os hooks escritos correspondem aos do plano apresentado
    And o registro de instalação existe
```

#### AC-063 — O terminal é reconhecido

**Cobre**: US-060, FR-061

```gherkin
@US-060 @FR-061 @AC-063
Feature: Contexto interativo

  Scenario: Havendo terminal, a pergunta é feita
    Given um ambiente que declara terminal na entrada padrão
    When o setup precisa de aprovação
    Then o canal escolhido é o interativo
```

#### AC-064 — A entrada canalizada é reconhecida

**Cobre**: US-061, FR-061

```gherkin
@US-061 @FR-061 @AC-064
Feature: Contexto automatizado

  Scenario: Sem terminal, a decisão vem do documento
    Given um ambiente sem terminal na entrada padrão
    When o setup precisa de aprovação
    Then o canal escolhido é o de documento
```

#### AC-065 — Documento aprovando

**Cobre**: US-061, FR-062

```gherkin
@US-061 @FR-062 @AC-065
Feature: Aprovação por documento

  Scenario: O documento autoriza a execução
    Given um documento JSON que aprova o plano
    When o setup o lê pela entrada padrão
    Then a execução ocorre
    And os arquivos previstos existem
```

#### AC-066 — Documento recusando

**Cobre**: US-061, FR-062, FR-064

```gherkin
@US-061 @FR-062 @FR-064 @AC-066
Feature: Recusa por documento

  Scenario: O documento nega a execução
    Given um documento JSON que recusa o plano
    When o setup o lê
    Then nenhum arquivo é criado
    And o relato informa a recusa
```

#### AC-067 — Documento malformado é negativa

**Cobre**: US-061, FR-062, FR-064, NFR-060

```gherkin
@US-061 @FR-062 @FR-064 @NFR-060 @AC-067
Feature: Entrada inválida

  Scenario: Texto que não é JSON válido não aprova
    Given uma entrada padrão com conteúdo que não é JSON válido
    When o setup tenta ler a decisão
    Then a decisão é tratada como negativa
    And nenhum arquivo é criado
```

#### AC-068 — Ausência de decisão é negativa

**Cobre**: US-061, FR-064, NFR-060

```gherkin
@US-061 @FR-064 @NFR-060 @AC-068
Feature: Silêncio não aprova

  Scenario: Entrada vazia não autoriza
    Given uma entrada padrão vazia
    When o setup tenta ler a decisão
    Then a decisão é tratada como negativa
    And nenhum arquivo é criado
```

#### AC-069 — As duas apresentações descrevem o mesmo

**Cobre**: US-062, FR-063, NFR-062

```gherkin
@US-062 @FR-063 @NFR-062 @AC-069
Feature: Formas equivalentes

  Scenario: Texto e documento contam a mesma história
    Given um mesmo plano
    When ele é apresentado em forma legível e em documento
    Then os hooks nomeados coincidem nos dois
    And os destinos e eventos coincidem nos dois
```

#### AC-070 — O plano corresponde ao que se escreve

**Cobre**: US-060, NFR-062

```gherkin
@US-060 @NFR-062 @AC-070
Feature: Plano fiel

  Scenario: Nada é escrito fora do que o plano previa
    Given um plano apresentado e aprovado
    When o setup conclui
    Then cada arquivo escrito corresponde a um item do plano
    And nenhum item do plano ficou por escrever
```

#### AC-071 — A fonte injetada torna o caso previsível

**Cobre**: US-062, FR-065, NFR-061

```gherkin
@US-062 @FR-065 @NFR-061 @AC-071
Feature: Fonte injetável

  Scenario: A decisão vem de onde o caso mandar
    Given uma fonte de decisão injetada que sempre aprova
    When o setup é executado duas vezes sobre projetos distintos
    Then as duas execuções escrevem
    And nenhuma delas consulta o terminal real
```

#### AC-072 — Sem injeção, as implementações reais decidem

**Cobre**: US-062, FR-061, FR-065, NFR-061

```gherkin
@US-062 @FR-061 @FR-065 @NFR-061 @AC-072
Feature: Padrão de produção

  Scenario: A ausência de injeção não aprova por omissão
    Given o setup chamado sem fonte de decisão injetada
    When o contexto é avaliado
    Then a escolha do canal considera a presença de terminal
    And o comportamento padrão não é aprovar
```

#### AC-073 — Sem mudança, não se pergunta

**Cobre**: US-062, FR-060, FR-063

```gherkin
@US-062 @FR-060 @FR-063 @AC-073
Feature: Aprovação apenas quando há o que decidir

  Scenario: Projeto já configurado não pede aprovação
    Given um projeto já configurado pelo mesmo conjunto e versão
    When o setup é executado de novo
    Then aprovação alguma é pedida
    And o relato informa que já estava configurado
```

#### AC-074 — Sem alvo, não se pergunta

**Cobre**: US-062, FR-060, NFR-061

```gherkin
@US-062 @FR-060 @NFR-061 @AC-074
Feature: Alvo ausente

  Scenario: Sem evidência de uso do alvo, nada é decidido
    Given um projeto sem evidência de uso do alvo
    When o setup é executado
    Then aprovação alguma é pedida
    And o relato informa que o alvo foi ignorado
```

#### AC-075 — O comando real, sem canal injetado, aprova e escreve

**Cobre**: US-060, FR-060, FR-065

```gherkin
@US-060 @FR-060 @FR-065 @AC-075
Feature: Aprovação real de ponta a ponta

  Scenario: common-rules setup roda sem terminal, com documento aprovando
    Given um projeto com evidência de uso do alvo, e nada instalado ainda
    When o common-rules setup roda de verdade, sem canal nem fonte injetados, recebendo {"approved":true} pela entrada padrão
    Then os hooks são escritos em .claude/settings.json
    And o relato não contém "não escrito"
```

#### AC-076 — O comando real, sem canal injetado, recusa e não escreve

**Cobre**: US-061, FR-060, FR-064

```gherkin
@US-061 @FR-060 @FR-064 @AC-076
Feature: Recusa real de ponta a ponta

  Scenario: common-rules setup roda sem terminal, sem documento algum
    Given um projeto com evidência de uso do alvo, e nada instalado ainda
    When o common-rules setup roda de verdade, sem canal nem fonte injetados, com a entrada padrão vazia
    Then nenhum arquivo é escrito
    And o relato contém "não escrito"
    And o código de saída é diferente de zero
```

### 7. Requisitos

#### Funcionais

- **FR-060**: O `setup` deve apresentar o plano e obter aprovação antes de qualquer escrita, e não deve pedir aprovação quando não houver o que escrever. O comando de terminal, `src/cli.ts`, fornece o contexto real a toda execução — não basta o mecanismo existir testável por injeção na biblioteca; o comando de produção precisa efetivamente consultá-lo.
- **FR-061**: O canal de aprovação deve ser escolhido pela presença de terminal na entrada padrão: interativo quando houver, documento quando não houver.
- **FR-062**: No canal de documento, a decisão deve ser lida de um JSON pela entrada padrão.
- **FR-063**: O plano deve ser apresentado em forma legível no canal interativo e em documento no canal automatizado, descrevendo cada item com nome, destino e evento.
- **FR-064**: Recusa, ausência de decisão e entrada malformada devem ser tratadas como negativa, sem escrita, com o motivo relatado.
- **FR-065**: A fonte da decisão deve ser injetável, com as implementações reais usadas quando nada for injetado.

#### Não funcionais

- **NFR-060**: **Nada antes da aprovação**. Nenhum arquivo é criado ou alterado antes de uma decisão positiva. **Verificação**: comparação da árvore do projeto antes e depois nos caminhos de recusa, ausência e entrada inválida.
- **NFR-061**: **Determinismo**. Nenhum caso depende de terminal real nem de entrada padrão real. **Verificação**: inspeção de que os casos injetam contexto e decisão, e execução repetida da suíte.
- **NFR-062**: **Fidelidade do plano**. O que se escreve corresponde item a item ao que foi apresentado. **Verificação**: comparação entre o plano apresentado e os arquivos escritos, nas duas formas de apresentação.

#### Erros e casos-limite

- Entrada padrão vazia → negativa, sem escrita.
- Entrada com JSON válido mas sem o campo de decisão → negativa, sem escrita.
- Entrada com JSON válido e decisão diferente de aprovação → negativa, sem escrita.
- Texto que não é JSON → negativa, com o motivo relatado.
- Alvo não detectado → relatar alvo ignorado, sem pedir aprovação.
- Projeto já configurado pelo mesmo conjunto e versão → relatar sem pedir aprovação.
- Fonte injetada que lança → tratar como negativa, sem escrita.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- `run(args)` devolve `CommandOutcome` sem promessa, e os comandos registrados não recebem argumentos.
- `runSetup` aceita `dryRun` e devolve `planned`, com nome, destino e evento por hook, sem efeito colateral.
- Ambiente, executor de instalador, relógio e gerador já são injetados por interface, com implementações reais como padrão.
- A suíte tem 70 arquivos e 232 casos.

#### Arquitetura e módulos

| Módulo | Responsabilidade | Arquivo |
| --- | --- | --- |
| Contexto | Decidir o canal pela presença de terminal | `src/approval/context.ts` |
| Apresentação | Renderizar o plano em texto legível e em documento | `src/approval/render.ts` |
| Decisão | Obter a decisão pelo canal escolhido, tratando negativa e falha | `src/approval/decide.ts` |

O contexto vive separado porque é a única consulta ao ambiente e precisa ser substituível sem tocar no resto. A apresentação é separada da decisão para que as duas formas sejam comparáveis entre si sem envolver leitura de entrada.

#### Migrations

Não aplicável.

#### Models

O plano submetido é a lista `planned` que `runSetup` já produz. A decisão é um resultado discriminado entre aprovada, recusada e indisponível, com o motivo nas duas últimas.

#### Controllers e casos de uso

`runSetup` passa a consultar a decisão depois das duas saídas antecipadas que já existem — alvo não detectado e configuração já feita — e antes de qualquer escrita. Consultar antes dessas saídas pediria aprovação mesmo quando `AC-073` e `AC-074` exigem silêncio, porque `planned` já está montado nesse ponto mas nada será escrito. `src/cli.ts` fornece a implementação real, escolhida pelo contexto.

`formatSetup()`, em `src/cli.ts`, passa a fornecer `approval: {}` a `runSetup` — objeto vazio, e não vários campos individuais: `context`, `source` e `stdin` já têm cada um seu próprio padrão real dentro de `resolveChannel` e `realSource`, e listar de novo aqui duplicaria a decisão de qual é a implementação real em dois lugares. Só o comando de terminal recebe essa ligação; o servidor MCP (`src/mcp/tool.ts`) segue sem `approval`, porque ler `stdin` de verdade dentro de um processo MCP colidiria com o protocolo JSON-RPC que já usa `stdin`/`stdout` como transporte — gate de escrita para o MCP é pergunta de outra fatia, não desta.

#### Views e experiência

Não aplicável. A seção 10 registra a ausência de interface.

#### Queries e repositórios

Não aplicável.

#### Jobs e processamento assíncrono

Não aplicável. O despacho permanece síncrono, conforme `R-060`.

#### Estrutura de arquivos

```text
src/approval/
  context.ts
  render.ts
  decide.ts
tests/
  aprovacao-fixtures.ts
  aprovacao-plano-apresentado.test.ts
  aprovacao-recusa-preserva.test.ts
  aprovacao-libera-escrita.test.ts
  aprovacao-contexto-terminal.test.ts
  aprovacao-contexto-canalizado.test.ts
  aprovacao-documento-aprova.test.ts
  aprovacao-documento-recusa.test.ts
  aprovacao-documento-malformado.test.ts
  aprovacao-entrada-vazia.test.ts
  aprovacao-formas-equivalentes.test.ts
  aprovacao-plano-fiel.test.ts
  aprovacao-fonte-injetada.test.ts
  aprovacao-padrao-producao.test.ts
  aprovacao-sem-mudanca.test.ts
  aprovacao-sem-alvo.test.ts
  cli-approval-real.test.ts        (novo — subprocesso real, sem canal injetado)
```

### 9. Modelo de dados

Não aplicável. A fatia não persiste informação: a decisão vale para a execução corrente e nada dela é gravado. O registro de instalação permanece como as fatias anteriores o definiram.

### 10. Interfaces e contratos

#### Interface para pessoas

**Não há interface para pessoas.** A entrega acontece num comando de terminal, em texto. Há interação, mas não há tela: quem responde lê linhas e digita uma resposta.

#### APIs expostas

Nenhuma. A fatia amplia o comportamento de `setup`.

#### APIs externas utilizadas

Nenhuma. A entrada padrão é recurso do próprio processo.

#### Documentação das APIs consultadas

Não aplicável.

#### Eventos e outros contratos

O documento de decisão é um JSON com um campo booleano de aprovação. Ausência do campo, valor diferente de aprovação, documento inválido e entrada vazia são todos negativa.

### 11. Estratégia TDD

- **Unidade**: escolha do canal, renderização nas duas formas e interpretação da decisão, todas com entrada em memória.
- **Integração**: `setup` sobre projetos descartáveis, com contexto e decisão injetados, conferindo o disco.
- **Fidelidade**: comparação entre o plano apresentado e os arquivos escritos.
- **Ponta a ponta real**: `cli-approval-real.test.ts` roda `dist/cli.js setup` de verdade, sem canal nem fonte injetados, alimentando a entrada padrão do subprocesso — documento aprovando, documento vazio. É a categoria que faltava nesta fatia: toda a suíte anterior prova a lógica de decisão, e nenhum caso prova que `src/cli.ts` de fato a consulta.
- **Runner**: Vitest, pelo script `test:tdd`.
- **Verificação manual**: `common-rules setup` executado de verdade num projeto descartável, aprovando e recusando pela entrada padrão.

O ponto sensível é que esta fatia introduz um caminho em que **não** escrever é o comportamento correto. Casos que apenas conferem que os arquivos certos apareceram passariam sobre uma implementação que ignora a recusa. Por isso `AC-061`, `AC-067` e `AC-068` comparam a árvore do projeto antes e depois, e afirmam sobre a ausência de escrita, e não sobre a presença de um relato. O mesmo vale para o caso real: `AC-076` confere ausência de arquivo, não apenas presença de mensagem de erro.

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Comando de verificação | Evidência |
| --- | --- | --- | --- | --- |
| FR-060 | AC-060 | Integração | plano apresentado antes da escrita | **Passed** — aprovacao-plano-apresentado, T019 |
| FR-060 | AC-061 | Integração | recusa não escreve | **Passed** — aprovacao-recusa-preserva, T019 |
| FR-060 | AC-062 | Integração | aprovação escreve | **Passed** — aprovacao-libera-escrita, T017 |
| FR-060 | AC-073 | Integração | sem mudança não pergunta | **Passed** — aprovacao-sem-mudanca, T019 |
| FR-060 | AC-074 | Integração | sem alvo não pergunta | **Passed** — aprovacao-sem-alvo, T019 |
| FR-061 | AC-063 | Unidade | terminal escolhe interativo | **Passed** — aprovacao-contexto-terminal, T016 |
| FR-061 | AC-064 | Unidade | sem terminal escolhe documento | **Passed** — aprovacao-contexto-canalizado, T016 |
| FR-061 | AC-072 | Unidade | padrão considera o terminal | **Passed** — aprovacao-padrao-producao, T016 |
| FR-062 | AC-065 | Integração | documento aprova | **Passed** — aprovacao-documento-aprova, T019 |
| FR-062 | AC-066 | Integração | documento recusa | **Passed** — aprovacao-documento-recusa, T019 |
| FR-062 | AC-067 | Unidade | documento inválido | **Passed** — aprovacao-documento-malformado, T019 |
| FR-063 | AC-060 | Integração | plano descreve os itens | **Passed** — aprovacao-plano-apresentado, T019 |
| FR-063 | AC-069 | Unidade | formas equivalentes | **Passed** — aprovacao-formas-equivalentes, T017 |
| FR-063 | AC-073 | Integração | nada a apresentar | **Passed** — aprovacao-sem-mudanca, T019 |
| FR-064 | AC-066 | Integração | recusa relatada | **Passed** — aprovacao-documento-recusa, T019 |
| FR-064 | AC-067 | Unidade | inválido é negativa | **Passed** — aprovacao-documento-malformado, T019 |
| FR-064 | AC-068 | Unidade | vazio é negativa | **Passed** — aprovacao-entrada-vazia, T019 |
| FR-065 | AC-060 | Integração | fonte injetada recebe o plano | **Passed** — aprovacao-plano-apresentado, T019 |
| FR-065 | AC-071 | Integração | fonte injetada decide | **Passed** — aprovacao-fonte-injetada, T019 |
| FR-065 | AC-072 | Unidade | real quando ausente | **Passed** — aprovacao-padrao-producao, T016 |
| NFR-060 | AC-061 | Integração | árvore intacta na recusa | **Passed** — aprovacao-recusa-preserva, T019 |
| NFR-060 | AC-067 | Integração | árvore intacta no inválido | **Passed** — aprovacao-documento-malformado, T019 |
| NFR-060 | AC-068 | Integração | árvore intacta no vazio | **Passed** — aprovacao-entrada-vazia, T019 |
| NFR-061 | AC-071 | Integração | sem terminal real | **Passed** — aprovacao-fonte-injetada, T019 |
| NFR-061 | AC-072 | Unidade | contexto injetado | **Passed** — aprovacao-padrao-producao, T016 |
| NFR-061 | AC-074 | Integração | sem alvo, previsível | **Passed** — aprovacao-sem-alvo, T019 |
| NFR-062 | AC-062 | Integração | escrito igual ao planejado | **Passed** — aprovacao-libera-escrita, T017 |
| NFR-062 | AC-069 | Unidade | formas coincidem | **Passed** — aprovacao-formas-equivalentes, T017 |
| NFR-062 | AC-070 | Integração | item a item | **Passed** — aprovacao-plano-fiel, T019 |
| FR-060 | AC-075 | Ponta a ponta real | setup real aprovado escreve | **Passed** — cli-approval-real, T024/T025 |
| FR-060 | AC-076 | Ponta a ponta real | setup real recusado não escreve | **Passed** — cli-approval-real, T024/T025 |
| FR-064 | AC-076 | Ponta a ponta real | entrada vazia real é negativa | **Passed** — cli-approval-real, T024/T025 |
| FR-065 | AC-075 | Ponta a ponta real | sem canal nem fonte injetados, real decide | **Passed** — cli-approval-real, T024/T025 |
| NFR-060 | AC-076 | Ponta a ponta real | nada escrito na recusa real | **Passed** — cli-approval-real, T024/T025 |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-08-29), reconfirmado no aceite final em 2026-08-29
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/completed/0007-fatia-1c-aprovacao-do-plano/spec.md`
- **Cobertura**: 3 US, 6 FR, 3 NFR, 15 AC, 6 DEC; mínimo de 3 AC por ID satisfeito nos doze. Identificadores de 060 a 074.
- **Research**: `load_research.mjs` em `PASSED`, com `R-060` verificado e um artefato indexado.

**Achados da rodada de definição**

| ID | Achado | Severidade | Estado |
| --- | --- | --- | --- |
| D1 | A seção 8 dizia que a decisão é consultada "depois de montar o plano", ambíguo em relação às duas saídas antecipadas já existentes em `runSetup` | WARNING | Resolvido — a seção 8 nomeou as duas saídas pelo nome que já têm no código |
| D2 | Lente `SEC`: o documento de decisão é lido de entrada não confiável em contexto automatizado | NOTE | Aceito — sem risco de poluição de protótipo sem merge subsequente, e `FR-064` já cobre entrada malformada |
| D3 | Verificado por execução: `process.stdin.isTTY` é `undefined` em ambiente headless, tratado igual a `false` | NOTE | Aceito |

**Achados do aceite final**

| ID | Achado | Severidade | Estado |
| --- | --- | --- | --- |
| A1 | O caso-limite normativo da seção 7 — "JSON válido mas sem o campo de decisão" — não tinha teste algum. `AC-067` cobria texto que não é JSON e JSON sem forma de objeto, mas não objeto válido sem `approved` | BLOCKER | Resolvido — Delivery Gate reaberto, `T023` acrescentada. O comportamento já estava correto por inspeção da lógica; o teste passou GREEN de imediato, provando a garantia em vez de só documentá-la |
| A2 | `check_traceability` acusa marcadores órfãos das cinco specs anteriores | NOTE | Aceito — limitação conhecida |

**Sobre A1, e a diferença em relação ao achado equivalente da SPEC-0006.** Lá, o caso-limite sem teste escondia um bug real: o código gravava o campo vazio quando deveria omiti-lo. Aqui, o código já se comportava corretamente — `approved === true` sobre `undefined` já resolve para `false` — e a lacuna era só de cobertura. Registrar isso não é formalidade: sem o teste, uma refatoração futura de `decide.ts` não teria como saber que este caso precisa continuar negativo, e o comportamento correto de hoje se tornaria acidente amanhã. A causa de origem é a mesma das duas fatias: a seção 7 lista casos-limite sem cenário `AC` próprio, e a matriz da seção 12 cobre apenas o que tem cenário.

**Terceira ocorrência do mesmo padrão estrutural.** SPEC-0006 e SPEC-0007 tiveram, cada uma, um caso-limite normativo da seção 7 sem teste correspondente, achado apenas no aceite. A correção durável — a matriz alcançar também os casos-limite, e não só os `AC` — segue registrada como pendência que nenhuma das duas resolveu, porque resolvê-la reabriria o próprio processo em vez da entrega.

#### Gate do Ato II — Plano

- **Resultado**: Passed (2026-08-29)
- **Comando**: `node .claude/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/completed/0007-fatia-1c-aprovacao-do-plano/spec.md`
- **Plano**: 22 tarefas — 15 `[TEST] [TDD]`, 4 `[CODE]`, 2 `[DOC]`, 1 `[OPS]`; 110 itens de checklist; 27 de 27 IDs cobertos.
- **Correção durante o planejamento**: `T017` tinha só dois predecessores TDD rastreáveis. Acrescentei `T003` (`AC-062`) como terceiro, por exercitar o fluxo completo de renderização, decisão e escrita.
- **RED**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes. 47 casos marcados com `TRACEABILITY`, cobrindo os quinze `AC`.
- **Rastreabilidade**: 27 de 27 identificadores desta fatia cobertos.

**Quatro falsos-verdes corrigidos durante a materialização do RED.** Como `runSetup` hoje ignora qualquer opção desconhecida e escreve incondicionalmente, quatro asserções passavam sem exercitar coisa alguma: elas conferiam o resultado de uma escrita que já acontecia antes desta fatia existir, e não se a aprovação foi de fato consultada.

- `AC-062` (`aprovacao-libera-escrita`) conferia apenas que a escrita ocorreu, o que já era verdade sem qualquer gating. Acrescentei asserção de que a fonte foi consultada.
- `AC-065` (`aprovacao-documento-aprova`) conferia o resultado da escrita, sem provar que o documento foi lido. Acrescentei um contador de chamadas ao leitor.
- `AC-073` e `AC-074` (`aprovacao-sem-mudanca`, `aprovacao-sem-alvo`) usavam uma fonte que lançaria se fosse chamada e afirmavam `.not.toThrow()` — o que também passa trivialmente se a aprovação nunca existir. Acrescentei um caso de controle em cada arquivo, provando que a mesma fonte lança de fato quando o cenário não é o de supressão, o que fecha a lacuna de um mecanismo inexistente parecer funcionar.

Nenhum desses quatro apareceria como falha se eu tivesse aceitado o RED superficial. É a mesma disciplina que a SPEC-0006 registrou sobre asserção que confirma a forma do valor em vez do conteúdo, agora do lado da ausência de comportamento em vez do lado do valor congelado.

**Nada precede o RED**: não há dependência nova a instalar.

#### Gate do Ato III — Entrega

- **Resultado**: Passed (2026-08-29)
- **Verificação**: `npm run test:tdd` em exit 0, com **284 casos em 86 arquivos**; `npx tsc --noEmit` e `npm run build` em exit 0; `npm run verify` em exit 0 a partir de clone limpo, em 6s contra orçamento de 300; diretório pessoal com 42 entradas antes e depois.
- **Auditorias**: `verify_acceptance` em `QA: PASSED`; `verify_evidence` em `PASSED (strict)`; `load_research` em `PASSED`; `check_traceability` com `--full-chain` sem cadeia quebrada; `build_documentation --check` em exit 0; monitor de contexto em `CURRENT`.
- **Confinamento da garantia**: os três caminhos de negativa — recusa, entrada vazia, documento malformado — foram conferidos por comparação da árvore antes e depois, e não pela leitura do relato, para que uma implementação que escrevesse e relatasse negativa ao mesmo tempo não passasse despercebida.

**Quatro falsos-verdes corrigidos no plano, e reincidiram no fechamento como controles a ajustar.** Os dois testes de controle acrescentados para `AC-073` e `AC-074` esperavam que uma fonte que lança propagasse a exceção; o desenho correto de `interpret()` — exigido por `FR-064` — captura qualquer exceção da fonte e a trata como negativa, então a exceção nunca escapa. Os controles foram reescritos para conferir o `exitCode`, e não a propagação.

**Gap de wiring registrado, não escondido.** `src/cli.ts` ainda não passa `approval` real ao chamar `runSetup`, no mesmo padrão do gap que `skills` já tinha antes da fatia 1h. A garantia desta fatia vale hoje na biblioteca; o comando `common-rules setup` em produção ainda não gate a escrita por aprovação. Registrado em `.project-context/STACK.md` e `PROJECT.md`, e não apresentado como concluído ponta a ponta.

**Rastreabilidade com ressalva conhecida.** 27 de 27 identificadores desta fatia cobertos. `check_traceability` acusa 84 marcadores órfãos, todos das cinco specs anteriores — a colisão de identificadores continua sendo o único item vermelho do repositório.

#### Gate do Ato II — Plano da reabertura 2026-08-30

- **Resultado**: Passed
- **Comando**: `node .agents/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/completed/0007-fatia-1c-aprovacao-do-plano/spec.md --allow-draft`
- **Plano**: 5 tarefas novas (T024–T028) — 1 `[TEST] [TDD]`, 2 `[CODE]`/`[TEST]` de wiring, 1 `[DOC]`, 1 `[OPS]`; 28 tarefas no total, 29 IDs próprios cobertos.
- **RED**: `T024` observou RED real no segundo caso — entrada padrão vazia contra `dist/cli.js setup` real não impedia escrita alguma, porque `approval` nunca era consultado em produção. O primeiro caso (aprovação) já passava mesmo sem a correção, confirmando que a lacuna estava exclusivamente na ausência do gate, não na escrita em si.
- **Ajuste no ciclo de validação**: `T025`, desenhada inicialmente com um único predecessor `[TEST] [TDD]` (`T024`), precisou de três — acrescentados `T002` (`AC-061`, recusa preserva) e `T013` (`AC-072`, real quando ausente), duas tarefas já concluídas que exercitam exatamente o comportamento que `T025` ativa em produção.

#### Gate do Ato III — Entrega da reabertura 2026-08-30

- **Resultado**: Passed
- **Verificação**: `npm run test:tdd` em exit 0, com **306 casos em 97 arquivos** (era 284/86 no fechamento anterior); `npx tsc --noEmit` e `npm run build` em exit 0; `npm run verify` em exit 0 a partir de clone limpo (install 5s, build 1s, test 18s, total 24s).
- **Auditorias**: `check_traceability.mjs` em 29/29 IDs próprios cobertos; `verify_acceptance.mjs` em `QA: PASSED`.
- **Verificação manual real**: `node dist/cli.js setup`, num projeto descartável, com `{"approved":true}` pela entrada padrão — hooks, skills das duas origens e o framework former project tool escritos, código de saída zero; a mesma execução com entrada padrão vazia — nada escrito, relato `não escrito: recusado`, código de saída 1.
- **Efeito colateral corrigido**: `tests/cli-setup-real.test.ts` (SPEC-0005) parou de provar instalação real assim que `approval` passou a gate a escrita — sua chamada ao `dist/cli.js setup` não alimentava a entrada padrão, o que agora é lido como documento vazio. `T026` corrigiu passando `input: JSON.stringify({approved:true})`; é o único teste pré-existente que a reabertura tocou, de 306.
- **Documentação**: `docs/` reconstruído por `$framework-documentator`, `--check` em exit 0, monitor de contexto em `CURRENT`; `.project-context/STACK.md` e `PROJECT.md` deixaram de descrever o wiring como pendência e passaram a descrever o comportamento real.

#### Suposições

- O documento de decisão traz um campo booleano de aprovação. Reversível se um formato mais rico vier a ser exigido pelas fatias seguintes.
- A escolha do canal olha a presença de terminal na entrada padrão. Reversível se um sinal explícito for preferido.
- A fonte da decisão é injetada por parâmetro opcional em `runSetup`, no padrão de `bridgeEnv`, `skills` e `trace`.
- O despacho do comando permanece síncrono.

#### Decisões abertas

Nenhuma que bloqueie esta fatia.

### 14. Tarefas

Formato:
`- [ ] TNNN [P?] [TIPO] [US-NNN?] Ação com caminho — Refs: IDs — Depends: IDs|none`

Checklist obrigatório por tarefa, na ordem `PREP`, `EXECUTE`, `VERIFY`, `EVIDENCE`, `IMPROVE`.

#### Fase 1 — RED, um caso por cenário da seção 6

Quinze tarefas, uma por `AC`, cada uma em arquivo próprio de `tests/`. Nenhuma dependência entre elas, por isso executam em paralelo. Não há dependência nova a instalar.

- [x] T001 [P] [TEST] [TDD] [US-060] Derivar de AC-060 o caso em tests/aprovacao-plano-apresentado.test.ts — Refs: US-060, FR-060, FR-063, FR-065, AC-060 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-060 e fixar o critério: a fonte injetada recebe o plano com nome, destino e evento de cada hook antes de qualquer escrita.
  - [x] **EXECUTE**: Escrever o caso em `tests/aprovacao-plano-apresentado.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e contexto ou fonte de decisão injetados.
  - [x] **VERIFY**: RED observado — três arquivos reprovam por `Cannot find module` sobre `src/approval/context` e `src/approval/render`, e os demais reprovam em asserção porque `runSetup` ainda ignora a opção `approval` e escreve incondicionalmente.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes; 47 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Conferir o conteúdo do plano recebido pela fonte, e não apenas que ela foi chamada, para que o caso prove fidelidade e não só invocação.

- [x] T002 [P] [TEST] [TDD] [US-060] Derivar de AC-061 o caso em tests/aprovacao-recusa-preserva.test.ts — Refs: US-060, FR-060, NFR-060, AC-061 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-061 e fixar o critério: uma decisão negativa não produz escrita alguma, e o relato informa a falta de aprovação.
  - [x] **EXECUTE**: Escrever o caso em `tests/aprovacao-recusa-preserva.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e contexto ou fonte de decisão injetados.
  - [x] **VERIFY**: RED observado — três arquivos reprovam por `Cannot find module` sobre `src/approval/context` e `src/approval/render`, e os demais reprovam em asserção porque `runSetup` ainda ignora a opção `approval` e escreve incondicionalmente.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes; 47 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Comparar a árvore do projeto antes e depois, porque conferir apenas o relato deixaria passar uma implementação que escreve e relata negativa ao mesmo tempo.

- [x] T003 [P] [TEST] [TDD] [US-060] Derivar de AC-062 o caso em tests/aprovacao-libera-escrita.test.ts — Refs: US-060, FR-060, NFR-062, AC-062 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-062 e fixar o critério: aprovação positiva libera a escrita e o registro passa a existir.
  - [x] **EXECUTE**: Escrever o caso em `tests/aprovacao-libera-escrita.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e contexto ou fonte de decisão injetados.
  - [x] **VERIFY**: RED observado — três arquivos reprovam por `Cannot find module` sobre `src/approval/context` e `src/approval/render`, e os demais reprovam em asserção porque `runSetup` ainda ignora a opção `approval` e escreve incondicionalmente.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes; 47 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Conferir hooks escritos e registro juntos, porque a aprovação vale para a execução inteira.

- [x] T004 [P] [TEST] [TDD] [US-060] Derivar de AC-063 o caso em tests/aprovacao-contexto-terminal.test.ts — Refs: US-060, FR-061, AC-063 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-063 e fixar o critério: com terminal declarado na entrada padrão, o canal escolhido é o interativo.
  - [x] **EXECUTE**: Escrever o caso em `tests/aprovacao-contexto-terminal.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e contexto ou fonte de decisão injetados.
  - [x] **VERIFY**: RED observado — três arquivos reprovam por `Cannot find module` sobre `src/approval/context` e `src/approval/render`, e os demais reprovam em asserção porque `runSetup` ainda ignora a opção `approval` e escreve incondicionalmente.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes; 47 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Injetar o contexto em vez de depender do ambiente real de execução do teste, que pode variar entre CI e máquina local.

- [x] T005 [P] [TEST] [TDD] [US-061] Derivar de AC-064 o caso em tests/aprovacao-contexto-canalizado.test.ts — Refs: US-061, FR-061, AC-064 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-064 e fixar o critério: sem terminal na entrada padrão, o canal escolhido é o de documento.
  - [x] **EXECUTE**: Escrever o caso em `tests/aprovacao-contexto-canalizado.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e contexto ou fonte de decisão injetados.
  - [x] **VERIFY**: RED observado — três arquivos reprovam por `Cannot find module` sobre `src/approval/context` e `src/approval/render`, e os demais reprovam em asserção porque `runSetup` ainda ignora a opção `approval` e escreve incondicionalmente.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes; 47 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Injetar a ausência de terminal, pelo mesmo motivo do caso anterior.

- [x] T006 [P] [TEST] [TDD] [US-061] Derivar de AC-065 o caso em tests/aprovacao-documento-aprova.test.ts — Refs: US-061, FR-062, AC-065 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-065 e fixar o critério: um documento JSON aprovando o plano libera a execução e os arquivos previstos existem.
  - [x] **EXECUTE**: Escrever o caso em `tests/aprovacao-documento-aprova.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e contexto ou fonte de decisão injetados.
  - [x] **VERIFY**: RED observado — três arquivos reprovam por `Cannot find module` sobre `src/approval/context` e `src/approval/render`, e os demais reprovam em asserção porque `runSetup` ainda ignora a opção `approval` e escreve incondicionalmente.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes; 47 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Fornecer o documento como texto de entrada padrão simulada, e não como objeto já interpretado, para exercitar o parse de verdade.

- [x] T007 [P] [TEST] [TDD] [US-061] Derivar de AC-066 o caso em tests/aprovacao-documento-recusa.test.ts — Refs: US-061, FR-062, FR-064, AC-066 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-066 e fixar o critério: um documento JSON recusando o plano impede a escrita e o relato informa a recusa.
  - [x] **EXECUTE**: Escrever o caso em `tests/aprovacao-documento-recusa.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e contexto ou fonte de decisão injetados.
  - [x] **VERIFY**: RED observado — três arquivos reprovam por `Cannot find module` sobre `src/approval/context` e `src/approval/render`, e os demais reprovam em asserção porque `runSetup` ainda ignora a opção `approval` e escreve incondicionalmente.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes; 47 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Comparar a árvore antes e depois, pela mesma razão de T002.

- [x] T008 [P] [TEST] [TDD] [US-061] Derivar de AC-067 o caso em tests/aprovacao-documento-malformado.test.ts — Refs: US-061, FR-062, FR-064, NFR-060, AC-067 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-067 e fixar o critério: texto que não é JSON válido é tratado como negativa e nada é escrito.
  - [x] **EXECUTE**: Escrever o caso em `tests/aprovacao-documento-malformado.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e contexto ou fonte de decisão injetados.
  - [x] **VERIFY**: RED observado — três arquivos reprovam por `Cannot find module` sobre `src/approval/context` e `src/approval/render`, e os demais reprovam em asserção porque `runSetup` ainda ignora a opção `approval` e escreve incondicionalmente.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes; 47 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Usar texto claramente inválido como JSON, e não um objeto malformado por acidente, para que o caso prove o caminho de erro de verdade.

- [x] T009 [P] [TEST] [TDD] [US-061] Derivar de AC-068 o caso em tests/aprovacao-entrada-vazia.test.ts — Refs: US-061, FR-064, NFR-060, AC-068 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-068 e fixar o critério: entrada padrão vazia é tratada como negativa e nada é escrito.
  - [x] **EXECUTE**: Escrever o caso em `tests/aprovacao-entrada-vazia.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e contexto ou fonte de decisão injetados.
  - [x] **VERIFY**: RED observado — três arquivos reprovam por `Cannot find module` sobre `src/approval/context` e `src/approval/render`, e os demais reprovam em asserção porque `runSetup` ainda ignora a opção `approval` e escreve incondicionalmente.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes; 47 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Distinguir vazio de ausente, porque os dois podem ter tratamento de código diferente e a spec exige o mesmo resultado para ambos.

- [x] T010 [P] [TEST] [TDD] [US-062] Derivar de AC-069 o caso em tests/aprovacao-formas-equivalentes.test.ts — Refs: US-062, FR-063, NFR-062, AC-069 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-069 e fixar o critério: a forma legível e a forma em documento do mesmo plano nomeiam os mesmos hooks, destinos e eventos.
  - [x] **EXECUTE**: Escrever o caso em `tests/aprovacao-formas-equivalentes.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e contexto ou fonte de decisão injetados.
  - [x] **VERIFY**: RED observado — três arquivos reprovam por `Cannot find module` sobre `src/approval/context` e `src/approval/render`, e os demais reprovam em asserção porque `runSetup` ainda ignora a opção `approval` e escreve incondicionalmente.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes; 47 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Comparar as duas saídas de renderização entre si, e não cada uma contra um literal, para que a equivalência seja a garantia testada.

- [x] T011 [P] [TEST] [TDD] [US-060] Derivar de AC-070 o caso em tests/aprovacao-plano-fiel.test.ts — Refs: US-060, NFR-062, AC-070 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-070 e fixar o critério: cada arquivo escrito corresponde a um item do plano apresentado, sem sobra e sem falta.
  - [x] **EXECUTE**: Escrever o caso em `tests/aprovacao-plano-fiel.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e contexto ou fonte de decisão injetados.
  - [x] **VERIFY**: RED observado — três arquivos reprovam por `Cannot find module` sobre `src/approval/context` e `src/approval/render`, e os demais reprovam em asserção porque `runSetup` ainda ignora a opção `approval` e escreve incondicionalmente.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes; 47 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Comparar os dois conjuntos como conjuntos, não como listas ordenadas, porque a ordem de escrita não faz parte da garantia.

- [x] T012 [P] [TEST] [TDD] [US-062] Derivar de AC-071 o caso em tests/aprovacao-fonte-injetada.test.ts — Refs: US-062, FR-065, NFR-061, AC-071 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-071 e fixar o critério: uma fonte injetada que sempre aprova permite duas execuções sobre projetos distintos sem consultar terminal real.
  - [x] **EXECUTE**: Escrever o caso em `tests/aprovacao-fonte-injetada.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e contexto ou fonte de decisão injetados.
  - [x] **VERIFY**: RED observado — três arquivos reprovam por `Cannot find module` sobre `src/approval/context` e `src/approval/render`, e os demais reprovam em asserção porque `runSetup` ainda ignora a opção `approval` e escreve incondicionalmente.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes; 47 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Rodar duas vezes com fontes distintas por chamada, para que o caso prove que a injeção substitui a origem por completo, e não apenas na primeira chamada.

- [x] T013 [P] [TEST] [TDD] [US-062] Derivar de AC-072 o caso em tests/aprovacao-padrao-producao.test.ts — Refs: US-062, FR-061, FR-065, NFR-061, AC-072 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-072 e fixar o critério: sem fonte injetada, a escolha do canal considera o terminal real e o comportamento padrão não aprova por omissão.
  - [x] **EXECUTE**: Escrever o caso em `tests/aprovacao-padrao-producao.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e contexto ou fonte de decisão injetados.
  - [x] **VERIFY**: RED observado — três arquivos reprovam por `Cannot find module` sobre `src/approval/context` e `src/approval/render`, e os demais reprovam em asserção porque `runSetup` ainda ignora a opção `approval` e escreve incondicionalmente.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes; 47 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Sem injetar decisão, apenas contexto sem terminal, e conferir que a ausência de resposta na entrada padrão não libera escrita.

- [x] T014 [P] [TEST] [TDD] [US-062] Derivar de AC-073 o caso em tests/aprovacao-sem-mudanca.test.ts — Refs: US-062, FR-060, FR-063, AC-073 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-073 e fixar o critério: um projeto já configurado pelo mesmo conjunto e versão não recebe pedido de aprovação.
  - [x] **EXECUTE**: Escrever o caso em `tests/aprovacao-sem-mudanca.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e contexto ou fonte de decisão injetados.
  - [x] **VERIFY**: RED observado — três arquivos reprovam por `Cannot find module` sobre `src/approval/context` e `src/approval/render`, e os demais reprovam em asserção porque `runSetup` ainda ignora a opção `approval` e escreve incondicionalmente.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes; 47 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Injetar uma fonte que lançaria se fosse chamada, para que o caso prove ausência de chamada e não apenas ausência de escrita.

- [x] T015 [P] [TEST] [TDD] [US-062] Derivar de AC-074 o caso em tests/aprovacao-sem-alvo.test.ts — Refs: US-062, FR-060, NFR-061, AC-074 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-074 e fixar o critério: um projeto sem evidência de uso do alvo não recebe pedido de aprovação, e o relato informa o alvo ignorado.
  - [x] **EXECUTE**: Escrever o caso em `tests/aprovacao-sem-alvo.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e contexto ou fonte de decisão injetados.
  - [x] **VERIFY**: RED observado — três arquivos reprovam por `Cannot find module` sobre `src/approval/context` e `src/approval/render`, e os demais reprovam em asserção porque `runSetup` ainda ignora a opção `approval` e escreve incondicionalmente.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos e 26 casos em RED, e os 232 casos anteriores verdes; 47 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Mesma técnica de T014: fonte que lançaria se chamada, provando ausência de pedido.

#### Fase 2 — Código, cada tarefa atrás do seu RED

- [x] T016 [CODE] [US-062] Implementar em src/approval/context.ts — Refs: US-062, FR-061, FR-065, NFR-061, AC-063, AC-064, AC-072 — Depends: T004, T005, T013
  - [x] **PREP**: RED confirmado em T004, T005 e T013; `docs/` reconstruído por `$framework-documentator` antes da alteração.
  - [x] **EXECUTE**: `src/approval/context.ts` escolhe o canal pela presença de terminal na entrada padrão, tratando `undefined` como `false` sem caso especial.
  - [x] **VERIFY**: Os três casos passam a GREEN. `npx tsc --noEmit` em exit 0.
  - [x] **EVIDENCE**: Comandos e contagem registrados na seção 12.
  - [x] **IMPROVE**: `isTTY` indefinido e `isTTY` falso recebem o mesmo tratamento no código, documentado para que uma refatoração futura não trate `undefined` como caso especial sem necessidade.

  <!-- framework:evidence {"task": "T016", "refs": ["US-062", "FR-061", "FR-065", "NFR-061", "AC-063", "AC-064", "AC-072"], "files": ["src/approval/context.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T017 [CODE] [US-060] Implementar em src/approval/render.ts — Refs: US-060, US-062, FR-063, NFR-062, AC-060, AC-062, AC-069 — Depends: T001, T003, T010
  - [x] **PREP**: RED confirmado em T001, T003 e T010; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/approval/render.ts` deriva as duas formas — texto e documento — de um único percurso da lista `planned`, sem duplicar a extração dos campos.
  - [x] **VERIFY**: O caso de `AC-069` passa a GREEN.
  - [x] **EVIDENCE**: Comandos e contagem registrados na seção 12.
  - [x] **IMPROVE**: As duas formas vêm de uma função só, para que `AC-069` não possa falhar por deriva entre implementações separadas que extraem os mesmos campos duas vezes.

  <!-- framework:evidence {"task": "T017", "refs": ["US-060", "US-062", "FR-063", "NFR-062", "AC-060", "AC-062", "AC-069"], "files": ["src/approval/render.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T018 [CODE] [US-061] Implementar em src/approval/decide.ts — Refs: US-060, US-061, FR-062, FR-064, NFR-060, AC-065, AC-066, AC-067, AC-068 — Depends: T006, T007, T008, T009, T017
  - [x] **PREP**: RED confirmado em T006, T007, T008 e T009, com T017 em GREEN; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/approval/decide.ts` interpreta a decisão da fonte, tratando exceção, vazio, JSON inválido e ausência do campo esperado como negativa — nunca lança para fora de `interpret`.
  - [x] **VERIFY**: Os quatro casos passam a GREEN, exercitados por T019 (nenhum caso isolado de unidade para `decide.ts`, coberto via integração).
  - [x] **EVIDENCE**: Comandos e contagem registrados na seção 12.
  - [x] **IMPROVE**: O parse nunca lança para fora da função: falha de sintaxe e falha de valor semântico convergem para o mesmo resultado negativo, e uma fonte que lança é capturada do mesmo jeito — foi essa captura que corrigiu meus dois testes de controle, que esperavam exceção escapando quando o desenho correto é o oposto.

  <!-- framework:evidence {"task": "T018", "refs": ["US-060", "US-061", "FR-062", "FR-064", "NFR-060", "AC-065", "AC-066", "AC-067", "AC-068"], "files": ["src/approval/decide.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T019 [CODE] [US-060] Implementar em src/setup/run.ts — Refs: US-060, US-061, US-062, FR-060, FR-065, NFR-060, NFR-062, AC-061, AC-062, AC-070, AC-071, AC-073, AC-074 — Depends: T012, T014, T015, T016, T018
  - [x] **PREP**: RED confirmado em T012, T014 e T015, com T016 e T018 em GREEN; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: A consulta de aprovação entra depois das duas saídas antecipadas já existentes — alvo não detectado e configuração já feita — e antes de qualquer escrita, inclusive a instalação de skills. `opts.approval` é opcional na biblioteca, no mesmo padrão de `skills` e `bridgeEnv`: ausente, nada é consultado, preservando os 232 casos das cinco fatias anteriores que chamam `runSetup` sem esse campo.
  - [x] **VERIFY**: A suíte inteira fecha em 281 de 281 casos e 85 de 85 arquivos. `npm run build` em exit 0.
  - [x] **EVIDENCE**: Comandos, contagem e a comparação da árvore registrados na seção 12.
  - [x] **IMPROVE**: A consulta usa exatamente `planned`, sem transformação, para que `AC-070` não dependa de duas cópias do mesmo dado permanecerem sincronizadas. Registro de gap conhecido: `src/cli.ts` ainda não passa `approval` real ao chamar `runSetup` — o mesmo gap que `skills` já tinha antes desta fatia —, então o comando de terminal em produção ainda não gate a escrita por aprovação; a garantia desta fatia vale na biblioteca, e o wiring do comando fica para tarefa futura.

  <!-- framework:evidence {"task": "T019", "refs": ["US-060", "US-061", "US-062", "FR-060", "FR-065", "NFR-060", "NFR-062", "AC-061", "AC-062", "AC-070", "AC-071", "AC-073", "AC-074"], "files": ["src/setup/run.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T023 [TEST] [TDD] [US-061] Derivar do caso-limite de JSON sem o campo de decisão o teste em tests/aprovacao-documento-sem-campo.test.ts — Refs: US-061, FR-062, FR-064, NFR-060, AC-067 — Depends: T018
  - [x] **PREP**: A seção 7 lista 'entrada com JSON válido mas sem o campo de decisão → negativa, sem escrita' como caso-limite normativo. Nenhum caso o exercita: AC-067 cobre texto que não é JSON e JSON sem forma de objeto, mas não objeto válido sem o campo.
  - [x] **EXECUTE**: Escrever o caso conferindo que um documento `{}` — objeto JSON válido, sem `approved` — resulta em negativa, sem escrita, com o mesmo padrão de comparação de árvore dos demais casos de negativa.
  - [x] **VERIFY**: GREEN imediato — os três casos aprovam sem alteração de produção, confirmando que a lacuna era de cobertura e não de comportamento.
  - [x] **EVIDENCE**: `npx vitest run tests/aprovacao-documento-sem-campo.test.ts` com 3 de 3 aprovando. Registrado na seção 12.
  - [x] **IMPROVE**: O defeito é de cobertura, não de comportamento: a mesma classe de lacuna que a SPEC-0006 encontrou, mas aqui sem bug por trás. Isso não torna a lacuna inofensiva — a próxima refatoração de `decide.ts` não teria como saber que este caso precisa continuar negativo.

#### Fase 3 — Fechamento

- [x] T020 [DOC] Registrar os módulos novos em .project-context/STACK.md — Refs: FR-060 — Depends: T019
  - [x] **PREP**: Conferido o que mudou de estrutura: três arquivos em `src/approval/`.
  - [x] **EXECUTE**: `.project-context/STACK.md` ganhou a seção `Aprovação do plano`, com a responsabilidade de cada módulo e o registro explícito de que o `opts.approval` é opcional na biblioteca e ainda não é ligado por padrão em `src/cli.ts`.
  - [x] **VERIFY**: GREEN imediato — os três casos aprovam sem alteração de produção, confirmando que a lacuna era de cobertura e não de comportamento.
  - [x] **EVIDENCE**: `npx vitest run tests/aprovacao-documento-sem-campo.test.ts` com 3 de 3 aprovando. Registrado na seção 12.
  - [x] **IMPROVE**: Registrei o gap de wiring do CLI ao lado do gap análogo que `skills` já tinha, para que os dois apareçam juntos e não sejam descobertos separadamente.

- [x] T021 [DOC] Descrever em PROJECT.md que o setup pede aprovação antes de escrever — Refs: US-060 — Depends: T019
  - [x] **PREP**: Localizada a linha do `setup` na tabela de comandos.
  - [x] **EXECUTE**: Acrescentado parágrafo descrevendo que a biblioteca sabe apresentar o plano e aguardar aprovação, com os dois canais e o tratamento de negativa, e que o comando ainda não aciona isso por padrão.
  - [x] **VERIFY**: GREEN imediato — os três casos aprovam sem alteração de produção, confirmando que a lacuna era de cobertura e não de comportamento.
  - [x] **EVIDENCE**: `npx vitest run tests/aprovacao-documento-sem-campo.test.ts` com 3 de 3 aprovando. Registrado na seção 12.
  - [x] **IMPROVE**: Descrevi o gap de wiring explicitamente em vez de deixar a frase implicar que o comando já pede aprovação, o que seria falso.

- [x] T022 [OPS] Fechar o Delivery Gate na seção 13 de specs/completed/0007-fatia-1c-aprovacao-do-plano/spec.md — Refs: NFR-060, NFR-061, NFR-062 — Depends: T020, T021, T023
  - [x] **PREP**: Vinte e duas tarefas concluídas, cada `[CODE]` com seu comentário de evidência.
  - [x] **EXECUTE**: Suíte completa, `npm run verify`, e os auditores de aceite, evidência, rastreabilidade com `--full-chain` e research.
  - [x] **VERIFY**: 284 casos em 86 arquivos; `tsc` e `build` em exit 0; `verify` em exit 0 a partir de clone limpo, em 6s; diretório pessoal com 42 entradas antes e depois; nenhuma cadeia quebrada sob `--full-chain`.
  - [x] **EVIDENCE**: Comandos, contagens e exit codes registrados na seção 13.
  - [x] **IMPROVE**: `--full-chain` não acusou cadeia quebrada nesta fatia, ao contrário das três anteriores. Escrever as refs de evidência com os identificadores exatos das tarefas, e não por título, evitou o defeito recorrente.

#### Fase 4 — Reabertura 2026-08-30: ligar o comando real

- [x] T024 [TEST] [TDD] [US-060] Derivar de AC-075/AC-076 o caso de ponta a ponta real em tests/cli-approval-real.test.ts — Refs: US-060, US-061, FR-060, FR-064, FR-065, NFR-060, AC-075, AC-076 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-075 e AC-076; confirmar que hoje `formatSetup()` não fornece `approval` a `runSetup`, então qualquer entrada padrão — vazia ou não — produz o mesmo resultado: escrita sem consulta.
  - [x] **EXECUTE**: Escrever dois casos contra `dist/cli.js setup` real, sem `Executor` nem canal/fonte injetados, sobre projeto descartável com evidência de alvo: (1) entrada padrão `{"approved":true}` resulta em hooks escritos em `.claude/settings.json`; (2) entrada padrão vazia resulta em nenhum arquivo escrito, relato contendo "não escrito" e código de saída diferente de zero.
  - [x] **VERIFY**: RED no segundo caso — hoje a entrada vazia não impede escrita alguma, porque `approval` nunca é consultado; o primeiro caso já passaria mesmo sem a correção, o que confirma que a lacuna está na ausência do gate, não na escrita em si.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T025 [CODE] [US-060] Ligar approval real em src/cli.ts — Refs: US-060, US-061, FR-060, FR-064, FR-065, AC-075, AC-076 — Depends: T002, T003, T013, T024
  - [x] **PREP**: Confirmar RED de T024.
  - [x] **EXECUTE**: `formatSetup()` passa `approval: {}` a `runSetup` — objeto vazio: `context`, `source` e `stdin` já têm cada um sua implementação real por padrão dentro de `resolveChannel`/`realSource`, e listá-los aqui duplicaria essa decisão.
  - [x] **VERIFY**: Caso de T024 GREEN, com `dist/cli.js setup` real gatendo a escrita pela entrada padrão.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T025", "refs": ["US-060", "US-061", "FR-060", "FR-064", "FR-065", "AC-075", "AC-076"], "files": ["src/cli.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}, {"run": "npx vitest run tests/cli-approval-real.test.ts", "exit": 0}]} -->

- [x] T026 [TEST] Ajustar tests/cli-setup-real.test.ts para o gate real — Refs: FR-060 — Depends: T025
  - [x] **PREP**: `tests/cli-setup-real.test.ts` (SPEC-0005, AC-036/AC-038) roda `dist/cli.js setup` sem alimentar a entrada padrão; com `approval` ligado, isso agora é entrada vazia, que `T025` faz virar recusa — o teste pararia de provar o que provava, sem que a asserção em si mudasse de sentido.
  - [x] **EXECUTE**: Passar `input: JSON.stringify({ approved: true })` ao `spawnSync` desse teste, para que ele continue exercitando a instalação real das skills e do framework former project tool, e não a recusa.
  - [x] **VERIFY**: `tests/cli-setup-real.test.ts` volta a GREEN, com os mesmos quatro artefatos confirmados em disco.
  - [x] **EVIDENCE**: Comando e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T027 [DOC] Atualizar .project-context/STACK.md e PROJECT.md removendo o gap registrado — Refs: FR-060 — Depends: T025
  - [x] **PREP**: Localizar as duas menções ao gap de wiring do `approval` em `.project-context/STACK.md` e `PROJECT.md`.
  - [x] **EXECUTE**: Substituir a descrição de gap pendente pela descrição do comportamento real: `common-rules setup` consulta aprovação de verdade, com os dois canais.
  - [x] **VERIFY**: `npm run build` em exit 0.
  - [x] **EVIDENCE**: Comando e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T028 [OPS] Verificação manual real e fechar o Delivery Gate da reabertura na seção 13 de specs/completed/0007-fatia-1c-aprovacao-do-plano/spec.md — Refs: NFR-060, NFR-061, NFR-062 — Depends: T024, T025, T026, T027
  - [x] **PREP**: T024–T027 concluídas, cada `[CODE]` com seu comentário de evidência.
  - [x] **EXECUTE**: `node dist/cli.js setup` executado de verdade num projeto descartável, aprovando pela entrada padrão e, em execução separada, recusando; suíte completa e `npm run verify`.
  - [x] **VERIFY**: Suíte inteira em exit 0; `tsc` e `build` em exit 0; `verify` em exit 0 a partir de clone limpo; os dois caminhos reais (aprovado, recusado) inspecionados em disco.
  - [x] **EVIDENCE**: Comandos, contagens e exit codes registrados na seção 13.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

### 15. Ordem de execução

A Fase 1 inteira em paralelo: quinze arquivos distintos, sem dependência entre si. Não há dependência nova a instalar.

A Fase 2 segue a direção da dependência. `T016` é a única sem predecessor de código: a escolha do canal não conhece renderização nem decisão. `T017` depende só do formato do plano. `T018` consome `T017` para produzir a mesma forma que compara. `T019` consome as três.

Caminho crítico: `T001 → T017 → T018 → T019 → T020 → T022`. Seis das vinte e duas tarefas.

O fechamento admite paralelismo entre `T020` e `T021`, que tocam arquivos diferentes, mas ambos precisam de `T019` para descrever a superfície real.

**Reabertura 2026-08-30.** `T024` não tem predecessor de código — é RED contra o comando real, que já existe. `T025` a segue e é a única mudança de produção desta reabertura: uma linha em `src/cli.ts`. `T026` depende de `T025` porque só faz sentido ajustar `cli-setup-real.test.ts` depois que o gate passa a existir de fato. `T027` (documentação) roda em paralelo com `T026`, ambos dependendo só de `T025`. `T028` fecha.

Caminho crítico da reabertura: `T024 → T025 → T028`.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Fatia 1b concluída, que fornece o `setup`, o plano por ensaio e o registro.
- Fatia 1a concluída, que estabeleceu o padrão de injeção de ambiente.

#### Riscos

- **Escrever apesar da recusa** → é o defeito que a fatia existe para impedir, e casos que só conferem presença de arquivo não o pegariam. Mitigação: `NFR-060`, com `AC-061`, `AC-067` e `AC-068` comparando a árvore.
- **Aprovar por omissão** → entrada vazia ou malformada tratada como consentimento seria pior que não ter aprovação alguma. Mitigação: `FR-064` e `PR-061`, com três cenários.
- **Plano divergir do que se escreve** → a aprovação passaria a valer para outra coisa. Mitigação: `NFR-062`, com `AC-062`, `AC-069` e `AC-070`.
- **Travar em ambiente sem pessoa** → o comando ficaria esperando resposta que nunca vem. Mitigação: `FR-061` escolhe o canal pelo contexto, e `AC-064` o exercita.
- **Alcançar os 232 casos existentes** → tornar o despacho assíncrono os atingiria. Mitigação: `R-060` documenta a restrição, e `FR-065` resolve por injeção.
- **Pergunta que sempre aparece** → deixaria de ser lida, e a aprovação viraria ritual. Mitigação: `AC-073` e `AC-074`.

#### Suposições

Registradas na seção 13, todas reversíveis.

### 17. Decisões

- **DEC-060**: O plano submetido é o que `runSetup` já produz por ensaio. *Razão*: `R-060` mostra que ele existe, é produzido sem efeito colateral e descreve exatamente o que seria escrito. Inventar uma segunda descrição criaria a divergência que `NFR-062` proíbe.
- **DEC-061**: O canal é escolhido pela presença de terminal, e não por flag. *Razão*: a formulação original pede detecção de contexto, e uma flag exigiria que quem automatiza soubesse passá-la, transformando esquecimento em travamento.
- **DEC-062**: Ausência e invalidez são negativa. *Razão*: aprovação obtida por omissão é pior que ausência de aprovação, porque parece consentimento. Vale a mesma direção já adotada quando a raiz não pode ser confirmada, na SPEC-0004.
- **DEC-063**: A fonte da decisão é injetável, com implementações reais como padrão. *Razão*: é o padrão que ambiente, executor, relógio e gerador já seguem, e `R-060` mostra que a alternativa alcançaria os 232 casos existentes.
- **DEC-064**: Aprovação não é pedida quando não há o que escrever. *Razão*: pergunta que sempre aparece deixa de ser lida. A aprovação precisa significar alguma coisa quando aparecer.
- **DEC-065**: A decisão não é persistida. *Razão*: vale para a execução corrente. Persistir seria whitelist, que a decisão de 2026-08-29 separou como fatia 1i.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam, incluindo os novos `AC-075` e `AC-076`.
- [x] Todos os requisitos possuem evidência de verificação registrada na seção 12.
- [x] Todas as tarefas da seção 14 estão concluídas.
- [x] Os três caminhos de negativa foram conferidos por comparação da árvore do projeto, e não por leitura do relato.
- [x] Nenhum caso de unidade ou integração consulta terminal real ou entrada padrão real — a categoria de ponta a ponta real (`AC-075`, `AC-076`) alimenta a entrada padrão de um subprocesso real, não do processo de teste, e isso é o que ela existe para provar.
- [x] O despacho do comando permanece síncrono, e os 306 casos anteriores seguem passando.
- [x] `common-rules setup`, executado de ponta a ponta sobre um projeto descartável de verdade, sem canal nem fonte injetados: aprovado pela entrada padrão, escreve; recusado, não escreve nada e sai com código diferente de zero.
- [x] `.project-context/STACK.md` registra o wiring real, sem descrevê-lo mais como pendência.
- [x] `PROJECT.md` descreve que o `setup` pede aprovação antes de escrever, sem ressalva de gap.
