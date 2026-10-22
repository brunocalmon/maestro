import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const PINNED: Record<string, string> = { "context-mode": "1.0.169" };
const deps = () => JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf8")).dependencies ?? {};
describe("exact pinned runtime dependencies", () => {
  for (const [name, version] of Object.entries(PINNED)) it(`pins ${name} at ${version}`, () => expect(deps()[name]).toBe(version));
});
