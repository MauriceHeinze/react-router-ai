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
import { matchItems } from "./matcher";
import { rankCommandItems } from "./local-matcher";
import { createSpeechRecognizer } from "./speech";
import { useCommandRegistry, useRegisteredItems } from "./registry";
import type {
  AICommandContextValue,
  AICommandDialogController,
  AICommandItem,
  AICommandMatch,
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

export function AICommandRoot({
  children,
  matcher,
  threshold = 0.45,
  maxMatcherCandidates,
  maxVisibleItems,
}: PropsWithChildren<AICommandRootProps>) {
  const registry = useCommandRegistry();
  const items = useRegisteredItems(registry);
  const [query, setQueryState] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<AICommandMatch | null>(null);
  const dialogRef = useRef<AICommandDialogController | null>(null);
  const recognizerRef = useRef<ReturnType<typeof createSpeechRecognizer> | null>(null);

  const queryRef = useRef(query);
  queryRef.current = query;
  const matcherRef = useRef(matcher);
  matcherRef.current = matcher;

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

  const executeMatch = useCallback(async (match: AICommandMatch) => {
    setError(null);

    if (match.item.confirmation) {
      setPendingConfirmation(match);
      openDialog();
      return;
    }

    setPendingConfirmation(null);
    await match.item.onSelect();
  }, [openDialog]);

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
        const match = await matchItems(trimmed, registry.getItems(), {
          matcher: matcherRef.current,
          threshold,
          maxMatcherCandidates,
        });
        setIsSubmitting(false);

        if (!match) {
          setError(`No command match found for "${trimmed}".`);
          return null;
        }

        await executeMatch(match);
        return match.item;
      } catch (err) {
        setIsSubmitting(false);
        setError(err instanceof Error ? err.message : "Command failed.");
        return null;
      }
    },
    [threshold, maxMatcherCandidates, executeMatch],
  );

  const selectItem = useCallback(
    async (item: AICommandItem) => {
      const match: AICommandMatch = {
        item,
        query: queryRef.current.trim(),
        confidence: 1,
        source: "local",
      };
      await executeMatch(match);
    },
    [executeMatch],
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

  const startListening = useCallback(() => {
    if (!recognizerRef.current) {
      setError("Voice input is not available in this browser.");
      return;
    }
    setError(null);
    try {
      recognizerRef.current.start();
      setIsListening(true);
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
        setQueryState(transcript);
        void submitQuery(transcript);
      },
      onError: (message) => {
        setError(message);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    return () => {
      recognizerRef.current?.cleanup();
      recognizerRef.current = null;
    };
  }, [submitQuery]);

  const value: AICommandContextValue = {
    query,
    setQuery,
    items,
    filteredItems,
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
    selectItem,
    confirmPending,
    cancelPending,
    registerItem: registry.register,
  };

  return (
    <AICommandContext.Provider value={value}>
      {children}
    </AICommandContext.Provider>
  );
}
