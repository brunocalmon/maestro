# Backlog: Hooks do maestro válidos no Claude Code: matcher, identidade, merge e despacho

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0011 |
| Status | Promoted |
| Produto | Maestro |
| Épico | Setup confiável em projetos consumidores (hooks, instruções, skills, doctor) |
| Funcionalidade | Fatia 1 de 3 derivadas da Inbox 2026-09-17-105213 |
| Tipo | Técnico (defeito) |
| Prioridade | Alta — defeito ativo em projeto consumidor |
| Milestones | |
| Criado em | 2026-09-17 |
| Spec promovida | specs/completed/0022-hooks-do-maestro-validos-no-claude-code/spec.md |

## Ideia original

Defeito real encontrado: os hooks do maestro nunca disparam no Claude Code. Em src/hooks/claude-code.ts o maestro escreve matcher: h.name — ou seja, "matcher": "guard-destructive", "protect-authorship", "setup-check". No Claude Code, matcher é um regex contra o nome da ferramenta (Bash, Edit, Write…), e para SessionStart contra startup|resume|clear. Nenhum desses nomes bate, então nenhum dos 8 hooks executa. Consequência direta: o hook antigo protect-authorship — que tinha "matcher": "Bash" e funcionava — foi substituído pela versão do maestro com matcher inválido. A proteção contra Co-Authored-By está desativada na prática.

## Problema percebido

Quatro defeitos independentes na geração de hooks para Claude Code: (1) matcher recebe o nome do hook em vez do nome da ferramenta/evento; (2) writeSettings substitui o array inteiro de cada evento, apagando hooks de terceiros no mesmo evento (foi assim que o protect-authorship funcional sumiu); (3) o wrapper consome stdin (HOOK_INPUT=$(cat)) e não repassa o JSON aos hooks de despacho como context-mode; (4) o vocabulário de 4 eventos canônicos não cobre o que o context-mode precisa (PreToolUse em Bash|Read|Grep|WebFetch, PreCompact, UserPromptSubmit). Além disso o caminho absoluto do binário é congelado no setup e quebra em rename/move (evidência: common-rules-server no settings.json deste repo).

## Pessoa afetada ou beneficiada

Pessoas que rodam maestro setup em projetos consumidores e dependem dos guards (destrutivo, segredos, autoria) e da integração context-mode/code-review-graph; o mantenedor do maestro.

## Resultado ou valor esperado

Todos os hooks entregues pelo maestro disparam de fato no Claude Code, com identidade própria reconhecível para merge idempotente, sem apagar hooks de outras origens, com stdin íntegro para hooks de despacho e com caminho de binário resiliente a rename/move. Instalações antigas com formato inline são migradas automaticamente.

## Contexto

Origem: specs/inbox/2026-09-17-105213-hooks-do-maestro-com-matcher-invalido-no-claude-code-e-setup-que-instala-sem-configurar-specsfy-e-skills.md. Decisões tomadas em sessão de grill em 2026-09-17 (Q1-Q5, Q9, Q18-Q20). Primeira das três fatias derivadas da mesma captura; passa na frente de BACKLOG-0010/SPEC-0021 por ter consequência ativa em projeto consumidor.

## Referências relacionadas

- `specs/inbox/2026-09-17-105213-hooks-do-maestro-com-matcher-invalido-no-claude-code-e-setup-que-instala-sem-configurar-specsfy-e-skills.md` — origem (Inbox).
- `specs/completed/0003-fatia-1b-setup-hooks/spec.md` — spec relacionada: definiu o formato inline atual (preâmbulo/fragmento/postâmbulo) e o matcher por nome.
- `specs/completed/0011-extensoes-locais-reparo-assistido/spec.md` — spec relacionada: registro por checksum e quarentena reutilizados para os scripts de hook.
- `specs/backlog/0012-normalizacao-agents-md-claude-md-e-projecao-de-skills-agents-para-claude.md` — backlog relacionado: depende dos hooks `SessionStart`/`PostToolUse` desta fatia para a projeção de skills.
- `specs/backlog/0013-doctor-orquestrador-e-criterio-de-setup-completo-instalado-e-configurado.md` — backlog relacionado: o doctor verifica matchers e identidade definidos aqui.
- `docs/integrations.md` — documentação relacionada (hooks do Claude Code).
- `node_modules/context-mode/hooks/hooks.json` — fonte upstream dos matchers e eventos do context-mode.

## Comportamento esperado

