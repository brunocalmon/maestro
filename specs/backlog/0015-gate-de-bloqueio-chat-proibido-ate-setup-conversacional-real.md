# Backlog: Gate de bloqueio: chat proibido até setup conversacional real

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0015 |
| Status | Promoted |
| Produto | maestro |
| Épico | Setup determinístico e configuração garantida (continuação de SPEC-0022 a SPEC-0025) |
| Funcionalidade | Gate de bloqueio de chat por configuração conversacional pendente |
| Tipo | Técnico |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-09-18 |
| Spec promovida | specs/draft/0026-gate-de-bloqueio-chat-proibido-ate-setup-conversacional-real/spec.md |

## Ideia original

okay, então ao instalar o maestro eu quero garantir que tudo foi executado, maestro precisa instalar tudo deterministico e forçar o usuario a rodar o skill manualmente, enquanto isso não for feito o chat está proibido de ser usado. sempre que houver uma versão nova do maestro, o setup deve ocorrer novamente, completo.

## Problema percebido

SPEC-0025 já detecta e avisa quando specsfy-setup ou setup-matt-pocock-skills não rodaram de verdade (WARN no doctor, mensagem no setup-check), mas nada impede o uso do chat enquanto isso. O aviso pode ser ignorado indefinidamente, e o projeto segue sendo usado sem PROJECT.md, STACK.md, RULES.md, USER-PROFILE.md ou a seção ## Agent skills em AGENTS.md.

## Pessoa afetada ou beneficiada

Quem usa o maestro em Claude Code para orquestrar um projeto, especialmente logo após instalar ou atualizar o maestro, antes de completar a configuração conversacional.

## Resultado ou valor esperado

O chat fica bloqueado (UserPromptSubmit nega com exit 2) para qualquer mensagem que não seja a invocação exata de /specsfy-setup ou /setup-matt-pocock-skills, enquanto os traços reais dessas skills não existirem no projeto. Um escape hatch deliberado via CLI (--defer-conversational) permite adiar conscientemente, expirando quando o contrato de traços exigidos mudar.

## Contexto

Diferencia-se de SPEC-0025 (que só reporta e avisa) por fazer enforcement real, bloqueando o uso do agente. Decisão tomada após grilling que rejeitou a proposta original do usuário (checklist booleano + checksum imutável em config.yaml, hook que flipa booleano quando a skill é chamada) por falhas arquiteturais identificadas: checksum forjável trivialmente e sem defesa real, e ausência de evento de hook Claude Code para 'skill terminou com sucesso'. A solução aprovada reaproveita a checagem ao vivo de traços de arquivo já existente (diagnoseMaestroProject/assessConfiguration, SPEC-0025) sem introduzir estado novo.

## Referências relacionadas

- `specs/completed/0025-doctor-orquestrador-e-setup-completo/spec.md` — spec relacionada: introduziu `diagnoseMaestroProject`/`assessConfiguration`, os traços de arquivo (`SPECSFY_SETUP_TRACES`, `AGENT_SKILLS_HEADING`) e o hook `setup-check` que este item reaproveita e escala de aviso para bloqueio real.
- `specs/completed/0024-normalizacao-agents-claude-e-projecao-de-skills/spec.md` — spec relacionada: definiu a direção AGENTS.md/CLAUDE.md cujo traço (`## Agent skills` em AGENTS.md) este item usa como condição de bloqueio.
- `specs/completed/0022-hooks-do-maestro-validos-no-claude-code/spec.md` — spec relacionada: base da tradução de hooks canônicos para Claude Code (`src/hooks/claude-code.ts`) que este item estende com um novo evento `on-prompt`/`UserPromptSubmit` e a variável `HOOK_PROMPT`.
- `resources/hooks/setup-check.md` — documentação relacionada: hook de aviso (SessionStart) que continua ativo e complementar, sem overlap, ao novo hook de bloqueio (UserPromptSubmit).

## Comportamento esperado

