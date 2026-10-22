# Especificação integrada: Phase 1a: Esqueleto TypeScript executável com dependências resolvidas

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0002 |
| Slug | 0002-phase-1a-esqueleto-typescript |
| Status | Complete |
| Effort | 4 |
| Effort updated at | 2026-08-24 |
| Effort rationale | Volume pequeno de código, mas decide manifesto, módulo, build e runner — escolhas caras de reverter depois que as fatias seguintes se apoiarem nelas. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — a entrega é um pacote e um comando de terminal, sem tela. |
| Atualizada em | 2026-08-24 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A branch de trabalho nasceu com 119 arquivos, e nenhum deles é código. Não há manifesto, build, runner de testes nem ponto de entrada: a v1.0 não compila nem executa, porque ainda não existe.

Há um segundo problema, menos visível e mais caro. O plano da v1.0 tratava quatro ferramentas como dependências fixadas, e essa premissa nunca foi exercitada neste repositório. A verificação de 2026-08-24 mostrou que três dos quatro nomes estavam errados e que a categoria era uma só quando deveria ser duas: `framework` é `removed-project-integration`, `code-review-graph` sequer é pacote npm — é Python instalado por `uv` — e `pi` não é subsistema, é agente, intercambiável por desenho e pertencente a outra camada. Construir setup, orquestração e seleção de modelo sobre uma premissa não exercitada repetiria o erro que a Phase 0 encontrou no `.gitignore`, quando o conjunto que a fase prometia preservar não existia em git.

#### Resultado desejado

Um pacote mínimo que instala, compila, testa e executa, e que prova de forma executável que as três dependências do projeto são alcançáveis.

Ao fim desta fatia, `npm install` seguido de `npm run build` produz um binário `common-rules` que responde `--version`, e `common-rules doctor` reporta cada uma das três dependências do projeto, saindo com código diferente de zero quando alguma faltar. Nada além disso: sem setup, sem orquestração, sem aprovação, sem seleção de modelo.

O valor não é o comando `--version`. É ter chão firme e a premissa das dependências exercitada antes que qualquer capacidade se apoie nela.

#### Métricas de sucesso

- `npm ci` a partir de um clone limpo conclui sem erro.
- `npm run build` produz um ponto de entrada executável em `dist/`.
- `npm run test:tdd` executa a suíte Vitest e passa.
- `common-rules --version` imprime exatamente a versão declarada no manifesto.
- `common-rules doctor` reporta as três dependências do projeto e sai com zero quando todas estão presentes.
- `common-rules doctor` sai com código diferente de zero, nomeando a ausente, quando `code-review-graph` não está no PATH.
- As duas dependências npm estão fixadas em versão exata, sem faixa.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] As três dependências do projeto resolvem para os identificadores e as camadas registrados em DEC-002 — Verdict: verified — Confidence: high — Evidence: research/pi-dev/consulta.md#impacto-na-spec — Budget: 1/1.

O claim registrado é o fato de que a spec depende: `removed-project-integration` 0.10.2 e `context-mode` 1.0.169 na camada npm, `code-review-graph` 2.3.7 exigido do ambiente, e `pi` como agente da camada 3, sob o pacote `@earendil-works/pi-coding-agent`.

A mesma verificação **refutou** a premissa original do backlog, que tratava as quatro como dependências npm fixadas sob os nomes `framework`, `context-mode`, `pi.dev` e `code-review-graph`. Três desses nomes estavam errados, um não é pacote npm, e `pi` sequer é subsistema. DEC-002 registra a revisão.

#### Fontes e contexto consultados

- `npm view` contra o registro público em 2026-08-24, para cada nome candidato.
- `npm ls -g --depth=0` e `command -v` na máquina de desenvolvimento, para levantar o que está instalado.
- `https://pi.dev/`, consultada para resolver a identidade do agente `pi`.
- `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md`, backlog de origem.
- `specs/completed/0001-phase-0-preparacao-limpeza/spec.md`, pela lição sobre premissa não verificada.

#### Documentação consultada

- Página do Pi Coding Agent, `https://pi.dev/`, consultada em 2026-08-24. Extraído: pacote `@earendil-works/pi-coding-agent`, binário `pi`, modo print `-p` e saída estruturada `--mode json`. Nenhum trecho da página foi copiado.

#### Artefatos de pesquisa armazenados

- `specs/completed/0002-phase-1a-esqueleto-typescript/research/pi-dev/consulta.md` — consulta a `https://pi.dev/` em 2026-08-24, com proveniência, identidade do pacote, candidato descartado e impacto na spec. Nenhum trecho da página foi reproduzido: os identificadores foram confirmados de forma independente por `npm view`, cuja saída é o registro público.

#### Dúvidas respondidas

- **Q**: O `common-rules` deve instalar as ferramentas ou apenas usar o que o ambiente já tem? → **A**: Depende da camada. Agentes são detectados e nunca instalados. As três dependências do projeto seguem uma regra única: preferir a cópia local, aceitar a global, nunca instalar globalmente. A ponte que cria a cópia local é explícita e vive na fatia 1b.
- **Q**: `code-review-graph` é Python; dá para instalá-lo pelo `package.json`? → **A**: Dá, e foi verificado: `uv venv` seguido de `uv pip install code-review-graph==2.3.7` produz o binário funcional dentro do projeto, sem tocar em `~/.local/share/uv/tools/`. O ambiente resultante mede cerca de 262 MB, e por isso a cópia local é criada sob pedido, e não a cada `npm install`.
- **Q**: Por que não usar `postinstall` para isso? → **A**: Porque escreveria no ambiente global durante um `npm install`, seria desligado por `--ignore-scripts`, quebraria CI sem `uv` e faria este projeto ditar a versão de uma ferramenta compartilhada. Ver DEC-002.

- **Q**: Como fica o modelo de dependências, se `code-review-graph` é Python? → **A**: npm fixa as três que são npm; o setup exige `uv` para `code-review-graph` e falha quando ausente. Nesta fatia, apenas a verificação de alcance é implementada; a exigência no setup pertence à fatia 1b.
- **Q**: Qual pacote é o `pi.dev`? → **A**: `@earendil-works/pi-coding-agent`, versão 0.84.3, binário `pi`. `@mariozechner/pi` foi descartado: é um gerenciador de pods vLLM.
- **Q**: Qual runner de testes? → **A**: Vitest.
- **Q**: Qual o nome do pacote? → **A**: `@brunocalmon/common-rules`, com binário `common-rules`. O nome sem escopo está ocupado no npm por um pacote de expressões regulares abandonado desde 2023.
- **Q**: A Phase 1 cabe em uma spec? → **A**: Não. Foi fatiada em 1a a 1e; esta é a 1a.

#### Dúvidas abertas

Nenhuma que bloqueie esta fatia. A inclusão de `codex` na lista de backends suportados segue em aberto e pertence à fatia 1d.

### 3. Escopo e atores

#### Incluído

- Manifesto `package.json` com nome `@brunocalmon/common-rules`, binário `common-rules`, `type: module` e `engines.node`.
- Configuração TypeScript e build que produz um ponto de entrada executável em `dist/`.
- Vitest instalado e exposto pelo script `test:tdd`, exigido pelo contrato do framework em projeto Node.
- As duas dependências npm declaradas em versão exata: `removed-project-integration` e `context-mode`. Elas são subsistemas do produto, resolvidos de `node_modules`, e é daí que vem a garantia de versão.
- Comando `common-rules --version`, que imprime a versão do manifesto.
- Comando `common-rules doctor`, que reporta o alcance das três dependências do projeto e sai com código diferente de zero quando alguma falta.
- Script `verify`, que executa instalação, compilação e suíte em sequência, registra o tempo de cada etapa e permite que um clone recém-obtido fique verde com um comando.
- `.gitignore` cobrindo tudo que a instalação e o build geram e que não pertence ao repositório: `node_modules/`, `dist/` e o ambiente virtual Python local. O venv de `code-review-graph` mede cerca de 262 MB, de modo que versioná-lo por descuido seria um estrago difícil de desfazer.

#### Fora de escopo

- `setup`, em qualquer forma, CLI ou MCP. É a fatia 1b.
- Approval workflow. É a fatia 1c.
- Detecção de backends de agente — `pi`, `claude`, `cursor-agent`, `codex`, `agy`, `goose`, `dsh` e Ollama — e a lista de suportados. É a fatia 1d. Agentes nunca são instalados por esta ferramenta.
- Seleção de modelo. É a fatia 1e.
- Orquestração, subagentes, delegação, hooks, regras e skills próprias.
- Instalar `code-review-graph` ou `uv`. Esta fatia apenas verifica alcance; exigir instalação pertence ao setup.
- Publicar o pacote no npm.
- Substituir a main pela branch de trabalho.

#### Atores

- **Pessoa que desenvolve a v1.0**: instala, compila, executa a suíte e usa `doctor` para saber se o ambiente sustenta as fatias seguintes.
- **Fatias 1b a 1e**: herdam manifesto, build, runner e as dependências resolvidas, e não repetem essas decisões.
- **Pipeline de CI, quando existir**: executa `npm ci`, `build` e `test:tdd` sem interação.

### 4. Princípios e restrições do projeto

- **PR-001**: Esta fatia entrega chão, não capacidade. Qualquer comportamento de produto pertence a 1b ou adiante.
- **PR-002**: As dependências npm são fixadas em versão exata, sem faixa. Faixa reintroduz a divergência entre máquinas que o plano quer eliminar.
- **PR-003**: Nada é instalado globalmente por esta entrega. `code-review-graph` e `uv` são pré-requisitos do ambiente, verificados e nunca instalados.
- **PR-004**: A premissa das dependências é exercitada por comando, não por afirmação em documento.

### 5. Histórias de usuário

#### US-001 — Ter um pacote que instala, compila, testa e executa

Como **pessoa que desenvolve a v1.0**, quero **um pacote mínimo que passe por instalação, build, testes e execução**, para **construir as capacidades seguintes sobre chão verificado em vez de suposto**.

**Por que P1**: Bloqueia todas as fatias seguintes. Sem manifesto e build não há onde escrever código.
**Teste independente**: A partir de um clone limpo, `npm ci && npm run build && npm run test:tdd` conclui sem erro e `common-rules --version` imprime a versão do manifesto.
**Requisitos**: FR-001, FR-002, FR-003, FR-005

