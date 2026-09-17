#!/usr/bin/env node
import { argv, exit, stderr, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import { realpathSync, readFileSync } from "node:fs";
import { defaultEnvironment, inspectDependencies, type Report } from "./doctor.js";
import { formatAgentProblems } from "./agents/diagnose.js";
import { runSetup, TARGET_SETTINGS, loadHooks } from "./setup/run.js";
import { detectEnvironment } from "./setup/env.js";
import { KNOWN_TARGETS } from "./hooks/detect.js";
import { readRecordFile } from "./setup/write.js";
import { RECORD_PATH } from "./setup/record.js";
import { realSkillsExecutor } from "./skills/executor.js";
import { realSpecsfyExecutor } from "./specsfy/executor.js";
import { realBridgeEnvironment } from "./setup/bridge.js";
import { readVersion } from "./version.js";
import { detectBackends, realBackendEnvironment } from "./backends/detect.js";
import { readAgentConfig } from "./agents/read.js";
import { resolveTaskType, type ResolvedTaskType } from "./models/task-type.js";
import { realContextWindowReader } from "./models/context-window.js";
import { runDelegation } from "./delegation/run.js";
import { spawnCliAgent } from "./delegation/cli-spawn.js";
import { appendTelemetryEntry, readTelemetryRecord } from "./telemetry/store.js";
import { renderTelemetry } from "./telemetry/render.js";
import type { AgentTelemetryEntry } from "./telemetry/record.js";
import { readApprovedPlan } from "./plan/store.js";
import { AGENT_RESOURCES_DIR } from "./agents/seed.js";
import { existsSync } from "node:fs";
import { join as pathJoin } from "node:path";
import { readMaestroSection } from "./config/read.js";
import { assemblePlan } from "./plan/assemble.js";
import { renderPlan } from "./plan/render.js";
import { decidePlan } from "./plan/run.js";
import { realSource as realTraceSource } from "./telemetry/trace.js";
import { realSource as realDecisionSource } from "./approval/decide.js";
import { listOllamaModels } from "./models/ollama.js";
import { readCapacity } from "./models/capacity.js";
import { recommend, type RecommendOverride } from "./models/recommend.js";
import { realChecksumEnvironment, readExtensionRegistry } from "./extensions/registry.js";
import { createExtension, realTargetFileEnvironment, resolveTargetPath, listPresentExtensionNames } from "./extensions/create.js";
import { diagnoseExtensions } from "./extensions/diagnose.js";
import { repairExtension, realQuarantineEnvironment } from "./extensions/repair.js";

export interface CommandOutcome {
  output: string;
  exitCode: number;
}

/**
 * `--help`/`-h`, checked first by every command.
 *
 * Found missing entirely: nothing in this CLI documented its own flags,
 * and worse, an unrecognized flag like a stray `--help` wasn't refused —
 * `setup`'s own flag parsing silently drops anything it doesn't
 * recognize and falls through to running the real command anyway. That's
 * not just a discoverability gap, it's how a typo turns into an
 * unintended write; every command checks this before doing anything else,
 * and `setup` additionally refuses flags it doesn't recognize instead of
 * ignoring them (see `formatSetup`).
 */
const HELP_FLAGS = new Set(["--help", "-h"]);
const hasHelp = (args: readonly string[]): boolean => args.some((a) => HELP_FLAGS.has(a));

const USAGE_VERSION = "usage: maestro version\n\nPrints the installed version.";
const USAGE_DOCTOR =
  "usage: maestro doctor\n\n" +
  "Reports every dependency this project's layers need, whether each is present,\n" +
  "and its version. Exits non-zero when something required is missing.";
const USAGE_SETUP =
  "usage: maestro setup [--target claude-code]\n\n" +
  "Installs the hooks that connect this project's subsystems to the agent's\n" +
  "cycle, plus the skills and the Specsfy framework, then records the\n" +
  "installation so a later run is a no-op when nothing changed.\n\n" +
  "  --target <name>   Configure this editor explicitly, skipping filesystem-\n" +
  "                     evidence detection. Known targets: " +
  KNOWN_TARGETS.join(", ") +
  ".\n" +
  "                     Required on a project that has never been configured\n" +
  "                     for it yet — evidence-based detection can never find\n" +
  "                     .claude/ before this command has run once to create it.\n\n" +
  "Without --target, detection falls back to filesystem evidence and does\n" +
  "nothing when none is found — that's a normal exit, not a failure.\n\n" +
  "Prompts for approval on a real terminal; reads a JSON document\n" +
  '({"approved": true}) from standard input otherwise.';
const USAGE_PLAN =
  "usage: maestro plan --task \"<description>\"\n\n" +
  "Assembles an orchestration plan for the task and asks for approval before\n" +
  "anything is delegated. The plan names the agent, the model and the runtime,\n" +
  "and carries the profiles and backends detected, for an agent to refine.\n\n" +
  "Approving writes the plan to .maestro/plans/<run>.json, which the execution\n" +
  "commands read instead of planning again. Refusing writes nothing.\n\n" +
  "  --task        what the plan is for. Required — without it the command\n" +
  "                refuses rather than guessing what to plan.\n" +
  "  --task-type   a type declared in .maestro/config.yaml, whose context\n" +
  "                window requirement filters the models considered. Omitted,\n" +
  "                no requirement is applied.";

const USAGE_RUN =
  "usage: maestro run <execution>\n\n" +
  "Reads an approved plan and, per planned agent: emits the delegation brief\n" +
  "for runtime \"native\"/\"auto\" (behavior, skills, tools, model — the host\n" +
  "agent calls its own subagents from this), or actually spawns a real CLI\n" +
  "subprocess for runtime \"cli\", asking for a fresh approval before each\n" +
  "spawn and reporting its stdout/stderr/exit code back as text, uninterpreted.\n\n" +
  "Refusing one \"cli\" agent (tools, backend, or that spawn's decision) never\n" +
  "blocks the rest of the plan. Each spawn attempt is recorded to\n" +
  ".maestro/telemetry/<execution>.json — readable with `maestro report`.\n\n" +
  "  <execution>   the run identifier from an approved plan, i.e. the file\n" +
  "                name under .maestro/plans/ without the .json suffix.";

const USAGE_REPORT =
  "usage: maestro report <execution>\n\n" +
  "Reads and presents the telemetry recorded for an execution's \"cli\" agents\n" +
  "— backend, model, outcome (refused or ran), reason or exit code, and\n" +
  "duration, one block per agent. Never stdout/stderr content.\n\n" +
  "Refuses, naming the execution, when nothing was recorded for it — either\n" +
  "the trace doesn't exist, or no runtime \"cli\" agent was ever processed.\n\n" +
  "  <execution>   the same identifier used with `maestro run`.";

const USAGE_RECOMMEND =
  "usage: maestro recommend [--backend <name>] [--local-model <name>]\n\n" +
  "Recommends which agent backend and local model to use, based on what's\n" +
  "installed and the machine's capacity. Both flags override detection by hand\n" +
  "and are never revalidated against what's actually present.";
const USAGE_EXTENSION_CREATE =
  "usage: maestro extension create --category <override|extension|new> --target <target> --name <name> --file <file-with-the-content>\n\n" +
  "Writes one extension artifact. The sole write path for this — never edit\n" +
  "target files by hand, since that's exactly what lets an install detect drift.";
const USAGE_EXTENSION_REPAIR =
  "usage: maestro extension repair --name <name>\n\n" +
  "Quarantines a divergent extension's content and restores the original.\n" +
  "Never deletes: the divergent content moves aside, it doesn't disappear.";
const USAGE_EXTENSION =
  "usage: maestro extension <create|repair> ...\n\n" +
  "  create   " +
  USAGE_EXTENSION_CREATE.split("\n")[0]!.replace("usage: maestro extension create ", "") +
  "\n  repair   " +
  USAGE_EXTENSION_REPAIR.split("\n")[0]!.replace("usage: maestro extension repair ", "") +
  "\n\nRun `maestro extension <create|repair> --help` for either one's full usage.";
const USAGE_TOP =
  "usage: maestro <command> [options]\n\n" +
  "Commands:\n" +
  "  version               Print the installed version.\n" +
  "  doctor                Report every dependency this project's layers need.\n" +
  "  setup [--target ...]  Configure this project: hooks, skills, Specsfy.\n" +
  "  recommend [options]   Recommend an agent backend and local model.\n" +
  "  plan --task \"...\"     Assemble an orchestration plan, pending approval.\n" +
  "  run <execution>       Delegate an approved plan's agents.\n" +
  "  report <execution>    Read the telemetry recorded for a run.\n" +
  "  extension <create|repair> ...   Manage one extension artifact.\n\n" +
  "Run `maestro <command> --help` for a command's full usage.";

/**
 * Formats one line per dependency, with layer, origin and version.
 *
 * Extracted from `formatReport()` to be exercisable with an injected
 * `Report` — fatia 1d needs to prove the `agent` layer's text without
 * depending on what's installed on the machine running the suite
 * (NFR-032, SPEC-0008).
 */
export function renderReport(report: Report): string {
  const lines = report.results.map((d) => {
    const head = `${d.present ? "ok     " : "absent "} ${d.name}`;
    if (!d.present) return `${head}\n        ${d.hint ?? ""}`.trimEnd();
    const supported = d.layer === "agent" ? `, ${d.supported ? "supported" : "not supported"}` : "";
    return `${head} — layer ${d.layer}, origin ${d.origin}, version ${d.version}${supported}`;
  });
  const divergent = (report.divergentExtensions ?? []).map(
    (d) => `divergent extension "${d.name}" — target ${d.target}, ${d.reason}`,
  );
  // A divergência de perfil já entra no exitCode; sem esta linha o relatório
  // sairia silencioso sobre o motivo, e "sair com 1 sem dizer por quê" é
  // justamente a falha silenciosa que o projeto trata como cara (`AC-010`).
  const agents = formatAgentProblems(report.divergentAgents ?? []);
  const subsystems = (report.subsystems ?? []).map((s) => {
    const status = s.status === "OK" ? "ok     " : s.status === "ABSENT" ? "absent " : "fail   ";
    return `${status} ${s.name}${s.detail ? ` — ${s.detail}` : ""}`;
  });
  const maestro = (report.maestro ?? []).map((f) => `${f.level.padEnd(6)} ${f.area} — ${f.message}`);
  return [...lines, ...divergent, ...agents, ...subsystems, ...maestro].join("\n");
}

function formatReport(args: readonly string[] = []): CommandOutcome {
  if (hasHelp(args)) return { output: USAGE_DOCTOR, exitCode: 0 };
  const report = inspectDependencies(defaultEnvironment(), process.cwd());
  return { output: renderReport(report), exitCode: report.exitCode };
}

/** Flags `setup` recognizes; anything else is refused, not silently dropped (see `HELP_FLAGS`'s comment for why). */
const SETUP_FLAGS = new Set(["target"]);

/**
 * Formats the setup result, without deciding anything about it.
 *
 * `--target`, given, forces detection to that value instead of reading
 * filesystem evidence — the only way to configure a brand-new project,
 * since evidence-based detection can never find `.claude/` before `setup`
 * has run once to create it (a bug found running this exact command
 * against a fresh project: `target claude-code ignored: no evidence...`
 * even though the caller was Claude Code itself). The MCP facade is
 * expected to pass this explicitly, from its own client handshake, rather
 * than a person needing to type it by hand every time.
 */
function formatSetup(args: readonly string[] = []): CommandOutcome {
  if (hasHelp(args)) return { output: USAGE_SETUP, exitCode: 0 };

  const flags = parseFlags(args);
  const unknown = Object.keys(flags).filter((f) => !SETUP_FLAGS.has(f));
  if (unknown.length > 0) {
    // The incident this guards: --help alone, with nothing recognizable
    // after it, used to fall through parseFlags unnoticed and run the real
    // command — an unrecognized flag is a mistake to report, never a
    // reason to proceed as if nothing was asked for.
    return {
      output: `${USAGE_SETUP}\n\nunrecognized: --${unknown.join(", --")}`,
      exitCode: 2,
    };
  }

  const { target } = flags;
  if (target !== undefined && !KNOWN_TARGETS.includes(target)) {
    return { output: `${USAGE_SETUP}\n\nknown targets: ${KNOWN_TARGETS.join(", ")}`, exitCode: 2 };
  }

  // Reading the previous record is what makes idempotency hold in
  // practice: without it the command reinstalls and reports an
  // installation on every run, even though the result on disk is the same.
  const root = process.cwd();
  const previous = readRecordFile(root, RECORD_PATH);
  const r = runSetup({
    env: detectEnvironment(root),
    root,
    write: true,
    previous,
    target,
    skills: { execute: realSkillsExecutor() },
    specsfy: { execute: realSpecsfyExecutor() },
    bridgeEnv: realBridgeEnvironment(),
    approval: {},
  });
  if (r.installed.length === 0) return { output: r.report, exitCode: r.exitCode };
  const lines = r.installed.map((h) => `  ${h.name} — event ${h.event}, in ${TARGET_SETTINGS}`);
  return { output: [r.report, ...lines].join("\n"), exitCode: r.exitCode };
}

/** `--backend <name>` and `--local-model <name>` — human override, never revalidated (FR-036, DEC-039). */
function parseRecommendOverride(args: readonly string[]): RecommendOverride {
  const override: RecommendOverride = {};
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    const value = args[i + 1];
    if (flag === "--backend" && value !== undefined) {
      override.backend = value;
      i++;
    } else if (flag === "--local-model" && value !== undefined) {
      override.localModel = value;
      i++;
    }
  }
  return override;
}

