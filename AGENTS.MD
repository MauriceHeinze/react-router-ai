# AGENTS.md

## Project

This repo contains `react-router-ai`, a React library for mapping free-form text or speech to app intents, plus a settings demo app.

The package is the product. The demo exists to prove integration quality.

## Operating Principles

- Prefer small, well-typed changes over broad rewrites.
- Treat public API changes as product decisions, not incidental refactors.
- Keep the library state-manager agnostic. It should work with `useState`, Redux, Zustand, server actions, and custom app services through explicit callbacks/actions.
- The library should resolve user language into typed app commands/intents. The host app owns state mutation, routing, persistence, and domain side effects.
- Optimize for maintainability by future LLM agents: clear types, explicit data flow, focused files, and tests for behavior.

## Repo Structure

- `packages/react-router-ai/src`: library source.
- `examples/settings-demo/src`: integration demo.
- `docs/voice-control-api.md`: target API direction for command-oriented voice control.
- `README.md`: public-facing overview.

## Commands

Use the pinned pnpm version through `npx` unless `pnpm` is already available.

```bash
npx pnpm@10.12.4 install
npx pnpm@10.12.4 typecheck
npx pnpm@10.12.4 test
npx pnpm@10.12.4 build
```

Before finishing any code change, run at least:

```bash
npx pnpm@10.12.4 typecheck
npx pnpm@10.12.4 test
```

Run `build` when touching package exports, tsup config, package metadata, demo integration, or public types.

## Coding Standards

- Use TypeScript types as the primary source of truth.
- Avoid `any` unless there is a specific boundary reason.
- Prefer discriminated unions for public command/intent shapes.
- Keep runtime behavior simple and inspectable.
- Do not introduce global state unless it is necessary for provider-level registration.
- Do not make the library inspect React internals, click DOM nodes, or infer Redux slices magically.
- Do not add a dependency unless it materially improves the public API or reliability.
- Keep examples realistic and minimal.

## API Design Rules

When changing the library API:

- Preserve backwards compatibility unless the task explicitly allows a breaking change.
- If a breaking change is needed, update README, docs, tests, and the demo in the same change.
- Public names should describe app concepts, not implementation details.
- Prefer app-owned execution callbacks over library-owned mutation.
- Generated or derived commands must remain inspectable and overrideable.
- Ambiguous matches should produce candidates, not silently guess.
- Risky actions should support confirmation before execution.

## Voice/Command Architecture

The preferred direction is:

```txt
speech/text -> match/rank -> typed command/intent -> app-owned execution
```

The library owns:

- Speech/text capture.
- Matching and fallback.
- Candidate ranking and clarification.
- Command palette and voice button UI.
- Typed command metadata.

The app owns:

- `setState`.
- Redux dispatches.
- Navigation.
- API calls.
- Persistence.
- Business rules.

## State Integration Guidance

For `useState`, pass setters through command `run` handlers or registered fields.

For Redux, prefer explicit selectors and action creators.

Good:

```ts
run: ({ value }) => dispatch(settingsActions.setTheme(value))
```

Good:

```ts
read: () => selectTheme(store.getState())
```

Avoid:

```ts
// Do not infer random slice names or action names from store internals.
reduxAdapter({ autoDiscover: true })
```

## Testing Expectations

Add or update tests when changing:

- Matching behavior.
- Provider behavior.
- Public types.
- LLM fallback behavior.
- Command/intent execution.
- Candidate clarification.
- Demo-critical flows.

Tests should verify behavior, not implementation details.

Useful scenarios:

- Query matches expected command/intent.
- Query below threshold returns no match.
- Ambiguous query returns candidates.
- Action intent executes app callback.
- Navigation intent calls app navigation handler.
- LLM fallback parses valid model output safely.
- Invalid model output fails gracefully.

## Demo Expectations

The demo should show real integration patterns, not special-case hacks.

When adding a capability to the package, update the demo only if it helps prove integration quality. Keep demo state flow representative of real apps.

## Documentation Expectations

Update docs when changing public behavior.

- README: current stable usage.
- `docs/voice-control-api.md`: forward-looking API direction.
- Code comments: only where they clarify non-obvious logic.

Do not let docs describe APIs that no longer exist.

## Change Hygiene

- Keep unrelated refactors out of feature work.
- Do not rename files or symbols just for preference.
- Do not reformat unrelated files.
- Do not commit build artifacts unless the repo already tracks them.
- If the worktree has unrelated changes, leave them alone.
- If generated output changes unexpectedly, inspect it before proceeding.

## Final Response Checklist

When reporting completed work, include:

- What changed.
- Which files matter most.
- What verification ran.
- Any known risks or follow-up decisions.

Keep the response concise.
