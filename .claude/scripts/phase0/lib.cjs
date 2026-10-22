// Utilitários compartilhados pelas asserções da Phase 0.
// Não é um caso de teste: não carrega marcador TRACEABILITY.
const { execFileSync } = require("node:child_process");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const WORK_BRANCH = "refactor/v1-cli-first";
const ARCHIVED_BRANCH = "archived";
const MAIN_BRANCH = "main";
const PRESERVED = ["specs", ".claude", ".project-context", ".agents"];
// O estado de execução vive dentro de .git, nunca na árvore versionada.
// Se morasse em .claude/, a reindexação de T010 o incluiria no commit raiz e
// assert-preserved-set acusaria um arquivo inesperado ao comparar com a main.
const STATE_FILE = (() => {
  try {
    const dir = execFileSync("git", ["rev-parse", "--absolute-git-dir"], { encoding: "utf8" }).trim();
    return resolve(dir, "phase0-run-state.json");
  } catch {
    return resolve(__dirname, "run-state.json");
  }
})();

// Executa git e devolve stdout limpo, ou null quando o comando falha.
// Falha de git aqui é informação — "a referência não existe" —, não exceção.
function git(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch {
    return null;
  }
}

const refExists = (ref) => git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]) !== null;
const sha = (ref) => git(["rev-parse", `${ref}^{commit}`]);
const filesIn = (ref, paths = []) => {
  const out = git(["ls-tree", "-r", "--name-only", ref, "--", ...paths]);
  return out === null ? null : out.split("\n").filter(Boolean).sort();
};

function readState() {
  if (!existsSync(STATE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}

// Cada asserção declara suas condições e reporta todas as que falharam,
// para que uma execução diga o estado inteiro em vez de só a primeira quebra.
function assert(name, checks) {
  const failures = [];
  for (const [label, run] of checks) {
    let verdict;
    try {
      verdict = run();
    } catch (error) {
      verdict = `erro inesperado: ${error.message}`;
    }
    if (verdict !== true) failures.push(`  ✗ ${label} — ${verdict}`);
    else console.log(`  ✓ ${label}`);
  }
  if (failures.length) {
    console.error(`\nRED ${name}: ${failures.length} de ${checks.length} condições não satisfeitas`);
    failures.forEach((line) => console.error(line));
    process.exit(1);
  }
  console.log(`\nGREEN ${name}: ${checks.length} condições satisfeitas`);
}

module.exports = { git, refExists, sha, filesIn, readState, assert, WORK_BRANCH, ARCHIVED_BRANCH, MAIN_BRANCH, PRESERVED, STATE_FILE };
