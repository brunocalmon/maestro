# Backlog: Testes de setup sem root isolado poluem o repo real

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0007 |
| Status | Promoted |
| Produto | A esclarecer |
| Épico | BACKLOG-0001 (Epic: Common Rules v1.0 — CLI-first orchestrator) |
| Funcionalidade | Suíte de testes do subsistema setup |
| Tipo | Técnico |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-09-05 |
| Spec promovida | `specs/draft/0013-testes-de-setup-com-root-isolado/spec.md` |

## Ideia original

Vários testes pré-existentes na suíte (Node/TS) do common-rules-server, na branch refactor/v1-cli-first, chamam runSetup({ env, write: true }) sem passar root. Em src/setup/run.ts, root usa opts.root ?? process.cwd() como fallback — e ao rodar vitest run, process.cwd() é o próprio diretório do repositório (não um diretório temporário isolado). Isso significa que toda execução completa da suíte de testes escreve de verdade em .common-rules/install.json do próprio projeto (trace id e installedAt mudam a cada rodada), poluindo o git status do repositório real. Arquivos de teste identificados com esse padrão (chamam runSetup com write: true e sem root): tests/setup-idempotent.test.ts, tests/setup-revert.test.ts, tests/setup-record.test.ts, tests/setup-install.test.ts, tests/setup-dryrun.test.ts. Contraste: a maioria dos outros testes de runSetup passa root explicitamente (via mkdtempSync/tmpdir), isolando corretamente. Esses cinco são a exceção. Fix sugerido: cada um desses cinco arquivos de teste deveria criar um diretório temporário isolado (mkdtempSync(join(tmpdir(), ...))) e passar root: <esse diretório> explicitamente para runSetup, seguindo o mesmo padrão já usado pelos demais testes de setup.

## Problema percebido

Rodar a suíte completa (vitest run) deixa o repositório com mudanças não intencionais em .common-rules/install.json (trace id e installedAt), exigindo reversão manual (git checkout --) antes de qualquer commit — reproduzido duas vezes na mesma sessão.

## Pessoa afetada ou beneficiada

Quem desenvolve neste repositório e roda a suíte completa; quem revisa o diff antes de commitar.

## Resultado ou valor esperado

git status fica limpo depois de rodar a suíte completa, sem revert manual necessário; nenhum teste escreve fora de um diretório temporário isolado.

## Contexto

Não é um bug de produção — é um problema de isolamento da suíte de testes. Distinto de outros achados sobre runSetup já registrados no backlog (SPEC-0005: 'já configurado' não resincroniza skills apagadas; ponte Python nunca executa): este é sobre a suíte escrever no repositório real, não sobre o comportamento de runSetup em si.

## Referências relacionadas

- `specs/inbox/2026-09-05-190102-testes-de-setup-sem-root-isolado-poluem-o-repo-real.md` — captura de origem deste item.
- `specs/backlog/0005-fatia-1h-skills-lado-a-lado.md` (seção de reaberturas, 2026-08-30) — backlog relacionado: mesmo arquivo (`src/setup/run.ts`) e mesma função (`runSetup`), mas trata do comportamento de `runSetup` em si (detecção de "já configurado" não olhar skills/framework), não da suíte de testes escrever fora de um diretório isolado. Problemas distintos, sem sobreposição.
- `specs/inbox/2026-08-30-122232-setup-nao-resincroniza-skills-nem-framework-quando-hooks-ja-batem.md` — backlog relacionado pela mesma razão acima.
- `specs/inbox/2026-08-30-155149-ponte-python-nunca-executa-de-verdade-no-setup-real.md` — backlog relacionado: mesmo call site (`runSetup` em `src/cli.ts`/`formatSetup`), problema diferente (bridge Python nunca recebe `bridgeEnv`).
- Nenhuma duplicata encontrada: nenhum item existente trata da suíte de testes escrever no repositório real por falta de `root` isolado.

## Comportamento esperado

Dado que a suíte completa de testes é executada com `npx vitest run` a partir da
raiz do repositório,
Quando qualquer teste chama `runSetup({ ..., write: true })`,
Então esse teste deve operar sobre um diretório temporário isolado (via
`mkdtempSync(join(tmpdir(), ...))`, passado explicitamente como `root`), nunca
sobre `process.cwd()` — e o `git status` do repositório real deve ficar
idêntico antes e depois da rodada completa.

## Regras de negócio

- Todo teste que chama `runSetup` com `write: true` deve passar `root`
  explicitamente; nenhum teste deve depender do fallback `opts.root ??
  process.cwd()` de `src/setup/run.ts`.
- O padrão de isolamento a seguir é o já usado pela maioria dos testes de
  `runSetup` (ex.: `tests/setup-writes.test.ts`, `tests/trace-*.test.ts`):
  criar o diretório temporário no próprio teste, não compartilhar entre casos.

## Critérios de aceitação

- **AC-1**: Dado o repositório limpo (`git status --porcelain` vazio), quando
  `npx vitest run` roda a suíte completa, então `git status --porcelain`
  continua vazio ao final — nenhuma modificação em `.common-rules/`,
  `.claude/`, `.project-context/` ou qualquer outro caminho do repositório real.
