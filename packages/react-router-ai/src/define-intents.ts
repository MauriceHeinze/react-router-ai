import type {
  Intent,
  VoiceCommand,
  VoiceCommandParameterDefinition,
  VoiceCommandParameters,
} from "./types";

function ensureStringArray(value: string[] | readonly string[] | undefined, field: string, id: string) {
  if (!value) return;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim().length === 0)) {
    throw new Error(`Command "${id}" has an invalid "${field}" array.`);
  }
}

function ensureParameterDefinition(
  parameter: VoiceCommandParameterDefinition,
  parameterKey: string,
  commandId: string,
) {
  if (!parameter.label?.trim()) {
    throw new Error(`Command "${commandId}" parameter "${parameterKey}" needs a label.`);
  }

  if (parameter.type && !["string", "number", "boolean"].includes(parameter.type)) {
    throw new Error(`Command "${commandId}" parameter "${parameterKey}" has an invalid type.`);
  }

  if (parameter.options) {
    ensureStringArray(parameter.options, `parameters.${parameterKey}.options`, commandId);
  }
}

function ensureParameters(parameters: VoiceCommandParameters | undefined, commandId: string) {
  if (!parameters) return;
  if (typeof parameters !== "object" || Array.isArray(parameters)) {
    throw new Error(`Command "${commandId}" has invalid parameters.`);
  }

  for (const [parameterKey, parameter] of Object.entries(parameters)) {
    ensureParameterDefinition(parameter, parameterKey, commandId);
  }
}

export function defineVoiceCommands<TCommand extends VoiceCommand>(commands: TCommand[]): TCommand[] {
  const ids = new Set<string>();

  commands.forEach((command) => {
    if (!command.id?.trim()) throw new Error("Every command needs a non-empty id.");
    if (ids.has(command.id)) throw new Error(`Duplicate command id "${command.id}".`);
    ids.add(command.id);

    if (!command.title?.trim()) {
      throw new Error(`Command "${command.id}" needs a title.`);
    }

    if (typeof command.run !== "function") {
      throw new Error(`Command "${command.id}" needs a run handler.`);
    }

    ensureStringArray(command.phrases, "phrases", command.id);
    ensureStringArray(command.keywords, "keywords", command.id);
    ensureParameters(command.parameters, command.id);

    if (
      command.confirmation !== undefined &&
      typeof command.confirmation !== "boolean" &&
      typeof command.confirmation !== "string"
    ) {
      throw new Error(`Command "${command.id}" has an invalid confirmation value.`);
    }
  });

  return commands;
}

export function defineIntents(intents: Intent[]): Intent[] {
  const ids = new Set<string>();

  intents.forEach((intent) => {
    if (!intent.id?.trim()) throw new Error("Every intent needs a non-empty id.");
    if (ids.has(intent.id)) throw new Error(`Duplicate intent id "${intent.id}".`);
    ids.add(intent.id);

    if (!intent.title?.trim()) throw new Error(`Intent "${intent.id}" needs a title.`);
    if (intent.type === "navigation" && !intent.to?.trim()) {
      throw new Error(`Intent "${intent.id}" needs a destination path.`);
    }
    if (intent.type === "action" && !intent.action?.trim()) {
      throw new Error(`Intent "${intent.id}" needs an action name.`);
    }
    ensureStringArray(intent.phrases, "phrases", intent.id);
    ensureStringArray(intent.keywords, "keywords", intent.id);
  });

  return intents;
}

export const defineCommands = defineVoiceCommands;
