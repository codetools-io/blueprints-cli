import { PromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'
import { log } from '../../../utilities.mjs'

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

const defaultProps = {
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  temperature: 0,
}

export default async function requestAction(props = {}) {
  try {
    const { action, files, ...rest } = { ...defaultProps, ...props }
    const model = new ChatOpenAI(rest)
    const structuredModel = model.withStructuredOutput(Response)
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
