# AI Generation

`bp ask` uses LangChain with structured output to generate files from natural-language prompts instead of fixed templates.

## Requirements

You need an API key for the provider your chosen model uses:

| Provider | Environment Variable |
| -------- | -------------------- |
| OpenAI | `OPENAI_API_KEY` |
| Anthropic | `ANTHROPIC_API_KEY` |
| Google (Gemini) | `GOOGLE_API_KEY` |

## Usage

```bash
bp ask <blueprint> <instance> [-d <dest>] [-m <modelId>]
```

```bash
bp ask component Button -d src/components
bp ask component Button -m claude-haiku
```

## How the Model Is Chosen

Precedence (first match wins):

1. `bp ask ... -m <id>` — explicit CLI flag
2. `BP_MODEL` environment variable
3. `model` field in the blueprint's `blueprint.json`
4. `OPENAI_MODEL` environment variable (legacy; uses the provider model name directly, bypasses the id registry)
5. `defaultModel` in `~/.blueprints/models.json` or `.blueprints/models.json`
6. Built-in default: `gpt-4o-mini`

Run `bp models` (alias `bp md`) to list all available model ids, providers, and provider-native model names.

## Built-In Models

| Id | Provider | Model |
| -- | -------- | ----- |
| `gpt-4o-mini` | openai | gpt-4o-mini |
| `gpt-4o` | openai | gpt-4o |
| `claude-sonnet` | anthropic | claude-sonnet-4-20250514 |
| `claude-haiku` | anthropic | claude-3-5-haiku-20241022 |
| `gemini-flash` | google | gemini-2.0-flash |
| `gemini-pro` | google | gemini-1.5-pro |

## Adding Custom Models

Create `~/.blueprints/models.json` (global) and/or `.blueprints/models.json` (project). Project entries are merged after global entries; same `id` overrides.

```json
{
  "defaultModel": "work-gpt",
  "models": [
    {
      "id": "work-gpt",
      "provider": "openai",
      "model": "gpt-4o",
      "label": "Work OpenAI",
      "temperature": 0
    },
    {
      "id": "work-claude",
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "label": "Work Anthropic"
    }
  ]
}
```

Required fields per entry: `id`, `provider` (`openai`, `anthropic`, or `google`), `model`. Optional: `label`, `temperature`, `maxTokens`.

## Prompt Files

AI generation uses prompt files located in the blueprint's `prompts/` directory. The default prompt file is specified in `blueprint.json`:

```json
{
  "prompts": ["prompts/default.md"]
}
```

Prompt files use YAML frontmatter to declare template variables, followed by the prompt body:

```markdown
---
input_variables:
  - template_variables
  - templates
  - format_instructions
---
You are a code generator. Generate files using the provided templates.

{format_instructions}

template_variables:
{template_variables}

templates:
{templates}
```

The `{format_instructions}`, `{template_variables}`, and `{templates}` placeholders are populated automatically by the CLI at generation time. The prompt receives the blueprint's template files as context.

## Notes

- `bp ask` does not support `--json` or `--dry-run`. It is intended for interactive use.
- AI generation writes files directly to the destination path using the paths returned by the model.
- Temperature defaults to 0 for deterministic output.
