# Evidência: `createExtension` recusa atualizar um nome já registrado

- **Fonte**: `src/extensions/create.ts` (código deste próprio repositório, não pacote externo).
- **Consultado em**: 2026-09-03, via leitura direta do arquivo.

## Trecho relevante (linhas 78–95)

```ts
export function createExtension(opts: CreateOptions): CreateResult {
  const managedHooks = opts.managedHooks ?? [];
  if (opts.category === "new" && managedHooks.includes(opts.target)) {
    return {
      ok: false,
      reason: `category new refused: "${opts.target}" is one of the seven hooks setup manages; use override or extension`,
    };
  }

  const registry = readExtensionRegistry(opts.registryEnv);
  const conflict = registry.artifacts.find((a) => a.name === opts.name);
  if (conflict) {
    return {
      ok: false,
      reason: `name conflict: "${opts.name}" is already registered — explicitly choose to skip or replace`,
    };
  }
  ...
```

## Impacto para SPEC-0012

Não existe caminho de atualização automática para um `name` de extensão já presente no registro — `createExtension` sempre recusa. `ensureRouterCandidates` (`src/setup/run.ts`) já chama `createExtension` com os nomes fixos `"router"` e `"agents-pointer"` a cada execução de `runSetup`; num projeto onde esses nomes já foram registrados por uma execução anterior, a chamada seguinte simplesmente recusa (retorno ignorado pelo chamador) e o conteúdo do arquivo nunca muda. Confirmado como o motivo pelo qual o roteador deste próprio repositório permanece com o texto anterior à tradução da sessão prévia — achado incidental, fora do escopo de SPEC-0012, sinalizado à parte via `spawn_task`.

Decisão desta spec (`DEC-002`): a nova instrução de idioma/config.yaml usa nomes de extensão **novos** (`"config-language-rule"`, `"config-language-pointer"`), nunca reaproveitando `"router"`/`"agents-pointer"` — assim a entrega funciona de forma idempotente e correta desde a primeira execução, sem depender de um mecanismo de atualização que o código atual não oferece.
