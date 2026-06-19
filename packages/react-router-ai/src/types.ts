import type { ReactNode } from "react";

export type NavigationIntent = {
  id: string;
  type: "navigation";
  title: string;
  description?: string;
  phrases?: string[];
  keywords?: string[];
  to: string;
};

export type IntentMatch = {
  intent: NavigationIntent;
  query: string;
  confidence: number;
  source: "fuzzy" | "llm";
};

export type BuiltInLlmFallbackOptions = {
  enabled?: boolean;
  promptPrefix?: string;
};

export type IntentProviderProps = {
  intents: NavigationIntent[];
  onNavigate: (match: IntentMatch) => void | Promise<void>;
  threshold?: number;
  llmFallback?: BuiltInLlmFallbackOptions;
  children: ReactNode;
};

export type IntentContextValue = {
  intents: NavigationIntent[];
  query: string;
  isListening: boolean;
  isSubmitting: boolean;
  lastMatch: IntentMatch | null;
  candidates: IntentMatch[] | null;
  error: string | null;
  setQuery: (value: string) => void;
  submitQuery: (value?: string) => Promise<IntentMatch | null>;
  selectMatch: (match: IntentMatch) => void;
  clearCandidates: () => void;
  startListening: () => void;
  stopListening: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    LanguageModel?: LanguageModelConstructor;
  }
}

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

export interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

export type LanguageModelAvailability =
  | "available"
  | "downloadable"
  | "downloading"
  | "unavailable";

export interface LanguageModelCreateMonitor {
  addEventListener(
    type: "downloadprogress",
    listener: (event: { loaded: number }) => void,
  ): void;
}

export interface LanguageModelSession {
  prompt: (input: string) => Promise<string>;
  destroy?: () => void;
}

export interface LanguageModelConstructor {
  availability: () => Promise<LanguageModelAvailability>;
  create: (options?: {
    monitor?: (monitor: LanguageModelCreateMonitor) => void;
  }) => Promise<LanguageModelSession>;
}
