export interface LanguageException {
  id: string;
  paths: string[];
  language: string;
  reason: string;
}

export interface LanguageSection {
  default: string;
  exceptions: LanguageException[];
}

export interface ProjectSection {
  prog_lang: string;
  runtime: string;
  package_manager: string;
  framework: string;
  test_framework: string;
  documentation_style: string;
}

export interface SystemSection {
  os: string;
  distro: string;
  ram_gb: number | null;
  cpu: string;
  gpu: string;
  baremetal: boolean | null;
  container: boolean | null;
}

export interface GitGroup {
  description: string;
  paths: string[];
  ignored: boolean;
}

export interface GitSection {
  default: "ignored" | "tracked";
  groups: Record<string, GitGroup>;
}

/**
 * Como o maestro deve tratar uma propriedade durante o planejamento.
 *
 * `suggested` entra como ponto de partida: o planejamento pode propor algo
 * diferente, desde que explique o trade-off ao humano. `required` é
 * vinculante — se o maestro não puder respeitá-la, ele usa outro perfil ou
 * cria um subagent ad-hoc, nunca ignora a restrição (FR-001).
 */
export type PropertyMode = "suggested" | "required";

/**
 * Formato uniforme de toda propriedade configurável (`DEC-001`).
 *
 * A forma é sempre a mesma, mesmo no caso simples: uma única maneira de
 * escrever a mesma coisa elimina ambiguidade tanto para o parser quanto para
 * quem lê o arquivo.
 */
export interface ConfiguredProperty<T> {
  value: T;
  mode: PropertyMode;
}

/** Quem o agente é — `description` é o que o planejamento lê para casar perfil e tarefa. */
export interface AgentIdentity {
  name: ConfiguredProperty<string>;
  description: ConfiguredProperty<string>;
}

/** Como o agente pensa: modelo, quanto da janela de contexto usar antes de delegar, e esforço de raciocínio. */
export interface AgentCognition {
  model: ConfiguredProperty<string>;
  context_budget: ConfiguredProperty<number>;
  reasoning_effort: ConfiguredProperty<string>;
}

/** Como o agente se comporta — `behavior` substitui o padrão, `additional_behavior` soma a ele (`DEC-003`). */
export interface AgentInstruction {
  behavior: ConfiguredProperty<string>;
  additional_behavior: ConfiguredProperty<string>;
}

/** O que o agente pode fazer. `skills` aceita caminho para `.agents/skills/*` já instalada, sem duplicar. */
export interface AgentCapability {
  skills: ConfiguredProperty<string[]>;
  tools: ConfiguredProperty<string[]>;
  mcp_servers: ConfiguredProperty<string[]>;
}

/** Como o agente roda: subagent nativo da IDE, subprocesso de CLI externa, ou decisão do planejamento. */
export interface AgentExecution {
  runtime: ConfiguredProperty<"auto" | "native" | "cli">;
  concurrency: ConfiguredProperty<number>;
  /** Which of `SUPPORTED_AGENT_BACKENDS` runs a `runtime: cli` agent. Absent picks the first detected, in fixed order (`SPEC-0019`, `FR-004`). */
  cli_backend?: ConfiguredProperty<string>;
}

/** Um agente configurável — o próprio maestro ou um de seus subagents. */
export interface AgentProfile {
  identity: AgentIdentity;
  cognition: AgentCognition;
  instruction: AgentInstruction;
  capability: AgentCapability;
  execution: AgentExecution;
}

/**
 * Requisitos de um tipo de trabalho.
 *
 * `context_window_min` ausente significa tipo sem exigência de janela, o que
 * é diferente de exigir zero (`SPEC-0017`, `FR-002`).
 */
export interface TaskTypeRequirement {
  context_window_min?: ConfiguredProperty<number>;
}

/** O maestro é um perfil como os outros, mais a lista de subagents e os tipos de trabalho que reconhece. */
export interface MaestroSection extends AgentProfile {
  subagents: AgentProfile[];
  task_types: Record<string, TaskTypeRequirement>;
}

export interface ConfigDocument {
  language: LanguageSection;
  project: ProjectSection;
  system: SystemSection;
  git: GitSection;
  maestro: MaestroSection;
}

/** Every key the schema requires present — used to prove NFR-001 (never omitted). */
export const SCHEMA_KEYS: string[] = [
  "language.default",
  "language.exceptions",
  "project.prog_lang",
  "project.runtime",
  "project.package_manager",
  "project.framework",
  "project.test_framework",
  "project.documentation_style",
  "system.os",
  "system.distro",
  "system.ram_gb",
  "system.cpu",
  "system.gpu",
  "system.baremetal",
  "system.container",
  "git.default",
  "git.groups.common_rules_config",
  "git.groups.common_rules_state",
  "git.groups.installed_skills",
  "git.groups.code_review_graph",
  "git.groups.context_mode",
  "maestro.identity.name",
  "maestro.identity.description",
  "maestro.cognition.model",
  "maestro.cognition.context_budget",
  "maestro.cognition.reasoning_effort",
  "maestro.instruction.behavior",
  "maestro.instruction.additional_behavior",
  "maestro.capability.skills",
  "maestro.capability.tools",
  "maestro.capability.mcp_servers",
  "maestro.execution.runtime",
  "maestro.execution.concurrency",
  "maestro.subagents",
  "maestro.task_types",
];

