import { neon } from '@neondatabase/serverless'
import { createPrompt } from './semantic-command-matcher.ts'

type OpenAiCommandMatcherOptions = {
  apiKey?: string
  model?: string
  pageContext?: string
  neonDatabaseUrl?: string
  candidateLimit?: number
}

type ChatCompletionToolCall = {
  id: string
  type: 'function'
  function?: {
    name?: string
    arguments?: string
  }
}

type ChatCompletionMessage = {
  role?: string
  content?: string | null
  tool_calls?: ChatCompletionToolCall[]
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: ChatCompletionMessage
  }>
}

async function createOpenAiCommandMatcher(params: {
  apiKey: string
  model: string
  messages: Array<Record<string, unknown>>
  tools: Array<Record<string, unknown>>
  toolChoice: Record<string, unknown>
}): Promise<ChatCompletionResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(
      `OpenAI command matching failed (${response.status}). ${errorText}`,
    )
  }

  return (await response.json()) as ChatCompletionResponse
}

export { createOpenAiCommandMatcher }
export const createOpenAICommandMatcher = createOpenAiCommandMatcher