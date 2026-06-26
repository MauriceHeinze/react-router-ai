import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PropsWithChildren,
} from "react";
import { AICommandRoot, useAICommand } from "./command-controller";
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
  WithAICommandAttributes,
} from "./types";

export function AICommandDialog({
  children,
  open: controlledOpen,
  onOpenChange,
  ...rest
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
    if (!open) {
      ctx.stopListening();
    }
  }, [open, ctx.stopListening]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        return;
      }
      // Tab mode navigation is disabled.
      // if (
      //   event.key === "Tab" &&
      //   !event.defaultPrevented &&
      //   !event.shiftKey &&
      //   !event.metaKey &&
      //   !event.ctrlKey &&
      //   !event.altKey &&
      //   ctx.mode === "voice"
      // ) {
      //   event.preventDefault();
      //   const modes = ["search", "ai", "voice"] as const;
      //   const idx = modes.indexOf(ctx.mode);
      //   const next = modes[(idx + 1) % modes.length];
      //   ctx.switchMode(next);
      // }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setOpen, ctx.mode, ctx.switchMode]);

  if (!open) return null;

  return (
    <div
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      ai-command-dialog=""
    >
      {children}
    </div>
  );
}

export function AICommandInput({
  placeholder,
  value: controlledValue,
  onValueChange,
  onKeyDown,
  onChange,
  modeShortcut,
  micShortcut,
  onFocus,
  onBlur,
  autoFocus,
  className,
  style,
  ...rest
}: AICommandInputProps) {
  // Shortcuts are disabled while voice mode is disabled.
  void modeShortcut;
  void micShortcut;

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
    onChange?.(event);
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
    }
    // Tab mode navigation and voice mic shortcut are disabled.
    // else if (
    //   modeShortcut === "tab" &&
    //   event.key === "Tab" &&
    //   !event.shiftKey &&
    //   !event.metaKey &&
    //   !event.ctrlKey &&
    //   !event.altKey
    // ) {
    //   event.preventDefault();
    //   const modes = ["search", "ai", "voice"] as const;
    //   const idx = modes.indexOf(ctx.mode);
    //   const next = modes[(idx + 1) % modes.length];
    //   ctx.switchMode(next);
    // } else if (
    //   micShortcut === "ctrl+m" &&
    //   (event.key === "m" || event.key === "M") &&
    //   event.ctrlKey &&
    //   !event.metaKey &&
    //   !event.altKey &&
    //   !event.shiftKey
    // ) {
    //   event.preventDefault();
    //   if (ctx.isListening) {
    //     ctx.stopListening();
    //   } else {
    //     ctx.startListening();
    //   }
    // }
    onKeyDown?.(event);
  }

  return (
    <input
      {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
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
      ai-command-input=""
    />
  );
}

export function AICommandList({
  children,
  className,
  style,
  ...rest
}: PropsWithChildren<AICommandListProps>) {
  return (
    <div
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
      role="listbox"
      aria-label="Commands"
      className={className}
      style={style}
      ai-command-list=""
    >
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
  onClick,
  ...rest
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
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      onClick={(event) => {
        onClick?.(event);
        void ctx.selectItem(itemRef.current);
      }}
      className={className}
      style={{ ...style, order: index }}
      ai-command-item=""
      data-selected={isSelected || undefined}
    >
      {children}
    </div>
  );
}

export function AICommandEmpty({
  children,
  className,
  style,
  ...rest
}: PropsWithChildren<AICommandEmptyProps>) {
  const ctx = useAICommand();
  if (ctx.isSubmitting || ctx.filteredItems.length > 0) return null;
  return (
    <div {...(rest as React.HTMLAttributes<HTMLDivElement>)} role="status" className={className} style={style} ai-command-empty="">
      {children}
    </div>
  );
}

export function AICommandLoading({
  children,
  className,
  style,
  ...rest
}: PropsWithChildren<AICommandLoadingProps>) {
  const ctx = useAICommand();
  if (!ctx.isSubmitting) return null;
  return (
    <div
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
      role="status"
      aria-busy="true"
      className={className}
      style={style}
      ai-command-loading=""
    >
      {children ?? "Loading..."}
    </div>
  );
}

