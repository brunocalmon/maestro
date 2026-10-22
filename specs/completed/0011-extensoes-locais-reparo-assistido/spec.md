# Especificação integrada: Extensões locais, reparo assistido e orquestração

| Campo | Valor |
| --- | --- |
| Formato | former project tool/2.0 |
| ID | SPEC-0011 |
| Slug | 0011-extensoes-locais-reparo-assistido |
| Status | Complete |
| Effort | 7 |
| Effort updated at | 2026-09-02 |
| Effort rationale | Épico com três fatias ativas (extensões, reparo, orquestração), um mecanismo novo (registro de checksum, âncoras de injeção) sem precedente direto no projeto, e um comando novo por fatia. Comparável ao topo da faixa `standard`/início de `high`: mais superfície que qualquer fatia isolada de Phase 1, mas sem I/O externo, rede ou concorrência que justificasse `maximum`. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não — comandos de terminal e um bloco de texto ancorado em arquivos já existentes (hooks, `CLAUDE.md`, `AGENTS.md`), sem tela. |
| Atualizada em | 2026-09-02 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

Hoje não há como a pessoa ajustar um hook ou uma regra entregue pelo
`common-rules` sem editar o arquivo que o `setup` escreve — a próxima
execução sobrescreve. Não existe caminho de customização que sobreviva a uma
reinstalação, nem forma de distinguir o que a ferramenta gerou do que alguém
alterou à mão. `CLAUDE.md`/`AGENTS.md` também não ensinam o agente a acionar
esse mecanismo: hoje contêm só o bloco gerenciado pelo former project tool, sem nenhuma
seção própria do `common-rules` (achado real, verificação manual desta
sessão, 2026-09-02).

Esta especificação deriva de `BACKLOG-0004`
(`specs/backlog/0004-phase-2-extensoes-locais-e-heal.md`), que por sua vez
refina o ADR 001 capturado em
`specs/inbox/2026-08-29-145241-adr-001-...md`. O refinamento do backlog já
rejeitou quatro propostas do ADR original antes desta especificação começar
— preservadas aqui só para não serem herdadas por engano:

1. Instalar ferramentas upstream em diretórios oficiais — contradiz a
   proibição de instalar globalmente (`SPEC-0002`).
2. `doctor` que bloqueia, reverte ou exclui — capacidade destrutiva num
   comando de diagnóstico.
3. "Fallback silencioso" diante de divergência — contradiz a decisão de
   recusar em vez de adivinhar (`SPEC-0004`).
4. A afirmação de que o checksum impede injeção de prompt — o mesmo processo
   escreve o arquivo e o registro; a propriedade real é detectabilidade, não
   prevenção.

#### Resultado desejado

Uma customização local sobrevive a uma reinstalação do `setup`. Um arquivo
alterado por fora do caminho da CLI é detectado e recusado em voz alta, nunca
aceito silenciosamente. Um comando de reparo, distinto do `doctor`, resolve a
divergência preservando o que substitui, nunca apagando. `CLAUDE.md` (e,
minimamente, `AGENTS.md`) passam a ter uma seção própria do `common-rules`,
escrita pelo mesmo caminho único e protegida pelo mesmo mecanismo.

#### Métricas de sucesso

- Uma extensão criada pela CLI continua aplicada depois de rodar `setup` de novo sobre o mesmo projeto.
- Um artefato de extensão editado fora da CLI é nomeado pelo `doctor`, que sai com código diferente de zero, sem alterar nada no disco.
- Um artefato divergente apontado pelo `doctor` é movido para quarentena pelo comando de reparo, e o original volta ao lugar — nunca apagado.
- Uma tentativa de criar categoria `new` para um dos sete hooks é recusada, com o motivo explicado.
- `CLAUDE.md` passa a conter uma seção própria do `common-rules`, escrita pelo mesmo caminho único das demais extensões.

### 2. Research e esclarecimentos

#### Researchs executados

Não aplicável como claim externo verificável — as decisões desta seção derivam de refinamento de backlog já registrado (`BACKLOG-0004`), não de execução real de comando ou consulta a documentação de terceiro. A proveniência de cada decisão está em `Dúvidas respondidas` abaixo, com o caminho exato de origem.

#### Fontes e contexto consultados

- `specs/backlog/0004-phase-2-extensoes-locais-e-heal.md` — brief refinado, decisões D1–D8, critérios de aceite, regras de negócio.
- `specs/inbox/2026-08-29-145241-adr-001-harness-extensivel-com-lazy-loading-shadow-dom-e-doctor-com-rollback.md` — ADR original, preservado sem alteração.
- `.project-context/Spec.md` — contrato de blocos delimitados em `AGENTS.md`/`CLAUDE.md`, cuja convenção de âncora (`<!-- former-tool:context:start/end -->`) esta especificação reaproveita.
- `src/setup/run.ts`, `src/setup/record.ts` (`SPEC-0003`, `SPEC-0005`) — como o `setup` já grava hooks e registro; o comando de extensão estende o mesmo módulo, não cria um paralelo.
- `src/approval/registry.ts` (`SPEC-0010`) — o mesmo padrão de registro JSON local (`.common-rules/approved-commands.json`) que o registro de checksum desta fatia segue, em arquivo próprio.
- `CLAUDE.md`, `AGENTS.md` deste repositório, lidos de verdade nesta sessão — confirmam que hoje só têm o bloco do former project tool, nada do `common-rules`.

#### Documentação consultada

Nenhuma documentação externa publicada; toda decisão vem do backlog já refinado ou de leitura direta do código e dos arquivos deste repositório.

#### Artefatos de pesquisa armazenados

Nenhum artefato externo — o único material de origem é o backlog e o ADR, ambos já versionados em `specs/`, não copiados para `research/`.

#### Dúvidas respondidas

- **Q**: Qual formato de âncora marca onde o conteúdo customizado entra? → **A**: Comentário HTML, mesmo padrão do former project tool — `<!-- common-rules:<categoria>:<nome>:start/end -->`. Decisão `D6` do backlog, tomada em 2026-09-02: reaproveita um mecanismo que já funciona neste repositório, em vez de inventar um segundo formato para o mesmo problema.
- **Q**: Onde vive a quarentena, e ela expira? → **A**: `.common-rules/quarantine/`, sem expiração automática. Decisão `D7`: expirar implicaria apagar, o que contradiz a regra já fixada de "quarentena em vez de exclusão, sempre"; limpeza manual fica com quem usa.
- **Q**: A camada de orquestração em `CLAUDE.md`/`AGENTS.md` (fatia C) entra nesta especificação? → **A**: Sim. Decisão `D8`: o gatilho nomeado no diagnóstico anterior do backlog era a fatia 1d (detecção de backends), já entregue como `SPEC-0008`; a Phase 1 inteira fechou em 2026-09-02.
- **Q**: O sistema de extensões cobre skills do former project tool, `context-mode` ou `code-review-graph`? → **A**: Não. Decisão `D4`, já registrada no backlog: cobre só os artefatos que o próprio `setup` escreve — os sete hooks, seu registro, e agora o bloco de `CLAUDE.md`/`AGENTS.md` que a fatia C acrescenta a essa mesma lista.
- **Q**: O `doctor` ganha capacidade de reparar ou reverter? → **A**: Não. Decisão já fixada no backlog: "o `doctor` não altera o sistema de arquivos sob nenhuma condição." O reparo é comando irmão, não subcomando — resolvido por inspeção da própria regra, sem precisar perguntar de novo nesta especificação.
- **Q**: Falta confirmar se `context-mode`/`code-review-graph` publicam inventário de propriedade? → **A**: Pergunta sem efeito prático dentro deste escopo — `D4` já restringe o sistema a artefatos que o próprio `setup` escreve, nunca a artefato de dependência de terceiro.

#### Dúvidas abertas

Nenhuma que bloqueie esta especificação.

### 3. Escopo e atores

#### Incluído

- Comando de terminal para criar um artefato de extensão local, com categoria `override`, `extension` ou `new`, âncora HTML e checksum registrado.
- Skill de fachada que entrevista a pessoa e aciona o comando da CLI — nunca escreve arquivo nem registro diretamente.
- `doctor` ampliado para relatar divergência de checksum num artefato de extensão, sem alterar nada no disco.
- Comando de reparo, distinto do `doctor`, que move o artefato divergente para `.common-rules/quarantine/` e restaura o original.
- Um bloco próprio do `common-rules` em `CLAUDE.md`, escrito pelo mesmo caminho único de extensão, com um roteador minimalista; um ponteiro mínimo equivalente em `AGENTS.md`, sem duplicar conteúdo.

#### Fora de escopo

