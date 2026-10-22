# Especificação integrada: Fatia 1g: telemetria por trace_id no registro auditavel

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0006 |
| Slug | 0006-fatia-1g-telemetria-trace-id |
| Status | Complete |
| Effort | 3 |
| Effort updated at | 2026-08-29 |
| Effort rationale | A entrega é estreita e aditiva, mas encontra um carimbo de tempo congelado que precisa ser corrigido junto, e exige injetar relógio e gerador sem quebrar os 184 casos existentes. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — a entrega acrescenta campos a um registro e a relatos de terminal já existentes, sem tela. |
| Atualizada em | 2026-08-29 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O `setup` escreve hooks, instala conjuntos de skills e grava um registro; o `doctor` lê e relata. Quando algo sai errado, não há como amarrar o que o registro diz ao momento em que aconteceu, nem distinguir uma execução da seguinte.

Há um obstáculo concreto por baixo, e ele é pior do que a ausência de identificador. O momento gravado em cada entrada é produzido por `new Date(0)`, isto é, a época Unix: cada registro afirma que a instalação ocorreu em `1970-01-01`, em qualquer máquina e em qualquer execução. Duas asserções tocam o campo e nenhuma o exercita — uma confere que o texto parseia como data, e época zero parseia.

Sem um instante verdadeiro e sem um identificador de execução, o registro descreve o quê, mas não o quando nem o qual. Correlacionar deixa de ser possível.

#### Resultado desejado

O registro passa a dizer quando aconteceu e a que execução pertence.

Ao fim da fatia, cada execução do `setup` produz um identificador de correlação, gravado em todas as entradas que ela escreve, e um instante real. O relato cita o identificador, de modo que quem abriu um problema possa nomeá-lo. O `doctor` relata o identificador da última execução registrada.

Nada disso torna os casos não determinísticos: relógio e gerador são injetados, como o ambiente já é nas fatias anteriores, e a implementação real é o padrão.

#### Métricas de sucesso

- Toda entrada gravada por uma execução carrega o mesmo identificador de correlação.
- Duas execuções distintas produzem identificadores distintos.
- O instante gravado corresponde ao momento da execução, e não à época zero.
- O relato do `setup` cita o identificador.
- O `doctor` nomeia o identificador da última execução registrada.
- Nenhum caso da suíte depende de relógio real ou de aleatoriedade.
- Registros gravados antes desta fatia continuam legíveis.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-040** [critical] O momento gravado no registro é constante, e as asserções existentes não o percebem — Verdict: verified — Confidence: high — Evidence: research/carimbo-congelado/observacao.md#observação — Budget: 1/1.

`runSetup` calcula o instante uma vez, com `new Date(0)`, e o aplica às entradas de hook e de skills. O valor resultante é sempre `1970-01-01T00:00:00.000Z`. Duas asserções tocam o campo: uma confirma que parseia como data, e a outra que é texto. Ambas passam sobre um valor constante.

#### Fontes e contexto consultados

- `src/setup/run.ts`, `src/setup/record.ts` e `src/doctor.ts`, pelo comportamento real.
- `tests/setup-record.test.ts` e `tests/skills-registro-persistido.test.ts`, pelas asserções que deixam passar.
- `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md`, seção da fatia 1g.
- `specs/completed/0003-fatia-1b-setup-hooks/spec.md` e `specs/completed/0005-fatia-1h-skills-lado-a-lado/spec.md`, pelo formato do registro.
- `.project-context/RULES.md`, pela regra de relato de origem.

#### Documentação consultada

Nenhuma documentação externa. A observação é do próprio código.

#### Artefatos de pesquisa armazenados

- `specs/completed/0006-fatia-1g-telemetria-trace-id/research/carimbo-congelado/observacao.md` — a observação do carimbo constante, as duas asserções que não o percebem e a consequência para esta fatia.

#### Dúvidas respondidas

- **Q**: O identificador é por sessão ou por execução? → **A**: Por execução do `setup`. É a unidade que escreve, e é o que se precisa correlacionar.
- **Q**: Onde ele vive? → **A**: No registro que a fatia 1b já grava, junto das entradas. Um arquivo novo criaria duas verdades.
- **Q**: Como manter os casos determinísticos? → **A**: Injetando relógio e gerador, com implementação real como padrão, no mesmo padrão do ambiente já injetado.
- **Q**: O carimbo congelado entra nesta fatia? → **A**: Sim. Correlacionar sem instante verdadeiro não funciona, e o defeito está no mesmo trecho que a fatia altera.

#### Dúvidas abertas

Nenhuma que bloqueie esta fatia.

### 3. Escopo e atores

#### Incluído

- Identificador de correlação por execução do `setup`, gravado em todas as entradas que ela escreve.
- Instante real no lugar do valor constante.
- Relógio e gerador injetáveis, com implementação real como padrão.
- Menção ao identificador no relato do `setup`.
- Relato pelo `doctor` do identificador da última execução registrada.
- Leitura tolerante de registros gravados antes desta fatia.

#### Fora de escopo

- Arquivo de log próprio, rotação ou envio de telemetria para fora da máquina.
- Identificador por prompt ou por evento de editor, que pertence ao épico de extensões.
- Correlacionar o servidor MCP com o comando de terminal como uma sessão única.
- Qualquer dado que identifique a pessoa ou a máquina.
- Alterar o formato das entradas já existentes além do acréscimo dos campos.

#### Atores

- **Quem depura um problema**: cita o identificador e localiza a execução.
- **O `doctor`**: passa a ter o que relatar sobre a última execução.
- **A suíte**: continua determinística, porque relógio e gerador são injetados.

### 4. Princípios e restrições do projeto

- **PR-040**: O registro diz a verdade sobre quando. Carimbo constante é pior que carimbo ausente, porque parece informação.
- **PR-041**: Determinismo dos casos não se compra com falsidade em produção. Injeta-se a fonte, não se congela o valor.
- **PR-042**: O identificador é opaco. Não carrega caminho, nome de máquina nem dado da pessoa.
- **PR-043**: Registros antigos continuam legíveis. A fatia acrescenta campos e não invalida o que já existe.

### 5. Histórias de usuário

#### US-040 — Amarrar o que foi escrito a uma execução

Como **quem depura um problema**, quero **um identificador que apareça no relato e no registro**, para **saber a qual execução pertence cada entrada gravada**.

**Por que P1**: É a razão da fatia. Sem identificador, duas execuções ficam indistinguíveis no arquivo.
**Teste independente**: Uma execução grava o mesmo identificador em todas as suas entradas, o relato o cita, duas execuções produzem identificadores distintos, e o `doctor` nomeia o da última.
**Requisitos**: FR-040, FR-041, FR-044

#### US-041 — Saber quando aconteceu de fato

Como **quem depura um problema**, quero **que o instante gravado seja o real**, para **que o registro não afirme que tudo ocorreu em 1970**.

