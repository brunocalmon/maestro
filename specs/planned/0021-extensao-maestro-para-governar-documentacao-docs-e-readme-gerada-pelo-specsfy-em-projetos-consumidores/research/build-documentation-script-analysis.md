# Análise de `build_documentation.mjs` e da exceção `specsfy_docs_managed_block`

- Fonte: `.claude/skills/specsfy-documentator/scripts/build_documentation.mjs` (skill do pacote `@promovaweb/specsfy`, sincronizada localmente neste repositório).
- Consultado em: 2026-09-16.
- Propósito: verificar se a exceção de idioma `specsfy_docs_managed_block` (`docs/**/*.md` → `pt_BR`) ainda reflete o comportamento real de geração de `docs/`, e checar o caso relacionado de `.specsfy/PACKAGES.md`.

## Achado

O script não lê `.maestro/config.yaml` em nenhum ponto — não há ocorrência de `language`, `idioma`, `pt_BR`, `en_US` ou `config.yaml` no arquivo (confirmado por busca textual). Todo o texto gerado (títulos de seção, prosa como "Visão geral", "Componentes", "Fluxo principal") está hardcoded em português diretamente no objeto `docData` (linhas 104-115 do script).

Comparação com o conteúdo real:

- `docs/architecture.md` contém o marcador `<!-- specsfy:documentator:start -->`/`end`, mas o texto entre os marcadores é inglês, extenso e estruturalmente diferente do skeleton gerado pelo script (que produziria apenas uma tabela de contagem de arquivos e dois diagramas Mermaid genéricos). O conteúdo real fala de "Architectural Overview", "3-Layer Dependency Hierarchy", `SPEC-0002` etc. — claramente escrito por um processo orientado a LLM (a skill `specsfy-documentator` com `documentation-standard.md`), não pelo script mecânico.
- Rodar `node .claude/skills/specsfy-documentator/scripts/build_documentation.mjs --project . --check` neste repositório reporta os 10 arquivos de `docs/` e `.specsfy/PACKAGES.md` como "Documentação desatualizada" — ou seja, a divergência entre o conteúdo real e o skeleton do script já existe hoje, e não é causada por idioma; é causada por profundidade/estrutura de conteúdo.

## Achado adicional sobre PACKAGES

Diferente de `docs/*.md`, `.specsfy/PACKAGES.md` genuinamente contém o texto hardcoded do script em português ("Pacotes e bibliotecas", "Gerenciador", "Escopo", "Finalidade" — bate exatamente com `docData["packages.md"]` do script, linha 112, e com o alvo separado `.specsfy/PACKAGES.md` na linha 116). Este arquivo está fora do padrão `docs/**/*.md` da exceção atual — ou seja, a exceção não cobre o único arquivo que de fato precisaria dela. Registrado como inconsistência pré-existente; tratamento fica fora do escopo desta spec (ver seção 3, "Fora de escopo").

## Conclusão normativa

A exceção `specsfy_docs_managed_block` deve ser removida do default de `buildDefaultConfig()`: ela não descreve o comportamento real de nenhum arquivo em `docs/`, e mantê-la arrisca instruir um agente a escrever novo conteúdo de `docs/` em português quando a prática real já estabelecida é inglês (`language.default` deste repositório).
