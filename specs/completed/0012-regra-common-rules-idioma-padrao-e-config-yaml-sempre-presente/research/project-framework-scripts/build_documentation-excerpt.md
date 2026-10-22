# Evidência: `build_documentation.mjs` embute prosa em português

- **Fonte**: `.agents/skills/framework-documentator/scripts/build_documentation.mjs` (pacote `removed-project-tool`, instalado localmente).
- **Consultado em**: 2026-09-03, via leitura direta do arquivo neste repositório.
- **Licença/termos**: pacote npm já instalado como dependência do projeto; trecho reproduzido apenas como evidência técnica, não como conteúdo redistribuído.

## Trecho relevante (linhas 105–124)

```js
"README.md": ["Documentação técnica", `## Visão geral\n\n- former project tools detectados: ${...}...`],
"architecture.md": ["Arquitetura", `## Componentes\n\n...`],
"application.md": ["Aplicação e implementações", `## Superfícies\n\n...`],
"database.md": ["Banco de dados", `## Fontes de persistência\n\n...`],
"testing.md": ["Testes", `## Resumo\n\n...`],
"frontend.md": ["Frontend e design system", `## Superfícies observadas\n\n...`],
...
if (!check && current !== expected) { await mkdir(dirname(path), { recursive: true }); await writeFile(path, expected); }
...
if (check && stale.length) { console.error(`Documentação desatualizada: ${stale.join(", ")}`); process.exitCode = 1; }
```

## Impacto para SPEC-0012

Os títulos e a prosa do bloco gerenciado (`<!-- maestro:inventory:start -->`...`end -->`) de cada arquivo em `docs/**/*.md` são strings fixas em português dentro do próprio gerador — não uma escolha de quem escreve o conteúdo. O modo `--check` compara `current !== expected` byte a byte e falha (`Documentação desatualizada`) se divergir. Como `framework-07-implement` chama `$framework-documentator` automaticamente após toda tarefa `[CODE]`, uma tradução manual desse bloco seria sobrescrita de volta para português na próxima implementação — confirma que a exceção de idioma (`language.exceptions`, FR-002) precisa cobrir `docs/**/*.md` (escopo do bloco gerenciado), além de `specs/**/spec.md`.
