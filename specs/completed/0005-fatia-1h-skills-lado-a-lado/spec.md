# Especificação integrada: Fatia 1h: instalar framework e mattpocock lado a lado

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0005 |
| Slug | 0005-fatia-1h-skills-lado-a-lado |
| Status | Complete |
| Effort | 5 |
| Effort updated at | 2026-08-29 |
| Effort rationale | O `setup` e o registro já existem. O custo está em acoplar um instalador de terceiro que simboliza por padrão, não fixa conteúdo e falha de formas que precisam chegar como falha. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — a entrega acontece dentro de um comando de terminal já existente, sem tela. |
| Atualizada em | 2026-08-29 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

O `setup` resolve três subsistemas e instala sete hooks, mas as skills de engenharia ficam fora. Quem as quer instala à mão, e o projeto não registra origem, referência nem presença. O `doctor` não consegue dizer o que está instalado, e nada percebe quando o conteúdo muda.

Há um obstáculo concreto: as skills de Matt Pocock não existem como pacote npm publicado pelo autor. O caminho oficial é um instalador de terceiro, o `skills`, da vercel-labs, que por padrão cria **link simbólico** para os diretórios do agente e não oferece lockfile, fixação de versão nem hash de commit.

Isso encontra três regras já vigentes neste projeto: nada se instala no ambiente global; a origem resolvida é sempre relatada; e falha silenciosa é o modo de falha caro. Um instalador que simboliza para um armazenamento fora do projeto e busca da ponta viola as três de uma vez, se usado como vem.

**Reabertura — 2026-08-30.** A entrega original implementou `installSkills` e a totalidade do registro/doctor sobre um `Executor` injetado, mas nunca escreveu a implementação real desse `Executor` nem chamou `installSkills` a partir de `src/cli.ts`. `runSetup` aceita `opts.skills` como campo opcional e, na ausência dele, pula a instalação silenciosamente — o comportamento correto para quando ninguém o fornece, mas `cli.ts` simplesmente nunca o fornecia. O resultado: `npm run build && common-rules setup` nunca instalou coisa alguma, em nenhuma execução real, desde que esta fatia foi dada por concluída. A pessoa responsável confirmou isso rodando o `setup` de verdade e não encontrando `.claude/skills/` nem `CLAUDE.md`/`AGENTS.md` no projeto de teste.

Investigando a causa raiz, duas lacunas distintas apareceram:

1. **Nenhum `Executor` real existe.** O único mecanismo de instalação de skills nesta fatia é o instalador `skills` (vercel-labs), já uma dependência npm fixada (`DEC-027`). Nenhum módulo de produção jamais invocou o binário local (`node_modules/skills/bin/cli.mjs`) por subprocesso; toda a suíte injeta um `Executor` fake.
2. **A instalação do framework former project tool em si nunca foi requisito desta fatia.** O Ato I original tratava `framework` só como o conjunto de skills que já convive em `.claude/skills/` — a AC-020 chega a testar "as skills do framework estão em .claude/skills/", mas nenhuma FR jamais declarou como esse conjunto chega lá. A pesquisa confirma, agora, que ele chega pelo mesmo instalador `skills`, apontado para `https://github.com/removed-project-integration` (ou o atalho `removed-project-integration`) em vez de `mattpocock/skills` — o mesmo mecanismo, uma segunda origem oficial. Separadamente, o próprio framework former project tool tem seu instalador de projeto, `former tool install --project <raiz>`, que grava `.project-context/`, `.agents/skills/`, e um bloco gerenciado em `CLAUDE.md` e `AGENTS.md` — e esse instalador nunca foi mencionado nesta fatia. Nenhuma das duas coisas depende de código novo elaborado: são dois subprocessos reais, do mesmo formato do `Executor` já desenhado.

`AGENTS.md` e a "camada de orquestração em `CLAUDE.md`" tinham sido registrados como fora de escopo, adiados para um épico de extensões da Phase 2 (ver Dúvidas respondidas, seção 2). Essa resposta permanece correta para *enriquecer* esses arquivos com conteúdo específico do `common-rules` — mas estava errada ao implicar que a mera *existência* desses arquivos dependia de trabalho futuro: ela é efeito colateral direto de rodar `former tool install` de verdade, o que sempre esteve ao alcance desta fatia.

**Reabertura — 2026-08-30, segunda vez no mesmo dia.** A verificação manual real que fechou a reabertura anterior provou instalação; não provou reexecução depois de perda de conteúdo. Reproduzido de propósito: `setup` instala 57 skills; `rm -rf .claude/skills` apaga tudo; `setup` roda de novo com a mesma aprovação e relata `já estava configurado: 7 hooks inalterados`, sem tocar em skill alguma — `.claude/skills/` permanece vazio. `runSetup` (`src/setup/run.ts`) decide "já configurado" por `matches()` (`src/setup/record.ts`), que compara **somente** nomes de hooks e versão do pacote contra o registro anterior; batendo, a função devolve cedo, antes até de chegar ao bloco que instala skills e o framework former project tool — que então nunca roda numa segunda execução, não importa o que exista de fato em disco. Captura em `specs/inbox/2026-08-30-122232-setup-nao-resincroniza-skills-nem-framework-quando-hooks-ja-batem.md`; evidência real em `research/reabertura-2026-08-30-drift/drift-nao-resincroniza.md`.

O defeito é da mesma família nomeada nesta sessão como "testar a forma, não o uso real": nenhum `AC` desta fatia — nem mesmo `AC-029`, que testa reexecução — chama `runSetup` duas vezes com os hooks já configurados; `AC-029` chama `installSkills` diretamente, contornando por completo o curto-circuito que causa o defeito.

#### Resultado desejado

Um único `setup` deixa os dois ecossistemas instalados, íntegros e lado a lado, e o projeto sabe dizer o que colocou lá.

Ao fim da fatia, `.claude/skills/` contém as skills do `framework` e as de `mattpocock/skills` como diretórios irmãos, em arquivos reais e não links — instaladas pelo mesmo instalador `skills`, cada conjunto pela sua origem oficial. O registro que a fatia 1b já grava ganha, para cada conjunto, a origem, a referência instalada e o hash do conteúdo. O `doctor` relata o que existe e o que divergiu, sem alterar coisa alguma.

Separadamente, o mesmo `setup` executa `former tool install --project <raiz>` de verdade, deixando `.project-context/`, `.agents/skills/`, `CLAUDE.md` e `AGENTS.md` presentes e atualizados no projeto — sem que o `common-rules` escreva ou componha o conteúdo desses arquivos por conta própria; quem o faz é o instalador do próprio former project tool.

O `common-rules` não escolhe entre os ecossistemas, não os mescla e não reescreve nenhum deles.

#### Métricas de sucesso

- Depois de um `setup`, os dois conjuntos de skills existem em `.claude/skills/` e nenhum sobrescreveu o outro.
- Nenhuma entrada instalada é link simbólico.
- Nada é escrito fora da raiz do projeto, em particular no diretório do usuário.
- O registro nomeia, por conjunto, a origem, o caminho de cada skill dentro dela e o hash do conteúdo.
- O `doctor` nomeia conjunto divergente e sai com código diferente de zero, sem tocar no sistema de arquivos.
- Origem que não seja uma das oficiais é recusada, com as aceitas nomeadas.
- O relato declara que a entrega dá rastreabilidade e não reprodutibilidade.
- Depois de um `setup`, `.project-context/`, `.agents/skills/`, `CLAUDE.md` e `AGENTS.md` existem no projeto, escritos pelo instalador real do former project tool.
- `common-rules setup`, executado de ponta a ponta sobre um projeto descartável de verdade — sem `Executor` injetado — produz os três resultados acima em disco.
- Apagar manualmente `.claude/skills/` ou `.project-context/` e rodar `setup` de novo restaura o que faltar, mesmo que os hooks já estivessem configurados.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-020** [critical] O instalador oficial cria link simbólico por padrão, aceita restringir o alvo e pode operar sem interação — Verdict: verified — Confidence: high — Evidence: research/instalador-skills/interface-da-cli.md#flags-relevantes-para-esta-fatia — Budget: 1/2.
- **R-021** [critical] Os dois conjuntos convivem em `.claude/skills/` sem que um remova ou sobrescreva o outro, e o instalador grava um lockfile com hash por skill — Verdict: verified — Confidence: high — Evidence: research/instalador-skills/coexistencia-observada.md#resultado — Budget: 2/2.
- **R-022** [critical] As skills do `framework` chegam a `.claude/skills/` pelo mesmo instalador `skills`, apontado para a origem `removed-project-integration` (atalho `owner/repo`, igual a `mattpocock/skills`), real, sem link, com lockfile na mesma forma — Verdict: verified — Confidence: high — Evidence: research/reabertura-2026-08-30/segunda-origem-oficial.md#resultado — Budget: 1/2.
- **R-023** [critical] `former tool install --project <raiz> --json` é um subprocesso separado do `skills`; grava `.project-context/`, `.agents/skills/`, `CLAUDE.md` e `AGENTS.md` com saída JSON estruturada e idempotente, e não toca `.claude/skills/` — Verdict: verified — Confidence: high — Evidence: research/reabertura-2026-08-30/framework-install-real.md#resultado-primeira-execução-projeto-vazio — Budget: 1/2.

A execução real em projeto descartável levou três diretórios simulados do `framework` a conviver com trinta e sete de `mattpocock`, quarenta no total, sem link simbólico em nível algum e sem que `AGENTS.md` ou `CLAUDE.md` fossem criados. A mesma execução revelou o `skills-lock.json`, que a documentação não menciona e que corrige uma afirmação anterior desta pesquisa.

O README do projeto descreve `--copy` como copiar arquivos **em vez de** criar link simbólico, o que revela o link como padrão. Também oferece `-a` para restringir agentes, `-y` para pular confirmações, `-s` para selecionar skills e `-g` para instalar no diretório do usuário. A ausência de lockfile, fixação de versão ou hash de commit é igualmente parte da observação.

#### Fontes e contexto consultados

- README de `github.com/vercel-labs/skills`, acessado em 2026-08-29.
- README de `github.com/mattpocock/skills`, que instrui o caminho oficial de instalação.
- Registro npm para `skills` 1.5.23 e para `mattpocock-skills` 1.3.0.
- `specs/backlog/0005-fatia-1h-skills-lado-a-lado.md`, o brief refinado.
- `specs/completed/0003-fatia-1b-setup-hooks/spec.md`, pelo `setup`, pelo registro e pela detecção.
- `specs/completed/0002-phase-1a-esqueleto-typescript/spec.md`, pela DEC-002 e pelo `doctor`.
- `.project-context/RULES.md`, pelas regras de instalação e de relato de origem.
- `src/setup/record.ts` e `src/doctor.ts`, pela forma real do registro e do relato.
- `node_modules/skills/bin/cli.mjs` e `node_modules/removed-project-integration/dist/installer.js`, executados de verdade a partir do checkout local, na reabertura de 2026-08-30.

#### Documentação consultada

Dois README públicos e o registro npm. As notas ficam em `research/`, sem reprodução de texto de terceiro.

#### Artefatos de pesquisa armazenados

- `specs/completed/0005-fatia-1h-skills-lado-a-lado/research/instalador-skills/interface-da-cli.md` — interface observada da CLI, com proveniência, as flags relevantes e a consequência do padrão por link. Contém a correção da afirmação sobre ausência de lockfile.
- `specs/completed/0005-fatia-1h-skills-lado-a-lado/research/instalador-skills/coexistencia-observada.md` — execução real em projeto descartável, com contagem antes e depois, ausência de links, arquivos não criados e a forma do lockfile encontrado.
- `specs/completed/0005-fatia-1h-skills-lado-a-lado/research/reabertura-2026-08-30/segunda-origem-oficial.md` — execução real do `skills add removed-project-integration`, confirmando a segunda origem oficial e sua forma.
- `specs/completed/0005-fatia-1h-skills-lado-a-lado/research/reabertura-2026-08-30/framework-install-real.md` — execução real do `former tool install --project <raiz> --json`, confirmando o que ele grava e que é subprocesso distinto do `skills`.

#### Dúvidas respondidas

- **Q**: As skills de Matt Pocock entram por npm, como o `framework`? → **A**: Não. O autor não publica no npm; o `mattpocock-skills` do registro é de terceiro. O caminho oficial é o instalador `skills`.
- **Q**: O `common-rules` escolhe entre os ecossistemas? → **A**: Não. Ambos ficam instalados e íntegros; ele registra e relata.
- **Q**: Fixar a versão do instalador basta? → **A**: Não. O conteúdo vem da ponta. A fatia entrega rastreabilidade, e a limitação é assumida.
- **Q**: E a camada de orquestração em `CLAUDE.md`? → **A**: Fora desta fatia. Pertence ao épico de extensões da Phase 2.
- **Q**: E `AGENTS.md`? → **A**: Espera a fatia 1d, que abre a detecção de outros backends.
- **Q** [reaberta 2026-08-30, corrige as duas anteriores]: A existência de `CLAUDE.md` e `AGENTS.md` também espera a Phase 2 ou a fatia 1d? → **A**: Não — essa era uma leitura errada. A pessoa responsável pelo produto esclareceu: os dois arquivos nascem como efeito colateral direto de rodar o instalador de cada dependência (`former tool install`, `skills add`) apontado para o diretório vigente; nenhum código de orquestração precisa existir para eles simplesmente existirem. R-023 confirma isso na prática. O que continua fora desta fatia — e é o que as duas respostas antigas realmente queriam dizer — é o `common-rules` **enriquecer** esses arquivos com conteúdo próprio (a "camada de orquestração"); essa parte permanece adiada.
- **Q** [nova, 2026-08-30]: E se o diretório do projeto não for informado corretamente ao rodar o `setup`? → **A**: Não é um risco novo desta fatia: `runSetup` já recebe `root` por parâmetro e `cli.ts` já o resolve por `process.cwd()`; as duas novas chamadas reais (`skills add` para a segunda origem e `former tool install --project`) usam essa mesma raiz, sem introduzir uma segunda fonte de verdade para "onde instalar".

#### Dúvidas abertas

Nenhuma que bloqueie esta fatia.

### 3. Escopo e atores

#### Incluído

- Instalação real, por subprocesso, do conjunto de `mattpocock/skills` e do conjunto de `removed-project-integration` pelo mesmo instalador oficial `skills`, em escopo de projeto, restrita ao alvo Claude Code e sem interação.
- Execução real, por subprocesso, do instalador de projeto do próprio framework former project tool (`former tool install --project <raiz>`), deixando `.project-context/`, `.agents/skills/`, `CLAUDE.md` e `AGENTS.md` presentes e atualizados — sem o `common-rules` escrever ou compor o conteúdo desses arquivos.
- Uso de cópia real em vez de link simbólico, nas duas origens do instalador `skills`.
- Entradas no registro existente com origem, referência instalada e hash do conteúdo, por conjunto de skills.
- Relato pelo `doctor` da presença de cada conjunto e da divergência entre o registrado e o presente.
- Recusa de qualquer origem que não seja uma das duas oficiais, nomeando as aceitas.
- Recusa de conflito de nome entre diretórios dos dois conjuntos, em vez de sobrescrita.

#### Fora de escopo

- O `common-rules` **enriquecer** `CLAUDE.md` ou `AGENTS.md` com conteúdo próprio de orquestração — os arquivos existirem é o instalador do former project tool quem garante, dentro desta fatia; compor conteúdo adicional neles pertence ao épico de extensões da Phase 2.
- Detectar ou instalar para outros backends de agente além do former project tool e do Claude Code — isso espera a fatia 1d.
- Mesclar, reescrever, preterir ou desativar qualquer um dos conjuntos de skills.
- Instalação no diretório do usuário ou em qualquer lugar fora do projeto.
- Reparo, reversão ou remoção de conteúdo divergente.
- Alvos de editor além do Claude Code.
- Fixar o conteúdo instalado, que nenhum dos dois instaladores permite.

#### Atores

- **Quem usa o `common-rules`**: roda um `setup` e obtém o ambiente do agente completo — skills dos dois ecossistemas e o framework former project tool instalado no projeto.
- **Quem mantém este repositório**: deixa de instalar skills e framework à mão.
- **O `doctor`**: passa a ter o que relatar sobre os conjuntos de skills.
- **A fatia 1d e o épico de extensões**: herdam o registro e a instalação, sem recriá-los.

### 4. Princípios e restrições do projeto

- **PR-020**: Os dois ecossistemas ficam íntegros. O `common-rules` orquestra, não arbitra.
- **PR-021**: Nada é instalado fora do projeto.
- **PR-022**: Arquivo real, nunca link simbólico. Conteúdo por link não descreve o que o agente lê.
- **PR-023**: A entrega promete rastreabilidade, não reprodutibilidade, e diz isso em voz alta.
- **PR-024**: Nada é apagado nem revertido por esta entrega.

### 5. Histórias de usuário

#### US-020 — Obter o ambiente completo com um comando

Como **quem usa o `common-rules`**, quero **que um único `setup` instale os dois conjuntos de skills**, para **não montar o ambiente do agente à mão**.

**Por que P1**: É a razão da fatia. Sem ela o `setup` entrega um ambiente incompleto e a diferença fica por conta de cada pessoa.
**Teste independente**: Após um `setup`, os dois conjuntos existem em `.claude/skills/` como arquivos reais, nenhum sobrescreveu o outro, e nada foi criado fora do projeto.
**Requisitos**: FR-020, FR-021, FR-022, FR-026

