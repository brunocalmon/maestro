# Especificação integrada: Normalização AGENTS.md ↔ CLAUDE.md e projeção de skills de .agents para .claude

| Campo | Valor |
| --- | --- |
| Formato | Specsfy/2.0 |
| ID | SPEC-0024 |
| Slug | 0024-normalizacao-agents-claude-e-projecao-de-skills |
| Status | Complete |
| Effort | 6 |
| Effort updated at | 2026-09-17 |
| Effort rationale | Perfil `standard` alto: migração de artefatos registrados entre arquivos (com checksum e quarentena), interceptação de conteúdo de terceiro, mudança do destino de instalação das skills e projeção com registro, mais dois hooks de cópia aditiva; sem framework, banco ou interface; risco concentrado em consumidores já instalados. |
| ClickUp Task | |
| Milestones | |
| Definition Gate | Passed |
| Plan Gate | Passed |
| Delivery Gate | Passed |
| Evidence Contract | 1 |
| Interface para pessoas | Não |
| Atualizada em | 2026-09-17 |

## Ato I — Definir

### 1. Problema e resultado

#### Problema

Três ferramentas escrevem instruções em direções diferentes no mesmo projeto: o Specsfy coloca o conteúdo em `AGENTS.md` e uma linha `@.specsfy/Spec.md` em `CLAUDE.md`; o maestro faz o inverso (`router`, `config-language-rule` e `hooks-fallback` em `CLAUDE.md`, ponteiros em prosa em `AGENTS.md`); a skill `setup-matt-pocock-skills` escreve `## Agent skills` só em `CLAUDE.md` quando ele existe. Resultado: `AGENTS.md`, o arquivo genérico que outras IDEs leem, fica incompleto, e `CLAUDE.md` acumula conteúdo duplicado por ferramenta. Além disso, os especialistas do Specsfy são instalados com `--agent universal` em `.agents/skills`, pasta que o Claude Code 2.1.273 não lê (FIND-EXT-002): ficam invisíveis na sessão, inclusive em sessão nova; o maestro instala o matt-pocock em `.claude/skills` e só sincroniza `.claude → .agents`, nunca o inverso.

#### Resultado desejado

Uma única direção: o conteúdo inteiro do maestro vive em `AGENTS.md`; `CLAUDE.md` recebe uma única linha `@AGENTS.md` (import nativo do Claude Code). Projetos já instalados migram sozinhos quando o checksum bate; divergência vai para quarentena. O bloco `## Agent skills` do matt-pocock é movido para `AGENTS.md` quando ficou em `CLAUDE.md` e passa a ser rastreado como conteúdo de terceiro (nunca reescrito pelo maestro); blocos `specsfy:*` nunca são tocados; conteúdo humano desconhecido não é movido. `.agents/skills` vira a única fonte canônica de skills (matt-pocock passa a `-a universal`), e o maestro projeta `.agents → .claude` no `setup` (com registro por checksum, sem sobrescrever cópia editada à mão) e por hooks de cópia aditiva no início da sessão e após `skills add`/`specsfy skills`.

#### Métricas de sucesso

- Após `maestro setup` num projeto novo, `AGENTS.md` contém os blocos completos do maestro e `CLAUDE.md` contém `@AGENTS.md` exatamente uma vez — verificável por teste.
- Um projeto instalado com a direção antiga e checksums íntegros migra num único `setup`, sem duplicar conteúdo e sem tocar em blocos `specsfy:*` — verificável por teste com fixture do formato antigo.
- Uma skill presente só em `.agents/skills` aparece em `.claude/skills` após o `setup`, após o hook de sessão e após um `skills add` na mesma sessão — verificável por teste de subprocesso dos scripts.
- Zero cópia editada à mão sobrescrita: uma skill alterada em `.claude/skills` permanece e é reportada — verificável por teste.

### 2. Research e esclarecimentos

#### Researchs executados

- **R-001** [critical] Só o maestro está invertido: Specsfy escreve conteúdo em AGENTS.md e um import em CLAUDE.md; matt-pocock escreve só em CLAUDE.md quando ele existe — Verdict: verified — Confidence: high — Evidence: research/direcao-dos-blocos-e-diretorios-de-skills.md#blocos-por-ferramenta — Budget: 1/3
  - Tabela levantada dos arquivos deste repositório, de `router.ts`, dos adaptadores e da skill instalada.
- **R-002** [critical] No CLI skills, `-a universal` escreve em `.agents/skills` e `-a claude-code` em `.claude/skills`, com o mesmo conteúdo sob `--copy` — Verdict: verified — Confidence: high — Evidence: research/direcao-dos-blocos-e-diretorios-de-skills.md#diretorios-por-agente-no-cli-skills — Budget: 1/3
  - Lido em `node_modules/skills/dist/cli.mjs` (definições `universal` e `claude-code`).
- **R-003** [high] `createExtension` recusa nome já registrado, portanto a migração precisa mover artefatos no registro, não recriá-los — Verdict: verified — Confidence: high — Evidence: research/direcao-dos-blocos-e-diretorios-de-skills.md#conclusao — Budget: 1/3
  - `src/extensions/create.ts` (conflito de nome) e DEC-002 da SPEC-0012.

#### Fontes e contexto consultados

- `src/extensions/router.ts`, `src/extensions/create.ts`, `src/extensions/anchor.ts`, `src/extensions/registry.ts`, `src/extensions/repair.ts`, `src/extensions/diagnose.ts` — blocos, registro, quarentena.
- `src/targets/claude-code.ts`, `src/targets/antigravity.ts` — quem instala cada bloco e onde.
- `src/skills/install.ts` (`TARGET_AGENT`, `buildSkillsAddArgs`), `src/skills/inventory.ts` (`SKILLS_DIR`), `src/setup/run.ts` (`syncSkillsToTargetDirs`, `deliverLocalSkills`), `src/setup/record.ts`.
- `.claude/skills/setup-matt-pocock-skills/SKILL.md` — regra de escolha do arquivo e formato do bloco `## Agent skills`.
- `specs/backlog/0012-normalizacao-agents-md-claude-md-e-projecao-de-skills-agents-para-claude.md` — brief promovido; `specs/inbox/2026-09-17-105213-…` — captura de origem.
- `findings/external/FIND-EXT-002-claude-code-nao-le-agents-skills.md`, `findings/internal/FIND-INT-003-setup-completo-e-direcao-dos-blocos.md`.
- SPEC-0022 (identidade e quarentena de scripts), SPEC-0023 (hooks resistentes, bloco `hooks-fallback`).
- Decisões do usuário em 2026-09-17 (grill Q10–Q14, Q17, Q23–Q25).

#### Documentação consultada

- CLI `skills` 1.5.23 (bundle local): tabela de agentes e diretórios.

#### Artefatos de pesquisa armazenados

- `specs/completed/0024-normalizacao-agents-claude-e-projecao-de-skills/research/direcao-dos-blocos-e-diretorios-de-skills.md`: direção por ferramenta, diretórios por agente do CLI `skills` e conclusões (R-001 a R-003).

#### Dúvidas respondidas

- **Q**: Qual a forma da referência em `CLAUDE.md`? → **A**: uma única linha `@AGENTS.md`, num bloco anchorado próprio (`agents-import`), sem ponteiros por bloco (Q10).
- **Q**: Migrar projetos já instalados? → **A**: sim, automaticamente quando o checksum registrado bate; divergência vai para quarentena (Q11).
- **Q**: Como interceptar o matt-pocock? → **A**: router instrui o agente; `setup` move `## Agent skills` de `CLAUDE.md` para `AGENTS.md` e registra como *foreign* (Q12, Q14).
- **Q**: O que pode ser movido? → **A**: só assinaturas conhecidas de uma tabela; `specsfy:*` nunca; o resto o doctor reporta (Q13).
- **Q**: Fonte canônica de skills? → **A**: `.agents/skills`; matt-pocock com `-a universal`; projeção sempre `.agents → .claude` (Q17, Q23).
- **Q**: Quando projetar? → **A**: `setup` (projeção completa com registro) + hooks `SessionStart` e `PostToolUse` após `skills add`/`specsfy skills` (cópia aditiva) (Q24).
- **Q**: Cópia editada à mão? → **A**: nunca sobrescrita; reportada (Q25).

#### Dúvidas abertas

- Nenhuma.

### 3. Escopo e atores

#### Incluído

- Blocos do maestro (`router`, `config-language-rule`, `hooks-fallback`) instalados em `AGENTS.md` para todos os targets; `CLAUDE.md` com o bloco `agents-import` contendo `@AGENTS.md`.
- Migração de projetos com a direção antiga: mover artefatos íntegros de `CLAUDE.md` para `AGENTS.md`, remover ponteiros obsoletos (`agents-pointer`, `config-language-pointer`, `hooks-fallback-pointer`) e renomear os artefatos `agents-*` do Antigravity para os nomes compartilhados; divergência → quarentena.
- Tabela de assinaturas de terceiros (inicial: `## Agent skills`, origem `mattpocock/skills`) e movimentação de `CLAUDE.md` para `AGENTS.md` com registro *foreign*.
- Instrução no router para skills que editam `CLAUDE.md`.
- `TARGET_AGENT = "universal"` para o instalador de skills; `inspectSkills` e o registro passam a olhar `.agents/skills`.
- Projeção `.agents/skills → .claude/skills` no `setup`, com `projections` em `install.json` (nome, checksum) e proteção de cópia editada.
- Hooks `skills-project-session` (`session-start`) e `skills-project` (`after-tool` nas ferramentas de shell, disparando só quando o comando contém `skills add` ou `specsfy skills`): cópia aditiva em shell, nunca sobrescrevendo.
- Remoção do `syncSkillsToTargetDirs` (`.claude → .agents`).

#### Fora de escopo

