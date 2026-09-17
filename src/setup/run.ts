import { readFileSync, readdirSync, existsSync, cpSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { detectTarget, TARGET, type TargetEnvironment } from "../hooks/detect.js";
import { getTargetAdapter } from "../targets/registry.js";
import type { TargetAdapter } from "../targets/adapter.js";
import { claudeCodeAdapter } from "../targets/claude-code.js";
import { readHook } from "../hooks/source.js";
import { translateForClaudeCode, renderSettings, type Settings, type TranslatedHook } from "../hooks/claude-code.js";
import { resolveHookCommand, resolveDispatchCommand } from "../hooks/resolve.js";
import { projectContextModeHooks } from "../hooks/upstream.js";
import type { SkippedHook } from "../targets/adapter.js";
import { realSource, type TraceSource } from "../telemetry/trace.js";
import { installSkills, type Executor as SkillsExecutor, type InstallResult as SkillsInstallResult } from "../skills/install.js";
import { OFFICIAL_SOURCES } from "../skills/source.js";
import { readLock, toRecordEntries } from "../skills/record.js";
import { SKILLS_DIR } from "../skills/inventory.js";
import { projectSkills } from "../skills/project.js";
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
import { writeRecordFile, readRecordFile, writeSettings, writeHookScripts, hasLegacyEntries, hookScriptPath, type WriteHookScriptsResult } from "./write.js";
import { realChecksumEnvironment } from "../extensions/registry.js";
import { readBundledSkill, deliverBundledSkill, realSkillWriteEnvironment } from "../skills/deliver.js";
import { ensureConfigFile, backfillConfigFile } from "../config/write.js";
import { seedAgentDefaults } from "../agents/seed.js";
import { syncProjectFromStack } from "../config/sync.js";
import { ensureReadmeHomepage } from "./readme.js";
import { assessConfiguration, nextStepsNote } from "./layout.js";

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
  /** Directory of canonical hooks. Absent, the package's `resources/hooks/` — exists for cases that need a synthetic hook. */
  hooksDir?: string;
  /**
   * Upstream projections (SPEC-0022, FR-006). `contextModeHooksJson`
   * absent: the installed package's `hooks/hooks.json`; `null`: skip.
   */
  upstream?: { contextModeHooksJson?: string | null };
}

