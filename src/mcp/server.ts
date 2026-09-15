import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readVersion } from "../version.js";
import { TOOL_NAME, TOOL_DESCRIPTION, inputShape, executeSetup } from "./tool.js";

/** Name the server identifies itself with in the handshake. */
export const SERVER_NAME = "maestro";

/**
 * Assembles the server with this fatia's single tool.
 *
 * The version comes from `readVersion()`, the same source the terminal
 * command reports, so the two entry points can't drift apart by accident.
 */
export function createServer(): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: readVersion() });

  /**
   * `outputSchema` is deliberately not declared here: the SDK's Zod v3
   * conversion path (`zod-to-json-schema`, pinned via
   * `@modelcontextprotocol/sdk`) always stamps a draft-07 `$schema`, with no
   * option to target 2020-12 — and some MCP clients validate an advertised
   * `outputSchema` against 2020-12 before ever calling the tool, rejecting
   * it outright. `tool.ts`'s `outputShape` still documents and shapes
   * `structuredContent`; the client just doesn't get a formal schema for it.
   * Revisit once the project migrates off Zod v3 (see `outputShape`'s
   * docstring in `tool.ts`).
   */
  server.registerTool(
    TOOL_NAME,
    { description: TOOL_DESCRIPTION, inputSchema: inputShape },
    async (args) => executeSetup(args),
  );

  return server;
}
