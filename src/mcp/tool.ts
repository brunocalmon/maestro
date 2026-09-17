import { z } from "zod";
import { runSetup, TARGET_SETTINGS } from "../setup/run.js";
import { readRecordFile } from "../setup/write.js";
import { RECORD_PATH } from "../setup/record.js";
import { detectEnvironment } from "../setup/env.js";
import { validateRoot } from "./root.js";
import { KNOWN_TARGETS } from "../hooks/detect.js";
import { realSkillsExecutor } from "../skills/executor.js";
import { realSpecsfyExecutor } from "../specsfy/executor.js";
import { realBridgeEnvironment } from "../setup/bridge.js";
import type { DecisionSource } from "../approval/decide.js";

export const TOOL_NAME = "setup";

export const TOOL_DESCRIPTION =
  "Configures a project: installs the hooks that connect the subsystems to the agent's cycle " +
  "and records the installation. Requires the project root as an absolute path.";

/**
 * Input schema declared to the client.
 *
 * `project_root` is required because the server process doesn't know
 * which project it's in: the `R-001` observation found three running
 * servers, none with the correct root as working directory.
 */
export const inputShape = {
  project_root: z
    .string()
    .describe("Absolute path of the project root to configure. A relative path is refused."),
  /**
   * Optional and explicit on purpose: the calling agent already knows which
   * editor it's running as (its own MCP client identity, its own process),
   * which is better information than anything this server can read off the
   * project's filesystem. Absent, detection falls back to filesystem
   * evidence — the only path that can never succeed on a brand-new project,
   * since the target's own files don't exist there yet.
   */
  target: z
    .string()
    .optional()
    .describe(
      `Editor to configure explicitly, bypassing filesystem-evidence detection. ` +
        `One of: ${KNOWN_TARGETS.join(", ")}. Pass this whenever the caller knows its own ` +
        `identity — which is the normal case for an agent — rather than leaving a brand-new ` +
        `project, which has none of the target's files yet, undetectable.`,
    ),
};

/**
 * Response shape for `structuredContent`.
 *
 * Not passed as `outputSchema` in `server.ts`'s `registerTool` call: the
 * SDK's Zod v3 conversion path always emits a draft-07 `$schema`, and some
 * MCP clients validate an advertised `outputSchema` against 2020-12 before
 * calling the tool, rejecting it outright. `executeSetup` still shapes its
 * `structuredContent` to match this exactly; only the formal advertisement
 * to the client is skipped. Revisit once the project migrates off `zod@3`.
 */
export const outputShape = {
  root: z.string().describe("Project root that received the configuration."),
  target: z.string().describe("Path, relative to the root, of the target's configuration file."),
  changed: z.boolean().describe("False only on a dry run or when nothing is configured to install; SPEC-0025 made the skills/Specsfy installers reconcile on every call, so a normal call with them configured always reports true."),
  hooks: z
    .array(z.object({ name: z.string(), event: z.string() }))
    .describe("Installed hooks, with the event each one was registered under."),
};

export interface SetupToolResult {
  // The SDK types the tool's return with an index signature, to
  // accommodate protocol fields like `_meta`. Without it, compilation
  // rejects the handler.
  [field: string]: unknown;
  content: { type: "text"; text: string }[];
  isError?: boolean;
  structuredContent?: {
    root: string;
    target: string;
    changed: boolean;
    hooks: { name: string; event: string }[];
  };
}

const text = (t: string): { type: "text"; text: string }[] => [{ type: "text", text: t }];

const refuse = (reason: string): SetupToolResult => ({ isError: true, content: text(reason) });

/**
 * Approves every dependency command outright, never touching stdin.
 *
 * The CLI's own approval flow reads a real terminal or a piped JSON
 * document — both make sense for a one-shot process with its own stdin.
 * This tool's process has no such stdin of its own: it's the MCP
 * transport's byte stream, and reading from it here would race the
 * protocol itself, not ask a person anything. Calling this tool is
 * already the explicit, single action that means "configure this
 * project" — the same intent a person expresses by running `setup` and
 * then answering yes — so there is no separate consent left to collect.
 */
const alwaysApprove: DecisionSource = { ask: () => true };

/**
 * Runs the configuration over the given root.
 *
 * Every decision about where to read and write comes from the argument.
 * This module never consults the working directory or an environment
 * variable, and passes the root explicitly on every call, so behavior
 * doesn't depend on where the process started.
 */
export async function executeSetup(args: {
  project_root?: unknown;
  target?: unknown;
}): Promise<SetupToolResult> {
  const root = validateRoot(args.project_root);
  if (!root.ok) return refuse(root.reason);

  if (args.target !== undefined && typeof args.target !== "string") {
    return refuse(`target must be a string; known targets: ${KNOWN_TARGETS.join(", ")}`);
  }
  if (typeof args.target === "string" && !KNOWN_TARGETS.includes(args.target)) {
    return refuse(`unknown target "${args.target}"; known targets: ${KNOWN_TARGETS.join(", ")}`);
  }

  try {
    // Reading the previous record is what makes rerunning idempotent. In
    // fatia 1b the logic existed but didn't work from the command line,
    // because nobody passed this value along.
    const previous = readRecordFile(root.root, RECORD_PATH);
    const result = runSetup({
      env: detectEnvironment(root.root),
      root: root.root,
      write: true,
      previous,
      target: args.target,
      // Parity with the CLI (`formatSetup` in `src/cli.ts`): without these,
      // `runSetup` skips skills and the Specsfy framework entirely — its
      // own documented behavior for an absent executor — so a project
      // configured through this tool ended up with hooks only, silently
      // less than what the same command does from a terminal.
      skills: { execute: realSkillsExecutor() },
      specsfy: { execute: realSpecsfyExecutor() },
      bridgeEnv: realBridgeEnvironment(),
      approval: { source: alwaysApprove },
    });

    return {
      content: text(result.report),
      structuredContent: {
        root: root.root,
        target: TARGET_SETTINGS,
        changed: result.written.length > 0,
        hooks: result.installed.map((h) => ({ name: h.name, event: h.event })),
      },
    };
  } catch (error) {
    // Failure never becomes partial success: the caller needs to know the
    // configuration didn't happen, and why.
    const cause = error instanceof Error ? error.message : String(error);
    return refuse(`configuration failed at ${root.root}: ${cause}`);
  }
}
