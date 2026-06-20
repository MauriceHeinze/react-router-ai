import type { BuiltInLlmFallbackOptions, VoiceCommand } from "./types";

const VALUE_NORMALIZATION_PROMPT =
  'Normalize common spoken contact values into their typed form. For example, convert "hello at googlemail.com" to "hello@googlemail.com".';
const COMMAND_CATALOG_PREFIX = "Available commands: ";

export type OpenAiVoiceCommandMatcherOptions = {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
  serviceTier?: "auto" | "default" | "flex" | "priority";
  pageContext?: string;
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

function serializeCommand(command: VoiceCommand) {
  const parameters = command.parameters
    ? Object.fromEntries(
        Object.entries(command.parameters).map(([key, definition]) => [
          key,
          {
            ...(definition.options?.length ? { options: definition.options } : {}),
            ...(!definition.options?.length && definition.type ? { type: definition.type } : {}),
          },
        ]),
      )
    : undefined;

  return {
    id: command.id,
    ...(command.description ? { description: command.description } : {}),
    phrases: command.phrases ?? [],
    keywords: command.keywords ?? [],
    ...(parameters ? { parameters } : {}),
  };
}

function buildMessageContext(options: OpenAiVoiceCommandMatcherOptions) {
  const pageContext = options.pageContext?.trim();
  return pageContext ? [`Current page: ${pageContext}`] : [];
}

export function createOpenAiVoiceCommandMatcher(
  options: OpenAiVoiceCommandMatcherOptions = {},
): NonNullable<BuiltInLlmFallbackOptions["match"]> {
  const {
    apiKey,
    model = "gpt-5-nano",
    endpoint = "https://api.openai.com/v1/chat/completions",
    reasoningEffort = "minimal",
    serviceTier,
  } = options;

  return async (query, commands) => {
    if (!apiKey) return null;

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
              "If the user wants to open or manage a page, choose the page command.",
              "If the user includes a target setting value, choose the setting command and fill parameters.",
              "If the user names only a field, choose the page that owns it.",
              ...buildMessageContext(options),
              'The parameters object must contain only the actual values the user provided, keyed by parameter name (e.g. {"value": "dark"}).',
              VALUE_NORMALIZATION_PROMPT,
              "Do not return parameter definitions, schemas, or option lists.",
              "If a value is missing, omit the parameter or set it to null.",
              "Return tool arguments only.",
            ].join("\n"),
          },
          {
            role: "user",
            content: `${COMMAND_CATALOG_PREFIX}${JSON.stringify(commands.map(serializeCommand))}`,
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
                    enum: commands.map((command) => command.id),
                  },
                  confidence: {
                    type: "number",
                  },
                  parameters: {
                    type: "object",
                    additionalProperties: true,
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

    const parsed = JSON.parse(rawArguments) as {
      commandId?: string;
      confidence?: number;
      parameters?: Record<string, unknown>;
    };

    return {
      commandId: parsed.commandId ?? null,
      confidence: parsed.confidence,
      parameters: parsed.parameters,
    };
  };
}
