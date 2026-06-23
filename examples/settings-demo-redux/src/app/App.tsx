import { useMemo, useState } from 'react'
import { AICommand, createWeaviateCommandMatcher } from 'react-router-ai'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import CommandDialog from './CommandDialog.tsx'
import SettingsLayout from '../features/settings/SettingsLayout.tsx'
import { defineSettingsCommands, routes } from '../features/settings/index.ts'
import { useAppDispatch, useAppSelector } from '../features/settings/settings-store.ts'
import LandingPage from '../pages/landing/LandingPage.tsx'
import './App.css'

function AppShell() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [widgetOpen, setWidgetOpen] = useState(false)
  const theme = useAppSelector((state) => state.settings.theme)
  const matcher = useMemo(
    () =>
      createWeaviateCommandMatcher({
        weaviateUrl: import.meta.env.DEV
          ? '/weaviate-api'
          : import.meta.env.VITE_WEAVIATE_DATABASE_URL as string,
        clusterUrl: import.meta.env.VITE_WEAVIATE_DATABASE_URL as string,
        weaviateApiKey: import.meta.env.VITE_WEAVIATE_API_KEY as string,
        openAiApiKey: import.meta.env.VITE_OPENAI_API_KEY as string,
      }),
    [],
  )

  const commands = useMemo(
    () =>
      defineSettingsCommands(routes, {
        dispatch,
        navigate: (to) => {
          navigate(to)
          setWidgetOpen(false)
        },
      }),
    [dispatch, navigate]
  )
  const effectiveTheme = theme === 'system' ? 'light' : theme

  return (
    <div className={`app-shell theme-${effectiveTheme}`}>
      <AICommand.Root
        matcher={matcher}
        maxVisibleItems={8}
        onContactSupport={() => {
          window.location.href = 'mailto:support@example.com?subject=Settings%20help'
        }}
      >
        <Routes>
          <Route path="/" element={<LandingPage onOpenCommand={() => setWidgetOpen(true)} />} />
          <Route
            path="/settings/*"
            element={
              <SettingsLayout
                onOpenCommand={() => setWidgetOpen(true)}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <CommandDialog open={widgetOpen} onOpenChange={setWidgetOpen} items={commands} />
      </AICommand.Root>
    </div>
  )
}

export default function App() {
  return <AppShell />
}