- Doctor (BACKLOG-0013): esta spec define o que ele confere (conteúdo não padronizado em `CLAUDE.md`, projeções divergentes).
- Alterar a skill `setup-matt-pocock-skills` ou o Specsfy upstream.
- Ler `.agents/skills` no Claude Code (FIND-EXT-002, fora do controle).
- Projeção para targets que já leem `.agents/skills` (Antigravity): não copiar.

#### Atores

- **Pessoa que mantém o projeto**: usa Claude Code e outras IDEs; quer um `AGENTS.md` completo e um `CLAUDE.md` mínimo.
- **Agente no Claude Code**: lê `CLAUDE.md` (que importa `AGENTS.md`) e usa skills de `.claude/skills`.
- **Skills de terceiros** (`setup-matt-pocock-skills`, `specsfy-setup`): escrevem instruções e instalam especialistas durante a conversa.
- **`maestro setup`**: instala, migra, projeta e registra.

### 4. Princípios e restrições do projeto

- **PR-001**: O maestro nunca edita dentro de blocos delimitados de outras ferramentas (`specsfy:*`) e nunca move conteúdo sem assinatura conhecida.
- **PR-002**: Conteúdo de terceiro movido é rastreado como *foreign*: checksum para detectar mudança, nunca reescrita nem reparo pelo maestro.
- **PR-003**: Migração só com checksum íntegro; divergência vai para `.maestro/quarantine/` pelo mecanismo existente (SPEC-0011).
- **PR-004**: `.agents/skills` é a fonte canônica; `.claude/skills` é projeção por target. Uma projeção nunca sobrescreve conteúdo que difere do registrado.
- **PR-005**: Hooks de projeção são cópia aditiva em shell puro, sem `maestro` no `PATH` e sem saída em stdout.
- **PR-006**: O maestro instala somente no projeto atual.

### 5. Histórias de usuário

#### US-001 — Uma direção para as instruções do maestro (P1)

Como pessoa que mantém o projeto, quero o conteúdo do maestro em `AGENTS.md` e apenas `@AGENTS.md` em `CLAUDE.md`, para que qualquer IDE veja as instruções completas e o Claude Code não acumule duplicatas.

**Por que P1**: inconsistência estrutural com o Specsfy e com IDEs genéricas (FIND-INT-003).
**Teste independente**: `runSetup` em raiz nova e em fixture da direção antiga; inspecionar os dois arquivos e o registro.
**Requisitos**: FR-001, FR-002

#### US-002 — Bloco do matt-pocock normalizado sem virar do maestro (P2)

Como pessoa que mantém o projeto, quero que o `## Agent skills` escrito em `CLAUDE.md` seja movido para `AGENTS.md` e continue pertencendo ao matt-pocock, para que a normalização não dependa de mudar a skill upstream nem de o maestro reivindicar o texto.

**Por que P2**: depende de a skill ter sido executada; o dano é duplicação, não perda.
**Teste independente**: fixture com `## Agent skills` em `CLAUDE.md`; após `runSetup`, bloco em `AGENTS.md`, registro *foreign*, `CLAUDE.md` sem o bloco.
**Requisitos**: FR-003, FR-004

#### US-003 — Skills visíveis no Claude Code a partir de `.agents/skills` (P1)

Como pessoa que instala especialistas do Specsfy durante a conversa, quero que eles apareçam em `.claude/skills` sem passo manual e sem perder edições locais, para que o Claude Code os enxergue na mesma sessão.

**Por que P1**: especialistas invisíveis hoje (FIND-EXT-002), inclusive em sessão nova.
**Teste independente**: skill só em `.agents/skills` → após `runSetup`/hooks, presente em `.claude/skills`; edição local preservada.
**Requisitos**: FR-005, FR-006, FR-007

### 6. Cenários BDD de aceite

#### AC-001 — Projeto novo recebe conteúdo em AGENTS.md e `@AGENTS.md` em CLAUDE.md

**Cobre**: US-001, FR-001, NFR-001, NFR-003

```gherkin
@US-001 @FR-001 @NFR-001 @NFR-003 @AC-001
Feature: Direção única das instruções

  Scenario: primeiro setup
    Given uma raiz temporária sem AGENTS.md nem CLAUDE.md
    When maestro setup roda com target claude-code
    Then AGENTS.md contém os blocos anchorados router, config-language-rule e hooks-fallback com conteúdo completo
    And CLAUDE.md contém o bloco anchorado agents-import cujo conteúdo é exatamente "@AGENTS.md"
    And CLAUDE.md não contém o texto do router
```

#### AC-002 — Segundo setup não duplica nem altera

**Cobre**: US-001, FR-001, NFR-001

```gherkin
@US-001 @FR-001 @NFR-001 @AC-002
Feature: Idempotência

  Scenario: dois setups
    Given uma raiz onde maestro setup já rodou
    When maestro setup roda de novo
    Then AGENTS.md e CLAUDE.md são byte a byte idênticos ao estado anterior
    And "@AGENTS.md" aparece uma única vez em CLAUDE.md
```

#### AC-003 — Antigravity usa os mesmos nomes de bloco em AGENTS.md

**Cobre**: US-001, FR-001, NFR-003

```gherkin
@US-001 @FR-001 @NFR-003 @AC-003
Feature: Nomes compartilhados

  Scenario: target antigravity
    Given uma raiz temporária
    When maestro setup roda com target antigravity
    Then AGENTS.md contém os blocos router, config-language-rule e hooks-fallback com os mesmos nomes do target claude-code
    And nenhum CLAUDE.md é criado
```

#### AC-004 — Migração de blocos íntegros da direção antiga

**Cobre**: US-001, FR-002, NFR-001, NFR-002

```gherkin
@US-001 @FR-002 @NFR-001 @NFR-002 @AC-004
Feature: Migração automática

  Scenario: checksums íntegros
    Given uma raiz com CLAUDE.md contendo os blocos router e config-language-rule e AGENTS.md com os ponteiros, todos registrados com checksum íntegro
    When maestro setup roda
    Then os blocos passam a existir em AGENTS.md com o mesmo conteúdo e deixam de existir em CLAUDE.md
    And os ponteiros agents-pointer e config-language-pointer deixam de existir em AGENTS.md e no registro
    And CLAUDE.md recebe o bloco agents-import
    And o registro aponta target AGENTS.md para cada bloco migrado, sem artefato duplicado
```

#### AC-005 — Bloco divergente vai para quarentena, não migra às cegas

**Cobre**: US-001, FR-002, NFR-002

```gherkin
@US-001 @FR-002 @NFR-002 @AC-005
Feature: Divergência

  Scenario: router editado à mão em CLAUDE.md
    Given uma raiz na direção antiga cujo bloco router em CLAUDE.md foi alterado à mão
    When maestro setup roda
    Then o conteúdo alterado é copiado para .maestro/quarantine/
    And AGENTS.md recebe o router com o conteúdo registrado
    And o relatório informa a quarentena
```

#### AC-006 — Blocos do Specsfy e conteúdo humano intocados

**Cobre**: US-001, FR-002, NFR-002

```gherkin
@US-001 @FR-002 @NFR-002 @AC-006
Feature: Preservação

  Scenario: migração com conteúdo alheio
    Given uma raiz na direção antiga cujo CLAUDE.md tem um bloco specsfy:framework e um parágrafo humano sem assinatura, e cujo AGENTS.md tem um bloco specsfy:framework
    When maestro setup roda
    Then os blocos specsfy:framework dos dois arquivos permanecem byte a byte iguais
    And o parágrafo humano permanece em CLAUDE.md
```

#### AC-007 — Renomeação dos artefatos agents-* do Antigravity

**Cobre**: US-001, FR-002, NFR-001

```gherkin
@US-001 @FR-002 @NFR-001 @AC-007
Feature: Unificação de nomes

  Scenario: projeto Antigravity já instalado
    Given uma raiz com artefatos agents-router, agents-config-language-rule e agents-hooks-fallback registrados em AGENTS.md
    When maestro setup roda com target antigravity
    Then o registro passa a ter router, config-language-rule e hooks-fallback com os mesmos conteúdos
    And AGENTS.md contém cada bloco uma única vez
```

#### AC-008 — `## Agent skills` movido de CLAUDE.md para AGENTS.md

**Cobre**: US-002, FR-003, FR-004, NFR-002

```gherkin
@US-002 @FR-003 @FR-004 @NFR-002 @AC-008
Feature: Interceptação do matt-pocock

  Scenario: bloco escrito pela skill em CLAUDE.md
    Given uma raiz com CLAUDE.md contendo a seção "## Agent skills" e subseções até o próximo título de nível 2
    When maestro setup roda
    Then a seção passa a existir em AGENTS.md com o mesmo texto
    And deixa de existir em CLAUDE.md
    And o registro tem um artefato de categoria foreign com origin "mattpocock/skills" e o checksum do texto
```

#### AC-009 — Conteúdo foreign nunca é reescrito pelo maestro

**Cobre**: US-002, FR-004, NFR-002

```gherkin
@US-002 @FR-004 @NFR-002 @AC-009
Feature: Posse do conteúdo movido

  Scenario: skill atualiza o bloco em AGENTS.md
    Given o bloco Agent skills já movido e registrado como foreign
    And o texto foi alterado em AGENTS.md depois do registro
    When maestro setup roda
    Then o texto alterado permanece em AGENTS.md
    And o relatório informa que o conteúdo foreign mudou desde o registro
    And nada vai para quarentena
```

#### AC-010 — Só assinaturas conhecidas são movidas; duplicata idêntica é resolvida

**Cobre**: US-002, FR-003, FR-004, NFR-002

```gherkin
@US-002 @FR-003 @FR-004 @NFR-002 @AC-010
Feature: Fronteira do que pode ser movido

  Scenario: seção desconhecida e seção duplicada
    Given uma raiz com CLAUDE.md contendo "## Minhas notas" e uma seção "## Agent skills" idêntica à que já existe em AGENTS.md
    When maestro setup roda
    Then "## Minhas notas" permanece em CLAUDE.md
    And "## Agent skills" é removida de CLAUDE.md sem duplicar em AGENTS.md
    And uma seção "## Agent skills" diferente da de AGENTS.md não é removida e é relatada
```

