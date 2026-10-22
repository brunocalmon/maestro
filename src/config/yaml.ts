import { Document, parseDocument } from "yaml";
import { SCHEMA_KEYS, type ConfigDocument } from "./schema.js";

const SECTION_COMMENTS: Record<string, string> = {
  language:
    "Reply follows the conversation's language. A generated document uses \"default\", except paths listed in \"exceptions\".",
  project:
    "Project stack metadata. Describe the current project stack here.",
  system: "Machine/environment profile. \"os\" is auto-detected; the rest can be filled by asking the agent to interview you.",
  git: "Controls what this project ignores in git. \"default\" applies to any group without an explicit \"ignored\".",
};

/** Renders a fresh document with section comments — used only for the create-when-absent path (FR-001). */
export function serialize(doc: ConfigDocument): string {
  const document = new Document(doc);
  const contents = document.contents;
  if (contents && "items" in contents) {
    for (const pair of (contents as { items: { key?: { value?: unknown; commentBefore?: string } }[] }).items) {
      const key = pair.key?.value;
      if (typeof key === "string" && key in SECTION_COMMENTS) {
        pair.key!.commentBefore = ` ${SECTION_COMMENTS[key]}`;
      }
    }
  }
  return document.toString();
}

export function parse(text: string): Document.Parsed {
  return parseDocument(text);
}

function resolveDefault(defaults: ConfigDocument, segments: string[]): unknown {
  let cursor: unknown = defaults;
  for (const segment of segments) {
    cursor = (cursor as Record<string, unknown> | undefined)?.[segment];
  }
  return cursor;
}

/** Adds only the keys `SCHEMA_KEYS` declares missing — never touches a key already present (FR-008, NFR-001). */
export function mergeMissingKeys(document: Document.Parsed, defaults: ConfigDocument): boolean {
  let changed = false;
  for (const path of SCHEMA_KEYS) {
    const segments = path.split(".");
    if (!document.hasIn(segments)) {
      document.setIn(segments, resolveDefault(defaults, segments));
      changed = true;
    }
  }
  return changed;
}
