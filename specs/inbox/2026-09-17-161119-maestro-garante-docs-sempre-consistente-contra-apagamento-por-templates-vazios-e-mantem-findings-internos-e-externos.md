# Inbox: Maestro garante docs sempre consistente contra apagamento por templates vazios e mantém findings internos e externos

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-09-17T14:11:19Z |
| Slug | maestro-garante-docs-sempre-consistente-contra-apagamento-por-templates-vazios-e-mantem-findings-internos-e-externos |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `cdc75842ef4fc047214ab7fb7325d97416fdeb882a74a995689fb055e0a0c33a` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

o specsfy cria o docs, e lembro que por algum motivo ele fica apagando tudo que tenho ali com templates vazios, não sei se isso é bug ou quê, mas eu quero que o maestro resolva isso e garanta que o ./docs esteja sempre consistente e atualizado sem permitir que algum bug (se for bug) do specsfy ou matt_pocock estrague isso, se for bug, documente isso como findings, eu quero findings internos para relativos ao maestro e externo par arelativos a dependencia externas, que dependerão de um PR upstream no repositorio alvo, sempre que algo for achado deve ser doucmentado e mantido, e quando identificado o fix, removido, ou arquivado em archived dentro de fidings.

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** O maestro deve garantir que ./docs fique sempre consistente e atualizado, impedindo que um bug do Specsfy ou do matt-pocock apague conteúdo real com templates vazios, e manter um registro de findings separados em internos (maestro) e externos (dependências, resolvidos por PR upstream), removidos ou arquivados quando corrigidos.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Observado hoje (2026-09-17): o script mecânico build_documentation.mjs do specsfy-documentator substitui o conteúdo real de docs/*.md e .specsfy/PACKAGES.md por um esqueleto em português (858 inserções / 787 remoções num único --project .), e o --check acusa docs desatualizado por comparação com o esqueleto, não com o código; o mesmo achado já está registrado como R-001 da SPEC-0021. Não existe hoje no maestro um lugar para registrar, manter e arquivar findings sobre o próprio maestro nem sobre dependências externas.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** O mantenedor do maestro e qualquer projeto consumidor que use o specsfy-documentator ou skills do matt-pocock que editam docs/README.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** docs/ nunca perde conteúdo humano ou gerado válido; cada bug conhecido (interno ou de dependência) fica documentado com evidência, status e destino (fix no maestro ou PR upstream) e é removido ou arquivado em findings/archived quando resolvido.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Declaração: o maestro deve resolver e garantir docs consistente e atualizado, sem permitir que bug do specsfy ou do matt_pocock estrague. Declaração: se for bug, documentar como finding. Declaração: findings internos (maestro) e externos (dependências externas, dependem de PR upstream no repositório alvo). Declaração: todo achado deve ser documentado e mantido; quando identificado o fix, removido ou arquivado em archived dentro de findings. Inferência: relação direta com BACKLOG-0010/SPEC-0021 (governança de docs/README pelo maestro) e com o doctor da BACKLOG-0013 (checagem read-only); evidência concreta de hoje: reversão manual via git checkout após o build_documentation.mjs.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Sinal: registro de findings com id, escopo (internal|external), dependência/repositório alvo, evidência, status (open|fixed|archived), link para PR upstream quando houver; local candidato: findings/ na raiz com findings/archived/.

### Riscos e dependências

**Análise preliminar:** Risco: o documentator do Specsfy é upstream (pacote @promovaweb/specsfy); a correção definitiva depende de PR lá — o maestro só pode proteger (backup/quarentena/recusa de sobrescrita de conteúdo não vazio) e documentar. Dependência: SPEC-0021 já em Planned trata parte do problema (README, idioma, doctor de docs). Conflito potencial: duplicar governança de docs em duas specs.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Refinar junto de BACKLOG-0010/SPEC-0021 ou como item novo: proteção de docs/ (nunca substituir arquivo não vazio por esqueleto; quarentena e diff antes de sobrescrever), verificação no doctor, e um subsistema de findings (internos/externos, archived) mantido pelo maestro com o finding externo do build_documentation.mjs como primeiro registro.

## Pontos a revisar no futuro

**A revisar:** Confirmar se o apagamento vem do build_documentation.mjs (esqueleto) ou de outra skill; se a SPEC-0021 já cobre a proteção ou só o README/idioma; formato e local do registro de findings; se findings externos devem gerar automaticamente um rascunho de PR upstream.

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$specsfy-02-backlog`.
