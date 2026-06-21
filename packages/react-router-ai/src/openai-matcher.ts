import type { AICommandItem, AICommandMatcher, AICommandMatcherResult } from "./types";

export type OpenAICommandMatcherFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type OpenAICommandMatcherOptions = {
  apiKey: string;
  model?: string;
  endpoint?: string;
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
  serviceTier?: "auto" | "default" | "flex" | "priority";
  pageContext?: string | (() => string | null | undefined);
  maxCandidates?: number;
  headers?: Record<string, string>;
  project?: string;
  organization?: string;
  fetch?: OpenAICommandMatcherFetch;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      tool_calls?: Array<{
        function?: {
          arguments?: string;
        };
      }>;
    };
  }>;
};

type ResolveIntentArgs = {
  matches?: Array<{ commandId: string | null; confidence?: number } | string | null>;
  message?: string | null;
  needsApproval?: boolean | null;
};

function serializeItem(item: AICommandItem) {
  return {
    id: item.id,
    value: item.value,
    ...(item.description ? { description: item.description } : {}),
    keywords: [...(item.keywords ?? [])].sort(),
  };
}

function resolvePageContext(
  pageContext?: string | (() => string | null | undefined),
): string | undefined {
  if (typeof pageContext === "function") {
    return pageContext() ?? undefined;
  }
  return pageContext ?? undefined;
}

function createDynamicRequestContext(query: string, pageContext?: string) {
  const parts = [];
  if (pageContext) {
    parts.push(`current_page: ${pageContext}`);
  }
  parts.push(`query: ${query}`);
  return parts.join("\n");
}

function getCommandIds(items: readonly AICommandItem[]) {
  return items.map((item) => item.id);
}

function normalizeMatches(raw: ResolveIntentArgs["matches"]): Array<string | null> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (entry === null) return null;
      if (typeof entry === "string") return entry;
      if (typeof entry === "object" && entry !== null && "commandId" in entry) {
        const id = (entry as { commandId?: unknown }).commandId;
        return typeof id === "string" ? id : null;
      }
      return null;
    })
    .filter((value, index, arr): value is string | null => arr.indexOf(value) === index);
}

export function createOpenAICommandMatcher(
  options: OpenAICommandMatcherOptions,
): AICommandMatcher {
  const {
    apiKey,
    model = "gpt-5-nano",
    endpoint = "https://api.openai.com/v1/chat/completions",
    reasoningEffort = "minimal",
    serviceTier,
    pageContext,
    maxCandidates,
    headers,
    project,
    organization,
    fetch: fetchImplementation,
  } = options;

  return async (query, candidates) => {
    if (!apiKey.trim()) {
      throw new Error("OpenAI API key is missing.");
    }

    const candidateLimit =
      maxCandidates === undefined ? undefined : Math.max(1, Math.floor(maxCandidates));
    const items = candidateLimit ? candidates.slice(0, candidateLimit) : candidates;
    if (items.length === 0) return null;
    const resolvedFetch = fetchImplementation ?? globalThis.fetch;
    if (!resolvedFetch) {
      throw new Error("OpenAI command matching requires fetch.");
    }

    const currentPageContext = resolvePageContext(pageContext);
    const commandIds = getCommandIds(items);

    const response = await resolvedFetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(organization ? { "OpenAI-Organization": organization } : {}),
        ...(project ? { "OpenAI-Project": project } : {}),
        ...headers,
      },
      body: JSON.stringify({
        model,
        reasoning_effort: reasoningEffort,
        ...(serviceTier ? { service_tier: serviceTier } : {}),
        messages: [
          {
            role: "system",
            content: [
              "Resolve the user's query against the provided app commands.",
              "Return between 0 and N matching command ids in `matches`, ordered by relevance.",
              "Return 1 command when the user clearly wants one action; return 2+ when the intent is ambiguous between commands; return 0 when nothing fits.",
              "Set `needsApproval` to true if the action is risky and should be confirmed before running.",
              "Use `message` to clarify or explain, addressed to the user.",
            ].join("\n"),
          },
          {
            role: "user",
            content: `Available commands: ${JSON.stringify(items.map(serializeItem))}`,
          },
          {
            role: "user",
            content: createDynamicRequestContext(query, currentPageContext),
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "resolve_intent",
              description:
                "Resolve the user query into zero, one, or more candidate commands. Use needsApproval when the action is risky.",
              parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      anyOf: [
                        { type: "string", enum: commandIds },
                        { type: "null" },
                      ],
                    },
                  },
                  message: { type: ["string", "null"] },
                  needsApproval: { type: ["boolean", "null"] },
                },
                required: ["matches"],
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: {
            name: "resolve_intent",
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI command matching failed (${response.status}).`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const rawArguments = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!rawArguments) return null;

    let parsed: ResolveIntentArgs;
    try {
      parsed = JSON.parse(rawArguments) as ResolveIntentArgs;
    } catch {
      return null;
    }

    const ids = normalizeMatches(parsed.matches).filter((value): value is string => Boolean(value));
    const matchedItems = ids
      .map((id) => items.find((item) => item.id === id))
      .filter((item): item is AICommandItem => Boolean(item));

    if (matchedItems.length === 0) {
      const noMatchMessage =
        typeof parsed.message === "string" && parsed.message.trim()
          ? parsed.message
          : undefined;
      const noMatchResult: AICommandMatcherResult = { kind: "no-match", message: noMatchMessage };
      return noMatchResult;
    }

    if (matchedItems.length === 1) {
      const executeResult: AICommandMatcherResult = {
        kind: "execute",
        item: matchedItems[0]!,
        ...(parsed.needsApproval === true ? { needsApproval: true } : {}),
        ...(typeof parsed.message === "string" && parsed.message.trim()
          ? { message: parsed.message }
          : {}),
      };
      return executeResult;
    }

    const clarifyResult: AICommandMatcherResult = {
      kind: "clarify",
      candidates: matchedItems,
      ...(typeof parsed.message === "string" && parsed.message.trim()
        ? { message: parsed.message }
        : {}),
    };
    return clarifyResult;
  };
}
