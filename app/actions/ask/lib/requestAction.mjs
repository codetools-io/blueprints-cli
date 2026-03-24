import { PromptTemplate } from '@langchain/core/prompts'
import { z } from 'zod'
import { log } from '../../../utilities.mjs'
import { loadMergedModelRegistry } from '../../../lib/llm/modelsConfig.mjs'
import { resolveModelSelection } from '../../../lib/llm/resolveModel.mjs'
import { createStructuredChatModel } from '../../../lib/llm/createStructuredChatModel.mjs'

const filesTemplate = `Perform the provided action using the provided source files.

Action: {action}

Source Files:
{files}
`

const Response = z.object({
  files: z
    .object({
      path: z.string(),
      content: z.string(),
    })
    .array(),
})

export default async function requestAction(props = {}) {
  try {
    const { action, files, modelId, temperature } = props

    const { entries, defaultModelId } = await loadMergedModelRegistry()
    const spec = resolveModelSelection({
      cliModelId: modelId,
      cliModelWasExplicit: modelId != null && String(modelId).length > 0,
      entries,
      fileDefaultModelId: defaultModelId,
      blueprintModelId: undefined,
    })

    if (temperature != null) {
      spec.temperature = temperature
    }

    const structuredModel = await createStructuredChatModel(spec, Response)
    const promptTemplate = new PromptTemplate({
      template: filesTemplate,
      inputVariables: ['action', 'files'],
    })
    const userPrompt = await promptTemplate.format({ action, files })
    const result = await structuredModel.invoke(userPrompt)

    return result
  } catch (err) {
    log.output()
    log.error(err.message)
    throw err
  }
}