- Hidratação sob demanda de regras de skill (fatia D do backlog) — adiada por `D1`: medição já mostrou 17x de economia que a plataforma entrega sozinha, sem essa fatia.
- Qualquer artefato de dependência — skills do former project tool, `context-mode`, `code-review-graph`. O sistema de extensões nunca os toca (`D4`).
- Instalação de ferramenta upstream em diretório global, em qualquer forma — a regra de preferir cópia local, aceitar global, nunca instalar globalmente (`SPEC-0002`) não muda.
- `doctor` que bloqueia, reverte, repara ou exclui — permanece estritamente leitura.
- Alvo de editor além do Claude Code — fora do escopo já decidido para o produto inteiro.
- Aprovação em lote de comandos de dependência — já entregue por `SPEC-0010`; esta especificação não cria um segundo mecanismo de aprovação, e o comando de extensão local não é um "comando de dependência" no sentido daquela fatia.

#### Atores

- **Pessoa que mantém o repositório**: cria, edita a intenção de e repara extensões locais; precisa de hotfix sem esperar release.
- **Skill de fachada**: intermediária entre a pessoa e a CLI — nunca escreve arquivo, só entrevista e aciona comando.
- **Agente de codificação (Claude Code)**: lê o roteador minimalista em `CLAUDE.md`/`AGENTS.md` e, quando a intenção pedir, aciona a skill de fachada em vez de ler os artefatos originais inteiros.

### 4. Princípios e restrições do projeto

- **PR-080**: A garantia de um artefato de extensão é detectabilidade de divergência, nunca prevenção de escrita — o mesmo processo que grava o arquivo grava o registro, então o checksum nunca impede uma alteração; ele só a torna visível na próxima leitura.
- **PR-081**: Nenhuma operação deste sistema destrói conteúdo. Divergência vira quarentena, nunca exclusão.
- **PR-082**: `doctor` permanece estritamente leitura — relatar é sempre um comando diferente de reparar.
- **PR-083**: Toda escrita de artefato de extensão passa por um único caminho, a CLI. A skill de fachada nunca grava arquivo nem registro por conta própria.

### 5. Histórias de usuário

#### US-080 — Customizar um hook sem perder a mudança na próxima instalação (P1)

Como pessoa que mantém este repositório, quero criar uma extensão ou um
override local para um hook, para aplicar um hotfix sem esperar um release
do `common-rules` e sem que o próximo `setup` apague minha mudança.

**Por que P1**: é o problema central desta especificação — sem isso, toda
customização é reescrita a cada instalação.
**Teste independente**: criar uma extensão pela CLI, rodar `setup` de novo
sobre o mesmo projeto, e confirmar que a extensão continua aplicada.
**Requisitos**: FR-080, FR-081, FR-082

#### US-081 — Saber quando algo divergiu, e reparar sem perder o que mudei (P1)

Como pessoa que mantém este repositório, quero que o `doctor` me avise
quando um artefato de extensão foi alterado fora da CLI, e um comando
separado que resolva isso sem apagar o que eu tinha escrito.

**Por que P1**: sem detecção e reparo, uma alteração manual silenciosa
contamina o sistema sem que ninguém perceba.
**Teste independente**: editar um artefato de extensão fora da CLI, rodar
`doctor` e confirmar que ele nomeia o arquivo e sai com código diferente de
zero; rodar o comando de reparo e confirmar que o divergente está na
quarentena e o original voltou ao lugar.
**Requisitos**: FR-083, FR-084, FR-085

#### US-082 — O agente sabe acionar a extensão sem ler tudo (P1)

Como pessoa usando o Claude Code neste projeto, quero que `CLAUDE.md` ensine
o agente a acionar a skill de fachada declarativamente, em vez de precisar
ler os artefatos originais inteiros para saber que a capacidade existe.

**Por que P1**: sem o roteador, a capacidade de extensão existe na CLI mas
fica invisível para o agente que trabalha no repositório.
**Teste independente**: rodar `setup` num projeto novo e confirmar que
`CLAUDE.md` contém a seção do `common-rules` com o roteador minimalista, e
que `AGENTS.md` contém o ponteiro mínimo equivalente.
**Requisitos**: FR-086, FR-087

### 6. Cenários BDD de aceite

#### AC-130 — Extensão criada pela CLI sobrevive a uma reinstalação

**Cobre**: US-080, FR-080, FR-081, FR-082, NFR-083

```gherkin
@US-080 @FR-080 @FR-081 @FR-082 @NFR-083 @AC-130
Feature: Extensão sobrevive ao setup

  Scenario: Extensão registrada continua aplicada depois de setup rodar de novo
    Given uma extensão criada pelo comando da CLI, com checksum registrado
    When o setup roda de novo sobre o mesmo projeto
    Then a extensão continua aplicada
    And o registro segue reconhecendo seu checksum
```

#### AC-131 — Categoria `new` é recusada para os sete hooks

**Cobre**: US-080, FR-080, FR-081, FR-082

```gherkin
@US-080 @FR-080 @FR-081 @FR-082 @AC-131
Feature: Categoria new recusada para artefato gerenciado

  Scenario: Pedido de categoria new para um dos sete hooks
    Given um dos sete hooks que o setup escreve
    When alguém pede sua criação como categoria new
    Then o comando recusa
    And explica que apenas override ou extension se aplicam a artefato gerenciado
```

#### AC-132 — Conflito de nome pede escolha explícita, sem default silencioso

**Cobre**: US-080, FR-080, FR-081, FR-082

```gherkin
@US-080 @FR-080 @FR-081 @FR-082 @AC-132
Feature: Conflito de nome não tem default silencioso

  Scenario: Nome já usado por outra extensão
    Given uma extensão já registrada com um nome
    When a pessoa pede a criação de outra extensão com o mesmo nome
    Then o comando anuncia o conflito
    And apresenta a escolha entre pular e substituir, sem aplicar nenhuma das duas por padrão
```

#### AC-133 — `doctor` relata divergência sem alterar nada

**Cobre**: US-081, FR-083, FR-085, NFR-080, NFR-082

```gherkin
@US-081 @FR-083 @FR-085 @NFR-080 @NFR-082 @AC-133
Feature: Doctor detecta divergência

  Scenario: Artefato de extensão editado fora da CLI
    Given um artefato de extensão cujo conteúdo não bate com o checksum registrado
    When o doctor examina o projeto
    Then ele nomeia o arquivo divergente
    And sai com código diferente de zero
    And nenhum arquivo no disco é alterado
```

#### AC-134 — Reparo move o divergente para quarentena e restaura o original

**Cobre**: US-081, FR-083, FR-084, FR-085, NFR-081, NFR-082

```gherkin
@US-081 @FR-083 @FR-084 @FR-085 @NFR-081 @NFR-082 @AC-134
Feature: Reparo com quarentena

  Scenario: Comando de reparo sobre um artefato divergente
    Given um artefato divergente apontado pelo doctor
    When o comando de reparo é executado
    Then o arquivo divergente existe em .common-rules/quarantine/
    And o artefato original volta ao lugar, com o checksum batendo de novo
    And nenhum arquivo foi apagado
```

#### AC-135 — Registro de checksum ausente é tratado como divergência, não como exceção

**Cobre**: US-081, FR-083, FR-084, NFR-080, NFR-081, NFR-082

```gherkin
@US-081 @FR-083 @FR-084 @NFR-080 @NFR-081 @NFR-082 @AC-135
Feature: Checksum ausente é divergência, não falha

  Scenario: Artefato presente no diretório de extensões sem entrada correspondente no registro
    Given um arquivo em .common-rules/extensions/ sem checksum registrado
    When o doctor examina o projeto
    Then ele trata esse artefato como divergente
    And nenhuma exceção é lançada
```

#### AC-136 — `CLAUDE.md` ganha a seção própria do `common-rules` no primeiro `setup`

**Cobre**: US-082, FR-086, FR-087, FR-088, NFR-083

```gherkin
@US-082 @FR-086 @FR-087 @FR-088 @NFR-083 @AC-136
Feature: Roteador em CLAUDE.md

  Scenario: Setup roda pela primeira vez com a extensão ativa
    Given um projeto sem nenhuma seção do common-rules em CLAUDE.md
    When o setup roda e aprova o plano
    Then CLAUDE.md passa a conter o bloco ancorado do common-rules, com o roteador minimalista
    And o bloco é registrado no mesmo mecanismo de checksum das demais extensões
```

#### AC-137 — `AGENTS.md` ganha um ponteiro mínimo, sem duplicar `CLAUDE.md`

**Cobre**: US-082, FR-086, FR-087, FR-088, NFR-083

```gherkin
@US-082 @FR-086 @FR-087 @FR-088 @NFR-083 @AC-137
Feature: AGENTS.md aponta para CLAUDE.md

  Scenario: Setup roda e AGENTS.md ainda não tem o ponteiro
    Given um projeto sem o ponteiro do common-rules em AGENTS.md
    When o setup roda e aprova o plano
    Then AGENTS.md passa a conter um ponteiro mínimo para o bloco de CLAUDE.md
    And o conteúdo do roteador não é duplicado em AGENTS.md
```

#### AC-138 — Skill de fachada nunca escreve arquivo diretamente

