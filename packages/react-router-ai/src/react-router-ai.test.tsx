import { useState } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AICommand,
  AICommandRoot,
  createOpenAICommandMatcher,
  matchItems,
  rankCommandItems,
  useAICommand,
} from "./index";
import type { AICommandItem, AICommandMatcher } from "./types";

afterEach(() => {
  cleanup();
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
});

function renderCommandPalette(props: {
  items?: AICommandItem[];
  matcher?: AICommandMatcher;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  render(
    <AICommandRoot matcher={props.matcher}>
      <AICommand.Dialog open onOpenChange={props.onOpenChange}>
        <AICommand.Input placeholder="Ask anything..." />
        <AICommand.List>
          <AICommand.Item
            id="global.profile"
            value="Open customer profile"
            keywords={["customer", "crm", "account"]}
            onSelect={vi.fn()}
          >
            Open customer profile
          </AICommand.Item>
          {props.items?.map((item) => (
            <AICommand.Item key={item.id} {...item}>
              {item.value}
            </AICommand.Item>
          ))}
        </AICommand.List>
        <AICommand.Empty>No commands found.</AICommand.Empty>
        <AICommand.Error />
        <AICommand.Confirmation />
      </AICommand.Dialog>
    </AICommandRoot>,
  );
}

describe("AICommand registry", () => {
  it("registers mounted items and removes unmounted items", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    function PageCommand() {
      const [mounted, setMounted] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setMounted((value) => !value)}>
            Toggle page
          </button>
          {mounted ? (
            <AICommand.Item
              id="page.invoice"
              value="Create invoice"
              keywords={["billing", "payment"]}
              onSelect={onSelect}
            >
              Create invoice
            </AICommand.Item>
          ) : null}
        </>
      );
    }

    render(
      <AICommandRoot>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List>
            <AICommand.Item
              id="global.profile"
              value="Open customer profile"
              onSelect={vi.fn()}
            >
              Open customer profile
            </AICommand.Item>
            <PageCommand />
          </AICommand.List>
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await waitFor(() => {
      expect(screen.getByText("Open customer profile")).toBeTruthy();
      expect(screen.getByText("Create invoice")).toBeTruthy();
    });

    await user.click(screen.getByRole("button", { name: "Toggle page" }));

    await waitFor(() => expect(screen.queryByText("Create invoice")).toBeNull());
    expect(screen.getByText("Open customer profile")).toBeTruthy();
  });
});

describe("rankCommandItems", () => {
  it("ranks exact value matches highest", () => {
    const items: AICommandItem[] = [
      { id: "a", value: "Open settings", onSelect: vi.fn() },
      { id: "b", value: "Open customer profile", keywords: ["settings"], onSelect: vi.fn() },
    ];
    const ranked = rankCommandItems("open settings", items);
    expect(ranked[0]?.id).toBe("a");
  });

  it("uses keywords when value does not match directly", () => {
    const items: AICommandItem[] = [
      { id: "a", value: "Create invoice", keywords: ["billing"], onSelect: vi.fn() },
      { id: "b", value: "Open dashboard", onSelect: vi.fn() },
    ];
    const ranked = rankCommandItems("billing", items);
    expect(ranked[0]?.id).toBe("a");
  });

  it("ignores disabled commands", () => {
    const items: AICommandItem[] = [
      { id: "a", value: "Open settings", onSelect: vi.fn(), disabled: true },
      { id: "b", value: "Open dashboard", keywords: ["settings"], onSelect: vi.fn() },
    ];
    const ranked = rankCommandItems("settings", items);
    expect(ranked[0]?.id).toBe("b");
  });

  it("returns an empty list for low-confidence queries", () => {
    const items: AICommandItem[] = [
      { id: "a", value: "Open settings", onSelect: vi.fn() },
    ];
    const ranked = rankCommandItems("xyz123 nonsense", items);
    expect(ranked).toHaveLength(0);
  });

  it("matches descriptions when the value does not contain the query", () => {
    const items: AICommandItem[] = [
      {
        id: "a",
        value: "Open settings",
        description: "Manage your account preferences",
        onSelect: vi.fn(),
      },
      { id: "b", value: "Open dashboard", onSelect: vi.fn() },
    ];
    const ranked = rankCommandItems("account preferences", items);
    expect(ranked[0]?.id).toBe("a");
  });

  it("returns all active items with zero confidence for an empty query", () => {
    const items: AICommandItem[] = [
      { id: "a", value: "Open settings", onSelect: vi.fn() },
      { id: "b", value: "Open dashboard", disabled: true, onSelect: vi.fn() },
    ];
    const ranked = rankCommandItems("", items);
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.id).toBe("a");
    expect(ranked[0]?.confidence).toBe(0);
  });
});

