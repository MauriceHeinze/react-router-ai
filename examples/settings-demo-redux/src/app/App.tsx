import { useMemo, useState } from 'react'
import { VoiceProvider, defineVoiceCommands } from 'react-router-ai'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import CommandDialog from '../features/commands/CommandDialog.tsx'
import SettingsLayout from '../features/settings/SettingsLayout.tsx'
import { defineSettingsCommands, routes } from '../features/settings/index.ts'
import { useAppDispatch, useAppSelector } from '../features/settings/settings-store.ts'
import LandingPage from '../pages/landing/LandingPage.tsx'
import { SearchIcon } from '../shared/ui/Icons.tsx'
import './App.css'

function AppShell() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [dialogOpen, setDialogOpen] = useState(false)
  const theme = useAppSelector((state) => state.settings.theme)
  const commands = useMemo(
    () =>
      defineVoiceCommands(
        defineSettingsCommands(
          routes,
          {
            dispatch,
            navigate: (to) => {
              navigate(to)
              setDialogOpen(false)
            },
          },
        ),
      ),
    [dispatch, navigate],
  )
  const effectiveTheme = theme === 'system' ? 'light' : theme

  return (
    <div className={`app-shell theme-${effectiveTheme}`}>
      <VoiceProvider commands={commands} llmFallback={{ enabled: true }}>
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
      </VoiceProvider>
    </div>
  )
}

export default function App() {
  return <AppShell />
}