Enquanto o projeto estiver configurado no Claude Code mas os traços reais de `specsfy-setup` (`PROJECT.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md`, `.specsfy/USER-PROFILE.md`) ou de `setup-matt-pocock-skills` (`## Agent skills` em `AGENTS.md`) não existirem no disco, um novo hook `on-prompt` nega (`exit 2`) toda mensagem enviada ao chat, exceto as que começam exatamente com `/specsfy-setup` ou `/setup-matt-pocock-skills`. A checagem é sempre ao vivo (reaproveita `diagnoseMaestroProject`/`assessConfiguration` de SPEC-0025), sem estado, checklist booleano ou checksum persistido. A mensagem de negação é curta, sem repetir o detalhe que o `setup-check` (SessionStart) já mostrou no início da sessão. Um comando de CLI, `maestro setup --defer-conversational`, executável apenas fora do chat, registra um adiamento deliberado que desliga o bloqueio (mas não o aviso do `setup-check`) até que o contrato de traços exigidos mude.

## Regras de negócio

- O bloqueio só considera os dois itens conversacionais (`specsfy-setup`, `setup-matt-pocock-skills`); dependências determinísticas (context-mode, code-review-graph) continuam fora deste gate e seguem sob `maestro doctor`.
- A avaliação "configurado" é agregada por skill (`specsfy: true/false`, `matt-pocock: true/false`), nunca por traço individual, e nunca persistida — cada checagem relê o disco.
- Nenhum hook grava um booleano de "skill concluída": não existe evento confiável em Claude Code para "a conversa da skill terminou", então nada além da checagem ao vivo dos traços decide o estado.
- A correspondência da allowlist é por prefixo exato da mensagem (`/specsfy-setup` ou `/setup-matt-pocock-skills`, com ou sem argumento depois); substring ou menção ao comando no meio do texto não conta.
- O bloqueio aplica-se somente ao backend Claude Code nesta primeira entrega; outros backends (agy, codex, goose, pi) continuam apenas com o aviso não-bloqueante já existente.
- `maestro setup --defer-conversational` só pode ser invocado via terminal, nunca aceito como comando dentro de uma mensagem de chat (mesmo bloqueada) — evita virar mais uma porta de allowlist.
- O adiamento fica associado a um identificador do contrato de configuração vigente (ex.: hash de `SPECSFY_SETUP_TRACES` + `AGENT_SKILLS_HEADING`); se esse contrato mudar em uma versão futura do maestro, o adiamento anterior deixa de valer e o bloqueio volta a exigir decisão nova. Não expira por tempo nem fica permanente por padrão.
- A mensagem de bloqueio no `UserPromptSubmit` é curta; o detalhe completo (quais traços faltam) permanece exclusivo do `setup-check` no início da sessão, sem duplicar conteúdo entre os dois hooks.

## Critérios de aceitação

- **Dado** um projeto com `maestro setup` executado mas sem os 4 traços de `specsfy-setup` e sem `## Agent skills` em `AGENTS.md`, **quando** o usuário envia qualquer mensagem que não seja `/specsfy-setup` nem `/setup-matt-pocock-skills`, **então** o hook nega a mensagem (exit 2) com uma mensagem curta apontando os dois comandos.
- **Dado** o mesmo projeto não configurado, **quando** o usuário envia exatamente `/specsfy-setup` ou `/setup-matt-pocock-skills` (com ou sem argumento), **então** a mensagem passa e a skill correspondente é carregada normalmente.
- **Dado** um projeto onde `specsfy-setup` já deixou seus 4 traços mas `## Agent skills` ainda não existe, **quando** o usuário envia qualquer mensagem que não seja `/setup-matt-pocock-skills`, **então** a mensagem continua bloqueada (o gate exige os dois, não apenas um).
- **Dado** um projeto totalmente configurado (os 4 traços de specsfy-setup e `## Agent skills` presentes), **quando** o usuário envia qualquer mensagem, **então** nada é bloqueado.
- **Dado** um projeto não configurado onde o usuário rodou `maestro setup --defer-conversational` no terminal, **quando** o usuário envia qualquer mensagem no chat, **então** ela passa sem bloqueio, mas o `setup-check` de início de sessão continua avisando o que falta.
- **Dado** um projeto com adiamento registrado, **quando** uma versão nova do maestro muda o contrato de traços exigidos (ex.: `SPECSFY_SETUP_TRACES` ganha um novo arquivo), **então** o adiamento anterior deixa de valer e o bloqueio volta a exigir decisão explícita.
- **Dado** o backend não é Claude Code (ex.: agy, codex, goose, pi), **quando** o projeto não está configurado, **então** nenhum bloqueio ocorre — só o aviso não-bloqueante já existente.