describe("matchItems", () => {
  it("returns the best local match when it meets the threshold", async () => {
    const items: AICommandItem[] = [
      { id: "a", value: "Open settings", onSelect: vi.fn() },
      { id: "b", value: "Open dashboard", onSelect: vi.fn() },
    ];
    const match = await matchItems("open settings", items, { threshold: 0.45 });
    expect(match?.item.id).toBe("a");
    expect(match?.source).toBe("local");
  });

  it("returns null when no local match meets the threshold", async () => {
    const items: AICommandItem[] = [
      { id: "a", value: "Open settings", onSelect: vi.fn() },
    ];
    const match = await matchItems("something completely unrelated", items, {
      threshold: 0.45,
    });
    expect(match).toBeNull();
  });

  it("prefers the matcher result over the local best match", async () => {
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue({
      kind: "execute",
      item: {
        id: "b",
        value: "Open billing settings",
        onSelect: vi.fn(),
      },
    });
    const items: AICommandItem[] = [
      { id: "a", value: "Open settings", onSelect: vi.fn() },
      { id: "b", value: "Open billing settings", onSelect: vi.fn() },
    ];
    const match = await matchItems("settings", items, { matcher });
    expect(match?.item.id).toBe("b");
    expect(match?.source).toBe("matcher");
  });

  it("throws when the matcher throws", async () => {
    const matcher = vi.fn<AICommandMatcher>().mockRejectedValue(new Error("model down"));
    const items: AICommandItem[] = [
      { id: "a", value: "Open settings", onSelect: vi.fn() },
    ];
    await expect(matchItems("settings", items, { matcher, threshold: 0.45 })).rejects.toThrow(
      "model down",
    );
  });
});

describe("AICommand matching", () => {
  it("filters the list as the user types", async () => {
    const user = userEvent.setup();
    renderCommandPalette();

    await user.type(screen.getByLabelText("Command query"), "customer");

    expect(screen.getByText("Open customer profile")).toBeTruthy();
    expect(screen.queryByText("Create invoice")).toBeNull();
  });

  it("shows the empty state when nothing matches", async () => {
    const user = userEvent.setup();
    renderCommandPalette();

    await user.type(screen.getByLabelText("Command query"), "xyz123");

    expect(screen.getByText("No commands found.")).toBeTruthy();
  });

  it("limits the number of visible commands when maxVisibleItems is set", async () => {
    render(
      <AICommandRoot maxVisibleItems={2}>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List>
            <AICommand.Item id="a" value="Open settings" onSelect={vi.fn()}>
              Open settings
            </AICommand.Item>
            <AICommand.Item id="b" value="Open billing" onSelect={vi.fn()}>
              Open billing
            </AICommand.Item>
            <AICommand.Item id="c" value="Open members" onSelect={vi.fn()}>
              Open members
            </AICommand.Item>
          </AICommand.List>
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    expect(screen.getByText("Open settings")).toBeTruthy();
    expect(screen.getByText("Open billing")).toBeTruthy();
    expect(screen.queryByText("Open members")).toBeNull();
  });

  it("selects a command by clicking an item", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderCommandPalette({
      items: [{ id: "click.me", value: "Click me", onSelect }],
    });

    await user.click(await screen.findByText("Click me"));

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
  });

  it("selects the active command with Enter", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderCommandPalette({
      items: [{ id: "enter.me", value: "Enter me", onSelect }],
    });

    await user.type(screen.getByLabelText("Command query"), "enter");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
  });

  it("uses arrow keys to move the active selection before Enter", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    renderCommandPalette({
      items: [
        { id: "first", value: "First command", onSelect: first },
        { id: "second", value: "Second command", onSelect: second },
      ],
    });

    await user.type(screen.getByLabelText("Command query"), "command");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(second).toHaveBeenCalledTimes(1));
    expect(first).not.toHaveBeenCalled();
  });

  it("wraps keyboard navigation around the list", async () => {
    const user = userEvent.setup();
    renderCommandPalette({
      items: [
        { id: "first", value: "First command", onSelect: vi.fn() },
        { id: "second", value: "Second command", onSelect: vi.fn() },
      ],
    });

    await user.type(screen.getByLabelText("Command query"), "command");
    await user.keyboard("{ArrowUp}");

    const options = screen.getAllByRole("option");
    expect(options[0]?.getAttribute("aria-selected")).toBe("false");
    expect(options[1]?.getAttribute("aria-selected")).toBe("true");
  });

  it("resets the active item when the query changes", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    renderCommandPalette({
      items: [
        { id: "first", value: "First command", onSelect: first },
        { id: "second", value: "Second command", onSelect: second },
      ],
    });

    const input = screen.getByLabelText("Command query");
    await user.type(input, "second");
    await user.keyboard("{ArrowUp}");
    await user.clear(input);
    await user.type(input, "first");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(first).toHaveBeenCalledTimes(1));
    expect(second).not.toHaveBeenCalled();
  });

  it("closes the dialog with Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderCommandPalette({ onOpenChange });

    await user.type(screen.getByLabelText("Command query"), "customer");
    await user.keyboard("{Escape}");

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});

