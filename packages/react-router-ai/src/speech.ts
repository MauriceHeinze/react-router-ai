import type { SpeechRecognitionErrorEvent, SpeechRecognitionInstance } from "./types";

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

function getSpeechRecognitionErrorMessage(event: SpeechRecognitionErrorEvent) {
  switch (event.error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was blocked. Check browser permissions and try again.";
    case "audio-capture":
      return "No microphone was found. Check your audio input and try again.";
    // case "no-speech":
    //   return "No speech was detected. Try speaking again.";
    case "network":
      return "Voice input failed because the speech service was unreachable.";
    case "language-not-supported":
      return "Voice input is not available for the current language.";
    case "aborted":
      return "Voice input was interrupted. Try again.";
    default:
      return "Voice input failed. Check microphone permissions and browser support.";
  }
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

  recognition.onerror = (event) => {
    options.onError(getSpeechRecognitionErrorMessage(event));
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
