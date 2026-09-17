# maestro

Um wrapper de linha de comando que orquestra subsistemas e agentes de
codificação a partir de um contrato verificável de dependências.

Pacote npm `@brunocalmon/maestro`, binário `maestro`.

## O que existe hoje

**Cinco comandos e um servidor de protocolo, e nada além disso.**

| Comando | O que faz |
| --- | --- |
| `maestro --version` | Imprime a versão declarada no manifesto |
| `maestro doctor` | Relata as três dependências do projeto e os backends de agente detectados, com camada, origem resolvida e versão, os conjuntos de skills registrados, nomeando o que divergiu, cada extensão local divergente do que a CLI gravou, e o identificador da última execução. Desde a SPEC-0025, também orquestra os diagnósticos dos quatro subsistemas (`specsfy doctor`, `context-mode doctor`, `skills list`, `code-review-graph status`, cada um com seu próprio status) e adiciona uma camada própria: hooks com entrada legada ou script ausente, blocos na direção antiga, marcadores de âncora sem par, seções não padronizadas em `CLAUDE.md`, projeções de skills divergentes, cobertura entre `hooks-fallback` e os scripts instalados, e rastros pendentes do `specsfy-setup`/`setup-matt-pocock-skills`. Só reporta — nunca escreve — e sai com código diferente de zero somente para achados `FAIL`; achados `WARN` (configuração conversacional pendente, conteúdo não padronizado) nunca afetam o código de saída. |
| `maestro setup` | Instala os sete hooks no editor detectado, instala os dois conjuntos de skills e o framework Specsfy, escreve o roteador do `maestro` em `CLAUDE.md`/`AGENTS.md`, e registra o que escreveu, identificando a execução e o momento. Also creates and keeps `.maestro/config.yaml` always complete. |
| `maestro recommend` | Recomenda um backend de agente presente e, quando o `ollama` está disponível, o maior modelo local que cabe na memória livre, com override humano opcional |
| `maestro extension create` | Cria um artefato de extensão local (`override`/`extension`, nunca `new` para um dos sete hooks gerenciados) — hook, regra ou o próprio roteador — que sobrevive a uma reinstalação |
| `maestro extension repair` | Move o conteúdo de uma extensão divergente para `.maestro/quarantine/` e restaura o original, sem apagar nada |

**Aprovação do plano, em lote.** `maestro setup` apresenta o plano e aguarda aprovação antes de escrever — interativa quando há terminal, por documento JSON pela entrada padrão quando não há. Recusa, ausência e entrada malformada são negativa, sem escrita. O plano lista cada comando de dependência que a execução de fato dispararia — hooks, instalador de skills por origem, instalador do framework Specsfy e a ponte Python, quando aplicável — não só os hooks. Um comando já aprovado antes, com o mesmo binário e argv exatos, não pede aprovação de novo, mesmo quando a execução precisa reinstalar por drift; qualquer diferença no argv, como uma versão diferente, conta como comando novo. O registro fica em `.maestro/approved-commands.json`, local ao projeto.

**Reconciliação de drift.** `setup` só relata "já estava configurado" quando hooks, skills e o framework Specsfy estão de fato presentes no disco — não só quando os hooks batem com o registro. Apagar `.claude/skills/` ou `.specsfy/` por fora e rodar `setup` de novo restaura o que faltar.

**Backends de agente.** `doctor` relata, numa terceira camada informativa, cada backend de agente candidato conhecido — presença, versão e se tem capacidade demonstrada de invocação sem interação. Suportados hoje: `pi`, `agy`, `claude`, `codex` e `goose`. Nenhum backend ausente afeta o código de saída: `maestro` detecta, nunca instala agente.

Exemplo real de `doctor`:

```text
ok      @promovaweb/specsfy — camada npm, origem local, versão 0.22.2
ok      context-mode — camada npm, origem local, versão 1.0.169
ok      code-review-graph — camada python, origem global, versão 2.3.7
```

Quarenta e cinco módulos em `src/`, 150 arquivos de teste, 388 casos.

**Language rule and an always-present `config.yaml`.** Above any dependency
(Specsfy, mattpocock or none), `setup` creates and keeps
`.maestro/config.yaml` always complete — every schema key (`language`,
`project`, `system`, `git`) present, with a real default when evidence
exists and empty otherwise, never omitted. `CLAUDE.md`/`AGENTS.md` receive
their own instruction (distinct from the extensions router) telling the
agent to reply in the conversation's language and generate a document in
`language.default`, except the paths listed in `language.exceptions`. When
Specsfy is active, the `project` fields that overlap `.specsfy/STACK.md`
sync automatically from it — `STACK.md` remains the source of truth,
`config.yaml` never diverges silently.

