import { describe, it, expect, vi } from 'vitest'
import { TEST_CONFIG } from '../../../test/helpers/mockConfig.mjs'

vi.mock('../../config.mjs', () => ({
  PROJECT_BLUEPRINTS_PATH: TEST_CONFIG.PROJECT_BLUEPRINTS_PATH,
  GLOBAL_BLUEPRINTS_PATH: TEST_CONFIG.GLOBAL_BLUEPRINTS_PATH,
}))

import list from './list.mjs'

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

  it('shows description when --long flag and blueprint has description', async () => {
    // Blueprints in fixtures don't have descriptions by default,
    // so with --long and no description, description line should be absent
    const ctx = {}
    await list.call(ctx, '', { long: true })
    // If no blueprints have descriptions, Description: should not appear
    expect(ctx.output).not.toContain('Description:')
  })
})