/**
 * Resolves a `--task-type` against the project's configuration.
 *
 * Returns `undefined` when none was given: absence must not turn into an
 * invented requirement, and the recommendation stays exactly what it was
 * before this flag existed (`DEC-006`).
 */
function parseTaskType(args: readonly string[], root: string): ResolvedTaskType | undefined {
  const name = parseFlags(args)["task-type"];
  if (name === undefined) return undefined;
  return resolveTaskType(readMaestroSection(root).task_types ?? {}, name);
}

/** Resolves the three real sources and prints `recommendation.report` (FR-037). */
function formatRecommend(args: readonly string[]): CommandOutcome {
  if (hasHelp(args)) return { output: USAGE_RECOMMEND, exitCode: 0 };

  let requirement: ResolvedTaskType | undefined;
  try {
    requirement = parseTaskType(args, process.cwd());
  } catch (error) {
    return { output: `${USAGE_RECOMMEND}\n\nrefused: ${(error as Error).message}`, exitCode: 2 };
  }

  const r = recommend(
    detectBackends(realBackendEnvironment()),
    listOllamaModels(),
    readCapacity(),
    parseRecommendOverride(args),
    requirement,
    // Only built when a type was given: without a requirement nothing is
    // ever asked, so no subprocess is spawned (`AC-011`).
    requirement === undefined ? undefined : realContextWindowReader(),
  );
  return { output: r.report, exitCode: r.backend === null ? 1 : 0 };
}

