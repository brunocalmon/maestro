// Guarda o risco de resíduo do produto antigo sobreviver na branch nova.
const { filesIn, refExists, assert, WORK_BRANCH, PRESERVED } = require("./lib.cjs");

const REMOVED = [
  "pyproject.toml", "uv.lock", ".python-version", ".coverage",
  "Dockerfile", ".dockerignore", "agent_bdd.feature", "skills-lock.json",
  "README.md", "AGENTS.md", "CLAUDE.md",
];
const REMOVED_DIRS = ["src", ".docs", "tools", ".github", ".pytest_cache", "dist"];

// Compara o commit raiz, e não HEAD. A branch cresce legitimamente depois da
// Phase 0, e medir HEAD faria cada arquivo novo do produto contar como resíduo
// da v0.2.8. A propriedade descrita por AC-004 pertence ao momento da redução.
const { git } = require("./lib.cjs");
const root = () => git(["rev-list", "--max-parents=0", WORK_BRANCH]);
const tree = () => {
  if (!refExists(WORK_BRANCH)) return null;
  const sha = root();
  return sha ? filesIn(sha.split("\n")[0]) : null;
};

assert("assert-no-legacy", [
  // TRACEABILITY: US-001 FR-004 AC-004
  [`branch ${WORK_BRANCH} existe`, () =>
    refExists(WORK_BRANCH) || `referência ${WORK_BRANCH} não encontrada`],

  // TRACEABILITY: US-001 FR-004 AC-004 AC-009
  ["cada caminho versionado está sob o conjunto preservado", () => {
    const files = tree();
    if (files === null) return "referência ausente";
    const outside = files.filter((f) => !PRESERVED.some((p) => f === p || f.startsWith(`${p}/`)));
    return outside.length
      ? `${outside.length} fora do conjunto, p.ex. ${outside.slice(0, 3).join(", ")}`
      : true;
  }],

  // TRACEABILITY: US-001 FR-004 AC-004
  ["nenhum arquivo Python versionado", () => {
    const files = tree();
    if (files === null) return "referência ausente";
    const py = files.filter((f) => f.endsWith(".py"));
    return py.length ? `${py.length} arquivo(s), p.ex. ${py.slice(0, 3).join(", ")}` : true;
  }],

  // TRACEABILITY: US-001 FR-004 AC-004
  ["nenhum diretório da v0.2.8 versionado", () => {
    const files = tree();
    if (files === null) return "referência ausente";
    const found = REMOVED_DIRS.filter((d) => files.some((f) => f.startsWith(`${d}/`)));
    return found.length ? `presente(s): ${found.join(", ")}` : true;
  }],

  // TRACEABILITY: US-001 FR-004 AC-004
  ["nenhum manifesto ou artefato nomeado da v0.2.8", () => {
    const files = tree();
    if (files === null) return "referência ausente";
    const found = REMOVED.filter((f) => files.includes(f));
    return found.length ? `presente(s): ${found.join(", ")}` : true;
  }],
]);