**Por que P1**: O valor atual é constante e engana, porque parece informação e não é.
**Teste independente**: O instante gravado corresponde ao relógio injetado, não é a época zero, e um registro antigo continua legível.
**Requisitos**: FR-042, FR-045

#### US-042 — Manter a suíte determinística

Como **quem mantém o projeto**, quero **relógio e gerador injetáveis**, para **que a verdade em produção não custe casos instáveis**.

**Por que P1**: Foi para evitar instabilidade que o carimbo foi congelado, e a solução errada criou o defeito.
**Teste independente**: Com relógio e gerador injetados o resultado é previsível; a implementação real é o padrão quando nada é injetado; e o identificador não carrega dado do ambiente.
**Requisitos**: FR-043, FR-040

### 6. Cenários BDD de aceite

#### AC-040 — Uma execução marca tudo que escreve

**Cobre**: US-040, FR-040

```gherkin
@US-040 @FR-040 @AC-040
Feature: Identificador por execução

  Scenario: Todas as entradas da mesma execução compartilham o identificador
    Given um projeto com evidência de uso do alvo
    When o setup roda uma vez
    Then o registro traz um identificador de correlação
    And todas as entradas gravadas por essa execução carregam o mesmo valor
```

#### AC-041 — O relato cita o identificador

**Cobre**: US-040, FR-041

```gherkin
@US-040 @FR-041 @AC-041
Feature: Identificador visível

  Scenario: Quem executou consegue nomear a execução
    Given um projeto com evidência de uso do alvo
    When o setup roda
    Then o relato devolvido contém o identificador gravado
```

#### AC-042 — O instante gravado é o do relógio

**Cobre**: US-041, FR-042

```gherkin
@US-041 @FR-042 @AC-042
Feature: Instante verdadeiro

  Scenario: O carimbo corresponde ao momento da execução
    Given um relógio injetado com um instante conhecido
    When o setup roda
    Then o instante gravado nas entradas é o do relógio injetado
```

#### AC-043 — Relógio injetado torna o caso previsível

**Cobre**: US-042, FR-043, NFR-040

```gherkin
@US-042 @FR-043 @NFR-040 @AC-043
Feature: Relógio injetável

  Scenario: Duas execuções com o mesmo relógio gravam o mesmo instante
    Given um relógio injetado que devolve sempre o mesmo instante
    When o setup roda duas vezes sobre projetos distintos
    Then o instante gravado é igual nos dois registros
```

#### AC-044 — Gerador injetado torna o identificador previsível

**Cobre**: US-042, FR-043, NFR-040

```gherkin
@US-042 @FR-043 @NFR-040 @AC-044
Feature: Gerador injetável

  Scenario: O identificador vem do gerador informado
    Given um gerador injetado que devolve um valor conhecido
    When o setup roda
    Then o identificador gravado é exatamente esse valor
```

#### AC-045 — Execuções distintas se distinguem

**Cobre**: US-040, FR-040, NFR-041

```gherkin
@US-040 @FR-040 @NFR-041 @AC-045
Feature: Distinção entre execuções

  Scenario: O gerador real não repete valores
    Given o gerador real, sem injeção
    When ele produz muitos identificadores seguidos
    Then não há valor repetido entre eles
    And nenhum deles contém caminho de arquivo
```

#### AC-046 — O doctor nomeia a última execução

**Cobre**: US-040, FR-041, FR-044

```gherkin
@US-040 @FR-041 @FR-044 @AC-046
Feature: Relato do doctor

  Scenario: O identificador aparece no diagnóstico
    Given um projeto com registro gravado por uma execução conhecida
    When o doctor examina o projeto
    Then o relato nomeia o identificador dessa execução
```

#### AC-047 — Registro sem identificador continua legível

**Cobre**: US-041, FR-044, FR-045, NFR-042

```gherkin
@US-041 @FR-044 @FR-045 @NFR-042 @AC-047
Feature: Compatibilidade com o registro anterior

  Scenario: Um registro gravado antes desta fatia é lido
    Given um registro sem identificador de correlação
    When o doctor examina o projeto
    Then a leitura ocorre sem erro
    And o relato informa que a execução não foi identificada
```

#### AC-048 — Entrada com instante antigo continua legível

**Cobre**: US-041, FR-045, NFR-042

```gherkin
@US-041 @FR-045 @NFR-042 @AC-048
Feature: Entradas anteriores

  Scenario: Um registro com o carimbo da época é aceito na leitura
    Given um registro cujas entradas trazem o instante da época
    When o registro é lido
    Then a leitura ocorre sem erro
    And as entradas permanecem como estavam
```

#### AC-049 — O identificador é opaco

**Cobre**: US-042, NFR-041

```gherkin
@US-042 @NFR-041 @AC-049
Feature: Identificador sem dado do ambiente

  Scenario: Nada do ambiente vaza para o identificador
    Given o gerador real
    When um identificador é produzido
    Then ele não contém o nome do usuário
    And não contém caminho absoluto
    And não contém o nome da máquina
```

#### AC-050 — Sem injeção, a implementação real é usada

**Cobre**: US-042, FR-042, FR-043, NFR-040

```gherkin
@US-042 @FR-042 @FR-043 @NFR-040 @AC-050
Feature: Padrão de produção

  Scenario: A ausência de injeção não deixa o valor constante
    Given o setup chamado sem relógio nem gerador injetados
    When ele grava o registro
    Then o instante gravado é posterior à época
    And o identificador não é vazio
```

#### AC-051 — Hooks e skills compartilham o identificador

**Cobre**: US-040, FR-040, FR-041

```gherkin
@US-040 @FR-040 @FR-041 @AC-051
Feature: Uma execução, um identificador

  Scenario: As duas listas do registro apontam a mesma execução
    Given um projeto onde o setup instala hooks e conjuntos de skills
    When o setup roda uma vez
    Then as entradas de hooks e as de skills carregam o mesmo identificador
```

#### AC-052 — O instante gravado não é a época

**Cobre**: US-041, FR-042, NFR-042

```gherkin
@US-041 @FR-042 @NFR-042 @AC-052
Feature: Carimbo verdadeiro

  Scenario: A época deixa de ser o valor gravado
    Given o setup chamado sem relógio injetado
    When ele grava o registro
    Then nenhuma entrada traz o instante da época
```

#### AC-053 — Sem registro, nada é inventado

**Cobre**: US-040, FR-044, FR-045

```gherkin
@US-040 @FR-044 @FR-045 @AC-053
Feature: Ausência de registro

  Scenario: O doctor não fabrica identificador
    Given um projeto sem registro de instalação
    When o doctor examina o projeto
    Then o relato não nomeia identificador algum
    And não apresenta valor inventado no lugar
```

#### AC-054 — A forma do identificador é estável

**Cobre**: US-042, FR-040, NFR-041

```gherkin
@US-042 @FR-040 @NFR-041 @AC-054
Feature: Forma do identificador

  Scenario: O valor produzido tem forma previsível
    Given o gerador real
    When um identificador é produzido
    Then ele tem comprimento fixo
    And usa apenas caracteres hexadecimais
```

