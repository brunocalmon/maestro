# Inbox: Orchestrator monta times multi-agente dinâmicos (3-9 instâncias) e delega para CLIs externas

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-06T19:28:59Z |
| Slug | orchestrator-monta-times-multi-agente-dinamicos-3-9-instancias-e-delega-para-clis-externas |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `d020a54c786a062c7eb41c4d19d0a63533fa4034b42552b2deb28a62962343c2` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

O Orchestrator (extensão do framework) monta times dinâmicos de 3 a 9 instâncias operacionais sob demanda, ou atua em modo solo, dependendo da complexidade. Tem total liberdade para escolher a ferramenta: subagents nativos da IDE (ex: subagents do Cursor) ou subprocessos CLI de agentes externos (pi.dev, aider, goose, agy). Ao abrir um subprocesso, injeta dinamicamente regras e guardrails (ex: AGENTS.md temporário ou parâmetros). Roda os agentes externos em modo headless/print (-p, --mode json), capturando a saída sem poluir a interface. Define explicitamente o modelo que cada subprocesso deve usar (--model ollama/qwen2.5:8b, Claude, DeepSeek, etc.), permitindo orquestração híbrida local/nuvem. Hierarquia: humano pede ao Orchestrator, subagents/subprocessos reportam ao Orchestrator, Orchestrator reporta ao humano. Aprovação obrigatória: o Orchestrator sempre apresenta o planejamento da orquestração (ferramentas, modelos, guardrails) para revisão humana antes de executar. (Formalizada como captura de inbox própria em 2026-09-06, a pedido explícito do usuário que pediu cobertura completa do roadmap; texto original consolidado a partir de specs/inbox/2026-08-24-191151-reestruturacao-mcp-para-cli-com-orchestrator-multi-agente.md, seção 3 'O Orchestrator e a Delegação Flexível', e seção 4 'Fluxo de Trabalho e Human-in-the-Loop'.)

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** O Orchestrator ganharia a capacidade de montar equipes dinâmicas de 3 a 9 subagents (nativos da IDE ou subprocessos de CLIs externas como pi.dev/aider/goose), escolhendo modelo e ferramenta por tarefa, sempre com aprovação humana do plano antes de executar.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Declaração original: hoje o Orchestrator (na visão original de 24/08) seria um único agente fixo sem capacidade de delegar dinamicamente para múltiplas instâncias especializadas ou para CLIs de terceiros, limitando paralelismo e escolha de modelo por subtarefa.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Quem usa o common-rules/maestro para orquestrar tarefas de codificação complexas que se beneficiariam de paralelismo ou de ferramentas CLI externas especializadas (pi.dev, aider, goose).

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Declaração original: orquestração híbrida de IAs locais e na nuvem, com relatório único ao humano e aprovação obrigatória do plano antes da execução — mais capacidade sem perder controle humano.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Escopo citado no texto original: tamanho de time 3-9 instâncias ou modo solo; subagents nativos da IDE vs subprocessos CLI externos (pi.dev, aider, goose, agy); injeção de regras via AGENTS.md temporário ou parâmetros; modo headless/print (-p, --mode json); seleção explícita de modelo por subprocesso; hierarquia de reporte Orchestrator-cêntrica; aprovação obrigatória do plano antes de executar.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Sinais para conversar depois: o que fica registrado de cada execução multi-agente (qual time foi montado, qual modelo cada subagent usou, resultado de cada um) — não definido no texto original; se isso se conecta ao trace_id já entregue pela SPEC-0006.

### Riscos e dependências

**Análise preliminar:** Inferência: sobreposição grande com decisões já vinculantes do projeto — SPEC-0002 (DEC-002) fixa três subsistemas orquestrados (framework, context-mode, code-review-graph), sem pi.dev como dependência fixada; SPEC-0008 (fatia 1d) já entregou detecção de backends de agente sem instalar globalmente; SPEC-0010 já entrega aprovação em lote de comandos, potencialmente sobreposta com 'aprovação obrigatória do plano' descrita aqui. O próprio backlog-0003 (linha 34) já classificou 'multi-agente orchestration' como Phase 2+, sem desenho, distinto do que foi de fato promovido e entregue (SPEC-0002 a SPEC-0013).

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Hipótese: pode ser um épico próprio (Phase 3?), sucessor de Phase 2 (extensões, já entregue via SPEC-0011). Depende de decisão sobre se 'times de 3-9 instâncias' usa o mecanismo nativo de subagents do Claude Code (Agent tool) em vez de reimplementar orquestração própria.

## Pontos a revisar no futuro

**A revisar:** Se o tamanho de time (3-9) é uma regra rígida ou só uma faixa observada em uma ferramenta de referência (Claude Code já tem Agent tool nativo — construir um orquestrador próprio pode duplicar isso). Se pi.dev/aider/goose entram como dependências fixadas (contra DEC-002) ou apenas detectadas (a favor da fatia 1d). Se a aprovação de plano aqui é distinta da aprovação em lote de comandos já entregue (SPEC-0010) ou é a mesma coisa. Se subagents nativos da IDE (ex: Cursor, Claude Code) já resolvem o called-for sem precisar de spawn de subprocesso próprio.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$framework-02-backlog`.
