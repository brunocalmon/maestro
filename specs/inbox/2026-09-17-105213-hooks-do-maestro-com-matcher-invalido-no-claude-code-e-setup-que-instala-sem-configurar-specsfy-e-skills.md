# Inbox: Hooks do maestro com matcher inválido no Claude Code e setup que instala sem configurar Specsfy e skills

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-17T08:52:13Z |
| Slug | hooks-do-maestro-com-matcher-invalido-no-claude-code-e-setup-que-instala-sem-configurar-specsfy-e-skills |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `27b4c0b5ca839cb24eae510b0363822920f47e51b6ec586bf551d442787427d7` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

Vou investigar sem alterar nada. Primeiro o estado do maestro e o que o setup dele registra.
O `maestro setup` instalou hooks, skills e blocos de contexto às 08:30, no repositorio ../dev-bootstrap, mas não parece ter executado as skills `specsfy-setup` nem `setup-matt-pocock-skills`. Vou verificar o que o maestro promete fazer com essas duas. (rodei elas agora manualmente, então não precisa nem ir lá verificar nada, não é mais a fonte de vedade e pode levar a falsas conclusões)

Zsh está expandindo os globs; vou usar `find`/`grep -r` sem padrões de shell.
Investigação concluída, nada alterado. Resposta em duas partes: o que você perguntou e um defeito real que apareceu no caminho.
1. `specsfy-setup` e `setup-matt-pocock-skills` não rodaram 
O `maestro setup` instala arquivos, não executa skills: <- mas deveria identificar se specsfy/matt_pocock estão instalados e instalar (em caso de isntalação inicial mal feita, e sempre instalar na primeira instalação) (ao rodar as skills, specsfy permite instalar em outros lugares, maestro SEMPRE instala apenas no projeto atual, nunca global)

* Para o Specsfy ele roda `specsfy install --project <raiz> --json` (maestro/src/specsfy/install.ts:16). Esse comando do CLI cria `.specsfy/Spec.md`, templates, `.agents/skills/specsfy-*` e os blocos em `AGENTS.md`/`CLAUDE.md` — exatamente o que existia aqui às 08:30. Ele não cria `PROJECT.md`, `STACK.md`, `RULES.md` etc., porque isso é trabalho do `$specsfy-setup`, que é uma skill conversacional (pergunta raiz, nível, roteiro adaptativo) — não existe como comando CLI, só um agente pode executá-la.
* `setup-matt-pocock-skills` é a mesma coisa: uma skill interativa entregue como arquivo em `.claude/skills/`, para você invocar depois.
* O critério de "setup completo" do próprio maestro é apenas `existe .maestro/install.json && existe .specsfy/` (resources/hooks/setup-check.md:28) — ele considera concluído no momento em que o framework está instalado, não configurado.

O que é discutível é a comunicação: o README gerado diz que o `maestro setup` "initializes Specsfy" (src/setup/readme.ts:43), e nenhum doc do maestro diz "depois rode `/specsfy-setup` e `/setup-matt-pocock-skills`". Não encontrei essa orientação em `README.md`, `docs/`, `PROJECT.md` ou `specs.md`. Isso é uma lacuna de documentação/onboarding, não um bug de execução.
2. Defeito real encontrado: os hooks do maestro nunca disparam no Claude Code
Em maestro/src/hooks/claude-code.ts:113 o maestro escreve `matcher: h.name` — ou seja, `"matcher": "guard-destructive"`, `"protect-authorship"`, `"setup-check"`. No Claude Code, `matcher` é um regex contra o nome da ferramenta (`Bash`, `Edit`, `Write`…), e para `SessionStart` contra `startup|resume|clear`. Nenhum desses nomes bate, então nenhum dos 8 hooks executa.
Consequência direta neste repo: o `git diff .claude/settings.json` mostra que o hook antigo `protect-authorship` — que tinha `"matcher": "Bash"` e funcionava — foi substituído pela versão do maestro com matcher inválido. A proteção contra `Co-Authored-By` (regra 8 do seu RULES.md) está desativada na prática desde 08:30 de hoje. Você pode confirmar com um `git commit` de teste contendo o trailer, ou notando que o aviso de "setup incompleto" do `setup-check` nunca apareceu no início desta sessão mesmo com `.specsfy/` ausente.

