# react-router-ai

`react-router-ai` is a React library for mapping free-form text or speech to typed app commands, with a built-in search/AI mode toggle and chat-style LLM fallback.

This repo ships:

- a publishable `react-router-ai` package
- a Redux settings demo (`examples/settings-demo-redux`) showing integration with the toggle, chat, clarification, and approval flows

See [Voice Control API Design](./docs/voice-control-api.md) for the command-oriented API direction and integration guidance.

## Quick example

```tsx
import {
  AICommand,
  AICommandRoot,
  createOpenAICommandMatcher,
  type AICommandItem,
} from "react-router-ai";

const commands: AICommandItem[] = [
  {
    id: "theme.set",
    value: "Set theme",
    keywords: ["dark mode", "light mode", "appearance"],
    onSelect: () => setTheme("dark"),
  },
  {
    id: "settings.billing.open",
    value: "Open billing",
    keywords: ["subscription", "invoice"],
    confirmation: "Switch to billing?",
    onSelect: () => navigate("/settings/billing"),
  },
];

const openAiCommandMatcher = createOpenAICommandMatcher({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  pageContext: () => `Settings > Billing (/settings/billing)`,
});

function AppShell() {
  return (
    <AICommand.Root
      matcher={openAiCommandMatcher}
      maxVisibleItems={8}
      onContactSupport={() => (window.location.href = "mailto:support@example.com")}
    >
      <AICommand.Dialog open>
        <AICommand.ModeToggle />
        {mode === "search" ? (
          <>
            <AICommand.Input autoFocus voiceShortcut="tab" placeholder="Search..." />
            <AICommand.List>
              {commands.map((cmd) => (
                <AICommand.Item key={cmd.id} {...cmd}>
                  {cmd.value}
                </AICommand.Item>
              ))}
            </AICommand.List>
            <AICommand.Empty>No matches.</AICommand.Empty>
          </>
        ) : (
          <>
            <AICommand.Chat>
              {chatMessages.map((m) => (
                <AICommand.ChatMessage key={m.id} message={m} />
              ))}
              <AICommand.Clarification />
              <AICommand.NoMatch />
            </AICommand.Chat>
            <AICommand.ChatInput voiceShortcut="tab" placeholder="Ask AI..." />
          </>
        )}
        <AICommand.Confirmation />
        <AICommand.VoiceButton />
      </AICommand.Dialog>
    </AICommand.Root>
  );
}
```

## Modes

The dialog toggles between two modes via `AICommand.ModeToggle`:

- **Search mode** uses [Fuse.js](https://fusejs.io/) fuzzy matching against the registered `AICommandItem` list. Typing filters and ranks the list; Enter runs the top match.
- **AI mode** is a chat window. Each user message is sent (single-shot, no conversation history) to the configured `matcher`. Switching from search to AI seeds the chat input with the current search query; switching back seeds the search query from the chat input.

The mic button and `voiceShortcut="tab"` work in both modes. In **search mode**, a transcript fills the search field and submits. In **AI mode**, the transcript fills the chat input without submitting, so the user can review before sending.

## AI matcher contract

The `AICommandMatcher` returns a discriminated result so the library can drive clarify/execute/no-match without guessing:

```ts
type AICommandMatcherResult =
  | { kind: "execute"; item: AICommandItem; needsApproval?: boolean; message?: string }
  | { kind: "clarify"; candidates: AICommandItem[]; message?: string }
  | { kind: "no-match"; message?: string }
  | null;
```

- **execute** (one match): runs `item.onSelect()`. If `needsApproval` or `item.confirmation` is set, the library shows `AICommand.Confirmation` first.
- **clarify** (multiple matches): renders `AICommand.Clarification` with clickable candidates; selecting one runs the approval/execute flow.
- **no-match** (zero matches): renders `AICommand.NoMatch` with a rephrase prompt and an optional "Contact support" button when `onContactSupport` is provided to `AICommand.Root`.

## Command shape

```ts
type AICommandItem = {
  id: string;
  value: string;
  keywords?: readonly string[];
  description?: string;
  disabled?: boolean;
  confirmation?: boolean | string;
  onSelect: () => void | Promise<void>;
};
```

`onSelect` stays app-owned, so commands can call `setState`, `dispatch`, `navigate`, or service functions directly. `confirmation` pauses risky commands until the user confirms; the AI matcher can also flag `needsApproval` at resolution time.

## OpenAI matcher

`createOpenAICommandMatcher(...)` is a first-party matcher that calls OpenAI Chat Completions. It defaults to `gpt-5-nano` with `reasoning_effort: "minimal"`, accepts page context as a string or callback, and returns `execute`, `clarify`, or `no-match` based on the model's `matches` array. Pass `pageContext` with a string like `Settings > Billing (/settings/billing)` so the model knows where the user is.

`AICommand.Root` also accepts `maxVisibleItems` to cap the rendered search results without breaking keyboard navigation, and `maxMatcherCandidates` to cap the command catalog sent to the matcher.

## Development

```bash
npx pnpm@10.12.4 install
npx pnpm@10.12.4 build
npx pnpm@10.12.4 test
```
