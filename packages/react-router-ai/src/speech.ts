import type { SpeechRecognitionInstance } from "./types";

export type SpeechRecognizer = {
  start: () => void;
  stop: () => void;
  cleanup: () => void;
};

export type CreateSpeechRecognizerOptions = {
  onResult: (transcript: string) => void;
  onError: (message: string) => void;
  onEnd?: () => void;
  lang?: string;
};

function getRecognitionConstructor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function createSpeechRecognizer(
  options: CreateSpeechRecognizerOptions,
): SpeechRecognizer | null {
  const Recognition = getRecognitionConstructor();
  if (!Recognition) return null;

  const recognition: SpeechRecognitionInstance = new Recognition();
  recognition.lang = options.lang ?? "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
    if (transcript) {
      options.onResult(transcript);
    }
  };

  recognition.onerror = () => {
    options.onError("Voice input failed. Keep typing instead.");
  };

  recognition.onend = () => {
    options.onEnd?.();
  };

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    cleanup: () => recognition.stop(),
  };
}
