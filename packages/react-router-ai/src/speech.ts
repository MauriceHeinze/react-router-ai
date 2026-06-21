import type { SpeechRecognitionInstance } from "./types";

export type SpeechRecognizer = {
  start: () => void;
  stop: () => void;
  cleanup: () => void;
};

export type CreateSpeechRecognizerOptions = {
  onResult: (transcript: string) => void;
  onInterimResult?: (transcript: string) => void;
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
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    let finalTranscript = "";
    let interimTranscript = "";

    for (let index = 0; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcript = result?.[0]?.transcript?.trim() ?? "";
      if (!transcript) continue;
      if (result.isFinal) {
        finalTranscript = finalTranscript ? `${finalTranscript} ${transcript}` : transcript;
      } else {
        interimTranscript = interimTranscript ? `${interimTranscript} ${transcript}` : transcript;
      }
    }

    const visibleTranscript = [finalTranscript, interimTranscript].filter(Boolean).join(" ").trim();
    if (visibleTranscript) {
      options.onInterimResult?.(visibleTranscript);
    }
    if (finalTranscript) {
      options.onResult(finalTranscript);
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
