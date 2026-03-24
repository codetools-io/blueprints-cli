import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { createTmpDir, cleanupTmpDir } from '../../../test/helpers/tmpDir.mjs'
import Blueprint from './index.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const fixtureBlueprint = path.resolve(__dirname, '../../../test/fixtures/blueprints/example')

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
})
