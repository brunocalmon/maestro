# Especificação integrada: Fatia 1f: servidor MCP com a tool setup unica

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0004 |
| Slug | 0004-fatia-1f-servidor-mcp |
| Status | Complete |
| Effort | 5 |
| Effort updated at | 2026-08-24 |
| Effort rationale | A lógica já existe e tem 94 testes. O custo está em resolver a raiz do projeto sem `cwd` nem variável de ambiente, cujo modo de falha é silencioso e escreve na árvore errada. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — a entrega é um servidor que fala um protocolo com o editor, sem tela. |
| Atualizada em | 2026-08-24 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A fatia 1b entregou `common-rules setup` funcionando, com 94 testes cobrindo tradução, detecção, escrita e registro. Mas essa capacidade só existe para quem abre um terminal no projeto. O agente dentro do editor não tem como acioná-la sem que alguém a exponha por protocolo.

Há um problema mais duro por baixo. O comando de terminal sabe em que projeto está porque a pessoa o executou lá. Um servidor MCP não sabe: a observação dos processos em execução mostrou três servidores ativos ao mesmo tempo, dois com o diretório pessoal como diretório de trabalho e um apontando para um projeto diferente daquele em que o trabalho ocorria. Nenhum deles tinha o projeto correto.

O modo de falha é silencioso e caro. Um servidor que derivasse a raiz de `process.cwd()` escreveria `settings.json` e o registro numa árvore que ninguém pediu, e responderia que instalou com sucesso.

#### Resultado desejado

O agente aciona `setup` pelo protocolo e obtém o mesmo resultado que o terminal produz, sobre o projeto que ele nomear.

Ao fim da fatia, um cliente MCP encontra uma única tool, chamada `setup`, que exige a raiz do projeto como parâmetro, recusa quando o caminho não parece um projeto e devolve o mesmo relatório que o comando de terminal devolve. Nada é escrito fora da raiz informada, e nada é escrito quando a raiz não pode ser confirmada.

O valor não é a tool. É que a mesma lógica, já verificada, passa a ter dois pontos de entrada sem duplicar comportamento — e que o ponto de entrada novo não herda uma suposição sobre diretório de trabalho que a evidência já refutou.

#### Métricas de sucesso

- Um cliente MCP lista exatamente uma tool, chamada `setup`.
- A tool recusa quando `project_root` está ausente, e a recusa nomeia o parâmetro.
- A tool recusa quando o caminho não contém marcador de projeto, sem escrever nada.
- Com raiz válida, a tool instala os sete hooks e devolve o mesmo conteúdo que o terminal.
- Nenhum arquivo é criado fora da raiz informada, mesmo quando o diretório de trabalho do processo aponta para outro lugar.
- O servidor não lê `process.cwd()` nem variável de ambiente para decidir onde escrever.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] O processo que serve as chamadas MCP não tem o projeto como diretório de trabalho — Verdict: verified — Confidence: high — Evidence: research/processo-mcp/raiz-do-projeto.md#observação — Budget: 1/1.

Três servidores da v0.2.8 estavam ativos simultaneamente. Dois tinham `/run/host/home/bcalmon` como diretório de trabalho e nenhuma variável de projeto; o terceiro apontava para `dev-bootstrap`, um projeto diferente daquele em que o trabalho ocorria. A raiz correta não era o diretório de trabalho de nenhum deles.

#### Fontes e contexto consultados

- Processos em execução na máquina, por `ps`, `/proc/<pid>/cwd` e `/proc/<pid>/environ`.
- `specs/completed/0003-fatia-1b-setup-hooks/spec.md`, pela lógica que esta fatia expõe.
- `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md`, seção de refatiamento.
- Branch `archived`: assinatura de `setup_config` na v0.2.8, que já recebia `project_root` como parâmetro.
- Registro do npm para `@modelcontextprotocol/sdk`, versão 1.30.0.

#### Documentação consultada

Nenhuma documentação externa. Os metadados do SDK vieram do registro npm, e o restante é do próprio repositório e da máquina.

#### Artefatos de pesquisa armazenados

- `specs/completed/0004-fatia-1f-servidor-mcp/research/processo-mcp/raiz-do-projeto.md` — observação dos três processos, com diretórios de trabalho, presença da variável de ambiente e a consequência para o desenho.

#### Dúvidas respondidas

- **Q**: Como o servidor descobre o projeto? → **A**: Por parâmetro explícito da tool, validado antes de escrever. `process.cwd()` e variável de ambiente foram refutados por observação.
- **Q**: Quantas tools? → **A**: Uma, `setup`. A decisão original é que o suporte a MCP permanece extremamente enxuto.
- **Q**: A lógica é reescrita? → **A**: Não. `runSetup`, `detectEnvironment` e `readRecordFile` já são exportados e recebem a raiz por parâmetro desde a fatia 1b.
- **Q**: E `roots/list` do protocolo? → **A**: Registro anterior da mesma investigação indica que devolve a pasta que contém os projetos, e não o projeto. Serve como pista para sugerir um valor, nunca como resposta.

#### Dúvidas abertas

Nenhuma que bloqueie esta fatia.

### 3. Escopo e atores

#### Incluído

- Servidor MCP sobre transporte de entrada e saída padrão, expondo uma única tool chamada `setup`.
- Parâmetro `project_root` obrigatório, com esquema declarado ao cliente.
- Validação de que o caminho existe e contém marcador de projeto antes de qualquer escrita.
- Reuso da lógica da fatia 1b, sem duplicar tradução, detecção, escrita ou registro.
- Resposta estruturada com o mesmo conteúdo que o comando de terminal produz.
- Recusa explícita, sem escrita, quando o parâmetro falta ou o caminho é inválido.
- Entrada de execução do servidor, distinta do binário de terminal.

#### Fora de escopo

- Qualquer tool além de `setup`.
- Approval workflow, que é a fatia 1c.
- Detecção de backends de agente, que é a fatia 1d.
- Seleção de modelo, que é a fatia 1e.
- Alvos de editor além do Claude Code, herdado do escopo da fatia 1b.
- Transporte por rede. Apenas entrada e saída padrão.
- Escrever a configuração do próprio cliente MCP em arquivo de editor.

#### Atores

- **Agente de codificação dentro do editor**: aciona a tool e recebe o relatório.
- **Pessoa que configura o editor**: aponta o cliente MCP para o servidor e informa a raiz quando o agente pergunta.
- **Fatias 1c a 1e**: herdam o servidor como ponto de entrada, sem precisar recriá-lo.

### 4. Princípios e restrições do projeto

- **PR-001**: O servidor não deriva a raiz do projeto do próprio processo. Nem diretório de trabalho, nem variável de ambiente.
- **PR-002**: Recusar é preferível a adivinhar. Escrever na árvore errada é pior que não escrever.
- **PR-003**: A lógica não é duplicada. O servidor é fachada sobre o que a fatia 1b entregou.
- **PR-004**: Uma tool apenas. O suporte a MCP permanece enxuto por decisão de produto.

### 5. Histórias de usuário

#### US-001 — Acionar a configuração de dentro do editor

Como **agente de codificação**, quero **acionar `setup` pelo protocolo**, para **configurar o projeto sem que alguém precise abrir um terminal**.

**Por que P1**: É a razão da fatia. Sem ela a capacidade da 1b só existe para quem usa terminal.
**Teste independente**: Um cliente lista uma tool chamada `setup` e, ao acioná-la com raiz válida, recebe o relatório dos sete hooks instalados.
**Requisitos**: FR-001, FR-004, FR-005

#### US-002 — Escrever no projeto certo, ou em nenhum

Como **pessoa que configura o editor**, quero **que o servidor recuse quando não souber o projeto**, para **que ele nunca escreva numa árvore que eu não pedi**.