export function AICommandError({ children, className, style, ...rest }: AICommandErrorProps) {
  const ctx = useAICommand();
  if (!ctx.error) return null;
  return (
    <div {...(rest as React.HTMLAttributes<HTMLDivElement>)} role="alert" className={className} style={style} ai-command-error="">
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
  ...rest
}: PropsWithChildren<AICommandVoiceButtonProps>) {
  const ctx = useAICommand();
  if (ctx.isListening) return null;

  return (
    <button
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      type="button"
      aria-pressed={false}
      title={title}
      onClick={(event) => {
        onClick?.(event);
        ctx.startListening();
      }}
      className={className}
      style={style}
      ai-command-voice-button=""
    >
      {children ?? "Use voice"}
    </button>
  );
}

export function AICommandConfirmation({
  className,
  style,
  ...rest
}: AICommandConfirmationProps) {
  const ctx = useAICommand();
  if (!ctx.pendingConfirmation) return null;

  const message =
    typeof ctx.pendingConfirmation.item.confirmation === "string"
      ? ctx.pendingConfirmation.item.confirmation
      : `Confirm "${ctx.pendingConfirmation.item.value}"?`;

  return (
    <div {...(rest as React.HTMLAttributes<HTMLDivElement>)} className={className} style={style} ai-command-confirmation="">
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
  className,
  style,
  ...rest
}: AICommandModeHeaderProps) {
  return (
    <div {...(rest as React.HTMLAttributes<HTMLDivElement>)} className={className} style={style} ai-command-mode-header="">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }} />
    </div>
  );
}

export function AICommandChat({
  children,
  className,
  style,
  ...rest
}: PropsWithChildren<AICommandChatProps>) {
  const ctx = useAICommand();
  return (
    <div
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
      role="log"
      aria-label="AI chat"
      aria-live="polite"
      aria-busy={ctx.isSubmitting || undefined}
      className={className}
      style={style}
      ai-command-chat=""
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
  ...rest
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
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
      role={isUser ? "user" : "assistant"}
      data-role={message.role}
      className={className}
      style={style}
      ai-command-chat-message=""
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
  onChange,
  modeShortcut,
  micShortcut,
  onFocus,
  onBlur,
  autoFocus,
  rows = 2,
  className,
  style,
  ...rest
}: AICommandChatInputProps) {
  // Shortcuts are disabled while voice mode is disabled.
  void modeShortcut;
  void micShortcut;

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
    onChange?.(event);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void ctx.submitChat();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      ctx.closeDialog();
    }
    // Tab mode navigation and voice mic shortcut are disabled.
    // else if (
    //   modeShortcut === "tab" &&
    //   event.key === "Tab" &&
    //   !event.shiftKey &&
    //   !event.metaKey &&
    //   !event.ctrlKey &&
    //   !event.altKey
    // ) {
    //   event.preventDefault();
    //   const modes = ["search", "ai", "voice"] as const;
    //   const idx = modes.indexOf(ctx.mode);
    //   const next = modes[(idx + 1) % modes.length];
    //   ctx.switchMode(next);
    // } else if (
    //   micShortcut === "ctrl+m" &&
    //   (event.key === "m" || event.key === "M") &&
    //   event.ctrlKey &&
    //   !event.metaKey &&
    //   !event.altKey &&
    //   !event.shiftKey
    // ) {
    //   event.preventDefault();
    //   if (ctx.isListening) {
    //     ctx.stopListening();
    //   } else {
    //     ctx.startListening();
    //   }
    // }
    onKeyDown?.(event);
  }

  return (
    <textarea
      {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
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
      ai-command-chat-input=""
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
  ...rest
}: AICommandClarificationProps) {
  const ctx = useAICommand();
  if (!ctx.candidates || ctx.candidates.length === 0) return null;
  return (
    <div
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
      role="group"
      aria-label="Clarification"
      className={className}
      style={style}
      ai-command-clarification=""
    >
      <p style={{ margin: "0 0 8px" }}>{message}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {ctx.candidates.map((item) => (
          <li key={item.id} style={{ margin: "4px 0" }}>
            <button
              type="button"
              className={itemClassName}
              style={itemStyle}
              ai-command-clarification-item=""
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
  ...rest
}: PropsWithChildren<AICommandVoiceEmptyPromptProps>) {
  const ctx = useAICommand();
  if (ctx.mode !== "voice" || ctx.chatMessages.length > 0 || ctx.isSubmitting) return null;
  return (
    <div {...(rest as React.HTMLAttributes<HTMLDivElement>)} className={className} style={style} ai-command-voice-empty-prompt="">
      {children}
    </div>
  );
}

export function AICommandChatEmptyPrompt({
  children,
  className,
  style,
  ...rest
}: PropsWithChildren<AICommandChatEmptyPromptProps>) {
  const ctx = useAICommand();
  if (ctx.mode === "search" || ctx.chatMessages.length > 0 || ctx.isSubmitting) return null;
  return (
    <div {...(rest as React.HTMLAttributes<HTMLDivElement>)} className={className} style={style} ai-command-chat-empty-prompt="">
      {children}
    </div>
  );
}

function VoiceWaveformCanvas({ mediaRecorder }: { mediaRecorder: MediaRecorder }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let stream: MediaStream;
    try {
      stream = mediaRecorder.stream;
    } catch {
      return;
    }

    if (!stream.active) return;

    let audioCtx: AudioContext | null = null;
    try {
      audioCtx = new AudioContext();
    } catch {
      return;
    }

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.4;
    let source: MediaStreamAudioSourceNode | null = null;
    try {
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
    } catch {
      audioCtx.close();
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      source.disconnect();
      audioCtx.close();
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      animRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const { width, height } = canvas!;
      ctx!.clearRect(0, 0, width, height);

      const barCount = bufferLength;
      const totalWidth = width;
      const barWidth = Math.max(1, (totalWidth / barCount) * 0.7);
      const gap = Math.max(0, (totalWidth / barCount) * 0.3);

      for (let i = 0; i < barCount; i++) {
        const barHeight = Math.max(1, (dataArray[i] / 255) * height);
        const x = i * (barWidth + gap);
        ctx!.fillStyle = "currentColor";
        ctx!.fillRect(x, height - barHeight, barWidth, barHeight);
      }
    }

    draw();

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      try {
        source!.disconnect();
      } catch {
        // already disconnected
      }
      audioCtx!.close();
    };
  }, [mediaRecorder]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={40}
      style={{ width: "100%", height: 40, display: "block" }}
    />
  );
}

