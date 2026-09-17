# Evidência: semântica do `matcher` no Claude Code

- Origem primária local: `.claude/settings.json` deste repositório (gerado pelo maestro em 2026-09-17) e o `git diff` do mesmo arquivo, que mostra o hook `protect-authorship` anterior com `"matcher": "Bash"` substituído por `"matcher": "protect-authorship"`.
- Origem secundária local: `node_modules/context-mode/hooks/hooks.json` (ver `context-mode-hooks-json.md`), instalado e funcional em outros projetos com matchers por nome de ferramenta.
- Observação empírica relatada pela pessoa responsável em projeto consumidor (`../dev-bootstrap`, 2026-09-17): nenhum dos 8 hooks do maestro dispara; o aviso do `setup-check` (SessionStart) nunca apareceu; commit com trailer `Co-Authored-By` não foi bloqueado.
- Data de acesso: 2026-09-17.
- Licença: não aplicável (arquivos do próprio projeto e observação).

## Achado

No Claude Code, `matcher` de `PreToolUse`/`PostToolUse` é um regex casado contra o **nome da ferramenta** (`Bash`, `Edit`, `Write`, `Read`, `mcp__…`); em `SessionStart` casa contra a origem da sessão (`startup|resume|clear|compact`); em `Stop` é ignorado. Um matcher igual a `guard-destructive` nunca casa com ferramenta alguma, logo o hook nunca executa. A evidência é convergente: o hook manual anterior funcionava com `Bash`; o context-mode instala com nomes de ferramenta; a observação empírica confirma que os hooks gerados não disparam.
