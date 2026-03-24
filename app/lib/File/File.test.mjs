import { describe, test, expect, afterEach } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import File from './File.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const newFilepath = path.resolve(__dirname, './test/example2.txt')

afterEach(async () => {
  await fs.remove(newFilepath).catch(() => {})
})

describe('File', () => {
  test('can be initialized', () => {
    const filepath = path.resolve(__dirname, './test/example.txt')
    const file = new File(filepath)

    expect(file).toBeInstanceOf(File)
  })

  test('can register operations', () => {
    const operation = () => 'Cliff'
    const filepath = path.resolve(__dirname, './test/example.txt')
    const file = new File(filepath)
    file.registerOperation(operation)

    expect(file.operations[0].fn).toEqual(operation)
  })

  test('can apply operations', async () => {
    const filepath = path.resolve(__dirname, './test/example.txt')
    const file = new File(filepath)
    file.registerOperation(() => 'Applied the operation')
    await file.apply()

    expect(file.content).toEqual('Applied the operation')
  })

  test('can append text', async () => {
    const filepath = path.resolve(__dirname, './test/example.txt')
    const file = new File(filepath)
    await file.appendText('show after').apply()

    expect(file.content.endsWith('show after')).toBeTruthy()
  })

  test('can prepend text', async () => {
    const filepath = path.resolve(__dirname, './test/example.txt')
    const file = new File(filepath)
    await file.prependText('show before').apply()

    expect(file.content.startsWith('show before')).toBeTruthy()
  })

  test('can ensure text', async () => {
    const filepath = path.resolve(__dirname, './test/example.txt')
    const file = new File(filepath)
    await file.ensureText('new text').apply()

    expect(file.content.match(/new text/g)).toEqual(['new text'])
  })

  test('ensureText does not duplicate text that already exists', async () => {
    const filepath = path.resolve(__dirname, './test/example.txt')
    const file = new File(filepath)
    file.content = Promise.resolve('existing text')
    await file.ensureText('existing text').apply()

    expect(file.content.match(/existing text/g)).toEqual(['existing text'])
  })

  test('can replace text', async () => {
    const filepath = path.resolve(__dirname, './test/example.txt')
    const file = new File(filepath)
    await file
      .ensureText('Hello, World!')
      .replaceText('World', 'Tester')
      .apply()

    expect(file.content).toContain('Hello, Tester!')
  })

  test('can save changes', async () => {
    const filepath = path.resolve(__dirname, './test/example.txt')
    const newFilepath = path.resolve(__dirname, './test/example2.txt')
    const file = new File(filepath)
    file.content = 'Hello, World!'
    file.path = newFilepath
    await file.save()

    const newFile = new File(newFilepath)
    const newFileContent = await newFile.content
    expect(newFileContent).toEqual('Hello, World!')
  })
})
