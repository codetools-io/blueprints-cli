/** Built-in model registry ids; extend via ~/.blueprints/models.json or project .blueprints/models.json */
export const DEFAULT_MODEL_ID = 'gpt-4o-mini'

export const BUILTIN_MODELS = [
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    model: 'gpt-4o-mini',
    label: 'OpenAI GPT-4o mini',
  },
  {
    id: 'gpt-4o',
    provider: 'openai',
    model: 'gpt-4o',
    label: 'OpenAI GPT-4o',
  },
  {
    id: 'claude-sonnet',
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    label: 'Anthropic Claude Sonnet 4',
  },
  {
    id: 'claude-haiku',
    provider: 'anthropic',
    model: 'claude-3-5-haiku-20241022',
    label: 'Anthropic Claude 3.5 Haiku',
  },
  {
    id: 'gemini-flash',
    provider: 'google',
    model: 'gemini-2.0-flash',
    label: 'Google Gemini 2.0 Flash',
  },
  {
    id: 'gemini-pro',
    provider: 'google',
    model: 'gemini-1.5-pro',
    label: 'Google Gemini 1.5 Pro',
  },
]
