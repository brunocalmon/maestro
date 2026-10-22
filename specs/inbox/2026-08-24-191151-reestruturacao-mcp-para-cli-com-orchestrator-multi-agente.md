# Inbox: Reestruturação: MCP para CLI com Orchestrator Multi-Agente

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-08-24T17:11:51Z |
| Slug | reestruturacao-mcp-para-cli-com-orchestrator-multi-agente |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `147c56a89a027c7cee3899373d13a50e46cf06879600d099977ecadb77d389a4` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

Aqui está a especificação atualizada, com a nova seção de Dependências e a Dinâmica do Orchestrator expandidas para refletir essa flexibilidade de subprocessos:
1. Visão Geral e Arquitetura Base

* Transição de MCP para CLI: O projeto será reestruturado para ser primordialmente uma interface de linha de comando (CLI). O Agent IDE usará apenas o CLI via scripts automatizados.
* Servidor MCP Reduzido: O suporte a MCP será mantido, mas de forma extremamente enxuta, possuindo apenas uma única tool: `setup`.
* Projeto Wrapper: A arquitetura principal passa a funcionar como um agrupador (wrapper) para orquestrar outros módulos, em vez de implementar tudo do zero.

2. Gestão de Dependências e CLIs Embutidos

* Ecossistema de Dependências Fixadas: O projeto terá dependências diretas com versões fixadas (travadas no `package.json`). Ao instalar o seu aplicativo, o sistema garantirá automaticamente a presença de:
   * `framework`, `context-mode` e `code-review-graph`.
   * Agentes de IA via CLI: `pi.dev` (e afins que você decidir suportar, como `aider`, `goose`, `openinterpreter`, etc.).
* Isolamento de Ambiente: Por serem instalados como subdependências locais (ex: via npm), não há necessidade de ferramentas globais na máquina do usuário, garantindo que qualquer pipeline de CI ou membro da equipe rode exatamente a mesma versão das ferramentas.
* Instalação Centralizada: A instalação e a configuração agnóstica de IDE se darão unicamente pelo `common-rules-server` (futuro novo nome), distribuindo os hooks necessários para todo esse ecossistema.
* Motor Central de Skills: Não haverá mais regras e skills próprias no projeto base. O `framework` assumirá o papel de motor central de skills e regras.

3. O Orchestrator e a Delegação Flexível

* Único Agente Fixo: O Orchestrator (uma extensão do `framework`) será o único subagent fixo do sistema e o responsável por gerenciar toda a execução.
* Times Dinâmicos e Multi-Agentes: O Orchestrator montará times de 3 a 9 instâncias operacionais sob demanda, ou atuará em "modo solo", dependendo da complexidade.
* Flexibilidade de Subagents (IDE vs Externos): O Orchestrator terá total liberdade para escolher a melhor ferramenta para o trabalho:
   * Subagents Nativos da IDE: Pode acionar os recursos built-in da própria IDE (ex: subagents do Cursor) quando for conveniente.
   * Subprocessos CLI (Agentes Externos): Para ferramentas como `pi.dev`, `aider`, `goose`, `agy`, etc., o Orchestrator não criará um subagent tradicional da IDE, mas sim fará um spawn de um subprocesso no terminal.
* Injeção de Regras e Skills via CLI: Ao abrir um subprocesso para um agente externo, o Orchestrator delegará a tarefa injetando dinamicamente as regras (ex: gerando um `AGENTS.md` temporário ou passando via parâmetros) e os guardrails necessários para a execução segura daquela CLI.
* Consumo Headless: O Orchestrator agirá como o "Mestre", rodando as ferramentas de CLI em background (ex: usando o modo JSON/Print `-p` do pi.dev) para capturar a saída sem poluir a interface, avaliando o resultado antes de prosseguir.
* Agnóstico de Modelo (LLM): O Orchestrator definirá explicitamente qual modelo o subprocesso deve usar ao invocá-lo (ex: chamando o CLI com `--model ollama/qwen2.5:8b`, Claude, DeepSeek, etc.), permitindo uma orquestração híbrida de IAs locais e na nuvem.

4. Fluxo de Trabalho e Human-in-the-Loop

* Hierarquia de Reporte: O humano pede a tarefa ao Orchestrator. Os subprocessos/subagents dinâmicos reportam os resultados ao Orchestrator. O Orchestrator reporta o resultado final ao humano.
* Aprovação Obrigatória: O Orchestrator sempre precisará apresentar o planejamento da orquestração — detalhando quais ferramentas CLI usará, quais modelos locais/nuvem invocará e os guardrails aplicados — para revisão e aprovação do humano antes de iniciar a execução.

Essa abordagem de usar o `pi.dev` (e outros) como um "subprocesso headless" chamado pelo seu Orchestrator é fantástica para construir um ecossistema autônomo muito poderoso. Tem mais alguma ferramenta ou comportamento de CI/CD que você deseja amarrar nessa especificação?

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Transformar common-rules-server em CLI wrapper que orquestra agentes via subprocessos, centralizando dependências e delegando skills ao framework.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Projeto atual é pesado (6 tools MCP), carrega todo o kit built-in, e replica funcionalidades de ferramentas especializadas como framework. Oportunidade: simplificar para CLI headless com orchestration dinâmica de agentes internos e externos.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Desenvolvedores usando agentes em CLI (pi.dev, aider, goose, openinterpreter); times precisando versões fixadas de ferramentas; IDEs múltiplas (Cursor, Claude Code, Windsurf, Antigravity).

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Redução de complexidade no core; reutilização de framework/context-mode/code-review-graph como subsistemas; suporte a agentes CLI locais e na nuvem; garantia de versões fixadas em todo o ecossistema; human-in-the-loop explícito com aprovação de planos antes de execução.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Modelo de wrapper/orquestrador em vez de monolítico; headless CLI para background execution; agnosticismo de LLM (ollama, claude, deepseek); injeção de regras/skills via dinamicamente gerado AGENTS.md; hierarquia de reporte clara (humano → orchestrator → subprocessos).

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Mapeamento de CLI tools suportadas (pi.dev, aider, goose, openinterpreter, agy); versões fixadas de framework, context-mode, code-review-graph; modelos LLM suportados; flags/opções de cada CLI para headless execution; formato de injec de regras e approval workflows.

### Riscos e dependências

**Análise preliminar:** Dependência de framework como motor central (versionamento, breaking changes); complexidade de orquestração multi-agente e sincronização de subprocessos; garantir que injeção de regras/skills funcione para cada CLI sem poluir seu namespace; testing complexo com múltiplos agentes concorrentes; possível latência de aprovação manual bloqueando execução.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Fase 1: CLI core com Orchestrator básico; Fase 2: suporte pi.dev, context-mode, code-review-graph; Fase 3: aider, goose, openinterpreter; Fase 4: orquestração de teams dinâmicos (3-9 agentes); Fase 5: modelos híbridos locais/nuvem; possível extensão futura a CI/CD pipelines.

## Pontos a revisar no futuro

**A revisar:** Conflitos a resolver: como manter compatibilidade com MCP clients já conectados (Cursor, Claude Code) enquanto transiciona para CLI-first? Qual é o escopo exato do 'Orchestrator' - É um agente former project tool modificado ou novo subagente? Como injetar regras dinamicamente sem modificar permanentemente o projeto do user? Precisa de aprovação de plano antes de CADA task ou somente para orquestrações complexas (3+ agentes)?

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$framework-02-backlog`.
