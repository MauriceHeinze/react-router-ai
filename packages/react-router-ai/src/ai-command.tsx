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
  AICommandModeToggleProps,
  AICommandNoMatchProps,
  AICommandVoiceButtonProps,
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
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

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
      ctx.switchMode(ctx.mode === "search" ? "ai" : "search");
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
      style={style}
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

  return (
    <button
      type="button"
      aria-pressed={ctx.isListening}
      title={title}
      onClick={(event) => {
        onClick?.(event);
        if (ctx.isListening) {
          ctx.stopListening();
        } else {
          ctx.startListening();
        }
      }}
      className={className}
      style={style}
    >
      {children ?? (ctx.isListening ? "Listening..." : "Use voice")}
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

export function AICommandModeToggle({
  searchLabel = "Search",
  aiLabel = "AI",
  className,
  style,
}: AICommandModeToggleProps) {
  const ctx = useAICommand();
  return (
    <div role="tablist" aria-label="Input mode" className={className} style={style}>
      <button
        type="button"
        role="tab"
        aria-selected={ctx.mode === "search"}
        onClick={() => ctx.switchMode("search")}
      >
        {searchLabel}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={ctx.mode === "ai"}
        onClick={() => ctx.switchMode("ai")}
      >
        {aiLabel}
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
      ctx.switchMode(ctx.mode === "search" ? "ai" : "search");
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
              {item.value}
              {item.description ? ` — ${item.description}` : ""}
            </button>
          </li>
        ))}
      </ul>
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
  ModeToggle: AICommandModeToggle,
  Chat: AICommandChat,
  ChatMessage: AICommandChatMessage,
  ChatInput: AICommandChatInput,
  Clarification: AICommandClarification,
  NoMatch: AICommandNoMatch,
};