#### US-002 — Saber se o ambiente alcança as três dependências do projeto

Como **pessoa que desenvolve a v1.0**, quero **um comando que reporte o alcance de cada dependência**, para **descobrir uma ausência agora, e não no meio da orquestração**.

**Por que P1**: A Phase 0 mostrou o custo de construir sobre premissa não exercitada. Esta é a menor prova executável de que o plano se sustenta.
**Teste independente**: `common-rules doctor` lista as três dependências do projeto com veredito e origem resolvida, sai com zero num ambiente completo e com código diferente de zero nomeando a ausente quando `code-review-graph` não existe em nenhuma das duas origens.
**Requisitos**: FR-004, FR-006

### 6. Cenários BDD de aceite

#### AC-001 — Instalação limpa conclui

**Cobre**: US-001, FR-001, FR-003, FR-004, NFR-002

```gherkin
@US-001 @FR-001 @FR-003 @FR-004 @NFR-002 @AC-001
Feature: Instalação a partir de clone limpo

  Scenario: npm ci conclui sem erro
    Given um clone limpo da branch de trabalho
    When a pessoa executa a instalação de dependências
    Then a instalação conclui com código zero
    And as duas dependências npm aparecem em node_modules nas versões exatas declaradas
    And nenhuma dependência do manifesto declara faixa de versão
```

#### AC-002 — Build produz um executável

**Cobre**: US-001, FR-001, FR-002, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @NFR-001 @AC-002
Feature: Compilação do TypeScript

  Scenario: O build gera o ponto de entrada
    Given as dependências instaladas
    When a pessoa executa o build
    Then o build conclui com código zero
    And existe um ponto de entrada executável em dist/
    And esse arquivo é o alvo declarado pelo campo de binário do manifesto
```

#### AC-003 — A suíte executa pelo script exigido

**Cobre**: US-001, FR-003, NFR-001

```gherkin
@US-001 @FR-003 @NFR-001 @AC-003
Feature: Runner de testes

  Scenario: test:tdd executa a suíte Vitest
    Given o projeto instalado
    When a pessoa executa o script test:tdd
    Then o Vitest executa a suíte e conclui com código zero
    And o script test:tdd existe no manifesto, como o contrato do framework exige em projeto Node
```

#### AC-004 — `--version` imprime a versão do manifesto

**Cobre**: US-001, FR-001, FR-002, FR-005, NFR-003

```gherkin
@US-001 @FR-001 @FR-002 @FR-005 @NFR-003 @AC-004
Feature: Identificação da versão

  Scenario: O comando reporta a versão declarada
    Given o projeto compilado
    When a pessoa executa o binário com o argumento de versão
    Then a saída contém exatamente a versão declarada no manifesto
    And o comando sai com código zero
```

#### AC-005 — `doctor` aprova um ambiente completo

**Cobre**: US-002, FR-006, NFR-002, NFR-003

```gherkin
@US-002 @FR-006 @NFR-002 @NFR-003 @AC-005
Feature: Verificação de dependências

  Scenario: Ambiente completo é aprovado
    Given as duas dependências npm resolvíveis, local ou globalmente
    And code-review-graph alcançável em alguma das duas origens
    When a pessoa executa o comando doctor
    Then a saída lista as três dependências do projeto com veredito individual
    And cada dependência aparece com a camada, a origem resolvida e a versão encontrada
    And o comando sai com código zero
```

#### AC-006 — `doctor` reprova nomeando a ausente

**Cobre**: US-002, FR-006, FR-004

```gherkin
@US-002 @FR-006 @FR-004 @AC-006
Feature: Ausência de dependência

  Scenario: code-review-graph indisponível reprova a verificação
    Given as duas dependências npm resolvíveis
    And code-review-graph ausente tanto do projeto quanto do PATH
    When a pessoa executa o comando doctor
    Then a saída nomeia code-review-graph como ausente
    And explica que se trata de ferramenta Python instalada por uv, e não de pacote npm
    And o comando sai com código diferente de zero
```

#### AC-007 — Versões fixas, sem faixa

**Cobre**: US-001, FR-004, NFR-002

```gherkin
@US-001 @FR-004 @NFR-002 @AC-007
Feature: Fixação de versões

  Scenario: Nenhuma dependência aceita faixa
    Given o manifesto do projeto
    When a pessoa inspeciona as dependências declaradas
    Then cada versão é exata, sem prefixo de intervalo
    And as versões correspondem às verificadas em 2026-08-24
```

#### AC-008 — O pacote não exige instalação global

**Cobre**: US-001, US-002, FR-001, FR-002, FR-005, NFR-003

```gherkin
@US-001 @US-002 @FR-001 @FR-002 @FR-005 @NFR-003 @AC-008
Feature: Isolamento do ambiente

  Scenario: O binário roda sem instalar nada globalmente
    Given um clone limpo, instalado e compilado
    When a pessoa executa o binário pelo caminho local do projeto
    Then o comando responde sem exigir instalação global do próprio pacote
    And as duas dependências npm são resolvidas de node_modules e não do PATH global
```

#### AC-009 — Instalação, build e testes cabem no orçamento

**Cobre**: US-001, NFR-001, FR-002, FR-003

```gherkin
@US-001 @FR-002 @FR-003 @NFR-001 @AC-009
Feature: Orçamento de tempo do ciclo

  Scenario: O ciclo completo termina dentro do limite
    Given um clone limpo com cache de pacotes frio
    When a pessoa executa instalação, build e suíte em sequência
    Then o tempo total medido fica abaixo de cinco minutos
    And cada etapa conclui com código zero
```

#### AC-010 — O esqueleto não entrega capacidade de produto

**Cobre**: US-001, US-002, FR-005, FR-006

```gherkin
@US-001 @US-002 @FR-005 @FR-006 @AC-010
Feature: Limite do esqueleto

  Scenario: Apenas dois comandos existem
    Given o binário compilado
    When a pessoa lista os comandos disponíveis
    Then identificação de versão e verificação de dependências são oferecidas
    And nenhum comando de orquestração, aprovação ou seleção de modelo existe
```

#### AC-011 — Um clone recém-obtido fica verde com um comando

**Cobre**: US-001, FR-003, FR-007, NFR-001

```gherkin
@US-001 @FR-003 @FR-007 @NFR-001 @AC-011
Feature: Ciclo de verificação em clone novo

  Scenario: O script de ciclo deixa a suíte verde sem passo manual
    Given um clone recém-obtido, sem dependências instaladas e sem tempos registrados
    When a pessoa executa o script de verificação
    Then instalação, compilação e suíte concluem com código zero
    And o tempo de cada etapa fica registrado
    And a suíte inteira aprova, incluindo a asserção de orçamento
```

#### AC-012 — O ciclo registra as três etapas

**Cobre**: FR-007, NFR-001, US-001

```gherkin
@US-001 @FR-007 @NFR-001 @AC-012
Feature: Registro das etapas do ciclo

  Scenario: Cada etapa tem seu tempo medido em separado
    Given o script de verificação concluído
    When a pessoa inspeciona o registro de tempos
    Then existem medições distintas para instalação, compilação e suíte
    And a soma fica abaixo do orçamento declarado
```

#### AC-013 — O ciclo falha alto quando uma etapa reprova

**Cobre**: FR-007, NFR-001, US-001

```gherkin
@US-001 @FR-007 @NFR-001 @AC-013
Feature: Interrupção do ciclo

  Scenario: Uma etapa que reprova interrompe a sequência
    Given uma compilação que falha
    When a pessoa executa o script de verificação
    Then o script encerra com código diferente de zero
    And nomeia a etapa que reprovou
    And não prossegue para a etapa seguinte
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O projeto deve declarar um manifesto com nome `@brunocalmon/common-rules`, binário `common-rules`, módulo ESM e versão mínima de Node.
- **FR-002**: O projeto deve compilar TypeScript para um ponto de entrada executável em `dist/`, alvo do campo de binário.
- **FR-003**: O projeto deve expor o script `test:tdd` executando Vitest.
- **FR-004**: O projeto deve declarar as duas dependências npm de subsistema em versão exata, sem faixa.
- **FR-005**: O binário deve imprimir a versão declarada no manifesto quando invocado com o argumento de versão, saindo com zero.
- **FR-006**: O binário deve reportar, no comando `doctor`, o alcance de cada uma das três dependências do projeto e a origem que resolveu para cada uma, local ou global, saindo com zero quando todas estão presentes e com código diferente de zero quando alguma falta, nomeando-a.
- **FR-007**: O projeto deve expor um script que execute instalação, compilação e suíte em sequência e registre o tempo de cada etapa, de modo que um clone recém-obtido alcance a suíte verde sem passo manual.

#### Não funcionais

- **NFR-001**: **Tempo do ciclo**. Instalação com cache frio, build e suíte concluem em menos de cinco minutos somados. **Verificação**: medição do tempo decorrido das três etapas, registrada na seção 12.
- **NFR-002**: **Reprodutibilidade**. Nenhuma dependência declarada aceita faixa de versão, de modo que duas máquinas instalem o mesmo conteúdo. **Verificação**: inspeção programática do manifesto, falhando ao encontrar prefixo de intervalo.
- **NFR-003**: **Isolamento**. O pacote executa a partir do projeto, e os subsistemas npm são resolvidos de `node_modules`, não do PATH global. **Verificação**: execução do binário pelo caminho local em clone limpo.

#### Erros e casos-limite

- `code-review-graph` ausente do PATH → `doctor` reprova nomeando a ferramenta e explicando que vem de `uv`, não do npm. Não tentar instalar.
- Dependência do projeto ausente nas duas origens → `doctor` reprova nomeando o pacote e a camada, e aponta a ponte explícita da fatia 1b. Não instalar por conta própria, nem local nem globalmente.
- Versão resolvida divergente da declarada → `doctor` reporta a origem, a versão encontrada e a esperada, e reprova. Divergência silenciosa é o problema que a fixação existe para evitar, e ela é mais provável justamente quando a resolução caiu na cópia global.
- Node abaixo da versão mínima → o manifesto declara o requisito e a instalação avisa; o binário não tenta contornar.
- `dist/` ausente ao invocar o binário → mensagem indicando que o build não foi executado, em vez de erro de módulo não encontrado.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Branch `refactor/v1-cli-first`, com 119 arquivos versionados e nenhum de código: `specs/`, `.claude/`, `.project-context/` e o link `.agents`.
- Sem `package.json`, sem `.gitignore`, sem `dist/`, sem `node_modules/`.
- Node 22.23.1 e npm 10.9.8 na máquina de desenvolvimento; `uv` presente, com `code-review-graph` 2.3.7 instalado por ele.
- `.claude/scripts/phase0/` contém as sete asserções da Phase 0, em Node CommonJS. Elas continuam válidas e não são migradas por esta fatia.

