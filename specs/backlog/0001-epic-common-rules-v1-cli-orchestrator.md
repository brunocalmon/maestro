# Backlog: Epic: Common Rules v1.0 — CLI-first orchestrator com human-in-the-loop

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0001 |
| Status | Promoted |
| Produto | A esclarecer |
| Épico | A esclarecer |
| Funcionalidade | A esclarecer |
| Tipo | A esclarecer |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-08-24 |
| Spec promovida | Desdobrado em quatro backlogs e cinco specs; ver Referências relacionadas |

## Ideia original

Rewrite radical do common-rules-server: de MCP-centric Python para CLI-first TypeScript. Wrapper que orquestra agentes (framework, context-mode, code-review-graph, pi.dev) com Orchestrator self-aware que solicita aprovação de plano e recomenda modelo baseado em análise completa de custo/capacidade/recursos. Setup híbrido MCP+CLI. Graceful degradation: apenas backends disponíveis. Zero compatibilidade com v0.2.8. Branch experimental refactor/v1-cli-first, versão 1.0.0.

## Problema percebido

v0.2.8 é pesado (Python, 6 tools MCP, 47 recursos built-in), replica funcionalidades de ferramentas especializadas (framework, context-mode, code-review-graph), não força aprovação de plano antes de orquestração, sem detecção clara de ambiente.

## Pessoa afetada ou beneficiada

Desenvolvedores usando agentes em CLI e IDEs; times com ambientes heterogêneos; usuários que querem versões fixadas garantidas; CI/CD pipelines.

## Resultado ou valor esperado

Projeto simples como wrapper/orchestrator em TypeScript; aprovação explícita de plano antes de execução; recomendação automática de modelo; detecção de backends com fallback graceful; instalação determinística via npm; isolamento de ambiente garantido; reutilização de framework/context-mode/code-review-graph.

## Contexto

Consolidação de 4 ideias: (1) arquitetura CLI+wrapper, (2) TypeScript+Orchestrator self-aware, (3) graceful degradation, (4) reescrita completa. Decisões: branch experimental refactor/v1-cli-first, versão 1.0.0, npm como package manager, hybrid MCP+CLI setup, approval workflow interativo/JSON, detecção híbrida com cache+revalidação, model selection analítico (custo/capacidade/recursos/usage).

## Referências relacionadas

Este épico não virou uma spec: desdobrou-se em fases, e cada fase em fatias.

| Caminho | Relação |
| --- | --- |
| `specs/backlog/0002-phase-0-preparacao-limpeza-historica.md` | fase derivada — promovida em `SPEC-0001`, concluída |
| `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md` | fase derivada — fatias 1a a 1h; 1a, 1b e 1f concluídas |
| `specs/backlog/0004-phase-2-extensoes-locais-e-heal.md` | fase derivada — extensões locais, reparo assistido e hidratação adiada |
| `specs/backlog/0005-fatia-1h-skills-lado-a-lado.md` | fatia da Phase 1 — promovida em `SPEC-0005` |
| `specs/completed/0001-phase-0-preparacao-limpeza/spec.md` | entregue |
| `specs/completed/0002-phase-1a-esqueleto-typescript/spec.md` | entregue |
| `specs/completed/0003-fatia-1b-setup-hooks/spec.md` | entregue |
| `specs/completed/0004-fatia-1f-servidor-mcp/spec.md` | entregue |
| `specs/defined/0005-fatia-1h-skills-lado-a-lado/spec.md` | em definição |

**Correção de 2026-08-29.** A formulação original cita `pi.dev` entre as dependências. A pessoa responsável corrigiu isso depois: agentes de codificação são detectados e nunca instalados, e as dependências do projeto são `framework`, `context-mode` e `code-review-graph`. A formulação acima é preservada como registro; a `DEC-002` da `SPEC-0002` é que governa.

## Comportamento esperado

A esclarecer.

## Regras de negócio

- A esclarecer conforme risco e complexidade.

## Critérios de aceitação

- A esclarecer antes de considerar o item refinado.

## Qualidades e operação

- Segurança: a avaliar.
- Privacidade: a avaliar.
- Desempenho e volume: a avaliar.
- Auditoria e observabilidade: a avaliar.

## Dependências

- Nenhuma registrada.

## Situações de erro

- A esclarecer.

## Escopo

- Dentro: a esclarecer.
- Fora: a esclarecer.

## Dúvidas, decisões e riscos

- Nenhum registrado.

## Pronto para desenvolvimento

- [ ] O problema e a pessoa beneficiada estão claros.
- [ ] O evento inicial e o resultado esperado estão claros.
- [ ] Permissões, regras e exceções relevantes estão claras.
- [ ] O resultado pode ser verificado objetivamente.
- [ ] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [ ] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Nenhum neste item. O trabalho vive nas fases derivadas. Da Phase 1 restam as fatias 1c, 1d, 1e e 1g; a Phase 2 aguarda o fim da Phase 1.
