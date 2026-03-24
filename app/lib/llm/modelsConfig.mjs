import path from 'path'
import fs from 'fs-extra'
import { GLOBAL_BLUEPRINTS_PATH, PROJECT_BLUEPRINTS_PATH } from '../../config.mjs'
import { BUILTIN_MODELS, DEFAULT_MODEL_ID } from './builtinModels.mjs'

/**
 * @typedef {{ id: string, provider: string, model: string, label?: string, temperature?: number, maxTokens?: number }} ModelEntry
 * @typedef {{ defaultModel?: string, models?: ModelEntry[] }} ModelsFile
 */

const GLOBAL_MODELS_PATH = path.join(GLOBAL_BLUEPRINTS_PATH, 'models.json')
const PROJECT_MODELS_PATH = PROJECT_BLUEPRINTS_PATH
  ? path.join(PROJECT_BLUEPRINTS_PATH, 'models.json')
  : null

/**
 * Merge builtins, then global file, then project file (later overrides earlier by id).
 * @returns {Promise<{ entries: ModelEntry[], defaultModelId: string, configDefaultFromFile: string | null }>}
 */
export async function loadMergedModelRegistry() {
  const byId = new Map()
  for (const e of BUILTIN_MODELS) {
    byId.set(e.id, { ...e })
  }

  let configDefaultFromFile = null

  const applyFile = async (filePath) => {
    if (!filePath || !(await fs.pathExists(filePath))) return
    const raw = await fs.readJson(filePath)
    if (raw.defaultModel && typeof raw.defaultModel === 'string') {
      configDefaultFromFile = raw.defaultModel
    }
    const list = Array.isArray(raw.models) ? raw.models : []
    for (const m of list) {
      if (m && typeof m.id === 'string' && typeof m.provider === 'string' && typeof m.model === 'string') {
        const prev = byId.get(m.id) || {}
        byId.set(m.id, {
          ...prev,
          ...m,
          id: m.id,
          provider: m.provider,
          model: m.model,
        })
      }
    }
  }

  await applyFile(GLOBAL_MODELS_PATH)
  await applyFile(PROJECT_MODELS_PATH)

  const entries = [...byId.values()]
  const defaultModelId = configDefaultFromFile || DEFAULT_MODEL_ID

  return { entries, defaultModelId, configDefaultFromFile }
}

export function getGlobalModelsPath() {
  return GLOBAL_MODELS_PATH
}

export function getProjectModelsPath() {
  return PROJECT_MODELS_PATH
}