#### Arquitetura e módulos

Três camadas, deliberadamente rasas nesta fatia:

| Módulo | Responsabilidade | Arquivo |
| --- | --- | --- |
| Ponto de entrada | Interpretar o argumento, despachar e definir o código de saída | `src/cli.ts` |
| Versão | Ler a versão do manifesto | `src/version.ts` |
| Verificação de dependências | Resolver cada dependência do projeto preferindo a cópia local e aceitando a global, relatando a origem | `src/doctor.ts` |

O ponto de entrada não contém lógica de verificação, e a verificação não imprime — devolve um resultado que o ponto de entrada formata. Essa separação é o que permite testar `doctor` sem capturar saída de terminal.

#### Migrations

Não aplicável. A fatia não introduz persistência.

#### Models

Um tipo de resultado por dependência, com nome, forma de obtenção, versão encontrada e veredito, em `src/doctor.ts`. Não há entidade de domínio.

#### Controllers e casos de uso

`src/cli.ts` concentra o despacho dos dois comandos. Não há autorização: os comandos são locais e apenas leem.

#### Views e experiência

Não aplicável. A seção 10 registra a ausência de interface.

#### Queries e repositórios

Não aplicável.

#### Jobs e processamento assíncrono

Não aplicável. A sondagem do PATH é síncrona e pontual.

#### Estrutura de arquivos

```text
package.json
tsconfig.json
vitest.config.ts
.gitignore
src/
  cli.ts
  version.ts
  doctor.ts
tests/
  cli.test.ts
  doctor.test.ts
dist/
```

### 9. Modelo de dados

Não aplicável. A fatia não persiste informação: `doctor` inspeciona o ambiente e descarta o resultado ao terminar.

### 10. Interfaces e contratos

#### Interface para pessoas

**Não há interface para pessoas.** A entrega é um pacote npm e um binário de terminal com dois argumentos. Não existe tela, formulário ou navegação a especificar.

#### APIs expostas

Nenhuma. O binário é a única superfície, e ela é local.

#### APIs externas utilizadas

Nenhuma em tempo de execução. As dependências são resolvidas do sistema de arquivos e do PATH; não há chamada de rede.

#### Documentação das APIs consultadas

- `https://pi.dev/`, 2026-08-24 — identidade do pacote e existência dos modos `-p` e `--mode json`, registrados para as fatias seguintes. Esta fatia não invoca `pi`.

#### Eventos e outros contratos

Não aplicável.

### 11. Estratégia TDD

- **Unidade**: leitura da versão e formação do resultado de cada dependência, com o ambiente injetado para que o teste não dependa da máquina.
- **Integração**: `doctor` contra `node_modules` real e contra um PATH controlado, que é onde a ausência de `code-review-graph` pode ser simulada sem desinstalar nada.
- **Contrato**: forma do manifesto — nome, binário, tipo de módulo, versões exatas e presença de `test:tdd`.
- **Runner TDD**: Vitest, exposto pelo script `test:tdd` conforme o contrato do framework para projeto Node.
- **E2E**: execução do binário compilado como subprocesso, que é a única forma de provar que o build produziu algo executável.
- **BDD/aceite**: os cenários da seção 6 são a referência de desenho dos testes; nenhum arquivo `.feature` é criado ou executado.
- **Verificação manual**: nenhuma.

O ponto sensível é a injeção do ambiente. Um teste de `doctor` que consulte o PATH real passaria nesta máquina e falharia noutra, provando apenas onde foi executado. As funções recebem o resolvedor e o PATH como parâmetro, e os testes fornecem ambientes controlados.

### 12. Plano de testes e rastreabilidade

#### Evidência de execução — 2026-08-24

Registro por tarefa. Cada linha cita comando e resultado observado.

**T001 — bootstrap do runner.** `npm install --ignore-scripts` instalou 44 pacotes em 22s, sem vulnerabilidades. `npm run test:tdd` reportou `No test files found`, provando o runner operante sem afirmar nada sobre o produto. A primeira verificação reprovou em dezesseis arquivos: o Vitest coletava as asserções da Phase 0 em `.claude/scripts/phase0/`, que se chamam `*.test.js` porque o auditor de rastreabilidade do former project tool só reconhece arquivo cujo nome pareça de teste. A seção 8 listava `vitest.config.ts` mas nenhuma tarefa o criava; o escopo passou a integrar T001.

**T002 a T011 — dez asserções em RED.** 21 asserções reprovando, 3 aprovando. Cada um dos dez cenários tem ao menos uma reprovação. As três aprovações verificam o que T001 entregou e existem de fato. Duas asserções foram refinadas por passarem por vacuidade sobre conjunto vazio de dependências; com a guarda de conjunto não vazio, as aprovações caíram de 5 para 3.

**T012 — manifesto de produto.** `npm install --ignore-scripts` em 6s. Suíte de 21 reprovações para 9. `monitor_context --check` retornou `PENDING` apontando `.project-context/STACK.md` e bloqueou o fechamento da tarefa, o que desviou a execução para `$framework-aux-stack` antes de prosseguir.

**T013 — configuração TypeScript.** `npx tsc --showConfig` em exit 0, resolvendo `nodenext`, `outDir` `./dist` e `rootDir` `./src`. `npm run build` reprovou com **TS18003**, por ausência de fontes. A tarefa prometia build com código zero, impossível na sua posição; o critério foi corrigido para o que ela prova, e a produção do binário permaneceu em T016.

**T014 — leitura da versão.** Duas correções que a execução exigiu. `@types/node` estava ausente e a compilação reprovava com TS2591 e TS2339. Mais grave: com a compilação reprovando, `tsc` **ainda assim emitia** `dist/`, o que faria a asserção de binário existente passar sobre compilação quebrada. `noEmitOnError` entrou no `tsconfig.json` e a guarda foi verificada por mutação — erro de tipo produz exit 1 sem `dist/`; build limpo produz exit 0 com `dist/`.

**T015 — verificação de dependências.** `doctor-ok` e `doctor-missing` deixaram de falhar na carga; a suíte subiu de 24 para 32 testes, com 26 aprovando. Exercitado também contra o ambiente real, e não só contra o injetado:

| Dependência | Camada | Origem | Versão |
| --- | --- | --- | --- |
| `removed-project-integration` | npm | local | 0.10.2 |
| `context-mode` | npm | local | 1.0.169 |
| `code-review-graph` | python | **global** | 2.3.7 |

É a regra de DEC-002 operando: os subsistemas npm resolvem da cópia do projeto e o Python resolve do ambiente, porque não há cópia local. Sem a coluna de origem, duas máquinas divergiriam em silêncio.

**T016 — despacho da linha de comando.** `npm run build` em exit 0 e suíte completa em **10 arquivos, 35 testes, todos aprovando**. Saída real do binário:

```text
$ node dist/cli.js --version
1.0.0

$ node dist/cli.js doctor
ok      removed-project-integration — camada npm, origem local, versão 0.10.2
ok      context-mode — camada npm, origem local, versão 1.0.169
ok      code-review-graph — camada python, origem global, versão 2.3.7

$ node dist/cli.js inventado
comando não reconhecido. Disponíveis: version, doctor   (exit 2)
```

**T017 — registro da stack.** Onze afirmações conferidas por script; duas estavam falsas. O arquivo dizia que os backends de agente eram detectados em tempo de execução, e nada os detecta. Dizia que a regra de `--ignore-scripts` estava registrada em `.project-context/RULES.md`, que não existia. Um teste do próprio script deu falso positivo, procurando `pi` como substring e casando dentro de outra palavra — refeito com limite de palavra.

**T018 — descrição do produto.** `PROJECT.md` criado, com onze fatos conferidos por script contra manifesto, árvore, git e a API do GitHub. A seção do que **não** existe recebeu a mesma proeminência das capacidades reais.

**T019 — regressão em clone limpo.** Clone do remoto, `npm ci --ignore-scripts` em 3s, `npm run build` em 0s, `npm run test:tdd` em 1s, todos exit 0, suíte verde com 10 arquivos e 35 testes. Ciclo em **4 segundos** contra orçamento de 300. Dois achados abaixo.

#### Achados abertos

**A suíte não passa sozinha num clone recém-instalado.** `budget.test.ts` lê `.git/phase1a-timings.json`, que fica fora da árvore versionada e não é clonado. Num clone onde ninguém registrou um ciclo, quatro asserções reprovam; verificado removendo o arquivo. É coerente com o texto de AC-009, que descreve alguém medindo a sequência, mas `npm ci && npm test` num clone novo reprova, e integração contínua reprovaria junto. Fechar exige comportamento que a spec não descreve e passa por `$framework-update-spec`.

**Colisão de identificadores entre specs.** `check_traceability.mjs` varre 18 arquivos, dez desta fatia e oito da Phase 0, e devolve `MARCADORES ÓRFÃOS: AC-011`. Conferência restrita a `tests/` mostra 21 de 21 IDs cobertos pelos arquivos próprios, de modo que a cobertura não depende da contaminação. Registrado como P4 e bloqueia o Delivery Gate.

#### Falha de registro corrigida em 2026-08-24

