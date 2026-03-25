import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs-extra'
import { log } from '../../utilities.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const tmpBase = path.join(os.tmpdir(), 'bp-import-test')
const projectPath = path.join(tmpBase, 'project')

vi.mock('../../config.mjs', () => ({
  PROJECT_BLUEPRINTS_PATH: path.join(os.tmpdir(), 'bp-import-test', 'project'),
  GLOBAL_BLUEPRINTS_PATH: path.resolve(
    fileURLToPath(new URL('.', import.meta.url)),
    '../../../test/fixtures/global-blueprints'
  ),
}))

import _import from './import.mjs'

function makeCtx(json = false) {
  return { optsWithGlobals: () => ({ json }) }
}

describe('import action', () => {
  beforeEach(async () => {
    log.clear()
    log.jsonMode = false
    await fs.ensureDir(projectPath)
  })

  afterEach(async () => {
    await fs.remove(tmpBase)
    vi.restoreAllMocks()
  })

  it('imports a global blueprint to the project location', async () => {
    const ctx = makeCtx()
    await _import.call(ctx, 'example', 'my-example', {})
    expect(ctx.output).toContain('my-example')
    expect(await fs.pathExists(path.join(projectPath, 'my-example'))).toBe(true)
  })

  it('uses globalBlueprintName as local name when no localBlueprintName given', async () => {
    const ctx = makeCtx()
    await _import.call(ctx, 'example', undefined, {})
    expect(await fs.pathExists(path.join(projectPath, 'example'))).toBe(true)
  })

  it('logs an error when the global blueprint does not exist', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const ctx = makeCtx()
    await _import.call(ctx, 'nonexistent-bp', 'local-name', {})
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('nonexistent-bp'))
  })

  it('does not create the project directory when the source is missing', async () => {
    const ctx = makeCtx()
    await _import.call(ctx, 'nonexistent-bp', 'local-name', {})
    expect(await fs.pathExists(path.join(projectPath, 'local-name'))).toBe(false)
  })

  it('returns JSON with success and location when --json flag is set', async () => {
    const ctx = makeCtx(true)
    await _import.call(ctx, 'example', 'my-example', {})
    const parsed = JSON.parse(ctx.output)
    expect(parsed.success).toBe(true)
    expect(parsed.blueprint).toBe('example')
    expect(typeof parsed.location).toBe('string')
  })

  it('returns JSON error when --json flag is set and global blueprint does not exist', async () => {
    vi.spyOn(process.stderr, 'write').mockImplementation(() => {})
    const ctx = makeCtx(true)
    await _import.call(ctx, 'nonexistent-bp', 'local-name', {})
    const written = process.stderr.write.mock.calls[0][0]
    const parsed = JSON.parse(written)
    expect(parsed.error.message).toContain('nonexistent-bp')
  })
})
