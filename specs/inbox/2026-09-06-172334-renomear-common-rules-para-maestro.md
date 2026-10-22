# Inbox: Renomear common-rules para maestro

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-06T15:23:34Z |
| Slug | renomear-common-rules-para-maestro |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `5a39c10c9229e06368d35bd1427a64437530ffae6ae476b83d723d44453a9a2c` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

A pessoa responsável mencionou querer renomear a ferramenta para maestro, e pediu explicitamente que isso não fosse considerado agora. Fica registrado como captura futura: é renomeação que toca nome de pacote, binário, PROJECT.md, STACK.md e duas specs concluídas. (Anotação original capturada em specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md, seção de decisões da fatia 1g, 2026-08-29; formalizada como captura de inbox própria a pedido explícito do usuário em 2026-09-06, que pediu cobertura completa do roadmap incluindo esta intenção de renomeação.)

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Intenção declarada de renomear o projeto de common-rules para maestro, deliberadamente adiada quando mencionada pela primeira vez e nunca refinada.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Não identificado no texto original — a anotação registra apenas a intenção de renomeação e o pedido explícito de não considerá-la naquele momento, sem articular o problema que o novo nome resolveria.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Inferência: quem mantém o repositório e decide sua identidade pública; por extensão, qualquer consumidor externo do pacote npm, do binário CLI ou de documentação que referencie o nome atual.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Não identificado no texto original — nenhum resultado ou valor esperado foi articulado além do desejo de um nome novo.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Escopo nomeado na anotação original: nome de pacote npm, nome do binário CLI, PROJECT.md, STACK.md, e duas specs já concluídas que citam o nome atual. Repositório GitHub, imagem Docker Hub (common-rules-server) e o servidor MCP (common-rules-mcp) não foram mencionados na anotação original, mas são superfícies prováveis pela natureza da mudança.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Não identificado no texto original.

### Riscos e dependências

**Análise preliminar:** Inferência: renomeação de pacote publicado quebra instalações existentes sem uma estratégia de transição (deprecar o nome antigo, alias, ou major version bump). Duas specs concluídas (ao menos) citam o nome atual como parte de sua evidência histórica — mudar retroativamente contradiria a regra do projeto de preservar evidência de specs completas. Imagem Docker Hub, remote git e CI/CD publicados sob o nome atual não foram considerados na anotação original.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Hipótese: pode virar um épico técnico de rebranding, análogo em escopo ao início do épico v1-cli-first, mas sem o componente de reescrita de comportamento — só identidade. Pode esperar um gatilho externo (ex: publicação pública do pacote, ou decisão de abrir o projeto).

## Pontos a revisar no futuro

**A revisar:** Se a renomeação é só de superfície (nome, docs) ou también renomeia o diretório .common-rules/ que os projetos consumidores já têm em produção, o que quebraria compatibilidade de instalações existentes. Se specs concluídas que citam o nome atual são reescritas ou preservadas como registro histórico. Se há um gatilho ou prazo real, ou se a intenção segue sem data. Se o nome 'maestro' já está livre no npm.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$framework-02-backlog`.