As dez escritas de evidência anteriores usaram como âncora de inserção a string `#### Avaliação honesta da documentação gerada — 2026-08-24

`docs/` foi reconstruída onze vezes durante esta fatia, e `build_documentation.mjs --check` sempre retornou exit 0. Isso significa apenas que a projeção está sincronizada com as fontes, e não que ela documente alguma coisa.

O conteúdo real é magro. `architecture.md` tem 289 bytes e desenha uma caixa chamada "Aplicação". `flows.md` tem 283 bytes e mostra "Entrada → Aplicação → Saída". `database.md` traz um diagrama de entidade genérico para um projeto sem persistência. Apenas `packages.md`, com o inventário de dependências, e `application.md`, com a relação de arquivos e símbolos, carregam informação útil.

A causa é o tamanho do sistema: três módulos e um binário de dois comandos não sustentam um documento de arquitetura. O gerador produz o que as fontes permitem.

O que fica registrado como erro é o relato: durante nove tarefas, "documentação reconstruída, check exit 0" foi apresentado como se a documentação estivesse adequada. Rodar a ferramenta e ler seu código de saída não é o mesmo que verificar o produto dela — que é exatamente a confusão que esta fatia encontrou em `noEmitOnError` e em `assert-preserved-set`.

Não há correção a fazer no gerador nesta fatia. A avaliação fica registrada para que a documentação seja reavaliada quando houver sistema que justifique, e para que o `--check` deixe de ser lido como atestado de qualidade.

#### Matriz de verificação`, que existe em SPEC-0001 e **não existe** nesta spec. Cada uma foi um no-op silencioso, e o conteúdo acima esteve ausente do arquivo enquanto os relatos afirmavam tê-lo registrado.

Os checklists das tarefas e os blocos `framework:evidence` foram gravados normalmente, porque usaram âncoras próprias de cada linha. O que se perdeu foi a narrativa da seção 12 e a atualização da coluna de evidência da matriz — razão pela qual `verify_acceptance.mjs` reportava `AC SEM RESULTADO` para os dez critérios.

A falha é da mesma família de duas outras já registradas nesta sessão: substituição de texto assumindo âncora sem conferir se ela existe. A partir daqui, toda escrita nesta spec verifica o resultado antes de seguir.

#### Matriz de verificação