---
Analise a implementação atual, identifique gaps, possiveis conflitos e falhas arquiteturais /grill-me

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Relato de investigação em projeto consumidor (../dev-bootstrap): os hooks gerados pelo maestro usam matcher igual ao nome do hook e nunca disparam no Claude Code, e o maestro setup instala o Specsfy e as skills mas não garante nem orienta a execução de specsfy-setup e setup-matt-pocock-skills.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Dois problemas: (1) src/hooks/claude-code.ts:113 escreve matcher: h.name, mas o Claude Code casa matcher contra nome de ferramenta (Bash, Edit, Write) ou, em SessionStart, contra startup|resume|clear; nenhum dos 8 hooks executa, e o hook protect-authorship que funcionava com matcher Bash foi substituído por versão inválida, desativando a proteção contra Co-Authored-By. (2) O maestro setup considera setup completo quando existem .maestro/install.json e .specsfy/, sem verificar se specsfy-setup e setup-matt-pocock-skills foram executados; o README gerado diz que initializes Specsfy e nenhum doc orienta os passos seguintes.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Pessoas que rodam maestro setup em projetos consumidores (no relato, o repositório ../dev-bootstrap) e dependem dos hooks de proteção e do onboarding do Specsfy.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Hooks efetivamente ativos no Claude Code (guard-destructive, protect-authorship, setup-check); setup que detecta instalação inicial malfeita e garante que Specsfy e skills matt-pocock estejam instalados no projeto atual; orientação clara dos passos posteriores de configuração.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Declaração: maestro deveria identificar se specsfy e matt_pocock estão instalados e instalar, sempre na primeira instalação e também em caso de instalação inicial malfeita. Declaração: maestro SEMPRE instala apenas no projeto atual, nunca global, ao contrário das skills do specsfy que permitem outros destinos. Declaração: o ambiente ../dev-bootstrap já foi corrigido manualmente e não deve ser usado como fonte de verdade. Declaração: pedido de análise da implementação atual para identificar gaps, conflitos e falhas arquiteturais, com pedido explícito de grill-me. Arquivos citados: src/specsfy/install.ts:16, resources/hooks/setup-check.md:28, src/setup/readme.ts:43, src/hooks/claude-code.ts:113, .claude/settings.json, RULES.md regra 8. Inferência: o pedido combina correção de defeito (matcher) com mudança de escopo do setup (verificação e instalação idempotente).

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Sinal: .maestro/install.json é usado como registro do estado de instalação; talvez precise registrar também se specsfy-setup e setup-matt-pocock-skills foram executados ou o que foi verificado. Não identificado no texto original nenhum dado adicional a guardar.

### Riscos e dependências

**Análise preliminar:** Risco: o repositório ../dev-bootstrap foi alterado manualmente e pode induzir conclusões falsas se usado como evidência. Dependência: comportamento do matcher de hooks do Claude Code (regex contra nome da ferramenta e contra startup|resume|clear). Dependência: comando specsfy install e comando/skills de instalação das skills matt-pocock. Conflito potencial: o hook protect-authorship pré-existente em settings.json foi sobrescrito pelo maestro; regra de preservação de hooks de terceiros a revisar. Risco: mudar o critério de setup completo pode alterar o comportamento do hook setup-check.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Corrigir a geração de hooks para Claude Code com matcher por ferramenta ou evento em vez de nome do hook, com testes de regressão. Preservar ou mesclar hooks preexistentes em settings.json. Tornar maestro setup idempotente: detectar ausência ou instalação parcial de Specsfy e skills matt-pocock e reinstalar somente no projeto atual. Revisar o critério de setup completo em setup-check e a comunicação no README gerado e docs sobre executar /specsfy-setup e /setup-matt-pocock-skills. Análise arquitetural (grill-me) da implementação atual dos hooks e do setup antes de especificar.

## Pontos a revisar no futuro

**A revisar:** Como os demais adaptadores de hooks (outros targets além do Claude Code) geram matcher e se compartilham o defeito. Se a verificação de instalação deve executar as skills conversacionais automaticamente ou apenas detectar e orientar. Qual o comportamento esperado quando settings.json já contém um hook com o mesmo nome vindo de outra origem. Se o critério de setup completo deve passar a exigir PROJECT.md, STACK.md etc. Os caminhos de linha citados podem já estar defasados em relação ao código atual.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.
