import { type FormEvent, useEffect, useRef, useState } from "react";
import { useVoiceController } from "./intent-context";
import type { VoiceCommandMatch } from "./types";

type InteractionMode = "text" | "voice";

type VoiceWidgetProps = {
  title?: string;
  subtitle?: string;
  listeningTitle?: string;
  listeningSubtitle?: string;
  placeholder?: string;
  disclaimer?: string;
  cancelLabel?: string;
  position?: "bottom-right" | "bottom-left";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onMenuClick?: () => void;
};

export function VoiceWidget({
  title = "How can I help?",
  subtitle = "You can ask anything or click the 🎤 to speak",
  listeningTitle = "Listening...",
  listeningSubtitle = "Speak now",
  placeholder = "Ask anything...",
  disclaimer = "Voice AI can make mistakes. Please double-check important info.",
  cancelLabel = "Cancel",
  position = "bottom-right",
  open: controlledOpen,
  onOpenChange,
  onMenuClick,
}: VoiceWidgetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("text");
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(value);
    }
    onOpenChange?.(value);
  };

  const {
    query,
    setQuery,
    submitQuery,
    isSubmitting,
    isListening,
    startListening,
    stopListening,
    error,
    candidates,
    pendingConfirmation,
    confirmPending,
    cancelPending,
    selectMatch,
    clearCandidates,
  } = useVoiceController();

  const inputRef = useRef<HTMLInputElement>(null);
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      stopListening();
      setQuery("");
      clearCandidates();
    }

    wasOpenRef.current = isOpen;
  }, [clearCandidates, isOpen, setQuery, stopListening]);

  useEffect(() => {
    if (!isOpen) {
      setInteractionMode("text");
      return;
    }

    if (!isListening) {
      if (interactionMode === "voice") {
        micButtonRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    }
  }, [interactionMode, isListening, isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setInteractionMode("text");
        setOpen(true);
        return;
      }

      if (!isOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        handleEscape();
        return;
      }

      if (isListening) return;

      if (event.key === "Tab") {
        event.preventDefault();
        setInteractionMode((current) => (current === "text" ? "voice" : "text"));
        if (interactionMode === "text") {
          startListening();
        } else {
          stopListening();
        }
        return;
      }

      if (
        interactionMode === "voice" &&
        event.key === " " &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        startListening();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cancelPending,
    clearCandidates,
    interactionMode,
    isListening,
    isOpen,
    pendingConfirmation,
    startListening,
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitQuery();
  }

  function handleMicClick() {
    setInteractionMode("voice");
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  function handleEscape() {
    if (isListening) {
      stopListening();
      return;
    }

    if (pendingConfirmation) {
      cancelPending();
      return;
    }

    if (candidates?.length) {
      clearCandidates();
      return;
    }

    handleClose();
  }

  function handleClose() {
    setOpen(false);
    stopListening();
    setInteractionMode("text");
    setQuery("");
    clearCandidates();
  }

  function handleOverlayClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  const fabPositionStyle =
    position === "bottom-left"
      ? { left: 24, right: "auto" }
      : { right: 24, left: "auto" };

  return (
    <>
      <style>{`
        @keyframes voice-widget-pulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.08); opacity: 0.45; }
        }
        @keyframes voice-widget-bar {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }
      `}</style>

      <button
        type="button"
        aria-label="Open voice assistant"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => {
          setInteractionMode("text");
          setOpen(true);
        }}
        style={{
          position: "fixed",
          bottom: 24,
          ...fabPositionStyle,
          zIndex: 9998,
          width: 56,
          height: 56,
          border: "none",
          borderRadius: "50%",
          padding: 0,
          background: "transparent",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #60a5fa, #3b82f6, #2563eb)",
            boxShadow: "0 8px 28px rgba(37, 99, 235, 0.35), inset 0 2px 6px rgba(255, 255, 255, 0.35)",
          }}
        />
        <span
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            background: "rgba(59, 130, 246, 0.35)",
            filter: "blur(10px)",
            animation: "voice-widget-pulse 2.8s ease-in-out infinite",
          }}
        />
        <span style={{ position: "relative", display: "grid", placeItems: "center", width: "100%", height: "100%" }}>
          <OrbIcon size={28} />
        </span>
      </button>

      {isOpen ? (
        <div
          role="presentation"
          onClick={handleOverlayClick}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Voice assistant"
            style={{
              position: "relative",
              width: "min(420px, 100%)",
              background: "#ffffff",
              borderRadius: 24,
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.18)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 12,
                left: "50%",
                transform: "translateX(-50%)",
                width: 40,
                height: 4,
                borderRadius: 999,
                background: "#e5e7eb",
              }}
            />

            <div
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <IconButton
                label="Menu"
                onClick={onMenuClick}
              >
                <MenuIcon />
              </IconButton>
              <IconButton
                label="Close"
                onClick={handleClose}
              >
                <CloseIcon />
              </IconButton>
            </div>

            {isListening ? (
              <ListeningView
                title={listeningTitle}
                subtitle={listeningSubtitle}
                cancelLabel={cancelLabel}
                onCancel={() => stopListening()}
              />
            ) : isSubmitting ? (
              <ProcessingView />
            ) : (
              <IdleView
                title={title}
                subtitle={subtitle}
                placeholder={placeholder}
                query={query}
                setQuery={setQuery}
                onSubmit={handleSubmit}
                onMicClick={handleMicClick}
                inputRef={inputRef}
                micButtonRef={micButtonRef}
                interactionMode={interactionMode}
              />
            )}

            {!isListening && !isSubmitting ? (
              <ResultsPanel
                error={error}
                candidates={candidates}
                pendingConfirmation={pendingConfirmation}
                confirmPending={confirmPending}
                cancelPending={cancelPending}
                selectMatch={selectMatch}
                clearCandidates={clearCandidates}
              />
            ) : null}

            <ShortcutHints isListening={isListening} interactionMode={interactionMode} />

            <p
              style={{
                margin: "16px 0 0",
                fontSize: "0.75rem",
                color: "#9ca3af",
                lineHeight: 1.4,
              }}
            >
              {disclaimer}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

export const IntentVoiceWidget = VoiceWidget;

type IdleViewProps = {
  title: string;
  subtitle: string;
  placeholder: string;
  query: string;
  setQuery: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onMicClick: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  micButtonRef: React.RefObject<HTMLButtonElement | null>;
  interactionMode: InteractionMode;
};

function IdleView({
  title,
  subtitle,
  placeholder,
  query,
  setQuery,
  onSubmit,
  onMicClick,
  inputRef,
  micButtonRef,
  interactionMode,
}: IdleViewProps) {
  return (
    <>
      <div style={{ marginTop: 24, marginBottom: 20 }}>
        <GlowingOrb />
      </div>

      <h2
        style={{
          margin: "0 0 8px",
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "#111827",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: "0 0 24px",
          fontSize: "0.95rem",
          color: "#6b7280",
        }}
      >
        {subtitle}
      </p>

      <form
        onSubmit={onSubmit}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 10px 10px 16px",
          background: "#f3f4f6",
          borderRadius: 16,
          border: "1px solid transparent",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label="Voice command query"
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: "0.95rem",
            color: "#111827",
          }}
        />
        <button
          ref={micButtonRef}
          type="button"
          onClick={onMicClick}
          aria-label="Use voice"
          aria-pressed={interactionMode === "voice"}
          style={{
            display: "grid",
            placeItems: "center",
            width: 40,
            height: 40,
            border: "none",
            borderRadius: 12,
            background: interactionMode === "voice" ? "#dbeafe" : "#e5e7eb",
            color: interactionMode === "voice" ? "#1d4ed8" : "#374151",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <MicrophoneIcon />
        </button>
      </form>
    </>
  );
}

function ShortcutHints({
  isListening,
  interactionMode,
}: {
  isListening: boolean;
  interactionMode: InteractionMode;
}) {
  const hints = isListening
    ? [
        { keyLabel: "Esc", description: "Stop or cancel" },
        { keyLabel: "Click mic", description: "Start over" },
      ]
    : [
        { keyLabel: "⌘K", description: "Open assistant" },
        { keyLabel: "Tab", description: "Text ↔ Voice" },
        { keyLabel: interactionMode === "voice" ? "Space" : "Type", description: interactionMode === "voice" ? "Start recording" : "Start typing immediately" },
        { keyLabel: "Esc", description: "Stop or cancel" },
      ];

  return (
    <div
      aria-label="Keyboard shortcuts"
      style={{
        width: "100%",
        marginTop: 14,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {hints.map((hint) => (
        <span
          key={`${hint.keyLabel}-${hint.description}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 999,
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
            color: "#6b7280",
            fontSize: "0.72rem",
            lineHeight: 1,
          }}
        >
          <kbd
            style={{
              padding: "4px 6px",
              borderRadius: 8,
              background: "#ffffff",
              border: "1px solid #d1d5db",
              boxShadow: "inset 0 -1px 0 rgba(17, 24, 39, 0.05)",
              color: "#111827",
              fontSize: "0.7rem",
              fontFamily: "inherit",
            }}
          >
            {hint.keyLabel}
          </kbd>
          <span>{hint.description}</span>
        </span>
      ))}
    </div>
  );
}

type ListeningViewProps = {
  title: string;
  subtitle: string;
  cancelLabel: string;
  onCancel: () => void;
};

function ListeningView({
  title,
  subtitle,
  cancelLabel,
  onCancel,
}: ListeningViewProps) {
  const bars = [0.6, 0.9, 0.5, 0.8, 0.4];

  return (
    <>
      <h2
        style={{
          margin: "24px 0 6px",
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "#111827",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: "0 0 28px",
          fontSize: "0.95rem",
          color: "#6b7280",
        }}
      >
        {subtitle}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          marginBottom: 32,
        }}
      >
        <Waveform bars={bars} direction="left" />
        <GlowingOrb pulsing />
        <Waveform bars={bars} direction="right" />
      </div>

      <button
        type="button"
        onClick={onCancel}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          border: "1px solid #e5e7eb",
          borderRadius: 999,
          background: "#ffffff",
          color: "#374151",
          fontSize: "0.9rem",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        {cancelLabel}
        <CloseIcon size={14} />
      </button>
    </>
  );
}

function ProcessingView() {
  const bars = [0.45, 0.75, 1, 0.7, 0.5];

  return (
    <>
      <h2
        style={{
          margin: "24px 0 6px",
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "#111827",
        }}
      >
        Processing...
      </h2>

      <p
        style={{
          margin: "0 0 28px",
          fontSize: "0.95rem",
          color: "#6b7280",
        }}
      >
        Matching your prompt to the best command.
      </p>

      <div
        aria-label="Processing prompt"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          marginBottom: 32,
        }}
      >
        <Waveform bars={bars} direction="left" />
        <GlowingOrb pulsing />
        <Waveform bars={bars} direction="right" />
      </div>
    </>
  );
}

type WaveformProps = {
  bars: number[];
  direction: "left" | "right";
};

function Waveform({ bars, direction }: WaveformProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        height: 48,
      }}
    >
      {bars.map((scale, index) => {
        const delay = direction === "left"
          ? (bars.length - index) * 0.12
          : index * 0.12;
        return (
          <span
            key={index}
            style={{
              width: 5,
              height: `${scale * 100}%`,
              borderRadius: 999,
              background: "linear-gradient(180deg, #60a5fa, #3b82f6)",
              transformOrigin: "center",
              animation: `voice-widget-bar 0.9s ease-in-out ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

type ResultsPanelProps = {
  error: string | null;
  candidates: VoiceCommandMatch[] | null;
  pendingConfirmation: VoiceCommandMatch | null;
  confirmPending: () => Promise<void>;
  cancelPending: () => void;
  selectMatch: (match: VoiceCommandMatch) => Promise<void>;
  clearCandidates: () => void;
};

function ResultsPanel({
  error,
  candidates,
  pendingConfirmation,
  confirmPending,
  cancelPending,
  selectMatch,
  clearCandidates,
}: ResultsPanelProps) {
  if (pendingConfirmation) {
    const message =
      typeof pendingConfirmation.command.confirmation === "string"
        ? pendingConfirmation.command.confirmation
        : `Confirm "${pendingConfirmation.command.title}"?`;
    return (
      <div style={{ width: "100%", marginTop: 16, textAlign: "left" }}>
        <p style={{ margin: "0 0 10px", fontSize: "0.95rem", color: "#111827" }}>{message}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => void confirmPending()}
            style={{
              padding: "8px 14px",
              border: "none",
              borderRadius: 10,
              background: "#2563eb",
              color: "#ffffff",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={cancelPending}
            style={{
              padding: "8px 14px",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              background: "#ffffff",
              color: "#374151",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (candidates?.length) {
    return (
      <div style={{ width: "100%", marginTop: 16, textAlign: "left" }}>
        <p style={{ margin: "0 0 10px", fontSize: "0.85rem", fontWeight: 600, color: "#6b7280" }}>
          Did you mean one of these?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {candidates.map((candidate) => (
            <button
              key={candidate.command.id}
              type="button"
              onClick={() => void selectMatch(candidate)}
              style={{
                padding: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                background: "#ffffff",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "block", fontWeight: 600, color: "#111827" }}>
                {candidate.command.title}
              </span>
              {candidate.command.description ? (
                <span style={{ display: "block", fontSize: "0.8rem", color: "#6b7280" }}>
                  {candidate.command.description}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={clearCandidates}
          style={{
            marginTop: 8,
            padding: "6px 12px",
            border: "none",
            background: "transparent",
            color: "#6b7280",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <p
        style={{
          width: "100%",
          margin: "16px 0 0",
          padding: 10,
          borderRadius: 10,
          background: "#fef2f2",
          color: "#b91c1c",
          fontSize: "0.9rem",
          textAlign: "left",
        }}
      >
        {error}
      </p>
    );
  }

  return null;
}

type IconButtonProps = {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
};

function IconButton({ label, onClick, children }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        display: "grid",
        placeItems: "center",
        width: 32,
        height: 32,
        border: "none",
        borderRadius: 8,
        background: "transparent",
        color: "#6b7280",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function GlowingOrb({ pulsing = false }: { pulsing?: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: "radial-gradient(circle at 30% 30%, #60a5fa, #3b82f6, #2563eb)",
        boxShadow: "0 8px 32px rgba(37, 99, 235, 0.35), inset 0 2px 8px rgba(255, 255, 255, 0.4)",
        display: "grid",
        placeItems: "center",
        animation: pulsing ? "voice-widget-pulse 2s ease-in-out infinite" : undefined,
      }}
    >
      <OrbIcon size={32} />
    </div>
  );
}

function OrbIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.5c2.5 3 7 6.5 7 9.5s-4.5 6.5-7 9.5c-2.5-3-7-6.5-7-9.5s4.5-6.5 7-9.5Z"
        fill="white"
      />
    </svg>
  );
}

function MicrophoneIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v4M8 23h8" />
    </svg>
  );
}

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
