# Backlog: Renomear common-rules para maestro

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0008 |
| Status | Promoted |
| Produto | common-rules (torna-se maestro) |
| Épico | Rebranding — identidade do projeto |
| Funcionalidade | Renomeação completa: pacote, binários, diretório local, repositório e imagem Docker Hub |
| Tipo | técnico |
| Prioridade | Sem gatilho — pronta para especificar quando priorizada (decisão do usuário, rodada 7) |
| Milestones | |
| Criado em | 2026-09-06 |
| Spec promovida | specs/completed/0014-renomear-common-rules-para-maestro/spec.md (Complete, 2026-09-06) |

## Ideia original

A pessoa responsável mencionou querer renomear a ferramenta para maestro, e pediu explicitamente que isso não fosse considerado agora. Fica registrado como captura futura: é renomeação que toca nome de pacote, binário, PROJECT.md, STACK.md e duas specs concluídas.

## Problema percebido

Decisão (rodada 1): `common-rules` descrevia um agrupador de regras; hoje a ferramenta é um orchestrator/wrapper de subsistemas (framework, context-mode, code-review-graph) e agentes de codificação. O nome atual não representa mais o papel real da ferramenta.

## Pessoa afetada ou beneficiada

Quem mantém o repositório e decide sua identidade pública; por extensão, qualquer consumidor do pacote, do binário CLI, da imagem Docker Hub ou de documentação que referencie o nome atual — hoje nenhum consumidor externo via npm público, já que `@brunocalmon/common-rules` é `private: true`.

## Resultado ou valor esperado

O nome do projeto — pacote, binários, diretório local, repositório GitHub e imagem Docker Hub — passa a comunicar corretamente seu papel de orchestrator, sem nenhuma superfície pública ou local ainda referenciando `common-rules`.

## Contexto

package.json hoje é @brunocalmon/common-rules, privado (não publicado no registro npm público); bin common-rules e common-rules-mcp; imagem Docker Hub publicada como brunocalmon/common-rules-server via CI; repositório GitHub common-rules-server; diretório .common-rules/ já em produção nos projetos consumidores que rodaram setup.

## Referências relacionadas

| Caminho | Relação |
| --- | --- |
| `specs/inbox/2026-09-06-172334-renomear-common-rules-para-maestro.md` | origem — captura formal desta anotação |
| `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md` | origem original — primeira menção, "sem efeito nesta fatia", 2026-08-29 |
| `package.json` | limita — nome do pacote `@brunocalmon/common-rules`, binários `common-rules` e `common-rules-mcp` |
| `.github/workflows/ci.yml` | limita — publica imagem Docker Hub `brunocalmon/common-rules-server` |
| `specs/completed/*/spec.md` | limita — todas as 13 specs concluídas citam o nome atual como parte de sua evidência histórica |

## Comportamento esperado

A pessoa responsável decide iniciar a renomeação. O pacote npm passa a se chamar `@brunocalmon/maestro`, os binários passam a se chamar `maestro` (CLI) e `maestro-mcp` (servidor MCP), o diretório local que o `setup` grava em cada projeto consumidor passa a se chamar `.maestro/` em vez de `.common-rules/`, o repositório GitHub passa a se chamar `maestro` e a imagem Docker Hub publicada pelo CI passa a se chamar `maestro`. Um projeto consumidor que já tinha `.common-rules/` de uma instalação anterior, ao rodar o `setup` da versão renomeada, é tratado como projeto nunca configurado: o `setup` cria `.maestro/` do zero, sem ler, migrar ou copiar nada do diretório antigo. O CI passa a publicar exclusivamente sob o nome novo, tanto no Docker Hub quanto na tag git de versão; o repositório Docker Hub antigo (`brunocalmon/common-rules-server`) para de receber tags novas a partir da troca.

## Regras de negócio

- A renomeação é total nas superfícies ativas do projeto (pacote, binários, diretório local, repositório GitHub, imagem Docker Hub) — decisão rodadas 2 e 5, não fica restrita só a nome de pacote e binário.
- Specs já concluídas (`specs/completed/*`) não são reescritas: permanecem citando `common-rules`, como registro histórico do nome vigente quando cada uma foi entregue — decisão rodada 4. Documentação viva (`docs/`, `README`, `PROJECT.md`, `STACK.md`) usa o nome novo a partir da renomeação.
- Não existe caminho de migração automática ou manual para o conteúdo de um `.common-rules/` pré-existente — decisão rodada 3, consistente com a cultura de zero-compatibilidade já estabelecida em `SPEC-0001`. O diretório antigo fica órfão, ignorado pelo `setup` da versão renomeada.
- O CI troca de vez a publicação Docker Hub para o nome novo; não há publicação dupla nem período de transição — decisão rodada 8.
- GitHub mantém redirecionamento automático de URLs do nome antigo para o novo após o rename do repositório (comportamento nativo da plataforma, não requer trabalho adicional do projeto).

