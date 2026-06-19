import { useMemo } from 'react'
import {
  IntentCommandPalette,
  IntentProvider,
  IntentVoiceButton,
  defineIntents,
} from 'react-router-ai'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'

const intents = defineIntents([
  {
    id: 'settings.profile',
    type: 'navigation',
    title: 'Edit profile',
    description: 'Open profile settings to update display name, avatar, and bio.',
    phrases: ['edit my profile', 'change my avatar', 'update my name'],
    keywords: ['profile', 'avatar', 'name'],
    to: '/settings/profile',
  },
  {
    id: 'settings.security.password',
    type: 'navigation',
    title: 'Change password',
    description: 'Open account security settings to change or reset the password.',
    phrases: ['change my password', 'reset password', 'update password'],
    keywords: ['password', 'security', 'login'],
    to: '/settings/security/password',
  },
  {
    id: 'settings.billing',
    type: 'navigation',
    title: 'Billing settings',
    description: 'Manage subscription, invoices, and payment methods.',
    phrases: ['manage subscription', 'open billing', 'change payment method'],
    keywords: ['billing', 'subscription', 'payment'],
    to: '/settings/billing',
  },
  {
    id: 'settings.notifications',
    type: 'navigation',
    title: 'Notification settings',
    description: 'Choose email digests, push alerts, and quiet hours.',
    phrases: ['notification settings', 'change email alerts', 'quiet hours'],
    keywords: ['notifications', 'alerts', 'email'],
    to: '/settings/notifications',
  },
])

const navItems = [
  { label: 'Profile', to: '/settings/profile' },
  { label: 'Password', to: '/settings/security/password' },
  { label: 'Billing', to: '/settings/billing' },
  { label: 'Notifications', to: '/settings/notifications' },
]

function Page({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <section className="page">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="description">{description}</p>
    </section>
  )
}

function Shell() {
  const navigate = useNavigate()
  const location = useLocation()

  const currentLabel = useMemo(() => {
    return navItems.find((item) => item.to === location.pathname)?.label ?? 'Settings'
  }, [location.pathname])

  return (
    <IntentProvider intents={intents} onNavigate={(match) => navigate(match.intent.to)}>
      <div className="app-shell">
        <header className="hero">
          <div>
            <p className="eyebrow">Navigation by intent</p>
            <h1>Find buried settings by asking for them</h1>
            <p className="hero-copy">
              This demo keeps routes explicit and deterministic. Users can type or speak what
              they need, and the library routes them to the right screen.
            </p>
          </div>
          <div className="hero-actions">
            <IntentCommandPalette placeholder="Try: change my password" submitLabel="Route" />
            <IntentVoiceButton idleLabel="Speak query" listeningLabel="Listening" />
          </div>
        </header>

        <main className="workspace">
          <aside className="sidebar">
            <p className="sidebar-title">Settings</p>
            <nav>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <section className="content">
            <div className="breadcrumbs">Current screen: {currentLabel}</div>
            <Routes>
              <Route
                path="/"
                element={
                  <Page
                    eyebrow="Demo"
                    title="Settings home"
                    description="Use the command palette or sidebar to move through nested settings."
                  />
                }
              />
              <Route
                path="/settings/profile"
                element={
                  <Page
                    eyebrow="Profile"
                    title="Edit profile"
                    description="Update your display name, avatar, biography, and public profile details."
                  />
                }
              />
              <Route
                path="/settings/security/password"
                element={
                  <Page
                    eyebrow="Security"
                    title="Change password"
                    description="Rotate your password, review recent logins, and enforce a stronger sign-in flow."
                  />
                }
              />
              <Route
                path="/settings/billing"
                element={
                  <Page
                    eyebrow="Billing"
                    title="Manage subscription"
                    description="Update your payment method, download invoices, and change your plan."
                  />
                }
              />
              <Route
                path="/settings/notifications"
                element={
                  <Page
                    eyebrow="Notifications"
                    title="Notification settings"
                    description="Tune digests, delivery channels, and quiet hours for each workspace."
                  />
                }
              />
            </Routes>
          </section>
        </main>
      </div>
    </IntentProvider>
  )
}

export default function App() {
  return <Shell />
}
