import type { AICommandItem } from 'react-router-ai'
import { createHomeCommand, createNavigationCommands } from './settings-command-factories.ts'
import { createSettingsCommands } from './settings-fields.ts'
import type { SettingsRoute } from './settings-routes.ts'
import type { AppDispatch } from './settings-store.ts'

type DefineSettingsCommandsOptions = {
  dispatch: AppDispatch
  navigate: (to: string) => void
}

export function defineSettingsCommands(routes: SettingsRoute[], options: DefineSettingsCommandsOptions): AICommandItem[] {
  const { dispatch, navigate } = options

  return [
    createHomeCommand(navigate),
    ...createSettingsCommands({ dispatch, navigate }),
    ...createNavigationCommands(routes, navigate),
  ]
}