### 7. Requisitos

#### Funcionais

- **FR-040**: Cada execução do `setup` deve produzir um identificador de correlação e gravá-lo no registro, em todas as entradas que ela escrever.
- **FR-041**: O relato devolvido pelo `setup` deve conter o identificador da execução.
- **FR-042**: O instante gravado nas entradas deve vir do relógio da execução, e o relógio usado na ausência de injeção deve ser o do sistema. Um instante fixo no código é proibido; um relógio injetado que devolva sempre o mesmo valor é escolha legítima de quem escreve o caso.
- **FR-043**: Relógio e gerador de identificador devem ser injetáveis, com implementação real usada quando nada for injetado.
- **FR-044**: O `doctor` deve nomear o identificador da última execução registrada, e informar quando não houver.
- **FR-045**: A leitura de registros gravados antes desta fatia deve ocorrer sem erro, mesmo sem identificador e com o instante da época.

#### Não funcionais

- **NFR-040**: **Determinismo**. Nenhum caso da suíte depende de relógio real ou de aleatoriedade. **Verificação**: execução repetida da suíte, e inspeção de que os casos que afirmam sobre instante e identificador usam valores injetados.
- **NFR-041**: **Opacidade**. O identificador não carrega nome de pessoa, de máquina nem caminho. **Verificação**: geração de muitos valores e inspeção do conteúdo, mais conferência da forma.
- **NFR-042**: **Compatibilidade**. Registros gravados antes desta fatia continuam legíveis e não são reescritos na leitura. **Verificação**: leitura de um registro sem identificador e com instante da época, comparando a árvore antes e depois.

#### Erros e casos-limite

- Registro sem identificador → ler sem erro e informar que a execução não foi identificada.
- Registro sem a lista de skills → comportamento preservado, como já ocorre hoje.
- Registro ausente → não nomear identificador nem apresentar valor no lugar.
- Instante da época encontrado na leitura → aceitar, por ser registro anterior, e não reescrever.
- Gerador injetado devolvendo valor vazio → tratar como ausência de identificador, sem gravar campo vazio.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- `runSetup` calcula o instante uma vez, com `new Date(0)`, e o aplica às entradas de hook e de skills.
- `InstallRecord` tem `target`, `version`, `hooks` e, desde a fatia 1h, `skills`.
- `RecordEntry` traz `name`, `target`, `version`, `installedAt` e `event`.
- `inspectDependencies(env, root?)` devolve `Report` com `results`, `exitCode` e, com raiz, `skills` e `note`.
- O ambiente já é injetado por interface nas fatias anteriores, e `defaultEnvironment` fornece a implementação real.
- A suíte tem 54 arquivos e 184 casos.

#### Arquitetura e módulos

| Módulo | Responsabilidade | Arquivo |
| --- | --- | --- |
| Origem do tempo e do identificador | Produzir instante e identificador, com implementação real e forma injetável | `src/telemetry/trace.ts` |
| Leitura tolerante | Extrair identificador e instante de registros novos e antigos | `src/telemetry/read.ts` |

A origem vive separada porque é a única fonte de não determinismo do projeto, e precisa ser substituível num único lugar. A leitura é separada porque o `doctor` a consome sem precisar produzir nada.

#### Migrations

Não aplicável. A fatia não introduz banco.

#### Models

`InstallRecord` ganha `trace`, com o identificador da execução que o gravou. `RecordEntry` e as entradas de skills passam a receber o instante do relógio da execução. A forma existente é preservada, e os campos novos são opcionais na leitura.

#### Controllers e casos de uso

`runSetup` consome a origem para carimbar o registro; `inspectDependencies` consome a leitura para relatar. Não há autorização a decidir.

#### Views e experiência

Não aplicável. A seção 10 registra a ausência de interface.

#### Queries e repositórios

Não aplicável.

#### Jobs e processamento assíncrono

Não aplicável.

#### Estrutura de arquivos

```text
src/telemetry/
  trace.ts
  read.ts
tests/
  trace-fixtures.ts
  trace-marca-execucao.test.ts
  trace-no-relato.test.ts
  trace-instante-injetado.test.ts
  trace-relogio-deterministico.test.ts
  trace-gerador-deterministico.test.ts
  trace-execucoes-distintas.test.ts
  trace-doctor-relata.test.ts
  trace-registro-antigo.test.ts
  trace-instante-epoca.test.ts
  trace-opacidade.test.ts
  trace-padrao-producao.test.ts
  trace-hooks-e-skills.test.ts
  trace-sem-epoca.test.ts
  trace-doctor-sem-registro.test.ts
  trace-forma.test.ts
```

### 9. Modelo de dados

`.common-rules/install.json` ganha o campo `trace`, com o identificador da execução que gravou o arquivo. As entradas de `hooks` e de `skills` passam a receber o instante real em `installedAt`.

Nenhum campo é removido, e a leitura aceita registros sem `trace` e com o instante da época, que são os gravados antes desta fatia.

### 10. Interfaces e contratos

#### Interface para pessoas

**Não há interface para pessoas.** A entrega acrescenta campos a um registro e a relatos de terminal que já existem, e quem os lê é quem executou o comando ou o agente.

#### APIs expostas

Nenhuma. A fatia amplia o comportamento de `setup` e `doctor`.

#### APIs externas utilizadas

Nenhuma. O identificador é produzido localmente e nada sai da máquina.

#### Documentação das APIs consultadas

Não aplicável.

#### Eventos e outros contratos

Não aplicável.

### 11. Estratégia TDD

- **Unidade**: produção de identificador e de instante, com a origem injetada e com a real.
- **Integração**: `setup` sobre projetos descartáveis, conferindo o registro gravado.
- **Compatibilidade**: leitura de registros construídos à mão, sem identificador e com o instante da época.
- **Runner**: Vitest, pelo script `test:tdd`.
- **Verificação manual**: nenhuma.

