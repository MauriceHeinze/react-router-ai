import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { matchIntent } from "./matcher";
import type {
  IntentContextValue,
  IntentMatch,
  IntentProviderProps,
  SpeechRecognitionInstance,
} from "./types";

const IntentContext = createContext<IntentContextValue | null>(null);

function getRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function IntentProvider({
  intents,
  onNavigate,
  threshold = 0.45,
  children,
}: PropsWithChildren<IntentProviderProps>) {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [lastMatch, setLastMatch] = useState<IntentMatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

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
  }, [intents, threshold]);

  async function submitQueryInternal(nextQuery?: string) {
    const trimmed = (nextQuery ?? query).trim();
    if (!trimmed) {
      setLastMatch(null);
      return null;
    }

    const match = matchIntent(trimmed, intents, threshold);
    setLastMatch(match);

    if (!match) {
      setError(`No navigation match found for "${trimmed}".`);
      return null;
    }

    setError(null);
    await onNavigate(match);
    return match;
  }

  const value: IntentContextValue = {
    intents,
    query,
    isListening,
    lastMatch,
    error,
    setQuery(value) {
      setError(null);
      setQuery(value);
    },
    submitQuery: submitQueryInternal,
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
  };

  return <IntentContext.Provider value={value}>{children}</IntentContext.Provider>;
}

export function useIntentMatch() {
  const context = useContext(IntentContext);
  if (!context) {
    throw new Error("useIntentMatch must be used inside an IntentProvider.");
  }
  return context;
}
