import type { ReactNode } from "react";

export type VoiceCommandParameterType = "string" | "number" | "boolean";

export type VoiceCommandParameterDefinition = {
  label: string;
  description?: string;
  options?: readonly string[];
  type?: VoiceCommandParameterType;
};

export type VoiceCommandParameters = Record<string, VoiceCommandParameterDefinition>;

export type VoiceCommandExecutionContext<TArgs extends Record<string, unknown> = Record<string, unknown>> = {
  command: VoiceCommand<TArgs>;
  match: VoiceCommandMatch<TArgs>;
  query: string;
  readCurrentValue: () => unknown;
};

export type VoiceCommand<TArgs extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  title: string;
  description?: string;
  phrases?: string[];
  keywords?: string[];
  parameters?: VoiceCommandParameters;
  confirmation?: boolean | string;
  read?: () => unknown;
  run: (args: TArgs, context: VoiceCommandExecutionContext<TArgs>) => void | Promise<void>;
};

export type VoiceCommandMatch<TArgs extends Record<string, unknown> = Record<string, unknown>> = {
  command: VoiceCommand<TArgs>;
  query: string;
  confidence: number;
  source: "fuzzy" | "llm";
  parameters: TArgs;
  missingParameters: string[];
};

export type VoiceFieldType = "boolean" | "enum" | "string" | "number";

export type VoiceField<TValue = unknown> = {
  id: string;
  label: string;
  description?: string;
  type: VoiceFieldType;
  options?: readonly string[];
  phrases?: string[];
  keywords?: string[];
  route?: string;
  read?: () => TValue;
  write: (value: TValue) => void | Promise<void>;
  confirmation?: boolean | string;
};

export type VoiceFieldCommandOptions = {
  navigate?: (to: string) => void;
};

export type VoiceCommandLlmCandidate = {
  commandId: string | null;
  confidence?: number;
  parameters?: Record<string, unknown>;
};

export type BuiltInLlmFallbackOptions = {
  enabled?: boolean;
  promptPrefix?: string;
  match?: (
    query: string,
    commands: VoiceCommand[],
  ) => Promise<VoiceCommandLlmCandidate | VoiceCommandLlmCandidate[] | null>;
};

export type VoiceProviderProps = {
  commands: VoiceCommand[];
  threshold?: number;
  ambiguityThreshold?: number;
  fuzzyMatching?: boolean;
  llmFallback?: BuiltInLlmFallbackOptions;
  children: ReactNode;
};

export type VoiceContextValue = {
  commands: VoiceCommand[];
  query: string;
  isListening: boolean;
  isSubmitting: boolean;
  lastMatch: VoiceCommandMatch | null;
  candidates: VoiceCommandMatch[] | null;
  pendingConfirmation: VoiceCommandMatch | null;
  error: string | null;
  setQuery: (value: string) => void;
  submitQuery: (value?: string) => Promise<VoiceCommandMatch | null>;
  selectMatch: (match: VoiceCommandMatch) => Promise<void>;
  clearCandidates: () => void;
  confirmPending: () => Promise<void>;
  cancelPending: () => void;
  startListening: () => void;
  stopListening: () => void;
  registerCommand: (command: VoiceCommand) => () => void;
};

export type BaseIntent = {
  id: string;
  title: string;
  description?: string;
  phrases?: string[];
  keywords?: string[];
};

export type NavigationIntent = BaseIntent & {
  type: "navigation";
  to: string;
};

export type ActionIntent = BaseIntent & {
  type: "action";
  action: string;
  payload?: Record<string, unknown>;
};

export type Intent = NavigationIntent | ActionIntent;

export type IntentMatch = {
  intent: Intent;
  query: string;
  confidence: number;
  source: "fuzzy" | "llm";
};

export type IntentProviderProps = {
  intents: Intent[];
  onMatch: (match: IntentMatch) => void | Promise<void>;
  threshold?: number;
  ambiguityThreshold?: number;
  fuzzyMatching?: boolean;
  llmFallback?: BuiltInLlmFallbackOptions;
  children: ReactNode;
};

export type IntentContextValue = {
  intents: Intent[];
  query: string;
  isListening: boolean;
  isSubmitting: boolean;
  lastMatch: IntentMatch | null;
  candidates: IntentMatch[] | null;
  error: string | null;
  setQuery: (value: string) => void;
  submitQuery: (value?: string) => Promise<IntentMatch | null>;
  selectMatch: (match: IntentMatch) => Promise<void>;
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
