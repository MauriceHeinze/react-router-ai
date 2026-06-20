import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineVoiceFieldCommands } from "./define-fields";
import { defineIntents, defineVoiceCommands } from "./define-intents";
import { VoiceCommandPalette } from "./intent-command-palette";
import { IntentProvider, VoiceProvider, useVoiceCommand } from "./intent-context";
import { matchVoiceCommand } from "./matcher";
import { createOpenAiVoiceCommandMatcher } from "./openai-matcher";
import type { LanguageModelSession } from "./types";

const themeOptions = ["light", "dark", "system"] as const;

const commands = defineVoiceCommands([
  {
    id: "settings.billing.open",
    title: "Open billing",
    description: "Open billing settings.",
    phrases: ["open billing", "manage my subscription"],
    keywords: ["billing", "subscription"],
    async run() {},
  },
  {
    id: "theme.set",
    title: "Set theme",
    description: "Change the application theme.",
    phrases: ["switch theme", "use light mode", "turn on dark mode"],
    keywords: ["theme", "appearance"],
    parameters: {
      value: {
        label: "Theme",
        options: themeOptions,
      },
    },
    async run() {},
  },
]);

afterEach(() => {
  cleanup();
  delete window.LanguageModel;
});

describe("defineVoiceCommands", () => {
  it("rejects duplicate ids", () => {
    expect(() =>
      defineVoiceCommands([
        commands[0],
        { ...commands[0] },
      ]),
    ).toThrow(/Duplicate command id/);
  });

  it("rejects invalid parameter definitions", () => {
    expect(() =>
      defineVoiceCommands([
        {
          id: "theme.set",
          title: "Set theme",
          parameters: {
            value: {
              label: "",
            },
          },
          async run() {},
        },
      ]),
    ).toThrow(/needs a label/);
  });
});

describe("defineVoiceFieldCommands", () => {
  it("builds boolean field commands and executes writes", async () => {
    const write = vi.fn();
    const [command] = defineVoiceFieldCommands([
      {
        id: "notifications.email",
        label: "Email notifications",
        type: "boolean",
        write,
      },
    ]);

    const match = matchVoiceCommand("turn on email notifications", [command]);
    expect(match?.parameters).toEqual({ value: true });

    await command.run(
      { value: false },
      {
        command,
        match: match!,
        query: "turn off email notifications",
        readCurrentValue: () => undefined,
      },
    );

    expect(write).toHaveBeenCalledWith(false);
  });

  it("extracts enum option values", () => {
    const commands = defineVoiceFieldCommands([
      {
        id: "theme",
        label: "Theme",
        type: "enum",
        options: themeOptions,
        write: vi.fn(),
      },
    ]);

    const match = matchVoiceCommand("please use dark mode", commands);
    expect(match?.parameters).toEqual({ value: "dark" });
  });

  it("extracts trailing string values", () => {
    const commands = defineVoiceFieldCommands([
      {
        id: "recorder.name",
        label: "Recorder name",
        type: "string",
        phrases: ["set recorder name"],
        write: vi.fn(),
      },
    ]);

    const match = matchVoiceCommand("set recorder name Meeting Copilot", commands);
    expect(match?.parameters).toEqual({ value: "meeting copilot" });
  });

  it("extracts numeric values", () => {
    const commands = defineVoiceFieldCommands([
      {
        id: "volume",
        label: "Volume",
        type: "number",
        write: vi.fn(),
      },
    ]);

    const match = matchVoiceCommand("set volume to 42", commands);
    expect(match?.parameters).toEqual({ value: 42 });
  });

  it("navigates after a successful write when a route is present", async () => {
    const write = vi.fn();
    const navigate = vi.fn();
    const [command] = defineVoiceFieldCommands(
      [
        {
          id: "notifications.email",
          label: "Email notifications",
          type: "boolean",
          route: "/settings/notifications",
          write,
        },
      ],
      { navigate },
    );

    await command.run(
      { value: true },
      {
        command,
        match: {
          command,
          query: "turn on email notifications",
          confidence: 0.8,
          source: "fuzzy",
          parameters: { value: true },
          missingParameters: [],
        },
        query: "turn on email notifications",
        readCurrentValue: () => undefined,
      },
    );

    expect(write).toHaveBeenCalledWith(true);
    expect(navigate).toHaveBeenCalledWith("/settings/notifications");
  });

  it("rejects invalid field definitions", () => {
    expect(() =>
      defineVoiceFieldCommands([
        {
          id: "theme",
          label: "Theme",
          type: "enum",
          write: vi.fn(),
        } as never,
      ]),
    ).toThrow(/needs options/);
  });
});

describe("matchVoiceCommand", () => {
  it("extracts parameter values from the query", () => {
    const match = matchVoiceCommand("please use dark mode", commands);
    expect(match?.command.id).toBe("theme.set");
    expect(match?.parameters).toEqual({ value: "dark" });
  });

  it("returns null below the threshold", () => {
    expect(matchVoiceCommand("totally unrelated request", commands, 0.95)).toBeNull();
  });
});

