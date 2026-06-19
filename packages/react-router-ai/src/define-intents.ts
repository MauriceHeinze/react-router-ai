import type { NavigationIntent } from "./types";

function ensureStringArray(value: string[] | undefined, field: string, id: string) {
  if (!value) return;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim().length === 0)) {
    throw new Error(`Intent "${id}" has an invalid "${field}" array.`);
  }
}

export function defineIntents(intents: NavigationIntent[]): NavigationIntent[] {
  const ids = new Set<string>();

  intents.forEach((intent) => {
    if (!intent.id?.trim()) throw new Error("Every intent needs a non-empty id.");
    if (ids.has(intent.id)) throw new Error(`Duplicate intent id "${intent.id}".`);
    ids.add(intent.id);

    if (intent.type !== "navigation") {
      throw new Error(`Intent "${intent.id}" must use type "navigation" in v1.`);
    }
    if (!intent.title?.trim()) throw new Error(`Intent "${intent.id}" needs a title.`);
    if (!intent.to?.trim()) throw new Error(`Intent "${intent.id}" needs a destination path.`);
    ensureStringArray(intent.phrases, "phrases", intent.id);
    ensureStringArray(intent.keywords, "keywords", intent.id);
  });

  return intents;
}
