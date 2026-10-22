import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/mcp/server";
import { readVersion } from "../src/version";

/** Connects a client to the server over an in-memory transport, no subprocess. */
async function connect(): Promise<Client> {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0.0.0" });
  await Promise.all([createServer().connect(serverSide), client.connect(clientSide)]);
  return client;
}

describe("AC-001 — the listing returns only setup", () => {
  // TRACEABILITY: US-001 FR-001 AC-001
  it("exactly one tool exists", async () => {
    expect((await (await connect()).listTools()).tools).toHaveLength(1);
  });

  // TRACEABILITY: US-001 FR-001 AC-001
  it("it's called setup", async () => {
    expect((await (await connect()).listTools()).tools[0]?.name).toBe("setup");
  });

  // TRACEABILITY: US-001 NFR-002 AC-001
  it("its schema declares project_root as required", async () => {
    const tool = (await (await connect()).listTools()).tools[0];
    expect(tool?.inputSchema?.properties).toHaveProperty("project_root");
    expect(tool?.inputSchema?.required).toContain("project_root");
  });
});

describe("AC-010 — no surface from the remaining fatias appears", () => {
  // TRACEABILITY: US-001 FR-001 AC-010
  it("there's no approval, agent detection or model selection tool", async () => {
    const names = (await (await connect()).listTools()).tools.map((t) => t.name);
    for (const n of names) expect(n).toBe("setup");
  });

  // TRACEABILITY: US-001 NFR-002 AC-010
  it("the terminal command's surface doesn't gain its own MCP tool", async () => {
    const { COMMANDS } = await import("../src/cli");
    // The list grows as slices land — `plan` arrived with SPEC-0016. What
    // this guards isn't the size of the CLI, it's that the MCP server keeps
    // exactly one tool while the CLI grows (checked above): every command
    // here must have no counterpart there.
    expect(Object.keys(COMMANDS).sort()).toEqual(["doctor", "extension", "plan", "recommend", "report", "run", "setup", "version"]);
    const tools = (await (await connect()).listTools()).tools.map((tool) => tool.name);
    for (const command of Object.keys(COMMANDS)) {
      if (command !== "setup") expect(tools).not.toContain(command);
    }
  });
});

describe("AC-013 — the server identifies itself to the client", () => {
  // TRACEABILITY: US-001 FR-001 AC-013
  it("declares its name", async () => {
    expect((await connect()).getServerVersion()?.name).toBe("maestro");
  });

  // TRACEABILITY: US-001 NFR-002 AC-013
  it("declares the same version the terminal command reports", async () => {
    expect((await connect()).getServerVersion()?.version).toBe(readVersion());
  });
});
