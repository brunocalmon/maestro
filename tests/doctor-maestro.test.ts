import { describe, it, expect } from "vitest";
import { project as freshProject, claudeEnv, corpusHook } from "./helpers-spec-0022";
import { scriptFor, runScript } from "./helpers-spec-0023";
import { runSetup } from "../src/setup/run";
import { diagnoseMaestroProject } from "../src/doctor/maestro";
import { configurationContractId, writeDeferral } from "../src/setup/defer";

const opts = { upstream: { contextModeHooksJson: null } };

/** Installed by `maestro setup`, but neither specsfy-setup nor setup-matt-pocock-skills has run. */
function installedUnconfiguredProject(): string {
  const root = freshProject();
  runSetup({ env: claudeEnv, root, write: true, ...opts });
  return root;
}

describe("AC-014 — doctor nunca esconde um adiamento ativo", () => {
  // SPECSFY: US-002 NFR-003 AC-014
  it("inclui um achado distinto mencionando o adiamento quando ele está ativo", () => {
    const root = installedUnconfiguredProject();
    writeDeferral(root, configurationContractId(root));

    const findings = diagnoseMaestroProject(root);
    expect(findings.some((f) => /deferred/i.test(f.message))).toBe(true);
  });
});

describe("AC-020 — setup-check continua avisando mesmo com adiamento ativo", () => {
  // SPECSFY: NFR-003 AC-020
  it("mantém a mensagem de configuração pendente no hook setup-check independente do adiamento", () => {
    const root = installedUnconfiguredProject();
    writeDeferral(root, configurationContractId(root));

    const script = scriptFor("setup-check");
    const r = runScript(script, { session_id: "s-test" }, root);
    // `installedUnconfiguredProject()` has no .specsfy/ at all, so setup-check's
    // generic "hasn't completed setup yet" branch fires here, not the more
    // granular "missing from /specsfy-setup: ..." one — both are the same
    // guarantee under test: the hook still warns, unaffected by the deferral.
    expect(r.stdout).toMatch(/specsfy-setup|setup-matt-pocock-skills|hasn't completed setup/);
  });
});

describe("AC-021 — doctor distingue \"adiado\" de \"nunca configurado\"", () => {
  // SPECSFY: US-002 NFR-003 AC-021
  it("produz mensagens diferentes para os dois estados", () => {
    const deferredRoot = installedUnconfiguredProject();
    writeDeferral(deferredRoot, configurationContractId(deferredRoot));
    const neverConfiguredRoot = installedUnconfiguredProject();

    const deferredFindings = diagnoseMaestroProject(deferredRoot);
    const neverConfiguredFindings = diagnoseMaestroProject(neverConfiguredRoot);

    const deferredMessages = deferredFindings.map((f) => f.message).join("\n");
    const neverConfiguredMessages = neverConfiguredFindings.map((f) => f.message).join("\n");

    expect(deferredMessages).toMatch(/deferred/i);
    expect(neverConfiguredMessages).not.toMatch(/deferred/i);
  });
});