## Critérios de aceitação

```gherkin
Scenario: pacote e binários publicados sob o novo nome
  Given a renomeação concluída
  When alguém inspeciona package.json
  Then o nome do pacote é @brunocalmon/maestro
  And os binários declarados são maestro e maestro-mcp

Scenario: projeto consumidor com instalação antiga roda o novo setup
  Given um projeto com .common-rules/install.json de uma instalação anterior
  When a pessoa roda o setup da versão renomeada
  Then o setup cria .maestro/ do zero
  And nada do conteúdo de .common-rules/ é lido, migrado ou copiado
  And o setup relata o resultado como uma primeira instalação, não uma atualização

Scenario: specs concluídas preservam o nome histórico
  Given uma spec em specs/completed/ que cita common-rules
  When a renomeação é concluída
  Then o conteúdo dessa spec permanece inalterado
  And nenhum commit desta entrega reescreve texto de spec já completa

Scenario: CI publica exclusivamente sob o nome novo
  Given um push em main depois da renomeação
  When o job docker do CI roda
  Then a imagem é publicada como maestro no Docker Hub
  And nenhuma tag nova é publicada no repositório brunocalmon/common-rules-server
```

## Qualidades e operação

- **Reversibilidade**: renomear repositório GitHub é reversível (redirecionamento automático da plataforma); publicar um pacote/imagem sob novo nome não remove o antigo do histórico público, então a decisão de trocar de vez (regra acima) é definitiva na prática, mesmo sendo tecnicamente revertível.
- **Auditoria**: o commit que executa a renomeação deve ser identificável e único, sem se misturar com mudança de comportamento — é rebranding puro, sem lógica nova.
- Segurança e privacidade: não aplicável — mudança de identidade e nome, sem alteração em dados, permissões ou superfície de ataque.
- Desempenho: não aplicável.

## Dependências

- Nenhuma técnica. Depende apenas da decisão de priorizar (sem gatilho externo, decisão rodada 7).

## Situações de erro

- `setup` encontra `.common-rules/` (nome antigo) e `.maestro/` (nome novo) simultaneamente no mesmo projeto — cenário não coberto pelas decisões desta rodada; a especificação decide se isso é erro, aviso ou se o `.maestro/` mais novo simplesmente prevalece.
- Nome `maestro` já ocupado no escopo `@brunocalmon` no registro npm público, caso a pessoa decida futuramente tornar o pacote público — fora do escopo desta renomeação, já que o pacote permanece `private: true`.

## Escopo

- **Dentro**: `package.json` (nome, binários), código-fonte que referencia os nomes antigos, `.common-rules/` → `.maestro/` no `setup` e em todo o código que lê/escreve esse diretório, repositório GitHub, imagem e workflow Docker Hub, documentação viva (`docs/`, `README`, `PROJECT.md`, `STACK.md`, `CLAUDE.md`/`AGENTS.md` gerados).
- **Fora**: reescrita de specs concluídas; qualquer estratégia de migração para instalações existentes; publicação pública do pacote no registro npm (`private: true` não muda nesta entrega); manutenção paralela do nome antigo em qualquer superfície.

## Dúvidas, decisões e riscos

**Decisões tomadas nesta rodada**

- **D1**: motivo da renomeação é o nome não representar mais o papel de orchestrator — rodada 1.
- **D2**: escopo é total, incluindo o diretório local `.common-rules/` → `.maestro/` — rodada 2.
- **D3**: sem migração — instalação existente é tratada como zero, o diretório antigo fica órfão — rodada 3.
- **D4**: specs concluídas preservam o nome histórico, não são reescritas — rodada 4.
- **D5**: repositório GitHub e imagem Docker Hub renomeiam junto — rodada 5.
- **D6**: convenção de nome — `maestro` (CLI) e `maestro-mcp` (MCP), pacote `@brunocalmon/maestro` — rodada 6.
- **D7**: sem gatilho ou prazo — entra quando priorizado — rodada 7.
- **D8**: Docker Hub troca de vez, sem publicação dupla — rodada 8.

**Risco aberto, não decidido nesta rodada**

- Colisão entre `.common-rules/` e `.maestro/` coexistindo no mesmo projeto num cenário de execução parcial ou interrompida — fica para a especificação decidir o comportamento exato do `setup` nesse caso.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente — ver critérios de aceitação.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco — não materiais para este item.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Brief pronto para `$framework-03-specify`. Um risco não decidido permanece registrado acima (colisão `.common-rules/`/`.maestro/` coexistindo) — a especificação inicial deve resolvê-lo ou registrá-lo como decisão explícita do Ato I.
