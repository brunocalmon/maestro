# FIND-EXT-001 — `specsfy-documentator` sobrescreve a documentação com um esqueleto e reprova qualquer enriquecimento

| Campo | Valor |
| --- | --- |
| ID | FIND-EXT-001 |
| Status | mitigated — documentação rica movida para fora do bloco neste repositório (2026-09-17); `--check` verde; proteção por hook e doctor pendentes (BACKLOG-0014/0013) |
| Alvo | `@promovaweb/specsfy` 0.22.2 — skill `specsfy-documentator`, `scripts/build_documentation.mjs` (md5 `ef92e0e03b80c8b27f401d46c2fd2bf0`), origem `https://github.com/promovaweb/specsfy` |
| Evidência | `.claude/skills/specsfy-documentator/scripts/build_documentation.mjs:100-125`; `.claude/skills/specsfy-documentator/SKILL.md` passos 3–6; execução em 2026-09-17: `node build_documentation.mjs --project .` produziu 858 inserções / 787 remoções em `docs/*.md` e `.specsfy/PACKAGES.md`, revertidas com `git checkout`; `--check` acusa os 11 arquivos como "desatualizados" mesmo com documentação correta. Já registrado como R-001 na SPEC-0021. |
| Mitigação local | Nunca executar `build` sem `--check` em projeto com docs enriquecida; reposicionar o conteúdo rico para fora do bloco `specsfy:documentator` (hotfix neste repositório); hook `guard-docs` (BACKLOG-0014) e checagem no doctor (BACKLOG-0013). |
| Fix definitivo | Issue/PR upstream em `promovaweb/specsfy` (a abrir). |

## O que acontece

1. O bloco `<!-- specsfy:documentator:start/end -->` é tratado pelo script como
   projeção sua: ele gera um esqueleto mecânico (contagem de arquivos, tabela de
   pacotes, Mermaid placeholder como `flowchart TD Application[Aplicação]`,
   títulos em pt-BR fixos) e grava por cima do bloco inteiro.
2. `--check` compara "bloco atual == esqueleto regenerado". Não valida a
   documentação contra o código; qualquer texto humano ou de agente dentro do
   bloco é reportado como desatualizado.
3. A skill manda, em sequência: `build` (passo 3, apaga o bloco), "corrigir
   manualmente" (passo 4), `--check` (passo 5, reprova a correção) e "preservar
   conteúdo humano fora dos blocos" (passo 6). Os passos 3–5 são incompatíveis
   entre si quando a correção vive dentro do bloco.
4. O esqueleto ignora `language.default` do projeto (prosa em pt-BR embutida
   no script) e não cobre o que a própria skill lista como cobertura obrigatória
   (arquitetura, fluxos, decisões, UML reais).

## Proposta para o upstream

- O bloco gerado deve ser somente um inventário anexo (e declarado assim), ou
- `build` deve recusar sobrescrever um bloco cujo conteúdo difira do esqueleto
  (ou fazer merge/quarentena), e `--check` deve validar contra o código, não
  contra o esqueleto;
- respeitar o idioma do projeto.

## Impacto observado

Perda recorrente de `docs/` em projetos que seguem a skill à risca; falso
"desatualizado" em `--check`; conflito com o objetivo do usuário de a
documentação evoluir com o ciclo discutido → refinado → implementado → validado
→ completado → documentado.
