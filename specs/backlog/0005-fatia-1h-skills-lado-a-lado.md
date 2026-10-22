# Backlog: Fatia 1h: instalar framework e mattpocock lado a lado, com registro

| Metainformação | Valor |
| --- | --- |
| ID | BACKLOG-0005 |
| Status | Promoted |
| Produto | common-rules |
| Épico | Phase 1 — MVP TypeScript com subsistemas |
| Funcionalidade | Instalação e registro dos dois ecossistemas de skills |
| Tipo | história |
| Prioridade | Fatia 1h da Phase 1; independe de 1c, 1d e 1e |
| Milestones | |
| Criado em | 2026-08-29 |
| Spec promovida | `specs/draft/0005-fatia-1h-skills-lado-a-lado/spec.md` |

## Ideia original

Formulação da pessoa responsável: "quero as skills do mattpocock/skills como dependência do common-rules, instaladas pelo setup e disponíveis junto com o framework, o context-mode e o code-review-graph — descobri que o autor não publica no npm e o caminho oficial é o instalador skills da vercel-labs". E, ao dirigir o refinamento: "o objetivo é manter o funcionamento de ambas as framework e mattpocock na íntegra, com a instalação real, e o commonrules orquestra com extensão no CLAUDE.md e AGENTS.md, não escolher".

## Problema percebido

O setup resolve e liga três subsistemas, mas as skills de engenharia ficam de fora: quem as quer instala à mão, e o projeto não registra origem, referência nem presença. Não há como o doctor dizer o que está instalado nem se derivou.

## Pessoa afetada ou beneficiada

Quem usa o common-rules e espera que um único setup deixe o ambiente do agente completo; e quem mantém este repositório, que hoje instala essas skills manualmente.

## Resultado ou valor esperado

Um setup que instala os dois ecossistemas de verdade, íntegros e lado a lado, registrando origem e referência de cada um, de modo que o doctor consiga relatar o que existe e o que divergiu.

## Contexto

Deriva da captura specs/inbox/2026-08-29-155551. O common-rules não escolhe entre os ecossistemas: ambos ficam instalados. A camada de orquestração em CLAUDE.md é decisão separada e pertence ao épico de extensões da Phase 2.

## Referências relacionadas

| Caminho | Relação |
| --- | --- |
| `specs/inbox/2026-08-29-155551-skills-do-mattpocock-como-dependencia-instalada-pelo-setup.md` | origem |
| `specs/backlog/0003-phase-1-mvp-typescript-subsistemas.md` | épico que contém esta fatia |
| `specs/backlog/0004-phase-2-extensoes-locais-e-heal.md` | recebe a camada de orquestração em `CLAUDE.md`, que esta fatia não entrega |
| `specs/completed/0002-phase-1a-esqueleto-typescript/spec.md` | limita — DEC-002 descreve três camadas de dependência |
| `specs/completed/0003-fatia-1b-setup-hooks/spec.md` | limita — alvo fechado em Claude Code; o `setup` só escreve onde há evidência de uso e relata o que ignorou; `.common-rules/install.json` já é o registro |

## Comportamento esperado

O `setup` passa a instalar, além do que já faz, os dois conjuntos de skills. O
`framework` continua vindo pelo npm, como hoje. As skills de `mattpocock/skills`
vêm pelo instalador oficial `skills`, da vercel-labs, que grava em
`.claude/skills/` no escopo de projeto — o mesmo diretório onde o `framework` já
mantém seus vinte subdiretórios. Convivem como irmãos, e o Claude Code hidrata
os dois nativamente.

O common-rules não escolhe entre eles nem os mescla. Registra o que instalou, e
o `doctor` relata.

## Regras de negócio

- Os dois ecossistemas ficam instalados e íntegros. Nenhum é preterido, mesclado ou reescrito.
- A única origem aceita para as skills de Matt Pocock é o caminho oficial `npx skills@latest add mattpocock/skills`. O pacote `mattpocock-skills` do npm é publicação de terceiro e fica fora.
- O registro `.common-rules/install.json`, que a fatia 1b já grava, ganha entradas para os conjuntos instalados, com origem, referência instalada e hash do conteúdo.
- O `doctor` relata divergência entre o registrado e o presente. Não reverte, não apaga: reparo destrutivo continua rejeitado.
- Nada é instalado no ambiente global. A cópia fica dentro do projeto, conforme a regra vigente.
- O `setup` só escreve onde há evidência de uso do alvo, e relata o que ignorou, como já faz para os hooks.

## Critérios de aceitação

```gherkin
Scenario: os dois conjuntos convivem depois de um único setup
  Given um projeto com evidência de uso do alvo
  When o setup roda
  Then as skills do framework estão em .claude/skills/
  And as skills de mattpocock estão em .claude/skills/
  And nenhuma sobrescreveu a outra

Scenario: o registro sabe o que foi instalado
  Given o setup concluído
  When o registro de instalação é lido
  Then ele nomeia cada conjunto, sua origem e a referência instalada
  And traz o hash do conteúdo de cada um

Scenario: o doctor torna a deriva visível
  Given um conjunto de skills alterado depois da instalação
  When o doctor examina o projeto
  Then ele nomeia o conjunto divergente
  And sai com código diferente de zero
  And nada no sistema de arquivos é alterado

Scenario: origem não oficial é recusada
  Given um pedido de instalar as skills a partir do pacote npm de terceiro
  When o setup processa esse pedido
  Then ele recusa
  And nomeia o caminho oficial como única origem aceita
```

