import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AICommand, AICommandRoot, CommandDialog, aiCommandAttributes, commandDialogAttributes, useAICommand } from "./index";
import type { AICommandItem, AICommandMatcher } from "./types";

afterEach(() => {
  cleanup();
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
});

describe("aiCommandAttributes constants", () => {
  it("exposes primitive attribute names", () => {
    expect(aiCommandAttributes.input).toBe("ai-command-input");
    expect(aiCommandAttributes.list).toBe("ai-command-list");
    expect(aiCommandAttributes.item).toBe("ai-command-item");
    expect(aiCommandAttributes.selected).toBe("data-selected");
    expect(aiCommandAttributes.disabled).toBe("data-disabled");
  });
});

describe("commandDialogAttributes constants", () => {
  it("exposes CommandDialog structural attribute names", () => {
    expect(commandDialogAttributes.overlay).toBe("ai-command-dialog-overlay");
    expect(commandDialogAttributes.dialog).toBe("ai-command-dialog");
    expect(commandDialogAttributes.search).toBe("ai-command-dialog-search");
    expect(commandDialogAttributes.item).toBe("ai-command-dialog-item");
  });
});

describe("AICommand primitive attributes", () => {
  it("renders part attributes on visible primitives", () => {
    render(
      <AICommandRoot>
        <AICommand.Dialog open>
          <AICommand.Input placeholder="Search..." />
          <AICommand.List>
            <AICommand.Item id="a" value="Open settings" onSelect={vi.fn()}>
              Open settings
            </AICommand.Item>
          </AICommand.List>
          <AICommand.Loading>Loading...</AICommand.Loading>
          <AICommand.Error />
          <AICommand.Confirmation />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    expect(screen.getByLabelText("Command query").getAttribute("ai-command-input")).toBe("");
    expect(document.querySelector("[ai-command-list]")).toBeTruthy();
    expect(document.querySelector("[ai-command-item]")).toBeTruthy();
  });

  it("renders the empty state attribute when no items match", async () => {
    const user = userEvent.setup();
    render(
      <AICommandRoot>
        <AICommand.Dialog open>
          <AICommand.Input placeholder="Search..." />
          <AICommand.List>
            <AICommand.Item id="a" value="Open settings" onSelect={vi.fn()}>
              Open settings
            </AICommand.Item>
          </AICommand.List>
          <AICommand.Empty>No results.</AICommand.Empty>
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.type(screen.getByLabelText("Command query"), "xyz");
    expect(document.querySelector("[ai-command-empty]")).toBeTruthy();
  });

  it("toggles data-selected on items", async () => {
    const user = userEvent.setup();
    render(
      <AICommandRoot>
        <AICommand.Dialog open>
          <AICommand.Input autoFocus />
          <AICommand.List>
            <AICommand.Item id="a" value="First" onSelect={vi.fn()}>
              First
            </AICommand.Item>
            <AICommand.Item id="b" value="Second" onSelect={vi.fn()}>
              Second
            </AICommand.Item>
          </AICommand.List>
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    const items = document.querySelectorAll("[ai-command-item]");
    expect(items.length).toBe(2);
    expect(items[0].getAttribute("data-selected")).toBe("true");
    expect(items[1].getAttribute("data-selected")).toBeNull();

    await user.keyboard("{ArrowDown}");

    expect(items[0].getAttribute("data-selected")).toBeNull();
    expect(items[1].getAttribute("data-selected")).toBe("true");
  });

  it("renders the clarification item attribute", async () => {
    const user = userEvent.setup();
    function SubmitProbe() {
      const ctx = useAICommand();
      return (
        <button type="button" onClick={() => void ctx.submitChat("command")}>
          submit-chat
        </button>
      );
    }

    const matcher = vi.fn<AICommandMatcher>().mockResolvedValue({
      kind: "clarify",
      candidates: [
        { id: "a", value: "First", onSelect: vi.fn() },
        { id: "b", value: "Second", onSelect: vi.fn() },
      ],
    });

    render(
      <AICommandRoot matcher={matcher} initialMode="ai">
        <AICommand.Dialog open>
          <AICommand.Clarification />
          <SubmitProbe />
        </AICommand.Dialog>
      </AICommandRoot>,
    );

    await user.click(screen.getByRole("button", { name: "submit-chat" }));

    await waitFor(() => {
      const items = document.querySelectorAll("[ai-command-clarification-item]");
      expect(items.length).toBe(2);
    });
  });
});

describe("CommandDialog attributes", () => {
  function renderDialog(items: AICommandItem[] = []) {
    render(
      <AICommandRoot>
        <CommandDialog open onOpenChange={vi.fn()} items={items} />
      </AICommandRoot>,
    );
  }

  it("renders attributes on every structural part in search mode", () => {
    renderDialog([
      { id: "a", value: "Open settings", onSelect: vi.fn() },
    ]);

    expect(document.querySelector("[ai-command-dialog-overlay]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog-search]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog-search-input-wrap]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog-input]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog-body]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog-list]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog-item]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog-footer]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog-shortcuts]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog-shortcut]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog-keycap]")).toBeTruthy();
  });

  it("renders attributes on chat parts in AI mode", () => {
    render(
      <AICommandRoot initialMode="ai">
        <CommandDialog open onOpenChange={vi.fn()} items={[]} />
      </AICommandRoot>,
    );

    expect(document.querySelector("[ai-command-dialog-chat-panel]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog-chat]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog-voice-prompt]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog-chat-input-wrap]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog-chat-input]")).toBeTruthy();
    expect(document.querySelector("[ai-command-dialog-chat-mic]")).toBeTruthy();
  });

  it("does not emit the old command-dialog class names", () => {
    renderDialog([
      { id: "a", value: "Open settings", onSelect: vi.fn() },
    ]);

    expect(document.querySelector(".command-dialog")).toBeNull();
    expect(document.querySelector(".command-dialog-search")).toBeNull();
    expect(document.querySelector(".command-dialog-item")).toBeNull();
  });
});
