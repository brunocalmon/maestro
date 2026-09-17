# Backlog: Hooks resistentes a qualquer ferramenta e regras só como fallback sem overlap

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0014 |
| Status | Promoted |
| Produto | Maestro |
| Épico | Setup confiável em projetos consumidores (hooks, instruções, skills, doctor) |
| Funcionalidade | Hooks resistentes e regras-fallback sem overlap |
| Tipo | Técnico + regra |
| Prioridade | Alta — antes de BACKLOG-0013 (decisão do usuário) |
| Milestones | |
| Criado em | 2026-09-17 |
| Spec promovida | specs/completed/0023-hooks-resistentes-e-regras-fallback-sem-overlap/spec.md |

## Ideia original

o hook deve ser resistente a todas as possibilidades, seja bash, seja tool zsh... a ideia de usa hook é não inflar contexto com regra que pode ser automatizada, mas se regra for necessaria para fallback, beleza, e não é só esse hook, todos os hooks precisam ser resistentes, até pq n adianta nada usar o context-mode/code-review-graph ou qualquer cli que eu queira usar se na hora da leitura para pesquisa, discovery e etc ele n faz usar e isso precisa tbm ser garantido, seja por hook, seja por regra... eu prefiro que tenha hook que já processe tudo evitando gasto de token e uso de contexto, mas se rules for necessario mesmo é que vc que me diz, mas tem que tomar cuidado com overlap, se o hook funcionar a rule n deve re-impor o que foi feito, apenas garantir que nada passa batido.

## Problema percebido

Os guards só interceptam o tool Bash (campo tool_input.command): shells via MCP (context-mode ctx_execute/ctx_batch_execute, terminal run_in_terminal, playwright browser_run_code_unsafe) e subagentes passam sem guarda. O code-review-graph-update só dispara em Edit|Write|MultiEdit|NotebookEdit; edições via Bash/MCP não atualizam o grafo (ficou parado de 30/08 a 17/09). Nenhum hook garante o uso do code-review-graph em pesquisa/discovery. Regras em texto inflam contexto e podem repetir o que o hook já faz.

## Pessoa afetada ou beneficiada

O mantenedor do maestro e qualquer agente em projeto consumidor que use context-mode, code-review-graph ou outro CLI adotado pelo usuário; subagentes incluídos.

## Resultado ou valor esperado

Todo hook do maestro cobre qualquer ferramenta que execute ou edite (extração de command/code/script por tool_name); o grafo é atualizado silenciosamente após qualquer edição e ao fim da rodada; uma dica única por sessão lembra o grafo antes de Grep/Glob quando ele existe; regras existem só como fallback condicional ao doctor, sem descrever o que o hook já executa; o doctor verifica a cobertura hook ↔ regra.

## Contexto

Origem: specs/inbox/2026-09-17-160600-hooks-resistentes-a-qualquer-ferramenta-e-uso-garantido-dos-clis-em-pesquisa-com-regras-so-como-fallback-sem-overlap.md. Depende de SPEC-0022 (tools: no frontmatter, scripts em arquivo) e precede BACKLOG-0013 (o doctor precisa saber a cobertura de cada hook). Decisão do usuário em 2026-09-17: backlog próprio, executado antes da 0013.

## Referências relacionadas

- `specs/inbox/2026-09-17-160600-hooks-resistentes-a-qualquer-ferramenta-e-uso-garantido-dos-clis-em-pesquisa-com-regras-so-como-fallback-sem-overlap.md` — origem (Inbox).
- `specs/completed/0022-hooks-do-maestro-validos-no-claude-code/spec.md` — spec relacionada: `tools:` no frontmatter, scripts em `.maestro/hooks/`, projeção do context-mode e preâmbulo que extrai `command`/`file_path` do JSON.
- `specs/backlog/0013-doctor-orquestrador-e-criterio-de-setup-completo-instalado-e-configurado.md` — backlog relacionado: o doctor passa a verificar a cobertura hook ↔ regra definida aqui; este item vem antes.
- `specs/backlog/0012-normalizacao-agents-md-claude-md-e-projecao-de-skills-agents-para-claude.md` — backlog relacionado: as regras-fallback vivem no bloco router que a 0012 move para `AGENTS.md`.
- `node_modules/context-mode/hooks/hooks.json` — cobertura de ferramentas que o upstream já usa (`Bash|Read|Grep|WebFetch|Agent|mcp__…`).
- `resources/hooks/*.md` — os 5 hooks canônicos a tornar resistentes.

## Comportamento esperado