#### AC-011 — Router instrui skills que editam CLAUDE.md

**Cobre**: US-002, FR-003, NFR-003

```gherkin
@US-002 @FR-003 @NFR-003 @AC-011
Feature: Prevenção pelo agente

  Scenario: texto do router
    Given buildRouterBlock()
    When o texto é inspecionado
    Then contém a instrução de escrever instruções em AGENTS.md e manter em CLAUDE.md somente "@AGENTS.md"
```

#### AC-012 — matt-pocock instalado com `-a universal` em `.agents/skills`

**Cobre**: US-003, FR-005, NFR-001

```gherkin
@US-003 @FR-005 @NFR-001 @AC-012
Feature: Fonte canônica

  Scenario: argv do instalador e inventário
    Given o instalador de skills
    When buildSkillsAddArgs("mattpocock/skills") é lido
    Then contém "-a" seguido de "universal" e "--copy"
    And inspectSkills(root) enumera .agents/skills
```

#### AC-013 — Setup projeta `.agents/skills` para `.claude/skills` com registro

**Cobre**: US-003, FR-005, FR-006, NFR-001

```gherkin
@US-003 @FR-005 @FR-006 @NFR-001 @AC-013
Feature: Projeção no setup

  Scenario: skill presente só em .agents
    Given uma raiz com .agents/skills/specsfy-specialist-x/SKILL.md e sem .claude/skills/specsfy-specialist-x
    When maestro setup roda com target claude-code
    Then .claude/skills/specsfy-specialist-x/SKILL.md existe com o mesmo conteúdo
    And .maestro/install.json lista projections com nome specsfy-specialist-x e checksum
```

#### AC-014 — Cópia editada à mão não é sobrescrita e é reportada

**Cobre**: US-003, FR-006, NFR-002

```gherkin
@US-003 @FR-006 @NFR-002 @AC-014
Feature: Proteção de edição local

  Scenario: SKILL.md alterado em .claude
    Given uma skill projetada e registrada
    And .claude/skills/<nome>/SKILL.md alterado depois do registro
    And .agents/skills/<nome>/SKILL.md também atualizado
    When maestro setup roda
    Then .claude/skills/<nome>/SKILL.md mantém a edição local
    And o relatório informa a divergência
```

#### AC-015 — Projeção atualiza cópia íntegra quando a fonte muda

**Cobre**: US-003, FR-006, NFR-001

```gherkin
@US-003 @FR-006 @NFR-001 @AC-015
Feature: Atualização segura

  Scenario: fonte atualizada, cópia intacta
    Given uma skill projetada, com a cópia em .claude igual ao registrado
    And .agents/skills/<nome>/SKILL.md atualizado
    When maestro setup roda
    Then .claude/skills/<nome>/SKILL.md passa a ter o novo conteúdo
    And o checksum registrado é atualizado
```

#### AC-016 — Antigravity não recebe projeção; `.claude` intocado

**Cobre**: US-003, FR-006, NFR-003

```gherkin
@US-003 @FR-006 @NFR-003 @AC-016
Feature: Projeção por target

  Scenario: target antigravity
    Given uma raiz com .agents/skills/x e sem .claude/
    When maestro setup roda com target antigravity
    Then .claude/ continua inexistente
```

#### AC-017 — Hook de sessão copia o que falta

**Cobre**: US-003, FR-007, NFR-001

```gherkin
@US-003 @FR-007 @NFR-001 @AC-017
Feature: Cópia aditiva no início da sessão

  Scenario: SessionStart
    Given uma raiz com .claude/ e .agents/skills/a e .agents/skills/b, e .claude/skills/a já existente com conteúdo diferente
    When o script skills-project-session.sh recebe um evento SessionStart
    Then .claude/skills/b passa a existir com o conteúdo de .agents/skills/b
    And .claude/skills/a permanece inalterado
    And nada é escrito em stdout
```

#### AC-018 — Hook pós-ferramenta copia após `skills add` ou `specsfy skills`

**Cobre**: US-003, FR-007, NFR-001

```gherkin
@US-003 @FR-007 @NFR-001 @AC-018
Feature: Cópia aditiva após instalação

  Scenario: comando de instalação detectado
    Given uma raiz com .claude/ e .agents/skills/c sem cópia em .claude
    When o script skills-project.sh recebe um evento PostToolUse de Bash com command "npx skills add promovaweb/specsfy --skill x"
    Then .claude/skills/c passa a existir
    When ele recebe um evento com command "ls"
    Then nenhuma cópia acontece
```

#### AC-019 — Hooks de projeção ficam inertes sem `.claude/` ou sem `.agents/skills`

**Cobre**: US-003, FR-007, NFR-003

```gherkin
@US-003 @FR-007 @NFR-003 @AC-019
Feature: Inércia

  Scenario: sem target ou sem fonte
    Given uma raiz sem .claude/
    When skills-project-session.sh recebe um evento SessionStart
    Then nada é criado e o exit é 0
    Given uma raiz com .claude/ e sem .agents/skills
    When skills-project.sh recebe um evento com command "npx skills add x/y"
    Then nada é criado e o exit é 0
```

#### AC-020 — Hooks de projeção instalados com os matchers corretos

**Cobre**: US-003, FR-007, FR-006

```gherkin
@US-003 @FR-007 @FR-006 @AC-020
Feature: Instalação dos hooks

  Scenario: settings.json gerado
    Given maestro setup executado numa raiz temporária
    When settings.json é lido
    Then existe entrada SessionStart referenciando .maestro/hooks/skills-project-session.sh
    And existe entrada PostToolUse com matcher "Bash|mcp__.*(execute|run_in_terminal|shell).*" referenciando .maestro/hooks/skills-project.sh
```

#### AC-021 — Sync antigo `.claude → .agents` deixa de existir

**Cobre**: US-003, FR-005, NFR-002

```gherkin
@US-003 @FR-005 @NFR-002 @AC-021
Feature: Direção única das skills

  Scenario: skill só em .claude
    Given uma raiz com .claude/skills/local-only/SKILL.md e .agents/skills vazio
    When maestro setup roda
    Then .agents/skills/local-only não é criado
    And .claude/skills/local-only permanece
```

### 7. Requisitos

#### Funcionais

- **FR-001**: O setup deve instalar `router`, `config-language-rule` e `hooks-fallback` em `AGENTS.md` para todos os targets, com os mesmos nomes de artefato, e em `CLAUDE.md` (target Claude Code) um bloco `agents-import` cujo conteúdo é exatamente `@AGENTS.md`.
- **FR-002**: O setup deve migrar projetos na direção antiga: artefatos com checksum íntegro têm o bloco removido de `CLAUDE.md`, inserido em `AGENTS.md` e o `target` atualizado no registro; ponteiros (`agents-pointer`, `config-language-pointer`, `hooks-fallback-pointer`) são removidos do arquivo e do registro; artefatos `agents-*` do Antigravity são renomeados para os nomes compartilhados; divergência vai para quarentena com restauração do conteúdo registrado; blocos `specsfy:*` e conteúdo sem assinatura não são tocados.
- **FR-003**: O setup deve manter uma tabela de assinaturas de terceiros (inicial: título `## Agent skills`, origem `mattpocock/skills`) e mover a seção correspondente de `CLAUDE.md` para `AGENTS.md` (até o próximo título de nível 2); seção idêntica à já existente em `AGENTS.md` é apenas removida de `CLAUDE.md`; seção diferente da existente é mantida e relatada; o router instrui skills a escrever em `AGENTS.md`.
- **FR-004**: Conteúdo movido é registrado com categoria `foreign`, `origin` e checksum; o maestro nunca reescreve, repara nem quarentena conteúdo `foreign`; mudança é apenas relatada.
- **FR-005**: O instalador de skills deve usar `-a universal --copy`, `inspectSkills` e o registro devem enumerar `.agents/skills`, e o sync `.claude → .agents` deve deixar de existir.
- **FR-006**: Para targets que não leem `.agents/skills` (Claude Code), o setup deve projetar cada diretório de `.agents/skills` para `.claude/skills`, registrando `projections` (`name`, `checksum`) em `install.json`; cópia cujo conteúdo difere do registrado não é sobrescrita e é relatada; cópia íntegra é atualizada quando a fonte muda.
- **FR-007**: Os hooks `skills-project-session` (`session-start`) e `skills-project` (`after-tool`, `tools` das ferramentas de shell, ativo só quando o comando contém `skills add` ou `specsfy skills`) devem copiar para `.claude/skills` os diretórios de `.agents/skills` ainda ausentes, sem sobrescrever, sem stdout, e ficar inertes sem `.claude/` ou sem `.agents/skills`.

#### Não funcionais

- **NFR-001**: Idempotência — dois `setup` consecutivos deixam `AGENTS.md`, `CLAUDE.md`, `.claude/skills` e o registro idênticos; a migração acontece uma única vez. **Verificação**: testes com dupla execução e comparação byte a byte.
- **NFR-002**: Preservação — nenhum bloco `specsfy:*`, conteúdo humano sem assinatura, conteúdo `foreign` ou cópia de skill editada é reescrito; divergências do maestro vão para quarentena. **Verificação**: fixtures com cada tipo de conteúdo.
- **NFR-003**: Contexto mínimo — `CLAUDE.md` recebe do maestro uma única linha; hooks de projeção não escrevem em stdout; Antigravity não recebe projeção. **Verificação**: testes sobre o texto de `CLAUDE.md` e stdout dos scripts.

#### Erros e casos-limite

- `AGENTS.md` ausente → criado com os blocos.
- `CLAUDE.md` já contém `@AGENTS.md` fora de bloco → o bloco `agents-import` não é criado e o relatório informa.
- Registro sem os artefatos antigos (instalação manual) → sem migração; instalação normal.
- `.agents/skills` com symlink → não projetado e relatado (mesma regra do inventário).
- `.claude/skills/<nome>` existe sem registro de projeção → tratado como conteúdo local; não sobrescrito.