**Cobre**: US-080, US-082, FR-080, FR-086, FR-087, FR-088, NFR-083

```gherkin
@US-080 @US-082 @FR-080 @FR-086 @FR-087 @FR-088 @NFR-083 @AC-138
Feature: Skill de fachada só aciona a CLI

  Scenario: Skill entrevista a pessoa e emite o comando
    Given a skill de fachada entrevistando a pessoa sobre uma nova extensão
    When a intenção é confirmada
    Then a skill emite o comando da CLI de criação de extensão
    And a skill em si não grava arquivo nem registro
```

#### AC-139 — Quarentena sem espaço gravável recusa o reparo inteiro

**Cobre**: US-081, FR-084, FR-085, NFR-080, NFR-081

```gherkin
@US-081 @FR-084 @FR-085 @NFR-080 @NFR-081 @AC-139
Feature: Reparo falha inteiro, não pela metade

  Scenario: Diretório de quarentena não gravável
    Given um artefato divergente e um diretório de quarentena que não pode ser escrito
    When o comando de reparo é executado
    Then o comando recusa o reparo inteiro
    And o artefato divergente permanece exatamente como estava
```

#### AC-140 — Setup entrega a skill de fachada no projeto-alvo

**Cobre**: US-080, US-082, FR-088, NFR-083

```gherkin
@US-080 @US-082 @FR-088 @NFR-083 @AC-140
Feature: Skill de fachada chega ao projeto-alvo

  Scenario: Setup roda pela primeira vez com a skill empacotada
    Given um projeto sem a skill common-rules-extension-creator instalada
    When o setup roda e aprova o plano
    Then .claude/skills/common-rules-extension-creator/SKILL.md existe
    And .agents/skills/common-rules-extension-creator/SKILL.md existe
    And o conteúdo entregue é o mesmo empacotado em resources/skills/
```

### 7. Requisitos

#### Funcionais

- **FR-080**: O sistema deve oferecer um comando de CLI que cria um artefato de extensão local com categoria (`override`, `extension` ou `new`), grava a âncora HTML no arquivo alvo e registra o checksum do artefato.
- **FR-081**: O sistema deve recusar a categoria `new` quando o alvo for um dos sete hooks que o `setup` já gerencia, explicando o motivo.
- **FR-082**: O sistema deve, diante de conflito de nome com uma extensão já registrada, anunciar o conflito e oferecer explicitamente pular ou substituir, sem aplicar nenhuma escolha por padrão.
- **FR-083**: O `doctor` deve comparar cada artefato de extensão registrado contra seu checksum e relatar cada divergente — incluindo checksum ausente para artefato presente — sem alterar nada no sistema de arquivos.
- **FR-084**: O sistema deve oferecer um comando de reparo, distinto do `doctor`, que move um artefato divergente para `.common-rules/quarantine/` e restaura o artefato original a partir do conteúdo gerado pela CLI.
- **FR-085**: O comando de reparo nunca deve apagar um artefato — divergência vira quarentena, sempre.
- **FR-086**: O `setup`, quando a extensão do roteador estiver pendente, deve escrever em `CLAUDE.md` um bloco ancorado próprio do `common-rules`, pelo mesmo caminho único de criação de extensão.
- **FR-087**: O `setup` deve escrever em `AGENTS.md` um ponteiro mínimo para o bloco de `CLAUDE.md`, sem duplicar o conteúdo do roteador.
- **FR-088**: O `setup` deve entregar a skill de fachada `common-rules-extension-creator`, empacotada com o próprio `common-rules`, nos diretórios de skill do projeto-alvo — nunca deixá-la parada só no pacote sem uso possível pela pessoa.

#### Não funcionais

- **NFR-080**: **Detectabilidade, não prevenção**. O checksum nunca impede uma escrita fora da CLI; ele garante que essa escrita apareça na próxima leitura do `doctor`. **Verificação**: `AC-133`, inspeção do código confirmando que nenhuma escrita é bloqueada em tempo real.
- **NFR-081**: **Reversibilidade**. Nenhuma operação deste sistema destrói conteúdo — divergência vira quarentena, sempre. **Verificação**: `AC-134`, `AC-139`.
- **NFR-082**: **`doctor` sem mutação**. Em nenhuma condição o `doctor` altera o sistema de arquivos. **Verificação**: `AC-133`, `AC-135`, inspeção do código.
- **NFR-083**: **Caminho único de escrita**. Cada artefato de extensão é gravado pela CLI; a skill de fachada nunca escreve arquivo nem registro por conta própria. **Verificação**: `AC-138`.

#### Erros e casos-limite

- Checksum ausente para arquivo presente no diretório de extensões → tratado como divergente e recusado, sem apagar (`AC-135`).
- Quarentena não gravável → recusa o reparo inteiro em vez de reparar pela metade (`AC-139`).
- Conflito de nome com artefato de dependência (skill do former project tool, por exemplo) → recusado, apontando que o caminho é a montante — esse artefato nunca é candidato a extensão (`D4`).
- Registro de checksum corrompido → tratado como vazio (cada artefato pendente aparece como divergente), no mesmo padrão já usado pelo registro de aprovação (`SPEC-0010`, `AC-119`) — nunca reconstruído por inferência.
- `CLAUDE.md`/`AGENTS.md` já contêm o bloco do `common-rules`, sem divergência → `setup` não reescreve nada, comportamento idempotente igual ao já estabelecido para hooks (`SPEC-0005`).

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

- `src/setup/run.ts` já grava hooks, skills, framework former project tool e a ponte Python pelo mesmo `runSetup`, com aprovação (`SPEC-0007`, `SPEC-0010`) e registro de idempotência (`src/setup/record.ts`).
- `src/approval/registry.ts` (`SPEC-0010`) já estabelece o padrão de registro JSON local, injetável, com leitura tolerante a ausência/corrupção — o registro de checksum desta fatia segue o mesmo padrão, em arquivo próprio.
- `.project-context/Spec.md` já documenta e usa blocos delimitados por comentário HTML em `CLAUDE.md`/`AGENTS.md` (`<!-- former-tool:context:start/end -->`) — a âncora desta fatia reaproveita a mesma convenção, com namespace `common-rules` em vez de `framework`.
- `src/hooks/claude-code.ts` (`SPEC-0003`) já traduz e renderiza os sete hooks para `.claude/settings.json` — a extensão de hook por `override` altera o script gerado antes dessa renderização, sem duplicar o motor de tradução.

#### Arquitetura e módulos

| Módulo | Responsabilidade | Arquivo |
| --- | --- | --- |
| Registro de checksum | Lê/grava `.common-rules/extensions.json`, com `ChecksumEnvironment` injetável — mesmo padrão de `src/approval/registry.ts` | `src/extensions/registry.ts` |
| Âncora de injeção | Insere, atualiza ou lê um bloco `<!-- common-rules:<categoria>:<nome>:start/end -->` num arquivo alvo, sem tocar o resto do conteúdo | `src/extensions/anchor.ts` |
| Criação de extensão | Resolve categoria, valida contra os sete hooks gerenciados, grava o artefato pela âncora, calcula e registra o checksum | `src/extensions/create.ts` |
| Diagnóstico de divergência | Compara cada entrada do registro contra o conteúdo real do arquivo, sem escrever nada — consumido pelo `doctor` | `src/extensions/diagnose.ts` |
| Reparo | Move o artefato divergente para `.common-rules/quarantine/<timestamp>-<nome>`, restaura o conteúdo original a partir do registro | `src/extensions/repair.ts` |
| Roteador de `CLAUDE.md`/`AGENTS.md` | Constrói o bloco do roteador minimalista e o ponteiro de `AGENTS.md`, como um caso de extensão da categoria `extension` sobre esses dois arquivos | `src/extensions/router.ts` |

`src/setup/run.ts` passa a montar um candidato adicional (o roteador de `CLAUDE.md`/`AGENTS.md`) no mesmo padrão de candidato de dependência já usado por skills/former project tool/ponte (`SPEC-0010`) — mas fora do registro de aprovação em lote, porque não é comando de dependência de terceiro: é o próprio `common-rules` escrevendo em arquivo do projeto, já coberto pela aprovação de plano existente (`SPEC-0007`).

`doctor` ganha uma quarta fonte de relato — divergência de extensão — ao lado das três camadas já existentes (`npm`, `python`, `agent`), sempre informativa por padrão (uma extensão divergente não é motivo para o `common-rules` recusar reportar as demais camadas, mas o exit code do `doctor` na íntegra passa a refletir a divergência, já que ela é responsabilidade do próprio `common-rules`, diferente da camada `agent`, que é sobre dependência de terceiro).

#### Migrations

Não aplicável.

#### Models

```ts
interface ExtensionArtifact {
  category: "override" | "extension" | "new";
  name: string;
  target: string;
  checksum: string;
  createdAt: string;
}
interface ExtensionRegistry { artifacts: ExtensionArtifact[] }
interface DivergentArtifact { name: string; target: string; reason: "checksum-mismatch" | "checksum-missing" }
interface RepairResult { name: string; quarantinedAt: string; restored: boolean }
```

