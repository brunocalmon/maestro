# Backlog: Phase 1: MVP TypeScript core com subsistemas integrados (framework, context-mode, code-review-graph, pi.dev)

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0003 |
| Status | Promoted |
| Produto | A esclarecer |
| Épico | A esclarecer |
| Funcionalidade | A esclarecer |
| Tipo | A esclarecer |
| Prioridade | Não priorizado |
| Milestones | |
| Criado em | 2026-08-24 |
| Spec promovida | specs/completed/0002-phase-1a-esqueleto-typescript/spec.md (fatia 1a) |

## Ideia original

Primeira fase de desenvolvimento: TypeScript core + CLI. Dependências fixadas via npm: framework, context-mode, code-review-graph, pi.dev (common-rules vence conflitos). Hybrid setup: MCP setup() tool + CLI common-rules setup (mesma lógica). Approval workflow hybrid (interativo terminal / JSON stdin CI/CD). Graceful degradation: detecção setup-time (which), cache .env, runtime revalidação se usuário pedir backend detectado como indisponível. Stock built-in IDE agents por padrão. Orchestrator model selection: análise completa (disponíveis via ollama ls etc, custo, capacidade máquina, plan usage Claude, recomendação + user override).

## Problema percebido

v0.2.8 é Python pesado. Oportunidade: MVP rápido em TypeScript com subsistemas já testados (framework, context-mode, code-review-graph, pi.dev). Valida wrapper/delegation pattern sem fazer tudo do zero. Graceful degradation prova robustez em ambientes heterogêneos.

## Pessoa afetada ou beneficiada

Desenvolvedores iterando rápido em TypeScript; times com framework/context-mode/code-review-graph já instalados; usuários em ambientes com ollama/agy/claude disponível; CI/CD sem UI interativa.

## Resultado ou valor esperado

CLI TypeScript funcional; setup único configura tudo (dependências, hooks, .env); aprovação explícita antes de orquestração; detecção robusta de backends; recomendação inteligente de modelo; fallback seguro para built-in IDE agents; prova que wrapper funciona com subsistemas reais.

## Contexto

Estratégia ágil: MVP rápido antes de adicionar complexidade. Phase 1 entrega subsistemas existentes integrados. Phase 2+ (graceful degradation refinement, multi-agente orchestration, etc). Dependências gerenciadas via npm com 'common-rules wins' em conflitos. Approval workflow detecta context (terminal vs JSON stdin). Model selection é análise completa, não heurística.

## Dependências verificadas em 2026-08-24

O backlog assumia quatro dependências fixadas via npm. A verificação contra o registro e contra a máquina mostrou que três dessas afirmações estavam erradas. Decisão confirmada: npm fixa o que é npm, e o setup exige `uv` para o que é Python, falhando quando ausente.

| Nome no backlog | Pacote real | Versão | Forma |
| --- | --- | --- | --- |
| `framework` | `removed-project-integration` | 0.10.2 | npm, com escopo |
| `context-mode` | `context-mode` | 1.0.169 | npm |
| `pi.dev` | `@earendil-works/pi-coding-agent` | 0.84.3 | npm, binário `pi` |
| `code-review-graph` | `code-review-graph` | 2.3.7 | **Python**, instalado por `uv tool` |

`pi` expõe `-p` para modo print e `--mode json`, que é o consumo headless previsto para o Orchestrator. `@mariozechner/pi` foi descartado: é um gerenciador de pods vLLM, não o agente.

## Backends de agente presentes nesta máquina

`claude`, `cursor-agent` e `codex` (`@openai/codex@0.149.1`). Ausentes: `pi`, `agy`, `ollama`, `aider`, `goose`. A inclusão de `codex` na lista suportada continua em aberto.

## Fatiamento decidido em 2026-08-24

A Phase 1 empacotava seis entregas. Cada uma é comparável em tamanho à Phase 0, que rendeu 14 tarefas e 93 itens de checklist sendo uma única coisa estreita. Decisão: esqueleto primeiro, capacidades depois.

