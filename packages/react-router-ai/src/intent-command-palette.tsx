import type { FormEvent } from "react";
import { useIntentMatch } from "./intent-context";

type IntentCommandPaletteProps = {
  placeholder?: string;
  submitLabel?: string;
};

export function IntentCommandPalette({
  placeholder = "Ask for a setting or screen",
  submitLabel = "Go",
}: IntentCommandPaletteProps) {
  const { query, setQuery, submitQuery, error, lastMatch } = useIntentMatch();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitQuery();
  }

  return (
    <form onSubmit={handleSubmit} data-testid="intent-command-palette">
      <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
        Navigate by intent
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          aria-label="Intent query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid #6b7280" }}
        />
        <button type="submit">{submitLabel}</button>
      </div>
      {lastMatch ? (
        <p style={{ marginTop: 8 }}>
          Match: <strong>{lastMatch.intent.title}</strong> ({Math.round(lastMatch.confidence * 100)}%)
        </p>
      ) : null}
      {error ? <p style={{ marginTop: 8, color: "#b42318" }}>{error}</p> : null}
    </form>
  );
}