#### US-021 — Saber o que está instalado e o que mudou

Como **quem mantém o projeto**, quero **que o registro e o `doctor` digam o que foi instalado e o que divergiu**, para **que a diferença entre máquinas apareça em vez de agir em silêncio**.

**Por que P1**: O instalador não fixa conteúdo. Sem registro, a deriva é invisível, que é o modo de falha caro deste projeto.
**Teste independente**: O registro nomeia origem, referência e hash por conjunto; alterado o conteúdo, o `doctor` nomeia o conjunto divergente, sai com código diferente de zero e não altera nada.
**Requisitos**: FR-023, FR-024, FR-025

#### US-022 — Recusar o que não é a origem oficial

Como **quem usa o `common-rules`**, quero **que apenas a origem oficial seja aceita**, para **não receber skills de uma republicação de terceiro sem perceber**.

**Por que P1**: Skills são instruções que entram no contexto do agente. Existe no npm uma republicação com nome plausível apontando o repositório original nos metadados.
**Teste independente**: Pedida uma origem diferente da oficial, o comando recusa e nomeia a aceita; instalador ausente ou rede indisponível produzem erro, e nunca relato de sucesso.
**Requisitos**: FR-020, FR-025, FR-026

#### US-023 — Ter o framework former project tool instalado no projeto, não só suas skills

Como **quem usa o `common-rules`**, quero **que o mesmo `setup` execute o instalador de projeto do former project tool**, para **encontrar `.project-context/`, `CLAUDE.md` e `AGENTS.md` prontos, sem rodar um segundo comando à mão**.

**Por que P1**: É a lacuna que motivou a reabertura desta fatia: o comando existia por trás de um `Executor` nunca implementado, e a pessoa que rodou o `setup` de verdade não encontrou nem os arquivos nem as skills.
**Teste independente**: Após um `setup` sobre um projeto novo, `.project-context/`, `.agents/skills/`, `CLAUDE.md` e `AGENTS.md` existem, escritos pelo instalador real do former project tool; rodar de novo não duplica nem falha.
**Requisitos**: FR-028, FR-029

### 6. Cenários BDD de aceite

#### AC-020 — Os dois conjuntos convivem após um setup

**Cobre**: US-020, FR-020, FR-026, FR-027

```gherkin
@US-020 @FR-020 @FR-026 @FR-027 @AC-020
Feature: Convivência dos ecossistemas

  Scenario: Um único setup deixa os dois instalados
    Given um projeto com evidência de uso do alvo
    When o setup roda
    Then as skills do framework estão em .claude/skills/
    And as skills de mattpocock estão em .claude/skills/
    And nenhuma sobrescreveu a outra
```

#### AC-021 — A instalação usa arquivo real

**Cobre**: US-020, FR-021, NFR-022

```gherkin
@US-020 @FR-021 @NFR-022 @AC-021
Feature: Cópia em vez de link

  Scenario: Nenhuma entrada instalada é link simbólico
    Given o setup concluído sobre um projeto válido
    When as entradas instaladas são inspecionadas
    Then nenhuma delas é link simbólico
    And o conteúdo lido pelo agente vive dentro do projeto
```

#### AC-022 — O diretório do usuário permanece intocado

**Cobre**: US-020, FR-022, NFR-022

```gherkin
@US-020 @FR-022 @NFR-022 @AC-022
Feature: Confinamento ao projeto

  Scenario: Nada é escrito fora da raiz
    Given a árvore do diretório do usuário registrada antes da execução
    When o setup instala os dois conjuntos
    Then os arquivos aparecem apenas dentro do projeto
    And a árvore do diretório do usuário permanece igual
```

#### AC-023 — O registro nomeia origem, referência e hash

**Cobre**: US-021, FR-023

```gherkin
@US-021 @FR-023 @AC-023
Feature: Registro do que foi instalado

  Scenario: Cada conjunto aparece com sua procedência
    Given o setup concluído
    When o registro de instalação é lido
    Then cada conjunto instalado aparece nomeado
    And traz a origem de onde veio
    And traz a referência instalada e o hash do conteúdo
```

#### AC-024 — O doctor relata o que está presente

**Cobre**: US-021, FR-024

```gherkin
@US-021 @FR-024 @AC-024
Feature: Relato de presença

  Scenario: O doctor enumera os conjuntos
    Given um projeto com os dois conjuntos instalados
    When o doctor examina o projeto
    Then ele nomeia cada conjunto e sua origem
    And sai com código zero quando nada divergiu
```

#### AC-025 — O doctor torna a deriva visível sem mutar nada

**Cobre**: US-021, FR-024, NFR-020

```gherkin
@US-021 @FR-024 @NFR-020 @AC-025
Feature: Deriva visível

  Scenario: Conteúdo alterado depois da instalação
    Given um conjunto de skills alterado após o setup
    When o doctor examina o projeto
    Then ele nomeia o conjunto divergente
    And sai com código diferente de zero
    And nenhum arquivo é criado, alterado ou removido
```

#### AC-026 — A republicação de terceiro é recusada

**Cobre**: US-022, FR-020, FR-025

```gherkin
@US-022 @FR-020 @FR-025 @AC-026
Feature: Origem oficial

  Scenario: O pacote npm de terceiro não é aceito
    Given um pedido de instalar as skills a partir do pacote npm de terceiro
    When o setup processa esse pedido
    Then ele recusa
    And nomeia a origem oficial como a única aceita
    And nada é instalado
```

#### AC-027 — Conflito de nome recusa em vez de sobrescrever

**Cobre**: US-022, FR-026, NFR-020

```gherkin
@US-022 @FR-026 @NFR-020 @AC-027
Feature: Conflito entre conjuntos

  Scenario: Dois conjuntos disputam o mesmo nome de diretório
    Given um diretório de skills cujo nome já pertence ao outro conjunto
    When o setup tenta instalar
    Then ele recusa e nomeia o conflito
    And o diretório existente permanece como estava
```

#### AC-028 — Instalador ausente não vira sucesso

**Cobre**: US-022, FR-020, NFR-021

```gherkin
@US-022 @FR-020 @NFR-021 @AC-028
Feature: Instalador indisponível

  Scenario: O instalador oficial não pode ser executado
    Given um ambiente em que o instalador não está disponível
    When o setup tenta instalar o conjunto
    Then a resposta indica que o conjunto não foi instalado
    And não afirma sucesso
    And o restante do setup segue e é relatado
```

#### AC-029 — Reexecutar não duplica nem sobrescreve

**Cobre**: US-020, FR-023, FR-026, NFR-020

```gherkin
@US-020 @FR-023 @FR-026 @NFR-020 @AC-029
Feature: Reexecução

  Scenario: O segundo setup reconhece o estado
    Given um projeto já configurado pelo setup
    When o setup roda outra vez
    Then o registro continua com uma entrada por conjunto
    And nenhum conteúdo instalado foi removido
```

#### AC-030 — O relato declara o alcance da garantia

**Cobre**: US-021, FR-024, NFR-021

```gherkin
@US-021 @FR-024 @NFR-021 @AC-030
Feature: Garantia declarada

  Scenario: O relato não promete o que não entrega
    Given os dois conjuntos instalados e registrados
    When o doctor relata os conjuntos
    Then o relato informa que a referência não é fixada pela origem
    And não afirma que duas máquinas obterão conteúdo idêntico
```

#### AC-031 — Instalação parcial não passa por completa

**Cobre**: US-022, FR-020, NFR-021

```gherkin
@US-022 @FR-020 @NFR-021 @AC-031
Feature: Falha no meio do caminho

  Scenario: A instalação é interrompida antes de terminar
    Given uma execução do instalador que falha no meio
    When o setup avalia o resultado
    Then ele relata que o conjunto não ficou instalado
    And o registro não ganha entrada para um conjunto incompleto
```

#### AC-032 — Nenhum caminho apaga conteúdo

**Cobre**: US-020, FR-021, FR-022, FR-026, NFR-020, NFR-022

```gherkin
@US-020 @FR-021 @FR-022 @FR-026 @NFR-020 @NFR-022 @AC-032
Feature: Entrega não destrutiva

  Scenario: Recusa, conflito e reexecução preservam o que existe
    Given um projeto com conteúdo instalado e um conflito preparado
    When o setup recusa por conflito e depois roda de novo
    Then nenhum arquivo foi apagado em qualquer dos caminhos
    And nada fora da raiz do projeto foi tocado
```

#### AC-033 — Link simbólico não é forma aceita de instalação

**Cobre**: US-020, FR-021, FR-022, NFR-022

```gherkin
@US-020 @FR-021 @FR-022 @NFR-022 @AC-033
Feature: Recusa de conteúdo por link

  Scenario: Um conjunto presente como link é tratado como inválido
    Given um diretório de skills que é link simbólico para fora do projeto
    When o setup ou o doctor avalia esse conjunto
    Then ele é reportado como inválido
    And a razão cita que o conteúdo precisa viver dentro do projeto
```

#### AC-034 — O registro guarda apenas a origem oficial

**Cobre**: US-021, FR-023, FR-025

```gherkin
@US-021 @FR-023 @FR-025 @AC-034
Feature: Procedência no registro

  Scenario: A origem gravada é a oficial
    Given o conjunto instalado pelo caminho oficial
    When o registro é lido
    Then a origem gravada é a oficial
    And nenhuma outra origem aparece no registro
```

#### AC-035 — Origem arbitrária é recusada

**Cobre**: US-022, FR-025, NFR-021

```gherkin
@US-022 @FR-025 @NFR-021 @AC-035
Feature: Origem fora da lista

  Scenario: Um endereço qualquer não serve como fonte
    Given um pedido de instalar de uma origem que não a oficial
    When o setup processa o pedido
    Then ele recusa
    And explica que a origem não é reconhecida
    And nada é baixado nem instalado
```

#### AC-036 — O setup real, sem fixture, instala as duas origens de skills

**Cobre**: US-020, FR-020, FR-027

```gherkin
@US-020 @FR-020 @FR-027 @AC-036
Feature: Instalação real de ponta a ponta

  Scenario: setup roda sem Executor injetado sobre um projeto descartável
    Given um projeto novo, vazio, com evidência de uso do alvo Claude Code
    When o common-rules setup roda de verdade, sem nenhum executor de teste injetado
    Then .claude/skills/ contém as skills de mattpocock/skills
    And .claude/skills/ contém as skills de removed-project-integration
    And nenhuma delas é link simbólico
```

#### AC-037 — Uma origem falhar não contamina a outra

**Cobre**: US-020, FR-020, FR-027, NFR-021

```gherkin
@US-020 @FR-020 @FR-027 @NFR-021 @AC-037
Feature: Independência entre origens

  Scenario: A origem de mattpocock falha e a de framework segue
    Given uma execução em que o instalador falha só para uma das duas origens
    When o setup avalia o resultado das duas
    Then a origem que teve sucesso é relatada como instalada
    And a origem que falhou é relatada como não instalada
    And nenhuma das duas é relatada com o resultado da outra
```

#### AC-038 — O setup instala o framework former project tool de verdade

**Cobre**: US-023, FR-028, FR-029

```gherkin
@US-023 @FR-028 @AC-038
Feature: Instalação real do framework

  Scenario: setup roda sobre um projeto novo
    Given um projeto novo, vazio, com evidência de uso do alvo Claude Code
    When o common-rules setup roda
    Then .project-context/ existe no projeto
    And .agents/skills/ existe no projeto
    And CLAUDE.md existe no projeto
    And AGENTS.md existe no projeto
```

#### AC-039 — Reexecutar o instalador do former project tool não falha nem duplica

**Cobre**: US-023, FR-028, FR-029, NFR-020

```gherkin
@US-023 @FR-029 @NFR-020 @AC-039
Feature: Idempotência do instalador do framework

  Scenario: O segundo setup encontra o projeto já instalado
    Given um projeto em que o setup já rodou uma vez
    When o setup roda outra vez
    Then a execução termina sem erro
    And nenhum arquivo do former project tool é duplicado ou apagado
```

#### AC-040 — Instalador do former project tool ausente não vira sucesso

**Cobre**: US-023, FR-028, NFR-021

```gherkin
@US-023 @FR-028 @NFR-021 @AC-040
Feature: Falha do instalador do framework

  Scenario: O instalador do former project tool não pode ser executado
    Given um ambiente em que o instalador do former project tool não está disponível
    When o setup tenta executá-lo
    Then a resposta indica que o framework não foi instalado
    And não afirma sucesso
    And o restante do setup segue e é relatado
```

#### AC-041 — Nada mudou é relatado como nada mudou

**Cobre**: US-023, FR-029, NFR-021

```gherkin
@US-023 @FR-029 @NFR-021 @AC-041
Feature: Relato fiel de reexecução sem mudança

  Scenario: O instalador do former project tool não tem nada a fazer
    Given um projeto em que o instalador do former project tool já está com tudo atualizado
    When o setup roda de novo
    Then o setup relata que o framework já estava atualizado
    And não afirma ter instalado o que não instalou
```

#### AC-077 — Skills apagadas são restauradas mesmo com hooks já configurados

**Cobre**: US-020, FR-030

```gherkin
@US-020 @FR-030 @AC-077
Feature: Reconciliação de skills ausentes

  Scenario: .claude/skills/ foi apagado depois de um setup anterior
    Given um projeto em que os hooks já estão configurados e .claude/skills/ foi apagado
    When o setup roda de novo
    Then o setup não relata "já estava configurado" sem mais
    And as skills voltam a existir em .claude/skills/
```

#### AC-078 — former project tool former project tool apagado é restaurado mesmo com hooks já configurados

**Cobre**: US-023, FR-030

```gherkin
@US-023 @FR-030 @AC-078
Feature: Reconciliação do framework ausente

  Scenario: .project-context/ foi apagado depois de um setup anterior
    Given um projeto em que os hooks já estão configurados e .project-context/ foi apagado
    When o setup roda de novo
    Then o setup não relata "já estava configurado" sem mais
    And .project-context/ volta a existir
```

#### AC-079 — Nada ausente preserva o curto-circuito original

**Cobre**: US-020, US-023, FR-030

```gherkin
@US-020 @US-023 @FR-030 @AC-079
Feature: Curto-circuito preservado quando não há drift

  Scenario: Hooks, skills e framework continuam todos presentes
    Given um projeto configurado por um setup anterior, com tudo intacto
    When o setup roda de novo
    Then o setup relata "já estava configurado" sem consultar aprovação
    And nenhum instalador de skills nem do framework é invocado
```

### 7. Requisitos

#### Funcionais

- **FR-020**: O `setup` deve instalar o conjunto de `mattpocock/skills` pelo instalador oficial — o comando que o README do autor documenta, `npx skills@latest add mattpocock/skills`, aqui executado pelo binário local do pacote fixado —, em escopo de projeto, restrito ao alvo Claude Code e sem interação. A invocação é um subprocesso real, disparado a partir de `src/cli.ts` em toda execução do comando `setup`; não basta que o mecanismo exista testável por injeção — o comando de produção precisa efetivamente chamá-lo.
- **FR-021**: A instalação deve produzir arquivos reais dentro do projeto, e nunca link simbólico.
- **FR-022**: Nada deve ser escrito fora da raiz do projeto, em particular no diretório do usuário.
- **FR-023**: O registro de instalação deve conter, por conjunto, o nome, a origem e a procedência por skill — caminho e hash —, lida do lockfile que o instalador grava, sem recalcular o que ele já computou.
- **FR-024**: O `doctor` deve relatar cada conjunto presente e nomear o que divergiu do registrado, saindo com código diferente de zero quando houver divergência, sem alterar o sistema de arquivos.
- **FR-025**: Origem diferente das oficiais deve ser recusada, com as origens aceitas nomeadas.
- **FR-026**: Nenhum conjunto deve sobrescrever o outro; conflito de nome deve ser recusado com o conflito nomeado.
- **FR-027**: O `setup` deve instalar, pelo mesmo instalador oficial `skills` e com a mesma restrição de alvo, cópia e ausência de interação de FR-020, o conjunto de `removed-project-integration` — a segunda origem oficial, ao lado de `mattpocock/skills`.
- **FR-028**: O `setup` deve executar o instalador de projeto do próprio framework former project tool (`former tool install --project <raiz>`, pelo binário local do pacote já fixado como dependência), como subprocesso real disparado a partir de `src/cli.ts` em toda execução do comando `setup`.
- **FR-029**: A execução do instalador do former project tool deve ser idempotente do ponto de vista do `setup`: reexecutar sobre um projeto já instalado não deve falhar, duplicar entrada no registro desta fatia, nem apagar o que o instalador do former project tool já gravou.
- **FR-030**: O `setup` não deve considerar um projeto "já configurado" só porque os hooks batem com o registro anterior: se algum conjunto de skills ou o framework former project tool previamente registrados estiverem ausentes do disco, o `setup` deve seguir para a instalação real desses conjuntos, mesmo com os hooks inalterados.

#### Não funcionais

