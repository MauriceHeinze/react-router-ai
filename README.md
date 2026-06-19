# react-router-ai

`react-router-ai` is a React library for mapping free-form text or speech to typed app commands.

This repo currently ships:

- a publishable `react-router-ai` package
- a settings demo showing how to route users to buried settings pages

See [Voice Control API Design](./docs/voice-control-api.md) for the command-oriented API direction and integration guidance.

## Quick example

```tsx
import {
  VoiceProvider,
  VoiceCommandPalette,
  VoiceButton,
  defineVoiceFieldCommands,
  defineVoiceCommands,
} from "react-router-ai";

const themeOptions = ["light", "dark", "system"] as const;

const commands = defineVoiceCommands([
  {
    id: "theme.set",
    title: "Set theme",
    phrases: ["switch theme", "use dark mode", "use light mode"],
    parameters: {
      value: {
        label: "Theme",
        options: themeOptions,
      },
    },
    run: ({ value }) => setTheme(value),
  },
  {
    id: "settings.billing.open",
    title: "Open billing",
    phrases: ["open billing", "manage my subscription"],
    run: () => navigate("/settings/billing"),
  },
]);

function AppShell() {
  return (
    <VoiceProvider commands={commands} llmFallback={{ enabled: true }}>
      <VoiceCommandPalette />
      <VoiceButton />
      <App />
    </VoiceProvider>
  );
}
```

The core model is command-first:

- `run` stays app-owned, so commands can call `setState`, `dispatch`, `navigate`, or service functions directly.
- `parameters` support option-derived extraction for values like `light`, `dark`, `system`, or numeric quantities.
- `confirmation` pauses risky commands until the user confirms.
- `useVoiceCommand(command)` lets mounted components register page-local commands when needed.

For settings-heavy apps, `defineVoiceFieldCommands(...)` can derive normal commands from explicit field metadata while keeping reads, writes, and navigation app-owned.

When `llmFallback` is enabled, the library keeps fuzzy matching as the first pass and only tries the browser's built-in `LanguageModel` API if no fuzzy match clears the threshold.

If you want app-owned model routing instead, pass `llmFallback.match(query, commands)`. That callback can send the serialized command catalog to a remote model such as OpenAI `gpt-realtime-mini` and return one or more `{ commandId, confidence, parameters }` candidates.

## Development

```bash
npx pnpm@10.12.4 install
npx pnpm@10.12.4 build
npx pnpm@10.12.4 test
```
