# Backlog: Phase 0: Preparação e limpeza histórica radical

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0002 |
| Status | Promoted |
| Produto | A esclarecer |
| Épico | A esclarecer |
| Funcionalidade | A esclarecer |
| Tipo | A esclarecer |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-08-24 |
| Spec promovida | specs/completed/0001-phase-0-preparacao-limpeza/spec.md (Definition Gate: Passed) |

## Ideia original

Antes de começar reescrita em branch experimental: criar branch refactor/v1-cli-first, arquivar v0.2.8 (tag + CHANGELOG), fazer limpeza radical (remover src/ Python, .docs/wiki, git reset histórico, começar com commit vazio). Nenhuma menção de código antigo nas docs/código novo. Versão 1.0.0 com breaking change explícito.

## Problema percebido

v0.2.8 é fundamentalmente diferente da nova direção. Manter compatibilidade ou referências ao passado confundiria e atrasaria execução. Precisa-se de tabula rasa clara antes de codificar v1.0.

## Pessoa afetada ou beneficiada

Novos usuários lendo documentação (não devem ver código antigo); times refatorando; comunidade usando v0.2.8 (será breaking change).

## Resultado ou valor esperado

Repositório limpo como tabula rasa; sem débito técnico de compatibilidade; sem confusão entre v0.2.8 e v1.0; v0.2.8 arquivada e estável em tag; v1.0 tem histórico limpo; breaking change explícito em CHANGELOG.

## Contexto

Decisão de escopo: radical (remover tudo antigo, git reset). Estratégia segura: branch experimental refactor/v1-cli-first; merge para main só após v1.0 pronto. Main fica v0.2.8 estável até então.

## Referências relacionadas

- Nenhuma referência relevante encontrada.

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

Aprofundar nesta etapa até o item ficar pronto para `$framework-03-specify`.