- **NFR-020**: **Não destrutivo**. Nenhum caminho desta entrega apaga, reverte ou remove conteúdo. **Verificação**: comparação da árvore antes e depois nos caminhos de sucesso, de recusa e de conflito.
- **NFR-021**: **Rastreabilidade declarada**. A entrega registra procedência e torna a deriva visível, e declara que não garante reprodutibilidade. **Verificação**: leitura do relato do `doctor` e inspeção do registro, conferindo que a limitação é dita e que falha não vira sucesso.
- **NFR-022**: **Confinamento**. Cada conteúdo instalado vive dentro da raiz do projeto, em arquivo real. **Verificação**: inspeção das entradas quanto a link simbólico e comparação da árvore do diretório do usuário antes e depois.

#### Erros e casos-limite

- Instalador ausente ou não executável → relatar que o conjunto não foi instalado, seguir com o restante do `setup` e não afirmar sucesso.
- Execução do instalador terminando com erro → não gravar entrada no registro para conjunto incompleto.
- Rede indisponível → mesmo tratamento da falha de execução, com a causa dita.
- Diretório de skills presente como link simbólico → reportar como inválido, citando que o conteúdo precisa viver dentro do projeto.
- Conflito de nome entre conjuntos → recusar, nomear o conflito, preservar o existente.
- Alvo não detectado na raiz → relatar alvo ignorado, como o `setup` já faz para os hooks, sem tratar como erro.
- Registro corrompido → recusar e pedir reexecução, sem reconstruir por inferência.
- Instalador do former project tool ausente, não executável, ou terminando com erro → relatar que o framework não foi instalado, seguir com o restante do `setup` e não afirmar sucesso; mesmo tratamento de FR-020 para o instalador `skills`.
- Uma das duas origens do instalador `skills` falha e a outra não → cada origem é tratada de forma independente: a que teve sucesso é relatada como instalada, a que falhou é relatada como não instalada, e nenhuma das duas contamina o relato da outra.
- Hooks já configurados, mas `.claude/skills/` ausente ou incompleto em relação ao que o registro anterior lista → o `setup` não trata como "já configurado"; segue para aprovação e para a instalação real.
- Hooks já configurados, mas `.project-context/` ausente → mesmo tratamento: não é "já configurado", segue para a instalação real do framework.
- Hooks já configurados, `.claude/skills/` e `.project-context/` presentes e completos → "já configurado" continua valendo, sem consultar aprovação nem invocar instalador algum — o curto-circuito original permanece correto quando não há de fato nada a fazer.

### 8. Plano técnico

#### Contexto existente

- `runSetup` recebe `root` por parâmetro e devolve resultado estruturado; `writeRecordFile` e `readRecordFile` operam sobre raiz explícita.
- `InstallRecord` tem hoje `target`, `version` e `hooks`, com `RecordEntry` de `name`, `target`, `version`, `installedAt` e `event`.
- `inspectDependencies` devolve `Report` com `results` e `exitCode`, e `DependencyResult` traz `name`, `layer`, `present`, `origin`, `version` e `hint`.
- O `setup` só escreve onde há evidência de uso do alvo e relata o que ignorou.
- A suíte tem 37 arquivos e 133 casos.
- `installSkills` já aceita um `Executor` injetado com a assinatura `(args, cwd) => { status, skills? } | null`, mas nenhum módulo de produção jamais implementou esse tipo — só fixtures de teste. `runSetup` já aceita `opts.skills` como campo opcional e pula a instalação quando ausente; `src/cli.ts` nunca o preenchia.

#### Arquitetura e módulos

| Módulo | Responsabilidade | Arquivo |
| --- | --- | --- |
| Origens aceitas | Nomear as duas origens oficiais (`mattpocock/skills`, `removed-project-integration`) e recusar as demais | `src/skills/source.ts` |
| Instalação de skills | Montar e executar a invocação do instalador `skills`, com alvo, cópia e sem interação, para uma origem por chamada | `src/skills/install.ts` |
| Inventário | Enumerar conjuntos presentes, detectar link simbólico e calcular hash | `src/skills/inventory.ts` |
| Registro de skills | Converter inventário em entradas e comparar com o registrado | `src/skills/record.ts` |
| **Executor real do `skills`** *(novo)* | Resolver o binário local do pacote `skills`, invocá-lo por subprocesso e traduzir a saída — TUI com `--list`, silenciosa sem — para a forma que `installSkills` espera | `src/skills/executor.ts` |
| **Instalação do framework** *(novo)* | Executar `former tool install --project <raiz> --json` por subprocesso e traduzir a saída JSON para um resultado estruturado | `src/framework/install.ts` |
| **Executor real do `former tool install`** *(novo)* | Resolver o binário local do pacote `removed-project-integration`, invocá-lo por subprocesso e traduzir a saída JSON | `src/framework/executor.ts` |

A origem vive separada porque é a única regra de recusa que não depende de sistema de arquivos, e precisa ser exercitável sem instalar nada. O inventário é separado da instalação para que o `doctor` o use sem carregar o caminho que escreve. Os dois executores reais vivem em módulo próprio, separados da lógica que decide o que fazer com o resultado (`installSkills`, `installformer project tool`), pela mesma razão que a fatia já seguia: a lógica de decisão precisa ser testável por injeção, sem subprocesso nem rede, e o executor real precisa ser o único lugar que sabe resolver caminho de binário e interpretar a saída de um instalador de terceiro.

#### Migrations

Não aplicável. A fatia não introduz banco.

#### Models

`InstallRecord` ganha uma lista `skills`, paralela a `hooks`, cujo item traz nome do conjunto, origem, referência instalada, hash e momento. A forma existente é preservada para não invalidar registros já gravados pela fatia 1b.

#### Controllers e casos de uso

`src/skills/install.ts` é acionado por `runSetup` depois dos hooks, uma vez por origem oficial — `mattpocock/skills` e `removed-project-integration` —, sempre com o mesmo `Executor` real injetado a partir de `src/cli.ts`; `src/skills/record.ts` é lido por `inspectDependencies` para o relato. `src/framework/install.ts` é acionado por `runSetup` na sequência, com seu próprio `Executor` real, também injetado a partir de `src/cli.ts`. Não há autorização a decidir.

A instalação do framework não ganha registro próprio nesta fatia: `former tool install --project <raiz> --json` já é idempotente por si — reexecutar sobre nada a fazer devolve `changed: 0` — e criar uma segunda fonte de verdade sobre o que ele já registra em `.project-context/` duplicaria a pergunta que `DEC-023` já resolveu para as skills. O `setup` relata o resultado que o instalador devolveu, sem persistir um registro paralelo.

**Ordem entre as duas chamadas ao `skills`.** `runSetup` já lê `previous: toRecordEntries(readLock(raiz))` uma vez, antes de chamar `installSkills`, para distinguir nome já registrado de conflito novo. Com duas origens na mesma execução, essa leitura precisa acontecer **entre** as duas chamadas, não só antes da primeira: a primeira chamada real ao `skills` reescreve `skills-lock.json` (confirmado que o instalador acumula entradas em vez de sobrescrever — `research/reabertura-2026-08-30/segunda-origem-oficial.md`), e a segunda chamada precisa enxergar esse estado atualizado para que seu próprio cálculo de conflito e de "já feito" seja correto. A ordem é: instalar origem 1 → reler o lockfile → instalar origem 2 com o lockfile relido como `previous` → montar o registro do `common-rules` a partir do lockfile final (já acumulado com as duas origens), do mesmo jeito que o código existente já faz com uma origem só.

**Redefinição de "já configurado" (`FR-030`).** `jaFeito`, hoje `matches(opts.previous, hooks, version)`, olha só hooks. Passa a ser a conjunção de três verificações independentes, cada uma barata e sem subprocesso:

1. `hooksJaFeito` — o que já existe: `matches()` sem mudança.
2. `skillsJaFeito` — verdadeiro quando `opts.skills` está ausente, **ou** quando `opts.previous?.skills` está vazio ou ausente, **ou** quando cada nome antes registrado ainda aparece em `inspectSkills(raiz).dirs`. Uma verificação de diretório, não uma chamada ao instalador.
3. `frameworkJaFeito` — verdadeiro quando `opts.project-context` está ausente, **ou** quando `existsSync(join(raiz, ".project-context"))`. Não há registro de procedência do framework (`DEC-030`), então a única pergunta que dá para fazer sem subprocesso é se `.project-context/` existe; é a mesma pergunta que capturaria o cenário real que motivou esta reabertura — apagar o diretório inteiro.

`jaFeito = hooksJaFeito && skillsJaFeito && frameworkJaFeito`. Qualquer um falso invalida o curto-circuito inteiro: a execução segue para a aprovação (quando `opts.approval` estiver presente, per SPEC-0007) e depois para os instaladores reais, que já são idempotentes — reinstalar hooks que não mudaram, ou skills que uma das duas verificações não tinha como conferir em detalhe, não duplica nem falha. O `raiz` usado nesses dois novos checks precisa ser calculado antes da checagem de `jaFeito`, não depois como hoje.

#### Views e experiência

Não aplicável. A seção 10 registra a ausência de interface.

#### Queries e repositórios

Não aplicável.

#### Jobs e processamento assíncrono

A instalação é síncrona dentro do `setup`. Não há fila.

#### Estrutura de arquivos

```text
src/skills/
  source.ts
  install.ts
  executor.ts        (novo)
  inventory.ts
  record.ts
src/framework/          (novo)
  install.ts
  executor.ts
tests/
  skills-fixtures.ts
  skills-registro-persistido.test.ts
  skills-source-oficial.test.ts
  skills-source-terceiro.test.ts
  skills-source-arbitraria.test.ts
  skills-install-alvo.test.ts
  skills-install-copia.test.ts
  skills-install-falha.test.ts
  skills-install-parcial.test.ts
  skills-inventory-symlink.test.ts
  skills-conflito.test.ts
  skills-confinamento.test.ts
  skills-registro.test.ts
  skills-doctor-presenca.test.ts
  skills-doctor-deriva.test.ts
  skills-doctor-garantia.test.ts
  skills-idempotente.test.ts
  skills-nao-destrutivo.test.ts
  skills-executor-real.test.ts        (novo — subprocesso real, sem fixture)
  skills-segunda-origem.test.ts       (novo)
  framework-install-real.test.ts        (novo — subprocesso real, sem fixture)
  framework-install-alvo.test.ts        (novo)
  framework-install-falha.test.ts       (novo)
  framework-install-idempotente.test.ts (novo)
  cli-setup-real.test.ts              (novo — dist/cli.js setup de ponta a ponta, sem fixture)
```

### 9. Modelo de dados

O registro em `.common-rules/install.json` ganha a lista `skills`. Cada item guarda o nome do conjunto, a origem, o caminho da skill dentro dela, o hash do conteúdo e o momento da instalação. Não há referência de commit nem versão: `DEC-024` registra que o instalador não as fornece, e nomear no modelo algo que a entrada não pode carregar seria prometer o que não se entrega. A lista `hooks` permanece como está. Ela passa a acumular entradas das duas origens do instalador `skills` — `mattpocock/skills` e `removed-project-integration` —, cada uma com sua própria origem gravada, na mesma execução do `skills-lock.json` compartilhado, cuja acumulação entre origens foi confirmada na reabertura (`research/reabertura-2026-08-30/segunda-origem-oficial.md`).

O hash existe para tornar a deriva visível, e não para impedi-la: o mesmo processo que escreve o conteúdo escreve o registro.

A instalação do framework former project tool (`DEC-029`) não ganha modelo próprio: `former tool install` já mantém seu próprio estado em `.project-context/` e não expõe hash nem lockfile equivalente para o `common-rules` referenciar sem recalcular — e recalcular repetiria o erro que `DEC-028` já evitou para as skills. O `setup` relata o resultado devolvido pelo instalador (`changed`, `paths`) sem persistir cópia.

### 10. Interfaces e contratos

#### Interface para pessoas

**Não há interface para pessoas.** A entrega acontece dentro de comandos de terminal que já existem, e quem lê o resultado é quem executou o comando ou o agente.

#### APIs expostas

Nenhuma. A fatia amplia o comportamento de `setup` e `doctor`.

#### APIs externas utilizadas

O executável `skills`, invocado como subprocesso, uma vez por origem oficial. O caminho documentado pelo autor é `npx skills@latest add mattpocock/skills`; esta fatia executa a mesma operação pelo binário local do pacote fixado (`node_modules/skills/bin/cli.mjs`), acrescentando alvo restrito, cópia real e ausência de interação. A forma exercitada na pesquisa foi `skills add <origem> -a claude-code --skill '*' --copy -y`, com `<origem>` igual a `mattpocock/skills` ou `removed-project-integration`, código de saída zero nas duas. A enumeração prévia (`--list`) devolve uma listagem formatada para terminal — não JSON —, com nome de cada skill em uma linha própria, indentada a quatro espaços após a marca `│`, seguida de linha em branco e de uma descrição indentada a seis; o executor real faz o parsing dessa forma, e trata como falha uma execução que termina com código zero mas não produz nome algum reconhecível. Falha de execução, ausência do executável e término com erro são tratados como erro pelo chamador.

O executável `framework`, do pacote `removed-project-integration` já fixado como dependência (`node_modules/removed-project-integration/bin/framework.cjs`), invocado como subprocesso na forma `former tool install --project <raiz> --json`. Ao contrário do `skills`, a saída é JSON estruturado e estável: `{"changed": <número>, "paths": [...]}`, código de saída zero em sucesso e em reexecução sem mudança nenhuma. Falha de execução, ausência do executável e término com erro são tratados como erro pelo chamador, do mesmo modo que o instalador `skills`.

#### Documentação das APIs consultadas

README de `github.com/vercel-labs/skills`, acessado em 2026-08-29, com as notas em `research/instalador-skills/interface-da-cli.md`. Execução real do `skills` para a segunda origem e do `former tool install --json`, em 2026-08-30, com as notas em `research/reabertura-2026-08-30/`.

#### Eventos e outros contratos

Não aplicável.

### 11. Estratégia TDD

- **Unidade**: aceitação e recusa de origem (as duas oficiais e as demais), detecção de link simbólico, e parsing da saída do `--list` do `skills` e do JSON do `former tool install`, com entradas construídas em diretório temporário ou string fixa — sem subprocesso.
- **Integração**: `setup` sobre projetos descartáveis, com o instalador injetado, conferindo o disco e o registro.
- **Confinamento**: execução conferindo que o diretório do usuário e um projeto vizinho permanecem intocados.
- **Falha**: instalador ausente, término com erro e interrupção no meio, todos exercitados pelo caminho real de erro.
- **Ponta a ponta real**: `skills-executor-real.test.ts`, `framework-install-real.test.ts` e `cli-setup-real.test.ts` chamam os binários locais de verdade (`node_modules/skills/bin/cli.mjs`, `node_modules/removed-project-integration/bin/framework.cjs`, `dist/cli.js`), sem `Executor` injetado, sobre diretório descartável criado pelo próprio teste. É a categoria que faltava nesta fatia e cuja ausência permitiu a lacuna de produção: toda a suíte anterior provava a lógica de decisão, e nenhum caso provava que `src/cli.ts` de fato chama o que decide.
- **Runner**: Vitest, pelo script `test:tdd`. Os casos de ponta a ponta real usam timeout explícito maior que o padrão, pelo mesmo motivo que `tests/hooks-context-mode-comando.test.ts` já precisou: subprocesso real, sob carga de build e instalação, excede os 5000ms padrão do runner.
- **Verificação manual**: `common-rules setup` executado de verdade num projeto descartável no notebook da pessoa responsável, com inspeção direta de `.claude/skills/`, `.project-context/`, `CLAUDE.md` e `AGENTS.md` — o mesmo tipo de verificação cuja ausência motivou a reabertura.
- **Drift**: `cli-setup-drift-real.test.ts` roda `setup` real duas vezes, apaga `.claude/skills/` (e, em outro caso, `.project-context/`) entre as duas execuções, e confere que a segunda instala de novo em vez de relatar "já estava configurado" sem mais. É a categoria que faltava até esta reabertura: nem mesmo `cli-setup-real.test.ts` ou `AC-029` chamam `setup`/`installSkills` uma segunda vez sobre hooks já configurados.

