# Interface da CLI do instalador `skills` — 2026-08-29

## Proveniência

| Campo | Valor |
| --- | --- |
| Origem | `https://github.com/vercel-labs/skills`, README do projeto |
| Pacote | `skills`, versão 1.5.23 no registro npm |
| Mantenedores | `rauchg`, `quuu` |
| Licença | MIT |
| Data de acesso | 2026-08-29 |
| Natureza | Notas próprias sobre a interface observada; nenhum trecho do README reproduzido |

## Flags relevantes para esta fatia

| Flag | Efeito | Consequência aqui |
| --- | --- | --- |
| `-g, --global` | Instala no diretório do usuário em vez do projeto | **Proibida.** A regra do projeto veda instalar fora dele |
| `-a, --agent <agentes...>` | Restringe a alvos nomeados, como `claude-code` | Usada. O alvo decidido é apenas Claude Code |
| `-s, --skill <skills...>` | Seleciona skills por nome; `'*'` para todas | Disponível; a seleção fica como decisão da spec |
| `--copy` | Copia arquivos **em vez de** criar link simbólico para os diretórios do agente | **Necessária.** Ver abaixo |
| `-y, --yes` | Pula confirmações | Necessária: o `setup` não é interativo |
| `--all` | Instala tudo em todos os agentes sem prompt | Não usada: instalaria em agentes não detectados |

## O padrão é link simbólico

O README descreve `--copy` como "copiar arquivos em vez de criar link
simbólico", o que revela que o comportamento padrão é o link. Três
consequências para esta fatia:

1. Conteúdo por link vive fora do projeto, e o hash do que está em
   `.claude/skills/` deixaria de descrever o que o agente realmente lê.
2. O ferramental do former project tool recusa caminho por link: `load_research.mjs`
   reprova com "caminho inseguro ou symlink". Um diretório de skills ligado por
   link introduziria essa classe de recusa no mesmo lugar onde o `framework` já
   mantém as próprias skills.
3. Link para um armazenamento central faz duas máquinas divergirem sem que o
   projeto registre nada — exatamente o que a regra de relato de origem existe
   para evitar.

## Comando resultante

Escopo de projeto, alvo único, cópia real e sem interação. Nenhuma forma global.

## O que o instalador não oferece

**Correção de 2026-08-29.** Esta seção afirmava que não havia lockfile nem
hash. A afirmação vinha da ausência deles no README, e a execução real mostrou
que a ferramenta grava `skills-lock.json` com `computedHash` por skill. Ver
`coexistencia-observada.md`.

O que de fato não existe é referência de commit ou versão do conjunto: o
lockfile registra o que se obteve, não o que se deve obter. Reexecutar busca a
ponta. Por isso esta fatia continua entregando rastreabilidade e não
reprodutibilidade, mas pelo motivo correto.
