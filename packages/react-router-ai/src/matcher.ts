import { findBestFuzzyMatch } from "./local-matcher";
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
    maxMatcherCandidates === undefined
      ? undefined
      : Math.max(1, Math.floor(maxMatcherCandidates));

  return matcherLimit ? activeItems.slice(0, matcherLimit) : activeItems;
}

function resolveMatcherItem(
  item: AICommandItem,
  candidates: readonly AICommandItem[],
): AICommandItem | null {
  return candidates.find((candidate) => candidate.id === item.id) ?? null;
}

function matchLocalItems(
  query: string,
  items: readonly AICommandItem[],
  threshold: number,
): AICommandMatch | null {
  const bestLocal = findBestFuzzyMatch(query, items, threshold);

  if (bestLocal) {
    return {
      item: bestLocal,
      query,
      confidence: bestLocal.confidence,
      source: "local",
    };
  }

  return null;
}

export async function matchItems(
  query: string,
  items: readonly AICommandItem[],
  options: MatchItemsOptions = {},
): Promise<AICommandMatch | null> {
  const { matcher, threshold = 0.45, maxMatcherCandidates } = options;

  const trimmed = query.trim();
  if (!trimmed) return null;

  const matcherCandidates = getCandidates(items, maxMatcherCandidates);

  if (matcher) {
    const result = await matcher(trimmed, matcherCandidates);

    if (result?.kind === "execute") {
      const resolvedItem = resolveMatcherItem(result.item, matcherCandidates);

      if (resolvedItem) {
        return {
          item: resolvedItem,
          query: trimmed,
          confidence: 1,
          source: "matcher",
        };
      }
    }

    return null;
  }

  return matchLocalItems(trimmed, items, threshold);
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
