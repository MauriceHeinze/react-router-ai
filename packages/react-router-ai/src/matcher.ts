import { rankCommandItems } from "./local-matcher";
import type {
  AICommandItem,
  AICommandMatch,
  AICommandMatcher,
  AICommandMatcherResult,
} from "./types";

export type MatchItemsOptions = {
  matcher?: AICommandMatcher;
  threshold?: number;
  maxMatcherCandidates?: number;
  forceMatcher?: boolean;
};

export type ResolveIntentOptions = {
  matcher?: AICommandMatcher;
  maxMatcherCandidates?: number;
};

function getCandidates(
  items: readonly AICommandItem[],
  maxMatcherCandidates?: number,
): AICommandItem[] {
  const activeItems = items.filter((item) => !item.disabled);
  const matcherLimit =
    maxMatcherCandidates === undefined ? undefined : Math.max(1, Math.floor(maxMatcherCandidates));
  return matcherLimit ? activeItems.slice(0, matcherLimit) : activeItems;
}

export async function matchItems(
  query: string,
  items: readonly AICommandItem[],
  options: MatchItemsOptions = {},
): Promise<AICommandMatch | null> {
  const { matcher, threshold = 0.45, maxMatcherCandidates, forceMatcher = false } = options;

  const trimmed = query.trim();
  if (!trimmed) return null;

  if (forceMatcher && !matcher) {
    throw new Error("AI matching is not available.");
  }

  const ranked = rankCommandItems(trimmed, items);
  const matcherCandidates = getCandidates(items, maxMatcherCandidates);

  if (matcher) {
    const result = await matcher(trimmed, matcherCandidates);

    if (result && result.kind === "execute") {
      const resolvedMatch =
        matcherCandidates.find((candidate) => candidate.id === result.item.id) ?? null;
      if (resolvedMatch) {
        return {
          item: resolvedMatch,
          query: trimmed,
          confidence: 1,
          source: "matcher",
        };
      }
    }

    if (forceMatcher) {
      return null;
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

export async function resolveIntent(
  query: string,
  items: readonly AICommandItem[],
  options: ResolveIntentOptions = {},
): Promise<AICommandMatcherResult> {
  const { matcher, maxMatcherCandidates } = options;
  const trimmed = query.trim();
  if (!trimmed) return null;
  if (!matcher) {
    throw new Error("AI matching is not available.");
  }
  const matcherCandidates = getCandidates(items, maxMatcherCandidates);
  return matcher(trimmed, matcherCandidates);
}
