import type { Dispatch, ReactNode, RefObject, SetStateAction } from "react";

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

export type AICommandDialogProps = {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export type AICommandInputProps = {
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  modeShortcut?: "tab";
  micShortcut?: "ctrl+m";
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export type AICommandListProps = {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export type AICommandItemProps = AICommandItem & {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export type AICommandEmptyProps = {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export type AICommandLoadingProps = {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export type AICommandErrorProps = {
  children?: (error: string) => ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export type AICommandConfirmationProps = {
  className?: string;
  style?: React.CSSProperties;
};

export type AICommandVoiceButtonProps = {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
};

export type AICommandModeHeaderProps = {
  searchLabel?: string;
  aiLabel?: string;
  voiceLabel?: string;
  switchLabel?: string;
  switchKeycap?: string;
  className?: string;
  style?: React.CSSProperties;
};

export type AICommandChatProps = {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export type AICommandChatMessageProps = {
  message: AICommandChatMessageData;
  onSelectCandidate?: (item: AICommandItem) => void;
  userLabel?: string;
  className?: string;
  style?: React.CSSProperties;
};

export type AICommandVoiceWaveformProps = {
  barCount?: number;
  className?: string;
  style?: React.CSSProperties;
};

export type AICommandChatInputProps = {
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  modeShortcut?: "tab";
  micShortcut?: "ctrl+m";
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  autoFocus?: boolean;
  rows?: number;
  className?: string;
  style?: React.CSSProperties;
};

export type AICommandClarificationProps = {
  message?: string;
  onSelect?: (item: AICommandItem) => void;
  className?: string;
  style?: React.CSSProperties;
  itemClassName?: string;
  itemStyle?: React.CSSProperties;
};

export type AICommandNoMatchProps = {
  message?: string;
  rephraseLabel?: string;
  contactSupportLabel?: string;
  onContactSupport?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

export type AICommandChatEmptyPromptProps = {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export type AICommandVoiceEmptyPromptProps = {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

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
  volume: number;
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