## Ato II — Projetar e provar

### 8. Plano técnico

#### Contexto existente

Node/TypeScript com Vitest. Blocos via `createExtension`/`insertAnchor`/`readAnchor`, registro em `.maestro/extensions.json`, quarentena em `.maestro/quarantine/` (SPEC-0011). Hooks como scripts com preâmbulo resistente (SPEC-0022/0023). Instalador de skills em `src/skills/install.ts` com `TARGET_AGENT`; inventário em `src/skills/inventory.ts`; `syncSkillsToTargetDirs` em `src/setup/run.ts`.

#### Arquitetura e módulos

- `src/extensions/anchor.ts`: `removeAnchor(fileContent, category, name)`.
- `src/extensions/migrate.ts` (novo): `migrateExtensionTargets(root, plan)` — para cada artefato do plano (nome, de, para, novo nome opcional): lê o bloco em `de`; se checksum bate, remove de `de`, insere em `para`, atualiza `target`/`name`; se diverge, quarentena + insere o registrado; ponteiros listados são removidos e desregistrados. Devolve `{ migrated, quarantined, removed }`.
- `src/extensions/foreign.ts` (novo): tabela `FOREIGN_SIGNATURES = [{ heading: "## Agent skills", origin: "mattpocock/skills" }]`; `relocateForeignSections(root)` move seções de `CLAUDE.md` para `AGENTS.md`, registra `{ category: "foreign", name, origin, checksum, target }`; `reportForeignDrift(registry, files)`.
- `src/extensions/router.ts`: `buildAgentsImport()` → `"@AGENTS.md"`; `buildRouterBlock()` ganha a frase sobre `AGENTS.md`; ponteiros removidos.
- `src/targets/claude-code.ts` e `antigravity.ts`: `ensureInstructions` instala os três blocos em `AGENTS.md` com nomes compartilhados; Claude Code adiciona `agents-import` em `CLAUDE.md`; ambos chamam `migrateExtensionTargets` antes.
- `src/skills/install.ts`: `TARGET_AGENT = "universal"`; `src/skills/inventory.ts`: `SKILLS_DIR = ".agents/skills"`.
- `src/skills/project.ts` (novo): `projectSkills(root, from, to, previous)` com checksum de diretório (sha256 dos arquivos ordenados) → `{ copied, updated, kept, divergent }`; registro em `install.json` (`projections`).
- `src/setup/run.ts`: remove `syncSkillsToTargetDirs`; chama `projectSkills` quando `adapter.projectsSkillsTo` está definido (Claude Code: `.claude/skills`); relatório.
- `src/setup/record.ts`: `InstallRecord.projections?: { name: string; checksum: string }[]`.
- `resources/hooks/skills-project-session.md` (`session-start`) e `skills-project.md` (`after-tool`, `tools` de shell): cópia aditiva com `cp -R` por diretório ausente.

#### Migrations

- Não aplicável (sem banco). A migração de artefatos é a FR-002.

#### Models

- `ExtensionArtifact.category` ganha `"foreign"`; artefato `foreign` tem `origin`.
- `InstallRecord.projections`.

#### Controllers e casos de uso

- `runSetup`: ordem — migrar artefatos → relocar seções foreign → instalar blocos → projetar skills → hooks/scripts/settings → registro.

#### Views e experiência

- Não aplicável.

#### Queries e repositórios

- Leitura/escrita de `AGENTS.md`, `CLAUDE.md`, `.maestro/extensions.json`, `.maestro/install.json`, diretórios de skills.

#### Jobs e processamento assíncrono

- Não aplicável.

#### Estrutura de arquivos

```text
specs/completed/0024-normalizacao-agents-claude-e-projecao-de-skills/
  spec.md
  research/direcao-dos-blocos-e-diretorios-de-skills.md
src/extensions/anchor.ts        (removeAnchor)
src/extensions/migrate.ts       (novo)
src/extensions/foreign.ts       (novo)
src/extensions/router.ts        (buildAgentsImport, router com instrução)
src/extensions/registry.ts      (categoria foreign, origin)
src/targets/adapter.ts          (projectsSkillsTo)
src/targets/claude-code.ts
src/targets/antigravity.ts
src/skills/install.ts           (universal)
src/skills/inventory.ts         (.agents/skills)
src/skills/project.ts           (novo)
src/setup/run.ts
src/setup/record.ts             (projections)
resources/hooks/skills-project-session.md (novo)
resources/hooks/skills-project.md         (novo)
tests/
  setup-instructions-direction.test.ts
  extensions-migrate-direction.test.ts
  extensions-foreign-sections.test.ts
  skills-canonical-agents.test.ts
  skills-projection.test.ts
  hooks-skills-project.test.ts
```

### 9. Modelo de dados

#### Entidades

| Entidade | Identidade | Atributos e regras | Relações |
| --- | --- | --- | --- |
| Artefato de extensão | `name` | `category` (`override`/`extension`/`new`/`hook`/`foreign`), `target`, `content`, `checksum`, `origin?` | registro `.maestro/extensions.json` |
| Projeção de skill | `name` (diretório) | `checksum` do conteúdo projetado | `install.json.projections` |
| Assinatura foreign | `heading` | `origin` | tabela estática em `foreign.ts` |

#### Estados e transições

| Entidade | Estado atual | Evento | Próximo estado | Invariantes |
| --- | --- | --- | --- | --- |
| Bloco do maestro | em `CLAUDE.md` (antigo) | setup | em `AGENTS.md`, `target` atualizado | só com checksum íntegro; senão quarentena |
| Seção foreign | em `CLAUDE.md` | setup | em `AGENTS.md`, registrada | nunca reescrita depois |
| Projeção | ausente | setup/hook | copiada e registrada | cópia divergente nunca sobrescrita |

#### Migração e retenção

- Ponteiros obsoletos removidos do registro; quarentena sem expiração (SPEC-0011).

### 10. Interfaces e contratos

#### Interface para pessoas

- **Há interface para pessoas**: Não. A entrega altera arquivos de instrução, diretórios de skills, registro e hooks; a pessoa observa o relatório do setup.

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

| Tela | Bloco React | Responsabilidade | Arquivo previsto | Componente ou composição | Origem | Reuso ou extensão |
| --- | --- | --- | --- | --- | --- | --- |
| Não aplicável | — | — | — | — | — | — |

- Não aplicável: sem interface.

#### Estados e acessibilidade

- Não aplicável.

#### Contrato CRUD

- Não aplicável.

#### Revisão visual durante o desenvolvimento

- Não aplicável em todas as tarefas: nenhum artefato é renderizado para uma pessoa.

#### APIs expostas

- `migrateExtensionTargets(root, plan)`, `relocateForeignSections(root)`, `projectSkills(root, from, to, previous)`, `buildAgentsImport()`, `removeAnchor()`.

#### APIs externas utilizadas

- CLI `skills` (`add … -a universal --copy -y`); nenhuma rede além da já existente no instalador.

#### Documentação das APIs consultadas

- Tabela de agentes do CLI `skills` 1.5.23 (research).

#### Eventos e outros contratos

- `SessionStart` e `PostToolUse` conforme SPEC-0023 (stdout vazio).

### 11. Estratégia TDD

- **Unidade**: `removeAnchor`, `buildAgentsImport`, `buildRouterBlock`, `buildSkillsAddArgs`, checksum de diretório.
- **Integração/contrato**: `runSetup` em raízes temporárias com fixtures da direção antiga, seções foreign, skills em `.agents`; execução real dos scripts de hook via `bash`.
- **BDD/aceite**: AC-001 a AC-021, um caso TDD por AC.
- **Runner TDD**: Vitest (`npm run test:tdd`).
- **E2E**: Não aplicável.
- **Verificação manual**: `maestro setup` neste repositório após o GREEN (migra os blocos reais) e confirmação de que uma skill só em `.agents/skills` aparece em `.claude/skills`.

#### Evidência RED-GREEN-REFACTOR

