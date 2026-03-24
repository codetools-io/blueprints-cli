import { describe, it, expect, vi, beforeEach } from 'vitest'
import modelsCommand from './models.mjs'
import { loadMergedModelRegistry, getGlobalModelsPath, getProjectModelsPath } from '../../lib/llm/modelsConfig.mjs'

vi.mock('../../lib/llm/modelsConfig.mjs', () => ({
  loadMergedModelRegistry: vi.fn(),
  getGlobalModelsPath: vi.fn().mockReturnValue('/global/models.json'),
  getProjectModelsPath: vi.fn().mockReturnValue('/project/models.json'),
}))

const baseEntries = [
  { id: 'gpt-4o-mini', provider: 'openai', model: 'gpt-4o-mini', label: 'mini' },
  { id: 'claude-haiku', provider: 'anthropic', model: 'claude-haiku-4-5', label: 'haiku' },
]

describe('models command', () => {
  let ctx

  beforeEach(() => {
    ctx = {}
    loadMergedModelRegistry.mockResolvedValue({ entries: baseEntries, defaultModelId: 'gpt-4o-mini' })
  })

  it('includes model ids in output', async () => {
    await modelsCommand.call(ctx)
    expect(ctx.output).toContain('gpt-4o-mini')
    expect(ctx.output).toContain('claude-haiku')
  })

  it('marks the default model with an asterisk', async () => {
    await modelsCommand.call(ctx)
    expect(ctx.output).toContain('gpt-4o-mini *')
  })

  it('does not mark non-default models with an asterisk', async () => {
    await modelsCommand.call(ctx)
    expect(ctx.output).not.toContain('claude-haiku *')
  })

  it('shows the global config path', async () => {
    await modelsCommand.call(ctx)
    expect(ctx.output).toContain('/global/models.json')
  })

  it('shows the project config path', async () => {
    await modelsCommand.call(ctx)
    expect(ctx.output).toContain('/project/models.json')
  })

  it('shows "(no project .blueprints)" when project path is null', async () => {
    getProjectModelsPath.mockReturnValue(null)
    await modelsCommand.call(ctx)
    expect(ctx.output).toContain('(no project .blueprints)')
  })

  it('sorts entries alphabetically by id', async () => {
    loadMergedModelRegistry.mockResolvedValue({
      entries: [{ id: 'zzz-model', provider: 'openai', model: 'x' }, { id: 'aaa-model', provider: 'openai', model: 'y' }],
      defaultModelId: 'aaa-model',
    })
    await modelsCommand.call(ctx)
    const aaaPos = ctx.output.indexOf('aaa-model')
    const zzzPos = ctx.output.indexOf('zzz-model')
    expect(aaaPos).toBeLessThan(zzzPos)
  })
})
