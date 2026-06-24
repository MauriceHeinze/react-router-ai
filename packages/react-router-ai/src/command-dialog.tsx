import { useEffect, type ReactNode, type SVGProps } from "react";
import { AICommand } from "./ai-command";
import { useAICommand } from "./controller";
import type { AICommandItem } from "./types";
import type { WeaviateRouteResult } from "./ai-command";

export type { WeaviateRouteResult as AICommandWeaviateRouteResult };

export type CommandDialogIcons = {
  search?: ReactNode;
  microphone?: ReactNode;
};

export type CommandDialogLabels = {
  runShortcut?: string;
  moveShortcut?: string;
  closeShortcut?: string;
  sendShortcut?: string;
  recordShortcut?: string;
  stopRecordingShortcut?: string;
};

export type CommandDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: AICommandItem[];
  searchPlaceholder?: string;
  chatPlaceholder?: string;
  voicePrompt?: ReactNode;
  emptyMessage?: ReactNode;
  clarificationMessage?: string;
  userLabel?: string;
  weaviateUrl?: string;
  weaviateApiKey?: string;
  clusterUrl?: string;
  onSelectWeaviateRoute?: (route: string, item: WeaviateRouteResult) => void;
  renderItem?: (item: AICommandItem) => ReactNode;
  renderWeaviateItem?: (item: WeaviateRouteResult) => ReactNode;
  onContactSupport?: () => void;
  icons?: CommandDialogIcons;
  labels?: CommandDialogLabels;
};

function DefaultSearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function DefaultMicrophoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v4M8 23h8" />
    </svg>
  );
}

function defaultRenderItem(item: AICommandItem) {
  return (
    <>
      <span ai-command-dialog-item-value="">{item.value}</span>
      {item.description ? (
        <span ai-command-dialog-item-description="">{item.description}</span>
      ) : null}
    </>
  );
}

function defaultRenderWeaviateItem(item: WeaviateRouteResult) {
  return (
    <>
      <span ai-command-dialog-item-value="">{item.label || item.route}</span>
      {item.description ? (
        <span ai-command-dialog-item-description="">{item.description}</span>
      ) : null}
    </>
  );
}