describe("AICommand execution", () => {
  it("lets the app own navigation via onSelect", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    renderCommandPalette({
      items: [
        {
          id: "navigate.customers",
          value: "Open Acme customer profile",
          onSelect: () => navigate("/customers/acme"),
        },
      ],
    });

    await user.type(screen.getByLabelText("Command query"), "acme");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/customers/acme"));
  });

  it("supports modal and state update callbacks", async () => {
    const user = userEvent.setup();
    const openModal = vi.fn();
    const setState = vi.fn();
    renderCommandPalette({
      items: [
        {
          id: "modal",
          value: "Open invoice modal",
          onSelect: () => {
            openModal();
            setState({ modalOpen: true });
          },
        },
      ],
    });

    await user.type(screen.getByLabelText("Command query"), "invoice modal");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(openModal).toHaveBeenCalledTimes(1);
      expect(setState).toHaveBeenCalledWith({ modalOpen: true });
    });
  });

  it("awaits async app-owned callbacks", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    renderCommandPalette({
      items: [
        {
          id: "async",
          value: "Save and navigate",
          onSelect: async () => {
            await Promise.resolve();
            navigate("/done");
          },
        },
      ],
    });

    await user.type(screen.getByLabelText("Command query"), "save");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/done"));
  });

  it("blocks execution behind confirmation until approved", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderCommandPalette({
      items: [
        {
          id: "delete",
          value: "Delete account",
          confirmation: "Are you sure you want to delete your account?",
          onSelect,
        },
      ],
    });

    await user.type(screen.getByLabelText("Command query"), "delete");
    await user.keyboard("{Enter}");

    expect(onSelect).not.toHaveBeenCalled();
    expect(await screen.findByText("Are you sure you want to delete your account?")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
  });

  it("cancels a pending confirmation", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderCommandPalette({
      items: [
        {
          id: "delete",
          value: "Delete account",
          confirmation: true,
          onSelect,
        },
      ],
    });

    await user.type(screen.getByLabelText("Command query"), "delete");
    await user.keyboard("{Enter}");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull());
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a default confirmation message when confirmation is true", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderCommandPalette({
      items: [
        {
          id: "publish",
          value: "Publish post",
          confirmation: true,
          onSelect,
        },
      ],
    });

    await user.type(screen.getByLabelText("Command query"), "publish");
    await user.keyboard("{Enter}");

    expect(await screen.findByText('Confirm "Publish post"?')).toBeTruthy();
  });

  it("blocks selection by click until confirmation is approved", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderCommandPalette({
      items: [
        {
          id: "archive",
          value: "Archive project",
          confirmation: "Archive this project?",
          onSelect,
        },
      ],
    });

    await user.click(await screen.findByText("Archive project"));

    expect(onSelect).not.toHaveBeenCalled();
    expect(await screen.findByText("Archive this project?")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
  });
});

function SubmitButton({ query }: { query: string }) {
  const ctx = useAICommand();
  return (
    <button type="button" onClick={() => void ctx.submitQuery(query)}>
      Submit
    </button>
  );
}

function AskAIButton({ query }: { query: string }) {
  const ctx = useAICommand();
  return (
    <button type="button" onClick={() => void ctx.submitMatcherQuery(query)}>
      Ask AI
    </button>
  );
}

