export interface RecordEntry {
  /** Canonical name of the installed hook. */
  name: string;
  /** Path, relative to the project, where the entry was written. */
  target: string;
  /** Version of the package that installed it, to detect drift. */
  version: string;
  /** Moment of installation, in ISO 8601. */
  installedAt: string;
  /** Event under which the entry sits in the target, to locate it on removal. */
  event: string;
  /** `script` (file in .maestro/hooks/) or `dispatch` (binary invoked directly). Absent in records written before SPEC-0022. */
  kind?: "script" | "dispatch";
  /** The hook's own event name (`before-tool`, `on-prompt`, ...), independent of the target's naming. Absent before SPEC-0022. */
  canonicalEvent?: string;
  /** Script path relative to the project, or the dispatch command. Absent in records written before SPEC-0022. */
  path?: string;
}

/** Provenance of a skill set, read from the installer's lockfile. */
export interface SkillsRecordEntry {
  name: string;
  source: string;
  sourceType: string;
  skillPath: string;
  computedHash: string;
  installedAt: string;
}

export interface InstallRecord {
  target: string;
  version: string;
  /** Identifier of the run that wrote this record. Absent in records written before SPEC-0006. */
  trace?: string;
  hooks: RecordEntry[];
  /** Installed sets, when skills were installed. */
  skills?: SkillsRecordEntry[];
  /** Skills copied from `.agents/skills` into the target's directory, with the checksum of each copy (SPEC-0024). */
  projections?: { name: string; checksum: string }[];
}

/** Record path, always inside the project. */
export const RECORD_PATH = ".maestro/install.json";

/**
 * Normalizes a record read from disk.
 *
 * Accepts the object already in memory, not a path, so the read is
 * verifiable without touching the filesystem.
 */
export function readRecord(raw: InstallRecord | string | null): InstallRecord {
  if (raw === null) return { target: "", version: "", hooks: [] };
  const o = typeof raw === "string" ? (JSON.parse(raw) as InstallRecord) : raw;
  return { target: o.target ?? "", version: o.version ?? "", hooks: [...(o.hooks ?? [])] };
}

/** Serializes the record. Returns the normalized object, to check the round trip. */
export function writeRecord(record: InstallRecord): InstallRecord {
  return readRecord(JSON.parse(JSON.stringify(record)) as InstallRecord);
}

/**
 * Lists what needs to be removed to undo the installation.
 *
 * Each item carries a path and event because removal requires locating
 * the entry inside the target file, not deleting the whole file: it may
 * contain third-party configuration the tool preserved while writing.
 */
export function entriesToRemove(record: InstallRecord): { target: string; event: string; name: string }[] {
  return readRecord(record).hooks.map((h) => ({ target: h.target, event: h.event, name: h.name }));
}

/** Decides whether the record describes the same set that's about to be installed. */
export function matches(record: InstallRecord | null, names: readonly string[], version: string): boolean {
  if (record === null) return false;
  const r = readRecord(record);
  if (r.version !== version) return false;
  const installed = r.hooks.map((h) => h.name).sort();
  return installed.length === names.length && installed.every((n, i) => n === [...names].sort()[i]);
}