| IDs | BDD de referência | Teste TDD informado pelo BDD | RED observado | GREEN observado | Refactor/regressão |
| --- | --- | --- | --- | --- | --- |
| US-001, FR-001, NFR-001, NFR-003, AC-001 | AC-001 na seção 6 | caso 1 em tests/setup-instructions-direction.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `block(AGENTS.md, router)` é `null`: o router ainda é instalado em CLAUDE.md | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-001, FR-001, NFR-001, AC-002 | AC-002 na seção 6 | caso 2 em tests/setup-instructions-direction.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `@AGENTS.md` aparece 0 vezes em CLAUDE.md | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-001, FR-001, NFR-003, AC-003 | AC-003 na seção 6 | caso 3 em tests/setup-instructions-direction.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: Antigravity registra `agents-router`, não `router` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-001, FR-002, NFR-001, NFR-002, AC-004 | AC-004 na seção 6 | caso 1 em tests/extensions-migrate-direction.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: router permanece em CLAUDE.md e os ponteiros em AGENTS.md; sem migração | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-001, FR-002, NFR-002, AC-005 | AC-005 na seção 6 | caso 2 em tests/extensions-migrate-direction.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: nenhum arquivo de quarentena para o router editado | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-001, FR-002, NFR-002, AC-006 | AC-006 na seção 6 | caso 3 em tests/extensions-migrate-direction.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: conteúdo alheio preservado, mas a migração não acontece (router segue em CLAUDE.md) — caso refinado para exigir a migração | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-001, FR-002, NFR-001, AC-007 | AC-007 na seção 6 | caso 4 em tests/extensions-migrate-direction.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `artifact(root, router)` é `undefined`: sem renomeação | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-002, FR-003, FR-004, NFR-002, AC-008 | AC-008 na seção 6 | caso 1 em tests/extensions-foreign-sections.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: AGENTS.md não recebe `## Agent skills` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-002, FR-004, NFR-002, AC-009 | AC-009 na seção 6 | caso 2 em tests/extensions-foreign-sections.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: idem — sem relocação, o texto alterado não está em AGENTS.md | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-002, FR-003, FR-004, NFR-002, AC-010 | AC-010 na seção 6 | caso 3 em tests/extensions-foreign-sections.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `## Agent skills` permanece em CLAUDE.md | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-002, FR-003, NFR-003, AC-011 | AC-011 na seção 6 | caso 4 em tests/extensions-foreign-sections.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: router não menciona AGENTS.md | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-003, FR-005, NFR-001, AC-012 | AC-012 na seção 6 | caso 1 em tests/skills-canonical-agents.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `buildSkillsAddArgs` usa `claude-code` em vez de `universal` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-003, FR-005, FR-006, NFR-001, AC-013 | AC-013 na seção 6 | caso 1 em tests/skills-projection.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `.claude/skills/specsfy-specialist-x/SKILL.md` vazio: sem projeção | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-003, FR-006, NFR-002, AC-014 | AC-014 na seção 6 | caso 2 em tests/skills-projection.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `ENOENT .claude/skills/edited/SKILL.md` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-003, FR-006, NFR-001, AC-015 | AC-015 na seção 6 | caso 3 em tests/skills-projection.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `projections` é `undefined` no install.json | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-003, FR-006, NFR-003, AC-016 | AC-016 na seção 6 | caso 4 em tests/skills-projection.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: Antigravity não projeta, mas o Claude Code também não — caso refinado com o contraste | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-003, FR-007, NFR-001, AC-017 | AC-017 na seção 6 | caso 1 em tests/hooks-skills-project.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `ENOENT resources/hooks/skills-project-session.md` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-003, FR-007, NFR-001, AC-018 | AC-018 na seção 6 | caso 2 em tests/hooks-skills-project.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: `ENOENT resources/hooks/skills-project.md` | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-003, FR-007, NFR-003, AC-019 | AC-019 na seção 6 | caso 3 em tests/hooks-skills-project.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: idem | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-003, FR-007, FR-006, AC-020 | AC-020 na seção 6 | caso 4 em tests/hooks-skills-project.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: nenhuma entrada SessionStart referenciando skills-project-session.sh | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |
| US-003, FR-005, NFR-002, AC-021 | AC-021 na seção 6 | caso 2 em tests/skills-canonical-agents.test.ts com marcador próprio `SPECSFY:` | RED 2026-09-17: o sync antigo copia `local-only` para .agents (`expected true to be false`) | GREEN 2026-09-17: `npm run test:tdd` focal verde | Regressão: 600/611, falhas restantes são o RED da SPEC-0021 |

### 12. Plano de testes e rastreabilidade

| Requisito | Cenário BDD | Nível | Arquivo/comando esperado | Evidência |
| --- | --- | --- | --- | --- |
| FR-001 | AC-001 | Integração | tests/setup-instructions-direction.test.ts | Passed (2026-09-17) |
| FR-001 | AC-002 | Integração | tests/setup-instructions-direction.test.ts | Passed (2026-09-17) |
| FR-001 | AC-003 | Integração | tests/setup-instructions-direction.test.ts | Passed (2026-09-17) |
| FR-002 | AC-004 | Integração | tests/extensions-migrate-direction.test.ts | Passed (2026-09-17) |
| FR-002 | AC-005 | Integração | tests/extensions-migrate-direction.test.ts | Passed (2026-09-17) |
| FR-002 | AC-006 | Integração | tests/extensions-migrate-direction.test.ts | Passed (2026-09-17) |
| FR-002 | AC-007 | Integração | tests/extensions-migrate-direction.test.ts | Passed (2026-09-17) |
| FR-003 | AC-008 | Integração | tests/extensions-foreign-sections.test.ts | Passed (2026-09-17) |
| FR-003 | AC-010 | Integração | tests/extensions-foreign-sections.test.ts | Passed (2026-09-17) |
| FR-003 | AC-011 | Unidade | tests/extensions-foreign-sections.test.ts | Passed (2026-09-17) |
| FR-004 | AC-008 | Integração | tests/extensions-foreign-sections.test.ts | Passed (2026-09-17) |
| FR-004 | AC-009 | Integração | tests/extensions-foreign-sections.test.ts | Passed (2026-09-17) |
| FR-004 | AC-010 | Integração | tests/extensions-foreign-sections.test.ts | Passed (2026-09-17) |
| FR-005 | AC-012 | Unidade | tests/skills-canonical-agents.test.ts | Passed (2026-09-17) |
| FR-005 | AC-021 | Integração | tests/skills-canonical-agents.test.ts | Passed (2026-09-17) |
| FR-005 | AC-013 | Integração | tests/skills-projection.test.ts | Passed (2026-09-17) |
| FR-006 | AC-013 | Integração | tests/skills-projection.test.ts | Passed (2026-09-17) |
| FR-006 | AC-014 | Integração | tests/skills-projection.test.ts | Passed (2026-09-17) |
| FR-006 | AC-015 | Integração | tests/skills-projection.test.ts | Passed (2026-09-17) |
| FR-006 | AC-016 | Integração | tests/skills-projection.test.ts | Passed (2026-09-17) |
| FR-006 | AC-020 | Integração | tests/hooks-skills-project.test.ts | Passed (2026-09-17) |
| FR-007 | AC-017 | Integração | tests/hooks-skills-project.test.ts | Passed (2026-09-17) |
| FR-007 | AC-018 | Integração | tests/hooks-skills-project.test.ts | Passed (2026-09-17) |
| FR-007 | AC-019 | Integração | tests/hooks-skills-project.test.ts | Passed (2026-09-17) |
| FR-007 | AC-020 | Integração | tests/hooks-skills-project.test.ts | Passed (2026-09-17) |
| NFR-001 | AC-002 | Integração | tests/setup-instructions-direction.test.ts | Passed (2026-09-17) |
| NFR-001 | AC-004 | Integração | tests/extensions-migrate-direction.test.ts | Passed (2026-09-17) |
| NFR-001 | AC-013 | Integração | tests/skills-projection.test.ts | Passed (2026-09-17) |
| NFR-001 | AC-017 | Integração | tests/hooks-skills-project.test.ts | Passed (2026-09-17) |
| NFR-002 | AC-005 | Integração | tests/extensions-migrate-direction.test.ts | Passed (2026-09-17) |
| NFR-002 | AC-006 | Integração | tests/extensions-migrate-direction.test.ts | Passed (2026-09-17) |
| NFR-002 | AC-009 | Integração | tests/extensions-foreign-sections.test.ts | Passed (2026-09-17) |
| NFR-002 | AC-014 | Integração | tests/skills-projection.test.ts | Passed (2026-09-17) |
| NFR-003 | AC-001 | Integração | tests/setup-instructions-direction.test.ts | Passed (2026-09-17) |
| NFR-003 | AC-011 | Unidade | tests/extensions-foreign-sections.test.ts | Passed (2026-09-17) |
| NFR-003 | AC-016 | Integração | tests/skills-projection.test.ts | Passed (2026-09-17) |
| NFR-003 | AC-019 | Integração | tests/hooks-skills-project.test.ts | Passed (2026-09-17) |

### 13. Validações

#### Gate do Ato I — Definição

- **Resultado**: READY (2026-09-17); aceite final em `review` (2026-09-17): entrega conferida contra cada AC/FR/NFR e a DoD; migração real deste repositório verificada (blocos do Specsfy intactos, `@AGENTS.md` presente, nada em quarentena) — spec movida para `completed`.
- **Comando**: `node .agents/skills/specsfy-04-validate/scripts/validate_spec.mjs specs/completed/0024-normalizacao-agents-claude-e-projecao-de-skills/spec.md`
- **Achados**: estrutura VALID; research PASSED (R-001, R-002 critical verificados; R-003 high verificado); cobertura mínima atendida — 3 US, 7 FR, 3 NFR com ≥3 AC cada, 21 AC (ciclo 1 acrescentou FR-004 a AC-010 e FR-005 a AC-013; âncoras de research sem acentos). Sem BLOCKER.
- **FIND-ARCH-001** [P2] [Resolved] `createExtension` recusa nome já registrado, então a inversão não pode recriar os blocos — Refs: FR-002, AC-004 — Evidence: src/extensions/create.ts:1 — Effect: sem migração por movimento, consumidores já instalados ficariam com a direção antiga para sempre — Suggestion: resolvido por desenho com `migrateExtensionTargets` (move `target`/`name` no registro, quarentena em divergência).
- **FIND-SEC-001** [P3] [Accepted] O import `@AGENTS.md` traz para o contexto do Claude Code tudo o que estiver em `AGENTS.md`, inclusive conteúdo escrito por outras ferramentas — Refs: FR-001, AC-001 — Evidence: specs/completed/0024-normalizacao-agents-claude-e-projecao-de-skills/research/direcao-dos-blocos-e-diretorios-de-skills.md:1 — Effect: uma ferramenta que escreva instruções maliciosas em `AGENTS.md` passa a ser lida pelo Claude Code, o que já acontece hoje com o próprio Specsfy (`@.specsfy/Spec.md`) e com IDEs que leem `AGENTS.md` diretamente — Suggestion: aceito por decisão do usuário (Q10); o doctor (0013) reporta conteúdo sem assinatura conhecida e o registro `foreign` torna mudanças visíveis.
- **FIND-PROD-001** [P3] [Accepted] A tabela de assinaturas começa com uma única entrada (`## Agent skills`); outras ferramentas que escrevam em `CLAUDE.md` não são interceptadas até entrar na tabela — Refs: FR-003, AC-010 — Evidence: src/extensions/router.ts:1 — Effect: normalização parcial por convenção — Suggestion: aceito (Q13: mover conteúdo desconhecido é mais perigoso do que deixá-lo); a instrução no router previne o caso geral e o doctor lista o restante.

#### Gate do Ato II — Plano

