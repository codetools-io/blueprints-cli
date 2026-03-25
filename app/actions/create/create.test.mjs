import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import create from './create.mjs'
import createFromDirectory from './lib/createFromDirectory.mjs'
import createBlank from './lib/createBlank.mjs'
import { log } from '../../utilities.mjs'

vi.mock('./lib/createFromDirectory.mjs', () => ({ default: vi.fn() }))
vi.mock('./lib/createBlank.mjs', () => ({ default: vi.fn() }))

describe('create action', () => {
  let ctx

  beforeEach(() => {
    log.clear()
    log.jsonMode = false
    ctx = { args: [], optsWithGlobals: () => ({ json: false }) }
    createFromDirectory.mockResolvedValue({ message: 'bp was created at /some/path', location: '/some/path' })
    createBlank.mockResolvedValue({ message: 'bp was created at /some/path', location: '/some/path' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('routes to createFromDirectory when command.source is truthy', async () => {
    await create.call(ctx, 'my-bp', { source: '/some/dir' })
    expect(createFromDirectory).toHaveBeenCalledWith('my-bp', { source: '/some/dir' })
    expect(createBlank).not.toHaveBeenCalled()
  })

  it('routes to createBlank when command.source is falsy', async () => {
    await create.call(ctx, 'my-bp', { source: false })
    expect(createBlank).toHaveBeenCalledWith('my-bp', { source: false })
    expect(createFromDirectory).not.toHaveBeenCalled()
  })

  it('sets this.output to success message on success', async () => {
    createBlank.mockResolvedValue({ message: 'xyz was created at /the/path', location: '/the/path' })
    await create.call(ctx, 'xyz', { source: false })
    expect(ctx.output).toContain('xyz was created at /the/path')
  })

  it('sets this.output to error message on exception', async () => {
    createBlank.mockRejectedValue(new Error('something went wrong'))
    await create.call(ctx, 'xyz', { source: false })
    expect(ctx.output).toContain('something went wrong')
  })

  it('returns JSON with success and location when --json flag is set', async () => {
    ctx = { args: [], optsWithGlobals: () => ({ json: true }) }
    createBlank.mockResolvedValue({ message: 'bp was created at /the/path', location: '/the/path' })
    await create.call(ctx, 'my-bp', { source: false })
    const parsed = JSON.parse(ctx.output)
    expect(parsed.success).toBe(true)
    expect(parsed.blueprint).toBe('my-bp')
    expect(parsed.location).toBe('/the/path')
  })

  it('returns JSON error when --json flag is set and creation fails', async () => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => {})
    ctx = { args: [], optsWithGlobals: () => ({ json: true }) }
    createBlank.mockRejectedValue(new Error('blueprint exists'))
    await create.call(ctx, 'my-bp', { source: false })
    const written = process.stderr.write.mock.calls[0][0]
    const parsed = JSON.parse(written)
    expect(parsed.error.message).toContain('blueprint exists')
  })
})
