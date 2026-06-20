import type { AICommandItem, AICommandMatcher } from "./types";

export type OpenAICommandMatcherOptions = {
  apiKey: string;
  model?: string;
  endpoint?: string;
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
  serviceTier?: "auto" | "default" | "flex" | "priority";
  pageContext?: string;
  maxCandidates?: number;
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
    keywords: item.keywords ?? [],
  };
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
  } = options;

  return async (query, candidates) => {
    const items = maxCandidates ? candidates.slice(0, maxCandidates) : candidates;
    if (items.length === 0) return null;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
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
              ...(pageContext ? [`Current page: ${pageContext}`] : []),
            ].join("\n"),
          },
          {
            role: "user",
            content: `Available commands: ${JSON.stringify(items.map(serializeItem))}`,
          },
          {
            role: "user",
            content: `query: ${query}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "select_command",
              description: "Return the best matching command for the user request.",
              parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                  commandId: {
                    type: "string",
                    enum: items.map((item) => item.id),
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

    const parsed = JSON.parse(rawArguments) as { commandId?: string };
    if (!parsed.commandId) return null;

    return items.find((item) => item.id === parsed.commandId) ?? null;
  };
}
