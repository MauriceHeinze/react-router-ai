import type { AICommandItem, AICommandMatcher } from "./types";

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
              "Select exactly one app command for the user query.",
              "Return the id of the command that best matches the user's intent.",
              "If none of the commands clearly fit, return null for commandId.",
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
              name: "select_command",
              description: "Return the best matching command for the user request, or null.",
              parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                  commandId: {
                    anyOf: [
                      {
                        type: "string",
                        enum: commandIds,
                      },
                      {
                        type: "null",
                      },
                    ],
                  },
                },
                required: ["commandId"],
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: {
            name: "select_command",
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

    let parsed: { commandId?: string | null };
    try {
      parsed = JSON.parse(rawArguments) as { commandId?: string | null };
    } catch {
      return null;
    }
    if (!parsed.commandId) return null;

    return items.find((item) => item.id === parsed.commandId) ?? null;
  };
}
