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

export const personalRoutes: SettingsRoute[] = [
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
]

export const workspaceRoutes: SettingsRoute[] = [
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
]

export const dataRoutes: SettingsRoute[] = [
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

export const routes: SettingsRoute[] = [...personalRoutes, ...workspaceRoutes, ...dataRoutes]

export const sectionLabels: Record<RouteSection, string> = {
  personal: 'Personal',
  workspace: 'Workspace',
  data: 'Data',
}
