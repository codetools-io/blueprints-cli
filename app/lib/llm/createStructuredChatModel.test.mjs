import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn(),
}))
vi.mock('@langchain/anthropic', () => ({
  ChatAnthropic: vi.fn(),
}))
vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn(),
}))

import { createStructuredChatModel } from './createStructuredChatModel.mjs'
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'

const schema = z.object({ text: z.string() })

function makeWithStructuredOutput() {
  const fakeModel = { invoke: vi.fn() }
  const withStructuredOutput = vi.fn().mockReturnValue(fakeModel)
  return { fakeModel, withStructuredOutput }
}

// Use regular functions (not arrow functions) so vi.fn() constructors work with `new`
function setupOpenAIMock(ws) {
  ChatOpenAI.mockImplementation(function () {
    this.withStructuredOutput = ws
  })
}
function setupAnthropicMock(ws) {
  ChatAnthropic.mockImplementation(function () {
    this.withStructuredOutput = ws
  })
}
function setupGoogleMock(ws) {
  ChatGoogleGenerativeAI.mockImplementation(function () {
    this.withStructuredOutput = ws
  })
}

beforeEach(() => {
  const { withStructuredOutput: ows } = makeWithStructuredOutput()
  const { withStructuredOutput: aws } = makeWithStructuredOutput()
  const { withStructuredOutput: gws } = makeWithStructuredOutput()
  setupOpenAIMock(ows)
  setupAnthropicMock(aws)
  setupGoogleMock(gws)
})

describe('createStructuredChatModel', () => {
  it('creates an OpenAI model for provider "openai"', async () => {
    await createStructuredChatModel({ provider: 'openai', model: 'gpt-4o-mini', temperature: 0.5 }, schema)
    expect(ChatOpenAI).toHaveBeenCalledWith({ model: 'gpt-4o-mini', temperature: 0.5, maxTokens: undefined })
  })

  it('creates an Anthropic model for provider "anthropic"', async () => {
    await createStructuredChatModel({ provider: 'anthropic', model: 'claude-haiku', temperature: 0 }, schema)
    expect(ChatAnthropic).toHaveBeenCalledWith({ model: 'claude-haiku', temperature: 0, maxTokens: undefined })
  })

  it('creates a Google model for provider "google"', async () => {
    await createStructuredChatModel({ provider: 'google', model: 'gemini-flash', temperature: 0 }, schema)
    expect(ChatGoogleGenerativeAI).toHaveBeenCalledWith({ model: 'gemini-flash', temperature: 0, maxOutputTokens: undefined })
  })

  it('passes maxTokens as maxTokens for openai', async () => {
    await createStructuredChatModel({ provider: 'openai', model: 'gpt-4o', maxTokens: 1000 }, schema)
    expect(ChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({ maxTokens: 1000 }))
  })

  it('passes maxTokens as maxTokens for anthropic', async () => {
    await createStructuredChatModel({ provider: 'anthropic', model: 'claude-haiku', maxTokens: 500 }, schema)
    expect(ChatAnthropic).toHaveBeenCalledWith(expect.objectContaining({ maxTokens: 500 }))
  })

  it('passes maxTokens as maxOutputTokens for google', async () => {
    await createStructuredChatModel({ provider: 'google', model: 'gemini-flash', maxTokens: 800 }, schema)
    expect(ChatGoogleGenerativeAI).toHaveBeenCalledWith(expect.objectContaining({ maxOutputTokens: 800 }))
  })

  it('defaults temperature to 0 when not specified', async () => {
    await createStructuredChatModel({ provider: 'openai', model: 'gpt-4o-mini' }, schema)
    expect(ChatOpenAI).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0 }))
  })

  it('throws for an unsupported provider', async () => {
    await expect(
      createStructuredChatModel({ provider: 'cohere', model: 'command-r' }, schema)
    ).rejects.toThrow('Unsupported model provider')
  })

  it('calls withStructuredOutput with the provided schema', async () => {
    const { withStructuredOutput } = makeWithStructuredOutput()
    setupOpenAIMock(withStructuredOutput)
    await createStructuredChatModel({ provider: 'openai', model: 'gpt-4o-mini' }, schema)
    expect(withStructuredOutput).toHaveBeenCalledWith(schema)
  })

  it('returns the structured output model', async () => {
    const { fakeModel, withStructuredOutput } = makeWithStructuredOutput()
    setupOpenAIMock(withStructuredOutput)
    const result = await createStructuredChatModel({ provider: 'openai', model: 'gpt-4o-mini' }, schema)
    expect(result).toBe(fakeModel)
  })
})
