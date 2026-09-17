# Stack do sistema

## Inventário detectado

<!-- specsfy:stack:start -->
| Camada | Tecnologia | Evidência |
| --- | --- | --- |
| Linguagem | TypeScript | `package.json` (`typescript`) |
| Testes | Vitest | `package.json` (`vitest`) |
| Runtime | Node.js | `package.json` |
<!-- specsfy:stack:end -->

## Decisões estruturais e camadas de dependência

Conteúdo humano, fora do bloco reconstruído. Cada linha cita uma fonte executável.

| Camada | Tecnologia | Responsabilidade | Evidência |
| --- | --- | --- | --- |
| Módulo | ESM | Formato de módulo do pacote e da compilação | `package.json` (`"type": "module"`) |
| Ferramenta | `@types/node` 26.3.0 | Tipos do runtime Node para a compilação estrita | `package.json` (`devDependencies`) |
| Runtime | Node maior ou igual a 20 | Versão mínima suportada | `package.json` (`engines.node`) |
| Biblioteca | `@modelcontextprotocol/sdk` 1.30.0 | Servidor e cliente do protocolo que expõe a tool `setup` ao editor | `package.json` (`dependencies`) |
| Biblioteca | `zod` 3.25.76 | Esquema de entrada da tool. Declarada direta e fixa porque `inputSchema` do SDK aceita apenas esquema zod — `AnySchema = z3.ZodTypeAny \| z4.$ZodType` — sem porta para esquema JSON puro; depender da resolução transitiva deixaria a versão fora da regra de fixação | `package.json` (`dependencies`) |
| Binário | `maestro-mcp` | Segundo executável do pacote, que sobe o servidor do protocolo sobre entrada e saída padrão | `package.json` (`bin`) |
| Biblioteca | `skills` 1.5.23 | Instalador oficial de conjuntos de skills, da vercel-labs. Já chegava por via transitiva como dependência de `@promovaweb/specsfy` em faixa `^1.5.22`; declarado direto e exato para entrar na regra de fixação | `package.json` (`dependencies`) |
| Subsistema npm | `@promovaweb/specsfy` 0.22.2 | Motor de skills e regras do processo. Subiu de 0.10.2 em 2026-09-07, ao investigar uma falha de instalação só de CI; a versão nova não resolveu a falha (segue chamando `npx skills`), mas a fixação avançou porque ficar doze minors atrás tem custo próprio. | `package.json` (`dependencies`) |
| Subsistema npm | `context-mode` 1.0.169 | Gestão de janela de contexto entre sessões | `package.json` (`dependencies`) |
| Biblioteca | `yaml` 2.9.0 | Parsing and serialization of `.maestro/config.yaml` with comment preservation — incremental mutation (`Document.setIn`/`hasIn`) is what lets backfill (`FR-008`) and the sync with `STACK.md` (`FR-007`) add or update fields without erasing human edits or comments (SPEC-0012, DEC-001). Already arrived transitively via `skills` and `vite`; declared direct and pinned to enter the fixation rule. | `package.json` (`dependencies`) |
| Subsistema Python | `code-review-graph` 2.3.7 | Análise de relações de código e call graphs | Exigido do ambiente; instalado por `uv`, ausente do npm |
| Backend de agente | `pi`, `claude`, `cursor-agent`, `codex`, `agy`, `goose`, `dsh`, Ollama | Execução delegada pelo Orchestrator, em fatia futura | **Nada os detecta hoje**: `src/doctor.ts` cobre apenas as três dependências do projeto. A detecção pertence à fatia 1d, e nenhum deles é dependência declarada |

### Regra de resolução das dependências do projeto

Preferir a cópia local do projeto, aceitar a global quando não houver local, e
nunca instalar no ambiente global. A verificação relata qual origem resolveu,
para que a diferença entre máquinas seja visível em vez de silenciosa.

Fixar versão só garante alguma coisa quando o binário executado é o do projeto.
Ao mesmo tempo, o ambiente de destino é gerido por um playbook declarativo cuja
regra é que nada se instala manualmente, e `uv tool install` escreve fora do
projeto. A ordem local antes de global honra as duas restrições.

### Instalação sem scripts de ciclo de vida

Toda instalação de dependência usa `--ignore-scripts`. Script de ciclo de vida
executa código de terceiros durante a instalação, e a documentação do próprio
`pi` recomenda o flag. O registro canônico da regra fica em `.specsfy/RULES.md`.

### Compilação não deixa artefato quando falha

`tsconfig.json` declara `noEmitOnError`. Sem isso, `tsc` emite `dist/` mesmo com
erro de tipo, e a asserção que verifica a existência do binário passaria sobre
uma compilação quebrada. Verificado por mutação: build com erro sai com código 1
e não cria `dist/`; build limpo sai com zero e cria.

### Hooks empacotados com o produto

