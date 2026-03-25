import { describe, test, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getAbsolutePaths,
  getBlueprintPath,
  getMetadata,
  getObject,
  getRenderedValue,
  getParsedKeyValues,
  getTemplateArgs,
  getTemplateData,
  log,
  pipe,
  scaffold,
  setValue,
} from './utilities.mjs'

vi.mock('./config.mjs', async () => {
  const { fileURLToPath } = await import('url')
  const pathMod = await import('path')
  const testDir = fileURLToPath(new URL('..', import.meta.url))
  const fixturesPath = pathMod.default.resolve(testDir, 'test/fixtures')
  return {
    PROJECT_BLUEPRINTS_PATH: pathMod.default.resolve(fixturesPath, 'project-example/.blueprints'),
    GLOBAL_BLUEPRINTS_PATH: pathMod.default.resolve(fixturesPath, 'global-blueprints'),
  }
})
import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import { fileURLToPath } from 'url'
import { createTmpDir, cleanupTmpDir } from '../test/helpers/tmpDir.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

describe('Utilities', () => {
  describe('getAbsolutePaths', () => {
    test('can get absolute paths', async () => {
      const result = await getAbsolutePaths('test/*', {
        cwd: path.resolve(__dirname),
        expandDirectories: true,
      })

      expect(result[0]).toContain('app/test/example.txt')
    })
  })
  describe('getMetadata', () => {
    test('can get metadata', () => {
      const result = getMetadata({
        blueprint: 'Component',
        blueprintInstance: 'Button',
        destination: 'someLocation'
      })

      expect(result).toMatchSnapshot()
    })
  })
  describe('getObject', () => {
    test('can parse standard keys', () => {
      const result = getObject([['title', 'working']])

      expect(result).toEqual({ title: 'working' })
    })

    test('can parse property keys', () => {
      const result = getObject([['info.name', 'Cliff']])

      expect(result).toEqual({ info: { name: 'Cliff' } })
    })

    test('can parse array indexes', () => {
      const result = getObject([
        ['colors[0]', 'blue'],
        ['colors[1]', 'red'],
      ])

      expect(result).toEqual({ colors: ['blue', 'red'] })
    })
  })
  describe('getParsedKeyValues', () => {
    test('can parse key values', () => {
      const result = getParsedKeyValues(['something=working'])

      expect(result).toEqual([['something', 'working']])
    })
  })
  describe('getTemplateArgs', () => {
    test('can get template args', () => {
      const result = getTemplateArgs([
        '--global',
        '--check="working"',
        'title="working"',
        'toggleSomething',
        'description=yep',
      ])

      expect(result).toEqual([
        'title="working"',
        'toggleSomething',
        'description=yep',
      ])
    })
  })
  describe('getTemplateData', () => {
    test('can get data', () => {
      const result = getTemplateData(['title=working'])

      expect(result).toEqual({ title: 'working' })
    })
  })
  describe('log', () => {
    const original = console.error

    beforeEach(() => {
      console.error = vi.fn()
    })

    afterEach(() => {
      console.error = original
    })

    test('can log standard output', () => {
      log.clear()
      log.text('first')
      log.text('second')
      log.text('third')
      const result = log.output()

      expect(result).toMatchSnapshot()
    })

    test('can log warning output', () => {
      log.clear()
      log.warning('first warning')
      log.warning('second warning')
      log.warning('third warning')
      const result = log.output()

      expect(result).toMatchSnapshot()
    })

    test('can log error output', () => {
      log.error('first error')
      expect(console.error).toHaveBeenCalledTimes(1)
    })

    test('log.success renders ✅ prefix', () => {
      log.clear()
      log.success('done')
      expect(log.output()).toEqual('✅ done')
    })

    test('log.info renders ℹ️ prefix', () => {
      log.clear()
      log.info('info message')
      expect(log.output()).toEqual('ℹ️ info message')
    })

    test('log.clear resets output to empty string', () => {
      log.text('something')
      log.clear()
      expect(log.output()).toEqual('')
    })

    test('log.table renders object keys into output', () => {
      log.clear()
      log.table({ myKey: 'myValue' })
      expect(log.output()).toContain('myKey')
    })

    describe('JSON mode', () => {
      beforeEach(() => {
        log.clear()
        log.jsonMode = false
      })

      afterEach(() => {
        log.jsonMode = false
        log.clear()
      })

      test('log.json() stores payload and log.output() returns JSON string', () => {
        log.jsonMode = true
        log.json({ success: true, items: [1, 2] })
        const result = log.output()
        const parsed = JSON.parse(result)
        expect(parsed.success).toBe(true)
        expect(parsed.items).toEqual([1, 2])
      })

      test('log.output() returns text when jsonMode is false', () => {
        log.text('hello')
        const result = log.output()
        expect(result).toBe('hello')
      })

      test('log.clear() resets jsonPayload to null', () => {
        log.jsonMode = true
        log.json({ foo: 'bar' })
        log.clear()
        expect(log.jsonPayload).toBeNull()
      })

      test('log.clear() also resets text queue', () => {
        log.text('something')
        log.clear()
        expect(log.output()).toBe('')
      })

      test('log.error() writes JSON to stderr when jsonMode is true', () => {
        log.jsonMode = true
        vi.spyOn(process.stderr, 'write').mockImplementation(() => {})
        const err = new Error('something failed')
        log.error(err)
        const written = process.stderr.write.mock.calls[0][0]
        const parsed = JSON.parse(written)
        expect(parsed.error.message).toBe('something failed')
        expect(parsed.error.code).toBe('UNKNOWN_ERROR')
        process.stderr.write.mockRestore()
      })

      test('log.error() writes JSON with code when error has a code property', () => {
        log.jsonMode = true
        vi.spyOn(process.stderr, 'write').mockImplementation(() => {})
        const err = new Error('not found')
        err.code = 'BLUEPRINT_NOT_FOUND'
        log.error(err)
        const written = process.stderr.write.mock.calls[0][0]
        const parsed = JSON.parse(written)
        expect(parsed.error.code).toBe('BLUEPRINT_NOT_FOUND')
        process.stderr.write.mockRestore()
      })

      test('log.error() calls console.error when jsonMode is false', () => {
        log.error('text error')
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('text error'))
      })
    })
  })

  describe('pipe', () => {
    test('can pipe data through functions', () => {
      const data = ['red', 'white', 'blue']
      const capitalize = (args) => args.map((arg) => arg.toUpperCase())
      const appendUnderscore = (args) => args.map((arg) => `${arg}_`)
      const prependUnderscore = (args) => args.map((arg) => `_${arg}`)
      const result = pipe(data, capitalize, appendUnderscore, prependUnderscore)

      expect(result).toEqual(['_RED_', '_WHITE_', '_BLUE_'])
    })
  })

  describe('setValue', () => {
    test('can set value', () => {
      const result = setValue({}, 'levelOne', true)

      expect(result).toMatchInlineSnapshot(`
        {
          "levelOne": true,
        }
      `)
    })

    test('can set nested object value', () => {
      const result = setValue({}, 'levelOne.levelTwo', true)

      expect(result).toMatchInlineSnapshot(`
        {
          "levelOne": {
            "levelTwo": true,
          },
        }
      `)
    })

    test('can set array values', () => {
      const result = setValue(
        {
          levelOne: {
            levelTwo: ['correctValue', 'wrongValue'],
          },
        },
        'levelOne.levelTwo[1]',
        'correctValue'
      )

      expect(result).toMatchInlineSnapshot(`
        {
          "levelOne": {
            "levelTwo": [
              "correctValue",
              "correctValue",
            ],
          },
        }
      `)
    })

    test('initializes array when key does not exist yet', () => {
      const result = setValue({}, 'colors[0]', 'blue')
      expect(result).toEqual({ colors: ['blue'] })
    })

    test('appends to array when no index specified', () => {
      const result = setValue({ tags: ['a'] }, 'tags[]', 'b')
      expect(result.tags).toContain('b')
    })
  })

  describe('getRenderedValue', () => {
    test('can use static data types', () => {
      const template = 'This is a test called [name]. It will have a status of [status]. The [name] will result in a [outcome].'
      const data = {name: 'example test', status: "success", outcome: "passing test"}
      const matcherRegex = /\[(\w+)\]/g
      const result = getRenderedValue(template, data, matcherRegex)

      expect(result).toEqual('This is a test called example test. It will have a status of success. The example test will result in a passing test.')
    })
    test('can use function data types', () => {
      const template = 'This is a test called [name]. It will have a status of [status]. The [name] will result in a [outcome].'
      const data = {name: () => 'example test with functions', status: "success", outcome: "passing test"}
      const matcherRegex = /\[(\w+)\]/g
      const result = getRenderedValue(template, data, matcherRegex)

      expect(result).toEqual('This is a test called example test with functions. It will have a status of success. The example test with functions will result in a passing test.')
    })
    test('can remove unused template variables', () => {
      const template = 'This is a test called [name]'
      const data = {}
      const matcherRegex = /\[(\w+)\]/g
      const result = getRenderedValue(template, data, matcherRegex)

      expect(result).toEqual('This is a test called ')
    })
  })

  describe('scaffold', () => {
    let source
    let dest

    beforeEach(async () => {
      source = await createTmpDir('bp-scaffold-src-')
      dest = await createTmpDir('bp-scaffold-dst-')
    })

    afterEach(async () => {
      await cleanupTmpDir(source)
      await cleanupTmpDir(dest)
    })

    it('copies files from source to destination', async () => {
      await fs.outputFile(path.join(source, 'hello.txt'), 'world')
      await scaffold({ source, destination: dest })
      expect(await fs.pathExists(path.join(dest, 'hello.txt'))).toBe(true)
    })

    it('renders {{ templateVar }} in file content', async () => {
      await fs.outputFile(path.join(source, 'msg.txt'), 'Hello, {{ name }}!')
      await scaffold({ source, destination: dest, data: { name: 'Alice' } })
      const content = await fs.readFile(path.join(dest, 'msg.txt'), 'utf8')
      expect(content).toBe('Hello, Alice!')
    })

    it('renames __varName__ in filenames using data', async () => {
      await fs.outputFile(path.join(source, '__name__.txt'), 'content')
      await scaffold({ source, destination: dest, data: { name: 'Bob' } })
      expect(await fs.pathExists(path.join(dest, 'Bob.txt'))).toBe(true)
      expect(await fs.pathExists(path.join(dest, '__name__.txt'))).toBe(false)
    })

    it('creates destination directories that do not exist', async () => {
      await fs.outputFile(path.join(source, 'sub/file.txt'), 'hi')
      const deepDest = path.join(dest, 'new-dir')
      await scaffold({ source, destination: deepDest })
      expect(await fs.pathExists(path.join(deepDest, 'sub/file.txt'))).toBe(true)
    })

    it('returns empty results when source directory does not exist', async () => {
      const result = await scaffold({ source: '/nonexistent/source', destination: dest })
      expect(result.files).toEqual([])
      expect(result.templates).toEqual([])
    })

    it('simulate: returns rendered file objects without writing to disk', async () => {
      await fs.outputFile(path.join(source, '{{ name }}.txt'), 'Hello, {{ name }}!')
      const result = await scaffold({ source, destination: dest, data: { name: 'Alice' }, simulate: true })
      expect(result.simulated).toBe(true)
      expect(Array.isArray(result.files)).toBe(true)
      expect(result.files.length).toBeGreaterThan(0)
      result.files.forEach((f) => {
        expect(f).toHaveProperty('path')
        expect(f).toHaveProperty('content')
      })
      // No files should be written
      const destItems = await fs.readdir(dest)
      expect(destItems.length).toBe(0)
    })

    it('simulate: rendered content contains substituted values', async () => {
      await fs.outputFile(path.join(source, 'msg.txt'), 'Hello, {{ name }}!')
      const result = await scaffold({ source, destination: dest, data: { name: 'Bob' }, simulate: true })
      expect(result.files[0].content).toBe('Hello, Bob!')
    })

    it('simulate: does not affect normal scaffold behavior when simulate is false', async () => {
      await fs.outputFile(path.join(source, 'msg.txt'), 'Hello, {{ name }}!')
      await scaffold({ source, destination: dest, data: { name: 'Carol' }, simulate: false })
      expect(await fs.pathExists(path.join(dest, 'msg.txt'))).toBe(true)
    })
  })

  describe('getBlueprintPath', () => {
    it('returns project path when blueprint exists in project', () => {
      const result = getBlueprintPath('example')
      expect(result).toMatch(/project-example\/.blueprints\/example$/)
    })

    it('returns global path when blueprint only exists in global', () => {
      const result = getBlueprintPath('example-2')
      expect(result).toMatch(/global-blueprints\/example-2$/)
    })

    it('returns null or undefined when blueprint is not found', () => {
      const result = getBlueprintPath('this-does-not-exist-at-all')
      expect(result == null).toBe(true)
    })
  })
})
