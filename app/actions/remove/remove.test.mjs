import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { log } from '../../utilities.mjs'

const tmpBase = path.join(os.tmpdir(), 'bp-remove-action-test')
const projectBlueprintsPath = path.join(tmpBase, 'project-blueprints')
const globalBlueprintsPath = path.join(tmpBase, 'global-blueprints')

vi.mock('../../config.mjs', () => ({
  PROJECT_BLUEPRINTS_PATH: path.join(os.tmpdir(), 'bp-remove-action-test', 'project-blueprints'),
  GLOBAL_BLUEPRINTS_PATH: path.join(os.tmpdir(), 'bp-remove-action-test', 'global-blueprints'),
}))

import remove from './remove.mjs'

function makeCtx(json = false) {
  return { optsWithGlobals: () => ({ json }) }
}

describe('remove', () => {
  beforeEach(async () => {
    log.clear()
    log.jsonMode = false
    await fs.ensureDir(projectBlueprintsPath)
    await fs.ensureDir(globalBlueprintsPath)
  })

  afterEach(async () => {
    await fs.emptyDir(projectBlueprintsPath)
    await fs.emptyDir(globalBlueprintsPath)
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    await fs.remove(tmpBase)
  })

  it('removes a project blueprint by name', async () => {
    const bpPath = path.join(projectBlueprintsPath, 'my-bp')
    await fs.ensureDir(bpPath)

    const ctx = makeCtx()
    await remove.call(ctx, 'my-bp', { global: false })

    expect(await fs.pathExists(bpPath)).toBe(false)
    expect(ctx.output).toContain('my-bp')
  })

  it('removes a global blueprint when --global flag is set', async () => {
    const bpPath = path.join(globalBlueprintsPath, 'global-bp')
    await fs.ensureDir(bpPath)

    const ctx = makeCtx()
    await remove.call(ctx, 'global-bp', { global: true })

    expect(await fs.pathExists(bpPath)).toBe(false)
  })

  it('sets output to error message when blueprint does not exist', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const ctx = makeCtx()
    await remove.call(ctx, 'nonexistent-bp', { global: false })
    expect(console.error).toHaveBeenCalled()
  })

  it('returns JSON with success and location when --json flag is set', async () => {
    const bpPath = path.join(projectBlueprintsPath, 'my-bp')
    await fs.ensureDir(bpPath)

    const ctx = makeCtx(true)
    await remove.call(ctx, 'my-bp', { global: false })
    const parsed = JSON.parse(ctx.output)
    expect(parsed.success).toBe(true)
    expect(parsed.blueprint).toBe('my-bp')
  })
})