**Por que P1**: Três servidores observados tinham diretórios de trabalho errados, e o modo de falha é silencioso.
**Teste independente**: Sem `project_root`, a tool recusa nomeando o parâmetro. Com caminho sem marcador de projeto, recusa sem escrever. Com raiz válida, escreve apenas dentro dela, mesmo que o diretório de trabalho do processo aponte para outro lugar.
**Requisitos**: FR-002, FR-003, FR-006

#### US-003 — Obter do protocolo o mesmo que o terminal entrega

Como **agente de codificação**, quero **que os dois pontos de entrada concordem**, para **que o comportamento não dependa de por onde a configuração foi acionada**.

**Por que P1**: Duas implementações da mesma coisa divergem, e a divergência aparece como defeito intermitente.
**Teste independente**: Para a mesma raiz, o conteúdo devolvido pela tool e o produzido pelo comando de terminal descrevem os mesmos hooks, destinos e estado. Quando a operação fracassa, os dois relatam fracasso.
**Requisitos**: FR-004, FR-005

### 6. Cenários BDD de aceite

#### AC-001 — O cliente encontra exatamente uma tool

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-001
Feature: Superfície do servidor

  Scenario: A listagem devolve apenas setup
    Given o servidor em execução sobre entrada e saída padrão
    When um cliente lista as tools disponíveis
    Then existe exatamente uma
    And ela se chama setup
    And seu esquema declara project_root como obrigatório
```

#### AC-002 — Sem a raiz, a tool recusa

**Cobre**: US-002, FR-002, FR-006

```gherkin
@US-002 @FR-002 @FR-006 @AC-002
Feature: Recusa por parâmetro ausente

  Scenario: Acionar sem project_root não escreve nada
    Given o servidor em execução
    When o cliente aciona setup sem informar project_root
    Then a resposta indica erro
    And nomeia o parâmetro que faltou
    And nenhum arquivo é criado em lugar algum
```

#### AC-003 — Caminho que não é projeto é recusado

**Cobre**: US-002, FR-003, FR-006, NFR-001

```gherkin
@US-002 @FR-003 @FR-006 @NFR-001 @AC-003
Feature: Validação da raiz

  Scenario: Diretório sem marcador de projeto é recusado
    Given um diretório vazio, sem qualquer marcador de projeto
    When o cliente aciona setup informando esse caminho
    Then a resposta indica erro
    And explica que o caminho não aparenta ser um projeto
    And nenhum arquivo é criado nesse diretório
```

#### AC-004 — Com raiz válida, instala e relata

**Cobre**: US-001, FR-004, FR-005

```gherkin
@US-001 @FR-004 @FR-005 @AC-004
Feature: Configuração pelo protocolo

  Scenario: A tool instala os sete hooks na raiz informada
    Given um projeto com evidência de uso do alvo
    When o cliente aciona setup informando a raiz desse projeto
    Then a resposta lista os sete hooks com seus eventos
    And o arquivo de configuração do alvo existe dentro dessa raiz
    And o registro de instalação existe dentro dessa raiz
```

#### AC-005 — Escreve na raiz informada, e não no diretório do processo

**Cobre**: US-002, FR-002, NFR-001, NFR-003

```gherkin
@US-002 @FR-002 @NFR-001 @NFR-003 @AC-005
Feature: Independência do diretório de trabalho

  Scenario: O diretório do processo aponta para outro lugar
    Given o processo do servidor com diretório de trabalho fora do projeto
    And um projeto válido em caminho diferente
    When o cliente aciona setup informando o caminho do projeto
    Then os arquivos aparecem dentro do projeto informado
    And nada é criado no diretório de trabalho do processo
```

#### AC-006 — O protocolo entrega o mesmo que o terminal

**Cobre**: US-003, FR-004, FR-005, NFR-002

```gherkin
@US-003 @FR-004 @FR-005 @NFR-002 @AC-006
Feature: Paridade entre os pontos de entrada

  Scenario: Os dois caminhos descrevem o mesmo resultado
    Given dois projetos idênticos em raízes distintas
    When um é configurado pelo comando de terminal
    And o outro é configurado pela tool, informando sua raiz
    Then os hooks instalados coincidem em nome e evento
    And os registros coincidem em alvo e quantidade de entradas
```

#### AC-007 — Reexecutar pelo protocolo também é idempotente

**Cobre**: US-003, FR-004, NFR-002

```gherkin
@US-003 @FR-004 @NFR-002 @AC-007
Feature: Idempotência pelo protocolo

  Scenario: A segunda chamada reconhece o estado
    Given um projeto já configurado pela tool
    When o cliente aciona setup outra vez sobre a mesma raiz
    Then a resposta informa que já estava configurado
    And o registro continua com sete entradas
```

#### AC-008 — Nada é lido do ambiente do processo

**Cobre**: US-002, FR-002, NFR-001, NFR-003

```gherkin
@US-002 @FR-002 @NFR-001 @NFR-003 @AC-008
Feature: Independência do ambiente

  Scenario: Variáveis de projeto no ambiente não influenciam a escrita
    Given o ambiente do processo apontando para um projeto
    And a tool acionada com a raiz de outro projeto
    When a configuração termina
    Then os arquivos aparecem apenas na raiz informada pela tool
    And o projeto indicado pelo ambiente permanece intocado
```

#### AC-009 — Falha da lógica chega ao cliente como falha

**Cobre**: US-001, US-003, FR-005, FR-006

```gherkin
@US-001 @US-003 @FR-005 @FR-006 @AC-009
Feature: Propagação de falha

  Scenario: Um erro durante a configuração não vira sucesso
    Given uma raiz válida em que a escrita não pode ocorrer
    When o cliente aciona setup sobre ela
    Then a resposta indica erro
    And descreve o que impediu a operação
    And não afirma que a configuração foi concluída
```

#### AC-010 — A fatia não entrega capacidade de outra

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-010
Feature: Limite da fatia

  Scenario: Nenhuma superfície das fatias restantes aparece
    Given o servidor em execução
    When o cliente lista as tools
    Then não existe tool de aprovação, detecção de agente ou seleção de modelo
    And a superfície do comando de terminal permanece com três comandos
```

#### AC-011 — Caminho inexistente é recusado

**Cobre**: US-002, FR-003, FR-006, NFR-001

```gherkin
@US-002 @FR-003 @FR-006 @NFR-001 @AC-011
Feature: Raiz que não existe

  Scenario: A tool recusa um caminho que não está no disco
    Given um caminho que não corresponde a nenhum diretório
    When o cliente aciona setup informando esse caminho
    Then a resposta indica erro
    And informa que o caminho não foi encontrado
    And nenhum diretório é criado para acomodá-lo
```

#### AC-012 — Caminho relativo não é resolvido contra o processo

**Cobre**: US-002, FR-002, FR-003, NFR-003

```gherkin
@US-002 @FR-002 @FR-003 @NFR-003 @AC-012
Feature: Caminho relativo

  Scenario: Um caminho relativo não vira caminho no diretório do processo
    Given o processo do servidor com diretório de trabalho num projeto qualquer
    When o cliente aciona setup informando um caminho relativo
    Then a tool não escreve nada dentro do diretório de trabalho do processo
    And a resposta indica erro pedindo caminho absoluto
```

#### AC-013 — O servidor se identifica ao cliente

**Cobre**: US-001, FR-001, NFR-002

