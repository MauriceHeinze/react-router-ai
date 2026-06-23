import weaviate from 'weaviate-client'
import type { WeaviateClient } from 'weaviate-client'

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

type OpenAiCommandMatcherResponse = {
  id?: string
  output_text?: string
  output?: Array<{
    type?: string
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
}

type WeaviateObject = {
  properties: Record<string, unknown>
}

type CreatePromptInput = {
  command: string
  currentPath?: string
  csv: string
}

type QueryRoutesInput = {
  client: WeaviateClient
  command: string
  limit?: number
}

type OpenAiCommandMatcherInput = {
  apiKey: string
  model: string
  prompt: string
}

const weaviateUrl =
  process.env.VITE_WEAVIATE_DATABASE_URL ??
  'YOUR_WEAVIATE_DATABASE_URL'

const weaviateApiKey =
  process.env.VITE_WEAVIATE_API_KEY ??
  'YOUR_API_KEY'

if (!weaviateUrl || !weaviateApiKey) {
  throw new Error('Missing Weaviate configuration.')
}

// function that connects to weaviate
export async function connectToWeaviate(): Promise<WeaviateClient> {
  return await weaviate.connectToWeaviateCloud(weaviateUrl, {
    authCredentials: new weaviate.ApiKey(weaviateApiKey),
  })
}

// function that queries weaviate db
export async function queryWeaviateRoutes({
  client,
  command,
  limit = 10,
}: QueryRoutesInput): Promise<WeaviateObject[]> {
  const routes = client.collections.use('Routes')

  const result = await routes.query.nearText(command, {
    limit,
  })

  return result.objects as WeaviateObject[]
}

// function that creates tokensaving csv
export function createTokenSavingCsv(objects: WeaviateObject[]): string {
  const rows = objects.map(toLlmCandidateRow).join('\n')

  return [
    'command_id,actionType,section,target,description,phrases',
    rows,
  ].join('\n')
}

// function to generate prompt
export function createPrompt(input: CreatePromptInput): string {
  return `command = ${JSON.stringify(input.command)}
currentPath = ${JSON.stringify(input.currentPath ?? '')}

[task]
instruction = "Pick the best matching candidate for the user command."

rules = [
  "Return null if no candidate is a reasonable match.",
  "Prefer navigation candidates when the user wants to open, go to, check, view, or manage a page.",
  "Prefer field or set_value candidates when the user wants to change, enable, disable, update, or set something.",
  "Use the commandId as identifier.",
]

return = "JSON only: { commandId: string | null, confidence: number }"
threshold = 0.5

[candidates]
format = "csv"
data = """
${input.csv}
"""`
}

// function calling openai
export async function callOpenAi({
  apiKey,
  model,
  prompt,
}: OpenAiCommandMatcherInput): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      reasoning: {
        effort: 'minimal',
      },
      max_output_tokens: 50,
      store: false,
      input: prompt,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(
      `OpenAI command matching failed (${response.status}). ${errorText}`,
    )
  }

  const data = (await response.json()) as OpenAiCommandMatcherResponse

  return (
    data.output
      ?.find((item) => item.type === 'message')
      ?.content
      ?.find((content) => content.type === 'output_text')
      ?.text ?? ''
  )
}

function toLlmCandidateRow(object: WeaviateObject): string {
  const p = object.properties

  const path = stringOrEmpty(p.path)
  const stateKey = stringOrEmpty(p.stateKey)

  const target =
    path && path !== 'null'
      ? path
      : stateKey && stateKey !== 'null'
        ? stateKey
        : ''

  const phrases = stringOrEmpty(p.phrasesKeywords).replaceAll(',', ' | ')

  return [
    cleanCsvText(p.command_id),
    cleanCsvText(p.actionType),
    cleanCsvText(p.section),
    cleanCsvText(target),
    cleanCsvText(p.description),
    cleanCsvText(phrases),
  ].join(',')
}

function cleanCsvText(value: unknown): string {
  return String(value ?? '')
    .replaceAll('\n', ' ')
    .replaceAll('\r', ' ')
    .replaceAll(',', ' ')
    .trim()
}

function stringOrEmpty(value: unknown): string {
  return String(value ?? '').trim()
}

// Example usage
// async function main() {
//   const command = 'check my cost'
//   const currentPath = '/settings/general'

//   const totalStartedAt = Date.now()
//   console.log(`[total] started at ${new Date(totalStartedAt).toISOString()}`)

//   const client = await connectToWeaviate()

//   try {
//     const weaviateStartedAt = Date.now()
//     console.log(`[weaviate] started at ${new Date(weaviateStartedAt).toISOString()}`)

//     const objects = await queryWeaviateRoutes({
//       client,
//       command,
//       limit: 10,
//     })

//     const weaviateEndedAt = Date.now()
//     console.log(`[weaviate] ended at ${new Date(weaviateEndedAt).toISOString()}`)
//     console.log(`[weaviate] duration ${weaviateEndedAt - weaviateStartedAt}ms`)

//     const promptStartedAt = Date.now()
//     console.log(`[prompt] started at ${new Date(promptStartedAt).toISOString()}`)

//     const csv = createTokenSavingCsv(objects)

//     const prompt = createPrompt({
//       command,
//       currentPath,
//       csv,
//     })

//     const promptEndedAt = Date.now()
//     console.log(`[prompt] ended at ${new Date(promptEndedAt).toISOString()}`)
//     console.log(`[prompt] duration ${promptEndedAt - promptStartedAt}ms`)

//     // console.log(prompt)

//     const openAiStartedAt = Date.now()
//     console.log(`[openai] started at ${new Date(openAiStartedAt).toISOString()}`)

//     const openAiResult = await callOpenAi({
//       apiKey: process.env.VITE_OPENAI_API_KEY ?? '',
//       model: 'gpt-5-nano',
//       prompt,
//     })

//     const openAiEndedAt = Date.now()
//     console.log(`[openai] ended at ${new Date(openAiEndedAt).toISOString()}`)
//     console.log(`[openai] duration ${openAiEndedAt - openAiStartedAt}ms`)

//     console.log(openAiResult)
//     console.log('---')
//   } finally {
//     client.close()

//     const totalEndedAt = Date.now()
//     console.log(`[total] ended at ${new Date(totalEndedAt).toISOString()}`)
//     console.log(`[total] duration ${totalEndedAt - totalStartedAt}ms`)
//   }
// }

// void main()