/** Flags `plan` recognizes; anything else is refused, not silently dropped. */
const PLAN_FLAGS = new Set(["task", "task-type"]);

/**
 * Assembles a plan, presents it, and writes it only on an explicit yes.
 *
 * The decision channel is the one `SPEC-0007` already built: interactive
 * when a terminal is there, a JSON document on stdin when it isn't, and a
 * refusal in every other case (`DEC-002`).
 */
function formatPlan(args: readonly string[] = []): CommandOutcome {
  if (hasHelp(args)) return { output: USAGE_PLAN, exitCode: 0 };

  const flags = parseFlags(args);
  const unknown = Object.keys(flags).filter((flag) => !PLAN_FLAGS.has(flag));
  const bare = args.filter((arg) => arg.startsWith("--")).map((arg) => arg.slice(2)).filter((flag) => !PLAN_FLAGS.has(flag));
  const rejected = [...new Set([...unknown, ...bare])];
  if (rejected.length > 0) {
    return { output: `${USAGE_PLAN}\n\nunrecognized: --${rejected.join(", --")}`, exitCode: 2 };
  }

  const task = flags.task ?? "";
  if (task.trim() === "") {
    return { output: `${USAGE_PLAN}\n\nrefused: --task is required, and no plan is assembled without it.`, exitCode: 2 };
  }

  const root = process.cwd();
  const trace = realTraceSource();
  const config = readAgentConfig(root);

  let requirement: ResolvedTaskType | undefined;
  try {
    requirement = parseTaskType(args, root);
  } catch (error) {
    return { output: `${USAGE_PLAN}\n\nrefused: ${(error as Error).message}`, exitCode: 2 };
  }

  const recommendation = recommend(
    detectBackends(realBackendEnvironment()),
    listOllamaModels(),
    readCapacity(),
    {},
    requirement,
    requirement === undefined ? undefined : realContextWindowReader(),
  );

  const plan = assemblePlan({
    profiles: [config.maestro, ...config.subagents],
    backends: detectBackends(realBackendEnvironment()).filter((b) => b.present).map((b) => b.name),
    recommendation,
    task,
    trace: trace.id(),
    createdAt: trace.now(),
  });

  const rendered = renderPlan(plan);
  const decision = decidePlan(root, plan, {
    ask: () => realDecisionSource(process.stdin.isTTY ? "interactive" : "document").ask([], []),
  });

  if (!decision.approved) {
    return { output: `${rendered}\n\nrefused: ${decision.reason ?? "no approval"}. Nothing was written.`, exitCode: 1 };
  }
  return { output: `${rendered}\n\napproved: written to ${decision.writtenTo}`, exitCode: 0 };
}

