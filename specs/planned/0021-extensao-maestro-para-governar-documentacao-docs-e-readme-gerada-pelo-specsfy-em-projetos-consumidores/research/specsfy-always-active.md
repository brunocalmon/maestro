# Specsfy está sempre ativo em qualquer instalação real de `maestro setup`

- Fonte: `src/cli.ts`, `src/mcp/tool.ts`, `src/setup/run.ts`.
- Consultado em: 2026-09-16.
- Propósito: decidir se a regra de documentação desta spec precisa de um caminho alternativo para projetos sem Specsfy.

## Achado

`runSetup()` (`src/setup/run.ts:242`) declara `specsfy?: { execute: SpecsfyExecutor }` como campo opcional, e `ensureConfigYaml`/composição interna só instala o framework quando `opts.specsfy` está presente (`src/setup/run.ts:419`: `opts.specsfy ? installSpecsfy(...) : null`). Isoladamente, isso parece indicar que Specsfy é opcional.

Os dois pontos de entrada reais, porém, sempre fornecem esse campo:

- CLI (`src/cli.ts:224-234`, comando `maestro setup`): chama `runSetup({ ..., specsfy: { execute: realSpecsfyExecutor() }, ... })` incondicionalmente. `SETUP_FLAGS` (a lista de flags aceitas por `formatSetup`) não inclui nenhuma flag de opt-out para Specsfy.
- Ferramenta MCP (`src/mcp/tool.ts:120-140`, `executeSetup`): chama `runSetup({ ..., specsfy: { execute: realSpecsfyExecutor() }, ... })`, também incondicionalmente.

Ou seja, `opts.specsfy?` é uma costura de injeção de dependência para teste (permitir que testes unitários chamem `runSetup` sem instalar o framework de verdade), não uma opção de produto exposta a quem usa o CLI ou a ferramenta MCP.

## Conclusão normativa

Esta spec assume Specsfy sempre presente em qualquer instalação real de `maestro setup`. Não é necessário desenhar ou testar um caminho "documentação sem Specsfy" — a condição `.specsfy/` presente (usada em FR-004) é sempre verdadeira em uso real, e existe na spec apenas como salvaguarda defensiva, não como um cenário de produto a suportar.