O ponto sensível é que a fatia introduz a única fonte de não determinismo do projeto. Os casos que afirmam sobre instante e identificador usam a origem injetada; os que exercitam a origem real afirmam sobre propriedades — unicidade, forma, opacidade, e o fato de o instante ser posterior à época — e nunca sobre um valor específico. Foi a tentativa de evitar essa distinção que produziu o carimbo constante que `R-040` documenta.

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Comando de verificação | Evidência |
| --- | --- | --- | --- | --- |
| FR-040 | AC-040 | Integração | identificador em todas as entradas | **Passed** — trace-marca-execucao, T018 |
| FR-040 | AC-045 | Unidade | valores não se repetem | **Passed** — trace-execucoes-distintas, T016 |
| FR-040 | AC-051 | Integração | hooks e skills compartilham | **Passed** — trace-hooks-e-skills, T018 |
| FR-040 | AC-054 | Unidade | forma estável | **Passed** — trace-forma, T016 |
| FR-041 | AC-041 | Integração | relato cita o identificador | **Passed** — trace-no-relato, T018 |
| FR-041 | AC-046 | Integração | doctor nomeia a execução | **Passed** — trace-doctor-relata, T019 |
| FR-041 | AC-051 | Integração | mesma execução nas duas listas | **Passed** — trace-hooks-e-skills, T018 |
| FR-042 | AC-042 | Integração | instante do relógio injetado | **Passed** — trace-instante-injetado, T018 |
| FR-042 | AC-050 | Integração | sem injeção, posterior à época | **Passed** — trace-padrao-producao, T016 |
| FR-042 | AC-052 | Integração | época não é gravada | **Passed** — trace-sem-epoca, T018 |
| FR-043 | AC-043 | Integração | relógio injetado é previsível | **Passed** — trace-relogio-deterministico, T018 |
| FR-043 | AC-044 | Integração | gerador injetado é previsível | **Passed** — trace-gerador-deterministico, T016 |
| FR-043 | AC-050 | Integração | padrão real quando ausente | **Passed** — trace-padrao-producao, T016 |
| FR-044 | AC-046 | Integração | doctor relata identificador | **Passed** — trace-doctor-relata, T019 |
| FR-044 | AC-047 | Compatibilidade | informa quando não há | **Passed** — trace-registro-antigo, T019 |
| FR-044 | AC-053 | Integração | sem registro, nada é inventado | **Passed** — trace-doctor-sem-registro, T019 |
| FR-045 | AC-047 | Compatibilidade | registro sem identificador | **Passed** — trace-registro-antigo, T019 |
| FR-045 | AC-048 | Compatibilidade | instante da época aceito | **Passed** — trace-instante-epoca, T017 |
| FR-045 | AC-053 | Integração | registro ausente | **Passed** — trace-doctor-sem-registro, T019 |
| NFR-040 | AC-043 | Integração | relógio injetado | **Passed** — trace-relogio-deterministico, T018 |
| NFR-040 | AC-044 | Integração | gerador injetado | **Passed** — trace-gerador-deterministico, T016 |
| NFR-040 | AC-050 | Integração | propriedades e não valores | **Passed** — trace-padrao-producao, T016 |
| NFR-041 | AC-045 | Unidade | sem caminho no valor | **Passed** — trace-execucoes-distintas, T016 |
| NFR-041 | AC-049 | Unidade | sem dado do ambiente | **Passed** — trace-opacidade, T016 |
| NFR-041 | AC-054 | Unidade | apenas hexadecimal | **Passed** — trace-forma, T016 |
| NFR-042 | AC-047 | Compatibilidade | leitura sem identificador | **Passed** — trace-registro-antigo, T019 |
| NFR-042 | AC-048 | Compatibilidade | leitura com época | **Passed** — trace-instante-epoca, T017 |
| NFR-042 | AC-052 | Integração | registros novos sem época | **Passed** — trace-sem-epoca, T018 |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-08-29), reconfirmado no aceite final em 2026-08-29
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/completed/0006-fatia-1g-telemetria-trace-id/spec.md`
- **Cobertura**: 3 US, 6 FR, 3 NFR, 15 AC, 6 DEC; mínimo de 3 AC por ID satisfeito nos doze. Identificadores de 040 a 054.
- **Research**: `load_research.mjs` em `PASSED`, com `R-040` verificado e um artefato indexado.

**Achados da rodada de definição**

| ID | Achado | Severidade | Estado |
| --- | --- | --- | --- |
| D1 | `FR-042` dizia que o instante "nunca" pode ser constante, o que contradiz `AC-043`, cujo cenário injeta um relógio que devolve sempre o mesmo valor. O requisito é sobre a fonte, não sobre a variabilidade | WARNING | Resolvido — `FR-042` passou a proibir instante fixo no código e a exigir o relógio do sistema na ausência de injeção |
| D2 | A lente de arquitetura confirma que `DEC-042` não amplia escopo por conveniência: `R-040` mostra o instante gravado sempre na época, e correlacionar sem instante verdadeiro não funciona | NOTE | Aceito |
| D3 | A lente de segurança confirma que `NFR-041` tem cenário próprio e que o identificador é produzido localmente, sem envio para fora | NOTE | Aceito |

**Achados do aceite final**

| ID | Achado | Severidade | Estado |
| --- | --- | --- | --- |
| A1 | O caso-limite normativo da seção 7 — gerador devolvendo valor vazio leva à omissão do campo — não tinha implementação nem caso executável, e `runSetup` gravava o campo vazio | BLOCKER | Resolvido — Delivery Gate reaberto, `T023` e `T024` acrescentadas com RED antes do código, e o gate refeito |
| A2 | `check_traceability` acusa marcadores órfãos das cinco specs anteriores | NOTE | Aceito — limitação conhecida, cuja correção pertence ao `removed-project-integration` |

**Sobre A1, e o que ele revela do processo.** A causa não é distração: a seção 7 lista casos-limite que não têm cenário `AC` próprio, e a matriz da seção 12 cobre apenas o que tem cenário. Um requisito normativo pode, por isso, atravessar definição, plano e entrega sem nunca ganhar caso executável. As fatias anteriores não expuseram isso porque seus casos-limite coincidiam com cenários existentes. A correção durável seria a matriz alcançar também os casos-limite da seção 7, e não apenas os `AC`.

**Dois ciclos interrompidos nesta fatia.** O defeito de refs de evidência, que a `SPEC-0004` e a `SPEC-0005` só encontraram no aceite, apareceu aqui durante o fechamento, porque `T022` passou a exigir `--full-chain` ali. E o auxiliar de fixtures, omitido da estrutura nas duas fatias anteriores, foi declarado antes de existir. Nos dois casos a correção foi de onde a verificação acontece, e não de atenção.

#### Gate do Ato II — Plano

- **Resultado**: Passed (2026-08-29)
- **Comando**: `node .claude/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/completed/0006-fatia-1g-telemetria-trace-id/spec.md`
- **Plano**: 22 tarefas — 15 `[TEST] [TDD]`, 4 `[CODE]`, 2 `[DOC]`, 1 `[OPS]`; 110 itens de checklist; 27 de 27 IDs cobertos.
- **RED**: `npm run test:tdd` com quinze arquivos novos reprovando por `Cannot find module` sobre `src/telemetry/trace` e `src/telemetry/read`, ou pelo campo ausente no registro, e os 184 casos anteriores verdes. 45 casos marcados com `TRACEABILITY`, cobrindo os quinze `AC`.
- **Rastreabilidade**: 27 de 27 identificadores desta fatia cobertos.

**Correção proativa.** A seção 8 passou a listar `tests/trace-fixtures.ts` antes de o arquivo existir. Nas duas fatias anteriores o auxiliar de fixtures ficou de fora da estrutura e virou achado do aceite; desta vez foi declarado junto do plano.

**Nada precede o RED nesta fatia.** Não há dependência nova a instalar, o que a distingue das fatias 1f e 1h, cujas primeiras tarefas fixavam pacote.

#### Gate do Ato III — Entrega

- **Resultado**: Passed (2026-08-29)
- **Verificação**: `npm run test:tdd` em exit 0, com **232 casos em 70 arquivos**; `npx tsc --noEmit` e `npm run build` em exit 0; `npm run verify` em exit 0 a partir de clone limpo, em 4s contra orçamento de 300; diretório pessoal com 42 entradas antes e depois.
- **Auditorias**: `verify_acceptance` em `QA: PASSED`; `verify_evidence` em `PASSED (strict)`; `load_research` em `PASSED`; `check_traceability` com `--full-chain` sem cadeia quebrada; `build_documentation --check` em exit 0; monitor de contexto em `CURRENT`.
- **Defeito de origem corrigido**: `grep` por `new Date(0)` em `src/setup/run.ts` devolve zero. O instante gravado passou a vir do relógio da execução.
- **Somente leitura preservada**: `grep` por escrita em `src/doctor.ts` devolve zero.

**O ciclo de refs de evidência foi interrompido.** `NFR-040` apareceu com a cadeia quebrada durante o fechamento, e não no aceite. É o mesmo defeito que a `SPEC-0004` e a `SPEC-0005` registraram nos respectivos aceites, e a diferença veio de uma mudança de plano: `T022` passou a exigir `--full-chain` no fechamento, em vez de deixar a conferência para a validação final. A correção que interrompe o ciclo não foi de atenção, e sim de onde a verificação acontece.

**Delivery Gate reaberto uma vez.** O aceite encontrou um caso-limite normativo da seção 7 sem implementação nem caso: gerador que devolve valor vazio deveria levar à omissão do campo, e `runSetup` o gravava vazio. `T023` e `T024` foram acrescentadas, com RED antes do código, e o gate foi refeito. A causa é estrutural: a seção 7 lista casos-limite que não têm cenário `AC` próprio, e a matriz cobre apenas o que tem cenário — de modo que um requisito normativo pode atravessar o plano inteiro sem caso executável.

**Correção proativa que funcionou.** `tests/trace-fixtures.ts` foi declarado na seção 8 antes de existir. Nas duas fatias anteriores o auxiliar de fixtures ficou fora da estrutura e virou achado do aceite; aqui não houve achado correspondente.

#### Suposições

- O identificador é hexadecimal de comprimento fixo, produzido localmente. Reversível se um formato de correlação externo vier a ser adotado.
- A origem é injetada por parâmetro opcional em `runSetup`, no mesmo padrão de `bridgeEnv` e `skills`. Reversível.
- O identificador vive no registro e não em arquivo próprio.

#### Decisões abertas

Nenhuma que bloqueie esta fatia.

### 14. Tarefas

Formato:
`- [ ] TNNN [P?] [TIPO] [US-NNN?] Ação com caminho — Refs: IDs — Depends: IDs|none`

Checklist obrigatório por tarefa, na ordem `PREP`, `EXECUTE`, `VERIFY`, `EVIDENCE`, `IMPROVE`.

#### Fase 1 — RED, um caso por cenário da seção 6

Quinze tarefas, uma por `AC`, cada uma em arquivo próprio de `tests/`. Nenhuma dependência entre elas, por isso executam em paralelo. Não há dependência nova a instalar nesta fatia.

- [x] T001 [P] [TEST] [TDD] [US-040] Derivar de AC-040 o caso em tests/trace-marca-execucao.test.ts — Refs: US-040, FR-040, AC-040 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-040 e fixar o critério: o registro traz um identificador e todas as entradas da execução carregam o mesmo valor.
  - [x] **EXECUTE**: Escrever o caso em `tests/trace-marca-execucao.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, com relógio e gerador injetados onde o cenário exigir previsibilidade.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por `Cannot find module` sobre `src/telemetry/`, ou pelo campo ausente no registro, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos em RED e os 184 casos anteriores verdes; 45 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Conferir hooks e skills no mesmo caso, porque a garantia é sobre a execução inteira e não sobre uma lista.

