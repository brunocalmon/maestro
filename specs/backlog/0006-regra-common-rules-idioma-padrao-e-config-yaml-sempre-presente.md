# Backlog: Regra common-rules: idioma padrão e config.yaml sempre presente

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0006 |
| Status | Promoted |
| Produto | common-rules-server |
| Épico | A esclarecer |
| Funcionalidade | Regra de idioma + config.yaml de nível common-rules |
| Tipo | Regra + técnico |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-09-03 |
| Spec promovida | specs/draft/0012-regra-common-rules-idioma-padrao-e-config-yaml-sempre-presente/spec.md (SPEC-0012) |

## Ideia original

uma regra basica que eu quero criar, a nível de common-rules, ou seja, superior a qualquer dependencia como matt_pocock ou framework é: sempre responda no idioma que o usuario conversar, porém a lingua base é inglês e todo documento gerado deve ser em inglês, independente do idioma da skill, rules, dependencias (framework/skills) a não ser que o usuario estritamente diga o contrario via configuração, essa configuração deve ser em .common-rules, toda configuração deve estar ali em um config.yaml. gere para mim um schema base de configurações que podemos ter a principio, por exemplo, já começaremos com o idioma de persistencia (global), metadados do projeto, e informações de sistema. Eu só inventei ali como exemplo, nenhuma configuração pode ser JAMAIS omitida nesse config.yaml, sejam eles REAIS preenchidos com defaults quando possível, ou simplesmente vazios. Esses valores devem sempre ser levados em consideração como regra máxima. Meu objetivo é instruir, via regra, independente de como o usuario estiver interagindo com o prompt, seja com skills, framework ou livremente, que o common-rules garanta de identificar quando a conversa chegar num ponto onde um valor deveria ser incluso ali ou atualizado, ou recomendar que o usuario inicie o grilling para gerar o config.yaml.

## Problema percebido

Não existe hoje um mecanismo de configuração no nível do próprio common-rules, acima de framework/skills, que fixe idioma-padrão e outros metadados-guia (stack do projeto, ambiente/sistema, controle de git-tracking) de forma sempre presente e legível pelo agente.

## Pessoa afetada ou beneficiada

A pessoa responsável pelo projeto (usuário) e qualquer agente que interaja com um projeto usando common-rules, com ou sem former project tool/mattpocock ativos.

## Resultado ou valor esperado

Um config.yaml sempre presente em .common-rules/, com todas as chaves preenchidas (default real ou vazio, nunca omitidas), funcionando como fonte de verdade para idioma, projeto, sistema e controle de versionamento, sincronizado automaticamente com .project-context/STACK.md quando former project tool estiver ativo.

## Contexto

Escopo é nível common-rules (acima de framework/mattpocock). Quatro decisões fechadas nesta refinamento: (1) detecção de quando atualizar config.yaml via instrução permanente no roteador CLAUDE.md/AGENTS.md, sem hook nem comando novo; (2) config.yaml sincroniza automaticamente a partir de STACK.md para campos sobrepostos quando former project tool/equivalente ativo, mantendo STACK.md como fonte de verdade — regra absoluta nesse cenário; (3) seção git: dentro do config.yaml com grupos de artefatos e flag ignored (default true), cobrindo o próprio config.yaml, estado operacional do common-rules, artefatos do former project tool, skills instaladas e outputs de ferramentas locais (code-review-graph, context-mode); (4) language.exceptions lista caminhos com idioma fixo diferente do default (en_US) — confirmado via leitura do código que specs/**/spec.md E o bloco gerenciado de docs/**/*.md (gerado por build_documentation.mjs, que embute prosa em português no próprio script e falha --check se divergir) precisam ficar em pt_BR.

## Referências relacionadas

