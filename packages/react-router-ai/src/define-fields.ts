import { defineVoiceCommands } from "./define-intents";
import type {
  VoiceCommand,
  VoiceCommandHighlight,
  VoiceCommandParameterDefinition,
  VoiceField,
  VoiceFieldCommandOptions,
} from "./types";

function ensureStringArray(value: string[] | readonly string[] | undefined, field: string, id: string) {
  if (!value) return;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim().length === 0)) {
    throw new Error(`Field "${id}" has an invalid "${field}" array.`);
  }
}

function ensureField(field: VoiceField<any>) {
  if (!field.id?.trim()) throw new Error("Every field needs a non-empty id.");
  if (!field.label?.trim()) throw new Error(`Field "${field.id}" needs a label.`);
  if (typeof field.write !== "function") throw new Error(`Field "${field.id}" needs a write handler.`);
  if (!["boolean", "enum", "string", "number"].includes(field.type)) {
    throw new Error(`Field "${field.id}" has an invalid type.`);
  }

  ensureStringArray(field.phrases, "phrases", field.id);
  ensureStringArray(field.keywords, "keywords", field.id);

  if (field.route !== undefined && field.route.trim().length === 0) {
    throw new Error(`Field "${field.id}" has an invalid route.`);
  }

  if (field.highlight && !field.highlight.targetId.trim()) {
    throw new Error(`Field "${field.id}" has an invalid highlight target.`);
  }

  if (field.read !== undefined && typeof field.read !== "function") {
    throw new Error(`Field "${field.id}" has an invalid read handler.`);
  }

  if (
    field.confirmation !== undefined &&
    typeof field.confirmation !== "boolean" &&
    typeof field.confirmation !== "string"
  ) {
    throw new Error(`Field "${field.id}" has an invalid confirmation value.`);
  }

  if (field.type === "enum") {
    if (!field.options?.length) {
      throw new Error(`Field "${field.id}" needs options for enum fields.`);
    }
    ensureStringArray(field.options, "options", field.id);
  }
}

function normalizeLabel(label: string) {
  return label.trim().toLowerCase();
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function buildPhrases(field: VoiceField<any>) {
  if (field.phrases?.length) return field.phrases;

  const label = normalizeLabel(field.label);
  const phrases = [`set ${label}`, `change ${label}`];

  if (field.type === "boolean") {
    phrases.push(`turn on ${label}`, `turn off ${label}`, `enable ${label}`, `disable ${label}`);
  }

  return phrases;
}

function buildKeywords(field: VoiceField<any>) {
  if (field.keywords?.length) return field.keywords;

  const keywords = [...tokenize(field.label)];
  if (field.type === "boolean") {
    keywords.push("on", "off", "enable", "disable");
  }
  if (field.type === "enum") {
    for (const option of field.options ?? []) {
      keywords.push(...tokenize(option));
    }
  }

  return unique(keywords);
}

function buildParameter(field: VoiceField<any>): VoiceCommandParameterDefinition {
  if (field.type === "enum") {
    return {
      label: field.label,
      options: field.options,
    };
  }

  return {
    label: field.label,
    type: field.type,
  };
}

function isValidValue(field: VoiceField<any>, value: unknown) {
  if (field.type === "boolean") return typeof value === "boolean";
  if (field.type === "number") return typeof value === "number" && Number.isFinite(value);
  if (field.type === "string") return typeof value === "string" && value.trim().length > 0;
  if (field.type === "enum") return typeof value === "string" && (field.options ?? []).includes(value);
  return false;
}

function toVoiceCommand(field: VoiceField<any>, options: VoiceFieldCommandOptions): VoiceCommand {
  const highlight: VoiceCommandHighlight = field.highlight ?? {
    targetId: field.id,
    kind: "field",
  };

  return {
    id: `${field.id}.set`,
    title: `Set ${field.label}`,
    description: field.description,
    phrases: buildPhrases(field),
    keywords: buildKeywords(field),
    parameters: {
      value: buildParameter(field),
    },
    confirmation: field.confirmation,
    highlight,
    read: field.read,
    async run({ value }) {
      if (!isValidValue(field, value)) return;
      await field.write(value);
      if (field.route && options.navigate) {
        options.navigate(field.route);
      }
    },
  };
}

export function defineVoiceFieldCommands<TField extends VoiceField<any>>(
  fields: readonly TField[],
  options: VoiceFieldCommandOptions = {},
): VoiceCommand[] {
  fields.forEach(ensureField);
  return defineVoiceCommands(fields.map((field) => toVoiceCommand(field, options)));
}
