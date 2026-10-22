# Coexistência observada em projeto descartável — 2026-08-29

## Proveniência

| Campo | Valor |
| --- | --- |
| Origem | Execução real do instalador `skills` 1.5.23 |
| Local | Projeto descartável fora deste repositório; nada foi instalado no projeto real |
| Comando | Caminho oficial, escopo de projeto, alvo único, cópia real, sem interação |
| Data | 2026-08-29 |
| Natureza | Observação do sistema de arquivos após a execução |

## Preparação

Projeto vazio com `package.json` e três diretórios em `.claude/skills/`
simulando o que o `framework` ocupa, cada um com seu `SKILL.md`.

## Resultado

| Observação | Valor |
| --- | --- |
| Diretórios antes | 3 |
| Diretórios depois | 40 |
| Do conjunto simulado do `framework` | 3, todos com `SKILL.md` intacto |
| Do conjunto de `mattpocock` | 37 |
| Links simbólicos em qualquer nível | 0 |
| `AGENTS.md` criado | Não |
| `CLAUDE.md` criado | Não |
| Código de saída | 0 |

Nenhum diretório preexistente foi removido, renomeado ou sobrescrito. Os dois
conjuntos convivem como irmãos em `.claude/skills/`, que era inferência e passa
a ser observação.

## O instalador escreve um lockfile

Apareceu na raiz um `skills-lock.json` que a documentação não menciona. Formato
observado: `version` 1 e um mapa `skills`, no qual cada entrada traz `source`,
`sourceType`, `skillPath` e `computedHash`, este último um SHA-256.

Isso corrige uma afirmação anterior desta pesquisa, que declarava ausência de
lockfile e de hash a partir da ausência deles no README. A ferramenta faz mais
do que documenta.

## O que o lockfile ainda não dá

Não há referência de commit nem versão do conjunto. `source` é o repositório e
`skillPath` é o caminho dentro dele. Reexecutar continua buscando a ponta: o
lockfile registra **o que se obteve**, e não **o que se deve obter**. Serve para
detectar deriva, não para reproduzir um estado.

## Nota sobre este repositório

A raiz deste projeto já contém um `skills-lock.json` com `version` 1 e mapa
vazio, isto é, o mesmo formato produzido por esta ferramenta. O comentário do
`.gitignore` o atribui ao instalador do `framework`, atribuição que a observação
não sustenta.
