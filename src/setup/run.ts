import { readFileSync, readdirSync, existsSync, cpSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { detectTarget, TARGET, type TargetEnvironment } from "../hooks/detect.js";
import { getTargetAdapter } from "../targets/registry.js";
import { claudeCodeAdapter } from "../targets/claude-code.js";
import { readHook } from "../hooks/source.js";
import { translateForClaudeCode, renderSettings, type Settings, type TranslatedHook } from "../hooks/claude-code.js";
import { resolveHookCommand } from "../hooks/resolve.js";
import { realSource, type TraceSource } from "../telemetry/trace.js";
import { installSkills, type Executor as SkillsExecutor, type InstallResult as SkillsInstallResult } from "../skills/install.js";
import { OFFICIAL_SOURCES } from "../skills/source.js";
import { readLock, toRecordEntries } from "../skills/record.js";
import { inspectSkills } from "../skills/inventory.js";
import { installSpecsfy, type Executor as SpecsfyExecutor } from "../specsfy/install.js";
import { describeSpecsfyCommand } from "../specsfy/executor.js";
import { describeSkillsCommand } from "../skills/executor.js";
import { bridgePythonSubsystem, VENV_DIR, type BridgeEnvironment } from "./bridge.js";
import { buildDependencyResolution, codeReviewGraphWillBeLocal } from "./dependency-resolution.js";
import { matches, readRecord, RECORD_PATH, type InstallRecord, type SkillsRecordEntry, type RecordEntry } from "./record.js";
import { readVersion } from "../version.js";
import { resolveChannel, type TerminalContext } from "../approval/context.js";
import { realSource as realApprovalSource, interpret, type DecisionSource, type StdinReader } from "../approval/decide.js";
import {
  assembleDependencyCommands,
  partitionByApproval,
  recordApproval,
  type CommandCandidate,
} from "../approval/plan.js";
import { readApprovalRegistry, writeApprovalRegistry, realRegistryEnvironment, type RegistryEnvironment } from "../approval/registry.js";
import { writeRecordFile, writeSettings } from "./write.js";
import { realChecksumEnvironment } from "../extensions/registry.js";
import { createExtension, realTargetFileEnvironment } from "../extensions/create.js";
import { buildRouterBlock, buildAgentsPointer, buildConfigLanguageBlock, buildConfigLanguagePointer } from "../extensions/router.js";
import { readBundledSkill, deliverBundledSkill, realSkillWriteEnvironment } from "../skills/deliver.js";
import { ensureConfigFile, backfillConfigFile } from "../config/write.js";
import { seedAgentDefaults } from "../agents/seed.js";
import { syncProjectFromStack } from "../config/sync.js";
import { ensureReadmeHomepage } from "./readme.js";

/** Where the target's file is written, relative to the project. */
export const TARGET_SETTINGS = ".claude/settings.json";

export interface SetupOptions {
  env: TargetEnvironment;
  /** Project root to write into. */
  root?: string;
  /** False only to inspect; nothing is written either way when `dryRun`. */
  write: boolean;
  dryRun?: boolean;
  /**
   * Forces detection to this target instead of reading filesystem evidence.
   * Absent, detection falls back to `env` — the only path that works on a
   * project where the target's own files don't exist yet, since that's
   * exactly what a first `setup` is for.
   */
  target?: string;
  previous?: InstallRecord | null;
  bridgeEnv?: BridgeEnvironment;
  /** Where the Python bridge creates `.venv-crg/`, when it runs. Absent, uses the `maestro` package's root (`bridgePythonSubsystem`'s own default) — exists so the suite doesn't pollute the repository itself. */
  bridgeCwd?: string;
  /** Source of the approved dependency-command registry. Absent, uses `.maestro/approved-commands.json` at the project root. */
  registryEnv?: RegistryEnvironment;
  /**
   * Executor for the skills installer. Absent, installation is skipped,
   * the same way the Python bridge only runs when its environment is given.
   *
   * `sources`, absent, installs both official sources (`OFFICIAL_SOURCES`);
   * given, installs only the listed ones — used by cases that exercise a
   * single source in isolation.
   */
  skills?: { execute: SkillsExecutor; sources?: readonly string[] };
  /**
   * Executor for the Specsfy framework's project installer. Absent,
   * installation is skipped, same pattern as `skills`.
   */
  specsfy?: { execute: SpecsfyExecutor };
  /**
   * Source of the instant and identifier. Absent, the real one is used.
   *
   * Exists to give test cases predictability without freezing the value
   * in production, which was the defect SPEC-0006 fixed.
   */
  trace?: TraceSource;
  /**
   * How to get plan approval before writing. Absent from the library
   * call, the terminal command is what decides to pass a real value by
   * default — the same way `skills` stays out until it's provided.
   */
  approval?: { context?: TerminalContext; source?: DecisionSource; stdin?: StdinReader };
}

export interface SetupResult {
  installed: TranslatedHook[];
  planned: { name: string; target: string; event: string }[];
  written: string[];
  settings: Settings | null;
  record: InstallRecord | null;
  recordPath: string;
  report: string;
  bridged: boolean;
  exitCode: number;
}

/**
 * Ensures the router in `CLAUDE.md`/`AGENTS.md` — not a third-party
 * command (`T018`), so it stays outside the batch dependency-approval
 * registry (`SPEC-0010`); idempotency comes from `createExtension` itself,
 * which refuses on a name conflict once the artifact already exists
 * (`FR-086`, `FR-087`).
 */
function ensureRouterCandidates(root: string): void {
  const registryEnv = realChecksumEnvironment(root);
  const targetEnv = realTargetFileEnvironment(root);
  createExtension({
    category: "extension",
    name: "router",
    target: "CLAUDE.md",
    content: buildRouterBlock(),
    registryEnv,
    targetEnv,
  });
  createExtension({
    category: "extension",
    name: "agents-pointer",
    target: "AGENTS.md",
    content: buildAgentsPointer(),
    registryEnv,
    targetEnv,
  });
}

/**
 * Delivers the language/config.yaml instruction as its own anchored block —
 * distinct from `ensureRouterCandidates` (SPEC-0012, DEC-002): reusing the
 * `"router"`/`"agents-pointer"` names would make this instruction
 * unreachable in any project that already ran `setup` once, since
 * `createExtension` refuses a name already registered.
 */
function ensureConfigLanguageRouterCandidate(root: string): void {
  const registryEnv = realChecksumEnvironment(root);
  const targetEnv = realTargetFileEnvironment(root);
  createExtension({
    category: "extension",
    name: "config-language-rule",
    target: "CLAUDE.md",
    content: buildConfigLanguageBlock(),
    registryEnv,
    targetEnv,
  });
  createExtension({
    category: "extension",
    name: "config-language-pointer",
    target: "AGENTS.md",
    content: buildConfigLanguagePointer(),
    registryEnv,
    targetEnv,
  });
}

/**
 * Ensures `.maestro/config.yaml` is present and complete (FR-001,
 * FR-008), then syncs `project.*` from `.specsfy/STACK.md` when Specsfy is
 * active (FR-007) — never overwrites a value the person already set
 * (FR-005).
 *
 * Also seeds each agent's factory files (`SPEC-0015`, `FR-002`): the
 * `maestro:` section the schema declares points at real files, so those files
 * have to exist for the configuration to resolve. Seeding only writes what's
 * absent, for the same reason the config itself does.
 */
function ensureConfigYaml(root: string): void {
  ensureConfigFile(root);
  backfillConfigFile(root);
  seedAgentDefaults(root);
  syncProjectFromStack(root);
  ensureReadmeHomepage(root);
}

/** Locally-authored skills bundled with this package, delivered by `setup` itself — never fetched from a third-party source. */
const BUNDLED_SKILLS = ["maestro-extension-creator"];

/** Both directories the real installer observably populates for the supported targets. */
const SKILL_TARGET_DIRS = [".claude/skills", ".agents/skills"];

/**
 * Copies every bundled skill's files into the project's skill directories.
 *
 * Same-content overwrite every run — cheap, side-effect-free, and safe since
 * this is package-shipped content, never something a person edited by hand.
 */
function deliverLocalSkills(root: string, skillDirs: string[] = SKILL_TARGET_DIRS): void {
  const env = realSkillWriteEnvironment(root);
  for (const name of BUNDLED_SKILLS) {
    deliverBundledSkill(readBundledSkill(name), name, skillDirs, env);
  }
}

/**
 * Ensures third-party skills installed into .claude/skills are synced
 * into .agents/skills when target uses .agents/skills.
 */
function syncSkillsToTargetDirs(root: string, skillDirs: string[]): void {
  const claudeSkillsDir = join(root, ".claude", "skills");
  if (!existsSync(claudeSkillsDir)) return;
  for (const targetDirName of skillDirs) {
    const destDir = join(root, targetDirName);
    if (destDir === claudeSkillsDir) continue;
    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
    try {
      const skills = readdirSync(claudeSkillsDir, { withFileTypes: true });
      for (const entry of skills) {
        if (entry.isDirectory()) {
          const srcSkill = join(claudeSkillsDir, entry.name);
          const destSkill = join(destDir, entry.name);
          cpSync(srcSkill, destSkill, { recursive: true });
        }
      }
    } catch {
      // ignore
    }
  }
}

const hooksDir = (): string => resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "resources", "hooks");

