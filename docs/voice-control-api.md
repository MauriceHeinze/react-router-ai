# Voice Control API Design

The current API is command-first:

```txt
speech/text -> match/rank -> typed command -> app-owned execution
```

The library owns:

- Speech and text input.
- Matching, ranking, ambiguity handling, and optional LLM fallback.
- Command palette and voice button UI.
- Typed command metadata and confirmation flow.

The app owns:

- State mutation.
- Routing.
- Redux dispatches.
- Persistence.
- Business rules and side effects.

## Stable Public Surface

```ts
defineVoiceCommands(commands)
```

Defines explicit app commands.

```ts
defineVoiceFieldCommands(fields, options?)
```

Defines settings-style field controls and compiles them into explicit app commands.

```tsx
<VoiceProvider commands={commands} />
```

Provides matching, execution, voice input, and local command registration.

`llmFallback.match(query, commands)` can replace the built-in browser `LanguageModel` fallback with an app-owned remote matcher.

Both the built-in fallback and custom matchers can receive explicit page context from the host app. Pass a string such as `Settings > Billing (/settings/billing)` via `llmFallback.pageContext` or your own matcher options so the model can see the current page without the library inferring it.

For OpenAI Chat Completions integrations, the package can provide that callback via `createOpenAiVoiceCommandMatcher(...)`, which defaults to `reasoning_effort: "none"`.

```ts
useVoiceCommand(command)
```

Registers a mounted component-local command with the nearest provider.

```tsx
<VoiceWidget />
```

Self-contained floating assistant with an orb trigger and command dialog.

```tsx
<VoiceCommandPalette />
<VoiceButton />
```

Lower-level UI primitives for text and voice input when you need a custom layout.

## Command Shape

```ts
{
  id: string
  title: string
  description?: string
  phrases?: string[]
  parameters?: {
    [key: string]: {
      label: string
      description?: string
      options?: readonly string[]
      type?: "string" | "number" | "boolean"
    }
  }
  confirmation?: boolean | string
  read?: () => unknown
  run: (args, context) => void | Promise<void>
}
```

## Example

```tsx
const themeOptions = ["light", "dark", "system"] as const;

const commands = defineVoiceCommands([
  {
    id: "theme.set",
    title: "Set theme",
    description: "Change the application theme.",
    phrases: ["switch theme", "use light mode", "turn on dark mode"],
    parameters: {
      value: {
        label: "Theme",
        options: themeOptions,
      },
    },
    read: () => selectTheme(store.getState()),
    run: ({ value }) => dispatch(settingsActions.setTheme(value)),
  },
  {
    id: "checkout.confirmOrder",
    title: "Confirm order",
    phrases: ["place the order", "confirm checkout"],
    confirmation: "Place this order?",
    run: () => checkoutService.confirmOrder(),
  },
]);
```

## Matching Rules

- Fuzzy matching is the first pass.
- Parameter extraction prefers app-owned option arrays instead of hand-written schemas.
- Number and boolean parameters can be inferred from the query text.
- When multiple commands are close, the provider returns candidates instead of guessing.
- If fuzzy matching misses, the optional built-in `LanguageModel` fallback can return a command id and parameter object.
- Apps can override the fallback with `llmFallback.match(...)` and call their own LLM provider.

## Design Constraints

- Commands are explicit and typed.
- State access only happens through app-owned callbacks like `run` and `read`.
- No React internals inspection.
- No Redux slice inference.
- No DOM-click execution model.
- No generic resource abstraction in v1.

## Integration Guidance

For simple apps, define a handful of explicit commands near the app shell.

For settings-heavy flows, derive parameter options from the same arrays or config used by the UI.

When the app is primarily controlling fields, prefer `defineVoiceFieldCommands(...)` so the app provides explicit field metadata and the library derives ordinary commands from it.

For Redux, keep selectors and actions explicit:

```ts
read: () => selectTheme(store.getState())
run: ({ value }) => dispatch(settingsActions.setTheme(value))
```

For complex apps, prefer command modules such as:

- `navigationCommands`
- `productSearchCommands`
- `productFilterCommands`
- `cartCommands`
- `checkoutCommands`

The package still exports the legacy intent API as a compatibility layer, but the command API is the primary surface.
