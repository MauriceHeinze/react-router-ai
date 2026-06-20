import type { BuiltInLlmFallbackOptions, VoiceCommand } from "./types";

export type OpenAiVoiceCommandMatcherOptions = {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
  serviceTier?: "auto" | "default" | "flex" | "priority";
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
  return {
    id: command.id,
    title: command.title,
    phrases: command.phrases ?? [],
    keywords: command.keywords ?? [],
    parameters: command.parameters ?? {},
  };
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
            content:
              "Select exactly one app command for the user query. If the user wants to open or manage a page, choose the page command. If the user includes a target setting value, choose the setting command and fill parameters. If the user names only a field, choose the page that owns it. Return tool arguments only.",
          },
          {
            role: "user",
            content: `query: ${query}\ncommands: ${JSON.stringify(commands.map(serializeCommand))}`,
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