O ponto sensível é que os dois instaladores são subprocessos de terceiro. Os casos de unidade e integração injetam o executor em vez de chamar o `skills` ou o `framework` reais, para que a suíte principal não dependa de rede nem instale nada a cada rodada. Em troca, os casos precisam exercitar o contrato de falha com o mesmo rigor do de sucesso: instalador ausente e término com erro são os caminhos que, se tratados com descuido, produzem o relato de sucesso sobre nada — o defeito que a fatia 1b já cometeu uma vez, e que esta própria fatia cometeu na entrega original, ao nunca ligar a lógica testada ao comando real. A segunda reabertura repete a lição uma terceira vez, desta vez sobre reexecução: provar que o comando escreve não é o mesmo que provar que ele volta a escrever quando o disco diverge do registro.

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Comando de verificação | Evidência |
| --- | --- | --- | --- | --- |
| FR-020 | AC-020 | Integração | instalação dos dois conjuntos | **Passed** — skills-install-alvo, T020 |
| FR-020 | AC-026 | Unidade | recusa da republicação | **Passed** — skills-source-terceiro, T018 |
| FR-020 | AC-028 | Integração | instalador ausente | **Passed** — skills-install-falha, T020 |
| FR-020 | AC-031 | Integração | interrupção no meio | **Passed** — skills-install-parcial, T020 |
| FR-021 | AC-021 | Integração | nenhuma entrada é link | **Passed** — skills-install-copia, T019 |
| FR-021 | AC-032 | Confinamento | nada apagado | **Passed** — skills-nao-destrutivo, 3 casos, T021 |
| FR-021 | AC-033 | Unidade | link é inválido | **Passed** — skills-inventory-symlink, T019 |
| FR-022 | AC-022 | Confinamento | diretório do usuário intocado | **Passed** — skills-confinamento, 3 casos, T020 |
| FR-022 | AC-032 | Confinamento | nada fora da raiz | **Passed** — skills-nao-destrutivo, 3 casos, T021 |
| FR-022 | AC-033 | Unidade | conteúdo fora do projeto recusado | **Passed** — skills-inventory-symlink, T019 |
| FR-023 | AC-023 | Integração | registro com origem e hash | **Passed** — skills-registro e skills-registro-persistido, T029 |
| FR-023 | AC-029 | Integração | reexecução não duplica | **Passed** — skills-idempotente, T021 |
| FR-023 | AC-034 | Integração | origem gravada é a oficial | **Passed** — skills-source-oficial, T021 |
| FR-024 | AC-024 | Integração | relato de presença | **Passed** — skills-doctor-presenca, T021 |
| FR-024 | AC-025 | Integração | relato de divergência | **Passed** — skills-doctor-deriva, T021 |
| FR-024 | AC-030 | Integração | garantia declarada | **Passed** — skills-doctor-garantia, T021 |
| FR-025 | AC-026 | Unidade | republicação recusada | **Passed** — skills-source-terceiro, T018 |
| FR-025 | AC-034 | Integração | só a oficial no registro | **Passed** — skills-source-oficial, T021 |
| FR-025 | AC-035 | Unidade | origem arbitrária recusada | **Passed** — skills-source-arbitraria, T018 |
| FR-026 | AC-020 | Integração | nenhum sobrescreve o outro | **Passed** — skills-install-alvo, T020 |
| FR-026 | AC-027 | Integração | conflito recusado | **Passed** — skills-conflito, T020 |
| FR-026 | AC-029 | Integração | reexecução preserva | **Passed** — skills-idempotente, T021 |
| FR-026 | AC-032 | Confinamento | conflito não apaga | **Passed** — skills-nao-destrutivo, 3 casos, T021 |
| NFR-020 | AC-025 | Integração | doctor não muta | **Passed** — skills-doctor-deriva, T021 |
| NFR-020 | AC-027 | Integração | conflito preserva | **Passed** — skills-conflito, T020 |
| NFR-020 | AC-029 | Integração | reexecução preserva | **Passed** — skills-idempotente, T021 |
| NFR-020 | AC-032 | Confinamento | nenhum caminho apaga | **Passed** — skills-nao-destrutivo, 3 casos, T021 |
| NFR-021 | AC-028 | Integração | falha não vira sucesso | **Passed** — skills-install-falha, T020 |
| NFR-021 | AC-030 | Integração | limitação declarada | **Passed** — skills-doctor-garantia, T021 |
| NFR-021 | AC-031 | Integração | parcial não vira completa | **Passed** — skills-install-parcial, T020 |
| NFR-021 | AC-035 | Unidade | origem não reconhecida | **Passed** — skills-source-arbitraria, T018 |
| NFR-022 | AC-021 | Integração | arquivo real | **Passed** — skills-install-copia, T019 |
| NFR-022 | AC-022 | Confinamento | fora da raiz intocado | **Passed** — skills-confinamento, 3 casos, T020 |
| NFR-022 | AC-032 | Confinamento | nada fora do projeto | **Passed** — skills-nao-destrutivo, 3 casos, T021 |
| NFR-022 | AC-033 | Unidade | link recusado | **Passed** — skills-inventory-symlink, T019 |
| FR-020 | AC-036 | Ponta a ponta real | setup real instala as duas origens | **Passed** — cli-setup-real, T036/T042 |
| FR-027 | AC-020 | Integração | as duas origens convivem | **Passed** — skills-segunda-origem, T030/T037 |
| FR-027 | AC-036 | Ponta a ponta real | setup real instala as duas origens | **Passed** — cli-setup-real e skills-executor-real, T031/T036/T037/T038/T042 |
| FR-027 | AC-037 | Integração | independência entre origens | **Passed** — skills-segunda-origem, T030/T041 |
| FR-028 | AC-038 | Ponta a ponta real | setup real cria .project-context/, .agents/skills/, CLAUDE.md, AGENTS.md | **Passed** — cli-setup-real e framework-install-real, T032/T035/T036/T039/T040/T042 |
| FR-028 | AC-039 | Integração | reexecução do instalador do framework | **Passed** — framework-install-idempotente, T033/T039 |
| FR-028 | AC-040 | Integração | instalador do framework ausente | **Passed** — framework-install-falha, T034/T039 |
| FR-029 | AC-038 | Ponta a ponta real | setup real cria os artefatos do framework | **Passed** — cli-setup-real, T036/T042 |
| FR-029 | AC-039 | Integração | reexecução não falha nem duplica | **Passed** — framework-install-idempotente, T033/T039 |
| FR-029 | AC-041 | Integração | nada mudou é relatado fielmente | **Passed** — framework-install-idempotente, T033/T039 |
| NFR-021 | AC-037 | Integração | origem que falha não vira sucesso da outra | **Passed** — skills-segunda-origem, T030/T041 |
| NFR-021 | AC-040 | Integração | instalador do framework ausente não vira sucesso | **Passed** — framework-install-falha, T034/T039 |
| NFR-021 | AC-041 | Integração | relato fiel de nada mudou | **Passed** — framework-install-idempotente, T033/T039 |
| FR-030 | AC-077 | Ponta a ponta real | skills apagadas são restauradas | **Passed** — cli-setup-drift-real, T047/T050 |
| FR-030 | AC-078 | Ponta a ponta real | framework apagado é restaurado | **Passed** — cli-setup-drift-real, T048/T050 |
| FR-030 | AC-079 | Integração | sem drift, curto-circuito preservado | **Passed** — setup-jafeito-skills-framework, T049/T050 |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-08-29), reconfirmado no aceite final em 2026-08-29
- **Comando**: `node .claude/skills/framework-04-validate/scripts/validate_spec.mjs specs/completed/0005-fatia-1h-skills-lado-a-lado/spec.md`
- **Cobertura**: 3 US, 7 FR, 3 NFR, 16 AC, 9 DEC; mínimo de 3 AC por ID satisfeito nos treze. Identificadores de 020 a 035, conforme a regra de faixa por spec.
- **Research**: `load_research.mjs` em `PASSED`, com `R-020` e `R-021` verificados e dois artefatos indexados.

**Achados da rodada de definição**

| ID | Achado | Severidade | Estado |
| --- | --- | --- | --- |
| D1 | A spec não decidia como o instalador é obtido, e `npx` em tempo de execução buscaria a ponta a cada chamada | BLOCKER | Resolvido — `DEC-027` fixa o pacote em versão exata |
| D2 | A coexistência dos dois conjuntos era inferência e nunca fora observada | BLOCKER | Resolvido — execução real registrada como `R-021` |
| D3 | A pesquisa afirmava ausência de lockfile a partir da ausência dele no README | BLOCKER | Resolvido — `FR-023` passou a ler a procedência, `DEC-024` teve a razão corrigida e `DEC-028` foi acrescentada |
| D4 | O `skills-lock.json` está no `.gitignore`, e passa a carregar a procedência | WARNING | Resolvido em `T026` — permanece ignorado, com a razão escrita; a procedência que este produto controla passou a viver em `.common-rules/install.json` |
| D5 | Julguei errada a atribuição do `skills-lock.json` ao instalador do `framework` e a alterei. `removed-project-integration` declara `skills` entre suas dependências e seu instalador grava o arquivo: a atribuição original estava correta | NOTE | Revertido — comentário restaurado, e o erro registrado em vez de apagado |

**Achados do aceite final**

| ID | Achado | Severidade | Estado |
| --- | --- | --- | --- |
| A1 | `AC-022` não aparecia nas refs de evidência de nenhuma tarefa de código, e sob `--full-chain` — que é como o enforcement roda — a cadeia quebrava em `evidence`. `install.ts` é justamente o que não pode escrever fora da raiz | BLOCKER | Resolvido — `T020` passou a declarar `AC-022`, `FR-022` e `NFR-022`, que exercita de fato |
| A2 | As métricas da seção 1 e o modelo da seção 9 prometiam gravar a "referência instalada", enquanto `DEC-024` estabelece que o instalador não fornece referência de commit nem versão. A entrada guarda caminho e hash, não um ponteiro | WARNING | Resolvido — o vocabulário passou a nomear o que a entrada carrega, e a seção 9 registra por que não há referência |
| A3 | A estrutura da seção 8 omitia `tests/skills-registro-persistido.test.ts`, criado por `T028` | NOTE | Resolvido — acrescentado |
| A4 | `check_traceability` acusa vinte e sete marcadores órfãos, que são os das quatro specs anteriores | NOTE | Aceito — limitação conhecida, cuja correção pertence ao `removed-project-integration` |

**Sobre A1.** É a repetição exata do achado `A1` do aceite da `SPEC-0004`, onde os comentários de evidência omitiam identificadores que as tarefas serviam. Corrigi lá e reincidi aqui, o que indica que a causa não é desatenção pontual: escrevo as refs a partir do título da tarefa, e o título não carrega os identificadores que a implementação passa a cobrir quando o código cresce. Conferir a cadeia completa durante a entrega, e não apenas no aceite, é o que interromperia o ciclo.

#### Gate do Ato I — Reabertura 2026-08-30

- **Motivo da reabertura**: `common-rules setup` executado de verdade, sem `Executor` injetado, não instalava skill alguma nem o framework former project tool — `src/cli.ts` nunca fornecia `opts.skills` a `runSetup`, e nenhum `Executor` de produção jamais existiu. Confirmado por grep vazio em `src/` para `spawnSync`/`execSync`/`spawn` fora de `.test.ts`, e pela leitura direta de `formatSetup()`.
- **Escopo da mudança**: nova FR (instalação real do framework former project tool, nunca antes requisito desta ou de nenhuma outra fatia do roadmap) — mudança de comportamento, Ato I. Verificado que nenhuma das nove fatias do `BACKLOG-0003` jamais atribuiu essa responsabilidade a si.

**Achados da rodada de reabertura**

| ID | Achado | Severidade | Estado |
| --- | --- | --- | --- |
| DR1 | Nenhum `Executor` real do `skills` existe em produção; `installSkills` só é exercitado por fixture | BLOCKER | Resolvido no plano — `FR-020` passou a exigir explicitamente a chamada real, novo módulo `src/skills/executor.ts` |
| DR2 | `src/cli.ts` nunca passa `opts.skills` a `runSetup`; a instalação é pulada silenciosamente em toda execução real | BLOCKER | Resolvido no plano — tarefas de wiring cobrirão `src/cli.ts` explicitamente, com teste de ponta a ponta real (`cli-setup-real.test.ts`) provando que hoje isso falha |
| DR3 | `AC-020` já testava "as skills do framework estão em .claude/skills/", mas nenhuma FR jamais declarou essa origem — a AC cobria comportamento sem requisito correspondente | WARNING | Resolvido — `FR-027` acrescentada, nomeando a segunda origem oficial |
| DR4 | A existência de `CLAUDE.md`/`AGENTS.md` estava registrada como fora de escopo (Q&A original), mas isso é efeito colateral direto de `former tool install`, sempre alcançável dentro desta fatia — a resposta original confundia "existir" com "ser enriquecido pelo `common-rules`" | WARNING | Resolvido — Q&A corrigida na seção 2, `FR-028`/`FR-029` acrescentadas, escopo revisado nas seções 1 e 3 |
| DR5 | Hipótese de risco levantada nesta reabertura — duas chamadas reais e sequenciais ao instalador `skills`, de origens diferentes, poderiam sobrescrever uma à outra — testada e refutada por execução real: 20 + 37 = 57 diretórios, lockfile com as 57 entradas atribuídas corretamente | NOTE | Não é um defeito; registrado como verificação em `R-022` e no risco "Sobrescrita entre ecossistemas" da seção 16 |
| DR6 | Ordem de leitura do lockfile entre as duas chamadas de `installSkills` dentro do mesmo `runSetup` não estava decidida — reler antes de cada chamada é necessário para que a segunda origem calcule conflito e idempotência sobre o estado real após a primeira | WARNING | Resolvido no plano — seção 8, "Ordem entre as duas chamadas ao `skills`" |

**Limitação conhecida de ferramental.** `load_research.mjs` (vendorizado de `removed-project-integration`) usa uma âncora de seção com `$` dentro de um lookahead sob a flag `m`, que casa fim de qualquer linha, não só fim da seção; sobre "Artefatos de pesquisa armazenados" com mais de um item, ele captura só o primeiro. Rodou `PASSED` citando um único artefato mesmo com quatro indexados. Os quatro caminhos e as duas âncoras novas (`R-022`, `R-023`) foram conferidos manualmente contra o algoritmo do próprio script — existem, não são link e as âncoras resolvem para os títulos `## Resultado` e `## Resultado (primeira execução, projeto vazio)` depois do mesmo `slugify` que o script usa. A correção do script pertence ao `removed-project-integration`, mesma classe do achado `A4`.

**Sobre DR1/DR2, a causa raiz.** É o mesmo padrão nomeado nesta sessão como "testar a forma, não o uso real": a suíte inteira desta fatia — 133 casos originais — passa hoje, e nada nela chama o binário real nem o comando `setup` real. O Definition Gate, o Plan Gate e o Delivery Gate originais passaram sobre uma lógica de decisão correta e nunca ligada ao comando de produção. A correção estrutural não é só implementar o `Executor`: é acrescentar a categoria de teste que faltava (seção 11, "Ponta a ponta real"), para que a mesma lacuna não reapareça sem ser notada por meses.

#### Gate do Ato II — Plano

- **Resultado**: Passed (2026-08-29)
- **Comando**: `node .claude/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/completed/0005-fatia-1h-skills-lado-a-lado/spec.md`
- **Plano**: 27 tarefas — 16 `[TEST] [TDD]`, 6 `[CODE]`, 3 `[DOC]`, 2 `[OPS]`; 135 itens de checklist; 29 de 29 IDs cobertos.
- **RED**: `npm run test:tdd` com dezesseis arquivos novos reprovando por `Cannot find module` sobre `src/skills/source`, `src/skills/inventory`, `src/skills/install` e `src/skills/record`, e os 133 casos anteriores verdes. 50 casos marcados com `TRACEABILITY`, cobrindo os dezesseis `AC`.
- **Rastreabilidade**: `check_traceability.mjs` em 29 de 29 IDs cobertos sobre 55 arquivos de teste.

**Sobre a dependência.** `skills` entrou fixado em 1.5.23. A instalação revelou que ele já chegava ao projeto por via transitiva, como dependência de `removed-project-integration` em faixa `^1.5.22`. Declará-lo direto e exato o traz para dentro da regra de fixação, que a faixa transitiva não alcançava, e fortalece a `DEC-027` com uma razão que a definição não conhecia.

**Erro cometido e revertido.** No Definition Gate registrei que o comentário do `.gitignore` atribuía indevidamente o `skills-lock.json` ao instalador do `framework`, e alterei o comentário. A verificação seguinte mostrou que `removed-project-integration` declara `skills` entre suas dependências e que seu `installer.js` grava esse arquivo: a atribuição original estava correta e a minha alteração é que era o erro. O comentário foi restaurado com a confirmação, e o achado `D5` reescrito para registrar a reversão em vez de escondê-la.

**A regra de numeração fez o sintoma piorar antes de melhorar.** `check_traceability` acusa vinte e sete marcadores órfãos nesta spec, contra dois na anterior. A causa é aritmética: esta numera de 020 a 035, e nenhum marcador das quatro specs anteriores cai nesse conjunto. A regra impede que duas specs disputem o mesmo identificador, que é a ambiguidade grave; ela não conserta o auditor, que varre `tests/` sem saber a que spec pertence cada marcador. A correção pertence ao `removed-project-integration`, dono do auditor, e está registrada como pendência conhecida.

#### Gate do Ato III — Entrega

- **Resultado**: Passed (2026-08-29)
- **Verificação**: `npm run test:tdd` em exit 0, com **184 casos em 54 arquivos**; `npx tsc --noEmit` e `npm run build` em exit 0; `npm run verify` em exit 0 a partir de clone limpo, em 5s contra orçamento de 300; diretório pessoal com 42 entradas antes e depois.
- **Auditorias**: `verify_acceptance` em `QA: PASSED`; `verify_evidence` em `PASSED (strict)`; `load_research` em `PASSED`; `build_documentation --check` em exit 0; monitor de contexto em `CURRENT`.
- **Confinamento**: `skills-confinamento` e `skills-nao-destrutivo` conferem o primeiro nível do diretório pessoal e, sobretudo, `~/.claude/skills`, que é onde a forma global do instalador escreveria. Também conferem um projeto vizinho antes e depois.

**Defeitos encontrados durante a entrega, e corrigidos.**