Os sete hooks portados da v0.2.8 vivem em `resources/hooks/`, na raiz do
pacote, e são declarados em `files` do manifesto. Movidos de `hooks/` para
`resources/hooks/` na SPEC-0011: `resources/` unifica todo artefato de origem
que o `setup` lê e leva para o projeto-alvo, incluindo agora as skills locais
(`resources/skills/`). Não vivem dentro de `specs/`: o caminho de
uma spec muda conforme ela avança de estado, e código que dependesse dele
quebraria a cada transição — como de fato quebrou, com `ENOENT`, ao mover a
SPEC-0003 de `defined` para `in-progress`.

O bloco de código dentro de cada `.md` é fragmento, e não script completo. Ele
lê `HOOK_COMMAND`, `HOOK_FILE` e `HOOK_INPUT`, que o invólucro fornece, e
comunica por `decision` e `message`, que o invólucro emite. Sozinho, o fragmento
de um guard termina no último `fi` sem imprimir nada e não bloquearia coisa
alguma.

### Configuração de hooks, introduzida pela fatia 1b

| Camada | Item | Responsabilidade | Evidência |
| --- | --- | --- | --- |
| Módulo | `src/hooks/source.ts` | Lê frontmatter e fragmento de cada hook | `src/hooks/source.ts` |
| Módulo | `src/hooks/claude-code.ts` | Traduz para o formato do alvo e envolve o fragmento | `src/hooks/claude-code.ts` |
| Módulo | `src/hooks/detect.ts` | Decide se há evidência de uso do alvo | `src/hooks/detect.ts` |
| Módulo | `src/setup/run.ts` | Encadeia detecção, tradução, escrita e registro | `src/setup/run.ts` |
| Módulo | `src/setup/record.ts` | Lê, grava e compara o registro de instalação | `src/setup/record.ts` |
| Módulo | `src/setup/bridge.ts` | Cria a cópia local do subsistema Python | `src/setup/bridge.ts` |
| Módulo | `src/setup/env.ts` | Observa o sistema de arquivos para alimentar a detecção | `src/setup/env.ts` |
| Alvo | Claude Code | Único alvo suportado; Cursor e Antigravity ficam para fatia própria | `src/hooks/detect.ts` |
| Estado | `.maestro/install.json` | Registro do que foi instalado, dentro do projeto | `src/setup/record.ts` |
| Estado | `.claude/settings.json` | Onde as entradas de hook são escritas | `src/setup/run.ts` |

### Separação entre decidir, traduzir e escrever

Cada uma vive em módulo próprio, e a razão é concreta. A tradução devolve
conteúdo e não escreve, de modo que a fidelidade do fragmento é verificável sem
tocar o disco. Na v0.2.8 escape e escrita estavam no mesmo caminho, o escape foi
consumido duas vezes e todos os guards passaram a permitir tudo — defeito que
sobreviveu à revisão porque o arquivo gerado parecia correto.

Pela mesma razão, `env.ts` é a única parte que observa o sistema de arquivos: a
decisão de detecção recebe o resultado por parâmetro e pode ser exercitada
contra ambientes construídos.

## Servidor do protocolo

Quatro módulos em `src/mcp/`, acrescentados pela SPEC-0004:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/mcp/root.ts` | Valida a raiz recebida: caminho absoluto, existente, diretório e com marcador de projeto. Não consulta diretório de trabalho nem variável de ambiente. |
| `src/mcp/tool.ts` | Esquema de entrada e de saída da tool `setup`, e sua execução sobre a raiz validada. Reusa `runSetup` sem duplicar lógica. |
| `src/mcp/server.ts` | Registra a única tool e identifica o servidor com o nome `maestro` e a versão devolvida por `readVersion()`. |
| `src/mcp/main.ts` | Entrada de execução, que liga o servidor ao transporte de entrada e saída padrão. |

A raiz do projeto é parâmetro obrigatório da tool. A observação registrada na
pesquisa da SPEC-0004 encontrou três servidores do protocolo em execução, dois
com o diretório pessoal como diretório de trabalho e um apontando para outro
projeto: nenhum tinha a raiz correta. Derivar a raiz do processo produziria
escrita silenciosa na árvore errada, e por isso a tool recusa quando não pode
confirmá-la.

## Conjuntos de skills e framework Specsfy

Cinco módulos em `src/skills/` e dois em `src/specsfy/`, acrescentados pela
SPEC-0005 e ampliados na reabertura de 2026-08-30:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/skills/source.ts` | Nomeia as duas origens oficiais (`mattpocock/skills`, `promovaweb/specsfy`) e recusa qualquer outra. Não toca o sistema de arquivos. |
| `src/skills/inventory.ts` | Enumera os conjuntos sob `.claude/skills/` e detecta link simbólico em qualquer nível. |
| `src/skills/install.ts` | Enumera com `--list`, recusa conflito antes de escrever e instala com alvo restrito, cópia e sem interação, uma origem por chamada. |
| `src/skills/executor.ts` | Executor real: resolve o binário local de `skills` a partir do próprio pacote `maestro` e traduz sua saída — TUI com `--list`, silenciosa sem. |
| `src/skills/record.ts` | Lê a procedência do lockfile do instalador e compara o registrado com o presente, sem escrever. |
| `src/specsfy/install.ts` | Executa o instalador de projeto do framework Specsfy e traduz o resultado; não persiste registro próprio. |
| `src/specsfy/executor.ts` | Executor real: resolve o binário local de `@promovaweb/specsfy` a partir do próprio pacote `maestro` e faz o parsing do JSON de saída. |

