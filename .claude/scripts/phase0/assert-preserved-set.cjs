// Guarda o risco de perder o registro de decisões ou o framework durante a limpeza.
//
// A comparação é entre duas referências imutáveis: o commit raiz da branch de
// trabalho e `archived`, que é a main no instante do congelamento. Comparar HEAD
// com a main compararia dois alvos móveis e passaria a acusar divergência a cada
// commit legítimo da branch nova — a propriedade descrita por AC-003 pertence ao
// momento da redução, não à vida inteira da branch.
const { git, filesIn, refExists, assert, WORK_BRANCH, ARCHIVED_BRANCH } = require("./lib.cjs");

const root = () => git(["rev-list", "--max-parents=0", WORK_BRANCH]);

// Compara um caminho preservado entre o commit raiz e o congelamento, arquivo a arquivo.
const identical = (path) => () => {
  if (!refExists(WORK_BRANCH) || !refExists(ARCHIVED_BRANCH)) return "referência ausente";
  const rootSha = root();
  if (!rootSha) return "commit raiz não encontrado";
  const work = filesIn(rootSha, [path]);
  const main = filesIn(ARCHIVED_BRANCH, [path]);
  if (main === null || !main.length) return `${path} não existe em ${ARCHIVED_BRANCH}`;
  if (work === null || !work.length) return `${path} ausente ou vazio no commit raiz`;
  const missing = main.filter((f) => !work.includes(f));
  const extra = work.filter((f) => !main.includes(f));
  if (missing.length) return `${missing.length} arquivo(s) perdido(s), p.ex. ${missing[0]}`;
  if (extra.length) return `${extra.length} arquivo(s) inesperado(s), p.ex. ${extra[0]}`;
  return true;
};

// Uma condição por caminho, para que a falha nomeie exatamente o que se perdeu.
assert("assert-preserved-set", [
  // TRACEABILITY: US-001 FR-003 AC-003
  [`branch ${WORK_BRANCH} existe`, () =>
    refExists(WORK_BRANCH) || `referência ${WORK_BRANCH} não encontrada`],

  // TRACEABILITY: US-001 FR-003 NFR-003 AC-003 AC-009
  ["specs preservado no commit raiz", identical("specs")],

  // TRACEABILITY: US-001 FR-003 NFR-003 AC-003 AC-009
  [".claude preservado no commit raiz", identical(".claude")],

  // TRACEABILITY: US-001 FR-003 NFR-003 AC-003 AC-009
  [".project-context preservado no commit raiz", identical(".project-context")],

  // TRACEABILITY: US-001 FR-003 NFR-003 AC-003 AC-009
  [".agents preservado no commit raiz", identical(".agents")],
]);
