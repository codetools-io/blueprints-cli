import { describe, it, expect } from 'vitest'
import { mergeRegistryFromLayers } from './modelsConfig.mjs'
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
