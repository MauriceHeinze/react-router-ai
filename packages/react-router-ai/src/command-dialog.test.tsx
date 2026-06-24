import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AICommandRoot, CommandDialog } from "./index";
import type { AICommandItem } from "./types";

afterEach(() => {
  cleanup();
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
  vi.restoreAllMocks();
});

function renderCommandDialog(props: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  items?: AICommandItem[];
  initialMode?: "search" | "ai" | "voice";
} = {}) {
  const items = props.items ?? [
    { id: "a", value: "Open settings", onSelect: vi.fn() },
    { id: "b", value: "Open billing", onSelect: vi.fn() },
  ];

  render(
    <AICommandRoot initialMode={props.initialMode}>
      <CommandDialog
        open={props.open ?? true}
        onOpenChange={props.onOpenChange ?? vi.fn()}
        items={items}
      />
    </AICommandRoot>,
  );
}

describe("CommandDialog search mode", () => {
  it("renders the search input and command list", () => {
    renderCommandDialog();

    expect(screen.getByLabelText("Command query")).toBeTruthy();
    expect(screen.getByText("Open settings")).toBeTruthy();
    expect(screen.getByText("Open billing")).toBeTruthy();
  });

  it("filters items as the user types", async () => {
    const user = userEvent.setup();
    renderCommandDialog();

    await user.type(screen.getByLabelText("Command query"), "billing");

    expect(screen.queryByText("Open settings")).toBeNull();
    expect(screen.getByText("Open billing")).toBeTruthy();
  });

  it("runs a command and closes the dialog on Enter", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    renderCommandDialog({
      items: [{ id: "a", value: "Open settings", onSelect }],
      onOpenChange,
    });

    await user.type(screen.getByLabelText("Command query"), "settings");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("runs a command and closes the dialog on click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    renderCommandDialog({
      items: [{ id: "a", value: "Open settings", onSelect }],
      onOpenChange,
    });

    await user.click(screen.getByText("Open settings"));

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("closes the dialog with Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderCommandDialog({ onOpenChange });

    await user.keyboard("{Escape}");

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("shows the empty state when nothing matches", async () => {
    const user = userEvent.setup();
    renderCommandDialog();

    await user.type(screen.getByLabelText("Command query"), "xyz123");

    expect(screen.getByText("No matching command.")).toBeTruthy();
  });
});

describe("CommandDialog AI mode", () => {
  it("renders the chat input and empty prompt", () => {
    renderCommandDialog({ initialMode: "ai" });

    expect(screen.getByLabelText("AI chat input")).toBeTruthy();
    expect(screen.getByText("What are you looking for?")).toBeTruthy();
  });
});

describe("CommandDialog voice mode", () => {
  it("renders the voice prompt and big mic button", () => {
    renderCommandDialog({ initialMode: "voice" });

    expect(screen.getByText("What are you looking for?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start listening" })).toBeTruthy();
  });

  it("toggles listening with the Space key in voice mode", async () => {
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

    renderCommandDialog({ initialMode: "voice" });

    await user.keyboard(" ");

    expect(start).toHaveBeenCalledTimes(1);
  });
});

describe("CommandDialog Weaviate routes", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            Get: {
              Routes: [
                {
                  path: "/settings/billing",
                  label: "Billing",
                  description: "Manage billing",
                  _additional: { score: "0.95" },
                },
              ],
            },
          },
        }),
      }),
    );
  });

  it("renders Weaviate route results and navigates on selection", async () => {
    const user = userEvent.setup();
    const onSelectWeaviateRoute = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <AICommandRoot>
        <CommandDialog
          open
          onOpenChange={onOpenChange}
          items={[]}
          weaviateUrl="https://weaviate.example.com"
          weaviateApiKey="key"
          onSelectWeaviateRoute={onSelectWeaviateRoute}
        />
      </AICommandRoot>,
    );

    await user.type(screen.getByLabelText("Command query"), "billing");

    const route = await screen.findByText("Billing");
    expect(route).toBeTruthy();

    await user.click(route);

    await waitFor(() => expect(onSelectWeaviateRoute).toHaveBeenCalledWith("/settings/billing", expect.any(Object)));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