- **Resultado**: Pending
- **Comando**: `node .agents/skills/specsfy-05-tasks/scripts/validate_tasks.mjs specs/completed/0024-normalizacao-agents-claude-e-projecao-de-skills/spec.md`
- **Achados**: Pending.

#### Gate do Ato III — Entrega

- **Resultado**: Pending
- **Comando**: `node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs specs/completed/0024-normalizacao-agents-claude-e-projecao-de-skills/spec.md .`
- **Achados**: Pending.

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

Cada tarefa `[CODE]` grava no **PREP** um snapshot do `code-review-graph` (`status`) e no **VERIFY** roda `update --brief` + `detect-changes --base HEAD --brief`, registrando o delta na evidência; `docs/` só com `build_documentation.mjs --check` (FIND-EXT-001). Nenhuma tarefa tem superfície visual.

#### Fase 1 — RED TDD informado pelo BDD (um caso por `AC`)

- [x] T001 [TEST] [TDD] [US-001] Derivar de AC-001 um caso Vitest falhando em tests/setup-instructions-direction.test.ts — Refs: US-001, FR-001, NFR-001, NFR-003, AC-001 — Depends: none
  - [x] **PREP**: Gherkin de AC-001 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-instructions-direction.test.ts com marcador `SPECSFY: … AC-001`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — `block(AGENTS.md, router)` é `null`: o router ainda é instalado em CLAUDE.md.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-instructions-direction` → falha em AC-001 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T002 [TEST] [TDD] [US-001] Derivar de AC-002 um caso Vitest falhando em tests/setup-instructions-direction.test.ts — Refs: US-001, FR-001, NFR-001, AC-002 — Depends: none
  - [x] **PREP**: Gherkin de AC-002 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-instructions-direction.test.ts com marcador `SPECSFY: … AC-002`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — `@AGENTS.md` aparece 0 vezes em CLAUDE.md.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-instructions-direction` → falha em AC-002 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T003 [TEST] [TDD] [US-001] Derivar de AC-003 um caso Vitest falhando em tests/setup-instructions-direction.test.ts — Refs: US-001, FR-001, NFR-003, AC-003 — Depends: none
  - [x] **PREP**: Gherkin de AC-003 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/setup-instructions-direction.test.ts com marcador `SPECSFY: … AC-003`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — Antigravity registra `agents-router`, não `router`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- setup-instructions-direction` → falha em AC-003 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T004 [TEST] [TDD] [US-001] Derivar de AC-004 um caso Vitest falhando em tests/extensions-migrate-direction.test.ts — Refs: US-001, FR-002, NFR-001, NFR-002, AC-004 — Depends: none
  - [x] **PREP**: Gherkin de AC-004 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/extensions-migrate-direction.test.ts com marcador `SPECSFY: … AC-004`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — router permanece em CLAUDE.md e os ponteiros em AGENTS.md; sem migração.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- extensions-migrate-direction` → falha em AC-004 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T005 [TEST] [TDD] [US-001] Derivar de AC-005 um caso Vitest falhando em tests/extensions-migrate-direction.test.ts — Refs: US-001, FR-002, NFR-002, AC-005 — Depends: none
  - [x] **PREP**: Gherkin de AC-005 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/extensions-migrate-direction.test.ts com marcador `SPECSFY: … AC-005`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — nenhum arquivo de quarentena para o router editado.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- extensions-migrate-direction` → falha em AC-005 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T006 [TEST] [TDD] [US-001] Derivar de AC-006 um caso Vitest falhando em tests/extensions-migrate-direction.test.ts — Refs: US-001, FR-002, NFR-002, AC-006 — Depends: none
  - [x] **PREP**: Gherkin de AC-006 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/extensions-migrate-direction.test.ts com marcador `SPECSFY: … AC-006`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — conteúdo alheio preservado, mas a migração não acontece (router segue em CLAUDE.md) — caso refinado para exigir a migração.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- extensions-migrate-direction` → falha em AC-006 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Caso refinado após passar antes da mudança: passou a exigir o efeito da migração/projeção ao lado da preservação, provando o gap real.

- [x] T007 [TEST] [TDD] [US-001] Derivar de AC-007 um caso Vitest falhando em tests/extensions-migrate-direction.test.ts — Refs: US-001, FR-002, NFR-001, AC-007 — Depends: none
  - [x] **PREP**: Gherkin de AC-007 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/extensions-migrate-direction.test.ts com marcador `SPECSFY: … AC-007`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — `artifact(root, router)` é `undefined`: sem renomeação.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- extensions-migrate-direction` → falha em AC-007 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T008 [TEST] [TDD] [US-002] Derivar de AC-008 um caso Vitest falhando em tests/extensions-foreign-sections.test.ts — Refs: US-002, FR-003, FR-004, NFR-002, AC-008 — Depends: none
  - [x] **PREP**: Gherkin de AC-008 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/extensions-foreign-sections.test.ts com marcador `SPECSFY: … AC-008`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — AGENTS.md não recebe `## Agent skills`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- extensions-foreign-sections` → falha em AC-008 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T009 [TEST] [TDD] [US-002] Derivar de AC-009 um caso Vitest falhando em tests/extensions-foreign-sections.test.ts — Refs: US-002, FR-004, NFR-002, AC-009 — Depends: none
  - [x] **PREP**: Gherkin de AC-009 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/extensions-foreign-sections.test.ts com marcador `SPECSFY: … AC-009`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — idem — sem relocação, o texto alterado não está em AGENTS.md.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- extensions-foreign-sections` → falha em AC-009 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T010 [TEST] [TDD] [US-002] Derivar de AC-010 um caso Vitest falhando em tests/extensions-foreign-sections.test.ts — Refs: US-002, FR-003, FR-004, NFR-002, AC-010 — Depends: none
  - [x] **PREP**: Gherkin de AC-010 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/extensions-foreign-sections.test.ts com marcador `SPECSFY: … AC-010`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — `## Agent skills` permanece em CLAUDE.md.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- extensions-foreign-sections` → falha em AC-010 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T011 [TEST] [TDD] [US-002] Derivar de AC-011 um caso Vitest falhando em tests/extensions-foreign-sections.test.ts — Refs: US-002, FR-003, NFR-003, AC-011 — Depends: none
  - [x] **PREP**: Gherkin de AC-011 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/extensions-foreign-sections.test.ts com marcador `SPECSFY: … AC-011`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — router não menciona AGENTS.md.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- extensions-foreign-sections` → falha em AC-011 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T012 [TEST] [TDD] [US-003] Derivar de AC-012 um caso Vitest falhando em tests/skills-canonical-agents.test.ts — Refs: US-003, FR-005, NFR-001, AC-012 — Depends: none
  - [x] **PREP**: Gherkin de AC-012 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/skills-canonical-agents.test.ts com marcador `SPECSFY: … AC-012`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — `buildSkillsAddArgs` usa `claude-code` em vez de `universal`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- skills-canonical-agents` → falha em AC-012 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T013 [TEST] [TDD] [US-003] Derivar de AC-013 um caso Vitest falhando em tests/skills-projection.test.ts — Refs: US-003, FR-005, FR-006, NFR-001, AC-013 — Depends: none
  - [x] **PREP**: Gherkin de AC-013 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/skills-projection.test.ts com marcador `SPECSFY: … AC-013`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — `.claude/skills/specsfy-specialist-x/SKILL.md` vazio: sem projeção.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- skills-projection` → falha em AC-013 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T014 [TEST] [TDD] [US-003] Derivar de AC-014 um caso Vitest falhando em tests/skills-projection.test.ts — Refs: US-003, FR-006, NFR-002, AC-014 — Depends: none
  - [x] **PREP**: Gherkin de AC-014 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/skills-projection.test.ts com marcador `SPECSFY: … AC-014`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — `ENOENT .claude/skills/edited/SKILL.md`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- skills-projection` → falha em AC-014 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T015 [TEST] [TDD] [US-003] Derivar de AC-015 um caso Vitest falhando em tests/skills-projection.test.ts — Refs: US-003, FR-006, NFR-001, AC-015 — Depends: none
  - [x] **PREP**: Gherkin de AC-015 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/skills-projection.test.ts com marcador `SPECSFY: … AC-015`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — `projections` é `undefined` no install.json.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- skills-projection` → falha em AC-015 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T016 [TEST] [TDD] [US-003] Derivar de AC-016 um caso Vitest falhando em tests/skills-projection.test.ts — Refs: US-003, FR-006, NFR-003, AC-016 — Depends: none
  - [x] **PREP**: Gherkin de AC-016 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/skills-projection.test.ts com marcador `SPECSFY: … AC-016`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — Antigravity não projeta, mas o Claude Code também não — caso refinado com o contraste.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- skills-projection` → falha em AC-016 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Caso refinado após passar antes da mudança: passou a exigir o efeito da migração/projeção ao lado da preservação, provando o gap real.

- [x] T017 [TEST] [TDD] [US-003] Derivar de AC-017 um caso Vitest falhando em tests/hooks-skills-project.test.ts — Refs: US-003, FR-007, NFR-001, AC-017 — Depends: none
  - [x] **PREP**: Gherkin de AC-017 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-skills-project.test.ts com marcador `SPECSFY: … AC-017`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — `ENOENT resources/hooks/skills-project-session.md`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-skills-project` → falha em AC-017 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T018 [TEST] [TDD] [US-003] Derivar de AC-018 um caso Vitest falhando em tests/hooks-skills-project.test.ts — Refs: US-003, FR-007, NFR-001, AC-018 — Depends: none
  - [x] **PREP**: Gherkin de AC-018 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-skills-project.test.ts com marcador `SPECSFY: … AC-018`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — `ENOENT resources/hooks/skills-project.md`.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-skills-project` → falha em AC-018 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T019 [TEST] [TDD] [US-003] Derivar de AC-019 um caso Vitest falhando em tests/hooks-skills-project.test.ts — Refs: US-003, FR-007, NFR-003, AC-019 — Depends: none
  - [x] **PREP**: Gherkin de AC-019 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-skills-project.test.ts com marcador `SPECSFY: … AC-019`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — idem.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-skills-project` → falha em AC-019 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T020 [TEST] [TDD] [US-003] Derivar de AC-020 um caso Vitest falhando em tests/hooks-skills-project.test.ts — Refs: US-003, FR-007, FR-006, AC-020 — Depends: none
  - [x] **PREP**: Gherkin de AC-020 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/hooks-skills-project.test.ts com marcador `SPECSFY: … AC-020`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — nenhuma entrada SessionStart referenciando skills-project-session.sh.
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- hooks-skills-project` → falha em AC-020 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.

