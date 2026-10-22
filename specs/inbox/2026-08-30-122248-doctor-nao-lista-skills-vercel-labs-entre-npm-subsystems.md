# Inbox: doctor nao lista skills vercel-labs entre NPM_SUBSYSTEMS

| Metadado | Valor |
| --- | --- |
| Status | Encerrada sem ação — não é defeito (ver seção final) |
| Capturada em | 2026-08-30T10:22:48Z |
| Slug | doctor-nao-lista-skills-vercel-labs-entre-npm-subsystems |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Sessão de reabertura da SPEC-0005/SPEC-0007, 2026-08-30. |
| Turno da conversa | Levantado no relatório final da reabertura da SPEC-0005/0007, investigado agora a pedido explícito do usuário. |
| Integridade do original | SHA-256 `2de29b75111dc855e43940e941bbd36a3a1c130373e628ed259cb986a9e8c2e0` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

Achado levantado ao final da reabertura da SPEC-0005 (2026-08-30): doctor ainda não lista skills entre NPM_SUBSYSTEMS. Usuário pediu tratamento formal de todos os achados pendentes.

## Contexto consultado

src/doctor.ts (NPM_SUBSYSTEMS), specs/completed/0002-phase-1a-esqueleto-typescript/spec.md (FR-004, FR-006, DEC-002).

## Resumo processado

**Inferência:** Investigação mostrou que NÃO é um defeito: NPM_SUBSYSTEMS é, por decisão explícita da SPEC-0002 (DEC-002), o conjunto fechado dos três subsistemas que o common-rules orquestra — removed-project-integration, context-mode e code-review-graph. skills (vercel-labs) é um instalador, não um subsistema orquestrado, e já tem seu próprio relato pelo doctor através de reportSkills()/FR-024 (SPEC-0005), que confere os conjuntos de skills instalados, não a presença do pacote skills em si.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Nenhum: doctor já relata o que precisa relatar sobre skills — presença de cada conjunto (mattpocock, framework) e divergência — através de um mecanismo dedicado (reportSkills), separado de NPM_SUBSYSTEMS por desenho, desde a SPEC-0005 original.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Ninguém afetado; nenhuma mudança de comportamento necessária.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Nenhum valor adicional identificado em adicionar skills a NPM_SUBSYSTEMS — faria o doctor exigir skills como se fosse um subsistema orquestrado do projeto, o que contradiz DEC-002.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** FR-004/FR-006 da SPEC-0002 nomeiam explicitamente três dependências. FR-024 da SPEC-0005 já cobre o relato de skills por um caminho próprio (reportSkills, skills-doctor-presenca.test.ts, skills-doctor-deriva.test.ts, skills-doctor-garantia.test.ts, todos Passed).

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Não aplicável.

### Riscos e dependências

**Análise preliminar:** Nenhum risco em não agir; agir misturaria dois conceitos (subsistema orquestrado vs. instalador de terceiro) que a SPEC-0002 e a SPEC-0005 mantiveram deliberadamente separados.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Fechar sem ação de código. Registrar a investigação para que a pergunta não volte a ser levantada como se fosse um gap sem que alguém confira a DEC-002 primeiro.

## Pontos a revisar no futuro

**A revisar:** Nenhum ponto a revisar; achado fechado por investigação.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$framework-02-backlog`.

## Encerramento — 2026-08-30

Investigado e fechado sem promoção a backlog nem spec. `NPM_SUBSYSTEMS` (`src/doctor.ts`) é, por `DEC-002` da SPEC-0002, o conjunto fechado dos três subsistemas orquestrados do projeto (`removed-project-integration`, `context-mode`, `code-review-graph`); `skills` é o instalador que o `setup` invoca, não um subsistema orquestrado, e seu relato já existe por caminho próprio — `reportSkills()`, exigido por `FR-024` da SPEC-0005 e coberto por `skills-doctor-presenca.test.ts`, `skills-doctor-deriva.test.ts` e `skills-doctor-garantia.test.ts`, todos `Passed`. Adicionar `skills` a `NPM_SUBSYSTEMS` misturaria os dois conceitos sem ganho correspondente. Nenhuma mudança de código feita.