/**
 * Reads a base agent's factory behavior — the fallback `composeBehavior`
 * uses when a profile declares neither `behavior` nor `additional_behavior`.
 */
function readBaseBehavior(agent = "maestro"): string {
  const path = pathJoin(AGENT_RESOURCES_DIR, agent, "behavior.md");
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

/**
 * Emits the delegation brief for an approved plan, or refuses naming why.
 *
 * The command is the thin shell over `runDelegation`: this is where the
 * plan and the profiles actually get read from disk, since the module
 * beneath stays pure and testable without a filesystem.
 */
function formatRun(args: readonly string[] = []): CommandOutcome {
  if (hasHelp(args)) return { output: USAGE_RUN, exitCode: 0 };

  const positional = args.filter((arg) => !arg.startsWith("--"));
  const traceId = positional[0];
  if (traceId === undefined) {
    return { output: `${USAGE_RUN}\n\nrefused: the execution identifier is required.`, exitCode: 2 };
  }

  const root = process.cwd();
  const plan = readApprovedPlan(root, traceId);
  if (plan === null) {
    return { output: `${USAGE_RUN}\n\nrefused: no approved plan found for "${traceId}".`, exitCode: 2 };
  }

  let config;
  try {
    config = readAgentConfig(root);
  } catch (error) {
    return { output: `${USAGE_RUN}\n\nrefused: ${(error as Error).message}`, exitCode: 2 };
  }

  const needsCli = plan.agents.some((agent) => agent.runtime === "cli");
  const cliRuntime = needsCli
    ? {
        root,
        detected: detectBackends(realBackendEnvironment()),
        // Same decision channel as the plan gate (`SPEC-0016`), one call per spawn (`FR-005`).
        ask: () => realDecisionSource(process.stdin.isTTY ? "interactive" : "document").ask([], []),
        spawn: spawnCliAgent,
        // Records every spawn attempt for `maestro report` (`SPEC-0020`).
        telemetry: { now: () => new Date().toISOString(), record: (entry: AgentTelemetryEntry) => appendTelemetryEntry(root, traceId, entry) },
      }
    : undefined;

  const result = runDelegation(plan, config, (path) => {
    const full = pathJoin(root, path);
    return existsSync(full) ? readFileSync(full, "utf8") : null;
  }, readBaseBehavior(), cliRuntime);

  if (!result.ok) return { output: `${USAGE_RUN}\n\nrefused: ${result.reason}`, exitCode: 2 };
  return { output: result.text, exitCode: 0 };
}

/**
 * Reads and presents the telemetry recorded for an execution's `cli` agents.
 *
 * A trace with no telemetry file is refused nomeada — either the trace
 * doesn't exist, or nothing `runtime: cli` was ever processed for it
 * (`SPEC-0020`, `FR-004`).
 */
function formatTelemetryReport(args: readonly string[] = []): CommandOutcome {
  if (hasHelp(args)) return { output: USAGE_REPORT, exitCode: 0 };

  const positional = args.filter((arg) => !arg.startsWith("--"));
  const traceId = positional[0];
  if (traceId === undefined) {
    return { output: `${USAGE_REPORT}\n\nrefused: the execution identifier is required.`, exitCode: 2 };
  }

  const root = process.cwd();
  const record = readTelemetryRecord(root, traceId);
  if (record === null) {
    return { output: `${USAGE_REPORT}\n\nrefused: no telemetry recorded for "${traceId}".`, exitCode: 2 };
  }
  return { output: renderTelemetry(record), exitCode: 0 };
}

/** Reads `--flag value` from the command line; flags with no following value are ignored. */
function parseFlags(args: readonly string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    const value = args[i + 1];
    if (flag?.startsWith("--") && value !== undefined) {
      flags[flag.slice(2)] = value;
      i++;
    }
  }
  return flags;
}

