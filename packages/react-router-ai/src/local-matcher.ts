import Fuse from "fuse.js";
import type { AICommandItem } from "./types";

export type ScoredCommandItem = AICommandItem & {
  confidence: number;
};

function buildFuse(items: readonly AICommandItem[]) {
  return new Fuse(items as AICommandItem[], {
    keys: [
      { name: "value", weight: 0.6 },
      { name: "keywords", weight: 0.25 },
      { name: "description", weight: 0.15 },
    ],
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 1,
  });
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function createQueryVariants(query: string) {
  const normalized = normalizeText(query);
  const variants = new Set<string>([normalized]);
  const prefixes = [
    "go to ",
    "open ",
    "navigate to ",
    "take me to ",
    "bring me to ",
    "show me ",
  ];

  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix)) {
      const stripped = normalized.slice(prefix.length).trim();
      if (stripped) {
        variants.add(stripped);
      }
    }
  }

  return variants;
}

export function findDirectCommandMatch(
  query: string,
  items: readonly AICommandItem[],
): ScoredCommandItem | null {
  const activeItems = items.filter((item) => !item.disabled);
  const variants = createQueryVariants(query);

  const exactValueMatches = activeItems.filter((item) =>
    variants.has(normalizeText(item.value)),
  );

  if (exactValueMatches.length === 1) {
    return { ...exactValueMatches[0], confidence: 1 };
  }

  const exactKeywordMatches = activeItems.filter((item) =>
    (item.keywords ?? []).some((keyword) =>
      variants.has(normalizeText(keyword)),
    ),
  );

  if (exactKeywordMatches.length === 1) {
    return { ...exactKeywordMatches[0], confidence: 1 };
  }

  return null;
}

export function findBestFuzzyMatch(
  query: string,
  items: readonly AICommandItem[],
  threshold: number,
): ScoredCommandItem | null {
  const activeItems = items.filter((item) => !item.disabled);
  const trimmed = query.trim();

  if (!trimmed) {
    return null;
  }

  const fuse = buildFuse(activeItems);
  const results = fuse.search(trimmed);
  const best = results[0];

  if (!best) {
    return null;
  }

  const fuseScore = typeof best.score === "number" ? best.score : 1;
  const confidence = Math.min(Math.max(1 - fuseScore, 0), 1);

  if (confidence < threshold) {
    return null;
  }

  return { ...best.item, confidence };
}
