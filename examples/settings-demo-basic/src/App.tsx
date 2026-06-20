import { useMemo, useState } from 'react'
import { VoiceProvider, defineVoiceCommands } from 'react-router-ai'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
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
export type AppSummaryLength = 'short' | 'bullet' | 'detailed'
export type AppRetention = '30' | '90' | '365' | 'forever'
export type AppDigestFrequency = 'daily' | 'weekly' | 'never'
export type AppTimezone = 'Europe/Berlin' | 'America/New_York' | 'Asia/Tokyo'
export type AppWeekStart = 'monday' | 'sunday'
export type AppPasswordPolicy = 'basic' | 'strong' | 'custom'
export type AppRecordVisibility = 'private' | 'workspace' | 'public'
export type AppWebhookEvents = 'all' | 'record' | 'user'
export type RecorderStyle = 'default' | 'workspace' | 'minimal' | 'none'

function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [theme, setTheme] = useState<AppTheme>('system')
  const [density, setDensity] = useState<AppDensity>('comfortable')
  const [accent, setAccent] = useState<AppAccent>('#111827')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [defaultLanguage, setDefaultLanguage] = useState<AppLanguage>('en')
  const [recorderName, setRecorderName] = useState('Notetaker')
  const [recorderStyle, setRecorderStyle] = useState<RecorderStyle>('default')
  const [summaryLength, setSummaryLength] = useState<AppSummaryLength>('bullet')
  const [transcriptRetention, setTranscriptRetention] = useState<AppRetention>('90')
  const [digestFrequency, setDigestFrequency] = useState<AppDigestFrequency>('daily')
  const [timezone, setTimezone] = useState<AppTimezone>('Europe/Berlin')
  const [weekStart, setWeekStart] = useState<AppWeekStart>('monday')
  const [passwordPolicy, setPasswordPolicy] = useState<AppPasswordPolicy>('strong')
  const [recordVisibility, setRecordVisibility] = useState<AppRecordVisibility>('workspace')
  const [webhookEvents, setWebhookEvents] = useState<AppWebhookEvents>('all')
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
          setRecorderName,
          setRecorderStyle,
          setSummaryLength,
          setTranscriptRetention,
          setDigestFrequency,
          setTimezone,
          setWeekStart,
          setPasswordPolicy,
          setRecordVisibility,
          setWebhookEvents,
        }),
      ),
    [navigate],
  )
  const effectiveTheme = theme === 'system' ? 'light' : theme

  return (
    <div className={`app-shell theme-${effectiveTheme}`}>
      <VoiceProvider commands={commands} fuzzyMatching={false} llmFallback={{ enabled: true, match: openAiCommandMatcher }}>
        <>
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
                  recorderName={recorderName}
                  onRecorderNameChange={setRecorderName}
                  recorderStyle={recorderStyle}
                  onRecorderStyleChange={setRecorderStyle}
                  summaryLength={summaryLength}
                  onSummaryLengthChange={setSummaryLength}
                  transcriptRetention={transcriptRetention}
                  onTranscriptRetentionChange={setTranscriptRetention}
                  digestFrequency={digestFrequency}
                  onDigestFrequencyChange={setDigestFrequency}
                  timezone={timezone}
                  onTimezoneChange={setTimezone}
                  weekStart={weekStart}
                  onWeekStartChange={setWeekStart}
                  passwordPolicy={passwordPolicy}
                  onPasswordPolicyChange={setPasswordPolicy}
                  recordVisibility={recordVisibility}
                  onRecordVisibilityChange={setRecordVisibility}
                  webhookEvents={webhookEvents}
                  onWebhookEventsChange={setWebhookEvents}
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

          <CommandDialog
            open={dialogOpen}
            onOpen={() => setDialogOpen(true)}
            onClose={() => setDialogOpen(false)}
          />
        </>
      </VoiceProvider>
    </div>
  )
}

export default function App() {
  return <AppShell />
}
