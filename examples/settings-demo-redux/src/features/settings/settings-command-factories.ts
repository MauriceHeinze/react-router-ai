import type { AICommandItem } from 'react-router-ai'
import type { SettingsRoute } from './settings-routes.ts'

export function createNavigationCommand(route: SettingsRoute, navigate: (to: string) => void): AICommandItem {
  return {
    id: route.id,
    value: route.title,
    description: route.description,
    keywords: route.phrases ?? [route.label.toLowerCase()],
    onSelect: () => navigate(route.path),
  }
}

export function createNavigationCommands(routes: SettingsRoute[], navigate: (to: string) => void): AICommandItem[] {
  return routes.map((route) => createNavigationCommand(route, navigate))
}

export function createHomeCommand(navigate: (to: string) => void): AICommandItem {
  return {
    id: 'home',
    value: 'Home',
    description: 'Go back to the landing page.',
    keywords: ['home', 'landing', 'start'],
    onSelect: () => navigate('/'),
  }
}
