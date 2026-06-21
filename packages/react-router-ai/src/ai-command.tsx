import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PropsWithChildren,
} from "react";
import { AICommandRoot, useAICommand } from "./controller";
import type {
  AICommandChatEmptyPromptProps,
  AICommandChatInputProps,
  AICommandChatMessageProps,
  AICommandChatProps,
  AICommandClarificationProps,
  AICommandConfirmationProps,
  AICommandDialogProps,
  AICommandEmptyProps,
  AICommandErrorProps,
  AICommandInputProps,
  AICommandItemProps,
  AICommandListProps,
  AICommandLoadingProps,
  AICommandModeHeaderProps,
  AICommandNoMatchProps,
  AICommandVoiceButtonProps,
  AICommandVoiceEmptyPromptProps,
  AICommandVoiceWaveformProps,
} from "./types";

export function AICommandDialog({
  children,
  open: controlledOpen,
  onOpenChange,
}: PropsWithChildren<AICommandDialogProps>) {
  const ctx = useAICommand();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    ctx.dialogRef.current = { open, setOpen };
    return () => {
      ctx.dialogRef.current = null;
    };
  }, [ctx.dialogRef, open, setOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        return;
      }
      if (
        event.key === "Tab" &&
        !event.defaultPrevented &&
        !event.shiftKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        ctx.mode === "voice"
      ) {
        event.preventDefault();
        const modes = ["search", "ai", "voice"] as const;
        const idx = modes.indexOf(ctx.mode);
        const next = modes[(idx + 1) % modes.length];
        ctx.switchMode(next);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setOpen, ctx.mode, ctx.switchMode]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Command palette">
      {children}
    </div>
  );
}

export function AICommandInput({
  placeholder,
  value: controlledValue,
  onValueChange,
  onKeyDown,
  modeShortcut,
  micShortcut,
  onFocus,
  onBlur,
  autoFocus,
  className,
  style,
}: AICommandInputProps) {
  const ctx = useAICommand();
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : ctx.query;
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    if (!isControlled) {
      ctx.setQuery(nextValue);
    }
    onValueChange?.(nextValue);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      ctx.setActiveIndex((current) => (current + 1) % Math.max(ctx.filteredItems.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      ctx.setActiveIndex(
        (current) =>
          (current - 1 + Math.max(ctx.filteredItems.length, 1)) %
          Math.max(ctx.filteredItems.length, 1),
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = ctx.filteredItems[ctx.activeIndex];
      if (item) {
        void ctx.selectItem(item);
      } else if (ctx.hasMatcher) {
        void ctx.submitMatcherQuery();
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      ctx.closeDialog();
    } else if (
      modeShortcut === "tab" &&
      event.key === "Tab" &&
      !event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      const modes = ["search", "ai", "voice"] as const;
      const idx = modes.indexOf(ctx.mode);
      const next = modes[(idx + 1) % modes.length];
      ctx.switchMode(next);
    } else if (
      micShortcut === "ctrl+m" &&
      (event.key === "m" || event.key === "M") &&
      event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !event.shiftKey
    ) {
      event.preventDefault();
      if (ctx.isListening) {
        ctx.stopListening();
      } else {
        ctx.startListening();
      }
    }
    onKeyDown?.(event);
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      aria-label="Command query"
      className={className}
      style={style}
    />
  );
}

export function AICommandList({ children, className, style }: PropsWithChildren<AICommandListProps>) {
  return (
    <div role="listbox" aria-label="Commands" className={className} style={style}>
      {children}
    </div>
  );
}

export function AICommandItem({
  id,
  value,
  keywords,
  description,
  disabled,
  confirmation,
  onSelect,
  children,
  className,
  style,
}: PropsWithChildren<AICommandItemProps>) {
  const ctx = useAICommand();
  const itemRef = useRef({ id, value, keywords, description, disabled, confirmation, onSelect });
  itemRef.current = { id, value, keywords, description, disabled, confirmation, onSelect };

  useLayoutEffect(() => {
    return ctx.registerItem({ id, getItem: () => itemRef.current });
  }, [id, ctx.registerItem]);

  const index = ctx.filteredItems.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const isSelected = index === ctx.activeIndex;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      onClick={() => void ctx.selectItem(itemRef.current)}
      className={className}
      style={{ order: index, ...style }}
    >
      {children}
    </div>
  );
}

export function AICommandEmpty({ children, className, style }: PropsWithChildren<AICommandEmptyProps>) {
  const ctx = useAICommand();
  if (ctx.isSubmitting || ctx.filteredItems.length > 0) return null;
  return (
    <div role="status" className={className} style={style}>
      {children}
    </div>
  );
}

export function AICommandLoading({
  children,
  className,
  style,
}: PropsWithChildren<AICommandLoadingProps>) {
  const ctx = useAICommand();
  if (!ctx.isSubmitting) return null;
  return (
    <div role="status" aria-busy="true" className={className} style={style}>
      {children ?? "Loading..."}
    </div>
  );
}

export function AICommandError({ children, className, style }: AICommandErrorProps) {
  const ctx = useAICommand();
  if (!ctx.error) return null;
  return (
    <div role="alert" className={className} style={style}>
      {children ? children(ctx.error) : ctx.error}
    </div>
  );
}

export function AICommandVoiceButton({
  children,
  onClick,
  title,
  className,
  style,
}: PropsWithChildren<AICommandVoiceButtonProps>) {
  const ctx = useAICommand();
  if (ctx.isListening) return null;

  return (
    <button
      type="button"
      aria-pressed={false}
      title={title}
      onClick={(event) => {
        onClick?.(event);
        ctx.startListening();
      }}
      className={className}
      style={style}
    >
      {children ?? "Use voice"}
    </button>
  );
}

export function AICommandConfirmation({ className, style }: AICommandConfirmationProps) {
  const ctx = useAICommand();
  if (!ctx.pendingConfirmation) return null;

  const message =
    typeof ctx.pendingConfirmation.item.confirmation === "string"
      ? ctx.pendingConfirmation.item.confirmation
      : `Confirm "${ctx.pendingConfirmation.item.value}"?`;

  return (
    <div className={className} style={style}>
      <p style={{ margin: "0 0 10px" }}>{message}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => void ctx.confirmPending()}>
          Confirm
        </button>
        <button type="button" onClick={ctx.cancelPending}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function AICommandModeHeader({
  searchLabel = "Classic Search",
  aiLabel = "Text Chat",
  voiceLabel = "Voice Chat",
  switchLabel = "Switch Mode",
  switchKeycap = "Tab",
  className,
  style,
}: AICommandModeHeaderProps) {
  const ctx = useAICommand();
  const modes = ["search", "ai", "voice"] as const;
  const labels: Record<(typeof modes)[number], string> = {
    search: searchLabel,
    ai: aiLabel,
    voice: voiceLabel,
  };

  return (
    <div className={className} style={style}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 4 }} aria-hidden="true">
          {modes.map((m) => (
            <span
              key={m}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: ctx.mode === m ? "#3b82f6" : "#cbd5e1",
                transition: "background 0.2s ease",
              }}
            />
          ))}
        </div>
        <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#64748b" }}>
          {labels[ctx.mode]}
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          const idx = modes.indexOf(ctx.mode);
          const next = modes[(idx + 1) % modes.length];
          ctx.switchMode(next);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          border: 0,
          background: "transparent",
          color: "#64748b",
          fontSize: "0.8rem",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {switchLabel}
        <kbd
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 24,
            height: 20,
            padding: "0 6px",
            border: "1px solid rgba(148, 163, 184, 0.3)",
            borderRadius: 6,
            background: "rgba(248, 250, 252, 0.9)",
            fontSize: "0.7rem",
            fontWeight: 600,
            fontFamily: "inherit",
            color: "inherit",
          }}
        >
          {switchKeycap}
        </kbd>
      </button>
    </div>
  );
}

