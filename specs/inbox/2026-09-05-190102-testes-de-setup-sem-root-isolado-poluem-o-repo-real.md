# Inbox: Testes de setup sem root isolado poluem o repo real

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-05T17:01:02Z |
| Slug | testes-de-setup-sem-root-isolado-poluem-o-repo-real |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `b0f37b0c5948bcfb7e1785b1681963cda7c92d91f034eb8f0130d7d8cc064486` |
| Backlog derivado | `specs/backlog/0007-testes-de-setup-sem-root-isolado-poluem-o-repo-real.md` |
| Spec derivada | Nenhuma |

## Texto original

Vários testes pré-existentes na suíte (Node/TS) do common-rules-server, na branch refactor/v1-cli-first, chamam runSetup({ env, write: true }) sem passar root. Em src/setup/run.ts, root usa opts.root ?? process.cwd() como fallback — e ao rodar vitest run, process.cwd() é o próprio diretório do repositório (não um diretório temporário isolado). Isso significa que toda execução completa da suíte de testes escreve de verdade em .common-rules/install.json do próprio projeto (trace id e installedAt mudam a cada rodada), poluindo o git status do repositório real. Arquivos de teste identificados com esse padrão (chamam runSetup com write: true e sem root): tests/setup-idempotent.test.ts, tests/setup-revert.test.ts, tests/setup-record.test.ts, tests/setup-install.test.ts, tests/setup-dryrun.test.ts. Contraste: a maioria dos outros testes de runSetup passa root explicitamente (via mkdtempSync/tmpdir), isolando corretamente. Esses cinco são a exceção. Encontrado ao investigar dois bugs reais (setup --target e TTY approval, commits 929cad8 e 3831d5d em refactor/v1-cli-first): a cada npx vitest run completo, .common-rules/install.json do repo real aparecia modificado no git status, tendo que ser revertido manualmente (git checkout --) duas vezes na mesma sessão para não commitar ruído junto com os fixes reais. Fix sugerido: cada um desses cinco arquivos de teste deveria criar um diretório temporário isolado (mkdtempSync(join(tmpdir(), ...))) e passar root: <esse diretório> explicitamente para runSetup, seguindo o mesmo padrão já usado pelos demais testes de setup (ex: tests/setup-writes.test.ts, tests/trace-*.test.ts). Não é um bug de produção — é um problema de isolamento da suíte de testes que suja o próprio repositório a cada execução.

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Cinco testes chamam runSetup com write:true sem passar root, então escrevem em .common-rules/install.json do próprio repositório a cada rodada da suíte.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Rodar a suíte completa (vitest run) deixa o repositório com mudanças não intencionais em .common-rules/install.json, exigindo reversão manual antes de qualquer commit.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Quem desenvolve neste repositório e roda a suíte completa; quem revisa o diff antes de commitar.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Suíte de testes deixa de sujar o repositório real; git status fica limpo após rodar os testes, sem revert manual.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Arquivos afetados: tests/setup-idempotent.test.ts, tests/setup-revert.test.ts, tests/setup-record.test.ts, tests/setup-install.test.ts, tests/setup-dryrun.test.ts. Causa: src/setup/run.ts usa opts.root ?? process.cwd() como fallback. Padrão correto já usado por outros testes: mkdtempSync(join(tmpdir(), ...)) + passar root explicitamente.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Não identificado no texto original.

### Riscos e dependências

**Análise preliminar:** Nenhum risco em produção — é um problema de isolamento da suíte de testes, não do software entregue.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Ajustar os cinco arquivos de teste para criar um diretório temporário isolado e passar root explicitamente, seguindo o padrão de tests/setup-writes.test.ts e tests/trace-*.test.ts.

## Pontos a revisar no futuro

**A revisar:** Confirmar se algum desses cinco testes depende deliberadamente do cwd do processo por outro motivo antes de mudar root.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$framework-02-backlog`.
