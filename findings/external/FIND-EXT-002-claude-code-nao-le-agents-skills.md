# FIND-EXT-002 — Claude Code não carrega skills de `.agents/skills`; `skills list` sugere o contrário

| Campo | Valor |
| --- | --- |
| ID | FIND-EXT-002 |
| Status | mitigated — SPEC-0024 (release 2.1.25): `.agents/skills` canônico, projeção para `.claude/skills` no `setup` (com checksum) e por hooks `skills-project-session`/`skills-project`; o fix definitivo continua dependendo do Claude Code ou do CLI `skills` |
| Alvo | Claude Code 2.1.273 (binário `@anthropic-ai/claude-code`); CLI `skills` 1.5.23 (`vercel-labs/skills`); instalação de especialistas do Specsfy com `--agent universal` |
| Evidência | Teste empírico do usuário em `../dev-bootstrap` (2026-09-17): especialistas presentes só em `.agents/skills` ficam indisponíveis, inclusive em sessão nova. No binário do Claude Code, a única referência a `.agents/skills` é o importador de configuração do Cursor, que copia para `.claude/skills` sob demanda (`skillsOut: .claude/skills`), não um caminho de carga. `skills list` marca essas skills como servindo "Claude Code". |
| Mitigação local | BACKLOG-0012: `.agents/skills` canônico e projeção `.agents → .claude` no `setup`, no `SessionStart` e após `skills add`/`specsfy skills`, com registro por checksum. |
| Fix definitivo | Depende do Claude Code passar a ler `.agents/skills` (fora do controle) ou do `skills` CLI/Specsfy instalarem também em `.claude/skills` para o agente `claude-code`. Issue a avaliar em `vercel-labs/skills` e `promovaweb/specsfy`. |