```gherkin
@US-001 @FR-001 @NFR-002 @AC-013
Feature: Identificação do servidor

  Scenario: O cliente conclui o handshake
    Given o servidor iniciado sobre entrada e saída padrão
    When um cliente abre a sessão do protocolo
    Then o servidor declara seu nome
    And declara a mesma versão que o comando de terminal reporta
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O servidor deve identificar-se ao cliente com nome e versão e expor exatamente uma tool, chamada `setup`, sobre transporte de entrada e saída padrão, declarando seu esquema.
- **FR-002**: A tool deve receber a raiz do projeto por parâmetro obrigatório e usar apenas esse valor para decidir onde ler e escrever.
- **FR-003**: A tool deve validar que o caminho informado existe e contém marcador de projeto antes de qualquer escrita.
- **FR-004**: O servidor deve reusar a lógica da fatia 1b sem duplicá-la, chamando as funções já exportadas.
- **FR-005**: A tool deve devolver resposta estruturada descrevendo hooks instalados, destino e estado, equivalente ao que o comando de terminal produz.
- **FR-006**: A tool deve recusar sem escrever quando o parâmetro faltar, quando o caminho for inválido ou quando a operação falhar, descrevendo o motivo.

#### Não funcionais

- **NFR-001**: **Confinamento**. Nenhum arquivo é criado ou alterado fora da raiz informada. **Verificação**: comparação da árvore do diretório de trabalho do processo e de um projeto vizinho, antes e depois.
- **NFR-002**: **Paridade**. Para a mesma raiz, protocolo e terminal produzem o mesmo estado. **Verificação**: comparação de hooks instalados e do registro entre os dois caminhos.
- **NFR-003**: **Independência do processo**. A decisão de onde escrever não consulta diretório de trabalho nem variável de ambiente. **Verificação**: inspeção do código-fonte do servidor e execução com ambiente e diretório apontando para outro projeto.

#### Erros e casos-limite

- `project_root` ausente → recusar nomeando o parâmetro, sem escrita.
- Caminho inexistente → recusar informando que não foi encontrado.
- Caminho existente sem marcador de projeto → recusar explicando o critério aplicado.
- Caminho relativo → recusar pedindo caminho absoluto. Resolvê-lo exigiria uma base, e a única disponível ao processo é o diretório de trabalho, justamente a dependência que a fatia elimina.
- Alvo não detectado na raiz informada → devolver o mesmo relato de alvo ignorado que o terminal produz, sem tratar como erro.
- Falha de permissão durante a escrita → propagar como erro, jamais como sucesso parcial.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Fatias 1a e 1b concluídas, com 27 arquivos de teste e 94 casos.
- `runSetup` recebe `root` por parâmetro desde a fatia 1b, e `detectEnvironment` também.
- `readRecordFile` e `writeSettings` já operam sobre raiz explícita.
- Binário `common-rules` com três comandos, declarado em `bin` do manifesto.

#### Arquitetura e módulos

| Módulo | Responsabilidade | Arquivo |
| --- | --- | --- |
| Validação de raiz | Confirmar existência e marcador de projeto | `src/mcp/root.ts` |
| Definição da tool | Esquema, nome e execução | `src/mcp/tool.ts` |
| Servidor | Registrar a tool e servir sobre entrada e saída padrão | `src/mcp/server.ts` |
| Entrada de execução | Ponto de partida do processo do servidor | `src/mcp/main.ts` |

A validação vive separada da tool porque é a única regra nova desta fatia, e precisa ser exercitável sem protocolo. A tool não implementa configuração: chama `runSetup` com a raiz validada.

#### Migrations

Não aplicável. A fatia não introduz persistência.

#### Models

Parâmetro da tool, com `project_root`. Resultado da tool, com relato, hooks e estado. Ambos em `src/mcp/tool.ts`.

#### Controllers e casos de uso

`src/mcp/tool.ts` concentra o caso de uso e `src/mcp/server.ts` o registra. Não há autorização: o cliente já é confiável por estar configurado pela pessoa.

#### Views e experiência

Não aplicável. A seção 10 registra a ausência de interface.

#### Queries e repositórios

Não aplicável.

#### Jobs e processamento assíncrono

O servidor é de vida longa e atende chamadas sob demanda. Não há fila nem trabalho em segundo plano.

#### Estrutura de arquivos

```text
src/mcp/
  root.ts
  tool.ts
  server.ts
  main.ts
tests/
  mcp-fixtures.ts
  mcp-root.test.ts
  mcp-tool-missing-root.test.ts
  mcp-tool-invalid-root.test.ts
  mcp-tool-install.test.ts
  mcp-confinement.test.ts
  mcp-parity.test.ts
  mcp-idempotent.test.ts
  mcp-environment.test.ts
  mcp-failure.test.ts
  mcp-surface.test.ts
```

### 9. Modelo de dados

Não aplicável. A fatia não persiste informação própria; o que se grava é a configuração e o registro que a fatia 1b já definiu.

### 10. Interfaces e contratos

#### Interface para pessoas

**Não há interface para pessoas.** A entrega é um processo que fala um protocolo com o editor. Quem interage é o agente, e a pessoa apenas aponta o cliente para o servidor.

#### APIs expostas

Uma tool, `setup`, sobre transporte de entrada e saída padrão. Parâmetro obrigatório `project_root`, do tipo texto. Resposta estruturada com relato, lista de hooks e estado. Erros são devolvidos como falha da tool, com mensagem que nomeia a causa.

#### APIs externas utilizadas

Nenhuma em tempo de execução. O SDK do protocolo é dependência de biblioteca, não serviço remoto.

#### Documentação das APIs consultadas

Metadados de `@modelcontextprotocol/sdk`, versão 1.30.0, obtidos do registro npm em 2026-08-24.

#### Eventos e outros contratos

Não aplicável.

### 11. Estratégia TDD

- **Unidade**: validação de raiz, com caminhos construídos em diretório temporário.
- **Integração**: execução da tool contra projetos descartáveis, verificando o disco.
- **Contrato**: forma da listagem de tools e do esquema declarado.
- **Confinamento**: execução com diretório de trabalho e ambiente apontando para outro projeto, conferindo que nada aparece lá.
- **Runner**: Vitest, pelo script `test:tdd`.
- **Verificação manual**: nenhuma.

O ponto sensível desta fatia não é o protocolo: é o confinamento. A observação que originou `R-001` mostra que o processo servidor tende a rodar com diretório de trabalho errado, e o defeito correspondente é silencioso. Por isso `AC-005` e `AC-008` exigem que os testes rodem com diretório e ambiente deliberadamente apontados para outro lugar, e confiram que esse outro lugar permanece intocado. Verificar apenas que o projeto certo recebeu arquivos não distingue confinamento de coincidência.

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Comando de verificação | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Contrato | listagem de tools do servidor | **Passed** — mcp-surface, 7 casos, T017 |
| FR-001 | AC-010 | Contrato | ausência de tools das fatias restantes | **Passed** — mcp-surface, 7 casos, T017 |
| NFR-002 | AC-010 | Contrato | superfície do terminal inalterada | **Passed** — mcp-surface, 7 casos, T017 |
| FR-001 | AC-013 | Contrato | o servidor declara nome e versão | **Passed** — mcp-surface, 7 casos, T017 |
| FR-002 | AC-002 | Integração | recusa sem `project_root` | **Passed** — mcp-tool-missing-root, 3 casos, T016 |
| FR-002 | AC-005 | Confinamento | escreve na raiz informada | **Passed** — mcp-confinement, 3 casos, T016 |
| FR-002 | AC-008 | Confinamento | ambiente não influencia | **Passed** — mcp-environment, 3 casos, T016 |
| FR-003 | AC-003 | Unidade | validação recusa diretório vazio | **Passed** — mcp-tool-invalid-root e mcp-root, 3 e 8 casos, T016 |
| FR-003 | AC-011 | Unidade | validação recusa caminho inexistente | **Passed** — mcp-root, 8 casos, T015 |
| FR-003 | AC-012 | Unidade | validação recusa caminho relativo | **Passed** — mcp-root, 8 casos, T015 |
| FR-004 | AC-004 | Integração | reuso de `runSetup` sem duplicação | **Passed** — mcp-tool-install, 3 casos, T016 |
| FR-004 | AC-006 | Integração | paridade com o terminal | **Passed** — mcp-parity, 3 casos, T016 |
| FR-004 | AC-007 | Integração | idempotência pelo protocolo | **Passed** — mcp-idempotent, 3 casos, T016 |
| FR-005 | AC-004 | Integração | resposta lista hooks e destino | **Passed** — mcp-tool-install, 3 casos, T016 |
| FR-005 | AC-006 | Integração | resposta equivale à do terminal | **Passed** — mcp-parity, 3 casos, T016 |
| FR-005 | AC-009 | Integração | falha chega como falha | **Passed** — mcp-failure, 3 casos, T016 |
| FR-006 | AC-002 | Integração | recusa sem escrever | **Passed** — mcp-tool-missing-root, 3 casos, T016 |
| FR-006 | AC-003 | Integração | recusa por caminho inválido | **Passed** — mcp-tool-invalid-root e mcp-root, 3 e 8 casos, T016 |
| FR-006 | AC-009 | Integração | erro não vira sucesso | **Passed** — mcp-failure, 3 casos, T016 |
| NFR-001 | AC-005 | Confinamento | nada fora da raiz informada | **Passed** — mcp-confinement, 3 casos, T016 |
| NFR-001 | AC-008 | Confinamento | projeto do ambiente intocado | **Passed** — mcp-environment, 3 casos, T016 |
| NFR-001 | AC-003 | Confinamento | nada escrito ao recusar | **Passed** — mcp-tool-invalid-root e mcp-root, 3 e 8 casos, T016 |
| NFR-002 | AC-006 | Integração | hooks e registro coincidem | **Passed** — mcp-parity, 3 casos, T016 |
| NFR-002 | AC-007 | Integração | idempotência coincide | **Passed** — mcp-idempotent, 3 casos, T016 |
| NFR-002 | AC-001 | Contrato | uma tool, como o produto decidiu | **Passed** — mcp-surface, 7 casos, T017 |
| NFR-002 | AC-013 | Contrato | versão coincide com a do terminal | **Passed** — mcp-surface, 7 casos, T017 |
| NFR-003 | AC-012 | Unidade | caminho relativo não usa o processo | **Passed** — mcp-root e `grep` sem ocorrência, T015 |
| US-003 | AC-009 | Integração | fracasso relatado nos dois caminhos | **Passed** — mcp-failure, 3 casos, T016 |
| NFR-003 | AC-008 | Confinamento | ambiente ignorado | **Passed** — mcp-environment, 3 casos, T016 |
| NFR-003 | AC-005 | Confinamento | diretório de trabalho ignorado | **Passed** — mcp-confinement, 3 casos, T016 |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-08-24), reconfirmado no aceite final em 2026-08-29
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/completed/0004-fatia-1f-servidor-mcp/spec.md`
- **Cobertura**: 3 US, 6 FR, 3 NFR, 13 AC, 6 DEC; mínimo de 3 AC por ID satisfeito, sem ID inexistente citado em `**Cobre**`.
- **Research**: `load_research.mjs` em `PASSED`, com `R-001` verificado e um artefato indexado.

