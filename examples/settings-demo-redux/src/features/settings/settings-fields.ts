import type { AICommandItem } from 'react-router-ai'
import type { AppDispatch } from './settings-store.ts'
import { settingsActions } from './settings-store.ts'

type SettingCommandOptions = {
  dispatch: AppDispatch
  navigate: (to: string) => void
}

export function createSettingsCommands(options: SettingCommandOptions): AICommandItem[] {
  const { dispatch, navigate } = options

  return [
    {
      id: 'settings.appearance.theme',
      value: 'Theme',
      description: 'Change the application theme.',
      keywords: ['theme', 'light', 'dark', 'system', 'appearance'],
      onSelect: () => navigate('/settings/appearance'),
    },
    {
      id: 'settings.appearance.theme.set.light',
      value: 'Set theme to light',
      description: 'Switch to light mode.',
      keywords: ['theme', 'light', 'appearance'],
      onSelect: () => {
        dispatch(settingsActions.setTheme('light'))
        navigate('/settings/appearance')
      },
    },
    {
      id: 'settings.appearance.theme.set.dark',
      value: 'Set theme to dark',
      description: 'Switch to dark mode.',
      keywords: ['theme', 'dark', 'appearance'],
      onSelect: () => {
        dispatch(settingsActions.setTheme('dark'))
        navigate('/settings/appearance')
      },
    },
    {
      id: 'settings.appearance.theme.set.system',
      value: 'Set theme to system',
      description: 'Follow system preference.',
      keywords: ['theme', 'system', 'appearance'],
      onSelect: () => {
        dispatch(settingsActions.setTheme('system'))
        navigate('/settings/appearance')
      },
    },
    {
      id: 'settings.appearance.density',
      value: 'Density',
      description: 'Change the layout density.',
      keywords: ['density', 'compact', 'comfortable', 'appearance', 'layout'],
      onSelect: () => navigate('/settings/appearance'),
    },
    {
      id: 'settings.appearance.density.set.comfortable',
      value: 'Set density to comfortable',
      description: 'Use comfortable layout density.',
      keywords: ['density', 'comfortable', 'appearance'],
      onSelect: () => {
        dispatch(settingsActions.setDensity('comfortable'))
        navigate('/settings/appearance')
      },
    },
    {
      id: 'settings.appearance.density.set.compact',
      value: 'Set density to compact',
      description: 'Use compact layout density.',
      keywords: ['density', 'compact', 'appearance'],
      onSelect: () => {
        dispatch(settingsActions.setDensity('compact'))
        navigate('/settings/appearance')
      },
    },
    {
      id: 'settings.appearance.accent',
      value: 'Accent color',
      description: 'Change the application accent color.',
      keywords: ['accent', 'color', 'appearance'],
      onSelect: () => navigate('/settings/appearance'),
    },
    {
      id: 'settings.profile.display-name',
      value: 'Display name',
      description: 'Change the profile display name.',
      keywords: ['display', 'name', 'profile', 'account'],
      onSelect: () => navigate('/settings/profile'),
    },
    {
      id: 'settings.profile.email-address',
      value: 'Email address',
      description: 'Change the profile email address.',
      keywords: ['email', 'address', 'profile', 'account'],
      onSelect: () => navigate('/settings/profile'),
    },
    {
      id: 'settings.profile.bio',
      value: 'Bio',
      description: 'Change the profile bio.',
      keywords: ['bio', 'profile', 'about'],
      onSelect: () => navigate('/settings/profile'),
    },
    {
      id: 'settings.refer.email-address',
      value: 'Referral email address',
      description: 'Change the email address used for invites.',
      keywords: ['referral', 'invite', 'email', 'team'],
      onSelect: () => navigate('/settings/refer'),
    },
    {
      id: 'settings.profile.visibility',
      value: 'Public profile',
      description: 'Turn public profile visibility on or off.',
      keywords: ['profile', 'public', 'visibility', 'show', 'hide'],
      onSelect: () => navigate('/settings/profile'),
    },
    {
      id: 'settings.general.workspace-name',
      value: 'Workspace name',
      description: 'Change the workspace name.',
      keywords: ['workspace', 'company', 'name', 'general'],
      onSelect: () => navigate('/settings/general'),
    },
    {
      id: 'settings.notifications.email',
      value: 'Email notifications',
      description: 'Turn email notifications on or off.',
      keywords: ['email', 'notifications', 'alerts', 'enable', 'disable'],
      onSelect: () => navigate('/settings/notifications'),
    },
    {
      id: 'settings.notifications.push',
      value: 'Push notifications',
      description: 'Turn push notifications on or off.',
      keywords: ['push', 'notifications', 'alerts', 'enable', 'disable'],
      onSelect: () => navigate('/settings/notifications'),
    },
    {
      id: 'settings.notifications.slack',
      value: 'Slack notifications',
      description: 'Turn Slack notifications on or off.',
      keywords: ['slack', 'notifications', 'alerts', 'enable', 'disable'],
      onSelect: () => navigate('/settings/notifications'),
    },
    {
      id: 'settings.notifications.digest',
      value: 'Daily digest',
      description: 'Turn the daily digest on or off.',
      keywords: ['digest', 'daily', 'email', 'notifications', 'enable', 'disable'],
      onSelect: () => navigate('/settings/notifications'),
    },
    {
      id: 'settings.notifications.quiet-hours',
      value: 'Quiet hours',
      description: 'Turn quiet hours on or off.',
      keywords: ['quiet', 'hours', 'notifications', 'enable', 'disable'],
      onSelect: () => navigate('/settings/notifications'),
    },
    {
      id: 'settings.notifications.quiet-hours-from',
      value: 'Quiet hours from',
      description: 'Change when quiet hours start.',
      keywords: ['quiet', 'hours', 'from', 'start', 'notifications'],
      onSelect: () => navigate('/settings/notifications'),
    },
    {
      id: 'settings.notifications.quiet-hours-to',
      value: 'Quiet hours to',
      description: 'Change when quiet hours end.',
      keywords: ['quiet', 'hours', 'to', 'end', 'notifications'],
      onSelect: () => navigate('/settings/notifications'),
    },
    {
      id: 'settings.general.language',
      value: 'Default language',
      description: 'Change the workspace default language.',
      keywords: ['language', 'english', 'german', 'spanish', 'general', 'workspace'],
      onSelect: () => navigate('/settings/general'),
    },
    {
      id: 'settings.call-intelligence.transcription',
      value: 'Call transcription',
      description: 'Turn call transcription on or off.',
      keywords: ['transcription', 'call', 'recording', 'enable', 'disable'],
      onSelect: () => navigate('/settings/call-intelligence'),
    },
    {
      id: 'settings.call-intelligence.transcription-language',
      value: 'Transcription language',
      description: 'Change the language used for call transcription.',
      keywords: ['transcription', 'language', 'call', 'english', 'german', 'spanish', 'french'],
      onSelect: () => navigate('/settings/call-intelligence'),
    },
    {
      id: 'settings.call-intelligence.coaching',
      value: 'Coaching insights',
      description: 'Turn coaching insights on or off.',
      keywords: ['coaching', 'insights', 'call', 'enable', 'disable'],
      onSelect: () => navigate('/settings/call-intelligence'),
    },
    {
      id: 'settings.developers.webhooks',
      value: 'Webhooks',
      description: 'Turn webhooks on or off.',
      keywords: ['webhooks', 'developer', 'integrations', 'enable', 'disable'],
      onSelect: () => navigate('/settings/developers'),
    },
    {
      id: 'settings.developers.webhook-url',
      value: 'Webhook URL',
      description: 'Change the webhook endpoint URL.',
      keywords: ['webhook', 'url', 'endpoint', 'developer'],
      onSelect: () => navigate('/settings/developers'),
    },
    {
      id: 'settings.migrate.source-crm',
      value: 'Source CRM',
      description: 'Change the source CRM for migrations.',
      keywords: ['crm', 'source', 'migration', 'salesforce', 'hubspot', 'pipedrive', 'csv'],
      onSelect: () => navigate('/settings/migrate-crm'),
    },
    {
      id: 'settings.migrate.connection-or-file',
      value: 'Connection or file',
      description: 'Change the CRM connection or file reference.',
      keywords: ['connection', 'file', 'import', 'crm', 'migration'],
      onSelect: () => navigate('/settings/migrate-crm'),
    },
    {
      id: 'settings.security.sso',
      value: 'SSO',
      description: 'Turn single sign-on on or off.',
      keywords: ['sso', 'single sign on', 'security', 'authentication', 'enable', 'disable'],
      onSelect: () => navigate('/settings/security'),
    },
    {
      id: 'settings.security.mfa',
      value: 'Required MFA',
      description: 'Turn required MFA on or off.',
      keywords: ['mfa', 'multi factor', 'security', 'authentication', 'enable', 'disable'],
      onSelect: () => navigate('/settings/security'),
    },
    {
      id: 'settings.security.password-policy',
      value: 'Password policy',
      description: 'Change the workspace password policy.',
      keywords: ['password', 'policy', 'basic', 'strong', 'custom', 'security'],
      onSelect: () => navigate('/settings/security'),
    },
    {
      id: 'settings.records.audit',
      value: 'Record audit log',
      description: 'Turn record audit logging on or off.',
      keywords: ['records', 'audit', 'log', 'history', 'enable', 'disable'],
      onSelect: () => navigate('/settings/records'),
    },
    {
      id: 'settings.records.default-visibility',
      value: 'Default record visibility',
      description: 'Change the default visibility for new records.',
      keywords: ['record', 'visibility', 'private', 'workspace', 'public'],
      onSelect: () => navigate('/settings/records'),
    },
    {
      id: 'settings.records.history-retention',
      value: 'History retention',
      description: 'Change how long record history is kept.',
      keywords: ['record', 'history', 'retention', 'keep', 'forever', 'days'],
      onSelect: () => navigate('/settings/records'),
    },
    {
      id: 'settings.billing.email',
      value: 'Billing email',
      description: 'Change the billing contact email.',
      keywords: ['billing', 'email', 'invoice', 'contact'],
      onSelect: () => navigate('/settings/billing'),
    },
    {
      id: 'settings.billing.address',
      value: 'Billing address',
      description: 'Change the billing address.',
      keywords: ['billing', 'address', 'invoice', 'contact'],
      onSelect: () => navigate('/settings/billing'),
    },
    {
      id: 'settings.support.subject',
      value: 'Support subject',
      description: 'Change the support request subject.',
      keywords: ['support', 'subject', 'ticket', 'request'],
      onSelect: () => navigate('/settings/support'),
    },
    {
      id: 'settings.support.message',
      value: 'Support message',
      description: 'Change the support request message.',
      keywords: ['support', 'message', 'ticket', 'request'],
      onSelect: () => navigate('/settings/support'),
    },
    {
      id: 'settings.call-recorder.name',
      value: 'Recorder name',
      description: 'Change the call recorder display name.',
      keywords: ['recorder', 'notetaker', 'name', 'call recorder'],
      onSelect: () => navigate('/settings/call-recorder'),
    },
    {
      id: 'settings.call-recorder.style',
      value: 'Recorder style',
      description: 'Change the call recorder visual style.',
      keywords: ['recorder', 'style', 'default', 'workspace', 'minimal', 'none', 'notetaker'],
      onSelect: () => navigate('/settings/call-recorder'),
    },
    {
      id: 'settings.call-intelligence.summary-length',
      value: 'Default summary length',
      description: 'Change the default call summary format.',
      keywords: ['summary', 'length', 'short', 'bullet', 'detailed', 'recap'],
      onSelect: () => navigate('/settings/call-intelligence'),
    },
    {
      id: 'settings.call-intelligence.retention',
      value: 'Transcript retention',
      description: 'Change how long transcripts are kept.',
      keywords: ['transcript', 'retention', 'keep', 'days', 'year', 'forever'],
      onSelect: () => navigate('/settings/call-intelligence'),
    },
    {
      id: 'settings.notifications.digest-frequency',
      value: 'Digest frequency',
      description: 'Change how often digest emails are sent.',
      keywords: ['digest', 'frequency', 'daily', 'weekly', 'never', 'email'],
      onSelect: () => navigate('/settings/notifications'),
    },
    {
      id: 'settings.general.timezone',
      value: 'Timezone',
      description: 'Change the workspace timezone.',
      keywords: ['timezone', 'berlin', 'new york', 'tokyo', 'time'],
      onSelect: () => navigate('/settings/general'),
    },
    {
      id: 'settings.general.week-start',
      value: 'Week starts on',
      description: 'Change the first day of the work week.',
      keywords: ['week', 'start', 'monday', 'sunday', 'calendar'],
      onSelect: () => navigate('/settings/general'),
    },
    {
      id: 'settings.developers.webhook-events',
      value: 'Webhook events',
      description: 'Change which events trigger webhooks.',
      keywords: ['webhook', 'events', 'all', 'record', 'user', 'developer'],
      onSelect: () => navigate('/settings/developers'),
    },
  ]
}