A instalação de skills usa cópia real e nunca link simbólico. O instalador cria
link por padrão, e conteúdo por link mora fora do projeto: o hash deixaria de
descrever o que o agente lê, duas máquinas divergiriam sem registro, e o
ferramental do Specsfy recusa caminho por link.

A entrega dá rastreabilidade, não reprodutibilidade. O lockfile registra o que
se obteve, e não o que se deve obter: não há referência de commit nem versão do
conjunto, e reexecutar busca a ponta.

`src/cli.ts` injeta os dois executores reais (`realSkillsExecutor()`,
`realSpecsfyExecutor()`) em toda execução de `setup` — resolvidos contra o
próprio pacote `maestro`, não contra o projeto alvo. Até a reabertura de
2026-08-30, nenhum dos dois existia em produção: `installSkills` e
`installSpecsfy` eram exercitados só por fixture, e `formatSetup()` nunca
fornecia `skills` nem `specsfy` a `runSetup` — o `setup` real não instalava
coisa alguma. `tests/cli-setup-real.test.ts` prova a integração completa sem
nenhum executor injetado.

**"Já configurado" cobre o disco, não só o registro.** `runSetup` decidia
isso olhando só os hooks (`matches()`, nome e versão contra o registro
anterior); apagar `.claude/skills/` ou `.specsfy/` por fora e rodar `setup`
de novo relatava sucesso sem restaurar nada — reproduzido de verdade numa
segunda reabertura, no mesmo dia. `jaFeito` passou a ser a conjunção de três
checagens independentes e baratas — sem subprocesso: hooks batendo
(`matches()`), cada skill antes registrada ainda presente em
`inspectSkills(raiz).dirs`, e `.specsfy/` existindo quando `opts.specsfy` foi
fornecido. Qualquer uma falsa invalida o curto-circuito inteiro, e a execução
segue para a aprovação e para os instaladores reais — já idempotentes por si.
`tests/cli-setup-drift-real.test.ts` prova a restauração de ponta a ponta;
`tests/setup-jafeito-skills-specsfy.test.ts` prova que, sem drift, nenhum
executor é invocado.

## Telemetria da execução

Dois módulos em `src/telemetry/`, acrescentados pela SPEC-0006:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/telemetry/trace.ts` | Única fonte de não determinismo: identificador hexadecimal de comprimento fixo e instante do relógio do sistema, ambos substituíveis por injeção. |
| `src/telemetry/read.ts` | Lê o identificador da última execução registrada, distinguindo identificado, não identificado e ausente, sem escrever. |

`.maestro/install.json` ganhou o campo `trace`, com o identificador da
execução que gravou o arquivo, e as entradas passaram a receber o instante real.

Relógio e gerador são injetáveis por decisão registrada em `DEC-043`. A fatia 1b
havia tentado o caminho oposto — congelar o instante em `new Date(0)` para dar
previsibilidade aos casos — e o resultado foi um registro que afirmava, em toda
máquina, que a instalação ocorrera em 1970. Determinismo de teste se obtém
injetando a fonte, e não falsificando o valor em produção.

## Aprovação do plano

Três módulos em `src/approval/`, acrescentados pela SPEC-0007:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/approval/context.ts` | Escolhe o canal de aprovação pela presença de terminal na entrada padrão. |
| `src/approval/render.ts` | Deriva as formas de texto e documento do plano a partir de um único percurso, para que não divirjam entre si. |
| `src/approval/decide.ts` | Interpreta a decisão da fonte escolhida, tratando exceção, entrada vazia e documento inválido como negativa. |

`SetupOptions.approval` é opcional, no mesmo padrão de `skills` e `bridgeEnv`:
ausente, nada é consultado. `src/cli.ts` liga `approval: {}` em toda execução
de `maestro setup`, desde a reabertura de 2026-08-30 — objeto vazio, e
não campos individuais: `context`, `source` e `stdin` já têm cada um sua
implementação real por padrão dentro de `resolveChannel`/`realSource`.
`tests/cli-approval-real.test.ts` prova a integração completa sem nenhum
canal nem fonte injetados, alimentando a entrada padrão do subprocesso real.
O servidor MCP (`src/mcp/tool.ts`) segue sem `approval`: ler `stdin` de
verdade dentro de um processo MCP colidiria com o protocolo JSON-RPC, que já
usa `stdin`/`stdout` como transporte.

## Detecção de backends de agente