| Fatia | Entrega | Estado |
| --- | --- | --- |
| 1a | Esqueleto executável: manifesto, build, runner, dependências resolvidas | **SPEC-0002, concluída** |
| 1b | Hooks, detecção, registro e ponte `uv`, via CLI | **SPEC-0003, concluída** |
| 1c | Approval workflow interativo e JSON | **SPEC-0007, concluída** |
| 1d | Detecção de backends e graceful degradation | **SPEC-0008, concluída** |
| 1e | Seleção de modelo pelo Orchestrator | **SPEC-0009, concluída** |
| 1f | Servidor MCP com a tool `setup` única | **SPEC-0004, concluída** |
| 1g | Telemetria por `trace_id` no registro auditável | **SPEC-0006, concluída** |
| 1h | Instalar framework e mattpocock lado a lado, com registro | **SPEC-0005, concluída** |
| 1i | Aprovação em lote dos comandos das dependências, no `setup` | **SPEC-0010, concluída** |

Decisões desta fatia: pacote `@brunocalmon/common-rules` com binário `common-rules`, porque `common-rules` sem escopo está ocupado no npm por um pacote abandonado desde 2023. Runner Vitest. ESM e Node maior ou igual a 20 como defaults reversíveis.

`codex` na lista de backends suportados continua em aberto, adiado para a fatia 1d.

## Decisões da fatia 1b, refinadas em 2026-08-24

O `setup` da v0.2.8 existia para resolver `{{PLACEHOLDER}}` dentro de 47 recursos e colocar guidance por IDE. Os recursos foram removidos na Phase 0 e o framework assumiu o motor de skills, de modo que o propósito precisou ser redefinido antes de especificar.

**Trabalho do setup.** Ligar subsistemas ao ciclo do agente e proteger o repositório. É o que só o common-rules pode fazer: ele não reimplementa `context-mode` nem `code-review-graph`, mas é quem os conecta.

**Hooks distribuídos.** Sete, dos dez que a v0.2.8 tinha:

| Grupo | Hooks | Motivo |
| --- | --- | --- |
| Integração de subsistema | `context-mode-pretooluse`, `context-mode-posttooluse`, `context-mode-stop`, `code-review-graph-update` | Ligam os subsistemas ao ciclo do agente |
| Guardrails | `guard-destructive`, `guard-secrets` | Segurança, independente de motor de skills |
| Autoria | `protect-authorship` | Preserva a autoria dos commits |

Os três restantes — `orchestration-briefing`, `completion-gate` e `format-after-edit` — ficam fora: pressupõem o kit de recursos que deixou de existir, e orquestração é território do framework. As fontes seguem consultáveis em `archived`.

**Persistência.** O `setup` grava um registro do que fez: quais hooks instalou, em qual alvo, quando e em que versão. Sem memória ele não seria idempotente nem reversível, e não responderia "o que essa ferramenta mexeu na minha máquina". Não guarda cache de resolução de dependências: `doctor` resolve em milissegundos e cache divergente reintroduz a diferença silenciosa que a coluna de origem existe para expor.

**Alvo de IDE.** Apenas Claude Code, com detecção — o `setup` só escreve se o projeto evidenciar uso, e relata o que ignorou. Cursor e Antigravity viram fatia própria. A 1a mostrou que fatia estreita expõe defeito que fatia larga encobre; com três tradutores simultâneos, um erro em um deles ficaria coberto pelos outros dois passando.

**Fora de escopo em 1b.** Approval workflow, que é 1c. Detecção de backends de agente, que é 1d. Seleção de modelo, que é 1e. Tradução para Cursor e Antigravity.

**Refatiamento por dimensionamento.** A medição contra o código congelado em `archived` mostrou que a 1b não cabia: `hook_service.py` tinha 494 linhas e 13 funções só para traduzir hooks, e `mcp_server.py` tinha 536, contra 207 linhas em três módulos que a fatia 1a inteira produziu. Eram dois subsistemas independentes numa fatia só.

A separação é por ponto de entrada. A 1b entrega os sete hooks, a detecção, o registro, a idempotência e a ponte `uv`, tendo o comando `common-rules setup` como entrada. O servidor MCP vira a fatia 1f, expondo a mesma lógica já funcionando e coberta por testes.

O critério é a própria decisão de que o projeto é primordialmente CLI e o MCP permanece enxuto: a superfície secundária não precede a lógica que expõe.

