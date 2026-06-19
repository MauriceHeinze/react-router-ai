import { useMemo, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import type { AppAccent, AppDensity, AppLanguage, AppTheme } from './App.tsx'
import { iconMap, SearchIcon, ChevronLeftIcon, ChevronDownIcon, HelpIcon } from './Icons.tsx'
import CallRecorderPage from './CallRecorderPage.tsx'
import SettingsPage from './SettingsPage.tsx'
import { routes, sectionLabels, type RouteSection } from './routes.ts'
import './SettingsLayout.css'

function getNestedSettingsPath(path: string) {
  return path.replace('/settings/', '')
}

function SidebarNav({ filter }: { filter: string }) {
  const [dataExpanded, setDataExpanded] = useState(true)
  const lowerFilter = filter.trim().toLowerCase()

  const grouped = useMemo(() => {
    const sections: Record<RouteSection, typeof routes> = {
      personal: [],
      workspace: [],
      data: [],
    }
    for (const route of routes) {
      if (!route.label.toLowerCase().includes(lowerFilter)) continue
      sections[route.section].push(route)
    }
    return sections
  }, [lowerFilter])

  function renderItem(route: (typeof routes)[number]) {
    const Icon = iconMap[route.icon]
    return (
      <NavLink
        key={route.path}
        to={route.path}
        className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
      >
        {Icon ? <Icon className="sidebar-link-icon" /> : null}
        <span>{route.label}</span>
      </NavLink>
    )
  }

  return (
    <nav className="sidebar-nav">
      {(['personal', 'workspace'] as RouteSection[]).map((section) =>
        grouped[section].length === 0 ? null : (
          <div key={section} className="sidebar-group">
            <p className="sidebar-group-title">{sectionLabels[section]}</p>
            {grouped[section].map(renderItem)}
          </div>
        )
      )}

      {grouped.data.length === 0 ? null : (
        <div className="sidebar-group">
          <button
            type="button"
            className="sidebar-group-toggle"
            onClick={() => setDataExpanded((v) => !v)}
          >
            <span>{sectionLabels.data}</span>
            <ChevronDownIcon
              className={`sidebar-group-chevron ${dataExpanded ? 'expanded' : ''}`}
            />
          </button>
          {dataExpanded ? grouped.data.map(renderItem) : null}
        </div>
      )}
    </nav>
  )
}

type SettingsLayoutProps = {
  onOpenCommand: () => void
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

function Shell({
  onOpenCommand,
  theme,
  onThemeChange,
  density,
  onDensityChange,
  accent,
  onAccentChange,
  emailNotifications,
  onEmailNotificationsChange,
  pushNotifications,
  onPushNotificationsChange,
  defaultLanguage,
  onDefaultLanguageChange,
}: SettingsLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')

  const currentRoute = useMemo(
    () => routes.find((route) => route.path === location.pathname) ?? routes[0],
    [location.pathname]
  )

  const HeaderIcon = iconMap[currentRoute.icon]

  if (location.pathname === '/settings' || location.pathname === '/settings/') {
    return <Navigate to="/settings/call-recorder" replace />
  }

  return (
    <div className="settings-layout">
      <aside className="settings-sidebar">
        <div className="sidebar-header">
          <button
            className="sidebar-back"
            type="button"
            aria-label="Back"
            onClick={() => navigate('/')}
          >
            <ChevronLeftIcon className="sidebar-back-icon" />
          </button>
          <span className="sidebar-title">Settings</span>
        </div>

        <div className="sidebar-search">
          <SearchIcon className="sidebar-search-icon" />
          <input
            type="text"
            placeholder="Search settings"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <SidebarNav filter={search} />
      </aside>

      <div className="settings-main">
        <header className="settings-topbar">
          <div className="topbar-title">
            {HeaderIcon ? <HeaderIcon className="topbar-icon" /> : null}
            <span>{currentRoute.title}</span>
          </div>
          <button className="topbar-help" type="button" onClick={onOpenCommand}>
            <HelpIcon className="topbar-help-icon" />
            Help
          </button>
        </header>

        <main className="settings-content">
          <Routes>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={getNestedSettingsPath(route.path)}
                element={
                  route.path === '/settings/call-recorder' ? (
                    <CallRecorderPage />
                  ) : (
                    <SettingsPage
                      route={route}
                      theme={theme}
                      onThemeChange={onThemeChange}
                      density={density}
                      onDensityChange={onDensityChange}
                      accent={accent}
                      onAccentChange={onAccentChange}
                      emailNotifications={emailNotifications}
                      onEmailNotificationsChange={onEmailNotificationsChange}
                      pushNotifications={pushNotifications}
                      onPushNotificationsChange={onPushNotificationsChange}
                      defaultLanguage={defaultLanguage}
                      onDefaultLanguageChange={onDefaultLanguageChange}
                    />
                  )
                }
              />
            ))}
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function SettingsLayout(props: SettingsLayoutProps) {
  return <Shell {...props} />
}
