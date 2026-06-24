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
import { findDirectCommandMatch } from "./local-matcher";
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
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<AICommandMatch | null>(null);
  const dialogRef = useRef<AICommandDialogController | null>(null);
  const recognizerRef = useRef<ReturnType<typeof createSpeechRecognizer> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

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
  const liveTranscriptRef = useRef(liveTranscript);
  liveTranscriptRef.current = liveTranscript;
  const isSubmittingRef = useRef(isSubmitting);
  isSubmittingRef.current = isSubmitting;
  const hasPendingVoiceSubmitRef = useRef(false);

  const filteredItems = useMemo(() => {
    const activeItems = items.filter((item) => !item.disabled);
    const trimmed = query.trim().toLowerCase();

    const filtered = trimmed
      ? activeItems.filter((item) => {
          const haystacks = [
            item.value,
            item.description,
            ...(item.keywords ?? []),
          ]
            .filter((value): value is string => Boolean(value))
            .map((value) => value.toLowerCase());

          return haystacks.some((haystack) => haystack.includes(trimmed));
        })
      : activeItems;

    if (maxVisibleItems === undefined) {
      return filtered;
    }

    const visibleItemLimit = Math.max(0, Math.floor(maxVisibleItems));
    return filtered.slice(0, visibleItemLimit);
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

  const resetChatStateAfterExecution = useCallback(() => {
    setChatMessages([]);
    setCandidates(null);
    setChatInputState("");
    setLiveTranscript("");
    liveTranscriptRef.current = "";
    setError(null);
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
        return false;
      }
      setPendingConfirmation(null);
      await item.onSelect();
      resetChatStateAfterExecution();
      return true;
    },
    [openDialog, resetChatStateAfterExecution],
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
      resetChatStateAfterExecution();
    },
    [openDialog, resetChatStateAfterExecution],
  );

  const confirmPending = useCallback(async () => {
    if (!pendingConfirmation) return;
    const match = pendingConfirmation;
    setPendingConfirmation(null);
    await match.item.onSelect();
    resetChatStateAfterExecution();
  }, [pendingConfirmation, resetChatStateAfterExecution]);

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

  const clearChatMessages = useCallback(() => {
    setChatMessages([]);
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  }, []);

  const startAudioAnalysis = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
    } catch {
      // Audio analysis is optional; speech recognition still works.
    }
  }, []);

  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  const startListening = useCallback(() => {
    if (!recognizerRef.current) {
      setError("Voice input is not available in this browser.");
      return;
    }
    if (isListeningRef.current) return;
    setError(null);
    setLiveTranscript("");
    liveTranscriptRef.current = "";
    hasPendingVoiceSubmitRef.current = false;
    try {
      recognizerRef.current.start();
      isListeningRef.current = true;
      setIsListening(true);
      void startAudioAnalysis();
    } catch {
      isListeningRef.current = false;
      setIsListening(false);
      setError("Voice input could not start. Check microphone permissions and browser support.");
    }
  }, [startAudioAnalysis]);

  const stopListening = useCallback(() => {
    try {
      recognizerRef.current?.stop();
    } catch {
      // recognizer may already be stopped
    }
    isListeningRef.current = false;
    setIsListening(false);
    stopAudioAnalysis();
  }, [stopAudioAnalysis]);

  const submitChat = useCallback(
    async (nextMessage?: string, isVoice = false) => {
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
        const directMatch = findDirectCommandMatch(trimmed, itemsRef.current);
        if (directMatch) {
          setIsSubmitting(false);
          await executeItem(directMatch);
          return;
        }

        const result: AICommandMatcherResult = await resolveIntent(trimmed, itemsRef.current, {
          matcher: matcherRef.current,
          maxMatcherCandidates: maxMatcherCandidatesRef.current,
        });
        setIsSubmitting(false);

        if (!result) {
          const assistantMessage: AICommandChatMessageData = {
            id: createChatMessageId(),
            role: "assistant",
            content: isVoice
              ? "Please try again."
              : "Sorry, I couldn't find anything. Try rephrasing, or contact support.",
          };
          appendChatMessage(assistantMessage);
          if (isVoice) startListening();
          return;
        }

        if (result.kind === "no-match") {
          const assistantMessage: AICommandChatMessageData = {
            id: createChatMessageId(),
            role: "assistant",
            content: isVoice
              ? "Please try again."
              : result.message?.trim() ||
                "Sorry, I couldn't find anything. Try rephrasing, or contact support.",
          };
          appendChatMessage(assistantMessage);
          if (isVoice) startListening();
          return;
        }

        if (result.kind === "clarify") {
          if (result.candidates.length === 1) {
            await executeItem(result.candidates[0]);
            return;
          }
          const topCandidates = result.candidates.slice(0, 3);
          if (!isVoice) {
            const clarificationMessage: AICommandChatMessageData = {
              id: createChatMessageId(),
              role: "assistant",
              content: result.message?.trim() || "Which one did you mean?",
              candidates: topCandidates,
            };
            appendChatMessage(clarificationMessage);
          }
          setCandidates(topCandidates);
          if (isVoice) startListening();
          return;
        }

        const item = result.item;
        const confirmationMessage = result.needsApproval
          ? toConfirmationMessage(item)
          : undefined;
        if (confirmationMessage) {
          const assistantMessage: AICommandChatMessageData = {
            id: createChatMessageId(),
            role: "assistant",
            content: result.message?.trim() || `Running "${item.value}".`,
            pendingItemId: item.id,
          };
          appendChatMessage(assistantMessage);
        }
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
        if (isVoice) startListening();
      }
    },
    [appendChatMessage, executeItem, startListening],
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

  useEffect(() => {
    recognizerRef.current = createSpeechRecognizer({
      onInterimResult: (transcript) => {
        liveTranscriptRef.current = transcript;
        setLiveTranscript(transcript);
        hasPendingVoiceSubmitRef.current = transcript.trim().length > 0;
      },
      onResult: (transcript) => {
        liveTranscriptRef.current = transcript;
        setLiveTranscript(transcript);
        hasPendingVoiceSubmitRef.current = false;
        if (modeRef.current === "voice") {
          setChatInputState(transcript);
          setError(null);
          isListeningRef.current = false;
          setIsListening(false);
          void submitChat(transcript, true);
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
        isListeningRef.current = false;
        setIsListening(false);
      },
      onEnd: () => {
        isListeningRef.current = false;
        setIsListening(false);
        const transcript = liveTranscriptRef.current.trim();
        if (
          modeRef.current === "voice" &&
          hasPendingVoiceSubmitRef.current &&
          transcript &&
          !isSubmittingRef.current
        ) {
          hasPendingVoiceSubmitRef.current = false;
          setError(null);
          setChatInputState(transcript);
          void submitChat(transcript, true);
        }
      },
    });

    return () => {
      recognizerRef.current?.cleanup();
      recognizerRef.current = null;
      stopAudioAnalysis();
    };
  }, [submitMatcherQuery, submitChat, stopAudioAnalysis]);

  // Voice mode is disabled.
  // useEffect(() => {
  //   if (mode === "voice") {
  //     startListening();
  //   } else if (isListeningRef.current) {
  //     stopListening();
  //   }
  // }, [mode, startListening, stopListening]);

  const value: AICommandContextValue = {
    query,
    setQuery,
    items,
    filteredItems,
    hasMatcher: matcherRef.current !== undefined,
    activeIndex,
    setActiveIndex,
    isListening,
    mediaRecorder: mediaRecorderRef.current,
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
    liveTranscript,
    chatMessages,
    chatInput,
    setChatInput,
    submitChat,
    candidates,
    selectCandidate,
    clearCandidates,
    clearChatMessages,
    onContactSupport,
  };

  return (
    <AICommandContext.Provider value={value}>
      {children}
    </AICommandContext.Provider>
  );
}
