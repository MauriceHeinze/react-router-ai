import { createOpenAiVoiceCommandMatcher, type OpenAiVoiceCommandMatcherOptions } from 'react-router-ai'

export function createOpenAiCommandMatcher(
  options: OpenAiVoiceCommandMatcherOptions = {},
) {
  return createOpenAiVoiceCommandMatcher({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY as string | undefined,
    model: 'gpt-5-nano',
    serviceTier: 'priority',
    ...options,
  })
}
