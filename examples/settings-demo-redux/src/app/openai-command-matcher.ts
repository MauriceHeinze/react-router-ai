import { createOpenAICommandMatcher, type OpenAICommandMatcherOptions } from 'react-router-ai'

export function createOpenAiCommandMatcher(
  options: Partial<OpenAICommandMatcherOptions> = {},
) {
  return createOpenAICommandMatcher({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY as string,
    model: 'gpt-5-nano',
    reasoningEffort: 'minimal',
    ...options,
  })
}