export function AICommandChat({ children, className, style }: PropsWithChildren<AICommandChatProps>) {
  const ctx = useAICommand();
  return (
    <div
      role="log"
      aria-label="AI chat"
      aria-live="polite"
      aria-busy={ctx.isSubmitting || undefined}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}

export function AICommandChatMessage({
  message,
  onSelectCandidate,
  userLabel = "Your Request",
  className,
  style,
}: AICommandChatMessageProps) {
  const ctx = useAICommand();
  const isUser = message.role === "user";
  const handleSelect = (item: Parameters<NonNullable<typeof onSelectCandidate>>[0]) => {
    if (onSelectCandidate) {
      onSelectCandidate(item);
    } else {
      void ctx.selectCandidate(item);
    }
  };
  return (
    <div
      role={isUser ? "user" : "assistant"}
      data-role={message.role}
      className={className}
      style={style}
    >
      {isUser && userLabel ? (
        <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "0.9rem" }}>{userLabel}</p>
      ) : null}
      <p style={{ margin: 0 }}>{message.content}</p>
      {message.candidates && message.candidates.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
          {message.candidates.map((item) => (
            <li key={item.id} style={{ margin: "4px 0" }}>
              <button type="button" onClick={() => handleSelect(item)}>
                {item.value}
                {item.description ? ` — ${item.description}` : ""}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AICommandChatInput({
  placeholder,
  value: controlledValue,
  onValueChange,
  onKeyDown,
  modeShortcut,
  micShortcut,
  onFocus,
  onBlur,
  autoFocus,
  rows = 2,
  className,
  style,
}: AICommandChatInputProps) {
  const ctx = useAICommand();
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : ctx.chatInput;
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const nextValue = event.target.value;
    if (!isControlled) {
      ctx.setChatInput(nextValue);
    }
    onValueChange?.(nextValue);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void ctx.submitChat();
    } else if (event.key === "Escape") {
      event.preventDefault();
      ctx.closeDialog();
    } else if (
      modeShortcut === "tab" &&
      event.key === "Tab" &&
      !event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      const modes = ["search", "ai", "voice"] as const;
      const idx = modes.indexOf(ctx.mode);
      const next = modes[(idx + 1) % modes.length];
      ctx.switchMode(next);
    } else if (
      micShortcut === "ctrl+m" &&
      (event.key === "m" || event.key === "M") &&
      event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !event.shiftKey
    ) {
      event.preventDefault();
      if (ctx.isListening) {
        ctx.stopListening();
      } else {
        ctx.startListening();
      }
    }
    onKeyDown?.(event);
  }

  return (
    <textarea
      ref={inputRef}
      rows={rows}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      aria-label="AI chat input"
      className={className}
      style={style}
    />
  );
}

export function AICommandClarification({
  message = "Which one did you mean?",
  onSelect,
  className,
  style,
  itemClassName,
  itemStyle,
}: AICommandClarificationProps) {
  const ctx = useAICommand();
  if (!ctx.candidates || ctx.candidates.length === 0) return null;
  return (
    <div role="group" aria-label="Clarification" className={className} style={style}>
      <p style={{ margin: "0 0 8px" }}>{message}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {ctx.candidates.map((item) => (
          <li key={item.id} style={{ margin: "4px 0" }}>
            <button
              type="button"
              className={itemClassName}
              style={itemStyle}
              onClick={() => {
                if (onSelect) {
                  onSelect(item);
                } else {
                  void ctx.selectCandidate(item);
                }
              }}
            >
              <span>{item.value}</span>
              {item.description ? <span>{item.description}</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AICommandVoiceEmptyPrompt({
  children,
  className,
  style,
}: PropsWithChildren<AICommandVoiceEmptyPromptProps>) {
  const ctx = useAICommand();
  if (ctx.mode !== "voice" || ctx.chatMessages.length > 0 || ctx.isSubmitting) return null;
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

export function AICommandChatEmptyPrompt({
  children,
  className,
  style,
}: PropsWithChildren<AICommandChatEmptyPromptProps>) {
  const ctx = useAICommand();
  if (ctx.mode === "search" || ctx.chatMessages.length > 0 || ctx.isSubmitting) return null;
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

export function AICommandVoiceWaveform({
  className,
  style,
}: AICommandVoiceWaveformProps) {
  const ctx = useAICommand();
  const [bars, setBars] = useState<number[]>([]);
  const volumeRef = useRef(ctx.volume);
  volumeRef.current = ctx.volume;
  const maxBars = 120;

  useEffect(() => {
    if (!ctx.isListening) {
      setBars([]);
      return;
    }
    const interval = setInterval(() => {
      const vol = volumeRef.current || 0.15;
      const h = Math.max(3, Math.round(Math.random() * 28 * vol));
      setBars((prev) => {
        const next = [...prev, h];
        if (next.length > maxBars) return next.slice(-maxBars);
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [ctx.isListening]);

  if (!ctx.isListening) return null;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        ...style,
      }}
      aria-label="Voice waveform"
      aria-busy="true"
    >
      {bars.map((h, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: 2,
            borderRadius: 999,
            background: "currentColor",
            height: h,
            opacity: 0.3 + (i / bars.length) * 0.7,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

export function AICommandNoMatch({
  message = "Sorry, I couldn't find anything. Try rephrasing, or contact support.",
  rephraseLabel,
  contactSupportLabel = "Contact support",
  onContactSupport,
  className,
  style,
}: AICommandNoMatchProps) {
  const ctx = useAICommand();
  const lastMessage = ctx.chatMessages[ctx.chatMessages.length - 1];
  const isNoMatch =
    lastMessage?.role === "assistant" &&
    (!lastMessage.candidates || lastMessage.candidates.length === 0) &&
    !lastMessage.pendingItemId;
  if (!isNoMatch) return null;

  const supportHandler = onContactSupport ?? ctx.onContactSupport;

  return (
    <div role="status" className={className} style={style}>
      <p style={{ margin: 0 }}>{message}</p>
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {rephraseLabel ? <span>{rephraseLabel}</span> : null}
        {supportHandler ? (
          <button type="button" onClick={supportHandler}>
            {contactSupportLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export const AICommand = {
  Root: AICommandRoot,
  Dialog: AICommandDialog,
  Input: AICommandInput,
  List: AICommandList,
  Item: AICommandItem,
  Empty: AICommandEmpty,
  Loading: AICommandLoading,
  Error: AICommandError,
  VoiceButton: AICommandVoiceButton,
  Confirmation: AICommandConfirmation,
  ModeHeader: AICommandModeHeader,
  Chat: AICommandChat,
  ChatMessage: AICommandChatMessage,
  ChatInput: AICommandChatInput,
  Clarification: AICommandClarification,
  NoMatch: AICommandNoMatch,
  VoiceWaveform: AICommandVoiceWaveform,
  VoiceEmptyPrompt: AICommandVoiceEmptyPrompt,
  ChatEmptyPrompt: AICommandChatEmptyPrompt,
};
