import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { createTmpDir, cleanupTmpDir } from '../../../test/helpers/tmpDir.mjs'

const tmpBase = path.join(os.tmpdir(), 'bp-remove-action-test')
const projectBlueprintsPath = path.join(tmpBase, 'project-blueprints')
const globalBlueprintsPath = path.join(tmpBase, 'global-blueprints')

vi.mock('../../config.mjs', () => ({
  PROJECT_BLUEPRINTS_PATH: path.join(os.tmpdir(), 'bp-remove-action-test', 'project-blueprints'),
  GLOBAL_BLUEPRINTS_PATH: path.join(os.tmpdir(), 'bp-remove-action-test', 'global-blueprints'),
}))

import remove from './remove.mjs'

describe('remove', () => {
  beforeEach(async () => {
    await fs.ensureDir(projectBlueprintsPath)
    await fs.ensureDir(globalBlueprintsPath)
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
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

    await remove('my-bp', { global: false })

    expect(await fs.pathExists(bpPath)).toBe(false)
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('my-bp'))
  })

  it('removes a global blueprint when --global flag is set', async () => {
    const bpPath = path.join(globalBlueprintsPath, 'global-bp')
    await fs.ensureDir(bpPath)

    await remove('global-bp', { global: true })

    expect(await fs.pathExists(bpPath)).toBe(false)
  })

  it('logs error when blueprint does not exist', async () => {
    await remove('nonexistent-bp', { global: false })
    expect(console.error).toHaveBeenCalled()
  })
})
