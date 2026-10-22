# Especificação integrada: Fatia 1b: setup que liga subsistemas e protege o repositório

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0003 |
| Slug | 0003-fatia-1b-setup-hooks |
| Status | Complete |
| Effort | 6 |
| Effort updated at | 2026-08-24 |
| Effort rationale | Tradução de sete hooks para formato nativo, com três bloqueantes cujo erro de escape é falha de segurança silenciosa. A v0.2.8 gastou 494 linhas nisso e registrou dois defeitos críticos no caminho. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — a entrega é um comando de terminal que escreve arquivos de configuração, sem tela. |
| Atualizada em | 2026-08-24 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

A fatia 1a entregou um esqueleto que verifica dependências e não faz mais nada. `context-mode` e `code-review-graph` estão instalados e alcançáveis, mas nada os liga ao ciclo de vida do agente: nenhum evento os aciona, e eles permanecem inertes enquanto o agente trabalha.

O repositório também está desprotegido. Comando destrutivo, vazamento de credencial para o transcrito e atribuição indevida de autoria em commit dependem hoje de o agente ler orientação e cooperar. A v0.2.8 já havia concluído que orientação não basta, e registrou isso em ADR-005: hooks disparam a partir do editor e valem tenha o agente lido algo ou não.

Há ainda um problema de rastro. Quando uma ferramenta escreve configuração na máquina de alguém, precisa dizer o que escreveu. Sem esse registro não há como reexecutar com segurança, auditar o que mudou, nem desfazer.

#### Resultado desejado

`common-rules setup` liga os subsistemas e instala as proteções, uma vez, de forma auditável.

Ao fim da fatia, executar o comando num projeto que evidencia uso de Claude Code instala sete hooks no formato nativo do editor, grava um registro nomeando cada um com destino e versão, e reexecutar não duplica nada. Num projeto sem essa evidência, nada é escrito e o comando relata o que ignorou e por quê.

O valor não é a instalação em si. É que a partir daqui `context-mode` recebe o que precisa sem configuração manual, e as três proteções valem independentemente de cooperação.

#### Métricas de sucesso

- Os sete hooks ficam instalados no formato nativo do alvo, e o editor os reconhece.
- O registro nomeia cada hook instalado, seu destino, sua versão e a data.
- Uma segunda execução não altera nada e reporta que já estava configurado.
- Num projeto sem evidência de Claude Code, nenhum arquivo é escrito e o motivo é relatado.
- Os três hooks bloqueantes recusam o comando que deveriam recusar, verificado por execução e não por leitura do texto gerado.
- Nenhum arquivo é escrito fora do projeto.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] Os sete hooks portados declaram três eventos canônicos e três deles são bloqueantes — Verdict: verified — Confidence: high — Evidence: research/hooks-v028/README.md#dimensionamento-observado — Budget: 1/1.

A leitura das fontes congeladas mostrou `before-shell` em quatro hooks, `after-file-edit` em dois e `stop` em um, com `blocking: true` em `guard-destructive`, `guard-secrets` e `protect-authorship`. A mesma leitura mediu o custo da tradução e motivou separar o servidor MCP para a fatia 1f.

#### Fontes e contexto consultados

- `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md`, seção de decisões da fatia 1b.
- Branch `archived`, commit `aac477a`: os sete hooks, `service/hook_service.py` e `mcp_server.py`.
- `specs/completed/0002-phase-1a-esqueleto-typescript/spec.md`, pela stack e pelas camadas de dependência.
- `.project-context/STACK.md` e `.project-context/RULES.md`.

#### Documentação consultada

Nenhuma documentação externa. As fontes são do próprio repositório, congeladas em `archived`.

#### Artefatos de pesquisa armazenados

- `specs/completed/0003-fatia-1b-setup-hooks/research/hooks-v028/` — cópias literais dos sete hooks portados, mais um índice com proveniência, dimensionamento medido e a justificativa dos três descartados. Código do próprio projeto; a fonte normativa continua sendo este `spec.md`.

#### Dúvidas respondidas

- **Q**: O que o `setup` configura, se não há mais recursos com placeholders? → **A**: Liga subsistemas ao ciclo do agente e protege o repositório. É o que só o `common-rules` pode fazer: ele não reimplementa `context-mode`, mas é quem o conecta.
- **Q**: Quais hooks? → **A**: Sete dos dez da v0.2.8. Os três de orquestração ficam com o `framework`, porque pressupõem o kit de recursos removido na Phase 0.
- **Q**: O `setup` guarda estado? → **A**: Guarda registro do que fez, para ser idempotente e auditável. Não guarda cache de resolução de dependências, que divergiria do sistema real.
- **Q**: Quantos alvos de editor? → **A**: Apenas Claude Code, com detecção. Cursor e Antigravity viram fatia própria.
- **Q**: O servidor MCP entra aqui? → **A**: Não. O dimensionamento mostrou dois subsistemas independentes numa fatia só. O MCP vira a fatia 1f e expõe a lógica já funcionando.

#### Dúvidas abertas

Nenhuma que bloqueie esta fatia.

### 3. Escopo e atores

#### Incluído

- Comando `common-rules setup`, que instala os sete hooks no alvo detectado.
- Tradução de cada hook do formato canônico para o formato nativo do Claude Code, cobrindo os três eventos declarados e a semântica de bloqueio.
- Detecção de evidência de uso do alvo, com recusa silenciosa de escrever quando ausente e relato do que foi ignorado.
- Registro de instalação, nomeando hook, destino, versão e data.
- Idempotência: reexecutar reconhece o que existe e não duplica.
- Ponte `uv` explícita, que cria a cópia local de `code-review-graph` quando ausente das duas origens.
- Comando `common-rules setup --dry-run`, que relata o que faria sem escrever.

#### Fora de escopo

- Servidor MCP e a tool `setup` sobre protocolo. É a fatia 1f.
- Approval workflow. É a fatia 1c.
- Detecção de backends de agente e a lista de suportados. É a fatia 1d.
- Seleção de modelo. É a fatia 1e.
- Tradução para Cursor, Antigravity ou qualquer alvo além do Claude Code.
- Os três hooks de orquestração, devolvidos ao `framework`.
- Desinstalação. O registro a torna possível, mas o comando pertence a fatia posterior.
- Publicar o pacote no npm.

#### Atores

- **Pessoa que configura um projeto**: executa o comando uma vez e passa a ter subsistemas ligados e proteções ativas.
- **Agente de codificação**: tem seu ciclo interceptado pelos hooks, sem precisar ler ou cooperar.
- **Pessoa que administra a máquina**: lê o registro para saber o que foi escrito, onde e quando.
- **Fatias 1c a 1f**: herdam o registro e o mecanismo de detecção.

### 4. Princípios e restrições do projeto

- **PR-001**: Nada é escrito fora do projeto. O ambiente global pertence ao playbook.
- **PR-002**: A ferramenta não escreve em alvo sem evidência de uso. Silêncio é preferível a configuração indesejada num editor que a pessoa não usa.
- **PR-003**: Hook bloqueante é código de segurança. Seu comportamento é verificado por execução do comando que ele deve recusar, nunca por inspeção do texto gerado.
- **PR-004**: O `setup` é idempotente. Reexecutar é seguro e não produz efeito acumulado.
- **PR-005**: `common-rules` não reimplementa subsistema. Liga o que existe.

### 5. Histórias de usuário

#### US-001 — Ligar os subsistemas ao ciclo do agente

Como **pessoa que configura um projeto**, quero **que `context-mode` e `code-review-graph` sejam acionados pelos eventos do agente**, para **que operem sem eu configurar cada integração à mão**.

**Por que P1**: É a razão de existir do wrapper. Sem isso os subsistemas estão instalados e inertes.
**Teste independente**: Após o comando, o arquivo de configuração do alvo contém as quatro entradas de integração, nos eventos que cada hook declara.
**Requisitos**: FR-001, FR-002, FR-005

#### US-002 — Proteger o repositório sem depender de cooperação

Como **pessoa responsável pelo repositório**, quero **guardrails e proteção de autoria que disparem do editor**, para **que comando destrutivo, vazamento de credencial e autoria indevida sejam barrados mesmo que o agente ignore qualquer orientação**.

**Por que P1**: A v0.2.8 concluiu em ADR-005 que orientação não basta, e registrou defeito crítico quando o escape de um guard foi consumido duas vezes e todos passaram a permitir tudo.
**Teste independente**: Com os hooks instalados, um comando destrutivo e um comando que exibiria credencial são recusados; um comando comum sobre os mesmos arquivos continua permitido.
**Requisitos**: FR-003, FR-006

#### US-003 — Saber o que a ferramenta escreveu

Como **pessoa que administra a máquina**, quero **um registro do que foi instalado**, para **reexecutar com segurança, auditar o que mudou e poder desfazer**.

**Por que P1**: Escrever configuração sem deixar rastro impede reexecução segura e torna a reversão adivinhação.
**Teste independente**: O registro nomeia os sete hooks com destino, versão e data; uma segunda execução o lê, reconhece o estado e não altera nada.
**Requisitos**: FR-004, FR-005, FR-007

### 6. Cenários BDD de aceite

#### AC-001 — Os quatro hooks de integração ficam instalados

**Cobre**: US-001, FR-001, FR-002, FR-004, NFR-001

```gherkin
@US-001 @FR-001 @FR-002 @FR-004 @NFR-001 @AC-001
Feature: Ligação dos subsistemas

  Scenario: O alvo passa a acionar context-mode e code-review-graph
    Given um projeto com evidência de uso do alvo
    When a pessoa executa o comando de configuração
    Then a configuração do alvo contém as quatro entradas de integração
    And cada uma aparece sob o evento que o hook declara
    And o registro de instalação passa a existir dentro do projeto
    And nenhum arquivo fora do projeto é escrito
```

#### AC-002 — Os três hooks bloqueantes recusam o que devem recusar

**Cobre**: US-002, FR-003, FR-006

```gherkin
@US-002 @FR-003 @FR-006 @AC-002
Feature: Proteção que não depende de cooperação

  Scenario: Comando destrutivo e exibição de credencial são recusados
    Given os hooks bloqueantes instalados
    When o script do guard recebe um comando que apaga diretório sem confirmação
    Then ele recusa, com código de saída de bloqueio
    When o script do guard recebe um comando que exibiria um arquivo de credencial
    Then ele recusa
    And a recusa é observada executando o script, e não lendo seu texto
```

#### AC-003 — Trabalho comum continua permitido

**Cobre**: US-002, FR-003, FR-006

```gherkin
@US-002 @FR-003 @FR-006 @AC-003
Feature: Guardrail estreito

  Scenario: Comandos ordinários sobre os mesmos arquivos passam
    Given os hooks bloqueantes instalados
    When o script do guard recebe um comando que edita um arquivo de credencial
    Then ele permite, porque editar não é exibir
    When o script do guard recebe uma remoção comum de arquivo dentro do projeto
    Then ele permite
```

#### AC-004 — O registro nomeia o que foi escrito

**Cobre**: US-003, FR-001, FR-004, FR-005