O `setup` liga os subsistemas ao ciclo do agente e protege o repositório. Cinco
hooks canônicos em `resources/hooks/`: dois barram comando destrutivo e
exibição de credencial, um preserva a autoria dos commits, um avisa no início da
sessão quando o setup está incompleto e um despacha o `code-review-graph`. Os
hooks do `context-mode` não são mantidos pelo maestro: são projetados do
`hooks/hooks.json` do próprio pacote instalado, com os eventos e matchers que o
upstream declara. Ele só escreve quando há evidência de uso do editor, grava um
registro do que fez e reexecutar não duplica nada.

**Como um hook chega ao Claude Code (SPEC-0022).** Cada hook com fragmento vira
um script executável em `.maestro/hooks/<nome>.sh`, registrado por checksum em
`.maestro/extensions.json`; `.claude/settings.json` só o referencia
(`"$CLAUDE_PROJECT_DIR/.maestro/hooks/<nome>.sh"`), com `matcher` derivado do
evento (`Bash` para hooks de shell, `Edit|Write|MultiEdit|NotebookEdit` para
edição de arquivo, nenhum para `Stop`/`SessionStart`) ou do `tools:` do
frontmatter — nunca do nome do hook, que o Claude Code não reconhece. Um hook de
despacho (`raw_command`) entra sem wrapper, para receber o JSON do evento no
stdin e propagar o próprio exit code, e leva um marcador `# maestro:hook=<nome>`
como identidade. O merge do `settings.json` substitui somente entradas
reconhecidas como do maestro e preserva as demais em todos os eventos; entradas
no formato inline anterior são migradas; um arquivo ilegível vai para
`.maestro/quarantine/` antes de qualquer escrita, assim como um script alterado
à mão. O binário de um despacho é resolvido em tempo de execução: caminho
gravado no setup e, se ele sumiu, o mesmo nome no `PATH`.

**Hooks resistentes a qualquer ferramenta (SPEC-0023).** O preâmbulo de cada
script extrai o comando de `command` (Bash, terminal MCP), de `code` quando a
linguagem é shell (`ctx_execute`) ou de `commands[]` (`ctx_batch_execute`), e
os guards casam `Bash|mcp__.*(execute|run_in_terminal|shell).*` — o mesmo
veredito em qualquer shell, inclusive em subagentes. `code-review-graph-update`
roda após qualquer ferramenta e só executa o CLI quando o hash do working tree
mudou (`.maestro/state/crg-tree.hash`); `code-review-graph-stop` fecha a rodada.
`graph-hint` lembra o grafo uma única vez por sessão antes de `Grep`/`Glob`, e
`guard-docs` impede o `build_documentation.mjs` do Specsfy sem `--check`
(`findings/external/FIND-EXT-001`). As regras em texto se limitam ao bloco
`maestro: hooks fallback`: três linhas condicionadas ao `maestro doctor`, que
nunca repetem o que o hook já faz.

**"Instalado" não é "configurado" (SPEC-0025).** `.maestro/install.json` e
`.specsfy/` existirem prova que os arquivos foram gravados, não que as skills
conversacionais que configuram o projeto (`specsfy-setup`, que produz
`PROJECT.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md`,
`.specsfy/USER-PROFILE.md`; `setup-matt-pocock-skills`, que produz a seção
`## Agent skills` em `AGENTS.md`) já rodaram — só um agente as executa, e
nenhum comando do `maestro` pode substituí-las. O hook `setup-check` verifica
esses rastros no início da sessão e nomeia exatamente qual skill falta;
README gerado e relatório do `setup` repetem a mesma orientação
(`next: run /specsfy-setup and/or /setup-matt-pocock-skills in your agent`)
enquanto algo estiver pendente. Os instaladores de skills e do framework
Specsfy passaram a rodar em todo `setup` onde estão configurados — são
idempotentes por construção — em vez de um atalho por presença de diretório
que não distinguia "nada mudou" de "apagado por fora e precisa reconciliar".
O layout esperado (hooks, blocos, rastros) vem de uma única função pura
(`src/setup/layout.ts`), importada tanto pelo `setup` quanto pelo `doctor`,
para que os dois nunca discordem sobre o que "esperado" significa.

Exemplo real de `setup`:

```text
24 hooks installed in .claude/settings.json
  guard-destructive — evento PreToolUse, em .claude/settings.json
  guard-secrets — evento PreToolUse, em .claude/settings.json
  context-mode-pretooluse-0 — evento PreToolUse, em .claude/settings.json
  ...
```