/** `maestro extension create` — sole write path for an extension artifact (FR-080, NFR-083). */
function formatExtensionCreate(args: readonly string[]): CommandOutcome {
  if (hasHelp(args)) return { output: USAGE_EXTENSION_CREATE, exitCode: 0 };

  const { category, target, name, file } = parseFlags(args);
  if (category !== "override" && category !== "extension" && category !== "new") {
    return { output: USAGE_EXTENSION_CREATE, exitCode: 2 };
  }
  if (!target || !name || !file) {
    return { output: USAGE_EXTENSION_CREATE, exitCode: 2 };
  }
  const root = process.cwd();
  const content = readFileSync(file, "utf8");
  const managedHooks = loadHooks().map((h) => h.name);
  const result = createExtension({
    category,
    name,
    target,
    content,
    registryEnv: realChecksumEnvironment(root),
    targetEnv: realTargetFileEnvironment(root),
    managedHooks,
  });
  if (!result.ok) return { output: result.reason ?? "refused", exitCode: 1 };
  return { output: `extension "${name}" created at ${resolveTargetPath(target)}`, exitCode: 0 };
}

/** `maestro extension repair` — quarantines the divergent one and restores the original, never deletes (FR-084, FR-085). */
function formatExtensionRepair(args: readonly string[]): CommandOutcome {
  if (hasHelp(args)) return { output: USAGE_EXTENSION_REPAIR, exitCode: 0 };

  const { name } = parseFlags(args);
  if (!name) return { output: USAGE_EXTENSION_REPAIR, exitCode: 2 };

  const root = process.cwd();
  const registryEnv = realChecksumEnvironment(root);
  const targetEnv = realTargetFileEnvironment(root);
  const registry = readExtensionRegistry(registryEnv);
  const divergent = diagnoseExtensions(registry, targetEnv, listPresentExtensionNames(root));
  const item = divergent.find((d) => d.name === name);
  if (!item) return { output: `"${name}" isn't divergent; nothing to repair`, exitCode: 1 };

  const result = repairExtension(item, {
    registry,
    targetEnv,
    quarantineEnv: realQuarantineEnvironment(root),
  });
  if (!result.ok) return { output: result.reason ?? "repair refused", exitCode: 1 };
  return { output: `"${name}" repaired; divergent content moved to ${result.quarantinePath}`, exitCode: 0 };
}

