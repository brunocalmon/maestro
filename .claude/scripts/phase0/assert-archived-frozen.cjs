// Guarda o risco de apagar a v0.2.8 sem cópia íntegra.
// Precisa alcançar GREEN antes de qualquer remoção começar (T008 é barreira).
const { refExists, sha, filesIn, readState, assert, ARCHIVED_BRANCH, MAIN_BRANCH } = require("./lib.cjs");

assert("assert-archived-frozen", [
  // TRACEABILITY: US-002 FR-001 AC-001
  [`branch ${ARCHIVED_BRANCH} existe`, () =>
    refExists(ARCHIVED_BRANCH) || `referência ${ARCHIVED_BRANCH} não encontrada`],

  // TRACEABILITY: US-002 FR-001 AC-001
  [`${ARCHIVED_BRANCH} publicada no remoto`, () => {
    const remote = sha(`refs/remotes/origin/${ARCHIVED_BRANCH}`);
    return remote !== null || `origin/${ARCHIVED_BRANCH} não encontrada`;
  }],

  // TRACEABILITY: US-002 FR-001 NFR-002 AC-001
  [`árvore de ${ARCHIVED_BRANCH} idêntica à de ${MAIN_BRANCH}`, () => {
    if (!refExists(ARCHIVED_BRANCH) || !refExists(MAIN_BRANCH)) return "referência ausente";
    const a = filesIn(ARCHIVED_BRANCH), m = filesIn(MAIN_BRANCH);
    if (a === null || m === null) return "não foi possível listar as árvores";
    const only = (x, y) => x.filter((f) => !y.includes(f));
    const missing = only(m, a), extra = only(a, m);
    if (missing.length || extra.length)
      return `${missing.length} caminho(s) ausente(s), ${extra.length} excedente(s)`;
    return true;
  }],

  // TRACEABILITY: US-002 NFR-002 AC-008
  [`v0.2.8 recuperável a partir de ${ARCHIVED_BRANCH}`, () => {
    if (!refExists(ARCHIVED_BRANCH)) return "referência ausente";
    const tracked = filesIn(ARCHIVED_BRANCH, ["pyproject.toml", "src", "specs"]);
    if (tracked === null || !tracked.length) return "árvore vazia";
    const need = ["pyproject.toml", "src/common_rules_server/mcp_server.py"];
    const absent = need.filter((f) => !tracked.includes(f));
    return absent.length ? `ausente(s): ${absent.join(", ")}` : true;
  }],

  // TRACEABILITY: US-002 NFR-003 AC-005
  [`${ARCHIVED_BRANCH} mantém o SHA congelado`, () => {
    const state = readState();
    if (!state || !state.archivedSha) return "baseline ainda não registrada (esperado antes de T008)";
    const current = sha(ARCHIVED_BRANCH);
    return current === state.archivedSha || `SHA divergente: ${current} ≠ ${state.archivedSha}`;
  }],
]);