| Onde | Defeito | Correção |
| --- | --- | --- |
| `FR-023` | A persistência exigida pela seção 9 não foi implementada, e nenhum caso a cobria: o caso de `AC-023` afirmava sobre o valor devolvido pela leitura do lockfile, e a spec distingue esse arquivo do registro do projeto | `T028` e `T029` acrescentadas ao plano, com RED antes do código. `InstallRecord` ganhou a lista `skills`, e `runSetup` foi reordenado para que a instalação preceda a montagem do registro |
| `tests/skills-confinamento.test.ts` | O oráculo percorria `$HOME` inteiro e estourava o tempo em 5s, além de ser instável porque outros processos escrevem lá | Substituído por um oráculo mais preciso: primeiro nível do diretório pessoal e o caminho exato onde a forma global escreveria |
| `src/skills/install.ts` | Declarada assíncrona sem necessidade, o que obrigaria `runSetup` a virar assíncrona e quebraria os 133 casos existentes | Passou a síncrona; os casos que a aguardavam seguem válidos |
| Matriz da seção 12 | Sete linhas seguiam como RED depois de os casos ficarem verdes | Corrigidas; foi o `verify_acceptance` que percebeu, não a suíte |

**Sobre o defeito de `FR-023`.** É a mesma classe que a fatia 1b descobriu tarde: afirmar sobre o retorno da função em vez do arquivo escrito. Ali o comando relatava sete hooks instalados sem produzir arquivo algum; aqui a leitura funcionava e a gravação não existia. A diferença é que desta vez o defeito apareceu antes do fechamento, ao conferir a seção 9 contra o código — e não depois, num clone limpo.

**Rastreabilidade com ressalva conhecida.** `check_traceability` cobre 29 de 29 identificadores desta fatia e acusa vinte e sete marcadores órfãos, que são os das quatro specs anteriores. A regra de faixa por spec impede que duas disputem o mesmo identificador; ela não conserta o auditor, que varre `tests/` sem saber a que spec pertence cada marcador. A correção pertence ao `removed-project-integration`.

#### Gate do Ato II — Plano da reabertura 2026-08-30

- **Resultado**: Passed
- **Comando**: `node .agents/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/completed/0005-fatia-1h-skills-lado-a-lado/spec.md --allow-draft`
- **Plano**: 17 tarefas novas (T030–T046) — 7 `[TEST] [TDD]`, 6 `[CODE]`, 2 `[DOC]`, 2 `[OPS]`; 46 tarefas no total, 39 IDs próprios cobertos.
- **RED**: cada uma das sete tarefas `[TEST] [TDD]` (T030–T036) observou RED real antes do código correspondente — `Cannot find module` para os módulos ainda inexistentes (`src/skills/executor`, `src/framework/install`, `src/framework/executor`), rejeição de origem para `removed-project-integration` em `tests/skills-segunda-origem.test.ts`, e ausência dos quatro artefatos (`.claude/skills/` com as duas origens, `.project-context/`, `.agents/skills/`, `CLAUDE.md`, `AGENTS.md`) em `tests/cli-setup-real.test.ts`, rodado contra `dist/cli.js setup` real — o mesmo comando que a pessoa responsável rodou manualmente para descobrir o defeito.
- **Ajuste no ciclo de validação**: `validate_tasks.mjs` exigiu no mínimo três predecessores `[TEST] [TDD]` rastreáveis por tarefa `[CODE]`; `T037`, `T038` e `T040`, desenhadas inicialmente com um ou dois, foram ajustadas para três, acrescentando `T036` (o teste de ponta a ponta real) como predecessor comum às duas frentes — correto, porque é ele quem de fato prova que o wiring final funciona.

#### Gate do Ato III — Entrega da reabertura 2026-08-30

- **Resultado**: Passed
- **Verificação**: `npm run test:tdd` em exit 0, com **304 casos em 96 arquivos** (era 184/54 no fechamento anterior); `npx tsc --noEmit` e `npm run build` em exit 0; `npm run verify` em exit 0 a partir de clone limpo (install 5s, build 1s, test 16s, total 22s).
- **Auditorias**: `check_traceability.mjs` em 39/39 IDs próprios cobertos (a ressalva de marcadores órfãos de outras specs persiste, mesma causa já registrada); `verify_acceptance.mjs` em `QA: PASSED`; `verify_repo.mjs` reporta `FAILED trace:<spec>` para as seis specs completas do repositório, inclusive `0001` — pré-existente, não introduzido por esta reabertura, mesma causa raiz.
- **Verificação manual real**: `node dist/cli.js setup` executado sobre projeto descartável fora deste repositório, sem `Executor` injetado — relatório completo e inspeção de disco em `T045`.
- **Documentação**: `docs/` reconstruído por `$framework-documentator` (`README.md`, `application.md`, `architecture.md`, `testing.md` alterados), `build_documentation.mjs --check` em exit 0, monitor de contexto em `CURRENT`; `.project-context/STACK.md` e `PROJECT.md` revisados à mão para os dois novos módulos e a segunda origem.

**Defeito de teste encontrado e corrigido durante a reabertura.** O primeiro desenho de `tests/skills-segunda-origem.test.ts` reusava `projetoComSkills()`, que pré-semeia três diretórios `framework-*` simulando conteúdo já presente. Como `CONJUNTO_TRACEABILITY` tem os mesmos três nomes que o teste tentava instalar pela origem `removed-project-integration`, a detecção de conflito de `installSkills` recusava a segunda chamada — um falso RED por incompatibilidade de fixture, não pela lacuna real. Corrigido com uma raiz limpa própria (`raizLimpa()`, sem pré-semeadura), isolando o teste do que `projetoComSkills()` foi desenhado para outro propósito.

**Achado registrado sem correção nesta fatia.** `T045` descobriu que `runSetup` sai antes de instalar skills/framework quando os hooks já estão configurados (`jaFeito`), de modo que apagar `.claude/skills/` manualmente e rodar `setup` de novo não o restaura enquanto os hooks continuarem intactos. `AC-039` exige só "não falha nem duplica", que o comportamento atende; ressincronizar drift é pergunta sobre a idempotência de `runSetup` inteira, não desta fatia isolada — registrado para decisão da pessoa responsável.

#### Gate do Ato I — Segunda reabertura, 2026-08-30

- **Motivo da reabertura**: achado de `T045`, tratado agora a pedido explícito da pessoa responsável, junto de um segundo achado (não-defeito) sobre `doctor`/`NPM_SUBSYSTEMS` fechado por investigação sem promoção a spec. Capturas em `specs/inbox/2026-08-30-122232-setup-nao-resincroniza-skills-nem-framework-quando-hooks-ja-batem.md` e `specs/inbox/2026-08-30-122248-doctor-nao-lista-skills-vercel-labs-entre-npm-subsystems.md`.
- **Escopo da mudança**: nova FR (`FR-030`) — "já configurado" nunca tinha sido definido em termos de skills/framework, só de hooks; nenhuma FR anterior cobria esse comportamento — mudança de comportamento, Ato I.
- **Reprodução real**: `setup` aprovado instala 57 skills; `rm -rf .claude/skills`; `setup` aprovado de novo relata "já estava configurado: 7 hooks inalterados" e mantém 0 skills em disco. Evidência em `research/reabertura-2026-08-30-drift/drift-nao-resincroniza.md`.

**Achados da rodada**

| ID | Achado | Severidade | Estado |
| --- | --- | --- | --- |
| DR7 | `matches()`/`jaFeito` em `src/setup/run.ts` decide "já configurado" olhando só hooks (nome + versão), e `runSetup` devolve cedo — antes até de consultar aprovação — sem nunca considerar se skills ou o framework former project tool ainda existem no disco | BLOCKER | Resolvido no plano — `FR-030` e a redefinição de `jaFeito` em três verificações independentes, seção 8 |
| DR8 | Nenhum `AC` desta fatia exercitava `runSetup` (ou o comando real) uma segunda vez com os hooks já configurados; `AC-029` testa `installSkills` chamado direto, contornando o curto-circuito onde o defeito mora | WARNING | Resolvido — nova categoria de teste "Drift" na seção 11, `AC-077`/`AC-078`/`AC-079` |
| DR9 | Achado irmão sobre `doctor`/`NPM_SUBSYSTEMS`: investigado e fechado sem ação — `NPM_SUBSYSTEMS` é, por `DEC-002` da SPEC-0002, o conjunto fechado dos três subsistemas orquestrados; `skills` é instalador, não subsistema, e já tem relato próprio via `reportSkills()`/`FR-024`. Adicioná-lo misturaria dois conceitos sem ganho | NOTE | Fechado sem promoção — `specs/inbox/2026-08-30-122248-doctor-nao-lista-skills-vercel-labs-entre-npm-subsystems.md` |

**Sobre o desenho da correção.** A alternativa mais simples — sempre chamar os instaladores reais, ignorando `jaFeito` para skills/framework — foi descartada por custo: pagaria três subprocessos reais em toda execução de `setup`, mesmo quando nada mudou, o caso comum. A verificação de presença em disco (sem subprocesso) captura o cenário real que motivou a reabertura — conteúdo apagado por fora — a um custo desprezível, e preserva o curto-circuito original quando ele continua correto.

#### Gate do Ato II — Plano da segunda reabertura, 2026-08-30

- **Resultado**: Passed
- **Comando**: `node .agents/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/completed/0005-fatia-1h-skills-lado-a-lado/spec.md --allow-draft`
- **Plano**: 6 tarefas novas (T047–T052) — 3 `[TEST] [TDD]`, 1 `[CODE]`, 1 `[DOC]`, 1 `[OPS]`; 52 tarefas no total, 43 IDs próprios cobertos.
- **RED**: `T047` e `T048` observaram RED real contra `dist/cli.js setup` — instalar, apagar `.claude/skills/` (ou `.project-context/`), reinstalar não restaurava nada, com o relato "já estava configurado" mascarando a ausência. `T049` (controle de curto-circuito) já passava antes do código de produção, por acidente: a segunda chamada nunca alcançava o bloco de skills/framework — registrado como guarda de regressão, não como RED genuíno.

#### Gate do Ato III — Entrega da segunda reabertura, 2026-08-30

- **Resultado**: Passed
- **Verificação**: `npm run test:tdd` em exit 0, com **311 casos em 99 arquivos** (era 306/97 antes desta reabertura); `npx tsc --noEmit` e `npm run build` em exit 0; `npm run verify` em exit 0 a partir de clone limpo (install 5s, build 1s, test 49s, total 55s).
- **Verificação manual real**: sequência completa num projeto descartável — 1ª execução instala 57 skills e `.project-context/`; apagar `.claude/skills/` e reexecutar restaura as 57; apagar `.project-context/` e reexecutar restaura o framework; uma quarta execução sem nada apagado, mesmo sem entrada padrão nenhuma (`< /dev/null`), continua relatando "já estava configurado" sem travar nem pedir aprovação.
- **Documentação**: `docs/` reconstruído por `$framework-documentator`, `--check` em exit 0, monitor de contexto em `CURRENT`; `.project-context/STACK.md` e `PROJECT.md` descrevem a reconciliação de drift.

#### Suposições

- A procedência vem do `skills-lock.json` que o instalador grava, com um hash por skill. Recalcular seria duplicar trabalho e criar uma segunda verdade sobre o mesmo conteúdo.
- O conjunto de Matt Pocock é instalado inteiro, sem seleção por nome. Reversível: o instalador oferece seleção.
- `.claude/skills/` permanece fora do controle de versão deste repositório, como já está. Reversível.
- O executor do instalador é injetável, para que a suíte não dependa de rede.

#### Decisões abertas

Nenhuma que bloqueie esta fatia.

### 14. Tarefas

Formato:
`- [ ] TNNN [P?] [TIPO] [US-NNN?] Ação com caminho — Refs: IDs — Depends: IDs|none`

Checklist obrigatório por tarefa, na ordem `PREP`, `EXECUTE`, `VERIFY`, `EVIDENCE`, `IMPROVE`.

#### Fase 1 — Dependência

- [x] T001 [OPS] Fixar `skills` em 1.5.23 no package.json e instalar sem executar scripts — Refs: FR-020 — Depends: none
  - [x] **PREP**: Confirmar 1.5.23 como versão corrente e que o pacote expõe binário próprio, de modo que a invocação use a cópia local em vez de buscar a ponta.
  - [x] **EXECUTE**: Acrescentar `skills` às dependências em versão exata, sem intervalo, e instalar com `--ignore-scripts`.
  - [x] **VERIFY**: `npm ls skills` resolve 1.5.23, os binários `skills` e `add-skill` existem em `node_modules/.bin/`, e o manifesto segue com zero dependências em faixa.
  - [x] **EVIDENCE**: Comandos e versão resolvida registrados na seção 12.
  - [x] **IMPROVE**: A instalação revelou que `skills` já chegava por via transitiva, como dependência de `removed-project-integration` em faixa `^1.5.22`. Declará-lo direto e exato o traz para dentro da regra de fixação, que a faixa transitiva não respeitava. Isso também confirmou que o comentário do `.gitignore` sobre o `skills-lock.json` estava certo desde o início, e que a alteração que eu havia feito nele era o erro; foi revertida.

#### Fase 2 — RED, um caso por cenário da seção 6

Dezesseis tarefas, uma por `AC`, cada uma em arquivo próprio de `tests/`. Nenhuma depende das outras, por isso executam em paralelo.

- [x] T002 [P] [TEST] [TDD] [US-020] Derivar de AC-020 o caso em tests/skills-install-alvo.test.ts — Refs: US-020, FR-020, FR-026, AC-020 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-020 e fixar o critério: os dois conjuntos existem em `.claude/skills/` após um setup, e nenhum diretório preexistente foi removido ou renomeado.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-install-alvo.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Contar diretórios antes e depois, e não apenas conferir que os novos chegaram: presença não prova ausência de remoção.

- [x] T003 [P] [TEST] [TDD] [US-020] Derivar de AC-021 o caso em tests/skills-install-copia.test.ts — Refs: US-020, FR-021, NFR-022, AC-021 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-021 e fixar o critério: nenhuma entrada instalada é link simbólico, em nível algum.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-install-copia.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Percorrer a árvore inteira, e não só o primeiro nível, porque link aninhado é igualmente conteúdo fora do projeto.

- [x] T004 [P] [TEST] [TDD] [US-020] Derivar de AC-022 o caso em tests/skills-confinamento.test.ts — Refs: US-020, FR-022, NFR-022, AC-022 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-022 e fixar o critério: o diretório do usuário tem a mesma árvore antes e depois.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-confinamento.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Fotografar a árvore do diretório pessoal e comparar; conferir apenas o projeto não distingue confinamento de coincidência.

- [x] T005 [P] [TEST] [TDD] [US-021] Derivar de AC-023 o caso em tests/skills-registro.test.ts — Refs: US-021, FR-023, AC-023 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-023 e fixar o critério: o registro nomeia cada conjunto, sua origem e a procedência por skill lida do lockfile.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-registro.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Ler a procedência do lockfile do instalador em vez de recalcular, para não criar uma segunda verdade sobre o mesmo conteúdo.

- [x] T006 [P] [TEST] [TDD] [US-021] Derivar de AC-024 o caso em tests/skills-doctor-presenca.test.ts — Refs: US-021, FR-024, AC-024 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-024 e fixar o critério: o doctor enumera os conjuntos com suas origens e sai com zero quando nada divergiu.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-doctor-presenca.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Derivar a expectativa do registro, e não de uma lista literal que envelhece a cada conjunto novo.

- [x] T007 [P] [TEST] [TDD] [US-021] Derivar de AC-025 o caso em tests/skills-doctor-deriva.test.ts — Refs: US-021, FR-024, NFR-020, AC-025 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-025 e fixar o critério: conteúdo alterado após a instalação é nomeado, o código de saída é diferente de zero e nada no disco muda.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-doctor-deriva.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Comparar a árvore antes e depois da execução do doctor, porque a proibição de mutar é o ponto do caso.

- [x] T008 [P] [TEST] [TDD] [US-022] Derivar de AC-026 o caso em tests/skills-source-terceiro.test.ts — Refs: US-022, FR-020, FR-025, AC-026 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-026 e fixar o critério: o pacote npm de terceiro é recusado, a origem oficial é nomeada e nada é instalado.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-source-terceiro.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Exercitar a recusa sem rede, com a decisão isolada do sistema de arquivos.

- [x] T009 [P] [TEST] [TDD] [US-022] Derivar de AC-027 o caso em tests/skills-conflito.test.ts — Refs: US-022, FR-026, NFR-020, AC-027 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-027 e fixar o critério: conflito de nome recusa, nomeia o conflito e preserva o diretório existente.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-conflito.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Conferir o conteúdo do diretório preexistente, e não só sua presença.

- [x] T010 [P] [TEST] [TDD] [US-022] Derivar de AC-028 o caso em tests/skills-install-falha.test.ts — Refs: US-022, FR-020, NFR-021, AC-028 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-028 e fixar o critério: instalador indisponível produz relato de que o conjunto não foi instalado, sem afirmar sucesso, e o restante do setup segue.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-install-falha.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Injetar o executor em vez de depender do ambiente, para que o caso não passe por acidente numa máquina sem a ferramenta.

- [x] T011 [P] [TEST] [TDD] [US-020] Derivar de AC-029 o caso em tests/skills-idempotente.test.ts — Refs: US-020, FR-023, FR-026, NFR-020, AC-029 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-029 e fixar o critério: a segunda execução mantém uma entrada por conjunto e não remove conteúdo.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-idempotente.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Passar o registro anterior de fato: na fatia 1b a idempotência existia no código e não funcionava pela linha de comando por falta disso.