**Dois ecossistemas de skills lado a lado, e o framework Specsfy instalado de
verdade.** O `setup` instala as skills de `mattpocock/skills` e as de
`promovaweb/specsfy` pelo mesmo instalador oficial da vercel-labs, uma origem
por vez, em cópia real e nunca link, convivendo em `.claude/skills/` sem que
uma sobrescreva a outra. A procedência de cada conjunto fica no registro do
projeto, e o `doctor` relata a deriva sem repará-la — a referência obtida não é
fixada pela origem, e dizer isso faz parte do relato.

**Uma direção para as instruções e para as skills (SPEC-0024).** O conteúdo
do maestro (`router`, `config-language-rule`, `hooks-fallback`) vive em
`AGENTS.md`, o arquivo genérico que qualquer IDE lê; `CLAUDE.md` recebe do
maestro uma única linha, `@AGENTS.md` (import nativo do Claude Code), num bloco
próprio. Projetos instalados por versões anteriores migram sozinhos quando o
checksum registrado bate; divergência vai para `.maestro/quarantine/`. A seção
`## Agent skills` que a skill do matt-pocock escreve em `CLAUDE.md` é movida
para `AGENTS.md` e registrada como conteúdo de terceiro (`foreign`): rastreada
por checksum, nunca reescrita. Blocos `specsfy:*` e texto sem assinatura
conhecida não são tocados. As skills têm uma fonte canônica, `.agents/skills`
(o instalador usa `-a universal`), e o maestro projeta cada uma para
`.claude/skills` no `setup` (com checksum em `install.json`, sem sobrescrever
cópia editada à mão) e por dois hooks de cópia aditiva — no início da sessão e
logo após `skills add`/`specsfy skills` — porque o Claude Code não lê
`.agents/skills` (`findings/external/FIND-EXT-002`).

Separadamente, o mesmo `setup` executa o instalador de projeto do próprio
framework Specsfy (`specsfy install --project <raiz>`), deixando `.specsfy/`,
`.agents/skills/`, `CLAUDE.md` e `AGENTS.md` presentes e atualizados — quem
compõe o conteúdo desses arquivos é o instalador do próprio Specsfy. Por cima
disso, o `setup` acrescenta suas próprias seções em `AGENTS.md` e o import
`@AGENTS.md` em `CLAUDE.md`, gravados pelo mesmo caminho único de criação de
extensão, ancorados por comentário HTML e idempotentes (não reescreve quando
já presentes).

**Extensões locais e reparo assistido.** Um hotfix local — customizar um dos
sete hooks, adicionar uma regra nova, ou ajustar o próprio roteador — sobrevive
a uma reinstalação sem esperar release. `maestro extension create` grava
o conteúdo com uma âncora HTML no arquivo alvo (o próprio `CLAUDE.md`/
`AGENTS.md`, ou `.maestro/extensions/<nome>.md`) e o checksum em
`.maestro/extensions.json` — o único caminho de escrita; uma skill de
fachada (`maestro-extension-creator`) entrevista a pessoa e aciona esse
comando, nunca escreve arquivo por conta própria. Essa skill é empacotada
com o próprio `maestro` (`resources/skills/`, junto de `resources/hooks/`)
e o `setup` a entrega em `.claude/skills/`/`.agents/skills/` do projeto-alvo,
sem checksum — é conteúdo do pacote, não algo que a pessoa customiza. `doctor` relata cada
artefato cujo conteúdo real diverge do checksum registrado, sem nunca
corrigir sozinho — detectabilidade, não prevenção. `maestro extension
repair --name <nome>` move o conteúdo divergente para
`.maestro/quarantine/` (sem expiração automática) e restaura o original;
recusa o reparo inteiro se a quarentena não for gravável, em vez de reparar
pela metade.

**Seleção de modelo.** `maestro recommend` recomenda, de forma
determinística e sem rede, um backend dentre os suportados presentes (na
ordem de `pi`, `agy`, `claude`, `codex`, `goose`) e, quando o `ollama` está
disponível, o maior modelo local cujo tamanho cabe na memória livre da
máquina. Uma escolha humana explícita (`--backend`/`--local-model`) substitui
o cálculo correspondente sem revalidação. **Custo e uso de plano por backend
ficam deliberadamente fora do cálculo** — nenhum dos cinco backends
suportados expõe essa informação sem exigir login, e calculá-la exigiria
quebrar a garantia sem rede e sem autenticação que o projeto inteiro mantém;
o relatório sempre declara essa ausência em vez de silenciá-la.

