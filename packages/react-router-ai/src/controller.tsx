import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type RefObject,
} from "react";
import { matchItems, resolveIntent } from "./matcher";
import { rankCommandItems } from "./local-matcher";
import { createSpeechRecognizer } from "./speech";
import { useCommandRegistry, useRegisteredItems } from "./registry";
import type {
  AICommandChatMessageData,
  AICommandContextValue,
  AICommandDialogController,
  AICommandItem,
  AICommandMatch,
  AICommandMatcher,
  AICommandMatcherResult,
  AICommandMode,
  AICommandRootProps,
} from "./types";

const AICommandContext = createContext<AICommandContextValue | null>(null);

export function useAICommand(): AICommandContextValue {
  const context = useContext(AICommandContext);
  if (!context) {
    throw new Error("useAICommand must be used inside an AICommand.Root.");
  }
  return context;
}

let chatMessageCounter = 0;
function createChatMessageId() {
  chatMessageCounter += 1;
  return `rra-chat-${chatMessageCounter}`;
}

function toConfirmationMessage(item: AICommandItem) {
  return typeof item.confirmation === "string"
    ? item.confirmation
    : `Confirm "${item.value}"?`;
}

export function AICommandRoot({
  children,
  matcher,
  threshold = 0.45,
  maxMatcherCandidates,
  maxVisibleItems,
  onContactSupport,
  initialMode = "search",
}: PropsWithChildren<AICommandRootProps>) {
  const registry = useCommandRegistry();
  const items = useRegisteredItems(registry);
  const [query, setQueryState] = useState("");
  const [mode, setModeState] = useState<AICommandMode>(initialMode);
  const [chatMessages, setChatMessages] = useState<AICommandChatMessageData[]>([]);
  const [chatInput, setChatInputState] = useState("");
  const [candidates, setCandidates] = useState<AICommandItem[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<AICommandMatch | null>(null);
  const dialogRef = useRef<AICommandDialogController | null>(null);
  const recognizerRef = useRef<ReturnType<typeof createSpeechRecognizer> | null>(null);

  const queryRef = useRef(query);
  queryRef.current = query;
  const chatInputRef = useRef(chatInput);
  chatInputRef.current = chatInput;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const matcherRef = useRef<AICommandMatcher | undefined>(matcher);
  matcherRef.current = matcher;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const thresholdRef = useRef(threshold);
  thresholdRef.current = threshold;
  const maxMatcherCandidatesRef = useRef(maxMatcherCandidates);
  maxMatcherCandidatesRef.current = maxMatcherCandidates;

  const filteredItems = useMemo(() => {
    const rankedItems = rankCommandItems(query, items);
    if (maxVisibleItems === undefined) {
      return rankedItems;
    }

    const visibleItemLimit = Math.max(0, Math.floor(maxVisibleItems));
    return rankedItems.slice(0, visibleItemLimit);
  }, [items, maxVisibleItems, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    setActiveIndex((current) => {
      if (filteredItems.length === 0) {
        return 0;
      }
      return Math.min(current, filteredItems.length - 1);
    });
  }, [filteredItems.length]);

  const openDialog = useCallback(() => {
    dialogRef.current?.setOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    dialogRef.current?.setOpen(false);
  }, []);

  const executeItem = useCallback(
    async (item: AICommandItem, confirmationMessage?: string) => {
      setError(null);
      const needsConfirmation = Boolean(item.confirmation) || Boolean(confirmationMessage);
      if (needsConfirmation) {
        const match: AICommandMatch = {
          item,
          query: queryRef.current.trim() || chatInputRef.current.trim(),
          confidence: 1,
          source: "matcher",
        };
        setPendingConfirmation(match);
        openDialog();
        return;
      }
      setPendingConfirmation(null);
      await item.onSelect();
    },
    [openDialog],
  );

  const submitQuery = useCallback(
    async (nextQuery?: string): Promise<AICommandItem | null> => {
      const trimmed = (nextQuery ?? queryRef.current).trim();
      if (!trimmed) {
        setError(null);
        setPendingConfirmation(null);
        return null;
      }

      setIsSubmitting(true);
      setError(null);
      setPendingConfirmation(null);

      try {
        const match = await matchItems(trimmed, itemsRef.current, {
          threshold: thresholdRef.current,
          maxMatcherCandidates: maxMatcherCandidatesRef.current,
        });
        setIsSubmitting(false);

        if (!match) {
          setError(`No command match found for "${trimmed}".`);
          return null;
        }

        await executeItem(match.item);
        return match.item;
      } catch (err) {
        setIsSubmitting(false);
        setError(err instanceof Error ? err.message : "Command failed.");
        return null;
      }
    },
    [executeItem],
  );

  const submitMatcherQuery = useCallback(
    async (nextQuery?: string): Promise<AICommandItem | null> => {
      const trimmed = (nextQuery ?? queryRef.current).trim();
      if (!trimmed) {
        setError(null);
        setPendingConfirmation(null);
        return null;
      }

      setIsSubmitting(true);
      setError(null);
      setPendingConfirmation(null);

      try {
        const match = await matchItems(trimmed, itemsRef.current, {
          matcher: matcherRef.current,
          threshold: thresholdRef.current,
          maxMatcherCandidates: maxMatcherCandidatesRef.current,
          forceMatcher: true,
        });
        setIsSubmitting(false);

        if (!match) {
          setError(`No AI command match found for "${trimmed}".`);
          return null;
        }

        await executeItem(match.item);
        return match.item;
      } catch (err) {
        setIsSubmitting(false);
        setError(err instanceof Error ? err.message : "AI command failed.");
        return null;
      }
    },
    [executeItem],
  );

  const selectItem = useCallback(
    async (item: AICommandItem) => {
      const match: AICommandMatch = {
        item,
        query: queryRef.current.trim(),
        confidence: 1,
        source: "local",
      };
      setError(null);
      if (item.confirmation) {
        setPendingConfirmation(match);
        openDialog();
        return;
      }
      setPendingConfirmation(null);
      await item.onSelect();
    },
    [openDialog],
  );

  const confirmPending = useCallback(async () => {
    if (!pendingConfirmation) return;
    const match = pendingConfirmation;
    setPendingConfirmation(null);
    await match.item.onSelect();
  }, [pendingConfirmation]);

  const cancelPending = useCallback(() => {
    setPendingConfirmation(null);
  }, []);

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
    setError(null);
  }, []);

  const setChatInput = useCallback((value: string) => {
    setChatInputState(value);
    setError(null);
  }, []);

  const clearCandidates = useCallback(() => {
    setCandidates(null);
  }, []);

  const selectCandidate = useCallback(
    async (item: AICommandItem) => {
      await executeItem(item);
      setCandidates(null);
    },
    [executeItem],
  );

  const appendChatMessage = useCallback((message: AICommandChatMessageData) => {
    setChatMessages((current) => [...current, message]);
  }, []);

  const submitChat = useCallback(
    async (nextMessage?: string) => {
      const trimmed = (nextMessage ?? chatInputRef.current).trim();
      if (!trimmed) return;

      const userMessage: AICommandChatMessageData = {
        id: createChatMessageId(),
        role: "user",
        content: trimmed,
      };
      appendChatMessage(userMessage);
      setChatInputState("");
      setError(null);
      setCandidates(null);
      setIsSubmitting(true);

      try {
        const result: AICommandMatcherResult = await resolveIntent(trimmed, itemsRef.current, {
          matcher: matcherRef.current,
          maxMatcherCandidates: maxMatcherCandidatesRef.current,
        });
        setIsSubmitting(false);

        if (!result) {
          const assistantMessage: AICommandChatMessageData = {
            id: createChatMessageId(),
            role: "assistant",
            content: "Sorry, I couldn't find anything. Try rephrasing, or contact support.",
          };
          appendChatMessage(assistantMessage);
          return;
        }

        if (result.kind === "no-match") {
          const assistantMessage: AICommandChatMessageData = {
            id: createChatMessageId(),
            role: "assistant",
            content:
              result.message?.trim() ||
              "Sorry, I couldn't find anything. Try rephrasing, or contact support.",
          };
          appendChatMessage(assistantMessage);
          return;
        }

        if (result.kind === "clarify") {
          const clarificationMessage: AICommandChatMessageData = {
            id: createChatMessageId(),
            role: "assistant",
            content: result.message?.trim() || "Which one did you mean?",
            candidates: result.candidates,
          };
          appendChatMessage(clarificationMessage);
          setCandidates(result.candidates);
          return;
        }

        const item = result.item;
        const confirmationMessage = result.needsApproval
          ? toConfirmationMessage(item)
          : undefined;

        const assistantMessage: AICommandChatMessageData = {
          id: createChatMessageId(),
          role: "assistant",
          content: result.message?.trim() || `Running "${item.value}".`,
          pendingItemId: result.needsApproval ? item.id : undefined,
        };
        appendChatMessage(assistantMessage);
        await executeItem(item, confirmationMessage);
      } catch (err) {
        setIsSubmitting(false);
        const message = err instanceof Error ? err.message : "AI command failed.";
        setError(message);
        const assistantMessage: AICommandChatMessageData = {
          id: createChatMessageId(),
          role: "assistant",
          content: message,
        };
        appendChatMessage(assistantMessage);
      }
    },
    [appendChatMessage, executeItem],
  );

  const switchMode = useCallback(
    (next: AICommandMode) => {
      if (next === modeRef.current) return;
      const prev = modeRef.current;

      if (next === "voice") {
        if (prev === "search") {
          const seeded = queryRef.current.trim();
          if (seeded) {
            setChatInputState(seeded);
          }
        }
      } else if (next === "ai") {
        if (prev === "search") {
          const seeded = queryRef.current.trim();
          if (seeded) {
            setChatInputState(seeded);
          }
        }
      } else if (next === "search") {
        const seeded = chatInputRef.current.trim();
        if (seeded) {
          setQueryState(seeded);
        }
      }

      setModeState(next);
      setError(null);
      setCandidates(null);
    },
    [],
  );

  const setMode = useCallback(
    (next: AICommandMode) => {
      switchMode(next);
    },
    [switchMode],
  );

  const startListening = useCallback(() => {
    if (!recognizerRef.current) {
      setError("Voice input is not available in this browser.");
      return;
    }
    setError(null);
    try {
      recognizerRef.current.start();
      setIsListening(true);
      if (modeRef.current === "ai") {
        setModeState("voice");
      }
    } catch {
      setIsListening(false);
      setError("Voice input failed. Keep typing instead.");
    }
  }, []);

  const stopListening = useCallback(() => {
    recognizerRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    recognizerRef.current = createSpeechRecognizer({
      onResult: (transcript) => {
        if (modeRef.current === "voice") {
          setChatInputState(transcript);
          setError(null);
          setIsListening(false);
          setModeState("ai");
          return;
        }
        if (modeRef.current === "ai") {
          setChatInputState(transcript);
          setError(null);
          return;
        }
        setQueryState(transcript);
        void submitMatcherQuery(transcript);
      },
      onError: (message) => {
        setError(message);
        setIsListening(false);
        if (modeRef.current === "voice") {
          setModeState("ai");
        }
      },
      onEnd: () => {
        setIsListening(false);
        if (modeRef.current === "voice") {
          setModeState("ai");
        }
      },
    });

    return () => {
      recognizerRef.current?.cleanup();
      recognizerRef.current = null;
    };
  }, [submitMatcherQuery]);

  const value: AICommandContextValue = {
    query,
    setQuery,
    items,
    filteredItems,
    hasMatcher: matcherRef.current !== undefined,
    activeIndex,
    setActiveIndex,
    isListening,
    isSubmitting,
    error,
    pendingConfirmation,
    dialogRef: dialogRef as RefObject<AICommandDialogController | null>,
    openDialog,
    closeDialog,
    startListening,
    stopListening,
    submitQuery,
    submitMatcherQuery,
    selectItem,
    confirmPending,
    cancelPending,
    registerItem: registry.register,
    mode,
    setMode,
    switchMode,
    chatMessages,
    chatInput,
    setChatInput,
    submitChat,
    candidates,
    selectCandidate,
    clearCandidates,
    onContactSupport,
  };

  return (
    <AICommandContext.Provider value={value}>
      {children}
    </AICommandContext.Provider>
  );
}
