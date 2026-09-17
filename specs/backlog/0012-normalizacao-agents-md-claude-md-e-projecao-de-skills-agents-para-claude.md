# Backlog: Normalização AGENTS.md ↔ CLAUDE.md e projeção de skills de .agents para .claude

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0012 |
| Status | Promoted |
| Produto | Maestro |
| Épico | Setup confiável em projetos consumidores (hooks, instruções, skills, doctor) |
| Funcionalidade | Fatia 2 de 3 derivadas da Inbox 2026-09-17-105213 |
| Tipo | Regra + técnico |
| Prioridade | Média — após BACKLOG-0011 |
| Milestones | |
| Criado em | 2026-09-17 |
| Spec promovida | specs/completed/0024-normalizacao-agents-claude-e-projecao-de-skills/spec.md |

## Ideia original

O specsfy adiciona as regras no AGENTS.md e uma referencia no CLAUDE.md, muito inteligente pois mantem a compatilidade generica de IDE e a especifica do CLAUDE... já o maestro faz o caminho invertido, isso é definitivamente uma inconsistencia ele deveria seguir o metodo do specsfy a referencia é do CLAUDE para o AGENTS, já o matt_pocock é pior ainda, ele ao reconhecer o claude só cria as linhas ali no CLAUDE.md nada no AGENTS.md, o maestro deve padronizar isso, ou seja, intercepta e joga pro AGENTS.md e deixa apenas as referencias ali no CLAUDE. Outra coisa que eu percebi, ao baixar especialistas do specsfy ele apenas baixa no .agents, o .claude não recebe ou seja, as skills specialists do specsfy nunca vão pro claude.

## Problema percebido

Três ferramentas escrevem instruções em direções diferentes: Specsfy (conteúdo em AGENTS.md, @-import em CLAUDE.md), maestro (conteúdo em CLAUDE.md, ponteiro em prosa em AGENTS.md — src/extensions/router.ts) e matt-pocock (edita só CLAUDE.md quando existe). Especialistas Specsfy são instalados com --agent universal em .agents/skills, e o Claude Code 2.1.273 não lê essa pasta (verificado no binário: a referência a .agents/skills é o importador de config do Cursor, que copia sob demanda; confirmado empiricamente em projeto consumidor). O sync atual do maestro só copia .claude → .agents.

## Pessoa afetada ou beneficiada

Pessoas que usam Claude Code e outras IDEs no mesmo projeto consumidor; agentes que carregam instruções de AGENTS.md/CLAUDE.md; quem instala especialistas Specsfy e espera usá-los na sessão do Claude.

## Resultado ou valor esperado

Uma única direção: conteúdo completo em AGENTS.md, CLAUDE.md com uma linha @AGENTS.md. Blocos invertidos do próprio maestro migram automaticamente; o bloco ## Agent skills do matt-pocock é movido quando ficou em CLAUDE.md e rastreado como foreign; blocos specsfy:* nunca são tocados. .agents/skills é a única fonte canônica de skills (matt-pocock passa a instalar com -a universal) e o maestro projeta para .claude/skills no setup, no SessionStart e ao detectar skills add/specsfy skills em Bash, sem sobrescrever cópia editada à mão.

## Contexto

Origem: specs/inbox/2026-09-17-105213-hooks-do-maestro-com-matcher-invalido-no-claude-code-e-setup-que-instala-sem-configurar-specsfy-e-skills.md. Decisões tomadas em sessão de grill em 2026-09-17 (Q10-Q14, Q17, Q23-Q25). Segunda fatia; depende fracamente da primeira (hooks SessionStart/PostToolUse para projeção).

## Referências relacionadas

- `specs/inbox/2026-09-17-105213-hooks-do-maestro-com-matcher-invalido-no-claude-code-e-setup-que-instala-sem-configurar-specsfy-e-skills.md` — origem (Inbox).
- `specs/inbox/2026-08-29-155551-skills-do-mattpocock-como-dependencia-instalada-pelo-setup.md` — inbox relacionada: origem da instalação via `skills add`.
- `specs/completed/0005-fatia-1h-skills-lado-a-lado/spec.md` — spec relacionada: instalação e registro de skills.
- `specs/completed/0011-extensoes-locais-reparo-assistido/spec.md` — spec relacionada: blocos por checksum, quarentena e `createExtension`.
- `specs/completed/0012-regra-common-rules-idioma-padrao-e-config-yaml-sempre-presente/spec.md` — spec relacionada: bloco de idioma que também será invertido.
- `specs/backlog/0011-hooks-do-maestro-validos-no-claude-code-matcher-identidade-merge-e-despacho.md` — backlog relacionado: fornece os hooks `SessionStart`/`PostToolUse` usados pela projeção.
- `specs/backlog/0013-doctor-orquestrador-e-criterio-de-setup-completo-instalado-e-configurado.md` — backlog relacionado: o doctor valida a direção dos blocos e as projeções.
- `src/extensions/router.ts` — conteúdo atual dos blocos e ponteiros.

