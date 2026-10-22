# Inbox: Refatoração para TypeScript com Orchestrator self-aware e approval workflow

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-08-24T17:18:40Z |
| Slug | refatoracao-para-typescript-com-orchestrator-self-aware-e-approval-workflow |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `e9bb81dcaafd013451f880d845ebdb946e7a1dbdff5f8a4305178bbd7a985d6f` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

common rules deverá ser refatora para typescript e terá context-mode, code-review-graph e pi.dev como dependencias obrigatorios e também terá os @src/common_rules_server/resources/hooks necessarios built-in. 

common rules sempre irá perguntar se o plano está correto e se o modelo usando (com recomendação) é o adequado par acada subagent, e para si proprio, visto que o proprio orchestrator tbm é um subagent, então ele tbm será "montado" e pode tbm ser um subprocesso externo via (pi.dev por exemplo) e então orchestrara normalmente mente podendo assumir tanto a single como criando outros subagents seja por cmd de instalações como claude, cursor-agent, agy e etc, ou ollama via pi.dev... normalmente, só n vai poder usar a funcção built-in da ide pois logicamente já vai delegado para fora. 

Entendeu minha ideia?

O importante é que ao fazer o setup do meu common-rules tudo isso seja configurado, sync e etc.

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Refatorar common-rules para TypeScript com dependências fixadas (context-mode, code-review-graph, pi.dev), Orchestrator como subagent autoconsciente que pergunta por aprovação de plano e modelo antes de execução, podendo rodar localmente ou via pi.dev headless.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Projeto atual em Python/MCP é pesado e não captura explicitamente a aprovação do plano antes de orquestração. Oportunidade: refatorar em TypeScript para consolidar dependências, tornar Orchestrator self-aware (sabe que é um subagent) e forçar validação humana de plano + escolha de modelo antes de delegar.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Desenvolvedores usando common-rules via setup; Orchestrator como subagent que se reconhece e pede aprovação; subagents delegados (claude, cursor-agent, agy, ollama via pi.dev); equipes que precisam versões idênticas e setups automáticos.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Setup único que configura tudo (dependências, hooks, sync); Orchestrator que pergunta explicitamente por aprovação de plano antes de executar; recomendação automática de modelo com possibilidade de override; self-awareness do Orchestrator (sabe que é subagent e pode ser delegado); flexibilidade de rodar single ou multi-agente; isolamento de ambiente garantido.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Refatoração TypeScript (alinhamento com former project tool/pi.dev ecosystem); Orchestrator como subagent self-aware; sempre pedir aprovação de plano antes de execução; model selection com recomendação; suporte a múltiplos backends (local ollama, cloud claude, cursor-agent, agy); setup único centralizado; hooks built-in do projeto incluídos automaticamente.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Hooks necessários a incluir built-in (@src/common_rules_server/resources/hooks/); lista de subagents suportados (claude, cursor-agent, agy); modelos suportados (local ollama via pi.dev, cloud claude, deepseek, etc); approval workflow format (plano → humano revisa → recomendação modelo → humano aprova); config template para setup automático.

### Riscos e dependências

**Análise preliminar:** Complexidade de TypeScript refactor (reescrever 47 recursos + testes); garantir que Orchestrator consegue ser delegado via pi.dev sem perder contexto; sincronização de hooks em setups diferentes; latência de aprovação bloqueando execução; compatibilidade com IDE built-ins (Cursor, Claude Code agents) sendo substituídos por pi.dev headless.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Fase 1: Refator TypeScript core + setup centralizado; Fase 2: Orchestrator self-aware com approval workflow; Fase 3: model recommendation engine; Fase 4: suporte pi.dev headless; Fase 5: multi-agente orchestration; Fase 6: hooks e guardrails built-in automático; possível integração futura com CI/CD.

## Pontos a revisar no futuro

**A revisar:** Como diferenciar quando Orchestrator roda localmente vs via pi.dev? Como manter contexto de aprovação quando Orchestrator é delegado? Setup deve ser puramente CLI ou manter suporte MCP? Hooks built-in devem ser sempre ativos ou configuráveis? Qual é a interface de aprovação - prompt interativo, JSON stdin, ou API?

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$framework-02-backlog`.
