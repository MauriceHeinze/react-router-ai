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

export function rankCommandItems(
  query: string,
  items: readonly AICommandItem[],
): ScoredCommandItem[] {
  const activeItems = items.filter((item) => !item.disabled);
  const trimmed = query.trim();

  if (!trimmed) {
    return activeItems.map((item) => ({ ...item, confidence: 0 }));
  }

  const fuse = buildFuse(activeItems);
  const results = fuse.search(trimmed);

  return results
    .map((result) => {
      const fuseScore = typeof result.score === "number" ? result.score : 1;
      const confidence = Math.min(Math.max(1 - fuseScore, 0), 1);
      return { ...result.item, confidence };
    })
    .filter((item) => item.confidence > 0.05)
    .sort((a, b) => b.confidence - a.confidence);
}
