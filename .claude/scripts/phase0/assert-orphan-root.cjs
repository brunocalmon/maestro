// Guarda o risco de a v0.2.8 continuar alcançável a partir da linha nova.
const { git, refExists, assert, WORK_BRANCH, MAIN_BRANCH } = require("./lib.cjs");

assert("assert-orphan-root", [
  // TRACEABILITY: US-001 FR-002 AC-002
  [`branch ${WORK_BRANCH} existe`, () =>
    refExists(WORK_BRANCH) || `referência ${WORK_BRANCH} não encontrada`],

  // A invariante é haver uma única raiz sem pai, não um único commit: a branch
  // cresce legitimamente depois de T011, e contar commits reprovaria cada commit
  // novo como se fosse violação.
  // TRACEABILITY: US-001 FR-002 AC-002
  ["o histórico tem exatamente uma raiz", () => {
    if (!refExists(WORK_BRANCH)) return "referência ausente";
    const roots = git(["rev-list", "--max-parents=0", WORK_BRANCH]);
    if (roots === null) return "não foi possível listar as raízes";
    const n = roots.split("\n").filter(Boolean).length;
    return n === 1 || `encontradas ${n} raízes`;
  }],

  // TRACEABILITY: US-001 FR-002 AC-002
  ["a raiz não tem pai", () => {
    if (!refExists(WORK_BRANCH)) return "referência ausente";
    const root = git(["rev-list", "--max-parents=0", WORK_BRANCH]);
    if (!root) return "raiz não encontrada";
    const line = git(["rev-list", "--parents", "-n", "1", root.split("\n")[0]]);
    if (line === null) return "não foi possível ler a raiz";
    const parents = line.split(/\s+/).length - 1;
    return parents === 0 || `a raiz declara ${parents} pai(s)`;
  }],

  // TRACEABILITY: US-001 FR-002 AC-002
  [`sem ancestral comum com ${MAIN_BRANCH}`, () => {
    if (!refExists(WORK_BRANCH) || !refExists(MAIN_BRANCH)) return "referência ausente";
    // merge-base sai diferente de zero quando não há ancestral: é exatamente o que queremos.
    const base = git(["merge-base", WORK_BRANCH, MAIN_BRANCH]);
    return base === null || `ancestral comum encontrado: ${base}`;
  }],
]);
