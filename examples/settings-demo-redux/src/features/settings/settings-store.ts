import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'

export type AppTheme = 'light' | 'dark' | 'system'
export type AppDensity = 'comfortable' | 'compact'
export type AppAccent = '#111827' | '#3b82f6' | '#10b981' | '#f59e0b' | '#ef4444' | '#8b5cf6'
export type AppLanguage = 'en' | 'de' | 'es'
export type RecorderStyle = 'default' | 'workspace' | 'minimal' | 'none'

type SettingsState = {
  theme: AppTheme
  density: AppDensity
  accent: AppAccent
  emailNotifications: boolean
  pushNotifications: boolean
  defaultLanguage: AppLanguage
  isPublicProfile: boolean
  transcription: boolean
  coaching: boolean
  slackNotifications: boolean
  digest: boolean
  quietHours: boolean
  webhooks: boolean
  sso: boolean
  mfa: boolean
  audit: boolean
  recorderName: string
  recorderStyle: RecorderStyle
}

const initialState: SettingsState = {
  theme: 'system',
  density: 'comfortable',
  accent: '#111827',
  emailNotifications: true,
  pushNotifications: false,
  defaultLanguage: 'en',
  isPublicProfile: true,
  transcription: true,
  coaching: false,
  slackNotifications: true,
  digest: true,
  quietHours: false,
  webhooks: true,
  sso: false,
  mfa: false,
  audit: true,
  recorderName: 'Notetaker',
  recorderStyle: 'default',
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<AppTheme>) {
      state.theme = action.payload
    },
    setDensity(state, action: PayloadAction<AppDensity>) {
      state.density = action.payload
    },
    setAccent(state, action: PayloadAction<AppAccent>) {
      state.accent = action.payload
    },
    setEmailNotifications(state, action: PayloadAction<boolean>) {
      state.emailNotifications = action.payload
    },
    setPushNotifications(state, action: PayloadAction<boolean>) {
      state.pushNotifications = action.payload
    },
    setDefaultLanguage(state, action: PayloadAction<AppLanguage>) {
      state.defaultLanguage = action.payload
    },
    setIsPublicProfile(state, action: PayloadAction<boolean>) {
      state.isPublicProfile = action.payload
    },
    setTranscription(state, action: PayloadAction<boolean>) {
      state.transcription = action.payload
    },
    setCoaching(state, action: PayloadAction<boolean>) {
      state.coaching = action.payload
    },
    setSlackNotifications(state, action: PayloadAction<boolean>) {
      state.slackNotifications = action.payload
    },
    setDigest(state, action: PayloadAction<boolean>) {
      state.digest = action.payload
    },
    setQuietHours(state, action: PayloadAction<boolean>) {
      state.quietHours = action.payload
    },
    setWebhooks(state, action: PayloadAction<boolean>) {
      state.webhooks = action.payload
    },
    setSso(state, action: PayloadAction<boolean>) {
      state.sso = action.payload
    },
    setMfa(state, action: PayloadAction<boolean>) {
      state.mfa = action.payload
    },
    setAudit(state, action: PayloadAction<boolean>) {
      state.audit = action.payload
    },
    setRecorderName(state, action: PayloadAction<string>) {
      state.recorderName = action.payload
    },
    setRecorderStyle(state, action: PayloadAction<RecorderStyle>) {
      state.recorderStyle = action.payload
    },
  },
})

export const settingsActions = settingsSlice.actions

export const store = configureStore({
  reducer: {
    settings: settingsSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