| Requisito | Cenário BDD | Nível | Comando de verificação | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Contrato | `npm run test:tdd` — caso de forma do manifesto | **Passed** — manifest.test.ts, 4 casos, T012 |
| FR-001 | AC-007 | Contrato | `npm run test:tdd` — caso de versões exatas | **Passed** — pinning.test.ts, 3 casos, T012 |
| FR-001 | AC-008 | E2E | execução do binário pelo caminho local | **Passed** — local-run.test.ts, 3 casos, T016 |
| FR-002 | AC-002 | E2E | `npm run build` e inspeção de `dist/` | **Passed** — build.test.ts, 4 casos, T016 |
| FR-002 | AC-009 | Medição | tempo de build registrado | **Passed** — budget.test.ts, 4 casos, ciclo em 4s de 300, T019 |
| FR-002 | AC-010 | E2E | lista de comandos do binário compilado | **Passed** — surface.test.ts, 3 casos, T016 |
| FR-003 | AC-003 | Contrato | `npm run test:tdd` — caso de presença do script | **Passed** — scripts.test.ts, 3 casos, T012 |
| FR-003 | AC-009 | Medição | tempo da suíte registrado | **Passed** — budget.test.ts, 4 casos, ciclo em 4s de 300, T019 |
| FR-003 | AC-002 | Unidade | suíte executa sobre o build corrente | **Passed** — build.test.ts, 4 casos, T016 |
| FR-004 | AC-007 | Contrato | inspeção programática do manifesto | **Passed** — pinning.test.ts, 3 casos, T012 |
| FR-004 | AC-001 | Integração | versões em `node_modules` iguais às declaradas | **Passed** — manifest.test.ts, 4 casos, T012 |
| FR-004 | AC-006 | Integração | divergência de versão reprova `doctor` | **Passed** — doctor-missing.test.ts, 4 casos, T015 |
| FR-005 | AC-004 | E2E | binário com argumento de versão | **Passed** — version.test.ts, 3 casos, T016 |
| FR-005 | AC-010 | E2E | apenas dois comandos oferecidos | **Passed** — surface.test.ts, 3 casos, T016 |
| FR-005 | AC-008 | E2E | execução local sem instalação global | **Passed** — local-run.test.ts, 3 casos, T016 |
| FR-006 | AC-005 | Integração | `doctor` em ambiente completo | **Passed** — doctor-ok.test.ts, 4 casos, T015 |
| FR-006 | AC-006 | Integração | `doctor` com PATH sem `code-review-graph` | **Passed** — doctor-missing.test.ts, 4 casos, T015 |
| FR-006 | AC-010 | E2E | `doctor` presente na lista de comandos | **Passed** — surface.test.ts, 3 casos, T016 |
| NFR-001 | AC-009 | Medição | tempo somado das três etapas | **Passed** — budget.test.ts, 4 casos, ciclo em 4s de 300, T019 |
| NFR-001 | AC-002 | Medição | build isolado dentro do orçamento | **Passed** — build.test.ts, 4 casos, T016 |
| NFR-001 | AC-003 | Medição | suíte isolada dentro do orçamento | **Passed** — scripts.test.ts, 3 casos, T012 |
| NFR-002 | AC-007 | Contrato | nenhum prefixo de intervalo no manifesto | **Passed** — pinning.test.ts, 3 casos, T012 |
| NFR-002 | AC-001 | Integração | instalação reproduz as versões declaradas | **Passed** — manifest.test.ts, 4 casos, T012 |
| NFR-003 | AC-008 | E2E | binário roda pelo caminho local | **Passed** — local-run.test.ts, 3 casos, T016 |
| NFR-003 | AC-004 | E2E | versão impressa sem instalação global | **Passed** — version.test.ts, 3 casos, T016 |
| NFR-003 | AC-005 | Integração | dependências npm resolvidas de `node_modules` | **Passed** — doctor-ok.test.ts, 4 casos, T015 |
| FR-007 | AC-011 | E2E | `npm run verify` em clone recém-obtido | **Passed** — cycle-command.test.ts, 3 casos, T022 |
| FR-007 | AC-012 | Inspeção | registro em `.git/phase1a-timings.json` com três medições | **Passed** — cycle-timings.test.ts, 3 casos, T022 |
| FR-007 | AC-013 | E2E | erro de tipo injetado interrompe o ciclo | **Passed** — cycle-failure.test.ts, 2 casos, erro injetado em clone, T022 |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-08-24)
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/completed/0002-phase-1a-esqueleto-typescript/spec.md`
- **Cobertura**: 2 US, 6 FR, 3 NFR, 10 AC, 5 DEC; mínimo de 3 AC por ID satisfeito.

**Achados da rodada**

| ID | Achado | Estado |
| --- | --- | --- |
| D1 | Seis IDs declaravam menos de três cenários em `**Cobre**`; a cobertura extra existia só na matriz da seção 12, que o validador não lê | Resolvido — cobertura declarada onde o cenário de fato exercita o requisito |
| D2 | O defeito do quantificador português reincidiu pela quarta vez, na abertura de uma frase da seção 1, e pela quinta ao redigir esta própria nota | Contornado — frases reescritas; ver N5 e N6 em SPEC-0001 |

#### Gate do Ato II — Plano

- **Resultado**: Passed (2026-08-30), reaberto sobre plano concluído anteriormente
- **Comando**: `node .claude/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/completed/0002-phase-1a-esqueleto-typescript/spec.md`
- **Plano**: 26 tarefas — T001 a T024 preservadas da entrega original; T025 e T026 acrescentadas para a correção de plano de 2026-08-30.
- **RED**: `npm run test:tdd` com `tests/cli-symlink.test.ts` em 3 de 3 casos reprovando, e os 287 casos anteriores verdes.
- **Predecessores de T026**: `T009` (AC-008, execução local) e `T011` (AC-010, superfície) exercitam `src/cli.ts` de fato e somam-se a `T025` para os três predecessores exigidos.

#### Gate do Ato III — Entrega

- **Resultado**: Passed (2026-08-30), reaberto sobre entrega concluída anteriormente
- **Verificação**: `npm run test:tdd` em exit 0, com **290 casos em 88 arquivos**; `npx tsc --noEmit` e `npm run build` em exit 0; `npm run verify` em exit 0 a partir de clone limpo, em 10s; diretório pessoal com 42 entradas antes e depois.
- **Auditorias**: `verify_acceptance` em `QA: PASSED`; `verify_evidence` em `PASSED (strict)`; `load_research` em `PASSED`, após corrigir dois caminhos residuais de `specs/completed/`; `check_traceability --full-chain` sem cadeia quebrada para os IDs próprios.
- **Confirmação contra o sistema real**: o binário instalado por `npm link` em `~/.local/bin/common-rules` responde de verdade — `common-rules --version` imprime `1.0.0` e sai com zero; `common-rules doctor` relata as três dependências.

**Achado pré-existente, não expandido nesta reabertura.** Os mesmos marcadores órfãos de `AC-020` em diante, das quatro specs numeradas em faixa mais alta, continuam aparecendo — colisão de identificadores já registrada e aceita como limitação conhecida em aceites anteriores. Nada de novo aqui.

#### Suposições

- Módulo ESM, por ser o padrão de um projeto TypeScript novo em Node 22 e por `context-mode` e `pi` já serem ESM. Reversível enquanto nenhuma fatia depender do formato.
- Node maior ou igual a 20, a linha LTS, embora a máquina de desenvolvimento use 22.
- As versões fixadas são as verificadas em 2026-08-24: `removed-project-integration` 0.10.2 e `context-mode` 1.0.169 na camada npm, e `code-review-graph` 2.3.7 na camada Python. `@earendil-works/pi-coding-agent` 0.84.3 permanece registrado como identidade do agente `pi`, que pertence à camada 3 e não é fixado por este projeto.
- `uv` está disponível para a ponte da fatia 1b. Esta fatia apenas resolve e relata, sem instalar em nenhuma origem.

#### Decisões abertas

Nenhuma que bloqueie esta fatia.

### 14. Tarefas

#### Fase 1 — Bootstrap do runner

As dez asserções da fase seguinte rodam em Vitest, que vem do manifesto que elas verificam. A saída é separar os dois papéis: esta tarefa instala apenas o runner, sem nenhum campo de produto, de modo que as asserções reprovem por ausência real e não por falta de ferramenta.

- [x] T001 [OPS] [US-001] Criar .gitignore, o package.json de bootstrap e o escopo do runner em vitest.config.ts — Refs: US-001, FR-003 — Depends: none
  - [x] **PREP**: Confirmado em 2026-08-24 — sem `package.json`, sem `.gitignore`, árvore de trabalho com 119 arquivos e nenhum de código.
  - [x] **EXECUTE**: `.gitignore` escrito antes da instalação, cobrindo `node_modules/`, `dist/`, `.venv-crg/`, `.project-context/skills-lock.json` e `specs.md`. `package.json` de bootstrap com `private: true`, `vitest` 4.1.11 e `test:tdd`, sem nome, binário, tipo de módulo ou dependência de produto. `npm install --ignore-scripts` — 44 pacotes em 22s, zero vulnerabilidades. `vitest.config.ts` restringindo o escopo a `tests/`.
  - [x] **VERIFY**: `npm run test:tdd` reporta `No test files found` com o escopo `tests/**/*.test.ts`, o que prova o runner operante sem afirmar nada sobre o produto. `git status` mostra apenas arquivos do projeto; nada de gerado escapou do `.gitignore`.
  - [x] **EVIDENCE**: Comandos, saídas e a lacuna de planejamento revelada pela execução registrados na seção 12.
  - [x] **IMPROVE**: O escopo do runner entrou nesta tarefa. O plano listava `vitest.config.ts` na estrutura de arquivos da seção 8 mas não criava tarefa para ele, e sem escopo o runner é inutilizável neste repositório.

#### Fase 2 — Asserções em RED

Uma tarefa por cenário da seção 6. Nenhuma depende das outras e cada uma escreve num arquivo distinto, por isso executam em paralelo.

- [x] T002 [P] [TEST] [TDD] [US-001] Derivar do AC-001 o caso de instalação limpa em tests/manifest.test.ts — Refs: US-001, FR-001, FR-003, FR-004, NFR-002, AC-001 — Depends: T001
  - [x] **PREP**: Ler o Gherkin de AC-001 e definir as asserções: nome do pacote, presença das três dependências e ausência de faixa de versão.
  - [x] **EXECUTE**: Escrever o caso lendo o manifesto do disco, com marcador `TRACEABILITY` declarando os IDs.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova 2 de 4 em `tests/manifest.test.ts`, por nome e dependências de produto ausentes do manifesto de bootstrap.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T003 [P] [TEST] [TDD] [US-001] Derivar do AC-002 o caso de build executável em tests/build.test.ts — Refs: US-001, FR-001, FR-002, NFR-001, AC-002 — Depends: T001
  - [x] **PREP**: Ler o Gherkin de AC-002 e definir o critério: existe em `dist/` o arquivo que o campo de binário do manifesto declara.
  - [x] **EXECUTE**: Escrever o caso que resolve o alvo do binário pelo manifesto e verifica sua presença, com marcador `TRACEABILITY`.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova 4 de 4 em `tests/build.test.ts`, por campo de binário e dist/ inexistentes.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T004 [P] [TEST] [TDD] [US-001] Derivar do AC-003 o caso de contrato do runner em tests/scripts.test.ts — Refs: US-001, FR-003, NFR-001, AC-003 — Depends: T001
  - [x] **PREP**: Ler o Gherkin de AC-003 e definir o critério: o manifesto expõe `test:tdd` e ele invoca Vitest, como o enforcement do framework exige em projeto Node.
  - [x] **EXECUTE**: Escrever o caso verificando o script e o runner que ele chama, com marcador `TRACEABILITY`.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova 1 de 3 em `tests/scripts.test.ts`, por script de build ainda não declarado.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T005 [P] [TEST] [TDD] [US-001] Derivar do AC-004 o caso de impressão da versão em tests/version.test.ts — Refs: US-001, FR-001, FR-002, FR-005, NFR-003, AC-004 — Depends: T001
  - [x] **PREP**: Ler o Gherkin de AC-004 e definir o critério: a saída do binário compilado contém exatamente a versão do manifesto e o código de saída é zero.
  - [x] **EXECUTE**: Escrever o caso executando o binário como subprocesso, com marcador `TRACEABILITY`.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova 3 de 3 em `tests/version.test.ts`, por sem versão no manifesto e sem binário compilado.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T006 [P] [TEST] [TDD] [US-002] Derivar do AC-005 o caso de ambiente aprovado em tests/doctor-ok.test.ts — Refs: US-002, FR-006, NFR-002, NFR-003, AC-005 — Depends: T001
  - [x] **PREP**: Ler o Gherkin de AC-005 e definir o critério: as três dependências do projeto recebem veredito individual, cada uma reporta camada, origem resolvida e versão, e o código de saída é zero.
  - [x] **EXECUTE**: Escrever o caso injetando um ambiente controlado completo, para que o resultado não dependa da máquina, com marcador `TRACEABILITY`.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova arquivo inteiro em `tests/doctor-ok.test.ts`, por módulo src/doctor inexistente.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T007 [P] [TEST] [TDD] [US-002] Derivar do AC-006 o caso de dependência ausente em tests/doctor-missing.test.ts — Refs: US-002, FR-004, FR-006, AC-006 — Depends: T001
  - [x] **PREP**: Ler o Gherkin de AC-006 e definir o critério: a saída nomeia `code-review-graph`, explica que vem de `uv` e não do npm, e o código de saída difere de zero.
  - [x] **EXECUTE**: Escrever o caso com um PATH controlado sem a ferramenta, sem desinstalar nada da máquina, com marcador `TRACEABILITY`.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova arquivo inteiro em `tests/doctor-missing.test.ts`, por módulo src/doctor inexistente.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T008 [P] [TEST] [TDD] [US-001] Derivar do AC-007 o caso de versões fixas em tests/pinning.test.ts — Refs: US-001, FR-004, NFR-002, AC-007 — Depends: T001
  - [x] **PREP**: Ler o Gherkin de AC-007 e definir o critério: nenhuma dependência declarada aceita prefixo de intervalo, e as versões conferem com as verificadas em 2026-08-24.
  - [x] **EXECUTE**: Escrever o caso inspecionando cada versão declarada, com marcador `TRACEABILITY`.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova 2 de 3 em `tests/pinning.test.ts`, por nenhuma dependência de produto declarada.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T009 [P] [TEST] [TDD] [US-001] [US-002] Derivar do AC-008 o caso de execução local em tests/local-run.test.ts — Refs: US-001, US-002, FR-001, FR-002, FR-005, NFR-003, AC-008 — Depends: T001
  - [x] **PREP**: Ler o Gherkin de AC-008 e definir o critério: o binário responde ao ser invocado pelo caminho do projeto, sem instalação global do próprio pacote.
  - [x] **EXECUTE**: Escrever o caso executando o alvo do binário por caminho relativo, com marcador `TRACEABILITY`.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova 3 de 3 em `tests/local-run.test.ts`, por sem binário e sem subsistemas em node_modules.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T010 [P] [TEST] [TDD] [US-001] Derivar do AC-009 o caso de orçamento do ciclo em tests/budget.test.ts — Refs: US-001, FR-002, FR-003, NFR-001, AC-009 — Depends: T001
  - [x] **PREP**: Ler o Gherkin de AC-009 e definir o critério: a soma dos tempos registrados de instalação, build e suíte fica abaixo de cinco minutos.
  - [x] **EXECUTE**: Escrever o caso lendo os tempos registrados pela execução das etapas, falhando quando algum estiver ausente, com marcador `TRACEABILITY`.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova 4 de 4 em `tests/budget.test.ts`, por tempos das etapas não registrados.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T011 [P] [TEST] [TDD] [US-001] [US-002] Derivar do AC-010 o caso de limite do esqueleto em tests/surface.test.ts — Refs: US-001, US-002, FR-005, FR-006, AC-010 — Depends: T001
  - [x] **PREP**: Ler o Gherkin de AC-010 e definir o critério: apenas identificação de versão e verificação de dependências são oferecidas.
  - [x] **EXECUTE**: Escrever o caso verificando a superfície de comandos e a ausência de setup, orquestração, aprovação e seleção de modelo, com marcador `TRACEABILITY`.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova arquivo inteiro em `tests/surface.test.ts`, por módulo src/cli inexistente.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

#### Fase 3 — Fundação

- [x] T012 [CODE] [US-001] Promover o bootstrap a manifesto de produto em package.json — Refs: US-001, FR-001, FR-003, FR-004, NFR-002, AC-001, AC-007 — Depends: T002, T003, T004, T008
  - [x] **PREP**: RED confirmado em T002, T004 e T008. `docs/` e `.project-context/PACKAGES.md` reconstruídos por `$framework-documentator`, com `--check` em exit 0.
  - [x] **EXECUTE**: `package.json` promovido a manifesto de produto — nome `@brunocalmon/common-rules`, versão 1.0.0, `type: module`, `engines.node` maior ou igual a 20, binário `common-rules` apontando para `dist/cli.js`, e as duas dependências de subsistema em versão exata. `private: true` mantido, porque publicar está fora de escopo. `npm install --ignore-scripts` em 6s.
  - [x] **VERIFY**: `npm run test:tdd` — de 21 reprovações para 9. Os casos de manifesto, contrato do runner e fixação passaram a GREEN; build, versão, execução local, orçamento e superfície seguem em RED por dependerem de compilação e código.
  - [x] **EVIDENCE**: Comandos, transição por caso e a pendência de stack que o monitor apontou, registrados na seção 12.
  - [x] **IMPROVE**: `private: true` foi preservado no manifesto de produto como guarda contra publicação acidental, já que publicar pertence a outra fatia. Nenhum teste exigia isso; é decisão de segurança do próprio manifesto.
  <!-- framework:evidence {"task": "T012", "refs": ["US-001", "FR-001", "FR-003", "FR-004", "NFR-002", "AC-001", "AC-007"], "files": ["package.json", "package-lock.json", ".project-context/STACK.md"], "commands": [{"run": "npm install --ignore-scripts", "exit": 0}, {"run": "node .claude/skills/framework-documentator/scripts/build_documentation.mjs --project . --check", "exit": 0}, {"run": "node .claude/skills/removed-project-setup/scripts/monitor_context.mjs --project . --check", "exit": 0}]} -->

- [x] T013 [CODE] [US-001] Configurar TypeScript e o build em tsconfig.json — Refs: US-001, FR-002, NFR-001, AC-002, AC-009 — Depends: T003, T005, T010, T012
  - [x] **PREP**: RED confirmado em T003, com 2 de 4 reprovando, e em T010, com 3 de 4. `docs/` reconstruído antes da alteração, com `--check` em exit 0.
  - [x] **EXECUTE**: `tsconfig.json` com `module` e `moduleResolution` em `nodenext`, saída em `dist/`, raiz `src/`, modo estrito e `verbatimModuleSyntax`. O script de build já fora declarado em T012, e o alvo `dist/cli.js` coincide com o campo de binário do manifesto.
  - [x] **VERIFY**: `npx tsc --showConfig` sai com exit 0 e resolve `nodenext`, `outDir` em `./dist` e `rootDir` em `./src`. `npm run build` ainda reprova com TS18003, por ausência de fonte — comportamento esperado e corrigido em T016.
  - [x] **EVIDENCE**: Comandos, configuração resolvida e o defeito de plano revelado pela execução, registrados na seção 12.
  - [x] **IMPROVE**: O critério de verificação da tarefa foi corrigido para o que ela consegue provar. Prometia build com código zero, impossível antes de existir fonte; passou a provar que a configuração resolve, e a produção do binário ficou em T016, onde de fato acontece.
  <!-- framework:evidence {"task": "T013", "refs": ["US-001", "FR-002", "NFR-001", "AC-002", "AC-009"], "files": ["tsconfig.json"], "commands": [{"run": "npx tsc --showConfig", "exit": 0}, {"run": "node .claude/skills/framework-documentator/scripts/build_documentation.mjs --project . --check", "exit": 0}]} -->

- [x] T014 [CODE] [US-001] Implementar a leitura da versão em src/version.ts — Refs: US-001, FR-005, NFR-003, AC-004 — Depends: T005, T009, T011, T013
  - [x] **PREP**: RED confirmado em T005 e T009, 2 de 3 em cada. `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/version.ts` lê a versão do manifesto e a devolve sem imprimir, com o caminho injetável para que o teste não dependa da posição do arquivo na máquina. Resolve o manifesto um nível acima do módulo compilado, o que vale no repositório e no pacote publicado, já que `files` inclui apenas `dist`.
  - [x] **VERIFY**: `npm run build` em exit 0 e o módulo compilado devolve `1.0.0`, idêntico ao manifesto. As asserções de `version.test.ts` seguem em RED por exercitarem o binário de ponta a ponta, e passam a GREEN em T016, quando o despacho as liga — como o próprio critério da tarefa previa.
  - [x] **EVIDENCE**: Comandos, verificação em runtime e as duas correções que a execução exigiu, registrados na seção 12.
  - [x] **IMPROVE**: `noEmitOnError` passou a constar do `tsconfig.json`. Sem ele o `tsc` emitia `dist/` mesmo reprovando por tipo, o que faria a asserção de binário existente passar sobre uma compilação quebrada. Verificado por mutação, e não por leitura.
  <!-- framework:evidence {"task": "T014", "refs": ["US-001", "FR-005", "NFR-003", "AC-004"], "files": ["src/version.ts", "tsconfig.json", "package.json"], "commands": [{"run": "npm run build", "exit": 0}, {"run": "node .claude/skills/framework-documentator/scripts/build_documentation.mjs --project . --check", "exit": 0}, {"run": "node .claude/skills/removed-project-setup/scripts/monitor_context.mjs --project . --check --acknowledge-project-no-change", "exit": 0}]} -->

- [x] T015 [CODE] [US-002] Implementar a verificação de dependências em src/doctor.ts — Refs: US-002, FR-004, FR-006, NFR-002, NFR-003, AC-005, AC-006 — Depends: T006, T007, T008, T013
  - [x] **PREP**: RED confirmado em T006 e T007 — os dois arquivos sequer carregavam, por `src/doctor` inexistente. `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/doctor.ts` resolve cada dependência na ordem local e depois global, e devolve nome, camada, origem, versão e veredito. O ambiente é injetado por interface; `defaultEnvironment` fornece a implementação real, que apenas lê e nunca instala.
  - [x] **VERIFY**: `npm run test:tdd` — `doctor-ok.test.ts` e `doctor-missing.test.ts` passaram a carregar e aprovam os oito casos. A suíte foi de 24 para 32 testes, com 26 aprovando e 6 reprovando, todas dependentes do binário.
  - [x] **EVIDENCE**: Comandos, transição dos dois arquivos e a execução contra o ambiente real, registrados na seção 12.
  - [x] **IMPROVE**: A verificação foi exercitada também contra o ambiente real, e não só contra o injetado. Um módulo que passa apenas com ambiente forjado poderia estar correto no teste e errado na máquina.
  <!-- framework:evidence {"task": "T015", "refs": ["US-002", "FR-004", "FR-006", "NFR-002", "NFR-003", "AC-005", "AC-006"], "files": ["src/doctor.ts"], "commands": [{"run": "npm run build", "exit": 0}, {"run": "node .claude/skills/framework-documentator/scripts/build_documentation.mjs --project . --check", "exit": 0}, {"run": "node .claude/skills/removed-project-setup/scripts/monitor_context.mjs --project . --check --acknowledge-project-no-change", "exit": 0}]} -->

#### Fase 4 — Superfície

- [x] T016 [CODE] [US-001] [US-002] Implementar o despacho dos dois comandos em src/cli.ts — Refs: US-001, US-002, FR-005, FR-006, AC-008, AC-010 — Depends: T006, T009, T011, T014, T015
  - [x] **PREP**: RED confirmado em T009 e T011; `surface.test.ts` sequer carregava, por `src/cli` inexistente. Módulos de versão e verificação já compilando. `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/cli.ts` interpreta o argumento, despacha para versão ou verificação, formata a saída e define o código de saída. Nenhuma lógica de verificação vive nele. A execução só ocorre quando o módulo é o binário invocado, de modo que importá-lo não imprime nada — é o que permite a `surface.test.ts` inspecionar a superfície sem efeito colateral.
  - [x] **VERIFY**: `npm run build` em exit 0 e `npm run test:tdd` com **10 arquivos e 35 testes, todos aprovando**. O binário responde `--version` com `1.0.0` e exit 0, `doctor` com as três dependências e exit 0, e comando desconhecido com exit 2.
  - [x] **EVIDENCE**: Comandos, suíte completa em GREEN e a saída real do binário, registrados na seção 12.
  - [x] **IMPROVE**: O despacho devolve um resultado em vez de imprimir, e quem escreve é a borda do processo. Isso mantém cada comando testável sem capturar saída de terminal, e é a mesma separação aplicada em `version.ts` e `doctor.ts`.
  <!-- framework:evidence {"task": "T016", "refs": ["US-001", "US-002", "FR-005", "FR-006", "AC-008", "AC-010"], "files": ["src/cli.ts"], "commands": [{"run": "npm run build", "exit": 0}, {"run": "npm run test:tdd", "exit": 0}, {"run": "node dist/cli.js --version", "exit": 0}, {"run": "node dist/cli.js doctor", "exit": 0}]} -->

#### Fase 5 — Contexto persistente e fechamento

- [x] T017 [DOC] [US-001] Registrar a stack introduzida por esta fatia em .project-context/STACK.md — Refs: US-001, FR-001, FR-003, AC-001, AC-003 — Depends: T012, T013, T016
  - [x] **PREP**: Levantado o que a fatia entregou. Parte do registro já existia, porque o monitor de contexto exigiu STACK.md em T012 e T014 antes de deixar fechar aquelas tarefas.
  - [x] **EXECUTE**: Cada linha do arquivo foi conferida contra manifesto, configuração e ambiente. Onze afirmações verificadas por script; duas estavam falsas e foram corrigidas.
  - [x] **VERIFY**: As onze afirmações passam a corresponder às fontes. O bloco reconstruído sobrevive a nova execução do gerador sem apagar o conteúdo humano, e o monitor retorna CURRENT.
  - [x] **EVIDENCE**: Conferência item a item e as duas correções, registradas na seção 12.
  - [x] **IMPROVE**: A conferência passou a ser por script contra as fontes, e não por leitura. Foi assim que as duas afirmações falsas apareceram — nenhuma delas seria notada relendo o texto, porque ambas descreviam algo plausível.
  <!-- framework:evidence {"task": "T017", "refs": ["US-001", "FR-001", "FR-003", "AC-001", "AC-003"], "files": [".project-context/STACK.md"], "commands": [{"run": "node .claude/skills/framework-aux-stack/scripts/update_stack.mjs --project .", "exit": 0}, {"run": "node .claude/skills/removed-project-setup/scripts/monitor_context.mjs --project . --check --acknowledge-project-no-change", "exit": 0}]} -->

- [x] T018 [DOC] [US-001] [US-002] Criar PROJECT.md descrevendo a finalidade e os limites do produto novo — Refs: US-001, US-002, FR-005, FR-006, AC-010 — Depends: T016
  - [x] **PREP**: Confirmado que `PROJECT.md` não existia. A Phase 0 atribuiu a esta fatia a descrição do produto novo, e a partir de T014 o monitor passou a cobrar a revisão a cada tarefa de produção.
  - [x] **EXECUTE**: `PROJECT.md` registra o que existe — dois comandos, três módulos, três dependências em três camadas —, a lista explícita do que **não** existe, os limites deliberados, a história da v0.2.8 congelada em `archived` e o mapa de onde cada decisão vive.
  - [x] **VERIFY**: Onze fatos conferidos por script contra manifesto, árvore, git e a API do GitHub; todos correspondem. Uma segunda checagem confirmou que nenhum comando citado no documento deixa de existir no binário.
  - [x] **EVIDENCE**: Conferência item a item registrada na seção 12.
  - [x] **IMPROVE**: O documento ganhou uma seção dedicada ao que ainda não existe, com a mesma proeminência da lista de capacidades. Sem ela, a descrição da finalidade se leria como descrição do presente — que foi exatamente o erro que T017 encontrou no registro da stack.
  <!-- framework:evidence {"task": "T018", "refs": ["US-001", "US-002", "FR-005", "FR-006", "AC-010"], "files": ["PROJECT.md"], "commands": [{"run": "node .claude/skills/framework-documentator/scripts/build_documentation.mjs --project . --check", "exit": 0}, {"run": "node .claude/skills/removed-project-setup/scripts/monitor_context.mjs --project . --check", "exit": 0}]} -->

- [x] T019 [TEST] [US-001] [US-002] Executar regressão e rastreabilidade pelos scripts declarados em package.json — Refs: US-001, US-002, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010 — Depends: T016, T017, T018
  - [x] **PREP**: Dez casos reunidos, cada um com RED registrado antes da implementação correspondente, conforme as evidências de T002 a T011.
  - [x] **EXECUTE**: Clone limpo do remoto, seguido de `npm ci --ignore-scripts`, `npm run build` e `npm run test:tdd`, medindo cada etapa.
  - [x] **VERIFY**: As três etapas concluem com exit 0 e a suíte fica verde no clone — 10 arquivos, 35 testes. O binário responde `--version` e `doctor`. Ciclo em 4s, contra orçamento de 300. A rastreabilidade cobre 21 de 21 IDs, mas o auditor devolve `GAPS` por contaminação entre specs.
  - [x] **EVIDENCE**: Tempos, contagens, saída do binário e os dois achados do clone, registrados na seção 12.
  - [x] **IMPROVE**: A regressão foi executada contra um clone do remoto, e não contra a árvore local. Foi o que revelou que a suíte não passa sozinha num clone recém-instalado — algo invisível aqui, onde o arquivo de tempos já existia de execuções anteriores.
  <!-- framework:evidence {"task": "T019", "refs": ["US-001", "US-002", "FR-001", "FR-002", "FR-003", "FR-004", "FR-005", "FR-006", "NFR-001", "NFR-002", "NFR-003", "AC-001", "AC-002", "AC-003", "AC-004", "AC-005", "AC-006", "AC-007", "AC-008", "AC-009", "AC-010"], "files": ["package.json", "tests/budget.test.ts"], "commands": [{"run": "npm ci --ignore-scripts", "exit": 0}, {"run": "npm run build", "exit": 0}, {"run": "npm run test:tdd", "exit": 0}]} -->

- [x] T020 [DOC] [US-001] Registrar a regra de instalação sem scripts em .project-context/RULES.md — Refs: US-001, FR-004, NFR-002, AC-001, AC-007 — Depends: T012
  - [x] **PREP**: Confirmado que `.project-context/RULES.md` não existia e que a regra foi confirmada pela pessoa responsável, não inferida.
  - [x] **EXECUTE**: Quatro regras registradas com o motivo de cada uma: instalação sem scripts de ciclo de vida, nada instalado no ambiente global, preferir a cópia local aceitando a global, e compilação que não deixa artefato quando falha.
  - [x] **VERIFY**: O arquivo cita motivo e alcance de cada regra. A afirmação do `STACK.md` de que o registro canônico vive aqui passou a ser verdadeira, e deixou de apontar para arquivo inexistente.
  - [x] **EVIDENCE**: Caminho e conteúdo registrados na seção 12.
  - [x] **IMPROVE**: Cada regra registra o porquê. Uma regra cujo propósito se perdeu vira ritual, e a primeira delas seria descartada como burocracia sem a razão de segurança ao lado.
  <!-- framework:evidence {"task": "T020", "refs": ["US-001", "FR-004", "NFR-002", "AC-001", "AC-007"], "files": [".project-context/RULES.md", ".project-context/STACK.md"], "commands": [{"run": "node .claude/skills/removed-project-setup/scripts/monitor_context.mjs --project . --check --acknowledge-project-no-change", "exit": 0}]} -->

#### Fase 6 — Ciclo de verificação

- [x] T021 [P] [TEST] [TDD] [US-001] Derivar de AC-011 o caso do comando de ciclo em tests/cycle-command.test.ts — Refs: US-001, FR-003, FR-007, AC-011 — Depends: T001
  - [x] **PREP**: Lidos AC-011 a AC-013 e definido o critério: manifesto expõe o script, ele mede as três etapas em separado, e reprova nomeando a que falhou.
  - [x] **EXECUTE**: `tests/cycle.test.ts` com oito casos, cada um com marcador `TRACEABILITY`, verificando manifesto e comportamento sem executar um ciclo completo dentro da suíte.
  - [x] **VERIFY**: RED observado — 7 de 8 reprovando, por não existir o script nem a entrada no manifesto.
  - [x] **EVIDENCE**: Comando e contagem de RED registrados na seção 12.
  - [x] **IMPROVE**: Os casos inspecionam o script em vez de executá-lo. Um teste que rodasse o ciclo inteiro dentro da suíte chamaria a própria suíte, em recursão.
  <!-- framework:evidence {"task": "T021", "refs": ["US-001", "FR-003", "FR-007", "NFR-001", "AC-011", "AC-012", "AC-013"], "files": ["tests/cycle.test.ts"], "commands": [{"run": "npm run test:tdd", "exit": 1}]} -->

- [x] T022 [CODE] [US-001] Implementar o ciclo de verificação em scripts/cycle.mjs — Refs: US-001, FR-003, FR-007, NFR-001, AC-011, AC-012, AC-013 — Depends: T021, T016, T019
  - [x] **PREP**: RED confirmado em T021, com 7 de 8 reprovando. `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `scripts/cycle.mjs` executa instalação, compilação e suíte em sequência, mede cada etapa, grava fora da árvore versionada e interrompe na primeira reprovação. Script `verify` exposto no manifesto.
  - [x] **VERIFY**: Num clone recém-obtido, `npm run verify` conclui com exit 0 — instalação 3s, compilação 0s, suíte 1s, total 4s — e a suíte fica verde com 11 arquivos e 43 testes. Com um erro de tipo injetado, o ciclo encerra com `ciclo interrompido: a etapa build reprovou com código 1`.
  - [x] **EVIDENCE**: Execução em clone limpo e o caso de falha registrados na seção 12.
  - [x] **IMPROVE**: A circularidade da medição foi tratada: a suíte afere um registro e não mede a própria duração enquanto roda, de modo que instalação e compilação são gravadas antes dela e a duração da suíte é atualizada depois.
  <!-- framework:evidence {"task": "T022", "refs": ["US-001", "FR-003", "FR-007", "NFR-001", "AC-011", "AC-012", "AC-013"], "files": ["scripts/cycle.mjs", "package.json"], "commands": [{"run": "npm run verify", "exit": 0}, {"run": "npm run test:tdd", "exit": 0}]} -->

