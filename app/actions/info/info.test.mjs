import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import { fileURLToPath } from 'url'
import { log } from '../../utilities.mjs'
import { getBlueprintPath } from '../../utilities.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const fixtureBlueprint = path.resolve(__dirname, '../../../test/fixtures/blueprints/example')

vi.mock('../../utilities.mjs', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, getBlueprintPath: vi.fn() }
})

vi.mock('../../config.mjs', () => ({
  CURRENT_PATH: '/mock/cwd',
  GLOBAL_BLUEPRINTS_PATH: '/mock/global',
  PROJECT_BLUEPRINTS_PATH: '/mock/project',
}))

import info, { getInfoResult } from './info.mjs'

function makeCtx(json = false) {
  return { optsWithGlobals: () => ({ json }) }
}

describe('info action', () => {
  beforeEach(() => {
    log.clear()
    log.jsonMode = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getInfoResult', () => {
    it('throws BLUEPRINT_NOT_FOUND when blueprint does not exist', async () => {
      getBlueprintPath.mockReturnValue(null)
      await expect(getInfoResult('ghost')).rejects.toMatchObject({
        code: 'BLUEPRINT_NOT_FOUND',
      })
    })

    it('returns name and location for a known blueprint', async () => {
      getBlueprintPath.mockReturnValue(fixtureBlueprint)
      const result = await getInfoResult('example')
      expect(result.name).toBe('example')
      expect(result.location).toBe(fixtureBlueprint)
    })

    it('finds user-defined variable from file content ({{name}})', async () => {
      getBlueprintPath.mockReturnValue(fixtureBlueprint)
      const result = await getInfoResult('example')
      const varNames = result.requiredVariables.map((v) => v.name)
      expect(varNames).toContain('name')
    })

    it('finds user-defined variable from file name (__name__)', async () => {
      getBlueprintPath.mockReturnValue(fixtureBlueprint)
      const result = await getInfoResult('example')
      const varNames = result.requiredVariables.map((v) => v.name)
      expect(varNames).toContain('name')
    })

    it('does NOT include auto-generated metadata keys in required variables', async () => {
      getBlueprintPath.mockReturnValue(fixtureBlueprint)
      const result = await getInfoResult('example')
      const varNames = result.requiredVariables.map((v) => v.name)
      expect(varNames).not.toContain('blueprintInstance')
      expect(varNames).not.toContain('blueprintInstance_ClassFormat')
      expect(varNames).not.toContain('blueprint')
      expect(varNames).not.toContain('blueprintInstanceDestination')
    })

    it('returns null default for variables with no default set', async () => {
      getBlueprintPath.mockReturnValue(fixtureBlueprint)
      const result = await getInfoResult('example')
      const nameVar = result.requiredVariables.find((v) => v.name === 'name')
      expect(nameVar.default).toBeNull()
    })

    it('includes hooks from blueprint.json', async () => {
      getBlueprintPath.mockReturnValue(fixtureBlueprint)
      const result = await getInfoResult('example')
      expect(result.hooks).toHaveProperty('preGenerate')
      expect(result.hooks).toHaveProperty('postGenerate')
    })
  })

  describe('info command action', () => {
    it('outputs JSON when --json flag is set', async () => {
      getBlueprintPath.mockReturnValue(fixtureBlueprint)
      const ctx = makeCtx(true)
      await info.call(ctx, 'example')
      const parsed = JSON.parse(ctx.output)
      expect(parsed.name).toBe('example')
      expect(Array.isArray(parsed.requiredVariables)).toBe(true)
    })

    it('outputs human-readable text when --json flag is not set', async () => {
      getBlueprintPath.mockReturnValue(fixtureBlueprint)
      const ctx = makeCtx()
      await info.call(ctx, 'example')
      expect(ctx.output).toContain('Blueprint: example')
      expect(ctx.output).toContain('Required variables:')
    })

    it('outputs JSON error when blueprint is not found and --json is set', async () => {
      getBlueprintPath.mockReturnValue(null)
      vi.spyOn(process.stderr, 'write').mockImplementation(() => {})
      const ctx = makeCtx(true)
      await info.call(ctx, 'ghost')
      const written = process.stderr.write.mock.calls[0][0]
      const parsed = JSON.parse(written)
      expect(parsed.error.code).toBe('BLUEPRINT_NOT_FOUND')
    })
  })
})
