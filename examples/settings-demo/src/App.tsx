import { useMemo, useState } from 'react'
import { IntentProvider } from 'react-router-ai'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import CommandDialog from './CommandDialog.tsx'
import { SearchIcon } from './Icons.tsx'
import LandingPage from './LandingPage.tsx'
import SettingsLayout from './SettingsLayout.tsx'
import { defineSettingsIntents, routes } from './routes.ts'
import './App.css'

function AppShell() {
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const intents = useMemo(() => defineSettingsIntents(routes), [])

  return (
    <IntentProvider
      intents={intents}
      onNavigate={(match) => {
        navigate(match.intent.to)
        setDialogOpen(false)
      }}
      llmFallback={{ enabled: true }}
    >
      <Routes>
        <Route path="/" element={<LandingPage onOpenCommand={() => setDialogOpen(true)} />} />
        <Route path="/settings/*" element={<SettingsLayout onOpenCommand={() => setDialogOpen(true)} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <button
        className="floating-command-button"
        type="button"
        onClick={() => setDialogOpen(true)}
        aria-label="Open command palette"
      >
        <SearchIcon className="floating-command-icon" />
      </button>

      <CommandDialog open={dialogOpen} onOpen={() => setDialogOpen(true)} onClose={() => setDialogOpen(false)} />
    </IntentProvider>
  )
}

export default function App() {
  return <AppShell />
}
