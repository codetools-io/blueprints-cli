import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const tmpBase = path.join(os.tmpdir(), 'bp-create-blank-test')
const projectBlueprintsPath = path.join(tmpBase, '.blueprints')
const globalBlueprintsPath = path.join(tmpBase, 'global')

vi.mock('../../../config.mjs', () => ({
  PROJECT_ROOT_PATH: path.join(os.tmpdir(), 'bp-create-blank-test'),
  GLOBAL_BLUEPRINTS_PATH: path.join(os.tmpdir(), 'bp-create-blank-test', 'global'),
}))

import createBlank from './createBlank.mjs'

beforeAll(async () => {
  await fs.ensureDir(projectBlueprintsPath)
  await fs.ensureDir(globalBlueprintsPath)
})

afterAll(async () => {
  await fs.remove(tmpBase)
})

beforeEach(async () => {
  await fs.emptyDir(projectBlueprintsPath)
  await fs.emptyDir(globalBlueprintsPath)
})

describe('createBlank', () => {
  it('throws when no blueprintName is provided', async () => {
    await expect(createBlank()).rejects.toThrow('requires a name')
  })

  it('returns success with message on creation', async () => {
    const result = await createBlank('my-bp')
    expect(result.success).toBe(true)
    expect(result.message).toContain('my-bp')
  })

  it('creates blueprint.json with correct schema', async () => {
    await createBlank('my-bp')
    const bpJson = await fs.readJson(path.join(projectBlueprintsPath, 'my-bp/blueprint.json'))
    expect(bpJson).toMatchObject({
      preGenerate: ['scripts/preGenerate.mjs'],
      postGenerate: ['scripts/postGenerate.mjs'],
      prompts: ['prompts/default.md'],
    })
  })

  it('creates files/__blueprintInstance__ directory', async () => {
    await createBlank('my-bp')
    const exists = await fs.pathExists(
      path.join(projectBlueprintsPath, 'my-bp/files/__blueprintInstance__')
    )
    expect(exists).toBe(true)
  })

  it('creates prompts/default.md with frontmatter', async () => {
    await createBlank('my-bp')
    const content = await fs.readFile(
      path.join(projectBlueprintsPath, 'my-bp/prompts/default.md'),
      'utf8'
    )
    expect(content).toContain('input_variables:')
    expect(content).toContain('template_variables')
  })

  it('creates preGenerate and postGenerate scripts', async () => {
    await createBlank('my-bp')
    const preExists = await fs.pathExists(
      path.join(projectBlueprintsPath, 'my-bp/scripts/preGenerate.mjs')
    )
    const postExists = await fs.pathExists(
      path.join(projectBlueprintsPath, 'my-bp/scripts/postGenerate.mjs')
    )
    expect(preExists).toBe(true)
    expect(postExists).toBe(true)
  })

  it('creates files/__blueprintInstance__ when no --file flags given', async () => {
    await createBlank('no-files-bp')
    const exists = await fs.pathExists(
      path.join(projectBlueprintsPath, 'no-files-bp/files/__blueprintInstance__')
    )
    expect(exists).toBe(true)
  })

  it('creates specified file with no content when --file has no colon', async () => {
    await createBlank('file-bp', { file: ['__blueprintInstance__/index.ts'] })
    const filePath = path.join(projectBlueprintsPath, 'file-bp/files/__blueprintInstance__/index.ts')
    const exists = await fs.pathExists(filePath)
    expect(exists).toBe(true)
    const content = await fs.readFile(filePath, 'utf8')
    expect(content).toBe('')
  })

  it('unescapes \\n, \\t, \\r, and \\\\ in inline content', async () => {
    await createBlank('escape-bp', {
      file: ['__blueprintInstance__/index.ts:line1\\nline2\\ttabbed\\\\backslash'],
    })
    const content = await fs.readFile(
      path.join(projectBlueprintsPath, 'escape-bp/files/__blueprintInstance__/index.ts'),
      'utf8'
    )
    expect(content).toBe('line1\nline2\ttabbed\\backslash')
  })

  it('creates specified file with inline content when --file uses colon separator', async () => {
    await createBlank('content-bp', {
      file: ['__blueprintInstance__/index.ts:export default function {{ blueprintInstance_ClassFormat }}() {}'],
    })
    const filePath = path.join(projectBlueprintsPath, 'content-bp/files/__blueprintInstance__/index.ts')
    const content = await fs.readFile(filePath, 'utf8')
    expect(content).toBe('export default function {{ blueprintInstance_ClassFormat }}() {}')
  })

  it('creates all files when multiple --file flags are given', async () => {
    await createBlank('multi-file-bp', {
      file: ['__blueprintInstance__/index.ts', '__blueprintInstance__/index.test.ts'],
    })
    const base = path.join(projectBlueprintsPath, 'multi-file-bp/files/__blueprintInstance__')
    expect(await fs.pathExists(path.join(base, 'index.ts'))).toBe(true)
    expect(await fs.pathExists(path.join(base, 'index.test.ts'))).toBe(true)
  })

  it('does not create files/__blueprintInstance__ dir when --file flags are given', async () => {
    await createBlank('explicit-files-bp', { file: ['src/helper.ts'] })
    const defaultDir = path.join(
      projectBlueprintsPath,
      'explicit-files-bp/files/__blueprintInstance__'
    )
    const exists = await fs.pathExists(defaultDir)
    expect(exists).toBe(false)
  })

  it('throws when blueprint already exists', async () => {
    await createBlank('my-bp')
    await expect(createBlank('my-bp')).rejects.toThrow('already exists')
  })

  it('creates in GLOBAL_BLUEPRINTS_PATH when global option is true', async () => {
    const result = await createBlank('global-bp', { global: true })
    const exists = await fs.pathExists(path.join(globalBlueprintsPath, 'global-bp/blueprint.json'))
    expect(exists).toBe(true)
    expect(result.message).toContain(globalBlueprintsPath)
  })

  it('creates in project .blueprints when global is false', async () => {
    const result = await createBlank('proj-bp', { global: false })
    const exists = await fs.pathExists(path.join(projectBlueprintsPath, 'proj-bp/blueprint.json'))
    expect(exists).toBe(true)
    expect(result.message).toContain(projectBlueprintsPath)
  })
})