**Perfis de agente configuráveis.** `.maestro/config.yaml` ganhou a seção
`maestro:`, que descreve o agente mestre e sua lista de `subagents`. Cada
agente é composto por cinco grupos — identidade, cognição, instrução,
capacidade e execução — e **cada propriedade**, não o perfil inteiro, declara
se é sugestão (o planejamento pode propor outra coisa, explicando o
trade-off) ou obrigatória (vinculante). Um perfil pode trazer qualquer
combinação: do nome sozinho ao conjunto completo. Nenhum comportamento padrão
vive embutido no código — o `setup` semeia arquivos reais em
`.maestro/subagents/<agente>/`, que a partir daí pertencem à pessoa e nunca
são sobrescritos nem cobrados por checksum. O leitor recusa em voz alta
diante de referência quebrada ou `mode` fora do domínio, nomeando perfil e
propriedade, e o `doctor` relata exatamente as mesmas divergências sem tocar
em disco. É a fundação do épico de orquestração multi-agente: sozinha, ela
configura e valida, mas ainda não executa nada.

**Seleção de modelo por janela de contexto.** A recomendação passou a
considerar, além da memória livre, se a janela de contexto do modelo comporta
o tipo de trabalho. Os tipos e a janela mínima de cada um vivem em
`.maestro/config.yaml` e são informados explicitamente — o código nunca deduz
o tipo a partir do texto da tarefa. Janela insuficiente descarta o modelo
antes da comparação por tamanho: não é uma escolha pior, é uma que falharia
na execução. Sem tipo informado, nenhuma exigência é aplicada e o
comportamento é o anterior.

**Briefing de delegação.** `maestro run <execução>` lê um plano aprovado e
emite, por agente planejado, o comportamento já composto (`behavior`
substitui o padrão, `additional_behavior` soma a ele), skills, tools e
modelo — pronto para o agente hospedeiro ler e delegar. A CLI não aciona
subagent nenhum: não tem acesso ao mecanismo da ferramenta hospedeira, e diz
isso em vez de fingir. Nada é gravado — emitir briefing não é evidência de
que algo rodou.

**Execução real via subprocesso de CLI externa.** Um agente com
`runtime: cli` agora roda de verdade: um adaptador por backend suportado
(`pi`, `agy`, `claude`, `codex`, `goose`) constrói os argumentos reais —
comportamento por flag nativa quando o backend tem uma (`pi`, `claude`,
`goose`) ou por um `AGENTS.md` temporário quando não tem (`agy`, `codex`,
sempre removido depois, sucesso ou falha), modelo repassado sem tradução,
`capability.tools` `required` recusado quando o backend não consegue
restringir tools. `execution.cli_backend` escolhe qual dos cinco; ausente,
usa o primeiro presente na ordem fixa da `SPEC-0008`. Antes de cada spawn
real, um segundo gate de aprovação — independente da aprovação do plano —
pede decisão explícita para aquele agente específico; recusar um não afeta
os demais do mesmo plano. O subprocesso roda com timeout, e stdout, stderr e
código de saída chegam como texto ao agente hospedeiro, sem interpretação —
quem julga o resultado é quem pediu a execução, nunca o maestro. Verificado
com os cinco binários reais nesta máquina: `goose` completou um pedido de
ponta a ponta; os demais alcançaram o subprocesso real e relataram um erro
de conta/modelo do próprio backend, não da preparação do maestro — prova de
que `FR-007` (modelo desconhecido não bloqueia a preparação) se sustenta na
prática, não só em teste unitário.

**Plano de orquestração com aprovação humana.** `maestro plan --task "..."`
monta um plano a partir do que o ambiente oferece — perfis configurados,
backends detectados, modelo recomendado — apresenta-o e só devolve um plano
aprovado depois de decisão explícita. Recusa, silêncio e documento malformado
são a mesma negativa, e nenhuma delas grava nada. Aprovado, o plano vira
`.maestro/plans/<execução>.json`, identificado pela mesma execução que o
relatório cita, para as fatias de execução consumirem o que foi aprovado em
vez de replanejarem. O esqueleto propõe sempre um agente e anexa o que
detectou: decompor a tarefa exige entendê-la, e isso é refinamento do agente
que lê a saída, não cálculo do código.

**Telemetria multi-agente.** Cada tentativa de spawn de um agente
`runtime: cli` — recusada por tools, backend ausente, decisão negativa do
gate, falha do próprio spawn, ou executada com sucesso — grava um registro
estrutural em `.maestro/telemetry/<execução>.json`: agente, backend, modelo,
resultado, motivo ou código de saída, instante e duração. Nunca o conteúdo
de stdout/stderr, em nenhuma circunstância. `native`/`auto` nunca gravam —
só `cli` tem prova real de execução. `maestro report <execução>` lê e
apresenta os registros de um trace, recusando de forma nomeada quando não
há nada gravado. Verificado com um spawn real de `goose` nesta máquina: o
registro gravado bateu exatamente com o resultado do subprocesso.

