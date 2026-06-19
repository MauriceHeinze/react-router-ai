import type { VoiceField } from 'react-router-ai'
import {
  accentOptions,
  defaultLanguageOptions,
  densityOptions,
  themeOptions,
} from './settings-metadata.ts'
import type { AppDispatch } from './settings-store.ts'
import { settingsActions } from './settings-store.ts'

const accentValueById = Object.fromEntries(accentOptions.map((option) => [option.id, option.value]))
const defaultLanguageValueById = Object.fromEntries(defaultLanguageOptions.map((option) => [option.id, option.value]))

export function createSettingsFields(dispatch: AppDispatch): VoiceField<any>[] {
  return [
    {
      id: 'settings.appearance.theme',
      label: 'Theme',
      description: 'Change the application theme.',
      type: 'enum',
      options: themeOptions.map((option) => option.value),
      phrases: ['switch theme', 'use light mode', 'turn on dark mode', 'use system theme'],
      keywords: ['theme', 'light', 'dark', 'system', 'appearance'],
      route: '/settings/appearance',
      write: (value) => {
        dispatch(settingsActions.setTheme(value))
      },
    },
    {
      id: 'settings.appearance.density',
      label: 'Density',
      description: 'Change the layout density.',
      type: 'enum',
      options: densityOptions.map((option) => option.value),
      phrases: ['use compact mode', 'set comfortable density', 'change layout density'],
      keywords: ['density', 'compact', 'comfortable', 'appearance', 'layout'],
      route: '/settings/appearance',
      write: (value) => {
        dispatch(settingsActions.setDensity(value))
      },
    },
    {
      id: 'settings.appearance.accent',
      label: 'Accent color',
      description: 'Change the application accent color.',
      type: 'enum',
      options: accentOptions.map((option) => option.id),
      phrases: ['use blue accent', 'set accent to green', 'change accent color'],
      keywords: ['accent', 'color', 'blue', 'green', 'amber', 'red', 'purple', 'appearance'],
      route: '/settings/appearance',
      write: (value) => {
        dispatch(settingsActions.setAccent(accentValueById[value]))
      },
    },
    {
      id: 'settings.profile.visibility',
      label: 'Public profile',
      description: 'Turn public profile visibility on or off.',
      type: 'boolean',
      phrases: ['make my profile public', 'hide my profile', 'change public profile visibility'],
      keywords: ['profile', 'public', 'visibility', 'show', 'hide'],
      route: '/settings/profile',
      write: (value) => {
        dispatch(settingsActions.setIsPublicProfile(value))
      },
    },
    {
      id: 'settings.notifications.email',
      label: 'Email notifications',
      description: 'Turn email notifications on or off.',
      type: 'boolean',
      phrases: ['turn on email notifications', 'disable email alerts', 'change email notifications'],
      keywords: ['email', 'notifications', 'alerts', 'enable', 'disable'],
      route: '/settings/notifications',
      write: (value) => {
        dispatch(settingsActions.setEmailNotifications(value))
      },
    },
    {
      id: 'settings.notifications.push',
      label: 'Push notifications',
      description: 'Turn push notifications on or off.',
      type: 'boolean',
      phrases: ['turn on push notifications', 'disable push alerts', 'change push notifications'],
      keywords: ['push', 'notifications', 'alerts', 'enable', 'disable'],
      route: '/settings/notifications',
      write: (value) => {
        dispatch(settingsActions.setPushNotifications(value))
      },
    },
    {
      id: 'settings.notifications.slack',
      label: 'Slack notifications',
      description: 'Turn Slack notifications on or off.',
      type: 'boolean',
      phrases: ['turn on slack notifications', 'disable slack alerts', 'change slack notifications'],
      keywords: ['slack', 'notifications', 'alerts', 'enable', 'disable'],
      route: '/settings/notifications',
      write: (value) => {
        dispatch(settingsActions.setSlackNotifications(value))
      },
    },
    {
      id: 'settings.notifications.digest',
      label: 'Daily digest',
      description: 'Turn the daily digest on or off.',
      type: 'boolean',
      phrases: ['turn on daily digest', 'disable email digest', 'change digest notifications'],
      keywords: ['digest', 'daily', 'email', 'notifications', 'enable', 'disable'],
      route: '/settings/notifications',
      write: (value) => {
        dispatch(settingsActions.setDigest(value))
      },
    },
    {
      id: 'settings.notifications.quiet-hours',
      label: 'Quiet hours',
      description: 'Turn quiet hours on or off.',
      type: 'boolean',
      phrases: ['turn on quiet hours', 'disable quiet hours', 'change quiet hours'],
      keywords: ['quiet', 'hours', 'notifications', 'enable', 'disable'],
      route: '/settings/notifications',
      write: (value) => {
        dispatch(settingsActions.setQuietHours(value))
      },
    },
    {
      id: 'settings.general.language',
      label: 'Default language',
      description: 'Change the workspace default language.',
      type: 'enum',
      options: defaultLanguageOptions.map((option) => option.id),
      phrases: ['switch language to german', 'use english by default', 'change default language'],
      keywords: ['language', 'english', 'german', 'spanish', 'general', 'workspace'],
      route: '/settings/general',
      write: (value) => {
        dispatch(settingsActions.setDefaultLanguage(defaultLanguageValueById[value]))
      },
    },
    {
      id: 'settings.call-intelligence.transcription',
      label: 'Call transcription',
      description: 'Turn call transcription on or off.',
      type: 'boolean',
      phrases: ['turn on call transcription', 'disable transcription', 'change transcription settings'],
      keywords: ['transcription', 'call', 'recording', 'enable', 'disable'],
      route: '/settings/call-intelligence',
      write: (value) => {
        dispatch(settingsActions.setTranscription(value))
      },
    },
    {
      id: 'settings.call-intelligence.coaching',
      label: 'Coaching insights',
      description: 'Turn coaching insights on or off.',
      type: 'boolean',
      phrases: ['turn on coaching insights', 'disable coaching insights', 'change coaching settings'],
      keywords: ['coaching', 'insights', 'call', 'enable', 'disable'],
      route: '/settings/call-intelligence',
      write: (value) => {
        dispatch(settingsActions.setCoaching(value))
      },
    },
    {
      id: 'settings.developers.webhooks',
      label: 'Webhooks',
      description: 'Turn webhooks on or off.',
      type: 'boolean',
      phrases: ['turn on webhooks', 'disable webhooks', 'change webhook settings'],
      keywords: ['webhooks', 'developer', 'integrations', 'enable', 'disable'],
      route: '/settings/developers',
      write: (value) => {
        dispatch(settingsActions.setWebhooks(value))
      },
    },
    {
      id: 'settings.security.sso',
      label: 'SSO',
      description: 'Turn single sign-on on or off.',
      type: 'boolean',
      phrases: ['turn on sso', 'disable single sign on', 'change sso settings'],
      keywords: ['sso', 'single sign on', 'security', 'authentication', 'enable', 'disable'],
      route: '/settings/security',
      write: (value) => {
        dispatch(settingsActions.setSso(value))
      },
    },
    {
      id: 'settings.security.mfa',
      label: 'Required MFA',
      description: 'Turn required MFA on or off.',
      type: 'boolean',
      phrases: ['turn on mfa', 'disable mfa requirement', 'require multi factor authentication'],
      keywords: ['mfa', 'multi factor', 'security', 'authentication', 'enable', 'disable'],
      route: '/settings/security',
      write: (value) => {
        dispatch(settingsActions.setMfa(value))
      },
    },
    {
      id: 'settings.records.audit',
      label: 'Record audit log',
      description: 'Turn record audit logging on or off.',
      type: 'boolean',
      phrases: ['turn on record audit log', 'disable record audit logging', 'change record audit settings'],
      keywords: ['records', 'audit', 'log', 'history', 'enable', 'disable'],
      route: '/settings/records',
      write: (value) => {
        dispatch(settingsActions.setAudit(value))
      },
    },
  ]
}
