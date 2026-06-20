import type { BuiltInLlmFallbackOptions, VoiceCommand } from 'react-router-ai'

type OpenAiCommandMatcherOptions = {
  apiKey?: string
  model?: string
  pageContext?: string
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      tool_calls?: Array<{
        function?: {
          arguments?: string
        }
      }>
    }
  }>
}

const COMMAND_CATALOG_PREFIX = 'Available commands: '

function serializeCommand(command: VoiceCommand) {
  return {
    id: command.id,
    title: command.title,
    description: command.description ?? '',
    phrases: command.phrases ?? [],
    keywords: command.keywords ?? [],
    parameters: command.parameters ?? {},
    confirmation: command.confirmation ?? false,
  }
}

export function createOpenAiCommandMatcher(
  options: OpenAiCommandMatcherOptions = {},
): NonNullable<BuiltInLlmFallbackOptions['match']> {
  const {
    apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined,
    model = 'gpt-5-nano',
    pageContext,
  } = options

  return async (query, commands) => {
    if (!apiKey) return null

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You map a user request to the best matching app command id. Prefer explicit navigation commands when the user wants to open, go to, or manage a page. Return tool arguments only.',
          },
          {
            role: 'user',
            content: `${COMMAND_CATALOG_PREFIX}${JSON.stringify(commands.map(serializeCommand))}`,
          },
          ...(pageContext
            ? [
                {
                  role: 'user' as const,
                  content: `Current page: ${pageContext}`,
                },
              ]
            : []),
          {
            role: 'user',
            content: `query: ${query}`,
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'select_commands',
              description: 'Return the best matching command ids for the user request.',
              parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  matches: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      properties: {
                        commandId: {
                          type: 'string',
                          enum: commands.map((command) => command.id),
                        },
                        confidence: {
                          type: 'number',
                        },
                        parameters: {
                          type: 'object',
                          additionalProperties: true,
                        },
                      },
                      required: ['commandId'],
                    },
                  },
                },
                required: ['matches'],
              },
            },
          },
        ],
        tool_choice: {
          type: 'function',
          function: {
            name: 'select_commands',
          },
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI command matching failed (${response.status}).`)
    }

    const data = (await response.json()) as ChatCompletionResponse
    const rawArguments = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments
    if (!rawArguments) return null

    const parsed = JSON.parse(rawArguments) as {
      matches?: Array<{
        commandId?: string
        confidence?: number
        parameters?: Record<string, unknown>
      }>
    }

    return (
      parsed.matches?.map((match) => ({
        commandId: match.commandId ?? null,
        confidence: match.confidence,
        parameters: match.parameters,
      })) ?? null
    )
  }
}