Dois arquivos em `src/backends/`, acrescentados pela SPEC-0008:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/backends/known.ts` | Nomeia `SUPPORTED_AGENT_BACKENDS` (`pi`, `agy`, `claude`, `codex`, `goose`) e `KNOWN_AGENT_BACKENDS`, que acrescenta `dsh` e `cursor-agent`, presentes na máquina mas sem capacidade demonstrada. |
| `src/backends/detect.ts` | `detectBackends(env, known?, supported?)`, com `BackendEnvironment` injetável — presença via `which`-equivalente, versão via `<backend> --version`, nunca `--help`. |

`src/doctor.ts` ganhou a terceira camada, `agent`, ao lado de `npm` e
`python`: `Layer` passa a ter três valores, e `inspectDependencies` recebe um
terceiro parâmetro opcional, `backendEnv`, com `realBackendEnvironment()`
como padrão. Diferente das duas primeiras, a camada `agent` é informativa —
`dependenciasOk` (e por consequência `exitCode`) é calculado só sobre
`results.filter(r => r.layer !== "agent")`, porque `maestro` detecta
backend de agente e nunca o instala (`PR-031`).

A lista suportada corrigiu, com execução real, uma varredura anterior do
backlog que havia checado só o `--help` de topo de cada CLI e concluído que
`codex` e `goose` não tinham forma de invocação sem interação — os dois têm,
por subcomando dedicado (`codex exec`, `goose run`), não por flag do binário
raiz. Evidência em `specs/completed/0008-fatia-1d-deteccao-backends/research/`.

A extração de versão prefere o primeiro token que começa com dígito, e não o
último: `claude --version` devolve `2.1.251 (Claude Code)`, cujo último token
é `Code)` — bug real, encontrado na verificação manual desta fatia e coberto
por `tests/backends-paridade-real.test.ts`.

`src/cli.ts` ganhou `renderReport(report)`, extraído de `formatReport()`, para
que o texto da camada `agent` — incluindo a marca `suportado`/`não suportado`
— seja exercitável com um `Report` injetado, sem depender do que está
instalado na máquina de quem roda a suíte.

## Seleção de modelo

Três módulos em `src/models/`, acrescentados pela SPEC-0009:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/models/capacity.ts` | `readCapacity(env?)`, com `CapacityEnvironment` injetável — memória total e livre, via `os.totalmem`/`os.freemem` na fonte real. |
| `src/models/ollama.ts` | `listOllamaModels(env?)`, com `OllamaEnvironment` injetável — presença do `ollama` via `which`-equivalente, lista de modelos via `ollama list`, cujo texto tabular é lido com colunas separadas por 2+ espaços e tamanho convertido de `"9.0 GB"` para bytes decimais. |
| `src/models/recommend.ts` | `recommend(backends, ollama, capacity, override?)`, função pura sem I/O que combina as três fontes já resolvidas por quem chama. |

`OllamaEnvironment`'s snapshot é `{present: boolean; models: OllamaModel[]}`,
não um array simples — `ollama` ausente e `ollama` presente sem nenhum modelo
baixado produzem o mesmo array vazio na fronteira da função, mas exigem texto
de relato distinto; o sinal `present` é o que os distingue (`DEC-041`).

O backend recomendado é o primeiro de `SUPPORTED_AGENT_BACKENDS` (fatia 1d)
presente, na ordem declarada — determinístico, nunca por sondagem. O modelo
local recomendado é o maior cujo tamanho cabe na memória livre (`<=`, sem
margem de segurança). Um override humano (`--backend`/`--local-model` em
`maestro recommend`) substitui o cálculo correspondente sem revalidação
contra presença ou capacidade — é a decisão da pessoa, não um convite para o
comando recusá-la (`DEC-039`).

Custo e uso de plano por backend ficam fora do cálculo: nenhum dos cinco
backends suportados expõe essa informação sem rede e sem autenticação,
verificado por execução real (`specs/completed/0009-fatia-1e-selecao-de-modelo/research/`).
`recommendation.report` sempre declara essa ausência em vez de silenciá-la.

`maestro recommend` resolve as três fontes reais e imprime
`recommendation.report`; exit code `0` quando um backend é recomendado ou
sobreposto, `1` quando nenhum está presente e nenhum foi informado.

## Aprovação em lote dos comandos das dependências

