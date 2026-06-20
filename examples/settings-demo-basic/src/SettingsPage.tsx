import type {
  AppAccent,
  AppDensity,
  AppDigestFrequency,
  AppLanguage,
  AppPasswordPolicy,
  AppRecordVisibility,
  AppRetention,
  AppSummaryLength,
  AppTheme,
  AppTimezone,
  AppWebhookEvents,
  AppWeekStart,
} from './App.tsx'
import { SettingForm } from './SettingForms.tsx'
import type { SettingsRoute } from './routes.ts'
import './SettingsPage.css'

type SettingsPageProps = {
  route: SettingsRoute
  highlightTargetId?: string | null
  theme: AppTheme
  onThemeChange: (theme: AppTheme) => void
  density: AppDensity
  onDensityChange: (density: AppDensity) => void
  accent: AppAccent
  onAccentChange: (accent: AppAccent) => void
  emailNotifications: boolean
  onEmailNotificationsChange: (enabled: boolean) => void
  pushNotifications: boolean
  onPushNotificationsChange: (enabled: boolean) => void
  defaultLanguage: AppLanguage
  onDefaultLanguageChange: (language: AppLanguage) => void
  summaryLength: AppSummaryLength
  onSummaryLengthChange: (length: AppSummaryLength) => void
  transcriptRetention: AppRetention
  onTranscriptRetentionChange: (retention: AppRetention) => void
  digestFrequency: AppDigestFrequency
  onDigestFrequencyChange: (frequency: AppDigestFrequency) => void
  timezone: AppTimezone
  onTimezoneChange: (timezone: AppTimezone) => void
  weekStart: AppWeekStart
  onWeekStartChange: (weekStart: AppWeekStart) => void
  passwordPolicy: AppPasswordPolicy
  onPasswordPolicyChange: (policy: AppPasswordPolicy) => void
  recordVisibility: AppRecordVisibility
  onRecordVisibilityChange: (visibility: AppRecordVisibility) => void
  webhookEvents: AppWebhookEvents
  onWebhookEventsChange: (events: AppWebhookEvents) => void
}

export default function SettingsPage(props: SettingsPageProps) {
  const { route, highlightTargetId } = props
  return (
    <section className="settings-page">
      <div className={`settings-page-header ${highlightTargetId === route.id ? 'highlighted' : ''}`}>
        <h1>{route.title}</h1>
        <p>{route.description}</p>
      </div>
      <SettingForm {...props} />
    </section>
  )
}
