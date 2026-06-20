import type { Intent, IntentMatch, VoiceCommand, VoiceCommandMatch } from "./types";

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeFreeformValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+at\s+/g, "@")
    .replace(/\s+dot\s+/g, ".")
    .replace(/\s*\.\s*/g, ".")
    .replace(/\s*@\s*/g, "@")
    .replace(/\s+/g, " ");
}

function toTokens(value: string) {
  return normalize(value).split(" ").filter(Boolean);
}

function includesPhrase(query: string, phrase: string) {
  if (!query || !phrase) return false;
  return query.includes(phrase);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toBooleanishValue(value: string) {
  const normalizedValue = normalize(value);
  if (
    ["on", "enable", "enabled", "true", "yes", "active", "activated"].includes(normalizedValue)
  ) {
    return true;
  }
  if (
    ["off", "disable", "disabled", "false", "no", "inactive", "deactivated"].includes(normalizedValue)
  ) {
    return false;
  }
  return null;
}

function resolveOption(query: string, options: readonly string[]) {
  const normalizedQuery = normalize(query);
  const queryBoolean = resolveBoolean(query);
  if (queryBoolean !== null) {
    const booleanishOption = options.find((option) => toBooleanishValue(option) === queryBoolean);
    if (booleanishOption) {
      return { value: booleanishOption, score: 0.95 };
    }
  }

  let best: { value: string; score: number } | null = null;

  for (const option of options) {
    const normalizedOption = normalize(option);
    if (!normalizedOption) continue;

    let score = 0;
    if (normalizedQuery === normalizedOption) score = 1;
    else if (includesPhrase(normalizedQuery, normalizedOption)) score = 0.95;
    else {
      const optionTokens = toTokens(normalizedOption);
      const queryTokens = new Set(toTokens(normalizedQuery));
      const tokenHits = optionTokens.filter((token) => queryTokens.has(token)).length;
      if (tokenHits > 0) {
        score = tokenHits / optionTokens.length;
      }
    }

    if (!best || score > best.score) {
      best = { value: option, score };
    }
  }

  return best && best.score >= 0.6 ? best : null;
}

function resolveBoolean(query: string) {
  const normalizedQuery = normalize(query);
  if (
    /\b(do not|don't|does not|doesn't|should not|shouldn't|not be|stop|without)\b/.test(
      normalizedQuery,
    )
  ) {
    return false;
  }
  if (/\b(on|enable|enabled|true|yes|activate|activated)\b/.test(normalizedQuery)) return true;
  if (/\b(off|disable|disabled|false|no|deactivate|deactivated)\b/.test(normalizedQuery)) return false;
  return null;
}

function resolveNumber(query: string) {
  const match = query.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveTrailingString(
  query: string,
  phrases: string[] | undefined,
  parameterLabel?: string,
) {
  const normalizedQuery = normalize(query);

  if (parameterLabel) {
    const normalizedLabel = escapeRegExp(normalize(parameterLabel));
    const labelPattern = new RegExp(
      `\\b${normalizedLabel.replace(/\s+/g, "\\s+")}\\b\\s+(?:to|as|with)\\s+(.+)$`,
      "i",
    );
    const labelMatch = query.match(labelPattern);
    if (labelMatch?.[1]) return normalizeFreeformValue(labelMatch[1]);
  }

  const commandPattern = /\b(?:set|change|update|rename|use)\b.+\b(?:to|as|with)\b\s+(.+)$/i;
  const commandMatch = query.match(commandPattern);
  if (commandMatch?.[1]) return normalizeFreeformValue(commandMatch[1]);

  for (const phrase of phrases ?? []) {
    const normalizedPhrase = normalize(phrase);
    if (!normalizedPhrase || !normalizedQuery.startsWith(normalizedPhrase)) continue;
    const remainder = normalizedQuery.slice(normalizedPhrase.length).trim();
    if (remainder) return normalizeFreeformValue(remainder.replace(/^(?:to|as|with)\s+/i, ""));
  }

  return null;
}

export function resolveCommandParameters(query: string, command: VoiceCommand) {
  const parameters = command.parameters;
  if (!parameters) {
    return {
      values: {} as Record<string, unknown>,
      matchedCount: 0,
      missing: [] as string[],
    };
  }

  const values: Record<string, unknown> = {};
  const missing: string[] = [];
  const parameterEntries = Object.entries(parameters);

  for (const [key, parameter] of parameterEntries) {
    let matched = false;

    if (parameter.options?.length) {
      const optionMatch = resolveOption(query, parameter.options);
      if (optionMatch) {
        values[key] = optionMatch.value;
        matched = true;
      }
    } else if (parameter.type === "boolean") {
      const value = resolveBoolean(query);
      if (value !== null) {
        values[key] = value;
        matched = true;
      }
    } else if (parameter.type === "number") {
      const value = resolveNumber(query);
      if (value !== null) {
        values[key] = value;
        matched = true;
      }
    }

    if (!matched && parameter.type !== "boolean" && parameter.type !== "number" && !parameter.options?.length) {
      if (parameterEntries.length === 1) {
        const value = resolveTrailingString(query, command.phrases, parameter.label);
        if (value) {
          values[key] = value;
          matched = true;
        }
      }
    }

    if (!matched) {
      missing.push(key);
    }
  }

  return {
    values,
    matchedCount: Object.keys(values).length,
    missing,
  };
}

function scoreCommand(query: string, command: VoiceCommand) {
  const normalizedQuery = normalize(query);
  const queryTokens = toTokens(query);

  if (!normalizedQuery || queryTokens.length === 0) {
    return {
      confidence: 0,
      parameters: {} as Record<string, unknown>,
      missingParameters: [] as string[],
    };
  }

  let score = 0;
  const title = normalize(command.title);
  const description = normalize(command.description ?? "");
  const phrases = (command.phrases ?? []).map(normalize);
  const keywords = (command.keywords ?? []).map(normalize);
  const haystack = [title, description, ...phrases, ...keywords].join(" ");
  const haystackTokens = new Set(toTokens(haystack));

  if (title.includes(normalizedQuery)) score += 0.5;
  if (phrases.some((phrase) => phrase === normalizedQuery)) score += 0.8;
  if (phrases.some((phrase) => phrase.includes(normalizedQuery))) score += 0.35;
  if (phrases.some((phrase) => normalizedQuery.includes(phrase))) score += 0.45;

  let tokenHits = 0;
  for (const token of queryTokens) {
    if (haystackTokens.has(token)) tokenHits += 1;
  }
  score += (tokenHits / queryTokens.length) * 0.6;

  const keywordHits = keywords.reduce((count, keyword) => count + (queryTokens.includes(keyword) ? 1 : 0), 0);
  if (keywords.length > 0) {
    score += (keywordHits / keywords.length) * 0.1;
  }

  if (description.includes(normalizedQuery)) score += 0.1;

  const parameterResolution = resolveCommandParameters(query, command);
  if (command.parameters) {
    const totalParameters = Object.keys(command.parameters).length;
    score += (parameterResolution.matchedCount / totalParameters) * 0.35;
    if (parameterResolution.matchedCount === 0) {
      score -= 0.15;
    }
  }

  return {
    confidence: Math.max(0, Math.min(score, 1)),
    parameters: parameterResolution.values,
    missingParameters: parameterResolution.missing,
  };
}

export function rankVoiceCommands(query: string, commands: VoiceCommand[]) {
  return commands
    .map((command) => {
      const scored = scoreCommand(query, command);
      return {
        command,
        query,
        confidence: scored.confidence,
        source: "fuzzy" as const,
        parameters: scored.parameters,
        missingParameters: scored.missingParameters,
      } satisfies VoiceCommandMatch;
    })
    .sort((a, b) => b.confidence - a.confidence);
}

export function matchVoiceCommand(
  query: string,
  commands: VoiceCommand[],
  threshold = 0.45,
): VoiceCommandMatch | null {
  const [best] = rankVoiceCommands(query, commands);
  if (!best || best.confidence < threshold) return null;
  return best;
}

function intentToCommand(intent: Intent): VoiceCommand<Record<string, unknown>> {
  return {
    id: intent.id,
    title: intent.title,
    description: intent.description,
    phrases: intent.phrases,
    keywords: intent.keywords,
    async run() {},
  };
}

export function matchIntent(query: string, intents: Intent[], threshold = 0.45): IntentMatch | null {
  const commands = intents.map(intentToCommand);
  const match = matchVoiceCommand(query, commands, threshold);
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
