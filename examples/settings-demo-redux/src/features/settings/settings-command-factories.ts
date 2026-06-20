import type { VoiceCommand } from 'react-router-ai'
import type { SettingsRoute } from './settings-routes.ts'

export function createNavigationCommand(route: SettingsRoute, navigate: (to: string) => void): VoiceCommand {
  return {
    id: route.id,
    title: route.title,
    description: route.description,
    phrases: route.phrases ?? [route.label.toLowerCase()],
    keywords: route.label.toLowerCase().split(' '),
    highlight: {
      targetId: route.id,
      kind: 'navigation',
    },
    run: () => navigate(route.path),
  }
}

export function createNavigationCommands(routes: SettingsRoute[], navigate: (to: string) => void): VoiceCommand[] {
  return routes.map((route) => createNavigationCommand(route, navigate))
}

export function createHomeCommand(navigate: (to: string) => void): VoiceCommand {
  return {
    id: 'home',
    title: 'Home',
    description: 'Go back to the landing page.',
    phrases: ['go home', 'home page', 'landing page', 'back to home'],
    keywords: ['home', 'landing', 'start'],
    run: () => navigate('/'),
  }
}
