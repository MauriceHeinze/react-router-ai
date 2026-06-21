import { useEffect } from 'react'
import { AICommand, useAICommand, type AICommandItem } from 'react-router-ai'
import { CloseIcon, SearchIcon, MicrophoneIcon } from '../shared/ui/Icons.tsx'
import './CommandDialog.css'

type CommandDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: AICommandItem[]
}

export default function CommandDialog({ open, onOpenChange, items }: CommandDialogProps) {
  const ctx = useAICommand()
  const { isListening, liveTranscript, mode, onContactSupport } = ctx
  const voiceStatus = ctx.isSubmitting
    ? 'Sending your request to OpenAI...'
    : isListening
      ? liveTranscript || 'Listening... start speaking'
      : liveTranscript || 'Waiting for your next request'

  useEffect(() => {
    if (!open && isListening) {
      ctx.stopListening()
    }
  }, [ctx, isListening, open])

  useEffect(() => {
    if (mode === 'voice') {
      ctx.clearChatMessages()
    }
  }, [ctx, mode])

  return (
    <AICommand.Dialog open={open} onOpenChange={onOpenChange}>
      <div className="command-dialog-overlay" onClick={() => onOpenChange(false)}>
        <div className="command-dialog" onClick={(event) => event.stopPropagation()}>
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
                className={`command-dialog-chat ${mode === 'voice' && ctx.chatMessages.length === 0 ? 'command-dialog-chat-voice-empty' : ''}`}
              >
                <AICommand.VoiceEmptyPrompt className="command-dialog-voice-prompt">
                  <h2>What are you looking for?</h2>
                </AICommand.VoiceEmptyPrompt>
                {ctx.chatMessages.map((message) => (
                  <AICommand.ChatMessage
                    key={message.id}
                    message={message}
                    userLabel="Your Request"
                    className="command-dialog-chat-message"
                  />
                ))}
                <AICommand.Loading className="command-dialog-loader">
                  {mode === 'voice' ? (
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
                <div className="command-dialog-voice-wrap">
                  <div className="command-dialog-voice-display">
                    <div className="command-dialog-voice-copy">
                      <span className="command-dialog-voice-label">
                        {ctx.isSubmitting
                          ? 'Processing'
                          : isListening
                            ? liveTranscript
                              ? 'Captured so far'
                              : 'Listening for speech'
                            : 'Ready'}
                      </span>
                      <p className="command-dialog-voice-transcript">{voiceStatus}</p>
                    </div>
                    <AICommand.VoiceWaveform
                      barCount={50}
                      className="command-dialog-waveform"
                    />
                  </div>
                  <AICommand.VoiceButton
                    className="command-dialog-chat-mic"
                    title={isListening ? 'Stop listening' : 'Start listening'}
                  >
                    <MicrophoneIcon className="command-dialog-mic-icon" />
                  </AICommand.VoiceButton>
                </div>
              )}

              <div className="command-dialog-footer">
                <div className="command-dialog-shortcuts" aria-hidden="true">
                  <span className="command-dialog-shortcut"><span className="command-dialog-keycap">Enter</span> Send Message</span>
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
