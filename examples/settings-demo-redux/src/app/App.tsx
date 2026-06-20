import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { VoiceProvider, VoiceWidget, defineVoiceCommands, useVoiceController } from 'react-router-ai'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { createOpenAiCommandMatcher } from './openai-command-matcher.ts'
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
    () => createOpenAiCommandMatcher({ pageContext }),
    [pageContext],
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setWidgetOpen((open) => !open)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const commands = useMemo(
    () =>
      defineVoiceCommands(
        defineSettingsCommands(
          routes,
          {
            dispatch,
            navigate: (to) => {
              navigate(to)
              setWidgetOpen(false)
            },
          },
        ),
      ),
    [dispatch, navigate],
  )
  const effectiveTheme = theme === 'system' ? 'light' : theme

  return (
    <div className={`app-shell theme-${effectiveTheme}`}>
      <VoiceProvider commands={commands} fuzzyMatching={false} llmFallback={{ enabled: true, match: openAiCommandMatcher }}>
        <VoiceHighlightBridge>
          {(highlightTargetId) => (
            <>
              <Routes>
                <Route path="/" element={<LandingPage onOpenCommand={() => setWidgetOpen(true)} />} />
                <Route
                  path="/settings/*"
                  element={
                    <SettingsLayout
                      onOpenCommand={() => setWidgetOpen(true)}
                      highlightTargetId={highlightTargetId}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              <VoiceWidget open={widgetOpen} onOpenChange={setWidgetOpen} />
            </>
          )}
        </VoiceHighlightBridge>
      </VoiceProvider>
    </div>
  )
}

function VoiceHighlightBridge({ children }: { children: (highlightTargetId: string | null) => ReactNode }) {
  const { lastHighlight } = useVoiceController()
  return <>{children(lastHighlight?.targetId ?? null)}</>
}

export default function App() {
  return <AppShell />
}