1. `maestro setup` grava cada hook como script em `.maestro/hooks/<name>.sh`, registrado por checksum no registro de extensões; `.claude/settings.json` só referencia o script (`"$CLAUDE_PROJECT_DIR/.maestro/hooks/<name>.sh"`).
2. O `matcher` deriva do evento canônico por mapa fixo (`before-shell → "Bash"`, `after-file-edit → "Edit|Write|MultiEdit|NotebookEdit"`, `stop` e `session-start` → sem matcher) e pode ser sobrescrito por `tools:` no frontmatter do hook.
3. O vocabulário canônico é ampliado (`before-tool`, `after-tool`, `before-compact`, `on-prompt`, além dos atuais). Cada adaptador declara os eventos que suporta; hook em evento não suportado é reportado como pulado, nunca silenciado.
4. `writeSettings` substitui somente as entradas identificadas como do maestro e preserva todas as outras no mesmo evento.
5. Hooks de despacho (`raw_command`) não recebem wrapper: o `command` é o binário direto, com stdin intacto e exit code próprio.
6. Os hooks do context-mode são projetados a partir do `hooks/hooks.json` do pacote `context-mode` instalado, não de arquivos `.md` mantidos pelo maestro.
7. O caminho do binário é resolvido em tempo de execução por um shim: tenta o caminho gravado no setup e cai para `PATH`.
8. Entradas no formato antigo (matcher igual a um nome de hook do maestro **e** comando contendo `>>> hook fragment`) são reconhecidas como do maestro e substituídas na migração.

## Regras de negócio

- A identidade de um hook do maestro nunca depende do `matcher`.
- O maestro nunca remove nem reescreve uma entrada de hook que não reconheça como sua.
- Um hook com `blocking: true` continua emitindo `exit 2` com mensagem em stderr.
- Scripts em `.maestro/hooks/` são conteúdo gerenciado: drift detectado por checksum segue o fluxo de quarentena existente.

## Critérios de aceitação

- Dado um projeto consumidor com Claude Code, quando `maestro setup` roda, então `guard-destructive`, `guard-secrets` e `protect-authorship` ficam em `PreToolUse` com matcher `Bash` e um `git commit` com trailer `Co-Authored-By: Claude` é bloqueado.
- Dado um `settings.json` com uma entrada `PreToolUse` de terceiro (por exemplo `matcher: "Bash"` com comando próprio), quando `maestro setup` roda, então a entrada de terceiro permanece intacta e as do maestro são adicionadas ao lado.
- Dado um `settings.json` no formato antigo (8 entradas com matcher = nome do hook e `>>> hook fragment`), quando `maestro setup` roda, então as 8 entradas antigas são removidas e substituídas pelo novo formato, sem duplicatas.
- Dado o hook de despacho do context-mode, quando o Claude Code dispara `PreToolUse` em `Read`, então o binário recebe no stdin o JSON original do evento.
- Dado o `hooks/hooks.json` do context-mode instalado, quando o maestro projeta os hooks, então eventos e matchers em `settings.json` coincidem com os do upstream.
- Dado um projeto renomeado/movido depois do setup, quando um hook dispara, então o shim resolve o binário por `PATH` e o hook executa.
- Dado um hook declarando um evento que o adaptador Antigravity não suporta, quando `maestro setup --target antigravity` roda, então o relatório lista o hook como pulado.

## Qualidades e operação

- Segurança: guards voltam a funcionar; nenhuma regressão no comportamento de `deny`/`ask`.
- Privacidade: não aplicável.
- Desempenho e volume: scripts em arquivo reduzem o tamanho do `settings.json`; sem subprocesso adicional no setup.
- Auditoria e observabilidade: registro de extensões cobre os scripts; relatório do setup lista hooks instalados, migrados e pulados.

## Dependências

- Registro de extensões e quarentena (SPEC-0011).
- Pacote `context-mode` instalado localmente (fonte do `hooks.json`).

## Situações de erro

- `hooks.json` do context-mode ausente ou ilegível: relatar e instalar os demais hooks.
- `settings.json` inválido: tratar como ausente, nunca apagar (comportamento atual preservado).
- Script de hook com drift: quarentena, não sobrescrita silenciosa.

## Escopo

- Dentro: tradução, identidade, merge, despacho, vocabulário de eventos, shim de caminho, migração do formato antigo, testes de regressão.
- Fora: normalização de `AGENTS.md`/`CLAUDE.md` (BACKLOG-0012); doctor (BACKLOG-0013); conteúdo dos guards em si.

## Dúvidas, decisões e riscos

- Decisão: scripts em `.maestro/hooks/`, agnóstico de target (Q18).
- Decisão: fonte dos hooks do context-mode é o `hooks.json` upstream (Q20).
- Risco: `tests/setup-writes.test.ts` lê o nome pelo `matcher`; será reescrito.
- Risco: hooks já instalados em consumidores com o formato inline dependem da regra de migração (Q19).

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Promover com `$specsfy-03-specify`.
