import { useEffect, useMemo, useState } from 'react'
import {
  AICommand,
  CommandDialog,
  createWeaviateCommandMatcher,
  createWeaviateRouteSearch,
  type AICommandWeaviateRouteResult,
} from 'react-router-ai'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import SettingsLayout from '../features/settings/SettingsLayout.tsx'
import { defineSettingsCommands, routes } from '../features/settings/index.ts'
import { useAppDispatch, useAppSelector } from '../features/settings/settings-store.ts'
import LandingPage from '../pages/landing/LandingPage.tsx'
import './App.css'
import './CommandDialog.css'

const HOME_RECOMMENDATIONS_QUERY = 'settings'
const HOME_RECOMMENDATIONS_LIMIT = 8

let prefetchedHomeRecommendations: AICommandWeaviateRouteResult[] | null = null
let prefetchedHomeRecommendationsPromise: Promise<AICommandWeaviateRouteResult[]> | null = null

function loadHomeRecommendations(
  searchWeaviateRoutes: (query: string, limit?: number) => Promise<AICommandWeaviateRouteResult[]>,
) {
  if (prefetchedHomeRecommendations) {
    return Promise.resolve(prefetchedHomeRecommendations)
  }

  if (prefetchedHomeRecommendationsPromise) {
    return prefetchedHomeRecommendationsPromise
  }

  prefetchedHomeRecommendationsPromise = searchWeaviateRoutes(
    HOME_RECOMMENDATIONS_QUERY,
    HOME_RECOMMENDATIONS_LIMIT,
  )
    .then((routes) => {
      prefetchedHomeRecommendations = routes
      return routes
    })
    .finally(() => {
      prefetchedHomeRecommendationsPromise = null
    })

  return prefetchedHomeRecommendationsPromise
}

function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const [widgetOpen, setWidgetOpen] = useState(false)
  const [recommendedWeaviateRoutes, setRecommendedWeaviateRoutes] = useState<
    AICommandWeaviateRouteResult[]
  >(() => prefetchedHomeRecommendations ?? [])
  const theme = useAppSelector((state) => state.settings.theme)

  const weaviateUrl = import.meta.env.DEV
    ? '/weaviate-api'
    : (import.meta.env.VITE_WEAVIATE_DATABASE_URL as string)

  const clusterUrl = import.meta.env.VITE_WEAVIATE_DATABASE_URL as string
  const weaviateApiKey = import.meta.env.VITE_WEAVIATE_API_KEY as string
  const openAiApiKey = import.meta.env.VITE_OPENAI_API_KEY as string

  const matcher = useMemo(
    () =>
      createWeaviateCommandMatcher({
        weaviateUrl,
        clusterUrl,
        weaviateApiKey,
        openAiApiKey,
      }),
    [weaviateUrl, clusterUrl, weaviateApiKey, openAiApiKey],
  )

  const searchWeaviateRoutes = useMemo(
    () =>
      createWeaviateRouteSearch({
        weaviateUrl,
        clusterUrl,
        weaviateApiKey,
      }),
    [weaviateUrl, clusterUrl, weaviateApiKey],
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
    [dispatch, navigate],
  )

  useEffect(() => {
    if (location.pathname !== '/') {
      return
    }

    if (prefetchedHomeRecommendations) {
      setRecommendedWeaviateRoutes(prefetchedHomeRecommendations)
      return
    }

    let cancelled = false

    void loadHomeRecommendations(searchWeaviateRoutes)
      .then((routes) => {
        if (!cancelled) {
          setRecommendedWeaviateRoutes(routes)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecommendedWeaviateRoutes([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [location.pathname, searchWeaviateRoutes])

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

        <CommandDialog
          open={widgetOpen}
          onOpenChange={setWidgetOpen}
          items={commands}
          weaviateUrl={weaviateUrl}
          clusterUrl={clusterUrl}
          weaviateApiKey={weaviateApiKey}
          recommendedWeaviateRoutes={recommendedWeaviateRoutes}
          onSelectWeaviateRoute={(route) => {
            navigate(route)
            setWidgetOpen(false)
          }}
        />
      </AICommand.Root>
    </div>
  )
}

export default function App() {
  return <AppShell />
}
