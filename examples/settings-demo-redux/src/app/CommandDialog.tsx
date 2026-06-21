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
  const { isListening, mode, onContactSupport } = ctx

  useEffect(() => {
    if (!open && isListening) {
      ctx.stopListening()
    }
  }, [ctx, isListening, open])

  return (
    <AICommand.Dialog open={open} onOpenChange={onOpenChange}>
      <div className="command-dialog-overlay" onClick={() => onOpenChange(false)}>
        <div
          className="command-dialog"
          data-mode={mode}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="command-dialog-header">
            <AICommand.ModeToggle
              className="command-dialog-mode-toggle"
              searchLabel="Search"
              aiLabel="AI"
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
              <div className="command-dialog-search-row">
                <SearchIcon className="command-dialog-search-icon" />
                <AICommand.Input
                  autoFocus
                  voiceShortcut="tab"
                  placeholder="Search settings..."
                  className="command-dialog-input"
                />
                <AICommand.VoiceButton className="command-dialog-voice-button" title="Mic (Tab)">
                  <MicrophoneIcon className="command-dialog-voice-icon" />
                </AICommand.VoiceButton>
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

                <div className="command-dialog-actions">
                  <div className="command-dialog-shortcuts" aria-hidden="true">
                    <span className="command-dialog-shortcut"><span className="command-dialog-keycap">Tab</span> Mic</span>
                    <span className="command-dialog-shortcut"><span className="command-dialog-keycap">Enter</span> Run</span>
                    <span className="command-dialog-shortcut"><span className="command-dialog-keycap">↑↓</span> Move</span>
                    <span className="command-dialog-shortcut"><span className="command-dialog-keycap">Esc</span> Close</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="command-dialog-ai">
              <AICommand.Chat className="command-dialog-chat">
                {ctx.chatMessages.map((message) => (
                  <AICommand.ChatMessage
                    key={message.id}
                    message={message}
                    className="command-dialog-chat-message"
                  />
                ))}
                <AICommand.Loading className="command-dialog-loader">
                  <span className="command-dialog-spinner" />
                  <span>Thinking...</span>
                </AICommand.Loading>
                <AICommand.Error className="command-dialog-error" />
                <AICommand.Confirmation className="command-dialog-confirmation" />
                <AICommand.Clarification
                  className="command-dialog-clarification"
                  itemClassName="command-dialog-clarification-item"
                />
                <AICommand.NoMatch
                  className="command-dialog-no-match"
                  onContactSupport={onContactSupport}
                />
              </AICommand.Chat>

              <div className="command-dialog-chat-input-row">
                <AICommand.VoiceButton className="command-dialog-voice-button" title="Mic (Tab)">
                  <MicrophoneIcon className="command-dialog-voice-icon" />
                </AICommand.VoiceButton>
                <AICommand.ChatInput
                  autoFocus
                  voiceShortcut="tab"
                  placeholder="Ask AI to do something..."
                  className="command-dialog-chat-input"
                />
              </div>

              <div className="command-dialog-actions">
                <div className="command-dialog-shortcuts" aria-hidden="true">
                  <span className="command-dialog-shortcut"><span className="command-dialog-keycap">Tab</span> Mic</span>
                  <span className="command-dialog-shortcut"><span className="command-dialog-keycap">Enter</span> Send</span>
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
