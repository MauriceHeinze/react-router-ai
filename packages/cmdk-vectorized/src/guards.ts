import type { CommandSearchResult } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || typeof value === "number";
}

function assertCommandSearchResult(value: unknown, index: number): CommandSearchResult {
  if (!isRecord(value)) {
    throw new Error(`Invalid command search result at index ${index}.`);
  }

  if (typeof value.id !== "string" || typeof value.title !== "string") {
    throw new Error(`Command search result ${index} is missing a string id or title.`);
  }

  if (!isOptionalString(value.description) || !isOptionalNumber(value.score)) {
    throw new Error(`Command search result ${index} has an invalid description or score.`);
  }

  if (value.type === "navigation") {
    if (typeof value.href !== "string") {
      throw new Error(`Navigation result ${index} is missing href.`);
    }

    return {
      id: value.id,
      type: "navigation",
      title: value.title,
      description: value.description,
      href: value.href,
      score: value.score,
    };
  }

  if (value.type === "action") {
    if (typeof value.actionKey !== "string") {
      throw new Error(`Action result ${index} is missing actionKey.`);
    }

    return {
      id: value.id,
      type: "action",
      title: value.title,
      description: value.description,
      actionKey: value.actionKey,
      score: value.score,
    };
  }

  throw new Error(`Command search result ${index} has an invalid type.`);
}

export function assertCommandSearchResults(value: unknown): CommandSearchResult[] {
  if (!Array.isArray(value)) {
    throw new Error("Command search results must be an array.");
  }

  return value.map((item, index) => assertCommandSearchResult(item, index));
}

export function normalizeCommandSearchResponse(
  data: unknown,
  transformResponse?: (data: unknown) => CommandSearchResult[],
): CommandSearchResult[] {
  if (transformResponse) {
    return assertCommandSearchResults(transformResponse(data));
  }

  if (!isRecord(data) || !("results" in data)) {
    throw new Error("Command search response must be shaped like { results: [] }.");
  }

  return assertCommandSearchResults(data.results);
}