Dois módulos novos em `src/approval/`, acrescentados pela SPEC-0010:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/approval/registry.ts` | `readApprovalRegistry`/`writeApprovalRegistry`, com `RegistryEnvironment` injetável — registro persistente em `.maestro/approved-commands.json`; `isApproved(registry, item)` compara `bin`+`args` exatos, sem normalização (`PR-070`). |
| `src/approval/plan.ts` | `assembleDependencyCommands(candidates)`, `partitionByApproval`, `recordApproval` — funções puras que decidem quais comandos de dependência (skills, Specsfy, ponte Python) já estão aprovados e quais precisam de aprovação nova. |

`src/approval/render.ts` e `src/approval/decide.ts` (`SPEC-0007`) foram
estendidos: `renderPlan(hooks, commands)`/`DecisionSource.ask(hooks,
commands)` agora recebem hooks (forma inalterada, `PlannedItem[]`) e comandos
de dependência (`DependencyCommandItem[]`, com `bin`/`args`) como dois
parâmetros distintos — hooks não são subprocesso e o registro persistente não
se aplica a eles. O documento JSON preserva a chave `items` para hooks
(compatibilidade com `SPEC-0007`) e ganha `commands` para os novos.

Corrigidas duas lacunas encontradas por leitura de código antes de
especificar (`specs/inbox/2026-08-30-155149-...`): o plano aprovado só
listava hooks, embora skills/Specsfy/ponte também escrevessem depois da mesma
aprovação — violava `PR-062` ("o plano apresentado é o que será executado")
desde que essa regra foi escrita; e a ponte Python (`src/setup/bridge.ts`)
nunca executava de verdade em produção, com `execute: false` fixo em
`run.ts` e nenhuma fonte real (`realBridgeEnvironment()`) em lugar nenhum —
mesma classe de gap já corrigida duas vezes nesta iniciativa (skills,
`SPEC-0005`; aprovação, `SPEC-0007`).

`bridgePythonSubsystem` ganhou `realBridgeEnvironment(root?)`, que resolve
`localVenv`/`onPath`/`hasUv` de verdade, e um `cwd?` opcional — ausente, usa a
raiz do pacote `maestro`, o mesmo local que `doctor.ts` já verifica para
`.venv-crg/`, e não a raiz do projeto alvo (os dois precisam concordar sobre
onde a cópia local vive). A execução real (`uv venv` + `uv pip install`) fica
protegida por `try`/`catch`: falha de rede em `uv pip install` é reportada no
relato, nunca propagada como exceção não tratada — `uv venv` em si não
depende de rede.

`src/skills/install.ts`/`src/skills/executor.ts` e
`src/specsfy/install.ts`/`src/specsfy/executor.ts` ganharam
`buildSkillsAddArgs`/`describeSkillsCommand` e
`buildSpecsfyInstallArgs`/`describeSpecsfyCommand`: o argv real de cada
instalador, extraído para função pura e reaproveitado tanto por quem executa
quanto por quem só precisa descrevê-lo para o plano de aprovação, sem
duplicar a construção do comando em dois lugares (a mesma divergência que
`PR-062` existe para evitar).

`src/setup/run.ts` monta os candidatos de skills/Specsfy/ponte sempre que
cada um está configurado (a idempotência real fica dentro de cada
instalador, como já era); só pede aprovação quando hooks não batem ou algum
comando de dependência não está no registro — um comando já aprovado antes,
com o mesmo binário e argv exatos, não gera pergunta de novo, mesmo quando a
execução precisa reinstalar por drift.

## Extensões locais e reparo assistido

Seis módulos novos em `src/extensions/`, acrescentados pela SPEC-0011, para
que um hotfix local (hook, regra, ou o próprio roteador em `CLAUDE.md`/
`AGENTS.md`) sobreviva a uma reinstalação sem esperar release:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/extensions/registry.ts` | `ExtensionArtifact`/`ExtensionRegistry`; `ChecksumEnvironment` injetável (mesmo padrão de `RegistryEnvironment`, `SPEC-0010`); `readExtensionRegistry`/`writeExtensionRegistry` em `.maestro/extensions.json` — ausente ou corrompido resolve para `{ artifacts: [] }`, nunca lança. |
| `src/extensions/anchor.ts` | `insertAnchor`/`readAnchor`/`computeChecksum` — âncora `<!-- maestro:<categoria>:<nome>:start/end -->`, mesmo comentário HTML que `.specsfy/Spec.md` já usa para o próprio Specsfy; checksum SHA-256 sobre o conteúdo bruto. |
| `src/extensions/create.ts` | `createExtension(opts)` — único caminho de escrita de um artefato: grava a âncora no arquivo alvo (`resolveTargetPath` resolve `CLAUDE.md`/`AGENTS.md` para a raiz, qualquer outro `target` para `.maestro/extensions/<target>.md`) e o checksum no registro; recusa categoria `new` para um dos sete hooks gerenciados e conflito de nome sem escolha padrão. |
| `src/extensions/diagnose.ts` | `diagnoseExtensions(registry, targetEnv, presentNames)` — função pura de leitura, nunca escreve: compara checksum real contra o registrado e relata artefato presente sem registro correspondente. |
| `src/extensions/repair.ts` | `repairExtension(divergent, opts)` — move o conteúdo divergente para `.maestro/quarantine/<timestamp>-<nome>` (sem expiração automática) e restaura o original a partir do `content` gravado no registro; recusa o reparo inteiro se a quarentena não for gravável, em vez de reparar pela metade. |
| `src/extensions/router.ts` | `buildRouterBlock()`/`buildAgentsPointer()` — texto minimalista que ensina o agente a acionar a skill de fachada em vez de ler `.maestro/extensions/` inteiro; consumidos via `createExtension`. |

Dois comandos novos em `src/cli.ts`: `maestro extension create
--category <override|extension|new> --target <alvo> --name <nome> --file
<arquivo>` e `maestro extension repair --name <nome>`. `src/doctor.ts`
ganhou uma quarta fonte de relato — `inspectDependencies` recebeu um
parâmetro `diagnoseExtensionsFn` injetável (default `realDiagnoseExtensions`,
que só toca disco na CLI real), seguindo o mesmo padrão de
`backendEnv` já usado para não quebrar determinismo em teste pré-existente
(a mesma classe de defeito que a `SPEC-0008` já corrigiu). A divergência de
extensão entra no `exitCode` do `doctor` diretamente, ao contrário da camada
`agent` — que é só informativa.