## Comportamento esperado

1. Os blocos do maestro (`router`, `config-language-rule`) passam a ter conteúdo completo em `AGENTS.md`; `CLAUDE.md` recebe uma única linha `@AGENTS.md`.
2. Projetos com blocos na direção antiga migram automaticamente quando o checksum registrado bate; conteúdo divergente vai para quarentena pelo mecanismo existente.
3. O bloco router instrui o agente: qualquer skill que edite `CLAUDE.md` coloca o conteúdo em `AGENTS.md` e deixa só referência.
4. `maestro setup` move blocos de assinatura conhecida (tabela inicial: `## Agent skills` do matt-pocock) de `CLAUDE.md` para `AGENTS.md`; blocos `specsfy:*` nunca são tocados; conteúdo desconhecido não é movido.
5. Bloco movido é registrado como *foreign* (checksum) — detectável, nunca sobrescrito nem reparado pelo maestro.
6. `.agents/skills` é a única fonte canônica; matt-pocock passa a ser instalado com `-a universal`; a projeção é sempre `.agents → .claude`.
7. A projeção roda em `maestro setup`, no hook `SessionStart` e no hook `PostToolUse(Bash)` ao detectar `skills add` ou `specsfy skills`.
8. Projeções são registradas em `install.json` com checksum; cópia em `.claude/skills` cujo checksum difere do registrado é tratada como editada à mão: não é sobrescrita e é reportada.

## Regras de negócio

- O maestro nunca edita dentro de blocos delimitados de outras ferramentas.
- O maestro instala somente no projeto atual, nunca global.
- Projeção é cópia idempotente e não é comando externo: não exige aprovação.

## Critérios de aceitação

- Dado um projeto novo, quando `maestro setup` roda, então `AGENTS.md` contém os blocos completos do maestro e `CLAUDE.md` contém `@AGENTS.md` uma única vez.
- Dado um projeto com blocos na direção antiga e checksum íntegro, quando `maestro setup` roda, então os blocos migram sem intervenção e sem duplicar conteúdo.
- Dado um projeto com bloco do maestro editado à mão, quando `maestro setup` roda, então o conteúdo vai para `.maestro/quarantine/` e o relatório informa.
- Dado `CLAUDE.md` com `## Agent skills` escrito pelo matt-pocock, quando `maestro setup` roda, então o bloco passa a existir em `AGENTS.md`, sai de `CLAUDE.md` e fica registrado como foreign.
- Dado `CLAUDE.md` com conteúdo humano sem assinatura conhecida, quando `maestro setup` roda, então esse conteúdo permanece onde está.
- Dado um especialista instalado em `.agents/skills` durante a sessão via `npx skills add`, quando o hook `PostToolUse` dispara, então a skill existe em `.claude/skills` na mesma sessão.
- Dado uma skill em `.claude/skills` editada à mão, quando a projeção roda, então a cópia não é sobrescrita e o doctor reporta a divergência.
- Dado `skills add mattpocock/skills -a universal`, quando comparado com `-a claude-code`, então o `SKILL.md` produzido é idêntico (verificação a registrar na implementação).

## Qualidades e operação

- Segurança: nenhum conteúdo humano é apagado; drift vai para quarentena.
- Privacidade: não aplicável.
- Desempenho e volume: projeção é cópia de diretórios; aceitável em `SessionStart`.
- Auditoria e observabilidade: `install.json` registra projeções e blocos foreign; relatório do setup lista migrações e movimentações.

## Dependências

- BACKLOG-0011 (hooks `SessionStart` e `PostToolUse` funcionais).
- Mecanismo de extensões e quarentena (SPEC-0011).

## Situações de erro

- `AGENTS.md` ausente: criado com os blocos do maestro.
- `CLAUDE.md` já contém `@AGENTS.md`: não duplicar.
- `## Agent skills` presente nos dois arquivos: manter o de `AGENTS.md`, remover o de `CLAUDE.md` só se idêntico; caso contrário reportar.

## Escopo

- Dentro: direção dos blocos, migração, interceptação do matt-pocock, tabela de assinaturas, canonicidade de `.agents/skills`, projeção e registro.
- Fora: mudanças no upstream `mattpocock/skills`; doctor (BACKLOG-0013); conteúdo dos blocos.

## Dúvidas, decisões e riscos

- Decisão: referência em `CLAUDE.md` é `@AGENTS.md` (Q10). Risco conhecido: conteúdo humano duplicado nos dois arquivos entra duas vezes no contexto; o doctor reporta.
- Decisão: apenas assinaturas conhecidas são movidas (Q13).
- Fato verificado: Claude Code 2.1.273 não lê `.agents/skills`; a referência no binário é o importador do Cursor.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Promover com `$specsfy-03-specify` após BACKLOG-0011.
