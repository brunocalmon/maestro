# Backlog: Epic Phase 2: extensoes locais verificaveis e reparo assistido

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0004 |
| Status | Promoted |
| Produto | common-rules |
| Épico | Phase 2 — extensibilidade local |
| Funcionalidade | Extensões locais, reparo assistido e hidratação adiada |
| Tipo | épico |
| Prioridade | Desbloqueada — Phase 1 fechou por completo em 2026-09-02 |
| Milestones | |
| Criado em | 2026-08-29 |
| Spec promovida | specs/completed/0011-extensoes-locais-reparo-assistido/spec.md (Complete, 2026-09-03) |

## Ideia original

Do ADR 001, depois de descartado o que colide com decisões vinculantes: um diretório de extensões locais no repositório consumidor, com caminho único de escrita pela CLI e verificação por checksum; separação entre um doctor somente-leitura e um comando heal que repara; e hidratação de regras sob demanda. A pessoa responsável corrigiu quatro pontos do ADR na conversa: conformidade de versão em vez de imutabilidade do upstream; doctor permanece leitura e o reparo vira comando próprio, que move para quarentena e nunca apaga; recusa em voz alta no lugar de fallback silencioso; e a garantia do caminho único de escrita é detectabilidade, não prevenção de injeção.

## Problema percebido

Hoje não há como a pessoa ajustar um hook ou uma regra entregue pelo common-rules sem editar o arquivo que o setup escreve, o que a próxima execução sobrescreve. Não existe caminho para customização que sobreviva a uma reinstalação, nem forma de distinguir o que a ferramenta gerou do que alguém alterou à mão.

## Pessoa afetada ou beneficiada

A pessoa que mantém este repositório e precisa de hotfix local sem esperar release; e, por extensão, quem instalar o common-rules e quiser adaptar um guardrail ao próprio contexto.

## Resultado ou valor esperado

Customização local que sobrevive à reinstalação, divergência detectável em vez de silenciosa, e reparo explícito e reversível quando algo sai do lugar.

## Contexto

Deriva do ADR 001 capturado em specs/inbox/2026-08-29-145241. Sucede a Phase 1, cujas fatias 1c, 1d e 1e continuam abertas. Três propostas do ADR foram rejeitadas por colidirem com decisões já vinculantes, e a hidratação sob demanda foi adiada depois de medição que mostrou o Claude Code já entregando 17x de economia por conta própria.

## Referências relacionadas

| Caminho | Relação |
| --- | --- |
| `specs/inbox/2026-08-29-145241-adr-001-harness-extensivel-com-lazy-loading-shadow-dom-e-doctor-com-rollback.md` | origem — ADR completo, preservado sem alteração |
| `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md` | épico precedente — fatias 1c, 1d e 1e seguem abertas |
| `specs/completed/0002-phase-1a-esqueleto-typescript/spec.md` | limita — DEC-002 fixa a regra de resolução e a proibição de instalar globalmente |
| `specs/completed/0003-fatia-1b-setup-hooks/spec.md` | limita — DEC-001 estabelece que o `framework` é o motor de skills e o `common-rules` é wrapper; `hooks/` é a verdade única dos sete hooks |
| `specs/planned/0004-fatia-1f-servidor-mcp/spec.md` | limita — DEC-002 fixa recusar em vez de adivinhar diante de estado não confirmável |

## Comportamento esperado

Duas fatias ativas e uma adiada.

**Fatia A — extensões locais verificáveis.** A pessoa pede uma customização por uma skill de fachada, que não escreve nada e apenas aciona a CLI. A CLI resolve categoria, template e destino, grava o artefato e registra seu checksum. Numa execução seguinte, tudo que não veio por esse caminho aparece como divergente.

**Fatia B — reparo assistido.** O `doctor` continua estritamente somente-leitura, relata divergências e sai com código diferente de zero nomeando o que um reparo resolveria. Um comando próprio executa o reparo, movendo o arquivo divergente para quarentena antes de restaurar o original.

**Fatia C — camada de orquestração em `CLAUDE.md`.** Uma extensão escrita pelo
mesmo caminho único e ancorada pelo mesmo mecanismo das demais, que ensina o
agente a acionar os dois ecossistemas instalados pela fatia 1h em vez de o
`common-rules` escolher entre eles. `AGENTS.md` fica de fora até a fatia 1d
abrir a detecção de outros backends, e entrará como ponteiro mínimo para o
`CLAUDE.md`, sem duplicar conteúdo.

**Fatia D — hidratação sob demanda, adiada.** Volta quando uma segunda IDE entrar no escopo, e não antes. A medição da conversa mostrou que o Claude Code já entrega o comportamento por conta própria.

## Regras de negócio

