import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs-extra'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const fixturesPath = path.resolve(__dirname, '../../../test/fixtures')
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

describe('import action', () => {
  beforeEach(async () => {
    await fs.ensureDir(projectPath)
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(async () => {
    await fs.remove(tmpBase)
    vi.restoreAllMocks()
  })

  it('imports a global blueprint to the project location', async () => {
    await _import('example', 'my-example', {})
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('my-example'))
    expect(await fs.pathExists(path.join(projectPath, 'my-example'))).toBe(true)
  })

  it('uses globalBlueprintName as local name when no localBlueprintName given', async () => {
    await _import('example', undefined, {})
    expect(await fs.pathExists(path.join(projectPath, 'example'))).toBe(true)
  })

  it('logs an error when the global blueprint does not exist', async () => {
    await _import('nonexistent-bp', 'local-name', {})
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('nonexistent-bp'))
  })

  it('does not create the project directory when the source is missing', async () => {
    await _import('nonexistent-bp', 'local-name', {})
    expect(await fs.pathExists(path.join(projectPath, 'local-name'))).toBe(false)
  })
})
