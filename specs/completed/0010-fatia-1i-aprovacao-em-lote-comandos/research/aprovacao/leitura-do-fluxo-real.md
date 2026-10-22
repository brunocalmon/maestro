# Leitura do fluxo real de aprovação e instalação

Data: 2026-08-30. Leitura direta do código de produção deste repositório,
sem execução externa nem rede — os dois achados vêm de `grep`/leitura de
`src/`.

## O plano só lista hooks

`src/approval/render.ts`:

```ts
export interface PlannedItem {
  name: string;
  target: string;
  event: string;
}
```

`src/setup/run.ts`, onde `planned` é montado:

```ts
const traduzidos = hooks.map(translateForClaudeCode);
const planned = traduzidos.map((h) => ({ name: h.name, target: TARGET_SETTINGS, event: h.event }));
```

`planned` nunca inclui skills, o framework former project tool nem a ponte Python — mas
`resolveChannel`/`interpret` (a aprovação de `SPEC-0007`) rodam sobre esse
`planned`, e a instalação real de skills/former project tool/ponte acontece depois da
mesma aprovação, sem ter aparecido nela. `PR-062` ("o plano apresentado é o
que será executado, e não uma descrição paralela") não se sustenta hoje.

## A ponte Python nunca dispara

`src/setup/run.ts:204`:

```ts
const ponte = opts.bridgeEnv
  ? bridgePythonSubsystem({ env: opts.bridgeEnv, execute: false })
  : { wouldInstall: null };
```

`execute: false` é literal — não vem de opção nem de aprovação. E `src/cli.ts`'s
`formatSetup()`:

```ts
const r = runSetup({
  env: detectEnvironment(root),
  root,
  write: true,
  previous,
  skills: { execute: realSkillsExecutor() },
  framework: { execute: realformer project toolExecutor() },
  approval: {},
});
```

nunca inclui `bridgeEnv` — então `opts.bridgeEnv` é sempre `undefined` na
execução real, e `runSetup` cai no ramo `{ wouldInstall: null }` sem sequer
chamar `bridgePythonSubsystem`.

```bash
$ grep -rn "BridgeEnvironment|realBridge" src/ | grep -v test
src/setup/bridge.ts:10:export interface BridgeEnvironment {
src/setup/bridge.ts:42:  env: BridgeEnvironment;
src/setup/run.ts:13:import { bridgePythonSubsystem, type BridgeEnvironment } from "./bridge.js";
src/setup/run.ts:31:  bridgeEnv?: BridgeEnvironment;
```

Nenhuma `realBridgeEnvironment()` existe — diferente de `realBackendEnvironment()`
(fatia 1d), `realCapacityEnvironment()`/`realOllamaEnvironment()` (fatia 1e) e
`defaultEnvironment()` (`doctor`), todas com equivalente real em produção.
`bridgePythonSubsystem` é exercitada só por `BridgeEnvironment` fake em teste.

## Consequência para a fatia 1i

Aprovação em lote de "comandos das dependências" pressupõe dois pré-requisitos
que faltam hoje: o plano precisa listar os comandos de verdade (não só
hooks), e os comandos precisam de fato executar quando aprovados (a ponte
Python, hoje, não). Os dois viram FR desta fatia — `FR-071` e `FR-074` — em
vez de fatias/correções separadas, porque são a mesma investigação e a mesma
pré-condição: sem os dois, não há "comando de dependência" real para o
mecanismo de registro persistente (`FR-070`/`FR-072`/`FR-073`) governar.
