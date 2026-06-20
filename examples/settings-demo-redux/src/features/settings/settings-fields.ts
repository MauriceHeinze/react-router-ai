import type { VoiceField } from 'react-router-ai'
import {
  accentOptions,
  defaultLanguageOptions,
  densityOptions,
  digestFrequencyOptions,
  passwordPolicyOptions,
  recordVisibilityOptions,
  recorderStyleOptions,
  sourceCrmOptions,
  retentionOptions,
  summaryLengthOptions,
  transcriptionLanguageOptions,
  themeOptions,
  timezoneOptions,
  webhookEventOptions,
  weekStartOptions,
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
      id: 'settings.profile.display-name',
      label: 'Display name',
      description: 'Change the profile display name.',
      type: 'string',
      phrases: ['change display name', 'set my name', 'rename profile'],
      keywords: ['display', 'name', 'profile', 'account'],
      route: '/settings/profile',
      write: (value) => {
        dispatch(settingsActions.setDisplayName(value))
      },
    },
    {
      id: 'settings.profile.email-address',
      label: 'Email address',
      description: 'Change the profile email address.',
      type: 'string',
      phrases: ['change profile email', 'update email address', 'set my email'],
      keywords: ['email', 'address', 'profile', 'account'],
      route: '/settings/profile',
      write: (value) => {
        dispatch(settingsActions.setEmailAddress(value))
      },
    },
    {
      id: 'settings.profile.bio',
      label: 'Bio',
      description: 'Change the profile bio.',
      type: 'string',
      phrases: ['update bio', 'edit bio', 'set profile bio'],
      keywords: ['bio', 'profile', 'about'],
      route: '/settings/profile',
      write: (value) => {
        dispatch(settingsActions.setBio(value))
      },
    },
    {
      id: 'settings.refer.email-address',
      label: 'Referral email address',
      description: 'Change the email address used for invites.',
      type: 'string',
      phrases: ['set referral email', 'change invite email', 'enter team email'],
      keywords: ['referral', 'invite', 'email', 'team'],
      route: '/settings/refer',
      write: (value) => {
        dispatch(settingsActions.setReferralEmail(value))
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
      id: 'settings.general.workspace-name',
      label: 'Workspace name',
      description: 'Change the workspace name.',
      type: 'string',
      phrases: ['change workspace name', 'rename workspace', 'set company name'],
      keywords: ['workspace', 'company', 'name', 'general'],
      route: '/settings/general',
      write: (value) => {
        dispatch(settingsActions.setWorkspaceName(value))
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
      id: 'settings.notifications.quiet-hours-from',
      label: 'Quiet hours from',
      description: 'Change when quiet hours start.',
      type: 'string',
      phrases: ['set quiet hours from', 'change quiet hours start time', 'set do not disturb start'],
      keywords: ['quiet', 'hours', 'from', 'start', 'notifications'],
      route: '/settings/notifications',
      write: (value) => {
        dispatch(settingsActions.setQuietHoursFrom(value))
      },
    },
    {
      id: 'settings.notifications.quiet-hours-to',
      label: 'Quiet hours to',
      description: 'Change when quiet hours end.',
      type: 'string',
      phrases: ['set quiet hours to', 'change quiet hours end time', 'set do not disturb end'],
      keywords: ['quiet', 'hours', 'to', 'end', 'notifications'],
      route: '/settings/notifications',
      write: (value) => {
        dispatch(settingsActions.setQuietHoursTo(value))
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
      id: 'settings.call-intelligence.transcription-language',
      label: 'Transcription language',
      description: 'Change the language used for call transcription.',
      type: 'enum',
      options: transcriptionLanguageOptions.map((option) => option.value),
      phrases: ['set transcription language', 'change transcript language', 'use german transcription'],
      keywords: ['transcription', 'language', 'call', 'english', 'german', 'spanish', 'french'],
      route: '/settings/call-intelligence',
      write: (value) => {
        dispatch(settingsActions.setTranscriptionLanguage(value))
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
      id: 'settings.developers.webhook-url',
      label: 'Webhook URL',
      description: 'Change the webhook endpoint URL.',
      type: 'string',
      phrases: ['set webhook url', 'change webhook endpoint', 'update webhook address'],
      keywords: ['webhook', 'url', 'endpoint', 'developer'],
      route: '/settings/developers',
      write: (value) => {
        dispatch(settingsActions.setWebhookUrl(value))
      },
    },
    {
      id: 'settings.migrate.source-crm',
      label: 'Source CRM',
      description: 'Change the source CRM for migrations.',
      type: 'enum',
      options: sourceCrmOptions.map((option) => option.value),
      phrases: ['change source crm', 'use hubspot import', 'set migration source'],
      keywords: ['crm', 'source', 'migration', 'salesforce', 'hubspot', 'pipedrive', 'csv'],
      route: '/settings/migrate-crm',
      write: (value) => {
        dispatch(settingsActions.setSourceCrm(value))
      },
    },
    {
      id: 'settings.migrate.connection-or-file',
      label: 'Connection or file',
      description: 'Change the CRM connection or file reference.',
      type: 'string',
      phrases: ['set connection or file', 'update api key or file', 'change import source'],
      keywords: ['connection', 'file', 'import', 'crm', 'migration'],
      route: '/settings/migrate-crm',
      write: (value) => {
        dispatch(settingsActions.setConnectionOrFile(value))
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
      id: 'settings.security.password-policy',
      label: 'Password policy',
      description: 'Change the workspace password policy.',
      type: 'enum',
      options: passwordPolicyOptions.map((option) => option.value),
      phrases: ['use basic passwords', 'set strong password policy', 'use custom password rules'],
      keywords: ['password', 'policy', 'basic', 'strong', 'custom', 'security'],
      route: '/settings/security',
      write: (value) => {
        dispatch(settingsActions.setPasswordPolicy(value))
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
    {
      id: 'settings.records.default-visibility',
      label: 'Default record visibility',
      description: 'Change the default visibility for new records.',
      type: 'enum',
      options: recordVisibilityOptions.map((option) => option.value),
      phrases: ['make records private', 'set records to workspace', 'make records public'],
      keywords: ['record', 'visibility', 'private', 'workspace', 'public'],
      route: '/settings/records',
      write: (value) => {
        dispatch(settingsActions.setRecordVisibility(value))
      },
    },
    {
      id: 'settings.records.history-retention',
      label: 'History retention',
      description: 'Change how long record history is kept.',
      type: 'enum',
      options: retentionOptions.map((option) => option.value),
      phrases: ['keep record history forever', 'retain history for 90 days', 'change record retention'],
      keywords: ['record', 'history', 'retention', 'keep', 'forever', 'days'],
      route: '/settings/records',
      write: (value) => {
        dispatch(settingsActions.setRecordHistoryRetention(value))
      },
    },
    {
      id: 'settings.billing.email',
      label: 'Billing email',
      description: 'Change the billing contact email.',
      type: 'string',
      phrases: ['set billing email', 'change billing contact', 'update invoice email'],
      keywords: ['billing', 'email', 'invoice', 'contact'],
      route: '/settings/billing',
      write: (value) => {
        dispatch(settingsActions.setBillingEmail(value))
      },
    },
    {
      id: 'settings.billing.address',
      label: 'Billing address',
      description: 'Change the billing address.',
      type: 'string',
      phrases: ['set billing address', 'update invoice address', 'change billing details'],
      keywords: ['billing', 'address', 'invoice', 'contact'],
      route: '/settings/billing',
      write: (value) => {
        dispatch(settingsActions.setBillingAddress(value))
      },
    },
    {
      id: 'settings.support.subject',
      label: 'Support subject',
      description: 'Change the support request subject.',
      type: 'string',
      phrases: ['set support subject', 'change request subject', 'update ticket subject'],
      keywords: ['support', 'subject', 'ticket', 'request'],
      route: '/settings/support',
      write: (value) => {
        dispatch(settingsActions.setSupportSubject(value))
      },
    },
    {
      id: 'settings.support.message',
      label: 'Support message',
      description: 'Change the support request message.',
      type: 'string',
      phrases: ['set support message', 'change request message', 'update support ticket'],
      keywords: ['support', 'message', 'ticket', 'request'],
      route: '/settings/support',
      write: (value) => {
        dispatch(settingsActions.setSupportMessage(value))
      },
    },
    {
      id: 'settings.call-recorder.name',
      label: 'Recorder name',
      description: 'Change the call recorder display name.',
      type: 'string',
      phrases: ['set recorder name', 'change notetaker name', 'rename recorder'],
      keywords: ['recorder', 'notetaker', 'name', 'call recorder'],
      route: '/settings/call-recorder',
      write: (value) => {
        dispatch(settingsActions.setRecorderName(value))
      },
    },
    {
      id: 'settings.call-recorder.style',
      label: 'Recorder style',
      description: 'Change the call recorder visual style.',
      type: 'enum',
      options: recorderStyleOptions.map((option) => option.value),
      phrases: ['use default recorder', 'set workspace style', 'use minimal recorder', 'hide recorder image'],
      keywords: ['recorder', 'style', 'default', 'workspace', 'minimal', 'none', 'notetaker'],
      route: '/settings/call-recorder',
      write: (value) => {
        dispatch(settingsActions.setRecorderStyle(value))
      },
    },
    {
      id: 'settings.call-intelligence.summary-length',
      label: 'Default summary length',
      description: 'Change the default call summary format.',
      type: 'enum',
      options: summaryLengthOptions.map((option) => option.value),
      phrases: ['use short summary', 'set bullet summary', 'use detailed recap'],
      keywords: ['summary', 'length', 'short', 'bullet', 'detailed', 'recap'],
      route: '/settings/call-intelligence',
      write: (value) => {
        dispatch(settingsActions.setSummaryLength(value))
      },
    },
    {
      id: 'settings.call-intelligence.retention',
      label: 'Transcript retention',
      description: 'Change how long transcripts are kept.',
      type: 'enum',
      options: retentionOptions.map((option) => option.value),
      phrases: ['keep transcripts for 30 days', 'retain calls for one year', 'keep transcripts forever'],
      keywords: ['transcript', 'retention', 'keep', 'days', 'year', 'forever'],
      route: '/settings/call-intelligence',
      write: (value) => {
        dispatch(settingsActions.setTranscriptRetention(value))
      },
    },
    {
      id: 'settings.notifications.digest-frequency',
      label: 'Digest frequency',
      description: 'Change how often digest emails are sent.',
      type: 'enum',
      options: digestFrequencyOptions.map((option) => option.value),
      phrases: ['send daily digest', 'switch to weekly digest', 'disable digest emails'],
      keywords: ['digest', 'frequency', 'daily', 'weekly', 'never', 'email'],
      route: '/settings/notifications',
      write: (value) => {
        dispatch(settingsActions.setDigestFrequency(value))
      },
    },
    {
      id: 'settings.general.timezone',
      label: 'Timezone',
      description: 'Change the workspace timezone.',
      type: 'enum',
      options: timezoneOptions.map((option) => option.value),
      phrases: ['set timezone to berlin', 'use new york timezone', 'change timezone to tokyo'],
      keywords: ['timezone', 'berlin', 'new york', 'tokyo', 'time'],
      route: '/settings/general',
      write: (value) => {
        dispatch(settingsActions.setTimezone(value))
      },
    },
    {
      id: 'settings.general.week-start',
      label: 'Week starts on',
      description: 'Change the first day of the work week.',
      type: 'enum',
      options: weekStartOptions.map((option) => option.value),
      phrases: ['start week on monday', 'week starts on sunday'],
      keywords: ['week', 'start', 'monday', 'sunday', 'calendar'],
      route: '/settings/general',
      write: (value) => {
        dispatch(settingsActions.setWeekStart(value))
      },
    },
    {
      id: 'settings.developers.webhook-events',
      label: 'Webhook events',
      description: 'Change which events trigger webhooks.',
      type: 'enum',
      options: webhookEventOptions.map((option) => option.value),
      phrases: ['send all webhook events', 'webhook on record changes', 'webhook on user events'],
      keywords: ['webhook', 'events', 'all', 'record', 'user', 'developer'],
      route: '/settings/developers',
      write: (value) => {
        dispatch(settingsActions.setWebhookEvents(value))
      },
    },
  ]
}
