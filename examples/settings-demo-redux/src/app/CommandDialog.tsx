import { useEffect } from 'react'
import { AICommand, useAICommand, type AICommandItem } from 'react-router-ai'
import { CloseIcon, SearchIcon, MicrophoneIcon, MicOrbIcon } from '../shared/ui/Icons.tsx'
import './CommandDialog.css'

type CommandDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: AICommandItem[]
}

export default function CommandDialog({ open, onOpenChange, items }: CommandDialogProps) {
  const { error, isListening, isSubmitting, stopListening } = useAICommand()

  useEffect(() => {
    if (!open && isListening) {
      stopListening()
    }
  }, [isListening, open, stopListening])

  return (
    <AICommand.Dialog open={open} onOpenChange={onOpenChange}>
      <div className="command-dialog-overlay" onClick={() => onOpenChange(false)}>
        <div
          className="command-dialog"
          data-mic-mode={isListening ? 'true' : 'false'}
          onClick={(event) => event.stopPropagation()}
        >
          {isListening ? (
            <div className="command-dialog-mic-shell">
              <div className="command-dialog-mic-topbar">
                <span className="command-dialog-mic-handle" aria-hidden="true" />
                <div className="command-dialog-mic-topbar-actions">
                  <button className="command-dialog-more" type="button" aria-label="More options">
                    <span />
                    <span />
                    <span />
                  </button>
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
              </div>

              <div className="command-dialog-mic-body">
                <div className="command-dialog-mic-copy">
                  <h2 className="command-dialog-mic-title">Listening...</h2>
                  <p className="command-dialog-mic-subtitle">Speak now</p>
                </div>

                <div className="command-dialog-mic-stage" aria-hidden="true">
                  <div className="command-dialog-mic-glow" />
                  <div className="command-dialog-waveform command-dialog-waveform-left">
                    <span className="command-dialog-wave-bar command-dialog-wave-bar-1" />
                    <span className="command-dialog-wave-bar command-dialog-wave-bar-2" />
                    <span className="command-dialog-wave-bar command-dialog-wave-bar-3" />
                    <span className="command-dialog-wave-bar command-dialog-wave-bar-4" />
                    <span className="command-dialog-wave-bar command-dialog-wave-bar-5" />
                  </div>
                  <div className="command-dialog-mic-orb">
                    <MicOrbIcon className="command-dialog-mic-orb-icon" />
                  </div>
                  <div className="command-dialog-waveform command-dialog-waveform-right">
                    <span className="command-dialog-wave-bar command-dialog-wave-bar-5" />
                    <span className="command-dialog-wave-bar command-dialog-wave-bar-4" />
                    <span className="command-dialog-wave-bar command-dialog-wave-bar-3" />
                    <span className="command-dialog-wave-bar command-dialog-wave-bar-2" />
                    <span className="command-dialog-wave-bar command-dialog-wave-bar-1" />
                  </div>
                </div>

                <button className="command-dialog-mic-cancel" type="button" onClick={stopListening}>
                  Cancel
                  <CloseIcon className="command-dialog-mic-cancel-icon" />
                </button>

                <div className="command-dialog-mic-shortcuts" aria-hidden="true">
                  <span className="command-dialog-mic-shortcut">
                    <span className="command-dialog-mic-keycap">Esc</span>
                    <span>Stop or cancel</span>
                  </span>
                  <span className="command-dialog-mic-shortcut">
                    <span className="command-dialog-mic-keycap">Click mic</span>
                    <span>Start over</span>
                  </span>
                </div>

                <p className="command-dialog-mic-disclaimer">
                  Voice AI can make mistakes. Please double-check important info.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="command-dialog-header">
                <SearchIcon className="command-dialog-search-icon" />
                <AICommand.Input
                  autoFocus
                  voiceShortcut="tab"
                  placeholder="Search settings or ask to do something..."
                  className="command-dialog-input"
                />
                <AICommand.VoiceButton className="command-dialog-voice-button" title="Mic mode (Tab)">
                  <MicrophoneIcon className="command-dialog-voice-icon" />
                </AICommand.VoiceButton>
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

              <div className="command-dialog-body">
                <AICommand.Loading className="command-dialog-loader">
                  <span className="command-dialog-spinner" />
                  <span>Matching your request...</span>
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

                <span className="command-dialog-hint">
                  {isSubmitting
                    ? 'Working...'
                    : error
                      ? 'Try another phrase, or press Tab to use the mic.'
                      : 'Press Tab for mic mode, then Enter to run the top match.'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </AICommand.Dialog>
  )
}
