import { AudioWave, useMediaAudio } from '@audiowave/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AICommand, useAICommand, type AICommandItem } from 'react-router-ai'
import { CloseIcon, SearchIcon, MicrophoneIcon } from '../shared/ui/Icons.tsx'
import './CommandDialog.css'

type CommandDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: AICommandItem[]
}

function VoiceAudioWave({ active }: { active: boolean }) {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [streamError, setStreamError] = useState<string | null>(null)
  const handleAudioError = useCallback((error: Error) => {
    setStreamError(error.message)
  }, [])
  const audioOptions = useMemo(
    () => ({ source: mediaStream, onError: handleAudioError }),
    [handleAudioError, mediaStream],
  )
  const { source, error } = useMediaAudio(audioOptions)
  const errorMessage = streamError ?? error?.message

  useEffect(() => {
    if (!active) {
      setMediaStream((current) => {
        current?.getTracks().forEach((track) => track.stop())
        return null
      })
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStreamError('Microphone visualization is not available in this browser.')
      return
    }

    let cancelled = false
    let stream: MediaStream | null = null
    setStreamError(null)

    void navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((nextStream) => {
        stream = nextStream
        if (cancelled) {
          nextStream.getTracks().forEach((track) => track.stop())
          return
        }
        setMediaStream(nextStream)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Microphone visualization failed.'
        setStreamError(message)
      })

    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
      setMediaStream(null)
    }
  }, [active])

  return (
    <div className="command-dialog-audio-wave" aria-label="Live microphone waveform">
      {source ? (
        <AudioWave
          source={source}
          className="command-dialog-audio-wave-renderer"
          canvasClassName="command-dialog-audio-wave-canvas"
          width="100%"
          height={46}
          barWidth={4}
          gap={4}
          rounded={8}
          barColor="#9bb8ff"
          secondaryBarColor="#d7e2ff"
          backgroundColor="transparent"
          amplitudeMode="adaptive"
          speed={2}
          isPaused={!active}
          showBorder={false}
          showPlaceholderBackground={false}
          fullscreen
        />
      ) : (
        <div className="command-dialog-audio-wave-placeholder" aria-hidden="true">
          {Array.from({ length: 64 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
      )}
      {errorMessage ? <span className="command-dialog-audio-wave-error">{errorMessage}</span> : null}
    </div>
  )
}

export default function CommandDialog({ open, onOpenChange, items }: CommandDialogProps) {
  const ctx = useAICommand()
  const { clearChatMessages, isListening, mode, onContactSupport, startListening, stopListening } = ctx
  const isVoiceMode = mode === 'voice'

  useEffect(() => {
    if (!open && isListening) {
      stopListening()
    }
  }, [isListening, open, stopListening])

  useEffect(() => {
    if (mode === 'voice') {
      clearChatMessages()
    }
  }, [clearChatMessages, mode])

  useEffect(() => {
    if (!open || !isVoiceMode) return

    function handleVoiceKeyDown(event: KeyboardEvent) {
      if (
        event.key !== ' ' ||
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      ) {
        return
      }
      event.preventDefault()
      if (isListening) {
        stopListening()
      } else {
        startListening()
      }
    }

    window.addEventListener('keydown', handleVoiceKeyDown)
    return () => window.removeEventListener('keydown', handleVoiceKeyDown)
  }, [isListening, isVoiceMode, open, startListening, stopListening])

  return (
    <AICommand.Dialog open={open} onOpenChange={onOpenChange}>
      <div className="command-dialog-overlay" onClick={() => onOpenChange(false)}>
        <div className="command-dialog" onClick={(event) => event.stopPropagation()}>
          {mode !== 'search' ? (
            <div className="command-dialog-registry" aria-hidden="true">
              <AICommand.List>
                {items.map((item) => (
                  <AICommand.Item
                    key={item.id}
                    {...item}
                    onSelect={async () => {
                      await item.onSelect()
                      onOpenChange(false)
                    }}
                  >
                    {item.value}
                  </AICommand.Item>
                ))}
              </AICommand.List>
            </div>
          ) : null}

          <div className="command-dialog-header">
            <AICommand.ModeHeader
              className="command-dialog-mode-header"
              searchLabel="Classic Search"
              aiLabel="Text Chat"
              voiceLabel="Voice Chat"
              switchLabel="Switch Mode"
              switchKeycap="Tab"
            />
            <button
              className="command-dialog-close"
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              title="Close (Esc)"
            >
              <CloseIcon className="command-dialog-close-icon" />
            </button>
          </div>

          {mode === 'search' ? (
            <div className="command-dialog-search">
              <div className="command-dialog-search-input-wrap">
                <SearchIcon className="command-dialog-search-icon" />
                <AICommand.Input
                  autoFocus
                  modeShortcut="tab"
                  micShortcut="ctrl+m"
                  placeholder="Search settings..."
                  className="command-dialog-input"
                />
              </div>

              <div className="command-dialog-body">
                <AICommand.Loading className="command-dialog-loader">
                  <span className="command-dialog-spinner" />
                  <span>Searching...</span>
                </AICommand.Loading>

                <AICommand.Error className="command-dialog-error" />

                <AICommand.Confirmation className="command-dialog-confirmation" />

                <AICommand.List className="command-dialog-list">
                  {items.map((item) => (
                    <AICommand.Item
                      key={item.id}
                      {...item}
                      onSelect={async () => {
                        await item.onSelect()
                        onOpenChange(false)
                      }}
                      className="command-dialog-item"
                    >
                      <span className="command-dialog-item-value">{item.value}</span>
                      {item.description ? (
                        <span className="command-dialog-item-description">{item.description}</span>
                      ) : null}
                    </AICommand.Item>
                  ))}
                </AICommand.List>

                <AICommand.Empty className="command-dialog-empty">
                  No matching command.
                </AICommand.Empty>
              </div>

              <div className="command-dialog-footer">
                <div className="command-dialog-shortcuts" aria-hidden="true">
                  <span className="command-dialog-shortcut"><span className="command-dialog-keycap">Enter</span> Run</span>
                  <span className="command-dialog-shortcut"><span className="command-dialog-keycap">↑↓</span> Move</span>
                  <span className="command-dialog-shortcut"><span className="command-dialog-keycap">Esc</span> Close</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="command-dialog-chat-panel">
              <AICommand.Chat
                className={`command-dialog-chat ${isVoiceMode && ctx.chatMessages.length === 0 ? 'command-dialog-chat-voice-empty' : ''}`}
              >
                <AICommand.ChatEmptyPrompt className="command-dialog-voice-prompt">
                  <h2>What are you looking for?</h2>
                </AICommand.ChatEmptyPrompt>
                {ctx.chatMessages.map((message) => (
                  <AICommand.ChatMessage
                    key={message.id}
                    message={message}
                    userLabel="Your Request"
                    className="command-dialog-chat-message"
                  />
                ))}
                <AICommand.Loading className={isVoiceMode ? 'command-dialog-voice-thinking' : 'command-dialog-loader'}>
                  {isVoiceMode ? (
                    <span className="command-dialog-thinking">
                      Thinking
                      <span className="command-dialog-thinking-dots" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                    </span>
                  ) : (
                    <>
                      <span className="command-dialog-spinner" />
                      <span>Thinking...</span>
                    </>
                  )}
                </AICommand.Loading>
                <AICommand.Error className="command-dialog-error" />
                <AICommand.Confirmation className="command-dialog-confirmation" />
                <AICommand.Clarification
                  className="command-dialog-clarification"
                  message="Did you mean?"
                  itemClassName="command-dialog-clarification-item"
                />
                <AICommand.NoMatch
                  className="command-dialog-no-match"
                  onContactSupport={onContactSupport}
                />
              </AICommand.Chat>

              {mode === 'ai' ? (
                <div className="command-dialog-chat-input-wrap">
                  <AICommand.ChatInput
                    autoFocus
                    modeShortcut="tab"
                    micShortcut="ctrl+m"
                    placeholder="Ask AI to do something..."
                    className="command-dialog-chat-input"
                  />
                  <AICommand.VoiceButton
                    className="command-dialog-chat-mic"
                    title="Mic (Ctrl+M)"
                  >
                    <MicrophoneIcon className="command-dialog-mic-icon" />
                  </AICommand.VoiceButton>
                </div>
              ) : (
                <div className="command-dialog-voice-controls">
                  {isListening ? <VoiceAudioWave active={isListening} /> : null}
                  <AICommand.VoiceButton
                    className="command-dialog-voice-mic"
                    title={isListening ? 'Stop listening' : 'Start listening'}
                  >
                    <MicrophoneIcon className="command-dialog-mic-icon" />
                  </AICommand.VoiceButton>
                </div>
              )}

              <div className="command-dialog-footer">
                <div className="command-dialog-shortcuts" aria-hidden="true">
                  {isVoiceMode ? (
                    <span className="command-dialog-shortcut">
                      <span className="command-dialog-keycap">Space</span> {isListening ? 'Stop Recording' : 'Record'}
                    </span>
                  ) : (
                    <span className="command-dialog-shortcut"><span className="command-dialog-keycap">Enter</span> Send Message</span>
                  )}
                  <span className="command-dialog-shortcut"><span className="command-dialog-keycap">↑↓</span> Move</span>
                  <span className="command-dialog-shortcut"><span className="command-dialog-keycap">Esc</span> Close</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AICommand.Dialog>
  )
}
