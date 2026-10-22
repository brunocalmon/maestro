import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, modelFake, capacityFake, ollamaPresent } from "./models-fixtures";

const CREDENTIAL_VARIABLES = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GOOGLE_API_KEY",
  "OLLAMA_API_KEY",
  "CLAUDE_API_KEY",
];

describe("AC-102 — no credential environment variable is read during the calculation", () => {
  // TRACEABILITY: FR-037 NFR-033 NFR-034 NFR-035 AC-102
  it("the result doesn't change based on the absence of these variables, without throwing", () => {
    const original = CREDENTIAL_VARIABLES.map((name) => [name, process.env[name]] as const);
    try {
      for (const name of CREDENTIAL_VARIABLES) process.env[name] = "fake-present-value";
      const models = [modelFake("qwen2.5:3b", 2)];
      const withCredentials = recommend(backendsFake(["pi"]), ollamaPresent(models), capacityFake(10));

      for (const name of CREDENTIAL_VARIABLES) delete process.env[name];
      let withoutCredentials;
      expect(() => {
        withoutCredentials = recommend(backendsFake(["pi"]), ollamaPresent(models), capacityFake(10));
      }).not.toThrow();

      expect(withoutCredentials).toEqual(withCredentials);
    } finally {
      for (const [name, value] of original) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
  });
});