- [x] T023 [P] [TEST] [TDD] [US-001] Derivar de AC-012 o caso de registro das etapas em tests/cycle-timings.test.ts — Refs: US-001, FR-007, NFR-001, AC-012 — Depends: T001
  - [x] **PREP**: Definido o critério: medições distintas para instalação, compilação e suíte, gravadas fora da árvore versionada.
  - [x] **EXECUTE**: Três casos com marcador `TRACEABILITY`, inspecionando o registro e a fonte do script.
  - [x] **VERIFY**: RED observado por não existir o script.
  - [x] **EVIDENCE**: Registrado na seção 12 junto de T021.
  - [x] **IMPROVE**: O caso confere que o registro não está na árvore versionada, e não apenas que existe.

- [x] T024 [P] [TEST] [TDD] [US-001] Derivar de AC-013 o caso de interrupção em tests/cycle-failure.test.ts — Refs: US-001, FR-007, NFR-001, AC-013 — Depends: T001
  - [x] **PREP**: Definido o critério: encerrar com código diferente de zero, nomear a etapa e não prosseguir.
  - [x] **EXECUTE**: Dois casos com marcador `TRACEABILITY`.
  - [x] **VERIFY**: RED observado por não existir o script; depois confirmado por injeção real de erro de tipo num clone.
  - [x] **EVIDENCE**: Registrado na seção 12 junto de T022.
  - [x] **IMPROVE**: A interrupção foi verificada executando um ciclo que falha de verdade, e não só lendo a fonte.

