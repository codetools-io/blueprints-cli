import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import { fileURLToPath } from 'url'
import createFromDirectory from './createFromDirectory.mjs'

const tmpBase = path.join(os.tmpdir(), 'bp-cfdir-test')
const blueprintsPath = path.join(tmpBase, '.blueprints')
const globalPath = path.join(tmpBase, 'global')
const sourceDir = path.join(tmpBase, 'source-dir')

vi.mock('../../../config.mjs', async () => {
  const os = await import('os')
  const path = await import('path')
  const base = path.default.join(os.default.tmpdir(), 'bp-cfdir-test')
  return {
    // CURRENT_PATH points to source-dir so an empty-string source falls back to it safely
    CURRENT_PATH: path.default.join(base, 'source-dir'),
    PROJECT_BLUEPRINTS_PATH: path.default.join(base, '.blueprints'),
    GLOBAL_BLUEPRINTS_PATH: path.default.join(base, 'global'),
  }
})

describe('createFromDirectory', () => {
  beforeAll(async () => {
    await fs.ensureDir(blueprintsPath)
    await fs.ensureDir(globalPath)
    await fs.outputFile(path.join(sourceDir, 'hello.txt'), 'hello world')
  })

  afterAll(async () => {
    await fs.remove(tmpBase)
  })

  beforeEach(async () => {
    // Clean up blueprints created by previous tests
    const bpDirs = await fs.readdir(blueprintsPath).catch(() => [])
    for (const d of bpDirs) {
      await fs.remove(path.join(blueprintsPath, d))
    }
    const globalDirs = await fs.readdir(globalPath).catch(() => [])
    for (const d of globalDirs) {
      await fs.remove(path.join(globalPath, d))
    }
  })

  it('throws when a blueprint with the same name already exists', async () => {
    await fs.ensureDir(path.join(blueprintsPath, 'existing-bp'))
    await expect(
      createFromDirectory('existing-bp', { source: sourceDir, global: false })
    ).rejects.toThrow('A blueprint called existing-bp already exists')
  })

  it('creates blueprint.json with preGenerate and postGenerate arrays', async () => {
    await createFromDirectory('new-bp', { source: sourceDir, global: false })
    const config = await fs.readJson(path.join(blueprintsPath, 'new-bp', 'blueprint.json'))
    expect(config).toHaveProperty('preGenerate')
    expect(config).toHaveProperty('postGenerate')
    expect(Array.isArray(config.preGenerate)).toBe(true)
  })

  it('creates preGenerate and postGenerate script files', async () => {
    await createFromDirectory('script-bp', { source: sourceDir, global: false })
    const location = path.join(blueprintsPath, 'script-bp')
    expect(await fs.pathExists(path.join(location, 'scripts/preGenerate.js'))).toBe(true)
    expect(await fs.pathExists(path.join(location, 'scripts/postGenerate.js'))).toBe(true)
  })

  it('copies source directory into files/__blueprintInstance__', async () => {
    await createFromDirectory('copy-bp', { source: sourceDir, global: false })
    const dest = path.join(blueprintsPath, 'copy-bp', 'files/__blueprintInstance__/hello.txt')
    expect(await fs.pathExists(dest)).toBe(true)
  })

  it('creates in project location when global is false', async () => {
    await createFromDirectory('proj-bp', { source: sourceDir, global: false })
    expect(await fs.pathExists(path.join(blueprintsPath, 'proj-bp'))).toBe(true)
    expect(await fs.pathExists(path.join(globalPath, 'proj-bp'))).toBe(false)
  })

  it('creates in global location when global is true', async () => {
    await createFromDirectory('glob-bp', { source: sourceDir, global: true })
    expect(await fs.pathExists(path.join(globalPath, 'glob-bp'))).toBe(true)
    expect(await fs.pathExists(path.join(blueprintsPath, 'glob-bp'))).toBe(false)
  })

  it('uses CURRENT_PATH as source when command.source is an empty string', async () => {
    // When source is '', command.source.length is 0, so CURRENT_PATH is used.
    // CURRENT_PATH = tmpBase which has source-dir inside it; the copy succeeds.
    const result = await createFromDirectory('empty-src-bp', { source: '', global: false })
    expect(result.success).toBe(true)
  })

  it('returns { success: true, message } on success', async () => {
    const result = await createFromDirectory('ret-bp', { source: sourceDir, global: false })
    expect(result.success).toBe(true)
    expect(result.message).toContain('ret-bp')
  })
})
