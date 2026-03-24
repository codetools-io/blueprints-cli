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