export interface SetupResult {
  installed: TranslatedHook[];
  /** Hooks the target adapter refused, with the reason (FR-007). */
  skipped: SkippedHook[];
  /** Legacy inline entries replaced in the settings file (FR-004). */
  migrated: number;
  /** Files copied to `.maestro/quarantine/` this run: divergent scripts and an unparsable settings file. */
  quarantined: string[];
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
function ensureConfigYaml(root: string, nextNote: string | null = null): void {
  ensureConfigFile(root);
  backfillConfigFile(root);
  seedAgentDefaults(root);
  syncProjectFromStack(root);
  ensureReadmeHomepage(root, nextNote);
}

/** Where hooks keep per-session state (graph hash, one-time hints). Never versioned (SPEC-0023, DEC-006). */
export const STATE_DIR = ".maestro/state";

/**
 * Creates `.maestro/state/` and keeps it out of git. The `.gitignore` line is
 * added once; a file that already has it is left alone, and a missing
 * `.gitignore` is created with just that line.
 */
function ensureStateDir(root: string): void {
  mkdirSync(join(root, STATE_DIR), { recursive: true });
  const ignore = join(root, ".gitignore");
  const line = `${STATE_DIR}/`;
  const current = existsSync(ignore) ? readFileSync(ignore, "utf8") : "";
  if (current.split(/\r?\n/).some((l) => l.trim() === line)) return;
  const prefix = current.length === 0 || current.endsWith("\n") ? current : `${current}\n`;
  writeFileSync(ignore, `${prefix}${line}\n`);
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
 * Projects `.agents/skills` into the target's own directory when it has
 * one, carrying the previous checksums so an edited copy is never replaced
 * (SPEC-0024, FR-006). Replaces the old one-way sync `.claude → .agents`.
 */
function projectSkillsForTarget(root: string, adapter: TargetAdapter, known: readonly { name: string; checksum: string }[]): ReturnType<typeof projectSkills> {
  if (!adapter.projectsSkillsTo) return { copied: [], updated: [], kept: [], skipped: [], records: [] };
  return projectSkills(root, SKILLS_DIR, adapter.projectsSkillsTo, known);
}

/**
 * The checksums of earlier projections are what tell our copy from an
 * edited one; a caller that didn't pass the previous record still has it on
 * disk — read before this run overwrites it.
 */
function knownProjections(root: string, previous: InstallRecord | null): { name: string; checksum: string }[] {
  return previous?.projections ?? readRecordFile(root, RECORD_PATH)?.projections ?? [];
}

function projectionNotes(r: ReturnType<typeof projectSkills>): string[] {
  const notes: string[] = [];
  if (r.copied.length > 0) notes.push(`skills projected to the target: ${r.copied.join(", ")}`);
  if (r.updated.length > 0) notes.push(`projected skills refreshed: ${r.updated.join(", ")}`);
  if (r.kept.length > 0) notes.push(`projected skills kept (local copy diverged from the projection): ${r.kept.join(", ")}`);
  if (r.skipped.length > 0) notes.push(`skills not projected (symlink): ${r.skipped.join(", ")}`);
  return notes;
}

/** Report lines for what the instruction migration did (SPEC-0024, FR-002). */
function instructionNotes(result: ReturnType<TargetAdapter["ensureInstructions"]>): string[] {
  if (!result) return [];
  const notes: string[] = [];
  if (result.migration.migrated.length > 0) notes.push(`instructions migrated to AGENTS.md: ${result.migration.migrated.join(", ")}`);
  if (result.migration.removed.length > 0) notes.push(`obsolete pointers removed: ${result.migration.removed.join(", ")}`);
  for (const q of result.migration.quarantined) notes.push(`block ${q.name} diverged: moved to .maestro/quarantine/${q.quarantinePath} and restored`);
  if (result.importAlreadyPresent) notes.push("CLAUDE.md already imports AGENTS.md outside a maestro block: no import block added");
  const f = result.foreign;
  if (f.moved.length > 0) notes.push(`third-party sections moved from CLAUDE.md to AGENTS.md: ${f.moved.join(", ")}`);
  if (f.deduplicated.length > 0) notes.push(`duplicate third-party sections removed from CLAUDE.md: ${f.deduplicated.join(", ")}`);
  if (f.conflicting.length > 0) notes.push(`third-party sections differ between CLAUDE.md and AGENTS.md, left as they are: ${f.conflicting.join(", ")}`);
  if (f.drifted.length > 0) notes.push(`foreign content changed since it was registered (not the maestro's to rewrite): ${f.drifted.join(", ")}`);
  return notes;
}

const hooksDir = (): string => resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "resources", "hooks");

/** The context-mode package's own hook manifest, resolved from this package's dependency, not from the target project. */
const contextModeHooksJson = (): string =>
  resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "node_modules", "context-mode", "hooks", "hooks.json");

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
    installed: [], skipped: [], migrated: 0, quarantined: [], planned: [], written: [], settings: null, record: null,
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

  // Canonical hooks plus the context-mode projection read from the
  // package's own manifest (FR-006). A script hook's fragment passes
  // through `resolveHookCommand` unchanged; a dispatch hook gets the
  // runtime shim (FR-008).
  const upstreamPath = opts.upstream?.contextModeHooksJson === undefined ? contextModeHooksJson() : opts.upstream.contextModeHooksJson;
  const upstream = upstreamPath === null ? { hooks: [] } : projectContextModeHooks(upstreamPath);
  const hooks = [...loadHooks(opts.hooksDir), ...upstream.hooks].map((h) => ({
    ...h,
    script: h.kind === "dispatch" ? resolveDispatchCommand(h.script, dependencyResolution) : resolveHookCommand(h.script, dependencyResolution),
  }));
  const { settings, installed: translated, skipped } = adapter.formatHooks(hooks, dependencyResolution);
  const planned = translated.map((h) => ({ name: h.name, target: targetSettings, event: h.event }));
  const hookNames = translated.map((h) => h.name);
  const upstreamNote = upstream.skipped ? `context-mode hooks skipped: ${upstream.skipped}` : null;
  const skippedNote = skipped.length > 0 ? `skipped: ${skipped.map((s) => `${s.name} (${s.reason})`).join(", ")}` : null;

  if (opts.dryRun === true) {
    return {
      ...empty, planned, settings, skipped,
      report: [`dry run: ${planned.length} hooks would be installed in ${targetSettings}`, skippedNote, upstreamNote].filter(Boolean).join("; "),
    };
  }

  const root = opts.root ?? process.cwd();
  const checksumEnv = realChecksumEnvironment(root);

  // Scripts are managed content: written once, compared by checksum after,
  // divergence quarantined (FR-002, PR-004). Runs on every write, including
  // the "already configured" path, because drift is exactly what that path
  // would otherwise miss.
  const writeScripts = (): WriteHookScriptsResult =>
    adapter.settingsPath ? writeHookScripts(root, translated, { registryEnv: checksumEnv }) : { written: [], unchanged: [], quarantined: [] };
  const missingScripts = (): boolean =>
    adapter.settingsPath !== null && translated.some((h) => h.kind === "script" && !existsSync(join(root, hookScriptPath(h.name))));

  // Already configured with the same set and version: nothing to do — but
  // matching hooks isn't enough. Skills and the Specsfy framework may have
  // been deleted outside `setup`, and "already configured" needs to be a
  // claim about the disk, not just about the record. The two extra checks
  // are cheap — filesystem, no subprocess — because calling the real
  // installers on every run just to find out whether there's anything to
  // do would pay an unnecessary cost in the common case, where nothing changed.
  // Matching names and version isn't enough once the settings can carry
  // the previous inline format or lack a script file: both mean the disk
  // doesn't yet reflect the record (FR-004).
  const hooksAlreadyDone =
    matches(opts.previous ?? null, hookNames, version) &&
    !(adapter.settingsPath && hasLegacyEntries(root, adapter.settingsPath, hookNames)) &&
    !missingScripts();

  // Hooks matching is the only fast path. Skills and the Specsfy framework
  // installers run on every call where they're configured — they're
  // idempotent by construction (SPEC-0025, FR-004), and a filesystem check
  // here can't tell "nothing to do" from "deleted outside setup and needs
  // reconciling" without literally reinstalling to find out. What used to
  // gate on that check now only gates asking for approval again, via the
  // approval registry below: a command already approved once, with the
  // same binary and argv, is skipped there regardless of this shortcut.
  const alreadyDone = hooksAlreadyDone && !opts.skills && !opts.specsfy && !bridgePending;
  if (alreadyDone) {
    // The router is idempotent via `createExtension` itself (refuses on a
    // name conflict) and isn't a third-party command, so it neither
    // blocks on nor depends on the rest already being pending (FR-086,
    // FR-087, DEC-083).
    let scripts: WriteHookScriptsResult = { written: [], unchanged: [], quarantined: [] };
    let instructions: string[] = [];
    let projection: ReturnType<typeof projectSkills> = { copied: [], updated: [], kept: [], skipped: [], records: [] };
    let nextNote: string | null = null;
    if (opts.write) {
      adapter.ensureDirectoryStructure(root);
      ensureStateDir(root);
      scripts = writeScripts();
      instructions = instructionNotes(adapter.ensureInstructions(root));
      deliverLocalSkills(root, adapter.skillDirs);
      projection = projectSkillsForTarget(root, adapter, knownProjections(root, opts.previous ?? null));
      if (projection.records.length > 0 || (opts.previous?.projections?.length ?? 0) > 0) {
        writeRecordFile(root, RECORD_PATH, { ...readRecord(opts.previous ?? null), projections: projection.records });
      }
      nextNote = nextStepsNote(assessConfiguration(root, adapter.name === "claude-code" ? "claude-code" : "antigravity"));
      ensureConfigYaml(root, nextNote);
    }
    const quarantined = scripts.quarantined.map((q) => q.quarantinePath);
    return {
      ...empty, installed: translated, settings, skipped, quarantined,
      record: readRecord(opts.previous ?? null),
      report: [
        `already configured: ${translated.length} hooks unchanged in ${targetSettings}`,
        ...scripts.quarantined.map((q) => `hook ${q.name} diverged: moved to .maestro/quarantine/${q.quarantinePath} and restored`),
        ...instructions,
        ...projectionNotes(projection),
        skippedNote,
        upstreamNote,
        nextNote,
      ].filter(Boolean).join("; "),
    };
  }

  // Dependency candidates: bin/args resolved without running anything
  // (fatia 1i, `PR-062`) — this is what makes the approval plan show the
  // real command, not a parallel description of what skills/Specsfy/the
  // bridge would do.
  //
  // Skills and Specsfy enter as candidates whenever configured — the same
  // pattern as `installSkills`/`installSpecsfy` below, which run
  // unconditionally whenever they're configured (SPEC-0025, FR-004),
  // leaving real idempotency inside each installer. What decides whether
  // THIS specific command was already approved before is the registry,
  // via `partitionByApproval` — not the hooks shortcut above.
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
    kind: h.kind, canonicalEvent: h.canonicalEvent, path: h.kind === "script" ? hookScriptPath(h.name) : h.command,
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
  const previousProjections = knownProjections(root, opts.previous ?? null);
  let migrated = 0;
  const quarantined: string[] = [];
  const notes: string[] = [];
  let nextNote: string | null = null;
  if (opts.write) {
    adapter.ensureDirectoryStructure(root);
    ensureStateDir(root);
    const scripts = writeScripts();
    written.push(...scripts.written);
    for (const q of scripts.quarantined) {
      quarantined.push(q.quarantinePath);
      notes.push(`hook ${q.name} diverged: moved to .maestro/quarantine/${q.quarantinePath} and restored`);
    }
    if (adapter.settingsPath && settings !== null) {
      const result = writeSettings(root, adapter.settingsPath, settings, hookNames);
      written.push(result.path);
      migrated = result.migrated;
      if (result.migrated > 0) notes.push(`${result.migrated} legacy inline entries migrated`);
      if (result.quarantined) {
        quarantined.push(result.quarantined);
        notes.push(`${adapter.settingsPath} was unreadable (invalid JSON): original kept in .maestro/quarantine/${result.quarantined}`);
      }
    }
    written.push(writeRecordFile(root, RECORD_PATH, record));
    // Same hook-plan approval already decided above — the router doesn't
    // go through the third-party batch dependency-approval registry
    // (SPEC-0010), because it isn't an external command (T018).
    notes.push(...instructionNotes(adapter.ensureInstructions(root)));
    deliverLocalSkills(root, adapter.skillDirs);
    const projection = projectSkillsForTarget(root, adapter, previousProjections);
    notes.push(...projectionNotes(projection));
    if (projection.records.length > 0) {
      record.projections = projection.records;
      writeRecordFile(root, RECORD_PATH, record);
    }
    nextNote = nextStepsNote(assessConfiguration(root, adapter.name === "claude-code" ? "claude-code" : "antigravity"));
    ensureConfigYaml(root, nextNote);
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
    installed: translated, skipped, migrated, quarantined, planned, written, settings, record, recordPath: RECORD_PATH,
    report: [
      `${translated.length} hooks installed in ${targetSettings}`,
      ...notes,
      skippedNote,
      upstreamNote,
      ...setsBySource.map((c) => c.report),
      framework?.report,
      bridge.refused ? `Python bridge: ${bridge.refused}` : null,
      nextNote,
      `run ${trace}`,
    ].filter(Boolean).join("; "),
    bridged: bridge.executed,
    exitCode: 0,
  };
}
