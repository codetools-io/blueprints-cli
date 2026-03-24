import { DEFAULT_MODEL_ID } from './builtinModels.mjs'

const OPENAI = 'openai'

/**
 * @param {object} opts
 * @param {string | undefined} opts.cliModelId --model (omit when user did not pass flag)
 * @param {string | undefined} opts.cliModelWasExplicit whether user passed -m/--model
 * @param {import('./modelsConfig.mjs').ModelEntry[]} opts.entries merged registry
 * @param {string} opts.fileDefaultModelId defaultModel from merged config (may point at any id)
 * @param {string | undefined} opts.blueprintModelId blueprint.json "model" field
 * @returns {import('./modelsConfig.mjs').ModelEntry & { id: string | null }}
 */
export function resolveModelSelection({
  cliModelId,
  cliModelWasExplicit,
  entries,
  fileDefaultModelId,
  blueprintModelId,
}) {
  const byId = new Map(entries.map((e) => [e.id, e]))

  const lookup = (id) => {
    const e = byId.get(id)
    if (!e) {
      const known = [...byId.keys()].sort().join(', ')
      throw new Error(
        `Unknown model id "${id}". Configure it in ~/.blueprints/models.json or .blueprints/models.json. Known ids: ${known}. Run \`bp models\` to list.`
      )
    }
    return { ...e, id: e.id }
  }

  if (cliModelWasExplicit) {
    if (cliModelId == null || cliModelId === '') {
      throw new Error('Missing value for --model <id>. Run `bp models` for available ids.')
    }
    return lookup(cliModelId)
  }

  const bpModel = process.env.BP_MODEL
  if (bpModel) {
    return lookup(bpModel)
  }

  if (blueprintModelId) {
    return lookup(blueprintModelId)
  }

  if (process.env.OPENAI_MODEL) {
    return {
      id: null,
      provider: OPENAI,
      model: process.env.OPENAI_MODEL,
      temperature: 0,
    }
  }

  if (fileDefaultModelId && byId.has(fileDefaultModelId)) {
    return lookup(fileDefaultModelId)
  }

  if (fileDefaultModelId && !byId.has(fileDefaultModelId)) {
    const known = [...byId.keys()].sort().join(', ')
    throw new Error(
      `defaultModel "${fileDefaultModelId}" is not defined in the merged registry. Known ids: ${known}`
    )
  }

  return lookup(DEFAULT_MODEL_ID)
}

