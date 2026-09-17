# Backlog: Doctor orquestrador e critério de setup completo: instalado e configurado

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0013 |
| Status | Ready for specification |
| Produto | Maestro |
| Épico | Setup confiável em projetos consumidores (hooks, instruções, skills, doctor) |
| Funcionalidade | Fatia 3 de 3 derivadas da Inbox 2026-09-17-105213 |
| Tipo | Técnico + melhoria |
| Prioridade | Média — após BACKLOG-0011, 0012 e 0014 |
| Milestones | |
| Criado em | 2026-09-17 |
| Spec promovida | Nenhuma |

## Ideia original

O maestro setup instala arquivos, não executa skills: mas deveria identificar se specsfy/matt_pocock estão instalados e instalar (em caso de instalação inicial mal feita, e sempre instalar na primeira instalação) (ao rodar as skills, specsfy permite instalar em outros lugares, maestro SEMPRE instala apenas no projeto atual, nunca global). O critério de setup completo do próprio maestro é apenas existe .maestro/install.json && existe .specsfy/ — ele considera concluído no momento em que o framework está instalado, não configurado. Nenhum doc do maestro diz depois rode /specsfy-setup e /setup-matt-pocock-skills. Eu tentaria usar os doctors de cada um e uma camada acima do próprio maestro: o doctor do maestro irá rodar os doctors específicos e adicionar suas camadas extras para o que for necessário.

## Problema percebido

Setup completo é definido só por existência de pastas; nada verifica se specsfy-setup e setup-matt-pocock-skills (skills conversacionais que só um agente executa) rodaram, e nenhum canal (hook, README, relatório) orienta a executá-las. O short-circuit já configurado pula os instaladores mesmo com instalação parcial. maestro doctor não consulta os diagnósticos dos subsistemas (specsfy doctor, context-mode doctor, skills list, code-review-graph status) nem valida hooks, blocos ou projeções.

## Pessoa afetada ou beneficiada

Pessoas que rodam maestro setup pela primeira vez ou após instalação malfeita em projeto consumidor; agentes que iniciam sessão em projeto parcialmente configurado; o mantenedor do maestro ao diagnosticar.

## Resultado ou valor esperado

Configurado passa a significar instalado + rastros do specsfy-setup (PROJECT.md, .specsfy/STACK.md, RULES.md, USER-PROFILE.md) + blocos esperados em AGENTS.md/CLAUDE.md. SessionStart injeta a instrução de executar /specsfy-setup e /setup-matt-pocock-skills enquanto incompleto; README e relatório do setup dizem o mesmo. Instaladores rodam sempre (idempotentes); short-circuit só evita aprovação repetida. maestro doctor orquestra os sub-doctors reais e adiciona a camada maestro (matchers, identidade dos hooks, direção dos blocos, normalização, rastros de configuração, projeções vs registro), só reporta (setup repara), exit ≠0 em FAIL e WARN para pendências que só o agente resolve, com layout esperado derivado por função pura compartilhada com o setup.

## Contexto

Origem: specs/inbox/2026-09-17-105213-hooks-do-maestro-com-matcher-invalido-no-claude-code-e-setup-que-instala-sem-configurar-specsfy-e-skills.md. Decisões tomadas em sessão de grill em 2026-09-17 (Q6-Q8, Q15-Q16). Terceira fatia; verifica o que as fatias 1 e 2 produzem, portanto vem depois delas.

## Referências relacionadas

- `specs/inbox/2026-09-17-105213-hooks-do-maestro-com-matcher-invalido-no-claude-code-e-setup-que-instala-sem-configurar-specsfy-e-skills.md` — origem (Inbox).
- `specs/inbox/2026-08-30-122232-setup-nao-resincroniza-skills-nem-framework-quando-hooks-ja-batem.md` — inbox relacionada: precedente do short-circuit.
- `specs/inbox/2026-09-06-082432-mcp-setup-nao-instala-skills-nem-specsfy-so-hooks.md` — inbox relacionada: origem do hook `setup-check`.
- `specs/backlog/0010-extensao-maestro-para-governar-documentacao-docs-e-readme-gerada-pelo-specsfy-em-projetos-consumidores.md` e `specs/planned/0021-.../spec.md` — backlog/spec relacionados: padrão de diagnóstico read-only no doctor e README gerado.
- `specs/backlog/0011-...` e `specs/backlog/0012-...` — backlogs relacionados: este item verifica o que eles produzem.
- `resources/hooks/setup-check.md`, `src/doctor.ts`, `src/setup/run.ts`, `src/setup/readme.ts` — fontes atuais.

