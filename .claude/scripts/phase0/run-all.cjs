// Executa a suíte inteira e reporta o estado agregado da Phase 0.
// É o critério de AC-010: a fase só está encerrada quando as sete asserções passam juntas.
const { execFileSync } = require("node:child_process");
const { resolve } = require("node:path");

const SUITE = [
  "assert-archived-frozen",
  "assert-orphan-root",
  "assert-preserved-set",
  "assert-no-legacy",
  "assert-framework-operational",
  "assert-baseline-untouched",
  "assert-elapsed-budget",
];

const failures = [];
for (const name of SUITE) {
  // TRACEABILITY: US-001 US-002 AC-010
  try {
    execFileSync("node", [resolve(__dirname, `${name}.cjs`)], { stdio: ["ignore", "pipe", "pipe"] });
    console.log(`  ✓ ${name}`);
  } catch (error) {
    const detail = String(error.stdout || "").split("\n").filter((l) => l.includes("✗")).length;
    failures.push(`  ✗ ${name} — ${detail || "?"} condição(ões) não satisfeita(s)`);
  }
}

if (failures.length) {
  console.error(`\nRED run-all: ${failures.length} de ${SUITE.length} asserções falharam`);
  failures.forEach((line) => console.error(line));
  process.exit(1);
}
console.log(`\nGREEN run-all: as ${SUITE.length} asserções da Phase 0 passam juntas`);
