# Inbox: MCP setup nao instala skills nem former project tool, so hooks

| Metadado | Valor |
| --- | --- |
| Status | Tratada — corrigido diretamente em src/mcp/tool.ts |
| Capturada em | 2026-09-06T06:24:32Z |
| Slug | mcp-setup-nao-instala-skills-nem-framework-so-hooks |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `9bab81290bb6a6fc943ec4bef9d53d43faa2522103aad19213613b5347873435` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

A tool MCP "setup" (src/mcp/tool.ts, função executeSetup) não instala skills externas nem o framework former project tool — só hooks e a skill embutida do próprio common-rules. Diferente da CLI real (common-rules setup via terminal), cuja função formatSetup (src/cli.ts, linhas 169-170) passa skills: { execute: realSkillsExecutor() } e framework: { execute: realformer project toolExecutor() } para runSetup, a função executeSetup (src/mcp/tool.ts) chama runSetup sem esses dois campos. Por design de runSetup (comentário em src/setup/run.ts: "Executor for the skills installer. Absent, installation is skipped" e o mesmo para framework), isso significa que rodar o setup pela tool MCP instala só os hooks (7) e a skill embutida do próprio framework (common-rules-extension-creator, via deliverBundledSkill, caminho à parte), nunca os skills externos (mattpocock/skills, removed-project-tool) nem o framework former project tool em si. Reproduzido de verdade em duas situações: (1) rodando "common-rules setup --target claude-code" via terminal em /tmp hoje, o "Plan:" listou explicitamente "install skills from mattpocock/skills", "install skills from removed-project-tool" e "install former project tool framework", e a execução instalou 37+20 skills e criou .project-context/; (2) um setup real rodado numa sessão anterior contra /home/bcalmon/Projects/SDE-Interview-and-Prep-Roadmap/ (aparentemente via MCP, não CLI) resultou em apenas 7 hooks em .claude/settings.json e 1 skill (common-rules-extension-creator) em .claude/skills/ e .agents/skills/, sem .project-context/ e sem os skills externos. O teste que deveria pegar essa divergência (tests/mcp-parity.test.ts) não pega: ele compara executeSetup() contra uma chamada direta a runSetup() que TAMBÉM omite skills/framework, em vez de comparar contra o comportamento real de formatSetup() (a CLI de verdade). Então o "parity test" garante paridade de hooks, mas não cobre a lacuna de skills/framework entre os dois entry points. Não está claro ainda se isso é bug (lacuna de paridade não intencional) ou design deliberado (a descrição da tool MCP setup diz apenas "installs the hooks that connect the subsystems to the agent's cycle and records the installation" — não promete skills nem former project tool). Precisa de decisão: se o objetivo é a tool MCP ser paridade completa com a CLI, executeSetup() precisa passar skills/framework executors reais (os mesmos realSkillsExecutor()/realformer project toolExecutor() usados em src/cli.ts) para runSetup(); se for design intencional, a descrição da tool e o parity test deveriam deixar isso explícito para não confundir quem espera os dois caminhos fazerem a mesma coisa.

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** executeSetup (MCP) nao passa skills/framework executors para runSetup, ao contrario de formatSetup (CLI); resultado real: setup via MCP instala so 7 hooks e a skill embutida, sem mattpocock/skills, removed-project-tool nem .project-context/.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Quem chama o setup via MCP espera o mesmo resultado da CLI, mas recebe uma instalacao parcial sem aviso — e o teste de paridade existente nao cobre essa lacuna.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Quem configura um projeto novo atraves de um agente com o MCP common-rules-server disponivel, esperando paridade com common-rules setup no terminal.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Ou a tool MCP passa a instalar skills/framework como a CLI (paridade real), ou a descricao da tool e o parity test deixam explicito que o escopo e so hooks — nos dois casos, sem surpresa para quem usa.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Arquivos: src/mcp/tool.ts (executeSetup, sem skills/framework), src/cli.ts linhas 169-170 (formatSetup, com skills/framework), src/setup/run.ts (comentario documentando o skip quando ausente), tests/mcp-parity.test.ts (compara contra runSetup() puro, nao contra formatSetup real).

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Não identificado no texto original.

### Riscos e dependências

**Análise preliminar:** Nenhum risco em producao alem da confusao de expectativa; e comportamento existente, nao uma regressao introduzida agora.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Opcao A: fazer executeSetup passar os mesmos realSkillsExecutor()/realformer project toolExecutor() da CLI. Opcao B: manter escopo so-hooks no MCP, mas deixar isso explicito na descricao da tool e ajustar o parity test para nao dar falsa sensacao de paridade completa.

## Pontos a revisar no futuro

**A revisar:** Confirmar qual das duas opcoes e a intencao antes de qualquer mudanca de codigo; e uma decisao de produto/escopo, nao so tecnica.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Nenhum — resolvido, opção A das direções propostas na captura ("fazer
executeSetup passar os mesmos realSkillsExecutor()/realformer project toolExecutor() da
CLI"). Confirmado em `src/mcp/tool.ts`: `executeSetup` agora passa `skills`,
`framework` e `bridgeEnv` para `runSetup`, mesma forma que `formatSetup` em
`src/cli.ts`. Aprovação também resolvida com um `DecisionSource` fixo
(`alwaysApprove`) em vez de tentar ler stdin do processo MCP. Verificado de
verdade contra `/home/bcalmon/Projects/SDE-Interview-and-Prep-Roadmap/`, o
projeto onde a lacuna foi originalmente notada.
