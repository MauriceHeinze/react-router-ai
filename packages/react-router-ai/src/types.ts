import type { Dispatch, ReactNode, RefObject, SetStateAction } from "react";

export type WithAICommandAttributes<T> = T & {
  [key: string]: unknown;
};

export type AICommandInputProps = WithAICommandAttributes<
  React.InputHTMLAttributes<HTMLInputElement> & {
    onValueChange?: (value: string) => void;
    modeShortcut?: "tab";
    micShortcut?: "ctrl+m";
  }
>;

export type AICommandListProps = WithAICommandAttributes<
  React.HTMLAttributes<HTMLDivElement> & {
    children?: ReactNode;
  }
>;

export type AICommandItemProps = WithAICommandAttributes<
  AICommandItem &
    React.HTMLAttributes<HTMLDivElement> & {
      children: ReactNode;
    }
>;

export type AICommandEmptyProps = WithAICommandAttributes<
  React.HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
  }
>;

export type AICommandLoadingProps = WithAICommandAttributes<
  React.HTMLAttributes<HTMLDivElement> & {
    children?: ReactNode;
  }
>;

export type AICommandErrorProps = WithAICommandAttributes<
  Omit<React.HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: (error: string) => ReactNode;
  }
>;

export type AICommandConfirmationProps = WithAICommandAttributes<React.HTMLAttributes<HTMLDivElement>>;

export type AICommandVoiceButtonProps = WithAICommandAttributes<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  }
>;

export type AICommandModeHeaderProps = WithAICommandAttributes<
  React.HTMLAttributes<HTMLDivElement> & {
    searchLabel?: string;
    aiLabel?: string;
    voiceLabel?: string;
    switchLabel?: string;
    switchKeycap?: string;
  }
>;

export type AICommandChatProps = WithAICommandAttributes<
  React.HTMLAttributes<HTMLDivElement> & {
    children?: ReactNode;
  }
>;

export type AICommandChatMessageProps = WithAICommandAttributes<
  React.HTMLAttributes<HTMLDivElement> & {
    message: AICommandChatMessageData;
    onSelectCandidate?: (item: AICommandItem) => void;
    userLabel?: string;
  }
>;

export type AICommandVoiceWaveformProps = WithAICommandAttributes<
  React.HTMLAttributes<HTMLDivElement> & {
    barCount?: number;
  }
>;

export type AICommandChatInputProps = WithAICommandAttributes<
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    onValueChange?: (value: string) => void;
    modeShortcut?: "tab";
    micShortcut?: "ctrl+m";
  }
>;

export type AICommandClarificationProps = WithAICommandAttributes<
  React.HTMLAttributes<HTMLDivElement> & {
    message?: string;
    onSelect?: (item: AICommandItem) => void;
    itemClassName?: string;
    itemStyle?: React.CSSProperties;
  }
>;

export type AICommandNoMatchProps = WithAICommandAttributes<
  React.HTMLAttributes<HTMLDivElement> & {
    message?: string;
    rephraseLabel?: string;
    contactSupportLabel?: string;
    onContactSupport?: () => void;
  }
>;

export type AICommandChatEmptyPromptProps = WithAICommandAttributes<
  React.HTMLAttributes<HTMLDivElement> & {
    children?: ReactNode;
  }
>;

export type AICommandVoiceEmptyPromptProps = WithAICommandAttributes<
  React.HTMLAttributes<HTMLDivElement> & {
    children?: ReactNode;
  }
>;

export type AICommandItem = {
  id: string;
  value: string;
  keywords?: readonly string[];
  description?: string;
  disabled?: boolean;
  confirmation?: boolean | string;
  onSelect: () => void | Promise<void>;
};

export type AICommandMatch = {
  item: AICommandItem;
  query: string;
  confidence: number;
  source: "local" | "matcher";
};

export type AICommandMatcherResult =
  | {
      kind: "execute";
      item: AICommandItem;
      needsApproval?: boolean;
      message?: string;
    }
  | {
      kind: "clarify";
      candidates: AICommandItem[];
      message?: string;
    }
  | {
      kind: "no-match";
      message?: string;
    }
  | null;

export type AICommandMatcher = (
  query: string,
  candidates: readonly AICommandItem[],
) => Promise<AICommandMatcherResult>;

export type AICommandMode = "search" | "ai" | "voice";

export type AICommandChatRole = "user" | "assistant";

export type AICommandChatMessageData = {
  id: string;
  role: AICommandChatRole;
  content: string;
  candidates?: AICommandItem[];
  pendingItemId?: string;
};

export type AICommandRootProps = {
  children: ReactNode;
  matcher?: AICommandMatcher;
  threshold?: number;
  maxMatcherCandidates?: number;
  maxVisibleItems?: number;
  onContactSupport?: () => void;
  initialMode?: AICommandMode;
};

export type AICommandDialogProps = WithAICommandAttributes<{
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>;

export type AICommandRegistryEntry = {
  id: string;
  getItem: () => AICommandItem;
};

export type AICommandRegistry = {
  register: (entry: AICommandRegistryEntry) => () => void;
  getItems: () => AICommandItem[];
  subscribe: (listener: () => void) => () => void;
};

export type AICommandDialogController = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export type AICommandContextValue = {
  query: string;
  setQuery: (query: string) => void;
  items: AICommandItem[];
  filteredItems: AICommandItem[];
  hasMatcher: boolean;
  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;
  isListening: boolean;
  mediaRecorder: MediaRecorder | null;
  isSubmitting: boolean;
  error: string | null;
  pendingConfirmation: AICommandMatch | null;
  dialogRef: RefObject<AICommandDialogController | null>;
  openDialog: () => void;
  closeDialog: () => void;
  startListening: () => void;
  stopListening: () => void;
  submitQuery: (query?: string) => Promise<AICommandItem | null>;
  submitMatcherQuery: (query?: string) => Promise<AICommandItem | null>;
  selectItem: (item: AICommandItem) => Promise<void>;
  confirmPending: () => Promise<void>;
  cancelPending: () => void;
  registerItem: (entry: AICommandRegistryEntry) => () => void;
  mode: AICommandMode;
  setMode: (mode: AICommandMode) => void;
  switchMode: (mode: AICommandMode) => void;
  liveTranscript: string;
  chatMessages: AICommandChatMessageData[];
  chatInput: string;
  setChatInput: (value: string) => void;
  submitChat: (message?: string) => Promise<void>;
  candidates: AICommandItem[] | null;
  selectCandidate: (item: AICommandItem) => Promise<void>;
  clearCandidates: () => void;
  clearChatMessages: () => void;
  onContactSupport?: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface SpeechRecognitionEvent extends Event {
  resultIndex?: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error?:
    | "aborted"
    | "audio-capture"
    | "bad-grammar"
    | "language-not-supported"
    | "network"
    | "no-speech"
    | "not-allowed"
    | "phrases-not-supported"
    | "service-not-allowed"
    | string;
  message?: string;
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
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}
