# Inbox: Setup não resincroniza skills nem framework quando hooks já batem

| Metadado | Valor |
| --- | --- |
| Status | Tratada — corrigido diretamente em src/setup/run.ts |
| Capturada em | 2026-08-30T10:22:32Z |
| Slug | setup-nao-resincroniza-skills-nem-framework-quando-hooks-ja-batem |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Sessão de reabertura da SPEC-0005/SPEC-0007, 2026-08-30. |
| Turno da conversa | Achado registrado no fechamento do Delivery Gate da reabertura da SPEC-0005 (tarefa T045), tratado agora a pedido explícito do usuário. |
| Integridade do original | SHA-256 `369a5b3622a9e7ac2a7da981a8b397d20aeff641783b3cd17b08cf42efe9eeac` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

Achado durante a verificação manual real da SPEC-0005 (2026-08-30): apagar .claude/skills/ manualmente e rodar common-rules setup de novo não restaura nada, porque runSetup sai cedo assim que os hooks já batem (matches() olha só nome e versão dos hooks), antes de sequer considerar skills ou o framework former project tool. Reproduzido de verdade: 57 skills instaladas, apagadas manualmente, segunda execução relata 'já estava configurado: 7 hooks inalterados' e mantém 0 skills em disco. Usuário pediu tratamento formal deste achado antes de continuar, com atualização de inbox, backlog e specs.

## Contexto consultado

src/setup/run.ts (jaFeito/matches), src/setup/record.ts (matches()), reprodução real em /tmp com dist/cli.js setup.

## Resumo processado

**Inferência:** runSetup considera 'já configurado' olhando só hooks (nome+versão), então apagar skills ou o framework former project tool manualmente e rodar setup de novo não os restaura — o setup relata sucesso sobre um estado que não corresponde ao disco.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** matches() em src/setup/record.ts só compara a lista de nomes de hooks e a versão do pacote contra o registro anterior. Quando bate, runSetup devolve cedo, antes do bloco que instala skills e framework — então esse bloco nunca roda numa segunda execução, mesmo que .claude/skills/ ou .project-context/ tenham sido apagados por fora.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Quem usa common-rules setup esperando que ele seja o comando canônico para reconciliar o projeto com o que deveria estar instalado, inclusive depois de uma limpeza acidental ou de um clone que não trouxe .claude/skills/ (gitignored).

### Resultado ou valor esperado

**Declaração ou inferência identificada:** setup volta a ser confiável como comando de reconciliação: rodá-lo de novo sempre deixa o projeto no estado esperado, não só na primeira vez.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Reprodução real: 1a execução instala 57 skills; rm -rf .claude/skills; 2a execução com a mesma aprovação relata 'já estava configurado' e mantém 0 skills. Nenhum AC existente cobre esse cenário — AC-029 (SPEC-0005) testa installSkills chamado direto duas vezes, nunca através de runSetup com hooks já batendo.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Nenhuma informação nova a guardar; usa o registro já existente (.common-rules/install.json) e o sistema de arquivos.

### Riscos e dependências

**Análise preliminar:** Custo de sempre reconsultar o disco a cada setup (verificação barata, sem subprocesso, então aceitável). Risco de over-engineering se o fix chamar os instaladores reais a cada execução em vez de só quando algo está ausente.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Redefinir 'já estava configurado' para exigir também que os conjuntos de skills e o framework former project tool previamente instalados ainda estejam presentes no disco, com verificação barata de arquivo, sem subprocesso, preservando o curto-circuito quando nada mudou de verdade.

## Pontos a revisar no futuro

**A revisar:** Confirmar com a pessoa responsável se a verificação de presença do framework former project tool deve ser .project-context/ existir, ou algo mais específico.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Nenhum — resolvido. Confirmado em `src/setup/run.ts`: `alreadyDone` agora exige
`hooksAlreadyDone && skillsAlreadyDone && frameworkAlreadyDone && !bridgePending`,
não apenas os hooks — exatamente a direção hipotetizada na captura
("Redefinir 'já estava configurado' para exigir também que os conjuntos de
skills e o framework former project tool previamente instalados ainda estejam presentes
no disco"). A pergunta em "Pontos a revisar no futuro" também está
respondida no código: a presença do former project tool é `existsSync(join(root,
".project-context"))`.
