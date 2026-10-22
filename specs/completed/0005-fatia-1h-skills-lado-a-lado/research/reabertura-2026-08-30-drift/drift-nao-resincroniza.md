# `runSetup` não resincroniza skills/framework quando os hooks já batem

Data: 2026-08-30. Reprodução real, `dist/cli.js setup`, sem fixture.

## Passos

```bash
echo '{"approved":true}' | node dist/cli.js setup   # 1ª execução, projeto novo
rm -rf .claude/skills                                # apaga skills manualmente
echo '{"approved":true}' | node dist/cli.js setup   # 2ª execução
```

## Resultado

- 1ª execução: `.claude/skills/` com 57 entradas (37 mattpocock + 20 framework).
- Depois de `rm -rf .claude/skills`: 0 entradas.
- 2ª execução: relata `já estava configurado: 7 hooks inalterados em .claude/settings.json`, código de saída 0. `.claude/skills/` continua com 0 entradas — não restaurado.

## Causa raiz

`runSetup` (`src/setup/run.ts`) calcula `jaFeito` via `matches()` (`src/setup/record.ts`), que compara **somente** o conjunto de nomes de hooks e a versão do pacote contra o registro anterior. Quando bate, a função devolve cedo — antes do bloco que chama `installSkills`/`installformer project tool`, antes até da consulta de aprovação. O bloco de skills/framework nunca é alcançado numa segunda execução onde os hooks já batem, independentemente do que exista de fato em `.claude/skills/` ou `.project-context/`.

## Consequência para o plano

`jaFeito` precisa também verificar, de forma barata (sem subprocesso), que o conteúdo de skills e do framework former project tool previamente instalado ainda está presente no disco. Ausência de qualquer um deles invalida o curto-circuito, and a execução segue para a aprovação e para os instaladores reais — que já são idempotentes por si (instalar de novo o que já está lá não duplica nem falha).