## Qualidades e operação

- **Rastreabilidade, não reprodutibilidade.** O instalador `skills` busca da ponta e não oferece lockfile, fixação de versão nem hash de commit. Esta fatia registra o que instalou e torna a deriva visível; ela não pode prometer que duas máquinas obtenham conteúdo idêntico. A limitação é assumida, e não uma dívida que o épico de checksum resolverá depois: checksum sobre arquivo que o mesmo processo escreve detecta divergência, não impede substituição.
- **Não destrutivo.** Nenhuma operação desta entrega apaga ou reverte conteúdo.

## Dependências

- Fatia 1b concluída, que fornece o `setup`, o registro e a detecção do alvo.
- Pacote `skills` da vercel-labs, hoje em 1.5.23, com os binários `skills` e `add-skill`.

## Situações de erro

- Instalador ausente ou falhando → relatar e seguir com o que der para fazer, sem afirmar sucesso do que não ocorreu.
- Conflito de nome entre um diretório do `framework` e um de `mattpocock` → recusar e nomear o conflito, em vez de sobrescrever.
- Rede indisponível → relatar que o conjunto não foi instalado, sem deixar instalação parcial passando por completa.

## Escopo

**Incluído**: instalação dos dois conjuntos pelo `setup`; entradas no registro com origem, referência e hash; relato de divergência pelo `doctor`; recusa de origem não oficial.

**Fora de escopo**: a camada de orquestração em `CLAUDE.md`, que pertence ao épico de extensões da Phase 2; `AGENTS.md`, que entra com a fatia 1d; mesclar, reescrever ou preterir qualquer um dos conjuntos; instalação global; qualquer reparo que apague ou reverta.

## Dúvidas, decisões e riscos

**Decisões tomadas nesta rodada**

- **D1**: Apenas `CLAUDE.md` é alvo da futura camada de orquestração; `AGENTS.md` entra com a fatia 1d. *Razão*: a SPEC-0003 fechou o alvo em Claude Code, e o `setup` só escreve onde há evidência de uso. Anunciar orquestração a agentes que não detectamos, e onde os sete hooks não existem, seria orquestração pela metade. Quando a 1d abrir a detecção de backends, `AGENTS.md` entra sob a mesma regra, na forma de ponteiro mínimo para o `CLAUDE.md`.
- **D2**: O conteúdo é registrado em `.common-rules/install.json`, com origem, referência e hash, e o `doctor` relata divergência. *Razão*: não é registro novo, é ampliação do que a fatia 1b já grava. Fixar só a versão do instalador não fixaria nada do que interessa, e deixar sem registro produziria deriva silenciosa, que é o modo de falha caro deste projeto. Duas fronteiras explícitas: torna a deriva visível, não a impede; e o `doctor` não reverte nem apaga.
- **D3**: A entrega é dividida. Instalar os dois ecossistemas e registrar tem valor de ponta a ponta sozinho e forma esta fatia da Phase 1. A camada de orquestração em `CLAUDE.md` é o roteador do sistema de override, mesma família de âncoras e extensões do BACKLOG-0004, e vai para lá sem duplicar mecanismo.
- **D4**: A origem oficial é `npx skills@latest add mattpocock/skills`. *Razão*: o autor não publica no npm; o `mattpocock-skills@1.3.0` do registro é publicado por um terceiro e não aparece no README oficial como caminho de instalação.

**Riscos**

- O conteúdo instalado pode mudar entre duas execuções sem que nada no projeto o declare. É a limitação assumida acima, e precisa aparecer no relato do `doctor` para não virar surpresa.
- Skills são instruções que entram no contexto do agente. Uma origem não fixada é superfície diferente da de código compilado, e vale registrar isso quando a spec tratar de segurança.
- O diretório `.claude/skills/` passa a ter dois donos. Sem inventário de propriedade, uma futura limpeza automática não saberá o que pertence a quem.

## Pronto para desenvolvimento

Diagnóstico: o brief é suficiente para especificar. Não é autorização de implementação.

Decisões que a especificação ainda precisa tomar: se o hash cobre arquivo a arquivo ou o conjunto; se o conjunto de Matt Pocock é instalado inteiro ou por seleção; e se `.claude/skills/` entra no `.gitignore` ou é versionado.

## Próximo passo

Especificar como fatia 1h da Phase 1. Independe de 1c, 1d e 1e, e pode vir antes ou depois da 1g.

## Reaberturas registradas

- **2026-08-30, primeira reabertura**: `common-rules setup` nunca instalava nada de verdade — nenhum `Executor` real existia em produção, e `src/cli.ts` nunca fornecia `opts.skills`/`opts.project-context` a `runSetup`. Corrigido com executores reais para `skills` e para `former tool install`, e uma segunda origem oficial (`removed-project-integration`) para as skills do próprio framework. Ver `specs/completed/0005-fatia-1h-skills-lado-a-lado/spec.md`, seção 13.
- **2026-08-30, segunda reabertura**: `runSetup` considera "já configurado" olhando só os hooks, então apagar `.claude/skills/` ou `.project-context/` manualmente e rodar `setup` de novo não restaura nada — reproduzido de verdade. Captura em `specs/inbox/2026-08-30-122232-setup-nao-resincroniza-skills-nem-framework-quando-hooks-ja-batem.md`.