**Servidor MCP**, com a tool `setup` única, sobre entrada e saída padrão pelo
binário `maestro-mcp`. Expõe a mesma lógica que o comando de terminal, e
exige a raiz do projeto como parâmetro: o processo servidor não sabe em que
projeto está, e adivinhar escreveria na árvore errada relatando sucesso.

## O que ainda não existe

Esta lista importa tanto quanto a anterior. Nada abaixo está implementado:

- **Execução real de um agente nativo.** O briefing sai pronto para delegar,
  mas ninguém prova que um subagent nativo do hospedeiro de fato rodou — quem
  lê e aciona `runtime: native`/`auto` é o agente hospedeiro, fora do alcance
  de qualquer teste deste projeto. Só `runtime: cli` executa de verdade
  (`SPEC-0019`).
- **Paralelismo real entre spawns do mesmo plano.** `execution.concurrency`
  já existe no schema, mas orquestrar execução simultânea de vários agentes
  `cli` fica para além de `SPEC-0019`.
- **Custo e uso de plano** na seleção de modelo — deliberadamente fora de
  escopo, não apenas ainda não construído (ver "Seleção de modelo" acima).
- **Hidratação sob demanda de uma extensão de hook.** Uma extensão local
  hoje cria, sobrevive e é reparada; consumir seu conteúdo para alterar de
  fato o comando renderizado em `.claude/settings.json` fica para um
  incremento futuro (Fatia D, adiada em `BACKLOG-0004`).

## Finalidade

O produto se propõe a ser um agrupador, não uma reimplementação. A intenção é
orquestrar ferramentas que já existem e são mantidas por terceiros, em vez de
reescrever suas capacidades.

Disso decorre a decisão central de arquitetura, registrada em SPEC-0002: as
dependências ocupam três camadas distintas, e cada uma recebe tratamento
diferente.

| Camada | Exemplo | Tratamento |
| --- | --- | --- |
| Subsistema npm | `@promovaweb/specsfy`, `context-mode` | Versão fixada, resolvida da cópia do projeto |
| Subsistema Python | `code-review-graph` | Instalado localmente por `uv`, sob aprovação, quando ausente das duas origens (SPEC-0010); nunca no ambiente global |
| Backend de agente | `pi`, `claude`, `codex` e outros | Detectado por capacidade, nunca instalado, intercambiável por desenho |

Para as duas primeiras vale uma regra única: **preferir a cópia local, aceitar a
global, nunca instalar globalmente**. O `doctor` sempre relata qual origem
resolveu, de modo que a diferença entre máquinas fique visível em vez de
silenciosa.

A terceira camada existe porque agentes são substituíveis. Fixar a versão de um
agente criaria uma cópia que nunca roda, já que o binário executado é o que o
`PATH` resolve.

## Limites deliberados

- **Não instala nada no ambiente global.** O ambiente de destino é gerido de
  forma declarativa por um playbook, cuja regra é que nada se instala
  manualmente. Uma ferramenta que instalasse por conta própria disputaria com a
  única fonte da verdade do ambiente em vez de informá-la.
- **Não usa scripts de ciclo de vida na instalação.** Registrado em
  `.specsfy/RULES.md`.
- **Não publica no npm.** O manifesto declara `private` enquanto publicar
  estiver fora de escopo.

## História

O repositório abrigou, até agosto de 2026, o `maestro`: um servidor
MCP em Python com seis ferramentas e 47 recursos embutidos. Aquele produto está
congelado na branch `archived`, no commit `aac477a`, com 378 arquivos e a suíte
de 1010 testes intacta. A branch é protegida contra escrita e deleção.

A v1.0 não é uma evolução daquele código. É um produto diferente, com histórico
próprio: a branch de trabalho nasceu de uma raiz órfã, sem ancestral comum com a
main, preservando apenas o registro de decisões e o framework de processo. Não
há migração, guia de compatibilidade ou caminho de atualização entre os dois.

O registro completo dessa transição está em
`specs/completed/0001-phase-0-preparacao-limpeza/spec.md`.

## Onde as decisões vivem

| Assunto | Arquivo |
| --- | --- |
| Tecnologias e camadas de dependência | `.specsfy/STACK.md` |
| Regras confirmadas | `.specsfy/RULES.md` |
| Inventário de pacotes | `.specsfy/PACKAGES.md` |
| Documentação técnica | `docs/` |
| Especificações e seu histórico | `specs/` |