export interface PlatformEnvironment {
  platform(): string;
}

/**
 * Fixed label-to-key mapping for `sync.ts` (DEC-003) — lives here so the
 * schema module stays the single place that names every `project.*` key.
 */
export const STACK_LABEL_TO_PROJECT_KEY: Record<string, keyof ProjectSection> = {
  Linguagem: "prog_lang",
  Runtime: "runtime",
  Testes: "test_framework",
  Framework: "framework",
  "Gerenciador de pacotes": "package_manager",
};

/** Diretório, dentro do projeto, onde cada agente guarda seus arquivos (`DEC-002`). */
export const AGENTS_DIR = ".maestro/subagents";

/** Sugestão (`suggested`) — o planejamento pode propor algo diferente, explicando o trade-off. */
function suggested<T>(value: T): ConfiguredProperty<T> {
  return { value, mode: "suggested" };
}

/** Obrigatória (`required`) — vinculante, o maestro respeita ou usa outro perfil. */
function required<T>(value: T): ConfiguredProperty<T> {
  return { value, mode: "required" };
}

/**
 * Perfil de fábrica do maestro.
 *
 * Os textos de identidade e comportamento não vivem aqui: são referências a
 * arquivos reais que a semeadura escreve em `.maestro/subagents/maestro/`
 * (`PR-001` — nada implícito, nada hardcoded). O default de execução é `auto`
 * e o modelo fica vazio para o planejamento recomendar o mais econômico
 * disponível no momento.
 */
function defaultMaestroProfile(): MaestroSection {
  return {
    identity: {
      name: required("maestro"),
      description: suggested(`${AGENTS_DIR}/maestro/description.md`),
    },
    cognition: {
      model: suggested(""),
      context_budget: suggested(0.7),
      reasoning_effort: suggested("medium"),
    },
    instruction: {
      behavior: suggested(`${AGENTS_DIR}/maestro/behavior.md`),
      additional_behavior: suggested(""),
    },
    capability: {
      skills: suggested([]),
      tools: suggested([]),
      mcp_servers: suggested([]),
    },
    execution: {
      runtime: suggested("auto"),
      concurrency: suggested(1),
    },
    subagents: [],
    // Ponto de partida, não taxonomia definitiva: os nomes não significam
    // nada para o código, que só compara o mínimo declarado contra a janela
    // do modelo. Acrescentar um tipo é editar este arquivo, não o código
    // (`DEC-002`). Os valores refletem janelas comuns hoje: 8k basta para um
    // ajuste pontual, 32k para trabalho sobre alguns arquivos, e 128k para
    // leitura ampla de repositório.
    task_types: {
      ajuste_pontual: { context_window_min: suggested(8_192) },
      trabalho_em_arquivos: { context_window_min: suggested(32_768) },
      leitura_ampla: { context_window_min: suggested(131_072) },
    },
  };
}

/** Pure default builder (FR-001–FR-004) — real evidence where known, empty otherwise, never omitted. */
export function buildDefaultConfig(env: PlatformEnvironment): ConfigDocument {
  return {
    language: {
      default: "en_US",
      exceptions: [],
    },
    project: {
      prog_lang: "",
      runtime: "",
      package_manager: "",
      framework: "",
      test_framework: "",
      documentation_style: "",
    },
    system: {
      os: env.platform(),
      distro: "",
      ram_gb: null,
      cpu: "",
      gpu: "",
      baremetal: null,
      container: null,
    },
    git: {
      default: "ignored",
      groups: {
        common_rules_config: {
          description: "config.yaml itself — shared across the team by default",
          paths: [".maestro/config.yaml"],
          ignored: false,
        },
        common_rules_state: {
          description: "maestro operational state (install.json, extensions.json, quarantine/)",
          paths: [".maestro/install.json", ".maestro/extensions.json", ".maestro/quarantine/"],
          ignored: true,
        },
        installed_skills: {
          description: "Skills installed for agents — reinstallable, like dependencies",
          paths: [".claude/skills/", ".agents/skills/"],
          ignored: true,
        },
        code_review_graph: {
          description: "code-review-graph analysis output — path not yet inspected in this project",
          paths: [],
          ignored: true,
        },
        context_mode: {
          description: "context-mode session/context-usage state — path not yet inspected in this project",
          paths: [],
          ignored: true,
        },
      },
    },
    maestro: defaultMaestroProfile(),
  };
}