1. O preâmbulo dos scripts extrai o comando a partir de `tool_name` e dos campos `command`, `code` ou `script` de `tool_input` (Bash, `mcp__…ctx_execute`, `mcp__…ctx_batch_execute`, `mcp__terminal__run_in_terminal`, `mcp__…browser_run_code_unsafe` e equivalentes), e o caminho a partir de `file_path`/`path`.
2. `guard-destructive`, `guard-secrets` e `protect-authorship` declaram `tools: Bash|mcp__.*(execute|run|shell|terminal).*` e bloqueiam nos mesmos casos em qualquer dessas ferramentas.
3. `code-review-graph-update` dispara em `PostToolUse` para `Edit|Write|MultiEdit|NotebookEdit|Bash|mcp__.*` e só executa `update --brief` quando o working tree mudou desde a última execução (hash de `git status --porcelain` em `.maestro/state/`); um segundo hook em `Stop` fecha a rodada. Saída suprimida: zero contexto gasto.
4. Um hook `PreToolUse` em `Grep|Glob` injeta, **uma única vez por sessão** e só se `.code-review-graph/` existir, uma dica curta apontando `code-review-graph search/impact`; sem grafo, silêncio.
5. Hooks valem para subagentes (escopo de projeto); a spec registra a verificação.
6. `.specsfy/RULES.md` e o bloco router recebem no máximo três regras-fallback, cada uma no formato "o hook X garante Y; se `maestro doctor` reportar X ausente ou inerte, faça Y manualmente" — nenhuma descreve o comportamento que o hook já executa.
7. O doctor (BACKLOG-0013) verifica que cada regra-fallback aponta para um hook instalado e ativo e que cada hook cobre as ferramentas que a regra assume.

## Regras de negócio

- Preferência por automação: uma regra só existe quando o hook não consegue garantir o resultado sozinho.
- Sem overlap: hook ativo torna a regra inerte por construção.
- Nenhum hook injeta contexto a cada chamada; dicas são únicas por sessão.

## Critérios de aceitação

- Dado um comando destrutivo enviado via `mcp__…ctx_execute` com `language: shell`, quando o hook dispara, então ele é bloqueado com a mesma mensagem que no `Bash`.
- Dado um `git commit` com trailer de IA via `mcp__terminal__run_in_terminal`, quando o hook dispara, então é bloqueado.
- Dado um arquivo alterado por `sed -i` via `Bash`, quando o `PostToolUse` termina, então `code-review-graph update` roda e o grafo reflete a mudança; uma chamada seguinte sem mudança no working tree não executa o CLI.
- Dado uma sessão com `.code-review-graph/`, quando o agente usa `Grep` pela primeira vez, então recebe a dica uma vez; na segunda vez, nada é injetado.
- Dado um projeto sem grafo, quando o agente usa `Grep`, então nada é injetado.
- Dado um subagente executando `Bash` destrutivo, quando o hook dispara, então o bloqueio ocorre igual ao agente principal.
- Dado `RULES.md` com as regras-fallback e todos os hooks ativos, quando o doctor roda, então nenhuma regra é reportada como órfã; removido um hook, a regra correspondente é reportada como "fallback ativo".

## Qualidades e operação

- Segurança: fecha o desvio dos guards por ferramentas MCP de shell.
- Privacidade: não aplicável.
- Desempenho e volume: hook amplo em `PostToolUse` custa um `git status --porcelain` por chamada; `update` só quando há mudança.
- Auditoria e observabilidade: estado em `.maestro/state/` e relatório do doctor.

## Dependências

- SPEC-0022 (mecanismo `tools:`, scripts em arquivo).
- BACKLOG-0013 para a verificação no doctor (este item define a cobertura; a 0013 a confere).

## Situações de erro

- `code-review-graph` ausente: hook silencioso, doctor reporta.
- JSON do evento sem `command`/`code`/`script`: guard permite (não há comando a avaliar) e registra nada.
- `.maestro/state/` não gravável: hook cai para executar sempre o `update`.

## Escopo

- Dentro: extração resistente, `tools:` dos guards, `code-review-graph-update` amplo + `Stop`, dica única por sessão, regras-fallback, verificação de subagentes.
- Fora: negar `Grep`/`Read` para forçar o grafo; alterar o context-mode upstream; doctor em si (0013).

## Dúvidas, decisões e riscos

- Decisão do usuário (2026-09-17): backlog próprio, executado antes da 0013; hook resolve, regra só como fallback sem overlap.
- Default reversível: dica do grafo por sessão (não por prompt), para não inflar contexto.
- Default reversível: lista inicial de ferramentas MCP de shell = as observadas nesta máquina (`ctx_execute`, `ctx_batch_execute`, `run_in_terminal`, `browser_run_code_unsafe`); o regex cobre variantes.
- Risco: latência do hook amplo; medir na implementação.
- Conflito potencial: dica do maestro vs orientação do context-mode em `PreToolUse`; a do maestro é única por sessão e só sobre o grafo.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Promover com `$specsfy-03-specify` antes de BACKLOG-0013.
