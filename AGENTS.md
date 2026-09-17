<!-- specsfy:framework:start -->
## Framework Specsfy

Leia e siga integralmente `.specsfy/Spec.md` antes de trabalhar com
backlogs, refinamentos do backlog, especificações, tarefas, testes ou implementação. Esse
arquivo contém o fluxo, os caminhos canônicos e os gates do framework.

- Preserve as instruções próprias deste projeto.
- O diretório do projeto é o caminho informado durante `$specsfy-setup`. Use-o
  em toda leitura e escrita posterior. Se ele estiver dentro de um Hub, não
  promova o trabalho para a raiz Git nem crie contexto, specs ou código fora
  desse caminho.
- Leia `PROJECT.md`, `DESIGNSYSTEM.MD`, `.specsfy/STACK.md`,
  `.specsfy/RULES.md`, `.specsfy/DATABASE.md`, `.specsfy/PACKAGES.md` e
  `.specsfy/USER-PROFILE.md` como contexto persistente antes de planejar
  mudanças.
- Antes de perguntar, consulte `.specsfy/USER-PROFILE.md`, a conversa atual e
  as fontes do projeto. Não repita uma pergunta cuja resposta já esteja
  confirmada; registre respostas novas no perfil com a fonte e o alcance.
- Quando `.specsfy/SPECKIT.md` existir, leia
  `.specify/memory/constitution.md` e cada fonte do GitHub Spec Kit listada na
  projeção. Preserve `.specify/` e os artefatos já existentes em `specs/`; o
  Specsfy não os migra nem os substitui.
- Antes de iniciar qualquer skill do framework, execute obrigatoriamente
  `$specsfy-setup` para verificar e reconciliar o contexto e os blocos
  reservados. A própria `$specsfy-setup` não se chama recursivamente. Em uma
  transição automática, execute-a de novo com a mesma raiz já confirmada antes
  de carregar a skill de destino. Execute `$specsfy-documentator` quando
  `PACKAGES.md` estiver ausente ou desatualizado.
- Execute o monitor de contexto no início, após cada tarefa e antes de concluir
  a entrega; resolva todo resultado `PENDING`.
- Use as skills `specsfy-aux-*` para manter stack, regras e banco sem apagar
  conteúdo humano.
- Execute `$specsfy-documentator` depois de cada implementação para reconstruir
  a documentação técnica completa em `docs/` e o registro de dependências em
  `.specsfy/PACKAGES.md`.
- Use `specs/inbox/` para capturas imediatas ainda não refinadas.
- Use `specs/backlog/` para itens refináveis ainda não promovidos.
- Use `specs/<estado>/<NNNN>-<slug>/spec.md` como fonte normativa de cada
  fatia, em uma única pasta de estado.
- Não crie `plan.md`, `tasks.md`, `research.md` ou outra fonte normativa
  paralela.
<!-- specsfy:framework:end -->
<!-- maestro:extension:router:start -->
## maestro

To create, adjust or repair a local extension (a hook, a rule, or this
router itself), trigger the `maestro-extension-creator` skill
instead of reading `.maestro/extensions/` directly.
<!-- maestro:extension:router:end -->
<!-- maestro:extension:config-language-rule:start -->
## maestro: language

Read `.maestro/config.yaml` before generating a document or deciding
what language to answer in. Reply in the conversation's language. Write a
generated document in `language.default`, unless its path matches one of
`language.exceptions`. Notice when the conversation reveals a value that
`config.yaml` is missing or has out of date, and offer to update it.
<!-- maestro:extension:config-language-rule:end -->
<!-- maestro:extension:hooks-fallback:start -->
## maestro: hooks fallback

These hooks run on their own; each line applies only in the condition it names.

- `guard-destructive`, `guard-secrets` and `protect-authorship` guard shell commands in any tool; if `maestro doctor` reports one of them absent or inert, review destructive commands, credential reads and commit trailers yourself before running them.
- `code-review-graph-update` keeps the code graph current after any edit and `graph-hint` points at it once per session; if `maestro doctor` reports them absent or inert, refresh the graph yourself after editing and prefer it over bulk Grep.
- `guard-docs` keeps the Specsfy documentator build from overwriting docs/; if `maestro doctor` reports it absent or inert, run that script only with `--check`.
<!-- maestro:extension:hooks-fallback:end -->