- `specs/inbox/2026-09-03-194727-regra-common-rules-idioma-padrao-de-resposta-documentos-e-config-yaml-sempre-presente-em-common-rules.md` — captura original, texto do usuário preservado integralmente (origem deste item).
- `.project-context/RULES.md` — já registra a regra de idioma English-by-default confirmada nesta mesma sessão (código/artefatos em inglês, `specs/*.md` em português). Documentação relacionada: este item precisa herdar e detalhar essa regra, não contradizê-la.
- `.project-context/STACK.md` — documentação relacionada: fonte de verdade para os campos de `project` que `config.yaml` sincroniza quando former project tool está ativo.
- `.agents/skills/framework-04-validate/scripts/validate_spec.mjs` e `verify_acceptance.mjs` — evidência técnica de que `specs/**/spec.md` precisa ficar em português (parsing de títulos de seção hardcoded).
- `.agents/skills/framework-documentator/scripts/build_documentation.mjs` — evidência técnica de que o bloco gerenciado de `docs/**/*.md` também precisa ficar em português (prosa fixa no gerador, `--check` falha se divergir).
- `/home/bcalmon/Projects/dev-bootstrap/config.yaml` (fora do repositório) — referência de estilo usada para o rascunho de schema: comentários explicativos por campo, seções por categoria, defaults explícitos.

## Comportamento esperado

- O `common-rules setup` cria `.common-rules/config.yaml` as-is, com todas as chaves do schema presentes — preenchidas com default real quando possível, vazias quando não, nunca omitidas.
- O agente responde sempre no idioma da conversa. Documentos gerados usam `language.default` (`en_US`), exceto os caminhos listados em `language.exceptions`.
- Quando former project tool (ou skill equivalente, ex. mattpocock) estiver ativo, os campos de `project` que se sobrepõem a `.project-context/STACK.md` são sincronizados automaticamente a partir dele — `STACK.md` permanece a fonte de verdade, `config.yaml` nunca diverge silenciosamente.
- Uma instrução permanente no roteador (`CLAUDE.md`/`AGENTS.md`) orienta o agente a notar, durante qualquer conversa, quando um valor de `config.yaml` deveria ser incluído ou atualizado, e a sugerir ao usuário iniciar o preenchimento ("grilling").
- A seção `git:` de `config.yaml` define, por grupo de artefato, se ele é ignorado ou versionado no git do projeto-alvo; default `ignored: true` por grupo, com exceções já identificadas para o próprio `config.yaml` e para os artefatos do former project tool.

## Regras de negócio

- `config.yaml` nunca omite uma chave do schema: default real ou valor vazio, nunca ausência da chave.
- A sincronização de `project` a partir de `STACK.md`, quando former project tool/equivalente está ativo, é regra absoluta — não é uma preferência configurável nem pode divergir.
- `language.default` é `en_US`; qualquer exceção precisa constar em `language.exceptions` com caminho, idioma e motivo — nunca uma decisão implícita do agente.
- `git.default` é `ignored`; um grupo sem `ignored` explícito herda esse default.

## Critérios de aceitação

- Given um projeto sem `.common-rules/config.yaml`, When o setup roda, Then o arquivo é criado com todas as chaves do schema presentes, nenhuma omitida.
- Given former project tool ativo com `STACK.md` preenchido, When `config.yaml` é lido, Then os campos de `project` sobrepostos refletem `STACK.md` sem exigir edição manual duplicada.
- Given um documento a gerar fora de `language.exceptions`, When o agente escreve, Then o conteúdo é em `en_US`.
- Given `specs/**/spec.md` ou o bloco gerenciado de `docs/**/*.md`, When o agente gera conteúdo ali, Then usa `pt_BR`, por exceção registrada em `language.exceptions`.
- Given um grupo em `git:` sem `ignored` explícito, When o `.gitignore` é avaliado, Then o grupo é tratado como `ignored: true`.

## Qualidades e operação

- Segurança: `config.yaml` não deve conter segredo, token ou credencial — é metadado de projeto/idioma/sistema, não configuração de acesso.
- Privacidade: seção `system` pode conter dados de hardware/ambiente da máquina; git-tracking desse grupo específico ainda não foi decidido (ver Dúvidas).
- Desempenho e volume: não aplicável — arquivo de configuração estático, lido pelo agente, sem volume relevante.
- Auditoria e observabilidade: a avaliar na especificação — se alterações em `config.yaml` precisam de rastro (quem/quando mudou um valor).

