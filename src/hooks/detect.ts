import {
  DEFAULT_TARGET,
  KNOWN_TARGETS as REGISTRY_KNOWN_TARGETS,
  detectTarget as registryDetectTarget,
} from "../targets/registry.js";
import type { TargetEnvironment as RegistryTargetEnvironment, DetectionResult } from "../targets/adapter.js";

export type TargetEnvironment = RegistryTargetEnvironment;
export type Detection = DetectionResult;

export const TARGET = DEFAULT_TARGET;
export const KNOWN_TARGETS = REGISTRY_KNOWN_TARGETS;

export function detectTarget(env: TargetEnvironment, explicitTarget?: string): Detection {
  return registryDetectTarget(env, explicitTarget);
}