/** Reads the bundled hooks. They live in `resources/hooks/`, not in `specs/`, whose path changes. */
export function loadHooks(dir: string = hooksDir()): ReturnType<typeof readHook>[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => readHook(readFileSync(resolve(dir, f), "utf8")));
}

/**
 * Chains detection, translation, writing and recording.
 *
 * Doesn't write when target evidence is missing, and doesn't write on a
 * dry run. In both cases it returns what it would do, because reporting
 * without acting is what lets someone check before touching a machine.
 */
export function runSetup(opts: SetupOptions): SetupResult {
  const version = readVersion();
  const detection = detectTarget(opts.env, opts.target);
  const empty: SetupResult = {
    installed: [], planned: [], written: [], settings: null, record: null,
    recordPath: RECORD_PATH, report: "", bridged: false, exitCode: 0,
  };

  if (!detection.found) {
    return { ...empty, report: `target ${detection.target} ignored: ${detection.reason}` };
  }

  const adapter = getTargetAdapter(detection.target) ?? claudeCodeAdapter;
  const targetSettings = adapter.settingsPath ?? ".claude/settings.json";

  // Computed before translation, not after: a hook's embedded command needs
  // to know whether a local code-review-graph copy exists — or is about to,
  // this same run — before it's written, not after. Read-only, no
  // subprocess, so doing it this early costs nothing extra.
  const bridgePreview = opts.bridgeEnv ? bridgePythonSubsystem({ env: opts.bridgeEnv, execute: false }) : { wouldInstall: null };
  const bridgePending = bridgePreview.wouldInstall !== null;
  const dependencyResolution = buildDependencyResolution({
    codeReviewGraphLocal: codeReviewGraphWillBeLocal(opts.bridgeEnv, bridgePending),
  });

  const hooks = loadHooks().map((h) => ({ ...h, script: resolveHookCommand(h.script, dependencyResolution) }));
  const { settings, installed: translated } = adapter.formatHooks(hooks);
  const planned = translated.map((h) => ({ name: h.name, target: targetSettings, event: h.event }));

  if (opts.dryRun === true) {
    return {
      ...empty, planned, settings,
      report: `dry run: ${planned.length} hooks would be installed in ${targetSettings}`,
    };
  }

  const root = opts.root ?? process.cwd();

  // Already configured with the same set and version: nothing to do — but
  // matching hooks isn't enough. Skills and the Specsfy framework may have
  // been deleted outside `setup`, and "already configured" needs to be a
  // claim about the disk, not just about the record. The two extra checks
  // are cheap — filesystem, no subprocess — because calling the real
  // installers on every run just to find out whether there's anything to
  // do would pay an unnecessary cost in the common case, where nothing changed.
  const hooksAlreadyDone = matches(opts.previous ?? null, hooks.map((h) => h.name), version);
  const previousSkills = opts.previous?.skills ?? [];
  // A missing previous record isn't "already done" — it's "never
  // attempted." A project whose hooks were recorded before `skills`
  // existed (or outside this mechanism) had `previousSkills.length === 0`
  // treated as trivially done, and `maestro setup` would never
  // install any skill, even with `opts.skills` configured — a real bug,
  // found by running it for real in this very repository.
  const skillsAlreadyDone =
    !opts.skills || (previousSkills.length > 0 && previousSkills.every((s) => inspectSkills(root).dirs.includes(s.name)));
  const specsfyAlreadyDone = !opts.specsfy || existsSync(join(root, ".specsfy"));

  const alreadyDone = hooksAlreadyDone && skillsAlreadyDone && specsfyAlreadyDone && !bridgePending;
  if (alreadyDone) {
    // The router is idempotent via `createExtension` itself (refuses on a
    // name conflict) and isn't a third-party command, so it neither
    // blocks on nor depends on the rest already being pending (FR-086,
    // FR-087, DEC-083).
    if (opts.write) {
      adapter.ensureDirectoryStructure(root);
      adapter.ensureInstructions(root);
      deliverLocalSkills(root, adapter.skillDirs);
      syncSkillsToTargetDirs(root, adapter.skillDirs);
      ensureConfigYaml(root);
    }
    return {
      ...empty, installed: translated, settings,
      record: readRecord(opts.previous ?? null),
      report: `already configured: ${translated.length} hooks unchanged in ${targetSettings}`,
    };
  }

  // Dependency candidates: bin/args resolved without running anything
  // (fatia 1i, `PR-062`) — this is what makes the approval plan show the
  // real command, not a parallel description of what skills/Specsfy/the
  // bridge would do.
  //
  // Skills and Specsfy enter as candidates whenever configured — the same
  // pattern as `installSkills`/`installSpecsfy` below, which already run
  // unconditionally when `alreadyDone` is false, leaving real idempotency
  // inside each installer. `skillsAlreadyDone`/`specsfyAlreadyDone` only
  // decide whether there's SOMETHING pending overall (above); what
  // decides whether THIS specific command was already approved before is
  // the registry, via `partitionByApproval` — not this check.
  const candidates: CommandCandidate[] = [];
  if (opts.skills) {
    for (const source of opts.skills.sources ?? OFFICIAL_SOURCES) {
      candidates.push({
        kind: "skills",
        label: `install skills from ${source}`,
        command: describeSkillsCommand(source),
        pending: true,
      });
    }
  }
  if (opts.specsfy) {
    candidates.push({
      kind: "specsfy",
      label: "install Specsfy framework",
      command: describeSpecsfyCommand(root),
      pending: true,
    });
  }
  if (bridgePending && bridgePreview.wouldInstall) {
    candidates.push({
      kind: "bridge",
      label: "install code-review-graph via uv",
      command: { bin: "uv", args: ["pip", "install", "--python", VENV_DIR, bridgePreview.wouldInstall] },
      pending: true,
    });
  }
  const plannedCommands = assembleDependencyCommands(candidates);

  const registryEnv = opts.registryEnv ?? realRegistryEnvironment(root);
  const registry = readApprovalRegistry(registryEnv);
  const { pending: pendingCommands } = partitionByApproval(registry, plannedCommands);

  // Approval precedes every write, including skill installation, and is
  // only consulted after the two early returns above — which write
  // nothing — so AC-073 and AC-074 don't get asked for nothing. A command
  // already approved before, with the exact same binary and argv, doesn't
  // enter this question again (`FR-072`, fatia 1i) — and when hooks
  // already match and no dependency command is new, the whole question is
  // skipped (`AC-118`): asking for approval again over what's already
  // been approved isn't what "batch" means.
  const needsApproval = !hooksAlreadyDone || pendingCommands.length > 0;
  if (opts.approval && needsApproval) {
    const channel = resolveChannel(opts.approval.context);
    const source = opts.approval.source ?? realApprovalSource(channel, opts.approval.stdin);
    const decision = interpret(source, planned, pendingCommands);
    if (!decision.approved) {
      return { ...empty, planned, settings, report: `not written: ${decision.reason ?? "refused"}`, exitCode: 1 };
    }
  }

  // Consumed once per run, not per entry: an identifier that changes
  // within the same run wouldn't correlate anything.
  const source = opts.trace ?? realSource();
  const now = source.now();
  const trace = source.id();
  const entries: RecordEntry[] = translated.map((h) => ({
    name: h.name, target: targetSettings, version, installedAt: now, event: h.event,
  }));
  // Installation precedes recording: it's the lockfile it produces that
  // supplies the provenance recorded here. Assembling the record first
  // would leave the list empty.
  //
  // One `installSkills` call per source, rereading the lockfile between
  // one and the next: the first real call rewrites `skills-lock.json`
  // (accumulating, not overwriting — confirmed on reopening), and the
  // second needs to see that updated state to compute conflict and
  // idempotency against what's already there, not against what was there
  // before the first.
  const setsBySource: SkillsInstallResult[] = [];
  if (opts.skills) {
    for (const src of opts.skills.sources ?? OFFICIAL_SOURCES) {
      setsBySource.push(
        installSkills({
          root,
          source: src,
          execute: opts.skills.execute,
          previous: toRecordEntries(readLock(root)),
        }),
      );
    }
  }
  const someSetOk = setsBySource.some((c) => !c.isError);

  const skills: SkillsRecordEntry[] | undefined = someSetOk
    ? toRecordEntries(readLock(root)).map((e) => ({ ...e, installedAt: now }))
    : undefined;

  const framework = opts.specsfy ? installSpecsfy({ root, execute: opts.specsfy.execute }) : null;

  // Sync any installed skills to target directories (e.g. .agents/skills)
  if (opts.write) {
    syncSkillsToTargetDirs(root, adapter.skillDirs);
  }

  // The field is omitted when the identifier comes back empty, instead of
  // written with no content: a record with an empty field claims an
  // identification that never happened.
  const record: InstallRecord = {
    target: adapter.name, version,
    ...(trace ? { trace } : {}),
    hooks: entries,
    ...(skills ? { skills } : {}),
  };
  // Actually writes. Before this line the command reported an
  // installation without producing any file, and no test caught it
  // because all of them checked the function's return value, not the
  // disk. The regression on a clean clone caught it.
  const written: string[] = [];
  if (opts.write) {
    adapter.ensureDirectoryStructure(root);
    if (adapter.settingsPath && settings !== null) {
      written.push(writeSettings(root, adapter.settingsPath, settings));
    }
    written.push(writeRecordFile(root, RECORD_PATH, record));
    // Same hook-plan approval already decided above — the router doesn't
    // go through the third-party batch dependency-approval registry
    // (SPEC-0010), because it isn't an external command (T018).
    adapter.ensureInstructions(root);
    deliverLocalSkills(root, adapter.skillDirs);
    syncSkillsToTargetDirs(root, adapter.skillDirs);
    ensureConfigYaml(root);
  }

  // Approved (or with no `approval` required), the bridge actually runs
  // when it's pending — replaces the fixed `execute: false` that never
  // let it run in production (fatia 1i).
  const bridge = opts.bridgeEnv
    ? bridgePythonSubsystem({ env: opts.bridgeEnv, execute: bridgePending, cwd: opts.bridgeCwd })
    : { wouldInstall: null, executed: false, refused: null };

  // Recorded after the real write, never before a refusal (which already
  // returned early above) — the registry only grows with what was
  // actually approved.
  if (opts.write && plannedCommands.length > 0) {
    writeApprovalRegistry(recordApproval(registry, plannedCommands), registryEnv);
  }

  return {
    installed: translated, planned, written, settings, record, recordPath: RECORD_PATH,
    report: [
      `${translated.length} hooks installed in ${targetSettings}`,
      ...setsBySource.map((c) => c.report),
      framework?.report,
      bridge.refused ? `Python bridge: ${bridge.refused}` : null,
      `run ${trace}`,
    ].filter(Boolean).join("; "),
    bridged: bridge.executed,
    exitCode: 0,
  };
}
