# Inbox: ADR 001: harness extensivel com lazy-loading, shadow-dom e doctor com rollback

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-08-29T12:52:41Z |
| Slug | adr-001-harness-extensivel-com-lazy-loading-shadow-dom-e-doctor-com-rollback |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `68dfeaa1eb57c327199df3f7b49ff93799dd6b714dfa9a919c6291f6a5e2d9a1` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

Criei esse ADR com a ajuda no chat gemini e as skills do matt_pocock/skills. Não tome como verdade, mas leia tudo que foi feito o grilling por mais de 1h, e veja se é condizente e como casa e pode ser usado aqui

# ADR 001: Arquitetura e Plano de Execução do `common-rules-server` MVP

## 1. Contexto (O Problema)
O desenvolvimento de software impulsionado por agentes de IA locais (como Cursor, pi.dev, Windsurf) sofre com a explosão do consumo da janela de contexto e o risco constante de alucinações.
Atualmente, o LLM é sobrecarregado com regras de conduta estáticas e definições globais de como operar ferramentas (como `framework`, skills de engenharia, `context-mode`, etc.). Isso drena tokens e repassa ao LLM o peso cognitivo de rotear, mesclar e executar tarefas de infraestrutura.
Existe a necessidade de um wrapper orquestrador unificado (`common-rules-server`) que abstraia essa complexidade, garanta consistência absoluta de ambiente e inverta o controle: transferindo a execução para scripts determinísticos e limitando o agente estritamente a decisões cognitivas.

## 2. Decisões Arquiteturais (A Solução)

O `common-rules-server` deixa de ser um agrupador de regras e assume o papel de um CLI Harness Extensível e Auto-Configurado, operando sob as seguintes diretrizes:

### 2.1. Imutabilidade Estrita do Upstream
O wrapper encapsula ferramentas de terceiros sem violar suas fontes.
* **Dependências Intocáveis:** Ferramentas oficiais geridas (como o ecossistema `framework` e as Skills base) permanecem 100% imutáveis em seus diretórios originais.
* **Modelo "Immutable OS":** A atualização de qualquer dependência subjacente exige obrigatoriamente a atualização do próprio `common-rules-server`. Não existem rotas de fuga ou atalhos para atualizações parciais.
* **Enforcement via Doctor:** O comando `doctor` atuará bloqueando e revertendo (rollback) ativamente qualquer tentativa manual de adulteração nas versões travadas das dependências originais.

### 2.2. Inversão de Controle, Proxy e Lazy-Loading
As instruções estáticas saem dos prompts fixos (`CLAUDE.md` / `AGENTS.md`) e tornam-se voláteis.
* **Roteador One-Liner:** O contexto global mantém apenas uma instrução minimalista de Proxy/Router, proibindo ativamente o agente de ler as fontes originais completas sem necessidade.
* **Hidratação Sob Demanda:** As regras de uma skill ou ferramenta específica só são injetadas no contexto se o usuário invocá-las declarativamente, gerando otimização massiva de tokens.
* **Gatilhos Determinísticos e Fallback Pragmático:** O roteamento e a mescla das instruções de extensões ocorrem via scripts de pré-processamento acionados a cada prompt nas IDEs que suportam hooks nativos síncronos (Cursor, Claude, Antigravity, pi.dev). Para IDEs sem suporte nativo a eventos de pré-prompt, o sistema realiza um *fallback* degradando graciosamente: a regra é adicionada diretamente ao `CLAUDE.md` ou arquivo equivalente (transferindo a carga para o agente, aceitando o custo extra de tokens em prol da funcionalidade ininterrupta).

