import { useEffect, useRef } from 'react'
import { IntentVoiceButton, useIntentMatch } from 'react-router-ai'
import type { IntentMatch } from 'react-router-ai'
import { CloseIcon, SearchIcon } from './Icons.tsx'
import './CommandDialog.css'

type CommandDialogProps = {
  open: boolean
  onOpen: () => void
  onClose: () => void
}

export default function CommandDialog({ open, onOpen, onClose }: CommandDialogProps) {
  const { query, setQuery, submitQuery, selectMatch, clearCandidates, isSubmitting, error, lastMatch, candidates } = useIntentMatch()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      clearCandidates()
    }
  }, [open, clearCandidates])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (open) {
          onClose()
        } else {
          onOpen()
        }
      }
      if (event.key === 'Escape' && open) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, onOpen])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const match = await submitQuery()
    if (match) {
      onClose()
    }
  }

  function handleCandidateClick(match: IntentMatch) {
    selectMatch(match)
    onClose()
  }

  if (!open) return null

  return (
    <div className="command-dialog-overlay" onClick={onClose}>
      <div className="command-dialog" onClick={(e) => e.stopPropagation()}>
        {candidates && candidates.length > 1 ? (
          <div className="command-dialog-clarify">
            Did you mean one of these?
          </div>
        ) : null}

        <div className="command-dialog-header">
          <SearchIcon className="command-dialog-search-icon" />
          <form className="command-dialog-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search settings or ask to navigate..."
              className="command-dialog-input"
              disabled={isSubmitting}
            />
          </form>
          <button className="command-dialog-close" type="button" onClick={onClose} aria-label="Close">
            <CloseIcon className="command-dialog-close-icon" />
          </button>
        </div>

        <div className="command-dialog-body">
          {isSubmitting ? (
            <div className="command-dialog-loader">
              <span className="command-dialog-spinner" />
              <span>Asking the model...</span>
            </div>
          ) : null}

          {candidates && candidates.length > 1 ? (
            <div className="command-dialog-candidates">
              {candidates.map((match) => (
                <button
                  key={match.intent.id}
                  type="button"
                  className="command-dialog-candidate"
                  onClick={() => handleCandidateClick(match)}
                >
                  <span className="candidate-title">{match.intent.title}</span>
                  {match.intent.description ? (
                    <span className="candidate-description">{match.intent.description}</span>
                  ) : null}
                  <span className="candidate-confidence">
                    {Math.round(match.confidence * 100)}% match
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {lastMatch && !candidates ? (
            <div className="command-dialog-match">
              <span className="command-dialog-match-label">Best match</span>
              <span className="command-dialog-match-title">{lastMatch.intent.title}</span>
              <span className="command-dialog-match-meta">
                {Math.round(lastMatch.confidence * 100)}% · {lastMatch.source}
              </span>
            </div>
          ) : null}

          {error ? <p className="command-dialog-error">{error}</p> : null}

          <div className="command-dialog-actions">
            <IntentVoiceButton idleLabel="Use voice" listeningLabel="Listening..." />
            <span className="command-dialog-hint">Press Enter to navigate</span>
          </div>
        </div>
      </div>
    </div>
  )
}
