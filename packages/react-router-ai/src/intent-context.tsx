import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { matchVoiceCommandsWithBuiltInLlm } from "./llm-fallback";
import { rankVoiceCommands } from "./matcher";
import type {
  Intent,
  IntentContextValue,
  IntentMatch,
  IntentProviderProps,
  SpeechRecognitionInstance,
  VoiceCommand,
  VoiceCommandExecutionContext,
  VoiceCommandMatch,
  VoiceContextValue,
  VoiceProviderProps,
} from "./types";

const VoiceContext = createContext<VoiceContextValue | null>(null);

function getRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function getAmbiguousCandidates(matches: VoiceCommandMatch[], threshold: number, ambiguityThreshold: number) {
  const viable = matches.filter((match) => match.confidence >= threshold);
  if (viable.length < 2) return null;

  const [best, second] = viable;
  if (!best || !second) return null;
  if (best.confidence - second.confidence > ambiguityThreshold) return null;

  return viable.slice(0, 3);
}

async function executeMatch(match: VoiceCommandMatch) {
  await match.command.run(match.parameters, {
    command: match.command,
    match,
    query: match.query,
    readCurrentValue: () => match.command.read?.(),
  });
}

function toIntentMatch(intents: Intent[], match: VoiceCommandMatch): IntentMatch | null {
  const intent = intents.find((candidate) => candidate.id === match.command.id);
  if (!intent) return null;

  return {
    intent,
    query: match.query,
    confidence: match.confidence,
    source: match.source,
  };
}

