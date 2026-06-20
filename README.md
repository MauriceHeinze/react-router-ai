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
  VoiceWidget,
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
      <VoiceWidget />
      <App />
    </VoiceProvider>
  );
}
```

`VoiceWidget` is a self-contained floating assistant that includes the orb button and the command dialog shown above. For a custom layout, use the lower-level `VoiceCommandPalette` and `VoiceButton` primitives instead.

Commands and derived field commands can also carry `highlight` metadata. The provider exposes the last executed highlight target through context, so a host app can briefly draw a blue outline around the route, card, or field that changed without the library touching the DOM itself.

The core model is command-first:

- `run` stays app-owned, so commands can call `setState`, `dispatch`, `navigate`, or service functions directly.
- `parameters` support option-derived extraction for values like `light`, `dark`, `system`, or numeric quantities.
- `confirmation` pauses risky commands until the user confirms.
- `useVoiceCommand(command)` lets mounted components register page-local commands when needed.

For settings-heavy apps, `defineVoiceFieldCommands(...)` can derive normal commands from explicit field metadata while keeping reads, writes, and navigation app-owned.

When `llmFallback` is enabled, the library keeps fuzzy matching as the first pass and only tries the browser's built-in `LanguageModel` API if no fuzzy match clears the threshold.

If you want app-owned model routing instead, pass `llmFallback.match(query, commands)`. That callback can send the serialized command catalog to a remote model such as OpenAI `gpt-5-nano` and return one or more `{ commandId, confidence, parameters }` candidates.

If you want the model to know where the user is, pass `llmFallback.pageContext` or `pageContext` to your own matcher with a string like `Settings > Billing (/settings/billing)`.

The package also exports `createOpenAiVoiceCommandMatcher(...)` for a first-party OpenAI Chat Completions matcher. It uses a minimal request shape and defaults to `reasoning_effort: "minimal"` for reasoning-capable GPT-5 models.

## Development

```bash
npx pnpm@10.12.4 install
npx pnpm@10.12.4 build
npx pnpm@10.12.4 test
```
