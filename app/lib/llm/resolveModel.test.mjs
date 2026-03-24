import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { resolveModelSelection } from './resolveModel.mjs'
import { DEFAULT_MODEL_ID } from './builtinModels.mjs'

const entries = [
  { id: 'alpha', provider: 'openai', model: 'alpha-model' },
  { id: 'beta', provider: 'anthropic', model: 'beta-model' },
]

describe('resolveModelSelection', () => {
  const env = { ...process.env }

  beforeEach(() => {
    process.env.BP_MODEL = undefined
    process.env.OPENAI_MODEL = undefined
  })

  afterEach(() => {
    process.env = { ...env }
  })

  it('uses explicit CLI id when provided', () => {
    const r = resolveModelSelection({
      cliModelId: 'beta',
      cliModelWasExplicit: true,
      entries,
      fileDefaultModelId: DEFAULT_MODEL_ID,
      blueprintModelId: undefined,
    })
    expect(r.provider).toBe('anthropic')
    expect(r.model).toBe('beta-model')
  })

  it('throws when explicit CLI id is missing', () => {
    expect(() =>
      resolveModelSelection({
        cliModelId: undefined,
        cliModelWasExplicit: true,
        entries,
        fileDefaultModelId: DEFAULT_MODEL_ID,
        blueprintModelId: undefined,
      })
    ).toThrow(/Missing value for --model/)
  })

  it('prefers BP_MODEL over blueprint and OPENAI_MODEL', () => {
    process.env.BP_MODEL = 'alpha'
    process.env.OPENAI_MODEL = 'should-not-use'
    const r = resolveModelSelection({
      cliModelId: undefined,
      cliModelWasExplicit: false,
      entries,
      fileDefaultModelId: 'beta',
      blueprintModelId: 'beta',
    })
    expect(r.id).toBe('alpha')
  })

  it('uses blueprint model when no CLI or BP_MODEL', () => {
    const r = resolveModelSelection({
      cliModelId: undefined,
      cliModelWasExplicit: false,
      entries,
      fileDefaultModelId: DEFAULT_MODEL_ID,
      blueprintModelId: 'beta',
    })
    expect(r.id).toBe('beta')
  })

  it('uses OPENAI_MODEL as raw OpenAI when no registry id applies', () => {
    process.env.OPENAI_MODEL = 'custom-openai'
    const r = resolveModelSelection({
      cliModelId: undefined,
      cliModelWasExplicit: false,
      entries,
      fileDefaultModelId: DEFAULT_MODEL_ID,
      blueprintModelId: undefined,
    })
    expect(r.id).toBeNull()
    expect(r.provider).toBe('openai')
    expect(r.model).toBe('custom-openai')
  })

  it('uses file default when OPENAI_MODEL unset', () => {
    const r = resolveModelSelection({
      cliModelId: undefined,
      cliModelWasExplicit: false,
      entries,
      fileDefaultModelId: 'beta',
      blueprintModelId: undefined,
    })
    expect(r.id).toBe('beta')
  })

  it('throws for unknown explicit cli model id', () => {
    expect(() =>
      resolveModelSelection({
        cliModelId: 'unknown-model',
        cliModelWasExplicit: true,
        entries,
        fileDefaultModelId: DEFAULT_MODEL_ID,
        blueprintModelId: undefined,
      })
    ).toThrow(/Unknown model id "unknown-model"/)
  })

  it('throws when fileDefaultModelId is set but not in registry', () => {
    expect(() =>
      resolveModelSelection({
        cliModelId: undefined,
        cliModelWasExplicit: false,
        entries,
        fileDefaultModelId: 'missing-default',
        blueprintModelId: undefined,
      })
    ).toThrow(/defaultModel "missing-default" is not defined/)
  })

  it('falls back to DEFAULT_MODEL_ID when fileDefaultModelId is null', () => {
    const entriesWithDefault = [
      ...entries,
      { id: DEFAULT_MODEL_ID, provider: 'openai', model: DEFAULT_MODEL_ID },
    ]
    const r = resolveModelSelection({
      cliModelId: undefined,
      cliModelWasExplicit: false,
      entries: entriesWithDefault,
      fileDefaultModelId: null,
      blueprintModelId: undefined,
    })
    expect(r.id).toBe(DEFAULT_MODEL_ID)
  })
})