- Todo artefato de extensão é escrito por um único caminho, a CLI. A skill de fachada captura intenção e aciona o comando; ela não grava arquivo nem registro.
- Divergência entre o arquivo e o checksum registrado produz recusa anunciada, que nomeia o arquivo e não aplica a extensão. Não há recuo silencioso.
- O reparo move o arquivo divergente para quarentena. Nunca apaga.
- O `doctor` não altera o sistema de arquivos sob nenhuma condição.
- Artefato escrito pelo `setup` não aceita a categoria `new`; aceita apenas `override` ou `extension`, e a tentativa de `new` é recusada com o motivo.
- Artefato customizado em conflito de nome gera anúncio e escolha entre pular e substituir, sem escolha padrão silenciosa.
- O escopo de propriedade é o que o próprio `setup` escreve: os sete hooks e seu registro. Artefato de dependência não é sobrescrito localmente.

## Critérios de aceitação

```gherkin
Scenario: extensão criada pelo caminho único permanece após reinstalação
  Given uma extensão criada pelo comando da CLI, com checksum registrado
  When o setup roda de novo sobre o mesmo projeto
  Then a extensão continua aplicada
  And o registro segue reconhecendo seu checksum

Scenario: arquivo alterado à mão é recusado em voz alta
  Given um artefato de extensão editado fora da CLI
  When o doctor examina o projeto
  Then ele nomeia o arquivo divergente
  And sai com código diferente de zero
  And nada no sistema de arquivos é alterado

Scenario: o reparo preserva o que substitui
  Given um artefato divergente apontado pelo doctor
  When o comando de reparo é executado
  Then o arquivo divergente existe na quarentena
  And o artefato original volta ao lugar
  And nenhum arquivo foi apagado

Scenario: artefato do setup não aceita categoria new
  Given um dos sete hooks que o setup escreve
  When alguém pede sua criação como new
  Then o comando recusa
  And explica que apenas override ou extension se aplicam a artefato gerenciado
```

## Qualidades e operação

- **Reversibilidade**: nenhuma operação desta entrega destrói conteúdo. Quarentena em vez de exclusão, sempre.
- **Detectabilidade**: a garantia do caminho único não é impedir que alguém escreva o arquivo, e sim que qualquer escrita fora dele apareça. Requisito e teste devem enunciar isso, e não "impede injeção de prompt".
- **Separação de responsabilidade**: diagnosticar e reparar são comandos distintos, para que a pessoa nunca perca dados ao pedir um diagnóstico.

## Dependências

- Phase 1 concluída, incluindo as fatias 1c, 1d e 1e, ainda abertas.
- SPEC-0004 entregue, já que o servidor MCP e a CLI compartilham a lógica que esta entrega estende.
- Um inventário de propriedade por dependência. O `framework` já publica o seu em `.project-context/skills-lock.json`; falta confirmar se `context-mode` e `code-review-graph` publicam equivalente.

## Situações de erro

- Checksum ausente para arquivo presente no diretório de extensões → tratar como divergente e recusar, sem apagar.
- Quarentena não gravável → recusar o reparo inteiro em vez de reparar pela metade.
- Conflito de nome com artefato de dependência → recusar, apontando que o caminho é a montante.
- Registro de checksum corrompido → recusar e pedir reexecução do `setup`, sem reconstruir por inferência.

## Escopo

**Incluído**: camada de orquestração em `CLAUDE.md`, escrita pelo caminho único e ancorada como qualquer extensão; diretório de extensões locais no repositório consumidor; comando de criação com categorias `override`, `extension` e `new`; registro de checksum; skill de fachada que só aciona a CLI; `doctor` somente-leitura ampliado para relatar divergência; comando de reparo com quarentena.

**Fora de escopo**: `AGENTS.md`, que espera a fatia 1d; instalar os conjuntos de skills, que é da fatia 1h; instalar dependências no ambiente global, em qualquer forma; `doctor` que reverte, apaga ou muta; recuo silencioso diante de divergência; hidratação sob demanda, adiada até a entrada de uma segunda IDE; override de skills do `framework` ou de qualquer artefato de dependência; alvos de editor além do Claude Code, que pertencem à Phase 1.

## Dúvidas, decisões e riscos

**Decisões tomadas nesta rodada**