`src/setup/run.ts` monta o candidato do roteador (`CLAUDE.md`/`AGENTS.md`)
sempre que `opts.write` é verdadeiro, tanto no caminho "já configurado"
quanto no caminho de escrita plena — idempotente pelo próprio
`createExtension` (recusa por conflito de nome quando o artefato já existe).
Diferente de skills/Specsfy/ponte, o roteador não é candidato do registro de
aprovação em lote de dependência de terceiro (`SPEC-0010`): não é um comando
externo, então não pede aprovação própria.

Princípio central, testado em `tests/extensions-doctor-divergencia.test.ts`
e `tests/extensions-checksum-ausente.test.ts`: **detectabilidade, não
prevenção** — o checksum nunca impede uma escrita fora da CLI; ele garante
que essa escrita apareça na próxima leitura do `doctor`. E **reversibilidade
sem exceção**: nenhuma operação deste sistema apaga conteúdo — divergência
vira quarentena, sempre.

### Entrega de skills locais empacotadas (`src/skills/deliver.ts`)

Correção pós-entrega da SPEC-0011: a skill de fachada
`maestro-extension-creator` é autorada dentro deste pacote — diferente
de `mattpocock/skills`/`promovaweb/specsfy`, que vêm de fora via
`installSkills`. Ela vive em `resources/skills/maestro-extension-creator/`
(fonte empacotada, declarada em `files` do manifesto, no mesmo padrão de
`resources/hooks/`) e `deliverBundledSkill` a copia, sem checksum nem
registro, para os dois diretórios que o instalador real já popula para o
único alvo suportado hoje (`claude-code`): `.claude/skills/` e
`.agents/skills/`. `runSetup` chama `deliverLocalSkills` sempre que
`opts.write` é verdadeiro — mesmo padrão de idempotência do roteador
(`ensureRouterCandidates`): sobrescrita do mesmo conteúdo é barata e segura,
porque é conteúdo do próprio pacote, nunca algo que a pessoa editou à mão.

Achado real: a primeira versão da SPEC-0011 deixou essa skill parada em
`skills/` na raiz do projeto, sem nenhum código a entregando — o teste
existente (`extensions-facade-nao-escreve.test.ts`) só conferia que o
arquivo existia e tinha certas propriedades, nunca que o `setup` a instalava
em algum lugar. `tests/setup-delivers-bundled-skill.test.ts` cobre isso de
ponta a ponta agora, e uma execução real de `dist/cli.js setup` confirmou os
dois caminhos populados.

## Perfis de agente configuráveis (`maestro:` no config.yaml)

Introduzido pela `SPEC-0015`, fatia MA-1 do épico de orquestração multi-agente
(`BACKLOG-0009`).

| Item | Escolha | Evidência / motivo |
| --- | --- | --- |
| Seção do schema | `maestro:`, quinta seção de topo de `.maestro/config.yaml` | `src/config/schema.ts` (`MaestroSection`, `AgentProfile`); entra em `SCHEMA_KEYS`, então a invariante de completude da `SPEC-0012` passa a cobri-la |
| Composição do agente | Cinco grupos: `identity`, `cognition`, `instruction`, `capability`, `execution` | Separa dimensões que mudam por motivos diferentes; `identity.description` existe para o planejamento (MA-2) casar perfil e tarefa com critério |
| Formato de propriedade | `{ value, mode }` uniforme, `mode` ∈ `suggested \| required` | `DEC-001` da `SPEC-0015`: uma única forma de escrever a mesma coisa, sem forma curta alternativa |
| Perfis parciais | Qualquer combinação de grupos; grupo ausente não é divergência | `D6` do `BACKLOG-0009`; `src/agents/profile.ts` valida só o que está declarado |
| Defaults de fábrica | Arquivos reais em `resources/agents/maestro/`, copiados para `.maestro/subagents/<agente>/` | `PR-001`: nada implícito, nada hardcoded — nenhum comportamento padrão vive como string em `src/` |
| Propriedade dos arquivos semeados | Da pessoa; fora do checksum/quarentena da `SPEC-0011` | `DEC-004`: comportamento de agente é o que se espera que a pessoa edite |
| Leitura | `src/agents/read.ts`, recusa em voz alta nomeando perfil, propriedade e motivo | `FR-003`; nunca devolve perfil parcialmente válido |
| Diagnóstico | `src/agents/diagnose.ts`, só-leitura, composto no `doctor` | `PR-003`; compartilha `collectProblems` com o leitor para relatar exatamente o que a execução recusaria |
| Camadas de configuração | Apenas por projeto; sem `~/.maestro/` | `DEC-006`: consistente com nunca escrever fora da raiz do projeto |

## Plano de orquestração e aprovação humana (`maestro plan`)

Introduzido pela `SPEC-0016`, fatia MA-2 do épico (`BACKLOG-0009`).

