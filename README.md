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
        <AICommand.ModeHeader />
        {mode === "search" ? (
          <>
            <AICommand.Input autoFocus modeShortcut="tab" micShortcut="ctrl+m" placeholder="Search..." />
            <AICommand.List>
              {commands.map((cmd) => (
                <AICommand.Item key={cmd.id} {...cmd}>
                  {cmd.value}
                </AICommand.Item>
              ))}
            </AICommand.List>
            <AICommand.Empty>No matches.</AICommand.Empty>
          </>
        ) : mode === "ai" ? (
          <>
            <AICommand.Chat>
              {chatMessages.map((m) => (
                <AICommand.ChatMessage key={m.id} message={m} userLabel="Your Request" />
              ))}
              <AICommand.Clarification />
              <AICommand.NoMatch />
            </AICommand.Chat>
            <AICommand.ChatInput modeShortcut="tab" micShortcut="ctrl+m" placeholder="Ask AI..." />
          </>
        ) : (
          <>
            <AICommand.Chat>
              {chatMessages.map((m) => (
                <AICommand.ChatMessage key={m.id} message={m} userLabel="Your Request" />
              ))}
              <AICommand.Clarification />
              <AICommand.NoMatch />
            </AICommand.Chat>
            <AICommand.VoiceWaveform />
          </>
        )}
        <AICommand.Confirmation />
        <AICommand.VoiceButton />
      </AICommand.Dialog>
    </AICommand.Root>
  );
}
```

## Drop-in `CommandDialog`

For apps that want a ready-made command palette without wiring the primitives by hand, use `CommandDialog`:

```tsx
import { AICommandRoot, CommandDialog, type AICommandItem } from "react-router-ai";

const commands: AICommandItem[] = [
  { id: "settings", value: "Open settings", onSelect: () => navigate("/settings") },
];

function AppShell() {
  const [open, setOpen] = useState(false);

  return (
    <AICommandRoot>
      <CommandDialog open={open} onOpenChange={setOpen} items={commands} />
    </AICommandRoot>
  );
}
```

`CommandDialog` renders the same search, AI chat, and voice layouts as the settings demo. It emits stable part attributes (`ai-command-dialog`, `ai-command-dialog-search`, `ai-command-dialog-chat-panel`, etc.) so you can style it with your own CSS. It also accepts optional `icons`, `labels`, `renderItem`, and Weaviate route props for customization.

## Parts and styling

Every `AICommand.*` primitive and every structural element inside `CommandDialog` exposes a stable part attribute. Style them with attribute selectors the same way you would style cmdk parts.

### Primitive attributes

These attributes are rendered by the `AICommand` primitives:

- `ai-command-dialog`
- `ai-command-input`
- `ai-command-list`
- `ai-command-item`
- `ai-command-empty`
- `ai-command-loading`
- `ai-command-error`
- `ai-command-voice-button`
- `ai-command-confirmation`
- `ai-command-mode-header`
- `ai-command-chat`
- `ai-command-chat-input`
- `ai-command-chat-message`
- `ai-command-clarification`
- `ai-command-clarification-item`
- `ai-command-no-match`
- `ai-command-voice-waveform`
- `ai-command-voice-empty-prompt`
- `ai-command-chat-empty-prompt`
- `ai-command-weaviate-routes`

Selected items carry `data-selected="true"`. Chat messages carry `data-role="user"` or `data-role="assistant"`.

### CommandDialog attributes

These attributes are rendered by the drop-in `CommandDialog` component:

- `ai-command-dialog-overlay`
- `ai-command-dialog`
- `ai-command-dialog-search`
- `ai-command-dialog-search-input-wrap`
- `ai-command-dialog-search-icon`
- `ai-command-dialog-input`
- `ai-command-dialog-body`
- `ai-command-dialog-loader`
- `ai-command-dialog-spinner`
- `ai-command-dialog-error`
- `ai-command-dialog-confirmation`
- `ai-command-dialog-list`
- `ai-command-dialog-item`
- `ai-command-dialog-item-weaviate`
- `ai-command-dialog-item-value`
- `ai-command-dialog-item-description`
- `ai-command-dialog-empty`
- `ai-command-dialog-footer`
- `ai-command-dialog-shortcuts`
- `ai-command-dialog-shortcut`
- `ai-command-dialog-keycap`
- `ai-command-dialog-chat-panel`
- `ai-command-dialog-chat`
- `ai-command-dialog-voice-prompt`
- `ai-command-dialog-chat-message`
- `ai-command-dialog-voice-thinking`
- `ai-command-dialog-thinking`
- `ai-command-dialog-thinking-dots`
- `ai-command-dialog-clarification`
- `ai-command-dialog-no-match`
- `ai-command-dialog-chat-input-wrap`
- `ai-command-dialog-chat-input`
- `ai-command-dialog-chat-mic`
- `ai-command-dialog-voice-controls`
- `ai-command-dialog-audio-wave`
- `ai-command-dialog-audio-wave-renderer`
- `ai-command-dialog-voice-mic`
- `ai-command-dialog-mic-icon`

### Example

```css
[ai-command-dialog-overlay] {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}

[ai-command-dialog] {
  width: min(420px, 100%);
  background: white;
  border-radius: 12px;
}

[ai-command-dialog-item][data-selected="true"] {
  background: rgba(59, 130, 246, 0.1);
}
```

The constants are also exported for type-safe references:

```ts
import { aiCommandAttributes, commandDialogAttributes } from "react-router-ai";

aiCommandAttributes.item; // "ai-command-item"
commandDialogAttributes.input; // "ai-command-dialog-input"
```

## Modes

The dialog cycles through three modes via `AICommand.ModeHeader` (or `modeShortcut="tab"`):

- **Classic Search** filters the registered `AICommandItem` list by simple substring matches against `value`, `keywords`, and `description`. Enter runs the top match.
- **Text Chat** is a chat window. Each user message is sent (single-shot, no conversation history) to the configured `matcher`. Switching from search to text chat seeds the chat input with the current search query; switching back seeds the search query from the chat input.
- **Voice Chat** shows a waveform visualization while listening. It surfaces live interim speech text as you speak, then submits the final transcript to the configured matcher once the browser's speech recognizer detects a pause.

**Tab** (`modeShortcut="tab"`) cycles through the three modes. **Ctrl+M** (`micShortcut="ctrl+m"`) toggles the mic. In **search mode**, a transcript fills the search field and submits. In **text chat**, a transcript fills the chat input without submitting so the user can review it. In **voice chat**, live speech text is shown while listening and the final transcript is submitted automatically.

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
