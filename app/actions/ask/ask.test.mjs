import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ask from './ask.mjs'
import { getBlueprintPath, log } from '../../utilities.mjs'
import { createStructuredChatModel } from '../../lib/llm/createStructuredChatModel.mjs'
import { loadMergedModelRegistry } from '../../lib/llm/modelsConfig.mjs'
import { createTmpDir, cleanupTmpDir } from '../../../test/helpers/tmpDir.mjs'
import path from 'path'

vi.mock('../../utilities.mjs', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, getBlueprintPath: vi.fn() }
})
vi.mock('../../config.mjs', () => ({
  CURRENT_PATH: '/mock/cwd',
  GLOBAL_BLUEPRINTS_PATH: '/mock/global',
  PROJECT_BLUEPRINTS_PATH: '/mock/project',
}))
vi.mock('../../lib/llm/createStructuredChatModel.mjs', () => ({
  createStructuredChatModel: vi.fn(),
}))
vi.mock('../../lib/llm/modelsConfig.mjs', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    loadMergedModelRegistry: vi.fn().mockResolvedValue({
      entries: [{ id: 'gpt-4o-mini', provider: 'openai', model: 'gpt-4o-mini', temperature: 0 }],
      defaultModelId: 'gpt-4o-mini',
    }),
  }
})

// Mock Blueprint so AI generation is fully controlled
const mockGenerate = vi.fn()
vi.mock('../../lib/Blueprint/index.mjs', () => ({
  default: vi.fn().mockImplementation(function (opts) {
    this.name = opts.name
    this.location = opts.location
    this.generate = mockGenerate
  }),
}))

describe('ask action', () => {
  let dest

  beforeEach(async () => {
    log.clear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    dest = await createTmpDir('bp-ask-test-')
    mockGenerate.mockResolvedValue(undefined)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await cleanupTmpDir(dest)
  })

  it('logs error and returns early when blueprint is not found', async () => {
    getBlueprintPath.mockReturnValue(null)
    const ctx = { args: ['node', 'bp', 'ghost', 'Inst'] }
    await ask.call(ctx, 'ghost', 'Inst', { dest, opts: () => ({}) })
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Blueprint not found'))
    expect(mockGenerate).not.toHaveBeenCalled()
  })

  it('calls blueprint.generate with AI mode and destination', async () => {
    getBlueprintPath.mockReturnValue('/mock/bp/path')
    const ctx = { args: ['node', 'bp', 'example', 'Alice'] }
    await ask.call(ctx, 'example', 'Alice', { dest, opts: () => ({}) })
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ destination: dest, mode: 'ai' })
    )
  })

  it('sets this.output on success', async () => {
    getBlueprintPath.mockReturnValue('/mock/bp/path')
    log.success('generated instance with AI')
    const ctx = { args: ['node', 'bp', 'example', 'Alice'] }
    await ask.call(ctx, 'example', 'Alice', { dest, opts: () => ({}) })
    expect(typeof ctx.output).toBe('string')
  })

  it('handles errors gracefully without propagating', async () => {
    getBlueprintPath.mockReturnValue('/mock/bp/path')
    mockGenerate.mockRejectedValue(new Error('AI API failure'))
    const ctx = { args: ['node', 'bp', 'example', 'Alice'] }
    await expect(
      ask.call(ctx, 'example', 'Alice', { dest, opts: () => ({}) })
    ).resolves.not.toThrow()
  })

  it('passes cliModelWasExplicit=true when model option is present', async () => {
    getBlueprintPath.mockReturnValue('/mock/bp/path')
    const ctx = { args: ['node', 'bp', 'example', 'Alice'] }
    await ask.call(ctx, 'example', 'Alice', { dest, opts: () => ({ model: 'gpt-4o-mini' }) })
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ cliModelWasExplicit: true, modelId: 'gpt-4o-mini' })
    )
  })

  it('passes cliModelWasExplicit=false when no model option', async () => {
    getBlueprintPath.mockReturnValue('/mock/bp/path')
    const ctx = { args: ['node', 'bp', 'example', 'Alice'] }
    await ask.call(ctx, 'example', 'Alice', { dest, opts: () => ({}) })
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ cliModelWasExplicit: false })
    )
  })

  it('uses CURRENT_PATH as destination when no dest option given', async () => {
    getBlueprintPath.mockReturnValue('/mock/bp/path')
    const ctx = { args: ['node', 'bp', 'example', 'Alice'] }
    await ask.call(ctx, 'example', 'Alice', { opts: () => ({}) })
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ destination: '/mock/cwd' })
    )
  })
})
