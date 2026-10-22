// Mecaniza a verificação de NFR-001, que antes dependia de alguém ler um cronômetro.
const { readState, assert, STATE_FILE } = require("./lib.cjs");

const BUDGET_SECONDS = 300;
const at = (key) => {
  const state = readState();
  if (!state || !state[key]) return null;
  const value = Date.parse(state[key]);
  return Number.isNaN(value) ? null : value;
};

assert("assert-elapsed-budget", [
  // TRACEABILITY: US-001 NFR-001 AC-006
  ["o horário de início foi registrado", () =>
    at("startedAt") !== null || `startedAt ausente ou inválido em ${STATE_FILE}`],

  // TRACEABILITY: US-001 NFR-001 AC-006
  ["o horário de término foi registrado", () =>
    at("finishedAt") !== null || `finishedAt ausente ou inválido em ${STATE_FILE}`],

  // TRACEABILITY: US-001 NFR-001 AC-006
  ["o término não precede o início", () => {
    const start = at("startedAt"), end = at("finishedAt");
    if (start === null || end === null) return "horários ausentes";
    return end >= start || "finishedAt anterior a startedAt";
  }],

  // TRACEABILITY: US-001 NFR-001 AC-006
  [`o intervalo cabe em ${BUDGET_SECONDS} segundos`, () => {
    const start = at("startedAt"), end = at("finishedAt");
    if (start === null || end === null) return "horários ausentes";
    const elapsed = Math.round((end - start) / 1000);
    return elapsed <= BUDGET_SECONDS || `decorridos ${elapsed}s, orçamento ${BUDGET_SECONDS}s`;
  }],
]);
