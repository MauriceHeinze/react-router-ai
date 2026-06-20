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

export type AICommandMatcher = (
  query: string,
  candidates: readonly AICommandItem[],
) => Promise<AICommandItem | null | undefined>;

export type AICommandRootProps = {
  children: ReactNode;
  matcher?: AICommandMatcher;
  threshold?: number;
  maxMatcherCandidates?: number;
  maxVisibleItems?: number;
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
  voiceShortcut?: "tab";
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
