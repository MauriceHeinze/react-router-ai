import type { AICommandItem } from "./types";

export type ScoredCommandItem = AICommandItem & {
  confidence: number;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalize(value).split(" ").filter(Boolean);
}

export function rankCommandItems(
  query: string,
  items: readonly AICommandItem[],
): ScoredCommandItem[] {
  const normalizedQuery = normalize(query);
  const queryTokens = tokenize(query);
  const activeItems = items.filter((item) => !item.disabled);

  if (!normalizedQuery || queryTokens.length === 0) {
    return activeItems.map((item) => ({ ...item, confidence: 0 }));
  }

  return activeItems
    .map((item) => {
      const value = normalize(item.value);
      const description = normalize(item.description ?? "");
      const keywords = (item.keywords ?? [])
        .map(normalize)
        .filter((keyword) => keyword.length > 0);

      let score = 0;

      if (value === normalizedQuery) {
        score += 1;
      } else if (value.includes(normalizedQuery)) {
        score += 0.8;
      } else if (normalizedQuery.includes(value) && value.length > 0) {
        score += 0.5;
      }

      const valueTokens = tokenize(item.value);
      const haystackTokens = new Set([
        ...valueTokens,
        ...tokenize(item.description ?? ""),
        ...keywords.flatMap(tokenize),
      ]);

      let tokenHits = 0;
      for (const token of queryTokens) {
        if (haystackTokens.has(token)) {
          tokenHits += 1;
        }
      }
      score += (tokenHits / queryTokens.length) * 0.4;

      const keywordHits = keywords.filter((keyword) => queryTokens.includes(keyword)).length;
      if (keywords.length > 0) {
        score += (keywordHits / keywords.length) * 0.2;
      }

      if (description.includes(normalizedQuery)) {
        score += 0.1;
      }

      return { ...item, confidence: Math.min(Math.max(score, 0), 1) };
    })
    .filter((item) => item.confidence > 0.05)
    .sort((a, b) => b.confidence - a.confidence);
}
