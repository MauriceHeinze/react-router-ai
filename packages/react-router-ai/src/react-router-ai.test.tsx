import { useState } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineVoiceFieldCommands } from "./define-fields";
import { defineIntents, defineVoiceCommands } from "./define-intents";
import { VoiceCommandPalette } from "./intent-command-palette";
import { VoiceWidget } from "./intent-widget";
import { IntentProvider, VoiceProvider, useVoiceCommand } from "./intent-context";
import { matchVoiceCommand } from "./matcher";
import { createOpenAiVoiceCommandMatcher } from "./openai-matcher";
import type { LanguageModelSession } from "./types";
import { useVoiceController } from "./intent-context";

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

function HighlightProbe() {
  const { lastHighlight } = useVoiceController();
  return <div data-testid="highlight-target">{lastHighlight?.targetId ?? ""}</div>;
}

afterEach(() => {
  cleanup();
  delete window.LanguageModel;
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
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

  it("infers negative boolean requests from natural language negation", () => {
    const [command] = defineVoiceFieldCommands([
      {
        id: "records.audit",
        label: "Record audit log",
        type: "boolean",
        phrases: ["turn on record audit log", "disable record audit logging", "change record audit settings"],
        keywords: ["records", "audit", "log", "history", "enable", "disable"],
        write: vi.fn(),
      },
    ]);

    const match = matchVoiceCommand("audit logs should not be kept for record changes", [command]);
    expect(match?.parameters).toEqual({ value: false });
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

  it("maps activation language to on off enum values", () => {
    const [command] = defineVoiceCommands([
      {
        id: "notifications.push.set",
        title: "Set push notifications",
        phrases: ["turn on push notifications", "disable push alerts", "change push notifications"],
        keywords: ["push", "notifications", "alerts", "enable", "disable"],
        parameters: {
          value: {
            label: "Push notifications",
            options: ["on", "off"] as const,
          },
        },
        async run() {},
      },
    ]);

    const match = matchVoiceCommand("activate push notification", [command]);
    expect(match?.parameters).toEqual({ value: "on" });
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

  it("extracts string values after setter prepositions", () => {
    const commands = defineVoiceFieldCommands([
      {
        id: "billing.email",
        label: "Billing email",
        type: "string",
        phrases: ["set billing email", "change billing contact", "update invoice email"],
        keywords: ["billing", "email", "invoice", "contact"],
        write: vi.fn(),
      },
    ]);

    const match = matchVoiceCommand("change my billing email to hello at googlemail.com", commands);
    expect(match?.parameters).toEqual({ value: "hello@googlemail.com" });
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
    expect(screen.queryByText(/Match:/)).toBeNull();
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
        llmFallback={{ enabled: true, pageContext: "Settings > Billing" }}
      >
        <VoiceCommandPalette />
      </VoiceProvider>,
    );

    await user.type(screen.getByLabelText("Voice command query"), "i need help with invoices");
    await user.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(window.LanguageModel?.availability).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/Match:/)).toBeNull();
    expect(prompt.mock.calls[0]?.[0]).toContain("Current page: Settings > Billing");
    expect(prompt.mock.calls[0]?.[0]).toContain('convert "hello at googlemail.com" to "hello@googlemail.com"');
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
    expect(screen.queryByText(/Match:/)).toBeNull();
  });

  it("asks for clarification instead of resolving an incomplete LLM field match", async () => {
    const user = userEvent.setup();
    const write = vi.fn();
    const [auditCommand] = defineVoiceFieldCommands([
      {
        id: "settings.records.audit",
        label: "Record audit log",
        description: "Turn record audit logging on or off.",
        type: "boolean",
        phrases: ["turn on record audit log", "disable record audit logging", "change record audit settings"],
        keywords: ["records", "audit", "log", "history", "enable", "disable"],
        write,
      },
    ]);
    const commandCatalog = defineVoiceCommands([
      auditCommand,
      {
        id: "settings.records.open",
        title: "Open records",
        description: "Open record settings.",
        phrases: ["open records", "record settings"],
        keywords: ["records", "settings"],
        async run() {},
      },
      {
        id: "settings.security.open",
        title: "Open security",
        description: "Open security settings.",
        phrases: ["open security", "security settings"],
        keywords: ["security", "settings"],
        async run() {},
      },
    ]);
    const match = vi.fn().mockResolvedValue({
      commandId: "settings.records.audit.set",
      confidence: 0.6,
      parameters: {},
    });

    render(
      <VoiceProvider
        commands={commandCatalog}
        fuzzyMatching={false}
        llmFallback={{ enabled: true, match }}
      >
        <VoiceCommandPalette />
      </VoiceProvider>,
    );

    await user.type(screen.getByLabelText("Voice command query"), "change record audit settings");
    await user.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(match).toHaveBeenCalledTimes(1));
    expect(write).not.toHaveBeenCalled();
    expect(await screen.findByText("Did you mean one of these?")).toBeTruthy();
    expect(screen.getByText("Set Record audit log")).toBeTruthy();
    expect(screen.queryByText(/Match:/)).toBeNull();
  });

  it("ignores invalid LLM parameter objects and executes with inferred values", async () => {
    const user = userEvent.setup();
    const write = vi.fn();
    const [command] = defineVoiceFieldCommands([
      {
        id: "settings.billing.email",
        label: "Billing email",
        type: "string",
        phrases: ["set billing email", "change billing contact", "update invoice email"],
        keywords: ["billing", "email", "invoice", "contact"],
        write,
      },
    ]);
    const match = vi.fn().mockResolvedValue({
      commandId: "settings.billing.email.set",
      confidence: 0.5,
      parameters: {
        value: {
          label: "Billing email",
          type: "string",
        },
      },
    });

    render(
      <VoiceProvider
        commands={[command]}
        fuzzyMatching={false}
        llmFallback={{ enabled: true, match }}
      >
        <VoiceCommandPalette />
      </VoiceProvider>,
    );

    await user.type(screen.getByLabelText("Voice command query"), "change my billing email to hello at googlemail.com");
    await user.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() => expect(write).toHaveBeenCalledWith("hello@googlemail.com"));
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
    expect(screen.queryByText(/Match:/)).toBeNull();
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

  it("exposes a transient highlight target for executed commands", async () => {
    const user = userEvent.setup();
    const write = vi.fn();
    const [command] = defineVoiceFieldCommands([
      {
        id: "settings.notifications.email",
        label: "Email notifications",
        type: "boolean",
        write,
      },
    ]);

    render(
      <VoiceProvider commands={[command]}>
        <HighlightProbe />
        <VoiceCommandPalette />
      </VoiceProvider>,
    );

    await user.type(screen.getByLabelText("Voice command query"), "turn on email notifications");
    await user.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(() =>
      expect(screen.getByTestId("highlight-target").textContent).toBe("settings.notifications.email"),
    );
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
    expect(body?.messages?.[1]?.content).toContain("Available commands:");
    expect(body?.messages?.[2]?.content).toBe("query: go to billing");
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

  it("instructs the model to return parameter values, not definitions", async () => {
    const matcher = createOpenAiVoiceCommandMatcher({
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
    const systemMessage = body?.messages?.find((message: { role: string }) => message.role === "system")?.content ?? "";

    expect(systemMessage).toContain("parameters object must contain only the actual values");
    expect(systemMessage).toContain('convert "hello at googlemail.com" to "hello@googlemail.com"');
    expect(systemMessage).toContain("Do not return parameter definitions");
    expect(systemMessage).not.toContain("Available commands:");
    const commandsMessage = body?.messages?.[1]?.content ?? "";
    expect(commandsMessage).toContain("Available commands:");
    expect(commandsMessage).toContain('"id":"settings.billing.open"');
    expect(systemMessage).not.toContain('"title"');
    expect(systemMessage).not.toContain('"label"');
    expect(body?.messages?.[2]?.content).toBe("query: go to billing");
  });

  it("serializes only routing-relevant parameter metadata into the system catalog", async () => {
    const matcher = createOpenAiVoiceCommandMatcher({
      apiKey: "test-key",
      endpoint: "https://example.com/v1/chat/completions",
      pageContext: "Settings > Billing",
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
                      commandId: "theme.set",
                      parameters: { value: "dark" },
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

    await matcher("use dark mode", [commands[1]!]);
    const init = fetchMock.mock.calls[0]?.[1];
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    const commandsMessage = body?.messages?.[1]?.content ?? "";
    const systemMessage = body?.messages?.find((message: { role: string }) => message.role === "system")?.content ?? "";

    expect(commandsMessage).toContain('"description":"Change the application theme."');
    expect(commandsMessage).toContain('"parameters":{"value":{"options":["light","dark","system"]}}');
    expect(commandsMessage).not.toContain('"label":"Theme"');
    expect(systemMessage).toContain("Current page: Settings > Billing");
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

describe("VoiceWidget", () => {
  it("renders a floating button that opens the dialog", async () => {
    const user = userEvent.setup();

    render(
      <VoiceProvider commands={commands}>
        <VoiceWidget />
      </VoiceProvider>,
    );

    const openButton = screen.getByRole("button", { name: "Open voice assistant" });
    expect(openButton).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(openButton);

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("How can I help?")).toBeTruthy();
    expect(screen.getByText(/click the.*to speak/)).toBeTruthy();
    expect(screen.getByLabelText("Voice command query")).toBeTruthy();
    expect(screen.getByText("Open assistant")).toBeTruthy();
    expect(screen.getByText("Text ↔ Voice")).toBeTruthy();
    expect(screen.getByText("Start typing immediately")).toBeTruthy();
  });

  it("opens the dialog when Cmd/Ctrl+K is pressed", async () => {
    const user = userEvent.setup();

    render(
      <VoiceProvider commands={commands}>
        <VoiceWidget />
      </VoiceProvider>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();

    await user.keyboard("{Meta>}k{/Meta}");

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByLabelText("Voice command query")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText("Voice command query"));
  });

  it("switches between text and voice mode with Tab", async () => {
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
      <VoiceProvider commands={commands}>
        <VoiceWidget />
      </VoiceProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open voice assistant" }));
    expect(document.activeElement).toBe(screen.getByLabelText("Voice command query"));

    await user.keyboard("{Tab}");
    expect(await screen.findByText("Listening...")).toBeTruthy();
    expect(start).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    await user.keyboard("{Tab}");
    expect(document.activeElement).toBe(screen.getByLabelText("Voice command query"));
  });

  it("keeps the dialog mounted when voice start fails", async () => {
    const user = userEvent.setup();
    const start = vi.fn(() => {
      throw new Error("speech unavailable");
    });
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
      <VoiceProvider commands={commands}>
        <VoiceWidget />
      </VoiceProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open voice assistant" }));
    await user.keyboard("{Tab}");

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(await screen.findByText("Voice input failed. Keep typing instead.")).toBeTruthy();
    expect(start).toHaveBeenCalledTimes(1);
  });

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
        <VoiceWidget />
      </VoiceProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open voice assistant" }));
    await user.type(screen.getByLabelText("Voice command query"), "manage subscription");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/Best match/)).toBeNull();
  });

  it("shows the listening state when the microphone button is clicked", async () => {
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
      <VoiceProvider commands={commands}>
        <VoiceWidget />
      </VoiceProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open voice assistant" }));
    await user.click(screen.getByRole("button", { name: "Use voice" }));

    expect(await screen.findByText("Listening...")).toBeTruthy();
    expect(screen.getByText("Speak now")).toBeTruthy();
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("starts listening with Space when voice mode is active", async () => {
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
      <VoiceProvider commands={commands}>
        <VoiceWidget />
      </VoiceProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open voice assistant" }));
    await user.keyboard("{Tab}");
    await user.keyboard(" ");

    expect(await screen.findByText("Listening...")).toBeTruthy();
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("shows a processing state while a prompt is being matched", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    let resolveMatch!: (value: { commandId: string; confidence: number }) => void;
    const match = vi.fn().mockImplementation(
      () =>
        new Promise<{ commandId: string; confidence: number }>((resolve) => {
          resolveMatch = resolve;
        }),
    );

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
        <VoiceWidget />
      </VoiceProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open voice assistant" }));
    await user.type(screen.getByLabelText("Voice command query"), "take me to invoices");
    await user.keyboard("{Enter}");

    expect(await screen.findByText("Processing...")).toBeTruthy();
    expect(screen.getByText("Matching your prompt to the best command.")).toBeTruthy();

    resolveMatch({ commandId: "settings.billing.open", confidence: 0.91 });

    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText("Processing...")).toBeNull());
  });

  it("stops listening with Escape before closing the dialog", async () => {
    const user = userEvent.setup();
    const start = vi.fn();
    const stop = vi.fn();
    const Recognition = vi.fn().mockImplementation(() => ({
      lang: "",
      interimResults: false,
      continuous: false,
      onresult: null,
      onerror: null,
      onend: null,
      start,
      stop,
    }));
    window.SpeechRecognition = Recognition as unknown as typeof window.SpeechRecognition;
    window.webkitSpeechRecognition = Recognition as unknown as typeof window.webkitSpeechRecognition;

    render(
      <VoiceProvider commands={commands}>
        <VoiceWidget />
      </VoiceProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open voice assistant" }));
    await user.click(screen.getByRole("button", { name: "Use voice" }));
    expect(await screen.findByText("Listening...")).toBeTruthy();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByText("Listening...")).toBeNull());
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(stop).toHaveBeenCalled();
  });

  it("closes the dialog when the close button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <VoiceProvider commands={commands}>
        <VoiceWidget />
      </VoiceProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open voice assistant" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    await user.type(screen.getByLabelText("Voice command query"), "manage subscription");

    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await user.click(screen.getByRole("button", { name: "Open voice assistant" }));
    expect((screen.getByLabelText("Voice command query") as HTMLInputElement).value).toBe("");
  });

  it("clears the query when a controlled widget is closed externally", async () => {
    const user = userEvent.setup();

    function ControlledWidgetHarness() {
      const [open, setOpen] = useState(true);

      return (
        <>
          <button type="button" onClick={() => setOpen(false)}>
            Close externally
          </button>
          <button type="button" onClick={() => setOpen(true)}>
            Reopen
          </button>
          <VoiceWidget open={open} onOpenChange={setOpen} />
        </>
      );
    }

    render(
      <VoiceProvider commands={commands}>
        <ControlledWidgetHarness />
      </VoiceProvider>,
    );

    await user.type(screen.getByLabelText("Voice command query"), "move to billing");
    await user.click(screen.getByRole("button", { name: "Close externally" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await user.click(screen.getByRole("button", { name: "Reopen" }));
    expect((screen.getByLabelText("Voice command query") as HTMLInputElement).value).toBe("");
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
        <VoiceWidget />
      </VoiceProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open voice assistant" }));
    await user.type(screen.getByLabelText("Voice command query"), "confirm order");
    await user.keyboard("{Enter}");

    expect(run).not.toHaveBeenCalled();
    expect(await screen.findByText("Place this order?")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
  });
});