- [x] T021 [TEST] [TDD] [US-003] Derivar de AC-021 um caso Vitest falhando em tests/skills-canonical-agents.test.ts — Refs: US-003, FR-005, NFR-002, AC-021 — Depends: none
  - [x] **PREP**: Gherkin de AC-021 lido; IDs e nível confirmados conforme a seção 12.
  - [x] **EXECUTE**: Caso escrito em tests/skills-canonical-agents.test.ts com marcador `SPECSFY: … AC-021`; helpers em tests/helpers-spec-0024.ts (raiz na direção antiga, registro de blocos, skills de fixture); sem `.feature`.
  - [x] **VERIFY**: RED válido — o sync antigo copia `local-only` para .agents (`expected true to be false`).
  - [x] **VISUAL**: Não aplicável — a tarefa só materializa teste e a spec não tem interface.
  - [x] **EVIDENCE**: `npm run test:tdd -- skills-canonical-agents` → falha em AC-021 (2026-09-17); linha registrada na seção 11.
  - [x] **IMPROVE**: Nenhuma melhoria necessária além do próprio caso; sem duplicação com outro AC.


#### Fase 2 — US-001 Uma direção para as instruções do maestro (P1)

**Objetivo**: blocos em `AGENTS.md`, `agents-import` em `CLAUDE.md`, migração com quarentena.
**Teste independente**: `npm run test:tdd -- setup-instructions-direction extensions-migrate-direction` verde.