## Comportamento esperado

1. "Configurado" = instalado (`.maestro/install.json`, `.specsfy/`) **e** rastros do `specsfy-setup` (`PROJECT.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/USER-PROFILE.md`) **e** blocos esperados em `AGENTS.md`/`CLAUDE.md`.
2. O hook `SessionStart` injeta, enquanto incompleto, a instrução de executar `/specsfy-setup` e `/setup-matt-pocock-skills`; README gerado e relatório do `maestro setup` dizem o mesmo.
3. Os instaladores de Specsfy e skills rodam em todo `maestro setup` (são idempotentes); o short-circuit serve apenas para não repetir a aprovação já concedida.
4. `maestro doctor` executa os sub-doctors reais (`specsfy doctor`, `context-mode doctor`, `skills list`, `code-review-graph status`) e adiciona a camada maestro: matchers válidos, identidade dos hooks, direção dos blocos, `## Agent skills` normalizado, rastros de configuração, projeções vs registro.
5. O doctor só reporta; `maestro setup` repara. Exit ≠0 em qualquer `FAIL`; `WARN` para pendências que só o agente resolve (configuração conversacional).
6. O layout esperado é derivado por função pura compartilhada entre `setup` e `doctor`, sem estado gravado como verdade.

## Regras de negócio

- O maestro não executa skills conversacionais; cria as condições para o agente executá-las.
- Instalação sempre no projeto atual, nunca global.
- O doctor nunca escreve.

## Critérios de aceitação

- Dado um projeto com `.specsfy/` mas sem `PROJECT.md`, quando uma sessão do Claude Code inicia, então o contexto recebe a instrução de executar `/specsfy-setup`.
- Dado um projeto completamente configurado, quando uma sessão inicia, então o `SessionStart` fica silencioso.
- Dado `.claude/skills` apagado após um setup anterior, quando `maestro setup` roda, então as skills são reinstaladas sem nova pergunta de aprovação.
- Dado `maestro doctor` num projeto com hook de matcher inválido, então o item aparece como `FAIL` e o exit code é ≠0.
- Dado `maestro doctor` num projeto instalado mas sem rastros do `specsfy-setup`, então o item aparece como `WARN` com a instrução de executar a skill.
- Dado o layout pós-normalização (BACKLOG-0012), quando `specsfy install --json` roda, então devolve `changed: 0`; e a lógica do matt-pocock encontra `## Agent skills` em `AGENTS.md`.
- Dado um sub-doctor ausente (binário não instalado), então o doctor reporta o subsistema como ausente sem abortar os demais.

## Qualidades e operação

- Segurança: doctor read-only.
- Privacidade: não aplicável.
- Desempenho e volume: dois subprocessos a mais por `setup`; sub-doctors com timeout.
- Auditoria e observabilidade: relatório do doctor por camada e por subsistema.

## Dependências

- BACKLOG-0011 e BACKLOG-0012 (o doctor verifica os artefatos que eles definem).
- SPEC-0021 (doctor de documentação) — evitar duplicar a camada de diagnóstico.

## Situações de erro

- Sub-doctor com exit ≠0 ou timeout: registrado como `FAIL` daquele subsistema, sem interromper os outros.
- Instalador de Specsfy/skills falhando: relatório com a razão original (stderr), como hoje.

## Escopo

- Dentro: critério de configurado, `setup-check`, README/relatório, remoção do short-circuit dos instaladores, doctor orquestrador, função pura de layout esperado.
- Fora: executar skills conversacionais; `doctor --fix`; mudanças nos sub-doctors upstream.

## Dúvidas, decisões e riscos

- Decisão: doctor não repara (Q15).
- Decisão: layout esperado por função pura (Q16).
- Risco: `specsfy doctor` cobre só pré-requisitos; a verificação de configuração do Specsfy é o `monitor_context.mjs --check` — avaliar na spec se o doctor também o invoca.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Promover com `$specsfy-03-specify` após BACKLOG-0011 e BACKLOG-0012.
