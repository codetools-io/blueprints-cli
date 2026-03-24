import { describe, it, expect, vi } from 'vitest'
import path from 'path'
import fs from 'fs-extra'
import os from 'os'
import { fileURLToPath } from 'url'

// vi.mock is hoisted above imports by Vitest — must be top-level
vi.mock('../llm/createStructuredChatModel.mjs')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '../../..')
const mockBlueprintPath = path.join(projectRoot, '.blueprints/mockA')

describe('Blueprint.generateWithAI', () => {
  it('builds prompt from blueprint prompts and writes structured output files', async () => {
    const { createStructuredChatModel } = await import('../llm/createStructuredChatModel.mjs')
    const invokeMock = vi.fn()
    createStructuredChatModel.mockResolvedValue({ invoke: invokeMock })
    invokeMock.mockResolvedValueOnce({
      destination: 'ignored-by-writer',
      files: [{ path: 'ai-out.txt', content: 'from-mock-model' }],
    })

    const { default: Blueprint } = await import('./index.mjs')

    const dest = await fs.mkdtemp(path.join(os.tmpdir(), 'bp-ai-test-'))
    const blueprint = new Blueprint({
      name: 'mockA',
      location: mockBlueprintPath,
    })

    await blueprint.generateWithAI({
      destination: dest,
      data: {
        blueprint: 'mockA',
        blueprintInstance: 'inst',
      },
    })

    expect(invokeMock).toHaveBeenCalledTimes(1)
    const prompt = invokeMock.mock.calls[0][0]
    expect(prompt).toContain('template_variables')
    expect(prompt).toContain('templates')

    const written = await fs.readFile(path.join(dest, 'ai-out.txt'), 'utf8')
    expect(written).toBe('from-mock-model')
  })
})
