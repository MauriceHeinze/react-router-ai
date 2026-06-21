# Voice Control API Design

The current API is command-first:

```txt
speech/text -> match/rank -> typed command -> app-owned execution
```

The library owns:

- Speech and text input (search field + AI chat input).
- The search/AI mode toggle and dialog shell.
- Matching, ranking, ambiguity handling, and optional LLM fallback.
- Command palette, voice button, chat window, clarification, no-match, and confirmation UI.
- Typed command metadata and the approval gate.

The app owns:

- State mutation.
- Routing.
- Redux dispatches.
- Persistence.
- Business rules and side effects.

## Stable Public Surface

```tsx
<AICommand.Root
  matcher={matcher}
  onContactSupport={handleSupport}
  maxVisibleItems={8}
  maxMatcherCandidates={50}
  initialMode="search"
/>
```

Provides matching, execution, voice input, mode state, chat state, candidate state, and local command registration.

`matcher` is an `AICommandMatcher` that resolves a user query into one of `execute`, `clarify`, or `no-match` (see below). For OpenAI Chat Completions integrations, use `createOpenAICommandMatcher(...)`.

```tsx
<AICommand.Dialog />
<AICommand.ModeToggle />
<AICommand.Input />
<AICommand.List />
<AICommand.Item />
<AICommand.Empty />
<AICommand.Loading />
<AICommand.Error />
<AICommand.VoiceButton />
<AICommand.Confirmation />
<AICommand.Chat />
<AICommand.ChatMessage />
<AICommand.ChatInput />
<AICommand.Clarification />
<AICommand.NoMatch />
```

Headless UI primitives with `className`/`style` pass-through. The host app owns the styling; the library only adds minimal inline layout styles where required for behavior (e.g. confirmation buttons, chat candidate lists).

## Modes

The dialog has two modes controlled by `AICommand.ModeToggle`:

- **Search mode** uses Fuse.js fuzzy matching over the registered command catalog. Typing filters and ranks; Enter runs the top match; the mic fills the search field and submits.
- **AI mode** is a chat window. Each user message is sent (single-shot, no conversation history) to the configured matcher. The library renders the assistant response, including inline candidate buttons when the matcher returns `clarify`. Switching from search to AI seeds the chat input with the current search query; switching back seeds the search query from the chat input. In AI mode, the mic fills the chat input without submitting.

## Command Shape

```ts
{
  id: string
  value: string
  keywords?: readonly string[]
  description?: string
  disabled?: boolean
  confirmation?: boolean | string
  onSelect: () => void | Promise<void>
}
```

`onSelect` is app-owned: it can `setState`, `dispatch`, `navigate`, call services, or anything else. `confirmation` pauses risky commands until the user confirms in `AICommand.Confirmation`.

## AI Matcher Result

The `AICommandMatcher` returns a discriminated result so the library can drive clarify/execute/no-match without guessing:

```ts
type AICommandMatcherResult =
  | { kind: "execute"; item: AICommandItem; needsApproval?: boolean; message?: string }
  | { kind: "clarify"; candidates: AICommandItem[]; message?: string }
  | { kind: "no-match"; message?: string }
  | null
```

- **execute** (one match): runs `item.onSelect()`. If `needsApproval` or `item.confirmation` is set, the library shows the confirmation flow first.
- **clarify** (multiple matches): renders `AICommand.Clarification` and attaches the candidates to the assistant chat message. Selecting a candidate runs the approval/execute flow.
- **no-match** (zero matches): renders `AICommand.NoMatch` with a rephrase prompt and an optional "Contact support" button when `onContactSupport` is provided to `AICommand.Root`.

This is a **breaking change** from the previous matcher contract, which returned a single `AICommandItem | null`. Existing matchers must be updated to return the new discriminated shape.

## Matching Rules

- Search mode uses Fuse.js fuzzy matching as the first pass (keys: `value`, `keywords`, `description`).
- AI mode sends the user's message to the matcher directly; Fuse is not consulted.
- When the matcher returns multiple matches, the library shows candidates instead of guessing.
- When the matcher returns zero matches, the library shows a no-match state with a rephrase prompt and optional support contact.
- Risky actions are gated by `confirmation` on the command, or by `needsApproval` on the matcher result.

## Example

```tsx
const commands: AICommandItem[] = [
  {
    id: "theme.set",
    value: "Set theme",
    keywords: ["dark mode", "light mode", "appearance"],
    onSelect: () => dispatch(settingsActions.setTheme("dark")),
  },
  {
    id: "checkout.confirmOrder",
    value: "Confirm order",
    keywords: ["place order", "checkout"],
    confirmation: "Place this order?",
    onSelect: () => checkoutService.confirmOrder(),
  },
];

const matcher = createOpenAICommandMatcher({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  pageContext: () => "Checkout (/checkout)",
});
```

## Design Constraints

- Commands are explicit and typed.
- State access only happens through app-owned `onSelect` callbacks.
- No React internals inspection.
- No Redux slice inference.
- No DOM-click execution model.
- No generic resource abstraction in v1.

## Integration Guidance

For simple apps, define a handful of explicit commands near the app shell.

For settings-heavy flows, derive commands from the same field metadata used by the UI, keeping `onSelect` as explicit `dispatch`/`setState`/`navigate` calls.

For Redux, keep selectors and actions explicit:

```ts
onSelect: () => dispatch(settingsActions.setTheme(value))
```

For complex apps, prefer command modules such as:

- `navigationCommands`
- `productSearchCommands`
- `productFilterCommands`
- `cartCommands`
- `checkoutCommands`

Wire `onContactSupport` on `AICommand.Root` to your support channel (mailto, Intercom, Zendesk, etc.) so the no-match state can offer it without the library owning contact configuration.
