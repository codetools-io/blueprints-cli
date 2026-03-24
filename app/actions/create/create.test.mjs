import { describe, it, expect, vi, beforeEach } from 'vitest'
import create from './create.mjs'
import createFromDirectory from './lib/createFromDirectory.mjs'
import createBlank from './lib/createBlank.mjs'

vi.mock('./lib/createFromDirectory.mjs', () => ({ default: vi.fn() }))
vi.mock('./lib/createBlank.mjs', () => ({ default: vi.fn() }))

describe('create action', () => {
  let ctx

  beforeEach(() => {
    ctx = { args: [] }
    createFromDirectory.mockResolvedValue({ message: 'bp was created at /some/path' })
    createBlank.mockResolvedValue({ message: 'bp was created at /some/path' })
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
    createBlank.mockResolvedValue({ message: 'xyz was created at /the/path' })
    await create.call(ctx, 'xyz', { source: false })
    expect(ctx.output).toContain('xyz was created at /the/path')
  })

  it('sets this.output to error message on exception', async () => {
    createBlank.mockRejectedValue(new Error('something went wrong'))
    await create.call(ctx, 'xyz', { source: false })
    expect(ctx.output).toContain('something went wrong')
  })
})