#### Fase extra — Correção de plano: dispatch por link simbólico

Reabertura de 2026-08-30. `FR-005` e `FR-006` já exigiam resposta "quando invocado"; a comparação de caminho no guard de dispatch nunca considerava o caso de o binário ser um link simbólico, e toda instalação global do npm cria exatamente isso.

- [x] T025 [TEST] [TDD] [US-001] Derivar de AC-008 o caso de invocação por link simbólico em tests/cli-symlink.test.ts — Refs: US-001, US-002, FR-005, FR-006, NFR-003, AC-008 — Depends: none
  - [x] **PREP**: Reler AC-008: hoje exercita só execução pelo caminho local direto. Falta o caso real de instalação — link simbólico, que é como npm link e npm install -g sempre entregam um binário global.
  - [x] **EXECUTE**: Escrever o caso em `tests/cli-symlink.test.ts`: criar um link simbólico de verdade em diretório temporário apontando para `dist/cli.js`, invocar `node <link> --version` como subprocesso e `node <link> doctor`, conferindo que os dois produzem saída e código de saída correspondentes à execução direta.
  - [x] **VERIFY**: RED observado nos três casos — invocado pelo link, `--version` e `doctor` saem silenciosos, e a comparação contra a execução direta falha.
  - [x] **EVIDENCE**: `npx vitest run tests/cli-symlink.test.ts` com 3 de 3 reprovando. Registrado na seção 12.
  - [x] **IMPROVE**: O caso usa subprocesso de verdade, e não apenas inspeciona `argv`/`import.meta.url` isoladamente — é a mesma disciplina que `AC-002` da SPEC-0003 já aplica aos guards: só executar prova o comportamento real.