| Fatia | Entrega | Estado |
| --- | --- | --- |
| 1b | Hooks, detecção, registro e ponte `uv`, via CLI | **SPEC-0003, concluída** |
| 1f | Servidor MCP com a tool `setup` única | **SPEC-0004, concluída** |

**Fatia 1g, acrescentada em 2026-08-29.** O ADR 001, capturado em `specs/inbox/2026-08-29-145241`, propunha telemetria por `trace_id` como épico próprio. A decisão foi trazê-la para cá: é pequena, aditiva, e encaixa no registro que a fatia 1b já grava em `.common-rules/install.json`. Correlacionar operações por identificador de sessão não exige nada que as outras fatias não tenham. O restante daquele ADR virou `specs/backlog/0004-phase-2-extensoes-locais-e-heal.md`, posterior a esta fase.

**Anotação sem efeito nesta fatia.** A pessoa responsável mencionou querer renomear a ferramenta para `maestro`, e pediu explicitamente que isso não fosse considerado agora. Fica registrado como captura futura: é renomeação que toca nome de pacote, binário, `PROJECT.md`, `STACK.md` e duas specs concluídas.

## Referências relacionadas

- Nenhuma referência relevante encontrada.

## Comportamento esperado

A esclarecer.

## Regras de negócio

- A esclarecer conforme risco e complexidade.

## Critérios de aceitação

- A esclarecer antes de considerar o item refinado.

## Qualidades e operação

- Segurança: a avaliar.
- Privacidade: a avaliar.
- Desempenho e volume: a avaliar.
- Auditoria e observabilidade: a avaliar.

## Dependências

- Nenhuma registrada.

## Situações de erro

- A esclarecer.

## Escopo

- Dentro: a esclarecer.
- Fora: a esclarecer.

## Dúvidas, decisões e riscos

- Nenhum registrado.

## Pronto para desenvolvimento

- [ ] O problema e a pessoa beneficiada estão claros.
- [ ] O evento inicial e o resultado esperado estão claros.
- [ ] Permissões, regras e exceções relevantes estão claras.
- [ ] O resultado pode ser verificado objetivamente.
- [ ] Segurança, privacidade e desempenho foram avaliados conforme o risco.
- [ ] Fora de escopo, dependências e decisões pendentes estão registrados.

## Próximo passo

Aprofundar nesta etapa até o item ficar pronto para `$framework-03-specify`.

**Fatia 1h, acrescentada em 2026-08-29.** O `setup` passa a instalar também os
dois conjuntos de skills, íntegros e lado a lado em `.claude/skills/`, sem que o
`common-rules` escolha entre eles. As de Matt Pocock vêm pelo instalador oficial
`skills`, da vercel-labs, já que o autor não publica no npm. O brief está em
`specs/backlog/0005-fatia-1h-skills-lado-a-lado.md`. A camada de orquestração em
`CLAUDE.md` ficou fora desta fatia e foi para o épico de extensões da Phase 2.

## Decisões das fatias 1c, 1d e 1e, tomadas em 2026-08-29

**Estado da máquina, verificado nesta data.** Os oito backends estão instalados —
`claude`, `cursor-agent`, `codex`, `pi`, `agy`, `goose`, `dsh` e `ollama` —, e
apenas `aider` está ausente. A nota de 2026-08-24, acima, listava cinco como
ausentes e envelheceu. O `ollama` responde e tem três modelos locais:
`cogito:14b`, `qwen2.5:3b` e `qwen3:8b`. Na varredura de `--help`, `pi` expõe
`--print` e `agy` expõe `--json-schema`, `--output-format` e `--print`; `codex`,
`goose` e `dsh` não expuseram flag equivalente.