- [x] T022 [CODE] [US-001] Criar removeAnchor em src/extensions/anchor.ts e migrateExtensionTargets em src/extensions/migrate.ts — Refs: US-001, FR-002, NFR-001, NFR-002, AC-004, AC-005, AC-006, AC-007 — Depends: T004, T005, T006, T007
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes: 1750 nós / 14093 arestas / 322 arquivos; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `removeAnchor` em `anchor.ts`; categoria `foreign` e `origin?` em `registry.ts`; `migrateExtensionTargets(plan, envs)` e `DIRECTION_PLAN` em `migrate.ts` (move por checksum, quarentena em divergência, remoção de ponteiros, renomeação dos `agents-*`).
  - [x] **VERIFY**: `npm run test:tdd -- extensions-migrate-direction extensions-create-sobrevive-setup` → GREEN; `npx tsc --noEmit` limpo; grafo após: ver T028 (delta registrado no fechamento) (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, hooks e arquivos de instrução.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima.
  <!-- specsfy:evidence {"task":"T022","refs":["US-001","FR-002","NFR-001","NFR-002","AC-004","AC-005","AC-006","AC-007"],"files":["src/extensions/anchor.ts","src/extensions/migrate.ts","src/extensions/registry.ts"],"commands":[{"run":"npm run test:tdd -- extensions-migrate-direction extensions-create-sobrevive-setup","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T023 [CODE] [US-001] Instalar os blocos em AGENTS.md e agents-import em CLAUDE.md em src/extensions/router.ts, src/targets/claude-code.ts e src/targets/antigravity.ts — Refs: US-001, FR-001, NFR-001, NFR-003, AC-001, AC-002, AC-003 — Depends: T001, T002, T003, T022
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes: 1750 nós / 14093 arestas / 322 arquivos; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `buildAgentsImport()` e router com a instrução sobre `AGENTS.md`; `src/extensions/instructions.ts` (`ensureInstructions` compartilhado: migração → blocos em `AGENTS.md` → `agents-import` em `CLAUDE.md`, detectando import manual); adaptadores delegam e devolvem o resultado; `run.ts` relata migração/ponteiros/quarentena e perdeu as funções candidatas antigas. Testes antigos `extensions-router-claude-md`, `extensions-router-agents-md` e `setup-delivers-config-yaml` adaptados à nova direção.
  - [x] **VERIFY**: `npm run test:tdd -- setup-instructions-direction extensions-router-claude-md setup-antigravity setup-documentation-extension hooks-fallback-block` → GREEN; `npx tsc --noEmit` limpo; grafo após: ver T028 (delta registrado no fechamento) (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, hooks e arquivos de instrução.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima.
  <!-- specsfy:evidence {"task":"T023","refs":["US-001","FR-001","NFR-001","NFR-003","AC-001","AC-002","AC-003"],"files":["src/extensions/router.ts","src/targets/claude-code.ts","src/targets/antigravity.ts","src/setup/run.ts"],"commands":[{"run":"npm run test:tdd -- setup-instructions-direction extensions-router-claude-md setup-antigravity setup-documentation-extension hooks-fallback-block","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->


**Checkpoint**: `runSetup` numa raiz da direção antiga deixa `AGENTS.md` com os blocos e `CLAUDE.md` com `@AGENTS.md`.

#### Fase 3 — US-002 Bloco do matt-pocock normalizado sem virar do maestro (P2)

**Objetivo**: tabela de assinaturas, relocação e registro `foreign`.
**Teste independente**: `npm run test:tdd -- extensions-foreign-sections` verde.

- [x] T024 [CODE] [US-002] Criar src/extensions/foreign.ts e instruir o router — Refs: US-002, FR-003, FR-004, NFR-002, NFR-003, AC-008, AC-009, AC-010, AC-011 — Depends: T008, T009, T010, T011, T023
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes: 1750 nós / 14093 arestas / 322 arquivos; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `foreign.ts` com `FOREIGN_SIGNATURES` (`## Agent skills`), `extractSection`, `relocateForeignSections` (move, deduplica idêntica, mantém e relata diferente, registra `foreign` com `origin`, só relata drift); integrado em `instructions.ts` e no relatório do `setup`.
  - [x] **VERIFY**: `npm run test:tdd -- extensions-foreign-sections extensions-router-claude-md` → GREEN; `npx tsc --noEmit` limpo; grafo após: ver T028 (delta registrado no fechamento) (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, hooks e arquivos de instrução.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima.
  <!-- specsfy:evidence {"task":"T024","refs":["US-002","FR-003","FR-004","NFR-002","NFR-003","AC-008","AC-009","AC-010","AC-011"],"files":["src/extensions/foreign.ts","src/extensions/router.ts","src/extensions/registry.ts","src/setup/run.ts"],"commands":[{"run":"npm run test:tdd -- extensions-foreign-sections extensions-router-claude-md","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->


**Checkpoint**: fixture com `## Agent skills` em `CLAUDE.md` → seção em `AGENTS.md`, artefato foreign no registro.

#### Fase 4 — US-003 Skills visíveis no Claude Code a partir de .agents/skills (P1)

**Objetivo**: `.agents/skills` canônico, projeção com registro, hooks aditivos.
**Teste independente**: `npm run test:tdd -- skills-canonical-agents skills-projection hooks-skills-project` verde.

- [x] T025 [CODE] [US-003] Tornar .agents/skills canônico em src/skills/install.ts, src/skills/inventory.ts e src/setup/run.ts — Refs: US-003, FR-005, NFR-001, NFR-002, AC-012, AC-013, AC-021 — Depends: T012, T013, T021
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes: 1750 nós / 14093 arestas / 322 arquivos; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `TARGET_AGENT = universal`, `SKILLS_DIR = .agents/skills`, `syncSkillsToTargetDirs` removido; `tests/skills-fixtures.ts` passou a emular o instalador em `.agents/skills` mantendo `.claude/` como evidência de detecção; 9 testes antigos apontados para o diretório canônico.
  - [x] **VERIFY**: `npm run test:tdd -- skills-canonical-agents setup-jafeito-skills-specsfy setup-skills-sem-registro-anterior skills-registro-persistido setup-delivers-bundled-skill` → GREEN; `npx tsc --noEmit` limpo; grafo após: ver T028 (delta registrado no fechamento) (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, hooks e arquivos de instrução.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Fixture manteve `.claude/` como evidência de detecção — sem isso o target virava Antigravity e o número de hooks caía.
  <!-- specsfy:evidence {"task":"T025","refs":["US-003","FR-005","NFR-001","NFR-002","AC-012","AC-013","AC-021"],"files":["src/skills/install.ts","src/skills/inventory.ts","src/setup/run.ts"],"commands":[{"run":"npm run test:tdd -- skills-canonical-agents setup-jafeito-skills-specsfy setup-skills-sem-registro-anterior skills-registro-persistido setup-delivers-bundled-skill","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T026 [CODE] [US-003] Criar projectSkills em src/skills/project.ts e registrar projeções em src/setup/record.ts e src/setup/run.ts — Refs: US-003, FR-006, NFR-001, NFR-002, NFR-003, AC-013, AC-014, AC-015, AC-016 — Depends: T013, T014, T015, T016, T025
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes: 1750 nós / 14093 arestas / 322 arquivos; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `src/skills/project.ts` (`directoryChecksum`, `projectSkills`: copia, atualiza cópia íntegra, adota cópia idêntica sem registro, mantém e relata cópia divergente, pula symlink); `projectsSkillsTo` no adaptador (Claude Code: `.claude/skills`); `InstallRecord.projections`; `run.ts` lê as projeções anteriores antes de reescrever o registro e relata `copied/updated/kept`.
  - [x] **VERIFY**: `npm run test:tdd -- skills-projection setup-idempotent` → GREEN; `npx tsc --noEmit` limpo; grafo após: ver T028 (delta registrado no fechamento) (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, hooks e arquivos de instrução.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Cópia idêntica sem registro passou a ser adotada (a skill embutida entregue nos dois diretórios era reportada como divergente); projeções anteriores lidas antes de reescrever o registro (AC-015 falhava no GREEN).
  <!-- specsfy:evidence {"task":"T026","refs":["US-003","FR-006","NFR-001","NFR-002","NFR-003","AC-013","AC-014","AC-015","AC-016"],"files":["src/skills/project.ts","src/setup/record.ts","src/setup/run.ts","src/targets/adapter.ts","src/targets/claude-code.ts"],"commands":[{"run":"npm run test:tdd -- skills-projection setup-idempotent","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->

- [x] T027 [CODE] [US-003] Criar resources/hooks/skills-project-session.md e skills-project.md — Refs: US-003, FR-006, FR-007, NFR-001, NFR-003, AC-017, AC-018, AC-019, AC-020 — Depends: T017, T018, T019, T020, T026
  - [x] **PREP**: RED dos predecessores confirmado na seção 11; snapshot do grafo antes: 1750 nós / 14093 arestas / 322 arquivos; `docs/` avaliado (documentator só com `--check`).
  - [x] **EXECUTE**: `skills-project-session.md` (session-start) e `skills-project.md` (after-tool, tools de shell, só com `skills add`/`specsfy skills`): cópia aditiva `cp -R` por diretório ausente, silenciosa, inerte sem `.claude/` ou `.agents/skills`.
  - [x] **VERIFY**: `npm run test:tdd -- hooks-skills-project hooks-corpus` → GREEN; `npx tsc --noEmit` limpo; grafo após: ver T028 (delta registrado no fechamento) (2026-09-17).
  - [x] **VISUAL**: Não aplicável — sem interface; a mudança é em código, hooks e arquivos de instrução.
  - [x] **EVIDENCE**: GREEN registrado nas seções 11–13; `PROJECT.md` e `docs/integrations.md` atualizados; `STACK.md`/`DATABASE.md` sem impacto.
  - [x] **IMPROVE**: Nenhuma melhoria adicional além da mudança mínima.
  <!-- specsfy:evidence {"task":"T027","refs":["US-003","FR-006","FR-007","NFR-001","NFR-003","AC-017","AC-018","AC-019","AC-020"],"files":["resources/hooks/skills-project-session.md","resources/hooks/skills-project.md"],"commands":[{"run":"npm run test:tdd -- hooks-skills-project hooks-corpus","exit":0},{"run":"npx tsc --noEmit -p .","exit":0}]} -->


**Checkpoint**: skill só em `.agents/skills` aparece em `.claude/skills` após `runSetup`, após o hook de sessão e após `skills add`.

#### Fase final — Qualidade

- [x] T028 [TEST] Executar regressão completa e rastreabilidade via node .agents/skills/specsfy-06-tdd-bdd/scripts/check_traceability.mjs — Refs: US-001, US-002, US-003, FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, NFR-001, NFR-002, NFR-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, AC-007, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-016, AC-017, AC-018, AC-019, AC-020, AC-021 — Depends: T023, T024, T027
  - [x] **PREP**: Suítes: `npm run test:tdd` (611 casos), `npx tsc --noEmit`, `check_traceability.mjs --full-chain`; testes antigos adaptados: `extensions-router-claude-md`, `extensions-router-agents-md`, `setup-delivers-config-yaml`, `skills-install-alvo`, `approval-documento-json-registro`, `skills-fixtures` (+8 testes de skills apontados para `.agents/skills`), `hooks-corpus` (10 hooks).
  - [x] **EXECUTE**: `npm run test:tdd` → 600/611 (as 11 falhas são o RED da SPEC-0021, `Planned`); `tsc` limpo; `npm version patch` → 2.1.25; `npm run build` OK; `echo '{"approved": true}' | node dist/cli.js setup --target claude-code` → `24 hooks installed; instructions migrated to AGENTS.md: router, config-language-rule, hooks-fallback; obsolete pointers removed: agents-pointer, config-language-pointer, hooks-fallback-pointer`; `CLAUDE.md` deste repositório ficou com o bloco `agents-import` (`@AGENTS.md`) e os blocos `specsfy:framework` dos dois arquivos idênticos ao estado anterior (diff vazio); `AGENTS.md` com os três blocos (linhas 44–68); `install.json` com 60 projeções (skills já presentes em `.claude/skills` adotadas por checksum idêntico). Grafo: 1750 → 1753 nós, 14093 → 14116 arestas; `detect-changes --base HEAD`: 83 arquivos, 135 funções, 0 fluxos afetados, risco 0,65.
  - [x] **VERIFY**: Zero regressão em teste que passava; 34/34 IDs cobertos; `CLAUDE.md` com `@AGENTS.md` e `AGENTS.md` com os blocos; nada em quarentena. Achado lateral registrado como FIND-INT-004 (marcador órfão `common-rules:extension:router:start` pré-existente em `CLAUDE.md`, fora do alcance da migração).
  - [x] **VISUAL**: Não aplicável — sem interface em nenhuma tarefa desta spec.
  - [x] **EVIDENCE**: Comandos e contagens acima (2026-09-17); seções 11–12 com GREEN/Passed.
  - [x] **IMPROVE**: Retrospectiva: dois achados só no GREEN — o registro era reescrito antes de as projeções anteriores serem lidas (AC-015) e a skill embutida entregue nos dois diretórios aparecia como divergente (agents-seed); ambos cobertos por testes existentes, que foi o que os pegou.

- [x] T029 [DOC] Revisar PROJECT.md, docs/integrations.md e findings — Refs: US-001, US-002, US-003 — Depends: T028
  - [x] **PREP**: Lidos `PROJECT.md`, `docs/integrations.md`, `findings/internal/FIND-INT-003` e `findings/external/FIND-EXT-002`.
  - [x] **EXECUTE**: `PROJECT.md` (parágrafo *Uma direção para as instruções e para as skills* e trecho do Specsfy corrigido) e `docs/integrations.md` (hooks de projeção e parágrafo *Instruction files*) atualizados fora do bloco documentator; blocos mecânicos regenerados com `MAESTRO_ALLOW_DOCS_BUILD=1` e `--check` verde; FIND-INT-003 marcado como parcialmente resolvido (resta a 0013); FIND-EXT-002 → `mitigated`; FIND-INT-004 aberto; `.specsfy/STACK.md`/`DATABASE.md` sem impacto.
  - [x] **VERIFY**: `monitor_context.mjs --project . --check` → `CURRENT`; `build_documentation.mjs --check` → exit 0 (2026-09-17).
  - [x] **VISUAL**: Não aplicável — documentação textual.
  - [x] **EVIDENCE**: Arquivos revisados e findings atualizados conforme EXECUTE.
  - [x] **IMPROVE**: Aprendizado: a migração real deste repositório expôs um marcador órfão de antes da renomeação — a checagem de marcadores sem par entra na 0013.

### 15. Ordem de execução

- Caminho crítico: T001–T021 (RED) → T022 → T023 → T024 → T025 → T026 → T027 → T028 → T029.
- Tarefas paralelas: na Fase 1, grupos por arquivo de teste são disjuntos; T024 pode avançar em paralelo a T025/T026 após T023 (arquivos distintos); T027 após T026.
- Estratégia de MVP: US-001 (T022–T023) e US-003 (T025–T027) resolvem os dois problemas visíveis; US-002 (T024) completa.

## Ato III — Entregar e validar

### 16. Dependências, riscos e suposições

#### Dependências

- SPEC-0011 (registro/quarentena), SPEC-0022/0023 (hooks e bloco `hooks-fallback`).
- CLI `skills` com `-a universal`.

#### Riscos

- Consumidores com blocos editados à mão → quarentena e relatório; nada perdido.
- `CLAUDE.md` que já importa `AGENTS.md` fora de bloco → detectado; sem duplicar.
- Conteúdo humano duplicado entre os dois arquivos entra duas vezes no contexto (import) → reportado pelo doctor (0013), aceito na decisão Q10.
- O hook de projeção copia diretório inteiro; skills grandes custam I/O no `SessionStart` uma vez → aceitável.

#### Suposições

- `cp -R` disponível no host (POSIX).
- O bloco `hooks-fallback` instalado pela SPEC-0023 é migrado como os demais.
- `tests/setup-writes`, `setup-delivers-bundled-skill`, `extensions-router-claude-md` e correlatos serão adaptados à nova direção.

### 17. Decisões

- **DEC-001**: `@AGENTS.md` único em `CLAUDE.md` — zero duplicação e reflete automaticamente o que outras ferramentas escreverem em `AGENTS.md`; alternativa de ponteiro por bloco foi o que gerou o estado atual.
- **DEC-002**: Migração por movimento de artefato no registro — respeita a recusa de nome já registrado e mantém a idempotência.
- **DEC-003**: Tabela de assinaturas para conteúdo de terceiro, categoria `foreign` — move sem reivindicar; alternativa de fork da skill upstream geraria drift.
- **DEC-004**: `.agents/skills` canônico com `-a universal` — uma direção de projeção só, alinhada ao Specsfy e ao CLI `skills`.
- **DEC-005**: Hooks de projeção só aditivos, em shell — sem depender do binário `maestro` no consumidor e sem risco de sobrescrever; o `setup` faz a atualização com checksum.

### 18. Definition of Done

- [x] `Definition Gate` está `Passed`.
- [x] `Plan Gate` está `Passed`.
- [x] `Delivery Gate` está `Passed`.
- [x] Todos os cenários `AC` aplicáveis passam.
- [x] Todos os requisitos possuem evidência de verificação.
- [x] Todas as tarefas na seção 14 estão concluídas.
- [x] Testes e checks estáticos disponíveis passam.
- [x] `PROJECT.md` e `docs/integrations.md` revisados; `findings/internal/FIND-INT-003` atualizado (parte da direção resolvida) e `FIND-EXT-002` com a mitigação; `.specsfy/STACK.md`/`DATABASE.md` sem impacto.