**Achados da rodada de definição**

| ID | Achado | Severidade | Estado |
| --- | --- | --- | --- |
| D1 | O caso-limite de caminho relativo mandava "resolver contra o próprio caminho informado" — operação inexistente, já que resolver exige uma base — e contradizia `AC-012` | BLOCKER | Resolvido — o caso-limite recusa e explica que a única base disponível seria o diretório de trabalho |
| D2 | `AC-010` declarava cobrir `NFR-003` sem que nenhum passo tocasse diretório de trabalho ou ambiente | BLOCKER | Resolvido — declaração movida para `NFR-002`, que o cenário exercita |
| D3 | `AC-013` verificava identificação que `FR-001` não enunciava | WARNING | Resolvido — `FR-001` passou a exigi-la |
| D4 | A lente de arquitetura confirma que `DEC-001` repousa em `R-001`, e não em preferência de desenho | NOTE | Aceito |

**Achados do aceite final**

| ID | Achado | Severidade | Estado |
| --- | --- | --- | --- |
| A1 | Os comentários de evidência das quatro tarefas `[CODE]` listavam FR, NFR e AC, mas omitiam os IDs de história que os próprios títulos declaram. Sob `--full-chain`, que é como o enforcement do repositório roda, as três histórias apareciam com a cadeia quebrada em `evidence` | BLOCKER | Resolvido — cada tarefa passou a declarar as histórias que de fato serve, e a cadeia fecha para os 25 IDs |
| A2 | `zod` entrou como dependência direta durante a entrega, mas a decisão vivia apenas na narrativa do Gate do Ato II, e não na seção 17 | WARNING | Resolvido — registrada como `DEC-006` |
| A3 | A estrutura de arquivos da seção 8 omitia `tests/mcp-fixtures.ts`, usado pelos dez arquivos de teste | NOTE | Resolvido — acrescentado |
| A4 | A SPEC-0003 quebra a cadeia em `AC-010` a `AC-013` sob `--full-chain`, pelo mesmo defeito de A1. Condição preexistente: `git status` confirma que nenhuma spec concluída foi tocada por esta fatia | WARNING | Aberto — corrigi-la reabriria os gates de uma spec concluída, e a decisão é de quem responde pelo produto |

**Sobre A1.** O defeito só apareceu porque o `verify_repo` roda o trace com `--kinds US,FR,NFR,AC --full-chain`, enquanto a execução simples do auditor não o faz. As duas invocações do mesmo script davam respostas diferentes sobre a mesma spec, e a mais fraca foi a que eu usei durante a entrega. Rodar o enforcement no aceite, e não só o auditor isolado, é o que separou uma coisa da outra.

#### Gate do Ato II — Plano

- **Resultado**: Passed (2026-08-24)
- **Comando**: `node .claude/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/completed/0004-fatia-1f-servidor-mcp/spec.md`
- **Plano**: 21 tarefas — 13 `[TEST] [TDD]`, 4 `[CODE]`, 2 `[DOC]`, 2 `[OPS]`; 105 itens de checklist; 25 de 25 IDs cobertos.
- **RED**: `npm run test:tdd` com dez arquivos novos reprovando por `Cannot find module` sobre `src/mcp/root`, `src/mcp/tool` e `src/mcp/server`, e os 94 casos anteriores verdes. 39 casos marcados com `TRACEABILITY`, cobrindo os treze `AC`.
- **Rastreabilidade**: `check_traceability.mjs` em 25/25 IDs cobertos sobre 38 arquivos de teste.

**Sobre a dependência.** `@modelcontextprotocol/sdk` entrou fixado em 1.30.0. A inspeção de `server/zod-compat.d.ts` mostrou que `inputSchema` aceita apenas esquema zod — `AnySchema = z3.ZodTypeAny | z4.$ZodType` —, sem porta de entrada para esquema JSON puro. Por isso `zod` foi declarada direta e fixa em 3.25.76, a mesma que o SDK resolve, em vez de consumida por resolução transitiva, que a regra de fixação do projeto não alcançaria.

**Regressão encontrada e corrigida.** `tests/manifest.test.ts` comparava as dependências do manifesto por igualdade de conjunto contra os dois subsistemas npm. FR-004 da SPEC-0002 exige que os dois estejam declarados em versão exata, e não que sejam as únicas dependências do projeto; a igualdade fixava um retrato da entrega e reprovaria qualquer biblioteca acrescentada depois. A asserção passou a exigir presença e versão exata de cada subsistema. É a terceira ocorrência deste padrão registrada no repositório, depois das três asserções da Phase 0 que comparavam `HEAD` em vez da raiz e da contagem fixa de comandos da SPEC-0002.

