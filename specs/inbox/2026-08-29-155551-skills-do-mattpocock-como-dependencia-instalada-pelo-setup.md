# Inbox: Skills do mattpocock como dependencia instalada pelo setup

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-08-29T13:55:51Z |
| Slug | skills-do-mattpocock-como-dependencia-instalada-pelo-setup |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `fe7a50016b737802608c466c35c940cd1ee66eec1b80c71ba50b6df58ce75206` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

quero as skills do mattpocock/skills como dependência do common-rules, instaladas pelo setup e disponíveis junto com o framework, o context-mode e o code-review-graph — descobri que o autor não publica no npm e o caminho oficial é o instalador skills da vercel-labs

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** As skills de mattpocock/skills passam a ser dependência do common-rules, instaladas pelo setup e disponíveis ao lado do framework, do context-mode e do code-review-graph, pelo instalador oficial da vercel-labs em vez de um pacote npm do autor, que não existe.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** As três dependências atuais são resolvidas e ligadas pelo setup, mas as skills de engenharia ficam de fora: quem quiser usá-las instala à mão, sem que o projeto registre versão, origem ou presença. Declaração da pessoa responsável: o autor não publica as skills no npm, e o caminho oficial é o instalador skills da vercel-labs.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Quem usa o common-rules e espera que um único setup deixe o ambiente do agente completo; e quem mantém este repositório, que hoje instala essas skills manualmente.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Um setup que entrega o conjunto inteiro de subsistemas, com as skills de engenharia disponíveis pelo mesmo comando que já liga os outros três, e com a origem registrada em vez de implícita.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Escopo citado: as skills de mattpocock/skills, o comando setup, e a paridade com framework, context-mode e code-review-graph. Caminho oficial nomeado pela pessoa: o instalador skills da vercel-labs. Verificado no registro npm durante a conversa: o pacote skills está em 1.5.23, vem de vercel-labs/skills, é mantido por rauchg e quuu, e expõe os binários skills e add-skill. O README de github.com/mattpocock/skills instrui npx skills@latest add mattpocock/skills, e o nome mattpocock-skills que ele cita é de plugin do Claude Code, não de pacote npm. Existe no npm um mattpocock-skills 1.3.0 publicado por aanhnguyen, que não é o autor e não aparece como caminho oficial no README.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** O sistema precisaria guardar qual conjunto de skills foi instalado, de que origem e em que versão ou revisão, para que o doctor possa relatar e para que duas máquinas não divirjam em silêncio. Nada foi decidido sobre onde esse registro vive nem se compartilha o arquivo que o setup já grava.

### Riscos e dependências

**Análise preliminar:** Fixar o instalador não fixa o conteúdo: skills add busca do GitHub no momento da instalação, e o projeto tem como regra central a conformidade de versão. Skills são instruções que entram no contexto do agente, o que faz de uma fonte não fixada uma superfície diferente da de código compilado. Existe republicação de terceiro no npm com nome plausível apontando o repositório original nos metadados. A regra vigente proíbe instalar no ambiente global, então a cópia precisa ficar dentro do projeto. Há interação com o épico de extensões e checksum do BACKLOG-0004, que resolveria justamente a fixação do conteúdo.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Pode virar fatia da Phase 1 ao lado da 1g, ou item ligado ao BACKLOG-0004, já que o problema de fixar conteúdo baixado é o mesmo que o checksum daquele épico endereça. Também pode ser tratada como quarta camada de dependência na DEC-002 da SPEC-0002, distinta das três atuais por não ser pacote publicado pelo autor.

## Pontos a revisar no futuro

**A revisar:** Se o instalador entra como dependência fixada ou se as skills são apenas detectadas, como os backends de agente da fatia 1d. Como fixar o conteúdo, dado que fixar o instalador não basta. Se a republicação de terceiro no npm é aceitável em alguma circunstância. Onde a cópia fica dentro do projeto e se entra no gitignore. Se o doctor passa a relatar esse conjunto. Se isso muda a DEC-002, que hoje descreve três camadas.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$framework-02-backlog`.