- **D1, escopo da 1c**: a aprovação em lote de comandos vira **fatia própria, a 1i**, e não parte da 1c. *Razão*: são problemas com ciclos de vida distintos. A 1c decide o canal de aprovação de um plano, que é efêmero e por execução; o whitelisting decide o escopo permanente de comandos permitidos, que é configuração persistente e sensível. Fundir faria a 1c crescer até o tamanho que o refatiamento de 2026-08-24 já rejeitou.
- **D2, lista suportada da 1d**: entram **`pi`, `agy` e `claude`**. *Razão*: a `DEC-002` da SPEC-0002 fixa detecção **por capacidade, nunca por presença**. Estar instalado não torna um backend acionável por um Orchestrator que roda como subprocesso não interativo, e `codex`, `goose` e `dsh` não expuseram modo headless na varredura. Isso fecha a pendência registrada acima: **`codex` fica fora** até que alguém demonstre por execução a invocação sem interação, e entrará por acréscimo de um caso, não por reescrita. *Distinção que a spec precisa escrever*: o `doctor` **relata** todos os backends encontrados; a lista **suportada** é a dos três.

  **Correção — 2026-08-30, ao especificar a fatia 1d.** A varredura original checou só o `--help` de topo de cada CLI, que não expõe subcomando algum. Reverificado na máquina real: `codex exec` e `goose run` são, cada um, um subcomando dedicado a execução não interativa — testei `codex exec` de ponta a ponta, sem terminal, prompt por stdin, resposta impressa e processo encerrado sozinho, com `--json`/`--output-schema` disponíveis; `goose run -t <texto> --output-format json` tem a mesma forma de invocação, e falhou só por falta de credencial configurada nesta máquina, não por exigir interação. Pendência demonstrada por execução, exatamente como a razão original previa. **Lista suportada corrigida para `pi`, `agy`, `claude`, `codex` e `goose`** — cinco, não três. `dsh` permanece fora: não expôs superfície equivalente nem no `--help` de topo nem nos subcomandos examinados. Evidência em `specs/draft/0008-fatia-1d-deteccao-backends/research/`.
- **D3, verificação da degradação graciosa na 1d**: o detector é **injetável**, no mesmo padrão do `Environment` da fatia 1a e do executor da 1b, de modo que a ausência vire caso de teste em vez de acidente da máquina. *Razão*: exercitar contra `aider`, hoje o único ausente, produziria cobertura que evapora quando alguém o instalar; e exigir contêiner limpo pede infraestrutura que a suíte não tem. Mantém-se um caso de paridade contra a máquina real, para provar que a interface injetada corresponde ao detector verdadeiro.
- **D4, o que a 1e entrega**: **relatório com recomendação e override humano**. *Razão*: a decisão vinculante da captura original é que o Orchestrator pede aprovação de plano **e de modelo** antes de executar. Aplicar automaticamente inverteria isso, e entregar apenas inventário descartaria a "análise completa, não heurística" que a captura pede. *Restrição para a spec*: custo e capacidade saem de dado local ou de configuração declarada — nada de tabela de preços chumbada no código, que envelhece em silêncio.

  **Correção — 2026-08-30, ao especificar a fatia 1e.** "Análise completa" — custo, modelos disponíveis por backend, uso do plano Claude — pressupõe consulta autenticada por rede a cada backend. Verificado na máquina real: `agy models` pede login antes de listar qualquer coisa; nenhum dos cinco backends suportados (`pi`, `agy`, `claude`, `codex`, `goose`) expõe enumeração de modelo alcançável sem autenticação, e `--model`/`--models` de todos é texto livre, não uma lista fechada consultável. Isso contradiz o padrão sem rede e sem autenticação que todas as fatias anteriores mantiveram (`DEC-002`, `NFR-030`/`SPEC-0008`). **Escopo corrigido**: a 1e entrega o que é local e real — modelos locais via `ollama list` (sem rede, sem login), capacidade da máquina (`os.totalmem`), e uma recomendação que escolhe o backend suportado disponível e, quando `ollama` tem modelo cujo tamanho cabe na capacidade livre da máquina, sugere esse modelo local; para os cinco backends de nuvem, a escolha de modelo dentro do backend permanece com o próprio backend — `common-rules` recomenda o backend, não o modelo de nuvem, e aceita override humano de qual backend/modelo usar em vez de recalcular. Custo e uso de plano ficam fora desta fatia, sem fonte local confiável e sem tabela chumbada no código — registrado como limitação assumida, não como pendência silenciosa.

**Ordem decidida**: 1c, depois 1d, depois 1e, e a 1i por último. A 1e consome a
lista suportada da 1d e o canal de aprovação da 1c.

**Implicação técnica registrada**: o `doctor` hoje conhece as camadas `npm` e
`python`. A 1d acrescenta a terceira, de backends de agente, e o tipo `Layer`
passa a ter três valores.
