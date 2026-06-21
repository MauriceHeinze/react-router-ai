import { useMemo, useState } from 'react'
import { AICommand, createOpenAICommandMatcher } from 'react-router-ai'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import CommandDialog from './CommandDialog.tsx'
import SettingsLayout from '../features/settings/SettingsLayout.tsx'
import { defineSettingsCommands, routes } from '../features/settings/index.ts'
import { useAppDispatch, useAppSelector } from '../features/settings/settings-store.ts'
import LandingPage from '../pages/landing/LandingPage.tsx'
import './App.css'

function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const [widgetOpen, setWidgetOpen] = useState(false)
  const theme = useAppSelector((state) => state.settings.theme)
  const currentRoute = useMemo(
    () => routes.find((route) => route.path === location.pathname) ?? null,
    [location.pathname],
  )
  const pageContext = useMemo(() => {
    if (location.pathname === '/') return 'Home (/)'
    if (currentRoute) {
      return `Settings > ${currentRoute.title} (${currentRoute.path})`
    }
    return location.pathname
  }, [currentRoute, location.pathname])
  const openAiCommandMatcher = useMemo(
    () =>
      createOpenAICommandMatcher({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY as string,
        model: 'gpt-5-nano',
        reasoningEffort: 'minimal',
        pageContext,
      }),
    [pageContext],
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
        matcher={openAiCommandMatcher}
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
