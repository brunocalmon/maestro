# Inbox: Graceful degradation: não instalar dependências externas, apenas detectar e usar

| Metadado | Valor |
| --- | --- |
| Status | Capturada |
| Capturada em | 2026-08-24T17:24:17Z |
| Slug | graceful-degradation-nao-instalar-dependencias-externas-apenas-detectar-e-usar |
| Origem | Input do usuário |
| Processamento | Análise inicial sem perguntas |
| Sessão de descoberta | Captura avulsa. |
| Turno da conversa | Não se aplica. |
| Integridade do original | SHA-256 `d2e4843696ed96ed08763e26547fb4c2889aece9d05dad10e0021265c7f72aec` |
| Backlog derivado | Nenhum |
| Spec derivada | Nenhuma |

## Texto original

no momento eu n tenho ollama instalado, commonrules n se importa comisso e não tenta isntalar, ele apenas espera que ollama e os modelos ja existem, ou que a cli externa claude, agy, cursor-agent, ou qualquer já existe instalada e se n tiver ele simplesmente não permite criar o agent e só permite o built-in ou o que estiver disponivel.

## Contexto consultado

Nenhuma fonte contextual consultada.

## Resumo processado

**Inferência:** Common-rules não tenta instalar ollama, modelos ou CLIs externas. Apenas detecta o que já existe e rejeita orquestração para backends indisponíveis, oferecendo apenas opções built-in ou disponíveis.

## Análise inicial

### Problema ou oportunidade

**Declaração ou inferência identificada:** Muitos projetos falham ao tentar instalar dependências globais. Oportunidade: common-rules assume que ambiente é pré-configurado, detecta o que está disponível, e oferece apenas opções viáveis ao usuário.

### Pessoas afetadas ou beneficiadas

**Declaração ou inferência identificada:** Desenvolvedores com ambientes heterogêneos; times que já têm ollama/agy/claude instalado; usuários que não querem instalação automática; CI/CD pipelines com restrições de pacotes.

### Resultado ou valor esperado

**Declaração ou inferência identificada:** Instalação simples sem side effects; usuário mantém controle total do seu ambiente; comum-rules funciona com o que está disponível; reduz debugging de instalação falha; workflow clear quando backend não está disponível.

### Sinais de escopo, regras ou solução

**Sinais extraídos, não decisões:** Detecção de disponibilidade (not installation); graceful degradation com opções visíveis; rejection clara de backends indisponíveis; recomendação de built-in como fallback; nenhuma tentativa de instalar globalmente.

### Informações que talvez precisem ser guardadas

**Sinais para conversar depois, não confirmação:** Matriz de detecção: como verificar disponibilidade de ollama (versão, serviço rodando), modelos installados (local storage), CLIs (which/type command), IDEs built-in (env vars); mensagens ao usuário quando backend unavailable.

### Riscos e dependências

**Análise preliminar:** Usuário tentar usar backend que não tem instalado sem avisar claro; detecção falsa negativa (CLI existe mas não funciona); quebra ao mudar de máquina com ambiente diferente; CI pipelines com subconjunto de backends.

## Possíveis direções futuras

**Hipóteses para backlog ou spec, não requisitos:** Fase 1: detecção de disponibilidade; Fase 2: rejection clara com fallback; Fase 3: recomendações de instalação manual (links, docs); Fase 4: health check de backends antes de delegação.

## Pontos a revisar no futuro

**A revisar:** Quando exatamente fazer detecção - setup time, query time, ou continuous monitoring? Como reportar ao usuário backends indisponíveis? Deve haver fallback automático para built-in ou pedir confirmação?

## Rastreabilidade

- Formulação original preservada integralmente nesta captura.
- Análises não substituem decisões do usuário.
- Backlogs e specs derivados devem referenciar este arquivo.

## Próximo passo

Manter em `specs/inbox/` ou refinar com `$framework-02-backlog`.