```gherkin
@US-003 @FR-001 @FR-004 @FR-005 @AC-004
Feature: Rastro da instalação

  Scenario: Cada hook instalado aparece no registro
    Given uma configuração recém-executada
    When a pessoa inspeciona o registro
    Then os sete hooks aparecem nomeados
    And cada entrada declara destino, versão e data
    And o registro fica dentro do projeto
    And nomeia o alvo que a detecção escolheu
```

#### AC-005 — Reexecutar não duplica

**Cobre**: US-003, FR-005, FR-007, FR-008, NFR-002

```gherkin
@US-003 @FR-005 @FR-007 @FR-008 @NFR-002 @AC-005
Feature: Idempotência

  Scenario: A segunda execução reconhece o estado e não altera nada
    Given uma configuração já executada
    When a pessoa executa o comando outra vez
    Then a configuração do alvo permanece idêntica
    And o relato informa que já estava configurado
    And o registro não ganha entrada duplicada
    And a ponte não recria a cópia local que já existe
```

#### AC-006 — Sem evidência do alvo, nada é escrito

**Cobre**: US-001, FR-001, FR-008, NFR-001

```gherkin
@US-001 @FR-001 @FR-008 @NFR-001 @AC-006
Feature: Recusa de configurar alvo não usado

  Scenario: Projeto sem sinal de uso do alvo permanece intocado
    Given um projeto sem qualquer evidência de uso do alvo
    When a pessoa executa o comando de configuração
    Then nenhum arquivo de configuração é criado
    And o relato nomeia o alvo ignorado e a evidência que faltou
    And o comando encerra sem erro, porque não configurar não é falha
    And nenhuma cópia local de subsistema é criada
```

#### AC-007 — A execução seca não escreve

**Cobre**: US-003, FR-004, FR-005, FR-007, NFR-002

```gherkin
@US-003 @FR-004 @FR-005 @FR-007 @NFR-002 @AC-007
Feature: Ensaio antes de escrever

  Scenario: O modo de ensaio relata sem alterar
    Given um projeto com evidência de uso do alvo e sem configuração
    When a pessoa executa o comando em modo de ensaio
    Then o relato lista os sete hooks que seriam instalados e seus destinos
    And nenhum arquivo é criado ou alterado
    And o registro não é gravado
```

#### AC-008 — A ponte cria a cópia local quando falta

**Cobre**: US-001, FR-008, NFR-001

```gherkin
@US-001 @FR-008 @NFR-001 @AC-008
Feature: Ponte para o subsistema Python

  Scenario: A ferramenta ausente das duas origens é criada dentro do projeto
    Given code-review-graph ausente do projeto e do PATH
    When a pessoa executa a ponte
    Then a cópia é criada dentro do projeto, na versão fixada
    And nada é escrito no ambiente global
    And a verificação de dependências passa a resolvê-la com origem local
```

#### AC-009 — A tradução preserva a semântica de bloqueio

**Cobre**: US-002, FR-002, FR-003, FR-006, NFR-003

```gherkin
@US-002 @FR-002 @FR-003 @FR-006 @NFR-003 @AC-009
Feature: Fidelidade da tradução

  Scenario: Hook declarado bloqueante chega bloqueante ao alvo
    Given os sete hooks no formato canônico
    When a tradução para o formato nativo termina
    Then os três declarados bloqueantes produzem entrada que interrompe a ação
    And os quatro não bloqueantes produzem entrada que observa sem interromper
    And nenhum conteúdo de script é escapado mais de uma vez
```

#### AC-010 — O escape sobrevive à ida e à volta

**Cobre**: US-002, FR-002, FR-006, NFR-003

```gherkin
@US-002 @FR-002 @FR-006 @NFR-003 @AC-010
Feature: Guarda contra escape duplo

  Scenario: O script chega ao alvo idêntico ao original
    Given um hook cujo script contém aspas, barras invertidas e cifrões
    When ele é traduzido e depois lido de volta do arquivo de configuração
    Then o fragmento aparece dentro do comando recuperado, byte a byte
    And o invólucro fornece HOOK_COMMAND a partir do JSON do evento
    And o invólucro emite a decisão que o fragmento definiu
    And o guard recuperado continua recusando o comando que a fonte recusava
```

#### AC-011 — A fatia não entrega capacidade de outra

**Cobre**: US-001, US-003, FR-001, FR-005

```gherkin
@US-001 @US-003 @FR-001 @FR-005 @AC-011
Feature: Limite da fatia

  Scenario: Nenhuma superfície das fatias seguintes aparece
    Given o binário compilado
    When a pessoa lista os comandos disponíveis
    Then existem identificação de versão, verificação de dependências e configuração
    And não existe servidor MCP, aprovação, detecção de agente ou seleção de modelo
```

#### AC-012 — O registro permite desfazer o que foi feito

**Cobre**: US-003, FR-004, FR-007, NFR-002

```gherkin
@US-003 @FR-004 @FR-007 @NFR-002 @AC-012
Feature: Reversibilidade pelo registro

  Scenario: Cada entrada aponta algo que existe e pode ser removido
    Given uma configuração executada e registrada
    When a pessoa percorre as entradas do registro
    Then cada uma nomeia um caminho que existe
    And o hook nomeado está presente naquele caminho
    When as entradas são removidas exatamente como o registro as descreve
    Then a configuração do alvo volta ao estado anterior
    And executar a configuração de novo reinstala os sete
```

#### AC-013 — Os sete hooks reais sobrevivem à ida e à volta

**Cobre**: US-002, FR-002, FR-005, NFR-003

```gherkin
@US-002 @FR-002 @FR-005 @NFR-003 @AC-013
Feature: Fidelidade sobre o corpus real

  Scenario: Nenhum dos sete se corrompe na tradução
    Given os sete hooks portados, com seus scripts originais
    When cada um é traduzido e lido de volta do arquivo de configuração
    Then os sete fragmentos aparecem dentro dos comandos recuperados, byte a byte
    And nenhum ganhou ou perdeu barra invertida, aspa ou cifrão
    And a comparação cobre o corpus real, e não apenas um exemplo construído
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O comando deve detectar evidência de uso do alvo e escrever configuração somente quando ela existir, relatando o alvo ignorado e a evidência ausente quando não existir.
- **FR-002**: O comando deve traduzir cada hook do formato canônico para o formato nativo do alvo, preservando o evento declarado e embutindo o fragmento do hook sem alteração alguma dentro do invólucro que o torna executável.
- **FR-003**: O comando deve preservar a semântica de bloqueio: hook declarado bloqueante interrompe a ação no alvo, e hook não bloqueante apenas observa.
- **FR-004**: O comando deve gravar, dentro do projeto, um registro nomeando cada hook instalado, seu destino, sua versão e a data.
- **FR-005**: O comando deve instalar os sete hooks portados, sem instalar os três devolvidos ao `framework`.
- **FR-006**: Os três hooks bloqueantes devem recusar a ação que protegem e permitir trabalho ordinário sobre os mesmos arquivos.
- **FR-007**: O comando não deve produzir efeito que a pessoa não pediu: reexecutar sobre estado já configurado deixa tudo inalterado e relata essa condição, e o modo de ensaio relata o que faria sem escrever nada.
- **FR-008**: O comando deve oferecer a ponte que cria a cópia local de `code-review-graph` na versão fixada, dentro do projeto, quando ela estiver ausente das duas origens, sem escrever no ambiente global.

#### Não funcionais

- **NFR-001**: **Isolamento**. Nenhum arquivo é criado ou alterado fora do projeto. **Verificação**: comparação da árvore do diretório pessoal antes e depois da execução, em ambiente controlado.
- **NFR-002**: **Reversibilidade**. O registro identifica cada escrita com precisão suficiente para desfazê-la. **Verificação**: para cada entrada do registro, o caminho existe e contém o hook nomeado.
- **NFR-003**: **Fidelidade da tradução**. O script entregue ao alvo é idêntico ao da fonte canônica. **Verificação**: comparação byte a byte após ida e volta, incluindo aspas, barras invertidas e cifrões.

#### Erros e casos-limite

- Alvo detectado mas configuração existente escrita por outra ferramenta → preservar o conteúdo alheio, acrescentar apenas as entradas próprias e registrar o que foi preservado. Nunca sobrescrever bloco de terceiro.
- Registro presente mas configuração ausente, por remoção manual → reinstalar e relatar a divergência, em vez de confiar no registro.
- Registro corrompido ou ilegível → tratar como ausente e reinstalar, sem apagar o arquivo anterior.
- `uv` ausente ao acionar a ponte → recusar nomeando a ferramenta e o motivo, sem tentar instalar.
- Permissão negada no destino → recusar sem escrita parcial; configuração pela metade é pior que nenhuma.
- Script de hook contendo caractere que o formato do alvo interpreta → tratado por NFR-003; a v0.2.8 registrou defeito crítico exatamente aqui, com escape consumido duas vezes fazendo todos os guards permitirem tudo.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- Branch `refactor/v1-cli-first`, com o esqueleto da fatia 1a: `src/cli.ts`, `src/doctor.ts`, `src/version.ts`, 207 linhas.
- `src/cli.ts` já despacha por argumento e exporta `COMMANDS`; `src/doctor.ts` já resolve dependências com ordem local antes de global e expõe `Environment` injetável.
- Vitest com escopo restrito a `tests/`, treze arquivos, 43 casos.
- Os sete hooks portados estão em `research/hooks-v028/`, com frontmatter YAML declarando `kind`, `name`, `description`, `event` e `blocking`.

#### Arquitetura e módulos

| Módulo | Responsabilidade | Arquivo |
| --- | --- | --- |
| Leitura de hook | Ler frontmatter e corpo, devolver estrutura tipada | `src/hooks/source.ts` |
| Tradução | Converter estrutura canônica no formato nativo do alvo | `src/hooks/claude-code.ts` |
| Detecção de alvo | Decidir se há evidência de uso, sem escrever | `src/hooks/detect.ts` |
| Registro | Ler, gravar e comparar o registro de instalação | `src/setup/record.ts` |
| Orquestração do setup | Encadear detecção, tradução, escrita e registro | `src/setup/run.ts` |
| Ponte Python | Criar a cópia local do subsistema Python | `src/setup/bridge.ts` |

A tradução não escreve arquivo e a escrita não traduz. Essa separação é o que permite verificar a fidelidade do escape sem tocar o sistema de arquivos, e é a lição direta do defeito da v0.2.8, em que escape e escrita estavam no mesmo caminho e o duplo consumo passou despercebido.

#### Migrations

Não aplicável. A fatia não introduz persistência de domínio.

#### Models

Estrutura de hook, com nome, descrição, evento, bloqueio e corpo do script. Entrada de registro, com hook, destino, versão e data. Ambas em `src/hooks/source.ts` e `src/setup/record.ts`.

#### Controllers e casos de uso

`src/setup/run.ts` concentra o caso de uso, e `src/cli.ts` ganha o despacho do novo comando. Sem autorização: a operação é local e explícita.

#### Views e experiência

Não aplicável. A seção 10 registra a ausência de interface.

#### Queries e repositórios

Não aplicável.

#### Jobs e processamento assíncrono

Não aplicável. Toda a operação é síncrona.

#### Estrutura de arquivos

```text
src/
  cli.ts
  doctor.ts
  version.ts
  hooks/
    source.ts
    claude-code.ts
    detect.ts
  setup/
    run.ts
    record.ts
    bridge.ts
