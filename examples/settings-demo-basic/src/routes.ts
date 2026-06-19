import type { VoiceCommand } from 'react-router-ai'

export type RouteSection = 'personal' | 'workspace' | 'data'

export type SettingsRoute = {
  id: string
  section: RouteSection
  label: string
  path: string
  icon: string
  title: string
  description: string
  phrases?: string[]
}

export const routes: SettingsRoute[] = [
  {
    id: 'settings.profile',
    section: 'personal',
    label: 'Profile',
    path: '/settings/profile',
    icon: 'user',
    title: 'Profile',
    description: 'Update your display name, avatar, biography, and public profile details.',
    phrases: ['edit my profile', 'change my avatar', 'update my name'],
  },
  {
    id: 'settings.appearance',
    section: 'personal',
    label: 'Appearance',
    path: '/settings/appearance',
    icon: 'appearance',
    title: 'Appearance',
    description: 'Choose your theme, density, and accent preferences.',
    phrases: ['change theme', 'dark mode', 'appearance settings'],
  },
  {
    id: 'settings.email-calendar',
    section: 'personal',
    label: 'Email and calendar accounts',
    path: '/settings/email-calendar',
    icon: 'emailCalendar',
    title: 'Email and calendar accounts',
    description: 'Connect and manage your email and calendar integrations.',
    phrases: ['connect email', 'calendar accounts', 'sync calendar'],
  },
  {
    id: 'settings.call-intelligence',
    section: 'personal',
    label: 'Call intelligence',
    path: '/settings/call-intelligence',
    icon: 'callIntelligence',
    title: 'Call intelligence',
    description: 'Configure transcription, summaries, and coaching insights.',
    phrases: ['call intelligence', 'transcription settings', 'call insights'],
  },
  {
    id: 'settings.storage',
    section: 'personal',
    label: 'Storage accounts',
    path: '/settings/storage',
    icon: 'storage',
    title: 'Storage accounts',
    description: 'Link cloud storage providers and manage file attachments.',
    phrases: ['storage accounts', 'cloud storage', 'file storage'],
  },
  {
    id: 'settings.refer',
    section: 'personal',
    label: 'Refer another team',
    path: '/settings/refer',
    icon: 'refer',
    title: 'Refer another team',
    description: 'Invite other teams and earn workspace credits.',
    phrases: ['refer a team', 'invite team', 'referral settings'],
  },
  {
    id: 'settings.notifications',
    section: 'personal',
    label: 'Notifications',
    path: '/settings/notifications',
    icon: 'notifications',
    title: 'Notifications',
    description: 'Tune digests, delivery channels, and quiet hours.',
    phrases: ['notification settings', 'change email alerts', 'quiet hours'],
  },
  {
    id: 'settings.sessions',
    section: 'personal',
    label: 'Sessions',
    path: '/settings/sessions',
    icon: 'sessions',
    title: 'Sessions',
    description: 'Review active sessions and sign out of devices remotely.',
    phrases: ['active sessions', 'sign out devices', 'session settings'],
  },

  {
    id: 'settings.general',
    section: 'workspace',
    label: 'General',
    path: '/settings/general',
    icon: 'general',
    title: 'General',
    description: 'Manage workspace name, timezone, and default behaviors.',
    phrases: ['general settings', 'workspace name', 'timezone'],
  },
  {
    id: 'settings.call-recorder',
    section: 'workspace',
    label: 'Call recorder',
    path: '/settings/call-recorder',
    icon: 'callRecorder',
    title: 'Call recorder',
    description: 'Manage your call recorder name, style, and preview.',
    phrases: ['call recorder', 'recording settings', 'change notetaker'],
  },
  {
    id: 'settings.members',
    section: 'workspace',
    label: 'Members',
    path: '/settings/members',
    icon: 'members',
    title: 'Members',
    description: 'Invite teammates, manage roles, and set permissions.',
    phrases: ['workspace members', 'invite user', 'manage permissions'],
  },
  {
    id: 'settings.plans',
    section: 'workspace',
    label: 'Plans',
    path: '/settings/plans',
    icon: 'plans',
    title: 'Plans',
    description: 'Compare plans, upgrade, or change billing frequency.',
    phrases: ['change plan', 'subscription plans', 'upgrade workspace'],
  },
  {
    id: 'settings.billing',
    section: 'workspace',
    label: 'Billing',
    path: '/settings/billing',
    icon: 'billing',
    title: 'Billing',
    description: 'Update your payment method, download invoices, and change your plan.',
    phrases: ['manage subscription', 'open billing', 'change payment method'],
  },
  {
    id: 'settings.developers',
    section: 'workspace',
    label: 'Developers',
    path: '/settings/developers',
    icon: 'developers',
    title: 'Developers',
    description: 'Manage API keys, webhooks, and integration settings.',
    phrases: ['developer settings', 'api keys', 'webhooks'],
  },
  {
    id: 'settings.security',
    section: 'workspace',
    label: 'Security',
    path: '/settings/security',
    icon: 'security',
    title: 'Security',
    description: 'Set up SSO, enforce MFA, and review audit logs.',
    phrases: ['security settings', 'sso', 'mfa'],
  },
  {
    id: 'settings.records',
    section: 'workspace',
    label: 'Records',
    path: '/settings/records',
    icon: 'records',
    title: 'Records',
    description: 'Configure record visibility, history, and retention rules.',
    phrases: ['record settings', 'retention', 'record history'],
  },
  {
    id: 'settings.support',
    section: 'workspace',
    label: 'Support requests',
    path: '/settings/support',
    icon: 'support',
    title: 'Support requests',
    description: 'Open and track support conversations with our team.',
    phrases: ['support requests', 'contact support', 'help tickets'],
  },
  {
    id: 'settings.migrate',
    section: 'workspace',
    label: 'Migrate CRM',
    path: '/settings/migrate-crm',
    icon: 'migrate',
    title: 'Migrate CRM',
    description: 'Import contacts, companies, and deals from another CRM.',
    phrases: ['migrate crm', 'import data', 'crm migration'],
  },

  {
    id: 'settings.objects',
    section: 'data',
    label: 'Objects',
    path: '/settings/objects',
    icon: 'objects',
    title: 'Objects',
    description: 'Define custom objects and configure their attributes.',
    phrases: ['custom objects', 'object settings', 'data objects'],
  },
]