- [x] T012 [P] [TEST] [TDD] [US-021] Derivar de AC-030 o caso em tests/skills-doctor-garantia.test.ts — Refs: US-021, FR-024, NFR-021, AC-030 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-030 e fixar o critério: o relato informa que a referência não é fixada pela origem e não promete conteúdo idêntico entre máquinas.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-doctor-garantia.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Afirmar sobre o texto do relato o que a spec exige dele, para que a limitação não desapareça numa reescrita futura.

- [x] T013 [P] [TEST] [TDD] [US-022] Derivar de AC-031 o caso em tests/skills-install-parcial.test.ts — Refs: US-022, FR-020, NFR-021, AC-031 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-031 e fixar o critério: execução interrompida no meio não gera entrada no registro e é relatada como não instalada.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-install-parcial.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Provocar o término com erro pelo executor injetado, exercitando o caminho real de falha.

- [x] T014 [P] [TEST] [TDD] [US-020] Derivar de AC-032 o caso em tests/skills-nao-destrutivo.test.ts — Refs: US-020, FR-021, FR-022, FR-026, NFR-020, NFR-022, AC-032 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-032 e fixar o critério: recusa por conflito e reexecução preservam o conteúdo inteiro, e nada fora da raiz é tocado.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-nao-destrutivo.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Cobrir os três caminhos no mesmo caso, porque a garantia é sobre o conjunto deles e não sobre cada um isolado.

- [x] T015 [P] [TEST] [TDD] [US-020] Derivar de AC-033 o caso em tests/skills-inventory-symlink.test.ts — Refs: US-020, FR-021, FR-022, NFR-022, AC-033 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-033 e fixar o critério: um diretório de skills que é link para fora do projeto é reportado como inválido, com a razão citando o confinamento.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-inventory-symlink.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Criar o link no caso, em diretório temporário, para exercitar a detecção e não a suposição.

- [x] T016 [P] [TEST] [TDD] [US-021] Derivar de AC-034 o caso em tests/skills-source-oficial.test.ts — Refs: US-021, FR-023, FR-025, AC-034 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-034 e fixar o critério: a origem gravada no registro é a oficial e nenhuma outra aparece.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-source-oficial.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Conferir o conjunto inteiro de origens registradas, e não apenas a presença da oficial.

