import { useState } from 'react'
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
import {
  AvatarUpload,
  Badge,
  Button,
  ButtonGroup,
  Card,
  ColorSwatches,
  DataTable,
  Field,
  Input,
  ProgressBar,
  RadioGroup,
  SectionHeader,
  Select,
  TextArea,
  Toggle,
} from './FormComponents.tsx'
import type { SettingsRoute } from './routes.ts'

type SharedFormProps = {
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

function ProfileForm() {
  const [isPublic, setIsPublic] = useState(true)
  return (
    <>
      <Card>
        <SectionHeader title="Profile information" description="Manage how you appear across the workspace." />
        <AvatarUpload initials="JD" />
        <Field label="Display name">
          <Input defaultValue="Jane Doe" />
        </Field>
        <Field label="Email address">
          <Input type="email" defaultValue="jane@example.com" />
        </Field>
        <Field label="Bio" hint="A short bio visible on your profile.">
          <TextArea defaultValue="Product manager based in Berlin." />
        </Field>
      </Card>
      <Card>
        <SectionHeader title="Visibility" description="Control who can see your profile." />
        <Toggle checked={isPublic} onChange={setIsPublic} label="Make profile visible to everyone" />
        <ButtonGroup>
          <Button>Save profile</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function AppearanceForm({
  theme,
  onThemeChange,
  density,
  onDensityChange,
  accent,
  onAccentChange,
  highlightTargetId,
}: SharedFormProps) {
  return (
    <>
      <Card highlighted={highlightTargetId === 'settings.appearance.theme'}>
        <SectionHeader title="Theme" />
        <RadioGroup
          value={theme}
          onChange={(value) => onThemeChange(value as AppTheme)}
          options={[
            { value: 'light', label: 'Light', description: 'Always use light mode' },
            { value: 'dark', label: 'Dark', description: 'Always use dark mode' },
            { value: 'system', label: 'System', description: 'Follow your device preference' },
          ]}
        />
      </Card>
      <Card highlighted={highlightTargetId === 'settings.appearance.density'}>
        <SectionHeader title="Density" />
        <RadioGroup
          value={density}
          onChange={(value) => onDensityChange(value as AppDensity)}
          options={[
            { value: 'comfortable', label: 'Comfortable', description: 'More spacing between items' },
            { value: 'compact', label: 'Compact', description: 'Fit more on screen' },
          ]}
        />
      </Card>
      <Card highlighted={highlightTargetId === 'settings.appearance.accent'}>
        <SectionHeader title="Accent color" />
        <ColorSwatches
          value={accent}
          onChange={(value) => onAccentChange(value as AppAccent)}
          options={['#111827', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
        />
      </Card>
    </>
  )
}

function EmailCalendarForm() {
  const accounts = [
    { name: 'Google', email: 'jane@example.com', status: 'connected' },
    { name: 'Microsoft Outlook', email: 'jane@work.example', status: 'connected' },
    { name: 'Apple iCloud', email: 'jane@icloud.com', status: 'error' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Connected accounts" description="Link accounts to sync email, events, and contacts." />
        {accounts.map((account) => (
          <div key={account.name} className="account-row">
            <div className="account-info">
              <span className="account-name">{account.name}</span>
              <span className="account-meta">{account.email}</span>
            </div>
            <div className="account-actions">
              <Badge variant={account.status === 'connected' ? 'success' : 'warning'}>{account.status}</Badge>
              <Toggle checked={account.status === 'connected'} onChange={() => {}} />
              <Button variant="secondary">Remove</Button>
            </div>
          </div>
        ))}
        <ButtonGroup>
          <Button>Add account</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function CallIntelligenceForm({
  summaryLength,
  onSummaryLengthChange,
  transcriptRetention,
  onTranscriptRetentionChange,
  highlightTargetId,
}: SharedFormProps) {
  const [transcription, setTranscription] = useState(true)
  const [coaching, setCoaching] = useState(false)
  return (
    <>
      <Card>
        <SectionHeader title="Transcription" description="Convert calls into searchable text." />
        <Toggle checked={transcription} onChange={setTranscription} label="Enable call transcription" />
        <Field label="Transcription language">
          <Select defaultValue="en">
            <option value="en">English</option>
            <option value="de">German</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </Select>
        </Field>
      </Card>
      <Card highlighted={highlightTargetId === 'settings.call-intelligence.summary-length'}>
        <SectionHeader title="Summaries" />
        <Field
          label="Default summary length"
          highlighted={highlightTargetId === 'settings.call-intelligence.summary-length'}
        >
          <Select
            value={summaryLength}
            onChange={(event) => onSummaryLengthChange(event.target.value as AppSummaryLength)}
          >
            <option value="short">Short paragraph</option>
            <option value="bullet">Bullet points</option>
            <option value="detailed">Detailed recap</option>
          </Select>
        </Field>
        <Toggle checked={coaching} onChange={setCoaching} label="Enable coaching insights" />
      </Card>
      <Card highlighted={highlightTargetId === 'settings.call-intelligence.retention'}>
        <SectionHeader title="Data retention" />
        <Field
          label="Keep transcripts for"
          highlighted={highlightTargetId === 'settings.call-intelligence.retention'}
        >
          <Select
            value={transcriptRetention}
            onChange={(event) => onTranscriptRetentionChange(event.target.value as AppRetention)}
          >
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
            <option value="forever">Forever</option>
          </Select>
        </Field>
      </Card>
    </>
  )
}

function StorageAccountsForm() {
  const storages = [
    { name: 'Google Drive', used: '12 GB', total: '15 GB', status: 'connected' },
    { name: 'Dropbox', used: '4 GB', total: '10 GB', status: 'connected' },
    { name: 'OneDrive', used: '-', total: '-', status: 'disconnected' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Workspace storage" description="Total storage across connected providers." />
        <ProgressBar value={42} max={100} label="42 GB of 100 GB used" />
      </Card>
      <Card>
        <SectionHeader title="Connected storage" />
        {storages.map((s) => (
          <div key={s.name} className="connected-row">
            <div className="connected-info">
              <span className="connected-name">{s.name}</span>
              <span className="connected-meta">{s.status === 'connected' ? `${s.used} of ${s.total} used` : 'Not connected'}</span>
            </div>
            <div className="connected-actions">
              <Badge variant={s.status === 'connected' ? 'success' : 'neutral'}>{s.status}</Badge>
              <Toggle checked={s.status === 'connected'} onChange={() => {}} />
              <Button variant="secondary">Configure</Button>
            </div>
          </div>
        ))}
        <ButtonGroup>
          <Button>Add storage</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function ReferForm() {
  return (
    <>
      <Card>
        <SectionHeader title="Invite a team" description="Send an invite and earn workspace credits." />
        <Field label="Email address">
          <Input type="email" placeholder="team@example.com" />
        </Field>
        <ButtonGroup>
          <Button>Send invite</Button>
        </ButtonGroup>
      </Card>
      <Card>
        <SectionHeader title="Referral link" />
        <Field>
          <Input readOnly value="https://app.example.com/r/team-xyz" />
        </Field>
        <Button variant="secondary">Copy link</Button>
      </Card>
      <Card>
        <SectionHeader title="Rewards" />
        <div className="form-row">
          <Field label="Successful referrals">
            <Input readOnly value="3" />
          </Field>
          <Field label="Credits earned">
            <Input readOnly value="$150" />
          </Field>
        </div>
      </Card>
    </>
  )
}

function NotificationsForm({
  emailNotifications,
  onEmailNotificationsChange,
  pushNotifications,
  onPushNotificationsChange,
  digestFrequency,
  onDigestFrequencyChange,
  highlightTargetId,
}: SharedFormProps) {
  const [slack, setSlack] = useState(true)
  const [digest, setDigest] = useState(true)
  const [quiet, setQuiet] = useState(false)
  return (
    <>
      <Card>
        <SectionHeader title="Notification channels" />
        <div
          className={`form-field ${highlightTargetId === 'settings.notifications.email' ? 'highlighted' : ''}`}
        >
          <Toggle
            checked={emailNotifications}
            onChange={onEmailNotificationsChange}
            label="Email notifications"
          />
        </div>
        <div
          className={`form-field ${highlightTargetId === 'settings.notifications.push' ? 'highlighted' : ''}`}
        >
          <Toggle
            checked={pushNotifications}
            onChange={onPushNotificationsChange}
            label="Push notifications"
          />
        </div>
        <div className="form-field">
          <Toggle checked={slack} onChange={setSlack} label="Slack notifications" />
        </div>
      </Card>
      <Card>
        <SectionHeader title="Email digests" />
        <Toggle checked={digest} onChange={setDigest} label="Send me a daily digest" />
        <Field
          label="Digest frequency"
          highlighted={highlightTargetId === 'settings.notifications.digest-frequency'}
        >
          <Select
            value={digestFrequency}
            onChange={(event) => onDigestFrequencyChange(event.target.value as AppDigestFrequency)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="never">Never</option>
          </Select>
        </Field>
      </Card>
      <Card>
        <SectionHeader title="Quiet hours" />
        <Toggle checked={quiet} onChange={setQuiet} label="Enable quiet hours" />
        <div className="form-row">
          <Field label="From">
            <Input type="time" defaultValue="20:00" />
          </Field>
          <Field label="To">
            <Input type="time" defaultValue="08:00" />
          </Field>
        </div>
      </Card>
    </>
  )
}

function SessionsForm() {
  const sessions = [
    { device: 'Chrome on macOS', location: 'Berlin, Germany', lastActive: 'Active now' },
    { device: 'Safari on iPhone', location: 'Berlin, Germany', lastActive: '2 hours ago' },
    { device: 'Firefox on Windows', location: 'Munich, Germany', lastActive: '3 days ago' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Active sessions" description="Devices currently signed in to your account." />
        <DataTable
          columns={[
            { key: 'device', label: 'Device' },
            { key: 'location', label: 'Location' },
            { key: 'lastActive', label: 'Last active' },
            { key: 'action', label: '' },
          ]}
          rows={sessions.map((s) => ({
            ...s,
            action: <Button variant="secondary">Revoke</Button>,
          }))}
        />
        <ButtonGroup>
          <Button variant="danger">Log out all devices</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function GeneralForm({
  defaultLanguage,
  onDefaultLanguageChange,
  timezone,
  onTimezoneChange,
  weekStart,
  onWeekStartChange,
  highlightTargetId,
}: SharedFormProps) {
  return (
    <>
      <Card>
        <SectionHeader title="Workspace details" description="Basic workspace preferences." />
        <Field label="Workspace name">
          <Input defaultValue="Acme Corp" />
        </Field>
        <Field label="Timezone" highlighted={highlightTargetId === 'settings.general.timezone'}>
          <Select value={timezone} onChange={(event) => onTimezoneChange(event.target.value as AppTimezone)}>
            <option value="Europe/Berlin">Europe/Berlin</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
          </Select>
        </Field>
        <Field label="Default language" highlighted={highlightTargetId === 'settings.general.language'}>
          <Select value={defaultLanguage} onChange={(event) => onDefaultLanguageChange(event.target.value as AppLanguage)}>
            <option value="en">English</option>
            <option value="de">German</option>
            <option value="es">Spanish</option>
          </Select>
        </Field>
        <Field label="Week starts on" highlighted={highlightTargetId === 'settings.general.week-start'}>
          <Select value={weekStart} onChange={(event) => onWeekStartChange(event.target.value as AppWeekStart)}>
            <option value="monday">Monday</option>
            <option value="sunday">Sunday</option>
          </Select>
        </Field>
        <ButtonGroup>
          <Button>Save changes</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function MembersForm() {
  const members = [
    { name: 'Jane Doe', role: 'Owner', status: 'Active' },
    { name: 'John Smith', role: 'Admin', status: 'Active' },
    { name: 'Alice Wong', role: 'Member', status: 'Pending' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Workspace members" description="Manage teammates and their access." />
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'role', label: 'Role' },
            { key: 'status', label: 'Status' },
            { key: 'actions', label: '' },
          ]}
          rows={members.map((m) => ({
            ...m,
            status: <Badge variant={m.status === 'Active' ? 'success' : 'warning'}>{m.status}</Badge>,
            actions: (
              <ButtonGroup>
                <Button variant="secondary">Change role</Button>
                <Button variant="danger">Remove</Button>
              </ButtonGroup>
            ),
          }))}
        />
        <ButtonGroup>
          <Button>Invite member</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function PlansForm() {
  return (
    <>
      <Card>
        <SectionHeader title="Current plan" description="You are on the Pro plan." />
        <div className="form-row">
          <Field label="Plan">
            <Input readOnly value="Pro" />
          </Field>
          <Field label="Renewal date">
            <Input readOnly value="Dec 31, 2026" />
          </Field>
        </div>
        <ProgressBar value={65} max={100} label="65 of 100 seats used" />
      </Card>
      <Card>
        <SectionHeader title="Available plans" />
        <div className="plan-grid">
          <div className="plan-card">
            <h3>Starter</h3>
            <p className="plan-price">$0</p>
            <ul>
              <li>Up to 5 members</li>
              <li>Basic reporting</li>
              <li>Email support</li>
            </ul>
            <Button variant="secondary">Downgrade</Button>
          </div>
          <div className="plan-card plan-current">
            <h3>Pro</h3>
            <p className="plan-price">$29/seat</p>
            <ul>
              <li>Unlimited members</li>
              <li>Advanced analytics</li>
              <li>Priority support</li>
            </ul>
            <Button disabled>Current plan</Button>
          </div>
          <div className="plan-card">
            <h3>Enterprise</h3>
            <p className="plan-price">Custom</p>
            <ul>
              <li>SSO & SCIM</li>
              <li>Dedicated success manager</li>
              <li>Custom contracts</li>
            </ul>
            <Button>Contact sales</Button>
          </div>
        </div>
      </Card>
    </>
  )
}

function BillingForm() {
  const invoices = [
    { id: 'INV-001', date: 'Nov 1, 2026', amount: '$290.00', status: 'Paid' },
    { id: 'INV-002', date: 'Oct 1, 2026', amount: '$290.00', status: 'Paid' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Payment method" />
        <div className="form-row">
          <Field label="Card">
            <Input readOnly value="Visa ending in 4242" />
          </Field>
          <Field label="Expiry">
            <Input readOnly value="12/2028" />
          </Field>
        </div>
        <ButtonGroup>
          <Button variant="secondary">Update card</Button>
        </ButtonGroup>
      </Card>
      <Card>
        <SectionHeader title="Billing details" />
        <Field label="Billing email">
          <Input type="email" defaultValue="billing@example.com" />
        </Field>
        <Field label="Billing address">
          <TextArea defaultValue="123 Main St&#10;Berlin, Germany" />
        </Field>
      </Card>
      <Card>
        <SectionHeader title="Invoices" />
        <DataTable
          columns={[
            { key: 'id', label: 'Invoice' },
            { key: 'date', label: 'Date' },
            { key: 'amount', label: 'Amount' },
            { key: 'status', label: 'Status' },
            { key: 'action', label: '' },
          ]}
          rows={invoices.map((inv) => ({
            ...inv,
            status: <Badge variant="success">{inv.status}</Badge>,
            action: <Button variant="secondary">Download</Button>,
          }))}
        />
      </Card>
      <Card>
        <SectionHeader title="Subscription" />
        <Button variant="danger">Cancel subscription</Button>
      </Card>
    </>
  )
}

function DevelopersForm({ webhookEvents, onWebhookEventsChange, highlightTargetId }: SharedFormProps) {
  const keys = [
    { name: 'Production', created: 'Jan 5, 2026', lastUsed: '2 hours ago' },
    { name: 'Staging', created: 'Mar 12, 2026', lastUsed: '3 days ago' },
  ]
  const [webhooks, setWebhooks] = useState(true)
  return (
    <>
      <Card>
        <SectionHeader title="API keys" description="Keys for accessing the API." />
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'created', label: 'Created' },
            { key: 'lastUsed', label: 'Last used' },
            { key: 'actions', label: '' },
          ]}
          rows={keys.map((k) => ({
            ...k,
            actions: (
              <ButtonGroup>
                <Button variant="secondary">Copy</Button>
                <Button variant="secondary">Rotate</Button>
                <Button variant="danger">Revoke</Button>
              </ButtonGroup>
            ),
          }))}
        />
        <ButtonGroup>
          <Button>Create key</Button>
        </ButtonGroup>
      </Card>
      <Card>
        <SectionHeader title="Webhooks" />
        <Toggle checked={webhooks} onChange={setWebhooks} label="Enable webhooks" />
        <Field label="Webhook URL">
          <Input placeholder="https://api.example.com/webhooks" />
        </Field>
        <Field label="Events" highlighted={highlightTargetId === 'settings.developers.webhook-events'}>
          <Select
            value={webhookEvents}
            onChange={(event) => onWebhookEventsChange(event.target.value as AppWebhookEvents)}
          >
            <option value="all">All events</option>
            <option value="record">Record changes</option>
            <option value="user">User events</option>
          </Select>
        </Field>
        <ButtonGroup>
          <Button>Save</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function SecurityForm({ passwordPolicy, onPasswordPolicyChange, highlightTargetId }: SharedFormProps) {
  const [sso, setSso] = useState(false)
  const [mfa, setMfa] = useState(false)
  const logs = [
    { action: 'Password changed', user: 'Jane Doe', time: '2 hours ago' },
    { action: 'MFA enabled', user: 'John Smith', time: '1 day ago' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Authentication" />
        <div className="form-field">
          <Toggle checked={sso} onChange={setSso} label="Enable SSO" />
        </div>
        <div className="form-field">
          <Toggle checked={mfa} onChange={setMfa} label="Require MFA for all members" />
        </div>
        <Field label="Password policy" highlighted={highlightTargetId === 'settings.security.password-policy'}>
          <Select
            value={passwordPolicy}
            onChange={(event) => onPasswordPolicyChange(event.target.value as AppPasswordPolicy)}
          >
            <option value="basic">Basic</option>
            <option value="strong">Strong</option>
            <option value="custom">Custom</option>
          </Select>
        </Field>
      </Card>
      <Card>
        <SectionHeader title="Audit log" />
        <DataTable
          columns={[
            { key: 'action', label: 'Action' },
            { key: 'user', label: 'User' },
            { key: 'time', label: 'Time' },
          ]}
          rows={logs}
        />
      </Card>
    </>
  )
}

function RecordsForm({ recordVisibility, onRecordVisibilityChange, highlightTargetId }: SharedFormProps) {
  const [audit, setAudit] = useState(true)
  return (
    <>
      <Card>
        <SectionHeader title="Record settings" description="Control how records are stored and tracked." />
        <Field
          label="Default visibility"
          highlighted={highlightTargetId === 'settings.records.default-visibility'}
        >
          <Select
            value={recordVisibility}
            onChange={(event) => onRecordVisibilityChange(event.target.value as AppRecordVisibility)}
          >
            <option value="private">Private</option>
            <option value="workspace">Workspace</option>
            <option value="public">Public</option>
          </Select>
        </Field>
        <Field label="History retention">
          <Select defaultValue="forever">
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
            <option value="forever">Forever</option>
          </Select>
        </Field>
        <Toggle checked={audit} onChange={setAudit} label="Keep audit log for record changes" />
        <ButtonGroup>
          <Button>Save</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function SupportRequestsForm() {
  const tickets = [
    { subject: 'Billing question', status: 'Open', updated: '1 day ago' },
    { subject: 'Feature request', status: 'Closed', updated: '1 week ago' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Your requests" />
        <DataTable
          columns={[
            { key: 'subject', label: 'Subject' },
            { key: 'status', label: 'Status' },
            { key: 'updated', label: 'Updated' },
            { key: 'action', label: '' },
          ]}
          rows={tickets.map((t) => ({
            ...t,
            status: <Badge variant={t.status === 'Open' ? 'warning' : 'neutral'}>{t.status}</Badge>,
            action: <Button variant="secondary">View</Button>,
          }))}
        />
      </Card>
      <Card>
        <SectionHeader title="New request" />
        <Field label="Subject">
          <Input placeholder="How do I..." />
        </Field>
        <Field label="Message">
          <TextArea placeholder="Describe your issue or question." />
        </Field>
        <ButtonGroup>
          <Button>Submit request</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function MigrateCrmForm() {
  const mappings = [
    { source: 'Contact', destination: 'Person', status: 'Mapped' },
    { source: 'Account', destination: 'Company', status: 'Mapped' },
    { source: 'Opportunity', destination: 'Deal', status: 'Review needed' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Source CRM" />
        <Field label="Choose source">
          <Select defaultValue="salesforce">
            <option value="salesforce">Salesforce</option>
            <option value="hubspot">HubSpot</option>
            <option value="pipedrive">Pipedrive</option>
            <option value="csv">CSV upload</option>
          </Select>
        </Field>
        <Field label="Connection or file">
          <Input placeholder="API key or file URL" />
        </Field>
        <ButtonGroup>
          <Button variant="secondary">Test connection</Button>
        </ButtonGroup>
      </Card>
      <Card>
        <SectionHeader title="Mapping preview" />
        <DataTable
          columns={[
            { key: 'source', label: 'Source field' },
            { key: 'destination', label: 'Destination field' },
            { key: 'status', label: 'Status' },
          ]}
          rows={mappings.map((m) => ({
            ...m,
            status: <Badge variant={m.status === 'Mapped' ? 'success' : 'warning'}>{m.status}</Badge>,
          }))}
        />
      </Card>
      <Card>
        <Button>Start import</Button>
      </Card>
    </>
  )
}

function ObjectsForm() {
  const objects = [
    { object: 'People', attributes: 24, records: 1240 },
    { object: 'Companies', attributes: 18, records: 340 },
    { object: 'Deals', attributes: 22, records: 89 },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Object types" description="Define the data model for your workspace." />
        <DataTable
          columns={[
            { key: 'object', label: 'Object' },
            { key: 'attributes', label: 'Attributes' },
            { key: 'records', label: 'Records' },
            { key: 'actions', label: '' },
          ]}
          rows={objects.map((o) => ({
            ...o,
            actions: (
              <ButtonGroup>
                <Button variant="secondary">Configure</Button>
              </ButtonGroup>
            ),
          }))}
        />
        <ButtonGroup>
          <Button>Add object</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

const formMap: Record<string, React.FC<SharedFormProps>> = {
  'settings.profile': ProfileForm,
  'settings.appearance': AppearanceForm,
  'settings.email-calendar': EmailCalendarForm,
  'settings.call-intelligence': CallIntelligenceForm,
  'settings.storage': StorageAccountsForm,
  'settings.refer': ReferForm,
  'settings.notifications': NotificationsForm,
  'settings.sessions': SessionsForm,
  'settings.general': GeneralForm,
  'settings.members': MembersForm,
  'settings.plans': PlansForm,
  'settings.billing': BillingForm,
  'settings.developers': DevelopersForm,
  'settings.security': SecurityForm,
  'settings.records': RecordsForm,
  'settings.support': SupportRequestsForm,
  'settings.migrate': MigrateCrmForm,
  'settings.objects': ObjectsForm,
}

export function SettingForm(props: SharedFormProps) {
  const { route } = props
  const Form = formMap[route.id]
  if (!Form) return null
  return <Form {...props} />
}
