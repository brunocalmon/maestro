import { describe, it, expect } from "vitest";

describe("AC-012 — mensagens de commit desta entrega seguem convenção verificável", () => {
  // TRACEABILITY: US-001 FR-004 NFR-002 AC-012
  it("classifica commits com prefixo rename: como rebranding puro e sinaliza os demais", async () => {
    const { classifyRenameCommits } = await import("../scripts/check-rename-commits.mjs");
    const result = classifyRenameCommits([
      "rename: package.json to @brunocalmon/maestro",
      "rename: .common-rules/ paths to .maestro/",
      "fix: unrelated bug found during the rename",
    ]);
    expect(result).toEqual([
      { message: "rename: package.json to @brunocalmon/maestro", accepted: true },
      { message: "rename: .common-rules/ paths to .maestro/", accepted: true },
      { message: "fix: unrelated bug found during the rename", accepted: false },
    ]);
  });
});
