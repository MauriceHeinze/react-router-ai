import { rankCommandItems } from "./local-matcher";
import type { AICommandItem, AICommandMatch, AICommandMatcher } from "./types";

export type MatchItemsOptions = {
  matcher?: AICommandMatcher;
  threshold?: number;
  maxMatcherCandidates?: number;
};

export async function matchItems(
  query: string,
  items: readonly AICommandItem[],
  options: MatchItemsOptions = {},
): Promise<AICommandMatch | null> {
  const {
    matcher,
    threshold = 0.45,
    maxMatcherCandidates = 10,
  } = options;

  const trimmed = query.trim();
  if (!trimmed) return null;

  const ranked = rankCommandItems(trimmed, items);
  const matcherCandidates =
    ranked.length > 0
      ? ranked.slice(0, maxMatcherCandidates)
      : items.filter((item) => !item.disabled).slice(0, maxMatcherCandidates);

  if (matcher) {
    try {
      const matched = await matcher(trimmed, matcherCandidates);
      const resolvedMatch = matched
        ? matcherCandidates.find((candidate) => candidate.id === matched.id) ?? null
        : null;
      if (resolvedMatch) {
        return {
          item: resolvedMatch,
          query: trimmed,
          confidence: 1,
          source: "matcher",
        };
      }
    } catch {
      // Fall through to local best match.
    }
  }

  const bestLocal = ranked[0];
  if (bestLocal && bestLocal.confidence >= threshold) {
    return {
      item: bestLocal,
      query: trimmed,
      confidence: bestLocal.confidence,
      source: "local",
    };
  }

  return null;
}