### 2.3. Shadow-DOM e Extensibilidade Segura (`.common-rules-server/`)
O repositório consumidor contará com o diretório `.common-rules-server/`, entregue vazio por padrão, atuando como um *shadow-dom* para extensões ou *hotfixes* locais.
* **Padrão Decorator (Mala Direta):** Extensões utilizam um sistema de âncoras (ex: `${{<Skill-Name.extension:start}}# Inbox: ADR 001: harness extensivel com lazy-loading, shadow-dom e doctor com rollback

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-08-29T12:52:41Z |
| Slug | adr-001-harness-extensivel-com-lazy-loading-shadow-dom-e-doctor-com-rollback |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `68dfeaa1eb57c327199df3f7b49ff93799dd6b714dfa9a919c6291f6a5e2d9a1` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

) para injetar overrides no build-time/setup sem tocar nos arquivos originais.
* **Criação Blindada via CLI:** A autoria humana ou do agente diretamente nos arquivos de extensão é expressamente proibida para evitar injeções de prompt furtivas. A interface de criação é exclusivamente mediada por uma skill dedicada (`common-rules-server-creator`), que atua como um *facade*, captura a intenção via *Grilling* e aciona os comandos nativos da CLI para gerar o documento estruturado.
* **Integridade Local baseada em Checksum:** A CLI mantém uma "memória" (um manifesto/lockfile gerado com *leafs* únicos locais) contendo o *checksum* exato do que foi gerado via comando.
* **Fallback Silencioso:** Se o `doctor` detectar que um arquivo no *shadow-dom* foi criado ou adulterado manualmente (divergindo do *checksum* em memória), a CLI o ignorará sumariamente, fazendo fallback para a regra original ou anulando a extensão, garantindo a consistência da sessão.

### 2.4. Permissões de Execução e Orquestração de Processos
A barreira entre a intenção do LLM e a mutação de estado local é delegada às capacidades nativas do agente hospedeiro.
* **Execução Direta:** As skills e o `common-rules-server-creator` operam executando comandos bash reais (ex: CLI do `framework` ou da própria `common-rules` CLI). O orquestrador (Cursor, Claude, etc.) lida naturalmente com essa execução.
* **Autorização Consolidada:** O comando universal de `setup` mapeará os comandos disponíveis das dependências e solicitará aprovação em lote (*whitelist* permanente) ou *on-demand*, unificando a governança de permissões na inicialização do projeto e eliminando o atrito repetitivo.

## 2.5. Telemetria e Observabilidade Tática
Para evitar que o wrapper torne-se um buraco negro de depuração, o sistema contará com uma rastreabilidade essencial.
* **Trace-ID:** Cada sessão e cada chamada de prompt será tagueada com um `trace_id` e reforçada por hooks que escutam os eventos da IDE.
* **Logs Ponta a Ponta:** Todo o fluxo interno de pré-processamento, *lazy-loading* e falhas de *checksum* gerará logs táticos.

## 3. Plano de Execução (MVP v1-cli-first)

### Épico 1: Fundações da CLI e Gerenciamento de Estado (O "Lock")
* **TICKET-1.1: Core do CLI e Roteamento Básico** - Criar a estrutura base da CLI (Node.js/TypeScript) do `common-rules-server`. Implementar o comando `version` e o *parser* básico de argumentos. (Bloqueia: 1.2, 2.1)
* **TICKET-1.2: Motor de Lock e Checksum Local** - Implementar a lógica de geração de *leafs* (hash único local) e a gravação/leitura do arquivo de manifesto/lockfile `.common-rules-server-lock.json` na raiz do projeto. (Bloqueia: 1.3, 3.1)
* **TICKET-1.3: O Comando `doctor` e Fallback Silencioso** - Construir o comando `common-rules-server doctor`. Ler a pasta `.common-rules-server/` e validar o conteúdo contra o lockfile. Emitir log de aviso e ignorar/excluir o arquivo infrator em caso de divergência. (Bloqueia: 2.2)

### Épico 2: Orquestração Upstream e o "Setup Universal"
* **TICKET-2.1: Comando `setup` com Imutabilidade Upstream** - Implementar o `setup` que orquestra a instalação das ferramentas upstream (`framework`, skills). Versões chumbadas no código da CLI, instaladas em diretórios padrão intocados. (Bloqueia: 2.2, 2.3)
* **TICKET-2.2: Integração do `doctor` no Ciclo Upstream** - Expandir o `doctor` para varrer diretórios oficiais. Reverter (rollback) mutações rodando o instalador da versão chumbada.
* **TICKET-2.3: Whitelisting Consolidado (Permissões de Execução)** - Mapear binários/comandos disponibilizados pelas dependências no `setup`. Solicitar aprovação em lote via prompt nativo para adicionar à *whitelist* permanente ou configurar sob demanda. (Bloqueia: Épico 4)

### Épico 3: Extensibilidade (Shadow-DOM) e a Skill de Criação
* **TICKET-3.1: Comando `create-extension` (CLI)** - Comando CLI que recebe parâmetros (nome, tipo, conteúdo) para formatar e gravar uma extensão no diretório `.common-rules-server/`, utilizando âncoras de "mala direta" e atualizando o *checksum* no lockfile. (Bloqueia: 3.2)
* **TICKET-3.2: Skill `common-rules-server-creator`** - Criar o prompt da skill (*facade*) no orquestrador. A skill entrevista o usuário sobre a nova regra e emite o comando `bash` `common-rules-server create-extension ...`. (Bloqueia: 3.3)
* **TICKET-3.3: Proxy Router Minimalista (`CLAUDE.md` / `AGENTS.md`)** - Criar instrução estática central (*one-liner*). Proibir leitura autônoma dos arquivos originais e ensinar LLM a acionar ferramentas declarativamente e expor a skill `common-rules-server-creator`. (Bloqueia: Épico 4)

### Épico 4: Gatilhos Determinísticos e Pré-Processamento
* **TICKET-4.1: Script de Pré-Processamento (Hook Base)** - Desenvolver o script síncrono acionado via eventos da IDE. Ler o `Shadow-DOM`, mesclar conteúdo nas âncoras originais e cuspir versão pré-compilada. Implementar a lógica de *fallback* para anexar a regra diretamente no contexto em IDEs que não suportam hooks de pré-prompt. (Bloqueia: 4.2)
* **TICKET-4.2: Mecanismo de Cache e Sincronização** - Otimizar script 4.1 consultando lockfile para só reconstruir a "mala direta" se houver alterações confirmadas. (Bloqueia: 5.1)

### Épico 5: Observabilidade Tática
* **TICKET-5.1: Injeção de `trace_id` e Logs Básicos** - Modificar o logger interno da CLI para anexar um `trace_id` em toda operação (desde a verificação do `doctor` até o pré-processamento).

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Um ADR externo propõe transformar o common-rules-server num harness de linha de comando extensível, com imutabilidade do upstream, carregamento de regras sob demanda, um diretório de extensões protegido por checksum, aprovação de permissões em lote e telemetria por trace_id, acompanhado de um plano em cinco épicos.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** O texto afirma que regras estáticas e definições globais de ferramentas drenam a janela de contexto e transferem ao modelo o peso de rotear, mesclar e executar tarefas de infraestrutura, elevando o risco de alucinação.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Declaração: quem desenvolve usando agentes locais citados como Cursor, pi.dev e Windsurf. Inferência: a pessoa responsável por este repositório, que hoje mantém as dependências manualmente.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Declaração: economia de tokens por hidratação sob demanda, consistência de ambiente garantida por versões travadas, e depuração possível por rastreabilidade ponta a ponta.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Escopo citado: comandos version, doctor, setup e create-extension. Diretório .common-rules-server/ como shadow-dom. Lockfile .common-rules-server-lock.json na raiz. Âncoras de injeção no formato indicado no texto. Skill common-rules-server-creator como fachada de autoria. Roteador de uma linha em CLAUDE.md ou AGENTS.md. Hooks síncronos de pré-prompt, com recuo para escrita direta no arquivo de contexto quando a IDE não os suportar. Aprovação de permissões em lote ou sob demanda. Trace-id por sessão e por chamada.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** O texto indica guardar: checksums do que a CLI gerou, versões travadas das dependências, a whitelist de comandos aprovados, o cache de pré-compilação da mescla, e logs correlacionados por trace_id. Não define retenção, escopo por projeto ou por máquina, nem o que acontece com esses dados ao desinstalar.

### Riscos e dependências

**Análise preliminar:** Declaração: o próprio texto aponta o risco do wrapper virar um buraco negro de depuração. Inferência: sobreposição com trabalho já concluído neste repositório nas SPEC-0002 e SPEC-0003; conflito entre instalar upstream e a regra já vigente de nunca instalar globalmente; doctor que reverte ou exclui arquivos é capacidade destrutiva que hoje não existe; o recuo silencioso contradiz o princípio de recusar em vez de adivinhar, adotado na SPEC-0004; checksum em arquivo gravável pelo mesmo agente detecta divergência mas não impede injeção; alvos de IDE além do Claude Code estão fora do escopo já decidido.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Possível reconciliação com o épico já existente em specs/backlog/0003, cujas fatias 1c, 1d e 1e continuam abertas. A hidratação sob demanda parece ser a ideia nova de maior valor e não tem correspondente no backlog atual. Telemetria por trace_id é aditiva e pequena. Extensões com checksum e doctor com rollback parecem fatias próprias, posteriores.

## Pontos a revisar no futuro

**A revisar:** Se o plano em cinco épicos substitui ou complementa o refatiamento já registrado. Se instalar upstream contradiz a decisão de preferir cópia local, aceitar global e nunca instalar globalmente. Qual o modelo de ameaça real do checksum, dado que o mesmo processo escreve o arquivo e o lockfile. Se o doctor pode apagar ou reverter arquivos da pessoa e sob qual autorização. Se recuo silencioso é aceitável num projeto que acabou de decidir que falha silenciosa é o modo de falha caro. Se o nome do diretório volta a ser .common-rules-server depois da decisão de sobrescrever o passado, e como isso interage com a renomeação pretendida para maestro. Quais IDEs entram, dado que o alvo decidido hoje é apenas o Claude Code.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$framework-02-backlog`.