function CommandDialogContent({
  onOpenChange,
  items,
  searchPlaceholder = "Search...",
  chatPlaceholder = "Ask AI...",
  voicePrompt = "What are you looking for?",
  emptyMessage = "No matching command.",
  clarificationMessage = "Did you mean?",
  userLabel = "Your Request",
  weaviateUrl,
  weaviateApiKey,
  clusterUrl,
  onSelectWeaviateRoute,
  renderItem = defaultRenderItem,
  renderWeaviateItem = defaultRenderWeaviateItem,
  onContactSupport,
  icons = {},
  labels = {},
}: CommandDialogProps) {
  const ctx = useAICommand();
  const {
    clearChatMessages,
    isListening,
    mode,
    startListening,
    stopListening,
  } = ctx;
  const isVoiceMode = mode === "voice";
  const isSearchMode = mode === "search";

  const searchIcon = icons.search ?? (
    <DefaultSearchIcon ai-command-dialog-search-icon="" />
  );
  const microphoneIcon = icons.microphone ?? (
    <DefaultMicrophoneIcon ai-command-dialog-mic-icon="" />
  );

  useEffect(() => {
    if (!ctx.dialogRef.current?.open && isListening) {
      stopListening();
    }
  }, [isListening, stopListening, ctx.dialogRef]);

  useEffect(() => {
    if (mode === "voice") {
      clearChatMessages();
    }
  }, [clearChatMessages, mode]);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        onOpenChange(false);
        return;
      }

      if (!isVoiceMode) return;

      if (
        event.key !== " " ||
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }

      event.preventDefault();

      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isListening, isVoiceMode, onOpenChange, startListening, stopListening]);

  return (
    <div
      ai-command-dialog-overlay=""
      onClick={() => onOpenChange(false)}
    >
      <div
        ai-command-dialog=""
        onClick={(event) => event.stopPropagation()}
      >
        {!isSearchMode ? (
          <div ai-command-dialog-registry="" aria-hidden="true">
            <AICommand.List>
              {items.map((item) => (
                <AICommand.Item key={item.id} {...item} onSelect={async () => item.onSelect()}>
                  {item.value}
                </AICommand.Item>
              ))}
            </AICommand.List>
          </div>
        ) : null}

        {isSearchMode ? (
          <div ai-command-dialog-search="">
            <div ai-command-dialog-search-input-wrap="">
              {searchIcon}

              <AICommand.Input
                autoFocus
                placeholder={searchPlaceholder}
                ai-command-dialog-input=""
              />
            </div>

            <div ai-command-dialog-body="">
              <AICommand.Loading ai-command-dialog-loader="">
                <span ai-command-dialog-spinner="" />
                <span>Searching...</span>
              </AICommand.Loading>

              <AICommand.Error ai-command-dialog-error="" />

              <AICommand.Confirmation ai-command-dialog-confirmation="" />

              <AICommand.List ai-command-dialog-list="">
                {weaviateUrl && weaviateApiKey && onSelectWeaviateRoute ? (
                  <AICommand.WeaviateRoutes
                    weaviateUrl={weaviateUrl}
                    weaviateApiKey={weaviateApiKey}
                    clusterUrl={clusterUrl}
                    limit={8}
                    debounceMs={200}
                    minQueryLength={2}
                    minScore={0.8}
                    onSelectRoute={(route, item) => {
                      onSelectWeaviateRoute(route, item);
                      onOpenChange(false);
                    }}
                    ai-command-dialog-item-weaviate=""
                    renderItem={renderWeaviateItem}
                  />
                ) : null}

                {items.map((item) => (
                  <AICommand.Item
                    key={item.id}
                    {...item}
                    onSelect={async () => {
                      await item.onSelect();
                      onOpenChange(false);
                    }}
                    ai-command-dialog-item=""
                  >
                    {renderItem(item)}
                  </AICommand.Item>
                ))}
              </AICommand.List>

              <AICommand.Empty ai-command-dialog-empty="">{emptyMessage}</AICommand.Empty>
            </div>

            <div ai-command-dialog-footer="">
              <div ai-command-dialog-shortcuts="" aria-hidden="true">
                <span ai-command-dialog-shortcut="">
                  <span ai-command-dialog-keycap="">Enter</span>{" "}
                  {labels.runShortcut ?? "Run"}
                </span>
                <span ai-command-dialog-shortcut="">
                  <span ai-command-dialog-keycap="">↑↓</span>{" "}
                  {labels.moveShortcut ?? "Move"}
                </span>
                <span ai-command-dialog-shortcut="">
                  <span ai-command-dialog-keycap="">Esc</span>{" "}
                  {labels.closeShortcut ?? "Close"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div ai-command-dialog-chat-panel="">
            <div
              ai-command-dialog-chat=""
              data-voice-empty={isVoiceMode && ctx.chatMessages.length === 0 ? "" : undefined}
            >
              <AICommand.Chat>
                <AICommand.ChatEmptyPrompt ai-command-dialog-voice-prompt="">
                  <h2>{voicePrompt}</h2>
                </AICommand.ChatEmptyPrompt>

                {ctx.chatMessages.map((message) => (
                  <AICommand.ChatMessage
                    key={message.id}
                    message={message}
                    userLabel={userLabel}
                    ai-command-dialog-chat-message=""
                  />
                ))}

                <AICommand.Loading
                  ai-command-dialog-loader={isVoiceMode ? undefined : ""}
                  ai-command-dialog-voice-thinking={isVoiceMode ? "" : undefined}
                >
                  {isVoiceMode ? (
                    <span ai-command-dialog-thinking="">
                      Thinking
                      <span ai-command-dialog-thinking-dots="" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                    </span>
                  ) : (
                    <>
                      <span ai-command-dialog-spinner="" />
                      <span>Thinking...</span>
                    </>
                  )}
                </AICommand.Loading>

                <AICommand.Error ai-command-dialog-error="" />

                <AICommand.Confirmation ai-command-dialog-confirmation="" />

                <AICommand.Clarification
                  ai-command-dialog-clarification=""
                  message={clarificationMessage}
                />

                <AICommand.NoMatch
                  ai-command-dialog-no-match=""
                  onContactSupport={onContactSupport}
                />
              </AICommand.Chat>
            </div>

            {mode === "ai" ? (
              <div ai-command-dialog-chat-input-wrap="">
                <AICommand.ChatInput
                  autoFocus
                  placeholder={chatPlaceholder}
                  ai-command-dialog-chat-input=""
                />

                <AICommand.VoiceButton
                  ai-command-dialog-chat-mic=""
                  title="Mic (Ctrl+M)"
                >
                  {microphoneIcon}
                </AICommand.VoiceButton>
              </div>
            ) : (
              <div ai-command-dialog-voice-controls="">
                <div
                  ai-command-dialog-audio-wave=""
                  aria-label="Live microphone waveform"
                >
                  <AICommand.VoiceWaveform ai-command-dialog-audio-wave-renderer="" />
                </div>

                <AICommand.VoiceButton
                  ai-command-dialog-voice-mic=""
                  title={isListening ? "Stop listening" : "Start listening"}
                >
                  {microphoneIcon}
                </AICommand.VoiceButton>
              </div>
            )}

            <div ai-command-dialog-footer="">
              <div ai-command-dialog-shortcuts="" aria-hidden="true">
                {isVoiceMode ? (
                  <span ai-command-dialog-shortcut="">
                    <span ai-command-dialog-keycap="">Space</span>{" "}
                    {isListening
                      ? labels.stopRecordingShortcut ?? "Stop Recording"
                      : labels.recordShortcut ?? "Record"}
                  </span>
                ) : (
                  <span ai-command-dialog-shortcut="">
                    <span ai-command-dialog-keycap="">Enter</span>{" "}
                    {labels.sendShortcut ?? "Send Message"}
                  </span>
                )}

                <span ai-command-dialog-shortcut="">
                  <span ai-command-dialog-keycap="">↑↓</span>{" "}
                  {labels.moveShortcut ?? "Move"}
                </span>

                <span ai-command-dialog-shortcut="">
                  <span ai-command-dialog-keycap="">Esc</span>{" "}
                  {labels.closeShortcut ?? "Close"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CommandDialog(props: CommandDialogProps) {
  return (
    <AICommand.Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <CommandDialogContent {...props} />
    </AICommand.Dialog>
  );
}
