# Backlog: Extensão maestro para governar documentação (docs/ e README) gerada pelo Specsfy em projetos consumidores

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0010 |
| Status | Promoted |
| Produto | Maestro |
| Épico | Extensões locais (mesma família da SPEC-0011/SPEC-0012) |
| Funcionalidade | Governança de documentação exportada a projetos consumidores |
| Tipo | Regra + técnico |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-09-15 |
| Spec promovida | specs/draft/0021-extensao-maestro-para-governar-documentacao-docs-e-readme-gerada-pelo-specsfy-em-projetos-consumidores/spec.md |

## Ideia original

Criar uma extensão a nível de maestro (usando o subsistema já existente de extensões locais — mesmo mecanismo interno de createExtension()/categoria 'extension' que já instala os blocos ## maestro e ## maestro: language em CLAUDE.md/AGENTS.md via src/extensions/router.ts) que, ao rodar maestro setup em QUALQUER projeto consumidor, garanta que a documentação (docs/ + README.md raiz) gerada pelo Specsfy nunca fique vazia/incompleta e siga as diretrizes do usuário — idioma seguindo language.default do projeto (não pt_BR forçado nem inglês hardcoded), backlinks explícitos entre docs/ e o README raiz, diagramas Mermaid válidos e estáveis, e README raiz sempre criado como índice quando ausente — sem sobrepor a topologia e o conteúdo que o Specsfy já decide gerar, apenas adicionando uma camada de preferências.

## Problema percebido

Hoje o maestro não exporta, para os projetos que instala, nenhuma regra persistente sobre como a documentação (docs/ e README raiz) deve se comportar. A única política equivalente já definida (.specsfy/RULES.md:75-101, no próprio repo do maestro) vale apenas para o repositório do maestro, autogerada pela skill specsfy-aux-rules, e nunca é entregue a projetos consumidores via maestro setup. Além disso, dois defeitos concretos foram encontrados: (1) o idioma de docs/ é hoje sequestrado pela exceção de idioma pensada só para specs/**/*.md (necessidade dos validadores externos do Specsfy, validate_spec.mjs/verify_acceptance.mjs, que parseiam títulos em pt_BR), fazendo docs/ ignorar o language.default real do projeto; (2) ensureReadmeHomepage() em src/setup/readme.ts grava, em QUALQUER projeto-alvo sem README.md, o conteúdo literal do README do próprio maestro (menciona '@brunocalmon/maestro', docs/architecture.md, comandos maestro doctor etc.) em vez de um homepage genérico daquele projeto.

## Pessoa afetada ou beneficiada

O usuário (mantenedor do maestro) e, por extensão, qualquer pessoa ou agente que rode maestro setup em outro projeto e depois consulte/edite a documentação gerada pelo Specsfy naquele projeto.

## Resultado ou valor esperado

Todo projeto que rodar maestro setup passa a ter, de forma persistente (sobrevivendo a reinstalação, via o mesmo mecanismo de extensão que já entrega os blocos de router/idioma), uma regra que orienta qualquer geração ou edição de docs/ e README raiz a: usar o idioma geral do projeto (não a exceção de validação do Specsfy), nunca deixar documentação vazia/incompleta, usar Mermaid válido e estável, manter o README raiz como índice sempre existente, e garantir backlinks de navegação entre docs/ e o README principal — tudo como camada aditiva sobre o que o Specsfy decide gerar, nunca substituindo sua topologia. Os dois bugs (exceção de idioma vazando para docs/, e README hardcoded do próprio maestro) são corrigidos como parte da mesma entrega.

## Contexto

Distingue-se de SPEC-0012 (regra de idioma geral em common-rules/maestro: language) por ser especificamente sobre o subsistema de documentação (docs/ + README), não sobre idioma de resposta em geral — embora reaproveite e corrija o mesmo mecanismo de exceção de idioma que SPEC-0012 introduziu. Distingue-se do trabalho do Specsfy (specsfy-documentator, .specsfy/RULES.md, documentation-standard.md) por não gerar conteúdo de docs/ nem redefinir sua topologia — apenas adiciona uma regra persistente exportada pelo maestro para qualquer projeto consumidor, no mesmo padrão de entrega usado por buildRouterBlock()/buildConfigLanguageBlock() em src/extensions/router.ts.

## Referências relacionadas

- `.specsfy/RULES.md:75-101` (documentação relacionada) — a política de idioma/Mermaid/índice já existe em texto, mas só se aplica ao próprio repositório do maestro, autogerada por `specsfy-aux-rules`; nunca é exportada a projetos consumidores.
- `src/extensions/router.ts` (`buildRouterBlock`, `buildConfigLanguageBlock`, `buildConfigLanguagePointer`) (spec relacionada) — mecanismo de bloco a replicar para uma nova categoria de documentação.
- `src/setup/run.ts` (`ensureConfigLanguageRouterCandidate`, `ensureConfigYaml`, chamadas a `createExtension`) (spec relacionada) — ponto de instalação em todo `maestro setup`.
- `src/setup/readme.ts` (`ensureReadmeHomepage`, `DEFAULT_ROOT_README`, `sanitizeDocBackLinks`) (spec relacionada) — contém o bug do README hardcoded a corrigir.
- `.claude/skills/specsfy-documentator/references/documentation-standard.md` (documentação relacionada) — topologia de `docs/` já definida pelo Specsfy; esta entrega não a duplica nem redefine.
- `specs/completed/0012-regra-common-rules-idioma-padrao-e-config-yaml-sempre-presente/spec.md` (spec relacionada) — precedente do mecanismo de bloco de idioma e da exceção de idioma cujo escopo hoje vaza incorretamente para `docs/**/*.md`.
- `src/doctor.ts` (spec relacionada) — onde entra a nova checagem de documentação.

## Comportamento esperado

Ao rodar `maestro setup` em qualquer projeto consumidor:

1. Se `README.md` não existir na raiz, cria-se um README placeholder genérico — sem inventar nome/descrição do projeto-alvo — com uma seção de índice apontando para `docs/README.md` e um aviso explícito de que título e descrição precisam ser preenchidos.
2. Uma extensão nova (mesma categoria `extension`/mecanismo de `createExtension` que já entrega os blocos `## maestro` e `## maestro: language`) é instalada em `CLAUDE.md`/`AGENTS.md`, com regra dizendo que:
   - `docs/` e o `README.md` raiz seguem `language.default` de `.maestro/config.yaml` — nunca ficam presos à exceção de idioma pensada só para os validadores do Specsfy;
   - documentação nunca fica vazia ou incompleta — uma lacuna de evidência é registrada explicitamente, nunca omitida ou deixada em branco;
   - todo diagrama Mermaid usado é válido e estável (nunca sintaxe experimental/beta);
   - todo `docs/*.md` inclui um link de volta ao `README.md` raiz, e o `README.md` raiz mantém o índice para todo `docs/`.
3. A exceção de idioma hoje aplicada pelo Specsfy também a `docs/**/*.md` passa a valer estritamente só para `specs/**/*.md` (motivo real: compatibilidade com `validate_spec.mjs`/`verify_acceptance.mjs`).
4. `maestro doctor` passa a reportar (sem corrigir automaticamente) quando detectar: `docs/` ausente ou com arquivo(s) vazio/stub enquanto o Specsfy está instalado; Mermaid com sintaxe inválida/experimental dentro de `docs/*.md`; ou `docs/*.md` sem link de volta ao `README.md` raiz.

## Regras de negócio

- A extensão nunca sobrescreve nem redefine a topologia ou o conteúdo que o Specsfy decide gerar em `docs/` — só adiciona regra em texto a `CLAUDE.md`/`AGENTS.md`, na mesma camada aditiva do bloco de idioma.
- A exceção de idioma do validador do Specsfy fica restrita a `specs/**/*.md`; `docs/**/*.md` sempre segue `language.default`.
- O README placeholder só é escrito quando `README.md` não existe; se já existir, o comportamento atual de sanitização de links (`sanitizeRootReadmeLinks`/`sanitizeDocBackLinks`) é preservado sem mudança.
- `maestro doctor` reporta drift/alerta, nunca escreve ou corrige `docs/*.md` automaticamente — mesma filosofia dos demais diagnósticos do doctor.

## Critérios de aceitação

1. Given um projeto sem `README.md`, When `maestro setup` roda, Then um `README.md` placeholder genérico é criado com índice para `docs/README.md`, sem mencionar "maestro" ou conteúdo de outro projeto.
2. Given um projeto onde `maestro setup` já rodou e instalou a extensão de documentação, When `maestro setup` roda de novo, Then a extensão não duplica nem sobrescreve o bloco (idempotência, mesmo padrão do router/idioma).
3. Given `.maestro/config.yaml` com `language.default: en_US`, When o Specsfy gera `docs/`, Then `docs/` não é forçado a `pt_BR` pela exceção do validador (a exceção passa a valer só para `specs/**/*.md`).
4. Given um `docs/*.md` com diagrama Mermaid em sintaxe experimental (ex.: `block-beta`), When `maestro doctor` roda, Then o doctor reporta um alerta apontando o arquivo e a razão.
5. Given um `docs/*.md` sem link de volta para o `README.md` raiz, When `maestro doctor` roda, Then o doctor reporta a ausência do backlink.
6. Given `docs/` ausente, vazio ou com arquivo(s) stub enquanto o Specsfy está instalado, When `maestro doctor` roda, Then o doctor reporta alerta de documentação incompleta.

## Qualidades e operação

- Segurança: não aplicável diretamente — a extensão só adiciona texto de regra e uma checagem de leitura; não executa código externo nem rede.
- Privacidade: nenhuma coleta de dado novo; a checagem do doctor só lê arquivos já presentes no próprio projeto.
- Desempenho e volume: a checagem do doctor lê apenas `docs/*.md` e `README.md` do projeto-alvo — custo local baixo, sem chamada de rede.
- Auditoria e observabilidade: o alerta do doctor aparece no mesmo relatório padrão dos demais diagnósticos (`maestro doctor`), sem canal separado.

## Dependências

- `SPEC-0012` (mecanismo de bloco de idioma / exceção de idioma) — já completa; esta entrega corrige o escopo da exceção que introduziu.
- `SPEC-0011` (extensões locais / reparo assistido) — o mecanismo de `createExtension` reaproveitado já existe e está completo.
- `specsfy-documentator` / `.specsfy/RULES.md` — fonte de precedente do texto de regra; não é modificado por esta entrega.

## Situações de erro

- Projeto sem `.maestro/config.yaml` ainda (primeira execução de `setup`): o README placeholder e a extensão de documentação devem ser instalados de qualquer forma; a nova regra de idioma não deve quebrar antes do `config.yaml` existir.
- Falha do Specsfy ao instalar (erro de rede/npm): o README placeholder e a extensão de documentação não dependem do sucesso do Specsfy — devem ser instalados independentemente.
- Projeto com `docs/` criado manualmente, fora da topologia do Specsfy: o doctor reporta o desvio sem tentar corrigir ou apagar conteúdo.

## Escopo

- Dentro:
  - Nova extensão instalável via `createExtension` (categoria `extension`) com o texto de regra de documentação descrito em "Comportamento esperado".
  - Correção do escopo da exceção de idioma do Specsfy (`specs/**/*.md` apenas).
  - Correção do `DEFAULT_ROOT_README` hardcoded em `src/setup/readme.ts` → placeholder genérico, sem inventar nome/descrição do projeto-alvo.
  - Nova checagem em `maestro doctor` (alerta, não bloqueante) para `docs/` vazio ou incompleto, Mermaid inválido/experimental, e backlink ausente.
- Fora:
  - Geração do conteúdo de `docs/` em si — continua inteiramente a cargo do Specsfy/`specsfy-documentator`.
  - Qualquer redefinição da topologia de `docs/` (`architecture.md`, `database.md` etc.).
  - Correção automática (auto-fix) pelo doctor — ele só reporta.
  - Suporte a idiomas além do já existente `language.default`/`language.exceptions`.

## Dúvidas, decisões e riscos

- Nenhuma lacuna aplicável no momento — todas as decisões materiais foram confirmadas nesta rodada de aprofundamento.
- Risco registrado: a checagem de Mermaid "válido" no doctor exige algum grau de parsing/heurística de sintaxe (não um render real); o nível exato de rigor (regex heurística vs. parser real) fica para a fase de especificação/plano técnico, não é uma decisão de produto.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Pronto para `$specsfy-03-specify`.