export function VoiceProvider({
  commands,
  threshold = 0.45,
  ambiguityThreshold = 0.12,
  llmFallback,
  children,
}: PropsWithChildren<VoiceProviderProps>) {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastMatch, setLastMatch] = useState<VoiceCommandMatch | null>(null);
  const [candidates, setCandidates] = useState<VoiceCommandMatch[] | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<VoiceCommandMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const registeredCommandsRef = useRef<VoiceCommand[]>([]);
  const [registeredCommandsVersion, setRegisteredCommandsVersion] = useState(0);

  const allCommands = useMemo(
    () => [...commands, ...registeredCommandsRef.current],
    [commands, registeredCommandsVersion],
  );

  useEffect(() => {
    const Recognition = getRecognition();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (!transcript) return;
      setQuery(transcript);
      void submitQueryInternal(transcript);
    };
    recognition.onerror = () => {
      setError("Voice input failed. Keep typing instead.");
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  async function handleResolvedMatch(match: VoiceCommandMatch) {
    setError(null);
    setCandidates(null);
    setLastMatch(match);

    if (match.command.confirmation) {
      setPendingConfirmation(match);
      return match;
    }

    setPendingConfirmation(null);
    await executeMatch(match);
    return match;
  }

  async function submitQueryInternal(nextQuery?: string) {
    const trimmed = (nextQuery ?? query).trim();
    if (!trimmed) {
      setLastMatch(null);
      setCandidates(null);
      setPendingConfirmation(null);
      return null;
    }

    setIsSubmitting(true);
    setCandidates(null);
    setPendingConfirmation(null);
    setError(null);

    const rankedMatches = rankVoiceCommands(trimmed, allCommands);
    const bestMatch = rankedMatches[0] ?? null;

    if (bestMatch && bestMatch.confidence >= threshold) {
      const ambiguous = getAmbiguousCandidates(rankedMatches, threshold, ambiguityThreshold);
      if (ambiguous) {
        setLastMatch(null);
        setCandidates(ambiguous);
        setIsSubmitting(false);
        return null;
      }

      setIsSubmitting(false);
      return handleResolvedMatch(bestMatch);
    }

    const llmMatches = await matchVoiceCommandsWithBuiltInLlm(trimmed, allCommands, llmFallback);
    setIsSubmitting(false);

    if (llmMatches.length === 0) {
      setLastMatch(null);
      setError(`No command match found for "${trimmed}".`);
      return null;
    }

    if (llmMatches.length > 1 && llmMatches[0].confidence - llmMatches[1].confidence <= ambiguityThreshold) {
      setLastMatch(null);
      setCandidates(llmMatches.slice(0, 3));
      return null;
    }

    return handleResolvedMatch(llmMatches[0]);
  }

  async function selectMatch(match: VoiceCommandMatch) {
    await handleResolvedMatch(match);
  }

  function clearCandidates() {
    setCandidates(null);
  }

  async function confirmPending() {
    if (!pendingConfirmation) return;
    const pending = pendingConfirmation;
    setPendingConfirmation(null);
    await executeMatch(pending);
  }

  function cancelPending() {
    setPendingConfirmation(null);
  }

  const registerCommand = useCallback((command: VoiceCommand) => {
    registeredCommandsRef.current = [...registeredCommandsRef.current, command];
    setRegisteredCommandsVersion((current) => current + 1);

    return () => {
      registeredCommandsRef.current = registeredCommandsRef.current.filter(
        (candidate) => candidate !== command,
      );
      setRegisteredCommandsVersion((current) => current + 1);
    };
  }, []);

  const value: VoiceContextValue = {
    commands: allCommands,
    query,
    isListening,
    isSubmitting,
    lastMatch,
    candidates,
    pendingConfirmation,
    error,
    setQuery(value) {
      setError(null);
      setQuery(value);
    },
    submitQuery: submitQueryInternal,
    selectMatch,
    clearCandidates,
    confirmPending,
    cancelPending,
    startListening() {
      const recognition = recognitionRef.current;
      if (!recognition) {
        setError("Voice input is not available in this browser.");
        return;
      }

      setError(null);
      setIsListening(true);
      recognition.start();
    },
    stopListening() {
      recognitionRef.current?.stop();
      setIsListening(false);
    },
    registerCommand,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoiceController() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoiceController must be used inside a VoiceProvider.");
  }
  return context;
}

export function useVoiceCommand(command: VoiceCommand) {
  const { registerCommand } = useVoiceController();
  const commandRef = useRef(command);
  const stableCommandRef = useRef<VoiceCommand | null>(null);

  commandRef.current = command;

  if (!stableCommandRef.current) {
    stableCommandRef.current = {
      get id() {
        return commandRef.current.id;
      },
      get title() {
        return commandRef.current.title;
      },
      get description() {
        return commandRef.current.description;
      },
      get phrases() {
        return commandRef.current.phrases;
      },
      get keywords() {
        return commandRef.current.keywords;
      },
      get parameters() {
        return commandRef.current.parameters;
      },
      get confirmation() {
        return commandRef.current.confirmation;
      },
      read() {
        return commandRef.current.read?.();
      },
      run(args, context) {
        return commandRef.current.run(args, context);
      },
    };
  }

  useEffect(() => registerCommand(stableCommandRef.current!), [registerCommand]);
}

export function IntentProvider({
  intents,
  onMatch,
  threshold,
  llmFallback,
  children,
}: PropsWithChildren<IntentProviderProps>) {
  const commands = useMemo(
    () =>
      intents.map((intent) => ({
        id: intent.id,
        title: intent.title,
        description: intent.description,
        phrases: intent.phrases,
        keywords: intent.keywords,
        async run(_args: Record<string, unknown>, context: VoiceCommandExecutionContext) {
          const match: IntentMatch = {
            intent,
            query: context.query,
            confidence: context.match.confidence,
            source: context.match.source,
          };
          await onMatch(match);
        },
      })),
    [intents, onMatch],
  );

  return (
    <VoiceProvider commands={commands} threshold={threshold} llmFallback={llmFallback}>
      <IntentContextBridge intents={intents}>{children}</IntentContextBridge>
    </VoiceProvider>
  );
}

function IntentContextBridge({
  intents,
  children,
}: PropsWithChildren<{
  intents: Intent[];
}>) {
  const voice = useVoiceController();

  const value: IntentContextValue = {
    intents,
    query: voice.query,
    isListening: voice.isListening,
    isSubmitting: voice.isSubmitting,
    lastMatch: voice.lastMatch ? toIntentMatch(intents, voice.lastMatch) : null,
    candidates: voice.candidates
      ? voice.candidates
          .map((match) => toIntentMatch(intents, match))
          .filter((match): match is IntentMatch => match !== null)
      : null,
    error: voice.error,
    setQuery: voice.setQuery,
    submitQuery: async (value) => {
      const match = await voice.submitQuery(value);
      return match ? toIntentMatch(intents, match) : null;
    },
    selectMatch: async (match) => {
      const voiceMatch = voice.candidates?.find((candidate) => candidate.command.id === match.intent.id);
      if (voiceMatch) {
        await voice.selectMatch(voiceMatch);
      }
    },
    clearCandidates: voice.clearCandidates,
    startListening: voice.startListening,
    stopListening: voice.stopListening,
  };

  return <LegacyIntentContext.Provider value={value}>{children}</LegacyIntentContext.Provider>;
}

const LegacyIntentContext = createContext<IntentContextValue | null>(null);

export function useIntentMatch() {
  const context = useContext(LegacyIntentContext);
  if (!context) {
    throw new Error("useIntentMatch must be used inside an IntentProvider.");
  }
  return context;
}
