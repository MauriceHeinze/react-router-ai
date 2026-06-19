import { useVoiceController } from "./intent-context";

type VoiceButtonProps = {
  idleLabel?: string;
  listeningLabel?: string;
};

export function VoiceButton({
  idleLabel = "Use voice",
  listeningLabel = "Listening...",
}: VoiceButtonProps) {
  const { isListening, startListening, stopListening } = useVoiceController();

  return (
    <button type="button" onClick={isListening ? stopListening : startListening}>
      {isListening ? listeningLabel : idleLabel}
    </button>
  );
}

export const IntentVoiceButton = VoiceButton;