describe("AICommand custom matcher", () => {
  it("sends the active command catalog to the matcher and executes its selection", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue({
      kind: "execute",
      item: {
        id: "matched",
        value: "Matched command",
        onSelect,
      },
    });

    render(
      <AICommandRoot matcher={matcher}>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List>
            <AICommand.Item id="a" value="Alpha" onSelect={vi.fn()}>
              Alpha
            </AICommand.Item>
            <AICommand.Item id="b" value="Beta" onSelect={vi.fn()}>
              Beta
            </AICommand.Item>
            <AICommand.Item id="matched" value="Matched command" onSelect={onSelect}>
              Matched command
            </AICommand.Item>
          </AICommand.List>
          <AICommand.Error />
          <AskAIButton query="matched" />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Ask AI" }));

    await waitFor(() => expect(matcher).toHaveBeenCalledTimes(1));
    const [, candidates] = matcher.mock.calls[0]!;
    expect(candidates).toHaveLength(3);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("limits matcher candidates via maxMatcherCandidates", async () => {
    const user = userEvent.setup();
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue(null);

    render(
      <AICommandRoot matcher={matcher} maxMatcherCandidates={2}>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List>
            {Array.from({ length: 10 }, (_, index) => (
              <AICommand.Item
                key={index}
                id={`item-${index}`}
                value={`Item ${index}`}
                onSelect={vi.fn()}
              >
                Item {index}
              </AICommand.Item>
            ))}
          </AICommand.List>
          <AICommand.Error />
          <AskAIButton query="item" />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Ask AI" }));

    await waitFor(() => expect(matcher).toHaveBeenCalledTimes(1));
    const [, candidates] = matcher.mock.calls[0]!;
    expect(candidates).toHaveLength(2);
  });

  it("does not fall back to local match when Ask AI returns nothing", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue(null);

    render(
      <AICommandRoot matcher={matcher}>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List>
            <AICommand.Item id="local" value="Local match" onSelect={onSelect}>
              Local match
            </AICommand.Item>
          </AICommand.List>
          <AICommand.Error />
          <AskAIButton query="local match" />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Ask AI" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe('No AI command match found for "local match".');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows the matcher error when Ask AI throws", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const matcher = vi.fn<AICommandMatcher>().mockRejectedValue(new Error("timeout"));

    render(
      <AICommandRoot matcher={matcher}>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List>
            <AICommand.Item id="local" value="Local match" onSelect={onSelect}>
              Local match
            </AICommand.Item>
          </AICommand.List>
          <AICommand.Error />
          <AskAIButton query="local match" />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Ask AI" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("timeout");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows an error when submitQuery finds no matcher or local match", async () => {
    const user = userEvent.setup();
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue(null);

    render(
      <AICommandRoot matcher={matcher}>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List />
          <AICommand.Error />
          <AskAIButton query="nothing matches this" />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Ask AI" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe('No AI command match found for "nothing matches this".');
  });

  it("lets the matcher choose from fallback candidates when local ranking is empty", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue({
      kind: "execute",
      item: {
        id: "billing.support",
        value: "Open billing support",
        onSelect,
      },
    });

    render(
      <AICommandRoot matcher={matcher}>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List>
            <AICommand.Item
              id="billing.support"
              value="Open billing support"
              onSelect={onSelect}
            >
              Open billing support
            </AICommand.Item>
          </AICommand.List>
          <AICommand.Error />
          <AskAIButton query="subscription help" />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Ask AI" }));

    await waitFor(() => expect(matcher).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
  });
});

describe("AICommand voice button", () => {
  it("starts speech recognition when clicked", async () => {
    const user = userEvent.setup();
    const start = vi.fn();
    const Recognition = vi.fn().mockImplementation(() => ({
      lang: "",
      interimResults: false,
      continuous: false,
      onresult: null,
      onerror: null,
      onend: null,
      start,
      stop: vi.fn(),
    }));
    window.SpeechRecognition = Recognition as unknown as typeof window.SpeechRecognition;
    window.webkitSpeechRecognition = Recognition as unknown as typeof window.webkitSpeechRecognition;

    render(
      <AICommandRoot>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List />
          <AICommand.Error />
        </AICommand.Dialog>
        <AICommand.VoiceButton />
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Use voice" }));

    expect(start).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("button", { name: "Listening..." })).toBeTruthy();
  });

  it("submits a transcript through the matcher and executes the AI-selected command", async () => {
    const user = userEvent.setup();
    const localSelect = vi.fn();
    const aiSelect = vi.fn();
    const start = vi.fn();
    const recognitionInstance: {
      current: { onresult: ((event: SpeechRecognitionEvent) => void) | null } | null;
    } = { current: null };
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue({
      kind: "execute",
      item: {
        id: "invoice.ai",
        value: "Create invoice with AI",
        onSelect: aiSelect,
      },
    });

    const Recognition = vi.fn().mockImplementation(() => {
      const recognition = {
        lang: "",
        interimResults: false,
        continuous: false,
        onresult: null as ((event: SpeechRecognitionEvent) => void) | null,
        onerror: null,
        onend: null,
        start,
        stop: vi.fn(),
      };
      recognitionInstance.current = recognition;
      return recognition;
    });
    window.SpeechRecognition = Recognition as unknown as typeof window.SpeechRecognition;
    window.webkitSpeechRecognition = Recognition as unknown as typeof window.webkitSpeechRecognition;

    render(
      <AICommandRoot matcher={matcher}>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List>
            <AICommand.Item id="invoice" value="Create invoice" onSelect={localSelect}>
              Create invoice
            </AICommand.Item>
            <AICommand.Item id="invoice.ai" value="Create invoice with AI" onSelect={aiSelect}>
              Create invoice with AI
            </AICommand.Item>
          </AICommand.List>
          <AICommand.Error />
        </AICommand.Dialog>
        <AICommand.VoiceButton />
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Use voice" }));

    const fakeEvent = {
      results: {
        length: 1,
        0: {
          isFinal: true,
          length: 1,
          0: { transcript: "create invoice" },
        },
      },
    } as unknown as SpeechRecognitionEvent;
    recognitionInstance.current?.onresult?.(fakeEvent);

    await waitFor(() => expect(matcher).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(aiSelect).toHaveBeenCalledTimes(1));
    expect(localSelect).not.toHaveBeenCalled();
  });

  it("reports a controlled error when speech recognition is unavailable", async () => {
    const user = userEvent.setup();

    render(
      <AICommandRoot>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List />
          <AICommand.Error />
        </AICommand.Dialog>
        <AICommand.VoiceButton />
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Use voice" }));

    expect(await screen.findByText("Voice input is not available in this browser.")).toBeTruthy();
  });

  it("reports a controlled error when speech recognition fails to start", async () => {
    const user = userEvent.setup();
    const Recognition = vi.fn().mockImplementation(() => ({
      lang: "",
      interimResults: false,
      continuous: false,
      onresult: null,
      onerror: null,
      onend: null,
      start: () => {
        throw new Error("speech unavailable");
      },
      stop: vi.fn(),
    }));
    window.SpeechRecognition = Recognition as unknown as typeof window.SpeechRecognition;
    window.webkitSpeechRecognition = Recognition as unknown as typeof window.webkitSpeechRecognition;

    render(
      <AICommandRoot>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List />
          <AICommand.Error />
        </AICommand.Dialog>
        <AICommand.VoiceButton />
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Use voice" }));

    expect(await screen.findByText("Voice input failed. Keep typing instead.")).toBeTruthy();
  });

  it("toggles listening off when the voice button is clicked again", async () => {
    const user = userEvent.setup();
    const stop = vi.fn();
    const Recognition = vi.fn().mockImplementation(() => ({
      lang: "",
      interimResults: false,
      continuous: false,
      onresult: null,
      onerror: null,
      onend: null,
      start: vi.fn(),
      stop,
    }));
    window.SpeechRecognition = Recognition as unknown as typeof window.SpeechRecognition;
    window.webkitSpeechRecognition = Recognition as unknown as typeof window.webkitSpeechRecognition;

    render(
      <AICommandRoot>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List />
          <AICommand.Error />
        </AICommand.Dialog>
        <AICommand.VoiceButton />
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Use voice" }));
    await screen.findByRole("button", { name: "Listening..." });

    await user.click(screen.getByRole("button", { name: "Listening..." }));

    expect(stop).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Listening..." })).toBeNull(),
    );
  });

  it("reports a controlled error when recognition emits an error", async () => {
    const user = userEvent.setup();
    const recognitionInstance: {
      current: {
        onresult: ((event: SpeechRecognitionEvent) => void) | null;
        onerror: ((event: Event) => void) | null;
        onend: (() => void) | null;
      } | null;
    } = { current: null };

    const Recognition = vi.fn().mockImplementation(() => {
      const recognition = {
        lang: "",
        interimResults: false,
        continuous: false,
        onresult: null as ((event: SpeechRecognitionEvent) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        onend: null as (() => void) | null,
        start: vi.fn(),
        stop: vi.fn(),
      };
      recognitionInstance.current = recognition;
      return recognition;
    });
    window.SpeechRecognition = Recognition as unknown as typeof window.SpeechRecognition;
    window.webkitSpeechRecognition = Recognition as unknown as typeof window.webkitSpeechRecognition;

    render(
      <AICommandRoot>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List />
          <AICommand.Error />
        </AICommand.Dialog>
        <AICommand.VoiceButton />
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Use voice" }));
    recognitionInstance.current?.onerror?.(new Event("error"));

    expect(await screen.findByText("Voice input failed. Keep typing instead.")).toBeTruthy();
  });

  it("returns the voice button to the idle state when recognition ends", async () => {
    const user = userEvent.setup();
    const recognitionInstance: {
      current: {
        onresult: ((event: SpeechRecognitionEvent) => void) | null;
        onerror: ((event: Event) => void) | null;
        onend: (() => void) | null;
      } | null;
    } = { current: null };

    const Recognition = vi.fn().mockImplementation(() => {
      const recognition = {
        lang: "",
        interimResults: false,
        continuous: false,
        onresult: null as ((event: SpeechRecognitionEvent) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        onend: null as (() => void) | null,
        start: vi.fn(),
        stop: vi.fn(),
      };
      recognitionInstance.current = recognition;
      return recognition;
    });
    window.SpeechRecognition = Recognition as unknown as typeof window.SpeechRecognition;
    window.webkitSpeechRecognition = Recognition as unknown as typeof window.webkitSpeechRecognition;

    render(
      <AICommandRoot>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List />
          <AICommand.Error />
        </AICommand.Dialog>
        <AICommand.VoiceButton />
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Use voice" }));
    await screen.findByRole("button", { name: "Listening..." });

    recognitionInstance.current?.onend?.();

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Listening..." })).toBeNull(),
    );
    expect(screen.getByRole("button", { name: "Use voice" })).toBeTruthy();
  });

  it("starts listening when AICommand.Input uses the ctrl+m mic shortcut", async () => {
    const user = userEvent.setup();
    const start = vi.fn();

    const Recognition = vi.fn().mockImplementation(() => ({
      lang: "",
      interimResults: false,
      continuous: false,
      onresult: null,
      onerror: null,
      onend: null,
      start,
      stop: vi.fn(),
    }));
    window.SpeechRecognition = Recognition as unknown as typeof window.SpeechRecognition;
    window.webkitSpeechRecognition = Recognition as unknown as typeof window.webkitSpeechRecognition;

    render(
      <AICommandRoot>
        <AICommand.Dialog open>
          <AICommand.Input autoFocus micShortcut="ctrl+m" />
          <AICommand.List />
        </AICommand.Dialog>
        <AICommand.VoiceButton />
      </AICommandRoot>,
    );

    await user.keyboard("{Control>}m{/Control}");

    expect(start).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("button", { name: "Listening..." })).toBeTruthy();
  });

  it("stops listening when Ctrl+M is pressed again with the AICommand.Input mic shortcut", async () => {
    const user = userEvent.setup();
    const stop = vi.fn();

    const Recognition = vi.fn().mockImplementation(() => ({
      lang: "",
      interimResults: false,
      continuous: false,
      onresult: null,
      onerror: null,
      onend: null,
      start: vi.fn(),
      stop,
    }));
    window.SpeechRecognition = Recognition as unknown as typeof window.SpeechRecognition;
    window.webkitSpeechRecognition = Recognition as unknown as typeof window.webkitSpeechRecognition;

    render(
      <AICommandRoot>
        <AICommand.Dialog open>
          <AICommand.Input autoFocus micShortcut="ctrl+m" />
          <AICommand.List />
        </AICommand.Dialog>
        <AICommand.VoiceButton />
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Use voice" }));
    await screen.findByRole("button", { name: "Listening..." });
    await user.click(screen.getByLabelText("Command query"));
    await user.keyboard("{Control>}m{/Control}");

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("switches to AI mode when Tab is pressed with modeShortcut='tab'", async () => {
    const user = userEvent.setup();
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue(null);

    function ModeProbe() {
      const ctx = useAICommand();
      return <span data-testid="mode">{ctx.mode}</span>;
    }

    render(
      <AICommandRoot matcher={matcher}>
        <AICommand.Dialog open>
          <AICommand.Input autoFocus modeShortcut="tab" />
          <AICommand.List />
          <ModeProbe />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    expect(screen.getByTestId("mode").textContent).toBe("search");
    await user.type(screen.getByLabelText("Command query"), "hello");
    await user.keyboard("{Tab}");

    await waitFor(() => expect(screen.getByTestId("mode").textContent).toBe("ai"));
  });
});

describe("createOpenAICommandMatcher", () => {
  it("sends a chat completions request and returns the selected command", async () => {
    const onSelect = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  function: {
                    arguments: JSON.stringify({
                      matches: ["settings.billing.open"],
                      message: null,
                      needsApproval: null,
                    }),
                  },
                },
              ],
            },
          },
        ],
      }),
    });
    const matcher = createOpenAICommandMatcher({
      apiKey: "test-key",
      endpoint: "https://example.com/v1/chat/completions",
      model: "gpt-5-nano",
      pageContext: () => "Settings > Billing (/settings/billing)",
      organization: "org_123",
      project: "proj_123",
      headers: {
        "X-Test-Header": "enabled",
      },
      fetch: fetchMock,
    });

    const items: AICommandItem[] = [
      { id: "settings.billing.open", value: "Open billing", onSelect },
      { id: "theme.set", value: "Set theme", onSelect: vi.fn() },
    ];
    const result = await matcher("go to billing", items);

    expect(result?.kind).toBe("execute");
    if (result?.kind === "execute") {
      expect(result.item.id).toBe("settings.billing.open");
    }
    const init = fetchMock.mock.calls[0]?.[1];
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    const headers = init?.headers as Record<string, string> | undefined;
    expect(body?.model).toBe("gpt-5-nano");
    expect(body?.reasoning_effort).toBe("minimal");
    expect(body?.messages?.[0]?.content).toContain("Resolve the user's query");
    expect(body?.messages?.[1]?.content).toContain("Available commands:");
    expect(body?.messages?.[2]?.content).toBe(
      "current_page: Settings > Billing (/settings/billing)\nquery: go to billing",
    );
    expect(body?.tools?.[0]?.function?.name).toBe("resolve_intent");
    expect(body?.tools?.[0]?.function?.parameters?.properties?.matches).toBeTruthy();
    expect(headers?.Authorization).toBe("Bearer test-key");
    expect(headers?.["OpenAI-Organization"]).toBe("org_123");
    expect(headers?.["OpenAI-Project"]).toBe("proj_123");
    expect(headers?.["X-Test-Header"]).toBe("enabled");
  });

  it("returns null when the API response has no tool call", async () => {
    const matcher = createOpenAICommandMatcher({
      apiKey: "test-key",
      endpoint: "https://example.com/v1/chat/completions",
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{}] }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const items: AICommandItem[] = [
      { id: "a", value: "A", onSelect: vi.fn() },
    ];
    const result = await matcher("test", items);
    expect(result).toBeNull();
  });

  it("returns a no-match result when the model explicitly declines to match a command", async () => {
    const matcher = createOpenAICommandMatcher({
      apiKey: "test-key",
      endpoint: "https://example.com/v1/chat/completions",
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  function: {
                    arguments: JSON.stringify({
                      matches: [null],
                      message: "Sorry, I couldn't find anything.",
                    }),
                  },
                },
              ],
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const items: AICommandItem[] = [{ id: "a", value: "A", onSelect: vi.fn() }];
    const result = await matcher("test", items);
    expect(result?.kind).toBe("no-match");
    if (result?.kind === "no-match") {
      expect(result.message).toBe("Sorry, I couldn't find anything.");
    }
  });

  it("returns a clarify result when the model returns multiple command ids", async () => {
    const matcher = createOpenAICommandMatcher({
      apiKey: "test-key",
      endpoint: "https://example.com/v1/chat/completions",
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  function: {
                    arguments: JSON.stringify({
                      matches: ["a", "b"],
                      message: "Which one did you mean?",
                    }),
                  },
                },
              ],
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const items: AICommandItem[] = [
      { id: "a", value: "Alpha", onSelect: vi.fn() },
      { id: "b", value: "Beta", onSelect: vi.fn() },
    ];
    const result = await matcher("a or b", items);
    expect(result?.kind).toBe("clarify");
    if (result?.kind === "clarify") {
      expect(result.candidates).toHaveLength(2);
      expect(result.message).toBe("Which one did you mean?");
    }
  });

  it("flags needsApproval on an execute result when the model requests it", async () => {
    const matcher = createOpenAICommandMatcher({
      apiKey: "test-key",
      endpoint: "https://example.com/v1/chat/completions",
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  function: {
                    arguments: JSON.stringify({
                      matches: ["a"],
                      needsApproval: true,
                      message: "About to run A.",
                    }),
                  },
                },
              ],
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const items: AICommandItem[] = [{ id: "a", value: "A", onSelect: vi.fn() }];
    const result = await matcher("run a", items);
    expect(result?.kind).toBe("execute");
    if (result?.kind === "execute") {
      expect(result.needsApproval).toBe(true);
      expect(result.message).toBe("About to run A.");
    }
  });

  it("returns null when the model returns invalid JSON", async () => {
    const matcher = createOpenAICommandMatcher({
      apiKey: "test-key",
      endpoint: "https://example.com/v1/chat/completions",
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  function: {
                    arguments: "{not valid json",
                  },
                },
              ],
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const items: AICommandItem[] = [{ id: "a", value: "A", onSelect: vi.fn() }];
    const result = await matcher("test", items);
    expect(result).toBeNull();
  });

  it("throws a clear error when the OpenAI API key is missing", async () => {
    const matcher = createOpenAICommandMatcher({
      apiKey: "   ",
      endpoint: "https://example.com/v1/chat/completions",
    });

    const items: AICommandItem[] = [{ id: "a", value: "A", onSelect: vi.fn() }];
    await expect(matcher("test", items)).rejects.toThrow("OpenAI API key is missing.");
  });
});

describe("AICommand mode toggle and AI chat", () => {
  function ChatProbe() {
    const ctx = useAICommand();
    return (
      <>
        <button type="button" onClick={() => ctx.switchMode("ai")}>
          switch-to-ai
        </button>
        <button type="button" onClick={() => ctx.switchMode("search")}>
          switch-to-search
        </button>
        <button type="button" onClick={() => void ctx.submitChat("hello")}>
          send-chat
        </button>
        <span data-testid="mode">{ctx.mode}</span>
        <span data-testid="chat-input">{ctx.chatInput}</span>
        <span data-testid="chat-count">{ctx.chatMessages.length}</span>
        <AICommand.Chat>
          {ctx.chatMessages.map((message) => (
            <AICommand.ChatMessage key={message.id} message={message} />
          ))}
        </AICommand.Chat>
        <AICommand.Clarification />
        <AICommand.NoMatch />
      </>
    );
  }

  it("seeds the chat input from the search query when switching to AI mode", async () => {
    const user = userEvent.setup();
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue(null);
    render(
      <AICommandRoot matcher={matcher}>
        <AICommand.Dialog open>
          <AICommand.Input autoFocus />
          <AICommand.List />
          <ChatProbe />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.type(screen.getByLabelText("Command query"), "open billing");
    await user.click(screen.getByRole("button", { name: "switch-to-ai" }));

    expect(screen.getByTestId("mode").textContent).toBe("ai");
    expect(screen.getByTestId("chat-input").textContent).toBe("open billing");
  });

  it("seeds the search query from the chat input when switching back to search mode", async () => {
    const user = userEvent.setup();
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue(null);
    render(
      <AICommandRoot matcher={matcher} initialMode="ai">
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List />
          <ChatProbe />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    const ctx = screen.getByTestId("chat-input");
    expect(ctx.textContent).toBe("");
    await user.click(screen.getByRole("button", { name: "send-chat" }));

    await waitFor(() => expect(screen.getByTestId("chat-count").textContent).toBe("2"));
  });

  it("runs the matched command when the chat matcher returns execute", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue({
      kind: "execute",
      item: { id: "billing.open", value: "Open billing", onSelect },
    });

    render(
      <AICommandRoot matcher={matcher} initialMode="ai">
        <AICommand.Dialog open>
          <AICommand.ChatInput autoFocus />
          <ChatProbe />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.type(screen.getByLabelText("AI chat input"), "open billing");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("chat-count").textContent).toBe("2"));
  });

  it("renders clarification candidates and executes the chosen one", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue({
      kind: "clarify",
      candidates: [
        { id: "first", value: "First command", onSelect: first },
        { id: "second", value: "Second command", onSelect: second },
      ],
    });

    render(
      <AICommandRoot matcher={matcher} initialMode="ai">
        <AICommand.Dialog open>
          <AICommand.ChatInput autoFocus />
          <ChatProbe />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.type(screen.getByLabelText("AI chat input"), "command");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(screen.getAllByRole("button", { name: /First command/ }).length).toBeGreaterThan(0));
    const candidate = screen.getAllByRole("button", { name: /First command/ })[0]!;
    await user.click(candidate);

    await waitFor(() => expect(first).toHaveBeenCalledTimes(1));
    expect(second).not.toHaveBeenCalled();
  });

  it("gates an execute result behind the approval flow when needsApproval is set", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue({
      kind: "execute",
      item: { id: "delete", value: "Delete account", onSelect },
      needsApproval: true,
      message: "About to delete your account.",
    });

    render(
      <AICommandRoot matcher={matcher} initialMode="ai">
        <AICommand.Dialog open>
          <AICommand.ChatInput autoFocus />
          <AICommand.Confirmation />
          <ChatProbe />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.type(screen.getByLabelText("AI chat input"), "delete my account");
    await user.keyboard("{Enter}");

    expect(await screen.findByText('Confirm "Delete account"?')).toBeTruthy();
    expect(onSelect).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
  });

  it("renders the no-match state with a contact support button when onContactSupport is provided", async () => {
    const user = userEvent.setup();
    const support = vi.fn();
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue({ kind: "no-match" });

    render(
      <AICommandRoot matcher={matcher} initialMode="ai" onContactSupport={support}>
        <AICommand.Dialog open>
          <AICommand.ChatInput autoFocus />
          <ChatProbe />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.type(screen.getByLabelText("AI chat input"), "xyz");
    await user.keyboard("{Enter}");

    const supportButton = await screen.findByRole("button", { name: "Contact support" });
    await user.click(supportButton);

    expect(support).toHaveBeenCalledTimes(1);
  });

  it("does not render the contact support button when no callback is provided", async () => {
    const user = userEvent.setup();
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue({ kind: "no-match" });

    render(
      <AICommandRoot matcher={matcher} initialMode="ai">
        <AICommand.Dialog open>
          <AICommand.ChatInput autoFocus />
          <ChatProbe />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.type(screen.getByLabelText("AI chat input"), "xyz");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(screen.getByTestId("chat-count").textContent).toBe("2"));
    expect(screen.queryByRole("button", { name: "Contact support" })).toBeNull();
  });

  it("fills the chat input without submitting when the mic fires in AI mode", async () => {
    const user = userEvent.setup();
    const recognitionInstance: {
      current: { onresult: ((event: SpeechRecognitionEvent) => void) | null } | null;
    } = { current: null };
    const matcher = vi.fn<AICommandMatcher>();

    const Recognition = vi.fn().mockImplementation(() => {
      const recognition = {
        lang: "",
        interimResults: false,
        continuous: false,
        onresult: null as ((event: SpeechRecognitionEvent) => void) | null,
        onerror: null,
        onend: null,
        start: vi.fn(),
        stop: vi.fn(),
      };
      recognitionInstance.current = recognition;
      return recognition;
    });
    window.SpeechRecognition = Recognition as unknown as typeof window.SpeechRecognition;
    window.webkitSpeechRecognition = Recognition as unknown as typeof window.webkitSpeechRecognition;

    render(
      <AICommandRoot matcher={matcher} initialMode="ai">
        <AICommand.Dialog open>
          <AICommand.ChatInput autoFocus micShortcut="ctrl+m" />
          <ChatProbe />
        </AICommand.Dialog>
        <AICommand.VoiceButton />
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "Use voice" }));

    const fakeEvent = {
      results: {
        length: 1,
        0: {
          isFinal: true,
          length: 1,
          0: { transcript: "open billing" },
        },
      },
    } as unknown as SpeechRecognitionEvent;
    recognitionInstance.current?.onresult?.(fakeEvent);

    await waitFor(() => expect(screen.getByTestId("chat-input").textContent).toBe("open billing"));
    expect(matcher).not.toHaveBeenCalled();
    expect(screen.getByTestId("chat-count").textContent).toBe("0");
  });
});

describe("AICommand voice panel behavior", () => {
  function ModeProbe() {
    const ctx = useAICommand();
    return (
      <>
        <button type="button" onClick={() => ctx.switchMode("voice")}>
          switch-to-voice
        </button>
        <span data-testid="mode">{ctx.mode}</span>
        <span data-testid="listening">{ctx.isListening ? "yes" : "no"}</span>
      </>
    );
  }

  it("cycles mode with Tab when in voice mode", async () => {
    const user = userEvent.setup();
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue(null);

    render(
      <AICommandRoot matcher={matcher}>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List />
          <ModeProbe />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "switch-to-voice" }));
    await waitFor(() => expect(screen.getByTestId("mode").textContent).toBe("voice"));

    await user.keyboard("{Tab}");
    await waitFor(() => expect(screen.getByTestId("mode").textContent).toBe("search"));
  });

  it("does not render VoiceWaveform when not listening", async () => {
    const user = userEvent.setup();
    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue(null);
    const start = vi.fn();
    const Recognition = vi.fn().mockImplementation(() => ({
      lang: "",
      interimResults: false,
      continuous: false,
      onresult: null,
      onerror: null,
      onend: null,
      start,
      stop: vi.fn(),
    }));
    window.SpeechRecognition = Recognition as unknown as typeof window.SpeechRecognition;
    window.webkitSpeechRecognition = Recognition as unknown as typeof window.webkitSpeechRecognition;

    render(
      <AICommandRoot matcher={matcher}>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List />
          <ModeProbe />
          <AICommand.VoiceWaveform />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    expect(screen.queryByLabelText("Voice waveform")).toBeNull();

    await user.click(screen.getByRole("button", { name: "switch-to-voice" }));
    await waitFor(() => expect(screen.getByTestId("listening").textContent).toBe("yes"));

    expect(screen.queryByLabelText("Voice waveform")).toBeTruthy();
  });

  it("starts listening automatically when switching to voice mode", async () => {
    const user = userEvent.setup();
    const start = vi.fn();
    const Recognition = vi.fn().mockImplementation(() => ({
      lang: "",
      interimResults: false,
      continuous: false,
      onresult: null,
      onerror: null,
      onend: null,
      start,
      stop: vi.fn(),
    }));
    window.SpeechRecognition = Recognition as unknown as typeof window.SpeechRecognition;
    window.webkitSpeechRecognition = Recognition as unknown as typeof window.webkitSpeechRecognition;

    render(
      <AICommandRoot>
        <AICommand.Dialog open>
          <AICommand.Input />
          <AICommand.List />
          <ModeProbe />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "switch-to-voice" }));
    await waitFor(() => expect(screen.getByTestId("mode").textContent).toBe("voice"));

    expect(start).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("listening").textContent).toBe("yes");
  });
});

describe("rankCommandItems fuzzy matching", () => {
  it("tolerates minor typos via Fuse fuzzy matching", () => {
    const items: AICommandItem[] = [
      { id: "a", value: "Open settings", onSelect: vi.fn() },
    ];
    const ranked = rankCommandItems("opem settings", items);
    expect(ranked[0]?.id).toBe("a");
    expect(ranked[0]?.confidence).toBeGreaterThan(0);
  });
});

describe("useAICommand", () => {
  it("throws when used outside of AICommandRoot", () => {
    function Component() {
      useAICommand();
      return null;
    }

    expect(() => render(<Component />)).toThrow(/AICommand\.Root/);
  });
});