export const sectionLabels: Record<RouteSection, string> = {
  personal: 'Personal',
  workspace: 'Workspace',
  data: 'Data',
}

export function defineSettingsCommands(
  routes: SettingsRoute[],
  actions: {
    navigate: (to: string) => void
    setTheme: (theme: 'light' | 'dark' | 'system') => void
    setDensity: (density: 'comfortable' | 'compact') => void
    setAccent: (accent: '#111827' | '#3b82f6' | '#10b981' | '#f59e0b' | '#ef4444' | '#8b5cf6') => void
    setEmailNotifications: (enabled: boolean) => void
    setPushNotifications: (enabled: boolean) => void
    setDefaultLanguage: (language: 'en' | 'de' | 'es') => void
  },
): VoiceCommand[] {
  const routeCommands = routes.map((route) => ({
    id: route.id,
    title: route.title,
    description: route.description,
    phrases: route.phrases ?? [route.label.toLowerCase()],
    keywords: route.label.toLowerCase().split(' '),
    run: () => actions.navigate(route.path),
  }))

  return [
    {
      id: 'home',
      title: 'Home',
      description: 'Go back to the landing page.',
      phrases: ['go home', 'home page', 'landing page', 'back to home'],
      keywords: ['home', 'landing', 'start'],
      run: () => actions.navigate('/'),
    },
    {
      id: 'settings.appearance.theme.set',
      title: 'Set theme',
      description: 'Change the application theme.',
      phrases: ['switch theme', 'use light mode', 'turn on dark mode', 'use system theme'],
      keywords: ['theme', 'light', 'dark', 'system', 'appearance'],
      parameters: {
        value: {
          label: 'Theme',
          options: ['light', 'dark', 'system'] as const,
        },
      },
      run: ({ value }) => {
        if (value === 'light' || value === 'dark' || value === 'system') {
          actions.setTheme(value)
          actions.navigate('/settings/appearance')
        }
      },
    },
    {
      id: 'settings.appearance.density.set',
      title: 'Set density',
      description: 'Change the layout density.',
      phrases: ['use compact mode', 'set comfortable density', 'change layout density'],
      keywords: ['density', 'compact', 'comfortable', 'appearance', 'layout'],
      parameters: {
        value: {
          label: 'Density',
          options: ['comfortable', 'compact'] as const,
        },
      },
      run: ({ value }) => {
        if (value === 'comfortable' || value === 'compact') {
          actions.setDensity(value)
          actions.navigate('/settings/appearance')
        }
      },
    },
    {
      id: 'settings.appearance.accent.set',
      title: 'Set accent color',
      description: 'Change the application accent color.',
      phrases: ['use blue accent', 'set accent to green', 'change accent color'],
      keywords: ['accent', 'color', 'blue', 'green', 'amber', 'red', 'purple', 'appearance'],
      parameters: {
        value: {
          label: 'Accent color',
          options: ['charcoal', 'blue', 'green', 'amber', 'red', 'purple'] as const,
        },
      },
      run: ({ value }) => {
        const accentMap = {
          charcoal: '#111827',
          blue: '#3b82f6',
          green: '#10b981',
          amber: '#f59e0b',
          red: '#ef4444',
          purple: '#8b5cf6',
        } as const
        if (typeof value === 'string' && value in accentMap) {
          actions.setAccent(accentMap[value as keyof typeof accentMap])
          actions.navigate('/settings/appearance')
        }
      },
    },
    {
      id: 'settings.notifications.email.set',
      title: 'Set email notifications',
      description: 'Turn email notifications on or off.',
      phrases: ['turn on email notifications', 'disable email alerts', 'change email notifications'],
      keywords: ['email', 'notifications', 'alerts', 'enable', 'disable'],
      parameters: {
        value: {
          label: 'Email notifications',
          options: ['on', 'off'] as const,
        },
      },
      run: ({ value }) => {
        if (value === 'on' || value === 'off') {
          actions.setEmailNotifications(value === 'on')
          actions.navigate('/settings/notifications')
        }
      },
    },
    {
      id: 'settings.notifications.push.set',
      title: 'Set push notifications',
      description: 'Turn push notifications on or off.',
      phrases: ['turn on push notifications', 'disable push alerts', 'change push notifications'],
      keywords: ['push', 'notifications', 'alerts', 'enable', 'disable'],
      parameters: {
        value: {
          label: 'Push notifications',
          options: ['on', 'off'] as const,
        },
      },
      run: ({ value }) => {
        if (value === 'on' || value === 'off') {
          actions.setPushNotifications(value === 'on')
          actions.navigate('/settings/notifications')
        }
      },
    },
    {
      id: 'settings.general.language.set',
      title: 'Set default language',
      description: 'Change the workspace default language.',
      phrases: ['switch language to german', 'use english by default', 'change default language'],
      keywords: ['language', 'english', 'german', 'spanish', 'general', 'workspace'],
      parameters: {
        value: {
          label: 'Default language',
          options: ['english', 'german', 'spanish'] as const,
        },
      },
      run: ({ value }) => {
        const languageMap = {
          english: 'en',
          german: 'de',
          spanish: 'es',
        } as const
        if (typeof value === 'string' && value in languageMap) {
          actions.setDefaultLanguage(languageMap[value as keyof typeof languageMap])
          actions.navigate('/settings/general')
        }
      },
    },
    ...routeCommands,
  ]
}
