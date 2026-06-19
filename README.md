# react-router-ai

`react-router-ai` is a React library for mapping free-form text or speech to app navigation intents.

This repo currently ships:

- a publishable `react-router-ai` package
- a settings demo showing how to route users to buried settings pages

## Quick example

```tsx
import {
  IntentProvider,
  IntentCommandPalette,
  IntentVoiceButton,
  defineIntents,
} from "react-router-ai";

const intents = defineIntents([
  {
    id: "settings.security.password",
    type: "navigation",
    title: "Change password",
    phrases: ["change my password", "reset password"],
    to: "/settings/security/password",
  },
]);

function AppShell() {
  return (
    <IntentProvider
      intents={intents}
      onNavigate={(match) => navigate(match.intent.to)}
      llmFallback={{ enabled: true }}
    >
      <IntentCommandPalette />
      <IntentVoiceButton />
      <App />
    </IntentProvider>
  );
}
```

When `llmFallback` is enabled, the library keeps fuzzy matching as the first pass and only tries the browser's built-in `LanguageModel` API if no fuzzy match clears the threshold. This uses the on-device Prompt API when the browser supports it.

## Development

```bash
npx pnpm@10.12.4 install
npx pnpm@10.12.4 build
npx pnpm@10.12.4 test
```
