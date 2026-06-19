import { useMemo, useState } from 'react'
import { VoiceProvider, defineVoiceCommands } from 'react-router-ai'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import CommandDialog from './CommandDialog.tsx'
import { SearchIcon } from './Icons.tsx'
import LandingPage from './LandingPage.tsx'
import { createOpenAiCommandMatcher } from './openai-command-matcher.ts'
import SettingsLayout from './SettingsLayout.tsx'
import { defineSettingsCommands, routes } from './routes.ts'
import './App.css'

export type AppTheme = 'light' | 'dark' | 'system'
export type AppDensity = 'comfortable' | 'compact'
export type AppAccent = '#111827' | '#3b82f6' | '#10b981' | '#f59e0b' | '#ef4444' | '#8b5cf6'
export type AppLanguage = 'en' | 'de' | 'es'

function AppShell() {
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [theme, setTheme] = useState<AppTheme>('system')
  const [density, setDensity] = useState<AppDensity>('comfortable')
  const [accent, setAccent] = useState<AppAccent>('#111827')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [defaultLanguage, setDefaultLanguage] = useState<AppLanguage>('en')
  const openAiCommandMatcher = useMemo(() => createOpenAiCommandMatcher(), [])
  const commands = useMemo(
    () =>
      defineVoiceCommands(
        defineSettingsCommands(routes, {
          navigate: (to) => {
            navigate(to)
            setDialogOpen(false)
          },
          setTheme,
          setDensity,
          setAccent,
          setEmailNotifications,
          setPushNotifications,
          setDefaultLanguage,
        }),
      ),
    [navigate],
  )
  const effectiveTheme = theme === 'system' ? 'light' : theme

  return (
    <div className={`app-shell theme-${effectiveTheme}`}>
      <VoiceProvider commands={commands} llmFallback={{ enabled: true, match: openAiCommandMatcher }}>
        <Routes>
          <Route path="/" element={<LandingPage onOpenCommand={() => setDialogOpen(true)} />} />
          <Route
            path="/settings/*"
            element={
              <SettingsLayout
                onOpenCommand={() => setDialogOpen(true)}
                theme={theme}
                onThemeChange={setTheme}
                density={density}
                onDensityChange={setDensity}
                accent={accent}
                onAccentChange={setAccent}
                emailNotifications={emailNotifications}
                onEmailNotificationsChange={setEmailNotifications}
                pushNotifications={pushNotifications}
                onPushNotificationsChange={setPushNotifications}
                defaultLanguage={defaultLanguage}
                onDefaultLanguageChange={setDefaultLanguage}
              />
            }
          />
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
