# Inbox: Ponte Python nunca executa de verdade no `setup` real

| Metadado | Valor |
| --- | --- |
| Status | Tratada — incorporada à SPEC-0010 |
| Capturada em | 2026-08-30T15:51:49Z |
| Slug | ponte-python-nunca-executa-de-verdade-no-setup-real |
| Origem | Investigação real, ao especificar a fatia 1i |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Sessão de fechamento da SPEC-0009 (fatia 1e), ao investigar o escopo real da fatia 1i. |
| Turno da conversa | Achado ao ler src/setup/run.ts e src/setup/bridge.ts antes de especificar "aprovação em lote dos comandos das dependências". |
| Integridade do original | Não aplicável — achado de investigação, não texto de usuário. |
| Backlog derivado | Nenhum — incorporada diretamente à especificação da fatia 1i, já decidida |
| Spec derivada | specs/completed/0010-fatia-1i-aprovacao-em-lote-comandos/spec.md |

## Contexto consultado

`src/setup/bridge.ts` (`bridgePythonSubsystem`, `execute: boolean` já existente na assinatura), `src/setup/run.ts:204` (o único call site), `src/setup/env.ts` (produz só `TargetEnvironment`, nenhum `BridgeEnvironment`), `src/cli.ts` (`formatSetup()` nunca passa `bridgeEnv` para `runSetup`), `grep -rn "BridgeEnvironment|realBridge" src/` (nenhuma fábrica `realBridgeEnvironment()` existe em produção, diferente de `realBackendEnvironment()`/`realCapacityEnvironment()`/`realOllamaEnvironment()`/`defaultEnvironment()`, todas com equivalente real).

## Achado

`bridgePythonSubsystem` — a ponte que criaria uma cópia local (`.venv-crg/`) do
subsistema Python `code-review-graph` via `uv venv` + `uv pip install`, quando
ausente das duas origens (local e `PATH`) — está implementada e testada só por
fixture injetada. Em produção:

1. `src/setup/run.ts:204` chama `bridgePythonSubsystem({ env: opts.bridgeEnv, execute: false })` — `execute` **hardcoded como falso**, então mesmo quando `bridgeEnv` existisse, o comando real nunca dispararia.
2. `src/cli.ts`'s `formatSetup()` nunca passa `bridgeEnv` para `runSetup(...)` — o parâmetro fica `undefined` em toda execução real, então `runSetup` nem chega a chamar `bridgePythonSubsystem`; cai direto no fallback `{ wouldInstall: null }`.
3. Não existe `realBridgeEnvironment()` em lugar nenhum de `src/` — não há sequer a fonte real que preencheria `localVenv`/`onPath`/`hasUv` fora de teste.

Mesma classe de achado já tratada duas vezes nesta sessão (gap de skills na
SPEC-0005, gap de `approval` na SPEC-0007): implementação e cobertura de teste
existem, mas a integração ponta a ponta com o comando real nunca foi ligada —
"testar a forma, não o uso real".

## Por que importa para a fatia 1i

A fatia 1i ("aprovação em lote dos comandos das dependências, no `setup`")
pressupõe que existam comandos de dependência realmente executados para
aprovar. Hoje, dos três instaladores que `setup` poderia disparar:

- skills (mattpocock/framework via instalador oficial) — executa de verdade, coberto por `tests/skills-executor-real.test.ts`.
- framework former project tool (`former tool install --project`) — executa de verdade.
- ponte Python (`uv venv`/`uv pip install`) — **nunca executa**, por este achado.

Especificar 1i sem notar isso arriscaria desenhar um mecanismo de aprovação em
lote para um comando que, na prática, nunca roda — o mesmo tipo de gap que a
skills teve antes da reabertura da SPEC-0005. Wireup da ponte Python parece
ser pré-condição real da 1i, não parte dela por acidente: sem o comando
executar de verdade, não há "comando de dependência" ali para aprovar.

## Pendência

Não decidido ainda se: (a) wireup da ponte Python vira uma tarefa dentro do
escopo da própria fatia 1i, (b) vira uma fatia/correção própria antes da 1i,
ou (c) o comportamento atual — nunca instalar Python automaticamente — é
deliberado (compatível com a leitura de `PROJECT.md`: "Instalado por `uv`,
verificado e nunca instalado por esta ferramenta") e a `bridgePythonSubsystem`
é código morto a remover, não a ligar. Decisão pendente de confirmação
antes de especificar a 1i.

**Resolvido em 2026-08-30**, com a pessoa: opção (a) — o wireup da ponte
Python entra no escopo da própria fatia 1i.

## Achado relacionado, mesma investigação: o plano aprovado hoje só lista hooks

`src/approval/render.ts`'s `PlannedItem`/`renderPlan` — o texto e o documento
que a pessoa vê antes de aprovar (`SPEC-0007`) — só descrevem hooks (`name`,
`target`, `event`). `src/setup/run.ts`'s `planned` vem só de
`traduzidos.map(...)`, os hooks traduzidos; a instalação de skills, do
framework former project tool e (quando ligada) da ponte Python acontece depois da mesma
aprovação, sem aparecer no plano que a pessoa de fato viu. Aprovação em lote
de "comandos das dependências" pressupõe que esses comandos apareçam no
plano — este achado é pré-condição direta da 1i, na mesma investigação, não
um problema separado.
