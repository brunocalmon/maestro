// Guarda o risco mais grave da fase: a sequência destrutiva escrever na linha
// que deveria permanecer intocada. Sem esta asserção, uma escrita acidental em
// main ou archived passaria despercebida até que fosse tarde para desfazer.
// A baseline tem dois momentos distintos, e confundi-los produz falso positivo.
// `archivedSha` e `originMainSha` são gravados no congelamento (T008), porque é
// aí que essas referências param de se mover. `mainSha` é gravado no início da
// sequência destrutiva (T009): entre o congelamento e o início da sequência a
// main ainda recebe legitimamente o commit de evidência do próprio T008.
const { git, sha, readState, assert, MAIN_BRANCH, ARCHIVED_BRANCH, STATE_FILE } = require("./lib.cjs");

const compare = (branch, key) => () => {
  const state = readState();
  if (!state) return `baseline não registrada em ${STATE_FILE}`;
  const expected = state[key];
  if (!expected) return `baseline não contém ${key}`;
  const current = sha(branch);
  if (current === null) return `referência ${branch} não encontrada`;
  return current === expected || `${branch} mudou: ${current} ≠ ${expected}`;
};

assert("assert-baseline-untouched", [
  // TRACEABILITY: US-001 US-002 NFR-002 AC-007
  ["a baseline foi registrada no congelamento", () =>
    readState() !== null || `${STATE_FILE} ausente ou ilegível`],

  // TRACEABILITY: US-002 FR-001 NFR-002 AC-007
  [`${MAIN_BRANCH} mantém o SHA da baseline`, compare(MAIN_BRANCH, "mainSha")],

  // TRACEABILITY: US-002 FR-001 NFR-002 AC-007
  [`${ARCHIVED_BRANCH} mantém o SHA da baseline`, compare(ARCHIVED_BRANCH, "archivedSha")],

  // A referência remota tem baseline própria. Compará-la com a da main local
  // testaria se local e remoto coincidem — propriedade que nunca foi requisito
  // e que diverge legitimamente quando há commit local ainda não publicado.
  // TRACEABILITY: US-002 FR-001 NFR-002 AC-007
  [`origin/${MAIN_BRANCH} mantém o SHA da baseline`, compare(`refs/remotes/origin/${MAIN_BRANCH}`, "originMainSha")],

  // TRACEABILITY: US-002 NFR-003 AC-007
  [`${ARCHIVED_BRANCH} não recebeu commit posterior`, () => {
    const state = readState();
    if (!state || !state.archivedSha) return "baseline não registrada";
    const descendants = git(["rev-list", "--count", `${state.archivedSha}..${ARCHIVED_BRANCH}`]);
    if (descendants === null) return `não foi possível inspecionar ${ARCHIVED_BRANCH}`;
    return descendants === "0" || `${descendants} commit(s) além da baseline`;
  }],
]);
