import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { createTmpDir, cleanupTmpDir } from '../../../test/helpers/tmpDir.mjs'
import initialize from './initialize.mjs'

describe('initialize', () => {
  let tmpDir

  beforeEach(async () => {
    tmpDir = await createTmpDir('bp-init-test-')
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(async () => {
    await cleanupTmpDir(tmpDir)
    vi.restoreAllMocks()
  })

  it('creates .blueprints directory at given path', async () => {
    await initialize(tmpDir, {})
    const exists = await fs.pathExists(path.join(tmpDir, '.blueprints'))
    expect(exists).toBe(true)
  })

  it('logs success message with the blueprints path', async () => {
    await initialize(tmpDir, {})
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(path.join(tmpDir, '.blueprints'))
    )
  })

  it('is idempotent — does not fail if .blueprints already exists', async () => {
    await initialize(tmpDir, {})
    await expect(initialize(tmpDir, {})).resolves.not.toThrow()
  })

  it('creates .blueprints in current directory when no path given', async () => {
    const originalCwd = process.cwd()
    process.chdir(tmpDir)
    try {
      await initialize(undefined, {})
      const exists = await fs.pathExists(path.join(tmpDir, '.blueprints'))
      expect(exists).toBe(true)
    } finally {
      process.chdir(originalCwd)
      await fs.remove(path.join(tmpDir, '.blueprints'))
    }
  })
})
