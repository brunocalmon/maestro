# Inbox: Hooks resistentes a qualquer ferramenta e uso garantido dos CLIs em pesquisa, com regras só como fallback sem overlap

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-17T14:06:00Z |
| Slug | hooks-resistentes-a-qualquer-ferramenta-e-uso-garantido-dos-clis-em-pesquisa-com-regras-so-como-fallback-sem-overlap |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `9a471565d7d938ff3be2fd20262f286972087cffb01cee503756324ab1f2c6f5` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

o hook deve ser resistente a todas as possibilidades, seja bash, seja tool zsh... a ideia de usa hook é não inflar contexto com regra que pode ser automatizada, mas se regra for necessaria para fallback, beleza, e não é só esse hook, todos os hooks precisam ser resistentes, até pq n adianta nada usar o context-mode/code-review-graph ou qualquer cli que eu queira usar se na hora da leitura para pesquisa, discovery e etc ele n faz usar e isso precisa tbm ser garantido, seja por hook, seja por regra... eu prefiro que tenha hook que já processe tudo evitando gasto de token e uso de contexto, mas se rules for necessario mesmo é que vc que me diz, mas tem que tomar cuidado com overlap, se o hook funcionar a rule n deve re-impor o que foi feito, apenas garantir que nada passa batido.

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Todos os hooks do maestro devem interceptar qualquer ferramenta que execute ou edite (Bash, shells via MCP, Edit/Write, subagentes), preferindo automação por hook a regra em texto; regras existem só como fallback condicional, sem repetir o que o hook já faz; o uso de context-mode/code-review-graph em leitura, pesquisa e discovery também precisa ser garantido.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Hoje os guards só veem o tool Bash (tool_input.command); edições via Bash/MCP/subagente não atualizam o code-review-graph (grafo ficou parado em 30/08); nenhum hook garante o uso dos CLIs durante pesquisa/discovery; regras em texto inflam contexto e podem se sobrepor ao hook.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** O mantenedor do maestro e qualquer agente operando em projeto consumidor com context-mode, code-review-graph ou outro CLI adotado pelo usuário.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Hooks que processam tudo automaticamente (guards em qualquer shell, atualização do grafo após qualquer edição, lembrete de uso do grafo sem inflar contexto) e regras mínimas de fallback que só garantem cobertura quando o hook estiver ausente ou inerte, verificável pelo doctor.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Declaração: hook deve ser resistente a todas as possibilidades (bash, tool zsh, etc.). Declaração: preferência por hook que já processe tudo, evitando gasto de token e contexto. Declaração: regra só se necessária como fallback; o agente deve dizer quando é necessária. Declaração: cuidado com overlap — se o hook funcionar, a regra não deve reimpor, só garantir que nada passe batido. Declaração: garantir uso do context-mode/code-review-graph ou qualquer CLI escolhido na leitura para pesquisa e discovery. Inferência: mecanismo tools: da SPEC-0022 permite ampliar matchers; extração de comando precisa cobrir command/code/script; code-review-graph-update em PostToolUse amplo + Stop com detecção de mudança no working tree; dica de grafo uma vez por sessão em Grep/Glob; regras condicionais ao doctor (BACKLOG-0013).

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Sinal: estado por sessão/rodada (hash do git status, marca de dica já emitida) em .maestro/state/ para hooks idempotentes e sem repetição de contexto.

### Riscos e dependências

**Análise preliminar:** Risco: hook em PostToolUse amplo adiciona latência por chamada; mitigar com verificação barata de mudança. Risco: negar Grep/Read para forçar o CLI é agressivo; preferir dica única. Dependência: SPEC-0022 (tools:, scripts em arquivo) e BACKLOG-0013 (doctor que verifica cobertura hook ↔ regra). Conflito potencial: context-mode já injeta orientação em PreToolUse; evitar duas dicas concorrentes.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Backlog próprio 'hooks resistentes e fallback sem overlap' ou incorporação em BACKLOG-0013; regra mínima em RULES.md/router condicionada ao doctor; ampliar matchers dos guards para Bash|mcp__.*(execute|run|shell|terminal).*; code-review-graph-update em Edit|Write|MultiEdit|NotebookEdit|Bash|mcp__.* + Stop.

## Pontos a revisar no futuro

**A revisar:** Quais ferramentas MCP concretas executam shell nos projetos do usuário (context-mode ctx_execute, terminal, playwright run_code). Se a dica de uso do grafo deve ser por sessão ou por prompt. Se hooks valem para subagentes em todas as versões do Claude Code em uso. Custo de latência aceitável por chamada de ferramenta.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.
