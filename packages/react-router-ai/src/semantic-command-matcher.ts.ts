import type { AICommandMatcher } from './types'

type GraphQlRow = Record<string, unknown>

type WeaviateRouteResult = {
  route: string
  label: string
  description: string
}

// weaviate + openai
export function createWeaviateCommandMatcher(options: {
  weaviateUrl: string
  weaviateApiKey: string
  openAiApiKey: string
  clusterUrl?: string
}): AICommandMatcher {
  const rawUrl = options.weaviateUrl
  const weaviateUrl = rawUrl.startsWith('http') || rawUrl.startsWith('/')
    ? rawUrl
    : `https://${rawUrl}`
  const clusterUrl = options.clusterUrl ?? weaviateUrl

  return async (query, candidates) => {
    const objects = await queryWeaviateRoutes(query)
    const csv = buildCsv(objects)
    const prompt = buildPrompt(query, csv)
    const openAiResult = await callOpenAi(prompt)

    let parsed: { commandId: string | null; confidence?: number } | null = null
    try {
      parsed = JSON.parse(openAiResult)
    } catch { /* invalid JSON */ }

    if (!parsed || !parsed.commandId || (parsed.confidence ?? 0) < 0.5) {
      return { kind: 'no-match' }
    }

    const matched = candidates.find((c) => c.id === parsed!.commandId)
    return matched ? { kind: 'execute', item: matched } : { kind: 'no-match' }
  }

  async function queryWeaviateRoutes(command: string, limit = 10): Promise<GraphQlRow[]> {
    const escaped = JSON.stringify(command)
    const query = `{ Get { Routes(hybrid: { query: ${escaped} }, limit: ${limit}) { commandId label description path actionType section stateKey setValue recordType phrasesKeywords _additional { score explainScore } } } }`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.weaviateApiKey}`,
      'X-Weaviate-Cluster-Url': clusterUrl,
    }

    const response = await fetch(`${weaviateUrl}/v1/graphql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Weaviate query failed (${response.status}). ${errorText}`)
    }

    const data = (await response.json()) as {
      data?: { Get?: { Routes?: GraphQlRow[] } }
      errors?: Array<{ message: string }>
    }

    if (data.errors?.length) {
      const messages = data.errors.map((e) => e.message).join('; ')
      throw new Error(`Weaviate GraphQL errors: ${messages}`)
    }

    return data?.data?.Get?.Routes ?? []
  }

  async function callOpenAi(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        reasoning: { effort: 'minimal' },
        max_output_tokens: 50,
        store: false,
        input: prompt,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`OpenAI command matching failed (${response.status}). ${errorText}`)
    }

    const data = (await response.json()) as {
      output?: Array<{
        type?: string
        content?: Array<{ type?: string; text?: string }>
      }>
    }

    return (
      data.output
        ?.find((item) => item.type === 'message')
        ?.content
        ?.find((content) => content.type === 'output_text')
        ?.text ?? ''
    )
  }
}

// weaviate only
export function createWeaviateRouteSearch(options: {
  weaviateUrl: string
  weaviateApiKey: string
  clusterUrl?: string
}) {
  const rawUrl = options.weaviateUrl
  const weaviateUrl =
    rawUrl.startsWith('http') || rawUrl.startsWith('/')
      ? rawUrl
      : `https://${rawUrl}`

  const clusterUrl = options.clusterUrl ?? weaviateUrl

  return async function searchWeaviateRoutes(
    query: string,
    limit = 10,
  ): Promise<WeaviateRouteResult[]> {
    const escapedQuery = JSON.stringify(query)

    const graphQlQuery = `
      {
        Get {
          Routes(
            hybrid: { query: ${escapedQuery} }
            limit: ${limit}
          ) {
            path
            label
            description
          }
        }
      }
    `

    const response = await fetch(`${weaviateUrl}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.weaviateApiKey}`,
        'X-Weaviate-Cluster-Url': clusterUrl,
      },
      body: JSON.stringify({ query: graphQlQuery }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Weaviate query failed (${response.status}). ${errorText}`)
    }

    const data = (await response.json()) as {
      data?: {
        Get?: {
          Routes?: GraphQlRow[]
        }
      }
      errors?: Array<{ message: string }>
    }

    if (data.errors?.length) {
      const messages = data.errors.map((error) => error.message).join('; ')
      throw new Error(`Weaviate GraphQL errors: ${messages}`)
    }

    return (data.data?.Get?.Routes ?? [])
      .map((row) => ({
        route: stringOrEmpty(row.path),
        label: stringOrEmpty(row.label),
        description: stringOrEmpty(row.description),
      }))
      .filter((item) => item.route)
  }
}

function buildCsv(objects: GraphQlRow[]): string {
  const rows = objects.map(rowFromGraphQl).join('\n')
  return [
    'commandId,actionType,section,target,description,phrases',
    rows,
  ].join('\n')
}

function rowFromGraphQl(row: GraphQlRow): string {
  const path = stringOrEmpty(row.path)
  const stateKey = stringOrEmpty(row.stateKey)
  const target =
    path && path !== 'null'
      ? path
      : stateKey && stateKey !== 'null'
        ? stateKey
        : ''
  const phrases = stringOrEmpty(row.phrasesKeywords).replaceAll(',', ' | ')

  return [
    cleanCsvText(row.commandId),
    cleanCsvText(row.actionType),
    cleanCsvText(row.section),
    cleanCsvText(target),
    cleanCsvText(row.description),
    cleanCsvText(phrases),
  ].join(',')
}

function buildPrompt(command: string, csv: string): string {
  const currentPath = typeof window !== 'undefined' ? window.location.href : ''
  return `command = ${JSON.stringify(command)}
currentPath = ${JSON.stringify(currentPath)}

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
${csv}
"""`
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
