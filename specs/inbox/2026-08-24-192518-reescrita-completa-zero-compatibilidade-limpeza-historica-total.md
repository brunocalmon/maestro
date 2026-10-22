# Inbox: Reescrita completa: zero compatibilidade, limpeza histórica total

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-08-24T17:25:18Z |
| Slug | reescrita-completa-zero-compatibilidade-limpeza-historica-total |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `6dc46ebe62f61cdf0482d6eb65e73ce2a4f4db565d28be1d5d34f79b2f1ce655` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

essa é uma mudança completa, eu espero não ver nem menção do que tinha antes nas docs e código, nenhum compatibilidade com o antigo, nada, vamos sobreescrever o passado desse repositorio completamente.

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Este é um rewrite radical do repositório. Nenhuma compatibilidade com versão anterior, nenhuma menção do código Python/MCP antigo, limpeza histórica completa em docs e source code.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Projeto antigo (Python, MCP-centric, 47 recursos built-in, 6 tools) é fundamentalmente diferente da nova direção (TypeScript, CLI-first, wrapper/orchestrator). Manter compatibilidade ou referências ao passado confundiria e atrasaria execução.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Novos usuários que lerão a documentação (não devem ver código antigo); times refatorando o projeto; comunidade usando versão 0.2.8 (será breaking change).

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Documentação limpa refletindo apenas a nova arquitetura; sem débito técnico de compatibilidade; sem confusão entre versão antiga e nova; sem legacy patterns no código; repositório como tabula rasa para nova direção.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Rewrite completo (não refactor); breaking change intencional; limpeza histórica; fresh start; versão major.0; sem suporte backward compatibility; sem branches de maintenance da versão antiga.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Versão atual: 0.2.8. Versão nova será: 1.0.0 (ou major version bump). Decidir se remover ou mover wiki antigo (.docs/wiki/history?). Decidir escopo de limpeza: remover todos os recursos Python, remover testes antigos, remover ADRs antigos, remover template antigo, remover hooks antigos?

### Riscos e dependências

**Análise preliminar:** Usuários de 0.2.8 perderão acesso se versão nova não tiver migration guide; comunidade pode bifurcar o projeto se achar mudança muito drástica; perda de decisões arquiteturais documentadas em ADRs antigos (FND-001 até FND-031); documentação histórica pode ter valor para compreender contexto.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Fase 1: Confirmar escopo exato de limpeza; Fase 2: Arquivar versão 0.2.8 (tag, branch, ou repositório separado); Fase 3: Reescrita completa; Fase 4: Migration guide para ex-usuários (opcional); Fase 5: Release 1.0.0.

## Pontos a revisar no futuro

**A revisar:** Arquivar 0.2.8 em branch/tag antes de começar rewrite? Mover .docs/wiki/ para .docs/wiki-v0.2.8/ ou deletar? Manter CHANGELOG mencionando 'v1.0 é rewrite radical de v0.2.8'? Oferecer migration guide ou assumir break limpo? Remover git history antigo ou manter para referência?

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$framework-02-backlog`.