- [x] T002 [P] [TEST] [TDD] [US-040] Derivar de AC-041 o caso em tests/trace-no-relato.test.ts — Refs: US-040, FR-041, AC-041 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-041 e fixar o critério: o relato devolvido contém o identificador gravado.
  - [x] **EXECUTE**: Escrever o caso em `tests/trace-no-relato.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, com relógio e gerador injetados onde o cenário exigir previsibilidade.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por `Cannot find module` sobre `src/telemetry/`, ou pelo campo ausente no registro, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos em RED e os 184 casos anteriores verdes; 45 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Comparar contra o valor lido do registro, e não contra um literal, para que o caso não fixe um retrato.

- [x] T003 [P] [TEST] [TDD] [US-041] Derivar de AC-042 o caso em tests/trace-instante-injetado.test.ts — Refs: US-041, FR-042, AC-042 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-042 e fixar o critério: o instante gravado é o do relógio injetado.
  - [x] **EXECUTE**: Escrever o caso em `tests/trace-instante-injetado.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, com relógio e gerador injetados onde o cenário exigir previsibilidade.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por `Cannot find module` sobre `src/telemetry/`, ou pelo campo ausente no registro, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos em RED e os 184 casos anteriores verdes; 45 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Injetar um instante reconhecível e distante da época, para que passar por acidente seja impossível.

- [x] T004 [P] [TEST] [TDD] [US-042] Derivar de AC-043 o caso em tests/trace-relogio-deterministico.test.ts — Refs: US-042, FR-043, NFR-040, AC-043 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-043 e fixar o critério: duas execuções com o mesmo relógio gravam o mesmo instante.
  - [x] **EXECUTE**: Escrever o caso em `tests/trace-relogio-deterministico.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, com relógio e gerador injetados onde o cenário exigir previsibilidade.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por `Cannot find module` sobre `src/telemetry/`, ou pelo campo ausente no registro, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos em RED e os 184 casos anteriores verdes; 45 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Usar projetos distintos, para que a igualdade venha do relógio e não de reuso de estado.

- [x] T005 [P] [TEST] [TDD] [US-042] Derivar de AC-044 o caso em tests/trace-gerador-deterministico.test.ts — Refs: US-042, FR-043, NFR-040, AC-044 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-044 e fixar o critério: o identificador gravado é exatamente o valor devolvido pelo gerador injetado.
  - [x] **EXECUTE**: Escrever o caso em `tests/trace-gerador-deterministico.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, com relógio e gerador injetados onde o cenário exigir previsibilidade.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por `Cannot find module` sobre `src/telemetry/`, ou pelo campo ausente no registro, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos em RED e os 184 casos anteriores verdes; 45 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Afirmar igualdade exata, que é o que prova a injeção efetiva.