- **D1**: A hidratação sob demanda sai do caminho agora e volta amarrada à entrada de outra IDE. *Razão*: a medição mostrou o corpo das vinte SKILL.md em 137 KB contra 8 KB de frontmatter sempre ativo, ou seja, 17x de economia que a plataforma já entrega. O que resta de estático são cerca de 12 KB de `PROJECT.md`, `RULES.md` e `STACK.md`, que pertencem ao `framework`. O valor sobrevive apenas em IDEs que carregam arquivos de regra inteiros, e essas estão fora do escopo decidido.
- **D2**: Telemetria por `trace_id` não entra aqui. É pequena e aditiva, e vira fatia da Phase 1 junto do registro auditável que a fatia 1b já grava. O restante forma este épico de Phase 2.
- **D3**: A regra de resolução da SPEC-0002 não muda: preferir a cópia local, aceitar a global quando não houver local, nunca instalar globalmente. *Razão*: preferir a global faz o comportamento depender da máquina, que é justamente o que o `doctor` existe para tornar visível. Conformidade de versão não torna as duas ordens equivalentes, porque a global pode bater hoje e derivar amanhã sem que nada no projeto registre isso.
- **D5**: A camada de orquestração em `CLAUDE.md` pertence a este épico, e não à fatia 1h. *Razão*: é o roteador do sistema de override, da mesma família de âncoras e extensões desta entrega; colocá-la na fatia de instalação duplicaria mecanismo. Instalar os dois ecossistemas e registrar já tem valor de ponta a ponta sozinho. *Nota*: esta fatia escapou do refinamento inicial do ADR 001, onde constava como roteador de uma linha, e voltou por uma diretiva posterior.
- **D4**: O sistema de extensões cobre apenas os artefatos que o próprio `setup` escreve — os sete hooks e seu registro. *Razão*: estender a skills do `framework` violaria a imutabilidade do upstream e criaria um fork do motor de skills; escopo aberto a qualquer dependência não tem fronteira definida.

**Decisões tomadas em 2026-09-02, ao desbloquear o épico com a Phase 1 fechada**

- **D6**: A âncora de injeção é comentário HTML, no mesmo padrão que o former project tool já usa e comprova neste repositório (`<!-- former-tool:context:start/end -->`) — `<!-- common-rules:extension:<nome>:start/end -->`, e o equivalente para `override`. *Razão*: consistência com um mecanismo que já funciona no próprio projeto, em vez de inventar um segundo formato de âncora para o mesmo problema.
- **D7**: A quarentena vive em `.common-rules/quarantine/`, sem política de expiração automática. *Razão*: consistente com onde `install.json`/`approved-commands.json` (`SPEC-0005`, `SPEC-0010`) já vivem; expirar implicaria apagar, o que contradiz a regra já fixada de "quarentena em vez de exclusão, sempre". Mesmo padrão de não inventar prazo sem pedido real que `SPEC-0009` (D2) e `SPEC-0010` (`DEC-070`) já aplicaram.
- **D8**: A fatia C (camada de orquestração em `CLAUDE.md`/`AGENTS.md`) entra nesta especificação junto com A e B, não fica mais adiada. *Razão*: o gatilho nomeado no diagnóstico anterior era especificamente a fatia 1d (`AGENTS.md` "fica de fora até a fatia 1d abrir a detecção de outros backends") — `SPEC-0008` já entregou isso, e a Phase 1 inteira fechou. O diagnóstico de "fatia C adiada" datava de antes da fatia 1d existir e ficou desatualizado.

**Riscos resolvidos em 2026-09-02**

- ~~O formato das âncoras de injeção ainda não foi decidido~~ — resolvido por D6.
- ~~Quarentena sem política de expiração acumula lixo indefinidamente~~ — aceito deliberadamente por D7; limpeza manual fica com quem usa, não com o sistema.
- ~~Sem inventário de propriedade por dependência, a proteção de `new` vira lista chumbada~~ — sem efeito prático: D4 já restringe o sistema de extensões aos artefatos que o próprio `setup` escreve, nunca a artefato de dependência, então não há inventário de terceiro a confirmar.

## Pronto para desenvolvimento

Diagnóstico atualizado em 2026-09-02: a Phase 1 fechou por completo (`SPEC-0001` a `SPEC-0010`, fatias 1a a 1i concluídas). O brief é suficiente para especificar as fatias A, B e C juntas — nenhuma decisão bloqueante restante. A fatia D (hidratação sob demanda) segue adiada por D1, sem gatilho novo.

## Próximo passo

As fatias A, B e C foram entregues por completo em `SPEC-0011`
(`specs/completed/0011-extensoes-locais-reparo-assistido/spec.md`, `Complete`
em 2026-09-03): `common-rules extension create`/`extension repair`, checksum
por âncora HTML, quarentena sem expiração em `.common-rules/quarantine/`, e o
roteador em `CLAUDE.md`/ponteiro em `AGENTS.md`, todos verificados de ponta a
ponta com `dist/cli.js` real, não só em fixture de teste. A fatia D
(hidratação sob demanda) segue deliberadamente adiada por D1, sem gatilho
novo — este épico não tem próximo passo pendente até que uma segunda IDE
entre no escopo.