tests/
  hooks-source.test.ts
  hooks-translate.test.ts
  hooks-escape.test.ts
  hooks-blocking.test.ts
  setup-detect.test.ts
  setup-record.test.ts
  setup-idempotent.test.ts
  setup-dryrun.test.ts
  setup-isolation.test.ts
  setup-bridge.test.ts
  setup-surface.test.ts
```

### 9. Modelo de dados

Não aplicável como persistência de domínio. O registro de instalação é estado operacional da própria ferramenta, descrito na seção 8 e verificado por AC-004.

### 10. Interfaces e contratos

#### Interface para pessoas

**Não há interface para pessoas.** A entrega é um comando de terminal que escreve arquivos de configuração e imprime um relato. Não existe tela, formulário ou navegação a especificar.

#### APIs expostas

Nenhuma. O servidor MCP, que seria a superfície de protocolo, pertence à fatia 1f.

#### APIs externas utilizadas

Nenhuma em tempo de execução. A ponte Python invoca `uv` como subprocesso local, e a detecção lê o sistema de arquivos do projeto.

#### Documentação das APIs consultadas

Nenhuma. As fontes são internas, congeladas em `archived`.

#### Eventos e outros contratos

Os três eventos canônicos que os hooks portados declaram — `before-shell`, `after-file-edit` e `stop` — e seu mapeamento para os nomes que o alvo usa. O mapeamento é contrato desta fatia e vive em `src/hooks/claude-code.ts`.

### 11. Estratégia TDD

- **Unidade**: leitura de frontmatter, tradução, decisão de detecção e comparação de registro, todas com entrada em memória.
- **Integração**: escrita em diretório temporário, com o sistema de arquivos injetado para que nenhum teste toque o projeto real ou o diretório pessoal.
- **Contrato**: fidelidade do escape, verificada por ida e volta byte a byte.
- **Execução**: os três guards exercitados como subprocesso, recebendo o comando que devem recusar e o comando que devem permitir.
- **Runner**: Vitest, pelo script `test:tdd`, conforme DEC-003 da SPEC-0002.
- **Verificação manual**: nenhuma.

O ponto sensível é o mesmo que derrubou a v0.2.8. Verificar que o texto gerado contém a string esperada não prova que o guard bloqueia: o defeito registrado à época passou por revisão porque o arquivo parecia certo, e só apareceu quando alguém executou. Por isso AC-002 e AC-003 exigem execução do script, e AC-010 exige comparação byte a byte.

### 12. Plano de testes e rastreabilidade

#### Evidência T021 a T023 — fechamento — 2026-08-24

| Verificação | Resultado |
| --- | --- |
| `npm run verify` em clone limpo | exit 0 — install 4s, build 0s, test 2s, total **6s** de 300 |
| Suíte | **27 arquivos, 94 testes, todos aprovando** |
| `build_documentation --check` | exit 0 |
| Diretório pessoal antes e depois | inalterado |
| Módulos citados no `STACK.md` | todos existem, conferido por script |
| Comandos citados no `PROJECT.md` | todos existem no binário |

**Defeito principal: o comando relatava instalação e não escrevia nada.** `runSetup` calculava a lista de caminhos escritos e devolvia tudo pronto, mas não continha uma única chamada de escrita. O clone limpo mostrou `.claude/settings.json` e `.common-rules/install.json` ausentes depois de `setup` reportar sete hooks instalados.

Os oitenta e nove testes existentes não pegaram porque **todos verificavam o retorno da função, e nenhum conferia o disco**. É a mesma classe de vazio que a SPEC-0002 encontrou nas asserções que passavam sobre conjunto vazio: a verificação media o que era conveniente medir. `src/setup/write.ts` passou a gravar, preservando chave de terceiro no arquivo do alvo, e `tests/setup-writes.test.ts` verifica o disco em projeto descartável.

**Defeito secundário: a idempotência não valia na prática.** O despacho chamava a orquestração sem passar o registro anterior, de modo que a comparação de `matches` nunca era exercitada pelo binário. O resultado em disco era idempotente por efeito da fusão, mas o relato dizia "instalados" a cada execução e o registro ganhava data nova. O despacho passou a ler o registro, e a segunda execução relata `já estava configurado`.

Ambos atravessaram sete tarefas de implementação. Nenhum teria sido encontrado sem executar o produto a partir de um clone limpo, que é a razão de T023 existir.


#### Evidência T020 — despacho e conflito com a fatia 1a — 2026-08-24

`npx tsc --noEmit`, `npm run build`, `npm run test:tdd` e `build_documentation --check` em exit 0. **Suíte inteira verde: 26 arquivos, 89 testes.**

Saída real do binário:

```text
$ common-rules setup
7 hooks instalados em .claude/settings.json
  code-review-graph-update — evento PostToolUse, em .claude/settings.json
  context-mode-posttooluse — evento PostToolUse, em .claude/settings.json
  context-mode-pretooluse — evento PreToolUse, em .claude/settings.json
  context-mode-stop — evento Stop, em .claude/settings.json
  guard-destructive — evento PreToolUse, em .claude/settings.json
  guard-secrets — evento PreToolUse, em .claude/settings.json
  protect-authorship — evento PreToolUse, em .claude/settings.json
                                                          (exit 0)

$ common-rules setup            # em projeto sem evidência do alvo
alvo claude-code ignorado: sem evidência de uso de claude-code; nenhum de
.claude/settings.json, .claude/settings.local.json, .claude/ está presente
                                                          (exit 0)
```

**Conflito com a fatia 1a, resolvido em `$framework-update-spec`.** Ao entregar `setup`, `tests/surface.test.ts` da SPEC-0002 reprovou: ela afirmava que o esqueleto tinha **exatamente** dois comandos e listava `setup` entre os proibidos.

A asserção estava certa sobre a entrega daquela fatia e errada como invariante. O que a 1a queria garantir era que o esqueleto não contrabandeasse orquestração, aprovação ou seleção de modelo; o que ela escreveu foi um retrato do momento, que passa a mentir assim que o produto cresce. `AC-010` da SPEC-0002 e seu teste passaram a afirmar a propriedade, e `setup` saiu da lista de proibidos porque deixou de ser futuro.

É a terceira ocorrência do mesmo padrão nesta sessão, depois das três asserções da Phase 0 que comparavam `HEAD` de uma branch que cresce. Asserção que descreve um instante da entrega envelhece mal; a que descreve a propriedade sobrevive.


#### Evidência T019 — orquestração do setup — 2026-08-24

`npx tsc --noEmit`, `npm run build` e `build_documentation --check` em exit 0. Os seis arquivos que ainda não carregavam passaram a carregar e aprovam: a suíte foi de 65 para **89 testes, com 87 aprovando**, e 25 de 26 arquivos ficaram verdes. As duas reprovações restantes são de `setup-surface.test.ts`, que aguarda o despacho de T020.

| Caminho | Comportamento observado |
| --- | --- |
| Instalação | sete hooks, escrevendo `.claude/settings.json` e `.common-rules/install.json` |
| Ensaio | sete planejados, zero escritos, registro nulo |
| Reexecução com registro anterior | relata inalterado, registro segue com sete entradas |
| Sem evidência do alvo | relata o alvo ignorado e o que faltou, e sai com zero |

O último merece nota: sair com zero é deliberado, porque `AC-006` fixa que não configurar não é falha. Um projeto que não usa o alvo não tem problema algum a resolver, e tratá-lo como erro faria a integração contínua reprovar por uma condição normal.

A carga dos hooks resolve `hooks/` a partir do módulo compilado, e não do diretório de trabalho. Resolver pelo diretório corrente faria o comando depender de onde foi invocado, e ele precisa funcionar de qualquer subdiretório do projeto.


#### Evidência T018 — ponte para o subsistema Python — 2026-08-24

`npx tsc --noEmit`, `npm run build` e `build_documentation --check` em exit 0. `setup-bridge.test.ts` passou a carregar e seus quatro casos aprovam; a suíte foi de 61 para 65 testes, com 63 aprovando.

| Estado do ambiente | Instalaria | Escreve no global | Recusa |
| --- | --- | --- | --- |
| cópia local presente | nada | não | não |
| presente só no `PATH` | nada | não | não |
| ausente nas duas origens, com `uv` | `code-review-graph==2.3.7` | não | não |
| ausente nas duas origens, sem `uv` | nada | não | sim, nomeando `uv` |

`touchesGlobal` é falso nos quatro. A ponte usa ambiente virtual dentro do projeto e nunca `uv tool install`, que gravaria em `~/.local/share/uv/tools/`, fora dele. O ambiente da máquina é gerido por um playbook declarativo cuja regra é que nada se instala manualmente, e uma ferramenta que instalasse por conta própria disputaria com a única fonte da verdade do ambiente em vez de informá-la.

A ponte devolve o especificador em vez de instalar por padrão. O ambiente virtual custa cerca de 262 MB, medidos durante o refinamento da fatia, e criá-lo sem pedido explícito surpreenderia quem só queria configurar hooks.


#### Evidência T017 — registro de instalação — 2026-08-24

`npx tsc --noEmit`, `npm run build` e `build_documentation --check` em exit 0. O registro foi exercitado em memória:

| Verificação | Resultado |
| --- | --- |
| Caminho | `.common-rules/install.json`, dentro do projeto |
| Ida e volta | preserva o conteúdo sem perda |
| Entradas a remover | duas, cada uma com destino, evento e nome |
| Mesmo conjunto e mesma versão | reconhece |
| Versão diferente | recusa |
| Conjunto diferente | recusa |
| Registro ausente | recusa |

A comparação recusa por versão além de por conjunto. Sem isso, uma instalação feita por versão anterior do pacote seria tomada por atual, e a idempotência de `AC-005` viraria a omissão de uma atualização necessária.

Cada entrada guarda o evento além do caminho, porque desfazer exige localizar a entrada dentro do arquivo do alvo. Apagar o arquivo destruiria configuração de terceiro que a escrita preservou, e a seção 7 exige preservá-la.


#### Dois verificadores que discordam, encontrado em T016

Ao fechar T016, `monitor_context --check` retornou `CURRENT` enquanto `build_documentation --check` retornava exit 1, e `docs/application.md` não mencionava `src/hooks/detect.ts`. A documentação estava desatualizada e um dos dois verificadores dizia que não.

A causa aparente é o que cada um mede. O monitor avalia caminhos alterados em relação ao git, de modo que, depois de um commit, ele deixa de ver mudança pendente e responde `CURRENT` mesmo com a projeção defasada. O `--check` do documentator compara a projeção com as fontes, e é esse que responde à pergunta que interessa.

O efeito prático atravessa a sessão inteira: `CURRENT` foi tratado como prova de documentação atual em várias tarefas, e não é. A partir daqui, fechar tarefa exige `build_documentation --check` em exit 0, e o monitor passa a ser sinal complementar.

É a terceira vez nesta sessão que rodar uma ferramenta foi confundido com verificar o que ela produz — depois do `--check` do documentator lido como atestado de qualidade e do `tsc` que emitia `dist/` mesmo reprovando.


#### Evidência T016 — detecção do alvo — 2026-08-24

`npx tsc --noEmit` e `npm run build` em exit 0. A decisão foi exercitada contra cinco ambientes injetados:

| Caso | Resultado |
| --- | --- |
| `.claude/settings.json` presente | reconhece, nomeando a evidência |
| apenas o diretório `.claude/` | reconhece |
| nada presente | recusa, nomeando o que faltou |
| sinalizador presente e nenhum arquivo | recusa |
| arquivo presente e sinalizador ausente | recusa |

Os dois últimos são os ambíguos, e ambos recusam. Reconhecer o alvo com base em apenas metade da evidência levaria a escrever configuração num editor que a pessoa talvez não use, e AC-006 fixa que não configurar não é falha.

`setup-detect.test.ts` continua em RED porque importa `src/setup/run`, que só existe em T019. É a mesma decomposição de peças e ligação da fatia 1a, e fica declarado em vez de silenciado.


#### Evidência T014 e T015 — leitura e tradução — 2026-08-24

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Tipos | `npx tsc --noEmit` | exit 0 |
| Compilação | `npm run build` | exit 0 |
| Suíte | `npm run test:tdd` | 59 de 61 aprovando; os quatro arquivos de `hooks/` em GREEN |
| Guard executado | `bash` com o script traduzido e o JSON do evento no stdin | `rm -rf /` sai com 2 e a mensagem do guard; `rm dist/cli.js` sai com 0 |

**O corpus mudou de lugar.** Os sete hooks estavam sendo lidos de `specs/<estado>/…/research/`, e os testes quebraram com `ENOENT` na transição de `defined` para `in-progress`. O caminho de uma spec muda conforme ela avança, de modo que código não pode depender dele: `specs/` é registro, não fonte. O corpus passou para `hooks/` na raiz do pacote, declarado em `files` do manifesto, e a cópia em `research/` permanece como evidência de proveniência.

**O preâmbulo extrai o comando em vez de casar contra o JSON.** O evento bruto carrega prosa — mensagem de commit, prompt — e um guard que dispara sobre texto que apenas menciona `rm -rf` atrapalha trabalho comum. Guard que atrapalha é desligado, e depois não guarda coisa alguma. A v0.2.8 registrou essa lição e o preâmbulo a preserva.


#### Contrato de fragmento, descoberto na implementação

O bloco de código dentro do Markdown de cada hook é **fragmento, e não script completo**. Ele lê variáveis que alguém precisa fornecer e comunica por variáveis que alguém precisa emitir:

| Fornecido pelo invólucro | Definido pelo fragmento |
| --- | --- |
| `HOOK_INPUT`, o JSON bruto do evento | `decision`, entre `allow`, `ask` e `deny` |
| `HOOK_COMMAND`, extraído desse JSON | `message`, uma linha explicando a decisão |
| `HOOK_FILE`, `HOOK_EVENT`, `HOOK_TRANSCRIPT`, `PROJECT_DIR` | |

O fragmento de `guard-destructive` termina no último `fi` sem imprimir nada: sozinho, ele nunca bloquearia coisa alguma.

A redação anterior de `AC-010` e `AC-013` exigia que o script recuperado fosse **idêntico** ao original. Com invólucro, ele é **contido**. A exigência de fidelidade não afrouxou: continua sendo byte a byte, agora sobre o fragmento embutido, que é onde o defeito da v0.2.8 morava.

A descoberta veio de executar o guard e vê-lo devolver zero para `rm -rf /`. O dimensionamento anterior lera frontmatter e eventos, e não o contrato de execução — ler estrutura não é o mesmo que ler comportamento.


#### Evidência T001 a T013 — asserções em RED — 2026-08-24

Treze arquivos em `tests/`, um por cenário da seção 6. `npm run test:tdd` reprova os treze e mantém verdes os treze da fatia 1a.

| Origem do RED | Arquivos | Natureza |
| --- | --- | --- |
| Módulo inexistente | onze | `src/hooks/source`, `claude-code`, `detect`, `src/setup/run`, `record`, `bridge` |
| Asserção nomeada | `setup-surface.test.ts` | `COMMANDS` expõe `doctor` e `version`, e o esperado é `doctor`, `setup` e `version` |

Nenhum RED decorre de sintaxe, importação malformada ou ambiente. Onze arquivos falham na carga porque o módulo sob teste ainda não existe, que é o RED canônico de um ciclo test-first, e um falha com asserção nomeada porque `src/cli.ts` já existe desde a fatia 1a.

**Os guards são exercitados por execução.** `hooks-blocking.test.ts` e `hooks-permissive.test.ts` escrevem o script do hook num diretório temporário, dão permissão de execução e o rodam como subprocesso, medindo o código de saída. Verificar que o texto gerado contém a string esperada não provaria bloqueio: foi assim que o defeito crítico da v0.2.8 passou por revisão. Os dois arquivos formam par, recusar o perigoso e permitir o ordinário, e nenhum passa sozinho.

**O corpus real é usado, e não apenas um exemplo construído.** `hooks-escape.test.ts` usa um script deliberadamente hostil, com aspas simples e duplas, barras invertidas, cifrões e substituição de comando. `hooks-corpus.test.ts` percorre os sete hooks portados e compara byte a byte, mais a contagem de caracteres hostis em cada um. Um exemplo construído prova que o caso pensado funciona; o corpus prova que o caso não pensado também.

**Falha de âncora barrada antes de gravar.** A primeira tentativa de registrar esta evidência usou como âncora a string `#### Matriz de verificação`, que existe em SPEC-0001 e SPEC-0002 e não existe aqui. É a terceira vez nesta sessão que uma substituição assume âncora sem conferir. Desta vez a asserção de escrita interrompeu antes de qualquer gravação, em vez de perder o conteúdo em silêncio como aconteceu na SPEC-0002.