#### Controllers e casos de uso

- `createExtension(opts: { category, name, target, content, registryEnv?, targetEnv? }): CreateResult` — resolve se `target` é um dos sete hooks (recusa `new` nesse caso, `FR-081`), resolve conflito de nome contra o registro (`FR-082`), grava a âncora no arquivo alvo, calcula o checksum do conteúdo entre âncoras, grava no registro.
- `diagnoseExtensions(registry, targetEnv): DivergentArtifact[]` — função pura de leitura: para cada artefato registrado, lê o conteúdo real entre a âncora correspondente e compara o checksum; artefato presente sem entrada no registro também é divergente (`AC-135`). Nunca escreve.
- `repairExtension(divergent, opts: { registry, targetEnv, quarantineEnv? }): RepairResult` — move o conteúdo divergente para `.common-rules/quarantine/`, regrava o conteúdo original (o que o registro já tinha) na âncora, recusa o reparo inteiro se a quarentena não for gravável (`AC-139`).
- `buildRouterBlock()`/`buildAgentsPointer()` — funções puras que produzem o texto do roteador minimalista e do ponteiro, consumidas por `createExtension` com `category: "extension"` e `target: "CLAUDE.md"`/`"AGENTS.md"` na primeira execução do `setup` que os detectar ausentes.

**Qual arquivo `target` resolve.** `anchor.ts` insere um bloco na string de
conteúdo de qualquer arquivo, sem saber qual é — quem decide o caminho real é
`create.ts`. Quando `target` é `"CLAUDE.md"` ou `"AGENTS.md"`, o arquivo é o
próprio, na raiz do projeto (é o caso da fatia C, onde a pessoa que lê o
arquivo precisa do conteúdo ali mesmo). Para qualquer outro `target`
(inclusive o nome de um dos sete hooks), o arquivo é
`.common-rules/extensions/<target>.md` — um artefato próprio por extensão,
nunca editando `.claude/settings.json` diretamente. Esta especificação cobre
o ciclo de vida do artefato (criar, sobreviver, divergir, detectar, reparar);
consumir o conteúdo de uma extensão de hook para alterar o comando
efetivamente renderizado em `.claude/settings.json` fica para um incremento
futuro — nenhum cenário de aceite desta especificação exige essa integração,
só a existência e a integridade do artefato.

#### Views e experiência

Não aplicável. A seção 10 registra a ausência de interface.

#### Queries e repositórios

Não aplicável.

#### Jobs e processamento assíncrono

Síncrono, como as fatias anteriores.

#### Estrutura de arquivos