**Colisão de IDs, agora com custo.** `check_traceability.mjs` acusa dois marcadores órfãos: o sétimo requisito funcional declarado pela SPEC-0002 e o oitavo declarado pela SPEC-0003. Ambos são legítimos em suas specs, e seus testes vivem na mesma árvore que os desta fatia. Os identificadores não são grafados aqui porque o extrator do validador varre o corpo inteiro e passaria a cobrá-los como requisitos desta spec. O auditor varre `tests/` sem saber a que spec pertence cada marcador, de modo que apenas a spec com o maior conjunto de IDs consegue ficar limpa. A limitação já constava do aceite da SPEC-0003; esta é a primeira vez que ela aparece durante o trabalho, e não só na auditoria final.

#### Gate do Ato III — Entrega

- **Resultado**: Passed (2026-08-29)
- **Verificação**: `npm run test:tdd` em exit 0, com **133 casos em 37 arquivos**; `npx tsc --noEmit` e `npm run build` em exit 0; `npm run verify` em exit 0 a partir de clone limpo, em 5s contra orçamento de 300; diretório pessoal com 42 entradas antes e depois da suíte.
- **Auditorias**: `verify_acceptance` em `QA: PASSED`; `verify_evidence` em `PASSED (strict)`; `load_research` em `PASSED`; `build_documentation --check` em exit 0; monitor de contexto em `CURRENT`.
- **Handshake por subprocesso**: um cliente ligado a `dist/mcp/main.js` obtém nome `common-rules`, versão `1.0.0`, exatamente uma tool chamada `setup` e `project_root` declarado obrigatório. O transporte em memória da suíte e o subprocesso exercitam código diferente, e só o segundo prova cabeçalho executável, caminho compilado e declaração do binário ao mesmo tempo.
- **Confinamento**: `mcp-confinement` e `mcp-environment` rodam com diretório de trabalho e variável de ambiente apontando para um segundo projeto real, e conferem que esse projeto permanece intocado. Verificar apenas que a raiz informada recebeu arquivos não distinguiria confinamento de coincidência.

**Rastreabilidade com ressalva conhecida.** `check_traceability` acusa dois marcadores órfãos: o sétimo requisito funcional declarado pela SPEC-0002 e o oitavo declarado pela SPEC-0003. Ambos são legítimos em suas specs, e seus testes vivem na mesma árvore que os desta fatia; o auditor varre `tests/` sem saber a que spec pertence cada marcador. A cobertura desta fatia é de 25 de 25 IDs. É a limitação registrada no aceite da SPEC-0003, e esta foi a primeira vez que ela apareceu durante o trabalho, e não só na auditoria final.

**Defeitos encontrados durante a entrega, e corrigidos.**

| Onde | Defeito | Correção |
| --- | --- | --- |
| `tests/manifest.test.ts` | Comparava as dependências por igualdade de conjunto contra os dois subsistemas, o que reprovaria qualquer biblioteca acrescentada depois | Passou a exigir presença e versão exata de cada subsistema, que é o que FR-004 da SPEC-0002 pede |
| `tests/mcp-parity.test.ts` | O fixture chamava `writeSettings` com dois argumentos, quando a assinatura pede três, e reescrevia o que `runSetup` já grava | Fixture corrigido; a asserção não mudou |
| `src/mcp/tool.ts` | A suíte ficou verde antes de o projeto compilar, porque o Vitest não checa tipos | Assinatura de índice acrescentada; `tsc` e `build` entraram no `VERIFY` de cada tarefa |
| `PROJECT.md` | Anunciava "Dois comandos" acima de uma tabela com três, defasado desde a SPEC-0003 | Corrigido para três comandos e um servidor de protocolo |
| Seções 2 e 13 desta spec | Caminhos apontavam para `specs/draft/`, defasados após duas transições de estado | Atualizados para o estado corrente |

#### Suposições

- O marcador de projeto é a presença de `.git`, `package.json` ou `.claude` na raiz informada. Reversível se a validação se mostrar frouxa ou estrita demais.
- O servidor ganha entrada própria em `src/mcp/main.ts`, e o manifesto passa a declarar um segundo binário. Alternativa reversível seria um subcomando do binário existente.
- `@modelcontextprotocol/sdk` entra como dependência de subsistema npm, em versão exata, seguindo DEC-002 da SPEC-0002.

#### Decisões abertas

Nenhuma que bloqueie esta fatia.

### 14. Tarefas

Formato:
`- [ ] TNNN [P?] [TIPO] [US-NNN?] Ação com caminho — Refs: IDs — Depends: IDs|none`

Checklist obrigatório por tarefa, na ordem `PREP`, `EXECUTE`, `VERIFY`, `EVIDENCE`, `IMPROVE`.

#### Fase 1 — Dependência

Precede o RED porque três cenários exercitam o handshake e a listagem, e para isso o teste precisa de um cliente do protocolo.

- [x] T001 [OPS] Fixar @modelcontextprotocol/sdk em 1.30.0 no package.json e instalar sem executar scripts — Refs: FR-001 — Depends: none
  - [x] **PREP**: Confirmar que 1.30.0 é a versão corrente no registro e que DEC-002 da SPEC-0002 exige fixação exata para subsistema npm.
  - [x] **EXECUTE**: Acrescentar `@modelcontextprotocol/sdk` às dependências com versão exata, sem intervalo, e instalar com `--ignore-scripts` conforme a regra já vigente.
  - [x] **VERIFY**: `npm ls` resolve `@modelcontextprotocol/sdk@1.30.0` e `zod@3.25.76`. A inspeção de `server/zod-compat.d.ts` mostra `AnySchema = z3.ZodTypeAny | z4.$ZodType`, isto é, `inputSchema` não aceita esquema JSON puro — daí zod entrar como dependência direta e fixa em vez de ser consumida por resolução transitiva.
  - [x] **EVIDENCE**: Comandos e versões resolvidas registrados na seção 12.
  - [x] **IMPROVE**: `tests/manifest.test.ts` reprovou ao comparar as dependências por igualdade de conjunto contra os dois subsistemas. FR-004 da SPEC-0002 exige que os dois estejam declarados e fixados, não que sejam os únicos; a igualdade fixava um retrato da entrega e proibiria qualquer biblioteca futura. A asserção passou a exigir presença e versão exata de cada subsistema, preservando a garantia real.

#### Fase 2 — RED, um caso por cenário da seção 6

Treze tarefas, uma por `AC`. Onde o arquivo de destino é compartilhado, a tarefa depende da anterior do mesmo arquivo e não recebe `[P]`; as demais executam em paralelo.

- [x] T002 [TEST] [TDD] [US-001] Derivar de AC-001 o caso em tests/mcp-surface.test.ts — Refs: US-001, FR-001, NFR-002, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-001 e fixar o critério: a listagem devolve exatamente uma tool, chamada `setup`, cujo esquema declara `project_root` como obrigatório.
  - [x] **EXECUTE**: Escrever o caso em `tests/mcp-surface.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, para que nenhum caso toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module '../src/mcp/server'`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 10 arquivos em RED e os 94 casos anteriores verdes; 7 casos marcados no arquivo. Registrado na seção 12.
  - [x] **IMPROVE**: Contar as tools e inspecionar o esquema declarado, em vez de conferir apenas que `setup` está presente: presença não exclui excedente.

- [x] T003 [P] [TEST] [TDD] [US-002] Derivar de AC-002 o caso em tests/mcp-tool-missing-root.test.ts — Refs: US-002, FR-002, FR-006, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-002 e fixar o critério: acionar sem `project_root` devolve erro que nomeia o parâmetro e não cria arquivo algum.
  - [x] **EXECUTE**: Escrever o caso em `tests/mcp-tool-missing-root.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, para que nenhum caso toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module '../src/mcp/tool'`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 10 arquivos em RED e os 94 casos anteriores verdes; 3 casos marcados no arquivo. Registrado na seção 12.
  - [x] **IMPROVE**: Fotografar a árvore antes e depois e comparar, porque um erro devolvido não prova que nada foi escrito antes dele.

