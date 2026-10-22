# Segunda origem oficial: `removed-project-integration` pelo mesmo instalador `skills`

Data: 2026-08-30. Execução real, sem fixture, em diretório descartável.

## Comando

```bash
skills add removed-project-integration -a claude-code --skill '*' --copy -y
```

## Resultado

- Código de saída: 0.
- `.claude/skills/` recebeu 20 diretórios (`framework-01-inbox` … `framework-update-spec`), todos arquivo real — `find .claude/skills -maxdepth 1 -type l` não encontrou link algum.
- `skills-lock.json` gravado na raiz, mesma forma do instalador para `mattpocock/skills`: `{"version":1,"skills":{"<nome>":{"source","sourceType","skillPath","computedHash"}}}`.
- O atalho curto `removed-project-integration` (sem URL completa) funciona igual a `https://github.com/removed-project-integration`, no mesmo formato `owner/repo` já usado por `mattpocock/skills`.
- Nenhum `CLAUDE.md` nem `AGENTS.md` foi criado por este comando — só `.claude/skills/` e o lockfile.

## Consequência para o plano

`src/skills/source.ts` aceita hoje uma única origem oficial. A segunda origem entra pelo mesmo `Executor`/`installSkills` já desenhados; o único ajuste é `resolveSource` aceitar as duas, e `runSetup` chamar `installSkills` uma vez por origem.