## Dependências

- Depende da regra de idioma já confirmada em `.project-context/RULES.md` (não a substitui, a detalha).
- Depende do padrão de escrita idempotente em `.common-rules/` que o setup já usa (`install.json`, `extensions.json`) como precedente de implementação, sem reaproveitar o mecanismo automaticamente — decisão de implementação fica para a especificação.

## Situações de erro

- A esclarecer na especificação: o que acontece se `config.yaml` existir mas estiver com uma chave do schema faltando (versão antiga do schema, edição manual incompleta)? Precisa de reparo automático, aviso, ou falha explícita?

## Escopo

- Dentro: schema de `.common-rules/config.yaml` (seções `language`, `project`, `system`, `git`); regra de idioma de nível common-rules (resposta segue a conversa, documento gerado usa `language.default` com exceções explícitas); sincronização automática de `project` a partir de `STACK.md` quando former project tool/equivalente ativo; instrução no roteador para detectar quando sugerir atualização; estrutura `git:` de controle de tracking por grupo de artefato.
- Fora: implementação do schema e do setup que o gera (fatia futura, esta é etapa de descoberta); o mecanismo interativo de "grilling" em si; caminhos exatos de artefatos de `code-review-graph`/`context-mode` (ainda não inspecionados neste projeto); qualquer geração de conteúdo humano fora do bloco gerenciado de `docs/`.

## Dúvidas, decisões e riscos

- **Decisão confirmada:** detecção de quando atualizar `config.yaml` é via instrução permanente no roteador (`CLAUDE.md`/`AGENTS.md`), sem hook nem comando novo.
- **Decisão confirmada:** `config.yaml` sincroniza automaticamente a partir de `STACK.md` para campos sobrepostos quando former project tool/equivalente ativo; `STACK.md` continua sendo a fonte de verdade.
- **Decisão confirmada:** seção `git:` com grupos de artefatos e flag `ignored` (default `true`), cobrindo `config.yaml` (exceção: `ignored: false`), estado operacional do common-rules, artefatos do former project tool (exceção: `ignored: false`, por já serem fonte normativa versionada), skills instaladas, e placeholders para ferramentas locais como code-review-graph/context-mode.
- **Decisão confirmada:** `language.exceptions` lista caminhos com idioma fixo — `specs/**/spec.md` e o bloco gerenciado de `docs/**/*.md` precisam ficar em `pt_BR` por dependência técnica de scripts do pacote former project tool (validador e gerador, respectivamente).
- **Decisão confirmada:** a seção `system` (RAM, CPU, GPU, SO, baremetal/container) não recebe arquitetura de arquivo dedicada (ex.: `config.local.yaml`) nesta fase — fica dentro do único `config.yaml`, sob a mesma flag `ignored` do grupo `common_rules_config` do `git:`. Se o usuário optar por versionar `config.yaml`, `system` é versionado junto; a divisão em arquivos foi considerada e explicitamente adiada, por preocupação prematura antes da forma final do schema estar definida — revisitar na especificação apenas se o formato final do schema justificar.
- **Risco:** caminhos reais de artefatos gerados por `code-review-graph` e `context-mode` não foram inspecionados neste projeto; os grupos correspondentes em `git:` ficam com `paths: []` até confirmação.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco (privacidade de `system` avaliada e adiada deliberadamente pelo usuário — não é lacuna, é decisão).
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Item aprofundado nesta sessão via `$framework-02-backlog`, com cinco decisões fechadas (mecanismo de detecção, fronteira com STACK.md/RULES.md, estrutura de git-tracking por grupo, precedência de idioma com evidência técnica de código, e arquitetura de arquivo único para `system`). Nenhuma lacuna aplicável restante. Status: `Ready for specification`. Pronto para `$framework-03-specify` quando o usuário autorizar a criação da spec normativa.
