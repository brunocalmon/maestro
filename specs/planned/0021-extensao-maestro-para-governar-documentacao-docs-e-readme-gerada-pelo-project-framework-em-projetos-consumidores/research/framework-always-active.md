# former project tool está sempre ativo em qualquer instalação real de `maestro setup`

- Fonte: `src/cli.ts`, `src/mcp/tool.ts`, `src/setup/run.ts`.
- Consultado em: 2026-09-16.
- Propósito: decidir se a regra de documentação desta spec precisa de um caminho alternativo para projetos sem former project tool.

## Achado

`runSetup()` (`src/setup/run.ts:242`) declara `framework?: { execute: former project toolExecutor }` como campo opcional, e `ensureConfigYaml`/composição interna só instala o framework quando `opts.project-context` está presente (`src/setup/run.ts:419`: `opts.project-context ? installformer project tool(...) : null`). Isoladamente, isso parece indicar que former project tool é opcional.

Os dois pontos de entrada reais, porém, sempre fornecem esse campo:

- CLI (`src/cli.ts:224-234`, comando `maestro setup`): chama `runSetup({ ..., framework: { execute: realformer project toolExecutor() }, ... })` incondicionalmente. `SETUP_FLAGS` (a lista de flags aceitas por `formatSetup`) não inclui nenhuma flag de opt-out para former project tool.
- Ferramenta MCP (`src/mcp/tool.ts:120-140`, `executeSetup`): chama `runSetup({ ..., framework: { execute: realformer project toolExecutor() }, ... })`, também incondicionalmente.

Ou seja, `opts.project-context?` é uma costura de injeção de dependência para teste (permitir que testes unitários chamem `runSetup` sem instalar o framework de verdade), não uma opção de produto exposta a quem usa o CLI ou a ferramenta MCP.

## Conclusão normativa

Esta spec assume former project tool sempre presente em qualquer instalação real de `maestro setup`. Não é necessário desenhar ou testar um caminho "documentação sem former project tool" — a condição `.project-context/` presente (usada em FR-004) é sempre verdadeira em uso real, e existe na spec apenas como salvaguarda defensiva, não como um cenário de produto a suportar.
