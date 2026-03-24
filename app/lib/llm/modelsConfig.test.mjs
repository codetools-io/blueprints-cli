import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import { mergeRegistryFromLayers, loadMergedModelRegistry, getGlobalModelsPath, getProjectModelsPath } from './modelsConfig.mjs'
import { DEFAULT_MODEL_ID } from './builtinModels.mjs'

const builtins = [
  { id: 'gpt-4o-mini', provider: 'openai', model: 'gpt-4o-mini', label: 'mini' },
  { id: 'gpt-4o', provider: 'openai', model: 'gpt-4o', label: '4o' },
]

describe('mergeRegistryFromLayers', () => {
  it('starts from builtins when no layers', () => {
    const { entries, defaultModelId, configDefaultFromFile } = mergeRegistryFromLayers(builtins, [])
    expect(entries.map((e) => e.id).sort()).toEqual(['gpt-4o', 'gpt-4o-mini'])
    expect(defaultModelId).toBe(DEFAULT_MODEL_ID)
    expect(configDefaultFromFile).toBeNull()
  })

  it('adds custom ids and last defaultModel wins', () => {
    const { entries, defaultModelId } = mergeRegistryFromLayers(builtins, [
      { defaultModel: 'gpt-4o', models: [{ id: 'custom', provider: 'openai', model: 'o1' }] },
      { defaultModel: 'custom' },
    ])
    const ids = new Set(entries.map((e) => e.id))
    expect(ids.has('custom')).toBe(true)
    expect(defaultModelId).toBe('custom')
  })

  it('later layer overrides same id', () => {
    const { entries } = mergeRegistryFromLayers(builtins, [
      { models: [{ id: 'gpt-4o-mini', provider: 'openai', model: 'was-changed', label: 'v1' }] },
      { models: [{ id: 'gpt-4o-mini', provider: 'openai', model: 'final-name', label: 'v2' }] },
    ])
    const row = entries.find((e) => e.id === 'gpt-4o-mini')
    expect(row.model).toBe('final-name')
    expect(row.label).toBe('v2')
  })
})

describe('loadMergedModelRegistry', () => {
  let globalPath
  let projectPath

  beforeEach(() => {
    globalPath = getGlobalModelsPath()
    projectPath = getProjectModelsPath()
  })

  afterEach(async () => {
    await fs.remove(globalPath).catch(() => {})
    if (projectPath) await fs.remove(projectPath).catch(() => {})
  })

  it('reads global models.json when it exists', async () => {
    await fs.outputJson(globalPath, {
      defaultModel: 'custom-global',
      models: [{ id: 'custom-global', provider: 'openai', model: 'custom-model' }],
    })
    const { entries, defaultModelId } = await loadMergedModelRegistry()
    expect(entries.some((e) => e.id === 'custom-global')).toBe(true)
    expect(defaultModelId).toBe('custom-global')
  })

  it('reads project models.json when it exists', async () => {
    if (!projectPath) return
    await fs.outputJson(projectPath, {
      models: [{ id: 'proj-model', provider: 'anthropic', model: 'claude-test' }],
    })
    const { entries } = await loadMergedModelRegistry()
    expect(entries.some((e) => e.id === 'proj-model')).toBe(true)
  })
})

describe('getGlobalModelsPath', () => {
  it('returns a string ending with models.json', () => {
    const p = getGlobalModelsPath()
    expect(typeof p).toBe('string')
    expect(p.endsWith('models.json')).toBe(true)
  })
})

describe('getProjectModelsPath', () => {
  it('returns a string ending with models.json or null', () => {
    const p = getProjectModelsPath()
    if (p !== null) {
      expect(typeof p).toBe('string')
      expect(p.endsWith('models.json')).toBe(true)
    } else {
      expect(p).toBeNull()
    }
  })
})
