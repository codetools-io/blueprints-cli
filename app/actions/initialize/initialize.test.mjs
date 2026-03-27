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

  it('creates .blueprints/README.md', async () => {
    await initialize.call(makeCtx(), tmpDir, {})
    const exists = await fs.pathExists(path.join(tmpDir, '.blueprints', 'README.md'))
    expect(exists).toBe(true)
  })

  it('creates .claude/skills/blueprints/SKILL.md with Claude frontmatter', async () => {
    await initialize.call(makeCtx(), tmpDir, {})
    const filePath = path.join(tmpDir, '.claude', 'skills', 'blueprints', 'SKILL.md')
    const exists = await fs.pathExists(filePath)
    expect(exists).toBe(true)
    const content = await fs.readFile(filePath, 'utf-8')
    expect(content).toContain('allowed-tools:')
  })

  it('creates .cursor/rules/blueprints.mdc with Cursor frontmatter', async () => {
    await initialize.call(makeCtx(), tmpDir, {})
    const filePath = path.join(tmpDir, '.cursor', 'rules', 'blueprints.mdc')
    const exists = await fs.pathExists(filePath)
    expect(exists).toBe(true)
    const content = await fs.readFile(filePath, 'utf-8')
    expect(content).toContain('alwaysApply:')
  })

  it('creates AGENTS.md at project root', async () => {
    await initialize.call(makeCtx(), tmpDir, {})
    const exists = await fs.pathExists(path.join(tmpDir, 'AGENTS.md'))
    expect(exists).toBe(true)
  })

  it('does not overwrite pre-existing files', async () => {
    const readmePath = path.join(tmpDir, '.blueprints', 'README.md')
    await fs.ensureDir(path.join(tmpDir, '.blueprints'))
    await fs.writeFile(readmePath, 'DO NOT OVERWRITE')

    await initialize.call(makeCtx(), tmpDir, {})

    const content = await fs.readFile(readmePath, 'utf-8')
    expect(content).toBe('DO NOT OVERWRITE')
  })

  it('JSON output includes files array with 4 entries', async () => {
    const ctx = makeCtx(true)
    await initialize.call(ctx, tmpDir, {})
    const parsed = JSON.parse(ctx.output)
    expect(Array.isArray(parsed.files)).toBe(true)
    expect(parsed.files).toHaveLength(4)
    parsed.files.forEach((entry) => {
      expect(entry).toHaveProperty('file')
      expect(entry).toHaveProperty('status')
    })
  })

  it('JSON reports skipped for pre-existing files', async () => {
    const agentsPath = path.join(tmpDir, 'AGENTS.md')
    await fs.writeFile(agentsPath, 'existing content')

    const ctx = makeCtx(true)
    await initialize.call(ctx, tmpDir, {})
    const parsed = JSON.parse(ctx.output)

    const agentsEntry = parsed.files.find((f) => f.file === agentsPath)
    expect(agentsEntry).toBeDefined()
    expect(agentsEntry.status).toBe('skipped')
  })

  it('idempotent — second call does not throw with all files present', async () => {
    await initialize.call(makeCtx(), tmpDir, {})
    await expect(initialize.call(makeCtx(), tmpDir, {})).resolves.not.toThrow()
  })
})
