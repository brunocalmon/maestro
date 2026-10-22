import type { ApprovalRegistry } from "./registry.js";
import { isApproved } from "./registry.js";

export type DependencyCommandKind = "skills" | "bridge";

export interface DependencyCommandItem {
  kind: DependencyCommandKind;
  label: string;
  bin: string;
  args: string[];
}

/**
 * What `src/setup/run.ts` already knows about a dependency command: whether
 * it's pending, and the real `bin`/`args`, resolved without running anything.
 */
export interface CommandCandidate {
  kind: DependencyCommandKind;
  label: string;
  command: { bin: string; args: string[] } | null;
  pending: boolean;
}

/** Only pending candidates with a resolved command enter the plan (`AC-117`). */
export function assembleDependencyCommands(candidates: readonly CommandCandidate[]): DependencyCommandItem[] {
  return candidates
    .filter((c): c is CommandCandidate & { command: { bin: string; args: string[] } } => c.pending && c.command !== null)
    .map((c) => ({ kind: c.kind, label: c.label, bin: c.command.bin, args: c.command.args }));
}

export function partitionByApproval(
  registry: ApprovalRegistry,
  items: readonly DependencyCommandItem[],
): { approved: DependencyCommandItem[]; pending: DependencyCommandItem[] } {
  const approved: DependencyCommandItem[] = [];
  const pending: DependencyCommandItem[] = [];
  for (const item of items) (isApproved(registry, item) ? approved : pending).push(item);
  return { approved, pending };
}

/** Pure function: returns a new registry with the items appended, without duplicating. */
export function recordApproval(registry: ApprovalRegistry, items: readonly DependencyCommandItem[]): ApprovalRegistry {
  const commands = [...registry.commands];
  for (const item of items) {
    if (!isApproved({ commands }, item)) commands.push({ bin: item.bin, args: item.args });
  }
  return { commands };
}