- [x] T006 [P] [TEST] [TDD] [US-040] Derivar de AC-045 o caso em tests/trace-execucoes-distintas.test.ts — Refs: US-040, FR-040, NFR-041, AC-045 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-045 e fixar o critério: o gerador real não repete valores e nenhum contém caminho de arquivo.
  - [x] **EXECUTE**: Escrever o caso em `tests/trace-execucoes-distintas.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, com relógio e gerador injetados onde o cenário exigir previsibilidade.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por `Cannot find module` sobre `src/telemetry/`, ou pelo campo ausente no registro, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos em RED e os 184 casos anteriores verdes; 45 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Gerar muitos valores e afirmar sobre o conjunto, porque unicidade é propriedade e não valor.

- [x] T007 [P] [TEST] [TDD] [US-040] Derivar de AC-046 o caso em tests/trace-doctor-relata.test.ts — Refs: US-040, FR-041, FR-044, AC-046 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-046 e fixar o critério: o relato do doctor nomeia o identificador da execução registrada.
  - [x] **EXECUTE**: Escrever o caso em `tests/trace-doctor-relata.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, com relógio e gerador injetados onde o cenário exigir previsibilidade.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por `Cannot find module` sobre `src/telemetry/`, ou pelo campo ausente no registro, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos em RED e os 184 casos anteriores verdes; 45 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Construir o registro à mão, para que o caso não dependa de rodar o setup.

- [x] T008 [P] [TEST] [TDD] [US-041] Derivar de AC-047 o caso em tests/trace-registro-antigo.test.ts — Refs: US-041, FR-044, FR-045, NFR-042, AC-047 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-047 e fixar o critério: um registro sem identificador é lido sem erro e o relato informa que a execução não foi identificada.
  - [x] **EXECUTE**: Escrever o caso em `tests/trace-registro-antigo.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, com relógio e gerador injetados onde o cenário exigir previsibilidade.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por `Cannot find module` sobre `src/telemetry/`, ou pelo campo ausente no registro, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos em RED e os 184 casos anteriores verdes; 45 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Comparar a árvore antes e depois, porque a leitura não pode reescrever.

- [x] T009 [P] [TEST] [TDD] [US-041] Derivar de AC-048 o caso em tests/trace-instante-epoca.test.ts — Refs: US-041, FR-045, NFR-042, AC-048 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-048 e fixar o critério: um registro com o instante da época é lido sem erro e as entradas permanecem.
  - [x] **EXECUTE**: Escrever o caso em `tests/trace-instante-epoca.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, com relógio e gerador injetados onde o cenário exigir previsibilidade.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por `Cannot find module` sobre `src/telemetry/`, ou pelo campo ausente no registro, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos em RED e os 184 casos anteriores verdes; 45 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Construir o registro com o valor exato que a versão anterior gravava.

- [x] T010 [P] [TEST] [TDD] [US-042] Derivar de AC-049 o caso em tests/trace-opacidade.test.ts — Refs: US-042, NFR-041, AC-049 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-049 e fixar o critério: o identificador não contém nome de usuário, caminho absoluto nem nome da máquina.
  - [x] **EXECUTE**: Escrever o caso em `tests/trace-opacidade.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, com relógio e gerador injetados onde o cenário exigir previsibilidade.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por `Cannot find module` sobre `src/telemetry/`, ou pelo campo ausente no registro, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos em RED e os 184 casos anteriores verdes; 45 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Derivar os termos proibidos do ambiente em execução, e não de literais, para que o caso valha em qualquer máquina.

- [x] T011 [P] [TEST] [TDD] [US-042] Derivar de AC-050 o caso em tests/trace-padrao-producao.test.ts — Refs: US-042, FR-042, FR-043, NFR-040, AC-050 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-050 e fixar o critério: sem injeção, o instante é posterior à época e o identificador não é vazio.
  - [x] **EXECUTE**: Escrever o caso em `tests/trace-padrao-producao.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, com relógio e gerador injetados onde o cenário exigir previsibilidade.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por `Cannot find module` sobre `src/telemetry/`, ou pelo campo ausente no registro, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos em RED e os 184 casos anteriores verdes; 45 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Afirmar sobre propriedades e nunca sobre valores, porque aqui a origem é a real.

- [x] T012 [P] [TEST] [TDD] [US-040] Derivar de AC-051 o caso em tests/trace-hooks-e-skills.test.ts — Refs: US-040, FR-040, FR-041, AC-051 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-051 e fixar o critério: as entradas de hooks e de skills carregam o mesmo identificador.
  - [x] **EXECUTE**: Escrever o caso em `tests/trace-hooks-e-skills.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, com relógio e gerador injetados onde o cenário exigir previsibilidade.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por `Cannot find module` sobre `src/telemetry/`, ou pelo campo ausente no registro, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos em RED e os 184 casos anteriores verdes; 45 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Exercitar com o instalador de skills injetado, para que as duas listas existam no mesmo registro.

- [x] T013 [P] [TEST] [TDD] [US-041] Derivar de AC-052 o caso em tests/trace-sem-epoca.test.ts — Refs: US-041, FR-042, NFR-042, AC-052 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-052 e fixar o critério: nenhuma entrada gravada por execução nova traz o instante da época.
  - [x] **EXECUTE**: Escrever o caso em `tests/trace-sem-epoca.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, com relógio e gerador injetados onde o cenário exigir previsibilidade.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por `Cannot find module` sobre `src/telemetry/`, ou pelo campo ausente no registro, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos em RED e os 184 casos anteriores verdes; 45 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: É a asserção que faltava: as existentes conferiam que o texto parseia como data, e a época parseia.

- [x] T014 [P] [TEST] [TDD] [US-040] Derivar de AC-053 o caso em tests/trace-doctor-sem-registro.test.ts — Refs: US-040, FR-044, FR-045, AC-053 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-053 e fixar o critério: sem registro, o relato não nomeia identificador nem apresenta valor no lugar.
  - [x] **EXECUTE**: Escrever o caso em `tests/trace-doctor-sem-registro.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, com relógio e gerador injetados onde o cenário exigir previsibilidade.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por `Cannot find module` sobre `src/telemetry/`, ou pelo campo ausente no registro, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos em RED e os 184 casos anteriores verdes; 45 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Conferir a ausência do campo, e não apenas que ele não seja igual a algo.

- [x] T015 [P] [TEST] [TDD] [US-042] Derivar de AC-054 o caso em tests/trace-forma.test.ts — Refs: US-042, FR-040, NFR-041, AC-054 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-054 e fixar o critério: o identificador tem comprimento fixo e apenas caracteres hexadecimais.
  - [x] **EXECUTE**: Escrever o caso em `tests/trace-forma.test.ts`, com marcador `TRACEABILITY` por asserção e raízes em diretório temporário, com relógio e gerador injetados onde o cenário exigir previsibilidade.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova por `Cannot find module` sobre `src/telemetry/`, ou pelo campo ausente no registro, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 15 arquivos em RED e os 184 casos anteriores verdes; 45 casos marcados com `TRACEABILITY` sobre os quinze `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Afirmar sobre a forma por expressão regular, que é o que sobrevive a mudança de implementação.

#### Fase 2 — Código, cada tarefa atrás do seu RED

