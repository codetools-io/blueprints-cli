import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import { TEST_CONFIG } from '../../../test/helpers/mockConfig.mjs'

vi.mock('../../config.mjs', () => ({
  PROJECT_BLUEPRINTS_PATH: TEST_CONFIG.PROJECT_BLUEPRINTS_PATH,
  GLOBAL_BLUEPRINTS_PATH: TEST_CONFIG.GLOBAL_BLUEPRINTS_PATH,
}))

vi.mock('../../lib/Blueprint/index.mjs', () => ({
  default: vi.fn().mockImplementation(function (opts) {
    this.name = opts.name
    this.location = opts.location
    this.config = {}
  }),
}))

import Blueprint from '../../lib/Blueprint/index.mjs'
import list from './list.mjs'

beforeEach(() => {
  // Reset Blueprint to the default implementation before each test
  Blueprint.mockImplementation(function (opts) {
    this.name = opts.name
    this.location = opts.location
    this.config = {}
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('list', () => {
  it('includes global blueprints section header in output', async () => {
    const ctx = {}
    await list.call(ctx, '', { long: false })
    expect(ctx.output).toContain('--- Global Blueprints ---')
  })

  it('includes project blueprints section header in output', async () => {
    const ctx = {}
    await list.call(ctx, '', { long: false })
    expect(ctx.output).toContain('--- Project Blueprints ---')
  })

  it('lists global blueprint names from fixture directory', async () => {
    const ctx = {}
    await list.call(ctx, '', { long: false })
    // test/fixtures/global-blueprints contains 'example' and 'example-2'
    expect(ctx.output).toContain('example')
  })

  it('lists project blueprint names from fixture directory', async () => {
    const ctx = {}
    await list.call(ctx, '', { long: false })
    // test/fixtures/project-example/.blueprints contains 'example'
    expect(ctx.output).toContain('example')
  })

  it('includes the blueprint location path in output', async () => {
    const ctx = {}
    await list.call(ctx, '', { long: false })
    expect(ctx.output).toContain(TEST_CONFIG.GLOBAL_BLUEPRINTS_PATH)
  })

  it('shows "no global blueprints found" when global dir does not exist', async () => {
    vi.spyOn(fs, 'pathExists').mockResolvedValue(false)
    const ctx = {}
    await list.call(ctx, '', { long: false })
    expect(ctx.output).toContain('no global blueprints found')
    expect(ctx.output).toContain('no project blueprints found')
  })

  it('shows description when --long flag and blueprint has description', async () => {
    // All Blueprint instances get a description so both global and project sections are covered
    Blueprint.mockImplementation(function (opts) {
      this.name = opts.name
      this.location = opts.location
      this.config = { description: 'A test blueprint description' }
    })
    const ctx = {}
    await list.call(ctx, '', { long: true })
    expect(ctx.output).toContain('Description: A test blueprint description')
  })

  it('does not show description when --long flag but no description set', async () => {
    const ctx = {}
    await list.call(ctx, '', { long: true })
    expect(ctx.output).not.toContain('Description:')
  })
})
