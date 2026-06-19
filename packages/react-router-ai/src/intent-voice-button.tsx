import { useIntentMatch } from "./intent-context";

type IntentVoiceButtonProps = {
  idleLabel?: string;
  listeningLabel?: string;
};

export function IntentVoiceButton({
  idleLabel = "Use voice",
  listeningLabel = "Listening...",
}: IntentVoiceButtonProps) {
  const { isListening, startListening, stopListening } = useIntentMatch();

  return (
    <button type="button" onClick={isListening ? stopListening : startListening}>
      {isListening ? listeningLabel : idleLabel}
    </button>
  );
}
