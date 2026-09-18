import { createHash } from "node:crypto";
import { readRecordFile, writeRecordFile } from "./write.js";
import { RECORD_PATH, type InstallRecord } from "./record.js";
import { SPECSFY_SETUP_TRACES, AGENT_SKILLS_HEADING } from "./layout.js";

export interface DeferralRecord {
  /** Identifier of the configuration contract in force when the deferral was recorded. */
  contractId: string;
  /** Moment of the deferral decision, in ISO 8601. */
  at: string;
}

type RecordWithDeferral = InstallRecord & { conversationalGateDeferral?: DeferralRecord };

/**
 * Stable identifier of what "configured" currently requires — the same
 * trace list `setup-check`/`diagnoseMaestroProject` already read
 * (SPEC-0025), hashed so a deferral can be compared against it without
 * storing the list itself. Independent of any project's actual state: two
 * projects on the same maestro version get the same id (SPEC-0026, DEC-003).
 */
export function configurationContractId(_root: string): string {
  const material = [...SPECSFY_SETUP_TRACES, AGENT_SKILLS_HEADING].join("\n");
  return createHash("sha256").update(material).digest("hex").slice(0, 16);
}

/** Reads the deferral record, when one exists — never repairs, only reports. */
export function readDeferral(root: string): DeferralRecord | null {
  const record = readRecordFile(root, RECORD_PATH) as RecordWithDeferral | null;
  return record?.conversationalGateDeferral ?? null;
}

/**
 * Records a deliberate deferral, tied to the contract in force right now.
 * Only ever called from the CLI (`maestro setup --defer-conversational`),
 * never from a hook — the guard in `guard-defer-conversational` is what
 * keeps an agent from calling this path on the person's behalf.
 */
export function writeDeferral(root: string, contractId: string, now: () => string = () => new Date().toISOString()): void {
  const existing = (readRecordFile(root, RECORD_PATH) as RecordWithDeferral | null) ?? { target: "", version: "", hooks: [] };
  const next: RecordWithDeferral = { ...existing, conversationalGateDeferral: { contractId, at: now() } };
  writeRecordFile(root, RECORD_PATH, next);
}

/**
 * Whether the recorded deferral still covers today's configuration
 * contract. `false` both when nothing was ever deferred and when the
 * contract moved on since — the gate (`setup-gate`) and the doctor layer
 * treat both the same way: the deferral doesn't apply (SPEC-0026, FR-003).
 */
export function isDeferralActive(root: string): boolean {
  const deferral = readDeferral(root);
  if (!deferral) return false;
  return deferral.contractId === configurationContractId(root);
}