- [x] T016 [CODE] [US-042] Implementar em src/telemetry/trace.ts — Refs: US-042, FR-040, FR-042, FR-043, NFR-041, AC-044, AC-045, AC-049, AC-050, AC-054 — Depends: T005, T006, T010, T011, T015
  - [x] **PREP**: RED confirmado em T005, T006, T010, T011 e T015; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/telemetry/trace.ts` reúne a única fonte de não determinismo do projeto: `generateId` deriva de bytes aleatórios e `nowIso` do relógio do sistema, ambos expostos por `TraceSource` e substituíveis por injeção.
  - [x] **VERIFY**: Os cinco casos passam a GREEN. `npx tsc --noEmit` em exit 0.
  - [x] **EVIDENCE**: Comandos e contagem registrados na seção 12.
  - [x] **IMPROVE**: O identificador deriva de bytes aleatórios e não de dado do ambiente, de modo que a opacidade seja propriedade da construção: não há nome de pessoa, de máquina ou caminho a filtrar, porque nenhum entra.

  <!-- framework:evidence {"task": "T016", "refs": ["US-042", "FR-040", "FR-042", "FR-043", "NFR-040", "NFR-041", "AC-044", "AC-045", "AC-049", "AC-050", "AC-054"], "files": ["src/telemetry/trace.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T017 [CODE] [US-041] Implementar em src/telemetry/read.ts — Refs: US-041, FR-044, FR-045, NFR-042, AC-047, AC-048, AC-053 — Depends: T008, T009, T014
  - [x] **PREP**: RED confirmado em T008, T009 e T014; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/telemetry/read.ts` devolve um resultado de três casos — identificado, não identificado e ausente — e nunca escreve. Registro ilegível é tratado como não identificado, para que o diagnóstico das dependências continue ocorrendo.
  - [x] **VERIFY**: Os três casos passam a GREEN, e a comparação da árvore antes e depois não acusa alteração.
  - [x] **EVIDENCE**: Comandos, contagem e a comparação da árvore registrados na seção 12.
  - [x] **IMPROVE**: Os três casos são representados explicitamente em vez de por texto vazio: colapsar ausência de registro e ausência de identificador perderia justamente o que o diagnóstico precisa dizer.

  <!-- framework:evidence {"task": "T017", "refs": ["US-041", "FR-044", "FR-045", "NFR-042", "AC-047", "AC-048", "AC-053"], "files": ["src/telemetry/read.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T018 [CODE] [US-040] Implementar em src/setup/run.ts e src/setup/record.ts — Refs: US-040, FR-040, FR-041, FR-042, AC-040, AC-041, AC-042, AC-043, AC-051, AC-052 — Depends: T001, T002, T003, T004, T012, T013, T016
  - [x] **PREP**: RED confirmado em T001, T002, T003, T004, T012 e T013, com T016 em GREEN; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `InstallRecord` ganhou `trace`, opcional na leitura. `runSetup` consome a origem uma vez por execução, carimba hooks e skills com o mesmo instante e cita o identificador no relato. O `new Date(0)` foi removido.
  - [x] **VERIFY**: Os seis casos passam a GREEN e a suíte inteira fecha em 229 de 229 casos e 69 de 69 arquivos, incluindo os 184 anteriores. `npm run build` em exit 0. `grep` por `new Date(0)` em `src/setup/run.ts` devolve zero.
  - [x] **EVIDENCE**: Comandos, contagem, o conteúdo gravado e o resultado do `grep` registrados na seção 12.
  - [x] **IMPROVE**: A origem é consumida uma única vez por execução, e não por entrada. Um identificador que mudasse dentro da mesma execução não correlacionaria coisa alguma, e o mesmo vale para o instante.

  <!-- framework:evidence {"task": "T018", "refs": ["US-040", "FR-040", "FR-041", "FR-042", "NFR-040", "AC-040", "AC-041", "AC-042", "AC-043", "AC-051", "AC-052"], "files": ["src/setup/run.ts", "src/setup/record.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T019 [CODE] [US-040] Implementar em src/doctor.ts — Refs: US-040, FR-044, AC-046, AC-047, AC-053 — Depends: T007, T008, T014, T017
  - [x] **PREP**: RED confirmado em T007, T008 e T014, com T017 em GREEN; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `Report` ganhou `trace`, preenchido quando uma raiz é informada. Sem raiz, o comportamento anterior é preservado inteiro.
  - [x] **VERIFY**: Os três casos passam a GREEN. `grep` por escrita em `src/doctor.ts` devolve zero.
  - [x] **EVIDENCE**: Comandos, contagem e o resultado do `grep` registrados na seção 12.
  - [x] **IMPROVE**: O campo é opcional, para que as chamadas sem raiz continuem válidas sem edição, no mesmo padrão adotado quando os conjuntos de skills entraram no relatório.

  <!-- framework:evidence {"task": "T019", "refs": ["US-040", "FR-044", "AC-046", "AC-047", "AC-053"], "files": ["src/doctor.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T023 [TEST] [TDD] [US-040] Derivar do caso-limite de gerador vazio o teste em tests/trace-gerador-vazio.test.ts — Refs: US-040, FR-040, FR-044, AC-040, AC-047 — Depends: T018
  - [x] **PREP**: A seção 7 exige tratar gerador que devolve valor vazio como ausência de identificador, sem gravar campo vazio. Nenhum caso cobre, e `runSetup` grava o campo com texto vazio.
  - [x] **EXECUTE**: Escrever o caso conferindo que o registro não ganha o campo quando o gerador devolve vazio, que a leitura reporta não identificado, e que o restante do registro permanece.
  - [x] **VERIFY**: RED observado — o caso que confere a ausência do campo reprova, porque o registro traz `trace` com texto vazio; os outros dois passam por já refletirem comportamento existente.
  - [x] **EVIDENCE**: `npx vitest run tests/trace-gerador-vazio.test.ts` com 1 reprovando e 2 aprovando. Registrado na seção 12.
  - [x] **IMPROVE**: O defeito passou pelo Delivery Gate porque a seção 7 lista casos-limite que não têm cenário `AC` próprio, e a matriz só cobre o que tem cenário. Casos-limite normativos precisam de caso executável mesmo sem `AC`.

- [x] T024 [CODE] [US-040] Omitir o campo quando o identificador for vazio em src/setup/run.ts — Refs: US-040, FR-040, FR-044, AC-040, AC-047 — Depends: T023
  - [x] **PREP**: T023 em RED; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `runSetup` passou a omitir `trace` quando o identificador vier vazio, com a mesma forma condicional já usada para a lista de skills.
  - [x] **VERIFY**: A suíte fecha em 232 de 232 casos e 70 de 70 arquivos. `npx tsc --noEmit`, `npm run build` e `build_documentation --check` em exit 0.
  - [x] **EVIDENCE**: Comandos, contagens e o conteúdo gravado registrados na seção 12.
  - [x] **IMPROVE**: Registro com campo vazio afirma identificação que não houve, o que é pior que a ausência do campo — a mesma razão pela qual o carimbo congelado era pior que carimbo ausente. O defeito e o que esta fatia corrige têm a mesma forma.

  <!-- framework:evidence {"task": "T024", "refs": ["US-040", "FR-040", "FR-044", "AC-040", "AC-047"], "files": ["src/setup/run.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

#### Fase 3 — Fechamento

- [x] T020 [DOC] Registrar os módulos e a ampliação do registro em .project-context/STACK.md — Refs: FR-040 — Depends: T018, T019
  - [x] **PREP**: Conferido o que mudou de estrutura: dois arquivos em `src/telemetry/` e o campo novo no registro.
  - [x] **EXECUTE**: `.project-context/STACK.md` ganhou a seção `Telemetria da execução`, com a responsabilidade de cada módulo e o campo acrescentado ao registro.
  - [x] **VERIFY**: `build_documentation --check` em exit 0 e o monitor de contexto em `CURRENT`.
  - [x] **EVIDENCE**: Comandos e exit codes registrados na seção 12.
  - [x] **IMPROVE**: A seção registra por que relógio e gerador são injetáveis, citando o congelamento que originou esta fatia, para que a próxima não repita a mesma troca entre determinismo e verdade.

- [x] T021 [DOC] Descrever em PROJECT.md que o registro identifica a execução e o momento — Refs: US-040 — Depends: T018, T019
  - [x] **PREP**: Localizadas as linhas do `setup` e do `doctor` na tabela de comandos.
  - [x] **EXECUTE**: As duas linhas passaram a mencionar a identificação da execução e do momento, e o relato do identificador pelo `doctor`.
  - [x] **VERIFY**: `build_documentation --check` em exit 0, e a afirmação conferida contra a superfície real.
  - [x] **EVIDENCE**: Comando, exit code e os trechos alterados registrados na seção 12.
  - [x] **IMPROVE**: Conferi as contagens escritas à mão no arquivo, corrigidas na auditoria anterior; seguem coerentes com quinze módulos e trinta e sete arquivos de teste na época daquela medição, e a próxima medição virá com a fatia seguinte.

- [x] T022 [OPS] Fechar o Delivery Gate na seção 13 de specs/completed/0006-fatia-1g-telemetria-trace-id/spec.md — Refs: NFR-040, NFR-041, NFR-042 — Depends: T020, T021, T024
  - [x] **PREP**: Vinte e três tarefas concluídas, cada `[CODE]` com seu comentário de evidência.
  - [x] **EXECUTE**: Suíte completa, `npm run verify`, e os auditores de aceite, evidência, rastreabilidade e research, este último com `--full-chain`.
  - [x] **VERIFY**: 232 casos em 70 arquivos; `tsc` e `build` em exit 0; `verify` em exit 0 a partir de clone limpo, em 4s; diretório pessoal com 42 entradas antes e depois.
  - [x] **EVIDENCE**: Comandos, contagens e exit codes registrados na seção 13.
  - [x] **IMPROVE**: Conferir `--full-chain` durante o fechamento funcionou: `NFR-040` apareceu com a cadeia quebrada e foi corrigido aqui, e não no aceite. Nas duas fatias anteriores o mesmo defeito só surgiu na validação final.

### 15. Ordem de execução

A Fase 1 inteira em paralelo: quinze arquivos distintos, sem dependência entre si. Não há dependência nova a instalar, então nada precede o RED.

A Fase 2 segue a direção da dependência. `T016` e `T017` são as únicas sem predecessor de código: a origem não conhece registro, e a leitura não conhece produção. `T018` consome a origem, `T019` consome a leitura.

Caminho crítico: `T003 → T016 → T018 → T020 → T022`. Cinco das vinte e duas tarefas.

O fechamento admite paralelismo entre `T020` e `T021`, que tocam arquivos diferentes, mas ambos precisam de `T018` e `T019` para descrever a superfície real.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Fatia 1b concluída, que fornece o `setup` e o registro.
- Fatia 1h concluída, que acrescentou a lista de skills ao mesmo registro.
- Fatia 1a concluída, que fornece o `doctor`.

#### Riscos

- **Casos instáveis** → foi para evitá-los que o carimbo foi congelado, criando o defeito que `R-040` documenta. Mitigação: `FR-043` exige injeção, e `AC-043`, `AC-044` e `AC-050` separam o que se afirma sobre valor do que se afirma sobre propriedade.
- **Quebrar registros existentes** → uma leitura estrita reprovaria o que já está gravado. Mitigação: `FR-045`, com `AC-047` e `AC-048`.
- **Identificador carregando dado do ambiente** → seria telemetria indesejada num produto que não envia nada. Mitigação: `NFR-041`, com `AC-049` e `AC-054`.
- **Asserção fraca deixando passar valor constante** → é exatamente o que aconteceu com o carimbo atual. Mitigação: `AC-052` exige que a época não apareça, o que nenhuma asserção existente exigia.

#### Suposições

Registradas na seção 13, todas reversíveis.

### 17. Decisões

- **DEC-040**: O identificador é por execução do `setup`, e não por sessão do editor. *Razão*: a execução é a unidade que escreve no registro, e correlacionar o que foi escrito é o objetivo. *Alternativa descartada*: identificador por prompt, que depende de eventos de editor e pertence ao épico de extensões.
- **DEC-041**: O identificador vive no registro que a fatia 1b já grava. *Razão*: é a mesma pergunta que o registro responde — o que esta execução colocou aqui — e um arquivo próprio criaria duas verdades.
- **DEC-042**: O carimbo constante é corrigido nesta fatia. *Razão*: `R-040` mostra que o instante gravado é sempre a época, e correlacionar sem instante verdadeiro não funciona. O defeito está no mesmo trecho que a fatia altera, e deixá-lo entregaria telemetria sobre um registro que mente.
- **DEC-043**: Relógio e gerador são injetáveis, com implementação real como padrão. *Razão*: determinismo dos casos não se compra congelando o valor em produção. O projeto já injeta ambiente, e esta é a mesma solução aplicada à mesma classe de problema.
- **DEC-044**: A leitura é tolerante e não reescreve. *Razão*: registros gravados antes desta fatia existem nas máquinas, e reescrevê-los na leitura transformaria um diagnóstico em mutação, contra a separação já decidida entre relatar e reparar.
- **DEC-045**: O identificador é opaco e produzido localmente. *Razão*: o produto não envia nada para fora, e um identificador derivado de máquina ou de pessoa seria dado indesejado num arquivo que fica no repositório de quem usa.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação registrada na seção 12.
- [x] Todas as tarefas da seção 14 estão concluídas.
- [x] Nenhuma entrada gravada por uma execução nova traz o instante da época.
- [x] Os casos que exercitam a origem real afirmam sobre propriedades, e não sobre valores específicos.
- [x] Um registro sem identificador e com o instante da época é lido sem erro e não é reescrito.
- [x] `.project-context/STACK.md` registra os módulos novos e a ampliação do registro.
- [x] `PROJECT.md` descreve que o registro passa a identificar a execução e o momento.