| Requisito | Cenário BDD | Nível | Comando de verificação | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Integração | `npm run test:tdd` — detecção com evidência presente | **Passed** — setup-install e setup-writes, 9 casos, T019 e T023 |
| FR-001 | AC-006 | Integração | `npm run test:tdd` — detecção com evidência ausente | **Passed** — setup-detect, 5 casos, e o binário sai com 0 sem alvo, T016 |
| FR-002 | AC-001 | Unidade | tradução dos quatro hooks de integração | **Passed** — setup-install e setup-writes, 9 casos, T019 e T023 |
| FR-002 | AC-009 | Unidade | semântica de bloqueio preservada na tradução | **Passed** — hooks-translate, 3 casos, T015 |
| FR-002 | AC-010 | Contrato | ida e volta byte a byte do script | **Passed** — hooks-escape, 3 casos, ida e volta byte a byte, T015 |
| FR-003 | AC-002 | Execução | guards recusam a ação protegida | **Passed** — hooks-blocking, 3 casos por execução de subprocesso, T015 |
| FR-003 | AC-003 | Execução | guards permitem trabalho ordinário | **Passed** — hooks-permissive, 3 casos por execução, T015 |
| FR-003 | AC-009 | Unidade | bloqueante e não bloqueante produzem entradas distintas | **Passed** — hooks-translate, 3 casos, T015 |
| FR-004 | AC-004 | Integração | registro nomeia os sete com destino e versão | **Passed** — setup-record, 4 casos, T017 e T019 |
| FR-004 | AC-007 | Integração | ensaio não grava registro | **Passed** — setup-dryrun e setup-writes, 4 casos, zero arquivos escritos, T019 e T023 |
| FR-005 | AC-001 | Integração | os sete instalados, os três de orquestração ausentes | **Passed** — setup-install e setup-writes, 9 casos, T019 e T023 |
| FR-005 | AC-004 | Integração | registro cobre exatamente os sete | **Passed** — setup-record, 4 casos, T017 e T019 |
| FR-006 | AC-002 | Execução | recusa observada por execução | **Passed** — hooks-blocking, 3 casos por execução de subprocesso, T015 |
| FR-006 | AC-003 | Execução | permissão observada por execução | **Passed** — hooks-permissive, 3 casos por execução, T015 |
| FR-007 | AC-005 | Integração | segunda execução não altera nada | **Passed** — setup-idempotent, 4 casos, e o binário relata inalterado na 2ª execução, T023 |
| FR-007 | AC-007 | Integração | ensaio relata sem escrever | **Passed** — setup-dryrun e setup-writes, 4 casos, zero arquivos escritos, T019 e T023 |
| FR-007 | AC-011 | Execução | superfície limitada aos três comandos | **Passed** — setup-surface, 3 casos, T020 |
| FR-008 | AC-008 | Integração | ponte cria cópia local na versão fixada | **Passed** — setup-bridge, 4 casos, touchesGlobal falso nos quatro, T018 |
| NFR-001 | AC-001 | Integração | árvore do diretório pessoal inalterada | **Passed** — setup-install e setup-writes, 9 casos, T019 e T023 |
| NFR-001 | AC-006 | Integração | nada escrito quando o alvo não é usado | **Passed** — setup-detect, 5 casos, e o binário sai com 0 sem alvo, T016 |
| NFR-001 | AC-008 | Integração | ponte não escreve fora do projeto | **Passed** — setup-bridge, 4 casos, touchesGlobal falso nos quatro, T018 |
| NFR-002 | AC-005 | Integração | registro permite reconhecer estado | **Passed** — setup-idempotent, 4 casos, e o binário relata inalterado na 2ª execução, T023 |
| NFR-002 | AC-007 | Integração | ensaio deixa o estado intacto | **Passed** — setup-dryrun e setup-writes, 4 casos, zero arquivos escritos, T019 e T023 |
| NFR-002 | AC-011 | Integração | cada entrada do registro aponta caminho existente | **Passed** — setup-surface, 3 casos, T020 |
| NFR-003 | AC-009 | Unidade | bloqueio preservado | **Passed** — hooks-translate, 3 casos, T015 |
| NFR-003 | AC-010 | Contrato | escape sobrevive à ida e à volta | **Passed** — hooks-escape, 3 casos, ida e volta byte a byte, T015 |
| FR-004 | AC-012 | Integração | `setup-revert.test.ts` — cada entrada aponta o que foi escrito | **Passed** — 4 casos, T017 e T019 |
| FR-007 | AC-012 | Integração | reversão pelo registro e reinstalação | **Passed** — 4 casos, T019 |
| NFR-002 | AC-012 | Integração | o registro descreve cada remoção | **Passed** — entradas com destino, evento e nome, T017 |
| FR-002 | AC-013 | Contrato | `hooks-corpus.test.ts` — os sete reais, byte a byte | **Passed** — 3 casos, T015 |
| FR-005 | AC-013 | Contrato | o corpus tem exatamente os sete portados | **Passed** — T015 |
| NFR-003 | AC-013 | Contrato | contagem de caracteres hostis preservada em cada um | **Passed** — T015 |

### 13. Validações

#### Aceite final — 2026-08-24

`validate_spec` READY · `validate_tasks` READY · `verify_acceptance` QA PASSED nos treze · `verify_evidence` PASSED strict · `check_traceability` OK · `load_research` PASSED · `build_documentation --check` exit 0.

Estrutura conferida: pacote restrito a `spec.md` e `research/`, três atos na ordem, slug igual ao diretório, treze ACs, nenhum ID inexistente citado em `**Cobre**` e nenhum abaixo do mínimo de três cenários.

**A colisão de identificadores compõe, e isso ficou mensurável.** O enforcement do repositório reprova `trace:0001` e `trace:0002`, e passa em `trace:0003`:

| Spec | Identificadores mais altos | Marcadores órfãos |
| --- | --- | --- |
| SPEC-0003 | `US-003`, `FR-008`, `AC-013` | nenhum |
| SPEC-0002 | `US-002`, `FR-007`, `AC-013` | `FR-008`, `US-003` |
| SPEC-0001 | `US-002`, `FR-004`, `AC-011` | sete |

Somente a spec com o maior conjunto passa, porque o auditor varre a árvore inteira sem saber a qual spec um marcador pertence. Cada fatia nova, tendo mais identificadores que as anteriores, transforma os marcadores próprios em órfãos delas.

A decisão registrada em SPEC-0002 foi aceitar a limitação e documentar o vermelho em vez de mascará-lo. Ela continua valendo, e o quadro acima acrescenta o que não se sabia então: o efeito não é estático. Com 1c, 1d, 1e e 1f, a tendência é que toda spec anterior reprove, e o enforcement do repositório deixe de distinguir defeito real de colisão. A correção a montante — escopo por spec no auditor — passa de conveniência a necessidade antes das fatias seguintes.

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-08-24)
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/completed/0003-fatia-1b-setup-hooks/spec.md`
- **Cobertura**: 3 US, 8 FR, 3 NFR, 13 AC, 6 DEC; mínimo de 3 AC por ID satisfeito, sem ID inexistente citado em `**Cobre**`.
- **Research**: `load_research.mjs` em `PASSED`, com `R-001` verificado e oito artefatos indexados.

**Achados da rodada**

| ID | Achado | Severidade | Estado |
| --- | --- | --- | --- |
| D1 | Quatro declarações de cobertura eram infladas: `AC-008` e `AC-011` declaravam `NFR-003` sem exercitar fidelidade de tradução, `AC-011` declarava `NFR-002` sem exercitar reversibilidade, e `AC-006` declarava `FR-007` sem exercitar reexecução nem ensaio | BLOCKER | Resolvido — declarações removidas e substituídas por `AC-012` e `AC-013`, que exercitam o que declaram |
| D2 | `FR-007` empacotava duas obrigações, idempotência e modo de ensaio, contra a regra de uma obrigação por requisito | WARNING | Resolvido — reescrito como a obrigação única de não produzir efeito não pedido, que é o que ambas as metades expressam |
| D3 | A lente de segurança confirma que os três guards têm cenário de recusa e de permissão em par, e que dez asserções exigem execução em vez de inspeção de texto | NOTE | Aceito — é a mitigação direta do defeito crítico da v0.2.8, em que o escape consumido duas vezes passou por revisão porque o arquivo gerado parecia correto |

**Sobre D1.** As quatro inflações vieram de três rodadas sucessivas de ampliar cobertura para satisfazer o mínimo, e não de análise do que cada cenário exercita. É o mesmo defeito que a SPEC-0002 encontrou nos próprios testes, onde duas asserções passavam por vacuidade sobre conjunto vazio. A correção seguiu o mesmo caminho de lá: escrever cenário real em vez de esticar o existente.

#### Gate do Ato II — Plano

- **Resultado**: Passed (2026-08-30), reaberto sobre plano concluído anteriormente
- **Comando**: `node .claude/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/completed/0003-fatia-1b-setup-hooks/spec.md`
- **Plano**: 25 tarefas — T001 a T023 preservadas da entrega original; T024 e T025 acrescentadas para a correção de plano de 2026-08-30.
- **RED**: `npm run test:tdd` com `tests/hooks-raw-command.test.ts` em 3 de 3 casos reprovando, e os 284 casos anteriores verdes.
- **Predecessores de T025**: `T009` e `T013`, que já exercitam `readHook`/`translateForClaudeCode` pelo caminho de bloco de código, somam-se a `T024` para os três predecessores exigidos — se a correção quebrasse a fidelidade dos guards, esses dois capturariam.

**Segunda reabertura do Ato II, mesma data.** `T026` e `T027` acrescentadas para o placeholder `{ide}` nunca resolvido. `npm run test:tdd` com `tests/hooks-context-mode-comando.test.ts` em 3 de 3 casos reprovando, e os 290 casos anteriores verdes.

#### Gate do Ato III — Entrega

- **Resultado**: Passed (2026-08-30), reaberto duas vezes sobre entrega concluída anteriormente
- **Verificação**: `npm run test:tdd` em exit 0, com **293 casos em 89 arquivos**; `npx tsc --noEmit` e `npm run build` em exit 0; `npm run verify` em exit 0 a partir de clone limpo, em 16s; diretório pessoal com 42 entradas antes e depois.
- **Auditorias**: `verify_acceptance` em `QA: PASSED`; `verify_evidence` em `PASSED (strict)`; `load_research` em `PASSED`, corrigido duas vezes — os caminhos que apontavam para `specs/completed/` reapareceram na segunda reabertura porque o `sed` de sincronização só tinha rodado na primeira.
- **Confirmação contra o artefato real, primeira reabertura**: regerando `.claude/settings.json` deste próprio repositório, os quatro comandos de despacho — `code-review-graph update --brief` e as três invocações de `context-mode hook` — apareceram no arquivo. Antes da correção, o fragmento ficava vazio.
- **Confirmação contra o artefato real, segunda reabertura**: um terceiro projeto de teste, gerado pelo binário `common-rules` instalado por `npm link`, mostra os três hooks de context-mode sem `{ide}` em `.claude/settings.json`.

**`npm run verify` reprovou uma vez, e a causa era o teste, não a produção.** `tests/hooks-context-mode-comando.test.ts` estourou o timeout padrão de 5s do Vitest ao invocar `context-mode` real como subprocesso sob a carga de `npm ci` + build + suíte rodando em sequência. Corrigido o timeout do caso — 25s no subprocesso, 30s no `it` —, e não o comportamento; `npm run verify` limpo na repetição.

**Achado pré-existente, não expandido nesta reabertura.** `check_traceability --full-chain` acusa cadeia quebrada em `AC-001` a `AC-008`, `AC-011` e `AC-012`: os comentários de evidência de `T001` a `T023`, escritos na entrega original, listam `US`/`FR` mas não os `AC` correspondentes. É a mesma classe de achado já registrada como `A4` no aceite da `SPEC-0004`. Não toquei nos comentários de `T001` a `T023`: reescrever evidência histórica para incluir referências que não foram registradas na entrega original violaria a regra da própria skill de atualização, e o escopo destas duas reaberturas foi corrigir defeitos de execução real, não auditar retroativamente vinte e três tarefas já concluídas. Fica registrado para decisão de quem responde pelo produto.

#### Suposições

- O registro fica em `.common-rules/install.json`, dentro do projeto. Formato estruturado, e não `.env`: um registro de instalação tem lista e campos, e `.env` era herança dos placeholders da v0.2.8.
- A evidência de uso do alvo é a presença do diretório de configuração do editor no projeto. Reversível se a detecção se mostrar frágil.
- A versão fixada de `code-review-graph` para a ponte é 2.3.7, verificada em 2026-08-24.

#### Decisões abertas

Nenhuma que bloqueie esta fatia.

### 14. Tarefas

#### Fase 1 — Asserções em RED

Uma tarefa por cenário da seção 6. Cada uma escreve num arquivo distinto de `tests/` e nenhuma depende das outras, por isso executam em paralelo.

- [x] T001 [P] [TEST] [TDD] [US-001] Derivar de AC-001 o caso em tests/setup-install.test.ts — Refs: US-001, FR-001, FR-002, FR-004, NFR-001, AC-001 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-001 e definir o critério: a instalação escreve as quatro entradas de integração, cria o registro e não toca nada fora do projeto.
  - [x] **EXECUTE**: Escrever o caso em `tests/setup-install.test.ts`, com marcador `TRACEABILITY` por asserção e o sistema de arquivos injetado, para que nenhum teste toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por módulo `src/setup/run` inexistente.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T002 [P] [TEST] [TDD] [US-002] Derivar de AC-002 o caso em tests/hooks-blocking.test.ts — Refs: US-002, FR-003, FR-006, AC-002 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-002 e definir o critério: os três guards recusam a ação que protegem, verificado executando o script e não lendo seu texto.
  - [x] **EXECUTE**: Escrever o caso em `tests/hooks-blocking.test.ts`, com marcador `TRACEABILITY` por asserção e o sistema de arquivos injetado, para que nenhum teste toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por módulo `src/hooks/source` inexistente.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T003 [P] [TEST] [TDD] [US-002] Derivar de AC-003 o caso em tests/hooks-permissive.test.ts — Refs: US-002, FR-003, FR-006, AC-003 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-003 e definir o critério: os guards permitem trabalho ordinário sobre os mesmos arquivos que protegem.
  - [x] **EXECUTE**: Escrever o caso em `tests/hooks-permissive.test.ts`, com marcador `TRACEABILITY` por asserção e o sistema de arquivos injetado, para que nenhum teste toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por módulo `src/hooks/source` inexistente.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T004 [P] [TEST] [TDD] [US-003] Derivar de AC-004 o caso em tests/setup-record.test.ts — Refs: US-003, FR-001, FR-004, FR-005, AC-004 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-004 e definir o critério: o registro nomeia os sete hooks com destino, versão, data e o alvo escolhido.
  - [x] **EXECUTE**: Escrever o caso em `tests/setup-record.test.ts`, com marcador `TRACEABILITY` por asserção e o sistema de arquivos injetado, para que nenhum teste toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por módulos `src/setup/record` e `run` inexistentes.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T005 [P] [TEST] [TDD] [US-003] Derivar de AC-005 o caso em tests/setup-idempotent.test.ts — Refs: US-003, FR-005, FR-007, FR-008, NFR-002, AC-005 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-005 e definir o critério: a segunda execução deixa tudo idêntico, não duplica entrada e não recria a cópia local.
  - [x] **EXECUTE**: Escrever o caso em `tests/setup-idempotent.test.ts`, com marcador `TRACEABILITY` por asserção e o sistema de arquivos injetado, para que nenhum teste toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por módulo `src/setup/run` inexistente.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T006 [P] [TEST] [TDD] [US-001] Derivar de AC-006 o caso em tests/setup-detect.test.ts — Refs: US-001, FR-001, FR-008, NFR-001, AC-006 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-006 e definir o critério: sem evidência do alvo nada é escrito, o relato nomeia o que faltou e o comando não falha.
  - [x] **EXECUTE**: Escrever o caso em `tests/setup-detect.test.ts`, com marcador `TRACEABILITY` por asserção e o sistema de arquivos injetado, para que nenhum teste toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por módulos `src/hooks/detect` e `src/setup/run` inexistentes.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T007 [P] [TEST] [TDD] [US-003] Derivar de AC-007 o caso em tests/setup-dryrun.test.ts — Refs: US-003, FR-004, FR-005, FR-007, NFR-002, AC-007 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-007 e definir o critério: o ensaio lista os sete e seus destinos sem criar arquivo nem gravar registro.
  - [x] **EXECUTE**: Escrever o caso em `tests/setup-dryrun.test.ts`, com marcador `TRACEABILITY` por asserção e o sistema de arquivos injetado, para que nenhum teste toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por módulo `src/setup/run` inexistente.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T008 [P] [TEST] [TDD] [US-001] Derivar de AC-008 o caso em tests/setup-bridge.test.ts — Refs: US-001, FR-008, NFR-001, AC-008 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-008 e definir o critério: a ponte cria a cópia local na versão fixada, dentro do projeto, sem tocar o ambiente global.
  - [x] **EXECUTE**: Escrever o caso em `tests/setup-bridge.test.ts`, com marcador `TRACEABILITY` por asserção e o sistema de arquivos injetado, para que nenhum teste toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por módulo `src/setup/bridge` inexistente.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T009 [P] [TEST] [TDD] [US-002] Derivar de AC-009 o caso em tests/hooks-translate.test.ts — Refs: US-002, FR-002, FR-003, FR-006, NFR-003, AC-009 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-009 e definir o critério: bloqueante produz entrada que interrompe e não bloqueante produz entrada que apenas observa.
  - [x] **EXECUTE**: Escrever o caso em `tests/hooks-translate.test.ts`, com marcador `TRACEABILITY` por asserção e o sistema de arquivos injetado, para que nenhum teste toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por módulos `src/hooks/claude-code` e `source` inexistentes.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T010 [P] [TEST] [TDD] [US-002] Derivar de AC-010 o caso em tests/hooks-escape.test.ts — Refs: US-002, FR-002, FR-006, NFR-003, AC-010 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-010 e definir o critério: um script com aspas, barras e cifrões volta idêntico do arquivo de configuração e continua recusando.
  - [x] **EXECUTE**: Escrever o caso em `tests/hooks-escape.test.ts`, com marcador `TRACEABILITY` por asserção e o sistema de arquivos injetado, para que nenhum teste toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por módulo `src/hooks/claude-code` inexistente.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T011 [P] [TEST] [TDD] [US-001] [US-003] Derivar de AC-011 o caso em tests/setup-surface.test.ts — Refs: US-001, US-003, FR-001, FR-005, AC-011 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-011 e definir o critério: a superfície tem os três comandos e nenhum das fatias seguintes.
  - [x] **EXECUTE**: Escrever o caso em `tests/setup-surface.test.ts`, com marcador `TRACEABILITY` por asserção e o sistema de arquivos injetado, para que nenhum teste toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por asserção nomeada: `COMMANDS` expõe `doctor` e `version`, sem `setup`.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T012 [P] [TEST] [TDD] [US-003] Derivar de AC-012 o caso em tests/setup-revert.test.ts — Refs: US-003, FR-004, FR-007, NFR-002, AC-012 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-012 e definir o critério: cada entrada do registro aponta caminho existente, remover pelo registro restaura o estado e reexecutar reinstala.
  - [x] **EXECUTE**: Escrever o caso em `tests/setup-revert.test.ts`, com marcador `TRACEABILITY` por asserção e o sistema de arquivos injetado, para que nenhum teste toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por módulos `src/setup/run` e `record` inexistentes.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

- [x] T013 [P] [TEST] [TDD] [US-002] Derivar de AC-013 o caso em tests/hooks-corpus.test.ts — Refs: US-002, FR-002, FR-005, NFR-003, AC-013 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-013 e definir o critério: os sete hooks reais voltam idênticos byte a byte, e não apenas um exemplo construído.
  - [x] **EXECUTE**: Escrever o caso em `tests/hooks-corpus.test.ts`, com marcador `TRACEABILITY` por asserção e o sistema de arquivos injetado, para que nenhum teste toque o projeto real.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por módulos `src/hooks/source` e `claude-code` inexistentes.
  - [x] **EVIDENCE**: Comando, contagem e causa registrados na seção 12.
  - [x] **IMPROVE**: Cada asserção recebeu marcador `TRACEABILITY` próprio, e o ambiente é injetado onde a verificação dependeria da máquina.

#### Fase 2 — Tradução e leitura

- [x] T014 [CODE] [US-002] Implementar em src/hooks/source.ts — Refs: US-002, FR-002, FR-005 — Depends: T009, T010, T013
  - [x] **PREP**: RED confirmado em T009, T010 e T013; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/hooks/source.ts` lê frontmatter e corpo e devolve estrutura tipada com nome, evento, bloqueio e script. Extrai só o bloco de código: a prosa explica por que o hook existe e não deve chegar ao arquivo de configuração.
  - [x] **VERIFY**: `npx tsc --noEmit` em exit 0 e a leitura dos sete hooks devolve nome, evento e bloqueio corretos, com o fragmento íntegro.
  - [x] **EVIDENCE**: Comandos e o contrato de fragmento descoberto, registrados na seção 12.
  - [x] **IMPROVE**: A leitura não traduz e não escreve. Separar os três é o que permite verificar a fidelidade do fragmento sem tocar o disco.
  <!-- framework:evidence {"task": "T014", "refs": ["US-002", "FR-002", "FR-005"], "files": ["src/hooks/source.ts"], "commands": [{"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T015 [CODE] [US-002] Implementar em src/hooks/claude-code.ts — Refs: US-002, FR-002, FR-003, FR-006, NFR-003 — Depends: T002, T003, T009, T010, T013, T014
  - [x] **PREP**: RED confirmado em T002, T003, T009, T010 e T013; `docs/` reconstruído.
  - [x] **EXECUTE**: `src/hooks/claude-code.ts` mapeia os três eventos canônicos para os nomes do alvo e embute o fragmento entre preâmbulo e pós-âmbulo. O preâmbulo extrai `HOOK_COMMAND` do JSON do evento em vez de casar contra o JSON inteiro, porque o bruto carrega prosa e um guard que dispara sobre texto acaba desligado. O pós-âmbulo emite `decision` e `message`.
  - [x] **VERIFY**: Os quatro arquivos de `hooks/` passam a GREEN, com 59 de 61 testes aprovando. O guard traduzido, executado como subprocesso, recusa `rm -rf /` com código 2 e a mensagem do próprio guard, e permite `rm dist/cli.js` com código 0.
  - [x] **EVIDENCE**: Comandos, saídas dos dois casos e o empacotamento do corpus, registrados na seção 12.
  - [x] **IMPROVE**: O corpus dos sete hooks saiu de `specs/` para `hooks/` na raiz do pacote. Dentro de `specs/` o caminho muda a cada transição de estado, e os testes quebraram exatamente por isso — registro não é código.
  <!-- framework:evidence {"task": "T015", "refs": ["US-002", "FR-002", "FR-003", "FR-006", "NFR-003"], "files": ["src/hooks/claude-code.ts", "package.json"], "commands": [{"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T016 [CODE] [US-001] Implementar em src/hooks/detect.ts — Refs: US-001, FR-001, NFR-001 — Depends: T001, T006, T011
  - [x] **PREP**: RED confirmado em T001, T006 e T011; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/hooks/detect.ts` decide se há evidência de uso do alvo e devolve a decisão com o motivo, sem escrever nada. A evidência é a presença de `.claude/settings.json`, `settings.local.json` ou o próprio diretório.
  - [x] **VERIFY**: `npx tsc --noEmit` em exit 0 e a decisão discrimina os cinco casos, inclusive os dois ambíguos: sinalizador sem arquivo e arquivo sem sinalizador reprovam ambos. `setup-detect.test.ts` segue em RED por importar `src/setup/run`, que só existe em T019.
  - [x] **EVIDENCE**: Comandos e a tabela dos cinco casos, registrados na seção 12.
  - [x] **IMPROVE**: A decisão carrega o motivo, e não só o veredito. Um `false` sem explicação obrigaria quem executa a adivinhar o que faltou, e o relato de AC-006 exige nomear a evidência ausente.
  <!-- framework:evidence {"task": "T016", "refs": ["US-001", "FR-001", "NFR-001"], "files": ["src/hooks/detect.ts"], "commands": [{"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

#### Fase 3 — Registro e ponte

- [x] T017 [CODE] [US-003] Implementar em src/setup/record.ts — Refs: US-003, FR-004, NFR-002 — Depends: T004, T007, T012
  - [x] **PREP**: RED confirmado em T004, T007 e T012; `docs/` reconstruído e `build_documentation --check` em exit 0 antes da alteração.
  - [x] **EXECUTE**: `src/setup/record.ts` lê, grava e compara o registro, com nome, destino, versão, data e evento por entrada. Recebe o objeto em memória em vez de um caminho, para que a leitura seja verificável sem tocar o disco.
  - [x] **VERIFY**: `npx tsc --noEmit` em exit 0. O registro preserva a ida e a volta, lista as entradas com destino, evento e nome, e a comparação discrimina quatro casos: mesmo conjunto aprova, versão diferente recusa, conjunto diferente recusa e registro ausente recusa. `setup-record.test.ts` segue em RED por importar `src/setup/run`, que só existe em T019.
  - [x] **EVIDENCE**: Comandos e a tabela dos quatro casos de comparação, registrados na seção 12.
  - [x] **IMPROVE**: Cada entrada guarda o evento além do caminho. Remover exige localizar a entrada dentro do arquivo do alvo, e não apagar o arquivo: ele pode conter configuração de terceiro que a escrita preservou.
  <!-- framework:evidence {"task": "T017", "refs": ["US-003", "FR-004", "NFR-002"], "files": ["src/setup/record.ts"], "commands": [{"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}, {"run": "node .claude/skills/framework-documentator/scripts/build_documentation.mjs --project . --check", "exit": 0}]} -->

- [x] T018 [CODE] [US-001] Implementar em src/setup/bridge.ts — Refs: US-001, FR-008, NFR-001 — Depends: T005, T006, T008
  - [x] **PREP**: RED confirmado em T005, T006 e T008; `build_documentation --check` em exit 0 antes da alteração.
  - [x] **EXECUTE**: `src/setup/bridge.ts` cria a cópia local do subsistema Python na versão fixada, dentro do projeto, e recusa nomeando `uv` quando ele falta. Usa ambiente virtual do projeto e nunca `uv tool install`, que gravaria fora dele.
  - [x] **VERIFY**: `npx tsc --noEmit` em exit 0 e `setup-bridge.test.ts` passa a carregar, com os quatro casos aprovando. A suíte foi de 61 para 65 testes, com 63 aprovando. A decisão discrimina cópia local presente, presença só no PATH, ausência com `uv` e ausência sem `uv`.
  - [x] **EVIDENCE**: Comandos e a tabela dos quatro casos, registrados na seção 12.
  - [x] **IMPROVE**: A ponte devolve o especificador que instalaria em vez de instalar por padrão. Um ambiente virtual Python custa cerca de 262 MB, e criá-lo sem pedido explícito surpreenderia quem só queria configurar hooks.
  <!-- framework:evidence {"task": "T018", "refs": ["US-001", "FR-008", "NFR-001"], "files": ["src/setup/bridge.ts"], "commands": [{"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}, {"run": "node .claude/skills/framework-documentator/scripts/build_documentation.mjs --project . --check", "exit": 0}]} -->

#### Fase 4 — Orquestração e superfície

- [x] T019 [CODE] [US-001] [US-003] Implementar em src/setup/run.ts — Refs: US-001, US-003, FR-001, FR-005, FR-007, NFR-001, NFR-002 — Depends: T001, T005, T006, T007, T012, T015, T016, T017
  - [x] **PREP**: RED confirmado em T001, T005, T006, T007 e T012; `build_documentation --check` em exit 0 antes da alteração.
  - [x] **EXECUTE**: `src/setup/run.ts` encadeia detecção, carga dos hooks empacotados, tradução, escrita e registro. Devolve o que faria quando falta evidência do alvo e quando está em ensaio, e reconhece estado já configurado comparando conjunto e versão.
  - [x] **VERIFY**: `npx tsc --noEmit` em exit 0. Os seis arquivos que não carregavam passaram a carregar e aprovam: a suíte foi de 65 para **89 testes, com 87 aprovando**, e 25 de 26 arquivos ficaram verdes. Os quatro caminhos foram exercitados diretamente: instala sete e escreve dois caminhos; ensaio planeja sete e escreve zero, sem gravar registro; reexecução relata inalterado com sete entradas; sem alvo relata o que faltou e sai com zero.
  - [x] **EVIDENCE**: Comandos e a tabela dos quatro caminhos, registrados na seção 12.
  - [x] **IMPROVE**: A carga lê de `hooks/` na raiz, resolvido a partir do módulo compilado. Ler de um caminho relativo ao diretório de trabalho faria o comando depender de onde foi invocado, e ele precisa funcionar de qualquer subdiretório do projeto.
  <!-- framework:evidence {"task": "T019", "refs": ["US-001", "US-003", "FR-001", "FR-005", "FR-007", "NFR-001", "NFR-002"], "files": ["src/setup/run.ts"], "commands": [{"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}, {"run": "node .claude/skills/framework-documentator/scripts/build_documentation.mjs --project . --check", "exit": 0}]} -->

- [x] T020 [CODE] [US-001] [US-003] Implementar em src/cli.ts — Refs: US-001, US-003, FR-001, FR-005 — Depends: T001, T004, T011, T019
  - [x] **PREP**: RED confirmado em T001, T004 e T011; `build_documentation --check` em exit 0 antes da alteração.
  - [x] **EXECUTE**: `src/cli.ts` ganhou o despacho de `setup`, sem lógica de instalação: ele chama a orquestração e formata a saída. `src/setup/env.ts` isola a única parte que observa o sistema de arquivos, para que a decisão de detecção continue recebendo o resultado por parâmetro.
  - [x] **VERIFY**: `npx tsc --noEmit` em exit 0 e a **suíte inteira verde: 26 arquivos, 89 testes**. O binário instala sete hooks e sai com zero, relata o alvo ignorado e sai com zero num projeto sem evidência, e recusa comando desconhecido com código 2 nomeando os três disponíveis.
  - [x] **EVIDENCE**: Comandos, saída real do binário e o conflito com a fatia 1a, registrados na seção 12.
  - [x] **IMPROVE**: A observação do sistema de arquivos saiu para `env.ts`. Deixá-la dentro da detecção faria a decisão depender da máquina, e é justamente a injeção que permite exercitar os cinco casos de `AC-006`.
  <!-- framework:evidence {"task": "T020", "refs": ["US-001", "US-003", "FR-001", "FR-005"], "files": ["src/cli.ts", "src/setup/env.ts"], "commands": [{"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}, {"run": "npm run test:tdd", "exit": 0}, {"run": "node dist/cli.js setup", "exit": 0}]} -->

#### Fase 5 — Contexto e fechamento

- [x] T021 [DOC] [US-001] Registrar em .project-context/STACK.md o que esta fatia introduziu — Refs: US-001, FR-001, FR-002, AC-001, AC-009 — Depends: T019
  - [x] **PREP**: Levantado o que a fatia introduziu: sete módulos, o alvo suportado e os dois arquivos de estado.
  - [x] **EXECUTE**: Registrados em `.project-context/STACK.md` os sete módulos com responsabilidade e evidência, o alvo Claude Code, os caminhos de estado e a razão de separar decidir, traduzir e escrever.
  - [x] **VERIFY**: Cada módulo citado foi conferido por script contra o disco: nenhum inexistente. `hooks/` com sete arquivos, declarado em `files`, e `.venv-crg/` gitignorado.
  - [x] **EVIDENCE**: Conferência item a item registrada na seção 12.
  - [x] **IMPROVE**: A separação entre decidir, traduzir e escrever ganhou parágrafo próprio, com o motivo. Sem ele a estrutura pareceria preferência estilística, quando é a mitigação do defeito que derrubou a v0.2.8.
  <!-- framework:evidence {"task": "T021", "refs": ["US-001", "FR-001", "FR-002"], "files": [".project-context/STACK.md"], "commands": [{"run": "node .claude/skills/framework-aux-stack/scripts/update_stack.mjs --project .", "exit": 0}]} -->

- [x] T022 [DOC] [US-001] [US-003] Atualizar PROJECT.md com o comando de configuração — Refs: US-001, US-003, FR-001, FR-005, AC-011 — Depends: T020
  - [x] **PREP**: Confirmado que `PROJECT.md` listava o setup entre o que não existe.
  - [x] **EXECUTE**: O setup passou para a lista de capacidades, com saída real do comando. O servidor MCP entrou na lista do que ainda não existe, com a distinção de que a lógica existe e falta a superfície de protocolo.
  - [x] **VERIFY**: Nenhum comando citado falta no binário, conferido por script. A única menção restante a setup na lista de ausências descreve o servidor MCP, e não o comando.
  - [x] **EVIDENCE**: Conferência registrada na seção 12.
  - [x] **IMPROVE**: A entrada do MCP explicita que a lógica já existe e o que falta é a superfície. Listá-lo como simplesmente ausente sugeriria trabalho maior do que o restante.
  <!-- framework:evidence {"task": "T022", "refs": ["US-001", "US-003", "FR-001", "FR-005"], "files": ["PROJECT.md"], "commands": [{"run": "npm run build", "exit": 0}]} -->

- [x] T023 [TEST] [US-001] [US-002] [US-003] Executar regressão e isolamento pelos scripts declarados em package.json — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013 — Depends: T020, T021, T022
  - [x] **PREP**: Treze casos reunidos, cada um com RED registrado antes da implementação.
  - [x] **EXECUTE**: Clone limpo do remoto, `npm run verify`, suíte completa e execução do binário, com comparação do diretório pessoal antes e depois.
  - [x] **VERIFY**: Ciclo em 6s contra orçamento de 300; **27 arquivos e 94 testes aprovando**; diretório pessoal inalterado. A regressão encontrou dois defeitos, descritos abaixo, ambos corrigidos e cobertos por teste novo.
  - [x] **EVIDENCE**: Comandos, tempos e os dois defeitos registrados na seção 12.
  - [x] **IMPROVE**: Foi acrescentado `tests/setup-writes.test.ts`, que verifica o disco em projeto descartável. A ausência dessa verificação é o que permitiu o defeito principal atravessar sete tarefas.
  <!-- framework:evidence {"task": "T023", "refs": ["US-001", "US-002", "US-003", "FR-001", "FR-002", "FR-003", "FR-004", "FR-005", "FR-006", "FR-007", "FR-008", "NFR-001", "NFR-002", "NFR-003"], "files": ["src/setup/write.ts", "tests/setup-writes.test.ts", "src/cli.ts"], "commands": [{"run": "npm run verify", "exit": 0}, {"run": "npm run test:tdd", "exit": 0}]} -->

#### Fase 4 — Correção de plano: fidelidade do fragmento para hooks de despacho

Reabertura de 2026-08-30. `FR-002` já exigia embutir o fragmento sem alteração; a implementação satisfazia isso só para hooks com bloco de código no corpo, e os quatro que declaram `raw_command` no frontmatter sem bloco produziam fragmento vazio — no-op silencioso em produção.

- [x] T024 [TEST] [TDD] [US-001] Derivar de AC-010 o caso de fidelidade para hook sem bloco de código em tests/hooks-raw-command.test.ts — Refs: US-001, FR-002, AC-010 — Depends: none
  - [x] **PREP**: Reler AC-010, que já exige comparação byte a byte, e aplicá-lo ao caso que faltava: um hook cujo único conteúdo é `raw_command` no frontmatter, sem bloco de código.
  - [x] **EXECUTE**: Escrever o caso em `tests/hooks-raw-command.test.ts`: traduzir `code-review-graph-update.md` e os três `context-mode-*.md`, extrair o fragmento embutido em cada script gerado e confirmar que ele é exatamente o valor de `raw_command`, e não vazio.
  - [x] **VERIFY**: RED observado nas três asserções — fragmento vazio, script sem o comando, e a execução como subprocesso não injeta o marcador porque não há o que substituir.
  - [x] **EVIDENCE**: `npx vitest run tests/hooks-raw-command.test.ts` com 3 de 3 reprovando. Registrado na seção 12.
  - [x] **IMPROVE**: O caso também executa cada script como subprocesso — não só inspeciona o texto —, na mesma disciplina que AC-002 já aplica aos guards: ler o texto certo não prova que o comando roda.

- [x] T025 [CODE] [US-001] Ler raw_command quando não houver bloco de código em src/hooks/source.ts — Refs: FR-002, AC-009, AC-010, AC-013 — Depends: T009, T013, T024
  - [x] **PREP**: T024 em RED; `docs/` reconstruído por `$framework-documentator` antes da alteração.
  - [x] **EXECUTE**: `readHook` em `src/hooks/source.ts` passa a usar `raw_command` do frontmatter quando `scriptFrom(body)` devolve vazio, preservando prioridade ao bloco de código quando os dois existirem.
  - [x] **VERIFY**: T024 passa a GREEN nas três asserções. A suíte inteira fecha em 287 de 287 casos e 87 de 87 arquivos. `npx tsc --noEmit` e `npm run build` em exit 0. Regerando `.claude/settings.json` deste próprio repositório, os quatro comandos — `code-review-graph update --brief` e as três invocações de `context-mode hook` — aparecem de fato no arquivo, onde antes o fragmento ficava vazio.
  - [x] **EVIDENCE**: Comandos, contagens e a confirmação contra o `.claude/settings.json` real registrados na seção 12.
  - [x] **IMPROVE**: A correção é de duas linhas, mas o defeito sobreviveu a um Delivery Gate inteiro porque nenhuma asserção afirmava sobre o conteúdo do fragmento desses quatro hooks — só sobre presença, nome e evento. É a mesma classe de falso-verde que apareceu nas SPEC-0004, SPEC-0005, SPEC-0006 e SPEC-0007, aqui na forma mais antiga do repositório: uma spec `Complete` continha um requisito (`FR-002`) que a implementação nunca satisfazia de fato para um subconjunto dos casos, e passou despercebido porque o teste confirmava a forma do script gerado, e não o que ele executa.

  <!-- framework:evidence {"task": "T025", "refs": ["FR-002", "AC-009", "AC-010", "AC-013"], "files": ["src/hooks/source.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

#### Fase 5 — Correção de plano: placeholder {ide} nunca resolvido

Reabertura de 2026-08-30, segunda desta fatia. `FR-002` não muda; o dado-fonte de três hooks estava incorreto desde a introdução nesta reescrita.

- [x] T026 [TEST] [TDD] [US-002] Derivar de AC-009 o caso de comando real sem placeholder em tests/hooks-context-mode-comando.test.ts — Refs: US-002, FR-002, AC-009 — Depends: none
  - [x] **PREP**: Reler AC-009, que já exige fidelidade caractere a caractere entre o hook fonte e o script traduzido; aplicar isso ao conteúdo do `raw_command`, não só à sua presença.
  - [x] **EXECUTE**: Escrever o caso em `tests/hooks-context-mode-comando.test.ts`: traduzir os três hooks de context-mode, extrair o fragmento e confirmar que nenhum contém a substring `{ide}`, e que o comando começa com `context-mode hook claude-code`.
  - [x] **VERIFY**: RED observado nas três asserções — os três fragmentos contêm `{ide}` literal, o comando não começa com `claude-code`, e a terceira reafirma a mesma causa via subprocesso.
  - [x] **EVIDENCE**: `npx vitest run tests/hooks-context-mode-comando.test.ts` com 3 de 3 reprovando. Registrado na seção 12.
  - [x] **IMPROVE**: O caso também executa cada script como subprocesso real, com o payload que um evento de verdade traria, e confere código de saída — não só inspeciona o texto do comando.

- [x] T027 [DOC] [US-002] Declarar o alvo literal nos três hooks de context-mode em hooks/context-mode-pretooluse.md, hooks/context-mode-posttooluse.md, hooks/context-mode-stop.md — Refs: FR-002, AC-009 — Depends: T026
  - [x] **PREP**: T026 em RED; `docs/` reconstruído por `$framework-documentator` antes da alteração.
  - [x] **EXECUTE**: Os três `raw_command` em `hooks/context-mode-*.md` passaram de `context-mode hook {ide} <evento>` para `context-mode hook claude-code <evento>`.
  - [x] **VERIFY**: T026 passa a GREEN nos três casos. A suíte inteira fecha em 293 de 293 casos e 89 de 89 arquivos — confirmado em duas execuções completas, a primeira teve uma falha transiente isolada no terceiro caso, reproduzida como GREEN ao rodar sozinha e na repetição completa. `npx tsc --noEmit` e `npm run build` em exit 0. Confirmado contra um terceiro projeto real, gerado pelo binário `common-rules` instalado por `npm link`: os três hooks de context-mode em `.claude/settings.json` não contêm `{ide}`.
  - [x] **EVIDENCE**: Comandos, contagens e a confirmação contra o projeto real registrados na seção 12.
  - [x] **IMPROVE**: Este é o terceiro defeito real encontrado testando a instalação de ponta a ponta nesta sessão, depois do fragmento vazio e do guard de dispatch. Nenhum dos três apareceu em centenas de casos de teste porque nenhum executava o produto como ele de fato é usado — instalado, linkado, disparado por subprocesso com payload real. Testar a forma não é testar o uso.

  <!-- framework:evidence {"task": "T027", "refs": ["FR-002", "AC-009"], "files": ["hooks/context-mode-pretooluse.md", "hooks/context-mode-posttooluse.md", "hooks/context-mode-stop.md"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

### 15. Ordem de execução

**Correção de 2026-08-30.** `T024` não depende de nada e `T025` depende só de `T024`; a ordem original das fases 1 a 3 não muda.

**Segunda correção, mesma data.** `T026` não depende de nada e `T027` depende só de `T026`.

- Caminho crítico: T009, T010 e T013 → T014 → T015 → T019 → T020 → T023.
- Tarefas paralelas: T001 a T013, porque cada uma escreve num arquivo distinto de `tests/` e nenhuma depende do resultado das outras.
- Barreira deliberada: T015 precede toda escrita em disco. A tradução devolve conteúdo e não escreve, de modo que a fidelidade do escape é verificada antes de existir qualquer caminho que grave arquivo. Foi a ausência dessa separação que deixou o defeito crítico da v0.2.8 passar por revisão.
- Divergência revelada pelo planejamento: a estrutura de arquivos da seção 8 lista onze arquivos de teste e nomeia `hooks-source.test.ts` e `setup-isolation.test.ts`, que nenhum cenário exige. O plano usa treze, um por cenário, acrescentando `setup-install`, `hooks-permissive`, `setup-revert` e `hooks-corpus`. A lista da seção 8 é anterior a AC-012 e AC-013, criados durante a validação.
- Estratégia de MVP: não se aplica. Instalar parte dos hooks entrega proteção parcial, que é pior que nenhuma por sugerir cobertura inexistente.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Fatia 1a concluída, que fornece manifesto, build, runner e a resolução de dependências.
- `uv` disponível para a ponte.
- Os sete hooks portados, preservados em `research/hooks-v028/`.

#### Riscos

- **Escape consumido duas vezes na tradução** → todos os guards passam a permitir tudo, e o arquivo gerado parece correto. É o defeito crítico que a v0.2.8 registrou. Mitigação: AC-010 compara byte a byte, e AC-002 exige execução.
- **Fragmento extraído só de bloco de código, hook de despacho sem corpo vira no-op silencioso** → `FR-002` exige embutir o fragmento sem alteração, e a implementação satisfaz isso apenas quando o hook tem bloco de código no corpo. Os quatro hooks que declaram `raw_command` no frontmatter sem bloco — `code-review-graph-update`, `context-mode-pretooluse`, `context-mode-posttooluse`, `context-mode-stop` — produzem fragmento vazio, e a asserção existente confirmava só a forma do script gerado, não seu conteúdo executável. Achado em 2026-08-30, ao investigar por que `code-review-graph` nunca era acionado num teste manual local. Mitigação: `scriptFrom` passa a usar `raw_command` quando não há bloco de código, e um caso novo executa esse fragmento como subprocesso e confere que o comando de fato roda — a mesma disciplina de execução que `AC-002` já aplica aos guards.
- **Guard estreito demais ou largo demais** → ou não protege, ou impede trabalho ordinário. A v0.2.8 registrou as duas falhas. Mitigação: AC-002 e AC-003 são pares, e nenhum passa sozinho.
- **Escrita destruindo configuração de terceiro** → a pessoa perde ajuste que não era nosso. Mitigação: a seção 7 exige preservar bloco alheio, e o caso está entre os erros previstos.
- **Detecção por presença de diretório dando falso positivo** → configurar editor que a pessoa não usa. Mitigação: registrada como suposição reversível; AC-006 fixa o comportamento na ausência.
- **Registro divergindo do sistema** → a ferramenta confia em si mesma e ignora remoção manual. Mitigação: a seção 7 manda reinstalar e relatar quando o registro afirmar o que o sistema nega.
- **Placeholder `{ide}` no raw_command dos hooks de context-mode, nunca substituído** → os três hooks declaravam `context-mode hook {ide} <evento>`, e `{ide}` chegava como argumento literal ao comando real, sem que nenhum código do projeto o resolvesse. Introduzido nesta própria reescrita — `git log -S "{ide}"` não devolve ocorrência em `archived` —, e contraria a intenção já documentada aqui de eliminar placeholders do produto. Achado em 2026-08-30, testando os sete hooks como subprocesso real contra um projeto de teste, depois da correção do fragmento vazio. Mitigação: como o alvo suportado é só `claude-code`, os três `hooks/context-mode-*.md` passam a declarar isso literalmente no `raw_command`, e um caso novo confere que o comando final não contém chave alguma e executa de verdade.

#### Suposições

Registradas na seção 13, todas reversíveis nesta fatia.

### 17. Decisões

- **DEC-001**: O `setup` liga subsistemas e protege o repositório, e não distribui regras nem skills. *Razão*: `framework` é o motor de skills desde a reescrita, e o `common-rules` é wrapper. Ligar `context-mode` e `code-review-graph` ao ciclo do agente é o que só ele pode fazer.
- **DEC-002**: Sete dos dez hooks da v0.2.8 são portados. *Razão*: os quatro de integração conectam subsistemas, e os três de guardrail e autoria não dependem de motor de skills. *Descartados*: `orchestration-briefing`, `completion-gate` e `format-after-edit` pressupõem o kit de 47 recursos removido na Phase 0.
- **DEC-003**: O servidor MCP sai desta fatia e vira a 1f. *Razão*: a medição em `archived` mostrou 494 linhas de tradução de hooks e 536 de servidor MCP, contra 207 da fatia 1a inteira. *Critério*: o projeto é primordialmente CLI, de modo que a superfície secundária não precede a lógica que expõe.
- **DEC-004**: Alvo único, Claude Code, com detecção. *Razão*: fatia estreita expõe defeito que fatia larga encobre, como a 1a demonstrou. Com três tradutores simultâneos, um erro num deles ficaria coberto pelos outros dois passando.
- **DEC-005**: Tradução e escrita vivem em módulos separados. *Razão*: é o que permite verificar a fidelidade do escape sem tocar o sistema de arquivos. Na v0.2.8 os dois estavam no mesmo caminho, e o duplo consumo do escape passou por revisão porque o arquivo gerado parecia correto.
- **DEC-006**: O registro fica dentro do projeto, em formato estruturado. *Razão*: escrever configuração sem rastro impede reexecução segura e torna reversão adivinhação. *Alternativa descartada*: `.env`, herança dos placeholders que deixaram de existir.

**Correção de plano registrada em 2026-08-30.** `FR-002` não mudou: o requisito de embutir o fragmento sem alteração já cobria este caso. A solução técnica é que estava incompleta — `scriptFrom` só extraía de bloco de código — e passa a ler `raw_command` do frontmatter quando não há bloco. Classificação: mudança de plano, Ato II reaberto, Definition Gate preservado.

**Segunda correção de plano registrada em 2026-08-30.** `FR-002` não muda: o fragmento continua embutido sem alteração pela tradução — o defeito estava no dado-fonte, não na lógica. Classificação: mudança de plano, Ato II reaberto, Definition Gate preservado.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam — `verify_acceptance` em `QA: PASSED` para os treze.
- [x] Todos os requisitos possuem evidência de verificação registrada na matriz da seção 12.
- [x] Todas as tarefas da seção 14 estão concluídas — 23 de 23, com 149 de 149 itens.
- [x] Os três guards foram exercitados por execução: `rm -rf /` sai com 2 e a mensagem do guard, e `rm dist/cli.js` sai com 0.
- [x] O escape foi verificado byte a byte na ida e na volta, sobre um exemplo hostil construído e sobre os sete hooks reais.
- [x] A árvore do diretório pessoal permanece inalterada: 45 entradas antes e depois da suíte.
- [x] `.project-context/STACK.md` registra os sete módulos com evidência, o alvo suportado e os caminhos de estado; cada módulo citado foi conferido por script contra o disco.
- [x] `PROJECT.md` lista `common-rules setup` entre as capacidades, e a única menção restante na lista de ausências descreve o servidor MCP, não o comando.

**Aceite da reabertura, 2026-08-30.** Todos os gates conferidos: `Definition Gate: Passed` preservado sem alteração de requisito; `Plan Gate: Passed` com `T024`/`T025` acrescentadas e RED materializado; `Delivery Gate: Passed` com 287 de 287 casos, confirmação contra o `.claude/settings.json` real deste repositório, e o achado pré-existente de `--full-chain` registrado sem expansão de escopo.

**Aceite da segunda reabertura, 2026-08-30.** Todos os gates conferidos: `Definition Gate: Passed` preservado; `Plan Gate: Passed` com `T026`/`T027` acrescentadas e RED materializado; `Delivery Gate: Passed` com 293 de 293 casos, `npm run verify` limpo após corrigir timeout de teste, e confirmação contra um terceiro projeto real gerado pelo binário instalado.
