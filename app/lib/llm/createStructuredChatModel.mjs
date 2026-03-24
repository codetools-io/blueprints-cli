/**
 * Dynamic imports keep provider SDKs off the load path until that provider is used
 * (avoids Jest/resolver issues and optional keys for unused providers).
 * @param {import('./modelsConfig.mjs').ModelEntry & { id?: string | null }} spec
 * @param {import('zod').ZodType} zodSchema
 */
export async function createStructuredChatModel(spec, zodSchema) {
  const temperature = spec.temperature ?? 0
  const maxTokens = spec.maxTokens

  let base
  switch (spec.provider) {
    case 'openai': {
      const { ChatOpenAI } = await import('@langchain/openai')
      base = new ChatOpenAI({
        model: spec.model,
        temperature,
        maxTokens: maxTokens ?? undefined,
      })
      break
    }
    case 'anthropic': {
      const { ChatAnthropic } = await import('@langchain/anthropic')
      base = new ChatAnthropic({
        model: spec.model,
        temperature,
        maxTokens: maxTokens ?? undefined,
      })
      break
    }
    case 'google': {
      const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai')
      base = new ChatGoogleGenerativeAI({
        model: spec.model,
        temperature,
        maxOutputTokens: maxTokens ?? undefined,
      })
      break
    }
    default:
      throw new Error(
        `Unsupported model provider "${spec.provider}". Use openai, anthropic, or google (or extend createStructuredChatModel.mjs).`
      )
  }

  return base.withStructuredOutput(zodSchema)
}