- [x] T017 [P] [TEST] [TDD] [US-022] Derivar de AC-035 o caso em tests/skills-source-arbitraria.test.ts — Refs: US-022, FR-025, NFR-021, AC-035 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-035 e fixar o critério: origem que não a oficial é recusada com a explicação, e nada é baixado nem instalado.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-source-arbitraria.test.ts`, com marcador `TRACEABILITY` por asserção, raízes em diretório temporário e o executor do instalador injetado, para que nenhum caso toque o projeto real nem dependa de rede.
  - [x] **VERIFY**: RED observado — `npm run test:tdd` reprova o arquivo inteiro por `Cannot find module` sobre `src/skills/`, e não por erro de escrita do caso.
  - [x] **EVIDENCE**: `npm run test:tdd` com 16 arquivos em RED e os 133 casos anteriores verdes; 50 casos marcados com `TRACEABILITY` sobre os dezesseis `AC`. Registrado na seção 12.
  - [x] **IMPROVE**: Cobrir mais de uma forma de origem inválida, para que a regra não fique presa a um literal.

#### Fase 3 — Código, cada tarefa atrás do seu RED

- [x] T018 [CODE] [US-022] Implementar em src/skills/source.ts — Refs: US-022, FR-025, AC-026, AC-034, AC-035 — Depends: T008, T016, T017
  - [x] **PREP**: RED confirmado em T008, T016 e T017; `docs/` reconstruído por `$framework-documentator` antes da alteração.
  - [x] **EXECUTE**: `src/skills/source.ts` nomeia `OFFICIAL_SOURCE` numa constante e devolve resultado discriminado para qualquer outra origem, sem lançar. Não importa `node:fs`, de modo que a regra é exercitável sem instalar nada.
  - [x] **VERIFY**: Os casos de `skills-source-terceiro` e `skills-source-arbitraria` passam a GREEN. `npx tsc --noEmit` em exit 0. `grep` por `process.cwd` e `process.env` no arquivo devolve zero.
  - [x] **EVIDENCE**: Comandos, contagem e o resultado do `grep` registrados na seção 12.
  - [x] **IMPROVE**: A mensagem de recusa nomeia a origem aceita e diz que a recebida não é reconhecida na mesma frase, atendendo às duas asserções sem duplicar texto.

  <!-- framework:evidence {"task": "T018", "refs": ["US-022", "FR-025", "AC-026", "AC-034", "AC-035"], "files": ["src/skills/source.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T019 [CODE] [US-020] Implementar em src/skills/inventory.ts — Refs: US-020, FR-021, FR-022, NFR-020, NFR-022, AC-021, AC-032, AC-033 — Depends: T003, T014, T015
  - [x] **PREP**: RED confirmado em T003, T014 e T015; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/skills/inventory.ts` enumera os conjuntos sob `.claude/skills/` e detecta link simbólico em qualquer nível, devolvendo o resultado inválido com a razão. Recebe a raiz por parâmetro.
  - [x] **VERIFY**: `skills-inventory-symlink` e `skills-install-copia` passam a GREEN. `grep` por `process.cwd` e `process.env` devolve zero.
  - [x] **EVIDENCE**: Comandos, contagem e o resultado do `grep` registrados na seção 12.
  - [x] **IMPROVE**: A varredura desce a árvore inteira em vez de parar no primeiro nível, porque link aninhado tira conteúdo do projeto do mesmo modo.

  <!-- framework:evidence {"task": "T019", "refs": ["US-020", "FR-021", "FR-022", "NFR-020", "NFR-022", "AC-021", "AC-032", "AC-033"], "files": ["src/skills/inventory.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T020 [CODE] [US-020] Implementar em src/skills/install.ts — Refs: US-020, US-022, FR-020, FR-026, NFR-021, AC-020, AC-027, AC-028, AC-031 — Depends: T002, T009, T010, T013, T018, T019
  - [x] **PREP**: RED confirmado em T002, T009, T010 e T013, com T018 e T019 em GREEN; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/skills/install.ts` resolve a origem, enumera com `--list`, recusa conflito antes de escrever e só então instala com alvo restrito, cópia e sem interação. Nenhuma forma global é construída no arquivo.
  - [x] **VERIFY**: Os casos de `skills-install-alvo`, `skills-conflito`, `skills-install-falha` e `skills-install-parcial` passam a GREEN.
  - [x] **EVIDENCE**: Comandos, contagens e as saídas dos caminhos de falha registrados na seção 12.
  - [x] **IMPROVE**: O caso de conflito exigiu enumerar antes de escrever: descobrir o conflito depois seria descobri-lo já tendo sobrescrito. O `--list` da CLI real cobre isso, e o executor do teste passou a modelá-lo.

  <!-- framework:evidence {"task": "T020", "refs": ["US-020", "US-022", "FR-020", "FR-022", "FR-026", "NFR-021", "NFR-022", "AC-020", "AC-022", "AC-027", "AC-028", "AC-031"], "files": ["src/skills/install.ts", "tests/skills-fixtures.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T021 [CODE] [US-021] Implementar em src/skills/record.ts — Refs: US-021, FR-023, FR-024, NFR-020, AC-023, AC-029, AC-030, AC-032, AC-034 — Depends: T005, T011, T012, T014, T016, T019
  - [x] **PREP**: RED confirmado em T005, T011, T012, T014 e T016, com T019 em GREEN; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `src/skills/record.ts` lê o lockfile do instalador, converte em entradas do registro, compara o registrado com o presente e devolve o relato com a declaração de garantia. Nenhuma escrita.
  - [x] **VERIFY**: `skills-registro`, `skills-doctor-presenca`, `skills-doctor-deriva`, `skills-doctor-garantia`, `skills-idempotente` e `skills-source-oficial` passam a GREEN, com a suíte inteira em 181 de 181 casos e 53 de 53 arquivos.
  - [x] **EVIDENCE**: Comandos, contagens e a comparação da árvore antes e depois registrados na seção 12.
  - [x] **IMPROVE**: A procedência é lida do lockfile e nunca recalculada, conforme `DEC-028`. O hash por skill já vem computado pelo instalador, e duplicá-lo criaria duas verdades sobre o mesmo conteúdo.

  <!-- framework:evidence {"task": "T021", "refs": ["US-021", "FR-023", "FR-024", "NFR-020", "AC-023", "AC-029", "AC-030", "AC-032", "AC-034"], "files": ["src/skills/record.ts", "tests/skills-confinamento.test.ts", "tests/skills-nao-destrutivo.test.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T022 [CODE] [US-020] Implementar em src/setup/run.ts — Refs: US-020, FR-020, FR-026, AC-020, AC-029 — Depends: T020, T021
  - [x] **PREP**: T020 e T021 em GREEN; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `SetupOptions` ganhou `skills`, opcional, no mesmo padrão de `bridgeEnv`: ausente, a instalação é pulada. `runSetup` calcula a raiz uma vez, repassa o registro anterior lido do lockfile e junta o relato dos conjuntos ao dos hooks.
  - [x] **VERIFY**: A suíte inteira segue em 181 de 181 casos e 53 de 53 arquivos, incluindo os 133 anteriores. `npx tsc --noEmit` e `npm run build` em exit 0.
  - [x] **EVIDENCE**: Comandos, contagem e a forma do relato registrados na seção 12.
  - [x] **IMPROVE**: Descobri que `installSkills` estava declarada assíncrona sem necessidade: nada nela aguarda, e o executor real será síncrono. Mantê-la assim obrigaria `runSetup` a virar assíncrona e quebraria os 133 casos existentes. Passou a síncrona, e os casos que a aguardavam seguem válidos porque `await` sobre valor comum resolve para ele.

  <!-- framework:evidence {"task": "T022", "refs": ["US-020", "FR-020", "FR-026", "AC-020", "AC-029"], "files": ["src/setup/run.ts", "src/skills/install.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T023 [CODE] [US-021] Implementar em src/doctor.ts — Refs: US-021, FR-024, AC-024, AC-025, AC-030 — Depends: T006, T007, T012, T021
  - [x] **PREP**: RED confirmado em T006, T007 e T012, com T021 em GREEN; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `inspectDependencies` passou a aceitar uma raiz opcional e, quando informada, acrescenta ao relatório os conjuntos, a declaração de garantia e a divergência, combinando o código de saída. Sem raiz, o comportamento anterior é preservado inteiro. `cli.ts` passa a raiz do processo, que é legítima ali: quem executa o comando está no projeto.
  - [x] **VERIFY**: Os casos do `doctor` passam a GREEN e a suíte segue em 181 de 181. `grep` por escrita em `src/doctor.ts` não devolve ocorrência.
  - [x] **EVIDENCE**: Comandos, contagem e o resultado do `grep` registrados na seção 12.
  - [x] **IMPROVE**: A raiz é parâmetro opcional em vez de obrigatório, para que as chamadas existentes continuem válidas sem edição e o `doctor` siga utilizável sem projeto.

  <!-- framework:evidence {"task": "T023", "refs": ["US-021", "FR-024", "AC-024", "AC-025", "AC-030"], "files": ["src/doctor.ts", "src/cli.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T028 [TEST] [TDD] [US-021] Derivar de AC-023 o caso de persistência em tests/skills-registro-persistido.test.ts — Refs: US-021, FR-023, AC-023 — Depends: T021
  - [x] **PREP**: Reler o Gherkin de AC-023 e a seção 9: `o registro de instalação` é `.common-rules/install.json`, e não o lockfile do instalador. O caso de T005 afirma sobre o valor devolvido pela leitura, e não sobre o disco.
  - [x] **EXECUTE**: Escrever o caso em `tests/skills-registro-persistido.test.ts`, conferindo que o arquivo do projeto ganha a lista `skills` com nome, origem, procedência e momento, e que a lista `hooks` permanece.
  - [x] **VERIFY**: RED observado — dois dos três casos reprovam porque a lista `skills` não existe no arquivo gravado; o terceiro passa porque os sete hooks já são persistidos.
  - [x] **EVIDENCE**: `npx vitest run tests/skills-registro-persistido.test.ts` com 2 reprovando e 1 aprovando. Registrado na seção 12.
  - [x] **IMPROVE**: A lacuna existia porque o caso original conferia o retorno da função em vez do arquivo escrito. É o mesmo defeito que a fatia 1b descobriu tarde, e a correção segue a mesma direção: afirmar sobre o disco.

- [x] T029 [CODE] [US-021] Persistir a lista skills em src/setup/record.ts e src/setup/run.ts — Refs: US-021, FR-023, AC-023, AC-029 — Depends: T028
  - [x] **PREP**: T028 em RED; `docs/` reconstruído antes da alteração.
  - [x] **EXECUTE**: `InstallRecord` ganhou a lista opcional `skills`, e `runSetup` foi reordenado: a instalação passou a preceder a montagem do registro, porque é o lockfile que ela produz que fornece a procedência gravada. Montar o registro antes deixaria a lista vazia.
  - [x] **VERIFY**: A suíte fecha em 184 de 184 casos e 54 de 54 arquivos. `npx tsc --noEmit` e `npm run build` em exit 0.
  - [x] **EVIDENCE**: Comandos, contagens e o conteúdo gravado registrados na seção 12.
  - [x] **IMPROVE**: A lacuna existia porque o caso de `AC-023` afirmava sobre o valor devolvido pela leitura do lockfile, e a spec distingue esse arquivo do registro do projeto. Ler o Gherkin com a seção 9 ao lado teria evitado; passei a conferir o vocabulário da seção 9 antes de escrever casos que citam "o registro".

  <!-- framework:evidence {"task": "T029", "refs": ["US-021", "FR-023", "AC-023", "AC-029"], "files": ["src/setup/record.ts", "src/setup/run.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

#### Fase 4 — Fechamento

- [x] T024 [DOC] Registrar instalador, módulos e ampliação do registro em .project-context/STACK.md — Refs: FR-020 — Depends: T022, T023
  - [x] **PREP**: Mudanças de estrutura conferidas: quatro arquivos em `src/skills/`, a dependência nova e a lista acrescentada ao registro.
  - [x] **EXECUTE**: `.project-context/STACK.md` ganhou a seção `Conjuntos de skills`, com a responsabilidade de cada módulo. A dependência já havia entrado antes, quando o monitor a cobrou.
  - [x] **VERIFY**: `build_documentation --check` em exit 0 e o monitor de contexto em `CURRENT`.
  - [x] **EVIDENCE**: Comandos e exit codes registrados na seção 12.
  - [x] **IMPROVE**: A seção registra por que a instalação usa cópia e não link, e que a entrega dá rastreabilidade e não reprodutibilidade, para que nenhuma das duas precise ser redescoberta.

- [x] T025 [DOC] Descrever em PROJECT.md que o setup instala os dois conjuntos — Refs: US-020 — Depends: T022, T023
  - [x] **PREP**: Localizadas as linhas do `setup` e do `doctor` na tabela de comandos.
  - [x] **EXECUTE**: `PROJECT.md` descreve os dois ecossistemas lado a lado, a cópia real, a procedência no registro e o relato de deriva sem reparo. As duas linhas da tabela de comandos foram atualizadas.
  - [x] **VERIFY**: `build_documentation --check` em exit 0, e a afirmação conferida contra a superfície real.
  - [x] **EVIDENCE**: Comando, exit code e o trecho alterado registrados na seção 12.
  - [x] **IMPROVE**: Conferi de passagem as contagens escritas à mão no arquivo, defeito que já apareceu duas vezes; a linha de módulos e testes foi corrigida na auditoria anterior e segue correta.

- [x] T026 [DOC] Registrar em .gitignore a decisão sobre versionar skills-lock.json — Refs: FR-023 — Depends: T021
  - [x] **PREP**: Retomado o achado D4 do Definition Gate, agora com a persistência já implementada em T029.
  - [x] **EXECUTE**: O `.gitignore` registra a decisão de manter o `skills-lock.json` ignorado, com a razão: é artefato de ferramenta, regenerável, escrito também por uma dependência, e a procedência que este produto controla passou a viver em `.common-rules/install.json`.
  - [x] **VERIFY**: `git status --porcelain` não mostra o arquivo, e o comentário descreve a decisão e sua reversibilidade.
  - [x] **EVIDENCE**: Trecho alterado e saída de `git status` registrados na seção 12.
  - [x] **IMPROVE**: A decisão só ficou clara depois de T029: sem a persistência no registro do projeto, manter o lockfile ignorado teria perdido a procedência. A ordem das tarefas escondeu isso, e a dependência de T026 em T021 deveria ter sido em T029.

- [x] T027 [OPS] Fechar o Delivery Gate na seção 13 de specs/completed/0005-fatia-1h-skills-lado-a-lado/spec.md — Refs: NFR-020, NFR-021, NFR-022 — Depends: T024, T025, T026, T029
  - [x] **PREP**: Vinte e oito tarefas concluídas, e cada `[CODE]` com seu comentário de evidência.
  - [x] **EXECUTE**: Suíte completa, `npm run verify`, e os auditores de aceite, evidência, rastreabilidade e research.
  - [x] **VERIFY**: 184 casos em 54 arquivos; `tsc` e `build` em exit 0; `verify` em exit 0 a partir de clone limpo, em 5s; diretório pessoal com 42 entradas antes e depois.
  - [x] **EVIDENCE**: Comandos, contagens, exit codes e a contagem do diretório pessoal registrados na seção 13.
  - [x] **IMPROVE**: Sete linhas da matriz seguiam marcadas como RED depois de os casos ficarem verdes, e só o `verify_acceptance` percebeu, acusando `AC-022` e `AC-032` sem resultado. Marcar a matriz junto de cada tarefa, e não no fechamento, evitaria — mas a tarefa que fecha os casos de confinamento não é a que os declara, e essa distância é a causa.

#### Fase 5 — Reabertura 2026-08-30: RED para a segunda origem e o framework former project tool

- [x] T030 [P] [TEST] [TDD] [US-020] Derivar de AC-020/AC-037 o caso de convivência entre origens em tests/skills-segunda-origem.test.ts — Refs: US-020, FR-027, AC-020, AC-037 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-020 (convivência) e AC-037 (independência entre origens); confirmar que hoje `installSkills` só é chamado com uma origem por execução.
  - [x] **EXECUTE**: Escrever em `tests/skills-segunda-origem.test.ts` dois casos: (1) `installSkills` chamado para `mattpocock/skills` e depois para `removed-project-integration`, com executor fake, resulta nos dois conjuntos presentes em `.claude/skills/` sem um remover o outro; (2) o executor fake falha só para uma das duas chamadas, e o resultado de cada uma é relatado de forma independente, sem a falha de uma contaminar o relato da outra.
  - [x] **VERIFY**: RED — o segundo caso não tem código de produção que orquestre duas chamadas ainda; o primeiro já passaria com o `installSkills` atual chamado duas vezes manualmente, o que prova que a lacuna está no chamador (`runSetup`), não em `installSkills`.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T031 [P] [TEST] [TDD] Derivar de AC-036 o caso do executor real do `skills` em tests/skills-executor-real.test.ts — Refs: FR-020, FR-027, AC-036 — Depends: none
  - [x] **PREP**: Confirmar que `node_modules/skills/bin/cli.mjs` existe no checkout e que nenhum módulo de produção o invoca hoje.
  - [x] **EXECUTE**: Escrever caso que constrói o `Executor` real (ainda inexistente, importado de `src/skills/executor.ts`) e chama `--list` de verdade para `mattpocock/skills` e para `removed-project-integration`, sobre diretório descartável criado pelo teste; espera pelo menos uma skill reconhecida em cada, sem instalar nada em disco (modo `--list`).
  - [x] **VERIFY**: RED — `Cannot find module` sobre `src/skills/executor`.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T032 [P] [TEST] [TDD] [US-023] Derivar de AC-038 o caso de `installformer project tool` em tests/framework-install-alvo.test.ts — Refs: US-023, FR-028, AC-038 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-038; desenhar a assinatura de `installformer project tool` espelhando `installSkills` — `{ root, execute }` com `Executor` injetável devolvendo `{ status, changed?, paths? } | null`.
  - [x] **EXECUTE**: Escrever caso em `tests/framework-install-alvo.test.ts` chamando `installformer project tool` (ainda inexistente) com executor fake devolvendo `{ status: 0, changed: 34, paths: [...] }`, conferindo resultado estruturado e não isError.
  - [x] **VERIFY**: RED — `Cannot find module` sobre `src/framework/install`.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T033 [P] [TEST] [TDD] [US-023] Derivar de AC-039/AC-041 o caso de reexecução em tests/framework-install-idempotente.test.ts — Refs: US-023, FR-028, FR-029, NFR-020, AC-039, AC-041 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-039 (reexecução não falha nem duplica) e AC-041 (nada mudou é relatado fielmente).
  - [x] **EXECUTE**: Escrever dois casos: executor fake devolvendo `{status:0, changed:0, paths:[]}` produz relato de "já atualizado" sem erro; chamado duas vezes seguidas com o mesmo executor fake, o resultado da segunda chamada é idêntico em forma ao da primeira, sem acumular estado espúrio.
  - [x] **VERIFY**: RED — mesmo módulo ausente de `T032`.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T034 [P] [TEST] [TDD] [US-023] Derivar de AC-040 o caso de falha em tests/framework-install-falha.test.ts — Refs: US-023, FR-028, NFR-021, AC-040 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-040; espelhar o desenho de `tests/skills-install-falha.test.ts` para o novo módulo.
  - [x] **EXECUTE**: Escrever casos para executor devolvendo `null` (binário ausente) e para `{status: 1}` (erro), conferindo que `installformer project tool` devolve `isError: true` e nunca afirma sucesso.
  - [x] **VERIFY**: RED — mesmo módulo ausente de `T032`.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T035 [P] [TEST] [TDD] Derivar de AC-038 o caso do executor real do `former tool install` em tests/framework-install-real.test.ts — Refs: FR-028, FR-029, AC-038 — Depends: none
  - [x] **PREP**: Confirmar que `node_modules/removed-project-integration/bin/framework.cjs` existe no checkout.
  - [x] **EXECUTE**: Escrever caso que constrói o `Executor` real (ainda inexistente, `src/framework/executor.ts`) e chama `former tool install --project <raiz> --json` de verdade sobre diretório descartável criado pelo teste (com `git init` prévio), conferindo `.project-context/`, `.agents/skills/`, `CLAUDE.md` e `AGENTS.md` em disco.
  - [x] **VERIFY**: RED — `Cannot find module` sobre `src/framework/executor`.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T036 [TEST] [TDD] Derivar de AC-036/AC-038 o caso de ponta a ponta real em tests/cli-setup-real.test.ts — Refs: FR-020, FR-027, FR-028, FR-029, AC-036, AC-038 — Depends: none
  - [x] **PREP**: Ler `tests/hooks-context-mode-comando.test.ts` como referência de subprocesso real com timeout explícito; desenhar o caso contra `dist/cli.js` já buildado, sem `Executor` nenhum injetado.
  - [x] **EXECUTE**: Escrever caso que roda `node dist/cli.js setup` de verdade, via `spawnSync`, sobre diretório descartável com evidência de uso do alvo Claude Code, e confere em disco: `.claude/skills/` com skills de `mattpocock/skills` e de `removed-project-integration`; `.project-context/`, `.agents/skills/`, `CLAUDE.md`, `AGENTS.md`. Timeout maior que o padrão de 5000ms, pelo mesmo motivo de `tests/hooks-context-mode-comando.test.ts`.
  - [x] **VERIFY**: RED — hoje o comando roda e sai 0, mas nenhum dos artefatos existe: a asserção de presença falha, provando a lacuna de produção com o mesmo comando que a pessoa responsável rodou manualmente.
  - [x] **EVIDENCE**: Saída do comando real e lista do que faltou, registradas na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

#### Fase 6 — Código da reabertura, cada tarefa atrás do seu RED

- [x] T037 [CODE] [US-020] Segunda origem oficial em src/skills/source.ts — Refs: US-020, FR-025, FR-027, AC-020, AC-036 — Depends: T030, T031, T036
  - [x] **PREP**: Confirmar RED de T030 e T031; `docs/` reconstruído por `$framework-documentator` antes da alteração.
  - [x] **EXECUTE**: `OFFICIAL_SOURCE` vira `OFFICIAL_SOURCES` (as duas origens), e `resolveSource` aceita qualquer uma delas; mensagem de recusa nomeia as duas origens aceitas.
  - [x] **VERIFY**: Casos de `T030`/`T031` relacionados à aceitação da origem e os quinze anteriores (`T008`, `T016`, `T017` incluídos) seguem GREEN.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T037", "refs": ["US-020", "FR-025", "FR-027", "AC-020", "AC-036"], "files": ["src/skills/source.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T038 [CODE] Executor real do `skills` em src/skills/executor.ts — Refs: FR-020, FR-027, AC-036 — Depends: T030, T031, T036
  - [x] **PREP**: Confirmar RED de T031.
  - [x] **EXECUTE**: `spawnSync` contra `node_modules/skills/bin/cli.mjs`, resolvido a partir do próprio pacote (`import.meta.url`, não do `cwd` do projeto alvo), como `defaultEnvironment()` já faz em `src/doctor.ts`. Sem `--list`, devolve `{ status }`. Com `--list`, remove códigos ANSI da saída e reconhece nome de skill por linha (`│` seguido de exatamente quatro espaços e um token sem espaço); executa com código zero e nenhum nome reconhecido conta como falha (`{ status: 1 }`), nunca como zero skills instaladas com sucesso.
  - [x] **VERIFY**: Caso de `T031` GREEN, contra o binário real.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T038", "refs": ["FR-020", "FR-027", "AC-036"], "files": ["src/skills/executor.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T039 [CODE] [US-023] Módulo src/framework/install.ts — Refs: US-023, FR-028, FR-029, AC-038, AC-039, AC-040, AC-041 — Depends: T032, T033, T034
  - [x] **PREP**: Confirmar RED de T032, T033 e T034.
  - [x] **EXECUTE**: `installformer project tool({ root, execute })` chama `execute(root)`, devolve resultado estruturado (`changed`, `paths`, `isError`) sem persistir registro próprio (`DEC-030`); executor nulo ou status diferente de zero vira `isError: true` com relato que nomeia o framework, nunca sucesso.
  - [x] **VERIFY**: Casos de `T032`, `T033` e `T034` GREEN.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T039", "refs": ["US-023", "FR-028", "FR-029", "AC-038", "AC-039", "AC-040", "AC-041"], "files": ["src/framework/install.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T040 [CODE] Executor real do `former tool install` em src/framework/executor.ts — Refs: FR-028, FR-029, AC-038 — Depends: T032, T035, T036
  - [x] **PREP**: Confirmar RED de T035.
  - [x] **EXECUTE**: `spawnSync` contra `node_modules/removed-project-integration/bin/framework.cjs`, resolvido do próprio pacote; monta `["install", "--project", raiz, "--json"]`, faz `JSON.parse` da saída e devolve `{ status, changed, paths }`; saída não parseável como JSON ou status diferente de zero vira falha, nunca sucesso silencioso.
  - [x] **VERIFY**: Caso de `T035` GREEN, contra o binário real.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T040", "refs": ["FR-028", "FR-029", "AC-038"], "files": ["src/framework/executor.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T041 [CODE] [US-020] [US-023] Wiring em src/setup/run.ts — Refs: US-020, US-023, FR-020, FR-027, FR-028, FR-029, AC-020, AC-037, AC-039, AC-041 — Depends: T030, T033, T036, T037, T039
  - [x] **PREP**: Confirmar RED de `T030` (segunda origem) e a ordem decidida na seção 8 ("Ordem entre as duas chamadas ao `skills`").
  - [x] **EXECUTE**: `SetupOptions` ganha `skills` capaz de instalar as duas origens (itera `OFFICIAL_SOURCES`, relendo `readLock(raiz)` entre uma chamada e outra) e `framework?: { execute: former project toolExecutor }`, chamado depois das skills. O registro final é montado a partir do lockfile já acumulado com as duas origens; o resultado do `former tool install` entra no relato textual, sem campo novo no `InstallRecord` (`DEC-030`).
  - [x] **VERIFY**: Casos de `T030` (convivência e independência) GREEN; os 184 casos anteriores seguem verdes.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T041", "refs": ["US-020", "US-023", "FR-020", "FR-027", "FR-028", "FR-029", "AC-020", "AC-037", "AC-039", "AC-041"], "files": ["src/setup/run.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T042 [CODE] Wiring real em src/cli.ts — Refs: FR-020, FR-027, FR-028, AC-036, AC-038 — Depends: T031, T035, T036, T038, T040, T041
  - [x] **PREP**: Confirmar RED de `T036` — o teste de ponta a ponta real, hoje falhando porque `formatSetup()` nunca fornece `skills` nem `framework` a `runSetup`.
  - [x] **EXECUTE**: `formatSetup()` passa `skills: { execute: realSkillsExecutor() }` (as duas origens) e `framework: { execute: realformer project toolExecutor() }` a `runSetup`, com os dois executores reais de `T038`/`T040` construídos uma vez, fora da função, do mesmo jeito que `defaultEnvironment()` já faz em `formatReport()`.
  - [x] **VERIFY**: Caso de `T036` GREEN, com `dist/cli.js setup` real produzindo os quatro artefatos em disco.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T042", "refs": ["FR-020", "FR-027", "FR-028", "AC-036", "AC-038"], "files": ["src/cli.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

#### Fase 7 — Fechamento da reabertura

- [x] T043 [DOC] Registrar os dois executores reais e o módulo src/framework em .project-context/STACK.md — Refs: FR-027, FR-028 — Depends: T041, T042
  - [x] **PREP**: Ler `.project-context/STACK.md` atual e o que `T024` já registrou para a primeira origem.
  - [x] **EXECUTE**: Acrescentar `src/skills/executor.ts`, `src/framework/install.ts`, `src/framework/executor.ts` e a segunda origem oficial.
  - [x] **VERIFY**: `node .claude/skills/framework-aux-stack/scripts/update_stack.mjs --project .` em exit 0.
  - [x] **EVIDENCE**: Comando e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T044 [DOC] Descrever em PROJECT.md a segunda origem e a instalação real do framework — Refs: US-023 — Depends: T041, T042
  - [x] **PREP**: Ler `PROJECT.md` atual e o que `T025` já registrou.
  - [x] **EXECUTE**: Descrever que o `setup` instala as duas origens do `skills` e executa `former tool install` de verdade, deixando `CLAUDE.md`/`AGENTS.md` presentes.
  - [x] **VERIFY**: `npm run build` em exit 0.
  - [x] **EVIDENCE**: Comando e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T045 [OPS] Verificação manual real em projeto descartável, registrada em specs/completed/0005-fatia-1h-skills-lado-a-lado/spec.md — Refs: FR-020, FR-027, FR-028, FR-029, NFR-020, NFR-021, NFR-022 — Depends: T042
  - [x] **PREP**: `npm run build` limpo.
  - [x] **EXECUTE**: `node dist/cli.js setup` executado de verdade num projeto descartável fora deste repositório (`git init` prévio, `.claude/` vazio como evidência de alvo), sem nenhum `Executor` injetado.
  - [x] **VERIFY**: Saída: `7 hooks instalados...; 37 skills copiadas a partir de mattpocock/skills; 20 skills copiadas a partir de removed-project-integration; framework atualizado: 34 arquivo(s); execução <trace>`. Inspeção direta: `.claude/skills/` com 57 entradas (37 mattpocock + 20 framework), nenhuma link simbólico; `.project-context/`, `.agents/skills/`, `CLAUDE.md`, `AGENTS.md` presentes. Reexecução imediata: `já estava configurado: 7 hooks inalterados`, sem erro.
  - [x] **EVIDENCE**: Saída dos dois comandos e listagem dos diretórios/arquivos criados, registradas acima e na seção 12.
  - [x] **IMPROVE**: A reexecução revelou que `runSetup` sai cedo quando os hooks já estão instalados (`jaFeito`), antes de chegar ao trecho que chama `installSkills`/`installformer project tool` — ou seja, um segundo `setup` não tenta ressincronizar skills nem framework quando alguém apaga `.claude/skills/` manualmente mas os hooks permanecem. `AC-039` exige só "não falha nem duplica", que esse comportamento satisfaz; ressincronizar drift é uma pergunta mais ampla sobre a idempotência de `runSetup` na sua totalidade — afeta hooks, skills, framework e trace igualmente —, não desta fatia isolada. Registrado como achado para decisão da pessoa responsável, sem alterar comportamento aqui.

- [x] T046 [OPS] Fechar o Delivery Gate da reabertura na seção 13 de specs/completed/0005-fatia-1h-skills-lado-a-lado/spec.md — Refs: NFR-020, NFR-021, NFR-022 — Depends: T043, T044, T045
  - [x] **PREP**: T030–T045 concluídas, cada `[CODE]` com seu comentário de evidência.
  - [x] **EXECUTE**: Suíte completa, `npm run verify`, `check_traceability.mjs`, `verify_acceptance.mjs` e `verify_repo.mjs`.
  - [x] **VERIFY**: 96 arquivos / 304 casos em exit 0; `tsc --noEmit` e `npm run build` em exit 0; `npm run verify` em exit 0 a partir de clone limpo (install 5s, build 1s, test 16s, total 22s); `check_traceability` em 39/39 IDs próprios cobertos; `verify_acceptance` em `QA: PASSED`.
  - [x] **EVIDENCE**: Comandos, contagens e exit codes registrados na seção 13.
  - [x] **IMPROVE**: Nenhuma melhoria adicional necessária além do achado já registrado em `T045`.

#### Fase 8 — Segunda reabertura 2026-08-30: setup resincroniza drift

- [x] T047 [TEST] [TDD] [US-020] Derivar de AC-077 o caso de drift real de skills em tests/cli-setup-drift-real.test.ts — Refs: US-020, FR-030, AC-077 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-077; confirmar que hoje `runSetup` decide "já configurado" olhando só hooks.
  - [x] **EXECUTE**: Escrever caso contra `dist/cli.js setup` real: 1ª execução aprovada instala tudo; `rm -rf .claude/skills`; 2ª execução aprovada confere que `.claude/skills/` volta a ter entradas de mattpocock e de framework.
  - [x] **VERIFY**: RED — hoje a 2ª execução relata "já estava configurado" e não restaura nada; `.claude/skills/` permanece vazio.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T048 [TEST] [TDD] [US-023] Derivar de AC-078 o caso de drift real do framework em tests/cli-setup-drift-real.test.ts — Refs: US-023, FR-030, AC-078 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-078.
  - [x] **EXECUTE**: Escrever caso no mesmo arquivo de `T047`: 1ª execução aprovada instala tudo; `rm -rf .project-context`; 2ª execução aprovada confere que `.project-context/` volta a existir.
  - [x] **VERIFY**: RED — mesma causa de `T047`.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T049 [TEST] [TDD] [US-020] [US-023] Derivar de AC-079 o caso de curto-circuito preservado em tests/setup-jafeito-skills-framework.test.ts — Refs: US-020, US-023, FR-030, AC-079 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-079; desenhar executores fake com contador de chamadas para `skills` e para `framework`.
  - [x] **EXECUTE**: Escrever caso chamando `runSetup` duas vezes com hooks, skills e framework todos presentes e batendo com `opts.previous`; confere que a 2ª chamada não invoca os executores de `skills` nem de `framework` nenhuma vez, e não consulta `opts.approval`.
  - [x] **VERIFY**: RED só se a implementação futura passar a chamar os executores sempre — hoje o caso já passaria por acidente, já que a 2ª chamada nunca alcança o bloco de skills/framework; registrado como controle para não regredir depois do fix.
  - [x] **EVIDENCE**: Comando e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T050 [CODE] [US-020] [US-023] Redefinir jaFeito em src/setup/run.ts — Refs: US-020, US-023, FR-030, AC-077, AC-078, AC-079 — Depends: T047, T048, T049
  - [x] **PREP**: Confirmar RED de `T047` e `T048`, e GREEN-por-acidente de `T049`.
  - [x] **EXECUTE**: Mover o cálculo de `raiz` para antes da checagem de `jaFeito`. Substituir `jaFeito = matches(...)` por `hooksJaFeito && skillsJaFeito && frameworkJaFeito`, com `skillsJaFeito`/`frameworkJaFeito` calculados via `inspectSkills(raiz).dirs` e `existsSync(join(raiz, ".project-context"))`, sem subprocesso.
  - [x] **VERIFY**: Casos de `T047`, `T048` e `T049` GREEN; os 306 casos anteriores seguem verdes.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T050", "refs": ["US-020", "US-023", "FR-030", "AC-077", "AC-078", "AC-079"], "files": ["src/setup/run.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

- [x] T051 [DOC] Registrar a redefinição de "já configurado" em .project-context/STACK.md — Refs: FR-030 — Depends: T050
  - [x] **PREP**: Ler a seção do `runSetup` em `.project-context/STACK.md`.
  - [x] **EXECUTE**: Descrever as três checagens que compõem `jaFeito` e por que existem, sem duplicar o que a seção 8 da spec já registra em detalhe.
  - [x] **VERIFY**: `npm run build` em exit 0.
  - [x] **EVIDENCE**: Comando e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T052 [OPS] Verificação manual real e fechar o Delivery Gate da segunda reabertura na seção 13 de specs/completed/0005-fatia-1h-skills-lado-a-lado/spec.md — Refs: NFR-020, NFR-021, NFR-022 — Depends: T047, T048, T049, T050, T051
  - [x] **PREP**: T047–T051 concluídas, cada `[CODE]` com seu comentário de evidência.
  - [x] **EXECUTE**: Repetir manualmente a reprodução da seção 1 — instalar, apagar `.claude/skills/`, reinstalar; instalar, apagar `.project-context/`, reinstalar; suíte completa e `npm run verify`.
  - [x] **VERIFY**: Os dois cenários de drift restauram o conteúdo; suíte inteira e `verify` em exit 0 a partir de clone limpo.
  - [x] **EVIDENCE**: Comandos, contagens e exit codes registrados na seção 13.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

### 15. Ordem de execução

`T001` primeiro e sozinho: os casos que exercitam a instalação precisam do binário local, e fixá-lo antes evita que qualquer caso caia numa busca à ponta.

Em seguida a Fase 2 inteira, com as dezesseis tarefas em paralelo. Cada uma escreve num arquivo distinto de `tests/` e nenhuma depende das outras.

A Fase 3 segue a direção da dependência entre módulos. `T018` e `T019` são as únicas sem predecessor de código: a origem não toca o sistema de arquivos, e o inventário não conhece instalação nem registro. `T020` consome as duas, `T021` consome o inventário, e `T022` e `T023` apenas ligam o que já está pronto ao `setup` e ao `doctor` existentes.

Caminho crítico: `T001 → T003 → T019 → T021 → T023 → T024 → T027`. Sete das vinte e sete tarefas, passando por `T019` porque o inventário é predecessor tanto da instalação quanto do registro.

O fechamento admite paralelismo entre `T024`, `T025` e `T026`, que tocam arquivos diferentes, mas `T024` e `T025` precisam de `T022` e `T023` concluídas para descrever a superfície real em vez da planejada.

**Reabertura 2026-08-30.** `T030` a `T036` são a Fase 5, todas sem predecessor de código e paralelas entre si — cada uma escreve num arquivo próprio de `tests/`. `T037` e `T038` seguem `T030`, `T031` e `T036`; `T039` e `T040` seguem `T032`–`T036`; as duas duplas compartilham `T036` como predecessor comum — o teste de ponta a ponta real, que é quem afinal prova a integração completa —, mas continuam livres para rodar em paralelo entre si. `T041` (wiring em `run.ts`) precisa de `T037` e `T039` prontas — é quem primeiro faz as duas origens do `skills` e o `former tool install` conviverem na mesma execução. `T042` (wiring em `cli.ts`) é a última tarefa de código: só ela fecha o teste de ponta a ponta real de `T036`, e é o motivo direto da reabertura. `T043`–`T045` fecham em paralelo depois de `T041`/`T042`, e `T046` fecha o Delivery Gate.

Caminho crítico da reabertura: `T030 → T037 → T041 → T042 → T046` (a origem nova precisa existir antes do wiring de `run.ts`, que precisa existir antes do wiring de `cli.ts`, que é o que o teste de ponta a ponta real de `T036` cobra).

**Segunda reabertura 2026-08-30.** `T047`, `T048` e `T049` são RED independentes, paralelas entre si. `T050` — a única mudança de produção — consome as três. `T051` (documentação) e o início de `T052` (verificação manual) seguem `T050`; `T052` fecha o Delivery Gate depois de `T051`.

Caminho crítico: `T047 → T050 → T052`.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Fatia 1b concluída, que fornece o `setup`, o registro e a detecção do alvo.
- Fatia 1a concluída, que fornece o `doctor` e a resolução em camadas.
- Pacote `skills`, da vercel-labs, declarado como dependência npm em versão exata, hoje 1.5.23, e invocado pelo binário local que ele expõe. Ele já chegava ao projeto por via transitiva, como dependência de `removed-project-integration` em faixa `^1.5.22`; declará-lo direto e exato o traz para dentro da regra de fixação, que a faixa transitiva não respeitava.
- Pacote `removed-project-integration`, já dependência npm fixada desde a fatia 1a, agora também invocado por subprocesso pelo binário local que expõe (`bin/framework.cjs`), e não só usado como motor de skills deste próprio repositório.

#### Riscos

- **Relatar instalação que não ocorreu** → é o defeito que a fatia 1b cometeu, quando o comando dizia ter instalado sete hooks sem escrever arquivo algum, e que esta própria fatia cometeu na entrega original, quando o `Executor` real nunca chegou a existir. Mitigação: `AC-028`, `AC-031`, `AC-036` e `AC-040` exigem que ausência e interrupção cheguem como erro, e a suíte de ponta a ponta real (seção 11) confere o disco sem `Executor` injetado — a categoria de teste que faltava e que permitiu o defeito passar pelos três gates sem ser notado.
- **Conteúdo por link simbólico** → o hash deixaria de descrever o que o agente lê, e o ferramental do former project tool recusa caminho por link. Mitigação: `FR-021` exige cópia, `AC-021` confere a ausência de links e `AC-033` trata link como inválido.
- **Prometer reprodutibilidade** → o instalador não a oferece, e afirmá-la seria falso. Mitigação: `NFR-021` e `AC-030` exigem que o relato declare o alcance real.
- **Origem de terceiro passar por oficial** → skills são instruções que entram no contexto do agente. Mitigação: `FR-025`, com `AC-026`, `AC-034` e `AC-035`.
- **Sobrescrita entre ecossistemas** → perderia conteúdo de um dos dois. Mitigação: `FR-026` e `AC-027`, que recusam em vez de resolver. Verificado na reabertura com as duas origens reais em sequência no mesmo diretório: 20 skills de `removed-project-integration` seguidas de 37 de `mattpocock/skills` resultaram em 57 diretórios reais e um `skills-lock.json` com as 57 entradas atribuídas à origem correta, sem perda — `research/reabertura-2026-08-30/segunda-origem-oficial.md`.
- **Instalar fora do projeto** → o instalador oferece a forma global, e a regra do projeto a proíbe. Mitigação: `FR-022` e a comparação da árvore do diretório do usuário.
- **Parsing frágil da listagem do `skills`** → a enumeração prévia (`--list`) não tem saída JSON; é texto formatado para terminal, sujeito a mudar entre versões do instalador. Mitigação: o executor real trata como falha uma execução que termina com código zero mas não reconhece skill nenhuma na saída, em vez de silenciosamente relatar zero instaladas como sucesso — o mesmo princípio de `AC-028`, aplicado ao parsing.
- **Segunda fonte de verdade sobre o framework former project tool** → registrar no `common-rules` o que `former tool install` já registra em `.project-context/` criaria duas verdades que divergem. Mitigação: `DEC-030` decide não persistir registro próprio; o `setup` relata o resultado que o instalador devolveu, e nada mais.
- **"Já configurado" mentir sobre o disco** → é o defeito desta segunda reabertura: `jaFeito` olhava só hooks, então apagar skills ou o framework manualmente e rodar `setup` de novo relatava sucesso sem restaurar nada — reproduzido de verdade, 57 skills apagadas, segunda execução não instalou nenhuma. Mitigação: `FR-030`, com `AC-077`, `AC-078` e `AC-079`, que redefinem "já configurado" para exigir também a presença de skills e do framework no disco.

#### Suposições

Registradas na seção 13, todas reversíveis.

### 17. Decisões

- **DEC-020**: Os dois ecossistemas ficam instalados e íntegros; o `common-rules` não escolhe entre eles. *Razão*: formulação direta de quem responde pelo produto. *Alternativas descartadas*: preterir um, mesclar conteúdos, ou tratar as skills como detectáveis à maneira dos backends de agente.
- **DEC-021**: A origem oficial é o instalador `skills` apontando para `mattpocock/skills`, e é a única aceita. *Razão*: o autor não publica no npm, e existe no registro uma republicação de terceiro com nome plausível apontando o repositório original nos metadados. *Alternativas descartadas*: consumir o pacote npm de terceiro; embutir cópia no próprio `common-rules`.
- **DEC-022**: A instalação usa cópia real, nunca link simbólico. *Razão*: `R-020` mostrou que o link é o padrão do instalador. Conteúdo por link vive fora do projeto, e então o hash não descreve o que o agente lê, duas máquinas divergem sem registro, e o ferramental do former project tool recusa caminho por link.
- **DEC-023**: A procedência vive no registro que a fatia 1b já grava, e não em arquivo novo. *Razão*: é a mesma pergunta — o que este `setup` colocou aqui — e um segundo arquivo criaria duas verdades que divergem.
- **DEC-024**: A entrega dá rastreabilidade, não reprodutibilidade, e declara isso. *Razão corrigida por observação*: o instalador **grava** um lockfile com hash por skill, ao contrário do que a primeira leitura do README sugeria. O que ele não registra é referência de commit ou versão do conjunto, de modo que reexecutar continua buscando a ponta. O lockfile diz o que se obteve, não o que se deve obter. Registrar como limitação assumida evita que ela seja tratada como dívida a ser paga pelo épico de checksum, que também não a resolveria: checksum sobre arquivo que o mesmo processo escreve detecta divergência, não impede substituição.
- **DEC-027**: O instalador entra como dependência npm fixada em versão exata, e é invocado pelo binário local. *Razão*: `npx` em tempo de execução buscaria a ponta a cada chamada, o que contradiz a regra de fixação e a de preferir a cópia local. Fixá-lo o coloca na camada 1 da DEC-002, junto dos demais subsistemas npm. *Alternativa descartada*: invocação por `npx`, que deixaria o executável fora de qualquer garantia de versão.
- **DEC-028**: A procedência é lida do `skills-lock.json` do instalador, e o registro do `common-rules` a referencia em vez de recalculá-la. *Razão*: recalcular criaria duas verdades sobre o mesmo conteúdo, que divergem com o tempo. *Consequência a resolver no plano*: esse arquivo está hoje no `.gitignore` deste repositório, de modo que a procedência não seria versionada.
- **DEC-025**: O `doctor` relata e não repara. *Razão*: mantém a separação já decidida entre diagnosticar e reparar, e preserva a proibição de reparo destrutivo.
- **DEC-026**: Apenas o alvo Claude Code é instalado, e a forma global do instalador não é usada. *Razão*: o alvo decidido para o `setup` é Claude Code com detecção, e a regra do projeto proíbe escrever fora dele.
- **DEC-029** *(reabertura 2026-08-30, estende `DEC-021` sem invalidá-la)*: A segunda origem oficial do instalador `skills` é `removed-project-integration` — mesmo instalador, mesmo alvo, mesma ausência de interação de `mattpocock/skills`. *Razão*: é a origem real de onde as skills do próprio framework former project tool chegam a `.claude/skills/`, confirmada por execução real (`R-022`); a AC-020 original já testava essa convivência, mas nenhuma FR jamais a declarou, e nenhum código de produção jamais a instalava de verdade. *Alternativas descartadas*: manter `.claude/skills/framework-*` como conteúdo pré-existente do repositório consumidor, fora do que o `setup` garante — rejeitada porque contradiz o próprio título e resultado desejado desta fatia, e porque deixaria o `setup` incompleto sobre projetos novos.
- **DEC-030** *(reabertura 2026-08-30, nova)*: O `setup` executa `former tool install --project <raiz>` real, mas não persiste registro próprio sobre o resultado — relata o `changed`/`paths` que o instalador devolve. *Razão*: `former tool install` já é idempotente e já mantém seu próprio estado em `.project-context/`; duplicar isso no registro do `common-rules` criaria duas verdades sobre o mesmo framework, o mesmo erro que `DEC-023` e `DEC-028` já evitaram para as skills. *Alternativas descartadas*: gravar uma entrada `framework` na lista `skills` do registro — rejeitada por misturar dois conceitos (conjunto de skills vs. instalação de framework) numa mesma lista tipada.
- **DEC-031** *(segunda reabertura, 2026-08-30, nova)*: "Já configurado" passa a exigir também a presença em disco de skills e do framework former project tool previamente registrados, com verificação barata (sistema de arquivos, sem subprocesso) — não a execução dos instaladores reais só para descobrir se há o que fazer. *Razão*: chamar `skills`/`former tool install` a cada `setup`, mesmo quando nada mudou, pagaria o custo de três subprocessos reais (alguns segundos) em toda execução — caro sem necessidade quando o disco já corresponde ao registro. Uma checagem de presença é suficiente para capturar o cenário real que motivou a reabertura: conteúdo apagado por fora. *Alternativas descartadas*: sempre chamar os instaladores reais, ignorando `jaFeito` para skills/framework — descartada pelo custo em toda execução comum; comparar hash completo do conteúdo contra o lockfile — descartada por exigir subprocesso ou recálculo que `DEC-028` já rejeitou para outro propósito.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam, incluindo os novos `AC-077` a `AC-079`.
- [x] Todos os requisitos possuem evidência de verificação registrada na seção 12, incluindo `FR-030`.
- [x] Todas as tarefas da seção 14 estão concluídas.
- [x] Nenhuma entrada instalada é link simbólico, conferido por inspeção do sistema de arquivos.
- [x] O diretório do usuário tem a mesma árvore antes e depois da suíte.
- [x] Os três caminhos de falha do instalador `skills` foram exercitados e nenhum produz relato de sucesso.
- [x] O caminho de falha do instalador `former tool install` foi exercitado e não produz relato de sucesso.
- [x] `common-rules setup`, executado de ponta a ponta sobre um projeto descartável de verdade, sem `Executor` injetado, deixa em disco: `.claude/skills/` com as skills de `mattpocock/skills` e de `removed-project-integration`; `.project-context/`, `.agents/skills/`, `CLAUDE.md` e `AGENTS.md` reais.
- [x] Apagar `.claude/skills/` ou `.project-context/` manualmente e rodar `setup` de novo, com os hooks intactos, restaura o que faltar — verificado de ponta a ponta, sem `Executor` injetado.
- [x] Com hooks, skills e framework todos intactos, `setup` continua relatando "já estava configurado" sem consultar aprovação nem invocar instalador algum.
- [x] `.project-context/STACK.md` registra os dois instaladores, os módulos novos e a ampliação do registro.
- [x] `PROJECT.md` descreve que o `setup` instala os dois conjuntos de skills e o framework former project tool, e o que o `doctor` passa a relatar.