- [x] T026 [CODE] [US-001] Resolver o caminho real de argv[1] antes de comparar em src/cli.ts — Refs: FR-005, FR-006, NFR-003, AC-008, AC-010 — Depends: T009, T011, T025
  - [x] **PREP**: T025 em RED; `docs/` reconstruído por `$framework-documentator` antes da alteração.
  - [x] **EXECUTE**: `src/cli.ts` ganhou `realEntryPath`, que resolve `argv[1]` pelo caminho real via `realpathSync` antes de comparar com `fileURLToPath(import.meta.url)`, devolvendo `undefined` em vez de lançar quando o caminho não existe.
  - [x] **VERIFY**: T025 passa a GREEN nos três casos. A suíte inteira fecha em 290 de 290 casos e 88 de 88 arquivos. `npx tsc --noEmit` e `npm run build` em exit 0. Confirmado contra o sistema real: `common-rules --version` e `common-rules doctor`, invocados pelo binário linkado por `npm link` em `~/.local/bin/`, respondem com saída e código zero.
  - [x] **EVIDENCE**: Comandos, contagens e a saída do binário real registrados na seção 12.
  - [x] **IMPROVE**: Este defeito é mais grave que o da SPEC-0003: ali quatro hooks de sete ficavam inertes; aqui o binário inteiro nunca funcionaria fora deste checkout, incluindo qualquer instalação futura publicada de verdade. `AC-008` já previa o cenário de instalação, mas seu Gherkin dizia "pelo caminho local do projeto" — nunca "por link simbólico" —, e ninguém tinha motivo para desconfiar até a primeira instalação real acontecer nesta sessão.

  <!-- framework:evidence {"task": "T026", "refs": ["FR-005", "FR-006", "NFR-003", "AC-008", "AC-010"], "files": ["src/cli.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

### 15. Ordem de execução

**Correção de 2026-08-30.** `T025` não depende de nada e `T026` depende só de `T025`; a ordem original não muda.

- Caminho crítico: T001 → T002 e T003 → T012 → T013 → T015 → T016 → T019.
- T020 registra em `.project-context/RULES.md` a regra de instalar sempre com `--ignore-scripts`, confirmada pela pessoa responsável durante o planejamento.
- Tarefas paralelas: T002 a T011 executam em paralelo, porque cada uma escreve num arquivo distinto de `tests/` e nenhuma depende do resultado das outras.
- Barreira deliberada: T001 precede toda a fase de asserções. Sem runner instalado não há como observar RED, e sem RED observado não se escreve produção.
- Ordem interna da fundação: o manifesto precede o build, que precede os módulos, porque cada um resolve o alvo declarado pelo anterior. T016 vem por último na superfície, porque só ele torna a suíte inteira verde.
- Estratégia de MVP: a própria fatia já é o mínimo. Reduzi-la mais entregaria um pacote que instala e não executa, o que não prova chão firme nem exercita a premissa das dependências.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Node maior ou igual a 20 e npm no ambiente de desenvolvimento.
- Registro npm acessível para instalar as três dependências fixadas.
- `uv` com `code-review-graph` instalado, para que `doctor` aprove. A ausência é caso de teste, não impedimento.

#### Riscos

- **Uma das versões fixadas sai do registro ou é despublicada** → a instalação quebra sem aviso. Mitigação: o lockfile é versionado, e `doctor` reporta divergência entre declarado e instalado.
- **ESM cria atrito com dependência que só ofereça CommonJS** → integração travada numa fatia posterior. Mitigação: as três dependências foram verificadas como ESM ou com binário próprio; a decisão está registrada como suposição reversível enquanto nenhuma fatia depender dela.
- **`doctor` passar a testar o ambiente em vez do código** → suíte verde numa máquina e vermelha noutra. Mitigação: ambiente injetado nos testes, conforme a seção 11.
- **Resolução cair na cópia global sem que ninguém perceba** → duas máquinas rodam versões diferentes achando que rodam a mesma. Mitigação: `doctor` sempre relata a origem resolvida, e divergência de versão reprova.
- **O esqueleto crescer além do escopo** → a fatia perde a função de provar chão firme depressa. Mitigação: AC-010 verifica que apenas dois comandos existem.
- **`code-review-graph` seguir fora do npm indefinidamente** → o modelo de três camadas se torna permanente. Aceito: a ponte `uv` explícita da fatia 1b resolve sem exigir que o pacote migre de ecossistema.
- **Guard de dispatch nunca verdadeiro quando o binário é invocado por link simbólico** → `fileURLToPath(import.meta.url)` é sempre o caminho real resolvido, e `argv[1]` preserva o caminho do link. Como toda instalação global do npm — `npm link` ou `npm install -g` de pacote publicado — cria um link simbólico para o bin, o binário nunca respondia fora deste checkout. `AC-008` só exercitava execução pelo caminho local direto, nunca por link. Achado em 2026-08-30, ao instalar de verdade via `npm link` pela primeira vez. Mitigação: a comparação passa a resolver `argv[1]` pelo caminho real antes de comparar, e um caso novo cria um link simbólico de verdade e invoca por ele, em vez de invocar só pelo caminho direto.

#### Suposições

Registradas na seção 13, todas reversíveis nesta fatia.

### 17. Decisões

- **DEC-001**: O pacote se chama `@brunocalmon/common-rules`, com binário `common-rules`. *Razão*: `common-rules` sem escopo está ocupado no npm por um pacote de expressões regulares sem atualização desde 2023. *Trade-off*: perde-se a forma curta do comando de instalação; o nome do comando não muda, porque o escopo restringe o pacote e não o binário.
- **DEC-002**: As dependências seguem três camadas, e as do projeto seguem uma única regra de resolução.

  *Camada 1, subsistema npm*: `removed-project-integration` e `context-mode`, declarados em versão exata. *Camada 2, subsistema Python*: `code-review-graph`, que não existe no npm e é instalado por `uv` num ambiente virtual do projeto. *Camada 3, backend de agente*: `pi`, `claude`, `cursor-agent`, `codex`, `agy`, `goose`, `dsh` e Ollama, detectados por capacidade, nunca instalados, e pertencentes à fatia 1d.

  *Regra de resolução das camadas 1 e 2*: preferir a cópia local do projeto; aceitar a global quando não houver local; nunca instalar no ambiente global. O `doctor` sempre relata qual origem resolveu, de modo que a diferença entre máquinas seja visível em vez de silenciosa.

  *Razão*: fixar versão só garante alguma coisa quando o binário executado é o do projeto. Ao mesmo tempo, o ambiente de destino é gerido por um playbook declarativo cuja regra é que nada se instala manualmente, e `uv tool install` escreve em `~/.local/share/uv/tools/`, fora do projeto. Preferir o local honra a fixação; aceitar o global evita baixar 262 MB de ambiente Python quando o playbook já proveu a ferramenta; nunca instalar global preserva a autoridade do playbook sobre o sistema.

  *Correção de uma versão anterior desta decisão*: `pi` estava na camada 1. Estava errado — `pi` é agente, não subsistema. Fixá-lo criaria uma segunda cópia enquanto o Orchestrator continuaria invocando o binário do PATH, pagando divergência sem ganhar reprodutibilidade.

  *Alternativa descartada*: `postinstall` instalando o que faltar. Escreveria no ambiente global durante um `npm install`, seria desligado por `--ignore-scripts` — flag que a própria documentação do `pi` recomenda —, quebraria CI sem `uv` e faria este projeto ditar a versão de uma ferramenta global usada por outros trabalhos. A ponte `uv` permanece, movida para invocação explícita na fatia 1b.
- **DEC-003**: O runner é Vitest, exposto por `test:tdd`. *Razão*: recomendação do contrato do framework, TypeScript nativo e o script que o enforcement exige em projeto Node.
- **DEC-004**: A Phase 1 foi fatiada em 1a a 1e, e esta fatia entrega apenas o esqueleto. *Razão*: as seis entregas do backlog são cada uma comparável à Phase 0, que rendeu 14 tarefas sendo uma única coisa estreita; uma spec única produziria gates que não se sustentariam honestamente.
- **DEC-005**: A verificação de dependências é comando, não documento. *Razão*: a Phase 0 encontrou uma premissa falsa que estava escrita como verdade em três lugares. Premissa exercitada por comando falha alto e cedo.

**Correção de plano registrada em 2026-08-30.** `FR-005` e `FR-006` não mudaram: ambos já exigem que o binário responda "quando invocado", e o caso real de invocação — através do link simbólico que toda instalação global cria — nunca foi exercitado. Classificação: mudança de plano, Ato II reaberto, Definition Gate preservado.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam — `verify_acceptance.mjs` em `QA: PASSED` para os treze.
- [x] Todos os requisitos possuem evidência de verificação registrada na seção 12.
- [x] Todas as tarefas da seção 14 estão concluídas — 24 de 24, com 120 de 120 itens de checklist.
- [x] `npm ci`, `npm run build` e `npm run test:tdd` concluem com código zero a partir de clone limpo, verificado em clone descartável.
- [x] `common-rules doctor` aprova o ambiente completo com exit 0 e reprova com exit 1 ao remover `code-review-graph` do `PATH`, nomeando-a e explicando que vem de `uv`.
- [x] `.project-context/STACK.md` registra a stack introduzida por esta fatia: TypeScript, ESM, Vitest, as **duas** dependências de subsistema fixadas por npm e o subsistema Python exigido do ambiente. O texto anterior falava em três fixadas, o que contradizia DEC-002.
- [x] `PROJECT.md` foi criado em T018, com onze fatos conferidos por script contra manifesto, árvore, git e a API do GitHub.

#### Nota de manutenção — 2026-08-24, após a conclusão

`AC-010` exigia que existissem **apenas** dois comandos, e `tests/surface.test.ts` listava `setup` entre os proibidos. A fatia 1b entregou `setup`, e o teste reprovou.

A asserção estava certa sobre a entrega desta fatia e errada como invariante. O que a 1a queria garantir era que o esqueleto não contrabandeasse orquestração, aprovação ou seleção de modelo; o que ela escreveu foi um retrato do momento, que passa a mentir assim que o produto cresce.

O cenário passou a afirmar que os dois comandos desta fatia existem e que os das fatias seguintes não, e `setup` saiu da lista de proibidos porque deixou de ser futuro. A guarda continua valendo para `orchestrate`, `approve`, `model`, `agent`, `serve` e `mcp`.

É o mesmo defeito já corrigido três vezes nas asserções da Phase 0, que comparavam `HEAD` de uma branch que cresce. Vale como padrão: asserção que descreve um instante da entrega envelhece mal, e a que descreve a propriedade sobrevive.

**Aceite da reabertura, 2026-08-30.** Todos os gates conferidos: `Definition Gate: Passed` preservado; `Plan Gate: Passed` com `T025`/`T026` acrescentadas e RED materializado; `Delivery Gate: Passed` com 290 de 290 casos, confirmação contra o sistema real via binário `npm link`, `load_research` corrigido e `check_traceability --full-chain` sem cadeia quebrada para os IDs próprios.