function formatExtension(args: readonly string[]): CommandOutcome {
  const sub = args[0];
  if (sub === "create") return formatExtensionCreate(args.slice(1));
  if (sub === "repair") return formatExtensionRepair(args.slice(1));
  return { output: USAGE_EXTENSION, exitCode: hasHelp(args) ? 0 : 2 };
}

export const COMMANDS: Record<string, (args: readonly string[]) => CommandOutcome> = {
  version: (args) => (hasHelp(args) ? { output: USAGE_VERSION, exitCode: 0 } : { output: readVersion(), exitCode: 0 }),
  doctor: formatReport,
  setup: formatSetup,
  recommend: formatRecommend,
  plan: formatPlan,
  run: formatRun,
  report: formatTelemetryReport,
  extension: formatExtension,
};

const ALIASES: Record<string, string> = {
  "--version": "version",
  "-v": "version",
  version: "version",
  doctor: "doctor",
  setup: "setup",
  recommend: "recommend",
  plan: "plan",
  run: "run",
  report: "report",
  extension: "extension",
};

/** Resolves the received argument to a known command, or null. */
export function resolveCommand(args: readonly string[]): string | null {
  const first = args[0];
  if (first === undefined) return null;
  return ALIASES[first] ?? null;
}

export function run(args: readonly string[]): CommandOutcome {
  // Checked before command resolution, not added as a "help" entry to
  // COMMANDS: a no-args invocation and a top-level --help both want the
  // same full listing, and neither is a command with a return value of its
  // own to fold in there.
  if (args.length === 0 || HELP_FLAGS.has(args[0]!)) {
    return { output: USAGE_TOP, exitCode: args.length === 0 ? 2 : 0 };
  }

  const name = resolveCommand(args);
  if (name === null) {
    const known = Object.keys(COMMANDS).join(", ");
    return { output: `unrecognized command "${args[0]}". Available: ${known}.\n\n${USAGE_TOP}`, exitCode: 2 };
  }
  const command = COMMANDS[name];
  if (command === undefined) return { output: `command ${name} has no implementation`, exitCode: 2 };
  return command(args.slice(1));
}

/**
 * Resolves `argv[1]` to its real path before comparing.
 *
 * Every global npm install — `npm link` or `npm install -g` of a
 * published package — delivers the binary as a symlink. `argv[1]`
 * preserves the link's path, and `fileURLToPath(import.meta.url)` is
 * always the real path; comparing the two directly never matches outside
 * this checkout. Returns `undefined` instead of throwing when the path
 * doesn't exist, so the guard simply doesn't fire instead of crashing the process.
 */
function realEntryPath(path: string | undefined): string | undefined {
  if (path === undefined) return undefined;
  try {
    return realpathSync(path);
  } catch {
    return undefined;
  }
}

// Only runs when invoked as a binary; importing the module prints
// nothing, which is what lets surface.test.ts inspect COMMANDS with no
// side effect.
if (fileURLToPath(import.meta.url) === realEntryPath(argv[1])) {
  const { output, exitCode } = run(argv.slice(2));
  (exitCode === 0 ? stdout : stderr).write(`${output}\n`);
  exit(exitCode);
}
