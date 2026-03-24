import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { createTmpDir, cleanupTmpDir } from '../../../test/helpers/tmpDir.mjs'
import Blueprint from './index.mjs'
import { log } from '../../utilities.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const fixtureBlueprint = path.resolve(__dirname, '../../../test/fixtures/blueprints/example')
const mockALocation = path.resolve(__dirname, '../../../.blueprints/mockA')
const mockPromptPath = path.resolve(mockALocation, 'prompts/default.md')

describe('Blueprint', () => {
  describe('constructor', () => {
    it('sets name, location, and filesPath', () => {
      const bp = new Blueprint({ name: 'test', location: '/some/path' })
      expect(bp.name).toBe('test')
      expect(bp.location).toBe('/some/path')
      expect(bp.filesPath).toBe('/some/path/files')
    })

    it('initializes config with empty hooks', () => {
      const bp = new Blueprint({ name: 'test', location: '/some/path' })
      expect(bp.config.preGenerate).toEqual([])
      expect(bp.config.postGenerate).toEqual([])
    })
  })

  describe('loadConfigFile', () => {
    it('loads and merges blueprint.json', async () => {
      const bp = new Blueprint({ name: 'example', location: fixtureBlueprint })
      await bp.loadConfigFile()
      expect(bp.config.postGenerate).toEqual(['touch <destination>/didit.txt'])
    })

    it('throws when blueprint.json is missing', async () => {
      const bp = new Blueprint({ name: 'ghost', location: '/nonexistent/path' })
      await expect(bp.loadConfigFile()).rejects.toThrow('Blueprint config not found')
    })
  })

  describe('loadFilesContent', () => {
    it('reads all files under filesPath into a keyed object', async () => {
      const bp = new Blueprint({ name: 'example', location: fixtureBlueprint })
      await bp.loadFilesContent()
      const keys = Object.keys(bp.filesContent)
      expect(keys.some((k) => k.includes('__name__.txt'))).toBe(true)
    })

    it('stores file content under the relative path key', async () => {
      const bp = new Blueprint({ name: 'example', location: fixtureBlueprint })
      await bp.loadFilesContent()
      const content = bp.filesContent['users/__name__.txt']
      expect(content).toContain('{{name}}')
    })
  })

  describe('generateWithScaffold', () => {
    let dest

    beforeEach(async () => {
      dest = await createTmpDir('bp-scaffold-test-')
    })

    afterEach(async () => {
      await cleanupTmpDir(dest)
    })

    it('throws when no destination is given', async () => {
      const bp = new Blueprint({ name: 'example', location: fixtureBlueprint })
      await expect(bp.generateWithScaffold({})).rejects.toThrow('no destination given')
    })

    it('throws when filesPath does not exist', async () => {
      const bp = new Blueprint({ name: 'ghost', location: '/nonexistent' })
      await expect(bp.generateWithScaffold({ destination: dest })).rejects.toThrow(
        'blueprint does not exist'
      )
    })

    it('generates files at the destination', async () => {
      const bp = new Blueprint({ name: 'example', location: fixtureBlueprint })
      await bp.generateWithScaffold({ destination: dest, data: { name: 'Alice' } })
      const generatedFile = path.join(dest, 'users/Alice.txt')
      expect(await fs.pathExists(generatedFile)).toBe(true)
    })

    it('replaces __name__ filename variable with data value', async () => {
      const bp = new Blueprint({ name: 'example', location: fixtureBlueprint })
      await bp.generateWithScaffold({ destination: dest, data: { name: 'Bob' } })
      expect(await fs.pathExists(path.join(dest, 'users/Bob.txt'))).toBe(true)
      expect(await fs.pathExists(path.join(dest, 'users/__name__.txt'))).toBe(false)
    })

    it('renders {{name}} content variable', async () => {
      const bp = new Blueprint({ name: 'example', location: fixtureBlueprint })
      await bp.generateWithScaffold({ destination: dest, data: { name: 'Alice' } })
      const content = await fs.readFile(path.join(dest, 'users/Alice.txt'), 'utf8')
      expect(content).toContain('Hello, Alice!')
    })

    it('returns { type, location, data }', async () => {
      const bp = new Blueprint({ name: 'example', location: fixtureBlueprint })
      const result = await bp.generateWithScaffold({ destination: dest, data: { name: 'Bob' } })
      expect(result).toMatchObject({ type: 'example', location: dest })
    })
  })

  describe('remove', () => {
    let tmpBpPath

    beforeEach(async () => {
      tmpBpPath = await createTmpDir('bp-remove-test-')
    })

    afterEach(async () => {
      // May already be removed by the test
      await fs.remove(tmpBpPath).catch(() => {})
    })

    it('removes the blueprint directory', async () => {
      const bp = new Blueprint({ name: 'temp', location: tmpBpPath })
      await bp.remove()
      expect(await fs.pathExists(tmpBpPath)).toBe(false)
    })

    it('throws when no name is specified', () => {
      const bp = new Blueprint({ location: '/some/path' })
      expect(() => bp.remove()).toThrow('No name specified')
    })

    it('throws when location is a file instead of a directory', async () => {
      const filePath = path.join(tmpBpPath, 'not-a-dir.txt')
      await fs.outputFile(filePath, 'content')
      const bp = new Blueprint({ name: 'test', location: filePath })
      expect(() => bp.remove()).toThrow('Blueprint not found')
    })
  })

  describe('generate', () => {
    it('throws for invalid mode', async () => {
      const bp = new Blueprint({ name: 'example', location: fixtureBlueprint })
      await expect(
        bp.generate({ destination: '/tmp', data: {}, mode: 'invalid' })
      ).rejects.toThrow('Invalid generate mode')
    })
  })

  describe('executeHook', () => {
    let dest

    beforeEach(async () => {
      dest = await createTmpDir('bp-hook-test-')
      log.clear()
    })

    afterEach(async () => {
      await cleanupTmpDir(dest)
      vi.restoreAllMocks()
    })

    it('runs preGenerate scripts and logs success', async () => {
      const bp = new Blueprint({ name: 'mockA', location: mockALocation })
      await bp.loadConfigFile()
      const spy = vi.spyOn(log, 'success')
      await bp.executeHook({ name: 'preGenerate', destination: dest, data: { blueprint: 'mockA', blueprintInstance: 'Test' } })
      expect(spy).toHaveBeenCalledWith('executed preGenerate hook')
    })

    it('runs postGenerate scripts and logs success', async () => {
      const bp = new Blueprint({ name: 'mockA', location: mockALocation })
      await bp.loadConfigFile()
      const spy = vi.spyOn(log, 'success')
      await bp.executeHook({ name: 'postGenerate', destination: dest, data: { blueprint: 'mockA', blueprintInstance: 'Test' } })
      expect(spy).toHaveBeenCalledWith('executed postGenerate hook')
    })

    it('handles empty hooks array without error', async () => {
      const bp = new Blueprint({ name: 'example', location: fixtureBlueprint })
      bp.config.preGenerate = []
      const spy = vi.spyOn(log, 'success')
      await expect(bp.executeHook({ name: 'preGenerate', destination: dest, data: {} })).resolves.not.toThrow()
      expect(spy).toHaveBeenCalledWith('executed preGenerate hook')
    })
  })

  describe('preGenerate', () => {
    let dest

    beforeEach(async () => {
      dest = await createTmpDir('bp-pre-test-')
    })

    afterEach(async () => {
      await cleanupTmpDir(dest)
      vi.restoreAllMocks()
    })

    it('delegates to executeHook with name preGenerate', async () => {
      const bp = new Blueprint({ name: 'mockA', location: mockALocation })
      await bp.loadConfigFile()
      const spy = vi.spyOn(bp, 'executeHook')
      await bp.preGenerate({ destination: dest, data: { blueprint: 'mockA', blueprintInstance: 'T' } })
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ name: 'preGenerate', destination: dest }))
    })
  })

  describe('postGenerate', () => {
    let dest

    beforeEach(async () => {
      dest = await createTmpDir('bp-post-test-')
    })

    afterEach(async () => {
      await cleanupTmpDir(dest)
      vi.restoreAllMocks()
    })

    it('delegates to executeHook with name postGenerate', async () => {
      const bp = new Blueprint({ name: 'mockA', location: mockALocation })
      await bp.loadConfigFile()
      const spy = vi.spyOn(bp, 'executeHook')
      await bp.postGenerate({ destination: dest, data: { blueprint: 'mockA', blueprintInstance: 'T' } })
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ name: 'postGenerate', destination: dest }))
    })
  })

  describe('loadPromptFile', () => {
    let dest

    beforeEach(async () => {
      dest = await createTmpDir('bp-prompt-test-')
    })

    afterEach(async () => {
      await cleanupTmpDir(dest)
    })

    it('parses frontmatter and body from a file with --- delimiters', async () => {
      const bp = new Blueprint({ name: 'mockA', location: mockALocation })
      const result = await bp.loadPromptFile(mockPromptPath)
      expect(result.meta).toHaveProperty('input_variables')
      expect(Array.isArray(result.meta.input_variables)).toBe(true)
      expect(typeof result.template).toBe('string')
      expect(result.template.length).toBeGreaterThan(0)
    })

    it('pushes parsed prompt onto this.prompts', async () => {
      const bp = new Blueprint({ name: 'mockA', location: mockALocation })
      await bp.loadPromptFile(mockPromptPath)
      expect(bp.prompts).toHaveLength(1)
    })

    it('does not push to this.prompts when there is no frontmatter', async () => {
      const tmpFile = path.join(dest, 'no-frontmatter.md')
      await fs.outputFile(tmpFile, 'Just plain content without frontmatter')
      const bp = new Blueprint({ name: 'test', location: dest })
      const result = await bp.loadPromptFile(tmpFile)
      expect(bp.prompts).toHaveLength(0)
      expect(result.meta).toEqual({})
      expect(result.template).toBe('Just plain content without frontmatter')
    })
  })

  describe('loadPrompts', () => {
    it('loads all prompt files listed in config.prompts', async () => {
      const bp = new Blueprint({ name: 'mockA', location: mockALocation })
      await bp.loadConfigFile()
      await bp.loadPrompts()
      expect(bp.prompts).toHaveLength(1)
      expect(typeof bp.prompts[0].template).toBe('string')
      expect(bp.prompts[0].template.length).toBeGreaterThan(0)
    })

    it('throws when a prompt file does not exist', async () => {
      const bp = new Blueprint({ name: 'mockA', location: mockALocation })
      await bp.loadConfigFile()
      bp.config.prompts = ['prompts/nonexistent.md']
      await expect(bp.loadPrompts()).rejects.toThrow()
    })
  })
})
