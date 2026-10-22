import type { DependencyCommandItem } from "./plan.js";

/** Plan item, in the same shape `runSetup` already produces for a dry run. */
export interface PlannedItem {
  name: string;
  target: string;
  event: string;
}

export interface RenderedPlan {
  /** Readable form, for the interactive channel. */
  text: string;
  /** JSON document form, for the automated channel. */
  document: string;
}

/**
 * Renders the plan in both forms from the same two lists.
 *
 * Both derive from a single pass, so `AC-069` can't fail from drift
 * between implementations that extract the same fields twice. Hooks and
 * dependency commands (skills and Python bridge) coexist side by
 * side without merging into a single structure (`FR-071`) — hooks have no
 * `bin`/`args`, and this fatia's persistent registry doesn't apply to them.
 */
export function renderPlan(hooks: readonly PlannedItem[], commands: readonly DependencyCommandItem[] = []): RenderedPlan {
  const hookLines = hooks.map((item) => `  ${item.name} — ${item.event} — ${item.target}`);
  const commandLines = commands.map((c) => `  ${c.label} — ${c.bin} ${c.args.join(" ")}`);
  const text = [
    `Plan: ${hooks.length} hooks and ${commands.length} dependency commands to install.`,
    ...hookLines,
    ...commandLines,
  ].join("\n");
  const document = JSON.stringify({
    items: hooks.map((item) => ({ ...item })),
    commands: commands.map((c) => ({ ...c })),
  });
  return { text, document };
}
