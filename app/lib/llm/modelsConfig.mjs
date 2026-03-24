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
 * Pure merge: builtins then each config layer in order (later overrides id).
 * @param {ModelEntry[]} builtinModels
 * @param {ModelsFile[]} layers parsed JSON objects (omit missing files)
 * @returns {{ entries: ModelEntry[], defaultModelId: string, configDefaultFromFile: string | null }}
 */
export function mergeRegistryFromLayers(builtinModels, layers) {
  const byId = new Map()
  for (const e of builtinModels) {
    byId.set(e.id, { ...e })
  }

  let configDefaultFromFile = null

  for (const raw of layers) {
    if (!raw) continue
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

  const entries = [...byId.values()]
  const defaultModelId = configDefaultFromFile || DEFAULT_MODEL_ID

  return { entries, defaultModelId, configDefaultFromFile }
}

/**
 * Merge builtins, then global file, then project file (later overrides earlier by id).
 * @returns {Promise<{ entries: ModelEntry[], defaultModelId: string, configDefaultFromFile: string | null }>}
 */
export async function loadMergedModelRegistry() {
  const layers = []
  if (await fs.pathExists(GLOBAL_MODELS_PATH)) {
    layers.push(await fs.readJson(GLOBAL_MODELS_PATH))
  }
  if (PROJECT_MODELS_PATH && (await fs.pathExists(PROJECT_MODELS_PATH))) {
    layers.push(await fs.readJson(PROJECT_MODELS_PATH))
  }
  return mergeRegistryFromLayers(BUILTIN_MODELS, layers)
}

export function getGlobalModelsPath() {
  return GLOBAL_MODELS_PATH
}

export function getProjectModelsPath() {
  return PROJECT_MODELS_PATH
}
