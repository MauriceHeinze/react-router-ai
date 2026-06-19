import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineIntents } from "./define-intents";
import { IntentCommandPalette } from "./intent-command-palette";
import { IntentProvider } from "./intent-context";
import { matchIntent } from "./matcher";
import type { LanguageModelSession } from "./types";

const intents = defineIntents([
  {
    id: "settings.security.password",
    type: "navigation",
    title: "Change password",
    description: "Open account security settings to change the password.",
    phrases: ["change my password", "reset password"],
    keywords: ["security", "login"],
    to: "/settings/security/password",
  },
  {
    id: "settings.billing",
    type: "navigation",
    title: "Billing settings",
    phrases: ["manage my subscription", "change payment method"],
    keywords: ["billing", "subscription", "payment"],
    to: "/settings/billing",
  },
]);

afterEach(() => {
  cleanup();
  delete window.LanguageModel;
});

describe("defineIntents", () => {
  it("rejects duplicate ids", () => {
    expect(() =>
      defineIntents([
        intents[0],
        { ...intents[0] },
      ]),
    ).toThrow(/Duplicate intent id/);
  });
});

describe("matchIntent", () => {
  it("matches the best intent for a password query", () => {
    const match = matchIntent("where do i change my password", intents);
    expect(match?.intent.id).toBe("settings.security.password");
    expect(match?.confidence).toBeGreaterThan(0.45);
  });

  it("returns null below the threshold", () => {
    expect(matchIntent("totally unrelated request", intents, 0.9)).toBeNull();
  });
});

describe("IntentProvider", () => {
  it("submits a query and calls onNavigate with the best match", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <IntentProvider intents={intents} onNavigate={onNavigate}>
        <IntentCommandPalette />
      </IntentProvider>,
    );

    await user.type(screen.getByLabelText("Intent query"), "manage subscription");
    await user.click(screen.getByRole("button", { name: "Go" }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate.mock.calls[0][0].intent.id).toBe("settings.billing");
    expect(screen.getByText(/Billing settings/)).toBeTruthy();
  });

  it("falls back to the built-in LLM when fuzzy matching misses", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const prompt = vi.fn<LanguageModelSession["prompt"]>().mockResolvedValue(
      JSON.stringify({
        intentId: "settings.security.password",
        confidence: 0.62,
        reason: "password reset request",
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
      <IntentProvider intents={intents} onNavigate={onNavigate} llmFallback={{ enabled: true }}>
        <IntentCommandPalette />
      </IntentProvider>,
    );

    await user.type(screen.getByLabelText("Intent query"), "i can't sign in anymore");
    await user.click(screen.getByRole("button", { name: "Go" }));

    expect(window.LanguageModel.availability).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate.mock.calls[0][0].intent.id).toBe("settings.security.password");
    expect(onNavigate.mock.calls[0][0].source).toBe("llm");
    expect(screen.getByText(/llm/)).toBeTruthy();
  });
});