```text
src/extensions/
  registry.ts
  anchor.ts
  create.ts
  diagnose.ts
  repair.ts
  router.ts
src/doctor.ts        (alterado — quarta fonte de relato: divergência de extensão)
src/setup/run.ts      (alterado — candidato do roteador CLAUDE.md/AGENTS.md; entrega das skills empacotadas)
src/cli.ts            (alterado — comandos `extension create` e `extension repair`)
src/skills/deliver.ts (correção pós-`Complete`: entrega real da skill empacotada no projeto-alvo)
resources/skills/common-rules-extension-creator/SKILL.md  (correção pós-`Complete`: movida de `.claude/skills/`/`skills/` soltos na raiz para `resources/`, no mesmo padrão de `resources/hooks/`; fonte real que o `setup` copia, não mais "referência de conteúdo" nunca entregue)
tests/
  extensions-create-*.test.ts
  extensions-new-recusado-hook.test.ts
  extensions-conflito-nome.test.ts
  extensions-doctor-divergencia.test.ts
  extensions-checksum-ausente.test.ts
  extensions-repair-quarentena.test.ts
  extensions-repair-quarentena-nao-gravavel.test.ts
  extensions-router-claude-md.test.ts
  extensions-router-agents-md.test.ts
  extensions-facade-nao-escreve.test.ts
  skills-deliver.test.ts (correção pós-`Complete`)
  setup-delivers-bundled-skill.test.ts (correção pós-`Complete`)
specs/completed/0011-extensoes-locais-reparo-assistido/
  spec.md
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Artefato de extensão | `(target, name)` | `category`, `checksum`, `createdAt` | Pertence ao registro de extensões do projeto |
| Registro de extensões | Caminho no projeto (`.common-rules/extensions.json`) | Lista de artefatos | Um por projeto |
| Entrada de quarentena | `(nome do artefato, timestamp)` | Conteúdo divergente preservado, nunca apagado | Criada pelo comando de reparo |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Artefato de extensão | Ausente | `create` bem-sucedido | Registrado, checksum batendo | Categoria `new` nunca aceita para os sete hooks |
| Artefato de extensão | Registrado, checksum batendo | Edição fora da CLI | Divergente | `doctor` relata, nunca corrige |
| Artefato de extensão | Divergente | Comando de reparo | Registrado, checksum batendo de novo | O conteúdo divergente anterior existe em quarentena |

#### Migração e retenção

Não aplicável — registro novo, sem dado anterior a migrar. Quarentena sem
política de expiração (`D7`); retenção fica com quem usa o projeto.

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não — comandos de terminal e uma skill de fachada conversacional, sem tela.

#### APIs expostas

- `common-rules extension create --category <override|extension|new> --target <hook|CLAUDE.md|AGENTS.md> --name <nome>` (conteúdo via stdin ou `--file`) — cria o artefato, exit `0` em sucesso, `1` em recusa (categoria `new` para hook gerenciado, conflito de nome sem escolha).
- `common-rules extension repair --name <nome>` — repara um artefato divergente nomeado, exit `0` em sucesso, `1` se a quarentena não for gravável.
- `common-rules doctor` (estendido) — passa a relatar cada artefato divergente como uma linha adicional, sem novo comando.

#### APIs externas utilizadas

Nenhuma.

#### Documentação das APIs consultadas

Não aplicável.

#### Eventos e outros contratos

- `.common-rules/extensions.json`: `{ "artifacts": [{ "category": string, "name": string, "target": string, "checksum": string, "createdAt": string }] }`.
- Âncora no arquivo alvo: `<!-- common-rules:<categoria>:<nome>:start -->` ... `<!-- common-rules:<categoria>:<nome>:end -->`, mesmo padrão de comentário HTML que `.project-context/Spec.md` já documenta para o former project tool.

### 11. Estratégia TDD

- **Unidade**: `createExtension`, `diagnoseExtensions`, `repairExtension`, `buildRouterBlock`/`buildAgentsPointer` com ambiente fake (arquivo alvo e registro injetados).
- **Integração**: `runSetup` de ponta a ponta — primeira execução escreve o roteador em `CLAUDE.md`/`AGENTS.md`; segunda execução, sem mudança, não reescreve.
- **Real**: `doctor`/`extension create`/`extension repair` via `dist/cli.js`, num diretório temporário, confirmando o ciclo completo: criar, divergir (editar fora da CLI), `doctor` detectar, reparar, confirmar quarentena e restauração.
- **Runner**: Vitest, pelo script `test:tdd`.
- **Verificação manual**: `node dist/cli.js extension create`/`doctor`/`extension repair` executados de verdade num diretório temporário.

O ponto sensível é a tentação de fazer o `doctor` "corrigir sozinho" uma
divergência pequena. `PR-082`/`NFR-082` existem exatamente para que isso
nunca aconteça — divergência é sempre relatada, nunca corrigida pelo mesmo
comando que a encontrou.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-080, FR-080, AC-130 | AC-130 na seção 6 | tests/extensions-create-sobrevive-setup.test.ts | `Cannot find module ../src/extensions/create` | GREEN | Sem regressão — suíte completa GREEN |
| US-080, FR-081, AC-131 | AC-131 na seção 6 | tests/extensions-new-recusado-hook.test.ts | `Cannot find module ../src/extensions/create` | GREEN | Sem regressão — suíte completa GREEN |
| US-080, FR-082, AC-132 | AC-132 na seção 6 | tests/extensions-conflito-nome.test.ts | `Cannot find module ../src/extensions/create` | GREEN | Sem regressão — suíte completa GREEN |
| US-081, FR-083, AC-133 | AC-133 na seção 6 | tests/extensions-doctor-divergencia.test.ts | `Cannot find module ../src/extensions/diagnose` | GREEN | Sem regressão — suíte completa GREEN |
| US-081, FR-084/085, AC-134 | AC-134 na seção 6 | tests/extensions-repair-quarentena.test.ts | `Cannot find module ../src/extensions/repair` | GREEN (reconfirmado após adicionar `content` a `ExtensionArtifact`) | Sem regressão — suíte completa GREEN |
| US-081, FR-083, AC-135 | AC-135 na seção 6 | tests/extensions-checksum-ausente.test.ts | `Cannot find module ../src/extensions/diagnose` | GREEN | Sem regressão — suíte completa GREEN |
| US-082, FR-086, AC-136 | AC-136 na seção 6 | tests/extensions-router-claude-md.test.ts | `expected false to be true` — CLAUDE.md sem o bloco ancorado | GREEN | Sem regressão — suíte completa GREEN |
| US-082, FR-087, AC-137 | AC-137 na seção 6 | tests/extensions-router-agents-md.test.ts | `expected false to be true` — AGENTS.md sem o ponteiro | GREEN | Sem regressão — suíte completa GREEN |
| US-080, FR-080, AC-138 | AC-138 na seção 6 | tests/extensions-facade-nao-escreve.test.ts | `ENOENT` — skills/common-rules-extension-creator/SKILL.md inexistente | GREEN | Sem regressão — suíte completa GREEN |
| US-081, FR-084, AC-139 | AC-139 na seção 6 | tests/extensions-repair-quarentena-nao-gravavel.test.ts | `Cannot find module ../src/extensions/repair` | GREEN (reconfirmado após adicionar `content` a `ExtensionArtifact`) | Sem regressão — suíte completa GREEN |
| US-080, US-082, FR-088, AC-140 | AC-140 na seção 6 (correção pós-`Complete`) | tests/skills-deliver.test.ts, tests/setup-delivers-bundled-skill.test.ts | `Cannot find module '../src/skills/deliver'` / `'../skills/deliver.js'` (reconfirmado por remoção temporária do arquivo, não assumido) | GREEN | Sem regressão — suíte completa GREEN (145/370) |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-080 | AC-130 | Integração | tests/extensions-create-sobrevive-setup.test.ts | Passed |
| FR-080 | AC-138 | Unidade | tests/extensions-facade-nao-escreve.test.ts | Passed |
| FR-081 | AC-131 | Unidade | tests/extensions-new-recusado-hook.test.ts | Passed |
| FR-082 | AC-132 | Unidade | tests/extensions-conflito-nome.test.ts | Passed |
| FR-083 | AC-133 | Unidade | tests/extensions-doctor-divergencia.test.ts | Passed |
| FR-083 | AC-135 | Unidade | tests/extensions-checksum-ausente.test.ts | Passed |
| FR-084 | AC-134 | Real | tests/extensions-repair-quarentena.test.ts | Passed |
| FR-084 | AC-139 | Unidade | tests/extensions-repair-quarentena-nao-gravavel.test.ts | Passed |
| FR-085 | AC-134 | Real | tests/extensions-repair-quarentena.test.ts | Passed |
| FR-086 | AC-136 | Integração | tests/extensions-router-claude-md.test.ts | Passed |
| FR-087 | AC-137 | Integração | tests/extensions-router-agents-md.test.ts | Passed |
| NFR-080 | AC-133 | Unidade | tests/extensions-doctor-divergencia.test.ts | Passed |
| NFR-081 | AC-134 | Real | tests/extensions-repair-quarentena.test.ts | Passed |
| NFR-081 | AC-139 | Unidade | tests/extensions-repair-quarentena-nao-gravavel.test.ts | Passed |
| NFR-082 | AC-133 | Unidade | tests/extensions-doctor-divergencia.test.ts | Passed |
| NFR-082 | AC-135 | Unidade | tests/extensions-checksum-ausente.test.ts | Passed |
| NFR-083 | AC-138 | Unidade | tests/extensions-facade-nao-escreve.test.ts | Passed |
| FR-088 | AC-140 | Integração | tests/setup-delivers-bundled-skill.test.ts, tests/skills-deliver.test.ts | Passed |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado original**: READY (2026-09-02)
- **Comando**: `node .agents/skills/framework-04-validate/scripts/validate_spec.mjs specs/defined/0011-extensoes-locais-reparo-assistido/spec.md`
- **Cobertura**: 3 US, 8 FR, 4 NFR, 10 AC, 5 DEC; mínimo de 3 AC por ID satisfeito em todos.
- **Origem**: `BACKLOG-0004`, refinado nesta mesma sessão (D6, D7, D8) antes desta especificação — brief já cobria problema, atores, escopo, jornadas e critérios de aceite em Gherkin; nenhuma pergunta nova foi necessária além das três decisões pendentes.
- **Achados**: Nenhum bloqueante.
- **Reaberto em 2026-09-03** (`$framework-update-spec`, correção pós-`Complete`): acrescido `FR-088`/`AC-140`/`DEC-085` — a skill de fachada precisa ser entregue de verdade no projeto-alvo, não só existir no pacote. Ver seção 17.

#### Gate do Ato II — Plano

- **Resultado original**: Passed (2026-09-03)
- **Comando**: `node .agents/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/defined/0011-extensoes-locais-reparo-assistido/spec.md --allow-draft` → `VALID DRAFT` (total=21 complete=18 tdd=10 code=8 checklist_items=126 checklist_complete=108 covered_spec_ids=25 required_spec_ids=25)
- **Achados**: Nenhum bloqueante. T001–T010 observaram RED real antes de T011–T018 os tornarem GREEN (seção 11); T019–T021 (fechamento) ainda pendentes no momento deste gate.
- **Reaberto e reaprovado em 2026-09-03**: acrescidos T022/T023 (Fase 4, correção pós-`Complete`), com `FR-088` recebendo `T007`/`T008`/`T009`/`T022` como predecessores TDD (mínimo de três satisfeito reaproveitando os casos irmãos já `GREEN` de AC-136/137/138, mesmo padrão de cobertura secundária já usado na definição original). `node .agents/skills/framework-05-tasks/scripts/validate_tasks.mjs specs/completed/0011-extensoes-locais-reparo-assistido/spec.md --allow-draft` → `VALID DRAFT` (total=23 complete=23 tdd=11 code=9 checklist_items=138 checklist_complete=138 covered_spec_ids=27 required_spec_ids=27).

#### Gate do Ato III — Entrega

- **Resultado original**: Passed (2026-09-03)
- **Comandos**:
  - `node .agents/skills/framework-06-tdd-bdd/scripts/check_traceability.mjs specs/in-progress/0011-extensoes-locais-reparo-assistido/spec.md .` → 25/25 IDs de SPEC-0011 cobertos em 151 arquivos de teste (os "marcadores órfãos" listados pertencem a outras specs já `completed` — o mesmo script relata a mesma lista de nomes de outras specs como órfã até checando uma spec já `completed`, confirmado comparando com `specs/completed/0001-.../spec.md`; não é gap real desta spec).
  - `node .agents/skills/framework-06-tdd-bdd/scripts/verify_acceptance.mjs specs/in-progress/0011-extensoes-locais-reparo-assistido/spec.md .` → `QA: PASSED`.
  - `npx tsc --noEmit` → exit 0.
  - `npm run build` → exit 0.
  - `npm run verify` (install + build + suíte completa) → 143 arquivos, 366 casos, todos GREEN.
  - Verificação manual real em diretório temporário (`node dist/cli.js`): `extension create` → `doctor` detecta zero divergência → edição fora da CLI dentro da âncora → `doctor` nomeia o artefato divergente e sai com código 1 → `extension repair` → conteúdo original restaurado, divergente preservado em `.common-rules/quarantine/`, `doctor` volta a sair com código 0.
  - `setup` real em projeto novo (sem terminal, aprovação por documento JSON via stdin): `CLAUDE.md` ganha `<!-- common-rules:extension:router:start/end -->`, `AGENTS.md` ganha o ponteiro, convivendo sem conflito com os blocos do próprio former project tool; segunda execução idêntica byte a byte (idempotente, via caminho "já estava configurado").
- **Achados**: Um bug real de correção encontrado só pela verificação manual (T021, `IMPROVE`): `diagnoseExtensions` comparava presença em disco por `target` contra `name` no registro, relatando falso positivo para cada artefato cujo `name` diverge do `target`. Corrigido antes do fechamento deste gate, com regressão própria; suíte completa reconfirmada GREEN depois da correção (143/143 arquivos).
- **Reaberto e refechado em 2026-09-03** (correção pós-`Complete`, `FR-088`/`AC-140`/`DEC-085`/`T022`/`T023`):
  - `npx tsc --noEmit` → exit 0.
  - `npm run build` → exit 0.
  - Suíte completa → 145 arquivos, 370 casos, todos GREEN.
  - `node .agents/skills/framework-06-tdd-bdd/scripts/verify_acceptance.mjs specs/completed/0011-extensoes-locais-reparo-assistido/spec.md .` → `QA: PASSED`.
  - `node .agents/skills/framework-06-tdd-bdd/scripts/check_traceability.mjs specs/completed/0011-extensoes-locais-reparo-assistido/spec.md .` → 27/27 IDs de SPEC-0011 cobertos em 153 arquivos de teste.
  - `node dist/cli.js setup` real, num diretório novo, sem terminal (aprovação por documento JSON): confirmado `.claude/skills/common-rules-extension-creator/SKILL.md` e `.agents/skills/common-rules-extension-creator/SKILL.md` presentes, com o conteúdo empacotado em `resources/skills/`.
  - `.project-context/PACKAGES.md` ficou fora deste ciclo: `package.json` mudou só o campo `files` (`hooks` → `resources`), sem alterar nenhuma dependência — nada para o inventário reconstruir. `monitor_context.mjs` continua sinalizando isso como aberto, sem um `--acknowledge-packages-no-change` equivalente ao que existe para `PROJECT.md`/`RULES.md`; registrado aqui como lacuna de ferramenta de terceiro, não ignorado silenciosamente.

### 14. Tarefas

Formato:
`- [ ] TNNN [P?] [TIPO] [US-NNN?] Ação com caminho — Refs: IDs — Depends: IDs|none`

Checklist obrigatório por tarefa, na ordem:

```markdown
  - [ ] **PREP**: Confirmar escopo, IDs, dependências e baseline.
  - [ ] **EXECUTE**: Produzir a entrega no caminho declarado.
  - [ ] **VERIFY**: Executar a verificação focal adequada.
  - [ ] **VISUAL**: Não aplicável (sem interface) ou conferência de bordas, espaçamentos, margens, padding e tipografia.
  - [ ] **EVIDENCE**: Registrar comando, resultado e IDs nas seções 11–13.
  - [ ] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
