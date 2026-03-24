import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import { fileURLToPath } from 'url'
import generate from './generate.mjs'
import { getBlueprintPath, log } from '../../utilities.mjs'
import { createTmpDir, cleanupTmpDir } from '../../../test/helpers/tmpDir.mjs'

vi.mock('../../utilities.mjs', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, getBlueprintPath: vi.fn() }
})
vi.mock('../../config.mjs', () => ({
  CURRENT_PATH: '/mock/cwd',
  GLOBAL_BLUEPRINTS_PATH: '/mock/global',
  PROJECT_BLUEPRINTS_PATH: '/mock/project',
}))

// Mock Blueprint so we control generate() without real filesystem/hook side-effects
const mockGenerate = vi.fn()
vi.mock('../../lib/Blueprint/index.mjs', () => ({
  default: vi.fn().mockImplementation(function (opts) {
    this.name = opts.name
    this.location = opts.location
    this.generate = mockGenerate
  }),
}))

describe('generate action', () => {
  let dest

  beforeEach(async () => {
    log.clear()
    vi.spyOn(process, 'exit').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    dest = await createTmpDir('bp-generate-test-')
    mockGenerate.mockResolvedValue(undefined)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await cleanupTmpDir(dest)
  })

  it('logs error and returns early when blueprint is not found', async () => {
    getBlueprintPath.mockReturnValue(null)
    const ctx = { args: ['node', 'bp', 'ghost', 'Inst'] }
    await generate.call(ctx, 'ghost', 'Inst', { dest })
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Blueprint not found'))
    expect(process.exit).not.toHaveBeenCalled()
  })

  it('calls blueprint.generate with scaffold mode and destination', async () => {
    getBlueprintPath.mockReturnValue('/mock/bp/path')
    const ctx = { args: ['node', 'bp', 'example', 'Alice'] }
    await generate.call(ctx, 'example', 'Alice', { dest })
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ destination: dest, mode: 'scaffold' })
    )
  })

  it('calls process.exit(0) on success', async () => {
    getBlueprintPath.mockReturnValue('/mock/bp/path')
    const ctx = { args: ['node', 'bp', 'example', 'Alice'] }
    await generate.call(ctx, 'example', 'Alice', { dest })
    expect(process.exit).toHaveBeenCalledWith(0)
  })

  it('calls process.exit(1) on error', async () => {
    getBlueprintPath.mockReturnValue('/mock/bp/path')
    mockGenerate.mockRejectedValue(new Error('generation failed'))
    const ctx = { args: ['node', 'bp', 'broken', 'Inst'] }
    await generate.call(ctx, 'broken', 'Inst', { dest })
    expect(process.exit).toHaveBeenCalledWith(1)
  })

  it('sets this.output on success', async () => {
    getBlueprintPath.mockReturnValue('/mock/bp/path')
    log.success('generated instance')
    const ctx = { args: ['node', 'bp', 'example', 'Bob'] }
    await generate.call(ctx, 'example', 'Bob', { dest })
    expect(typeof ctx.output).toBe('string')
  })

  it('uses CURRENT_PATH as destination when no dest option given', async () => {
    getBlueprintPath.mockReturnValue('/mock/bp/path')
    const ctx = { args: ['node', 'bp', 'example', 'Alice'] }
    await generate.call(ctx, 'example', 'Alice', {})
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ destination: '/mock/cwd' })
    )
  })
})
