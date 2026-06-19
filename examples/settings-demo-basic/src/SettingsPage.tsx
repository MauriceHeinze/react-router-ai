import type { AppAccent, AppDensity, AppLanguage, AppTheme } from './App.tsx'
import { SettingForm } from './SettingForms.tsx'
import type { SettingsRoute } from './routes.ts'
import './SettingsPage.css'

type SettingsPageProps = {
  route: SettingsRoute
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
}

export default function SettingsPage(props: SettingsPageProps) {
  const { route } = props
  return (
    <section className="settings-page">
      <div className="settings-page-header">
        <h1>{route.title}</h1>
        <p>{route.description}</p>
      </div>
      <SettingForm {...props} />
    </section>
  )
}