| Item | Escolha | Evidência / motivo |
| --- | --- | --- |
| Comando | `maestro plan --task "<descrição>"`, só no CLI | `src/cli.ts`; o servidor MCP mantém a tool `setup` única, decisão da `SPEC-0004` não reaberta |
| Divisão de trabalho | O código monta o esqueleto determinístico; o agente refina | `DEC-001`: o código apura perfis, backends e memória livre sem adivinhar, e não julga decomposição de tarefa |
| Tamanho do time no esqueleto | Sempre um agente, com candidatos anexados | `DEC-006`; decompor exigiria entender a tarefa |
| Ausência de modelo | `model: null`, nunca string vazia | `FR-002`: ausência tem que ser legível como ausência |
| Canal de decisão | Reusa o da `SPEC-0007` (TTY ou documento JSON por stdin) | `DEC-002`; a regra "exceção é recusa" foi extraída para `interpretDecision` em `src/approval/decide.ts`, usada pelos dois gates |
| Artefato aprovado | `.maestro/plans/<trace-id>.json` | `DEC-004`; o identificador vem da `SPEC-0006`, então o plano conecta de volta à execução que o reportou |
| Recusa | Nada gravado, saída diferente de zero | `NFR-002`; recusa, silêncio e documento malformado chegam como a mesma negativa |

## Recomendação de modelo por janela de contexto e tipo de tarefa

Introduzida pela `SPEC-0017`, fatia MA-3 do épico (`BACKLOG-0009`).

| Item | Escolha | Evidência / motivo |
| --- | --- | --- |
| Origem da janela | `ollama show <modelo>`, subprocesso local | `src/models/context-window.ts`; mesma fronteira do `ollama list` já em uso — sem rede, sem autenticação |
| Ausência de janela | `null`, nunca `0` | `0` compararia como "menor que qualquer exigência" e desqualificaria o modelo pelo motivo errado |
| Falha na leitura | Ausência declarada, não exceção | Um modelo que sumiu entre o `list` e o `show` não pode derrubar a recomendação inteira |
| Tipos de tarefa | `maestro.task_types` no `config.yaml`, semeados de fábrica | `DEC-002`; os nomes não significam nada para o código, que só compara o mínimo declarado |
| Papel da janela | Filtro duro antes da comparação por tamanho | `DEC-003`; janela insuficiente é inviabilidade, não desvantagem |
| Custo | Consulta só para quem passou no filtro de memória; nenhuma consulta sem tipo | `DEC-004`; um subprocesso por modelo candidato, proporcional a quem disputa |
| Sem tipo | Nenhuma exigência aplicada, comportamento idêntico ao anterior | `DEC-006`; ausência de informação não vira requisito inventado |
| Override | Escapa do filtro | `DEC-039` da `SPEC-0009`: escolha humana substitui o cálculo, não é auditada por ele |

## Briefing de delegação (`maestro run`)

Introduzido pela `SPEC-0018`, fatia MA-4 do épico (`BACKLOG-0009`).

| Item | Escolha | Evidência / motivo |
| --- | --- | --- |
| Fronteira | A CLI emite o briefing; o agente hospedeiro aciona os subagents | `DEC-001`; um processo de terminal não tem acesso à Agent tool da IDE |
| Composição do comportamento | Resolvida pela CLI, texto final entregue | `DEC-002`; a regra substitui-versus-soma da `SPEC-0015` fica testável, não é convenção de prompt |
| `runtime: cli` | Executa de verdade desde a `SPEC-0019` (abaixo) | Sem o contexto de execução novo, ainda é recusado nomeando a ausência |
| Estado | Nada é gravado pelo briefing em si | `DEC-004`; emitir briefing não é evidência de execução — telemetria real é MA-6 |

## Execução via subprocesso de CLI externa (`runtime: cli`)

Introduzida pela `SPEC-0019`, fatia MA-5 do épico (`BACKLOG-0009`).

| Item | Escolha | Evidência / motivo |
| --- | --- | --- |
| Adaptador por backend | `src/delegation/cli-backends/{pi,claude,goose,agy,codex}.ts`, um `CliBackendAdapter` cada | Flags reais confirmadas por `--help` de cada binário e, ao implementar, por spawn real nos cinco nesta máquina |
| Injeção de comportamento | Flag nativa (`pi`, `claude`, `goose`) ou `AGENTS.md` temporário (`agy`, `codex`), sempre removido depois | `FR-002`; `agy`/`codex` não têm flag de system prompt |
| Prompt/tarefa em si | Argumento posicional final (`pi`, `claude`, `agy`, `codex`) ou `--text` (`goose`) | Achado da verificação real: `claude --print` recusa sem prompt; `agy --print` toma o *próximo* argumento como prompt, então a tarefa precisa vir logo depois dessa flag; `goose` exige o subcomando `run` antes de qualquer flag |
| Escolha de backend | `execution.cli_backend`; ausente, primeiro presente na ordem fixa de `SUPPORTED_AGENT_BACKENDS` | `src/delegation/cli-select.ts`, `FR-004` |
| Tools não suportável | Recusa nomeando backend e limitação quando `required` | `src/delegation/cli-tools.ts`, `PR-001` (`SPEC-0015`, `D6`) |
| Gate novo por spawn | Um `interpretDecision` por agente `cli`, independente da aprovação do plano | `src/delegation/cli-gate.ts`, `PR-003`; recusar um não afeta os demais do plano |
| Spawn | `spawnSync` com timeout de 120s, sem interpretar stdout/stderr | `src/delegation/cli-spawn.ts`, mesmo padrão de `scripts/pinned-skills.mjs` |
| `AGENTS.md` real já existente | Recusa em vez de sobrescrever | Achado real: `specsfy setup` já grava `AGENTS.md` em todo projeto gerenciado — `agy`/`codex` são recusados por padrão em projetos assim, comportamento pretendido, não falha |
| Verificação real | Todos os cinco backends spawnados nesta máquina; `goose` completou de ponta a ponta, os demais alcançaram o subprocesso real e relataram erro de conta/modelo do próprio backend | Prova de que `FR-007` (modelo desconhecido não bloqueia a preparação) se sustenta fora do teste unitário |

