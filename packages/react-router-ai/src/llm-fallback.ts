import type {
  BuiltInLlmFallbackOptions,
  IntentMatch,
  NavigationIntent,
  LanguageModelAvailability,
  LanguageModelSession,
} from "./types";

const DEFAULT_PROMPT_PREFIX =
  "You map user navigation requests to one intent id from the provided catalog.";

function getLanguageModel() {
  if (typeof window === "undefined") return null;
  return window.LanguageModel ?? null;
}

function buildPrompt(
  query: string,
  intents: NavigationIntent[],
  options?: BuiltInLlmFallbackOptions,
) {
  return [
    options?.promptPrefix?.trim() || DEFAULT_PROMPT_PREFIX,
    'Return strict JSON with this shape: {"intentId":"string|null","confidence":0-1,"reason":"string"}.',
    'If no intent is a reasonable match, return {"intentId":null,"confidence":0,"reason":"no-match"}.',
    `User query: ${JSON.stringify(query)}`,
    `Available intents: ${JSON.stringify(
      intents.map((intent) => ({
        id: intent.id,
        title: intent.title,
        description: intent.description ?? "",
        phrases: intent.phrases ?? [],
        keywords: intent.keywords ?? [],
        to: intent.to,
      })),
    )}`,
  ].join("\n");
}

function parseResponse(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const json = fenced?.[1] ?? trimmed;
  return JSON.parse(json) as {
    intentId?: string | null;
    confidence?: number;
  };
}

function parseMultipleResponse(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const json = fenced?.[1] ?? trimmed;
  const parsed = JSON.parse(json) as
    | { intentId?: string | null; confidence?: number }[]
    | { intentId?: string | null; confidence?: number };
  return Array.isArray(parsed) ? parsed : [parsed];
}

async function createSession() {
  const LanguageModel = getLanguageModel();
  if (!LanguageModel) return null;

  const availability = (await LanguageModel.availability()) as LanguageModelAvailability;
  if (availability === "unavailable") return null;

  return LanguageModel.create();
}

export async function matchIntentWithBuiltInLlm(
  query: string,
  intents: NavigationIntent[],
  options?: BuiltInLlmFallbackOptions,
): Promise<IntentMatch | null> {
  if (options?.enabled === false) return null;

  const session: LanguageModelSession | null = await createSession();
  if (!session) return null;

  try {
    const raw = await session.prompt(buildPrompt(query, intents, options));
    const parsed = parseResponse(raw);

    if (!parsed.intentId) return null;

    const intent = intents.find((candidate) => candidate.id === parsed.intentId);
    if (!intent) return null;

    return {
      intent,
      query,
      confidence:
        typeof parsed.confidence === "number"
          ? Math.max(0, Math.min(parsed.confidence, 1))
          : 0.5,
      source: "llm",
    };
  } catch {
    return null;
  } finally {
    session.destroy?.();
  }
}

function buildMultiplePrompt(
  query: string,
  intents: NavigationIntent[],
  options?: BuiltInLlmFallbackOptions,
) {
  return [
    options?.promptPrefix?.trim() || DEFAULT_PROMPT_PREFIX,
    'Return strict JSON array with up to 3 matches in this shape: [{"intentId":"string","confidence":0-1,"reason":"string"}].',
    'If no intent is a reasonable match, return an empty array [].',
    `User query: ${JSON.stringify(query)}`,
    `Available intents: ${JSON.stringify(
      intents.map((intent) => ({
        id: intent.id,
        title: intent.title,
        description: intent.description ?? "",
        phrases: intent.phrases ?? [],
        keywords: intent.keywords ?? [],
        to: intent.to,
      })),
    )}`,
  ].join("\n");
}

export async function matchIntentsWithBuiltInLlm(
  query: string,
  intents: NavigationIntent[],
  options?: BuiltInLlmFallbackOptions,
): Promise<IntentMatch[]> {
  if (options?.enabled === false) return [];

  const session: LanguageModelSession | null = await createSession();
  if (!session) return [];

  try {
    const raw = await session.prompt(buildMultiplePrompt(query, intents, options));
    const parsed = parseMultipleResponse(raw);

    const matches: IntentMatch[] = [];
    for (const item of parsed) {
      if (!item.intentId) continue;
      const intent = intents.find((candidate) => candidate.id === item.intentId);
      if (!intent) continue;
      matches.push({
        intent,
        query,
        confidence:
          typeof item.confidence === "number"
            ? Math.max(0, Math.min(item.confidence, 1))
            : 0.5,
        source: "llm",
      });
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  } catch {
    return [];
  } finally {
    session.destroy?.();
  }
}