## Qualidades e operação

- Segurança: o bloqueio não é uma barreira de segurança contra um usuário mal-intencionado com acesso de escrita ao repositório (ele pode remover/desativar o hook, como qualquer hook local já discutido em SPEC-0023); é uma barreira de fricção contra negligência/esquecimento, mesmo trust boundary já aceito para `protect-authorship` e demais guards.
- Privacidade: nenhum dado novo é coletado; a checagem só lê arquivos já presentes no próprio projeto.
- Desempenho e volume: a checagem ao vivo roda a cada prompt enviado; precisa ser barata (testes de existência de arquivo e grep de heading, mesmo padrão já usado em `setup-check.md`), sem chamadas de rede ou subprocessos pesados.
- Auditoria e observabilidade: `maestro doctor` deve continuar reportando o estado real (WARN/OK) independentemente do gate estar ativo ou adiado; um adiamento ativo deve aparecer de forma visível no `doctor` ou no aviso de sessão, nunca silenciosamente.

## Dependências

- SPEC-0025 (`diagnoseMaestroProject`, `assessConfiguration`, `SPECSFY_SETUP_TRACES`, `AGENT_SKILLS_HEADING`) — este item lê essas funções/constantes, não as reimplementa.
- SPEC-0022 (`src/hooks/claude-code.ts`, `src/hooks/source.ts`) — precisa do novo `CanonicalEvent` `on-prompt` já mapeado para `UserPromptSubmit` e da adição de `HOOK_PROMPT` ao `PREAMBLE`.
- `resources/hooks/setup-check.md` — o novo hook de bloqueio deve coexistir sem duplicar a mensagem que esse hook já mostra.

## Situações de erro

- Se o hook de bloqueio falhar ao ler o disco (ex.: permissão, symlink quebrado) e não conseguir determinar o estado, ele deve falhar em modo aberto (`allow`) e não travar o chat por um erro do próprio hook — mesmo princípio de "nunca quebrar o fluxo normal por falha do guard" já aplicado aos outros hooks deste projeto.
- Se `maestro setup --defer-conversational` for chamado num projeto que já está totalmente configurado (nada para adiar), o comando deve avisar que não há nada pendente e não gravar um adiamento inútil.
- Se o contrato de traços mudar mas o usuário nunca rodar `maestro setup` de novo, o adiamento anterior simplesmente para de cobrir a checagem nova (por não bater o identificador de contrato) — sem exigir nenhuma migração ativa de dado antigo.

## Escopo

- Dentro: novo hook `on-prompt`/`UserPromptSubmit` com bloqueio real (exit 2); adição de `HOOK_PROMPT` ao `PREAMBLE` de `src/hooks/claude-code.ts`; allowlist por prefixo exato dos dois comandos; comando de CLI `maestro setup --defer-conversational`; expiração do adiamento por identificador de contrato de traços; mensagem curta de bloqueio sem duplicar `setup-check`.
- Fora: bloqueio de chat em backends além de Claude Code (agy, codex, goose, pi); qualquer checklist booleano ou checksum persistido em `config.yaml`/`install.json` (rejeitado no grilling); hook que "flipa" campo ao detectar chamada de skill (rejeitado por falha de timing); allowlist ampliada para comandos de diagnóstico (`doctor`, `git status`, etc.) — ficou de fora deliberadamente.

## Dúvidas, decisões e riscos

- Nenhuma lacuna aplicável — todas as decisões de desenho foram fechadas em sessão de `/grill-me` (`grilling`) antes deste registro, incluindo a rejeição justificada da proposta original de checklist+checksum e a escolha do mecanismo de escape hatch com expiração por contrato.
- Risco aceito e registrado: o gate não impede burla deliberada por quem tem acesso de escrita ao repositório (mesmo trust boundary de todos os hooks locais do maestro); é fricção contra esquecimento, não controle de segurança.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente.
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Pronto para `$specsfy-03-specify`.
