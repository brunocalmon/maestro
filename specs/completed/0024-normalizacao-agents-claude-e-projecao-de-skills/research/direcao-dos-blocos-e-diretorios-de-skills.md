# Evidência: direção dos blocos de instrução e diretórios de skills por ferramenta

- Origem: arquivos deste repositório (`AGENTS.md`, `CLAUDE.md`, `src/extensions/router.ts`, `src/targets/*.ts`, `src/skills/install.ts`), a skill `setup-matt-pocock-skills` instalada (`.claude/skills/setup-matt-pocock-skills/SKILL.md`, origem `mattpocock/skills`) e o bundle do CLI `skills` 1.5.23 (`node_modules/skills/dist/cli.mjs`, `vercel-labs/skills`). Data de acesso: 2026-09-17. Sem cópia de conteúdo protegido; só estrutura observada.

## Blocos por ferramenta

| Ferramenta | Conteúdo completo | Referência | Evidência |
| --- | --- | --- | --- |
| Specsfy (`specsfy install`) | `AGENTS.md` (bloco `specsfy:framework`, ~40 linhas) | `CLAUDE.md`: uma linha `@.specsfy/Spec.md` | `AGENTS.md:1-43`, `CLAUDE.md:1-3` |
| maestro (`createExtension`) | `CLAUDE.md` (`router`, `config-language-rule`, `hooks-fallback`) | `AGENTS.md`: ponteiros em prosa (`agents-pointer`, `config-language-pointer`, `hooks-fallback-pointer`) | `src/extensions/router.ts`, `src/targets/claude-code.ts` |
| maestro, target Antigravity | `AGENTS.md` (`agents-router`, `agents-config-language-rule`, `agents-hooks-fallback`) | — | `src/targets/antigravity.ts` |
| matt-pocock (`setup-matt-pocock-skills`) | `CLAUDE.md` se existir, senão `AGENTS.md`; nunca os dois | — | `SKILL.md` passo 4: "If `CLAUDE.md` exists, edit it. Else if `AGENTS.md` exists, edit it… Never create `AGENTS.md` when `CLAUDE.md` already exists" |

O Claude Code resolve `@caminho` em `CLAUDE.md` como import do arquivo inteiro — é o mecanismo que o próprio Specsfy usa com `@.specsfy/Spec.md`.

## Diretorios por agente no CLI skills

| Agente (`-a`) | `skillsDir` | Evidência |
| --- | --- | --- |
| `universal` | `.agents/skills` | `cli.mjs:2101-2107` |
| `claude-code` | `.claude/skills` | `cli.mjs:1463-1465` |

`AGENT_PROJECT_SKILL_DIRS = [".agents/skills", ".claude/skills", …]` (`cli.mjs:1148-1150`). O maestro instala matt-pocock com `-a claude-code --copy` (`src/skills/install.ts:17`) e sincroniza só `.claude → .agents` (`syncSkillsToTargetDirs` em `src/setup/run.ts`); o Specsfy instala especialistas com `--agent universal`. FIND-EXT-002: o Claude Code 2.1.273 não lê `.agents/skills`.

## Conclusao

1. Só o maestro está invertido em relação ao Specsfy; unificar significa conteúdo em `AGENTS.md` e um único `@AGENTS.md` em `CLAUDE.md`.
2. `createExtension` recusa nome já registrado: a migração precisa mover artefatos (alterar `target` no registro) em vez de criar de novo.
3. Com `--copy`, `-a universal` e `-a claude-code` produzem o mesmo `SKILL.md`; a única diferença é o diretório de destino.
4. Uma cópia aditiva `.agents/skills/* → .claude/skills/` (sem sobrescrever) é executável em shell puro por hook; o `setup` faz a projeção completa com checksum.