- **AC-2**: Dado `tests/setup-idempotent.test.ts`, `tests/setup-revert.test.ts`,
  `tests/setup-record.test.ts`, `tests/setup-install.test.ts` e
  `tests/setup-dryrun.test.ts`, quando cada um chama `runSetup`, então passa
  `root` apontando para um diretório criado por `mkdtempSync` no próprio teste.
- **AC-3**: Dado o mesmo comportamento coberto por esses cinco arquivos hoje
  (idempotência, reversão, registro, instalação, dry-run), quando o `root`
  passa a ser isolado, então nenhuma asserção existente muda de resultado —
  a mudança é de isolamento, não de comportamento testado.

## Qualidades e operação

- Segurança: não aplicável — mudança restrita à suíte de testes, sem
  alcance em produção ou em dados de usuário.
- Privacidade: não aplicável.
- Desempenho e volume: não aplicável — `mkdtempSync` é o mesmo custo já pago
  pelos demais testes de `runSetup`.
- Auditoria e observabilidade: nenhuma mudança de comportamento observável
  fora da suíte de testes.

## Dependências

- Nenhuma registrada.

## Situações de erro

- Não aplicável: é uma correção de isolamento em código de teste, sem
  caminho de erro em produção a tratar.

## Escopo

- Dentro: os cinco arquivos de teste identificados
  (`tests/setup-idempotent.test.ts`, `tests/setup-revert.test.ts`,
  `tests/setup-record.test.ts`, `tests/setup-install.test.ts`,
  `tests/setup-dryrun.test.ts`) passarem a usar `root` isolado.
- Fora: mudar o fallback de `src/setup/run.ts` (`opts.root ?? process.cwd()`)
  — esse comportamento de produção não foi questionado, é o próprio
  `runSetup` da CLI real (`common-rules setup`, sem `--root`) que depende
  dele; alterar isso é uma decisão distinta e fora do problema relatado.
- Fora: auditar a suíte inteira em busca de outros padrões de não-isolamento
  não relacionados a `runSetup` — o achado se limita ao que foi reproduzido.

## Dúvidas, decisões e riscos

- **A revisar** (herdado da inbox): confirmar, ao implementar, se algum dos
  cinco testes depende deliberadamente do `cwd` do processo por outro motivo
  antes de trocar para `root` isolado — nenhuma evidência disso foi
  encontrada até aqui, mas não foi lida linha a linha cada asserção.

## Pronto para desenvolvimento

- [x] O problema e a pessoa beneficiada estão claros.
- [x] O evento inicial e o resultado esperado estão claros.
- [x] Permissões, regras e exceções relevantes estão claras.
- [x] O resultado pode ser verificado objetivamente (AC-1 a AC-3).
- [x] Segurança, privacidade e desempenho foram avaliados conforme o risco (não aplicável, registrado).
- [x] Fora de escopo, dependências e decisões pendentes estão registrados.

## Brief pronto para especificar

1. **Problema e objetivo**: a suíte de testes deste repositório escreve de
   verdade em `.common-rules/install.json` do próprio projeto a cada rodada
   completa (`npx vitest run`), porque cinco testes chamam `runSetup({ ...,
   write: true })` sem passar `root`, caindo no fallback `process.cwd()`. O
   objetivo é o `git status` ficar idêntico antes e depois da suíte rodar.
2. **Atores**: quem desenvolve neste repositório e roda a suíte completa;
   quem revisa o diff antes de commitar.
3. **Escopo e fora de escopo**: dentro, isolar os cinco testes nomeados; fora,
   mudar o fallback de produção em `src/setup/run.ts` ou auditar a suíte
   inteira por outros padrões de não isolamento.
4. **Jornadas e regras essenciais**: todo teste que chama `runSetup` com
   `write: true` cria seu próprio diretório temporário (`mkdtempSync`) e passa
   `root` explicitamente — o mesmo padrão já usado pela maioria dos testes de
   `runSetup` neste repositório.
5. **Critérios de aceite**: AC-1, AC-2 e AC-3 acima.
6. **Restrições técnicas e de qualidade**: nenhuma além de preservar o
   comportamento hoje coberto pelos cinco testes (idempotência, reversão,
   registro, instalação, dry-run) — a mudança é de isolamento, não de
   cobertura.
7. **Suposições**: nenhum dos cinco testes depende do `cwd` real do processo
   por um motivo não documentado; a revisar na implementação (ver Dúvidas).
8. **Decisões abertas**: nenhuma que bloqueie a especificação — a única
   ressalva está registrada em "Dúvidas, decisões e riscos" e é uma
   verificação a fazer durante a implementação, não uma decisão de escopo.
9. **Vocabulário ambíguo e inferências confirmadas**: "isolado" significa,
   neste item, um diretório criado por `mkdtempSync(join(tmpdir(), ...))`
   exclusivo daquele caso de teste — o mesmo sentido já usado nos demais
   testes de `runSetup` deste repositório.

## Próximo passo

Pronto para `$framework-03-specify`.
