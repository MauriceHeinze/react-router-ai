import type { IntentMatch, NavigationIntent } from "./types";

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function toTokens(value: string) {
  return normalize(value).split(" ").filter(Boolean);
}

function scoreIntent(query: string, intent: NavigationIntent) {
  const normalizedQuery = normalize(query);
  const queryTokens = toTokens(query);

  if (!normalizedQuery || queryTokens.length === 0) return 0;

  let score = 0;
  const title = normalize(intent.title);
  const description = normalize(intent.description ?? "");
  const phrases = (intent.phrases ?? []).map(normalize);
  const keywords = (intent.keywords ?? []).map(normalize);
  const haystack = [title, description, ...phrases, ...keywords].join(" ");
  const haystackTokens = new Set(toTokens(haystack));

  if (title.includes(normalizedQuery)) score += 0.55;
  if (phrases.some((phrase) => phrase === normalizedQuery)) score += 0.75;
  if (phrases.some((phrase) => phrase.includes(normalizedQuery))) score += 0.35;
  if (phrases.some((phrase) => normalizedQuery.includes(phrase))) score += 0.5;

  let tokenHits = 0;
  for (const token of queryTokens) {
    if (haystackTokens.has(token)) tokenHits += 1;
  }

  score += (tokenHits / queryTokens.length) * 0.6;

  const keywordHits = keywords.reduce((count, keyword) => {
    return count + (queryTokens.includes(keyword) ? 1 : 0);
  }, 0);

  if (keywords.length > 0) {
    score += (keywordHits / keywords.length) * 0.15;
  }

  if (description.includes(normalizedQuery)) score += 0.1;

  return Math.min(score, 1);
}

export function matchIntent(
  query: string,
  intents: NavigationIntent[],
  threshold = 0.45,
): IntentMatch | null {
  let best: IntentMatch | null = null;

  for (const intent of intents) {
    const confidence = scoreIntent(query, intent);
    if (!best || confidence > best.confidence) {
      best = {
        intent,
        query,
        confidence,
        source: "fuzzy",
      };
    }
  }

  if (!best || best.confidence < threshold) return null;
  return best;
}
