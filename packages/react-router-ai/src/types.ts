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
  source: "fuzzy";
};

export type IntentProviderProps = {
  intents: NavigationIntent[];
  onNavigate: (match: IntentMatch) => void | Promise<void>;
  threshold?: number;
  children: ReactNode;
};

export type IntentContextValue = {
  intents: NavigationIntent[];
  query: string;
  isListening: boolean;
  lastMatch: IntentMatch | null;
  error: string | null;
  setQuery: (value: string) => void;
  submitQuery: (value?: string) => Promise<IntentMatch | null>;
  startListening: () => void;
  stopListening: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
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
