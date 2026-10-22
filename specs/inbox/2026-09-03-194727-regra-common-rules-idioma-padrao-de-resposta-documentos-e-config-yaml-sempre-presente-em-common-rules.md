# Inbox: Regra common-rules: idioma padrão de resposta/documentos e config.yaml sempre presente em .common-rules/

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-03T17:47:27Z |
| Slug | regra-common-rules-idioma-padrao-de-resposta-documentos-e-config-yaml-sempre-presente-em-common-rules |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `76c94973e399103aa860b93e9bb6b473966972ef7732c327a2c1b1c8514e6c67` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

uma regra basica que eu quero criar, a nível de common-rules, ou seja, superior a qualquer dependencia como matt_pocock ou framework é:

sempre responda no idioma que o usuario conversar, porém a lingua base é inglês e todo documento gerado deve ser em inglês, independente do idioma da skill, rules, dependencias (framework/skills) a não ser que o usuario estritamente diga o contrario via configuração, essa configuração deve ser em .common-rules, toda configuração deve estar ali em um config.yaml.

gere para mim um schema base de configurações que podemos ter a principio, por exemplo, já começaremos com o idioma de persistencia (global), metadados do projeto, em uma lista com chave/valor ali pode ser por exemplo:
location:

* en_us

projeto:

* prog_lang: java
* package_manager: maven
* framework: springboot
* test_framework: junit_5
* documentation_style: wiki
* etc...


system:

* OS: 
   * Linux/Endeavour_OS:
      * ram 16G
      * valores cpu
      * valores gpu
      * baremetal: true
   * MacOS:
   * Windows:
   * alpine:
      * ram: 2G
      * valores do cpu
      * docker_container: true



Eu só inventei aqui, nenhuma configuração pode ser JAMAIS omitida nesse config.yaml, ou seja, SEMPRE devem existir valores aqui, sejam eles REAIS preenchidos com defaults quando possível, ou simplesmente vazios.

Esses valores devem sempre ser levados em consideração como regra máxima e vai ajudar o agent a se guiar no desenvolvimento do projeto, aqui o usuario vai definir os standards base, padrão de projeto, o que quer e o que não quer e o agent sempre vai ler, por exemplo, eu inventei ali uma sessão rascunho para system, isso significa que o agent vai saber onde roda o projeto, seja em produção, seja em desenvolvimento com a máquina do time de desenvolvimento e sempre dará suporte a TUDO ao criar scripts.

Mas isso foi uma ideia, seu trabalho agora n é implmentar isso mas planejar e me trazer um arquivo de configuração mais completo possível, um bom exemplo a ser usado pode ser o /home/bcalmon/Projects/dev-bootstrap/config.yaml, com isso acredito que algumas regras precisam ser adicionadas de forma correta.

O objetivo é ter um config.yaml minimo que ao rodar o setup ele vai ser criado as-is ali no .common-rules/ com os defaults e o resto tudo em branco pq n foi definido, com comentários explicitos dizendo que o usuario pode invocar o agent para completar com grilling esses campos.

Meu objetivo é instruir, via regra, independente de como o usuario estiver interagindo com o prompt, seja com skills, framework ou livremente, que o comon-rules garanta de identificar quando a conversa chegar num ponto onde um valor deveria ser incluso ali ou atualizado, ou recomendar que o usuario inicie o grilling para gerar o config.yaml.

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Criar uma regra de nível common-rules (acima de framework/mattpocock) fixando idioma de resposta (o da conversa) e de documentos gerados (inglês por padrão, salvo override via configuração), e um arquivo .common-rules/config.yaml sempre presente e completo (com defaults ou vazio) guiando o agente com metadados de idioma, projeto e sistema.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Não existe hoje um mecanismo de configuração no nível do próprio common-rules, acima de framework/skills, que fixe idioma-padrão e outros metadados-guia (stack do projeto, ambiente/sistema) de forma sempre presente e legível pelo agente — ele precisa redescobrir ou assumir contexto a cada interação.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** A pessoa responsável pelo projeto (usuário) e, por extensão, qualquer agente (Claude Code ou outro) que interaja com um projeto usando common-rules.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Um config.yaml sempre presente em .common-rules/, atualizado continuamente pelo agente conforme a conversa revela informação relevante, funcionando como fonte de verdade para idioma, stack e ambiente de execução — reduzindo redescoberta de contexto e garantindo suporte consistente (ex.: scripts que respeitam SO/hardware do time).

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Regra: idioma de resposta = idioma da conversa; idioma de documentos gerados = inglês por padrão, com override via configuração. Restrição dura: config.yaml nunca pode omitir chaves — sempre presentes, preenchidas com default real ou vazias. Mecanismo mencionado: 'grilling' (entrevista) para completar campos pendentes. Solução esboçada, não definitiva (o próprio usuário chamou de 'inventei'): schema com seções location (idioma de persistência global), projeto (prog_lang, package_manager, framework, test_framework, documentation_style etc.) e system (perfil de SO/hardware: Linux/EndeavourOS, MacOS, Windows, Alpine — RAM, CPU, GPU, baremetal vs. docker_container). Escopo: nível 'common-rules', superior a framework e a skills como mattpocock.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** O próprio config.yaml é dado persistente por natureza: idioma, metadados de projeto (linguagem, package manager, framework, test framework, estilo de documentação) e perfil de sistema/hardware (SO, RAM, CPU, GPU, baremetal vs. container) — precisam ser guardados, consultados a cada interação do agente, e atualizados quando a conversa revelar mudança ou novo dado.

### Riscos e dependências

**Análise preliminar:** Depende de decidir a relação com .project-context/STACK.md e .project-context/RULES.md já existentes, para não duplicar fonte de verdade. Depende do mecanismo de escrita idempotente em .common-rules/ que o setup do common-rules já usa (install.json, approved-commands.json, extensions.json). Risco de este novo arquivo virar uma segunda fonte de verdade conflitando com o que o former project tool já mantém, exigindo desenho cuidadoso de fronteira.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Poderia virar uma fatia/épico dentro do próprio common-rules (nível core, não framework) — pede refinamento de backlog antes de especificar. Poderia reaproveitar o padrão de artefato/checksum/caminho único de escrita já criado na SPEC-0011 (resources/, .common-rules/extensions.json) para este config.yaml, ou ser um mecanismo totalmente novo — decisão em aberto.

## Pontos a revisar no futuro

**A revisar:** Schema completo do config.yaml ainda não definido — pedido explícito do usuário é que o agente planeje isso depois, usando /home/bcalmon/Projects/dev-bootstrap/config.yaml como referência, sem implementar ainda. Mecanismo técnico exato de detecção de 'a conversa chegou a um ponto onde deveria atualizar o config.yaml' não especificado (hook? verificação no doctor? prompt injetado?). Relação/fronteira entre este config.yaml e .project-context/STACK.md/RULES.md não definida. Se o arquivo é versionado no git do projeto-alvo ou fica fora (gitignored) não foi dito. Precedência exata entre a regra de idioma do common-rules e o idioma que framework/skills eventualmente usem não foi detalhada além de 'superior a qualquer dependência'.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$framework-02-backlog`.
