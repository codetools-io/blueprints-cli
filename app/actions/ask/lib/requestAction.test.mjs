import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../lib/llm/modelsConfig.mjs', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    loadMergedModelRegistry: vi.fn().mockResolvedValue({
      entries: [{ id: 'gpt-4o-mini', provider: 'openai', model: 'gpt-4o-mini', temperature: 0 }],
      defaultModelId: 'gpt-4o-mini',
    }),
  }
})

vi.mock('../../../lib/llm/createStructuredChatModel.mjs', () => ({
  createStructuredChatModel: vi.fn(),
}))

import requestAction from './requestAction.mjs'
import { loadMergedModelRegistry } from '../../../lib/llm/modelsConfig.mjs'
import { createStructuredChatModel } from '../../../lib/llm/createStructuredChatModel.mjs'

describe('requestAction', () => {
  let invokeMock

  beforeEach(() => {
    invokeMock = vi.fn().mockResolvedValue({
      files: [{ path: 'out.txt', content: 'AI result' }],
    })
    createStructuredChatModel.mockResolvedValue({ invoke: invokeMock })
  })

  it('calls loadMergedModelRegistry and createStructuredChatModel', async () => {
    await requestAction({ action: 'do something', files: 'file content', modelId: 'gpt-4o-mini' })
    expect(loadMergedModelRegistry).toHaveBeenCalled()
    expect(createStructuredChatModel).toHaveBeenCalled()
  })

  it('invokes the structured model with the formatted prompt', async () => {
    await requestAction({ action: 'transform this', files: 'src code', modelId: 'gpt-4o-mini' })
    expect(invokeMock).toHaveBeenCalledWith(expect.stringContaining('transform this'))
  })

  it('includes files in the formatted prompt', async () => {
    await requestAction({ action: 'do', files: 'my source', modelId: 'gpt-4o-mini' })
    expect(invokeMock).toHaveBeenCalledWith(expect.stringContaining('my source'))
  })

  it('returns the model result', async () => {
    const result = await requestAction({ action: 'do', files: 'content', modelId: 'gpt-4o-mini' })
    expect(result).toEqual({ files: [{ path: 'out.txt', content: 'AI result' }] })
  })

  it('overrides temperature on spec when temperature prop is provided', async () => {
    await requestAction({ action: 'do', files: 'f', modelId: 'gpt-4o-mini', temperature: 0.8 })
    expect(createStructuredChatModel).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0.8 }),
      expect.anything()
    )
  })

  it('does not override temperature when temperature prop is omitted', async () => {
    await requestAction({ action: 'do', files: 'f', modelId: 'gpt-4o-mini' })
    expect(createStructuredChatModel).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0 }),
      expect.anything()
    )
  })

  it('uses default model when no modelId provided', async () => {
    await requestAction({ action: 'do', files: 'f' })
    expect(createStructuredChatModel).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'openai', model: 'gpt-4o-mini' }),
      expect.anything()
    )
  })

  it('throws and logs error when model invocation fails', async () => {
    invokeMock.mockRejectedValue(new Error('API failure'))
    await expect(
      requestAction({ action: 'do', files: 'f', modelId: 'gpt-4o-mini' })
    ).rejects.toThrow('API failure')
  })
})