describe("VoiceProvider", () => {
  it("submits a query and executes the matched command", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    const executableCommands = defineVoiceCommands([
      {
        ...commands[0],
        run,
      },
    ]);

    render(
      <VoiceProvider commands={executableCommands}>
        <VoiceCommandPalette />
      </VoiceProvider>,
    );

    await user.type(screen.getByLabelText("Voice command query"), "manage subscription");
    await user.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Open billing/)).toBeTruthy();
  });

  it("waits for confirmation before executing a risky command", async () => {
    const user = userEvent.setup();
    const run = vi.fn();

    render(
      <VoiceProvider
        commands={[
          {
            id: "checkout.confirm",
            title: "Confirm order",
            phrases: ["confirm order"],
            confirmation: "Place this order?",
            run,
          },
        ]}
      >
        <VoiceCommandPalette />
      </VoiceProvider>,
    );

    await user.type(screen.getByLabelText("Voice command query"), "confirm order");
    await user.click(screen.getByRole("button", { name: "Run" }));

    expect(run).not.toHaveBeenCalled();
    expect(await screen.findByText("Place this order?")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
  });

  it("falls back to the built-in LLM when fuzzy matching misses", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    const prompt = vi.fn<LanguageModelSession["prompt"]>().mockResolvedValue(
      JSON.stringify({
        commandId: "settings.billing.open",
        confidence: 0.62,
        parameters: {},
        reason: "billing request",
      }),
    );

    window.LanguageModel = {
      availability: vi.fn().mockResolvedValue("available"),
      create: vi.fn().mockResolvedValue({
        prompt,
        destroy: vi.fn(),
      }),
    };

    render(
      <VoiceProvider
        commands={[
          {
            ...commands[0],
            run,
          },
        ]}
        llmFallback={{ enabled: true }}
      >
        <VoiceCommandPalette />
      </VoiceProvider>,
    );

    await user.type(screen.getByLabelText("Voice command query"), "i need help with invoices");
    await user.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(window.LanguageModel?.availability).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/llm/)).toBeTruthy();
  });

  it("supports a custom LLM matcher", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    const match = vi.fn().mockResolvedValue({
      commandId: "settings.billing.open",
      confidence: 0.91,
    });

    render(
      <VoiceProvider
        commands={[
          {
            ...commands[0],
            run,
          },
        ]}
        llmFallback={{ enabled: true, match }}
      >
        <VoiceCommandPalette />
      </VoiceProvider>,
    );

    await user.type(screen.getByLabelText("Voice command query"), "take me to invoices");
    await user.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(match).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/llm/)).toBeTruthy();
  });

  it("skips fuzzy matching when fuzzyMatching is disabled", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    const match = vi.fn().mockResolvedValue({
      commandId: "settings.billing.open",
      confidence: 0.91,
    });

    render(
      <VoiceProvider
        commands={[
          {
            ...commands[0],
            run,
          },
        ]}
        fuzzyMatching={false}
        llmFallback={{ enabled: true, match }}
      >
        <VoiceCommandPalette />
      </VoiceProvider>,
    );

    await user.type(screen.getByLabelText("Voice command query"), "open billing");
    await user.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(match).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/llm/)).toBeTruthy();
  });

  it("supports page-local command registration", async () => {
    const user = userEvent.setup();
    const run = vi.fn();

    function LocalCommand() {
      useVoiceCommand({
        id: "local.refresh",
        title: "Refresh data",
        phrases: ["refresh data"],
        run,
      });
      return null;
    }

    render(
      <VoiceProvider commands={[]}>
        <LocalCommand />
        <VoiceCommandPalette />
      </VoiceProvider>,
    );

    await user.type(screen.getByLabelText("Voice command query"), "refresh data");
    await user.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
  });
});

describe("createOpenAiVoiceCommandMatcher", () => {
  it("sends a chat completions request without a reasoning field", async () => {
    const matcher = createOpenAiVoiceCommandMatcher({
      apiKey: "test-key",
      endpoint: "https://example.com/v1/chat/completions",
      model: "gpt-5-nano",
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
                      commandId: "settings.billing.open",
                      confidence: 0.91,
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

    const result = await matcher("go to billing", [commands[0]!]);
    const init = fetchMock.mock.calls[0]?.[1];
    const body = init?.body ? JSON.parse(String(init.body)) : null;

    expect(result).toEqual({
      commandId: "settings.billing.open",
      confidence: 0.91,
      parameters: undefined,
    });
    expect(body?.reasoning).toBeUndefined();
    expect(body?.reasoning_effort).toBe("minimal");
    expect(body?.model).toBe("gpt-5-nano");
  });

  it("passes service_tier when configured", async () => {
    const matcher = createOpenAiVoiceCommandMatcher({
      apiKey: "test-key",
      endpoint: "https://example.com/v1/chat/completions",
      serviceTier: "priority",
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
                      commandId: "settings.billing.open",
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

    await matcher("go to billing", [commands[0]!]);
    const init = fetchMock.mock.calls[0]?.[1];
    const body = init?.body ? JSON.parse(String(init.body)) : null;

    expect(body?.service_tier).toBe("priority");
  });
});

describe("IntentProvider", () => {
  it("keeps the legacy intent API working", async () => {
    const user = userEvent.setup();
    const onMatch = vi.fn();
    const intents = defineIntents([
      {
        id: "settings.security.password",
        type: "navigation",
        title: "Change password",
        description: "Open password settings.",
        phrases: ["change my password", "reset password"],
        keywords: ["security", "login"],
        to: "/settings/security/password",
      },
    ]);

    render(
      <IntentProvider intents={intents} onMatch={onMatch}>
        <VoiceCommandPalette />
      </IntentProvider>,
    );

    await user.type(screen.getByLabelText("Voice command query"), "change my password");
    await user.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(onMatch).toHaveBeenCalledTimes(1));
    expect(onMatch.mock.calls[0][0].intent.id).toBe("settings.security.password");
  });
});
