# Settings Demo (Redux)

This demo wires `react-router-ai` into a Redux-backed settings app shell.

## OpenAI fallback

The command palette is configured to use OpenAI `gpt-realtime-mini` as the LLM fallback when `VITE_OPENAI_API_KEY` is present.

```bash
VITE_OPENAI_API_KEY=your_key_here npx vite
```

Without that env var, the app falls back to the browser `LanguageModel` API when available.
