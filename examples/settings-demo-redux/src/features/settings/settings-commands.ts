import type { VoiceCommand } from 'react-router-ai'
import { defineVoiceFieldCommands } from 'react-router-ai'
import { createHomeCommand, createNavigationCommands } from './settings-command-factories.ts'
import { createSettingsFields } from './settings-fields.ts'
import type { SettingsRoute } from './settings-routes.ts'
import type { AppDispatch } from './settings-store.ts'

type DefineSettingsCommandsOptions = {
  dispatch: AppDispatch
  navigate: (to: string) => void
}

export function defineSettingsCommands(routes: SettingsRoute[], options: DefineSettingsCommandsOptions): VoiceCommand[] {
  const { dispatch, navigate } = options

  return [
    createHomeCommand(navigate),
    ...defineVoiceFieldCommands(createSettingsFields(dispatch), { navigate }),
    ...createNavigationCommands(routes, navigate),
  ]
}
