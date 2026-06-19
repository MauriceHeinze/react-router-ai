import type {
  BuiltInLlmFallbackOptions,
  Intent,
  IntentMatch,
  LanguageModelAvailability,
  LanguageModelSession,
  VoiceCommand,
  VoiceCommandMatch,
} from "./types";

const DEFAULT_PROMPT_PREFIX =
  "You map user requests to one voice command id from the provided catalog.";

function getLanguageModel() {
  if (typeof window === "undefined") return null;
  return window.LanguageModel ?? null;
}

function serializeCommand(command: VoiceCommand) {
  return {
    id: command.id,
    title: command.title,
    description: command.description ?? "",
    phrases: command.phrases ?? [],
    keywords: command.keywords ?? [],
    parameters: command.parameters ?? {},
    confirmation: command.confirmation ?? false,
  };
}

function buildPrompt(
  query: string,
  commands: VoiceCommand[],
  options?: BuiltInLlmFallbackOptions,
) {
  return [
    options?.promptPrefix?.trim() || DEFAULT_PROMPT_PREFIX,
    'Return strict JSON with this shape: {"commandId":"string|null","confidence":0-1,"parameters":{},"reason":"string"}.',
    'If no command is a reasonable match, return {"commandId":null,"confidence":0,"parameters":{},"reason":"no-match"}.',
    `User query: ${JSON.stringify(query)}`,
    `Available commands: ${JSON.stringify(commands.map(serializeCommand))}`,
  ].join("\n");
}

function buildMultiplePrompt(
  query: string,
  commands: VoiceCommand[],
  options?: BuiltInLlmFallbackOptions,
) {
  return [
    options?.promptPrefix?.trim() || DEFAULT_PROMPT_PREFIX,
    'Return strict JSON array with up to 3 matches in this shape: [{"commandId":"string","confidence":0-1,"parameters":{},"reason":"string"}].',
    'If no command is a reasonable match, return an empty array [].',
    `User query: ${JSON.stringify(query)}`,
    `Available commands: ${JSON.stringify(commands.map(serializeCommand))}`,
  ].join("\n");
}

function parseResponse(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const json = fenced?.[1] ?? trimmed;
  return JSON.parse(json) as {
    commandId?: string | null;
    confidence?: number;
    parameters?: Record<string, unknown>;
  };
}

function parseMultipleResponse(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const json = fenced?.[1] ?? trimmed;
  const parsed = JSON.parse(json) as
    | { commandId?: string | null; confidence?: number; parameters?: Record<string, unknown> }[]
    | { commandId?: string | null; confidence?: number; parameters?: Record<string, unknown> };
  return Array.isArray(parsed) ? parsed : [parsed];
}

async function createSession() {
  const LanguageModel = getLanguageModel();
  if (!LanguageModel) return null;

  const availability = (await LanguageModel.availability()) as LanguageModelAvailability;
  if (availability === "unavailable") return null;

  return LanguageModel.create();
}

function toCommandMatch(
  query: string,
  command: VoiceCommand,
  parsed: { confidence?: number; parameters?: Record<string, unknown> },
): VoiceCommandMatch {
  return {
    command,
    query,
    confidence:
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(parsed.confidence, 1))
        : 0.5,
    source: "llm",
    parameters: parsed.parameters ?? {},
    missingParameters: [],
  };
}

export async function matchVoiceCommandWithBuiltInLlm(
  query: string,
  commands: VoiceCommand[],
  options?: BuiltInLlmFallbackOptions,
): Promise<VoiceCommandMatch | null> {
  if (options?.enabled === false) return null;

  const session: LanguageModelSession | null = await createSession();
  if (!session) return null;

  try {
    const raw = await session.prompt(buildPrompt(query, commands, options));
    const parsed = parseResponse(raw);

    if (!parsed.commandId) return null;

    const command = commands.find((candidate) => candidate.id === parsed.commandId);
    if (!command) return null;

    return toCommandMatch(query, command, parsed);
  } catch {
    return null;
  } finally {
    session.destroy?.();
  }
}

export async function matchVoiceCommandsWithBuiltInLlm(
  query: string,
  commands: VoiceCommand[],
  options?: BuiltInLlmFallbackOptions,
): Promise<VoiceCommandMatch[]> {
  if (options?.enabled === false) return [];

  const session: LanguageModelSession | null = await createSession();
  if (!session) return [];

  try {
    const raw = await session.prompt(buildMultiplePrompt(query, commands, options));
    const parsed = parseMultipleResponse(raw);

    const matches: VoiceCommandMatch[] = [];
    for (const item of parsed) {
      if (!item.commandId) continue;
      const command = commands.find((candidate) => candidate.id === item.commandId);
      if (!command) continue;
      matches.push(toCommandMatch(query, command, item));
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  } catch {
    return [];
  } finally {
    session.destroy?.();
  }
}

export async function matchIntentWithBuiltInLlm(
  query: string,
  intents: Intent[],
  options?: BuiltInLlmFallbackOptions,
): Promise<IntentMatch | null> {
  const commands: VoiceCommand[] = intents.map((intent) => ({
    id: intent.id,
    title: intent.title,
    description: intent.description,
    phrases: intent.phrases,
    keywords: intent.keywords,
    async run() {},
  }));

  const match = await matchVoiceCommandWithBuiltInLlm(query, commands, options);
  if (!match) return null;

  const intent = intents.find((candidate) => candidate.id === match.command.id);
  if (!intent) return null;

  return {
    intent,
    query: match.query,
    confidence: match.confidence,
    source: match.source,
  };
}

export async function matchIntentsWithBuiltInLlm(
  query: string,
  intents: Intent[],
  options?: BuiltInLlmFallbackOptions,
): Promise<IntentMatch[]> {
  const commands: VoiceCommand[] = intents.map((intent) => ({
    id: intent.id,
    title: intent.title,
    description: intent.description,
    phrases: intent.phrases,
    keywords: intent.keywords,
    async run() {},
  }));

  const matches = await matchVoiceCommandsWithBuiltInLlm(query, commands, options);

  return matches
    .map((match) => {
      const intent = intents.find((candidate) => candidate.id === match.command.id);
      if (!intent) return null;
      return {
        intent,
        query: match.query,
        confidence: match.confidence,
        source: match.source,
      } satisfies IntentMatch;
    })
    .filter((match): match is IntentMatch => match !== null);
}