```

#### Fase 1 — RED, um caso por cenário da seção 6

- [x] T001 [P] [TEST] [TDD] [US-080] Derivar de AC-130 o caso em tests/extensions-create-sobrevive-setup.test.ts — Refs: US-080, FR-080, FR-081, FR-082, NFR-083, AC-130 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-130.
  - [x] **EXECUTE**: Escrever caso chamando `createExtension()` (ainda inexistente) com categoria `extension`, conferindo que uma segunda leitura do registro reconhece o mesmo checksum.
  - [x] **VERIFY**: RED — `Cannot find module` sobre `src/extensions/create`.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T002 [P] [TEST] [TDD] [US-080] Derivar de AC-131 o caso em tests/extensions-new-recusado-hook.test.ts — Refs: US-080, FR-080, FR-081, FR-082, AC-131 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-131.
  - [x] **EXECUTE**: Escrever caso pedindo categoria `new` para um dos sete hooks gerenciados, conferindo recusa com motivo explicado.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T003 [P] [TEST] [TDD] [US-080] Derivar de AC-132 o caso em tests/extensions-conflito-nome.test.ts — Refs: US-080, FR-080, FR-081, FR-082, AC-132 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-132.
  - [x] **EXECUTE**: Escrever caso criando uma extensão com nome já registrado, conferindo anúncio de conflito e ausência de escolha padrão (nem pular, nem substituir automaticamente).
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T004 [P] [TEST] [TDD] [US-081] Derivar de AC-133 o caso em tests/extensions-doctor-divergencia.test.ts — Refs: US-081, FR-083, FR-085, NFR-080, NFR-082, AC-133 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-133.
  - [x] **EXECUTE**: Escrever caso com um artefato cujo conteúdo real não bate com o checksum registrado, conferindo que `diagnoseExtensions()` (ainda inexistente) nomeia o arquivo, sem escrever nada no disco.
  - [x] **VERIFY**: RED — `Cannot find module` sobre `src/extensions/diagnose`.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T005 [P] [TEST] [TDD] [US-081] Derivar de AC-134 o caso em tests/extensions-repair-quarentena.test.ts — Refs: US-081, FR-083, FR-084, FR-085, NFR-081, NFR-082, AC-134 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-134.
  - [x] **EXECUTE**: Escrever caso real (diretório temporário) criando uma extensão, divergindo-a fora da CLI, rodando o reparo, e conferindo o divergente em `.common-rules/quarantine/` e o original restaurado com checksum batendo de novo.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T006 [P] [TEST] [TDD] [US-081] Derivar de AC-135 o caso em tests/extensions-checksum-ausente.test.ts — Refs: US-081, FR-083, FR-084, NFR-080, NFR-081, NFR-082, AC-135 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-135.
  - [x] **EXECUTE**: Escrever caso com um arquivo presente sem entrada correspondente no registro, conferindo que é tratado como divergente sem lançar exceção.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T007 [P] [TEST] [TDD] [US-082] Derivar de AC-136 o caso em tests/extensions-router-claude-md.test.ts — Refs: US-082, FR-086, FR-087, FR-088, NFR-083, AC-136 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-136.
  - [x] **EXECUTE**: Escrever caso com `setup` rodando num projeto sem seção do `common-rules` em `CLAUDE.md`, conferindo o bloco ancorado com o roteador minimalista e o checksum registrado.
  - [x] **VERIFY**: RED — `Cannot find module` sobre `src/extensions/router`.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T008 [P] [TEST] [TDD] [US-082] Derivar de AC-137 o caso em tests/extensions-router-agents-md.test.ts — Refs: US-082, FR-086, FR-087, FR-088, NFR-083, AC-137 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-137.
  - [x] **EXECUTE**: Escrever caso com `setup` rodando sem o ponteiro em `AGENTS.md`, conferindo o ponteiro mínimo e a ausência de duplicação do conteúdo do roteador.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T009 [P] [TEST] [TDD] [US-080] Derivar de AC-138 o caso em tests/extensions-facade-nao-escreve.test.ts — Refs: US-080, US-082, FR-080, FR-086, FR-087, FR-088, NFR-083, AC-138 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-138 e o conteúdo previsto da skill de fachada.
  - [x] **EXECUTE**: Escrever caso confirmando que a skill de fachada, na sua definição, só emite o comando de CLI e não contém lógica de escrita de arquivo ou registro.
  - [x] **VERIFY**: RED — skill/conteúdo previsto ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

- [x] T010 [P] [TEST] [TDD] [US-081] Derivar de AC-139 o caso em tests/extensions-repair-quarentena-nao-gravavel.test.ts — Refs: US-081, FR-084, FR-085, NFR-080, NFR-081, AC-139 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-139.
  - [x] **EXECUTE**: Escrever caso com um diretório de quarentena não gravável (fonte injetada que lança ao escrever), conferindo que o reparo inteiro é recusado e o divergente permanece exatamente como estava.
  - [x] **VERIFY**: RED — módulo ainda não existe.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.

#### Fase 2 — Código, cada tarefa atrás do seu RED

- [x] T011 [CODE] Implementar em src/extensions/registry.ts — Refs: FR-083, NFR-081, NFR-082, AC-133, AC-135, AC-139 — Depends: T004, T006, T010
  - [x] **PREP**: Confirmar RED de T004, T006 e T010; `docs/` reconstruído por `$framework-documentator` antes da alteração.
  - [x] **EXECUTE**: `ExtensionRegistry`/`ExtensionArtifact` (`category`, `name`, `target`, `checksum`, `createdAt`); `ChecksumEnvironment` injetável; `readExtensionRegistry`/`writeExtensionRegistry`, registro ausente ou corrompido resolve para `{ artifacts: [] }`, nunca lança — mesmo padrão de `src/approval/registry.ts` (`SPEC-0010`).
  - [x] **VERIFY**: `npx tsc --noEmit` em exit 0.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T011", "refs": ["FR-083", "NFR-081", "NFR-082", "AC-133", "AC-135", "AC-139"], "files": ["src/extensions/registry.ts"], "commands": [{"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T012 [CODE] Implementar em src/extensions/anchor.ts — Refs: FR-080, FR-086, FR-087, AC-130, AC-136, AC-137 — Depends: T001, T007, T008
  - [x] **PREP**: Confirmar RED de T001, T007 e T008.
  - [x] **EXECUTE**: `insertAnchor(fileContent, category, name, content)`/`readAnchor(fileContent, category, name)`, comentário HTML `<!-- common-rules:<categoria>:<nome>:start/end -->` (`DEC-080`), sem tocar o conteúdo fora do bloco.
  - [x] **VERIFY**: `npx tsc --noEmit` em exit 0.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T012", "refs": ["FR-080", "FR-086", "FR-087", "AC-130", "AC-136", "AC-137"], "files": ["src/extensions/anchor.ts"], "commands": [{"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T013 [CODE] [US-080] Implementar em src/extensions/create.ts — Refs: US-080, FR-080, FR-081, FR-082, AC-130, AC-131, AC-132, AC-138 — Depends: T001, T002, T003, T009, T011, T012
  - [x] **PREP**: Confirmar RED de T001, T002, T003 e T009.
  - [x] **EXECUTE**: `createExtension(opts)`, recusa `new` para os sete hooks gerenciados (`FR-081`), resolve conflito de nome sem escolha padrão (`FR-082`), grava a âncora via `anchor.ts` e o registro via `registry.ts`.
  - [x] **VERIFY**: Casos de T001, T002, T003 e T009 GREEN.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T013", "refs": ["US-080", "FR-080", "FR-081", "FR-082", "AC-130", "AC-131", "AC-132", "AC-138"], "files": ["src/extensions/create.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T014 [CODE] [US-081] Implementar em src/extensions/diagnose.ts — Refs: US-081, FR-083, NFR-080, NFR-082, AC-133, AC-135 — Depends: T004, T005, T006, T011, T012
  - [x] **PREP**: Confirmar RED de T004, T005 e T006.
  - [x] **EXECUTE**: `diagnoseExtensions(registry, targetEnv)`, função pura de leitura: compara checksum real (via `anchor.ts`) contra o registrado por artefato; artefato presente sem entrada é também divergente (`AC-135`); nunca escreve.
  - [x] **VERIFY**: Casos de T004 e T006 GREEN.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T014", "refs": ["US-081", "FR-083", "NFR-080", "NFR-082", "AC-133", "AC-135"], "files": ["src/extensions/diagnose.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T015 [CODE] [US-081] Implementar em src/extensions/repair.ts — Refs: US-081, FR-084, FR-085, NFR-081, AC-134, AC-139 — Depends: T004, T005, T010, T011, T012, T014
  - [x] **PREP**: Confirmar RED de T004, T005 e T010.
  - [x] **EXECUTE**: `repairExtension(divergent, opts)`, move o conteúdo divergente para `.common-rules/quarantine/<timestamp>-<nome>`, regrava o conteúdo original a partir do registro; recusa o reparo inteiro se a quarentena não for gravável (`AC-139`), nunca apaga (`FR-085`).
  - [x] **VERIFY**: Casos de T005 e T010 GREEN.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T015", "refs": ["US-081", "FR-084", "FR-085", "NFR-081", "AC-134", "AC-139"], "files": ["src/extensions/repair.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T016 [CODE] [US-082] Implementar em src/extensions/router.ts — Refs: US-082, FR-086, FR-087, NFR-083, AC-136, AC-137 — Depends: T007, T008, T009, T013
  - [x] **PREP**: Confirmar RED de T007, T008 e T009.
  - [x] **EXECUTE**: `buildRouterBlock()`/`buildAgentsPointer()`, funções puras que produzem o texto do roteador minimalista e do ponteiro; consumidas via `createExtension` com `category: "extension"` e `target: "CLAUDE.md"`/`"AGENTS.md"`.
  - [x] **VERIFY**: Casos de T007 e T008 GREEN.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T016", "refs": ["US-082", "FR-086", "FR-087", "NFR-083", "AC-136", "AC-137"], "files": ["src/extensions/router.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T017 [CODE] [US-081] Estender src/doctor.ts com a quarta fonte de relato — Refs: US-081, FR-083, FR-085, NFR-080, NFR-082, AC-133, AC-135 — Depends: T004, T005, T006, T014
  - [x] **PREP**: Confirmar RED de T004 e T006.
  - [x] **EXECUTE**: `inspectDependencies` passa a incluir, via `diagnoseExtensions`, cada artefato divergente no relato; exit code do `doctor` reflete a divergência (`DEC-084`), sem alterar nada no disco.
  - [x] **VERIFY**: Casos de T004 e T006 GREEN.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T017", "refs": ["US-081", "FR-083", "FR-085", "NFR-080", "NFR-082", "AC-133", "AC-135"], "files": ["src/doctor.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}]} -->

- [x] T018 [CODE] [US-080] [US-081] [US-082] Ligar os comandos em src/cli.ts e o candidato do roteador em src/setup/run.ts — Refs: US-080, US-081, US-082, FR-080, FR-084, FR-086, FR-087, AC-130, AC-134, AC-136, AC-137 — Depends: T001, T005, T007, T008, T009, T013, T015, T016, T017
  - [x] **PREP**: Confirmar RED de T001, T005, T007, T008 e T009.
  - [x] **EXECUTE**: `common-rules extension create`/`common-rules extension repair` em `src/cli.ts`; `src/setup/run.ts` monta o candidato do roteador (`CLAUDE.md`/`AGENTS.md` ausentes) e chama `createExtension` para ele na mesma aprovação de plano já existente (`SPEC-0007`), fora do registro de aprovação em lote de dependência (`SPEC-0010`) — não é comando de terceiro.
  - [x] **VERIFY**: Casos de T001, T005, T007 e T008 GREEN, com `dist/cli.js` real.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T018", "refs": ["US-080", "US-081", "US-082", "FR-080", "FR-084", "FR-086", "FR-087", "AC-130", "AC-134", "AC-136", "AC-137"], "files": ["src/cli.ts", "src/setup/run.ts"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

#### Fase 3 — Fechamento

- [x] T019 [DOC] Registrar os módulos de extensão em .project-context/STACK.md — Refs: FR-080, FR-086 — Depends: T018
  - [x] **PREP**: Ler a seção de aprovação em lote (fatia 1i) em `.project-context/STACK.md`.
  - [x] **EXECUTE**: Descrever `src/extensions/registry.ts`, `anchor.ts`, `create.ts`, `diagnose.ts`, `repair.ts`, `router.ts`, os dois comandos novos de CLI, e a extensão do `doctor`.
  - [x] **VERIFY**: `npm run build` em exit 0.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comando e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T019", "refs": ["FR-080", "FR-086"], "files": [".project-context/STACK.md"], "commands": [{"run": "npm run build", "exit": 0}]} -->

- [x] T020 [DOC] Descrever em PROJECT.md o sistema de extensões e o comando de reparo — Refs: US-080, US-081, US-082 — Depends: T018
  - [x] **PREP**: Ler a tabela de comandos e a seção "O que ainda não existe" em `PROJECT.md`.
  - [x] **EXECUTE**: Acrescentar `common-rules extension create`/`extension repair` à tabela, descrever o sistema de extensões locais, e remover/atualizar qualquer menção que o listava como não implementado.
  - [x] **VERIFY**: `npm run build` em exit 0.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comando e resultado registrados na seção 12.
  - [x] **IMPROVE**: Registrar melhoria aplicada ou ausência justificada.
  <!-- framework:evidence {"task": "T020", "refs": ["US-080", "US-081", "US-082"], "files": ["PROJECT.md"], "commands": [{"run": "npm run build", "exit": 0}]} -->

- [x] T021 [OPS] Verificação manual real e fechar o Delivery Gate na seção 13 de specs/defined/0011-extensoes-locais-reparo-assistido/spec.md — Refs: NFR-080, NFR-081, NFR-082, NFR-083 — Depends: T019, T020
  - [x] **PREP**: T011–T020 concluídas, cada `[CODE]` com seu comentário de evidência.
  - [x] **EXECUTE**: `node dist/cli.js extension create`/`doctor`/`extension repair` executados de verdade num diretório temporário — ciclo completo: criar, divergir fora da CLI, `doctor` detectar, reparar, confirmar quarentena e restauração; `setup` real num projeto novo confirmando `CLAUDE.md`/`AGENTS.md` com a seção do `common-rules`; suíte completa e `npm run verify`; `check_traceability.mjs` e `verify_acceptance.mjs`.
  - [x] **VERIFY**: O ciclo real se comporta como descrito; suíte inteira, `tsc`, `build` e `verify` em exit 0 a partir de clone limpo.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comandos, contagens e exit codes registrados na seção 13.
  - [x] **IMPROVE**: `diagnoseExtensions` comparava presença em disco (por `target`) contra `name` no registro — cada artefato íntegro cujo `name` difere do `target` (o caso comum) aparecia como falso órfão. Achado só pela verificação real deste `T021` (nenhum teste unitário pré-existente exercitava `name !== target`); corrigido em `src/extensions/diagnose.ts`, com `renderReport` (`src/cli.ts`) estendido para nomear a extensão divergente no texto real do `doctor`, e regressão em `tests/extensions-diagnose-nome-diferente-do-alvo.test.ts` e `tests/doctor-cli-nomeia-extensao-divergente.test.ts`.

#### Fase 4 — Correção pós-`Complete` (FR-088, AC-140, DEC-085)

- [x] T022 [TEST] [TDD] [US-080] [US-082] Derivar de AC-140 os casos em tests/skills-deliver.test.ts e tests/setup-delivers-bundled-skill.test.ts — Refs: US-080, US-082, FR-088, NFR-083, AC-140 — Depends: none
  - [x] **PREP**: Ler o Gherkin de AC-140. Diferente da Fase 1, o código já existia quando os testes foram escritos (a pessoa responsável apontou o defeito depois de `Complete`, e a correção foi feita antes da formalização do caso) — RED reconfirmado explicitamente por remoção temporária de `src/skills/deliver.ts`, não assumido por construção.
  - [x] **EXECUTE**: Casos de unidade para `readBundledSkill`/`deliverBundledSkill` e um caso de integração rodando `runSetup` de ponta a ponta, conferindo `.claude/skills/common-rules-extension-creator/SKILL.md` e `.agents/skills/common-rules-extension-creator/SKILL.md`.
  - [x] **VERIFY**: RED confirmado — `Cannot find module '../src/skills/deliver'` / `'../skills/deliver.js'`, ao mover `src/skills/deliver.ts` para fora do projeto e rodar os dois arquivos.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comando e causa do RED registrados na seção 12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional — o próprio ciclo já é a melhoria sobre a Fase 1–3.

- [x] T023 [CODE] Implementar src/skills/deliver.ts e ligar deliverLocalSkills em src/setup/run.ts — Refs: FR-088, AC-140 — Depends: T007, T008, T009, T022
  - [x] **PREP**: Confirmar RED de T022.
  - [x] **EXECUTE**: `readBundledSkill`/`deliverBundledSkill`/`realSkillWriteEnvironment` em `src/skills/deliver.ts`, lendo de `resources/skills/<nome>/`; `deliverLocalSkills(raiz)` em `src/setup/run.ts`, chamado nos dois pontos onde `ensureRouterCandidates` já era chamado (caminho "já configurado" e escrita plena) — mesma idempotência por sobrescrita de conteúdo igual, mesmo padrão do roteador. `hooks/` e `skills/` movidos para `resources/hooks/`/`resources/skills/` (`DEC-085`); `hooksDir()` e o campo `files` de `package.json` atualizados.
  - [x] **VERIFY**: Casos de T022 GREEN; `npx tsc --noEmit` e `npm run build` em exit 0; suíte completa (145 arquivos, 370 casos) GREEN; `node dist/cli.js setup` real num diretório temporário confirmando os dois caminhos entregues.
  - [x] **VISUAL**: Não aplicável — sem interface, comando de terminal.
  - [x] **EVIDENCE**: Comandos e resultado registrados na seção 12.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da própria correção.
  <!-- framework:evidence {"task": "T023", "refs": ["FR-088", "AC-140"], "files": ["src/skills/deliver.ts", "src/setup/run.ts", "resources/hooks", "resources/skills/common-rules-extension-creator/SKILL.md", "package.json"], "commands": [{"run": "npm run test:tdd", "exit": 0}, {"run": "npx tsc --noEmit", "exit": 0}, {"run": "npm run build", "exit": 0}]} -->

### 15. Ordem de execução

A Fase 1 inteira em paralelo: dez arquivos distintos, sem dependência entre si.

A Fase 2 segue a dependência entre módulos: `T011` (`registry.ts`) e `T012`
(`anchor.ts`) não dependem de código, só das fontes que cada um resolve.
`T013` (`create.ts`) consome os dois. `T014` (`diagnose.ts`) e `T016`
(`router.ts`) consomem `registry.ts`/`anchor.ts` e, no caso do roteador,
`create.ts`. `T015` (`repair.ts`) consome `diagnose.ts`. `T017` (`doctor.ts`)
consome `diagnose.ts`. `T018` (`cli.ts`/`run.ts`) consome tudo — é quem de
fato expõe os comandos reais e liga o candidato do roteador ao `setup`.

Caminho crítico: `T001 → T013 → T016 → T018 → T021`. Cinco das vinte e uma
tarefas, passando por `T016` porque o roteador depende da criação de
extensão já existir antes de poder usá-la para escrever em `CLAUDE.md`.

O fechamento admite paralelismo entre `T019` e `T020`, que tocam arquivos
diferentes, mas ambos precisam de `T018` concluída para descrever a
superfície real.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- Phase 1 concluída por completo (`SPEC-0001` a `SPEC-0010`) — dependência do próprio backlog, satisfeita em 2026-09-02.
- `src/setup/run.ts`, `src/approval/registry.ts` (`SPEC-0010`) — o candidato do roteador e o padrão de registro reaproveitam esses módulos sem alterá-los na sua própria responsabilidade.

#### Riscos

- **Formato de âncora mal escolhido contamina cada artefato gerado** → mitigado por `D6`: reaproveita um formato já comprovado neste repositório, não um novo.
- **Quarentena sem expiração acumula lixo indefinidamente** → aceito deliberadamente por `D7`; risco conhecido, não solução especulativa.
- **`doctor` crescer para uma quarta camada pode confundir o exit code existente** → mitigado registrando divergência de extensão como responsabilidade própria do `common-rules` (não uma camada de dependência de terceiro como `agent`), e explicitamente coberta pelo exit code, com texto que nomeia a fonte.

#### Suposições

- Ninguém edita `.common-rules/extensions.json` à mão em uso normal — se acontecer, o comportamento é o mesmo de um registro corrompido: tratado como vazio, nunca reconstruído por inferência.
- O roteador minimalista em `CLAUDE.md` cabe em poucas linhas — o objetivo explícito do ADR original (economizar contexto) só se sustenta se o próprio roteador for pequeno.

### 17. Decisões

- **DEC-080**: A âncora de injeção é comentário HTML, no mesmo padrão do former project tool. *Razão*: `D6` do backlog — consistência com um mecanismo que já funciona neste repositório. *Alternativas descartadas*: formato próprio (YAML frontmatter, separador de texto) — descartado por inventar um segundo mecanismo para o mesmo problema sem motivo; arquivo separado sem âncora textual — descartado por perder a localização visual do conteúdo customizado dentro do arquivo alvo.
- **DEC-081**: A quarentena vive em `.common-rules/quarantine/`, sem expiração automática. *Razão*: `D7` — consistente com onde o registro de instalação e o de aprovação já vivem; expirar implicaria apagar, contradizendo a regra de "quarentena em vez de exclusão, sempre".
- **DEC-082**: A fatia C (roteador em `CLAUDE.md`/`AGENTS.md`) entra nesta especificação, junto com A e B. *Razão*: `D8` — o gatilho nomeado (fatia 1d) já foi satisfeito, e a Phase 1 fechou por completo.
- **DEC-083**: O sistema de extensões cobre só os sete hooks, o registro do `setup` e o próprio bloco de `CLAUDE.md`/`AGENTS.md` que esta fatia acrescenta — nunca artefato de dependência de terceiro. *Razão*: `D4` — estender skills do former project tool violaria a imutabilidade do upstream e criaria um fork do motor de skills.
- **DEC-084**: `doctor` relata divergência de extensão como responsabilidade própria do `common-rules`, não como quarta camada de dependência — o exit code do `doctor` reflete essa divergência diretamente, diferente da camada `agent` (fatia 1d), que é puramente informativa. *Razão*: uma extensão divergente é sobre o que o próprio `common-rules` escreveu, não sobre o que uma dependência de terceiro expõe; tratá-la como informativa esconderia um problema que é literalmente do escopo desta ferramenta.
- **DEC-085** (correção pós-`Complete`, 2026-09-03): Cada artefato de origem que o `setup` lê e leva para o projeto-alvo — hooks e skills locais empacotadas — vive sob um único diretório `resources/` na raiz do pacote (`resources/hooks/`, `resources/skills/<nome>/`), no lugar de diretórios soltos (`hooks/`, `skills/`). A skill `common-rules-extension-creator` é entregue de verdade em `.claude/skills/` e `.agents/skills/` do projeto-alvo por `src/skills/deliver.ts`, chamado por `runSetup` no mesmo ponto onde o roteador já era garantido. *Razão*: a pessoa responsável revisou o resultado real da entrega e encontrou a skill parada na raiz do projeto sem nenhum código a instalando — `AC-138`/`FR-080` originais provaram que a fachada nunca escreve arquivo, mas nenhum requisito cobria que ela precisa *chegar* ao projeto-alvo para existir de fato; a seção 8 original já antecipava a entrega ("fora deste repositório em consumidores") sem nunca implementá-la. *Achado*: `.claude/skills/`/`.agents/skills/` são ambos populados pelo instalador real de terceiro (`npx skills add`) para o alvo `claude-code` — confirmado inspecionando este próprio repositório após uma execução real — então a entrega da skill local espelha o mesmo par de diretórios, em vez de escolher um e adivinhar errado o outro.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação registrada na seção 12.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] `npx tsc --noEmit`, `npm run build` e a suíte completa passam.
- [x] Nenhuma escrita de extensão ocorre fora do caminho único da CLI, conferido por inspeção do código e pela suíte real.
- [x] `node dist/cli.js extension create`/`doctor`/`extension repair`, executados de verdade num diretório temporário, completam o ciclo: criar, divergir, detectar, reparar, sem apagar nada.
- [x] `CLAUDE.md` e `AGENTS.md`, gerados por um `setup` real num projeto novo, contêm a seção/ponteiro do `common-rules`.
- [x] `.project-context/STACK.md` registra os módulos novos de `src/extensions/`.
- [x] `PROJECT.md` descreve o sistema de extensões locais e o comando de reparo.
- [x] (correção pós-`Complete`) `.claude/skills/common-rules-extension-creator/SKILL.md` e `.agents/skills/common-rules-extension-creator/SKILL.md`, gerados por um `setup` real num projeto novo, existem de fato — não só a referência de conteúdo no pacote.
