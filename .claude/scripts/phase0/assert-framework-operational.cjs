// Guarda o risco de a preservação ser insuficiente: as skills chegam à branch nova
// presentes, mas incapazes de produzir artefato por falta dos templates.
const { execFileSync } = require("node:child_process");
const { existsSync, rmSync } = require("node:fs");
const { resolve } = require("node:path");
const { filesIn, refExists, assert, WORK_BRANCH } = require("./lib.cjs");

const ROOT = resolve(__dirname, "../../..");
const CAPTURE = resolve(ROOT, ".claude/skills/framework-01-inbox/scripts/capturar_inbox.mjs");
const TEMPLATE = resolve(ROOT, ".project-context/templates/Inbox.md");

assert("assert-framework-operational", [
  // TRACEABILITY: US-001 FR-003 AC-011
  [`branch ${WORK_BRANCH} existe`, () =>
    refExists(WORK_BRANCH) || `referência ${WORK_BRANCH} não encontrada`],

  // TRACEABILITY: US-001 FR-003 NFR-003 AC-011
  ["a skill de captura sobreviveu à limpeza", () => {
    if (!refExists(WORK_BRANCH)) return "referência ausente";
    const files = filesIn(WORK_BRANCH, [".claude/skills/framework-01-inbox"]);
    return files && files.length ? true : "skill ausente na branch de trabalho";
  }],

  // TRACEABILITY: US-001 FR-003 NFR-003 AC-011
  ["o template resolve na branch de trabalho", () => {
    if (!refExists(WORK_BRANCH)) return "referência ausente";
    const files = filesIn(WORK_BRANCH, [".project-context/templates"]);
    if (!files || !files.length) return ".project-context/templates ausente na branch";
    return files.some((f) => f.endsWith("/Inbox.md")) || "Inbox.md ausente entre os templates";
  }],

  // TRACEABILITY: US-001 FR-003 AC-011
  ["uma captura real é criada sem reinstalação", () => {
    if (!existsSync(CAPTURE)) return `script de captura ausente em ${CAPTURE}`;
    if (!existsSync(TEMPLATE)) return `template ausente em ${TEMPLATE}`;
    let created = null;
    try {
      const out = execFileSync("node", [CAPTURE,
        "--input", "sonda de verificação da Phase 0",
        "--title", "Sonda Phase 0",
        "--summary", "Verificação automática de que o framework opera.",
        "--root", ROOT,
      ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
      created = out.split("\n").pop().trim();
      if (!created || !existsSync(created)) return "o script não reportou um arquivo existente";
      return true;
    } catch (error) {
      return `a captura falhou: ${String(error.stderr || error.message).split("\n")[0]}`;
    } finally {
      // A sonda não pode deixar rastro em specs/inbox/.
      if (created && existsSync(created)) rmSync(created, { force: true });
    }
  }],
]);