export function AICommandVoiceWaveform({
  className,
  style,
  ...rest
}: AICommandVoiceWaveformProps) {
  const ctx = useAICommand();
  if (!ctx.isListening) return null;

  return (
    <div
      {...(rest as React.HTMLAttributes<HTMLDivElement>)}
      className={className}
      style={style}
      aria-label="Voice waveform"
      aria-busy="true"
      ai-command-voice-waveform=""
    >
      {ctx.mediaRecorder ? (
        <VoiceWaveformCanvas mediaRecorder={ctx.mediaRecorder} />
      ) : null}
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
  ...rest
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
    <div {...(rest as React.HTMLAttributes<HTMLDivElement>)} role="status" className={className} style={style} ai-command-no-match="">
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

export type WeaviateRouteResult = {
  route: string;
  label: string;
  description: string;
  score?: number;
  explainScore?: string;
};

export type WeaviateRoutesProps = WithAICommandAttributes<{
  weaviateUrl: string;
  weaviateApiKey: string;
  clusterUrl?: string;
  recommendedRoutes?: readonly WeaviateRouteResult[];
  limit?: number;
  debounceMs?: number;
  minQueryLength?: number;
  minScore?: number;
  onSelectRoute: (route: string, item: WeaviateRouteResult) => void;
  renderItem?: (item: WeaviateRouteResult) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}>;

export function AICommandWeaviateRoutes({
  weaviateUrl,
  weaviateApiKey,
  clusterUrl,
  recommendedRoutes = [],
  limit = 10,
  debounceMs = 200,
  minQueryLength = 2,
  minScore = 0.8,
  onSelectRoute,
  renderItem,
  className,
  style,
  ...rest
}: WeaviateRoutesProps) {
  const ctx = useAICommand();
  const [routes, setRoutes] = useState<WeaviateRouteResult[]>(() => [...recommendedRoutes]);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const query = ctx.query.trim();

  useEffect(() => {
    if (query.length < minQueryLength) {
      setRoutes([...recommendedRoutes]);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    const abortController = new AbortController();

    const timeout = window.setTimeout(() => {
      void searchWeaviateRoutes({
        query,
        weaviateUrl,
        weaviateApiKey,
        clusterUrl,
        limit,
        minScore,
        signal: abortController.signal,
      })
        .then((nextRoutes) => {
          if (requestIdRef.current !== requestId) return;
          setRoutes(nextRoutes);
          setError(null);
        })
        .catch((err) => {
          if (abortController.signal.aborted) return;
          if (requestIdRef.current !== requestId) return;

          setRoutes([]);
          setError(err instanceof Error ? err.message : "Weaviate search failed.");
        });
    }, debounceMs);

    return () => {
      window.clearTimeout(timeout);
      abortController.abort();
    };
  }, [
    query,
    weaviateUrl,
    weaviateApiKey,
    clusterUrl,
    limit,
    debounceMs,
    minQueryLength,
    minScore,
    recommendedRoutes,
  ]);

  if (error) {
    return (
      <div
        {...(rest as React.HTMLAttributes<HTMLDivElement>)}
        role="alert"
        className={className}
        style={style}
        ai-command-weaviate-routes=""
      >
        {error}
      </div>
    );
  }

  return (
    <>
      {routes.map((item, index) => (
        <AICommandItem
          key={`weaviate:${item.route}:${index}`}
          id={`weaviate:${item.route}:${index}`}
          value={item.label || item.route}
          description={item.description}
          keywords={[query, item.route, item.label, item.description].filter(Boolean)}
          onSelect={() => onSelectRoute(item.route, item)}
          className={className}
          style={style}
          {...rest}
        >
          {renderItem ? (
            renderItem(item)
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ display: "block", fontWeight: 600 }}>
                {item.label || item.route}
              </span>

              {item.description ? (
                <span style={{ display: "block", opacity: 0.7 }}>
                  {item.description}
                </span>
              ) : null}

              {item.score !== undefined ? (
                <span style={{ display: "block", opacity: 0.65, fontSize: "0.8em" }}>
                  Score: {item.score.toFixed(3)}
                </span>
              ) : null}
            </div>
          )}
        </AICommandItem>
      ))}
    </>
  );
}

async function searchWeaviateRoutes({
  query,
  weaviateUrl,
  weaviateApiKey,
  clusterUrl,
  limit,
  minScore,
  signal,
}: {
  query: string;
  weaviateUrl: string;
  weaviateApiKey: string;
  clusterUrl?: string;
  limit: number;
  minScore: number;
  signal?: AbortSignal;
}): Promise<WeaviateRouteResult[]> {
  const normalizedUrl =
    weaviateUrl.startsWith("http") || weaviateUrl.startsWith("/")
      ? weaviateUrl
      : `https://${weaviateUrl}`;

  const normalizedClusterUrl = clusterUrl ?? normalizedUrl;
  const escapedQuery = JSON.stringify(query);

  const graphQlQuery = `
    {
      Get {
        Routes(
          hybrid: {
            query: ${escapedQuery}
            alpha: 1
          }
          limit: ${limit}
        ) {
          path
          label
          description
          _additional {
            score
            explainScore
          }
        }
      }
    }
  `;

  const response = await fetch(`${normalizedUrl}/v1/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${weaviateApiKey}`,
      "X-Weaviate-Cluster-Url": normalizedClusterUrl,
    },
    body: JSON.stringify({ query: graphQlQuery }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Weaviate query failed (${response.status}). ${errorText}`);
  }

  const data = (await response.json()) as {
    data?: {
      Get?: {
        Routes?: Array<{
          path?: unknown;
          label?: unknown;
          description?: unknown;
          _additional?: {
            score?: string | number;
            explainScore?: string;
          };
        }>;
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (data.errors?.length) {
    const messages = data.errors.map((error) => error.message).join("; ");
    throw new Error(`Weaviate GraphQL errors: ${messages}`);
  }

  return (data.data?.Get?.Routes ?? [])
    .map((row) => ({
      route: stringOrEmpty(row.path),
      label: stringOrEmpty(row.label),
      description: stringOrEmpty(row.description),
      score: numberOrUndefined(row._additional?.score),
      explainScore: row._additional?.explainScore,
    }))
    .filter((item) => item.route && item.score !== undefined && item.score >= minScore)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

function stringOrEmpty(value: unknown): string {
  return String(value ?? "").trim();
}

function numberOrUndefined(value: unknown): number | undefined {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
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
  WeaviateRoutes: AICommandWeaviateRoutes,
};