- [x] T004 [P] [TEST] [TDD] [US-002] Derivar de AC-003 o caso em tests/mcp-tool-invalid-root.test.ts — Refs: US-002, FR-003, FR-006, NFR-001, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-003 e fixar o critério: um diretório vazio, sem marcador de projeto, é recusado com explicação do critério e sem escrita.
  - [x] **EXECUTE**: Escrever o caso em `tests/mcp-tool-invalid-root.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, para que nenhum caso toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module '../src/mcp/tool'`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 10 arquivos em RED e os 94 casos anteriores verdes; 3 casos marcados no arquivo. Registrado na seção 12.
  - [x] **IMPROVE**: Usar diretório temporário recém-criado, para que a ausência de marcador seja um fato do caso e não da máquina.

- [x] T005 [P] [TEST] [TDD] [US-001] Derivar de AC-004 o caso em tests/mcp-tool-install.test.ts — Refs: US-001, FR-004, FR-005, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-004 e fixar o critério: com raiz válida a tool instala os sete hooks e a resposta lista nome e evento de cada um.
  - [x] **EXECUTE**: Escrever o caso em `tests/mcp-tool-install.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, para que nenhum caso toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module '../src/mcp/tool'`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 10 arquivos em RED e os 94 casos anteriores verdes; 3 casos marcados no arquivo. Registrado na seção 12.
  - [x] **IMPROVE**: Conferir o disco além da resposta — foi exatamente a divergência entre relato e escrita que a fatia 1b descobriu tarde.

- [x] T006 [P] [TEST] [TDD] [US-002] Derivar de AC-005 o caso em tests/mcp-confinement.test.ts — Refs: US-002, FR-002, NFR-001, NFR-003, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-005 e fixar o critério: com o diretório de trabalho do processo apontando para fora, a escrita aparece só na raiz informada.
  - [x] **EXECUTE**: Escrever o caso em `tests/mcp-confinement.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, para que nenhum caso toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module '../src/mcp/tool'`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 10 arquivos em RED e os 94 casos anteriores verdes; 3 casos marcados no arquivo. Registrado na seção 12.
  - [x] **IMPROVE**: Apontar o diretório de trabalho para um segundo projeto real e conferir que ele fica intocado; conferir apenas o projeto certo não distingue confinamento de coincidência.

- [x] T007 [P] [TEST] [TDD] [US-003] Derivar de AC-006 o caso em tests/mcp-parity.test.ts — Refs: US-003, FR-004, FR-005, NFR-002, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-006 e fixar o critério: dois projetos idênticos, um configurado pelo terminal e outro pela tool, terminam com os mesmos hooks e registros.
  - [x] **EXECUTE**: Escrever o caso em `tests/mcp-parity.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, para que nenhum caso toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module '../src/mcp/tool'`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 10 arquivos em RED e os 94 casos anteriores verdes; 3 casos marcados no arquivo. Registrado na seção 12.
  - [x] **IMPROVE**: Comparar estruturas normalizadas, ignorando carimbo de tempo, que a fatia 1b já fixa em época zero.

- [x] T008 [P] [TEST] [TDD] [US-003] Derivar de AC-007 o caso em tests/mcp-idempotent.test.ts — Refs: US-003, FR-004, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-007 e fixar o critério: a segunda chamada sobre a mesma raiz informa que já estava configurado e mantém sete entradas.
  - [x] **EXECUTE**: Escrever o caso em `tests/mcp-idempotent.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, para que nenhum caso toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module '../src/mcp/tool'`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 10 arquivos em RED e os 94 casos anteriores verdes; 3 casos marcados no arquivo. Registrado na seção 12.
  - [x] **IMPROVE**: Passar o registro anterior de fato, já que a idempotência da fatia 1b só funciona quando ele é lido e repassado.

- [x] T009 [P] [TEST] [TDD] [US-002] Derivar de AC-008 o caso em tests/mcp-environment.test.ts — Refs: US-002, FR-002, NFR-001, NFR-003, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-008 e fixar o critério: com variável de projeto no ambiente apontando para outro lugar, só a raiz informada é escrita.
  - [x] **EXECUTE**: Escrever o caso em `tests/mcp-environment.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, para que nenhum caso toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module '../src/mcp/tool'`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 10 arquivos em RED e os 94 casos anteriores verdes; 3 casos marcados no arquivo. Registrado na seção 12.
  - [x] **IMPROVE**: Restaurar o ambiente ao fim do caso, para não contaminar os demais arquivos da suíte.

- [x] T010 [P] [TEST] [TDD] [US-001] Derivar de AC-009 o caso em tests/mcp-failure.test.ts — Refs: US-001, US-003, FR-005, FR-006, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-009 e fixar o critério: quando a escrita não pode ocorrer, a resposta indica erro e não afirma conclusão.
  - [x] **EXECUTE**: Escrever o caso em `tests/mcp-failure.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, para que nenhum caso toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module '../src/mcp/tool'`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 10 arquivos em RED e os 94 casos anteriores verdes; 3 casos marcados no arquivo. Registrado na seção 12.
  - [x] **IMPROVE**: Provocar a falha por permissão real em diretório temporário, e não por simulação, para que o caminho de erro exercitado seja o verdadeiro.

- [x] T011 [TEST] [TDD] [US-001] Derivar de AC-010 o caso em tests/mcp-surface.test.ts — Refs: US-001, FR-001, NFR-002, AC-010 — Depends: T002
  - [x] **PREP**: Ler o Gherkin de AC-010 e fixar o critério: a listagem não traz tool de aprovação, detecção de agente ou seleção de modelo, e o terminal segue com três comandos.
  - [x] **EXECUTE**: Escrever o caso em `tests/mcp-surface.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, para que nenhum caso toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module '../src/mcp/server'`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 10 arquivos em RED e os 94 casos anteriores verdes; 7 casos marcados no arquivo. Registrado na seção 12.
  - [x] **IMPROVE**: Derivar a expectativa da superfície declarada, não de uma lista literal que envelhece a cada fatia nova.

- [x] T012 [P] [TEST] [TDD] [US-002] Derivar de AC-011 o caso em tests/mcp-root.test.ts — Refs: US-002, FR-003, FR-006, NFR-001, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-011 e fixar o critério: um caminho que não existe é recusado sem que diretório algum seja criado para acomodá-lo.
  - [x] **EXECUTE**: Escrever o caso em `tests/mcp-root.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, para que nenhum caso toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module '../src/mcp/root'`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 10 arquivos em RED e os 94 casos anteriores verdes; 8 casos marcados no arquivo. Registrado na seção 12.
  - [x] **IMPROVE**: Conferir que o caminho continua ausente depois da chamada, e não só que houve erro.

- [x] T013 [TEST] [TDD] [US-002] Derivar de AC-012 o caso em tests/mcp-root.test.ts — Refs: US-002, FR-002, FR-003, NFR-003, AC-012 — Depends: T012
  - [x] **PREP**: Ler o Gherkin de AC-012 e fixar o critério: um caminho relativo é recusado pedindo caminho absoluto, sem escrever no diretório de trabalho do processo.
  - [x] **EXECUTE**: Escrever o caso em `tests/mcp-root.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, para que nenhum caso toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module '../src/mcp/root'`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 10 arquivos em RED e os 94 casos anteriores verdes; 8 casos marcados no arquivo. Registrado na seção 12.
  - [x] **IMPROVE**: Executar com o diretório de trabalho dentro de um projeto válido, onde resolver o relativo produziria escrita plausível e silenciosa.

- [x] T014 [TEST] [TDD] [US-001] Derivar de AC-013 o caso em tests/mcp-surface.test.ts — Refs: US-001, FR-001, NFR-002, AC-013 — Depends: T011
  - [x] **PREP**: Ler o Gherkin de AC-013 e fixar o critério: o handshake devolve nome do servidor e a mesma versão que o terminal reporta.
  - [x] **EXECUTE**: Escrever o caso em `tests/mcp-surface.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, para que nenhum caso toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module '../src/mcp/server'`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 10 arquivos em RED e os 94 casos anteriores verdes; 7 casos marcados no arquivo. Registrado na seção 12.
  - [x] **IMPROVE**: Comparar contra `readVersion()` em vez de literal, para que a expectativa não precise de edição a cada versão.

