import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { log } from '../../utilities.mjs'
import { createTmpDir, cleanupTmpDir } from '../../../test/helpers/tmpDir.mjs'
import initialize from './initialize.mjs'

function makeCtx(json = false) {
  return { optsWithGlobals: () => ({ json }) }
}

describe('initialize', () => {
  let tmpDir

  beforeEach(async () => {
    log.clear()
    log.jsonMode = false
    tmpDir = await createTmpDir('bp-init-test-')
  })

  afterEach(async () => {
    await cleanupTmpDir(tmpDir)
    vi.restoreAllMocks()
  })

  it('creates .blueprints directory at given path', async () => {
    const ctx = makeCtx()
    await initialize.call(ctx, tmpDir, {})
    const exists = await fs.pathExists(path.join(tmpDir, '.blueprints'))
    expect(exists).toBe(true)
  })

  it('sets output with the blueprints path', async () => {
    const ctx = makeCtx()
    await initialize.call(ctx, tmpDir, {})
    expect(ctx.output).toContain(path.join(tmpDir, '.blueprints'))
  })

  it('is idempotent — does not fail if .blueprints already exists', async () => {
    const ctx = makeCtx()
    await initialize.call(ctx, tmpDir, {})
    await expect(initialize.call(makeCtx(), tmpDir, {})).resolves.not.toThrow()
  })

  it('creates .blueprints in current directory when no path given', async () => {
    const originalCwd = process.cwd()
    process.chdir(tmpDir)
    try {
      const ctx = makeCtx()
      await initialize.call(ctx, undefined, {})
      const exists = await fs.pathExists(path.join(tmpDir, '.blueprints'))
      expect(exists).toBe(true)
    } finally {
      process.chdir(originalCwd)
      await fs.remove(path.join(tmpDir, '.blueprints'))
    }
  })

  it('returns JSON with success and location when --json flag is set', async () => {
    const ctx = makeCtx(true)
    await initialize.call(ctx, tmpDir, {})
    const parsed = JSON.parse(ctx.output)
    expect(parsed.success).toBe(true)
    expect(parsed.location).toContain('.blueprints')
  })
})
