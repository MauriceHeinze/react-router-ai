import type { FormEvent } from "react";
import { useVoiceController } from "./intent-context";

type VoiceCommandPaletteProps = {
  placeholder?: string;
  submitLabel?: string;
};

export function VoiceCommandPalette({
  placeholder = "Ask for a command",
  submitLabel = "Run",
}: VoiceCommandPaletteProps) {
  const {
    query,
    setQuery,
    submitQuery,
    error,
    lastMatch,
    candidates,
    clearCandidates,
    selectMatch,
    pendingConfirmation,
    confirmPending,
    cancelPending,
  } = useVoiceController();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitQuery();
  }

  return (
    <form onSubmit={handleSubmit} data-testid="voice-command-palette">
      <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
        Run a command
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          aria-label="Voice command query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid #6b7280" }}
        />
        <button type="submit">{submitLabel}</button>
      </div>
      {lastMatch ? (
        <p style={{ marginTop: 8 }}>
          Match: <strong>{lastMatch.command.title}</strong> ({Math.round(lastMatch.confidence * 100)}%,{" "}
          {lastMatch.source})
        </p>
      ) : null}
      {pendingConfirmation ? (
        <div style={{ marginTop: 8 }}>
          <p style={{ marginBottom: 8 }}>
            {typeof pendingConfirmation.command.confirmation === "string"
              ? pendingConfirmation.command.confirmation
              : `Confirm "${pendingConfirmation.command.title}"?`}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => void confirmPending()}>
              Confirm
            </button>
            <button type="button" onClick={cancelPending}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {candidates?.length ? (
        <div style={{ marginTop: 8 }}>
          <p style={{ marginBottom: 8 }}>Choose a command:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {candidates.map((candidate) => (
              <button
                key={candidate.command.id}
                type="button"
                onClick={() => void selectMatch(candidate)}
                style={{ textAlign: "left" }}
              >
                {candidate.command.title}
              </button>
            ))}
          </div>
          <button type="button" onClick={clearCandidates} style={{ marginTop: 8 }}>
            Dismiss
          </button>
        </div>
      ) : null}
      {error ? <p style={{ marginTop: 8, color: "#b42318" }}>{error}</p> : null}
    </form>
  );
}

export const IntentCommandPalette = VoiceCommandPalette;