#### Fase 3 — Código, cada tarefa atrás do seu RED

- [x] T015 [CODE] [US-002] Implementar em src/mcp/root.ts — Refs: FR-003, NFR-003, AC-003, AC-011, AC-012 — Depends: T004, T012, T013
  - [x] **PREP**: RED confirmado em T004, T012 e T013; `docs/` reconstruído por `$framework-documentator` antes da alteração, com `build_documentation --check` em exit 0.
  - [x] **EXECUTE**: `src/mcp/root.ts` valida na ordem tipo, caminho absoluto, existência, ser diretório e conter marcador. Devolve `{ ok }` discriminado em vez de lançar, para que quem chama escolha como reportar. Os marcadores vivem em `PROJECT_MARKERS`.
  - [x] **VERIFY**: `npx vitest run tests/mcp-root.test.ts` com 8 de 8 aprovando, e a suíte inteira subindo de 94 para 102 casos. `npx tsc --noEmit` em exit 0. `grep` por `process.cwd`, `process.env`, `import.meta` e `node:process` no arquivo devolve apenas a linha de comentário que explica a ausência — nenhuma chamada.
  - [x] **EVIDENCE**: Comandos, contagens e o resultado do `grep` registrados na seção 12.
  - [x] **IMPROVE**: A primeira redação da recusa por caminho ausente dizia "não foi encontrado", e a asserção de `AC-011` casa `não encontrad`; o "foi" no meio quebrava o casamento. Corrigi a mensagem para `caminho não encontrado: <caminho>`, e não a asserção — afrouxar o teste para acomodar a redação teria fabricado GREEN.

  <!-- framework:evidence {"task": "T015", "refs": ["US-002", "FR-003", "NFR-003", "AC-003", "AC-011", "AC-012"], "files": ["src/mcp/root.ts"], "commands": [{"run": "npx vitest run tests/mcp-root.test.ts", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T016 [CODE] [US-002] Implementar em src/mcp/tool.ts — Refs: FR-002, FR-004, FR-005, FR-006, NFR-001, AC-002, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009 — Depends: T003, T005, T006, T007, T008, T009, T010, T015
  - [x] **PREP**: RED confirmado nas sete tarefas de teste e T015 em GREEN; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/mcp/tool.ts` declara o esquema com `project_root` obrigatório, valida por `validateRoot`, lê o registro anterior da raiz informada e chama `runSetup` passando essa raiz explicitamente. Converte o resultado em resposta estruturada com raiz, alvo, `changed` e a lista de hooks; envolve tudo em `try` e transforma falha em erro da tool.
  - [x] **VERIFY**: A suíte passa a 126 de 126 casos, com 36 dos 37 arquivos verdes; o único vermelho é `mcp-surface`, que espera `src/mcp/server.ts` de T017. `npx tsc --noEmit` em exit 0. Os dois cenários caros rodados isoladamente — `mcp-confinement` e `mcp-environment`, com diretório de trabalho e variável apontando para outro projeto — passam em 6 de 6.
  - [x] **EVIDENCE**: Comandos, contagens e a verificação da árvore vizinha registrados na seção 12.
  - [x] **IMPROVE**: O fixture de paridade chamava `writeSettings` com dois argumentos, quando a assinatura pede três, e escrevia de novo o que `runSetup` já grava. Corrigi o fixture, não a asserção. O defeito só apareceu porque o caso executa de verdade contra o disco; um teste que conferisse apenas o retorno teria passado com o fixture quebrado — que é exatamente o modo de falha descoberto na fatia 1b.

  <!-- framework:evidence {"task": "T016", "refs": ["US-002", "US-003", "FR-002", "FR-004", "FR-005", "FR-006", "NFR-001", "AC-002", "AC-004", "AC-005", "AC-006", "AC-007", "AC-008", "AC-009"], "files": ["src/mcp/tool.ts", "tests/mcp-parity.test.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T017 [CODE] [US-001] Implementar em src/mcp/server.ts — Refs: FR-001, NFR-002, AC-001, AC-010, AC-013 — Depends: T002, T011, T014, T016
  - [x] **PREP**: RED confirmado em T002, T011 e T014, e T016 em GREEN; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/mcp/server.ts` monta o `McpServer` com nome `common-rules` e a versão devolvida por `readVersion()`, e registra a única tool com esquema de entrada e de saída. A saída foi declarada depois de conferir no SDK que a validação de `structuredContent` roda apenas no caminho de sucesso e isenta a recusa, de modo que declarar a forma não impede a tool de reportar erro.
  - [x] **VERIFY**: A suíte fecha em 133 de 133 casos e 37 de 37 arquivos. `npx tsc --noEmit` e `npm run build` em exit 0, com `dist/mcp/` contendo os três módulos compilados.
  - [x] **EVIDENCE**: Comandos, contagens e o nome e versão do handshake registrados na seção 12.
  - [x] **IMPROVE**: A suíte ficou verde antes de o projeto compilar: o Vitest não checa tipos, e `tsc` reprovava porque o retorno da tool não tinha a assinatura de índice que o SDK exige. Verde na suíte não é prova de build. Passei a conferir `tsc` e `build` como parte do `VERIFY` desta fatia, e não apenas no fechamento.

  <!-- framework:evidence {"task": "T017", "refs": ["US-001", "FR-001", "NFR-002", "AC-001", "AC-010", "AC-013"], "files": ["src/mcp/server.ts", "src/mcp/tool.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T018 [CODE] [US-001] Implementar em src/mcp/main.ts e package.json — Refs: FR-001, AC-013 — Depends: T017
  - [x] **PREP**: T017 em GREEN; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/mcp/main.ts` liga o servidor ao transporte de entrada e saída padrão, com o mesmo cabeçalho executável de `src/cli.ts`. O manifesto passou a declarar o segundo binário `common-rules-mcp`, apontando para `dist/mcp/main.js`.
  - [x] **VERIFY**: `npm run build` em exit 0, o cabeçalho executável sobrevive à compilação, e um cliente ligado ao binário por subprocesso real conclui o handshake: nome `common-rules`, versão `1.0.0`, exatamente uma tool chamada `setup`, com `project_root` declarado obrigatório. A suíte segue em 133 de 133.
  - [x] **EVIDENCE**: Comandos, exit codes e a resposta do handshake por subprocesso registrados na seção 12.
  - [x] **IMPROVE**: A verificação foi feita por subprocesso, e não pelo transporte em memória que a suíte usa. Os dois caminhos exercitam código diferente, e só o subprocesso prova que o cabeçalho executável, o caminho em `dist/` e a declaração do binário estão corretos ao mesmo tempo.

  <!-- framework:evidence {"task": "T018", "refs": ["US-001", "FR-001", "AC-013"], "files": ["src/mcp/main.ts", "package.json"], "commands": [{"run": "npm run build", "exit": 0}, {"run": "npm run test:tdd", "exit": 0}]} -->

#### Fase 4 — Fechamento

- [x] T019 [DOC] Registrar servidor, módulos e dependência em .project-context/STACK.md — Refs: FR-001 — Depends: T018
  - [x] **PREP**: Mudanças de estrutura conferidas: quatro arquivos em `src/mcp/`, duas dependências novas e um segundo binário.
  - [x] **EXECUTE**: `.project-context/STACK.md` ganhou a linha do binário `common-rules-mcp` e a seção `Servidor do protocolo`, com a responsabilidade de cada um dos quatro módulos. As duas dependências já haviam entrado durante T015, quando o monitor as cobrou antes do previsto.
  - [x] **VERIFY**: `build_documentation --check` em exit 0 e o monitor de contexto em `CURRENT`.
  - [x] **EVIDENCE**: Comandos e exit codes registrados na seção 12.
  - [x] **IMPROVE**: A seção registra por que a raiz é parâmetro, citando a observação dos três servidores em execução, para que a decisão não precise ser redescoberta na próxima fatia que tocar o protocolo.

- [x] T020 [DOC] Mover o servidor MCP para as capacidades em PROJECT.md — Refs: US-001 — Depends: T018
  - [x] **PREP**: Localizada a declaração do servidor como ausente na seção `O que ainda não existe`.
  - [x] **EXECUTE**: O servidor passou para `O que existe hoje`, dizendo que expõe a mesma lógica do terminal e exige a raiz por parâmetro, com o motivo.
  - [x] **VERIFY**: `build_documentation --check` em exit 0, e a afirmação conferida contra a superfície real: o binário compilado responde ao handshake com uma tool.
  - [x] **EVIDENCE**: Comando, exit code e o trecho alterado registrados na seção 12.
  - [x] **IMPROVE**: O arquivo anunciava `Dois comandos, e nada além disso` logo acima de uma tabela com três, defasado desde que a SPEC-0003 acrescentou o `setup`. Corrigido para três comandos e um servidor de protocolo. É a mesma classe de defeito das asserções que fixam um retrato da entrega, agora em prosa: uma contagem escrita à mão envelhece sem que nada avise.

- [x] T021 [OPS] Fechar o Delivery Gate na seção 13 de specs/completed/0004-fatia-1f-servidor-mcp/spec.md, com a suíte completa e o confinamento exercitado — Refs: NFR-001, NFR-002, NFR-003 — Depends: T019, T020
  - [x] **PREP**: Vinte tarefas anteriores concluídas, e cada `[CODE]` com seu comentário de evidência.
  - [x] **EXECUTE**: Suíte completa, `npm run verify`, e os auditores de aceite, evidência, rastreabilidade e research.
  - [x] **VERIFY**: 133 de 133 casos em 37 arquivos; `tsc` e `build` em exit 0; `verify` em exit 0 a partir de clone limpo, em 5s; diretório pessoal com 42 entradas antes e depois.
  - [x] **EVIDENCE**: Comandos, contagens, exit codes e a contagem do diretório pessoal registrados na seção 13.
  - [x] **IMPROVE**: O `load_research` reprovou porque o índice de artefatos ainda apontava para `specs/draft/`, e a spec já havia andado duas pastas de estado. Corrigi também os dois comandos de gate e o título de T021, que carregavam o mesmo defeito. Vale registrar que o índice exige caminho desde a raiz do repositório enquanto o campo `Evidence` do `R-001` exige caminho relativo à spec: são regras diferentes no mesmo arquivo, e só uma execução do auditor revela isso.

### 15. Ordem de execução

`T001` primeiro e sozinho: os cenários de handshake e listagem precisam de um cliente do protocolo, que só existe depois da dependência instalada.

Em seguida a Fase 2. Dez tarefas trazem `[P]` e podem correr juntas por escreverem em arquivos distintos. As quatro restantes compartilham destino: `T002 → T011 → T014` em `tests/mcp-surface.test.ts`, e `T012 → T013` em `tests/mcp-root.test.ts`.

A Fase 3 segue a direção da dependência entre módulos, e não a ordem dos requisitos. `T015` é o único sem predecessor de código, porque a validação de raiz não conhece protocolo nem configuração. `T016` a consome, `T017` registra o que `T016` produz, e `T018` apenas expõe `T017`.

Caminho crítico: `T001 → T004 → T015 → T016 → T017 → T018 → T019 → T021`. Oito das vinte e uma tarefas, e ele passa por `T004` porque a validação de raiz é o predecessor de tudo que escreve.

O fechamento admite paralelismo entre `T019` e `T020`, que tocam arquivos diferentes, mas ambos precisam de `T018` concluída para descrever a superfície real em vez da planejada.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Fatias 1a e 1b concluídas, que fornecem a lógica e a resolução de dependências.
- `@modelcontextprotocol/sdk` 1.30.0, disponível no registro npm.

#### Riscos

- **O servidor escrever na árvore errada** → configuração aparece num projeto que ninguém pediu, e o relato diz sucesso. É o defeito que `R-001` documenta. Mitigação: parâmetro obrigatório, validação antes de escrever, e `AC-005` e `AC-008` exercitando com diretório e ambiente apontados para outro lugar.
- **Validação de raiz frouxa** → um diretório qualquer passa por projeto. Mitigação: `AC-003` fixa a recusa de diretório sem marcador, e o critério está registrado como suposição reversível.
- **Divergência entre os dois pontos de entrada** → o comportamento passa a depender de por onde foi acionado. Mitigação: `NFR-002` e `AC-006` comparam o estado produzido pelos dois.
- **Falha silenciosa virando sucesso** → o cliente conclui que configurou quando não configurou. Mitigação: `AC-009` exige que erro chegue como erro.
- **O SDK mudar de interface** → a fachada quebra numa atualização. Mitigação: versão exata, conforme a regra de fixação já vigente.

#### Suposições

Registradas na seção 13, todas reversíveis nesta fatia.

### 17. Decisões

- **DEC-001**: A raiz do projeto é parâmetro obrigatório da tool. *Razão*: a observação de três servidores em execução mostrou dois com o diretório pessoal como diretório de trabalho e um apontando para outro projeto; nenhum tinha a raiz correta. *Alternativas descartadas*: `process.cwd()` e variável de ambiente, ambos refutados pela mesma observação; `roots/list` do protocolo, que registro anterior indica devolver a pasta que contém os projetos.
- **DEC-002**: A tool recusa quando não pode confirmar a raiz. *Razão*: escrever na árvore errada é pior que não escrever, e o modo de falha é silencioso. Recusar produz um erro que a pessoa vê; adivinhar produz um sucesso que ela não confere.
- **DEC-003**: O servidor é fachada e não reimplementa nada. *Razão*: a lógica da fatia 1b tem 94 testes, e duplicá-la criaria duas verdades que divergem com o tempo. `runSetup` já recebe a raiz por parâmetro, de modo que a fachada é fina por construção.
- **DEC-004**: Uma tool apenas. *Razão*: decisão de produto registrada desde a captura inicial, de que o suporte a MCP permanece extremamente enxuto enquanto a linha de comando é o produto.
- **DEC-006**: `zod` entra como dependência direta, fixada em 3.25.76. *Razão*: decidida durante a implementação, ao descobrir que `inputSchema` do SDK aceita apenas esquema zod — `AnySchema = z3.ZodTypeAny | z4.$ZodType` —, sem porta para esquema JSON puro. A versão é a mesma que o SDK resolve, e declará-la direta a coloca sob a regra de fixação exata; consumi-la por resolução transitiva a deixaria fora dessa regra. *Registrada aqui no aceite*, porque a decisão nasceu na entrega e estava documentada apenas na narrativa do Gate do Ato II.
- **DEC-005**: A validação de raiz vive em módulo próprio. *Razão*: é a única regra nova da fatia e precisa ser exercitável sem subir servidor nem falar protocolo.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação registrada na seção 12.
- [x] Todas as tarefas da seção 14 estão concluídas.
- [x] O confinamento foi exercitado com diretório de trabalho e ambiente apontando para outro projeto, e esse outro projeto permanece intocado.
- [x] A paridade com o comando de terminal foi conferida sobre projetos equivalentes.
- [x] O código do servidor não contém leitura de diretório de trabalho nem de variável de ambiente para decidir onde escrever.
- [x] `.project-context/STACK.md` registra o servidor, seus módulos e a dependência do SDK.
- [x] `PROJECT.md` move o servidor MCP da lista de ausências para a de capacidades.