## Telemetria multi-agente (`maestro report`)

Introduzida pela `SPEC-0020`, fatia MA-6 do épico (`BACKLOG-0009`).

| Item | Escolha | Evidência / motivo |
| --- | --- | --- |
| Escopo de dados | Só metadados estruturais — agente, backend, modelo, resultado, motivo/exitCode, instante, duração; nunca stdout/stderr | `src/telemetry/record.ts`, `PR-003`/`NFR-002` |
| Persistência | Um arquivo por trace, `.maestro/telemetry/<trace>.json`, acumulando por agente | `src/telemetry/store.ts`, mesmo padrão de `.maestro/plans/<trace>.json` (`SPEC-0016`) |
| Runtime coberto | Só `runtime: cli` — `native`/`auto` nunca gravam, porque só `cli` tem prova real de execução | `CliRuntimeContext.telemetry?` em `src/delegation/run.ts`, extensão aditiva sobre a `SPEC-0019`, sem reabrir seus gates |
| Quatro desfechos gravados | `refused` com `stage: tools\|backend\|gate\|spawn`, ou `ran` com `exitCode` | `runCliAgent` grava em cada um dos pontos de retorno já existentes da `SPEC-0019` |
| Leitura | `maestro report <trace>`, mesmo padrão de `maestro plan`/`maestro run`; trace sem registro é recusado nomeando a ausência | `src/telemetry/render.ts`, `formatTelemetryReport` em `src/cli.ts` |
| Verificação real | `maestro plan` → `maestro run` → `maestro report` com um agente `cli` real sobre `goose` nesta máquina | Registro gravado bateu exatamente com o resultado real do spawn; nenhum stdout/stderr no arquivo |
| Achado do desenho de teste | Os primeiros casos de AC-005/AC-007/AC-011 passavam mesmo sem a funcionalidade existir (asserção só de ausência) | Refinados para gravar com `cli` no mesmo teste antes de afirmar ausência para `native`/`auto` — sem isso não provavam RED de verdade |

## Hooks do Claude Code como scripts gerenciados (SPEC-0022, release 2.1.23)

| Aspecto | Decisão | Evidência |
| --- | --- | --- |
| Formato instalado | `.claude/settings.json` só referencia `"$CLAUDE_PROJECT_DIR/.maestro/hooks/<nome>.sh"`; o script vive em `.maestro/hooks/` e é registrado por checksum em `.maestro/extensions.json` (categoria `hook`) | `src/hooks/claude-code.ts`, `src/setup/write.ts` (`writeHookScripts`) |
| `matcher` | Derivado do evento canônico (`Bash`; `Edit\|Write\|MultiEdit\|NotebookEdit`; nenhum para `Stop`/`SessionStart`/`PreCompact`/`UserPromptSubmit`) ou do `tools:` do frontmatter — nunca o nome do hook | `src/hooks/claude-code.ts` (`MATCHER_MAP`), `src/hooks/source.ts` |
| Identidade | Caminho do script ou marcador `# maestro:hook=<nome>` no despacho; `matcher` não participa | `src/hooks/identity.ts` |
| Merge | Substitui só entradas do maestro, preserva terceiros em todo evento, migra o formato inline anterior, quarentena para JSON inválido | `src/setup/write.ts` (`writeSettings`, `hasLegacyEntries`) |
| context-mode | Hooks projetados de `node_modules/context-mode/hooks/hooks.json` (pacote pinado); os `resources/hooks/context-mode-*.md` deixaram de existir | `src/hooks/upstream.ts` |
| Binários de despacho | Shim POSIX `sh`: caminho gravado no setup, depois `PATH`, com aviso em stderr | `src/hooks/shim.ts`, `resolveDispatchCommand` em `src/hooks/resolve.ts` |
| Versão | `package.json` 2.1.22 → 2.1.23 (bump exigido pela guarda de checksum do `build`) | `package.json`, `.version-checksum.json` |

## Release 2.1.28-2.1.29 (SPEC-0025)

- 2026-09-17 — bumps de versão do próprio pacote (`@brunocalmon/maestro`), sem alteração de dependências: exigidos pela guarda de checksum do `npm run build` a cada mudança de `src/`/`resources/` (SPEC-0022/0023/0024/0025). O inventário gerenciado acima permanece válido.
